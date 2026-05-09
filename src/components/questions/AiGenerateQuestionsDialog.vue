<script setup>
import { ref, reactive } from 'vue'
import { Sparkles, Loader2, X, CheckCircle2, Trash2, Edit3, Save } from 'lucide-vue-next'
import { aiAPI, questionsAPI } from '@/services/api'

const props = defineProps({
  open: Boolean,
  topics: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'generated'])

const step = ref('input') // 'input' | 'review' | 'success'
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref('')
const generatedQuestions = ref([])

const form = reactive({
  content: '',
  numberOfQuestions: 5,
  difficulty: 'MEDIUM',
  preferredType: 'MCQ',
  topicId: ''
})

async function handleGenerate() {
  if (!form.content || !form.topicId) {
    error.value = 'Vui lòng nhập nội dung và chọn chủ đề'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response = await aiAPI.generateQuestions({
      content: form.content,
      numberOfQuestions: form.numberOfQuestions,
      difficulty: form.difficulty,
      preferredType: form.preferredType,
      additionalInstructions: `Gán vào Topic ID: ${form.topicId}`
    })

    const data = response.data?.data || response.data
    // Map data to local editable format
    generatedQuestions.value = data.map((q, idx) => ({
      ...q,
      tempId: idx,
      isEditing: false
    }))
    
    step.value = 'review'
  } catch (err) {
    error.value = err.response?.data?.message || 'Lỗi khi tạo câu hỏi bằng AI'
  } finally {
    isLoading.value = false
  }
}

async function handleSaveAll() {
  if (generatedQuestions.value.length === 0) return

  isSaving.value = true
  error.value = ''

  try {
    const payload = generatedQuestions.value.map(q => ({
      content: q.content,
      type: q.type,
      difficulty: q.difficulty,
      topicId: Number(form.topicId),
      options: q.options || [],
      explanation: q.explanation || '',
      sampleAnswer: q.sampleAnswer || '',
      contentFormat: 'PLAIN_TEXT'
    }))

    await questionsAPI.createBatch(payload)
    step.value = 'success'
    
    setTimeout(() => {
      emit('generated')
      handleClose()
    }, 2000)

  } catch (err) {
    error.value = err.response?.data?.message || 'Lỗi khi lưu câu hỏi vào cơ sở dữ liệu'
  } finally {
    isSaving.value = false
  }
}

function removeQuestion(tempId) {
  generatedQuestions.value = generatedQuestions.value.filter(q => q.tempId !== tempId)
}

function handleClose() {
  form.content = ''
  error.value = ''
  step.value = 'input'
  generatedQuestions.value = []
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-background/80 backdrop-blur-sm" @click="handleClose"></div>
    
    <div class="app-surface relative w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="border-b border-border/50 p-6 flex items-center justify-between bg-primary/5 shrink-0">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Sparkles class="h-6 w-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-foreground">
              {{ step === 'review' ? 'Kiểm duyệt câu hỏi AI' : 'Tạo câu hỏi bằng AI' }}
            </h2>
            <p class="text-xs text-muted-foreground font-medium">
              {{ step === 'review' ? `AI đã tạo ${generatedQuestions.length} câu hỏi. Hãy kiểm tra lại trước khi lưu.` : 'Tự động bóc tách tài liệu thành bộ câu hỏi chất lượng cao.' }}
            </p>
          </div>
        </div>
        <button @click="handleClose" class="rounded-lg p-2 hover:bg-muted transition-colors">
          <X class="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 space-y-6 overflow-y-auto grow">
        <!-- SUCCESS STEP -->
        <div v-if="step === 'success'" class="flex flex-col items-center justify-center py-20 space-y-4 animate-in zoom-in duration-500">
          <div class="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 class="h-12 w-12 text-emerald-500" />
          </div>
          <div class="text-center">
            <h3 class="text-2xl font-black text-foreground">Thành công!</h3>
            <p class="text-muted-foreground font-medium">Đã lưu {{ generatedQuestions.length }} câu hỏi vào hệ thống.</p>
          </div>
        </div>

        <!-- INPUT STEP -->
        <template v-else-if="step === 'input'">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nội dung tài liệu / Bài đọc</label>
            <textarea 
              v-model="form.content"
              placeholder="Dán nội dung bài đọc hoặc kiến thức cần đặt câu hỏi tại đây..."
              class="app-select min-h-[300px] py-4 resize-none"
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chủ đề mục tiêu</label>
              <select v-model="form.topicId" class="app-select" :disabled="isLoading">
                <option value="" disabled>Chọn chủ đề</option>
                <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.name }} ({{ t.subjectName }})</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Số lượng câu hỏi</label>
              <input v-model="form.numberOfQuestions" type="number" min="1" max="20" class="app-select" :disabled="isLoading" />
            </div>
          </div>
        </template>

        <!-- REVIEW STEP -->
        <template v-else-if="step === 'review'">
          <div class="space-y-8">
            <div v-for="(q, index) in generatedQuestions" :key="q.tempId" class="relative group/card p-6 rounded-2xl border-2 border-slate-100 bg-white hover:border-primary/30 transition-all">
              <div class="absolute -left-3 top-6 h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg">
                {{ index + 1 }}
              </div>
              
              <div class="flex justify-end gap-2 mb-4">
                <button @click="q.isEditing = !q.isEditing" class="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors">
                  <Edit3 v-if="!q.isEditing" class="h-4 w-4" />
                  <Save v-else class="h-4 w-4" />
                </button>
                <button @click="removeQuestion(q.tempId)" class="p-2 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <div class="space-y-4">
                <div v-if="q.isEditing">
                  <textarea v-model="q.content" class="app-select w-full min-h-[80px] font-bold" placeholder="Nội dung câu hỏi"></textarea>
                </div>
                <h4 v-else class="text-base font-bold text-slate-900 leading-relaxed pr-8">{{ q.content }}</h4>

                <!-- Options for MCQ -->
                <div v-if="q.type === 'MCQ'" class="grid gap-3 sm:grid-cols-2 mt-4">
                  <div v-for="(opt, oIdx) in q.options" :key="oIdx" 
                       class="flex items-center gap-3 p-3 rounded-xl border"
                       :class="opt.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'">
                    <input type="checkbox" v-model="opt.isCorrect" v-if="q.isEditing" class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    <div v-else class="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black"
                         :class="opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border border-slate-200'">
                      {{ String.fromCharCode(65 + oIdx) }}
                    </div>
                    
                    <input v-if="q.isEditing" v-model="opt.content" class="bg-transparent border-none p-0 text-sm grow focus:ring-0" />
                    <span v-else class="text-sm font-medium" :class="opt.isCorrect ? 'text-emerald-900' : 'text-slate-600'">{{ opt.content }}</span>
                  </div>
                </div>

                <!-- Sample Answer for Essay -->
                <div v-else class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Đáp án mẫu</p>
                  <textarea v-if="q.isEditing" v-model="q.sampleAnswer" class="app-select w-full min-h-[60px] bg-white"></textarea>
                  <p v-else class="text-sm font-medium text-slate-700">{{ q.sampleAnswer }}</p>
                </div>

                <div class="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50">
                  <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Giải thích chi tiết</p>
                  <textarea v-if="q.isEditing" v-model="q.explanation" class="app-select w-full min-h-[60px] bg-white"></textarea>
                  <p v-else class="text-sm font-medium text-slate-600 italic leading-relaxed">{{ q.explanation }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="error" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-bold flex items-center gap-3">
          <X class="h-4 w-4" />
          {{ error }}
        </div>
      </div>

      <!-- Footer -->
      <div v-if="step !== 'success'" class="border-t border-border/50 p-6 flex justify-between items-center bg-muted/20 shrink-0">
        <div>
          <button v-if="step === 'review'" @click="step = 'input'" class="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            Quay lại chỉnh tham số
          </button>
        </div>
        
        <div class="flex gap-3">
          <button @click="handleClose" class="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors" :disabled="isLoading || isSaving">
            Hủy bỏ
          </button>
          
          <button 
            v-if="step === 'input'"
            @click="handleGenerate" 
            class="app-btn-primary !bg-indigo-600 hover:!bg-indigo-500 min-w-[160px]"
            :disabled="isLoading || !form.content"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
            {{ isLoading ? 'Đang phân tích...' : 'Bắt đầu tạo' }}
          </button>

          <button 
            v-if="step === 'review'"
            @click="handleSaveAll" 
            class="app-btn-primary !bg-emerald-600 hover:!bg-emerald-500 min-w-[160px]"
            :disabled="isSaving || generatedQuestions.length === 0"
          >
            <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin" />
            <CheckCircle2 v-else class="h-4 w-4" />
            {{ isSaving ? 'Đang lưu...' : 'Duyệt & Lưu tất cả' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
