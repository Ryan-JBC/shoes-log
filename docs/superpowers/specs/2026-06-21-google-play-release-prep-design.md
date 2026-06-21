# 구글 플레이 출시 준비 — 설계 문서

- **작성일**: 2026-06-21
- **상태**: 승인됨 (구현 계획 작성 대기)
- **선행**: Ver.01.02 (커스텀 아이콘 + 수정 기능). 본 작업은 구글 플레이 출시를 위한 **레포 내 준비물**을 만든다.

## 1. 개요

구글 플레이 스토어 출시에 필요한 것 중 **레포 안에서 만들 수 있는 준비물**을 갖춘다. 외부 절차(개발자 등록, EAS 빌드 실행, Play Console 업로드, 테스터 모집)는 직접 수행하되, 따라 하기 쉬운 체크리스트 문서를 제공한다.

**핵심 결정**
- 패키지명(applicationId): `com.ryanj.shoeslog` (네임스페이스 `com.ryanj` = 향후 앱 공통 접두사). 출시 후 변경 불가.
- 개인정보 처리방침: GitHub Pages로 무료 호스팅 (`shoes-log` 저장소).
- 빌드: EAS Build (AAB 업로드용 + APK 테스트용).
- 안드로이드 아이콘: 여백 넣은 전경으로 마스킹 잘림 보정.

## 2. 범위

### 레포에서 만들 것 (이번 작업)
1. **`app.json` 출시 설정** — `android.package`, `version`/`android.versionCode`, 사진 권한 확인.
2. **`eas.json`** — `production`(AAB), `preview`(APK) 프로필.
3. **개인정보 처리방침** — `docs/privacy.html` (한국어 + 영어 병기), GitHub Pages용.
4. **안드로이드 아이콘 보정** — 여백 넣은 적응형 전경 이미지 생성 + `app.json` 연결.
5. **출시 절차 가이드** — `docs/google-play-release-guide.md` 체크리스트.

### 범위 밖 (사용자 직접, 문서로 안내)
- 구글 플레이 개발자 등록($25)·신원 확인, Expo 로그인, `eas build` 실행, Play Console 앱 생성·업로드, 데이터 보안/콘텐츠 등급 설문, 스토어 자료(스크린샷·피처그래픽 1024×500·아이콘 512×512) 제작, **테스터 20명×14일 비공개 테스트** 후 프로덕션 신청.

## 3. app.json 변경

- `expo.android.package = "com.ryanj.shoeslog"`.
- `expo.version`: 사용자 표시 버전 (예: `"1.0.0"` 유지 또는 `"1.0.2"`). 스토어 표기용.
- `expo.android.versionCode`: 정수, 첫 출시 `1`. 이후 빌드마다 +1 (또는 EAS remote versioning 사용 — 가이드에 설명).
- 사진 권한: `expo-image-picker` 플러그인이 Android 권한을 처리. 필요 시 플러그인 옵션으로 사진 접근 사유 문구 설정. 불필요한 권한이 안 들어가는지 빌드 산출물에서 확인하도록 가이드에 명시.
- 기존 다크 테마/아이콘 설정은 유지.

## 4. eas.json

```jsonc
{
  "cli": { "version": ">= 최신" },
  "build": {
    "preview":    { "android": { "buildType": "apk" } },
    "production":  { "android": { "buildType": "app-bundle" } }
  },
  "submit": { "production": {} }
}
```
- `preview`: 폰에 바로 설치해 테스트할 APK.
- `production`: 플레이 업로드용 AAB.
- 서명 키: EAS가 자동 생성·관리(업로드 키). 가이드에 "EAS가 키 관리" 명시.
- 구체 버전 문자열·필드는 구현 계획에서 `eas build:configure` 결과에 맞춰 확정.

## 5. 개인정보 처리방침 (docs/privacy.html)

- 정적 HTML 한 장. 한국어 본문 + 영어 병기(구글 검토/해외 사용자 대비).
- 사실 기반 내용:
  - 수집하는 개인정보: **없음** (계정·로그인 없음).
  - 사진/데이터: 사용자가 추가한 신발·일지 사진과 입력값은 **기기 내부에만 저장**, 외부 전송·서버 업로드·제3자 공유 **없음**.
  - 권한: 사진 라이브러리 접근은 사용자가 직접 고른 이미지를 앱에 넣기 위해서만 사용.
  - 인터넷: 앱 기능은 오프라인(로컬). 분석/광고 SDK 없음.
  - 문의처: **ryanjbc5421@gmail.com** (출시 전용 메일, 공개 OK).
  - 시행일자.
- 사용자는 GitHub **Settings → Pages**에서 소스 브랜치(`master`/`docs`)를 켜고, 결과 URL을 Play Console에 입력.

## 6. 안드로이드 아이콘 보정

- 현재 `app.json`의 `android.adaptiveIcon.foregroundImage`는 풀블리드 아이콘(`icon.png`)이라 마스킹 시 가장자리(선반·텍스트)가 잘리고 확대돼 보임.
- 보정: 원본 아이콘을 **약 66% 크기로 축소하고 주변 여백(투명)을 넣은 전경 PNG**(`assets/images/android-adaptive-foreground.png`, 1024×1024)를 생성 → 안드로이드 안전영역 안에 핵심(신발+화살표)이 들어오게.
- `app.json`: `android.adaptiveIcon.foregroundImage`를 새 전경으로, `backgroundColor`는 어울리는 색(예: 선반 회색 `#c9ccd1` 또는 다크 `#15181f`)으로.
- 메인 `icon`(iOS·범용)은 풀블리드 그대로 유지.
- 생성은 macOS `sips`로 처리(여백 합성). 새 의존성 없음.

## 7. 출시 절차 가이드 (docs/google-play-release-guide.md)

체크리스트 형식, 순서:
1. 사전: 패키지명 확정(완료), 개인정보처리방침 URL(Pages 켜기), 스토어 자료 준비물 목록.
2. 구글 플레이 개발자 등록($25) + 신원 확인.
3. Expo 계정 + `npm i -g eas-cli` + `eas login` + `eas build:configure`.
4. 테스트 빌드: `eas build -p android --profile preview` → APK 폰 설치 확인.
5. 출시 빌드: `eas build -p android --profile production` → AAB.
6. Play Console: 앱 생성 → 스토어 등록정보(설명/아이콘512/피처그래픽/스크린샷) → 데이터 보안·콘텐츠 등급·대상연령 설문 → 개인정보처리방침 URL.
7. 비공개 테스트 트랙 업로드 → **테스터 20명·14일** → 프로덕션 신청 → 검토 → 출시.
- 각 단계에 우리 앱 특화 메모(로컬 전용이라 데이터 보안 단순 등).

## 8. 제약

- **Expo SDK 54 유지.** 새 npm 의존성 없음(아이콘은 sips, 빌드는 EAS CLI는 전역 설치이므로 프로젝트 의존성 아님).
- 출시 후 패키지명·서명키 변경 불가 — 가이드에 강조.
- 코드 동작 변화 없음(설정·문서·에셋만). 기존 테스트(47개)는 그대로 통과해야 함.

## 9. 테스트/검증

- 신규 순수 로직 없음 → 단위 테스트 추가 없음.
- `npx tsc --noEmit` 클린, `npm test` 47개 통과 유지, `CI=1 npx expo-doctor` 통과(특히 `android.package`·아이콘 경로 유효성).
- 빌드 자체(`eas build`)는 사용자가 실행(이 환경에서 불가). 가이드로 안내.
