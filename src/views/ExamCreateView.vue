<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { examsAPI, questionsAPI, subjectsAPI, topicsAPI } from '@/services/api'
import ExamFormWorkspace from '@/components/exams/ExamFormWorkspace.vue'
import { normalizeCollection, normalizeSubject, normalizeTopic, normalizeQuestion } from '@/utils/normalizers'
import { EXAM_LAYOUT_HINTS } from '@/constants'

const router = useRouter()
const route = useRoute()
const subjectId = route.query.subjectId

const defaultScorePerQuestion = ref(1.0)
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
      score: isGroup ? defaultScorePerQuestion.value * (question.questions?.length || 1) : defaultScorePerQuestion.value,
      isGroup: isGroup,
      childQuestions: isGroup ? question.questions : undefined
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

function selectAllVisibleQuestions(sectionIndex = 0) {
  filteredQuestionPool.value.forEach(question => {
    if (!isQuestionSelected(question.id, !!question.isGroup)) {
      toggleQuestionSelection(question, true, sectionIndex)
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
       content: `[Nhóm câu hỏi] ${g.title || g.name || ''}`,
       topicId: g.topicId,
       topicName: g.topicName,
       subjectId: g.subjectId,
       difficulty: g.difficulty || '',
       type: 'READING_COMPREHENSION',
       isGroup: true,
       questions: g.questions || []
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

const selectedQuestionCount = computed(() => formState.sections.reduce((count, section) => {
  return count + section.items.reduce((itemCount, item) => {
    if (item.isGroup && item.childQuestions) {
      return itemCount + item.childQuestions.length;
    }
    return itemCount + 1;
  }, 0);
}, 0))

const selectedQuestionTotalScore = computed(() =>
  formState.sections.reduce((sum, section) => {
    return sum + section.items.reduce((s, item) => s + (Number(item.score) || 0), 0)
  }, 0)
)

function validateForm() {
  if (!formState.title.trim()) return 'Vui lòng nhập tên đề thi'
  if (!formState.subjectId) return 'Vui lòng chọn môn học'
  if (!Number(formState.duration) || Number(formState.duration) <= 0) return 'Vui lòng nhập thời lượng hợp lệ'
  if (!formState.type) return 'Vui lòng chọn loại đề thi'
  if (selectedQuestionCount.value === 0) return 'Vui lòng chọn ít nhất một câu hỏi cho đề thi'
  return ''
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
    })

    router.push('/exams')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không lưu được đề thi'
  } finally {
    isSaving.value = false
  }
}

function handleSubjectChangeInForm() {
  formState.sections = [{ sectionName: 'Phần 1', items: [] }]
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
  <div class="app-page">
    <div class="space-y-8">
      <section class="app-surface p-8 shadow-2xl overflow-hidden relative group">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div class="app-kicker">Học liệu · Đề thi</div>
            <h1 class="mt-3 text-4xl font-black tracking-tight text-foreground">Thêm đề thi</h1>
            <p class="mt-2 max-w-2xl text-muted-foreground font-medium">
              Tạo đề thi mới theo đúng môn học, chọn câu hỏi và cấu hình đề trên một trang riêng.
            </p>
          </div>

          <button
            class="app-btn-secondary group"
            @click="goBack"
          >
            <ArrowLeft class="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Quay lại danh sách
          </button>
        </div>
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]"></div>
      </section>

      <section class="app-surface shadow-xl p-8 lg:p-10 overflow-hidden">
        <ExamFormWorkspace
          v-model:defaultScorePerQuestion="defaultScorePerQuestion"
          :is-editing="false"
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
          :question-search="questionSearch"
          :get-subject-name="getSubjectName"
          :get-topic-label="getTopicLabel"
          :get-question-subject-label="getQuestionSubjectLabel"
          :get-type-label="getTypeLabel"
          :get-difficulty-label="getDifficultyLabel"
          :is-question-selected="isQuestionSelected"
          :exam-layout-hints="EXAM_LAYOUT_HINTS"
          submit-text="Tạo đề thi"
          cancel-text="Quay lại"
          @cancel="goBack"
          @submit="handleSubmitExam"
          @subject-change="handleSubjectChangeInForm"
          @refresh-question-pool="loadQuestionPool(formState.subjectId)"
          @select-all-visible="(idx) => selectAllVisibleQuestions(idx)"
          @clear-selected-questions="clearSelectedQuestions"
          @toggle-question="(q, checked, idx) => toggleQuestionSelection(q, checked, idx)"
          @remove-question="removeQuestionFromSelection"
          @update:questionSearch="questionSearch = $event"
        />
      </section>
    </div>
  </div>
</template>


