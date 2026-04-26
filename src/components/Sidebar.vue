<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronDown, LayoutDashboard, BookOpenText, Layers3, HelpCircle, ClipboardList } from 'lucide-vue-next'

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
  <aside class="border-b border-border/60 bg-card/75 backdrop-blur-xl lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-80 lg:border-b-0 lg:border-r">
	<div class="flex items-center justify-between border-b border-border/60 px-4 py-4 lg:px-6">
	  <div>
		<p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Admin Panel</p>
		<h2 class="mt-1 text-lg font-semibold text-foreground">{{ currentLabel }}</h2>
	  </div>
	</div>

	<nav class="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-1 lg:p-5">
	  <RouterLink
		v-for="item in navItems"
		:key="item.to"
		:to="item.to"
		class="group rounded-2xl border border-border/70 bg-background/80 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
		active-class="border-primary/30 bg-primary/10 text-primary shadow-sm"
		exact-active-class="border-primary/30 bg-primary/10 text-primary shadow-sm"
	  >
		<div class="flex items-start gap-3">
		  <component :is="item.icon" class="mt-0.5 h-5 w-5 shrink-0" />
		  <div class="min-w-0">
			<p class="font-medium">{{ item.label }}</p>
			<p class="mt-1 text-sm text-muted-foreground group-hover:text-foreground">{{ item.description }}</p>
		  </div>
		</div>
	  </RouterLink>

	  <div class="overflow-hidden rounded-2xl border border-border/70 bg-background/80">
		<button
		  type="button"
		  class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
		  :class="{ 'text-primary': isLearningRoute }"
		  @click="isLearningOpen = !isLearningOpen"
		>
		  <div>
			<p class="font-medium">Học liệu</p>
			<p class="mt-1 text-sm text-muted-foreground">Cấp độ, môn học, chủ đề</p>
		  </div>
		  <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': isLearningOpen }" />
		</button>

		<div v-show="isLearningOpen" class="border-t border-border/60 p-2">
		  <RouterLink
			v-for="item in learningItems"
			:key="item.to"
			:to="item.to"
			class="group mb-2 block rounded-xl border border-border/70 bg-card/80 px-3 py-2 transition-all last:mb-0 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5"
			active-class="border-primary/30 bg-primary/10 text-primary shadow-sm"
			exact-active-class="border-primary/30 bg-primary/10 text-primary shadow-sm"
		  >
			<div class="flex items-start gap-3">
			  <component :is="item.icon" class="mt-0.5 h-4 w-4 shrink-0" />
			  <div class="min-w-0">
				<p class="text-sm font-medium">{{ item.label }}</p>
				<p class="mt-1 text-xs text-muted-foreground group-hover:text-foreground">{{ item.description }}</p>
			  </div>
			</div>
		  </RouterLink>
		</div>
	  </div>
	</nav>
  </aside>
</template>

