<template>
  <div class="page-container">
    <div class="page-header">
      <h2>督办协同</h2>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ orders.length }}</div>
          <div class="kpi-label">督办总数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #E6A23C">
          <div class="kpi-value">{{ orders.filter(o => o.status === '待处理').length }}</div>
          <div class="kpi-label">待处理</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #409EFF">
          <div class="kpi-value">{{ orders.filter(o => o.status === '待确认').length }}</div>
          <div class="kpi-label">待确认</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #67C23A">
          <div class="kpi-value">{{ orders.filter(o => o.status === '已办结').length }}</div>
          <div class="kpi-label">已办结</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>督办列表</span>
          <el-radio-group v-model="statusFilter" size="small">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="待处理">待处理</el-radio-button>
            <el-radio-button label="待确认">待确认</el-radio-button>
            <el-radio-button label="已办结">已办结</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
        <el-select v-model="supFilter.company" placeholder="请选择公司" clearable size="small" style="width:170px">
          <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="supFilter.type" placeholder="任务类型" clearable size="small" style="width:130px">
          <el-option v-for="t in taskTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="supFilter.status" placeholder="状态" clearable size="small" style="width:110px">
          <el-option label="待处理" value="待处理" />
          <el-option label="待确认" value="待确认" />
          <el-option label="已办结" value="已办结" />
        </el-select>
        <el-date-picker
          v-model="supFilter.range"
          type="daterange"
          size="small"
          start-placeholder="开始截至时间"
          end-placeholder="结束截至时间"
          value-format="YYYY-MM-DD"
          style="width:280px"
        />
        <el-button type="primary" size="small" :icon="Search" @click="applySupFilter">查询</el-button>
        <el-button type="primary" size="small" plain :icon="Plus" @click="openCreateTask">新增</el-button>
      </div>

      <el-table :data="pagedOrders" border stripe>
        <el-table-column prop="orderNo" label="督办编号" width="130" />
        <el-table-column prop="type" label="督办类型" width="100" />
        <el-table-column prop="title" label="督办标题" min-width="190" show-overflow-tooltip />
        <el-table-column prop="company" label="所属公司" width="120" />
        <el-table-column prop="deadline" label="截止日期" width="110" />
        <el-table-column prop="createTime" label="创建时间" width="150" />
        <el-table-column prop="finishTime" label="完成时间" width="150">
          <template #default="{ row }">{{ row.finishTime || '—' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '已办结' ? 'success' : row.status === '待确认' ? '' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewOrder(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="viewOrder(row)">查看</el-button>
            <el-button v-if="row.status === '待处理'" type="primary" link size="small" @click="submitFeedback(row)">提交反馈</el-button>
            <el-button v-if="row.status === '待确认'" type="success" link size="small" @click="confirmOrder(row)">确认办结</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="supPage"
          v-model:page-size="supSize"
          :total="filteredOrders.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </el-card>

    <el-drawer v-model="showDetail" title="督办详情" size="550px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="督办编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="督办类型">{{ currentOrder.type }}</el-descriptions-item>
          <el-descriptions-item label="督办标题">{{ currentOrder.title }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ currentOrder.company }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.inspector" label="巡检人">{{ currentOrder.inspector }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.projects && currentOrder.projects.length" label="巡查项目">{{ currentOrder.projects.join('、') }}</el-descriptions-item>
          <el-descriptions-item label="督办原因">{{ currentOrder.reason }}</el-descriptions-item>
          <el-descriptions-item label="下发单位">长乐区国资中心</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentOrder.deadline }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.finishTime || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentOrder.status === '已办结' ? 'success' : currentOrder.status === '待确认' ? '' : 'warning'" size="small">{{ currentOrder.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentOrder.feedback" style="margin-top:20px">
          <h4 style="margin-bottom:10px">反馈信息</h4>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="反馈时间">{{ currentOrder.feedback.time }}</el-descriptions-item>
            <el-descriptions-item label="反馈内容">{{ currentOrder.feedback.content }}</el-descriptions-item>
            <el-descriptions-item label="附件">{{ currentOrder.feedback.attachments }} 个文件</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-timeline style="margin-top:20px">
          <el-timeline-item v-for="item in currentOrder.timeline" :key="item.time" :timestamp="item.time" placement="top" :type="item.type">
            {{ item.content }}
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-dialog v-model="showFeedback" title="提交反馈" width="600px">
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="督办编号">
          <span>{{ currentOrder?.orderNo }}</span>
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

    <el-dialog v-model="showCreateTask" title="新增督办任务" width="580px">
      <el-form :model="taskForm" label-width="110px">
        <el-form-item label="任务类型" required>
          <el-select v-model="taskForm.type" placeholder="请选择任务类型" style="width:100%">
            <el-option v-for="t in taskTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司" required>
          <el-select v-model="taskForm.company" placeholder="请选择所属公司" style="width:100%">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡查项目" required>
          <el-select v-model="taskForm.projects" multiple placeholder="请选择巡查项目（可多选）" style="width:100%">
            <el-option v-for="p in projectOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡检人" required>
          <el-select v-model="taskForm.inspector" placeholder="请选择巡检人" style="width:100%">
            <el-option v-for="i in inspectorOptions" :key="i" :label="i" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务截至时间" required>
          <el-date-picker
            v-model="taskForm.deadline"
            type="datetime"
            placeholder="请选择任务截至时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="巡查内容">
          <el-input v-model="taskForm.content" type="textarea" :rows="4" placeholder="请输入巡查内容" maxlength="200" show-word-limit />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const statusFilter = ref('')
const showDetail = ref(false)
const showFeedback = ref(false)
const currentOrder = ref(null)

const companyOptions = ['城投集团', '国资经营公司', '城建开发公司', '文旅集团公司']
const taskTypes = ['巡查督办', '闲置处置', '欠费催缴', '权证办理', '安全整改']
const projectOptions = ['航城商业项目', '城西停车场项目', '农贸市场项目', '工业区厂房项目', '滨江商铺项目', '城关旧厂房项目']
const inspectorOptions = ['林志强', '王丽娟', '陈国平', '刘晓芳']

const supFilter = ref({ company: '', type: '', status: '', range: null })
const appliedSupFilter = ref({ company: '', type: '', status: '', range: null })
const supPage = ref(1)
const supSize = ref(10)
const showCreateTask = ref(false)
const taskForm = ref({ type: '', company: '', projects: [], inspector: '', deadline: '', content: '' })

const feedbackForm = ref({
  content: ''
})

const orders = ref([
  {
    id: 1, orderNo: 'DB-2026-009', type: '闲置处置', title: '城关旧厂房闲置超6个月督办', company: '城投集团', inspector: '', projects: [],
    reason: '资产CT-003（城关旧厂房3#）已闲置超6个月，未制定盘活方案', deadline: '2026-04-15', status: '待处理',
    createTime: '2026-03-20 10:00', finishTime: '',
    feedback: null,
    timeline: [
      { time: '2026-03-20 10:00', content: '国资中心下发督办通知', type: 'primary' },
      { time: '2026-03-21 09:00', content: '系统通知已送达城投集团资产管理员', type: 'info' },
    ]
  },
  {
    id: 2, orderNo: 'DB-2026-014', type: '欠费催缴', title: '航城商铺欠费超3个月督办', company: '城投集团', inspector: '', projects: [],
    reason: '承租人张某（HT-2023-018）欠费已超3个月，实收连续3个月为0', deadline: '2026-04-20', status: '待处理',
    createTime: '2026-03-25 14:00', finishTime: '',
    feedback: null,
    timeline: [
      { time: '2026-03-25 14:00', content: '国资中心下发督办通知', type: 'primary' },
    ]
  },
  {
    id: 3, orderNo: 'DB-2026-005', type: '权证办理', title: '9处未办证资产办证进度督办', company: '国资经营公司', inspector: '', projects: [],
    reason: '未办证资产数量超阈值，请加快办证进度并更新台账', deadline: '2026-05-30', status: '待确认',
    createTime: '2026-02-15 09:00', finishTime: '',
    feedback: { time: '2026-03-18 16:30', content: '已完成3处资产的权证申请材料提交，剩余6处预计4月底前完成', attachments: 3 },
    timeline: [
      { time: '2026-02-15 09:00', content: '国资中心下发督办通知', type: 'primary' },
      { time: '2026-03-18 16:30', content: '城投集团提交反馈', type: 'success' },
      { time: '2026-03-19 10:00', content: '等待国资中心确认办结', type: 'warning' },
    ]
  },
  {
    id: 4, orderNo: 'DB-2026-002', type: '巡查督办', title: '滨江商铺项目季度安全巡查督办', company: '城建开发公司', inspector: '林志强', projects: ['滨江商铺项目'],
    reason: '季度安全巡查发现3处消防通道占用，需限期整改并反馈', deadline: '2026-03-10', status: '已办结',
    createTime: '2026-01-20 09:30', finishTime: '2026-03-06 17:20',
    feedback: { time: '2026-03-05 15:00', content: '已完成全部整改，消防通道恢复畅通', attachments: 4 },
    timeline: [
      { time: '2026-01-20 09:30', content: '国资中心下发督办通知', type: 'primary' },
      { time: '2026-03-05 15:00', content: '城建开发公司提交反馈', type: 'success' },
      { time: '2026-03-06 17:20', content: '国资中心确认办结', type: 'success' },
    ]
  },
  {
    id: 5, orderNo: 'DB-2026-016', type: '安全整改', title: '农贸市场电气线路老化整改督办', company: '国资经营公司', inspector: '王丽娟', projects: ['农贸市场项目'],
    reason: '安全检查发现市场内部分电气线路老化，存在火灾隐患', deadline: '2026-05-15', status: '待确认',
    createTime: '2026-04-02 10:40', finishTime: '',
    feedback: { time: '2026-04-28 11:00', content: '已完成线路改造施工，通过复检', attachments: 2 },
    timeline: [
      { time: '2026-04-02 10:40', content: '国资中心下发督办通知', type: 'primary' },
      { time: '2026-04-28 11:00', content: '国资经营公司提交反馈', type: 'success' },
    ]
  },
  {
    id: 6, orderNo: 'DB-2026-018', type: '巡查督办', title: '工业区厂房项目汛期专项巡查', company: '城投集团', inspector: '陈国平', projects: ['工业区厂房项目', '城关旧厂房项目'],
    reason: '汛期来临前需完成厂房排水系统与屋面专项检查', deadline: '2026-06-20', status: '待处理',
    createTime: '2026-05-28 15:10', finishTime: '',
    feedback: null,
    timeline: [
      { time: '2026-05-28 15:10', content: '国资中心下发督办通知', type: 'primary' },
    ]
  },
  {
    id: 7, orderNo: 'DB-2026-001', type: '闲置处置', title: '城西停车场闲置区域盘活督办', company: '文旅集团公司', inspector: '', projects: [],
    reason: '停车场西区闲置超一年，需提交盘活利用方案', deadline: '2026-02-28', status: '已办结',
    createTime: '2026-01-06 09:00', finishTime: '2026-02-25 16:40',
    feedback: { time: '2026-02-20 10:30', content: '已引入合作方建设新能源充电站，方案获批', attachments: 5 },
    timeline: [
      { time: '2026-01-06 09:00', content: '国资中心下发督办通知', type: 'primary' },
      { time: '2026-02-20 10:30', content: '文旅集团公司提交反馈', type: 'success' },
      { time: '2026-02-25 16:40', content: '国资中心确认办结', type: 'success' },
    ]
  },
])

const applySupFilter = () => {
  appliedSupFilter.value = { ...supFilter.value, range: supFilter.value.range ? [...supFilter.value.range] : null }
  supPage.value = 1
}

const filteredOrders = computed(() => {
  const f = appliedSupFilter.value
  const [start, end] = f.range || []
  return orders.value.filter(o => {
    if (statusFilter.value && o.status !== statusFilter.value) return false
    if (f.company && o.company !== f.company) return false
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
  taskForm.value = { type: '', company: '', projects: [], inspector: '', deadline: '', content: '' }
  showCreateTask.value = true
}

const nowText = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const confirmCreateTask = () => {
  const t = taskForm.value
  if (!t.type) {
    ElMessage.warning('请选择任务类型')
    return
  }
  if (!t.company) {
    ElMessage.warning('请选择所属公司')
    return
  }
  if (!t.projects.length) {
    ElMessage.warning('请选择巡查项目')
    return
  }
  if (!t.inspector) {
    ElMessage.warning('请选择巡检人')
    return
  }
  if (!t.deadline) {
    ElMessage.warning('请选择任务截至时间')
    return
  }
  const time = nowText()
  orders.value.unshift({
    id: Date.now(),
    orderNo: `DB-2026-${String(orders.value.length + 20).padStart(3, '0')}`,
    type: t.type,
    title: `${t.type}：${t.projects.join('、')}`,
    company: t.company,
    inspector: t.inspector,
    projects: [...t.projects],
    reason: t.content || '按要求开展巡查并限期反馈',
    deadline: t.deadline.slice(0, 10),
    status: '待处理',
    createTime: time,
    finishTime: '',
    feedback: null,
    timeline: [
      { time, content: `${t.company}创建${t.type}任务，指派巡检人${t.inspector}`, type: 'primary' },
    ]
  })
  showCreateTask.value = false
  supPage.value = 1
  ElMessage.success('督办任务已创建')
}

const viewOrder = (row) => {
  currentOrder.value = row
  showDetail.value = true
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
  const order = orders.value.find(o => o.id === currentOrder.value.id)
  if (order) {
    order.status = '待确认'
    order.feedback = { time: '2026-03-28 15:00', content: feedbackForm.value.content, attachments: 0 }
    order.timeline.push({ time: '2026-03-28 15:00', content: '城投集团提交反馈', type: 'success' })
    order.timeline.push({ time: '2026-03-28 15:01', content: '等待国资中心确认办结', type: 'warning' })
  }
  showFeedback.value = false
  ElMessage.success('反馈提交成功')
}

const confirmOrder = (row) => {
  ElMessageBox.confirm('确认该督办已办结？', '确认办结', { type: 'info' }).then(() => {
    const order = orders.value.find(o => o.id === row.id)
    if (order) {
      order.status = '已办结'
      order.finishTime = nowText()
      order.timeline.push({ time: '2026-03-28 16:00', content: '国资中心确认办结', type: 'success' })
    }
    ElMessage.success('已确认办结')
  }).catch(() => {})
}
</script>
