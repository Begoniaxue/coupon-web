import { createRouter, createWebHistory } from 'vue-router'

const routes = [
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
    path: '/gis',
    name: 'GisDashboard',
    component: () => import('@/views/GisDashboard.vue'),
    meta: { title: 'GIS地理信息系统' }
  },
  {
    path: '/gis/query',
    name: 'GisQuery',
    component: () => import('@/views/GisQuery.vue'),
    meta: { title: '地理信息查询' }
  },
  {
    path: '/gis/analysis',
    name: 'GisAnalysis',
    component: () => import('@/views/GisAnalysis.vue'),
    meta: { title: '空间分析' }
  },
  {
    path: '/gis/route',
    name: 'GisRoute',
    component: () => import('@/views/GisRoute.vue'),
    meta: { title: '路径规划' }
  },
  {
    path: '/gis/3d',
    name: 'Gis3D',
    component: () => import('@/views/Gis3D.vue'),
    meta: { title: '三维可视化' }
  },
  {
    path: '/test-map',
    name: 'TestMap',
    component: () => import('@/views/TestMap.vue'),
    meta: { title: '地图测试' }
  },
  {
    path: '/budget',
    name: 'BudgetEdit',
    component: () => import('@/views/BudgetEdit.vue'),
    meta: { title: '预算编辑' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '卡券管理平台'
  next()
})

export default router
