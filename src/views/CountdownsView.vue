<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, RefreshCw, Trash2, CalendarDays, TimerReset } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { countdownsAPI, levelsAPI } from '@/services/api'
import { normalizeCollection, normalizeCountdown, normalizeLevel } from '@/utils/normalizers'

const countdowns = ref([])
const levels = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const errorMessage = ref('')

const formState = reactive({
  title: '',
  examDate: '',
  levelId: ''
})

const totalCountdowns = computed(() => countdowns.value.length)
const upcomingCountdowns = computed(() => countdowns.value.filter(item => daysRemaining(item.examDate) >= 0).length)
const pastCountdowns = computed(() => countdowns.value.filter(item => daysRemaining(item.examDate) < 0).length)

const displayCountdowns = computed(() =>
  [...countdowns.value].sort((a, b) => {
    const aTime = new Date(a.examDate).getTime()
    const bTime = new Date(b.examDate).getTime()
    return aTime - bTime
  }).map(item => ({
    ...item,
    levelLabel: getLevelName(item.levelId, item.levelName),
    remainingDays: daysRemaining(item.examDate),
    displayDate: formatDate(item.examDate)
  }))
)

function normalizeDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date)
}

function daysRemaining(value) {
  if (!value) return 0
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 0
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - start.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function getCountdownLabel(days) {
  if (days === 0) return 'Hôm nay'
  if (days > 0) return `Còn ${days} ngày`
  return `Đã qua ${Math.abs(days)} ngày`
}

function getLevelName(levelId, fallbackName = '') {
  return levels.value.find(level => String(level.id) === String(levelId))?.name || fallbackName || '—'
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [levelsResponse, countdownsResponse] = await Promise.all([
      levelsAPI.getAll(),
      countdownsAPI.getAll()
    ])

    levels.value = normalizeCollection(levelsResponse.data).map(normalizeLevel)
    countdowns.value = normalizeCollection(countdownsResponse.data).map(normalizeCountdown)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được danh sách countdown'
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.title = ''
  formState.examDate = ''
  formState.levelId = ''
  editId.value = null
  isEditing.value = false
}

function openCreateDialog() {
  resetForm()
  isDialogOpen.value = true
  errorMessage.value = ''
}

function openEditDialog(countdown) {
  formState.title = countdown.title || ''
  formState.examDate = normalizeDateInput(countdown.examDate)
  formState.levelId = countdown.levelId || ''
  editId.value = countdown.id
  isEditing.value = true
  isDialogOpen.value = true
  errorMessage.value = ''
}

function closeDialog() {
  isDialogOpen.value = false
  errorMessage.value = ''
}

async function saveCountdown() {
  if (!formState.title.trim()) {
    errorMessage.value = 'Vui lòng nhập tiêu đề countdown'
    return
  }

  if (!formState.examDate) {
    errorMessage.value = 'Vui lòng chọn ngày thi'
    return
  }

  if (!formState.levelId) {
    errorMessage.value = 'Vui lòng chọn level'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const payload = {
      title: formState.title.trim(),
      examDate: formState.examDate,
      levelId: Number(formState.levelId) || formState.levelId
    }

    const response = isEditing.value && editId.value
      ? await countdownsAPI.update(editId.value, payload)
      : await countdownsAPI.create(payload)

    const savedCountdown = normalizeCountdown(response.data?.data ?? response.data ?? payload)

    countdowns.value = isEditing.value
      ? countdowns.value.map(item => String(item.id) === String(savedCountdown.id) ? savedCountdown : item)
      : [savedCountdown, ...countdowns.value.filter(item => String(item.id) !== String(savedCountdown.id))]

    closeDialog()
    resetForm()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không lưu được countdown'
  } finally {
    isSaving.value = false
  }
}

async function deleteCountdown(countdown) {
  const confirmed = window.confirm(`Xóa countdown "${countdown.title}"?`)
  if (!confirmed) return

  try {
    await countdownsAPI.delete(countdown.id)
    countdowns.value = countdowns.value.filter(item => String(item.id) !== String(countdown.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được countdown'
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Countdown</p>
          <h1 class="mt-2 text-3xl font-bold text-foreground">Đếm ngày tới kỳ thi</h1>
          <p class="mt-2 text-muted-foreground">Quản lý danh sách countdown từ API thật `/api/countdowns`.</p>
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
            Thêm countdown
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Tổng countdown</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ totalCountdowns }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Sắp tới / hôm nay</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ upcomingCountdowns }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Đã qua</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ pastCountdowns }}</p>
        </div>
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Biểu tượng</p>
          <div class="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <TimerReset class="h-4 w-4" />
            Đếm ngược kỳ thi
          </div>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-border bg-card shadow-sm">
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-xl font-semibold text-foreground">Danh sách countdown</h2>
        <p class="mt-1 text-sm text-muted-foreground">Hiển thị theo ngày thi gần nhất.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-left text-sm uppercase tracking-wide text-muted-foreground">
              <th class="px-6 py-3 font-semibold">Tiêu đề</th>
              <th class="px-6 py-3 font-semibold">Ngày thi</th>
              <th class="px-6 py-3 font-semibold">Còn lại</th>
              <th class="px-6 py-3 font-semibold">Level</th>
              <th class="px-6 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!displayCountdowns.length">
              <td colspan="5" class="px-6 py-10 text-center text-sm text-muted-foreground">
                Chưa có countdown nào.
              </td>
            </tr>
            <tr v-for="countdown in displayCountdowns" :key="countdown.id" class="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="font-medium text-foreground">{{ countdown.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ getCountdownLabel(countdown.remainingDays) }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-foreground">
                <div class="flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-muted-foreground" />
                  {{ countdown.displayDate }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-foreground">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  :class="countdown.remainingDays < 0
                    ? 'bg-destructive/10 text-destructive'
                    : countdown.remainingDays === 0
                      ? 'bg-amber-500/10 text-amber-700'
                      : 'bg-emerald-500/10 text-emerald-700'"
                >
                  {{ getCountdownLabel(countdown.remainingDays) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-foreground">{{ countdown.levelLabel }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted" @click="openEditDialog(countdown)">
                    <Pencil class="h-4 w-4" />
                    Sửa
                  </button>
                  <button class="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10" @click="deleteCountdown(countdown)">
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

    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa countdown' : 'Thêm countdown'" description="Nhập tiêu đề, ngày thi và level để hiển thị đếm ngược." size="md" @close="closeDialog">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="countdown-title">Tiêu đề</label>
          <input id="countdown-title" v-model="formState.title" type="text" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" placeholder="VD: Thi thử Toán 12" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="countdown-date">Ngày thi</label>
          <input id="countdown-date" v-model="formState.examDate" type="date" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="countdown-level">Level</label>
          <select id="countdown-level" v-model="formState.levelId" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground">
            <option value="">-- Chọn level --</option>
            <option v-for="level in levels" :key="level.id" :value="level.id">
              {{ level.name }}
            </option>
          </select>
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

        <div class="flex items-center justify-end gap-3">
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted" @click="closeDialog">Hủy</button>
          <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" :disabled="isSaving" @click="saveCountdown">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>
