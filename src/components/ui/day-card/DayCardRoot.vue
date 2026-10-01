<script setup lang="ts">
import type { PersianDate } from '@/modules/timeline/PersianDate'
import { provide, computed } from 'vue'

export interface DayCardContext {
  date: PersianDate
  isToday: import('vue').ComputedRef<boolean>
  past: import('vue').ComputedRef<boolean>
}

const props = defineProps<{
  date: PersianDate
}>()

const isToday = computed(() => props.date.isToday())
const past = computed(() => props.date.isPast())

provide('daycard', {
  date: props.date,
  isToday,
  past,
} satisfies DayCardContext)
</script>

<template>
  <section
    class="relative h-screen h-[100dvh] w-full flex-shrink-0 snap-start snap-always border-b border-slate-200/80 px-4 py-6 md:px-8 flex flex-col min-h-0 overflow-hidden"
    :class="{ 'bg-sky-50/30': isToday }"
    :data-today="isToday"
  >
    <div class="mx-auto flex h-full w-full max-w-2xl flex-col min-h-0">
      <slot />
    </div>
  </section>
</template>
