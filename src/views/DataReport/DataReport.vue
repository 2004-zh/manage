<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数据报表</h2>
      <div>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>
    <el-card class="fill">

      <!-- Tab切换 -->
      <el-tabs v-model="activeTab">
        <el-tab-pane label="资产统计" name="asset">
          <div class="grid-4">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #1668DC">{{ assetStats.total }}</div>
              <div class="stat-label">资产总数</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #18A058">{{ assetStats.rented }}</div>
              <div class="stat-label">已出租</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">{{ assetStats.selfUse }}</div>
              <div class="stat-label">自用</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #D93026">{{ assetStats.idle }}</div>
              <div class="stat-label">闲置</div>
            </el-card>
          </div>

          <el-card style="margin-top: 16px">
            <template #header>
              <span>资产类型分布</span>
            </template>
            <div class="chart-container">
              <div v-for="item in assetTypeData" :key="item.name" class="chart-bar-item">
                <div class="chart-bar-label">{{ item.name }}</div>
                <div class="chart-bar-wrapper">
                  <div class="chart-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                  <span class="chart-bar-value">{{ item.count }} ({{ item.percent }}%)</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="租赁统计" name="lease">
          <div class="grid-3">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #18A058">{{ leaseStats.occupancyRate }}%</div>
              <div class="stat-label">出租率</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">{{ leaseStats.expiringThisMonth }}</div>
              <div class="stat-label">本月到期</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #1668DC">{{ leaseStats.newThisMonth }}</div>
              <div class="stat-label">本月新签</div>
            </el-card>
          </div>

          <el-card style="margin-top: 16px">
            <template #header>
              <span>租赁趋势（近12个月）</span>
            </template>
            <div class="trend-chart">
              <div v-for="item in leaseTrend" :key="item.month" class="trend-item">
                <div class="trend-bar" :style="{ height: item.rate + '%' }"></div>
                <div class="trend-label">{{ item.month }}</div>
                <div class="trend-value">{{ item.rate }}%</div>
              </div>
            </div>
          </el-card>

          <el-table :data="leaseExpiringList" style="width: 100%; margin-top: 16px">
            <el-table-column prop="contractNo" label="合同编号" width="140" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="tenant" label="承租方" min-width="120" />
            <el-table-column prop="endDate" label="到期日期" width="110" />
            <el-table-column prop="remainDays" label="剩余天数" width="100">
              <template #default="{ row }">
                <el-tag :type="row.remainDays <= 7 ? 'danger' : 'warning'" size="small">{{ row.remainDays }}天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="台账报表" name="ledger">
          <el-table :data="ledgerReport" style="width: 100%">
            <el-table-column prop="assetType" label="资产类型" width="120" />
            <el-table-column prop="totalCount" label="总数" width="100" />
            <el-table-column prop="rentedCount" label="已出租" width="100" />
            <el-table-column prop="selfUseCount" label="自用" width="100" />
            <el-table-column prop="vacantCount" label="闲置" width="100" />
            <el-table-column prop="totalArea" label="总面积(㎡)" width="120" />
            <el-table-column prop="rentedArea" label="出租面积(㎡)" width="120" />
            <el-table-column prop="occupancyRate" label="出租率" width="100">
              <template #default="{ row }">{{ row.occupancyRate }}%</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="缴费统计" name="payment">
          <div class="grid-4">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #1668DC">¥{{ wanText(paymentStats.receivable) }}万</div>
              <div class="stat-label">年度应收</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #18A058">¥{{ wanText(paymentStats.received) }}万</div>
              <div class="stat-label">已收金额</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">¥{{ wanText(paymentStats.pending) }}万</div>
              <div class="stat-label">待收金额</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #D93026">{{ paymentStats.collectionRate }}%</div>
              <div class="stat-label">收缴率</div>
            </el-card>
          </div>

          <el-card style="margin-top: 16px">
            <template #header>
              <span>月度收缴趋势</span>
            </template>
            <div class="trend-chart">
              <div v-for="item in paymentTrend" :key="item.month" class="trend-item">
                <div class="trend-bar" :style="{ height: item.rate + '%' }"></div>
                <div class="trend-label">{{ item.month }}</div>
                <div class="trend-value">{{ item.rate }}%</div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useFinanceStore } from '../../store/finance'
import { normalizeStatus, formatMoney, todayISO, toISODate } from '../../utils/model'

const activeTab = ref('asset')
const dateRange = ref([])

// P1：报表不再内置写死数字，全部由资产 / 合同 / 财务主数据实时聚合
const assetStore = useAssetStore()
const contractStore = useContractStore()
const financeStore = useFinanceStore()

const assets = computed(() => assetStore.visibleAssets || [])
const contracts = computed(() => contractStore.visibleContracts || [])
const bills = computed(() => financeStore.bills || [])

const TYPE_COLORS = ['#1668DC', '#18A058', '#E8912A', '#722ed1', '#13c2c2', '#D93026']
const pad2 = n => String(n).padStart(2, '0')
const statusOf = a => normalizeStatus('assetStatus', a.status)
const isRented = s => s === '已出租' || s === '部分出租'

function inRange(iso, range) {
  if (!range || range.length !== 2 || !range[0] || !range[1]) return true
  const s = toISODate(range[0])
  const e = toISODate(range[1])
  if (!s || !e || !iso) return true
  return iso >= s && iso <= e
}

function last12Months() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { ym: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, label: `${d.getMonth() + 1}月` }
  })
}

const assetStats = computed(() => {
  const list = assets.value
  return {
    total: list.length,
    rented: list.filter(a => isRented(statusOf(a))).length,
    selfUse: list.filter(a => statusOf(a) === '自用').length,
    idle: list.filter(a => statusOf(a) === '闲置').length
  }
})

const assetTypeData = computed(() => {
  const map = new Map()
  assets.value.forEach(a => {
    const key = a.assetCategory || a.type || '其他'
    map.set(key, (map.get(key) || 0) + 1)
  })
  const total = assets.value.length || 1
  return Array.from(map.entries())
    .sort((x, y) => y[1] - x[1])
    .map(([name, count], i) => ({
      name, count,
      percent: Math.round(count / total * 1000) / 10,
      color: TYPE_COLORS[i % TYPE_COLORS.length]
    }))
})

const scopedContracts = computed(() =>
  contracts.value.filter(c => inRange(c.startDate || c.endDate, dateRange.value))
)

const leaseStats = computed(() => {
  const ym = todayISO().slice(0, 7)
  const list = scopedContracts.value
  const total = assets.value.length || 1
  return {
    occupancyRate: Math.round(assetStats.value.rented / total * 1000) / 10,
    expiringThisMonth: list.filter(c => (c.endDate || '').slice(0, 7) === ym).length,
    newThisMonth: list.filter(c => (c.startDate || '').slice(0, 7) === ym).length
  }
})

const leaseTrend = computed(() => {
  const total = assets.value.length || 1
  return last12Months().map(m => {
    const from = `${m.ym}-01`
    const to = `${m.ym}-31`
    const active = contracts.value.filter(c =>
      (!c.startDate || c.startDate <= to) && (!c.endDate || c.endDate >= from)
    ).length
    return { month: m.label, rate: Math.min(100, Math.round(active / total * 1000) / 10) }
  })
})

const leaseExpiringList = computed(() => {
  const today = todayISO()
  return contracts.value
    .filter(c => c.endDate && c.endDate >= today && normalizeStatus('contractStatus', c.status) !== '已终止')
    .map(c => ({
      contractNo: c.id,
      assetName: c.assetName || '',
      tenant: c.tenant || '',
      endDate: c.endDate,
      remainDays: Math.max(0, Math.round(
        (new Date(`${c.endDate}T00:00:00`) - new Date(`${today}T00:00:00`)) / 86400000
      ))
    }))
    .filter(c => c.remainDays <= 90 && inRange(c.endDate, dateRange.value))
    .sort((a, b) => a.remainDays - b.remainDays)
    .slice(0, 20)
})

const ledgerReport = computed(() => {
  const map = new Map()
  assets.value.forEach(a => {
    const key = a.assetCategory || a.type || '其他'
    if (!map.has(key)) {
      map.set(key, { assetType: key, totalCount: 0, rentedCount: 0, selfUseCount: 0, vacantCount: 0, totalArea: 0, rentedArea: 0 })
    }
    const r = map.get(key)
    const s = statusOf(a)
    const area = Number(a.area) || 0
    r.totalCount++
    if (isRented(s)) { r.rentedCount++; r.rentedArea += Number(a.leaseArea) || area }
    else if (s === '自用') r.selfUseCount++
    else if (s === '闲置') r.vacantCount++
    r.totalArea += area
  })
  return Array.from(map.values()).map(r => ({
    ...r,
    totalArea: Math.round(r.totalArea * 100) / 100,
    rentedArea: Math.round(r.rentedArea * 100) / 100,
    occupancyRate: r.totalCount ? Math.round(r.rentedCount / r.totalCount * 1000) / 10 : 0
  }))
})

const scopedBills = computed(() =>
  bills.value.filter(b => inRange(b.billMonth ? `${b.billMonth}-01` : b.dueDate, dateRange.value))
)

const paymentStats = computed(() => {
  const list = scopedBills.value
  const receivable = list.reduce((s, b) => s + (Number(b.receivable) || 0), 0)
  const received = list.reduce((s, b) => s + (Number(b.received) || 0), 0)
  return {
    receivable,
    received,
    pending: Math.max(0, receivable - received),
    collectionRate: receivable ? Math.round(received / receivable * 1000) / 10 : 0
  }
})

const paymentTrend = computed(() =>
  last12Months().map(m => {
    const list = scopedBills.value.filter(b => (b.billMonth || '').slice(0, 7) === m.ym)
    const rec = list.reduce((s, b) => s + (Number(b.receivable) || 0), 0)
    const got = list.reduce((s, b) => s + (Number(b.received) || 0), 0)
    return { month: m.label, rate: rec ? Math.round(got / rec * 1000) / 10 : 0 }
  })
)

const wanText = yuan => formatMoney(yuan, { unit: '万元', digits: 0 })

const handleExport = () => {
  let headers = []
  let rows = []
  const tab = activeTab.value

  if (tab === 'asset') {
    headers = ['资产类型', '数量', '占比(%)']
    rows = assetTypeData.value.map(i => [i.name, i.count, i.percent])
  } else if (tab === 'lease') {
    headers = ['合同编号', '资产名称', '承租方', '到期日期', '剩余天数']
    rows = leaseExpiringList.value.map(i => [i.contractNo, i.assetName, i.tenant, i.endDate, i.remainDays + '天'])
  } else if (tab === 'ledger') {
    headers = ['资产类型', '总数', '已出租', '自用', '闲置', '总面积(㎡)', '出租面积(㎡)', '出租率(%)']
    rows = ledgerReport.value.map(i => [i.assetType, i.totalCount, i.rentedCount, i.selfUseCount, i.vacantCount, i.totalArea, i.rentedArea, i.occupancyRate])
  } else if (tab === 'payment') {
    headers = ['月份', '收缴率(%)']
    rows = paymentTrend.value.map(i => [i.month, i.rate])
  }

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `报表_${tab}_${todayISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报表导出成功')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  font-family: var(--font-num);
}

.stat-label {
  font-size: 14px;
  color: var(--t-weak);
}

.chart-container {
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
  border-radius: var(--r-sm);
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
  border-radius: var(--r-sm) var(--r-sm) 0 0;
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
</style>
