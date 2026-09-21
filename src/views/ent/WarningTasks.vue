<template>
  <div class="warning-tasks">
    <div class="stat-strip">
      <div class="stat-item" v-for="c in levelCards" :key="c.label" :style="{ borderLeftColor: c.color }">
        <div class="stat-value" :style="{ color: c.color }">
          <el-icon style="vertical-align:-3px"><WarnTriangleFilled /></el-icon>
          {{ c.count }}<span class="unit">条</span>
        </div>
        <div class="stat-label">{{ c.label }}</div>
      </div>
    </div>

    <el-row :gutter="16" class="filter-row">
      <el-col :span="5">
        <el-input v-model="taskSearch" placeholder="搜索任务名称/资产" :prefix-icon="Search" clearable />
      </el-col>
      <el-col :span="4">
        <el-select v-model="taskTypeFilter" placeholder="任务类型" clearable>
          <el-option label="欠费催缴" value="欠费催缴" />
          <el-option label="合同临期" value="合同临期" />
          <el-option label="闲置超期" value="闲置超期" />
          <el-option label="未办证" value="未办证" />
          <el-option label="闲置盘活" value="闲置盘活" />
          <el-option label="督办逾期" value="督办逾期" />
        </el-select>
      </el-col>
      <el-col :span="3">
        <el-select v-model="taskStatusFilter" placeholder="状态" clearable>
          <el-option label="待处理" value="待处理" />
          <el-option label="进行中" value="进行中" />
          <el-option label="已完成" value="已完成" />
        </el-select>
      </el-col>
      <el-col :span="3">
        <el-select v-model="taskPriorityFilter" placeholder="优先级" clearable>
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
      </el-col>
      <el-col :span="4">
        <el-select v-model="taskCompanyFilter" placeholder="请选择公司" clearable>
          <el-option v-for="g in companyGroups" :key="g" :label="g" :value="g" />
        </el-select>
      </el-col>
      <el-col :span="5" style="text-align: right">
        <el-button type="primary" :icon="Plus" @click="handleCreateTask">新建任务</el-button>
        <el-button :icon="Download" @click="handleExportTasks">导出</el-button>
      </el-col>
    </el-row>

    <el-table :data="pagedTasks" stripe style="width: 100%; margin-top: 16px">
      <el-table-column prop="id" label="任务编号" width="100" />
      <el-table-column prop="name" label="任务名称" min-width="180" />
      <el-table-column prop="asset" label="关联资产" min-width="200" />
      <el-table-column prop="type" label="任务类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type] || 'info'" size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="level" label="预警等级" width="100">
        <template #default="{ row }">
          <el-tag :type="levelTagMap[row.level] || 'info'" size="small" effect="dark">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="trigger" label="触发条件" min-width="200" show-overflow-tooltip />
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleViewTask(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="handleProcessTask(row)" v-if="row.status !== '已完成'">处理</el-button>
          <el-button link type="success" size="small" @click="handleCompleteTask(row)" v-if="row.status !== '已完成'">完成</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager">
      <el-pagination
        v-model:current-page="taskPage"
        v-model:page-size="taskPageSize"
        :total="filteredTasks.length"
        :page-sizes="[10, 20, 50]"
        :pager-count="7"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <el-dialog v-model="taskDialogVisible" :title="taskDialogTitle" width="500px">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.name" />
        </el-form-item>
        <el-form-item label="任务类型">
          <el-select v-model="taskForm.type" style="width: 100%">
            <el-option label="欠费催缴" value="欠费催缴" />
            <el-option label="合同临期" value="合同临期" />
            <el-option label="闲置超期" value="闲置超期" />
            <el-option label="未办证" value="未办证" />
            <el-option label="闲置盘活" value="闲置盘活" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="taskForm.priority" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="taskForm.deadline" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="taskForm.assignee" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTask">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="任务详情" size="500px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务编号">{{ currentRow.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentRow.name }}</el-descriptions-item>
          <el-descriptions-item label="关联资产">{{ currentRow.asset }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">
            <el-tag :type="typeTagMap[currentRow.type] || 'info'" size="small">{{ currentRow.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警等级">
            <el-tag :type="levelTagMap[currentRow.level] || 'info'" size="small" effect="dark">{{ currentRow.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发条件">{{ currentRow.trigger }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="priorityTagMap[currentRow.priority]" size="small" effect="dark">{{ currentRow.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentRow.deadline }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagMap[currentRow.status]" size="small">{{ currentRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentRow.assignee }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentRow.group }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Plus, Download, WarnTriangleFilled } from '@element-plus/icons-vue'
import { warningTasks } from '../../data/mock'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
// 预警任务跟着资产走，企业端只留本公司名下的
const currentCompany = computed(() => userStore.user?.org || '城投集团')

const taskSearch = ref('')
const taskTypeFilter = ref('')
const taskStatusFilter = ref('')
const taskPriorityFilter = ref('')
const taskCompanyFilter = ref('')
const companyGroups = computed(() => userStore.isEnt ? [currentCompany.value] : ['城投集团', '产投集团', '水投集团', '领航公司'])

const taskDialogVisible = ref(false)
const taskDialogTitle = ref('新建任务')
const detailVisible = ref(false)
const currentRow = ref(null)

const taskForm = ref({ name: '', type: '', priority: '中', deadline: '', assignee: '' })

const taskExtras = {
  'WT-001': { level: '特别紧急', trigger: '欠费金额超过5万元且逾期90天以上' },
  'WT-002': { level: '较急', trigger: '合同将于30天内到期未续签' },
  'WT-003': { level: '紧急', trigger: '资产闲置时长超过180天' },
  'WT-004': { level: '一般', trigger: '权证办理超期未完成' },
  'WT-005': { level: '特别紧急', trigger: '欠费金额超过5万元且逾期90天以上' },
  'WT-006': { level: '一般', trigger: '闲置用地超过一年未启动招租' },
  'WT-007': { level: '紧急', trigger: '欠费金额超过1万元且逾期60天以上' },
  'WT-008': { level: '较急', trigger: '欠费金额超过5千元且逾期30天以上' }
}

const levelTagMap = { '特别紧急': 'danger', '紧急': 'warning', '较急': 'primary', '一般': 'info' }
const levelColors = { '一般': '#909399', '较急': '#1890ff', '紧急': '#fa8c16', '特别紧急': '#f5222d' }

const localTasks = ref((userStore.isEnt ? warningTasks.filter(t => t.group === currentCompany.value) : warningTasks).map(t => ({
  ...t,
  level: taskExtras[t.id]?.level || '一般',
  trigger: taskExtras[t.id]?.trigger || '—'
})))

const levelCards = computed(() => ['一般', '较急', '紧急', '特别紧急'].map(l => ({
  label: `${l}预警`,
  color: levelColors[l],
  count: localTasks.value.filter(t => t.level === l && t.status !== '已完成').length
})))

const typeTagMap = { '欠费催缴': 'danger', '合同临期': 'warning', '闲置超期': 'warning', '未办证': 'info', '闲置盘活': '' }
const priorityTagMap = { '高': 'danger', '中': 'warning', '低': 'info' }
const statusTagMap = { '待处理': 'warning', '进行中': '', '已完成': 'success' }

const filteredTasks = computed(() => {
  let list = localTasks.value
  if (taskSearch.value) {
    const kw = taskSearch.value.toLowerCase()
    list = list.filter(t => t.name.toLowerCase().includes(kw) || t.asset.toLowerCase().includes(kw))
  }
  if (taskTypeFilter.value) list = list.filter(t => t.type === taskTypeFilter.value)
  if (taskStatusFilter.value) list = list.filter(t => t.status === taskStatusFilter.value)
  if (taskPriorityFilter.value) list = list.filter(t => t.priority === taskPriorityFilter.value)
  if (taskCompanyFilter.value) list = list.filter(t => t.group === taskCompanyFilter.value)
  return list
})

const taskPage = ref(1)
const taskPageSize = ref(10)
const pagedTasks = computed(() => {
  const list = filteredTasks.value
  const start = Math.min((taskPage.value - 1) * taskPageSize.value, Math.max(0, list.length - taskPageSize.value))
  return list.slice(start, start + taskPageSize.value)
})

function handleCreateTask() {
  taskForm.value = { name: '', type: '', priority: '中', deadline: '', assignee: '' }
  taskDialogTitle.value = '新建任务'
  taskDialogVisible.value = true
}

function handleViewTask(row) {
  currentRow.value = row
  detailVisible.value = true
}

function handleProcessTask(row) {
  row.status = '进行中'
  ElMessage.success(`任务 ${row.id} 已开始处理`)
}

function handleCompleteTask(row) {
  row.status = '已完成'
  ElMessage.success(`任务 ${row.id} 已完成`)
}

function submitTask() {
  if (!taskForm.value.name) {
    ElMessage.warning('请填写任务名称')
    return
  }
  const newTask = {
    id: `WT-${String(localTasks.value.length + 1).padStart(3, '0')}`,
    name: taskForm.value.name,
    asset: '—',
    type: taskForm.value.type,
    deadline: taskForm.value.deadline,
    status: '待处理',
    priority: taskForm.value.priority,
    level: { '高': '紧急', '中': '较急', '低': '一般' }[taskForm.value.priority] || '一般',
    trigger: '手动创建任务',
    assignee: taskForm.value.assignee,
    group: currentCompany.value
  }
  localTasks.value.unshift(newTask)
  taskDialogVisible.value = false
  ElMessage.success('任务创建成功')
}

function handleExportTasks() {
  const headers = ['任务编号', '标题', '类型', '紧急度', '触发来源', '处理人', '状态']
  const rows = localTasks.value.map(t => [t.id, t.title, t.type, t.level, t.trigger, t.assignee, t.status])
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
</script>

<style scoped>
.warning-tasks {
  padding: 0;
}

.filter-row {
  margin-bottom: 0;
}
</style>
