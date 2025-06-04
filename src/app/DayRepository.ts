import AppDate from "./AppDate";
import Day from "./Day";
import Task, { type RawTask } from "./Task";

export default class DayRepository {
  _days: Day[];

  constructor() {
    this._days = []
  }

  async save(day: Day) {
    this._days.push(day)
  }

  async getAll() {
    return this._days
  }
  
  async findByDate(date: AppDate) {
    return this._days.find(day => day.date.isEqual(date))
  }

  _load() {
    this._days = fakeData.map(o => {
      return new Day(
        AppDate.fromString(o.date),
        this._loadTasks(o.tasks)
      )
    })
  }

  _loadTasks(arr: RawTask[]) {
    return arr.map(o => {
      return new Task(
        o.text,
        o.completedAt ? AppDate.fromString(o.completedAt) : null
      )
    })
  }
}

const fakeData = [
  {
    date: "2025-05-27T00:00:00Z",
    tasks: [
      { text: "نوشتن مستندات پروژه برای ماژول احراز هویت", completedAt: "2025-05-27T09:45:00Z" },
      { text: "بررسی ایمیل‌های دریافتی", completedAt: null }
    ]
  },
  {
    date: "2025-05-28T00:00:00Z",
    tasks: [
      { text: "جلسه با تیم طراحی برای هماهنگی ظاهر فرم ثبت‌نام کاربر", completedAt: "2025-05-28T11:00:00Z" },
      { text: "رفع خطای مرتبط با لاگین در مرورگر سافاری", completedAt: "2025-05-28T16:20:00Z" },
      { text: "نوشتن تست‌های واحد برای سرویس ارسال پیامک", completedAt: null }
    ]
  },
  {
    date: "2025-05-29T00:00:00Z",
    tasks: [
      { text: "بررسی نهایی درخواست‌های مرج و ادغام کدها در شاخه اصلی", completedAt: "2025-05-29T13:15:00Z" }
    ]
  },
  {
    date: "2025-05-30T00:00:00Z",
    tasks: [
      { text: "به‌روزرسانی راهنمای نصب سیستم برای کاربران جدید با توضیحات دقیق درباره تنظیمات پایگاه داده", completedAt: null },
      { text: "هماهنگی با بخش پشتیبانی جهت پاسخگویی به تیکت‌های فنی", completedAt: "2025-05-30T14:30:00Z" },
      { text: "تحقیق درباره ابزارهای جدید مستندسازی", completedAt: null },
      { text: "مرور کدهای قدیمی جهت بهینه‌سازی عملکرد", completedAt: "2025-05-30T17:00:00Z" }
    ]
  },
  {
    date: "2025-05-31T00:00:00Z",
    tasks: [
      { text: "تهیه گزارش عملکرد هفتگی برای ارائه به مدیر تیم با جزئیات کامل از کارهای انجام شده و مشکلات پیش آمده", completedAt: "2025-05-31T10:00:00Z" },
      { text: "بررسی بازخورد کاربران و دسته‌بندی مشکلات رایج", completedAt: null }
    ]
  }
];