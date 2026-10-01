<script setup lang="ts">
import { inject } from 'vue'
import type { TaskItemContext } from './TaskItemRoot.vue'
import IconCheckboxChecked from './IconCheckboxChecked.vue'
import IconCheckboxUnchecked from './IconCheckboxUnchecked.vue'

const ctx = inject('taskitem') as TaskItemContext | undefined
if (!ctx) throw new Error('TaskItem.Checkbox must be used inside TaskItem.Root')
</script>

<template>
  <span class="shrink-0" :class="ctx.disabled ? 'text-slate-400' : 'text-sky-500'">
    <IconCheckboxChecked v-if="ctx.task.done" />
    <IconCheckboxUnchecked v-else />
  </span>
</template>
