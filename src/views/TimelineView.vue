<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '../stores/timeline'
import type { PersianDate } from '../modules/timeline/PersianDate'
import type { Task, DayItem } from '../modules/timeline/date'
import DayView from '../components/ui/DayView.vue'
import AddTaskSheet from '../components/ui/AddTaskSheet.vue'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog.vue'
import TaskSelectionToolbar from '../components/ui/TaskSelectionToolbar.vue'

defineOptions({
  name: 'TimelineView',
})

const store = useTimelineStore()
const { days, todayIndex } = storeToRefs(store)

const scrollContainer = ref<HTMLElement | null>(null)
const isSheetOpen = ref(false)
const selectedTargetDate = ref<PersianDate | null>(null)

// Selection mode state
const isSelectionMode = ref(false)
const selectedTaskIds = ref<string[]>([])
const selectionDay = ref<DayItem | null>(null)

// Delete Dialog state
const isDeleteDialogOpen = ref(false)
const tasksToDelete = ref<{ day: DayItem; tasks: Task[] } | null>(null)

// Toast notification for copy
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

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
  if (isSelectionMode.value) return
  const el = getDayElement(index)
  if (!el || !scrollContainer.value) return

  el.scrollIntoView({ behavior, inline: 'start', block: 'nearest' })
}

function goToToday() {
  if (isSelectionMode.value) return
  scrollToDay(todayIndex.value, 'smooth')
}

function goToPrevDay() {
  if (isSelectionMode.value) return
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
  if (isSelectionMode.value) return
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
  if (isSelectionMode.value || !scrollContainer.value || isScrollHandling) return
  isScrollHandling = true

  requestAnimationFrame(() => {
    isScrollHandling = false
    const container = scrollContainer.value
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const containerCenter = containerRect.left + containerRect.width / 2

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
  if (isSelectionMode.value) return
  store.toggleTask(day, taskId)
}

// Selection Mode handlers
function enterSelectionMode(day: DayItem, task: Task) {
  isSelectionMode.value = true
  selectionDay.value = day
  selectedTaskIds.value = [task.id]
}

function handleSelectTask(day: DayItem, task: Task) {
  // If clicked task belongs to a different day, reset selection to this day
  if (!selectionDay.value || selectionDay.value.date.getTime() !== day.date.getTime()) {
    selectionDay.value = day
    selectedTaskIds.value = [task.id]
    return
  }

  const index = selectedTaskIds.value.indexOf(task.id)
  if (index >= 0) {
    selectedTaskIds.value.splice(index, 1)
    // If all tasks are deselected, automatically exit selection mode
    if (selectedTaskIds.value.length === 0) {
      exitSelectionMode()
    }
  } else {
    selectedTaskIds.value.push(task.id)
  }
}

function exitSelectionMode() {
  isSelectionMode.value = false
  selectedTaskIds.value = []
  selectionDay.value = null
}

// Copy action: copies only task title, allowed only when exactly 1 task is selected
const canCopy = computed(() => selectedTaskIds.value.length === 1)

async function handleCopyTask() {
  if (!canCopy.value || !selectionDay.value) return
  const currentTaskId = selectedTaskIds.value[0]
  const task = selectionDay.value.tasks.find((t) => t.id === currentTaskId)
  if (!task) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(task.title)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = task.title
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showToast('متن کار کپی شد')
    exitSelectionMode()
  } catch {
    showToast('خطا در کپی متن')
  }
}

// Delete action from selection toolbar
function handleRequestDeleteFromSelection() {
  if (!selectionDay.value || selectedTaskIds.value.length === 0) return
  const idSet = new Set(selectedTaskIds.value)
  const targetTasks = selectionDay.value.tasks.filter((t) => idSet.has(t.id))
  if (targetTasks.length === 0) return

  tasksToDelete.value = {
    day: selectionDay.value,
    tasks: targetTasks,
  }
  isDeleteDialogOpen.value = true
}

function confirmDeleteTasks() {
  if (!tasksToDelete.value) return
  const taskIds = tasksToDelete.value.tasks.map((t) => t.id)
  store.deleteMultipleTasks(tasksToDelete.value.day, taskIds)
  tasksToDelete.value = null
  exitSelectionMode()
  showToast('کارها حذف شدند')
}

// Floating Add Task logic
const canAddTask = computed(() => {
  const day = days.value[activeDayIndex.value]
  return !!day && !day.date.isPast()
})

function openAddTask(date: PersianDate) {
  if (date.isPast()) return
  selectedTargetDate.value = date
  isSheetOpen.value = true
}

function handleAddTask() {
  const day = days.value[activeDayIndex.value]
  if (!day) return
  openAddTask(day.date)
}

function handleCreateTask(title: string) {
  if (!selectedTargetDate.value) return
  store.addTask(selectedTargetDate.value, title)
}

onMounted(() => {
  nextTick(() => {
    const container = scrollContainer.value
    const todayEl = getDayElement(todayIndex.value)
    if (container && todayEl) {
      todayEl.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' })
    }
    requestAnimationFrame(() => {
      isInitialPositionSet.value = true
    })
  })
})
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none">
    <!-- Horizontal Snap Scroll Container in RTL order -->
    <div
      ref="scrollContainer"
      dir="rtl"
      :class="[
        'flex h-full min-h-0 w-full flex-row overflow-y-hidden transition-opacity duration-150',
        isSelectionMode ? 'overflow-x-hidden' : 'overflow-x-auto snap-x snap-mandatory touch-pan-x',
        isInitialPositionSet ? 'opacity-100 scroll-smooth' : 'opacity-0'
      ]"
      :style="isSelectionMode ? {} : { WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }"
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
          :is-selection-mode="isSelectionMode && selectionDay?.date.getTime() === day.date.getTime()"
          :selected-task-ids="selectionDay?.date.getTime() === day.date.getTime() ? selectedTaskIds : []"
          @toggle="(taskId: string) => handleToggle(day, taskId)"
          @select-task="(t: Task) => handleSelectTask(day, t)"
          @long-press-task="(t: Task) => enterSelectionMode(day, t)"
          @next-day="goToNextDay"
          @prev-day="goToPrevDay"
        />
      </div>
    </div>

    <!-- Floating 'Return to Today' Button (Hidden during Selection Mode) -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-3 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <button
        v-if="!isSelectionMode && !isViewingToday && isInitialPositionSet"
        type="button"
        class="pointer-events-auto absolute bottom-4 left-6 z-30 flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer"
        @click="goToToday"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 6H11a5 5 0 0 0 0 10h7M15 13l3 3-3 3" />
        </svg>
        <span>برگشت به امروز</span>
      </button>
    </Transition>

    <!-- Floating 'Add Task' Button (Hidden during Selection Mode) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <button
        v-if="!isSelectionMode"
        type="button"
        class="pointer-events-auto absolute bottom-4 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:bg-sky-600"
        :disabled="!canAddTask"
        :title="canAddTask ? 'افزودن کار' : 'برای روزهای گذشته نمی‌توان کار افزود'"
        aria-label="افزودن کار"
        @click="handleAddTask"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>افزودن کار</span>
      </button>
    </Transition>

    <!-- Selection Mode Toolbar (Replaces Add Task Button) -->
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0 translate-y-6 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-6 scale-95"
    >
      <TaskSelectionToolbar
        v-if="isSelectionMode"
        :selected-count="selectedTaskIds.length"
        :can-copy="canCopy"
        @copy="handleCopyTask"
        @delete="handleRequestDeleteFromSelection"
        @cancel="exitSelectionMode"
      />
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
      :count="tasksToDelete?.tasks.length || 1"
      :task-title="tasksToDelete?.tasks.length === 1 ? tasksToDelete.tasks[0].title : ''"
      @confirm="confirmDeleteTasks"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-3"
      >
        <div
          v-if="toastMessage"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
