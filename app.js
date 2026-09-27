const svg=document.querySelector("#map");
const title=document.querySelector("#title");
const subtitle=document.querySelector("#subtitle");
const hint=document.querySelector("#hint");
const back=document.querySelector("#back");
const dialog=document.querySelector("#place-dialog");

const places=[
 {id:"ndhu-back-gate",name:"동화대학 후문",zh:"東華大學後門",x:164,y:288,text:"테스트 기록이야. 자전거로 학교와 지학을 오가며 자주 지나게 되는 경계. 나중에는 이곳에 실제 경험과 사진을 차곡차곡 연결할 수 있어."},
 {id:"zhixue-station",name:"지학역",zh:"志學車站",x:205,y:335,text:"테스트 기록이야. 작은 역 하나가 생활권과 바깥세계를 이어 주는 지점. 이후에는 이곳에서 출발하거나 돌아온 이동의 기억도 함께 묶어볼 수 있어."}
];

function taiwan(){
 back.hidden=true;
 title.textContent="화롄에서 보낸 세 달";
 subtitle.textContent="대만 동부에서 내가 지나고 머문 공간의 기록.";
 hint.textContent="연록색 화롄을 눌러 들어가 봐.";
 svg.innerHTML=`
 <path class="land" d="M171 36 C205 61 221 103 226 145 C231 184 226 222 213 261 C199 302 181 343 162 384 C145 422 126 465 104 519 C87 506 76 486 78 459 C80 425 94 395 105 363 C117 328 122 292 126 254 C131 214 131 178 135 141 C139 100 145 61 171 36 Z"/>
 <path class="hualien" tabindex="0" role="button" aria-label="화롄현 열기" d="M206 126 C225 165 227 206 216 247 C205 287 188 327 170 366 C157 394 145 421 133 448 L116 425 C128 391 139 356 149 320 C161 278 172 239 181 199 C189 167 194 143 206 126 Z"/>
 <text class="label" x="181" y="285">花蓮</text>`;
 const h=svg.querySelector(".hualien");
 h.addEventListener("click",hualien);
 h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();hualien()}});
}

function hualien(){
 back.hidden=false;
 title.textContent="화롄현";
 subtitle.textContent="아직은 두 개의 점뿐. 여기서부터 경험이 쌓여 간다.";
 hint.textContent="점을 누르면 장소의 테스트 기록이 열려.";
 svg.innerHTML=`
 <path class="county" d="M228 35 C279 82 297 145 286 210 C277 267 248 314 223 361 C197 410 175 461 153 528 L104 487 C119 444 133 405 145 363 C159 315 171 269 181 220 C190 174 198 119 228 35 Z"/>
 <path d="M126 310 C151 302 179 306 211 323" fill="none" stroke="#d0d7cc" stroke-width="2" stroke-dasharray="4 6"/>
 <text class="label" x="218" y="100">花蓮縣</text>
 ${places.map(p=>`<g class="place" tabindex="0" role="button" aria-label="${p.name}" data-id="${p.id}" transform="translate(${p.x} ${p.y})"><circle r="8"/><text x="14" y="-2">${p.name}</text><text class="sub" x="14" y="13">${p.zh}</text></g>`).join("")}`;
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
taiwan();