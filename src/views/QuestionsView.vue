<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { filesAPI, levelsAPI, questionsAPI, subjectsAPI, topicsAPI } from '@/services/api'
import QuestionTable from '@/components/questions/QuestionTable.vue'
import QuestionFormDialog from '@/components/questions/QuestionFormDialog.vue'
import QuestionDetailDialog from '@/components/questions/QuestionDetailDialog.vue'
import { API_CONFIG } from '@/constants'
import { normalizeCollection, normalizeLevel, normalizeSubject, normalizeTopic, normalizeQuestion } from '@/utils/normalizers'

const questions = ref([])
const levels = ref([])
const subjects = ref([])
const topics = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const isDialogOpen = ref(false)
const isDetailOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const selectedQuestion = ref(null)
const filters = reactive({
  subjectId: '',
  topicId: ''
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

function getTopicName(topicId, fallbackName) {
  return topics.value.find(topic => String(topic.id) === String(topicId))?.name || fallbackName || '—'
}

function getTopicMeta(topicId) {
  return topics.value.find(topic => String(topic.id) === String(topicId)) || null
}

function getSubjectDisplayLabel(subject) {
  const levelLabel = subject.levelName || levels.value.find(level => String(level.id) === String(subject.levelId))?.name || ''
  return levelLabel ? `${subject.name} - ${levelLabel}` : subject.name
}

function getQuestionTypeLabel(type) {
  return String(type || '').toUpperCase() === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'
}

function getDifficultyLabel(difficulty) {
  const labels = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
  return labels[String(difficulty || '').toUpperCase()] || difficulty || '—'
}

const displayQuestions = computed(() =>
  questions.value.map(question => ({
    ...question,
    subjectLabel: getTopicMeta(question.topicId)?.subjectName || '—',
    levelLabel: getTopicMeta(question.topicId)?.levelName || '—',
    imageUrl: resolveMediaUrl(question.url),
    topicLabel: getTopicName(question.topicId, question.topicName),
    typeLabel: getQuestionTypeLabel(question.type),
    difficultyLabel: getDifficultyLabel(question.difficulty),
    creatorLabel: question.createdByUsername || '—',
    optionsCount: question.options?.length || 0
  }))
)

const filteredTopicOptions = computed(() => {
  if (!filters.subjectId) return topics.value
  return topics.value.filter(topic => String(topic.subjectId) === String(filters.subjectId))
})

function resetPageAndReload() {
  pagination.page = 0
  loadData()
}

function onSubjectFilterChange() {
  filters.topicId = ''
  resetPageAndReload()
}

function onTopicFilterChange() {
  resetPageAndReload()
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const queryParams = {
      page: pagination.page,
      size: pagination.size,
      sort: pagination.sort,
      ...(filters.subjectId ? { subjectId: Number(filters.subjectId) || filters.subjectId } : {}),
      ...(filters.topicId ? { topicId: Number(filters.topicId) || filters.topicId } : {})
    }

    const [levelsResponse, subjectsResponse, topicsResponse, questionsResponse] = await Promise.all([
      levelsAPI.getAll(),
      subjectsAPI.getAll(),
      topicsAPI.getAll(),
      questionsAPI.getAll(queryParams)
    ])

    levels.value = normalizeCollection(levelsResponse.data).map(normalizeLevel)
    subjects.value = normalizeCollection(subjectsResponse.data).map(normalizeSubject)
    topics.value = normalizeCollection(topicsResponse.data).map(normalizeTopic)

    const questionPage = questionsResponse.data?.data ?? questionsResponse.data ?? {}
    questions.value = normalizeCollection(questionPage).map(normalizeQuestion)
    pagination.totalElements = questionPage.totalElements ?? questions.value.length
    pagination.totalPages = questionPage.totalPages ?? 1
    pagination.numberOfElements = questionPage.numberOfElements ?? questions.value.length
    pagination.first = questionPage.first ?? pagination.page === 0
    pagination.last = questionPage.last ?? true
    pagination.hasNext = questionPage.hasNext ?? false
    pagination.hasPrevious = questionPage.hasPrevious ?? pagination.page > 0
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được dữ liệu câu hỏi'
  } finally {
    isLoading.value = false
  }
}

function openCreateDialog() {
  isEditing.value = false
  editId.value = null
  selectedQuestion.value = null
  errorMessage.value = ''
  isDialogOpen.value = true
}

async function openEditDialog(question) {
  errorMessage.value = ''
  isEditing.value = true
  editId.value = question.id

  try {
    const response = await questionsAPI.getById(question.id)
    selectedQuestion.value = normalizeQuestion(response.data?.data ?? response.data ?? question)
  } catch {
    selectedQuestion.value = normalizeQuestion(question)
  }

  isDialogOpen.value = true
}

async function openDetailDialog(question) {
  errorMessage.value = ''
  isDetailOpen.value = true

  try {
    const response = await questionsAPI.getById(question.id)
    selectedQuestion.value = normalizeQuestion(response.data?.data ?? response.data ?? question)
  } catch {
    selectedQuestion.value = normalizeQuestion(question)
  }
}

function closeDialog() {
  isDialogOpen.value = false
  errorMessage.value = ''
  selectedQuestion.value = null
}

function closeDetailDialog() {
  isDetailOpen.value = false
  selectedQuestion.value = null
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

async function deleteQuestion(question) {
  const confirmed = window.confirm(`Xóa câu hỏi: "${question.content}" ?`)
  if (!confirmed) return

  try {
    await questionsAPI.delete(question.id)
    questions.value = questions.value.filter(item => String(item.id) !== String(question.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được câu hỏi'
  }
}

async function handleSubmitQuestion(payload) {
  isSaving.value = true
  errorMessage.value = ''

  try {
    let uploadedUrl = payload.form.url || ''

    if (payload.imageFile) {
      const response = await filesAPI.upload(payload.imageFile)
      const uploaded = response.data?.data ?? response.data ?? {}
      uploadedUrl = uploaded.url || uploaded.fileUrl || uploaded.path || ''

      if (!uploadedUrl) {
        errorMessage.value = 'Upload ảnh không trả về url'
        return
      }
    }

    const normalizedType = payload.form.questionType === 'essay' ? 'ESSAY' : 'MCQ'
    const requestBody = {
      content: payload.form.content.trim(),
      contentFormat: payload.form.contentFormat,
      topicId: Number(payload.form.topicId) || payload.form.topicId,
      type: normalizedType,
      difficulty: payload.form.difficulty,
      url: uploadedUrl || null,
      options: payload.form.questionType === 'multiple_choice'
        ? payload.form.options
            .map(option => ({ content: option.content.trim(), isCorrect: !!option.isCorrect }))
            .filter(option => option.content)
        : [],
      sampleAnswer: payload.form.sampleAnswer?.trim() || '',
      explanation: payload.form.explanation?.trim() || ''
    }

    const response = isEditing.value && editId.value
      ? await questionsAPI.update(editId.value, requestBody)
      : await questionsAPI.create(requestBody)

    const savedQuestion = normalizeQuestion(response.data?.data ?? response.data ?? requestBody)
    questions.value = isEditing.value
      ? questions.value.map(item => String(item.id) === String(savedQuestion.id) ? savedQuestion : item)
      : [savedQuestion, ...questions.value.filter(item => String(item.id) !== String(savedQuestion.id))]

    closeDialog()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không lưu được câu hỏi'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="relative space-y-6 overflow-hidden rounded-[2rem] bg-gradient-to-b from-slate-50 via-background to-background p-1 dark:from-slate-950 dark:via-background dark:to-background">
    <div class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.14),_transparent_35%),radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%)]" />

    <section class="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Học liệu · Câu hỏi
          </div>
          <h1 class="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Quản lý Câu hỏi</h1>
        </div>

        <button
          class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
          @click="openCreateDialog"
        >
          <Plus class="h-4 w-4" />
          Thêm câu hỏi
        </button>
      </div>

      <div class="mt-2 flex items-center gap-1 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Tổng câu hỏi</p>
          <p class="mt-1 text-2xl font-black text-foreground">{{ pagination.totalElements }}</p>
        </div>
      </div>
    </section>

    <div class="rounded-[1.75rem] border border-border/70 bg-card/80 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-foreground">Bộ lọc</h2>
          <p class="text-xs text-muted-foreground">Chọn môn học hoặc topic để tải dữ liệu ngay.</p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div class="space-y-2">
          <label for="filter-subject-id" class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Môn học</label>
          <select
            id="filter-subject-id"
            v-model="filters.subjectId"
            class="w-full rounded-full border border-input bg-background/90 px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            @change="onSubjectFilterChange"
          >
            <option value="">Tất cả môn học</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ getSubjectDisplayLabel(subject) }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label for="filter-topic-id" class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Topic</label>
          <select
            id="filter-topic-id"
            v-model="filters.topicId"
            class="w-full rounded-full border border-input bg-background/90 px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="!filteredTopicOptions.length"
            @change="onTopicFilterChange"
          >
            <option value="">Tất cả topic</option>
            <option v-for="topic in filteredTopicOptions" :key="topic.id" :value="topic.id">
              {{ topic.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <QuestionTable
      :questions="displayQuestions"
      :pagination="pagination"
      :is-loading="isLoading"
      @prev-page="prevPage"
      @next-page="nextPage"
      @view="openDetailDialog"
      @edit="openEditDialog"
      @delete="deleteQuestion"
    />

    <QuestionFormDialog
      :open="isDialogOpen"
      :is-editing="isEditing"
      :loading="isSaving"
      :error-message="errorMessage"
      :question="selectedQuestion"
      :levels="levels"
      :subjects="subjects"
      :topics="topics"
      @close="closeDialog"
      @submit="handleSubmitQuestion"
    />

    <QuestionDetailDialog
      :open="isDetailOpen"
      :question="selectedQuestion"
      @close="closeDetailDialog"
    />
  </div>
</template>

