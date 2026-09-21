<template>
  <div class="page-container">
    <div class="page-header">
      <h2>租金差价管理</h2>
      <div>
        <el-button @click="handleExport">导出</el-button>
        <el-button type="primary" @click="saveAll">保存调整</el-button>
      </div>
    </div>

    <div class="grid-4 kpi-row">
      <div class="kpi"><div class="kpi-v" style="color:#409eff">{{ stats.count }}</div><div class="kpi-l">在租资产(宗)</div></div>
      <div class="kpi"><div class="kpi-v" style="color:#67c23a">￥{{ stats.marketTotal }}万</div><div class="kpi-l">评估年租金合计</div></div>
      <div class="kpi"><div class="kpi-v" style="color:#e6a23c">￥{{ stats.actualTotal }}万</div><div class="kpi-l">实收年租金合计</div></div>
      <div class="kpi"><div class="kpi-v" :style="{ color: Number(stats.gapTotal) >= 0 ? '#f56c6c' : '#67c23a' }">￥{{ stats.gapTotal }}万</div><div class="kpi-l">差价合计(评估-实收)</div></div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <div class="grid-4 filter-row">
        <el-input v-model="filters.keyword" placeholder="资产名称/承租方" clearable prefix-icon="Search" class="full-width" />
        <el-select v-model="filters.gapType" placeholder="差价方向" clearable class="full-width">
          <el-option label="低于评估(待调价)" value="below" />
          <el-option label="高于评估" value="above" />
          <el-option label="持平" value="equal" />
        </el-select>
        <el-select v-model="filters.adjusted" placeholder="调整状态" clearable class="full-width">
          <el-option label="已调整" :value="true" />
          <el-option label="未调整" :value="false" />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="page = 1">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe :row-class-name="rowClass">
        <el-table-column prop="assetName" label="资产名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="tenant" label="承租方" min-width="170" show-overflow-tooltip />
        <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
        <el-table-column label="评估单价" width="110" align="right">
          <template #default="{ row }">￥{{ row.marketPrice }}</template>
        </el-table-column>
        <el-table-column label="实收单价" width="110" align="right">
          <template #default="{ row }">￥{{ row.actualPrice }}</template>
        </el-table-column>
        <el-table-column label="评估年租金(万)" width="130" align="right">
          <template #default="{ row }">{{ row.marketAnnual }}</template>
        </el-table-column>
        <el-table-column label="实收年租金(万)" width="130" align="right">
          <template #default="{ row }">{{ row.actualAnnual }}</template>
        </el-table-column>
        <el-table-column label="差价(万)" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.gapAnnual) > 0 ? '#f56c6c' : Number(row.gapAnnual) < 0 ? '#67c23a' : '#909399', fontWeight: 600 }">
              {{ Number(row.gapAnnual) > 0 ? '+' : '' }}{{ row.gapAnnual }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="调整状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.adjusted ? 'success' : 'info'">{{ row.adjusted ? '已调整' : '未调整' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openAdjust(row)">调价</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="filteredData.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <!-- 调价弹窗 -->
    <el-dialog v-model="showAdjust" title="租金调价" width="520px">
      <template v-if="current">
        <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="资产">{{ current.assetName }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ current.tenant }}</el-descriptions-item>
          <el-descriptions-item label="当前实收单价">￥{{ current.actualPrice }} /㎡·月</el-descriptions-item>
          <el-descriptions-item label="评估单价">￥{{ current.marketPrice }} /㎡·月</el-descriptions-item>
        </el-descriptions>
        <el-form :model="adjustForm" label-width="120px">
          <el-form-item label="调整后单价">
            <el-input-number v-model="adjustForm.actualPrice" :min="0" :step="1" :precision="2" style="width:100%" />
          </el-form-item>
          <el-form-item label="预计年租金">
            <el-input :model-value="previewAnnual + ' 万元'" disabled />
          </el-form-item>
          <el-form-item label="调价原因">
            <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="如：低于市场评估价，按评估价调整" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showAdjust = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确认调价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useFinanceStore } from '../../store/finance'

const financeStore = useFinanceStore()

const filters = ref({ keyword: '', gapType: '', adjusted: '' })
const page = ref(1)
const pageSize = 15

const filteredData = computed(() => financeStore.rentMarginRows.filter(r => {
  if (filters.value.keyword && !(r.assetName.includes(filters.value.keyword) || r.tenant.includes(filters.value.keyword))) return false
  if (filters.value.gapType) {
    const g = Number(r.gapAnnual)
    if (filters.value.gapType === 'below' && g <= 0) return false
    if (filters.value.gapType === 'above' && g >= 0) return false
    if (filters.value.gapType === 'equal' && g !== 0) return false
  }
  if (filters.value.adjusted !== '' && filters.value.adjusted !== null && r.adjusted !== filters.value.adjusted) return false
  return true
}))

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

const stats = computed(() => {
  const rows = financeStore.rentMarginRows
  const count = rows.length
  const marketTotal = rows.reduce((s, r) => s + Number(r.marketAnnual), 0).toFixed(2)
  const actualTotal = rows.reduce((s, r) => s + Number(r.actualAnnual), 0).toFixed(2)
  const gapTotal = rows.reduce((s, r) => s + Number(r.gapAnnual), 0).toFixed(2)
  return { count, marketTotal, actualTotal, gapTotal }
})

function rowClass({ row }) { return Number(row.gapAnnual) > 0 ? 'row-below' : '' }

const showAdjust = ref(false)
const current = ref(null)
const adjustForm = ref({ actualPrice: 0, reason: '' })
const previewAnnual = computed(() => {
  if (!current.value) return '0.00'
  return (adjustForm.value.actualPrice * current.value.area * 12 / 10000).toFixed(2)
})

function openAdjust(row) {
  current.value = row
  adjustForm.value = { actualPrice: row.actualPrice, reason: '' }
  showAdjust.value = true
}

function submitAdjust() {
  if (!adjustForm.value.reason) { ElMessage.warning('请填写调价原因'); return }
  const existing = financeStore.priceOverrides.findIndex(o => o.contractId === current.value.contractId)
  const override = {
    contractId: current.value.contractId,
    assetId: current.value.assetId,
    actualPrice: adjustForm.value.actualPrice,
    reason: adjustForm.value.reason
  }
  if (existing >= 0) {
    financeStore.priceOverrides[existing] = override
  } else {
    financeStore.priceOverrides.push(override)
  }
  showAdjust.value = false
  ElMessage.success('调价已保存')
}

function saveAll() {
  ElMessage.success('租金差价调整已批量保存')
}

function handleExport() {
  const headers = ['资产名称', '承租方', '面积(㎡)', '评估单价', '实收单价', '评估年租金(万)', '实收年租金(万)', '差价(万)', '调整状态']
  const dataRows = financeStore.rentMarginRows.map(r => [r.assetName, r.tenant, r.area, r.marketPrice, r.actualPrice, r.marketAnnual, r.actualAnnual, r.gapAnnual, r.adjusted ? '已调整' : '未调整'])
  const csv = '\uFEFF' + [headers.join(','), ...dataRows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `租金差价表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function resetFilters() { filters.value = { keyword: '', gapType: '', adjusted: '' }; page.value = 1 }
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { margin: 0; font-size: 20px; }
.kpi { background: var(--bg-card); border: 1px solid var(--bd); border-radius: var(--r-md); padding: 14px; text-align: center; }
.kpi-v { font-size: 22px; font-weight: 600; }
.kpi-l { font-size: 12px; color: var(--t-weak); margin-top: 4px; }
.filter-row { align-items: center; }
.filter-bar :deep(.el-select),
.filter-bar :deep(.el-input) { width: 100%; }
.filter-actions { display: flex; gap: 8px; }
.pagination-wrap { margin-top: 12px; display: flex; justify-content: flex-end; }
:deep(.row-below) { background: #fef6f6; }
</style>
