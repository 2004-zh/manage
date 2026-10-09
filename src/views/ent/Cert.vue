<template>
  <div class="ent-cert">
    <div class="page-header">
      <h2>产权信息</h2>
    </div>

    <div class="section-title">资债权证</div>

    <div class="filter-bar">
      <el-form :inline="true">
        <el-form-item label="权证状态">
          <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 160px">
            <el-option label="已办证" value="已办证" />
            <el-option label="未办证（办理中）" value="办理中" />
            <el-option label="未办证（未启动）" value="未启动" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <div>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="已办证" :value="certStats.certified" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="办理中" :value="certStats.processing" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="未启动" :value="certStats.notStarted">
            <template #suffix><el-tag type="danger" size="small">需关注</el-tag></template>
          </el-statistic>
        </el-col>
      </el-row>
    </div>

    <div class="toolbar-row">
      <el-button type="warning" :disabled="!certSelection.length" @click="batchStartCert">批量开始办理 ({{ certSelection.length }})</el-button>
      <el-button type="success" :disabled="!certSelection.length" @click="batchCompleteCert">批量完成办理 ({{ certSelection.length }})</el-button>
      <el-button :disabled="!certSelection.length" @click="certSelection = []">取消选择</el-button>
    </div>

    <el-table :data="filteredRecords" border stripe class="table-card" @selection-change="onCertSelectionChange">
      <el-table-column type="selection" width="45" />
      <el-table-column prop="assetId" label="资产编号" width="100" />
      <el-table-column prop="assetName" label="资产名称" min-width="200" />
      <el-table-column prop="location" label="位置" width="100" />
      <el-table-column prop="certStatus" label="权证状态" width="160">
        <template #default="{ row }">
          <el-tag :type="certStatusTagType(row.certStatus)" size="small">{{ row.certStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="办证进度" min-width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="isCertNotStarted(row.certStatus)" type="warning" link size="small" @click="startCert(row)">开始办理</el-button>
          <el-button v-if="row.certStatus.includes('办理中')" type="success" link size="small" @click="completeCert(row)">完成办理</el-button>
          <el-button v-if="row.certStatus.includes('办理中')" type="info" link size="small" @click="revertCert(row)">退回未启动</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="completeDialogVisible" title="完成办证" width="500px" destroy-on-close>
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="资产">
          <span>{{ completeForm.assetName }} ({{ completeForm.assetId }})</span>
        </el-form-item>
        <el-form-item label="权证编号" required>
          <el-input v-model="completeForm.certDetail" placeholder="如：闽(2026)长乐区不动产权第0012345号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="completeForm.remark" type="textarea" :rows="2" placeholder="办证完成备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认完成</el-button>
      </template>
    </el-dialog>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="产权信息" name="prop">
        <div class="toolbar-row">
          <el-button type="primary" :icon="Plus" @click="openPropDialog()">新增产权证件</el-button>
        </div>

        <el-card class="filter-bar" shadow="never">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="propFilters.keyword" placeholder="资产信息/产权编号" clearable :prefix-icon="Search" style="width: 200px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.company" placeholder="公司" clearable style="width: 200px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.certType" placeholder="产权证类型" clearable style="width: 150px">
                <el-option v-for="t in certTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.projectType" placeholder="项目类型" clearable style="width: 140px">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="propFilters.propType" placeholder="产权类型" clearable style="width: 140px">
                <el-option v-for="t in propTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handlePropSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="table-card" shadow="never">
          <el-table :data="pagedProps" border stripe>
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="expand-panel">
                  <div class="section-title">产权证比例</div>
                  <el-table :data="row.ratios" border size="small" style="width: 100%; margin-bottom: 12px">
                    <el-table-column prop="name" label="名称" min-width="200" />
                    <el-table-column prop="ratio" label="比例%" width="120" align="right" />
                  </el-table>
                  <div class="section-title">证件文件</div>
                  <div class="file-thumbs">
                    <div v-for="(f, i) in row.files" :key="i" class="thumb">
                      <el-icon :size="22"><Picture /></el-icon>
                      <span>{{ f }}</span>
                    </div>
                    <span v-if="!row.files.length" class="no-file">暂无证件文件</span>
                  </div>
                  <div class="section-title">资产信息</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">省市区</div><div class="value">{{ row.asset.region }}</div></div>
                    <div class="cell"><div class="label">项目名称</div><div class="value hl">{{ row.asset.projectName }}</div></div>
                    <div class="cell"><div class="label">项目地址</div><div class="value">{{ row.asset.projectAddr }}</div></div>
                    <div class="cell"><div class="label">分区</div><div class="value">{{ row.asset.zone }}</div></div>
                    <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.asset.assetName }}</div></div>
                    <div class="cell"><div class="label">资产编号</div><div class="value">{{ row.asset.assetNo }}</div></div>
                    <div class="cell"><div class="label">资产座落</div><div class="value">{{ row.asset.assetAddr }}</div></div>
                    <div class="cell"><div class="label">租赁状态</div><div class="value">{{ row.asset.leaseStatus }}</div></div>
                    <div class="cell">
                      <div class="label">状态</div>
                      <div class="value">
                        <el-tag size="small" :type="row.asset.status === '正常' ? 'success' : 'warning'">{{ row.asset.status }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="assetNo" label="资产编号" width="100" />
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="projectType" label="项目类型" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="row.projectType === '资产产权' ? 'primary' : 'warning'">{{ row.projectType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hasCert" label="产权证有无" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.hasCert === '有' ? 'success' : 'danger'">{{ row.hasCert }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="certNo" label="产权编号" width="170" show-overflow-tooltip />
            <el-table-column prop="certType" label="产权证类型" width="120" />
            <el-table-column prop="ratioType" label="产权比例类型" width="120">
              <template #default="{ row }">
                <el-tag size="small" :type="row.ratioType === '单独所有' ? 'primary' : 'warning'" effect="plain">{{ row.ratioType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注（缺证原因）" min-width="160" show-overflow-tooltip />
            <el-table-column prop="registerDate" label="登记日期" width="120" />
            <el-table-column prop="updateTime" label="更新时间" width="160" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openPropDialog(row)">修改</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="propPage"
              v-model:page-size="propPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="filteredProps.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="证件信息" name="cert">
        <el-card class="table-card" shadow="never">
          <el-table :data="pagedCertTab" border stripe size="small">
            <el-table-column prop="certName" label="证件名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="certType" label="证件类型" width="120" />
            <el-table-column prop="certCode" label="证件号码" min-width="220" show-overflow-tooltip />
            <el-table-column prop="company" label="所属公司" min-width="200" show-overflow-tooltip />
            <el-table-column prop="obtainDate" label="获得日期" width="110" />
            <el-table-column prop="validUntil" label="有效期至" width="110" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="certTabStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="certTabPage"
              v-model:page-size="certTabPageSize"
              :page-sizes="[10, 15, 30, 50]"
              :total="certTabData.length"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="propDialogVisible" :title="propIsEdit ? '修改产权证件' : '新增产权证件'" width="760px" destroy-on-close>
      <el-form :model="propForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="项目类型" required>
              <el-select v-model="propForm.projectType" placeholder="请选择" style="width: 100%">
                <el-option label="资产产权" value="资产产权" />
                <el-option label="项目产权" value="项目产权" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联资产" required>
              <el-select v-model="propForm.assetId" filterable :disabled="propIsEdit"
                placeholder="搜索资产编号或名称" style="width: 100%" @change="onPropAssetChange">
                <el-option v-for="a in propAssetPool" :key="a.id" :label="a.label" :value="a.id">
                  <span>{{ a.label }}</span>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">
                    {{ a.hasCert === '有' ? a.certDetail : a.certStatus }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司">
              <el-input :model-value="propFormCompany" disabled placeholder="选择资产后自动带出" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权证有无" required>
              <el-select v-model="propForm.hasCert" placeholder="请选择" style="width: 100%">
                <el-option label="有" value="有" />
                <el-option label="无" value="无" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产权编号">
              <el-input v-model="propForm.certNo" placeholder="请输入产权编号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产权证类型">
              <el-select v-model="propForm.certType" placeholder="请选择" clearable style="width: 100%">
                <el-option v-for="t in certTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产权类型">
              <el-select v-model="propForm.propType" placeholder="请选择" clearable style="width: 100%">
                <el-option v-for="t in propTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产权比例类型">
              <el-select v-model="propForm.ratioType" placeholder="请选择" style="width: 100%">
                <el-option label="单独所有" value="单独所有" />
                <el-option label="共同所有" value="共同所有" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="propForm.remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="缺证原因等备注信息" />
        </el-form-item>
        <el-form-item label="产权证比例">
          <div style="width: 100%">
            <el-table v-if="propForm.ratios.length" :data="propForm.ratios" border size="small">
              <el-table-column label="名称" min-width="200">
                <template #default="{ row }">
                  <el-input v-model="row.name" size="small" placeholder="请输入名称" />
                </template>
              </el-table-column>
              <el-table-column label="比例%" width="170">
                <template #default="{ row }">
                  <el-input-number v-model="row.ratio" size="small" :min="0" :max="100" :precision="2" style="width: 100%" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeRatio($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link :icon="Plus" @click="addRatio">新增</el-button>
          </div>
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" :limit="5"
            accept=".jpg,.jpeg,.png,.pdf" :on-change="onPropFileChange">
            <el-button type="primary" link :icon="Plus">上传证件文件</el-button>
          </el-upload>
          <div v-if="propForm.files.length" class="attached-list">
            <el-tag v-for="(fn, i) in propForm.files" :key="i" closable size="small"
              @close="propForm.files.splice(i, 1)">{{ fn }}</el-tag>
          </div>
          <div class="form-tip">仅登记文件名称，演示环境不上传二进制文件</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="propDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProp">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useCredentialStore, PROPERTY_CERT_TYPES, PROPERTY_RIGHT_TYPES } from '../../store/credential'

const assetStore = useAssetStore()
const credentialStore = useCredentialStore()

const filterStatus = ref('')

const certStats = computed(() => {
  const all = assetStore.visibleAssets
  return {
    certified: all.filter(a => a.certStatus === '已办证').length,
    processing: all.filter(a => a.certStatus.includes('办理中')).length,
    notStarted: all.filter(a => isCertNotStarted(a.certStatus)).length
  }
})

const scopedCertRecords = computed(() =>
  assetStore.visibleAssets
    .filter(a => a.certStatus !== '已办证')
    .map(a => ({
      assetId: a.id,
      assetName: a.name,
      location: a.location,
      certStatus: a.certStatus,
      progress: a.certStatus.includes('办理中') ? '材料准备中，预计 2 个月内完成' : '待启动，需协调相关部门',
      remark: ''
    }))
)

const filteredRecords = computed(() => {
  return scopedCertRecords.value.filter(r => {
    if (!filterStatus.value) return true
    if (filterStatus.value === '已办证') return r.certStatus.includes('已办证')
    if (filterStatus.value === '办理中') return r.certStatus.includes('办理中')
    if (filterStatus.value === '未启动') return isCertNotStarted(r.certStatus)
    return true
  })
})

function isCertNotStarted(status) {
  return !status.includes('已办证') && !status.includes('办理中')
}

function certStatusTagType(status) {
  if (status.includes('已办证')) return 'success'
  if (status.includes('办理中')) return 'warning'
  return 'danger'
}

const certSelection = ref([])
function onCertSelectionChange(rows) { certSelection.value = rows }

function startCert(row) {
  assetStore.updateAsset(row.assetId, { certStatus: '未办证（办理中）' })
  ElMessage.success(`${row.assetName} 已开始办理`)
}

function revertCert(row) {
  assetStore.updateAsset(row.assetId, { certStatus: '未办证（未启动）' })
  ElMessage.success(`${row.assetName} 已退回未启动`)
}

const completeDialogVisible = ref(false)
const completeForm = ref({ assetId: '', assetName: '', certDetail: '', remark: '' })
const pendingCompleteIds = ref([])

function openCompleteDialog(row) {
  pendingCompleteIds.value = [row.assetId]
  completeForm.value = { assetId: row.assetId, assetName: row.assetName, certDetail: '', remark: '' }
  completeDialogVisible.value = true
}

function completeCert(row) { openCompleteDialog(row) }

function confirmComplete() {
  if (!completeForm.value.certDetail.trim()) {
    ElMessage.warning('请填写权证编号')
    return
  }
  pendingCompleteIds.value.forEach(id => {
    assetStore.updateAsset(id, {
      certStatus: '已办证',
      certDetail: completeForm.value.certDetail,
      propertyRight: '有不动产证'
    })
  })
  const count = pendingCompleteIds.value.length
  ElMessage.success(`${count} 项资产已完成办证`)
  completeDialogVisible.value = false
  pendingCompleteIds.value = []
}

function batchStartCert() {
  const targets = certSelection.value.filter(r => isCertNotStarted(r.certStatus))
  if (!targets.length) { ElMessage.warning('所选资产均非"未启动"状态'); return }
  ElMessageBox.confirm(`确认将 ${targets.length} 项资产开始办理？`, '批量开始办理', { type: 'info' }).then(() => {
    targets.forEach(r => assetStore.updateAsset(r.assetId, { certStatus: '未办证（办理中）' }))
    ElMessage.success(`${targets.length} 项已开始办理`)
    certSelection.value = []
  }).catch(() => {})
}

function batchCompleteCert() {
  const targets = certSelection.value.filter(r => r.certStatus.includes('办理中'))
  if (!targets.length) { ElMessage.warning('所选资产均非"办理中"状态'); return }
  if (targets.length === 1) { openCompleteDialog(targets[0]); return }
  pendingCompleteIds.value = targets.map(r => r.assetId)
  completeForm.value = { assetId: '', assetName: `${targets.length} 项资产`, certDetail: '', remark: '' }
  completeDialogVisible.value = true
}

const activeTab = ref('prop')

// 公司口径跟着资产走：企业端只剩本公司名下的资产，监管端看全区
const companyOptions = computed(() => [...new Set(assetStore.visibleAssets.map(a => a.group).filter(Boolean))])
const certTypeOptions = PROPERTY_CERT_TYPES
const propTypeOptions = PROPERTY_RIGHT_TYPES

const propFilters = ref({ keyword: '', company: '', certType: '', projectType: '', propType: '' })
const propPage = ref(1)
const propPageSize = ref(15)

// 产权登记以资产为主键：有权证的资产自动成行，人工登记过的无证资产在同一份清单里，
// 编号/名称/坐落/状态全部来自资产主数据，不会再出现与台账对不上的 CQ-xxx。
const propRecords = computed(() => {
  const visible = new Set(assetStore.visibleAssets.map(a => a.id))
  return credentialStore.propertyCerts.filter(r => visible.has(r.assetId))
})

// 新增产权登记时可选的资产池（已登记的资产仍可再次修改，不在这里限制）
const propAssetPool = computed(() =>
  assetStore.visibleAssets.map(a => ({
    id: a.id, label: `${a.id} ${a.name}`, group: a.group,
    certStatus: a.certStatus, certDetail: a.certDetail || '', hasCert: a.certDetail ? '有' : '无'
  }))
)

const filteredProps = computed(() => {
  const f = propFilters.value
  return propRecords.value.filter(r => {
    if (f.keyword) {
      const kw = f.keyword
      const hit = r.certNo.includes(kw) || r.asset.assetName.includes(kw) || r.asset.assetNo.includes(kw) || r.asset.projectName.includes(kw)
      if (!hit) return false
    }
    if (f.company && r.company !== f.company) return false
    if (f.certType && r.certType !== f.certType) return false
    if (f.projectType && r.projectType !== f.projectType) return false
    if (f.propType && r.propType !== f.propType) return false
    return true
  })
})

const pagedProps = computed(() => {
  const start = (propPage.value - 1) * propPageSize.value
  return filteredProps.value.slice(start, start + propPageSize.value)
})

function handlePropSearch() { propPage.value = 1 }

const certTabData = computed(() => {
  const visible = new Set(assetStore.visibleAssets.map(a => a.id))
  return credentialStore.credentialList
    .filter(c => visible.has(c.assetId))
    .map(c => {
      const asset = c.assetId ? assetStore.getAssetById(c.assetId) : null
      return {
        certName: `${c.type}${asset ? ' · ' + asset.name : ''}`,
        certType: c.type,
        certCode: c.certNo,
        company: c.group || asset?.group || '—',
        obtainDate: c.issueDate,
        // 时效由到期日实时推导，证件层不存状态字段
        status: c.validity,
        validUntil: c.validUntil || '长期有效'
      }
    })
})
const certTabPage = ref(1)
const certTabPageSize = ref(15)

const pagedCertTab = computed(() => {
  const start = (certTabPage.value - 1) * certTabPageSize.value
  return certTabData.value.slice(start, start + certTabPageSize.value)
})

function certTabStatusType(status) {
  const map = { '有效': 'success', '即将到期': 'warning', '已过期': 'danger' }
  return map[status] || 'info'
}

const propDialogVisible = ref(false)
const propIsEdit = ref(false)
const editingPropId = ref('')

const defaultPropForm = {
  assetId: '', projectType: '资产产权', hasCert: '有', certNo: '', certType: '不动产权证',
  propType: '', ratioType: '单独所有', remark: '', ratios: [], files: []
}
const propForm = ref({ ...defaultPropForm, ratios: [], files: [] })

// 所属公司跟着资产走，不再让用户手填一长串公司名
const propFormCompany = computed(() => assetStore.getAssetById(propForm.value.assetId)?.group || '—')

function onPropAssetChange(id) {
  const a = assetStore.getAssetById(id)
  if (!a) return
  if (!propForm.value.certNo) propForm.value.certNo = a.certDetail || ''
  if (a.certDetail) {
    propForm.value.hasCert = '有'
    if (!propForm.value.certType) propForm.value.certType = '不动产权证'
  }
}

function openPropDialog(row) {
  if (row) {
    propIsEdit.value = true
    editingPropId.value = row.assetId
    propForm.value = {
      assetId: row.assetId,
      projectType: row.projectType, hasCert: row.hasCert, certNo: row.certNo,
      certType: row.certType, propType: row.propType, ratioType: row.ratioType, remark: row.remark,
      ratios: row.ratios.map(r => ({ ...r })), files: [...(row.files || [])]
    }
  } else {
    propIsEdit.value = false
    editingPropId.value = ''
    propForm.value = { ...defaultPropForm, ratios: [], files: [] }
  }
  propDialogVisible.value = true
}

function addRatio() {
  propForm.value.ratios.push({ name: propFormCompany.value, ratio: 0 })
}

function removeRatio(index) {
  propForm.value.ratios.splice(index, 1)
}

function onPropFileChange(file, fileList) {
  propForm.value.files = fileList.slice(0, 5).map(f => f.name)
}

function saveProp() {
  const f = propForm.value
  if (!f.assetId || !f.projectType || !f.hasCert) {
    ElMessage.warning('请选择资产并填写项目类型、产权证有无')
    return
  }
  if (f.hasCert === '有' && (!f.certNo || !f.certType)) {
    ElMessage.warning('产权证有时须填写产权编号与产权证类型')
    return
  }
  const res = credentialStore.savePropertyCert({
    assetId: f.assetId, projectType: f.projectType, hasCert: f.hasCert, certNo: f.certNo,
    certType: f.certType, propType: f.propType, ratioType: f.ratioType, remark: f.remark,
    ratios: f.ratios, files: f.files
  })
  if (!res.ok) {
    ElMessage.warning(res.message)
    return
  }
  const linked = assetStore.getAssetById(f.assetId)  // 回写会替换 store 里的资产对象，取新引用
  ElMessage.success(
    `${linked.name} 产权信息已保存：办证状态「${linked.certStatus}」，权证号 ${linked.certDetail || '—'}，产权状况「${linked.propertyRight || '—'}」`
  )
  propDialogVisible.value = false
}
</script>

<style scoped>
.toolbar-row { display: flex; align-items: center; gap: 8px; }
.el-tab-pane > .toolbar-row { margin-bottom: 12px; }
.expand-panel { padding: 12px 24px; background: var(--bg-page); }
.file-thumbs { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.file-thumbs .thumb {
  width: 92px; height: 92px; border: 1px solid var(--bd); border-radius: var(--r-sm); background: var(--bg-page);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  font-size: 12px; color: var(--t-weak); padding: 8px; text-align: center; word-break: break-all; overflow: hidden;
}
.file-thumbs .no-file { font-size: 13px; color: var(--t-weak); line-height: 92px; }
.attached-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.form-tip { font-size: 12px; color: var(--t-weak); line-height: 1.5; width: 100%; }
</style>
