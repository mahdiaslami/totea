<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'
import TaskItemCheckbox from './TaskItemCheckbox.vue'
import TaskItemLabel from './TaskItemLabel.vue'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Trigger must be used inside TaskItem.Root')

function handleClick() {
  if (ctx?.disabled) return
  ctx?.toggle(ctx.task.id)
}
</script>

<template>
  <button
    type="button"
    class="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-start bg-transparent outline-none focus:outline-none focus:ring-0 active:bg-transparent touch-pan-y"
    style="-webkit-tap-highlight-color: transparent;"
    :class="{ 'cursor-not-allowed opacity-60': ctx.disabled }"
    :disabled="ctx.disabled"
    :aria-pressed="ctx.task.done"
    @click="handleClick"
  >
    <slot>
      <TaskItemCheckbox />
      <TaskItemLabel />
    </slot>
  </button>
</template>
