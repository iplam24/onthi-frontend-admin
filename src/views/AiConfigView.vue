<script setup>
import { onMounted, reactive, ref } from 'vue'
import { aiConfigAPI } from '@/services/api'
import { Cpu, Save, RefreshCw, AlertCircle } from 'lucide-vue-next'

const config = reactive({
  activeProvider: 'GITHUB_MODELS',
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  githubModelsApiKey: '',
  githubModelsModel: 'gpt-4o-mini',
  githubModelsEndpoint: 'https://models.github.ai/inference/chat/completions',
  customOpenaiApiKey: '',
  customOpenaiModel: 'gpt-4o',
  customOpenaiEndpoint: 'https://dev.vuxuanlam.me/v1'
})

const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function fetchConfig() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await aiConfigAPI.getConfig()
    const data = response.data?.data || response.data
    if (data) {
      config.activeProvider = data.activeProvider || 'GITHUB_MODELS'
      config.geminiApiKey = data.geminiApiKey || ''
      config.geminiModel = data.geminiModel || 'gemini-1.5-flash'
      config.githubModelsApiKey = data.githubModelsApiKey || ''
      config.githubModelsModel = data.githubModelsModel || 'gpt-4o-mini'
      config.githubModelsEndpoint = data.githubModelsEndpoint || 'https://models.github.ai/inference/chat/completions'
      config.customOpenaiApiKey = data.customOpenaiApiKey || ''
      config.customOpenaiModel = data.customOpenaiModel || 'gpt-4o'
      config.customOpenaiEndpoint = data.customOpenaiEndpoint || 'https://dev.vuxuanlam.me/v1'
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Không tải được cấu hình AI'
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await aiConfigAPI.updateConfig({
      activeProvider: config.activeProvider,
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel,
      githubModelsApiKey: config.githubModelsApiKey,
      githubModelsModel: config.githubModelsModel,
      githubModelsEndpoint: config.githubModelsEndpoint,
      customOpenaiApiKey: config.customOpenaiApiKey,
      customOpenaiModel: config.customOpenaiModel,
      customOpenaiEndpoint: config.customOpenaiEndpoint
    })
    successMessage.value = 'Lưu cấu hình AI thành công!'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Không thể lưu cấu hình'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between border-b pb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Cpu class="h-6 w-6 text-primary" />
          Cấu hình Hệ thống AI
        </h1>
        <p class="text-sm text-muted-foreground mt-1">
          Chuyển đổi nguồn cung cấp trí tuệ nhân tạo (Gemini / GitHub Models) và quản lý API Key động.
        </p>
      </div>
      <button 
        @click="fetchConfig" 
        class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted active:scale-95 transition-all"
        :disabled="isLoading || isSaving"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
        Làm mới
      </button>
    </div>

    <!-- Feedback Alerts -->
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

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Left side: Choose active provider -->
      <div class="lg:col-span-1 space-y-6">
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 class="text-lg font-bold text-foreground">Nguồn hoạt động</h2>
          <p class="text-xs text-muted-foreground">
            Lựa chọn nhà cung cấp AI sẽ được áp dụng cho toàn bộ các chức năng chat, chấm bài và tạo đề của hệ thống.
          </p>
          
          <div class="space-y-3 pt-2">
            <label 
              class="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-all"
              :class="{ 'border-primary bg-primary/5 ring-1 ring-primary/20': config.activeProvider === 'GEMINI' }"
            >
              <input 
                type="radio" 
                v-model="config.activeProvider" 
                value="GEMINI" 
                class="h-4 w-4 text-primary" 
              />
              <div>
                <p class="text-sm font-bold text-foreground">Google Gemini AI</p>
                <p class="text-xs text-muted-foreground">Dùng API chính thức của Google Gemini</p>
              </div>
            </label>

            <label 
              class="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-all"
              :class="{ 'border-primary bg-primary/5 ring-1 ring-primary/20': config.activeProvider === 'GITHUB_MODELS' }"
            >
              <input 
                type="radio" 
                v-model="config.activeProvider" 
                value="GITHUB_MODELS" 
                class="h-4 w-4 text-primary" 
              />
              <div>
                <p class="text-sm font-bold text-foreground">GitHub Models</p>
                <p class="text-xs text-muted-foreground">Dùng OpenAI API / GitHub Models</p>
              </div>
            </label>

            <label 
              class="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-all"
              :class="{ 'border-primary bg-primary/5 ring-1 ring-primary/20': config.activeProvider === 'CUSTOM_OPENAI' }"
            >
              <input 
                type="radio" 
                v-model="config.activeProvider" 
                value="CUSTOM_OPENAI" 
                class="h-4 w-4 text-primary" 
              />
              <div>
                <p class="text-sm font-bold text-foreground">Custom OpenAI / Router</p>
                <p class="text-xs text-muted-foreground">Sử dụng router proxy hoặc API bên thứ 3</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Right side: Config parameters for both -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Gemini Settings -->
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4" :class="{ 'opacity-60': config.activeProvider !== 'GEMINI' }">
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">G</div>
            <h2 class="text-lg font-bold text-foreground">Cấu hình Google Gemini AI</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2 space-y-1.5">
              <label for="gemini-key" class="text-sm font-medium text-foreground">Gemini API Key</label>
              <input 
                id="gemini-key" 
                type="password" 
                v-model="config.geminiApiKey" 
                placeholder="Nhập Google Gemini API Key"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div class="space-y-1.5">
              <label for="gemini-model" class="text-sm font-medium text-foreground">Model</label>
              <input 
                id="gemini-model" 
                type="text" 
                v-model="config.geminiModel" 
                placeholder="Ví dụ: gemini-1.5-flash"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- GitHub Models Settings -->
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4" :class="{ 'opacity-60': config.activeProvider !== 'GITHUB_MODELS' }">
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-md bg-violet-500/10 flex items-center justify-center text-violet-500 font-bold text-xs">GH</div>
            <h2 class="text-lg font-bold text-foreground">Cấu hình GitHub Models / OpenAI API</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2 space-y-1.5">
              <label for="gh-key" class="text-sm font-medium text-foreground">GitHub Token / API Key</label>
              <input 
                id="gh-key" 
                type="password" 
                v-model="config.githubModelsApiKey" 
                placeholder="Nhập GitHub Token hoặc OpenAI API Key"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div class="space-y-1.5">
              <label for="gh-model" class="text-sm font-medium text-foreground">Model Name</label>
              <input 
                id="gh-model" 
                type="text" 
                v-model="config.githubModelsModel" 
                placeholder="Ví dụ: gpt-4o-mini"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div class="space-y-1.5">
              <label for="gh-endpoint" class="text-sm font-medium text-foreground">Endpoint API</label>
              <input 
                id="gh-endpoint" 
                type="text" 
                v-model="config.githubModelsEndpoint" 
                placeholder="Đường dẫn REST API Endpoint"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- Custom OpenAI Settings -->
        <div class="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4" :class="{ 'opacity-60': config.activeProvider !== 'CUSTOM_OPENAI' }">
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">C</div>
            <h2 class="text-lg font-bold text-foreground">Cấu hình Custom OpenAI / Router</h2>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2 space-y-1.5">
              <label for="custom-openai-key" class="text-sm font-medium text-foreground">API Key</label>
              <input 
                id="custom-openai-key" 
                type="password" 
                v-model="config.customOpenaiApiKey" 
                placeholder="Nhập API Key cho Router của bạn"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div class="space-y-1.5">
              <label for="custom-openai-model" class="text-sm font-medium text-foreground">Model Name</label>
              <input 
                id="custom-openai-model" 
                type="text" 
                v-model="config.customOpenaiModel" 
                placeholder="Ví dụ: gpt-4o hoặc claude-3-5-sonnet"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div class="space-y-1.5">
              <label for="custom-openai-endpoint" class="text-sm font-medium text-foreground">Endpoint API</label>
              <input 
                id="custom-openai-endpoint" 
                type="text" 
                v-model="config.customOpenaiEndpoint" 
                placeholder="Ví dụ: https://dev.vuxuanlam.me/v1"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <!-- Submit actions -->
        <div class="flex justify-end gap-3">
          <button 
            @click="handleSave"
            class="inline-flex items-center gap-2 rounded-lg bg-primary hover:bg-violet-600 border border-primary/20 text-white px-5 py-2 text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
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
