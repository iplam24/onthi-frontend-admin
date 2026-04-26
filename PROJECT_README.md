# 🎓 Admin Frontend - Vue 3 + Vite

Admin management system built with Vue 3, Vite, Pinia, and Tailwind CSS.

## ✨ Features

- ✅ Authentication system (JWT-based)
- ✅ Responsive design with Tailwind CSS
- ✅ State management with Pinia
- ✅ API client with axios + interceptors
- ✅ Router with protected routes
- ✅ Dark mode support (CSS variables)
- ✅ Clean component architecture
- ✅ LocalStorage session persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19.0 or later
- npm or yarn

### Installation

```bash
# 1. Clone or navigate to project
cd adminfe

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build

# Preview build
npm run preview
```

## 📋 Project Structure

```
src/
├── components/        # Reusable Vue components
├── layouts/          # Layout components (Header, Footer)
├── views/            # Page components
├── router/           # Vue Router configuration
├── stores/           # Pinia stores (state management)
├── services/         # API services & axios config
├── assets/           # Images, fonts, styles
└── constants.js      # App constants & config
```

See [STRUCTURE.md](./STRUCTURE.md) for detailed structure documentation.

## 🔐 Authentication

The app uses JWT-based authentication:

1. User logs in with username/password
2. Backend returns `access_token`
3. Token is stored in localStorage
4. Token is automatically sent with every API request
5. If token expires (401 response), user is logged out

### Login Flow

```
POST /api/auth/login
{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Admin User"
  }
}
```

## 🛣️ Routes

| Route | Description | Auth Required |
|-------|-------------|---|
| `/login` | Login page | ❌ |
| `/` | Dashboard/Home | ✅ |
| `/subjects` | Subjects management | ✅ |

Protected routes automatically redirect to `/login` if user is not authenticated.

## 🎨 Styling

The project uses **Tailwind CSS** with custom theme:

- Colors defined as CSS variables in `src/assets/main.css`
- Dark mode support
- Responsive utilities
- Component utilities

### Available Color Classes

```html
<!-- Primary -->
<div class="bg-primary text-primary-foreground">Primary</div>

<!-- Background -->
<div class="bg-background text-foreground">Background</div>

<!-- Border -->
<div class="border border-border">Bordered</div>

<!-- Muted -->
<div class="text-muted-foreground">Muted text</div>

<!-- Destructive (Error/Danger) -->
<button class="bg-destructive text-destructive-foreground">Delete</button>
```

## 📦 Dependencies

### Core
- **vue** (^3.4.29) - Progressive JavaScript framework
- **vue-router** (^4.3.3) - Official router for Vue
- **pinia** (^2.1.7) - State management

### UI & Styling
- **tailwindcss** (^3.4.4) - Utility-first CSS framework
- **radix-vue** (^1.8.2) - Headless UI components
- **lucide-vue-next** (^0.395.0) - Icon library
- **@fortawesome/vue-fontawesome** - FontAwesome icons

### HTTP
- **axios** (^1.7.2) - Promise-based HTTP client

### Build Tools
- **vite** (^5.2.0) - Next generation frontend tooling
- **@vitejs/plugin-vue** - Vue 3 support for Vite

See [package.json](./package.json) for complete dependency list.

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
VITE_API_URL=/api
```

### Vite Configuration

- Alias `@` points to `src/` directory
- Proxy `/api` requests to backend (default: `http://localhost:8080`)

Edit `vite.config.js` to change backend URL.

## 🎯 Common Tasks

### Add a New Page

1. Create view component:
   ```bash
   # src/views/MyPageView.vue
   <template>
     <div>My Page</div>
   </template>

   <script setup>
   </script>
   ```

2. Add route in `src/router/index.js`:
   ```javascript
   {
     path: '/my-page',
     name: 'MyPage',
     component: () => import('../views/MyPageView.vue'),
     meta: { requiresAuth: true }
   }
   ```

3. Add navigation link in `src/layouts/Header.vue`

### Add a New Component

1. Create component:
   ```bash
   # src/components/MyComponent.vue
   <template>
     <div>My Component</div>
   </template>

   <script setup>
   </script>
   ```

2. Import and use in page/layout:
   ```vue
   <script setup>
   import MyComponent from '@/components/MyComponent.vue'
   </script>

   <template>
     <MyComponent />
   </template>
   ```

### Use Auth Store

```vue
<script setup>
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Check if authenticated
if (authStore.isAuthenticated) {
  console.log('User:', authStore.user)
}

// Logout
authStore.logout()
</script>
```

### Make API Call

```vue
<script setup>
import { subjectsAPI } from '@/services/api'

const getSubjects = async () => {
  try {
    const response = await subjectsAPI.getAll()
    console.log(response.data)
  } catch (error) {
    console.error('Failed to fetch subjects:', error)
  }
}
</script>
```

## 🧪 Testing

```bash
# Run tests (when configured)
npm run test
```

## 🐛 Troubleshooting

### Port 5173 Already in Use

```bash
npm run dev -- --port 3000
```

### API Calls Failing

1. Check backend is running at `http://localhost:8080`
2. Check CORS headers are configured on backend
3. Open DevTools → Network tab to inspect requests

### Token Not Being Sent

1. Check localStorage has `auth_token` key
2. Check request headers in Network tab
3. Verify interceptor is working

### Route Not Found (404)

1. Check route is added in `src/router/index.js`
2. Check component file exists
3. Check component is correctly imported

## 📚 Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Axios Documentation](https://axios-http.com/)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 📞 Support

For issues or questions, please contact the development team.

---

**Version**: 0.0.0  
**Last Updated**: April 2026

