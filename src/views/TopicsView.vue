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
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="app-kicker">Học liệu & Hệ thống</div>
            <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Quản lý Chủ đề</h1>
            <p class="mt-2 text-muted-foreground font-medium">Chi tiết hóa các chủ đề kiến thức cho từng môn học.</p>
          </div>

          <div class="flex items-center gap-4">
            <button
              class="app-btn-secondary !py-2.5 group"
              :disabled="isLoading"
              @click="loadData"
            >
              <RefreshCw class="h-4 w-4 transition-transform group-hover:rotate-180" :class="{ 'animate-spin': isLoading }" />
              Làm mới
            </button>

            <button class="app-btn-primary group" @click="openCreateDialog">
              <Plus class="h-5 w-5 transition-transform group-hover:rotate-90" />
              Thêm chủ đề mới
            </button>
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tổng số chủ đề</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-primary">{{ totalTopics }}</p>
              <p class="text-xs font-bold text-muted-foreground">chủ đề</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMessage }}
      </div>

      <div class="app-surface shadow-xl">
        <div class="border-b border-border/50 px-8 py-6 flex items-center justify-between bg-white/30 dark:bg-black/20">
          <div>
            <h2 class="text-xl font-bold text-foreground">Danh sách chủ đề</h2>
            <p class="text-xs text-muted-foreground mt-1">Các chủ đề kiến thức được phân loại theo môn học.</p>
          </div>
          <div class="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40">
                <th class="px-8 py-4">Chủ đề</th>
                <th class="px-8 py-4">Môn học</th>
                <th class="px-8 py-4">Cấp độ</th>
                <th class="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr v-if="!topics.length && !isLoading">
                <td colspan="4" class="px-8 py-16 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <div class="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <RefreshCw class="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p class="text-sm font-bold text-muted-foreground">Chưa có chủ đề nào được tạo</p>
                  </div>
                </td>
              </tr>
              <tr v-if="isLoading">
                 <td colspan="4" class="px-8 py-16 text-center">
                    <RefreshCw class="h-8 w-8 animate-spin mx-auto text-primary" />
                 </td>
              </tr>
              <tr v-for="(topic, index) in topics" :key="topic.id" 
                  class="group transition-colors hover:bg-primary/5"
                  :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']">
                <td class="px-8 py-5">
                  <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ topic.name }}</span>
                </td>
                <td class="px-8 py-5">
                   <span class="text-sm font-medium text-foreground/80">{{ getSubjectName(topic.subjectId, topic.subjectName) }}</span>
                </td>
                <td class="px-8 py-5">
                  <span class="inline-flex items-center rounded-lg bg-secondary/50 px-2.5 py-1 text-[11px] font-bold text-muted-foreground ring-1 ring-border/50">
                    {{ getLevelName(topic.subjectId, topic.levelName) }}
                  </span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-3 opacity-70 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:text-primary dark:bg-white/5" @click="openEditDialog(topic)">
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shadow-sm transition-all hover:-translate-y-1 hover:bg-destructive/10" @click="deleteTopic(topic)">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa chủ đề' : 'Thêm chủ đề'" description="Gán chủ đề vào môn học tương ứng." size="md" @close="closeDialog">
      <div class="space-y-6 pt-4">
        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="topic-name">Tên chủ đề</label>
          <input id="topic-name" v-model="formState.name" type="text" class="app-input" placeholder="VD: Hàm số, Đạo hàm..." />
        </div>

        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="topic-subject">Môn học</label>
          <select id="topic-subject" v-model="formState.subjectId" class="app-select">
            <option value="" disabled>Chọn môn học</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ getSubjectDisplayLabel(subject) }}
            </option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4">
          <button class="app-btn-secondary !px-8" @click="closeDialog">Hủy</button>
          <button class="app-btn-primary !px-10" :disabled="isSaving" @click="saveTopic">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu chủ đề
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

