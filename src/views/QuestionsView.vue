<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { filesAPI, questionsAPI } from '@/services/api'
import { useMetadataStore } from '@/stores/metadataStore'
import QuestionTable from '@/components/questions/QuestionTable.vue'
import QuestionFormDialog from '@/components/questions/QuestionFormDialog.vue'
import QuestionDetailDialog from '@/components/questions/QuestionDetailDialog.vue'
import AiGenerateQuestionsDialog from '@/components/questions/AiGenerateQuestionsDialog.vue'
import ImportExcelDialog from '@/components/questions/ImportExcelDialog.vue'
import { Sparkles, FileSpreadsheet } from 'lucide-vue-next'
import { API_CONFIG } from '@/constants'
import { normalizeCollection, normalizeLevel, normalizeSubject, normalizeTopic, normalizeQuestion } from '@/utils/normalizers'

const metadataStore = useMetadataStore()
const questions = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const isDialogOpen = ref(false)
const isDetailOpen = ref(false)
const isAiGenerateOpen = ref(false)
const isImportExcelOpen = ref(false)
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

  const apiBase = API_CONFIG.BASE_URL || ''
  let origin = apiBase
  
  if (apiBase.includes('/api')) {
    origin = apiBase.split('/api')[0]
  }

  const normalizedPath = String(url).startsWith('/') ? String(url) : `/${url}`
  return `${origin}${normalizedPath}`
}

function getTopicName(topicId, fallbackName) {
  return metadataStore.getTopicName(topicId, fallbackName)
}

function getTopicMeta(topicId) {
  return metadataStore.getTopicMeta(topicId)
}

function getSubjectDisplayLabel(subject) {
  const levelLabel = subject.levelName || metadataStore.levels.find(level => String(level.id) === String(subject.levelId))?.name || ''
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
  if (!filters.subjectId) return metadataStore.topics
  return metadataStore.topics.filter(topic => String(topic.subjectId) === String(filters.subjectId))
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

    const questionsResponse = await questionsAPI.getAll(queryParams)

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
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl overflow-hidden relative group">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div class="app-kicker">Học liệu & Hệ thống</div>
            <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Quản lý Câu hỏi</h1>
            <p class="mt-2 text-muted-foreground font-medium">Kho lưu trữ câu hỏi trắc nghiệm và tự luận được phân loại chi tiết.</p>
          </div>

          <div class="flex items-center gap-3">
            <button class="app-btn-secondary group border-green-200 text-green-700 hover:bg-green-50" @click="isImportExcelOpen = true">
              <FileSpreadsheet class="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
              Nhập Excel
            </button>
            <button class="app-btn-secondary group border-indigo-200 text-indigo-700 hover:bg-indigo-50" @click="isAiGenerateOpen = true">
              <Sparkles class="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              Tạo bằng AI
            </button>
            <button class="app-btn-primary group" @click="openCreateDialog">
              <Plus class="h-5 w-5 transition-transform group-hover:rotate-90" />
              Thêm câu hỏi mới
            </button>
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tổng số câu hỏi</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-primary">{{ pagination.totalElements }}</p>
              <p class="text-xs font-bold text-muted-foreground">câu hỏi</p>
            </div>
          </div>
        </div>

        <!-- Decorative background circle -->
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]"></div>
      </section>

      <!-- Filter Section -->
      <div class="app-surface p-6 shadow-xl">
        <div class="mb-6">
          <h2 class="text-base font-bold text-foreground">Bộ lọc tìm kiếm</h2>
          <p class="text-xs text-muted-foreground">Lọc câu hỏi theo môn học và chủ đề để quản lý dễ dàng hơn.</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-subject">Môn học</label>
            <select
              id="filter-subject"
              v-model="filters.subjectId"
              class="app-select"
              @change="onSubjectFilterChange"
            >
              <option value="">Tất cả môn học</option>
              <option v-for="subject in metadataStore.subjects" :key="subject.id" :value="subject.id">
                {{ getSubjectDisplayLabel(subject) }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-topic">Chủ đề (Topic)</label>
            <select
              id="filter-topic"
              v-model="filters.topicId"
              class="app-select"
              :disabled="!filteredTopicOptions.length"
              @change="onTopicFilterChange"
            >
              <option value="">Tất cả chủ đề</option>
              <option v-for="topic in filteredTopicOptions" :key="topic.id" :value="topic.id">
                {{ topic.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
    </div>

    <!-- Modals -->
    <QuestionFormDialog
      :open="isDialogOpen"
      :is-editing="isEditing"
      :loading="isSaving"
      :error-message="errorMessage"
      :question="selectedQuestion"
      :levels="metadataStore.levels"
      :subjects="metadataStore.subjects"
      :topics="metadataStore.topics"
      @close="closeDialog"
      @submit="handleSubmitQuestion"
    />

    <QuestionDetailDialog
      :open="isDetailOpen"
      :question="selectedQuestion"
      @close="closeDetailDialog"
    />

    <AiGenerateQuestionsDialog
      :open="isAiGenerateOpen"
      :topics="metadataStore.topics"
      @close="isAiGenerateOpen = false"
      @generated="loadData"
    />

    <ImportExcelDialog
      :open="isImportExcelOpen"
      @close="isImportExcelOpen = false"
      @imported="loadData"
    />
  </div>
</template>

