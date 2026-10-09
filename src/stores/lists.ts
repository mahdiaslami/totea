import { ref } from 'vue'
import { defineStore } from 'pinia'
import { PersianDate } from '@/modules/timeline/PersianDate'

export interface ListItem {
  id: string
  title: string
  done: boolean
  completedAtDateTimestamp?: number // PersianDate.startOfDay(date).getTime()
  createdAt: number
}

export interface TaskList {
  id: string
  title: string
  scheduledDays: number[] // JS day index: 6 (شنبه), 0 (یک‌شنبه), 1 (دوشنبه), 2 (سه‌شنبه), 3 (چهارشنبه), 4 (پنج‌شنبه), 5 (جمعه)
  items: ListItem[]
  createdAt: number
}

const STORAGE_KEY = 'totea_task_lists_v1'

export const PERSIAN_WEEKDAYS = [
  { dayIndex: 6, name: 'شنبه', shortName: 'ش' },
  { dayIndex: 0, name: 'یک‌شنبه', shortName: 'ی' },
  { dayIndex: 1, name: 'دوشنبه', shortName: 'د' },
  { dayIndex: 2, name: 'سه‌شنبه', shortName: 'س' },
  { dayIndex: 3, name: 'چهارشنبه', shortName: 'چ' },
  { dayIndex: 4, name: 'پنج‌شنبه', shortName: 'پ' },
  { dayIndex: 5, name: 'جمعه', shortName: 'ج' },
]

export function getScheduledDaysLabel(scheduledDays: number[]): string {
  if (!scheduledDays || scheduledDays.length === 0) return 'هیچ روزی'
  if (scheduledDays.length === 7) return 'تمام هفته'

  const isSelected = (idx: number) => scheduledDays.includes(PERSIAN_WEEKDAYS[idx].dayIndex)

  let firstInactive = 0
  for (let i = 0; i < 7; i++) {
    if (!isSelected(i)) {
      firstInactive = i
      break
    }
  }

  const streaks: number[][] = []
  let currentStreak: number[] = []

  for (let step = 1; step <= 7; step++) {
    const i = (firstInactive + step) % 7
    if (isSelected(i)) {
      currentStreak.push(i)
    } else {
      if (currentStreak.length > 0) {
        streaks.push(currentStreak)
        currentStreak = []
      }
    }
  }
  if (currentStreak.length > 0) {
    streaks.push(currentStreak)
  }

  streaks.sort((a, b) => {
    const aStarts0 = a.includes(0) && a[0] === 0
    const bStarts0 = b.includes(0) && b[0] === 0
    if (aStarts0) return -1
    if (bStarts0) return 1
    return a[0] - b[0]
  })

  const parts: string[] = []
  for (const stk of streaks) {
    if (stk.length > 3) {
      parts.push(`از ${PERSIAN_WEEKDAYS[stk[0]].name} تا ${PERSIAN_WEEKDAYS[stk[stk.length - 1]].name}`)
    } else {
      for (const d of stk) {
        parts.push(PERSIAN_WEEKDAYS[d].name)
      }
    }
  }

  return parts.join('، ')
}

function getInitialLists(): TaskList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.error('Failed to load lists from localStorage', err)
  }

  // Initial starter lists: Saturday, Sunday, Monday project
  const today = PersianDate.startOfDay(PersianDate.today()).getTime()
  return [
    {
      id: 'list-project-alpha',
      title: 'پروژه کاری شرکت',
      scheduledDays: [6, 0, 1], // شنبه، یکشنبه، دوشنبه
      items: [
        {
          id: 'item-1',
          title: 'بررسی فاز نیازمندی‌ها و بازبینی مستندات',
          done: true,
          completedAtDateTimestamp: today,
          createdAt: Date.now() - 3600000,
        },
        {
          id: 'item-2',
          title: 'جلسه هماهنگی با تیم فنی',
          done: false,
          createdAt: Date.now() - 1800000,
        },
        {
          id: 'item-3',
          title: 'آماده‌سازی پیش‌نویس گزارش پیشرفت',
          done: false,
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'list-personal-reading',
      title: 'مطالعه و یادگیری',
      scheduledDays: [2, 3, 4], // سه‌شنبه، چهارشنبه، پنج‌شنبه
      items: [
        {
          id: 'item-read-1',
          title: 'مطالعه فصل ۳ کتاب طراحی معماری',
          done: false,
          createdAt: Date.now(),
        },
        {
          id: 'item-read-2',
          title: 'خلاصه‌نویسی نکات کلیدی',
          done: false,
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now() - 43200000,
    },
  ]
}

export const useListsStore = defineStore('lists', () => {
  const lists = ref<TaskList[]>(getInitialLists())
  const selectedListId = ref<string | null>(null)

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists.value))
    } catch (err) {
      console.error('Failed to save lists to localStorage', err)
    }
  }

  function createList(data: {
    title: string
    scheduledDays?: number[]
  }): TaskList {
    const newList: TaskList = {
      id: 'list-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: data.title.trim(),
      scheduledDays: data.scheduledDays || [6, 0, 1],
      items: [],
      createdAt: Date.now(),
    }
    lists.value.unshift(newList)
    persist()
    return newList
  }

  function updateList(
    id: string,
    updates: Partial<Pick<TaskList, 'title' | 'scheduledDays'>>
  ) {
    const list = lists.value.find((l) => l.id === id)
    if (!list) return
    if (updates.title !== undefined) list.title = updates.title.trim()
    if (updates.scheduledDays !== undefined) list.scheduledDays = updates.scheduledDays
    persist()
  }

  function deleteList(id: string) {
    lists.value = lists.value.filter((l) => l.id !== id)
    if (selectedListId.value === id) {
      selectedListId.value = null
    }
    persist()
  }

  function addItemToList(listId: string, title: string): ListItem | null {
    const list = lists.value.find((l) => l.id === listId)
    if (!list || !title.trim()) return null
    const newItem: ListItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: title.trim(),
      done: false,
      createdAt: Date.now(),
    }
    list.items.push(newItem)
    persist()
    return newItem
  }

  function toggleListItem(
    listId: string,
    itemId: string,
    actionDateTimestamp?: number
  ) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    const item = list.items.find((i) => i.id === itemId)
    if (!item) return

    item.done = !item.done
    if (item.done) {
      // Record completion on the given date (defaulting to today)
      // Never allow future dates for task completion
      const todayTs = PersianDate.startOfDay(PersianDate.today()).getTime()
      const targetDate =
        actionDateTimestamp !== undefined && actionDateTimestamp <= todayTs
          ? actionDateTimestamp
          : todayTs
      item.completedAtDateTimestamp = targetDate
    } else {
      item.completedAtDateTimestamp = undefined
    }
    persist()
  }

  function updateListItem(listId: string, itemId: string, newTitle: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    const item = list.items.find((i) => i.id === itemId)
    if (!item) return
    const trimmed = newTitle.trim()
    if (!trimmed) return
    item.title = trimmed
    persist()
  }

  function deleteListItem(listId: string, itemId: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    list.items = list.items.filter((i) => i.id !== itemId)
    persist()
  }

  function deleteMultipleListItems(listId: string, itemIds: string[]) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    const idSet = new Set(itemIds)
    list.items = list.items.filter((i) => !idSet.has(i.id))
    persist()
  }

  // Get lists scheduled to be active on a given day OR that have completed items on that day as an exception
  function getListsForDay(date: PersianDate): TaskList[] {
    const dayOfWeek = date.value.getDay()
    const dayStartTs = PersianDate.startOfDay(date).getTime()
    return lists.value.filter((l) => {
      const isScheduled = l.scheduledDays.includes(dayOfWeek)
      const hasCompletedOnDay = l.items.some(
        (i) => i.done && i.completedAtDateTimestamp === dayStartTs
      )
      return isScheduled || hasCompletedOnDay
    })
  }

  // Check if a list appears on a day purely as an exception (completed item on an unscheduled day)
  function isListExceptionForDay(listId: string, date: PersianDate): boolean {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return false
    const dayOfWeek = date.value.getDay()
    const isScheduled = list.scheduledDays.includes(dayOfWeek)
    if (isScheduled) return false
    const dayStartTs = PersianDate.startOfDay(date).getTime()
    return list.items.some(
      (i) => i.done && i.completedAtDateTimestamp === dayStartTs
    )
  }

  // Get completed items count for a given list on a given day
  function getCompletedCountForDay(listId: string, date: PersianDate): number {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return 0
    const dayStartTs = PersianDate.startOfDay(date).getTime()
    return list.items.filter((i) => i.done && i.completedAtDateTimestamp === dayStartTs).length
  }

  function selectList(id: string | null) {
    selectedListId.value = id
  }

  return {
    lists,
    selectedListId,
    createList,
    updateList,
    deleteList,
    addItemToList,
    toggleListItem,
    updateListItem,
    deleteListItem,
    deleteMultipleListItems,
    getListsForDay,
    isListExceptionForDay,
    getCompletedCountForDay,
    selectList,
  }
})
