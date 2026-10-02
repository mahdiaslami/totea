<script setup lang="ts">
defineProps<{
  selectedCount: number
  canCopy: boolean
}>()

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 select-none"
    role="region"
    aria-label="ابزارهای مدیریت کارهای انتخاب‌شده"
  >
    <!-- Separate Counter Badge above the Button Group -->
    <div
      class="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-white/95 px-3.5 py-1 text-xs font-semibold text-sky-800 shadow-md backdrop-blur-md transition-transform"
    >
      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[11px] font-bold text-white shadow-xs">
        {{ selectedCount }}
      </span>
      <span>مورد انتخاب‌شده</span>
    </div>

    <!-- Light Themed Button Group -->
    <div
      class="flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-md text-slate-700"
      role="toolbar"
    >
      <!-- Copy Button -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        :class="canCopy ? 'text-slate-700 hover:bg-slate-100 active:bg-slate-200' : 'text-slate-400'"
        :disabled="!canCopy"
        :title="canCopy ? 'کپی متن کار' : 'کپی تنها برای یک کار مجاز است'"
        @click="emit('copy')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>کپی</span>
      </button>

      <div class="h-4 w-[1px] bg-slate-200" />

      <!-- Delete Button (Light theme, same neutral styling as Copy) -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-all active:scale-95 cursor-pointer"
        title="حذف کارهای انتخاب‌شده"
        @click="emit('delete')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>حذف</span>
      </button>

      <div class="h-4 w-[1px] bg-slate-200" />

      <!-- Dismiss Button -->
      <button
        type="button"
        class="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer transition-colors"
        title="لغو انتخاب"
        aria-label="لغو انتخاب"
        @click="emit('cancel')"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
