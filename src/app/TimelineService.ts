import DayRepository from "./DayRepository"

export class TimelineService {
  static getAllDays() {
    const dayRepository = new DayRepository()
    dayRepository._load()

    return dayRepository.getAll()
  }
}