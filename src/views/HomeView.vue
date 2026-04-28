<script setup>
import { onMounted, ref } from 'vue'
import { statisticsAPI } from '@/services/api'

const stats = ref({
  totalUsers: 0,
  newUsersToday: 0,
  totalQuestions: 0,
  totalExams: 0,
  totalAttempts: 0,
  totalSubjects: 0,
  totalLevels: 0,
  totalTopics: 0
})
const isLoading = ref(false)
const errorMessage = ref('')

async function loadStats() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await statisticsAPI.getDashboardStats()
    stats.value = response.data?.data || {}
  } catch (error) {
    errorMessage.value = 'Không tải được dữ liệu thống kê.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
      <p class="mt-2 text-muted-foreground">Tổng quan về hệ thống.</p>
    </section>

    <div v-if="isLoading" class="text-center text-muted-foreground">
      Đang tải dữ liệu...
    </div>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div v-if="!isLoading && !errorMessage" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng người dùng</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalUsers }}</p>
        <p class="text-xs text-muted-foreground">+{{ stats.newUsersToday }} hôm nay</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng số câu hỏi</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalQuestions }}</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng số đề thi</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalExams }}</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng lượt thi</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalAttempts }}</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng môn học</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalSubjects }}</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng cấp độ</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalLevels }}</p>
      </div>
      <div class="rounded-xl border bg-card p-4">
        <h3 class="text-sm font-medium text-muted-foreground">Tổng chủ đề</h3>
        <p class="mt-2 text-2xl font-bold">{{ stats.totalTopics }}</p>
      </div>
    </div>
  </div>
</template>
