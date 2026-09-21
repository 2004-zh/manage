<template>
  <div class="gov-report-manage">
    <div class="page-header">
      <h2>上报数据管理</h2>
    </div>

    <el-table :data="reportList" border stripe class="table-card fill">
      <el-table-column prop="id" label="报送编号" width="140" />
      <el-table-column prop="group" label="报送单位" width="120" />
      <el-table-column prop="period" label="报送期间" width="120" />
      <el-table-column prop="submitTime" label="提交时间" width="160" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleReceive(row)" v-if="row.status === '待接收'">接收</el-button>
          <el-button type="warning" link size="small" @click="handleReturn(row)" v-if="row.status === '待接收'">退回重报</el-button>
          <el-button type="primary" link size="small" @click="viewDetail(row)">查看明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="showDetail" title="报送明细" size="550px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border style="margin-bottom: 16px">
          <el-descriptions-item label="报送编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="报送单位">{{ currentRow.group }}</el-descriptions-item>
          <el-descriptions-item label="报送期间">{{ currentRow.period }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRow.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-table :data="detailRows" border size="small">
          <el-table-column prop="category" label="资产类别" width="120" />
          <el-table-column prop="count" label="宗数" width="80" align="right" />
          <el-table-column prop="value" label="账面价值(亿元)" width="140" align="right" />
          <el-table-column prop="rentalRate" label="出租率" width="80" align="right" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const showDetail = ref(false)
const currentRow = ref(null)
const detailRows = ref([])

const detailDataMap = {
  '城投集团': [
    { category: '商业用房', count: 85, value: 12.3, rentalRate: '94.1%', remark: '' },
    { category: '工业厂房', count: 42, value: 8.5, rentalRate: '88.1%', remark: '3处招租中' },
    { category: '办公用房', count: 28, value: 5.2, rentalRate: '96.4%', remark: '' },
    { category: '其他', count: 15, value: 2.1, rentalRate: '80.0%', remark: '2处闲置' }
  ],
  '产投集团': [
    { category: '商业用房', count: 45, value: 6.8, rentalRate: '91.1%', remark: '' },
    { category: '工业厂房', count: 38, value: 7.2, rentalRate: '86.8%', remark: '' },
    { category: '办公用房', count: 18, value: 3.1, rentalRate: '94.4%', remark: '' },
    { category: '其他', count: 12, value: 1.5, rentalRate: '75.0%', remark: '3处闲置' }
  ],
  '水投集团': [
    { category: '商业用房', count: 30, value: 4.2, rentalRate: '90.0%', remark: '' },
    { category: '工业厂房', count: 15, value: 3.8, rentalRate: '86.7%', remark: '' },
    { category: '办公用房', count: 12, value: 2.0, rentalRate: '91.7%', remark: '' },
    { category: '其他', count: 8, value: 0.8, rentalRate: '75.0%', remark: '2处闲置' }
  ],
  '领航公司': [
    { category: '商业用房', count: 20, value: 3.5, rentalRate: '85.0%', remark: '' },
    { category: '工业厂房', count: 10, value: 2.8, rentalRate: '80.0%', remark: '2处招租中' },
    { category: '办公用房', count: 8, value: 1.5, rentalRate: '87.5%', remark: '' },
    { category: '其他', count: 5, value: 0.6, rentalRate: '60.0%', remark: '2处闲置' }
  ]
}

const reportList = ref([
  { id: 'SB-2026-001', group: '城投集团', period: '2026年度', submitTime: '2026-09-10 14:30', status: '待接收' },
  { id: 'SB-2026-002', group: '产投集团', period: '2026年度', submitTime: '2026-09-08 10:15', status: '已接收' },
  { id: 'SB-2026-003', group: '水投集团', period: '2026年度', submitTime: '2026-09-05 16:45', status: '已接收' },
  { id: 'SB-2026-004', group: '领航公司', period: '2026年度', submitTime: '2026-09-03 09:20', status: '已退回' }
])

function statusType(status) {
  if (status === '待接收') return 'warning'
  if (status === '已接收') return 'success'
  if (status === '已退回') return 'danger'
  return 'info'
}

function handleReceive(row) {
  ElMessageBox.confirm(`确认接收${row.group}的报送数据？`, '确认', { type: 'info' }).then(() => {
    row.status = '已接收'
    ElMessage.success('已接收')
  }).catch(() => {})
}

function handleReturn(row) {
  ElMessageBox.prompt('请输入退回原因', '退回重报', { confirmButtonText: '确认退回', cancelButtonText: '取消', inputPattern: /.+/, inputErrorMessage: '请输入退回原因' }).then(({ value }) => {
    row.status = '已退回'
    ElMessage.success(`已退回：${value}`)
  }).catch(() => {})
}

function viewDetail(row) {
  currentRow.value = row
  detailRows.value = detailDataMap[row.group] || []
  showDetail.value = true
}
</script>
