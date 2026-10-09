<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface NavTab {
  id: string
  name: string
  label: string
  path: string
  icon: string
}

const tabs: NavTab[] = [
  {
    id: 'timeline',
    name: 'timeline',
    label: 'روزها',
    path: '/',
    icon: 'days',
  },
  {
    id: 'calendar',
    name: 'calendar',
    label: 'تقویم',
    path: '/calendar',
    icon: 'calendar',
  },
  {
    id: 'lists',
    name: 'lists',
    label: 'لیست‌ها',
    path: '/lists',
    icon: 'lists',
  },
  {
    id: 'goals',
    name: 'goals',
    label: 'اهداف',
    path: '/goals',
    icon: 'goals',
  },
  {
    id: 'settings',
    name: 'settings',
    label: 'تنظیمات',
    path: '/settings',
    icon: 'settings',
  },
]

const route = useRoute()
const router = useRouter()

const activeTabId = computed(() => {
  const currentPath = route.path
  if (currentPath === '/' || currentPath === '/days' || route.name === 'timeline') {
    return 'timeline'
  }
  if (currentPath.startsWith('/calendar')) return 'calendar'
  if (currentPath.startsWith('/lists')) return 'lists'
  if (currentPath.startsWith('/goals')) return 'goals'
  if (currentPath.startsWith('/settings')) return 'settings'
  return 'timeline'
})

function navigateTo(tab: NavTab) {
  if (route.path === tab.path) return
  router.push(tab.path)
}
</script>

<template>
  <nav
    dir="rtl"
    class="relative z-30 w-full flex-shrink-0 border-t border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.06)] select-none"
    role="navigation"
    aria-label="ناوبری اصلی برنامه"
  >
    <div class="mx-auto flex h-16 max-w-lg items-center justify-around px-3 pb-[env(safe-area-inset-bottom,0px)]">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="group relative flex flex-1 flex-col items-center justify-center py-1.5 px-2 transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none"
        :class="activeTabId === tab.id ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'"
        :aria-current="activeTabId === tab.id ? 'page' : undefined"
        @click="navigateTo(tab)"
      >
        <!-- Top active pill indicator -->
        <span
          class="absolute -top-[1px] h-0.5 w-8 rounded-full transition-all duration-300 ease-out"
          :class="activeTabId === tab.id ? 'bg-sky-600 scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'"
        />

        <!-- Icon Container with subtle background when active -->
        <div
          class="relative flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-200"
          :class="activeTabId === tab.id ? 'bg-sky-50 text-sky-600 scale-105' : 'text-slate-400 group-hover:text-slate-600'"
        >
          <!-- 1. روزها (Timeline / Days) -->
          <svg
            v-if="tab.icon === 'days'"
            class="h-5 w-5 transition-transform duration-200"
            :class="activeTabId === tab.id ? 'stroke-[2.2]' : 'stroke-[1.8]'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 14l2 2 4-4"
            />
          </svg>

          <!-- 2. تقویم (Calendar) -->
          <svg
            v-else-if="tab.icon === 'calendar'"
            class="h-5 w-5 transition-transform duration-200"
            :class="activeTabId === tab.id ? 'stroke-[2.2]' : 'stroke-[1.8]'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM8.5 15.5h7"
            />
          </svg>

          <!-- 3. لیست‌ها (Lists) -->
          <svg
            v-else-if="tab.icon === 'lists'"
            class="h-5 w-5 transition-transform duration-200"
            :class="activeTabId === tab.id ? 'stroke-[2.2]' : 'stroke-[1.8]'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>

          <!-- 4. اهداف (Goals) -->
          <svg
            v-else-if="tab.icon === 'goals'"
            class="h-5 w-5 transition-transform duration-200"
            :class="activeTabId === tab.id ? 'stroke-[2.2]' : 'stroke-[1.8]'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="5" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>

          <!-- 4. تنظیمات (Settings) -->
          <svg
            v-else-if="tab.icon === 'settings'"
            class="h-5 w-5 transition-transform duration-200"
            :class="activeTabId === tab.id ? 'stroke-[2.2]' : 'stroke-[1.8]'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <!-- Label -->
        <span
          class="mt-0.5 text-[11px] leading-tight transition-all duration-200"
          :class="activeTabId === tab.id ? 'font-bold text-sky-600 scale-100' : 'font-medium text-slate-400 group-hover:text-slate-600'"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>
