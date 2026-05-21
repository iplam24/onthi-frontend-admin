import apiClient from './apiClient'

function createCrudApi(basePath) {
  return {
    getAll(params = {}) {
      return apiClient.get(basePath, { params })
    },

    getById(id) {
      return apiClient.get(`${basePath}/${id}`)
    },

    create(data) {
      return apiClient.post(basePath, data)
    },

    update(id, data) {
      return apiClient.put(`${basePath}/${id}`, data)
    },

    delete(id) {
      return apiClient.delete(`${basePath}/${id}`)
    }
  }
}

export const filesAPI = {
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const subjectsAPI = createCrudApi('/learning/subjects')

export const levelsAPI = createCrudApi('/learning/levels')

export const topicsAPI = createCrudApi('/learning/topics')

export const examsAPI = {
  ...createCrudApi('/exams'),

  getBySubject(subjectId, params = {}) {
    return apiClient.get(`/exams/subjects/${subjectId}`, { params })
  },

  generateRandom(data) {
    return apiClient.post('/exams/random', data)
  },

  getExamHistory(params = {}) {
    return apiClient.get('/exams/me/history', { params })
  },

  checkRetake(examId) {
    return apiClient.get(`/exams/${examId}/retake-check`)
  },

  getAttemptPerformance(attemptId) {
    return apiClient.get(`/exams/attempts/${attemptId}/performance`)
  },
}

export const questionsAPI = {
  ...createCrudApi('/questions'),
  createBatch(data) {
    return apiClient.post('/questions/batch', data)
  },
  importExcel(file, imageFolderPath) {
    const formData = new FormData()
    formData.append('file', file)
    if (imageFolderPath) {
      formData.append('imageFolderPath', imageFolderPath)
    }
    return apiClient.post('/questions/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  importExcelPreview(file, imageFolderPath) {
    const formData = new FormData()
    formData.append('file', file)
    if (imageFolderPath) {
      formData.append('imageFolderPath', imageFolderPath)
    }
    return apiClient.post('/questions/import/preview', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const countdownsAPI = createCrudApi('/countdowns')

// Auth API
export const authAPI = {
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },

  register(credentials) {
    return apiClient.post('/auth/register', credentials)
  }
}

export const statisticsAPI = {
  getDashboardStats() {
    return apiClient.get('/statistics/dashboard')
  }
}

export const aiAPI = {
  generateQuestions(data) {
    return apiClient.post('/ai-content/generate-questions', data)
  }
}

export const adminUsersAPI = {
  getAll(params = {}) {
    return apiClient.get('/admin/users', { params })
  },
  updateStatus(id, enabled) {
    return apiClient.put(`/admin/users/${id}/status`, { enabled })
  },
  updateBalance(id, amount, type) {
    return apiClient.put(`/admin/users/${id}/balance`, { amount, type })
  },
  updateUser(id, data) {
    return apiClient.put(`/admin/users/${id}`, data)
  }
}

void authAPI.register
