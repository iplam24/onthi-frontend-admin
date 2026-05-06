<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { examsAPI, questionsAPI, subjectsAPI, topicsAPI } from '@/services/api'
import ExamFormWorkspace from '@/components/exams/ExamFormWorkspace.vue'
import { normalizeCollection, normalizeSubject, normalizeTopic, normalizeQuestion } from '@/utils/normalizers'

const router = useRouter()

const subjects = ref([])
const topics = ref([])
const questionPool = ref([])
const isSaving = ref(false)
const isQuestionPoolLoading = ref(false)
const errorMessage = ref('')
const questionPoolError = ref('')
const questionSearch = ref('')

const formState = reactive({
  title: '',
  subjectId: '',
  duration: 90,
  isActive: true,
  startTime: '',
  endTime: '',
  type: 'MULTIPLE_CHOICE',
  shuffleQuestions: false,
  shuffleAnswers: false,
  maxAttempts: 1,
  questions: []
})

const examTypeOptions = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'MIXED', label: 'Hỗn hợp' }
]

function getSubjectDisplayLabel(subject) {
  if (!subject) return '—'
  const levelLabel = subject.levelName || ''
  return levelLabel ? `${subject.name} - ${levelLabel}` : subject.name || '—'
}

function enrichQuestion(question) {
  const topic = getTopicMeta(question.topicId)
  return {
    ...question,
    subjectId: topic?.subjectId ?? '',
    subjectName: topic?.subjectName || getSubjectName(topic?.subjectId) || '',
    topicName: question.topicName || topic?.name || ''
  }
}

function getSubjectName(subjectId, fallbackName = '') {
  const subject = subjects.value.find(item => String(item.id) === String(subjectId))
  if (subject) return getSubjectDisplayLabel(subject)
  return fallbackName || '—'
}

function getTopicMeta(topicId) {
  return topics.value.find(topic => String(topic.id) === String(topicId)) || null
}

function getTopicLabel(question) {
  return question.topicName || getTopicMeta(question.topicId)?.name || '—'
}

function getQuestionSubjectLabel(question) {
  return question.subjectName || getTopicMeta(question.topicId)?.subjectName || getSubjectName(question.subjectId) || '—'
}

function getTypeLabel(type) {
  const normalized = String(type || '').toUpperCase()
  if (normalized === 'MIXED') return 'Hỗn hợp'
  if (normalized === 'MULTIPLE_CHOICE') return 'Trắc nghiệm'
  return normalized || '—'
}

function getDifficultyLabel(difficulty) {
  const labels = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
  return labels[String(difficulty || '').toUpperCase()] || difficulty || '—'
}

function getSelectedQuestionIndex(questionId) {
  return formState.questions.findIndex(question => String(question.questionId) === String(questionId))
}

function isQuestionSelected(questionId) {
  return getSelectedQuestionIndex(questionId) >= 0
}

function toggleQuestionSelection(question, checked) {
  const existingIndex = getSelectedQuestionIndex(question.id)

  if (checked && existingIndex < 0) {
    formState.questions.push({
      questionId: question.id,
      questionContent: question.questionContent || question.content || '',
      content: question.content,
      contentSnapshot: question.questionContent || question.content || '',
      topicId: question.topicId ?? '',
      topicName: question.topicName ?? '',
      subjectId: question.subjectId ?? '',
      subjectName: question.subjectName ?? '',
      type: question.type ?? '',
      difficulty: question.difficulty ?? '',
      orderIndex: formState.questions.length + 1,
      score: 1
    })
    return
  }

  if (!checked && existingIndex >= 0) {
    formState.questions.splice(existingIndex, 1)
  }
}

function removeQuestionFromSelection(questionId) {
  const index = getSelectedQuestionIndex(questionId)
  if (index >= 0) {
    formState.questions.splice(index, 1)
  }
}

function selectAllVisibleQuestions() {
  filteredQuestionPool.value.forEach(question => {
    if (!isQuestionSelected(question.id)) {
      toggleQuestionSelection(question, true)
    }
  })
}

function clearSelectedQuestions() {
  formState.questions = []
}

function resetForm() {
  formState.title = ''
  formState.subjectId = ''
  formState.duration = 90
  formState.isActive = true
  formState.startTime = ''
  formState.endTime = ''
  formState.type = 'MULTIPLE_CHOICE'
  formState.shuffleQuestions = false
  formState.shuffleAnswers = false
  formState.maxAttempts = 1
  formState.questions = []
  questionPool.value = []
  questionSearch.value = ''
  questionPoolError.value = ''
}

async function loadQuestionPool(subjectId) {
  if (!subjectId) {
    questionPool.value = []
    questionPoolError.value = ''
    return
  }

  const requestId = Symbol('question-pool-request')
  loadQuestionPool.activeRequest = requestId
  isQuestionPoolLoading.value = true
  questionPoolError.value = ''

  try {
    const firstResponse = await questionsAPI.getAll({
      page: 0,
      size: 100,
      sort: 'id,DESC',
      subjectId: Number(subjectId) || subjectId
    })

    if (loadQuestionPool.activeRequest !== requestId) return

    const firstPage = firstResponse.data?.data ?? firstResponse.data ?? {}
    const normalized = normalizeCollection(firstPage).map(normalizeQuestion).map(enrichQuestion)
    const totalPages = Number(firstPage.totalPages ?? 1) || 1

    let combined = normalized

    if (totalPages > 1) {
      const extraRequests = []
      for (let page = 1; page < totalPages; page += 1) {
        extraRequests.push(
          questionsAPI.getAll({
            page,
            size: 100,
            sort: 'id,DESC',
            subjectId: Number(subjectId) || subjectId
          })
        )
      }

      const extraResponses = await Promise.all(extraRequests)
      if (loadQuestionPool.activeRequest !== requestId) return

      const extraQuestions = extraResponses.flatMap(response => {
        const pageData = response.data?.data ?? response.data ?? {}
        return normalizeCollection(pageData).map(normalizeQuestion).map(enrichQuestion)
      })

      combined = [...combined, ...extraQuestions]
    }

    questionPool.value = combined.filter(question => String(question.subjectId) === String(subjectId))
  } catch (error) {
    if (loadQuestionPool.activeRequest !== requestId) return
    questionPoolError.value = error.response?.data?.message || 'Không tải được danh sách câu hỏi cho đề thi'
    questionPool.value = []
  } finally {
    if (loadQuestionPool.activeRequest === requestId) {
      isQuestionPoolLoading.value = false
    }
  }
}

loadQuestionPool.activeRequest = null

async function loadReferenceData() {
  try {
    const [subjectsResponse, topicsResponse] = await Promise.all([
      subjectsAPI.getAll(),
      topicsAPI.getAll()
    ])

    subjects.value = normalizeCollection(subjectsResponse.data).map(normalizeSubject)
    topics.value = normalizeCollection(topicsResponse.data).map(normalizeTopic)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được dữ liệu khởi tạo'
  }
}

const filteredQuestionPool = computed(() => {
  const keyword = questionSearch.value.trim().toLowerCase()
  return questionPool.value.filter(question => {
    if (!keyword) return true
    return [question.content, question.topicName, question.subjectName, question.difficulty, question.type]
      .filter(Boolean)
      .some(field => String(field).toLowerCase().includes(keyword))
  })
})

const selectedQuestionsSorted = computed(() =>
  [...formState.questions].sort((a, b) => {
    const orderDelta = Number(a.orderIndex || 0) - Number(b.orderIndex || 0)
    if (orderDelta !== 0) return orderDelta
    return String(a.questionId).localeCompare(String(b.questionId))
  })
)

const selectedQuestionCount = computed(() => formState.questions.length)

const selectedQuestionTotalScore = computed(() =>
  selectedQuestionsSorted.value.reduce((sum, question) => sum + (Number(question.score) || 0), 0)
)

function validateForm() {
  if (!formState.title.trim()) return 'Vui lòng nhập tên đề thi'
  if (!formState.subjectId) return 'Vui lòng chọn môn học'
  if (!Number(formState.duration) || Number(formState.duration) <= 0) return 'Vui lòng nhập thời lượng hợp lệ'
  if (!formState.type) return 'Vui lòng chọn loại đề thi'
  if (!selectedQuestionsSorted.value.length) return 'Vui lòng chọn ít nhất một câu hỏi cho đề thi'
  return ''
}

function getRequestQuestionsPayload() {
  return selectedQuestionsSorted.value.map(question => ({
    questionId: question.questionId,
    orderIndex: Number(question.orderIndex) || 1,
    score: Number(question.score) || 1,
    contentSnapshot: question.contentSnapshot || question.questionContent || question.content || ''
  }))
}

async function handleSubmitExam() {
  const validationMessage = validateForm()
  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await examsAPI.create({
      title: formState.title.trim(),
      subjectId: Number(formState.subjectId) || formState.subjectId,
      duration: Number(formState.duration) || 0,
      isActive: !!formState.isActive,
      startTime: formState.startTime || null,
      endTime: formState.endTime || null,
      totalScore: selectedQuestionTotalScore.value,
      type: formState.type,
      shuffleQuestions: !!formState.shuffleQuestions,
      shuffleAnswers: !!formState.shuffleAnswers,
      maxAttempts: Number(formState.maxAttempts) || 1,
      questions: getRequestQuestionsPayload()
    })

    router.push('/exams')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không lưu được đề thi'
  } finally {
    isSaving.value = false
  }
}

function handleSubjectChangeInForm() {
  formState.questions = []
  questionSearch.value = ''
  loadQuestionPool(formState.subjectId)
}

function goBack() {
  router.push('/exams')
}

onMounted(async () => {
  resetForm()
  await loadReferenceData()
})
</script>

<template>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Học liệu · Đề thi
          </div>
          <h1 class="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Thêm đề thi</h1>
          <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tạo đề thi mới theo đúng môn học, chọn câu hỏi và cấu hình đề trên một trang riêng.
          </p>
        </div>

        <button
          class="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" />
          Quay lại danh sách
        </button>
      </div>
    </section>

    <section class="rounded-[1.75rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
      <ExamFormWorkspace
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
        submit-text="Tạo đề thi"
        cancel-text="Quay lại"
        @cancel="goBack"
        @submit="handleSubmitExam"
        @subject-change="handleSubjectChangeInForm"
        @refresh-question-pool="loadQuestionPool(formState.subjectId)"
        @select-all-visible="selectAllVisibleQuestions"
        @clear-selected-questions="clearSelectedQuestions"
        @toggle-question="toggleQuestionSelection"
        @remove-question="removeQuestionFromSelection"
        @update:questionSearch="questionSearch = $event"
      />
    </section>
  </div>
</template>


