# 26hualien

2026년 가을, 화롄에서 보낸 세 달의 경험을 공간으로 기록하는 모바일 웹 지도 시제품.

- 대만 **본섬**의 실제 윤곽과 연록색 화롄현.
- 화롄현을 누르면 실제 현 외곽과 13개 鄉·鎮·市의 내부 경계를 표시한다. 행정구역은 클릭 대상이 아니다.
- 동화대학 후문 / 東華大學後門, 지학역 / 志學車站만 테스트 기록 카드를 연다.
- 현 전체 축척에서 두 장소의 좌표 간격은 약 2.8 SVG 단위다. 연결선의 지도 쪽 끝이 원래 좌표이며, 누르는 점과 이름만 벌려 표시한다. 장소 좌표와 테스트 본문은 기존 버전 그대로 보존했다.
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
