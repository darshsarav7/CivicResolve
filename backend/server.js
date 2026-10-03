const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '8mb' }));

const districts = ['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvarur','Tiruvannamalai','Vellore','Viluppuram','Virudhunagar','Kanyakumari'];
const deptMap={Water:'Water Resources',Sanitation:'Sanitation & Solid Waste',Road:'Highways & Roads',Drainage:'Municipal Drainage',Electricity:'Electricity Board',Other:'General Services'};
const users=[
 {id:'U1001',name:'Citizen Demo',email:'citizen@civicresolve.com',password:'123456',role:'citizen'},
 {id:'U2001',name:'Department Officer',email:'admin@civicresolve.com',password:'123456',role:'department',department:'General Services'}
];
let complaints=[
 {id:'CR-1001',caseId:'CASE-A12F',category:'Water',description:'Water leakage near the main road',district:'Viluppuram',area:'Gandhi Nagar',location:'Viluppuram, Gandhi Nagar',priority:'High',status:'In Progress',date:'2026-10-02',department:'Water Resources',lat:11.9401,lon:79.4861,reason:['High severity','Public road location','Water category'],citizen:'U1001'},
 {id:'CR-1002',caseId:'CASE-B91C',category:'Sanitation',description:'Garbage not collected for 3 days',district:'Viluppuram',area:'Bus Stand',location:'Viluppuram, Bus Stand',priority:'Critical',status:'In Progress',date:'2026-10-01',department:'Sanitation & Solid Waste',lat:11.9410,lon:79.4855,reason:['Critical severity','Repeated civic issue'],citizen:'U1001'},
 {id:'CR-1003',caseId:null,category:'Road',description:'Pothole on the main road near college',district:'Chennai',area:'Anna Nagar',location:'Chennai, Anna Nagar',priority:'Medium',status:'Resolved',date:'2026-09-30',department:'Highways & Roads',lat:13.0850,lon:80.2101,reason:['Medium severity','Road category'],citizen:'U1001'},
 {id:'CR-1004',caseId:null,category:'Drainage',description:'Drain overflowing during rain',district:'Coimbatore',area:'Gandhipuram',location:'Coimbatore, Gandhipuram',priority:'High',status:'Resolved',date:'2026-09-29',department:'Municipal Drainage',lat:11.0183,lon:76.9725,reason:['Overflow keyword','Drainage category'],citizen:'U1001'},
 {id:'CR-1005',caseId:null,category:'Electricity',description:'Street light not working near park',district:'Madurai',area:'KK Nagar',location:'Madurai, KK Nagar',priority:'Low',status:'Resolved',date:'2026-09-28',department:'Electricity Board',lat:9.9252,lon:78.1198,reason:['Low severity','Electricity category'],citizen:'U1001'}
];
let notifications=[
 {id:'N1',userId:'U1001',title:'Complaint CR-1001 is in progress',text:'Water Resources has started work on your complaint.',read:false,date:'Today'},
 {id:'N2',userId:'U1001',title:'Complaint CR-1003 resolved',text:'Your complaint has been resolved. You can provide feedback.',read:false,date:'Yesterday'},
 {id:'N3',userId:'U1001',title:'Complaint CR-1002 routed',text:'Your sanitation complaint was assigned to the concerned department.',read:true,date:'Yesterday'}
];
let feedback=[]; let appeals=[];
const id=prefix=>`${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const classify=(text='')=>{const t=text.toLowerCase(); if(/garbage|waste|trash|sanitation|குப்பை/.test(t))return 'Sanitation'; if(/water|leak|pipe|drinking|தண்ணீர்/.test(t))return 'Water'; if(/pothole|road|street|bridge|சாலை/.test(t))return 'Road'; if(/drain|sewage|overflow|வடிகால்/.test(t))return 'Drainage'; if(/light|electric|power|மின்சாரம்/.test(t))return 'Electricity'; return 'Other'};
const priority=(severity,text,related=0)=>{let n={Low:1,Medium:2,High:3,Critical:4}[severity]||2; if(/danger|accident|fire|overflow|open wire|urgent|critical/i.test(text))n=Math.max(n,3); if(related>=1)n=Math.max(n,3); return ['Low','Medium','High','Critical'][n-1]};
const words=t=>new Set(String(t).toLowerCase().split(/\W+/).filter(w=>w.length>2));
const similarity=(a,b)=>{const A=words(a),B=words(b);let i=0;for(const w of A)if(B.has(w))i++;return i/Math.max(1,Math.min(A.size,B.size))};
const reasonFor=(p,c,related)=>[p==='Critical'?'Critical severity':p==='High'?'High severity':`${p} severity`,related?'Similar complaints found':'No strong duplicate found',c.category+' category',c.district?'Location provided':'Location pending'];
app.get('/api/health',(req,res)=>res.json({ok:true,service:'CivicResolve API'}));
app.get('/api/districts',(req,res)=>res.json(districts));
app.post('/api/auth/login',(req,res)=>{const u=users.find(x=>x.email.toLowerCase()===String(req.body.email||'').toLowerCase()&&x.password===req.body.password); if(!u)return res.status(401).json({error:'Invalid email or password'}); const {password,...safe}=u;res.json({user:safe,token:'demo-'+u.id});});
app.post('/api/auth/register',(req,res)=>{const {name,email,password,role='citizen'}=req.body;if(!name||!email||!password)return res.status(400).json({error:'Name, email and password are required'});if(users.some(u=>u.email.toLowerCase()===email.toLowerCase()))return res.status(409).json({error:'Email already registered'});const u={id:id('U'),name,email,password,role};users.push(u);const {password:p,...safe}=u;res.status(201).json({user:safe,token:'demo-'+u.id});});
app.get('/api/complaints',(req,res)=>{const role=req.query.role;const userId=req.query.userId;let out=complaints;if(role==='citizen'&&userId)out=out.filter(c=>c.citizen===userId);res.json(out)});
app.post('/api/complaints',(req,res)=>{const b=req.body||{};if(!b.description?.trim())return res.status(400).json({error:'Description is required'});const category=b.category&&b.category!=='Auto Detect'?b.category:classify(b.description);const similar=complaints.filter(x=>x.category===category&&x.district===b.district&&similarity(x.description,b.description)>0.55);const caseId=similar[0]?.caseId||id('CASE');const p=priority(b.severity,b.description,similar.length);const c={id:id('CR'),caseId,category,description:b.description.trim(),district:b.district||'Tamil Nadu',area:b.area||'',location:[b.district,b.area].filter(Boolean).join(', '),priority:p,status:'Submitted',date:new Date().toISOString().slice(0,10),department:deptMap[category]||deptMap.Other,reason:reasonFor(p,{category,district:b.district},similar.length),citizen:b.citizen||'U1001',lat:Number(b.lat)||null,lon:Number(b.lon)||null,imageName:b.imageName||null,imageData:b.imageData||null,voiceText:b.voiceText||null};complaints.unshift(c);notifications.unshift({id:id('N'),userId:c.citizen,title:`Complaint ${c.id} submitted`,text:`Routed to ${c.department}. Priority: ${c.priority}. Case ID: ${c.caseId}.`,read:false,date:'Just now'});res.status(201).json(c)});
app.patch('/api/complaints/:id',(req,res)=>{const c=complaints.find(x=>x.id===req.params.id);if(!c)return res.status(404).json({error:'Not found'});const old=c.status;Object.assign(c,req.body);if(c.status&&c.status!==old){notifications.unshift({id:id('N'),userId:c.citizen,title:`${c.id} status updated`,text:`Your complaint is now ${c.status}.`,read:false,date:'Just now'});}res.json(c)});
app.get('/api/notifications',(req,res)=>res.json(notifications.filter(n=>!req.query.userId||n.userId===req.query.userId)));
app.patch('/api/notifications/:id/read',(req,res)=>{const n=notifications.find(x=>x.id===req.params.id);if(!n)return res.status(404).json({error:'Not found'});n.read=true;res.json(n)});
app.post('/api/feedback',(req,res)=>{const x={id:id('FB'),...req.body,date:new Date().toISOString().slice(0,10)};feedback.push(x);res.status(201).json(x)});
app.get('/api/feedback',(req,res)=>res.json(feedback));
app.post('/api/appeals',(req,res)=>{const x={id:id('AP'),...req.body,status:'Submitted',date:new Date().toISOString().slice(0,10)};appeals.push(x);notifications.unshift({id:id('N'),userId:x.userId,title:`Appeal ${x.id} submitted`,text:'Your appeal has been received for department review.',read:false,date:'Just now'});res.status(201).json(x)});
app.get('/api/appeals',(req,res)=>res.json(appeals));
app.get('/api/analytics',(req,res)=>{const by=(k)=>complaints.reduce((o,c)=>(o[c[k]]=(o[c[k]]||0)+1,o),{});const coords=complaints.filter(c=>c.lat&&c.lon);const hotspots=[];coords.forEach(c=>{const count=coords.filter(d=>Math.hypot((d.lat-c.lat)*111,(d.lon-c.lon)*103)>=0&&Math.hypot((d.lat-c.lat)*111,(d.lon-c.lon)*103)<2).length;if(count>=2&&!hotspots.find(h=>h.district===c.district))hotspots.push({district:c.district,count})});res.json({total:complaints.length,status:by('status'),category:by('category'),priority:by('priority'),department:by('department'),hotspots})});
app.listen(process.env.PORT||5000,()=>console.log(`CivicResolve backend running on ${process.env.PORT||5000}`));
