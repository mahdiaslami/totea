
export default class PersianDate {
  _date;

  constructor(date: number | string | Date = new Date) {
    if (date instanceof Date) {
      this._date = date
    } else {
      this._date = new Date(date)
    }
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

  static today() {
    const result = new this()
    result._date.setHours(0, 0, 0, 0)
    return result
  }

  isEqual(date: PersianDate) {
    return this._date.getTime() === date._date.getTime()
  }

  addDay(): this {
    return this.addDays(1)
  }

  subDay(): this {
    return this.addDays(-1)
  }

  addDays(value: number): this {
    this._date.setDate(this._date.getDate() + value)
    return this
  }

  distanceInDay(date: Date): number {
    const cur = this.duplicate()._date.setHours(0, 0, 0, 0)
    const today = date.setHours(0, 0, 0, 0)

    return (today - cur) / 86400000
  }

  duplicate(): this {
    return new (this.constructor as any)(new Date(this._date))
  }

  toISOString(): string {
    return this._date.toISOString()
  }
}