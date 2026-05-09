<template>
  <div class="app-page">
    <div class="space-y-8">
      <!-- Welcome Section -->
      <section class="app-surface p-8 shadow-2xl overflow-hidden relative group">
        <div class="relative z-10">
          <div class="app-kicker">Hệ thống Quản trị</div>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Tổng quan Dashboard</h1>
          <p class="mt-2 text-muted-foreground font-medium max-w-2xl">Theo dõi số liệu thực tế, sự phát triển của nội dung học liệu và tương tác của người dùng trên toàn bộ nền tảng.</p>
        </div>
        
        <!-- Decorative element -->
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-all duration-700 group-hover:scale-125"></div>
      </section>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <p class="text-sm font-bold text-muted-foreground">Đang tổng hợp dữ liệu...</p>
      </div>

      <!-- Error State -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMessage }}
      </div>

      <!-- Stats Grid -->
      <div v-if="!isLoading && !errorMessage" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(val, key, index) in dashboardCards" :key="key" 
             class="app-surface p-6 hover:scale-[1.02] active:scale-95 transition-all cursor-default"
             :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{{ val.label }}</p>
              <div class="mt-2 flex items-baseline gap-1">
                <p class="text-3xl font-black text-foreground">{{ stats[key] }}</p>
              </div>
            </div>
            <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <component :is="val.icon" class="h-5 w-5" />
            </div>
          </div>
          <div v-if="val.sub" class="mt-4 flex items-center gap-2">
            <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              +{{ stats[val.sub] }} hôm nay
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { statisticsAPI } from '@/services/api'
import { Users, FileText, ClipboardList, PlayCircle, BookOpen, Layers, Bookmark } from 'lucide-vue-next'

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

const dashboardCards = {
  totalUsers: { label: 'Người dùng', icon: Users, sub: 'newUsersToday' },
  totalQuestions: { label: 'Câu hỏi', icon: FileText },
  totalExams: { label: 'Đề thi', icon: ClipboardList },
  totalAttempts: { label: 'Lượt thi', icon: PlayCircle },
  totalSubjects: { label: 'Môn học', icon: BookOpen },
  totalLevels: { label: 'Cấp độ', icon: Layers },
  totalTopics: { label: 'Chủ đề', icon: Bookmark }
}

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
