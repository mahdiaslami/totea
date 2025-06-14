import AppDate from "./AppDate";

export default class DaysSwiper {
  _previousDates: Array<AppDate>;
  _nextDates: Array<AppDate>;
  _currentDate: AppDate;
  _currentIndex: number;
  _daysRange: number;

  constructor(daysRange: number) {
    this._daysRange = daysRange;
    this._previousDates = [];
    this._nextDates = [];
    this._currentDate = new AppDate()
    this._currentIndex = 0;

    this._init();
  }

  _init() {
    for (let i = 1; i <= this._daysRange; i++) {
      const d = this._currentDate.duplicate();
      d.addDays(i)
      this._nextDates.push(d);
    }

    for (let i = -this._daysRange; i <= -1; i++) {
      const d = this._currentDate.duplicate();
      d.addDays(i)
      this._previousDates.push(d);
    }
  }

  setCurrentIndex(index: number) {
    this._currentDate = this.getDates()[index];
    this._currentIndex = index;
    this._nextDates = [];
    this._previousDates = []

    this._init();
  }

  getDates() {
    const result = [
      this._currentDate,
      ...this._nextDates,
      ...this._previousDates
    ]

    for (let i = 0; i < this._currentIndex; i++) {
      this._rotate(result)
    }

    return result
  }

  _rotate(arr: AppDate[]) {
    const t = arr.pop()
    if (t) arr.unshift(t);
  }

  get count() {
    return this._daysRange * 2 + 1
  }

  get slidesPerGroup() {
    // total number of slides must be evenly divisible by the slidesPerGroup value
    return this.count / 3
  }

  get currentDate() {
    return this._currentDate
  }
}