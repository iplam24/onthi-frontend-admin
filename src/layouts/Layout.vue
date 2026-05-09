<template>
  <div class="app-shell min-h-screen overflow-hidden">
    <!-- Background Decorative Blobs -->
    <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div class="animate-float absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]"></div>
      <div class="animate-float stagger-3 absolute -right-[5%] top-[20%] h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[100px]"></div>
      <div class="animate-float stagger-5 absolute bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[150px]"></div>
    </div>

    <div v-if="isBlankLayout" class="flex min-h-screen flex-col">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>
    <div v-else class="flex min-h-screen flex-col">
      <Header />
      <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <Sidebar />
        <main class="app-main">
          <RouterView v-slot="{ Component }">
            <Transition name="page" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </main>
      </div>
      <Footer />
    </div>
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