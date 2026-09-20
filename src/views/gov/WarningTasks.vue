<template>
  <div class="warning-tasks">
    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane name="tasks">
        <template #label>
          <span>待办任务</span>
          <el-badge :value="pendingCount" type="primary" style="margin-left: 6px" />
        </template>

        <el-row :gutter="16" class="filter-row">
          <el-col :span="6">
            <el-input v-model="taskSearch" placeholder="搜索任务名称/资产" :prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="taskTypeFilter" placeholder="任务类型" clearable>
              <el-option label="欠费催缴" value="欠费催缴" />
              <el-option label="合同临期" value="合同临期" />
              <el-option label="闲置超期" value="闲置超期" />
              <el-option label="未办证" value="未办证" />
              <el-option label="闲置盘活" value="闲置盘活" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="taskStatusFilter" placeholder="状态" clearable>
              <el-option label="待处理" value="待处理" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="groupFilter" placeholder="集团" clearable>
              <el-option label="城投集团" value="城投集团" />
              <el-option label="产投集团" value="产投集团" />
              <el-option label="水投集团" value="水投集团" />
              <el-option label="领航公司" value="领航公司" />
            </el-select>
          </el-col>
          <el-col :span="6" style="text-align: right">
            <el-button :icon="Download" @click="handleExport">导出</el-button>
          </el-col>
        </el-row>

        <el-table :data="filteredTasks" stripe style="width: 100%; margin-top: 16px">
          <el-table-column prop="id" label="任务编号" width="100" />
          <el-table-column prop="name" label="任务名称" min-width="180" />
          <el-table-column prop="group" label="所属集团" width="120" />
          <el-table-column prop="asset" label="关联资产" min-width="200" />
          <el-table-column prop="type" label="任务类型" width="100">
            <template #default="{ row }">
              <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="priorityTagMap[row.priority]" size="small" effect="dark">{{ row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="截止时间" width="120" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagMap[row.status]" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" width="100" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewTask(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane name="inventory">
        <template #label>
          <span>资产盘点</span>
          <el-badge :value="inventoryPendingCount" type="warning" style="margin-left: 6px" />
        </template>

        <el-row :gutter="16" class="filter-row">
          <el-col :span="6">
            <el-input v-model="inventorySearch" placeholder="搜索盘点任务" :prefix-icon="Search" clearable />
          </el-col>
          <el-col :span="4">
            <el-select v-model="inventoryStatusFilter" placeholder="状态" clearable>
              <el-option label="进行中" value="进行中" />
              <el-option label="已完成" value="已完成" />
              <el-option label="已审核" value="已审核" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="groupFilter" placeholder="集团" clearable>
              <el-option label="城投集团" value="城投集团" />
              <el-option label="产投集团" value="产投集团" />
              <el-option label="水投集团" value="水投集团" />
              <el-option label="领航公司" value="领航公司" />
            </el-select>
          </el-col>
          <el-col :span="6" :offset="4" style="text-align: right">
            <el-button :icon="Download" @click="handleExportInventory">导出报表</el-button>
          </el-col>
        </el-row>

        <el-table :data="filteredInventory" stripe style="width: 100%; margin-top: 16px">
          <el-table-column prop="id" label="盘点编号" width="100" />
          <el-table-column prop="name" label="盘点名称" min-width="180" />
          <el-table-column prop="group" label="所属集团" width="120" />
          <el-table-column prop="type" label="盘点类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="180">
            <template #default="{ row }">
              <el-progress :percentage="Math.round(row.doneCount / row.totalAssets * 100)" :status="row.status === '已完成' || row.status === '已审核' ? 'success' : undefined" />
              <span style="font-size: 12px; color: #999">{{ row.doneCount }}/{{ row.totalAssets }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="截止日期" width="120" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="invStatusMap[row.status]" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" width="100" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewInventory(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="detailVisible" title="详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions v-if="detailType === 'task'" :column="1" border>
          <el-descriptions-item label="任务编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="所属集团">{{ currentRow.group }}</el-descriptions-item>
          <el-descriptions-item label="关联资产">{{ currentRow.asset }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">
            <el-tag :type="typeTagMap[currentRow.type] || 'info'" size="small">{{ currentRow.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityTagMap[currentRow.priority]" size="small" effect="dark">{{ currentRow.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentRow.deadline }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagMap[currentRow.status]" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentRow.assignee }}</el-descriptions-item>
        </el-descriptions>
        <el-descriptions v-else :column="1" border>
          <el-descriptions-item label="盘点编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="盘点名称">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="所属集团">{{ currentRow.group }}</el-descriptions-item>
          <el-descriptions-item label="盘点类型">
            <el-tag size="small">{{ currentRow.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资产总数">{{ currentRow.totalAssets }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ currentRow.doneCount }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentRow.startDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentRow.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="invStatusMap[currentRow.status]" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentRow.assignee }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Download } from '@element-plus/icons-vue'
import { useWarningStore } from '../../store/warning'
import { ElMessage } from 'element-plus'

const warningStore = useWarningStore()

const activeTab = ref('tasks')

const taskSearch = ref('')
const taskTypeFilter = ref('')
const taskStatusFilter = ref('')
const groupFilter = ref('')

const inventorySearch = ref('')
const inventoryStatusFilter = ref('')

const detailVisible = ref(false)
const currentRow = ref(null)
const detailType = ref('task')

const typeTagMap = { '欠费催缴': 'danger', '合同临期': 'warning', '闲置超期': 'warning', '未办证': 'info', '闲置盘活': '' }
const priorityTagMap = { '高': 'danger', '中': 'warning', '低': 'info' }
const statusTagMap = { '待处理': 'warning', '进行中': '', '已完成': 'success' }
const invStatusMap = { '进行中': '', '已完成': 'success', '已审核': 'success' }

const pendingCount = computed(() => warningStore.warningTasks.filter(t => t.status !== '已完成').length)
const inventoryPendingCount = computed(() => warningStore.inventoryTasks.filter(t => t.status === '进行中').length)

const filteredTasks = computed(() => {
  let list = [...warningStore.warningTasks]
  if (taskSearch.value) {
    const kw = taskSearch.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw) || t.asset.toLowerCase().includes(kw))
  }
  if (taskTypeFilter.value) list = list.filter(t => t.type === taskTypeFilter.value)
  if (taskStatusFilter.value) list = list.filter(t => t.status === taskStatusFilter.value)
  if (groupFilter.value) list = list.filter(t => t.group === groupFilter.value)
  return list
})

const filteredInventory = computed(() => {
  let list = [...warningStore.inventoryTasks]
  if (inventorySearch.value) {
    const kw = inventorySearch.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw))
  }
  if (inventoryStatusFilter.value) list = list.filter(t => t.status === inventoryStatusFilter.value)
  if (groupFilter.value) list = list.filter(t => t.group === groupFilter.value)
  return list
})

function handleViewTask(row) {
  detailType.value = 'task'
  currentRow.value = row
  detailVisible.value = true
}

function handleViewInventory(row) {
  detailType.value = 'inventory'
  currentRow.value = row
  detailVisible.value = true
}

function handleExport() {
  const headers = ['任务编号', '标题', '类型', '紧急度', '触发来源', '处理人', '状态']
  const rows = warningStore.warningTasks.map(t => [t.id, t.title, t.type, t.level, t.trigger, t.assignee, t.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `预警任务列表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('任务列表已导出')
}

function handleExportInventory() {
  const headers = ['盘点编号', '盘点名称', '所属公司', '类型', '总资产数', '已完成', '待处理', '状态']
  const rows = warningStore.inventoryTasks.map(t => [t.id, t.name, t.group, t.type, t.totalAssets, t.doneCount, t.pendingCount, t.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `盘点报表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('盘点报表已导出')
}
</script>

<style scoped>
.warning-tasks {
  padding: 0;
}

.filter-row {
  margin-bottom: 0;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 16px 0;
}
</style>
