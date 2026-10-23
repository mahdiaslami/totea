import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  PersianDate,
  MONTHS_FA,
  getDaysInJalaliMonth,
  toPersianDigits,
} from '@/modules/timeline/PersianDate'

export type HabitPeriod = 'daily' | 'weekly' | 'monthly'

export interface HabitHistoryItem {
  key: string
  label: string
  sublabel?: string
  isCurrent: boolean
  status: 'completed' | 'missed' | 'pending' | 'empty'
}

export interface HabitCurrentStatus {
  type: 'completed' | 'today_pending' | 'upcoming' | 'empty'
  message: string
}

export interface HabitStreakOverview {
  streak: number
  periodUnit: string
  streakLabel: string
  title: string
  currentStatus: HabitCurrentStatus
  items: HabitHistoryItem[]
}

export interface HabitTask {
  id: string
  title: string
}

export interface Habit {
  id: string
  title: string
  period: HabitPeriod
  // For daily: tasks that repeat every day
  dailyTasks?: HabitTask[]
  // For weekly: key is JS weekday index (6: شنبه, 0: یک‌شنبه, 1: دوشنبه, 2: سه‌شنبه, 3: چهارشنبه, 4: پنج‌شنبه, 5: جمعه)
  weeklySchedule?: Record<number, HabitTask[]>
  // For monthly: key is Jalali day of month (1 to 31)
  monthlySchedule?: Record<number, HabitTask[]>
  createdAt: number
  // Record of completed tasks: key is `${dateTimestamp}_${taskId}`, value is true
  completedTaskDates?: Record<string, boolean>
}

const STORAGE_KEY = 'totea_habits_v1'

export const WEEKDAYS_MAP = [
  { dayIndex: 6, name: 'شنبه', shortName: 'ش' },
  { dayIndex: 0, name: 'یک‌شنبه', shortName: 'ی' },
  { dayIndex: 1, name: 'دوشنبه', shortName: 'د' },
  { dayIndex: 2, name: 'سه‌شنبه', shortName: 'س' },
  { dayIndex: 3, name: 'چهارشنبه', shortName: 'چ' },
  { dayIndex: 4, name: 'پنج‌شنبه', shortName: 'پ' },
  { dayIndex: 5, name: 'جمعه', shortName: 'ج' },
]

function getInitialHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to load habits from localStorage', err)
  }

  // Initial starter habits demonstrating Daily, Weekly, and Monthly
  return [
    {
      id: 'habit-morning-routine',
      title: 'روتین صبحگاهی و شادابی',
      period: 'daily',
      dailyTasks: [
        { id: 'dt-1', title: 'نوشیدن یک لیوان آب ولرم' },
        { id: 'dt-2', title: '۱۰ دقیقه نرمش و حرکات کششی' },
        { id: 'dt-3', title: 'مرور ۳ اولویت مهم روز' },
      ],
      createdAt: Date.now() - 86400000 * 5,
      completedTaskDates: {},
    },
    {
      id: 'habit-workout-weekly',
      title: 'برنامه ورزشی هفتگی',
      period: 'weekly',
      weeklySchedule: {
        6: [
          { id: 'wt-sat-1', title: 'تمرین هوازی و طناب زدن (۳۰ دقیقه)' },
          { id: 'wt-sat-2', title: 'حرکات شکم و میان‌تنه' },
        ],
        1: [
          { id: 'wt-mon-1', title: 'تمرین قدرتی عضلات بالاتنه' },
        ],
        3: [
          { id: 'wt-wed-1', title: 'تمرین قدرتی پا و عضلات پایین‌تنه' },
        ],
        5: [
          { id: 'wt-fri-1', title: 'پیاده‌روی آرام در طبیعت یا استخر' },
        ],
      },
      createdAt: Date.now() - 86400000 * 10,
      completedTaskDates: {},
    },
    {
      id: 'habit-monthly-review',
      title: 'انضباط و چکاپ ماهانه',
      period: 'monthly',
      monthlySchedule: {
        1: [
          { id: 'mt-1-1', title: 'محاسبه درآمد و مخارج ماه قبل' },
          { id: 'mt-1-2', title: 'تعیین اهداف مالی و بودجه ماه جاری' },
        ],
        15: [
          { id: 'mt-15-1', title: 'بررسی نیم‌ماهه پیشرفت پروژه‌ها و اصلاح مسیر' },
        ],
        30: [
          { id: 'mt-30-1', title: 'پشتیبان‌گیری از اطلاعات دیجیتال و پاکسازی فایل‌ها' },
        ],
      },
      createdAt: Date.now() - 86400000 * 20,
      completedTaskDates: {},
    },
  ]
}

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>(getInitialHabits())

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits.value))
    } catch (err) {
      console.error('Failed to save habits to localStorage', err)
    }
  }

  function createHabit(data: {
    title: string
    period: HabitPeriod
    dailyTasks?: HabitTask[]
    weeklySchedule?: Record<number, HabitTask[]>
    monthlySchedule?: Record<number, HabitTask[]>
  }): Habit {
    const newHabit: Habit = {
      id: 'habit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      title: data.title.trim(),
      period: data.period,
      dailyTasks: data.period === 'daily' ? (data.dailyTasks || []) : undefined,
      weeklySchedule: data.period === 'weekly' ? (data.weeklySchedule || {}) : undefined,
      monthlySchedule: data.period === 'monthly' ? (data.monthlySchedule || {}) : undefined,
      createdAt: Date.now(),
      completedTaskDates: {},
    }
    habits.value.unshift(newHabit)
    persist()
    return newHabit
  }

  function updateHabit(
    id: string,
    data: {
      title?: string
      period?: HabitPeriod
      dailyTasks?: HabitTask[]
      weeklySchedule?: Record<number, HabitTask[]>
      monthlySchedule?: Record<number, HabitTask[]>
    }
  ) {
    const habit = habits.value.find((h) => h.id === id)
    if (!habit) return
    if (data.title !== undefined) habit.title = data.title.trim()
    if (data.period !== undefined) habit.period = data.period
    if (habit.period === 'daily') {
      habit.dailyTasks = data.dailyTasks || habit.dailyTasks || []
      habit.weeklySchedule = undefined
      habit.monthlySchedule = undefined
    } else if (habit.period === 'weekly') {
      habit.weeklySchedule = data.weeklySchedule || habit.weeklySchedule || {}
      habit.dailyTasks = undefined
      habit.monthlySchedule = undefined
    } else if (habit.period === 'monthly') {
      habit.monthlySchedule = data.monthlySchedule || habit.monthlySchedule || {}
      habit.dailyTasks = undefined
      habit.weeklySchedule = undefined
    }
    persist()
  }

  function deleteHabit(id: string) {
    habits.value = habits.value.filter((h) => h.id !== id)
    persist()
  }

  function addHabitTask(
    habitId: string,
    title: string,
    target?: { weekday?: number; monthDay?: number }
  ): HabitTask | null {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return null
    const newTask: HabitTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
    }

    if (habit.period === 'daily') {
      if (!habit.dailyTasks) habit.dailyTasks = []
      habit.dailyTasks.push(newTask)
    } else if (habit.period === 'weekly') {
      const day = target?.weekday ?? 6
      if (!habit.weeklySchedule) habit.weeklySchedule = {}
      if (!habit.weeklySchedule[day]) habit.weeklySchedule[day] = []
      habit.weeklySchedule[day].push(newTask)
    } else if (habit.period === 'monthly') {
      const day = target?.monthDay ?? 1
      if (!habit.monthlySchedule) habit.monthlySchedule = {}
      if (!habit.monthlySchedule[day]) habit.monthlySchedule[day] = []
      habit.monthlySchedule[day].push(newTask)
    }
    persist()
    return newTask
  }

  function updateHabitTask(
    habitId: string,
    taskId: string,
    newTitle: string,
    target?: { weekday?: number; monthDay?: number }
  ) {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return
    const trimmed = newTitle.trim()

    if (habit.period === 'daily') {
      const item = habit.dailyTasks?.find((t) => t.id === taskId)
      if (item) item.title = trimmed
    } else if (habit.period === 'weekly') {
      const day = target?.weekday ?? 6
      const item = habit.weeklySchedule?.[day]?.find((t) => t.id === taskId)
      if (item) item.title = trimmed
    } else if (habit.period === 'monthly') {
      const day = target?.monthDay ?? 1
      const item = habit.monthlySchedule?.[day]?.find((t) => t.id === taskId)
      if (item) item.title = trimmed
    }
    persist()
  }

  function deleteHabitTask(
    habitId: string,
    taskId: string,
    target?: { weekday?: number; monthDay?: number }
  ) {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return

    if (habit.period === 'daily') {
      if (habit.dailyTasks) {
        habit.dailyTasks = habit.dailyTasks.filter((t) => t.id !== taskId)
      }
    } else if (habit.period === 'weekly') {
      const day = target?.weekday ?? 6
      if (habit.weeklySchedule?.[day]) {
        habit.weeklySchedule[day] = habit.weeklySchedule[day].filter((t) => t.id !== taskId)
      }
    } else if (habit.period === 'monthly') {
      const day = target?.monthDay ?? 1
      if (habit.monthlySchedule?.[day]) {
        habit.monthlySchedule[day] = habit.monthlySchedule[day].filter((t) => t.id !== taskId)
      }
    }
    persist()
  }

  function deleteHabitTasks(
    habitId: string,
    taskIds: string[],
    target?: { weekday?: number; monthDay?: number }
  ) {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return
    const idSet = new Set(taskIds)

    if (habit.period === 'daily') {
      if (habit.dailyTasks) {
        habit.dailyTasks = habit.dailyTasks.filter((t) => !idSet.has(t.id))
      }
    } else if (habit.period === 'weekly') {
      const day = target?.weekday ?? 6
      if (habit.weeklySchedule?.[day]) {
        habit.weeklySchedule[day] = habit.weeklySchedule[day].filter((t) => !idSet.has(t.id))
      }
    } else if (habit.period === 'monthly') {
      const day = target?.monthDay ?? 1
      if (habit.monthlySchedule?.[day]) {
        habit.monthlySchedule[day] = habit.monthlySchedule[day].filter((t) => !idSet.has(t.id))
      }
    }
    persist()
  }

  // Get tasks scheduled for a specific habit on a given Persian date
  function getTasksForHabitOnDate(habit: Habit, date: PersianDate): HabitTask[] {
    if (habit.period === 'daily') {
      return habit.dailyTasks || []
    }
    if (habit.period === 'weekly') {
      const weekday = date.value.getDay()
      return habit.weeklySchedule?.[weekday] || []
    }
    if (habit.period === 'monthly') {
      const jDay = date.toJalali().day
      return habit.monthlySchedule?.[jDay] || []
    }
    return []
  }

  // Check if a habit has any tasks scheduled for a given date
  function isHabitActiveOnDate(habit: Habit, date: PersianDate): boolean {
    return getTasksForHabitOnDate(habit, date).length > 0
  }

  // Get completion status of a task on a given date
  function isTaskCompletedOnDate(habitId: string, taskId: string, date: PersianDate): boolean {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit || !habit.completedTaskDates) return false
    const dateKey = PersianDate.startOfDay(date).getTime()
    return Boolean(habit.completedTaskDates[`${dateKey}_${taskId}`])
  }

  // Toggle completion of a task on a given date
  function toggleTaskCompletion(habitId: string, taskId: string, date: PersianDate) {
    const habit = habits.value.find((h) => h.id === habitId)
    if (!habit) return
    if (!habit.completedTaskDates) {
      habit.completedTaskDates = {}
    }
    const dateKey = PersianDate.startOfDay(date).getTime()
    const recordKey = `${dateKey}_${taskId}`
    if (habit.completedTaskDates[recordKey]) {
      delete habit.completedTaskDates[recordKey]
    } else {
      habit.completedTaskDates[recordKey] = true
    }
    persist()
  }

  // Count total tasks in habit across all schedules
  function getTotalTasksCount(habit: Habit): number {
    if (habit.period === 'daily') {
      return habit.dailyTasks?.length || 0
    }
    if (habit.period === 'weekly') {
      if (!habit.weeklySchedule) return 0
      return Object.values(habit.weeklySchedule).reduce((acc, tasks) => acc + tasks.length, 0)
    }
    if (habit.period === 'monthly') {
      if (!habit.monthlySchedule) return 0
      return Object.values(habit.monthlySchedule).reduce((acc, tasks) => acc + tasks.length, 0)
    }
    return 0
  }

  // -------------------------------------------------------------
  // Daily Streak & History (Last 7 Days)
  // -------------------------------------------------------------
  function getDailyStreakOverview(habit: Habit): HabitStreakOverview {
    const today = PersianDate.today()
    const items: HabitHistoryItem[] = []
    const dayTasks = habit.dailyTasks || []
    const hasTasks = dayTasks.length > 0

    for (let i = 6; i >= 0; i--) {
      const d = PersianDate.addDays(today, -i)
      const isToday = i === 0
      let status: HabitHistoryItem['status'] = 'empty'

      if (hasTasks) {
        const allDone = dayTasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, d))
        if (allDone) {
          status = 'completed'
        } else if (isToday) {
          status = 'pending'
        } else {
          status = 'missed'
        }
      }

      const weekday = d.value.getDay()
      const weekdayItem = WEEKDAYS_MAP.find((w) => w.dayIndex === weekday)
      const label = weekdayItem ? weekdayItem.shortName : ''
      const sublabel = toPersianDigits(d.toJalali().day)

      items.push({
        key: `d-${d.value.getTime()}`,
        label,
        sublabel,
        isCurrent: isToday,
        status,
      })
    }

    let streak = 0
    let todayDone = false
    if (hasTasks) {
      todayDone = dayTasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, today))
      let checkDate = todayDone ? today : PersianDate.addDays(today, -1)

      for (let i = 0; i < 365; i++) {
        const allDone = dayTasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, checkDate))
        if (allDone) {
          streak++
          checkDate = PersianDate.addDays(checkDate, -1)
        } else {
          break
        }
      }
    }

    let currentStatus: HabitCurrentStatus
    if (!hasTasks) {
      currentStatus = { type: 'empty', message: 'بدون تسک تعریف‌شده' }
    } else if (todayDone) {
      currentStatus = { type: 'completed', message: '✨ کارهای امروز انجام شد' }
    } else {
      currentStatus = { type: 'today_pending', message: '🎯 نوبت کارهای امروز' }
    }

    return {
      streak,
      periodUnit: 'روز',
      streakLabel: streak > 0 ? `${toPersianDigits(streak)} روز متوالی` : '۰ روز استمرار',
      title: '۷ روز گذشته',
      currentStatus,
      items,
    }
  }

  // -------------------------------------------------------------
  // Weekly Streak & History (Last 7 Weeks / Occasions)
  // -------------------------------------------------------------
  function getWeeklyStreakOverview(habit: Habit): HabitStreakOverview {
    const today = PersianDate.today()
    const todayWeekday = today.value.getDay()
    const daysSinceSat = (todayWeekday + 1) % 7
    const currentWeekSat = PersianDate.addDays(today, -daysSinceSat)

    const activeEntries = Object.entries(habit.weeklySchedule || {}).filter(
      ([, tasks]) => tasks && tasks.length > 0
    )
    const activeWeekdays = activeEntries.map(([d]) => Number(d))
    const isSingleDay = activeWeekdays.length === 1
    const singleWeekdayIndex = isSingleDay ? activeWeekdays[0] : null
    const singleWeekdayInfo = singleWeekdayIndex !== null
      ? WEEKDAYS_MAP.find((w) => w.dayIndex === singleWeekdayIndex)
      : null

    const hasScheduledTasks = activeWeekdays.length > 0

    function isWeekCompleted(startSat: PersianDate): boolean {
      if (!hasScheduledTasks || !habit.weeklySchedule) return false
      for (const weekday of activeWeekdays) {
        const dayOffset = (weekday + 1) % 7
        const dayDate = PersianDate.addDays(startSat, dayOffset)
        const tasks = habit.weeklySchedule[weekday] || []
        const allDone = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, dayDate))
        if (!allDone) return false
      }
      return true
    }

    const items: HabitHistoryItem[] = []
    for (let w = 6; w >= 0; w--) {
      const weekSat = PersianDate.addDays(currentWeekSat, -w * 7)
      const isCurrent = w === 0
      let status: HabitHistoryItem['status'] = 'empty'

      if (hasScheduledTasks) {
        if (isSingleDay && singleWeekdayIndex !== null) {
          const singleDayOffset = (singleWeekdayIndex + 1) % 7
          const singleDate = PersianDate.addDays(weekSat, singleDayOffset)
          const tasks = habit.weeklySchedule?.[singleWeekdayIndex] || []
          const singleDone = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, singleDate))
          if (singleDone) {
            status = 'completed'
          } else if (singleDate.value.getTime() <= today.value.getTime()) {
            if (singleDate.value.getTime() === today.value.getTime()) {
              status = 'pending'
            } else {
              status = 'missed'
            }
          } else {
            status = 'pending'
          }
        } else {
          const allDone = isWeekCompleted(weekSat)
          if (allDone) {
            status = 'completed'
          } else if (isCurrent) {
            status = 'pending'
          } else {
            status = 'missed'
          }
        }
      }

      let targetDate = weekSat
      if (isSingleDay && singleWeekdayIndex !== null) {
        const singleDayOffset = (singleWeekdayIndex + 1) % 7
        targetDate = PersianDate.addDays(weekSat, singleDayOffset)
      }
      const jDate = targetDate.toJalali()
      const label = `${toPersianDigits(jDate.day)} ${MONTHS_FA[jDate.month - 1]}`
      const sublabel = isSingleDay && singleWeekdayInfo ? singleWeekdayInfo.name : undefined

      items.push({
        key: `w-${targetDate.value.getTime()}`,
        label,
        sublabel,
        isCurrent,
        status,
      })
    }

    let streak = 0
    if (hasScheduledTasks) {
      if (isSingleDay && singleWeekdayIndex !== null) {
        const singleDayOffset = (singleWeekdayIndex + 1) % 7
        const thisWeekDate = PersianDate.addDays(currentWeekSat, singleDayOffset)
        const tasks = habit.weeklySchedule?.[singleWeekdayIndex] || []
        const currentDone = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, thisWeekDate))
        const startW = currentDone ? 0 : 1
        for (let w = startW; w < 52; w++) {
          const pastWeekSat = PersianDate.addDays(currentWeekSat, -w * 7)
          const pastDate = PersianDate.addDays(pastWeekSat, singleDayOffset)
          const allDone = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, pastDate))
          if (allDone) {
            streak++
          } else {
            break
          }
        }
      } else {
        const currentWeekDone = isWeekCompleted(currentWeekSat)
        const startW = currentWeekDone ? 0 : 1
        for (let w = startW; w < 52; w++) {
          const weekSat = PersianDate.addDays(currentWeekSat, -w * 7)
          if (isWeekCompleted(weekSat)) {
            streak++
          } else {
            break
          }
        }
      }
    }

    let periodUnit = 'هفته'
    let streakLabel = '۰ هفته استمرار'
    if (isSingleDay && singleWeekdayInfo) {
      periodUnit = singleWeekdayInfo.name
      streakLabel = streak > 0 ? `${toPersianDigits(streak)} ${singleWeekdayInfo.name} متوالی` : `۰ ${singleWeekdayInfo.name} استمرار`
    } else {
      periodUnit = 'هفته'
      streakLabel = streak > 0 ? `${toPersianDigits(streak)} هفته کامل` : '۰ هفته استمرار'
    }

    let currentStatus: HabitCurrentStatus
    if (!hasScheduledTasks) {
      currentStatus = { type: 'empty', message: 'بدون روز فعال در هفته' }
    } else if (isSingleDay && singleWeekdayIndex !== null && singleWeekdayInfo) {
      const singleDayOffset = (singleWeekdayIndex + 1) % 7
      const thisWeekDate = PersianDate.addDays(currentWeekSat, singleDayOffset)
      const tasks = habit.weeklySchedule?.[singleWeekdayIndex] || []
      const doneThisWeek = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, thisWeekDate))

      if (doneThisWeek) {
        currentStatus = { type: 'completed', message: `✨ کار این هفته (${singleWeekdayInfo.name}) انجام شد` }
      } else if (todayWeekday === singleWeekdayIndex) {
        currentStatus = { type: 'today_pending', message: `🎯 امروز ${singleWeekdayInfo.name} است؛ نوبت این عادت!` }
      } else {
        let diffDays = (singleWeekdayIndex - todayWeekday + 7) % 7
        if (diffDays === 0) diffDays = 7
        currentStatus = {
          type: 'upcoming',
          message: `⏳ موعد بعدی: ${singleWeekdayInfo.name} (${toPersianDigits(diffDays)} روز دیگر)`,
        }
      }
    } else {
      let completedDays = 0
      for (const weekday of activeWeekdays) {
        const offset = (weekday + 1) % 7
        const date = PersianDate.addDays(currentWeekSat, offset)
        const tasks = habit.weeklySchedule?.[weekday] || []
        if (tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, date))) {
          completedDays++
        }
      }
      const totalDays = activeWeekdays.length
      if (completedDays === totalDays) {
        currentStatus = { type: 'completed', message: `✨ هر ${toPersianDigits(totalDays)} روز این هفته کامل شد` }
      } else if (activeWeekdays.includes(todayWeekday)) {
        const todayTasks = habit.weeklySchedule?.[todayWeekday] || []
        const todayDone = todayTasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, today))
        if (!todayDone) {
          currentStatus = {
            type: 'today_pending',
            message: `🎯 امروز نوبت تمرین است (${toPersianDigits(completedDays)} از ${toPersianDigits(totalDays)} روز)`,
          }
        } else {
          currentStatus = {
            type: 'upcoming',
            message: `${toPersianDigits(completedDays)} از ${toPersianDigits(totalDays)} روز این هفته انجام شده`,
          }
        }
      } else {
        currentStatus = {
          type: 'upcoming',
          message: `${toPersianDigits(completedDays)} از ${toPersianDigits(totalDays)} روز این هفته انجام شده`,
        }
      }
    }

    return {
      streak,
      periodUnit,
      streakLabel,
      title: isSingleDay && singleWeekdayInfo ? `۷ ${singleWeekdayInfo.name} اخیر` : '۷ هفته اخیر',
      currentStatus,
      items,
    }
  }

  // -------------------------------------------------------------
  // Monthly Streak & History (Last 7 Months)
  // -------------------------------------------------------------
  function getMonthlyStreakOverview(habit: Habit): HabitStreakOverview {
    const today = PersianDate.today()
    const currentJ = today.toJalali()
    const activeEntries = Object.entries(habit.monthlySchedule || {}).filter(
      ([, tasks]) => tasks && tasks.length > 0
    )
    const scheduledDays = activeEntries.map(([d]) => Number(d)).sort((a, b) => a - b)
    const hasScheduledTasks = scheduledDays.length > 0
    const isSingleDay = scheduledDays.length === 1

    function isMonthCompleted(jy: number, jm: number): boolean {
      if (!hasScheduledTasks || !habit.monthlySchedule) return false
      const daysInMonth = getDaysInJalaliMonth(jy, jm)
      for (const d of scheduledDays) {
        if (d <= daysInMonth) {
          const tasks = habit.monthlySchedule[d] || []
          const date = PersianDate.fromJalali(jy, jm, d)
          const allDone = tasks.every((t) => isTaskCompletedOnDate(habit.id, t.id, date))
          if (!allDone) return false
        }
      }
      return true
    }

    const items: HabitHistoryItem[] = []
    for (let m = 6; m >= 0; m--) {
      let targetYear = currentJ.year
      let targetMonth = currentJ.month - m
      while (targetMonth <= 0) {
        targetMonth += 12
        targetYear -= 1
      }

      const isCurrent = m === 0
      let status: HabitHistoryItem['status'] = 'empty'

      if (hasScheduledTasks) {
        const allDone = isMonthCompleted(targetYear, targetMonth)
        if (allDone) {
          status = 'completed'
        } else if (isCurrent) {
          status = 'pending'
        } else {
          status = 'missed'
        }
      }

      const label = MONTHS_FA[targetMonth - 1]
      let sublabel = ''
      if (isSingleDay) {
        sublabel = `روز ${toPersianDigits(scheduledDays[0])}`
      } else if (targetYear !== currentJ.year) {
        sublabel = toPersianDigits(targetYear)
      }

      items.push({
        key: `m-${targetYear}-${targetMonth}`,
        label,
        sublabel: sublabel || undefined,
        isCurrent,
        status,
      })
    }

    let streak = 0
    if (hasScheduledTasks) {
      const currentMonthDone = isMonthCompleted(currentJ.year, currentJ.month)
      const startM = currentMonthDone ? 0 : 1
      for (let m = startM; m < 36; m++) {
        let targetYear = currentJ.year
        let targetMonth = currentJ.month - m
        while (targetMonth <= 0) {
          targetMonth += 12
          targetYear -= 1
        }
        if (isMonthCompleted(targetYear, targetMonth)) {
          streak++
        } else {
          break
        }
      }
    }

    let currentStatus: HabitCurrentStatus
    if (!hasScheduledTasks) {
      currentStatus = { type: 'empty', message: 'بدون روز فعال در ماه' }
    } else {
      const currentMonthDone = isMonthCompleted(currentJ.year, currentJ.month)
      if (currentMonthDone) {
        currentStatus = { type: 'completed', message: '✨ هدف این ماه با موفقیت انجام شد' }
      } else if (scheduledDays.includes(currentJ.day)) {
        currentStatus = { type: 'today_pending', message: '🎯 امروز موعد ماهانه این عادت است!' }
      } else {
        const nextDay = scheduledDays.find((d) => d > currentJ.day)
        if (nextDay) {
          const diff = nextDay - currentJ.day
          currentStatus = {
            type: 'upcoming',
            message: `⏳ موعد بعدی: روز ${toPersianDigits(nextDay)} ماه (${toPersianDigits(diff)} روز دیگر)`,
          }
        } else {
          currentStatus = {
            type: 'upcoming',
            message: `⏳ موعد بعدی: روز ${toPersianDigits(scheduledDays[0])} ماه بعد`,
          }
        }
      }
    }

    return {
      streak,
      periodUnit: 'ماه',
      streakLabel: streak > 0 ? `${toPersianDigits(streak)} ماه متوالی` : '۰ ماه استمرار',
      title: '۷ ماه اخیر',
      currentStatus,
      items,
    }
  }

  function getHabitStreakOverview(habit: Habit): HabitStreakOverview {
    if (habit.period === 'daily') {
      return getDailyStreakOverview(habit)
    }
    if (habit.period === 'weekly') {
      return getWeeklyStreakOverview(habit)
    }
    return getMonthlyStreakOverview(habit)
  }

  function calculateHabitStreak(habit: Habit): number {
    return getHabitStreakOverview(habit).streak
  }

  // Get all habit tasks scheduled across all active habits on a given date
  function getScheduledHabitTasksForDate(date: PersianDate): Array<{ habit: Habit; task: HabitTask }> {
    const list: Array<{ habit: Habit; task: HabitTask }> = []
    for (const habit of habits.value) {
      const tasks = getTasksForHabitOnDate(habit, date)
      for (const task of tasks) {
        list.push({ habit, task })
      }
    }
    return list
  }

  // Count how many habit tasks are completed on a given date
  function getCompletedHabitTasksCountForDate(date: PersianDate): number {
    const items = getScheduledHabitTasksForDate(date)
    return items.filter((item) => isTaskCompletedOnDate(item.habit.id, item.task.id, date)).length
  }

  return {
    habits,
    createHabit,
    updateHabit,
    deleteHabit,
    addHabitTask,
    updateHabitTask,
    deleteHabitTask,
    deleteHabitTasks,
    getTasksForHabitOnDate,
    getScheduledHabitTasksForDate,
    getCompletedHabitTasksCountForDate,
    isHabitActiveOnDate,
    isTaskCompletedOnDate,
    toggleTaskCompletion,
    getTotalTasksCount,
    calculateHabitStreak,
    getHabitStreakOverview,
  }
})
