import type AppDateTime from "./support/AppDateTime";

export type RawTask = {
  id: string,
  text: string,
  completedAt: string | null,
}

export default class Task {
  id: string | null;
  text: string;
  completedAt: AppDateTime | null;

  constructor(text: string, completedAt: AppDateTime | null = null) {
    this.id = null
    this.text = text
    this.completedAt = completedAt
  }
}