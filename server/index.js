import express from 'express';
import cors from 'cors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { destinations } from './data/destinations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'trips.json');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '1mb' }));

async function readTrips() {
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }
}
async function writeTrips(trips) { await fs.mkdir(path.dirname(DATA_FILE), { recursive: true }); await fs.writeFile(DATA_FILE, JSON.stringify(trips, null, 2)); }
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function recommendDestination(preferences) {
  const style = preferences.travelStyle || 'balanced';
  const interest = preferences.interest || 'nature';
  const budget = Number(preferences.budget || 2500);
  const matches = destinations.map(d => {
    let score = d.tags.includes(interest) ? 5 : 0;
    if (style === 'relaxed' && ['nature','beach','wellness'].some(t => d.tags.includes(t))) score += 2;
    if (style === 'adventure' && ['adventure','mountains'].some(t => d.tags.includes(t))) score += 3;
    if (style === 'culture' && ['culture','history','spiritual'].some(t => d.tags.includes(t))) score += 3;
    if (style === 'foodie' && d.tags.includes('food')) score += 3;
    if (style === 'romantic' && d.tags.includes('couple')) score += 2;
    score += Math.max(0, 3 - Math.abs(d.dailyBudget - budget) / 1000);
    if (preferences.companions === 'family' && d.tags.includes('family')) score += 2;
    if (preferences.companions === 'friends' && d.tags.includes('friends')) score += 2;
    if (preferences.companions === 'couple' && d.tags.includes('couple')) score += 2;
    return { ...d, score };
  }).sort((a,b) => b.score - a.score);
  return matches.slice(0, 4);
}
function buildItinerary(destination, prefs) {
  const days = Math.min(14, Math.max(1, Number(prefs.days || 3)));
  const start = prefs.startDate ? new Date(`${prefs.startDate}T12:00:00`) : new Date();
  const dailyBudget = destination.dailyBudget;
  const pace = prefs.pace || 'balanced';
  const schedule = [
    { period: 'Morning', title: `${destination.highlights[0]} visit`, detail: 'Start early, take photos and allow time to explore.', type: 'sightseeing', cost: Math.round(dailyBudget * .12) },
    { period: 'Afternoon', title: `Explore ${destination.name} local life`, detail: 'Enjoy a local lunch, browse nearby streets and discover small shops.', type: 'food & culture', cost: Math.round(dailyBudget * .34) },
    { period: 'Evening', title: `${destination.highlights[1 % destination.highlights.length]} & sunset`, detail: 'Keep this slot flexible for golden-hour views and a relaxed dinner.', type: 'experience', cost: Math.round(dailyBudget * .24) }
  ];
  const itinerary = Array.from({ length: days }, (_, i) => {
    const date = new Date(start); date.setDate(start.getDate() + i);
    const first = destination.highlights[(i * 2) % destination.highlights.length];
    const second = destination.highlights[(i * 2 + 1) % destination.highlights.length];
    const third = destination.highlights[(i * 2 + 2) % destination.highlights.length];
    const slots = [
      { period: 'Morning', title: first, detail: 'Visit early to avoid crowds; check local opening times before leaving.', type: 'sightseeing', cost: Math.round(dailyBudget * .12) },
      { period: 'Afternoon', title: `Local food & ${second}`, detail: 'Try a regional speciality and explore the surrounding area at your own pace.', type: 'food & culture', cost: Math.round(dailyBudget * .34) },
      { period: 'Evening', title: pace === 'relaxed' ? 'Free time and a scenic walk' : `${third} or a local experience`, detail: 'Leave room for travel delays, rest and spontaneous discoveries.', type: 'experience', cost: Math.round(dailyBudget * .24) }
    ];
    return { day: i + 1, date: date.toISOString().slice(0,10), title: i === 0 ? `Arrive & discover ${destination.name}` : i === days - 1 ? 'Highlights & departure' : `Explore ${destination.name} — day ${i + 1}`, activities: slots };
  });
  const perDay = dailyBudget + Math.round(dailyBudget * .28) + 500;
  const total = perDay * days;
  return { destination: destination.name, state: destination.state, days, itinerary, budget: { perDay, total, formattedTotal: money(total), breakdown: [{ label: 'Stay', amount: Math.round(total * .35) }, { label: 'Food', amount: Math.round(total * .25) }, { label: 'Local transport', amount: Math.round(total * .18) }, { label: 'Activities', amount: Math.round(total * .15) }, { label: 'Buffer', amount: total - Math.round(total * .93) }] }, tips: ['Prices are planning estimates; confirm current fares, tickets and accommodation before booking.', 'Keep digital copies of IDs and booking confirmations.', 'Check weather and local advisories a day before departure.', 'Leave buffer time between activities instead of over-scheduling.'] };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Travel Planner API', time: new Date().toISOString() }));
app.get('/api/destinations', (_req, res) => res.json(destinations.map(({ score, ...d }) => d)));
app.post('/api/recommendations', (req, res) => {
  const p = req.body || {};
  const budget = Number(p.budget);
  const days = Number(p.days);
  if (p.budget !== undefined && (!Number.isFinite(budget) || budget < 500)) return res.status(400).json({ error: 'Daily budget must be at least ₹500.' });
  if (p.days !== undefined && (!Number.isInteger(days) || days < 1 || days > 14)) return res.status(400).json({ error: 'Trip duration must be between 1 and 14 days.' });
  res.json({ recommendations: recommendDestination(p) });
});
app.post('/api/itinerary', (req, res) => {
  const p = req.body || {};
  const destination = destinations.find(d => d.name.toLowerCase() === String(p.destination || '').toLowerCase());
  const days = Number(p.days || 3);
  if (!destination) return res.status(400).json({ error: 'Please choose a destination from the recommendations.' });
  if (!Number.isInteger(days) || days < 1 || days > 14) return res.status(400).json({ error: 'Trip duration must be between 1 and 14 days.' });
  const itinerary = buildItinerary(destination, p);
  res.json({ itinerary, preferences: p });
});
app.get('/api/trips', async (_req, res, next) => { try { res.json(await readTrips()); } catch (e) { next(e); } });
app.post('/api/trips', async (req, res, next) => {
  try {
    const { name, preferences, itinerary } = req.body || {};
    if (!name?.trim() || !itinerary?.destination) return res.status(400).json({ error: 'Trip name and a generated itinerary are required.' });
    const trips = await readTrips();
    const trip = { id: crypto.randomUUID(), name: name.trim().slice(0,80), preferences: preferences || {}, itinerary, createdAt: new Date().toISOString() };
    trips.unshift(trip); await writeTrips(trips); res.status(201).json(trip);
  } catch (e) { next(e); }
});
app.delete('/api/trips/:id', async (req, res, next) => {
  try { const trips = await readTrips(); const filtered = trips.filter(t => t.id !== req.params.id); if (filtered.length === trips.length) return res.status(404).json({ error: 'Trip not found.' }); await writeTrips(filtered); res.json({ success: true }); }
  catch (e) { next(e); }
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server. Please try again.' }); });
app.listen(PORT, () => console.log(`Travel Planner API running at http://localhost:${PORT}`));
