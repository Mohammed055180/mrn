# الديار العقارية — سوق عقاري عربي

الواجهة مبنية بـ React وVite، وتُقدّم من خادم Express الحالي. قراءة الإعلانات العامة ونشر الإعلانات الجديدة يستخدمان Supabase؛ وتبقى واجهات الـ API القديمة متاحة للتوافق.

## الإعداد

1. استخدم مشروع Supabase الحالي وشغّل `supabase/schema.sql` في SQL Editor.
2. فعّل تسجيل الدخول بالبريد (magic link)، واضبط Site URL وعنوان Render ضمن Redirect URLs.
3. انسخ `.env.example` إلى `.env`. أضف `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY`؛ لا تستخدم مفتاح `service_role` في المتصفح أو في أي متغير يبدأ بـ `VITE_`.
4. شغّل `npm install` ثم `npm run frontend:dev` و`npm run dev` في نافذتين محلياً.

## Render

اضبط Build Command إلى `npm install && npm run build`، واترك Start Command `npm start`. عرّف متغيرات `VITE_SUPABASE_URL` و`VITE_SUPABASE_ANON_KEY` قبل البناء كي يضمّنهما Vite في الموقع. الخادم يحتاج كذلك `MONGODB_URI` و`JWT_SECRET` بسبب API الإدارة القديم.

## مراجعة الإعلانات والخصوصية

كل إعلان جديد حالته `pending` ولا يظهر للعامة قبل الموافقة. يراجع المسؤول الإعلان في Supabase ثم يغيّر `status` إلى `published` أو `rejected`. بيانات الهاتف في `listing_contacts` ولا يقرأها إلا صاحب الإعلان. صور العقار في bucket عام للقراءة، مع رفع موثّق إلى مجلد صاحب الحساب، وصيغ JPEG/PNG/WebP وحد 5 ميغابايت.

مثال اعتماد إعلان بعد التحقق منه يدوياً في Supabase SQL Editor:

```sql
update public.listings set status = 'published', updated_at = now()
where id = 'LISTING_UUID' and status = 'pending';
```

سياسات RLS تتحقق من الملكية وحالة الإعلان. المفتاح العام آمن فقط بالاقتران مع RLS؛ لا تنشر أي `service_role`, JWT secret, MongoDB URI أو بيانات اعتماد Cloudinary.

