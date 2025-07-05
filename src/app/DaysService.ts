import DayRepository from "./DayRepository"

export default class DaysService {
  static getAllDays() {
    const dayRepository = new DayRepository()
    dayRepository._load()

    return dayRepository.getAll()
  }
}