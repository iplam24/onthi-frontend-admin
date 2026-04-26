<script setup>
import { computed } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { API_CONFIG } from '@/constants'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  question: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])
const detailQuestion = computed(() => props.question)

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url

  const normalizedPath = String(url).startsWith('/') ? String(url) : `/${url}`
  const apiBase = API_CONFIG.BASE_URL || ''

  if (/^https?:\/\//i.test(apiBase)) {
    return `${new URL(apiBase).origin}${normalizedPath}`
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`
  }

  return normalizedPath
}

function getTypeLabel(type) {
  return String(type || '').toUpperCase() === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'
}

function getDifficultyLabel(difficulty) {
  const labels = {
    EASY: 'Dễ',
    MEDIUM: 'Trung bình',
    HARD: 'Khó'
  }

  return labels[difficulty] || difficulty || '—'
}
</script>

<template>
  <BaseDialog :open="open" title="Chi tiết câu hỏi" description="Xem đầy đủ nội dung, ảnh và đáp án của câu hỏi." size="lg" @close="emit('close')">
    <div v-if="detailQuestion" class="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
      <div class="space-y-2">
        <p class="text-sm font-medium text-muted-foreground">Nội dung</p>
        <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ detailQuestion.content }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Topic</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ detailQuestion.topicName || '—' }}</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Loại</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ getTypeLabel(detailQuestion.type) }}</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Độ khó</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ getDifficultyLabel(detailQuestion.difficulty) }}</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Người tạo</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ detailQuestion.createdByUsername || '—' }}</p>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium text-muted-foreground">Ảnh câu hỏi</p>
        <div class="rounded-xl border border-border bg-background p-3">
          <img
            v-if="resolveMediaUrl(detailQuestion.url)"
            :src="resolveMediaUrl(detailQuestion.url)"
            alt="question detail image"
            class="max-h-64 w-full rounded-lg object-contain"
          />
          <p v-else class="text-sm text-muted-foreground">Không có ảnh</p>
        </div>
      </div>

      <div v-if="detailQuestion.options?.length" class="space-y-2">
        <p class="text-sm font-medium text-muted-foreground">Đáp án</p>
        <div class="space-y-2">
          <div
            v-for="(option, index) in detailQuestion.options"
            :key="option.id || index"
            class="flex items-center justify-between rounded-lg border border-border bg-background p-3"
          >
            <p class="text-foreground">{{ option.content }}</p>
            <span class="rounded-full px-3 py-1 text-xs font-medium" :class="option.isCorrect ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'">
              {{ option.isCorrect ? 'Đúng' : 'Sai' }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Đáp án mẫu</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ detailQuestion.sampleAnswer || '—' }}</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-medium text-muted-foreground">Giải thích</p>
          <p class="rounded-lg border border-border bg-background p-3 text-foreground">{{ detailQuestion.explanation || '—' }}</p>
        </div>
      </div>

      <div class="flex items-center justify-end pt-2">
        <button class="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted" @click="emit('close')">Đóng</button>
      </div>
    </div>
  </BaseDialog>
</template>

