# راهنمای جامع مدیریت پرش کیبورد (Keyboard Handling Guide)

این مستند، معماری و الگوی پیاده‌سازی‌شده در توتیا را برای مدیریت کیبورد مجازی در محیط‌های Capacitor (اندروید و iOS) و وب توضیح می‌دهد تا در تمام بخش‌ها و کامپوننت‌های جدید به شکل یکپارچه رعایت شود.

---

## ۱. صورت مسئله: چرا کیبورد باعث پرش و کندی محتوا می‌شود؟
در اپلیکیشن‌های هایبرید (Capacitor / WebView):
1. رفتار پیش‌فرض وب‌ویو و سیستم‌عامل این است که با باز شدن کیبورد، اندازهٔ کل پنجره (`window.innerHeight` یا `body`) تغییر کند (`resize: body`). این رفتار باعث لرزش شدید (Jumping)، به‌هم‌ریختگی اسکرول، و فلیکر شدن پس‌زمینه می‌شود.
2. انیمیشن روی ویژگی‌های هندسی مثل `height`، `padding-bottom` یا `bottom` به شدت کند و سنگین است؛ زیرا در هر فریم (۱۶ میلی‌ثانیه) مرورگر مجبور است کل لایه‌بندی (Reflow & Layout Recalculation) را از نو محاسبه کند.

---

## ۲. راه‌حل الهام‌گرفته از مخزن `vue-capacitor-ios-chat-demo`

راهکار پیاده‌سازی‌شده بر پایه ۴ اصل طلایی است:

### اصل ۱: غیرفعال‌سازی تغییر اندازهٔ پنجره (`Keyboard.resize = 'none'`)
در فایل `capacitor.config.ts`، پلاگین کیبورد با مقدار `'none'` تنظیم شده است:
```ts
plugins: {
  Keyboard: {
    resize: 'none',
    style: 'LIGHT',
    resizeOnFullScreen: true,
  },
}
```
با این کار، WebView در برابر باز شدن کیبورد دچار شوک و تغییر سایز ناگهانی نمی‌شود و ابعاد صفحه کاملاً ایستا و ثابت باقی می‌ماند.

---

### اصل ۲: انیمیشن فقط با `transform`، هرگز با `height`
برای جابه‌جا کردن المان ورودی یا Bottom Sheet به بالای کیبورد، **هرگز** از انیمیشن `height` یا `padding-bottom` استفاده نمی‌شود. فقط از:
```css
transform: translate3d(0, -${keyboardHeight}px, 0);
will-change: transform;
```
استفاده می‌کنیم. خاصیت `transform` توسط کارت گرافیک (GPU Compositor) پردازش می‌شود و هیچ‌گونه Reflow یا جابه‌جایی سایر لایه‌های DOM تولید نمی‌کند.

---

### اصل ۳: ضرورت استفاده از تابع زمان‌بندی `ease`
کیبورد مجازی در موبایل (به خصوص iOS) با شتاب اولیهٔ بسیار بالا از لبهٔ پایین صفحه به بالا شلیک می‌شود.
- در کسری از ثانیه اول، بخش پایینی المان پشت کیبورد قرار می‌گیرد و اصلاً برای کاربر دیده نمی‌شود.
- بنابراین انیمیشن باید در ابتدا سریع (`fast start`) باشد تا المان از کیبورد عقب نیفتد، و در انتها به آرامی و با وقار متوقف شود (`decelerate`).
- منحنی `ease` (معادل `cubic-bezier(0.25, 0.1, 0.25, 1.0)`) دقیقاً همین رفتار را دارد و بهترین حس حرکتی بومی (Native feel) را ارائه می‌دهد.

```css
transition: transform 280ms ease;
```

---

### اصل ۴: جداسازی لایه ترنزیشن (Transition) از لایه ترنسفورم (Transform)
در کامپوننت‌های Bottom Sheet (مثل کشوهای افزودن و ویرایش تسک)، اگر استایل اینلاین `transform` را مستقیماً روی المنتی بگذارید که تگ `<Transition>` دارد، استایل اینلاین کلاس‌های ترنزیشن ورود (`translate-y-full`) را خنثی می‌کند.

**الگوی صحیح ساختار کامپوننت:**
```html
<Transition appear enter-active-class="..." enter-from-class="translate-y-full" enter-to-class="translate-y-0">
  <!-- والد ۱: مسئول انیمیشن اسلاید ورود و خروج کشو -->
  <div class="relative z-10 w-full max-w-xl mx-auto" @click.stop>
    <!-- فرزند ۲: مسئول بالا رفتن نرم با کیبورد -->
    <div
      class="rounded-t-3xl bg-white p-5 pb-8 shadow-2xl"
      :style="keyboardTransformStyle"
    >
      <!-- محتوای فرم، اینپوت و دکمه‌ها -->
    </div>
  </div>
</Transition>
```

---

## ۳. نحوه استفاده در بخش‌ها و کامپوننت‌های جدید

ما یک Composable آماده در مسیر `@/composables/useKeyboard` پیاده‌سازی کرده‌ایم:

```vue
<script setup lang="ts">
import { useKeyboard } from '@/composables/useKeyboard'

const {
  keyboardHeight,          // عدد ارتفاع کیبورد (px)
  isKeyboardOpen,          // وضعیت باز بودن (boolean)
  keyboardTransformStyle,  // استایل ترنسفورم بهینه با منحنی ease
  hideKeyboard,            // بستن دستی کیبورد
  showKeyboard             // باز کردن کیبورد
} = useKeyboard()

function handleClose() {
  hideKeyboard()
  // بستن مودال / شیت
}
</script>

<template>
  <div :style="keyboardTransformStyle">
    <!-- فیلد ورودی و دکمه‌ها -->
  </div>
</template>
```

---

## ۴. فال‌بک وب (Web / Browser Fallback)
Composable طراحی‌شده در محیط وب معمولی و پیش‌نمایش مرورگر نیز خودکار از `window.visualViewport` استفاده می‌کند؛ لذا تست و کارکرد در هر دو حالت اپ بومی و مرورگر کامپیوتر یا موبایل بی‌نقص است.
