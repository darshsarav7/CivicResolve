from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN
from math import radians,sin,cos,sqrt,atan2

app=FastAPI(title='CivicResolve AI Service')
model=SentenceTransformer('all-MiniLM-L6-v2')
class SimilarityRequest(BaseModel): text1:str; text2:str
class LocationsRequest(BaseModel): locations:list[list[float]]
@app.get('/health')
def health(): return {'ok':True}
@app.post('/similarity')
def similarity(x:SimilarityRequest):
 e=model.encode([x.text1,x.text2]); return {'score':float(cosine_similarity([e[0]],[e[1]])[0][0])}
@app.post('/hotspots')
def hotspots(x:LocationsRequest):
 labels=DBSCAN(eps=0.01,min_samples=3).fit_predict(x.locations).tolist(); return {'labels':labels}
def haversine(a,b,c,d):
 R=6371; dlat=radians(c-a);dlon=radians(d-b);z=sin(dlat/2)**2+cos(radians(a))*cos(radians(c))*sin(dlon/2)**2;return R*2*atan2(sqrt(z),sqrt(1-z))
@app.get('/distance')
def distance(lat1:float,lon1:float,lat2:float,lon2:float): return {'km':haversine(lat1,lon1,lat2,lon2)}
