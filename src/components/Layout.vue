<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed">国有资产管理系统</span>
        <span v-else>国资</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataBoard /></el-icon>
          <template #title>数据驾驶舱</template>
        </el-menu-item>
        <el-menu-item index="/asset-ledger">
          <el-icon><Files /></el-icon>
          <template #title>资产台账管理</template>
        </el-menu-item>
        <el-menu-item index="/lease-contract">
          <el-icon><House /></el-icon>
          <template #title>租赁与合同管理</template>
        </el-menu-item>
        <el-menu-item index="/finance-management">
          <el-icon><Wallet /></el-icon>
          <template #title>财务收费管理</template>
        </el-menu-item>
        <el-menu-item index="/inspection-maintenance">
          <el-icon><Tools /></el-icon>
          <template #title>巡检维修管理</template>
        </el-menu-item>
        <el-menu-item index="/data-report">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据报表</template>
        </el-menu-item>
        <el-menu-item index="/asset-map">
          <el-icon><MapLocation /></el-icon>
          <template #title>资产地图</template>
        </el-menu-item>
        <el-sub-menu index="fixed-asset">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>固定资产管理</span>
          </template>
          <el-menu-item index="/fixed-asset-management">
            <el-icon><List /></el-icon>
            <template #title>资产管理</template>
          </el-menu-item>
          <el-menu-item index="/fixed-asset-reports">
            <el-icon><PieChart /></el-icon>
            <template #title>资产报表</template>
          </el-menu-item>
          <el-menu-item index="/fixed-asset-settings">
            <el-icon><Setting /></el-icon>
            <template #title>基础设置</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container class="main-area">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-icon><User /></el-icon>
              管理员
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../store/app'
import {
  DataBoard, Files, House, Wallet,
  Tools, DataAnalysis, MapLocation, Fold, Expand, User,
  Box, List, PieChart, Setting
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
</script>

<style scoped>
.layout-container {
  height: 100vh;
  height: 100dvh;
}

.sidebar {
  background: var(--c-primary-dark);
  transition: width 0.3s;
  overflow-x: hidden;
  overflow-y: auto;
  flex-shrink: 0;
}

.main-area {
  overflow: hidden;
  min-width: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-menu {
  border-right: none;
  background: var(--c-primary-dark);
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background: var(--c-primary);
}

.sidebar-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu :deep(.el-sub-menu__title:hover) {
  color: #fff;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  background: #000c17;
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu .el-menu-item.is-active) {
  background: var(--c-primary);
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.main-content {
  background: var(--bg-page);
  padding: 20px;
}
</style>
