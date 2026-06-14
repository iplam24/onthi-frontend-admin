<script setup>
import { AlertTriangle, HelpCircle } from 'lucide-vue-next'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Xác nhận hành động'
  },
  message: {
    type: String,
    default: 'Bạn có chắc chắn muốn thực hiện hành động này?'
  },
  confirmText: {
    type: String,
    default: 'Xác nhận'
  },
  cancelText: {
    type: String,
    default: 'Hủy bỏ'
  },
  type: {
    type: String,
    default: 'danger' // danger, warning, info
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

function handleConfirm() {
  emit('confirm')
}

function handleClose() {
  if (!props.isLoading) {
    emit('close')
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="title"
    size="sm"
    @close="handleClose"
  >
    <div class="space-y-6 pt-2">
      <div class="flex items-start gap-4">
        <div 
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-sm"
          :class="{
            'bg-destructive/10 border-destructive/20 text-destructive': type === 'danger',
            'bg-amber-500/10 border-amber-500/20 text-amber-500': type === 'warning',
            'bg-primary/10 border-primary/20 text-primary': type === 'info'
          }"
        >
          <AlertTriangle v-if="type === 'danger' || type === 'warning'" class="h-6 w-6" />
          <HelpCircle v-else class="h-6 w-6" />
        </div>
        <div class="space-y-1.5 flex-1">
          <p class="text-sm font-medium text-foreground/90 leading-relaxed">{{ message }}</p>
          <p v-if="type === 'danger'" class="text-xs text-destructive/80 font-bold">
            Cảnh báo: Hành động này không thể hoàn tác!
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 pt-2">
        <button 
          :disabled="isLoading" 
          class="app-btn-secondary !px-6 !py-2.5 !rounded-xl text-xs" 
          @click="handleClose"
        >
          {{ cancelText }}
        </button>
        <button 
          :disabled="isLoading" 
          class="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-2.5 text-xs font-black text-white shadow-md transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          :class="{
            'bg-destructive shadow-destructive/20 hover:bg-destructive/90': type === 'danger',
            'bg-amber-500 shadow-amber-500/20 hover:bg-amber-500/90': type === 'warning',
            'bg-primary shadow-primary/20 hover:bg-primary/90': type === 'info'
          }"
          @click="handleConfirm"
        >
          <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
