# Shoes Log 개발 일지 — Ver.01 라인

> 신발 컬렉션 + 마일리지 추적 + 사진 착화 일지 모바일 앱.
> 아이디어부터 "폰에 설치되는 실제 앱 + 구글 플레이 출시 직전"까지의 기록 (2026-06-20 ~ 06-21).
> 작성: Claude와 함께한 개발 세션 정리.

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 앱 | 신발 관리 + 거리 추적(교체 시기) + 사진 착화 일지 |
| 플랫폼 | React Native + **Expo SDK 54** (안드로이드/iOS) |
| 언어 | TypeScript |
| 데이터 | **로컬 우선** — `expo-sqlite`(DB) + 앱 파일 저장소(사진) |
| 저장소 | https://github.com/Ryan-JBC/shoes-log (public) |
| Expo 프로젝트 | expo.dev/accounts/ryan_j/projects/shoes-log |
| 개인정보처리방침 | https://ryan-jbc.github.io/shoes-log/privacy.html |
| 현재 상태 | Ver.01.02 + preview APK로 실사용(dogfooding) 단계 |

---

## 2. 시작 — 아이디어에서 설계로

- **방식**: 무작정 코딩이 아니라, 매번 **brainstorming → 설계 문서 → 구현 계획 → 구현 → 코드 리뷰** 순서로 진행.
- **핵심 결정**
  - 플랫폼: React Native + Expo (한 코드로 iOS·Android, 폰에서 바로 테스트)
  - 저장: 로컬 우선(SQLite). 나중에 클라우드 확장 대비해 **데이터 계층을 화면과 분리**
  - 마일리지: 착화 일지에 거리 입력 → 신발별 누적, 교체 임박(남은 50km)/도달 표시
- 상세: [설계](superpowers/specs/2026-06-20-shoes-log-app-design.md) · [계획](superpowers/plans/2026-06-20-shoes-log-app.md)

---

## 3. 버전별 여정

### Ver.01.00 — MVP
- 신발 등록·목록·상세·은퇴 / 사진 착화 일지(여러 장) / 거리 누적 & 교체 표시 / 간단 통계
- 순수 로직(마일리지·검증)은 **TDD**로 작성
- 폰(Expo Go)에서 **실제 동작 확인** ✅
- ⚠️ 이 과정에서 **Expo SDK 56 → 54 다운그레이드** (아래 4-1)

### Ver.01.01 — 다크 UI 리디자인 + 기능 추가
- 다크 "볼드 스포티" 테마 전 화면 적용 (테마 토큰 + ThemeProvider)
- **설정 탭**: 포인트 색 8종 선택(즉시 적용 + SQLite 저장)
- 내 신발: **사용 중/은퇴/전체 필터** + 은퇴 해제 + **"구매 후 N일"**
- 날짜 **달력 선택기**(미래 날짜 차단) + 저장 전 검증
- **통계 상세화**: 기간 선택(이번 달/올해/전체/사용자 지정) + 막대그래프(신발별·월별)
- 신발 종류 **칩 선택**(러닝화/운동화/구두/기타)
- 도메인 테스트 47개 통과
- 상세: [설계](superpowers/specs/2026-06-21-ui-redesign-and-settings-design.md) · [계획](superpowers/plans/2026-06-21-ui-redesign-and-settings.md)

### Ver.01.02 — 아이콘 + 수정 기능
- **커스텀 앱 아이콘**(신발 밑창 + 마일리지 화살표 + 달력)
- **신발/일지 수정(편집)** — 등록 폼을 공용 컴포넌트(ShoeForm/WearLogForm)로 분리해 추가·수정 겸용, 사진 교체/삭제 + 파일 정리
- 상세: [설계](superpowers/specs/2026-06-21-edit-shoe-and-log-design.md) · [계획](superpowers/plans/2026-06-21-edit-shoe-and-log.md)

---

## 4. 겪은 문제와 해결 (디버깅 기록)

### 4-1. Expo Go에서 실행 안 됨 — "최신 Expo Go 받으라"
- **원인**: 프로젝트가 막 나온 **SDK 56**이라, 스토어의 Expo Go(당시 SDK 54 지원)가 못 엶.
- **해결**: 프로젝트를 **SDK 54로 다운그레이드**(`expo install --fix`) → Expo Go와 호환. 이후 SDK 54 고정.

### 4-2. 폰 연결 "인터넷 오프라인"
- **원인**: 폰과 맥이 **다른 Wi-Fi**. (Mac 방화벽은 꺼져 있었음)
- **해결**: 같은 Wi-Fi로 연결 → 정상. (안 되면 `npx expo start --tunnel`)

### 4-3. 독립 APK가 켜지자마자 꺼짐 (크래시)
- Expo Go에선 안 보이고 **독립 빌드에서만** 발생.
- **진단**: `adb`(USB) + `adb logcat -b crash` 로 스택 확보 →
  `NoClassDefFoundError ...ComposeViewFunctionDefinitionBuilder (expo.modules.ui.ExpoUIModule)`
- **원인**: SDK 56 스캐폴드 잔재인 **`@expo/ui`(canary 버전)** 가 SDK 54와 안 맞음. 우리 코드에선 미사용.
- **해결**: `@expo/ui` 제거 → 정상 실행.
- **교훈**: 독립 빌드 전용 크래시는 **Expo Go가 아니라 logcat**으로 잡아야 한다.

### 4-4. GitHub Pages(개인정보처리방침) 404
- **원인**: Pages가 `/docs`를 **Jekyll**로 처리하며 다른 .md 안의 코드(`{{ }}`)를 템플릿으로 오해 → 빌드 실패.
- **해결**: `docs/.nojekyll` 추가 → Jekyll 끄고 정적 파일 그대로 서빙.

### 4-5. 화면 상단에 "(tabs)" 표시
- **원인**: expo-router 루트 Stack이 탭 그룹 헤더를 노출.
- **해결**: 루트 레이아웃에서 `(tabs)` 헤더 숨김.

---

## 5. 배운 점
- **설계 먼저, 코드는 그다음** — brainstorming/계획이 헛수고를 줄인다.
- **로컬 우선 + 계층 분리** 설계가 나중 확장(클라우드)에 유리.
- **Expo Go ≠ 독립 빌드** — 네이티브 의존성은 독립 빌드에서만 드러나는 문제가 있다.
- **버전 고정의 중요성** (SDK 54) — 최신이 항상 좋은 건 아니다(스토어 호환).
- 디버깅은 **추측 말고 로그**(logcat)부터.

---

## 6. 다음 할 일 (Ver.02~)
- [ ] 신발 등록 시 **초기 사용 거리(km)** 입력 — 이미 신던 신발 대응 (`initial_distance` 컬럼 + 마이그레이션)
- [ ] **데이터 백업/동기화** — 폰↔클라우드 (1단계: 자동 미러백업 → 필요 시 양방향 sync/Firebase·Supabase)
- [ ] **구글 플레이 출시** — 개발자 등록($25) → 스토어 자료(아이콘512·피처그래픽·스크린샷) → 데이터 보안 신고 → **비공개 테스트 20명·14일** → 프로덕션
  - 가이드: [google-play-release-guide.md](google-play-release-guide.md)
- [ ] (선택) iOS App Store 출시 (Apple $99/년)
- [ ] (선택) 라이트 모드, 푸시 알림, 벡터 아이콘

---

## 7. 참고 링크
- 코드: https://github.com/Ryan-JBC/shoes-log
- 설계/계획 문서: `docs/superpowers/specs/`, `docs/superpowers/plans/`
- 출시 가이드: [google-play-release-guide.md](google-play-release-guide.md)
- 개인정보처리방침: https://ryan-jbc.github.io/shoes-log/privacy.html
