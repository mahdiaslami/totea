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
      // Record completion on the given date (or today if not specified)
      const targetDate = actionDateTimestamp
        ? actionDateTimestamp
        : PersianDate.startOfDay(PersianDate.today()).getTime()
      item.completedAtDateTimestamp = targetDate
    } else {
      item.completedAtDateTimestamp = undefined
    }
    persist()
  }

  function deleteListItem(listId: string, itemId: string) {
    const list = lists.value.find((l) => l.id === listId)
    if (!list) return
    list.items = list.items.filter((i) => i.id !== itemId)
    persist()
  }

  // Get lists scheduled to be active on a given day
  function getListsForDay(date: PersianDate): TaskList[] {
    const dayOfWeek = date.value.getDay()
    return lists.value.filter((l) => l.scheduledDays.includes(dayOfWeek))
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
    deleteListItem,
    getListsForDay,
    getCompletedCountForDay,
    selectList,
  }
})
