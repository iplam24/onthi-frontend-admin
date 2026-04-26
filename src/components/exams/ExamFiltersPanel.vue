<script setup>
import { computed } from 'vue'

const props = defineProps({
  subjectId: {
    type: [String, Number],
    default: ''
  },
  subjects: {
    type: Array,
    default: () => []
  },
  getSubjectName: {
    type: Function,
    default: () => '—'
  }
})

const emit = defineEmits(['update:subjectId', 'change'])

const selectedSubjectId = computed({
  get: () => props.subjectId,
  set: value => emit('update:subjectId', value)
})
</script>

<template>
  <section class="rounded-[1.75rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-foreground">Bộ lọc</h2>
        <p class="text-sm text-muted-foreground">Lọc theo môn học để xem các đề thi liên quan ngay lập tức.</p>
      </div>
    </div>

    <div class="grid gap-4 md:max-w-md">
      <div class="space-y-2">
        <label for="exam-subject-filter" class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Môn học</label>
        <select
          id="exam-subject-filter"
          v-model="selectedSubjectId"
          class="w-full rounded-full border border-input bg-background/90 px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          @change="emit('change')"
        >
          <option value="">Tất cả môn học</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ getSubjectName(subject.id, subject.name) }}
          </option>
        </select>
      </div>
    </div>
  </section>
</template>

