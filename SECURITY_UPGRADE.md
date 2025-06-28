# การปรับปรุงระบบความปลอดภัย - HttpOnly Cookies และ Refresh Token

## การเปลี่ยนแปลงที่สำคัญ

### 1. การใช้ HttpOnly Cookies แทน localStorage
- **เดิม**: เก็บ JWT token ใน localStorage
- **ใหม่**: เก็บ token ใน HttpOnly cookies
- **ประโยชน์**: ป้องกัน XSS attacks เพราะ JavaScript ไม่สามารถเข้าถึง HttpOnly cookies ได้

### 2. การใช้ Refresh Token Pattern
- **Access Token**: อายุสั้น (15 นาที) สำหรับการเข้าถึง API
- **Refresh Token**: อายุยาว (7 วัน) สำหรับขอ access token ใหม่
- **ประโยชน์**: ลดความเสี่ยงหาก access token ถูกขโมย

### 3. การจัดการ Token อัตโนมัติ
- ระบบจะ refresh token อัตโนมัติเมื่อ access token หมดอายุ
- ผู้ใช้ไม่ต้องเข้าสู่ระบบใหม่บ่อยๆ

## การเปลี่ยนแปลงใน Backend

### 1. User Model
```javascript
// เพิ่ม refreshToken field
refreshToken: { type: String }
```

### 2. Auth Controller
- `handleCallback`: สร้าง access token และ refresh token
- `refreshToken`: ขอ access token ใหม่
- `logout`: ลบ refresh token และ clear cookies

### 3. Middleware
- อ่าน token จาก cookies แทน header
- จัดการ token expiration

### 4. Dependencies
- เพิ่ม `cookie-parser` สำหรับอ่าน cookies

## การเปลี่ยนแปลงใน Frontend

### 1. Composable (useAuth)
- `checkAuth`: ตรวจสอบสถานะการเข้าสู่ระบบ
- `logout`: ออกจากระบบ
- `apiRequest`: ทำ API request พร้อม auto-refresh

### 2. Middleware
- ป้องกันหน้า `/admin/*` และ `/user/*`
- ตรวจสอบสิทธิ์ตาม role

### 3. Components
- Header: ใช้ HttpOnly cookies
- Callback: ไม่ต้องจัดการ token ใน URL

## การติดตั้ง

### 1. ติดตั้ง Dependencies
```bash
cd backend
npm install cookie-parser
```

### 2. รันเซิร์ฟเวอร์
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## ความปลอดภัยที่เพิ่มขึ้น

1. **ป้องกัน XSS**: HttpOnly cookies ไม่สามารถเข้าถึงได้จาก JavaScript
2. **Token Rotation**: Access token หมดอายุเร็ว ลดความเสี่ยง
3. **Secure Logout**: ลบ refresh token จากฐานข้อมูล
4. **Automatic Refresh**: ผู้ใช้ไม่ต้องเข้าสู่ระบบใหม่บ่อยๆ

## การทดสอบ

1. เข้าสู่ระบบด้วย Google OAuth
2. ตรวจสอบว่า cookies ถูกตั้งค่า
3. ทดสอบการ refresh token อัตโนมัติ
4. ทดสอบการ logout และ clear cookies 