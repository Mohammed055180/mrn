# تعديل real-estate-platform.jsx

## 1. أعلى الملف
أضف `useEffect` إلى React imports، ثم استورد `./api.js`.

## 2. احذف البيانات المؤقتة
احذف:
- `idCounter`
- `genId`
- `seedProperties`
- `seedRequests`

اترك قوائم CITIES وPROPERTY_TYPES وغيرها لأنها خيارات واجهة وليست بيانات قاعدة بيانات.

## 3. App root
بدلاً من:
```jsx
const [properties, setProperties] = useState(seedProperties);
const [requests, setRequests] = useState(seedRequests);
const [adminAuthed, setAdminAuthed] = useState(false);
```

استخدم state فارغاً، ثم `useEffect` لجلب العقارات المنشورة. لا تحتاج `requests` في الجزء العام من الموقع.

## 4. عرض العقارات
استبدل الفلترة المحلية في `PropertiesPage` بطلب:
`GET /api/properties?...`

الأفضل تمرير filters إلى API كلما تغيرت، أو استخدام debounce بسيط. السيرفر هو مصدر الحقيقة.

## 5. طلب عقار
في `RequestPropertyPage` استبدل `onSubmit(f)` بـ:
```jsx
await createRequest(f);
```
وأظهر رسالة النجاح فقط بعد نجاح الطلب.

## 6. عرض عقار
في `ListPropertyPage` لا تحفظ `URL.createObjectURL` على أنها images.
احتفظ بالـ File objects للرفع، ثم:
```jsx
const { images } = await uploadImages(files);
await createProperty({ ...f, area: Number(f.area), price: Number(f.price), images });
```

## 7. تسجيل دخول الأدمن
استبدل كلمة المرور `admin123` تماماً. استخدم:
```jsx
const result = await adminLogin(identity, pass);
localStorage.setItem("adminToken", result.token);
setAdminAuthed(true);
```

## 8. لوحة الإدارة
عند فتح اللوحة:
- `getAdminRequests(statusFilter)`
- `getPendingProperties()`
- اعرض العقارات المنشورة من `getProperties()` أو من state العام.
- تغيير الحالة: `updateAdminRequestStatus(id, status)`
- اعتماد: `approveProperty(id)`
- مميز: `toggleFeatured(id)`
- حذف: `deleteProperty(id)`

بعد كل mutation، أعد جلب القائمة من السيرفر بدلاً من تعديل state فقط.

## 9. CSV
استخدم `downloadAdminCsvExample` من `frontend/integration-snippets.jsx` لأن endpoint محمي بـ JWT.

## 10. _id مقابل id
MongoDB يعيد `_id`. استخدم:
```jsx
const id = item.id || item._id;
```
أو طبّع البيانات عند الاستلام.
