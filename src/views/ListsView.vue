<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  useListsStore,
  PERSIAN_WEEKDAYS,
  getScheduledDaysLabel,
  type TaskList,
} from '@/stores/lists'
import ListFormSheet from '@/components/ui/ListFormSheet.vue'
import texturePatternImg from '@/assets/images/Texture-01-xs.png'
import planningCharacterImg from '@/assets/images/planning_character_01.png'

defineOptions({
  name: 'ListsView',
})

const router = useRouter()
const listsStore = useListsStore()

// State for create/edit bottom sheet (list settings)
const isListSheetOpen = ref(false)
const listToEdit = ref<TaskList | null>(null)

// Toast notification
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})

function openCreateModal() {
  listToEdit.value = null
  isListSheetOpen.value = true
}

function handleSaveList(data: { title: string; scheduledDays: number[] }) {
  if (listToEdit.value) {
    listsStore.updateList(listToEdit.value.id, {
      title: data.title,
      scheduledDays: data.scheduledDays,
    })
    showToast('تغییرات لیست ذخیره شد')
  } else {
    const created = listsStore.createList({
      title: data.title,
      scheduledDays: data.scheduledDays,
    })
    showToast('لیست جدید ایجاد شد')
    router.push(`/lists/${created.id}`)
  }
}

function openListDetail(listId: string) {
  router.push(`/lists/${listId}`)
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none" dir="rtl">
    <!-- Lists Overview (Cards list) -->
    <div class="relative flex h-full w-full flex-col overflow-hidden">
      <!-- Overview Header matching DayView shadow and styling -->
      <header class="relative z-20 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-4 backdrop-blur-md shadow-sm shadow-slate-900/5">
        <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-bold text-slate-900">لیست‌ها</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              دسته‌بندی‌ها و پروژه‌های زمان‌بندی‌شده
            </p>
          </div>
        </div>
      </header>

      <!-- Overview Content with inverted gradient: white corners, more transparent/whitish emerald in center -->
      <main
        class="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-5 pb-24 md:px-8 bg-gradient-to-br from-white via-emerald-200/25 to-white"
        style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
      >
        <!-- Repeating Texture Overlay -->
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-multiply"
          :style="{
            backgroundImage: `url(${texturePatternImg})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }"
        />

        <div class="relative mx-auto flex h-full min-h-full max-w-2xl flex-col">
          <!-- Empty State: Planning character centered vertically & horizontally (matching DayView) -->
          <div
            v-if="listsStore.lists.length === 0"
            class="flex flex-1 w-full flex-col items-center justify-center my-auto py-8 select-none"
          >
            <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
              <img
                :src="planningCharacterImg"
                alt="برنامه چی بود؟"
                class="w-52 sm:w-64 md:w-72 h-auto object-contain drop-shadow-md opacity-95 transition-transform hover:scale-105 duration-300 pointer-events-none"
                loading="lazy"
              />
              <p
                class="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 shadow-sm"
              >
                برنامه چی بود؟
              </p>
            </div>
          </div>

          <!-- List Cards -->
          <div v-else class="space-y-3 pb-24">
            <div
              v-for="list in listsStore.lists"
              :key="list.id"
              class="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-3.5 sm:p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md hover:bg-white active:scale-[0.99] cursor-pointer"
              @click="openListDetail(list.id)"
            >
              <!-- Card Header: Title & Active-days Indicator -->
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-sm sm:text-base font-medium text-slate-800 truncate">
                    {{ list.title }}
                  </h3>
                </div>

                <!-- Opposite the title: active-weekdays badge (dot indicator) -->
                <div class="flex items-center gap-2 shrink-0">
                  <span
                    class="flex items-center gap-1 rounded-full border border-slate-200/70 bg-slate-50 px-2 py-1"
                    :title="`فعال در: ${getScheduledDaysLabel(list.scheduledDays)}`"
                  >
                    <span
                      v-for="day in PERSIAN_WEEKDAYS"
                      :key="day.dayIndex"
                      class="h-1.5 w-1.5 rounded-full transition-colors"
                      :class="
                        list.scheduledDays.includes(day.dayIndex)
                          ? 'bg-sky-500'
                          : 'bg-slate-300'
                      "
                      :title="day.name"
                    />
                  </span>
                </div>
              </div>
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

    <!-- Create / Edit List Bottom Sheet -->
    <ListFormSheet
      v-model="isListSheetOpen"
      :list="listToEdit"
      @submit="handleSaveList"
    />

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-3"
      >
        <div
          v-if="toastMessage"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
