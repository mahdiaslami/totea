<script setup lang="ts">
import { onMounted, provide, ref, type Ref } from 'vue'

export interface ScrollContext {
  scrollEl: Ref<HTMLElement | null>
  todayVisible: Ref<boolean>
  scrollToToday: () => void
}

const scrollEl = ref<HTMLElement | null>(null)
const todayVisible = ref(true)
let isInitialized = false

function scrollToToday(smooth = true) {
  const el = scrollEl.value
  if (!el) return
  const card = el.querySelector<HTMLElement>('[data-today="true"]')
  if (card) {
    if (smooth) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // Instant positioning without any scroll animation
      const containerRect = el.getBoundingClientRect()
      const cardRect = card.getBoundingClientRect()
      el.scrollTop += (cardRect.top - containerRect.top)
    }
  }
}

provide('scroll', {
  scrollEl,
  todayVisible,
  scrollToToday: () => scrollToToday(true),
} satisfies ScrollContext)

onMounted(() => {
  const el = scrollEl.value
  if (!el) return

  // Position immediately on today without animation
  scrollToToday(false)

  // Double check after layout settles to guarantee exact alignment
  requestAnimationFrame(() => {
    scrollToToday(false)
    isInitialized = true

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

  let lastHeight = el.scrollHeight
  const resizeObserver = new ResizeObserver(() => {
    if (!isInitialized) return
    const currentHeight = el.scrollHeight
    const added = currentHeight - lastHeight
    if (added > 0 && el.scrollTop < el.clientHeight * 1.5) {
      el.scrollTop += added
    }
    lastHeight = currentHeight
  })

  resizeObserver.observe(el)
})
</script>

<template>
  <slot />
</template>
