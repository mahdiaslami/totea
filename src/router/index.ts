import { createRouter, createWebHistory } from 'vue-router'
import DaysView from '../views/DaysView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DaysView,
    },
  ],
})

export default router
