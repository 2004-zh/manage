import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

const MAX_CHANGE = 3000
const MAX_OPLOG = 2000

// 字段中文名：留痕要能被人读懂，不能只存字段名
export const FIELD_LABELS = {
  status: '使用状态',
  leaseStatus: '租赁状态',
  isLeased: '是否出租',
  certStatus: '办证状态',
  certDetail: '权证号',
  propertyRight: '产权状况',
  tenant: '承租方',
  leaseExpiry: '租约到期',
  annualRent: '年租金(万元)',
  monthlyRent: '月租金',
  area: '面积(㎡)',
  bookValue: '账面原值(万元)',
  name: '资产名称',
  location: '坐落',
  group: '所属集团',
  type: '资产类型',
  assetCategory: '资产类别',
  restriction: '权利限制',
  mortgageStatus: '抵押状态',
  controlLimit: '管控限制',
  usageLimit: '使用限制',
  disposeLimit: '处置限制',
  arrears: '欠费(万元)',
  cumActual: '累计实收(万元)',
  cumReceivable: '累计应收(万元)',
  yearActual: '本年实收(万元)',
  endDate: '合同止期',
  startDate: '合同起期',
  overdueDays: '逾期天数',
  creditLevel: '信用等级',
  owner: '权属单位',
  manager: '管理方',
  inventoryState: '盘点状态',
  checkResult: '盘点结果',
  voucherNo: '凭证号',
  invoiceNo: '发票号',
  taxAmount: '税额(万元)',
  orderStatus: '督办状态'
}

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function display(v) {
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}

export const useAuditStore = defineStore('audit', () => {
  // H1 业务变更记录：字段级，回答"这个资产的某个值为什么变了"
  const changeRecords = ref([])
  // H2 系统操作日志：行为级，回答"谁在什么时候进了哪个页面、点了什么"
  const opLogs = ref([])

  const allChanges = computed(() => changeRecords.value)
  const allOpLogs = computed(() => opLogs.value)
  const changeCount = computed(() => changeRecords.value.length)
  const opLogCount = computed(() => opLogs.value.length)

  function actor() {
    const userStore = useUserStore()
    const u = userStore.user
    return {
      operator: u?.name || '系统',
      operatorOrg: u?.org || '系统',
      endpoint: u?.endpoint || 'sys'
    }
  }

  function nextChangeId() {
    return `CR-${String(changeRecords.value.length + 1).padStart(6, '0')}`
  }

  /** 单条字段级留痕 */
  function recordChange(entry) {
    const rec = {
      id: nextChangeId(),
      time: nowStr(),
      assetId: entry.assetId || '',
      assetName: entry.assetName || '',
      group: entry.group || '',
      module: entry.module || '其他',
      action: entry.action || '修改',
      field: entry.field || '',
      fieldLabel: entry.fieldLabel || FIELD_LABELS[entry.field] || entry.field || '',
      before: display(entry.before),
      after: display(entry.after),
      billNo: entry.billNo || '',
      remark: entry.remark || '',
      ...actor()
    }
    changeRecords.value.unshift(rec)
    if (changeRecords.value.length > MAX_CHANGE) changeRecords.value.length = MAX_CHANGE
    return rec
  }

  /**
   * 对比 before/after 两个对象，把所有发生变化的字段各写一条留痕。
   * 这是"任何写操作统一留痕"的落点：调用方只需给出前后快照。
   */
  function recordDiff({ assetId, assetName, group, module, action, before, after, billNo, remark, fields }) {
    if (!before || !after) return []
    const keys = fields || Object.keys(after)
    const out = []
    keys.forEach(k => {
      const b = before[k]
      const a = after[k]
      if (b === a) return
      if (b === undefined && a === undefined) return
      if (display(b) === display(a)) return
      out.push(recordChange({
        assetId, assetName, group, module, action,
        field: k, before: b, after: a, billNo, remark
      }))
    })
    return out
  }

  /** 单据类留痕：不对比字段，只记一次业务动作（签约、退租、处置、督办流转等） */
  function recordEvent({ assetId, assetName, group, module, action, billNo, remark, detail }) {
    return recordChange({
      assetId, assetName, group, module, action,
      field: '', fieldLabel: '', before: '', after: detail || '',
      billNo, remark
    })
  }

  /** H2 系统操作日志 */
  function logOp(entry) {
    const rec = {
      id: `OL-${String(opLogs.value.length + 1).padStart(6, '0')}`,
      time: nowStr(),
      module: entry.module || '其他',
      action: entry.action || '访问',
      target: entry.target || '',
      result: entry.result || '成功',
      detail: entry.detail || '',
      ip: entry.ip || '127.0.0.1',
      ...actor()
    }
    opLogs.value.unshift(rec)
    if (opLogs.value.length > MAX_OPLOG) opLogs.value.length = MAX_OPLOG
    return rec
  }

  function getByAsset(assetId) {
    if (!assetId) return []
    return changeRecords.value.filter(r => r.assetId === assetId)
  }

  function getByModule(module) {
    return changeRecords.value.filter(r => r.module === module)
  }

  function getByGroup(group) {
    return changeRecords.value.filter(r => r.group === group)
  }

  /** 盘活链依赖：找出指定年度内由闲置转为出租的资产 */
  function getIdleToLeased(year, group) {
    return changeRecords.value.filter(r => {
      if (r.field !== 'status') return false
      if (r.before !== '闲置') return false
      if (r.after !== '已出租' && r.after !== '部分出租') return false
      if (year && !r.time.startsWith(String(year))) return false
      if (group && r.group !== group) return false
      return true
    })
  }

  function clearChanges() { changeRecords.value = [] }
  function clearOpLogs() { opLogs.value = [] }

  return {
    changeRecords,
    opLogs,
    allChanges,
    allOpLogs,
    changeCount,
    opLogCount,
    recordChange,
    recordDiff,
    recordEvent,
    logOp,
    getByAsset,
    getByModule,
    getByGroup,
    getIdleToLeased,
    clearChanges,
    clearOpLogs
  }
})
