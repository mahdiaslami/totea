<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '../stores/timeline'
import type { DayItem } from '../modules/timeline/date'
import type { PersianDate } from '../modules/timeline/PersianDate'
import {
  DayCardRoot,
  DayCardHeader,
  DayCardContent,
} from '../components/ui/day-card/index.ts'
import {
  TaskListRoot,
  TaskItemRoot,
  TaskItemTrigger,
  TaskItemCheckbox,
  TaskItemLabel,
} from '../components/ui/task-list/index.ts'
import {
  ScrollProvider,
  ScrollRoot,
  ScrollInset,
  GoToBeginingButton,
} from '../components/ui/scroll-provider/index.ts'
import AddTaskSheet from '../components/ui/AddTaskSheet.vue'
import DeleteConfirmDialog from '../components/ui/DeleteConfirmDialog.vue'
import type { Task } from '../modules/timeline/date'

const store = useTimelineStore()
const { days } = storeToRefs(store)

const isSheetOpen = ref(false)
const selectedTargetDate = ref<PersianDate | null>(null)

// Delete Dialog state
const isDeleteDialogOpen = ref(false)
const taskToDelete = ref<{ day: DayItem; task: Task } | null>(null)

let isScrollReady = false
let loading = false

// Only enable dynamic infinite scroll after initial mount and placement settles
setTimeout(() => {
  isScrollReady = true
}, 250)

function onScroll(metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
  if (!isScrollReady || loading) return

  const { scrollTop, scrollHeight, clientHeight } = metrics

  const threshold = clientHeight * 1.5

  if (scrollTop < threshold) {
    loading = true
    store.prependPast()
    requestAnimationFrame(() => {
      loading = false
    })
  }

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    loading = true
    store.appendFuture()
    requestAnimationFrame(() => {
      loading = false
    })
  }
}

function handleToggle(day: DayItem, taskId: string) {
  store.toggleTask(day, taskId)
}

function openAddTask(date: PersianDate) {
  if (date.isPast()) return
  selectedTargetDate.value = date
  isSheetOpen.value = true
}

function handleCreateTask(title: string) {
  if (!selectedTargetDate.value) return
  store.addTask(selectedTargetDate.value, title)
}

function handleRequestDelete(day: DayItem, task: Task) {
  taskToDelete.value = { day, task }
  isDeleteDialogOpen.value = true
}

function confirmDeleteTask() {
  if (!taskToDelete.value) return
  store.deleteTask(taskToDelete.value.day, taskToDelete.value.task.id)
  taskToDelete.value = null
}
</script>

<template>
  <div class="flex h-screen h-[100dvh] w-full flex-col bg-white overflow-hidden">
    <ScrollProvider>
      <ScrollRoot @scroll="onScroll">
        <DayCardRoot
          v-for="day in days"
          :key="day.date.getTime()"
          :date="day.date"
        >
          <DayCardHeader @add-task="openAddTask(day.date)" />
          <DayCardContent>
            <TaskListRoot
              :day="day"
              :past="day.date.isPast()"
              :toggle="(taskId: string) => handleToggle(day, taskId)"
            >
              <TaskItemRoot
                v-for="task in day.tasks"
                :key="task.id"
                :task="task"
                :disabled="day.date.isPast()"
                @toggle="(taskId: string) => handleToggle(day, taskId)"
                @request-delete="(t: Task) => handleRequestDelete(day, t)"
              >
                <TaskItemTrigger>
                  <TaskItemCheckbox />
                  <TaskItemLabel />
                </TaskItemTrigger>
              </TaskItemRoot>
            </TaskListRoot>
          </DayCardContent>
        </DayCardRoot>
      </ScrollRoot>

      <ScrollInset>
        <GoToBeginingButton />
      </ScrollInset>
    </ScrollProvider>

    <!-- Bottom Sheet for Adding New Task -->
    <AddTaskSheet
      v-model="isSheetOpen"
      :target-date="selectedTargetDate"
      @submit="handleCreateTask"
    />

    <!-- Delete Confirmation Dialog -->
    <DeleteConfirmDialog
      v-model="isDeleteDialogOpen"
      :task-title="taskToDelete?.task.title"
      @confirm="confirmDeleteTask"
    />
  </div>
</template>
