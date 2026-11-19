# 조선의 기억 — 사람들이 살아간 나라

## 실행 가능한 플레이 버전

퍼즐·레이싱·균형·곡식 분류/계량·리듬·관찰의 8개 미니게임을 구현했다. 각 장의 주민 대화와 결과 회고를 연결한 첫 플레이 버전이다. 전체 장편 RPG의 모든 탐험·대사·퀘스트를 완성한 최종판은 아니다.

```sh
npm start
```

출력되는 로컬 주소에서 실행한다. 별도 패키지 설치가 필요 없는 HTML/CSS/JavaScript다. `npm run build`는 배포용 dist를 만든다. 진행·기록·음소거 설정은 해당 브라우저에 저장된다.

- 마우스·터치·Tab/Enter 조작, 레이싱/균형의 방향키, 리듬 F/J 입력.
- 어려우면 놀이 중 '차근차근' 선택. 실제 참여 뒤 같은 이야기 결과를 얻는다.
- 화면 회전·탭 이탈은 일시정지. 실제 검증 범위는 [구현 검사 기록](docs/qa/IMPLEMENTATION-TEST.md)을 참조한다.
- 사용 자산: [자산 기록](docs/ASSETS.md).

초등학교 5학년 사회 교과서 78~103쪽을 바탕으로 만드는 싱글 탐험 RPG.

## 제작 문서
- [공통 기획서](docs/PROJECT.md)
- [세션 시작 지시문](docs/sessions/README.md)
- [작업 현황](docs/TASKS.md)
- [인계 사항](docs/HANDOFF.md)
- [챕터 구성](docs/CHAPTERS.md)
- [첫 공동 제작 결과와 교차검토](docs/qa/ch06-design-review.md)
- [곡식 창고 통합 계약](docs/gameplay/ch06-integration.md)
- [8장 캐주얼 미니게임 기획](docs/gameplay/CASUAL-MINIGAMES.md)
- [미니게임 공통 구현 계약](docs/gameplay/MINIGAME-SYSTEM.md)
- [미니게임 교차검토](docs/qa/casual-minigames-review.md)

현재 단계: 첫 플레이 버전 v0.1.0. 8장 미니게임과 공통 진행·결과·저장 화면을 구현했다. 이전 설계 검토 기록은 보존하며 실제 구현의 확인 범위는 IMPLEMENTATION-TEST.md에서 별도로 확인한다.

태블릿 한 화면 구성 / 컷신 영상 제외 / 주민 중심 사건 전달 / 독자 제작 자산.

별도 대화방 대신 사용자 승인에 따라 하위 에이전트 방식으로 작업했다. 검토 지적과 수정·재검토는 위 기록에서 확인할 수 있다. 실행 종료 후 자동 작업이 계속되는 것은 아니며, 다음 요청에서 최신 인계를 기준으로 재개한다.
