<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'
import TaskItemCheckbox from './TaskItemCheckbox.vue'
import TaskItemLabel from './TaskItemLabel.vue'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Trigger must be used inside TaskItem.Root')
</script>

<template>
  <div
    class="flex w-full items-start gap-3 rounded-lg px-3 py-3 sm:px-3.5 sm:py-3.5 text-start bg-transparent outline-none focus:outline-none focus:ring-0 active:bg-transparent touch-pan-y"
    style="-webkit-tap-highlight-color: transparent;"
    :class="{ 'cursor-not-allowed opacity-60': ctx.disabled }"
  >
    <slot>
      <TaskItemCheckbox />
      <TaskItemLabel />
    </slot>
  </div>
</template>
