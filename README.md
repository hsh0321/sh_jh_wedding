# 성현과 지현 · Invitation Archive

지금까지 제작한 청첩장 23종을 모아 체험하는 정적 사이트입니다.

- `/`: 전체 디자인 목록과 분류 필터
- `/try.html?design=winter-letter`: 이전/다음, 디자인 선택, 단독 열기를 지원하는 체험 화면
- `/wedding-original/index.html`: 기존 루트 청첩장을 보존한 경로
- `/wedding-editorial/index.html`: 에디토리얼
- `/wedding-blue-letter/index.html`: 블루 빈티지
- `/wedding-studio/`: 스튜디오 10종
- `/wedding-collection/`: 컬렉션 10종

HTML/CSS/JS 정적 파일로 구성됩니다. 기존 Cloudflare Git 연동의 루트 배포를 사용하며 별도 빌드가 필요 없습니다. ZIP 파일은 배포에서 제외합니다.

`node gallery/build.cjs`로 목록을 재생성하고 `node gallery/check.cjs`로 23종 경로와 정적 참조를 검사합니다. 원본 청첩장은 이전 이미지를 함께 사용하며 삭제된 사진 번호를 건너뛰도록 갤러리를 수정했습니다.
