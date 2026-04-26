import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from '@/views/ProjectList.vue'
import { ElMessageBox, ElMessage } from 'element-plus'

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  },
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn()
  }
}))

const mockProjects = [
  {
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
  },
  {
    id: 2,
    name: '银泰中心',
    totalArea: 80000,
    city: '北京',
    district: '朝阳区',
    address: '北京市朝阳区建国门外大街2号',
    floorCount: 8,
    buildingCount: 2,
    resourceCount: 150,
    status: 0,
    createTime: '2024-02-01 14:30:00'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/project', name: 'ProjectList', component: { template: '<div>ProjectList</div>' } },
    { path: '/project/create', name: 'ProjectCreate', component: { template: '<div>ProjectCreate</div>' } },
    { path: '/project/edit/:id', name: 'ProjectEdit', component: { template: '<div>ProjectEdit</div>' } },
    { path: '/project/detail/:id', name: 'ProjectDetail', component: { template: '<div>ProjectDetail</div>' } }
  ]
})

describe('ProjectList.vue', () => {
  let wrapper
  let mockRouterPush

  beforeEach(() => {
    vi.clearAllMocks()
    mockRouterPush = vi.spyOn(router, 'push')

    wrapper = mount(ProjectList, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              project: {
                projectList: mockProjects,
                total: 2,
                loading: false,
                statusMap: {
                  0: { label: '停用', value: 0, type: 'info' },
                  1: { label: '启用', value: 1, type: 'success' }
                }
              }
            }
          }),
          router
        ]
      }
    })
  })

  describe('component rendering', () => {
    it('should render the component correctly', () => {
      expect(wrapper.find('.project-list').exists()).toBe(true)
      expect(wrapper.find('.search-card').exists()).toBe(true)
      expect(wrapper.find('.table-card').exists()).toBe(true)
    })

    it('should render search form with all fields', () => {
      const searchInputs = wrapper.findAll('input')
      expect(searchInputs.length).toBeGreaterThan(0)
      expect(wrapper.find('.search-form').exists()).toBe(true)
    })

    it('should render table with project data', () => {
      const table = wrapper.find('table')
      expect(table.exists()).toBe(true)
    })

    it('should render pagination', () => {
      const pagination = wrapper.find('.pagination')
      expect(pagination.exists()).toBe(true)
    })
  })

  describe('search functionality', () => {
    it('should have correct initial search form values', () => {
      const vm = wrapper.vm
      expect(vm.searchForm).toEqual({
        name: '',
        city: '',
        status: ''
      })
    })

    it('should reset search form to initial values', async () => {
      const vm = wrapper.vm
      vm.searchForm = {
        name: '万达',
        city: '北京',
        status: 1
      }
      vm.pagination = { page: 2, pageSize: 20 }

      vm.handleReset()

      expect(vm.searchForm).toEqual({
        name: '',
        city: '',
        status: ''
      })
      expect(vm.pagination.page).toBe(1)
    })
  })

  describe('pagination functionality', () => {
    it('should have correct initial pagination values', () => {
      const vm = wrapper.vm
      expect(vm.pagination).toEqual({
        page: 1,
        pageSize: 10
      })
    })

    it('should update pageSize and fetch data on size change', () => {
      const vm = wrapper.vm
      vm.fetchData = vi.fn()

      vm.handleSizeChange(20)

      expect(vm.pagination.pageSize).toBe(20)
      expect(vm.fetchData).toHaveBeenCalled()
    })

    it('should update page and fetch data on page change', () => {
      const vm = wrapper.vm
      vm.fetchData = vi.fn()

      vm.handleCurrentChange(3)

      expect(vm.pagination.page).toBe(3)
      expect(vm.fetchData).toHaveBeenCalled()
    })
  })

  describe('navigation functionality', () => {
    it('should navigate to create page on handleCreate', () => {
      const vm = wrapper.vm
      vm.handleCreate()
      expect(mockRouterPush).toHaveBeenCalledWith('/project/create')
    })

    it('should navigate to detail page on handleDetail', () => {
      const vm = wrapper.vm
      const mockProject = { id: 1, name: '万达广场' }
      vm.handleDetail(mockProject)
      expect(mockRouterPush).toHaveBeenCalledWith('/project/detail/1')
    })

    it('should navigate to edit page on handleEdit', () => {
      const vm = wrapper.vm
      const mockProject = { id: 2, name: '银泰中心' }
      vm.handleEdit(mockProject)
      expect(mockRouterPush).toHaveBeenCalledWith('/project/edit/2')
    })
  })

  describe('delete functionality', () => {
    it('should call ElMessageBox.confirm on handleDelete', () => {
      const vm = wrapper.vm
      const mockProject = { id: 1, name: '万达广场' }

      vm.handleDelete(mockProject)

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要删除项目"万达广场"吗？',
        '提示',
        expect.objectContaining({
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      )
    })

    it('should handle confirm callback when delete is confirmed', async () => {
      const vm = wrapper.vm
      const mockProject = { id: 1, name: '万达广场' }
      vm.fetchData = vi.fn()

      ElMessageBox.confirm.mockResolvedValue()
      const mockStore = wrapper.vm.projectStore
      mockStore.removeProject = vi.fn().mockResolvedValue()

      await vm.handleDelete(mockProject)

      expect(mockStore.removeProject).toHaveBeenCalledWith(1)
      expect(ElMessage.success).toHaveBeenCalledWith('删除成功')
      expect(vm.fetchData).toHaveBeenCalled()
    })

    it('should handle cancel gracefully', async () => {
      const vm = wrapper.vm
      const mockProject = { id: 1, name: '万达广场' }
      vm.fetchData = vi.fn()

      ElMessageBox.confirm.mockRejectedValue()

      await vm.handleDelete(mockProject)

      expect(vm.fetchData).not.toHaveBeenCalled()
    })
  })

  describe('toggle status functionality', () => {
    it('should show confirm for enabling a disabled project', () => {
      const vm = wrapper.vm
      const disabledProject = { id: 2, name: '银泰中心', status: 0 }

      vm.handleToggleStatus(disabledProject)

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要启用项目"银泰中心"吗？',
        '提示',
        expect.objectContaining({ type: 'warning' })
      )
    })

    it('should show confirm for disabling an enabled project', () => {
      const vm = wrapper.vm
      const enabledProject = { id: 1, name: '万达广场', status: 1 }

      vm.handleToggleStatus(enabledProject)

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要停用项目"万达广场"吗？',
        '提示',
        expect.objectContaining({ type: 'warning' })
      )
    })

    it('should call toggleStatus and show success message when confirmed', async () => {
      const vm = wrapper.vm
      const mockProject = { id: 1, name: '万达广场', status: 1 }
      vm.fetchData = vi.fn()

      ElMessageBox.confirm.mockResolvedValue()
      const mockStore = wrapper.vm.projectStore
      mockStore.toggleStatus = vi.fn().mockResolvedValue({ message: '停用成功' })

      await vm.handleToggleStatus(mockProject)

      expect(mockStore.toggleStatus).toHaveBeenCalledWith(1, 0)
      expect(ElMessage.success).toHaveBeenCalledWith('停用成功')
      expect(vm.fetchData).toHaveBeenCalled()
    })
  })

  describe('fetchData integration', () => {
    it('should call store fetchProjectList with correct params', () => {
      const vm = wrapper.vm
      const mockStore = wrapper.vm.projectStore
      mockStore.fetchProjectList = vi.fn()

      vm.searchForm = { name: '万达', city: '北京', status: 1 }
      vm.pagination = { page: 2, pageSize: 20 }

      vm.fetchData()

      expect(mockStore.fetchProjectList).toHaveBeenCalledWith({
        name: '万达',
        city: '北京',
        status: 1,
        page: 2,
        pageSize: 20
      })
    })
  })
})
