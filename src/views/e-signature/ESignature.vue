<template>
  <div class="page-container">
    <div class="page-header">
      <h2>电子签章</h2>
      <div>
        <el-button type="primary" @click="handleCreate">发起签章</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="文件名称/签章编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.signStatus" placeholder="签章状态" clearable>
            <el-option label="待签署" value="待签署" />
            <el-option label="已签署" value="已签署" />
            <el-option label="已拒签" value="已拒签" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.signType" placeholder="签章类型" clearable>
            <el-option label="合同签章" value="合同签章" />
            <el-option label="审批签章" value="审批签章" />
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
        <el-table-column prop="signNo" label="签章编号" width="130" />
        <el-table-column prop="fileName" label="文件名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="fileType" label="文件类型" width="120" />
        <el-table-column prop="initiator" label="发起方" width="130" />
        <el-table-column prop="signer" label="签署方" width="140" />
        <el-table-column prop="initDate" label="发起日期" width="110" />
        <el-table-column prop="status" label="签署状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" link size="small" @click="handleSign(row)" v-if="row.status === '待签署'">签署</el-button>
            <el-button type="primary" link size="small" @click="handleDownload(row)" v-if="row.status === '已签署'">下载</el-button>
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

    <!-- 发起签章对话框 -->
    <el-dialog v-model="dialogVisible" title="发起签章" width="650px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="文件选择" required>
          <el-upload action="#" :auto-upload="false" :limit="1" :on-change="handleFileChange">
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、Word 格式文件</div>
            </template>
          </el-upload>
          <el-input v-model="form.fileName" placeholder="或输入文件名称" style="margin-top: 8px" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签署方" required>
              <el-input v-model="form.signer" placeholder="请输入签署方" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签章类型" required>
              <el-select v-model="form.signType" placeholder="请选择" style="width: 100%">
                <el-option label="合同签章" value="合同签章" />
                <el-option label="审批签章" value="审批签章" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="签署位置">
              <el-select v-model="form.signPosition" placeholder="请选择" style="width: 100%">
                <el-option label="甲方签章区" value="甲方签章区" />
                <el-option label="乙方签章区" value="乙方签章区" />
                <el-option label="骑缝章" value="骑缝章" />
                <el-option label="指定位置" value="指定位置" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止日期" required>
              <el-date-picker v-model="form.deadline" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="签章编号">{{ currentRow.signNo }}</el-descriptions-item>
          <el-descriptions-item label="文件名称">{{ currentRow.fileName }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ currentRow.fileType }}</el-descriptions-item>
          <el-descriptions-item label="发起方">{{ currentRow.initiator }}</el-descriptions-item>
          <el-descriptions-item label="签署方">{{ currentRow.signer }}</el-descriptions-item>
          <el-descriptions-item label="发起日期">{{ currentRow.initDate }}</el-descriptions-item>
          <el-descriptions-item label="签署状态">
            <el-tag :type="getStatusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRow.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const page = ref(1)
const pageSize = 15

const filters = ref({ keyword: '', signStatus: '', signType: '' })

const signData = ref([
  { id: 1, signNo: 'QZ2026001', fileName: '城投大厦A座1201室租赁合同', fileType: '合同签章', initiator: '城投集团资产管理部', signer: '星辰科技有限公司', initDate: '2026-09-12', status: '待签署', remark: '' },
  { id: 2, signNo: 'QZ2026002', fileName: '万达广场商铺A101续租协议', fileType: '合同签章', initiator: '城投集团资产管理部', signer: '鑫源餐饮管理公司', initDate: '2026-09-10', status: '已签署', remark: '' },
  { id: 3, signNo: 'QZ2026003', fileName: '高新技术产业园厂房C1租赁审批单', fileType: '审批签章', initiator: '产投集团运营部', signer: '恒达制造集团', initDate: '2026-09-08', status: '已签署', remark: '' },
  { id: 4, signNo: 'QZ2026004', fileName: '朝阳农贸市场1号厅退租确认书', fileType: '合同签章', initiator: '城投集团资产管理部', signer: '绿鲜蔬菜批发部', initDate: '2026-09-05', status: '待签署', remark: '需双方签字确认' },
  { id: 5, signNo: 'QZ2026005', fileName: '滨江商铺B区203资产转让协议', fileType: '合同签章', initiator: '水投集团财务部', signer: '茗茶道茶业', initDate: '2026-09-01', status: '已拒签', remark: '签署方对条款有异议' },
  { id: 6, signNo: 'QZ2026006', fileName: '领航科技楼5层租赁变更审批', fileType: '审批签章', initiator: '城投集团资产管理部', signer: '云飞数据科技公司', initDate: '2026-08-28', status: '已签署', remark: '' }
])

const getStatusType = (status) => {
  const map = { '待签署': 'warning', '已签署': 'success', '已拒签': 'danger' }
  return map[status] || 'info'
}

const filteredData = computed(() => {
  return signData.value.filter(item => {
    if (filters.value.keyword) {
      const kw = filters.value.keyword
      if (!item.fileName.includes(kw) && !item.signNo.includes(kw)) return false
    }
    if (filters.value.signStatus && item.status !== filters.value.signStatus) return false
    if (filters.value.signType && item.fileType !== filters.value.signType) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

/* ---------- Dialogs ---------- */

const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)

const defaultForm = { fileName: '', signer: '', signType: '合同签章', signPosition: '', deadline: '', remark: '' }
const form = ref({ ...defaultForm })

function handleFileChange(file) {
  form.value.fileName = file.name
}

function handleCreate() {
  form.value = { ...defaultForm }
  dialogVisible.value = true
}

function handleSubmit() {
  if (!form.value.fileName || !form.value.signer || !form.value.deadline) {
    ElMessage.warning('请填写必填项')
    return
  }
  const no = 'QZ2026' + String(signData.value.length + 1).padStart(3, '0')
  signData.value.unshift({
    id: Date.now(),
    signNo: no,
    fileName: form.value.fileName,
    fileType: form.value.signType,
    initiator: '城投集团资产管理部',
    signer: form.value.signer,
    initDate: new Date().toISOString().slice(0, 10),
    status: '待签署',
    remark: form.value.remark
  })
  dialogVisible.value = false
  ElMessage.success('签章发起成功')
}

function handleView(row) {
  currentRow.value = row
  detailVisible.value = true
}

function handleSign(row) {
  ElMessageBox.confirm(`确定对"${row.fileName}"进行签署操作？`, '签署确认', { type: 'info' }).then(() => {
    row.status = '已签署'
    ElMessage.success('签署成功')
  }).catch(() => {})
}

function handleDownload(row) {
  const content = `签章文件: ${row.fileName}\n签章编号: ${row.signNo}\n签署人: ${row.signer}\n签署状态: ${row.status}\n发起日期: ${row.initDate}`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = row.fileName || '签章文件.txt'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('文件下载成功')
}

function handleSearch() { page.value = 1 }

function resetFilters() {
  filters.value = { keyword: '', signStatus: '', signType: '' }
  page.value = 1
}

function handleExport() {
  const headers = ['签章编号', '文件名称', '文件类型', '发起方', '签署方', '发起日期', '签署状态']
  const rows = filteredData.value.map(item => [item.signNo, item.fileName, item.fileType, item.initiator, item.signer, item.initDate, item.status])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_电子签章_${new Date().toISOString().slice(0, 10)}.csv`
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
