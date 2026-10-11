import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Enable VirtualKeyboard overlaysContent on supported Android WebViews
if (typeof navigator !== 'undefined' && 'virtualKeyboard' in navigator) {
  try {
    // @ts-expect-error VirtualKeyboard API
    navigator.virtualKeyboard.overlaysContent = true
  } catch {
    // Fallback if unsupported
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
