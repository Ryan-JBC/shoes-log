# UI 리디자인 + 설정/통계/검증 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 Shoes Log MVP를 다크 "볼드 스포티" 테마로 리디자인하고, 사용자 선택형 포인트 색(설정 탭), 은퇴 신발 필터 + 구매 후 경과일, 날짜 선택기 + 미래 금지 검증, 상세 통계(기간 선택 + 막대그래프), 신발 종류 칩 선택을 추가한다.

**Architecture:** 순수 도메인 로직(날짜·통계)을 의존성 없는 함수로 분리해 TDD한다. 색상은 `src/theme`의 토큰 + React Context(`ThemeProvider`)로 전 화면이 공유하고, 사용자가 고른 포인트 색은 기존 SQLite의 `settings` 테이블에 저장한다. 화면은 하드코딩 색을 테마 토큰으로 교체한다.

**Tech Stack:** React Native, Expo SDK 54, TypeScript, expo-router, expo-sqlite, `@react-native-community/datetimepicker`(신규), Jest + ts-jest. 차트는 라이브러리 없이 React Native `View`로 구현.

## Global Constraints

- **Expo SDK 54 유지** (Expo Go 호환). 새 네이티브 라이브러리는 반드시 `npx expo install`로 설치 (npm install 금지).
- 새 의존성은 `@react-native-community/datetimepicker` **1개만**. 색 저장은 기존 SQLite 재사용(무추가). 차트는 View로 구현(무추가).
- TypeScript strict. 검증/통계 순수 로직은 TDD. 테스트는 `**/src/**/*.test.ts`.
- 다크 테마 고정. 포인트 색 기본값 = 형광 라임 `#c4ff3d`. 8색 팔레트: `['#c4ff3d','#ff7a18','#22d3ee','#f43f8e','#3b82f6','#a78bfa','#ef4444','#10b981']`.
- 교체 임계값(기존 유지): 임박 = `target - total <= 50`, 도달 = `total >= target`, target 없으면 none.
- 날짜는 `YYYY-MM-DD` 문자열. 미래 날짜 금지. 누적 거리는 저장하지 않고 항상 합계 계산(기존 유지).
- 검증 실패 시 한국어 메시지 + Alert, 저장 차단. DB/파일 에러는 Alert로 표시(삼키지 않음).
- 화면 검증은 폰(Expo Go, `npx expo start -c`)에서 수동 — 단, 이 환경에서는 `expo start`를 실행하지 말 것(TTY 없음). tsc/jest/expo-doctor로 대체 검증하고 실기기 검증은 사용자에게 미룸.

---

## File Structure

```
src/
  theme/
    colors.ts              # 다크 토큰 + 8색 팔레트 + 기본 accent
    ThemeProvider.tsx      # ThemeProvider, useTheme()
  domain/
    dates.ts               # isValidISODate, isNotFuture, daysSince (TDD)
    dates.test.ts
    stats.ts               # rangeFor, computeStats (TDD)
    stats.test.ts
    validation.ts          # (수정) 날짜 검증 통합
    validation.test.ts     # (수정)
  db/
    schema.ts              # (수정) settings 테이블 추가
    settings.ts            # getSetting, setSetting
    shoes.ts               # (수정) getShoes 필터 시그니처 변경
  components/
    DateField.tsx          # 탭→달력 선택기, maximumDate=오늘, YYYY-MM-DD 반환
    SegmentedControl.tsx   # [라벨...] 세그먼트 선택 (테마)
    BarRow.tsx             # 가로 막대 1행 (라벨+값+바)
    ShoeCard.tsx           # (수정) 테마 + 구매 후 N일
    ProgressBar.tsx        # (수정) 테마
    EmptyState.tsx         # (수정) 테마
    PhotoPlaceholder.tsx   # (수정) 테마
app/
  _layout.tsx              # (수정) ThemeProvider로 감싸기 + 다크 배경
  (tabs)/
    _layout.tsx            # (수정) 다크 탭바 + 설정 탭 추가
    index.tsx              # (수정) 테마 + 세그먼트 필터
    logs.tsx               # (수정) 테마
    stats.tsx              # (수정) 전면 개편: 기간 + 요약 + 차트
    settings.tsx           # (신규) 포인트 색 선택
  shoe/
    new.tsx                # (수정) 테마 + 종류 칩 + 날짜 선택기 + 검증
    [id].tsx               # (수정) 테마 + 구매 후 N일
  log/
    new.tsx                # (수정) 테마 + 날짜 선택기
    [id].tsx               # (수정) 테마
```

**색상 매핑 규칙 (모든 화면 공통):** 하드코딩 색을 다음 토큰으로 교체한다. 화면 컴포넌트에서 `const { colors, accent } = useTheme();` 후 사용.

| 기존 하드코딩 | 테마 토큰 |
|---|---|
| 화면 바깥 배경 (없거나 흰색) | `colors.background` (#0f1115) |
| `#fafafa`, `#f5f5f5`, `#eee`(카드/입력 배경) | `colors.card` (#1e222b) |
| `#e0e0e0`, 썸네일 placeholder 배경 | `colors.cardAlt` (#2a2f3a) |
| 본문 큰 글씨 / `#111` / 기본 검정 | `colors.textPrimary` (#fff) |
| `#666`, `#888` | `colors.textSecondary` (#8b93a3) |
| `#999`, `#ccc` 보더/약한 글씨 | `colors.textMuted` (#5b6473) / `colors.border` (#262b34) |
| 주요 버튼 배경 `#222` | `accent` (글자색은 `#0d0d0d`) |
| 위험(삭제) `#ffebee`/`#c62828` | 배경 `colors.card`, 글자 `colors.danger` (#f44336) |

---

## Task 1: 날짜 도메인 로직 (TDD)

**Files:**
- Create: `src/domain/dates.ts`, `src/domain/dates.test.ts`

**Interfaces:**
- Produces:
  - `isValidISODate(s: string): boolean`
  - `isNotFuture(s: string, today: string): boolean`
  - `daysSince(fromDate: string, today: string): number | null`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/domain/dates.test.ts`:
```ts
import { isValidISODate, isNotFuture, daysSince } from './dates';

describe('isValidISODate', () => {
  test('올바른 날짜', () => { expect(isValidISODate('2026-06-21')).toBe(true); });
  test('형식 틀림(5글자)', () => { expect(isValidISODate('2026-')).toBe(false); });
  test('숫자 아님', () => { expect(isValidISODate('abcde')).toBe(false); });
  test('존재하지 않는 달/일', () => {
    expect(isValidISODate('2026-13-40')).toBe(false);
    expect(isValidISODate('2026-02-30')).toBe(false);
  });
  test('빈 문자열', () => { expect(isValidISODate('')).toBe(false); });
});

describe('isNotFuture', () => {
  test('오늘은 통과', () => { expect(isNotFuture('2026-06-21', '2026-06-21')).toBe(true); });
  test('과거는 통과', () => { expect(isNotFuture('2026-06-20', '2026-06-21')).toBe(true); });
  test('미래는 실패', () => { expect(isNotFuture('2026-06-22', '2026-06-21')).toBe(false); });
});

describe('daysSince', () => {
  test('같은 날 = 0', () => { expect(daysSince('2026-06-21', '2026-06-21')).toBe(0); });
  test('과거 = 양수', () => { expect(daysSince('2026-06-01', '2026-06-21')).toBe(20); });
  test('월 경계 넘김', () => { expect(daysSince('2026-05-31', '2026-06-01')).toBe(1); });
  test('잘못된 날짜 = null', () => { expect(daysSince('bad', '2026-06-21')).toBeNull(); });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/dates.test.ts`
Expected: FAIL ("Cannot find module './dates'").

- [ ] **Step 3: 구현 작성**

Create `src/domain/dates.ts`:
```ts
export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isNotFuture(s: string, today: string): boolean {
  // ISO 'YYYY-MM-DD' 문자열은 사전식 비교가 날짜 순서와 일치
  return s <= today;
}

export function daysSince(fromDate: string, today: string): number | null {
  if (!isValidISODate(fromDate) || !isValidISODate(today)) return null;
  const toUTC = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(today) - toUTC(fromDate)) / 86_400_000);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/dates.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add date domain logic (valid/future/daysSince)"
```

---

## Task 2: 검증에 날짜 규칙 통합 (TDD)

**Files:**
- Modify: `src/domain/validation.ts`, `src/domain/validation.test.ts`

**Interfaces:**
- Consumes: `isValidISODate`, `isNotFuture` from `./dates`; `NewShoe`, `NewWearLog`.
- Produces (시그니처 변경):
  - `validateShoeInput(input: NewShoe, today?: string): string[]` — `today` 기본값 = 오늘(ISO). 기본값 덕분에 기존 1-인자 호출처도 전환 기간 동안 컴파일됨.
  - `validateWearLogInput(input: Pick<NewWearLog,'shoe_id'|'date'|'distance'>, today?: string): string[]`
  - 새 호출처(Task 11/13)는 `today = new Date().toISOString().slice(0,10)`를 명시적으로 넘긴다.

- [ ] **Step 1: 테스트 추가/수정**

`src/domain/validation.test.ts`의 기존 `baseShoe` 사용 테스트들에 `today` 인자를 추가하고, 날짜 케이스를 더한다. 파일 상단 import에 추가: 없음(동일). 다음 테스트를 추가하고, 기존 호출을 `validateShoeInput(x)` → `validateShoeInput(x, '2026-06-21')`, `validateWearLogInput(y)` → `validateWearLogInput(y, '2026-06-21')`로 모두 수정한다. 추가 테스트:
```ts
const TODAY = '2026-06-21';

describe('validateShoeInput 날짜', () => {
  test('구매일 미래면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: '2026-06-22' }, TODAY))
      .toContain('구매일은 미래일 수 없습니다.');
  });
  test('구매일 형식 틀리면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: '2026-6-1' }, TODAY))
      .toContain('구매일 형식이 올바르지 않습니다.');
  });
  test('구매일 비어있으면 통과', () => {
    expect(validateShoeInput({ ...baseShoe, purchase_date: null }, TODAY)).toEqual([]);
  });
});

describe('validateWearLogInput 날짜', () => {
  test('날짜 미래면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-22', distance: 5 }, TODAY))
      .toContain('날짜는 미래일 수 없습니다.');
  });
  test('날짜 형식 틀리면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: 'bad', distance: 5 }, TODAY))
      .toContain('날짜 형식이 올바르지 않습니다.');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/validation.test.ts`
Expected: FAIL (today 인자 / 새 메시지 미구현).

- [ ] **Step 3: 구현 수정**

`src/domain/validation.ts` 전체를 아래로 교체:
```ts
import { NewShoe, NewWearLog } from '../types';
import { isValidISODate, isNotFuture } from './dates';

export function validateShoeInput(
  input: NewShoe,
  today: string = new Date().toISOString().slice(0, 10),
): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.trim() === '') {
    errors.push('신발 이름을 입력하세요.');
  }
  if (input.price != null && input.price < 0) {
    errors.push('가격은 0 이상이어야 합니다.');
  }
  if (input.target_distance != null && input.target_distance < 0) {
    errors.push('목표 거리는 0 이상이어야 합니다.');
  }
  if (input.purchase_date != null && input.purchase_date !== '') {
    if (!isValidISODate(input.purchase_date)) {
      errors.push('구매일 형식이 올바르지 않습니다.');
    } else if (!isNotFuture(input.purchase_date, today)) {
      errors.push('구매일은 미래일 수 없습니다.');
    }
  }
  return errors;
}

export function validateWearLogInput(
  input: Pick<NewWearLog, 'shoe_id' | 'date' | 'distance'>,
  today: string = new Date().toISOString().slice(0, 10),
): string[] {
  const errors: string[] = [];
  if (!input.shoe_id) {
    errors.push('신발을 선택하세요.');
  }
  if (!input.date || input.date.trim() === '') {
    errors.push('날짜를 입력하세요.');
  } else if (!isValidISODate(input.date)) {
    errors.push('날짜 형식이 올바르지 않습니다.');
  } else if (!isNotFuture(input.date, today)) {
    errors.push('날짜는 미래일 수 없습니다.');
  }
  if (input.distance != null && input.distance < 0) {
    errors.push('거리는 0 이상이어야 합니다.');
  }
  return errors;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: integrate date validation into input validation"
```

> 참고: 호출처(`app/shoe/new.tsx`, `app/log/new.tsx`)는 Task 11/13에서 `today` 인자를 넘기도록 함께 수정한다.

---

## Task 3: 통계 집계 로직 (TDD)

**Files:**
- Create: `src/domain/stats.ts`, `src/domain/stats.test.ts`

**Interfaces:**
- Consumes: 없음(순수). 입력 타입은 구조적.
- Produces:
  - `type RangeKind = 'month' | 'year' | 'all' | 'custom'`
  - `rangeFor(kind: RangeKind, today: string, custom?: { start: string; end: string }): { start: string; end: string }`
  - `interface StatLogInput { shoe_id: number; date: string; distance: number | null }`
  - `interface StatShoeInput { id: number; name: string }`
  - `interface StatsResult { totalDistance: number; totalWears: number; mostWorn: { name: string; count: number } | null; perShoe: { name: string; distance: number }[]; monthly: { month: string; distance: number }[] }`
  - `computeStats(shoes: StatShoeInput[], logs: StatLogInput[], range: { start: string; end: string }): StatsResult`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/domain/stats.test.ts`:
```ts
import { rangeFor, computeStats, StatLogInput, StatShoeInput } from './stats';

describe('rangeFor', () => {
  test('month', () => {
    expect(rangeFor('month', '2026-06-21')).toEqual({ start: '2026-06-01', end: '2026-06-21' });
  });
  test('year', () => {
    expect(rangeFor('year', '2026-06-21')).toEqual({ start: '2026-01-01', end: '2026-06-21' });
  });
  test('all', () => {
    expect(rangeFor('all', '2026-06-21')).toEqual({ start: '0000-01-01', end: '9999-12-31' });
  });
  test('custom', () => {
    expect(rangeFor('custom', '2026-06-21', { start: '2026-03-01', end: '2026-03-31' }))
      .toEqual({ start: '2026-03-01', end: '2026-03-31' });
  });
});

const shoes: StatShoeInput[] = [
  { id: 1, name: '페가수스' },
  { id: 2, name: '울트라' },
];
const logs: StatLogInput[] = [
  { shoe_id: 1, date: '2026-06-02', distance: 5 },
  { shoe_id: 1, date: '2026-06-10', distance: 3 },
  { shoe_id: 2, date: '2026-06-15', distance: 10 },
  { shoe_id: 1, date: '2026-05-20', distance: 7 }, // 범위 밖(6월 기준)
];

describe('computeStats (2026-06 범위)', () => {
  const r = { start: '2026-06-01', end: '2026-06-30' };
  test('총 거리/횟수는 범위 내만', () => {
    const s = computeStats(shoes, logs, r);
    expect(s.totalDistance).toBe(18);
    expect(s.totalWears).toBe(3);
  });
  test('가장 많이 신은 신발 = 페가수스(2회)', () => {
    expect(computeStats(shoes, logs, r).mostWorn).toEqual({ name: '페가수스', count: 2 });
  });
  test('신발별 누적 거리 내림차순', () => {
    expect(computeStats(shoes, logs, r).perShoe).toEqual([
      { name: '울트라', distance: 10 },
      { name: '페가수스', distance: 8 },
    ]);
  });
  test('월별 버킷', () => {
    expect(computeStats(shoes, logs, r).monthly).toEqual([{ month: '2026-06', distance: 18 }]);
  });
  test('빈 데이터', () => {
    const s = computeStats(shoes, [], r);
    expect(s).toEqual({ totalDistance: 0, totalWears: 0, mostWorn: null, perShoe: [], monthly: [] });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/stats.test.ts`
Expected: FAIL ("Cannot find module './stats'").

- [ ] **Step 3: 구현 작성**

Create `src/domain/stats.ts`:
```ts
export type RangeKind = 'month' | 'year' | 'all' | 'custom';

export interface StatLogInput {
  shoe_id: number;
  date: string;
  distance: number | null;
}
export interface StatShoeInput {
  id: number;
  name: string;
}
export interface StatsResult {
  totalDistance: number;
  totalWears: number;
  mostWorn: { name: string; count: number } | null;
  perShoe: { name: string; distance: number }[];
  monthly: { month: string; distance: number }[];
}

export function rangeFor(
  kind: RangeKind,
  today: string,
  custom?: { start: string; end: string },
): { start: string; end: string } {
  if (kind === 'all') return { start: '0000-01-01', end: '9999-12-31' };
  if (kind === 'custom') return custom ?? { start: today, end: today };
  if (kind === 'year') return { start: `${today.slice(0, 4)}-01-01`, end: today };
  // month
  return { start: `${today.slice(0, 7)}-01`, end: today };
}

export function computeStats(
  shoes: StatShoeInput[],
  logs: StatLogInput[],
  range: { start: string; end: string },
): StatsResult {
  const nameById = new Map(shoes.map((s) => [s.id, s.name]));
  const inRange = logs.filter((l) => l.date >= range.start && l.date <= range.end);

  let totalDistance = 0;
  const distByShoe = new Map<number, number>();
  const countByShoe = new Map<number, number>();
  const distByMonth = new Map<string, number>();

  for (const l of inRange) {
    const d = l.distance ?? 0;
    totalDistance += d;
    distByShoe.set(l.shoe_id, (distByShoe.get(l.shoe_id) ?? 0) + d);
    countByShoe.set(l.shoe_id, (countByShoe.get(l.shoe_id) ?? 0) + 1);
    const mk = l.date.slice(0, 7);
    distByMonth.set(mk, (distByMonth.get(mk) ?? 0) + d);
  }

  let mostWorn: { name: string; count: number } | null = null;
  for (const [id, count] of countByShoe) {
    if (!mostWorn || count > mostWorn.count) {
      mostWorn = { name: nameById.get(id) ?? '(삭제됨)', count };
    }
  }

  const perShoe = [...distByShoe.entries()]
    .map(([id, distance]) => ({ name: nameById.get(id) ?? '(삭제됨)', distance }))
    .sort((a, b) => b.distance - a.distance);

  const monthly = [...distByMonth.entries()]
    .map(([month, distance]) => ({ month, distance }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  return { totalDistance, totalWears: inRange.length, mostWorn, perShoe, monthly };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/stats.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add stats aggregation logic"
```

---

## Task 4: settings 테이블 + 데이터 계층

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/settings.ts`

**Interfaces:**
- Consumes: `getDb()` from `./database`.
- Produces:
  - `getSetting(key: string): Promise<string | null>`
  - `setSetting(key: string, value: string): Promise<void>` (UPSERT)

- [ ] **Step 1: 스키마에 settings 테이블 추가**

`src/db/schema.ts`의 템플릿 문자열에서 `CREATE INDEX ...` 두 줄 **앞에** 다음을 삽입:
```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

- [ ] **Step 2: settings 데이터 계층 작성**

Create `src/db/settings.ts`:
```ts
import { getDb } from './database';

export async function getSetting(key: string): Promise<string | null> {
  const row = await getDb().getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}
```

- [ ] **Step 3: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add settings table and key-value data layer"
```

---

## Task 5: getShoes 필터 시그니처 변경 + 호출처 갱신

**Files:**
- Modify: `src/db/shoes.ts:22-28`
- Modify: `app/(tabs)/index.tsx`, `app/(tabs)/logs.tsx`, `app/(tabs)/stats.tsx`, `app/shoe/[id].tsx`, `app/log/new.tsx`

**Interfaces:**
- Produces: `getShoes(filter?: 'active' | 'retired' | 'all'): Promise<Shoe[]>` (기본 `'active'`).
- 호출처 매핑: 기존 `getShoes(false)` → `getShoes('active')`; 기존 `getShoes(true)` → `getShoes('all')`.

- [ ] **Step 1: getShoes 구현 교체**

`src/db/shoes.ts`의 `getShoes` 함수를 아래로 교체:
```ts
export async function getShoes(filter: 'active' | 'retired' | 'all' = 'active'): Promise<Shoe[]> {
  const db = getDb();
  const where =
    filter === 'active' ? 'WHERE retired = 0' :
    filter === 'retired' ? 'WHERE retired = 1' : '';
  return db.getAllAsync<Shoe>(`SELECT * FROM shoes ${where} ORDER BY created_at DESC`);
}
```

- [ ] **Step 2: 모든 호출처 갱신 (boolean → 문자열)**

각 파일에서 `getShoes(false)`를 `getShoes('active')`로, `getShoes(true)`를 `getShoes('all')`로 바꾼다. (대상: `app/(tabs)/index.tsx`, `app/(tabs)/logs.tsx`, `app/(tabs)/stats.tsx`, `app/shoe/[id].tsx`는 사용 안 할 수 있음 — grep으로 확인, `app/log/new.tsx`.) 먼저 검색:
```bash
cd /Users/ryan/Coding/app_Shoes_log && grep -rn "getShoes(" app
```
나온 모든 위치를 매핑대로 수정.

- [ ] **Step 3: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음 (boolean 인자가 남아있으면 타입 에러로 잡힘).

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "refactor: getShoes filter active/retired/all and update call sites"
```

---

## Task 6: 테마 토큰 + ThemeProvider + 루트 연결

**Files:**
- Create: `src/theme/colors.ts`, `src/theme/ThemeProvider.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `getSetting`, `setSetting` from `../db/settings`.
- Produces:
  - `darkColors`, `ACCENT_PALETTE` (8색), `DEFAULT_ACCENT` from `src/theme/colors`
  - `ThemeProvider`, `useTheme(): { colors: typeof darkColors; accent: string; setAccent: (c: string) => void }` from `src/theme/ThemeProvider`

- [ ] **Step 1: 색 토큰 작성**

Create `src/theme/colors.ts`:
```ts
export const darkColors = {
  background: '#0f1115',
  surface: '#15181f',
  card: '#1e222b',
  cardAlt: '#2a2f3a',
  textPrimary: '#ffffff',
  textSecondary: '#8b93a3',
  textMuted: '#5b6473',
  border: '#262b34',
  danger: '#f44336',
  warning: '#ff9800',
  success: '#4caf50',
};

export const ACCENT_PALETTE = [
  '#c4ff3d', '#ff7a18', '#22d3ee', '#f43f8e',
  '#3b82f6', '#a78bfa', '#ef4444', '#10b981',
] as const;

export const DEFAULT_ACCENT = '#c4ff3d';

// accent 배경 위 글자색 (밝은 accent 대비 어두운 글자)
export const ON_ACCENT = '#0d0d0d';
```

- [ ] **Step 2: ThemeProvider 작성**

Create `src/theme/ThemeProvider.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { darkColors, DEFAULT_ACCENT } from './colors';
import { getSetting, setSetting } from '../db/settings';

interface ThemeValue {
  colors: typeof darkColors;
  accent: string;
  setAccent: (c: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    getSetting('accent_color')
      .then((v) => { if (v) setAccentState(v); })
      .catch(() => {});
  }, []);

  function setAccent(c: string) {
    setAccentState(c);
    setSetting('accent_color', c).catch(() => {});
  }

  return (
    <ThemeContext.Provider value={{ colors: darkColors, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

- [ ] **Step 3: 루트 레이아웃에 Provider + 다크 배경 적용**

`app/_layout.tsx` 전체를 아래로 교체:
```tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { initDatabase } from '../src/db/database';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { darkColors } from '../src/theme/colors';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase().then(() => setReady(true)).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: darkColors.background }}>
        <Text style={{ color: darkColors.textPrimary }}>데이터베이스 초기화 실패: {error}</Text>
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: darkColors.background }}>
        <Text style={{ color: darkColors.textPrimary }}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: darkColors.surface },
          headerTintColor: darkColors.textPrimary,
          contentStyle: { backgroundColor: darkColors.background },
        }}
      />
    </ThemeProvider>
  );
}
```

- [ ] **Step 4: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add theme tokens, ThemeProvider, dark root layout"
```

---

## Task 7: 날짜 선택기 의존성 + DateField 컴포넌트

**Files:**
- Create: `src/components/DateField.tsx`

**Interfaces:**
- Consumes: `@react-native-community/datetimepicker`, `useTheme`.
- Produces: `DateField` — props `{ label: string; value: string | null; onChange: (iso: string) => void; placeholder?: string; maximumDate?: Date }`. 탭하면 달력이 뜨고, 고른 날짜를 `YYYY-MM-DD`로 `onChange`. 기본 `maximumDate = 오늘`.

- [ ] **Step 1: 라이브러리 설치 (expo install)**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx expo install @react-native-community/datetimepicker`
Expected: package.json에 SDK 54 정합 버전 추가.

- [ ] **Step 2: DateField 작성**

Create `src/components/DateField.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeProvider';

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateField({
  label, value, onChange, placeholder = '날짜 선택', maximumDate = new Date(),
}: {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  maximumDate?: Date;
}) {
  const { colors, accent } = useTheme();
  const [show, setShow] = useState(false);

  const current = value ? new Date(value + 'T00:00:00') : new Date();

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.card }}
      >
        <Text style={{ color: value ? colors.textPrimary : colors.textMuted }}>
          {value ?? placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={maximumDate}
          themeVariant="dark"
          onChange={(event, selected) => {
            setShow(false);
            if (event.type !== 'dismissed' && selected) {
              onChange(toISO(selected));
            }
          }}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 3: 컴파일 + 도구 점검**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit && CI=1 npx expo-doctor`
Expected: tsc 에러 없음. expo-doctor 통과(또는 기존과 동일한 무해 경고만). datetimepicker 타입 에러가 나면 BLOCKED로 보고하고 설치된 버전의 export를 확인.

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add datetimepicker and reusable DateField component"
```

---

## Task 8: SegmentedControl + 다크 탭바 + 설정 탭/화면

**Files:**
- Create: `src/components/SegmentedControl.tsx`, `app/(tabs)/settings.tsx`
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useTheme`, `ACCENT_PALETTE`, `ON_ACCENT`.
- Produces:
  - `SegmentedControl` — props `{ options: { key: string; label: string }[]; value: string; onChange: (key: string) => void }`. 선택된 칸은 accent 배경.
  - 설정 탭(⚙️) 화면 with 8색 팔레트.

- [ ] **Step 1: SegmentedControl 작성**

Create `src/components/SegmentedControl.tsx`:
```tsx
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { ON_ACCENT } from '../theme/colors';

export function SegmentedControl({
  options, value, onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  const { colors, accent } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, backgroundColor: colors.surface, borderRadius: 10, padding: 3 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: active ? accent : 'transparent' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: active ? ON_ACCENT : colors.textSecondary }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 2: 탭 레이아웃에 다크 테마 + 설정 탭 추가**

`app/(tabs)/_layout.tsx` 전체를 아래로 교체:
```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, accent } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        sceneContainerStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '내 신발', tabBarIcon: () => <Text>👟</Text> }} />
      <Tabs.Screen name="logs" options={{ title: '일지', tabBarIcon: () => <Text>📖</Text> }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: () => <Text>📊</Text> }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: 설정 화면 작성**

Create `app/(tabs)/settings.tsx`:
```tsx
import { ScrollView, View, Text, Pressable } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ACCENT_PALETTE } from '../../src/theme/colors';

export default function SettingsTab() {
  const { colors, accent, setAccent } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>포인트 색상</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
        {ACCENT_PALETTE.map((c) => {
          const selected = c === accent;
          return (
            <Pressable
              key={c}
              onPress={() => setAccent(c)}
              style={{
                width: 40, height: 40, borderRadius: 20, backgroundColor: c,
                borderWidth: selected ? 3 : 0, borderColor: colors.background,
                shadowColor: selected ? c : 'transparent', shadowOpacity: selected ? 1 : 0, shadowRadius: 6,
                outlineWidth: selected ? 2 : 0,
              }}
            />
          );
        })}
      </View>

      <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 1, color: colors.textMuted }}>미리보기</Text>
      <View style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>👟</Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>페가수스 40</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>320 / 600 km</Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
            <View style={{ width: '53%', height: '100%', backgroundColor: accent }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음. (`outlineWidth`가 타입 에러면 그 줄 제거 — 웹 전용 속성이므로 빼도 됨.)

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add segmented control, dark tab bar, settings tab with accent picker"
```

---

## Task 9: 공용 컴포넌트 테마화 + ShoeCard 구매 후 N일

**Files:**
- Create: `src/components/BarRow.tsx`
- Modify: `src/components/ProgressBar.tsx`, `src/components/PhotoPlaceholder.tsx`, `src/components/EmptyState.tsx`, `src/components/ShoeCard.tsx`

**Interfaces:**
- Consumes: `useTheme`, `daysSince` from `../domain/dates`.
- Produces:
  - `ProgressBar` — props 변경 없음 `{ ratio: number; color: string }` (색은 호출자가 전달, 보통 accent/상태색). 트랙은 테마.
  - `BarRow` — props `{ label: string; valueLabel: string; ratio: number; color: string }` 가로 막대 한 줄.
  - `ShoeCard` — props 변경 없음 `{ shoe; total; status; onPress }`. 내부에서 테마 + "구매 후 N일" 표시.

- [ ] **Step 1: ProgressBar 테마화**

`src/components/ProgressBar.tsx` 전체 교체:
```tsx
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ height: 8, backgroundColor: colors.cardAlt, borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}
```

- [ ] **Step 2: PhotoPlaceholder 테마화**

`src/components/PhotoPlaceholder.tsx` 전체 교체:
```tsx
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function PhotoPlaceholder({ size = 64 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: 8, backgroundColor: colors.cardAlt, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: size * 0.4 }}>👟</Text>
    </View>
  );
}
```

- [ ] **Step 3: EmptyState 테마화**

`src/components/EmptyState.tsx` 전체 교체:
```tsx
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: colors.background }}>
      <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
```

- [ ] **Step 4: BarRow 작성 (통계 막대용)**

Create `src/components/BarRow.tsx`:
```tsx
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function BarRow({
  label, valueLabel, ratio, color,
}: {
  label: string;
  valueLabel: string;
  ratio: number;
  color: string;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ gap: 3 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: colors.textPrimary }} numberOfLines={1}>{label}</Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>{valueLabel}</Text>
      </View>
      <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 5, backgroundColor: color }} />
      </View>
    </View>
  );
}
```

- [ ] **Step 5: ShoeCard 테마화 + 구매 후 N일**

`src/components/ShoeCard.tsx` 전체 교체:
```tsx
import { View, Text, Image, Pressable } from 'react-native';
import { Shoe, ReplacementStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { useTheme } from '../theme/ThemeProvider';
import { daysSince } from '../domain/dates';

const STATUS_KEY: Record<ReplacementStatus, 'success' | 'warning' | 'danger'> = {
  none: 'success', imminent: 'warning', reached: 'danger',
};

export function ShoeCard({
  shoe, total, status, onPress,
}: {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
  onPress: () => void;
}) {
  const { colors, accent } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const days = shoe.purchase_date ? daysSince(shoe.purchase_date, today) : null;
  const barColor = colors[STATUS_KEY[status]];

  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: colors.card, marginBottom: 10, opacity: shoe.retired ? 0.5 : 1 }}
    >
      {shoe.photo_uri ? (
        <Image source={{ uri: shoe.photo_uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
      ) : (
        <PhotoPlaceholder size={64} />
      )}
      <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: colors.textPrimary }}>{shoe.name}</Text>
          {shoe.retired === 1 && <Text style={{ fontSize: 11, color: colors.textMuted }}>은퇴</Text>}
          {shoe.retired === 0 && status === 'imminent' && <Text>🟠</Text>}
          {shoe.retired === 0 && status === 'reached' && <Text>🔴</Text>}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
          {shoe.target_distance != null
            ? `${total.toFixed(1)} / ${shoe.target_distance} km${status === 'reached' && shoe.retired === 0 ? '  · 교체 권장' : ''}`
            : `${total.toFixed(1)} km`}
        </Text>
        {days != null && (
          <Text style={{ color: colors.textMuted, fontSize: 11 }}>구매 후 {days}일</Text>
        )}
        {shoe.target_distance != null && (
          <ProgressBar ratio={total / shoe.target_distance} color={barColor} />
        )}
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 6: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 7: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: theme shared components, add BarRow and days-since on ShoeCard"
```

---

## Task 10: 내 신발 화면 — 테마 + 은퇴 필터

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `getShoes('active'|'retired'|'all')`, `getWearLogsForShoe`, `totalDistance`, `replacementStatus`, `ShoeCard`, `SegmentedControl`, `EmptyState`, `useTheme`.

- [ ] **Step 1: 화면 교체**

`app/(tabs)/index.tsx` 전체를 아래로 교체:
```tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus } from '../../src/domain/mileage';
import { ShoeCard } from '../../src/components/ShoeCard';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { EmptyState } from '../../src/components/EmptyState';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Shoe, ReplacementStatus } from '../../src/types';

interface Row { shoe: Shoe; total: number; status: ReplacementStatus; }
type Filter = 'active' | 'retired' | 'all';

export default function ShoesTab() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<Filter>('active');
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback((f: Filter) => {
    (async () => {
      try {
        const shoes = await getShoes(f);
        const built: Row[] = [];
        for (const shoe of shoes) {
          const logs = await getWearLogsForShoe(shoe.id);
          const total = totalDistance(logs);
          built.push({ shoe, total, status: replacementStatus(total, shoe.target_distance) });
        }
        setRows(built);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  useFocusEffect(useCallback(() => { load(filter); }, [filter, load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: '내 신발',
          headerRight: () => (
            <Pressable onPress={() => router.push('/shoe/new')} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 26, color: colors.textPrimary }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      <View style={{ padding: 12, paddingBottom: 4 }}>
        <SegmentedControl
          options={[{ key: 'active', label: '사용 중' }, { key: 'retired', label: '은퇴' }, { key: 'all', label: '전체' }]}
          value={filter}
          onChange={(k) => { setFilter(k as Filter); load(k as Filter); }}
        />
      </View>
      {rows.length === 0 ? (
        <EmptyState message={filter === 'active' ? '사용 중인 신발이 없어요.\n오른쪽 위 ＋ 로 신발을 추가하세요.' : '해당하는 신발이 없어요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12, paddingTop: 4 }}
          data={rows}
          keyExtractor={(r) => String(r.shoe.id)}
          renderItem={({ item }) => (
            <ShoeCard shoe={item.shoe} total={item.total} status={item.status} onPress={() => router.push(`/shoe/${item.shoe.id}`)} />
          )}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: dark collection screen with active/retired/all filter"
```

---

## Task 11: 신발 등록 — 테마 + 종류 칩 + 날짜 선택기 + 검증

**Files:**
- Modify: `app/shoe/new.tsx`

**Interfaces:**
- Consumes: `addShoe`, `validateShoeInput(input, today)`, `savePhoto`, `DateField`, `useTheme`, `ACCENT_PALETTE`/`ON_ACCENT`, expo-image-picker.

- [ ] **Step 1: 화면 교체**

`app/shoe/new.tsx` 전체를 아래로 교체:
```tsx
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addShoe } from '../../src/db/shoes';
import { validateShoeInput } from '../../src/domain/validation';
import { savePhoto } from '../../src/services/photoStorage';
import { DateField } from '../../src/components/DateField';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ON_ACCENT } from '../../src/theme/colors';
import { NewShoe } from '../../src/types';

const CATEGORIES = ['러닝화', '운동화', '구두', '기타'] as const;

export default function NewShoeScreen() {
  const { colors, accent } = useTheme();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryChoice, setCategoryChoice] = useState<string | null>(null);
  const [categoryOther, setCategoryOther] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  function resolveCategory(): string | null {
    if (categoryChoice === '기타') return categoryOther.trim() || null;
    return categoryChoice;
  }

  async function onSave() {
    if (categoryChoice === '기타' && categoryOther.trim() === '') {
      Alert.alert('입력 오류', '기타 종류를 입력하세요.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const input: NewShoe = {
      name,
      brand: brand || null,
      category: resolveCategory(),
      photo_uri: null,
      purchase_date: purchaseDate,
      price: price ? Number(price) : null,
      target_distance: target ? Number(target) : null,
    };
    const errors = validateShoeInput(input, today);
    if (errors.length > 0) { Alert.alert('입력 오류', errors.join('\n')); return; }
    setSaving(true);
    try {
      if (photoUri) input.photo_uri = await savePhoto(photoUri);
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: '신발 등록' }} />
      <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>사진 추가</Text>
          </View>
        )}
      </Pressable>

      <Field label="이름 *" value={name} onChange={setName} placeholder="예: 나이키 페가수스 40" colors={colors} />
      <Field label="브랜드" value={brand} onChange={setBrand} colors={colors} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>종류</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((c) => {
          const sel = categoryChoice === c;
          return (
            <Pressable key={c} onPress={() => setCategoryChoice(c)}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: sel ? accent : colors.card }}>
              <Text style={{ color: sel ? ON_ACCENT : colors.textSecondary, fontWeight: '700' }}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      {categoryChoice === '기타' && (
        <TextInput value={categoryOther} onChangeText={setCategoryOther} placeholder="종류 직접 입력"
          placeholderTextColor={colors.textMuted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.textPrimary, backgroundColor: colors.card }} />
      )}

      <DateField label="구매일" value={purchaseDate} onChange={setPurchaseDate} placeholder="구매일 선택 (선택사항)" />
      <Field label="가격" value={price} onChange={setPrice} keyboardType="numeric" colors={colors} />
      <Field label="교체 목표 거리(km)" value={target} onChange={setTarget} keyboardType="numeric" placeholder="비우면 마일리지 미추적" colors={colors} />

      <Pressable onPress={onSave} disabled={saving}
        style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType, colors,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'numeric' | 'default';
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} keyboardType={keyboardType ?? 'default'}
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.textPrimary, backgroundColor: colors.card }} />
    </View>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: themed shoe registration with category chips, date picker, validation"
```

---

## Task 12: 신발 상세 — 테마 + 구매 후 N일

**Files:**
- Modify: `app/shoe/[id].tsx`

**Interfaces:**
- Consumes: 기존 import + `useTheme`, `daysSince`. 색 매핑 규칙 적용.

- [ ] **Step 1: 테마 적용 + 경과일 추가**

`app/shoe/[id].tsx`를 읽고 다음을 적용한다 (기존 로직/try-catch 유지):
1. 상단에 `import { useTheme } from '../../src/theme/ThemeProvider';`, `import { daysSince } from '../../src/domain/dates';` 추가. 컴포넌트 본문 시작에 `const { colors, accent } = useTheme();`.
2. 색 매핑 규칙표대로 모든 하드코딩 색 교체: 루트 `ScrollView`에 `style={{ backgroundColor: colors.background }}`(contentContainerStyle는 유지), 카드/박스 배경 `#fafafa`/`#f5f5f5` → `colors.card`, 글씨 `#666`/`#999` → `colors.textSecondary`/`colors.textMuted`, 큰 글씨 색 → `colors.textPrimary`. 진행바 상태색은 `colors.danger/warning/success` 사용. 은퇴/삭제 버튼 배경 → `colors.card`, 삭제 글자 → `colors.danger`.
3. 누적 거리 박스 아래에 구매 후 경과일 표시 추가 (구매일 있을 때만):
```tsx
{shoe.purchase_date && daysSince(shoe.purchase_date, new Date().toISOString().slice(0,10)) != null && (
  <Text style={{ color: colors.textMuted }}>
    구매일 {shoe.purchase_date} · 구매 후 {daysSince(shoe.purchase_date, new Date().toISOString().slice(0,10))}일
  </Text>
)}
```
(이 블록은 "누적 거리: ..." 텍스트가 들어있는 박스 안, target 안내 아래에 배치.)

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: theme shoe detail and show days-since-purchase"
```

---

## Task 13: 일지 작성 — 테마 + 날짜 선택기 + 검증 today 인자

**Files:**
- Modify: `app/log/new.tsx`

**Interfaces:**
- Consumes: `getShoes('active')`, `addWearLog`, `validateWearLogInput(input, today)`, `savePhotos`, `deletePhoto`, `DateField`, `useTheme`, expo-image-picker.

- [ ] **Step 1: 테마 + 날짜 선택기 + today 인자 적용**

`app/log/new.tsx`를 읽고 적용:
1. `import { DateField } from '../../src/components/DateField';`, `import { useTheme } from '../../src/theme/ThemeProvider';`, `import { ON_ACCENT } from '../../src/theme/colors';` 추가. 본문에 `const { colors, accent } = useTheme();`.
2. 날짜 입력을 기존 `TextInput`(date)에서 `DateField`로 교체:
```tsx
<DateField label="날짜" value={date} onChange={setDate} />
```
(state `date`는 기본값 오늘 유지: `useState(today())`.)
3. 검증 호출에 today 인자 추가:
```tsx
const todayStr = new Date().toISOString().slice(0, 10);
const errors = validateWearLogInput({ shoe_id: shoeId, date, distance: distance ? Number(distance) : null }, todayStr);
```
4. 색 매핑 규칙 적용: 루트 `ScrollView`에 `backgroundColor: colors.background`; 신발 선택 칩 배경 `#eee`/`#222` → 비선택 `colors.card`/선택 `accent`(+글자 `ON_ACCENT`); 입력칸 `inputStyle` 배경 `colors.card`, 보더 `colors.border`, 글자 `colors.textPrimary`, placeholder `colors.textMuted`; 라벨 글자 `colors.textPrimary`; 사진 추가 박스 배경 `colors.card`; 저장 버튼 배경 `accent`, 글자 `ON_ACCENT`.

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: themed wear-log creation with date picker and validation"
```

---

## Task 14: 일지 타임라인 + 일지 상세 테마화

**Files:**
- Modify: `app/(tabs)/logs.tsx`, `app/log/[id].tsx`

**Interfaces:**
- Consumes: `useTheme`. 색 매핑 규칙 적용 (로직 불변).

- [ ] **Step 1: logs.tsx 테마화**

`app/(tabs)/logs.tsx`를 읽고: `useTheme` import + `const { colors } = useTheme();`. 루트 `View`에 `backgroundColor: colors.background`; 항목 카드 `#fafafa` → `colors.card`; 글씨 `#666`/`#888` → `colors.textSecondary`/`colors.textMuted`, 신발명 → `colors.textPrimary`; 헤더 ＋ 글자색 `colors.textPrimary`. 로직/＋가드/네비게이션은 유지.

- [ ] **Step 2: log/[id].tsx 테마화**

`app/log/[id].tsx`를 읽고: `useTheme` import + `const { colors } = useTheme();`. 루트 `ScrollView`에 `backgroundColor: colors.background`; 글씨색 매핑(`#666` → `colors.textSecondary`, 신발명/메모 → `colors.textPrimary`); 삭제 버튼 배경 `colors.card`, 글자 `colors.danger`. 기존 try/catch(불러오기/삭제) 유지.

- [ ] **Step 3: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: theme wear-log timeline and detail screens"
```

---

## Task 15: 통계 화면 전면 개편

**Files:**
- Modify: `app/(tabs)/stats.tsx`

**Interfaces:**
- Consumes: `getShoes('all')`, `getWearLogs`, `rangeFor`, `computeStats`, `SegmentedControl`, `DateField`, `BarRow`, `useTheme`.

- [ ] **Step 1: 화면 교체**

`app/(tabs)/stats.tsx` 전체를 아래로 교체:
```tsx
import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogs } from '../../src/db/wearLogs';
import { rangeFor, computeStats, RangeKind, StatsResult } from '../../src/domain/stats';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { DateField } from '../../src/components/DateField';
import { BarRow } from '../../src/components/BarRow';
import { useTheme } from '../../src/theme/ThemeProvider';

const EMPTY: StatsResult = { totalDistance: 0, totalWears: 0, mostWorn: null, perShoe: [], monthly: [] };

export default function StatsTab() {
  const { colors, accent } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const [kind, setKind] = useState<RangeKind>('month');
  const [customStart, setCustomStart] = useState<string>(today);
  const [customEnd, setCustomEnd] = useState<string>(today);
  const [stats, setStats] = useState<StatsResult>(EMPTY);

  const load = useCallback((k: RangeKind, cs: string, ce: string) => {
    (async () => {
      try {
        const shoes = await getShoes('all');
        const logs = await getWearLogs();
        const range = rangeFor(k, today, { start: cs, end: ce });
        setStats(computeStats(shoes, logs, range));
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, [today]);

  useFocusEffect(useCallback(() => { load(kind, customStart, customEnd); }, [kind, customStart, customEnd, load]));

  const maxPerShoe = Math.max(1, ...stats.perShoe.map((s) => s.distance));
  const maxMonth = Math.max(1, ...stats.monthly.map((m) => m.distance));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: '통계' }} />

      <SegmentedControl
        options={[
          { key: 'month', label: '이번 달' }, { key: 'year', label: '올해' },
          { key: 'all', label: '전체' }, { key: 'custom', label: '사용자 지정' },
        ]}
        value={kind}
        onChange={(k) => setKind(k as RangeKind)}
      />

      {kind === 'custom' && (
        <View style={{ gap: 8 }}>
          <DateField label="시작일" value={customStart} onChange={setCustomStart} />
          <DateField label="종료일" value={customEnd} onChange={setCustomEnd} />
          {customStart > customEnd && (
            <Text style={{ color: colors.danger, fontSize: 12 }}>시작일이 종료일보다 늦습니다.</Text>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>총 거리</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{stats.totalDistance.toFixed(1)} <Text style={{ fontSize: 12, color: colors.textSecondary }}>km</Text></Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>착용 횟수</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{stats.totalWears} <Text style={{ fontSize: 12, color: colors.textSecondary }}>회</Text></Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
        <Text style={{ fontSize: 22 }}>🏆</Text>
        <View>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>가장 많이 신은 신발</Text>
          <Text style={{ color: accent, fontSize: 15, fontWeight: '800' }}>
            {stats.mostWorn ? `${stats.mostWorn.name} · ${stats.mostWorn.count}회` : '기록 없음'}
          </Text>
        </View>
      </View>

      <Text style={{ color: colors.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>신발별 누적 거리</Text>
      {stats.perShoe.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>데이터 없음</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {stats.perShoe.map((s, i) => (
            <BarRow key={i} label={s.name} valueLabel={`${s.distance.toFixed(1)} km`} ratio={s.distance / maxPerShoe} color={accent} />
          ))}
        </View>
      )}

      <Text style={{ color: colors.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>월별 거리 추이</Text>
      {stats.monthly.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>데이터 없음</Text>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {stats.monthly.map((m, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '70%', height: `${(m.distance / maxMonth) * 100}%`, backgroundColor: accent, borderRadius: 4 }} />
              <Text style={{ color: colors.textMuted, fontSize: 8 }}>{m.month.slice(5)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: detailed stats screen with range selector and bar charts"
```

---

## Task 16: 마무리 — 전체 검증 + README 갱신

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 전체 단위 테스트**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npm test`
Expected: 모든 도메인 테스트 PASS (mileage, validation, dates, stats).

- [ ] **Step 2: 타입 + 도구 점검**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit && CI=1 npx expo-doctor`
Expected: tsc 에러 없음. expo-doctor 통과(무해 경고만).

- [ ] **Step 3: README에 신규 기능/제약 반영**

`README.md`의 기능 목록에 다음을 추가: 다크 테마 + 설정 탭(포인트 색 8종), 내 신발 사용 중/은퇴/전체 필터 + 구매 후 N일, 날짜 선택기(미래 금지), 상세 통계(기간 선택 + 막대그래프), 신발 종류 칩 선택. "## 제약"에 `Expo SDK 54 고정 (Expo Go 호환)` 한 줄 추가.

- [ ] **Step 4: 수동 회귀 점검 (폰, 사용자)**

이 환경에서는 `npx expo start`를 실행하지 않는다(TTY 없음). 사용자에게 `npx expo start -c` 후 폰에서 다음을 확인하도록 안내:
- 설정 탭에서 색 변경 → 전 화면 즉시 반영 + 앱 재시작 후 유지
- 내 신발 필터(사용 중/은퇴/전체), 은퇴 신발 진입 → 은퇴 해제
- 신발 등록: 종류 칩(기타 입력), 구매일 달력(미래 불가), 카드에 "구매 후 N일"
- 일지: 날짜 달력, 미래 불가
- 통계: 기간 4종(사용자 지정 시작/종료) + 막대그래프

- [ ] **Step 5: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "docs: update README for UI redesign and new features"
```

---

## 향후 확장 (이 계획 범위 밖)

- 라이트 모드 토글, 완전 자유 색(컬러휠), 커스텀 폰트/벡터 아이콘
- 선/도넛 등 고급 차트 (react-native-svg)
- 푸시 알림, 클라우드 동기화, 구글 플레이/앱스토어 배포
