# 구현과 콘텐츠 수정

## 작품 추가·교체

1. 이미지를 `public/assets/works/`에 저장합니다.
2. `src/content/works.ts`의 실작품 배열에서 `title`, `image`, `description`, `author`, `venue`를 입력합니다. URL은 `assets/works/example.png` 형태이며 `public/` 접두어를 넣지 않습니다.
3. 현재 생성기는 30점 조작 확인용입니다. 정식 데이터를 넣을 때는 임시 슬롯 생성 루프와 임시 회장 배정도 함께 제거/교체합니다. 이미지 2점 외 28점과 A/B 15점씩의 배정은 기존 프로토타입 그대로입니다.
4. 카드, 목록, 모달은 같은 데이터를 사용합니다. 갤러리 필터 수량은 실제 목록에서 계산합니다. 번호는 배열 순서에 따른 1부터 시작하는 표시 번호입니다.

```ts
const work: Work = {
  title: '作品名',
  author: '作者名',
  image: 'assets/works/example.png',
  description: '作品の説明',
  venue: '0', // '0': A, '1': B
};
```

검색은 제목·작가·두 자리 작품번호를 대소문자 구분 없이 비교합니다. 상세 화면의 다음 버튼은 현재 필터 결과를 따라가며 마지막 작품에서 비활성화됩니다.

## 섹션과 공통 UI

문구는 `src/sections/`의 해당 HTML을 수정합니다. 공통 제목은 다음 자리표시자를 사용합니다.

```html
<div data-section-heading="07 / EXAMPLE" data-section-note="補足説明"></div>
```

`renderApp()`이 이를 `sectionHeading()` 컴포넌트로 변환합니다. 새 섹션은 `app/render.ts`에 import하고 렌더링 순서에 포함합니다. 헤더·푸터 링크는 `content/navigation.ts`에서 관리합니다. 기존 `id`, 클래스, `data-venue`, 접근성 속성은 기능 모듈의 조회 계약이므로 변경 시 참조 코드를 함께 수정합니다.

재사용 UI는 `components/`, 기능 상태와 이벤트는 `features/`, 데이터는 `content/`, 여러 기능에서 쓰는 순수 계산은 `lib/`에 배치합니다. 기능을 추가할 때 파일 로드만으로 실행되는 코드를 쓰지 말고 initializer를 내보내 `main.ts`에서 호출합니다.

## Tailwind와 효과

일반적인 디자인 수치는 `src/design/tokens.css`에서 수정합니다. Tailwind 간격 한 단위는 이 프로젝트에서 **8px**입니다 (`gap-2` = 16px). 반응형은 `tablet:`, `desktop:`, `wide:`를 사용합니다. [디자인 설정·Storybook 안내](design-system.md)에서 적용 범위를 확인하세요.

새 레이아웃은 `flex`, `grid`, `gap-2`, `items-center`, `text-ink` 같은 정적 유틸리티 클래스를 우선 사용합니다. 기존 디자인 규칙에는 `@apply`를 사용할 수 있습니다. 전체 앱 스타일을 한 진입점에서 처리하므로 기능 CSS에서 Tailwind를 중복 import하지 않습니다.

- Hero: 로고 이미지를 점으로 샘플링하고 포인터·스크롤에 따라 이동합니다.
- Concept: 문단별 배경 전환은 WebGL로 그리며 미지원 시 CSS 배경을 사용합니다.
- Members: 이름 이미지의 점을 아카이브 윤곽선으로 이동합니다.
- Scroll: 마우스 휠만 보간합니다. 입력창·모달·터치·키보드는 기존 네이티브 동작을 유지합니다.

효과 변경 후 작은 화면, 키보드 이동, `prefers-reduced-motion`, 웹폰트·이미지 로딩 및 깊은 앵커 진입을 확인합니다. 현재 동작 감소 설정의 Members 구조는 초기 로딩 시 결정되므로 해당 설정을 바꿔 검토할 때 새로고침하세요.

## 아카이브와 소재

`public/assets/archive/imported/catalog.json`의 레코드는 `group`, `year`, `title`, `url`, 선택적 `image`를 사용합니다. `candidates`, `imageSource`는 출처 메타데이터로 보존되지만 UI에서는 사용하지 않습니다. URL은 HTTP(S), 연도는 문자열로 입력합니다.

`public/design-concepts/`에는 실제 사용 중인 멤버 원본만 있습니다. 나머지 시안은 `docs/design-concepts/`에서 확인합니다. `/wireframe.html`은 Figma 설명 자료이며 실제 인터랙션의 기준은 통합 앱입니다.

`scripts/*.py`는 원래 소재 생성 도구입니다. 출력 경로는 `public/assets/`로 조정했지만 일부는 `/tmp/iii-*.html` 같은 과거 입력 파일과 추가 Python 패키지가 필요합니다. npm 개발·빌드·테스트에는 사용하지 않습니다. 원본 입력과 출처를 확인한 경우에만 별도로 실행하세요.
