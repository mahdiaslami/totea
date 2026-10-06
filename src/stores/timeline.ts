import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DayItem, Task } from '../modules/timeline/date'
import { PersianDate } from '../modules/timeline/PersianDate'

export const BUFFER_DAYS = 7
export const WINDOW_SIZE = BUFFER_DAYS * 2 + 1 // 15
export const CENTER_INDEX = BUFFER_DAYS // 7

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
  const todayIndex = ref(CENTER_INDEX)
  const currentDayIndex = ref(CENTER_INDEX)
  const activeDateTimestamp = ref<number>(PersianDate.startOfDay(PersianDate.today()).getTime())
  const persistedTasks = ref<Record<number, Task[]>>(loadPersistedTasks())

  function getTasksForDate(date: PersianDate): Task[] {
    const timeKey = PersianDate.startOfDay(date).getTime()
    return persistedTasks.value[timeKey] ? [...persistedTasks.value[timeKey]] : []
  }

  // Enforce strictly 15 days in memory and DOM at all times:
  // 7 days in past, 1 active day, 7 days in future
  function setWindowAroundDate(centerDate: PersianDate) {
    const base = PersianDate.startOfDay(centerDate)
    const initial: DayItem[] = []
    for (let offset = -BUFFER_DAYS; offset <= BUFFER_DAYS; offset++) {
      const d = PersianDate.addDays(base, offset)
      initial.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = initial
    todayIndex.value = initial.findIndex((d) => d.date.isToday())
    currentDayIndex.value = CENTER_INDEX
    activeDateTimestamp.value = base.getTime()
  }

  function recenterAroundDate(centerDate: PersianDate) {
    setWindowAroundDate(centerDate)
  }

  function setTransitionDays(transitionDays: DayItem[], targetIndex: number) {
    days.value = transitionDays
    currentDayIndex.value = targetIndex
    if (transitionDays[targetIndex]) {
      activeDateTimestamp.value = transitionDays[targetIndex].date.getTime()
    }
    todayIndex.value = transitionDays.findIndex((d) => d.date.isToday())
  }

  function ensureInitialized() {
    if (days.value.length === WINDOW_SIZE) return
    setWindowAroundDate(PersianDate.today())
  }

  function appendFuture() {
    const current = days.value[currentDayIndex.value]?.date ?? new PersianDate(activeDateTimestamp.value)
    const next = PersianDate.addDays(current, 1)
    setWindowAroundDate(next)
  }

  function prependPast() {
    const current = days.value[currentDayIndex.value]?.date ?? new PersianDate(activeDateTimestamp.value)
    const prev = PersianDate.addDays(current, -1)
    setWindowAroundDate(prev)
  }

  function ensureDateLoaded(targetDate: PersianDate) {
    setWindowAroundDate(targetDate)
  }

  function setActiveDate(date: PersianDate) {
    setWindowAroundDate(date)
  }

  function setActiveDayIndex(index: number) {
    if (index >= 0 && index < days.value.length) {
      currentDayIndex.value = index
      activeDateTimestamp.value = days.value[index].date.getTime()
    }
  }

  function setActiveDateTimestamp(timestamp: number) {
    activeDateTimestamp.value = timestamp
  }

  function nextDay() {
    appendFuture()
  }

  function prevDay() {
    prependPast()
  }

  function goToToday() {
    setWindowAroundDate(PersianDate.today())
  }

  const currentDay = computed<DayItem | undefined>(() => days.value[currentDayIndex.value])
  const isViewingToday = computed(() => currentDayIndex.value === todayIndex.value)

  function toggleTaskByDate(date: PersianDate, taskId: string) {
    const timeKey = PersianDate.startOfDay(date).getTime()
    const tasks = persistedTasks.value[timeKey]
    if (!tasks) return
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      task.done = !task.done
      persistedTasks.value = {
        ...persistedTasks.value,
        [timeKey]: [...tasks],
      }
      savePersistedTasks(persistedTasks.value)

      const target = days.value.find((d) => d.date.getTime() === timeKey)
      if (target) {
        const dTask = target.tasks.find((t) => t.id === taskId)
        if (dTask) dTask.done = task.done
      }
    }
  }

  function toggleTask(day: DayItem, taskId: string) {
    toggleTaskByDate(day.date, taskId)
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

    const currentList = persistedTasks.value[timeKey] ? [...persistedTasks.value[timeKey]] : []
    currentList.push(newTask)
    persistedTasks.value = {
      ...persistedTasks.value,
      [timeKey]: currentList,
    }
    savePersistedTasks(persistedTasks.value)
  }

  function deleteTask(day: DayItem, taskId: string) {
    deleteMultipleTasks(day, [taskId])
  }

  function deleteMultipleTasks(day: DayItem, taskIds: string[]) {
    if (!taskIds.length) return
    const idSet = new Set(taskIds)
    const timeKey = PersianDate.startOfDay(day.date).getTime()
    const target = days.value.find((d) => d.date.getTime() === timeKey)
    if (target) {
      target.tasks = target.tasks.filter((t) => !idSet.has(t.id))
    }
    if (persistedTasks.value[timeKey]) {
      persistedTasks.value = {
        ...persistedTasks.value,
        [timeKey]: persistedTasks.value[timeKey].filter((t) => !idSet.has(t.id)),
      }
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
    activeDateTimestamp,
    isViewingToday,
    setWindowAroundDate,
    recenterAroundDate,
    setTransitionDays,
    appendFuture,
    prependPast,
    nextDay,
    prevDay,
    goToToday,
    ensureDateLoaded,
    setActiveDate,
    setActiveDayIndex,
    setActiveDateTimestamp,
    toggleTask,
    toggleTaskByDate,
    persistedTasks,
    getTasksForDate,
    addTask,
    deleteTask,
    deleteMultipleTasks,
  }
})
