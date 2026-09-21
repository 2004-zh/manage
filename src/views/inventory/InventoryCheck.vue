<template>
  <div class="page-container">
    <div class="page-header">
      <h2>盘点清查</h2>
      <div class="header-tip">
        以资产台账当前快照为基准生成盘点清单，登记结果直接回写资产状态，异常留痕，是「盘点报表」唯一数据源。
      </div>
    </div>

    <!-- 顶部 KPI -->
    <div class="grid-4">
      <div class="kpi-card">
        <div class="kpi-label">任务总数</div>
        <div class="kpi-value num">{{ kpi.total }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">进行中</div>
        <div class="kpi-value num" style="color:var(--c-warning)">{{ kpi.inProgress }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">已完成</div>
        <div class="kpi-value num" style="color:var(--c-success)">{{ kpi.finished }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">整体差异率</div>
        <div class="kpi-value num" :style="{ color: kpi.overallDiffRate > 10 ? 'var(--c-danger)' : 'var(--t-main)' }">
          {{ kpi.overallDiffRate }}<span class="unit">%</span>
        </div>
      </div>
    </div>

    <!-- 任务清单 -->
    <el-card shadow="never" class="fill">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">发起盘点</el-button>
        <span class="muted">共 {{ scopedTasks.length }} 个任务 · 当前公司：{{ currentCompany }}</span>
      </div>

      <el-table :data="scopedTasks" row-key="id" border>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-wrap">
              <div class="expand-title">盘点清单（共 {{ row.summary.total }} 条，展示前 {{ Math.min(row.summary.total, 30) }} 条）</div>
              <el-table :data="row.lines.slice(0, 30)" size="small" border max-height="360">
                <el-table-column prop="assetId" label="资产编号" width="120" />
                <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
                <el-table-column prop="location" label="位置" min-width="180" show-overflow-tooltip />
                <el-table-column prop="bookValue" label="账面价值(万元)" width="130" />
                <el-table-column prop="area" label="账面面积(㎡)" width="120" />
                <el-table-column label="盘点结果" width="110">
                  <template #default="scope">
                    <el-tag size="small" :type="lineTagType(scope.row.checkResult)">{{ scope.row.checkResult }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="group" label="所属公司" width="120" />
        <el-table-column prop="createdTime" label="发起时间" width="150" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '已完成' ? 'success' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="180">
          <template #default="{ row }">
            <el-progress :percentage="linePct(row)" :stroke-width="10" />
            <span class="muted small">已盘 {{ row.summary.checked }} / {{ row.summary.total }}</span>
          </template>
        </el-table-column>
        <el-table-column label="差异分布" min-width="220">
          <template #default="{ row }">
            <el-tag v-if="row.summary.surplus" size="small" type="primary" style="margin-right:4px">盘盈 {{ row.summary.surplus }}</el-tag>
            <el-tag v-if="row.summary.loss" size="small" type="warning" style="margin-right:4px">盘亏 {{ row.summary.loss }}</el-tag>
            <el-tag v-if="row.summary.damaged" size="small" type="danger" style="margin-right:4px">损毁 {{ row.summary.damaged }}</el-tag>
            <el-tag v-if="row.summary.idle" size="small" type="info" style="margin-right:4px">闲置 {{ row.summary.idle }}</el-tag>
            <span v-if="!row.summary.diff" class="muted small">账实相符</span>
            <span v-else class="muted small">差异率 {{ row.summary.diffRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === '进行中'" type="primary" link size="small" @click="openRegister(row)">进入登记</el-button>
            <el-button v-if="row.status === '进行中'" type="success" link size="small" @click="handleFinish(row)">完成任务</el-button>
            <el-button type="info" link size="small" @click="openDiff(row)">差异汇总</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!scopedTasks.length" description="尚未发起任何盘点任务，点击右上角「发起盘点」开始" :image-size="80" />
    </el-card>

    <!-- 盘点报告表 -->
    <el-card shadow="never">
      <div class="card-title">盘点报告表（已完成任务）</div>
      <div class="filter-bar">
        <el-input v-model="reportFilter.name" placeholder="报告名称关键字" clearable style="width:220px" />
        <el-select v-model="reportFilter.group" placeholder="所属公司" clearable style="width:180px">
          <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <span class="muted">共 {{ filteredReports.length }} 份已完成报告</span>
      </div>
      <el-table :data="filteredReports" border>
        <el-table-column prop="id" label="任务编号" width="140" />
        <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="group" label="所属公司" width="120" />
        <el-table-column prop="finishedTime" label="完成时间" width="150" />
        <el-table-column label="总盘" width="70">
          <template #default="{ row }">{{ row.summary.total }}</template>
        </el-table-column>
        <el-table-column label="正常" width="70">
          <template #default="{ row }">{{ row.summary.normal }}</template>
        </el-table-column>
        <el-table-column label="盘盈" width="70">
          <template #default="{ row }"><span :class="{ hl: row.summary.surplus }">{{ row.summary.surplus }}</span></template>
        </el-table-column>
        <el-table-column label="盘亏" width="70">
          <template #default="{ row }"><span :class="{ hl: row.summary.loss }">{{ row.summary.loss }}</span></template>
        </el-table-column>
        <el-table-column label="损毁" width="70">
          <template #default="{ row }"><span :class="{ hl: row.summary.damaged }">{{ row.summary.damaged }}</span></template>
        </el-table-column>
        <el-table-column label="闲置" width="70">
          <template #default="{ row }">{{ row.summary.idle }}</template>
        </el-table-column>
        <el-table-column label="差异率" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.summary.diffRate > 10 }">{{ row.summary.diffRate }}%</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!filteredReports.length" description="暂无已完成盘点报告，任务完成后自动汇总到这里" :image-size="70" />
    </el-card>

    <!-- 发起盘点对话框 -->
    <el-dialog v-model="showCreate" title="发起盘点" width="640px" :close-on-click-modal="false">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="createForm.name" placeholder="如：2026年Q3资产盘点" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="盘点范围" required>
          <el-select v-model="createForm.group" style="width:100%" :disabled="userStore.isEnt">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定资产">
          <el-select
            v-model="createForm.assetIds"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="留空则快照本公司全部资产，可从下拉勾选重点资产"
            style="width:100%"
          >
            <el-option v-for="a in groupAssets" :key="a.id" :label="`${a.id} ${a.name}`" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计纳入">
          <span :class="{ 'text-danger': previewCount === 0 }">{{ previewCount }}</span>
          <span class="muted">项资产（快照生成后不随台账变动漂移）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">发起</el-button>
      </template>
    </el-dialog>

    <!-- 登记抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`盘点登记 · ${currentTask?.name || ''}`"
      size="70%"
      direction="rtl"
      :close-on-click-modal="false"
    >
      <div v-if="currentTask">
        <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
          逐条选择盘点结果并保存：<b>盘亏</b> → 资产转为「待处置」并标记 inventoryState=盘亏；<b>损毁</b> → 报废；
          <b>闲置未用</b> → 闲置；<b>盘盈</b> → 新增一条资产。完成登记后点击任务行的「完成任务」锁定。
        </el-alert>
        <div class="drawer-summary">
          <el-tag type="info" effect="plain">总条数 {{ currentTask.lines.length }}</el-tag>
          <el-tag type="success" effect="plain">已盘 {{ checkedCount }}</el-tag>
          <el-tag type="warning" effect="plain">未盘 {{ currentTask.lines.length - checkedCount }}</el-tag>
          <el-tag effect="plain">差异 {{ diffCount }}</el-tag>
        </div>
        <el-table :data="currentTask.lines" size="small" border max-height="560">
          <el-table-column prop="assetId" label="资产编号" width="110" fixed />
          <el-table-column prop="assetName" label="资产名称" min-width="140" show-overflow-tooltip fixed />
          <el-table-column label="账面" width="150">
            <template #default="{ row }">
              <span class="muted small">{{ row.bookValue || 0 }} 万元 / {{ row.area || 0 }} ㎡</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点结果" width="140">
            <template #default="{ row }">
              <el-select v-model="drafts[row.assetId].checkResult" size="small" placeholder="选择结果">
                <el-option v-for="r in CHECK_RESULTS.filter(x => x !== '未盘')" :key="r" :label="r" :value="r" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="实存面积/价值" width="220">
            <template #default="{ row }">
              <el-input v-model="drafts[row.assetId].actualArea" size="small" placeholder="面积㎡" style="width:96px" />
              <el-input v-model="drafts[row.assetId].actualValue" size="small" placeholder="价值万元" style="width:96px; margin-left:4px" />
            </template>
          </el-table-column>
          <el-table-column label="盘盈补录" width="240">
            <template #default="{ row }">
              <template v-if="drafts[row.assetId].checkResult === '盘盈'">
                <el-input v-model="drafts[row.assetId].newName" size="small" placeholder="新资产名称" />
                <el-input v-model="drafts[row.assetId].newLocation" size="small" placeholder="新位置" style="margin-top:4px" />
              </template>
              <span v-else class="muted small">—</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="160">
            <template #default="{ row }">
              <el-input v-model="drafts[row.assetId].remark" size="small" placeholder="登记说明" />
            </template>
          </el-table-column>
          <el-table-column label="当前" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="lineTagType(row.checkResult)">{{ row.checkResult }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="saveLine(row)">保存</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 差异汇总对话框 -->
    <el-dialog v-model="diffVisible" :title="`差异明细 · ${diffTask?.name || ''}`" width="920px">
      <div v-if="diffTask">
        <div class="drawer-summary">
          <el-tag type="primary" effect="plain">盘盈 {{ diffTask.summary.surplus }}</el-tag>
          <el-tag type="warning" effect="plain">盘亏 {{ diffTask.summary.loss }}</el-tag>
          <el-tag type="danger" effect="plain">损毁 {{ diffTask.summary.damaged }}</el-tag>
          <el-tag type="info" effect="plain">闲置 {{ diffTask.summary.idle }}</el-tag>
          <el-tag effect="plain">差异率 {{ diffTask.summary.diffRate }}%</el-tag>
        </div>
        <el-table :data="diffLines" size="small" border max-height="520">
          <el-table-column prop="assetId" label="资产编号" width="110" />
          <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="盘点结果" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="lineTagType(row.checkResult)">{{ row.checkResult }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实存面积" width="110">
            <template #default="{ row }">{{ row.actualArea ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="实存价值" width="110">
            <template #default="{ row }">{{ row.actualValue ?? '—' }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        </el-table>
        <el-empty v-if="!diffLines.length" description="本次盘点未发现差异" :image-size="70" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useInventoryStore, CHECK_RESULTS } from '../../store/inventory'
import { useAssetStore } from '../../store/asset'
import { useUserStore } from '../../store/user'

const store = useInventoryStore()
const assetStore = useAssetStore()
const userStore = useUserStore()

const allGroups = ['城投集团', '产投集团', '水投集团', '领航公司']
const currentCompany = computed(() => userStore.user?.org || '城投集团')
// 企业端只能给自己公司发起盘点；监管端理论上不进入此页（路由挂在 /ent 下）
const companyOptions = computed(() => userStore.isEnt ? [currentCompany.value] : allGroups)

// 任务列表按公司口径过滤，避免跨集团可见
const scopedTasks = computed(() =>
  userStore.isEnt
    ? store.taskList.filter(t => t.group === currentCompany.value)
    : store.taskList
)
const scopedReports = computed(() =>
  userStore.isEnt
    ? store.reports.filter(r => r.group === currentCompany.value)
    : store.reports
)

const kpi = computed(() => {
  const list = scopedTasks.value
  const totalLines = list.reduce((s, t) => s + t.summary.total, 0)
  const totalDiff = list.reduce((s, t) => s + t.summary.diff, 0)
  return {
    total: list.length,
    inProgress: list.filter(t => t.status === '进行中').length,
    finished: list.filter(t => t.status === '已完成').length,
    overallDiffRate: totalLines ? Math.round(totalDiff / totalLines * 1000) / 10 : 0
  }
})

function linePct(t) { return t.summary.total ? Math.round(t.summary.checked / t.summary.total * 100) : 0 }
function lineTagType(r) {
  return { 正常: 'success', 盘盈: 'primary', 盘亏: 'warning', 损毁: 'danger', 闲置未用: 'info', 未盘: 'info' }[r] || 'info'
}

// ===== 发起盘点对话框 =====
const showCreate = ref(false)
const createForm = reactive({ name: '', group: '', assetIds: [] })
const groupAssets = computed(() => assetStore.getAssetsByCompany(createForm.group || currentCompany.value))
const previewCount = computed(() => {
  if (createForm.assetIds.length) {
    return assetStore.assets.filter(a => createForm.assetIds.includes(a.id)).length
  }
  return groupAssets.value.length
})

function openCreateDialog() {
  const y = new Date().getFullYear()
  createForm.name = `${y}年${currentCompany.value}资产盘点`
  createForm.group = currentCompany.value
  createForm.assetIds = []
  showCreate.value = true
}

function submitCreate() {
  const name = createForm.name.trim()
  if (!name) { ElMessage.warning('请填写任务名称'); return }
  if (!createForm.group) { ElMessage.warning('请选择盘点范围'); return }
  if (previewCount.value === 0) {
    ElMessage.warning(`「${createForm.group}」当前无可纳入资产，无法发起盘点`)
    return
  }
  const task = store.createTask({
    name,
    group: createForm.group,
    assetIds: createForm.assetIds.length ? [...createForm.assetIds] : undefined
  })
  showCreate.value = false
  ElMessage.success(`盘点任务 ${task.id} 已发起，纳入 ${previewCount.value} 项资产`)
}

// ===== 登记抽屉 =====
const drawerVisible = ref(false)
const currentTaskId = ref('')
const drafts = reactive({})
const currentTask = computed(() => currentTaskId.value ? store.getTask(currentTaskId.value) : null)
const checkedCount = computed(() => currentTask.value ? currentTask.value.lines.filter(l => l.checkResult !== '未盘').length : 0)
const diffCount = computed(() => currentTask.value ? currentTask.value.lines.filter(l => l.checkResult !== '正常' && l.checkResult !== '未盘').length : 0)

function openRegister(task) {
  currentTaskId.value = task.id
  Object.keys(drafts).forEach(k => delete drafts[k])
  task.lines.forEach(l => {
    drafts[l.assetId] = {
      checkResult: l.checkResult && l.checkResult !== '未盘' ? l.checkResult : '',
      actualArea: l.actualArea ?? '',
      actualValue: l.actualValue ?? '',
      remark: l.remark || '',
      newName: '',
      newLocation: ''
    }
  })
  drawerVisible.value = true
}

function saveLine(line) {
  const d = drafts[line.assetId]
  if (!d || !d.checkResult) { ElMessage.warning('请先选择盘点结果'); return }
  const ok = store.registerLine(currentTaskId.value, line.assetId, {
    checkResult: d.checkResult,
    remark: d.remark,
    actualArea: d.actualArea,
    actualValue: d.actualValue,
    newName: d.newName,
    newLocation: d.newLocation
  })
  if (ok) ElMessage.success(`${line.assetName} 已登记为「${d.checkResult}」`)
  else ElMessage.error('登记失败，请稍后重试')
}

function handleFinish(row) {
  ElMessageBox.confirm(
    `确认完成盘点任务「${row.name}」？完成后不可再登记，差异将进入盘点报告表。`,
    '完成盘点',
    { type: 'warning' }
  ).then(() => {
    const r = store.finishTask(row.id)
    if (r && r.ok) {
      ElMessage.success(`任务已完成：${row.summary.total} 条，差异 ${row.summary.diff} 项`)
      if (drawerVisible.value && currentTaskId.value === row.id) drawerVisible.value = false
    } else if (r && r.unchecked) {
      ElMessage.warning(`还有 ${r.unchecked} 条未盘，请先完成登记`)
    }
  }).catch(() => {})
}

// ===== 差异汇总对话框 =====
const diffVisible = ref(false)
const diffTaskId = ref('')
const diffTask = computed(() => diffTaskId.value ? store.getTask(diffTaskId.value) : null)
const diffLines = computed(() =>
  diffTask.value
    ? diffTask.value.lines.filter(l => l.checkResult !== '正常' && l.checkResult !== '未盘')
    : []
)
function openDiff(row) {
  diffTaskId.value = row.id
  diffVisible.value = true
}

// ===== 报告表过滤 =====
const reportFilter = reactive({ name: '', group: '' })
const filteredReports = computed(() => scopedReports.value.filter(r =>
  (!reportFilter.name || r.name.includes(reportFilter.name.trim())) &&
  (!reportFilter.group || r.group === reportFilter.group)
))
</script>

<style scoped>
.page-header h2 { margin: 0 0 4px 0; }
.header-tip { font-size: 12px; color: var(--t-weak); }

.kpi-card { background: var(--bg-th); border: 1px solid var(--bd); border-radius: var(--r-md); padding: 12px 16px; }
.kpi-label { font-size: 12px; color: var(--t-weak); margin-bottom: 6px; }
.kpi-value { font-size: 22px; font-weight: 600; color: var(--t-main); }
.unit { font-size: 12px; font-weight: normal; color: var(--t-weak); margin-left: 2px; }

.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.filter-bar { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
.card-title { font-weight: 600; font-size: 15px; margin-bottom: 12px; color: var(--t-main); }
.muted { color: var(--t-weak); font-size: 13px; }
.small { font-size: 12px; }
.hl { color: var(--c-warning); font-weight: 600; }
.text-danger { color: var(--c-danger); font-weight: 600; }

.expand-wrap { padding: 8px 24px 16px; }
.expand-title { font-size: 13px; font-weight: 600; color: var(--t-sub); margin-bottom: 8px; }
.drawer-summary { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
</style>
