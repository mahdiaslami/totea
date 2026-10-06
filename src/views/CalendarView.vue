<script setup lang="ts">
import { ref, computed, onMounted, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  PersianDate,
  toPersianDigits,
  getDaysInJalaliMonth,
} from '@/modules/timeline/PersianDate'
import { useTimelineStore } from '@/stores/timeline'
import type { Task } from '@/modules/timeline/date'

// Import the 12 month illustration images uploaded by the user
import img01 from '@/assets/images/months/01.png'
import img02 from '@/assets/images/months/02.png'
import img03 from '@/assets/images/months/03.png'
import img04 from '@/assets/images/months/04.png'
import img05 from '@/assets/images/months/05.png'
import img06 from '@/assets/images/months/06.png'
import img07 from '@/assets/images/months/07.png'
import img08 from '@/assets/images/months/08.png'
import img09 from '@/assets/images/months/09.png'
import img10 from '@/assets/images/months/10.png'
import img11 from '@/assets/images/months/11.png'
import img12 from '@/assets/images/months/12.png'

defineOptions({
  name: 'CalendarView',
})

const router = useRouter()
const store = useTimelineStore()

const todayJalali = PersianDate.today().toJalali()
const currentJalaliYear = todayJalali.year
const currentJalaliMonth = todayJalali.month

// Selected year for the calendar view (defaults to current Persian year)
const selectedYear = ref(currentJalaliYear)

const yearSubtitle = computed(() => {
  const diff = selectedYear.value - currentJalaliYear
  if (diff === 0) return 'سال جاری'
  if (diff === 1) return 'سال آینده'
  if (diff === -1) return 'سال گذشته'
  if (diff > 1) return `${toPersianDigits(diff)} سال آینده`
  return `${toPersianDigits(Math.abs(diff))} سال گذشته`
})

interface MonthMeta {
  number: number
  name: string
  season: 'بهار' | 'تابستان' | 'پاییز' | 'زمستان'
  seasonColor: 'green' | 'red' | 'yellow' | 'blue'
  image: string
  // Full-bleed background color and slanted divider stroke
  hexBg: string
  lineStroke: string
  headerTitleColor: string
  seasonBadgeClass: string
}

// 12 Months with distinct, alternating seasonal color spectrums:
// Spring (1-3): Green spectrum
// Summer (4-6): Red spectrum
// Autumn (7-9): Yellow spectrum
// Winter (10-12): Blue spectrum
const MONTHS_CONFIG: MonthMeta[] = [
  // بهار (Green Spectrum)
  {
    number: 1,
    name: 'فروردین',
    season: 'بهار',
    seasonColor: 'green',
    image: img01,
    hexBg: '#ecfdf5', // emerald-50
    lineStroke: 'rgba(16, 185, 129, 0.45)',
    headerTitleColor: 'text-emerald-950',
    seasonBadgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
  },
  {
    number: 2,
    name: 'اردیبهشت',
    season: 'بهار',
    seasonColor: 'green',
    image: img02,
    hexBg: '#dcfce7', // green-100
    lineStroke: 'rgba(34, 197, 94, 0.45)',
    headerTitleColor: 'text-green-950',
    seasonBadgeClass: 'bg-green-200/80 text-green-900 border-green-300/80',
  },
  {
    number: 3,
    name: 'خرداد',
    season: 'بهار',
    seasonColor: 'green',
    image: img03,
    hexBg: '#f0fdfa', // teal-50
    lineStroke: 'rgba(20, 184, 166, 0.45)',
    headerTitleColor: 'text-teal-950',
    seasonBadgeClass: 'bg-teal-100 text-teal-800 border-teal-200/80',
  },

  // تابستان (Red Spectrum)
  {
    number: 4,
    name: 'تیر',
    season: 'تابستان',
    seasonColor: 'red',
    image: img04,
    hexBg: '#fff1f2', // rose-50
    lineStroke: 'rgba(244, 63, 94, 0.45)',
    headerTitleColor: 'text-rose-950',
    seasonBadgeClass: 'bg-rose-100 text-rose-800 border-rose-200/80',
  },
  {
    number: 5,
    name: 'مرداد',
    season: 'تابستان',
    seasonColor: 'red',
    image: img05,
    hexBg: '#fee2e2', // red-100
    lineStroke: 'rgba(239, 68, 68, 0.45)',
    headerTitleColor: 'text-red-950',
    seasonBadgeClass: 'bg-red-200/80 text-red-900 border-red-300/80',
  },
  {
    number: 6,
    name: 'شهریور',
    season: 'تابستان',
    seasonColor: 'red',
    image: img06,
    hexBg: '#fff7ed', // orange-50 (warm sunset red-orange)
    lineStroke: 'rgba(249, 115, 22, 0.45)',
    headerTitleColor: 'text-orange-950',
    seasonBadgeClass: 'bg-orange-100 text-orange-800 border-orange-200/80',
  },

  // پاییز (Yellow Spectrum)
  {
    number: 7,
    name: 'مهر',
    season: 'پاییز',
    seasonColor: 'yellow',
    image: img07,
    hexBg: '#fefce8', // yellow-50
    lineStroke: 'rgba(234, 179, 8, 0.5)',
    headerTitleColor: 'text-amber-950',
    seasonBadgeClass: 'bg-amber-100 text-amber-800 border-amber-200/80',
  },
  {
    number: 8,
    name: 'آبان',
    season: 'پاییز',
    seasonColor: 'yellow',
    image: img08,
    hexBg: '#fef9c3', // yellow-100
    lineStroke: 'rgba(202, 138, 4, 0.5)',
    headerTitleColor: 'text-yellow-950',
    seasonBadgeClass: 'bg-yellow-200/80 text-yellow-900 border-yellow-300/80',
  },
  {
    number: 9,
    name: 'آذر',
    season: 'پاییز',
    seasonColor: 'yellow',
    image: img09,
    hexBg: '#fef3c7', // amber-100
    lineStroke: 'rgba(217, 119, 6, 0.5)',
    headerTitleColor: 'text-amber-950',
    seasonBadgeClass: 'bg-amber-200/70 text-amber-900 border-amber-300/70',
  },

  // زمستان (Blue Spectrum)
  {
    number: 10,
    name: 'دی',
    season: 'زمستان',
    seasonColor: 'blue',
    image: img10,
    hexBg: '#f0f9ff', // sky-50
    lineStroke: 'rgba(14, 165, 233, 0.45)',
    headerTitleColor: 'text-sky-950',
    seasonBadgeClass: 'bg-sky-100 text-sky-800 border-sky-200/80',
  },
  {
    number: 11,
    name: 'بهمن',
    season: 'زمستان',
    seasonColor: 'blue',
    image: img11,
    hexBg: '#dbeafe', // blue-100
    lineStroke: 'rgba(59, 130, 246, 0.45)',
    headerTitleColor: 'text-blue-950',
    seasonBadgeClass: 'bg-blue-200/80 text-blue-900 border-blue-300/80',
  },
  {
    number: 12,
    name: 'اسفند',
    season: 'زمستان',
    seasonColor: 'blue',
    image: img12,
    hexBg: '#ecfeff', // cyan-50
    lineStroke: 'rgba(6, 182, 212, 0.45)',
    headerTitleColor: 'text-cyan-950',
    seasonBadgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200/80',
  },
]

interface CalendarDaySlot {
  isEmpty: boolean
  dayNumber?: number
  pDate?: PersianDate
  isToday?: boolean
  isFriday?: boolean
  shortWeekdayName?: string
  tasks?: Task[]
  completedTasksCount?: number
  pendingTasksCount?: number
}

interface CalendarWeek {
  weekNumber: number
  slots: CalendarDaySlot[]
  daysWithTasks: CalendarDaySlot[]
}

// Generate the weeks and days for a given month in the selected year
// Aligned to 7 days per row (شنبه = rightmost, جمعه = leftmost & last in row)
function getMonthWeeks(monthNum: number): {
  weeks: CalendarWeek[]
  daysCount: number
  totalTasks: number
  completedTasks: number
} {
  const daysCount = getDaysInJalaliMonth(selectedYear.value, monthNum)

  // Day 1
  const firstPDate = PersianDate.fromJalali(selectedYear.value, monthNum, 1)
  // Persian weekday: 0 = شنبه (Saturday), ..., 6 = جمعه (Friday)
  const startWeekday = (firstPDate.value.getDay() + 1) % 7

  const allSlots: CalendarDaySlot[] = []

  // 1. Leading empty slots for the start of the month so that Day 1 is on its exact weekday
  // and Friday is always the 7th (leftmost) column
  for (let i = 0; i < startWeekday; i++) {
    allSlots.push({ isEmpty: true })
  }

  let totalTasks = 0
  let completedTasks = 0

  // 2. Days of the month
  for (let d = 1; d <= daysCount; d++) {
    const pDate = PersianDate.fromJalali(selectedYear.value, monthNum, d)
    const timeKey = PersianDate.startOfDay(pDate).getTime()
    const tasks = store.persistedTasks[timeKey] || []

    const doneCount = tasks.filter((t) => t.done).length
    const pendingCount = tasks.length - doneCount

    totalTasks += tasks.length
    completedTasks += doneCount

    allSlots.push({
      isEmpty: false,
      dayNumber: d,
      pDate,
      isToday: pDate.isToday(),
      isFriday: pDate.value.getDay() === 5,
      shortWeekdayName: pDate.shortWeekdayName,
      tasks,
      completedTasksCount: doneCount,
      pendingTasksCount: pendingCount,
    })
  }

  // 3. Trailing empty slots for the end of the month so that the row completes up to Friday
  // and Friday is always the leftmost and last day in the row
  const lastPDate = PersianDate.fromJalali(selectedYear.value, monthNum, daysCount)
  const endWeekday = (lastPDate.value.getDay() + 1) % 7
  const trailingCount = (6 - endWeekday + 7) % 7

  for (let i = 0; i < trailingCount; i++) {
    allSlots.push({ isEmpty: true })
  }

  // 4. Chunk into weeks of exactly 7 days
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < allSlots.length; i += 7) {
    const weekSlots = allSlots.slice(i, i + 7)
    const daysWithTasks = weekSlots.filter(
      (s): s is CalendarDaySlot & { pDate: PersianDate; tasks: Task[]; dayNumber: number } =>
        !s.isEmpty && !!s.tasks && s.tasks.length > 0
    )
    weeks.push({
      weekNumber: Math.floor(i / 7) + 1,
      slots: weekSlots,
      daysWithTasks,
    })
  }

  return {
    weeks,
    daysCount,
    totalTasks,
    completedTasks,
  }
}

// Map of months data reactively derived from selectedYear and store.persistedTasks
const monthsData = computed(() => {
  return MONTHS_CONFIG.map((meta) => {
    const { weeks, daysCount, totalTasks, completedTasks } = getMonthWeeks(meta.number)
    return {
      meta,
      weeks,
      daysCount,
      totalTasks,
      completedTasks,
    }
  })
})

function goToTimelineDay(pDate: PersianDate) {
  store.setActiveDate(pDate)
  router.push('/')
}

function handleToggleTask(pDate: PersianDate, taskId: string) {
  store.toggleTaskByDate(pDate, taskId)
}

const lastMonthHexBg = computed(() => {
  return MONTHS_CONFIG[MONTHS_CONFIG.length - 1]?.hexBg || '#ecfeff'
})

const scrollContainerRef = ref<HTMLElement | null>(null)

function scrollContainerToElement(targetEl: HTMLElement, center = true, smooth = false) {
  const container = scrollContainerRef.value || document.getElementById('calendar-scroll-container')
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const relativeTop = targetRect.top - containerRect.top + container.scrollTop
  const desiredTop = center
    ? relativeTop - (container.clientHeight / 2) + (targetEl.clientHeight / 2)
    : relativeTop

  container.scrollTo({
    top: Math.max(0, Math.round(desiredTop)),
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function handleScrollToToday() {
  if (selectedYear.value !== currentJalaliYear) {
    selectedYear.value = currentJalaliYear
  }
  nextTick(() => {
    requestAnimationFrame(() => {
      const todayEl =
        document.getElementById(`calendar-cell-${currentJalaliMonth}-${todayJalali.day}`) ||
        document.getElementById('calendar-today-cell') ||
        document.getElementById(`month-section-${currentJalaliMonth}`)
      if (todayEl) {
        scrollContainerToElement(todayEl, true, true)
      }
    })
  })
}

function syncWithActiveTimelineDay(smooth = false) {
  const activeDate = store.currentDay?.date ?? new PersianDate(store.activeDateTimestamp)
  const j = activeDate.toJalali()

  // 1. Ensure calendar is viewing the year of the active day
  selectedYear.value = j.year

  // 2. Scroll vertically strictly inside container without affecting horizontal axes or parent elements
  nextTick(() => {
    requestAnimationFrame(() => {
      const targetCellId = `calendar-cell-${j.month}-${j.day}`
      const cellEl = document.getElementById(targetCellId)
      if (cellEl) {
        scrollContainerToElement(cellEl, true, smooth)
      } else {
        const monthEl = document.getElementById(`month-section-${j.month}`)
        if (monthEl) {
          scrollContainerToElement(monthEl, false, smooth)
        }
      }
    })
  })
}

onMounted(() => {
  syncWithActiveTimelineDay(false)
})

onActivated(() => {
  syncWithActiveTimelineDay(false)
})
</script>

<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden select-none bg-white" dir="rtl">
    <!-- Header: matches DayView.vue in title size, subtitle, height, and arrow placement -->
    <header class="sticky top-0 z-30 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-4 backdrop-blur-md shadow-sm shadow-slate-900/5">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <!-- Year Info & Previous Year Arrow (right side in RTL) -->
        <div class="flex items-center gap-2.5">
          <!-- Previous Year (Right arrow in RTL) -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
            aria-label="سال قبل"
            title="سال قبل"
            @click="selectedYear--"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div>
            <div class="flex items-center gap-2">
              <h1
                class="text-lg font-bold"
                :class="selectedYear === currentJalaliYear ? 'text-sky-600' : 'text-slate-800'"
              >
                سال {{ toPersianDigits(selectedYear) }}
              </h1>
              <span
                v-if="selectedYear === currentJalaliYear"
                class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700"
              >
                امسال
              </span>
              <span
                v-else-if="selectedYear === currentJalaliYear + 1"
                class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
              >
                سال آینده
              </span>
              <span
                v-else-if="selectedYear < currentJalaliYear"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
              >
                گذشته
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">{{ yearSubtitle }}</p>
          </div>
        </div>

        <!-- Next Year Arrow (left side in RTL) -->
        <div class="flex items-center gap-2">
          <!-- Next Year Button (Left arrow in RTL) -->
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
            aria-label="سال بعد"
            title="سال بعد"
            @click="selectedYear++"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Scrollable container -->
    <div
      id="calendar-scroll-container"
      ref="scrollContainerRef"
      class="flex-1 w-full overflow-y-auto select-none"
      :style="{ backgroundColor: lastMonthHexBg }"
    >
      <!-- Months Container List: Full bleed, edge-to-edge, vertically contiguous, separated by a slanted line -->
      <main class="w-full p-0 m-0 flex flex-col">
        <template v-for="(monthData, idx) in monthsData" :key="monthData.meta.number">
          <!-- Month Section (Full Width, attached to corners / edges, no card borders) -->
          <section
            :id="`month-section-${monthData.meta.number}`"
            class="w-full transition-colors"
            :class="idx === monthsData.length - 1 ? 'pb-6 sm:pb-8' : ''"
            :style="{ backgroundColor: monthData.meta.hexBg }"
          >
          <!-- Inner content container with comfortable reading margins -->
          <div class="mx-auto max-w-2xl px-4 sm:px-6 py-5 sm:py-6">
            <!-- Month Header: Month Name on Top-Right, Image on Left -->
            <header class="flex items-center justify-between gap-3 pb-3 border-b border-black/5">
              <!-- Top-Right: Month Name -->
              <div class="flex flex-col items-start gap-1">
                <div class="flex items-center gap-2">
                  <h2 class="text-xl sm:text-2xl font-black tracking-tight" :class="monthData.meta.headerTitleColor">
                    {{ monthData.meta.name }}
                  </h2>
                </div>

                <!-- Metadata info -->
                <div class="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>{{ toPersianDigits(monthData.daysCount) }} روز</span>
                  <span v-if="monthData.totalTasks > 0" aria-hidden="true">·</span>
                  <span v-if="monthData.totalTasks > 0" class="text-slate-600 font-semibold">
                    {{ toPersianDigits(monthData.totalTasks) }} کار
                    <span v-if="monthData.completedTasks > 0" class="text-emerald-700">
                      ({{ toPersianDigits(monthData.completedTasks) }} انجام شده)
                    </span>
                  </span>
                </div>
              </div>

              <!-- Top-Left: Month Illustration from uploaded assets (larger size) -->
              <div class="relative shrink-0">
                <img
                  :src="monthData.meta.image"
                  :alt="monthData.meta.name"
                  class="h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-sm pointer-events-none select-none transition-transform"
                  loading="lazy"
                />
              </div>
            </header>

            <!-- Month Days Flow Area: weeks of 7 days (Saturday rightmost, Friday leftmost & last day in row) -->
            <div class="flex flex-col gap-2.5 w-full pt-4">
              <div
                v-for="week in monthData.weeks"
                :key="week.weekNumber"
                class="flex flex-col w-full gap-2"
              >
                <!-- 7-day row: Saturday on right, Friday on left (always leftmost and last day in row) -->
                <div class="grid grid-cols-7 gap-1 sm:gap-2 w-full">
                  <template v-for="(slot, sIdx) in week.slots" :key="sIdx">
                    <!-- Empty placeholder slot (before Day 1 or after last day of month) -->
                    <div
                      v-if="slot.isEmpty"
                      class="flex flex-col items-center justify-center py-2 px-0.5 select-none pointer-events-none"
                      aria-hidden="true"
                    />

                    <!-- Day Button: borderless, transparent background (subtle matte background for today), 7 days per line -->
                    <button
                      v-else
                      :id="`calendar-cell-${monthData.meta.number}-${slot.dayNumber}`"
                      type="button"
                      class="flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all duration-150 cursor-pointer active:scale-95 group focus:outline-none border-0"
                      :class="[
                        slot.isToday
                          ? 'bg-black/10 ring-1.5 ring-black/15 shadow-xs font-black'
                          : 'bg-transparent hover:bg-black/5'
                      ]"
                      :title="`مشاهده ${slot.dayNumber} ${monthData.meta.name}${slot.isToday ? ' (امروز)' : ''}`"
                      @click="goToTimelineDay(slot.pDate!)"
                    >
                      <!-- Weekday Name (Top) -->
                      <span
                        class="text-[10px] sm:text-[11px] leading-tight truncate max-w-full font-medium"
                        :class="[
                          slot.isToday
                            ? 'text-sky-800 font-bold'
                            : slot.isFriday
                              ? 'text-rose-500 font-semibold'
                              : 'text-slate-500'
                        ]"
                      >
                        {{ slot.shortWeekdayName }}
                      </span>

                      <!-- Day Number (Underneath) -->
                      <span
                        class="text-sm sm:text-base font-extrabold leading-tight mt-0.5 tabular-nums"
                        :class="[
                          slot.isToday
                            ? 'text-sky-700 font-black'
                            : slot.isFriday
                              ? 'text-rose-600 group-hover:text-rose-700'
                              : 'text-slate-800'
                        ]"
                      >
                        {{ toPersianDigits(slot.dayNumber!) }}
                      </span>

                      <!-- Today indicator and task badge indicators -->
                      <div class="flex items-center gap-1 mt-0.5 min-h-[6px]">
                        <span
                          v-if="slot.isToday"
                          class="h-1.5 w-1.5 rounded-full bg-sky-600 shrink-0"
                          title="امروز"
                        />
                        <!-- Pending Tasks (Amber dot) -->
                        <span
                          v-if="slot.pendingTasksCount && slot.pendingTasksCount > 0"
                          class="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"
                          :title="`${toPersianDigits(slot.pendingTasksCount)} کار باقیمانده`"
                        />
                        <!-- Completed Tasks (Emerald dot) -->
                        <span
                          v-if="slot.completedTasksCount && slot.completedTasksCount > 0"
                          class="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
                          :title="`${toPersianDigits(slot.completedTasksCount)} کار انجام‌شده`"
                        />
                      </div>
                    </button>
                  </template>
                </div>

                <!-- If any day in this week has registered tasks, render its full-width task card below the row -->
                <div
                  v-if="week.daysWithTasks.length > 0"
                  class="flex flex-col gap-2.5 w-full pt-1.5 pb-1.5"
                >
                  <div
                    v-for="dayWithTask in week.daysWithTasks"
                    :key="dayWithTask.dayNumber"
                    class="w-full flex items-start gap-3.5 py-4 sm:py-5 px-3 sm:px-4 rounded-2xl bg-black/[0.035] transition-all"
                  >
                    <!-- Right Side: Day number on top, Weekday name underneath -->
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center w-12 sm:w-14 py-1 px-0.5 shrink-0 cursor-pointer transition hover:opacity-80 active:scale-95 focus:outline-none bg-transparent border-0"
                      :title="`مشاهده و ویرایش کارهای ${dayWithTask.dayNumber} ${monthData.meta.name}`"
                      @click="goToTimelineDay(dayWithTask.pDate!)"
                    >
                      <!-- Weekday Name (Top) -->
                      <span
                        class="text-[11px] sm:text-xs font-bold leading-tight truncate max-w-full"
                        :class="[
                          dayWithTask.isToday
                            ? 'text-sky-600 font-bold'
                            : dayWithTask.isFriday
                              ? 'text-rose-600'
                              : 'text-slate-500'
                        ]"
                      >
                        {{ dayWithTask.shortWeekdayName }}
                      </span>
                      <!-- Day Number (Underneath) -->
                      <span
                        class="text-lg sm:text-xl font-black leading-tight mt-0.5 tabular-nums"
                        :class="[
                          dayWithTask.isToday
                            ? 'text-sky-600'
                            : dayWithTask.isFriday
                              ? 'text-rose-600'
                              : 'text-slate-900'
                        ]"
                      >
                        {{ toPersianDigits(dayWithTask.dayNumber!) }}
                      </span>

                      <!-- Today pill if this is today -->
                      <span
                        v-if="dayWithTask.isToday"
                        class="mt-1 rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs"
                      >
                        امروز
                      </span>
                    </button>

                    <!-- Left Side: Tasks listed one below the other in the remaining space -->
                    <div class="flex-1 min-w-0 flex flex-col justify-center space-y-2">
                      <div
                        v-for="task in dayWithTask.tasks"
                        :key="task.id"
                        class="flex items-center gap-2.5 py-1.5 px-2 rounded-xl transition hover:bg-black/5"
                      >
                        <!-- Custom Toggle Checkbox -->
                        <button
                          type="button"
                          class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer focus:outline-none active:scale-90"
                          :class="[
                            task.done
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : 'border-slate-300 bg-white hover:border-slate-400'
                          ]"
                          :aria-label="task.done ? 'علامت به عنوان انجام‌نشده' : 'علامت به عنوان انجام‌شده'"
                          @click.stop="handleToggleTask(dayWithTask.pDate!, task.id)"
                        >
                          <svg
                            v-if="task.done"
                            class="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="3"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>

                        <!-- Task Title -->
                        <span
                          class="text-xs sm:text-sm transition-all truncate flex-1 cursor-pointer"
                          :class="[
                            task.done
                              ? 'text-slate-500 line-through'
                              : 'text-slate-800 font-medium'
                          ]"
                          @click="goToTimelineDay(dayWithTask.pDate!)"
                        >
                          {{ task.title }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Slanted Divider Line (خط اریب) separating this month and the next month -->
        <div
          v-if="idx < monthsData.length - 1"
          class="relative w-full h-7 sm:h-9 overflow-hidden block select-none pointer-events-none -my-px"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1000 36"
            preserveAspectRatio="none"
            class="w-full h-full block"
          >
            <!-- Upper polygon matching Month N background -->
            <polygon points="0,0 1000,0 1000,0 0,36" :fill="monthData.meta.hexBg" />
            <!-- Lower polygon matching Month N+1 background -->
            <polygon points="0,36 1000,0 1000,36 0,36" :fill="monthsData[idx + 1].meta.hexBg" />
            <!-- Slanted separator line (خط اریب) -->
            <line
              x1="0"
              y1="36"
              x2="1000"
              y2="0"
              :stroke="monthData.meta.lineStroke"
              stroke-width="2.5"
            />
          </svg>
        </div>
      </template>
    </main>
  </div>

  <!-- Floating 'Return to Today' Button (always visible, styled to match this page) -->
  <button
    type="button"
    class="pointer-events-auto absolute bottom-4 left-6 z-30 flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-900/25 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer backdrop-blur-xs"
    title="بازگشت به امروز"
    aria-label="بازگشت به امروز"
    @click="handleScrollToToday"
  >
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M18 6H11a5 5 0 0 0 0 10h7M15 13l3 3-3 3" />
    </svg>
    <span>برگشت به امروز</span>
  </button>
</div>
</template>

<style scoped>
/* Hide scrollbar for clean horizontal jump bar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
