<script setup lang="ts">
import type Day from '@/app/Day';
import { TimelineService } from '@/app/TimelineService';
import TimelineDate from '@/components/TimelineDate.vue';
import TimelineTask from '@/components/TimelineTask.vue';
import { ref } from 'vue';

const days = ref<Day[]>([])

TimelineService.getAllDays()
  .then((d) => {
    days.value = d
  })

</script>

<template>
  <main class="py-10 px-8">
    <template v-for="(day, index) in days"
      :key="index">
      <TimelineDate class="mt-10 mb-10"
        :date="day.date" />

      <TimelineTask v-for="(task, taskIndex) in day.tasks"
        :key="taskIndex"
        class="mb-8"
        :task="task" />
    </template>
  </main>
</template>
