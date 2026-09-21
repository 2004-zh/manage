<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>打印
        </el-button>
      </div>
    </div>

    <el-card class="fill report-card">
      <el-tabs v-model="activeCategory" class="category-tabs">
        <el-tab-pane v-for="cat in categories" :key="cat" :label="cat" :name="cat" />
      </el-tabs>

      <el-form :inline="true" class="search-form">
        <el-form-item v-for="f in cfg.filters" :key="f.key" :label="f.label">
          <el-input
            v-if="f.type === 'input'"
            v-model="filterState[f.key]"
            :placeholder="'请输入' + f.label"
            clearable
            style="width: 180px"
          />
          <el-select
            v-else-if="f.type === 'select'"
            v-model="filterState[f.key]"
            placeholder="请选择"
            clearable
            style="width: 140px"
          >
            <el-option v-for="o in filterOptions(f)" :key="o" :label="o" :value="o" />
          </el-select>
          <el-date-picker
            v-else
            v-model="filterState[f.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </el-form-item>
      </el-form>

      <div v-for="row in cfg.chips" :key="row.label" class="chip-row">
        <span class="chip-label">{{ row.label }}</span>
        <span
          v-for="opt in row.options"
          :key="opt"
          class="chip"
          :class="{ on: chipState[row.label] === opt }"
          @click="chipState[row.label] = opt"
        >{{ opt }}</span>
      </div>

      <!-- 分组汇总：按资产类别/权属/状态的组内合计，来源于当前筛选后的 store 行 -->
      <div v-if="summaryText" class="chip-row">
        <span class="chip-label">汇总</span>
        <span class="chip on">{{ summaryText }}</span>
      </div>

      <el-table :data="pagedRows" border stripe style="width: 100%">
        <el-table-column
          v-for="col in cfg.columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.min"
          :show-overflow-tooltip="!!col.tip"
        >
          <template #default="{ row }">
            <el-tag v-if="col.tag" size="small" :type="tagType(row[col.prop])">{{ row[col.prop] }}</el-tag>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="cfg.emptyTip || '暂无数据'" :image-size="80" />
        </template>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filteredRows.length"
          layout="total, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, Printer } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useFinanceStore } from '../../store/finance'
import { useInventoryStore } from '../../store/inventory'
import { useAuditStore } from '../../store/audit'
import { ASSET_CATEGORIES } from '../../data/assetCategory'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || '报表中心')

const categories = ASSET_CATEGORIES
const activeCategory = ref('房产类')
const page = ref(1)
const pageSize = 15
const filterState = ref({})
const chipState = reactive({})

/* 页签配置：五个报表路由共用本组件，靠 route.name（兜底 path 段）区分。
 * filters/chips 的 options 在 cfg 中按当前数据行动态去重生成；
 * filters: input 按 fields 模糊匹配，select 按 prop 精确匹配，date 按行 _date 落区间；
 * rows 一律来自 store（资产/合同/费用/财务/盘点/审计留痕），不再内置演示数据。 */
const CONFIG = {
  EntReportAssetStats: {
    filters: [
      { key: 'kw', label: '资产编号/名称', type: 'input', fields: ['code', 'name', 'project'] },
      { key: 'tenant', label: '租赁方信息', type: 'input', fields: ['tenant'] },
      { key: 'company', label: '所属公司', type: 'select', prop: '_group' },
      { key: 'lease', label: '租赁状态', type: 'select', prop: 'leaseStatus' }
    ],
    chips: [
      { label: '来源类型', prop: '_source' },
      { label: '资产权属', prop: '_own' }
    ],
    columns: [
      { prop: 'region', label: '省市区', width: 150, tip: true },
      { prop: 'project', label: '项目', width: 150, tip: true },
      { prop: 'district', label: '分区', width: 90 },
      { prop: 'company', label: '所属公司', width: 110, tip: true },
      { prop: 'code', label: '资产编号', width: 110 },
      { prop: 'name', label: '资产名称', min: 180, tip: true },
      { prop: 'leaseStatus', label: '租赁状态', width: 90, tag: true },
      { prop: 'type', label: '资产类型', width: 100 },
      { prop: 'layout', label: '资产用途', width: 90 },
      { prop: 'area', label: '面积(㎡)', width: 100 },
      { prop: 'bookValue', label: '账面原值(万元)', width: 120 }
    ],
    emptyTip: '当前筛选条件下暂无资产'
  },
  EntReportOperationStats: {
    filters: [
      { key: 'kw', label: '合同编号/承租方', type: 'input', fields: ['code', 'tenant', 'name'] },
      { key: 'company', label: '所属公司', type: 'select', prop: '_group' },
      { key: 'lease', label: '租赁状态', type: 'select', prop: 'lease' },
      { key: 'range', label: '租期起始', type: 'date' }
    ],
    chips: [{ label: '租金类型', prop: 'rentType' }],
    columns: [
      { prop: 'code', label: '合同编号', width: 130 },
      { prop: 'name', label: '资产名称', min: 160, tip: true },
      { prop: 'tenant', label: '承租方', width: 160, tip: true },
      { prop: 'company', label: '所属公司', width: 110 },
      { prop: 'period', label: '租期', width: 170 },
      { prop: 'rent', label: '月租金(元)', width: 100 },
      { prop: 'yearRecv', label: '本年应收(万元)', width: 115 },
      { prop: 'yearActual', label: '本年实收(万元)', width: 115 },
      { prop: 'collection', label: '收缴状态', width: 90, tag: true },
      { prop: 'lease', label: '租赁状态', width: 90, tag: true },
      { prop: 'rate', label: '出租率', width: 90 }
    ],
    emptyTip: '暂无合同，请先在「合同台账」录入合同'
  },
  EntReportFinanceStats: {
    filters: [
      { key: 'kw', label: '单据编号/对象', type: 'input', fields: ['bill', 'contract', 'target'] },
      { key: 'kind', label: '科目类别', type: 'select', prop: '_kind' },
      { key: 'status', label: '状态', type: 'select', prop: 'status' },
      { key: 'range', label: '业务日期', type: 'date' }
    ],
    chips: [{ label: '科目类别', prop: '_kind' }],
    columns: [
      { prop: 'bill', label: '单据编号', width: 140 },
      { prop: 'subject', label: '会计事项', width: 140, tip: true },
      { prop: 'target', label: '往来对象/资产', min: 170, tip: true },
      { prop: 'contract', label: '合同编号', width: 130 },
      { prop: 'period', label: '期间', width: 110 },
      { prop: 'due', label: '应收/应缴(万元)', width: 125 },
      { prop: 'paid', label: '实收/金额(万元)', width: 125 },
      { prop: 'status', label: '状态', width: 90, tag: true }
    ],
    emptyTip: '当前筛选条件下暂无财务台账记录'
  },
  EntReportInventoryStats: {
    filters: [
      { key: 'kw', label: '盘点单号/任务名称', type: 'input', fields: ['code', 'name', 'scope'] },
      { key: 'company', label: '所属公司', type: 'select', prop: '_group' },
      { key: 'status', label: '盘点状态', type: 'select', prop: 'status' },
      { key: 'range', label: '盘点日期', type: 'date' }
    ],
    chips: [{ label: '盘点范围', prop: 'scope' }],
    columns: [
      { prop: 'code', label: '盘点单号', width: 130 },
      { prop: 'name', label: '任务名称', min: 170, tip: true },
      { prop: 'company', label: '所属公司', width: 110 },
      { prop: 'scope', label: '盘点范围', width: 110 },
      { prop: 'date', label: '盘点日期', width: 110 },
      { prop: 'book', label: '账面数(项)', width: 100 },
      { prop: 'actual', label: '已盘数(项)', width: 100 },
      { prop: 'diff', label: '差异数(项)', width: 100 },
      { prop: 'diffRate', label: '差异率', width: 90 },
      { prop: 'status', label: '盘点状态', width: 90, tag: true }
    ],
    emptyTip: '暂无盘点任务，请先在「盘点清查」发起并完成盘点'
  },
  EntReportRepairStats: {
    filters: [
      { key: 'kw', label: '工单号/资产名称', type: 'input', fields: ['code', 'name', 'content'] },
      { key: 'company', label: '所属公司', type: 'select', prop: '_group' },
      { key: 'status', label: '处理状态', type: 'select', prop: 'status' },
      { key: 'range', label: '报修/发生日期', type: 'date' }
    ],
    chips: [{ label: '记录来源', prop: 'source' }],
    columns: [
      { prop: 'code', label: '单据/工单号', width: 140 },
      { prop: 'name', label: '资产名称', min: 160, tip: true },
      { prop: 'company', label: '所属公司', width: 110 },
      { prop: 'content', label: '维修事项', min: 150, tip: true },
      { prop: 'source', label: '记录来源', width: 120 },
      { prop: 'report', label: '发生日期', width: 110 },
      { prop: 'cost', label: '维修费用(元)', width: 110 },
      { prop: 'status', label: '处理状态', width: 90, tag: true }
    ],
    emptyTip: '维修工单记录待接入：当前仅汇总财务侧维修费用台账与业务留痕'
  }
}

// 路由名 → 页签；直接输入 URL 时按 path 段兜底
const PATH_TO_TAB = {
  'report-asset-stats': 'EntReportAssetStats',
  'report-operation-stats': 'EntReportOperationStats',
  'report-finance-stats': 'EntReportFinanceStats',
  'report-inventory-stats': 'EntReportInventoryStats',
  'report-repair-stats': 'EntReportRepairStats'
}
const tabName = computed(() => {
  if (CONFIG[route.name]) return route.name
  const seg = String(route.path || '').split('/').filter(Boolean).pop()
  return PATH_TO_TAB[seg] || 'EntReportAssetStats'
})

const assetStore = useAssetStore()
const contractStore = useContractStore()
const financeStore = useFinanceStore()
const inventoryStore = useInventoryStore()
const auditStore = useAuditStore()

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

/* ===== 资产统计报表：assetStore.visibleAssets 逐宗明细，含类别/权属/来源与面积原值合计所需的行字段 ===== */
const assetStatsRows = computed(() => assetStore.visibleAssets.map(a => ({
  category: a.assetCategory || '房产类',
  region: '福建省/福州市/长乐区',
  project: a.projectName || a.name,
  district: a.zoneName || '—',
  company: a.group || '—',
  code: a.assetNo || a.code || a.id,
  name: a.name,
  leaseStatus: (a.status === '已出租' || a.status === '部分出租') ? '已出租'
    : (a.status === '自用' ? '自用' : '未出租'),
  type: a.type || '—',
  layout: a.assetUsage || a.layout || '—',
  area: round2(a.area),
  bookValue: round2(a.bookValue),
  tenant: a.tenant || '—',
  _group: a.group || '—',
  _source: a.sourceType || a.acquisitionMethod || '—',
  _own: a.propertyRight || '—',
  _status: a.status || '—'
})))

/* ===== 经营分析报表：contractStore.visibleContracts + visibleFees（本年应收/实收、收缴） ===== */
const feeByContract = computed(() => {
  const map = {}
  contractStore.visibleFees.forEach(f => { map[f.contractId] = f })
  return map
})

const operationRows = computed(() => contractStore.visibleContracts.map(c => {
  const asset = assetStore.getAssetById(c.assetId)
  const fee = feeByContract.value[c.id]
  const terminated = c.status === '已终止' || c.status === '退租'
  const total = asset && asset.area ? asset.area : (c.leaseArea || 0)
  const rate = total ? Math.min(100, Math.round((c.leaseArea || total) / total * 100)) : 100
  return {
    category: asset ? (asset.assetCategory || '房产类') : '',
    code: c.id,
    name: c.assetName || (asset ? asset.name : '—'),
    tenant: c.tenant,
    company: asset ? (asset.group || '—') : '—',
    period: `${c.startDate || '—'} 至 ${c.endDate || '—'}`,
    rent: Math.round((c.annualRent || 0) * 10000 / 12),
    yearRecv: fee ? round2(fee.yearReceivable) : 0,
    yearActual: fee ? round2(fee.yearActual) : 0,
    collection: fee
      ? ((fee.arrears || 0) > 0 || fee.status === '欠缴' ? '欠缴' : '已缴')
      : (c.status === '欠缴' ? '欠缴' : '已缴'),
    lease: terminated ? '未出租' : (rate < 100 ? '部分出租' : '已出租'),
    rate: `${terminated ? 0 : rate}%`,
    rentType: /递增/.test(c.increment || '') ? '递增租金' : '固定租金',
    _group: asset ? (asset.group || '—') : '—',
    _date: c.startDate || ''
  }
}))

/* ===== 财务报表：实收(费用台账)/开票/支出/税费/差价/凭证，统一万元口径（税费由元换算） ===== */
const groupOfContract = (contractId) => {
  const c = contractStore.getContractById(contractId)
  return c ? (assetStore.getAssetById(c.assetId)?.group || '—') : '—'
}

const financeRows = computed(() => {
  const rows = []
  contractStore.visibleFees.forEach(f => {
    rows.push({
      category: '', bill: `ZD-${f.contractId}`, subject: '租金收缴',
      target: f.tenant, contract: f.contractId,
      period: `${new Date().getFullYear()}-12`, due: round2(f.yearReceivable), paid: round2(f.yearActual),
      status: (f.arrears || 0) > 0 || f.status === '欠缴' ? '欠缴' : '已缴',
      _kind: '租金', _group: groupOfContract(f.contractId), _date: ''
    })
  })
  financeStore.invoices.forEach(iv => {
    rows.push({
      category: '', bill: iv.invoiceNo, subject: `开票·${iv.invoiceType}`,
      target: iv.tenant, contract: iv.contractId,
      period: iv.issueDate, due: '', paid: round2(iv.amount),
      status: iv.invoiceStatus,
      _kind: '开票', _group: groupOfContract(iv.contractId), _date: iv.issueDate || ''
    })
  })
  financeStore.expenses.forEach(e => {
    rows.push({
      category: '', bill: e.expenseNo, subject: `支出·${e.expenseType}`,
      target: e.assetName, contract: '',
      period: e.occurDate, due: '', paid: round2(e.amount),
      status: e.expenseVoucher ? '已入账' : '待入账',
      _kind: '支出', _group: '—', _date: e.occurDate || ''
    })
  })
  financeStore.taxRecords.forEach(t => {
    rows.push({
      category: '', bill: t.taxNo, subject: `税费·${t.taxType}`,
      target: t.relatedAsset, contract: '',
      period: t.deadline, due: round2((t.taxAmount || 0) / 10000),
      paid: t.payStatus === '已缴纳' ? round2((t.taxAmount || 0) / 10000) : '',
      status: t.payStatus,
      _kind: '税费', _group: '—', _date: t.deadline || ''
    })
  })
  financeStore.rentMarginRows.forEach(m => {
    rows.push({
      category: '', bill: `CJ-${m.contractId}`, subject: '市场租金差价',
      target: m.tenant, contract: m.contractId,
      period: `${new Date().getFullYear()}`, due: round2(m.marketAnnual), paid: round2(m.actualAnnual),
      status: m.adjusted ? '已调价' : '正常',
      _kind: '差价', _group: m.group || '—', _date: ''
    })
  })
  financeStore.vouchers.forEach(v => {
    rows.push({
      category: '', bill: v.voucherNo, subject: `凭证·${v.bizType}`,
      target: v.bizId, contract: v.bizType === '保证金收取' ? v.bizId : '',
      period: v.date, due: '', paid: '',
      status: '已生成',
      _kind: '凭证', _group: '—', _date: v.date || ''
    })
  })
  return rows
})

/* ===== 盘点报表：inventoryStore.taskList（含进行中），差异数/差异率来自 taskSummary ===== */
const inventoryRows = computed(() => inventoryStore.taskList.map(t => ({
  category: '',
  code: t.id,
  name: t.name,
  company: t.group || '—',
  scope: t.scope,
  date: (t.finishedTime || t.createdTime || '').slice(0, 10),
  book: t.summary.total,
  actual: t.summary.checked,
  diff: t.summary.diff,
  diffRate: `${t.summary.diffRate}%`,
  status: t.status,
  _group: t.group || '—',
  _date: (t.finishedTime || t.createdTime || '').slice(0, 10)
})))

/* ===== 维修统计报表：无独立工单实体，汇总财务维修费用台账 + 审计留痕中的维修事件 ===== */
const repairRows = computed(() => {
  const rows = financeStore.expenses
    .filter(e => (e.expenseType || '').includes('维修'))
    .map(e => ({
      category: '',
      code: e.expenseNo,
      name: e.assetName,
      company: '—',
      content: `维修费用（供应商：${e.supplier || '—'}）`,
      source: '财务费用台账',
      report: e.occurDate || '',
      cost: round2((e.amount || 0) * 10000),
      status: e.expenseVoucher ? '已完成' : '进行中',
      _group: '—',
      _date: e.occurDate || ''
    }))
  auditStore.changeRecords.forEach(r => {
    const text = `${r.module || ''} ${r.action || ''} ${r.remark || ''} ${r.after || ''}`
    if (!/维修|repairCost/i.test(text)) return
    rows.push({
      category: '',
      code: r.billNo || '—',
      name: r.assetName || '—',
      company: r.group || '—',
      content: `${r.module || '其他'}·${r.action || '维修留痕'}`,
      source: '业务留痕',
      report: String(r.time || '').slice(0, 10),
      cost: '',
      status: '进行中',
      _group: r.group || '—',
      _date: String(r.time || '').slice(0, 10)
    })
  })
  return rows
})

const tabRows = computed(() => {
  switch (tabName.value) {
    case 'EntReportOperationStats': return operationRows.value
    case 'EntReportFinanceStats': return financeRows.value
    case 'EntReportInventoryStats': return inventoryRows.value
    case 'EntReportRepairStats': return repairRows.value
    default: return assetStatsRows.value
  }
})

const uniqProp = (rows, prop) => [...new Set(rows.map(r => r[prop]).filter(v => v !== undefined && v !== null && v !== ''))]

const cfg = computed(() => {
  const c = CONFIG[tabName.value]
  const rows = tabRows.value
  return {
    ...c,
    filters: c.filters.map(f =>
      f.type === 'select' ? { ...f, options: f.options || uniqProp(rows, f.prop) } : f),
    chips: c.chips.map(ch => ({ ...ch, options: ['不限', ...uniqProp(rows, ch.prop)] }))
  }
})

const filterOptions = (f) => f.options || []

const initChipState = () => {
  Object.keys(chipState).forEach(k => delete chipState[k])
  cfg.value.chips.forEach(row => { chipState[row.label] = '不限' })
}

watch(tabName, () => {
  page.value = 1
  filterState.value = {}
  initChipState()
}, { immediate: true })

/* 通用过滤：类别页签 + input/select/date + chips，全部作用于 store 行 */
const filteredRows = computed(() => {
  let rows = tabRows.value.filter(r => !activeCategory.value || !r.category || r.category === activeCategory.value)
  const fs = filterState.value
  cfg.value.filters.forEach(f => {
    const val = fs[f.key]
    if (!val) return
    if (f.type === 'input') {
      const kw = String(val).toLowerCase()
      const fields = f.fields || null
      rows = rows.filter(r => fields
        ? fields.some(k => String(r[k] ?? '').toLowerCase().includes(kw))
        : Object.values(r).some(v => String(v).toLowerCase().includes(kw)))
    } else if (f.type === 'select') {
      rows = rows.filter(r => String(r[f.prop]) === String(val))
    } else if (Array.isArray(val) && val[0] && val[1]) {
      rows = rows.filter(r => r._date && r._date >= val[0] && r._date <= val[1])
    }
  })
  cfg.value.chips.forEach(chip => {
    const sel = chipState[chip.label]
    if (sel && sel !== '不限') rows = rows.filter(r => String(r[chip.prop]) === sel)
  })
  return rows
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

/* 汇总条：当前筛选后行集的组内合计（数量/面积/原值、应收实收、差异、维修费用） */
const countBy = (rows, key) => {
  const m = {}
  rows.forEach(r => { const k = r[key] || '—'; m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).map(([k, v]) => `${k} ${v}`).join('、')
}

const summaryText = computed(() => {
  const rows = filteredRows.value
  if (!rows.length) return ''
  const sum = (k) => round2(rows.reduce((s, r) => s + (Number(r[k]) || 0), 0))
  switch (tabName.value) {
    case 'EntReportAssetStats':
      return `共 ${rows.length} 宗 · 面积合计 ${sum('area')}㎡ · 账面原值合计 ${sum('bookValue')}万元 · 按状态：${countBy(rows, '_status')} · 按权属：${countBy(rows, '_own')}`
    case 'EntReportOperationStats':
      return `合同 ${rows.length} 份 · 本年应收合计 ${sum('yearRecv')}万元 · 本年实收合计 ${sum('yearActual')}万元 · 欠缴 ${rows.filter(r => r.collection === '欠缴').length} 份`
    case 'EntReportFinanceStats':
      return `台账 ${rows.length} 笔 · 应收/应缴合计 ${sum('due')}万元 · 实收/金额合计 ${sum('paid')}万元`
    case 'EntReportInventoryStats':
      return `盘点任务 ${rows.length} 项 · 账面 ${sum('book')} 项 · 已盘 ${sum('actual')} 项 · 差异 ${sum('diff')} 项`
    case 'EntReportRepairStats':
      return `维修记录 ${rows.length} 条 · 费用合计 ${sum('cost')}元`
    default:
      return ''
  }
})

const tagType = (v) => ({
  '已使用': 'success', '已出租': 'success', '自用': 'primary', '已缴': 'success', '已完成': 'success',
  '已入账': 'success', '正常': 'success', '已缴纳': 'success', '已生成': 'success', '已开具': 'success',
  '已调价': 'primary',
  '部分出租': 'warning', '欠缴': 'warning', '进行中': 'warning', '待入账': 'warning', '待缴纳': 'warning',
  '待开具': 'warning', '维修中': 'warning',
  '逾期': 'danger', '已逾期': 'danger', '待盘点': 'info', '待派单': 'info', '未出租': 'info', '已红冲': 'info'
}[v] || 'info')

const handleSearch = () => {
  page.value = 1
  ElMessage.success(`查询完成，共 ${filteredRows.value.length} 条`)
}

const handleReset = () => {
  filterState.value = {}
  initChipState()
  page.value = 1
}

/* 导出：当前筛选后的全部表格行 → CSV（带 BOM，Excel 直接打开不乱码） */
const handleExport = () => {
  const cols = cfg.value.columns
  const headers = cols.map(c => c.label)
  const rows = filteredRows.value.map(r => cols.map(c => r[c.prop]))
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pageTitle.value}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.length} 行`)
}

const handlePrint = () => {
  ElMessage.success(`${pageTitle.value} 打印预览`)
  window.print()
}
</script>

<style scoped>
.category-tabs {
  margin-bottom: 4px;
}

.search-form {
  margin-bottom: 4px;
}

/* tab 切换后短表格也不留灰底空洞：让卡片 body 撑到剩余高度，pager 紧贴表格 */
.report-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
