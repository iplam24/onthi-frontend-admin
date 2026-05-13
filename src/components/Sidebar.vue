<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronDown, LayoutDashboard, BookOpenText, Layers3, HelpCircle, ClipboardList, TimerReset, Users } from 'lucide-vue-next'

const route = useRoute()
const isLearningOpen = ref(true)

const navItems = [
  {
    label: 'Dashboard',
    description: 'Tổng quan hệ thống',
    to: '/',
    icon: LayoutDashboard
  },
  {
    label: 'Câu hỏi',
    description: 'Tạo câu hỏi theo topic',
    to: '/questions',
    icon: HelpCircle
  },
  {
	label: 'Đề thi',
	description: 'Quản lý đề thi',
	to: '/exams',
	icon: ClipboardList
  },
  {
	label: 'Countdown',
	description: 'Đếm ngày tới kỳ thi',
	to: '/countdowns',
	icon: TimerReset
  },
  {
    label: 'Người dùng',
    description: 'Quản lý tài khoản & số dư',
    to: '/users',
    icon: Users
  }
]

const learningItems = [
  {
	label: 'Cấp độ',
    description: 'Tạo level trước',
    to: '/levels',
    icon: Layers3
  },
  {
    label: 'Môn học',
    description: 'Gán môn vào level',
    to: '/subjects',
    alias: ['/materials'],
    icon: BookOpenText
  },
  {
	label: 'Chủ đề',
    description: 'Gán topic vào môn',
    to: '/topics',
    icon: Layers3
  }
]

const currentLabel = computed(() => {
  const allItems = [...navItems, ...learningItems]
  return allItems.find(item => [item.to, ...(item.alias || [])].includes(route.path))?.label || 'Dashboard'
})

const isLearningRoute = computed(() => learningItems.some(item => [item.to, ...(item.alias || [])].includes(route.path)))

if (isLearningRoute.value) {
  isLearningOpen.value = true
}
</script>

<template>
  <aside class="flex flex-col">
    <div class="h-full flex flex-col">
      <!-- Admin Branding -->
      <div class="px-6 py-8">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <LayoutDashboard class="h-6 w-6" />
          </div>
          <div>
            <p class="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary">Core Admin</p>
            <h2 class="text-xl font-bold text-foreground tracking-tight">{{ currentLabel }}</h2>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto px-4 pb-6 scrollbar-hide">
        <div class="space-y-1.5">
          <RouterLink
            v-for="(item, index) in navItems"
            :key="item.to"
            :to="item.to"
            class="group relative flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/5"
            :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']"
            active-class="bg-primary shadow-lg shadow-primary/40 !text-white"
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
            <div class="min-w-0">
              <p class="font-bold text-sm leading-none">{{ item.label }}</p>
              <p class="mt-1 text-[11px] font-medium opacity-70 group-hover:opacity-100 line-clamp-1" 
                 :class="{ 'text-white/80': route.path === item.to }">
                {{ item.description }}
              </p>
            </div>
            <!-- Active Indicator Pill -->
            <div v-if="route.path === item.to" class="absolute left-0 h-6 w-1.5 rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </RouterLink>
        </div>

        <div class="mt-8 px-4 mb-4">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Học liệu & Hệ thống</p>
        </div>

        <div class="space-y-1.5">
          <div class="overflow-hidden rounded-2xl transition-all duration-500" 
               :class="isLearningOpen ? 'bg-white/30 dark:bg-black/20 ring-1 ring-white/20' : ''">
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-4 text-left transition-all hover:bg-white/40 dark:hover:bg-white/5"
              @click="isLearningOpen = !isLearningOpen"
            >
              <div class="flex items-center gap-4">
                <BookOpenText class="h-5 w-5 text-primary" />
                <span class="font-bold text-sm">Quản lý Học liệu</span>
              </div>
              <ChevronDown class="h-4 w-4 transition-transform duration-500" :class="{ 'rotate-180': isLearningOpen }" />
            </button>

            <div v-show="isLearningOpen" class="px-2 pb-2 space-y-1 animate-in fade-in zoom-in-95 duration-300">
              <RouterLink
                v-for="item in learningItems"
                :key="item.to"
                :to="item.to"
                class="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/10"
                active-class="!bg-primary/10 !text-primary ring-1 ring-primary/20"
              >
                <component :is="item.icon" class="h-4 w-4 shrink-0" />
                <div class="min-w-0">
                  <p class="text-xs font-bold">{{ item.label }}</p>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

