<template>
  <el-container class="app-container" v-if="!isDashboardRoute">
    <el-header class="app-header">
      <div class="logo">
        <el-icon><Ticket /></el-icon>
        <span>卡券管理平台</span>
      </div>
      <div class="user-info">
        <el-icon><User /></el-icon>
        <span>管理员</span>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><List /></el-icon>
            <span>卡券列表</span>
          </el-menu-item>
          <el-menu-item index="/create">
            <el-icon><Plus /></el-icon>
            <span>创建卡券</span>
          </el-menu-item>
          <el-menu-item index="/flash-sale">
            <el-icon><Lightning /></el-icon>
            <span>秒杀活动</span>
          </el-menu-item>
          <el-menu-item index="/project">
            <el-icon><OfficeBuilding /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item index="/budget">
            <el-icon><DataAnalysis /></el-icon>
            <span>预算编辑</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>数据大屏</span>
          </el-menu-item>
          <el-menu-item index="/task">
            <el-icon><List /></el-icon>
            <span>任务管理</span>
          </el-menu-item>
          <el-menu-item index="/currency-converter">
            <el-icon><Money /></el-icon>
            <span>汇率换算</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
  <router-view v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DataAnalysis, DataLine, List, Money } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})

const isDashboardRoute = computed(() => {
  return route.path === '/dashboard'
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100vh;
  overflow: hidden;
}

.app-container > .el-container {
  height: calc(100vh - 60px);
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #304156;
  color: #fff;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.logo .el-icon {
  margin-right: 10px;
  font-size: 28px;
}

.user-info {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.user-info .el-icon {
  margin-right: 8px;
}

.app-aside {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.el-menu {
  border-right: none;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
