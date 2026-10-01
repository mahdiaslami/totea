<script setup lang="ts">
import { inject, ref, onMounted, onUnmounted } from 'vue'
import type { DayCardContext } from './DayCardRoot.vue'

const ctx = inject('daycard') as DayCardContext | undefined
if (!ctx) throw new Error('DayCard.Content must be used inside DayCard.Root')

const innerScrollEl = ref<HTMLElement | null>(null)
const topFade = ref(false)
const bottomFade = ref(false)

function onScroll() {
  const el = innerScrollEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  const threshold = 6
  topFade.value = scrollTop > threshold
  bottomFade.value = scrollHeight - scrollTop - clientHeight > threshold
}

function handleWheel(e: WheelEvent) {
  const el = innerScrollEl.value
  if (!el) return

  const hasScrollableContent = el.scrollHeight > el.clientHeight + 2
  if (!hasScrollableContent) return

  const { scrollTop, scrollHeight, clientHeight } = el
  const isAtTop = scrollTop <= 1
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

  // If scrolling down and not at bottom, or scrolling up and not at top:
  // keep scroll contained inside the tasks list!
  if ((e.deltaY > 0 && !isAtBottom) || (e.deltaY < 0 && !isAtTop)) {
    e.stopPropagation()
  }
}

let touchStartY = 0

function handleTouchStart(e: TouchEvent) {
  const el = innerScrollEl.value
  if (!el || e.touches.length === 0) return
  touchStartY = e.touches[0].clientY
}

function handleTouchMove(e: TouchEvent) {
  const el = innerScrollEl.value
  if (!el || e.touches.length === 0) return

  const hasScrollableContent = el.scrollHeight > el.clientHeight + 2
  if (!hasScrollableContent) return

  const currentY = e.touches[0].clientY
  const deltaY = touchStartY - currentY // positive when swiping up (scrolling down)
  const currentScrollTop = el.scrollTop
  const { scrollHeight, clientHeight } = el

  const isAtTop = currentScrollTop <= 1
  const isAtBottom = currentScrollTop + clientHeight >= scrollHeight - 1

  // When inside the scroll range, stop propagation so outer snap parent doesn't hijack the gesture
  if ((deltaY > 0 && !isAtBottom) || (deltaY < 0 && !isAtTop)) {
    e.stopPropagation()
  }
}

onMounted(() => {
  const el = innerScrollEl.value
  if (el) {
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
  }
})

onUnmounted(() => {
  const el = innerScrollEl.value
  if (el) {
    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
  }
})
</script>

<template>
  <div class="relative flex flex-1 min-h-0 flex-col overflow-hidden">
    <div
      ref="innerScrollEl"
      class="h-full w-full flex-1 overflow-y-auto overscroll-contain pr-1 pl-1 touch-pan-y"
      style="-webkit-overflow-scrolling: touch;"
      @scroll="onScroll"
      @wheel="handleWheel"
    >
      <slot />
    </div>

    <!-- Scroll fade indicators for inner list -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-200"
      :class="[
        topFade ? 'opacity-100' : 'opacity-0',
        ctx.isToday.value ? 'from-sky-50/70' : 'from-white',
      ]"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-200"
      :class="[
        bottomFade ? 'opacity-100' : 'opacity-0',
        ctx.isToday.value ? 'from-sky-50/70' : 'from-white',
      ]"
    />
  </div>
</template>

