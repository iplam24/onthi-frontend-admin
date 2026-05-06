<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { subjectsAPI, topicsAPI } from '@/services/api'
import { normalizeCollection, normalizeSubject, normalizeTopic } from '@/utils/normalizers'

const subjects = ref([])
const topics = ref([])
const isLoading = ref(false)
const isDialogOpen = ref(false)
const isSaving = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const errorMessage = ref('')
const formState = reactive({ name: '', subjectId: '' })

const totalTopics = computed(() => topics.value.length)

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [subjectsResponse, topicsResponse] = await Promise.all([
      subjectsAPI.getAll(),
      topicsAPI.getAll()
    ])

    subjects.value = normalizeCollection(subjectsResponse.data).map(normalizeSubject)
    topics.value = normalizeCollection(topicsResponse.data).map(normalizeTopic)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được danh sách topic'
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.name = ''
  formState.subjectId = ''
  editId.value = null
  isEditing.value = false
}

function openCreateDialog() {
  resetForm()
  isDialogOpen.value = true
  errorMessage.value = ''
}

function openEditDialog(topic) {
  formState.name = topic.name || ''
  formState.subjectId = topic.subjectId || ''
  editId.value = topic.id
  isEditing.value = true
  isDialogOpen.value = true
  errorMessage.value = ''
}

function closeDialog() {
  isDialogOpen.value = false
  errorMessage.value = ''
}

async function saveTopic() {
  if (!formState.name.trim()) {
    errorMessage.value = 'Vui lòng nhập tên topic'
    return
  }

  if (!formState.subjectId) {
    errorMessage.value = 'Vui lòng chọn môn học'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      name: formState.name.trim(),
      subjectId: Number(formState.subjectId) || formState.subjectId
    }

    const response = isEditing.value && editId.value
      ? await topicsAPI.update(editId.value, payload)
      : await topicsAPI.create(payload)

    const savedTopic = normalizeTopic(response.data?.data ?? response.data ?? payload)

    topics.value = isEditing.value
      ? topics.value.map(topic => String(topic.id) === String(savedTopic.id) ? savedTopic : topic)
      : [savedTopic, ...topics.value.filter(topic => String(topic.id) !== String(savedTopic.id))]

    closeDialog()
    resetForm()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không lưu được topic'
  } finally {
    isSaving.value = false
  }
}

async function deleteTopic(topic) {
  try {
    await topicsAPI.delete(topic.id)
    topics.value = topics.value.filter(item => String(item.id) !== String(topic.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được topic'
  }
}

function getSubjectName(subjectId, fallbackName) {
  return subjects.value.find(subject => String(subject.id) === String(subjectId))?.name || fallbackName || '—'
}

function getLevelName(subjectId, fallbackName) {
  return subjects.value.find(subject => String(subject.id) === String(subjectId))?.levelName || fallbackName || '—'
}

function getSubjectDisplayLabel(subject) {
  const levelName = subject.levelName || getLevelName(subject.id, '')
  return levelName ? `${subject.name} - ${levelName}` : subject.name
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Học liệu</p>
          <h1 class="mt-2 text-3xl font-bold text-foreground">Quản lý Chủ đề</h1>
          <p class="mt-2 text-muted-foreground">Dữ liệu đồng bộ từ API thật `/api/learning/topics`.</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            :disabled="isLoading"
            @click="loadData"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            Làm mới
          </button>

          <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" @click="openCreateDialog">
            <Plus class="h-4 w-4" />
            Thêm chủ đề
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Tổng chủ đề</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ totalTopics }}</p>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-border bg-card shadow-sm">
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-xl font-semibold text-foreground">Danh sách chủ đề</h2>
        <p class="mt-1 text-sm text-muted-foreground">Mỗi chủ đề phải gắn vào một môn học.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-left text-sm uppercase tracking-wide text-muted-foreground">
              <th class="px-6 py-3 font-semibold">Tên chủ đề</th>
              <th class="px-6 py-3 font-semibold">Môn học</th>
              <th class="px-6 py-3 font-semibold">Level</th>
              <th class="px-6 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!topics.length">
              <td colspan="4" class="px-6 py-10 text-center text-sm text-muted-foreground">
                Chưa có chủ đề nào.
              </td>
            </tr>
            <tr v-for="topic in topics" :key="topic.id" class="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td class="px-6 py-4 text-sm text-foreground">{{ topic.name }}</td>
              <td class="px-6 py-4 text-sm text-foreground">{{ getSubjectName(topic.subjectId, topic.subjectName) }}</td>
              <td class="px-6 py-4 text-sm text-foreground">{{ getLevelName(topic.subjectId, topic.levelName) }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted" @click="openEditDialog(topic)">
                    <Pencil class="h-4 w-4" />
                    Sửa
                  </button>
                  <button class="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10" @click="deleteTopic(topic)">
                    <Trash2 class="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa chủ đề' : 'Thêm chủ đề'" description="Chủ đề phải gắn đúng môn học theo document." size="md" @close="closeDialog">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="topic-name">Tên chủ đề</label>
          <input id="topic-name" v-model="formState.name" type="text" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" placeholder="VD: Hàm số" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="topic-subject">Môn học</label>
          <select id="topic-subject" v-model="formState.subjectId" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground">
            <option value="" disabled>Chọn môn học</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ getSubjectDisplayLabel(subject) }}
            </option>
          </select>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

        <div class="flex items-center justify-end gap-3">
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted" @click="closeDialog">Hủy</button>
          <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" :disabled="isSaving" @click="saveTopic">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

