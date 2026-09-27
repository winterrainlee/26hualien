const svg = d3.select("#map");
const title = document.querySelector("#title");
const subtitle = document.querySelector("#subtitle");
const hint = document.querySelector("#hint");
const back = document.querySelector("#back");
const dialog = document.querySelector("#place-dialog");

const ATLAS_URL = "https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/counties-10t.json";
const TOWNS_URL = "https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/towns-10t.json";
let atlas;
let nation;
let hualienCounty;\nlet hualienTowns = [];

const places = [
  {
    id: "ndhu-back-gate",
    name: "동화대학 후문",
    zh: "東華大學後門",
    lon: 121.537278,
    lat: 23.905151,
    text: "테스트 기록이야. 자전거로 학교와 지학을 오가며 자주 지나게 되는 경계. 나중에는 이곳에 실제 경험과 사진을 차곡차곡 연결할 수 있어."
  },
  {
    id: "zhixue-station",
    name: "지학역",
    zh: "志學車站",
    lon: 121.52949,
    lat: 23.90756,
    text: "테스트 기록이야. 작은 역 하나가 생활권과 바깥세계를 이어 주는 지점. 이후에는 이곳에서 출발하거나 돌아온 이동의 기억도 함께 묶어볼 수 있어."
  }
];

function setText(main, sub, help) {
  title.textContent = main;
  subtitle.textContent = sub;
  hint.textContent = help;
}

function projectionFor(feature, padding = 42) {
  return d3.geoMercator().fitExtent(
    [[padding, padding], [360 - padding, 560 - padding]],
    feature
  );
}

function renderTaiwan() {
  back.hidden = true;
  setText(
    "화롄에서 보낸 세 달",
    "대만 동부에서 내가 지나고 머문 공간의 기록.",
    "연록색 화롄을 눌러 들어가 봐."
  );

  const projection = projectionFor(nation, 52);
  const path = d3.geoPath(projection);
  svg.selectAll("*").remove();

  svg.append("path")
    .datum(nation)
    .attr("class", "land")
    .attr("d", path);

  const h = svg.append("path")
    .datum(hualienCounty)
    .attr("class", "hualien")
    .attr("d", path)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", "화롄현 열기");

  const labelPoint = projection([121.47, 23.75]);
  svg.append("text")
    .attr("class", "label")
    .attr("x", labelPoint[0])
    .attr("y", labelPoint[1])
    .text("花蓮");

  h.on("click", renderHualien)
   .on("keydown", event => {
     if (event.key === "Enter" || event.key === " ") {
       event.preventDefault();
       renderHualien();
     }
   });
}

function renderHualien() {
  back.hidden = false;
  setText(
    "화롄현 花蓮縣",
    "아직은 두 개의 점뿐. 여기서부터 경험이 쌓여 간다.",
    "점을 누르면 장소의 테스트 기록이 열려."
  );

  const projection = projectionFor(hualienCounty, 42);
  const path = d3.geoPath(projection);
  svg.selectAll("*").remove();

  svg.append("path")
    .datum(hualienCounty)
    .attr("class", "county")
    .attr("d", path);

  svg.append("g")
    .attr("class", "town-boundaries")
    .selectAll("path")
    .data(hualienTowns)
    .join("path")
    .attr("class", "town-boundary")
    .attr("d", path);

  places.forEach((p, i) => {
    const [x, y] = projection([p.lon, p.lat]);
    const g = svg.append("g")
      .attr("class", "place")
      .attr("transform", `translate(${x},${y})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", p.name)
      .on("click", () => openPlace(p.id))
      .on("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPlace(p.id);
        }
      });

    g.append("circle").attr("r", 8);
    const dy = i === 0 ? -9 : 25;
    g.append("text").attr("x", 14).attr("y", dy).text(p.name);
    g.append("text").attr("class", "sub").attr("x", 14).attr("y", dy + 14).text(p.zh);
  });
}

function openPlace(id) {
  const p = places.find(v => v.id === id);
  document.querySelector("#place-kind").textContent = "PLACE · 壽豐";
  document.querySelector("#place-name").textContent = `${p.name} · ${p.zh}`;
  document.querySelector("#place-text").textContent = p.text;
  dialog.showModal();
}

async function loadHualienTowns() {
  try {
    const townAtlas = await d3.json(TOWNS_URL);
    if (!townAtlas?.objects?.towns) throw new Error("Town boundaries missing");

    const towns = topojson.feature(townAtlas, townAtlas.objects.towns);
    hualienTowns = towns.features.filter(f =>
      String(f.properties?.COUNTYCODE) === "10015"
    );

    if (!hualienTowns.length) {
      throw new Error("No Hualien towns found");
    }

    // If the user is already on the Hualien view, redraw it with boundaries.
    if (!back.hidden) renderHualien();
  } catch (error) {
    console.warn("Town boundaries unavailable; base map remains usable.", error);
    hualienTowns = [];
  }
}

async function init() {
  try {
    hint.textContent = "지도를 불러오는 중…";
    atlas = await d3.json(ATLAS_URL);

    if (!atlas?.objects?.nation || !atlas?.objects?.counties) {
      throw new Error("Taiwan Atlas objects missing");
    }

    nation = topojson.feature(atlas, atlas.objects.nation);
    const counties = topojson.feature(atlas, atlas.objects.counties);
    hualienCounty = counties.features.find(f =>
      String(f.properties?.COUNTYCODE) === "10015"
    );

    if (!hualienCounty) {
      // Compatibility fallback for atlas variants.
      hualienCounty = counties.features.find(f =>
        String(f.properties?.COUNTYNAME || "").includes("花蓮")
      );
    }

    if (!hualienCounty) throw new Error("Hualien county not found");

    // Render the known-good map first. Town boundaries must never block it.
    renderTaiwan();
    loadHualienTowns();
  } catch (error) {
    console.error("Base map failed:", error);
    svg.selectAll("*").remove();
    hint.textContent = "기본 지도 데이터를 불러오지 못했어.";
  }
}

back.addEventListener("click", renderTaiwan);
dialog.querySelector(".close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

init();
