# 신발 기록 앱 (Shoes Log) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신발 컬렉션 관리 + 마일리지 추적 + 사진 착화 일지를 하나로 묶은 React Native(Expo) 모바일 앱 MVP를 만든다.

**Architecture:** Expo + TypeScript + expo-router 기반. 화면(UI) ↔ 데이터 계층을 분리한다. 순수 도메인 로직(마일리지 합계·교체 판정·입력 검증)은 의존성 없는 순수 함수로 두고 TDD로 검증한다. 데이터는 expo-sqlite 로컬 DB에, 사진은 앱 전용 파일 저장소에 두고 경로만 DB에 기록한다. 누적 거리는 저장하지 않고 일지 distance 합계로 계산한다.

**Tech Stack:** React Native, Expo SDK (최신), TypeScript, expo-router, expo-sqlite, expo-image-picker, expo-image-manipulator, expo-file-system, Jest + ts-jest (순수 로직 테스트).

## Global Constraints

- 언어: TypeScript (strict). 모든 새 파일은 `.ts`/`.tsx`.
- 거리 단위: km (REAL). 음수 금지.
- 교체 판정 임계값: 임박 = `target_distance - 누적합 <= 50` (km), 도달 = `누적합 >= target_distance`. `target_distance`가 null/없으면 판정하지 않음(`'none'`).
- 누적 거리는 DB에 저장하지 않고 항상 일지 distance 합계로 계산.
- 사진: 원본을 앱 전용 폴더에 복사 후 DB엔 경로만 저장. 일지/신발 삭제 시 연결 사진 파일도 정리.
- 데이터 계층은 화면과 분리: 화면은 `src/db/*`, `src/domain/*`, `src/services/*`의 함수만 호출한다.
- 신발 이름(name) 필수. price/target_distance/distance는 숫자만 허용.

---

## File Structure

```
app/                              # expo-router 화면
  _layout.tsx                     # 루트 레이아웃 (앱 시작 시 DB 초기화)
  (tabs)/
    _layout.tsx                   # 하단 탭 네비게이터 (3 탭)
    index.tsx                     # 👟 내 신발 (컬렉션 목록)
    logs.tsx                      # 📖 일지 (타임라인)
    stats.tsx                     # 📊 통계
  shoe/
    new.tsx                       # 신발 등록
    [id].tsx                      # 신발 상세
  log/
    new.tsx                       # 일지 작성
    [id].tsx                      # 일지 상세
src/
  types.ts                        # Shoe, WearLog, WearLogPhoto, NewShoe, NewWearLog 타입
  domain/
    mileage.ts                    # totalDistance, replacementStatus (순수 함수)
    mileage.test.ts
    validation.ts                 # validateShoeInput, validateWearLogInput (순수 함수)
    validation.test.ts
  db/
    schema.ts                     # CREATE TABLE SQL 상수
    database.ts                   # DB 열기 + 초기화 싱글톤
    shoes.ts                      # 신발 CRUD/쿼리
    wearLogs.ts                   # 일지 + 일지사진 CRUD/쿼리
  services/
    photoStorage.ts               # 사진 복사/압축/삭제
  components/
    ShoeCard.tsx                  # 컬렉션 카드 (사진+이름+진행 막대+배지)
    ProgressBar.tsx               # 누적/목표 진행 막대
    EmptyState.tsx                # 빈 목록 안내
    PhotoPlaceholder.tsx          # 사진 없음/깨짐 시 대체
```

**테스트 전략:** `src/domain/*`는 순수 함수이므로 Jest로 완전 TDD. DB 계층(`src/db/*`)과 화면은 expo-sqlite/native에 의존하므로 Jest 대신 **Expo 앱 실행 후 수동 검증**으로 확인(각 태스크에 검증 절차 포함). 이는 네이티브 의존성을 Node 테스트 환경에서 모킹하는 복잡도를 피하기 위함이다.

---

## Task 1: 개발 환경 + Expo 프로젝트 스캐폴드

**Files:**
- Create: 프로젝트 전체 (Expo 기본 구조)
- Modify: `.gitignore` (Expo 생성본으로 대체됨)

**Interfaces:**
- Produces: 실행 가능한 빈 Expo + expo-router + TypeScript 프로젝트. 이후 모든 태스크가 이 위에 작업.

- [ ] **Step 1: Node 설치 (Homebrew)**

Run:
```bash
brew install node
node -v && npm -v
```
Expected: node v20+ 와 npm 버전이 출력됨.

- [ ] **Step 2: 기존 임시 .gitignore 제거 (Expo가 자체 생성)**

Run:
```bash
rm -f /Users/ryan/Coding/app_Shoes_log/.gitignore
```

- [ ] **Step 3: Expo 프로젝트를 현재 디렉토리에 생성 (기본 템플릿 = expo-router + TS)**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx create-expo-app@latest . --template default
```
Expected: 설치 완료. `app/`, `package.json`, `app.json`, `tsconfig.json`, `node_modules/` 생성. (docs/ 와 .git 은 유지됨)

- [ ] **Step 4: 예제 콘텐츠 초기화 (기본 템플릿의 샘플 화면 제거)**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npm run reset-project
```
Expected: 예제 `app/` 가 백업되고 깨끗한 `app/index.tsx` 가 생성됨. (이 스크립트가 없으면 `app/(tabs)` 내 예제 파일을 다음 태스크에서 직접 덮어쓴다.)

- [ ] **Step 5: 앱이 실행되는지 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: Metro 번들러가 시작되고 QR 코드/개발 서버 URL이 표시됨. 터미널에서 `Ctrl+C`로 종료. (폰의 Expo Go 앱으로 QR을 찍으면 빈 화면이 뜬다.)

- [ ] **Step 6: 필요한 Expo 라이브러리 설치**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo install expo-sqlite expo-image-picker expo-image-manipulator expo-file-system
```
Expected: 4개 패키지가 package.json에 추가됨.

- [ ] **Step 7: Jest + ts-jest 설치 (순수 로직 테스트용)**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npm install --save-dev jest ts-jest @types/jest
```

- [ ] **Step 8: Jest 설정 파일 생성**

Create `jest.config.js`:
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
};
```

Modify `package.json` scripts 섹션에 추가 (`"scripts"` 객체 안):
```json
"test": "jest"
```

- [ ] **Step 9: Jest가 동작하는지 확인 (빈 통과 테스트)**

Create `src/domain/smoke.test.ts`:
```ts
test('jest works', () => {
  expect(1 + 1).toBe(2);
});
```

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npm test
```
Expected: PASS (1 passed).

- [ ] **Step 10: 스모크 테스트 삭제 후 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && rm src/domain/smoke.test.ts && git add -A && git commit -m "chore: scaffold Expo + TypeScript project with test setup"
```

---

## Task 2: 타입 정의

**Files:**
- Create: `src/types.ts`

**Interfaces:**
- Produces: `Shoe`, `WearLog`, `WearLogPhoto`, `NewShoe`, `NewWearLog`, `ReplacementStatus` 타입. 이후 모든 태스크가 import.

- [ ] **Step 1: 타입 파일 작성**

Create `src/types.ts`:
```ts
export type ReplacementStatus = 'none' | 'imminent' | 'reached';

export interface Shoe {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  photo_uri: string | null;
  purchase_date: string | null; // ISO 'YYYY-MM-DD'
  price: number | null;
  target_distance: number | null; // km
  retired: 0 | 1;
  created_at: string; // ISO datetime
}

// 신발 등록 시 입력값 (id/created_at 제외, retired 기본 0)
export interface NewShoe {
  name: string;
  brand: string | null;
  category: string | null;
  photo_uri: string | null;
  purchase_date: string | null;
  price: number | null;
  target_distance: number | null;
}

export interface WearLog {
  id: number;
  shoe_id: number;
  date: string; // 'YYYY-MM-DD'
  distance: number | null; // km
  memo: string | null;
  created_at: string;
}

export interface NewWearLog {
  shoe_id: number;
  date: string;
  distance: number | null;
  memo: string | null;
  photo_uris: string[]; // 저장 전 임시 경로들 (앱 폴더로 복사됨)
}

export interface WearLogPhoto {
  id: number;
  wear_log_id: number;
  photo_uri: string;
}
```

- [ ] **Step 2: 타입 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add core data types"
```

---

## Task 3: 도메인 로직 — 누적 거리 계산 (TDD)

**Files:**
- Create: `src/domain/mileage.ts`
- Test: `src/domain/mileage.test.ts`

**Interfaces:**
- Consumes: `WearLog`, `ReplacementStatus` from `src/types.ts`
- Produces:
  - `totalDistance(logs: Pick<WearLog, 'distance'>[]): number`
  - `replacementStatus(total: number, target: number | null): ReplacementStatus`
  - `remainingDistance(total: number, target: number | null): number | null`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/domain/mileage.test.ts`:
```ts
import { totalDistance, replacementStatus, remainingDistance } from './mileage';

describe('totalDistance', () => {
  test('빈 목록은 0', () => {
    expect(totalDistance([])).toBe(0);
  });
  test('distance 합산', () => {
    expect(totalDistance([{ distance: 5 }, { distance: 3.5 }])).toBe(8.5);
  });
  test('null distance는 0으로 취급', () => {
    expect(totalDistance([{ distance: 5 }, { distance: null }])).toBe(5);
  });
});

describe('replacementStatus', () => {
  test('target 없으면 none', () => {
    expect(replacementStatus(700, null)).toBe('none');
  });
  test('여유 있으면 none (남은 거리 > 50)', () => {
    expect(replacementStatus(500, 600)).toBe('none');
  });
  test('임박: 남은 거리 정확히 50', () => {
    expect(replacementStatus(550, 600)).toBe('imminent');
  });
  test('임박: 남은 거리 50 미만', () => {
    expect(replacementStatus(580, 600)).toBe('imminent');
  });
  test('도달: 누적 == target', () => {
    expect(replacementStatus(600, 600)).toBe('reached');
  });
  test('도달: 누적 > target', () => {
    expect(replacementStatus(601, 600)).toBe('reached');
  });
});

describe('remainingDistance', () => {
  test('target 없으면 null', () => {
    expect(remainingDistance(100, null)).toBeNull();
  });
  test('남은 거리 = target - total', () => {
    expect(remainingDistance(550, 600)).toBe(50);
  });
  test('초과 시 0 (음수 아님)', () => {
    expect(remainingDistance(650, 600)).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/mileage.test.ts
```
Expected: FAIL ("Cannot find module './mileage'").

- [ ] **Step 3: 구현 작성**

Create `src/domain/mileage.ts`:
```ts
import { WearLog, ReplacementStatus } from '../types';

const IMMINENT_THRESHOLD_KM = 50;

export function totalDistance(logs: Pick<WearLog, 'distance'>[]): number {
  return logs.reduce((sum, log) => sum + (log.distance ?? 0), 0);
}

export function replacementStatus(
  total: number,
  target: number | null,
): ReplacementStatus {
  if (target == null) return 'none';
  if (total >= target) return 'reached';
  if (target - total <= IMMINENT_THRESHOLD_KM) return 'imminent';
  return 'none';
}

export function remainingDistance(
  total: number,
  target: number | null,
): number | null {
  if (target == null) return null;
  return Math.max(0, target - total);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/mileage.test.ts
```
Expected: PASS (모든 테스트 통과).

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add mileage calculation and replacement status logic"
```

---

## Task 4: 도메인 로직 — 입력 검증 (TDD)

**Files:**
- Create: `src/domain/validation.ts`
- Test: `src/domain/validation.test.ts`

**Interfaces:**
- Consumes: `NewShoe`, `NewWearLog` from `src/types.ts`
- Produces:
  - `validateShoeInput(input: NewShoe): string[]` — 에러 메시지 배열(빈 배열 = 유효)
  - `validateWearLogInput(input: Pick<NewWearLog, 'shoe_id' | 'date' | 'distance'>): string[]`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/domain/validation.test.ts`:
```ts
import { validateShoeInput, validateWearLogInput } from './validation';
import { NewShoe } from '../types';

const baseShoe: NewShoe = {
  name: '페가수스 40',
  brand: '나이키',
  category: '러닝화',
  photo_uri: null,
  purchase_date: null,
  price: null,
  target_distance: null,
};

describe('validateShoeInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateShoeInput(baseShoe)).toEqual([]);
  });
  test('이름 비어있으면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, name: '   ' })).toContain('신발 이름을 입력하세요.');
  });
  test('가격 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, price: -100 })).toContain('가격은 0 이상이어야 합니다.');
  });
  test('목표 거리 음수면 에러', () => {
    expect(validateShoeInput({ ...baseShoe, target_distance: -1 })).toContain('목표 거리는 0 이상이어야 합니다.');
  });
});

describe('validateWearLogInput', () => {
  test('유효한 입력은 에러 없음', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: 5 })).toEqual([]);
  });
  test('shoe_id 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 0, date: '2026-06-20', distance: 5 })).toContain('신발을 선택하세요.');
  });
  test('날짜 없으면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '', distance: 5 })).toContain('날짜를 입력하세요.');
  });
  test('거리 음수면 에러', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: -3 })).toContain('거리는 0 이상이어야 합니다.');
  });
  test('거리 null은 허용', () => {
    expect(validateWearLogInput({ shoe_id: 1, date: '2026-06-20', distance: null })).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/validation.test.ts
```
Expected: FAIL ("Cannot find module './validation'").

- [ ] **Step 3: 구현 작성**

Create `src/domain/validation.ts`:
```ts
import { NewShoe, NewWearLog } from '../types';

export function validateShoeInput(input: NewShoe): string[] {
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
  return errors;
}

export function validateWearLogInput(
  input: Pick<NewWearLog, 'shoe_id' | 'date' | 'distance'>,
): string[] {
  const errors: string[] = [];
  if (!input.shoe_id) {
    errors.push('신발을 선택하세요.');
  }
  if (!input.date || input.date.trim() === '') {
    errors.push('날짜를 입력하세요.');
  }
  if (input.distance != null && input.distance < 0) {
    errors.push('거리는 0 이상이어야 합니다.');
  }
  return errors;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx jest src/domain/validation.test.ts
```
Expected: PASS.

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add input validation logic"
```

---

## Task 5: DB 스키마 + 초기화

**Files:**
- Create: `src/db/schema.ts`, `src/db/database.ts`

**Interfaces:**
- Produces:
  - `SCHEMA_SQL: string` (CREATE TABLE 문 + foreign_keys ON)
  - `getDb(): SQLiteDatabase` — 열린 DB 핸들 반환 (싱글톤)
  - `initDatabase(): Promise<void>` — 테이블 생성

- [ ] **Step 1: 스키마 SQL 작성**

Create `src/db/schema.ts`:
```ts
export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  photo_uri TEXT,
  purchase_date TEXT,
  price REAL,
  target_distance REAL,
  retired INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wear_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shoe_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  distance REAL,
  memo TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (shoe_id) REFERENCES shoes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wear_log_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wear_log_id INTEGER NOT NULL,
  photo_uri TEXT NOT NULL,
  FOREIGN KEY (wear_log_id) REFERENCES wear_logs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wear_logs_shoe ON wear_logs(shoe_id);
CREATE INDEX IF NOT EXISTS idx_photos_log ON wear_log_photos(wear_log_id);
`;
```

- [ ] **Step 2: DB 초기화 모듈 작성**

Create `src/db/database.ts`:
```ts
import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('shoeslog.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(SCHEMA_SQL);
}
```

- [ ] **Step 3: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 4: 루트 레이아웃에서 DB 초기화 연결**

Modify `app/_layout.tsx` — 파일 내용을 아래로 교체:
```tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';
import { initDatabase } from '../src/db/database';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text>데이터베이스 초기화 실패: {error}</Text>
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
```

- [ ] **Step 5: 앱 실행으로 DB 초기화 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 앱이 "로딩 중..." 후 화면이 뜨고, 콘솔/화면에 DB 에러가 없음. (에러 없이 통과하면 스키마가 정상 생성된 것.) `Ctrl+C`로 종료.

- [ ] **Step 6: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add SQLite schema and database initialization"
```

---

## Task 6: 신발 데이터 계층 (CRUD)

**Files:**
- Create: `src/db/shoes.ts`

**Interfaces:**
- Consumes: `getDb()` from `src/db/database.ts`; `Shoe`, `NewShoe` from `src/types.ts`
- Produces:
  - `addShoe(input: NewShoe): Promise<number>` — 생성된 id 반환
  - `getShoes(includeRetired?: boolean): Promise<Shoe[]>` — created_at DESC
  - `getShoe(id: number): Promise<Shoe | null>`
  - `setShoeRetired(id: number, retired: boolean): Promise<void>`
  - `deleteShoe(id: number): Promise<void>` — CASCADE로 일지/사진 행도 삭제

- [ ] **Step 1: 신발 CRUD 작성**

Create `src/db/shoes.ts`:
```ts
import { getDb } from './database';
import { Shoe, NewShoe } from '../types';

export async function addShoe(input: NewShoe): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO shoes
      (name, brand, category, photo_uri, purchase_date, price, target_distance, retired, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    input.name.trim(),
    input.brand,
    input.category,
    input.photo_uri,
    input.purchase_date,
    input.price,
    input.target_distance,
    new Date().toISOString(),
  );
  return result.lastInsertRowId;
}

export async function getShoes(includeRetired = false): Promise<Shoe[]> {
  const db = getDb();
  const where = includeRetired ? '' : 'WHERE retired = 0';
  return db.getAllAsync<Shoe>(
    `SELECT * FROM shoes ${where} ORDER BY created_at DESC`,
  );
}

export async function getShoe(id: number): Promise<Shoe | null> {
  const db = getDb();
  const row = await db.getFirstAsync<Shoe>('SELECT * FROM shoes WHERE id = ?', id);
  return row ?? null;
}

export async function setShoeRetired(id: number, retired: boolean): Promise<void> {
  const db = getDb();
  await db.runAsync('UPDATE shoes SET retired = ? WHERE id = ?', retired ? 1 : 0, id);
}

export async function deleteShoe(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM shoes WHERE id = ?', id);
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add shoes data layer (CRUD)"
```

> 검증 노트: 이 계층의 동작은 Task 11(신발 등록 화면)에서 실제 앱으로 처음 확인된다.

---

## Task 7: 일지 + 일지사진 데이터 계층

**Files:**
- Create: `src/db/wearLogs.ts`

**Interfaces:**
- Consumes: `getDb()`; `WearLog`, `WearLogPhoto`, `NewWearLog` from `src/types.ts`
- Produces:
  - `addWearLog(input: NewWearLog): Promise<number>` — 트랜잭션으로 wear_logs + wear_log_photos 동시 삽입, 일지 id 반환. `input.photo_uris`는 **이미 앱 폴더로 복사된 최종 경로**여야 함(복사는 화면에서 photoStorage로 수행 후 전달).
  - `getWearLogs(): Promise<WearLog[]>` — 전체, date DESC, created_at DESC
  - `getWearLogsForShoe(shoeId: number): Promise<WearLog[]>`
  - `getWearLog(id: number): Promise<WearLog | null>`
  - `getPhotosForLog(logId: number): Promise<WearLogPhoto[]>`
  - `deleteWearLog(id: number): Promise<void>` — CASCADE로 사진 행 삭제

- [ ] **Step 1: 일지 CRUD 작성**

Create `src/db/wearLogs.ts`:
```ts
import { getDb } from './database';
import { WearLog, WearLogPhoto, NewWearLog } from '../types';

export async function addWearLog(input: NewWearLog): Promise<number> {
  const db = getDb();
  let logId = 0;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `INSERT INTO wear_logs (shoe_id, date, distance, memo, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      input.shoe_id,
      input.date,
      input.distance,
      input.memo,
      new Date().toISOString(),
    );
    logId = result.lastInsertRowId;
    for (const uri of input.photo_uris) {
      await db.runAsync(
        'INSERT INTO wear_log_photos (wear_log_id, photo_uri) VALUES (?, ?)',
        logId,
        uri,
      );
    }
  });
  return logId;
}

export async function getWearLogs(): Promise<WearLog[]> {
  const db = getDb();
  return db.getAllAsync<WearLog>(
    'SELECT * FROM wear_logs ORDER BY date DESC, created_at DESC',
  );
}

export async function getWearLogsForShoe(shoeId: number): Promise<WearLog[]> {
  const db = getDb();
  return db.getAllAsync<WearLog>(
    'SELECT * FROM wear_logs WHERE shoe_id = ? ORDER BY date DESC, created_at DESC',
    shoeId,
  );
}

export async function getWearLog(id: number): Promise<WearLog | null> {
  const db = getDb();
  const row = await db.getFirstAsync<WearLog>('SELECT * FROM wear_logs WHERE id = ?', id);
  return row ?? null;
}

export async function getPhotosForLog(logId: number): Promise<WearLogPhoto[]> {
  const db = getDb();
  return db.getAllAsync<WearLogPhoto>(
    'SELECT * FROM wear_log_photos WHERE wear_log_id = ? ORDER BY id ASC',
    logId,
  );
}

export async function deleteWearLog(id: number): Promise<void> {
  const db = getDb();
  await db.runAsync('DELETE FROM wear_logs WHERE id = ?', id);
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add wear logs and photos data layer"
```

---

## Task 8: 사진 저장 서비스

**Files:**
- Create: `src/services/photoStorage.ts`

**Interfaces:**
- Consumes: expo-file-system, expo-image-manipulator
- Produces:
  - `savePhoto(tempUri: string): Promise<string>` — 임시 URI를 리사이즈/압축해 앱 전용 폴더에 저장, 최종 URI 반환
  - `savePhotos(tempUris: string[]): Promise<string[]>`
  - `deletePhoto(uri: string): Promise<void>` — 파일 삭제(없으면 무시)

- [ ] **Step 1: 사진 저장 서비스 작성**

Create `src/services/photoStorage.ts`:
```ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const PHOTO_DIR = FileSystem.documentDirectory + 'photos/';

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function savePhoto(tempUri: string): Promise<string> {
  await ensureDir();
  // 가로 최대 1280px로 리사이즈 + JPEG 70% 압축
  const manipulated = await ImageManipulator.manipulateAsync(
    tempUri,
    [{ resize: { width: 1280 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const dest = PHOTO_DIR + filename;
  await FileSystem.moveAsync({ from: manipulated.uri, to: dest });
  return dest;
}

export async function savePhotos(tempUris: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const uri of tempUris) {
    results.push(await savePhoto(uri));
  }
  return results;
}

export async function deletePhoto(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // 파일이 없거나 삭제 실패해도 무시 (정합성 정리용)
  }
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add photo storage service (resize, save, delete)"
```

---

## Task 9: 하단 탭 네비게이션 + 공용 컴포넌트

**Files:**
- Create: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/logs.tsx`, `app/(tabs)/stats.tsx`
- Create: `src/components/EmptyState.tsx`, `src/components/PhotoPlaceholder.tsx`
- Modify: `app/_layout.tsx` (Stack에 (tabs) 그룹 포함되도록 — 이미 Stack이면 자동 라우팅됨)

**Interfaces:**
- Produces: 3개 탭(내 신발/일지/통계) 골격 화면. `EmptyState`, `PhotoPlaceholder` 컴포넌트.

- [ ] **Step 1: 공용 컴포넌트 작성**

Create `src/components/EmptyState.tsx`:
```tsx
import { View, Text } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 16, color: '#888', textAlign: 'center' }}>{message}</Text>
    </View>
  );
}
```

Create `src/components/PhotoPlaceholder.tsx`:
```tsx
import { View, Text } from 'react-native';

export function PhotoPlaceholder({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.4 }}>👟</Text>
    </View>
  );
}
```

- [ ] **Step 2: 탭 레이아웃 작성**

Create `app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: '내 신발', tabBarIcon: () => <Text>👟</Text> }}
      />
      <Tabs.Screen
        name="logs"
        options={{ title: '일지', tabBarIcon: () => <Text>📖</Text> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ title: '통계', tabBarIcon: () => <Text>📊</Text> }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: 탭 화면 골격 작성**

Create `app/(tabs)/index.tsx`:
```tsx
import { EmptyState } from '../../src/components/EmptyState';

export default function ShoesTab() {
  return <EmptyState message="신발 화면 (곧 구현)" />;
}
```

Create `app/(tabs)/logs.tsx`:
```tsx
import { EmptyState } from '../../src/components/EmptyState';

export default function LogsTab() {
  return <EmptyState message="일지 화면 (곧 구현)" />;
}
```

Create `app/(tabs)/stats.tsx`:
```tsx
import { EmptyState } from '../../src/components/EmptyState';

export default function StatsTab() {
  return <EmptyState message="통계 화면 (곧 구현)" />;
}
```

- [ ] **Step 4: 루트 인덱스 라우팅 정리**

만약 Task 1의 reset-project가 `app/index.tsx`를 남겼다면 삭제(탭 그룹이 기본 경로가 되도록):
```bash
cd /Users/ryan/Coding/app_Shoes_log && rm -f app/index.tsx
```

- [ ] **Step 5: 앱 실행으로 3탭 표시 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 하단에 👟 내 신발 / 📖 일지 / 📊 통계 3개 탭이 보이고 탭 전환이 동작. `Ctrl+C`로 종료.

- [ ] **Step 6: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add bottom tab navigation and shared components"
```

---

## Task 10: 신발 등록 화면

**Files:**
- Create: `app/shoe/new.tsx`

**Interfaces:**
- Consumes: `addShoe` (db/shoes), `validateShoeInput` (domain/validation), `savePhoto` (services/photoStorage), expo-image-picker; `NewShoe` 타입
- Produces: 신발 등록 후 `router.back()`. 컬렉션 탭(Task 11)에서 + 버튼으로 진입.

- [ ] **Step 1: 신발 등록 화면 작성**

Create `app/shoe/new.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { addShoe } from '../../src/db/shoes';
import { validateShoeInput } from '../../src/domain/validation';
import { savePhoto } from '../../src/services/photoStorage';
import { NewShoe } from '../../src/types';

export default function NewShoeScreen() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function onSave() {
    const input: NewShoe = {
      name,
      brand: brand || null,
      category: category || null,
      photo_uri: null,
      purchase_date: purchaseDate || null,
      price: price ? Number(price) : null,
      target_distance: target ? Number(target) : null,
    };
    const errors = validateShoeInput(input);
    if (errors.length > 0) {
      Alert.alert('입력 오류', errors.join('\n'));
      return;
    }
    setSaving(true);
    try {
      if (photoUri) {
        input.photo_uri = await savePhoto(photoUri);
      }
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: 120, height: 120, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
            <Text>사진 추가</Text>
          </View>
        )}
      </Pressable>
      <Field label="이름 *" value={name} onChange={setName} placeholder="예: 나이키 페가수스 40" />
      <Field label="브랜드" value={brand} onChange={setBrand} />
      <Field label="종류" value={category} onChange={setCategory} placeholder="러닝화 / 운동화 / 구두 ..." />
      <Field label="구매일" value={purchaseDate} onChange={setPurchaseDate} placeholder="YYYY-MM-DD" />
      <Field label="가격" value={price} onChange={setPrice} keyboardType="numeric" />
      <Field label="교체 목표 거리(km)" value={target} onChange={setTarget} keyboardType="numeric" placeholder="비우면 마일리지 미추적" />
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={{ backgroundColor: '#222', padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'numeric' | 'default';
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600' }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}
      />
    </View>
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음. (화면은 Task 11에서 + 버튼 연결 후 실제 검증한다.)

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add shoe registration screen"
```

---

## Task 11: 신발 컬렉션 목록 + ShoeCard + ProgressBar

**Files:**
- Create: `src/components/ProgressBar.tsx`, `src/components/ShoeCard.tsx`
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `getShoes` (db/shoes), `getWearLogsForShoe` (db/wearLogs), `totalDistance`/`replacementStatus`/`remainingDistance` (domain/mileage), `Shoe` 타입
- Produces: + 버튼(헤더) → `/shoe/new`, 카드 탭 → `/shoe/[id]`. 화면 포커스 시 새로고침.

- [ ] **Step 1: 진행 막대 컴포넌트 작성**

Create `src/components/ProgressBar.tsx`:
```tsx
import { View } from 'react-native';

export function ProgressBar({ ratio, color }: { ratio: number; color: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View style={{ height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}
```

- [ ] **Step 2: ShoeCard 컴포넌트 작성**

Create `src/components/ShoeCard.tsx`:
```tsx
import { View, Text, Image, Pressable } from 'react-native';
import { Shoe, ReplacementStatus } from '../types';
import { ProgressBar } from './ProgressBar';
import { PhotoPlaceholder } from './PhotoPlaceholder';

const STATUS_COLOR: Record<ReplacementStatus, string> = {
  none: '#4caf50',
  imminent: '#ff9800',
  reached: '#f44336',
};

export function ShoeCard({
  shoe, total, status, onPress,
}: {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12, backgroundColor: '#fafafa', marginBottom: 10 }}
    >
      {shoe.photo_uri ? (
        <Image source={{ uri: shoe.photo_uri }} style={{ width: 64, height: 64, borderRadius: 8 }} />
      ) : (
        <PhotoPlaceholder size={64} />
      )}
      <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{shoe.name}</Text>
          {status === 'imminent' && <Text>🟠</Text>}
          {status === 'reached' && <Text>🔴</Text>}
        </View>
        <Text style={{ color: '#666', fontSize: 12 }}>
          {shoe.target_distance != null
            ? `${total.toFixed(1)} / ${shoe.target_distance} km${status === 'reached' ? '  · 교체 권장' : ''}`
            : `${total.toFixed(1)} km`}
        </Text>
        {shoe.target_distance != null && (
          <ProgressBar ratio={total / shoe.target_distance} color={STATUS_COLOR[status]} />
        )}
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 3: 컬렉션 목록 화면 작성**

Modify `app/(tabs)/index.tsx` — 전체 교체:
```tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus } from '../../src/domain/mileage';
import { ShoeCard } from '../../src/components/ShoeCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Shoe, ReplacementStatus } from '../../src/types';

interface Row {
  shoe: Shoe;
  total: number;
  status: ReplacementStatus;
}

export default function ShoesTab() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(() => {
    (async () => {
      try {
        const shoes = await getShoes(false);
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

  useFocusEffect(load);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: '내 신발',
          headerRight: () => (
            <Pressable onPress={() => router.push('/shoe/new')} style={{ paddingHorizontal: 12 }}>
              <Text style={{ fontSize: 26 }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      {rows.length === 0 ? (
        <EmptyState message={'아직 등록된 신발이 없어요.\n오른쪽 위 ＋ 로 신발을 추가하세요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={rows}
          keyExtractor={(r) => String(r.shoe.id)}
          renderItem={({ item }) => (
            <ShoeCard
              shoe={item.shoe}
              total={item.total}
              status={item.status}
              onPress={() => router.push(`/shoe/${item.shoe.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 4: 앱 실행으로 등록·목록 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 폰에서 — ＋ 버튼 → 신발 등록(사진 선택, 이름 입력) → 저장 → 목록에 카드가 나타남. 이름 비우고 저장 시 "신발 이름을 입력하세요." 경고가 뜸. `Ctrl+C`로 종료.

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add shoe collection list with progress and replacement badges"
```

---

## Task 12: 신발 상세 화면 (정보 + 일지 + 은퇴)

**Files:**
- Create: `app/shoe/[id].tsx`

**Interfaces:**
- Consumes: `getShoe`, `setShoeRetired`, `deleteShoe` (db/shoes), `getWearLogsForShoe` (db/wearLogs), `totalDistance`/`replacementStatus`/`remainingDistance` (domain/mileage)
- Produces: 신발 상세. 은퇴 토글, 삭제. 일지 항목 탭 → `/log/[id]`.

- [ ] **Step 1: 신발 상세 화면 작성**

Create `app/shoe/[id].tsx`:
```tsx
import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { getShoe, setShoeRetired, deleteShoe } from '../../src/db/shoes';
import { getWearLogsForShoe } from '../../src/db/wearLogs';
import { totalDistance, replacementStatus, remainingDistance } from '../../src/domain/mileage';
import { PhotoPlaceholder } from '../../src/components/PhotoPlaceholder';
import { ProgressBar } from '../../src/components/ProgressBar';
import { Shoe, WearLog } from '../../src/types';

export default function ShoeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shoeId = Number(id);
  const [shoe, setShoe] = useState<Shoe | null>(null);
  const [logs, setLogs] = useState<WearLog[]>([]);

  const load = useCallback(() => {
    (async () => {
      setShoe(await getShoe(shoeId));
      setLogs(await getWearLogsForShoe(shoeId));
    })();
  }, [shoeId]);

  useFocusEffect(load);

  if (!shoe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  const total = totalDistance(logs);
  const status = replacementStatus(total, shoe.target_distance);
  const remaining = remainingDistance(total, shoe.target_distance);

  async function onRetire() {
    await setShoeRetired(shoeId, shoe!.retired === 0);
    load();
  }

  function onDelete() {
    Alert.alert('삭제', '이 신발과 관련 일지·사진이 모두 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await deleteShoe(shoeId);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: shoe.name }} />
      <View style={{ alignItems: 'center' }}>
        {shoe.photo_uri ? (
          <Image source={{ uri: shoe.photo_uri }} style={{ width: 160, height: 160, borderRadius: 16 }} />
        ) : (
          <PhotoPlaceholder size={160} />
        )}
      </View>
      <Text style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center' }}>{shoe.name}</Text>
      {shoe.brand ? <Text style={{ textAlign: 'center', color: '#666' }}>{shoe.brand} · {shoe.category ?? ''}</Text> : null}

      <View style={{ gap: 6, padding: 12, backgroundColor: '#fafafa', borderRadius: 12 }}>
        <Text style={{ fontWeight: '600' }}>누적 거리: {total.toFixed(1)} km</Text>
        {shoe.target_distance != null ? (
          <>
            <ProgressBar
              ratio={total / shoe.target_distance}
              color={status === 'reached' ? '#f44336' : status === 'imminent' ? '#ff9800' : '#4caf50'}
            />
            <Text style={{ color: '#666' }}>
              목표 {shoe.target_distance} km · 남은 {remaining?.toFixed(1)} km
              {status === 'reached' ? ' · 🔴 교체 권장' : status === 'imminent' ? ' · 🟠 교체 임박' : ''}
            </Text>
          </>
        ) : (
          <Text style={{ color: '#999' }}>마일리지 미추적 (목표 거리 미설정)</Text>
        )}
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>착화 일지 ({logs.length})</Text>
      {logs.map((log) => (
        <Pressable
          key={log.id}
          onPress={() => router.push(`/log/${log.id}`)}
          style={{ padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}
        >
          <Text>{log.date}{log.distance != null ? ` · ${log.distance} km` : ''}</Text>
          {log.memo ? <Text style={{ color: '#666' }} numberOfLines={1}>{log.memo}</Text> : null}
        </Pressable>
      ))}

      <Pressable onPress={onRetire} style={{ padding: 14, borderRadius: 10, backgroundColor: '#eee', alignItems: 'center', marginTop: 12 }}>
        <Text>{shoe.retired ? '은퇴 해제' : '은퇴 처리'}</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={{ padding: 14, borderRadius: 10, backgroundColor: '#ffebee', alignItems: 'center' }}>
        <Text style={{ color: '#c62828' }}>삭제</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: 앱 실행으로 상세·은퇴 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 카드 탭 → 상세 진입, 정보·누적거리 표시. "은퇴 처리" 시 목록(내 신발)에서 사라짐(retired 필터). 삭제 시 확인 후 목록에서 제거. `Ctrl+C`로 종료.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add shoe detail screen with retire and delete"
```

---

## Task 13: 일지 작성 화면 (거리 + 사진 여러 장)

**Files:**
- Create: `app/log/new.tsx`

**Interfaces:**
- Consumes: `getShoes` (db/shoes), `addWearLog` (db/wearLogs), `validateWearLogInput` (domain/validation), `savePhotos` (services/photoStorage), expo-image-picker; `NewWearLog`, `Shoe` 타입
- Produces: 저장 시 사진들을 앱 폴더로 복사 후 일지 생성, `router.back()`.

- [ ] **Step 1: 일지 작성 화면 작성**

Create `app/log/new.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getShoes } from '../../src/db/shoes';
import { addWearLog } from '../../src/db/wearLogs';
import { validateWearLogInput } from '../../src/domain/validation';
import { savePhotos } from '../../src/services/photoStorage';
import { Shoe, NewWearLog } from '../../src/types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewLogScreen() {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [shoeId, setShoeId] = useState<number>(0);
  const [date, setDate] = useState(today());
  const [distance, setDistance] = useState('');
  const [memo, setMemo] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShoes(false).then(setShoes);
  }, []);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function onSave() {
    const errors = validateWearLogInput({ shoe_id: shoeId, date, distance: distance ? Number(distance) : null });
    if (errors.length > 0) {
      Alert.alert('입력 오류', errors.join('\n'));
      return;
    }
    setSaving(true);
    try {
      const savedUris = await savePhotos(photos);
      const input: NewWearLog = {
        shoe_id: shoeId,
        date,
        distance: distance ? Number(distance) : null,
        memo: memo || null,
        photo_uris: savedUris,
      };
      await addWearLog(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: '일지 작성' }} />

      <Text style={{ fontWeight: '600' }}>신발 선택 *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shoes.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setShoeId(s.id)}
            style={{
              paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
              backgroundColor: shoeId === s.id ? '#222' : '#eee',
            }}
          >
            <Text style={{ color: shoeId === s.id ? 'white' : '#333' }}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ fontWeight: '600' }}>날짜</Text>
      <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" style={inputStyle} />

      <Text style={{ fontWeight: '600' }}>거리(km)</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="선택" style={inputStyle} />

      <Text style={{ fontWeight: '600' }}>메모</Text>
      <TextInput value={memo} onChangeText={setMemo} placeholder="코디/날씨/느낌" multiline style={[inputStyle, { height: 80 }]} />

      <Text style={{ fontWeight: '600' }}>사진</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
        ))}
        <Pressable onPress={addPhoto} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28 }}>＋</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSave} disabled={saving} style={{ backgroundColor: '#222', padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{saving ? '저장 중...' : '저장'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const inputStyle = { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 } as const;
```

- [ ] **Step 2: 컴파일 확인**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음. (Task 14에서 + 버튼 연결 후 실제 검증.)

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add wear log creation screen with photos"
```

---

## Task 14: 일지 타임라인 탭

**Files:**
- Modify: `app/(tabs)/logs.tsx`

**Interfaces:**
- Consumes: `getWearLogs` (db/wearLogs), `getShoes` (db/shoes), `getPhotosForLog` (db/wearLogs)
- Produces: + 버튼(헤더) → `/log/new`, 항목 탭 → `/log/[id]`. 신발 없으면 안내.

- [ ] **Step 1: 일지 타임라인 작성**

Modify `app/(tabs)/logs.tsx` — 전체 교체:
```tsx
import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, Text, Image, Alert } from 'react-native';
import { router, useFocusEffect, Stack } from 'expo-router';
import { getWearLogs, getPhotosForLog } from '../../src/db/wearLogs';
import { getShoes } from '../../src/db/shoes';
import { EmptyState } from '../../src/components/EmptyState';
import { PhotoPlaceholder } from '../../src/components/PhotoPlaceholder';
import { WearLog } from '../../src/types';

interface Row {
  log: WearLog;
  shoeName: string;
  thumb: string | null;
}

export default function LogsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [hasShoes, setHasShoes] = useState(true);

  const load = useCallback(() => {
    (async () => {
      try {
        const shoes = await getShoes(true);
        setHasShoes(shoes.length > 0);
        const nameById = new Map(shoes.map((s) => [s.id, s.name]));
        const logs = await getWearLogs();
        const built: Row[] = [];
        for (const log of logs) {
          const photos = await getPhotosForLog(log.id);
          built.push({
            log,
            shoeName: nameById.get(log.shoe_id) ?? '(삭제된 신발)',
            thumb: photos[0]?.photo_uri ?? null,
          });
        }
        setRows(built);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  useFocusEffect(load);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: '일지',
          headerRight: () => (
            <Pressable
              onPress={() => {
                if (!hasShoes) {
                  Alert.alert('신발 필요', '먼저 신발을 등록하세요.');
                  return;
                }
                router.push('/log/new');
              }}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontSize: 26 }}>＋</Text>
            </Pressable>
          ),
        }}
      />
      {rows.length === 0 ? (
        <EmptyState message={'아직 일지가 없어요.\n오른쪽 위 ＋ 로 오늘 신은 신발을 기록하세요.'} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 12 }}
          data={rows}
          keyExtractor={(r) => String(r.log.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/log/${item.log.id}`)}
              style={{ flexDirection: 'row', gap: 12, padding: 12, backgroundColor: '#fafafa', borderRadius: 12, marginBottom: 10 }}
            >
              {item.thumb ? (
                <Image source={{ uri: item.thumb }} style={{ width: 56, height: 56, borderRadius: 8 }} />
              ) : (
                <PhotoPlaceholder size={56} />
              )}
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontWeight: 'bold' }}>{item.shoeName}</Text>
                <Text style={{ color: '#666' }}>
                  {item.log.date}{item.log.distance != null ? ` · ${item.log.distance} km` : ''}
                </Text>
                {item.log.memo ? <Text style={{ color: '#888' }} numberOfLines={1}>{item.log.memo}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
```

- [ ] **Step 2: 앱 실행으로 일지 작성·표시 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 일지 탭 ＋ → 신발 선택, 거리 입력, 사진 추가 → 저장 → 타임라인에 표시. 내 신발 탭에서 해당 신발 누적 거리가 증가, 목표 근접 시 🟠/🔴 표시. `Ctrl+C`로 종료.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add wear log timeline tab"
```

---

## Task 15: 일지 상세 화면 (사진 크게 + 삭제)

**Files:**
- Create: `app/log/[id].tsx`

**Interfaces:**
- Consumes: `getWearLog`, `getPhotosForLog`, `deleteWearLog` (db/wearLogs), `getShoe` (db/shoes), `deletePhoto` (services/photoStorage)
- Produces: 일지 상세. 삭제 시 연결 사진 파일도 정리 후 `router.back()`.

- [ ] **Step 1: 일지 상세 화면 작성**

Create `app/log/[id].tsx`:
```tsx
import { useState, useCallback } from 'react';
import { ScrollView, View, Text, Image, Pressable, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { getWearLog, getPhotosForLog, deleteWearLog } from '../../src/db/wearLogs';
import { getShoe } from '../../src/db/shoes';
import { deletePhoto } from '../../src/services/photoStorage';
import { WearLog, WearLogPhoto } from '../../src/types';

export default function LogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const logId = Number(id);
  const { width } = useWindowDimensions();
  const [log, setLog] = useState<WearLog | null>(null);
  const [shoeName, setShoeName] = useState('');
  const [photos, setPhotos] = useState<WearLogPhoto[]>([]);

  const load = useCallback(() => {
    (async () => {
      const l = await getWearLog(logId);
      setLog(l);
      if (l) {
        const shoe = await getShoe(l.shoe_id);
        setShoeName(shoe?.name ?? '(삭제된 신발)');
      }
      setPhotos(await getPhotosForLog(logId));
    })();
  }, [logId]);

  useFocusEffect(load);

  if (!log) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  function onDelete() {
    Alert.alert('일지 삭제', '이 일지와 사진이 삭제됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          for (const p of photos) {
            await deletePhoto(p.photo_uri);
          }
          await deleteWearLog(logId);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Stack.Screen options={{ title: log.date }} />
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{shoeName}</Text>
      <Text style={{ color: '#666' }}>
        {log.date}{log.distance != null ? ` · ${log.distance} km` : ''}
      </Text>
      {log.memo ? <Text style={{ fontSize: 16 }}>{log.memo}</Text> : null}
      {photos.map((p) => (
        <Image
          key={p.id}
          source={{ uri: p.photo_uri }}
          style={{ width: width - 32, height: width - 32, borderRadius: 12 }}
        />
      ))}
      <Pressable onPress={onDelete} style={{ padding: 14, borderRadius: 10, backgroundColor: '#ffebee', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: '#c62828' }}>일지 삭제</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: 앱 실행으로 상세·삭제 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 타임라인 항목 탭 → 사진 크게 보기·메모 표시. 삭제 시 확인 후 타임라인에서 제거되고, 해당 신발 누적 거리가 그 일지 거리만큼 감소. `Ctrl+C`로 종료.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add wear log detail screen with photo viewer and delete"
```

---

## Task 16: 통계 탭

**Files:**
- Modify: `app/(tabs)/stats.tsx`

**Interfaces:**
- Consumes: `getShoes` (db/shoes), `getWearLogs` (db/wearLogs), `totalDistance` (domain/mileage)
- Produces: 이번 달 총 거리, 가장 많이 신은 신발(일지 수 기준), 신발별 누적 거리 순위.

- [ ] **Step 1: 통계 화면 작성**

Modify `app/(tabs)/stats.tsx` — 전체 교체:
```tsx
import { useState, useCallback } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { getShoes } from '../../src/db/shoes';
import { getWearLogs } from '../../src/db/wearLogs';

interface ShoeStat {
  name: string;
  total: number;
  count: number;
}

export default function StatsTab() {
  const [monthDistance, setMonthDistance] = useState(0);
  const [stats, setStats] = useState<ShoeStat[]>([]);
  const [mostWorn, setMostWorn] = useState<string | null>(null);

  const load = useCallback(() => {
    (async () => {
      const shoes = await getShoes(true);
      const logs = await getWearLogs();
      const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

      let md = 0;
      const byShoe = new Map<number, ShoeStat>();
      for (const s of shoes) byShoe.set(s.id, { name: s.name, total: 0, count: 0 });

      for (const log of logs) {
        if (log.date.startsWith(month)) md += log.distance ?? 0;
        const stat = byShoe.get(log.shoe_id);
        if (stat) {
          stat.total += log.distance ?? 0;
          stat.count += 1;
        }
      }

      const arr = [...byShoe.values()].sort((a, b) => b.total - a.total);
      setMonthDistance(md);
      setStats(arr);
      const top = [...arr].sort((a, b) => b.count - a.count)[0];
      setMostWorn(top && top.count > 0 ? top.name : null);
    })();
  }, []);

  useFocusEffect(load);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: '통계' }} />

      <View style={{ padding: 16, backgroundColor: '#f0f7ff', borderRadius: 12 }}>
        <Text style={{ color: '#666' }}>이번 달 총 거리</Text>
        <Text style={{ fontSize: 28, fontWeight: 'bold' }}>{monthDistance.toFixed(1)} km</Text>
      </View>

      <View style={{ padding: 16, backgroundColor: '#fff7f0', borderRadius: 12 }}>
        <Text style={{ color: '#666' }}>가장 많이 신은 신발</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{mostWorn ?? '기록 없음'}</Text>
      </View>

      <Text style={{ fontWeight: 'bold', fontSize: 16 }}>신발별 누적 거리</Text>
      {stats.length === 0 ? (
        <Text style={{ color: '#999' }}>아직 데이터가 없어요.</Text>
      ) : (
        stats.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <Text>{i + 1}. {s.name}</Text>
            <Text style={{ color: '#666' }}>{s.total.toFixed(1)} km · {s.count}회</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: 앱 실행으로 통계 검증**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
Expected: 통계 탭에서 이번 달 총 거리, 가장 많이 신은 신발, 신발별 누적 거리 순위가 일지 데이터와 일치하게 표시됨. `Ctrl+C`로 종료.

- [ ] **Step 3: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add stats tab"
```

---

## Task 17: 마무리 — 전체 점검 + README

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: 실행 방법 문서. 전체 테스트 통과 확인.

- [ ] **Step 1: 전체 단위 테스트 실행**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npm test
```
Expected: 모든 도메인 테스트 PASS (mileage, validation).

- [ ] **Step 2: 타입 전체 점검**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit
```
Expected: 에러 없음.

- [ ] **Step 3: README 작성**

Create `README.md`:
```markdown
# Shoes Log

신발 컬렉션 관리 + 마일리지 추적 + 사진 착화 일지 모바일 앱 (React Native + Expo).

## 실행

```bash
npm install
npx expo start
```

폰의 Expo Go 앱으로 QR 코드를 스캔하면 실행됩니다.

## 테스트

```bash
npm test        # 도메인 로직 단위 테스트
npx tsc --noEmit  # 타입 체크
```

## 구조

- `app/` — 화면 (expo-router)
- `src/domain/` — 순수 로직 (마일리지 계산, 검증) — 테스트 대상
- `src/db/` — SQLite 데이터 계층
- `src/services/` — 사진 저장
- `src/components/` — 공용 UI

## 설계 문서

`docs/superpowers/specs/2026-06-20-shoes-log-app-design.md`
```

- [ ] **Step 4: 전체 수동 회귀 점검 (폰)**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && npx expo start
```
점검 항목:
- 신발 등록(사진 포함) → 목록 표시
- 일지 작성(거리+사진 여러 장) → 누적 거리 증가, 임박/도달 배지
- 일지 삭제 → 누적 거리 감소, 사진 파일 정리
- 신발 은퇴 → 목록에서 숨김 / 해제 시 복귀
- 신발 삭제 → 관련 일지·사진 함께 제거
- 통계 수치 일치

`Ctrl+C`로 종료.

- [ ] **Step 5: 커밋**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "docs: add README and finalize MVP"
```

---

## 향후 확장 (이 계획 범위 밖)

- 클라우드 동기화 / 로그인 (데이터 계층이 분리돼 있어 `src/db/*` 뒤에 원격 어댑터 추가)
- 푸시 알림 (expo-notifications)
- 백업 내보내기/가져오기
- GPS 자동 거리 추적
- 앱스토어 빌드/배포 (EAS Build)
