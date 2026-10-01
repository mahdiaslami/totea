<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '../stores/timeline'
import type { PersianDate } from '../modules/timeline/PersianDate'
import type { Task, DayItem } from '../modules/timeline/date'
import DayView from '../components/ui/DayView.vue'
import AddTaskSheet from '../components/ui/AddTaskSheet.vue'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog.vue'

const store = useTimelineStore()
const { days, todayIndex } = storeToRefs(store)

const scrollContainer = ref<HTMLElement | null>(null)
const isSheetOpen = ref(false)
const selectedTargetDate = ref<PersianDate | null>(null)

// Delete Dialog state
const isDeleteDialogOpen = ref(false)
const taskToDelete = ref<{ day: DayItem; task: Task } | null>(null)

// Active day indicator
const activeDayIndex = ref(todayIndex.value)
const isViewingToday = ref(true)
const isInitialPositionSet = ref(false)

let isScrollHandling = false

function getDayElement(index: number): HTMLElement | null {
  if (!scrollContainer.value) return null
  return scrollContainer.value.querySelector<HTMLElement>(`[data-day-index="${index}"]`)
}

function scrollToDay(index: number, behavior: ScrollBehavior = 'smooth') {
  const el = getDayElement(index)
  if (!el || !scrollContainer.value) return

  el.scrollIntoView({ behavior, inline: 'start', block: 'nearest' })
}

function goToToday() {
  scrollToDay(todayIndex.value, 'smooth')
}

function goToPrevDay() {
  // روز قبل (گذشته) -> در چیدمان RTL در سمت راست است (ایندکس کمتر)
  if (activeDayIndex.value > 0) {
    scrollToDay(activeDayIndex.value - 1, 'smooth')
  } else {
    store.prependPast()
    nextTick(() => {
      scrollToDay(Math.max(0, activeDayIndex.value - 1), 'smooth')
    })
  }
}

function goToNextDay() {
  // روز بعد (آینده) -> در چیدمان RTL در سمت چپ است (ایندکس بیشتر)
  if (activeDayIndex.value < days.value.length - 1) {
    scrollToDay(activeDayIndex.value + 1, 'smooth')
  } else {
    store.appendFuture()
    nextTick(() => {
      scrollToDay(activeDayIndex.value + 1, 'smooth')
    })
  }
}

let scrollEndDebounceTimer: ReturnType<typeof setTimeout> | null = null

function onHorizontalScroll() {
  if (!scrollContainer.value || isScrollHandling) return
  isScrollHandling = true

  requestAnimationFrame(() => {
    isScrollHandling = false
    const container = scrollContainer.value
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

    // Find which day card is closest to the center of the viewport
    const dayEls = container.querySelectorAll<HTMLElement>('[data-day-index]')
    let closestIndex = activeDayIndex.value
    let minDistance = Infinity

    dayEls.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const elCenter = rect.left + rect.width / 2
      const dist = Math.abs(containerCenter - elCenter)
      if (dist < minDistance) {
        minDistance = dist
        const idx = Number(el.getAttribute('data-day-index'))
        if (!isNaN(idx)) {
          closestIndex = idx
        }
      }
    })

    if (closestIndex !== activeDayIndex.value) {
      activeDayIndex.value = closestIndex
      isViewingToday.value = (closestIndex === todayIndex.value)
    }

    // Only load more days once scrolling completely settles to prevent jumping during gesture
    if (scrollEndDebounceTimer) clearTimeout(scrollEndDebounceTimer)
    scrollEndDebounceTimer = setTimeout(() => {
      if (closestIndex <= 2) {
        store.prependPast()
      } else if (closestIndex >= days.value.length - 3) {
        store.appendFuture()
      }
    }, 350)
  })
}

function handleToggle(day: DayItem, taskId: string) {
  store.toggleTask(day, taskId)
}

function openAddTask(date: PersianDate) {
  if (date.isPast()) return
  selectedTargetDate.value = date
  isSheetOpen.value = true
}

function handleCreateTask(title: string) {
  if (!selectedTargetDate.value) return
  store.addTask(selectedTargetDate.value, title)
}

function handleRequestDelete(day: DayItem, task: Task) {
  taskToDelete.value = { day, task }
  isDeleteDialogOpen.value = true
}

function confirmDeleteTask() {
  if (!taskToDelete.value) return
  store.deleteTask(taskToDelete.value.day, taskToDelete.value.task.id)
  taskToDelete.value = null
}

onMounted(() => {
  nextTick(() => {
    // Immediately position the scroll on Today without smooth animation
    const container = scrollContainer.value
    const todayEl = getDayElement(todayIndex.value)
    if (container && todayEl) {
      todayEl.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' })
    }
    // Make container visible after initial instant positioning
    requestAnimationFrame(() => {
      isInitialPositionSet.value = true
    })
  })
})
</script>

<template>
  <div class="relative h-screen h-[100dvh] w-full flex-col bg-white overflow-hidden select-none">
    <!-- Horizontal Snap Scroll Container in RTL order:
         - روزهای گذشته در سمت راست (سمت شروع خواندن فارسی)
         - روزهای آینده در سمت چپ (با اسکرول به سمت چپ، فردا و پس‌فردا نمایان می‌شوند)
    -->
    <div
      ref="scrollContainer"
      dir="rtl"
      :class="[
        'flex h-full w-full flex-row overflow-x-auto overflow-y-hidden snap-x snap-mandatory touch-pan-x transition-opacity duration-150',
        isInitialPositionSet ? 'opacity-100 scroll-smooth' : 'opacity-0'
      ]"
      style="-webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;"
      @scroll="onHorizontalScroll"
    >
      <div
        v-for="(day, index) in days"
        :key="day.date.getTime()"
        :data-day-index="index"
        dir="rtl"
        class="h-full w-full min-w-full max-w-full flex-shrink-0 snap-start snap-always"
      >
        <DayView
          :day="day"
          @toggle="(taskId: string) => handleToggle(day, taskId)"
          @request-delete="(t: Task) => handleRequestDelete(day, t)"
          @add-task="openAddTask(day.date)"
          @next-day="goToNextDay"
          @prev-day="goToPrevDay"
        />
      </div>
    </div>

    <!-- Floating 'Return to Today' Button -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <button
        v-if="!isViewingToday && isInitialPositionSet"
        type="button"
        class="pointer-events-auto fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer"
        @click="goToToday"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>برگشت به امروز</span>
      </button>
    </Transition>

    <!-- Bottom Sheet for Adding New Task -->
    <AddTaskSheet
      v-model="isSheetOpen"
      :target-date="selectedTargetDate"
      @submit="handleCreateTask"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="isDeleteDialogOpen"
      :task-title="taskToDelete?.task.title"
      @confirm="confirmDeleteTask"
    />
  </div>
</template>
