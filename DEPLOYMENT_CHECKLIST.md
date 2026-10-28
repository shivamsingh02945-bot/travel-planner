# Deployment checklist

- [ ] Test `GET /api/health` locally.
- [ ] Generate at least one itinerary from the frontend.
- [ ] Save a trip, refresh, verify it appears in Saved trips, and delete it.
- [ ] Export an itinerary and confirm a `.txt` file downloads.
- [ ] Push project to GitHub without `.env` or `node_modules`.
- [ ] Deploy `server` as a Render Web Service.
- [ ] Set Render `CLIENT_ORIGIN` to the Vercel frontend URL.
- [ ] Deploy `client` on Vercel with `VITE_API_URL=https://YOUR-API.onrender.com/api`.
- [ ] Verify frontend and API health from the deployed URLs.
- [ ] Add a persistent database before relying on hosted saved trips.
