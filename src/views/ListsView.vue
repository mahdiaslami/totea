<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useListsStore,
  PERSIAN_WEEKDAYS,
  type TaskList,
} from '@/stores/lists'
import { toPersianDigits, PersianDate } from '@/modules/timeline/PersianDate'
import { useTimelineStore } from '@/stores/timeline'

defineOptions({
  name: 'ListsView',
})

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()
const timelineStore = useTimelineStore()

// State for active list detail view
const activeListId = ref<string | null>(null)

// State for create/edit modal
const isModalOpen = ref(false)
const editingListId = ref<string | null>(null)
const formTitle = ref('')
const formScheduledDays = ref<number[]>([6, 0, 1])

// State for new item input in detail view
const newItemTitle = ref('')

// Filter for items in detail view: 'all' | 'pending' | 'done'
const itemsFilter = ref<'all' | 'pending' | 'done'>('all')

// Synchronize with query parameter (e.g., /lists?id=list-123)
function syncFromRoute() {
  const queryId = route.query.id as string | undefined
  if (queryId && listsStore.lists.some((l) => l.id === queryId)) {
    activeListId.value = queryId
  }
}

onMounted(() => {
  syncFromRoute()
})

watch(
  () => route.query.id,
  () => {
    syncFromRoute()
  }
)

const activeList = computed<TaskList | null>(() => {
  if (!activeListId.value) return null
  return listsStore.lists.find((l) => l.id === activeListId.value) || null
})

const filteredItems = computed(() => {
  if (!activeList.value) return []
  if (itemsFilter.value === 'pending') {
    return activeList.value.items.filter((i) => !i.done)
  }
  if (itemsFilter.value === 'done') {
    return activeList.value.items.filter((i) => i.done)
  }
  return activeList.value.items
})

const totalListsCount = computed(() => listsStore.lists.length)
const totalAllItemsCount = computed(() =>
  listsStore.lists.reduce((acc, l) => acc + l.items.length, 0)
)
const totalDoneItemsCount = computed(() =>
  listsStore.lists.reduce((acc, l) => acc + l.items.filter((i) => i.done).length, 0)
)

function openCreateModal() {
  editingListId.value = null
  formTitle.value = ''
  formScheduledDays.value = [6, 0, 1] // شنبه، یکشنبه، دوشنبه پیش‌فرض
  isModalOpen.value = true
}

function openEditModal(list: TaskList) {
  editingListId.value = list.id
  formTitle.value = list.title
  formScheduledDays.value = [...list.scheduledDays]
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingListId.value = null
}

function toggleFormWeekday(dayIndex: number) {
  if (formScheduledDays.value.includes(dayIndex)) {
    formScheduledDays.value = formScheduledDays.value.filter((d) => d !== dayIndex)
  } else {
    formScheduledDays.value.push(dayIndex)
  }
}

function setWeekdayPreset(preset: 'all' | 'workdays' | 'none') {
  if (preset === 'all') {
    formScheduledDays.value = [6, 0, 1, 2, 3, 4, 5]
  } else if (preset === 'workdays') {
    formScheduledDays.value = [6, 0, 1, 2, 3, 4] // شنبه تا چهارشنبه
  } else {
    formScheduledDays.value = []
  }
}

function handleSaveList() {
  if (!formTitle.value.trim()) return

  if (editingListId.value) {
    listsStore.updateList(editingListId.value, {
      title: formTitle.value,
      scheduledDays: formScheduledDays.value,
    })
  } else {
    const created = listsStore.createList({
      title: formTitle.value,
      scheduledDays: formScheduledDays.value,
    })
    activeListId.value = created.id
  }
  closeModal()
}

function handleDeleteList(listId: string) {
  if (confirm('آیا از حذف این لیست مطمئن هستید؟')) {
    listsStore.deleteList(listId)
    if (activeListId.value === listId) {
      activeListId.value = null
      router.replace({ path: '/lists' })
    }
  }
}

function handleAddItem() {
  if (!activeList.value || !newItemTitle.value.trim()) return
  listsStore.addItemToList(activeList.value.id, newItemTitle.value)
  newItemTitle.value = ''
}

function handleToggleItem(itemId: string) {
  if (!activeList.value) return
  // When toggling, record completion on the active timeline day (or today)
  const currentTimelineTs = timelineStore.activeDateTimestamp || PersianDate.startOfDay(PersianDate.today()).getTime()
  listsStore.toggleListItem(activeList.value.id, itemId, currentTimelineTs)
}

function handleDeleteItem(itemId: string) {
  if (!activeList.value) return
  listsStore.deleteListItem(activeList.value.id, itemId)
}

function openListDetail(listId: string) {
  activeListId.value = listId
  router.replace({ path: '/lists', query: { id: listId } })
}

function backToListsOverview() {
  activeListId.value = null
  router.replace({ path: '/lists' })
}

function getScheduledDaysLabel(scheduledDays: number[]): string {
  if (scheduledDays.length === 0) return 'بدون روز مشخص'
  if (scheduledDays.length === 7) return 'هر روز هفته'
  if (
    scheduledDays.length === 5 &&
    [6, 0, 1, 2, 3].every((d) => scheduledDays.includes(d))
  ) {
    return 'روزهای کاری (ش تا چ)'
  }
  return scheduledDays
    .map((d) => PERSIAN_WEEKDAYS.find((w) => w.dayIndex === d)?.name)
    .filter(Boolean)
    .join('، ')
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none" dir="rtl">
    <!-- View Mode A: List Detail View -->
    <div v-if="activeList" class="flex h-full w-full flex-col overflow-hidden">
      <!-- Detail Header -->
      <header class="flex-shrink-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md shadow-sm">
        <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <!-- Back to lists button -->
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer focus:outline-none"
              aria-label="بازگشت به لیست‌ها"
              title="بازگشت به لیست‌ها"
              @click="backToListsOverview"
            >
              <!-- Arrow right in RTL = return -->
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- List Title -->
            <div class="min-w-0">
              <h1 class="text-lg font-bold text-slate-800 truncate">
                {{ activeList.title }}
              </h1>
            </div>
          </div>

          <!-- Actions: Edit & Delete -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer focus:outline-none"
              title="ویرایش تنظیمات لیست"
              @click="openEditModal(activeList)"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:scale-95 cursor-pointer focus:outline-none"
              title="حذف لیست"
              @click="handleDeleteList(activeList.id)"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Detail Sub-bar: Scheduled days badge & progress -->
      <div class="border-b border-slate-100/80 bg-slate-50/60 px-5 py-2.5">
        <div class="mx-auto flex max-w-2xl items-center justify-between text-xs">
          <!-- Scheduled days pills -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-slate-500 font-medium ml-1">فعال در:</span>
            <span
              v-for="day in PERSIAN_WEEKDAYS"
              :key="day.dayIndex"
              class="px-2 py-0.5 rounded-md text-[11px] font-semibold transition"
              :class="
                activeList.scheduledDays.includes(day.dayIndex)
                  ? 'bg-sky-100 text-sky-700 border border-sky-200/80'
                  : 'bg-white text-slate-300 border border-slate-100'
              "
            >
              {{ day.shortName }}
            </span>
          </div>

          <!-- Progress summary -->
          <div class="flex items-center gap-2 text-slate-600 font-semibold">
            <span>{{ toPersianDigits(activeList.items.filter((i) => i.done).length) }} از {{ toPersianDigits(activeList.items.length) }}</span>
          </div>
        </div>
      </div>

      <!-- Add Item Input Bar -->
      <div class="px-5 py-3 border-b border-slate-100 bg-white">
        <form class="mx-auto flex max-w-2xl items-center gap-2" @submit.prevent="handleAddItem">
          <input
            v-model="newItemTitle"
            type="text"
            placeholder="افزودن کار جدید به این لیست..."
            class="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none transition"
          />
          <button
            type="submit"
            :disabled="!newItemTitle.trim()"
            class="rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          >
            افزودن
          </button>
        </form>
      </div>

      <!-- Filter tabs (همه / باقیمانده / انجام‌شده) -->
      <div class="px-5 pt-3 pb-1 bg-slate-50/40">
        <div class="mx-auto flex max-w-2xl items-center gap-2 text-xs">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
            :class="itemsFilter === 'all' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'"
            @click="itemsFilter = 'all'"
          >
            همه ({{ toPersianDigits(activeList.items.length) }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
            :class="itemsFilter === 'pending' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'"
            @click="itemsFilter = 'pending'"
          >
            باقیمانده ({{ toPersianDigits(activeList.items.filter((i) => !i.done).length) }})
          </button>
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
            :class="itemsFilter === 'done' ? 'bg-sky-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'"
            @click="itemsFilter = 'done'"
          >
            انجام‌شده ({{ toPersianDigits(activeList.items.filter((i) => i.done).length) }})
          </button>
        </div>
      </div>

      <!-- Items List -->
      <main class="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-24">
        <div class="mx-auto max-w-2xl space-y-2">
          <!-- Empty State -->
          <div
            v-if="filteredItems.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center text-slate-400"
          >
            <div class="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p class="text-sm font-medium text-slate-600">کاری در این دسته وجود ندارد</p>
            <p class="text-xs text-slate-400 mt-1">با فرم بالا می‌توانید کار جدیدی اضافه کنید</p>
          </div>

          <!-- Items rows -->
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs transition hover:border-slate-200 hover:shadow-sm"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <!-- Checkbox -->
              <button
                type="button"
                class="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg border transition-all cursor-pointer focus:outline-none active:scale-90"
                :class="
                  item.done
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                "
                :aria-label="item.done ? 'علامت به عنوان انجام‌نشده' : 'علامت به عنوان انجام‌شده'"
                @click="handleToggleItem(item.id)"
              >
                <svg
                  v-if="item.done"
                  class="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <!-- Title -->
              <span
                class="text-sm transition-all truncate flex-1 cursor-pointer select-text"
                :class="item.done ? 'text-slate-400 line-through' : 'text-slate-800 font-medium'"
                @click="handleToggleItem(item.id)"
              >
                {{ item.title }}
              </span>
            </div>

            <!-- Delete item button -->
            <button
              type="button"
              class="opacity-50 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus:outline-none shrink-0"
              title="حذف این کار"
              @click="handleDeleteItem(item.id)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- View Mode B: Lists Overview (Cards list) -->
    <div v-else class="relative flex h-full w-full flex-col overflow-hidden">
      <!-- Overview Header -->
      <header class="flex-shrink-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-md shadow-sm">
        <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-slate-900">لیست‌ها</h1>
            <p class="text-xs text-slate-400 mt-0.5">
              {{ toPersianDigits(totalListsCount) }} لیست • {{ toPersianDigits(totalDoneItemsCount) }} از {{ toPersianDigits(totalAllItemsCount) }} کار انجام شده
            </p>
          </div>
        </div>
      </header>

      <!-- Lists Cards Scrollable List -->
      <main class="flex-1 min-h-0 overflow-y-auto px-5 py-5 pb-24 bg-slate-50/50">
        <div class="mx-auto max-w-2xl space-y-4">
          <!-- Empty State -->
          <div
            v-if="listsStore.lists.length === 0"
            class="flex flex-col items-center justify-center py-20 text-center text-slate-400"
          >
            <div class="h-14 w-14 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-sky-600 mb-3">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-800">هیچ لیستی وجود ندارد</h3>
            <p class="text-xs text-slate-400 mt-1 max-w-xs">
              پروژه‌ها و کارهای چندمرحله‌ای خود را در قالب لیست بسازید و روزهای اجرای آن را در هفته مشخص کنید.
            </p>
            <button
              type="button"
              class="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-sky-700 cursor-pointer"
              @click="openCreateModal"
            >
              ایجاد اولین لیست
            </button>
          </div>

          <!-- List Card -->
          <div
            v-for="list in listsStore.lists"
            :key="list.id"
            class="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-5.5 shadow-xs transition hover:border-slate-300 hover:shadow-md cursor-pointer space-y-3.5"
            @click="openListDetail(list.id)"
          >
            <!-- Card Header: Title & Actions -->
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <h3 class="text-base sm:text-lg font-bold text-slate-800 truncate">
                  {{ list.title }}
                </h3>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer focus:outline-none"
                  title="ویرایش"
                  @click="openEditModal(list)"
                >
                  <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Middle: Scheduled Days of Week as Button Group with Equal-Width Buttons -->
            <div class="space-y-2 pt-2 border-t border-slate-100">
              <div class="flex items-center justify-between text-xs sm:text-sm text-slate-500">
                <span class="font-medium text-slate-600">روزهای فعال در هفته:</span>
                <span class="text-slate-400 font-normal">
                  {{ getScheduledDaysLabel(list.scheduledDays) }}
                </span>
              </div>

              <!-- Equal-Width Button Group -->
              <div class="grid grid-cols-7 w-full rounded-2xl border border-slate-200/80 bg-slate-50 p-1 gap-1">
                <div
                  v-for="day in PERSIAN_WEEKDAYS"
                  :key="day.dayIndex"
                  class="flex items-center justify-center py-2 text-center text-xs sm:text-sm transition rounded-xl"
                  :class="
                    list.scheduledDays.includes(day.dayIndex)
                      ? 'bg-sky-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 font-normal hover:text-slate-600'
                  "
                  :title="day.name"
                >
                  {{ day.shortName }}
                </div>
              </div>
            </div>

            <!-- Footer: Progress Bar and Stats -->
            <div class="pt-2 flex items-center justify-between gap-4 text-xs sm:text-sm text-slate-600">
              <div class="flex items-center gap-3 flex-1">
                <div class="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300 bg-sky-500"
                    :style="{
                      width: `${list.items.length ? (list.items.filter((i) => i.done).length / list.items.length) * 100 : 0}%`,
                    }"
                  />
                </div>
                <span class="font-bold text-slate-700 tabular-nums shrink-0">
                  {{ toPersianDigits(list.items.filter((i) => i.done).length) }} از {{ toPersianDigits(list.items.length) }}
                </span>
              </div>

              <!-- Open arrow indicator -->
              <span class="flex items-center gap-1.5 font-semibold text-sky-600 shrink-0">
                مشاهده کارها
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </main>

      <!-- Floating Action Button for New List at bottom right, matching Add Task button style -->
      <button
        type="button"
        class="pointer-events-auto absolute bottom-4 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer"
        aria-label="لیست جدید"
        title="ایجاد لیست جدید"
        @click="openCreateModal"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>لیست جدید</span>
      </button>
    </div>

    <!-- Modal: Create / Edit List -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none"
        @click.self="closeModal"
      >
        <div class="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100" dir="rtl">
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 class="text-base font-bold text-slate-900">
              {{ editingListId ? 'ویرایش لیست' : 'ایجاد لیست جدید' }}
            </h2>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              @click="closeModal"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="mt-4 space-y-4" @submit.prevent="handleSaveList">
            <!-- Title -->
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">نام لیست یا پروژه *</label>
              <input
                v-model="formTitle"
                type="text"
                placeholder="مثال: پروژه کاری شرکت، مطالعه، خرید..."
                class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                autofocus
                required
              />
            </div>

            <!-- Scheduled Days of Week Picker -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700">روزهای اجرای این لیست در هفته</label>
                <div class="flex items-center gap-2 text-[10px] text-sky-600 font-semibold">
                  <button type="button" class="hover:underline cursor-pointer" @click="setWeekdayPreset('workdays')">کاری</button>
                  <span>•</span>
                  <button type="button" class="hover:underline cursor-pointer" @click="setWeekdayPreset('all')">هر روز</button>
                  <span>•</span>
                  <button type="button" class="hover:underline cursor-pointer" @click="setWeekdayPreset('none')">پاک کردن</button>
                </div>
              </div>

              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="day in PERSIAN_WEEKDAYS"
                  :key="day.dayIndex"
                  type="button"
                  class="flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold transition cursor-pointer border"
                  :class="
                    formScheduledDays.includes(day.dayIndex)
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                  "
                  @click="toggleFormWeekday(day.dayIndex)"
                >
                  <span>{{ day.shortName }}</span>
                </button>
              </div>
              <p class="text-[11px] text-slate-400 mt-1.5">
                در این روزها، کارت این لیست در صفحه روزها برای شما نمایش داده می‌شود.
              </p>
            </div>

            <!-- Buttons -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                class="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                @click="closeModal"
              >
                انصراف
              </button>
              <button
                type="submit"
                :disabled="!formTitle.trim()"
                class="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ editingListId ? 'ذخیره تغییرات' : 'ایجاد لیست' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>
