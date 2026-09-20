<template>
  <div class="page-container">
    <div class="page-header">
      <h2>抵押列表</h2>
      <div>
        <el-button type="primary" @click="showMortgageForm">新增抵押</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="资产名称/编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.projectType" placeholder="项目类型" clearable>
            <el-option label="房产类" value="房产类" />
            <el-option label="土地类" value="土地类" />
            <el-option label="设备类" value="设备类" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="抵押状态" clearable>
            <el-option label="抵押中" value="抵押中" />
            <el-option label="已解押" value="已解押" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.company" placeholder="所属公司" clearable>
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
      <el-table :data="filteredMortgages" border stripe>
        <el-table-column prop="id" label="抵押编号" width="130" />
        <el-table-column prop="assetName" label="资产名称" min-width="180" />
        <el-table-column prop="projectType" label="项目类型" width="100" />
        <el-table-column prop="company" label="所属公司" width="100" />
        <el-table-column prop="mortgagor" label="抵押公司/人" width="150" />
        <el-table-column prop="contractNo" label="抵押合同编号" width="140" />
        <el-table-column prop="amount" label="抵押金额(万元)" width="120" align="right">
          <template #default="{ row }">{{ row.amount ? Number(row.amount).toFixed(2) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="bank" label="抵押银行" width="150" />
        <el-table-column prop="period" label="抵押期限(月)" width="110" align="right" />
        <el-table-column label="抵押起止时间" width="200">
          <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewMortgage(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="editMortgage(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteMortgage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="page" :page-size="15" :total="filteredMortgages.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <!-- 新增/编辑抵押对话框 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑抵押信息' : '新增抵押信息'" width="700px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="项目类型" prop="projectType">
              <el-select v-model="form.projectType" placeholder="请选择" style="width: 100%">
                <el-option label="房产类" value="房产类" />
                <el-option label="土地类" value="土地类" />
                <el-option label="设备类" value="设备类" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属公司" prop="company">
              <el-select v-model="form.company" placeholder="请选择" style="width: 100%">
                <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资产" prop="assetId">
              <el-select v-model="form.assetId" placeholder="请选择资产" filterable style="width: 100%" @change="handleAssetChange">
                <el-option v-for="a in availableAssets" :key="a.id" :label="a.name" :value="a.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抵押公司/人" prop="mortgagor">
              <el-input v-model="form.mortgagor" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="抵押合同编号" prop="contractNo">
              <el-input v-model="form.contractNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抵押金额(万元)" prop="amount">
              <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="抵押银行" prop="bank">
              <el-select v-model="form.bank" placeholder="请选择" style="width: 100%">
                <el-option label="中国工商银行长乐支行" value="中国工商银行长乐支行" />
                <el-option label="中国建设银行长乐支行" value="中国建设银行长乐支行" />
                <el-option label="中国农业银行长乐支行" value="中国农业银行长乐支行" />
                <el-option label="中国银行长乐支行" value="中国银行长乐支行" />
                <el-option label="交通银行长乐支行" value="交通银行长乐支行" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="抵押期限(月)" prop="period">
              <el-input-number v-model="form.period" :min="1" :max="360" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="抵押起止时间" prop="dateRange">
              <el-date-picker
                v-model="form.dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option label="抵押中" value="抵押中" />
                <el-option label="已解押" value="已解押" />
                <el-option label="已逾期" value="已逾期" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :file-list="form.attachments" :on-change="handleFileChange">
            <el-button type="primary" plain>点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">文件类型：图片、word和pdf</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="detailVisible" title="抵押详情" width="700px">
      <el-descriptions :column="2" border v-if="currentMortgage">
        <el-descriptions-item label="抵押编号">{{ currentMortgage.id }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">{{ currentMortgage.projectType }}</el-descriptions-item>
        <el-descriptions-item label="所属公司">{{ currentMortgage.company }}</el-descriptions-item>
        <el-descriptions-item label="资产名称">{{ currentMortgage.assetName }}</el-descriptions-item>
        <el-descriptions-item label="抵押公司/人">{{ currentMortgage.mortgagor }}</el-descriptions-item>
        <el-descriptions-item label="抵押合同编号">{{ currentMortgage.contractNo }}</el-descriptions-item>
        <el-descriptions-item label="抵押金额(万元)">{{ currentMortgage.amount }}</el-descriptions-item>
        <el-descriptions-item label="抵押银行">{{ currentMortgage.bank }}</el-descriptions-item>
        <el-descriptions-item label="抵押期限(月)">{{ currentMortgage.period }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentMortgage.status)" size="small">{{ currentMortgage.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="抵押起止时间" :span="2">{{ currentMortgage.startDate }} ~ {{ currentMortgage.endDate }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useMortgageStore } from '../../store/mortgage'
import { useAssetStore } from '../../store/asset'
import { ElMessage, ElMessageBox } from 'element-plus'

const mortgageStore = useMortgageStore()
const assetStore = useAssetStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const filters = reactive({
  keyword: '',
  projectType: '',
  status: '',
  company: ''
})

const page = ref(1)

const filteredMortgages = computed(() => {
  let list = mortgageStore.mortgages
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(m => m.assetName.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw))
  }
  if (filters.projectType) list = list.filter(m => m.projectType === filters.projectType)
  if (filters.status) list = list.filter(m => m.status === filters.status)
  if (filters.company) list = list.filter(m => m.company === filters.company)
  return list
})

const availableAssets = computed(() => {
  if (filters.company) {
    return assetStore.getAssetsByCompany(filters.company)
  }
  return assetStore.allAssets
})

const formVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({
  projectType: '',
  company: '',
  assetId: '',
  mortgagor: '',
  contractNo: '',
  amount: 0,
  bank: '',
  period: 0,
  dateRange: [],
  status: '抵押中',
  attachments: []
})

const rules = {
  projectType: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  company: [{ required: true, message: '请选择所属公司', trigger: 'change' }],
  assetId: [{ required: true, message: '请选择资产', trigger: 'change' }],
  mortgagor: [{ required: true, message: '请输入抵押公司/人', trigger: 'blur' }],
  contractNo: [{ required: true, message: '请输入抵押合同编号', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入抵押金额', trigger: 'blur' }],
  bank: [{ required: true, message: '请选择抵押银行', trigger: 'change' }],
  period: [{ required: true, message: '请输入抵押期限', trigger: 'blur' }],
  dateRange: [{ required: true, message: '请选择抵押起止时间', trigger: 'change' }]
}

const currentMortgage = ref(null)

function getStatusType(status) {
  const map = { '抵押中': 'warning', '已解押': 'success', '已逾期': 'danger' }
  return map[status] || 'info'
}

function handleAssetChange(assetId) {
  const asset = assetStore.getAssetById(assetId)
  if (asset) {
    form.company = asset.group
  }
}

function handleFileChange(file, fileList) {
  form.attachments = fileList
}

function showMortgageForm() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    projectType: '',
    company: '',
    assetId: '',
    mortgagor: '',
    contractNo: '',
    amount: 0,
    bank: '',
    period: 0,
    dateRange: [],
    status: '抵押中',
    attachments: []
  })
  formVisible.value = true
}

function editMortgage(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    projectType: row.projectType,
    company: row.company,
    assetId: row.assetId,
    mortgagor: row.mortgagor,
    contractNo: row.contractNo,
    amount: row.amount,
    bank: row.bank,
    period: row.period,
    dateRange: [row.startDate, row.endDate],
    status: row.status,
    attachments: row.attachments || []
  })
  formVisible.value = true
}

function viewMortgage(row) {
  currentMortgage.value = row
  detailVisible.value = true
}

function deleteMortgage(row) {
  ElMessageBox.confirm(`确认删除抵押记录 ${row.id}？`, '提示', { type: 'warning' })
    .then(() => {
      mortgageStore.deleteMortgage(row.id)
      ElMessage.success('删除成功')
    })
    .catch(() => {})
}

function submitForm() {
  formRef.value.validate(valid => {
    if (!valid) return
    const data = {
      projectType: form.projectType,
      company: form.company,
      assetId: form.assetId,
      assetName: assetStore.getAssetById(form.assetId)?.name || '',
      mortgagor: form.mortgagor,
      contractNo: form.contractNo,
      amount: form.amount,
      bank: form.bank,
      period: form.period,
      startDate: form.dateRange[0] || '',
      endDate: form.dateRange[1] || '',
      status: form.status,
      attachments: form.attachments
    }
    if (isEdit.value) {
      mortgageStore.updateMortgage(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      mortgageStore.addMortgage(data)
      ElMessage.success('新增成功')
    }
    formVisible.value = false
  })
}

function handleSearch() {
  page.value = 1
}

function resetFilters() {
  filters.keyword = ''
  filters.projectType = ''
  filters.status = ''
  filters.company = ''
  page.value = 1
}

function handleExport() {
  ElMessage.success('导出功能开发中')
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
  margin-bottom: 20px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.filter-bar {
  margin-bottom: 16px;
}
.table-card {
  margin-bottom: 16px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
