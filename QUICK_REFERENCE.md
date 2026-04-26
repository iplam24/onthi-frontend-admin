# ⚡ Quick Reference Guide

## 🚀 Quick Start (2 min)

```bash
npm install
npm run dev
# http://localhost:5173
```

**Login with any credentials** (backend validates)  
**Backend URL**: `http://localhost:8080` (edit in `vite.config.js`)

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `src/router/index.js` | Routes & guards |
| `src/stores/authStore.js` | Auth logic |
| `src/services/apiClient.js` | HTTP client |
| `src/services/api.js` | API endpoints |
| `src/layouts/Layout.vue` | Main layout |
| `src/constants.js` | Config values |

---

## 🔐 Auth Flow Diagram

```
1. User at /login
   ↓
2. Enter credentials → POST /api/auth/login
   ↓
3. Backend returns { access_token, user }
   ↓
4. Store token in localStorage
   ↓
5. Redirect to /
   ↓
6. Each request auto-includes token
   ↓
7. On 401 → auto logout → redirect /login
```

---

## 💻 Common Code Snippets

### Use Auth Store
```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'
const auth = useAuthStore()

// Check if logged in
if (auth.isAuthenticated) {
  console.log(auth.user)
}

// Logout
auth.logout()
</script>
```

### Call API
```vue
<script setup>
import { subjectsAPI } from '@/services/api'

const subjects = await subjectsAPI.getAll()
</script>
```

### Add Route
```javascript
// src/router/index.js
{
  path: '/my-page',
  name: 'MyPage',
  component: () => import('../views/MyPageView.vue'),
  meta: { requiresAuth: true }
}
```

### Add Navigation Link
```vue
<!-- src/layouts/Header.vue -->
<RouterLink to="/my-page" class="...">
  My Page
</RouterLink>
```

### Show/Hide Based on Auth
```vue
<template>
  <div v-if="authStore.isAuthenticated">
    Logged in!
  </div>
</template>
```

---

## 🎨 Styling Cheat Sheet

```html
<!-- Colors -->
<div class="bg-primary text-primary-foreground">Primary</div>
<div class="text-foreground">Normal text</div>
<div class="text-muted-foreground">Muted text</div>

<!-- Responsive -->
<div class="hidden md:flex">Show on medium+ screens</div>
<div class="px-4 md:px-6">Padding adapts</div>

<!-- Layout -->
<div class="flex justify-between items-center">Flex row</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">3 cols on desktop</div>

<!-- Border -->
<div class="border border-border">Has border</div>

<!-- Effects -->
<button class="hover:bg-primary/90 transition-colors">Hover effect</button>
```

---

## 🔧 Environment Setup

### `.env`
```
VITE_API_URL=/api
```

### Backend Proxy
**File**: `vite.config.js`
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // Change if needed
      changeOrigin: true,
    },
  },
}
```

---

## 📡 API Integration Checklist

- [ ] POST /api/auth/login
- [ ] GET /api/subjects
- [ ] POST /api/subjects
- [ ] PUT /api/subjects/:id
- [ ] DELETE /api/subjects/:id

**Example Response Format:**
```json
{
  "access_token": "jwt_here",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Admin User"
  }
}
```

---

## 🐛 Debugging Tips

1. **Check Token**: `localStorage.getItem('auth_token')`
2. **Check Request**: DevTools → Network tab
3. **Check State**: Install Vue DevTools extension
4. **Check Console**: Look for error messages
5. **Check Routes**: Try adding `/nonexistent` and see 404

---

## 📊 Project Stats

- **Routes**: 3 (login, home, subjects)
- **Stores**: 1 (authStore)
- **Pages**: 3 (LoginView, HomeView, SubjectsView)
- **Components**: 5 (Layout, Header, Footer, LoginForm)
- **API Helpers**: 2 modules (subjects, auth)
- **Build Size**: ~139KB (54KB gzip)

---

## ⚠️ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Blank page at / | Check backend /api/auth/login works |
| Token not sent | Check localStorage → auth_token |
| Cannot login | Check backend CORS headers |
| 404 on route | Add route in router/index.js |
| Styles not loading | npm install, clear cache, rebuild |
| Auto-logout | Token likely expired (401 response) |

---

## 📚 File Organization

```
src/
├── components/    # Reusable components (LoginForm)
├── layouts/       # Page layout (Header, Footer, Layout)
├── views/         # Page components (LoginView, HomeView, etc)
├── stores/        # State (authStore with Pinia)
├── services/      # API (apiClient, api.js)
├── router/        # Routes & guards
├── assets/        # CSS & images
└── constants.js   # Config values
```

---

## 🎯 Development Workflow

1. **Create Vue component** in `src/components/` or `src/views/`
2. **Import** component where needed
3. **Add styling** using Tailwind classes (no CSS files!)
4. **Use Pinia store** for state (not local data unless component-specific)
5. **Call API** using functions from `src/services/api.js`
6. **Test in browser** - DevTools for debugging

---

## 🔑 Key Concepts

| Concept | Location | Use For |
|---------|----------|---------|
| **Routes** | `router/index.js` | Page navigation & guards |
| **State** | `stores/authStore.js` | Global app state (auth, user) |
| **API** | `services/apiClient.js` | HTTP requests & interceptors |
| **Components** | `components/` & `views/` | UI & pages |
| **Layout** | `layouts/` | Page structure (header/footer) |

---

## 💡 Pro Tips

1. Use `@/` for imports instead of relative paths
2. Check network tab for API errors
3. Use `v-if` for auth checks, not `v-show`
4. Keep components small and reusable
5. Use store for data, not props (for global data)
6. Always handle loading and error states
7. Test login flow first after backend changes

---

## 📞 Quick Links

- **Vue Docs**: https://vuejs.org/
- **Pinia Docs**: https://pinia.vuejs.org/
- **Tailwind Docs**: https://tailwindcss.com/
- **Axios Docs**: https://axios-http.com/

---

**Last Updated**: April 2026  
**Status**: Ready for backend integration

