import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PersianDate } from '@/modules/timeline/PersianDate'
import { useTimelineStore } from './timeline'

const DEV_MODE_ENABLED_KEY = 'totea_dev_mode_enabled'
const DEV_MODE_DATE_KEY = 'totea_dev_mode_date'

export const useDevModeStore = defineStore('devMode', () => {
  const isEnabled = ref<boolean>(localStorage.getItem(DEV_MODE_ENABLED_KEY) === 'true')
  const customTimestamp = ref<number | null>(
    localStorage.getItem(DEV_MODE_DATE_KEY)
      ? Number(localStorage.getItem(DEV_MODE_DATE_KEY))
      : null
  )

  // Initialize PersianDate on module load
  if (isEnabled.value && customTimestamp.value && !isNaN(customTimestamp.value)) {
    PersianDate.setCustomToday(new PersianDate(customTimestamp.value))
  } else {
    PersianDate.setCustomToday(null)
  }

  const simulatedDate = computed<PersianDate>(() => {
    if (isEnabled.value && customTimestamp.value && !isNaN(customTimestamp.value)) {
      return new PersianDate(customTimestamp.value)
    }
    return PersianDate.startOfDay(new PersianDate())
  })

  function notifyTimelineSync() {
    try {
      const timelineStore = useTimelineStore()
      timelineStore.syncToday()
    } catch {
      // Pinia might not be ready in some edge cases
    }
  }

  function toggleDevMode(enabled?: boolean) {
    const target = enabled !== undefined ? enabled : !isEnabled.value
    isEnabled.value = target
    localStorage.setItem(DEV_MODE_ENABLED_KEY, String(isEnabled.value))

    if (isEnabled.value) {
      // When turning ON, start fresh from real today to prevent jumping to stale dates
      const todayStart = PersianDate.startOfDay(new PersianDate()).getTime()
      customTimestamp.value = todayStart
      localStorage.setItem(DEV_MODE_DATE_KEY, String(todayStart))
      PersianDate.setCustomToday(new PersianDate(todayStart))
    } else {
      PersianDate.setCustomToday(null)
    }

    notifyTimelineSync()
  }

  function setSimulatedDate(date: PersianDate) {
    const startOf = PersianDate.startOfDay(date)
    customTimestamp.value = startOf.getTime()
    localStorage.setItem(DEV_MODE_DATE_KEY, String(customTimestamp.value))

    if (isEnabled.value) {
      PersianDate.setCustomToday(startOf)
      notifyTimelineSync()
    }
  }

  function advanceDays(daysCount: number) {
    const current = simulatedDate.value
    const next = PersianDate.addDays(current, daysCount)
    setSimulatedDate(next)
  }

  function resetToRealToday() {
    const realToday = PersianDate.startOfDay(new PersianDate())
    setSimulatedDate(realToday)
  }

  return {
    isEnabled,
    customTimestamp,
    simulatedDate,
    toggleDevMode,
    setSimulatedDate,
    advanceDays,
    resetToRealToday,
  }
})
