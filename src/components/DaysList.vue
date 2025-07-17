<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import DaysList from './DaysList';

const daysList = new DaysList(10)

const data = reactive({
  items: daysList.items,
})

const emit = defineEmits<{
  scroll: [Event]
}>()

function handleScroll(ev: Event) {
  const {
    scrollTop,
    clientHeight,
    scrollHeight
  } = ev.target as HTMLElement;

  const position = scrollTop + clientHeight

  if (position > scrollHeight * 2 / 3) {
    daysList.append()
    data.items = daysList.items
  } else if (position < scrollHeight * 1 / 3) {
    daysList.prepend()
    data.items = daysList.items
  }

  emit('scroll', ev)
}

onMounted(() => {
  document.getElementById("date-today")?.scrollIntoView()
})
</script>

<template>
  <div @scroll="handleScroll"
    class="h-full overflow-auto">
    <div v-for="item in data.items"
      :key="item.id"
      v-bind:id="item.elementId"
      class="min-h-5">
      <slot :date="item.date"></slot>
    </div>
  </div>
</template>