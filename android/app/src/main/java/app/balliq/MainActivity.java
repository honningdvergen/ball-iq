package app.balliq;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugin: the widget bridge (registerPlugin must run BEFORE
        // super.onCreate, per Capacitor's custom-plugin contract).
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
        // No scroll bar, the same as iOS (AppDelegate.swift, 2026-10-08).
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setVerticalScrollBarEnabled(false);
            getBridge().getWebView().setHorizontalScrollBarEnabled(false);
        }
    }
}
