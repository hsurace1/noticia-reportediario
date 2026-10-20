// Open-Meteo: API pública, sin API key.
const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const WX = 'https://api.open-meteo.com/v1/forecast';

const CODES = {
  0: ['☀️', 'Despejado'], 1: ['🌤️', 'Mayormente despejado'], 2: ['⛅', 'Parcialmente nublado'],
  3: ['☁️', 'Nublado'], 45: ['🌫️', 'Niebla'], 48: ['🌫️', 'Niebla con escarcha'],
  51: ['🌦️', 'Llovizna ligera'], 53: ['🌦️', 'Llovizna'], 55: ['🌧️', 'Llovizna intensa'],
  61: ['🌧️', 'Lluvia ligera'], 63: ['🌧️', 'Lluvia'], 65: ['🌧️', 'Lluvia fuerte'],
  71: ['🌨️', 'Nieve ligera'], 73: ['🌨️', 'Nieve'], 75: ['❄️', 'Nieve fuerte'],
  80: ['🌦️', 'Chubascos'], 81: ['🌧️', 'Chubascos fuertes'], 82: ['⛈️', 'Chubascos violentos'],
  95: ['⛈️', 'Tormenta'], 96: ['⛈️', 'Tormenta con granizo'], 99: ['⛈️', 'Tormenta fuerte con granizo']
};
const code = c => CODES[c] || ['❓', 'Desconocido'];

const $ = id => document.getElementById(id);
const status = msg => ($('status').textContent = msg);

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Error HTTP ${r.status}`);
  return r.json();
}

async function search(city, units) {
  status('Cargando...');
  $('current').hidden = $('forecast').hidden = true;
  try {
    const g = await getJSON(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=es`);
    if (!g.results?.length) throw new Error('Ciudad no encontrada');
    const { latitude, longitude, name, country } = g.results[0];
    const w = await getJSON(`${WX}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${units}`);
    render(`${name}, ${country}`, w, units === 'celsius' ? '°C' : '°F');
    status('');
  } catch (e) {
    status('⚠️ ' + e.message);
  }
}

function render(place, w, u) {
  const c = w.current, [icon, desc] = code(c.weather_code);
  $('place').textContent = place;
  $('icon').textContent = icon;
  $('temp').textContent = Math.round(c.temperature_2m) + u;
  $('desc').textContent = desc;
  $('feels').textContent = Math.round(c.apparent_temperature) + u;
  $('humidity').textContent = c.relative_humidity_2m + '%';
  $('wind').textContent = c.wind_speed_10m + ' km/h';
  $('precip').textContent = c.precipitation + ' mm';
  $('days').innerHTML = w.daily.time.map((d, i) => {
    const day = new Date(d + 'T00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
    return `<div class="day"><div>${day}</div><div class="i">${code(w.daily.weather_code[i])[0]}</div>` +
      `<div>${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</div></div>`;
  }).join('');
  $('current').hidden = $('forecast').hidden = false;
}

$('search-form').addEventListener('submit', e => {
  e.preventDefault();
  const city = $('city').value.trim();
  localStorage.setItem('lastCity', city);
  search(city, $('units').value);
});

const last = localStorage.getItem('lastCity') || 'Buenos Aires';
$('city').value = last;
search(last, $('units').value);
