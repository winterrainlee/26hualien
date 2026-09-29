# 26hualien 기술 구조와 배포 결정

기준일: 2026-09-29

이 문서는 26hualien의 현재 기술 스택, 데이터와 생성물의 관계, 검증·배포 흐름, 그리고 GitHub Pages publishing source를 branch 방식에서 GitHub Actions 방식으로 바꾼 이유를 기록한다.

## 1. 프로젝트 성격

26hualien은 2026년 가을 화롄 체류 경험을 공간적으로 기록하는 개인용 모바일 웹 지도다.

핵심 요구는 다음과 같다.

- 모바일 세로 화면에서 가볍게 열린다.
- 서버나 데이터베이스 없이 오래 보존할 수 있다.
- 장소 좌표와 지역 경계는 실제 공간 관계를 유지한다.
- 노트와 장소 원본은 사람이 읽고 수정하기 쉬운 파일로 남긴다.
- 빌드 도구와 런타임 의존성을 가능한 한 작게 유지한다.
- 배포 전에 생성물 불일치와 JavaScript 파싱 오류를 자동으로 잡는다.

## 2. 현재 기술 스택

| 층 | 기술 | 역할 |
| --- | --- | --- |
| UI | HTML5 | 화면 구조와 dialog |
| 스타일 | CSS | 모바일 레이아웃, 지도·노트·팝업 표현 |
| 앱 로직 | Vanilla JavaScript | 지도 탐색, 클러스터, 장소 카드, 노트 읽기 |
| 지도 렌더링 | SVG | 대만·화롄·행정경계·장소 표시 |
| 장소 원본 | JSON | `data/places.json` |
| 경계 원본 | TopoJSON / GeoJSON | Taiwan Atlas 고정 데이터와 志學村 경계 |
| 노트 원본 | Markdown | `notes/*.md`, 1노트 1파일 |
| 생성 스크립트 | Python 3 표준 라이브러리 | 지도 투영·SVG path·노트 번들 생성 |
| 생성 데이터 | JavaScript | `map-data.js`, `neighbor-labels.js`, `notes.js` |
| 로컬 검증 | POSIX shell + Node.js | `scripts/check.sh`, `node --check`, 생성물 diff |
| 배포 빌드 | Python 3 표준 라이브러리 | `scripts/build_site.py`, 해시 기반 cache busting |
| CI/CD | GitHub Actions | 검증 성공 후 Pages artifact 배포 |
| 호스팅 | GitHub Pages | 정적 사이트 제공 |

브라우저 런타임에는 외부 JavaScript 라이브러리, 지도 SDK, 패키지 매니저, 서버 API가 필요하지 않는다.

## 3. 원본과 생성물

사람이나 에이전트가 직접 수정해야 하는 원본과, 스크립트가 만드는 생성물을 구분한다.

```text
data/places.json
data/taiwan-atlas-towns-10t.json
data/zhixue.geojson
        │
        └─ scripts/build_map.py
              ├─ map-data.js
              └─ neighbor-labels.js

notes/*.md
        │
        └─ scripts/build_notes.py
              └─ notes.js
```

### 원본

- 장소: `data/places.json`
- 지역·지도 경계: `data/`의 고정 지리 데이터
- 노트: `notes/*.md`

### 생성물

- `map-data.js`
- `neighbor-labels.js`
- `notes.js`

생성물도 저장소에 커밋한다. 이 선택은 GitHub에서 파일만 열어도 현재 브라우저 데이터가 보이고, 별도 빌드 환경 없이 소스 상태를 재현하기 쉽다는 장점이 있다.

대신 원본과 생성물이 어긋날 위험이 있으므로 CI가 매번 재생성한 뒤 `git diff --exit-code`로 일치 여부를 검사한다. 생성 스크립트를 돌리지 않고 원본만 바꾸면 검증이 실패한다.

## 4. 검증 흐름

로컬과 CI는 같은 명령을 사용한다.

```sh
sh scripts/check.sh
```

검증 순서는 다음과 같다.

```text
원본 읽기
  ↓
build_map.py
build_notes.py
  ↓
JavaScript node --check
  ↓
생성물 git diff 검사
  ↓
build_site.py
  ↓
_site/ 생성
```

이 구조는 두 종류의 사고를 특히 막는다.

### JavaScript 파싱 실패

2026-09-27에는 `app.js` 안에 리터럴 `\n`이 들어가 파싱 단계에서 JavaScript 전체가 실행되지 않았다. 런타임 오류 복구 코드는 파싱 이후에만 실행되므로 빈 SVG 화면을 막을 수 없었다.

현재는 `node --check`가 배포 전에 이 종류의 오류를 차단한다.

### 생성물 drift

원본과 생성 파일을 따로 수정하면 서로 다른 상태가 될 수 있다. CI는 생성 스크립트를 다시 실행하고 커밋된 결과와 비교한다.

이 자동화 도입 과정에서 실제로 志學新邨 대표점의 투영 Y 좌표가 수동 입력값 `218.25`와 스크립트 생성값 `218.24`로 0.01 어긋난 상태를 발견했다. 생성값으로 동기화한 뒤 검증이 통과했다.

## 5. 캐시 버스팅

이전에는 다음처럼 사람이 숫자를 올렸다.

```html
<script src="./app.js?v=17"></script>
```

이 방식은 파일을 수정하고 버전을 올리지 않는 실수가 가능하다. 실제로 `tests/mobile.html`의 버전 값이 뒤처진 적도 있었다.

현재 소스 `index.html`과 `tests/mobile.html`에는 수동 `?v=`를 두지 않는다.

배포 시 `scripts/build_site.py`가 핵심 CSS, JavaScript, 로컬 SVG 내용을 SHA-256으로 해시하고 앞 12자리를 배포 버전으로 사용한다.

예:

```text
app.js?v=a49d9a8efc49
style.css?v=a49d9a8efc49
```

파일 내용이 바뀌면 버전도 자동으로 바뀌므로 사람이나 에이전트가 캐시 숫자를 기억할 필요가 없다.

## 6. GitHub Pages: branch 배포에서 Actions 배포로 변경

### 이전 방식

```text
main / root
   ↓
GitHub Pages
```

장점은 매우 단순하다는 점이다. 그러나 현재 프로젝트에는 이미 지도·노트 생성 과정이 있으므로, 깨진 커밋도 그대로 publishing source에 들어갈 수 있다.

### 현재 방식

```text
main push
   ↓
GitHub Actions
   ↓
scripts/check.sh
   ├─ 생성물 재생성
   ├─ 생성물 drift 검사
   └─ JS 파싱 검사
   ↓
scripts/build_site.py
   ↓
_site/
   ↓
Pages artifact
   ↓
GitHub Pages
```

검증에 실패하면 deploy job은 실행되지 않는다.

GitHub Pages publishing source는 `workflow`를 사용한다. workflow는 기존 `legacy` 설정을 발견하면 GitHub Pages API로 `build_type: workflow` 전환을 수행하고, 이후부터는 이미 설정된 값을 그대로 사용한다.

## 7. 왜 GitHub Actions를 선택했는가

이 프로젝트가 단순한 HTML 파일 모음이라면 branch publishing이 더 단순하다. 그러나 현재는 다음 빌드 관계가 존재한다.

- `places.json → map-data.js / neighbor-labels.js`
- `notes/*.md → notes.js`
- 배포 시 content hash 기반 cache busting

따라서 배포 전에 반드시 실행해야 할 검증과 변환이 생겼다.

GitHub Actions를 선택한 이유는 다음과 같다.

1. **파싱 오류를 배포 전에 차단한다.**
2. **원본과 생성물의 불일치를 자동으로 검출한다.**
3. **캐시 버전 숫자를 사람이 관리하지 않는다.**
4. **검증이 성공한 결과물만 Pages에 올린다.**
5. 별도 서버나 외부 CI 서비스 없이 GitHub 저장소 안에서 끝난다.
6. npm 기반 프레임워크를 추가하지 않고 현재의 작은 정적 구조를 유지할 수 있다.

## 8. 현재 의도적으로 사용하지 않는 것

### 프런트엔드 프레임워크

React, Vue 등의 프레임워크를 사용하지 않는다. 현재 기능 규모에서는 상태 관리와 빌드 도구의 복잡도가 얻는 이득보다 크다.

### npm 빌드 체인

Node.js는 `node --check`를 위한 검증 도구로만 사용한다. 브라우저 코드 생성이나 번들링에 npm 패키지를 요구하지 않는다.

### 서버와 데이터베이스

모든 공개 데이터는 정적 파일이다. 개인 기록 지도라는 목적상 서버 상태를 운영할 필요가 없다.

### ES modules

현재 `map-data.js → notes.js → neighbor-labels.js → app.js`는 classic `defer` script 순서에 의존한다. `defer`는 문서 순서를 보장하므로 현재 동작에는 문제가 없지만 의존성이 코드에 명시되지는 않는다.

기능 규모가 커지면 ES module로 전환해 import 관계를 명시하는 것이 다음 구조 개선 후보다. 이번 배포 안전성 개선과는 별개의 리팩터링으로 남겨 둔다.

## 9. 운영 원칙

- 장소는 `data/places.json`을 먼저 수정한다.
- 노트는 `notes/*.md`를 먼저 수정한다.
- 생성 JS를 원본 대신 직접 수정하지 않는다.
- 커밋 전 가능하면 `sh scripts/check.sh`를 실행한다.
- CI 실패는 배포 실패로 취급하고 원인을 해결한 뒤 다시 커밋한다.
- `_site/`는 배포 산출물이므로 Git에 커밋하지 않는다.
- 단순함을 유지하되 사람이 기억해야 하는 반복 규칙은 자동화한다.

## 10. 관련 파일

- `.github/workflows/verify-and-deploy.yml`
- `scripts/check.sh`
- `scripts/build_site.py`
- `scripts/build_map.py`
- `scripts/build_notes.py`
- `docs/map-design-principles.md`
- `skills/publish-note/SKILL.md`
- `skills/publish-spot/SKILL.md`

GitHub 공식 참고 문서:

- GitHub Pages publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Pages REST API: https://docs.github.com/en/rest/pages/pages
