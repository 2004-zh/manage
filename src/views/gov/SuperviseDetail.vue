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
            <el-descriptions-item label="限期" :span="2">{{ order.deadline }}</el-descriptions-item>
            <el-descriptions-item label="督办事由" :span="2">{{ order.reason }}</el-descriptions-item>
            <el-descriptions-item label="责任人">{{ order.contact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order.phone }}</el-descriptions-item>
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
            <p style="margin-bottom: 16px; color: #666">企业已提交整改反馈，请确认是否办结</p>
            <el-button type="primary" @click="handleConfirm">确认办结</el-button>
            <el-button @click="handleReturn">退回重改</el-button>
          </div>
          <div v-else-if="order.status === '已办结'" style="text-align: center; padding: 20px 0">
            <el-result icon="success" title="已办结" sub-title="该督办单已完成闭环" />
          </div>
          <div v-else style="text-align: center; padding: 20px 0">
            <p style="color: #999">等待企业接收并反馈</p>
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
  return 'info'
}

function handleConfirm() {
  if (order.value) {
    order.value.status = '已办结'
    order.value.timeline.push({
      time: new Date().toLocaleString('zh-CN'),
      action: '确认办结',
      operator: '林××（国资中心运营科）'
    })
    ElMessage.success('已确认办结')
  }
}

function handleReturn() {
  ElMessageBox.prompt('请输入退回原因', '退回重改', {
    confirmButtonText: '确认退回',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '请输入退回原因',
    type: 'warning'
  }).then(({ value }) => {
    if (order.value) {
      order.value.status = '待处理'
      order.value.timeline.push({
        time: new Date().toLocaleString('zh-CN'),
        action: `退回重改：${value}`,
        operator: '林××（国资中心运营科）'
      })
      ElMessage.success('已退回，要求企业重新整改')
    }
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
