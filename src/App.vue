<template>
  <el-container class="app-container">
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
            <el-icon><Money /></el-icon>
            <span>预算编辑</span>
          </el-menu-item>
          <el-sub-menu index="gis">
            <template #title>
              <el-icon><Location /></el-icon>
              <span>GIS地理信息</span>
            </template>
            <el-menu-item index="/gis">
              <el-icon><DataAnalysis /></el-icon>
              <span>GIS总览</span>
            </el-menu-item>
            <el-menu-item index="/gis/query">
              <el-icon><Search /></el-icon>
              <span>地理信息查询</span>
            </el-menu-item>
            <el-menu-item index="/gis/analysis">
              <el-icon><TrendCharts /></el-icon>
              <span>空间分析</span>
            </el-menu-item>
            <el-menu-item index="/gis/route">
              <el-icon><Guide /></el-icon>
              <span>路径规划</span>
            </el-menu-item>
            <el-menu-item index="/gis/3d">
              <el-icon><View /></el-icon>
              <span>三维可视化</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
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
  height: 100%;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #304156;
  color: #fff;
  padding: 0 20px;
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
}

.el-menu {
  border-right: none;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>
