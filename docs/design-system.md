# 디자인 설정과 Storybook

디자인 수치는 확정값이 아닙니다. `src/design/tokens.css` 한 곳에서 사이트의 기본값과 화면 크기별 값을 조정합니다. 일반 여백은 8px 그리드로 정리했으며, 전체 배경은 화면을 채우고 콘텐츠만 최대폭 안에 정렬됩니다.

## 빠른 변경 안내

| 변경하려는 항목          | 공통 설정                                                                                                          | 적용 대상                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 좌우 여백                | `--page-gutter`                                                                                                    | 헤더, Hero, 본문 섹션, Concept 본문, Members/Archives 제목, 푸터 |
| 콘텐츠 최대폭            | `--content-max-width`                                                                                              | 위 영역의 좌우 안쪽 여백 계산                                    |
| 섹션 안쪽 여백           | `--section-space`                                                                                                  | 일반 섹션 및 고정 장면의 제목 영역                               |
| 제목 아래·콘텐츠 간 간격 | `--heading-gap`, `--content-gap`, `--grid-gap`                                                                     | 제목, 패널, 카드 목록, 검색·필터, 내비게이션                     |
| 제목·본문·주석           | `--type-display`, `--type-title`, `--type-heading`, `--type-body`, `--type-note`, `--type-label`, `--type-control` | 의미에 맞는 공통 글자 크기                                       |
| 행간                     | `--leading-display`, `--leading-heading`, `--leading-body`, `--leading-note`, `--leading-story`                    | 제목, 본문, 주석, Concept 문단                                   |
| 반응형 전환              | `--breakpoint-tablet`, `--breakpoint-desktop`, `--breakpoint-wide`                                                 | CSS 미디어 쿼리, Tailwind variants, Hero Canvas의 모바일 판단    |
| 버튼·링크 조작 영역      | `--control-min-size`, `--control-padding-block`, `--control-padding-inline`, `--menu-size`                         | 필터·링크·닫기·내비게이션·검색 입력                              |
| 작품 이미지 범위         | `--work-image-fit`, `--work-image-position`, `--work-image-ratio`                                                  | 작품 목록·카드·상세 이미지                                       |
| Hero 로고 위치·크기      | `--hero-logo-width`, `--hero-logo-height`, `--hero-logo-x`, `--hero-logo-y`                                        | Canvas 로고의 화면 대비 비율                                     |
| 배경 사진 초점           | `--background-focus-x`, `--background-focus-y`                                                                     | Concept WebGL와 CSS fallback의 크롭 기준                         |
| 그림의 표시 영역         | `--visual-height`, `--members-visual-width`, `--members-visual-top`, `--gallery-height`                            | 배경 pin, 멤버 그림, 갤러리                                      |
| 지도 크롭                | `--map-ratio`, `--map-image-width`, `--map-image-left`, `--map-image-top`                                          | 원본 자료 이미지에서 지도만 보여주는 영역                        |

예를 들어 다음 값만 바꾸면 여러 섹션이 같이 변합니다.

```css
:root {
  --page-gutter: 32px;
  --content-max-width: 1152px;
  --section-space: var(--space-10); /* 80px */
  --type-body: 18px;
  --leading-body: 1.9;
  --control-min-size: calc(var(--space-unit) * 7); /* 56px */
}
```

기본 제공 단계는 1, 2, 3, 4, 5, 6, 8, 10, 12입니다.

## 8px 그리드와 반응형 규칙

`--space-unit: 8px`를 기준으로 `--space-1`은 8px, `--space-2`는 16px입니다. Tailwind의 `--spacing`도 이 값을 사용하므로 **`gap-2`는 16px, `p-3`은 24px**입니다. Tailwind의 기본 4px 단위와 다르므로 새 클래스를 추가할 때 확인하세요.

기본 전환 폭은 스마트폰 `< 768px`, 태블릿 `768px 이상 ~ 1024px 미만`, PC `1024px 이상`입니다. 1920px 이상은 큰 화면용 타이틀 보정입니다. 경계값은 `tokens.css`의 `@theme static`에서만 수정합니다. `tablet:`, `desktop:`, `wide:` 유틸리티도 같은 값을 사용하며 기본 `sm:`, `md:`, `lg:`는 사용하지 않습니다.

미디어 쿼리에는 CSS `var()`를 직접 쓸 수 없으므로 `theme(--breakpoint-tablet)`로 빌드 시 값을 치환합니다. 단위는 `px`로 유지하세요. Canvas는 이 값을 `designNumber()`로 읽습니다. 갤러리의 `--gallery-compact-width`는 기기 분류가 아니라 **실제 갤러리 요소의 폭**에 따른 배치 기준입니다.

모바일·태블릿에서 덮어쓰는 기본값도 `tokens.css`에 있습니다. 전체를 바꾸려면 해당 미디어 블록을 함께 확인하세요. 화면 비율을 따르는 여백, 1px 테두리, 타이포그래피, 이미지 비율은 8px의 배수로 강제하지 않습니다.

## 스크롤 효과와 디자인 여백 구분

`--section-space`는 일반 섹션의 상하 안쪽 여백입니다. Hero/Concept/Members의 긴 스크롤 구간을 줄이기 위해 이 값을 사용하지 마세요. 해당 연출은 `--hero-journey-height`, `--members-journey-height`, `--story-paragraph-gap`, `--story-heading-gap`, `--story-ending-height`로 분리했습니다. 장면의 길이는 `svh` 단위이며 애니메이션 계산은 실제 요소 크기를 기준으로 동작합니다.

로고를 구성하는 420개 작은 타일은 일반 버튼의 최소 크기를 강제하면 그림이 깨지므로 예외입니다. 큰 작품 목록과 키보드 갤러리 경로를 함께 제공합니다. 글자 크기나 최소 조작 영역을 크게 변경하면 모바일 아카이브 내부 스크롤과 헤더를 확인하세요.

Canvas 크기·위치 설정은 레이아웃 변경 시 읽고 매 프레임 DOM 스타일을 조회하지 않습니다. CSS 설정을 편집한 뒤 입자 효과까지 확인할 때는 새로고침하세요. 배경 초점은 x/y 각각 0–1이고, 0은 왼쪽/위쪽, 1은 오른쪽/아래쪽입니다.

## Storybook 실행

```sh
npm ci
npm run storybook
```

<http://127.0.0.1:6006/>에서 확인합니다. 앱(`npm run dev`, 4323)과 다른 포트입니다. 자동으로 브라우저를 열지 않으며 종료는 실행한 터미널에서 `Ctrl+C`로 합니다. 포트가 사용 중이면 기존 터미널의 서버를 종료하거나 `npm run storybook -- --port 6008`을 사용하세요.

- **Design / Tokens**: 기본 디자인과 8px 스케일. `override`를 켜고 Controls에서 여백·최대폭·글자·조작 영역·이미지 크롭을 임시 조정합니다.
- **Components**: 실제 섹션 제목, 작품 카드(list/gallery/tile), 버튼, 상세 모달. 긴 제목·비활성화·임시 작품 상태를 포함합니다.
- **Layout / Navigation**: 실제 헤더·푸터 마크업과 같은 내비게이션 생성 함수.
- **Sections / Content**: 실제 Access·Donation 섹션을 개별 확인합니다.

Controls 값은 미리보기 안에서만 적용되며 파일에 저장되지 않습니다. 확정한 값은 `tokens.css`에 반영하세요. Viewport 도구의 390/820/1440px 프리셋은 대표 화면 크기이며 사이트의 반응형 경계값을 정의하지 않습니다.

Storybook 전용 테두리·샘플 배치는 `src/stories/catalog.css`에 있으며 실제 컴포넌트 모양은 앱 CSS를 그대로 사용합니다. Storybook은 페이지 전체의 스크롤 초기화를 실행하지 않습니다. Hero/Concept/Members의 실제 연출은 앱에서 확인하세요. 브라우저에서 입력하는 설정은 해당 story에만 적용되므로 다른 story와 사이트에 남지 않습니다.

## 파일 책임

- `src/design/tokens.css`: 디자이너와 개발자가 바꾸는 기본값, 반응형 값.
- `src/design/layout.css`: 토큰을 실제 페이지 요소에 연결하는 규칙. 값 조정만 할 때는 수정할 필요가 없습니다.
- `src/styles/typography.css`: 의미별 글자 크기와 행간 연결.
- `src/design/read-tokens.ts`: CSS 값을 Canvas 코드에서 읽는 경계.
- `.storybook/`: 카탈로그 설정과 공통 스타일/폰트 로딩. 앱의 Vite 빌드 설정을 공유하지 않아 다중 HTML 진입점이 섞이지 않습니다.
- `src/stories/`: 실제 컴포넌트를 import하는 예제와 Controls. 앱 빌드에는 포함되지 않습니다.

## 검사와 공유

```sh
npm run check           # 앱 형식·타입·빌드·브라우저 회귀
npm run storybook:build # storybook-static/ 생성
npm run test:storybook  # 위 산출물을 대상으로 카탈로그 브라우저 검사
```

사이트 배포 대상은 기존처럼 `dist/`, 컴포넌트 카탈로그 공유 대상은 별도의 `storybook-static/`입니다. Storybook의 Docs UI는 앱보다 큰 별도 번들을 사용하며 앱 산출물에는 들어가지 않습니다. 실제 배포는 수행하지 않습니다.

기술 참고: [Storybook Vite 설정](https://storybook.js.org/docs/builders/vite), [Tailwind 테마](https://tailwindcss.com/docs/theme), [Tailwind 반응형 규칙](https://tailwindcss.com/docs/responsive-design).
