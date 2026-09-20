<template>
  <div class="supervise-detail" v-if="order">
    <div class="page-header">
      <h2>督办详情 — {{ order.id }}</h2>
      <el-button @click="$router.push('/gov/supervise')">返回列表</el-button>
    </div>

    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>督办信息</template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="督办编号">{{ order.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType(order.status)" size="small">{{ order.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="督办对象">{{ order.group }}</el-descriptions-item>
            <el-descriptions-item label="督办类型">{{ order.type }}</el-descriptions-item>
            <el-descriptions-item label="限期">{{ order.deadline }}</el-descriptions-item>
            <el-descriptions-item label="逾期天数">
              <span :style="{ color: order.status === '已逾期' ? '#f56c6c' : '#67c23a' }">
                {{ order.status === '已逾期' ? `${order.overdueDays || 0} 天` : '未逾期' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item v-if="order.subject" label="督办事项" :span="2">{{ order.subject }}</el-descriptions-item>
            <el-descriptions-item label="督办事由" :span="2">{{ order.reason }}</el-descriptions-item>
            <el-descriptions-item v-if="order.assetId" label="涉及资产" :span="2">
              {{ order.asset || order.assetId }}
              <el-button type="primary" link size="small" @click="$router.push({ path: '/gov/assets', query: { keyword: order.assetId } })">查看资产</el-button>
            </el-descriptions-item>
            <el-descriptions-item label="来源">{{ order.source || '人工发起' }}</el-descriptions-item>
            <el-descriptions-item label="责任人">{{ order.contact }}</el-descriptions-item>
            <el-descriptions-item v-if="order.reply" label="整改回复" :span="2">{{ order.reply }}</el-descriptions-item>
            <el-descriptions-item label="联系电话" :span="2">{{ order.phone }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>跟踪时间轴</template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, idx) in order.timeline"
              :key="idx"
              :timestamp="item.time"
              :type="idx === order.timeline.length - 1 ? 'primary' : 'info'"
              placement="top"
            >
              <div class="timeline-content">
                <div class="timeline-action">{{ item.action }}</div>
                <div class="timeline-operator">{{ item.operator }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card>
          <template #header>操作</template>
          <div v-if="order.status === '待确认'" style="text-align: center; padding: 20px 0">
            <p style="margin-bottom: 16px; color: #666">企业已提交整改反馈，请复核是否办结</p>
            <el-button type="primary" @click="handleConfirm">确认办结</el-button>
            <el-button type="danger" plain @click="handleReturn">驳回重改</el-button>
          </div>
          <div v-else-if="order.status === '已办结'" style="text-align: center; padding: 20px 0">
            <el-result icon="success" title="已办结" sub-title="该督办单已完成闭环并归档" />
          </div>
          <div v-else style="text-align: center; padding: 20px 0">
            <p style="margin-bottom: 16px; color: #666">{{ pendingTip }}</p>
            <el-button type="warning" @click="handleUrge">催办</el-button>
            <el-button @click="$router.push({ path: '/gov/warning-tasks', query: { keyword: order.id } })">查看预警任务</el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>企业联络</template>
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="对接人">{{ order.contact }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ order.phone }}</el-descriptions-item>
          </el-descriptions>
          <el-button type="primary" link style="margin-top: 8px" @click="$router.push('/gov/contact')">查看全部联系方式</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSuperviseStore } from '../../store/supervise'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const superviseStore = useSuperviseStore()

const order = computed(() => {
  return superviseStore.orders.find(o => o.id === route.params.id) || null
})

function statusType(status) {
  if (status === '待处理') return 'warning'
  if (status === '待确认') return ''
  if (status === '已办结') return 'success'
  if (status === '已逾期') return 'danger'
  return 'info'
}

const pendingTip = computed(() => {
  const s = order.value?.status
  if (s === '已逾期') return `已超过整改期限 ${order.value.overdueDays || 0} 天，系统已自动生成逾期预警并推送两端`
  if (s === '已驳回') return '整改回复已驳回，等待企业重新整改并再次提交'
  return '督办已下发，等待企业接收并提交整改反馈'
})

function handleConfirm() {
  if (!order.value) return
  ElMessageBox.prompt('请输入办结意见（可留空）', '确认办结', {
    confirmButtonText: '确认办结',
    cancelButtonText: '取消',
    inputPlaceholder: '例：整改到位，资料已归档',
    inputValidator: () => true
  }).then(({ value }) => {
    superviseStore.closeOrder(order.value.id, value || '')
    ElMessage.success('已确认办结，企业端已收到通知，状态变更已留痕')
  }).catch(() => {})
}

function handleReturn() {
  if (!order.value) return
  ElMessageBox.prompt('请输入驳回原因', '驳回重改', {
    confirmButtonText: '确认驳回',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入驳回原因',
    type: 'warning'
  }).then(({ value }) => {
    superviseStore.rejectOrder(order.value.id, value)
    ElMessage.success('已驳回，企业端将收到重新整改通知')
  }).catch(() => {})
}

function handleUrge() {
  if (!order.value) return
  ElMessageBox.prompt('请输入催办要求（可留空）', '催办', {
    confirmButtonText: '发送催办',
    cancelButtonText: '取消',
    inputPlaceholder: '例：请于本周内报送盘活方案',
    inputValidator: () => true
  }).then(({ value }) => {
    superviseStore.urgeOrder(order.value.id, value || '')
    ElMessage.success('催办通知已发送至企业端')
  }).catch(() => {})
}
</script>

<style scoped>
.timeline-content {
  line-height: 1.6;
}

.timeline-action {
  font-weight: 500;
  color: #333;
}

.timeline-operator {
  font-size: 12px;
  color: #999;
}
</style>
