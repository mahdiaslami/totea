<script setup lang="ts">
import type Task from '@/app/Task';
import DayTask from './DayTask.vue';

defineProps<{
  tasks: Task[]
}>()


</script>

<template>
  <div>
    <template v-for="(task, taskIndex) in tasks"
      :key="task.id ?? taskIndex">
      <DayTask class="mb-8"
        :task="task" />
    </template>
  </div>
</template>