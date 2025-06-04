import AppDate from "./support/AppDate";
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
      const t =  new Task(
        o.text,
        o.completedAt ? AppDate.fromString(o.completedAt) : null
      )

      t.id = o.id

      return t;
    })
  }
}

const fakeData = [
  {
    date: "2025-05-27T00:00:00Z",
    tasks: [
      { id: "f47ac10b-58cc-4372-a567-0e02b2c3d479", text: "نوشتن مستندات پروژه برای ماژول احراز هویت", completedAt: "2025-05-27T09:45:00Z" },
      { id: "b9a2e47c-8f23-4d14-b8b4-95a44e781d0d", text: "بررسی ایمیل‌های دریافتی", completedAt: null }
    ]
  },
  {
    date: "2025-05-28T00:00:00Z",
    tasks: [
      { id: "c6e34e53-745f-4c8d-97c3-932e5b8d2c9a", text: "جلسه با تیم طراحی برای هماهنگی ظاهر فرم ثبت‌نام کاربر", completedAt: "2025-05-28T11:00:00Z" },
      { id: "d7f45e64-856g-5d9e-a8d4-043f6c9d3dab", text: "رفع خطای مرتبط با لاگین در مرورگر سافاری", completedAt: "2025-05-28T16:20:00Z" },
      { id: "e8g56f75-967h-6e0f-b9e5-154g7d0e4ebc", text: "نوشتن تست‌های واحد برای سرویس ارسال پیامک", completedAt: null }
    ]
  },
  {
    date: "2025-05-29T00:00:00Z",
    tasks: [
      { id: "f9h67g86-078i-7f1g-c0f6-265h8e1f5fcd", text: "بررسی نهایی درخواست‌های مرج و ادغام کدها در شاخه اصلی", completedAt: "2025-05-29T13:15:00Z" }
    ]
  },
  {
    date: "2025-05-30T00:00:00Z",
    tasks: [
      { id: "g0i78h97-189j-8g2h-d1g7-376i9f2g6gde", text: "به‌روزرسانی راهنمای نصب سیستم برای کاربران جدید با توضیحات دقیق درباره تنظیمات پایگاه داده", completedAt: null },
      { id: "h1j89i08-290k-9h3i-e2h8-487j0g3h7hef", text: "هماهنگی با بخش پشتیبانی جهت پاسخگویی به تیکت‌های فنی", completedAt: "2025-05-30T14:30:00Z" },
      { id: "i2k90j19-301l-0i4j-f3i9-598k1h4i8ifg", text: "تحقیق درباره ابزارهای جدید مستندسازی", completedAt: null },
      { id: "j3l01k20-412m-1j5k-g4j0-609l2i5j9jgh", text: "مرور کدهای قدیمی جهت بهینه‌سازی عملکرد", completedAt: "2025-05-30T17:00:00Z" }
    ]
  },
  {
    date: "2025-05-31T00:00:00Z",
    tasks: [
      { id: "k4m12l31-523n-2k6l-h5k1-710m3j6k0khi", text: "تهیه گزارش عملکرد هفتگی برای ارائه به مدیر تیم با جزئیات کامل از کارهای انجام شده و مشکلات پیش آمده", completedAt: "2025-05-31T10:00:00Z" },
      { id: "l5n23m42-634o-3l7m-i6l2-821n4k7l1lij", text: "بررسی بازخورد کاربران و دسته‌بندی مشکلات رایج", completedAt: null }
    ]
  }
];