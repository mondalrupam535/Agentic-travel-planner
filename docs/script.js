const promptEl = document.getElementById('prompt');
const imageEl = document.getElementById('image');
const generateBtn = document.getElementById('generate');
const suggestBtn = document.getElementById('suggest');
const daysEl = document.getElementById('days');
const styleEl = document.getElementById('style');
const darkToggle = document.getElementById('darkToggle');
const loadingEl = document.getElementById('loading');
const outputEl = document.getElementById('output');
const historyEl = document.getElementById('history');
const suggestionEl = document.getElementById('suggestion');

let history = JSON.parse(localStorage.getItem('trip_history')||'[]');

function applyTheme(){
  if(localStorage.getItem('dark') === '1') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  darkToggle.checked = localStorage.getItem('dark') === '1';
}

darkToggle.addEventListener('change', ()=>{
  localStorage.setItem('dark', darkToggle.checked ? '1':'0');
  applyTheme();
});
applyTheme();

function setLoading(on){
  loadingEl.style.display = on ? 'block' : 'none';
  generateBtn.disabled = on;
}

function renderItinerary(itinerary){
  // Clear
  outputEl.innerHTML = '';
  if(!itinerary || !Array.isArray(itinerary.daily_itinerary)){
    outputEl.innerHTML = '<div class="card">No itinerary returned.</div>';
    return;
  }

  const header = document.createElement('div');
  header.className = 'card';
  header.innerHTML = `<strong>Destination:</strong> ${itinerary.destination} <br/><span class="meta">Style: ${itinerary.trip_style} • ${itinerary.total_days} days</span>`;
  outputEl.appendChild(header);

  itinerary.daily_itinerary.forEach((day, idx) => {
    const d = document.createElement('div');
    d.className = 'day-card fade-in';
    // Only include the mini-map for the first day
    const mapHtml = idx === 0 ? `<div class="map-mini" id="map-${day.day}"></div>` : '';
    d.innerHTML = `
      <h3>Day ${day.day} — ${day.city}</h3>
      <div><strong>Activities</strong><ol class="list">${(day.activities||[]).map(a=>`<li>${a}</li>`).join('')}</ol></div>
      <div><strong>Food</strong><ul class="list">${(day.food_recommendations||[]).map(f=>`<li>${f}</li>`).join('')}</ul></div>
      <div><strong>Travel Tips</strong><ul class="list">${(day.travel_tips||[]).map(t=>`<li>${t}</li>`).join('')}</ul></div>
      ${mapHtml}
    `;
    outputEl.appendChild(d);
    // Initialize mini-map only for the first day
    if(idx === 0){
      setTimeout(()=> initMiniMap(`map-${day.day}`, day.city), 300);
    }
  });
}

async function initMiniMap(mapId, city){
  const el = document.getElementById(mapId);
  if(!el) return;
  // create map
  try{
    const map = L.map(el).setView([20,0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);

    // try geocoding via Nominatim
    if(city){
      const q = encodeURIComponent(city);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      const data = await res.json();
      if(data && data[0]){
        const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
        map.setView([lat,lon], 12);
        L.marker([lat,lon]).addTo(map).bindPopup(city).openPopup();
        return;
      }
    }
  }catch(e){
    console.warn('Map init failed', e);
  }
}

function saveHistory(entry){
  history.unshift(entry);
  if(history.length>12) history.pop();
  localStorage.setItem('trip_history', JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  if(!history.length){ historyEl.innerHTML = 'No history yet.'; return; }
  historyEl.innerHTML = history.map(h=>`<div class="history-item"><strong>${h.destination || h.prompt}</strong><div class="muted">${h.trip_style||''} • ${h.total_days||''} days</div></div>`).join('');
}

renderHistory();

// Delete history handler
const deleteHistoryBtn = document.getElementById('deleteHistoryBtn');
if(deleteHistoryBtn){
  deleteHistoryBtn.addEventListener('click', ()=>{
    if(confirm('Are you sure you want to delete all travel history?')){
      history = [];
      localStorage.removeItem('trip_history');
      renderHistory();
      alert('Travel history cleared.');
    }
  });
}

async function onGenerate(){
  setLoading(true);
  outputEl.innerHTML = '';
  const basePrompt = promptEl.value.trim();
  if(!basePrompt){
    alert('Please enter a trip description.');
    setLoading(false);
    return;
  }

  const days = parseInt(daysEl.value) || 5;
  const tripStyle = styleEl.value || '';

  // Append options to user prompt to help the model
  const prompt = `${basePrompt}\n\nConstraints: total_days=${days}; trip_style=${tripStyle}. Respond only with the itinerary JSON.`;

  const fd = new FormData();
  fd.append('prompt', prompt);
  if(imageEl.files && imageEl.files[0]){
    fd.append('image', imageEl.files[0]);
  }

  try{
    const res = await fetch('http://localhost:3000/plan-trip',{
      method:'POST',
      body:fd
    });

    if(!res.ok){
      const text = await res.text();
      throw new Error(text || 'Server error');
    }

    const json = await res.json();
    renderItinerary(json);
    saveHistory({ prompt: basePrompt, destination: json.destination, trip_style: json.trip_style, total_days: json.total_days, ts: Date.now() });
  }catch(err){
    console.error(err);
    outputEl.innerHTML = `<div class="card">Error: ${err.message}</div>`;
  }finally{
    setLoading(false);
  }
}

generateBtn.addEventListener('click', onGenerate);

// Surprise me handler: quick suggestion from AI
async function onSuggest(){
  suggestionEl.textContent = 'Thinking…';
  const base = promptEl.value.trim() || 'Surprise me with a 3-day trip suggestion inspired by the attached image or a pleasant city vibe.';
  const prompt = `${base}\n\nMake a concise 3-day suggestion JSON with destination, trip_style and daily_itinerary (3 items).`;

  const fd = new FormData();
  fd.append('prompt', prompt);
  if(imageEl.files && imageEl.files[0]) fd.append('image', imageEl.files[0]);

  try{
    const res = await fetch('http://localhost:3000/plan-trip', { method:'POST', body:fd });
    if(!res.ok) throw new Error(await res.text());
    const json = await res.json();
    suggestionEl.innerHTML = `<div><strong>${json.destination}</strong><div class="muted">${json.trip_style} • ${json.total_days} days</div></div>`;
    // show a tiny preview under suggestions
    suggestionEl.innerHTML += `<div style="margin-top:8px;font-size:0.95rem">${(json.daily_itinerary||[]).slice(0,3).map(d=>`<div><strong>Day ${d.day} — ${d.city}</strong><div class="muted">${(d.activities||[]).slice(0,2).join(' • ')}</div></div>`).join('')}</div>`;
  }catch(e){
    suggestionEl.textContent = 'Suggestion failed: ' + e.message;
  }
}

suggestBtn.addEventListener('click', onSuggest);

