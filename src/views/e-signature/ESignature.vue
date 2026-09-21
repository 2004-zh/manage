<template>
  <div class="page-container">
    <div class="page-header">
      <h2>电子签章</h2>
      <div>
        <el-button type="primary" @click="handleCreate">发起签章</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="grid-4">
        <el-input v-model="filters.keyword" placeholder="文件名称/签章编号" clearable prefix-icon="Search" class="full-width" />
        <el-select v-model="filters.signStatus" placeholder="签章状态" clearable class="full-width">
          <el-option label="待签署" value="待签署" />
          <el-option label="已签署" value="已签署" />
          <el-option label="已拒签" value="已拒签" />
        </el-select>
        <el-select v-model="filters.signType" placeholder="签章类型" clearable class="full-width">
          <el-option label="合同签章" value="合同签章" />
          <el-option label="审批签章" value="审批签章" />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </div>

    <el-card class="table-card fill" shadow="never">
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
        <el-form-item v-if="form.signType === '合同签章'" label="关联合同" required>
          <el-select v-model="form.contractId" placeholder="选择待签章的合同（签署后写回合同状态）" filterable style="width: 100%" @change="onPickContract">
            <el-option
              v-for="c in signableContracts"
              :key="c.id"
              :label="`${c.id} - ${c.assetName}（${c.tenant}）`"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
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
          <el-descriptions-item v-if="currentRow.signMethod" label="签章方式">{{ currentRow.signMethod }}</el-descriptions-item>
          <el-descriptions-item v-if="currentRow.signatureTime" label="签署时间">{{ currentRow.signatureTime }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRow.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useContractStore } from '../../store/contract'
import { useAssetStore } from '../../store/asset'
import { useAuditStore } from '../../store/audit'
import { useNotifyStore } from '../../store/notify'
import { useUserStore } from '../../store/user'

const contractStore = useContractStore()
const assetStore = useAssetStore()
const auditStore = useAuditStore()
const notifyStore = useNotifyStore()
const userStore = useUserStore()

const orgName = computed(() => userStore.user?.org || '资产管理部')

const page = ref(1)
const pageSize = 15
const filters = ref({ keyword: '', signStatus: '', signType: '' })

function pad(n) { return String(n).padStart(2, '0') }
function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 合同的签署状态以合同库为准：electronic / signatureTime 是既有的"已签章"标志位
function signStatusOf(c) {
  if (c.signStatus === '已拒签' || c.status === '已拒签') return '已拒签'
  if (c.status === '已签署' || c.electronic || c.signatureTime) return '已签署'
  return '待签署'
}

// 每份在册合同即一份合同签章文件，签署动作直接回写合同 store
const contractDocs = computed(() => contractStore.visibleContracts.map(c => {
  const asset = assetStore.getAssetById(c.assetId)
  return {
    _key: 'HT:' + c.id,
    contractId: c.id,
    signNo: c.id.replace('HT-', 'QZ'),
    fileName: `${c.assetName}租赁合同`,
    fileType: '合同签章',
    initiator: asset?.group || orgName.value,
    signer: c.tenant,
    initDate: c.startDate,
    status: signStatusOf(c),
    assetId: c.assetId,
    assetName: c.assetName,
    tenant: c.tenant,
    rent: c.annualRent || 0,
    signatureTime: c.signatureTime || '',
    signMethod: c.signMethod || '',
    remark: ''
  }
}))

// 用户发起的补充 / 审批类签章文件；合同签章类型的会关联一份在册合同以便回写
const extraDocs = ref([])

const allDocs = computed(() => [...extraDocs.value, ...contractDocs.value])

const getStatusType = (status) => {
  const map = { '待签署': 'warning', '已签署': 'success', '已拒签': 'danger' }
  return map[status] || 'info'
}

const filteredData = computed(() => {
  return allDocs.value.filter(item => {
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

// 可发起合同签章的在册合同
const signableContracts = computed(() => contractStore.visibleContracts.filter(c => signStatusOf(c) === '待签署'))

/* ---------- Dialogs ---------- */

const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)

const defaultForm = { contractId: '', fileName: '', signer: '', signType: '合同签章', signPosition: '', deadline: '', remark: '' }
const form = ref({ ...defaultForm })

function handleFileChange(file) {
  form.value.fileName = file.name
}

function onPickContract(id) {
  const c = contractStore.getContractById(id)
  if (!c) return
  form.value.fileName = `${c.assetName}合同签章文件`
  form.value.signer = c.tenant
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
  if (form.value.signType === '合同签章' && !form.value.contractId) {
    ElMessage.warning('合同签章请选择关联合同')
    return
  }
  const c = form.value.contractId ? contractStore.getContractById(form.value.contractId) : null
  const asset = c ? assetStore.getAssetById(c.assetId) : null
  extraDocs.value.unshift({
    _key: 'NEW:' + Date.now(),
    contractId: c ? c.id : '',
    signNo: 'QZ' + String(Date.now()).slice(-8),
    fileName: form.value.fileName,
    fileType: form.value.signType,
    initiator: asset?.group || orgName.value,
    signer: form.value.signer,
    initDate: new Date().toISOString().slice(0, 10),
    status: '待签署',
    assetId: c ? c.assetId : '',
    assetName: c ? c.assetName : form.value.fileName,
    tenant: c ? c.tenant : form.value.signer,
    rent: c ? (c.annualRent || 0) : 0,
    signatureTime: '',
    signMethod: '',
    remark: form.value.remark
  })
  dialogVisible.value = false
  page.value = 1
  ElMessage.success('签章已发起')
}

function handleView(row) {
  currentRow.value = row
  detailVisible.value = true
}

function handleSign(row) {
  ElMessageBox.confirm(`确认对"${row.fileName}"完成签署并加盖电子印章？`, '签署确认', { type: 'info' }).then(() => {
    const stamp = nowStr()
    if (row.contractId) {
      const before = contractStore.getContractById(row.contractId)
      const asset = before ? assetStore.getAssetById(before.assetId) : null
      // 写回合同：状态置为已签署，补电子签章字段；updateContractStatus 内部统一留痕
      contractStore.updateContractStatus(row.contractId, '已签署', {
        module: '合同',
        action: '电子签章',
        remark: `承租方 ${row.tenant || row.signer} 完成电子签章`,
        detail: `用章方式 电子签 / 时间 ${stamp}`,
        fields: { electronic: true, signatureTime: stamp, signMethod: '电子签', baseStatus: before?.status }
      })
      notifyStore.sendByTemplate('contract_signed', {
        contractNo: row.contractId,
        asset: row.assetName || before?.assetName,
        tenant: row.tenant || row.signer,
        rent: before?.annualRent || row.rent || 0
      }, { target: asset?.group || 'ent', bizType: 'contract', bizId: row.contractId, route: '/ent/contract' })
      ElMessage.success('签署完成，合同状态与用章记录已写回')
    } else {
      row.status = '已签署'
      row.signatureTime = stamp
      row.signMethod = '电子签'
      auditStore.recordEvent({
        assetId: row.assetId || '',
        assetName: row.assetName || row.fileName,
        group: '',
        module: '合同',
        action: '电子签章',
        billNo: row.signNo,
        remark: `独立签章文件完成电子签章 / 时间 ${stamp}`
      })
      notifyStore.sendByTemplate('contract_signed', {
        contractNo: row.signNo, asset: row.fileName, tenant: row.signer, rent: 0
      })
      ElMessage.success('签署完成')
    }
  }).catch(() => {})
}

function handleDownload(row) {
  const content = `签章文件: ${row.fileName}\n签章编号: ${row.signNo}\n签署方: ${row.signer}\n签署状态: ${row.status}\n发起日期: ${row.initDate}\n用章方式: ${row.signMethod || '—'}\n签署时间: ${row.signatureTime || '—'}`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${row.fileName || '签章文件'}.txt`
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
  const headers = ['签章编号', '文件名称', '文件类型', '发起方', '签署方', '发起日期', '签署状态', '用章方式', '签署时间']
  const rows = filteredData.value.map(item => [item.signNo, item.fileName, item.fileType, item.initiator, item.signer, item.initDate, item.status, item.signMethod || '', item.signatureTime || ''])
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
.filter-bar :deep(.el-select),
.filter-bar :deep(.el-input) { width: 100%; }
.filter-actions { display: flex; gap: 8px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
