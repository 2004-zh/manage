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

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="意向客户/意向编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.intentStatus" placeholder="意向状态" clearable>
            <el-option label="洽谈中" value="洽谈中" />
            <el-option label="已签约" value="已签约" />
            <el-option label="已放弃" value="已放弃" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.assetType" placeholder="资产类型" clearable>
            <el-option label="商铺" value="商铺" />
            <el-option label="写字楼" value="写字楼" />
            <el-option label="厂房" value="厂房" />
            <el-option label="保障房" value="保障房" />
            <el-option label="农贸市场" value="农贸市场" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedData" border stripe @selection-change="onSelect">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="intentNo" label="意向编号" width="120" />
        <el-table-column prop="customer" label="意向客户" width="140" />
        <el-table-column prop="assetName" label="意向资产" min-width="200" show-overflow-tooltip />
        <el-table-column prop="intentArea" label="意向面积(㎡)" width="120" align="right" />
        <el-table-column prop="intentRent" label="意向租金(元/月)" width="140" align="right">
          <template #default="{ row }">{{ row.intentRent.toLocaleString() }}</template>
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

const page = ref(1)
const pageSize = 15

const filters = ref({ keyword: '', intentStatus: '', assetType: '' })
const selectedRows = ref([])

const intentData = ref([
  { id: 1, intentNo: 'YX2026001', customer: '华联超市', contact: '13800001001', assetName: '万达广场商铺B101', intentArea: 200, intentRent: 40000, purpose: '超市经营', follower: '张伟', registerDate: '2026-09-10', status: '洽谈中', remark: '' },
  { id: 2, intentNo: 'YX2026002', customer: '启航教育培训', contact: '13900002002', assetName: '城投大厦A座605', intentArea: 150, intentRent: 30000, purpose: '教育培训中心', follower: '李娜', registerDate: '2026-09-08', status: '洽谈中', remark: '需要改造会议室' },
  { id: 3, intentNo: 'YX2026003', customer: '瑞丰连锁酒店', contact: '13700003003', assetName: '滨江商铺C区整栋', intentArea: 800, intentRent: 120000, purpose: '连锁酒店', follower: '王磊', registerDate: '2026-09-05', status: '已签约', remark: '签约5年' },
  { id: 4, intentNo: 'YX2026004', customer: '陈小明', contact: '13600004004', assetName: '阳光花园2号楼301', intentArea: 68, intentRent: 2200, purpose: '自住', follower: '赵敏', registerDate: '2026-08-28', status: '已签约', remark: '' },
  { id: 5, intentNo: 'YX2026005', customer: '鼎盛物流公司', contact: '13500005005', assetName: '城南仓储物流中心A区', intentArea: 1500, intentRent: 45000, purpose: '物流仓储', follower: '孙强', registerDate: '2026-08-20', status: '洽谈中', remark: '需要确认消防验收' },
  { id: 6, intentNo: 'YX2026006', customer: '美嘉美容美发', contact: '13800006006', assetName: '朝阳农贸市场外围商铺03', intentArea: 60, intentRent: 8000, purpose: '美容美发店', follower: '周芳', registerDate: '2026-08-15', status: '已放弃', remark: '客户资金不足' },
  { id: 7, intentNo: 'YX2026007', customer: '博远医药集团', contact: '13900007007', assetName: '国贸写字楼A座整层15F', intentArea: 500, intentRent: 100000, purpose: '区域总部办公', follower: '吴涛', registerDate: '2026-08-10', status: '洽谈中', remark: '高管团队已实地考察' },
  { id: 8, intentNo: 'YX2026008', customer: '乐享健身俱乐部', contact: '13700008008', assetName: '高新技术产业园配套综合楼', intentArea: 600, intentRent: 36000, purpose: '健身房', follower: '郑洁', registerDate: '2026-08-05', status: '已放弃', remark: '选址变更' }
])

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
    const item = intentData.value.find(d => d.id === editingId.value)
    if (item) {
      Object.assign(item, { customer: form.value.customer, contact: form.value.contact, assetName: form.value.assetName, intentArea: form.value.intentArea, intentRent: form.value.intentRent, purpose: form.value.purpose, follower: form.value.follower, remark: form.value.remark })
    }
    ElMessage.success('编辑成功')
  } else {
    const no = 'YX2026' + String(intentData.value.length + 1).padStart(3, '0')
    intentData.value.unshift({
      id: Date.now(),
      intentNo: no,
      customer: form.value.customer,
      contact: form.value.contact,
      assetName: form.value.assetName,
      intentArea: form.value.intentArea,
      intentRent: form.value.intentRent,
      purpose: form.value.purpose,
      follower: form.value.follower,
      registerDate: new Date().toISOString().slice(0, 10),
      status: '洽谈中',
      remark: form.value.remark
    })
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
    row.status = '已签约'
    ElMessage.success('已成功转为合同')
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
    convertible.forEach(row => { row.status = '已签约' })
    ElMessage.success(`已成功转换 ${convertible.length} 条记录为合同`)
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
  link.download = `导出_意向书台账_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.page-container { height: 100%; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 18px; }
.filter-bar { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
