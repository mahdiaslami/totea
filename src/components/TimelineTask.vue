<script setup lang="ts">
import type Task from '@/app/Task';
import IconRoundedRectangle from './icons/IconRoundedRectangle.vue';
import IconSolidCheckRoundedRectangle from './icons/IconSolidCheckRoundedRectangle.vue';

defineProps<{
  task: Task
}>()

</script>

<template>
  <div class="flex flex-row -mx-2">
      <div class="px-2">
        <IconSolidCheckRoundedRectangle v-if="task.completedAt" class="fill-sky-600"/>
        <IconRoundedRectangle v-else class="stroke-slate-300"/>
      </div>
      <div class="px-2 grow">
        <p>{{ task.text }}</p>
      </div>
    </div>
</template>