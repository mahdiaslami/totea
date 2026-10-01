import { PersianDate } from './PersianDate'

export interface Task {
  id: string
  title: string
  done: boolean
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
