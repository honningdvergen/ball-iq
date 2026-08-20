package app.balliq;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Home-screen widget: the streak flame + today's daily progress.
 *
 * Data flows ONE way: the app pushes {date, done, total, streak} into
 * SharedPreferences via WidgetBridgePlugin whenever daily state changes.
 * The widget itself never computes game state — it only decides how STALE
 * the pushed snapshot is:
 *
 *   snapshot from today     -> "N/M today" + flame  (mirrors the app header)
 *   snapshot from yesterday -> "New puzzles ready"  (the retention hook —
 *                              the streak is alive but today is unplayed)
 *   older / never synced    -> "Play today's puzzles"
 *
 * updatePeriodMillis (hourly, see widget_daily_info.xml) exists ONLY so the
 * date comparison re-runs across midnight without an app open; all real
 * updates arrive via the bridge.
 */
public class DailyWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "biq_widget";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(
                new android.content.ComponentName(context, DailyWidgetProvider.class));
        for (int id : ids) {
            manager.updateAppWidget(id, build(context));
        }
    }

    static RemoteViews build(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String syncedDate = p.getString("date", "");
        int done = p.getInt("done", 0);
        int total = p.getInt("total", 4);
        int streak = p.getInt("streak", 0);

        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily);

        if (today.equals(syncedDate)) {
            views.setTextViewText(R.id.widget_progress, done + "/" + total);
            views.setTextViewText(R.id.widget_label,
                    done >= total ? "Clean sweep — done for today" : "puzzles played today");
        } else if (!syncedDate.isEmpty()) {
            views.setTextViewText(R.id.widget_progress, "0/" + total);
            views.setTextViewText(R.id.widget_label, "New puzzles ready");
        } else {
            views.setTextViewText(R.id.widget_progress, "⚽");
            views.setTextViewText(R.id.widget_label, "Play today's puzzles");
        }

        views.setTextViewText(R.id.widget_streak,
                streak > 0 ? "🔥 " + streak : "🔥 —");

        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                context, 0, launch,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pi);

        return views;
    }
}
