# การแก้ไขปัญหา Double Slash ใน URL

## ปัญหาที่พบ
```
[Vue Router warn]: Location "//admin" resolved to "//admin". A resolved location cannot start with multiple slashes.
```

## สาเหตุของปัญหา
ปัญหานี้เกิดจากการที่มี double slash (`//`) ใน URL ซึ่งเกิดจาก:

1. **การต่อ string URL ไม่ถูกต้อง**: เมื่อ `apiBase` มี trailing slash และต่อกับ path ที่เริ่มด้วย `/`
2. **การสร้าง URL ไม่ถูกต้อง**: ไม่ได้ใช้ URL constructor หรือ URL utilities

## การแก้ไข

### 1. **Backend (authController.js)**
```javascript
// เปลี่ยนจาก
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const redirectUrl = `${frontendUrl}/admin`;

// เป็น
const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
const redirectUrl = `${frontendUrl.origin}/admin`;
```

### 2. **Frontend - Helper Function**
สร้าง helper function สำหรับสร้าง URL ที่ถูกต้อง:
```javascript
const createApiUrl = (endpoint) => {
  const apiUrl = new URL(apiBase);
  return `${apiUrl.origin}${endpoint}`;
};
```

### 3. **ไฟล์ที่ปรับปรุง**

#### Backend
- `backend/controllers/authController.js`: ใช้ URL constructor

#### Frontend
- `frontend/pages/login.vue`: ใช้ createApiUrl helper
- `frontend/components/Header.vue`: ใช้ createApiUrl helper
- `frontend/middleware/auth.js`: ใช้ createApiUrl helper
- `frontend/composables/useAuth.js`: ใช้ createApiUrl helper

## ข้อดีของการแก้ไข

1. **ป้องกัน Double Slash**: URL จะไม่มี double slash อีกต่อไป
2. **URL ที่ถูกต้อง**: ใช้ URL constructor เพื่อสร้าง URL ที่ถูกต้อง
3. **รองรับ Trailing Slash**: ไม่ว่าจะมี trailing slash ใน apiBase หรือไม่
4. **มาตรฐาน**: ใช้ URL constructor ตามมาตรฐาน JavaScript

## การทดสอบ

1. **ทดสอบการเข้าสู่ระบบ**:
   - ไปที่ `/login`
   - คลิก "Sign in with Google"
   - ตรวจสอบว่า URL ไม่มี double slash

2. **ทดสอบ API Calls**:
   - เปิด Developer Tools
   - ดู Network tab
   - ตรวจสอบว่า API requests ไม่มี double slash

3. **ทดสอบ Navigation**:
   - ตรวจสอบว่า router.push ไม่มี double slash
   - ตรวจสอบว่า navigateTo ไม่มี double slash

## ตัวอย่าง URL ที่ถูกต้อง

### ก่อนแก้ไข (มีปัญหา)
```
http://localhost:5000//auth/me
http://localhost:5000//auth/refresh
http://localhost:3000//admin
http://localhost:3000//user
```

### หลังแก้ไข (ถูกต้อง)
```
http://localhost:5000/auth/me
http://localhost:5000/auth/refresh
http://localhost:3000/admin
http://localhost:3000/user
```

## หมายเหตุ

- ใช้ `URL.origin` เพื่อให้ได้เฉพาะ protocol, hostname และ port
- ใช้ `createApiUrl` helper function เพื่อความสม่ำเสมอ
- ตรวจสอบ environment variables ว่าไม่มี trailing slash 