<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产登记</h2>
      <div>
        <el-button type="primary" @click="showRegisterForm">新增资产</el-button>
        <el-button @click="handleImport">批量导入</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="资产名称/编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.assetType" placeholder="资产类型" clearable>
            <el-option label="房产类" value="房产类" />
            <el-option label="土地类" value="土地类" />
            <el-option label="设备类" value="设备类" />
            <el-option label="车辆类" value="车辆类" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="资产状态" clearable>
            <el-option label="已出租" value="已出租" />
            <el-option label="闲置" value="闲置" />
            <el-option label="自用" value="自用" />
            <el-option label="维修中" value="维修中" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.group" placeholder="所属公司" clearable>
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="filteredAssets" border stripe>
        <el-table-column prop="id" label="资产编号" width="100" />
        <el-table-column prop="name" label="资产名称" min-width="200" />
        <el-table-column prop="assetCategory" label="资产分类" width="100" />
        <el-table-column prop="type" label="资产类型" width="100" />
        <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
        <el-table-column prop="bookValue" label="账面价值(万元)" width="120" align="right">
          <template #default="{ row }">{{ row.bookValue ? Number(row.bookValue).toFixed(2) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="location" label="坐落位置" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certStatus" label="权证状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.certStatus.includes('已') ? 'success' : 'warning'" size="small">{{ row.certStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="所属公司" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewAsset(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editAsset(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteAsset(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" :page-size="15" :total="filteredAssets.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <!-- 新增/编辑资产登记对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑资产' : '新增资产登记'" width="850px" destroy-on-close>
      <el-form :model="form" label-width="110px" class="asset-form">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产权公司" required>
              <el-select v-model="form.group" placeholder="请选择" style="width:100%">
                <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产名称" required>
              <el-input v-model="form.name" placeholder="请输入资产名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产分类" required>
              <el-select v-model="form.assetCategory" placeholder="请选择" style="width:100%">
                <el-option label="房产类" value="房产类" />
                <el-option label="土地类" value="土地类" />
                <el-option label="设备类" value="设备类" />
                <el-option label="车辆类" value="车辆类" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产类型" required>
              <el-select v-model="form.type" placeholder="请选择" style="width:100%">
                <el-option label="商铺" value="商铺" />
                <el-option label="写字楼" value="写字楼" />
                <el-option label="厂房" value="厂房" />
                <el-option label="保障房" value="保障房" />
                <el-option label="综合用房" value="综合用房" />
                <el-option label="仓储/土地" value="仓储/土地" />
                <el-option label="农贸市场" value="农贸市场" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产用途">
              <el-select v-model="form.assetUsage" placeholder="请选择" style="width:100%">
                <el-option label="商业" value="商铺" />
                <el-option label="办公" value="写字楼" />
                <el-option label="住宅" value="住宅" />
                <el-option label="工业" value="厂房" />
                <el-option label="仓储" value="仓储" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产性质">
              <el-select v-model="form.assetNature" placeholder="请选择" style="width:100%">
                <el-option label="经营性" value="经营性" />
                <el-option label="非经营性" value="非经营性" />
                <el-option label="行政事业" value="行政事业" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">位置与面积</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="坐落" required>
              <el-input v-model="form.location" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="建筑面积(㎡)">
              <el-input-number v-model="form.area" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租赁面积(㎡)">
              <el-input-number v-model="form.rentArea" :min="0" :precision="2" style="width:100%" placeholder="可出租面积，默认同建筑面积" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-input v-model="form.floor" placeholder="如: 3F" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="房间号">
              <el-input v-model="form.roomNo" placeholder="如: A-01" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="朝向">
              <el-select v-model="form.orientation" placeholder="请选择" style="width:100%">
                <el-option label="南" value="南" />
                <el-option label="北" value="北" />
                <el-option label="东" value="东" />
                <el-option label="西" value="西" />
                <el-option label="南北" value="南北" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="评估单价(元/㎡)">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="评估总价(万元)">
              <el-input :model-value="evalTotal" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="账面价值(万元)">
              <el-input-number v-model="form.bookValue" :min="0" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">建筑信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="建成年代">
              <el-date-picker v-model="form.buildYear" type="year" placeholder="选择年份" format="YYYY" value-format="YYYY" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结构类型">
              <el-select v-model="form.structureType" placeholder="请选择" style="width:100%">
                <el-option label="钢混" value="钢混" />
                <el-option label="砖混" value="砖混" />
                <el-option label="框架" value="框架" />
                <el-option label="钢结构" value="钢结构" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="装修情况">
              <el-select v-model="form.decoration" placeholder="请选择" style="width:100%">
                <el-option label="精装" value="精装" />
                <el-option label="简装" value="简装" />
                <el-option label="毛坯" value="毛坯" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源方式">
              <el-select v-model="form.sourceType" placeholder="请选择" style="width:100%">
                <el-option label="自购" value="自购" />
                <el-option label="自建" value="自建" />
                <el-option label="划拨" value="划拨" />
                <el-option label="受赠" value="受赠" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产照片">
              <el-upload action="#" list-type="picture-card" :auto-upload="false" :limit="5">
                <el-icon><Plus /></el-icon>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAsset">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="资产编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="资产分类">{{ currentRow.assetCategory }}</el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ currentRow.type }}</el-descriptions-item>
          <el-descriptions-item label="面积(㎡)">{{ currentRow.area }}</el-descriptions-item>
          <el-descriptions-item label="账面价值(万元)">{{ currentRow.bookValue ? Number(currentRow.bookValue).toFixed(2) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="坐落位置">{{ currentRow.location }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="权证状态">{{ currentRow.certStatus }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentRow.group }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <el-dialog v-model="importDialogVisible" title="批量导入资产" width="500px" destroy-on-close>
      <el-upload drag action="" :auto-upload="false" accept=".csv,.xlsx,.xls" :on-change="onImportFileChange" :limit="1">
        <div style="padding: 20px">
          <p>将 CSV 或 Excel 文件拖到此处，或点击上传</p>
          <p style="color: #999; font-size: 12px">支持 .csv / .xlsx / .xls 格式</p>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitImport" :disabled="!importFile">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'

const assetStore = useAssetStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']
const page = ref(1)
const dialogVisible = ref(false)
const isEdit = ref(false)
const detailVisible = ref(false)
const currentRow = ref(null)

const filters = ref({ keyword: '', assetType: '', status: '', group: '' })

const defaultForm = { group: '', name: '', assetCategory: '', type: '', assetUsage: '', assetNature: '', location: '', area: 0, rentArea: 0, unitPrice: 0, bookValue: 0, floor: '', roomNo: '', orientation: '', buildYear: '', structureType: '', decoration: '', sourceType: '' }
const form = ref({ ...defaultForm })

const evalTotal = computed(() => {
  const a = Number(form.value.area) || 0
  const p = Number(form.value.unitPrice) || 0
  return (a * p / 10000).toFixed(2)
})

const filteredAssets = computed(() => {
  return assetStore.assets.filter(a => {
    if (filters.value.keyword) {
      const kw = filters.value.keyword
      const searchable = [a.name, a.id, a.assetNo, a.projectName, a.zoneName, a.floorName, a.location].filter(Boolean).join(' ')
      if (!searchable.includes(kw)) return false
    }
    if (filters.value.assetType && a.assetCategory !== filters.value.assetType) return false
    if (filters.value.status && a.status !== filters.value.status) return false
    if (filters.value.group && a.group !== filters.value.group) return false
    return true
  })
})

const getStatusType = (status) => {
  const map = { '已出租': 'success', '闲置': 'warning', '自用': 'info', '部分出租': 'success', '维修中': '' }
  return map[status] || 'info'
}

function showRegisterForm() {
  isEdit.value = false
  form.value = { ...defaultForm }
  dialogVisible.value = true
}

function editAsset(row) {
  isEdit.value = true
  form.value = { ...row, group: row.group, name: row.name, assetCategory: row.assetCategory, type: row.type, assetUsage: row.assetUsage || '', assetNature: '', location: row.location, area: row.area, rentArea: row.rentArea ?? row.area, unitPrice: row.unitPrice ?? 0, bookValue: row.bookValue ?? 0, floor: '', roomNo: '', orientation: '', buildYear: '', structureType: '', decoration: '', sourceType: row.sourceType || '' }
  dialogVisible.value = true
}

function viewAsset(row) {
  currentRow.value = row
  detailVisible.value = true
}

function deleteAsset(row) {
  ElMessageBox.confirm(`确认删除资产"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
    assetStore.deleteAsset(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function saveAsset() {
  if (!form.value.name || !form.value.group) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (isEdit.value) {
    assetStore.updateAsset(form.value.id, { ...form.value })
    dialogVisible.value = false
    ElMessage.success('编辑成功')
  } else {
    assetStore.addAsset({
      ...form.value,
      status: '闲置',
      certStatus: '未办证',
      certDetail: '',
      leaseStatus: '未出租',
      isLeased: '否',
      partialLease: '不支持',
      annualRent: null,
      propertyRight: '无证',
      acquisitionMethod: form.value.sourceType || '自建'
    })
    dialogVisible.value = false
    page.value = 1
    ElMessage.success('新增成功')
  }
}

function handleSearch() { page.value = 1 }
function resetFilters() { filters.value = { keyword: '', assetType: '', status: '', group: '' } }
const importDialogVisible = ref(false)
const importFile = ref(null)

function handleImport() {
  importFile.value = null
  importDialogVisible.value = true
}
function onImportFileChange(file) {
  importFile.value = file
}
function submitImport() {
  const mockImport = [
    { name: '导入资产-1', assetCategory: '房产类', type: '商铺', area: 120, location: '城关', status: '闲置', certStatus: '未办证', certDetail: '', leaseStatus: '未出租', isLeased: '否', partialLease: '不支持', group: '城投集团', bookValue: 0, annualRent: null, propertyRight: '无证', acquisitionMethod: '自建' },
    { name: '导入资产-2', assetCategory: '土地类', type: '商业用地', area: 500, location: '航城', status: '闲置', certStatus: '未办证', certDetail: '', leaseStatus: '未出租', isLeased: '否', partialLease: '不支持', group: '产投集团', bookValue: 0, annualRent: null, propertyRight: '无证', acquisitionMethod: '划拨' }
  ]
  mockImport.forEach(a => assetStore.addAsset(a))
  importDialogVisible.value = false
  page.value = 1
  ElMessage.success(`文件 "${importFile.value?.name}" 已上传，成功导入 ${mockImport.length} 条记录`)
}
function handleExport() {
  const headers = ['资产编号', '资产名称', '资产分类', '资产类型', '面积(㎡)', '坐落位置', '状态', '权证状态', '所属公司']
  const rows = filteredAssets.value.map(item => [item.id, item.name, item.assetCategory, item.type, item.area, item.location, item.status, item.certStatus, item.group])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_资产登记_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.page-container { height: 100%; }
.asset-form .el-divider { margin: 20px 0 16px; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
