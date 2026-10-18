import { PersianDate } from './PersianDate'

export interface Task {
  id: string
  title: string
  done: boolean
  isTracked?: boolean
  allowedDays?: number[] // Array of JS weekday indices: 6 (شنبه), 0 (یک‌شنبه), 1 (دوشنبه), 2 (سه‌شنبه), 3 (چهارشنبه), 4 (پنج‌شنبه), 5 (جمعه)
  originalDateTimestamp?: number
  lastRolloverDateTimestamp?: number
  rolloverCount?: number
  completedWithDelay?: boolean
  completedAtDateTimestamp?: number
}

export interface DayItem {
  date: PersianDate
  tasks: Task[]
}

export function generateTasksForDay(): Task[] {
  // Fake tasks disabled for real task addition flow
  return []
}

export function createDayItem(date: PersianDate): DayItem {
  return {
    date: PersianDate.startOfDay(date),
    tasks: [],
  }
}
