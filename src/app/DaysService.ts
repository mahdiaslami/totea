import DayRepository from "./DayRepository"
import type AppDate from "./support/AppDate"

export default class DaysService {
  static getAllDays() {
    const dayRepository = new DayRepository()
    dayRepository._load()

    return dayRepository.getAll()
  }
  
  static findByDate(date: AppDate) {
    const dayRepository = new DayRepository()
    dayRepository._load()

    return dayRepository.findByDate(date)
  }
}