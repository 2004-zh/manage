<template>
  <el-container class="layout-container theme-gov">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed">长乐区国资中心</span>
        <span v-else>国资</span>
      </div>
      <el-menu :default-active="activeMenu" :collapse="appStore.sidebarCollapsed" router class="sidebar-menu">
        <!-- 首页 -->
        <el-sub-menu index="home-group">
          <template #title><el-icon><HomeFilled /></el-icon><span>首页</span></template>
          <el-menu-item index="/gov/home">工作台</el-menu-item>
          <el-menu-item index="/gov/bigscreen">监管大屏</el-menu-item>
        </el-sub-menu>

        <!-- 资产管理 -->
        <el-sub-menu index="asset-mgmt-group">
          <template #title><el-icon><Files /></el-icon><span>资产管理</span></template>
          <el-menu-item index="/gov/assets">资产穿透查看</el-menu-item>
          <el-menu-item index="/gov/statement">固定资产情况表</el-menu-item>
        </el-sub-menu>

        <!-- 资产地图 -->
        <el-sub-menu index="map-group">
          <template #title><el-icon><MapLocation /></el-icon><span>资产地图</span></template>
          <el-menu-item index="/gov/map">GIS地图</el-menu-item>
        </el-sub-menu>

        <!-- 报表中心 -->
        <el-sub-menu index="report-group">
          <template #title><el-icon><DataAnalysis /></el-icon><span>报表中心</span></template>
          <el-menu-item index="/gov/report">上报数据管理</el-menu-item>
        </el-sub-menu>

        <!-- 预警管理 -->
        <el-sub-menu index="warning-group">
          <template #title><el-icon><Warning /></el-icon><span>预警管理</span></template>
          <el-menu-item index="/gov/warning-tasks">预警任务</el-menu-item>
          <el-menu-item index="/gov/warning-rules">预警规则配置</el-menu-item>
          <el-menu-item index="/gov/risk">风险预警中心</el-menu-item>
        </el-sub-menu>

        <!-- 监管专区 -->
        <el-sub-menu index="supervision-group">
          <template #title><el-icon><Bell /></el-icon><span>监管专区</span></template>
          <el-menu-item index="/gov/supervise">督办管理</el-menu-item>
          <el-menu-item index="/gov/contact">企业联络</el-menu-item>
          <el-menu-item index="/gov/revitalize">盘活目标管理</el-menu-item>
        </el-sub-menu>

        <!-- 系统管理 -->
        <el-sub-menu index="system-group">
          <template #title><el-icon><Setting /></el-icon><span>系统管理</span></template>
          <el-menu-item index="/gov/system/role">用户与权限</el-menu-item>
          <el-menu-item index="/gov/system/log">操作日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="main-area">
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <span class="scope-trigger">
            <el-icon><OfficeBuilding /></el-icon>
            {{ appStore.scope }}
          </span>
        </div>
        <div class="header-right">
          <el-tag class="role-tag" type="danger" effect="dark" size="small">监管端</el-tag>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <span class="avatar">{{ (userStore.user?.name || '管').charAt(0) }}</span>
              {{ userStore.user?.name }}
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <TagsView home="/gov/home" />

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import { useUserStore } from '../store/user'
import TagsView from '../components/TagsView.vue'
import {
  HomeFilled, Files, MapLocation, DataAnalysis, Warning, Bell, Setting,
  Fold, Expand, OfficeBuilding, CaretBottom
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

watch(
  () => route.path,
  () => {
    appStore.addView({
      path: route.path,
      title: route.meta.title || '首页',
      fixed: route.path === '/gov/home'
    })
  },
  { immediate: true }
)

function handleCommand(cmd) {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (cmd === 'switch') {
    router.push('/login?switch=1')
  }
}
</script>
