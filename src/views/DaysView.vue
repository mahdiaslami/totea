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

function handleScroll(ev: Event) {
  const target = ev.target as HTMLElement
  const dayDates = target.querySelectorAll('.day-date')

  for (const el of dayDates) {
    el.classList.toggle('pinned', el.getBoundingClientRect().top === 0)
  }
}

</script>

<template>
  <main class="h-full">
    <DaysList v-slot="{ date }"
      @scroll="handleScroll"
      class="min-h-0 h-full">
      <div class="h-full flex flex-col">
        <DayDate class="px-8 my-5 sticky top-0 bg-white day-date"
          :date="date" />

        <DayTasks :tasks="getDay(date).tasks"
          class="grow px-8" />
      </div>
    </DaysList>
  </main>
</template>

<style>
.day-date.pinned {
  @apply border-b border-slate-200 transition-colors;
}
</style>