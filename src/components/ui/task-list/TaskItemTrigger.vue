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
    class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:bg-slate-100/70 active:bg-slate-100 touch-pan-y"
    :class="{ 'cursor-not-allowed opacity-60 hover:bg-transparent': ctx.disabled }"
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
