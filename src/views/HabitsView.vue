<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { registerBackHandler } from '@/composables/useBackButton'
import { toPersianDigits } from '@/modules/timeline/PersianDate'
import {
  useHabitsStore,
  WEEKDAYS_MAP,
  type Habit,
  type HabitPeriod,
} from '@/stores/habits'
import HabitFormSheet from '@/components/ui/HabitFormSheet.vue'
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog.vue'
import texturePatternImg from '@/assets/images/Texture-01-xs-green.png'
import planningCharacterImg from '@/assets/images/planning_character_01.png'

defineOptions({
  name: 'HabitsView',
})

const router = useRouter()
const habitsStore = useHabitsStore()

// Period filter: 'all' | 'daily' | 'weekly' | 'monthly'
const periodFilter = ref<'all' | HabitPeriod>('all')

// Form sheet state
const isFormSheetOpen = ref(false)
const habitToEdit = ref<Habit | null>(null)

// Delete dialog state
const isDeleteDialogOpen = ref(false)
const habitToDelete = ref<Habit | null>(null)

// Toast notification
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

onBeforeUnmount(() => {
  unregisterBackHandler()
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})

const unregisterBackHandler = registerBackHandler(() => {
  if (router.currentRoute.value.name !== 'habits') return false

  if (isDeleteDialogOpen.value) {
    isDeleteDialogOpen.value = false
    return true
  }
  if (isFormSheetOpen.value) {
    isFormSheetOpen.value = false
    return true
  }
  return false
})

// -------------------------------------------------------------
// Filtered Habits List
// -------------------------------------------------------------
const filteredHabits = computed(() => {
  if (periodFilter.value === 'all') {
    return habitsStore.habits
  }
  return habitsStore.habits.filter((h) => h.period === periodFilter.value)
})

// -------------------------------------------------------------
// Habit CRUD Handlers
// -------------------------------------------------------------
function openCreateSheet() {
  habitToEdit.value = null
  isFormSheetOpen.value = true
}

function openEditSheet(habit: Habit) {
  habitToEdit.value = habit
  isFormSheetOpen.value = true
}

function navigateToHabit(habitId: string) {
  router.push(`/habits/${habitId}`)
}

function handleSaveHabit(data: { title: string; period: HabitPeriod }) {
  if (habitToEdit.value) {
    habitsStore.updateHabit(habitToEdit.value.id, {
      title: data.title,
      period: data.period,
    })
    showToast('مشخصات عادت به‌روزرسانی شد')
  } else {
    habitsStore.createHabit({
      title: data.title,
      period: data.period,
    })
    showToast('عادت ایجاد شد')
  }
}

function requestDeleteHabit(habit: Habit) {
  habitToDelete.value = habit
  isDeleteDialogOpen.value = true
}

function confirmDeleteHabit() {
  if (!habitToDelete.value) return
  const title = habitToDelete.value.title
  habitsStore.deleteHabit(habitToDelete.value.id)
  habitToDelete.value = null
  showToast(`عادت «${title}» حذف شد`)
}

// Helper to format schedule text for cards
function getHabitScheduleSummary(habit: Habit): string {
  if (habit.period === 'daily') {
    const count = habit.dailyTasks?.length || 0
    return `${toPersianDigits(count)} تسک تکرار روزانه`
  }
  if (habit.period === 'weekly') {
    const activeDays = Object.entries(habit.weeklySchedule || {})
      .filter(([, tasks]) => tasks && tasks.length > 0)
      .map(([dayStr]) => {
        const found = WEEKDAYS_MAP.find((w) => w.dayIndex === Number(dayStr))
        return found ? found.name : ''
      })
      .filter(Boolean)

    if (activeDays.length === 7) return 'تمام روزهای هفته'
    if (activeDays.length === 0) return 'بدون روز فعال'
    return activeDays.join('، ')
  }
  if (habit.period === 'monthly') {
    const activeDays = Object.entries(habit.monthlySchedule || {})
      .filter(([, tasks]) => tasks && tasks.length > 0)
      .map(([dayStr]) => `روز ${toPersianDigits(dayStr)}`)

    if (activeDays.length === 0) return 'بدون روز فعال'
    return activeDays.join('، ') + ' هر ماه'
  }
  return ''
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none" dir="rtl">
    <!-- Header matching DayView and ListsView aesthetic -->
    <header class="relative z-20 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md shadow-sm shadow-slate-900/5">
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-900">عادت‌ها</h1>
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
              {{ toPersianDigits(habitsStore.habits.length) }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            روال‌های منظم و ساخت عادت‌های پایدار
          </p>
        </div>

        <!-- Create Button in Header -->
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 active:scale-95 transition cursor-pointer"
          @click="openCreateSheet"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>عادت جدید</span>
        </button>
      </div>

      <!-- Period Filter Pills -->
      <div class="mx-auto max-w-2xl mt-3 flex items-center gap-1.5 overflow-x-auto select-none">
        <button
          type="button"
          class="rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
          :class="
            periodFilter === 'all'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
          "
          @click="periodFilter = 'all'"
        >
          همه ({{ toPersianDigits(habitsStore.habits.length) }})
        </button>

        <button
          type="button"
          class="rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
          :class="
            periodFilter === 'daily'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
          "
          @click="periodFilter = 'daily'"
        >
          هر روز
        </button>

        <button
          type="button"
          class="rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
          :class="
            periodFilter === 'weekly'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
          "
          @click="periodFilter = 'weekly'"
        >
          هفتگی
        </button>

        <button
          type="button"
          class="rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0"
          :class="
            periodFilter === 'monthly'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
          "
          @click="periodFilter = 'monthly'"
        >
          ماهانه
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main
      class="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-5 pb-24 md:px-8 bg-gradient-to-br from-white via-amber-100/20 to-white"
      style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
    >
      <!-- Repeating Texture Overlay -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply"
        :style="{
          backgroundImage: `url(${texturePatternImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
        }"
      />

      <div class="relative mx-auto flex h-full min-h-full max-w-2xl flex-col">
        <!-- Empty State -->
        <div
          v-if="filteredHabits.length === 0"
            class="flex flex-1 w-full flex-col items-center justify-center my-auto py-12 select-none"
          >
            <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
              <img
                :src="planningCharacterImg"
                alt="عادتی یافت نشد"
                class="w-48 sm:w-56 h-auto object-contain drop-shadow-md opacity-90 transition-transform pointer-events-none"
                loading="lazy"
              />
              <p class="mt-3 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-600 shadow-sm">
                هیچ عادتی در این بخش وجود ندارد
              </p>
              <button
                type="button"
                class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition cursor-pointer"
                @click="openCreateSheet"
              >
                + ایجاد اولین عادت
              </button>
            </div>
          </div>

          <!-- Habits Cards List -->
          <div v-else class="space-y-3 pb-24">
            <div
              v-for="habit in filteredHabits"
              :key="habit.id"
              class="group relative flex flex-col rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-4 sm:p-5 shadow-xs transition hover:border-slate-300 hover:shadow-md cursor-pointer active:scale-[0.99]"
              @click="navigateToHabit(habit.id)"
            >
              <!-- Card Top Row: Title, Period Badge, Edit & Delete Buttons -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      class="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      :class="
                        habit.period === 'daily'
                          ? 'bg-sky-100 text-sky-800'
                          : habit.period === 'weekly'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                      "
                    >
                      {{ habit.period === 'daily' ? 'هر روز' : habit.period === 'weekly' ? 'هفتگی' : 'ماهانه' }}
                    </span>
                    <h3 class="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {{ habit.title }}
                    </h3>
                  </div>

                  <p class="text-xs text-slate-500 mt-1">
                    {{ getHabitScheduleSummary(habit) }}
                  </p>
                </div>

                <!-- Action Buttons: Edit, Delete -->
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
                    title="ویرایش مشخصات عادت"
                    aria-label="ویرایش مشخصات عادت"
                    @click.stop="openEditSheet(habit)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer"
                    title="حذف عادت"
                    aria-label="حذف عادت"
                    @click.stop="requestDeleteHabit(habit)"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Habit Summary & Link to Details -->
              <div class="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div class="flex items-center gap-2 text-xs text-slate-600">
                  <span class="font-semibold">{{ toPersianDigits(habitsStore.getTotalTasksCount(habit)) }} تسک تعریف‌شده</span>
                  <span
                    v-if="habitsStore.calculateHabitStreak(habit) > 0"
                    class="text-amber-700 font-bold"
                  >
                    · 🔥 {{ toPersianDigits(habitsStore.calculateHabitStreak(habit)) }} روز استمرار
                  </span>
                </div>

                <div class="flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:text-amber-800 transition">
                  <span>مدیریت و جزئیات تسک‌ها</span>
                  <svg class="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
    </main>

    <!-- Floating Action Button for Habit Creation (matching Days and Lists style) -->
    <button
      type="button"
      class="pointer-events-auto absolute bottom-4 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/30 transition-all hover:bg-amber-700 hover:shadow-xl active:scale-95 cursor-pointer"
      aria-label="عادت جدید"
      title="ایجاد عادت جدید"
      @click="openCreateSheet"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span>عادت جدید</span>
    </button>

    <!-- Create / Edit Habit Form Sheet -->
    <HabitFormSheet
      v-model="isFormSheetOpen"
      :habit="habitToEdit"
      @submit="handleSaveHabit"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="isDeleteDialogOpen"
      title="حذف عادت"
      message="آیا از حذف این عادت اطمینان دارید؟ تمام تسک‌ها و تنظیمات دوره تکرار این عادت برای همیشه پاک خواهد شد."
      :task-title="habitToDelete?.title || ''"
      confirm-button-text="بله، حذف عادت"
      @confirm="confirmDeleteHabit"
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
