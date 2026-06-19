<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { 
  ChevronDown, 
  ChevronLeft, 
  LayoutDashboard, 
  BookOpenText, 
  Layers3, 
  HelpCircle, 
  ClipboardList, 
  TimerReset, 
  Users,
  Cpu
} from 'lucide-vue-next'

const route = useRoute()
const isLearningOpen = ref(true)

// Local storage persistent collapsed state
const isCollapsed = ref(localStorage.getItem('admin-sidebar-collapsed') === 'true')

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('admin-sidebar-collapsed', isCollapsed.value)
}

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
  },
  {
    label: 'Cấu hình AI',
    description: 'Đổi nguồn & API Key AI',
    to: '/ai-config',
    icon: Cpu
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
  <aside 
    class="relative flex flex-col shrink-0 border-r border-border/40 z-30 transition-all duration-300 h-full select-none"
    :class="isCollapsed ? '!w-[84px]' : 'w-80'"
  >
    <!-- Toggle Collapse Floating Pill Button -->
    <button 
      @click="toggleCollapse"
      class="absolute -right-3 top-8 z-50 h-6 w-6 rounded-full bg-primary hover:bg-violet-600 border border-primary/20 text-white flex items-center justify-center shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
      title="Thu gọn / Mở rộng"
    >
      <ChevronLeft class="h-3.5 w-3.5 transition-transform duration-500" :class="{ 'rotate-180': isCollapsed }" />
    </button>

    <div class="h-full flex flex-col overflow-hidden">
      <!-- Admin Branding Header -->
      <div 
        class="px-4 py-8 shrink-0 flex transition-all duration-300"
        :class="isCollapsed ? 'justify-center px-2' : 'px-6'"
      >
        <div class="flex items-center gap-3 transition-all duration-300" :class="{ 'flex-col': isCollapsed }">
          <div class="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-primary to-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform duration-500 hover:rotate-12">
            <LayoutDashboard class="h-5 w-5" />
          </div>
          <div v-if="!isCollapsed" class="min-w-0 animate-in fade-in duration-300">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary">Core Admin</p>
            <h2 class="text-base font-bold text-foreground tracking-tight mt-0.5">{{ currentLabel }}</h2>
          </div>
        </div>
      </div>

      <!-- Navigation Content -->
      <nav class="flex-1 overflow-y-auto px-3 pb-6 scrollbar-hide flex flex-col gap-1">
        
        <!-- Core Items -->
        <RouterLink
          v-for="(item, index) in navItems"
          :key="item.to"
          :to="item.to"
          class="group relative flex items-center gap-4 rounded-2xl p-3.5 transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/5"
          :class="[
            index % 2 === 0 ? 'stagger-1' : 'stagger-2',
            isCollapsed ? 'justify-center px-0 h-12 w-12 mx-auto' : 'px-4'
          ]"
          active-class="bg-primary shadow-lg shadow-primary/45 !text-white"
          :title="isCollapsed ? item.label : ''"
        >
          <component 
            :is="item.icon" 
            class="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110"
            :class="isCollapsed && route.path !== item.to ? 'text-zinc-500 dark:text-zinc-400 group-hover:text-primary' : ''"
          />
          <div v-if="!isCollapsed" class="min-w-0 animate-in fade-in duration-300">
            <p class="font-bold text-sm leading-none">{{ item.label }}</p>
            <p 
              class="mt-1 text-[11px] font-medium opacity-70 group-hover:opacity-100 line-clamp-1" 
              :class="route.path === item.to ? 'text-white/80' : 'text-muted-foreground'"
            >
              {{ item.description }}
            </p>
          </div>
          
          <!-- Collapsed Neon Glow Backing on Hover -->
          <div v-if="isCollapsed" class="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-sm -z-10 transition-opacity duration-300"></div>

          <!-- Active Indicator Pill -->
          <div 
            v-if="route.path === item.to" 
            class="absolute left-0 rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            :class="isCollapsed ? 'top-1/4 bottom-1/4 w-1' : 'h-6 w-1.5'"
          ></div>
        </RouterLink>

        <!-- Divider -->
        <div class="mt-6 mb-3 shrink-0 flex items-center justify-center" :class="isCollapsed ? 'px-2' : 'px-4'">
          <p v-if="!isCollapsed" class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 w-full animate-in fade-in duration-300">Học liệu & Hệ thống</p>
          <div v-else class="h-[1px] w-8 bg-border/60"></div>
        </div>

        <!-- Learning Items Accordion (Expanded mode only) -->
        <div v-if="!isCollapsed" class="space-y-1.5 animate-in fade-in duration-300">
          <div 
            class="overflow-hidden rounded-2xl transition-all duration-500" 
            :class="isLearningOpen ? 'bg-white/30 dark:bg-black/20 ring-1 ring-white/20' : ''"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between px-4 py-4 text-left transition-all hover:bg-white/40 dark:hover:bg-white/5"
              @click="isLearningOpen = !isLearningOpen"
            >
              <div class="flex items-center gap-4">
                <BookOpenText class="h-5 w-5 text-primary animate-pulse" />
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

        <!-- Learning Items Icons (Collapsed mode only) -->
        <div v-else class="flex flex-col gap-1 animate-in fade-in duration-300">
          <RouterLink
            v-for="item in learningItems"
            :key="item.to"
            :to="item.to"
            class="group relative flex items-center justify-center rounded-2xl p-3.5 transition-all duration-300 hover:bg-white/50 dark:hover:bg-white/5 h-12 w-12 mx-auto"
            active-class="bg-primary shadow-lg shadow-primary/40 !text-white"
            :title="item.label"
          >
            <component 
              :is="item.icon" 
              class="h-5 w-5 shrink-0 transition-all duration-300 group-hover:scale-110"
              :class="route.path !== item.to ? 'text-zinc-500 dark:text-zinc-400 group-hover:text-primary' : ''"
            />
            
            <!-- Collapsed Neon Glow Backing on Hover -->
            <div class="absolute inset-0 rounded-2xl bg-primary/10 opacity-0 group-hover:opacity-100 blur-sm -z-10 transition-opacity duration-300"></div>

            <!-- Active Indicator Pill -->
            <div v-if="route.path === item.to" class="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </RouterLink>
        </div>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
/* Neon glow soft hover effect inside Micro-Dock */
.group:hover component {
  filter: drop-shadow(0 0 5px rgba(139, 92, 246, 0.45));
}

/* Glassmorphism aesthetics for sidebar panel */
aside {
  background: rgba(244, 244, 245, 0.45) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-color: rgba(99, 102, 241, 0.08) !important;
}

.dark aside {
  background: rgba(9, 9, 11, 0.45) !important;
  backdrop-filter: blur(24px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

/* Hide webkit scrollbars completely */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
