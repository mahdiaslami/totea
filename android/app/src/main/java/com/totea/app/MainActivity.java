package com.totea.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    @CapacitorPlugin(name = "AndroidInsets")
    public static class AndroidInsetsPlugin extends Plugin {
        @PluginMethod
        public void getNavBarHeight(PluginCall call) {
            View decor = getActivity().getWindow().getDecorView();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(decor);
            int navBarHeight = 0;
            if (insets != null) {
                navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            }
            float density = getActivity().getResources().getDisplayMetrics().density;
            JSObject ret = new JSObject();
            ret.put("height", Math.round(navBarHeight / density));
            call.resolve(ret);
        }

        @PluginMethod
        public void minimize(PluginCall call) {
            getActivity().moveTaskToBack(true);
            call.resolve();
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AndroidInsetsPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        View decor = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decor, (v, insets) -> {
            int navBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            float density = getResources().getDisplayMetrics().density;
            int navBarDp = Math.round(navBarHeight / density);

            getBridge().executeOnMainThread(() -> {
                getBridge().getWebView().evaluateJavascript(
                    "window.__ANDROID_NAVBAR_HEIGHT__ = " + navBarDp + ";",
                    null
                );
            });
            return insets;
        });

        decor.post(() -> decor.requestApplyInsets());
    }
}

