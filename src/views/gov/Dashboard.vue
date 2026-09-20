<template>
  <div class="gov-dashboard">
    <div class="page-header">
      <h2>监管数据看板</h2>
    </div>
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="4" v-for="kpi in kpiList" :key="kpi.label">
        <el-card class="kpi-card" shadow="hover">
          <div class="kpi-value" :style="{ color: kpi.color }">
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
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>资产权属分布</template>
          <div ref="ownershipPieRef" style="height: 260px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>资产类型分布</template>
          <div ref="typePieRef" style="height: 260px"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card>
          <template #header>分集团资产数量与面积</template>
          <div ref="barChartRef" style="height: 260px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="12">
        <el-card>
          <template #header>资产创收排行榜</template>
          <div ref="revenueRankRef" style="height: 260px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>预警摘要</span>
            <el-button type="primary" link size="small" style="float: right" @click="$router.push('/gov/risk')">查看全部</el-button>
          </template>
          <el-row :gutter="16">
            <el-col :span="6" v-for="w in warningCards" :key="w.label">
              <div class="warning-card" :style="{ borderColor: w.color }">
                <div class="warning-count" :style="{ color: w.color }">{{ w.count }}</div>
                <div class="warning-label">{{ w.label }}</div>
                <div class="warning-detail" v-if="w.byGroup">
                  <div v-for="(cnt, grp) in w.byGroup" :key="grp" class="warning-detail-row">
                    <span>{{ grp }}</span>
                    <span>{{ cnt }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
          <div style="margin-top: 16px; text-align: right">
            <el-button type="primary" link @click="$router.push('/gov/warning-tasks')">
              查看待办任务 →
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card>
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
                <span :style="{ color: row.rentalRate >= 75 ? '#52c41a' : '#fa8c16' }">{{ row.rentalRate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="idle" label="闲置" width="80" align="right" />
            <el-table-column label="闲置率" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.idleRate > 16 ? '#f5222d' : '#52c41a' }">{{ row.idleRate }}%</span>
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
                <span :style="{ color: row.unCert > 5 ? '#f5222d' : '#333' }">{{ row.unCert }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
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
  { label: '总资产(万元)', value: '600,164.83', color: '#1890ff', trend: 5.2 },
  { label: '资产总数', value: '6,354', color: '#722ed1', trend: 8.1 },
  { label: '运营总数', value: '59', color: '#13c2c2', trend: 12 },
  { label: '预警数', value: '41', color: '#f5222d', trend: -3 },
  { label: '出租率', value: (total.value.rentalRate ?? 0).toFixed(1), unit: '%', color: '#52c41a', trend: 1.2 },
  { label: '当年度实收(亿)', value: (total.value.yearActual ?? 0).toFixed(4), color: '#52c41a', trend: 6.8 }
])

const warningCards = [
  { label: '欠费预警', count: warningStore.warnings.arrears.total, color: '#fa8c16', byGroup: warningStore.warnings.arrears.byGroup },
  { label: '闲置超期', count: warningStore.warnings.idle.total, color: '#999', byGroup: warningStore.warnings.idle.byGroup },
  { label: '未办证', count: warningStore.warnings.uncert.total, color: '#f5222d', byGroup: warningStore.warnings.uncert.byGroup },
  { label: '合同临期', count: warningStore.warnings.expiring.total, color: '#1890ff', byGroup: warningStore.warnings.expiring.byGroup }
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
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data: [
        { value: 4200, name: '自持', itemStyle: { color: '#1890ff' } },
        { value: 1500, name: '委托管理', itemStyle: { color: '#52c41a' } },
        { value: 654, name: '其他', itemStyle: { color: '#faad14' } }
      ]
    }]
  })

  typePie = echarts.init(typePieRef.value)
  typePie.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      label: { formatter: '{b}\n{d}%', fontSize: 11 },
      data: [
        { value: 3800, name: '房产类', itemStyle: { color: '#1890ff' } },
        { value: 1200, name: '土地类', itemStyle: { color: '#52c41a' } },
        { value: 680, name: '设备类', itemStyle: { color: '#722ed1' } },
        { value: 420, name: '在建工程', itemStyle: { color: '#fa8c16' } },
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
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { top: 20, right: 60, bottom: 40, left: 50 },
    xAxis: { type: 'category', data: r.map(row => row.name.replace('集团', '').replace('公司', '')) },
    yAxis: [
      { type: 'value', name: '宗', position: 'left' },
      { type: 'value', name: '亿元', position: 'right' }
    ],
    series: [
      { name: '资产数量', type: 'bar', data: r.map(row => row.assets), itemStyle: { color: '#1890ff' }, barWidth: 24 },
      { name: '账面价值', type: 'line', yAxisIndex: 1, data: r.map(row => row.bookValue), itemStyle: { color: '#f5222d' }, lineStyle: { width: 2 }, symbol: 'circle', symbolSize: 8 }
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
          { offset: 0, color: '#1890ff' },
          { offset: 1, color: '#52c41a' }
        ]) }
      })),
      barWidth: 20,
      label: { show: true, position: 'right', formatter: '{c} 亿', fontSize: 11 }
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
.kpi-card {
  text-align: center;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
}

.kpi-unit {
  font-size: 13px;
  font-weight: 400;
  margin-left: 2px;
  color: #999;
}

.kpi-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.kpi-trend {
  margin-top: 6px;
  font-size: 12px;
}

.trend-up {
  color: #52c41a;
}

.trend-down {
  color: #f5222d;
}

.trend-desc {
  color: #999;
  margin-left: 4px;
}

.warning-card {
  text-align: center;
  padding: 16px 8px;
  border: 1px solid #f0f0f0;
  border-left: 3px solid;
  border-radius: 6px;
}

.warning-count {
  font-size: 28px;
  font-weight: 700;
}

.warning-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.warning-detail {
  margin-top: 8px;
  font-size: 11px;
  color: #999;
}

.warning-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 1px 8px;
}
</style>
