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
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <RouterLink to="/subjects" class="rounded-md border border-border p-2 hover:bg-muted">
        <ArrowLeft class="h-5 w-5" />
      </RouterLink>
      <div>
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Chỉnh sửa Môn học' : 'Tạo mới Môn học' }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Cập nhật thông tin chi tiết của môn học.' : 'Thêm một môn học mới vào hệ thống.' }}
        </p>
      </div>
    </div>

    <div class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <form @submit.prevent="saveSubject" class="space-y-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="space-y-2 md:col-span-2">
            <label for="subject-name" class="text-sm font-medium">Tên môn học</label>
            <input
              id="subject-name"
              v-model="formState.name"
              type="text"
              placeholder="Ví dụ: Lập trình Web nâng cao"
              class="w-full rounded-md border border-input bg-background px-3 py-2"
              :disabled="isLoading"
            />
          </div>

          <div class="space-y-2">
            <label for="subject-level" class="text-sm font-medium">Level</label>
            <select
              id="subject-level"
              v-model="formState.levelId"
              class="w-full rounded-md border border-input bg-background px-3 py-2"
              :disabled="isLoading || !levels.length"
            >
              <option value="" disabled>Chọn level</option>
              <option v-for="level in levels" :key="level.id" :value="level.id">
                {{ level.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Hình ảnh môn học</label>
          <div class="flex items-center gap-4">
            <div class="h-24 w-24 flex-shrink-0 rounded-md border border-dashed border-input">
              <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="Xem trước" class="h-full w-full rounded-md object-cover" />
              <div v-else class="flex h-full w-full items-center justify-center bg-muted/50">
                <UploadCloud class="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div class="space-y-2">
              <label for="file-upload" class="cursor-pointer rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80">
                Chọn ảnh
              </label>
              <input id="file-upload" type="file" class="sr-only" accept="image/*" @change="handleFileSelect" />
              <p class="text-xs text-muted-foreground">PNG, JPG, GIF tối đa 10MB.</p>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {{ errorMessage }}
        </div>

        <div class="flex justify-end gap-3">
          <RouterLink to="/subjects" class="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            Hủy
          </RouterLink>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            :disabled="isSaving || isUploading"
          >
            <RefreshCw v-if="isSaving || isUploading" class="h-4 w-4 animate-spin" />
            {{ isEditing ? 'Lưu thay đổi' : 'Tạo môn học' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
