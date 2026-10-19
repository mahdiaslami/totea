import { ref } from 'vue'
import { defineStore } from 'pinia'
import { PersianDate } from '@/modules/timeline/PersianDate'

export type HabitPeriod = 'daily' | 'weekly' | 'monthly'

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

  // Calculate streak: consecutive active days where all scheduled tasks were completed
  function calculateHabitStreak(habit: Habit): number {
    let streak = 0
    let checkDate = PersianDate.today()
    // Check up to 60 days in the past
    for (let i = 0; i < 60; i++) {
      const scheduledTasks = getTasksForHabitOnDate(habit, checkDate)
      if (scheduledTasks.length > 0) {
        const allDone = scheduledTasks.every((t) =>
          isTaskCompletedOnDate(habit.id, t.id, checkDate)
        )
        if (allDone) {
          streak++
        } else if (i === 0) {
          // Today not done yet; does not break the past streak yet
        } else {
          break
        }
      }
      checkDate = PersianDate.addDays(checkDate, -1)
    }
    return streak
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
  }
})
