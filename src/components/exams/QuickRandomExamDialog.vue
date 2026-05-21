<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { questionsAPI, examsAPI } from '@/services/api'
import { normalizeCollection, normalizeQuestion } from '@/utils/normalizers'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  subjects: {
    type: Array,
    default: () => []
  },
  topics: {
    type: Array,
    default: () => []
  },
  getSubjectName: {
    type: Function,
    default: () => ''
  }
})

const emit = defineEmits(['close', 'success'])

const isSaving = ref(false)
const isPoolLoading = ref(false)
const errorMessage = ref('')

const formState = reactive({
  title: '',
  subjectId: '',
  topicId: '',
  questionCount: 20,
  duration: 90,
  type: 'MULTIPLE_CHOICE'
})

const useDetailedTopics = ref(false)
const subjectQuestions = ref([])
const topicCounts = reactive({})

const examTypeOptions = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'MIXED', label: 'Hỗn hợp' }
]

const filteredTopics = computed(() => {
  if (!formState.subjectId) return []
  return props.topics.filter(t => String(t.subjectId) === String(formState.subjectId))
})

const topicQuestionCounts = computed(() => {
  const counts = {}
  subjectQuestions.value.forEach(q => {
    if (q.topicId) {
      const tid = String(q.topicId)
      const diff = String(q.difficulty || 'EASY').toUpperCase()
      if (!counts[tid]) {
        counts[tid] = { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 }
      }
      counts[tid][diff] = (counts[tid][diff] || 0) + 1
      counts[tid].total += 1
    }
  })
  return counts
})

const detailedTotalQuestions = computed(() => {
  return Object.values(topicCounts).reduce((sum, val) => sum + (Number(val) || 0), 0)
})

async function fetchSubjectQuestionPool(subjectId) {
  if (!subjectId) {
    subjectQuestions.value = []
    return
  }

  isPoolLoading.value = true
  errorMessage.value = ''
  try {
    const response = await questionsAPI.getAll({
      page: 0,
      size: 100,
      sort: 'id,DESC',
      subjectId: Number(subjectId) || subjectId
    })

    const pageData = response.data?.data ?? response.data ?? {}
    let pool = normalizeCollection(pageData).map(normalizeQuestion)
    const totalPages = Number(pageData.totalPages ?? 1) || 1

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
      const extraQuestions = extraResponses.flatMap(res => {
        const pageDataExtra = res.data?.data ?? res.data ?? {}
        return normalizeCollection(pageDataExtra).map(normalizeQuestion)
      })
      pool = [...pool, ...extraQuestions]
    }

    subjectQuestions.value = pool.filter(q => String(q.subjectId) === String(subjectId))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không tải được kho câu hỏi của môn học'
    subjectQuestions.value = []
  } finally {
    isPoolLoading.value = false
  }
}

watch(() => formState.subjectId, async (newVal) => {
  formState.topicId = ''
  useDetailedTopics.value = false
  Object.keys(topicCounts).forEach(key => delete topicCounts[key])
  if (newVal) {
    await fetchSubjectQuestionPool(newVal)
  } else {
    subjectQuestions.value = []
  }
})

watch(() => props.open, (newVal) => {
  if (newVal) {
    resetForm()
  }
})

function resetForm() {
  formState.title = ''
  formState.subjectId = ''
  formState.topicId = ''
  formState.questionCount = 20
  formState.duration = 90
  formState.type = 'MULTIPLE_CHOICE'
  useDetailedTopics.value = false
  subjectQuestions.value = []
  Object.keys(topicCounts).forEach(key => delete topicCounts[key])
  errorMessage.value = ''
}

function handleTopicDifficultyCountInput(topicId, level, available) {
  const key = `${topicId}_${level}`
  const val = Number(topicCounts[key]) || 0
  if (val < 0) {
    topicCounts[key] = 0
  } else if (val > available) {
    topicCounts[key] = available
  }
}

async function handleQuickGenerate() {
  if (!formState.subjectId) {
    errorMessage.value = 'Vui lòng chọn môn học'
    return
  }

  if (useDetailedTopics.value) {
    if (detailedTotalQuestions.value <= 0) {
      errorMessage.value = 'Vui lòng cấu hình số lượng câu hỏi lớn hơn 0 cho ít nhất một chủ đề'
      return
    }
  } else {
    if (!formState.questionCount || formState.questionCount <= 0) {
      errorMessage.value = 'Số lượng câu hỏi phải lớn hơn 0'
      return
    }
  }

  if (!formState.duration || formState.duration <= 0) {
    errorMessage.value = 'Thời lượng làm bài phải lớn hơn 0'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    if (!subjectQuestions.value.length) {
      await fetchSubjectQuestionPool(formState.subjectId)
    }

    if (!subjectQuestions.value.length) {
      errorMessage.value = 'Môn học này hiện chưa có câu hỏi nào trong kho dữ liệu!'
      isSaving.value = false
      return
    }

    let selectedQuestions = []

    if (useDetailedTopics.value) {
      // Topic & Difficulty multi-dimensional partitioned generation
      filteredTopics.value.forEach(topic => {
        ['EASY', 'MEDIUM', 'HARD'].forEach(level => {
          const key = `${topic.id}_${level}`
          const count = Number(topicCounts[key]) || 0
          if (count > 0) {
            const levelPool = subjectQuestions.value.filter(
              q => String(q.topicId) === String(topic.id) && String(q.difficulty || 'EASY').toUpperCase() === level
            )
            // Fisher-Yates shuffle
            const shuffled = [...levelPool]
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            const selected = shuffled.slice(0, Math.min(count, levelPool.length))
            selectedQuestions = [...selectedQuestions, ...selected]
          }
        })
      })
    } else {
      // Standard single-topic or subject-wide generation
      let pool = [...subjectQuestions.value]
      if (formState.topicId) {
        pool = pool.filter(q => String(q.topicId) === String(formState.topicId))
      }

      if (!pool.length) {
        errorMessage.value = formState.topicId
          ? 'Chủ đề được chọn hiện chưa có câu hỏi nào trong kho dữ liệu!'
          : 'Môn học này hiện chưa có câu hỏi nào trong kho dữ liệu!'
        isSaving.value = false
        return
      }

      const availableCount = pool.length
      const count = Math.min(Number(formState.questionCount) || 1, availableCount)

      const shuffled = [...pool].sort(() => 0.5 - Math.random())
      selectedQuestions = shuffled.slice(0, count)
    }

    if (!selectedQuestions.length) {
      errorMessage.value = 'Không có câu hỏi nào được chọn thỏa mãn cấu hình!'
      isSaving.value = false
      return
    }

    // Double shuffle the merged selected questions to randomize ordering
    selectedQuestions.sort(() => 0.5 - Math.random())

    const count = selectedQuestions.length

    // Construct title if empty
    const selectedSubject = props.subjects.find(s => String(s.id) === String(formState.subjectId))
    const subjectName = selectedSubject ? (selectedSubject.name || '') : ''
    
    let topicNameSuffix = ''
    if (useDetailedTopics.value) {
      topicNameSuffix = ' - Phân bổ chủ đề chi tiết'
    } else if (formState.topicId) {
      const selectedTopic = props.topics.find(t => String(t.id) === String(formState.topicId))
      if (selectedTopic) {
        topicNameSuffix = ` - ${selectedTopic.name}`
      }
    }

    const generatedTitle = formState.title.trim() || `Đề thi ngẫu nhiên môn ${subjectName}${topicNameSuffix} (${count} câu) - ${new Date().toLocaleDateString('vi-VN')}`

    const questionsPayload = selectedQuestions.map((q, idx) => ({
      questionId: q.id,
      orderIndex: idx + 1,
      score: 1,
      contentSnapshot: q.questionContent || q.content || ''
    }))

    const payload = {
      title: generatedTitle,
      subjectId: Number(formState.subjectId) || formState.subjectId,
      duration: Number(formState.duration) || 90,
      isActive: false, // Khởi tạo ở trạng thái Nháp (Tạm tắt) để Admin kiểm tra và duyệt
      isPublic: false, // Riêng tư để học sinh không nhìn thấy cho đến khi Admin duyệt và công khai
      startTime: null,
      endTime: null,
      totalScore: count,
      type: formState.type,
      shuffleQuestions: true,
      shuffleAnswers: true,
      maxAttempts: 1,
      uiLayoutHint: 'STANDARD',
      questions: questionsPayload
    }

    await examsAPI.create(payload)

    alert(`Đã khởi tạo thành công đề thi ngẫu nhiên: "${generatedTitle}" với ${count} câu hỏi!`)
    emit('success')
    resetForm()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || error.message || 'Không tạo được đề thi ngẫu nhiên'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    title="Tạo nhanh đề ngẫu nhiên"
    description="Khởi tạo một đề thi hoàn chỉnh với các câu hỏi được xáo trộn ngẫu nhiên từ môn học và chủ đề cụ thể."
    size="md"
    @close="emit('close')"
  >
    <div class="space-y-6">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label for="quick-subject" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Môn học chọn câu hỏi</label>
          <span v-if="isPoolLoading" class="text-[11px] text-primary font-bold flex items-center gap-1">
            <RefreshCw class="h-3 w-3 animate-spin" />
            Đang tải kho câu hỏi...
          </span>
        </div>
        <select
          id="quick-subject"
          v-model="formState.subjectId"
          class="app-select"
        >
          <option value="" disabled>-- Chọn môn học áp dụng --</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ getSubjectName(subject.id, subject.name) }}
          </option>
        </select>
      </div>

      <!-- Toggle switch for detailed topic partitioning -->
      <div v-if="formState.subjectId && filteredTopics.length" class="flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 transition-all">
        <div class="flex flex-col gap-0.5 pr-4">
          <span class="text-xs font-black text-foreground">Phân bổ câu hỏi chi tiết theo chủ đề</span>
          <span class="text-[10px] text-muted-foreground font-semibold">Tự cấu hình số lượng câu ngẫu nhiên riêng cho từng chủ đề</span>
        </div>
        <label class="relative inline-flex items-center cursor-pointer select-none">
          <input type="checkbox" v-model="useDetailedTopics" class="sr-only peer" />
          <div class="w-11 h-6 bg-muted/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      <!-- Option 1: Standard quick generation -->
      <template v-if="!useDetailedTopics">
        <div class="space-y-3">
          <label for="quick-topic" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Chủ đề (Không bắt buộc)</label>
          <select
            id="quick-topic"
            v-model="formState.topicId"
            class="app-select"
            :disabled="!formState.subjectId || !filteredTopics.length"
          >
            <option value="">-- Tất cả chủ đề --</option>
            <option v-for="topic in filteredTopics" :key="topic.id" :value="topic.id">
              {{ topic.name }}
            </option>
          </select>
          <p v-if="formState.subjectId && !filteredTopics.length" class="text-[11px] font-bold text-amber-500 mt-1">
            Môn học này chưa được phân chia chủ đề. Hệ thống sẽ quét toàn bộ môn học.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="space-y-3">
            <label for="quick-count" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Số lượng câu hỏi</label>
            <input
              id="quick-count"
              v-model.number="formState.questionCount"
              type="number"
              min="1"
              max="150"
              class="app-input"
              placeholder="Ví dụ: 20, 40..."
            />
          </div>

          <div class="space-y-3">
            <label for="quick-duration" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Thời lượng làm bài (phút)</label>
            <input
              id="quick-duration"
              v-model.number="formState.duration"
              type="number"
              min="1"
              class="app-input"
              placeholder="Ví dụ: 45, 90..."
            />
          </div>
        </div>
      </template>

      <!-- Option 2: Detailed topic & difficulty partitioning -->
      <template v-else>
        <div class="space-y-4">
          <div class="text-xs font-black uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between border-b border-border/40 pb-2">
            <span>Số câu ngẫu nhiên của mỗi chủ đề & độ khó</span>
            <span class="text-xs font-bold text-primary">Tổng cộng: {{ detailedTotalQuestions }} câu hỏi</span>
          </div>

          <div class="grid gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="topic in filteredTopics" :key="topic.id" class="p-4 rounded-2xl bg-white/40 border border-border/40 hover:border-primary/20 transition-all dark:bg-black/10 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black text-foreground truncate max-w-[280px]" :title="topic.name">{{ topic.name }}</span>
                <span class="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {{ (topicQuestionCounts[String(topic.id)]?.total) || 0 }} câu khả dụng
                </span>
              </div>
              
              <div class="grid grid-cols-3 gap-3">
                <!-- Easy -->
                <div class="space-y-1">
                  <span class="text-[10px] font-black text-emerald-600 block text-center">Dễ ({{ (topicQuestionCounts[String(topic.id)]?.EASY) || 0 }})</span>
                  <input
                    v-model.number="topicCounts[topic.id + '_EASY']"
                    type="number"
                    min="0"
                    :max="(topicQuestionCounts[String(topic.id)]?.EASY) || 0"
                    class="app-input !py-1 !px-2 text-center text-xs font-bold"
                    placeholder="0"
                    @input="handleTopicDifficultyCountInput(topic.id, 'EASY', (topicQuestionCounts[String(topic.id)]?.EASY) || 0)"
                  />
                </div>
                <!-- Medium -->
                <div class="space-y-1">
                  <span class="text-[10px] font-black text-amber-600 block text-center">T.Bình ({{ (topicQuestionCounts[String(topic.id)]?.MEDIUM) || 0 }})</span>
                  <input
                    v-model.number="topicCounts[topic.id + '_MEDIUM']"
                    type="number"
                    min="0"
                    :max="(topicQuestionCounts[String(topic.id)]?.MEDIUM) || 0"
                    class="app-input !py-1 !px-2 text-center text-xs font-bold"
                    placeholder="0"
                    @input="handleTopicDifficultyCountInput(topic.id, 'MEDIUM', (topicQuestionCounts[String(topic.id)]?.MEDIUM) || 0)"
                  />
                </div>
                <!-- Hard -->
                <div class="space-y-1">
                  <span class="text-[10px] font-black text-rose-600 block text-center">Khó ({{ (topicQuestionCounts[String(topic.id)]?.HARD) || 0 }})</span>
                  <input
                    v-model.number="topicCounts[topic.id + '_HARD']"
                    type="number"
                    min="0"
                    :max="(topicQuestionCounts[String(topic.id)]?.HARD) || 0"
                    class="app-input !py-1 !px-2 text-center text-xs font-bold"
                    placeholder="0"
                    @input="handleTopicDifficultyCountInput(topic.id, 'HARD', (topicQuestionCounts[String(topic.id)]?.HARD) || 0)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <label for="quick-duration" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Thời lượng làm bài (phút)</label>
            <input
              id="quick-duration"
              v-model.number="formState.duration"
              type="number"
              min="1"
              class="app-input"
              placeholder="Ví dụ: 45, 90..."
            />
          </div>
        </div>
      </template>

      <div class="space-y-3">
        <label for="quick-title" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Tên đề thi (Không bắt buộc)</label>
        <input
          id="quick-title"
          v-model="formState.title"
          type="text"
          placeholder="Hệ thống sẽ tự sinh tên đề nếu bỏ trống..."
          class="app-input"
        />
      </div>

      <div class="space-y-3">
        <label for="quick-type" class="text-xs font-black uppercase tracking-widest text-muted-foreground/70">Cấu trúc đề</label>
        <select
          id="quick-type"
          v-model="formState.type"
          class="app-select"
        >
          <option v-for="option in examTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 shrink-0" />
        {{ errorMessage }}
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-border/50 pt-5 mt-4">
        <button class="app-btn-secondary !px-6 !py-3" @click="emit('close')">
          Hủy bỏ
        </button>
        <button
          class="app-btn-primary !px-8 !py-3 bg-gradient-to-r from-primary via-indigo-600 to-violet-500 shadow-md group flex items-center gap-2"
          :disabled="isSaving || isPoolLoading"
          @click="handleQuickGenerate"
        >
          <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
          <Sparkles v-else class="h-4 w-4 text-white group-hover:animate-pulse" />
          Khởi tạo đề ngẫu nhiên
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
