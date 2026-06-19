<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { systemSettingsAPI } from '@/services/api'
import { Settings, CreditCard, Bell, Shield, Info, Save, RefreshCw, AlertCircle, Database } from 'lucide-vue-next'

const settingsList = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const activeTab = ref('SYSTEM')

// Local form state
const form = reactive({})

const tabs = [
  { id: 'SYSTEM', name: 'Thông tin hệ thống', icon: Info },
  { id: 'DATABASE', name: 'Cơ sở dữ liệu', icon: Database },
  { id: 'PAYMENT', name: 'Thanh toán PayOS', icon: CreditCard },
  { id: 'NOTIFICATION', name: 'Thông báo Web Push', icon: Bell },
  { id: 'SECURITY', name: 'Bảo mật & Quy chế', icon: Shield }
]

async function fetchSettings() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await systemSettingsAPI.getSettings()
    const data = response.data?.data || response.data || []
    settingsList.value = data
    
    // Bind to form key-value
    data.forEach(item => {
      form[item.key] = item.value || ''
    })
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Không tải được cấu hình hệ thống'
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    // build key-value payload
    const payload = {}
    settingsList.value.forEach(item => {
      payload[item.key] = form[item.key]
    })
    
    await systemSettingsAPI.updateSettings(payload)
    successMessage.value = 'Lưu cấu hình hệ thống thành công!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    // Reload data to ensure synced state
    await fetchSettings()
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Không thể lưu cấu hình hệ thống'
  } finally {
    isSaving.value = false
  }
}

const filteredSettings = computed(() => {
  return settingsList.value.filter(s => s.category === activeTab.value)
})

onMounted(() => {
  fetchSettings()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between border-b pb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings class="h-6 w-6 text-primary" />
          Cấu hình Hệ thống
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Quản lý khóa tích hợp, cổng thanh toán PayOS, Web Push notifications và các chính sách hệ thống mà không cần restart dự án.
        </p>
      </div>
      <button 
        @click="fetchSettings" 
        class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted active:scale-95 transition-all"
        :disabled="isLoading || isSaving"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        Làm mới
      </button>
    </div>

    <!-- Alerts -->
    <div v-if="errorMessage" class="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
      <AlertCircle class="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <span class="text-sm font-medium text-destructive">{{ errorMessage }}</span>
    </div>

    <div v-if="successMessage" class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm font-medium text-emerald-600">
      {{ successMessage }}
    </div>

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 gap-3">
      <div class="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-muted-foreground">Đang tải cấu hình...</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <!-- Tabs Column -->
      <div class="lg:col-span-1 space-y-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left font-bold text-sm transition-all"
          :class="activeTab === tab.id 
            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20' 
            : 'border-border bg-card text-muted-foreground hover:bg-muted/30'"
        >
          <component :is="tab.icon" class="h-4 w-4" />
          {{ tab.name }}
        </button>
      </div>

      <!-- Settings Fields Column -->
      <div class="lg:col-span-3 space-y-6">
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div class="flex items-center gap-2 border-b pb-3">
            <component :is="tabs.find(t => t.id === activeTab).icon" class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-bold text-foreground">{{ tabs.find(t => t.id === activeTab).name }}</h2>
          </div>

          <div class="space-y-5">
            <div v-for="setting in filteredSettings" :key="setting.key" class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label :for="setting.key" class="text-sm font-bold text-foreground">{{ setting.description || setting.key }}</label>
                <span class="text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">{{ setting.key }}</span>
              </div>
              
              <!-- Conditional Input Types -->
              <input 
                v-if="setting.key.toLowerCase().includes('secret') || setting.key.toLowerCase().includes('key') || setting.key.toLowerCase().includes('token') || setting.key.toLowerCase().includes('uri')"
                :id="setting.key"
                type="password"
                v-model="form[setting.key]"
                placeholder="Chưa cấu hình"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea 
                v-else-if="setting.key === 'SYSTEM_DESCRIPTION'"
                :id="setting.key"
                v-model="form[setting.key]"
                rows="3"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input 
                v-else
                :id="setting.key"
                type="text"
                v-model="form[setting.key]"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="flex justify-end gap-3">
          <button 
            @click="handleSave"
            class="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-violet-600 border border-primary/20 text-white px-6 py-2.5 text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            :disabled="isSaving"
          >
            <Save class="h-4 w-4" />
            {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
