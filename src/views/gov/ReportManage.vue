<template>
  <div class="gov-report-manage">
    <div class="page-header">
      <h2>上报数据管理</h2>
      <div class="header-actions">
        <el-tag type="info" size="small">待审核 {{ pendingCount }} 条</el-tag>
      </div>
    </div>

    <el-table :data="reportList" border stripe class="table-card fill">
      <el-table-column prop="id" label="报送编号" width="140" />
      <el-table-column prop="company" label="报送单位" min-width="120" />
      <el-table-column prop="period" label="报送期间" width="120" />
      <el-table-column prop="submitTime" label="提交时间" width="160" />
      <el-table-column label="资产/价值" width="140" align="right">
        <template #default="{ row }">
          {{ row.assetCount }} 宗 / {{ row.totalValue }} 万
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleReceive(row)" v-if="row.status === '待审核'">接收</el-button>
          <el-button type="warning" link size="small" @click="handleReturn(row)" v-if="row.status === '待审核'">退回重报</el-button>
          <el-button type="primary" link size="small" @click="viewDetail(row)">查看明细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="showDetail" title="报送明细" size="580px">
      <template v-if="currentRow">
        <el-descriptions :column="2" border style="margin-bottom: 16px">
          <el-descriptions-item label="报送编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="报送单位">{{ currentRow.company }}</el-descriptions-item>
          <el-descriptions-item label="报送期间">{{ currentRow.period }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentRow.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="退回原因" v-if="currentRow.returnReason">{{ currentRow.returnReason }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">资产概况</div>
        <el-descriptions :column="2" border style="margin-bottom: 16px">
          <el-descriptions-item label="资产总数">{{ currentRow.data.assets }} 宗</el-descriptions-item>
          <el-descriptions-item label="账面价值">{{ currentRow.data.bookValue }} 万元</el-descriptions-item>
          <el-descriptions-item label="已出租">{{ currentRow.data.rented }} 宗（出租率 {{ currentRow.data.rentalRate }}%）</el-descriptions-item>
          <el-descriptions-item label="闲置">{{ currentRow.data.idle }} 宗（闲置率 {{ currentRow.data.idleRate }}%）</el-descriptions-item>
          <el-descriptions-item label="未办证">{{ currentRow.data.unCert }} 宗</el-descriptions-item>
        </el-descriptions>

        <div class="section-title">经营收入</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="累计应收">{{ currentRow.data.cumReceivable }} 万元</el-descriptions-item>
          <el-descriptions-item label="累计实收">{{ currentRow.data.cumActual }} 万元</el-descriptions-item>
          <el-descriptions-item label="年度应收">{{ currentRow.data.yearReceivable }} 万元</el-descriptions-item>
          <el-descriptions-item label="年度实收">{{ currentRow.data.yearActual }} 万元</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useReportStore } from '../../store/report'

const reportStore = useReportStore()

const showDetail = ref(false)
const currentRow = ref(null)

const reportList = computed(() => [...reportStore.reports].reverse())
const pendingCount = computed(() => reportStore.reports.filter(r => r.status === '待审核').length)

function statusType(status) {
  if (status === '待审核') return 'warning'
  if (status === '已接收') return 'success'
  if (status === '已退回') return 'danger'
  return 'info'
}

function handleReceive(row) {
  ElMessageBox.confirm(`确认接收${row.company}的报送数据？`, '确认', { type: 'info' }).then(() => {
    reportStore.acceptReport(row.id)
    ElMessage.success('已接收')
  }).catch(() => {})
}

function handleReturn(row) {
  ElMessageBox.prompt('请输入退回原因', '退回重报', { confirmButtonText: '确认退回', cancelButtonText: '取消', inputPattern: /.+/, inputErrorMessage: '请输入退回原因' }).then(({ value }) => {
    reportStore.returnReport(row.id, value)
    ElMessage.success(`已退回：${value}`)
  }).catch(() => {})
}

function viewDetail(row) {
  currentRow.value = row
  showDetail.value = true
}
</script>

<style scoped>
.gov-report-manage .page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.gov-report-manage .page-header h2 {
  margin: 0;
  font-size: 18px;
}
.section-title {
  font-weight: 600;
  font-size: 14px;
  margin: 16px 0 8px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
</style>
