# 신발/일지 수정 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신발과 일지를 등록 후 수정(편집)할 수 있게 한다 — 등록 폼을 공용 컴포넌트로 분리해 추가/수정이 같은 UI·검증을 공유하고, 각 상세 화면에 "수정" 버튼과 edit 화면을 추가한다.

**Architecture:** `ShoeForm`/`WearLogForm` 공용 폼 컴포넌트가 입력 UI·검증·`saving` 상태를 담당하고, 화면이 `onSubmit` 콜백으로 영속(add vs update) + 사진 파일 작업을 담당한다. 데이터 계층에 `updateShoe`/`updateWearLog`(사진 재조정 포함)를 추가한다.

**Tech Stack:** React Native, Expo SDK 54, TypeScript, expo-router, expo-sqlite, expo-image-picker, `@react-native-community/datetimepicker`(DateField), expo-image-manipulator/file-system(photoStorage). 새 의존성 없음.

## Global Constraints

- **Expo SDK 54 유지.** 새 의존성 추가 금지 (기존 라이브러리 재사용).
- TypeScript strict. 화면/컴포넌트는 `npx tsc --noEmit`로 검증 (이 환경에서 `npx expo start` 실행 금지 — TTY 없음; 실기기 검증은 사용자).
- 검증은 기존 `validateShoeInput(input, today)` / `validateWearLogInput(input, today)` 재사용. `today = new Date().toISOString().slice(0,10)`. 미래 날짜·형식·필수값 차단.
- 다크 테마 토큰(`useTheme()`)만 사용 — 하드코딩 색 금지. accent 버튼/선택칩에 `ON_ACCENT` 글자색.
- 폼 동작·모양은 기존 add 화면과 **동일하게 유지**(폼 분리 후에도 등록 화면이 똑같이 보이고 동작해야 함).
- 사진 정합성: 신발 사진 교체 시 기존 파일 삭제; 일지 수정 시 제거된 사진은 파일+DB행 삭제, 새 사진은 저장·삽입; 저장 실패 시 새로 저장한 파일 정리(고아 방지).
- 누적 거리·교체 표시는 저장하지 않고 계산(기존 유지).
- 에러는 Alert로 표시, 삼키지 않음.

## 에러 처리 계약 (폼 ↔ 화면)
- **폼**: 입력 검증 실패 시 Alert 후 중단(onSubmit 호출 안 함). 유효하면 `setSaving(true)` → `await onSubmit(...)` → `finally setSaving(false)`. 폼은 영속 에러를 Alert하지 않는다.
- **화면 onSubmit**: 영속(DB/사진)을 수행하고 **자체적으로 try/catch + 정리 + Alert** 처리하며 성공 시 `router.back()`. 절대 throw하지 않는다(폼은 영속 에러를 모름).

---

## File Structure

```
src/db/shoes.ts        # (수정) updateShoe 추가
src/db/wearLogs.ts     # (수정) updateWearLog + deleteWearLogPhotosExcept 추가
src/components/ShoeForm.tsx      # (신규) 신발 공용 폼
src/components/WearLogForm.tsx   # (신규) 일지 공용 폼
app/shoe/new.tsx       # (수정) ShoeForm 추가 모드로 재구성
app/shoe/edit/[id].tsx # (신규) ShoeForm 수정 모드
app/shoe/[id].tsx      # (수정) "수정" 버튼 추가
app/log/new.tsx        # (수정) WearLogForm 추가 모드로 재구성
app/log/edit/[id].tsx  # (신규) WearLogForm 수정 모드
app/log/[id].tsx       # (수정) "수정" 버튼 추가
```

---

## Task 1: 데이터 계층 — updateShoe

**Files:**
- Modify: `src/db/shoes.ts`

**Interfaces:**
- Consumes: `getDb()`, `NewShoe`.
- Produces: `updateShoe(id: number, input: NewShoe): Promise<void>` — name/brand/category/photo_uri/purchase_date/price/target_distance UPDATE (retired/created_at 불변).

- [ ] **Step 1: updateShoe 추가**

`src/db/shoes.ts` 끝에 추가:
```ts
export async function updateShoe(id: number, input: NewShoe): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `UPDATE shoes SET
       name = ?, brand = ?, category = ?, photo_uri = ?,
       purchase_date = ?, price = ?, target_distance = ?
     WHERE id = ?`,
    input.name.trim(),
    input.brand,
    input.category,
    input.photo_uri,
    input.purchase_date,
    input.price,
    input.target_distance,
    id,
  );
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add updateShoe data layer"
```

---

## Task 2: 데이터 계층 — updateWearLog + 사진 재조정

**Files:**
- Modify: `src/db/wearLogs.ts`

**Interfaces:**
- Consumes: `getDb()`.
- Produces:
  - `updateWearLog(id: number, fields: { shoe_id: number; date: string; distance: number | null; memo: string | null }, keepPhotoIds: number[], addPhotoUris: string[]): Promise<void>` — 트랜잭션으로 wear_logs 행 UPDATE + `keepPhotoIds`에 없는 기존 사진 행 삭제 + `addPhotoUris` 삽입. (파일 삭제는 호출자 책임 — DB는 행만.)

- [ ] **Step 1: updateWearLog 추가**

`src/db/wearLogs.ts` 끝에 추가:
```ts
export async function updateWearLog(
  id: number,
  fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
  keepPhotoIds: number[],
  addPhotoUris: string[],
): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE wear_logs SET shoe_id = ?, date = ?, distance = ?, memo = ? WHERE id = ?',
      fields.shoe_id,
      fields.date,
      fields.distance,
      fields.memo,
      id,
    );
    // 유지 목록에 없는 기존 사진 행 삭제
    const existing = await db.getAllAsync<{ id: number }>(
      'SELECT id FROM wear_log_photos WHERE wear_log_id = ?',
      id,
    );
    for (const row of existing) {
      if (!keepPhotoIds.includes(row.id)) {
        await db.runAsync('DELETE FROM wear_log_photos WHERE id = ?', row.id);
      }
    }
    // 새 사진 삽입
    for (const uri of addPhotoUris) {
      await db.runAsync(
        'INSERT INTO wear_log_photos (wear_log_id, photo_uri) VALUES (?, ?)',
        id,
        uri,
      );
    }
  });
}
```

- [ ] **Step 2: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: add updateWearLog with photo reconciliation"
```

---

## Task 3: 신발 수정 — ShoeForm + new 재구성 + edit 화면 + 수정 버튼

**Files:**
- Create: `src/components/ShoeForm.tsx`, `app/shoe/edit/[id].tsx`
- Modify: `app/shoe/new.tsx`, `app/shoe/[id].tsx`

**Interfaces:**
- Consumes: `validateShoeInput`, `useTheme`, `ON_ACCENT`, `DateField`, expo-image-picker, `NewShoe`/`Shoe`; `addShoe`/`updateShoe`/`getShoe` (db/shoes); `savePhoto`/`deletePhoto` (services).
- Produces: `ShoeForm` component with props `{ initial?: Shoe; submitLabel: string; onSubmit: (input: NewShoe, pickedPhotoUri: string | null) => Promise<void> }`.

- [ ] **Step 1: ShoeForm 작성**

Create `src/components/ShoeForm.tsx`:
```tsx
import { useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { validateShoeInput } from '../domain/validation';
import { DateField } from './DateField';
import { useTheme } from '../theme/ThemeProvider';
import { ON_ACCENT } from '../theme/colors';
import { NewShoe, Shoe } from '../types';

const CATEGORIES = ['러닝화', '운동화', '구두', '기타'] as const;

export function ShoeForm({
  initial, submitLabel, onSubmit,
}: {
  initial?: Shoe;
  submitLabel: string;
  onSubmit: (input: NewShoe, pickedPhotoUri: string | null) => Promise<void>;
}) {
  const { colors, accent } = useTheme();
  const isPreset = initial?.category != null && (CATEGORIES as readonly string[]).includes(initial.category);
  const initialChoice = initial?.category == null ? null : (isPreset ? initial.category : '기타');

  const [name, setName] = useState(initial?.name ?? '');
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [categoryChoice, setCategoryChoice] = useState<string | null>(initialChoice);
  const [categoryOther, setCategoryOther] = useState(initialChoice === '기타' ? (initial?.category ?? '') : '');
  const [purchaseDate, setPurchaseDate] = useState<string | null>(initial?.purchase_date ?? null);
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '');
  const [target, setTarget] = useState(initial?.target_distance != null ? String(initial.target_distance) : '');
  const [pickedPhoto, setPickedPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const shownPhoto = pickedPhoto ?? initial?.photo_uri ?? null;

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setPickedPhoto(result.assets[0].uri);
  }

  function resolveCategory(): string | null {
    if (categoryChoice === '기타') return categoryOther.trim() || null;
    return categoryChoice;
  }

  async function handleSubmit() {
    if (categoryChoice === '기타' && categoryOther.trim() === '') {
      Alert.alert('입력 오류', '기타 종류를 입력하세요.'); return;
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
      await onSubmit(input, pickedPhoto);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Pressable onPress={pickPhoto} style={{ alignSelf: 'center' }}>
        {shownPhoto ? (
          <Image source={{ uri: shownPhoto }} style={{ width: 120, height: 120, borderRadius: 12 }} />
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

      <Pressable onPress={handleSubmit} disabled={saving}
        style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : submitLabel}</Text>
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

- [ ] **Step 2: shoe/new.tsx 를 ShoeForm 사용으로 교체**

Replace `app/shoe/new.tsx` entirely:
```tsx
import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { addShoe } from '../../src/db/shoes';
import { savePhoto } from '../../src/services/photoStorage';
import { ShoeForm } from '../../src/components/ShoeForm';
import { NewShoe } from '../../src/types';

export default function NewShoeScreen() {
  async function onSubmit(input: NewShoe, pickedPhotoUri: string | null) {
    try {
      if (pickedPhotoUri) input.photo_uri = await savePhoto(pickedPhotoUri);
      await addShoe(input);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    }
  }
  return (
    <>
      <Stack.Screen options={{ title: '신발 등록' }} />
      <ShoeForm submitLabel="저장" onSubmit={onSubmit} />
    </>
  );
}
```

- [ ] **Step 3: shoe/edit/[id].tsx 작성**

Create `app/shoe/edit/[id].tsx`:
```tsx
import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getShoe, updateShoe } from '../../../src/db/shoes';
import { savePhoto, deletePhoto } from '../../../src/services/photoStorage';
import { ShoeForm } from '../../../src/components/ShoeForm';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { NewShoe, Shoe } from '../../../src/types';

export default function EditShoeScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shoeId = Number(id);
  const [shoe, setShoe] = useState<Shoe | null>(null);

  useEffect(() => {
    getShoe(shoeId)
      .then((s) => { if (!s) { Alert.alert('오류', '신발을 찾을 수 없습니다.'); router.back(); } else setShoe(s); })
      .catch((e) => Alert.alert('불러오기 실패', String(e)));
  }, [shoeId]);

  if (!shoe) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: '신발 수정' }} />
        <Text style={{ color: colors.textSecondary }}>불러오는 중...</Text>
      </View>
    );
  }

  async function onSubmit(input: NewShoe, pickedPhotoUri: string | null) {
    const oldPhoto = shoe!.photo_uri;
    try {
      if (pickedPhotoUri) {
        input.photo_uri = await savePhoto(pickedPhotoUri);
      } else {
        input.photo_uri = shoe!.photo_uri;
      }
      await updateShoe(shoe!.id, input);
      if (pickedPhotoUri && oldPhoto) await deletePhoto(oldPhoto);
      router.back();
    } catch (e) {
      Alert.alert('저장 실패', String(e));
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '신발 수정' }} />
      <ShoeForm initial={shoe} submitLabel="수정 저장" onSubmit={onSubmit} />
    </>
  );
}
```

- [ ] **Step 4: shoe/[id].tsx 에 "수정" 버튼 추가**

Read `app/shoe/[id].tsx`. Find the "은퇴 처리"/"은퇴 해제" `Pressable` (the retire toggle near the bottom). Add a **수정** button immediately BEFORE it:
```tsx
<Pressable onPress={() => router.push(`/shoe/edit/${shoeId}`)} style={{ padding: 14, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', marginTop: 12 }}>
  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>수정</Text>
</Pressable>
```
(`router` and `colors` are already imported/in scope in that file. If the retire button already has `marginTop: 12`, remove the `marginTop` from the retire button so spacing stays even — keep it on the first of the stacked buttons only.)

- [ ] **Step 5: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: shoe edit (shared ShoeForm, edit screen, detail button)"
```

---

## Task 4: 일지 수정 — WearLogForm + new 재구성 + edit 화면 + 수정 버튼

**Files:**
- Create: `src/components/WearLogForm.tsx`, `app/log/edit/[id].tsx`
- Modify: `app/log/new.tsx`, `app/log/[id].tsx`

**Interfaces:**
- Consumes: `validateWearLogInput`, `useTheme`, `ON_ACCENT`, `DateField`, expo-image-picker, `Shoe`/`WearLog`/`WearLogPhoto`; `getShoes`/`getShoe` (db/shoes); `addWearLog`/`updateWearLog`/`getWearLog`/`getPhotosForLog` (db/wearLogs); `savePhotos`/`deletePhoto` (services).
- Produces: `WearLogForm` with props `{ initial?: { log: WearLog; photos: WearLogPhoto[] }; submitLabel: string; onSubmit: (fields: { shoe_id: number; date: string; distance: number | null; memo: string | null }, keepPhotoIds: number[], newPhotoUris: string[]) => Promise<void> }`.

- [ ] **Step 1: WearLogForm 작성**

Create `src/components/WearLogForm.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getShoes, getShoe } from '../db/shoes';
import { validateWearLogInput } from '../domain/validation';
import { DateField } from './DateField';
import { useTheme } from '../theme/ThemeProvider';
import { ON_ACCENT } from '../theme/colors';
import { Shoe, WearLog, WearLogPhoto } from '../types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WearLogForm({
  initial, submitLabel, onSubmit,
}: {
  initial?: { log: WearLog; photos: WearLogPhoto[] };
  submitLabel: string;
  onSubmit: (
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    keepPhotoIds: number[],
    newPhotoUris: string[],
  ) => Promise<void>;
}) {
  const { colors, accent } = useTheme();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [shoeId, setShoeId] = useState<number>(initial?.log.shoe_id ?? 0);
  const [date, setDate] = useState(initial?.log.date ?? today());
  const [distance, setDistance] = useState(initial?.log.distance != null ? String(initial.log.distance) : '');
  const [memo, setMemo] = useState(initial?.log.memo ?? '');
  const [existing, setExisting] = useState<WearLogPhoto[]>(initial?.photos ?? []);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const active = await getShoes('active');
        let list = active;
        if (initial && !active.some((s) => s.id === initial.log.shoe_id)) {
          const s = await getShoe(initial.log.shoe_id);
          if (s) list = [s, ...active];
        }
        setShoes(list);
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, []);

  async function addPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) setNewPhotos((prev) => [...prev, result.assets[0].uri]);
  }

  async function handleSubmit() {
    const todayStr = today();
    const errors = validateWearLogInput({ shoe_id: shoeId, date, distance: distance ? Number(distance) : null }, todayStr);
    if (errors.length > 0) { Alert.alert('입력 오류', errors.join('\n')); return; }
    setSaving(true);
    try {
      await onSubmit(
        { shoe_id: shoeId, date, distance: distance ? Number(distance) : null, memo: memo || null },
        existing.map((p) => p.id),
        newPhotos,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>신발 선택 *</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {shoes.map((s) => (
          <Pressable key={s.id} onPress={() => setShoeId(s.id)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: shoeId === s.id ? accent : colors.card }}>
            <Text style={{ color: shoeId === s.id ? ON_ACCENT : colors.textPrimary }}>{s.name}</Text>
          </Pressable>
        ))}
      </View>

      <DateField label="날짜" value={date} onChange={setDate} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>거리(km)</Text>
      <TextInput value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="선택" placeholderTextColor={colors.textMuted}
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>메모</Text>
      <TextInput value={memo} onChangeText={setMemo} placeholder="코디/날씨/느낌" placeholderTextColor={colors.textMuted} multiline
        style={{ borderWidth: 1, borderRadius: 8, padding: 10, height: 80, backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }} />

      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>사진</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {existing.map((p) => (
          <View key={`e-${p.id}`}>
            <Image source={{ uri: p.photo_uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            <Pressable onPress={() => setExisting((prev) => prev.filter((x) => x.id !== p.id))}
              style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
            </Pressable>
          </View>
        ))}
        {newPhotos.map((uri, i) => (
          <View key={`n-${i}`}>
            <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            <Pressable onPress={() => setNewPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addPhoto} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, color: colors.textPrimary }}>＋</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleSubmit} disabled={saving} style={{ backgroundColor: accent, padding: 16, borderRadius: 12, alignItems: 'center', opacity: saving ? 0.5 : 1 }}>
        <Text style={{ color: ON_ACCENT, fontWeight: 'bold' }}>{saving ? '저장 중...' : submitLabel}</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 2: log/new.tsx 를 WearLogForm 사용으로 교체**

Replace `app/log/new.tsx` entirely:
```tsx
import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';
import { addWearLog } from '../../src/db/wearLogs';
import { savePhotos, deletePhoto } from '../../src/services/photoStorage';
import { WearLogForm } from '../../src/components/WearLogForm';

export default function NewLogScreen() {
  async function onSubmit(
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    _keepPhotoIds: number[],
    newPhotoUris: string[],
  ) {
    let saved: string[] = [];
    try {
      saved = await savePhotos(newPhotoUris);
      await addWearLog({ ...fields, photo_uris: saved });
      router.back();
    } catch (e) {
      for (const u of saved) await deletePhoto(u);
      Alert.alert('저장 실패', String(e));
    }
  }
  return (
    <>
      <Stack.Screen options={{ title: '일지 작성' }} />
      <WearLogForm submitLabel="저장" onSubmit={onSubmit} />
    </>
  );
}
```

- [ ] **Step 3: log/edit/[id].tsx 작성**

Create `app/log/edit/[id].tsx`:
```tsx
import { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getWearLog, getPhotosForLog, updateWearLog } from '../../../src/db/wearLogs';
import { savePhotos, deletePhoto } from '../../../src/services/photoStorage';
import { WearLogForm } from '../../../src/components/WearLogForm';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { WearLog, WearLogPhoto } from '../../../src/types';

export default function EditLogScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const logId = Number(id);
  const [data, setData] = useState<{ log: WearLog; photos: WearLogPhoto[] } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const log = await getWearLog(logId);
        if (!log) { Alert.alert('오류', '일지를 찾을 수 없습니다.'); router.back(); return; }
        const photos = await getPhotosForLog(logId);
        setData({ log, photos });
      } catch (e) {
        Alert.alert('불러오기 실패', String(e));
      }
    })();
  }, [logId]);

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Stack.Screen options={{ title: '일지 수정' }} />
        <Text style={{ color: colors.textSecondary }}>불러오는 중...</Text>
      </View>
    );
  }

  async function onSubmit(
    fields: { shoe_id: number; date: string; distance: number | null; memo: string | null },
    keepPhotoIds: number[],
    newPhotoUris: string[],
  ) {
    let saved: string[] = [];
    try {
      saved = await savePhotos(newPhotoUris);
      await updateWearLog(logId, fields, keepPhotoIds, saved);
      // 제거된 기존 사진 파일 정리
      const removed = data!.photos.filter((p) => !keepPhotoIds.includes(p.id));
      for (const p of removed) await deletePhoto(p.photo_uri);
      router.back();
    } catch (e) {
      for (const u of saved) await deletePhoto(u);
      Alert.alert('저장 실패', String(e));
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: '일지 수정' }} />
      <WearLogForm initial={data} submitLabel="수정 저장" onSubmit={onSubmit} />
    </>
  );
}
```

- [ ] **Step 4: log/[id].tsx 에 "수정" 버튼 추가**

Read `app/log/[id].tsx`. Add a **수정** button immediately BEFORE the existing "일지 삭제" `Pressable`:
```tsx
<Pressable onPress={() => router.push(`/log/edit/${logId}`)} style={{ padding: 14, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', marginTop: 8 }}>
  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>수정</Text>
</Pressable>
```
(`router`, `colors`, `logId` are already in scope. Keep the delete button's existing `marginTop: 8`.)

- [ ] **Step 5: 컴파일 확인**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 6: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "feat: wear-log edit (shared WearLogForm, edit screen, detail button)"
```

---

## Task 5: 마무리 — 전체 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 단위 테스트**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npm test`
Expected: 기존 도메인 테스트 전부 PASS (4 suites / 47 tests). 이번 작업은 순수 로직을 바꾸지 않으므로 그대로 통과해야 함.

- [ ] **Step 2: 타입 + 도구 점검**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit && CI=1 npx expo-doctor`
Expected: tsc 에러 없음. expo-doctor 통과(무해 경고만).

- [ ] **Step 3: 수동 회귀 점검 (폰, 사용자)**

이 환경에서는 `npx expo start`를 실행하지 않는다. 사용자에게 `npx expo start -c` 후 폰에서 확인하도록 안내:
- 신발 상세 → "수정" → 값이 채워진 채로 뜨고, 수정·사진 교체 저장 → 목록/상세 반영, 옛 사진 파일 정리
- 일지 상세 → "수정" → 신발/날짜/거리/메모 수정 + 기존 사진 ✕ 삭제 + 새 사진 추가 저장 → 반영
- 등록/작성(기존 추가 흐름)이 그대로 동작하는지(회귀 없음)
- 미래 날짜·빈 이름 등 검증이 수정 화면에서도 동일하게 막히는지

- [ ] **Step 4: 커밋 (변경 있을 경우만)**

검증만 했고 코드 변경이 없으면 커밋 생략. (README에 수정 기능 한 줄 추가하고 싶으면 추가 후 커밋: `git add -A && git commit -m "docs: note edit feature in README"`)

---

## 향후 확장 (범위 밖)
- 일괄 수정, 변경 이력, 사진 순서 변경/드래그, 사진 확대 보기에서 바로 삭제
