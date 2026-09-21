<template>
  <div class="gov-statement">
    <div class="page-header">
      <h2>长乐区国资中心所出资企业固定资产情况表</h2>
      <div class="header-actions">
        <el-radio-group v-model="year" @change="onYearChange">
          <el-radio-button :value="2026">2026 年</el-radio-button>
          <el-radio-button :value="2025">2025 年</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="showExport = true">
          <el-icon><Download /></el-icon> 导出
        </el-button>
      </div>
    </div>

    <el-alert :title="tipText" type="info" :closable="false" show-icon />

    <el-table :data="tableData" border stripe class="table-card fill" :span-method="spanMethod" highlight-current-row @row-click="onRowClick" :summary-method="getSummaryRow" show-summary>
      <el-table-column prop="seq" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="企业名称" width="120" fixed />
      <el-table-column prop="assets" label="资产宗数" width="90" align="right" />
      <el-table-column prop="bookValue" label="账面价值" width="110" align="right">
        <template #default="{ row }">{{ row.bookValue.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column prop="rented" label="已出租宗数" width="100" align="right" />
      <el-table-column prop="rentalRate" label="出租率" width="80" align="right">
        <template #default="{ row }">
          <span :style="{ color: row.rentalRate < 70 ? 'var(--c-danger)' : 'var(--c-success)' }">{{ row.rentalRate.toFixed(1) }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="idle" label="闲置宗数" width="90" align="right" />
      <el-table-column prop="idleRate" label="闲置率" width="80" align="right">
        <template #default="{ row }">
          <span :style="{ color: row.idleRate > 16 ? 'var(--c-warning)' : 'var(--c-success)' }">{{ row.idleRate.toFixed(1) }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="cumReceivable" label="累计应收租金" width="110" align="right">
        <template #default="{ row }">{{ row.cumReceivable.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column prop="cumActual" label="累计实收租金" width="110" align="right">
        <template #default="{ row }">{{ row.cumActual.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column prop="yearReceivable" label="当年度应收" width="110" align="right">
        <template #default="{ row }">{{ row.yearReceivable.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column prop="yearActual" label="当年度实收" width="110" align="right">
        <template #default="{ row }">{{ row.yearActual.toFixed(4) }}</template>
      </el-table-column>
      <el-table-column prop="newCert" label="当年新增办证" width="110" align="right" />
      <el-table-column prop="unCert" label="未办证" width="80" align="right">
        <template #default="{ row }">
          <span :style="{ color: row.unCert > 4 ? 'var(--c-danger)' : 'var(--t-main)' }">{{ row.unCert }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.name !== '合计'" type="primary" link size="small" @click.stop="openDrill(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 查看详情抽屉 -->
    <el-drawer v-model="drillVisible" :title="`${drillRow?.name} — 明细`" size="60%" direction="rtl">
      <el-tabs v-model="drillTab">
        <el-tab-pane label="资产清单" name="assets">
          <el-table :data="drillAssets" border size="small" max-height="500">
            <el-table-column prop="id" label="编号" width="90" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="location" label="位置" width="100" />
            <el-table-column prop="type" label="业态" width="90" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="area" label="面积㎡" width="90" align="right" />
            <el-table-column prop="bookValue" label="账面价值(万元)" width="120" align="right" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`闲置清单（${drillIdle.length}）`" name="idle">
          <el-table :data="drillIdle" border size="small" max-height="500">
            <el-table-column prop="id" label="编号" width="90" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="location" label="位置" width="100" />
            <el-table-column prop="type" label="业态" width="90" />
            <el-table-column prop="area" label="面积㎡" width="90" align="right" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane :label="`未办证清单（${drillUncert.length}）`" name="uncert">
          <el-table :data="drillUncert" border size="small" max-height="500">
            <el-table-column prop="id" label="编号" width="90" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="certStatus" label="权证状态" width="150">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.certStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="100" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>

    <!-- 导出弹窗 -->
    <el-dialog v-model="showExport" title="导出报表" width="400px">
      <el-radio-group v-model="exportType">
        <el-radio value="all">导出全部（4 家集团 + 合计）</el-radio>
        <el-radio value="single">按集团导出</el-radio>
      </el-radio-group>
      <el-select v-if="exportType === 'single'" v-model="exportGroup" style="width: 100%; margin-top: 12px">
        <el-option v-for="r in rows" :key="r.name" :label="r.name" :value="r.name" />
      </el-select>
      <template #footer>
        <el-button @click="showExport = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAssetStore } from '../../store/asset'
import { useReportStore } from '../../store/report'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const assetStore = useAssetStore()
const reportStore = useReportStore()

function getSummary(year) {
  const companies = ['城投集团', '产投集团', '水投集团', '领航公司']
  const rows = companies.map(name => {
    const data = reportStore.computeCompanyData(name)
    return { ...data, newCert: 0 }
  })
  const total = {
    name: '合计',
    assets: 0, bookValue: 0, rented: 0, idle: 0,
    cumReceivable: 0, cumActual: 0, yearReceivable: 0, yearActual: 0,
    newCert: 0, unCert: 0
  }
  rows.forEach(r => {
    total.assets += r.assets
    total.bookValue += r.bookValue
    total.rented += r.rented
    total.idle += r.idle
    total.cumReceivable += r.cumReceivable
    total.cumActual += r.cumActual
    total.yearReceivable += r.yearReceivable
    total.yearActual += r.yearActual
    total.newCert += r.newCert
    total.unCert += r.unCert
  })
  total.bookValue = Math.round(total.bookValue * 100) / 100
  total.rentalRate = total.assets ? Math.round(total.rented / total.assets * 1000) / 10 : 0
  total.idleRate = total.assets ? Math.round(total.idle / total.assets * 1000) / 10 : 0
  total.cumReceivable = Math.round(total.cumReceivable * 10000) / 10000
  total.cumActual = Math.round(total.cumActual * 10000) / 10000
  total.yearReceivable = Math.round(total.yearReceivable * 10000) / 10000
  total.yearActual = Math.round(total.yearActual * 10000) / 10000
  return { rows, total }
}

const year = ref(2026)
const { rows, total } = getSummary(year.value)

const tipText = computed(() =>
  `口径提示：存量指标（宗数、账面价值、出租/闲置宗数、未办证）取 ${year.value} 年度期末时点数；流量指标（当年度应收/实收租金、新增办证）取 ${year.value} 年度期间发生额；累计指标取截至 ${year.value} 年度期末累计值。金额单位：亿元。`
)

const tableData = computed(() => {
  const d = getSummary(year.value)
  return d.rows.map((r, i) => ({ ...r, seq: i + 1 })).concat({ ...d.total, seq: 5, name: '合计' })
})

function onYearChange() {
  // tableData is computed, auto-updates
}

function statusTagType(status) {
  if (status === '已出租' || status === '部分出租') return 'success'
  if (status === '闲置') return 'info'
  if (status === '自用') return ''
  return 'warning'
}

// 下钻
const drillVisible = ref(false)
const drillRow = ref(null)
const drillTab = ref('assets')
const drillAssets = ref([])
const drillIdle = ref([])
const drillUncert = ref([])

function onRowClick(row) {
  // highlight only
}

function openDrill(row) {
  drillRow.value = row
  drillTab.value = 'assets'
  const assets = row.name === '城投集团' ? assetStore.assets : []
  drillAssets.value = assets
  drillIdle.value = assets.filter(a => a.status === '闲置')
  drillUncert.value = assets.filter(a => !a.certStatus.includes('已办证'))
  drillVisible.value = true
}

// 合计行
function getSummaryRow({ columns, data }) {
  const lastRow = data[data.length - 1]
  return columns.map((_, i) => {
    if (i === 0) return ''
    if (i === 1) return lastRow.name
    const key = columns[i].property
    if (!key || !lastRow[key] && lastRow[key] !== 0) return ''
    const val = lastRow[key]
    if (['bookValue', 'cumReceivable', 'cumActual', 'yearReceivable', 'yearActual'].includes(key)) {
      return val.toFixed(4)
    }
    if (['rentalRate', 'idleRate'].includes(key)) {
      return val.toFixed(1) + '%'
    }
    return String(val)
  })
}

function spanMethod({ row }) {
  if (row.name === '合计') {
    return { rowspan: 1, colspan: 1 }
  }
}

// 导出
const showExport = ref(false)
const exportType = ref('all')
const exportGroup = ref('城投集团')

function handleExport() {
  const data = exportType.value === 'all' ? tableData.value : tableData.value.filter(r => r.name === exportGroup.value || r.name === '合计')
  const headers = ['序号', '公司', '资产总数', '账面原值(亿元)', '已出租', '闲置', '出租率(%)', '闲置率(%)', '累计应收(亿元)', '累计实收(亿元)', '年度应收(亿元)', '年度实收(亿元)', '新增办证', '未办证']
  const rows = data.map(r => [r.seq, r.name, r.assets, r.bookValue, r.rented, r.idle, r.rentalRate, r.idleRate, r.cumReceivable, r.cumActual, r.yearReceivable, r.yearActual, r.newCert, r.unCert])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `固定资产情况表_${year.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
  showExport.value = false
  ElMessage.success('报表已导出')
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h2 {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
