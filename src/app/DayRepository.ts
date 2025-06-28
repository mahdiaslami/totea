import AppDate from "./support/AppDate";
import Day, { type RawDay } from "./Day";
import Task, { type RawTask } from "./Task";
import { fakeData } from "./support/fakedata";

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
    this._days = fakeData().map((o: RawDay) => {
      return new Day(
        AppDate.fromString(o.date),
        this._loadTasks(o.tasks)
      )
    })
  }

  _loadTasks(arr: RawTask[]) {
    return arr.map(o => {
      const t = new Task(
        o.text,
        o.completedAt ? AppDate.fromString(o.completedAt) : null
      )

      t.id = o.id

      return t;
    })
  }
}