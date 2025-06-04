import AppDate from "./support/AppDate";
import Task, { type RawTask } from "./Task";

export type RawDay = {
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
}