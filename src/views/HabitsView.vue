<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { registerBackHandler } from '@/composables/useBackButton'
import { toPersianDigits } from '@/modules/timeline/PersianDate'
import {
  useHabitsStore,
  type Habit,
  type HabitPeriod,
} from '@/stores/habits'
import HabitFormSheet from '@/components/ui/HabitFormSheet.vue'
import texturePatternImg from '@/assets/images/Texture-01-xs-green.png'
import planningCharacterImg from '@/assets/images/planning_character_01.png'

defineOptions({
  name: 'HabitsView',
})

const router = useRouter()
const habitsStore = useHabitsStore()

// Form sheet state
const isFormSheetOpen = ref(false)
const habitToEdit = ref<Habit | null>(null)

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

  if (isFormSheetOpen.value) {
    isFormSheetOpen.value = false
    return true
  }
  return false
})

// -------------------------------------------------------------
// All Habits List
// -------------------------------------------------------------
const filteredHabits = computed(() => habitsStore.habits)

// -------------------------------------------------------------
// Habit Creation Handler
// -------------------------------------------------------------
function openCreateSheet() {
  habitToEdit.value = null
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
                هیچ عادتی تعریف نشده است
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
              <!-- Card Top Row: Title, Period Badge, and Streak Badge -->
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="rounded-lg px-2 py-0.5 text-[10px] font-bold shrink-0"
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

                <!-- Streak badge (flame icon + personalized count + unit) -->
                <div class="shrink-0">
                  <div
                    v-if="habitsStore.getHabitStreakOverview(habit).streak > 0"
                    class="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-2xs"
                  >
                    <span class="text-xs">🔥</span>
                    <span>{{ habitsStore.getHabitStreakOverview(habit).streakLabel }}</span>
                  </div>
                  <div
                    v-else
                    class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-400"
                  >
                    <span>{{ habitsStore.getHabitStreakOverview(habit).streakLabel }}</span>
                  </div>
                </div>
              </div>

              <!-- Motivating Current Status / Next Action Indicator -->
              <div class="mt-2.5 flex items-center">
                <div
                  class="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] transition"
                  :class="{
                    'bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold':
                      habitsStore.getHabitStreakOverview(habit).currentStatus.type === 'completed',
                    'bg-amber-100/90 text-amber-900 border border-amber-300 font-bold':
                      habitsStore.getHabitStreakOverview(habit).currentStatus.type === 'today_pending',
                    'bg-slate-100/90 text-slate-600 font-medium':
                      habitsStore.getHabitStreakOverview(habit).currentStatus.type === 'upcoming',
                    'bg-slate-50 text-slate-400 font-normal':
                      habitsStore.getHabitStreakOverview(habit).currentStatus.type === 'empty',
                  }"
                >
                  <span
                    v-if="habitsStore.getHabitStreakOverview(habit).currentStatus.type === 'today_pending'"
                    class="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping inline-block"
                  />
                  <span>{{ habitsStore.getHabitStreakOverview(habit).currentStatus.message }}</span>
                </div>
              </div>

              <!-- 7 Periods Tracker Row -->
              <div class="mt-3 pt-3 border-t border-slate-100">
                <div class="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-2 px-0.5">
                  <span class="font-semibold text-slate-500">{{ habitsStore.getHabitStreakOverview(habit).title }}</span>
                  <span class="text-[10px] text-slate-400">
                    {{ habit.period === 'daily' ? 'وضعیت روزها' : habit.period === 'weekly' ? 'وضعیت نوبت‌ها' : 'وضعیت ماه‌ها' }}
                  </span>
                </div>

                <!-- 7 items in a grid -->
                <div class="grid grid-cols-7 gap-1 sm:gap-2">
                  <div
                    v-for="item in habitsStore.getHabitStreakOverview(habit).items"
                    :key="item.key"
                    class="flex flex-col items-center justify-center rounded-2xl py-1.5 px-0.5 sm:px-1 transition"
                    :class="[
                      item.isCurrent
                        ? 'bg-amber-50/50 ring-1 ring-amber-200/70'
                        : 'bg-slate-50/70'
                    ]"
                  >
                    <!-- Label (Weekday short name / Week date / Month name) -->
                    <span
                      class="text-[9px] sm:text-[11px] text-center leading-tight truncate max-w-full mb-1.5"
                      :class="item.isCurrent ? 'text-amber-900 font-bold' : 'text-slate-600 font-medium'"
                    >
                      {{ item.label }}
                    </span>

                    <!-- Indicator Circle -->
                    <div
                      class="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs font-bold transition"
                      :class="{
                        'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-2xs shadow-amber-500/30': item.status === 'completed',
                        'bg-slate-100 text-slate-400 border border-slate-200': item.status === 'missed',
                        'bg-amber-100 text-amber-700 border-2 border-dashed border-amber-400': item.status === 'pending',
                        'bg-slate-100/60 text-slate-300': item.status === 'empty'
                      }"
                    >
                      <!-- Completed: Clean Flame of Fire -->
                      <svg
                        v-if="item.status === 'completed'"
                        class="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-white"
                        viewBox="0 0 384 512"
                      >
                        <path d="M216 23.86c0-23.8-30.65-32.77-44.15-13.04C48 191.85 224 200 224 288c0 35.63-29.11 64.46-64.85 63.99-35.17-.45-63.15-29.77-63.15-64.94v-85.51c0-21.7-26.47-32.23-41.43-16.5C27.8 213.16 0 261.33 0 320c0 105.87 86.13 192 192 192s192-86.13 192-192c0-170.29-168-193-168-296.14z" />
                      </svg>
                      <!-- Pending: Small dot -->
                      <span
                        v-else-if="item.status === 'pending'"
                        class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                      />
                      <!-- Missed: Simple dash -->
                      <span v-else-if="item.status === 'missed'" class="text-xs font-semibold leading-none">−</span>
                      <!-- Empty: Dot -->
                      <span v-else class="h-1 w-1 rounded-full bg-slate-300" />
                    </div>

                    <!-- Sublabel (Day number / Month day) -->
                    <span
                      v-if="item.sublabel"
                      class="text-[9px] sm:text-[10px] mt-1 truncate max-w-full leading-tight"
                      :class="item.isCurrent ? 'text-amber-800 font-bold' : 'text-slate-400 font-medium'"
                    >
                      {{ item.sublabel }}
                    </span>
                  </div>
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
