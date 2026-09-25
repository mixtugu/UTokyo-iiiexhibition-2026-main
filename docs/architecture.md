# 프로젝트 구조

## 실행 흐름

`index.html`과 `preview.html`은 같은 `src/main.ts`를 사용합니다. `renderApp()`이 저장소 내 HTML 조각을 조합하고 공통 제목과 내비게이션을 생성합니다. 이후 기능별 초기화 함수를 한 번 실행합니다. 라우터나 서버 상태 없이 단일 페이지로 동작합니다.

```text
HTML → main.ts → app/render.ts → sections + components + navigation
              → createWorks() → createWorkDialog() → initWorksGallery()
              → initArchives()
              → initMemberTransition()
              → initConceptStory(), initSmoothScroll()
              → initHeroParticles() → initConceptLiquid()
```

Hero는 `.birth-pin`을 생성하고 Concept Liquid가 그 요소에 배경을 연결합니다. Members는 Access를 앞에 배치하고 Members/Archives를 공통 스크롤 컨테이너로 감쌉니다. 이 초기화 순서와 DOM 계약을 바꿀 때는 스크롤·직접 앵커 진입을 검증해야 합니다.

## 책임과 재사용

| 위치                                         | 책임                                            |
| -------------------------------------------- | ----------------------------------------------- |
| `src/sections/*.html`                        | 문구, 이미지 대체 텍스트, 섹션 골격             |
| `src/components/section-heading.ts`          | 섹션 제목과 선택적 보조 문구                    |
| `src/components/work-card.ts`                | 갤러리·목록·로고 타일의 공통 이미지/레이블 생성 |
| `src/content/works.ts`                       | 실작품 데이터와 재현 가능한 임시 슬롯 생성      |
| `src/content/navigation.ts`                  | 헤더·푸터의 공통 링크 목록                      |
| `src/features/works/dialog.ts`               | 모달 상태, 열기·닫기, 포커스 복귀               |
| `src/features/works/gallery.ts`              | 필터, 검색, 목록/공간 뷰, 키보드·드래그 선택    |
| `src/features/archives/catalog.ts`           | 아카이브 로딩, 그룹별 표시, 프리뷰              |
| `src/features/{hero,concept,members,scroll}` | 기존 시각 효과와 스크롤 계산                    |
| `src/lib/dom.ts`                             | 필수 요소 조회, DOM 조각, Canvas 컨텍스트       |
| `src/lib/math.ts`                            | 공통 0–1 제한·보간 함수                         |

전역 `works`, `selected`, `dialog`, `openWork`는 제거했습니다. 갤러리는 작품 목록과 `WorkDialog` 인터페이스를 받아 동작하고, 모달의 선택 상태를 읽을 수 있으나 직접 변경하지 않습니다. 카드 콘텐츠는 DOM의 `textContent`와 속성으로 넣어 제목의 따옴표·HTML 문자가 마크업을 깨뜨리지 않게 합니다.

HTML 조각은 저장소에서 관리하는 신뢰된 마크업만 입력합니다. 외부 CMS 데이터를 `fragment()`나 `innerHTML`에 전달하지 마세요. 아카이브 JSON은 런타임에서 구조를 검증한 후 반영하며 실패하면 기존 3개 링크를 유지합니다.

## 스타일

`src/styles/main.css`에서 Tailwind 테마와 유틸리티, 디자인 CSS를 한 번만 불러옵니다. 기존 레이아웃을 유지하기 위해 Tailwind Preflight는 적용하지 않았습니다. 기본 디자인 CSS는 `components` 레이어, Tailwind 유틸리티는 그 뒤의 `utilities` 레이어입니다.

공통 컴포넌트는 Tailwind 클래스, 기존 레이아웃은 `@apply`와 디자인 CSS를 함께 사용합니다. 복잡한 sticky 배치, 반응형 조정, 입자/3D transform, 셰이더는 전용 코드에 남겨 두었습니다. Tailwind 테마는 `--color-paper`, `--color-ink`, `--color-accent`, `--font-display`, `--font-body`를 제공합니다.

스타일 순서는 tokens → base → atmosphere → concept → works → typography → members → design/layout입니다. 뒤의 선언이 기존 화면에서 덮어쓰던 순서를 보존합니다. 동적 Tailwind 클래스 문자열을 조합하면 탐지되지 않을 수 있으므로 완성된 클래스 문자열을 사용하세요.

## 수명과 확장 범위

각 initializer는 문서 로드당 한 번 실행하는 계약입니다. 동일 DOM에 중복 호출하지 마세요. 현재는 페이지 전체 이동/새로고침으로 정리되며, SPA 재마운트를 위한 cleanup API는 없습니다. 추후 라우터를 도입한다면 이벤트 해제, Observer 해제, RAF 취소와 WebGL 자원 정리를 함께 구현해야 합니다.

과거 실험은 `public/prototypes/`에 원형으로 보존하며 TypeScript·Tailwind 전환 대상인 현재 앱과 구분합니다. `public/`은 가공 없이 `dist/`에 복사되므로, 디자인 검토용 대형 이미지는 `docs/design-concepts/`에 보관합니다.

## 공통 디자인 설정

사이트 디자인 수치는 `src/design/tokens.css`, 실제 요소와의 연결은 `src/design/layout.css`와 `src/styles/typography.css`에서 관리합니다. 반응형 기준은 `@theme static`으로 정의하여 CSS와 Canvas가 공유합니다. Storybook은 실제 컴포넌트를 import하고 앱의 스크롤 효과는 초기화하지 않습니다. [디자인 설정·Storybook 안내](design-system.md)를 우선 참고하세요.
