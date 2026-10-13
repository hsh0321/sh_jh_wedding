# 성현과 지현 · With Love

프로젝트 루트의 정적 파일을 그대로 배포하는 모바일 청첩장입니다.

- `index.html`: 청첩장
- `style.css`, `motion.css`, `script.js`, `utilities.js`: 화면, 모션, 동작
- `assets/`: 청첩장 사진과 배경 음악
- `server.cjs`: 로컬 미리보기 서버 (`node server.cjs`)
- `wrangler.jsonc`: Cloudflare 정적 에셋 설정

사진 모음은 좌우 드래그와 이전/다음 버튼으로 탐색하며, 원본 사진 비율을 유지합니다. 확대 보기 기능은 제공하지 않습니다.

기존 디자인과 사용하지 않는 프로젝트 자료는 `archive/`의 ZIP 파일로 보관합니다. Cloudflare Pages에서 프로젝트 루트를 정적 에셋 디렉터리로 배포하면 됩니다.
