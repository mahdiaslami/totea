import { describe, it, expect } from 'vitest'
import DaysSwiper from '../DaysSwiper';
import AppDate from '../AppDate';

describe('DaysSwiper', () => {
  it('getDates return array with single date when daysRange is 0', () => {
    const daysSwiper = new DaysSwiper(0);

    const today = new AppDate();
    expect(daysSwiper.getDates()).toEqual([today]);
  });

  it('getDates return array with 3 dates when daysRange is 1', () => {
    const daysSwiper = new DaysSwiper(1);

    const today = new AppDate();
    const prev = today.duplicate().subDay();
    const next = today.duplicate().addDay();
    expect(daysSwiper.getDates()).toEqual([today, next, prev]);
  });

  it('getDates return array with multiple dates in correct order', () => {
    const daysSwiper = new DaysSwiper(2);

    const twoDayAgo = AppDate.today().addDays(-2);
    const yesterday = AppDate.today().subDay();
    const today = AppDate.today();
    const tomorrow = AppDate.today().addDay();
    const twoDaysLater = AppDate.today().addDays(2);

    const dates = [today, tomorrow, twoDaysLater, twoDayAgo, yesterday];

    expect(daysSwiper.getDates()).toEqual(dates);
  });

  it('setCurrentIndex', () => {
    const daysSwiper = new DaysSwiper(2);
    const [
      today,
      tomorrow,
      twoDaysLater,
      // twoDayAgo,
      // yesterday
    ] = daysSwiper.getDates();

    console.log(daysSwiper.getDates())

    daysSwiper.setCurrentIndex(2);

    const threeDaysLater = today.duplicate().addDays(3);
    const fourDaysLater = today.duplicate().addDays(4);

    const newToday = twoDaysLater
    const newTomorrow = threeDaysLater;
    const newTwoDaysLater = fourDaysLater;
    const newTwoDayAgo = today;
    const newYesterday = tomorrow;

    const dates = [
      newTwoDayAgo,
      newYesterday,
      newToday,
      newTomorrow,
      newTwoDaysLater,
    ]

    expect(daysSwiper.getDates()).toEqual(dates);
  });
});
