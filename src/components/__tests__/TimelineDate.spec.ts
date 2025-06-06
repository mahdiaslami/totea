import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import TimelineDate from '../TimelineDate.vue'
import AppDate from '@/app/support/AppDate'

describe('TimelineDate', () => {
  it('renders properly', () => {
    const date = new AppDate()

    const wrapper = mount(TimelineDate, { props: { date } })
    const text = wrapper.text()

    expect(text).toContain(date.getPersianFullYear())
    expect(text).toContain(date.getPersianMonthName())
    expect(text).toContain(date.getPersianDate())
  })
})
