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
