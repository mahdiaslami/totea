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
  <ul v-if="day.tasks.length" class="space-y-1">
    <slot />
  </ul>
  <!-- When there are no tasks: center the sleeping character vertically & horizontally and make it larger -->
  <div v-else class="flex flex-1 w-full flex-col items-center justify-center my-auto py-8 select-none">
    <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
      <img
        :src="sleepingCharacterImg"
        alt="روز آرام و بدون کار"
        class="w-52 sm:w-64 md:w-72 h-auto object-contain drop-shadow-md opacity-95 transition-transform hover:scale-105 duration-300 pointer-events-none"
        loading="lazy"
      />
      <p class="mt-4 text-sm font-medium text-slate-400">
        کاری برای این روز ثبت نشده است
      </p>
    </div>
  </div>
</template>
