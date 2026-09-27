# 26hualien

2026년 가을, 화롄에서 보낸 세 달의 경험을 공간으로 기록하는 모바일 웹 지도 시제품.

## 설계 기준

[지역 탐색과 기록 구성 원칙](docs/map-design-principles.md)에 이후 구현 기준을 정리했다. 학교·시가지·소우펑·루이수이로 시작하고, 여행지가 늘어나면 지역을 추가한다. 네 지역의 실제 행정경계 확대와 장소 탐색을 구현했다.

## 현재 시제품

- 대만 **본섬**의 실제 윤곽과 연록색 화롄현.
- 화롄현을 누르면 실제 현 외곽과 13개 鄉·鎮·市의 내부 경계를 표시한다. 행정구역은 클릭 대상이 아니다.
- 현 지도에서는 학교(志學村)·시가지(花蓮市)·소우펑(壽豐鄉)·루이수이(瑞穗鄉)를 선택한다. 지역 확대 후 연결된 장소를 표시한다. 학교와 지학역은 학교에 연결하고 소우펑은 빈 지역으로 시작한다.
- 제목 아래 보조 문구와 지도 아래 안내 문구, 점 연결선은 표시하지 않는다.
- 장소 표시 오프셋은 사용하지 않는다. 52 CSS 픽셀 이내의 가까운 점은 묶음으로 표시하고 클릭하면 확대한다. 모든 구성점 쌍의 거리를 제한해 연쇄 묶음을 방지한다.
- 동화대학은 후문이 아닌 壽豐 캠퍼스 대표점이다. `kind: area`, `childMap: {id: ndhu-campus, status: planned}`로 캠퍼스 지도 연결 계획을 기록했다. 현재는 장소 카드를 열며, 캠퍼스 경계·건물 지도가 준비되면 이 식별자를 사용하는 하위 화면으로 연결한다.
- 새 장소에는 방문 경험을 임의로 작성하지 않았다. 기록이 없는 카드는 빈 상태 문구를 보여 준다.
- 정적 HTML/CSS/JS + SVG. 브라우저에서 외부 라이브러리나 지도 데이터를 다운로드하지 않는다.

## 지도 출처와 재생성

[Taiwan Atlas 2021.9.20](https://github.com/dkaoster/taiwan-atlas)의 [towns-10t.json](https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/towns-10t.json)을 `data/taiwan-atlas-towns-10t.json`에 고정했다. 원자료는 대만 내정부 [鄉鎮市區界線(TWD97經緯度)](https://data.gov.tw/dataset/7441)이며, Atlas에서 양자화·단순화한 경계다. 2026년 실시간 행정경계라는 의미는 아니다. 배포 패키지의 MIT 라이선스는 `data/LICENSE-taiwan-atlas.txt`에 보존했다.

동일한 topology에서 본섬(가장 큰 육지 polygon), 화롄현(COUNTYCODE=10015), 그 안의 공유 경계를 추출한다. Mercator 투영을 각 화면에 맞추고 SVG 좌표 소수 둘째 자리까지 저장한다. 윤곽을 수작업으로 그리거나 임의로 수정하지 않는다.

```sh
python3 scripts/build_map.py
node --check map-data.js
node --check app.js
```

빌드 도구는 Python 표준 라이브러리만 사용한다. `map-data.js`는 생성 결과다. 장소 데이터는 `data/places.json`에서 관리한다.

## 검증

`tests/mobile.html`은 실제 페이지를 375×812 및 320×740 CSS 픽셀의 iframe viewport에 로드한다. 배포 후 이 페이지에서 첫 화면 → 화롄 → 각각의 장소 → 닫기 → 대만으로 흐름을 직접 확인한다. `Inspect layout and network`는 실제 자식 문서의 viewport, 넘침, 경계 크기, 클릭 대상, Resource Timing의 요청 상태를 표시한다. 로컬 `file:`에서는 보안 정책으로 이 진단 버튼만 제한될 수 있다. 브라우저 콘솔 오류도 별도로 확인한다.

2026-09-27 장애 원인은 `app.js`의 `let hualienCounty;\\nlet ...`처럼 코드에 들어간 리터럴 역슬래시+n으로 인한 구문 오류였다. `index.html`에도 같은 문자가 있었다. 이전의 오류 복구 처리보다 먼저 파싱이 실패해 빈 SVG만 표시됐다.

## 배포

GitHub Pages: `main / root`. 빌드 서버나 npm 설치가 필요 없다.

## 장소 좌표 출처

`data/places.json`의 `source`에 각 장소 출처를 보존했다. 화롄·루이수이 역은 성공대 문사맥류 자료, 농회 시장은 농업이지유의 중산로 126호 농회 신선식품·농산물 매장 지도 좌표, 우허 차 지구는 관공서의 舞鶴觀光茶園 대표 좌표를 사용했다. 동화대학은 대학 지속가능성 보고서의 壽豐校區 대표 좌표(121.55, 23.90)를 사용한다. 구역 대표점은 정확한 영역 경계라는 의미가 아니다.

志學村 경계는 같은 버전의 `villages-10t.json`에서 VILLCODE=10015060011을 추출한 `data/zhixue.geojson`이다. 출처 URL은 GeoJSON properties에 보존한다.

## 지역 노트와 아이콘

`notes.js`의 `REGION_NOTES`는 장소와 별도로 관리하며 `regionIds`의 현재 범주에 연결된 노트만 센다. 우하단 노트 수 버튼을 누르면 불렛 목록을 연다. 현재 루이수이의 세 항목은 테스트용이며 다른 지역은 0개다.

기차 아이콘은 [Lucide train-front](https://lucide.dev/icons/train-front)의 SVG를 2026-09-27에 받아 색상만 변경했다. 원본은 https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/train-front.svg 이며 라이선스는 `assets/LICENSE-lucide.txt`에 보존한다.
