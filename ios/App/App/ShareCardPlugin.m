#import <Capacitor/Capacitor.h>

// Registers ShareCardPlugin with the Capacitor bridge under the JS name
// "ShareCard". See ShareCardPlugin.swift for why this plugin exists.
CAP_PLUGIN(ShareCardPlugin, "ShareCard",
  CAP_PLUGIN_METHOD(share, CAPPluginReturnPromise);
)
