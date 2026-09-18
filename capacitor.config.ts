import type { CapacitorConfig } from "@capacitor/cli";

/**
 * إعدادات غلاف التطبيق الأصلي (iOS / Android).
 * عند تنفيذ `npm run ios` أو `npm run android` يتم بناء واجهة الويب إلى مجلد
 * `dist` ثم نسخها داخل المشروع الأصلي داخل `ios/` و`android/`.
 */
const config: CapacitorConfig = {
  appId: "com.khasmqareeb.app",
  appName: "خصم قريب",
  webDir: "dist",
  // يُبنى التطبيق من ملفات محلية داخل الجهاز، ولا يحتاج أي عنوان ويب خارجي.
  bundledWebRuntime: false,
  server: {
    // على iOS الافتراضي هو مخطط خاص (capacitor://) ولا يدعم الكوكيز
    // وتسجيل الدخول؛ استخدام https يجعل الأصل https://localhost فيعمل
    // تخزين الجلسة وخدمات Convex بشكل طبيعي.
    iosScheme: "https",
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#fbf6e8",
  },
  android: {
    backgroundColor: "#fbf6e8",
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#fbf6e8",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#fbf6e8",
    },
  },
};

export default config;
