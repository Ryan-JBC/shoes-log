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
