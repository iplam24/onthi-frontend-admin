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
  },
  examLayoutHints: {
    type: Array,
    default: () => []
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
  <div class="space-y-10">
    <!-- Basic Information Grid -->
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-3 lg:col-span-2">
        <label for="exam-title" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Tiêu đề đề thi</label>
        <input
          id="exam-title"
          v-model="formState.title"
          type="text"
          placeholder="Nhập tên đề thi hiển thị cho học sinh..."
          class="app-input !text-lg !font-bold"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-subject" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Môn học áp dụng</label>
        <select
          id="exam-subject"
          v-model="formState.subjectId"
          class="app-select"
          @change="emit('subject-change')"
        >
          <option value="">-- Chọn môn học --</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ getSubjectName(subject.id, subject.name) }}
          </option>
        </select>
      </div>

      <div class="space-y-3">
        <label for="exam-duration" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Thời lượng (phút)</label>
        <input
          id="exam-duration"
          v-model.number="formState.duration"
          type="number"
          min="1"
          step="1"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-start-time" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Ngày bắt đầu</label>
        <input
          id="exam-start-time"
          v-model="formState.startTime"
          type="datetime-local"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-end-time" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Ngày kết thúc</label>
        <input
          id="exam-end-time"
          v-model="formState.endTime"
          type="datetime-local"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-type" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Cấu trúc đề</label>
        <select
          id="exam-type"
          v-model="formState.type"
          class="app-select"
        >
          <option v-for="option in examTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-3">
        <label for="exam-layout-hint" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Giao diện hiển thị</label>
        <select
          id="exam-layout-hint"
          v-model="formState.uiLayoutHint"
          class="app-select"
        >
          <option v-for="option in examLayoutHints" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="grid gap-4 sm:grid-cols-3 lg:col-span-2">
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.isActive" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Kích hoạt đề</span>
        </label>
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.shuffleQuestions" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Trộn câu hỏi</span>
        </label>
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.shuffleAnswers" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Trộn đáp án</span>
        </label>
      </div>

      <div class="space-y-3">
        <label for="exam-max-attempts" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Số lần làm tối đa</label>
        <input
          id="exam-max-attempts"
          v-model.number="formState.maxAttempts"
          type="number"
          min="1"
          step="1"
          class="app-input"
        />
      </div>

      <div class="rounded-2xl bg-primary/5 border border-primary/20 p-6 lg:col-span-2">
        <div class="flex flex-wrap items-center gap-6 text-sm">
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Câu hỏi đã chọn</span>
            <span class="text-xl font-black text-primary">{{ selectedQuestionCount }} câu</span>
          </div>
          <div class="h-8 w-px bg-border/50"></div>
          <div class="flex flex-col">
            <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tổng điểm</span>
            <span class="text-xl font-black text-primary">{{ selectedQuestionTotalScore }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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

    <div class="flex items-center justify-end gap-3 border-t border-border/50 pt-6">
      <button class="app-btn-secondary !px-8" @click="emit('cancel')">
        {{ cancelText }}
      </button>
      <button
        class="app-btn-primary !px-12 group"
        :disabled="isSaving"
        @click="emit('submit')"
      >
        <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
        {{ submitText }}
      </button>
    </div>
  </div>
</template>

