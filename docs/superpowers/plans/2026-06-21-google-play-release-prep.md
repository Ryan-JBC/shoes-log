# 구글 플레이 출시 준비 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구글 플레이 출시에 필요한 레포 내 준비물(app.json 출시 설정, eas.json, 개인정보처리방침, 안드로이드 아이콘 보정, 출시 가이드)을 갖춘다.

**Architecture:** 코드 동작 변화 없이 설정·문서·에셋만 추가/수정한다. 빌드는 EAS(사용자 실행), 호스팅은 GitHub Pages(사용자 활성화). 검증은 `tsc`/`npm test`/`expo-doctor`.

**Tech Stack:** Expo SDK 54, app.json, eas.json, 정적 HTML(GitHub Pages), macOS `sips`(아이콘). 새 npm 의존성 없음.

## Global Constraints

- **Expo SDK 54 유지.** 새 npm 의존성 추가 금지.
- 패키지명(android.package) = `com.ryanj.shoeslog` (변경 불가, 정확히 이 값).
- 개인정보처리방침 문의 이메일 = `ryanjbc5421@gmail.com`. 시행일자 = 2026-06-21.
- 코드 로직 변경 없음 → 기존 테스트 47개(4 suites) 그대로 통과 유지, `npx tsc --noEmit` 클린, `CI=1 npx expo-doctor` 통과.
- 이 환경에서 `npx expo start`/`eas build` 실행 금지(TTY/계정 없음). 빌드·업로드는 가이드 문서로 안내.
- 메인 아이콘(`assets/images/icon.png`, iOS·범용)은 풀블리드 그대로 유지. 안드로이드 적응형 전경만 여백 버전으로 교체.

---

## File Structure

```
app.json                                  # (수정) android.package, versionCode, adaptiveIcon foreground
eas.json                                  # (신규) preview(apk)/production(aab) 프로필
assets/images/android-adaptive-foreground.png  # (신규) 여백 넣은 적응형 전경 (sips 생성)
docs/privacy.html                         # (신규) 개인정보처리방침 (GitHub Pages)
docs/google-play-release-guide.md         # (신규) 출시 절차 체크리스트
```

---

## Task 1: app.json 출시 설정 + eas.json

**Files:**
- Modify: `app.json`
- Create: `eas.json`

**Interfaces:**
- Produces: `android.package = "com.ryanj.shoeslog"`, `android.versionCode = 1`; `eas.json` with `preview`(apk)/`production`(aab) profiles, local app version source.

- [ ] **Step 1: app.json 에 package + versionCode 추가**

`app.json`의 `expo.android` 객체를 수정한다. 현재:
```json
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#c9ccd1",
        "foregroundImage": "./assets/images/icon.png"
      },
      "predictiveBackGestureEnabled": false
    },
```
다음으로 교체 (package + versionCode 추가, adaptiveIcon은 Task 2에서 다시 손댐 — 지금은 foreground 경로 유지):
```json
    "android": {
      "package": "com.ryanj.shoeslog",
      "versionCode": 1,
      "adaptiveIcon": {
        "backgroundColor": "#c9ccd1",
        "foregroundImage": "./assets/images/icon.png"
      },
      "predictiveBackGestureEnabled": false
    },
```
(`expo.version`은 `"1.0.0"` 그대로 둔다 — 스토어 표시 버전.)

- [ ] **Step 2: eas.json 생성**

Create `eas.json`:
```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: 검증**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npx tsc --noEmit && CI=1 npx expo-doctor`
Expected: tsc 에러 없음. expo-doctor 통과(무해 경고만). `app.json`이 유효 JSON이고 `android.package`가 인식되는지 확인.

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "chore: add android package, versionCode, and eas.json build profiles"
```

---

## Task 2: 안드로이드 적응형 아이콘 보정 (여백)

**Files:**
- Create: `assets/images/android-adaptive-foreground.png`
- Modify: `app.json`

**Interfaces:**
- Consumes: 기존 `assets/images/icon.png` (1024×1024 풀블리드).
- Produces: 안전영역 안에 핵심이 들어오도록 약 66%로 축소 + 회색 여백을 넣은 1024×1024 전경. `app.json` adaptiveIcon이 이 전경을 사용.

- [ ] **Step 1: 여백 넣은 전경 PNG 생성 (sips)**

Run:
```bash
cd /Users/ryan/Coding/app_Shoes_log
sips -z 680 680 assets/images/icon.png --out /tmp/fg-small.png
sips -p 1024 1024 --padColor C9CCD1 /tmp/fg-small.png --out assets/images/android-adaptive-foreground.png
rm -f /tmp/fg-small.png
sips -g pixelWidth -g pixelHeight assets/images/android-adaptive-foreground.png | grep pixel
```
Expected: 결과가 1024×1024. (아이콘 내용이 가운데 ~66%에 들어가고 주변은 `#C9CCD1` 회색 — 적응형 마스크에서 핵심이 안 잘림.)

- [ ] **Step 2: app.json adaptiveIcon 전경 교체**

`app.json`의 `expo.android.adaptiveIcon.foregroundImage`를 새 전경으로 바꾼다:
```json
      "adaptiveIcon": {
        "backgroundColor": "#c9ccd1",
        "foregroundImage": "./assets/images/android-adaptive-foreground.png"
      },
```
(`backgroundColor`는 전경 여백과 같은 `#c9ccd1` 유지 → 이음매 없이 보임. 메인 `icon`과 iOS `icon`은 그대로 풀블리드 icon.png.)

- [ ] **Step 3: 검증**

Run: `cd /Users/ryan/Coding/app_Shoes_log && CI=1 npx expo-doctor`
Expected: 통과. adaptiveIcon foregroundImage 경로가 유효(파일 존재).

- [ ] **Step 4: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "chore: add padded android adaptive icon foreground"
```

---

## Task 3: 개인정보 처리방침 (docs/privacy.html)

**Files:**
- Create: `docs/privacy.html`

**Interfaces:**
- Produces: GitHub Pages로 공개할 정적 개인정보처리방침 (한국어 + 영어).

- [ ] **Step 1: privacy.html 작성**

Create `docs/privacy.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Shoes Log 개인정보 처리방침 / Privacy Policy</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 22px; } h2 { font-size: 17px; margin-top: 28px; }
    .muted { color: #666; } hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
    code { background: #f3f3f3; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Shoes Log 개인정보 처리방침</h1>
  <p class="muted">시행일자: 2026-06-21</p>

  <p>Shoes Log(이하 "앱")는 사용자의 개인정보를 소중히 여기며, 이 앱은 개인정보를 수집·전송하지 않습니다.</p>

  <h2>1. 수집하는 개인정보</h2>
  <p>앱은 계정·로그인이 없으며, 어떤 개인정보도 수집하거나 서버로 전송하지 않습니다.</p>

  <h2>2. 사용자가 입력한 데이터</h2>
  <p>사용자가 등록한 신발 정보, 착화 일지, 사진은 모두 <strong>사용자 기기 내부에만 저장</strong>됩니다. 외부 서버 업로드, 제3자 공유, 인터넷 전송이 일절 없습니다. 앱을 삭제하면 해당 데이터도 함께 삭제됩니다.</p>

  <h2>3. 권한</h2>
  <p>사진 라이브러리 접근 권한은 사용자가 직접 선택한 이미지를 신발·일지에 추가하기 위해서만 사용됩니다. 선택한 이미지 외에는 접근하지 않습니다.</p>

  <h2>4. 광고·분석</h2>
  <p>앱은 광고를 표시하지 않으며, 분석(트래킹) 도구를 사용하지 않습니다.</p>

  <h2>5. 아동 개인정보</h2>
  <p>앱은 개인정보를 수집하지 않으므로 아동을 포함한 모든 사용자의 개인정보가 수집되지 않습니다.</p>

  <h2>6. 문의</h2>
  <p>개인정보 관련 문의: <a href="mailto:ryanjbc5421@gmail.com">ryanjbc5421@gmail.com</a></p>

  <hr />

  <h1>Shoes Log Privacy Policy</h1>
  <p class="muted">Effective date: 2026-06-21</p>

  <p>Shoes Log ("the app") respects your privacy. The app does not collect or transmit any personal information.</p>

  <h2>1. Information We Collect</h2>
  <p>The app has no account or login and does not collect or send any personal information to any server.</p>

  <h2>2. Your Data</h2>
  <p>All shoe details, wear logs, and photos you add are stored <strong>only on your device</strong>. Nothing is uploaded to a server, shared with third parties, or transmitted over the internet. Deleting the app deletes this data.</p>

  <h2>3. Permissions</h2>
  <p>Photo library access is used solely to let you add images you pick to your shoes and logs. The app does not access any images other than the ones you select.</p>

  <h2>4. Ads &amp; Analytics</h2>
  <p>The app shows no ads and uses no analytics or tracking tools.</p>

  <h2>5. Children's Privacy</h2>
  <p>Because the app collects no personal information, it collects none from any user, including children.</p>

  <h2>6. Contact</h2>
  <p>Privacy inquiries: <a href="mailto:ryanjbc5421@gmail.com">ryanjbc5421@gmail.com</a></p>
</body>
</html>
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "docs: add privacy policy page for Google Play"
```

> 사용자 안내(가이드에도 포함): GitHub 저장소 **Settings → Pages → Source: Deploy from a branch → `master` / `/docs`** 로 설정하면 `https://ryan-jbc.github.io/shoes-log/privacy.html` 에 공개됨. 이 URL을 Play Console 개인정보처리방침 칸에 입력.

---

## Task 4: 출시 절차 가이드 + 최종 검증

**Files:**
- Create: `docs/google-play-release-guide.md`

**Interfaces:**
- Produces: 외부 출시 절차 체크리스트 문서.

- [ ] **Step 1: 가이드 문서 작성**

Create `docs/google-play-release-guide.md`:
```markdown
# 구글 플레이 출시 가이드 (Shoes Log)

레포 준비물(app.json·eas.json·개인정보처리방침·아이콘)은 완료됨. 아래는 본인이 직접 하는 외부 절차.

## 0. 사전 확인
- 패키지명: `com.ryanj.shoeslog` (변경 불가)
- 개인정보처리방침: GitHub 저장소 **Settings → Pages → Deploy from a branch → master / /docs** 활성화 → URL: `https://ryan-jbc.github.io/shoes-log/privacy.html`
- 준비할 스토어 자료: 앱 아이콘 512×512, 피처 그래픽 1024×500, 폰 스크린샷 최소 2장, 짧은 설명, 자세한 설명

## 1. 구글 플레이 개발자 등록
1. https://play.google.com/console 접속 → $25(1회) 결제
2. 신원 확인(신분증) 완료

## 2. EAS(빌드) 준비
```bash
npm install -g eas-cli
eas login            # Expo 계정으로 로그인 (없으면 expo.dev에서 무료 가입)
eas build:configure  # 이미 eas.json 있으면 확인만
```

## 3. 테스트 빌드(APK)로 폰 확인
```bash
eas build -p android --profile preview
```
빌드 완료 후 나오는 링크에서 APK 받아 폰에 설치 → 다크 테마/등록/수정/통계 확인.

## 4. 출시 빌드(AAB) 생성
```bash
eas build -p android --profile production
```
완료되면 `.aab` 파일을 다운로드(또는 EAS 대시보드에 보관). 서명 키는 EAS가 자동 관리.

## 5. Play Console에서 앱 만들기
1. 앱 만들기 → 이름 "Shoes Log", 언어, 앱/게임=앱, 무료
2. 스토어 등록정보: 짧은/자세한 설명, 아이콘512, 피처그래픽, 스크린샷
3. 개인정보처리방침 URL 입력(위 Pages 주소)
4. 데이터 보안: "데이터 수집·공유 없음" 으로 신고 (앱이 로컬 전용)
5. 콘텐츠 등급 설문, 대상 연령, 광고 없음 신고

## 6. 비공개 테스트 → 프로덕션
1. **비공개 테스트** 트랙 생성 → `.aab` 업로드 → 테스터 이메일 20명 등록
2. **14일 이상** 테스트 유지 (구글 신규 계정 요건)
3. 이후 **프로덕션** 으로 승격 신청 → 구글 검토(보통 수일) → 출시 🎉

## 메모 (우리 앱 특화)
- 로컬 전용이라 데이터 보안 신고가 단순함(수집/공유 없음).
- 버전 올릴 때: `app.json`의 `android.versionCode`를 +1, `version`도 갱신 후 다시 `eas build`.
- 패키지명·서명키는 한번 출시하면 못 바꾸니 주의.
```

- [ ] **Step 2: 최종 검증**

Run: `cd /Users/ryan/Coding/app_Shoes_log && npm test && npx tsc --noEmit && CI=1 npx expo-doctor`
Expected: 테스트 4 suites/47 tests PASS, tsc 클린, expo-doctor 통과.

- [ ] **Step 3: 커밋**

```bash
cd /Users/ryan/Coding/app_Shoes_log && git add -A && git commit -m "docs: add Google Play release guide"
```

---

## 향후 (범위 밖)
- 스토어 자료(스크린샷·피처그래픽) 디자인, iOS App Store 출시(EAS + Apple $99/년), 푸시 알림·클라우드 동기화.
