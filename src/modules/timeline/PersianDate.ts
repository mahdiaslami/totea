const WEEKDAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
]

const MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)])
}

interface JalaliParts {
  year: number
  month: number
  day: number
}

export class PersianDate {
  readonly value: Date

  constructor(input?: Date | string | number) {
    this.value = input ? new Date(input) : new Date()
  }

  static today(): PersianDate {
    return new PersianDate()
  }

  static startOfDay(date: PersianDate): PersianDate {
    const d = new Date(date.value)
    d.setHours(0, 0, 0, 0)
    return new PersianDate(d)
  }

  static addDays(date: PersianDate, amount: number): PersianDate {
    const d = new Date(date.value)
    d.setDate(d.getDate() + amount)
    return new PersianDate(d)
  }

  static isSameDay(a: PersianDate, b: PersianDate): boolean {
    return (
      a.value.getFullYear() === b.value.getFullYear() &&
      a.value.getMonth() === b.value.getMonth() &&
      a.value.getDate() === b.value.getDate()
    )
  }

  toDate(): Date {
    return new Date(this.value)
  }

  getTime(): number {
    return this.value.getTime()
  }

  isToday(): boolean {
    return PersianDate.isSameDay(this, PersianDate.today())
  }

  isPast(): boolean {
    return PersianDate.startOfDay(this).getTime() < PersianDate.startOfDay(PersianDate.today()).getTime()
  }

  toJalali(): JalaliParts {
    const gy = this.value.getFullYear()
    const gm = this.value.getMonth() + 1
    const gd = this.value.getDate()

    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

    const gy2 = gy - 1600
    const gm2 = gm - 1
    const gd2 = gd - 1

    let gDayNo =
      365 * gy2 +
      Math.floor((gy2 + 3) / 4) -
      Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400)

    for (let i = 0; i < gm2; i++) gDayNo += gDaysInMonth[i]
    if (gm2 > 1 && ((gy2 % 4 === 0 && gy2 % 100 !== 0) || gy2 % 400 === 0)) {
      gDayNo += 1
    }
    gDayNo += gd2

    let jDayNo = gDayNo - 79

    const jNp = Math.floor(jDayNo / 12053)
    jDayNo %= 12053

    let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461)
    jDayNo %= 1461

    if (jDayNo >= 366) {
      jy += Math.floor((jDayNo - 1) / 365)
      jDayNo = (jDayNo - 1) % 365
    }

    let jm = 0
    for (; jm < 11 && jDayNo >= jDaysInMonth[jm]; jm++) {
      jDayNo -= jDaysInMonth[jm]
    }

    const jd = jDayNo + 1

    return { year: jy, month: jm + 1, day: jd }
  }

  get weekdayName(): string {
    return WEEKDAYS_FA[this.value.getDay()]
  }

  formatJalali(): string {
    const j = this.toJalali()
    return toPersianDigits(`${j.day} ${MONTHS_FA[j.month - 1]} ${j.year}`)
  }
}
