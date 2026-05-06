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
}

export const questionsAPI = createCrudApi('/questions')

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

void authAPI.register
