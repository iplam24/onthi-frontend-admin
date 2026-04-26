<template>
  <div class="app-shell flex min-h-screen items-center justify-center px-4 py-10">
    <div class="w-full max-w-md space-y-6">
      <div class="text-center">
        <div class="app-kicker mx-auto w-fit">Admin Panel</div>
        <h1 class="mt-4 text-3xl font-black tracking-tight text-foreground">Đăng nhập hệ thống</h1>
        <p class="mt-2 text-sm text-muted-foreground">Quản lý dashboard, học liệu, câu hỏi và đề thi</p>
      </div>

      <div class="app-surface p-1">
        <div class="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <h2 class="text-lg font-semibold text-foreground">Đăng nhập</h2>
          <p class="mt-1 text-sm text-muted-foreground">Nhập tài khoản quản trị để tiếp tục.</p>
          <div class="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>

      <div class="text-center text-sm text-muted-foreground">
        <p>Admin system © 2026</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import LoginForm from '@/components/LoginForm.vue'
</script>

