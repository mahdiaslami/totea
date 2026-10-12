<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useKeyboard } from '@/composables/useKeyboard'
import type { PersianDate } from '@/modules/timeline/PersianDate'
import type { Task } from '@/modules/timeline/date'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    task: Task | { id: string; title: string; done?: boolean } | null
    targetDate?: PersianDate | null
    customTitle?: string
    customSubtitle?: string
  }>(),
  {
    targetDate: null,
    customTitle: '',
    customSubtitle: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', title: string): void
}>()

const taskInput = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)
const { keyboardTransformStyle, hideKeyboard } = useKeyboard()

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
    inputRef.value.select()
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
      taskInput.value = props.task?.title || ''
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
  emit('submit', text)
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
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="flex items-center justify-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700 shrink-0">
                    ویرایش کار
                  </span>
                  <span v-if="targetDate" class="text-sm font-bold text-slate-800">
                    {{ targetDate.weekdayName }}، {{ targetDate.formatJalali() }}
                  </span>
                  <div v-else-if="customTitle" class="min-w-0 flex flex-col">
                    <span class="text-sm font-bold text-slate-800 truncate">
                      {{ customTitle }}
                    </span>
                    <span v-if="customSubtitle" class="text-[11px] text-slate-400 font-normal truncate">
                      {{ customSubtitle }}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
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
                  <label for="edit-task-text-input" class="block text-xs font-semibold text-slate-600 mb-1.5">
                    عنوان یا متن کار:
                  </label>
                  <textarea
                    id="edit-task-text-input"
                    ref="inputRef"
                    v-model="taskInput"
                    rows="1"
                    enterkeyhint="done"
                    placeholder="عنوان کار..."
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-6 text-slate-800 placeholder-slate-400 outline-none transition-colors focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 resize-none overflow-y-auto whitespace-pre-wrap break-words"
                    style="min-height: 48px; max-height: 120px;"
                    required
                    @input="handleInput"
                    @keydown="handleKeydown"
                  />
                </div>

                <div class="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    :disabled="!taskInput.trim()"
                    class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:bg-sky-700 disabled:opacity-50 disabled:shadow-none active:scale-[0.98] cursor-pointer"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    ذخیره تغییرات
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
