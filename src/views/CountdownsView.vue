<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, RefreshCw, Trash2, CalendarDays, TimerReset } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
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

const isConfirmDialogOpen = ref(false)
const confirmDialogConfig = reactive({
  title: '',
  message: '',
  onConfirm: () => {}
})

function triggerConfirm(config) {
  confirmDialogConfig.title = config.title || 'Xác nhận'
  confirmDialogConfig.message = config.message || ''
  confirmDialogConfig.onConfirm = config.onConfirm
  isConfirmDialogOpen.value = true
}

function handleConfirmDialogAction() {
  confirmDialogConfig.onConfirm()
  isConfirmDialogOpen.value = false
}

function deleteCountdown(countdown) {
  triggerConfirm({
    title: 'Xóa mốc sự kiện',
    message: `Bạn có chắc chắn muốn xóa mốc đếm ngược "${countdown.title}" không?`,
    onConfirm: async () => {
      try {
        await countdownsAPI.delete(countdown.id)
        countdowns.value = countdowns.value.filter(item => String(item.id) !== String(countdown.id))
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Không xoá được countdown'
      }
    }
  })
}

onMounted(loadData)
</script>

<template>
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl overflow-hidden relative group">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div class="app-kicker">Tiện ích & Hệ thống</div>
            <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Đếm ngược Kỳ thi</h1>
            <p class="mt-2 text-muted-foreground font-medium">Quản lý các mốc thời gian quan trọng và kỳ thi sắp tới.</p>
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
              Thêm countdown mới
            </button>
          </div>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tổng số mốc thi</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-primary">{{ totalCountdowns }}</p>
              <p class="text-xs font-bold text-muted-foreground">mốc</p>
            </div>
          </div>
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sắp tới</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-emerald-500">{{ upcomingCountdowns }}</p>
              <p class="text-xs font-bold text-muted-foreground">kỳ thi</p>
            </div>
          </div>
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đã diễn ra</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-muted-foreground">{{ pastCountdowns }}</p>
            </div>
          </div>
        </div>

        <!-- Decorative element -->
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]"></div>
      </section>

      <!-- Main Content -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-4 text-sm text-destructive font-bold flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMessage }}
      </div>

      <div class="app-surface shadow-xl">
        <div class="border-b border-border/50 px-8 py-6 flex items-center justify-between bg-white/30 dark:bg-black/20">
          <div>
            <h2 class="text-xl font-bold text-foreground">Danh sách mốc thời gian</h2>
            <p class="text-xs text-muted-foreground mt-1">Các kỳ thi được sắp xếp theo thời gian thực tế.</p>
          </div>
          <div class="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40">
                <th class="px-8 py-4">Sự kiện</th>
                <th class="px-8 py-4">Ngày thi</th>
                <th class="px-8 py-4">Trạng thái</th>
                <th class="px-8 py-4">Cấp độ</th>
                <th class="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr v-if="!displayCountdowns.length && !isLoading">
                <td colspan="5" class="px-8 py-16 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <div class="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <TimerReset class="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p class="text-sm font-bold text-muted-foreground">Chưa có mốc thời gian nào</p>
                  </div>
                </td>
              </tr>
              <tr v-if="isLoading">
                 <td colspan="5" class="px-8 py-16 text-center">
                    <RefreshCw class="h-8 w-8 animate-spin mx-auto text-primary" />
                 </td>
              </tr>
              <tr v-for="(countdown, index) in displayCountdowns" :key="countdown.id" 
                  class="group transition-colors hover:bg-primary/5"
                  :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']">
                <td class="px-8 py-5">
                  <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ countdown.title }}</span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex items-center gap-2 text-sm text-foreground/80">
                    <CalendarDays class="h-4 w-4 text-primary" />
                    {{ countdown.displayDate }}
                  </div>
                </td>
                <td class="px-8 py-5">
                  <span
                    class="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold ring-1"
                    :class="countdown.remainingDays < 0
                      ? 'bg-destructive/5 text-destructive ring-destructive/20'
                      : countdown.remainingDays === 0
                        ? 'bg-amber-500/5 text-amber-600 ring-amber-500/20'
                        : 'bg-emerald-500/5 text-emerald-600 ring-emerald-500/20'"
                  >
                    {{ getCountdownLabel(countdown.remainingDays) }}
                  </span>
                </td>
                <td class="px-8 py-5">
                  <span class="text-xs font-bold text-muted-foreground uppercase tracking-widest">{{ countdown.levelLabel }}</span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-3 opacity-70 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:text-primary dark:bg-white/5" @click="openEditDialog(countdown)">
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shadow-sm transition-all hover:-translate-y-1 hover:bg-destructive/10" @click="deleteCountdown(countdown)">
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
    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa mốc thời gian' : 'Thêm mốc mới'" description="Thiết lập đếm ngược cho sự kiện sắp tới." size="md" @close="closeDialog">
      <div class="space-y-6 pt-4">
        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="countdown-title">Tiêu đề sự kiện</label>
          <input id="countdown-title" v-model="formState.title" type="text" class="app-input" placeholder="VD: Kỳ thi THPT Quốc gia 2024" />
        </div>

        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="countdown-date">Ngày diễn ra</label>
          <input id="countdown-date" v-model="formState.examDate" type="date" class="app-input" />
        </div>

        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="countdown-level">Cấp độ áp dụng</label>
          <select id="countdown-level" v-model="formState.levelId" class="app-select">
            <option value="">-- Chọn cấp độ --</option>
            <option v-for="level in levels" :key="level.id" :value="level.id">
              {{ level.name }}
            </option>
          </select>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4">
          <button class="app-btn-secondary !px-8" @click="closeDialog">Hủy</button>
          <button class="app-btn-primary !px-10" :disabled="isSaving" @click="saveCountdown">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu thông tin
          </button>
        </div>
      </div>
    </BaseDialog>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      :open="isConfirmDialogOpen"
      :title="confirmDialogConfig.title"
      :message="confirmDialogConfig.message"
      @close="isConfirmDialogOpen = false"
      @confirm="handleConfirmDialogAction"
    />
  </div>
</template>
