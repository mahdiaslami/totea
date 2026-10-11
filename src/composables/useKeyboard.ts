import { ref, readonly, onMounted, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Keyboard, type KeyboardInfo } from '@capacitor/keyboard'

// Singleton reactive keyboard state shared across the app
const isKeyboardOpen = ref(false)
const keyboardHeight = ref(0)
const isInitialized = ref(false)

let activeConsumers = 0
let cleanupCallbacks: Array<() => void> = []

function updateKeyboardState(open: boolean, height: number) {
  isKeyboardOpen.value = open
  keyboardHeight.value = Math.max(0, Math.round(height))
}

function setupNativeListeners() {
  const handles: Array<Promise<{ remove: () => Promise<void> }>> = []

  handles.push(
    Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
      updateKeyboardState(true, info.keyboardHeight)
    })
  )

  handles.push(
    Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
      updateKeyboardState(true, info.keyboardHeight)
    })
  )

  handles.push(
    Keyboard.addListener('keyboardWillHide', () => {
      updateKeyboardState(false, 0)
    })
  )

  handles.push(
    Keyboard.addListener('keyboardDidHide', () => {
      updateKeyboardState(false, 0)
    })
  )

  return () => {
    handles.forEach(async (h) => {
      try {
        const handle = await h
        await handle.remove()
      } catch {
        // Ignore removal error on teardown
      }
    })
  }
}

function setupWebListeners() {
  const listeners: Array<() => void> = []

  // 1. VirtualKeyboard API (Modern Chromium / Android WebView)
  if (typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator) {
    const vk = (navigator as unknown as { virtualKeyboard: EventTarget & { boundingRect: DOMRect } }).virtualKeyboard
    const handleGeometry = () => {
      const rect = vk.boundingRect
      if (rect && rect.height > 50) {
        updateKeyboardState(true, rect.height)
      } else {
        updateKeyboardState(false, 0)
      }
    }
    vk.addEventListener('geometrychange', handleGeometry)
    listeners.push(() => vk.removeEventListener('geometrychange', handleGeometry))
  }

  // 2. Visual Viewport API fallback (Supported across all modern browsers)
  if (typeof window !== 'undefined' && window.visualViewport) {
    const vp = window.visualViewport

    const handleResize = () => {
      const currentHeight = vp.height
      const heightDiff = window.innerHeight - currentHeight
      // Filter out small browser URL bar resizes (< 120px)
      if (heightDiff > 120) {
        updateKeyboardState(true, heightDiff)
      } else {
        updateKeyboardState(false, 0)
      }
    }

    const handleOrientation = () => {
      handleResize()
    }

    vp.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientation)

    listeners.push(() => {
      vp.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientation)
    })
  }

  return () => {
    listeners.forEach((clean) => clean())
  }
}

function initializeGlobalListeners() {
  if (isInitialized.value) return
  isInitialized.value = true

  if (Capacitor.isNativePlatform()) {
    cleanupCallbacks.push(setupNativeListeners())
  } else {
    cleanupCallbacks.push(setupWebListeners())
  }
}

function tearDownGlobalListeners() {
  if (!isInitialized.value) return
  cleanupCallbacks.forEach((cb) => cb())
  cleanupCallbacks = []
  isInitialized.value = false
  updateKeyboardState(false, 0)
}

/**
 * Universal keyboard management composable.
 * Provides reactive keyboard metrics and methods for smooth animation coordination.
 */
export function useKeyboard() {
  onMounted(() => {
    activeConsumers++
    initializeGlobalListeners()
  })

  onUnmounted(() => {
    activeConsumers = Math.max(0, activeConsumers - 1)
    if (activeConsumers === 0) {
      tearDownGlobalListeners()
    }
  })

  const hideKeyboard = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide()
      } catch {
        // Fallback to activeElement blur
      }
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  return {
    isKeyboardOpen: readonly(isKeyboardOpen),
    keyboardHeight: readonly(keyboardHeight),
    hideKeyboard,
  }
}
