<template>
  <div class="gov-supervise">
    <div class="page-header">
      <h2>督办管理</h2>
      <div>
        <el-button @click="scanOverdue">
          <el-icon><AlarmClock /></el-icon> 扫描逾期
        </el-button>
        <el-button type="primary" @click="$router.push('/gov/supervise/create')">
          <el-icon><Plus /></el-icon> 新建督办
        </el-button>
      </div>
    </div>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="4" v-for="kpi in kpiList" :key="kpi.label">
        <el-card class="kpi-card" shadow="hover" @click="applyKpiFilter(kpi.status)">
          <div class="kpi-value" :style="{ color: kpi.color }">
            {{ kpi.value }}<span class="kpi-unit">{{ kpi.unit }}</span>
          </div>
          <div class="kpi-label">{{ kpi.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <div class="filter-bar">
      <el-form :inline="true" :model="filter">
        <el-form-item label="状态">
          <el-select v-model="filter.status" clearable placeholder="全部" style="width: 140px">
            <el-option label="待处理" value="待处理" />
            <el-option label="待复核" value="待确认" />
            <el-option label="已驳回" value="已驳回" />
            <el-option label="已逾期" value="已逾期" />
            <el-option label="已办结" value="已办结" />
          </el-select>
        </el-form-item>
        <el-form-item label="集团">
          <el-select v-model="filter.group" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="filteredList" border stripe class="table-card">
      <el-table-column prop="id" label="督办编号" width="140" />
      <el-table-column prop="group" label="督办对象" width="120" />
      <el-table-column prop="type" label="督办类型" width="120" />
      <el-table-column prop="reason" label="督办事由" min-width="240" show-overflow-tooltip />
      <el-table-column prop="deadline" label="限期" width="110" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          <div v-if="row.status === '已逾期'" class="overdue-tip">逾期 {{ row.overdueDays || 0 }} 天</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button type="primary" link @click="$router.push(`/gov/supervise/${row.id}`)">查看</el-button>
          <el-button
            v-if="row.status !== '已办结'"
            type="warning"
            link
            @click="urge(row)"
          >催办</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSuperviseStore } from '../../store/supervise'
import { Plus, AlarmClock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const superviseStore = useSuperviseStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const filter = ref({ status: '', group: '' })

const stats = computed(() => superviseStore.stats)

const kpiList = computed(() => [
  { label: '督办总数', value: stats.value.total, unit: '件', color: '', status: '' },
  { label: '待处理', value: stats.value.pending, unit: '件', color: '#e6a23c', status: '待处理' },
  { label: '待复核', value: stats.value.confirming, unit: '件', color: '#409eff', status: '待确认' },
  { label: '已驳回', value: stats.value.rejected, unit: '件', color: '#909399', status: '已驳回' },
  { label: '已逾期', value: stats.value.overdue, unit: '件', color: '#f56c6c', status: '已逾期' },
  { label: '办结率', value: stats.value.doneRate, unit: '%', color: '#67c23a', status: '已办结' }
])

const filteredList = computed(() => {
  return superviseStore.orders.filter(o => {
    if (filter.value.status && o.status !== filter.value.status) return false
    if (filter.value.group && o.group !== filter.value.group) return false
    return true
  })
})

function applyKpiFilter(status) {
  filter.value.status = filter.value.status === status ? '' : status
}

function statusType(status) {
  if (status === '待处理') return 'warning'
  if (status === '待确认') return ''
  if (status === '已办结') return 'success'
  if (status === '已逾期') return 'danger'
  return 'info'
}

function resetFilter() {
  filter.value = { status: '', group: '' }
}

/** 逾期判定：置为已逾期 + 生成企业端预警任务 + 两端发通知 */
function scanOverdue(silent = false) {
  const flagged = superviseStore.checkOverdue()
  if (flagged.length) {
    ElMessage.warning(`${flagged.length} 件督办已逾期，已生成预警任务并通知企业端`)
  } else if (!silent) {
    ElMessage.success('扫描完成，暂无逾期督办')
  }
}

function urge(row) {
  superviseStore.urgeOrder(row.id)
  ElMessage.success(`已向 ${row.group} 发送催办通知`)
}

onMounted(() => scanOverdue(true))
</script>

<style scoped>
.overdue-tip {
  font-size: 12px;
  color: #f56c6c;
  margin-top: 2px;
}
</style>
