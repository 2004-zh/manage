<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预警规则配置</h2>
      <el-button type="primary" @click="openDialog()">新增规则</el-button>
    </div>

    <div class="grid-4">
      <el-card shadow="hover">
        <div class="kpi-value num" style="color:var(--c-primary)">{{ rules.length }}</div>
        <div class="kpi-label">规则总数</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value num" style="color:var(--c-success)">{{ enabledCount }}</div>
        <div class="kpi-label">已启用</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value num" style="color:var(--c-danger)">{{ triggeredCount }}</div>
        <div class="kpi-label">本年触发次数</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value num" style="color:var(--c-warning)">{{ redCount }}</div>
        <div class="kpi-label">红色预警规则</div>
      </el-card>
    </div>

    <el-card shadow="never" class="fill">
      <div class="filter-bar">
        <el-form :inline="true">
          <el-form-item label="预警类型">
            <el-select v-model="filterType" clearable placeholder="全部" style="width:140px">
              <el-option v-for="t in warnTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警级别">
            <el-select v-model="filterLevel" clearable placeholder="全部" style="width:120px">
              <el-option label="红色" value="红色" />
              <el-option label="橙色" value="橙色" />
              <el-option label="黄色" value="黄色" />
              <el-option label="蓝色" value="蓝色" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="keyword" placeholder="搜索规则名称" clearable style="width:200px" />
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="filteredRules" border stripe>
        <el-table-column prop="name" label="规则名称" min-width="200" />
        <el-table-column prop="type" label="预警类型" width="130" />
        <el-table-column prop="level" label="预警级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :color="levelColor(row.level)" effect="dark" size="small" style="border:none">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition" label="触发条件" min-width="220" />
        <el-table-column prop="description" label="规则描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="triggerCount" label="本年触发" width="90" align="center" />
        <el-table-column label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleRule(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewRecords(row)">触发记录</el-button>
            <el-button type="warning" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑规则 -->
    <el-dialog v-model="showDialog" :title="form.isEdit ? '编辑预警规则' : '新增预警规则'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" placeholder="如：租金欠缴超90天红色预警" />
        </el-form-item>
        <el-form-item label="预警类型" required>
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="t in warnTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警级别" required>
          <el-radio-group v-model="form.level">
            <el-radio-button v-for="l in ['红色', '橙色', '黄色', '蓝色']" :key="l" :value="l">{{ l }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="触发阈值" required>
          <div style="display:flex;gap:8px;width:100%">
            <el-select v-model="form.metric" style="width:180px">
              <el-option v-for="m in metrics" :key="m" :label="m" :value="m" />
            </el-select>
            <el-select v-model="form.operator" style="width:90px">
              <el-option label="≥" value="≥" />
              <el-option label=">" value=">" />
              <el-option label="≤" value="≤" />
              <el-option label="<" value="<" />
            </el-select>
            <el-input-number v-model="form.threshold" :min="0" style="flex:1" />
            <el-input v-model="form.unit" placeholder="单位" style="width:80px" />
          </div>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="说明规则用途与处置要求" />
        </el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="form.notify">
            <el-checkbox value="站内消息">站内消息</el-checkbox>
            <el-checkbox value="短信">短信</el-checkbox>
            <el-checkbox value="企业端待办">企业端待办</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 触发记录 -->
    <el-drawer v-model="showRecords" title="规则触发记录" size="520px">
      <template v-if="currentRule">
        <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="规则名称">{{ currentRule.name }}</el-descriptions-item>
          <el-descriptions-item label="触发条件">{{ currentRule.condition }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="currentRule.records" border size="small">
          <el-table-column prop="time" label="触发时间" width="110" />
          <el-table-column prop="target" label="预警对象" min-width="160" />
          <el-table-column prop="value" label="触发值" width="90" align="right" />
          <el-table-column prop="handled" label="处置" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.handled ? 'success' : 'danger'" size="small">{{ row.handled ? '已处置' : '未处置' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button v-if="!row.handled" type="primary" link size="small" @click="markHandled(row)">处置</el-button>
              <span v-else style="color:var(--t-weak);font-size:12px">—</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const warnTypes = ['欠费预警', '合同到期预警', '资产闲置预警', '权证过期预警', '处置合规预警', '巡检异常预警']
const metrics = ['欠费天数', '欠费金额', '合同剩余天数', '闲置天数', '权证剩余天数', '收缴率']

const filterType = ref('')
const filterLevel = ref('')
const keyword = ref('')
const showDialog = ref(false)
const showRecords = ref(false)
const currentRule = ref(null)

const rules = ref([
  {
    id: 1, name: '租金欠缴超90天红色预警', type: '欠费预警', level: '红色',
    condition: '欠费天数 ≥ 90 天', description: '欠缴租金超过90天自动生成红色预警，推送至区国资办监管端与企业端待办，要求7日内上报处置方案。',
    enabled: true, triggerCount: 5,
    records: [
      { time: '2026-09-10', target: 'HT-2024-025 · 福建某制造有限公司', value: '120天', handled: false },
      { time: '2026-08-15', target: 'HT-2023-018 · 张某', value: '95天', handled: true },
    ]
  },
  {
    id: 2, name: '合同临期60天预警', type: '合同到期预警', level: '橙色',
    condition: '合同剩余天数 ≤ 60 天', description: '合同到期前60天提醒经办人启动续租或退租流程，避免资产空置。',
    enabled: true, triggerCount: 12,
    records: [
      { time: '2026-09-05', target: 'HT-2024-012 · 城西停车场', value: '45天', handled: false },
      { time: '2026-07-20', target: 'HT-2024-005 · 首占商铺C-08', value: '58天', handled: true },
    ]
  },
  {
    id: 3, name: '资产闲置超180天预警', type: '资产闲置预警', level: '黄色',
    condition: '闲置天数 ≥ 180 天', description: '资产连续闲置超过半年，提示纳入招租计划或调整经营用途。',
    enabled: true, triggerCount: 8,
    records: [{ time: '2026-08-01', target: '航城厂房2#', value: '210天', handled: false }]
  },
  {
    id: 4, name: '权证到期前90天提醒', type: '权证过期预警', level: '黄色',
    condition: '权证剩余天数 ≤ 90 天', description: '不动产权证、特许经营权证等到期前提醒办理续期登记。',
    enabled: true, triggerCount: 3,
    records: [{ time: '2026-06-18', target: '闽(2016)长乐区不动产权第01XX号', value: '85天', handled: true }]
  },
  {
    id: 5, name: '处置程序缺失预警', type: '处置合规预警', level: '红色',
    condition: '处置未经审批即执行', description: '资产处置未完成三级审批即发起交易的，触发红色预警并冻结流程。',
    enabled: false, triggerCount: 0, records: []
  },
  {
    id: 6, name: '收缴率低于80%预警', type: '欠费预警', level: '蓝色',
    condition: '收缴率 ≤ 80 %', description: '月度收缴率低于80%时提醒财务部门加强催缴。',
    enabled: true, triggerCount: 4,
    records: [{ time: '2026-09-01', target: '2026年8月月度收缴', value: '78.2%', handled: false }]
  },
])

const filteredRules = computed(() => rules.value.filter(r =>
  (!filterType.value || r.type === filterType.value) &&
  (!filterLevel.value || r.level === filterLevel.value) &&
  (!keyword.value || r.name.includes(keyword.value))
))

const enabledCount = computed(() => rules.value.filter(r => r.enabled).length)
const triggeredCount = computed(() => rules.value.reduce((s, r) => s + r.triggerCount, 0))
const redCount = computed(() => rules.value.filter(r => r.level === '红色').length)

function levelColor(level) {
  return { '红色': '#D93026', '橙色': '#E8912A', '黄色': '#C8963E', '蓝色': '#1668DC' }[level] || '#909399'
}

const form = ref({})
function openDialog(row) {
  if (row) {
    const m = row.condition.match(/^(.+?)\s*([≥>≤<])\s*([\d.]+)\s*(.*)$/)
    form.value = {
      isEdit: true, id: row.id, name: row.name, type: row.type, level: row.level,
      metric: m ? m[1] : metrics[0], operator: m ? m[2] : '≥', threshold: m ? parseFloat(m[3]) : 0, unit: m ? m[4] : '',
      description: row.description, notify: ['站内消息']
    }
  } else {
    form.value = { isEdit: false, name: '', type: warnTypes[0], level: '黄色', metric: metrics[0], operator: '≥', threshold: 0, unit: '', description: '', notify: ['站内消息'] }
  }
  showDialog.value = true
}

function saveRule() {
  const f = form.value
  if (!f.name || !f.metric || f.threshold === undefined) {
    ElMessage.warning('请填写完整的规则信息')
    return
  }
  const condition = `${f.metric} ${f.operator} ${f.threshold} ${f.unit}`.trim()
  if (f.isEdit) {
    const row = rules.value.find(r => r.id === f.id)
    if (row) Object.assign(row, { name: f.name, type: f.type, level: f.level, condition, description: f.description })
    ElMessage.success('规则已更新')
  } else {
    rules.value.push({
      id: rules.value.length + 1, name: f.name, type: f.type, level: f.level,
      condition, description: f.description, enabled: true, triggerCount: 0, records: []
    })
    ElMessage.success('规则已创建并启用')
  }
  showDialog.value = false
}

function toggleRule(row) {
  ElMessage.success(`规则"${row.name}"已${row.enabled ? '启用' : '停用'}`)
}

function deleteRule(row) {
  ElMessageBox.confirm(`确认删除规则"${row.name}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = rules.value.findIndex(r => r.id === row.id)
    if (idx > -1) rules.value.splice(idx, 1)
    ElMessage.success('规则已删除')
  }).catch(() => {})
}

function viewRecords(row) {
  currentRule.value = row
  showRecords.value = true
}

function markHandled(row) {
  ElMessageBox.prompt('请填写处置说明', '预警处置', { inputPlaceholder: '如：已电话通知承租方并签订还款计划' }).then(() => {
    row.handled = true
    ElMessage.success('已标记为处置完成')
  }).catch(() => {})
}
</script>
