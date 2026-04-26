<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { API_CONFIG } from '@/constants'
import { RefreshCw as RefreshIcon, Trash2 as TrashIcon } from 'lucide-vue-next'

const props = defineProps({
  open: {
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
  question: {
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

const imageInputRef = ref(null)
const pendingImageFile = ref(null)
const imagePreviewUrl = ref('')
const localError = ref('')
const formState = reactive({
  content: '',
  topicId: '',
  url: '',
  difficulty: 'EASY',
  questionType: 'multiple_choice',
  sampleAnswer: '',
  explanation: '',
  options: [
    { content: '', isCorrect: false },
    { content: '', isCorrect: false }
  ]
})

const isMultipleChoice = computed(() => formState.questionType === 'multiple_choice')

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

function initForm() {
  const q = props.question || {}
  formState.content = q.content || ''
  formState.topicId = q.topicId || ''
  formState.url = q.url || ''
  formState.difficulty = (q.difficulty || 'EASY').toUpperCase()
  formState.questionType = (q.type || 'MCQ').toUpperCase() === 'ESSAY' ? 'essay' : 'multiple_choice'
  formState.sampleAnswer = q.sampleAnswer || ''
  formState.explanation = q.explanation || ''
  formState.options = Array.isArray(q.options) && q.options.length
    ? q.options.map(option => ({ content: option.content || '', isCorrect: !!option.isCorrect }))
    : (formState.questionType === 'essay'
        ? []
        : [
            { content: '', isCorrect: false },
            { content: '', isCorrect: false }
          ])
  pendingImageFile.value = null
  imagePreviewUrl.value = resolveMediaUrl(formState.url)
  localError.value = ''
  if (imageInputRef.value) imageInputRef.value.value = ''
}

function resetDraft() {
  formState.content = ''
  formState.topicId = ''
  formState.url = ''
  formState.difficulty = 'EASY'
  formState.questionType = 'multiple_choice'
  formState.sampleAnswer = ''
  formState.explanation = ''
  formState.options = [
    { content: '', isCorrect: false },
    { content: '', isCorrect: false }
  ]
  pendingImageFile.value = null
  imagePreviewUrl.value = ''
  localError.value = ''
  if (imageInputRef.value) imageInputRef.value.value = ''
}

function handleTypeChange() {
  if (formState.questionType === 'essay') {
    formState.options = []
  } else if (!formState.options.length) {
    formState.options = [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ]
  }
}

function applyQuickTopic(topicId) {
  formState.topicId = topicId
}

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  pendingImageFile.value = file
  formState.url = ''

  if (imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imagePreviewUrl.value = URL.createObjectURL(file)
}

function clearImage() {
  pendingImageFile.value = null
  formState.url = ''

  if (imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imagePreviewUrl.value = ''
  if (imageInputRef.value) imageInputRef.value.value = ''
}

function submitForm() {
  localError.value = ''

  if (!formState.content.trim()) {
    localError.value = 'Vui lòng nhập nội dung câu hỏi'
    return
  }

  if (!formState.topicId) {
    localError.value = 'Vui lòng chọn topic'
    return
  }

  if (!formState.questionType) {
    localError.value = 'Vui lòng chọn loại câu hỏi'
    return
  }

  emit('submit', {
    form: {
      content: formState.content.trim(),
      topicId: formState.topicId,
      url: formState.url,
      difficulty: formState.difficulty,
      questionType: formState.questionType,
      sampleAnswer: formState.sampleAnswer,
      explanation: formState.explanation,
      options: formState.options.map(option => ({ ...option }))
    },
    imageFile: pendingImageFile.value
  })
}

watch(() => props.open, open => {
  if (open) initForm()
  else resetDraft()
}, { immediate: true })

watch(() => props.question, () => {
  if (props.open) initForm()
}, { deep: true })

onBeforeUnmount(() => {
  if (imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})
</script>

<template>
  <BaseDialog :open="open" :title="isEditing ? 'Sửa câu hỏi' : 'Thêm câu hỏi'" description="Chọn topic nhanh rồi nhập câu hỏi." size="lg" @close="emit('close')">
    <div class="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
      <div class="space-y-2">
        <label for="question-content" class="text-sm font-medium text-foreground">Nội dung câu hỏi</label>
        <textarea
          id="question-content"
          v-model="formState.content"
          rows="4"
          placeholder="Nhập nội dung câu hỏi"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="question-image" class="text-sm font-medium text-foreground">Ảnh câu hỏi</label>
        <input
          id="question-image"
          ref="imageInputRef"
          type="file"
          accept="image/*"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
          @change="handleImageChange"
        />
        <p class="text-xs text-muted-foreground">Chọn ảnh để xem trước. Ảnh sẽ upload khi bấm Lưu/Cập nhật.</p>
      </div>

      <div v-if="imagePreviewUrl" class="space-y-2">
        <p class="text-sm font-medium text-foreground">Xem trước ảnh</p>
        <div class="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
          <img :src="imagePreviewUrl" alt="preview" class="h-24 w-24 rounded-lg border border-border object-cover" />
          <div class="flex-1">
            <p class="break-all text-sm text-muted-foreground">{{ pendingImageFile?.name ? `Đã chọn: ${pendingImageFile.name}` : (formState.url || 'Ảnh sẽ được upload khi bấm Lưu') }}</p>
            <button
              class="mt-2 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
              type="button"
              @click="clearImage"
            >
              Xóa ảnh
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <label for="quick-topic-id" class="text-sm font-medium text-foreground">Chọn topic nhanh</label>
        <select
          id="quick-topic-id"
          v-model="formState.topicId"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          @change="applyQuickTopic(formState.topicId)"
        >
          <option value="">-- Chọn topic nhanh --</option>
          <option v-for="topic in quickTopicOptions" :key="topic.value" :value="topic.value">
            {{ topic.label }}
          </option>
        </select>
        <p class="text-xs text-muted-foreground">Chỉ cần chọn topic một lần là xong.</p>
      </div>

      <div class="space-y-2">
        <label for="question-difficulty" class="text-sm font-medium text-foreground">Độ khó</label>
        <select
          id="question-difficulty"
          v-model="formState.difficulty"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <option v-for="option in difficultyOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label for="question-type" class="text-sm font-medium text-foreground">Loại câu hỏi</label>
        <select
          id="question-type"
          v-model="formState.questionType"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          @change="handleTypeChange"
        >
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="isMultipleChoice" class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-foreground">Đáp án</h3>
          <button class="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted" @click="formState.options.push({ content: '', isCorrect: false })">
            + Thêm đáp án
          </button>
        </div>

        <div v-for="(option, index) in formState.options" :key="index" class="rounded-xl border border-border bg-background p-4">
          <div class="flex items-start gap-3">
            <div class="flex-1 space-y-2">
              <label class="text-sm font-medium text-foreground">Nội dung đáp án {{ index + 1 }}</label>
              <input
                v-model="option.content"
                type="text"
                placeholder="Nhập nội dung đáp án"
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
            </div>

            <label class="mt-7 inline-flex items-center gap-2 text-sm text-foreground">
              <input v-model="option.isCorrect" type="checkbox" class="h-4 w-4" />
              Đúng
            </label>

            <button
              class="mt-6 rounded-md border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              :disabled="formState.options.length <= 2"
              @click="formState.options.splice(index, 1)"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p v-else class="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Câu tự luận không cần nhập đáp án trắc nghiệm.
      </p>

      <div v-if="formState.questionType === 'essay'" class="space-y-2">
        <label for="question-sample-answer" class="text-sm font-medium text-foreground">Đáp án mẫu</label>
        <textarea
          id="question-sample-answer"
          v-model="formState.sampleAnswer"
          rows="3"
          placeholder="Nhập đáp án mẫu nếu có"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <div class="space-y-2">
        <label for="question-explanation" class="text-sm font-medium text-foreground">Giải thích</label>
        <textarea
          id="question-explanation"
          v-model="formState.explanation"
          rows="3"
          placeholder="Nhập giải thích nếu có"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      <p v-if="localError || errorMessage" class="text-sm text-destructive">{{ localError || errorMessage }}</p>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button class="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted" @click="emit('close')">
          Hủy
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          :disabled="loading"
          @click="submitForm"
        >
          <RefreshIcon v-if="loading" class="h-4 w-4 animate-spin" />
          {{ isEditing ? 'Cập nhật' : 'Lưu' }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>

