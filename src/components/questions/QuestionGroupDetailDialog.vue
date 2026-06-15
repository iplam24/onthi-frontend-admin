<script setup>
import { computed } from 'vue'
import BaseDialog from '@/components/ui/BaseDialog.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

function getDifficultyLabel(diff) {
  const labels = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' }
  return labels[String(diff || '').toUpperCase()] || diff || '—'
}

function getTypeLabel(type) {
  return String(type || '').toUpperCase() === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'
}

function getCorrectAnswers(options) {
  if (!options || !options.length) return '—'
  const corrects = options.filter(o => o.isCorrect).map(o => o.content)
  return corrects.length ? corrects.join(', ') : 'Chưa chọn đáp án đúng'
}
</script>

<template>
  <BaseDialog :open="isOpen" title="Chi tiết nhóm câu hỏi" size="xl" @close="emit('close')">
    <div v-if="group" class="max-h-[75vh] space-y-6 overflow-y-auto pr-2 pb-4 text-foreground">
      
      <!-- Group Details -->
      <div class="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div>
          <h2 class="text-lg font-black text-primary">{{ group.title || 'Không có tiêu đề' }}</h2>
          <div class="mt-2 text-sm font-medium text-muted-foreground flex items-center gap-3">
            <span class="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1">Chủ đề: {{ group.topicName || '—' }}</span>
          </div>
        </div>

        <div class="rounded-lg bg-muted/30 p-4 border border-border/50">
          <h3 class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Nội dung đoạn văn</h3>
          <div class="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90" v-html="group.explanation || group.content"></div>
        </div>
      </div>

      <!-- Child Questions -->
      <div class="space-y-4">
        <h3 class="text-base font-bold text-foreground flex items-center gap-2">
          Các câu hỏi con 
          <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">{{ group.questions?.length || 0 }}</span>
        </h3>
        
        <div v-if="!group.questions || group.questions.length === 0" class="text-sm text-muted-foreground italic">
          Nhóm này chưa có câu hỏi con.
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div v-for="(q, index) in group.questions" :key="q.id || index" class="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-col">
            <div class="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
              <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {{ index + 1 }}
              </span>
              <div class="flex gap-2">
                <span class="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {{ getTypeLabel(q.type) }}
                </span>
                <span class="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  :class="{
                    'text-green-600 border-green-200': q.difficulty === 'EASY',
                    'text-amber-600 border-amber-200': q.difficulty === 'MEDIUM',
                    'text-red-600 border-red-200': q.difficulty === 'HARD'
                  }">
                  {{ getDifficultyLabel(q.difficulty) }}
                </span>
              </div>
            </div>
            
            <div class="flex-1 space-y-3">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nội dung:</span>
                <p class="mt-1 text-sm font-medium text-foreground" v-html="q.content"></p>
              </div>
              
              <div v-if="String(q.type || '').toUpperCase() !== 'ESSAY'" class="rounded-lg bg-muted/20 p-3 border border-border/40">
                <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Đáp án đúng:</span>
                <p class="mt-1 text-sm font-semibold text-green-600">{{ getCorrectAnswers(q.options) }}</p>
                
                <div class="mt-3 space-y-1.5">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tất cả đáp án:</span>
                  <ul class="text-xs space-y-1">
                    <li v-for="(opt, i) in q.options" :key="i" class="flex items-start gap-2">
                      <span class="font-medium" :class="opt.isCorrect ? 'text-green-600' : 'text-muted-foreground'">
                        • {{ opt.content }}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    
    <div class="flex items-center justify-end border-t border-border pt-4">
      <button class="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors" @click="emit('close')">
        Đóng
      </button>
    </div>
  </BaseDialog>
</template>
