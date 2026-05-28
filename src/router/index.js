import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    name: 'CouponList',
    component: () => import('@/views/CouponList.vue'),
    meta: { title: '卡券列表' }
  },
  {
    path: '/create',
    name: 'CouponCreate',
    component: () => import('@/views/CouponForm.vue'),
    meta: { title: '创建卡券' }
  },
  {
    path: '/edit/:id',
    name: 'CouponEdit',
    component: () => import('@/views/CouponForm.vue'),
    meta: { title: '编辑卡券' }
  },
  {
    path: '/detail/:id',
    name: 'CouponDetail',
    component: () => import('@/views/CouponDetail.vue'),
    meta: { title: '卡券详情' }
  },
  {
    path: '/flash-sale',
    name: 'FlashSaleList',
    component: () => import('@/views/FlashSaleList.vue'),
    meta: { title: '秒杀活动列表' }
  },
  {
    path: '/flash-sale/create',
    name: 'FlashSaleCreate',
    component: () => import('@/views/FlashSaleForm.vue'),
    meta: { title: '创建秒杀活动' }
  },
  {
    path: '/flash-sale/edit/:id',
    name: 'FlashSaleEdit',
    component: () => import('@/views/FlashSaleForm.vue'),
    meta: { title: '编辑秒杀活动' }
  },
  {
    path: '/flash-sale/detail/:id',
    name: 'FlashSaleDetail',
    component: () => import('@/views/FlashSaleDetail.vue'),
    meta: { title: '秒杀活动详情' }
  },
  {
    path: '/project',
    name: 'ProjectList',
    component: () => import('@/views/ProjectList.vue'),
    meta: { title: '项目列表' }
  },
  {
    path: '/project/create',
    name: 'ProjectCreate',
    component: () => import('@/views/ProjectForm.vue'),
    meta: { title: '创建项目' }
  },
  {
    path: '/project/edit/:id',
    name: 'ProjectEdit',
    component: () => import('@/views/ProjectForm.vue'),
    meta: { title: '编辑项目' }
  },
  {
    path: '/project/detail/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/ProjectDetail.vue'),
    meta: { title: '项目详情' }
  },
  {
    path: '/budget',
    name: 'BudgetEdit',
    component: () => import('@/views/BudgetEdit.vue'),
    meta: { title: '预算编辑' }
  },
  {
    path: '/schema-form-demo',
    name: 'SchemaFormDemo',
    component: () => import('@/views/SchemaFormDemo.vue'),
    meta: { title: 'Schema 表单演示' }
  },
  {
    path: '/spreadsheet',
    name: 'Spreadsheet',
    component: () => import('@/spreadsheet/components/SpreadsheetDemo.vue'),
    meta: { title: '类 Excel 在线表格' }
  },
  {
    path: '/dashboard',
    name: 'DataDashboard',
    component: () => import('@/views/DataDashboard.vue'),
    meta: { title: '数据可视化大屏' }
  },
  {
    path: '/task',
    name: 'TaskList',
    component: () => import('@/views/TaskList.vue'),
    meta: { title: '任务管理' }
  },
  {
    path: '/currency-converter',
    name: 'CurrencyConverter',
    component: () => import('@/views/CurrencyConverter.vue'),
    meta: { title: '汇率换算工具' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '卡券管理平台'
  
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
