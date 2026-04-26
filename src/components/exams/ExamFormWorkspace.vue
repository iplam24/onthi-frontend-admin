<script setup>
import { RefreshCw } from 'lucide-vue-next'
import ExamQuestionPoolTable from '@/components/exams/ExamQuestionPoolTable.vue'
import ExamSelectedQuestionsTable from '@/components/exams/ExamSelectedQuestionsTable.vue'

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false
  },
  subjects: {
    type: Array,
    default: () => []
  },
  examTypeOptions: {
    type: Array,
    default: () => []
  },
  formState: {
    type: Object,
    required: true
  },
  selectedQuestionCount: {
    type: Number,
    default: 0
  },
  selectedQuestionTotalScore: {
    type: Number,
    default: 0
  },
  isSaving: {
    type: Boolean,
    default: false
  },
  isQuestionPoolLoading: {
    type: Boolean,
    default: false
  },
  questionPoolError: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  filteredQuestionPool: {
    type: Array,
    default: () => []
  },
  selectedQuestionsSorted: {
    type: Array,
    default: () => []
  },
  questionSearch: {
    type: String,
    default: ''
  },
  getSubjectName: {
    type: Function,
    default: () => ''
  },
  getTopicLabel: {
    type: Function,
    default: () => '—'
  },
  getQuestionSubjectLabel: {
    type: Function,
    default: () => '—'
  },
  getTypeLabel: {
    type: Function,
    default: () => '—'
  },
  getDifficultyLabel: {
    type: Function,
    default: () => '—'
  },
  isQuestionSelected: {
    type: Function,
    default: () => false
  },
  submitText: {
    type: String,
    default: 'Lưu'
  },
  cancelText: {
    type: String,
    default: 'Hủy'
  }
})

const emit = defineEmits([
  'submit',
  'cancel',
  'subject-change',
  'refresh-question-pool',
  'select-all-visible',
  'clear-selected-questions',
  'toggle-question',
  'remove-question',
  'update:questionSearch'
])
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="space-y-2 lg:col-span-2">
        <label for="exam-title" class="text-sm font-medium text-foreground">Tên đề thi</label>
        <input
          id="exam-title"
          v-model="formState.title"
          type="text"
          placeholder="Nhập tên đề thi"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="exam-subject" class="text-sm font-medium text-foreground">Môn học</label>
        <select
          id="exam-subject"
          v-model="formState.subjectId"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          @change="emit('subject-change')"
        >
          <option value="">-- Chọn môn học --</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ getSubjectName(subject.id, subject.name) }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label for="exam-duration" class="text-sm font-medium text-foreground">Thời lượng (phút)</label>
        <input
          id="exam-duration"
          v-model.number="formState.duration"
          type="number"
          min="1"
          step="1"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="exam-start-time" class="text-sm font-medium text-foreground">Thời gian bắt đầu</label>
        <input
          id="exam-start-time"
          v-model="formState.startTime"
          type="datetime-local"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="exam-end-time" class="text-sm font-medium text-foreground">Thời gian kết thúc</label>
        <input
          id="exam-end-time"
          v-model="formState.endTime"
          type="datetime-local"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="exam-type" class="text-sm font-medium text-foreground">Loại đề</label>
        <select
          id="exam-type"
          v-model="formState.type"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <option v-for="option in examTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="grid gap-3 sm:grid-cols-3 lg:col-span-2">
        <label class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
          <input v-model="formState.isActive" type="checkbox" class="h-4 w-4" />
          Đang kích hoạt
        </label>
        <label class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
          <input v-model="formState.shuffleQuestions" type="checkbox" class="h-4 w-4" />
          Trộn câu hỏi
        </label>
        <label class="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
          <input v-model="formState.shuffleAnswers" type="checkbox" class="h-4 w-4" />
          Trộn đáp án
        </label>
      </div>

      <div class="space-y-2">
        <label for="exam-max-attempts" class="text-sm font-medium text-foreground">Số lần làm tối đa</label>
        <input
          id="exam-max-attempts"
          v-model.number="formState.maxAttempts"
          type="number"
          min="1"
          step="1"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="rounded-xl border border-border bg-muted/30 p-4 lg:col-span-2">
        <div class="flex flex-wrap items-center gap-3 text-sm text-foreground">
          <span class="font-semibold">Câu hỏi đã chọn:</span>
          <span>{{ selectedQuestionCount }} câu</span>
          <span>·</span>
          <span>Tổng điểm: {{ selectedQuestionTotalScore }}</span>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ExamQuestionPoolTable
        :subject-id="formState.subjectId"
        :question-search="questionSearch"
        :filtered-question-pool="filteredQuestionPool"
        :is-question-pool-loading="isQuestionPoolLoading"
        :question-pool-error="questionPoolError"
        :is-question-selected="isQuestionSelected"
        :get-question-subject-label="getQuestionSubjectLabel"
        :get-topic-label="getTopicLabel"
        :get-type-label="getTypeLabel"
        :get-difficulty-label="getDifficultyLabel"
        @update:questionSearch="emit('update:questionSearch', $event)"
        @reload="emit('refresh-question-pool')"
        @select-all="emit('select-all-visible')"
        @toggle-question="emit('toggle-question', $event.question, $event.checked)"
      />

      <ExamSelectedQuestionsTable
        :selected-questions-sorted="selectedQuestionsSorted"
        :get-topic-label="getTopicLabel"
        :get-question-subject-label="getQuestionSubjectLabel"
        @clear-all="emit('clear-selected-questions')"
        @remove-question="emit('remove-question', $event)"
      />
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-border pt-4">
      <button class="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted" @click="emit('cancel')">
        {{ cancelText }}
      </button>
      <button
        class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        :disabled="isSaving"
        @click="emit('submit')"
      >
        <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
        {{ submitText }}
      </button>
    </div>
  </div>
</template>

