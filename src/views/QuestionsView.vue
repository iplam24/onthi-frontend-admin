<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { filesAPI, questionsAPI } from '@/services/api'
import { useMetadataStore } from '@/stores/metadataStore'
import QuestionTable from '@/components/questions/QuestionTable.vue'
import QuestionFormDialog from '@/components/questions/QuestionFormDialog.vue'
import QuestionDetailDialog from '@/components/questions/QuestionDetailDialog.vue'
import QuestionGroupFormDialog from '@/components/questions/QuestionGroupFormDialog.vue'
import QuestionGroupDetailDialog from '@/components/questions/QuestionGroupDetailDialog.vue'
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
const isGroupDialogOpen = ref(false)
const isGroupDetailOpen = ref(false)
const isAiGenerateOpen = ref(false)
const isImportExcelOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const selectedQuestion = ref(null)
const activeTab = ref('SINGLE')
const filters = reactive({
  subjectId: '',
  topicId: ''
})

// Client-side advanced filters
const filterDifficulty = ref('ALL')
const filterType = ref('ALL')
const filterQuery = ref('')
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

import { resolveBackendUrl } from '@/utils/url'

function resolveMediaUrl(url) {
  return resolveBackendUrl(url)
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

const filteredDisplayQuestions = computed(() => {
  return displayQuestions.value.filter(question => {
    // Difficulty filter
    if (filterDifficulty.value !== 'ALL' && String(question.difficulty).toUpperCase() !== filterDifficulty.value) {
      return false
    }
    // Type filter
    if (filterType.value !== 'ALL' && String(question.type).toUpperCase() !== filterType.value) {
      return false
    }
    // Quick search filter
    if (filterQuery.value) {
      const q = filterQuery.value.toLowerCase().trim()
      const content = String(question.content || '').toLowerCase()
      const explanation = String(question.explanation || '').toLowerCase()
      if (!content.includes(q) && !explanation.includes(q)) {
        return false
      }
    }
    return true
  })
})

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

    let questionsResponse;
    if (activeTab.value === 'GROUP') {
      questionsResponse = await questionsAPI.getGroups(queryParams)
    } else {
      questionsResponse = await questionsAPI.getAll(queryParams)
    }

    const questionPage = questionsResponse.data?.data ?? questionsResponse.data ?? {}
    
    if (activeTab.value === 'GROUP') {
      questions.value = normalizeCollection(questionPage).map(g => ({
         id: g.id,
         content: `<div class="mb-2 text-primary font-bold">[Nhóm câu hỏi] ${g.title || g.name || ''}</div><div>${g.content || ''}</div>`,
         explanation: g.content,
         topicId: g.topicId,
         topicName: g.topicName,
         subjectId: g.subjectId,
         difficulty: g.difficulty || 'MEDIUM',
         type: 'READING_COMPREHENSION',
         isGroup: true,
         questions: (g.questions || []).map(normalizeQuestion)
      }))
    } else {
      questions.value = normalizeCollection(questionPage).map(normalizeQuestion)
    }
    
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
  if (activeTab.value === 'GROUP') {
    isGroupDialogOpen.value = true
  } else {
    isDialogOpen.value = true
  }
}

async function openEditDialog(question) {
  errorMessage.value = ''
  isEditing.value = true
  editId.value = question.id

  if (question.isGroup) {
    try {
      const response = await questionsAPI.getGroupById(question.id)
      selectedQuestion.value = response.data?.data ?? response.data ?? question
    } catch {
      selectedQuestion.value = question
    }
    isGroupDialogOpen.value = true
  } else {
    try {
      const response = await questionsAPI.getById(question.id)
      selectedQuestion.value = normalizeQuestion(response.data?.data ?? response.data ?? question)
    } catch {
      selectedQuestion.value = normalizeQuestion(question)
    }
    isDialogOpen.value = true
  }
}

async function openDetailDialog(question) {
  errorMessage.value = ''

  if (question.isGroup) {
    try {
      const response = await questionsAPI.getGroupById(question.id)
      selectedQuestion.value = response.data?.data ?? response.data ?? question
    } catch {
      selectedQuestion.value = question
    }
    isGroupDetailOpen.value = true
  } else {
    try {
      const response = await questionsAPI.getById(question.id)
      selectedQuestion.value = normalizeQuestion(response.data?.data ?? response.data ?? question)
    } catch {
      selectedQuestion.value = normalizeQuestion(question)
    }
    isDetailOpen.value = true
  }
}

function closeDialog() {
  isDialogOpen.value = false
  isGroupDialogOpen.value = false
  errorMessage.value = ''
  selectedQuestion.value = null
}

function closeDetailDialog() {
  isDetailOpen.value = false
  isGroupDetailOpen.value = false
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
  const confirmed = window.confirm(`Xóa ${question.isGroup ? 'nhóm câu hỏi' : 'câu hỏi'}: "${question.content}" ?`)
  if (!confirmed) return

  try {
    // Note: If you have a specific endpoint for deleting groups, call it here. 
    // Assuming questionsAPI.delete handles both or there's a groupsAPI.delete
    if (question.isGroup && questionsAPI.deleteGroup) {
        await questionsAPI.deleteGroup(question.id)
    } else {
        await questionsAPI.delete(question.id)
    }
    questions.value = questions.value.filter(item => String(item.id) !== String(question.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được dữ liệu'
  }
}

async function handleSubmitQuestion(payload) {
  isSaving.value = true
  errorMessage.value = ''

  try {
    if (payload.isGroup) {
      await questionsAPI.createGroup(payload.form)
      loadData()
      closeDialog()
      return
    }

    let uploadedUrl = payload.form.url || ''
    let uploadedAudioUrl = payload.form.audioUrl || ''

    if (payload.imageFile) {
      const response = await filesAPI.upload(payload.imageFile)
      const uploaded = response.data?.data ?? response.data ?? {}
      uploadedUrl = uploaded.url || uploaded.fileUrl || uploaded.path || ''

      if (!uploadedUrl) {
        errorMessage.value = 'Upload ảnh không trả về url'
        return
      }
    }

    if (payload.audioFile) {
      const response = await filesAPI.upload(payload.audioFile)
      const uploaded = response.data?.data ?? response.data ?? {}
      uploadedAudioUrl = uploaded.url || uploaded.fileUrl || uploaded.path || ''

      if (!uploadedAudioUrl) {
        errorMessage.value = 'Upload audio không trả về url'
        return
      }
    }

    const toApiType = (qt) => {
      if (qt === 'essay') return 'ESSAY'
      if (qt === 'listening') return 'LISTENING'
      if (qt === 'speaking') return 'SPEAKING'
      return 'MCQ'
    }
    const normalizedType = toApiType(payload.form.questionType)
    const requestBody = {
      content: payload.form.content.trim(),
      contentFormat: payload.form.contentFormat,
      topicId: Number(payload.form.topicId) || payload.form.topicId,
      type: normalizedType,
      difficulty: payload.form.difficulty,
      url: uploadedUrl || null,
      audioUrl: uploadedAudioUrl || null,
      options: payload.form.questionType === 'multiple_choice' || payload.form.questionType === 'listening'
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

async function handleSubmitGroup(payload) {
  isSaving.value = true
  errorMessage.value = ''
  try {
    if (isEditing.value && editId.value) {
      await questionsAPI.updateGroup(editId.value, payload)
    } else {
      await questionsAPI.createGroup(payload)
    }
    loadData()
    closeDialog()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Lỗi lưu nhóm câu hỏi'
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
          <h2 class="text-base font-bold text-foreground">Bộ lọc tìm kiếm câu hỏi</h2>
          <p class="text-xs text-muted-foreground">Kết hợp lọc môn học/chủ đề từ máy chủ với bộ lọc chi tiết ở trình duyệt.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <!-- Môn học (Server) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-subject">Môn học (Server)</label>
            <select
              id="filter-subject"
              v-model="filters.subjectId"
              class="app-select !py-2.5 shadow-sm"
              @change="onSubjectFilterChange"
            >
              <option value="">Tất cả môn học</option>
              <option v-for="subject in metadataStore.subjects" :key="subject.id" :value="subject.id">
                {{ getSubjectDisplayLabel(subject) }}
              </option>
            </select>
          </div>

          <!-- Chủ đề (Server) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-topic">Chủ đề (Server)</label>
            <select
              id="filter-topic"
              v-model="filters.topicId"
              class="app-select !py-2.5 shadow-sm"
              :disabled="!filteredTopicOptions.length"
              @change="onTopicFilterChange"
            >
              <option value="">Tất cả chủ đề</option>
              <option v-for="topic in filteredTopicOptions" :key="topic.id" :value="topic.id">
                {{ topic.name }}
              </option>
            </select>
          </div>

          <!-- Độ khó (Client) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-difficulty">Độ khó (Client)</label>
            <select
              id="filter-difficulty"
              v-model="filterDifficulty"
              class="app-select !py-2.5 shadow-sm"
            >
              <option value="ALL">Tất cả độ khó</option>
              <option value="EASY">Dễ (EASY)</option>
              <option value="MEDIUM">Trung bình (MEDIUM)</option>
              <option value="HARD">Khó (HARD)</option>
            </select>
          </div>

          <!-- Loại câu hỏi (Client) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-type">Loại câu hỏi (Client)</label>
            <select
              id="filter-type"
              v-model="filterType"
              class="app-select !py-2.5 shadow-sm"
            >
              <option value="ALL">Tất cả các loại</option>
              <option value="MCQ">Trắc nghiệm (MCQ)</option>
              <option value="ESSAY">Tự luận (ESSAY)</option>
            </select>
          </div>

          <!-- Tìm nội dung (Client) -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70" for="filter-query">Lọc nội dung (Client)</label>
            <div class="relative group/search-client">
              <input
                id="filter-query"
                v-model="filterQuery"
                type="text"
                placeholder="Lọc nhanh câu hỏi..."
                class="app-input !py-2.5 !pl-9 shadow-sm"
              >
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMessage }}
      </div>

      <!-- Tabs -->
      <div class="flex gap-6 border-b border-border px-2">
        <button
          class="pb-3 text-sm font-bold transition-all relative"
          :class="activeTab === 'SINGLE' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'SINGLE'; resetPageAndReload()"
        >
          Câu hỏi đơn
          <div v-if="activeTab === 'SINGLE'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
        </button>
        <button
          class="pb-3 text-sm font-bold transition-all relative"
          :class="activeTab === 'GROUP' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'GROUP'; resetPageAndReload()"
        >
          Nhóm câu hỏi (Đoạn văn)
          <div v-if="activeTab === 'GROUP'" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
        </button>
      </div>

      <QuestionTable
        :questions="filteredDisplayQuestions"
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

    <QuestionGroupFormDialog
      :is-open="isGroupDialogOpen"
      :is-editing="isEditing"
      :loading="isSaving"
      :error-message="errorMessage"
      :group="selectedQuestion"
      :levels="metadataStore.levels"
      :subjects="metadataStore.subjects"
      :topics="metadataStore.topics"
      @close="closeDialog"
      @submit="handleSubmitGroup"
    />

    <QuestionDetailDialog
      :open="isDetailOpen"
      :question="selectedQuestion"
      @close="closeDetailDialog"
    />

    <QuestionGroupDetailDialog
      :is-open="isGroupDetailOpen"
      :group="selectedQuestion"
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

