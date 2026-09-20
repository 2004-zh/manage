<template>
  <div class="supervise-create">
    <div class="page-header">
      <h2>发起督办</h2>
    </div>

    <el-card>
      <el-form :model="form" label-width="100px" style="max-width: 600px">
        <el-form-item label="督办对象" required>
          <el-select v-model="form.group" placeholder="选择集团" style="width: 100%" @change="onGroupChange">
            <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="督办类型" required>
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
            <el-option label="闲置盘活" value="闲置盘活" />
            <el-option label="欠费催缴" value="欠费催缴" />
            <el-option label="未办证推进" value="未办证推进" />
            <el-option label="数据催报" value="数据催报" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="督办事项">
          <el-input v-model="form.subject" placeholder="一句话概括本次督办要求，用于消息标题" />
        </el-form-item>
        <el-form-item label="涉及资产">
          <el-select
            v-model="form.assetId"
            filterable
            clearable
            placeholder="可不选，按单位整体督办"
            style="width: 100%"
            @change="onAssetChange"
          >
            <el-option
              v-for="a in assetOptions"
              :key="a.id"
              :label="`${a.id} ${a.name}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="督办事由" required>
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请描述督办原因和要求" />
        </el-form-item>
        <el-form-item label="限期" required>
          <el-date-picker v-model="form.deadline" type="date" placeholder="选择截止日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="责任人">
          <el-input v-model="form.contact" placeholder="企业对接人" />
        </el-form-item>

        <el-form-item v-if="currentContact" label="联系方式">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="对接人">{{ currentContact.contact }}</el-descriptions-item>
            <el-descriptions-item label="职务">{{ currentContact.title }}</el-descriptions-item>
            <el-descriptions-item label="手机">
              {{ currentContact.phone }}
              <el-button type="primary" link size="small" @click="copyPhone">复制</el-button>
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentContact.email }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交督办</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSuperviseStore } from '../../store/supervise'
import { useAssetStore } from '../../store/asset'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const superviseStore = useSuperviseStore()
const assetStore = useAssetStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const form = ref({
  group: '',
  type: '',
  subject: '',
  reason: '',
  deadline: '',
  contact: '',
  phone: '',
  assetId: '',
  asset: ''
})

const assetOptions = computed(() => {
  if (!form.value.group) return assetStore.assets
  return assetStore.assets.filter(a => a.group === form.value.group)
})

function onAssetChange(id) {
  const a = assetStore.getAssetById(id)
  form.value.asset = a ? `${a.id} ${a.name}` : ''
  if (a && !form.value.group) form.value.group = a.group
  if (a && !form.value.subject) form.value.subject = `${a.name} 专项督办`
}

const currentContact = computed(() => {
  return superviseStore.contacts.find(c => c.group === form.value.group) || null
})

function onGroupChange(group) {
  const c = superviseStore.contacts.find(ct => ct.group === group)
  if (c) {
    form.value.contact = c.contact
    form.value.phone = c.phone
  }
  if (form.value.assetId) {
    const a = assetStore.getAssetById(form.value.assetId)
    if (a && a.group !== group) {
      form.value.assetId = ''
      form.value.asset = ''
    }
  }
}

function copyPhone() {
  if (currentContact.value) {
    navigator.clipboard?.writeText(currentContact.value.phone)
    ElMessage.success('手机号已复制')
  }
}

function handleSubmit() {
  if (!form.value.group || !form.value.type || !form.value.reason || !form.value.deadline) {
    ElMessage.warning('请填写完整督办信息')
    return
  }
  const order = superviseStore.createOrder({
    group: form.value.group,
    type: form.value.type,
    subject: form.value.subject || form.value.reason,
    reason: form.value.reason,
    deadline: form.value.deadline,
    contact: form.value.contact,
    phone: currentContact.value?.phone || form.value.phone,
    assetId: form.value.assetId,
    asset: form.value.asset,
    source: route.query.source || '人工发起'
  })
  ElMessage.success(`督办单已生成，编号 ${order.id}，已通知 ${order.group}，状态：待处理`)
  router.push('/gov/supervise')
}

// 从预警页/督办跳转过来时预填事由与资产
if (route.query.reason) {
  form.value.reason = route.query.reason
  form.value.type = route.query.type || ''
  form.value.group = route.query.group || ''
}
if (route.query.assetId) {
  form.value.assetId = route.query.assetId
  form.value.asset = route.query.asset || route.query.assetId
}
</script>
