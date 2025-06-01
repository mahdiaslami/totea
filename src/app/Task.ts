import AppDate from "./AppDate";

export type RawTask = {
  text: string,
  completedAt: string | null,
}

export default class Task {
  text: string;
  completedAt: AppDate | null;

  constructor(text: string, completedAt: AppDate | null = null) {
    this.text = text
    this.completedAt = completedAt
  }

  static fromArray(arr: RawTask[]) {
    return arr.map(o => {
      return new Task(
        o.text,
        o.completedAt ? AppDate.fromString(o.completedAt) : null
      )
    })
  }
}