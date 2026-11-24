import UIKit
import Capacitor

// ⚠️ UIScene LIFE CYCLE — REQUIRED, NOT OPTIONAL (2026-09-21). An app built with
// the iOS 27 SDK (Xcode 27) that has not adopted scenes is KILLED AT LAUNCH on
// iOS 27. See the configurationForConnecting hook in AppDelegate.swift.
//
// Until the Capacitor 8 upgrade this class lived in AppDelegate.swift and
// forwarded links to ApplicationDelegateProxy by hand. It now forwards to
// Capacitor's own SceneDelegateProxy (8.5+), as the 8.5 template does:
// https://capacitorjs.com/docs/updating/8-5#1-add-scenedelegateswift
//
// One deliberate difference from the template: the window is still built by
// UIKit from Main.storyboard (UISceneStoryboardFile in Info.plist), because
// the storyboard's root is MainViewController, which registers ShareCardPlugin.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    // UIKit builds this from Main.storyboard (see the scene manifest in Info.plist)
    // and assigns it BEFORE scene(_:willConnectTo:options:) is called.
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        // The splash-screen plugin (and anything else written for the old life cycle)
        // looks for the window on the app delegate first. Keep the two in step.
        (UIApplication.shared.delegate as? AppDelegate)?.window = window

        // configureWindow touches rootViewController.view, which forces the
        // Capacitor bridge and its plugins to load.
        AppDelegate.configureWindow(window)

        #if DEBUG
        // Debug only: sign-in callbacks arrive on this path with a login code in the URL.
        for context in connectionOptions.urlContexts {
            NSLog("%@ %@", "SceneDelegate cold-launch url ->", context.url.absoluteString)
        }
        for activity in connectionOptions.userActivities {
            NSLog("%@ %@", "SceneDelegate cold-launch activity ->", activity.webpageURL?.absoluteString ?? activity.activityType)
        }
        #endif

        // Cold launch from a link (/join/, /c/, or an OAuth callback). Under scenes
        // these arrive HERE, never through the app delegate. The proxy holds them
        // until the bridge's first viewDidAppear, so the App plugin's URL observers
        // exist before the link is delivered, and it sets the URL that
        // App.getLaunchUrl() returns.
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    // Every time the app comes to the front, cold or warm.
    func sceneDidBecomeActive(_ scene: UIScene) {
        AppDelegate.clearBadge()
    }

    // Warm opens: custom-scheme URLs (OAuth callbacks included).
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        #if DEBUG
        // Debug only: sign-in callbacks arrive on this path with a login code in the URL.
        for context in URLContexts {
            NSLog("%@ %@", "SceneDelegate warm url ->", context.url.absoluteString)
        }
        #endif
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    // Warm opens: universal links (/join/ and /c/).
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        #if DEBUG
        // Debug only: sign-in callbacks arrive on this path with a login code in the URL.
        NSLog("%@ %@", "SceneDelegate warm activity ->", userActivity.webpageURL?.absoluteString ?? userActivity.activityType)
        #endif
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
