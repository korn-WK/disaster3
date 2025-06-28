# การตั้งค่าและแก้ไขปัญหา

## การติดตั้ง Dependencies

### Backend
```bash
cd backend
npm install cookie-parser
```

### Frontend
```bash
cd frontend
npm install
```

## การตั้งค่า Environment Variables

### Backend (.env)
```env
MONGO_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## การรันเซิร์ฟเวอร์

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## การแก้ไขปัญหา

### 1. Error: Page not found: /dashboard

**สาเหตุ**: ระบบพยายามเข้าถึงหน้า `/dashboard` แต่ไม่มีหน้าในระบบ

**วิธีแก้ไข**:
- ระบบจะ redirect ไปยัง `/admin/dashboard` หรือ `/user/report` ตาม role
- หากยังมีปัญหา ให้ตรวจสอบการตั้งค่า API base URL

### 2. Authentication Error

**สาเหตุ**: ไม่สามารถเข้าสู่ระบบได้

**วิธีแก้ไข**:
- ตรวจสอบการตั้งค่า Google OAuth credentials
- ตรวจสอบการเชื่อมต่อ MongoDB
- ตรวจสอบ JWT_SECRET ใน backend

### 3. CORS Error

**สาเหตุ**: Frontend ไม่สามารถเรียก API จาก backend ได้

**วิธีแก้ไข**:
- ตรวจสอบการตั้งค่า CORS ใน backend
- ตรวจสอบ API base URL ใน frontend
- ตรวจสอบว่า backend รันที่ port 5000

### 4. Cookie Error

**สาเหตุ**: HttpOnly cookies ไม่ทำงาน

**วิธีแก้ไข**:
- ตรวจสอบว่าใช้ `credentials: 'include'` ใน fetch requests
- ตรวจสอบการตั้งค่า CORS credentials
- ตรวจสอบ domain และ protocol (http/https)

## การทดสอบระบบ

1. **ทดสอบการเข้าสู่ระบบ**:
   - ไปที่ `http://localhost:3000/login`
   - เข้าสู่ระบบด้วย Google
   - ตรวจสอบว่า redirect ไปยังหน้าที่ถูกต้อง

2. **ทดสอบการ Refresh Token**:
   - รอให้ access token หมดอายุ (15 นาที)
   - ทำการ request ใหม่
   - ตรวจสอบว่า token ถูก refresh อัตโนมัติ

3. **ทดสอบการ Logout**:
   - คลิกปุ่ม logout
   - ตรวจสอบว่า cookies ถูก clear
   - ตรวจสอบว่า redirect ไปยังหน้า login

## การ Debug

### Backend Logs
```bash
cd backend
npm run dev
# ดู logs ใน terminal
```

### Frontend Logs
- เปิด Developer Tools (F12)
- ดู Console tab
- ดู Network tab สำหรับ API requests

### Database
- ตรวจสอบ MongoDB connection
- ตรวจสอบ collections และ documents 