const svg=document.querySelector("#map");
const title=document.querySelector("#title");
const subtitle=document.querySelector("#subtitle");
const hint=document.querySelector("#hint");
const back=document.querySelector("#back");
const dialog=document.querySelector("#place-dialog");

const GEO_URL="https://raw.githubusercontent.com/ronnywang/twgeojson/master/twcounty2010.2.json";
let geo=null;

const places=[
 {id:"ndhu-back-gate",name:"동화대학 후문",zh:"東華大學後門",lon:121.537278,lat:23.905151,text:"테스트 기록이야. 자전거로 학교와 지학을 오가며 자주 지나게 되는 경계. 나중에는 이곳에 실제 경험과 사진을 차곡차곡 연결할 수 있어."},
 {id:"zhixue-station",name:"지학역",zh:"志學車站",lon:121.52949,lat:23.90756,text:"테스트 기록이야. 작은 역 하나가 생활권과 바깥세계를 이어 주는 지점. 이후에는 이곳에서 출발하거나 돌아온 이동의 기억도 함께 묶어볼 수 있어."}
];

const validRing=r=>r.length>=4 && new Set(r.map(p=>p.join(","))).size>=3;
const rings=f=>{
 const g=f.geometry;
 if(g.type==="Polygon") return g.coordinates.filter(validRing);
 if(g.type==="MultiPolygon") return g.coordinates.flat().filter(validRing);
 return [];
};
const bounds=features=>{
 const pts=features.flatMap(f=>rings(f).flat());
 return [Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
};
function projector(b,pad=35){
 const [minX,minY,maxX,maxY]=b,w=360,h=560;
 const s=Math.min((w-pad*2)/(maxX-minX),(h-pad*2)/(maxY-minY));
 const ox=(w-(maxX-minX)*s)/2, oy=(h-(maxY-minY)*s)/2;
 return ([x,y])=>[ox+(x-minX)*s,oy+(maxY-y)*s];
}
function pathFor(f,project){
 return rings(f).map(r=>r.map((p,i)=>{const [x,y]=project(p);return `${i?"L":"M"}${x.toFixed(1)},${y.toFixed(1)}`}).join(" ")+" Z").join(" ");
}
function mainIslandFeatures(){
 return geo.features.filter(f=>{
   const b=bounds([f]);
   return b[0]>119.9 && b[2]<122.1 && b[1]>21.7 && b[3]<25.5;
 });
}
async function loadGeo(){
 try{
   const r=await fetch(GEO_URL);
   if(!r.ok) throw new Error("map data");
   geo=await r.json();
   taiwan();
 }catch(e){
   hint.textContent="지도 데이터를 불러오지 못했어. 새로고침해 봐.";
 }
}

function taiwan(){
 back.hidden=true;
 title.textContent="화롄에서 보낸 세 달";
 subtitle.textContent="대만 동부에서 내가 지나고 머문 공간의 기록.";
 hint.textContent="연록색 화롄을 눌러 들어가 봐.";
 if(!geo){svg.innerHTML="";return}
 const fs=mainIslandFeatures();
 const project=projector(bounds(fs),48);
 svg.innerHTML=fs.map(f=>{
   const isH=f.properties.county==="花蓮縣";
   return `<path class="${isH?"hualien":"land"}" ${isH?'tabindex="0" role="button" aria-label="화롄현 열기"':""} d="${pathFor(f,project)}"/>`;
 }).join("")+`<text class="label hualien-label" x="232" y="272">花蓮</text>`;
 const h=svg.querySelector(".hualien");
 h.addEventListener("click",hualien);
 h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();hualien()}});
}

function hualien(){
 back.hidden=false;
 title.textContent="화롄현";
 subtitle.textContent="아직은 두 개의 점뿐. 여기서부터 경험이 쌓여 간다.";
 hint.textContent="점을 누르면 장소의 테스트 기록이 열려.";
 const f=geo.features.find(v=>v.properties.county==="花蓮縣");
 const b=bounds([f]);
 const project=projector(b,45);
 const [lx,ly]=project([121.52,24.22]);
 svg.innerHTML=`<path class="county" d="${pathFor(f,project)}"/><text class="label" x="${lx}" y="${ly}">花蓮縣</text>`+
 places.map((p,i)=>{
   const [x,y]=project([p.lon,p.lat]);
   const dy=i===0?-8:22;
   return `<g class="place" tabindex="0" role="button" aria-label="${p.name}" data-id="${p.id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="8"/><text x="14" y="${dy}">${p.name}</text><text class="sub" x="14" y="${dy+14}">${p.zh}</text></g>`;
 }).join("");
 svg.querySelectorAll(".place").forEach(el=>{
   const open=()=>openPlace(el.dataset.id);
   el.addEventListener("click",open);
   el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
 });
}

function openPlace(id){
 const p=places.find(v=>v.id===id);
 document.querySelector("#place-kind").textContent="PLACE · 壽豐";
 document.querySelector("#place-name").textContent=`${p.name} · ${p.zh}`;
 document.querySelector("#place-text").textContent=p.text;
 dialog.showModal();
}
back.addEventListener("click",taiwan);
dialog.querySelector(".close").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog) dialog.close()});
hint.textContent="지도를 불러오는 중…";
loadGeo();