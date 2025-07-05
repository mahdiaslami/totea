<script setup lang="ts">
import Day from '@/app/Day';
import type AppDate from '@/app/support/AppDate';
import DaysService from '@/app/DaysService';
import DaysSwiper from '@/components/DaysSwiper.vue';
import DayDate from '@/components/DayDate.vue';
import DayTask from '@/components/DayTask.vue';
import { reactive } from 'vue';

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
    <DaysSwiper v-slot="{ date }"
      class="min-h-0 h-full">
      <div class="h-full flex flex-col">
        <DayDate class="mt-10 mb-10"
          :date="date" />

        <div class="grow overflow-y-scroll">
          <template v-for="(task, taskIndex) in getDay(date).tasks"
            :key="task.id ?? taskIndex">
            <DayTask class="mb-8"
              :task="task" />
          </template>
        </div>
      </div>
    </DaysSwiper>
  </main>
</template>