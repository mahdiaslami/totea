# Mobile Keyboard Handling & Layout Shift Elimination Architecture

## 1. Observed Problem and Verified Root Cause

### 1.1 Observed Behavior
On Android mobile devices, when an input field (such as adding/editing a task or creating a list) is focused, the software keyboard opens with a severe visual jump/pop. Instead of a smooth, fluid animation matching the keyboard's entry and exit, the sheet or screen layout shifts abruptly (0ms snap), creating an unpolished experience.

### 1.2 Root Cause Analysis
The jump is caused by a clash between three independent layout systems:
1. **Native Window Resizing (`android:windowSoftInputMode="adjustResize"`)**:
   Under `adjustResize`, Android's native `WindowManager` shrinks the host `BridgeWebView` container in a single step (0ms) the moment input focus occurs. However, the soft keyboard itself takes ~250–300ms to physically animate up into view. The window shrinking happens before the keyboard animation completes, causing an abrupt snap followed by an empty void that the keyboard then slides into.
2. **Double Inset Collision**:
   When the native window shrank and web elements also applied viewport insets or environment variables, elements were pushed up twice or experienced conflicting transform updates.
3. **Focus Timing Collision**:
   Bottom sheets have a slide-up entrance transition (`duration-300 ease-out`). Calling `focus()` immediately during sheet entry forced the Android keyboard to open while the sheet was still mid-flight, compounding layout reflows and stuttering.

---

## 2. Architectural Decision and Rationale

To achieve a 60 FPS smooth transition matching native mobile apps:
- **De-escalate Native OS Layout Shifts**: Set `android:windowSoftInputMode="adjustNothing"` in `AndroidManifest.xml`. Android OS never resizes or pans the WebView container, leaving the viewport completely stable and motionless.
- **Instruct Browser Engine to Overlay**: Keep `interactive-widget=overlays-content` in the viewport meta tag and enable the VirtualKeyboard API overlay flag.
- **Single Source of Truth (`useKeyboard` composable)**: Establish a unified, reactive Vue composable (`src/composables/useKeyboard.ts`) that listens to native `@capacitor/keyboard` events on mobile and gracefully falls back to `visualViewport` and `virtualKeyboard` in browser environments.
- **Coordinated CSS Transition**: Instead of layout reflows, bottom sheets dynamically adapt their bottom padding/insets with a GPU-accelerated transition using Android's Material deceleration curve (`duration-300 cubic-bezier(0.2, 0, 0, 1)`).
- **Staggered Sheet Focus**: Delay `input.focus()` by 260ms until the bottom sheet entrance transition has cleared, ensuring no visual collision between the sheet sliding in and the keyboard sliding up.

---

## 3. Configuration Changes and Implications

### 3.1 `android/app/src/main/AndroidManifest.xml`
- **Changed**: `android:windowSoftInputMode="adjustNothing"` (previously `adjustResize`).
- **Implication**: Android will never abruptly shrink the native WebView view when the keyboard opens. The web application assumes responsibility for elevating any input or bottom sheet above the keyboard.

### 3.2 `capacitor.config.ts`
- **Added**: `@capacitor/keyboard` configuration:
  ```ts
  plugins: {
    Keyboard: {
      resize: KeyboardResize.None,
      resizeOnFullScreen: true,
    },
  }
  ```
- **Implication**: Disables automatic DOM/body resizing by Capacitor on mobile platforms, avoiding conflicting resize styles.

### 3.3 `index.html` & `src/main.ts`
- **Viewport**: `<meta name="viewport" content="... interactive-widget=overlays-content">`
- **VirtualKeyboard API**: `navigator.virtualKeyboard.overlaysContent = true`
- **Implication**: Ensures Chromium WebViews treat the soft keyboard as an overlay layer without shrinking the root document.

---

## 4. Shared Implementation: `useKeyboard` Composable

**Location**: `src/composables/useKeyboard.ts`

### 4.1 Interface
```ts
export interface UseKeyboardReturn {
  /** Reactive boolean indicating whether the software keyboard is currently visible */
  isKeyboardOpen: Readonly<Ref<boolean>>
  /** Height in pixels of the active keyboard (0 when closed) */
  keyboardHeight: Readonly<Ref<number>>
  /** Programmatically dismiss the keyboard and blur active element */
  hideKeyboard: () => Promise<void>
}
```

### 4.2 Lifecycle & Listener Management
- Utilizes singleton reactive state shared across all components to eliminate redundant listeners.
- Uses reference counting (`activeConsumers`) to initialize global listeners on first consumer mount and tear them down when no keyboard-aware components remain mounted.
- Supports native Capacitor runtime via `@capacitor/keyboard` (`keyboardWillShow`, `keyboardDidShow`, `keyboardWillHide`, `keyboardDidHide`).
- Provides automatic web fallback using `window.visualViewport` and `navigator.virtualKeyboard`.

---

## 5. Dependent Components and Screens

The following components contain input fields and implement `useKeyboard`:
1. `src/components/ui/AddTaskSheet.vue`
   - Bottom sheet for adding new timeline/list tasks.
   - Adjusts drawer bottom padding with smooth `cubic-bezier(0.2, 0, 0, 1)` transition.
   - Staggers focus by 260ms.
2. `src/components/ui/EditTaskSheet.vue`
   - Bottom sheet for renaming and editing existing tasks.
   - Uses `useKeyboard` padding and staggered focus.
3. `src/components/ui/ListFormSheet.vue`
   - Bottom sheet for creating/editing custom task lists and schedules.
   - Uses `useKeyboard` with `max-h-[92dvh] overflow-y-auto` to allow full form scrolling even when the keyboard takes up 300+ pixels.

---

## 6. Platform-Specific Behavior and Known Limitations

- **Android 11+ (API 30+)**:
  Native keyboard opens smoothly over the WebView without OS window resize. The web drawer lifts synchronously with the keyboard height.
- **Android older versions (API < 30)**:
  Some older Android WebViews may lack `virtualKeyboard` and dispatch `visualViewport` resize events in a couple of discrete steps. The 300ms CSS transition smooths over discrete step updates.
- **iOS (Safari / WebKit)**:
  `KeyboardResize.None` prevents WebKit from panning the fixed body. Visual viewport changes update `keyboardHeight`.
- **Desktop Browsers**:
  Keyboard height defaults to 0px; address bar/window resizes smaller than 120px are ignored to prevent false positives.

*Distinction*:
- **Verified**: Build compilation, TypeScript types, listener cleanup lifecycle, and CSS transition timing curves.
- **Assumed**: Device-specific vendor keyboards (e.g. Samsung Keyboard, Gboard) dispatch accurate insets through Capacitor/Chromium.

---

## 7. Rules for Implementing Future Keyboard-Aware Screens

When adding new screens or modals that contain inputs or forms:
1. **Never use `100vh` for full-screen layout roots**:
   Use `position: fixed; inset: 0;` (as defined in `src/assets/base.css`) or standard fixed positioning.
2. **Always reuse `useKeyboard()`**:
   Import `useKeyboard` from `@/composables/useKeyboard`. Do not add custom `window.addEventListener('resize')` or ad-hoc keyboard plugins.
3. **Apply smooth transitions on the container**:
   ```vue
   <div
     class="will-change-[padding-bottom] transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
     :style="{
       paddingBottom: keyboardHeight > 0
         ? `calc(${keyboardHeight}px + 1.25rem)`
         : 'max(calc(env(safe-area-inset-bottom, 0px) + 1.5rem), 2rem)'
     }"
   >
   ```
4. **Stagger `focus()` on modal entrance**:
   When showing a modal or bottom sheet with an entrance animation, wait ~260–280ms before calling `element.focus()`.
5. **Dismiss cleanly on close**:
   Call `hideKeyboard()` and blur the active input element when closing the modal.

---

## 8. Approaches Considered and Rejected

1. **Relying on Default `adjustResize`**:
   *Rejected*: Causes native Android window snapping (0ms reflow) before the keyboard animation completes, which is the primary source of the user's reported layout jump.
2. **Using `adjustPan`**:
   *Rejected*: Panning forcefully shifts the entire window up, hiding app headers, status bars, and custom navigation unpredictably.
3. **Hardcoding static bottom margins (e.g., `margin-bottom: 300px`)**:
   *Rejected*: Keyboard heights vary drastically across devices, orientations, languages, and custom keyboard extensions (240px to 380px).
4. **Disabling all CSS animations**:
   *Rejected*: Makes the sheet appear frozen or teleport abruptly rather than flowing naturally with the user interface.

---

## 9. Verification & Testing Steps

1. **Compilation & Type Check**:
   Run `npm run build` / `npm run type-check`.
2. **Bottom Sheet Opening**:
   Open "افزودن کار" (Add Task). Verify that the sheet slides up completely first, and the keyboard then opens without shifting or jumping the background timeline.
3. **Bottom Sheet Height Adjustment**:
   Verify that the input field and action buttons remain fully visible above the keyboard with proper padding.
4. **Keyboard Dismissal**:
   Tap the backdrop, "انصراف", or Android back button. Verify the keyboard dismisses immediately and the sheet either slides down or smoothly returns to resting padding.
5. **Form Scrolling (`ListFormSheet`)**:
   Open "لیست جدید". Ensure that all weekday selector buttons and options remain easily scrollable above the keyboard.

---

## 10. Official References

- [Capacitor Keyboard Plugin Documentation](https://capacitorjs.com/docs/apis/keyboard)
- [W3C VirtualKeyboard API Specification](https://www.w3.org/TR/virtual-keyboard/)
- [MDN Web Docs: VisualViewport API](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
- [Android Developer Guide: WindowSoftInputMode](https://developer.android.com/guide/topics/manifest/activity-element#wsoft)
