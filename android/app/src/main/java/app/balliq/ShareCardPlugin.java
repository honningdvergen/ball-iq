package app.balliq;

import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

/**
 * The share card with its link, the Android half of ios/App/App/ShareCardPlugin.
 *
 * The JS side (App.jsx shareCard) calls ShareCard.share({ fileUrl, text }) with
 * the PNG it wrote to the cache. Until 23 Oct 2026 this plugin existed only on
 * iOS, so on Android the call failed and the share fell back to the picture
 * alone: a friend got the card and nothing to tap.
 *
 * One send intent carries the image and the challenge line with its link.
 * Snapchat is handed the image only (EXTRA_REPLACEMENT_EXTRAS), the same rule
 * as on iOS, where its extension refuses an image and text together.
 */
@CapacitorPlugin(name = "ShareCard")
public class ShareCardPlugin extends Plugin {

    private static final String SNAPCHAT = "com.snapchat.android";

    @PluginMethod
    public void share(PluginCall call) {
        String fileUrl = call.getString("fileUrl");
        if (fileUrl == null || fileUrl.isEmpty()) {
            call.reject("fileUrl is required");
            return;
        }
        String text = call.getString("text", "");
        try {
            File file = new File(Uri.parse(fileUrl).getPath());
            Uri uri = FileProvider.getUriForFile(getContext(),
                    getContext().getPackageName() + ".fileprovider", file);

            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("image/png");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.setClipData(ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (!text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);

            Intent chooser = Intent.createChooser(send, null);
            if (!text.isEmpty()) {
                Bundle imageOnly = new Bundle();
                imageOnly.putString(Intent.EXTRA_TEXT, null);
                Bundle replacements = new Bundle();
                replacements.putBundle(SNAPCHAT, imageOnly);
                chooser.putExtra(Intent.EXTRA_REPLACEMENT_EXTRAS, replacements);
            }
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(chooser);

            // Android does not report which app was picked, or whether the
            // sheet was dismissed; resolving here is what @capacitor/share does.
            JSObject ret = new JSObject();
            ret.put("activityType", "");
            ret.put("completed", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(e.getMessage() != null ? e.getMessage() : "share failed");
        }
    }
}
