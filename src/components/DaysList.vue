<script setup lang="ts">
import { nextTick, onMounted, reactive } from 'vue';
import DaysList from './DaysList';
import AppDate from '@/app/support/AppDate';

const daysList = new DaysList(10)
const today = new AppDate()

const data = reactive({
  items: daysList.items,
})

const emit = defineEmits<{
  scroll: [Event]
}>()

onMounted(() => {
  scrollToday()
})

function handleScroll(ev: Event) {
  const {
    scrollTop,
    clientHeight,
    scrollHeight
  } = ev.target as HTMLElement;

  const position = scrollTop + clientHeight
  setItemsByScrollPosition(position, scrollHeight)

  emit('scroll', ev)
}

function setItemsByScrollPosition(position: number, scrollHeight: number) {
  if (position > scrollHeight * 2 / 3) {
    daysList.append()
  } else if (position < scrollHeight * 1 / 3) {
    daysList.prepend()
  }

  data.items = daysList.items
}

function reset() {
  daysList.reset()
  data.items = daysList.items

  nextTick(() => {
    scrollToday()
  })
}

function scrollToday(behavior: ScrollBehavior = 'auto') {
  document.getElementById("date-today")?.scrollIntoView(
    {
      behavior,
      block: 'start',
    }
  )
}
</script>

<template>
  <div class="relative h-full min-h-0">
    <button class="absolute bottom-0 left-0 z-10 pe-8 ps-6 py-1 mb-10 shadow-lg 
      bg-sky-600 text-sky-50 rounded-s-full shadow-slate-300"
      @click="reset()">
      <span class="px-0.5 inline-block">{{ today.getPersianDate() }}</span>
      {{ today.getPersianMonthName() }}
    </button>

    <div @scroll="handleScroll"
      class="h-full overflow-auto">
      <div v-for="item in data.items"
        :key="item.id"
        v-bind:id="item.elementId"
        class="min-h-5">
        <slot :date="item.date"></slot>
      </div>
    </div>
  </div>
</template>