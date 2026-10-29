# Sayeh Connect — دليل النشر (حوالي 15 دقيقة)

## شنوة فما في المجلد
- `index.html` : التطبيق (نفس التصميم متاع الموكاب)
- `api/jobs.js` : السيرفر الصغير اللي يجيب العروض الحقيقية (Adzuna + Arbeitnow + Remotive)
- `manifest.webmanifest` و `sw.js` و `icons/` : باش يتثبّت على التلفون ويخدم أوفلاين
- `vercel.json` : إعداد بسيط

## 1) (اختياري) مفتاح Adzuna
Adzuna **مدفوع** للاستعمال الحقيقي: £8 في الشهر (الحساب المجاني فيه 25 طلب تجريبي فقط). **تخطّاه**: التطبيق يخدم بدونو بـ Arbeitnow وRemotive (مجانيين بلا مفتاح). إذا قرّرت تدفع بعد، زيد `ADZUNA_ID` و `ADZUNA_KEY` في Vercel، وما يتطلب تغيير في الكود. وقتها زيد عبارة «Jobs by Adzuna» مع رابط، حسب شروطهم.

## 2) حط الملفات في GitHub
1. اعمل حساب على https://github.com إذا ما عندكش.
2. New repository ثم سمّيه `sayeh-connect` ثم Create.
3. "uploading an existing file" ثم اسحب **كل محتوى المجلد** (index.html وapi وicons...) ثم Commit.

## 3) انشر على Vercel (مجاني)
1. https://vercel.com وسجّل بحساب GitHub.
2. Add New ثم Project ثم اختار `sayeh-connect` ثم Deploy (ما تبدّل شي في الإعدادات).
3. ما تحتاج حتى مفتاح. بعد النشر افتح الرابط وشوف العروض.

## 4) ثبّت التطبيق على Oppo Reno 4z
1. افتح رابط Vercel (مثال: sayeh-connect.vercel.app) في Chrome.
2. القائمة (⋮) ثم "Add to Home screen" أو "Install app".
3. من Profil ثم Paramètres ثم "Activer les notifications".

## ملاحظات صريحة
- **عروض تونس**: ما فماش API مفتوح لـ Tanitjob وKeejob. التطبيق يوريك المواقع، وتزيد العروض اللي تعجبك بزرّ "+ Ajouter une offre trouvée".
- **الإشعارات**: تطلع كي تفتح التطبيق وتلقى عروض جديدة. الإشعار وهو مسكّر يتطلب Web Push وسيرفر إضافي.
- **الحفظ**: الاتصالات والمفضلة محفوظة في التلفون. ما فماش مزامنة بين جهازين.
- **الأيقونة** مصغّرة من الصورة. إذا عندك اللوغو بجودة عالية بدّل `icons/icon-512.png` و `icons/icon-192.png`.
- **المصادر**: Remotive وAdzuna وArbeitnow لهم شروط استعمال. التطبيق يوري اسم المصدر ويفتح رابط العرض الأصلي.
