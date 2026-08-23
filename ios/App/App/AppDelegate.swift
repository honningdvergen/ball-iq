import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Paint the native UIWindow + rootViewController.view to the app canvas so
        // the safe-area bands above the status bar and below the home indicator don't
        // show iOS's default-black .systemBackground bleeding through the WebView.
        // 2026-07 re-skin: #09131C (bluish) -> #0A0A0A (neutral) to match the new palette.
        let bg = UIColor(red: 10.0/255.0, green: 10.0/255.0, blue: 10.0/255.0, alpha: 1.0)
        self.window?.backgroundColor = bg
        self.window?.rootViewController?.view.backgroundColor = bg
        // Drag-to-dismiss the keyboard, the way every native iOS list works.
        // Alex, device-testing 2026-08-23: "when people search for xabi alonso
        // and want to scroll down... the keyboard is in the way. i was thinking
        // the keyboard disappears when they try to scroll. this stuff has to be
        // smooth." WKWebView defaults to .none, so without this line no amount
        // of web-side work matches native feel. Safe here: the .view access
        // above forces the view hierarchy (and the bridge's WKWebView) to load
        // before we reach for its scrollView.
        //
        // ⚠️ .onDrag, NOT .interactive — changed after Alex's build 75 report
        // ("very laggy... like it thinks i stop dragging"). .interactive drags
        // the keyboard WITH the finger and springs it back if you don't pull far
        // enough. Each partial drag fires a full willHide/didHide then
        // willShow/didShow pair at the JS bridge; his log shows NINE such cycles
        // in one session. Every pair rewrote kbInset, which re-rendered the mode
        // and re-bounded the suggestion list mid-gesture. .onDrag dismisses once,
        // decisively, at drag start — one transition, no spring-back, no
        // oscillation for the web layer to chase.
        //
        // Android + PWA get the web-side fallback in useKeyboardAwareInput.js,
        // which is now disabled on native so the two cannot race.
        if let bridgeVC = self.window?.rootViewController as? CAPBridgeViewController {
            bridgeVC.webView?.scrollView.keyboardDismissMode = .onDrag
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // 1.3 Native push (APNs): hand the device token / registration error to the
    // @capacitor/push-notifications plugin, which forwards them to JS listeners.
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

}
