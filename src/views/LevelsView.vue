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
  <div class="space-y-6">
    <section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">Học liệu</p>
          <h1 class="mt-2 text-3xl font-bold text-foreground">Quản lý Cấp độ</h1>
          <p class="mt-2 text-muted-foreground">Dữ liệu đồng bộ từ API thật `/api/learning/levels`.</p>
        </div>

        <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" @click="openCreateDialog">
          <Plus class="h-4 w-4" />
          Thêm cấp độ
        </button>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <p class="text-sm text-muted-foreground">Tổng cấp độ</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ totalLevels }}</p>
        </div>
      </div>
    </section>

    <div v-if="errorMessage" class="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      {{ errorMessage }}
    </div>

    <div class="rounded-2xl border border-border bg-card shadow-sm">
      <div class="border-b border-border px-6 py-4">
        <h2 class="text-xl font-semibold text-foreground">Danh sách cấp độ</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-left text-sm uppercase tracking-wide text-muted-foreground">
              <th class="px-6 py-3 font-semibold">Tên cấp độ</th>
              <th class="px-6 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!levels.length">
              <td colspan="2" class="px-6 py-10 text-center text-sm text-muted-foreground">
                Chưa có cấp độ nào.
              </td>
            </tr>
            <tr v-for="level in levels" :key="level.id" class="border-b border-border last:border-b-0 hover:bg-muted/30">
              <td class="px-6 py-4 text-sm text-foreground">{{ level.name }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button class="inline-flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted" @click="openEditDialog(level)">
                    <Pencil class="h-4 w-4" />
                    Sửa
                  </button>
                  <button class="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10" @click="deleteLevel(level)">
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

    <BaseDialog :open="isDialogOpen" :title="isEditing ? 'Sửa cấp độ' : 'Thêm cấp độ'" description="Cấp độ chỉ gồm tên, theo đúng document." size="md" @close="closeDialog">
      <div class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground" for="level-name">Tên cấp độ</label>
          <input id="level-name" v-model="formState.name" type="text" class="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground" placeholder="VD: Lớp 10" />
        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

        <div class="flex items-center justify-end gap-3">
          <button class="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted" @click="closeDialog">Hủy</button>
          <button class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" :disabled="isSaving" @click="saveLevel">
            <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
            Lưu
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

