<template>
  <div class="page-container">
    <div class="page-header">
      <h2>业财一体化</h2>
      <el-button type="primary" @click="handleSync">同步财务数据</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#1890ff">{{ stats.revenue }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">年度确认收入</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#52c41a">{{ stats.received }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">已到账金额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#fa8c16">{{ stats.expense }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">年度费用支出</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#722ed1">{{ stats.reconciled }}<span class="kpi-unit">%</span></div>
          <div class="kpi-label">业财对账率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="收入确认" name="revenue">
        <el-table :data="revenueRecords" border stripe>
          <el-table-column prop="contractId" label="合同编号" width="130" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="revenueType" label="收入类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.revenueType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="period" label="归属期间" width="160" />
          <el-table-column prop="amount" label="金额(万元)" width="110" align="right" />
          <el-table-column label="财务凭证" width="140">
            <template #default="{ row }">
              <span v-if="row.voucherNo" style="color:#52c41a">{{ row.voucherNo }}</span>
              <span v-else style="color:#999">未生成</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.voucherNo ? 'success' : 'warning'" size="small">{{ row.voucherNo ? '已入账' : '待入账' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button v-if="!row.voucherNo" type="primary" link size="small" @click="generateVoucher(row)">生成凭证</el-button>
              <el-button type="primary" link size="small" @click="viewRevenueDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="费用归集" name="expense">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:600;font-size:14px">费用明细</span>
          <el-button type="primary" size="small" @click="showExpenseDialog = true">登记费用</el-button>
        </div>

        <el-table :data="expenseRecords" border stripe show-summary :summary-method="getExpenseSummaries">
          <el-table-column prop="expenseNo" label="费用编号" width="130" />
          <el-table-column prop="assetName" label="关联资产" min-width="160" />
          <el-table-column prop="expenseType" label="费用类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.expenseType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额(万元)" width="110" align="right" />
          <el-table-column prop="occurDate" label="发生日期" width="120" />
          <el-table-column prop="supplier" label="供应商/服务商" min-width="160" />
          <el-table-column label="入账状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.expenseVoucher ? 'success' : 'info'" size="small">{{ row.expenseVoucher ? '已入账' : '待入账' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button v-if="!row.expenseVoucher" type="primary" link size="small" @click="postExpense(row)">入账</el-button>
              <el-button type="primary" link size="small" @click="viewExpense(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="业财对账" name="reconcile">
        <el-card shadow="never" style="margin-bottom:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>对账结果</span>
              <el-button type="primary" size="small" @click="runReconcile">执行对账</el-button>
            </div>
          </template>
          <el-table :data="reconcileResults" border stripe>
            <el-table-column prop="period" label="对账期间" width="160" />
            <el-table-column prop="bizAmount" label="业务金额(万元)" width="130" align="right" />
            <el-table-column prop="finAmount" label="财务金额(万元)" width="130" align="right" />
            <el-table-column prop="diff" label="差异(万元)" width="110" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.diff !== 0 ? '#f5222d' : '#52c41a' }">{{ row.diff }}</span>
              </template>
            </el-table-column>
            <el-table-column label="对账结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.diff === 0 ? 'success' : 'danger'" size="small">{{ row.diff === 0 ? '一致' : '有差异' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="差异说明" min-width="200" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button v-if="row.diff !== 0" type="warning" link size="small" @click="handleAdjust(row)">调整</el-button>
                <el-button type="primary" link size="small" @click="viewReconcile(row)">明细</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="数据映射" name="mapping">
        <el-card shadow="never" style="margin-bottom:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>业务-财务科目映射</span>
              <el-button type="primary" size="small" @click="showMappingDialog = true">新增映射</el-button>
            </div>
          </template>
          <el-table :data="mappings" border stripe>
            <el-table-column prop="bizType" label="业务类型" width="140" />
            <el-table-column prop="bizField" label="业务字段" width="160" />
            <el-table-column prop="accountCode" label="财务科目编码" width="140" />
            <el-table-column prop="accountName" label="财务科目名称" min-width="180" />
            <el-table-column prop="direction" label="方向" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.direction === '借' ? '' : 'success'" size="small">{{ row.direction }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="editMapping(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="deleteMapping(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 费用登记 -->
    <el-dialog v-model="showExpenseDialog" title="登记费用" width="550px">
      <el-form :model="expenseForm" label-width="100px">
        <el-form-item label="关联资产">
          <el-select v-model="expenseForm.assetName" style="width:100%" filterable placeholder="选择关联资产">
            <el-option label="城关商铺A-01" value="城关商铺A-01" />
            <el-option label="航城厂房1#" value="航城厂房1#" />
            <el-option label="漳港办公楼2层" value="漳港办公楼2层" />
            <el-option label="营前仓库B-03" value="营前仓库B-03" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型" required>
          <el-select v-model="expenseForm.expenseType" style="width:100%">
            <el-option label="维修费" value="维修费" />
            <el-option label="水电费" value="水电费" />
            <el-option label="物业费" value="物业费" />
            <el-option label="保险费" value="保险费" />
            <el-option label="税费" value="税费" />
            <el-option label="折旧费" value="折旧费" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(万元)" required>
          <el-input-number v-model="expenseForm.amount" :min="0" :step="0.5" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="发生日期" required>
          <el-date-picker v-model="expenseForm.occurDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="expenseForm.supplier" placeholder="供应商/服务商名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="expenseForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateExpense">确认登记</el-button>
      </template>
    </el-dialog>

    <!-- 新增映射 -->
    <el-dialog v-model="showMappingDialog" title="新增数据映射" width="550px">
      <el-form :model="mappingForm" label-width="120px">
        <el-form-item label="业务类型" required>
          <el-select v-model="mappingForm.bizType" style="width:100%">
            <el-option label="租金收入" value="租金收入" />
            <el-option label="保证金收取" value="保证金收取" />
            <el-option label="维修费用" value="维修费用" />
            <el-option label="水电费用" value="水电费用" />
            <el-option label="折旧费用" value="折旧费用" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务字段" required>
          <el-input v-model="mappingForm.bizField" placeholder="如：annualRent" />
        </el-form-item>
        <el-form-item label="科目编码" required>
          <el-input v-model="mappingForm.accountCode" placeholder="如：6001" />
        </el-form-item>
        <el-form-item label="科目名称" required>
          <el-input v-model="mappingForm.accountName" placeholder="如：主营业务收入-租金" />
        </el-form-item>
        <el-form-item label="方向" required>
          <el-select v-model="mappingForm.direction" style="width:100%">
            <el-option label="借" value="借" />
            <el-option label="贷" value="贷" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMappingDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateMapping">保存映射</el-button>
      </template>
    </el-dialog>

    <!-- 对账明细 -->
    <el-drawer v-model="showReconcileDrawer" title="对账明细" size="600px">
      <template v-if="currentReconcile">
        <el-descriptions :column="2" border style="margin-bottom:16px">
          <el-descriptions-item label="对账期间">{{ currentReconcile.period }}</el-descriptions-item>
          <el-descriptions-item label="差异金额">
            <span :style="{ color: currentReconcile.diff !== 0 ? '#f5222d' : '#52c41a' }">{{ currentReconcile.diff }} 万元</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-table :data="reconcileDetails" border size="small">
          <el-table-column prop="item" label="项目" min-width="160" />
          <el-table-column prop="bizAmount" label="业务金额" width="120" align="right" />
          <el-table-column prop="finAmount" label="财务金额" width="120" align="right" />
          <el-table-column prop="diff" label="差异" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.diff !== 0 ? '#f5222d' : '#52c41a' }">{{ row.diff }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- 收入明细对话框 -->
    <el-dialog v-model="revenueDetailVisible" title="收入明细" width="550px">
      <el-descriptions :column="2" border v-if="currentRevenue">
        <el-descriptions-item label="合同编号">{{ currentRevenue.contractId }}</el-descriptions-item>
        <el-descriptions-item label="收入类型">{{ currentRevenue.revenueType }}</el-descriptions-item>
        <el-descriptions-item label="承租方" :span="2">{{ currentRevenue.tenant }}</el-descriptions-item>
        <el-descriptions-item label="期间" :span="2">{{ currentRevenue.period }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentRevenue.amount }} 万元</el-descriptions-item>
        <el-descriptions-item label="凭证号">{{ currentRevenue.voucherNo || '未生成' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="revenueDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 费用明细对话框 -->
    <el-dialog v-model="expenseDetailVisible" title="费用明细" width="550px">
      <el-descriptions :column="2" border v-if="currentExpense">
        <el-descriptions-item label="费用编号">{{ currentExpense.expenseNo }}</el-descriptions-item>
        <el-descriptions-item label="费用类型">{{ currentExpense.expenseType }}</el-descriptions-item>
        <el-descriptions-item label="关联资产" :span="2">{{ currentExpense.assetName }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ currentExpense.amount }} 万元</el-descriptions-item>
        <el-descriptions-item label="发生日期">{{ currentExpense.occurDate }}</el-descriptions-item>
        <el-descriptions-item label="供应商" :span="2">{{ currentExpense.supplier }}</el-descriptions-item>
        <el-descriptions-item label="凭证号">{{ currentExpense.expenseVoucher || '未入账' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="expenseDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('revenue')

const stats = computed(() => ({
  revenue: 2580,
  received: 2350,
  expense: 386,
  reconciled: 96.5
}))

// 收入确认
const revenueRecords = ref([
  { contractId: 'HT-2026-001', tenant: '福州长乐融辉贸易有限公司', revenueType: '租金收入', period: '2026-01 至 2026-06', amount: 21, voucherNo: 'PZ-2026-06-001' },
  { contractId: 'HT-2026-002', tenant: '福建省长乐市鸿运纺织有限公司', revenueType: '租金收入', period: '2026-01 至 2026-06', amount: 35, voucherNo: 'PZ-2026-06-002' },
  { contractId: 'HT-2026-003', tenant: '长乐区鑫源投资有限公司', revenueType: '租金收入', period: '2026-07 至 2026-12', amount: 12, voucherNo: '' },
  { contractId: 'HT-2026-004', tenant: '福州航城物流有限公司', revenueType: '租金收入', period: '2026-07 至 2026-12', amount: 8, voucherNo: '' },
  { contractId: 'HT-2026-001', tenant: '福州长乐融辉贸易有限公司', revenueType: '保证金', period: '2026-01', amount: 5, voucherNo: 'PZ-2026-01-015' },
])

function generateVoucher(row) {
  ElMessageBox.confirm(`确认为 ${row.tenant} 的 ${row.revenueType} ${row.amount} 万元生成财务凭证？`, '生成凭证', { type: 'info' }).then(() => {
    row.voucherNo = `PZ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`
    ElMessage.success('财务凭证已生成')
  }).catch(() => {})
}

const revenueDetailVisible = ref(false)
const currentRevenue = ref(null)

function viewRevenueDetail(row) {
  currentRevenue.value = row
  revenueDetailVisible.value = true
}

// 费用归集
const expenseRecords = ref([
  { expenseNo: 'FY-2026-001', assetName: '城关商铺A-01', expenseType: '维修费', amount: 2.5, occurDate: '2026-08-10', supplier: '长乐区建安装修工程队', expenseVoucher: 'PZ-2026-08-050' },
  { expenseNo: 'FY-2026-002', assetName: '航城厂房1#', expenseType: '水电费', amount: 1.8, occurDate: '2026-08-15', supplier: '国网福建省长乐区供电公司', expenseVoucher: '' },
  { expenseNo: 'FY-2026-003', assetName: '漳港办公楼2层', expenseType: '物业费', amount: 0.6, occurDate: '2026-08-20', supplier: '长乐航城物业管理有限公司', expenseVoucher: '' },
  { expenseNo: 'FY-2026-004', assetName: '营前仓库B-03', expenseType: '保险费', amount: 0.35, occurDate: '2026-07-01', supplier: '中国人民财产保险长乐支公司', expenseVoucher: 'PZ-2026-07-012' },
  { expenseNo: 'FY-2026-005', assetName: '城关旧厂房3#', expenseType: '折旧费', amount: 12, occurDate: '2026-08-31', supplier: '-', expenseVoucher: '' },
])

const showExpenseDialog = ref(false)
const expenseForm = ref({
  assetName: '',
  expenseType: '维修费',
  amount: 0,
  occurDate: '',
  supplier: '',
  remark: ''
})

function handleCreateExpense() {
  if (!expenseForm.value.expenseType || !expenseForm.value.amount || !expenseForm.value.occurDate) {
    ElMessage.warning('请填写完整费用信息')
    return
  }
  expenseRecords.value.unshift({
    expenseNo: `FY-${new Date().getFullYear()}-${String(expenseRecords.value.length + 1).padStart(3, '0')}`,
    assetName: expenseForm.value.assetName || '未关联',
    expenseType: expenseForm.value.expenseType,
    amount: expenseForm.value.amount,
    occurDate: expenseForm.value.occurDate,
    supplier: expenseForm.value.supplier || '-',
    expenseVoucher: ''
  })
  showExpenseDialog.value = false
  expenseForm.value = { assetName: '', expenseType: '维修费', amount: 0, occurDate: '', supplier: '', remark: '' }
  ElMessage.success('费用登记成功')
}

function getExpenseSummaries({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (col.property === 'amount') {
      return data.reduce((s, r) => s + (r.amount || 0), 0)
    }
    return ''
  })
}

function postExpense(row) {
  ElMessageBox.confirm(`确认将费用"${row.expenseNo}"入账？`, '入账确认', { type: 'info' }).then(() => {
    row.expenseVoucher = `PZ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`
    ElMessage.success('费用已入账')
  }).catch(() => {})
}

const expenseDetailVisible = ref(false)
const currentExpense = ref(null)

function viewExpense(row) {
  currentExpense.value = row
  expenseDetailVisible.value = true
}

// 业财对账
const reconcileResults = ref([
  { period: '2026年1月', bizAmount: 180, finAmount: 180, diff: 0, remark: '' },
  { period: '2026年2月', bizAmount: 185, finAmount: 185, diff: 0, remark: '' },
  { period: '2026年3月', bizAmount: 192, finAmount: 190, diff: 2, remark: '折旧计提时间差异' },
  { period: '2026年4月', bizAmount: 188, finAmount: 188, diff: 0, remark: '' },
  { period: '2026年5月', bizAmount: 195, finAmount: 195, diff: 0, remark: '' },
  { period: '2026年6月', bizAmount: 210, finAmount: 208.5, diff: 1.5, remark: '水电费分摊差异' },
])

const showReconcileDrawer = ref(false)
const currentReconcile = ref(null)

const reconcileDetails = ref([
  { item: '租金收入', bizAmount: 165, finAmount: 165, diff: 0 },
  { item: '保证金收入', bizAmount: 15, finAmount: 15, diff: 0 },
  { item: '维修费用', bizAmount: -8, finAmount: -8, diff: 0 },
  { item: '折旧费用', bizAmount: -12, finAmount: -13.5, diff: 1.5 },
])

function runReconcile() {
  ElMessageBox.confirm('确认执行本期业财对账？', '执行对账', { type: 'info' }).then(() => {
    reconcileResults.value.forEach(r => {
      const variance = +(Math.random() * 3).toFixed(1)
      if (Math.random() > 0.5) {
        r.finAmount = r.bizAmount - variance
        r.diff = +variance.toFixed(1)
        r.remark = r.remark || '本期新发现差异'
      }
    })
    const diffCount = reconcileResults.value.filter(r => r.diff !== 0).length
    ElMessage.success(`对账完成，发现 ${diffCount} 处差异`)
  }).catch(() => {})
}

function handleAdjust(row) {
  ElMessageBox.confirm(`确认对"${row.period}"的差异 ${row.diff} 万元进行调账？`, '调整确认', { type: 'warning' }).then(() => {
    row.diff = 0
    row.remark = '已调整'
    ElMessage.success('差异已调整')
  }).catch(() => {})
}

function viewReconcile(row) {
  currentReconcile.value = row
  showReconcileDrawer.value = true
}

// 数据映射
const mappings = ref([
  { bizType: '租金收入', bizField: 'annualRent', accountCode: '6001', accountName: '主营业务收入-租金', direction: '贷' },
  { bizType: '保证金收取', bizField: 'deposit', accountCode: '2241', accountName: '其他应付款-保证金', direction: '贷' },
  { bizType: '维修费用', bizField: 'repairCost', accountCode: '6602', accountName: '管理费用-维修费', direction: '借' },
  { bizType: '水电费用', bizField: 'utilityCost', accountCode: '6602', accountName: '管理费用-水电费', direction: '借' },
  { bizType: '折旧费用', bizField: 'depreciation', accountCode: '6602', accountName: '管理费用-折旧费', direction: '借' },
])

const showMappingDialog = ref(false)
const mappingForm = ref({
  bizType: '租金收入',
  bizField: '',
  accountCode: '',
  accountName: '',
  direction: '贷'
})

function handleCreateMapping() {
  if (!mappingForm.value.bizField || !mappingForm.value.accountCode || !mappingForm.value.accountName) {
    ElMessage.warning('请填写完整映射信息')
    return
  }
  mappings.value.push({ ...mappingForm.value })
  showMappingDialog.value = false
  mappingForm.value = { bizType: '租金收入', bizField: '', accountCode: '', accountName: '', direction: '贷' }
  ElMessage.success('映射关系已保存')
}

function editMapping(row) {
  mappingForm.value = { ...row }
  showMappingDialog.value = true
}

function deleteMapping(row) {
  ElMessageBox.confirm(`确认删除映射"${row.bizType} → ${row.accountName}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = mappings.value.findIndex(m => m.accountCode === row.accountCode && m.bizField === row.bizField)
    if (idx > -1) mappings.value.splice(idx, 1)
    ElMessage.success('映射已删除')
  }).catch(() => {})
}

function handleSync() {
  ElMessageBox.confirm('确认从财务系统同步最新数据？', '数据同步', { type: 'info' }).then(() => {
    let synced = 0
    revenueRecords.value.forEach(r => {
      if (!r.voucherNo) {
        r.voucherNo = `PZ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`
        synced++
      }
    })
    expenseRecords.value.forEach(r => {
      if (!r.expenseVoucher) {
        r.expenseVoucher = `PZ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`
        synced++
      }
    })
    ElMessage.success(`财务数据同步完成，已处理 ${synced} 条待入账记录`)
  }).catch(() => {})
}
</script>
