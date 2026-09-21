<template>
  <div class="page-container">
    <div class="page-header">
      <h2>经营看板</h2>
    </div>
    <div class="hero-panel">
      <div class="hero-total">
        <div class="hero-head">
          <span class="hero-title">资产总量</span>
          <el-tag size="small" effect="dark">截至 2026-09</el-tag>
        </div>
        <div class="hero-metrics">
          <div class="hero-metric">
            <div class="hero-num">{{ heroValue }}<span>亿元</span></div>
            <div class="hero-label">资产总价值</div>
          </div>
          <div class="hero-metric">
            <div class="hero-num">{{ fmt(totalAssetCount) }}<span>宗</span></div>
            <div class="hero-label">资产总宗数</div>
          </div>
        </div>
      </div>
      <div class="hero-cats">
        <div v-for="c in assetCategories" :key="c.name" class="cat-card">
          <div class="cat-top">
            <div class="cat-icon" :style="{ background: c.bg }">
              <el-icon :size="18" :color="c.color"><component :is="c.icon" /></el-icon>
            </div>
            <span class="cat-name">{{ c.name }}</span>
          </div>
          <div class="cat-row"><span>资产数量</span><b>{{ c.count }} 宗</b></div>
          <div class="cat-row"><span>资产价值</span><b>{{ c.value }} 万元</b></div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="panel-card">
      <div class="panel-flex">
        <div class="warn-half">
          <div class="half-head">
            <span class="section-title">待办任务</span>
            <span class="half-count">{{ todoTasks.length }}</span>
          </div>
          <div v-for="t in todoTasks" :key="t.no" class="mini-row">
            <el-icon color="#1668DC"><Document /></el-icon>
            <span class="mini-text">{{ t.title }}</span>
            <span class="mini-no">{{ t.no }}</span>
          </div>
        </div>
        <el-divider direction="vertical" class="half-divider" />
        <div class="warn-half">
          <div class="half-head">
            <span class="section-title">风险预警</span>
            <span class="half-count danger">{{ riskWarnings.length }}</span>
          </div>
          <div v-for="r in riskWarnings" :key="r.no" class="mini-row">
            <el-tag size="small" :type="r.tagType">{{ r.tag }}</el-tag>
            <span class="mini-text">{{ r.title }}</span>
            <span class="mini-no">{{ r.no }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <div class="chart-row chart-row-1-1">
      <div>
        <div class="section-title">资产信息</div>
        <div class="stat-strip tile-strip">
          <div class="stat-item" v-for="t in assetInfoTiles" :key="t.label">
            <div class="stat-value">{{ t.value }}<span class="unit">{{ t.unit }}</span></div>
            <div class="stat-label">{{ t.label }}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="section-title">权属抵押</div>
        <div class="stat-strip tile-strip">
          <div class="stat-item" v-for="t in mortgageTiles" :key="t.label">
            <div class="stat-value">{{ t.value }}<span class="unit">{{ t.unit }}</span></div>
            <div class="stat-label">{{ t.label }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <el-card shadow="never" class="panel-card chart-panel">
        <div class="section-title">资产权属</div>
        <div class="donut-flex">
          <div class="donut" :style="ownershipDonutStyle">
            <div class="donut-hole">
              <b>{{ fmt(totalAssetCount) }}</b>
              <span>总宗数</span>
            </div>
          </div>
          <div class="pct-list">
            <div v-for="o in ownershipData" :key="o.name" class="pct-item">
              <span class="dot" :style="{ background: o.color }"></span>
              <span class="pct-name">{{ o.name }}</span>
              <el-progress :percentage="o.percent" :stroke-width="8" :color="o.color" :show-text="false" class="pct-bar" />
              <span class="pct-val">{{ o.percent }}%</span>
            </div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never" class="panel-card chart-panel">
        <div class="section-title">资产类型</div>
        <div class="funnel-list">
          <div v-for="f in funnelData" :key="f.name" class="funnel-row">
            <div class="funnel-bar" :style="{ width: f.percent + '%', background: f.color }">
              <span>{{ f.name }}</span>
              <span>{{ f.count }}</span>
            </div>
          </div>
        </div>
        <div class="long-legend">
          <span v-for="f in funnelData" :key="'lg' + f.name" class="legend-item">
            <i :style="{ background: f.color }"></i>{{ f.name }} {{ f.count }}宗
          </span>
        </div>
      </el-card>
      <el-card shadow="never" class="panel-card chart-panel">
        <div class="section-title">资产数量与面积</div>
        <div class="stack-list">
          <div v-for="s in streetData" :key="s.name" class="stack-row">
            <span class="stack-name">{{ s.name }}</span>
            <div class="stack-track">
              <div class="seg seg-count" :style="{ width: (s.count / stackMax) * 100 + '%' }"></div>
              <div class="seg seg-area" :style="{ width: (s.area / stackMax) * 100 + '%' }"></div>
            </div>
            <span class="stack-val">{{ s.count }}宗 · {{ s.area }}㎡</span>
          </div>
        </div>
        <div class="long-legend">
          <span class="legend-item"><i style="background: #1668DC"></i>数量(宗)</span>
          <span class="legend-item"><i style="background: #E8912A"></i>面积(㎡)</span>
        </div>
      </el-card>
    </div>

    <el-card shadow="never" class="panel-card">
      <div class="section-title">租赁情况</div>
      <div class="lease-grid">
        <div v-for="l in leaseTiles" :key="l.label" class="lease-tile">
          <div class="lease-value" :style="{ color: l.color }">{{ l.value }}<span>{{ l.unit }}</span></div>
          <div class="lease-label">{{ l.label }}</div>
        </div>
      </div>
    </el-card>
    <!-- 已移除「租赁类型占比」「租赁权属占比」饼图：合同/资产台账未记录租赁方式(整租/分租/合租)与权属性质(国有/集体/私有)字段，无法由 store 派生 -->

    <el-card shadow="never" class="panel-card">
      <div class="section-title">资产创收排行</div>
      <el-table :data="revenueRank" size="small" style="width: 100%">
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="'rank-' + ($index + 1)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司" min-width="200" show-overflow-tooltip />
        <el-table-column prop="project" label="项目" min-width="180" show-overflow-tooltip />
        <el-table-column label="租赁率" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.rate" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="leaseCount" label="租赁总数" width="100" align="right" />
        <el-table-column prop="leaseAmount" label="租赁总额(万元)" width="140" align="right" />
      </el-table>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据驾驶舱</span>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
        </div>
      </template>

      <div class="dash-body">
        <div class="grid-4">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #E8F2FF">
              <el-icon :size="32" color="#1668DC"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ fmt(totalAssetCount) }}</div>
              <div class="stat-label">资产总数</div>
              <div class="stat-trend up">↑ 12% 较上月</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #f6ffed">
              <el-icon :size="32" color="#52c41a"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ rentalRate }}%</div>
              <div class="stat-label">出租率</div>
              <div class="stat-trend up">↑ 2.3% 较上月</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #fff7e6">
              <el-icon :size="32" color="#fa8c16"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ fmt(yearRevenueWan) }}万</div>
              <div class="stat-label">年度收益</div>
              <div class="stat-trend up">↑ 8.5% 较去年</div>
            </div>
          </el-card>
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #fff1f0">
              <el-icon :size="32" color="#f5222d"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ kpiWarningCount }}</div>
              <div class="stat-label">待处理预警</div>
              <div class="stat-trend down">↓ 3 较昨日</div>
            </div>
          </el-card>
        </div>

        <div class="chart-row chart-row-1-1">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>资产类型分布</span>
                <el-radio-group v-model="chartType1" size="small">
                  <el-radio-button label="pie">饼图</el-radio-button>
                  <el-radio-button label="bar">柱状图</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="chartType1 === 'pie'" class="pie-chart-container">
                <div class="pie-chart" :style="pieChartStyle"></div>
                <div class="pie-legend">
                  <div v-for="item in assetTypeData" :key="item.name" class="pie-legend-item">
                    <span class="pie-legend-dot" :style="{ background: item.color }"></span>
                    <span class="pie-legend-label">{{ item.name }}</span>
                    <span class="pie-legend-value">{{ item.count }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </div>
              <div v-else>
                <div v-for="item in assetTypeData" :key="item.name" class="chart-bar-item">
                  <div class="chart-bar-label">{{ item.name }}</div>
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                    <span class="chart-bar-value">{{ item.count }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>月度收益趋势</span>
                <el-radio-group v-model="chartType2" size="small">
                  <el-radio-button label="line">折线图</el-radio-button>
                  <el-radio-button label="bar">柱状图</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="chartType2 === 'line'" class="line-chart-container">
                <svg class="line-chart-svg" viewBox="0 0 400 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#1668DC" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#1668DC" stop-opacity="0.02" />
                    </linearGradient>
                  </defs>
                  <line v-for="i in 4" :key="'g'+i" :x1="40" :x2="390" :y1="i * 40 + 10" :y2="i * 40 + 10" stroke="#E2E8F0" stroke-width="1" />
                  <polyline :points="linePoints" fill="none" stroke="#1668DC" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
                  <polygon :points="areaPoints" fill="url(#areaGrad)" />
                  <circle v-for="(pt, i) in chartPoints" :key="i" :cx="pt.x" :cy="pt.y" r="4" fill="#fff" stroke="#1668DC" stroke-width="2" />
                </svg>
                <div class="line-x-labels">
                  <span v-for="item in monthlyRevenue" :key="item.month">{{ item.month }}</span>
                </div>
              </div>
              <div v-else>
                <div class="trend-chart">
                  <div v-for="item in monthlyRevenue" :key="item.month" class="trend-item">
                    <div class="trend-bar" :style="{ height: item.value / revMax * 100 + '%' }"></div>
                    <div class="trend-label">{{ item.month }}</div>
                    <div class="trend-value">{{ item.value }}万</div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <el-card shadow="never">
          <template #header>
            <div class="chart-header">
              <span>智能预警</span>
              <el-button link type="primary" @click="handleViewAll">查看全部</el-button>
            </div>
          </template>
          <el-table :data="warnings" style="width: 100%">
            <el-table-column prop="level" label="预警级别" width="100">
              <template #default="{ row }">
                <el-tag :type="row.level === '高' ? 'danger' : row.level === '中' ? 'warning' : 'info'" size="small">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="预警类型" width="120" />
            <el-table-column prop="content" label="预警内容" />
            <el-table-column prop="asset" label="关联资产" width="150" />
            <el-table-column prop="time" label="时间" width="120" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleProcess(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>

    <el-dialog v-model="warningDetailVisible" title="预警处理" width="600px">
      <el-descriptions :column="1" border v-if="currentWarning">
        <el-descriptions-item label="预警级别">
          <el-tag :type="currentWarning.level === '高' ? 'danger' : currentWarning.level === '中' ? 'warning' : 'info'" size="small">{{ currentWarning.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentWarning.type }}</el-descriptions-item>
        <el-descriptions-item label="预警内容">{{ currentWarning.content }}</el-descriptions-item>
        <el-descriptions-item label="关联资产">{{ currentWarning.asset }}</el-descriptions-item>
        <el-descriptions-item label="预警时间">{{ currentWarning.time }}</el-descriptions-item>
      </el-descriptions>
      <el-form style="margin-top: 20px" label-width="100px">
        <el-form-item label="处理意见">
          <el-input v-model="processRemark" type="textarea" :rows="3" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warningDetailVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding, TrendCharts, Money, Warning,
  House, MapLocation, Shop, Goods, Van, Coin, Document
} from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useWarningStore } from '../../store/warning'
import { useSuperviseStore } from '../../store/supervise'

const router = useRouter()
const user = useUserStore()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const warningStore = useWarningStore()
const superviseStore = useSuperviseStore()

const dateRange = ref([])
const chartType1 = ref('bar')
const chartType2 = ref('line')
const warningDetailVisible = ref(false)
const currentWarning = ref(null)
const processRemark = ref('')

const PALETTE = ['#1668DC', '#13C2C2', '#C8963E', '#722ED1', '#52C41A', '#FA8C16', '#F5222D', '#2F54EB']
const org = computed(() => user.user?.org || '')
const fmt = n => (Number(n) || 0).toLocaleString()
const r1 = n => Math.round((Number(n) || 0) * 10) / 10

// ===== 资产基础口径（企业端一律走 visibleAssets，已按 user.org 过滤）=====
const assets = computed(() => assetStore.visibleAssets || [])
const isIdle = a => a.status === '闲置' || a.status === '空置'
const isLeased = a => a.status === '已出租' || a.status === '部分出租'
const totalAssetCount = computed(() => assets.value.length)
const rentedCount = computed(() => assets.value.filter(isLeased).length)
const inUseCount = computed(() => assets.value.filter(a => isLeased(a) || a.status === '自用').length)
const idleCount = computed(() => assets.value.filter(isIdle).length)
const idleArea = computed(() => assets.value.filter(isIdle).reduce((s, a) => s + (Number(a.area) || 0), 0))
const totalBookValue = computed(() => assets.value.reduce((s, a) => s + (Number(a.bookValue) || 0), 0))
const rentalRate = computed(() => totalAssetCount.value ? r1(rentedCount.value / totalAssetCount.value * 100) : 0)
const utilizationRate = computed(() => totalAssetCount.value ? r1(inUseCount.value / totalAssetCount.value * 100) : 0)
const idleRate = computed(() => totalAssetCount.value ? r1(idleCount.value / totalAssetCount.value * 100) : 0)

// ===== 资产总量头图：总价值(亿元) + 六大分类 =====
const heroValue = computed(() => (totalBookValue.value / 10000).toFixed(1))
const heroIconMap = { '房产类': House, '土地类': MapLocation, '经营类房屋店铺': Shop, '农贸市场': Goods, '运输设备': Van, '矿产资源类': Coin }
const heroColorMap = {
  '房产类': ['#1668DC', '#E8F2FF'], '土地类': ['#52c41a', '#f6ffed'], '经营类房屋店铺': ['#fa8c16', '#fff7e6'],
  '农贸市场': ['#722ed1', '#f9f0ff'], '运输设备': ['#13c2c2', '#e6fffb'], '矿产资源类': ['#2F54EB', '#fff0f6']
}
const assetCategories = computed(() => ['房产类', '土地类', '经营类房屋店铺', '农贸市场', '运输设备', '矿产资源类'].map((name, i) => {
  const rows = assets.value.filter(a => a.assetCategory === name)
  const color = heroColorMap[name] || [PALETTE[i % PALETTE.length], '#F5F7FA']
  return {
    name,
    count: fmt(rows.length),
    value: fmt(rows.reduce((s, a) => s + (Number(a.bookValue) || 0), 0)),
    icon: heroIconMap[name] || OfficeBuilding,
    color: color[0],
    bg: color[1]
  }
}))

// ===== 待办 / 风险：预警任务 + 督办单（均按本公司口径）=====
const OPEN_TASK = t => t.status !== '已完成' && t.status !== '已审核'
const todoTasks = computed(() => warningStore.tasksOfOrg(org.value).filter(OPEN_TASK).slice(0, 6)
  .map(t => ({ no: t.id, title: t.name })))
const OPEN_ORDER = ['待处理', '待确认', '已驳回', '已逾期']
const orderTagType = s => s === '已逾期' ? 'danger' : s === '待确认' ? 'warning' : s === '已驳回' ? 'danger' : 'info'
const riskWarnings = computed(() => superviseStore.getOrdersByCompany(org.value)
  .filter(o => OPEN_ORDER.includes(o.status)).slice(0, 6)
  .map(o => ({ tag: o.type, tagType: orderTagType(o.status), title: o.reason || o.subject || o.type, no: o.id })))

// ===== 资产信息 / 权属抵押 瓦片 =====
const certCount = computed(() => assets.value.filter(a => a.certStatus === '已办证').length)
const assetInfoTiles = computed(() => [
  { label: '资产总数', value: fmt(totalAssetCount.value), unit: '宗' },
  { label: '运营总数', value: fmt(inUseCount.value), unit: '宗' },
  { label: '资产闲置率', value: idleRate.value, unit: '%' },
  { label: '闲置面积', value: (idleArea.value / 10000).toFixed(1), unit: '万㎡' }
])
// 抵押数据无对应 store（allowed 集内不含抵押 store），权证两项由台账派生，抵押两项移除。
const mortgageTiles = computed(() => [
  { label: '权证总数', value: fmt(certCount.value), unit: '本' },
  { label: '办证率', value: totalAssetCount.value ? r1(certCount.value / totalAssetCount.value * 100) : 0, unit: '%' }
])

// ===== 资产权属（有证 / 办理中 / 无证）=====
const ownershipData = computed(() => {
  const total = totalAssetCount.value || 1
  const hasCert = assets.value.filter(a => a.certStatus === '已办证').length
  const processing = assets.value.filter(a => a.certStatus && a.certStatus.includes('办理中')).length
  const none = totalAssetCount.value - hasCert - processing
  const pct = n => Math.round(n / total * 100)
  return [
    { name: '有证', percent: pct(hasCert), color: '#1668DC' },
    { name: '办理中', percent: pct(processing), color: '#52c41a' },
    { name: '无证', percent: pct(none), color: '#E8912A' }
  ]
})

// ===== 资产类型漏斗（按 assetUsage 分布，宽度相对最大值）=====
const funnelData = computed(() => {
  const map = new Map()
  assets.value.forEach(a => {
    const k = a.assetUsage || a.type || '其他'
    map.set(k, (map.get(k) || 0) + 1)
  })
  const rows = [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  const max = rows.length ? rows[0].count : 1
  return rows.map((r, i) => ({ ...r, percent: Math.max(28, Math.round(r.count / max * 100)), color: PALETTE[i % PALETTE.length] }))
})

// ===== 资产数量与面积（按所在区域）=====
const streetData = computed(() => {
  const map = new Map()
  assets.value.forEach(a => {
    const k = a.location || '其他'
    const cur = map.get(k) || { count: 0, area: 0 }
    cur.count += 1
    cur.area += Number(a.area) || 0
    map.set(k, cur)
  })
  return [...map.entries()].map(([name, v]) => ({ name, count: v.count, area: Math.round(v.area) }))
    .sort((a, b) => (b.count + b.area) - (a.count + a.area)).slice(0, 8)
})
const stackMax = computed(() => Math.max(1, ...streetData.value.map(s => s.count + s.area)))

// ===== 租赁情况瓦片 =====
const activeContracts = computed(() => (contractStore.visibleContracts || []).filter(c => c.status !== '已终止' && c.status !== '退租'))
const leasedArea = computed(() => activeContracts.value.reduce((s, c) => s + (Number(c.leaseArea) || 0), 0))
const yearReceivable = computed(() => (contractStore.visibleFees || []).reduce((s, f) => s + (Number(f.yearReceivable) || 0), 0))
const yearActual = computed(() => (contractStore.visibleFees || []).reduce((s, f) => s + (Number(f.yearActual) || 0), 0))
const arrearsTotal = computed(() => (contractStore.visibleFees || []).reduce((s, f) => s + (Number(f.arrears) || 0), 0))
const collectRate = computed(() => yearReceivable.value ? r1(yearActual.value / yearReceivable.value * 100) : 0)
const leaseTiles = computed(() => [
  { label: '租赁总数', value: fmt(rentedCount.value), unit: '宗', color: '#1668DC' },
  { label: '租赁总面积', value: (leasedArea.value / 10000).toFixed(1), unit: '万㎡', color: '#722ed1' },
  { label: '合同总数', value: fmt((contractStore.visibleContracts || []).length), unit: '份', color: '#13c2c2' },
  { label: '盘活率', value: utilizationRate.value, unit: '%', color: '#52c41a' },
  { label: '租金收缴', value: collectRate.value, unit: '%', color: '#52c41a' },
  { label: '当前欠缴', value: arrearsTotal.value.toFixed(1), unit: '万元', color: '#f5222d' }
])
// 说明：租赁「类型」(整租/分租/合租) 与租赁「权属性质」(国有/集体/私有) 台账均无对应字段，
// 无法由 store 派生，故移除对应饼图（见模板注释）。

// ===== 资产创收排行（本公司合同按资产归集）=====
const revenueRank = computed(() => {
  const map = new Map()
  activeContracts.value.forEach(c => {
    const cur = map.get(c.assetName) || { project: c.assetName, leaseCount: 0, leaseAmount: 0 }
    cur.leaseCount += 1
    cur.leaseAmount += Number(c.annualRent) || 0
    map.set(c.assetName, cur)
  })
  return [...map.values()].map(r => {
    const asset = assets.value.find(a => a.name === r.project)
    const area = asset ? (Number(asset.area) || 0) : 0
    const la = activeContracts.value.filter(c => c.assetName === r.project).reduce((s, c) => s + (Number(c.leaseArea) || 0), 0)
    return { company: org.value, project: r.project, rate: area ? Math.min(100, Math.round(la / area * 100)) : 100, leaseCount: r.leaseCount, leaseAmount: r.leaseAmount.toFixed(1) }
  }).sort((a, b) => parseFloat(b.leaseAmount) - parseFloat(a.leaseAmount)).slice(0, 6)
})

function makeConic(data) {
  let cum = 0
  const parts = data.map(d => {
    const seg = `${d.color} ${cum}% ${cum + d.percent}%`
    cum += d.percent
    return seg
  })
  return { background: `conic-gradient(${parts.join(', ')})` }
}

const ownershipDonutStyle = computed(() => makeConic(ownershipData.value))

// ===== 资产类型分布（按 type，饼图/柱图共用）=====
const assetTypeData = computed(() => {
  const map = new Map()
  assets.value.forEach(a => { const k = a.type || '其他'; map.set(k, (map.get(k) || 0) + 1) })
  const total = totalAssetCount.value || 1
  return [...map.entries()].map(([name, count]) => ({ name, count, percent: Math.round(count / total * 1000) / 10 }))
    .sort((a, b) => b.count - a.count).slice(0, 6)
    .map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }))
})

// ===== 近 12 个月实收趋势（逐笔收缴流水按月归集）=====
const monthlyRevenue = computed(() => {
  const now = new Date()
  const buckets = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, month: `${d.getMonth() + 1}月`, value: 0 })
  }
  const index = new Map(buckets.map(b => [b.key, b]))
  ;(contractStore.visibleFees || []).forEach(f => {
    (f.payments || []).forEach(p => {
      const b = index.get(String(p.date || '').slice(0, 7))
      if (b) b.value = Math.round((b.value + (Number(p.amount) || 0)) * 10) / 10
    })
  })
  return buckets
})
const revMax = computed(() => Math.max(1, ...monthlyRevenue.value.map(m => m.value)))

const pieChartStyle = computed(() => makeConic(assetTypeData.value))

const chartPoints = computed(() => {
  const data = monthlyRevenue.value
  const maxVal = revMax.value
  const startX = 50, endX = 380, topY = 20, bottomY = 190
  const step = data.length > 1 ? (endX - startX) / (data.length - 1) : 0
  return data.map((item, i) => ({ x: startX + i * step, y: bottomY - (item.value / maxVal) * (bottomY - topY) }))
})

const linePoints = computed(() => chartPoints.value.map(p => `${p.x},${p.y}`).join(' '))

const areaPoints = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return `${pts[0].x},190 ${linePoints.value} ${pts[pts.length - 1].x},190`
})

// ===== 智能预警：本公司预警任务（可处理，处理后数量联动）=====
const taskLevel = t => t.priority === '高' ? '高' : t.priority === '中' ? '中' : '低'
const warnings = computed(() => warningStore.tasksOfOrg(org.value).filter(OPEN_TASK).slice(0, 8).map(t => ({
  id: t.id, level: taskLevel(t), type: t.type, content: t.name, asset: t.asset, time: t.deadline
})))

const kpiWarningCount = computed(() => warningStore.tasksOfOrg(org.value).filter(OPEN_TASK).length)
const yearRevenueWan = computed(() => Math.round(yearReceivable.value))

const handleViewAll = () => {
  router.push('/inspection-maintenance')
}

const handleProcess = (row) => {
  currentWarning.value = row
  warningDetailVisible.value = true
}

const handleProcessSubmit = () => {
  if (currentWarning.value && currentWarning.value.id) {
    warningStore.updateTaskStatus(currentWarning.value.id, '已完成', { remark: processRemark.value })
  }
  warningDetailVisible.value = false
  processRemark.value = ''
  ElMessage.success('预警已处理')
}
</script>

<style scoped>
.hero-panel {
  display: flex;
  gap: 16px;
  background: var(--bg-card);
  border-radius: var(--r-md);
  padding: 16px;
}

.hero-total {
  flex: none;
  width: 260px;
  border-radius: 6px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--c-primary) 0%, #36cfc9 100%);
  color: #fff;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 15px;
  font-weight: 600;
}

.hero-metrics {
  display: flex;
  gap: 24px;
}

.hero-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-num span {
  font-size: 12px;
  font-weight: 400;
  margin-left: 3px;
  opacity: 0.85;
}

.hero-label {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.hero-cats {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cat-card {
  flex: none;
  width: 190px;
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 10px 12px;
  transition: box-shadow 0.2s;
}

.cat-card:hover {
  box-shadow: 0 2px 12px rgba(22, 104, 220, 0.15);
}

.cat-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.cat-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.cat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}

.cat-row b {
  color: #333;
  font-weight: 600;
}

.panel-card {
  border-radius: var(--r-md);
}

.panel-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.chart-panel {
  height: 100%;
}

.panel-flex {
  display: flex;
  align-items: stretch;
}

.warn-half {
  flex: 1;
  min-width: 0;
}

.half-divider {
  height: auto;
  margin: 0 20px;
}

.half-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.half-head .section-title {
  margin: 0;
}

.half-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-primary);
}

.half-count.danger {
  color: #f5222d;
}

.mini-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--bd);
  font-size: 13px;
}

.mini-row:last-child {
  border-bottom: none;
}

.mini-text {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-no {
  color: var(--t-weak);
  font-size: 12px;
  flex: none;
}

.tile-strip {
  border: 1px solid var(--bd);
  border-radius: 6px;
}

.donut-flex,
.pie-flex {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.donut {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  flex: none;
}

.donut-sm {
  width: 110px;
  height: 110px;
}

.donut-hole {
  position: absolute;
  inset: 26px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-hole b {
  font-size: 17px;
  color: #333;
}

.donut-hole b.hl {
  color: var(--c-primary);
}

.donut-hole span {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 2px;
}

.pie-sm {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  flex: none;
}

.pct-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pct-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.pct-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}

.pct-name {
  color: var(--t-weak);
  flex: none;
  width: 44px;
}

.pct-bar {
  flex: 1;
  min-width: 40px;
}

.pct-val {
  color: #333;
  font-weight: 600;
  flex: none;
}

.funnel-list {
  padding: 6px 0 10px;
}

.funnel-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.funnel-bar {
  height: 22px;
  min-width: 110px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 12px;
  color: #fff;
}

.long-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  border-top: 1px dashed var(--bd);
  padding-top: 8px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--t-weak);
}

.legend-item i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.stack-list {
  padding: 6px 0 10px;
}

.stack-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.stack-name {
  flex: none;
  width: 62px;
  font-size: 12px;
  color: var(--t-weak);
}

.stack-track {
  flex: 1;
  height: 14px;
  background: #F5F7FA;
  border-radius: 3px;
  display: flex;
  overflow: hidden;
}

.seg {
  height: 100%;
}

.seg-count {
  background: var(--c-primary);
}

.seg-area {
  background: #E8912A;
}

.stack-val {
  flex: none;
  font-size: 12px;
  color: var(--t-weak);
  white-space: nowrap;
}

.lease-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 6px 0;
}

.lease-tile {
  background: #fafcff;
  border: 1px solid var(--bd);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.lease-value {
  font-size: 20px;
  font-weight: 700;
}

.lease-value span {
  font-size: 12px;
  font-weight: 400;
  color: var(--t-weak);
  margin-left: 2px;
}

.lease-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #909399;
}

.rank-badge.rank-1 {
  background: #f5a623;
}

.rank-badge.rank-2 {
  background: #9aa7b8;
}

.rank-badge.rank-3 {
  background: #cd7f32;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

/* 数据驾驶舱内部纵向节奏：交给 flex + gap，替代 el-row 之间的 margin-top:20 */
.dash-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--t-main);
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: var(--t-weak);
  margin-bottom: 4px;
}

.stat-card .stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #f5222d;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}

.chart-placeholder {
  padding: 20px 0;
}

.chart-bar-item {
  margin-bottom: 16px;
}

.chart-bar-label {
  font-size: 14px;
  color: var(--t-sub);
  margin-bottom: 8px;
}

.chart-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-bar {
  height: 24px;
  border-radius: 4px;
  min-width: 40px;
  transition: width 0.3s;
}

.chart-bar-value {
  font-size: 13px;
  color: var(--t-weak);
  white-space: nowrap;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  padding: 20px 0;
  border-bottom: 1px solid var(--bd);
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.trend-bar {
  width: 32px;
  background: linear-gradient(180deg, var(--c-primary) 0%, #69c0ff 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

.trend-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 8px;
}

.trend-value {
  font-size: 12px;
  color: var(--t-sub);
  margin-top: 4px;
}

.pie-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 20px 0;
}

.pie-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.pie-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.pie-legend-label {
  color: var(--t-sub);
  min-width: 56px;
}

.pie-legend-value {
  color: var(--t-weak);
}

.line-chart-container {
  padding: 10px 0;
}

.line-chart-svg {
  width: 100%;
  height: 220px;
}

.line-x-labels {
  display: flex;
  justify-content: space-between;
  padding: 8px 40px 0;
  font-size: 12px;
  color: var(--t-weak);
}
</style>
