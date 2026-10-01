<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useTimelineStore } from '../stores/timeline'
import type { DayItem } from '../modules/timeline/date'
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

const store = useTimelineStore()
const { days } = storeToRefs(store)

let loading = false

function onScroll(metrics: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
  if (loading) return

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
</script>

<template>
  <div class="flex h-screen flex-col bg-white">
    <ScrollProvider>
      <ScrollRoot @scroll="onScroll">
        <DayCardRoot
          v-for="day in days"
          :key="day.date.getTime()"
          :date="day.date"
        >
          <DayCardHeader />
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
  </div>
</template>
