<script setup lang="ts">
import Day from '@/app/Day';
import type AppDate from '@/app/support/AppDate';
import DaysService from '@/app/DaysService';
import DayDate from '@/components/DayDate.vue';
import { reactive } from 'vue';
import DaysList from '@/components/DaysList.vue';
import DayTasks from '@/components/DayTasks.vue';

type Cache = {
  [key: string]: Day
}

const days: Cache = reactive({})

function getDay(date: AppDate) {
  const day = days[date.toISOString()];

  if (day) {
    return day
  }

  const result = new Day(date)

  DaysService.findByDate(date)
    .then((day) => days[date.toISOString()] = day ?? result)

  return result
}

</script>

<template>
  <main class="px-8 h-full">
    <DaysList v-slot="{ date }"
      class="min-h-0 h-full">
      <div class="h-full flex flex-col">
        <DayDate class="my-5 sticky top-0"
          :date="date" />

        <DayTasks :tasks="getDay(date).tasks"
          class="grow" />
      </div>
    </DaysList>
  </main>
</template>