# Project Structure Documentation

## 📁 Cấu trúc dự án

```
src/
├── App.vue                          # Root component
├── main.js                          # Entry point
├── constants.js                     # ⭐ Constants & config (NEW)
│
├── assets/
│   └── main.css                     # Global styles + Tailwind
│
├── components/
│   ├── LoginForm.vue               # ⭐ Form đăng nhập (NEW)
│   ├── Sidebar.vue                 # Chưa hoàn thiện
│   └── ui/                         # UI components (trống, dành cho radix-vue)
│
├── layouts/
│   ├── Layout.vue                  # ⭐ Main layout (UPDATED)
│   ├── Header.vue                  # ⭐ Header component (UPDATED)
│   └── Footer.vue                  # ⭐ Footer component (UPDATED)
│
├── router/
│   └── index.js                    # ⭐ Vue Router config (UPDATED)
│
├── services/
│   ├── apiClient.js                # ⭐ Axios instance (UPDATED)
│   └── api.js                      # ⭐ API endpoints helpers (NEW)
│
├── stores/
│   ├── authStore.js                # ⭐ Pinia auth store (UPDATED)
│   └── SubjectCreateView.vue       # Chưa dùng
│
└── views/
    ├── LoginView.vue               # ⭐ Login page (NEW)
    ├── HomeView.vue                # ⭐ Dashboard page (NEW)
    └── SubjectsView.vue            # ⭐ Subjects list page (NEW)
```

## 🔄 Luồng ứng dụng

```
1. User truy cập app
   ↓
2. main.js khởi động
   - Tạo Vue app
   - Gắn Pinia (state management)
   - Gắn router
   ↓
3. App.vue render
   - Component Layout
   ↓
4. Layout.vue
   - Kiểm tra route meta
   - Nếu login → hiển thị blank layout
   - Nếu khác → hiển thị Header + RouterView + Footer
   - Restore session từ localStorage
   ↓
5. Router guard kiểm tra token
   - Có token + route yêu cầu auth → cho vào
   - Không token + route yêu cầu auth → redirect /login
   - Có token + đang ở /login → redirect /
```

## 🔐 Authentication Flow

```
Login Page
    ↓
User nhập username/password
    ↓
LoginForm gọi authStore.login()
    ↓
authStore.login() gọi POST /api/auth/login
    ↓
Backend trả về: { access_token, user }
    ↓
authStore lưu token vào localStorage + Pinia state
    ↓
Redirect về / (HomePage)
    ↓
Mỗi request sẽ tự động thêm Authorization header
    ↓
Nếu token hết hạn (401) → auto logout + redirect /login
```

## 📊 State Management (Pinia)

### Auth Store (`src/stores/authStore.js`)

**State:**
- `user` - User object
- `token` - JWT token
- `isLoading` - Loading state
- `error` - Error message

**Computed:**
- `isAuthenticated` - Is user logged in
- `userName` - User display name

**Actions:**
- `login(username, password)` - Đăng nhập
- `logout()` - Đăng xuất
- `restoreSession()` - Khôi phục session từ localStorage

**Usage:**
```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Đăng nhập
await authStore.login('admin', 'password')

// Đăng xuất
authStore.logout()

// Kiểm tra đã đăng nhập hay chưa
if (authStore.isAuthenticated) { }

// Lấy tên user
console.log(authStore.userName)
</script>
```

## 🌐 API Service

### Cấu trúc (`src/services/api.js`)

```javascript
import { subjectsAPI, authAPI } from '@/services/api'

// Subjects
await subjectsAPI.getAll()
await subjectsAPI.getById(id)
await subjectsAPI.create(data)
await subjectsAPI.update(id, data)
await subjectsAPI.delete(id)

// Auth
await authAPI.login(username, password)
await authAPI.logout()
```

### Request interceptor
- Tự động thêm `Authorization: Bearer {token}` vào mỗi request

### Response interceptor
- Nếu status 401 → xóa token + redirect /login

## 🛣️ Routes

| Path | Name | Component | Auth | Layout |
|------|------|-----------|------|--------|
| `/login` | Login | LoginView | ❌ | blank |
| `/` | Home | HomeView | ✅ | default |
| `/subjects` | Subjects | SubjectsView | ✅ | default |

**Thêm route mới:**
```javascript
// src/router/index.js
{
  path: '/new-page',
  name: 'NewPage',
  component: () => import('../views/NewPageView.vue'),
  meta: { requiresAuth: true }
}
```

## 🎨 Styling

### Tailwind Configuration
- File: `tailwind.config.js`
- CSS variables từ `src/assets/main.css`
- Dark mode support

### CSS Variables
- `--primary` - Primary color
- `--background` - Background
- `--foreground` - Text color
- `--border` - Border color
- `--muted-foreground` - Muted text
- `--destructive` - Error/danger color

### Sử dụng trong Vue
```vue
<div class="bg-primary text-primary-foreground">
  Primary color
</div>

<div class="bg-background text-foreground">
  Default colors
</div>

<div class="text-muted-foreground">
  Muted text
</div>
```

## 🔧 Configuration Files

### vite.config.js
- Alias `@` → `src/`
- Proxy `/api` → `http://localhost:8080`
- Vue 3 plugin + DevTools

### .env
```
VITE_API_URL=/api
```

### package.json
- `npm run dev` - Start dev server
- `npm run build` - Build production
- `npm run preview` - Preview build

### tailwind.config.js
- CSS variable mode enabled

### postcss.config.js
- Tailwind + Autoprefixer

## 🚀 Khởi động dự án

```bash
# 1. Cài dependencies
npm install

# 2. Khởi động dev server
npm run dev

# 3. Mở browser
# http://localhost:5173

# 4. Cấu hình backend proxy
# Mặc định proxy /api → http://localhost:8080
# Sửa trong vite.config.js nếu backend ở URL khác
```

## 📝 Best Practices

### Component Structure
```vue
<template>
  <!-- Template first -->
</template>

<script setup>
  // Imports
  // Composables
  // State
  // Methods
  // Lifecycle hooks
</script>

<style scoped>
  /* Use Tailwind classes in template instead */
</style>
```

### Store Usage
```javascript
// ✅ Do
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// ❌ Don't
import { useAuthStore } from '@/stores/authStore'
const { isAuthenticated, user } = useAuthStore()
// (This breaks reactivity in Options API, use in Composition API)
```

### API Calls
```javascript
// ✅ Do
import { subjectsAPI } from '@/services/api'
try {
  const data = await subjectsAPI.getAll()
} catch (error) {
  console.error(error.response?.data?.message)
}

// ❌ Don't
import apiClient from '@/services/apiClient'
// Use dedicated API service methods instead
```

## 🐛 Debugging

### Vue DevTools
- Install extension từ Chrome/Firefox
- Inspect components, state, routes

### Network Tab
- Xem API requests
- Kiểm tra token trong request header

### Console
- Kiểm tra error messages
- Log state changes

## 📚 Next Steps

- [ ] Implement backend endpoints
- [ ] Add form validation library (vee-validate, zod)
- [ ] Add toast/notification component
- [ ] Add loading spinner
- [ ] Implement subjects list API
- [ ] Add subject create/edit modal
- [ ] Add role-based access control
- [ ] Add error boundary
- [ ] Add 404 page
- [ ] Add password reset flow
- [ ] Add user profile page

---

**Last Updated**: April 2026

