import AppDate from "@/app/support/AppDate"

export default class DaysList {
  _items: DateItem[]
  _maxCount: number
  _loadCount: number

  constructor(loadCount: number, maxCount: number = loadCount * 3) {
    this._items = []
    this._maxCount = maxCount
    this._loadCount = loadCount

    this.init()
  }

  get items() {
    return this._items
  }

  reset() {
    this._items = []
    this.init()
  }

  init() {
    const date = new AppDate()
    this._items.push({
      id: date.getTime(),
      date,
      elementId: 'date-today'
    })

    const loadCount = (this._maxCount - 1) / 2
    this.append(loadCount)
    this.prepend(loadCount)
  }

  prepend(loadCount = this._loadCount) {
    const lastDate = this._items[0].date

    let newItems = this._items

    if (newItems.length >= this._maxCount) {
      newItems = newItems.slice(0, newItems.length - loadCount)
    }

    newItems.unshift(
      ...(this._getDays(lastDate, -1 * loadCount).reverse())
    )

    this._items = newItems
  }

  append(loadCount = this._loadCount) {
    const lastDate = this._items[this._items.length - 1].date

    let newItems = this._items;

    if (newItems.length >= this._maxCount) {
      newItems = newItems.slice(loadCount)
    }

    newItems.push(
      ...this._getDays(lastDate, loadCount)
    )

    this._items = newItems
  }

  _getDays(lastDate: AppDate, count: number): DateItem[] {
    let factor = 1;

    if (count < 0) {
      factor = -1
    }

    return Array.from(
      { length: factor * count },
      (_, i) => {
        const date = lastDate.duplicate().addDays(factor * (i + 1))

        return {
          id: date.getTime(),
          date,
        }
      }
    )
  }
}

export type DateItem = {
  id: number
  date: AppDate
  elementId?: string
}
