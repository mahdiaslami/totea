import PersianDate from "./PersianDate";

export default class AppDate extends PersianDate{
  constructor(date: Date = new Date) {
    super(date)
    this._date.setHours(0, 0, 0, 0);
  }
}