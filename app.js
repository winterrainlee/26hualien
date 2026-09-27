'use strict';

const svg = document.querySelector('#map');
const title = document.querySelector('#title');
const subtitle = document.querySelector('#subtitle');
const hint = document.querySelector('#hint');
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

function setView(main, sub, help, name) {
  title.textContent = main;
  subtitle.textContent = sub;
  hint.textContent = help;
  svg.replaceChildren();
  svg.setAttribute('aria-label', name);
  svg.dataset.view = name === '대만 본섬 지도' ? 'taiwan' : 'hualien';
}

function renderTaiwan(restoreFocus = false) {
  back.hidden = true;
  setView('화롄에서 보낸 세 달', '대만 동부에서 내가 지나고 머문 공간의 기록.',
    '연록색 화롄을 눌러 들어가 봐.', '대만 본섬 지도');
  element('path', {class: 'land', d: MAP_DATA.taiwan});
  const county = element('path', {class: 'hualien', d: MAP_DATA.highlight,
    tabindex: 0, role: 'button', 'aria-label': '화롄현 열기'});
  activate(county, () => { renderHualien(); back.focus({preventScroll: true}); });
  if (restoreFocus) county.focus({preventScroll: true});
}

function renderHualien() {
  back.hidden = false;
  setView('화롄현 花蓮縣', '아직은 두 개의 점뿐. 여기서부터 경험이 쌓여 간다.',
    '점을 누르면 장소의 테스트 기록이 열려.', '화롄현 장소 지도');
  element('path', {class: 'county', d: MAP_DATA.county});
  element('path', {class: 'town-boundary', d: MAP_DATA.boundaries, 'aria-hidden': 'true'});

  // County-scale positions are only 2.8 SVG units apart. Leader lines preserve
  // their geographic endpoints while separating the two touch targets.
  const callouts = [[257, 178], [204, 250]];
  MAP_DATA.places.forEach((place, index) => {
    const [x, y] = callouts[index];
    const [lonX, latY] = place.point;
    element('path', {class: 'place-leader', d: `M${lonX},${latY}L${x},${y}`,
      'aria-hidden': 'true'});
    const group = element('g', {class: 'place', tabindex: 0, role: 'button',
      'data-place': place.id, 'aria-label': `${place.name} / ${place.zh}`,
      'aria-haspopup': 'dialog', transform: `translate(${x},${y})`});
    element('rect', {class: 'place-hit', x: -143, y: -26, width: 168, height: 52, rx: 12}, group);
    element('circle', {r: 7}, group);
    element('text', {x: -16, y: -3, 'text-anchor': 'end'}, group, place.name);
    element('text', {class: 'sub', x: -16, y: 14, 'text-anchor': 'end'}, group, place.zh);
    activate(group, () => openPlace(place, group));
  });
}

function openPlace(place, trigger) {
  activePlace = trigger;
  document.querySelector('#place-kind').textContent = 'PLACE · 壽豐';
  document.querySelector('#place-name').textContent = `${place.name} · ${place.zh}`;
  document.querySelector('#place-text').textContent = place.text;
  dialog.showModal();
}

back.addEventListener('click', () => renderTaiwan(true));
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => activePlace?.focus({preventScroll: true}));

try {
  if (MAP_DATA.towns.length !== 13 || MAP_DATA.places.length !== 2) throw new Error('Incomplete map data');
  renderTaiwan();
} catch (error) {
  console.error('Map initialization failed:', error);
  hint.textContent = '지도를 표시하지 못했어. 새로고침해서 다시 시도해 줘.';
}
