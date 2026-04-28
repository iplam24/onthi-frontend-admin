import apiClient from './apiClient'

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

export const subjectsAPI = {
  getAll() {
    return apiClient.get('/learning/subjects')
  },

  getById(id) {
    return apiClient.get(`/learning/subjects/${id}`)
  },

  create(data) {
    return apiClient.post('/learning/subjects', data)
  },

  update(id, data) {
    return apiClient.put(`/learning/subjects/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/learning/subjects/${id}`)
  }
}

export const levelsAPI = {
  getAll() {
    return apiClient.get('/learning/levels')
  },

  getById(id) {
    return apiClient.get(`/learning/levels/${id}`)
  },

  create(data) {
    return apiClient.post('/learning/levels', data)
  },

  update(id, data) {
    return apiClient.put(`/learning/levels/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/learning/levels/${id}`)
  }
}

export const topicsAPI = {
  getAll() {
    return apiClient.get('/learning/topics')
  },

  getById(id) {
    return apiClient.get(`/learning/topics/${id}`)
  },

  create(data) {
    return apiClient.post('/learning/topics', data)
  },

  update(id, data) {
    return apiClient.put(`/learning/topics/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/learning/topics/${id}`)
  }
}

export const examsAPI = {
  getAll(params = {}) {
    return apiClient.get('/exams', { params })
  },

  getBySubject(subjectId, params = {}) {
    return apiClient.get(`/exams/subjects/${subjectId}`, { params })
  },

  getById(id) {
    return apiClient.get(`/exams/${id}`)
  },

  create(data) {
    return apiClient.post('/exams', data)
  },

  update(id, data) {
    return apiClient.put(`/exams/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/exams/${id}`)
  }
}

export const questionsAPI = {
  getAll(params = {}) {
    return apiClient.get('/questions', { params })
  },

  getById(id) {
    return apiClient.get(`/questions/${id}`)
  },

  create(data) {
    return apiClient.post('/questions', data)
  },

  update(id, data) {
    return apiClient.put(`/questions/${id}`, data)
  },

  delete(id) {
    return apiClient.delete(`/questions/${id}`)
  }
}

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

void authAPI.register
