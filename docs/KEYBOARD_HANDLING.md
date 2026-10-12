# راهنمای جامع مدیریت پرش کیبورد (Keyboard Handling Guide)

این مستند، معماری و الگوی پیاده‌سازی‌شده در توتیا را برای مدیریت کیبورد مجازی در محیط‌های Capacitor (اندروید و iOS) و وب توضیح می‌دهد تا در تمام بخش‌ها و کامپوننت‌های جدید به شکل یکپارچه رعایت شود.

---

## ۱. صورت مسئله: چرا کیبورد باعث پرش و کندی محتوا می‌شود؟
در اپلیکیشن‌های هایبرید (Capacitor / WebView):
1. رفتار پیش‌فرض وب‌ویو و سیستم‌عامل این است که با باز شدن کیبورد، اندازهٔ کل پنجره (`window.innerHeight` یا `body`) تغییر کند (`resize: body`). این رفتار باعث لرزش شدید (Jumping)، به‌هم‌ریختگی اسکرول، و فلیکر شدن پس‌زمینه می‌شود.
2. انیمیشن روی ویژگی‌های هندسی مثل `height`، `padding-bottom` یا `bottom` به شدت کند و سنگین است؛ زیرا در هر فریم (۱۶ میلی‌ثانیه) مرورگر مجبور است کل لایه‌بندی (Reflow & Layout Recalculation) را از نو محاسبه کند.

---

## ۲. راه‌حل کامل و مهار لایه‌های مختلف تغییر اندازه در اندروید و iOS

برای اینکه وب‌ویو واقعاً و به هیچ وجه کوچک نشود، باید هر ۴ لایه‌ای که در اندروید سعی در کوچک کردن وب‌ویو دارند را مهار کنیم:

### لایه ۱: سیستم‌عامل اندروید (`AndroidManifest.xml` و `MainActivity.java`)
در اندروید، مقدار پیش‌فرض `android:windowSoftInputMode` برابر با `adjustResize` است. وقتی این مقدار تنظیم باشد، سیستم‌عامل پنجرهٔ اکتیویتی (و کل وب‌ویو) را به زور به اندازهٔ بالای کیبورد فشرده می‌کند.
- **راه‌حل:** تغییر این مقدار به `adjustNothing` در `AndroidManifest.xml`:
```xml
android:windowSoftInputMode="adjustNothing"
```
و همچنین اعمال صریح در `MainActivity.java`:
```java
getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
```
با این کار سیستم‌عامل اندروید هیچ دست‌کاری در اندازه یا اسکرول پنجره انجام نمی‌دهد.

### لایه ۲: پلاگین سیستمی SystemBars در Capacitor 8 (`insetsHandling: 'disable'`)
در کپسیتر نسخه ۸، پلاگین پیش‌فرض `SystemBars` کدی به شکل `v.setPadding(..., keyboardVisible ? imeInsets.bottom : 0)` روی لایه دکور اندروید اجرا می‌کند که باعث اضافه شدن پدینگ معادل ارتفاع کیبورد و کوچک شدن وب‌ویو می‌شد!
- **راه‌حل:** در `capacitor.config.ts` مقدار `insetsHandling` را غیرفعال می‌کنیم:
```ts
SystemBars: {
  insetsHandling: 'disable',
}
```

### لایه ۳: تنظیمات پلاگین کیبورد کپسیتر (`resize: 'none'` و `resizeOnFullScreen: false`)
تنظیم `resizeOnFullScreen: true` در اندروید یک قابلیت قدیمی برای مجبور کردن وب‌ویو به تغییر سایز در حالت فول‌اسکرین بود (`frameLayoutParams.height = usableHeightNow`) که باید حتماً `false` باشد تا وب‌ویو را دست‌کاری نکند:
```ts
Keyboard: {
  resize: 'none',
  style: 'LIGHT',
  resizeOnFullScreen: false,
}
```

### لایه ۴: متا تگ Viewport مرورگر (`interactive-widget=overlays-content`)
در کرومیوم / وب‌ویوی اندروید ۱۰۸ به بعد:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content">
```
مقدار `interactive-widget=overlays-content` به موتور مرورگر می‌گوید که کیبورد باید روی محتوا شناور شود و اندازه ویوپورت را تغییر ندهد.

---

## ۳. حرکت المان‌ها با شتاب سخت‌افزاری (`transform` و `ease`)
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

---

## ۵. مهار فاصلهٔ خالی (Gap) روی دستگاه‌های دارای کلیدهای ناوبری نرم‌افزاری اندروید
در گوشی‌های اندرویدی که نوار کلیدهای ۳ تایی ناوبری (Home / Back / Recents) به صورت نرم‌افزاری در پایین صفحه نمایش داده می‌شود:
- وب‌ویو برنامه بالای نوار ناوبری قرار دارد.
- وقتی کیبورد باز می‌شود، ایونت `WindowInsetsCompat.Type.ime()` در اندروید ارتفاع کیبورد را نسبت به لبهٔ فیزیکی پایین نمایشگر گزارش می‌دهد (که شامل ارتفاع نوار ناوبری نیز هست).
- در نتیجه اگر مستقیماً این عدد استفاده شود، کشو به اندازهٔ ارتفاع دکمه‌های ناوبری بالاتر از کیبورد قرار می‌گیرد و یک شکاف خالی بین آنها دیده می‌شود.
- **راه‌حل:** در پلاگین بومی `AndroidInsetsPlugin` در `MainActivity.java`، مقدار دقیق `navigationBars().bottom` استخراج و به جاوااسکریپت ارسال می‌شود. در `useKeyboard.ts` مقدار نهایی ترنسفورم به صورت زیر محاسبه می‌شود:
```ts
effectiveKeyboardHeight = Math.max(0, rawKeyboardHeight - navBarHeight)
```
با این کسر خودکار، کشو دقیقاً و مماس بر لبهٔ بالای کیبورد می‌نشیند و فاصله خالی کاملاً از بین می‌رود. در گوشی‌های دارای Gesture Navigation یا بدون دکمه ناوبری (و همچنین iOS) این عدد ۰ است و تغییری در رفتار استاندارد ایجاد نمی‌کند.

---

## ۶. مهار پرش و قرارگیری شیت پشت کیبورد در اولین باز شدن پس از آپدیت (Cold Start Fix)
در اندروید، وقتی اپلیکیشن به تازگی آپدیت یا نصب شده و کیبورد برای **اولین بار** باز می‌شود:
1. شنوندگان بومی کپسیتر به صورت غیرهمگام (Async Promise) رجیستر می‌شدند و اگر شیت بلافاصله باز می‌شد، ایونت اولیه از دست می‌رفت.
2. در اولین فریم انیمیشن کیبورد، اندروید مقدار `insets.isVisible()` را `false` و عدد ارتفاع را `0` گزارش می‌دهد که باعث می‌شد مقدار ارتفاع صفر تلقی شده و شیت پشت کیبورد بماند.
3. **راه‌حل جامع:**
   - **ثبت زودهنگام در بوت برنامه:** تابع `initGlobalKeyboard()` بلافاصله در `App.vue` فراخوانی می‌شود تا شنوندگان از بدو ورود آماده باشند.
   - **دریافت ارتفاع مقصد از Bounds در لایه جاوا (`MainActivity.java`):** با استفاده از `bounds.getUpperBound().bottom` در `WindowInsetsAnimationCompat`، ارتفاع نهایی کیبورد از همان میلی‌ثانیهٔ اول و پیش از پایان انیمیشن مستقیماً استخراج و به وب فرستاده می‌شود.
   - **کش پایدار ارتفاع کیبورد (`localStorage`):** مقدار معتبر ارتفاع کیبورد در حافظه لوکال ذخیره می‌شود و در صورت دریافت صفر در اولین استارت پس از آپدیت، بلافاصله مقدار واقعی از کش خوانده شده و مانع از افتادن شیت پشت کیبورد می‌شود.


