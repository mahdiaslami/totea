import { createRouter, createWebHistory } from 'vue-router'
import TimelineView from '../views/TimelineView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'timeline',
      component: TimelineView,
      meta: { index: 0, title: 'روزها' },
    },
    {
      path: '/days',
      redirect: '/',
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../views/CalendarView.vue'),
      meta: { index: 1, title: 'تقویم' },
    },
    {
      path: '/lists',
      name: 'lists',
      component: () => import('../views/ListsView.vue'),
      meta: { index: 2, title: 'لیست‌ها' },
    },
    {
      path: '/lists/:id',
      name: 'list-detail',
      component: () => import('../views/ListDetailView.vue'),
      meta: { index: 2.1, title: 'جزئیات لیست' },
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('../views/GoalsView.vue'),
      meta: { index: 3, title: 'اهداف' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { index: 4, title: 'تنظیمات' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
