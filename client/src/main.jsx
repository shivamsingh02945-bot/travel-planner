import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Compass, MapPin, CalendarDays, Wallet, Sparkles, ArrowRight, Bookmark, Trash2, Download, Clock3, Sun, Coffee, ChevronDown, Menu, X, PlaneTakeoff, Heart, CheckCircle2, LoaderCircle, Plus, SlidersHorizontal } from 'lucide-react';
import './styles.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const defaultPrefs = { interest: 'nature', travelStyle: 'balanced', companions: 'friends', budget: 2500, days: 3, startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0,10), pace: 'balanced' };
const interests = [ ['nature','Nature & hills','🌿'], ['adventure','Adventure','🧗'], ['beach','Beaches','🏖️'], ['culture','Culture & history','🏛️'], ['food','Food trails','🍜'], ['city','City breaks','🌆'] ];
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
function App() {
  const [page, setPage] = useState('discover');
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [recommendations, setRecommendations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tripName, setTripName] = useState('My next adventure');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [health, setHealth] = useState('checking');

  useEffect(() => { api('/health').then(() => setHealth('online')).catch(() => setHealth('offline')); loadTrips(); getRecommendations(defaultPrefs); }, []);
  async function loadTrips() { try { setTrips(await api('/trips')); } catch { /* API status shown in header */ } }
  async function getRecommendations(p = prefs) {
    setLoading(true); setError(''); setMessage('');
    try { const data = await api('/recommendations', { method: 'POST', body: JSON.stringify(p) }); setRecommendations(data.recommendations); setSelected(data.recommendations[0] || null); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function generateItinerary(destination = selected) {
    if (!destination) return;
    setLoading(true); setError(''); setMessage('');
    try { const data = await api('/itinerary', { method: 'POST', body: JSON.stringify({ ...prefs, destination: destination.name }) }); setResult(data.itinerary); setSelected(destination); setTripName(`${destination.name} escape`); setPage('itinerary'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function saveTrip() {
    if (!result) return;
    setLoading(true); setError('');
    try { const saved = await api('/trips', { method: 'POST', body: JSON.stringify({ name: tripName, preferences: prefs, itinerary: result }) }); setTrips(old => [saved, ...old]); setMessage('Trip saved to your collection.'); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function deleteTrip(id) {
    try { await api(`/trips/${id}`, { method: 'DELETE' }); setTrips(old => old.filter(t => t.id !== id)); setMessage('Trip removed.'); }
    catch (e) { setError(e.message); }
  }
  function exportItinerary() {
    if (!result) return;
    const lines = [`${result.destination}, ${result.state} — ${result.days}-day itinerary`, `Estimated trip budget: ${result.budget.formattedTotal}`, '', ...result.itinerary.flatMap(day => [`DAY ${day.day} — ${day.date}: ${day.title}`, ...day.activities.map(a => `  ${a.period}: ${a.title} — ${a.detail}`), '']), 'Travel notes:', ...result.tips.map(t => `- ${t}`)];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${result.destination.toLowerCase().replaceAll(' ','-')}-itinerary.txt`; a.click(); URL.revokeObjectURL(url);
  }
  function openSaved(trip) { setResult(trip.itinerary); setPrefs({ ...defaultPrefs, ...trip.preferences }); setTripName(trip.name); setPage('itinerary'); setMessage(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  const formattedDate = useMemo(() => prefs.startDate ? new Date(`${prefs.startDate}T12:00:00`).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : 'Choose date', [prefs.startDate]);
  const nav = [{ id:'discover', label:'Plan a trip', icon:Compass }, { id:'saved', label:'Saved trips', icon:Bookmark }];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Compass size={22}/></div><div><strong>roamly<span>.</span></strong><small>TRAVEL, YOUR WAY</small></div><button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id || (page === 'itinerary' && item.id === 'discover') ? 'active' : ''}`} onClick={() => { setPage(item.id); setMobileMenu(false); setMessage(''); setError(''); }}><item.icon size={18}/><span>{item.label}</span>{item.id === 'saved' && trips.length > 0 && <b>{trips.length}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={17}/></div><strong>Your next story starts here.</strong><p>Tell us your vibe. We’ll shape the plan.</p><button onClick={() => { setPage('discover'); setMobileMenu(false); }}>Start planning <ArrowRight size={14}/></button></div><div className="profile"><div className="avatar">SS</div><div className="profile-copy"><strong>Traveler</strong><small>Personal workspace</small></div><span className={`status-dot ${health === 'online' ? 'good' : ''}`} title={`API ${health}`}/></div></div>
    </aside>
    {mobileMenu && <button className="scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation"/>}
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page === 'saved' ? 'Saved trips' : page === 'itinerary' ? 'Your itinerary' : 'Trip planner'}</strong></div><div className="topbar-right"><span className={`api-pill ${health}`}><i/>{health === 'online' ? 'API connected' : health === 'offline' ? 'API offline' : 'Connecting'}</span><div className="top-avatar">SS</div></div></header>
      {error && <div className="alert error-alert"><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
      {message && <div className="alert success-alert"><CheckCircle2 size={17}/><span>{message}</span><button onClick={() => setMessage('')}><X size={16}/></button></div>}
      {page === 'discover' && <>
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL TRIP DESIGNER</div><h1>Find your kind<br className="desktop-break"/> of <em>somewhere.</em></h1><p className="welcome-sub">Thoughtful itineraries for the way you want to travel.</p></div><div className="hero-stamp"><span>✳</span><small>LESS PLANNING<br/>MORE LIVING</small></div></section>
        <section className="planner-card"><div className="section-heading"><div><span className="step-number">01</span><div><h2>What’s your travel mood?</h2><p>Start with what sounds good to you.</p></div></div><span className="optional-label">PERSONALIZE</span></div>
          <div className="interest-grid">{interests.map(([id,label,emoji]) => <button key={id} className={`interest-option ${prefs.interest === id ? 'selected' : ''}`} onClick={() => setPrefs(p => ({ ...p, interest:id }))}><span className="interest-emoji">{emoji}</span><span>{label}</span>{prefs.interest === id && <CheckCircle2 className="interest-check" size={16}/>}</button>)}</div>
          <div className="form-divider"/><div className="section-heading compact"><div><span className="step-number">02</span><div><h2>Make it yours</h2><p>A few details help us get the balance right.</p></div></div></div>
          <div className="fields-grid"><label className="field"><span><CalendarDays size={15}/> Departure date</span><input type="date" min={new Date().toISOString().slice(0,10)} value={prefs.startDate} onChange={e => setPrefs(p => ({...p,startDate:e.target.value}))}/></label><label className="field"><span><Clock3 size={15}/> Trip duration</span><div className="select-wrap"><select value={prefs.days} onChange={e => setPrefs(p => ({...p,days:Number(e.target.value)}))}>{[1,2,3,4,5,6,7,10,14].map(n => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>)}</select><ChevronDown size={16}/></div></label><label className="field"><span><Wallet size={15}/> Daily budget per person</span><div className="budget-input"><span>₹</span><input type="number" min="500" step="500" value={prefs.budget} onChange={e => setPrefs(p => ({...p,budget:Number(e.target.value)}))}/></div><small>Excludes travel to the destination</small></label><label className="field"><span><Heart size={15}/> Who’s coming?</span><div className="select-wrap"><select value={prefs.companions} onChange={e => setPrefs(p => ({...p,companions:e.target.value}))}><option value="solo">Just me</option><option value="couple">Partner / couple</option><option value="friends">Friends</option><option value="family">Family</option></select><ChevronDown size={16}/></div></label></div>
          <div className="style-row"><div><strong>Your pace</strong><small>How packed should each day feel?</small></div><div className="segmented">{[['relaxed','Slow & easy'],['balanced','A bit of both'],['adventure','Full of plans']].map(([v,l])=><button key={v} onClick={() => setPrefs(p => ({...p,pace:v,travelStyle:v === 'adventure' ? 'adventure' : p.travelStyle}))} className={prefs.pace === v ? 'active' : ''}>{l}</button>)}</div></div>
          <div className="planner-footer"><div className="privacy-note"><Sparkles size={15}/><span>Personalized around your interests, time and budget</span></div><button className="primary-button" onClick={() => { setPage('discover'); getRecommendations(prefs); }} disabled={loading || !prefs.budget || prefs.budget < 500}>{loading ? <LoaderCircle className="spin" size={17}/> : <Sparkles size={17}/>} Find my destinations <ArrowRight size={16}/></button></div>
        </section>
        <section className="recommend-section"><div className="section-title-row"><div><div className="eyebrow muted"><MapPin size={13}/> HANDPICKED FOR YOUR VIBE</div><h2>Places to fall for <span>↗</span></h2></div><button className="text-button" onClick={() => getRecommendations(prefs)}><SlidersHorizontal size={15}/> Refresh matches</button></div>
          <div className="destination-grid">{recommendations.map((d,i)=><article key={d.name} className={`destination-card ${selected?.name === d.name ? 'chosen' : ''}`}><div className={`destination-art art-${i%4}`}><span className="art-emoji">{d.emoji}</span><span className="match-pill">{i === 0 ? 'BEST MATCH' : `${Math.max(78,94-i*5)}% MATCH`}</span><button className={`heart-button ${selected?.name === d.name ? 'hearted' : ''}`} onClick={() => setSelected(d)} aria-label={`Select ${d.name}`}><Heart size={17} fill={selected?.name === d.name ? 'currentColor' : 'none'}/></button><div className="art-location"><MapPin size={13}/>{d.state}</div></div><div className="destination-info"><div className="destination-heading"><h3>{d.name}</h3><span className="daily-cost">₹{d.dailyBudget.toLocaleString('en-IN')}<small>/day est.</small></span></div><p>{d.description}</p><div className="tag-row">{d.tags.slice(0,3).map(t=><span key={t}>{t}</span>)}</div><button className="card-action" onClick={() => generateItinerary(d)}>Build my itinerary <ArrowRight size={15}/></button></div></article>)}</div>
          {recommendations.length === 0 && !loading && <div className="empty-state"><Compass size={25}/><strong>No recommendations yet</strong><p>Choose your travel mood, then find your destinations.</p></div>}
        </section>
      </>}
      {page === 'itinerary' && <section className="itinerary-page">
        {!result ? <div className="empty-state large"><PlaneTakeoff size={32}/><h2>Your itinerary is waiting</h2><p>Pick a destination and we’ll build a day-by-day plan.</p><button className="primary-button" onClick={() => setPage('discover')}>Explore destinations <ArrowRight size={16}/></button></div> : <>
          <div className="itinerary-hero"><div className="eyebrow"><CheckCircle2 size={14}/> YOUR TRIP, DESIGNED</div><div className="itinerary-title-row"><div><h1>{result.destination}<span className="title-period">.</span></h1><p><MapPin size={15}/>{result.state}, India <span>·</span><CalendarDays size={15}/>{result.days} days <span>·</span> Starts {formattedDate}</p></div><div className="hero-actions"><button className="outline-button" onClick={exportItinerary}><Download size={16}/> Export</button><button className="primary-button" onClick={saveTrip} disabled={loading}><Bookmark size={16}/>{loading ? 'Saving…' : 'Save trip'}</button></div></div>
            <div className="budget-banner"><div className="budget-icon"><Wallet size={20}/></div><div><small>ESTIMATED TOTAL BUDGET</small><strong>{result.budget.formattedTotal}</strong><span>for 1 traveler · about ₹{result.budget.perDay.toLocaleString('en-IN')} per day</span></div><div className="budget-breakdown">{result.budget.breakdown.slice(0,3).map(b=><div key={b.label}><span>{b.label}</span><strong>₹{b.amount.toLocaleString('en-IN')}</strong></div>)}</div></div>
          </div>
          <div className="itinerary-layout"><div className="day-list"><div className="section-title-row"><div><div className="eyebrow muted">YOUR DAY-BY-DAY GUIDE</div><h2>The good stuff <span>✳</span></h2></div><span className="day-count">{result.days} DAYS</span></div>{result.itinerary.map(day=><article className="day-card" key={day.day}><div className="day-marker"><span>DAY</span><strong>{String(day.day).padStart(2,'0')}</strong></div><div className="day-content"><div className="day-heading"><div><h3>{day.title}</h3><p>{new Date(`${day.date}T12:00:00`).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p></div><span className="day-date">{day.date.slice(5).replace('-',' / ')}</span></div><div className="activity-list">{day.activities.map((a,i)=><div className="activity" key={`${day.day}-${a.period}`}><div className={`activity-icon activity-${i}`}>{i===0?<Sun size={17}/>:i===1?<Coffee size={17}/>:<Sparkles size={17}/>}</div><div className="activity-copy"><small>{a.period.toUpperCase()}</small><strong>{a.title}</strong><p>{a.detail}</p></div><span className="activity-cost">₹{a.cost.toLocaleString('en-IN')}</span></div>)}</div></div></article>)}</div>
            <aside className="itinerary-aside"><div className="aside-card"><div className="aside-card-heading"><Sparkles size={16}/><h3>Little things to know</h3></div><p className="aside-intro">A smoother trip starts with a few smart details.</p>{result.tips.map((tip,i)=><div className="tip" key={tip}><span>{String(i+1).padStart(2,'0')}</span><p>{tip}</p></div>)}</div><div className="aside-card budget-card"><div className="aside-card-heading"><Wallet size={16}/><h3>Budget snapshot</h3></div>{result.budget.breakdown.map(b=><div className="budget-line" key={b.label}><span>{b.label}</span><strong>₹{b.amount.toLocaleString('en-IN')}</strong></div>)}<div className="budget-total"><span>Estimated total</span><strong>{result.budget.formattedTotal}</strong></div><small className="estimate-note">Planning estimate only, not live pricing.</small></div><div className="save-card"><div className="save-card-icon"><Bookmark size={18}/></div><strong>Keep this plan close</strong><p>Save your itinerary so you can come back to it anytime.</p><input value={tripName} maxLength={80} onChange={e=>setTripName(e.target.value)} aria-label="Trip name"/><button className="primary-button full-button" onClick={saveTrip} disabled={loading}><Plus size={16}/> Save to my trips</button></div></aside></div>
        </>}
      </section>}
      {page === 'saved' && <section className="saved-page"><div className="welcome-row saved-welcome"><div><div className="eyebrow"><Bookmark size={14}/> YOUR COLLECTION</div><h1>Trips worth<br className="desktop-break"/> <em>remembering.</em></h1><p className="welcome-sub">Your plans, all in one place.</p></div><div className="saved-count"><strong>{trips.length.toString().padStart(2,'0')}</strong><span>SAVED TRIPS</span></div></div>{trips.length === 0 ? <div className="empty-state large"><div className="empty-icon"><Bookmark size={26}/></div><h2>Your next adventure starts here</h2><p>Plans you save will show up here for easy access.</p><button className="primary-button" onClick={() => setPage('discover')}>Plan a trip <ArrowRight size={16}/></button></div> : <div className="saved-grid">{trips.map(trip=><article className="saved-card" key={trip.id}><div className="saved-art"><span>{({Manali:'🏔️',Jaipur:'🏰',Goa:'🏖️',Udaipur:'🛶',Rishikesh:'🌊',Varanasi:'🪔',Munnar:'🍃',Mumbai:'🌆',Darjeeling:'🚞',Pondicherry:'🚲',Delhi:'🕌',Coorg:'🌿'})[trip.itinerary.destination] || '✈️'}</span><button className="delete-button" onClick={() => deleteTrip(trip.id)} aria-label={`Delete ${trip.name}`}><Trash2 size={16}/></button></div><div className="saved-card-body"><span className="saved-meta">{trip.itinerary.days} DAYS <i/> {new Date(trip.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span><h3>{trip.name}</h3><p><MapPin size={14}/>{trip.itinerary.destination}, {trip.itinerary.state}</p><div className="saved-card-bottom"><strong>{trip.itinerary.budget.formattedTotal}</strong><button onClick={() => openSaved(trip)}>Open plan <ArrowRight size={15}/></button></div></div></article>)}</div>}</section>}
      <footer className="footer"><span>© 2026 Roamly Travel Planner</span><span>Made for the curious <span className="footer-heart">♥</span></span><span className="footer-status"><i/> {health === 'online' ? 'All systems ready' : 'Checking connection'}</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
