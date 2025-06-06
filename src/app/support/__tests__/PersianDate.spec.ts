import { describe, it, expect } from 'vitest'
import PersianDate from '../PersianDate'

describe('PersianDate', () => {
  describe('constructor', () => {
    it('when no argument provided', () => {
      const now = new Date()
      const persianDate = new PersianDate()

      expect(persianDate.toISOString().split('T')[0]).toBe(now.toISOString().split('T')[0])
    })

    it('from timestamp number', () => {
      const timestamp = 1705334400000 // 2024-01-15
      const persianDate = new PersianDate(timestamp)

      expect(persianDate.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('from ISO string', () => {
      const dateString = '2024-01-15T12:00:00.000Z'
      const persianDate = new PersianDate(dateString)

      expect(persianDate.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('from Date object', () => {
      const dateObj = new Date('2024-01-15')
      const persianDate = new PersianDate(dateObj)

      expect(persianDate.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('should handle invalid date string', () => {
      const invalidDate = 'invalid-date'
      const persianDate = new PersianDate(invalidDate)

      try {
        persianDate.toISOString()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Invalid time value')
      }
    })
  })

  describe('Persian calendar methods', () => {
    it('getPersianFullYear', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.getPersianFullYear()

      expect(typeof result).toBe('string')
      expect(result).toEqual('۱۴۰۲')
    })

    it('getPersianDate', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.getPersianDate()

      expect(typeof result).toBe('string')
      expect(result).toEqual('۲۵')
    })

    it('getPersianMonthName', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.getPersianMonthName()

      expect(typeof result).toBe('string')
      expect(result).toEqual('دی')
    })

    it('getPersianWeekday', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.getPersianWeekday()

      expect(typeof result).toBe('string')
      expect(result).toBe('دوشنبه')
    })
  })

  describe('static methods', () => {
    it('fromString should create instance from date string', () => {
      const result = PersianDate.fromString('2024-01-15')
      expect(result).toBeInstanceOf(PersianDate)
      expect(result.toISOString().split('T')[0]).toBe('2024-01-15')
    })

    it('today should return current date with time set to midnight', () => {
      const result = PersianDate.today()
      const now = new Date()
      now.setHours(0, 0, 0, 0)

      expect(result).toBeInstanceOf(PersianDate)
      expect(result.toISOString()).toBe(now.toISOString())
    })
  })

  describe('PersianDate instance methods', () => {
    it('isEqual should return true for same dates', () => {
      const date1 = new PersianDate('2024-01-15')
      const date2 = new PersianDate('2024-01-15')
      expect(date1.isEqual(date2)).toBe(true)
    })

    it('isEqual should return false for different dates', () => {
      const date1 = new PersianDate('2024-01-15')
      const date2 = new PersianDate('2024-01-16')
      expect(date1.isEqual(date2)).toBe(false)
    })

    it('addDay should add one day to date', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.addDay()
      expect(result.toISOString().split('T')[0]).toBe('2024-01-16')
      expect(result).toBe(date)
    })

    it('subDay should substract one day from date', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.subDay()

      expect(result.toISOString().split('T')[0]).toBe('2024-01-14')
    })

    it('addDays should add multiple days', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.addDays(5)
      expect(result.toISOString().split('T')[0]).toBe('2024-01-20')
    })

    it('addDays should subtract days when negative', () => {
      const date = new PersianDate('2024-01-15')
      const result = date.addDays(-3)
      expect(result.toISOString().split('T')[0]).toBe('2024-01-12')
    })

    it('distanceInDay should calculate correct day difference', () => {
      const persianDate = new PersianDate('2024-01-15')
      const compareDate = new Date('2024-01-20')
      expect(persianDate.distanceInDay(compareDate)).toBe(5)
    })

    it('distanceInDay should handle negative differences', () => {
      const persianDate = new PersianDate('2024-01-20')
      const compareDate = new Date('2024-01-15')
      expect(persianDate.distanceInDay(compareDate)).toBe(-5)
    })

    it('duplicate should create new instance with same date', () => {
      const original = new PersianDate('2024-01-15')
      const duplicate = original.duplicate()

      expect(duplicate).toBeInstanceOf(PersianDate)
      expect(duplicate).not.toBe(original)
      expect(duplicate.toISOString()).toBe(original.toISOString())
    })
  })
})



