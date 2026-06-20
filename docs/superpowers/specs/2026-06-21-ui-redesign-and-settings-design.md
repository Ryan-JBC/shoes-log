# UI 리디자인 + 설정/검증 기능 — 설계 문서

- **작성일**: 2026-06-21
- **상태**: 승인됨 (구현 계획 작성 대기)
- **선행 버전**: Ver.01.00 (MVP, Expo SDK 54). 본 작업은 그 위에 UI 개선 + 소기능 추가.

## 1. 개요

기능 위주로 만든 MVP의 UI를 **모던한 다크 "볼드 스포티"** 스타일로 다듬고, 세 가지 기능을 추가한다:

1. **사용자 선택형 포인트 색** (설정 탭에서 8색 중 선택, 앱 전체 적용·저장)
2. **은퇴 신발 구분 표시** (내 신발 화면에 사용 중/은퇴/전체 필터, 은퇴 해제 가능)
3. **날짜 입력 개선** (달력 선택기 + 미래 날짜 금지 검증)

브레인스토밍 시 시각 시안으로 방향 확정: 디자인 = B(볼드 스포티 다크), 은퇴 표시 = B(상단 세그먼트 필터), 색 = 사용자 선택형 8색 팔레트, 날짜 = B(날짜 선택기).

## 2. 핵심 결정 사항

| 항목 | 결정 |
|---|---|
| 기본 테마 | 다크 모드 (볼드 스포티) |
| 포인트 색 | 사용자 선택 (8색 팔레트), 즉시 적용 + 영구 저장 |
| 색 저장소 | 기존 SQLite에 settings 키-값 테이블 (새 의존성 없음) |
| 테마 전달 | React Context (ThemeProvider) |
| 설정 진입 | 하단 4번째 탭 ⚙️ 설정 |
| 은퇴 신발 | 내 신발 상단 세그먼트 [사용 중 / 은퇴 / 전체], 은퇴 신발 흐리게 + 상세 진입/해제 가능 |
| 날짜 입력 | `@react-native-community/datetimepicker` 달력 선택기, 미래 날짜 선택 불가 |
| 날짜 검증 | 저장 직전 도메인 검증(올바른 YYYY-MM-DD + 미래 금지), TDD |

## 3. 테마 시스템

### 3-1. 토큰
`src/theme/`에 다크 팔레트와 토큰을 정의한다. 화면에 흩어진 하드코딩 색(`#fafafa`, `#666`, `#222`, `#eee` 등)을 토큰으로 교체한다.

- **고정 토큰(다크)**: `background`(#0f1115), `surface`(#15181f), `card`(#1e222b), `cardAlt`(#2a2f3a), `textPrimary`(#ffffff), `textSecondary`(#8b93a3), `textMuted`(#5b6473), `border`(#262b34)
- **상태색(고정)**: `statusNone`(#4caf50/녹색은 다크에 맞게 조정), `statusImminent`(#ff9800), `statusReached`(#f44336) — 교체 임박/도달 표시는 의미색 유지
- **포인트 색(가변)**: `accent` — 사용자가 고른 값. 기본값 = 형광 라임(#c4ff3d)

### 8색 팔레트
`['#c4ff3d'(라임), '#ff7a18'(오렌지), '#22d3ee'(시안), '#f43f8e'(마젠타), '#3b82f6'(블루), '#a78bfa'(퍼플), '#ef4444'(레드), '#10b981'(그린)]`

### 3-2. ThemeContext / Provider
- `src/theme/ThemeProvider.tsx`: `accent` 상태를 보유, `setAccent(color)` 제공. 시작 시 SQLite에서 저장된 accent를 읽어 초기화. 변경 시 즉시 컨텍스트 갱신 + SQLite 저장.
- `useTheme()` 훅: `{ colors, accent, setAccent }` 반환. 모든 화면/컴포넌트가 이를 통해 색을 사용.
- 앱 루트(`app/_layout.tsx`)에서 DB 초기화 후 `ThemeProvider`로 감싼다.

### 3-3. 저장 (SQLite settings)
- 스키마에 테이블 추가: `settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
- 데이터 계층 `src/db/settings.ts`: `getSetting(key): Promise<string|null>`, `setSetting(key, value): Promise<void>` (UPSERT)
- accent는 `key='accent_color'`로 저장.

## 4. 설정 탭 (신규)

- `app/(tabs)/settings.tsx`: 4번째 탭 (⚙️). 탭 레이아웃에 스크린 추가.
- **포인트 색상** 섹션: 8색 원형 스와치 그리드. 현재 선택색은 테두리 링으로 강조. 탭 → `setAccent()` 호출 (즉시 전체 적용 + 저장).
- **미리보기** 섹션: 선택색이 적용된 샘플 신발 카드 1개.
- (향후 확장 여지: 라이트 모드 토글, 백업 등 — 이번 범위 밖)

## 5. 내 신발 — 은퇴 신발 구분

- 데이터 계층 `getShoes` 시그니처 변경: `getShoes(filter: 'active' | 'retired' | 'all')` (기존 boolean 대체). 호출처 모두 갱신.
  - 일지 작성 신발 선택 등 "선택 가능한 신발"은 `'active'` 사용 유지.
- `app/(tabs)/index.tsx`: 상단 **세그먼트 컨트롤 [사용 중 / 은퇴 / 전체]**. 선택에 따라 목록 필터. 기본값 = 사용 중.
- 은퇴 신발 카드는 흐리게(`opacity`) 표시. 탭하면 상세로 진입 가능.
- 상세 화면(`app/shoe/[id].tsx`)의 "은퇴 해제" 버튼은 이미 존재 → 이제 은퇴 신발에 실제로 도달 가능해져 동작이 의미를 가짐.

## 6. 날짜 입력 + 검증

### 6-1. 날짜 선택기
- 라이브러리: `@react-native-community/datetimepicker` (expo install).
- 적용 위치: 신발 등록 `app/shoe/new.tsx`의 구매일, 일지 작성 `app/log/new.tsx`의 날짜.
- 동작: 필드 탭 → 달력 표시 → 날짜 선택 → `YYYY-MM-DD` 문자열로 저장. **`maximumDate = 오늘`** 로 설정해 미래 선택 불가.
- 구매일은 선택사항 유지(비울 수 있음). 일지 날짜는 필수, 기본값 오늘.

### 6-2. 검증 (안전장치, TDD)
`src/domain/validation.ts`에 날짜 검증 추가:
- `isValidISODate(s: string): boolean` — 정확히 `YYYY-MM-DD` 형식이며 실제 달력상 유효한 날짜 (예: `2026-13-40` 거부, `abcde`/5글자 거부).
- `isNotFuture(s: string, today: string): boolean` — 오늘 이하.
- `validateShoeInput`에 구매일이 있으면 형식+미래금지 검사 추가.
- `validateWearLogInput`에 날짜 형식+미래금지 검사 추가.
- 위반 시 한국어 에러 메시지 반환, 화면은 저장 차단 + Alert.

## 7. 전체 적용 (폴리시)

7개 화면/주요 컴포넌트를 테마 토큰으로 전환하여 일관된 다크 비주얼 적용:
- `app/(tabs)/index.tsx`, `logs.tsx`, `stats.tsx`, `settings.tsx`(신규), `(tabs)/_layout.tsx`
- `app/shoe/new.tsx`, `app/shoe/[id].tsx`, `app/log/new.tsx`, `app/log/[id].tsx`
- `src/components/ShoeCard.tsx`, `ProgressBar.tsx`, `EmptyState.tsx`, `PhotoPlaceholder.tsx`
- 탭 바, 헤더(Stack/Tabs `screenOptions`)도 다크 색상으로.
- 이모지 배지(🟠🔴)는 유지. 카드 모서리·여백·타이포 정리.

## 8. 데이터/검증 변경 요약

- **스키마**: `settings` 테이블 추가 (기존 테이블 불변).
- **데이터 계층**: `src/db/settings.ts` 신규; `getShoes` 필터 인자 변경.
- **도메인(TDD)**: 날짜 검증 함수 추가 및 기존 검증에 통합.

## 9. 테스트

- 도메인 날짜 검증은 **TDD** (Jest): 유효/무효 형식, 경계(오늘=통과, 내일=실패), 빈 값 처리.
- `getShoes` 필터 변경에 따른 기존 호출처 타입 정합성은 `tsc`로 확인.
- 화면/테마는 Expo 앱 실행(폰)으로 수동 검증 — 단, SDK 54 + Expo Go 환경 유지.

## 10. 범위

### 이번 작업
- ✅ 다크 테마 + 토큰화 + ThemeProvider + SQLite 저장
- ✅ 설정 탭(4번째) + 8색 포인트 선택
- ✅ 내 신발 은퇴 필터 + 은퇴 해제 도달성
- ✅ 날짜 선택기 + 미래 금지 검증
- ✅ 전 화면 다크 테마 적용

### 범위 밖 (나중에)
- 🔜 라이트 모드 토글
- 🔜 완전 자유 색(컬러휠)
- 🔜 커스텀 폰트, 아이콘 세트(이모지 → 벡터 아이콘)
- 🔜 푸시 알림, 클라우드 동기화, 앱스토어/플레이 배포

## 11. 제약

- **Expo SDK 54 유지** (Expo Go 호환). 추가 라이브러리는 반드시 `npx expo install`로 SDK 54 정합 버전 설치.
- 새 의존성: `@react-native-community/datetimepicker` (날짜 선택기) 1개만 추가. 색 저장은 기존 SQLite 재사용(무추가).
