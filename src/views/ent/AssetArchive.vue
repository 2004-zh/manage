<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产档案</h2>
      <div class="header-actions">
        <el-input v-model="keyword" placeholder="搜索编号/名称/位置" clearable style="width:240px" prefix-icon="Search" />
        <el-select v-model="filterCategory" placeholder="资产分类" clearable style="width:150px">
          <el-option v-for="c in ASSET_CATEGORIES" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="使用状态" clearable style="width:130px">
          <el-option label="已出租" value="已出租" />
          <el-option label="闲置" value="闲置" />
          <el-option label="空置" value="空置" />
          <el-option label="自用" value="自用" />
        </el-select>
        <el-select v-model="filterCert" placeholder="权证状态" clearable style="width:150px">
          <el-option label="已办证" value="已办证" />
          <el-option label="办理中" value="办理中" />
          <el-option label="未启动" value="未启动" />
        </el-select>
      </div>
    </div>

    <div class="stats-row">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="资产总数" :value="filteredAssets.length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总面积(㎡)" :value="totalArea" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总账面值(万元)" :value="totalBookValue" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="出租率(%)" :value="rentalRate" />
        </el-col>
      </el-row>
    </div>

    <el-table :data="paginatedAssets" stripe highlight-current-row @current-change="selectAsset"
              style="width:100%;margin-top:16px" max-height="420">
      <el-table-column prop="id" label="编号" width="110" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="assetCategory" label="分类" width="130" />
      <el-table-column prop="area" label="面积(㎡)" width="100" align="right">
        <template #default="{ row }">{{ row.area ? Number(row.area).toLocaleString() : '-' }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
          <el-tag v-if="row.mortgageStatus === '已抵押'" type="danger" size="small" style="margin-left:4px">已抵押</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="certStatus" label="权证" width="130">
        <template #default="{ row }">
          <el-tag :type="certTagType(row.certStatus)" size="small">{{ certShortLabel(row.certStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="位置" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="selectAsset(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="filteredAssets.length > pageSize" layout="total, prev, pager, next"
                   :total="filteredAssets.length" :page-size="pageSize" v-model:current-page="currentPage"
                   style="margin-top:12px;justify-content:flex-end" />

    <el-drawer v-model="drawerVisible" title="资产档案详情" size="680px" direction="rtl">
      <template v-if="selectedAsset">
        <el-descriptions :column="2" border size="small" title="基本信息">
          <el-descriptions-item label="资产编号">{{ selectedAsset.id }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ selectedAsset.name }}</el-descriptions-item>
          <el-descriptions-item label="资产分类">{{ selectedAsset.assetCategory }}</el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ selectedAsset.type || '-' }}</el-descriptions-item>
          <el-descriptions-item label="面积(㎡)">{{ selectedAsset.area ? Number(selectedAsset.area).toLocaleString() : '-' }}</el-descriptions-item>
          <el-descriptions-item label="账面价值(万元)">{{ selectedAsset.bookValue || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取得方式">{{ selectedAsset.acquisitionMethod || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资产用途">{{ selectedAsset.assetUsage || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在位置" :span="2">{{ selectedAsset.location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ selectedAsset.group || '-' }}</el-descriptions-item>
          <el-descriptions-item label="使用状态">
            <el-tag :type="statusTagType(selectedAsset.status)" size="small">{{ selectedAsset.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-descriptions :column="2" border size="small" title="权证与租赁" style="margin-top:20px">
          <el-descriptions-item label="权证状态">
            <el-tag :type="certTagType(selectedAsset.certStatus)" size="small">{{ selectedAsset.certStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="权证编号">{{ selectedAsset.certDetail || '无' }}</el-descriptions-item>
          <el-descriptions-item label="不动产权">{{ selectedAsset.propertyRight || '-' }}</el-descriptions-item>
          <el-descriptions-item label="租赁状态">{{ selectedAsset.isLeased || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前租户">{{ selectedAsset.tenant || '无' }}</el-descriptions-item>
          <el-descriptions-item label="租约到期">{{ selectedAsset.leaseExpiry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="月租金(元)">{{ selectedAsset.monthlyRent || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年租金(万元)">{{ selectedAsset.annualRent ? Number(selectedAsset.annualRent).toFixed(2) : '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="activeTab" style="margin-top:20px">
          <el-tab-pane label="关联合同" name="contracts">
            <el-table :data="relatedContracts" size="small" max-height="240">
              <el-table-column prop="id" label="合同编号" width="130" />
              <el-table-column prop="tenant" label="承租方" min-width="160" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === '正常' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="endDate" label="到期日" width="110" />
              <el-table-column prop="annualRent" label="年租金(万)" width="100" align="right" />
            </el-table>
            <el-empty v-if="!relatedContracts.length" description="暂无关联合同" :image-size="60" />
          </el-tab-pane>

          <el-tab-pane label="变更记录" name="changes">
            <el-table :data="relatedChanges" size="small" max-height="240">
              <el-table-column prop="time" label="时间" width="160" />
              <el-table-column prop="fieldLabel" label="字段" width="100" />
              <el-table-column prop="before" label="旧值" min-width="100" show-overflow-tooltip />
              <el-table-column prop="after" label="新值" min-width="100" show-overflow-tooltip />
              <el-table-column prop="action" label="操作" width="100" />
            </el-table>
            <el-empty v-if="!relatedChanges.length" description="暂无变更记录" :image-size="60" />
          </el-tab-pane>

          <el-tab-pane label="抵押信息" name="mortgages">
            <el-table :data="relatedMortgages" size="small" max-height="240">
              <el-table-column prop="mortgagee" label="抵押权人" min-width="160" />
              <el-table-column prop="amount" label="抵押金额(万)" width="120" align="right" />
              <el-table-column prop="startDate" label="起始日" width="110" />
              <el-table-column prop="endDate" label="到期日" width="110" />
              <el-table-column prop="status" label="状态" width="80" />
            </el-table>
            <el-empty v-if="!relatedMortgages.length" description="暂无抵押记录" :image-size="60" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useAuditStore } from '../../store/audit'
import { useMortgageStore } from '../../store/mortgage'
import { ASSET_CATEGORIES } from '../../data/assetCategory'

const assetStore = useAssetStore()
const contractStore = useContractStore()
const auditStore = useAuditStore()
const mortgageStore = useMortgageStore()

const keyword = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const filterCert = ref('')
const currentPage = ref(1)
const pageSize = 20
const drawerVisible = ref(false)
const selectedAsset = ref(null)
const activeTab = ref('contracts')

const filteredAssets = computed(() => {
  return assetStore.visibleAssets.filter(a => {
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      if (!a.id.toLowerCase().includes(kw) && !a.name.toLowerCase().includes(kw) && !(a.location || '').toLowerCase().includes(kw)) return false
    }
    if (filterCategory.value && a.assetCategory !== filterCategory.value) return false
    if (filterStatus.value && a.status !== filterStatus.value) return false
    if (filterCert.value) {
      if (filterCert.value === '已办证' && !a.certStatus.includes('已办证')) return false
      if (filterCert.value === '办理中' && !a.certStatus.includes('办理中')) return false
      if (filterCert.value === '未启动' && a.certStatus.includes('已办证')) return false
      if (filterCert.value === '未启动' && a.certStatus.includes('办理中')) return false
    }
    return true
  })
})

const paginatedAssets = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredAssets.value.slice(start, start + pageSize)
})

const totalArea = computed(() => {
  const sum = filteredAssets.value.reduce((s, a) => s + (Number(a.area) || 0), 0)
  return Math.round(sum * 100) / 100
})

const totalBookValue = computed(() => {
  const sum = filteredAssets.value.reduce((s, a) => s + (Number(a.bookValue) || 0), 0)
  return Math.round(sum * 100) / 100
})

const rentalRate = computed(() => {
  const total = filteredAssets.value.length
  if (!total) return 0
  const rented = filteredAssets.value.filter(a => a.status === '已出租' || a.status === '部分出租').length
  return Math.round(rented / total * 10000) / 100
})

const relatedContracts = computed(() => {
  if (!selectedAsset.value) return []
  return contractStore.visibleContracts.filter(c => c.assetId === selectedAsset.value.id)
})

const relatedChanges = computed(() => {
  if (!selectedAsset.value) return []
  return auditStore.changeRecords
    .filter(r => r.assetId === selectedAsset.value.id)
    .slice(0, 50)
})

const relatedMortgages = computed(() => {
  if (!selectedAsset.value) return []
  return mortgageStore.mortgages.filter(r => r.assetId === selectedAsset.value.id)
})

function selectAsset(row) {
  if (!row) return
  selectedAsset.value = row
  drawerVisible.value = true
  activeTab.value = 'contracts'
}

function statusTagType(status) {
  if (status === '已出租' || status === '部分出租') return 'success'
  if (status === '自用') return ''
  if (status === '闲置' || status === '空置') return 'warning'
  return 'info'
}

function certTagType(status) {
  if (status.includes('已办证')) return 'success'
  if (status.includes('办理中')) return 'warning'
  return 'danger'
}

function certShortLabel(status) {
  if (status.includes('已办证')) return '已办证'
  if (status.includes('办理中')) return '办理中'
  return '未启动'
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}
.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stats-row {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px 20px;
}
</style>
