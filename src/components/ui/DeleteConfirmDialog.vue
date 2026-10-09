<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    count?: number
    taskTitle?: string
    confirmButtonText?: string
  }>(),
  {
    count: 1,
    title: '',
    message: '',
    taskTitle: '',
    confirmButtonText: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

function onCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function onConfirm() {
  emit('update:modelValue', false)
  emit('confirm')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop with blur -->
        <div
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity"
          @click="onCancel"
        />

        <!-- Dialog Card -->
        <div
          class="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 text-center"
          @click.stop
        >
          <!-- Warning Icon -->
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h3 class="text-base font-bold text-slate-800">
            {{ title || (count > 1 ? `حذف ${count} کار انتخاب‌شده` : 'حذف کار') }}
          </h3>

          <p class="mt-2 text-sm text-slate-500 leading-relaxed">
            <template v-if="message">
              {{ message }}
            </template>
            <template v-else-if="count > 1">
              آیا از حذف این {{ count }} کار اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </template>
            <template v-else>
              آیا از حذف این کار اطمینان دارید؟ این عملیات قابل بازگشت نیست.
            </template>
          </p>

          <p
            v-if="!message && count === 1 && taskTitle"
            class="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 line-clamp-2 border border-slate-100"
          >
            «{{ taskTitle }}»
          </p>

          <!-- Action Buttons -->
          <div class="mt-6 flex items-center gap-3">
            <button
              type="button"
              class="flex-1 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 active:scale-95 cursor-pointer"
              @click="onConfirm"
            >
              {{ confirmButtonText || 'بله، حذف شود' }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              @click="onCancel"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
