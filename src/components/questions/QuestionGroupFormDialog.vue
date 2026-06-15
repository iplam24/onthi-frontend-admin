<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { RefreshCw as RefreshIcon, Trash2 as TrashIcon } from 'lucide-vue-next'
import { renderQuestionContent } from '@/utils/questionContent'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  group: {
    type: Object,
    default: null
  },
  levels: {
    type: Array,
    default: () => []
  },
  subjects: {
    type: Array,
    default: () => []
  },
  topics: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const localError = ref('')

const formState = reactive({
  title: '',
  content: '',
  topicId: '',
  questions: [
    {
      content: '',
      difficulty: 'EASY',
      questionType: 'multiple_choice',
      options: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ]
    }
  ]
})

const typeOptions = [
  { value: 'multiple_choice', label: 'Trắc nghiệm' },
  { value: 'essay', label: 'Tự luận' }
]

const difficultyOptions = [
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' }
]

const quickTopicOptions = computed(() =>
  props.topics.map(topic => ({
    value: topic.id,
    label: formatTopicLabel(topic)
  }))
)

function formatTopicLabel(topic) {
  const subjectName = topic.subjectName || getSubjectName(topic.subjectId)
  const levelName = topic.levelName || getLevelNameById(topic.levelId)
  return `${topic.name}${subjectName ? ` — ${subjectName}` : ''}${levelName ? ` — ${levelName}` : ''}`
}

function getLevelNameById(levelId) {
  return props.levels.find(level => String(level.id) === String(levelId))?.name || ''
}

function getSubjectName(subjectId) {
  return props.subjects.find(subject => String(subject.id) === String(subjectId))?.name || ''
}

function initForm() {
  const g = props.group || {}
  formState.title = g.title || ''
  // Handle content mapping (extract pure content from HTML string if needed, or leave it)
  // In QuestionsView.vue, group content was formatted as HTML string for display, 
  // but if editing, we might need the original. Assuming g.originalContent or g.explanation contains the raw content.
  formState.content = g.explanation || g.content || ''
  formState.topicId = g.topicId || ''
  
  if (g.questions && g.questions.length > 0) {
    formState.questions = g.questions.map(q => ({
      content: q.content || '',
      difficulty: (q.difficulty || 'EASY').toUpperCase(),
      questionType: (q.type || 'MCQ').toUpperCase() === 'ESSAY' ? 'essay' : 'multiple_choice',
      options: Array.isArray(q.options) && q.options.length
        ? q.options.map(option => ({ content: option.content || '', isCorrect: !!option.isCorrect }))
        : ( (q.type || 'MCQ').toUpperCase() === 'ESSAY'
            ? []
            : [
                { content: '', isCorrect: false },
                { content: '', isCorrect: false }
              ])
    }))
  } else {
    formState.questions = [
      { content: '', difficulty: 'EASY', questionType: 'multiple_choice', options: [{ content: '', isCorrect: false }, { content: '', isCorrect: false }] }
    ]
  }
  
  localError.value = ''
}

function resetDraft() {
  formState.title = ''
  formState.content = ''
  formState.topicId = ''
  formState.questions = [
    { content: '', difficulty: 'EASY', questionType: 'multiple_choice', options: [{ content: '', isCorrect: false }, { content: '', isCorrect: false }] }
  ]
  localError.value = ''
}

function submitForm() {
  localError.value = ''

  if (!formState.topicId) {
    localError.value = 'Vui lòng chọn topic'
    return
  }

  if (!formState.title.trim()) {
    localError.value = 'Vui lòng nhập tiêu đề nhóm'
    return
  }
  if (!formState.content.trim()) {
    localError.value = 'Vui lòng nhập nội dung đoạn văn/bài đọc'
    return
  }
  if (!formState.questions.length) {
    localError.value = 'Vui lòng thêm ít nhất một câu hỏi con'
    return
  }
  
  for (let i = 0; i < formState.questions.length; i++) {
    if (!formState.questions[i].content.trim()) {
      localError.value = `Vui lòng nhập nội dung cho câu hỏi con ${i + 1}`
      return
    }
  }

  emit('submit', {
    title: formState.title.trim(),
    content: formState.content.trim(),
    topicId: formState.topicId,
    questions: formState.questions.map(q => ({
      content: q.content.trim(),
      type: q.questionType === 'essay' ? 'ESSAY' : 'MCQ',
      difficulty: q.difficulty,
      options: q.questionType === 'essay' ? [] : q.options.map(opt => ({ content: opt.content.trim(), isCorrect: !!opt.isCorrect })).filter(opt => opt.content)
    }))
  })
}

watch(() => props.isOpen, open => {
  if (open) initForm()
  else resetDraft()
}, { immediate: true })

watch(() => props.group, () => {
  if (props.isOpen) initForm()
}, { deep: true })
</script>

<template>
  <BaseDialog :open="isOpen" :title="isEditing ? 'Sửa nhóm câu hỏi' : 'Thêm nhóm câu hỏi'" description="Thêm đoạn văn và các câu hỏi con đi kèm." size="xl" @close="emit('close')">
    <div class="max-h-[75vh] space-y-6 overflow-y-auto pr-2">
      
      <!-- Group Info -->
      <div class="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 class="text-base font-bold text-foreground">Thông tin chung</h3>
        <div class="space-y-3">
          <div class="space-y-1.5">
            <label for="quick-topic-id" class="text-sm font-semibold text-foreground">Chọn topic</label>
            <select
              id="quick-topic-id"
              v-model="formState.topicId"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            >
              <option value="">-- Chọn topic --</option>
              <option v-for="topic in quickTopicOptions" :key="topic.value" :value="topic.value">
                {{ topic.label }}
              </option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-foreground">Tiêu đề nhóm</label>
            <input
              v-model="formState.title"
              type="text"
              placeholder="Ví dụ: Đọc đoạn văn sau và trả lời các câu hỏi 1-5"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>
          
          <div class="space-y-1.5">
            <label class="text-sm font-semibold text-foreground">Đoạn văn / Bài đọc</label>
            <textarea
              v-model="formState.content"
              rows="6"
              placeholder="Nhập nội dung bài đọc..."
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            />
          </div>
        </div>
      </div>

      <!-- Child Questions -->
      <div class="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-foreground">Các câu hỏi con ({{ formState.questions.length }})</h3>
          <button
            type="button"
            class="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
            @click="formState.questions.push({ content: '', difficulty: 'EASY', questionType: 'multiple_choice', options: [{ content: '', isCorrect: false }, { content: '', isCorrect: false }] })"
          >
            + Thêm câu hỏi con
          </button>
        </div>

        <div class="space-y-4">
          <div v-for="(q, qIndex) in formState.questions" :key="qIndex" class="relative space-y-3 rounded-lg border border-border bg-muted/20 p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {{ qIndex + 1 }}
              </span>
              <button
                type="button"
                class="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                :disabled="formState.questions.length <= 1"
                @click="formState.questions.splice(qIndex, 1)"
                title="Xóa câu hỏi này"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground">Nội dung câu hỏi</label>
              <textarea
                v-model="q.content"
                rows="2"
                placeholder="Nội dung câu hỏi..."
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Độ khó</label>
                <select v-model="q.difficulty" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option v-for="opt in difficultyOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground">Loại</label>
                <select v-model="q.questionType" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" @change="q.questionType === 'essay' ? q.options = [] : q.options = [{ content: '', isCorrect: false }, { content: '', isCorrect: false }]">
                  <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>

            <div v-if="q.questionType === 'multiple_choice'" class="space-y-2 pt-2 border-t border-border mt-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-muted-foreground">Đáp án trắc nghiệm</span>
                <button type="button" class="text-xs font-bold text-primary hover:underline" @click="q.options.push({ content: '', isCorrect: false })">+ Thêm đáp án</button>
              </div>
              <div class="space-y-2">
                <div v-for="(opt, oIndex) in q.options" :key="oIndex" class="flex items-start gap-2">
                  <div class="flex items-center h-9">
                    <input type="checkbox" v-model="opt.isCorrect" class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" title="Đánh dấu đáp án đúng" />
                  </div>
                  <input v-model="opt.content" type="text" placeholder="Nội dung đáp án" class="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                  <button type="button" class="mt-1.5 text-destructive/70 hover:text-destructive" :disabled="q.options.length <= 2" @click="q.options.splice(oIndex, 1)">
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="localError || errorMessage" class="text-sm font-bold text-destructive">{{ localError || errorMessage }}</p>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button class="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors" @click="emit('close')">
          Hủy
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="submitForm"
        >
          <RefreshIcon v-if="loading" class="h-4 w-4 animate-spin" />
          {{ isEditing ? 'Cập nhật nhóm' : 'Lưu nhóm' }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
