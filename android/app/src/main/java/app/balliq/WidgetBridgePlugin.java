package app.balliq;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * The one-way door between the web app and DailyWidgetProvider. The JS side
 * (src/lib/widgetBridge.js) calls update() whenever streak/daily state
 * changes; we persist the snapshot and repaint every placed widget.
 * Deliberately tiny: no reads, no callbacks, nothing the widget could use
 * to reach back into app state.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences.Editor e = ctx
                .getSharedPreferences(DailyWidgetProvider.PREFS, Context.MODE_PRIVATE)
                .edit();
        e.putString("date", call.getString("date", ""));
        e.putInt("done", call.getInt("done", 0));
        e.putInt("total", call.getInt("total", 4));
        e.putInt("streak", call.getInt("streak", 0));
        e.apply();
        DailyWidgetProvider.updateAll(ctx);
        call.resolve();
    }
}
