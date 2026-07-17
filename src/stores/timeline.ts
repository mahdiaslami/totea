import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createDayItem,
  type DayItem,
  type Task,
} from '../modules/timeline/date'
import { PersianDate } from '../modules/timeline/PersianDate'

const PAGE_SIZE = 15

export const useTimelineStore = defineStore('timeline', () => {
  const days = ref<DayItem[]>([])
  const todayIndex = ref(0)

  function ensureInitialized() {
    if (days.value.length > 0) return
    const base = PersianDate.startOfDay(PersianDate.today())
    const initial: DayItem[] = []
    for (let offset = -PAGE_SIZE; offset <= PAGE_SIZE; offset++) {
      initial.push(createDayItem(PersianDate.addDays(base, offset)))
    }
    days.value = initial
    todayIndex.value = PAGE_SIZE
  }

  function appendFuture() {
    const last = days.value[days.value.length - 1]
    const next: DayItem[] = []
    for (let i = 1; i <= PAGE_SIZE; i++) {
      next.push(createDayItem(PersianDate.addDays(last.date, i)))
    }
    days.value = [...days.value, ...next]
  }

  function prependPast() {
    const first = days.value[0]
    const prev: DayItem[] = []
    for (let i = PAGE_SIZE; i >= 1; i--) {
      prev.push(createDayItem(PersianDate.addDays(first.date, -i)))
    }
    days.value = [...prev, ...days.value]
    todayIndex.value += PAGE_SIZE
  }

  function toggleTask(day: DayItem, taskId: string) {
    const target = days.value.find((d) => d.date.getTime() === day.date.getTime())
    if (!target) return
    const task: Task | undefined = target.tasks.find((t) => t.id === taskId)
    if (task) task.done = !task.done
  }

  const today = computed(() => days.value[todayIndex.value])

  ensureInitialized()

  return {
    days,
    today,
    todayIndex,
    appendFuture,
    prependPast,
    toggleTask,
  }
})
