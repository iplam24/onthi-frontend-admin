<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <label for="username" class="text-sm font-medium text-foreground">
        Tên đăng nhập
      </label>
      <input
        id="username"
        v-model="form.username"
        type="text"
        placeholder="Nhập tên đăng nhập"
        class="app-input"
        @keyup.enter="handleLogin"
      />
    </div>

    <div class="space-y-2">
      <label for="password" class="text-sm font-medium text-foreground">
        Mật khẩu
      </label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        placeholder="Nhập mật khẩu"
        class="app-input"
        @keyup.enter="handleLogin"
      />
    </div>

    <div v-if="authStore.error" class="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
      {{ authStore.error }}
    </div>

    <button
      @click="handleLogin"
      :disabled="authStore.isLoading || !form.username || !form.password"
      class="app-btn-primary w-full"
    >
      {{ authStore.isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
    </button>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  const success = await authStore.login(form.username, form.password)
  if (success) {
    router.push('/')
  }
}
</script>
