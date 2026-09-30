<template>
  <div class="page-container">
    <div class="page-header">
      <h2>证件信息</h2>
      <div>
        <el-button type="primary" @click="showAddDialog">新增证件</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-alert
      v-if="expiringCount"
      class="expiry-alert"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #title>
        {{ expiringCount }} 本证件临期或已过期（距到期 {{ expirySoonDays }} 天内算临期），状态按到期日期实时推算，并已自动生成「证件到期」预警任务。
      </template>
    </el-alert>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="证件名称/编号/证号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.certType" placeholder="证件类型" clearable>
            <el-option v-for="t in allCertTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.certStatus" placeholder="证件状态" clearable>
            <el-option label="有效" value="有效" />
            <el-option label="即将到期" value="即将到期" />
            <el-option label="已过期" value="已过期" />
            <el-option label="长期有效" value="长期有效" />
          </el-select>
        </el-col>
        <el-col :span="7">
          <el-date-picker
            v-model="filters.obtainRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始证件获得时间"
            end-placeholder="结束证件获得时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-panel">
              <div class="section-title">证件详情</div>
              <div class="detail-grid">
                <div class="cell">
                  <div class="label">类型</div>
                  <div class="value">
                    <el-tag size="small" :type="row.catType === '资产' ? 'primary' : 'warning'">{{ row.catType }}</el-tag>
                  </div>
                </div>
                <div class="cell"><div class="label">证件类型</div><div class="value">{{ row.certType }}</div></div>
                <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                <div class="cell"><div class="label">证件号码</div><div class="value hl">{{ row.certCode }}</div></div>
                <div class="cell"><div class="label">证件获得日期</div><div class="value">{{ row.obtainDate }}</div></div>
                <div class="cell"><div class="label">到期日期</div><div class="value">{{ row.expiryDate }}<span v-if="row.daysText" class="days">{{ row.daysText }}</span></div></div>
                <div class="cell"><div class="label">备注</div><div class="value">{{ row.remark || '—' }}</div></div>
              </div>
              <div class="section-title">证件文件</div>
              <div class="file-thumbs">
                <div v-for="(f, i) in row.files" :key="i" class="thumb">
                  <el-icon :size="22"><Picture /></el-icon>
                  <span>{{ f }}</span>
                </div>
                <span v-if="!row.files.length" class="no-file">暂无证件文件</span>
              </div>
              <div class="section-title">关联资产</div>
              <div class="detail-grid">
                <div class="cell"><div class="label">省市区</div><div class="value">{{ row.asset.region }}</div></div>
                <div class="cell"><div class="label">项目名称</div><div class="value hl">{{ row.asset.projectName }}</div></div>
                <div class="cell"><div class="label">项目地址</div><div class="value">{{ row.asset.projectAddr }}</div></div>
                <div class="cell"><div class="label">分区</div><div class="value">{{ row.asset.zone }}</div></div>
                <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.asset.assetName }}</div></div>
                <div class="cell"><div class="label">资产编号</div><div class="value">{{ row.asset.assetNo }}</div></div>
                <div class="cell"><div class="label">资产座落</div><div class="value">{{ row.asset.assetAddr }}</div></div>
                <div class="cell"><div class="label">使用状态</div><div class="value">{{ row.asset.leaseStatus }}</div></div>
                <div class="cell">
                  <div class="label">办证状态</div>
                  <div class="value">
                    <el-tag size="small" :type="row.asset.certStatus === '已办证' ? 'success' : 'warning'">{{ row.asset.certStatus }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="catType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.catType === '资产' ? 'primary' : 'warning'">{{ row.catType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certNo" label="证件编号" width="100" />
        <el-table-column prop="certName" label="证件名称" min-width="170" show-overflow-tooltip />
        <el-table-column prop="certType" label="证件类型" width="110" />
        <el-table-column prop="company" label="所属公司" min-width="180" show-overflow-tooltip />
        <el-table-column prop="relatedAsset" label="关联资产" min-width="160" show-overflow-tooltip />
        <el-table-column prop="certCode" label="证号" width="190" show-overflow-tooltip />
        <el-table-column prop="issueDate" label="发证日期" width="105" />
        <el-table-column prop="expiryDate" label="到期日期" width="150">
          <template #default="{ row }">
            <span>{{ row.expiryDate }}</span>
            <span v-if="row.daysText" class="days">{{ row.daysText }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="certStatus" label="证件状态" width="95">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.certStatus)" size="small">{{ row.certStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="handleUpload(row)">上传附件</el-button>
            <el-button type="danger" link size="small" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 15, 30, 50]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑证件' : '新增证件'" width="680px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="类型" required>
          <el-radio-group v-model="form.catType">
            <el-radio value="资产">资产证件</el-radio>
            <el-radio value="项目">项目证件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="证件名称" required>
          <el-input v-model="form.certName" placeholder="请输入证件名称" />
        </el-form-item>
        <el-form-item label="证件类型" required>
          <el-select v-model="form.certType" placeholder="请选择" style="width:100%">
            <el-option v-for="t in allCertTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="证号" required>
          <el-input v-model="form.certCode" placeholder="请输入证号" />
        </el-form-item>
        <el-form-item label="关联资产" required>
          <el-select v-model="form.assetId" placeholder="请选择关联资产" style="width:100%" filterable>
            <el-option v-for="a in assetStore.visibleAssets" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发证日期" required>
          <el-date-picker v-model="form.issueDate" type="date" placeholder="请选择发证日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="form.expiryDate" type="date" placeholder="留空视为长期有效" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width:100%" />
          <div class="form-tip">证件状态由到期日期实时推算：距到期 {{ expirySoonDays }} 天内为「即将到期」，逾期为「已过期」，并自动生成预警任务。</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="缺证原因、续期要求等" />
        </el-form-item>
        <el-form-item label="证件附件">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" :limit="5" :on-change="onFormFileChange" drag>
            <el-icon style="font-size: 40px; color: var(--t-weak);"><Plus /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF / JPG / PNG / Word，最多 5 个；演示环境登记附件名称</div>
            </template>
          </el-upload>
          <div v-if="form.files.length" class="attached-list">
            <el-tag v-for="(f, i) in form.files" :key="i" closable size="small" @close="form.files.splice(i, 1)">{{ f }}</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="类型">
            <el-tag size="small" :type="currentRow.catType === '资产' ? 'primary' : 'warning'">{{ currentRow.catType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="证件编号">{{ currentRow.certNo }}</el-descriptions-item>
          <el-descriptions-item label="证件名称">{{ currentRow.certName }}</el-descriptions-item>
          <el-descriptions-item label="证件类型">{{ currentRow.certType }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentRow.company }}</el-descriptions-item>
          <el-descriptions-item label="证号">{{ currentRow.certCode }}</el-descriptions-item>
          <el-descriptions-item label="关联资产">{{ currentRow.relatedAsset }}</el-descriptions-item>
          <el-descriptions-item label="发证日期">{{ currentRow.issueDate }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ currentRow.expiryDate }}{{ currentRow.daysText ? `（${currentRow.daysText}）` : '' }}</el-descriptions-item>
          <el-descriptions-item label="证件状态">
            <el-tag :type="getStatusType(currentRow.certStatus)" size="small">{{ currentRow.certStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产办证状态">
            <el-tag :type="currentRow.asset.certStatus === '已办证' ? 'success' : 'warning'" size="small">{{ currentRow.asset.certStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="证件附件">{{ currentRow.files.length ? currentRow.files.join('、') : '—' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentRow.remark || '—' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <el-dialog v-model="uploadDialogVisible" :title="'上传附件 - ' + (uploadTarget?.certNo || '')" width="500px" destroy-on-close>
      <el-upload drag action="" :auto-upload="false" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" :on-change="onUploadFileChange" :limit="5">
        <div style="padding: 20px">
          <p>将文件拖到此处，或点击上传</p>
          <p style="color: #999; font-size: 12px">支持图片、PDF、Word 格式，最多5个文件</p>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :disabled="!uploadFile">确认上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useCredentialStore, CREDENTIAL_TYPES, PROPERTY_CERT_TYPES, EXPIRY_SOON_DAYS } from '../../store/credential'

const assetStore = useAssetStore()
const credentialStore = useCredentialStore()

// 权证类证件既进证件档案，也回写资产主数据的权证号/产权状况/办证进度；
// 程序证件只进证件层，由齐备度推导办证进度。两套口径统一由 credential store 兜底。
const RIGHT_CERT_TYPES = ['不动产权证', '房产证', '土地证']
const allCertTypes = [...PROPERTY_CERT_TYPES, ...CREDENTIAL_TYPES.filter(t => !PROPERTY_CERT_TYPES.includes(t))]
const expirySoonDays = EXPIRY_SOON_DAYS

const page = ref(1)
const pageSize = ref(15)
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)

const filters = ref({ keyword: '', certType: '', certStatus: '', obtainRange: null })

const defaultForm = { certNo: '', certName: '', certType: '', certCode: '', assetId: '', issueDate: '', expiryDate: '', remark: '', catType: '资产', files: [] }
const form = ref({ ...defaultForm })

// 页面只读 store：证件档案按资产富化（时效实时推导），关联资产信息一律取台账
const certRecords = computed(() => {
  const byId = new Map(assetStore.visibleAssets.map(a => [a.id, a]))
  return credentialStore.credentialList
    .filter(c => byId.has(c.assetId))
    .map(c => {
      const a = byId.get(c.assetId)
      return {
        certNo: c.id,
        assetId: c.assetId,
        certName: c.name || `${a.name}${c.type}`,
        certType: c.type,
        certCode: c.certNo,
        company: a.group,
        relatedAsset: `${a.id} ${a.name}`,
        issueDate: c.issueDate,
        expiryDate: c.validUntil || '长期有效',
        certStatus: c.validity,
        daysText: c.validity === '已过期' ? `已逾期 ${Math.abs(c.daysLeft || 0)} 天`
          : c.validity === '即将到期' ? `剩余 ${c.daysLeft} 天` : '',
        obtainDate: c.issueDate,
        remark: c.remark || '',
        catType: c.catType || '资产',
        files: c.files || [],
        asset: {
          region: a.region || '福建省福州市长乐区',
          projectName: a.projectName || '未挂项目',
          projectAddr: a.location || '—',
          zone: a.zoneName || '—',
          assetName: a.name,
          assetNo: a.id,
          assetAddr: a.location || '—',
          leaseStatus: a.status,
          certStatus: a.certStatus
        }
      }
    })
    // 证件编号按登记顺序递增，越新登记的排前面
    .sort((l, r) => (l.certNo < r.certNo ? 1 : -1))
})

const expiringCount = computed(() =>
  certRecords.value.filter(r => r.certStatus === '即将到期' || r.certStatus === '已过期').length)


const filteredData = computed(() => {
  return certRecords.value.filter(r => {
    if (filters.value.keyword && !r.certName.includes(filters.value.keyword) && !r.certNo.includes(filters.value.keyword) && !r.certCode.includes(filters.value.keyword)) return false
    if (filters.value.certType && r.certType !== filters.value.certType) return false
    if (filters.value.certStatus && r.certStatus !== filters.value.certStatus) return false
    const range = filters.value.obtainRange
    if (range && range.length === 2 && range[0] && range[1]) {
      if (r.obtainDate < range[0] || r.obtainDate > range[1]) return false
    }
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getStatusType = (status) => {
  const map = { '有效': 'success', '即将到期': 'warning', '已过期': 'danger', '长期有效': 'info' }
  return map[status] || 'info'
}

function showAddDialog() {
  isEdit.value = false
  form.value = { ...defaultForm, files: [] }
  dialogVisible.value = true
}

function editRecord(row) {
  isEdit.value = true
  form.value = {
    certNo: row.certNo,
    certName: row.certName,
    certType: row.certType,
    certCode: row.certCode,
    assetId: row.assetId,
    issueDate: row.issueDate,
    expiryDate: row.expiryDate === '长期有效' ? '' : row.expiryDate,
    remark: row.remark,
    catType: row.catType,
    files: [...row.files]
  }
  dialogVisible.value = true
}

function viewRecord(row) {
  currentRow.value = row
  detailVisible.value = true
}

const uploadDialogVisible = ref(false)
const uploadTarget = ref(null)
const uploadFile = ref(null)

function handleUpload(row) {
  uploadTarget.value = row
  uploadFile.value = null
  uploadDialogVisible.value = true
}
function onUploadFileChange(file) {
  uploadFile.value = file
}
function submitUpload() {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  const row = uploadTarget.value
  credentialStore.updateCredential(row.certNo, { files: [...(row.files || []), uploadFile.value.name] })
  uploadDialogVisible.value = false
  ElMessage.success(`附件 "${uploadFile.value.name}" 已上传至 ${row.certNo}`)
}

function deleteRecord(row) {
  ElMessageBox.confirm(`确认删除证件"${row.certName}"？`, '提示', { type: 'warning' }).then(() => {
    credentialStore.removeCredential(row.certNo)
    ElMessage.success('删除成功，资产办证状态已按剩余证件重算')
  }).catch(() => {})
}

function onFormFileChange(file, fileList) {
  form.value.files = fileList.slice(0, 5).map(f => f.name)
}

function saveRecord() {
  const f = form.value
  if (!f.certName || !f.certType || !f.certCode || !f.assetId || !f.issueDate) {
    ElMessage.warning('请填写证件名称、证件类型、证号、关联资产和发证日期')
    return
  }
  const payload = {
    assetId: f.assetId,
    name: f.certName,
    type: f.certType,
    certNo: f.certCode,
    issueDate: f.issueDate,
    validUntil: f.expiryDate || '',
    remark: f.remark || '',
    catType: f.catType || '资产',
    files: f.files || []
  }
  if (isEdit.value && f.certNo) credentialStore.updateCredential(f.certNo, payload)
  else credentialStore.addCredential(payload)

  if (RIGHT_CERT_TYPES.includes(f.certType)) {
    const res = credentialStore.savePropertyCert({
      assetId: f.assetId,
      hasCert: '有',
      certNo: f.certCode,
      certType: f.certType,
      remark: f.remark || ''
    })
    if (!res.ok) {
      ElMessage.warning(res.message)
      return
    }
    // 回写会替换 store 里的资产对象，重新取一份才能读到联动后的状态
    const linked = assetStore.getAssetById(f.assetId)
    ElMessage.success(`${linked.name} 已联动：权证号 ${linked.certDetail || f.certCode}，办证状态「${linked.certStatus}」`)
  } else {
    const linked = assetStore.getAssetById(f.assetId)
    ElMessage.success(`证件已保存，${linked.name} 办证状态按证件齐备度推导为「${linked.certStatus}」`)
  }
  dialogVisible.value = false
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', certType: '', certStatus: '', obtainRange: null }; page.value = 1 }
function handleExport() {
  const headers = ['类型', '证件编号', '证件名称', '证件类型', '所属公司', '关联资产', '证号', '发证日期', '到期日期', '证件状态', '备注']
  const rows = filteredData.value.map(item => [item.catType, item.certNo, item.certName, item.certType, item.company, item.relatedAsset, item.certCode, item.issueDate, item.expiryDate, item.certStatus, item.remark])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_证件信息_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 进入页面按有效期扫一遍，临期/过期证件补进预警任务（addTask 按单据号幂等，不会重复生成）
onMounted(() => credentialStore.syncExpiryWarnings())
</script>

<style scoped>
.expiry-alert { margin-bottom: 12px; }
.expand-panel { padding: 12px 24px; background: var(--bg-page); }
.file-thumbs { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.file-thumbs .thumb {
  width: 92px; height: 92px; border: 1px solid var(--bd); border-radius: var(--r-sm); background: var(--bg-card);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; color: var(--t-weak); padding: 6px; text-align: center; word-break: break-all; overflow: hidden;
}
.file-thumbs .no-file { font-size: 13px; color: var(--t-weak); line-height: 92px; }
.days { margin-left: 6px; font-size: 12px; color: var(--el-color-warning); }
.form-tip { font-size: 12px; color: var(--t-weak); line-height: 1.5; }
.attached-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
</style>
