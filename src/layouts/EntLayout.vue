<template>
  <el-container class="layout-container theme-ent">
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <span v-if="!appStore.sidebarCollapsed">{{ userStore.user?.org || '企业端' }}</span>
        <span v-else>企业</span>
      </div>
      <el-menu :default-active="activeMenu" :collapse="appStore.sidebarCollapsed" router class="sidebar-menu">
        <!-- 首页 -->
        <el-sub-menu index="home-group">
          <template #title><el-icon><HomeFilled /></el-icon><span>首页</span></template>
          <el-menu-item index="/ent/home">工作台</el-menu-item>
          <el-menu-item index="/ent/data-cockpit">经营看板</el-menu-item>
          <el-menu-item index="/ent/asset-dashboard">资产看板</el-menu-item>
          <el-menu-item index="/ent/asset-report">资产报表</el-menu-item>
        </el-sub-menu>

        <!-- 预警管理 -->
        <el-sub-menu index="warning-group">
          <template #title><el-icon><Warning /></el-icon><span>预警管理</span></template>
          <el-menu-item index="/ent/warning-tasks">预警任务</el-menu-item>
          <el-menu-item index="/ent/warning-config">预警配置</el-menu-item>
        </el-sub-menu>

        <!-- 资产管理 -->
        <el-sub-menu index="asset-mgmt-group">
          <template #title><el-icon><Files /></el-icon><span>资产管理</span></template>
          <el-menu-item index="/ent/asset-register">资产登记</el-menu-item>
          <el-menu-item index="/ent/asset-control">资产管控</el-menu-item>
          <el-menu-item index="/ent/project-mgmt">项目管理</el-menu-item>
          <el-menu-item index="/ent/property-rights">产权信息</el-menu-item>
          <el-menu-item index="/ent/credential-info">证件信息</el-menu-item>
          <el-menu-item index="/ent/evaluation-info">评估信息</el-menu-item>
          <el-menu-item index="/ent/asset-transfer">资产调拨</el-menu-item>
          <el-menu-item index="/ent/lease-info">租赁信息</el-menu-item>
          <el-menu-item index="/ent/equity-investment">股权投资</el-menu-item>
          <el-menu-item index="/ent/asset-dispose">资产处置</el-menu-item>
          <el-menu-item index="/ent/mortgage-list">抵押列表</el-menu-item>
        </el-sub-menu>

        <!-- 资产台账 -->
        <el-sub-menu index="ledger-group">
          <template #title><el-icon><Notebook /></el-icon><span>资产台账</span></template>
          <el-menu-item index="/ent/ledger-list">台账列表</el-menu-item>
          <el-menu-item index="/ent/one-asset-one-code">一产一码</el-menu-item>
          <el-menu-item index="/ent/change-records">变更记录</el-menu-item>
        </el-sub-menu>

        <!-- 资产运营 -->
        <el-sub-menu index="operation-group">
          <template #title><el-icon><OfficeBuilding /></el-icon><span>资产运营</span></template>
          <el-menu-item index="/ent/investment-publish">招商发布</el-menu-item>
          <el-menu-item index="/ent/lease-mgmt">租赁管理</el-menu-item>
          <el-menu-item index="/ent/urge-rent">催租管理</el-menu-item>
          <el-menu-item index="/ent/supervise">督办协同</el-menu-item>
          <el-menu-item index="/ent/rent-margin">租金差价</el-menu-item>
        </el-sub-menu>

        <!-- 合同管理 -->
        <el-sub-menu index="contract-group">
          <template #title><el-icon><Tickets /></el-icon><span>合同管理</span></template>
          <el-menu-item index="/ent/contract-approval">合同审批</el-menu-item>
          <el-menu-item index="/ent/intent-ledger">意向书台账</el-menu-item>
          <el-menu-item index="/ent/e-signature">电子签章</el-menu-item>
        </el-sub-menu>

        <!-- 资产收费 -->
        <el-sub-menu index="collection-group">
          <template #title><el-icon><Wallet /></el-icon><span>资产收费</span></template>
          <el-menu-item index="/ent/collection-hall">收费大厅</el-menu-item>
          <el-menu-item index="/ent/user-bills">用户账单</el-menu-item>
          <el-menu-item index="/ent/deposit-return">保证金退还</el-menu-item>
          <el-menu-item index="/ent/business-finance">业财一体化</el-menu-item>
        </el-sub-menu>

        <!-- 发票管理 -->
        <el-sub-menu index="invoice-group">
          <template #title><el-icon><Document /></el-icon><span>发票管理</span></template>
          <el-menu-item index="/ent/invoice-management">发票管理</el-menu-item>
          <el-menu-item index="/ent/tax-management">税费管理</el-menu-item>
        </el-sub-menu>

        <!-- 巡检维修 -->
        <el-sub-menu index="inspection-group">
          <template #title><el-icon><SetUp /></el-icon><span>巡检维修</span></template>
          <el-menu-item index="/ent/inspection-plan">巡查计划</el-menu-item>
          <el-menu-item index="/ent/inspection-records">巡查记录</el-menu-item>
        </el-sub-menu>

        <!-- 资产地图 -->
        <el-sub-menu index="map-group">
          <template #title><el-icon><MapLocation /></el-icon><span>资产地图</span></template>
          <el-menu-item index="/ent/map">GIS地图</el-menu-item>
          <el-menu-item index="/ent/region-division">区域划分</el-menu-item>
        </el-sub-menu>

        <!-- 数据报表 -->
        <el-sub-menu index="report-group">
          <template #title><el-icon><DataAnalysis /></el-icon><span>数据报表</span></template>
          <el-menu-item index="/ent/data-report">数据上报</el-menu-item>
          <el-menu-item index="/ent/report-asset-stats">资产统计报表</el-menu-item>
          <el-menu-item index="/ent/report-operation-stats">经营分析报表</el-menu-item>
          <el-menu-item index="/ent/report-finance-stats">财务报表</el-menu-item>
          <el-menu-item index="/ent/inventory">盘点清查</el-menu-item>
          <el-menu-item index="/ent/report-inventory-stats">盘点报表</el-menu-item>
          <el-menu-item index="/ent/report-repair-stats">维修统计报表</el-menu-item>
        </el-sub-menu>

        <!-- 固定资产 -->
        <el-sub-menu index="fixed-asset-group">
          <template #title><el-icon><Monitor /></el-icon><span>固定资产</span></template>
          <el-menu-item index="/ent/fixed-assets">资产管理</el-menu-item>
          <el-menu-item index="/ent/fixed-asset-reports">资产报表</el-menu-item>
          <el-menu-item index="/ent/fixed-asset-settings">基础设置</el-menu-item>
        </el-sub-menu>

        <!-- 无形资产 -->
        <el-sub-menu index="intangible-asset-group">
          <template #title><el-icon><Collection /></el-icon><span>无形资产</span></template>
          <el-menu-item index="/ent/intangible-assets">无形资产</el-menu-item>
        </el-sub-menu>

        <!-- 组织架构 -->
        <el-sub-menu index="org-group">
          <template #title><el-icon><User /></el-icon><span>组织架构</span></template>
          <el-menu-item index="/ent/system/dept">部门管理</el-menu-item>
          <el-menu-item index="/ent/system/role">角色管理</el-menu-item>
          <el-menu-item index="/ent/system/user">用户管理</el-menu-item>
        </el-sub-menu>

        <!-- 系统管理 -->
        <el-sub-menu index="system-group">
          <template #title><el-icon><Setting /></el-icon><span>系统管理</span></template>
          <el-menu-item index="/ent/system/dict">数据字典</el-menu-item>
          <el-menu-item index="/ent/system/log">操作日志</el-menu-item>
          <el-menu-item index="/ent/system/workflow">流程配置</el-menu-item>
          <el-menu-item index="/ent/system/params">系统参数</el-menu-item>
          <el-menu-item index="/ent/system/message-center">消息中心</el-menu-item>
          <el-menu-item index="/ent/system/msg-template">消息模板</el-menu-item>
          <el-menu-item index="/ent/terminal-manage">终端管理</el-menu-item>
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
          <el-tag class="role-tag" type="primary" effect="dark" size="small">企业端</el-tag>
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

      <TagsView home="/ent/home" />

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
  HomeFilled, Files, Document, Tickets, Wallet, MapLocation,
  DataAnalysis, Monitor, Setting, Warning, SetUp,
  Fold, Expand, OfficeBuilding, CaretBottom,
  Collection, Notebook, User
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
      fixed: route.path === '/ent/home'
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
