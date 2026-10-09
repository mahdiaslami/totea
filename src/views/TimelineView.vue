<script setup lang="ts">
import { ref, computed, watch, onMounted, onActivated, onDeactivated, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTimelineStore, BUFFER_DAYS, CENTER_INDEX } from '../stores/timeline'
import { PersianDate } from '../modules/timeline/PersianDate'
import type { Task, DayItem } from '../modules/timeline/date'
import DayView from '../components/ui/DayView.vue'
import AddTaskSheet from '../components/ui/AddTaskSheet.vue'
import EditTaskSheet from '../components/ui/EditTaskSheet.vue'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog.vue'
import TaskSelectionToolbar from '../components/ui/TaskSelectionToolbar.vue'

defineOptions({
  name: 'TimelineView',
})

const router = useRouter()
const store = useTimelineStore()
const { days } = storeToRefs(store)

function handleOpenCalendar(date: PersianDate) {
  store.setActiveDate(date)
  router.push('/calendar')
}

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

// Active day indicator synced with store
const initialActiveIndex = computed(() => {
  const found = days.value.findIndex(
    (d) => d.date.getTime() === store.activeDateTimestamp
  )
  return found !== -1 ? found : CENTER_INDEX
})

const activeDayIndex = ref(initialActiveIndex.value)
const isViewingToday = computed(() => {
  const current = days.value[activeDayIndex.value]
  if (!current) return false
  return current.date.isToday()
})
const isInitialPositionSet = ref(false)
const isComponentActive = ref(true)
const isRestoring = ref(false)

let restoreTimer: ReturnType<typeof setTimeout> | null = null
let targetDayIndex: number | null = null

// Keep activeDayIndex aligned if active timestamp changes in store
watch(
  () => store.activeDateTimestamp,
  (newTs) => {
    const idx = days.value.findIndex((d) => d.date.getTime() === newTs)
    if (idx !== -1 && idx !== activeDayIndex.value) {
      activeDayIndex.value = idx
    }
  }
)

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

function cancelRestoreTimer() {
  if (restoreTimer) {
    clearTimeout(restoreTimer)
    restoreTimer = null
  }
  targetDayIndex = null
  isRestoring.value = false
}

function restoreScrollPosition(behavior: ScrollBehavior = 'instant') {
  isRestoring.value = true

  nextTick(() => {
    const container = scrollContainer.value
    if (!container) {
      isRestoring.value = false
      return
    }

    // Locate target index: match activeDateTimestamp in days
    let targetIndex = days.value.findIndex(
      (d) => d.date.getTime() === store.activeDateTimestamp
    )
    if (targetIndex === -1) {
      targetIndex = activeDayIndex.value >= 0 && activeDayIndex.value < days.value.length ? activeDayIndex.value : CENTER_INDEX
    }

    activeDayIndex.value = targetIndex
    // activeIdx = targetIndex
    store.setActiveDayIndex(targetIndex)

    const targetEl = getDayElement(targetIndex)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior, inline: 'start', block: 'nearest' })
    }

    if (restoreTimer) clearTimeout(restoreTimer)
    restoreTimer = setTimeout(() => {
      restoreTimer = null
      if (isComponentActive.value && scrollContainer.value) {
        const el = getDayElement(activeDayIndex.value)
        if (el) {
          el.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' })
          alignDayExact(activeDayIndex.value)
        }
      }
      isRestoring.value = false
    }, 250)
  })
}

function updateActiveDayFromScroll(): number {
  const container = scrollContainer.value
  if (!container) return activeDayIndex.value

  const containerRect = container.getBoundingClientRect()
  if (containerRect.width === 0) return activeDayIndex.value

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
    store.setActiveDayIndex(closestIndex)
  }

  if (targetDayIndex !== null && closestIndex === targetDayIndex) {
    targetDayIndex = null
  }

  return closestIndex
}

function alignDayExact(index: number) {
  const container = scrollContainer.value
  const el = getDayElement(index)
  if (!container || !el) return

  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const diff = elRect.left - containerRect.left

  if (Math.abs(diff) > 0.5) {
    container.scrollBy({ left: diff, behavior: 'instant' })
  }
}

function onHorizontalScroll() {
  if (!isComponentActive.value || isRestoring.value || isSelectionMode.value || !scrollContainer.value) return

  updateActiveDayFromScroll()
}

// When native scrollend fires (animation ends and lands on day), adjust days to maintain 7 before and 7 after
function onScrollEnd() {
  if (!isComponentActive.value || isRestoring.value || isSelectionMode.value || !scrollContainer.value) return

  const currentIdx = updateActiveDayFromScroll()
  const currentDay = days.value[currentIdx]
  if (!currentDay) return

  // Recenter window around currentDay so that 7 days before and 7 days after are always available
  if (currentIdx !== CENTER_INDEX || days.value.length !== 15) {
    store.recenterAroundDate(currentDay.date)
    nextTick(() => {
      activeDayIndex.value = CENTER_INDEX
      scrollToDay(CENTER_INDEX, 'instant')
      alignDayExact(CENTER_INDEX)
    })
  }
}

// Return to Today with smooth direction-aware scroll and guaranteed preparation of pages
function goToToday() {
  if (isSelectionMode.value) return
  cancelRestoreTimer()

  const today = PersianDate.startOfDay(PersianDate.today())
  const currentDay = days.value[activeDayIndex.value]
  if (!currentDay) return

  if (currentDay.date.isToday()) return

  const isFuture = currentDay.date.getTime() > today.getTime()
  const foundTodayIndex = days.value.findIndex((d) => d.date.isToday())

  if (foundTodayIndex !== -1) {
    // Today is already in the currently loaded window
    targetDayIndex = foundTodayIndex
    scrollToDay(foundTodayIndex, 'smooth')
    return
  }

  isRestoring.value = true

  const baseDays: DayItem[] = []
  for (let offset = -BUFFER_DAYS; offset <= BUFFER_DAYS; offset++) {
    const d = PersianDate.addDays(today, offset)
    baseDays.push({
      date: d,
      tasks: store.getTasksForDate(d),
    })
  }

  let startIndex = CENTER_INDEX

  if (isFuture) {
    baseDays[CENTER_INDEX + 1] = {
      date: currentDay.date,
      tasks: currentDay.tasks,
    }
    startIndex = CENTER_INDEX + 1 // index 8
  } else {
    baseDays[CENTER_INDEX - 1] = {
      date: currentDay.date,
      tasks: currentDay.tasks,
    }
    startIndex = CENTER_INDEX - 1 // index 6
  }

  store.setTransitionDays(baseDays, startIndex)
  activeDayIndex.value = startIndex

  nextTick(() => {
    const startEl = getDayElement(startIndex)
    if (startEl) {
      startEl.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' })
      alignDayExact(startIndex)
    }

    requestAnimationFrame(() => {
      isRestoring.value = false
      targetDayIndex = CENTER_INDEX
      scrollToDay(CENTER_INDEX, 'smooth')

      // Settle fallback after smooth scroll finishes (~380ms)
      if (restoreTimer) clearTimeout(restoreTimer)
      restoreTimer = setTimeout(() => {
        restoreTimer = null
        targetDayIndex = null

        // Restore normal days around today
        store.setWindowAroundDate(today)
        nextTick(() => {
          activeDayIndex.value = CENTER_INDEX
          store.setActiveDayIndex(CENTER_INDEX)
          alignDayExact(CENTER_INDEX)
        })
      }, 420)
    })
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

// Edit action: allowed only when exactly 1 task is selected
const canEdit = computed(() => selectedTaskIds.value.length === 1)
const isEditSheetOpen = ref(false)
const taskToEdit = ref<Task | null>(null)

function handleOpenEditTask() {
  if (!canEdit.value || !selectionDay.value) return
  const currentTaskId = selectedTaskIds.value[0]
  const task = selectionDay.value.tasks.find((t) => t.id === currentTaskId)
  if (!task) return
  taskToEdit.value = task
  isEditSheetOpen.value = true
}

function handleConfirmEditTask(newTitle: string) {
  if (!selectionDay.value || !taskToEdit.value) return
  store.updateTask(selectionDay.value, taskToEdit.value.id, newTitle)
  taskToEdit.value = null
  exitSelectionMode()
  showToast('کار ویرایش شد')
}

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
  isComponentActive.value = true
  nextTick(() => {
    restoreScrollPosition('instant')
    requestAnimationFrame(() => {
      isInitialPositionSet.value = true
    })
  })
})

onActivated(() => {
  isComponentActive.value = true
  restoreScrollPosition('instant')
})

onBeforeRouteLeave(() => {
  isComponentActive.value = false
  cancelRestoreTimer()
})

onDeactivated(() => {
  isComponentActive.value = false
  cancelRestoreTimer()
})

onBeforeUnmount(() => {
  isComponentActive.value = false
  cancelRestoreTimer()
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
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
        isInitialPositionSet ? 'opacity-100' : 'opacity-0',
        !isRestoring && isInitialPositionSet ? 'scroll-smooth' : ''
      ]"
      :style="isSelectionMode ? {} : { WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }"
      @scroll="onHorizontalScroll"
      @scrollend="onScrollEnd"
      @touchstart="cancelRestoreTimer"
      @pointerdown="cancelRestoreTimer"
    >
      <div
        v-for="(day, index) in days"
        :key="day.date.formatJalali()"
        :data-day-index="index"
        :data-day-time="day.date.getTime()"
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
          @open-calendar="handleOpenCalendar"
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
        :can-edit="canEdit"
        @copy="handleCopyTask"
        @edit="handleOpenEditTask"
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

    <!-- Bottom Sheet for Editing Existing Task -->
    <EditTaskSheet
      v-model="isEditSheetOpen"
      :task="taskToEdit"
      :target-date="selectionDay?.date || null"
      @submit="handleConfirmEditTask"
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
