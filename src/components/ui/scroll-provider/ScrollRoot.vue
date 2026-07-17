<script setup lang="ts">
import { inject, type ComponentPublicInstance } from 'vue'
import type { ScrollContext } from './ScrollProvider.vue'

const ctx = inject('scroll') as ScrollContext | undefined
if (!ctx) throw new Error('Scroll.Root must be used inside Scroll.Provider')

const emit = defineEmits<{
  (e: 'scroll', metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }): void
}>()

function setScrollEl(el: Element | ComponentPublicInstance | null) {
  ctx!.scrollEl.value = (el as HTMLElement) ?? null
}

function onScroll() {
  const el = ctx!.scrollEl.value
  if (!el) return
  const { scrollTop, scrollHeight, clientHeight } = el
  emit('scroll', { scrollTop, scrollHeight, clientHeight })
}
</script>

<template>
  <div
    :ref="setScrollEl"
    class="flex-1 overflow-y-auto overflow-x-hidden"
    @scroll="onScroll"
  >
    <div class="mx-auto flex flex-col max-w-2xl">
      <slot />
    </div>
  </div>
</template>
