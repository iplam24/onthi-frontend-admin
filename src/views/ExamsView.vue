<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { examsAPI, questionsAPI, subjectsAPI, topicsAPI } from '@/services/api'
import ExamPageHeader from '@/components/exams/ExamPageHeader.vue'
import ExamFiltersPanel from '@/components/exams/ExamFiltersPanel.vue'
import ExamTable from '@/components/exams/ExamTable.vue'
import ExamFormDialog from '@/components/exams/ExamFormDialog.vue'
import ExamDetailDialog from '@/components/exams/ExamDetailDialog.vue'

const exams = ref([])
const router = useRouter()
const subjects = ref([])
const topics = ref([])
const questionPool = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isQuestionPoolLoading = ref(false)
const errorMessage = ref('')
const questionPoolError = ref('')
const isDialogOpen = ref(false)
const isDetailOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const selectedExam = ref(null)
const questionSearch = ref('')

const filters = reactive({
  subjectId: ''
})

const pagination = reactive({
  page: 0,
  size: 10,
  sort: 'id,DESC',
  totalElements: 0,
  totalPages: 0,
  numberOfElements: 0,
  first: true,
  last: true,
  hasNext: false,
  hasPrevious: false
})

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

function normalizeCollection(payload) {
  const raw = payload?.data ?? payload
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.content)) return raw.content
  if (Array.isArray(raw?.results)) return raw.results
  return []
}

function normalizeSubject(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? '',
    levelId: item?.levelId ?? '',
    levelName: item?.levelName ?? ''
  }
}

function getSubjectDisplayLabel(subject) {
  if (!subject) return '—'

  const levelLabel = subject.levelName || ''
  return levelLabel ? `${subject.name} - ${levelLabel}` : subject.name || '—'
}

function normalizeTopic(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    levelId: item?.levelId ?? '',
    levelName: item?.levelName ?? ''
  }
}

function normalizeQuestion(item) {
  return {
    id: item?.id ?? item?._id,
    content: item?.content ?? '',
    topicId: item?.topicId ?? '',
    topicName: item?.topicName ?? '',
    type: item?.type ?? item?.questionType ?? '',
    difficulty: item?.difficulty ?? '',
    options: Array.isArray(item?.options) ? item.options : [],
    sampleAnswer: item?.sampleAnswer ?? '',
    explanation: item?.explanation ?? ''
  }
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

function normalizeExamQuestion(item, index = 0) {
  const questionContent = item?.questionContent ?? item?.content ?? item?.contentSnapshot ?? ''

  return {
    questionId: item?.questionId ?? item?.id ?? null,
    questionContent,
    content: item?.content ?? questionContent,
    contentSnapshot: item?.contentSnapshot ?? questionContent,
    topicId: item?.topicId ?? '',
    topicName: item?.topicName ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    type: item?.type ?? '',
    difficulty: item?.difficulty ?? '',
    orderIndex: Number(item?.orderIndex ?? index + 1) || index + 1,
    score: Number(item?.score ?? 1) || 1
  }
}

function normalizeExam(item) {
  const questionsData = Array.isArray(item?.questions) ? item.questions : []

  return {
    id: item?.id ?? item?._id,
    title: item?.title ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    createdByUsername: item?.createdByUsername ?? '',
    duration: Number(item?.duration ?? 0) || 0,
    isActive: !!item?.isActive,
    startTime: item?.startTime ?? '',
    endTime: item?.endTime ?? '',
    totalScore: Number(item?.totalScore ?? 0) || 0,
    type: item?.type ?? 'MULTIPLE_CHOICE',
    shuffleQuestions: !!item?.shuffleQuestions,
    shuffleAnswers: !!item?.shuffleAnswers,
    maxAttempts: Number(item?.maxAttempts ?? 1) || 1,
    createdAt: item?.createdAt ?? '',
    updatedAt: item?.updatedAt ?? '',
    questions: questionsData.map((question, index) => normalizeExamQuestion(question, index))
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

function getActiveLabel(value) {
  return value ? 'Đang bật' : 'Tạm tắt'
}

function getDifficultyLabel(difficulty) {
  const labels = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
  return labels[String(difficulty || '').toUpperCase()] || difficulty || '—'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
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
      questionContent: question.content,
      content: question.content,
      contentSnapshot: question.content,
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
  editId.value = null
  isEditing.value = false
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

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const queryParams = {
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort
    }

    const examRequest = filters.subjectId
      ? examsAPI.getBySubject(filters.subjectId, queryParams)
      : examsAPI.getAll(queryParams)

    const [subjectsResponse, topicsResponse, examsResponse] = await Promise.all([
      subjectsAPI.getAll(),
      topicsAPI.getAll(),
      examRequest
    ])

    subjects.value = normalizeCollection(subjectsResponse.data).map(normalizeSubject)
    topics.value = normalizeCollection(topicsResponse.data).map(normalizeTopic)

    const examPage = examsResponse.data?.data ?? examsResponse.data ?? {}
    exams.value = normalizeCollection(examPage).map(normalizeExam)
    pagination.totalElements = examPage.totalElements ?? exams.value.length
    pagination.totalPages = examPage.totalPages ?? 1
    pagination.numberOfElements = examPage.numberOfElements ?? exams.value.length
    pagination.first = examPage.first ?? pagination.page === 0
    pagination.last = examPage.last ?? true
    pagination.hasNext = examPage.hasNext ?? false
    pagination.hasPrevious = examPage.hasPrevious ?? pagination.page > 0
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được danh sách đề thi'
  } finally {
    isLoading.value = false
  }
}


async function onSubjectFilterChange() {
  pagination.page = 0
  await loadData()
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

const activeExamCount = computed(() => exams.value.filter(exam => exam.isActive).length)

const filteredExamLabel = computed(() => {
  if (!filters.subjectId) return 'Tất cả môn học'
  return getSubjectName(filters.subjectId)
})

function goToCreateExam() {
  router.push('/exams/create')
}

async function openEditDialog(exam) {
  errorMessage.value = ''
  questionPoolError.value = ''
  isEditing.value = true
  editId.value = exam.id

  try {
    const response = await examsAPI.getById(exam.id)
    const examData = normalizeExam(response.data?.data ?? response.data ?? exam)

    formState.title = examData.title
    formState.subjectId = examData.subjectId
    formState.duration = examData.duration || 90
    formState.isActive = examData.isActive
    formState.startTime = examData.startTime || ''
    formState.endTime = examData.endTime || ''
    formState.type = examData.type
    formState.shuffleQuestions = examData.shuffleQuestions
    formState.shuffleAnswers = examData.shuffleAnswers
    formState.maxAttempts = examData.maxAttempts || 1
    formState.questions = examData.questions.map((question, index) => ({
      ...normalizeExamQuestion(question, index)
    }))

    await loadQuestionPool(formState.subjectId)

    const poolMap = new Map(questionPool.value.map(question => [String(question.id), question]))
    formState.questions = formState.questions.map((question, index) => {
      const poolQuestion = poolMap.get(String(question.questionId))
      return {
        ...question,
        ...poolQuestion,
        questionId: question.questionId,
        questionContent: question.questionContent || poolQuestion?.questionContent || poolQuestion?.content || question.contentSnapshot || '',
        content: question.content || poolQuestion?.content || question.contentSnapshot || '',
        contentSnapshot: question.contentSnapshot || question.questionContent || question.content || poolQuestion?.content || '',
        orderIndex: question.orderIndex ?? index + 1,
        score: Number(question.score) || 1
      }
    })
  } catch {
    formState.title = exam.title || ''
    formState.subjectId = exam.subjectId || ''
    formState.duration = Number(exam.duration ?? 90) || 90
    formState.isActive = !!exam.isActive
    formState.startTime = exam.startTime || ''
    formState.endTime = exam.endTime || ''
    formState.type = exam.type || 'MULTIPLE_CHOICE'
    formState.shuffleQuestions = !!exam.shuffleQuestions
    formState.shuffleAnswers = !!exam.shuffleAnswers
    formState.maxAttempts = Number(exam.maxAttempts ?? 1) || 1
    formState.questions = Array.isArray(exam.questions)
      ? exam.questions.map((question, index) => normalizeExamQuestion(question, index))
      : []

    await loadQuestionPool(formState.subjectId)
  }

  isDialogOpen.value = true
}

async function openDetailDialog(exam) {
  errorMessage.value = ''
  isDetailOpen.value = true

  try {
    const response = await examsAPI.getById(exam.id)
    selectedExam.value = normalizeExam(response.data?.data ?? response.data ?? exam)
  } catch {
    selectedExam.value = normalizeExam(exam)
  }
}

function closeDialog() {
  isDialogOpen.value = false
  errorMessage.value = ''
  questionPoolError.value = ''
  selectedExam.value = null
  resetForm()
}

function closeDetailDialog() {
  isDetailOpen.value = false
  selectedExam.value = null
}

function prevPage() {
  if (!pagination.hasPrevious) return
  pagination.page -= 1
  loadData()
}

function nextPage() {
  if (!pagination.hasNext) return
  pagination.page += 1
  loadData()
}

async function deleteExam(exam) {
  const confirmed = window.confirm(`Xóa đề thi: "${exam.title}" ?`)
  if (!confirmed) return

  try {
    await examsAPI.delete(exam.id)

    if (pagination.page > 0 && exams.value.length <= 1) {
      pagination.page -= 1
    }

    await loadData()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được đề thi'
  }
}

function getRequestQuestionsPayload() {
  return selectedQuestionsSorted.value.map(question => ({
    questionId: question.questionId,
    orderIndex: Number(question.orderIndex) || 1,
    score: Number(question.score) || 1,
    contentSnapshot: question.contentSnapshot || question.questionContent || question.content || ''
  }))
}

function validateForm() {
  if (!formState.title.trim()) {
    return 'Vui lòng nhập tên đề thi'
  }

  if (!formState.subjectId) {
    return 'Vui lòng chọn môn học'
  }

  if (!Number(formState.duration) || Number(formState.duration) <= 0) {
    return 'Vui lòng nhập thời lượng hợp lệ'
  }

  if (!formState.type) {
    return 'Vui lòng chọn loại đề thi'
  }

  if (!selectedQuestionsSorted.value.length) {
    return 'Vui lòng chọn ít nhất một câu hỏi cho đề thi'
  }

  return ''
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
    const payload = {
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
    }

    if (isEditing.value && editId.value) {
      await examsAPI.update(editId.value, payload)
    } else {
      await examsAPI.create(payload)
    }

    if (!isEditing.value) {
      pagination.page = 0
    }

    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không lưu được đề thi'
  } finally {
    isSaving.value = false
  }
}

function removeQuestionFromSelection(questionId) {
  const index = getSelectedQuestionIndex(questionId)
  if (index >= 0) {
    formState.questions.splice(index, 1)
  }
}

function handleSubjectChangeInForm() {
  formState.questions = []
  questionSearch.value = ''
  loadQuestionPool(formState.subjectId)
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <ExamPageHeader
      :is-loading="isLoading"
      :total-elements="pagination.totalElements"
      :active-exam-count="activeExamCount"
      :filtered-exam-label="filteredExamLabel"
      :page="pagination.page"
      :total-pages="pagination.totalPages"
      @refresh="loadData"
      @create="goToCreateExam"
    />

    <ExamFiltersPanel
      v-model:subjectId="filters.subjectId"
      :subjects="subjects"
      :get-subject-name="getSubjectName"
      @change="onSubjectFilterChange"
    />

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <ExamTable
      :exams="exams"
      :pagination="pagination"
      :is-loading="isLoading"
      :get-subject-name="getSubjectName"
      :get-type-label="getTypeLabel"
      :get-active-label="getActiveLabel"
      :format-date-time="formatDateTime"
      @prev-page="prevPage"
      @next-page="nextPage"
      @view="openDetailDialog"
      @edit="openEditDialog"
      @delete="deleteExam"
    />

    <ExamFormDialog
      :open="isDialogOpen"
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
      @close="closeDialog"
      @submit="handleSubmitExam"
      @subject-change="handleSubjectChangeInForm"
      @refresh-question-pool="loadQuestionPool(formState.subjectId)"
      @select-all-visible="selectAllVisibleQuestions"
      @clear-selected-questions="clearSelectedQuestions"
      @toggle-question="toggleQuestionSelection"
      @remove-question="removeQuestionFromSelection"
      @update:questionSearch="questionSearch = $event"
    />

    <ExamDetailDialog
      :open="isDetailOpen"
      :selected-exam="selectedExam"
      :get-subject-name="getSubjectName"
      :get-type-label="getTypeLabel"
      :get-active-label="getActiveLabel"
      :format-date-time="formatDateTime"
      @close="closeDetailDialog"
    />
  </div>
</template>

