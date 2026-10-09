<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import {
  PERSIAN_WEEKDAYS,
  getScheduledDaysLabel,
  type TaskList,
} from '@/stores/lists'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    list?: TaskList | null
  }>(),
  {
    list: null,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: { title: string; scheduledDays: number[] }): void
}>()

const titleInput = ref('')
const selectedDays = ref<number[]>([6, 0, 1])
const inputRef = ref<HTMLInputElement | null>(null)

const isEditMode = computed(() => Boolean(props.list))

const scheduleSummary = computed(() => getScheduledDaysLabel(selectedDays.value))

const isAllDaysSelected = computed(() => selectedDays.value.length === 7)
const isWorkdaysSelected = computed(() => {
  const workdays = [6, 0, 1, 2, 3] // شنبه تا چهارشنبه
  return (
    selectedDays.value.length === 5 &&
    workdays.every((d) => selectedDays.value.includes(d))
  )
})

function pinViewport() {
  if (window.scrollY > 0 || document.documentElement.scrollTop > 0 || document.body.scrollTop > 0) {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.list) {
        titleInput.value = props.list.title
        selectedDays.value = [...props.list.scheduledDays]
      } else {
        titleInput.value = ''
        selectedDays.value = [6, 0, 1] // پیش‌فرض: شنبه، یکشنبه، دوشنبه
      }
      document.body.style.overflow = 'hidden'
      window.addEventListener('scroll', pinViewport, { passive: true })
      pinViewport()
      nextTick(() => {
        inputRef.value?.focus({ preventScroll: true })
      })
    } else {
      document.body.style.overflow = ''
      window.removeEventListener('scroll', pinViewport)
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('scroll', pinViewport)
})

function close() {
  emit('update:modelValue', false)
}

function toggleDay(dayIndex: number) {
  if (selectedDays.value.includes(dayIndex)) {
    selectedDays.value = selectedDays.value.filter((d) => d !== dayIndex)
  } else {
    selectedDays.value.push(dayIndex)
  }
}

function setPreset(preset: 'all' | 'workdays' | 'none') {
  if (preset === 'all') {
    selectedDays.value = [6, 0, 1, 2, 3, 4, 5]
  } else if (preset === 'workdays') {
    selectedDays.value = [6, 0, 1, 2, 3] // شنبه تا چهارشنبه
  } else {
    selectedDays.value = []
  }
}

function handleSubmit() {
  const text = titleInput.value.trim()
  if (!text) return
  emit('submit', {
    title: text,
    scheduledDays: [...selectedDays.value],
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex flex-col justify-end select-none"
        role="dialog"
        aria-modal="true"
        dir="rtl"
      >
        <!-- Backdrop with blur and darken -->
        <div
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300"
          @click="close"
        />

        <!-- Bottom Sheet Drawer -->
        <Transition
          appear
          enter-active-class="transition duration-300 ease-out transform"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in transform"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            class="relative z-10 w-full max-w-xl mx-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl transition-all border-t border-slate-100 sm:pb-6"
            @click.stop
          >
            <!-- Pull bar indicator -->
            <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

            <!-- Header information -->
            <div class="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2 min-w-0">
                <span
                  class="flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                  :class="isEditMode ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-700'"
                >
                  {{ isEditMode ? 'ویرایش لیست' : 'لیست جدید' }}
                </span>
                <span class="text-sm font-bold text-slate-800 truncate">
                  {{ isEditMode ? 'تنظیمات و روزهای اجرای لیست' : 'تعریف لیست یا پروژه جدید' }}
                </span>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <!-- Close Button -->
                <button
                  type="button"
                  class="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="بستن"
                  @click="close"
                >
                  <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <!-- List Title Input -->
              <div>
                <label for="list-title-input" class="block text-xs font-semibold text-slate-700 mb-1.5">
                  نام لیست یا پروژه:
                </label>
                <input
                  id="list-title-input"
                  ref="inputRef"
                  v-model="titleInput"
                  type="text"
                  placeholder="مثال: کارهای شخصی، پروژه کاری، ورزش و سلامت..."
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  required
                />
              </div>

              <!-- Scheduled Weekdays Section -->
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-semibold text-slate-700">
                    روزهای فعال در هفته:
                  </label>
                  <!-- Real-time schedule badge preview -->
                  <span class="inline-flex items-center text-[11px] font-medium text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full">
                    {{ scheduleSummary }}
                  </span>
                </div>

                <!-- 7 days button group with equal width -->
                <div class="grid grid-cols-7 gap-1.5">
                  <button
                    v-for="day in PERSIAN_WEEKDAYS"
                    :key="day.dayIndex"
                    type="button"
                    :title="day.name"
                    :aria-label="day.name"
                    class="h-10 sm:h-11 flex items-center justify-center rounded-2xl transition-all cursor-pointer border text-center select-none text-sm font-semibold"
                    :class="
                      selectedDays.includes(day.dayIndex)
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/25 font-bold scale-[1.02]'
                        : 'bg-slate-50/90 text-slate-700 border-slate-200/70 hover:bg-slate-100 hover:border-slate-300'
                    "
                    @click="toggleDay(day.dayIndex)"
                  >
                    <span>{{ day.shortName }}</span>
                  </button>
                </div>

                <!-- Quick presets pills -->
                <div class="flex items-center flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    class="rounded-xl px-2.5 py-1 text-[11px] font-medium transition cursor-pointer"
                    :class="
                      isWorkdaysSelected
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                    "
                    @click="setPreset('workdays')"
                  >
                    روزهای کاری (شنبه تا چهارشنبه)
                  </button>

                  <button
                    type="button"
                    class="rounded-xl px-2.5 py-1 text-[11px] font-medium transition cursor-pointer"
                    :class="
                      isAllDaysSelected
                        ? 'bg-sky-100 text-sky-700 border border-sky-200'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                    "
                    @click="setPreset('all')"
                  >
                    تمام هفته
                  </button>

                  <button
                    v-if="selectedDays.length > 0"
                    type="button"
                    class="mr-auto rounded-xl px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    @click="setPreset('none')"
                  >
                    پاک کردن
                  </button>
                </div>

                <p class="text-[11px] text-slate-400 pt-0.5">
                  کارت این لیست در روزهای انتخابی در تب روزها نمایش داده می‌شود.
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  :disabled="!titleInput.trim()"
                  class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] cursor-pointer"
                >
                  <svg
                    v-if="!isEditMode"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ isEditMode ? 'ذخیره تغییرات' : 'ایجاد لیست' }}</span>
                </button>

                <button
                  type="button"
                  class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer"
                  @click="close"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
