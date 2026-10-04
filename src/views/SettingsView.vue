<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'SettingsView',
})

const isNotified = ref(false)

function handleNotify() {
  isNotified.value = !isNotified.value
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto bg-slate-50 select-none pb-8" dir="rtl">
    <!-- Top Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md shadow-xs">
      <div class="mx-auto flex max-w-xl items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-slate-800">تنظیمات</h1>
          <p class="text-xs text-slate-400 mt-0.5">شخصی‌سازی ظاهر، اعلان‌ها و پشتیبان‌گیری</p>
        </div>
        <div class="flex items-center gap-1.5 rounded-full bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300">
          <span class="inline-block h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
          <span>در دست ساخت</span>
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-xl flex-1 px-4 py-6 space-y-6">
      <!-- Under Construction Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-6 text-white shadow-lg shadow-slate-900/20">
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div>
              <span class="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold">
                نسخه پیش‌رو
              </span>
              <h2 class="text-lg font-bold mt-0.5">تنظیمات و سفارشی‌سازی</h2>
            </div>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">
            این بخش در حال طراحی است. به‌زودی گزینه‌های تم تاریک، خروجی پشتیبان، مدیریت اعلان‌ها و تنظیمات تقویم در این قسمت فعال خواهد شد.
          </p>

          <div class="mt-4 flex items-center justify-between pt-2 border-t border-white/20">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-95 cursor-pointer"
              @click="handleNotify"
            >
              <svg v-if="!isNotified" class="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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

      <!-- Preview Settings Sections -->
      <div class="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <h3 class="text-sm font-bold text-slate-800">پیش‌نمایش بخش‌های تنظیمات</h3>

        <!-- Option 1: Theme -->
        <div class="flex items-center justify-between py-2 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-700">حالت تاریک (Dark Mode)</h4>
              <p class="text-[11px] text-slate-400">تغییر تم رنگی به حالت شب</p>
            </div>
          </div>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            به‌زودی
          </span>
        </div>

        <!-- Option 2: Notifications -->
        <div class="flex items-center justify-between py-2 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-700">اعلان‌های یادآور روزانه</h4>
              <p class="text-[11px] text-slate-400">ارسال یادآور در ساعت مشخص</p>
            </div>
          </div>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            به‌زودی
          </span>
        </div>

        <!-- Option 3: Backup -->
        <div class="flex items-center justify-between py-2 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-700">پشتیبان‌گیری از داده‌ها</h4>
              <p class="text-[11px] text-slate-400">دریافت فایل پشتیبان کارهای ثبت‌شده</p>
            </div>
          </div>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            به‌زودی
          </span>
        </div>

        <!-- App Info -->
        <div class="pt-2 text-center text-xs text-slate-400">
          برنامه توتیا (Totea) · نسخه ۱.۰.۰
        </div>
      </div>
    </div>
  </div>
</template>
