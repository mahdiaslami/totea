import AppDate from "./support/AppDate";

export type RawTask = {
  id: string,
  text: string,
  completedAt: string | null,
}

export default class Task {
  id: string | null;
  text: string;
  completedAt: AppDate | null;

  constructor(text: string, completedAt: AppDate | null = null) {
    this.id = null
    this.text = text
    this.completedAt = completedAt
  }
}