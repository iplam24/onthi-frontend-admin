<template>
  <header class="w-full px-6 py-4">
    <div class="app-surface !overflow-visible mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 py-2 shadow-xl border-white/20 dark:border-white/5">
      <div class="flex items-center gap-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white shadow-md">
          <span class="text-lg font-black italic">V</span>
        </div>
        <div class="hidden sm:block">
          <p class="text-sm font-bold text-foreground">
            {{ authStore.isAuthenticated ? 'Chào, ' + authStore.userName : 'Admin Panel' }}
          </p>
          <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Dashboard & Control</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="authStore.isAuthenticated" class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="group flex items-center gap-3 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 px-3 py-1.5 transition-all hover:bg-white/60 dark:hover:bg-white/10"
          >
            <div class="h-8 w-8 overflow-hidden rounded-xl bg-primary/20 p-0.5">
              <div class="grid h-full w-full place-items-center rounded-lg bg-primary text-xs font-black text-white">
                {{ (authStore.userName || 'A').slice(0, 1).toUpperCase() }}
              </div>
            </div>
            <div class="hidden text-left md:block">
              <p class="text-xs font-bold leading-none text-foreground">{{ authStore.userName }}</p>
              <p class="mt-1 text-[10px] font-medium text-muted-foreground uppercase">Administrator</p>
            </div>
            <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform duration-300" :class="{ 'rotate-180': showUserMenu }" />
          </button>

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-2"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-2"
          >
            <div
              v-if="showUserMenu"
              class="app-surface absolute right-0 mt-3 w-56 p-2 shadow-2xl !bg-white/95 dark:!bg-black/95"
            >
              <div class="px-3 py-3 border-b border-border/50 mb-1">
                <p class="text-xs font-bold text-foreground">{{ authStore.userName }}</p>
                <p class="text-[10px] text-muted-foreground truncate">admin@edu-system.com</p>
              </div>
              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Đăng xuất
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const showUserMenu = ref(false)

const handleLogout = () => {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>