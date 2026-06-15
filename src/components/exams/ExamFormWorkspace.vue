<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { RefreshCw, Sparkles, Copy, Maximize, Minimize } from 'lucide-vue-next'

import ExamQuestionPoolTable from '@/components/exams/ExamQuestionPoolTable.vue'
import ExamSelectedQuestionsTable from '@/components/exams/ExamSelectedQuestionsTable.vue'

const isWorkspaceFullscreen = ref(false)
const targetSectionIndex = ref(0)

const props = defineProps({
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
  filteredQuestionPool: {
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
  },
  submitText: {
    type: String,
    default: 'Lưu'
  },
  cancelText: {
    type: String,
    default: 'Hủy'
  },
  examLayoutHints: {
    type: Array,
    default: () => []
  },
  defaultScorePerQuestion: {
    type: Number,
    default: 1.0
  }
})

const emit = defineEmits([
  'submit',
  'cancel',
  'subject-change',
  'refresh-question-pool',
  'select-all-visible',
  'clear-selected-questions',
  'toggle-question',
  'remove-question',
  'update:questionSearch',
  'update:defaultScorePerQuestion',
  'submit-as-new'
])

// Random Selection Logic
const randomCount = ref(10)
const selectedTopicId = ref('')

const showDetailedRandomPanel = ref(false)
const detailedRandomCounts = reactive({})

const uniqueTopics = computed(() => {
  const map = new Map()
  props.filteredQuestionPool.forEach(q => {
    if (q.topicId) {
      map.set(String(q.topicId), q.topicName || 'Chủ đề khác')
    }
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const detailedTopicList = computed(() => {
  const map = new Map()
  props.filteredQuestionPool.forEach(q => {
    if (q.topicId) {
      const topicIdStr = String(q.topicId)
      const diff = String(q.difficulty || 'EASY').toUpperCase()
      const current = map.get(topicIdStr) || {
        id: topicIdStr,
        name: q.topicName || 'Chủ đề khác',
        available: { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 }
      }
      current.available[diff] = (current.available[diff] || 0) + 1
      current.available.total += 1
      map.set(topicIdStr, current)
    }
  })
  return Array.from(map.values())
})

const detailedRandomTotalCount = computed(() => {
  return Object.values(detailedRandomCounts).reduce((sum, val) => sum + (Number(val) || 0), 0)
})

const topicFilteredQuestionPool = computed(() => {
  if (!selectedTopicId.value) return props.filteredQuestionPool
  return props.filteredQuestionPool.filter(q => String(q.topicId) === String(selectedTopicId.value))
})

watch(() => props.formState.subjectId, () => {
  selectedTopicId.value = ''
  showDetailedRandomPanel.value = false
  Object.keys(detailedRandomCounts).forEach(key => {
    delete detailedRandomCounts[key]
  })
})

function handleDetailedRandomDifficultyInput(topicId, level, available) {
  const key = `${topicId}_${level}`
  const val = Number(detailedRandomCounts[key]) || 0
  if (val < 0) {
    detailedRandomCounts[key] = 0
  } else if (val > available) {
    detailedRandomCounts[key] = available
  }
}

function selectRandomQuestions() {
  if (!topicFilteredQuestionPool.value.length) {
    alert('Không có câu hỏi nào trong kho để chọn!')
    return
  }

  const count = Math.min(Number(randomCount.value) || 1, topicFilteredQuestionPool.value.length)
  if (count <= 0) return

  const currentCount = props.formState.sections.reduce((acc, s) => acc + s.items.length, 0)
  const replace = confirm(`Bạn có muốn thay thế ${currentCount} câu hỏi đã chọn hiện tại bằng ${count} câu hỏi ngẫu nhiên mới không?`)
  
  if (replace) {
    props.formState.sections.forEach(s => s.items = [])
  }

  const shuffled = [...topicFilteredQuestionPool.value].sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, count)

  let addedCount = 0
  selected.forEach(question => {
    let exists = false
    for (const section of props.formState.sections) {
      if (section.items.some(q => question.isGroup ? String(q.groupId) === String(question.id) : String(q.questionId) === String(question.id))) {
        exists = true
        break
      }
    }
    
    if (!exists) {
      if (!props.formState.sections.length) {
        props.formState.sections.push({ sectionName: 'Phần 1. Trắc nghiệm', items: [] })
        targetSectionIndex.value = 0
      }
      const isGroup = !!question.isGroup
      props.formState.sections[targetSectionIndex.value].items.push({
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
        isGroup: isGroup,
        childQuestions: isGroup ? question.questions : undefined
      })
      addedCount++
    }
  })

  alert(`Đã thêm thành công ${addedCount} câu hỏi ngẫu nhiên từ kho học liệu vào đề thi!`)
}

function selectDetailedRandomQuestions() {
  if (detailedRandomTotalCount.value <= 0) return

  const currentCount = props.formState.sections.reduce((acc, s) => acc + s.items.length, 0)
  const replace = confirm(`Bạn có muốn thay thế ${currentCount} câu hỏi đã chọn hiện tại bằng ${detailedRandomTotalCount.value} câu hỏi ngẫu nhiên mới không?`)
  
  if (replace) {
    props.formState.sections.forEach(s => s.items = [])
  }

  let addedCount = 0

  detailedTopicList.value.forEach(item => {
    ['EASY', 'MEDIUM', 'HARD'].forEach(level => {
      const key = `${item.id}_${level}`
      const count = Number(detailedRandomCounts[key]) || 0
      if (count > 0) {
        const topicLevelQuestions = props.filteredQuestionPool.filter(
          q => String(q.topicId) === String(item.id) && String(q.difficulty || 'EASY').toUpperCase() === level
        )
        // Fisher-Yates shuffle
        const shuffled = [...topicLevelQuestions]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        const selected = shuffled.slice(0, Math.min(count, topicLevelQuestions.length))

        selected.forEach(question => {
          let exists = false
          for (const section of props.formState.sections) {
            if (section.items.some(q => question.isGroup ? String(q.groupId) === String(question.id) : String(q.questionId) === String(question.id))) {
              exists = true
              break
            }
          }
          
          if (!exists) {
            if (!props.formState.sections.length) {
              props.formState.sections.push({ sectionName: 'Phần 1', items: [] })
              targetSectionIndex.value = 0
            }
            const isGroup = !!question.isGroup
            props.formState.sections[targetSectionIndex.value].items.push({
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
              isGroup: isGroup,
              childQuestions: isGroup ? question.questions : undefined
            })
            addedCount++
          }
        })
      }
    })
  })

  showDetailedRandomPanel.value = false
  alert(`Đã thêm thành công ${addedCount} câu hỏi ngẫu nhiên từ cấu hình phân bổ chủ đề & độ khó vào đề thi!`)
}
</script>

<template>
  <div class="space-y-8">

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 1: Thông tin cơ bản                                       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div class="rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-primary/[0.02] shadow-sm dark:from-gray-900 dark:via-gray-900 dark:to-primary/[0.04]">
      <!-- Section header tab -->
      <div class="flex items-center gap-2.5 border-b border-border/40 px-6 py-4">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-[11px] font-black text-white shadow-sm">1</span>
        <h3 class="text-sm font-extrabold uppercase tracking-wide text-foreground">Thông tin cơ bản</h3>
      </div>

      <div class="p-6 space-y-6">
        <!-- Title field (full width, prominent) -->
        <div class="space-y-2">
          <label for="exam-title" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Tiêu đề đề thi</label>
          <input
            id="exam-title"
            v-model="formState.title"
            type="text"
            placeholder="Nhập tên đề thi hiển thị cho học sinh..."
            class="app-input !text-lg !font-bold !rounded-xl !border-primary/20 focus:!border-primary/50 !bg-white/80 dark:!bg-black/20"
          />
        </div>

        <!-- Two-column grid for core fields -->
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div class="space-y-2">
            <label for="exam-subject" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Môn học áp dụng</label>
            <select
              id="exam-subject"
              v-model="formState.subjectId"
              class="app-select"
              @change="emit('subject-change')"
            >
              <option value="">-- Chọn môn học --</option>
              <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
                {{ getSubjectName(subject.id, subject.name) }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="exam-duration" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Thời lượng (phút)</label>
            <input
              id="exam-duration"
              v-model.number="formState.duration"
              type="number"
              min="1"
              step="1"
              class="app-input"
            />
          </div>

          <div class="space-y-2">
            <label for="exam-max-attempts" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Số lần làm tối đa</label>
            <input
              id="exam-max-attempts"
              v-model.number="formState.maxAttempts"
              type="number"
              min="1"
              step="1"
              class="app-input"
            />
          </div>

          <div class="space-y-2">
            <label for="exam-start-time" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Ngày bắt đầu</label>
            <input
              id="exam-start-time"
              v-model="formState.startTime"
              type="datetime-local"
              class="app-input"
            />
          </div>

          <div class="space-y-2">
            <label for="exam-end-time" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Ngày kết thúc</label>
            <input
              id="exam-end-time"
              v-model="formState.endTime"
              type="datetime-local"
              class="app-input"
            />
          </div>

          <div class="space-y-2">
            <label for="exam-type" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Cấu trúc đề</label>
            <select
              id="exam-type"
              v-model="formState.type"
              class="app-select"
            >
              <option v-for="option in examTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label for="exam-layout-hint" class="text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Giao diện hiển thị</label>
            <select
              id="exam-layout-hint"
              v-model="formState.uiLayoutHint"
              class="app-select"
            >
              <option v-for="option in examLayoutHints" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- SECTION 2: Cấu hình nâng cao (checkboxes)                        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div class="rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-indigo-50/30 shadow-sm dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/20">
      <!-- Section header tab -->
      <div class="flex items-center gap-2.5 border-b border-border/40 px-6 py-4">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-black text-white shadow-sm">2</span>
        <h3 class="text-sm font-extrabold uppercase tracking-wide text-foreground">Cấu hình nâng cao</h3>
      </div>

      <div class="p-6">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label class="group relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-border/40 bg-white/70 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm dark:bg-black/20 dark:hover:bg-primary/[0.06]">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-foreground">Kích hoạt đề</span>
              <span class="text-[10px] text-muted-foreground/60">Cho phép học sinh làm bài</span>
            </div>
            <input v-model="formState.isActive" type="checkbox" class="absolute right-4 h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          </label>

          <label class="group relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-border/40 bg-white/70 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm dark:bg-black/20 dark:hover:bg-primary/[0.06]">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-foreground">Công khai đề</span>
              <span class="text-[10px] text-muted-foreground/60">Hiển thị trên danh sách</span>
            </div>
            <input v-model="formState.isPublic" type="checkbox" class="absolute right-4 h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          </label>

          <label class="group relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-border/40 bg-white/70 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm dark:bg-black/20 dark:hover:bg-primary/[0.06]">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-foreground">Trộn câu hỏi</span>
              <span class="text-[10px] text-muted-foreground/60">Xáo trộn thứ tự câu</span>
            </div>
            <input v-model="formState.shuffleQuestions" type="checkbox" class="absolute right-4 h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          </label>

          <label class="group relative flex cursor-pointer items-center gap-3.5 rounded-xl border border-border/40 bg-white/70 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm dark:bg-black/20 dark:hover:bg-primary/[0.06]">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 transition-colors group-hover:bg-violet-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-foreground">Trộn đáp án</span>
              <span class="text-[10px] text-muted-foreground/60">Xáo trộn thứ tự đáp án</span>
            </div>
            <input v-model="formState.shuffleAnswers" type="checkbox" class="absolute right-4 h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          </label>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- STATS BANNER — Gradient cards                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div class="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-indigo-500/[0.03] to-violet-500/[0.04] p-5 shadow-sm dark:from-primary/[0.08] dark:via-indigo-500/[0.06] dark:to-violet-500/[0.08]">
      <div class="flex flex-wrap items-stretch gap-4">
        <!-- Stat card 1: Câu hỏi đã chọn -->
        <div class="flex-1 min-w-[140px] rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 p-4 text-center dark:from-primary/20 dark:to-primary/10">
          <p class="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Câu hỏi đã chọn</p>
          <p class="text-3xl font-black text-primary leading-tight">{{ selectedQuestionCount }}</p>
          <p class="text-[10px] font-semibold text-muted-foreground mt-0.5">câu hỏi</p>
        </div>

        <!-- Stat card 2: Tổng điểm -->
        <div class="flex-1 min-w-[140px] rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-4 text-center dark:from-emerald-500/20 dark:to-emerald-500/10">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600/60 mb-1">Tổng điểm</p>
          <p class="text-3xl font-black text-emerald-600 leading-tight">{{ selectedQuestionTotalScore }}</p>
          <p class="text-[10px] font-semibold text-muted-foreground mt-0.5">điểm</p>
        </div>

        <!-- Stat card 3: Cấu hình điểm -->
        <div class="flex-1 min-w-[180px] rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/15 p-4 text-center dark:from-amber-500/20 dark:to-amber-500/10">
          <p class="text-[10px] font-black uppercase tracking-widest text-amber-600/60 mb-2">Điểm mặc định / câu</p>
          <input
            type="number"
            step="0.1"
            class="mx-auto block w-24 rounded-lg border border-amber-400/40 bg-white/80 px-3 py-1.5 text-center text-sm font-black text-amber-700 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:bg-black/30 dark:text-amber-400"
            :value="defaultScorePerQuestion"
            @input="$emit('update:defaultScorePerQuestion', parseFloat($event.target.value) || 0)"
          />
        </div>

        <!-- Random selector (only when subject is chosen) -->
        <div v-if="formState.subjectId" class="flex items-center">
          <div class="h-full w-px bg-border/30 mx-1 hidden lg:block"></div>
        </div>

        <div v-if="formState.subjectId" class="flex flex-wrap items-center gap-3 flex-1 min-w-[340px]">
          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Lọc chủ đề</label>
            <select
              v-model="selectedTopicId"
              class="app-select !py-1.5 !pl-3 !pr-8 !w-44 !text-xs font-bold !rounded-lg"
              :disabled="showDetailedRandomPanel"
            >
              <option value="">-- Tất cả chủ đề --</option>
              <option v-for="topic in uniqueTopics" :key="topic.id" :value="topic.id">
                {{ topic.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Số câu</label>
            <input
              v-model.number="randomCount"
              type="number"
              min="1"
              :max="topicFilteredQuestionPool.length"
              class="app-input !py-1.5 !px-3 !w-20 text-center text-xs font-bold !rounded-lg"
              placeholder="Số câu"
              :disabled="showDetailedRandomPanel"
            />
          </div>

          <div class="flex items-end gap-2 pb-px">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-4 py-[9px] text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              :disabled="showDetailedRandomPanel"
              @click="selectRandomQuestions"
            >
              <Sparkles class="h-3.5 w-3.5" /> Tạo đề ngẫu nhiên
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl px-4 py-[9px] text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              :class="showDetailedRandomPanel
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20'"
              @click="showDetailedRandomPanel = !showDetailedRandomPanel"
            >
              <Sparkles class="h-3.5 w-3.5" /> Cấu hình chi tiết
            </button>
          </div>
        </div>
      </div>

      <!-- ── Detailed Random Panel (collapsible) ────────────────────────── -->
      <div v-if="showDetailedRandomPanel && formState.subjectId" class="mt-5 rounded-xl border border-indigo-500/15 bg-white/60 p-5 shadow-inner dark:bg-black/20">
        <div class="flex items-center gap-2 mb-4">
          <Sparkles class="h-4 w-4 text-indigo-500 animate-pulse" />
          <span class="text-xs font-bold text-foreground">Thiết lập số câu ngẫu nhiên chi tiết cho từng chủ đề trong kho học liệu</span>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
          <div v-for="topic in detailedTopicList" :key="topic.id" class="rounded-xl border border-border/30 bg-gradient-to-br from-white to-slate-50/50 p-4 transition-all hover:border-indigo-500/20 hover:shadow-sm dark:from-gray-900 dark:to-gray-800/50">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-bold text-foreground truncate max-w-[150px]" :title="topic.name">{{ topic.name }}</span>
              <span class="text-[10px] bg-gradient-to-r from-primary/10 to-indigo-500/10 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/10">
                {{ topic.available.total }} câu khả dụng
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <!-- Easy -->
              <div class="space-y-1">
                <span class="text-[10px] font-black text-emerald-600 block text-center">Dễ ({{ topic.available.EASY || 0 }})</span>
                <input
                  v-model.number="detailedRandomCounts[topic.id + '_EASY']"
                  type="number"
                  min="0"
                  :max="topic.available.EASY || 0"
                  class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold !rounded-lg !border-emerald-500/20 focus:!border-emerald-500/40"
                  placeholder="0"
                  @input="handleDetailedRandomDifficultyInput(topic.id, 'EASY', topic.available.EASY || 0)"
                />
              </div>
              <!-- Medium -->
              <div class="space-y-1">
                <span class="text-[10px] font-black text-amber-600 block text-center">T.Bình ({{ topic.available.MEDIUM || 0 }})</span>
                <input
                  v-model.number="detailedRandomCounts[topic.id + '_MEDIUM']"
                  type="number"
                  min="0"
                  :max="topic.available.MEDIUM || 0"
                  class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold !rounded-lg !border-amber-500/20 focus:!border-amber-500/40"
                  placeholder="0"
                  @input="handleDetailedRandomDifficultyInput(topic.id, 'MEDIUM', topic.available.MEDIUM || 0)"
                />
              </div>
              <!-- Hard -->
              <div class="space-y-1">
                <span class="text-[10px] font-black text-rose-600 block text-center">Khó ({{ topic.available.HARD || 0 }})</span>
                <input
                  v-model.number="detailedRandomCounts[topic.id + '_HARD']"
                  type="number"
                  min="0"
                  :max="topic.available.HARD || 0"
                  class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold !rounded-lg !border-rose-500/20 focus:!border-rose-500/40"
                  placeholder="0"
                  @input="handleDetailedRandomDifficultyInput(topic.id, 'HARD', topic.available.HARD || 0)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border/30">
          <div class="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Tổng cộng cấu hình: <span class="text-base font-black">{{ detailedRandomTotalCount }}</span> câu hỏi
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="app-btn-secondary !py-2 !px-5 !text-xs !rounded-xl"
              @click="showDetailedRandomPanel = false"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="detailedRandomTotalCount <= 0"
              @click="selectDetailedRandomQuestions"
            >
              <Sparkles class="h-3.5 w-3.5" /> Áp dụng cấu hình ngẫu nhiên
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ERROR MESSAGE                                                     -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="errorMessage" class="flex items-center gap-3 rounded-xl border border-destructive/25 bg-gradient-to-r from-destructive/10 to-destructive/5 p-4 text-sm font-bold text-destructive shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ errorMessage }}
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- FULLSCREEN WORKSPACE — Question Pool + Selected Questions          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Teleport to="body" :disabled="!isWorkspaceFullscreen">
    <div
      class="transition-all duration-300"
      :class="isWorkspaceFullscreen
        ? 'fixed inset-0 z-[9999] bg-background p-6 rounded-none shadow-2xl overflow-hidden border-0 flex flex-col'
        : 'relative'"
    >
      <!-- Fullscreen header bar -->
      <div v-if="isWorkspaceFullscreen" class="flex items-center justify-between mb-5 pb-4 border-b border-border/40">
        <div class="flex items-center gap-3">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 shadow-md">
            <Maximize class="h-4 w-4 text-white" />
          </span>
          <h2 class="text-lg font-extrabold text-foreground">Chế độ xem toàn màn hình (Cấu trúc đề)</h2>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white/80 px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:shadow-md dark:bg-gray-800/80 cursor-pointer"
          @click="isWorkspaceFullscreen = false"
        >
          <Minimize class="h-4 w-4" /> Thu nhỏ không gian
        </button>
      </div>

      <!-- Normal mode: expand button -->
      <div v-else class="flex justify-end mb-4">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-gradient-to-r from-white to-slate-50 px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/30 dark:from-gray-800 dark:to-gray-900 cursor-pointer"
          @click="isWorkspaceFullscreen = true"
        >
          <Maximize class="h-4 w-4 text-primary" /> Phóng to toàn bộ không gian làm đề
        </button>
      </div>

      <!-- Two-column workspace grid -->
      <div class="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]" :class="isWorkspaceFullscreen ? 'flex-1 overflow-hidden' : ''">
        <!-- Left column: Question Pool -->
        <div class="flex flex-col gap-4 min-w-0">
          <!-- Section selector bar -->
          <div v-if="formState.sections.length > 0" class="flex items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] to-indigo-500/[0.03] p-3.5 shadow-sm">
            <label class="text-sm font-bold text-foreground whitespace-nowrap">Thêm câu hỏi vào:</label>
            <select v-model="targetSectionIndex" class="w-full max-w-xs rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-sm font-bold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-gray-800">
              <option v-for="(s, idx) in formState.sections" :value="idx" :key="idx">
                Phần {{ idx + 1 }} {{ s.sectionName ? `- ${s.sectionName}` : '' }}
              </option>
            </select>
            <span class="text-[10px] text-muted-foreground/60 ml-1 hidden sm:inline">(Các câu hỏi được chọn sẽ thêm vào phần này)</span>
          </div>

          <ExamQuestionPoolTable
            class="flex-1"
            :subject-id="formState.subjectId"
            :question-search="questionSearch"
            :filtered-question-pool="topicFilteredQuestionPool"
            :is-question-pool-loading="isQuestionPoolLoading"
            :question-pool-error="questionPoolError"
            :is-question-selected="isQuestionSelected"
            :get-question-subject-label="getQuestionSubjectLabel"
            :get-topic-label="getTopicLabel"
            :get-type-label="getTypeLabel"
            :get-difficulty-label="getDifficultyLabel"
            @update:questionSearch="emit('update:questionSearch', $event)"
            @reload="emit('refresh-question-pool')"
            @select-all="emit('select-all-visible', targetSectionIndex)"
            @toggle-question="emit('toggle-question', $event.question, $event.checked, targetSectionIndex)"
          />
        </div>

        <!-- Right column: Selected Questions -->
        <ExamSelectedQuestionsTable
          class="min-w-0"
          :form-state="formState"
          :get-topic-label="getTopicLabel"
          :get-question-subject-label="getQuestionSubjectLabel"
          @clear-all="emit('clear-selected-questions')"
          @remove-question="(id, isGroup) => emit('remove-question', id, isGroup)"
        />
      </div>
    </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- ACTION BUTTONS                                                    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div class="flex items-center justify-end gap-3 border-t border-border/40 pt-8">
      <button
        class="app-btn-secondary !px-8 !py-3 !rounded-xl !text-sm !font-bold"
        @click="emit('cancel')"
      >
        {{ cancelText }}
      </button>

      <button
        v-if="isEditing"
        class="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary/10 hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isSaving"
        @click="emit('submit-as-new')"
      >
        <Copy class="h-4 w-4" />
        Lưu thành đề mới (Tạo bản sao)
      </button>

      <button
        class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 px-12 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        :disabled="isSaving"
        @click="emit('submit')"
      >
        <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
        {{ submitText }}
      </button>
    </div>
  </div>
</template>
