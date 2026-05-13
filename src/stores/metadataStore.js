import { defineStore } from 'pinia'
import { ref } from 'vue'
import { levelsAPI, subjectsAPI, topicsAPI } from '@/services/api'
import { normalizeCollection, normalizeLevel, normalizeSubject, normalizeTopic } from '@/utils/normalizers'

export const useMetadataStore = defineStore('metadata', () => {
  const levels = ref([])
  const subjects = ref([])
  const topics = ref([])
  const isInitialized = ref(false)
  const isLoading = ref(false)

  async function fetchAll() {
    if (isInitialized.value && !isLoading.value) return
    
    isLoading.value = true
    try {
      const [levelsRes, subjectsRes, topicsRes] = await Promise.all([
        levelsAPI.getAll(),
        subjectsAPI.getAll(),
        topicsAPI.getAll()
      ])

      levels.value = normalizeCollection(levelsRes.data).map(normalizeLevel)
      subjects.value = normalizeCollection(subjectsRes.data).map(normalizeSubject)
      topics.value = normalizeCollection(topicsRes.data).map(normalizeTopic)
      
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    } finally {
      isLoading.value = false
    }
  }

  function getTopicMeta(topicId) {
    return topics.value.find(t => String(t.id) === String(topicId)) || null
  }

  function getTopicName(topicId, fallback) {
    return getTopicMeta(topicId)?.name || fallback || '—'
  }

  return {
    levels,
    subjects,
    topics,
    isInitialized,
    isLoading,
    fetchAll,
    getTopicMeta,
    getTopicName
  }
})
