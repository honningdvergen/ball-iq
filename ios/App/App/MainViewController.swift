import UIKit
import Capacitor

// Registers the app's own native plugins with the bridge.
//
// ⚠️ Capacitor (6, and still 8) only loads the plugins listed in capacitor.config.json's
// packageClassList, which `cap sync` writes from the npm plugins. A plugin
// that lives in this app target (ShareCardPlugin) is never in that list, so
// its CAP_PLUGIN macro alone does nothing: NativeShareCard.share() rejected
// with "not implemented" and every share fell back to the picture-only
// @capacitor/share path. Messages then got the card with no link to tap
// (Alex, 23 Oct 2026, on build 160).
//
// Same pattern as Capacitor 8's docs for local plugins: a CAPBridgeViewController
// subclass that overrides capacitorDidLoad() and calls registerPluginInstance.
// https://capacitorjs.com/docs/ios/custom-code#register-the-plugin
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ShareCardPlugin())
    }
}
