<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const authStore = useAuthStore()
const router = useRouter()
const showUserMenu = ref(false)

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-border/60 bg-background/75 backdrop-blur-xl">
    <div class="container flex h-16 items-center justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-foreground">
          {{ authStore.isAuthenticated ? 'Xin chào, ' + authStore.userName : 'Admin Panel' }}
        </p>
        <p class="text-xs text-muted-foreground">Quản trị dashboard và học liệu</p>
      </div>

      <div class="flex items-center space-x-1">
        <div v-if="authStore.isAuthenticated" class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-background"
          >
            <span class="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{{ (authStore.userName || 'A').slice(0, 1).toUpperCase() }}</span>
            <span class="font-medium text-foreground">{{ authStore.userName }}</span>
            <svg
              class="h-4 w-4 text-muted-foreground transition-transform"
              :class="{ 'rotate-180': showUserMenu }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>

          <div
            v-if="showUserMenu"
            class="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-border/70 bg-card/95 py-2 shadow-xl backdrop-blur-xl"
          >
            <button
              @click="handleLogout"
              class="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>