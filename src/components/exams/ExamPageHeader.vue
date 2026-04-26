<script setup>
import { RefreshCw, Plus } from 'lucide-vue-next'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  },
  totalElements: {
    type: Number,
    default: 0
  },
  activeExamCount: {
    type: Number,
    default: 0
  },
  filteredExamLabel: {
    type: String,
    default: 'Tất cả môn học'
  },
  page: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['refresh', 'create'])
</script>

<template>
  <section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div class="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Học liệu · Đề thi
        </div>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Quản lý Đề thi</h1>
        <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
          Danh sách đề thi, lọc theo môn học, xem chi tiết, chỉnh sửa, xoá và chọn danh sách câu hỏi cho từng đề.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted"
          :disabled="isLoading"
          @click="emit('refresh')"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
          Làm mới
        </button>

        <button
          class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          @click="emit('create')"
        >
          <Plus class="h-4 w-4" />
          Thêm đề thi
        </button>
      </div>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tổng đề thi</p>
        <p class="mt-2 text-3xl font-black text-foreground">{{ totalElements }}</p>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Đang bật</p>
        <p class="mt-2 text-3xl font-black text-foreground">{{ activeExamCount }}</p>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Môn đang xem</p>
        <p class="mt-2 text-lg font-bold text-foreground">{{ filteredExamLabel }}</p>
      </div>
      <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trang hiện tại</p>
        <p class="mt-2 text-3xl font-black text-foreground">{{ page + 1 }}</p>
      </div>
    </div>
  </section>
</template>

