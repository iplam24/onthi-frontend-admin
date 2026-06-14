<script setup>
import { useToastStore } from '@/stores/toastStore'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-vue-next'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in transform absolute"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-2 opacity-0 scale-95"
      move-class="transition duration-300 ease"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300"
        :class="{
          'bg-green-500/10 border-green-500/25 text-green-600 dark:text-green-400': toast.type === 'success',
          'bg-destructive/10 border-destructive/25 text-destructive': toast.type === 'error',
          'bg-primary/10 border-primary/25 text-primary': toast.type === 'info',
        }"
      >
        <div class="flex items-center gap-3">
          <CheckCircle2 v-if="toast.type === 'success'" class="h-5 w-5 shrink-0" />
          <AlertCircle v-else-if="toast.type === 'error'" class="h-5 w-5 shrink-0" />
          <Info v-else class="h-5 w-5 shrink-0" />
          
          <p class="text-sm font-bold leading-relaxed">{{ toast.message }}</p>
        </div>
        
        <button 
          @click="toastStore.remove(toast.id)"
          class="rounded-lg p-1 text-current opacity-60 hover:opacity-100 hover:bg-current/10 transition-all active:scale-90"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
