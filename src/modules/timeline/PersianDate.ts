export const WEEKDAYS_FA = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
]

export const SHORT_WEEKDAYS_FA = [
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
]

export const MONTHS_FA = [
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

export const SEASONS_FA = [
  { name: 'بهار', months: [1, 2, 3], colorFamily: 'green' },
  { name: 'تابستان', months: [4, 5, 6], colorFamily: 'red' },
  { name: 'پاییز', months: [7, 8, 9], colorFamily: 'yellow' },
  { name: 'زمستان', months: [10, 11, 12], colorFamily: 'blue' },
]

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

  const jy2 = jy - 979
  const jm2 = jm - 1
  const jd2 = jd - 1

  let jDayNo =
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4)

  for (let i = 0; i < jm2; ++i) jDayNo += jDaysInMonth[i]
  jDayNo += jd2

  let gDayNo = jDayNo + 79

  let gy = 1600 + 400 * Math.floor(gDayNo / 146097)
  gDayNo = gDayNo % 146097

  let leap = true
  if (gDayNo >= 36525) {
    gDayNo--
    gy += 100 * Math.floor(gDayNo / 36524)
    gDayNo = gDayNo % 36524

    if (gDayNo >= 365) {
      gDayNo++
    } else {
      leap = false
    }
  }

  gy += 4 * Math.floor(gDayNo / 1461)
  gDayNo %= 1461

  if (gDayNo >= 366) {
    leap = false
    gDayNo--
    gy += Math.floor(gDayNo / 365)
    gDayNo = gDayNo % 365
  }

  let i = 0
  for (; gDayNo >= gDaysInMonth[i] + (i === 1 && leap ? 1 : 0); i++) {
    gDayNo -= gDaysInMonth[i] + (i === 1 && leap ? 1 : 0)
  }
  const gm = i + 1
  const gd = gDayNo + 1

  return new Date(gy, gm - 1, gd, 12, 0, 0)
}

export function isJalaliLeap(jy: number): boolean {
  const d29 = jalaliToGregorian(jy, 12, 29)
  const next = new Date(d29.getTime() + 24 * 3600 * 1000)
  const j = new PersianDate(next).toJalali()
  return j.month === 12 && j.day === 30
}

export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isJalaliLeap(jy) ? 30 : 29
}

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

  static fromJalali(jy: number, jm: number, jd: number): PersianDate {
    return new PersianDate(jalaliToGregorian(jy, jm, jd))
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

  isTomorrow(): boolean {
    const tomorrow = PersianDate.addDays(PersianDate.today(), 1)
    return PersianDate.isSameDay(this, tomorrow)
  }

  isPast(): boolean {
    return PersianDate.startOfDay(this).getTime() < PersianDate.startOfDay(PersianDate.today()).getTime()
  }

  getRelativeLabel(): string {
    if (this.isToday()) return 'امروز'
    if (this.isTomorrow()) return 'فردا'

    const todayStart = PersianDate.startOfDay(PersianDate.today()).getTime()
    const thisStart = PersianDate.startOfDay(this).getTime()
    const diffDays = Math.round((thisStart - todayStart) / (1000 * 60 * 60 * 24))

    if (diffDays > 1) {
      return `${toPersianDigits(diffDays)} روز آینده`
    }
    if (diffDays < 0) {
      return `${toPersianDigits(Math.abs(diffDays))} روز قبل`
    }
    return ''
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

  get shortWeekdayName(): string {
    return SHORT_WEEKDAYS_FA[this.value.getDay()]
  }

  formatJalali(): string {
    const j = this.toJalali()
    return toPersianDigits(`${j.day} ${MONTHS_FA[j.month - 1]} ${j.year}`)
  }

  formatMonthYear(): string {
    const j = this.toJalali()
    return toPersianDigits(`${MONTHS_FA[j.month - 1]} ${j.year}`)
  }
}
