import AppDate from "./AppDate";
import Task, { type RawTask } from "./Task";

type RawDay = {
  date: string
  tasks: RawTask[]
}

export default class Day {
  date: AppDate
  tasks: Task[]

  constructor(date: AppDate, tasks: Task[] = []) {
    this.date = date
    this.tasks = tasks
  }

  static fromArray(arr: RawDay[]) {
    return arr.map(o => {
      return new Day(
        AppDate.fromString(o.date),
        Task.fromArray(o.tasks)
      )
    })
  }
}