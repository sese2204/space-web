// Vanilla HUD: reads the body data and updates the overlay panels. No React,
// no template runtime — just direct DOM writes against the markup in index.html.
import { OVERVIEW, BODIES, NAV } from './bodies.js';

const stationData = (i) => (i === 0 ? OVERVIEW : BODIES[i - 1]);

function fmtCoord(p) {
  return Math.abs(p.lat).toFixed(1) + '°' + (p.lat >= 0 ? 'N' : 'S') +
    '   ' + Math.abs(p.lon).toFixed(1) + '°' + (p.lon >= 0 ? 'E' : 'W');
}

export function createHud(root, { onGo, onClosePoi }) {
  const q = (sel) => root.querySelector(sel);
  const nameBlock = q('.name-block');
  const desigEl = q('.name-block .designation');
  const nameEl = q('.name-block h1');
  const blurbEl = q('.name-block .blurb');
  const panelDesig = q('.data-panel .panel-desig');
  const statsEl = q('.data-panel .stats');
  const hintEl = q('.nav-hint .hint-text');
  const navEl = q('.station-nav');
  const card = q('#poi-card');

  const navButtons = NAV.map((label, i) => {
    const body = i === 0 ? null : BODIES[i - 1];
    const b = document.createElement('button');
    b.className = 'nav-item' + (body && body.parentNav ? ' is-moon' : '');
    b.innerHTML = '<span class="nav-tick"></span><span class="nav-label"></span><span class="nav-idx"></span>';
    b.querySelector('.nav-label').textContent = label;
    b.querySelector('.nav-idx').textContent = String(i + 1).padStart(2, '0');
    b.addEventListener('click', () => go(i));
    navEl.appendChild(b);
    return b;
  });

  let current = -1;

  function setStation(i) {
    const s = stationData(i);
    desigEl.textContent = s.designation;
    nameEl.textContent = s.name;
    blurbEl.textContent = s.blurb;
    panelDesig.textContent = s.designation;
    hintEl.textContent = s.hint;

    statsEl.innerHTML = '';
    for (const row of s.stats) {
      const el = document.createElement('div');
      el.className = 'stat-row';
      el.innerHTML = '<span class="stat-k"></span><span class="stat-v"></span>';
      el.querySelector('.stat-k').textContent = row.k;
      el.querySelector('.stat-v').textContent = row.v;
      statsEl.appendChild(el);
    }

    // Moons collapse into their parent: a gas giant's moons only appear in the
    // rail while that planet (or one of its own moons) is the active station.
    const activeBody = i === 0 ? null : BODIES[i - 1];
    const activeParent = activeBody
      ? (activeBody.parentNav || (BODIES.some((b) => b.parentNav === activeBody.id) ? activeBody.id : null))
      : null;
    navButtons.forEach((b, idx) => {
      b.classList.toggle('active', idx === i);
      const body = idx === 0 ? null : BODIES[idx - 1];
      if (body && body.parentNav) b.classList.toggle('nav-hidden', body.parentNav !== activeParent);
    });

    // Re-trigger the reveal animation on the name block.
    nameBlock.classList.remove('exo-fade');
    void nameBlock.offsetWidth;
    nameBlock.classList.add('exo-fade');
    current = i;
  }

  function go(i) {
    hidePoi();
    if (i !== current) setStation(i);
    onGo(i);
  }

  function showPoi(poi) {
    card.querySelector('.poi-name').textContent = poi.name;
    card.querySelector('.poi-sub').textContent = poi.sub;
    card.querySelector('.poi-coord').textContent = fmtCoord(poi);
    card.classList.add('open');
  }
  function hidePoi() { card.classList.remove('open'); }

  card.querySelector('.poi-close').addEventListener('click', () => { hidePoi(); onClosePoi(); });

  setStation(0);
  return { setStation, showPoi, hidePoi, go };
}
