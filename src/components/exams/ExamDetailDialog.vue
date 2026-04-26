<script setup>
import { computed } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  selectedExam: {
    type: Object,
    default: null
  },
  getSubjectName: {
    type: Function,
    default: () => '—'
  },
  getTypeLabel: {
    type: Function,
    default: () => '—'
  },
  getActiveLabel: {
    type: Function,
    default: () => '—'
  },
  formatDateTime: {
    type: Function,
    default: value => value || '—'
  }
})

const emit = defineEmits(['close'])

const safeExam = computed(() => ({
  ...props.selectedExam,
  questions: Array.isArray(props.selectedExam?.questions) ? props.selectedExam.questions : []
}))
</script>

<template>
  <BaseDialog
    :open="open"
    title="Chi tiết đề thi"
    description="Xem đầy đủ thông tin cấu hình và danh sách câu hỏi của đề thi."
    size="lg"
    @close="emit('close')"
  >
    <div v-if="selectedExam" class="max-h-[78vh] space-y-6 overflow-y-auto pr-1">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tên đề</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.title }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Môn học</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ getSubjectName(safeExam.subjectId, safeExam.subjectName) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Loại</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ getTypeLabel(safeExam.type) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trạng thái</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ getActiveLabel(safeExam.isActive) }}</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Thời lượng</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.duration }} phút</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bắt đầu</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ formatDateTime(safeExam.startTime) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Kết thúc</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ formatDateTime(safeExam.endTime) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Số lần làm</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.maxAttempts }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tổng điểm</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.totalScore }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Số câu hỏi</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.questions.length }}</p>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Người tạo</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ safeExam.createdByUsername || '—' }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Tạo lúc</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ formatDateTime(safeExam.createdAt) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Cập nhật</p>
          <p class="mt-2 text-base font-semibold text-foreground">{{ formatDateTime(safeExam.updatedAt) }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trộn câu hỏi / đáp án</p>
          <p class="mt-2 text-base font-semibold text-foreground">
            {{ safeExam.shuffleQuestions ? 'Có' : 'Không' }} / {{ safeExam.shuffleAnswers ? 'Có' : 'Không' }}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-border bg-background/80">
        <div class="border-b border-border px-4 py-4">
          <h3 class="text-base font-semibold text-foreground">Danh sách câu hỏi</h3>
        </div>
        <div class="max-h-[26rem] overflow-auto">
          <table class="min-w-full border-separate border-spacing-0">
            <thead>
              <tr class="border-b border-border bg-background/95 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <th class="px-4 py-3 font-semibold">STT</th>
                <th class="px-4 py-3 font-semibold">Câu hỏi</th>
                <th class="px-4 py-3 font-semibold">Điểm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!safeExam.questions.length">
                <td colspan="3" class="px-4 py-10 text-center text-sm text-muted-foreground">
                  Đề thi chưa có câu hỏi.
                </td>
              </tr>
              <tr v-for="question in safeExam.questions" :key="`${question.questionId}-${question.orderIndex}`" class="border-b border-border/60 last:border-b-0">
                <td class="px-4 py-4 align-top text-sm text-foreground">{{ question.orderIndex }}</td>
                <td class="px-4 py-4 align-top text-sm text-foreground">
                  <p class="font-medium">{{ question.questionContent || question.content || question.contentSnapshot || '—' }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">Question ID: {{ question.questionId }}</p>
                </td>
                <td class="px-4 py-4 align-top text-sm text-foreground">{{ question.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex items-center justify-end pt-2">
        <button class="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted" @click="emit('close')">
          Đóng
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

