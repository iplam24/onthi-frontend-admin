import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEYS = {
  LEVELS: 'learning_levels',
  TOPICS: 'learning_topics',
  SUBJECT_LEVELS: 'learning_subject_levels'
}

function safeParse(value, fallback) {
  if (!value) return fallback

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function createId() {
  if (!globalThis.__learningIdSeed) {
    globalThis.__learningIdSeed = Date.now()
  }

  globalThis.__learningIdSeed += 1
  return globalThis.__learningIdSeed
}

function loadArray(key) {
  if (typeof window === 'undefined') return []
  return safeParse(localStorage.getItem(key), [])
}

function sanitizeLevels(items) {
  return items.map(level => ({
    id: level.id,
    name: level.name
  }))
}

function loadObject(key) {
  if (typeof window === 'undefined') return {}
  return safeParse(localStorage.getItem(key), {})
}

export const useLearningStore = defineStore('learning', () => {
  const levels = ref(sanitizeLevels(loadArray(STORAGE_KEYS.LEVELS)))
  const topics = ref(loadArray(STORAGE_KEYS.TOPICS))
  const subjectLevelMap = ref(loadObject(STORAGE_KEYS.SUBJECT_LEVELS))

  const levelOptions = computed(() =>
    levels.value.map(level => ({
      value: level.id,
      label: level.name
    }))
  )

  function persistLevels() {
    localStorage.setItem(STORAGE_KEYS.LEVELS, JSON.stringify(sanitizeLevels(levels.value)))
  }

  function persistTopics() {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(topics.value))
  }

  function persistSubjectLevels() {
    localStorage.setItem(STORAGE_KEYS.SUBJECT_LEVELS, JSON.stringify(subjectLevelMap.value))
  }

  function addLevel(data) {
    const level = {
      id: createId(),
      name: data.name?.trim() || ''
    }

    levels.value = [level, ...levels.value]
    persistLevels()
    return level
  }

  function updateLevel(id, data) {
    levels.value = levels.value.map(level => (
      String(level.id) === String(id)
        ? { ...level, name: data.name?.trim() || level.name }
        : level
    ))
    persistLevels()
  }

  function deleteLevel(id) {
    levels.value = levels.value.filter(level => String(level.id) !== String(id))
    Object.keys(subjectLevelMap.value).forEach(subjectId => {
      if (String(subjectLevelMap.value[subjectId]) === String(id)) {
        delete subjectLevelMap.value[subjectId]
      }
    })
    persistLevels()
    persistSubjectLevels()
  }

  function setSubjectLevel(subjectId, levelId) {
    subjectLevelMap.value = {
      ...subjectLevelMap.value,
      [subjectId]: levelId
    }
    persistSubjectLevels()
  }

  function getSubjectLevelId(subjectId) {
    return subjectLevelMap.value[subjectId] || ''
  }

  function getSubjectLevelName(subjectId) {
    const levelId = getSubjectLevelId(subjectId)
    return levels.value.find(level => String(level.id) === String(levelId))?.name || '—'
  }

  function addTopic(data) {
    const topic = {
      id: createId(),
      name: data.name?.trim() || '',
      subjectId: data.subjectId || '',
      description: data.description?.trim() || ''
    }

    topics.value = [topic, ...topics.value]
    persistTopics()
    return topic
  }

  function updateTopic(id, data) {
    topics.value = topics.value.map(topic => (
      String(topic.id) === String(id)
        ? {
            ...topic,
            name: data.name?.trim() || topic.name,
            subjectId: data.subjectId || topic.subjectId,
            description: data.description?.trim() || ''
          }
        : topic
    ))
    persistTopics()
  }

  function deleteTopic(id) {
    topics.value = topics.value.filter(topic => String(topic.id) !== String(id))
    persistTopics()
  }

  function getTopicName(topicId) {
    return topics.value.find(topic => String(topic.id) === String(topicId))?.name || '—'
  }

  function getTopicsBySubject(subjectId) {
    return topics.value.filter(topic => String(topic.subjectId) === String(subjectId))
  }

  return {
    levels,
    topics,
    levelOptions,
    addLevel,
    updateLevel,
    deleteLevel,
    setSubjectLevel,
    getSubjectLevelId,
    getSubjectLevelName,
    addTopic,
    updateTopic,
    deleteTopic,
    getTopicName,
    getTopicsBySubject
  }
})


