<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { levelsAPI, subjectsAPI } from '@/services/api'
import { resolveMediaUrl } from '@/utils/url'

const router = useRouter()
const subjects = ref([])
const levels = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const totalSubjects = computed(() => subjects.value.length)

const displaySubjects = computed(() =>
  subjects.value.map(subject => ({
    ...subject,
    imageUrl: resolveMediaUrl(subject.imageUrl)
  }))
)

function normalizeCollection(payload) {
  const raw = payload?.data ?? payload
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.items)) return raw.items
  if (Array.isArray(raw?.results)) return raw.results
  return []
}

function normalizeLevel(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? ''
  }
}

function normalizeSubject(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? '',
    imageUrl: item?.imageUrl ?? null,
    levelId: item?.levelId ?? '',
    levelName: item?.levelName ?? ''
  }
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [levelsResponse, subjectsResponse] = await Promise.all([
      levelsAPI.getAll(),
      subjectsAPI.getAll()
    ])

    levels.value = normalizeCollection(levelsResponse.data).map(normalizeLevel)
    subjects.value = normalizeCollection(subjectsResponse.data).map(normalizeSubject)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được danh sách môn học'
  } finally {
    isLoading.value = false
  }
}

function openCreatePage() {
  router.push('/subjects/create')
}

function openEditPage(subject) {
  router.push(`/subjects/edit/${subject.id}`)
}

async function deleteSubject(subject) {
  const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa môn học "${subject.name}" không?`)
  if (!confirmed) return

  try {
    await subjectsAPI.delete(subject.id)
    subjects.value = subjects.value.filter(item => String(item.id) !== String(subject.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được môn học'
  }
}

function getLevelName(levelId, fallbackName) {
  return levels.value.find(level => String(level.id) === String(levelId))?.name || fallbackName || '—'
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Học liệu</p>
          <h1 class="mt-2 text-3xl font-bold text-foreground">Quản lý Môn học</h1>
          <p class="mt-2 text-muted-foreground">Dữ liệu đồng bộ từ API thật `/api/learning/subjects`.</p>
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

          <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" @click="openCreatePage">
            <Plus class="h-4 w-4" />
            Thêm môn học
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Tổng môn học</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ totalSubjects }}</p>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-border bg-card shadow-sm">
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-xl font-semibold text-foreground">Danh sách môn học</h2>
        <p class="mt-1 text-sm text-muted-foreground">Mỗi môn học phải gắn vào một level.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-left text-sm uppercase tracking-wide text-muted-foreground">
              <th class="px-6 py-3 font-semibold">Hình ảnh</th>
              <th class="px-6 py-3 font-semibold">Tên môn học</th>
              <th class="px-6 py-3 font-semibold">Level</th>
              <th class="px-6 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displaySubjects.length">
              <td colspan="4" class="px-6 py-10 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu môn học.
              </td>
            </tr>
            <tr v-for="subject in displaySubjects" :key="subject.id" class="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td class="px-6 py-4">
                <img v-if="subject.imageUrl" :src="subject.imageUrl" :alt="subject.name" class="h-10 w-10 rounded-md object-cover">
                <span v-else class="text-muted-foreground">—</span>
              </td>
              <td class="px-6 py-4 text-sm text-foreground">{{ subject.name }}</td>
              <td class="px-6 py-4 text-sm text-foreground">{{ getLevelName(subject.levelId, subject.levelName) }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted" @click="openEditPage(subject)">
                    <Pencil class="h-4 w-4" />
                    Sửa
                  </button>
                  <button class="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10" @click="deleteSubject(subject)">
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
  </div>
</template>
