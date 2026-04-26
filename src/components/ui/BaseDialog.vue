<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md'
  }
})

const emit = defineEmits(['close'])

const sizeClasses = computed(() => ({
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl'
}[props.size] || 'max-w-2xl'))

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl"
      @click="handleBackdropClick"
    >
      <div :class="['flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl', sizeClasses]">
        <div class="flex items-start justify-between gap-4 border-b border-border/70 bg-background/80 px-6 py-5">
          <div>
            <h3 class="text-lg font-semibold text-foreground">{{ title }}</h3>
            <p v-if="description" class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
          </div>
          <button class="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" @click="emit('close')">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

