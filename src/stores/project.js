import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getProjectList,
  getProjectDetail,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getAllProjects
} from '@/api/project'

export const useProjectStore = defineStore('project', () => {
  const projectList = ref([])
  const currentProject = ref(null)
  const allProjects = ref([])
  const total = ref(0)
  const loading = ref(false)

  const statusMap = {
    0: { label: '停用', value: 0, type: 'info' },
    1: { label: '启用', value: 1, type: 'success' }
  }

  const getStatusInfo = (status) => statusMap[status] || statusMap[0]

  const fetchProjectList = async (params = {}) => {
    loading.value = true
    try {
      const res = await getProjectList({
        page: 1,
        pageSize: 10,
        ...params
      })
      projectList.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  const fetchProjectDetail = async (id) => {
    loading.value = true
    try {
      const res = await getProjectDetail(id)
      currentProject.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const addProject = async (data) => {
    const res = await createProject(data)
    return res
  }

  const editProject = async (id, data) => {
    const res = await updateProject(id, data)
    return res
  }

  const removeProject = async (id) => {
    const res = await deleteProject(id)
    return res
  }

  const toggleStatus = async (id, status) => {
    const res = await updateProjectStatus(id, status)
    const item = projectList.value.find(item => item.id === id)
    if (item) {
      item.status = status
    }
    return res
  }

  const fetchAllProjects = async () => {
    try {
      const res = await getAllProjects()
      allProjects.value = res.data.list
      return res.data.list
    } catch (error) {
      allProjects.value = []
      return []
    }
  }

  return {
    projectList,
    currentProject,
    allProjects,
    total,
    loading,
    statusMap,
    getStatusInfo,
    fetchProjectList,
    fetchProjectDetail,
    addProject,
    editProject,
    removeProject,
    toggleStatus,
    fetchAllProjects
  }
})
