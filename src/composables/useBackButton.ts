import { App } from '@capacitor/app'
import { registerPlugin } from '@capacitor/core'
import type { Router } from 'vue-router'

interface AndroidInsetsPlugin {
  minimize?(): Promise<void>
}
const AndroidInsets = registerPlugin<AndroidInsetsPlugin>('AndroidInsets')

export async function sendAppToBackground(): Promise<void> {
  try {
    if (AndroidInsets && typeof AndroidInsets.minimize === 'function') {
      await AndroidInsets.minimize()
      return
    }
  } catch (err) {
    console.warn('AndroidInsets.minimize error:', err)
  }

  // Fallback if minimize plugin method is unavailable
  try {
    await App.exitApp()
  } catch {
    // noop
  }
}

export type BackHandler = () => boolean | Promise<boolean>

const backHandlers: BackHandler[] = []

/**
 * Register a contextual back button handler (e.g., closing open bottom sheets, dialogs, or exiting selection mode).
 * Handlers are evaluated in LIFO (last in, first out) order.
 * Return true if the event was handled and consumed, false to allow default navigation.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler)
  return () => {
    const idx = backHandlers.indexOf(handler)
    if (idx !== -1) {
      backHandlers.splice(idx, 1)
    }
  }
}

export function isDaysRoute(path: string, name?: string | symbol | null): boolean {
  return path === '/' || path === '/days' || name === 'timeline'
}

export const MAIN_TAB_PATHS = ['/calendar', '/lists', '/goals', '/settings']

export function isOtherMainTabRoute(path: string, name?: string | symbol | null): boolean {
  if (name === 'list-detail') return false
  return MAIN_TAB_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

let isInitialized = false

/**
 * Initialize native Android hardware back button and gesture listener via Capacitor App plugin.
 */
export function setupBackButton(router: Router): void {
  if (isInitialized) return
  isInitialized = true

  try {
    App.addListener('backButton', async () => {
      await triggerBack(router)
    })
  } catch (err) {
    console.warn('Capacitor App.addListener backButton not available on this platform:', err)
  }
}

/**
 * Executes the back logic:
 * 1. Checks active contextual handlers (closing modals, sheets, selection modes).
 * 2. If on Days page ('/'), exits the app.
 * 3. If on any other bottom navigation tab ('/calendar', '/lists', '/goals', '/settings'), returns directly to Days ('/').
 * 4. If in a sub-route (e.g. '/lists/:id'), navigates back in route history towards Days.
 */
export async function triggerBack(router: Router): Promise<void> {
  // 1. Check registered modal / sheet / selection handlers in reverse order (LIFO)
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    const handler = backHandlers[i]
    try {
      const consumed = await handler()
      if (consumed) {
        return
      }
    } catch (err) {
      console.error('Error in contextual back handler:', err)
    }
  }

  // 2. Route-based back navigation
  const currentRoute = router.currentRoute.value
  const path = currentRoute.path
  const name = currentRoute.name

  // A. If already on the Days page (timeline / '/'), send the app to the background (minimize)
  if (isDaysRoute(path, name)) {
    await sendAppToBackground()
    return
  }

  // B. If on any other bottom navigation tab, return directly to Days page without cycling tabs
  if (isOtherMainTabRoute(path, name)) {
    router.replace('/')
    return
  }

  // C. If in a nested / detail page (such as /lists/:id), go back in route history
  const hasHistory = typeof window !== 'undefined' && window.history?.state?.back
  if (hasHistory) {
    router.back()
  } else {
    // Fallback if opened directly without prior history
    if (name === 'list-detail') {
      router.replace('/lists')
    } else {
      router.replace('/')
    }
  }
}
