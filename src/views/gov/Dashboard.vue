<template>
  <div class="gov-dashboard">
    <div class="page-header">
      <h2>监管数据看板</h2>
    </div>
    <div class="grid-4 kpi-row">
      <el-card v-for="kpi in kpiList" :key="kpi.label" class="kpi-card" shadow="hover">
        <div class="kpi-value">
          {{ kpi.value }}<span class="kpi-unit">{{ kpi.unit }}</span>
        </div>
        <div class="kpi-label">{{ kpi.label }}</div>
        <div class="kpi-trend" v-if="kpi.trend">
          <span :class="kpi.trend > 0 ? 'trend-up' : 'trend-down'">
            {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
          </span>
          <span class="trend-desc">较上年</span>
        </div>
      </el-card>
    </div>

    <div class="chart-row chart-row-1-1">
      <el-card class="chart-card">
        <template #header>资产权属分布</template>
        <div ref="ownershipPieRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>资产类型分布</template>
        <div ref="typePieRef" class="chart-box"></div>
      </el-card>
    </div>

    <el-card class="chart-card full-width">
      <template #header>分集团资产数量与面积</template>
      <div ref="barChartRef" class="chart-box chart-box-wide"></div>
    </el-card>

    <div class="chart-row chart-row-1-1">
      <el-card class="chart-card">
        <template #header>资产创收排行榜</template>
        <div ref="revenueRankRef" class="chart-box"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>预警摘要</span>
          <el-button type="primary" link size="small" style="float: right" @click="$router.push('/gov/risk')">查看全部</el-button>
        </template>
        <div class="grid-2 warning-cards">
          <div class="warning-card" v-for="w in warningCards" :key="w.label">
            <div class="warning-count">{{ w.count }}</div>
            <div class="warning-label">{{ w.label }}</div>
            <div class="warning-detail" v-if="w.byGroup">
              <div v-for="(cnt, grp) in w.byGroup" :key="grp" class="warning-detail-row">
                <span>{{ grp }}</span>
                <span>{{ cnt }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="warning-footer">
          <el-button type="primary" link @click="$router.push('/gov/warning-tasks')">
            查看待办任务 →
          </el-button>
        </div>
      </el-card>
    </div>

    <el-card class="full-width">
      <template #header>
        <span>各集团经营指标</span>
        <el-radio-group v-model="metricYear" size="small" style="float: right">
          <el-radio-button :value="2026">2026年</el-radio-button>
          <el-radio-button :value="2025">2025年</el-radio-button>
        </el-radio-group>
      </template>
      <el-table :data="metricRows" stripe size="small" show-summary :summary-method="getMetricSummary">
        <el-table-column prop="name" label="集团" width="120" />
        <el-table-column prop="assets" label="资产数" width="80" align="right" />
        <el-table-column prop="bookValue" label="账面价值(亿)" width="120" align="right" />
        <el-table-column prop="rented" label="在租" width="80" align="right" />
        <el-table-column label="出租率" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.rentalRate >= 75 ? 'var(--c-success)' : 'var(--c-warning)' }">{{ row.rentalRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="idle" label="闲置" width="80" align="right" />
        <el-table-column label="闲置率" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.idleRate > 16 ? 'var(--c-danger)' : 'var(--c-success)' }">{{ row.idleRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="累计应收(亿)" width="120" align="right">
          <template #default="{ row }">{{ row.cumReceivable.toFixed(4) }}</template>
        </el-table-column>
        <el-table-column label="累计实收(亿)" width="120" align="right">
          <template #default="{ row }">{{ row.cumActual.toFixed(4) }}</template>
        </el-table-column>
        <el-table-column label="收缴率" width="100" align="right">
          <template #default="{ row }">
            <span>{{ (row.cumReceivable > 0 ? (row.cumActual / row.cumReceivable * 100).toFixed(1) : 0) }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="newCert" label="新办证" width="80" align="right" />
        <el-table-column prop="unCert" label="未办证" width="80" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.unCert > 5 ? 'var(--c-danger)' : 'var(--t-main)' }">{{ row.unCert }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useReportStore } from '../../store/report'
import { useWarningStore } from '../../store/warning'

const reportStore = useReportStore()
const warningStore = useWarningStore()

const metricYear = ref(2026)

const rows = computed(() => reportStore.getAllCompaniesLatestData())
const total = computed(() => {
  const data = rows.value
  const t = { assets: 0, bookValue: 0, rented: 0, idle: 0, cumReceivable: 0, cumActual: 0, yearReceivable: 0, yearActual: 0, newCert: 0, unCert: 0, rentalRate: 0, idleRate: 0 }
  data.forEach(r => {
    t.assets += (r.assets || 0)
    t.bookValue += (r.bookValue || 0)
    t.rented += (r.rented || 0)
    t.idle += (r.idle || 0)
    t.cumReceivable += (r.cumReceivable || 0)
    t.cumActual += (r.cumActual || 0)
    t.yearReceivable += (r.yearReceivable || 0)
    t.yearActual += (r.yearActual || 0)
    t.newCert += (r.newCert || 0)
    t.unCert += (r.unCert || 0)
  })
  t.bookValue = Math.round(t.bookValue * 100) / 100
  t.rentalRate = t.assets > 0 ? Math.round(t.rented / t.assets * 1000) / 10 : 0
  t.idleRate = t.assets > 0 ? Math.round(t.idle / t.assets * 1000) / 10 : 0
  return t
})

const kpiList = computed(() => [
  { label: '总资产(万元)', value: '600,164.83', color: '#1668DC', trend: 5.2 },
  { label: '资产总数', value: '6,354', color: '#722ed1', trend: 8.1 },
  { label: '运营总数', value: '59', color: '#13c2c2', trend: 12 },
  { label: '预警数', value: '41', color: '#D93026', trend: -3 },
  { label: '出租率', value: (total.value.rentalRate ?? 0).toFixed(1), unit: '%', color: '#18A058', trend: 1.2 },
  { label: '当年度实收(亿)', value: (total.value.yearActual ?? 0).toFixed(4), color: '#18A058', trend: 6.8 }
])

const warningCards = [
  { label: '欠费预警', count: warningStore.warnings.arrears.total, color: '#E8912A', byGroup: warningStore.warnings.arrears.byGroup },
  { label: '闲置超期', count: warningStore.warnings.idle.total, color: '#94A3B8', byGroup: warningStore.warnings.idle.byGroup },
  { label: '未办证', count: warningStore.warnings.uncert.total, color: '#D93026', byGroup: warningStore.warnings.uncert.byGroup },
  { label: '合同临期', count: warningStore.warnings.expiring.total, color: '#1668DC', byGroup: warningStore.warnings.expiring.byGroup }
]

const metricRows = computed(() => rows.value)

const ownershipPieRef = ref(null)
const typePieRef = ref(null)
const barChartRef = ref(null)
const revenueRankRef = ref(null)
let ownershipPie = null
let typePie = null
let barChart = null
let revenueRank = null

const chartInstances = computed(() => [ownershipPie, typePie, barChart, revenueRank])

onMounted(() => {
  ownershipPie = echarts.init(ownershipPieRef.value)
  ownershipPie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%', fontSize: 12 },
      data: [
        { value: 4200, name: '自持', itemStyle: { color: '#1668DC' } },
        { value: 1500, name: '委托管理', itemStyle: { color: '#18A058' } },
        { value: 654, name: '其他', itemStyle: { color: '#E8912A' } }
      ]
    }]
  })

  typePie = echarts.init(typePieRef.value)
  typePie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%', fontSize: 12 },
      data: [
        { value: 3800, name: '房产类', itemStyle: { color: '#1668DC' } },
        { value: 1200, name: '土地类', itemStyle: { color: '#18A058' } },
        { value: 680, name: '设备类', itemStyle: { color: '#722ed1' } },
        { value: 420, name: '在建工程', itemStyle: { color: '#E8912A' } },
        { value: 254, name: '无形资产', itemStyle: { color: '#13c2c2' } }
      ]
    }]
  })

  barChart = echarts.init(barChartRef.value)
  updateBarChart()

  revenueRank = echarts.init(revenueRankRef.value)
  updateRevenueRank()

  window.addEventListener('resize', handleResize)
})

function updateBarChart() {
  const r = metricRows.value
  barChart?.setOption({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    grid: { top: 20, right: 60, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: r.map(row => row.name.replace('集团', '').replace('公司', '')) },
    yAxis: [
      { type: 'value', name: '宗', position: 'left' },
      { type: 'value', name: '亿元', position: 'right' }
    ],
    series: [
      { name: '资产数量', type: 'bar', data: r.map(row => row.assets), itemStyle: { color: '#1668DC' }, barWidth: 24 },
      { name: '账面价值', type: 'line', yAxisIndex: 1, data: r.map(row => row.bookValue), itemStyle: { color: '#D93026' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 8 }
    ]
  })
}

function updateRevenueRank() {
  const r = [...metricRows.value].sort((a, b) => b.cumActual - a.cumActual)
  revenueRank?.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}: {c} 亿元' },
    grid: { top: 10, right: 60, bottom: 10, left: 80 },
    xAxis: { type: 'value', name: '亿元' },
    yAxis: { type: 'category', data: r.map(row => row.name.replace('集团', '').replace('公司', '')) },
    series: [{
      type: 'bar',
      data: r.map(row => ({
        value: row.cumActual,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1668DC' },
          { offset: 1, color: '#18A058' }
        ]) }
      })),
      barWidth: 20,
      label: { show: true, position: 'right', formatter: '{c} 亿', fontSize: 12 }
    }]
  })
}

watch(metricYear, () => {
  updateBarChart()
  updateRevenueRank()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ownershipPie?.dispose()
  typePie?.dispose()
  barChart?.dispose()
  revenueRank?.dispose()
})

function handleResize() {
  ownershipPie?.resize()
  typePie?.resize()
  barChart?.resize()
  revenueRank?.resize()
}

function getMetricSummary(param) {
  const { columns, data } = param
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    const row = data.reduce((acc, r) => {
      const key = col.property
      if (key && typeof r[key] === 'number') return acc + r[key]
      if (index === 4) return acc + (r.rentalRate || 0)
      if (index === 6) return acc + (r.idleRate || 0)
      if (index === 7) return acc + (r.cumReceivable || 0)
      if (index === 8) return acc + (r.cumActual || 0)
      return acc
    }, 0)
    if (index === 4) { sums[index] = (row / data.length).toFixed(1) + '%'; return }
    if (index === 6) { sums[index] = (row / data.length).toFixed(1) + '%'; return }
    if (index === 7) { sums[index] = row.toFixed(4); return }
    if (index === 8) { sums[index] = row.toFixed(4); return }
    if (index === 9) {
      const totalR = data.reduce((a, r) => a + r.cumReceivable, 0)
      const totalA = data.reduce((a, r) => a + r.cumActual, 0)
      sums[index] = (totalR > 0 ? (totalA / totalR * 100).toFixed(1) : 0) + '%'
      return
    }
    sums[index] = typeof row === 'number' ? Math.round(row * 100) / 100 : row
  })
  return sums
}
</script>

<style scoped>
/* KPI：一行 4 列交给全局 .grid-4；配色按语义映射到主题变量，替代模板里的自创色 */
.kpi-row > :nth-child(1) .kpi-value { color: var(--c-primary); }
.kpi-row > :nth-child(2) .kpi-value { color: var(--c-info); }
.kpi-row > :nth-child(3) .kpi-value { color: var(--c-accent); }
.kpi-row > :nth-child(4) .kpi-value { color: var(--c-danger); }
.kpi-row > :nth-child(5) .kpi-value,
.kpi-row > :nth-child(6) .kpi-value { color: var(--c-success); }

.kpi-trend {
  margin-top: 6px;
  font-size: 12px;
}

.trend-up {
  color: var(--c-success);
}

.trend-down {
  color: var(--c-danger);
}

.trend-desc {
  color: var(--t-weak);
  margin-left: 4px;
}

/* 图表卡：卡片拉伸等高，图表容器吃掉卡内剩余高度，避免写死 260px 造成的卡内留白 */
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.chart-box {
  flex: 1 1 auto;
  min-height: 260px;
}

.chart-box-wide {
  flex: none;
  height: clamp(280px, 36vh, 440px);
}

.warning-card {
  text-align: center;
  padding: 16px 8px;
  border: 1px solid var(--bd);
  border-left: 3px solid var(--t-weak);
  border-radius: var(--r-sm);
}

.warning-count {
  font-size: 28px;
  font-weight: 700;
}

.warning-label {
  font-size: 13px;
  color: var(--t-sub);
  margin-top: 4px;
}

.warning-detail {
  margin-top: 8px;
  font-size: 12px;
  color: var(--t-weak);
}

.warning-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 1px 8px;
}

.warning-footer {
  margin-top: 12px;
  text-align: right;
}

.warning-cards > :nth-child(1) .warning-card { border-left-color: var(--c-warning); }
.warning-cards > :nth-child(1) .warning-count { color: var(--c-warning); }
.warning-cards > :nth-child(2) .warning-card { border-left-color: var(--st-idle); }
.warning-cards > :nth-child(2) .warning-count { color: var(--st-idle); }
.warning-cards > :nth-child(3) .warning-card { border-left-color: var(--c-danger); }
.warning-cards > :nth-child(3) .warning-count { color: var(--c-danger); }
.warning-cards > :nth-child(4) .warning-card { border-left-color: var(--c-primary); }
.warning-cards > :nth-child(4) .warning-count { color: var(--c-primary); }
</style>
