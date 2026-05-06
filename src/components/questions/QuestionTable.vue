<script setup>
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { renderQuestionContent } from '@/utils/questionContent'

const props = defineProps({
  questions: {
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
  }
})

const emit = defineEmits(['prev-page', 'next-page', 'view', 'edit', 'delete'])

const hasQuestions = computed(() => props.questions.length > 0)

const renderedQuestions = computed(() =>
  props.questions.map(question => ({
    ...question,
    renderedContent: renderQuestionContent(question.content, question.contentFormat),
    contentFormatLabel: getContentFormatLabel(question.contentFormat),
    renderedTypeLabel: getQuestionTypeLabel(question.type)
  }))
)

function getQuestionTypeLabel(type) {
  return String(type || '').toUpperCase() === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'
}

function getContentFormatLabel(contentFormat) {
  return String(contentFormat || '').toUpperCase() === 'LATEX' ? 'LaTeX' : 'Văn bản'
}
</script>

<template>
  <div class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
    <div class="border-b border-border/70 bg-gradient-to-r from-background via-background to-muted/30 px-6 py-5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-semibold text-foreground">Danh sách câu hỏi</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Hiển thị {{ pagination.numberOfElements }} / {{ pagination.totalElements }} câu hỏi
            <span v-if="pagination.totalPages > 1"> — Trang {{ pagination.page + 1 }}/{{ pagination.totalPages }}</span>
          </p>
        </div>

        <div v-if="isLoading" class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Loader2 class="h-4 w-4 animate-spin" />
          Đang tải dữ liệu
        </div>
      </div>
    </div>

    <div class="max-h-[32rem] overflow-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr class="sticky top-0 z-10 border-b border-border/70 bg-background/95 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <th class="px-6 py-3 font-semibold">Nội dung</th>
            <th class="px-6 py-3 font-semibold">Học liệu</th>
            <th class="px-6 py-3 font-semibold">Ảnh</th>
            <th class="px-6 py-3 font-semibold">Loại</th>
            <th class="px-6 py-3 font-semibold">Độ khó</th>
            <th class="px-6 py-3 font-semibold">Người tạo</th>
            <th class="px-6 py-3 font-semibold">Số đáp án</th>
            <th class="px-6 py-3 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading" v-for="row in 4" :key="`skeleton-${row}`" class="border-b border-border last:border-b-0">
            <td class="px-6 py-4"><div class="h-4 w-56 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4">
              <div class="space-y-2">
                <div class="h-3 w-40 animate-pulse rounded-full bg-muted"></div>
                <div class="h-3 w-28 animate-pulse rounded-full bg-muted"></div>
                <div class="h-3 w-20 animate-pulse rounded-full bg-muted"></div>
              </div>
            </td>
            <td class="px-6 py-4"><div class="h-12 w-12 animate-pulse rounded-2xl bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-24 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-16 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-20 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-4 w-10 animate-pulse rounded-full bg-muted"></div></td>
            <td class="px-6 py-4"><div class="h-9 w-40 animate-pulse rounded-full bg-muted"></div></td>
          </tr>
          <tr v-else-if="!hasQuestions">
            <td colspan="8" class="px-6 py-10 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu câu hỏi.
            </td>
          </tr>
          <tr v-for="question in renderedQuestions" :key="question.id" class="group border-b border-border/60 last:border-b-0 transition-colors hover:bg-gradient-to-r hover:from-primary/5 hover:to-cyan-500/5">
            <td class="px-6 py-5 text-sm font-medium text-foreground">
              <div class="space-y-2">
                <div class="max-w-[34rem] break-words leading-6" v-html="question.renderedContent" />
                <span class="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {{ question.contentFormatLabel }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-foreground">
              <div class="space-y-1">
                <p class="font-semibold text-foreground">{{ question.topicLabel }}</p>
                <p class="text-xs text-muted-foreground">Môn học: {{ question.subjectLabel }}</p>
                <p class="text-xs text-muted-foreground">Level: {{ question.levelLabel }}</p>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-foreground">
              <img
                v-if="question.imageUrl"
                :src="question.imageUrl"
                alt="question image"
                class="h-12 w-12 rounded-2xl border border-border object-cover shadow-sm"
              />
              <span v-else class="text-muted-foreground">—</span>
            </td>
            <td class="px-6 py-4 text-sm text-foreground">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
                :class="question.type === 'ESSAY'
                  ? 'bg-fuchsia-500/10 text-fuchsia-700 ring-1 ring-fuchsia-500/20 dark:text-fuchsia-300'
                  : 'bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300'"
              >
                {{ question.renderedTypeLabel }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-foreground">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
                :class="question.difficulty === 'HARD'
                  ? 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300'
                  : question.difficulty === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300'
                    : 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300'"
              >
                {{ question.difficultyLabel }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-foreground">{{ question.creatorLabel || '—' }}</td>
            <td class="px-6 py-4 text-sm text-foreground">{{ question.optionsCount }}</td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-2">
                <button class="rounded-full border border-border/80 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5" @click="emit('view', question)">
                  Chi tiết
                </button>
                <button class="rounded-full border border-border/80 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5" @click="emit('edit', question)">
                  Sửa
                </button>
                <button class="rounded-full border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive shadow-sm transition hover:-translate-y-0.5 hover:bg-destructive/10" @click="emit('delete', question)">
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
  </div>
</template>

