package com.totea.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsAnimationCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

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

        ViewCompat.setWindowInsetsAnimationCallback(
            decor,
            new WindowInsetsAnimationCompat.Callback(WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_STOP) {
                @NonNull
                @Override
                public WindowInsetsCompat onProgress(
                    @NonNull WindowInsetsCompat insets,
                    @NonNull List<WindowInsetsAnimationCompat> runningAnimations
                ) {
                    return insets;
                }

                @NonNull
                @Override
                public WindowInsetsAnimationCompat.BoundsCompat onStart(
                    @NonNull WindowInsetsAnimationCompat animation,
                    @NonNull WindowInsetsAnimationCompat.BoundsCompat bounds
                ) {
                    int targetImeHeight = bounds.getUpperBound().bottom;
                    WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decor);
                    int navBarHeight = 0;
                    if (rootInsets != null) {
                        navBarHeight = rootInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                    }
                    float density = getResources().getDisplayMetrics().density;
                    int effectiveDp = Math.max(0, Math.round((targetImeHeight - navBarHeight) / density));

                    if (effectiveDp > 0) {
                        getBridge().executeOnMainThread(() -> {
                            getBridge().getWebView().evaluateJavascript(
                                "window.__ANDROID_KEYBOARD_HEIGHT__ = " + effectiveDp + "; " +
                                "window.dispatchEvent(new CustomEvent('nativeKeyboardShow', { detail: { height: " + effectiveDp + " } }));",
                                null
                            );
                        });
                    }
                    return super.onStart(animation, bounds);
                }

                @Override
                public void onEnd(@NonNull WindowInsetsAnimationCompat animation) {
                    super.onEnd(animation);
                    WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decor);
                    if (rootInsets != null && !rootInsets.isVisible(WindowInsetsCompat.Type.ime())) {
                        getBridge().executeOnMainThread(() -> {
                            getBridge().getWebView().evaluateJavascript(
                                "window.__ANDROID_KEYBOARD_HEIGHT__ = 0; " +
                                "window.dispatchEvent(new CustomEvent('nativeKeyboardHide'));",
                                null
                            );
                        });
                    }
                }
            }
        );

        decor.post(() -> decor.requestApplyInsets());
    }
}

