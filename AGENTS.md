# Agent Instructions & Project Conventions

## Software Keyboard Handling (Android & Mobile Web)

When working on forms, inputs, modals, or sheets that interact with the software keyboard, follow these established architectural rules:

### Core Rules & Shared Abstraction
- **Always reuse `useKeyboard()`**: Import from `@/composables/useKeyboard`. Do not add custom resize listeners or re-implement keyboard height detection.
- **Never change `android:windowSoftInputMode="adjustNothing"`** in `android/app/src/main/AndroidManifest.xml` without understanding that `adjustResize` or `adjustPan` re-introduces the Android native 0ms window jump/snap bug.
- **Do not modify the viewport meta** `interactive-widget=overlays-content` in `index.html`.
- **Do not modify Capacitor Keyboard resize mode**: It is configured as `KeyboardResize.None` in `capacitor.config.ts`.

### Modal & Bottom Sheet Guidelines
- **Stagger input focus**: When displaying an animated bottom sheet or modal, delay `input.focus()` by ~260ms until the entrance transition has finished to prevent collision between the sheet animation and the keyboard opening.
- **Apply smooth transition**: Adapt bottom padding dynamically using:
  ```vue
  class="will-change-[padding-bottom] transition-[padding-bottom] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
  :style="{
    paddingBottom: keyboardHeight > 0
      ? `calc(${keyboardHeight}px + 1.25rem)`
      : 'max(calc(env(safe-area-inset-bottom, 0px) + 1.5rem), 2rem)'
  }"
  ```
- **Clean dismissal**: Always call `hideKeyboard()` and blur the active input element when closing a sheet or modal.
- **Scroll containment**: For tall forms, ensure `max-h-[92dvh] overflow-y-auto` is set so content remains scrollable when the keyboard occupies screen space.

### Prohibited Patterns
- Prohibited: Changing `html, body` from `position: fixed; inset: 0;` to `height: 100vh` or unconstrained body scrolling.
- Prohibited: Hardcoding static keyboard pixel offsets (e.g. `margin-bottom: 280px`).
- Prohibited: Adding redundant `window.addEventListener('resize')` inside components for keyboard detection.

### Technical Documentation
For full architectural details, rationale, and platform notes, refer to `docs/keyboard-handling.md`.
