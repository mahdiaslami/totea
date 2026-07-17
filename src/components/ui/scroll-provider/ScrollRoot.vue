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
  <div class="relative flex-1 overflow-hidden">
    <div
      :ref="setScrollEl"
      class="h-full overflow-y-auto overflow-x-hidden"
      @scroll="onScroll"
    >
      <div class="mx-auto flex flex-col max-w-2xl">
        <slot />
      </div>
    </div>
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent transition-opacity duration-200"
      :class="topFade ? 'opacity-100' : 'opacity-0'"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent transition-opacity duration-200"
      :class="bottomFade ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
