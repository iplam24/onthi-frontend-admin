<template>
  <div class="app-shell">
    <!-- Global Loading Bar -->
    <div 
      v-if="metadataStore.isLoading"
      class="fixed top-0 left-0 right-0 z-[9999] h-1.5 bg-secondary/30 overflow-hidden pointer-events-none"
    >
      <div class="h-full bg-gradient-to-r from-primary via-violet-600 to-cyan-500 animate-shimmer-fast"></div>
    </div>

    <!-- Simplified Background -->
    <div class="pointer-events-none fixed inset-0 -z-10 bg-background">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-cyan-500/5"></div>
    </div>

    <div v-if="isBlankLayout" class="flex min-h-screen flex-col overflow-y-auto">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>

    <div v-else class="app-main-container">
      <!-- Desktop Sidebar -->
      <Sidebar class="app-sidebar-fixed" />

      <!-- Mobile Sidebar Drawer Overlay -->
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="isMobileSidebarOpen"
          class="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm lg:hidden"
          @click="isMobileSidebarOpen = false"
        ></div>
      </Transition>

      <!-- Mobile Sidebar Drawer Panel -->
      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-250 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside 
          v-if="isMobileSidebarOpen"
          class="fixed top-0 bottom-0 left-0 z-[100] w-80 bg-zinc-50 dark:bg-zinc-950 border-r border-border/40 shadow-2xl lg:hidden flex flex-col"
        >
          <div class="h-full relative flex flex-col overflow-hidden">
            <!-- Close button -->
            <button 
              @click="isMobileSidebarOpen = false"
              class="absolute top-6 right-6 p-2 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-border/40 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-md transition-all active:scale-95 z-50"
            >
              <X class="h-4 w-4 text-foreground" />
            </button>
            <Sidebar class="flex-1 overflow-hidden" />
          </div>
        </aside>
      </Transition>

      <div class="flex flex-1 flex-col overflow-hidden relative">
        <Header 
          class="shrink-0 z-50 sticky top-0" 
          @toggle-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
        />
        <main class="app-main-content custom-scrollbar">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
          <Footer />
        </main>
      </div>
    </div>
    
    <!-- Global Toast Notifications -->
    <ToastList />
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useMetadataStore } from '@/stores/metadataStore'
import { X } from 'lucide-vue-next'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Sidebar from '@/components/Sidebar.vue'
import ToastList from '@/components/ui/ToastList.vue'

const route = useRoute()
const authStore = useAuthStore()
const metadataStore = useMetadataStore()

const isMobileSidebarOpen = ref(false)

// Close mobile sidebar on route change
watch(() => route.path, () => {
  isMobileSidebarOpen.value = false
})

// Check if current route should use blank layout (login page)
const isBlankLayout = computed(() => route.meta.layout === 'blank')

// Initialize app data on mount
onMounted(async () => {
  authStore.restoreSession()
  await metadataStore.fetchAll()
})
</script>