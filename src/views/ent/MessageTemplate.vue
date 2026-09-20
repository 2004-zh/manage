<template>
  <div class="page-container">
    <div class="page-header">
      <h2>消息模板</h2>
    </div>

    <el-card shadow="never">
      <div class="filter-bar">
        <el-input v-model="filter.name" placeholder="模板名称" clearable style="width:180px" />
        <el-select v-model="filter.type" placeholder="消息类型" clearable style="width:140px">
          <el-option v-for="t in types" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="doQuery">查询</el-button>
        <el-button :icon="Plus" @click="openEdit(null)">新增</el-button>
      </div>

      <el-table :data="pagedRows" border stripe>
        <el-table-column prop="name" label="模板名称" min-width="160" />
        <el-table-column prop="type" label="消息类型" width="110">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="scene" label="触发场景" min-width="160" show-overflow-tooltip />
        <el-table-column prop="content" label="内容摘要" min-width="220" show-overflow-tooltip />
        <el-table-column prop="enabled" label="状态" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="info" link size="small" @click="preview(row)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filtered.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <el-dialog v-model="showEdit" :title="editing ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="模板名称" required>
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="消息类型" required>
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="t in types" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发场景">
          <el-input v-model="form.scene" placeholder="如：欠费预警触发时" />
        </el-form-item>
        <el-form-item label="模板内容" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="支持变量：{资产名称} {承租人} {金额} {日期}" />
        </el-form-item>
        <el-form-item label="插入变量">
          <div class="chip-row">
            <span v-for="v in vars" :key="v" class="chip" @click="form.content += v">{{ v }}</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="saveRow">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPreview" title="模板预览" width="480px">
      <div class="preview-box">{{ previewText }}</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const types = ['短信', '站内信', '邮件', '微信推送']
const vars = ['{资产名称}', '{承租人}', '{金额}', '{日期}', '{公司名称}']

const filter = ref({ name: '', type: '' })
const page = ref(1)
const pageSize = ref(10)
const showEdit = ref(false)
const showPreview = ref(false)
const previewText = ref('')
const editing = ref(null)
const form = ref({ name: '', type: '短信', scene: '', content: '' })

const now = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const rows = ref([
  { id: 1, name: '欠费催缴通知', type: '短信', scene: '欠费预警触发时', content: '尊敬的{承租人}：您承租的{资产名称}已欠费{金额}元，请于{日期}前缴纳。', enabled: true, updateTime: now(1) },
  { id: 2, name: '合同到期提醒', type: '站内信', scene: '合同临期前30天', content: '您有一份合同将于{日期}到期，涉及资产{资产名称}，请及时处理续租或退租。', enabled: true, updateTime: now(3) },
  { id: 3, name: '闲置资产盘活提醒', type: '邮件', scene: '闲置预警触发时', content: '{公司名称}名下资产{资产名称}已闲置超阈值，请制定盘活方案。', enabled: true, updateTime: now(6) },
  { id: 4, name: '预警处理结果回执', type: '微信推送', scene: '预警处理完成后', content: '预警单已处理完成，处理措施：详见系统。资产：{资产名称}。', enabled: false, updateTime: now(9) },
  { id: 5, name: '账单出账通知', type: '短信', scene: '周期自动出账后', content: '{承租人}您好，{日期}账单已生成，金额{金额}元，请及时查收。', enabled: true, updateTime: now(14) },
  { id: 6, name: '审批待办提醒', type: '站内信', scene: '有新审批待办时', content: '您有一条新的审批待办，涉及{资产名称}，请尽快处理。', enabled: true, updateTime: now(18) },
])

const typeTag = t => ({ 短信: 'primary', 站内信: 'success', 邮件: 'warning', 微信推送: 'info' }[t] || '')

const filtered = computed(() => {
  let r = rows.value
  if (filter.value.name) r = r.filter(x => x.name.includes(filter.value.name))
  if (filter.value.type) r = r.filter(x => x.type === filter.value.type)
  return r
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

const doQuery = () => { page.value = 1 }
const openEdit = row => {
  editing.value = row
  form.value = row ? { name: row.name, type: row.type, scene: row.scene, content: row.content } : { name: '', type: '短信', scene: '', content: '' }
  showEdit.value = true
}
const saveRow = () => {
  if (!form.value.name || !form.value.content) { ElMessage.warning('请填写模板名称与内容'); return }
  if (editing.value) Object.assign(editing.value, form.value, { updateTime: now(0) })
  else rows.value.unshift({ id: Date.now(), ...form.value, enabled: true, updateTime: now(0) })
  showEdit.value = false
  ElMessage.success('保存成功')
}
const onToggle = row => {
  ElMessage.success(row.enabled ? '已启用' : '已停用')
}
const preview = row => {
  previewText.value = row.content
    .replace('{资产名称}', '航城商铺A-03').replace('{承租人}', '张某')
    .replace('{金额}', '15,000').replace('{日期}', '2026-09-30').replace('{公司名称}', '城投集团')
  showPreview.value = true
}
</script>

<style scoped>
.filter-bar { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.preview-box { background: #f6f8fa; border: 1px solid #ebeef5; border-radius: 4px; padding: 14px; line-height: 1.8; font-size: 13px; }
</style>
