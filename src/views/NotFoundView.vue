<script setup>
import { useRouter } from 'vue-router'
import { AlertCircle, HelpCircle, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen w-full bg-background flex items-center justify-center p-6 relative overflow-hidden">
    <!-- Decorative background elements -->
    <div class="pointer-events-none absolute inset-0 -z-10 bg-background">
      <div class="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-cyan-500/5"></div>
      <div class="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse"></div>
      <div class="absolute -left-40 -bottom-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse"></div>
    </div>

    <!-- Centered Glassmorphic Card -->
    <div class="app-surface !overflow-visible w-full max-w-lg p-12 text-center shadow-[0_32px_128px_rgba(124,58,237,0.12)] border-white/10">
      <div class="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 mx-auto mb-8 shadow-lg">
        <HelpCircle class="h-12 w-12 text-primary" />
        <span class="absolute -right-2 -bottom-2 h-7 w-7 rounded-xl bg-destructive border border-white/10 flex items-center justify-center text-white shadow-md animate-bounce">
          <AlertCircle class="h-4 w-4" />
        </span>
      </div>

      <h1 class="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-600 to-cyan-500 mb-4 select-none drop-shadow-sm">404</h1>
      
      <h2 class="text-2xl font-black text-foreground tracking-tight mb-3">Trang không tìm thấy</h2>
      
      <p class="text-sm text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto mb-10">
        Xin lỗi, đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di chuyển sang vị trí khác trong hệ thống.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button 
          @click="goHome" 
          class="app-btn-primary !w-full sm:!w-auto !px-8 !py-3.5 flex items-center justify-center gap-2 group"
        >
          <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Quay lại Trang chủ
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.2; }
}
</style>
