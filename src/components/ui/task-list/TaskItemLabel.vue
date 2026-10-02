<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Label must be used inside TaskItem.Root')
</script>

<template>
  <span
    class="text-sm leading-6 break-words flex-1"
    :class="{
      'text-slate-400 line-through': ctx.task.done,
      'text-slate-700': !ctx.task.done,
    }"
  >
    <slot>{{ ctx.task.title }}</slot>
  </span>
</template>
