<script setup lang="ts">
import type { DayItem } from '@/modules/timeline/date'
import { provide, toValue, type MaybeRefOrGetter } from 'vue'
import sleepingCharacterImg from '@/assets/images/sleeping_character_01.png'

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
  <div v-else class="flex flex-col items-center justify-center py-4 select-none">
    <img
      :src="sleepingCharacterImg"
      alt="روز آرام و بدون کار"
      class="w-36 sm:w-44 h-auto object-contain drop-shadow-sm opacity-95 transition-transform hover:scale-105 duration-300"
      loading="lazy"
    />
  </div>
</template>
