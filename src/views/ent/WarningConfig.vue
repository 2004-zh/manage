<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预警配置</h2>
    </div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="公司">
          <el-input v-model="query.company" placeholder="公司" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="预警等级">
          <el-select v-model="query.level" placeholder="预警等级" clearable style="width: 140px">
            <el-option v-for="l in levels" :key="l" :label="l" :value="l" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="doQuery">查询</el-button>
          <el-button :icon="Plus" @click="openCreate">新增</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="fill">
      <el-table :data="pagedRows" border stripe>
        <el-table-column prop="company" label="公司" min-width="200" />
        <el-table-column prop="type" label="预警类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="row.type === '到期预警' ? 'warning' : 'info'">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition" label="触发条件" min-width="180" />
        <el-table-column prop="level" label="预警等级" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="levelType(row.level)" effect="plain">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发区间" width="130">
          <template #default="{ row }"><span class="num">{{ row.min }} -{{ row.max }} {{ row.unit }}</span></template>
        </el-table-column>
        <el-table-column label="启用" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="onToggle(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filtered.length"
          :page-sizes="[10, 15, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <el-dialog v-model="createVisible" title="新增" width="560px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="选择公司" required>
          <el-select v-model="form.companies" multiple filterable placeholder="请选择" style="width: 100%">
            <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警类型" required>
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%" @change="form.condition = []">
            <el-option label="到期预警" value="到期预警" />
            <el-option label="闲置预警" value="闲置预警" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警等级" required>
          <el-cascader
            v-model="form.condition"
            :options="conditionOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="触发条件" required>
          <el-input-number v-model="form.min" :min="1" :max="3650" />
        </el-form-item>
        <el-form-item label="最大触发条件" required>
          <el-input-number v-model="form.max" :min="1" :max="3650" />
        </el-form-item>
        <el-form-item label="触发条件单位" required>
          <el-select v-model="form.unit" style="width: 100%">
            <el-option label="天" value="天" />
            <el-option label="月" value="月" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="预警配置详情" width="520px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="公司">{{ current.company }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ current.type }}</el-descriptions-item>
        <el-descriptions-item label="触发条件">{{ current.condition }}</el-descriptions-item>
        <el-descriptions-item label="预警等级">{{ current.level }}</el-descriptions-item>
        <el-descriptions-item label="触发区间">{{ current.min }} -{{ current.max }} {{ current.unit }}</el-descriptions-item>
        <el-descriptions-item label="启用状态">{{ current.enabled ? '已启用' : '已停用' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ current.updateTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'

const userStore = useUserStore()
const currentCompany = computed(() => userStore.user?.org || '城投集团')
// 预警规则按公司配置：企业端只允许给自己公司配
const companies = computed(() => userStore.isEnt ? [currentCompany.value] : ['城投集团', '产投集团', '水投集团', '领航公司'])
const levels = ['一般', '较急', '紧急', '特别紧急']

const conditionOptions = [
  {
    value: '到期预警',
    label: '到期预警',
    children: [
      { value: '合同到期', label: '合同到期' },
      { value: '任务到期', label: '任务到期' },
      { value: '资产评估到期', label: '资产评估到期' },
      { value: '无形资产－评估到期', label: '无形资产－评估到期' },
      { value: '无形资产－使用权到期', label: '无形资产－使用权到期' },
      { value: '资产抵押到期', label: '资产抵押到期' }
    ]
  },
  {
    value: '闲置预警',
    label: '闲置预警',
    children: [
      { value: '资产闲置', label: '资产闲置' },
      { value: '项目闲置', label: '项目闲置' }
    ]
  }
]

function now(offsetDays = 0) {
  const d = new Date(2026, 2, 26, 11, 32, 4)
  d.setDate(d.getDate() - offsetDays)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const rows = ref([
  ...['城投集团', '产投集团', '水投集团', '领航公司'].flatMap((c, i) => [
    { company: c, type: '到期预警', condition: '合同到期', level: '紧急', min: 30, max: 90, unit: '天', enabled: true, updateTime: now(i + 1) },
    { company: c, type: '闲置预警', condition: '资产闲置', level: '较急', min: 90, max: 180, unit: '天', enabled: true, updateTime: now(i + 2) }
  ]),
  { company: '江苏安东控股集团有限公司', type: '到期预警', condition: '合同到期', level: '紧急', min: 2, max: 50, unit: '天', enabled: true, updateTime: now(1) },
  { company: '江苏安东控股集团有限公司', type: '到期预警', condition: '任务到期', level: '较急', min: 3, max: 30, unit: '天', enabled: true, updateTime: now(2) },
  { company: '江苏安东控股集团有限公司', type: '闲置预警', condition: '资产闲置', level: '一般', min: 90, max: 180, unit: '天', enabled: true, updateTime: now(3) },
  { company: '江苏安东控股集团有限公司', type: '到期预警', condition: '资产评估到期', level: '较急', min: 5, max: 60, unit: '天', enabled: false, updateTime: now(4) },
  { company: '江苏安东控股集团有限公司', type: '到期预警', condition: '合同到期', level: '特别紧急', min: 1, max: 15, unit: '天', enabled: true, updateTime: now(5) },
  { company: '江苏安东控股集团有限公司', type: '闲置预警', condition: '项目闲置', level: '较急', min: 60, max: 120, unit: '天', enabled: true, updateTime: now(6) },
  { company: '江苏望风有限公司', type: '到期预警', condition: '合同到期', level: '紧急', min: 2, max: 45, unit: '天', enabled: true, updateTime: now(7) },
  { company: '江苏望风有限公司', type: '闲置预警', condition: '资产闲置', level: '一般', min: 120, max: 240, unit: '天', enabled: true, updateTime: now(8) },
  { company: '江苏望风有限公司', type: '到期预警', condition: '资产抵押到期', level: '特别紧急', min: 1, max: 20, unit: '天', enabled: true, updateTime: now(9) },
  { company: '江苏望风有限公司', type: '到期预警', condition: '任务到期', level: '较急', min: 3, max: 25, unit: '天', enabled: false, updateTime: now(10) },
  { company: '江苏望风有限公司', type: '到期预警', condition: '无形资产－使用权到期', level: '紧急', min: 2, max: 50, unit: '天', enabled: true, updateTime: now(11) },
  { company: '重庆凌飞有限公司', type: '到期预警', condition: '无形资产－使用权到期', level: '紧急', min: 2, max: 50, unit: '天', enabled: true, updateTime: now(12) },
  { company: '重庆凌飞有限公司', type: '闲置预警', condition: '资产闲置', level: '较急', min: 30, max: 90, unit: '天', enabled: true, updateTime: now(13) },
  { company: '重庆凌飞有限公司', type: '到期预警', condition: '无形资产－评估到期', level: '一般', min: 10, max: 90, unit: '天', enabled: true, updateTime: now(14) },
  { company: '重庆凌飞有限公司', type: '到期预警', condition: '合同到期', level: '较急', min: 5, max: 40, unit: '天', enabled: true, updateTime: now(15) }
])

const query = ref({ company: '', level: '' })
const page = ref(1)
const pageSize = ref(15)

const filtered = computed(() =>
  rows.value.filter(
    r =>
      (!userStore.isEnt || r.company === currentCompany.value) &&
      (!query.value.company || r.company.includes(query.value.company)) &&
      (!query.value.level || r.level === query.value.level)
  )
)
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function doQuery() {
  page.value = 1
}

function levelType(level) {
  return { 一般: 'info', 较急: 'warning', 紧急: 'danger', 特别紧急: 'danger' }[level] || 'info'
}

function onToggle(row) {
  row.updateTime = now(0)
  ElMessage.success(row.enabled ? '已启用该预警配置' : '已停用该预警配置')
}

const createVisible = ref(false)
const form = ref(emptyForm())

function emptyForm() {
  return { companies: [], type: '', condition: [], min: 2, max: 50, unit: '天' }
}

function openCreate() {
  form.value = emptyForm()
  createVisible.value = true
}

function confirmCreate() {
  const f = form.value
  if (!f.companies.length || !f.type || f.condition.length < 2) {
    ElMessage.warning('请完整填写公司、预警类型与预警等级')
    return
  }
  f.companies.forEach(c => {
    rows.value.unshift({
      company: c,
      type: f.type,
      condition: f.condition[1],
      level: '紧急',
      min: f.min,
      max: f.max,
      unit: f.unit,
      enabled: true,
      updateTime: now(0)
    })
  })
  createVisible.value = false
  page.value = 1
  ElMessage.success('新增预警配置成功')
}

const detailVisible = ref(false)
const current = ref(null)

function viewDetail(row) {
  current.value = row
  detailVisible.value = true
}
</script>

<style scoped>
/* 筛选卡只留卡片自身一层内边距，表单项不再叠加底部空隙 */
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
</style>
