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
    processRollovers()
    if (days.value.length === WINDOW_SIZE) return
    setWindowAroundDate(PersianDate.today())
  }

  function appendDays(count = 2) {
    if (days.value.length === 0) return
    const lastDate = days.value[days.value.length - 1].date
    const newItems: DayItem[] = []
    for (let i = 1; i <= count; i++) {
      const d = PersianDate.addDays(lastDate, i)
      newItems.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = [...days.value, ...newItems]
  }

  function prependDays(count = 2): number {
    if (days.value.length === 0) return currentDayIndex.value
    const firstDate = days.value[0].date
    const newItems: DayItem[] = []
    for (let i = count; i >= 1; i--) {
      const d = PersianDate.addDays(firstDate, -i)
      newItems.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    days.value = [...newItems, ...days.value]
    currentDayIndex.value += count
    todayIndex.value = days.value.findIndex((d) => d.date.isToday())
    return currentDayIndex.value
  }

  function shiftDaysForward(count = 2): number {
    if (days.value.length === 0) return currentDayIndex.value
    const currentActiveTs = activeDateTimestamp.value
    const lastDate = days.value[days.value.length - 1].date
    const newItems: DayItem[] = []
    for (let i = 1; i <= count; i++) {
      const d = PersianDate.addDays(lastDate, i)
      newItems.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    const updated = [...days.value.slice(count), ...newItems]
    days.value = updated
    todayIndex.value = updated.findIndex((d) => d.date.isToday())
    let newIdx = updated.findIndex((d) => d.date.getTime() === currentActiveTs)
    if (newIdx === -1) {
      newIdx = Math.max(0, currentDayIndex.value - count)
    }
    currentDayIndex.value = newIdx
    return newIdx
  }

  function shiftDaysBackward(count = 2): number {
    if (days.value.length === 0) return currentDayIndex.value
    const currentActiveTs = activeDateTimestamp.value
    const firstDate = days.value[0].date
    const newItems: DayItem[] = []
    for (let i = count; i >= 1; i--) {
      const d = PersianDate.addDays(firstDate, -i)
      newItems.push({
        date: d,
        tasks: getTasksForDate(d),
      })
    }
    const updated = [...newItems, ...days.value.slice(0, days.value.length - count)]
    days.value = updated
    todayIndex.value = updated.findIndex((d) => d.date.isToday())
    let newIdx = updated.findIndex((d) => d.date.getTime() === currentActiveTs)
    if (newIdx === -1) {
      newIdx = Math.min(updated.length - 1, currentDayIndex.value + count)
    }
    currentDayIndex.value = newIdx
    return newIdx
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

  function processRollovers(): number {
    const today = PersianDate.startOfDay(PersianDate.today())
    const todayTs = today.getTime()
    let movedCount = 0

    const newTasksMap: Record<number, Task[]> = {}
    for (const key of Object.keys(persistedTasks.value)) {
      const ts = Number(key)
      newTasksMap[ts] = [...(persistedTasks.value[ts] || [])]
    }

    const allTimestamps = Object.keys(newTasksMap).map(Number)

    for (const sourceTs of allTimestamps) {
      const tasksOnDay = newTasksMap[sourceTs] || []
      const remainingTasks: Task[] = []

      for (const task of tasksOnDay) {
        if (task.isTracked && !task.done) {
          const originTs = task.originalDateTimestamp || sourceTs
          const allowedDays =
            task.allowedDays && task.allowedDays.length > 0
              ? task.allowedDays
              : [6, 0, 1, 2, 3, 4, 5]

          // Determine target date: earliest allowed day >= max(originTs, todayTs)
          const baseTs = Math.max(originTs, todayTs)

          let destDate = new PersianDate(baseTs)
          let found = false
          for (let i = 0; i < 14; i++) {
            const candidate = PersianDate.addDays(new PersianDate(baseTs), i)
            if (allowedDays.includes(candidate.value.getDay())) {
              destDate = candidate
              found = true
              break
            }
          }
          if (!found) {
            destDate = new PersianDate(baseTs)
          }

          const destTs = PersianDate.startOfDay(destDate).getTime()

          if (destTs !== sourceTs) {
            const updatedTask: Task = {
              ...task,
              originalDateTimestamp: originTs,
              lastRolloverDateTimestamp: todayTs,
              rolloverCount: (task.rolloverCount || 0) + (destTs > sourceTs ? 1 : 0),
            }

            const currentDestList = (newTasksMap[destTs] || []).filter((t) => t.id !== task.id)
            newTasksMap[destTs] = [...currentDestList, updatedTask]
            movedCount++
          } else {
            remainingTasks.push(task)
          }
        } else {
          remainingTasks.push(task)
        }
      }

      newTasksMap[sourceTs] = remainingTasks
    }

    if (movedCount > 0) {
      persistedTasks.value = newTasksMap
      savePersistedTasks(newTasksMap)

      for (const day of days.value) {
        const timeKey = day.date.getTime()
        day.tasks = newTasksMap[timeKey] ? [...newTasksMap[timeKey]] : []
      }
    }

    return movedCount
  }

  function syncToday() {
    processRollovers()
    const today = PersianDate.today()
    setWindowAroundDate(today)
  }

  function addTask(
    date: PersianDate,
    title: string,
    options?: { isTracked?: boolean; allowedDays?: number[] }
  ) {
    const trimmed = title.trim()
    if (!trimmed) return
    const timeKey = PersianDate.startOfDay(date).getTime()
    const isTracked = options?.isTracked ?? false
    const allowedDays = options?.allowedDays ?? [6, 0, 1, 2, 3, 4, 5]

    const newTask: Task = {
      id: `${timeKey}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: trimmed,
      done: false,
      isTracked,
      allowedDays: isTracked ? allowedDays : undefined,
      originalDateTimestamp: timeKey,
      rolloverCount: 0,
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

  function updateTask(
    day: DayItem,
    taskId: string,
    newTitle: string,
    options?: { isTracked?: boolean; allowedDays?: number[] }
  ) {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    const timeKey = PersianDate.startOfDay(day.date).getTime()
    const tasks = persistedTasks.value[timeKey]
    if (tasks) {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        task.title = trimmed
        if (options?.isTracked !== undefined) {
          task.isTracked = options.isTracked
          task.allowedDays = options.isTracked
            ? (options.allowedDays ?? [6, 0, 1, 2, 3, 4, 5])
            : undefined
        }
        persistedTasks.value = {
          ...persistedTasks.value,
          [timeKey]: [...tasks],
        }
        savePersistedTasks(persistedTasks.value)
      }
    }
    const target = days.value.find((d) => d.date.getTime() === timeKey)
    if (target) {
      const dTask = target.tasks.find((t) => t.id === taskId)
      if (dTask) {
        dTask.title = trimmed
        if (options?.isTracked !== undefined) {
          dTask.isTracked = options.isTracked
          dTask.allowedDays = options.isTracked
            ? (options.allowedDays ?? [6, 0, 1, 2, 3, 4, 5])
            : undefined
        }
      }
    }
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
    appendDays,
    prependDays,
    shiftDaysForward,
    shiftDaysBackward,
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
    updateTask,
    deleteTask,
    deleteMultipleTasks,
    processRollovers,
    syncToday,
  }
})
