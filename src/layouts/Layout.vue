<template>
  <div v-if="isBlankLayout" class="app-shell flex min-h-screen flex-col">
    <RouterView />
  </div>
  <div v-else class="app-shell flex min-h-screen flex-col">
    <Header />
    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <Sidebar />
      <main class="app-main">
        <RouterView />
      </main>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
const authStore = useAuthStore()

// Check if current route should use blank layout (login page)
const isBlankLayout = computed(() => route.meta.layout === 'blank')

// Restore session on app mount
onMounted(() => {
  authStore.restoreSession()
})
</script>