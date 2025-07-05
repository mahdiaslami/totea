<script setup lang="ts">
import type Day from '@/app/Day';
import DayService from '@/app/DaysService';
import DayDate from '@/components/DayDate.vue';
import DayTask from '@/components/DayTask.vue';
import { ref } from 'vue';

const days = ref<Day[]>([])

DayService.getAllDays()
  .then((d) => {
    days.value = d
  })

</script>

<template>
  <main class="py-10 px-8">
    <template v-for="(day, index) in days"
      :key="index">
      <DayDate class="mt-10 mb-10"
        :date="day.date" />

      <DayTask v-for="(task, taskIndex) in day.tasks"
        :key="taskIndex"
        class="mb-8"
        :task="task" />
    </template>
  </main>
</template>
