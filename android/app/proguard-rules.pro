# R8 / ProGuard rules for the Ball IQ Android app.
#
# WHY THESE EXIST. Play Console flags the app as unoptimized while
# `minifyEnabled false`, so R8 was turned on. But Capacitor does not wire its
# plugins up statically — the bridge scans for @CapacitorPlugin classes at
# runtime and dispatches @PluginMethod calls by REFLECTION. R8 cannot see any of
# those call sites, so with default rules it happily strips or renames the whole
# plugin layer and the build still compiles green. The failure only appears on a
# device, as features that silently do nothing: no push token, share sheet never
# opens, splash never dismisses, Apple sign-in dead.
#
# 17 Capacitor plugins ship in this app. Everything below exists to keep that
# reflection surface intact. Treat additions to package.json as a prompt to
# re-check this file.
#
# ⚠️ A green `bundleRelease` does NOT prove these rules are sufficient — R8
# breakage is a RUNTIME failure. Device-test before uploading any AAB built
# with minification on.

# ── Capacitor core + bridge ─────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Plugin discovery + method dispatch are both annotation-driven.
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod <methods>;
}
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

# ── Official + community plugins (all reflection-registered) ────────────────
# app, browser, filesystem, haptics, keyboard, local-notifications,
# preferences, push-notifications, share, splash-screen, status-bar,
# apple-sign-in, in-app-review.
-keep class com.capacitorjs.plugins.** { *; }
-keep class ee.forgr.capacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }
-dontwarn com.capacitorjs.plugins.**
-dontwarn com.getcapacitor.community.**

# Cordova plugins ride in through capacitor-cordova-android-plugins.
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ── Anything exposed to the WebView's JS context ────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep public class * extends android.webkit.WebChromeClient { *; }

# ── This app ────────────────────────────────────────────────────────────────
-keep class app.balliq.** { *; }

# ── Firebase / Play services, referenced by push even where unused ──────────
-dontwarn com.google.android.gms.**
-dontwarn com.google.firebase.**

# ── Crash reports ───────────────────────────────────────────────────────────
# Without these, a Play Console stack trace is unreadable line noise. The
# mapping file is uploaded with the bundle, so keeping them costs nothing.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
