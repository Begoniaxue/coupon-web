<template>
  <div class="task-page">
    <el-drawer v-model="statsDrawerVisible" title="数据统计面板" direction="rtl" size="400px">
      <div class="stats-panel">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon total-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ taskStore.totalCount }}</div>
                  <div class="stat-label">任务总数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon rate-icon">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ taskStore.completionRate }}%</div>
                  <div class="stat-label">完成率</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon completed-icon">
                  <el-icon><CircleCheck /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ taskStore.completedCount }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card class="stat-card">
              <div class="stat-item">
                <div class="stat-icon pending-icon">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ taskStore.pendingCount }}</div>
                  <div class="stat-label">待完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>近7天任务趋势</span>
          </template>
          <div ref="weeklyChartRef" class="chart-container"></div>
        </el-card>

        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>任务完成状态分布</span>
          </template>
          <div ref="pieChartRef" class="pie-chart-container"></div>
        </el-card>

        <el-card class="chart-card" shadow="never">
          <template #header>
            <span>各清单任务分布</span>
          </template>
          <div ref="groupChartRef" class="chart-container"></div>
        </el-card>
      </div>
    </el-drawer>

    <el-drawer v-model="backupDrawerVisible" title="数据备份与恢复" direction="rtl" size="400px">
      <div class="backup-panel">
        <el-alert
          title="数据备份说明"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #default>
            备份将保存当前所有任务和分组数据，最多保留10个备份记录。
          </template>
        </el-alert>

        <el-button type="primary" style="width: 100%; margin-bottom: 16px" @click="handleCreateBackup">
          <el-icon><Plus /></el-icon>
          创建新备份
        </el-button>

        <div class="backup-list">
          <div v-if="backups.length === 0" class="empty-backups">
            <el-empty description="暂无备份记录" />
          </div>
          <div v-else class="backup-items">
            <div
              v-for="backup in backups"
              :key="backup.id"
              class="backup-item"
            >
              <div class="backup-info">
                <div class="backup-time">{{ formatBackupTime(backup.createdAt) }}</div>
                <div class="backup-detail">
                  {{ backup.tasks?.length || 0 }} 个任务 · {{ backup.groups?.length || 0 }} 个分组
                </div>
              </div>
              <div class="backup-actions">
                <el-button size="small" type="primary" link @click="handleRestoreBackup(backup)">
                  恢复
                </el-button>
                <el-button size="small" type="danger" link @click="handleDeleteBackup(backup.id)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="groupDrawerVisible" title="管理清单分组" direction="ltr" size="300px">
      <div class="group-management">
        <el-form :model="newGroupForm" @submit.prevent="handleAddGroup">
          <el-form-item>
            <el-input
              v-model="newGroupForm.name"
              placeholder="输入新清单名称"
              clearable
              @keyup.enter="handleAddGroup"
            >
              <template #append>
                <el-color-picker v-model="newGroupForm.color" show-alpha />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="width: 100%" @click="handleAddGroup">
              <el-icon><Plus /></el-icon>
              新建清单
            </el-button>
          </el-form-item>
        </el-form>

        <el-divider>现有清单</el-divider>

        <div class="group-list">
          <div
            v-for="group in taskStore.groups"
            :key="group.id"
            class="group-manage-item"
          >
            <div class="group-manage-info">
              <span class="group-color-dot" :style="{ background: group.color }"></span>
              <span v-if="editingGroupId !== group.id" class="group-name">{{ group.name }}</span>
              <el-input
                v-else
                v-model="editingGroupName"
                size="small"
                @keyup.enter="handleSaveGroupName(group.id)"
                @blur="handleSaveGroupName(group.id)"
                ref="groupNameInput"
              />
              <el-color-picker
                v-if="group.id !== 'default'"
                v-model="group.color"
                size="small"
                show-alpha
              />
            </div>
            <div class="group-manage-actions" v-if="group.id !== 'default'">
              <el-button size="small" link @click="handleStartEditGroup(group)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" type="danger" link @click="handleDeleteGroup(group.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <div class="task-container">
      <el-aside width="240px" class="task-sidebar">
        <div class="sidebar-header">
          <h3 class="sidebar-title">
            <el-icon><List /></el-icon>
            任务清单
          </h3>
          <el-button size="small" text @click="groupDrawerVisible = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>

        <div class="group-items">
          <div
            class="group-item"
            :class="{ active: taskStore.selectedGroupId === 'all' }"
            @click="taskStore.setSelectedGroup('all')"
          >
            <span class="group-icon all-group-icon">
              <el-icon><FolderOpened /></el-icon>
            </span>
            <span class="group-name">全部任务</span>
            <el-tag size="small" type="info">{{ taskStore.totalCount }}</el-tag>
          </div>
          <div
            v-for="stat in taskStore.groupStats"
            :key="stat.id"
            class="group-item"
            :class="{ active: taskStore.selectedGroupId === stat.id }"
            @click="taskStore.setSelectedGroup(stat.id)"
          >
            <span class="group-color-dot" :style="{ background: stat.color }"></span>
            <span class="group-name">{{ stat.name }}</span>
            <el-tag size="small" type="info">{{ stat.total }}</el-tag>
          </div>
        </div>

        <el-divider style="margin: 12px 0" />

        <div class="sidebar-actions">
          <el-button type="primary" size="small" style="width: 100%" @click="handleAddGroupQuick">
            <el-icon><Plus /></el-icon>
            新建清单
          </el-button>
        </div>
      </el-aside>

      <el-main class="task-main">
        <el-card class="task-card">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon><List /></el-icon>
                <span>任务管理</span>
              </div>
              <div class="task-stats">
                <el-tag type="info">总计: {{ taskStore.filteredTasks.length }}</el-tag>
                <el-tag type="success">已完成: {{ completedInGroup }}</el-tag>
                <el-tag type="warning">待完成: {{ pendingInGroup }}</el-tag>
              </div>
              <div class="header-actions">
                <el-button size="small" @click="statsDrawerVisible = true">
                  <el-icon><DataAnalysis /></el-icon>
                  数据统计
                </el-button>
                <el-dropdown @command="handleDataCommand">
                  <el-button size="small" type="primary">
                    <el-icon><Download /></el-icon>
                    数据管理
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="export">
                        <el-icon><Upload /></el-icon>
                        导出 JSON
                      </el-dropdown-item>
                      <el-dropdown-item command="import">
                        <el-icon><Download /></el-icon>
                        导入 JSON
                      </el-dropdown-item>
                      <el-dropdown-item command="backup">
                        <el-icon><Box /></el-icon>
                        备份 / 恢复
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <input
                  ref="importFileInput"
                  type="file"
                  accept=".json"
                  style="display: none"
                  @change="handleImportFile"
                />
              </div>
              <div class="debug-actions">
                <el-button
                  size="small"
                  type="danger"
                  :disabled="taskStore.completedCount === 0"
                  :loading="taskStore.loading"
                  @click="handleClearCompleted"
                >
                  <el-icon><Delete /></el-icon>
                  清除已完成
                </el-button>
                <el-button size="small" type="primary" :loading="taskStore.loading" @click="handleGenerateMock(50)">
                  <el-icon><MagicStick /></el-icon>
                  生成测试数据
                </el-button>
                <el-button size="small" type="info" @click="handleClearAll">
                  <el-icon><Delete /></el-icon>
                  清空数据
                </el-button>
              </div>
            </div>
          </template>

          <el-card class="search-card" shadow="never">
            <el-form :model="searchForm" class="search-form" @submit.prevent>
              <el-row :gutter="16">
                <el-col :xs="24" :sm="12" :md="8" :lg="6">
                  <el-form-item prop="keyword">
                    <el-input
                      v-model="searchForm.keyword"
                      placeholder="搜索任务标题"
                      clearable
                      :prefix-icon="Search"
                      @keyup.enter="handleSearch"
                      @clear="handleSearch"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12" :md="10" :lg="8">
                  <el-form-item prop="dateRange">
                    <el-date-picker
                      v-model="searchForm.dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="24" :md="6" :lg="6">
                  <el-form-item>
                    <el-button type="primary" @click="handleSearch">
                      <el-icon><Search /></el-icon>
                      搜索
                    </el-button>
                    <el-button @click="handleResetSearch">
                      <el-icon><Refresh /></el-icon>
                      重置
                    </el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>

          <el-form :model="taskForm" class="task-input-form" @submit.prevent="handleAddTask">
            <el-row :gutter="16">
              <el-col :xs="24" :sm="24" :md="10" :lg="10">
                <el-form-item prop="title">
                  <el-input
                    v-model="taskForm.title"
                    placeholder="请输入任务标题"
                    clearable
                    size="large"
                    :disabled="taskStore.loading"
                    @keyup.enter="handleAddTask"
                  >
                    <template #prefix>
                      <el-icon><Edit /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :md="8" :lg="8">
                <el-form-item prop="description">
                  <el-input
                    v-model="taskForm.description"
                    placeholder="任务描述（可选）"
                    clearable
                    size="large"
                    :disabled="taskStore.loading"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :md="4" :lg="4">
                <el-form-item prop="groupId">
                  <el-select v-model="taskForm.groupId" size="large" style="width: 100%">
                    <el-option
                      v-for="group in taskStore.groups"
                      :key="group.id"
                      :label="group.name"
                      :value="group.id"
                    >
                      <span class="group-color-dot" :style="{ background: group.color }"></span>
                      {{ group.name }}
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :md="2" :lg="2">
                <el-form-item>
                  <el-button
                    type="primary"
                    size="large"
                    :loading="taskStore.loading"
                    @click="handleAddTask"
                    class="add-btn"
                  >
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <el-tabs v-model="activeTab" class="filter-tabs" @tab-change="handleTabChange">
            <el-tab-pane label="全部" name="all">
              <template #label>
                <span class="tab-label">
                  <el-icon><Document /></el-icon>
                  全部
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="待完成" name="pending">
              <template #label>
                <span class="tab-label">
                  <el-icon><Clock /></el-icon>
                  待完成
                  <el-badge :value="pendingInGroup" :hidden="pendingInGroup === 0" class="tab-badge" />
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="已完成" name="completed">
              <template #label>
                <span class="tab-label">
                  <el-icon><CircleCheck /></el-icon>
                  已完成
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>

          <div v-loading="taskStore.loading" class="task-list-container">
            <el-empty v-if="taskStore.filteredTasks.length === 0" description="暂无任务" />

            <div v-else class="task-items">
              <div
                v-for="(task, index) in paginatedTasks"
                :key="task.id"
                class="task-item"
                :class="{ 'task-completed': task.completed, 'dragging': dragIndex === index }"
                draggable="true"
                @dragstart="handleDragStart($event, index)"
                @dragover="handleDragOver($event, index)"
                @dragleave="handleDragLeave"
                @drop="handleDrop($event, index)"
                @dragend="handleDragEnd"
              >
                <div class="task-drag-handle">
                  <el-icon><Rank /></el-icon>
                </div>

                <div class="task-checkbox">
                  <el-checkbox
                    v-model="task.completed"
                    :disabled="taskStore.loading"
                    @change="handleToggleStatus(task)"
                  />
                </div>

                <div class="task-content">
                  <div class="task-title" :class="{ 'title-completed': task.completed }">
                    {{ task.title }}
                  </div>
                  <div v-if="task.description" class="task-description">
                    {{ task.description }}
                  </div>
                  <div class="task-meta">
                    <el-icon><Clock /></el-icon>
                    <span>创建于: {{ task.createdAt }}</span>
                    <span v-if="task.createdAt !== task.updatedAt" class="updated-time">
                      | 更新于: {{ task.updatedAt }}
                    </span>
                    <el-tag
                      v-if="getGroupById(task.groupId)"
                      size="small"
                      :style="{ background: getGroupById(task.groupId).color + '20', color: getGroupById(task.groupId).color, borderColor: getGroupById(task.groupId).color + '50' }"
                      class="group-tag"
                    >
                      {{ getGroupById(task.groupId).name }}
                    </el-tag>
                  </div>
                </div>

                <div class="task-actions">
                  <el-button
                    type="primary"
                    size="small"
                    link
                    :disabled="taskStore.loading"
                    @click="handleEdit(task)"
                  >
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button
                    type="danger"
                    size="small"
                    link
                    :disabled="taskStore.loading"
                    @click="handleDelete(task)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </div>

            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 30, 50, 100]"
              :total="taskStore.filteredTasks.length"
              layout="total, sizes, prev, pager, next, jumper"
              class="task-pagination"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-main>
    </div>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="任务标题">
          <el-input
            v-model="editForm.title"
            placeholder="请输入任务标题"
            clearable
          />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
            clearable
          />
        </el-form-item>
        <el-form-item label="所属分组">
          <el-select v-model="editForm.groupId" style="width: 100%">
            <el-option
              v-for="group in taskStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            >
              <span class="group-color-dot" :style="{ background: group.color }"></span>
              {{ group.name }}
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="taskStore.loading" @click="handleSaveEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useTaskStore } from '@/stores/task'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import {
  List,
  Edit,
  Plus,
  Document,
  Clock,
  CircleCheck,
  Delete,
  MagicStick,
  Search,
  Refresh,
  Setting,
  FolderOpened,
  DataAnalysis,
  Download,
  Upload,
  Box,
  ArrowDown,
  TrendCharts,
  Rank
} from '@element-plus/icons-vue'

const taskStore = useTaskStore()

const activeTab = ref('all')
const statsDrawerVisible = ref(false)
const backupDrawerVisible = ref(false)
const groupDrawerVisible = ref(false)
const backups = ref([])
const weeklyChartRef = ref(null)
const pieChartRef = ref(null)
const groupChartRef = ref(null)
let weeklyChart = null
let pieChart = null
let groupChart = null

const pagination = ref({
  currentPage: 1,
  pageSize: 10
})

const paginatedTasks = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return taskStore.filteredTasks.slice(start, end)
})

const completedInGroup = computed(() => {
  return taskStore.filteredTasks.filter(t => t.completed).length
})

const pendingInGroup = computed(() => {
  return taskStore.filteredTasks.filter(t => !t.completed).length
})

const searchForm = ref({
  keyword: '',
  dateRange: null
})

const taskForm = ref({
  title: '',
  description: '',
  groupId: 'default'
})

const editDialogVisible = ref(false)
const editingTaskId = ref(null)
const editForm = ref({
  title: '',
  description: '',
  groupId: 'default'
})

const newGroupForm = ref({
  name: '',
  color: '#409EFF'
})

const editingGroupId = ref(null)
const editingGroupName = ref('')
const groupNameInput = ref(null)

const dragIndex = ref(null)
const importFileInput = ref(null)

const getGroupById = (id) => {
  return taskStore.groups.find(g => g.id === id)
}

const formatBackupTime = (time) => {
  const d = new Date(time)
  return d.toLocaleString('zh-CN')
}

const handleTabChange = (tab) => {
  taskStore.setFilterType(tab)
  pagination.value.currentPage = 1
}

const handleSearch = () => {
  taskStore.setSearchKeyword(searchForm.value.keyword)
  taskStore.setDateRange(searchForm.value.dateRange)
  pagination.value.currentPage = 1
}

const handleResetSearch = () => {
  searchForm.value.keyword = ''
  searchForm.value.dateRange = null
  taskStore.clearSearch()
  pagination.value.currentPage = 1
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
}

const handleCurrentChange = (page) => {
  pagination.value.currentPage = page
}

watch(() => taskStore.filteredTasks.length, () => {
  const totalPages = Math.ceil(taskStore.filteredTasks.length / pagination.value.pageSize)
  if (pagination.value.currentPage > totalPages && totalPages > 0) {
    pagination.value.currentPage = totalPages
  }
})

watch(() => taskStore.selectedGroupId, () => {
  pagination.value.currentPage = 1
  taskForm.value.groupId = taskStore.selectedGroupId !== 'all' ? taskStore.selectedGroupId : 'default'
})

const handleGenerateMock = (count) => {
  taskStore.generateMockData(count)
  pagination.value.currentPage = 1
  ElMessage.success(`已生成 ${count} 条测试数据`)
}

const handleClearAll = () => {
  ElMessageBox.confirm(
    '确定要清空所有任务数据吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    taskStore.clearAllTasks()
    pagination.value.currentPage = 1
    ElMessage.success('已清空所有数据')
  }).catch(() => {})
}

const handleClearCompleted = async () => {
  if (taskStore.completedCount === 0) {
    ElMessage.warning('没有已完成的任务')
    return
  }

  ElMessageBox.confirm(
    `确定要删除所有已完成的任务吗？共 ${taskStore.completedCount} 条`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const count = await taskStore.clearCompletedTasks()
      pagination.value.currentPage = 1
      ElMessage.success(`已删除 ${count} 条已完成任务`)
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleAddTask = async () => {
  if (!taskForm.value.title.trim()) {
    ElMessage.warning('请输入任务标题')
    return
  }

  try {
    await taskStore.addTask(
      taskForm.value.title.trim(),
      taskForm.value.description.trim(),
      taskForm.value.groupId
    )
    ElMessage.success('任务添加成功')
    taskForm.value.title = ''
    taskForm.value.description = ''
    pagination.value.currentPage = 1
  } catch (error) {
    ElMessage.error('添加任务失败')
  }
}

const handleToggleStatus = async (task) => {
  try {
    await taskStore.toggleTaskStatus(task.id)
    ElMessage.success(task.completed ? '任务已完成' : '任务已恢复')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleEdit = (task) => {
  editingTaskId.value = task.id
  editForm.value.title = task.title
  editForm.value.description = task.description || ''
  editForm.value.groupId = task.groupId || 'default'
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入任务标题')
    return
  }

  try {
    await taskStore.editTask(editingTaskId.value, {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim(),
      groupId: editForm.value.groupId
    })
    ElMessage.success('任务更新成功')
    editDialogVisible.value = false
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleDelete = (task) => {
  ElMessageBox.confirm(
    `确定要删除任务"${task.title}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await taskStore.removeTask(task.id)
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleAddGroup = () => {
  if (!newGroupForm.value.name.trim()) {
    ElMessage.warning('请输入清单名称')
    return
  }
  taskStore.addGroup(newGroupForm.value.name.trim(), newGroupForm.value.color)
  newGroupForm.value.name = ''
  ElMessage.success('清单创建成功')
}

const handleAddGroupQuick = () => {
  groupDrawerVisible.value = true
}

const handleStartEditGroup = (group) => {
  editingGroupId.value = group.id
  editingGroupName.value = group.name
  nextTick(() => {
    if (groupNameInput.value) {
      groupNameInput.value.focus()
    }
  })
}

const handleSaveGroupName = (groupId) => {
  if (editingGroupName.value.trim()) {
    taskStore.editGroup(groupId, { name: editingGroupName.value.trim() })
    ElMessage.success('清单名称已更新')
  }
  editingGroupId.value = null
}

const handleDeleteGroup = (groupId) => {
  ElMessageBox.confirm(
    '确定要删除此清单吗？清单内的任务将移至"默认清单"。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    taskStore.removeGroup(groupId)
    ElMessage.success('清单已删除')
  }).catch(() => {})
}

const handleDataCommand = (command) => {
  switch (command) {
    case 'export':
      taskStore.exportToJSON()
      ElMessage.success('数据导出成功')
      break
    case 'import':
      importFileInput.value?.click()
      break
    case 'backup':
      backups.value = taskStore.getBackups()
      backupDrawerVisible.value = true
      break
  }
}

const handleImportFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  ElMessageBox.confirm(
    '导入将覆盖当前所有任务和分组数据，确定继续吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await taskStore.importFromJSON(file)
      ElMessage.success('数据导入成功')
      pagination.value.currentPage = 1
    } catch (error) {
      ElMessage.error(error.message)
    }
  }).catch(() => {})

  event.target.value = ''
}

const handleCreateBackup = () => {
  taskStore.createBackup()
  backups.value = taskStore.getBackups()
  ElMessage.success('备份创建成功')
}

const handleRestoreBackup = (backup) => {
  ElMessageBox.confirm(
    `确定要恢复到 ${formatBackupTime(backup.createdAt)} 的备份吗？当前数据将被覆盖。`,
    '提示',
    {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    taskStore.restoreFromBackup(backup.id)
    ElMessage.success('数据已恢复')
    pagination.value.currentPage = 1
  }).catch(() => {})
}

const handleDeleteBackup = (backupId) => {
  ElMessageBox.confirm(
    '确定要删除此备份吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    taskStore.deleteBackup(backupId)
    backups.value = taskStore.getBackups()
    ElMessage.success('备份已删除')
  }).catch(() => {})
}

const handleDragStart = (event, index) => {
  dragIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', index.toString())
}

const handleDragOver = (event, index) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  if (dragIndex.value !== null && dragIndex.value !== index) {
    const tasks = [...taskStore.filteredTasks]
    const [draggedTask] = tasks.splice(dragIndex.value, 1)
    tasks.splice(index, 0, draggedTask)
    const newOrder = tasks.map(t => t.id)
    taskStore.reorderTasks(newOrder)
    dragIndex.value = index
  }
}

const handleDragLeave = () => {
}

const handleDrop = (event, index) => {
  event.preventDefault()
}

const handleDragEnd = () => {
  dragIndex.value = null
}

const initCharts = () => {
  if (weeklyChartRef.value) {
    weeklyChart = echarts.init(weeklyChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['新增任务', '完成任务'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: taskStore.getWeeklyStats.map(s => s.date)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '新增任务',
          type: 'bar',
          data: taskStore.getWeeklyStats.map(s => s.total),
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '完成任务',
          type: 'bar',
          data: taskStore.getWeeklyStats.map(s => s.completed),
          itemStyle: { color: '#67C23A' }
        }
      ]
    }
    weeklyChart.setOption(option)
  }

  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        itemGap: 20
      },
      series: [
        {
          name: '任务状态',
          type: 'pie',
          radius: ['35%', '60%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n{d}%',
            fontSize: 12
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 15
          },
          data: [
            { value: taskStore.completedCount, name: '已完成', itemStyle: { color: '#67C23A' } },
            { value: taskStore.pendingCount, name: '待完成', itemStyle: { color: '#E6A23C' } }
          ]
        }
      ]
    }
    pieChart.setOption(option)
  }

  if (groupChartRef.value) {
    groupChart = echarts.init(groupChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['已完成', '待完成'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: taskStore.groupStats.map(g => g.name)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '已完成',
          type: 'bar',
          stack: 'total',
          data: taskStore.groupStats.map(g => g.completed),
          itemStyle: { color: '#67C23A' }
        },
        {
          name: '待完成',
          type: 'bar',
          stack: 'total',
          data: taskStore.groupStats.map(g => g.pending),
          itemStyle: { color: '#E6A23C' }
        }
      ]
    }
    groupChart.setOption(option)
  }
}

watch(statsDrawerVisible, (val) => {
  if (val) {
    nextTick(() => {
      initCharts()
    })
  }
})

const handleResize = () => {
  weeklyChart?.resize()
  pieChart?.resize()
  groupChart?.resize()
}

onMounted(() => {
  taskStore.fetchTasks()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  weeklyChart?.dispose()
  pieChart?.dispose()
  groupChart?.dispose()
})
</script>

<style scoped>
.task-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-container {
  display: flex;
  height: 100%;
  gap: 16px;
}

.task-sidebar {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  height: fit-content;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-item:hover {
  background: #f5f7fa;
}

.group-item.active {
  background: #ecf5ff;
  color: #409EFF;
}

.group-icon {
  display: flex;
  align-items: center;
}

.all-group-icon {
  color: #909399;
}

.group-item.active .all-group-icon {
  color: #409EFF;
}

.group-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-name {
  flex: 1;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-actions {
  margin-top: 8px;
}

.task-main {
  flex: 1;
  padding: 0;
  min-width: 0;
}

.task-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-title .el-icon {
  margin-right: 8px;
  font-size: 20px;
  color: #409EFF;
}

.task-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.debug-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-card {
  margin-bottom: 16px;
  background: #f5f7fa;
}

.search-form {
  margin: 0;
}

.search-form .el-form-item {
  margin-bottom: 0;
}

.task-input-form {
  margin-bottom: 20px;
}

.add-btn {
  width: 100%;
}

.filter-tabs {
  margin-bottom: 20px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tab-badge {
  margin-left: 4px;
}

.task-list-container {
  min-height: 200px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  cursor: grab;
}

.task-item:active {
  cursor: grabbing;
}

.task-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
  transform: translateX(4px);
}

.task-item.dragging {
  opacity: 0.5;
  background: #ecf5ff;
}

.task-completed {
  background: #f0f9eb;
  border-color: #c2e7b0;
}

.task-drag-handle {
  padding-right: 8px;
  padding-top: 2px;
  color: #c0c4cc;
  cursor: grab;
}

.task-drag-handle:hover {
  color: #909399;
}

.task-checkbox {
  padding-right: 12px;
  padding-top: 2px;
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.title-completed {
  text-decoration: line-through;
  color: #909399;
}

.task-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  word-break: break-all;
}

.task-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.task-meta .el-icon {
  font-size: 12px;
}

.updated-time {
  color: #c0c4cc;
}

.group-tag {
  margin-left: 8px;
}

.task-actions {
  display: flex;
  gap: 8px;
  padding-left: 12px;
  flex-shrink: 0;
}

.task-pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.stats-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rate-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.completed-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.chart-card {
  margin-bottom: 0;
}

.chart-container {
  height: 200px;
}

.pie-chart-container {
  height: 250px;
}

.backup-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-backups {
  padding: 40px 0;
}

.backup-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.backup-item:hover {
  background: #ecf5ff;
}

.backup-time {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.backup-detail {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.group-management {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-manage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background: #f5f7fa;
  transition: all 0.2s ease;
}

.group-manage-item:hover {
  background: #ecf5ff;
}

.group-manage-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.group-manage-actions {
  display: flex;
  gap: 4px;
}

@media (max-width: 768px) {
  .task-container {
    flex-direction: column;
  }

  .task-sidebar {
    width: 100% !important;
    max-height: none;
  }

  .task-item {
    flex-wrap: wrap;
  }

  .task-drag-handle {
    order: 1;
  }

  .task-checkbox {
    order: 2;
  }

  .task-content {
    flex: 1 1 100%;
    order: 3;
    margin-top: 8px;
  }

  .task-actions {
    order: 4;
    width: 100%;
    padding-left: 0;
    margin-top: 12px;
    justify-content: flex-end;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .task-pagination {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
