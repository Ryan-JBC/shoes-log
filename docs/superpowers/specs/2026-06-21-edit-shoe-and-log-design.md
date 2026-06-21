# 신발/일지 수정 기능 — 설계 문서

- **작성일**: 2026-06-21
- **상태**: 승인됨 (구현 계획 작성 대기)
- **선행**: Ver.01.01 (다크 테마 리디자인). 본 작업은 그 위에 "수정(편집)" 기능 추가.

## 1. 개요

현재 신발과 일지는 **등록/작성만 가능하고 수정이 불가능**하다. 신발과 일지 **둘 다** 모든 항목을 수정할 수 있게 한다. 등록 폼을 공용 컴포넌트로 분리해 "추가"와 "수정"이 동일한 UI·검증을 공유하게 한다.

## 2. 접근 방식: 추가/수정 겸용 폼

- 입력 폼을 공용 컴포넌트로 분리:
  - `src/components/ShoeForm.tsx` — 신발 입력 UI + 검증 + 저장 콜백
  - `src/components/WearLogForm.tsx` — 일지 입력 UI + 검증 + 저장 콜백
- 화면은 폼을 "추가" 또는 "수정" 모드로 사용:
  - `app/shoe/new.tsx` → `ShoeForm` 추가 모드 (기존 동작 유지)
  - `app/shoe/edit/[id].tsx` (신규) → `ShoeForm` 수정 모드 (현재 값 prefill)
  - `app/log/new.tsx` → `WearLogForm` 추가 모드
  - `app/log/edit/[id].tsx` (신규) → `WearLogForm` 수정 모드
- 진입: **신발 상세(`app/shoe/[id].tsx`)·일지 상세(`app/log/[id].tsx`)에 "수정" 버튼** 추가 → 해당 edit 화면으로 `router.push`.
- 기존 은퇴/은퇴 해제/삭제 버튼은 그대로 둔다.

### 폼 컴포넌트 인터페이스
- `ShoeForm`:
  - props: `{ mode: 'add' | 'edit'; initial?: ShoeFormValues; onSubmit: (values: NewShoe, newPhotoPicked: boolean) => Promise<void> }`
  - 또는 더 단순하게: `{ initial?: Shoe; submitLabel: string; onSubmit: (input: NewShoe, pickedPhotoUri: string | null) => Promise<void> }`. 폼은 현재 사진(initial.photo_uri)을 보여주고, 사용자가 새로 고르면 `pickedPhotoUri`에 임시 uri를, 안 고르면 null을 전달. 저장 콜백이 사진 저장/교체를 책임.
- `WearLogForm`:
  - props: `{ initial?: { log: WearLog; photos: WearLogPhoto[] }; submitLabel: string; onSubmit: (input, existingPhotoUrisKept: string[], newPhotoUris: string[]) => Promise<void> }`
  - 폼은 기존 사진(삭제 가능)과 새로 추가한 사진을 함께 관리. 저장 시 콜백에 유지할 기존 사진 경로 목록 + 새 임시 사진 경로 목록을 전달.

> 구체 시그니처는 구현 계획에서 확정한다. 핵심: 폼은 UI/검증, 저장 콜백(화면)이 DB·사진 파일 작업을 담당해 추가/수정 화면이 각자 add/update를 호출.

## 3. 데이터 계층 (신규)

`src/db/shoes.ts`:
- `updateShoe(id: number, input: NewShoe): Promise<void>` — name/brand/category/photo_uri/purchase_date/price/target_distance UPDATE (retired/created_at 불변).

`src/db/wearLogs.ts`:
- `updateWearLog(id, fields: { shoe_id; date; distance; memo }): Promise<void>` — wear_logs 행 UPDATE.
- 사진 재조정은 화면(또는 작은 헬퍼)에서: 삭제된 기존 사진은 `deletePhoto`(파일) + `wear_log_photos` 행 삭제; 새 사진은 `savePhotos` 후 `wear_log_photos` 삽입. 행 삭제용 `deleteWearLogPhoto(photoId)` 또는 `deleteWearLogPhotosByUris` 추가.

## 4. 사진 처리 (수정 시)

- **신발**: 새 사진을 고르면 → `savePhoto`로 새 파일 저장 → `updateShoe`로 경로 갱신 → 성공 후 **기존 photo_uri 파일 `deletePhoto`**. (새 파일 저장 실패 시 기존 유지)
- **일지**: 폼이 "유지할 기존 사진 경로"와 "새 임시 사진 경로"를 구분 관리. 저장 시:
  1. 새 임시 사진 → `savePhotos` → 저장된 경로 확보
  2. 트랜잭션/순차로: `updateWearLog` 필드 갱신, 빠진 기존 사진은 행 삭제, 새 저장 사진은 행 삽입
  3. 빠진 기존 사진의 **파일은 `deletePhoto`로 삭제** (행 삭제 후)
  - 저장 실패 시 새로 저장한 파일은 정리(고아 방지) — 기존 add 화면의 패턴과 동일.

## 5. 검증 / 엣지

- `validateShoeInput(input, today)` / `validateWearLogInput(input, today)` 재사용 (미래 날짜·형식·필수값 동일 차단). today = `new Date().toISOString().slice(0,10)`.
- 수정 후 누적 거리·교체 임박/도달 표시는 자동 반영(저장 안 하고 계산).
- DB/파일 에러는 Alert로 표시, 저장 차단. 삼키지 않음.
- edit 화면 진입 시 대상이 없으면(삭제됨) 안전하게 뒤로 가거나 안내.

## 6. 테스트

- 신규 순수 로직 없음(검증·계산은 기존 재사용). 따라서 추가 단위 테스트는 불필요.
- `updateShoe`/`updateWearLog`와 폼/화면은 `tsc`로 타입 검증 + 폰(Expo Go) 수동 검증(실기기). SDK 54 유지.

## 7. 범위

### 이번 작업
- ✅ 공용 `ShoeForm`/`WearLogForm` 추출 (add 화면 재구성, 동작 동일)
- ✅ `app/shoe/edit/[id].tsx`, `app/log/edit/[id].tsx` 신규 (수정 모드)
- ✅ 상세 화면에 "수정" 버튼
- ✅ `updateShoe`, `updateWearLog` + 일지 사진 재조정(추가/삭제 + 파일 정리)
- ✅ 신발 사진 교체 + 기존 파일 정리

### 범위 밖
- 🔜 일괄 수정, 변경 이력, 사진 순서 변경

## 8. 제약

- **Expo SDK 54 유지**. 새 의존성 없음 (기존 image-picker/datetimepicker/file-system 재사용).
- 기존 add 화면의 동작·다크 테마는 그대로 유지(폼 분리 후에도 동일하게 보여야 함).
