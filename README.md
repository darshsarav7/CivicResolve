# CivicResolve – working demo build

This build turns the original prototype into a report-aligned working demonstration: role-based login/register, text/voice/image complaint input, Tamil Nadu district selection, optional browser geolocation, complaint IDs and Case IDs, rule-based AI-style understanding/priority/routing/explanations, related-case grouping, hotspot analytics, department status updates, notifications, feedback and a redesigned UI.

## Run locally

### Backend
```powershell
cd backend
npm install
npm start
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

For local frontend-to-backend communication the frontend falls back to `http://localhost:5000/api`.

## Render

### Backend Web Service
- Repository: `darshsarav7/CivicResolve`
- Branch: `master`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

After the backend becomes Live, copy its Render URL, for example `https://civicresolve-api.onrender.com`.

### Frontend Static Site
Set an environment variable:
`VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`
Then trigger a new deploy.

## Demo accounts
- Citizen: `citizen@civicresolve.com` / `123456`
- Department: `admin@civicresolve.com` / `123456`

## Important implementation note
The app is designed as a one-day demonstration build. Complaint persistence is in server memory, so restarting the backend resets demo data. The AI pipeline uses deterministic local heuristics for classification, duplicate grouping, priority, routing and hotspot summaries rather than a hosted LLM/SBERT/vision API. The browser Speech Recognition API is used for voice input, and uploaded images are attached to the complaint payload.
