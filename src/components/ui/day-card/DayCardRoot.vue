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
    class="border-t border-slate-200/80 px-4 py-6 first:border-t-0 min-h-[33vh]"
    :class="{ 'bg-sky-50/40': isToday }"
    :data-today="isToday"
  >
    <slot />
  </section>
</template>
