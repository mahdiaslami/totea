<script setup lang="ts">
import type { DayItem } from '@/modules/timeline/date'
import { provide, toValue, type MaybeRefOrGetter } from 'vue'

export interface TaskListContext {
  day: DayItem
  past: boolean
  toggle: (taskId: string) => void
}

const props = defineProps<{
  day: DayItem
  past: MaybeRefOrGetter<boolean>
  toggle: (taskId: string) => void
}>()

provide('tasklist', {
  day: props.day,
  past: toValue(props.past),
  toggle: props.toggle,
} satisfies TaskListContext)
</script>

<template>
  <ul v-if="day.tasks.length" class="space-y-0.5">
    <slot />
  </ul>
  <p v-else class="text-sm text-slate-400 mt-2">هیچ کاری برای انجام نیست</p>
</template>
