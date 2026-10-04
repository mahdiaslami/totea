<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'GoalsView',
})

const isNotified = ref(false)

function handleNotify() {
  isNotified.value = !isNotified.value
}

const previewGoals = [
  {
    id: 1,
    title: 'ورزش و پیاده‌روی روزانه',
    category: 'سلامتی',
    target: '۴ روز از ۵ روز این هفته',
    progress: 80,
    streak: '۵ روز متوالی 🔥',
    color: 'emerald',
  },
  {
    id: 2,
    title: 'مطالعه کتاب تخصصی',
    category: 'رشد فردی',
    target: '۳۰ صفحه از ۵۰ صفحه',
    progress: 60,
    streak: '۳ روز متوالی 🔥',
    color: 'sky',
  },
  {
    id: 3,
    title: 'تمرین زبان انگلیسی',
    category: 'آموزش',
    target: '۱۵ دقیقه روزانه',
    progress: 90,
    streak: '۷ روز متوالی 🔥',
    color: 'amber',
  },
]
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto bg-slate-50 select-none pb-8" dir="rtl">
    <!-- Top Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md shadow-xs">
      <div class="mx-auto flex max-w-xl items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-800">اهداف</h1>
          <p class="text-xs text-slate-400 mt-0.5">پیگیری اهداف بلندمدت و استمرار عادت‌ها</p>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/80">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>در دست ساخت</span>
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-xl flex-1 px-4 py-6 space-y-6">
      <!-- Under Construction Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-lg shadow-emerald-600/20">
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span class="inline-block rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">
                نسخه پیش‌رو
              </span>
              <h2 class="text-lg font-bold mt-0.5">سیستم مدیریت اهداف و عادت‌ها</h2>
            </div>
          </div>
          <p class="text-sm text-emerald-100 leading-relaxed">
            این بخش در حال طراحی و پیاده‌سازی است. به‌زودی می‌توانید اهداف هفتگی و ماهانه تعیین کنید، زنجیره عادت‌های خود را بسازید و روند پیشرفت خود را بسنجید.
          </p>

          <div class="mt-4 flex items-center justify-between pt-2 border-t border-white/20">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm transition hover:bg-emerald-50 active:scale-95 cursor-pointer"
              @click="handleNotify"
            >
              <svg v-if="!isNotified" class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <svg v-else class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ isNotified ? 'ثبت شد! هنگام انتشار خبرتان می‌کنیم' : 'هنگام انتشار به من خبر بده' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Goals List -->
      <div class="space-y-3">
        <div class="flex items-center justify-between px-1">
          <h3 class="text-sm font-bold text-slate-800">پیش‌نمایش کارت‌های اهداف</h3>
          <span class="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            نمونه نمایشی
          </span>
        </div>

        <div
          v-for="goal in previewGoals"
          :key="goal.id"
          class="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {{ goal.category }}
              </span>
              <h4 class="text-sm font-bold text-slate-800">{{ goal.title }}</h4>
            </div>
            <span class="text-xs font-semibold text-amber-600">{{ goal.streak }}</span>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>{{ goal.target }}</span>
              <span class="font-bold text-slate-700">{{ goal.progress }}٪</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="[
                  goal.color === 'emerald' ? 'bg-emerald-500' : '',
                  goal.color === 'sky' ? 'bg-sky-500' : '',
                  goal.color === 'amber' ? 'bg-amber-500' : ''
                ]"
                :style="{ width: `${goal.progress}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Features List -->
      <div class="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5">
        <h3 class="text-sm font-bold text-slate-800">امکانات در حال توسعه اهداف</h3>
        <ul class="space-y-2.5 text-xs text-slate-600">
          <li class="flex items-start gap-2.5">
            <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>تعریف عادت‌های روزانه، هفتگی و ماهانه با شمارشگر زنجیره</span>
          </li>
          <li class="flex items-start gap-2.5">
            <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>اتصال مستقیم کارها و تسک‌های روزانه به اهداف کلان</span>
          </li>
          <li class="flex items-start gap-2.5">
            <div class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span>نمودارهای گرافیکی درصد پیشرفت و موفقیت</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
