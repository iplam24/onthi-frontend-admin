<script setup>
import { ref } from 'vue'
import { X, ArrowUp, ArrowDown, Plus, Trash2, Maximize, Minimize } from 'lucide-vue-next'

const isFullscreen = ref(false)

const props = defineProps({
  formState: {
    type: Object,
    required: true
  },
  getTopicLabel: {
    type: Function,
    default: () => '—'
  },
  getQuestionSubjectLabel: {
    type: Function,
    default: () => '—'
  }
})

const emit = defineEmits(['clear-all', 'remove-question'])

function addSection() {
  props.formState.sections.push({
    sectionName: `Phần ${props.formState.sections.length + 1}`,
    items: []
  })
}

function removeSection(index) {
  if (confirm('Bạn có chắc chắn muốn xóa phần này và tất cả câu hỏi bên trong?')) {
    props.formState.sections.splice(index, 1)
  }
}

function moveSectionUp(index) {
  if (index > 0) {
    const temp = props.formState.sections[index]
    props.formState.sections[index] = props.formState.sections[index - 1]
    props.formState.sections[index - 1] = temp
  }
}

function moveSectionDown(index) {
  if (index < props.formState.sections.length - 1) {
    const temp = props.formState.sections[index]
    props.formState.sections[index] = props.formState.sections[index + 1]
    props.formState.sections[index + 1] = temp
  }
}

function moveItemUp(sectionIndex, itemIndex) {
  if (itemIndex > 0) {
    const section = props.formState.sections[sectionIndex]
    const temp = section.items[itemIndex]
    section.items[itemIndex] = section.items[itemIndex - 1]
    section.items[itemIndex - 1] = temp
  }
}

function moveItemDown(sectionIndex, itemIndex) {
  const section = props.formState.sections[sectionIndex]
  if (itemIndex < section.items.length - 1) {
    const temp = section.items[itemIndex]
    section.items[itemIndex] = section.items[itemIndex + 1]
    section.items[itemIndex + 1] = temp
  }
}

function moveToSection(sectionIndex, itemIndex, targetSectionIndex) {
  if (sectionIndex !== targetSectionIndex) {
    const item = props.formState.sections[sectionIndex].items.splice(itemIndex, 1)[0]
    props.formState.sections[targetSectionIndex].items.push(item)
  }
}

function getSectionTotal(section) {
  if (!section.items) return 0;
  return section.items.reduce((acc, item) => {
    if (item.isGroup && item.childQuestions) {
      return acc + item.childQuestions.length;
    }
    return acc + 1;
  }, 0);
}

const totalQuestions = () => props.formState.sections.reduce((acc, s) => acc + getSectionTotal(s), 0)
</script>

<template>
  <Teleport to="body" :disabled="!isFullscreen">
  <div
    class="border border-border/50 flex flex-col transition-all duration-300"
    :class="isFullscreen
      ? 'fixed inset-0 z-[9999] rounded-none shadow-2xl overflow-hidden bg-background p-6'
      : 'rounded-2xl bg-background h-full max-h-[800px] shadow-sm'"
  >
    <!-- ═══════════════ HEADER TOOLBAR ═══════════════ -->
    <div class="shrink-0 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
      <div class="px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <!-- Title area -->
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40"></div>
            <div>
              <h3 class="text-base font-bold text-foreground tracking-tight">Cấu trúc đề thi</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Chia phần và quản lý câu hỏi trong đề · <span class="font-semibold text-foreground/70">{{ totalQuestions() }}</span> câu hỏi</p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors duration-150 shrink-0"
            @click="addSection"
          >
            <Plus class="h-4 w-4" />
            Thêm phần
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
            :disabled="totalQuestions() === 0"
            @click="emit('clear-all')"
          >
            <Trash2 class="h-3.5 w-3.5" />
            Bỏ chọn tất cả
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150 shrink-0"
            @click="isFullscreen = !isFullscreen"
          >
            <Maximize class="h-4 w-4" v-if="!isFullscreen" />
            <Minimize class="h-4 w-4" v-else />
            {{ isFullscreen ? 'Thu nhỏ' : 'Phóng to' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════ CONTENT AREA ═══════════════ -->
    <div class="overflow-y-auto flex-grow p-5 space-y-5">

      <!-- Empty state: no sections -->
      <div
        v-if="props.formState.sections.length === 0"
        class="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/60 rounded-xl bg-muted/10"
      >
        <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus class="h-6 w-6 text-primary/60" />
        </div>
        <p class="text-sm font-medium text-muted-foreground mb-1">Chưa có phần nào</p>
        <p class="text-xs text-muted-foreground/70">Hãy nhấn "Thêm phần" để bắt đầu xây dựng cấu trúc đề thi.</p>
      </div>

      <!-- ═══════════════ SECTIONS ═══════════════ -->
      <div
        v-for="(section, sectionIndex) in props.formState.sections"
        :key="sectionIndex"
        class="rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <!-- Section header -->
        <div class="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/40">
          <div class="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3 w-full sm:w-2/3 min-w-0">
              <!-- Section number badge -->
              <span class="flex items-center justify-center h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm shrink-0">
                {{ sectionIndex + 1 }}
              </span>
              <input
                v-model="section.sectionName"
                type="text"
                class="w-full bg-background/80 backdrop-blur-sm border border-input/50 rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all min-w-[150px] placeholder:text-muted-foreground/50"
                placeholder="Tên phần (VD: Phần 1. Trắc nghiệm)"
              />
              <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                {{ getSectionTotal(section) }} câu
              </span>
            </div>
            <!-- Section controls -->
            <div class="flex items-center gap-0.5 shrink-0">
              <button
                @click="moveSectionUp(sectionIndex)"
                :disabled="sectionIndex === 0"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Di chuyển lên"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                @click="moveSectionDown(sectionIndex)"
                :disabled="sectionIndex === props.formState.sections.length - 1"
                class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Di chuyển xuống"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <div class="w-px h-5 bg-border/60 mx-1"></div>
              <button
                @click="removeSection(sectionIndex)"
                class="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Xóa phần"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Section table -->
        <table class="min-w-full border-separate border-spacing-0">
          <thead>
            <tr class="bg-muted/30">
              <th class="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 w-20">STT</th>
              <th class="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70">Câu hỏi</th>
              <th class="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 w-24">Điểm</th>
              <th class="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 w-36">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty section state -->
            <tr v-if="section.items.length === 0">
              <td colspan="4" class="px-4 py-8">
                <div class="flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-lg py-6 bg-muted/5">
                  <p class="text-sm text-muted-foreground/60 font-medium">Chưa có câu hỏi trong phần này</p>
                  <p class="text-xs text-muted-foreground/40 mt-1">Chọn câu hỏi từ ngân hàng bên trái để thêm vào.</p>
                </div>
              </td>
            </tr>

            <!-- Question rows -->
            <tr
              v-for="(item, itemIndex) in section.items"
              :key="item.questionId || item.groupId || itemIndex"
              class="border-t border-border/30 bg-background hover:bg-muted/20 transition-colors duration-100 group"
            >
              <!-- Order column with circle badge -->
              <td class="px-4 py-3.5 align-top w-20">
                <div class="flex items-center gap-1">
                  <div class="flex flex-col gap-0.5">
                    <button
                      @click="moveItemUp(sectionIndex, itemIndex)"
                      :disabled="itemIndex === 0"
                      class="p-0.5 rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                    >
                      <ArrowUp class="w-3.5 h-3.5" />
                    </button>
                    <button
                      @click="moveItemDown(sectionIndex, itemIndex)"
                      :disabled="itemIndex === section.items.length - 1"
                      class="p-0.5 rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                    >
                      <ArrowDown class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span class="flex items-center justify-center h-6 w-6 rounded-full bg-muted/60 text-[11px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {{ itemIndex + 1 }}
                  </span>
                </div>
              </td>

              <!-- Question content -->
              <td class="px-4 py-3.5 align-top text-sm text-foreground w-full max-w-0">
                <div class="space-y-1.5">
                  <!-- Group badge -->
                  <span
                    v-if="item.isGroup"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 ring-1 ring-indigo-200/50 dark:ring-indigo-700/50"
                  >
                    Nhóm câu hỏi · {{ item.childQuestions?.length || 0 }} câu
                  </span>

                  <!-- Question text -->
                  <p class="font-medium leading-relaxed text-foreground/90 line-clamp-2">
                    {{ item.questionContent || item.content || item.contentSnapshot || '—' }}
                  </p>

                  <!-- Meta info -->
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <span class="inline-block h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                    <span>{{ getTopicLabel(item) }}</span>
                    <span class="inline-block h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                    <span>{{ getQuestionSubjectLabel(item) }}</span>
                  </div>

                  <!-- Child questions (group) -->
                  <div
                    v-if="item.isGroup && item.childQuestions?.length"
                    class="mt-2.5 space-y-1.5 pl-3.5 border-l-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-r-lg py-2 pr-2"
                  >
                    <p
                      v-for="(child, idx) in item.childQuestions"
                      :key="child.id"
                      class="text-xs text-muted-foreground truncate leading-relaxed"
                    >
                      <span class="inline-flex items-center justify-center h-4 w-4 rounded bg-indigo-100 dark:bg-indigo-900/60 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                        {{ idx + 1 }}
                      </span>
                      {{ child.content }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Score input -->
              <td class="px-4 py-3.5 align-top w-24">
                <div class="relative">
                  <input
                    v-model.number="item.score"
                    type="number"
                    min="0"
                    step="0.1"
                    class="w-full rounded-lg border border-input/50 bg-muted/20 px-2.5 py-1.5 text-sm font-semibold text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-background transition-all placeholder:text-muted-foreground/40"
                    placeholder="0"
                  />
                </div>
              </td>

              <!-- Actions column -->
              <td class="px-4 py-3.5 align-top w-36">
                <div class="space-y-1.5">
                  <!-- Move to section -->
                  <select
                    v-if="props.formState.sections.length > 1"
                    class="w-full text-xs rounded-lg border border-input/50 px-2 py-1.5 bg-muted/10 text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:outline-none transition-all cursor-pointer hover:bg-muted/30"
                    @change="moveToSection(sectionIndex, itemIndex, $event.target.value); $event.target.value=''"
                  >
                    <option value="" disabled selected>Chuyển tới...</option>
                    <option v-for="(s, sIdx) in props.formState.sections" :key="sIdx" :value="sIdx" :disabled="sIdx === sectionIndex">
                      Phần {{ sIdx + 1 }}
                    </option>
                  </select>
                  <!-- Remove button -->
                  <button
                    type="button"
                    class="w-full inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-destructive/70 hover:text-destructive bg-transparent hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all duration-150"
                    @click="emit('remove-question', item.isGroup ? item.groupId : item.questionId, item.isGroup)"
                  >
                    <X class="h-3 w-3" />
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </Teleport>
</template>
