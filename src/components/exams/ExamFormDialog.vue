<script setup>
import BaseDialog from '@/components/ui/BaseDialog.vue'
import ExamFormWorkspace from '@/components/exams/ExamFormWorkspace.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
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
  }
})

const emit = defineEmits([
  'close',
  'submit',
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
  <BaseDialog
    :open="open"
    :title="isEditing ? 'Sửa đề thi' : 'Thêm đề thi'"
    :description="'Chọn môn học, cấu hình đề và pick danh sách câu hỏi cho đề.'"
    size="lg"
    @close="emit('close')"
  >
    <div class="max-h-[80vh] overflow-y-auto overscroll-contain pr-1">
      <ExamFormWorkspace
        :is-editing="isEditing"
        :subjects="subjects"
        :exam-type-options="examTypeOptions"
        :form-state="formState"
        :selected-question-count="selectedQuestionCount"
        :selected-question-total-score="selectedQuestionTotalScore"
        :is-saving="isSaving"
        :is-question-pool-loading="isQuestionPoolLoading"
        :question-pool-error="questionPoolError"
        :error-message="errorMessage"
        :filtered-question-pool="filteredQuestionPool"
        :selected-questions-sorted="selectedQuestionsSorted"
        :question-search="questionSearch"
        :get-subject-name="getSubjectName"
        :get-topic-label="getTopicLabel"
        :get-question-subject-label="getQuestionSubjectLabel"
        :get-type-label="getTypeLabel"
        :get-difficulty-label="getDifficultyLabel"
        :is-question-selected="isQuestionSelected"
        submit-text="Lưu"
        cancel-text="Hủy"
        @cancel="emit('close')"
        @submit="emit('submit')"
        @subject-change="emit('subject-change')"
        @refresh-question-pool="emit('refresh-question-pool')"
        @select-all-visible="emit('select-all-visible')"
        @clear-selected-questions="emit('clear-selected-questions')"
        @toggle-question="(question, checked) => emit('toggle-question', question, checked)"
        @remove-question="emit('remove-question', $event)"
        @update:questionSearch="emit('update:questionSearch', $event)"
      />
    </div>
  </BaseDialog>
</template>


