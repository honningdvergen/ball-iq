import Foundation
import Capacitor
import UIKit

// Sprint #98: share-card sheet with a per-target text item.
//
// Why this exists: @capacitor/share builds a flat activityItems array. When
// that array contains BOTH an image file and a text item, Snapchat's share
// extension fails to launch entirely (its NSExtensionActivationRule rejects
// the multi-item payload — observed on device: the Share.share() call never
// completes and Snapchat never opens). File-only payloads work everywhere
// but lose the "can you beat me? + link" line under the card in iMessage.
//
// The native answer is UIActivityItemSource: the text item can decide, per
// share target, whether to provide itself. We withhold the text for targets
// known to choke on multi-item payloads and provide it everywhere else.
// iMessage: card + tappable challenge line. Snapchat: card only.

private class OptionalTextItem: NSObject, UIActivityItemSource {
    private let text: String

    // Targets whose share extensions reject text+image multi-item payloads.
    // Extend if device testing surfaces more (each entry = that target gets
    // the image only, which every image-capable extension accepts).
    private static let withheldFrom: Set<String> = [
        "com.toyopagroup.picaboo.share", // Snapchat
    ]

    init(_ text: String) { self.text = text }

    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController) -> Any {
        return text
    }

    func activityViewController(_ activityViewController: UIActivityViewController,
                                itemForActivityType activityType: UIActivity.ActivityType?) -> Any? {
        guard let raw = activityType?.rawValue else { return text }
        return OptionalTextItem.withheldFrom.contains(raw) ? nil : text
    }
}

@objc(ShareCardPlugin)
public class ShareCardPlugin: CAPPlugin {

    @objc func share(_ call: CAPPluginCall) {
        guard let fileUrlString = call.getString("fileUrl"),
              let fileUrl = URL(string: fileUrlString) else {
            call.reject("fileUrl is required")
            return
        }
        let text = call.getString("text") ?? ""

        var items: [Any] = [fileUrl]
        if !text.isEmpty {
            items.append(OptionalTextItem(text))
        }

        DispatchQueue.main.async { [weak self] in
            guard let viewController = self?.bridge?.viewController else {
                call.reject("no view controller")
                return
            }
            let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
            sheet.completionWithItemsHandler = { activityType, completed, _, error in
                if let error = error {
                    call.reject(error.localizedDescription)
                    return
                }
                call.resolve([
                    "activityType": activityType?.rawValue ?? "",
                    "completed": completed,
                ])
            }
            // iPhone-only app, but anchor defensively for any future iPad use.
            sheet.popoverPresentationController?.sourceView = viewController.view
            viewController.present(sheet, animated: true, completion: nil)
        }
    }
}
