import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'task-management-data'
const GROUPS_STORAGE_KEY = 'task-groups-data'
const BACKUP_STORAGE_KEY = 'task-backups'

const loadFromStorage = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save to localStorage:`, error)
  }
}

export const useTaskStore = defineStore('task', () => {
  const taskList = ref(loadFromStorage(STORAGE_KEY, []))
  const groups = ref(loadFromStorage(GROUPS_STORAGE_KEY, [
    { id: 'default', name: '默认清单', color: '#409EFF', createdAt: new Date().toISOString() }
  ]))
  const loading = ref(false)
  const filterType = ref('all')
  const searchKeyword = ref('')
  const dateRange = ref(null)
  const selectedGroupId = ref('default')

  watch(taskList, (newTasks) => {
    saveToStorage(STORAGE_KEY, newTasks)
  }, { deep: true })

  watch(groups, (newGroups) => {
    saveToStorage(GROUPS_STORAGE_KEY, newGroups)
  }, { deep: true })

  const filteredTasks = computed(() => {
    let result = [...taskList.value]

    if (selectedGroupId.value !== 'all') {
      result = result.filter(task => (task.groupId || 'default') === selectedGroupId.value)
    }

    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.trim().toLowerCase()
      result = result.filter(task => task.title.toLowerCase().includes(keyword))
    }

    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = new Date(dateRange.value[0])
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateRange.value[1])
      endDate.setHours(23, 59, 59, 999)

      result = result.filter(task => {
        const taskDate = new Date(task.createdAt)
        return taskDate >= startDate && taskDate <= endDate
      })
    }

    switch (filterType.value) {
      case 'completed':
        result = result.filter(task => task.completed)
        break
      case 'pending':
        result = result.filter(task => !task.completed)
        break
    }

    result.sort((a, b) => {
      const aHasOrder = a.order !== undefined && a.order !== null
      const bHasOrder = b.order !== undefined && b.order !== null
      if (aHasOrder && bHasOrder) {
        return a.order - b.order
      }
      if (aHasOrder) return -1
      if (bHasOrder) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

    return result
  })

  const totalCount = computed(() => taskList.value.length)
  const completedCount = computed(() => taskList.value.filter(task => task.completed).length)
  const pendingCount = computed(() => taskList.value.filter(task => !task.completed).length)
  const completionRate = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.round((completedCount.value / totalCount.value) * 100)
  })

  const groupStats = computed(() => {
    return groups.value.map(group => {
      const groupTasks = taskList.value.filter(t => t.groupId === group.id)
      const completed = groupTasks.filter(t => t.completed).length
      return {
        ...group,
        total: groupTasks.length,
        completed,
        pending: groupTasks.length - completed
      }
    })
  })

  const getWeeklyStats = computed(() => {
    const stats = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayTasks = taskList.value.filter(t => t.createdAt.startsWith(dateStr))
      stats.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.completed).length
      })
    }
    return stats
  })

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const fetchTasks = () => {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        taskList.value = loadFromStorage(STORAGE_KEY, [])
        groups.value = loadFromStorage(GROUPS_STORAGE_KEY, [
          { id: 'default', name: '默认清单', color: '#409EFF', createdAt: new Date().toISOString() }
        ])
        loading.value = false
        resolve()
      }, 300)
    })
  }

  const addTask = (title, description = '', groupId = selectedGroupId.value) => {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTask = {
          id: generateId(),
          title,
          description,
          completed: false,
          groupId: groupId || 'default',
          order: taskList.value.length,
          createdAt: formatDate(new Date()),
          updatedAt: formatDate(new Date())
        }
        taskList.value.unshift(newTask)
        loading.value = false
        resolve(newTask)
      }, 200)
    })
  }

  const editTask = (id, data) => {
    loading.value = true
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = taskList.value.findIndex(task => task.id === id)
        if (index !== -1) {
          taskList.value[index] = {
            ...taskList.value[index],
            ...data,
            updatedAt: formatDate(new Date())
          }
          loading.value = false
          resolve(taskList.value[index])
        } else {
          loading.value = false
          reject(new Error('Task not found'))
        }
      }, 200)
    })
  }

  const removeTask = (id) => {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = taskList.value.findIndex(task => task.id === id)
        if (index !== -1) {
          taskList.value.splice(index, 1)
        }
        loading.value = false
        resolve()
      }, 200)
    })
  }

  const toggleTaskStatus = (id) => {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        const task = taskList.value.find(task => task.id === id)
        if (task) {
          task.completed = !task.completed
          task.updatedAt = formatDate(new Date())
        }
        loading.value = false
        resolve()
      }, 200)
    })
  }

  const moveTask = (taskId, newGroupId) => {
    const task = taskList.value.find(t => t.id === taskId)
    if (task) {
      task.groupId = newGroupId
      task.updatedAt = formatDate(new Date())
    }
  }

  const reorderTasks = (newOrder) => {
    newOrder.forEach((taskId, index) => {
      const task = taskList.value.find(t => t.id === taskId)
      if (task) {
        task.order = index
      }
    })
  }

  const addGroup = (name, color = '#409EFF') => {
    const newGroup = {
      id: generateId(),
      name,
      color,
      createdAt: new Date().toISOString()
    }
    groups.value.push(newGroup)
    return newGroup
  }

  const editGroup = (id, data) => {
    const index = groups.value.findIndex(g => g.id === id)
    if (index !== -1) {
      groups.value[index] = { ...groups.value[index], ...data }
    }
  }

  const removeGroup = (id) => {
    if (id === 'default') return
    groups.value = groups.value.filter(g => g.id !== id)
    taskList.value.forEach(task => {
      if (task.groupId === id) {
        task.groupId = 'default'
      }
    })
  }

  const setSelectedGroup = (groupId) => {
    selectedGroupId.value = groupId
  }

  const setFilterType = (type) => {
    filterType.value = type
  }

  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  const setDateRange = (range) => {
    dateRange.value = range
  }

  const clearSearch = () => {
    searchKeyword.value = ''
    dateRange.value = null
  }

  const exportToJSON = () => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      groups: groups.value,
      tasks: taskList.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importFromJSON = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.groups && Array.isArray(data.groups)) {
            const defaultGroup = data.groups.find(g => g.id === 'default')
            if (!defaultGroup) {
              data.groups.unshift({ id: 'default', name: '默认清单', color: '#409EFF', createdAt: new Date().toISOString() })
            }
            groups.value = data.groups
          }
          if (data.tasks && Array.isArray(data.tasks)) {
            taskList.value = data.tasks
          }
          resolve()
        } catch (error) {
          reject(new Error('JSON 格式错误'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  const createBackup = () => {
    const backups = loadFromStorage(BACKUP_STORAGE_KEY, [])
    const backup = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      groups: JSON.parse(JSON.stringify(groups.value)),
      tasks: JSON.parse(JSON.stringify(taskList.value))
    }
    backups.unshift(backup)
    if (backups.length > 10) {
      backups.splice(10)
    }
    saveToStorage(BACKUP_STORAGE_KEY, backups)
    return backup
  }

  const getBackups = () => {
    return loadFromStorage(BACKUP_STORAGE_KEY, [])
  }

  const restoreFromBackup = (backupId) => {
    const backups = loadFromStorage(BACKUP_STORAGE_KEY, [])
    const backup = backups.find(b => b.id === backupId)
    if (backup) {
      groups.value = backup.groups
      taskList.value = backup.tasks
      return true
    }
    return false
  }

  const deleteBackup = (backupId) => {
    const backups = loadFromStorage(BACKUP_STORAGE_KEY, [])
    const filtered = backups.filter(b => b.id !== backupId)
    saveToStorage(BACKUP_STORAGE_KEY, filtered)
  }

  const generateMockData = (count = 50) => {
    const mockTasks = []
    const titles = [
      '完成项目需求文档编写',
      '设计数据库表结构',
      '开发用户登录模块',
      '编写单元测试用例',
      '修复生产环境Bug',
      '优化首页加载性能',
      '代码评审及反馈',
      '部署测试环境',
      '整理技术文档',
      '参加项目周会',
      '设计API接口规范',
      '开发任务管理功能',
      '测试分页功能',
      '优化用户体验',
      '安全漏洞修复',
      '数据备份方案',
      '系统监控告警',
      '日志分析排查',
      '性能压测报告',
      '技术方案评审'
    ]
    const descriptions = [
      '',
      '需要详细分析需求并与产品经理确认',
      '参考现有设计规范，保持一致性',
      '注意边界条件和异常处理',
      '完成后提交测试人员验收',
      '预计耗时约2个工作日',
      '需要与后端联调接口',
      '高优先级，本周内完成'
    ]
    const groupIds = groups.value.map(g => g.id)

    for (let i = 0; i < count; i++) {
      const title = titles[i % titles.length]
      const description = descriptions[Math.floor(Math.random() * descriptions.length)]
      const daysAgo = Math.floor(Math.random() * 30)
      const baseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      const completed = Math.random() > 0.6
      const groupId = groupIds[Math.floor(Math.random() * groupIds.length)]

      mockTasks.unshift({
        id: generateId(),
        title: `${title} ${i + 1}`,
        description,
        completed,
        groupId,
        order: i,
        createdAt: formatDate(baseDate),
        updatedAt: formatDate(baseDate)
      })
    }

    taskList.value = mockTasks
    return mockTasks
  }

  const clearAllTasks = () => {
    taskList.value = []
  }

  const clearCompletedTasks = () => {
    loading.value = true
    return new Promise((resolve) => {
      setTimeout(() => {
        const completedCount = taskList.value.filter(task => task.completed).length
        taskList.value = taskList.value.filter(task => !task.completed)
        loading.value = false
        resolve(completedCount)
      }, 200)
    })
  }

  return {
    taskList,
    groups,
    filteredTasks,
    loading,
    filterType,
    searchKeyword,
    dateRange,
    selectedGroupId,
    totalCount,
    completedCount,
    pendingCount,
    completionRate,
    groupStats,
    getWeeklyStats,
    fetchTasks,
    addTask,
    editTask,
    removeTask,
    toggleTaskStatus,
    moveTask,
    reorderTasks,
    addGroup,
    editGroup,
    removeGroup,
    setSelectedGroup,
    setFilterType,
    setSearchKeyword,
    setDateRange,
    clearSearch,
    exportToJSON,
    importFromJSON,
    createBackup,
    getBackups,
    restoreFromBackup,
    deleteBackup,
    generateMockData,
    clearAllTasks,
    clearCompletedTasks
  }
})
