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
  const dayStart = date.getTime()
  const tasks: Task[] = []

  // If today or tomorrow, guarantee 20 tasks so the user can immediately test long list behavior
  let count: number
  if (date.isToday()) {
    count = 20
  } else {
    // Generate between 4 and 22 tasks depending on the day
    count = (seed % 19) + 4
  }

  for (let i = 0; i < count; i++) {
    const title = SAMPLE_TASKS[(seed + i * 5) % SAMPLE_TASKS.length]
    const done = date.isPast() ? ((seed >> (i + 1)) & 1) === 1 : false
    tasks.push({
      id: `${dayStart}-${i}`,
      title: `${title} (${i + 1})`,
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
