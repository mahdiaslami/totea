<script setup lang="ts">
import type { Task } from '@/modules/timeline/date'
import { provide } from 'vue'

export interface TaskItemContext {
  task: Task
  disabled: boolean
  toggle: (id: string) => void
}

const props = defineProps<{
  task: Task
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
}>()

provide('taskitem', {
  task: props.task,
  disabled: props.disabled,
  toggle: (id: string) => emit('toggle', id)
} satisfies TaskItemContext)
</script>

<template>
  <li>
    <slot />
  </li>
</template>
