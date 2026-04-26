<script setup>
import { X } from 'lucide-vue-next'

const props = defineProps({
  selectedQuestionsSorted: {
    type: Array,
    default: () => []
  },
  getTopicLabel: {
    type: Function,
    default: () => '—'
  },
  getQuestionSubjectLabel: {
    type: Function,
    default: () => '—'
  }
})

const emit = defineEmits(['clear-all', 'remove-question'])
</script>

<template>
  <div class="rounded-2xl border border-border bg-background/80">
    <div class="border-b border-border px-4 py-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-foreground">Câu hỏi trong đề</h3>
          <p class="text-xs text-muted-foreground">Điều chỉnh thứ tự và điểm cho từng câu hỏi.</p>
        </div>
        <button
          type="button"
          class="rounded-full border border-border px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!selectedQuestionsSorted.length"
          @click="emit('clear-all')"
        >
          Xóa tất cả
        </button>
      </div>
    </div>

    <div class="max-h-[34rem] overflow-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr class="sticky top-0 z-10 border-b border-border bg-background/95 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <th class="px-4 py-3 font-semibold">STT</th>
            <th class="px-4 py-3 font-semibold">Câu hỏi</th>
            <th class="px-4 py-3 font-semibold">Điểm</th>
            <th class="px-4 py-3 font-semibold">Xóa</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!selectedQuestionsSorted.length">
            <td colspan="4" class="px-4 py-10 text-center text-sm text-muted-foreground">
              Chưa chọn câu hỏi nào.
            </td>
          </tr>
          <tr
            v-for="question in selectedQuestionsSorted"
            :key="question.questionId"
            class="border-b border-border/60 last:border-b-0 hover:bg-muted/30"
          >
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <input
                v-model.number="question.orderIndex"
                type="number"
                min="1"
                step="1"
                class="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </td>
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <div class="space-y-1">
                <p class="font-medium">{{ question.questionContent || question.content || question.contentSnapshot || '—' }}</p>
                <p class="text-xs text-muted-foreground">{{ getTopicLabel(question) }} · {{ getQuestionSubjectLabel(question) }}</p>
              </div>
            </td>
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <input
                v-model.number="question.score"
                type="number"
                min="0"
                step="0.1"
                class="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </td>
            <td class="px-4 py-4 align-top">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                @click="emit('remove-question', question.questionId)"
              >
                <X class="h-4 w-4" />
                Xóa
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

