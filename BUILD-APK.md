# Android APK로 설치하기 (부루마블)

웹 게임을 **APK**로 만들어 휴대폰에 설치하려면 [Capacitor](https://capacitorjs.com/)로 Android 프로젝트를 만든 뒤 빌드합니다.

## 1. 준비물

- **Node.js** (LTS 권장) — [nodejs.org](https://nodejs.org/)
- **Android Studio** (최신) — [developer.android.com/studio](https://developer.android.com/studio)  
  설치 시 **Android SDK**, **빌드 도구** 포함

## 2. 의존성 설치

프로젝트 폴더에서:

```bash
npm install
```

## 3. www 폴더 생성 및 Android 플랫폼 추가 (최초 1회)

```bash
npm run copy:www
npx cap add android
```

`www`에는 `index.html`, `style.css`, `game.js`, `우리나라.jpg`가 복사됩니다.

## 4. 동기화

코드를 수정한 뒤 APK를 다시 만들 때마다:

```bash
npm run cap:sync
```

## 5. APK 빌드 방법

### 방법 A — Android Studio (권장)

```bash
npm run android:open
```

- Android Studio가 열리면 상단 메뉴: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- 완료 후 **locate** 링크를 누르면 APK 위치가 나옵니다.  
  보통: `android/app/build/outputs/apk/debug/app-debug.apk`
- 이 APK를 휴대폰으로 보내 설치합니다. (출처 알 수 없는 앱 설치 허용 필요할 수 있음)

### 방법 B — 명령줄 (Gradle)

```bash
npm run android:build
```

또는:

```bash
cd android
.\gradlew assembleDebug
```

생성 APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## 6. 서명된 릴리즈 APK (Play 스토어 등)

Android Studio에서 **Build → Generate Signed Bundle / APK** 로 keystore를 만들어 서명하면 됩니다.

## 참고

- 게임 내 **온라인 대전**은 인터넷이 필요합니다. APK에도 동일합니다.
- `game.js` 등을 수정한 뒤에는 반드시 `npm run cap:sync` 후 다시 빌드하세요.
