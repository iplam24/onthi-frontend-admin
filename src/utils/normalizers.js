export function normalizeCollection(payload) {
  const raw = payload?.data ?? payload
  const collection = raw?.data ?? raw

  if (Array.isArray(collection)) return collection
  if (Array.isArray(collection?.items)) return collection.items
  if (Array.isArray(collection?.content)) return collection.content
  if (Array.isArray(collection?.results)) return collection.results

  return []
}

export function normalizeLevel(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? ''
  }
}

export function normalizeSubject(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? '',
    imageUrl: item?.imageUrl ?? null,
    levelId: item?.levelId ?? '',
    levelName: item?.levelName ?? ''
  }
}

export function normalizeTopic(item) {
  return {
    id: item?.id ?? item?._id,
    name: item?.name ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    levelId: item?.levelId ?? '',
    levelName: item?.levelName ?? ''
  }
}

export function normalizeQuestion(item) {
  return {
    id: item?.id ?? item?._id,
    content: item?.content ?? '',
    contentFormat: item?.contentFormat ?? 'PLAIN_TEXT',
    questionContent: item?.questionContent ?? item?.content ?? '',
    url: item?.url ?? '',
    topicId: item?.topicId ?? '',
    topicName: item?.topicName ?? '',
    type: item?.type ?? item?.questionType ?? '',
    difficulty: item?.difficulty ?? '',
    options: Array.isArray(item?.options) ? item.options : [],
    sampleAnswer: item?.sampleAnswer ?? '',
    explanation: item?.explanation ?? '',
    createdByUsername: item?.createdByUsername ?? '',
    createdAt: item?.createdAt ?? '',
    updatedAt: item?.updatedAt ?? ''
  }
}

export function normalizeExamQuestion(item, index = 0) {
  const questionContent = item?.questionContent ?? item?.content ?? item?.contentSnapshot ?? ''

  return {
    questionId: item?.questionId ?? item?.id ?? null,
    questionContent,
    content: item?.content ?? questionContent,
    contentSnapshot: item?.contentSnapshot ?? questionContent,
    topicId: item?.topicId ?? '',
    topicName: item?.topicName ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    type: item?.type ?? '',
    difficulty: item?.difficulty ?? '',
    orderIndex: Number(item?.orderIndex ?? index + 1) || index + 1,
    score: Number(item?.score ?? 1) || 1
  }
}

export function normalizeExam(item) {
  const questionsData = Array.isArray(item?.questions) ? item.questions : []

  return {
    id: item?.id ?? item?._id,
    title: item?.title ?? '',
    subjectId: item?.subjectId ?? '',
    subjectName: item?.subjectName ?? '',
    createdByUsername: item?.createdByUsername ?? '',
    duration: Number(item?.duration ?? 0) || 0,
    isActive: !!item?.isActive,
    startTime: item?.startTime ?? '',
    endTime: item?.endTime ?? '',
    totalScore: Number(item?.totalScore ?? 0) || 0,
    type: item?.type ?? 'MULTIPLE_CHOICE',
    shuffleQuestions: !!item?.shuffleQuestions,
    shuffleAnswers: !!item?.shuffleAnswers,
    maxAttempts: Number(item?.maxAttempts ?? 1) || 1,
    createdAt: item?.createdAt ?? '',
    updatedAt: item?.updatedAt ?? '',
    questions: questionsData.map((question, index) => normalizeExamQuestion(question, index))
  }
}