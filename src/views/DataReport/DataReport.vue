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
              <div class="stat-value" style="color: #1668DC">1,286</div>
              <div class="stat-label">资产总数</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #18A058">980</div>
              <div class="stat-label">已出租</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">256</div>
              <div class="stat-label">自用</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #D93026">50</div>
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
              <div class="stat-value" style="color: #18A058">98.5%</div>
              <div class="stat-label">出租率</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">12</div>
              <div class="stat-label">本月到期</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #1668DC">8</div>
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
            <el-table-column prop="tenant" label="承租方" width="120" />
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
              <div class="stat-value" style="color: #1668DC">¥2,580万</div>
              <div class="stat-label">年度应收</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #18A058">¥2,350万</div>
              <div class="stat-label">已收金额</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #E8912A">¥180万</div>
              <div class="stat-label">待收金额</div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value" style="color: #D93026">91.1%</div>
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'

const activeTab = ref('asset')
const dateRange = ref([])

const assetTypeData = ref([
  { name: '保障房', count: 500, percent: 38.9, color: '#1668DC' },
  { name: '商铺', count: 300, percent: 23.3, color: '#18A058' },
  { name: '写字楼', count: 200, percent: 15.6, color: '#E8912A' },
  { name: '厂房', count: 186, percent: 14.5, color: '#722ed1' },
  { name: '农贸市场', count: 100, percent: 7.7, color: '#13c2c2' }
])

const leaseTrend = ref([
  { month: '10月', rate: 95.2 },
  { month: '11月', rate: 95.8 },
  { month: '12月', rate: 96.1 },
  { month: '1月', rate: 96.5 },
  { month: '2月', rate: 96.8 },
  { month: '3月', rate: 97.2 },
  { month: '4月', rate: 97.5 },
  { month: '5月', rate: 97.8 },
  { month: '6月', rate: 98.0 },
  { month: '7月', rate: 98.2 },
  { month: '8月', rate: 98.3 },
  { month: '9月', rate: 98.5 }
])

const leaseExpiringList = ref([
  { contractNo: 'HT2024010', assetName: '万达广场商铺A101', tenant: 'XX餐饮公司', endDate: '2026-09-20', remainDays: 5 },
  { contractNo: 'HT2025015', assetName: '阳光花园3号楼301室', tenant: '王五', endDate: '2026-09-25', remainDays: 10 },
  { contractNo: 'HT2025020', assetName: '万达广场商铺B102', tenant: 'XX服装店', endDate: '2026-09-28', remainDays: 13 },
  { contractNo: 'HT2025025', assetName: '国贸写字楼B座601', tenant: 'XX贸易公司', endDate: '2026-09-30', remainDays: 15 }
])

const ledgerReport = ref([
  { assetType: '保障房', totalCount: 500, rentedCount: 480, selfUseCount: 10, vacantCount: 10, totalArea: 30000, rentedArea: 28800, occupancyRate: 96.0 },
  { assetType: '商铺', totalCount: 300, rentedCount: 280, selfUseCount: 10, vacantCount: 10, totalArea: 15000, rentedArea: 14000, occupancyRate: 93.3 },
  { assetType: '写字楼', totalCount: 200, rentedCount: 180, selfUseCount: 15, vacantCount: 5, totalArea: 50000, rentedArea: 45000, occupancyRate: 90.0 },
  { assetType: '厂房', totalCount: 186, rentedCount: 40, selfUseCount: 121, vacantCount: 25, totalArea: 100000, rentedArea: 20000, occupancyRate: 20.0 },
  { assetType: '农贸市场', totalCount: 100, rentedCount: 100, selfUseCount: 0, vacantCount: 0, totalArea: 20000, rentedArea: 20000, occupancyRate: 100.0 }
])

const paymentTrend = ref([
  { month: '10月', rate: 88.5 },
  { month: '11月', rate: 89.2 },
  { month: '12月', rate: 90.1 },
  { month: '1月', rate: 89.8 },
  { month: '2月', rate: 90.5 },
  { month: '3月', rate: 91.0 },
  { month: '4月', rate: 90.8 },
  { month: '5月', rate: 91.2 },
  { month: '6月', rate: 91.5 },
  { month: '7月', rate: 91.0 },
  { month: '8月', rate: 91.3 },
  { month: '9月', rate: 91.1 }
])

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
  a.download = `报表_${tab}_${new Date().toISOString().slice(0, 10)}.csv`
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
