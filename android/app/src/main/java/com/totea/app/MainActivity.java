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

    private boolean wasImeVisible = false;

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
            new WindowInsetsAnimationCompat.Callback(WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
                @Override
                public void onPrepare(@NonNull WindowInsetsAnimationCompat animation) {
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) {
                        WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decor);
                        wasImeVisible = rootInsets != null && rootInsets.isVisible(WindowInsetsCompat.Type.ime());
                    }
                    super.onPrepare(animation);
                }

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
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) {
                        if (wasImeVisible) {
                            // Keyboard is closing: dispatch hide event IMMEDIATELY so content animates down without delay
                            getBridge().executeOnMainThread(() -> {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.__ANDROID_KEYBOARD_HEIGHT__ = 0; " +
                                    "window.dispatchEvent(new CustomEvent('nativeKeyboardHide'));",
                                    null
                                );
                            });
                        } else {
                            // Keyboard is opening
                            int targetImeHeight = bounds.getUpperBound().bottom;
                            WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decor);
                            int navBarHeight = 0;
                            if (rootInsets != null) {
                                navBarHeight = rootInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                            }
                            float density = getResources().getDisplayMetrics().density;
                            int effectiveDp = Math.max(0, Math.round((targetImeHeight - navBarHeight) / density));

                            // Cold start fix: on very first launch before IME is measured, bounds can be 0.
                            // Fallback to standard 280dp so bottom sheet never drops behind keyboard.
                            if (effectiveDp <= 0) {
                                effectiveDp = 280;
                            }

                            final int finalDp = effectiveDp;
                            getBridge().executeOnMainThread(() -> {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.__ANDROID_KEYBOARD_HEIGHT__ = " + finalDp + "; " +
                                    "window.dispatchEvent(new CustomEvent('nativeKeyboardShow', { detail: { height: " + finalDp + " } }));",
                                    null
                                );
                            });
                        }
                    }
                    return super.onStart(animation, bounds);
                }

                @Override
                public void onEnd(@NonNull WindowInsetsAnimationCompat animation) {
                    super.onEnd(animation);
                    if ((animation.getTypeMask() & WindowInsetsCompat.Type.ime()) != 0) {
                        WindowInsetsCompat rootInsets = ViewCompat.getRootWindowInsets(decor);
                        boolean isVisible = rootInsets != null && rootInsets.isVisible(WindowInsetsCompat.Type.ime());
                        if (!isVisible) {
                            getBridge().executeOnMainThread(() -> {
                                getBridge().getWebView().evaluateJavascript(
                                    "window.__ANDROID_KEYBOARD_HEIGHT__ = 0; " +
                                    "window.dispatchEvent(new CustomEvent('nativeKeyboardHide'));",
                                    null
                                );
                            });
                        } else {
                            int imeHeight = rootInsets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
                            int navBarHeight = rootInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
                            float density = getResources().getDisplayMetrics().density;
                            int exactDp = Math.max(0, Math.round((imeHeight - navBarHeight) / density));
                            if (exactDp > 0) {
                                getBridge().executeOnMainThread(() -> {
                                    getBridge().getWebView().evaluateJavascript(
                                        "window.__ANDROID_KEYBOARD_HEIGHT__ = " + exactDp + "; " +
                                        "window.dispatchEvent(new CustomEvent('nativeKeyboardShow', { detail: { height: " + exactDp + " } }));",
                                        null
                                    );
                                });
                            }
                        }
                    }
                }
            }
        );

        decor.post(() -> decor.requestApplyInsets());
    }
}

