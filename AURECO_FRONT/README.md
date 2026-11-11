# Africa University Student Portfolio & Recommendation Frontend

Production-ready frontend for Africa University Student Portfolio System, configured for deployment on **Vercel**.

## Features
- **Student Portfolio**: Complete profile, certified grades & GPA charts, projects showcase, extracurriculars, and leadership roles.
- **Academic Recommendation Engine**: Student request workflow with Gemini AI assistant for faculty drafting.
- **Multi-Role Portal**: Seamless interface for Students, Faculty/Lecturers, Industry Supervisors, and Registry Administrators.
- **Production Architecture**: Powered by a Node.js/Express backend on Render and Neon Serverless PostgreSQL.

## Local Development
Serve the root directory with any web server:
```bash
npx serve .
# or
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

## Deployment to Vercel
1. Push this repository to GitHub: `https://github.com/mushayapokuvakat-ai/AURECO_FRONT`
2. In Vercel, import the repository as a new project.
3. Framework Preset: **Other** (Static HTML/JS/CSS).
4. Root Directory: `./`
5. Click **Deploy**. Vercel will instantly publish the application using `vercel.json`.

## Backend Connection
The frontend connects to the backend configured in `js/config.js`. When running locally on `localhost`, it automatically targets `http://localhost:5000`. In production, it targets the Render backend URL.
