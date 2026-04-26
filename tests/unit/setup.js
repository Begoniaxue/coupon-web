import { config } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { vi } from 'vitest'

const pinia = createPinia()
setActivePinia(pinia)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'CouponList', component: { template: '<div>CouponList</div>' } },
    { path: '/create', name: 'CouponCreate', component: { template: '<div>CouponCreate</div>' } },
    { path: '/edit/:id', name: 'CouponEdit', component: { template: '<div>CouponEdit</div>' } },
    { path: '/detail/:id', name: 'CouponDetail', component: { template: '<div>CouponDetail</div>' } },
    { path: '/flash-sale', name: 'FlashSaleList', component: { template: '<div>FlashSaleList</div>' } },
    { path: '/flash-sale/create', name: 'FlashSaleCreate', component: { template: '<div>FlashSaleCreate</div>' } },
    { path: '/flash-sale/edit/:id', name: 'FlashSaleEdit', component: { template: '<div>FlashSaleEdit</div>' } },
    { path: '/flash-sale/detail/:id', name: 'FlashSaleDetail', component: { template: '<div>FlashSaleDetail</div>' } },
    { path: '/project', name: 'ProjectList', component: { template: '<div>ProjectList</div>' } },
    { path: '/project/create', name: 'ProjectCreate', component: { template: '<div>ProjectCreate</div>' } },
    { path: '/project/edit/:id', name: 'ProjectEdit', component: { template: '<div>ProjectEdit</div>' } },
    { path: '/project/detail/:id', name: 'ProjectDetail', component: { template: '<div>ProjectDetail</div>' } }
  ]
})

config.global.plugins = [ElementPlus, pinia, router]

globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

globalThis.scrollTo = vi.fn()
