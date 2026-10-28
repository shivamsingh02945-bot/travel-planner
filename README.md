# Roamly — Personalized Travel Itinerary Planner

A responsive full-stack travel planner built from the project outline in the supplied screenshot. It includes a React/Vite frontend and an Express backend. It runs locally without paid APIs or API keys.

# Live Demo :
- Live Website: https://travel-planner-eight-khaki.vercel.app
- Backend API: https://roamly-backend-zc79.onrender.com
- Demo video: https://drive.google.com/file/d/1YnM3kNN96edzYZq390xNn3U_wqm3OI6R/view?usp=drive_link

## Features

- Personalized destination matching from interests, budget, travel style and companions
- Day-by-day itinerary generation (1–14 days)
- Estimated budget with a category breakdown (INR)
- Save and delete trips using a backend JSON data store
- Export itinerary as a `.txt` file
- Responsive desktop and mobile layout
- API health status, request validation and helpful error messages
- Curated starter destinations across India

> Important: recommendations, itinerary content and budgets are rule-based demo data, not live AI output, live route optimization, live ticket prices or booking availability. Before booking, verify opening hours, transport, weather and prices independently.

## Requirements

- Node.js 20 or newer recommended (Node.js 18+ should also work)
- npm
- Internet for the first install only (to download packages)

## Run locally — exact steps

1. Download and unzip this project.
2. Install Node.js LTS from https://nodejs.org/ if it is not installed.
3. Open the unzipped `travel-planner` folder in VS Code.
4. Open **Terminal → New Terminal**.
5. Install the backend packages:

   ```bash
   cd server
   npm install
   ```

6. Start the backend in that terminal:

   ```bash
   npm run dev
   ```

   It should print `Travel Planner API running at http://localhost:4000`.

7. Open a **second** terminal in VS Code. From the project root, run:

   ```bash
   cd client
   npm install
   npm run dev
   ```

8. Open the local URL Vite prints, normally http://localhost:5173.
9. Keep both terminals running while using the app. The frontend uses `http://localhost:4000/api` by default.

### Quick backend check

Open http://localhost:4000/api/health. You should see a JSON response with `"status":"ok"`.

## Project structure

```text
travel-planner/
├── client/
│   ├── src/main.jsx       # React UI and app behavior
│   ├── src/styles.css     # Responsive styling
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── server/
│   ├── data/destinations.js
│   ├── data/trips.json    # Created when trips are saved
│   ├── index.js           # REST API and itinerary logic
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/destinations` | List destination catalogue |
| POST | `/api/recommendations` | Recommend destinations from preferences |
| POST | `/api/itinerary` | Generate a daily itinerary |
| GET | `/api/trips` | List saved trips |
| POST | `/api/trips` | Save a generated trip |
| DELETE | `/api/trips/:id` | Delete a saved trip |

Example request to generate an itinerary:

```json
{
  "destination": "Manali",
  "days": 3,
  "startDate": "2026-11-10",
  "budget": 2500,
  "interest": "nature",
  "companions": "friends",
  "pace": "balanced"
}
```

## Deployment (free-tier friendly)

### 1. Push the project to GitHub

Create a GitHub repository and upload the contents of this folder. Do not upload `node_modules` or `.env` files.

### 2. Deploy backend on Render

1. Create a Web Service at https://render.com and connect your repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add environment variable `CLIENT_ORIGIN` with your deployed frontend URL after step 3 (for example `https://your-app.vercel.app`).
6. Deploy and copy the service URL, e.g. `https://your-api.onrender.com`.
7. Verify `https://your-api.onrender.com/api/health`.

**Storage note:** this demo writes saved trips to `server/data/trips.json`. Many free hosting filesystems are ephemeral, so saved trips may reset on redeploy/restart. For persistent production storage, replace the JSON store with Supabase/PostgreSQL or another managed database. Do not rely on the JSON file for important data.

### 3. Deploy frontend on Vercel

1. Create a project at https://vercel.com and import the same GitHub repository.
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add environment variable `VITE_API_URL` with your Render API base URL plus `/api`, e.g. `https://your-api.onrender.com/api`.
7. Deploy. Copy the frontend URL and set the Render `CLIENT_ORIGIN` environment variable to that URL, then redeploy/restart the backend.

### Production improvement checklist

- Replace JSON storage with Supabase/PostgreSQL for durable saved trips.
- Add authentication and per-user trip ownership before exposing private trips publicly.
- Add a real LLM API for richer personalized itinerary text (keep API keys only on the backend).
- Add verified map/route and weather providers if live data is needed.
- Add tests, rate limiting, and request logging before production use.

## Troubleshooting

- **`npm` is not recognized:** install Node.js LTS, close/reopen VS Code, then run `node -v` and `npm -v`.
- **Frontend says API offline:** ensure the backend terminal is still running on port 4000.
- **Port already in use:** stop the other process or change `PORT` for the backend and update `VITE_API_URL` for the frontend.
- **Changes do not appear:** restart Vite and hard-refresh the browser.
- **Saved trips disappear on hosted deployment:** expected with ephemeral JSON storage; use a persistent database for production.
