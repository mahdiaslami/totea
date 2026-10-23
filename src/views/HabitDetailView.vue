<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useHabitsStore,
  WEEKDAYS_MAP,
  type Habit,
  type HabitTask,
  type HabitPeriod,
} from '@/stores/habits'
import { toPersianDigits } from '@/modules/timeline/PersianDate'
import texturePatternImg from '@/assets/images/Texture-01-xs-blue.png'
import thinkingCharacterImg from '@/assets/images/thinking_character_01.png'
import AddTaskSheet from '@/components/ui/AddTaskSheet.vue'
import EditTaskSheet from '@/components/ui/EditTaskSheet.vue'
import HabitFormSheet from '@/components/ui/HabitFormSheet.vue'
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog.vue'
import TaskSelectionToolbar from '@/components/ui/TaskSelectionToolbar.vue'
import { registerBackHandler } from '@/composables/useBackButton'

defineOptions({
  name: 'HabitDetailView',
})

const route = useRoute()
const router = useRouter()
const habitsStore = useHabitsStore()

const habitId = computed(() => route.params.id as string)

const activeHabit = computed<Habit | null>(() => {
  if (!habitId.value) return null
  return habitsStore.habits.find((h) => h.id === habitId.value) || null
})

// If habit not found, redirect to habits list
function verifyHabit() {
  if (!activeHabit.value && habitsStore.habits.length > 0) {
    router.replace('/habits')
  }
}

onMounted(() => {
  verifyHabit()
})

watch(
  () => activeHabit.value,
  (val) => {
    if (!val && habitsStore.habits.length > 0) {
      router.replace('/habits')
    }
  }
)

// Sub-navigation for Weekly & Monthly habits
const selectedWeekday = ref<number>(6) // Starts with شنبه (6)
const selectedMonthDay = ref<number>(1) // Day 1 of month

// Watch habit period and initialize day if needed
watch(
  () => activeHabit.value?.period,
  (newPeriod) => {
    if (newPeriod === 'monthly' && activeHabit.value?.monthlySchedule) {
      const firstActiveDay = Object.keys(activeHabit.value.monthlySchedule).map(Number)[0]
      if (firstActiveDay) {
        selectedMonthDay.value = firstActiveDay
      }
    }
  },
  { immediate: true }
)

// Active tasks for current view based on period
const currentTasks = computed<HabitTask[]>(() => {
  if (!activeHabit.value) return []
  if (activeHabit.value.period === 'daily') {
    return activeHabit.value.dailyTasks || []
  }
  if (activeHabit.value.period === 'weekly') {
    return activeHabit.value.weeklySchedule?.[selectedWeekday.value] || []
  }
  if (activeHabit.value.period === 'monthly') {
    return activeHabit.value.monthlySchedule?.[selectedMonthDay.value] || []
  }
  return []
})

// Monthly displayed days in horizontal rounded bar:
// Days that currently have configured tasks + the currently active day
const displayedMonthDays = computed<number[]>(() => {
  if (!activeHabit.value?.monthlySchedule) {
    return [selectedMonthDay.value]
  }

  const daysWithTasks = Object.keys(activeHabit.value.monthlySchedule)
    .map(Number)
    .filter((d) => (activeHabit.value?.monthlySchedule?.[d]?.length || 0) > 0)

  const daySet = new Set<number>(daysWithTasks)
  daySet.add(selectedMonthDay.value)

  return Array.from(daySet).sort((a, b) => a - b)
})

function selectMonthDay(day: number) {
  exitSelectionMode()
  selectedMonthDay.value = day
}

function selectWeekday(dayIndex: number) {
  exitSelectionMode()
  selectedWeekday.value = dayIndex
}

// Dialogs and Sheets State
const isHabitSettingsOpen = ref(false)
const isDeleteHabitDialogOpen = ref(false)
const isAddTaskSheetOpen = ref(false)
const isEditTaskSheetOpen = ref(false)
const taskToEdit = ref<HabitTask | null>(null)
const isDeleteTasksDialogOpen = ref(false)
const tasksToDelete = ref<HabitTask[]>([])
const isAllMonthModalOpen = ref(false)

function openAllMonthModal() {
  exitSelectionMode()
  isAllMonthModalOpen.value = true
}

function handleSelectMonthDayFromModal(day: number) {
  selectMonthDay(day)
  isAllMonthModalOpen.value = false
  showToast(`روز ${PERSIAN_MONTH_ORDINAL_NAMES[day] || toPersianDigits(day)} انتخاب شد`)
}

// Selection Mode State
const isSelectionMode = ref(false)
const selectedTaskIds = ref<string[]>([])

// Toast Notification
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

onBeforeUnmount(() => {
  unregisterBackHandler()
  clearTaskLongPress()
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})

const unregisterBackHandler = registerBackHandler(() => {
  if (route.name !== 'habit-detail') return false

  if (isAllMonthModalOpen.value) {
    isAllMonthModalOpen.value = false
    return true
  }
  if (isDeleteTasksDialogOpen.value) {
    isDeleteTasksDialogOpen.value = false
    return true
  }
  if (isDeleteHabitDialogOpen.value) {
    isDeleteHabitDialogOpen.value = false
    return true
  }
  if (isEditTaskSheetOpen.value) {
    isEditTaskSheetOpen.value = false
    return true
  }
  if (isAddTaskSheetOpen.value) {
    isAddTaskSheetOpen.value = false
    return true
  }
  if (isHabitSettingsOpen.value) {
    isHabitSettingsOpen.value = false
    return true
  }
  if (isSelectionMode.value) {
    exitSelectionMode()
    return true
  }
  return false
})

function backToHabits() {
  exitSelectionMode()
  router.push('/habits')
}

// -------------------------------------------------------------
// Habit Settings & Deletion
// -------------------------------------------------------------
function openEditHabitModal() {
  if (!activeHabit.value) return
  isHabitSettingsOpen.value = true
}

function handleSaveHabitSettings(data: { title: string; period: HabitPeriod }) {
  if (!activeHabit.value) return
  habitsStore.updateHabit(activeHabit.value.id, {
    title: data.title,
    period: data.period,
  })
  showToast('مشخصات عادت به‌روزرسانی شد')
}

function requestDeleteHabit() {
  if (!activeHabit.value) return
  isDeleteHabitDialogOpen.value = true
}

function confirmDeleteHabit() {
  if (!activeHabit.value) return
  const idToDelete = activeHabit.value.id
  isDeleteHabitDialogOpen.value = false
  habitsStore.deleteHabit(idToDelete)
  showToast('عادت با موفقیت حذف شد')
  router.push('/habits')
}

// -------------------------------------------------------------
// Task CRUD Handlers
// -------------------------------------------------------------
function openAddTaskSheet() {
  isAddTaskSheetOpen.value = true
}

function handleConfirmAddTask(title: string) {
  if (!activeHabit.value) return
  const trimmed = title.trim()
  if (!trimmed) return

  habitsStore.addHabitTask(activeHabit.value.id, trimmed, {
    weekday: selectedWeekday.value,
    monthDay: selectedMonthDay.value,
  })
  isAddTaskSheetOpen.value = false
  showToast('تسک جدید به عادت افزوده شد')
}

function enterSelectionMode(task: HabitTask) {
  isSelectionMode.value = true
  selectedTaskIds.value = [task.id]
}

function handleSelectTask(task: HabitTask) {
  if (!isSelectionMode.value) return
  const idx = selectedTaskIds.value.indexOf(task.id)
  if (idx !== -1) {
    selectedTaskIds.value.splice(idx, 1)
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
}

// Long-press detection for habit tasks (matching Days page: 400ms timer with 10px movement cancellation)
let taskLongPressTimer: ReturnType<typeof setTimeout> | null = null
let taskTouchStartX = 0
let taskTouchStartY = 0
let didTriggerTaskLongPress = false

function startTaskLongPress(task: HabitTask) {
  didTriggerTaskLongPress = false
  if (taskLongPressTimer) clearTimeout(taskLongPressTimer)
  taskLongPressTimer = setTimeout(() => {
    didTriggerTaskLongPress = true
    enterSelectionMode(task)
  }, 400)
}

function clearTaskLongPress() {
  if (taskLongPressTimer) {
    clearTimeout(taskLongPressTimer)
    taskLongPressTimer = null
  }
}

function onTaskTouchStart(e: TouchEvent, task: HabitTask) {
  if (isSelectionMode.value) return
  const touch = e.touches[0]
  taskTouchStartX = touch.clientX
  taskTouchStartY = touch.clientY
  startTaskLongPress(task)
}

function onTaskTouchMove(e: TouchEvent) {
  if (!taskLongPressTimer) return
  const touch = e.touches[0]
  if (Math.abs(touch.clientX - taskTouchStartX) > 10 || Math.abs(touch.clientY - taskTouchStartY) > 10) {
    clearTaskLongPress()
  }
}

function onTaskTouchEnd() {
  clearTaskLongPress()
}

function onTaskMouseDown(e: MouseEvent, task: HabitTask) {
  if (isSelectionMode.value || e.button !== 0) return
  taskTouchStartX = e.clientX
  taskTouchStartY = e.clientY
  startTaskLongPress(task)

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (Math.abs(moveEvent.clientX - taskTouchStartX) > 10 || Math.abs(moveEvent.clientY - taskTouchStartY) > 10) {
      clearTaskLongPress()
    }
  }

  const onMouseUp = () => {
    clearTaskLongPress()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function handleTaskClick(task: HabitTask) {
  if (didTriggerTaskLongPress) {
    didTriggerTaskLongPress = false
    return
  }
  if (isSelectionMode.value) {
    handleSelectTask(task)
  }
}

// Copy action
const canCopy = computed(() => selectedTaskIds.value.length >= 1)

// Edit action
const canEdit = computed(() => selectedTaskIds.value.length === 1)

function handleOpenEditTask() {
  if (!canEdit.value || !activeHabit.value) return
  const currentTaskId = selectedTaskIds.value[0]
  const task = currentTasks.value.find((t) => t.id === currentTaskId)
  if (!task) return
  taskToEdit.value = task
  isEditTaskSheetOpen.value = true
}

function handleConfirmEditTask(newTitle: string) {
  if (!activeHabit.value || !taskToEdit.value) return
  habitsStore.updateHabitTask(activeHabit.value.id, taskToEdit.value.id, newTitle, {
    weekday: selectedWeekday.value,
    monthDay: selectedMonthDay.value,
  })
  taskToEdit.value = null
  exitSelectionMode()
  showToast('تسک ویرایش شد')
}

async function handleCopyTask() {
  if (!canCopy.value || !activeHabit.value) return
  const idSet = new Set(selectedTaskIds.value)
  const targetTasks = currentTasks.value.filter((t) => idSet.has(t.id))
  if (targetTasks.length === 0) return

  const textToCopy = targetTasks.map((t) => t.title).join('\n')

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = textToCopy
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showToast(targetTasks.length > 1 ? `${toPersianDigits(targetTasks.length)} تسک کپی شد` : 'متن تسک کپی شد')
    exitSelectionMode()
  } catch {
    showToast('خطا در کپی متن')
  }
}

function handleRequestDeleteFromSelection() {
  if (!activeHabit.value || selectedTaskIds.value.length === 0) return
  const idSet = new Set(selectedTaskIds.value)
  const targetTasks = currentTasks.value.filter((t) => idSet.has(t.id))
  if (targetTasks.length === 0) return

  tasksToDelete.value = targetTasks
  isDeleteTasksDialogOpen.value = true
}

function confirmDeleteTasks() {
  if (!activeHabit.value || tasksToDelete.value.length === 0) return
  const ids = tasksToDelete.value.map((t) => t.id)
  habitsStore.deleteHabitTasks(activeHabit.value.id, ids, {
    weekday: selectedWeekday.value,
    monthDay: selectedMonthDay.value,
  })
  const count = tasksToDelete.value.length
  tasksToDelete.value = []
  isDeleteTasksDialogOpen.value = false
  exitSelectionMode()
  showToast(count > 1 ? `${toPersianDigits(count)} تسک حذف شد` : 'تسک حذف شد')
}

const PERSIAN_MONTH_ORDINAL_NAMES: Record<number, string> = {
  1: 'اول',
  2: 'دوم',
  3: 'سوم',
  4: 'چهارم',
  5: 'پنجم',
  6: 'ششم',
  7: 'هفتم',
  8: 'هشتم',
  9: 'نهم',
  10: 'دهم',
  11: 'یازدهم',
  12: 'دوازدهم',
  13: 'سیزدهم',
  14: 'چهاردهم',
  15: 'پانزدهم',
  16: 'شانزدهم',
  17: 'هفدهم',
  18: 'هجدهم',
  19: 'نوزدهم',
  20: 'بیستم',
  21: 'بیست‌و‌یکم',
  22: 'بیست‌و‌دوم',
  23: 'بیست‌و‌سوم',
  24: 'بیست‌و‌چهارم',
  25: 'بیست‌و‌پنجم',
  26: 'بیست‌و‌ششم',
  27: 'بیست‌و‌هفتم',
  28: 'بیست‌و‌هشتم',
  29: 'بیست‌و‌نهم',
  30: 'سی‌ام',
  31: 'سی‌و‌یکم',
}

// Current schedule label: e.g. "روز اول ماه", "روز شنبه", "تکرار هر روز"
const currentScheduleLabel = computed(() => {
  if (!activeHabit.value) return ''
  if (activeHabit.value.period === 'daily') {
    return 'تکرار هر روز'
  }
  if (activeHabit.value.period === 'weekly') {
    const found = WEEKDAYS_MAP.find((w) => w.dayIndex === selectedWeekday.value)
    return `روز ${found?.name || ''}`
  }
  if (activeHabit.value.period === 'monthly') {
    const ordinal = PERSIAN_MONTH_ORDINAL_NAMES[selectedMonthDay.value]
    return ordinal ? `روز ${ordinal} ماه` : `روز ${toPersianDigits(selectedMonthDay.value)} ماه`
  }
  return ''
})

// Subtitle for page header
const currentSubheaderTitle = computed(() => {
  if (!activeHabit.value) return ''
  if (activeHabit.value.period === 'daily') {
    return 'تسک‌های تکرار روزانه (هر روز)'
  }
  if (activeHabit.value.period === 'weekly') {
    const found = WEEKDAYS_MAP.find((w) => w.dayIndex === selectedWeekday.value)
    return `تسک‌های روز ${found?.name || ''}`
  }
  if (activeHabit.value.period === 'monthly') {
    const ordinal = PERSIAN_MONTH_ORDINAL_NAMES[selectedMonthDay.value]
    return ordinal ? `تسک‌های روز ${ordinal} ماه` : `تسک‌های روز ${toPersianDigits(selectedMonthDay.value)} ماه`
  }
  return ''
})
</script>

<template>
  <div v-if="activeHabit" class="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-sky-100/90 via-sky-200/60 to-blue-200/70 select-none" dir="rtl">
    <!-- Stationary Background Texture Overlay (Fixed in place, never scrolls) -->
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-[0.055] mix-blend-multiply"
      :style="{
        backgroundImage: `url(${texturePatternImg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
      }"
    />

    <!-- Header: Back button + Habit title/period + Edit & Delete settings -->
    <header class="relative z-20 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md shadow-sm shadow-slate-900/5">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <!-- Right side: Back Button & Title Info -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer disabled:opacity-40"
            :disabled="isSelectionMode"
            aria-label="مشاهده همه عادت‌ها"
            title="مشاهده همه عادت‌ها"
            @click="backToHabits"
          >
            <!-- Habits icon -->
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 3.75 3.75 0 001.43 3.921z"
              />
            </svg>
          </button>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-bold text-slate-900 truncate">
                {{ activeHabit.title }}
              </h1>
              <span
                class="rounded-lg px-2 py-0.5 text-[10px] font-bold shrink-0"
                :class="
                  activeHabit.period === 'daily'
                    ? 'bg-sky-100 text-sky-800'
                    : activeHabit.period === 'weekly'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-sky-100 text-sky-800'
                "
              >
                {{ activeHabit.period === 'daily' ? 'هر روز' : activeHabit.period === 'weekly' ? 'هفتگی' : 'ماهانه' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 font-medium mt-0.5 truncate">
              {{ currentSubheaderTitle }}
            </p>
          </div>
        </div>

        <!-- Left side in RTL: Edit Habit & Delete Habit -->
        <div v-if="!isSelectionMode" class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer focus:outline-none"
            title="ویرایش مشخصات عادت"
            aria-label="ویرایش مشخصات عادت"
            @click="openEditHabitModal"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer focus:outline-none"
            title="حذف عادت"
            aria-label="حذف عادت"
            @click="requestDeleteHabit"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area with transparent background so fixed background remains stationary -->
    <main
      class="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4 pb-24 md:px-8 bg-transparent"
      style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
    >
      <div class="relative mx-auto flex h-full min-h-full max-w-2xl flex-col">
        <!-- Sticky Day Selector for Weekly & Monthly Habits (Pinned on scroll, completely transparent surroundings) -->
        <div
          v-if="activeHabit.period === 'weekly' || activeHabit.period === 'monthly'"
          class="sticky top-0 z-20 mb-3.5 shrink-0 bg-transparent"
        >
          <!-- Horizontal Rounded Card for Weekly Day Selection -->
          <div
            v-if="activeHabit.period === 'weekly'"
          >
            <div class="grid grid-cols-7 gap-1 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md shadow-slate-900/10">
              <button
                v-for="wd in WEEKDAYS_MAP"
                :key="wd.dayIndex"
                type="button"
                class="flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs transition-all cursor-pointer select-none"
                :class="
                  selectedWeekday === wd.dayIndex
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100/80 font-medium'
                "
                @click="selectWeekday(wd.dayIndex)"
              >
                <span class="text-xs font-bold">{{ wd.shortName }}</span>
                <span
                  class="text-[11px] font-semibold"
                  :class="selectedWeekday === wd.dayIndex ? 'text-sky-100' : 'text-slate-400'"
                >
                  {{ toPersianDigits(activeHabit.weeklySchedule?.[wd.dayIndex]?.length || 0) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Horizontal Rounded Card for Monthly Day Selection -->
          <div
            v-else-if="activeHabit.period === 'monthly'"
          >
            <div class="rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md shadow-slate-900/10 overflow-hidden">
              <div class="flex items-center gap-1.5 overflow-x-auto px-2 pt-1.5 pb-2 scrollbar-inset">
                <!-- Days with tasks (and active day) -->
                <button
                  v-for="d in displayedMonthDays"
                  :key="'mday-' + d"
                  type="button"
                  class="flex items-center justify-center gap-1 min-w-[2.25rem] px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 select-none"
                  :class="
                    selectedMonthDay === d
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/90 font-medium'
                  "
                  @click="selectMonthDay(d)"
                >
                  <span class="font-bold text-xs">{{ toPersianDigits(d) }}</span>
                  <span
                    v-if="(activeHabit.monthlySchedule?.[d]?.length || 0) > 0"
                    class="text-[10px] font-semibold"
                    :class="selectedMonthDay === d ? 'text-sky-100' : 'text-slate-400'"
                  >
                    ({{ toPersianDigits(activeHabit.monthlySchedule?.[d]?.length || 0) }})
                  </span>
                </button>

                <!-- Divider -->
                <div class="h-4 w-px bg-slate-200 shrink-0 mx-0.5" />

                <!-- All Month option (همه ماه) -->
                <button
                  type="button"
                  class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer select-none border border-dashed"
                  :class="
                    isAllMonthModalOpen
                      ? 'bg-sky-100 border-sky-400 text-sky-800 font-bold'
                      : 'text-sky-700 bg-sky-50/70 hover:bg-sky-100/90 border-sky-200'
                  "
                  @click="openAllMonthModal"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>همه ماه</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tasks List -->
        <ul v-if="currentTasks.length > 0" class="space-y-2.5 pb-28">
          <li
            v-for="(task, index) in currentTasks"
            :key="task.id"
            class="relative overflow-hidden rounded-2xl border transition-all duration-200 select-none cursor-pointer active:scale-[0.99]"
            style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;"
            :class="[
              selectedTaskIds.includes(task.id)
                ? 'ring-2 ring-sky-500 bg-sky-50/90 shadow-md scale-[1.01] border-sky-300'
                : 'border-slate-200/80 bg-white/95 backdrop-blur-xs shadow-sm hover:border-slate-300 hover:shadow-md'
            ]"
            @touchstart="(e) => onTaskTouchStart(e, task)"
            @touchmove="onTaskTouchMove"
            @touchend="onTaskTouchEnd"
            @touchcancel="onTaskTouchEnd"
            @mousedown="(e) => onTaskMouseDown(e, task)"
            @contextmenu.prevent
            @click="handleTaskClick(task)"
          >
            <div class="flex w-full items-start gap-3 p-3.5 text-start">
              <!-- Task index badge (always visible, highlighted on selection) -->
              <div class="shrink-0 mt-0.5">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-all shadow-2xs"
                  :class="
                    selectedTaskIds.includes(task.id)
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-sky-100 text-sky-800'
                  "
                >
                  {{ toPersianDigits(index + 1) }}
                </span>
              </div>

              <!-- Task Title -->
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-slate-800 leading-6 break-words">
                  {{ task.title }}
                </span>
              </div>
            </div>
          </li>
        </ul>

        <!-- Empty State: Thinking character matching Days & Lists View -->
        <div
          v-else
          class="flex flex-1 w-full flex-col items-center justify-center my-auto py-8 select-none"
        >
          <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
            <img
              :src="thinkingCharacterImg"
              alt="قراره چیکار کنم"
              class="w-52 sm:w-64 md:w-72 h-auto object-contain drop-shadow-md opacity-95 transition-transform hover:scale-105 duration-300 pointer-events-none"
              loading="lazy"
            />
            <p
              class="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 shadow-sm"
            >
              قراره چیکار کنم
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Floating Action Button for 'Add Task' (hidden in selection mode) -->
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
        class="pointer-events-auto absolute bottom-4 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer"
        title="افزودن تسک"
        aria-label="افزودن تسک"
        @click="openAddTaskSheet"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>افزودن تسک</span>
      </button>
    </Transition>

    <!-- Selection Mode Toolbar (Replaces Add Task button) -->
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
        @close="exitSelectionMode"
        @edit="handleOpenEditTask"
        @copy="handleCopyTask"
        @delete="handleRequestDeleteFromSelection"
      />
    </Transition>

    <!-- Add Task Sheet (matching app-wide AddTaskSheet) -->
    <AddTaskSheet
      v-model="isAddTaskSheetOpen"
      custom-badge="عادت"
      :custom-title="currentScheduleLabel"
      :show-tracked-option="false"
      @submit="(title: string) => handleConfirmAddTask(title)"
    />

    <!-- Edit Task Sheet -->
    <EditTaskSheet
      v-model="isEditTaskSheetOpen"
      :task="taskToEdit"
      custom-badge="عادت"
      :custom-title="currentScheduleLabel"
      :show-tracked-option="false"
      @submit="(newTitle: string) => handleConfirmEditTask(newTitle)"
    />

    <!-- Edit Habit Settings Sheet -->
    <HabitFormSheet
      v-model="isHabitSettingsOpen"
      :habit="activeHabit"
      @submit="handleSaveHabitSettings"
    />

    <!-- Delete Single/Multiple Tasks Confirm Dialog -->
    <DeleteConfirmDialog
      v-model="isDeleteTasksDialogOpen"
      :title="tasksToDelete.length > 1 ? `حذف ${toPersianDigits(tasksToDelete.length)} تسک` : 'حذف تسک'"
      :message="tasksToDelete.length > 1 ? `آیا از حذف این ${toPersianDigits(tasksToDelete.length)} تسک از عادت اطمینان دارید؟` : 'آیا از حذف این تسک از عادت اطمینان دارید؟'"
      :task-title="tasksToDelete.length === 1 ? tasksToDelete[0].title : ''"
      confirm-button-text="بله، حذف کن"
      @confirm="confirmDeleteTasks"
    />

    <!-- Delete Whole Habit Confirm Dialog -->
    <DeleteConfirmDialog
      v-model="isDeleteHabitDialogOpen"
      title="حذف کل عادت"
      message="آیا از حذف این عادت اطمینان دارید؟ تمام تسک‌های مربوط به این عادت پاک خواهند شد."
      :task-title="activeHabit?.title || ''"
      confirm-button-text="بله، حذف عادت"
      @confirm="confirmDeleteHabit"
    />

    <!-- All Month Bottom Sheet (شیت نمای همه روزهای ماه) -->
    <Teleport to="body">
      <div v-if="isAllMonthModalOpen" class="fixed inset-0 z-50 overflow-hidden" dir="rtl">
        <!-- Backdrop -->
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            @click="isAllMonthModalOpen = false"
          />
        </Transition>

        <!-- Bottom Sheet container -->
        <div class="fixed inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden">
          <Transition
            appear
            enter-active-class="transition duration-300 ease-out transform"
            enter-from-class="translate-y-full"
            enter-to-class="translate-y-0"
            leave-active-class="transition duration-200 ease-in transform"
            leave-from-class="translate-y-0"
            leave-to-class="translate-y-full"
          >
            <div
              class="relative z-10 w-full max-w-sm sm:max-w-md mx-auto rounded-t-3xl bg-white px-5 pt-3 pb-6 shadow-2xl border-t border-slate-100 flex flex-col"
              @click.stop
            >
              <!-- Pull bar indicator & Close button -->
              <div class="relative mb-3 flex items-center justify-center">
                <div class="h-1.5 w-12 rounded-full bg-slate-200" />
                <button
                  type="button"
                  class="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  @click="isAllMonthModalOpen = false"
                  aria-label="بستن"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Simple Calendar Grid (7 columns = 1 week per row) -->
              <div class="py-2">
                <div class="grid grid-cols-7 gap-y-2.5 gap-x-1 justify-items-center">
                  <button
                    v-for="d in 31"
                    :key="'grid-day-' + d"
                    type="button"
                    class="relative flex flex-col items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all cursor-pointer text-center"
                    :class="
                      selectedMonthDay === d
                        ? 'bg-sky-500 text-white font-bold shadow-xs'
                        : (activeHabit?.monthlySchedule?.[d]?.length || 0) > 0
                          ? 'text-slate-900 font-semibold hover:bg-sky-50'
                          : 'text-slate-600 hover:bg-slate-100 active:scale-95'
                    "
                    @click="handleSelectMonthDayFromModal(d)"
                  >
                    <!-- Day number only -->
                    <span class="text-sm sm:text-base leading-none">
                      {{ toPersianDigits(d) }}
                    </span>
                    <!-- Dot underneath if day has tasks -->
                    <span
                      v-if="(activeHabit?.monthlySchedule?.[d]?.length || 0) > 0"
                      class="absolute bottom-1 h-1 w-1 rounded-full"
                      :class="selectedMonthDay === d ? 'bg-white' : 'bg-sky-500'"
                    />
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>

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
