<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDevModeStore } from '@/stores/devMode'
import { useTimelineStore } from '@/stores/timeline'
import {
  PersianDate,
  toPersianDigits,
  MONTHS_FA,
  getDaysInJalaliMonth,
} from '@/modules/timeline/PersianDate'

defineOptions({
  name: 'SettingsView',
})

const router = useRouter()
const devModeStore = useDevModeStore()
const timelineStore = useTimelineStore()

// Jalali Date Picker State for Developer Mode
const initialJalali = devModeStore.simulatedDate.toJalali()
const selectedPickerYear = ref(initialJalali.year)
const selectedPickerMonth = ref(initialJalali.month)
const selectedPickerDay = ref(initialJalali.day)

// Toast feedback
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

// Available Years list for Picker (1398 to 1410)
const availableYears = computed(() => {
  const currentY = new PersianDate().toJalali().year
  const years: number[] = []
  for (let y = currentY - 3; y <= currentY + 5; y++) {
    years.push(y)
  }
  return years
})

// Number of days in the currently selected Jalali month
const maxDaysInMonth = computed(() => {
  return getDaysInJalaliMonth(selectedPickerYear.value, selectedPickerMonth.value)
})

// Keep day valid when month or year changes
watch([selectedPickerYear, selectedPickerMonth], () => {
  if (selectedPickerDay.value > maxDaysInMonth.value) {
    selectedPickerDay.value = maxDaysInMonth.value
  }
})

// Keep picker inputs synced if simulated date changes outside
watch(
  () => devModeStore.simulatedDate,
  (newDate) => {
    const j = newDate.toJalali()
    selectedPickerYear.value = j.year
    selectedPickerMonth.value = j.month
    selectedPickerDay.value = j.day
  }
)

function handleApplyCustomDate() {
  const newDate = PersianDate.fromJalali(
    selectedPickerYear.value,
    selectedPickerMonth.value,
    selectedPickerDay.value
  )
  devModeStore.setSimulatedDate(newDate)
  showToast(`تاریخ به ${newDate.weekdayName}، ${newDate.formatJalali()} تنظیم شد`)
}

function handleAdvanceDays(count: number) {
  devModeStore.advanceDays(count)
  const sign = count > 0 ? `+${toPersianDigits(count)}` : toPersianDigits(count)
  showToast(`تاریخ ${sign} روز تغییر یافت`)
}

function handleResetRealDate() {
  devModeStore.resetToRealToday()
  showToast('تاریخ به امروز واقعی بازنشانی شد')
}

function handleManualRollover() {
  const moved = timelineStore.processRollovers()
  if (moved > 0) {
    showToast(`${toPersianDigits(moved)} تسک به روزهای بعد منتقل شد`)
  } else {
    showToast('تسکی برای انتقال وجود نداشت')
  }
}

function goToTimeline() {
  router.push('/')
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto bg-slate-50 select-none pb-12" dir="rtl">
    <!-- Top Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md shadow-xs">
      <div class="mx-auto flex max-w-xl items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-800">تنظیمات</h1>
          <p class="text-xs text-slate-400 mt-0.5">حالت توسعه‌دهنده و ابزارهای تست</p>
        </div>
        <div
          v-if="devModeStore.isEnabled"
          class="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300 shrink-0"
        >
          <span class="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>توسعه‌دهنده فعال</span>
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      <!-- Main Developer Mode Panel (Clean, Spacious, No nested card clutter) -->
      <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <!-- Section Header with Toggle -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div class="min-w-0">
              <h2 class="text-base font-bold text-slate-900 truncate">حالت توسعه‌دهنده</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                شبیه‌سازی تاریخ امروز برای تست تسک‌های پیگیری‌شونده
              </p>
            </div>
          </div>

          <!-- Toggle Switch -->
          <button
            type="button"
            class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
            :class="devModeStore.isEnabled ? 'bg-amber-500' : 'bg-slate-300'"
            role="switch"
            :aria-checked="devModeStore.isEnabled"
            @click="devModeStore.toggleDevMode()"
          >
            <span
              class="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
              :class="devModeStore.isEnabled ? '-translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>

        <!-- Controls when Developer Mode is ON -->
        <div v-if="devModeStore.isEnabled" class="mt-6 pt-6 border-t border-slate-100 space-y-6">
          <!-- 1. Current Date Display & Reset Row -->
          <div class="flex items-center justify-between gap-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 px-4 py-3">
            <div class="min-w-0">
              <span class="block text-[11px] font-semibold text-amber-800">امروز شبیه‌سازی‌شده:</span>
              <span class="text-sm sm:text-base font-bold text-slate-900 mt-0.5 block truncate">
                {{ devModeStore.simulatedDate.weekdayName }}، {{ devModeStore.simulatedDate.formatJalali() }}
              </span>
            </div>

            <button
              type="button"
              class="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100/60 transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
              @click="handleResetRealDate"
            >
              امروز واقعی
            </button>
          </div>

          <!-- 2. Quick Day Stepper -->
          <div>
            <h3 class="text-xs font-bold text-slate-700 mb-2.5">جابه‌جایی سریع تاریخ امروز:</h3>
            <div class="grid grid-cols-4 gap-2">
              <button
                type="button"
                class="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer whitespace-nowrap shadow-2xs"
                @click="handleAdvanceDays(-1)"
              >
                ۱- روز
              </button>

              <button
                type="button"
                class="flex items-center justify-center rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 active:scale-95 transition cursor-pointer whitespace-nowrap shadow-sm shadow-amber-500/25"
                @click="handleAdvanceDays(1)"
              >
                ۱+ روز
              </button>

              <button
                type="button"
                class="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer whitespace-nowrap shadow-2xs"
                @click="handleAdvanceDays(-7)"
              >
                ۷- روز
              </button>

              <button
                type="button"
                class="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer whitespace-nowrap shadow-2xs"
                @click="handleAdvanceDays(7)"
              >
                ۷+ روز
              </button>
            </div>
          </div>

          <!-- 3. Jalali Date Selector -->
          <div>
            <h3 class="text-xs font-bold text-slate-700 mb-2.5">انتخاب تاریخ دلخواه:</h3>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label for="picker-day" class="block text-[11px] font-medium text-slate-500 mb-1">
                  روز:
                </label>
                <select
                  id="picker-day"
                  v-model.number="selectedPickerDay"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option v-for="d in maxDaysInMonth" :key="d" :value="d">
                    {{ toPersianDigits(d) }}
                  </option>
                </select>
              </div>

              <div>
                <label for="picker-month" class="block text-[11px] font-medium text-slate-500 mb-1">
                  ماه:
                </label>
                <select
                  id="picker-month"
                  v-model.number="selectedPickerMonth"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option
                    v-for="(name, mIdx) in MONTHS_FA"
                    :key="mIdx + 1"
                    :value="mIdx + 1"
                  >
                    {{ name }}
                  </option>
                </select>
              </div>

              <div>
                <label for="picker-year" class="block text-[11px] font-medium text-slate-500 mb-1">
                  سال:
                </label>
                <select
                  id="picker-year"
                  v-model.number="selectedPickerYear"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option v-for="y in availableYears" :key="y" :value="y">
                    {{ toPersianDigits(y) }}
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              class="mt-2.5 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-white transition hover:bg-slate-900 active:scale-98 cursor-pointer whitespace-nowrap shadow-xs"
              @click="handleApplyCustomDate"
            >
              اعمال این تاریخ به عنوان امروز
            </button>
          </div>

          <!-- 4. Action Buttons -->
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 active:scale-98 transition cursor-pointer whitespace-nowrap"
              @click="goToTimeline"
            >
              <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>مشاهده خط زمان</span>
            </button>

            <button
              type="button"
              class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-98 transition cursor-pointer whitespace-nowrap"
              @click="handleManualRollover"
            >
              <svg class="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>بررسی انتقال تسک‌ها</span>
            </button>
          </div>
        </div>
      </section>

      <!-- App Info at bottom -->
      <div class="pt-8 text-center text-xs text-slate-400">
        توتیا (Totea) · برنامه مدیریت کارها و تقویم روزانه
      </div>
    </div>

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
          class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md whitespace-nowrap"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
