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
