<script setup>
import { computed } from 'vue'

const props = defineProps({
  subjectId: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'ALL'
  },
  active: {
    type: String,
    default: 'ALL'
  },
  query: {
    type: String,
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

const emit = defineEmits([
  'update:subjectId',
  'update:type',
  'update:active',
  'update:query',
  'change'
])

const selectedSubjectId = computed({
  get: () => props.subjectId,
  set: value => {
    emit('update:subjectId', value)
    emit('change')
  }
})

const selectedType = computed({
  get: () => props.type,
  set: value => emit('update:type', value)
})

const selectedActive = computed({
  get: () => props.active,
  set: value => emit('update:active', value)
})

const searchQuery = computed({
  get: () => props.query,
  set: value => emit('update:query', value)
})
</script>

<template>
  <section class="app-surface p-6 shadow-xl relative overflow-hidden">
    <div class="mb-6">
      <h2 class="text-base font-bold text-foreground">Bộ lọc tìm kiếm đề thi</h2>
      <p class="text-xs text-muted-foreground">Kết hợp bộ lọc môn học từ máy chủ và các tùy chọn lọc nhanh ở máy khách.</p>
    </div>

    <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Môn học (Server) -->
      <div class="space-y-2">
        <label for="exam-subject-filter" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Môn học (Server)</label>
        <select
          id="exam-subject-filter"
          v-model="selectedSubjectId"
          class="app-select !py-2.5 shadow-sm"
        >
          <option value="">Tất cả môn học</option>
          <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
            {{ getSubjectName(subject.id, subject.name) }}
          </option>
        </select>
      </div>

      <!-- Loại đề thi (Client) -->
      <div class="space-y-2">
        <label for="exam-type-filter" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Loại đề thi (Client)</label>
        <select
          id="exam-type-filter"
          v-model="selectedType"
          class="app-select !py-2.5 shadow-sm"
        >
          <option value="ALL">Tất cả loại đề</option>
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="MIXED">Hỗn hợp</option>
        </select>
      </div>

      <!-- Trạng thái (Client) -->
      <div class="space-y-2">
        <label for="exam-active-filter" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Trạng thái (Client)</label>
        <select
          id="exam-active-filter"
          v-model="selectedActive"
          class="app-select !py-2.5 shadow-sm"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động (Đang bật)</option>
          <option value="INACTIVE">Tạm tắt</option>
        </select>
      </div>

      <!-- Tìm nhanh tiêu đề (Client) -->
      <div class="space-y-2">
        <label for="exam-query-filter" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Lọc tiêu đề (Client)</label>
        <div class="relative group/search-client">
          <input
            id="exam-query-filter"
            v-model="searchQuery"
            type="text"
            placeholder="Lọc nhanh tiêu đề..."
            class="app-input !py-2.5 !pl-9 shadow-sm"
          >
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
