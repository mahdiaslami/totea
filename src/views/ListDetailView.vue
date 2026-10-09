<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useListsStore,
  getScheduledDaysLabel,
  type TaskList,
  type ListItem,
} from '@/stores/lists'
import { PersianDate } from '@/modules/timeline/PersianDate'
import texturePatternImg from '@/assets/images/Texture-01-xs.png'
import thinkingCharacterImg from '@/assets/images/thinking_character_01.png'
import AddTaskSheet from '@/components/ui/AddTaskSheet.vue'
import EditTaskSheet from '@/components/ui/EditTaskSheet.vue'
import ListFormSheet from '@/components/ui/ListFormSheet.vue'
import DeleteConfirmDialog from '@/components/ui/DeleteConfirmDialog.vue'
import TaskSelectionToolbar from '@/components/ui/TaskSelectionToolbar.vue'
import {
  TaskItemRoot,
  TaskItemTrigger,
  TaskItemCheckbox,
  TaskItemLabel,
} from '@/components/ui/task-list/index.ts'

defineOptions({
  name: 'ListDetailView',
})

const route = useRoute()
const router = useRouter()
const listsStore = useListsStore()

const listId = computed(() => route.params.id as string)

const activeList = computed<TaskList | null>(() => {
  if (!listId.value) return null
  return listsStore.lists.find((l) => l.id === listId.value) || null
})

// If list is not found, redirect back to lists overview
function verifyList() {
  if (!activeList.value && listsStore.lists.length > 0) {
    router.replace('/lists')
  }
}

onMounted(() => {
  verifyList()
})

watch(
  () => activeList.value,
  (val) => {
    if (!val && listsStore.lists.length > 0) {
      router.replace('/lists')
    }
  }
)

// State for Edit List Settings Bottom Sheet
const isListSheetOpen = ref(false)

// State for Delete List confirmation dialog
const isDeleteListDialogOpen = ref(false)

// State for Add Task sheet (matching Days page)
const isAddTaskSheetOpen = ref(false)

// State for Selection mode in list detail (matching Days page)
const isSelectionMode = ref(false)
const selectedTaskIds = ref<string[]>([])

// State for Edit Task sheet (matching Days page)
const isEditTaskSheetOpen = ref(false)
const taskToEdit = ref<ListItem | null>(null)

// State for Delete Tasks confirm dialog
const isDeleteTasksDialogOpen = ref(false)
const tasksToDelete = ref<ListItem[]>([])

// Toast notification (matching Days page)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

onBeforeUnmount(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})

function backToLists() {
  exitSelectionMode()
  router.push('/lists')
}

// -------------------------------------------------------------
// List Settings & Deletion
// -------------------------------------------------------------

function openEditModal() {
  if (!activeList.value) return
  isListSheetOpen.value = true
}

function handleSaveList(data: { title: string; scheduledDays: number[] }) {
  if (!activeList.value) return
  listsStore.updateList(activeList.value.id, {
    title: data.title,
    scheduledDays: data.scheduledDays,
  })
  showToast('تغییرات لیست ذخیره شد')
}

function requestDeleteList() {
  if (!activeList.value) return
  isDeleteListDialogOpen.value = true
}

function confirmDeleteList() {
  if (!activeList.value) return
  const idToDelete = activeList.value.id
  isDeleteListDialogOpen.value = false
  listsStore.deleteList(idToDelete)
  showToast('لیست با موفقیت حذف شد')
  router.push('/lists')
}

// -------------------------------------------------------------
// List Items Interaction (identical to Timeline/DayView)
// -------------------------------------------------------------

function handleToggleItem(itemId: string) {
  if (!activeList.value) return
  if (isSelectionMode.value) return
  const todayTs = PersianDate.startOfDay(PersianDate.today()).getTime()
  listsStore.toggleListItem(activeList.value.id, itemId, todayTs)
}

function enterSelectionMode(item: ListItem) {
  isSelectionMode.value = true
  selectedTaskIds.value = [item.id]
}

function handleSelectItem(item: ListItem) {
  if (!isSelectionMode.value) return
  const idx = selectedTaskIds.value.indexOf(item.id)
  if (idx !== -1) {
    selectedTaskIds.value.splice(idx, 1)
    if (selectedTaskIds.value.length === 0) {
      exitSelectionMode()
    }
  } else {
    selectedTaskIds.value.push(item.id)
  }
}

function exitSelectionMode() {
  isSelectionMode.value = false
  selectedTaskIds.value = []
}

// Copy action: single task title copied to clipboard
const canCopy = computed(() => selectedTaskIds.value.length === 1)

// Edit action: single task editing
const canEdit = computed(() => selectedTaskIds.value.length === 1)

function handleOpenEditTask() {
  if (!canEdit.value || !activeList.value) return
  const currentTaskId = selectedTaskIds.value[0]
  const item = activeList.value.items.find((i) => i.id === currentTaskId)
  if (!item) return
  taskToEdit.value = item
  isEditTaskSheetOpen.value = true
}

function handleConfirmEditTask(newTitle: string) {
  if (!activeList.value || !taskToEdit.value) return
  listsStore.updateListItem(activeList.value.id, taskToEdit.value.id, newTitle)
  taskToEdit.value = null
  exitSelectionMode()
  showToast('کار ویرایش شد')
}

async function handleCopyTask() {
  if (!canCopy.value || !activeList.value) return
  const currentTaskId = selectedTaskIds.value[0]
  const item = activeList.value.items.find((i) => i.id === currentTaskId)
  if (!item) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(item.title)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = item.title
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showToast('متن کار کپی شد')
    exitSelectionMode()
  } catch {
    showToast('خطا در کپی متن')
  }
}

// Delete action from selection toolbar
function handleRequestDeleteFromSelection() {
  if (!activeList.value || selectedTaskIds.value.length === 0) return
  const idSet = new Set(selectedTaskIds.value)
  const targetItems = activeList.value.items.filter((i) => idSet.has(i.id))
  if (targetItems.length === 0) return

  tasksToDelete.value = targetItems
  isDeleteTasksDialogOpen.value = true
}

function confirmDeleteTasks() {
  if (!activeList.value || tasksToDelete.value.length === 0) return
  const itemIds = tasksToDelete.value.map((i) => i.id)
  listsStore.deleteMultipleListItems(activeList.value.id, itemIds)
  tasksToDelete.value = []
  exitSelectionMode()
  showToast('کارها حذف شدند')
}

// Add Task through sheet
function openAddTaskSheet() {
  if (isSelectionMode.value) return
  isAddTaskSheetOpen.value = true
}

function handleCreateTask(title: string) {
  if (!activeList.value || !title.trim()) return
  listsStore.addItemToList(activeList.value.id, title)
  showToast('کار جدید اضافه شد')
}
</script>

<template>
  <div class="relative flex h-full w-full flex-col bg-white overflow-hidden select-none" dir="rtl">
    <div v-if="activeList" class="relative flex h-full w-full flex-col overflow-hidden">
      <!-- Header: Styled identically to Days/TimelineView header -->
      <header class="relative z-20 flex-shrink-0 border-b border-slate-100/80 bg-white/95 px-5 py-3.5 backdrop-blur-md shadow-sm shadow-slate-900/5">
        <div class="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <!-- Right side in RTL: Back button + List Title & Active Days Subtitle -->
          <div class="flex items-center gap-3 min-w-0">
            <!-- Back to lists button -->
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              :disabled="isSelectionMode"
              aria-label="بازگشت به لیست‌ها"
              title="بازگشت به لیست‌ها"
              @click="backToLists"
            >
              <!-- Arrow right in RTL = return -->
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Title & Subtitle: List Title in place of weekday, Active days in place of date -->
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-slate-800 truncate">
                  {{ activeList.title }}
                </h2>
              </div>
              <div class="flex items-center flex-wrap gap-x-1.5 text-xs text-slate-500 font-medium mt-0.5">
                <span>{{ getScheduledDaysLabel(activeList.scheduledDays) }}</span>
              </div>
            </div>
          </div>

          <!-- Left side in RTL: Edit list settings button & Delete list button -->
          <div v-if="!isSelectionMode" class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 cursor-pointer focus:outline-none"
              title="ویرایش تنظیمات لیست"
              aria-label="ویرایش تنظیمات لیست"
              @click="openEditModal"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer focus:outline-none"
              title="حذف لیست"
              aria-label="حذف لیست"
              @click="requestDeleteList"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Area: Identical background gradient, texture pattern, and padding as DayView -->
      <main
        class="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-5 pb-24 md:px-8 bg-gradient-to-br from-sky-100/90 via-sky-200/60 to-blue-200/70"
        style="-webkit-overflow-scrolling: touch; touch-action: pan-x pan-y;"
      >
        <!-- Repeating Texture Overlay (exact match to DayView) -->
        <div
          class="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-multiply"
          :style="{
            backgroundImage: `url(${texturePatternImg})`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }"
        />

        <div class="relative mx-auto flex h-full min-h-full max-w-2xl flex-col">
          <!-- Tasks List: Using exact TaskItem component hierarchy as DayView -->
          <ul v-if="activeList.items.length > 0" class="space-y-2.5 pb-28">
            <TaskItemRoot
              v-for="item in activeList.items"
              :key="item.id"
              :task="item"
              :disabled="false"
              :is-selected="selectedTaskIds.includes(item.id)"
              :is-selection-mode="isSelectionMode"
              @toggle="(id: string) => handleToggleItem(id)"
              @select="() => handleSelectItem(item)"
              @long-press="() => enterSelectionMode(item)"
            >
              <TaskItemTrigger>
                <TaskItemCheckbox />
                <TaskItemLabel />
              </TaskItemTrigger>
            </TaskItemRoot>
          </ul>

          <!-- Empty State: Thinking character centered vertically & horizontally (exact match to TaskListRoot) -->
          <div
            v-else
            class="flex flex-1 w-full flex-col items-center justify-center my-auto py-8 select-none"
          >
            <div class="flex flex-col items-center justify-center max-w-sm px-4 text-center">
              <img
                :src="thinkingCharacterImg"
                alt="چیکار داشتم؟"
                class="w-52 sm:w-64 md:w-72 h-auto object-contain drop-shadow-md opacity-95 transition-transform hover:scale-105 duration-300 pointer-events-none"
                loading="lazy"
              />
              <p
                class="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500 shadow-sm"
              >
                چیکار داشتم؟
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Floating Action Button for 'Add Task' (Exact match to Days page, hidden in selection mode) -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <button
          v-if="!isSelectionMode"
          type="button"
          class="pointer-events-auto absolute bottom-4 right-6 z-30 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:bg-sky-700 hover:shadow-xl active:scale-95 cursor-pointer"
          title="افزودن کار"
          aria-label="افزودن کار"
          @click="openAddTaskSheet"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>افزودن کار</span>
        </button>
      </Transition>

      <!-- Selection Mode Toolbar (Replaces Add Task button, exact match to Days page) -->
      <Transition
        enter-active-class="transition duration-250 ease-out"
        enter-from-class="opacity-0 translate-y-6 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-6 scale-95"
      >
        <TaskSelectionToolbar
          v-if="isSelectionMode"
          :selected-count="selectedTaskIds.length"
          :can-copy="canCopy"
          :can-edit="canEdit"
          @copy="handleCopyTask"
          @edit="handleOpenEditTask"
          @delete="handleRequestDeleteFromSelection"
          @cancel="exitSelectionMode"
        />
      </Transition>

      <!-- Add Task Bottom Sheet (Exact bottom sheet as Days page) -->
      <AddTaskSheet
        v-model="isAddTaskSheetOpen"
        :custom-title="activeList.title"
        @submit="handleCreateTask"
      />

      <!-- Edit Task Bottom Sheet (Exact bottom sheet as Days page) -->
      <EditTaskSheet
        v-model="isEditTaskSheetOpen"
        :task="taskToEdit"
        custom-badge="لیست"
        @submit="handleConfirmEditTask"
      />

      <!-- Delete Confirmation Dialog for Tasks -->
      <DeleteConfirmDialog
        v-model="isDeleteTasksDialogOpen"
        :count="tasksToDelete.length"
        :task-title="tasksToDelete.length === 1 ? tasksToDelete[0].title : ''"
        @confirm="confirmDeleteTasks"
      />

      <!-- Delete Confirmation Dialog for the List itself -->
      <DeleteConfirmDialog
        v-model="isDeleteListDialogOpen"
        title="حذف لیست"
        message="آیا از حذف این لیست مطمئن هستید؟ با حذف لیست، تمام کارهای درون آن نیز برای همیشه پاک خواهند شد و این عملیات قابل بازگشت نیست."
        :task-title="activeList.title"
        confirm-button-text="بله، حذف لیست"
        @confirm="confirmDeleteList"
      />

      <!-- Create / Edit List Bottom Sheet -->
      <ListFormSheet
        v-model="isListSheetOpen"
        :list="activeList"
        @submit="handleSaveList"
      />
    </div>

    <!-- Toast Notification (matching Days page) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-3"
      >
        <div
          v-if="toastMessage"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 px-4 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md"
        >
          {{ toastMessage }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
