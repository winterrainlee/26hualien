'use strict';

const svg = document.querySelector('#map');
const title = document.querySelector('#title');
const back = document.querySelector('#back');
const dialog = document.querySelector('#place-dialog');
const NS = 'http://www.w3.org/2000/svg';
let activePlace;

function element(tag, attributes = {}, parent = svg, text) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  if (text) el.textContent = text;
  parent.append(el);
  return el;
}

function activate(el, callback) {
  el.addEventListener('click', callback);
  el.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  });
}

function setView(main, name) {
  title.textContent = main;
  svg.replaceChildren();
  svg.setAttribute('aria-label', name);
  svg.dataset.view = name === '대만 본섬 지도' ? 'taiwan' : 'hualien';
}

function renderTaiwan(restoreFocus = false) {
  back.hidden = true;
  setView('화롄에서 보낸 세 달', '대만 본섬 지도');
  element('path', {class: 'land', d: MAP_DATA.taiwan});
  const county = element('path', {class: 'hualien', d: MAP_DATA.highlight,
    tabindex: 0, role: 'button', 'aria-label': '화롄현 열기'});
  activate(county, () => { renderHualien(); back.focus({preventScroll: true}); });
  if (restoreFocus) county.focus({preventScroll: true});
}

function renderHualien() {
  back.hidden = false;
  setView('화롄현 花蓮縣', '화롄현 장소 지도');
  element('path', {class: 'county', d: MAP_DATA.county});
  element('path', {class: 'town-boundary', d: MAP_DATA.boundaries, 'aria-hidden': 'true'});

  // Separate nearby touch targets at county scale; geographic coordinates
  // remain in place.point. No connecting lines are drawn.
  MAP_DATA.places.forEach(place => {
    const [dx, dy] = place.displayOffset || [0, 0];
    const [x, y] = [place.point[0] + dx, place.point[1] + dy];
    const right = place.labelSide === 'right';
    const labelX = right ? 14 : -14;
    const anchor = right ? 'start' : 'end';
    const group = element('g', {class: 'place', tabindex: 0, role: 'button',
      'data-place': place.id, 'data-kind': place.kind, 'aria-label': `${place.name} / ${place.zh}`,
      'aria-haspopup': 'dialog', transform: `translate(${x},${y})`});
    element('rect', {class: 'place-hit', x: right ? -13 : -146, y: -24, width: 159, height: 48, rx: 10}, group);
    element('circle', {r: 7}, group);
    element('text', {x: labelX, y: -3, 'text-anchor': anchor}, group, place.mapName || place.name);
    element('text', {class: 'sub', x: labelX, y: 14, 'text-anchor': anchor}, group, place.zh);
    activate(group, () => openPlace(place, group));
  });
}

function openPlace(place, trigger) {
  activePlace = trigger;
  document.querySelector('#place-kind').textContent = `${place.kind === 'area' ? 'AREA' : 'PLACE'} · ${place.region}`;
  document.querySelector('#place-name').textContent = `${place.name} · ${place.zh}`;
  document.querySelector('#place-text').textContent = place.text || '아직 기록이 없어.';
  dialog.showModal();
}

back.addEventListener('click', () => renderTaiwan(true));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => activePlace?.focus({preventScroll: true}));

try {
  if (MAP_DATA.towns.length !== 13 || !MAP_DATA.places.length) throw new Error('Incomplete map data');
  renderTaiwan();
} catch (error) {
  console.error('Map initialization failed:', error);
  const errorMessage = document.createElement('p');
  errorMessage.setAttribute('role', 'alert');
  errorMessage.textContent = '지도를 표시하지 못했어. 새로고침해서 다시 시도해 줘.';
  svg.after(errorMessage);
}
