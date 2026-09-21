<template>
  <div class="workbench">
    <el-row :gutter="16" class="top-section">
      <el-col :span="16">
        <div class="welcome-banner">
          <div class="welcome-text">
            <h2>欢迎回来, {{ userStore.user?.name || '管理员' }}</h2>
            <p class="welcome-role">{{ currentCompany }}</p>
            <p class="welcome-slogan">资产全生命周期数字化管理</p>
          </div>
          <div class="welcome-stats">
            <div class="stat-item" v-for="s in topStats" :key="s.label">
              <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
          <div class="welcome-avatar">{{ userInitial }}</div>
        </div>

        <el-card class="quick-actions-card" shadow="never">
          <template #header>
            <div class="wb-header">
              <span class="section-title">工作台</span>
              <el-button link type="primary" :icon="Setting" @click="settingsVisible = true">设置</el-button>
            </div>
          </template>
          <div class="grid-4">
            <div class="quick-action-item" v-for="action in quickActions" :key="action.label" @click="navigate(action.path)">
              <div class="action-icon" :style="{ background: action.bg }">
                <el-icon :size="22" color="#fff"><component :is="action.icon" /></el-icon>
              </div>
              <span class="action-label">{{ action.label }}</span>
            </div>
          </div>
          <div class="quick-entries">
            <div v-for="e in visibleQuickEntries" :key="e.label" class="entry-item" @click="navigate(e.path)">
              <div class="entry-icon" :style="{ background: e.bg }">
                <el-icon :size="20" color="#fff"><component :is="e.icon" /></el-icon>
              </div>
              <span class="entry-label">{{ e.label }}</span>
            </div>
          </div>
        </el-card>

        <div class="chart-row chart-row-1-1">
          <el-card class="pq-card" shadow="never">
              <template #header>
                <div class="section-banner pq-banner">
                  <div class="banner-left">
                    <span class="banner-icon">
                      <el-icon :size="18"><Search /></el-icon>
                    </span>
                    <span class="banner-text">盘清 · 资产底数</span>
                    <el-tag size="small" type="info" style="margin-left:8px">{{ currentCompany }}</el-tag>
                  </div>
                  <el-button link type="primary" size="small" @click="navigate('/ent/asset-register')">查看明细 &gt;</el-button>
                </div>
              </template>
              <div class="kpi-row">
                <div class="kpi-item" v-for="k in panqingKpis" :key="k.label">
                  <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
                  <div class="kpi-label">{{ k.label }}</div>
                </div>
              </div>
              <el-table :data="pqDetailRows" size="small" border class="pq-table" :show-header="true">
                <el-table-column prop="name" label="集团" min-width="80" />
                <el-table-column prop="assets" label="数量(处)" width="70" align="right" />
                <el-table-column label="账面值(亿)" width="85" align="right">
                  <template #default="{ row }">{{ row.bookValue.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="出租率" width="65" align="right">
                  <template #default="{ row }">{{ row.rentalRate }}%</template>
                </el-table-column>
                <el-table-column label="闲置率" width="65" align="right">
                  <template #default="{ row }">{{ row.idleRate }}%</template>
                </el-table-column>
                <el-table-column prop="unCert" label="未办证" width="65" align="right">
                  <template #default="{ row }">
                    <span :class="row.unCert > 0 ? 'c-danger' : 'c-weak'">{{ row.unCert }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          <el-card class="ph-card" shadow="never">
              <template #header>
                <div class="section-banner ph-banner">
                  <div class="banner-left">
                    <span class="banner-icon">
                      <el-icon :size="18"><TrendCharts /></el-icon>
                    </span>
                    <span class="banner-text">盘活 · 经营收入</span>
                    <el-tag size="small" type="info" style="margin-left:8px">{{ currentCompany }}</el-tag>
                  </div>
                  <el-button link type="primary" size="small" @click="navigate('/ent/collection-hall')">查看明细 &gt;</el-button>
                </div>
              </template>
              <div class="kpi-row">
                <div class="kpi-item" v-for="k in panhuoKpis" :key="k.label">
                  <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
                  <div class="kpi-label">{{ k.label }}</div>
                </div>
              </div>
              <el-table :data="phDetailRows" size="small" border class="ph-table" :show-header="true">
                <el-table-column prop="name" label="集团" min-width="80" />
                <el-table-column label="累计应收(亿)" width="90" align="right">
                  <template #default="{ row }">{{ row.cumReceivable.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column label="累计实收(亿)" width="90" align="right">
                  <template #default="{ row }">{{ row.cumActual.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column label="当年应收(亿)" width="90" align="right">
                  <template #default="{ row }">{{ row.yearReceivable.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column label="当年实收(亿)" width="90" align="right">
                  <template #default="{ row }">{{ row.yearActual.toFixed(4) }}</template>
                </el-table-column>
                <el-table-column label="收缴率" width="65" align="right">
                  <template #default="{ row }">
                    <span :class="collectRate(row) >= 95 ? 'c-success' : collectRate(row) >= 80 ? 'c-warning' : 'c-danger'">{{ collectRate(row) }}%</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
        </div>
      </el-col>

      <el-col :span="8">
        <el-card class="calendar-card" shadow="never">
          <template #header>
            <div class="todo-header">
              <span class="section-title">待办任务</span>
              <el-link type="primary" :underline="false" class="more-link" @click="navigate('/ent/warning-tasks')">更多&gt;</el-link>
            </div>
          </template>
          <div class="todo-toolbar">
            <el-select v-model="calendarMonth" size="small" style="width: 88px">
              <el-option v-for="m in 12" :key="m" :label="m + '月'" :value="m" />
            </el-select>
            <el-button size="small" @click="goToday">今日</el-button>
          </div>
          <div class="todo-body">
            <div class="todo-calendar">
              <div class="calendar-header">
                <el-button :icon="ArrowLeft" link @click="changeMonth(-1)" />
                <span class="calendar-title">{{ calendarYear }}年{{ calendarMonth }}月</span>
                <el-button :icon="ArrowRight" link @click="changeMonth(1)" />
              </div>
              <div class="calendar-grid">
                <div class="cal-head" v-for="d in weekDays" :key="d">{{ d }}</div>
                <div
                  v-for="(cell, idx) in calendarCells"
                  :key="idx"
                  class="cal-cell"
                  :class="{ 'other-month': !cell.current, 'today': cell.isToday, 'has-todo': cell.todoCount > 0 }"
                >
                  <span class="cal-day">{{ cell.day }}</span>
                  <span v-if="cell.todoCount > 0" class="cal-dot">{{ cell.todoCount }}</span>
                </div>
              </div>
            </div>
            <div class="todo-tasks">
              <div v-for="t in filteredTasks" :key="t.docNo" class="task-row" @click="navigate(t.path)">
                <el-tag size="small" :type="t.tagType">{{ t.type }}</el-tag>
                <div class="task-main">
                  <div class="task-title">{{ t.title }}</div>
                  <div class="task-no">{{ t.docNo }} · {{ t.date }}</div>
                </div>
              </div>
              <el-empty v-if="filteredTasks.length === 0" :image-size="56" description="本月暂无待办任务" />
            </div>
          </div>
          <div class="todo-summary">
            <div class="todo-stat">
              <span class="todo-num in-progress">{{ todoInProgress }}</span>
              <span class="todo-desc">进行中</span>
            </div>
            <div class="todo-stat">
              <span class="todo-num completed">{{ todoCompleted }}</span>
              <span class="todo-desc">已完成</span>
            </div>
          </div>
        </el-card>

        <el-card class="todo-list-card" shadow="never">
          <template #header>
            <span class="section-title">待办事项</span>
            <el-badge :value="todoItems.length" type="primary" style="margin-left: 8px" />
          </template>
          <div v-if="todoItems.length === 0" class="empty-todo">暂无待办</div>
          <div v-else>
            <div v-for="item in todoItems" :key="item.id" class="todo-item" @click="navigate(item.path)">
              <el-tag :type="item.tagType" size="small" style="margin-right: 8px; flex-shrink: 0">{{ item.type }}</el-tag>
              <span class="todo-title">{{ item.title }}</span>
              <span class="todo-time">{{ item.time }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="app-center">
      <div v-for="section in appSections" :key="section.title" class="app-section">
        <div class="app-banner" :style="{ background: section.bannerBg }">
          <div class="banner-illus">
            <span class="illus-block b1" :style="{ background: section.blockA }"></span>
            <span class="illus-block b2" :style="{ background: section.blockB }"></span>
            <span class="illus-block b3" :style="{ background: section.blockA }"></span>
            <span class="illus-dot" :style="{ background: section.blockB }"></span>
          </div>
          <div class="banner-title">{{ section.title }}</div>
          <div class="banner-count">{{ section.modules.length }} 个模块</div>
        </div>
        <div class="app-tiles">
          <div class="app-module-item" v-for="mod in section.modules" :key="mod.label" @click="navigate(mod.path)">
            <div class="module-icon" :style="{ background: mod.bg }">
              <el-icon :size="20" color="#fff"><component :is="mod.icon" /></el-icon>
            </div>
            <span class="module-label">{{ mod.label }}</span>
            <span class="module-desc">{{ mod.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="settingsVisible" title="工作台设置" width="440px">
      <div class="section-title">显示快捷入口</div>
      <el-checkbox-group v-model="checkedEntries" class="settings-group">
        <el-checkbox v-for="e in quickEntries" :key="e.label" :label="e.label" :value="e.label">{{ e.label }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="settingsVisible = false">取消</el-button>
        <el-button type="primary" @click="settingsVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import { useReportStore } from '../../store/report'
import { useWarningStore } from '../../store/warning'
import {
  ArrowLeft, ArrowRight,
  DataBoard, Files, House, Promotion, Document, Wallet, Bell, SetUp,
  MapLocation, TrendCharts, Folder, Monitor, Cpu, Collection,
  Ticket, Setting, Warning, Search, User, OfficeBuilding, List,
  EditPen, Key, Postcard, DataAnalysis, Stamp, DocumentChecked, Tickets, AlarmClock
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const reportStore = useReportStore()
const warningStore = useWarningStore()

const userInitial = computed(() => (userStore.user?.name || '管理员').charAt(0))

const settingsVisible = ref(false)

const currentCompany = computed(() => userStore.user?.org || '城投集团')
const companyRow = computed(() => reportStore.computeCompanyData(currentCompany.value))

const topStats = computed(() => {
  const row = companyRow.value
  const yearActual = Math.round(row.yearActual * 10000)
  return [
    { label: '资产总数', value: row.assets, color: '#fff' },
    { label: '账面总值(亿元)', value: row.bookValue.toFixed(2), color: '#fff' },
    { label: '出租率', value: row.rentalRate + '%', color: '#fff' },
    { label: '未办证', value: row.unCert, color: '#fff' },
    { label: '当年实收(万)', value: yearActual.toLocaleString(), color: '#fff' }
  ]
})

const panqingKpis = computed(() => {
  const row = companyRow.value
  return [
    { label: '资产总数', value: row.assets + ' 处', color: '#1668DC' },
    { label: '账面总值', value: row.bookValue.toFixed(2) + ' 亿', color: '#1668DC' },
    { label: '出租率', value: row.rentalRate + '%', color: '#18A058' },
    { label: '闲置率', value: row.idleRate + '%', color: '#E8912A' },
    { label: '未办证', value: row.unCert + ' 处', color: row.unCert > 0 ? '#D93026' : '#94A3B8' }
  ]
})

const pqDetailRows = computed(() => [companyRow.value])

const panhuoKpis = computed(() => {
  const row = companyRow.value
  const cumRate = row.cumReceivable > 0 ? Math.round(row.cumActual / row.cumReceivable * 1000) / 10 : 0
  const yearRate = row.yearReceivable > 0 ? Math.round(row.yearActual / row.yearReceivable * 1000) / 10 : 0
  return [
    { label: '累计应收', value: row.cumReceivable.toFixed(2) + ' 亿', color: '#1668DC' },
    { label: '累计实收', value: row.cumActual.toFixed(2) + ' 亿', color: '#18A058' },
    { label: '累计收缴率', value: cumRate + '%', color: cumRate >= 95 ? '#18A058' : '#E8912A' },
    { label: '当年实收', value: Math.round(row.yearActual * 10000) + ' 万', color: '#1668DC' },
    { label: '当年收缴率', value: yearRate + '%', color: yearRate >= 95 ? '#18A058' : '#E8912A' }
  ]
})

const phDetailRows = computed(() => [companyRow.value])

function collectRate(row) {
  if (!row.cumReceivable) return 0
  return Math.round(row.cumActual / row.cumReceivable * 1000) / 10
}

const quickActions = [
  { label: '经营看板', icon: DataBoard, bg: '#1668DC', path: '/ent/data-cockpit' },
  { label: '资产管理', icon: Files, bg: '#18A058', path: '/ent/asset-register' },
  { label: '房屋权证', icon: House, bg: '#722ed1', path: '/ent/property-rights' },
  { label: '招商管理', icon: Promotion, bg: '#E8912A', path: '/ent/investment-publish' },
  { label: '合同管理', icon: Document, bg: '#13c2c2', path: '/ent/contract-approval' },
  { label: '收费管理', icon: Wallet, bg: '#2F54EB', path: '/ent/collection-hall' },
  { label: '催缴提醒', icon: Bell, bg: '#D93026', path: '/ent/urge-rent' },
  { label: '巡检维修', icon: SetUp, bg: '#2f54eb', path: '/ent/inspection-plan' }
]

const quickEntries = [
  { label: '资产登记', icon: EditPen, bg: '#1668DC', path: '/ent/asset-register' },
  { label: '资产管控', icon: Key, bg: '#2f54eb', path: '/ent/asset-register' },
  { label: '台账列表', icon: List, bg: '#13c2c2', path: '/ent/ledger-list' },
  { label: '产权信息', icon: House, bg: '#722ed1', path: '/ent/property-rights' },
  { label: '证件信息', icon: Postcard, bg: '#E8912A', path: '/ent/property-rights' },
  { label: '评估信息', icon: DataAnalysis, bg: '#18A058', path: '/ent/report-asset-stats' },
  { label: '资债权证', icon: Stamp, bg: '#2F54EB', path: '/ent/property-rights' },
  { label: '资产报表', icon: TrendCharts, bg: '#1668DC', path: '/ent/report-asset-stats' },
  { label: '固资看板', icon: DataBoard, bg: '#D93026', path: '/ent/fixed-assets' },
  { label: '资产清单', icon: Document, bg: '#E8912A', path: '/ent/ledger-list' },
  { label: '合同审批', icon: DocumentChecked, bg: '#18A058', path: '/ent/contract-approval' },
  { label: '收费大厅', icon: Wallet, bg: '#722ed1', path: '/ent/collection-hall' },
  { label: '发票管理', icon: Tickets, bg: '#13c2c2', path: '/ent/business-finance' },
  { label: '预警配置', icon: AlarmClock, bg: '#2f54eb', path: '/ent/warning-tasks' }
]

const checkedEntries = ref(quickEntries.map(e => e.label))
const visibleQuickEntries = computed(() => quickEntries.filter(e => checkedEntries.value.includes(e.label)))

const appSections = [
  {
    title: '经营性资产',
    bannerBg: 'linear-gradient(160deg, #1668DC 0%, #36cfc9 100%)',
    blockA: 'rgba(255,255,255,0.35)',
    blockB: 'rgba(255,255,255,0.18)',
    modules: [
      { label: '经营看板', desc: '数据总览', icon: DataBoard, bg: '#1668DC', path: '/ent/data-cockpit' },
      { label: '资产管理', desc: '登记建档', icon: Files, bg: '#18A058', path: '/ent/asset-register' },
      { label: '资产权证', desc: '权证管理', icon: House, bg: '#722ed1', path: '/ent/property-rights' },
      { label: '招商管理', desc: '项目发布', icon: Promotion, bg: '#E8912A', path: '/ent/investment-publish' },
      { label: '资产运营', desc: '租赁运营', icon: OfficeBuilding, bg: '#13c2c2', path: '/ent/lease-mgmt' },
      { label: '合同管理', desc: '合同审批', icon: Document, bg: '#2f54eb', path: '/ent/contract-approval' },
      { label: '收费管理', desc: '费用收缴', icon: Wallet, bg: '#2F54EB', path: '/ent/collection-hall' },
      { label: '发票管理', desc: '开票记录', icon: Ticket, bg: '#E8912A', path: '/ent/business-finance' },
      { label: '履约催缴', desc: '欠费催缴', icon: Bell, bg: '#D93026', path: '/ent/urge-rent' },
      { label: '资产地图', desc: '分布一张图', icon: MapLocation, bg: '#18A058', path: '/ent/map' },
      { label: '资产报表', desc: '统计分析', icon: TrendCharts, bg: '#722ed1', path: '/ent/report-asset-stats' },
      { label: '资产档案', desc: '档案查询', icon: Folder, bg: '#1668DC', path: '/ent/asset-archive' }
    ]
  },
  {
    title: '数智管理',
    bannerBg: 'linear-gradient(160deg, #722ed1 0%, #9254de 100%)',
    blockA: 'rgba(255,255,255,0.35)',
    blockB: 'rgba(255,255,255,0.18)',
    modules: [
      { label: '预警管理', desc: '风险监控', icon: Warning, bg: '#D93026', path: '/ent/warning-tasks' },
      { label: '组织架构', desc: '部门人员', icon: OfficeBuilding, bg: '#2f54eb', path: '/ent/system/dept' },
      { label: '任务中心', desc: '任务调度', icon: Monitor, bg: '#E8912A', path: '/ent/warning-tasks' },
      { label: '巡查管理', desc: '巡检计划', icon: SetUp, bg: '#18A058', path: '/ent/inspection-plan' },
      { label: '系统配置', desc: '参数配置', icon: Cpu, bg: '#722ed1', path: '/ent/system/dict' },
      { label: '系统管理', desc: '权限管理', icon: Setting, bg: '#1668DC', path: '/ent/system/dept' }
    ]
  },
  {
    title: '固定资产',
    bannerBg: 'linear-gradient(160deg, #E8912A 0%, #E8912A 100%)',
    blockA: 'rgba(255,255,255,0.35)',
    blockB: 'rgba(255,255,255,0.18)',
    modules: [
      { label: '资产看板', desc: '固资总览', icon: DataBoard, bg: '#1668DC', path: '/ent/fixed-assets' },
      { label: '资产清单', desc: '台账明细', icon: List, bg: '#18A058', path: '/ent/ledger-list' },
      { label: '资产报表', desc: '统计报表', icon: TrendCharts, bg: '#13c2c2', path: '/ent/fixed-asset-reports' }
    ]
  },
  {
    title: '无形资产',
    bannerBg: 'linear-gradient(160deg, #13c2c2 0%, #36cfc9 100%)',
    blockA: 'rgba(255,255,255,0.35)',
    blockB: 'rgba(255,255,255,0.18)',
    modules: [
      { label: '无形资产', desc: '资产登记', icon: Collection, bg: '#722ed1', path: '/ent/intangible-assets' },
      { label: '版权登记', desc: '版权管理', icon: Document, bg: '#1668DC', path: '/ent/property-rights' }
    ]
  }
]

const todoItems = [
  { id: 1, type: '督办', tagType: 'danger', title: 'DB-2026-009 闲置率偏高，请报送盘活方案', time: '限期 09-30', path: '/ent/warning-tasks' },
  { id: 2, type: '欠费', tagType: 'warning', title: 'HT-2023-018 欠缴 10.5 万元，逾期 45 天', time: '今天', path: '/ent/collection-hall' },
  { id: 3, type: '合同临期', tagType: '', title: 'HT-2024-007 将于 2026-09-30 到期', time: '60 天内', path: '/ent/contract-approval' },
  { id: 4, type: '待办', tagType: 'info', title: 'DB-2026-014 未办证推进督办待处理', time: '限期 10-15', path: '/ent/warning-tasks' }
]

const monthTasks = [
  { type: '盘点任务', tagType: 'warning', docNo: 'PD-2026-0912', title: '三季度固定资产盘点', date: '09-20', month: 9, path: '/ent/fixed-assets' },
  { type: '固定资产', tagType: 'primary', docNo: 'GZ-2026-0345', title: '办公设备报废审批', date: '09-22', month: 9, path: '/ent/fixed-assets' },
  { type: '报事报修', tagType: 'danger', docNo: 'BX-2026-1187', title: '3号楼电梯故障维修', date: '09-25', month: 9, path: '/ent/inspection-plan' },
  { type: '固定资产', tagType: 'primary', docNo: 'GZ-2026-0388', title: '公务车辆调拨登记', date: '09-30', month: 9, path: '/ent/fixed-assets' },
  { type: '盘点任务', tagType: 'warning', docNo: 'PD-2026-1002', title: '无形资产年度盘点', date: '10-15', month: 10, path: '/ent/asset-register' },
  { type: '报事报修', tagType: 'danger', docNo: 'BX-2026-1201', title: '农贸市场水管漏水', date: '10-30', month: 10, path: '/ent/inspection-plan' },
  { type: '固定资产', tagType: 'primary', docNo: 'GZ-2026-0401', title: '固定资产卡片变更', date: '11-08', month: 11, path: '/ent/ledger-list' }
]

const filteredTasks = computed(() => monthTasks.filter(t => t.month === calendarMonth.value))

const todoInProgress = computed(() => warningStore.warningTasks.filter(t => t.status === '进行中').length)
const todoCompleted = computed(() => warningStore.warningTasks.filter(t => t.status === '已完成' || t.status === '已审核').length)

const calendarYear = ref(2026)
const calendarMonth = ref(9)
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const todoDates = { '2026-9-20': 2, '2026-9-22': 1, '2026-9-25': 1, '2026-9-28': 1, '2026-9-30': 2, '2026-10-15': 1, '2026-10-30': 1 }

const calendarCells = computed(() => {
  const y = calendarYear.value
  const m = calendarMonth.value
  const firstDay = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()
  const daysInPrevMonth = new Date(y, m - 1, 0).getDate()
  const cells = []
  const today = new Date()

  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrevMonth - firstDay + 1 + i
    cells.push({ day: d, current: false, isToday: false, todoCount: 0 })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d
    const key = `${y}-${m}-${d}`
    cells.push({ day: d, current: true, isToday, todoCount: todoDates[key] || 0 })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false, isToday: false, todoCount: 0 })
  }
  return cells
})

function changeMonth(delta) {
  let m = calendarMonth.value + delta
  let y = calendarYear.value
  if (m > 12) { m = 1; y++ }
  if (m < 1) { m = 12; y-- }
  calendarMonth.value = m
  calendarYear.value = y
}

function goToday() {
  const now = new Date()
  calendarYear.value = now.getFullYear()
  calendarMonth.value = now.getMonth() + 1
}

function navigate(path) {
  if (path) router.push(path)
}
</script>

<style scoped>
/* 左右两列各自成纵向 flex 列，卡片间距统一交给 gap:16（原 margin 累加已清除） */
.top-section > .el-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 状态色工具类：模板内联硬编码色改用全局变量 */
.c-success { color: var(--c-success); }
.c-warning { color: var(--c-warning); }
.c-danger { color: var(--c-danger); }
.c-weak { color: var(--t-weak); }

.section-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--r-md);
  margin: -8px -12px;
}

.pq-banner {
  background: linear-gradient(135deg, var(--c-primary-light) 0%, #B9D4FF 100%);
}

.ph-banner {
  background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.banner-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pq-banner .banner-icon {
  background: var(--c-primary);
  color: #fff;
}

.ph-banner .banner-icon {
  background: var(--c-success);
  color: #fff;
}

.banner-text {
  font-weight: 600;
  font-size: 15px;
}

.pq-banner .banner-text {
  color: #0050b3;
}

.ph-banner .banner-text {
  color: #237804;
}

.kpi-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.kpi-item {
  flex: 1;
  min-width: 0;
  text-align: center;
  padding: 12px 4px;
  border-radius: var(--r-md);
  background: var(--bg-th);
}

.kpi-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
}

.kpi-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}

.pq-table :deep(.el-table__header th),
.ph-table :deep(.el-table__header th) {
  background: var(--bg-th);
  font-size: 12px;
  padding: 4px 0;
}

.pq-table :deep(.el-table__body td),
.ph-table :deep(.el-table__body td) {
  font-size: 12px;
  padding: 4px 0;
}

.pq-table :deep(tr:last-child td),
.ph-table :deep(tr:last-child td) {
  font-weight: 600;
  background: var(--bg-th);
}

.welcome-banner {
  background: #17427c;
  border-radius: var(--r-sm);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
}

.welcome-text h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.welcome-role {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.welcome-slogan {
  margin: 8px 0 0 0;
  font-size: 14px;
  opacity: 0.7;
}

.welcome-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #fff !important;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
  color: #fff;
}

.welcome-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: 2px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  flex: none;
  margin-left: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 15px;
}

.wb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-actions-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  cursor: pointer;
  border-radius: var(--r-md);
  transition: all 0.2s;
}

.quick-action-item:hover {
  background: var(--c-primary-light);
  transform: translateY(-2px);
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-label {
  font-size: 12px;
  color: var(--t-sub);
}

.quick-entries {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.entry-item {
  flex: none;
  width: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  cursor: pointer;
  border-radius: var(--r-md);
  transition: all 0.2s;
}

.entry-item:hover {
  background: var(--c-primary-light);
  transform: translateY(-2px);
}

.entry-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-label {
  font-size: 12px;
  color: var(--t-sub);
  white-space: nowrap;
}

.settings-group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px 8px;
  margin-top: 8px;
}

.todo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.more-link {
  font-size: 12px;
}

.todo-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.todo-calendar {
  flex: none;
  width: 52%;
}

.todo-tasks {
  flex: 1;
  min-width: 0;
  max-height: 240px;
  overflow-y: auto;
}

.task-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px dashed var(--bd);
  cursor: pointer;
  transition: background 0.2s;
}

.task-row:hover {
  background: var(--c-primary-light);
}

.task-row:last-child {
  border-bottom: none;
}

.task-main {
  min-width: 0;
}

.task-title {
  font-size: 12px;
  color: var(--t-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-no {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}

.calendar-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.calendar-title {
  font-weight: 600;
  font-size: 14px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
}

.cal-head {
  font-size: 12px;
  color: var(--t-weak);
  padding: 4px 0;
  font-weight: 500;
}

.cal-cell {
  position: relative;
  padding: 4px 0;
  font-size: 13px;
  border-radius: var(--r-sm);
  cursor: default;
}

.cal-cell.other-month {
  color: #ccc;
}

.cal-cell.today {
  background: var(--c-primary);
  color: #fff;
  border-radius: 50%;
  font-weight: 600;
}

.cal-cell.has-todo {
  font-weight: 600;
  color: var(--c-primary);
}

.cal-dot {
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c-danger);
}

.todo-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--bd);
}

.todo-stat {
  text-align: center;
}

.todo-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
}

.todo-num.in-progress {
  color: var(--c-primary);
}

.todo-num.completed {
  color: var(--c-success);
}

.todo-desc {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}

.todo-list-card :deep(.el-card__header) {
  display: flex;
  align-items: center;
}

.empty-todo {
  text-align: center;
  padding: 12px 0;
  color: var(--t-weak);
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--bd);
  cursor: pointer;
  transition: background 0.2s;
}

.todo-item:hover {
  background: var(--bg-th);
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-title {
  flex: 1;
  font-size: 13px;
  color: var(--t-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-time {
  font-size: 12px;
  color: var(--t-weak);
  margin-left: 12px;
  white-space: nowrap;
}

.app-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-section {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.app-banner {
  flex: none;
  width: 132px;
  border-radius: var(--r-md);
  color: #fff;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.banner-illus {
  position: relative;
  height: 54px;
}

.illus-block {
  position: absolute;
  border-radius: var(--r-sm);
  transform: skewY(-8deg);
}

.illus-block.b1 {
  width: 34px;
  height: 26px;
  left: 2px;
  top: 22px;
}

.illus-block.b2 {
  width: 28px;
  height: 38px;
  left: 42px;
  top: 10px;
}

.illus-block.b3 {
  width: 22px;
  height: 18px;
  left: 76px;
  top: 30px;
}

.illus-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  right: 6px;
  top: 2px;
}

.banner-title {
  font-size: 16px;
  font-weight: 700;
  margin-top: 12px;
}

.banner-count {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.app-tiles {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 4px 8px;
  align-content: center;
}

.app-module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  cursor: pointer;
  border-radius: var(--r-md);
  transition: all 0.2s;
}

.app-module-item:hover {
  background: var(--c-primary-light);
  transform: translateY(-2px);
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-label {
  font-size: 12px;
  color: var(--t-sub);
}

.module-desc {
  font-size: 12px;
  color: var(--t-weak);
}
</style>
