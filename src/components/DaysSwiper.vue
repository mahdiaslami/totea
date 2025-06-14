<script setup lang="ts">
import DaysSwiper from '@/app/support/DaysSwiper'
import type Swiper from 'swiper'
import type { SwiperContainer } from 'swiper/element'
import { onMounted, onUpdated, reactive, ref } from 'vue'

const props = withDefaults(defineProps<{
  allowSlideNext?: boolean,
  allowSlidePrev?: boolean,
}>(), {
  allowSlideNext: true,
  allowSlidePrev: true,
})

const daysSwiper = new DaysSwiper(4)
const range = Array.from({ length: daysSwiper.count }, (_, i) => i)

const swiperContainer = ref<SwiperContainer | null>(null)

const data = reactive({
  dates: daysSwiper.getDates(),
})

const emit = defineEmits(['dayChange', 'beforeDayChange'])

onMounted(() => {
  if (swiperContainer.value) {
    initSwiper(
      swiperContainer.value
    )
  }
})

onUpdated(() => {
  if (swiperContainer.value) {
    swiperContainer.value.swiper.allowSlideNext = props.allowSlideNext
    swiperContainer.value.swiper.allowSlidePrev = props.allowSlidePrev
  }
})

function initSwiper(swiper: SwiperContainer) {
  Object.assign(swiper, {
    direction: 'vertical',
    slidesPerView: 'auto',
    passiveListeners: true,
    loop: true,
    allowSlideNext: props.allowSlideNext,
    allowSlidePrev: props.allowSlidePrev,
    on: {
      slideChange: handleSlideChange,
      beforeSlideChangeStart: () => emit('beforeDayChange', daysSwiper.currentDate),
    }
  })

  swiper.initialize()
}

let lastRealIndex = 0;
function handleSlideChange(swiper: Swiper) {
  if (lastRealIndex != swiper.realIndex) {
    lastRealIndex = swiper.realIndex

    daysSwiper.setCurrentIndex(lastRealIndex)
    data.dates = daysSwiper.getDates()

    emit('dayChange', daysSwiper.currentDate)
  }
}

</script>

<template>
  <swiper-container ref="swiperContainer"
    init="false">
    <swiper-slide class="max-h-full"
      v-for="index in range"
      :key="index">
      <slot :date="data.dates[index]"
        :index="index"></slot>
    </swiper-slide>
  </swiper-container>
</template>