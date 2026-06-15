<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { examsAPI, questionsAPI } from '@/services/api'
import { useMetadataStore } from '@/stores/metadataStore'
import ExamPageHeader from '@/components/exams/ExamPageHeader.vue'
import ExamFiltersPanel from '@/components/exams/ExamFiltersPanel.vue'
import ExamTable from '@/components/exams/ExamTable.vue'
import ExamFormDialog from '@/components/exams/ExamFormDialog.vue'
import ExamDetailDialog from '@/components/exams/ExamDetailDialog.vue'
import QuickRandomExamDialog from '@/components/exams/QuickRandomExamDialog.vue'
import { normalizeCollection, normalizeSubject, normalizeTopic, normalizeQuestion, normalizeExam, normalizeExamQuestion } from '@/utils/normalizers'
import { EXAM_LAYOUT_HINTS } from '@/constants'

const metadataStore = useMetadataStore()
const exams = ref([])
const router = useRouter()
const questionPool = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isQuestionPoolLoading = ref(false)
const errorMessage = ref('')
const questionPoolError = ref('')
const isDialogOpen = ref(false)
const isDetailOpen = ref(false)
const isQuickRandomOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const selectedExam = ref(null)
const questionSearch = ref('')

const filters = reactive({
  subjectId: ''
})

// Client-side advanced filters
const filterType = ref('ALL')
const filterActive = ref('ALL')
const filterQuery = ref('')

const filteredExams = computed(() => {
  return exams.value.filter(exam => {
    // Type filter
    if (filterType.value !== 'ALL' && String(exam.type).toUpperCase() !== filterType.value) {
      return false
    }
    // Active status filter
    if (filterActive.value !== 'ALL') {
      const isActive = !!exam.isActive
      if (filterActive.value === 'ACTIVE' && !isActive) return false
      if (filterActive.value === 'INACTIVE' && isActive) return false
    }
    // Query search filter
    if (filterQuery.value) {
      const q = filterQuery.value.toLowerCase().trim()
      const title = String(exam.title || '').toLowerCase()
      if (!title.includes(q)) {
        return false
      }
    }
    return true
  })
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
  isPublic: true,
  startTime: '',
  endTime: '',
  type: 'MULTIPLE_CHOICE',
  shuffleQuestions: false,
  shuffleAnswers: false,
  maxAttempts: 1,
  uiLayoutHint: 'STANDARD',
  sections: [
    { sectionName: 'Phần 1', items: [] }
  ]
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
  const subject = metadataStore.subjects.find(item => String(item.id) === String(subjectId))
  if (subject) return getSubjectDisplayLabel(subject)
  return fallbackName || '—'
}

function getTopicMeta(topicId) {
  return metadataStore.topics.find(topic => String(topic.id) === String(topicId)) || null
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

function getSelectedQuestionIndex(questionId, isGroup = false) {
  for (let sIdx = 0; sIdx < formState.sections.length; sIdx++) {
    const section = formState.sections[sIdx]
    const index = section.items.findIndex(item => isGroup ? String(item.groupId) === String(questionId) : String(item.questionId) === String(questionId))
    if (index >= 0) {
      return { sectionIndex: sIdx, itemIndex: index }
    }
  }
  return null
}

function isQuestionSelected(questionId, isGroup = false) {
  return getSelectedQuestionIndex(questionId, isGroup) !== null
}

function toggleQuestionSelection(question, checked, sectionIndex = 0) {
  const isGroup = !!question.isGroup
  const existing = getSelectedQuestionIndex(question.id, isGroup)

  if (checked && !existing) {
    if (!formState.sections[sectionIndex]) return
    
    formState.sections[sectionIndex].items.push({
      ...(isGroup ? { groupId: question.id } : { questionId: question.id }),
      questionContent: question.questionContent || question.content || '',
      content: question.content,
      contentSnapshot: question.questionContent || question.content || '',
      topicId: question.topicId ?? '',
      topicName: question.topicName ?? '',
      subjectId: question.subjectId ?? '',
      subjectName: question.subjectName ?? '',
      type: question.type ?? '',
      difficulty: question.difficulty ?? '',
      score: 1,
      isGroup: isGroup
    })
  } else if (!checked && existing) {
    formState.sections[existing.sectionIndex].items.splice(existing.itemIndex, 1)
  }
}

function removeQuestionFromSelection(questionId, isGroup = false) {
  const existing = getSelectedQuestionIndex(questionId, isGroup)
  if (existing) {
    formState.sections[existing.sectionIndex].items.splice(existing.itemIndex, 1)
  }
}

function selectAllVisibleQuestions() {
  filteredQuestionPool.value.forEach(question => {
    if (!isQuestionSelected(question.id, !!question.isGroup)) {
      toggleQuestionSelection(question, true)
    }
  })
}

function clearSelectedQuestions() {
  formState.sections.forEach(s => s.items = [])
}

function resetForm() {
  formState.title = ''
  formState.subjectId = ''
  formState.duration = 90
  formState.isActive = true
  formState.isPublic = true
  formState.startTime = ''
  formState.endTime = ''
  formState.type = 'MULTIPLE_CHOICE'
  formState.shuffleQuestions = false
  formState.shuffleAnswers = false
  formState.maxAttempts = 1
  formState.uiLayoutHint = 'STANDARD'
  formState.sections = [{ sectionName: 'Phần 1', items: [] }]
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
    const [firstResponse, groupsResponse] = await Promise.all([
      questionsAPI.getAll({
        page: 0,
        size: 100,
        sort: 'id,DESC',
        subjectId: Number(subjectId) || subjectId
      }),
      questionsAPI.getGroups({ subjectId: Number(subjectId) || subjectId, size: 500 })
    ]).catch(err => {
      throw err;
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

    const groupsData = normalizeCollection(groupsResponse.data?.data ?? groupsResponse.data ?? {}).map(g => ({
       id: g.id,
       content: `[Nhóm câu hỏi] ${g.content || g.name || ''}`,
       topicId: g.topicId,
       topicName: g.topicName,
       subjectId: g.subjectId,
       difficulty: g.difficulty || '',
       type: 'READING_COMPREHENSION',
       isGroup: true
    })).map(enrichQuestion)

    questionPool.value = [...groupsData, ...combined].filter(question => String(question.subjectId) === String(subjectId))
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

    const examsResponse = await examRequest

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

const selectedQuestionCount = computed(() => formState.sections.reduce((count, section) => count + section.items.length, 0))

const selectedQuestionTotalScore = computed(() =>
  formState.sections.reduce((sum, section) => {
    return sum + section.items.reduce((s, item) => s + (Number(item.score) || 0), 0)
  }, 0)
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
    formState.isPublic = examData.isPublic !== undefined ? examData.isPublic : true
    formState.startTime = examData.startTime || ''
    formState.endTime = examData.endTime || ''
    formState.type = examData.type
    formState.shuffleQuestions = examData.shuffleQuestions
    formState.shuffleAnswers = examData.shuffleAnswers
    formState.maxAttempts = examData.maxAttempts || 1
    formState.uiLayoutHint = examData.uiLayoutHint || 'STANDARD'
    formState.sections = examData.sections && examData.sections.length > 0 ? examData.sections.map(sec => ({
      sectionName: sec.sectionName || 'Phần 1',
      items: sec.questions ? sec.questions.map(q => ({
        ...normalizeExamQuestion(q, 0),
        groupId: q.questionGroupId || q.groupId,
        questionId: q.questionId,
        isGroup: !!(q.questionGroupId || q.groupId),
        score: q.score || 1
      })) : []
    })) : [{ sectionName: 'Phần 1', items: [] }]

    await loadQuestionPool(formState.subjectId)

    const poolMap = new Map(questionPool.value.map(question => [String(question.id), question]))
    formState.sections.forEach(section => {
      section.items = section.items.map(item => {
        const idStr = String(item.isGroup ? item.groupId : item.questionId)
        const poolQuestion = poolMap.get(idStr)
        return {
          ...item,
          ...poolQuestion,
          ...(item.isGroup ? { groupId: item.groupId } : { questionId: item.questionId }),
          questionContent: item.questionContent || poolQuestion?.questionContent || poolQuestion?.content || item.contentSnapshot || '',
          content: item.content || poolQuestion?.content || item.contentSnapshot || '',
          contentSnapshot: item.contentSnapshot || item.questionContent || item.content || poolQuestion?.content || '',
          score: Number(item.score) || 1
        }
      })
    })
  } catch {
    formState.title = exam.title || ''
    formState.subjectId = exam.subjectId || ''
    formState.duration = Number(exam.duration ?? 90) || 90
    formState.isActive = !!exam.isActive
    formState.isPublic = exam.isPublic !== undefined ? !!exam.isPublic : true
    formState.startTime = exam.startTime || ''
    formState.endTime = exam.endTime || ''
    formState.type = exam.type || 'MULTIPLE_CHOICE'
    formState.shuffleQuestions = !!exam.shuffleQuestions
    formState.shuffleAnswers = !!exam.shuffleAnswers
    formState.maxAttempts = Number(exam.maxAttempts ?? 1) || 1
    formState.uiLayoutHint = exam.uiLayoutHint || 'STANDARD'
    formState.sections = [{ sectionName: 'Phần 1', items: [] }]

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

function openQuickRandomDialog() {
  isQuickRandomOpen.value = true
}

async function handleQuickRandomSuccess() {
  isQuickRandomOpen.value = false
  await loadData()
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
  return formState.sections.map(section => ({
    sectionName: section.sectionName,
    items: section.items.map((item) => {
      const base = {
        score: Number(item.score) || 1,
        contentSnapshot: item.contentSnapshot || item.questionContent || item.content || ''
      }
      if (item.isGroup) {
        base.groupId = item.groupId
      } else {
        base.questionId = item.questionId
      }
      return base
    })
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

  if (selectedQuestionCount.value === 0) {
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
      isPublic: !!formState.isPublic,
      startTime: formState.startTime || null,
      endTime: formState.endTime || null,
      totalScore: selectedQuestionTotalScore.value,
      type: formState.type,
      shuffleQuestions: !!formState.shuffleQuestions,
      shuffleAnswers: !!formState.shuffleAnswers,
      maxAttempts: Number(formState.maxAttempts) || 1,
      uiLayoutHint: formState.uiLayoutHint,
      sections: getRequestQuestionsPayload()
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

async function handleSaveAsNewExam() {
  const validationMessage = validateForm()
  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      title: formState.title.trim() + ' (Copy)',
      subjectId: Number(formState.subjectId) || formState.subjectId,
      duration: Number(formState.duration) || 0,
      isActive: !!formState.isActive,
      isPublic: !!formState.isPublic,
      startTime: formState.startTime || null,
      endTime: formState.endTime || null,
      totalScore: selectedQuestionTotalScore.value,
      type: formState.type,
      shuffleQuestions: !!formState.shuffleQuestions,
      shuffleAnswers: !!formState.shuffleAnswers,
      maxAttempts: Number(formState.maxAttempts) || 1,
      uiLayoutHint: formState.uiLayoutHint,
      sections: getRequestQuestionsPayload()
    }

    await examsAPI.create(payload)

    pagination.page = 0
    closeDialog()
    await loadData()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không tạo bản sao đề thi mới'
  } finally {
    isSaving.value = false
  }
}

function handleSubjectChangeInForm() {
  formState.sections = [{ sectionName: 'Phần 1', items: [] }]
  questionSearch.value = ''
  loadQuestionPool(formState.subjectId)
}

onMounted(loadData)
</script>

<template>
  <div class="app-page">
    <div class="space-y-8">
      <ExamPageHeader
        :is-loading="isLoading"
        :total-elements="pagination.totalElements"
        :active-exam-count="activeExamCount"
        :filtered-exam-label="filteredExamLabel"
        :page="pagination.page"
        :total-pages="pagination.totalPages"
        @refresh="loadData"
        @create="goToCreateExam"
        @quick-random="openQuickRandomDialog"
      />

      <div class="grid gap-6 lg:grid-cols-12">
        <div class="lg:col-span-12">
          <ExamFiltersPanel
            v-model:subjectId="filters.subjectId"
            v-model:type="filterType"
            v-model:active="filterActive"
            v-model:query="filterQuery"
            :subjects="metadataStore.subjects"
            :get-subject-name="getSubjectName"
            @change="onSubjectFilterChange"
          />
        </div>

        <div v-if="errorMessage" class="lg:col-span-12">
          <div class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ errorMessage }}
          </div>
        </div>

        <div class="lg:col-span-12">
          <ExamTable
            :exams="filteredExams"
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
        </div>
      </div>

      <!-- Modals -->
      <ExamFormDialog
        :open="isDialogOpen"
        :is-editing="isEditing"
        :subjects="metadataStore.subjects"
        :exam-type-options="examTypeOptions"
        :exam-layout-hints="EXAM_LAYOUT_HINTS"
        :form-state="formState"
        :selected-question-count="selectedQuestionCount"
        :selected-question-total-score="selectedQuestionTotalScore"
        :is-saving="isSaving"
        :is-question-pool-loading="isQuestionPoolLoading"
        :question-pool-error="questionPoolError"
        :error-message="errorMessage"
        :filtered-question-pool="filteredQuestionPool"
        :question-search="questionSearch"
        :get-subject-name="getSubjectName"
        :get-topic-label="getTopicLabel"
        :get-question-subject-label="getQuestionSubjectLabel"
        :get-type-label="getTypeLabel"
        :get-difficulty-label="getDifficultyLabel"
        :is-question-selected="isQuestionSelected"
        @close="closeDialog"
        @submit="handleSubmitExam"
        @submit-as-new="handleSaveAsNewExam"
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

      <QuickRandomExamDialog
        :open="isQuickRandomOpen"
        :subjects="metadataStore.subjects"
        :topics="metadataStore.topics"
        :get-subject-name="getSubjectName"
        @close="isQuickRandomOpen = false"
        @success="handleQuickRandomSuccess"
      />
    </div>
  </div>
</template>

