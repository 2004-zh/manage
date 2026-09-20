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
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const superviseStore = useSuperviseStore()

const groups = ['城投集团', '产投集团', '水投集团', '领航公司']

const form = ref({
  group: '',
  type: '',
  reason: '',
  deadline: '',
  contact: ''
})

const currentContact = computed(() => {
  return superviseStore.contacts.find(c => c.group === form.value.group) || null
})

function onGroupChange(group) {
  const c = superviseStore.contacts.find(ct => ct.group === group)
  if (c) form.value.contact = c.contact
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
  const newId = 'DB-2026-' + String(superviseStore.orders.length + 1).padStart(3, '0')
  superviseStore.orders.unshift({
    id: newId,
    group: form.value.group,
    type: form.value.type,
    reason: form.value.reason,
    deadline: form.value.deadline,
    contact: form.value.contact,
    status: '待处理',
    createTime: new Date().toISOString().slice(0, 10),
    timeline: [{ time: new Date().toISOString().slice(0, 10), action: '发起督办', operator: '系统' }]
  })
  ElMessage.success(`督办单已生成，编号 ${newId}，状态：待处理`)
  router.push('/gov/supervise')
}

// 从预警页跳转过来时预填事由
if (route.query.reason) {
  form.value.reason = route.query.reason
  form.value.type = route.query.type || ''
  form.value.group = route.query.group || ''
}
</script>
