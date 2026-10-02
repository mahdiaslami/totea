<script setup lang="ts">
import { ref } from 'vue'
import type { Task } from '@/modules/timeline/date'
import { provide } from 'vue'

export interface TaskItemContext {
  task: Task
  disabled: boolean
  toggle: (id: string) => void
  requestDelete: (task: Task) => void
}

const props = defineProps<{
  task: Task
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'request-delete', task: Task): void
}>()

const offsetX = ref(0)
const isSwiping = ref(false)
let startX = 0
let startY = 0
let isHorizontalGesture: boolean | null = null

function onTouchStart(e: TouchEvent) {
  if (props.disabled) return
  const touch = e.touches[0]
  startX = touch.clientX
  startY = touch.clientY
  isSwiping.value = true
  isHorizontalGesture = null
}

function onTouchMove(e: TouchEvent) {
  if (!isSwiping.value || props.disabled) return
  const touch = e.touches[0]
  const deltaX = touch.clientX - startX
  const deltaY = touch.clientY - startY

  if (isHorizontalGesture === null) {
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY)
    }
  }

  // Only intercept if swiping to the left (negative deltaX) for delete action
  // If moving right (deltaX > 0), do not preventDefault and do not move offsetX,
  // allowing the parent horizontal timeline scroll to handle it naturally!
  if (isHorizontalGesture) {
    if (deltaX < 0) {
      // Swiping to the left - reveal delete button
      if (e.cancelable) e.preventDefault()
      offsetX.value = Math.max(deltaX, -100)
    } else {
      // Swiping to the right is for timeline day navigation
      offsetX.value = 0
    }
  }
}

function onTouchEnd() {
  if (!isSwiping.value) return
  isSwiping.value = false

  // If swiped left by more than 50px, trigger delete dialog
  if (offsetX.value < -50) {
    emit('request-delete', props.task)
  }

  // Animate back to original position
  offsetX.value = 0
  isHorizontalGesture = null
}

// Mouse support for desktop testing
let isMouseDown = false
function onMouseDown(e: MouseEvent) {
  if (props.disabled || e.button !== 0) return
  isMouseDown = true
  startX = e.clientX
  startY = e.clientY
  isSwiping.value = true
  isHorizontalGesture = null

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (!isMouseDown) return
    const deltaX = moveEvent.clientX - startX
    const deltaY = moveEvent.clientY - startY

    if (isHorizontalGesture === null) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    if (isHorizontalGesture && deltaX < 0) {
      offsetX.value = Math.max(deltaX, -100)
    }
  }

  const onMouseUp = () => {
    if (isMouseDown) {
      isMouseDown = false
      isSwiping.value = false
      if (offsetX.value < -50) {
        emit('request-delete', props.task)
      }
      offsetX.value = 0
      isHorizontalGesture = null
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

provide('taskitem', {
  task: props.task,
  disabled: props.disabled,
  toggle: (id: string) => {
    // Only toggle if not currently swiped
    if (Math.abs(offsetX.value) < 10) {
      emit('toggle', id)
    }
  },
  requestDelete: (task: Task) => emit('request-delete', task),
} satisfies TaskItemContext)
</script>

<template>
  <li data-task-item="true" class="relative overflow-hidden rounded-xl shadow-xs border border-slate-100/80">
    <!-- Red background reveal on left swipe -->
    <div
      class="absolute inset-y-0 right-0 left-0 flex items-center justify-end rounded-xl bg-rose-500 px-4 text-white transition-opacity"
      :class="offsetX < -15 ? 'opacity-100' : 'opacity-0'"
    >
      <div class="flex items-center gap-1.5 text-xs font-semibold">
        <span>حذف</span>
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    </div>

    <!-- Foreground Swipeable Content -->
    <div
      class="relative bg-white transition-transform select-none"
      :class="{ 'duration-200 ease-out': !isSwiping }"
      :style="{ transform: `translateX(${offsetX}px)` }"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <slot />
    </div>
  </li>
</template>
