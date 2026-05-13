<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { levelsAPI, subjectsAPI } from '@/services/api'
import { resolveBackendUrl } from '@/utils/url'
import { normalizeCollection, normalizeLevel, normalizeSubject } from '@/utils/normalizers'

const router = useRouter()
const subjects = ref([])
const levels = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const totalSubjects = computed(() => subjects.value.length)

const displaySubjects = computed(() =>
  subjects.value.map(subject => ({
    ...subject,
    imageUrl: resolveBackendUrl(subject.imageUrl)
  }))
)
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
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="app-kicker">Học liệu & Hệ thống</div>
            <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Quản lý Môn học</h1>
            <p class="mt-2 text-muted-foreground font-medium">Cấu trúc các môn học theo từng cấp độ tương ứng.</p>
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

            <button class="app-btn-primary group" @click="openCreatePage">
              <Plus class="h-5 w-5 transition-transform group-hover:rotate-90" />
              Thêm môn học mới
            </button>
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tổng số môn học</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-primary">{{ totalSubjects }}</p>
              <p class="text-xs font-bold text-muted-foreground">môn học</p>
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
            <h2 class="text-xl font-bold text-foreground">Danh sách môn học</h2>
            <p class="text-xs text-muted-foreground mt-1">Mỗi môn học được gắn chặt với một cấp độ cụ thể.</p>
          </div>
          <div class="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40">
                <th class="px-8 py-4">Môn học</th>
                <th class="px-8 py-4">Cấp độ</th>
                <th class="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr v-if="!displaySubjects.length && !isLoading">
                <td colspan="3" class="px-8 py-16 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <div class="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <RefreshCw class="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p class="text-sm font-bold text-muted-foreground">Chưa có môn học nào được tạo</p>
                  </div>
                </td>
              </tr>
              <tr v-if="isLoading">
                 <td colspan="3" class="px-8 py-16 text-center">
                    <RefreshCw class="h-8 w-8 animate-spin mx-auto text-primary" />
                 </td>
              </tr>
              <tr v-for="(subject, index) in displaySubjects" :key="subject.id" 
                  class="group transition-colors hover:bg-primary/5"
                  :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted/20 border border-border/50">
                      <img v-if="subject.imageUrl" :src="subject.imageUrl" :alt="subject.name" class="h-full w-full object-cover transition-transform group-hover:scale-110">
                      <div v-else class="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-black">
                        {{ subject.name.charAt(0) }}
                      </div>
                    </div>
                    <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ subject.name }}</span>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <span class="inline-flex items-center rounded-lg bg-secondary/50 px-2.5 py-1 text-[11px] font-bold text-muted-foreground ring-1 ring-border/50">
                    {{ getLevelName(subject.levelId, subject.levelName) }}
                  </span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:text-primary dark:bg-white/5" @click="openEditPage(subject)">
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shadow-sm transition-all hover:-translate-y-1 hover:bg-destructive/10" @click="deleteSubject(subject)">
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
  </div>
</template>
