import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createWebHistory } from 'vue-router'
import ProjectForm from '@/views/ProjectForm.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  },
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockProjectDetail = {
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/project', name: 'ProjectList', component: { template: '<div>ProjectList</div>' } },
    { path: '/project/create', name: 'ProjectCreate', component: ProjectForm },
    { path: '/project/edit/:id', name: 'ProjectEdit', component: ProjectForm }
  ]
})

describe('ProjectForm.vue', () => {
  let wrapper
  let mockRouterPush

  const createWrapper = (routeName = 'ProjectCreate', routeParams = {}) => {
    const routes = [
      { path: '/project', name: 'ProjectList', component: { template: '<div>ProjectList</div>' } },
      { path: '/project/create', name: 'ProjectCreate', component: ProjectForm },
      { path: '/project/edit/:id', name: 'ProjectEdit', component: ProjectForm }
    ]

    const testRouter = createRouter({
      history: createWebHistory(),
      routes
    })

    mockRouterPush = vi.spyOn(testRouter, 'push')

    return mount(ProjectForm, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              project: {
                currentProject: null
              }
            }
          }),
          testRouter
        ],
        mocks: {
          $route: {
            name: routeName,
            params: routeParams
          }
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should render the component correctly in create mode', () => {
      wrapper = createWrapper('ProjectCreate')
      expect(wrapper.find('.project-form').exists()).toBe(true)
      expect(wrapper.find('.card-header').text()).toContain('创建项目')
    })

    it('should have correct initial form data in create mode', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm

      expect(vm.isEdit).toBe(false)
      expect(vm.formData).toEqual({
        name: '',
        totalArea: 0,
        city: '',
        district: '',
        address: '',
        floorCount: 1,
        buildingCount: 1,
        resourceCount: 0,
        status: 1
      })
      expect(vm.submitLoading).toBe(false)
    })

    it('should have all validation rules defined', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm

      const requiredFields = [
        'name', 'totalArea', 'city', 'district', 'address',
        'floorCount', 'buildingCount', 'resourceCount'
      ]

      requiredFields.forEach(field => {
        expect(vm.rules[field]).toBeDefined()
        const hasRequired = vm.rules[field].some(rule => rule.required)
        expect(hasRequired).toBe(true)
      })
    })
  })

  describe('edit mode', () => {
    it('should correctly detect edit mode', async () => {
      wrapper = createWrapper('ProjectEdit', { id: '1' })
      const vm = wrapper.vm

      expect(vm.isEdit).toBe(true)
    })

    it('should display "编辑项目" in header when in edit mode', () => {
      wrapper = createWrapper('ProjectEdit', { id: '1' })
      expect(wrapper.find('.card-header').text()).toContain('编辑项目')
    })

    it('should load project data in edit mode', async () => {
      wrapper = createWrapper('ProjectEdit', { id: '1' })
      const vm = wrapper.vm
      const mockStore = vm.projectStore
      mockStore.fetchProjectDetail = vi.fn().mockResolvedValue(mockProjectDetail)

      await vm.loadProjectData()

      expect(mockStore.fetchProjectDetail).toHaveBeenCalledWith('1')
      expect(vm.formData.name).toBe('万达广场')
      expect(vm.formData.totalArea).toBe(150000)
      expect(vm.formData.city).toBe('北京')
      expect(vm.formData.district).toBe('朝阳区')
      expect(vm.formData.address).toBe('北京市朝阳区建国路88号')
      expect(vm.formData.floorCount).toBe(5)
      expect(vm.formData.buildingCount).toBe(3)
      expect(vm.formData.resourceCount).toBe(200)
      expect(vm.formData.status).toBe(1)
    })

    it('should handle error when loading project data fails', async () => {
      wrapper = createWrapper('ProjectEdit', { id: '999' })
      const vm = wrapper.vm
      const mockStore = vm.projectStore
      const mockError = new Error('项目不存在')
      mockStore.fetchProjectDetail = vi.fn().mockRejectedValue(mockError)

      await vm.loadProjectData()

      expect(ElMessage.error).toHaveBeenCalledWith('加载项目信息失败')
    })
  })

  describe('navigation functionality', () => {
    it('should navigate back to project list on handleBack', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      vm.handleBack()
      expect(mockRouterPush).toHaveBeenCalledWith('/project')
    })
  })

  describe('form reset functionality', () => {
    it('should reset form data to initial values', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm

      vm.formData.name = '测试项目'
      vm.formData.totalArea = 100000
      vm.formData.city = '上海'
      vm.formData.floorCount = 10
      vm.formData.buildingCount = 5
      vm.formData.resourceCount = 100

      vm.formRef = {
        resetFields: vi.fn()
      }

      vm.handleReset()

      expect(vm.formRef.resetFields).toHaveBeenCalled()
      expect(vm.formData.totalArea).toBe(0)
      expect(vm.formData.floorCount).toBe(1)
      expect(vm.formData.buildingCount).toBe(1)
      expect(vm.formData.resourceCount).toBe(0)
      expect(vm.formData.status).toBe(1)
    })
  })

  describe('submit functionality', () => {
    it('should show confirm dialog before submitting in create mode', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm

      vm.formRef = {
        validate: vi.fn((callback) => callback(true))
      }

      vm.handleSubmit()

      expect(vm.formRef.validate).toHaveBeenCalled()
      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要创建项目吗？',
        '提示',
        expect.objectContaining({
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
      )
    })

    it('should show confirm dialog before submitting in edit mode', () => {
      wrapper = createWrapper('ProjectEdit', { id: '1' })
      const vm = wrapper.vm

      vm.formRef = {
        validate: vi.fn((callback) => callback(true))
      }

      vm.handleSubmit()

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '确定要修改项目信息吗？',
        '提示',
        expect.objectContaining({ type: 'warning' })
      )
    })

    it('should call addProject and navigate on successful create', async () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      const mockStore = vm.projectStore

      vm.formData.name = '新的项目'
      vm.formData.totalArea = 100000
      vm.formData.city = '北京'
      vm.formData.district = '朝阳区'
      vm.formData.address = '测试地址'
      vm.formData.floorCount = 5
      vm.formData.buildingCount = 2
      vm.formData.resourceCount = 100

      mockStore.addProject = vi.fn().mockResolvedValue({ code: 200 })

      await vm.submitForm()

      expect(mockStore.addProject).toHaveBeenCalledWith({
        name: '新的项目',
        totalArea: 100000,
        city: '北京',
        district: '朝阳区',
        address: '测试地址',
        floorCount: 5,
        buildingCount: 2,
        resourceCount: 100,
        status: 1
      })
      expect(ElMessage.success).toHaveBeenCalledWith('创建成功')
      expect(mockRouterPush).toHaveBeenCalledWith('/project')
      expect(vm.submitLoading).toBe(false)
    })

    it('should call editProject and navigate on successful edit', async () => {
      wrapper = createWrapper('ProjectEdit', { id: '1' })
      const vm = wrapper.vm
      const mockStore = vm.projectStore

      vm.formData.name = '更新的项目'
      vm.formData.totalArea = 200000

      mockStore.editProject = vi.fn().mockResolvedValue({ code: 200 })

      await vm.submitForm()

      expect(mockStore.editProject).toHaveBeenCalledWith('1', expect.objectContaining({
        name: '更新的项目',
        totalArea: 200000
      }))
      expect(ElMessage.success).toHaveBeenCalledWith('修改成功')
      expect(mockRouterPush).toHaveBeenCalledWith('/project')
    })

    it('should handle submit error and show error message', async () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      const mockStore = vm.projectStore

      const mockError = new Error('提交失败')
      mockStore.addProject = vi.fn().mockRejectedValue(mockError)

      await vm.submitForm()

      expect(ElMessage.error).toHaveBeenCalledWith('提交失败')
      expect(vm.submitLoading).toBe(false)
    })

    it('should handle cancel gracefully', async () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      const mockStore = vm.projectStore

      ElMessageBox.confirm.mockRejectedValue()

      vm.formRef = {
        validate: vi.fn((callback) => callback(true))
      }

      mockStore.addProject = vi.fn()

      vm.handleSubmit()

      await vi.waitFor(() => {
        expect(mockStore.addProject).not.toHaveBeenCalled()
      })
    })
  })

  describe('form validation rules', () => {
    it('should have name validation with min and max length', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      const nameRules = vm.rules.name

      expect(nameRules).toContainEqual(expect.objectContaining({
        min: 2,
        max: 100
      }))
    })

    it('should have required validation for all fields', () => {
      wrapper = createWrapper('ProjectCreate')
      const vm = wrapper.vm
      const fields = [
        'name', 'totalArea', 'city', 'district', 'address',
        'floorCount', 'buildingCount', 'resourceCount'
      ]

      fields.forEach(field => {
        const hasRequired = vm.rules[field].some(rule => rule.required)
        expect(hasRequired).toBe(true)
      })
    })
  })
})
