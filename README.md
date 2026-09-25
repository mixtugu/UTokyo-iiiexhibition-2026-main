# iii Exhibition 2026

東京大学制作展 디자인·인터랙션 프로토타입입니다. **Node.js + TypeScript + Tailwind CSS + Vite**를 사용하며, 기존 통합 화면의 콘텐츠와 입자·스크롤 효과를 유지합니다. 브라우저 코드는 프레임워크에 의존하지 않는 TypeScript DOM 컴포넌트입니다. Node.js는 개발 서버, 빌드 및 검증에 사용하며 별도 API 서버는 없습니다.

## 시작하기

Node.js 24 사용을 권장합니다 (`.nvmrc`).

```sh
nvm use
npm ci
npm run dev
```

<http://127.0.0.1:4323/>를 엽니다. `/preview.html`도 같은 화면을 제공합니다. `nvm`을 사용하지 않으면 Node.js 24를 설치한 후 `npm ci`부터 실행합니다. HTML 직접 실행이나 소스 폴더의 Python 서버는 TypeScript를 처리하지 못하므로 Vite를 사용하세요.

## 디자인 조정과 컴포넌트 카탈로그

공통 디자인 설정은 [`src/design/tokens.css`](src/design/tokens.css)에 모았습니다. 좌우 여백, 최대폭, 8px 간격, 글자 크기·행간, 반응형 기준, 조작 영역, 이미지 크롭을 수정할 수 있습니다.

```sh
npm run storybook
```

<http://127.0.0.1:6006/>에서 실제 컴포넌트와 섹션을 확인하고 `Design / Tokens`의 Controls로 임시 조정합니다. 자세한 사용법은 [디자인 설정·Storybook 안내](docs/design-system.md)를 확인하세요.

## 명령어

| 명령                      | 용도                                            |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | 개발 서버와 변경 사항 자동 반영                 |
| `npm run typecheck`       | 엄격한 TypeScript 검사                          |
| `npm run build`           | 타입 검사 후 `dist/` 정적 사이트 생성           |
| `npm run preview`         | 빌드한 사이트를 로컬에서 확인                   |
| `npm run format`          | 소스·문서 형식 정리                             |
| `npm run format:check`    | 형식 검사                                       |
| `npm test`                | 빌드 결과를 대상으로 Playwright 브라우저 테스트 |
| `npm run storybook`       | 컴포넌트 카탈로그 개발 서버 (6006)              |
| `npm run storybook:build` | 카탈로그 정적 빌드 (`storybook-static/`)        |
| `npm run test:storybook`  | 빌드한 카탈로그 브라우저 검사                   |
| `npm run check`           | 형식·타입·빌드·브라우저 검사                    |

테스트 최초 실행 전 `npx playwright install chromium`을 실행합니다. Linux CI에서는 `npx playwright install --with-deps chromium`을 사용합니다.

## 구조

```text
src/
  app/          화면 구성
  components/   공통 제목, 카드, 헤더·푸터, 모달 마크업
  design/       8px 디자인 토큰, 공통 레이아웃 계약
  stories/      Storybook 컴포넌트·상태·설정 예제
  content/      작품 데이터, 내비게이션, 아카이브 폴백·검증
  features/     works, archives, hero, concept, members, scroll
  lib/          공통 DOM·Canvas·수학 함수
  sections/     섹션별 정적 콘텐츠
  styles/       Tailwind 진입점, 기본 디자인, 타이포그래피
  main.ts       명시적인 초기화 순서
  types.ts      콘텐츠 타입
public/
  assets/       이미지, 아카이브 JSON, 출처 문서
  design-concepts/ 실제 화면에서 사용하는 멤버 이미지
  prototypes/   이전 개별 시안 (보존용 HTML·JS·CSS)
  wireframe.html Figma 설명용 정적 화면
scripts/        선택적 Python 소재 제작 도구

docs/           구조·구현·검증·인수인계 안내, 디자인 시안
tests/         브라우저 회귀 테스트
```

- [구조와 의존성](docs/architecture.md)
- [구현·콘텐츠 수정 안내](docs/implementation.md)
- [테스트·빌드·배포 안내](docs/validation.md)
- [기존 자료와 공개 전 확인사항](docs/handoff.md)

기본 화면은 기존 `preview.html` 통합판입니다. 이전 `index.html` 개별 아카이브 시안은 `/prototypes/index.html`, 작품·콘셉트 시안은 `/prototypes/works.html`, `/prototypes/concept.html`에서 확인할 수 있습니다.

## 소재와 콘텐츠

작품 30개 중 실이미지는 2점이며 나머지는 임시 슬롯입니다. 회장 A/B 배정과 소개 문구도 임시입니다. 아카이브 29건의 출처·소재 권리는 [아카이브 안내](public/assets/archive/imported/README.md), [콘셉트 안내](public/assets/concept/README.md), [참고 자료 안내](public/assets/reference-layrid/README.md)를 확인하세요. 기존 자료의 상세 주의사항은 [인수인계 문서](docs/handoff.md)에 보존했습니다.
