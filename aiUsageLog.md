# AI Usage Log

## Date

2026-08-02

## Task

`/custom-topic` (추억 주제 제안) 및 `/journal` (회상 답변 작성) 페이지에서 사진/지면 업로드 시 사진 설명(추억 메모) 덧붙이기 기능 추가.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

사용자가 옛 사진이나 기록 지면을 올릴 때 사진 속 인물/장소/상황에 대한 메모나 설명을 덧붙여 함께 제출할 수 있도록 하여 AI 질문 생성 및 회상 기록 보관의 정밀도를 향상함.

## Outcome

* `app/custom-topic/page.tsx`: 사진 업로드 시 사진 설명 입력란 추가 및 OCR 텍스트와 합성하여 AI 질문 생성 및 초기 기록으로 저장.
* `app/journal/page.tsx`: 사진/지면 업로드 시 사진 설명 입력란 추가 및 OCR 판독문과 깔끔하게 조합하여 답변 기록으로 저장.
* Next.js 빌드(`npm run build`) 통과 및 타입 안정성 확보.

## Files

* [app/custom-topic/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/custom-topic/page.tsx)
* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx)

---

## Date

2026-08-02

## Task

API 라우트 내 하드코딩된 mockEntities를 Agent 1 (`ocrExtractorAgent`) 기반 실데이터 엔티티 동적 추출 로직으로 전면 교체.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

사용자가 실제로 작성한 회상 답변(`answer_text`)으로부터 11가지 엔티티(인물, 장소, 사물, 음식 등)를 동적으로 추출하여 나이테/공유 마인드맵 분석 및 AI 개인화 회상 질문 생성에 실데이터 반영.

## Outcome

* `lib/agents/ocr-extractor-agent.ts`: 답변 배열(`DBAnswer[]`)로부터 엔티티를 추출하고 `sourceAnswerId` 및 타임스탬프를 매핑하는 `extractFromAnswers` 메서드 구현.
* `/api/questions`, `/api/narrative`, `/api/mindmap` 라우트: 하드코딩된 `mockEntities` 제거 후 `ocrExtractorAgent.extractFromAnswers(answers)`를 연동하여 실데이터 엔티티 기반 마인드맵 분석 및 질문 생성 수행.
* Next.js 빌드(`npm run build`) 통과 및 타입 안정성 확보.

## Files

* [lib/agents/ocr-extractor-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/ocr-extractor-agent.ts)
* [app/api/questions/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/route.ts)
* [app/api/narrative/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/narrative/route.ts)
* [app/api/mindmap/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/mindmap/route.ts)

---

## Date

2026-07-31

## Task

이음 (EEUM) 플랫폼 초기 프로젝트 구성, 4-에이전트(OCR Extractor, Question Generator, Narrative Builder, Safety Guard) 파이프라인 개발 및 연동, 모바일 퍼스트 선형 UI 및 커스텀 나이테 SVG 구현, 에이전트 검증용 통합 테스트 작성.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder, Researcher

## Purpose

신규 프로젝트 부트스트랩, Upstage & Gemini SDK & Supabase 연동 로직 설계, 비의료 진단 원칙을 우회 불가하게 강제하는 Safety Guard 에이전트 설계, 노년층 사용성을 고려한 디자인 컴포넌트 및 concentric wood rings SVG 시각화 구현.

## Outcome

* Next.js 16 (React 19) 환경 빌드 정상 동작 및 PWA 지원 서비스 워커 세팅 완료.
* 4-에이전트 파이프라인 통합 완료 (OCR 엔티티 추출, 비약물적 질문 유도, 서사 챕터 군집화 및 관점 병합, 의료 진단/처방 차단 검수).
* 로컬 테스트 검증용 테스트 스크립트 작성 및 4개 에이전트 검증 통과(Pass).
* 모바일 퍼스트 스타일 및 데스크톱 2분할 뷰 나이테 연대기 UI 완벽 구현.

## Files

* [package.json](file:///c:/Users/PC/Desktop/Projects/EEUM/package.json)
* [public/manifest.json](file:///c:/Users/PC/Desktop/Projects/EEUM/public/manifest.json)
* [public/sw.js](file:///c:/Users/PC/Desktop/Projects/EEUM/public/sw.js)
* [app/layout.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/layout.tsx)
* [app/globals.css](file:///c:/Users/PC/Desktop/Projects/EEUM/app/globals.css)
* [app/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/page.tsx)
* [app/role-selection/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/role-selection/page.tsx)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx)
* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx)
* [app/journal/complete/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/complete/page.tsx)
* [app/narrative/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/page.tsx)
* [components/Button.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/Button.tsx)
* [components/Input.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/Input.tsx)
* [components/PWARegister.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/PWARegister.tsx)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts)
* [services/upstage-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/upstage-service.ts)
* [services/gemini-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/gemini-service.ts)
* [lib/agents/ocr-extractor-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/ocr-extractor-agent.ts)
* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts)
* [lib/agents/narrative-builder-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/narrative-builder-agent.ts)
* [lib/agents/safety-guard-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/safety-guard-agent.ts)
* [types/index.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/types/index.ts)
* [tests/test-agents.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-agents.ts)

* API 키(Supabase, Gemini, Upstage)가 로컬 환경에 구성되지 않은 데모 구동 상황을 대비하여, LocalStorage 및 하드코딩 기반 모의 데이터 Fallback 메커니즘을 수립해 오프라인에서도 완전한 파이프라인 검증이 가능하도록 설계했습니다.
* Safety Guard가 작동하여 유발한 Fallback 문장에 대한 자동 우회 방지 기법을 테스트하여 규칙 7번을 완전하게 검수 통과했습니다.

---

## Date

2026-07-31

## Task

PWA 서비스 워커 및 HMR(핫 모듈 리로딩) 간섭으로 인한 개발 서버 프리징 및 무한 로딩 트러버슈팅, 루트(`/`) 경로의 랜딩 페이지 UI 개편.

## AI Tool

Antigravity

## Agent

Coder, Researcher

## Purpose

개발 환경(HMR 및 chrome-extension 등)에서 서비스 워커가 통신을 가로채 발생하는 웹소켓 무한 대기 문제를 파악하고 제외 필터를 설정함. 또한 이음의 핵심 가치(디지털화, 회상 질문, 세대 연결)를 전달할 수 있는 프리미엄 랜딩 페이지를 나이테 SVG 그래픽 및 글래스모피즘 카드로 재디자인함.

## Outcome

* `PWARegister.tsx`의 개발환경 내 서비스 워커 등록 스킵 로직 구축 및 `document.readyState` 검증 최적화.
* `sw.js`에서 Next.js 내부 경로(`/_next/*`) 및 `webpack-hmr` 통신 가로채기 스킵(bypass) 필터 연계로 HMR 행 문제 완벽 해결.
* 나이테 SVG 및 3대 서비스 필러 카드 그리드를 포함한 프리미엄 다크 테마 기반의 랜딩 페이지 개편 및 빌드 검증 성공.

## Files

* [components/PWARegister.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/PWARegister.tsx)
* [public/sw.js](file:///c:/Users/PC/Desktop/Projects/EEUM/public/sw.js)
* [app/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/page.tsx)

## Notes

* 이번 트러블슈팅을 통해 Next.js Turbopack 환경과 커스텀 PWA 서비스 워커의 개발 모드 정합성이 확보되었습니다. 개편된 랜딩 페이지는 고대비 텍스트 크기와 넉넉한 터치 영역(48px 이상)을 유지하여 노인 접근성 규정을 충족합니다.

---

## Date

2026-08-01

## Task

이음 가입성/접근성 개선 및 진입 구조 고도화 (로그인/회원가입 통합, 다크 모드 톤 보정 및 인라인 에러 구현).

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

다크 모드의 어둡고 칙칙한 색상을 따뜻한 한옥 서재실 감성으로 개선하여 노년층 정서 안정을 도모하고, 가입 단계의 복잡하고 긴 텍스트를 줄이며, 팝업 경고 대신 항목 우측 인라인 에러를 제공하여 가입 가독성을 극대화함. 또한 시작하기 클릭 시 로그인과 가입을 선택할 수 있는 통합 페이지(`/register`)로 기존 구조를 통합함.

## Outcome

* **다크 모드 배색 개선**: 따뜻한 차콜 브라운(`#1D1C1A`), 우유빛 한지 텍스트(`#F4EFE6`), 놋쇠빛 골드(`#D8B48F`)로globals.css 다크모드 변수 재매핑 완료.
* **인라인 에러 지원**: Input 컴포넌트에 `errorMessage` 속성 추가 및 라벨 우측 정렬 렌더링 적용.
* **통합 진입 구축 및 데모 우회**: 기존 `/role-selection`을 삭제하고 `/register`로 가입/로그인을 통합 구축했으나, 개발 테스트 편의를 극대화하기 위해 대문 페이지의 "시작하기" 클릭 시 체험용 Mock 계정 세션을 즉시 주입하고 실제 사용 대시보드인 `/home`으로 다이렉트 우회 리다이렉트되도록 추가 적용함.
* **텍스트 다이어트**: 가입 단계별 안내 문구의 길이를 간명하게 약 50% 축소 완료.
* **테마별 로고 연동 및 크기 최적화**: `public/logo/` 내 투명 처리된 새 로고(`lightmodenew.jpg` 및 `darkmodenew.jpg`)에 대해 원형 마스크 및 배경색을 걷어내고 순수 이미지 형태로 렌더링되게 수정함. 또한, 랜딩 바 및 홈 헤더 영역에서 네비게이션 바 높이를 초과하지 않도록 높이를 `h-10` (40px) 및 `object-contain` 스타일로 고정하여 크기 조정을 완료.
* **anime.js v4.5.0 애니메이션 엔진 연동**: 패키지 설치 후 Next.js SSR과 호환되는 `useAnime` 커스텀 훅 및 어르신 친화적 감속 이징(Cubic)과 미세 이동(Y Offset 12px)을 준수하는 `QuietFadeIn` 모션 래퍼 컴포넌트 신설. 메인 화면 히어로 영역에 시범 적용 완료.
* **Shared Mind Map (Knowledge Graph) UI 구현**:
  * 나이테 연대기 뷰와 토글 가능한 마인드맵 뷰를 탑재한 [NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) 구축.
  * 외부 라이브러리 없이 순수 물리 계산 척력 모델을 적용하여 노드를 배치하고 `anime.js`를 사용해 크기와 경로를 마운트하는 [KnowledgeGraph.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/KnowledgeGraph.tsx) 구현.
  * 소유권(어르신/보호자/공동)에 따른 노드 컬러 구분 및 마우스 호버 툴팁 장착.
  * "실시간 자녀 기억 추가" 시뮬레이터와 `eeum_narratives_updated` 이벤트를 연동하여 실시간 기억망 성장 연출 구현.
  * [app/narrative/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/page.tsx)를 Next.js App Router Server Component로 전환하여 서버 단 데이터 프리페칭 모델 구축.
* **빌드 검증**: `npm run build` 프로덕션 빌드 무오류 통과 검증 완료.

## Files

* [app/globals.css](file:///c:/Users/PC/Desktop/Projects/EEUM/app/globals.css)
* [components/Input.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/Input.tsx)
* [app/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/page.tsx)
* [app/register/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/register/page.tsx)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx)
* [hooks/useAnime.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/hooks/useAnime.ts)
* [components/QuietFadeIn.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/QuietFadeIn.tsx)
* [components/KnowledgeGraph.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/KnowledgeGraph.tsx) (신설)
* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (신설)
* [app/narrative/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/page.tsx) (리팩토링)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [app/role-selection/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/role-selection/page.tsx) (삭제)

---

## Date

2026-08-01

## Task

`/home` 캘린더 뷰(Calendar View) 구축, 완료 동그라미 노란색 채움 애니메이션, 연속 회상 달성 일수(Streak) 표시, 날짜별 기록 모달 및 제출 로딩 스피너 고도화.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

어르신의 동기부여와 기록 성취감을 유도하기 위해 홈 화면에 월간 캘린더를 탑재하고, 회상 기록이 완료된 날짜에는 애니메이션과 함께 노란색 원 채움으로 시각화함. 또한 연속 회상 달성 일수(Streak)를 불꽃 배지로 표시하고, 날짜 클릭 시 해당 날짜의 기록 지면을 확인할 수 있는 팝업 모달을 연동함.

## Outcome

* **완료 날짜 노란색 원 + anime.js Pop 애니메이션 (`CalendarWidget.tsx`)**:
  * 회상 일기/답변이 완료된 날짜에 황금빛 노란 원 배경(`#F5C842`) 및 `anime.js` scale pop 모션 연출.
  * 이전/다음 월 이동 기능 및 오늘 날짜 표시 제공.
* **연속 회상 달성 일수 (Streak Counter)**:
  * 사용자 답변 이력을 소급 분석하여 오늘/어제 기준 연속 기록 일수를 카운트하는 알고리즘 연동.
  * 홈 인사말 영역 우측 상단에 `🔥 N일 연속 회상 중` 불꽃 배지 렌더링.
* **날짜별 기록 상세 모달 (`DayDetailModal.tsx`)**:
  * 캘린더 날짜 클릭 시 해당 날짜에 기록된 질문과 어르신의 답변 텍스트를 모달로 확인 가능.
* **답변 제출 로딩 스피너 애니메이션 고도화 (`app/journal/page.tsx`)**:
  * Form 제출 시 이중 회전 아우라 스피너와 함께 미세한 펄싱 텍스트 애니메이션 연동.
* **프로덕션 빌드 통과**: `npm run build` 검증 완료.

## Files

* [components/CalendarWidget.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/CalendarWidget.tsx) (신설)
* [components/DayDetailModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/DayDetailModal.tsx) (신설)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

백엔드 API, JSON Parse 및 DB Upload 테스트 자동화 환경 구축 (`npm run test:backend`).

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

백엔드 API 통신, Upstage Solar Pro 3 LLM JSON Mode 파싱, 11종 엔티티 추출, Safety Guard 위험 문장 차단, 그리고 Supabase DB Upload 및 In-memory Fallback 저장소를 자동으로 종합 검증하기 위함.

## Outcome

* **통합 테스트 스크립트 작성 (`tests/test-backend-api.ts`)**:
  - Test 1: Solar Pro 3 LLM JSON Parse 검증
  - Test 2: Agent 1 (ocr-extractor) 11종 엔티티 추출 검증
  - Test 3: mindmap-analyzer 순수 계산 모듈 `signalScore` 스코어링
  - Test 4: Agent 2 질문 생성 & Agent 4 우회 불가 안전검수
  - Test 5: Agent 4 안전검수 금지 문장(의료 진단/처방) 차단 테스트
  - Test 6: Supabase DB Upload & Read 검증
  - Test 7: Agent 3 서사 4단계 릴레이 & DBNarrative DB Upload 검증
* **Node.js 서버 인메모리 저장소 바인딩 (`services/supabase-service.ts`)**: CLI 스크립트 환경에서도 DB Upload 및 읽기가 영속화되도록 In-Memory Fallback Store 구현.
* **테스트 결과**: `npm run test:backend` 실행 시 총 **12개 검증 항목 100% 통과 (Pass)** 달성.

## Files

* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (신설)
* [package.json](file:///c:/Users/PC/Desktop/Projects/EEUM/package.json) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

세션 동기화 데이터 백업(`/save-session`) 및 Next.js CLI 환경변수 Dynamic Loading 설계 학습 스킬 추출(`/learn-eval`).

## AI Tool

Antigravity

## Agent

Coder, Researcher

## Purpose

현재 개발이 완료된 4-에이전트 백엔드 API & Supabase 실시간 연동 빌드 이력을 세션 백업 파일에 담아 영속화하고, CLI 테스트 스크립트 구동 시 Next.js 모듈 번들 시점의 환경변수 캐싱 문제를 방어한 Dynamic Env Loading 설계 방식을 글로벌 학습 스킬 문서로 정돈하기 위함.

## Outcome

* **세션 데이터 백업 (`2026-08-02-eeum-backend-session.tmp`)**: `~/.claude/session-data/` 내에 이번 세션에 이루어진 변경 사항, 테스트 이력, 아키텍처 의사결정 내역을 누락 없이 요약 기록 완료.
* **글로벌 스킬 문서 추출 (`nextjs-dynamic-env-loading.md`)**: 최상단 정적 변수 캐싱으로 인한 환경변수 유실을 해결하는 Dynamic Getter 함수 설계법 및 Fallback Model Retry 디자인 패턴을 전역 학습 스킬로 추출 완료.

## Files

* C:\Users\PC\.gemini\antigravity-ide\brain\931c7940-908c-4198-93f4-b5ffb0bb8a55\2026-08-02-eeum-backend-session.tmp
* C:\Users\PC\.gemini\antigravity-ide\brain\931c7940-908c-4198-93f4-b5ffb0bb8a55\nextjs-dynamic-env-loading.md
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

회상 구간/메모리 영역(`memoryZone`) 3가지 영역(sharedIndependentMemory, inheritedStory, soloPatientOnly) 질문 톤 분기 및 서사 챕터 태깅 확장.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

공통질문 생성 시 3가지 생애 주기 영역(`sharedIndependentMemory` 핵심 독립기억, `inheritedStory` 자녀 유아기 전해들은 이야기, `soloPatientOnly` 부모 단독 인생)에 맞춰 Upstage Solar Pro 3 시스템 프롬프트 톤을 다변화하고, 서사집 구성 시 자녀가 모르는 이야기/전해들은 기억 등의 챕터 태깅을 확장하기 위함.

## Outcome

* **타입 정의 및 DB 스키마 확장 (`types/index.ts` & `services/supabase-service.ts`)**: `MemoryZone` 타입 추가 및 `DBQuestionHistory`, `DBAnswer`, `DBNarrative` 객체 사양 내 `memory_zone`, `chapterTag` 속성 확장.
* **Agent 2 (question-generator-agent.ts) 톤 분기**:
  - `sharedIndependentMemory`: 양쪽 모두 원본 기억 보유 개방형 질문 (`shared: true`, 관점 병합 최상위).
  - `inheritedStory`: 자녀 유아기 시절의 전해들은 이야기 톤 및 2차 반응 유도 질문.
  - `soloPatientOnly`: 자녀 출생 전 부모님의 단독 인생 질문 (`shared: false`, 자녀에게 동시 발송 안 함).
* **Agent 3 (narrative-builder-agent.ts) 챕터 태깅**: `soloPatientOnly` 챕터에 `"solo_hidden_gem"`(*"자녀분이 모르는 부모님의 이야기"*) 태그 및 요약 뱃지 장착.
* **API Routes & 테스트 검증**: `/api/questions` 연동 및 `tests/test-backend-api.ts` 통합 테스트 16개 항목 100% 통과(Pass).

## Files

* [types/index.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/types/index.ts) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts) (수정)
* [lib/agents/narrative-builder-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/narrative-builder-agent.ts) (수정)
* [app/api/questions/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/route.ts) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

이음 플랫폼 전체 데이터베이스 스키마 명세서 작성 및 저장 (`docs/database-schema.md`).

## AI Tool

Antigravity

## Agent

Architect, Planner

## Purpose

현재 연동되어 작동 중인 테이블 7종과, 향후 고도화(Tier 2~3)를 위해 구축할 확장 테이블 5종을 포함한 전체 ERD, 컬럼별 속성표 및 원클릭 Supabase DDL 실행 SQL 스크립트를 문서화하여 보관하기 위함.

## Outcome

* **`docs/database-schema.md` 생성 완료**:
  - 12개 테이블 ERD Diagram (Mermaid)
  - 7개 현재 완결 테이블 명세표
  - 5개 미래 확장 테이블 명세표 (`voice_journals`, `ocr_scans`, `family_invites`, `safety_logs`, `notifications`)
  - Supabase DDL SQL 실행 스크립트 수록.

## Files

* [docs/database-schema.md](file:///c:/Users/PC/Desktop/Projects/EEUM/docs/database-schema.md) (신설)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

사용자 본인 및 연동된 보호자(자녀)의 사진/텍스트 맞춤 대화 주제 생성 기능 구축.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

AI 자동 질문 외에도 어르신 본인이나 자녀가 직접 텍스트 추억 힌트 또는 옛 사진/편지를 제공하면, Upstage OCR 및 Agent 2(Question Generator)를 통해 정겨운 회상 대화 질문으로 다듬고 즉시 저널 작성 지면으로 연결하기 위함.

## Outcome

* **Agent 2 커스텀 질문 메서드 구현 (`generateCustomTopicQuestion`)**: 텍스트 키워드 및 OCR 엔티티를 바탕으로 따뜻한 1개의 회상 개방형 질문 생성.
* **커스텀 질문 생성 API 라우트 구축 (`app/api/questions/custom/route.ts`)**: 사진 업로드 시 Upstage OCR ➔ Agent 1 ➔ Agent 2 ➔ Agent 4 안전검수 ➔ Supabase `questions_history` DB 저장 파이프라인 완성.
* **직접 추억 주제 만들기 모달 컴포넌트 (`components/CustomTopicModal.tsx`)**: 텍스트 적기/사진 첨부 탭, OCR 스캔 로딩 모션 및 생성 완료 시 저널 지면(`/journal?qid=...&qtext=...`) 자동 이동 UI 탑재.
* **홈 화면 (`app/home/page.tsx`) 버튼 연결**: **"✦ 직접 추억 주제 만들기"** 버튼 배치 및 모달 연동.
* **통합 테스트 및 프로덕션 빌드 통과**: `tests/test-backend-api.ts` Test 9 검증 18개 항목 100% 통과 및 `npm run build` 정상 완료.

## Files

* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts) (수정)
* [app/api/questions/custom/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/custom/route.ts) (신설)
* [components/CustomTopicModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/CustomTopicModal.tsx) (신설)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [types/index.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/types/index.ts) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

오늘의 일상 일기(Daily Diary) 작성 기능 및 수학적 확률 수식 기반 질문 유동 선출 알고리즘 구축.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

어르신이 오늘 하루의 소소한 일상(산책, 통화, 기분 등)을 기록하는 전용 일기 지면을 제공하고, AI가 질문을 생성할 때 최근 일기 작성 빈도 및 공백 일수를 고려한 수학적 확률 공식 $P(\text{DiaryBased})$을 이용해 **개인적 원본 회상 질문**과 **최근 일기 연계 기억 질문**을 유동적으로 선출하기 위함.

## Outcome

* **수학적 빈도/공백 확률 수식 연동 (`lib/analytics/mindmap-analyzer.ts`)**:
  - $P(\text{DiaryBased}) = \text{Clamp}(0.2, 0.8, 0.25 + 0.15 \times N_{\text{recent\_diaries}} - 0.04 \times D_{\text{gap}} + 0.1 \times S_{\text{signal}})$ 수식 구현.
* **Agent 2 질문 생성기 연동 (`lib/agents/question-generator-agent.ts`)**:
  - `recent_diary_recall` 선출 시 최근 일상 일기 내용과 유년 시절 원본 추억 엔티티를 자연스럽게 엮은 인지 자극 질문 생성.
* **일상 일기 작성 모달 (`components/DailyDiaryModal.tsx`)**: 날씨/기분 칩 선택 및 소소한 일상 작성 ➔ 저장 시 오늘 질문 자동 갱신.
* **홈 메인 화면 연동 (`app/home/page.tsx`)**: **"✏️ 오늘 일상 일기 적기"** 버튼 배치 및 모달 연동.
* **통합 테스트 및 프로덕션 빌드 통과**: `tests/test-backend-api.ts` Test 10 검증 21개 항목 100% 통과 및 `npm run build` 성공.

## Files

* [lib/analytics/mindmap-analyzer.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/analytics/mindmap-analyzer.ts) (수정)
* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts) (수정)
* [components/DailyDiaryModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/DailyDiaryModal.tsx) (신설)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [app/api/questions/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/route.ts) (수정)
* [types/index.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/types/index.ts) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

전용 일상 일기 페이지(`/daily-diary`) 신설, 감정 항목 제거, 단일 하루 주제 질문 제시 및 멀티모달(텍스트/음성/사진) 입력 지원 개편.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

모달 팝업 대신 전용 새로운 라우트(`/daily-diary`)로 라우팅하여 일상 일기를 정갈하게 기록할 수 있도록 하고, 감정 선택 항목을 없애는 대신 *"오늘 어떤 일이 있으셨고, 특별히 맛있게 드신 음식이 있으신가요?"*와 같은 다정한 하루 일상 주제를 제시하며 텍스트/음성(STT)/사진을 자유롭게 기록할 수 있도록 하기 위함.

## Outcome

* **전용 독립 일상 일기 라우트 구축 (`app/daily-diary/page.tsx`)**:
  - 상단에 다정한 일상 주제 구절 제시: *"오늘 어떤 일이 있으셨고, 특별히 맛있게 드신 음식이 있으신가요?"*
  - 감정 선택 칩 항목 제거.
  - ✍️ **텍스트 직접 작성**, 🎙️ **음성 말하기(Web Speech API STT)**, 🖼️ **오늘의 일상 사진 업로드** 3가지 멀티모달 형식 지원.
* **홈 메인 라우팅 변경 (`app/home/page.tsx`)**:
  - **"오늘 일상 일기 적기 ✦"** 클릭 시 모달이 아닌 `/daily-diary` 라우트로 연결.
* **통합 테스트 & 프로덕션 빌드 통과**:
  - `tests/test-backend-api.ts` Test 10 검증 통과 및 `npm run build`에 `○ /daily-diary` 정적 라우트 무오류 생성 완료.

## Files

* [app/daily-diary/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/daily-diary/page.tsx) (신설)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [types/index.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/types/index.ts) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [components/DailyDiaryModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/DailyDiaryModal.tsx) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md)

---

## Date

2026-08-01

## Task

홈 화면 미션 한눈에 보기 개편: 인사말 헤더 콤팩트화, 연노랑(Soft Yellow) 미션 하이라이트 배색 및 사족 설명문 삭제.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

접속 시 스크롤 없이도 **오늘의 두 가지 미션(회상 구절 적기 & 일상 일기 적기)**이 한눈에 들어오도록 상단 부피를 줄이고, 사족 설명 텍스트를 정리하여 연노랑 하이라이트 카드로 가독성을 극대화하기 위함.

## Outcome

* **인사말 헤더 콤팩트화**: `py-8` 수직 부피를 60% 축소하여 접속 직후 두 미션 카드가 한눈에 보임.
* **오늘의 미션 연노랑(Soft Yellow) Highlight 배색**:
  - `📌 오늘의 미션 1: 회상 구절 적기` (`bg-amber-100/80 border-amber-300`)
  - `📌 오늘의 미션 2: 일상 일기 적기` (`bg-amber-100/80 border-amber-300`)
* **불필요한 부연 설명문 완전 삭제**: 화면 가독성 및 직관성 향상.
* **Git 원격 반영**: `923e8f6` 커밋으로 원격 저장소 푸시 완료.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-01

## Task

미션 완수 시 카드 자동 완료 숨김 처리 및 `/journal`, `/daily-diary`, `CustomTopicModal` 간 100% UI 디자인 톤앤매너 통일.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

미션을 작성 완료하면 해당 카드가 자동으로 완수 숨김 처리되어 성취감을 높이고, `/daily-diary` 및 추억 주제 만들기 모달의 디자인을 `/journal` 지면의 정갈한 서화풍 스타일로 100% 일치시켜 완벽한 UI 일관성을 확보하기 위함.

## Outcome

* **미션 완수 자동 숨김 (`app/home/page.tsx`)**:
  - 미션 1(회상 구절 작성) 완료 시 미션 1 카드 자동 숨김.
  - 미션 2(오늘 일상 일기 작성) 완료 시 미션 2 카드 자동 숨김.
  - 두 미션 모두 완수 시 **"🎉 오늘 부여된 모든 회상 미션을 멋지게 완수하셨습니다!"** 축하 카드 표시.
* **UI 톤앤매너 100% 통일 (`app/daily-diary/page.tsx`)**:
  - `/journal` 지면과 동일한 상단 네비게이션, 질문 버블 카드 (`bg-secondary border border-border`), 정갈한 텍스트/음성/사진 수단 선택기 UI로 완전 통일.
* **Git 원격 반영**: `0648fc3` 커밋으로 원격 저장소 푸시 완료.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [app/daily-diary/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/daily-diary/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-01

## Task

모달 팝업 완전 제거 및 전용 개별 페이지 `/custom-topic`, `/daily-diary` 구축 + `/journal` 2단계(수단 선택 ➔ 전용 입력 폼) 입력 흐름 100% 통일.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

`CustomTopicModal` 모달 팝업을 폐지하고 전용 독립 라우트 `/custom-topic`을 신설하였으며, `/daily-diary`와 `/custom-topic` 지면 모두 `/journal` 지면의 2단계 입력 흐름(1단계: ⌨️ 키보드로 쓰기 | 🎙️ 음성으로 적기 | 🖼️ 사진으로 올리기 3개 큼직한 선택 카드 ➔ 2단계: 전용 입력 폼)을 100% 동일하게 따르도록 개편하여 통합 UI/UX 완벽성을 확보하기 위함.

## Outcome

* **전용 독립 추억 주제 라우트 구축 (`app/custom-topic/page.tsx`)**:
  - `CustomTopicModal` 팝업 모달 완전 삭제 ➔ `/custom-topic` 개별 정적 라우트 신설.
  - `/journal`과 동일한 2단계 입력 수단 선택기 흐름 적용.
* **`/daily-diary` 2단계 입력 수단 선택기 개편 (`app/daily-diary/page.tsx`)**:
  - 1단계: 3개 수단 선택 카드 (키보드 / 음성 / 사진) ➔ 2단계: 선택 수단별 전용 입력 폼 구조 완벽 통일.
* **홈 메인 라우팅 반영 (`app/home/page.tsx`)**:
  - "어르신께 대화 주제 제안하기 / 직접 추억 주제 만들기" 클릭 시 `/custom-topic` 페이지로 이동.
* **Git 원격 반영**: `6ee347d` 커밋으로 원격 저장소 푸시 완료.

## Files

* [app/custom-topic/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/custom-topic/page.tsx) (신설)
* [app/daily-diary/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/daily-diary/page.tsx) (수정)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [components/CustomTopicModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/CustomTopicModal.tsx) (삭제)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-01

## Task

마인드맵 UI 중단, 양자화 벡터 연관도 엔진 보존, 보호자/어르신 역할별 메인 홈 UI 분기 및 11-카테고리 답변 카드 뷰어 개발.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

복잡한 D3/SVG 마인드맵 그래프 UI를 완전 폐지하고 양자화 벡터 공간 거리 연관도 계산엔진(`mindmap-analyzer.ts`)은 질문 발송/카테고리화 용도로 보존하며, 어르신 UI는 미션 중심 간결화를, 보호자 UI에는 11-카테고리 답변 카드 뷰어를 제공하기 위함.

## Outcome

* **마인드맵 UI 완전 폐지 & Vector Distance Engine 보존**:
  - D3 그래프/KnowledgeGraph 컴포넌트 삭제 및 노드 크기 UI 처리 완전 중단.
  - `mindmap-analyzer.ts` 내 Quantization & Vector Space 거리 연관도 계산 알고리즘 100% 보존.
* **어르신 vs 보호자 홈 UI 분기 (`app/home/page.tsx`)**:
  - **어르신 UI (`user.role === "self"`)**: "인생 나이테 연대기 보기" 카드를 제거하고 오직 **오늘의 2가지 미션(회상 구절 & 일상 일기)**만 표시.
  - **보호자 UI (`user.role === "guardian"`)**: 세대 연결 공통 질문(있는 경우) + **"어르신께 대화 주제 제안하기 (`/custom-topic`)"** + **"11-카테고리 추억 카드 뷰어 (`/narrative`)"** 전용 구성.
* **보호자용 11-카테고리 답변 카드 뷰어 (`/narrative`)**:
  - 11개 카테고리 칩(`인물`, `장소`, `시간`, `사건`, `음식`, `감각`, `동물`, `사물`, `감정` 등) 기반 정갈한 서화 카드 뷰어 신설.
* **Git 원격 반영**: `d9c5733` 커밋으로 원격 저장소 푸시 완료.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [components/KnowledgeGraph.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/KnowledgeGraph.tsx) (삭제)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-01

## Task

상단 유저 버튼(역할 전환 버튼) 클릭 시 본인 모드(`self`)와 보호자 모드(`guardian`) 간 역할 스위칭이 100% 동기화되어 즉각 변경되도록 수정.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

`getCurrentUser()` 및 `setCurrentUser()`의 세션 저장소 보존 로직을 강화하여 상단 아이콘 버튼 클릭 시 즉시 어르신 모드(`김순자 어르신`) ↔ 보호자 모드(`이지영 자녀`) 간 화면 및 기능이 즉각적으로 전환되도록 보장하기 위함.

## Outcome

* **역할 스위칭 영구 보존 (`services/supabase-service.ts`)**:
  - `getCurrentUser()`가 로컬/인메모리 세션 스토어를 1순위로 참조하여 스위칭된 역할 정보를 유지하도록 수정.
* **유저 버튼 클릭 핸들러 동기화 (`app/home/page.tsx`)**:
  - `handleRoleToggle` 실행 시 `user.role`을 `"self"` ↔ `"guardian"`으로 즉각 스위칭하고 화면 동기화.
* **Git 원격 반영**: `d3efdd4` 커밋으로 원격 저장소 푸시 완료.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`/home`, `/journal`, `/daily-diary`, `/custom-topic`, `/narrative` 지면의 단조로운 카드 반복 구도를 깨고 "Hero 카드 -> 2-Column Grid 타일 -> 프레임리스 데이터 뷰" 레이아웃 리듬 및 에디토리얼 비주얼 위계 개편.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect, Code Reviewer

## Purpose

동일한 둥근 모서리와 다크 배경, 균일한 여백으로 쌓이던 단조로운 카드 반복 리듬을 해결하고, 주요 회상 질문을 확실한 시각적 중심(Hero Card)으로 끌어올리며, 보조 메뉴를 2-column 가로 타일 그리드로 재배치하여 사용자의 시각적 피로를 없애고 고급스러운 서화풍 에디토리얼 레이아웃을 구축하기 위함.

## Outcome

* **글로벌 디자인 시스템 강화 (`app/globals.css`)**:
  - `.hero-remembrance-card` (풍부한 파치먼트 방사형 그라데이션 및 앰비언트 글로우, 테두리 강조)
  - `.tile-card` (2-column 그리드 전용 인터랙티브 타일)
  - `.data-view-frame` (프레임리스 데이터 영역)
  - `.stamp-badge` (에디토리얼 카테고리/상태 배지)
* **홈 레이아웃 리듬 대대적 개편 (`app/home/page.tsx`)**:
  - 어머니(본인) 모드 미션 동등 크기화: 오늘의 미션 1(회상 구절)과 미션 2(일상 일기)를 동일한 대형 Hero 카드 크기 및 스타일로 배치하여 중요도와 시각적 균형 일치.
  - 오늘의 답변 노출 및 수정/재입력 접근 권한: 미션 작성 완료 시 카드가 닫히지 않고 어르신의 보관된 답변 텍스트를 카드 내부에 아름답게 노출하며, `[답변 수정 / 다시 기록하기 ✦]` 버튼을 통해 언제든 직접 수정/재입력에 접근 가능하도록 구현.
  - 어머니(본인) 모드 2열 그리드 메뉴: 하단 2-column 타일에 자녀 모드와 동일하게 "대화 주제 제안하기" 타일을 추가 배치(대화 주제 제안 + 내 추억 보관함).
  - 캘린더 영역: 카드 박스 테두리를 완전히 제거하고 오픈 데이터 뷰 구조로 재구성.
* **캘린더 컴포넌트 프레임리스 전환 (`components/CalendarWidget.tsx`)**:
  - 답답한 외곽 테두리를 제거하고 활동 기록 데이터 뷰 스타일 적용.
* **주요 입력 지면 톤앤매너 통일 (`app/journal/page.tsx`, `app/daily-diary/page.tsx`, `app/custom-topic/page.tsx`, `app/narrative/NarrativeClient.tsx`)**:
  - 상단 질문/주제 엠블렘을 Hero 카드 스타일로 업그레이드하고 입력 수단 선택을 2열 타일 그리드로 개편.

## Files

* [app/globals.css](file:///c:/Users/PC/Desktop/Projects/EEUM/app/globals.css) (수정)
* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [components/CalendarWidget.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/CalendarWidget.tsx) (수정)
* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx) (수정)
* [app/daily-diary/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/daily-diary/page.tsx) (수정)
* [app/custom-topic/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/custom-topic/page.tsx) (수정)
* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
---

## Date

2026-08-02

## Task

기존 답변/일기 수정 시 선택 화면 생략 후 텍스트 에디터 직접 진입(기존 내용 보존), 수정 완료 시 LLM 파이프라인(Safety Guard, Narrative Builder, 질문 확률 엔진) 재전송, 3분 1회 수정 제한(Rate Limiting) 구현.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

어르신이 보관된 답변이나 일기를 수정할 때 기존 텍스트가 폼에 보존된 상태로 즉시 수정 가능하도록 하고, 수정된 내용으로 LLM 인생 서사를 다시 재구성하며, 과도한 LLM API 남발 방지를 위해 3분 쿨다운 레이트 리밋을 보장하기 위함.

## Outcome

* **직접 수정 모드 (`app/journal/page.tsx`, `app/daily-diary/page.tsx`)**:
  - 진입 시 수단 선택 단계를 건너뛰고 `answerType = "text"`로 즉시 텍스트 에디터가 열리며 기존 보관 내용 pre-fill.
* **LLM 파이프라인 재실행**:
  - 수정 완료 시 `safetyGuardAgent.verify()` 및 `narrativeBuilderAgent.buildNarratives()` / `/api/questions` LLM 엔드포인트를 재작동하여 서사 나이테 업데이트.
* **3분 1회 수정 레이트 리밋**:
  - `localStorage` 기반 타임스탬프 체크로 3분(180,000ms) 이내 수정 재제출 시 남은 카운트다운 시간과 함께 경고 메시지 팝업 노출.

## Files

* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx) (수정)
* [app/daily-diary/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/daily-diary/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`/learn` 워크플로우 실행을 통한 답변/일기 수정 및 LLM 파이프라인 재연동 핵심 재사용 패턴 추출 및 분석.

## AI Tool

Antigravity

## Agent

Planner, Code-Reviewer

## Purpose

최근 개발 진행된 답변/일기 수정 UX 및 LLM 파이프라인 재실행, 쿨다운 레이트 리밋 관련 솔루션을 재사용 가능한 패턴(Pattern & Skill)으로 정형화하고 `aiUsageLog.md`에 이력을 기록하기 위함.

## Outcome

* `/learn` 워크플로우 분석을 통해 LLM 파이프라인 재실행 Cooldown 레이트 리밋 패턴 및 어르신 UX 수정 직행(Bypass) 패턴 2종 추출 완료.
* 프로젝트 패턴 문서 (`patterns/llm-edit-cooldown-pattern.md`) 및 워크스페이스 스킬 (`.agents/skills/llm-edit-cooldown/SKILL.md`) 생성 저장 완료.
* AI 사용 및 워크플로우 수행 이력을 `aiUsageLog.md`에 성공적으로 갱신 기록함.

## Files

* [patterns/llm-edit-cooldown-pattern.md](file:///c:/Users/PC/Desktop/Projects/EEUM/patterns/llm-edit-cooldown-pattern.md) (신규)
* [.agents/skills/llm-edit-cooldown/SKILL.md](file:///c:/Users/PC/Desktop/Projects/EEUM/.agents/skills/llm-edit-cooldown/SKILL.md) (신규)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`/narrative` 서화 보관함 페이지 3단 컬럼 데스크톱 레이아웃(1열 대분류 카테고리 - 2열 세부 태그 & 빈도/정렬 - 3열 카드 뷰어) 리팩토링.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

기존 상단 카테고리 탭 + 1열 스크롤 구조를 데스크톱 환경에 최적화된 3단 탐색 구조로 개편하여 카테고리 및 세부 키워드 빈도별 다차원 회상 탐색 경험을 제공하기 위함.

## Outcome

* `NarrativeClient.tsx`를 3단 컬럼 레이아웃(`w-56` 1열, `w-64` 2열, `flex-1` 3열)으로 전면 리팩토링.
* 2열 세부 태그 카운트 및 3종 정렬(`빈도순`, `최신순`, `가나다순`) 기능 구현.
* 카드 UI 및 기존 다크/라이트 테마 가이드 100% 보존.
* `npx tsc --noEmit` 및 `npm run build` 검증 완료.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

Upstage OCR / Document Parse 및 11개 엔티티 추출(IE) 검증 전용 전용 스크립트 작성 및 테스트 실행.

## AI Tool

Antigravity

## Agent

Planner, Tester, Coder

## Purpose

Upstage Document Parse API 키 설정 유무(실제 Cloud API vs Mock Fallback) 및 11개 회상 엔티티 추출 파이프라인(Agent 1 ocr-extractor) 동작을 독립적으로 검증하고 명령어로 실행할 수 있도록 지원함.

## Outcome

* `tests/test-upstage-ocr.ts` 테스트 스크립트 작성 완료.
* `package.json`에 `npm run test:ocr` 실행 명령어 등록.
* Upstage 키 감지 및 19개 회상 엔티티 추출 테스트 성공적 수행.

## Files

* [tests/test-upstage-ocr.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-upstage-ocr.ts) (신규)
* [package.json](file:///c:/Users/PC/Desktop/Projects/EEUM/package.json) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

AI 대화 주제 제안(`custom-topic`) 부가설명/서두 제거 및 사진 첨부 시 사진 판독 맥락 사용자 응답 자동 기록 기능 개편.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

AI 주제 생성 시 서두("안녕하세요", "추천 질문입니다") 및 부가설명을 단 한 단어도 포함하지 않는 순수 개방형 질문 문장으로 다듬고, 사진 첨부 시 OCR/판독 맥락을 사용자의 첫 응답(Answer) 기록으로 자동 저장하여 세대 연결 및 서사 기록의 연속성을 보장함.

## Outcome

* `questionGeneratorAgent.ts`의 `generateCustomTopicQuestion` 및 정제 함수(`cleanQuestion`) 개편: 서두, 머리말, 부가 해설을 제거하고 물음표(`?`)로 끝나는 순수 질문 1개만 생성.
* `app/custom-topic/page.tsx` 및 `/api/questions/custom/route.ts` 개편: 사진 첨부 시 Upstage OCR 판독 맥락을 `supabaseService.saveAnswer`로 해당 사용자의 첫 응답으로 자동 기록.
* `npx tsc --noEmit` 및 `npm run test:backend` (19개 테스트 항목 100% 통과) 검증 완료.

## Files

* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts) (수정)
* [app/custom-topic/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/custom-topic/page.tsx) (수정)
* [app/api/questions/custom/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/custom/route.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`public/testdata/ocrtest1.jpg` 실시간 Upstage Document Parse 및 OCR 파싱 검증 테스트 수행.

## AI Tool

Antigravity

## Agent

Planner, Tester

## Purpose

실제 샘플 이미지(`ocrtest1.jpg`)를 Upstage Cloud API에 전송하여 손글씨 일기/편지 파싱 텍스트 추출 정확도 및 `upstageService.parseDocument` 엔드포인트 텍스트 파싱 로직을 검증함.

## Outcome

* `public/testdata/ocrtest1.jpg` (67.89 KB) 파싱 성공.
* 2010년 11월 30일자 "가족발 그리기" 손글씨 일기 전문 추출 완수 (엄마, 아빠, 동생 발에 관한 회상 일기 내용 파싱 성공).
* `upstage-service.ts` 파싱 텍스트 추출 로직 보완 및 General OCR fallback 파이프라인 구축.

## Files

* [tests/test-upstage-ocr.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-upstage-ocr.ts) (수정)
* [services/upstage-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/upstage-service.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

연결도 낮은 추억 엔티티(Weak Entity) 통제 확률(15%) 등장 알고리즘 구축 및 질문 생성 엔진 적용.

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

자주 언급되는 주요 엔티티뿐만 아니라 언급 빈도나 연결도가 낮은 잊혀진 추억 엔티티(Weak Entity)도 소폭의 통제된 확률(15%)로 질문 타깃에 포함시켜 다각적인 인지 자극 회상 질문을 유도하기 위함.

## Outcome

* `mindmap-analyzer.ts` 내 `selectTargetEntities` 함수 추가: 연결도가 낮은 엔티티(`weakEntities`)를 15% 통제 확률(`weakProbability = 0.15`)로 질문 타깃 엔티티에 확률적 포함.
* `app/api/questions/route.ts` 질문 생성 API에 `selectTargetEntities` 연동.
* `tests/test-backend-api.ts` Test 11 추가 및 21개 전체 테스트 항목 100% 통과.

## Files

* [lib/analytics/mindmap-analyzer.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/analytics/mindmap-analyzer.ts) (수정)
* [app/api/questions/route.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/app/api/questions/route.ts) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`http://localhost:3000/narrative` 3단 레이아웃 1열 카테고리 탭 UI 5대 주요 시각 카테고리(인물, 장소, 시간, 행사/계기, 동물 + 전체) 슬림화 적용.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

음식, 감각, 사물, 감정 등 다른 엔티티 타입은 내부 백엔드 수식 계산/신호 점수(features) 용도로만 보존하고, 사용자 프론트엔드 UI 1열 사이드바 탭에는 어르신과 자녀가 가장 자주 직관적으로 찾아보는 5가지 핵심 카테고리(인물, 장소, 시간, 행사/계기, 동물)만 노출하여 복잡도를 대폭 낮춤.

## Outcome

* `NarrativeClient.tsx`: `CATEGORIES` 탭을 **전체(✨), 인물(👤), 장소(📍), 시간(⏳), 행사/계기(📜), 동물(🐕)** 6종으로 재구성.
* `classifyItem` 및 `extractTags` 매핑 5대 주요 시각 카테고리로 정리.
* `npx tsc --noEmit` 및 `npm run test:backend` (21/21 통과) 성공적 완수.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

Upstage Embedding API 기반 의미론적 중복 필터링(Plan A) 및 과거 질문 15개 윈도우 프롬프트 주입(Plan C) 통합 구현.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

질문 생성기(questionGeneratorAgent)가 과거 어르신께 물어보았던 회상 질문과 의미/주제/맥락이 중복되거나 유사한 질문을 재방송하듯 반복 발송하는 문제를 방지하기 위함.

## Outcome

1. **Plan C (15개 히스토리 프롬프트 주입)**: `answersHistory` 참조 범위를 3개에서 **15개**로 확장 및 프롬프트에 중복 금지 지시 강제.
2. **Plan A (Upstage Solar Embedding + Cosine Similarity)**:
   - `services/upstage-service.ts`에 `getEmbedding`(`solar-embedding-1-large-query`) 및 `cosineSimilarity` 함수 구현.
   - 생성된 후보 질문과 최근 15개 과거 질문 간 임베딩 코사인 유사도 계산 (`>= 0.82`인 유사/중복 질문 자동 필터링).
3. **테스트 검증**: `tests/test-backend-api.ts` Test 12 추가. 실제 Upstage Embedding API 호출 결과 의미상 동일한 질문("어릴 적 마당에서 친구들과 어떤 놀이를 하며 노셨나요?" vs "유년 시절 집 마당에서 친구들과 주로 어떤 놀이를 하셨나요?")의 임베딩 코사인 유사도가 **0.8841**로 측정되어 중복 필터링 작동 검증 완수 (24/24 전체 테스트 100% 통과).

## Files

* [services/upstage-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/upstage-service.ts) (수정)
* [lib/agents/question-generator-agent.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/lib/agents/question-generator-agent.ts) (수정)
* [tests/test-backend-api.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/tests/test-backend-api.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`http://localhost:3000/narrative` 모바일 뷰 1열(카테고리) 및 2열(세부 태그) 토글(아코디언) 개폐 반응형 UI 구현.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

모바일 환경에서 1열/2열 사이드바 리스트가 세로로 길게 늘어져 3열 추억 카드 영역까지 도달하기 위해 과도한 스크롤이 발생하는 문제 개선.

## Outcome

* `NarrativeClient.tsx`: `isCategoryOpen`, `isTagOpen` 토글 상태 추가.
* 모바일 화면(`md:` 미만)에서는 1열/2열 헤더가 현재 선택된 카테고리/태그 배지와 함께 펼치기/접기(`ChevronDown`/`ChevronUp`) 버튼으로 작동하도록 구현.
* 항목 선택 시 자동으로 아코디언이 접히며 3열 카드로 즉시 접근할 수 있도록 UX 개선.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 검증 완료.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`http://localhost:3000/narrative` 공통 질문 태그 추가(`#공통 질문`), 공통 질문 카드 시각적 차별화(골드/앰버 하이라이트 배경 & `🤝 공통 질문` 배지) 및 작성자 식별 배지(`👴 어르신(본인) 직접 기록` vs `🙋‍♀️ 보호자(자녀) 대리 기록`) 구현.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

세대 간 공통 회상 질문 카드를 어르신 본인의 일반 단독 기록과 시각적으로 명확히 구분하고, 2열 태그 목록에서 `#공통 질문`을 선택하여 세대 연결 추억만 모아볼 수 있도록 UX 개선.

## Outcome

* `NarrativeClient.tsx`:
  - `allCards` 수집 시 세대 공유 메모리영역(`sharedIndependentMemory`, `inheritedStory`) 및 보호자 대리 입력 건에 대해 `#공통 질문` 태그 자동 추가 및 2열 태그 필터링 연동.
  - 공통 질문 카드는 앰버/골드 그라데이션 테두리 및 링 하이라이트 배경 적용.
  - 카드의 작성자 배지(`authorLabel`) 추가: `👴 어르신(본인) 직접 기록` (초록 배지) vs `🙋‍♀️ 보호자(자녀) 대리 기록` (앰버 배지) 명시.
* `npx tsc --noEmit` 및 `npm run test:backend` (26/26 전체 통과) 완수.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

보호자 자녀 시점 기억 덧붙이기(관점 병기 `mergedAnswers`) & 규칙 §5 기반 2단계 정보 정정 전용 모달 컴포넌트(`GuardianMemoryModal.tsx`) 구축 및 3단 서화 보관함 연동.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

보호자(자녀)가 어르신의 회상 기록 카드에서 자녀 본인 시점의 기억을 한 줄 덧붙여 세대 연결 카드(`mergedAnswers`)로 결합하거나, 장소/연도 등 잘못 기재된 정보를 프로젝트 UI 규칙 §5 (1단계: 맞아요/틀려요 → 2단계: 단일 텍스트 입력창)에 맞춰 직관적으로 정정할 수 있도록 지원함.

## Outcome

* `components/GuardianMemoryModal.tsx` 컴포넌트 신규 작성:
  - 1단계 모드 선택: 🤝 "자녀 시점 기억 덧붙이기 (관점 병기)" vs ✏️ "2단계 정보 정정"
  - 자녀 기억 작성 시 `saveAnswer`(`by_guardian: true`) 및 `addMockGuardianNarrative` 자동 호출로 관점 병기 카드 업데이트.
  - 정보 정정 시 1단계(맞아요/틀려요) → 2단계(단일 텍스트 입력창) 2단계 흐름 충실히 이행.
* `NarrativeClient.tsx`: 각 추억 카드 하단에 `🤝 자녀 기억 덧붙이기 / 2단계 정정` 버튼 추가 및 모달 연동.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 완료.

## Files

* [components/GuardianMemoryModal.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/components/GuardianMemoryModal.tsx) (신규)
* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

1. `http://localhost:3000/narrative` 카드 상단 라인 1(질문 유형/카테고리/작성자/날짜)과 라인 2(세부 태그 `#어머니`, `#봄소풍`) 분리 렌더링.
2. Supabase DB `answers` 테이블 스키마에 존재하지 않는 `memory_zone` 컬럼 페이로드 전송으로 인한 `saveAnswer` 오류 원인 해결 및 안전한 `questions_history` pre-upsert 파이프라인 구축.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

1. 카드 헤더의 질문 종류 배지(`🤝 공통 질문`, `✨ 인물`)와 세부 엔티티 태그(`#어머니`, `#소풍`)가 한 줄에 뒤섞여 복잡했던 UI 레이아웃을 2줄로 시각적 분리.
2. 실환경 Supabase 연결 시 DB 스키마 캐시 불일치 에러(`PGRST204: Could not find the 'memory_zone' column of 'answers'`)를 해결하여 답변 정정 및 저장 시 100% 안정적 저장 보장.

## Outcome

* `NarrativeClient.tsx`: 카드 헤더를 라인 1(배지 + 작성자/날짜)과 라인 2(세부 태그)로 깔끔하게 2줄 배치.
* `services/supabase-service.ts`: `saveAnswer`에서 `answers` 테이블 페이로드 내 `memory_zone` 제외 및 `questions_history` 외래키 자동 보장 파이프라인 구축.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 검증 완료.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [services/supabase-service.ts](file:///c:/Users/PC/Desktop/Projects/EEUM/services/supabase-service.ts) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

사용자 지시에 따른 보호자 대리 기록/정정 모달(`GuardianMemoryModal.tsx`) 기능 제거 및 3단 서화 보관함 UI 원복.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

사용자의 기능 제거 지시에 따라 복잡도를 유발하는 `GuardianMemoryModal` 컴포넌트 및 추억 카드 하단 정정/덧붙이기 버튼을 완전히 제거하고 코드를 깔끔하게 원복함.

## Outcome

* `components/GuardianMemoryModal.tsx` 파일 삭제.
* `NarrativeClient.tsx`에서 `GuardianMemoryModal` 임포트, 모달 상태 및 버튼 JSX 제거.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 검증 완료.

## Files

* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

빛바랜 추억 사진첩(`/album`) 페이지 구축 — 사진 갤러리 그리드 및 사진별 상세 회상 수필 라이트박스 모달 연동.

## AI Tool

Antigravity

## Agent

Planner, Architect, Coder

## Purpose

어르신과 자녀가 빛바랜 옛 앨범 사진과 일상 일기 사진들을 시각적인 갤러리로 둘러보고, 개별 사진을 터치 시 사진에 담긴 소중한 회상 질문 및 답변 수필 전체, 엔티티 태그, 기록 출처를 직관적으로 확인할 수 있도록 사진 중심의 회상 UX를 지원함.

## Outcome

* `app/album/page.tsx` & `app/album/AlbumClient.tsx` 신규 작성:
  - 갤러리 그리드: 호버 줌 효과, 촬영일 배지, 질문 제목 및 답변 요약 카드.
  - 필터 탭: ✨ 전체 사진 / 📷 옛 앨범 & OCR 사진 / 📔 일상 일기 사진.
  - 라이트박스 모달: 대형 사진 원본 + 질문 제목, 회상 수필 전문, 인물/장소/사건 엔티티 태그.
* `app/home/page.tsx`: 메인 서랍 타일 목록에 `📸 추억 사진첩` 네비게이션 타일 추가.
* `app/narrative/NarrativeClient.tsx`: 상단 헤더에 `📸 추억 사진첩 보기` 퀵 링크 추가.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 검증 완료.

## Files

* [app/album/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/album/page.tsx) (신규)
* [app/album/AlbumClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/album/AlbumClient.tsx) (신규)
* [app/narrative/NarrativeClient.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/narrative/NarrativeClient.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-02

## Task

`http://localhost:3000/home` 홈 화면 레이아웃 조정 — `대화 주제 제안` 및 `11 카테고리 뷰어 (내 추억 보관함)` 2열 그리드 **바로 아래**에 `📸 추억 사진첩` 전용 와이드 배너 카드로 배치.

## AI Tool

Antigravity

## Agent

Planner, Coder

## Purpose

3열 그리드로 복잡하게 묶여 있던 타일 배치를 사용자의 의도에 맞춰 1행(`대화 주제 제안` + `내 추억 보관함`) 및 2행(`📸 추억 사진첩` 전용 배너)으로 시각적 위계감을 분리하여 접근성을 극대화함.

## Outcome

* `app/home/page.tsx`:
  - 본인 모드 및 보호자 모드 공통으로 1행 2열 그리드(`대화 주제 제안` & `11-카테고리 뷰어`) 직후에 2행 전용 와이드 배너(`📸 추억 사진첩`) 배치.
  - 초록색 에메랄드 은은한 그라데이션 및 `ImageIcon` 아이콘 적용.
* `npx tsc --noEmit` 및 `npm run test:backend` (24/24 통과) 검증 완료.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)

---

## Date

2026-08-03

## AI Tool

Antigravity

## Agent

Planner, Coder, Architect

## Purpose

`/custom-topic` 지면에서 신규 추억 대화 주제 생성 후 홈 화면(`/home`)으로 이동했을 때, 질문 컨테이너 카드가 생성 및 표시되지 않던 데이터 동기화 및 폴백 처리 버그 수정.

## Outcome

* `services/supabase-service.ts`:
  - `getCustomProposedQuestions`: Supabase 응답이 없거나 에러/빈 배열인 경우, 로컬 스토리지(`eeum_mock_proposed_questions`) 및 `questions_history`에서 `pending` 상태의 사용자 제안 질문을 통합/폴백하여 최신순으로 반환하도록 보강.
  - `saveCustomProposedQuestion`: 로컬 스토리지와 함께 Supabase 핵심 스키마 테이블인 `questions_history`에도 `status: "pending"`, `shared: true`로 동시 upsert하여 데이터 일관성 확보.
  - `saveAnswer`: 질문 검색 대상(`existingQ`)을 `MOCK_KEYS.QUESTIONS`와 `MOCK_KEYS.PROPOSED_QUESTIONS` 모두 포함하도록 확장하여 사진 OCR 제안 시 질문 상태가 `"answered"`로 잘못 승격되는 현상 방지.
* `app/home/page.tsx`:
  - `loadData`: 당일(`YYYY-MM-DD`) 생성된 질문이 있는 경우 답변 작성 여부와 관계없이 당일 공통 미션 질문(`todayQuestion`)으로 유지하도록 개편하여, 1인 답변 시 AI 질문 생성기가 무한히 새 질문을 연속 생성하여 다른 질문으로 즉시 전환되던 현상을 차단.
* `app/journal/page.tsx`:
  - `handleSubmitAnswer`: 세대 연결 공통 질문(`shared: true`) 답변 작성 시 어르신과 보호자 양쪽 모두의 답변이 완료(또는 2인 매듭 연결)되었을 때만 질문 상태를 `"answered"`로 완료 처리.
  - 한쪽만 먼저 작성한 경우 질문 상태를 `"pending"`("세대 매듭 연결 중 ✦")으로 유지하여, 상대방이 홈 화면에서 2인 공통 질문 카드를 확인하고 답변을 이어서 작성할 수 있도록 조율.
* `npm run build` 컴파일 검증 완결.

## Files

* [app/home/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/home/page.tsx) (수정)
* [app/journal/page.tsx](file:///c:/Users/PC/Desktop/Projects/EEUM/app/journal/page.tsx) (수정)
* [aiUsageLog.md](file:///c:/Users/PC/Desktop/Projects/EEUM/aiUsageLog.md) (수정)
