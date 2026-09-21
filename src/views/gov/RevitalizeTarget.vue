<template>
  <div class="page-container">
    <div class="page-header">
      <h2>盘活目标管理</h2>
      <div>
        <el-select v-model="yearFilter" style="width: 120px">
          <el-option v-for="y in yearOptions" :key="y" :label="y + ' 年度'" :value="y" />
        </el-select>
        <el-button @click="openSaveTarget">
          <el-icon><EditPen /></el-icon>
          保存目标
        </el-button>
        <el-button type="primary" @click="handleCreateTarget">
          <el-icon><Plus /></el-icon>
          新建年度目标
        </el-button>
      </div>
    </div>
    <el-card class="fill">

      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        当前资产台账识别出闲置/空置资产 <b>{{ idleTotal.count }}</b> 宗、<b>{{ idleTotal.area.toLocaleString() }}</b> ㎡，是本年度盘活目标的底数来源；
        目标下达后，各公司每一次租金收缴、资产处置、招租签约、闲置盘活产生的金额都会自动计入盘活进度，并汇总到全区盘活数据中。
      </el-alert>

      <div class="grid-4 kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">年度盘活目标</div>
          <div class="kpi-value num">{{ currentYearAmount.toLocaleString() }}<span class="unit">万元</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">已完成金额</div>
          <div class="kpi-value num" style="color:var(--c-success)">{{ completedAmount.toLocaleString() }}<span class="unit">万元</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">完成率</div>
          <div class="kpi-value num" :style="{ color: completionRate >= 100 ? 'var(--c-success)' : completionRate >= 60 ? 'var(--c-warning)' : 'var(--c-danger)' }">{{ completionRate }}%</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">盘活宗数</div>
          <div class="kpi-value num">{{ completedCount }}<span class="unit">/ {{ currentYearCount }} 宗</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">参与公司</div>
          <div class="kpi-value num">{{ allocatedCompanies }}<span class="unit">家</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">{{ monthKpi.label }}</div>
          <div class="kpi-value num" style="color:var(--c-primary)">{{ monthKpi.value.toLocaleString() }}<span class="unit">万元</span></div>
        </div>
      </div>

      <el-table :data="filteredTargets" row-key="id" style="width: 100%">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-wrap">
              <div class="expand-title">各公司分摊与完成情况</div>
              <el-table v-if="row.allocations.length" :data="companyRows(row)" size="small" border>
                <el-table-column prop="company" label="公司" width="140" />
                <el-table-column prop="ratio" label="分摊比例" width="100">
                  <template #default="{ row: c }">{{ c.ratio }}%</template>
                </el-table-column>
                <el-table-column prop="amount" label="分摊金额(万元)" width="140">
                  <template #default="{ row: c }">{{ c.amount.toLocaleString() }}</template>
                </el-table-column>
                <el-table-column prop="count" label="分摊宗数" width="100" />
                <el-table-column prop="doneAmount" label="已完成金额(万元)" width="160">
                  <template #default="{ row: c }">{{ c.doneAmount.toLocaleString() }}</template>
                </el-table-column>
                <el-table-column prop="doneCount" label="已完成宗数" width="110" />
                <el-table-column label="完成率" min-width="200">
                  <template #default="{ row: c }">
                    <el-progress :percentage="c.rate" :status="c.rate >= 100 ? 'success' : ''" />
                  </template>
                </el-table-column>
                <el-table-column label="达标状态" width="110">
                  <template #default="{ row: c }">
                    <el-tag :type="c.rate >= 100 ? 'success' : c.rate >= 60 ? 'warning' : 'danger'" size="small">
                      {{ c.rate >= 100 ? '已达标' : c.rate >= 60 ? '进度正常' : '进度滞后' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <el-empty v-else description="尚未设置分摊方案" :image-size="60" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年度" width="80" />
        <el-table-column prop="name" label="目标名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="amountTarget" label="盘活金额目标(万元)" width="170">
          <template #default="{ row }">{{ row.amountTarget.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="countTarget" label="盘活宗数目标" width="120" />
        <el-table-column label="完成情况" min-width="200">
          <template #default="{ row }">
            <el-progress :percentage="targetRate(row)" :status="targetRate(row) >= 100 ? 'success' : ''" />
            <span class="progress-text">{{ doneOf(row).amount.toLocaleString() }} / {{ row.amountTarget.toLocaleString() }} 万元</span>
          </template>
        </el-table-column>
        <el-table-column label="已分摊" width="110">
          <template #default="{ row }">
            <span :class="{ 'text-danger': allocatedRatio(row) > 100 }">{{ allocatedRatio(row) }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(revitalizeStore.statusOf(row.year))" size="small">{{ revitalizeStore.statusOf(row.year) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="issueTime" label="下达时间" width="120">
          <template #default="{ row }">{{ row.issueTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openAllocate(row)">{{ row.allocations.some(a => a.ratio > 0) ? '调整分摊' : '分摊下达' }}</el-button>
            <el-button link type="primary" size="small" @click="openFlows(row)">盘活流水</el-button>
            <el-button link type="warning" size="small" @click="handleEditTarget(row)">调整目标</el-button>
            <el-button link type="danger" size="small" @click="handleDeleteTarget(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="yearTarget">
      <template #header>
        <div class="card-header">
          <span>{{ yearFilter }} 年度各公司盘活完成排行</span>
          <el-button type="primary" plain size="small" @click="exportRank">导出排行榜</el-button>
        </div>
      </template>
      <div class="grid-2" v-if="rankRows.length">
        <div class="rank-item" v-for="(c, i) in rankRows" :key="c.company">
          <div class="rank-head">
            <span class="rank-no" :class="'rank-' + (i + 1)">{{ i + 1 }}</span>
            <span class="rank-name">{{ c.company }}</span>
            <el-tag :type="c.rate >= 100 ? 'success' : c.rate >= 60 ? 'warning' : 'danger'" size="small">{{ c.rate }}%</el-tag>
          </div>
          <el-progress :percentage="c.rate" :show-text="false" :stroke-width="10" />
          <div class="rank-foot">
            <span>已完成 {{ c.doneAmount.toLocaleString() }} / 分摊 {{ c.amount.toLocaleString() }} 万元</span>
            <span>盘活 {{ c.doneCount }} / {{ c.count }} 宗</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="该年度尚未设置分摊方案" :image-size="70" />
    </el-card>

    <!-- 保存目标 -->
    <el-dialog v-model="saveTargetVisible" title="保存目标" width="780px">
      <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="170px">
        <el-form-item label="目标名" prop="name">
          <el-input v-model="saveForm.name" placeholder="请输入目标名" style="width:360px" />
        </el-form-item>
        <el-form-item label="目标期限" prop="period">
          <el-date-picker
            v-model="saveForm.period"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:360px"
          />
        </el-form-item>
        <el-form-item label="资产盘活目标额(元)" prop="assetAmount">
          <el-input-number v-model="saveForm.assetAmount" :min="0" :step="1000000" :precision="0" controls-position="right" style="width:240px" />
        </el-form-item>
        <el-form-item label="回收资金目标数(元)" prop="fundAmount">
          <el-input-number v-model="saveForm.fundAmount" :min="0" :step="1000000" :precision="0" controls-position="right" style="width:240px" />
        </el-form-item>
      </el-form>

      <div class="section-title">按公司分解</div>
      <el-table :data="saveRows" size="small" border>
        <el-table-column prop="company" label="公司" min-width="140" />
        <el-table-column label="资产盘活目标%" width="220">
          <template #default="{ row }">
            <el-input-number v-model="row.assetPct" :min="0" :max="100" :step="5" size="small" controls-position="right" style="width:150px" />
          </template>
        </el-table-column>
        <el-table-column label="回收资金目标数%" width="220">
          <template #default="{ row }">
            <el-input-number v-model="row.fundPct" :min="0" :max="100" :step="5" size="small" controls-position="right" style="width:150px" />
          </template>
        </el-table-column>
      </el-table>
      <div class="decompose-summary">
        <el-tag :type="saveAssetPctTotal === 100 ? 'success' : saveAssetPctTotal > 100 ? 'danger' : 'warning'" effect="plain">
          资产盘活目标合计 {{ saveAssetPctTotal }}%
        </el-tag>
        <el-tag :type="saveFundPctTotal === 100 ? 'success' : saveFundPctTotal > 100 ? 'danger' : 'warning'" effect="plain">
          回收资金目标合计 {{ saveFundPctTotal }}%
        </el-tag>
      </div>

      <div class="save-float-bar">
        <el-button type="primary" size="large" class="save-float-btn" @click="submitSaveTarget">
          <el-icon><Check /></el-icon>
          保存
        </el-button>
      </div>
      <template #footer>
        <el-button @click="saveTargetVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSaveTarget">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新建/调整目标 -->
    <el-dialog v-model="targetDialogVisible" :title="targetForm.id ? '调整年度目标' : '新建年度目标'" width="520px">
      <el-form :model="targetForm" label-width="130px">
        <el-form-item label="目标年度" required>
          <el-select v-model="targetForm.year" :disabled="!!targetForm.id" style="width:100%">
            <el-option v-for="y in yearOptions" :key="y" :label="y + ' 年度'" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标名称" required>
          <el-input v-model="targetForm.name" placeholder="如：2027年度国有资产盘活目标" />
        </el-form-item>
        <el-form-item label="盘活金额目标" required>
          <el-input-number v-model="targetForm.amountTarget" :min="1" :max="1000000" :step="1000" /> 万元
        </el-form-item>
        <el-form-item label="盘活宗数目标" required>
          <el-input-number v-model="targetForm.countTarget" :min="1" :max="10000" :step="10" /> 宗
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="targetForm.remark" type="textarea" :rows="2" placeholder="目标制定依据、考核口径说明等" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="targetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTarget">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分摊下达 -->
    <el-dialog v-model="allocateDialogVisible" title="盘活目标分摊" width="720px">
      <template v-if="allocateTarget">
        <el-descriptions :column="3" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="年度">{{ allocateTarget.year }}</el-descriptions-item>
          <el-descriptions-item label="金额目标">{{ allocateTarget.amountTarget.toLocaleString() }} 万元</el-descriptions-item>
          <el-descriptions-item label="宗数目标">{{ allocateTarget.countTarget }} 宗</el-descriptions-item>
        </el-descriptions>

        <el-table :data="allocateRows" size="small" border>
          <el-table-column prop="company" label="下属公司" width="140" />
          <el-table-column label="闲置底数" width="130">
            <template #default="{ row }">{{ idleOf(row.company) }} 宗 / {{ idleAreaOf(row.company) }} ㎡</template>
          </el-table-column>
          <el-table-column label="分摊比例(%)" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.ratio" :min="0" :max="100" :step="5" size="small" controls-position="right" style="width:120px" />
            </template>
          </el-table-column>
          <el-table-column label="分摊金额(万元)" width="150">
            <template #default="{ row }">{{ Math.round(allocateTarget.amountTarget * row.ratio / 100).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="分摊宗数" width="110">
            <template #default="{ $index }">{{ allocateCounts[$index] }}</template>
          </el-table-column>
          <el-table-column label="已完成(万元)" min-width="130">
            <template #default="{ row }">{{ doneOfCompany(allocateTarget.year, row.company).amount.toLocaleString() }}</template>
          </el-table-column>
        </el-table>

        <div class="allocate-summary">
          <el-tag :type="allocateTotalRatio === 100 ? 'success' : allocateTotalRatio > 100 ? 'danger' : 'warning'" effect="dark">
            分摊比例合计 {{ allocateTotalRatio }}%
          </el-tag>
          <span>分摊金额 {{ allocateTotalAmount.toLocaleString() }} 万元 / 目标 {{ allocateTarget.amountTarget.toLocaleString() }} 万元</span>
          <span>未分摊 {{ (allocateTarget.amountTarget - allocateTotalAmount).toLocaleString() }} 万元</span>
          <el-button link type="primary" size="small" @click="idleAllocate">按闲置底数分摊</el-button>
          <el-button link type="primary" size="small" @click="averageAllocate">平均分摊</el-button>
        </div>
      </template>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAllocate">确认下达</el-button>
      </template>
    </el-dialog>

    <!-- 盘活流水 -->
    <el-drawer v-model="flowDrawerVisible" title="盘活流水" size="62%">
      <template v-if="flowTarget">
        <el-descriptions :column="3" border size="small" style="margin-bottom:12px">
          <el-descriptions-item label="年度目标">{{ flowTarget.name }}</el-descriptions-item>
          <el-descriptions-item label="已完成">{{ doneOf(flowTarget).amount.toLocaleString() }} 万元</el-descriptions-item>
          <el-descriptions-item label="完成率">{{ targetRate(flowTarget) }}%</el-descriptions-item>
        </el-descriptions>

        <div class="flow-toolbar">
          <el-select v-model="flowSourceFilter" placeholder="全部来源" clearable size="small" style="width:140px">
            <el-option v-for="s in sourceTypes" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="success" size="small" @click="syncBusinessData">同步业务数据</el-button>
          <el-button type="primary" size="small" @click="openManualFlow">手动登记盘活</el-button>
          <el-button size="small" @click="exportFlows">导出流水</el-button>
        </div>

        <el-table :data="filteredFlows" size="small" style="width:100%" max-height="480">
          <el-table-column prop="time" label="发生时间" width="150" />
          <el-table-column prop="sourceType" label="来源类型" width="110">
            <template #default="{ row }">
              <el-tag size="small" :type="sourceTagType(row.sourceType)" effect="plain">{{ row.sourceType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="docNo" label="关联单据" width="140" show-overflow-tooltip />
          <el-table-column prop="company" label="所属公司" width="110" />
          <el-table-column prop="assetName" label="资产/事项" min-width="160" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额(万元)" width="120">
            <template #default="{ row }">{{ row.amount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="count" label="宗数" width="70" />
          <el-table-column label="归集方式" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.auto ? 'success' : 'info'" effect="plain">{{ row.auto ? '自动归集' : '手动登记' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" size="small" :disabled="row.auto" @click="deleteFlow(row)">剔除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="flowDrawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 手动登记盘活 -->
    <el-dialog v-model="manualFlowVisible" title="手动登记盘活" width="520px">
      <el-form :model="flowForm" label-width="100px">
        <el-form-item label="来源类型" required>
          <el-select v-model="flowForm.sourceType" style="width:100%">
            <el-option v-for="s in sourceTypes" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司" required>
          <el-select v-model="flowForm.company" style="width:100%">
            <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联单据">
          <el-input v-model="flowForm.docNo" placeholder="如：CZ2026-008 / ZL2026-012" />
        </el-form-item>
        <el-form-item label="资产/事项" required>
          <el-input v-model="flowForm.assetName" placeholder="如：漳港街道闲置厂房盘活出租" />
        </el-form-item>
        <el-form-item label="盘活金额" required>
          <el-input-number v-model="flowForm.amount" :min="0.01" :precision="2" :step="10" /> 万元
        </el-form-item>
        <el-form-item label="盘活宗数">
          <el-input-number v-model="flowForm.count" :min="0" :max="999" /> 宗
        </el-form-item>
        <el-form-item label="发生日期" required>
          <el-date-picker v-model="flowForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="flowForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualFlowVisible = false">取消</el-button>
        <el-button type="primary" @click="submitManualFlow">登记并计入进度</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, EditPen, Check } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useRevitalizeStore } from '../../store/revitalize'

const assetStore = useAssetStore()
const contractStore = useContractStore()
const revitalizeStore = useRevitalizeStore()

const companies = revitalizeStore.companies
const sourceTypes = ['租金收缴', '资产处置', '招租签约', '闲置盘活', '股权转让']

const currentYear = String(new Date().getFullYear())
const yearFilter = ref(currentYear)

// 目标与流水都是 store 状态：签约/收缴/处置写入的流水会实时反映到完成率上
const targets = computed(() => revitalizeStore.targets)
const flows = computed(() => revitalizeStore.flows)
const idleTotal = computed(() => revitalizeStore.idleTotal)

const yearOptions = computed(() => {
  const years = new Set(targets.value.map(t => String(t.year)))
  for (let y = Number(currentYear) - 1; y <= Number(currentYear) + 3; y++) years.add(String(y))
  return [...years].sort()
})

const filteredTargets = computed(() => targets.value.filter(t => t.year === yearFilter.value))
const yearTarget = computed(() => filteredTargets.value.find(t => t.allocations.some(a => a.ratio > 0)) || null)

const currentYearAmount = computed(() => filteredTargets.value.reduce((s, t) => s + t.amountTarget, 0))
const currentYearCount = computed(() => filteredTargets.value.reduce((s, t) => s + t.countTarget, 0))

const flowsOfYear = computed(() => flows.value.filter(f => f.year === yearFilter.value))
const completedAmount = computed(() => Math.round(flowsOfYear.value.reduce((s, f) => s + f.amount, 0) * 100) / 100)
const completedCount = computed(() => flowsOfYear.value.reduce((s, f) => s + f.count, 0))
const completionRate = computed(() => currentYearAmount.value ? Math.min(999, Math.round(completedAmount.value / currentYearAmount.value * 1000) / 10) : 0)
const allocatedCompanies = computed(() => yearTarget.value ? yearTarget.value.allocations.filter(a => a.ratio > 0).length : 0)

const monthKpi = computed(() => {
  const now = new Date()
  const sum = prefix => Math.round(flowsOfYear.value.filter(f => f.time.startsWith(prefix)).reduce((s, f) => s + f.amount, 0) * 100) / 100
  if (yearFilter.value === currentYear) {
    return { label: '本月新增盘活', value: sum(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`) }
  }
  const months = [...new Set(flowsOfYear.value.map(f => f.time.slice(0, 7)))].sort()
  const last = months[months.length - 1]
  return last ? { label: `${Number(last.slice(5, 7))}月新增盘活`, value: sum(last) } : { label: '本月新增盘活', value: 0 }
})

function doneOf(target) {
  const list = flows.value.filter(f => f.year === target.year)
  return {
    amount: Math.round(list.reduce((s, f) => s + f.amount, 0) * 100) / 100,
    count: list.reduce((s, f) => s + f.count, 0)
  }
}

function doneOfCompany(year, company) {
  const list = flows.value.filter(f => f.year === year && f.company === company)
  return {
    amount: Math.round(list.reduce((s, f) => s + f.amount, 0) * 100) / 100,
    count: list.reduce((s, f) => s + f.count, 0)
  }
}

// 闲置底数直接取资产台账的闲置/空置，不是手工填报
function idleOf(company) {
  return revitalizeStore.idleBase[company]?.count || 0
}

function idleAreaOf(company) {
  return (revitalizeStore.idleBase[company]?.area || 0).toLocaleString()
}

function targetRate(target) {
  if (!target.amountTarget) return 0
  return Math.min(100, Math.round(doneOf(target).amount / target.amountTarget * 1000) / 10)
}

function allocatedRatio(target) {
  return target.allocations.reduce((s, a) => s + (a.ratio || 0), 0)
}

// 最大余额法：保证各公司分摊宗数之和恰等于按比例折算的总宗数，避免四舍五入溢出
function distributeCount(total, ratios) {
  const sum = ratios.reduce((a, b) => a + b, 0)
  if (!sum || !total) return ratios.map(() => 0)
  const raw = ratios.map(r => total * r / sum)
  const base = raw.map(Math.floor)
  let remain = total - base.reduce((a, b) => a + b, 0)
  raw.map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(o => { if (remain-- > 0) base[o.i]++ })
  return base
}

function companyRows(target) {
  const list = target.allocations.filter(a => a.ratio > 0)
  const counts = distributeCount(Math.round(target.countTarget * allocatedRatio(target) / 100), list.map(a => a.ratio))
  return list.map((a, idx) => {
    const done = doneOfCompany(target.year, a.company)
    const amount = Math.round(target.amountTarget * a.ratio / 100)
    return {
      company: a.company,
      ratio: a.ratio,
      amount,
      count: counts[idx],
      doneAmount: done.amount,
      doneCount: done.count,
      rate: amount ? Math.min(100, Math.round(done.amount / amount * 1000) / 10) : 0
    }
  }).sort((x, y) => y.rate - x.rate)
}

const rankRows = computed(() => (yearTarget.value ? companyRows(yearTarget.value) : []))

function statusType(status) {
  return { 已达标: 'success', 已完成: 'success', 进行中: 'warning', 未达标: 'danger', 已下达: 'primary', 未下达: 'info' }[status] || 'info'
}

function sourceTagType(source) {
  return { 租金收缴: 'success', 资产处置: 'danger', 招租签约: 'primary', 闲置盘活: 'warning', 股权转让: 'info' }[source] || 'info'
}

const saveTargetVisible = ref(false)
const saveFormRef = ref(null)
const saveForm = reactive({ name: '', period: null, assetAmount: 0, fundAmount: 0 })
const saveRules = {
  name: [{ required: true, message: '请输入目标名', trigger: 'blur' }],
  period: [{ required: true, message: '请选择目标期限', trigger: 'change' }],
  assetAmount: [{ required: true, message: '请输入资产盘活目标额', trigger: 'blur' }],
  fundAmount: [{ required: true, message: '请输入回收资金目标数', trigger: 'blur' }]
}
const saveRows = ref([])

const saveAssetPctTotal = computed(() => saveRows.value.reduce((s, r) => s + (r.assetPct || 0), 0))
const saveFundPctTotal = computed(() => saveRows.value.reduce((s, r) => s + (r.fundPct || 0), 0))

function openSaveTarget() {
  const t = targets.value.find(x => String(x.year) === yearFilter.value)
  Object.assign(saveForm, {
    name: t ? t.name : `${yearFilter.value}年度长乐区国有资产盘活目标`,
    period: [`${yearFilter.value}-01-01`, `${yearFilter.value}-12-31`],
    // 表单按元录入，目标口径为万元，打开时换算回元
    assetAmount: t ? Math.round((t.amountTarget || 0) * 10000) : 500000000,
    fundAmount: t ? Math.round((t.fundAmount || 30000) * 10000) : 300000000
  })
  saveRows.value = companies.map(c => {
    const a = t?.allocations.find(x => x.company === c)
    return { company: c, assetPct: a?.ratio || 0, fundPct: a?.fundRatio ?? (a?.ratio || 0) }
  })
  saveTargetVisible.value = true
}

function submitSaveTarget() {
  if (!saveFormRef.value) return
  saveFormRef.value.validate(valid => {
    if (!valid) {
      ElMessage.warning('请完善必填项后再保存')
      return
    }
    if (saveAssetPctTotal.value > 100 || saveFundPctTotal.value > 100) {
      ElMessage.error('按公司分解比例合计不能超过 100%')
      return
    }
    const target = targets.value.find(t => String(t.year) === yearFilter.value)
    if (!target) {
      ElMessage.warning(`${yearFilter.value} 年度目标不存在，请先「新建年度目标」`)
      return
    }
    revitalizeStore.updateTarget(target.year, {
      name: saveForm.name.trim(),
      amountTarget: Math.round(saveForm.assetAmount / 10000),
      fundAmount: Math.round(saveForm.fundAmount / 10000),
      allocations: saveRows.value.map(r => ({ company: r.company, ratio: r.assetPct || 0, fundRatio: r.fundPct || 0 }))
    })
    saveTargetVisible.value = false
    ElMessage.success(`目标"${saveForm.name}"已保存，分解至 ${saveRows.value.filter(r => r.assetPct > 0).length} 家公司`)
  })
}

// ===== 新建 / 调整目标 =====
const targetDialogVisible = ref(false)
const targetForm = reactive({ id: '', year: '', name: '', amountTarget: null, countTarget: null, remark: '' })

function handleCreateTarget() {
  const used = new Set(targets.value.map(t => String(t.year)))
  const year = yearOptions.value.find(y => !used.has(y)) || String(Number(currentYear) + 1)
  Object.assign(targetForm, { id: '', year, name: `${year}年度长乐区国有资产盘活目标`, amountTarget: null, countTarget: null, remark: '' })
  targetDialogVisible.value = true
}

function handleEditTarget(row) {
  Object.assign(targetForm, { id: row.id, year: row.year, name: row.name, amountTarget: row.amountTarget, countTarget: row.countTarget, remark: row.remark || '' })
  targetDialogVisible.value = true
}

function submitTarget() {
  if (!targetForm.name.trim()) {
    ElMessage.warning('请填写目标名称')
    return
  }
  if (!targetForm.amountTarget || !targetForm.countTarget) {
    ElMessage.warning('请填写盘活金额目标与宗数目标')
    return
  }
  if (targetForm.id) {
    const target = targets.value.find(t => t.id === targetForm.id)
    if (!target) return
    const amountChanged = target.amountTarget !== targetForm.amountTarget || target.countTarget !== targetForm.countTarget
    const allocated = target.allocations.some(a => a.ratio > 0)
    revitalizeStore.updateTarget(target.year, {
      name: targetForm.name.trim(),
      amountTarget: targetForm.amountTarget,
      countTarget: targetForm.countTarget,
      remark: targetForm.remark
    })
    ElMessage.success(amountChanged && allocated ? '目标已调整，各公司分摊金额与宗数已按比例重算' : '目标已保存')
  } else {
    if (targets.value.some(t => String(t.year) === String(targetForm.year))) {
      ElMessage.warning(`${targetForm.year} 年度目标已存在，请直接调整`)
      return
    }
    revitalizeStore.addTarget({
      year: targetForm.year,
      name: targetForm.name.trim(),
      amountTarget: targetForm.amountTarget,
      countTarget: targetForm.countTarget,
      remark: targetForm.remark
    })
    yearFilter.value = targetForm.year
    ElMessage.success(`${targetForm.year} 年度盘活目标已创建，请设置分摊方案后下达`)
  }
  targetDialogVisible.value = false
}

function handleDeleteTarget(row) {
  const count = flows.value.filter(f => String(f.year) === String(row.year)).length
  ElMessageBox.confirm(
    count ? `该年度已归集 ${count} 条盘活流水，删除目标后流水将保留但不再关联考核。确认删除？` : `确认删除"${row.name}"？`,
    '删除确认',
    { type: 'warning' }
  ).then(() => {
    revitalizeStore.removeTarget(row.id)
    ElMessage.success('目标已删除')
  }).catch(() => {})
}

// ===== 分摊下达 =====
const allocateDialogVisible = ref(false)
const allocateTarget = ref(null)
const allocateRows = ref([])

const allocateTotalRatio = computed(() => allocateRows.value.reduce((s, r) => s + (r.ratio || 0), 0))
const allocateTotalAmount = computed(() =>
  allocateRows.value.reduce((s, r) => s + Math.round((allocateTarget.value?.amountTarget || 0) * (r.ratio || 0) / 100), 0)
)
const allocateCounts = computed(() => distributeCount(
  Math.round((allocateTarget.value?.countTarget || 0) * allocateTotalRatio.value / 100),
  allocateRows.value.map(r => r.ratio || 0)
))

function openAllocate(row) {
  if (revitalizeStore.statusOf(row.year) === '已达标') {
    ElMessage.warning('该年度目标已达标归档，不可再调整分摊')
    return
  }
  allocateTarget.value = row
  allocateRows.value = companies.map(c => {
    const exist = row.allocations.find(a => a.company === c)
    return { company: c, ratio: exist ? exist.ratio : 0 }
  })
  allocateDialogVisible.value = true
}

function averageAllocate() {
  const base = Math.floor(100 / companies.length)
  allocateRows.value.forEach((r, i) => { r.ratio = i === 0 ? 100 - base * (companies.length - 1) : base })
  ElMessage.success('已按公司数量平均分摊')
}

// 按台账识别出的闲置底数建议比例，确认后由 issueTarget 落库
function idleAllocate() {
  const year = allocateTarget.value?.year
  if (!year) return
  const suggested = revitalizeStore.suggestAllocation(year)
  if (!suggested.length) {
    ElMessage.warning('暂无闲置底数，无法按闲置情况分摊')
    return
  }
  allocateRows.value = companies.map(c => ({
    company: c,
    ratio: suggested.find(s => s.company === c)?.ratio || 0
  }))
  ElMessage.success(`已按闲置底数建议分摊（全区闲置 ${idleTotal.value.count} 宗 / ${idleTotal.value.area.toLocaleString()} ㎡）`)
}

function submitAllocate() {
  const total = allocateTotalRatio.value
  if (total <= 0) {
    ElMessage.warning('请至少为一家公司设置分摊比例')
    return
  }
  if (total > 100) {
    ElMessage.error(`分摊比例合计 ${total}%，超过 100%，请调整后重新下达`)
    return
  }
  const doIssue = () => {
    revitalizeStore.issueTarget(allocateTarget.value.year, allocateRows.value)
    allocateDialogVisible.value = false
    ElMessage.success(`目标已下达：${allocateRows.value.filter(r => r.ratio > 0).length} 家公司分摊 ${total}%，后续签约、收缴与处置金额将自动计入进度`)
  }
  if (total < 100) {
    const remain = allocateTarget.value.amountTarget - allocateTotalAmount.value
    ElMessageBox.confirm(`尚有 ${remain.toLocaleString()} 万元（${100 - total}%）未分摊到公司，确认下达？`, '分摊未足额', { type: 'warning' })
      .then(doIssue)
      .catch(() => {})
    return
  }
  doIssue()
}

// ===== 盘活流水 =====
const flowDrawerVisible = ref(false)
const flowTarget = ref(null)
const flowSourceFilter = ref('')

const filteredFlows = computed(() =>
  flows.value
    .filter(f => f.year === (flowTarget.value?.year || yearFilter.value))
    .filter(f => !flowSourceFilter.value || f.sourceType === flowSourceFilter.value)
    .slice()
    .sort((a, b) => b.time.localeCompare(a.time))
)

function openFlows(row) {
  flowTarget.value = row
  flowSourceFilter.value = ''
  flowDrawerVisible.value = true
}

function syncBusinessData() {
  const year = flowTarget.value.year
  let added = 0
  let skipped = 0
  contractStore.contracts.forEach(c => {
    const fee = contractStore.feeRecords.find(f => f.contractId === c.id)
    if (!fee || fee.yearActual <= 0) return
    const asset = assetStore.getAssetById(c.assetId)
    const docNo = `${c.id}-${year}`
    const now = new Date()
    const flow = revitalizeStore.recordRevitalize({
      year,
      time: `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toTimeString().slice(0, 5)}`,
      sourceType: '租金收缴',
      docNo,
      company: asset ? asset.group : '城投集团',
      assetId: c.assetId,
      assetName: `${c.assetName} 本年实收租金`,
      amount: fee.yearActual,
      count: 0,
      auto: true,
      remark: '由应收实收台账自动归集'
    })
    if (flow) added++
    else skipped++
  })
  if (added) {
    ElMessage.success(`同步完成：新增 ${added} 条自动归集流水${skipped ? `，${skipped} 条已存在跳过` : ''}`)
  } else {
    ElMessage.info(`没有新的业务数据需要归集${skipped ? `（${skipped} 条已存在）` : ''}`)
  }
}

const manualFlowVisible = ref(false)
const flowForm = reactive({ sourceType: '闲置盘活', company: '城投集团', docNo: '', assetName: '', amount: 100, count: 1, date: '', remark: '' })

function openManualFlow() {
  Object.assign(flowForm, {
    sourceType: '闲置盘活',
    company: flowTarget.value ? flowTarget.value.allocations.find(a => a.ratio > 0)?.company || companies[0] : companies[0],
    docNo: '',
    assetName: '',
    amount: 100,
    count: 1,
    date: new Date().toISOString().slice(0, 10),
    remark: ''
  })
  manualFlowVisible.value = true
}

function submitManualFlow() {
  if (!flowForm.assetName.trim()) {
    ElMessage.warning('请填写资产/事项')
    return
  }
  if (!flowForm.amount || flowForm.amount <= 0) {
    ElMessage.warning('盘活金额必须大于 0')
    return
  }
  if (!flowForm.date) {
    ElMessage.warning('请选择发生日期')
    return
  }
  if (flowForm.date.slice(0, 4) !== flowTarget.value.year) {
    ElMessage.warning(`发生日期需在 ${flowTarget.value.year} 年度内，否则不计入本目标`)
    return
  }
  const docNo = flowForm.docNo.trim() || `SD-${Date.now().toString().slice(-6)}`
  const flow = revitalizeStore.recordRevitalize({
    year: flowForm.date.slice(0, 4),
    time: `${flowForm.date} ${new Date().toTimeString().slice(0, 5)}`,
    sourceType: flowForm.sourceType,
    docNo,
    company: flowForm.company,
    assetName: flowForm.assetName.trim(),
    amount: flowForm.amount,
    count: flowForm.count,
    auto: false,
    remark: flowForm.remark
  })
  if (!flow) {
    ElMessage.warning(`单据 ${docNo} 的${flowForm.sourceType}流水已存在，未重复计入`)
    return
  }
  manualFlowVisible.value = false
  ElMessage.success(`已登记盘活 ${flowForm.amount.toLocaleString()} 万元，${flowForm.company} 完成进度已更新`)
}

function deleteFlow(row) {
  ElMessageBox.confirm(`确认剔除该条盘活流水（${row.amount.toLocaleString()} 万元）？剔除后对应公司完成进度将同步回退。`, '剔除确认', { type: 'warning' })
    .then(() => {
      revitalizeStore.removeFlow(row.id)
      ElMessage.success('流水已剔除')
    })
    .catch(() => {})
}

function downloadCsv(filename, header, rows) {
  const content = '\ufeff' + header.join(',') + '\n' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportFlows() {
  const list = filteredFlows.value
  downloadCsv(
    `盘活流水_${flowTarget.value.year}.csv`,
    ['发生时间', '来源类型', '关联单据', '所属公司', '资产/事项', '金额(万元)', '宗数', '归集方式', '说明'],
    list.map(f => [f.time, f.sourceType, f.docNo, f.company, f.assetName, f.amount, f.count, f.auto ? '自动归集' : '手动登记', f.remark])
  )
  ElMessage.success(`已导出 ${list.length} 条盘活流水`)
}

function exportRank() {
  if (!rankRows.value.length) {
    ElMessage.warning(`${yearFilter.value} 年度目标尚未分摊到公司，暂无排行数据`)
    return
  }
  downloadCsv(
    `盘活完成排行_${yearFilter.value}.csv`,
    ['排名', '公司', '分摊比例(%)', '分摊金额(万元)', '分摊宗数', '已完成金额(万元)', '已完成宗数', '完成率(%)'],
    rankRows.value.map((c, i) => [i + 1, c.company, c.ratio, c.amount, c.count, c.doneAmount, c.doneCount, c.rate])
  )
  ElMessage.success('公司盘活完成排行榜已导出')
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.header-ops {
  display: flex;
  gap: 12px;
  align-items: center;
}

.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 12px 16px;
}

.kpi-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--t-main);
}

.unit {
  font-size: 12px;
  font-weight: normal;
  color: var(--t-weak);
  margin-left: 4px;
}

.progress-text {
  font-size: 12px;
  color: var(--t-weak);
}

.text-danger {
  color: var(--c-danger);
  font-weight: 600;
}

.expand-wrap {
  padding: 8px 24px 16px;
}

.expand-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--t-sub);
  margin-bottom: 8px;
}

.allocate-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 13px;
  color: var(--t-sub);
}

.flow-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rank-item {
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 12px 16px;
}

.rank-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.rank-no {
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  background: var(--t-weak);
  color: #fff;
  font-size: 12px;
}

.rank-1 {
  background: #f5a623;
}

.rank-2 {
  background: #a0a6b0;
}

.rank-3 {
  background: #cd7f32;
}

.rank-name {
  font-weight: 600;
  color: var(--t-main);
  flex: 1;
}

.rank-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--t-weak);
}

.decompose-summary {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.save-float-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: 12px 4px 4px;
  margin-top: 8px;
  background: linear-gradient(180deg, transparent, var(--bg-card) 40%);
  z-index: 5;
}

.save-float-btn {
  min-width: 120px;
  box-shadow: 0 4px 14px rgba(24, 144, 255, 0.4);
}
</style>
