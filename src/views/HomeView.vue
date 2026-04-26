<template>
  <div class="app-page">
    <section class="app-surface p-6 sm:p-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="app-kicker">Dashboard</div>
          <h1 class="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Trang chủ</h1>
          <p class="mt-2 max-w-2xl text-sm text-muted-foreground">Chào mừng bạn đến với hệ thống quản lý học liệu, câu hỏi và đề thi.</p>
        </div>
      </div>
    </section>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="app-stat-card">
        <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Môn học</h3>
        <p class="mt-3 text-3xl font-black text-primary">0</p>
        <p class="mt-2 text-sm text-muted-foreground">Tổng số môn học</p>
      </div>

      <div class="app-stat-card">
        <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cấp độ</h3>
        <p class="mt-3 text-3xl font-black text-primary">0</p>
        <p class="mt-2 text-sm text-muted-foreground">Tổng số cấp độ</p>
      </div>

      <div class="app-stat-card">
        <h3 class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Câu hỏi</h3>
        <p class="mt-3 text-3xl font-black text-primary">0</p>
        <p class="mt-2 text-sm text-muted-foreground">Tổng số câu hỏi</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

