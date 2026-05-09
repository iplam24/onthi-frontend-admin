<template>
  <div class="flex min-h-screen items-center justify-center p-6 relative overflow-hidden">
    <!-- Extra login page decorations -->
    <div class="pointer-events-none absolute inset-0 -z-10">
       <div class="absolute -left-[5%] -top-[5%] h-96 w-96 rounded-full bg-primary/30 blur-[100px] animate-pulse"></div>
       <div class="absolute -right-[5%] -bottom-[5%] h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px] animate-pulse stagger-5"></div>
    </div>

    <div class="w-full max-w-lg">
      <div class="text-center mb-10 stagger-1">
        <div class="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 mb-6 border border-primary/20 shadow-inner">
           <div class="h-10 w-10 rounded-xl bg-primary animate-pulse shadow-lg shadow-primary/50"></div>
        </div>
        <div class="app-kicker mx-auto w-fit">V-Edu Management</div>
        <h1 class="mt-4 text-5xl font-black tracking-tight text-foreground lg:text-6xl">Hệ thống Admin</h1>
        <p class="mt-4 text-base text-muted-foreground font-medium">Nền tảng quản lý học liệu và khảo thí trực tuyến thông minh</p>
      </div>

      <div class="app-surface p-1 shadow-2xl stagger-2">
        <div class="rounded-[2rem] border border-border/50 bg-white/70 p-10 backdrop-blur-3xl dark:bg-black/40">
          <div class="mb-8">
            <h2 class="text-2xl font-black text-foreground">Đăng nhập</h2>
            <p class="mt-1 text-sm font-medium text-muted-foreground">Vui lòng cung cấp thông tin quản trị viên để truy cập.</p>
          </div>
          
          <LoginForm />
          
          <div class="mt-8 border-t border-border/40 pt-8 text-center">
             <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Security Protocol Enabled · 256-bit SSL</p>
          </div>
        </div>
      </div>

      <div class="mt-10 text-center text-xs font-bold text-muted-foreground stagger-3">
        <p>© 2026 V-Edu Platform · Toàn quyền bảo lưu</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import LoginForm from '@/components/LoginForm.vue'
</script>

