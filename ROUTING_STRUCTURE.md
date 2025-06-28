# โครงสร้าง Routing ใหม่

## การเปลี่ยนแปลงหลัก

### 1. ลบไฟล์ที่ไม่ต้องการ
- ❌ `frontend/pages/callback.vue`
- ❌ `frontend/pages/dashboard.vue`
- ❌ `frontend/pages/auth/callback.vue`
- ❌ `frontend/pages/user/report.vue`

### 2. เปลี่ยนโครงสร้างเป็นมาตรฐาน
- ✅ `frontend/pages/admin/index.vue` (เดิมเป็น dashboard.vue)
- ✅ `frontend/pages/user/index.vue` (เดิมเป็น report.vue)

## โครงสร้าง Routing ใหม่

```
frontend/pages/
├── index.vue                    # หน้าหลัก (public)
├── login.vue                    # หน้าเข้าสู่ระบบ
├── admin/
│   ├── index.vue               # หน้าแรกของ admin (dashboard)
│   ├── map.vue                 # หน้าแผนที่
│   ├── report.vue              # หน้ารายงาน
│   ├── resources.vue           # หน้าทรัพยากร
│   └── case/
│       └── _id.vue             # หน้ารายละเอียดเคส
└── user/
    └── index.vue               # หน้าแรกของ user (report)
```

## URL Paths ใหม่

### Admin Routes
- `/admin` → `admin/index.vue` (หน้า dashboard)
- `/admin/map` → `admin/map.vue`
- `/admin/report` → `admin/report.vue`
- `/admin/resources` → `admin/resources.vue`
- `/admin/case/1` → `admin/case/_id.vue`

### User Routes
- `/user` → `user/index.vue` (หน้า report)

### Public Routes
- `/` → `index.vue` (หน้าหลัก)
- `/login` → `login.vue`

## การเปลี่ยนแปลงใน Backend

### Auth Controller
```javascript
// เปลี่ยนจาก
const redirectUrl = req.user.role === 'admin' 
  ? `${frontendUrl}/admin/dashboard`
  : `${frontendUrl}/user/report`;

// เป็น
const redirectUrl = req.user.role === 'admin' 
  ? `${frontendUrl}/admin`
  : `${frontendUrl}/user`;
```

## การเปลี่ยนแปลงใน Frontend

### Middleware
- ลบการจัดการ `/dashboard` route
- ปรับปรุงการ redirect ให้ใช้ path ใหม่

### Components
- `AdminNavbar.vue`: เปลี่ยน Dashboard link จาก `/admin/dashboard` เป็น `/admin`

### Pages
- `login.vue`: ปรับปรุงการ redirect หลังเข้าสู่ระบบ
- `Header.vue`: ปรับปรุงการจัดการ authentication

## ข้อดีของการเปลี่ยนแปลง

1. **มาตรฐาน**: ใช้ `index.vue` เป็นหน้าแรกของแต่ละ folder ตามมาตรฐาน Nuxt
2. **เรียบง่าย**: ลดความซับซ้อนของ routing
3. **เข้าใจง่าย**: URL สั้นและชัดเจน
4. **SEO Friendly**: URL ที่สั้นและเข้าใจง่าย

## การทดสอบ

1. **เข้าสู่ระบบเป็น Admin**:
   - ไปที่ `/login`
   - เข้าสู่ระบบด้วย Google (admin account)
   - ควร redirect ไปที่ `/admin`

2. **เข้าสู่ระบบเป็น User**:
   - ไปที่ `/login`
   - เข้าสู่ระบบด้วย Google (user account)
   - ควร redirect ไปที่ `/user`

3. **ทดสอบ Navigation**:
   - คลิก Dashboard ใน AdminNavbar
   - ควรไปที่ `/admin`

4. **ทดสอบ Middleware**:
   - พยายามเข้าถึง `/admin` ด้วย user account
   - ควร redirect ไปที่ `/user` 