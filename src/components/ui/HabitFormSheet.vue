<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useKeyboard } from '@/composables/useKeyboard'
import type { Habit, HabitPeriod } from '@/stores/habits'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    habit?: Habit | null
  }>(),
  {
    habit: null,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (
    e: 'submit',
    data: {
      title: string
      period: HabitPeriod
    }
  ): void
}>()

const titleInput = ref('')
const selectedPeriod = ref<HabitPeriod>('daily')
const inputRef = ref<HTMLInputElement | null>(null)
const { keyboardTransformStyle, hideKeyboard } = useKeyboard()

const isEditMode = computed(() => Boolean(props.habit))

let focusTimeout: ReturnType<typeof setTimeout> | null = null

function resetForm() {
  if (props.habit) {
    titleInput.value = props.habit.title
    selectedPeriod.value = props.habit.period
  } else {
    titleInput.value = ''
    selectedPeriod.value = 'daily'
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (focusTimeout) clearTimeout(focusTimeout)
    if (isOpen) {
      resetForm()
      document.body.style.overflow = 'hidden'
      focusTimeout = setTimeout(() => {
        inputRef.value?.focus()
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
  emit('update:modelValue', false)
}

const canSubmit = computed(() => Boolean(titleInput.value.trim()))

function handleSubmit() {
  if (!canSubmit.value) return
  emit('submit', {
    title: titleInput.value.trim(),
    period: selectedPeriod.value,
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
        <!-- Backdrop with blur -->
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
            <!-- Drawer Card -->
            <div
              class="rounded-t-3xl bg-white p-5 pb-8 shadow-2xl border-t border-slate-100 max-h-[90vh] overflow-y-auto"
              :style="keyboardTransformStyle"
            >
              <!-- Pull bar indicator -->
              <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />

              <!-- Header -->
              <div class="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold shrink-0"
                    :class="isEditMode ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'"
                  >
                    {{ isEditMode ? 'ویرایش مشخصات عادت' : 'عادت جدید' }}
                  </span>
                  <span class="text-sm font-bold text-slate-800 truncate">
                    {{ isEditMode ? 'تغییر عنوان و دوره تکرار' : 'تعریف نام و دوره تکرار' }}
                  </span>
                </div>

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

              <form @submit.prevent="handleSubmit" class="space-y-5">
                <!-- 1. Habit Title Input -->
                <div>
                  <label for="habit-title-input" class="block text-xs font-semibold text-slate-700 mb-1.5">
                    نام یا عنوان عادت:
                  </label>
                  <input
                    id="habit-title-input"
                    ref="inputRef"
                    v-model="titleInput"
                    type="text"
                    placeholder="مثال: روتین صبحگاهی، برنامه ورزشی، مرور ماهانه..."
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                    required
                  />
                </div>

                <!-- 2. Repetition Period Selector -->
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-2">
                    دوره تکرار عادت:
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <!-- Daily -->
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all cursor-pointer select-none text-center"
                      :class="
                        selectedPeriod === 'daily'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-2 ring-amber-400/40 font-bold'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      "
                      @click="selectedPeriod = 'daily'"
                    >
                      <svg class="h-5 w-5 mb-1" :class="selectedPeriod === 'daily' ? 'text-amber-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="text-xs">هر روز</span>
                    </button>

                    <!-- Weekly -->
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all cursor-pointer select-none text-center"
                      :class="
                        selectedPeriod === 'weekly'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-2 ring-amber-400/40 font-bold'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      "
                      @click="selectedPeriod = 'weekly'"
                    >
                      <svg class="h-5 w-5 mb-1" :class="selectedPeriod === 'weekly' ? 'text-amber-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="text-xs">هفتگی</span>
                    </button>

                    <!-- Monthly -->
                    <button
                      type="button"
                      class="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all cursor-pointer select-none text-center"
                      :class="
                        selectedPeriod === 'monthly'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm ring-2 ring-amber-400/40 font-bold'
                          : 'bg-slate-50/80 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      "
                      @click="selectedPeriod = 'monthly'"
                    >
                      <svg class="h-5 w-5 mb-1" :class="selectedPeriod === 'monthly' ? 'text-amber-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span class="text-xs">ماهانه</span>
                    </button>
                  </div>
                </div>

                <!-- 3. Action Buttons -->
                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    :disabled="!canSubmit"
                    class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition hover:bg-amber-700 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] cursor-pointer"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ isEditMode ? 'ذخیره تغییرات' : 'ایجاد عادت' }}</span>
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
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
