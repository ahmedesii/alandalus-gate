# دليل تشغيل موقع بوابة مدارس الأندلس

## الملفات اللي عندك
- `public/index.html` — الصفحة اللي هيشوفها الطلاب
- `api/open-gate.js` — الكود اللي بيكلم Tuya بأمان (السيرفر)
- `vercel.json`, `package.json` — إعدادات

## الخطوات

### 1. اعمل حساب على Vercel (مجاني)
روح على vercel.com → Sign Up → سجل بحساب GitHub أو إيميلك.

### 2. ارفع المشروع على GitHub
لو معندكش GitHub:
- اعمل حساب على github.com (مجاني)
- اعمل Repository جديد اسمه مثلاً `alandalus-gate`
- ارفع المجلد ده بالكامل (public/, api/, vercel.json, package.json)

### 3. اربط GitHub بـ Vercel
- من Vercel Dashboard → "Add New Project"
- اختار الـ Repository اللي رفعته
- دوس "Deploy" (سيبه على الإعدادات الافتراضية)

### 4. الأهم: ضيف المتغيرات السرية (Environment Variables)
ده أهم خطوة — من غيرها الموقع مش هيشتغل.

من داخل المشروع في Vercel → Settings → Environment Variables، ضيف الأربعة دول:

| الاسم (Name) | القيمة (Value) |
|---|---|
| `TUYA_CLIENT_ID` | `py588wdj3mhqj7jrkdnf` |
| `TUYA_CLIENT_SECRET` | `6a6b46cfa06a4042aee4af62662af4c4` |
| `TUYA_DEVICE_ID` | `bf3f7356a6107da96eww4t` |
| `GATE_ACCESS_CODE` | اختار أي كود رقمي تحبه (مثلاً `2026` أو `784512`) — ده اللي هيدخله الطلاب |

بعد ما تضيفهم، لازم تعمل **Redeploy** (في تاب Deployments → اختار آخر deployment → دوس "..." → Redeploy) عشان المتغيرات تتفعل.

### 5. جرب الموقع
هيديك Vercel لينك زي:
`https://alandalus-gate.vercel.app`

افتحه، اكتب الكود اللي حطيته في `GATE_ACCESS_CODE`، دوس "Open Gate"، وراقب البوابة.

---

## ملاحظات مهمة

**اسم الـ command الصحيح للجهاز:**
الكود حاليًا بيبعت أمر اسمه `switch_1` (الاسم القياسي لمعظم أجهزة الـ relay على Tuya). لو الجهاز معندوش هذا الاسم بالظبط، هتلاقي رسالة خطأ. لو حصل كده، قولي وهنشوف الاسم الصحيح من تاب "Debug Device" جوه IoT Platform (فيه تقدر تجرب أوامر الجهاز مباشرة وتشوف أسماءها الحقيقية).

**تغيير الكود لاحقًا:**
أي وقت تحب تغير كود الدخول، روح على Vercel → Settings → Environment Variables → غيّر قيمة `GATE_ACCESS_CODE` → اعمل Redeploy. الموقع نفسه مش محتاج أي تعديل.

**الأمان:**
- الـ Client Secret بتاعك محفوظ بس على سيرفر Vercel، مش ظاهر في كود الموقع ولا في المتصفح أبدًا.
- لو حسيت إن الكود اتسرب لحد بره المدرسة، غيّره فورًا من نفس الخطوة اللي فوق.
