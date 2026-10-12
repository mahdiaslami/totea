import { ref, computed, onMounted, onUnmounted, type CSSProperties } from 'vue'
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'
import { Keyboard, type KeyboardInfo } from '@capacitor/keyboard'

interface AndroidInsetsPlugin {
  getNavBarHeight(): Promise<{ height: number }>
}
const AndroidInsets = registerPlugin<AndroidInsetsPlugin>('AndroidInsets')

/**
 * Shared singleton state for keyboard across all components.
 * This prevents multiple listeners from conflicting and ensures
 * zero layout thrashing or stutter.
 */
const keyboardHeight = ref<number>(0)
const isKeyboardOpen = ref<boolean>(false)
const navBarHeight = ref<number>(0)

let activeSubscribers = 0
let listeners: PluginListenerHandle[] = []
let viewportHandler: (() => void) | null = null

async function syncNavBarHeight() {
  if (Capacitor.getPlatform() === 'android') {
    try {
      const res = await AndroidInsets.getNavBarHeight()
      if (res && typeof res.height === 'number') {
        navBarHeight.value = res.height
      }
    } catch {
      // AndroidInsets fallback
    }
    const injected = (window as unknown as { __ANDROID_NAVBAR_HEIGHT__?: number }).__ANDROID_NAVBAR_HEIGHT__
    if (typeof injected === 'number' && injected > 0) {
      navBarHeight.value = injected
    }
  }
}

function computeEffectiveKeyboardHeight(rawHeight: number): number {
  if (rawHeight <= 0) return 0
  const injected = (window as unknown as { __ANDROID_NAVBAR_HEIGHT__?: number }).__ANDROID_NAVBAR_HEIGHT__
  const nav = typeof injected === 'number' && injected > 0 ? injected : navBarHeight.value
  // On Android with virtual navigation bar (3-button navigation),
  // Android's WindowInsetsCompat.Type.ime() is measured from the bottom of the screen,
  // which includes the navigation bar height.
  // Because the WebView bottom sits above the navigation bar, the actual height
  // the keyboard enters into the WebView is (rawHeight - navBarHeight).
  return Math.max(0, rawHeight - nav)
}

function setupNativeListeners() {
  syncNavBarHeight()

  // Listen to keyboardWillShow for immediate, perfectly synchronized animation
  Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
    keyboardHeight.value = computeEffectiveKeyboardHeight(info.keyboardHeight)
    isKeyboardOpen.value = true
  }).then((h) => listeners.push(h))

  Keyboard.addListener('keyboardWillHide', () => {
    keyboardHeight.value = 0
    isKeyboardOpen.value = false
  }).then((h) => listeners.push(h))

  // Backup listeners in case platform emits didShow/didHide
  Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
    const effective = computeEffectiveKeyboardHeight(info.keyboardHeight)
    if (keyboardHeight.value !== effective) {
      keyboardHeight.value = effective
    }
    isKeyboardOpen.value = true
  }).then((h) => listeners.push(h))

  Keyboard.addListener('keyboardDidHide', () => {
    keyboardHeight.value = 0
    isKeyboardOpen.value = false
  }).then((h) => listeners.push(h))
}

function setupWebFallback() {
  if (typeof window === 'undefined' || !window.visualViewport) return

  viewportHandler = () => {
    if (!window.visualViewport) return
    const diff = window.innerHeight - window.visualViewport.height
    // Virtual keyboards usually take > 140px on mobile viewports
    if (diff > 140) {
      keyboardHeight.value = Math.round(diff)
      isKeyboardOpen.value = true
    } else {
      keyboardHeight.value = 0
      isKeyboardOpen.value = false
    }
  }

  window.visualViewport.addEventListener('resize', viewportHandler)
  window.visualViewport.addEventListener('scroll', viewportHandler)
}

function cleanupListeners() {
  listeners.forEach((handle) => {
    try {
      handle.remove()
    } catch {
      // Ignore cleanup error if already detached
    }
  })
  listeners = []

  if (viewportHandler && typeof window !== 'undefined' && window.visualViewport) {
    window.visualViewport.removeEventListener('resize', viewportHandler)
    window.visualViewport.removeEventListener('scroll', viewportHandler)
    viewportHandler = null
  }
}

/**
 * Composable for managing on-screen keyboard without viewport jumps.
 *
 * Core Principles:
 * 1. Capacitor Keyboard.resize = 'none': Avoids native webview viewport resize reflows.
 * 2. GPU Accelerated Transform: Animate ONLY the active elements using `transform: translateY(...)`.
 *    NEVER animate `height` or `padding-bottom` (avoids expensive DOM reflows).
 * 3. Fast-Start Easing (`ease`): Virtual keyboards emerge with high initial velocity.
 *    Using `ease` ensures the translated element outpaces the keyboard edge while hidden,
 *    landing softly when visible.
 */
export function useKeyboard() {
  onMounted(() => {
    activeSubscribers++
    if (activeSubscribers === 1) {
      if (Capacitor.isPluginAvailable('Keyboard') && Capacitor.isNativePlatform()) {
        setupNativeListeners()
      } else {
        setupWebFallback()
      }
    }
  })

  onUnmounted(() => {
    activeSubscribers--
    if (activeSubscribers <= 0) {
      activeSubscribers = 0
      cleanupListeners()
    }
  })

  /**
   * Computed CSS style for elements that need to shift up when keyboard is open.
   * Uses CSS `transform: translateY(...)` with GPU acceleration (`will-change: transform`).
   * Uses `ease` timing function for optimal matching with the keyboard animation curve.
   */
  const keyboardTransformStyle = computed<CSSProperties>(() => {
    const height = keyboardHeight.value
    return {
      transform: height > 0 ? `translate3d(0, -${height}px, 0)` : 'translate3d(0, 0, 0)',
      transition: 'transform 280ms ease',
      willChange: 'transform',
    }
  })

  async function hideKeyboard() {
    if (Capacitor.isPluginAvailable('Keyboard')) {
      try {
        await Keyboard.hide()
      } catch {
        // Fallback for non-native
      }
    }
    // Also blur active element if any
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    keyboardHeight.value = 0
    isKeyboardOpen.value = false
  }

  async function showKeyboard() {
    if (Capacitor.isPluginAvailable('Keyboard')) {
      try {
        await Keyboard.show()
      } catch {
        // Fallback
      }
    }
  }

  return {
    keyboardHeight,
    isKeyboardOpen,
    keyboardTransformStyle,
    hideKeyboard,
    showKeyboard,
  }
}
