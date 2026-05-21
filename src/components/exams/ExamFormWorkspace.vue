<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { RefreshCw, Sparkles, Copy } from 'lucide-vue-next'
import ExamQuestionPoolTable from '@/components/exams/ExamQuestionPoolTable.vue'
import ExamSelectedQuestionsTable from '@/components/exams/ExamSelectedQuestionsTable.vue'

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
  selectedQuestionsSorted: {
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

  const replace = confirm(`Bạn có muốn thay thế ${props.formState.questions.length} câu hỏi đã chọn hiện tại bằng ${count} câu hỏi ngẫu nhiên mới không?`)
  
  if (replace) {
    props.formState.questions.splice(0, props.formState.questions.length)
  }

  const shuffled = [...topicFilteredQuestionPool.value].sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, count)

  let addedCount = 0
  selected.forEach(question => {
    const exists = props.formState.questions.some(q => String(q.questionId) === String(question.id))
    if (!exists) {
      props.formState.questions.push({
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
        orderIndex: props.formState.questions.length + 1,
        score: 1
      })
      addedCount++
    }
  })

  alert(`Đã thêm thành công ${addedCount} câu hỏi ngẫu nhiên từ kho học liệu vào đề thi!`)
}

function selectDetailedRandomQuestions() {
  if (detailedRandomTotalCount.value <= 0) return

  const replace = confirm(`Bạn có muốn thay thế ${props.formState.questions.length} câu hỏi đã chọn hiện tại bằng ${detailedRandomTotalCount.value} câu hỏi ngẫu nhiên mới không?`)
  
  if (replace) {
    props.formState.questions.splice(0, props.formState.questions.length)
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
          const exists = props.formState.questions.some(q => String(q.questionId) === String(question.id))
          if (!exists) {
            props.formState.questions.push({
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
              orderIndex: props.formState.questions.length + 1,
              score: 1
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
  <div class="space-y-10">
    <!-- Basic Information Grid -->
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="space-y-3 lg:col-span-2">
        <label for="exam-title" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Tiêu đề đề thi</label>
        <input
          id="exam-title"
          v-model="formState.title"
          type="text"
          placeholder="Nhập tên đề thi hiển thị cho học sinh..."
          class="app-input !text-lg !font-bold"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-subject" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Môn học áp dụng</label>
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

      <div class="space-y-3">
        <label for="exam-duration" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Thời lượng (phút)</label>
        <input
          id="exam-duration"
          v-model.number="formState.duration"
          type="number"
          min="1"
          step="1"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-start-time" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Ngày bắt đầu</label>
        <input
          id="exam-start-time"
          v-model="formState.startTime"
          type="datetime-local"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-end-time" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Ngày kết thúc</label>
        <input
          id="exam-end-time"
          v-model="formState.endTime"
          type="datetime-local"
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="exam-type" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Cấu trúc đề</label>
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

      <div class="space-y-3">
        <label for="exam-layout-hint" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Giao diện hiển thị</label>
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

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:col-span-2">
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.isActive" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Kích hoạt đề</span>
        </label>
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.isPublic" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Công khai đề</span>
        </label>
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.shuffleQuestions" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Trộn câu hỏi</span>
        </label>
        <label class="group flex cursor-pointer items-center gap-3 rounded-2xl border border-border/50 bg-white/50 p-4 transition-all hover:bg-primary/5 dark:bg-black/20">
          <input v-model="formState.shuffleAnswers" type="checkbox" class="h-5 w-5 rounded border-border text-primary focus:ring-primary/20" />
          <span class="text-sm font-bold text-foreground">Trộn đáp án</span>
        </label>
      </div>

      <div class="space-y-3">
        <label for="exam-max-attempts" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Số lần làm tối đa</label>
        <input
          id="exam-max-attempts"
          v-model.number="formState.maxAttempts"
          type="number"
          min="1"
          step="1"
          class="app-input"
        />
      </div>

      <div class="rounded-2xl bg-primary/5 border border-primary/20 p-6 lg:col-span-2 animate-all">
        <div class="flex flex-wrap items-center justify-between gap-6 text-sm">
          <div class="flex items-center gap-6">
            <div class="flex flex-col">
              <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Câu hỏi đã chọn</span>
              <span class="text-xl font-black text-primary">{{ selectedQuestionCount }} câu</span>
            </div>
            <div class="h-8 w-px bg-border/50"></div>
            <div class="flex flex-col">
              <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tổng điểm</span>
              <span class="text-xl font-black text-primary">{{ selectedQuestionTotalScore }}</span>
            </div>
          </div>

          <!-- Random Selector controls -->
          <div v-if="formState.subjectId" class="flex flex-wrap items-center gap-3">
            <div class="h-8 w-px bg-border/20 hidden md:block"></div>
            
            <div class="flex items-center gap-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Lọc chủ đề:</label>
              <select
                v-model="selectedTopicId"
                class="app-select !py-1.5 !pl-3 !pr-8 !w-44 !text-xs font-bold bg-white/70"
                :disabled="showDetailedRandomPanel"
              >
                <option value="">-- Tất cả chủ đề --</option>
                <option v-for="topic in uniqueTopics" :key="topic.id" :value="topic.id">
                  {{ topic.name }}
                </option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Số câu ngẫu nhiên:</label>
              <input
                v-model.number="randomCount"
                type="number"
                min="1"
                :max="topicFilteredQuestionPool.length"
                class="app-input !py-1.5 !px-3 !w-20 text-center text-xs font-bold"
                placeholder="Số câu"
                :disabled="showDetailedRandomPanel"
              />
            </div>
            <button
              type="button"
              class="app-btn-secondary !py-2.5 !px-5 !text-xs !bg-primary/10 hover:!bg-primary/25 !border-transparent !text-primary flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="showDetailedRandomPanel"
              @click="selectRandomQuestions"
            >
              <Sparkles class="h-3.5 w-3.5" /> Tạo đề ngẫu nhiên
            </button>

            <!-- Detailed Toggle Button -->
            <button
              type="button"
              class="app-btn-secondary !py-2.5 !px-5 !text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              :class="showDetailedRandomPanel ? 'bg-primary text-white border-transparent' : '!bg-indigo-500/10 hover:!bg-indigo-500/25 !border-transparent !text-indigo-600'"
              @click="showDetailedRandomPanel = !showDetailedRandomPanel"
            >
              <Sparkles class="h-3.5 w-3.5" /> Cấu hình chi tiết
            </button>
          </div>
        </div>

        <!-- Collapsible Detailed Topic Partitioning Panel -->
        <div v-if="showDetailedRandomPanel && formState.subjectId" class="mt-6 pt-6 border-t border-primary/10 space-y-4 transition-all">
          <div class="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <Sparkles class="h-4 w-4 text-primary animate-pulse" />
            Thiết lập số câu ngẫu nhiên chi tiết cho từng chủ đề trong kho học liệu
          </div>
          
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="topic in detailedTopicList" :key="topic.id" class="p-4 rounded-2xl bg-white/40 border border-border/40 hover:border-primary/20 transition-all dark:bg-black/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-foreground truncate max-w-[150px]" :title="topic.name">{{ topic.name }}</span>
                <span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
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
                    class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold"
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
                    class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold"
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
                    class="app-input !py-1 !px-1.5 text-center text-[11px] font-bold"
                    placeholder="0"
                    @input="handleDetailedRandomDifficultyInput(topic.id, 'HARD', topic.available.HARD || 0)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 pt-3 border-t border-primary/5">
            <div class="text-xs font-bold text-primary">
              Tổng cộng cấu hình: <span class="text-sm font-black">{{ detailedRandomTotalCount }}</span> câu hỏi
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="app-btn-secondary !py-2 !px-4 !text-xs !border-transparent !bg-muted/10 hover:!bg-muted/20"
                @click="showDetailedRandomPanel = false"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                class="app-btn-primary !py-2 !px-6 !text-xs bg-gradient-to-r from-primary to-indigo-600 shadow-sm flex items-center gap-1.5 cursor-pointer"
                :disabled="detailedRandomTotalCount <= 0"
                @click="selectDetailedRandomQuestions"
              >
                <Sparkles class="h-3.5 w-3.5" /> Áp dụng cấu hình ngẫu nhiên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ExamQuestionPoolTable
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
        @select-all="emit('select-all-visible')"
        @toggle-question="emit('toggle-question', $event.question, $event.checked)"
      />

      <ExamSelectedQuestionsTable
        :selected-questions-sorted="selectedQuestionsSorted"
        :get-topic-label="getTopicLabel"
        :get-question-subject-label="getQuestionSubjectLabel"
        @clear-all="emit('clear-selected-questions')"
        @remove-question="emit('remove-question', $event)"
      />
    </div>

    <div class="flex items-center justify-end gap-3 border-t border-border/50 pt-6">
      <button class="app-btn-secondary !px-8" @click="emit('cancel')">
        {{ cancelText }}
      </button>
      <button
        v-if="isEditing"
        class="app-btn-secondary !px-6 !border-primary/20 hover:!bg-primary/5 !text-primary flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
        :disabled="isSaving"
        @click="emit('submit-as-new')"
      >
        <Copy class="h-4 w-4" />
        Lưu thành đề mới (Tạo bản sao)
      </button>
      <button
        class="app-btn-primary !px-12 group"
        :disabled="isSaving"
        @click="emit('submit')"
      >
        <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
        {{ submitText }}
      </button>
    </div>
  </div>
</template>

