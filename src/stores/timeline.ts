import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DayItem, Task } from '../modules/timeline/date'
import { PersianDate } from '../modules/timeline/PersianDate'

const PAGE_SIZE = 7

const STORAGE_KEY = 'totea_tasks_v1'

function loadPersistedTasks(): Record<number, Task[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function savePersistedTasks(tasksMap: Record<number, Task[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksMap))
  } catch {
    // ignore
  }
}

export const useTimelineStore = defineStore('timeline', () => {
  const days = ref<DayItem[]>([])
  const todayIndex = ref(0)
  const currentDayIndex = ref(0)
  const persistedTasks = ref<Record<number, Task[]>>(loadPersistedTasks())

  function getTasksForDate(date: PersianDate): Task[] {
    const timeKey = PersianDate.startOfDay(date).getTime()
    return persistedTasks.value[timeKey] ? [...persistedTasks.value[timeKey]] : []
  }

  function ensureInitialized() {
    if (days.value.length > 0) return
    const base = PersianDate.startOfDay(PersianDate.today())
    const initial: DayItem[] = []
    for (let offset = -PAGE_SIZE; offset <= PAGE_SIZE; offset++) {
      const d = PersianDate.addDays(base, offset)
      initial.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = initial
    todayIndex.value = PAGE_SIZE
    currentDayIndex.value = PAGE_SIZE
  }

  function appendFuture() {
    const last = days.value[days.value.length - 1]
    const next: DayItem[] = []
    for (let i = 1; i <= PAGE_SIZE; i++) {
      const d = PersianDate.addDays(last.date, i)
      next.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = [...days.value, ...next]
  }

  function prependPast() {
    const first = days.value[0]
    const prev: DayItem[] = []
    for (let i = PAGE_SIZE; i >= 1; i--) {
      const d = PersianDate.addDays(first.date, -i)
      prev.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = [...prev, ...days.value]
    todayIndex.value += PAGE_SIZE
    currentDayIndex.value += PAGE_SIZE
  }

  function nextDay() {
    if (currentDayIndex.value < days.value.length - 1) {
      currentDayIndex.value++
      if (currentDayIndex.value >= days.value.length - 3) {
        appendFuture()
      }
    } else {
      appendFuture()
      currentDayIndex.value++
    }
  }

  function prevDay() {
    if (currentDayIndex.value > 0) {
      currentDayIndex.value--
      if (currentDayIndex.value <= 3) {
        prependPast()
      }
    } else {
      prependPast()
      currentDayIndex.value = Math.max(0, currentDayIndex.value - 1)
    }
  }

  function goToToday() {
    currentDayIndex.value = todayIndex.value
  }

  const currentDay = computed<DayItem | undefined>(() => days.value[currentDayIndex.value])
  const isViewingToday = computed(() => currentDayIndex.value === todayIndex.value)

  function toggleTask(day: DayItem, taskId: string) {
    const target = days.value.find((d) => d.date.getTime() === day.date.getTime())
    if (!target) return
    const task: Task | undefined = target.tasks.find((t) => t.id === taskId)
    if (task) {
      task.done = !task.done
      const timeKey = PersianDate.startOfDay(target.date).getTime()
      persistedTasks.value[timeKey] = [...target.tasks]
      savePersistedTasks(persistedTasks.value)
    }
  }

  function addTask(date: PersianDate, title: string) {
    const trimmed = title.trim()
    if (!trimmed) return
    const timeKey = PersianDate.startOfDay(date).getTime()
    const newTask: Task = {
      id: `${timeKey}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmed,
      done: false,
    }

    const target = days.value.find((d) => d.date.getTime() === timeKey)
    if (target) {
      target.tasks.push(newTask)
    }

    if (!persistedTasks.value[timeKey]) {
      persistedTasks.value[timeKey] = []
    }
    persistedTasks.value[timeKey].push(newTask)
    savePersistedTasks(persistedTasks.value)
  }

  function deleteTask(day: DayItem, taskId: string) {
    const timeKey = PersianDate.startOfDay(day.date).getTime()
    const target = days.value.find((d) => d.date.getTime() === timeKey)
    if (target) {
      target.tasks = target.tasks.filter((t) => t.id !== taskId)
    }
    if (persistedTasks.value[timeKey]) {
      persistedTasks.value[timeKey] = persistedTasks.value[timeKey].filter((t) => t.id !== taskId)
      savePersistedTasks(persistedTasks.value)
    }
  }

  const today = computed(() => days.value[todayIndex.value])

  ensureInitialized()

  return {
    days,
    today,
    todayIndex,
    currentDayIndex,
    currentDay,
    isViewingToday,
    appendFuture,
    prependPast,
    nextDay,
    prevDay,
    goToToday,
    toggleTask,
    addTask,
    deleteTask,
  }
})
