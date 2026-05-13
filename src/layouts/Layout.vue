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
      <Sidebar class="app-sidebar-fixed" />
      <div class="flex flex-1 flex-col overflow-hidden relative">
        <Header class="shrink-0 z-50 sticky top-0" />
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
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useMetadataStore } from '@/stores/metadataStore'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const authStore = useAuthStore()
const metadataStore = useMetadataStore()

// Check if current route should use blank layout (login page)
const isBlankLayout = computed(() => route.meta.layout === 'blank')

// Initialize app data on mount
onMounted(async () => {
  authStore.restoreSession()
  await metadataStore.fetchAll()
})
</script>