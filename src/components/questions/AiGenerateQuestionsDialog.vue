<script setup>
import { ref, reactive, computed } from 'vue'
import { Sparkles, Loader2, X, CheckCircle2, Trash2, Edit3, Save, AlertCircle } from 'lucide-vue-next'
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

const activeIndex = ref(0)
const isTurning = ref(false)
const flipDirection = ref('next') // 'next' | 'prev'

function prevPage() {
  if (activeIndex.value > 0 && !isTurning.value) {
    flipDirection.value = 'prev'
    isTurning.value = true
    setTimeout(() => {
      activeIndex.value--
    }, 250) // Change content halfway through flip
    setTimeout(() => {
      isTurning.value = false
    }, 500)
  }
}

function nextPage() {
  if (activeIndex.value < generatedQuestions.value.length - 1 && !isTurning.value) {
    flipDirection.value = 'next'
    isTurning.value = true
    setTimeout(() => {
      activeIndex.value++
    }, 250) // Change content halfway through flip
    setTimeout(() => {
      isTurning.value = false
    }, 500)
  }
}

function removeActiveQuestion() {
  if (generatedQuestions.value.length === 0) return
  const currentId = generatedQuestions.value[activeIndex.value].tempId
  removeQuestion(currentId)
}

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
      isEditing: false,
      isFlipped: false
    }))
    activeIndex.value = 0
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
  if (activeIndex.value >= generatedQuestions.value.length && activeIndex.value > 0) {
    activeIndex.value = generatedQuestions.value.length - 1
  }
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
    
    <div class="app-surface relative w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh] border-white/10 dark:border-white/5">
      <!-- Header -->
      <div class="border-b border-border/50 p-6 flex items-center justify-between bg-primary/5 shrink-0">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-violet-600 text-white shadow-lg">
            <Sparkles class="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-foreground">
              {{ step === 'review' ? 'Kiểm duyệt câu hỏi AI (3D Book View)' : 'Tạo câu hỏi bằng AI' }}
            </h2>
            <p class="text-xs text-muted-foreground font-medium">
              {{ step === 'review' ? `AI đã tạo ${generatedQuestions.length} câu hỏi. Đọc và chỉnh sửa bằng định dạng sách lật 3D.` : 'Tự động phân tích tài liệu và sinh bộ câu hỏi chất lượng cao.' }}
            </p>
          </div>
        </div>
        <button @click="handleClose" class="rounded-lg p-2 hover:bg-muted transition-colors">
          <X class="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 space-y-6 overflow-y-auto grow custom-scrollbar bg-slate-500/[0.01]">
        
        <!-- SUCCESS STEP -->
        <div v-if="step === 'success'" class="flex flex-col items-center justify-center py-20 space-y-4 animate-in zoom-in duration-500">
          <div class="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 class="h-12 w-12 text-emerald-500" />
          </div>
          <div class="text-center">
            <h3 class="text-2xl font-black text-foreground">Hoàn thành!</h3>
            <p class="text-muted-foreground font-medium mt-1">Đã lưu {{ generatedQuestions.length }} câu hỏi mới vào ngân hàng đề.</p>
          </div>
        </div>

        <!-- LOADING STATE (MA THUẬT AI SPINNING) -->
        <div v-else-if="isLoading" class="flex flex-col items-center justify-center py-16 space-y-8 animate-in fade-in duration-300">
          <div class="relative flex items-center justify-center h-44 w-44">
            <!-- Outer magic glowing orbit -->
            <div class="absolute inset-0 rounded-full border border-dashed border-primary/20 animate-spin" style="animation-duration: 20s"></div>
            <!-- Second dynamic glowing orbit -->
            <div class="absolute inset-2 rounded-full border border-primary/40 border-t-transparent animate-spin" style="animation-duration: 4s"></div>
            <!-- Inner orbit -->
            <div class="absolute inset-6 rounded-full border-2 border-dashed border-cyan-400/30 animate-spin" style="animation-duration: 10s; animation-direction: reverse"></div>
            
            <!-- Document Dissolve Magic Particles -->
            <div class="magic-particle" style="--angle: 0deg; --delay: 0s"></div>
            <div class="magic-particle" style="--angle: 45deg; --delay: 0.38s"></div>
            <div class="magic-particle" style="--angle: 90deg; --delay: 0.76s"></div>
            <div class="magic-particle" style="--angle: 135deg; --delay: 1.14s"></div>
            <div class="magic-particle" style="--angle: 180deg; --delay: 1.52s"></div>
            <div class="magic-particle" style="--angle: 225deg; --delay: 1.9s"></div>
            <div class="magic-particle" style="--angle: 270deg; --delay: 2.28s"></div>
            <div class="magic-particle" style="--angle: 315deg; --delay: 2.66s"></div>
            
            <!-- Center AI Sparkle icon inside glass circle -->
            <div class="h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xl backdrop-blur-md animate-pulse">
              <Sparkles class="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.6)]" />
            </div>
          </div>
          
          <div class="text-center space-y-3 max-w-sm">
            <h3 class="text-lg font-black text-foreground tracking-tight flex items-center justify-center gap-2">
              <Loader2 class="h-5 w-5 animate-spin text-primary" />
              AI Đang Phân Tích Tài Liệu...
            </h3>
            <p class="text-xs text-muted-foreground font-medium leading-relaxed">
              Thuật toán đang bóc tách nội dung, cấu trúc đáp án mẫu và sinh lời giải chi tiết theo yêu cầu của bạn.
            </p>
          </div>
        </div>

        <!-- INPUT STEP -->
        <template v-else-if="step === 'input'">
          <div class="space-y-3 relative group">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nội dung tài liệu / Bài đọc</label>
            <div class="relative overflow-hidden rounded-2xl border border-border/60 focus-within:border-primary transition-all shadow-inner bg-white/40 dark:bg-zinc-950/20">
              <textarea 
                v-model="form.content"
                placeholder="Dán nội dung bài đọc hoặc kiến thức cần đặt câu hỏi tại đây..."
                class="w-full min-h-[300px] p-5 text-sm font-medium text-foreground outline-none resize-none bg-transparent placeholder:text-muted-foreground/30"
              ></textarea>
              
              <!-- Spotlight text scan overlay when inputting -->
              <div class="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/45 to-transparent top-0 animate-bounce" style="animation-duration: 4s"></div>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chủ đề mục tiêu</label>
              <select v-model="form.topicId" class="app-select shadow-sm" :disabled="isLoading">
                <option value="" disabled>Chọn chủ đề</option>
                <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.name }} ({{ t.subjectName }})</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Số câu hỏi</label>
                <input v-model="form.numberOfQuestions" type="number" min="1" max="20" class="app-select shadow-sm" :disabled="isLoading" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Độ khó</label>
                <select v-model="form.difficulty" class="app-select shadow-sm" :disabled="isLoading">
                  <option value="EASY">Dễ</option>
                  <option value="MEDIUM">Trung bình</option>
                  <option value="HARD">Khó</option>
                </select>
              </div>
            </div>
          </div>
        </template>

        <!-- REVIEW STEP (3D OPEN BOOK INTERACTIVE VIEW) -->
        <template v-else-if="step === 'review' && generatedQuestions.length > 0">
          <div class="flex flex-col items-center gap-6 w-full animate-in fade-in duration-500">
            
            <!-- Book Container -->
            <div class="book-container relative w-full max-w-5xl h-[500px] flex rounded-[2rem] overflow-visible bg-background border border-white/5 shadow-2xl">
              <!-- Center Spine -->
              <div class="absolute left-1/2 top-0 bottom-0 w-[10px] -ml-[5px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 shadow-md z-30 rounded-full"></div>

              <!-- LEFT PAGE: Static / Question Details -->
              <div class="book-page book-page-left w-1/2 h-full bg-white dark:bg-zinc-900 border-r-0 border border-slate-200/60 dark:border-zinc-800/80 rounded-l-[2rem] p-8 flex flex-col justify-between shadow-lg relative z-10">
                <div class="flex-1 flex flex-col min-h-0">
                  <!-- Page Header -->
                  <div class="flex items-center justify-between border-b border-border/40 pb-3 mb-4 shrink-0">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white text-sm font-black shadow-md">
                        {{ activeIndex + 1 }}
                      </span>
                      <span class="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary tracking-widest uppercase">
                        {{ generatedQuestions[activeIndex].type === 'MCQ' ? 'Trắc nghiệm' : 'Tự luận' }}
                      </span>
                    </div>
                    
                    <div class="flex items-center gap-1">
                      <button 
                        @click="generatedQuestions[activeIndex].isEditing = !generatedQuestions[activeIndex].isEditing" 
                        class="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all"
                        title="Chỉnh sửa câu hỏi"
                      >
                        <Edit3 v-if="!generatedQuestions[activeIndex].isEditing" class="h-4 w-4" />
                        <Save v-else class="h-4 w-4 text-emerald-600 animate-bounce" />
                      </button>
                      <button 
                        @click="removeActiveQuestion" 
                        class="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Page Body (Scrollable) -->
                  <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-4">
                    <div v-if="generatedQuestions[activeIndex].isEditing" class="space-y-2">
                      <label class="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nội dung câu hỏi</label>
                      <textarea 
                        v-model="generatedQuestions[activeIndex].content" 
                        class="w-full min-h-[220px] p-4 text-sm font-medium border border-border/60 rounded-xl outline-none focus:border-primary bg-slate-50 dark:bg-zinc-950 resize-none"
                        placeholder="Nội dung câu hỏi..."
                      ></textarea>
                    </div>
                    <div v-else class="space-y-2">
                      <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nội dung câu hỏi</p>
                      <h4 class="text-base font-bold text-foreground leading-relaxed">
                        {{ generatedQuestions[activeIndex].content }}
                      </h4>
                    </div>
                  </div>
                </div>

                <!-- Page Footer -->
                <div class="border-t border-border/40 pt-4 flex items-center justify-between shrink-0 mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span>Trang {{ (activeIndex + 1) * 2 - 1 }}</span>
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-black text-primary">
                      Độ khó: {{ generatedQuestions[activeIndex].difficulty }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- RIGHT PAGE: Static / Options & Explanations -->
              <div class="book-page book-page-right w-1/2 h-full bg-slate-50/50 dark:bg-zinc-900/60 border-l-0 border border-slate-200/60 dark:border-zinc-800/80 rounded-r-[2rem] p-8 flex flex-col justify-between shadow-lg relative z-10">
                <div class="flex-1 flex flex-col min-h-0">
                  <div class="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 space-y-5">
                    
                    <!-- MCQ Options -->
                    <div v-if="generatedQuestions[activeIndex].type === 'MCQ'" class="space-y-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lựa chọn câu trả lời</p>
                      
                      <div class="grid gap-2">
                        <div 
                          v-for="(opt, oIdx) in generatedQuestions[activeIndex].options" 
                          :key="oIdx" 
                          class="flex items-center gap-3 p-3.5 rounded-xl border transition-all"
                          :class="opt.isCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-500/5' : 'bg-white dark:bg-zinc-900 border-border/50 text-foreground/80'"
                        >
                          <input 
                            type="checkbox" 
                            v-model="opt.isCorrect" 
                            v-if="generatedQuestions[activeIndex].isEditing" 
                            class="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary" 
                          />
                          <div 
                            v-else 
                            class="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black"
                            :class="opt.isCorrect ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'bg-secondary text-muted-foreground border border-border/40'"
                          >
                            {{ String.fromCharCode(65 + oIdx) }}
                          </div>
                          
                          <input 
                            v-if="generatedQuestions[activeIndex].isEditing" 
                            v-model="opt.content" 
                            class="flex-1 bg-transparent border-0 border-b border-border/50 outline-none text-sm px-1 py-0.5 text-foreground font-medium" 
                          />
                          <span v-else class="text-sm font-semibold">{{ opt.content }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- AI Explanation / Essay Sample Answer -->
                    <div class="space-y-3">
                      <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        {{ generatedQuestions[activeIndex].type === 'MCQ' ? 'Lời giải chi tiết từ AI' : 'Đáp án mẫu & Hướng dẫn chấm' }}
                      </p>
                      
                      <!-- Editable Explanation -->
                      <div v-if="generatedQuestions[activeIndex].isEditing" class="space-y-4">
                        <textarea 
                          v-model="generatedQuestions[activeIndex].explanation" 
                          class="w-full min-h-[140px] p-4 text-xs font-medium border border-border/60 rounded-xl outline-none focus:border-primary bg-slate-50 dark:bg-zinc-950 resize-none"
                          placeholder="Lời giải chi tiết..."
                        ></textarea>
                      </div>
                      
                      <!-- Displayed Explanation -->
                      <div v-else class="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5 rounded-2xl">
                        <p class="text-xs font-medium text-foreground leading-relaxed">
                          {{ generatedQuestions[activeIndex].explanation || 'Không có giải thích chi tiết.' }}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Page Footer -->
                <div class="border-t border-border/40 pt-4 flex items-center justify-between shrink-0 mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span>Trang {{ (activeIndex + 1) * 2 }}</span>
                  <span class="text-muted-foreground">Ngân hàng AI</span>
                </div>
              </div>

              <!-- ACTIVE FLIPPING PAGE OVERLAY (Only visible during turning animation) -->
              <div 
                v-if="isTurning" 
                class="book-page-flipping absolute right-0 top-0 w-1/2 h-full z-20"
                :class="flipDirection === 'next' ? 'flip-next' : 'flip-prev'"
              >
                <div class="flipping-page-inner w-full h-full relative">
                  <!-- FRONT SIDE of flipping sheet (displays old content) -->
                  <div class="flipping-page-front absolute inset-0 bg-slate-50 dark:bg-zinc-900 border border-border/40 rounded-r-[2rem] p-8 flex flex-col justify-between shadow-2xl">
                    <div class="flex-1 flex flex-col min-h-0 opacity-40">
                      <!-- Static representation of options/explanations -->
                      <div class="flex-1 overflow-hidden space-y-4">
                        <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Đang lật trang...</p>
                        <div class="h-6 bg-secondary/30 rounded-lg w-1/3 animate-pulse"></div>
                        <div class="h-10 bg-secondary/20 rounded-xl w-full"></div>
                        <div class="h-10 bg-secondary/20 rounded-xl w-full"></div>
                        <div class="h-20 bg-secondary/20 rounded-xl w-full"></div>
                      </div>
                    </div>
                    <div class="border-t border-border/40 pt-4 flex items-center justify-between mt-3 text-[10px] font-black text-muted-foreground/40">
                      <span>Lật tiếp...</span>
                    </div>
                  </div>

                  <!-- BACK SIDE of flipping sheet (displays incoming content) -->
                  <div class="flipping-page-back absolute inset-0 bg-white dark:bg-zinc-900 border border-border/40 rounded-l-[2rem] p-8 flex flex-col justify-between shadow-2xl">
                    <div class="flex-1 flex flex-col min-h-0 opacity-40">
                      <div class="flex-1 overflow-hidden space-y-4">
                        <p class="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Đang tải...</p>
                        <div class="h-8 bg-secondary/30 rounded-lg w-1/4 animate-pulse"></div>
                        <div class="h-12 bg-secondary/20 rounded-xl w-full"></div>
                        <div class="h-24 bg-secondary/20 rounded-xl w-full"></div>
                      </div>
                    </div>
                    <div class="border-t border-border/40 pt-4 flex items-center justify-between mt-3 text-[10px] font-black text-muted-foreground/40">
                      <span>Đang vào...</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Double Page Book Controller (Pagination & Controls) -->
            <div class="flex items-center gap-6 bg-zinc-500/[0.04] border border-border/30 px-6 py-3 rounded-2xl shrink-0">
              <button 
                @click="prevPage" 
                class="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-background border border-border/50 text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                :disabled="activeIndex === 0 || isTurning"
              >
                ← Câu trước
              </button>
              
              <div class="text-xs font-black uppercase tracking-wider text-muted-foreground select-none">
                Câu hỏi <span class="text-foreground font-black text-sm">{{ activeIndex + 1 }}</span> / {{ generatedQuestions.length }}
              </div>
              
              <button 
                @click="nextPage" 
                class="inline-flex items-center justify-center h-10 px-4 rounded-xl bg-background border border-border/50 text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                :disabled="activeIndex === generatedQuestions.length - 1 || isTurning"
              >
                Câu sau →
              </button>
            </div>

          </div>
        </template>

        <div v-if="error" class="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-bold flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <AlertCircle class="h-4 w-4" />
          {{ error }}
        </div>
      </div>

      <!-- Footer -->
      <div v-if="step !== 'success'" class="border-t border-border/50 p-6 flex justify-between items-center bg-muted/20 shrink-0">
        <div>
          <button 
            v-if="step === 'review'" 
            @click="step = 'input'" 
            class="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            :disabled="isLoading || isSaving"
          >
            Quay lại chỉnh tham số
          </button>
        </div>
        
        <div class="flex gap-3">
          <button @click="handleClose" class="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" :disabled="isLoading || isSaving">
            Hủy bỏ
          </button>
          
          <button 
            v-if="step === 'input'"
            @click="handleGenerate" 
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-primary to-violet-600 px-7 py-2.5 text-xs font-black text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-w-[160px]"
            :disabled="isLoading || !form.content"
          >
            <Loader2 v-if="isLoading" class="h-4.5 w-4.5 animate-spin mr-1" />
            <Sparkles v-else class="h-4.5 w-4.5 mr-1 animate-pulse" />
            {{ isLoading ? 'Đang phân tích...' : 'Bắt đầu tạo' }}
          </button>

          <button 
            v-if="step === 'review'"
            @click="handleSaveAll" 
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 min-w-[180px]"
            :disabled="isSaving || generatedQuestions.length === 0"
          >
            <Loader2 v-if="isSaving" class="h-4.5 w-4.5 animate-spin mr-1" />
            <CheckCircle2 v-else class="h-4.5 w-4.5 mr-1" />
            {{ isSaving ? 'Đang lưu...' : 'Duyệt & Lưu tất cả' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Magic Particle spiral dissolve animation */
.magic-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, #8b5cf6, #22d3ee);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.8), 0 0 16px rgba(34, 211, 238, 0.5);
  top: calc(50% - 3px);
  left: calc(50% - 3px);
  opacity: 0;
  animation: particle-spiral 3s infinite linear;
  animation-delay: var(--delay);
}

@keyframes particle-spiral {
  0% {
    transform: rotate(var(--angle)) translateX(90px) rotate(0deg) scale(1.5);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: rotate(calc(var(--angle) + 360deg)) translateX(0px) rotate(-360deg) scale(0.2);
    opacity: 0;
  }
}

/* 3D Open Book Styles */
.book-container {
  perspective: 2000px;
  transform-style: preserve-3d;
}

.book-page {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.book-page-left {
  transform-origin: right center;
  box-shadow: inset -24px 0 35px -15px rgba(0, 0, 0, 0.12), -10px 15px 30px rgba(0, 0, 0, 0.15);
}

.book-page-right {
  transform-origin: left center;
  box-shadow: inset 24px 0 35px -15px rgba(0, 0, 0, 0.12), 10px 15px 30px rgba(0, 0, 0, 0.15);
}

/* 3D Page Flipping Layer */
.book-page-flipping {
  transform-style: preserve-3d;
  box-shadow: 10px 15px 35px rgba(0, 0, 0, 0.2);
}

.book-page-flipping.flip-next {
  transform-origin: left center;
  animation: flip-next-anim 0.5s forwards cubic-bezier(0.25, 1, 0.5, 1);
}

.book-page-flipping.flip-prev {
  transform-origin: right center;
  animation: flip-prev-anim 0.5s forwards cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes flip-next-anim {
  0% {
    transform: rotateY(0deg);
    z-index: 25;
  }
  100% {
    transform: rotateY(-180deg);
    z-index: 5;
  }
}

@keyframes flip-prev-anim {
  0% {
    transform: rotateY(0deg);
    z-index: 25;
  }
  100% {
    transform: rotateY(180deg);
    z-index: 5;
  }
}

.flipping-page-inner {
  transform-style: preserve-3d;
}

.flipping-page-front,
.flipping-page-back {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flipping-page-back {
  transform: rotateY(180deg);
}

/* Custom background scanline shader effect */
.dark .app-surface {
  background-image: radial-gradient(at 50% 0%, rgba(139, 92, 246, 0.05) 0%, transparent 60%);
}
</style>
