<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import BaseDialog from '@/components/ui/BaseDialog.vue'
import { levelsAPI } from '@/services/api'
import { normalizeCollection, normalizeLevel } from '@/utils/normalizers'

const levels = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const errorMessage = ref('')
const formState = reactive({ name: '' })

const totalLevels = computed(() => levels.value.length)

async function loadLevels() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await levelsAPI.getAll()
    levels.value = normalizeCollection(response.data).map(normalizeLevel)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không tải được danh sách level'
  } finally {
    isLoading.value = false
  }
}

function resetForm() {
  formState.name = ''
  editId.value = null
  isEditing.value = false
}

function openCreateDialog() {
  resetForm()
  isDialogOpen.value = true
  errorMessage.value = ''
}

function openEditDialog(level) {
  formState.name = level.name || ''
  editId.value = level.id
  isEditing.value = true
  isDialogOpen.value = true
  errorMessage.value = ''
}

function closeDialog() {
  isDialogOpen.value = false
  errorMessage.value = ''
}

async function saveLevel() {
  if (!formState.name.trim()) {
    errorMessage.value = 'Vui lòng nhập tên level'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    const payload = { name: formState.name.trim() }
    const response = isEditing.value && editId.value
      ? await levelsAPI.update(editId.value, payload)
      : await levelsAPI.create(payload)

    const savedLevel = normalizeLevel(response.data?.data ?? response.data ?? payload)

    levels.value = isEditing.value
      ? levels.value.map(level => String(level.id) === String(savedLevel.id) ? savedLevel : level)
      : [savedLevel, ...levels.value.filter(level => String(level.id) !== String(savedLevel.id))]

    closeDialog()
    resetForm()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không lưu được level'
  } finally {
    isSaving.value = false
  }
}

async function deleteLevel(level) {
  try {
    await levelsAPI.delete(level.id)
    levels.value = levels.value.filter(item => String(item.id) !== String(level.id))
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Không xoá được level'
  }
}

onMounted(loadLevels)
</script>

<template>
  <div class="app-page">
    <div class="space-y-8">
      <!-- Header Section -->
      <section class="app-surface p-8 shadow-2xl">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="app-kicker">Học liệu & Hệ thống</div>
            <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-foreground">Quản lý Cấp độ</h1>
            <p class="mt-2 text-muted-foreground font-medium">Quản lý các khối lớp và cấp học trong hệ thống.</p>
          </div>

          <button class="app-btn-primary group" @click="openCreateDialog">
            <Plus class="h-5 w-5 transition-transform group-hover:rotate-90" />
            Thêm cấp độ mới
          </button>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="app-surface !bg-white/40 dark:!bg-white/5 p-5 shadow-sm">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tổng số cấp độ</p>
            <div class="mt-2 flex items-baseline gap-2">
              <p class="text-3xl font-black text-primary">{{ totalLevels }}</p>
              <p class="text-xs font-bold text-muted-foreground">khối lớp</p>
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
          <h2 class="text-xl font-bold text-foreground">Danh sách cấp độ</h2>
          <div class="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-border/40">
                <th class="px-8 py-4">Tên cấp độ</th>
                <th class="px-8 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/40">
              <tr v-if="!levels.length && !isLoading">
                <td colspan="2" class="px-8 py-16 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <div class="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <RefreshCw class="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p class="text-sm font-bold text-muted-foreground">Chưa có cấp độ nào được tạo</p>
                  </div>
                </td>
              </tr>
              <tr v-if="isLoading">
                 <td colspan="2" class="px-8 py-16 text-center">
                    <RefreshCw class="h-8 w-8 animate-spin mx-auto text-primary" />
                 </td>
              </tr>
              <tr v-for="(level, index) in levels" :key="level.id" 
                  class="group transition-colors hover:bg-primary/5"
                  :class="[index % 2 === 0 ? 'stagger-1' : 'stagger-2']">
                <td class="px-8 py-5">
                  <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ level.name }}</span>
                </td>
                <td class="px-8 py-5">
                  <div class="flex justify-end gap-3 opacity-70 lg:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:text-primary dark:bg-white/5" @click="openEditDialog(level)">
                      <Pencil class="h-4 w-4" />
                    </button>
                    <button class="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive shadow-sm transition-all hover:-translate-y-1 hover:bg-destructive/10" @click="deleteLevel(level)">
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
    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa cấp độ' : 'Thêm cấp độ'" description="Nhập tên khối lớp hoặc cấp học mới." size="md" @close="closeDialog">
      <div class="space-y-6 pt-4">
        <div class="space-y-3">
          <label class="text-xs font-black uppercase tracking-widest text-muted-foreground" for="level-name">Tên cấp độ</label>
          <input id="level-name" v-model="formState.name" type="text" class="app-input" placeholder="VD: Lớp 10, Lớp 11..." />
        </div>

        <div class="flex items-center justify-end gap-3 pt-4">
          <button class="app-btn-secondary !px-8" @click="closeDialog">Hủy</button>
          <button class="app-btn-primary !px-10" :disabled="isSaving" @click="saveLevel">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu cấp độ
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

