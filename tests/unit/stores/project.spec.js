import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectStore } from '@/stores/project'
import * as projectApi from '@/api/project'

vi.mock('@/api/project', () => ({
  getProjectList: vi.fn(),
  getProjectDetail: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProjectStatus: vi.fn(),
  getAllProjects: vi.fn()
}))

const mockProjectData = {
  id: 1,
  name: '万达广场',
  totalArea: 150000,
  city: '北京',
  district: '朝阳区',
  address: '北京市朝阳区建国路88号',
  floorCount: 5,
  buildingCount: 3,
  resourceCount: 200,
  status: 1,
  createTime: '2024-01-15 10:00:00'
}

const mockProjectListResponse = {
  code: 200,
  data: {
    list: [mockProjectData],
    total: 1,
    page: 1,
    pageSize: 10
  },
  message: 'success'
}

const mockProjectDetailResponse = {
  code: 200,
  data: mockProjectData,
  message: 'success'
}

const mockAllProjectsResponse = {
  code: 200,
  data: {
    list: [mockProjectData]
  },
  message: 'success'
}

const mockSuccessResponse = {
  code: 200,
  message: '操作成功'
}

describe('project store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useProjectStore()
      expect(store.projectList).toEqual([])
      expect(store.currentProject).toBeNull()
      expect(store.allProjects).toEqual([])
      expect(store.total).toBe(0)
      expect(store.loading).toBe(false)
    })

    it('should have correct statusMap', () => {
      const store = useProjectStore()
      expect(store.statusMap).toEqual({
        0: { label: '停用', value: 0, type: 'info' },
        1: { label: '启用', value: 1, type: 'success' }
      })
    })

    it('should return correct status info via getStatusInfo', () => {
      const store = useProjectStore()
      expect(store.getStatusInfo(1)).toEqual({ label: '启用', value: 1, type: 'success' })
      expect(store.getStatusInfo(0)).toEqual({ label: '停用', value: 0, type: 'info' })
      expect(store.getStatusInfo(999)).toEqual({ label: '停用', value: 0, type: 'info' })
    })
  })

  describe('fetchProjectList', () => {
    it('should fetch project list and update state', async () => {
      projectApi.getProjectList.mockResolvedValue(mockProjectListResponse)
      const store = useProjectStore()

      expect(store.loading).toBe(false)
      const promise = store.fetchProjectList()
      expect(store.loading).toBe(true)

      await promise

      expect(projectApi.getProjectList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10
      })
      expect(store.projectList).toEqual(mockProjectListResponse.data.list)
      expect(store.total).toBe(1)
      expect(store.loading).toBe(false)
    })

    it('should pass custom params to API', async () => {
      projectApi.getProjectList.mockResolvedValue(mockProjectListResponse)
      const store = useProjectStore()

      await store.fetchProjectList({ name: '万达', city: '北京', status: 1 })

      expect(projectApi.getProjectList).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        name: '万达',
        city: '北京',
        status: 1
      })
    })

    it('should set loading to false even on API error', async () => {
      const mockError = new Error('API Error')
      projectApi.getProjectList.mockRejectedValue(mockError)
      const store = useProjectStore()

      await expect(store.fetchProjectList()).rejects.toThrow(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchProjectDetail', () => {
    it('should fetch project detail and update currentProject', async () => {
      projectApi.getProjectDetail.mockResolvedValue(mockProjectDetailResponse)
      const store = useProjectStore()

      expect(store.loading).toBe(false)
      const promise = store.fetchProjectDetail(1)
      expect(store.loading).toBe(true)

      const result = await promise

      expect(projectApi.getProjectDetail).toHaveBeenCalledWith(1)
      expect(store.currentProject).toEqual(mockProjectData)
      expect(result).toEqual(mockProjectData)
      expect(store.loading).toBe(false)
    })

    it('should set loading to false even on API error', async () => {
      const mockError = new Error('Project not found')
      projectApi.getProjectDetail.mockRejectedValue(mockError)
      const store = useProjectStore()

      await expect(store.fetchProjectDetail(999)).rejects.toThrow(mockError)
      expect(store.loading).toBe(false)
    })
  })

  describe('addProject', () => {
    it('should call createProject API and return response', async () => {
      const newProjectData = {
        name: '新的项目',
        city: '上海',
        totalArea: 100000
      }
      const mockCreateResponse = {
        code: 200,
        data: { id: 5 },
        message: '创建成功'
      }
      projectApi.createProject.mockResolvedValue(mockCreateResponse)
      const store = useProjectStore()

      const result = await store.addProject(newProjectData)

      expect(projectApi.createProject).toHaveBeenCalledWith(newProjectData)
      expect(result).toEqual(mockCreateResponse)
    })
  })

  describe('editProject', () => {
    it('should call updateProject API and return response', async () => {
      const updateData = {
        name: '更新后的项目名称',
        totalArea: 200000
      }
      projectApi.updateProject.mockResolvedValue(mockSuccessResponse)
      const store = useProjectStore()

      const result = await store.editProject(1, updateData)

      expect(projectApi.updateProject).toHaveBeenCalledWith(1, updateData)
      expect(result).toEqual(mockSuccessResponse)
    })
  })

  describe('removeProject', () => {
    it('should call deleteProject API and return response', async () => {
      projectApi.deleteProject.mockResolvedValue(mockSuccessResponse)
      const store = useProjectStore()

      const result = await store.removeProject(1)

      expect(projectApi.deleteProject).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockSuccessResponse)
    })
  })

  describe('toggleStatus', () => {
    it('should call updateProjectStatus and update local list', async () => {
      const store = useProjectStore()
      store.projectList = [
        { id: 1, status: 1, name: '项目1' },
        { id: 2, status: 0, name: '项目2' }
      ]

      projectApi.updateProjectStatus.mockResolvedValue({
        code: 200,
        message: '停用成功'
      })

      const result = await store.toggleStatus(1, 0)

      expect(projectApi.updateProjectStatus).toHaveBeenCalledWith(1, 0)
      expect(store.projectList[0].status).toBe(0)
      expect(store.projectList[1].status).toBe(0)
      expect(result).toEqual({ code: 200, message: '停用成功' })
    })

    it('should handle non-existent projects gracefully', async () => {
      const store = useProjectStore()
      store.projectList = [
        { id: 1, status: 1, name: '项目1' }
      ]

      projectApi.updateProjectStatus.mockResolvedValue(mockSuccessResponse)

      await store.toggleStatus(999, 0)

      expect(store.projectList[0].status).toBe(1)
    })
  })

  describe('fetchAllProjects', () => {
    it('should fetch all active projects and update allProjects', async () => {
      projectApi.getAllProjects.mockResolvedValue(mockAllProjectsResponse)
      const store = useProjectStore()

      const result = await store.fetchAllProjects()

      expect(projectApi.getAllProjects).toHaveBeenCalled()
      expect(store.allProjects).toEqual(mockAllProjectsResponse.data.list)
      expect(result).toEqual(mockAllProjectsResponse.data.list)
    })

    it('should return empty array and clear allProjects on error', async () => {
      const mockError = new Error('API Error')
      projectApi.getAllProjects.mockRejectedValue(mockError)
      const store = useProjectStore()

      const result = await store.fetchAllProjects()

      expect(store.allProjects).toEqual([])
      expect(result).toEqual([])
    })
  })
})
