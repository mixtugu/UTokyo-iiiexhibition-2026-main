# 검증과 배포

## 자동 검사

```sh
npm ci
npx playwright install chromium
npm run check
```

Playwright는 별도 포트 `4325`에서 실제 `dist/` 빌드 결과를 테스트합니다. 데스크톱 Chromium, 모바일 Chromium 에뮬레이션, 동작 감소 설정으로 다음을 확인합니다.

- 30개 작품, 420개 로고 타일, 29개 아카이브 로딩
- 화면의 이미지 로딩, 내부 요청 오류, 런타임 오류, 가로 넘침
- 회장별 15점 필터, 제목·번호 검색, 빈 결과
- 목록과 모달, 다음 작품, 마지막 항목 비활성화, 닫기와 포커스 복귀
- 키보드 갤러리 선택, 아카이브 앵커 및 키보드 프리뷰
- 아카이브 요청 실패 시 기본 3개 링크 유지

CI는 `.github/workflows/ci.yml`에서 동일 검사를 수행합니다. 실패한 테스트의 trace는 `test-results/` 또는 CI artifact에서 확인합니다. 테스트 결과와 빌드 산출물은 Git에 포함하지 않습니다.

## 화면 비교와 수동 확인

최초 TypeScript 전환 시 기존 통합판과 새 앱을 1440px 및 390px 너비, 900px 높이, 동작 감소 설정에서 비교했습니다. 7개 섹션의 위치·높이와 작품/아카이브 개수가 동일했습니다. 이후 디자인 토큰 정리에서는 여백·조작 영역을 8px 기준으로, 반응형 기준을 768/1024px로 조정했으므로 당시의 픽셀 배치와 같지는 않습니다. 실제 기기의 터치 반응, GPU 부하, Safari·Firefox 및 스크린리더 동작은 별도로 확인해야 합니다. 모바일 테스트는 실제 iOS Safari가 아닌 Chromium 에뮬레이션입니다.

움직이는 Canvas는 매 프레임 달라지므로 단순 스크린샷만으로 효과 보존을 단정하지 않습니다. 효과를 수정할 때 Hero → Concept, Members → Archives 전환과 목록/공간 뷰 전환을 함께 확인하세요.

## 정적 사이트 배포

```sh
npm run build
npm run preview
```

서버에는 **`dist/` 내용 전체**를 배포합니다. 소스 루트를 그대로 게시하는 이전 방식은 사용할 수 없습니다. Vite의 `base: './'` 설정과 상대 소재 URL은 루트 및 GitHub Pages 같은 하위 경로 배포를 지원합니다. `/preview.html`은 호환 진입점으로 함께 빌드됩니다. 디렉터리 배포 URL은 `/project/`처럼 끝에 `/`를 붙입니다.

GitHub Pages를 사용한다면 저장소 설정에서 GitHub Actions 빌드 결과를 게시하도록 구성하거나 `dist/`를 게시 브랜치에 올리는 별도 배포 작업을 연결하세요. 이번 변경은 검증 CI만 추가하며 자동 배포나 원격 게시를 실행하지 않습니다. 기존 README에 적힌 외부 저장소의 push 자동 게시 여부는 이 체크아웃에서 확인되지 않았습니다.

보존된 `/prototypes/`와 `/wireframe.html`도 `public/`에 있으므로 빌드에 포함됩니다. 정식 공개에서 제외할 경우 자료를 `docs/`로 이동하고 문서 링크를 함께 갱신하세요.

## 기술 문서

- [Vite 개발·빌드 안내](https://vite.dev/guide/)
- [Tailwind Vite 통합](https://tailwindcss.com/docs/installation/using-vite)
- [Tailwind Preflight와 선택적 import](https://tailwindcss.com/docs/preflight)

## 디자인 토큰과 카탈로그 검사

앱 테스트는 공통 설정 변경 시 실제 섹션 여백, 최대폭, 본문/주석, 조작 영역, 이미지 크롭이 함께 변하는지 검증합니다. 반응형 경계 바로 전후도 확인합니다. `npm run storybook:build && npm run test:storybook`은 모든 story의 렌더링·이미지, Controls 적용과 초기화, 모달 조작, 모바일 긴 문구를 확인합니다. 자세한 사용법은 [디자인 안내](design-system.md)를 참고하세요.
