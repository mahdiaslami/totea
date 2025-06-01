<script setup lang="ts">
import AppDate from '@/app/AppDate';

defineProps<{
  date: AppDate
}>()

</script>

<template>
  <div class="space-y-2">
    <h2 class="text-slate-400">{{ date.getPersianWeekday() }}</h2>
    <p class="text-lg font-normal">{{ date.getPersianDate() }} {{ date.getPersianMonthName() }} {{ date.getPersianFullYear() }}</p>
  </div>
</template>