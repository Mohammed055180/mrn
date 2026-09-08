# الديار العقارية — Backend API

Backend كامل لـ React frontend المرفق، مبني على Node.js + Express + MongoDB/Mongoose.

## التشغيل

1. ثبّت Node.js 20+.
2. انسخ `.env.example` إلى `.env`.
3. ضع `MONGODB_URI` و `JWT_SECRET`.
4. أنشئ حساب الإدارة:
   `npm install`
   `npm run create-admin`
5. شغّل:
   `npm run dev`

## Cloudinary

ضع:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLOUDINARY_FOLDER

مسار `POST /api/properties/images` يستقبل multipart/form-data باسم `images`.
الملفات تُرفع إلى Cloudinary، ثم تُرسل روابطها إلى `POST /api/properties`.

## API

Public:
- GET /api/properties
- GET /api/properties/:id
- POST /api/properties
- POST /api/properties/images
- POST /api/requests
- POST /api/auth/login

Admin (Bearer JWT):
- GET /api/admin/requests
- PATCH /api/admin/requests/:id/status
- GET /api/admin/properties/pending
- PATCH /api/admin/properties/:id/approve
- PATCH /api/admin/properties/:id/featured
- DELETE /api/admin/properties/:id
- GET /api/admin/requests/export-csv

## فلترة العقارات

GET `/api/properties?city=الرياض&offerType=sale&propertyType=فيلا&minPrice=1000000&maxPrice=3000000&sortBy=price_asc`

## ملاحظة

الواجهة الأصلية تستخدم `seedProperties` و`seedRequests` و`setState` لتخزين البيانات محلياً. ملف `frontend/integration-snippets.jsx` يوضح الاستبدالات المطلوبة. كما أن رفع الصور الحالي يستخدم `URL.createObjectURL()` للمعاينة؛ هذا لا يصلح كرابط دائم، لذلك يجب رفع File objects إلى `/api/properties/images` أولاً.

لإنتاج تطبيق Production فعلي، أضف HTTPS، سجلات ومراقبة، نسخاً احتياطية لـ MongoDB، والتحقق من المدخلات (مثل Zod/Joi) وسياسة لحذف صور Cloudinary عند حذف العقار إذا كان ذلك مطلوباً.