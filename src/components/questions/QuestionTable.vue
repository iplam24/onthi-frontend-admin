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
  <div class="app-surface shadow-xl overflow-hidden flex flex-col">
    <div class="border-b border-border/50 bg-secondary/10 px-8 py-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-xl font-bold text-foreground">Danh sách câu hỏi</h2>
          <p class="mt-1 text-sm text-muted-foreground font-medium">
            Hiển thị <span class="text-primary font-bold">{{ pagination.numberOfElements }}</span> / {{ pagination.totalElements }} câu hỏi
            <span v-if="pagination.totalPages > 1"> — Trang {{ pagination.page + 1 }}/{{ pagination.totalPages }}</span>
          </p>
        </div>

        <div v-if="isLoading" class="app-kicker !bg-primary/20">
          <Loader2 class="h-3.5 w-3.5 animate-spin mr-2" />
          Đang cập nhật...
        </div>
      </div>
    </div>

    <div class="overflow-x-auto custom-scrollbar">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-secondary/5 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 backdrop-blur-md border-b border-border/40">
            <th class="px-8 py-4">Nội dung</th>
            <th class="px-6 py-4">Học liệu</th>
            <th class="px-6 py-4 text-center">Ảnh</th>
            <th class="px-6 py-4">Loại</th>
            <th class="px-6 py-4">Độ khó</th>
            <th class="px-6 py-4 text-center">Đáp án</th>
            <th class="px-8 py-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/30">
          <tr v-if="isLoading && !renderedQuestions.length" v-for="row in 4" :key="`skeleton-${row}`">
            <td class="px-8 py-6"><div class="h-4 w-56 animate-pulse rounded-full bg-muted/40"></div></td>
            <td class="px-6 py-6"><div class="h-3 w-40 animate-pulse rounded-full bg-muted/40"></div></td>
            <td class="px-6 py-6 flex justify-center"><div class="h-10 w-10 animate-pulse rounded-xl bg-muted/40"></div></td>
            <td class="px-6 py-6"><div class="h-4 w-20 animate-pulse rounded-full bg-muted/40"></div></td>
            <td class="px-6 py-6"><div class="h-4 w-16 animate-pulse rounded-full bg-muted/40"></div></td>
            <td class="px-6 py-6 text-center"><div class="h-4 w-8 animate-pulse rounded-full bg-muted/40 mx-auto"></div></td>
            <td class="px-8 py-6"><div class="h-8 w-32 animate-pulse rounded-full bg-muted/40 ml-auto"></div></td>
          </tr>
          <tr v-else-if="!hasQuestions">
            <td colspan="7" class="px-8 py-20 text-center">
              <div class="flex flex-col items-center gap-3 opacity-40">
                <svg class="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                <p class="text-sm font-bold uppercase tracking-widest">Không có dữ liệu câu hỏi</p>
              </div>
            </td>
          </tr>
          <tr v-for="question in renderedQuestions" :key="question.id" class="group transition-all hover:bg-primary/[0.02]">
            <td class="px-8 py-6">
              <div class="space-y-2.5">
                <div class="max-w-2xl text-[14px] leading-relaxed text-foreground/90 font-medium line-clamp-3 group-hover:line-clamp-none transition-all" v-html="question.renderedContent" />
                <span class="app-kicker !px-2 !py-0.5 !text-[9px] !bg-muted/50 !text-muted-foreground border-border/40">
                  {{ question.contentFormatLabel }}
                </span>
              </div>
            </td>
            <td class="px-6 py-6">
              <div class="space-y-1">
                <p class="text-xs font-bold text-foreground">{{ question.topicLabel }}</p>
                <p class="text-[11px] text-muted-foreground font-medium">{{ question.subjectLabel }}</p>
              </div>
            </td>
            <td class="px-6 py-6">
              <div class="flex justify-center">
                <img v-if="question.imageUrl" :src="question.imageUrl" alt="image" class="h-10 w-10 rounded-xl border border-border/50 object-cover shadow-sm group-hover:scale-110 transition-transform" />
                <span v-else class="text-[10px] font-black text-muted-foreground/30">—</span>
              </div>
            </td>
            <td class="px-6 py-6">
              <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold border"
                :class="question.type === 'ESSAY' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'">
                {{ question.renderedTypeLabel }}
              </span>
            </td>
            <td class="px-6 py-6">
              <span class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold border uppercase" 
                :class="{
                  'bg-green-500/10 text-green-600 border-green-500/20': question.difficulty === 'EASY',
                  'bg-amber-500/10 text-amber-600 border-amber-500/20': question.difficulty === 'MEDIUM',
                  'bg-red-500/10 text-red-600 border-red-500/20': question.difficulty === 'HARD'
                }">
                {{ question.difficultyLabel }}
              </span>
            </td>
            <td class="px-6 py-6 text-center">
              <span class="text-sm font-black text-foreground/70">{{ question.optionsCount }}</span>
            </td>
            <td class="px-8 py-6">
              <div class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <button @click="emit('edit', question)" class="p-2 rounded-xl border border-border/50 hover:bg-primary hover:text-white hover:border-primary transition-all">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button @click="emit('delete', question)" class="p-2 rounded-xl border border-border/50 hover:bg-destructive hover:text-white hover:border-destructive transition-all">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-auto flex items-center justify-between border-t border-border/50 bg-secondary/5 px-8 py-5">
      <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Trang {{ pagination.page + 1 }} <span class="mx-2 opacity-30">/</span> {{ pagination.totalPages || 1 }}
      </p>
      <div class="flex items-center gap-3">
        <button
          class="app-btn-secondary !px-5 !py-2 !text-xs disabled:opacity-30"
          :disabled="!pagination.hasPrevious || isLoading"
          @click="emit('prev-page')"
        >
          Trang trước
        </button>
        <button
          class="app-btn-secondary !px-5 !py-2 !text-xs disabled:opacity-30"
          :disabled="!pagination.hasNext || isLoading"
          @click="emit('next-page')"
        >
          Trang sau
        </button>
      </div>
    </div>
  </div>
</template>

