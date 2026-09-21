<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资债全览</h2>
      <el-button type="primary" @click="exportData">导出报表</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ total.assetCount }}</div>
          <div class="kpi-label">资产总数(处)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ total.assetValue }}<span style="font-size:14px;font-weight:normal">万元</span></div>
          <div class="kpi-label">资产总额(账面值)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ total.liability }}<span style="font-size:14px;font-weight:normal">万元</span></div>
          <div class="kpi-label">负债总额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ total.net }}<span style="font-size:14px;font-weight:normal">万元</span></div>
          <div class="kpi-label">净资产</div>
        </el-card>
      </el-col>
    </el-row>

    <div class="chart-row chart-row-1-1">
      <el-card shadow="never">
        <template #header><span>各公司资产分布</span></template>
        <div ref="assetChartRef" class="chart-box"></div>
      </el-card>
      <el-card shadow="never">
        <template #header><span>负债结构</span></template>
        <div ref="debtChartRef" class="chart-box"></div>
      </el-card>
    </div>

    <el-card shadow="never" class="fill">
      <template #header><span>资债明细</span></template>
      <el-table :data="overview" border stripe show-summary :summary-method="getSummary">
        <el-table-column prop="company" label="公司" width="150" />
        <el-table-column prop="assetCount" label="资产数(处)" width="100" align="right" />
        <el-table-column prop="assetValue" label="资产账面值(万元)" width="150" align="right" />
        <el-table-column prop="mortgage" label="抵押负债(万元)" width="140" align="right" />
        <el-table-column prop="arrears" label="欠费(万元)" width="120" align="right" />
        <el-table-column prop="net" label="净资产(万元)" width="140" align="right" />
        <el-table-column prop="ratio" label="负债率" width="100" align="right">
          <template #default="{ row }">{{ row.ratio }}%</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { useFinanceStore } from '../../store/finance'

const financeStore = useFinanceStore()

const assetChartRef = ref(null)
const debtChartRef = ref(null)
let assetChart = null
let debtChart = null

const overview = computed(() => financeStore.debtOverview)

const total = computed(() => {
  const t = financeStore.debtTotal
  return {
    assetCount: overview.value.reduce((s, r) => s + r.assetCount, 0),
    assetValue: t.assetValue,
    liability: t.liability,
    net: t.net
  }
})

const getSummary = ({ columns }) => {
  const t = financeStore.debtTotal
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property === 'assetCount') return overview.value.reduce((s, r) => s + r.assetCount, 0)
    if (col.property === 'assetValue') return t.assetValue
    if (col.property === 'mortgage') return t.mortgage
    if (col.property === 'arrears') return t.arrears
    if (col.property === 'net') return t.net
    if (col.property === 'ratio') return t.ratio + '%'
    return ''
  })
}

const exportData = () => {
  const headers = ['公司', '资产数(处)', '资产账面值(万元)', '抵押负债(万元)', '欠费(万元)', '净资产(万元)', '负债率']
  const rows = overview.value.map(r => [r.company, r.assetCount, r.assetValue, r.mortgage, r.arrears, r.net, r.ratio + '%'])
  const t = financeStore.debtTotal
  rows.push(['合计', overview.value.reduce((s, r) => s + r.assetCount, 0), t.assetValue, t.mortgage, t.arrears, t.net, t.ratio + '%'])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `资债报表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('资债报表导出成功')
}

function updateCharts() {
  if (!assetChart || !debtChart) return
  assetChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: overview.value.map(r => ({ value: r.assetValue, name: r.company })),
      label: { formatter: '{b}\n{d}%' }
    }]
  })
  debtChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { value: financeStore.debtTotal.mortgage, name: '抵押负债' },
        { value: financeStore.debtTotal.arrears, name: '欠费' }
      ],
      label: { formatter: '{b}\n{d}%' }
    }]
  })
}

onMounted(() => {
  assetChart = echarts.init(assetChartRef.value)
  debtChart = echarts.init(debtChartRef.value)
  updateCharts()
})

watch(overview, updateCharts, { deep: true })
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { margin: 0; font-size: 20px; }
.chart-box { min-height: 280px; height: 30vh; max-height: 340px; }
.kpi-card { text-align: center; }
.kpi-value { font-size: 24px; font-weight: 600; color: #303133; }
.kpi-label { font-size: 13px; color: #909399; margin-top: 8px; }
</style>
