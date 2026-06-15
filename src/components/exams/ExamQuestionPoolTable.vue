<script setup>
import { computed, ref } from 'vue'
import { Check, RefreshCw, Search, Maximize, Minimize } from 'lucide-vue-next'

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

const isFullscreen = ref(false)
</script>

<template>
  <Teleport to="body" :disabled="!isFullscreen">
    <div
      class="group/panel border border-border/60 flex flex-col transition-all duration-500 ease-out"
      :class="
        isFullscreen
          ? 'fixed inset-0 z-[9999] rounded-none shadow-2xl overflow-hidden bg-background p-6'
          : 'rounded-2xl bg-background shadow-lg shadow-black/[0.03] dark:shadow-black/20'
      "
    >
      <!-- ═══════════════ HEADER ═══════════════ -->
      <div class="relative border-b border-border/50 px-5 py-4">
        <!-- Decorative gradient accent bar -->
        <div
          class="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 rounded-t-2xl"
        />

        <div class="flex items-center justify-between gap-4">
          <!-- Title area -->
          <div class="min-w-0">
            <div class="flex items-center gap-2.5">
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20"
              >
                <Search class="h-3.5 w-3.5 text-white" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-foreground tracking-tight">Ngân hàng câu hỏi</h3>
                <p class="text-[11px] text-muted-foreground truncate">
                  {{ subjectId ? 'Chọn câu hỏi theo môn đang chọn' : 'Hãy chọn môn học trước' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action buttons: icon badges -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-border hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
              :disabled="!subjectId || isQuestionPoolLoading"
              title="Tải lại"
              @click="emit('reload')"
            >
              <RefreshCw
                class="h-4 w-4 transition-transform duration-500"
                :class="{ 'animate-spin': isQuestionPoolLoading }"
              />
            </button>
            <button
              type="button"
              class="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm dark:hover:bg-indigo-950 dark:hover:text-indigo-400 dark:hover:border-indigo-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:bg-background disabled:hover:text-muted-foreground disabled:hover:border-border/70"
              :disabled="!filteredQuestionPool.length"
              title="Chọn tất cả"
              @click="emit('select-all')"
            >
              <Check class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:border-border hover:shadow-sm active:scale-95"
              :title="isFullscreen ? 'Thu nhỏ' : 'Phóng to'"
              @click="isFullscreen = !isFullscreen"
            >
              <Maximize class="h-4 w-4" v-if="!isFullscreen" />
              <Minimize class="h-4 w-4" v-else />
            </button>
          </div>
        </div>

        <!-- Search bar with glow effect -->
        <div class="mt-3.5">
          <div
            class="group/search flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 transition-all duration-300 focus-within:border-indigo-400/60 focus-within:bg-background focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] focus-within:ring-1 focus-within:ring-indigo-400/20 dark:focus-within:border-indigo-500/40 dark:focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          >
            <Search
              class="h-4 w-4 shrink-0 text-muted-foreground/60 transition-colors duration-200 group-focus-within/search:text-indigo-500"
            />
            <input
              v-model="searchValue"
              type="text"
              placeholder="Tìm theo nội dung, topic, độ khó..."
              class="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <span
              v-if="searchValue"
              class="shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400"
            >
              {{ filteredQuestionPool.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- ═══════════════ ERROR BANNER ═══════════════ -->
      <div
        v-if="questionPoolError"
        class="flex items-center gap-2.5 border-b border-red-200/50 bg-red-50/80 px-5 py-3 dark:border-red-900/30 dark:bg-red-950/30"
      >
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <span class="text-xs">⚠️</span>
        </div>
        <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ questionPoolError }}</p>
      </div>

      <!-- ═══════════════ TABLE ═══════════════ -->
      <div :class="isFullscreen ? 'flex-1 overflow-auto' : 'max-h-[34rem] overflow-auto'">
        <table class="min-w-full border-separate border-spacing-0">
          <thead>
            <tr
              class="sticky top-0 z-10 border-b border-border/50 bg-gradient-to-r from-slate-50/95 to-gray-50/95 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 backdrop-blur-xl dark:from-slate-900/95 dark:to-gray-900/95"
            >
              <th class="w-14 px-4 py-3 text-center font-bold">#</th>
              <th class="w-14 px-2 py-3 text-center font-bold">Chọn</th>
              <th class="px-4 py-3 font-bold">Nội dung</th>
              <th class="px-4 py-3 font-bold whitespace-nowrap">Topic</th>
              <th class="px-4 py-3 font-bold whitespace-nowrap">Loại</th>
              <th class="px-4 py-3 font-bold whitespace-nowrap">Độ khó</th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty: no subject -->
            <tr v-if="!subjectId">
              <td colspan="6" class="px-4 py-16">
                <div class="flex flex-col items-center justify-center gap-3 text-center">
                  <div
                    class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner dark:from-slate-800 dark:to-slate-900"
                  >
                    <span class="text-3xl opacity-60">📚</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-foreground/60">Chưa chọn môn học</p>
                    <p class="mt-0.5 text-xs text-muted-foreground/50">
                      Chọn môn học để xem danh sách câu hỏi.
                    </p>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Loading -->
            <tr v-else-if="isQuestionPoolLoading">
              <td colspan="6" class="px-4 py-16">
                <div class="flex flex-col items-center justify-center gap-3 text-center">
                  <div class="relative flex h-16 w-16 items-center justify-center">
                    <div
                      class="absolute inset-0 rounded-2xl border-2 border-indigo-200/40 dark:border-indigo-800/40"
                    />
                    <div
                      class="absolute inset-0 animate-spin rounded-2xl border-2 border-transparent border-t-indigo-500"
                      style="animation-duration: 1.2s"
                    />
                    <RefreshCw class="h-5 w-5 animate-spin text-indigo-400" />
                  </div>
                  <p class="text-sm font-medium text-muted-foreground">Đang tải câu hỏi...</p>
                </div>
              </td>
            </tr>

            <!-- Empty: no results -->
            <tr v-else-if="!filteredQuestionPool.length">
              <td colspan="6" class="px-4 py-16">
                <div class="flex flex-col items-center justify-center gap-3 text-center">
                  <div
                    class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 shadow-inner dark:from-amber-950/30 dark:to-orange-950/30"
                  >
                    <span class="text-3xl opacity-60">🔍</span>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-foreground/60">Không tìm thấy kết quả</p>
                    <p class="mt-0.5 text-xs text-muted-foreground/50">
                      Không có câu hỏi phù hợp với bộ lọc hiện tại.
                    </p>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Question rows -->
            <tr
              v-for="(question, qIndex) in filteredQuestionPool"
              :key="question.id"
              class="group/row border-b border-border/30 transition-colors duration-200 last:border-b-0"
              :class="[
                isQuestionSelected(question.id)
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                  : qIndex % 2 === 0
                    ? 'bg-transparent'
                    : 'bg-muted/20',
                'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/15'
              ]"
            >
              <!-- Row number -->
              <td class="px-4 py-3.5 align-top text-center">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold transition-colors duration-200"
                  :class="
                    isQuestionSelected(question.id)
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                      : 'bg-muted/60 text-muted-foreground/60 group-hover/row:bg-muted group-hover/row:text-muted-foreground'
                  "
                >
                  {{ qIndex + 1 }}
                </span>
              </td>

              <!-- Checkbox -->
              <td class="px-2 py-3.5 align-top text-center">
                <label
                  class="relative inline-flex h-5 w-5 cursor-pointer items-center justify-center"
                >
                  <input
                    type="checkbox"
                    class="peer sr-only"
                    :checked="isQuestionSelected(question.id)"
                    @change="emit('toggle-question', { question, checked: $event.target.checked })"
                  />
                  <div
                    class="h-[18px] w-[18px] rounded-md border-2 border-border/80 bg-background transition-all duration-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 peer-hover:border-indigo-300 dark:peer-checked:border-indigo-400 dark:peer-checked:bg-indigo-500"
                  />
                  <Check
                    class="absolute h-3 w-3 text-white opacity-0 transition-all duration-200 peer-checked:opacity-100 peer-checked:scale-100 scale-50"
                  />
                </label>
              </td>

              <!-- Content -->
              <td class="px-4 py-3.5 align-top text-sm text-foreground w-full max-w-0">
                <!-- Group question -->
                <div v-if="question.isGroup" class="space-y-2">
                  <div class="flex items-start gap-2">
                    <span
                      class="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/20"
                    >
                      <span>📋</span>
                      NHÓM · {{ question.questions?.length || 0 }} câu
                    </span>
                  </div>
                  <p class="line-clamp-3 font-medium leading-relaxed text-foreground/90">
                    {{ question.content.replace('[Nhóm câu hỏi] ', '') }}
                  </p>
                  <div
                    v-if="question.questions?.length"
                    class="mt-1 space-y-1 rounded-lg border-l-[3px] border-indigo-400/50 bg-indigo-50/30 py-2 pl-3.5 pr-2 dark:border-indigo-500/30 dark:bg-indigo-950/15"
                  >
                    <p
                      v-for="(child, idx) in question.questions"
                      :key="child.id"
                      class="flex items-baseline gap-1.5 text-xs text-muted-foreground truncate"
                    >
                      <span
                        class="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400"
                      >
                        {{ idx + 1 }}
                      </span>
                      <span class="truncate">{{ child.content }}</span>
                    </p>
                  </div>
                </div>

                <!-- Regular question -->
                <div v-else>
                  <p class="line-clamp-3 font-medium leading-relaxed text-foreground/90">
                    {{ question.content }}
                  </p>
                  <p class="mt-1.5 text-[11px] text-muted-foreground/60">
                    <span class="inline-flex items-center gap-1">
                      <span class="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      Môn: {{ getQuestionSubjectLabel(question) }}
                    </span>
                  </p>
                </div>
              </td>

              <!-- Topic -->
              <td class="px-4 py-3.5 align-top text-sm text-foreground/80 whitespace-nowrap">
                <span class="text-xs">{{ getTopicLabel(question) }}</span>
              </td>

              <!-- Type badge -->
              <td class="px-4 py-3.5 align-top whitespace-nowrap">
                <span
                  class="inline-flex items-center rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-700 ring-1 ring-inset ring-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-400/20"
                >
                  {{ getTypeLabel(question.type) }}
                </span>
              </td>

              <!-- Difficulty badge -->
              <td class="px-4 py-3.5 align-top whitespace-nowrap">
                <span
                  class="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20"
                >
                  {{ getDifficultyLabel(question.difficulty) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ═══════════════ FOOTER STATUS BAR ═══════════════ -->
      <div
        v-if="subjectId && !isQuestionPoolLoading && filteredQuestionPool.length"
        class="border-t border-border/40 bg-muted/20 px-5 py-2.5"
      >
        <p class="text-[11px] text-muted-foreground/60">
          Hiển thị
          <span class="font-semibold text-foreground/60">{{ filteredQuestionPool.length }}</span>
          câu hỏi
        </p>
      </div>
    </div>
  </Teleport>
</template>
