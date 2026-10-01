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

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const SAMPLE_TASKS = [
  'ورزش صبحگاهی',
  'مطالعه کتاب',
  'پاسخ به ایمیل‌ها',
  'جلسه تیم',
  'خرید مایحتاج',
  'تمرین زبان',
  'مرور پروژه‌ها',
  'تماس با خانواده',
  'پیاده‌روی',
  'نوشتن گزارش',
  'برنامه‌ریزی هفته',
  'یادگیری مهارت جدید',
  'بررسی و به‌روزرسانی مستندات فنی پروژه و انجام بازبینی کد با تیم توسعه',
  'مذاکره با تامین‌کننده در مورد شرایط قیمت و زمان تحویل کالاهای مورد نیاز برای فصل جدید',
  'هماهنگی با بخش منابع انسانی برای تعیین برنامه جلسات هفتگی و بررسی عملکرد کارکنان',
]

export function generateTasksForDay(date: PersianDate): Task[] {
  const seed = hashString(date.formatJalali())
  // generate between 2 and 12 tasks depending on the day so some days have a long list
  const count = (seed % 10) + 3
  const dayStart = date.getTime()
  const tasks: Task[] = []

  for (let i = 0; i < count; i++) {
    const title = SAMPLE_TASKS[(seed + i * 5) % SAMPLE_TASKS.length]
    const done = date.isPast() ? ((seed >> (i + 1)) & 1) === 1 : false
    tasks.push({
      id: `${dayStart}-${i}`,
      title,
      done,
    })
  }

  return tasks
}

export function createDayItem(date: PersianDate): DayItem {
  return {
    date: PersianDate.startOfDay(date),
    tasks: generateTasksForDay(date),
  }
}
