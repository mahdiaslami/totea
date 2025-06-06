
export default class PersianDate {
  _date;

  constructor(date: Date = new Date) {
    this._date = date
  }

  getPersianFullYear(): string {
    const options = { year: 'numeric' } as Intl.DateTimeFormatOptions
    const year = this._date.toLocaleDateString('fa-IR', options)

    return year
  }

  getPersianDate(): string {
    const options = { day: 'numeric' } as Intl.DateTimeFormatOptions
    const day = this._date.toLocaleDateString('fa-IR', options)

    return day
  }

  getPersianMonthName(): string {
    const options = { month: 'long' } as Intl.DateTimeFormatOptions
    const month = this._date.toLocaleDateString('fa-IR', options)

    return month
  }

  getPersianWeekday(): string {
    const options = { weekday: 'long' } as Intl.DateTimeFormatOptions
    const weekday = this._date.toLocaleDateString('fa-IR', options)

    return weekday
  }

  static fromString(val: string) {
    return new this(new Date(val))
  }

  isEqual(date: PersianDate) {
    return this._date.getTime() === date._date.getTime()
  }
}