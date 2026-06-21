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

## 기능

- **신발 관리** — 컬렉션 추가/수정/삭제 + 내 신발 필터 (사용 중/은퇴/전체) + 신발 종류 칩 선택 + 신발·일지 수정(편집)
- **마일리지 추적** — 착화 일지 + 구매일 이후 일수 카드 표시 + 자동 누적 계산
- **날짜 선택기** — 신발 등록/수정 및 일지 작성 시 미래 날짜 입력 불가
- **상세 통계** — 기간 선택 (이번 달/올해/전체/사용자 지정) + 막대그래프 차트
- **다크 테마** — 다크 테마 + 설정에서 포인트 색 8종 선택
- **설정 탭** — 포인트 색 8종 선택 + 앱 재시작 후 즉시 전체 화면 반영

## 구조

- `app/` — 화면 (expo-router)
- `src/domain/` — 순수 로직 (마일리지 계산, 검증) — 테스트 대상
- `src/db/` — SQLite 데이터 계층
- `src/services/` — 사진 저장
- `src/components/` — 공용 UI

## 제약

- Expo SDK 54 고정 (Expo Go 호환)

## 설계 문서

`docs/superpowers/specs/2026-06-20-shoes-log-app-design.md`
