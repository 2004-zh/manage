<template>
  <div class="page-container">
    <div class="page-header">
      <h2>督办协同</h2>
      <span class="header-sub">当前企业：{{ companyName }}</span>
    </div>

    <div class="grid-4">
      <el-card shadow="never" class="kpi-card">
        <div class="kpi-value num">{{ companyOrders.length }}</div>
        <div class="kpi-label">督办总数</div>
      </el-card>
      <el-card shadow="never" class="kpi-card kpi-warning">
        <div class="kpi-value num">{{ companyOrders.filter(o => o.status === '待处理').length }}</div>
        <div class="kpi-label">待处理</div>
      </el-card>
      <el-card shadow="never" class="kpi-card kpi-primary">
        <div class="kpi-value num">{{ companyOrders.filter(o => o.status === '待确认').length }}</div>
        <div class="kpi-label">待国资复核</div>
      </el-card>
      <el-card shadow="never" class="kpi-card kpi-danger">
        <div class="kpi-value num">{{ companyOrders.filter(o => o.status === '已驳回' || o.status === '已逾期').length }}</div>
        <div class="kpi-label">需重新整改</div>
      </el-card>
    </div>

    <el-card shadow="never" class="fill">
      <template #header>
        <div class="card-head">
          <span>督办列表</span>
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="待处理">待处理</el-radio-button>
            <el-radio-button label="待确认">待复核</el-radio-button>
            <el-radio-button label="已办结">已办结</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div class="toolbar">
        <el-select v-model="supFilter.type" placeholder="任务类型" clearable size="small" style="width:150px">
          <el-option v-for="t in taskTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="supFilter.status" placeholder="状态" clearable size="small" style="width:120px">
          <el-option label="待处理" value="待处理" />
          <el-option label="待确认" value="待确认" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="已逾期" value="已逾期" />
          <el-option label="已办结" value="已办结" />
        </el-select>
        <el-date-picker
          v-model="supFilter.range"
          type="daterange"
          size="small"
          start-placeholder="限期开始"
          end-placeholder="限期结束"
          value-format="YYYY-MM-DD"
          style="width:240px"
        />
        <el-button type="primary" size="small" :icon="Search" @click="applySupFilter">查询</el-button>
        <el-button type="primary" size="small" plain :icon="Plus" @click="openCreateTask">新增巡查任务</el-button>
      </div>

      <el-table :data="pagedOrders" border stripe>
        <el-table-column prop="id" label="督办编号" width="130" />
        <el-table-column prop="type" label="督办类型" width="120" />
        <el-table-column prop="reason" label="督办事由" min-width="220" show-overflow-tooltip />
        <el-table-column prop="deadline" label="整改期限" width="120" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            <div v-if="row.status === '已逾期'" class="overdue-tip">逾期 {{ row.overdueDays || 0 }} 天</div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewOrder(row)">详情</el-button>
            <el-button v-if="row.status === '待处理'" type="primary" link size="small" @click="accept(row)">签收</el-button>
            <el-button v-if="canReply(row)" type="success" link size="small" @click="submitFeedback(row)">提交整改反馈</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="supPage"
          v-model:page-size="supSize"
          :total="filteredOrders.length"
          :page-sizes="[10, 15, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </el-card>

    <el-drawer v-model="showDetail" title="督办详情" size="550px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="督办编号">{{ currentOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="督办类型">{{ currentOrder.type }}</el-descriptions-item>
          <el-descriptions-item label="督办对象">{{ currentOrder.group }}</el-descriptions-item>
          <el-descriptions-item label="督办事由">{{ currentOrder.reason }}</el-descriptions-item>
          <el-descriptions-item label="下发单位">长乐区国资中心</el-descriptions-item>
          <el-descriptions-item label="来源">{{ currentOrder.source || '人工发起' }}</el-descriptions-item>
          <el-descriptions-item label="整改期限">{{ currentOrder.deadline }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(currentOrder.status)" size="small">{{ currentOrder.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.reply" label="整改回复">{{ currentOrder.reply }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.closeRemark" label="办结意见">{{ currentOrder.closeRemark }}</el-descriptions-item>
        </el-descriptions>

        <el-timeline style="margin-top:20px">
          <el-timeline-item
            v-for="(item, idx) in currentOrder.timeline"
            :key="idx"
            :timestamp="item.time"
            placement="top"
            :type="idx === currentOrder.timeline.length - 1 ? 'primary' : 'info'"
          >
            <div class="timeline-action">{{ item.action }}</div>
            <div class="timeline-operator">{{ item.operator }}</div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-dialog v-model="showFeedback" title="提交整改反馈" width="600px">
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="督办编号">
          <span>{{ currentOrder?.id }}</span>
        </el-form-item>
        <el-form-item label="反馈内容" required>
          <el-input v-model="feedbackForm.content" type="textarea" :rows="4" placeholder="请输入整改情况和处理结果..." />
        </el-form-item>
        <el-form-item label="附件材料">
          <el-upload action="#" :auto-upload="false" :limit="5" list-type="text">
            <el-button type="primary" plain>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png/pdf/doc 格式，单个文件不超过 20MB，最多 5 个</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFeedback = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitFeedback">提交反馈</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateTask" title="新增巡查任务" width="580px">
      <el-form :model="taskForm" label-width="110px">
        <el-form-item label="任务类型" required>
          <el-select v-model="taskForm.type" placeholder="请选择任务类型" style="width:100%">
            <el-option v-for="t in taskTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改期限" required>
          <el-date-picker
            v-model="taskForm.deadline"
            type="date"
            placeholder="请选择整改期限"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="责任人">
          <el-input v-model="taskForm.contact" placeholder="请输入责任人" />
        </el-form-item>
        <el-form-item label="任务事由" required>
          <el-input v-model="taskForm.reason" type="textarea" :rows="4" placeholder="请输入任务事由" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTask = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTask">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useSuperviseStore } from '../../store/supervise'
import { useUserStore } from '../../store/user'

const superviseStore = useSuperviseStore()
const userStore = useUserStore()

const companyName = computed(() => userStore.user?.org || '本企业')
const companyOrders = computed(() => superviseStore.getOrdersByCompany(companyName.value))

const statusFilter = ref('')
const showDetail = ref(false)
const showFeedback = ref(false)
const currentOrder = ref(null)

const taskTypes = ['巡查督办', '闲置处置', '欠费催缴', '权证办理', '安全整改']

const supFilter = ref({ type: '', status: '', range: null })
const appliedSupFilter = ref({ type: '', status: '', range: null })
const supPage = ref(1)
const supSize = ref(15)
const showCreateTask = ref(false)
const taskForm = ref({ type: '', deadline: '', contact: '', reason: '' })

const feedbackForm = ref({ content: '' })

function statusType(status) {
  if (status === '待处理') return 'warning'
  if (status === '待确认') return ''
  if (status === '已办结') return 'success'
  if (status === '已逾期') return 'danger'
  if (status === '已驳回') return 'danger'
  return 'info'
}

function canReply(row) {
  return row.status === '待处理' || row.status === '已驳回' || row.status === '已逾期'
}

const applySupFilter = () => {
  appliedSupFilter.value = { ...supFilter.value, range: supFilter.value.range ? [...supFilter.value.range] : null }
  supPage.value = 1
}

const filteredOrders = computed(() => {
  const f = appliedSupFilter.value
  const [start, end] = f.range || []
  return companyOrders.value.filter(o => {
    if (statusFilter.value && o.status !== statusFilter.value) return false
    if (f.type && o.type !== f.type) return false
    if (f.status && o.status !== f.status) return false
    if (start && o.deadline < start) return false
    if (end && o.deadline > end) return false
    return true
  })
})

const pagedOrders = computed(() => {
  const start = (supPage.value - 1) * supSize.value
  return filteredOrders.value.slice(start, start + supSize.value)
})

const openCreateTask = () => {
  taskForm.value = { type: '', deadline: '', contact: '', reason: '' }
  showCreateTask.value = true
}

const confirmCreateTask = () => {
  const t = taskForm.value
  if (!t.type) { ElMessage.warning('请选择任务类型'); return }
  if (!t.deadline) { ElMessage.warning('请选择整改期限'); return }
  if (!t.reason) { ElMessage.warning('请输入任务事由'); return }
  superviseStore.createOrder({
    group: companyName.value,
    type: t.type,
    reason: t.reason,
    deadline: t.deadline,
    contact: t.contact || (userStore.user?.name || ''),
    source: '企业自建'
  })
  showCreateTask.value = false
  supPage.value = 1
  ElMessage.success('巡查任务已创建')
}

const viewOrder = (row) => {
  currentOrder.value = row
  showDetail.value = true
}

const accept = (row) => {
  superviseStore.acceptOrder(row.id)
  ElMessage.success('已签收，请尽快提交整改反馈')
}

const submitFeedback = (row) => {
  currentOrder.value = row
  feedbackForm.value.content = ''
  showFeedback.value = true
}

const handleSubmitFeedback = () => {
  if (!feedbackForm.value.content) {
    ElMessage.warning('请输入反馈内容')
    return
  }
  superviseStore.replyOrder(currentOrder.value.id, feedbackForm.value.content)
  showFeedback.value = false
  ElMessage.success('反馈已提交，等待国资中心复核')
}
</script>

<style scoped>
.card-head { display: flex; justify-content: space-between; align-items: center; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
.header-sub { font-size: 13px; color: var(--t-weak); margin-left: 12px; }
.kpi-warning { border-left: 3px solid var(--c-warning); }
.kpi-primary { border-left: 3px solid var(--c-primary); }
.kpi-danger { border-left: 3px solid var(--c-danger); }
.overdue-tip { font-size: 12px; color: var(--c-danger); margin-top: 4px; }
.timeline-action { font-weight: 500; color: var(--t-main); }
.timeline-operator { font-size: 12px; color: var(--t-weak); }
</style>
