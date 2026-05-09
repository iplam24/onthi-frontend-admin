<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, UploadCloud } from 'lucide-vue-next'
import { filesAPI, levelsAPI, subjectsAPI } from '@/services/api'
import { resolveMediaUrl } from '@/utils/url'

const route = useRoute()
const router = useRouter()

const isEditing = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const levels = ref([])
const imageFile = ref(null)
const imagePreviewUrl = ref('')
const formState = reactive({
  name: '',
  imageUrl: '',
  levelId: ''
})

const subjectId = route.params.id

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  imageFile.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

async function uploadImage() {
  if (!imageFile.value) return ''

  isUploading.value = true
  errorMessage.value = ''

  try {
    const response = await filesAPI.upload(imageFile.value)
    const data = response.data?.data || response.data
    return data.url || data.fileUrl || data.path || ''
  } catch (error) {
    errorMessage.value = 'Lỗi upload hình ảnh: ' + (error.response?.data?.message || error.message)
    return ''
  } finally {
    isUploading.value = false
  }
}

async function loadLevels() {
  try {
    const response = await levelsAPI.getAll()
    levels.value = response.data?.data || []
  } catch (error) {
    errorMessage.value = 'Không tải được danh sách level.'
  }
}

async function loadSubjectForEdit() {
  if (!subjectId) return
  isEditing.value = true
  isLoading.value = true
  try {
    const response = await subjectsAPI.getById(subjectId)
    const subject = response.data?.data || {}
    formState.name = subject.name || ''
    formState.imageUrl = subject.imageUrl || ''
    formState.levelId = subject.levelId || ''
    if (subject.imageUrl) {
      imagePreviewUrl.value = resolveMediaUrl(subject.imageUrl)
    }
  } catch (error) {
    errorMessage.value = 'Không tải được dữ liệu môn học.'
  } finally {
    isLoading.value = false
  }
}

async function saveSubject() {
  if (!formState.name.trim()) {
    errorMessage.value = 'Vui lòng nhập tên môn học.'
    return
  }
  if (!formState.levelId) {
    errorMessage.value = 'Vui lòng chọn level.'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  let uploadedUrl = formState.imageUrl
  if (imageFile.value) {
    uploadedUrl = await uploadImage()
    if (!uploadedUrl) {
      isSaving.value = false
      return
    }
  }

  const payload = {
    name: formState.name.trim(),
    imageUrl: uploadedUrl,
    levelId: Number(formState.levelId)
  }

  try {
    if (isEditing.value) {
      await subjectsAPI.update(subjectId, payload)
    } else {
      await subjectsAPI.create(payload)
    }
    router.push('/subjects')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Đã có lỗi xảy ra.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadLevels()
  loadSubjectForEdit()
})
</script>

<template>
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-6">
            <button class="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-white shadow-sm transition-all hover:-translate-x-1 hover:bg-primary/5 dark:bg-white/5" @click="router.push('/subjects')">
              <ArrowLeft class="h-6 w-6" />
            </button>
            <div>
              <div class="app-kicker">Học liệu & Hệ thống</div>
              <h1 class="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{{ isEditing ? 'Chỉnh sửa Môn học' : 'Tạo môn học mới' }}</h1>
              <p class="mt-1 text-muted-foreground font-medium">{{ isEditing ? 'Cập nhật thông tin chi tiết của môn học.' : 'Thêm một môn học mới vào hệ thống quản lý.' }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Form -->
      <div class="app-surface shadow-xl p-8 max-w-4xl">
        <form @submit.prevent="saveSubject" class="space-y-10">
          <div class="grid gap-8 md:grid-cols-2">
            <div class="space-y-3 md:col-span-2">
              <label for="subject-name" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Tên môn học</label>
              <input
                id="subject-name"
                v-model="formState.name"
                type="text"
                placeholder="Ví dụ: Toán học, Ngữ văn..."
                class="app-input !text-lg !font-bold"
                :disabled="isLoading"
              />
            </div>

            <div class="space-y-3">
              <label for="subject-level" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Cấp độ (Level)</label>
              <select
                id="subject-level"
                v-model="formState.levelId"
                class="app-select"
                :disabled="isLoading || !levels.length"
              >
                <option value="" disabled>-- Chọn cấp độ --</option>
                <option v-for="level in levels" :key="level.id" :value="level.id">
                  {{ level.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-4">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Ảnh đại diện môn học</label>
            <div class="flex flex-wrap items-center gap-8">
              <div class="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/20 group">
                <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="Xem trước" class="h-full w-full object-cover transition-transform group-hover:scale-110" />
                <div v-else class="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <UploadCloud class="h-8 w-8 opacity-40" />
                  <span class="text-[10px] font-bold">Trống</span>
                </div>
              </div>
              
              <div class="space-y-3">
                <label for="file-upload" class="app-btn-secondary cursor-pointer inline-flex !py-2.5">
                  <UploadCloud class="h-4 w-4 mr-2" />
                  Chọn tệp tin ảnh
                </label>
                <input id="file-upload" type="file" class="sr-only" accept="image/*" @change="handleFileSelect" />
                <p class="text-xs font-medium text-muted-foreground">Hỗ trợ PNG, JPG, GIF. Dung lượng tối đa 10MB.</p>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {{ errorMessage }}
          </div>

          <div class="flex items-center justify-end gap-4 border-t border-border/50 pt-8">
            <button type="button" class="app-btn-secondary !px-8" @click="router.push('/subjects')">
              Hủy bỏ
            </button>
            <button
              type="submit"
              class="app-btn-primary !px-12 group"
              :disabled="isSaving || isUploading"
            >
              <RefreshCw v-if="isSaving || isUploading" class="h-4 w-4 animate-spin" />
              {{ isEditing ? 'Lưu thay đổi' : 'Khởi tạo môn học' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
