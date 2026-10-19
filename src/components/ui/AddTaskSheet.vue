<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useKeyboard } from '@/composables/useKeyboard'
import type { PersianDate } from '@/modules/timeline/PersianDate'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    targetDate?: PersianDate | null
    customTitle?: string
    customSubtitle?: string
    customBadge?: string
    showTrackedOption?: boolean
  }>(),
  {
    targetDate: null,
    customTitle: '',
    customSubtitle: '',
    customBadge: '',
    showTrackedOption: undefined,
  }
)

const shouldShowTrackedOption = computed(() => {
  if (props.showTrackedOption !== undefined) {
    return props.showTrackedOption
  }
  return Boolean(props.targetDate) && !props.customBadge && !props.customTitle
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', title: string, options?: { isTracked: boolean; allowedDays: number[] }): void
}>()

const taskInput = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const { keyboardTransformStyle, hideKeyboard } = useKeyboard()

const WEEKDAYS_CONFIG = [
  { dayIndex: 6, name: 'شنبه', shortName: 'ش' },
  { dayIndex: 0, name: 'یک‌شنبه', shortName: 'ی' },
  { dayIndex: 1, name: 'دوشنبه', shortName: 'د' },
  { dayIndex: 2, name: 'سه‌شنبه', shortName: 'س' },
  { dayIndex: 3, name: 'چهارشنبه', shortName: 'چ' },
  { dayIndex: 4, name: 'پنج‌شنبه', shortName: 'پ' },
  { dayIndex: 5, name: 'جمعه', shortName: 'ج' },
]

const isTracked = ref(false)
const selectedAllowedDays = ref<number[]>([6, 0, 1, 2, 3, 4, 5])

function toggleDay(dayIndex: number) {
  if (selectedAllowedDays.value.includes(dayIndex)) {
    if (selectedAllowedDays.value.length > 1) {
      selectedAllowedDays.value = selectedAllowedDays.value.filter((d) => d !== dayIndex)
    }
  } else {
    selectedAllowedDays.value.push(dayIndex)
  }
}

function selectAllDays() {
  selectedAllowedDays.value = [6, 0, 1, 2, 3, 4, 5]
}

let focusTimeout: ReturnType<typeof setTimeout> | null = null

function adjustHeight() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
}

function handleInput() {
  if (taskInput.value.includes('\n') || taskInput.value.includes('\r')) {
    taskInput.value = taskInput.value.replace(/[\r\n]+/g, ' ')
  }
  adjustHeight()
}

watch(taskInput, () => {
  nextTick(() => {
    adjustHeight()
  })
})

function focusInput() {
  if (inputRef.value) {
    inputRef.value.focus({ preventScroll: true })
    adjustHeight()
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (focusTimeout) {
      clearTimeout(focusTimeout)
      focusTimeout = null
    }

    if (isOpen) {
      taskInput.value = ''
      isTracked.value = false
      selectedAllowedDays.value = [6, 0, 1, 2, 3, 4, 5]
      document.body.style.overflow = 'hidden'
      nextTick(() => {
        adjustHeight()
      })
      // Delay focus slightly (220ms) so sheet slide-up finishes smoothly
      // without colliding with the keyboard opening animation
      focusTimeout = setTimeout(() => {
        if (props.modelValue) {
          focusInput()
        }
      }, 220)
    } else {
      hideKeyboard()
      inputRef.value?.blur()
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  if (focusTimeout) clearTimeout(focusTimeout)
  document.body.style.overflow = ''
})

function close() {
  hideKeyboard()
  inputRef.value?.blur()
  emit('update:modelValue', false)
}

function handleSubmit() {
  const text = taskInput.value.replace(/[\r\n]+/g, ' ').trim()
  if (!text) return
  const isTaskTracked = shouldShowTrackedOption.value ? isTracked.value : false
  emit('submit', text, {
    isTracked: isTaskTracked,
    allowedDays: isTaskTracked ? [...selectedAllowedDays.value] : [6, 0, 1, 2, 3, 4, 5],
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
        class="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
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
            class="relative z-10 w-full max-w-xl mx-auto"
            @click.stop
          >
            <!-- Drawer Card with Hardware-Accelerated Keyboard Transform -->
            <div
              class="rounded-t-3xl bg-white p-5 pb-8 shadow-2xl border-t border-slate-100"
              :style="keyboardTransformStyle"
            >
              <!-- Pull bar indicator -->
              <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

              <!-- Header information -->
              <div v-if="targetDate || customTitle || customBadge" class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    v-if="targetDate"
                    class="flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                    :class="
                      targetDate.isToday()
                        ? 'bg-sky-100 text-sky-700'
                        : targetDate.isTomorrow()
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'
                    "
                  >
                    {{ targetDate.getRelativeLabel() }}
                  </span>
                  <span
                    v-else-if="customBadge"
                    class="flex items-center justify-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 shrink-0"
                  >
                    {{ customBadge }}
                  </span>
                  <div class="min-w-0">
                    <span v-if="targetDate" class="text-sm font-bold text-slate-800">
                      {{ targetDate.weekdayName }}، {{ targetDate.formatJalali() }}
                    </span>
                    <div v-else class="flex flex-col">
                      <span class="text-sm font-bold text-slate-800 truncate">
                        {{ customTitle }}
                      </span>
                      <span v-if="customSubtitle" class="text-[11px] text-slate-400 font-normal truncate">
                        {{ customSubtitle }}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                  @click="close"
                  aria-label="بستن"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-4">
                <div>
                  <label for="task-text-input" class="block text-xs font-semibold text-slate-600 mb-1.5">
                    توضیح یا عنوان کار جدید:
                  </label>
                  <textarea
                    id="task-text-input"
                    ref="inputRef"
                    v-model="taskInput"
                    rows="1"
                    enterkeyhint="done"
                    placeholder="مثلا: خرید کتاب، ارسال ایمیل به همکاران..."
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 resize-none overflow-y-auto whitespace-pre-wrap break-words"
                    style="min-height: 48px; max-height: 120px;"
                    required
                    @input="handleInput"
                    @keydown="handleKeydown"
                  />
                </div>

                <!-- Tracked Task Option (تسک پیگیری‌شونده) -->
                <div v-if="shouldShowTrackedOption" class="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 space-y-3">
                  <div
                    class="flex items-center justify-between cursor-pointer select-none"
                    @click="isTracked = !isTracked"
                  >
                    <div class="flex items-center gap-2.5">
                      <!-- Icon with circular rollover (exactly same size as frame) -->
                      <div
                        class="flex h-5 w-5 shrink-0 items-center justify-center transition-colors"
                        :class="isTracked ? 'text-sky-600' : 'text-slate-400'"
                      >
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-slate-800">تسک پیگیری‌شونده</span>
                          <span
                            v-if="isTracked"
                            class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700"
                          >
                            فعال
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5">
                          انتقال خودکار به روزهای بعد در صورت انجام نشدن
                        </p>
                      </div>
                    </div>

                    <!-- Toggle Switch -->
                    <div
                      class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      :class="isTracked ? 'bg-sky-600' : 'bg-slate-300'"
                    >
                      <span
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        :class="isTracked ? '-translate-x-5' : 'translate-x-0'"
                      />
                    </div>
                  </div>

                  <!-- Allowed Weekdays Section (shown when isTracked is true) -->
                  <div v-if="isTracked" class="pt-2 border-t border-slate-200/80 space-y-2">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-semibold text-slate-700">روزهای مجاز برای انجام کار:</span>
                      <button
                        type="button"
                        class="text-[11px] font-bold text-sky-600 hover:text-sky-700 transition cursor-pointer"
                        @click.stop="selectAllDays"
                      >
                        انتخاب تمام روزها
                      </button>
                    </div>

                    <!-- 7 Days Grid: Only the first letter of each day -->
                    <div class="grid grid-cols-7 gap-1.5">
                      <button
                        v-for="wd in WEEKDAYS_CONFIG"
                        :key="wd.dayIndex"
                        type="button"
                        class="flex h-9 items-center justify-center rounded-xl text-center transition-all cursor-pointer active:scale-95"
                        :class="[
                          selectedAllowedDays.includes(wd.dayIndex)
                            ? 'bg-sky-600 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100/80'
                        ]"
                        @click.stop="toggleDay(wd.dayIndex)"
                      >
                        <span class="text-xs font-bold leading-none">
                          {{ wd.shortName }}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    :disabled="!taskInput.trim()"
                    class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    ثبت کار
                  </button>
                  <button
                    type="button"
                    class="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition"
                    @click="close"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
