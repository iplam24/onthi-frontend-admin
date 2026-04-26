<script setup>
import { computed } from 'vue'
import { Check, RefreshCw, Search } from 'lucide-vue-next'

const props = defineProps({
  subjectId: {
    type: [String, Number],
    default: ''
  },
  questionSearch: {
    type: String,
    default: ''
  },
  filteredQuestionPool: {
    type: Array,
    default: () => []
  },
  isQuestionPoolLoading: {
    type: Boolean,
    default: false
  },
  questionPoolError: {
    type: String,
    default: ''
  },
  isQuestionSelected: {
    type: Function,
    default: () => false
  },
  getQuestionSubjectLabel: {
    type: Function,
    default: () => '—'
  },
  getTopicLabel: {
    type: Function,
    default: () => '—'
  },
  getTypeLabel: {
    type: Function,
    default: () => '—'
  },
  getDifficultyLabel: {
    type: Function,
    default: () => '—'
  }
})

const emit = defineEmits(['update:questionSearch', 'reload', 'select-all', 'toggle-question'])

const searchValue = computed({
  get: () => props.questionSearch,
  set: value => emit('update:questionSearch', value)
})
</script>

<template>
  <div class="rounded-2xl border border-border bg-background/80">
    <div class="border-b border-border px-4 py-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-base font-semibold text-foreground">Danh sách câu hỏi</h3>
          <p class="text-xs text-muted-foreground">
            {{ subjectId ? 'Chọn câu hỏi theo môn đang chọn.' : 'Hãy chọn môn học trước để tải câu hỏi.' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!subjectId || isQuestionPoolLoading"
            @click="emit('reload')"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isQuestionPoolLoading }" />
            Tải lại
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!filteredQuestionPool.length"
            @click="emit('select-all')"
          >
            <Check class="h-4 w-4" />
            Chọn tất cả
          </button>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
        <Search class="h-4 w-4 text-muted-foreground" />
        <input
          v-model="searchValue"
          type="text"
          placeholder="Tìm theo nội dung, topic, độ khó..."
          class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>

    <div v-if="questionPoolError" class="border-b border-border bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {{ questionPoolError }}
    </div>

    <div class="max-h-[34rem] overflow-auto">
      <table class="min-w-full border-separate border-spacing-0">
        <thead>
          <tr class="sticky top-0 z-10 border-b border-border bg-background/95 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl">
            <th class="px-4 py-3 font-semibold">Chọn</th>
            <th class="px-4 py-3 font-semibold">Nội dung</th>
            <th class="px-4 py-3 font-semibold">Topic</th>
            <th class="px-4 py-3 font-semibold">Loại</th>
            <th class="px-4 py-3 font-semibold">Độ khó</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!subjectId">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">
              Chọn môn học để xem danh sách câu hỏi.
            </td>
          </tr>
          <tr v-else-if="isQuestionPoolLoading">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">
              Đang tải câu hỏi...
            </td>
          </tr>
          <tr v-else-if="!filteredQuestionPool.length">
            <td colspan="5" class="px-4 py-10 text-center text-sm text-muted-foreground">
              Không có câu hỏi phù hợp.
            </td>
          </tr>
          <tr
            v-for="question in filteredQuestionPool"
            :key="question.id"
            class="border-b border-border/60 last:border-b-0 hover:bg-muted/30"
          >
            <td class="px-4 py-4 align-top">
              <input
                type="checkbox"
                class="h-4 w-4"
                :checked="isQuestionSelected(question.id)"
                @change="emit('toggle-question', { question, checked: $event.target.checked })"
              />
            </td>
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <p class="line-clamp-3 font-medium">{{ question.content }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Môn: {{ getQuestionSubjectLabel(question) }}</p>
            </td>
            <td class="px-4 py-4 align-top text-sm text-foreground">{{ getTopicLabel(question) }}</td>
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <span class="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                {{ getTypeLabel(question.type) }}
              </span>
            </td>
            <td class="px-4 py-4 align-top text-sm text-foreground">
              <span class="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                {{ getDifficultyLabel(question.difficulty) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>


