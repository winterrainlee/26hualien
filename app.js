'use strict';
const svg = document.querySelector('#map');
const title = document.querySelector('#title');
const back = document.querySelector('#back');
const dialog = document.querySelector('#place-dialog');
const notesButton = document.querySelector('#region-notes');
const NS = 'http://www.w3.org/2000/svg';
let activePlace, currentRegion, zoomBounds;
let zoomStack = [];
function element(tag, attrs = {}, parent = svg, text) {
  const el = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
  if (text) el.textContent = text;
  parent.append(el); return el;
}
function activate(el, callback) {
  el.addEventListener('click', callback);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); callback();} });
}
function setView(main, view) {
  notesButton.hidden = true;
  title.textContent = main; svg.replaceChildren(); svg.dataset.view = view;
  svg.setAttribute('aria-label', main + ' 지도');
}
function renderTaiwan(focus = false) {
  currentRegion = null; back.hidden = true;
  setView('화롄에서 보낸 세 달','taiwan');
  element('path',{class:'land',d:MAP_DATA.taiwan});
  const el=element('path',{class:'hualien',d:MAP_DATA.highlight,tabindex:0,role:'button','aria-label':'화롄현 열기'});
  activate(el,()=>{renderHualien();back.focus();}); if(focus)el.focus();
}
function renderHualien(focusId) {
  currentRegion=null; zoomStack=[]; back.hidden=false; back.textContent='← 대만으로';
  setView('화롄현 花蓮縣','hualien');
  element('path',{class:'county',d:MAP_DATA.county});
  element('path',{class:'town-boundary',d:MAP_DATA.boundaries});
  // Draw the parent first so Shoufeng cannot cover its nested village.
  MAP_DATA.regions.filter(r=>r.id!=='school').forEach(r=>element('path',{class:'region-fill',d:r.path}));
  const school=MAP_DATA.regions.find(r=>r.id==='school');
  element('path',{class:'region-fill school-area',d:school.path});
  element('line',{class:'school-connector',x1:school.label[0]+53,y1:school.label[1],x2:(school.bounds[0]+school.bounds[2])/2,y2:(school.bounds[1]+school.bounds[3])/2,'aria-hidden':'true'});
  MAP_DATA.regions.forEach(r=>{
    const g=element('g',{class:'region-label',role:'button',tabindex:0,'data-region':r.id,'aria-label':r.name+' '+r.zh+' 열기',transform:`translate(${r.label})`});
    element('rect',{x:-53,y:-26,width:106,height:52,rx:16},g);
    element('text',{'text-anchor':'middle',y:-3},g,r.name);
    element('text',{class:'sub','text-anchor':'middle',y:15},g,r.zh);
    if(r.id==='ruisui'){
      element('image',{class:'travel-icon',href:'./assets/train-front.svg',x:61,y:-12,width:24,height:24,'aria-hidden':'true'},g);
      g.setAttribute('aria-label',r.name+' '+r.zh+' 열기 · 기차로 방문');
    }
    activate(g,()=>{currentRegion=r;zoomStack=[];renderRegion(r.bounds);back.focus();});
    if(r.id===focusId)g.focus();
  });
}
function fit(bounds) {
  const [x0,y0,x1,y1]=bounds;
  const k=Math.min(264/Math.max(x1-x0,.001),408/Math.max(y1-y0,.001));
  return {k, x:180-k*(x0+x1)/2,y:302-k*(y0+y1)/2};
}
function screenPoint(p,t){return [p.point[0]*t.k+t.x,p.point[1]*t.k+t.y];}
function renderRegion(bounds) {
  zoomBounds=bounds; const r=currentRegion,t=fit(bounds);
  setView(r.name+' '+r.zh,r.id); back.textContent=zoomStack.length?'← 지역 전체':'← 화롄현';
  const notes=REGION_NOTES.filter(note=>note.regionIds.includes(r.id));
  notesButton.textContent=`${r.name} 노트 ${notes.length}개`;
  notesButton.hidden=false;
  const land=element('g',{transform:`translate(${t.x},${t.y}) scale(${t.k})`});
  element('path',{class:'context-land',d:MAP_DATA.county},land);
  if(r.id==='school'){
    const parent=MAP_DATA.regions.find(region=>region.id==='shoufeng');
    element('path',{class:'parent-outline',d:parent.path,'aria-label':'소우펑 壽豐鄉 외곽선'},land);
  }
  element('path',{class:'region-fill selected',d:r.path},land);
  element('path',{class:'town-boundary',d:MAP_DATA.boundaries},land);
  if(r.id==='shoufeng'){
    const school=MAP_DATA.regions.find(region=>region.id==='school');
    element('path',{class:'region-fill school-area',d:school.path,'aria-label':'지학촌 志學村'},land);
  }
  const places=MAP_DATA.places.filter(p=>p.regionId===r.id);
  const threshold=52*360/svg.getBoundingClientRect().width;
  const groups=[];
  places.forEach(p=>{
    const xy=screenPoint(p,t);
    if(xy[0]<0||xy[0]>360||xy[1]<65||xy[1]>548)return;
    const group=groups.find(g=>g.every(q=>{const v=screenPoint(q,t);return Math.hypot(xy[0]-v[0],xy[1]-v[1])<threshold;}));
    if(group)group.push(p);else groups.push([p]);
  });
  const occupied=[];
  groups.forEach(group=>{
    const points=group.map(p=>screenPoint(p,t));
    const x=points.reduce((s,p)=>s+p[0],0)/points.length,y=points.reduce((s,p)=>s+p[1],0)/points.length;
    const cluster=group.length>1;
    const g=element('g',{class:cluster?'place cluster':'place',role:'button',tabindex:0,
      'aria-label':cluster?`${group.length}개 장소 확대`:group[0].name+' / '+group[0].zh,
      'data-place':cluster?group.map(p=>p.id).join(','):group[0].id,transform:`translate(${x},${y})`});
    element('circle',{class:'place-hit',r:threshold/2},g);
    element('circle',{r:cluster?17:7},g);
    if(cluster)element('text',{'text-anchor':'middle',y:5,class:'cluster-count'},g,String(group.length));
    else {
      const p=group[0],label=p.mapName||p.name,width=Math.max(label.length*12,p.zh.length*10)+8;
      const left=x>180,lx=left?-14:14,anchor=left?'end':'start';
      const box=[left?x-14-width:x+14,y-18,width,38];
      if(box[0]>=4&&box[0]+width<=356&&!occupied.some(b=>box[0]<b[0]+b[2]&&box[0]+box[2]>b[0]&&box[1]<b[1]+b[3]&&box[1]+box[3]>b[1])) {
        element('rect',{class:'place-hit',x:left?-14-width:-threshold/2,y:-20,width:width+14+threshold/2,height:40},g);
        element('text',{x:lx,y:-3,'text-anchor':anchor},g,label);
        element('text',{class:'sub',x:lx,y:14,'text-anchor':anchor},g,p.zh);occupied.push(box);
      }
    }
    activate(g,()=>{
      if(!cluster){openPlace(group[0],g);return;}
      const xs=group.map(p=>p.point[0]),ys=group.map(p=>p.point[1]);
      if(Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))<.001){openChoices(group,g);return;}
      zoomStack.push(bounds);renderRegion([Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]);back.focus();
    });
  });
}
function openChoices(places,trigger){
  document.querySelector('#place-kind').hidden=false;
  activePlace=trigger;document.querySelector('#place-kind').textContent=currentRegion.name;
  document.querySelector('#place-name').textContent='장소 선택';
  const body=document.querySelector('#place-text');body.replaceChildren();
  places.forEach(p=>{const b=document.createElement('button');b.textContent=p.name+' · '+p.zh;b.onclick=()=>{dialog.close();openPlace(p,trigger);};body.append(b);});dialog.showModal();
}
function openPlace(place,trigger){
  document.querySelector('#place-kind').hidden=false;
  activePlace=trigger;document.querySelector('#place-kind').textContent=place.region;
  document.querySelector('#place-name').textContent=place.name+' · '+place.zh;
  document.querySelector('#place-text').textContent=place.text||'아직 기록이 없어.';dialog.showModal();
}
notesButton.addEventListener('click',()=>{
  activePlace=notesButton;
  const notes=REGION_NOTES.filter(note=>note.regionIds.includes(currentRegion.id));
  document.querySelector('#place-kind').hidden=true;
  document.querySelector('#place-name').textContent=`${currentRegion.name} 노트 ${notes.length}개`;
  const body=document.querySelector('#place-text');body.replaceChildren();
  if(notes.length){
    const list=document.createElement('ul');list.className='note-list';
    notes.forEach(note=>{const item=document.createElement('li');item.textContent=note.title;list.append(item);});
    body.append(list);
  }else body.textContent='아직 노트가 없어.';
  dialog.showModal();
});
back.addEventListener('click',()=>{
  if(currentRegion){if(zoomStack.length)renderRegion(zoomStack.pop());else renderHualien(currentRegion.id);}
  else renderTaiwan(true);
});
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>activePlace?.focus({preventScroll:true}));
new ResizeObserver(()=>{if(currentRegion&&!dialog.open)renderRegion(zoomBounds);}).observe(svg);
try {if(MAP_DATA.regions.length!==4)throw Error('Incomplete regions');renderTaiwan();}
catch(e){console.error('Map initialization failed',e);title.textContent='지도를 불러오지 못했어. 새로고침해 줘.';}
