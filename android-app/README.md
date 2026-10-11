# Salon Defteri — Android uygulaması

Capacitor ile yapılmış ince bir Android kabuğu. İki işi var:

1. GitHub Pages'teki uygulamayı açmak (`https://ahdude00.github.io/gym-journal/`).
   Web tarafındaki her `git push` APK'yı yeniden kurmadan uygulamaya gelir.
2. Health Connect'ten günlük adım sayısını okumak. Samsung Health adımlarını
   Health Connect'e aktarır; uygulama yalnızca **okuma** izni ister.

Adımlar Özet'teki "Bugünün hedefleri" kartında görünür. Tarayıcıda bu bölüm
hiç görünmez (`index.html` içinde `ADIM_VAR`).

## Telefonda ilk kurulum

1. Samsung Health › Ayarlar › Health Connect: adım paylaşımını aç.
2. `SalonDefteri.apk` dosyasını telefona at ve aç (bilinmeyen kaynaktan
   yüklemeye izin vermesini isteyebilir).
3. Uygulamada Özet › "Adımları bağla" › Health Connect'te "Adımlar"a izin ver.
4. Tarayıcıdaki verilerin uygulamaya kendiliğinden gelmez (ayrı depolama):
   tarayıcıda Veri › yedek al, uygulamada Veri › yedeği yükle.

## Derleme

Android Studio (içindeki JDK 21) ve Android SDK gerekir.

```powershell
cd android-app
npm install
npx cap sync android
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
cd android; .\gradlew.bat assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`. `android/local.properties`
içinde `sdk.dir=C:/Users/<kullanıcı>/AppData/Local/Android/Sdk` olmalı
(Android Studio projeyi açınca kendisi yazar).

## Dosyalar

- `capacitor.config.json`: açılacak adres, uygulama kimliği
  (`com.ahdude.salondefteri`).
- `android/app/src/main/java/.../AdimPlugin.kt`: Health Connect eklentisi.
  Yöntemler: `durum`, `izinIste`, `adimlar({gun})`, `ayarlariAc`.
- `android/app/src/main/AndroidManifest.xml`: `READ_STEPS` izni ve Health
  Connect'in istediği izin açıklaması tanımları.
- `www/`: yalnızca internet yokken gösterilen yedek sayfa.
