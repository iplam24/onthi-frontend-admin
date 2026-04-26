# Implementation Guide - Header, Footer, Layout, Login

## 🎯 Tóm tắt những gì đã triển khai

### 1. **Router** (`src/router/index.js`)
- Cấu hình 3 route chính:
  - `/login` - Trang đăng nhập (không yêu cầu xác thực)
  - `/` - Trang chủ (yêu cầu xác thực)
  - `/subjects` - Quản lý môn học (yêu cầu xác thực)
- Navigation guard tự động redirect:
  - User chưa login → redirect `/login`
  - User đã login access `/login` → redirect `/`

### 2. **API Client** (`src/services/apiClient.js`)
- Axios instance với:
  - Base URL: `/api`
  - Request interceptor: tự động thêm token vào header
  - Response interceptor: xử lý 401 (token hết hạn)

### 3. **Auth Store** (`src/stores/authStore.js`)
- Pinia store quản lý:
  - `user` - thông tin user
  - `token` - JWT token
  - `isAuthenticated` - trạng thái đăng nhập
  - `userName` - tên hiển thị
  - Actions: `login()`, `logout()`, `restoreSession()`
- Lưu trữ trên localStorage

### 4. **LoginForm Component** (`src/components/LoginForm.vue`)
- Form đăng nhập với:
  - Input username
  - Input password
  - Error message
  - Loading state
- Hỗ trợ Enter để submit

### 5. **LoginView** (`src/views/LoginView.vue`)
- Trang đăng nhập full page
- Card layout centered
- Responsive design

### 6. **HomeView** (`src/views/HomeView.vue`)
- Trang chủ với dashboard cards
- Hiển thị thống kê cơ bản

### 7. **SubjectsView** (`src/views/SubjectsView.vue`)
- Trang quản lý môn học
- Table layout + button "Thêm môn học"

### 8. **Header Component** (`src/layouts/Header.vue`)
- Logo + Menu link
- User dropdown menu
- Nút logout

### 9. **Footer Component** (`src/layouts/Footer.vue`)
- Copyright + footer links

### 10. **Layout** (`src/layouts/Layout.vue`)
- Layout chính của app
- Xử lý blank layout cho login page
- RouterView + Header + Footer
- Auto restore session on mount

## 🚀 Cách sử dụng

### Khởi động dev server
```bash
npm run dev
```

### Build production
```bash
npm build
```

## 📝 API Endpoints cần implement trên backend

### 1. Login
```
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "access_token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Admin User",
    "email": "admin@example.com"
  }
}
```

### 2. Get Subjects (placeholder)
```
GET /api/subjects
Headers: Authorization: Bearer {access_token}
```

## 🔐 Luồng xác thực

1. User access trang login
2. Nhập username/password
3. POST `/api/auth/login`
4. Backend trả về token
5. Frontend lưu token vào localStorage
6. Auto redirect về home
7. Khi reload page, auto restore session
8. Logout → xóa token + redirect login

## 💾 LocalStorage Keys

- `auth_token` - JWT token
- `user_info` - JSON user object

## 🎨 Tailwind Colors

App dùng các CSS variables:
- `--primary` - Màu chính (tối xanh)
- `--background` - Nền (trắng)
- `--foreground` - Chữ (tối)
- `--border` - Border (xám nhạt)
- `--muted-foreground` - Chữ mờ
- Dark mode support qua class `.dark`

## 📦 Dependencies chính

- `vue` - Framework
- `vue-router` - Routing
- `pinia` - State management
- `axios` - HTTP client
- `tailwindcss` - Styling
- `fontawesome` - Icons

## ⚠️ Todo / Chưa hoàn thiện

- [ ] Implement endpoint login trên backend
- [ ] Thêm forget password feature
- [ ] Validate form input
- [ ] Add loading spinner component
- [ ] Implement subjects list API
- [ ] Add role-based access control (RBAC)
- [ ] Error handling & toast notifications
- [ ] Dark mode toggle

## 🐛 Troubleshooting

### Nếu login không hoạt động
1. Kiểm tra backend có endpoint `/api/auth/login` không
2. Kiểm tra CORS config trên backend
3. Mở DevTools → Network để xem request

### Nếu build fail
```bash
npm install
npm run build
```

### Nếu token expired
App tự động:
1. Xóa token
2. Clear user info
3. Redirect `/login`

---

**Last Updated**: April 2026

