import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { register } from 'swiper/element/bundle'

register()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
