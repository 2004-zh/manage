<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数据上报</h2>
    </div>

    <el-alert title="口径提示：所有资产数据以账面原值（历史成本）计量，不含暂估入账；闲置超12个月自动纳入督办池。" type="info" :closable="false" show-icon />

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never" class="data-card pq-card">
          <template #header>
            <div class="card-banner pq-banner">
              <span class="banner-text">盘清 · 资产底数</span>
              <el-tag size="small" type="info">{{ currentCompany }}</el-tag>
            </div>
          </template>
          <div class="kpi-row">
            <div class="kpi-item" v-for="k in panqingKpis" :key="k.label">
              <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
              <div class="kpi-label">{{ k.label }}</div>
            </div>
          </div>
          <el-table :data="pqDetailRows" size="small" border>
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
                <span :style="{ color: row.unCert > 0 ? '#D93026' : '#94A3B8' }">{{ row.unCert }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="data-card ph-card">
          <template #header>
            <div class="card-banner ph-banner">
              <span class="banner-text">盘活 · 经营收入</span>
              <el-tag size="small" type="info">{{ currentCompany }}</el-tag>
            </div>
          </template>
          <div class="kpi-row">
            <div class="kpi-item" v-for="k in panhuoKpis" :key="k.label">
              <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
              <div class="kpi-label">{{ k.label }}</div>
            </div>
          </div>
          <el-table :data="phDetailRows" size="small" border>
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
                <span :style="{ color: collectRate(row) >= 95 ? '#18A058' : collectRate(row) >= 80 ? '#E8912A' : '#D93026' }">{{ collectRate(row) }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="fill">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>上报记录</span>
          <div>
            <el-radio-group v-model="year" size="small" style="margin-right:12px">
              <el-radio-button label="2026">2026年</el-radio-button>
              <el-radio-button label="2025">2025年</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="showGenerate = true">生成上报数据</el-button>
          </div>
        </div>
      </template>
      <el-table :data="reportRecords" border stripe>
        <el-table-column prop="period" label="上报期" width="120" />
        <el-table-column prop="submitTime" label="提交时间" width="180" />
        <el-table-column prop="assetCount" label="资产条数" width="100" align="right" />
        <el-table-column prop="totalValue" label="账面原值(亿元)" width="140" align="right" />
        <el-table-column prop="idleCount" label="闲置条数" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已接收' ? 'success' : row.status === '已退回' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showGenerate" title="生成上报数据" width="500px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="上报年份">
          <el-select v-model="generateForm.year" style="width:100%">
            <el-option label="2026年" value="2026" />
            <el-option label="2025年" value="2025" />
          </el-select>
        </el-form-item>
        <el-form-item label="上报周期">
          <el-select v-model="generateForm.period" style="width:100%">
            <el-option label="第一季度" value="Q1" />
            <el-option label="第二季度" value="Q2" />
            <el-option label="第三季度" value="Q3" />
            <el-option label="第四季度" value="Q4" />
            <el-option label="年度汇总" value="YEAR" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据校验">
          <el-checkbox v-model="generateForm.validate" label="生成前自动校验数据完整性" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerate = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate">生成并提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showDetail" title="上报详情" size="500px">
      <template v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="上报期">{{ currentRecord.period }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRecord.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="资产条数">{{ currentRecord.assetCount }}</el-descriptions-item>
          <el-descriptions-item label="账面原值">{{ currentRecord.totalValue }} 亿元</el-descriptions-item>
          <el-descriptions-item label="闲置条数">{{ currentRecord.idleCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.status === '已接收' ? 'success' : currentRecord.status === '已退回' ? 'danger' : 'warning'" size="small">{{ currentRecord.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRecord.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useReportStore } from '../../store/report'
import { useUserStore } from '../../store/user'

const reportStore = useReportStore()
const userStore = useUserStore()

const year = ref('2026')
const showGenerate = ref(false)
const showDetail = ref(false)
const currentRecord = ref(null)

const generateForm = ref({ year: '2026', period: 'Q1', validate: true })

const currentCompany = computed(() => userStore.user?.org || '城投集团')
const companyRow = computed(() => reportStore.computeCompanyData(currentCompany.value))

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

const reportRecords = computed(() => reportStore.reports.filter(r => r.company === currentCompany.value))

const handleGenerate = () => {
  const companyName = userStore.user?.org || '城投集团'
  const period = `${generateForm.value.year}-${generateForm.value.period}`
  const remark = generateForm.value.validate ? '数据校验通过' : '未校验'
  const report = reportStore.submitReport(companyName, period, remark)
  showGenerate.value = false
  ElMessage.success(`数据已生成并提交至国资中心（上报编号：${report.id}）`)
}

const viewDetail = (row) => {
  currentRecord.value = row
  showDetail.value = true
}
</script>

<style scoped>
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--t-main);
}
.card-banner {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pq-banner {
  background: linear-gradient(90deg, var(--c-primary-light), #B9D4FF);
  padding: 8px 12px;
  border-radius: 4px;
}
.ph-banner {
  background: linear-gradient(90deg, #f6ffed, #fcffe6);
  padding: 8px 12px;
  border-radius: 4px;
}
.banner-text {
  font-weight: 600;
  color: var(--t-main);
}
.kpi-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}
.kpi-item {
  text-align: center;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}
.kpi-label {
  font-size: 12px;
  color: #909399;
}
</style>
