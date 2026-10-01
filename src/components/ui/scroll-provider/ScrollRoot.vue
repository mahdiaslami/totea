<script setup lang="ts">
import { inject, ref, type ComponentPublicInstance } from 'vue'
import type { ScrollContext } from './ScrollProvider.vue'

const ctx = inject('scroll') as ScrollContext | undefined
if (!ctx) throw new Error('Scroll.Root must be used inside Scroll.Provider')

const emit = defineEmits<{
  (e: 'scroll', metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }): void
}>()

const topFade = ref(false)
const bottomFade = ref(false)

function setScrollEl(el: Element | ComponentPublicInstance | null) {
  ctx!.scrollEl.value = (el as HTMLElement) ?? null
}

function onScroll() {
  const el = ctx!.scrollEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  const threshold = 8
  topFade.value = scrollTop > threshold
  bottomFade.value = scrollHeight - scrollTop - clientHeight > threshold
  emit('scroll', { scrollTop, scrollHeight, clientHeight })
}
</script>

<template>
  <div class="relative h-screen h-[100dvh] w-full flex-1 overflow-hidden">
    <div
      :ref="setScrollEl"
      class="h-full w-full overflow-y-auto overflow-x-hidden snap-y snap-proximity scroll-smooth touch-pan-y"
      style="scroll-snap-type: y proximity; -webkit-overflow-scrolling: touch;"
      @scroll="onScroll"
    >
      <slot />
    </div>
  </div>
</template>
