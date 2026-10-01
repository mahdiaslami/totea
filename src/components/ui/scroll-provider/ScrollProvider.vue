<script setup lang="ts">
import { onMounted, provide, ref, type Ref } from 'vue'

export interface ScrollContext {
  scrollEl: Ref<HTMLElement | null>
  todayVisible: Ref<boolean>
  scrollToToday: () => void
}

const scrollEl = ref<HTMLElement | null>(null)
const todayVisible = ref(true)

function scrollToToday() {
  const el = scrollEl.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('[data-today="true"]')
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

provide('scroll', {
  scrollEl,
  todayVisible,
  scrollToToday,
} satisfies ScrollContext)

onMounted(() => {
  const el = scrollEl.value
  if (!el) return

  requestAnimationFrame(() => {
    scrollToToday()

    const todayCard = el.querySelector('[data-today="true"]')
    if (todayCard) {
      const observer = new IntersectionObserver(
        (entries) => {
          todayVisible.value = entries[0].isIntersecting
        },
        { root: el, threshold: 0.1 }
      )
      observer.observe(todayCard)
    }
  })

  const resizeObserver = new ResizeObserver(() => {
    const currentHeight = el.scrollHeight
    const added = currentHeight - lastHeight
    if (added > 0 && el.scrollTop < el.clientHeight * 1.5) {
      el.scrollTop += added
    }
    lastHeight = currentHeight
  })

  let lastHeight = el.scrollHeight
  resizeObserver.observe(el)
})
</script>

<template>
  <slot />
</template>
