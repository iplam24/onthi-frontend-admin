<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { normalizeCollection, normalizeUser } from '@/utils/normalizers'
import { adminUsersAPI, filesAPI } from '@/services/api'
import { useMetadataStore } from '@/stores/metadataStore'
import { 
  Search, 
  UserCog, 
  Ban, 
  CheckCircle2, 
  Wallet, 
  Edit3,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  Mail,
  School,
  GraduationCap,
  AlertCircle,
  Loader2,
  Camera,
  Trash2
} from 'lucide-vue-next'
import { API_CONFIG } from '@/constants'

const metadataStore = useMetadataStore()
const users = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const query = ref('')

// Client-side advanced filters
const filterRole = ref('ALL')
const filterStatus = ref('ALL')
const filterBalance = ref('ALL')

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // Role filter
    if (filterRole.value !== 'ALL' && user.roleName !== filterRole.value) {
      return false
    }
    // Status filter
    if (filterStatus.value !== 'ALL') {
      const isEnabled = !!user.enabled
      if (filterStatus.value === 'ENABLED' && !isEnabled) return false
      if (filterStatus.value === 'DISABLED' && isEnabled) return false
    }
    // Balance filter
    if (filterBalance.value !== 'ALL') {
      const balance = user.balance || 0
      if (filterBalance.value === 'HAS_BALANCE' && balance <= 0) return false
      if (filterBalance.value === 'ZERO_BALANCE' && balance > 0) return false
    }
    return true
  })
})

// Avatar upload state
const avatarInputRef = ref(null)
const pendingAvatarFile = ref(null)
const avatarPreviewUrl = ref('')

const pagination = reactive({
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
})

// Dialog states
const isEditModalOpen = ref(false)
const isBalanceModalOpen = ref(false)
const selectedUser = ref(null)

const editForm = reactive({
  fullName: '',
  schoolName: '',
  levelId: null,
  dob: '',
  avatar: ''
})

const balanceForm = reactive({
  amount: 0,
  type: 'ADD'
})

// loadMetadata removed, using metadataStore

async function loadUsers() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      query: query.value
    }
    const response = await adminUsersAPI.getAll(params)
    const pageData = response.data?.data || response.data
    
    users.value = normalizeCollection(pageData).map(normalizeUser)
    pagination.totalElements = pageData.totalElements || users.value.length
    pagination.totalPages = pageData.totalPages || 1
    pagination.first = pageData.first ?? true
    pagination.last = pageData.last ?? true
  } catch (error) {
    errorMessage.value = 'Không thể tải danh sách người dùng'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function toggleUserStatus(user) {
  const newStatus = !user.enabled
  const action = newStatus ? 'mở khóa' : 'khóa'
  if (!confirm(`Bạn có chắc muốn ${action} tài khoản ${user.username}?`)) return

  try {
    await adminUsersAPI.updateStatus(user.id, newStatus)
    user.enabled = newStatus
    showSuccess(`${newStatus ? 'Mở khóa' : 'Khóa'} tài khoản thành công`)
  } catch (error) {
    errorMessage.value = 'Thao tác thất bại'
  }
}

function openEditModal(user) {
  selectedUser.value = user
  editForm.fullName = user.fullName || ''
  editForm.schoolName = user.schoolName || ''
  editForm.levelId = user.levelId
  editForm.dob = user.dob || ''
  editForm.avatar = user.avatar || ''
  
  pendingAvatarFile.value = null
  avatarPreviewUrl.value = resolveAvatar(user.avatar)
  
  isEditModalOpen.value = true
}

function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  pendingAvatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

function removeAvatar() {
  pendingAvatarFile.value = null
  editForm.avatar = ''
  avatarPreviewUrl.value = null
  if (avatarInputRef.value) avatarInputRef.value.value = ''
}

async function handleUpdateUser() {
  isSaving.value = true
  errorMessage.value = ''
  try {
    // 1. Upload avatar if pending
    if (pendingAvatarFile.value) {
      const uploadRes = await filesAPI.upload(pendingAvatarFile.value)
      editForm.avatar = uploadRes.data?.data?.url || uploadRes.data?.url
    }

    // 2. Update user info
    await adminUsersAPI.updateUser(selectedUser.value.id, { ...editForm })
    showSuccess('Cập nhật thông tin thành công')
    isEditModalOpen.value = false
    loadUsers()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Cập nhật thất bại'
  } finally {
    isSaving.value = false
  }
}

function openBalanceModal(user) {
  selectedUser.value = user
  balanceForm.amount = 0
  balanceForm.type = 'ADD'
  isBalanceModalOpen.value = true
}

async function handleUpdateBalance() {
  if (balanceForm.amount <= 0) return alert('Số tiền phải lớn hơn 0')
  isSaving.value = true
  errorMessage.value = ''
  try {
    await adminUsersAPI.updateBalance(selectedUser.value.id, balanceForm.amount, balanceForm.type)
    showSuccess('Cập nhật số dư thành công')
    isBalanceModalOpen.value = false
    loadUsers()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Cập nhật số dư thất bại'
  } finally {
    isSaving.value = false
  }
}

function showSuccess(msg) {
  successMessage.value = msg
  setTimeout(() => successMessage.value = '', 3000)
}

import { resolveBackendUrl } from '@/utils/url'

function resolveAvatar(url) {
  return resolveBackendUrl(url)
}

function formatDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

onMounted(async () => {
  isLoading.value = true
  try {
    await loadUsers()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="app-page">
    <div class="space-y-10">
      <!-- Header -->
      <section class="app-surface p-10 shadow-2xl relative overflow-hidden group">
        <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div>
            <div class="app-kicker">Hệ thống & Người dùng</div>
            <h1 class="mt-4 text-5xl font-black tracking-tighter text-foreground">Quản lý Người dùng</h1>
            <p class="mt-3 text-muted-foreground font-medium max-w-xl text-lg leading-relaxed">
              Trung tâm điều khiển tài khoản: Theo dõi số dư, trạng thái hoạt động và thông tin cá nhân của học viên trên toàn nền tảng.
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div class="relative min-w-[320px] group/search">
              <Search class="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <input 
                v-model="query"
                type="text" 
                placeholder="Tìm tên, email hoặc username..."
                class="app-input !pl-14 !py-4 shadow-sm"
                @keyup.enter="loadUsers"
              >
            </div>
            <button class="app-btn-primary !py-4" @click="loadUsers">
              <Search class="h-4 w-4 mr-2" /> Tìm kiếm
            </button>
          </div>
        </div>
        
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          <div v-if="isLoading" class="app-surface !bg-white/40 dark:!bg-white/5 p-6 shadow-sm border-white/20 animate-pulse">
            <div class="h-2 w-10 bg-muted rounded mb-3"></div>
            <div class="h-8 w-24 bg-muted rounded"></div>
          </div>
          <div v-else class="app-surface !bg-white/40 dark:!bg-white/5 p-6 shadow-sm border-white/20">
            <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tổng cộng</p>
            <div class="mt-3 flex items-baseline gap-3">
              <p class="text-4xl font-black text-primary">{{ pagination.totalElements }}</p>
              <p class="text-xs font-bold text-muted-foreground">người dùng</p>
            </div>
          </div>
        </div>

        <!-- Simplified background elements -->
        <div class="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/5"></div>
        <div class="absolute -left-20 -bottom-20 h-60 w-60 rounded-full bg-violet-500/5"></div>
      </section>

      <!-- Status Messages -->
      <div v-if="errorMessage" class="app-surface !bg-destructive/10 border-destructive/20 p-5 text-sm text-destructive font-bold flex items-center gap-4 animate-in slide-in-from-top duration-300">
        <div class="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
          <AlertCircle class="h-5 w-5" />
        </div>
        {{ errorMessage }}
      </div>
      
      <div v-if="successMessage" class="app-surface !bg-green-500/10 border-green-500/20 p-5 text-sm text-green-600 font-bold flex items-center gap-4 animate-in slide-in-from-top duration-300">
        <div class="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
          <CheckCircle2 class="h-5 w-5" />
        </div>
        {{ successMessage }}
      </div>

      <!-- Main Table -->
      <div class="app-surface shadow-2xl overflow-hidden flex flex-col">
        <div class="border-b border-border/50 bg-secondary/10 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-black text-foreground uppercase tracking-tight">Danh sách tài khoản</h2>
            <p class="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Trang {{ pagination.page + 1 }} / {{ pagination.totalPages }}</p>
          </div>
          <div v-if="isLoading" class="app-kicker !bg-primary/20">
            <Loader2 class="h-3.5 w-3.5 animate-spin mr-2" />
            Đang đồng bộ...
          </div>
        </div>

        <!-- Advanced Filter Panel -->
        <div class="px-8 py-5 border-b border-border/30 bg-zinc-50/50 dark:bg-zinc-900/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85">Vai trò (Role)</label>
            <select v-model="filterRole" class="app-select !py-2.5 !px-4 shadow-sm">
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="USER">Học viên (USER)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85">Trạng thái (Status)</label>
            <select v-model="filterStatus" class="app-select !py-2.5 !px-4 shadow-sm">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ENABLED">Đang hoạt động (Đang bật)</option>
              <option value="DISABLED">Đã khóa (Tạm dừng)</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/85">Số dư ví (Balance)</label>
            <select v-model="filterBalance" class="app-select !py-2.5 !px-4 shadow-sm">
              <option value="ALL">Tất cả số dư</option>
              <option value="HAS_BALANCE">Có tiền trong ví (> 0đ)</option>
              <option value="ZERO_BALANCE">Ví trống (= 0đ)</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-zinc-100 dark:bg-zinc-800/50 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10 border-b border-border/40">
                <th class="px-8 py-5">Định danh</th>
                <th class="px-6 py-5">Hồ sơ</th>
                <th class="px-6 py-5">Tài chính</th>
                <th class="px-6 py-5">Trạng thái</th>
                <th class="px-8 py-5 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/30">
              <tr v-if="isLoading">
                <td colspan="5" class="px-8 py-8">
                  <div class="space-y-6">
                    <div v-for="i in 5" :key="i" class="flex items-center gap-6 animate-pulse">
                      <div class="h-14 w-14 rounded-2xl bg-muted/40"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-4 w-1/4 bg-muted/40 rounded"></div>
                        <div class="h-3 w-1/3 bg-muted/40 rounded"></div>
                      </div>
                      <div class="h-10 w-24 bg-muted/40 rounded-xl"></div>
                      <div class="h-10 w-24 bg-muted/40 rounded-xl"></div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.id" class="group transition-colors duration-200 hover:bg-primary/[0.02]">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-5">
                    <div class="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <img v-if="user.avatar" :src="resolveAvatar(user.avatar)" class="h-full w-full object-cover">
                      <UserIcon v-else class="h-7 w-7 text-primary/60" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <p class="font-black text-foreground text-base tracking-tight">{{ user.username }}</p>
                        <span v-if="user.roleName === 'ADMIN'" class="app-kicker !px-2 !py-0.5 !text-[9px] !bg-amber-500/10 !text-amber-600 !border-amber-500/20">ADMIN</span>
                      </div>
                      <p class="text-xs text-muted-foreground font-medium mt-0.5">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2.5 text-[14px] font-bold text-foreground/90">
                      <div class="h-6 w-6 rounded-lg bg-muted flex items-center justify-center"><UserCog class="h-3.5 w-3.5 text-muted-foreground" /></div>
                      {{ user.fullName || '—' }}
                    </div>
                    <div class="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                      <div class="h-6 w-6 rounded-lg bg-muted flex items-center justify-center"><School class="h-3.5 w-3.5" /></div>
                      {{ user.schoolName || 'Chưa cập nhật trường' }}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <div class="inline-flex flex-col">
                    <div class="flex items-center gap-2 text-green-600 font-black text-base">
                      {{ formatCurrency(user.balance) }}
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Wallet class="h-3 w-3" /> Ví điện tử
                    </span>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <span 
                    class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                    :class="user.enabled 
                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                      : 'bg-destructive/10 text-destructive border-destructive/20'"
                  >
                    <span class="h-2 w-2 rounded-full" :class="user.enabled ? 'bg-green-600 animate-pulse' : 'bg-destructive'"></span>
                    {{ user.enabled ? 'Đang bật' : 'Đã khóa' }}
                  </span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center justify-end gap-3 relative z-10">
                    <button 
                      @click="openBalanceModal(user)" 
                      class="h-10 w-10 flex items-center justify-center rounded-xl border border-border/50 bg-white dark:bg-black/20 text-muted-foreground/80 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors duration-200 shadow-sm cursor-pointer" 
                      title="Quản lý số dư"
                    >
                      <Wallet class="h-5 w-5" />
                    </button>
                    <button 
                      @click="openEditModal(user)" 
                      class="h-10 w-10 flex items-center justify-center rounded-xl border border-border/50 bg-white dark:bg-black/20 text-muted-foreground/80 hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200 shadow-sm cursor-pointer" 
                      title="Chỉnh sửa hồ sơ"
                    >
                      <Edit3 class="h-5 w-5" />
                    </button>
                    <button 
                      @click="toggleUserStatus(user)" 
                      class="h-10 w-10 flex items-center justify-center rounded-xl border border-border/50 bg-white dark:bg-black/20 text-muted-foreground/80 hover:bg-destructive hover:text-white hover:border-destructive transition-colors duration-200 shadow-sm cursor-pointer" 
                      :title="user.enabled ? 'Khóa người dùng' : 'Mở khóa người dùng'"
                    >
                      <Ban v-if="user.enabled" class="h-5 w-5" />
                      <CheckCircle2 v-else class="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!isLoading && filteredUsers.length === 0">
                <td colspan="5" class="px-8 py-32 text-center">
                  <div class="flex flex-col items-center gap-4 opacity-30">
                    <div class="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                      <Search class="h-10 w-10" />
                    </div>
                    <p class="text-lg font-black uppercase tracking-widest">Dữ liệu trống</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-8 py-6 bg-secondary/5 border-t border-border/50 flex items-center justify-between mt-auto">
          <p class="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Hiển thị {{ filteredUsers.length }} / {{ pagination.totalElements }} người dùng
          </p>
          <div class="flex items-center gap-3 relative z-10">
            <button 
              :disabled="pagination.first || isLoading"
              @click="pagination.page--; loadUsers()"
              class="app-btn-secondary !px-5 !py-2.5 !text-xs disabled:opacity-30"
            >
              <ChevronLeft class="h-4 w-4" />
            </button>
            <button 
              :disabled="pagination.last || isLoading"
              @click="pagination.page++; loadUsers()"
              class="app-btn-secondary !px-5 !py-2.5 !text-xs disabled:opacity-30"
            >
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 transition-all" @click.self="isEditModalOpen = false">
      <div class="app-surface !overflow-visible w-full max-w-xl p-10 relative z-10 shadow-[0_32px_128px_rgba(0,0,0,0.5)] border-white/10 animate-in zoom-in-95 duration-300" @click.stop>
        <div class="flex items-center justify-between mb-10">
          <div>
            <h3 class="text-3xl font-black text-foreground tracking-tighter">Chỉnh sửa hồ sơ</h3>
            <p class="text-sm text-muted-foreground font-medium mt-1">Cập nhật thông tin chi tiết cho người dùng <span class="text-primary font-bold">{{ selectedUser?.username }}</span></p>
          </div>
          <div class="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <UserCog class="h-7 w-7 text-primary" />
          </div>
        </div>
        
        <div class="modal-content-scroll">
          <div class="grid gap-8">
            <!-- Avatar Upload -->
            <div class="flex flex-col items-center gap-6 mb-2">
              <div class="relative group/avatar">
                <div class="h-32 w-32 rounded-[2rem] bg-secondary/30 border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden transition-all group-hover/avatar:border-primary/50 shadow-inner">
                  <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="h-full w-full object-cover">
                  <UserIcon v-else class="h-12 w-12 text-muted-foreground/30" />
                  
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer" @click="avatarInputRef.click()">
                    <Camera class="h-8 w-8 text-white" />
                  </div>
                </div>
                <button 
                  v-if="avatarPreviewUrl" 
                  @click="removeAvatar"
                  class="absolute -right-2 -bottom-2 h-10 w-10 rounded-xl bg-destructive text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
              <div class="text-center">
                <p class="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Ảnh đại diện</p>
                <input ref="avatarInputRef" type="file" class="hidden" accept="image/*" @change="handleAvatarChange">
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Họ và tên học viên</label>
              <input v-model="editForm.fullName" type="text" class="app-input shadow-inner" placeholder="Nhập họ tên đầy đủ...">
            </div>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-3">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Trường học</label>
                <input v-model="editForm.schoolName" type="text" class="app-input shadow-inner" placeholder="Tên trường...">
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Cấp độ học tập</label>
                <select v-model="editForm.levelId" class="app-select shadow-inner">
                  <option :value="null">Chưa chọn cấp độ</option>
                  <option v-for="level in metadataStore.levels" :key="level.id" :value="level.id">{{ level.name }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Ngày sinh</label>
              <input v-model="editForm.dob" type="date" class="app-input shadow-inner">
            </div>
          </div>
        </div>

        <div class="mt-12 flex items-center justify-end gap-4 border-t border-border/40 pt-8">
          <button @click="isEditModalOpen = false" class="app-btn-secondary !border-transparent">Hủy bỏ</button>
          <button @click="handleUpdateUser" :disabled="isSaving" class="app-btn-primary">
            <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin mr-2" />
            {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Balance Modal -->
    <div v-if="isBalanceModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 transition-all" @click.self="isBalanceModalOpen = false">
      <div class="app-surface !overflow-visible w-full max-w-sm p-10 relative z-10 shadow-[0_32px_128px_rgba(0,0,0,0.5)] border-white/10 animate-in zoom-in-95 duration-300" @click.stop>
        <div class="text-center mb-10">
          <div class="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-lg">
            <Wallet class="h-8 w-8 text-green-600" />
          </div>
          <h3 class="text-3xl font-black text-foreground tracking-tighter">Số dư ví</h3>
          <p class="text-sm text-muted-foreground font-medium mt-1">Cấp vốn hoặc trừ tiền tài khoản <span class="text-primary font-bold">{{ selectedUser?.username }}</span></p>
        </div>
        
        <div class="space-y-8">
          <div class="flex gap-2 p-1.5 bg-secondary/50 rounded-2xl border border-border/40">
            <button 
              @click="balanceForm.type = 'ADD'"
              class="flex-1 py-3 text-[11px] font-black rounded-xl transition-all tracking-widest"
              :class="balanceForm.type === 'ADD' ? 'bg-green-600 text-white shadow-lg' : 'text-muted-foreground hover:bg-white/50'"
            >CỘNG TIỀN</button>
            <button 
              @click="balanceForm.type = 'SUBTRACT'"
              class="flex-1 py-3 text-[11px] font-black rounded-xl transition-all tracking-widest"
              :class="balanceForm.type === 'SUBTRACT' ? 'bg-destructive text-white shadow-lg' : 'text-muted-foreground hover:bg-white/50'"
            >TRỪ TIỀN</button>
          </div>

          <div class="space-y-3">
            <label class="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1 text-center block">Số tiền giao dịch (VNĐ)</label>
            <input 
              v-model.number="balanceForm.amount" 
              type="number" 
              class="app-input text-center text-3xl font-black !py-6 text-primary tracking-tighter border-primary/20 bg-primary/5 focus:bg-white" 
              placeholder="0"
            >
          </div>
        </div>

        <div class="mt-12 flex flex-col gap-3">
          <button @click="handleUpdateBalance" :disabled="isSaving" class="app-btn-primary !w-full !py-5 shadow-green-500/20">
            <Loader2 v-if="isSaving" class="h-4 w-4 animate-spin mr-2" />
            {{ isSaving ? 'Đang xử lý...' : 'Xác nhận giao dịch' }}
          </button>
          <button @click="isBalanceModalOpen = false" class="app-btn-secondary !w-full border-transparent !text-muted-foreground">Hủy bỏ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: specific styles for UsersView if needed */
</style>