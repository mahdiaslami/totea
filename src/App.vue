<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import BottomNavigation from './components/ui/BottomNavigation.vue'

const router = useRouter()
const transitionName = ref('swipe-to-left')

const tabIndices: Record<string, number> = {
  timeline: 0,
  calendar: 1,
  goals: 2,
  settings: 3,
}

router.beforeEach((to, from) => {
  const fromIndex = tabIndices[from.name as string] ?? (from.meta?.index as number) ?? 0
  const toIndex = tabIndices[to.name as string] ?? (to.meta?.index as number) ?? 0

  if (toIndex === fromIndex) {
    transitionName.value = 'fade'
  } else if (toIndex > fromIndex) {
    // In Persian RTL layout: Tab 0 (روزها) is on the right, Tab 3 (تنظیمات) is on the left.
    // Moving from 0 to 1/2/3 moves attention leftward.
    transitionName.value = 'swipe-to-left'
  } else {
    // Moving towards lower indices moves attention rightward.
    transitionName.value = 'swipe-to-right'
  }
})
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none font-default">
    <!-- Main Content Area where views swipe smoothly -->
    <main class="relative flex-1 min-h-0 w-full overflow-hidden">
      <RouterView v-slot="{ Component, route }">
        <Transition :name="transitionName">
          <KeepAlive :include="['TimelineView', 'CalendarView', 'GoalsView', 'SettingsView']">
            <component :is="Component" :key="route.name || route.path" class="h-full w-full" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>

    <!-- Persistent Bottom Navigation Bar -->
    <BottomNavigation />
  </div>
</template>

<style>
/* Smooth swipe animations between pages */
.swipe-to-left-enter-active,
.swipe-to-left-leave-active,
.swipe-to-right-enter-active,
.swipe-to-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.28s ease;
  will-change: transform, opacity;
}

/* Navigating to the left (higher tab index in RTL):
   New page slides in from the left, previous page slides out to the right */
.swipe-to-left-enter-from {
  transform: translate3d(-100%, 0, 0);
  opacity: 0.95;
}
.swipe-to-left-leave-to {
  transform: translate3d(100%, 0, 0);
  opacity: 0.95;
}

/* Navigating to the right (lower tab index in RTL):
   New page slides in from the right, previous page slides out to the left */
.swipe-to-right-enter-from {
  transform: translate3d(100%, 0, 0);
  opacity: 0.95;
}
.swipe-to-right-leave-to {
  transform: translate3d(-100%, 0, 0);
  opacity: 0.95;
}

/* Fallback fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
