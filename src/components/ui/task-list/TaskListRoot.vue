<script setup lang="ts">
import type { DayItem } from '@/modules/timeline/date'
import { computed, provide, toValue, type MaybeRefOrGetter } from 'vue'
import sleepingCharacterImg from '@/assets/images/sleeping_character_01.png'
import thinkingCharacterImg from '@/assets/images/thinking_character_01.png'

export interface TaskListContext {
  day: DayItem
  past: boolean
  toggle: (taskId: string) => void
}

const props = withDefaults(
  defineProps<{
    day: DayItem
    past: MaybeRefOrGetter<boolean>
    toggle: (taskId: string) => void
    hasOtherContent?: boolean
  }>(),
  {
    hasOtherContent: false,
  }
)

provide('tasklist', {
  day: props.day,
  past: toValue(props.past),
  toggle: props.toggle,
} satisfies TaskListContext)

const isHoliday = computed(() => {
  return props.day.date.isHoliday()
})

const emptyStateImage = computed(() => {
  return isHoliday.value ? sleepingCharacterImg : thinkingCharacterImg
})

const emptyStateText = computed(() => {
  return isHoliday.value ? 'امروز وقت استراحته' : 'امروز چیکار کنم؟'
})
</script>

<template>
  <!-- pb-28 ensures the last task is never covered by floating action buttons or the selection toolbar -->
  <ul v-if="day.tasks.length" class="space-y-2.5 pb-28">
    <slot />
  </ul>
  <!-- When there are no tasks and no other content: center the character vertically & horizontally -->
  <div v-else-if="!hasOtherContent" class="flex flex-1 w-full flex-col items-center justify-center my-auto py-8 select-none">
    <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
      <img
        :src="emptyStateImage"
        :alt="emptyStateText"
        class="w-52 sm:w-64 md:w-72 h-auto object-contain drop-shadow-md opacity-95 transition-transform hover:scale-105 duration-300 pointer-events-none"
        loading="lazy"
      />
      <p
        class="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 shadow-sm"
      >
        {{ emptyStateText }}
      </p>
    </div>
  </div>
</template>
