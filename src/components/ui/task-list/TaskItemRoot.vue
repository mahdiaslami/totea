<script setup lang="ts">
import type { Task } from '@/modules/timeline/date'
import { provide } from 'vue'

export interface TaskItemContext {
  task: Task
  disabled: boolean
  isSelected: boolean
  isSelectionMode: boolean
  toggle: (id: string) => void
  select: (task: Task) => void
}

const props = withDefaults(
  defineProps<{
    task: Task
    disabled: boolean
    isSelected?: boolean
    isSelectionMode?: boolean
  }>(),
  {
    isSelected: false,
    isSelectionMode: false,
  }
)

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'select', task: Task): void
  (e: 'long-press', task: Task): void
}>()

// Long-press detection (400ms: slightly earlier than Chrome's 500-600ms text-selection timer)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let touchStartX = 0
let touchStartY = 0
let didTriggerLongPress = false

function startLongPress() {
  if (props.disabled) return
  didTriggerLongPress = false
  if (longPressTimer) clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    didTriggerLongPress = true
    emit('long-press', props.task)
  }, 400)
}

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onTouchStart(e: TouchEvent) {
  if (props.disabled) return
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  startLongPress()
}

function onTouchMove(e: TouchEvent) {
  if (!longPressTimer) return
  const touch = e.touches[0]
  // Cancel long-press if the user moves their finger slightly (e.g. scrolling)
  if (Math.abs(touch.clientX - touchStartX) > 10 || Math.abs(touch.clientY - touchStartY) > 10) {
    clearLongPress()
  }
}

function onTouchEnd() {
  clearLongPress()
}

function onMouseDown(e: MouseEvent) {
  if (props.disabled || e.button !== 0) return
  touchStartX = e.clientX
  touchStartY = e.clientY
  startLongPress()

  const onMouseMove = (moveEvent: MouseEvent) => {
    if (Math.abs(moveEvent.clientX - touchStartX) > 10 || Math.abs(moveEvent.clientY - touchStartY) > 10) {
      clearLongPress()
    }
  }

  const onMouseUp = () => {
    clearLongPress()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function handleContextMenu(e: MouseEvent) {
  // Prevent Chrome from triggering default contextmenu or text selection gesture
  e.preventDefault()
}

function handleItemClick() {
  if (didTriggerLongPress) {
    didTriggerLongPress = false
    return
  }

  if (props.isSelectionMode) {
    emit('select', props.task)
  } else {
    emit('toggle', props.task.id)
  }
}

provide('taskitem', {
  task: props.task,
  disabled: props.disabled,
  isSelected: props.isSelected,
  isSelectionMode: props.isSelectionMode,
  toggle: (id: string) => {
    if (props.isSelectionMode) {
      emit('select', props.task)
    } else {
      emit('toggle', id)
    }
  },
  select: (task: Task) => emit('select', task),
} satisfies TaskItemContext)
</script>

<template>
  <li
    data-task-item="true"
    class="relative overflow-hidden rounded-xl transition-all duration-200 select-none cursor-pointer"
    style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;"
    :class="[
      isSelected
        ? 'ring-2 ring-sky-500 bg-sky-50/90 shadow-md scale-[1.01]'
        : 'border border-slate-100/80 bg-white shadow-xs hover:border-slate-200/90'
    ]"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @mousedown="onMouseDown"
    @contextmenu="handleContextMenu"
  >
    <!-- Foreground Content -->
    <div
      class="relative w-full transition-colors select-none"
      style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;"
      @click="handleItemClick"
    >
      <slot />
    </div>
  </li>
</template>
