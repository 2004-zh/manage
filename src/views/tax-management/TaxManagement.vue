<template>
  <div class="page-container">
    <div class="page-header">
      <h2>税费管理</h2>
      <div>
        <el-button type="primary" @click="openAddDialog">新增税费</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="税费编号/关联资产" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.taxType" placeholder="税费类型" clearable>
            <el-option label="增值税" value="增值税" />
            <el-option label="房产税" value="房产税" />
            <el-option label="土地使用税" value="土地使用税" />
            <el-option label="印花税" value="印花税" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.payStatus" placeholder="缴纳状态" clearable>
            <el-option label="待缴纳" value="待缴纳" />
            <el-option label="已缴纳" value="已缴纳" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedData" border stripe>
        <el-table-column prop="taxNo" label="税费编号" width="140" />
        <el-table-column prop="taxType" label="税费类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.taxType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relatedAsset" label="关联资产" min-width="180" />
        <el-table-column prop="taxBase" label="计税基数(元)" width="140" align="right" />
        <el-table-column prop="taxRate" label="税率" width="100" align="center" />
        <el-table-column prop="taxAmount" label="应缴税额(元)" width="130" align="right" />
        <el-table-column prop="deadline" label="缴纳期限" width="120" align="center" />
        <el-table-column prop="payStatus" label="缴纳状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.payStatus)" size="small">{{ row.payStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handlePay(row)" :disabled="row.payStatus !== '待缴纳' && row.payStatus !== '已逾期'">缴纳</el-button>
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

    <!-- 新增税费对话框 -->
    <el-dialog v-model="addDialogVisible" :title="isEdit ? '编辑税费' : '新增税费'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="税费类型" prop="taxType">
          <el-select v-model="form.taxType" style="width: 100%">
            <el-option label="增值税" value="增值税" />
            <el-option label="房产税" value="房产税" />
            <el-option label="土地使用税" value="土地使用税" />
            <el-option label="印花税" value="印花税" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联资产" prop="relatedAsset">
          <el-input v-model="form.relatedAsset" placeholder="请输入关联资产" />
        </el-form-item>
        <el-form-item label="计税基数" prop="taxBase">
          <el-input-number v-model="form.taxBase" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="税率" prop="taxRate">
          <el-input v-model="form.taxRate" placeholder="如 12%" style="width: 100%" />
        </el-form-item>
        <el-form-item label="缴纳期限" prop="deadline">
          <el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="请选择缴纳期限" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const filters = ref({ keyword: '', taxType: '', payStatus: '' })
const page = ref(1)
const pageSize = 10

const taxes = ref([
  { id: 1, taxNo: 'TAX20240901', taxType: '房产税', relatedAsset: '滨江科技园A座8层', taxBase: 8000000, taxRate: '1.2%', taxAmount: 96000, deadline: '2024-10-31', payStatus: '待缴纳' },
  { id: 2, taxNo: 'TAX20240902', taxType: '增值税', relatedAsset: '滨江科技园A座8层', taxBase: 58000, taxRate: '9%', taxAmount: 5220, deadline: '2024-10-15', payStatus: '已缴纳' },
  { id: 3, taxNo: 'TAX20240903', taxType: '印花税', relatedAsset: 'HT20240201', taxBase: 2160000, taxRate: '0.1%', taxAmount: 2160, deadline: '2024-09-30', payStatus: '已逾期' },
  { id: 4, taxNo: 'TAX20240904', taxType: '土地使用税', relatedAsset: '余杭区仓储中心3号库', taxBase: 12000, taxRate: '6元/㎡', taxAmount: 72000, deadline: '2024-12-31', payStatus: '待缴纳' },
  { id: 5, taxNo: 'TAX20240905', taxType: '房产税', relatedAsset: '西湖区文三路商铺', taxBase: 3200000, taxRate: '1.2%', taxAmount: 38400, deadline: '2024-10-31', payStatus: '待缴纳' },
  { id: 6, taxNo: 'TAX20240906', taxType: '增值税', relatedAsset: '西湖区文三路商铺', taxBase: 22000, taxRate: '9%', taxAmount: 1980, deadline: '2024-10-15', payStatus: '已缴纳' },
  { id: 7, taxNo: 'TAX20240907', taxType: '印花税', relatedAsset: 'HT20230801', taxBase: 1740000, taxRate: '0.1%', taxAmount: 1740, deadline: '2024-08-31', payStatus: '已逾期' },
  { id: 8, taxNo: 'TAX20240908', taxType: '房产税', relatedAsset: '余杭区仓储中心3号库', taxBase: 5400000, taxRate: '1.2%', taxAmount: 64800, deadline: '2024-10-31', payStatus: '待缴纳' },
])

const filteredData = computed(() => {
  return taxes.value.filter(t => {
    if (filters.value.keyword && !(t.taxNo.includes(filters.value.keyword) || t.relatedAsset.includes(filters.value.keyword))) return false
    if (filters.value.taxType && t.taxType !== filters.value.taxType) return false
    if (filters.value.payStatus && t.payStatus !== filters.value.payStatus) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

function statusType(status) {
  if (status === '已缴纳') return 'success'
  if (status === '待缴纳') return 'warning'
  return 'danger'
}

const addDialogVisible = ref(false)
const isEdit = ref(false)
const editingRow = ref(null)
const formRef = ref(null)
const form = ref({ taxType: '', relatedAsset: '', taxBase: 0, taxRate: '', deadline: '', remark: '' })
const rules = {
  taxType: [{ required: true, message: '请选择税费类型', trigger: 'change' }],
  relatedAsset: [{ required: true, message: '请输入关联资产', trigger: 'blur' }],
  taxBase: [{ required: true, message: '请输入计税基数', trigger: 'blur' }],
  taxRate: [{ required: true, message: '请输入税率', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择缴纳期限', trigger: 'change' }],
}

function openAddDialog() {
  isEdit.value = false
  editingRow.value = null
  form.value = { taxType: '', relatedAsset: '', taxBase: 0, taxRate: '', deadline: '', remark: '' }
  addDialogVisible.value = true
}
function submitAdd() {
  formRef.value.validate(valid => {
    if (!valid) return
    if (isEdit.value && editingRow.value) {
      Object.assign(editingRow.value, {
        taxType: form.value.taxType,
        relatedAsset: form.value.relatedAsset,
        taxBase: form.value.taxBase,
        taxRate: form.value.taxRate,
        taxAmount: form.value.taxBase * parseFloat(form.value.taxRate) / 100 || 0,
        deadline: form.value.deadline,
        remark: form.value.remark,
      })
      addDialogVisible.value = false
      ElMessage.success('税费记录已更新')
    } else {
      const no = 'TAX' + Date.now()
      taxes.value.unshift({
        id: taxes.value.length + 1,
        taxNo: no,
        taxType: form.value.taxType,
        relatedAsset: form.value.relatedAsset,
        taxBase: form.value.taxBase,
        taxRate: form.value.taxRate,
        taxAmount: form.value.taxBase * parseFloat(form.value.taxRate) / 100 || 0,
        deadline: form.value.deadline,
        payStatus: '待缴纳',
      })
      addDialogVisible.value = false
      ElMessage.success('税费记录已新增')
    }
  })
}

function handleSearch() { page.value = 1; ElMessage.success('查询完成') }
function resetFilters() { filters.value = { keyword: '', taxType: '', payStatus: '' }; page.value = 1 }
function handleExport() {
  const headers = ['税费编号', '税费类型', '关联资产', '计税基数(元)', '税率', '应缴税额(元)', '缴纳期限', '缴纳状态']
  const rows = taxes.value.map(r => [r.taxNo, r.taxType, r.relatedAsset, r.taxBase, r.taxRate, r.taxAmount, r.deadline, r.payStatus])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `税费数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
function handleView(row) {
  ElMessageBox.alert(
    `税费编号：${row.taxNo}\n类型：${row.taxType}\n关联资产：${row.relatedAsset}\n计税基数：${row.taxBase} 元\n税率：${row.taxRate}\n应缴税额：${row.taxAmount} 元\n状态：${row.payStatus}`,
    '详情',
    { confirmButtonText: '确定' }
  )
}
function handleEdit(row) {
  isEdit.value = true
  editingRow.value = row
  form.value = { taxType: row.taxType, relatedAsset: row.relatedAsset, taxBase: row.taxBase, taxRate: row.taxRate, deadline: row.deadline, remark: row.remark || '' }
  addDialogVisible.value = true
}
function handlePay(row) {
  ElMessageBox.confirm(`确认缴纳 ${row.taxAmount} 元？`, '缴纳确认', { type: 'warning' })
    .then(() => { row.payStatus = '已缴纳'; ElMessage.success('缴纳成功') })
    .catch(() => {})
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-select) { width: 100%; }
.table-card { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
