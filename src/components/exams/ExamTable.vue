<script setup>
import { computed } from 'vue'
import { Eye, Pencil, RefreshCw, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  exams: {
    type: Array,
    default: () => []
  },
  pagination: {
    type: Object,
    default: () => ({})
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  getSubjectName: {
    type: Function,
    default: () => ''
  },
  getTypeLabel: {
    type: Function,
    default: () => ''
  },
  getActiveLabel: {
    type: Function,
    default: () => ''
  },
  formatDateTime: {
    type: Function,
    default: value => value || '—'
  }
})

const emit = defineEmits(['prev-page', 'next-page', 'view', 'edit', 'delete'])

const hasExams = computed(() => props.exams.length > 0)
</script>

<template>
  <section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
    <div class="flex flex-col gap-2 border-b border-border/70 bg-gradient-to-r from-background via-background to-muted/30 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Danh sách đề thi</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Hiển thị {{ pagination.numberOfElements }} / {{ pagination.totalElements }} đề thi
          <span v-if="pagination.totalPages > 1"> — Trang {{ pagination.page + 1 }}/{{ pagination.totalPages }}</span>
        </p>
      </div>

      <div v-if="isLoading" class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
        <RefreshCw class="h-4 w-4 animate-spin" />
        Đang tải dữ liệu
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr class="sticky top-0 z-10 border-b border-border/70 bg-background/95 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <th class="px-6 py-3 font-semibold">Tên đề</th>
            <th class="px-6 py-3 font-semibold">Môn học</th>
            <th class="px-6 py-3 font-semibold">Thời lượng</th>
            <th class="px-6 py-3 font-semibold">Loại</th>
            <th class="px-6 py-3 font-semibold">Trạng thái</th>
            <th class="px-6 py-3 font-semibold">Số câu</th>
            <th class="px-6 py-3 font-semibold">Tổng điểm</th>
            <th class="px-6 py-3 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading" v-for="row in 4" :key="`exam-skeleton-${row}`" class="border-b border-border last:border-b-0">
            <td class="px-6 py-4"><div class="h-4 w-56 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-28 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-20 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-24 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-24 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-12 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-12 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-9 w-44 animate-pulse rounded-full bg-muted"></div></td>
          </tr>

          <tr v-else-if="!hasExams">
            <td colspan="8" class="px-6 py-10 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu đề thi.
            </td>
          </tr>

          <tr
            v-for="exam in exams"
            :key="exam.id"
            class="group border-b border-border/60 last:border-b-0 transition-colors hover:bg-gradient-to-r hover:from-primary/5 hover:to-cyan-500/5"
          >
            <td class="px-6 py-5 align-top text-sm font-medium text-foreground">
              <div class="space-y-1">
                <p class="font-semibold">{{ exam.title }}</p>
                <p class="text-xs text-muted-foreground">Tạo bởi: {{ exam.createdByUsername || '—' }}</p>
                <p class="text-xs text-muted-foreground">Cập nhật: {{ formatDateTime(exam.updatedAt || exam.createdAt) }}</p>
              </div>
            </td>
            <td class="px-6 py-5 align-top text-sm text-foreground">
              <p class="font-semibold">{{ getSubjectName(exam.subjectId, exam.subjectName) }}</p>
              <p class="text-xs text-muted-foreground">ID: {{ exam.subjectId || '—' }}</p>
            </td>
            <td class="px-6 py-5 align-top text-sm text-foreground">
              <span class="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300">
                {{ exam.duration }} phút
              </span>
            </td>
            <td class="px-6 py-5 align-top text-sm text-foreground">
              <span class="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                {{ getTypeLabel(exam.type) }}
              </span>
            </td>
            <td class="px-6 py-5 align-top text-sm text-foreground">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1"
                :class="exam.isActive
                  ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground ring-border'"
              >
                {{ getActiveLabel(exam.isActive) }}
              </span>
            </td>
            <td class="px-6 py-5 align-top text-sm text-foreground">{{ exam.questions?.length ?? 0 }}</td>
            <td class="px-6 py-5 align-top text-sm text-foreground">{{ exam.totalScore }}</td>
            <td class="px-6 py-5 align-top">
              <div class="flex flex-wrap gap-2">
                <button
                  class="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                  @click="emit('view', exam)"
                >
                  <Eye class="h-4 w-4" />
                  Chi tiết
                </button>
                <button
                  class="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5"
                  @click="emit('edit', exam)"
                >
                  <Pencil class="h-4 w-4" />
                  Sửa
                </button>
                <button
                  class="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive shadow-sm transition hover:-translate-y-0.5 hover:bg-destructive/10"
                  @click="emit('delete', exam)"
                >
                  <Trash2 class="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between gap-3 border-t border-border/70 bg-background/60 px-6 py-4 backdrop-blur-xl">
      <p class="text-sm font-medium text-muted-foreground">
        Trang {{ pagination.page + 1 }} / {{ pagination.totalPages || 1 }}
      </p>
      <div class="flex items-center gap-2">
        <button
          class="rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!pagination.hasPrevious || isLoading"
          @click="emit('prev-page')"
        >
          Trang trước
        </button>
        <button
          class="rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!pagination.hasNext || isLoading"
          @click="emit('next-page')"
        >
          Trang sau
        </button>
      </div>
    </div>
  </section>
</template>

