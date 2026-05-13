<script setup>
import { ref, computed } from 'vue'
import { X, UploadCloud, Download } from 'lucide-vue-next'
import { API_CONFIG } from '@/constants'
import { questionsAPI } from '@/services/api'
import apiClient from '@/services/apiClient'
import { renderQuestionContent } from '@/utils/questionContent'

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'imported'])

const file = ref(null)
const imageFolderPath = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const isPreviewing = ref(false)
const previewData = ref([])

const templateDownloadUrl = computed(() => {
  const base = API_CONFIG.BASE_URL || 'http://localhost:8080/api'
  return `${base}/questions/import/template`
})

function handleFileChange(e) {
  const files = e.target.files
  if (files && files.length > 0) {
    file.value = files[0]
  }
}

async function handleDownloadTemplate() {
  try {
    const response = await apiClient.get('/questions/import/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'question_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    errorMsg.value = 'Không thể tải file mẫu. Vui lòng thử lại.'
  }
}

async function handlePreview() {
  if (!file.value) {
    errorMsg.value = 'Vui lòng chọn file Excel!'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    const response = await questionsAPI.importExcelPreview(file.value, imageFolderPath.value)
    previewData.value = response.data?.data || response.data || []
    if (previewData.value.length === 0) {
      errorMsg.value = 'Không tìm thấy câu hỏi nào hợp lệ trong file.'
    } else {
      isPreviewing.value = true
    }
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Có lỗi xảy ra khi đọc file.'
  } finally {
    isLoading.value = false
  }
}

async function handleConfirmImport() {
  errorMsg.value = ''
  successMsg.value = ''
  isLoading.value = true

  try {
    await questionsAPI.createBatch(previewData.value)
    successMsg.value = `Đã import thành công ${previewData.value.length} câu hỏi!`
    file.value = null
    imageFolderPath.value = ''
    previewData.value = []
    
    setTimeout(() => {
      emit('imported')
      close()
    }, 1500)
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Có lỗi xảy ra khi lưu vào Database.'
  } finally {
    isLoading.value = false
  }
}

function close() {
  if (!isLoading.value) {
    errorMsg.value = ''
    successMsg.value = ''
    file.value = null
    imageFolderPath.value = ''
    isPreviewing.value = false
    previewData.value = []
    emit('close')
  }
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-background/80 backdrop-blur-md" @click="close"></div>
      
      <Transition
        enter-active-class="transition duration-400 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <div v-if="open" class="app-surface relative w-full shadow-2xl rounded-2xl border border-border/50 flex flex-col max-h-[90vh] overflow-hidden transition-all duration-500 ease-in-out"
             :class="isPreviewing ? 'max-w-5xl' : 'max-w-lg'">
          
          <!-- Decorative gradient background -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60"></div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-secondary/10">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-primary/10 rounded-xl text-primary">
                <UploadCloud class="h-6 w-6" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-foreground tracking-tight">Nhập câu hỏi từ Excel</h2>
                <p class="text-[13px] text-muted-foreground mt-0.5">Tải lên hàng loạt câu hỏi với định dạng chuẩn.</p>
              </div>
            </div>
            <button 
              @click="close"
              class="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              :disabled="isLoading"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Form Upload -->
          <template v-if="!isPreviewing">
            <div class="modal-content-scroll px-6 py-6">
              <!-- Alerts -->
              <div v-if="errorMsg" class="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium flex items-center gap-3 shadow-sm">
                <div class="p-1 bg-destructive/20 rounded-full"><X class="h-4 w-4" /></div>
                {{ errorMsg }}
              </div>
              <div v-if="successMsg" class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-600 font-medium flex items-center gap-3 shadow-sm">
                <div class="p-1 bg-green-500/20 rounded-full"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
                {{ successMsg }}
              </div>

              <!-- Upload Section -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-semibold text-foreground flex items-center gap-2">
                    Tập tin dữ liệu (.xlsx)
                    <span class="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">Bắt buộc</span>
                  </label>
                  <button @click="handleDownloadTemplate" type="button" class="text-[13px] text-primary font-medium flex items-center gap-1.5 hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg">
                    <Download class="h-3.5 w-3.5" /> File mẫu chuẩn
                  </button>
                </div>
                
                <div class="relative group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/30 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <label for="dropzone-file" class="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border/80 rounded-2xl cursor-pointer bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 transition-all duration-300 group-hover:shadow-md">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                      <div class="mb-4 p-3 rounded-full bg-background shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud class="w-6 h-6 text-primary" />
                      </div>
                      <p class="mb-2 text-[15px] text-foreground font-medium">
                        <span class="text-primary hover:underline">Nhấn để tải lên</span> hoặc kéo thả
                      </p>
                      <p class="text-xs text-muted-foreground font-medium px-4 max-w-full truncate">
                        Hỗ trợ định dạng .xlsx, .xls
                      </p>
                      <div v-if="file" class="mt-4 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold truncate max-w-[90%] border border-primary/20">
                        {{ file.name }}
                      </div>
                    </div>
                    <input id="dropzone-file" type="file" accept=".xlsx, .xls" class="hidden" @change="handleFileChange" />
                  </label>
                </div>
              </div>

              <!-- Folder Path -->
              <div class="space-y-2.5">
                <label class="text-sm font-semibold text-foreground flex items-center gap-2">
                  Thư mục ảnh cục bộ
                  <span class="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Tùy chọn</span>
                </label>
                <div class="relative">
                  <input 
                    v-model="imageFolderPath"
                    type="text" 
                    placeholder="VD: C:\Users\Admin\Downloads"
                    class="app-input w-full pl-10 bg-secondary/10 border-border/50 focus:border-primary focus:ring-primary/20 rounded-xl transition-all"
                  />
                  <div class="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  </div>
                </div>
                <p class="text-[12px] text-muted-foreground flex items-start gap-1.5 mt-1">
                  <svg class="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Bỏ trống để Backend tự lấy ảnh từ thư mục <strong>Downloads</strong> mặc định. Dành cho các câu hỏi có chèn ảnh.</span>
                </p>
              </div>
            </div>

            <div class="border-t border-border/40 bg-secondary/20 px-6 py-4 flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Đảm bảo dữ liệu đúng chuẩn template.</span>
              <div class="flex justify-end gap-3">
                <button type="button" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground bg-background border border-border/50 hover:bg-secondary transition-colors" @click="close" :disabled="isLoading">
                  Hủy bỏ
                </button>
                <button type="button" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" @click="handlePreview" :disabled="isLoading || !file">
                  <span v-if="isLoading" class="flex items-center gap-2">
                    <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </span>
                  <span v-else class="flex items-center gap-2">
                    Kiểm tra dữ liệu <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </span>
                </button>
              </div>
            </div>
          </template>

          <!-- Preview Table -->
          <template v-else>
            <div class="p-6 overflow-hidden flex flex-col h-full bg-background/30 gap-4">
              <!-- Alerts -->
              <div v-if="errorMsg" class="shrink-0 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium flex items-center gap-3">
                <div class="p-1 bg-destructive/20 rounded-full"><X class="h-4 w-4" /></div>
                {{ errorMsg }}
              </div>
              <div v-if="successMsg" class="shrink-0 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-sm text-green-600 font-medium flex items-center gap-3">
                <div class="p-1 bg-green-500/20 rounded-full"><svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></div>
                {{ successMsg }}
              </div>

              <div class="flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 border border-green-500/20">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-foreground">Phát hiện <span class="text-primary">{{ previewData.length }}</span> câu hỏi hợp lệ</h3>
                    <p class="text-xs text-muted-foreground">Vui lòng kiểm tra kỹ nội dung trước khi đưa vào hệ thống.</p>
                  </div>
                </div>
              </div>
              
              <div class="border border-border/50 rounded-xl overflow-auto shadow-sm bg-background flex-1 max-h-[60vh] custom-scrollbar">
                <table class="w-full text-left text-sm relative">
                  <thead class="bg-secondary/80 text-muted-foreground uppercase text-[10px] font-black tracking-wider sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th class="px-4 py-3.5 border-b border-border/50 w-12 text-center">STT</th>
                      <th class="px-5 py-3.5 border-b border-border/50 w-[45%]">Nội dung & Giải thích</th>
                      <th class="px-5 py-3.5 border-b border-border/50 w-[35%]">Đáp án</th>
                      <th class="px-4 py-3.5 border-b border-border/50 w-36">Phân loại</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border/40 text-foreground">
                    <tr v-for="(q, idx) in previewData" :key="idx" class="hover:bg-secondary/30 transition-colors align-top group">
                      <td class="px-4 py-5 text-center font-bold text-muted-foreground group-hover:text-primary transition-colors">{{ idx + 1 }}</td>
                      
                      <!-- Cột Nội dung -->
                      <td class="px-5 py-5 space-y-3">
                      <div 
                        class="font-medium whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/90"
                        v-html="renderQuestionContent(q.content, 'LATEX')"
                      ></div>
                        <div v-if="q.url" class="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          Có đính kèm File Ảnh
                        </div>
                        <div v-if="q.explanation" class="text-[13px] text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/40 whitespace-pre-wrap break-words mt-2 relative">
                          <div class="absolute -left-px top-3 bottom-3 w-0.5 bg-primary/30 rounded-r-full"></div>
                          <span class="font-bold text-foreground">Giải thích:</span> 
                          <span v-html="renderQuestionContent(q.explanation, 'LATEX')"></span>
                        </div>
                      </td>
                      
                      <!-- Cột Đáp án -->
                      <td class="px-5 py-5">
                        <template v-if="q.type === 'MCQ'">
                          <ul class="space-y-2">
                            <li v-for="(opt, oIdx) in q.options" :key="oIdx" 
                                class="text-[13px] p-2.5 rounded-xl border flex items-start gap-3 transition-colors"
                                :class="opt.isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-700 shadow-sm' : 'bg-background border-border/60 text-muted-foreground'">
                              <div class="font-bold shrink-0 mt-[1px] flex items-center justify-center w-5 h-5 rounded-md text-[11px]" 
                                   :class="opt.isCorrect ? 'bg-green-500 text-white shadow-sm' : 'bg-secondary text-muted-foreground'">
                                {{ String.fromCharCode(65 + oIdx) }}
                              </div>
                              <div 
                                class="whitespace-pre-wrap break-words leading-relaxed flex-1" 
                                :class="opt.isCorrect ? 'font-medium' : ''"
                                v-html="renderQuestionContent(opt.content, 'LATEX')"
                              ></div>
                              <span v-if="opt.isCorrect" class="text-green-600 mt-[2px] shrink-0"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></span>
                            </li>
                          </ul>
                        </template>
                        <template v-else-if="q.type === 'ESSAY'">
                          <div class="text-[13px] text-muted-foreground bg-secondary/20 p-3 rounded-xl border border-border/40 whitespace-pre-wrap break-words h-full">
                            <span class="font-bold text-foreground block mb-1">Gợi ý đáp án:</span>
                            <div v-html="renderQuestionContent(q.sampleAnswer || '(Không có)', 'LATEX')"></div>
                          </div>
                        </template>
                      </td>
                      
                      <!-- Cột Phân loại -->
                      <td class="px-4 py-5">
                        <div class="flex flex-col gap-2.5">
                          <div class="bg-secondary/30 p-2 rounded-lg border border-border/40">
                            <span class="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Mã Chủ đề</span>
                            <span class="font-mono font-semibold text-[13px] text-foreground">{{ q.topicId }}</span>
                          </div>
                          
                          <div class="flex flex-wrap gap-1.5">
                            <span class="px-2 py-1 rounded-md text-[11px] font-bold border"
                                  :class="q.type === 'ESSAY' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'">
                              {{ q.type === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm' }}
                            </span>
                            <span class="px-2 py-1 rounded-md text-[11px] font-bold border uppercase" 
                                  :class="{
                                    'bg-green-500/10 text-green-600 border-green-500/20': q.difficulty === 'EASY',
                                    'bg-amber-500/10 text-amber-600 border-amber-500/20': q.difficulty === 'MEDIUM',
                                    'bg-red-500/10 text-red-600 border-red-500/20': q.difficulty === 'HARD'
                                  }">
                              {{ q.difficulty === 'EASY' ? 'Dễ' : q.difficulty === 'MEDIUM' ? 'TB' : q.difficulty === 'HARD' ? 'Khó' : q.difficulty }}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="border-t border-border/40 bg-secondary/10 px-6 py-4 flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Bạn có thể quay lại để chọn file khác.</span>
              <div class="flex justify-end gap-3">
                <button type="button" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground bg-background border border-border/50 hover:bg-secondary transition-colors" @click="isPreviewing = false" :disabled="isLoading">
                  Quay lại
                </button>
                <button type="button" class="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" @click="handleConfirmImport" :disabled="isLoading">
                  <span v-if="isLoading" class="flex items-center gap-2">
                    <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang lưu trữ...
                  </span>
                  <span v-else class="flex items-center gap-2">
                    <UploadCloud class="w-4 h-4" /> Xác nhận Nhập
                  </span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--border) / 0.8);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>
