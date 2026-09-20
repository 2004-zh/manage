<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资债全览</h2>
      <el-button type="primary" @click="exportData">导出报表</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">300</div>
          <div class="kpi-label">资产总数(处)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">56.15<span style="font-size:14px;font-weight:normal">亿元</span></div>
          <div class="kpi-label">资产总额(原值)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">12.38<span style="font-size:14px;font-weight:normal">亿元</span></div>
          <div class="kpi-label">负债总额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">43.77<span style="font-size:14px;font-weight:normal">亿元</span></div>
          <div class="kpi-label">净资产</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span>资产构成</span></template>
          <div ref="assetChartRef" style="height:300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><span>负债结构</span></template>
          <div ref="debtChartRef" style="height:300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>资债明细</span></template>
      <el-table :data="debtDetails" border stripe show-summary :summary-method="getSummary">
        <el-table-column prop="category" label="类别" width="150" />
        <el-table-column prop="item" label="项目" min-width="200" />
        <el-table-column prop="amount" label="金额(万元)" width="150" align="right" />
        <el-table-column prop="ratio" label="占比" width="100" align="right" />
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const assetChartRef = ref(null)
const debtChartRef = ref(null)

const debtDetails = ref([
  { category: '固定资产', item: '房屋及建筑物', amount: 482000, ratio: '85.8%', remark: '账面原值' },
  { category: '固定资产', item: '土地使用权', amount: 67500, ratio: '12.0%', remark: '划拨+出让' },
  { category: '固定资产', item: '在建工程', amount: 12000, ratio: '2.1%', remark: '3个在建项目' },
  { category: '固定资产', item: '其他资产', amount: 50, ratio: '0.01%', remark: '' },
  { category: '负债', item: '长期借款', amount: 85000, ratio: '68.7%', remark: '银行贷款' },
  { category: '负债', item: '应付账款', amount: 22800, ratio: '18.4%', remark: '工程款' },
  { category: '负债', item: '其他应付款', amount: 16000, ratio: '12.9%', remark: '' },
])

const getSummary = ({ columns, data }) => {
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    if (index === 2) {
      const total = data.reduce((s, r) => s + (r.amount || 0), 0)
      sums[index] = total.toLocaleString()
      return
    }
    sums[index] = ''
  })
  return sums
}

const exportData = () => {
  const headers = ['类别', '项目', '金额(万元)', '占比', '备注']
  const rows = debtDetails.value.map(r => [r.category, r.item, r.amount, r.ratio, r.remark])
  const total = debtDetails.value.reduce((s, r) => s + (r.amount || 0), 0)
  rows.push(['合计', '', total, '', ''])
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

onMounted(() => {
  const assetChart = echarts.init(assetChartRef.value)
  assetChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { value: 482000, name: '房屋及建筑物' },
        { value: 67500, name: '土地使用权' },
        { value: 12000, name: '在建工程' },
        { value: 50, name: '其他资产' },
      ],
      label: { formatter: '{b}\n{d}%' }
    }]
  })

  const debtChart = echarts.init(debtChartRef.value)
  debtChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: [
        { value: 85000, name: '长期借款' },
        { value: 22800, name: '应付账款' },
        { value: 16000, name: '其他应付款' },
      ],
      label: { formatter: '{b}\n{d}%' }
    }]
  })
})
</script>
