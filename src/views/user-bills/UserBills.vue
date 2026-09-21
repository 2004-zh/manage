<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户账单</h2>
      <div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增</el-button>
        <el-button @click="showCycle = true">缴费周期设置</el-button>
        <el-button type="primary" @click="handleGenerate">按周期生成账单</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-ring">
        <el-progress type="dashboard" :percentage="collectionRate" :width="110" :color="rateColor">
          <template #default="{ percentage }">
            <div class="rate-v">{{ percentage }}%</div>
            <div class="rate-l">收缴率</div>
          </template>
        </el-progress>
      </div>
      <div class="kpi-metrics">
        <div class="grid-4">
          <div class="kpi-box"><div class="kpi-v" style="color:#409eff">{{ bills.length }}</div><div class="kpi-l">账单总数</div></div>
          <div class="kpi-box"><div class="kpi-v" style="color:#67c23a">￥{{ totalReceived }}</div><div class="kpi-l">已收(元)</div></div>
          <div class="kpi-box"><div class="kpi-v" style="color:#e6a23c">￥{{ totalReceivable }}</div><div class="kpi-l">应收(元)</div></div>
          <div class="kpi-box"><div class="kpi-v" style="color:#f56c6c">{{ overdueCount }}</div><div class="kpi-l">逾期账单</div></div>
        </div>
        <div class="cycle-tip">
          当前缴费周期：<b>{{ cycle.cycleLabel }}</b> · 出账日 <b>每月{{ cycle.billDay }}日</b> · 缴费截止 <b>{{ cycle.dueDay }}日</b> ·
          计费项 <b>{{ cycle.feeTypes.join('、') }}</b>
        </div>
      </div>
    </div>

    <el-card class="filter-bar" shadow="never">
      <div class="grid-3 filter-row">
        <el-input v-model="filters.keyword" placeholder="账单编号/承租方" clearable prefix-icon="Search" class="full-width" />
        <el-select v-model="filters.company" placeholder="公司" clearable class="full-width">
          <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filters.feeType" placeholder="类型" clearable class="full-width">
          <el-option label="租金" value="租金" />
          <el-option label="物业费" value="物业费" />
          <el-option label="水电费" value="水电费" />
        </el-select>
        <el-select v-model="filters.status" placeholder="账单状态" clearable class="full-width">
          <el-option label="待缴费" value="待缴费" />
          <el-option label="已缴费" value="已缴费" />
          <el-option label="已逾期" value="已逾期" />
        </el-select>
        <el-date-picker
          v-model="filters.month"
          type="month"
          placeholder="选择月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          class="full-width"
        />
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="table-card fill" shadow="never">
      <el-table :data="pagedData" border stripe show-summary :summary="getSummary" row-key="id">
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div class="expand-wrap">
              <div class="section-title">账单信息</div>
              <div class="detail-grid">
                <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.assetName }}</div></div>
                <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createTime }}</div></div>
                <div class="cell"><div class="label">修改时间</div><div class="value">{{ row.updateTime }}</div></div>
              </div>
              <div class="section-title">资产信息</div>
              <el-table :data="profileOf(row).assets" border size="small">
                <el-table-column prop="region" label="省市区" min-width="150" />
                <el-table-column prop="project" label="项目" min-width="120" />
                <el-table-column prop="zone" label="分区" width="90" />
                <el-table-column prop="assetNo" label="资产编号" width="120" />
                <el-table-column prop="address" label="资产座落" min-width="170" />
                <el-table-column prop="company" label="所属公司" min-width="170" />
                <el-table-column prop="leaseType" label="租赁类型" width="100" align="center" />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="billNo" label="账单编号" width="140" />
        <el-table-column prop="tenant" label="承租方" width="170" show-overflow-tooltip />
        <el-table-column prop="billMonth" label="账单月份" width="100" align="center" />
        <el-table-column prop="feeType" label="费用类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.feeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receivable" label="应收金额(元)" width="115" align="right" />
        <el-table-column prop="received" label="实缴金额(元)" width="115" align="right" />
        <el-table-column prop="status" label="缴费状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleUrge(row)" :disabled="row.status !== '待缴费' && row.status !== '已逾期'">催缴</el-button>
            <el-button type="danger" link size="small" @click="handleStop(row)" :disabled="row.status === '已停用'">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 缴费周期设置 -->
    <el-dialog v-model="showCycle" title="缴费周期设置" width="520px">
      <el-form :model="cycle" label-width="110px">
        <el-form-item label="缴费周期">
          <el-radio-group v-model="cycle.cycleType">
            <el-radio label="monthly">按月</el-radio>
            <el-radio label="quarterly">按季</el-radio>
            <el-radio label="halfyear">按半年</el-radio>
            <el-radio label="yearly">按年</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出账日">
          <el-input-number v-model="cycle.billDay" :min="1" :max="28" style="width:160px" />
          <span class="unit">每月</span>
        </el-form-item>
        <el-form-item label="缴费截止日">
          <el-input-number v-model="cycle.dueDay" :min="1" :max="28" style="width:160px" />
          <span class="unit">每月</span>
        </el-form-item>
        <el-form-item label="计费项">
          <el-checkbox-group v-model="cycle.feeTypes">
            <el-checkbox label="租金" />
            <el-checkbox label="物业费" />
            <el-checkbox label="水电费" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCycle = false">取消</el-button>
        <el-button type="primary" @click="saveCycle">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAdd" title="新增账单" width="520px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="承租方">
          <el-select v-model="addForm.tenant" style="width: 100%" filterable @change="onAddTenantChange">
            <el-option v-for="s in leaseSources" :key="s.tenant" :label="s.tenant" :value="s.tenant" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="addForm.feeType" style="width: 100%" @change="onAddFeeTypeChange">
            <el-option label="租金" value="租金" />
            <el-option label="物业费" value="物业费" />
            <el-option label="水电费" value="水电费" />
          </el-select>
        </el-form-item>
        <el-form-item label="账单月份">
          <el-date-picker v-model="addForm.billMonth" type="month" format="YYYY-MM" value-format="YYYY-MM" style="width: 100%" />
        </el-form-item>
        <el-form-item label="应收金额(元)">
          <el-input-number v-model="addForm.receivable" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="payDetailVisible" title="缴费详情" size="620px">
      <template v-if="detailRow">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ detailProfile.tenantType }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ detailRow.tenant }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ detailProfile.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ detailProfile.phone }}</div></div>
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ detailRow.company }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value">{{ detailProfile.contractNo }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ detailProfile.signTime }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ detailProfile.contractType }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ detailProfile.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ detailProfile.leaseStart }} 至 {{ detailProfile.leaseEnd }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ detailProfile.dueDate }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value hl">￥{{ detailProfile.deposit }}</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag v-for="s in detailProfile.contractStatus" :key="s" size="small" style="margin-right: 4px">{{ s }}</el-tag>
            </div>
          </div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="detailProfile.assets" border size="small" style="margin-bottom: 12px">
          <el-table-column prop="region" label="省市区" min-width="140" />
          <el-table-column prop="project" label="项目" min-width="110" />
          <el-table-column prop="assetNo" label="资产编号" width="110" />
          <el-table-column prop="address" label="资产座落" min-width="150" />
          <el-table-column prop="leaseType" label="租赁类型" width="90" align="center" />
        </el-table>
        <div class="section-title">发票信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">是否开票</div><div class="value">{{ detailInvoice.invoiced }}</div></div>
          <div class="cell"><div class="label">发票号码</div><div class="value">{{ detailInvoice.invoiceNo }}</div></div>
          <div class="cell"><div class="label">发票类型</div><div class="value">{{ detailInvoice.invoiceType }}</div></div>
          <div class="cell"><div class="label">开票日期</div><div class="value">{{ detailInvoice.invoiceDate }}</div></div>
          <div class="cell"><div class="label">开票金额</div><div class="value hl">￥{{ detailInvoice.amount }}</div></div>
        </div>
        <div class="section-title">订单信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">订单编号</div><div class="value">{{ detailOrder.orderNo }}</div></div>
          <div class="cell"><div class="label">支付单号</div><div class="value">{{ detailOrder.payNo }}</div></div>
          <div class="cell"><div class="label">缴费时间</div><div class="value">{{ detailOrder.payTime }}</div></div>
          <div class="cell"><div class="label">缴费说明</div><div class="value">{{ detailOrder.payNote }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ detailOrder.dueTime }}</div></div>
          <div class="cell"><div class="label">缴费金额</div><div class="value hl">￥{{ detailOrder.amount }}</div></div>
          <div class="cell">
            <div class="label">支付方式</div>
            <div class="value">
              <el-tag size="small" :type="detailOrder.payWay === '微信支付' ? 'success' : detailOrder.payWay === '银行转账' ? '' : 'warning'">{{ detailOrder.payWay }}</el-tag>
            </div>
          </div>
          <div class="cell"><div class="label">是否开票</div><div class="value">{{ detailInvoice.invoiced }}</div></div>
          <div class="cell"><div class="label">备注</div><div class="value">{{ detailOrder.remark }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="payDetailVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useContractStore } from '../../store/contract'
import { useFinanceStore } from '../../store/finance'
import { useAssetStore } from '../../store/asset'
import { useAuditStore } from '../../store/audit'

const contractStore = useContractStore()
const financeStore = useFinanceStore()
const assetStore = useAssetStore()
const auditStore = useAuditStore()

const filters = ref({ keyword: '', company: '', feeType: '', status: '', month: '' })
const page = ref(1)
const pageSize = ref(15)

// 与 Fee.vue / DepositReturn.vue 共享同一份账单：financeStore.billList（企业端已按所属公司过滤）
function companyOf(contractId) {
  if (!contractId) return '—'
  const c = contractStore.getContractById(contractId)
  if (!c) return '—'
  return assetStore.getAssetById(c.assetId)?.group || '—'
}

const bills = computed(() => financeStore.billList.map(b => ({
  id: b.id ?? b.billNo,
  billNo: b.billNo,
  contractId: b.contractId,
  tenant: b.tenant,
  assetName: b.assetName,
  feeType: b.feeType,
  receivable: Number(b.receivable) || 0,
  received: Number(b.received) || 0,
  billMonth: b.billMonth,
  status: b.status,
  company: companyOf(b.contractId),
  createTime: b.createTime,
  updateTime: b.updateTime,
  raw: b
})))

// 出账源：从共享收费台账派生，年租金万元 → 月租金元，并按比例给出 物业费 / 水电费
const leaseSources = computed(() => {
  return contractStore.visibleFees.map(f => {
    const c = contractStore.getContractById(f.contractId)
    const annualRent = c?.annualRent || 0
    const monthlyRentYuan = Math.round(annualRent * 10000 / 12)
    return {
      contractId: f.contractId,
      tenant: f.tenant,
      assetId: f.assetId || c?.assetId || '',
      assetName: f.assetName,
      fee: {
        租金: monthlyRentYuan,
        物业费: Math.round(monthlyRentYuan * 0.06),
        水电费: Math.round(monthlyRentYuan * 0.04)
      }
    }
  })
})
let billSeq = 100 + bills.value.length

function stampTimes() {} // 保留占位：company / createTime 已在 bills computed 中派生


const billProfiles = {
  '滨江科技园A座8层': {
    tenantType: '企业', contact: '周明轩', phone: '13857101234',
    contractNo: 'HT-2024-0156', signTime: '2024-01-10', contractType: '办公楼租赁合同', payCycle: '按月',
    leaseStart: '2024-02-01', leaseEnd: '2027-01-31', dueDate: '每月15日', deposit: 116000, contractStatus: ['履约中', '已备案'],
    assets: [
      { region: '浙江省杭州市滨江区', project: '滨江科技园', zone: 'A座', assetNo: 'ZC-BJ-0081', address: '滨江科技园A座8层整层', company: '杭州滨江资产经营有限公司', leaseType: '整体出租' }
    ]
  },
  '西湖区文三路商铺': {
    tenantType: '企业', contact: '沈蓝海', phone: '13905712288',
    contractNo: 'HT-2023-0422', signTime: '2023-05-08', contractType: '商铺租赁合同', payCycle: '按季',
    leaseStart: '2023-06-01', leaseEnd: '2026-05-31', dueDate: '每季首月10日', deposit: 44000, contractStatus: ['履约中'],
    assets: [
      { region: '浙江省杭州市西湖区', project: '文三路商业街', zone: 'B区', assetNo: 'ZC-XH-0117', address: '文三路198号临街商铺', company: '杭州西湖文旅资产管理有限公司', leaseType: '部分出租' }
    ]
  },
  '余杭区仓储中心3号库': {
    tenantType: '企业', contact: '吴绿谷', phone: '13757309911',
    contractNo: 'HT-2023-0918', signTime: '2023-10-20', contractType: '仓库租赁合同', payCycle: '按半年',
    leaseStart: '2023-11-01', leaseEnd: '2028-10-31', dueDate: '每期首月20日', deposit: 70000, contractStatus: ['履约中', '已备案'],
    assets: [
      { region: '浙江省杭州市余杭区', project: '余杭仓储中心', zone: 'C区', assetNo: 'ZC-YH-0303', address: '余杭区仓储中心3号库', company: '嘉兴绿谷仓储物流有限公司', leaseType: '整体出租' },
      { region: '浙江省杭州市余杭区', project: '余杭仓储中心', zone: 'C区', assetNo: 'ZC-YH-0304', address: '余杭区仓储中心3号库附属堆场', company: '嘉兴绿谷仓储物流有限公司', leaseType: '整体出租' }
    ]
  },
  '浦东新区厂房2号': {
    tenantType: '企业', contact: '顾锦绣', phone: '13611882277',
    contractNo: 'HT-2024-0033', signTime: '2024-01-02', contractType: '厂房租赁合同', payCycle: '按季',
    leaseStart: '2024-01-15', leaseEnd: '2029-01-14', dueDate: '每季首月15日', deposit: 82000, contractStatus: ['履约中'],
    assets: [
      { region: '上海市浦东新区', project: '金桥工业坊', zone: 'D区', assetNo: 'ZC-PD-0202', address: '浦东新区厂房2号', company: '上海浦东金桥工业开发有限公司', leaseType: '整体出租' }
    ]
  }
}

const defaultProfile = {
  tenantType: '企业', contact: '—', phone: '—',
  contractNo: '—', signTime: '—', contractType: '—', payCycle: '按月',
  leaseStart: '—', leaseEnd: '—', dueDate: '—', deposit: 0, contractStatus: ['履约中'],
  assets: []
}

function profileOf(row) {
  return billProfiles[row.assetName] || defaultProfile
}

const companyOptions = computed(() => [...new Set(bills.value.map(b => b.company))])

// ===== 缴费周期配置 =====
const showCycle = ref(false)
const cycle = ref({ cycleType: 'monthly', billDay: 1, dueDay: 15, feeTypes: ['租金', '物业费'] })
const cycleLabelMap = { monthly: '按月', quarterly: '按季', halfyear: '按半年', yearly: '按年' }
const cycleMonths = { monthly: 1, quarterly: 3, halfyear: 6, yearly: 12 }
const cycleLabel = computed(() => cycleLabelMap[cycle.value.cycleType])
function saveCycle() {
  if (cycle.value.dueDay < cycle.value.billDay) {
    ElMessage.warning('缴费截止日应不早于出账日')
    return
  }
  if (!cycle.value.feeTypes.length) {
    ElMessage.warning('请至少选择一个计费项')
    return
  }
  showCycle.value = false
  ElMessage.success('缴费周期设置已保存')
}

// ===== 出账数据源已并入 leaseSources computed（在上方与 contractStore.visibleFees 同源）=====

// ===== KPI =====
const totalReceivable = computed(() => bills.value.reduce((s, b) => s + Number(b.receivable || 0), 0).toFixed(2))
const totalReceived = computed(() => bills.value.reduce((s, b) => s + Number(b.received || 0), 0).toFixed(2))
const overdueCount = computed(() => bills.value.filter(b => b.status === '已逾期').length)
const collectionRate = computed(() => {
  const rec = Number(totalReceivable.value)
  if (!rec) return 0
  return Math.round(Number(totalReceived.value) / rec * 10000) / 100
})
const rateColor = computed(() => {
  const r = collectionRate.value
  if (r >= 85) return '#67c23a'
  if (r >= 60) return '#e6a23c'
  return '#f56c6c'
})

// 生成目标账期（当前日期所属周期）
function nextBillMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const filteredData = computed(() => {
  return bills.value.filter(b => {
    if (filters.value.keyword && !(b.billNo.includes(filters.value.keyword) || b.tenant.includes(filters.value.keyword))) return false
    if (filters.value.company && b.company !== filters.value.company) return false
    if (filters.value.feeType && b.feeType !== filters.value.feeType) return false
    if (filters.value.status && b.status !== filters.value.status) return false
    if (filters.value.month && b.billMonth !== filters.value.month) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function statusType(status) {
  if (status === '已缴费') return 'success'
  if (status === '待缴费') return 'warning'
  if (status === '已停用') return 'info'
  return 'danger'
}

function getSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, idx) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (col.property === 'receivable') {
      sums[idx] = data.reduce((s, r) => s + Number(r.receivable || 0), 0).toFixed(2)
    } else if (col.property === 'received') {
      sums[idx] = data.reduce((s, r) => s + Number(r.received || 0), 0).toFixed(2)
    } else {
      sums[idx] = ''
    }
  })
  return sums
}

function handleSearch() { page.value = 1; ElMessage.success('查询完成') }
function resetFilters() { filters.value = { keyword: '', company: '', feeType: '', status: '', month: '' }; page.value = 1 }
function handleGenerate() {
  const month = nextBillMonth()
  const months = cycleMonths[cycle.value.cycleType]
  let created = 0, skipped = 0
  leaseSources.value.forEach(src => {
    cycle.value.feeTypes.forEach(ft => {
      const base = src.fee[ft]
      if (base == null) return
      const exists = bills.value.some(b => b.tenant === src.tenant && b.assetName === src.assetName && b.feeType === ft && b.billMonth === month)
      if (exists) { skipped++; return }
      const amt = Number((base * months).toFixed(2))
      const ym = month.replace('-', '')
      financeStore.addBill({
        billNo: `BILL${ym}${String(++billSeq).slice(-3)}`,
        contractId: src.contractId,
        tenant: src.tenant,
        assetId: src.assetId,
        assetName: src.assetName,
        feeType: ft,
        billMonth: month,
        billPeriod: month,
        receivable: amt,
        received: 0,
        dueDate: `${month}-${String(cycle.value.dueDay).padStart(2, '0')}`,
        status: '待缴费'
      })
      created++
    })
  })
  page.value = 1
  if (created) ElMessage.success(`已按${cycleLabel.value}周期生成 ${created} 张账单（账期 ${month}）${skipped ? `，跳过 ${skipped} 张已存在` : ''}`)
  else ElMessage.info(`账期 ${month} 的账单均已存在，无需重复生成${skipped ? `（跳过 ${skipped} 张）` : ''}`)
}
function handleExport() {
  const headers = ['账单编号', '承租方', '资产名称', '费用类型', '应收金额(元)', '实缴金额(元)', '账单月份', '缴费状态']
  const rows = bills.value.map(r => [r.billNo, r.tenant, r.assetName, r.feeType, r.receivable, r.received, r.billMonth, r.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `账单数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const payDetailVisible = ref(false)
const detailRow = ref(null)

const detailProfile = computed(() => detailRow.value ? profileOf(detailRow.value) : defaultProfile)

const detailInvoice = computed(() => {
  const row = detailRow.value
  if (!row) return {}
  if (row.status === '已缴费') {
    return {
      invoiced: '已开票',
      invoiceNo: `FP${row.billNo.slice(4)}`,
      invoiceType: '增值税普通发票',
      invoiceDate: `${row.billMonth}-08`,
      amount: row.received
    }
  }
  return { invoiced: '未开票', invoiceNo: '—', invoiceType: '—', invoiceDate: '—', amount: 0 }
})

const detailOrder = computed(() => {
  const row = detailRow.value
  if (!row) return {}
  const ways = ['微信支付', '银行转账', '支付宝']
  const paid = row.status === '已缴费'
  return {
    orderNo: `DD${row.billNo}`,
    payNo: paid ? `PAY${row.billNo.slice(4)}${String(row.id).slice(-4)}` : '—',
    payTime: paid ? row.updateTime : '—',
    payNote: `${row.billMonth} 账期 ${row.feeType}`,
    dueTime: `${row.billMonth}-15 23:59:59`,
    amount: row.received,
    payWay: ways[Math.abs(Math.trunc(row.id)) % 3],
    remark: row.status === '已逾期' ? '已逾期，请尽快缴纳' : row.status === '已停用' ? '账单已停用' : '—'
  }
})

function handleView(row) {
  detailRow.value = row
  payDetailVisible.value = true
}

function handleStop(row) {
  ElMessageBox.confirm(`确认停用账单 ${row.billNo}？停用后该账单不再参与催缴与统计。`, '停用确认', { type: 'warning' })
    .then(() => {
      financeStore.updateBill(row.billNo, { status: '已停用' })
      auditStore.recordEvent({
        assetId: row.contractId ? (contractStore.getContractById(row.contractId)?.assetId || '') : '',
        assetName: row.assetName,
        module: '账单',
        action: '账单停用',
        billNo: row.billNo,
        remark: `停用 ${row.tenant} 的 ${row.feeType} 账单（应收 ${row.receivable} 元）`
      })
      ElMessage.success('账单已停用')
    })
    .catch(() => {})
}

function handleUrge(row) {
  ElMessageBox.confirm(`确认向 ${row.tenant} 发送催缴通知？`, '催缴确认', { type: 'warning' })
    .then(() => {
      auditStore.recordEvent({
        assetId: row.contractId ? (contractStore.getContractById(row.contractId)?.assetId || '') : '',
        assetName: row.assetName,
        module: '账单',
        action: '催缴',
        billNo: row.billNo,
        remark: `向 ${row.tenant} 催缴 ${row.feeType} 账单，欠费 ${Math.max(0, row.receivable - row.received)} 元`
      })
      ElMessage.success('催缴通知已发送')
    })
    .catch(() => {})
}

const showAdd = ref(false)
const addForm = ref({ tenant: '', assetName: '', feeType: '租金', billMonth: '', receivable: 0, remark: '' })

function openAddDialog() {
  addForm.value = { tenant: '', assetName: '', feeType: '租金', billMonth: nextBillMonth(), receivable: 0, remark: '' }
  showAdd.value = true
}

function onAddTenantChange(val) {
  const src = leaseSources.value.find(s => s.tenant === val)
  if (src) {
    addForm.value.assetName = src.assetName
    addForm.value.receivable = src.fee[addForm.value.feeType] || 0
  }
}

function onAddFeeTypeChange(val) {
  const src = leaseSources.value.find(s => s.tenant === addForm.value.tenant)
  if (src && src.fee[val] != null) addForm.value.receivable = src.fee[val]
}

function submitAdd() {
  if (!addForm.value.tenant) { ElMessage.warning('请选择承租方'); return }
  if (!addForm.value.billMonth) { ElMessage.warning('请选择账单月份'); return }
  if (!addForm.value.receivable) { ElMessage.warning('请填写应收金额'); return }
  const ym = addForm.value.billMonth.replace('-', '')
  const src = leaseSources.value.find(s => s.tenant === addForm.value.tenant)
  financeStore.addBill({
    billNo: `BILL${ym}${String(++billSeq).slice(-3)}`,
    contractId: src?.contractId || '',
    tenant: addForm.value.tenant,
    assetId: src?.assetId || '',
    assetName: addForm.value.assetName,
    feeType: addForm.value.feeType,
    billMonth: addForm.value.billMonth,
    billPeriod: addForm.value.billMonth,
    receivable: addForm.value.receivable,
    received: 0,
    dueDate: `${addForm.value.billMonth}-${String(cycle.value.dueDay).padStart(2, '0')}`,
    status: '待缴费'
  })
  page.value = 1
  showAdd.value = false
  ElMessage.success('账单新增成功')
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { margin: 0; font-size: 20px; }
.kpi-row { display: flex; gap: 16px; align-items: stretch; }
.kpi-ring { background: var(--bg-card); border: 1px solid var(--bd); border-radius: var(--r-md); padding: 8px; display: flex; justify-content: center; align-items: center; }
.kpi-metrics { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.rate-v { font-size: 20px; font-weight: 700; }
.rate-l { font-size: 12px; color: var(--t-weak); margin-top: 2px; }
.kpi-box { background: var(--bg-card); border: 1px solid var(--bd); border-radius: var(--r-md); padding: 12px; text-align: center; }
.kpi-v { font-size: 20px; font-weight: 600; }
.kpi-l { font-size: 12px; color: var(--t-weak); margin-top: 4px; }
.cycle-tip { background: #f4f8ff; border: 1px solid #d9ecff; border-radius: var(--r-sm); padding: 8px 12px; font-size: 13px; color: var(--t-sub); }
.unit { margin-left: 8px; color: var(--t-weak); font-size: 13px; }
.filter-bar :deep(.el-select),
.filter-bar :deep(.el-input) { width: 100%; }
.filter-actions { display: flex; gap: 8px; }
.pager { margin-top: 12px; display: flex; justify-content: flex-end; }
.expand-wrap { padding: 12px 24px; }
</style>
