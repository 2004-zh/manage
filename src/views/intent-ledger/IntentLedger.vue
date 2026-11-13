<template>
  <div class="page-container">
    <div class="page-header">
      <h2>意向书台账</h2>
      <div>
        <el-button type="primary" @click="handleAdd">新增意向</el-button>
        <el-button @click="handleConvert">转合同</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="grid-4">
        <el-input v-model="filters.keyword" placeholder="意向客户/意向编号" clearable prefix-icon="Search" class="full-width" />
        <el-select v-model="filters.intentStatus" placeholder="意向状态" clearable class="full-width">
          <el-option label="洽谈中" value="洽谈中" />
          <el-option label="已签约" value="已签约" />
          <el-option label="已放弃" value="已放弃" />
        </el-select>
        <el-select v-model="filters.assetType" placeholder="资产类型" clearable class="full-width">
          <el-option label="商铺" value="商铺" />
          <el-option label="写字楼" value="写字楼" />
          <el-option label="厂房" value="厂房" />
          <el-option label="保障房" value="保障房" />
          <el-option label="农贸市场" value="农贸市场" />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe @selection-change="onSelect">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="intentNo" label="意向编号" width="120" />
        <el-table-column prop="customer" label="意向客户" width="140" />
        <el-table-column prop="assetName" label="意向资产" min-width="200" show-overflow-tooltip />
        <el-table-column prop="intentArea" label="意向面积(㎡)" width="120" align="right" />
        <el-table-column prop="intentRent" label="意向租金(元/月)" width="140" align="right">
          <template #default="{ row }">{{ formatMoney(row.intentRent) }}</template>
        </el-table-column>
        <el-table-column prop="follower" label="跟进人" width="90" />
        <el-table-column prop="registerDate" label="登记日期" width="110" />
        <el-table-column prop="status" label="意向状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="row.status === '洽谈中'">编辑</el-button>
            <el-button type="success" link size="small" @click="handleConvertSingle(row)" v-if="row.status === '洽谈中'">转合同</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filteredData.length"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 新增/编辑意向对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑意向' : '新增意向'" width="650px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="意向客户" required>
              <el-input v-model="form.customer" placeholder="请输入意向客户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式" required>
              <el-input v-model="form.contact" placeholder="请输入联系方式" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="意向资产" required>
              <el-input v-model="form.assetName" placeholder="请输入意向资产" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="意向面积(㎡)">
              <el-input-number v-model="form.intentArea" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="意向租金(元/月)">
              <el-input-number v-model="form.intentRent" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跟进人">
              <el-input v-model="form.follower" placeholder="请输入跟进人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用途说明">
          <el-input v-model="form.purpose" type="textarea" :rows="2" placeholder="请输入用途说明" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useContractStore } from '../../store/contract'
import { todayISO, formatMoney } from '../../utils/model'

// P1 续：意向书台账与合同主页面共用 contractStore.letterList，
// intentLedgerRows 是 store 提供的字段适配视图（本页历史字段名保持不变）
const contractStore = useContractStore()

const page = ref(1)
const pageSize = 15

const filters = ref({ keyword: '', intentStatus: '', assetType: '' })
const selectedRows = ref([])

const intentData = computed(() => contractStore.intentLedgerRows)

const getStatusType = (status) => {
  const map = { '洽谈中': 'warning', '已签约': 'success', '已放弃': 'info' }
  return map[status] || 'info'
}

const filteredData = computed(() => {
  return intentData.value.filter(item => {
    if (filters.value.keyword) {
      const kw = filters.value.keyword
      if (!item.customer.includes(kw) && !item.intentNo.includes(kw)) return false
    }
    if (filters.value.intentStatus && item.status !== filters.value.intentStatus) return false
    if (filters.value.assetType && item.assetName.includes('商铺') && filters.value.assetType !== '商铺') return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

/* ---------- Dialogs ---------- */

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const defaultForm = { customer: '', contact: '', assetName: '', intentArea: 0, intentRent: 0, purpose: '', follower: '', remark: '' }
const form = ref({ ...defaultForm })

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  form.value = { ...defaultForm }
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  editingId.value = row.id
  form.value = { customer: row.customer, contact: row.contact, assetName: row.assetName, intentArea: row.intentArea, intentRent: row.intentRent, purpose: row.purpose, follower: row.follower, remark: row.remark }
  dialogVisible.value = true
}

function handleSubmit() {
  if (!form.value.customer || !form.value.assetName) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    contractStore.updateIntent(editingId.value, form.value)
    ElMessage.success('编辑成功')
  } else {
    contractStore.addIntent(form.value)
    ElMessage.success('新增意向成功')
  }
  dialogVisible.value = false
}

function handleView(row) {
  isEdit.value = false
  editingId.value = row.id
  form.value = { customer: row.customer, contact: row.contact, assetName: row.assetName, intentArea: row.intentArea, intentRent: row.intentRent, purpose: row.purpose, follower: row.follower, remark: row.remark }
  dialogVisible.value = true
}

function handleConvertSingle(row) {
  ElMessageBox.confirm(`确定将意向"${row.intentNo}"（${row.customer}）转为正式合同？`, '转合同确认', { type: 'info' }).then(() => {
    const contract = contractStore.convertIntentToContract(row.id)
    ElMessage.success(contract ? `已成功转为合同 ${contract.id}` : '该意向已签约')
  }).catch(() => {})
}

function onSelect(rows) { selectedRows.value = rows }

function handleConvert() {
  const convertible = selectedRows.value.filter(r => r.status !== '已签约')
  if (!convertible.length) {
    ElMessage.warning('请先选择需要转合同的意向记录（已签约的无需重复操作）')
    return
  }
  ElMessageBox.confirm(`确定将选中的 ${convertible.length} 条意向记录转为正式合同？`, '批量转合同确认', { type: 'info' }).then(() => {
    const created = convertible.map(row => contractStore.convertIntentToContract(row.id)).filter(Boolean)
    ElMessage.success(`已成功转换 ${created.length} 条记录为合同`)
  }).catch(() => {})
}

function handleSearch() { page.value = 1 }

function resetFilters() {
  filters.value = { keyword: '', intentStatus: '', assetType: '' }
  page.value = 1
}

function handleExport() {
  const headers = ['意向编号', '意向客户', '意向资产', '意向面积(㎡)', '意向租金(元/月)', '跟进人', '登记日期', '意向状态']
  const rows = filteredData.value.map(item => [item.intentNo, item.customer, item.assetName, item.intentArea, item.intentRent, item.follower, item.registerDate, item.status])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_意向书台账_${todayISO()}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.filter-bar :deep(.el-select),
.filter-bar :deep(.el-input) { width: 100%; }
.filter-actions { display: flex; gap: 8px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
