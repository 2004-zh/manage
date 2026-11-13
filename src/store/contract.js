import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contracts as initialContracts, feeRecords as initialFees } from '../data/mock'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'
import { usePartyStore } from './party'
import { useRevitalizeStore } from './revitalize'
import { useNotifyStore } from './notify'
import { useUserStore } from './user'
import { useFinanceStore } from './finance'
import { todayISO, toISODate, wanToYuan, nextSeqNo } from '../utils/model'

// P1 收编：原 Contract.vue 内各自维护的合同附属台账，统一由合同 store 持有并持久化。
// 字段暂沿用页面历史命名，字段级统一（意向书/审批单与合同主数据的映射）留待 P2。
const SEED_INTENT_LETTERS = [
  { id: 'YXS-2026-001', lessor: '城投集团', lessee: '福州××商业管理有限公司', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', intentArea: 320, startDate: '2026-07-01', endDate: '2031-06-30', intentAmount: 10, rentFreeType: '有', freeMonths: 2, feeReduction: '固定租金', status: '洽谈中', remark: '意向承租方为连锁品牌' },
  { id: 'YXS-2026-002', lessor: '领航公司', lessee: '福建××科技有限公司', assetId: 'CT-004', assetName: '首占新区保障房 1# 楼', intentArea: 1200, startDate: '2026-08-01', endDate: '2029-07-31', intentAmount: 20, rentFreeType: '无', freeMonths: 0, feeReduction: '物业费', status: '洽谈中', remark: '仅承租部分楼层' },
  { id: 'YXS-2026-003', lessor: '产投集团', lessee: '长乐××物流有限公司', assetId: 'CT-006', assetName: '玉田镇旧工业厂房', intentArea: 2400, startDate: '2026-09-01', endDate: '2028-08-31', intentAmount: 15, rentFreeType: '有', freeMonths: 1, feeReduction: '', status: '洽谈中', remark: '需确认消防验收情况' },
  { id: 'YXS-2026-004', lessor: '城投集团', lessee: '福州××餐饮管理有限公司', assetId: 'CT-005', assetName: '江田镇仓储用地', intentArea: 5000, startDate: '2026-10-01', endDate: '2029-09-30', intentAmount: 8, rentFreeType: '无', freeMonths: 0, feeReduction: '固定租金', status: '已终止', remark: '承租方放弃租赁' },
  { id: 'YXS-2026-005', lessor: '水投集团', lessee: '长乐××教育培训有限公司', assetId: 'CT-003', assetName: '营前标准厂房 2#', intentArea: 800, startDate: '2026-09-15', endDate: '2029-09-14', intentAmount: 5, rentFreeType: '有', freeMonths: 3, feeReduction: '管理费', status: '洽谈中', remark: '' },
  { id: 'YXS-2026-006', lessor: '领航公司', lessee: '福建××电子商务有限公司', assetId: 'CT-007', assetName: '吴航农贸市场', intentArea: 600, startDate: '2026-11-01', endDate: '2029-10-31', intentAmount: 12, rentFreeType: '无', freeMonths: 0, feeReduction: '', status: '洽谈中', remark: '电商企业入驻意向' },
  { id: 'YXS-2026-007', lessor: '产投集团', lessee: '长乐××新能源科技有限公司', assetId: 'CT-002', assetName: '航城商务楼 3F', intentArea: 1200, startDate: '2026-10-15', endDate: '2031-10-14', intentAmount: 25, rentFreeType: '有', freeMonths: 2, feeReduction: '固定租金', status: '已签约', remark: '' },
  { id: 'YXS-2026-008', lessor: '领航公司', lessee: '福州××健康管理有限公司', assetId: 'CT-008', assetName: '梅花镇综合楼', intentArea: 500, startDate: '2026-12-01', endDate: '2029-11-30', intentAmount: 6, rentFreeType: '无', freeMonths: 0, feeReduction: '物业费', status: '洽谈中', remark: '资产现为自用，需先调整用途' }
]

const SEED_CONTRACT_TEMPLATES = [
  { id: 'TPL-001', name: '标准商铺租赁合同', type: '商铺租赁', version: 'V2.1', updateTime: '2026-06-15', useCount: 28, content: '<p>第一条 甲方将位于____的商铺出租给乙方经营使用。</p><p>第二条 租赁期限为____年，自____年____月____日起至____年____月____日止。</p><p>第三条 年租金为人民币____万元，租金按半年缴纳。</p><p>第四条 乙方应缴纳保证金人民币____万元。</p>' },
  { id: 'TPL-002', name: '厂房租赁合同', type: '厂房租赁', version: 'V1.3', updateTime: '2026-05-20', useCount: 15, content: '<p>第一条 甲方将位于____的厂房出租给乙方作为生产用地。</p><p>第二条 厂房面积____平方米，年租金为人民币____万元。</p><p>第三条 乙方不得擅自改变厂房结构或用途。</p>' },
  { id: 'TPL-003', name: '办公楼租赁合同', type: '办公楼租赁', version: 'V1.0', updateTime: '2026-04-10', useCount: 8, content: '<p>第一条 甲方将位于____的办公楼____层出租给乙方办公使用。</p><p>第二条 租赁面积____平方米，月租金为人民币____元/平方米。</p>' },
  { id: 'TPL-004', name: '仓储设施租赁合同', type: '仓储租赁', version: 'V1.1', updateTime: '2026-03-08', useCount: 5, content: '<p>第一条 甲方将位于____的仓储设施出租给乙方使用。</p><p>第二条 仓储面积____平方米，年租金为人民币____万元。</p>' }
]

const SEED_CONTRACT_ARCHIVES = [
  { id: 'HT-2025-001', assetName: '城关商铺A-01', tenant: '福州长乐融辉贸易有限公司', archiveDate: '2025-03-15', archiveNo: 'DA-2025-001', storageType: '电子+纸质' },
  { id: 'HT-2025-002', assetName: '航城厂房1#', tenant: '福建省长乐市鸿运纺织有限公司', archiveDate: '2025-04-20', archiveNo: 'DA-2025-002', storageType: '电子' },
  { id: 'HT-2025-003', assetName: '漳港办公楼2层', tenant: '长乐区鑫源投资有限公司', archiveDate: '2025-06-10', archiveNo: 'DA-2025-003', storageType: '电子+纸质' },
  { id: 'HT-2024-001', assetName: '营前仓库B-03', tenant: '福州航城物流有限公司', archiveDate: '2024-02-28', archiveNo: 'DA-2024-001', storageType: '纸质' },
  { id: 'HT-2024-005', assetName: '首占商铺C-08', tenant: '长乐吴航街道陈氏食品店', archiveDate: '2024-08-15', archiveNo: 'DA-2024-005', storageType: '电子' }
]

const SEED_CONTRACT_APPROVALS = [
  {
    leaseNo: 'ZL-2026-015', assetName: '城关商铺A-05', tenant: '长乐区某餐饮管理有限公司', startDate: '2026-10-01', endDate: '2029-09-30', annualRent: 8.5, applyTime: '2026-09-12', status: '待审批',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2026-09-12 10:20', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '', status: '进行中' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '未开始' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' }
    ]
  },
  {
    leaseNo: 'ZL-2026-014', assetName: '航城厂房2#', tenant: '福建某智能装备有限公司', startDate: '2026-10-15', endDate: '2031-10-14', annualRent: 45, applyTime: '2026-09-05', status: '审批中',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2026-09-05 14:30', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-09-07 09:15', status: '已完成' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '进行中' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' }
    ]
  },
  {
    leaseNo: 'ZL-2026-013', assetName: '漳港办公楼3层', tenant: '长乐区鑫源投资有限公司', startDate: '2026-09-01', endDate: '2028-08-31', annualRent: 12, applyTime: '2026-08-20', status: '已通过',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-08-20 11:00', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-08-21 15:40', status: '已完成' },
      { name: '复审', handler: '财务部：陈敏', time: '2026-08-23 10:05', status: '已完成' },
      { name: '审批', handler: '分管领导：郑总', time: '2026-08-25 16:20', status: '已完成' }
    ]
  },
  {
    leaseNo: 'ZL-2026-012', assetName: '首占商铺C-12', tenant: '陈某', startDate: '2026-09-01', endDate: '2027-08-31', annualRent: 2.4, applyTime: '2026-08-10', status: '已驳回',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-08-10 09:30', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-08-12 14:10', status: '已驳回' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '未开始' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' }
    ]
  }
]

const SEED_TENANT_LEDGER = [
  { tenantNo: 'CZF-001', name: '福州长乐融辉贸易有限公司', type: '企业', idNo: '91350112MA31XXXX2K', contact: '王经理', phone: '13805910001', contractCount: 2, registerTime: '2024-03-15' },
  { tenantNo: 'CZF-002', name: '福建省长乐市鸿运纺织有限公司', type: '企业', idNo: '913501827XXXXXX35B', contact: '林总', phone: '13905910002', contractCount: 1, registerTime: '2024-05-20' },
  { tenantNo: 'CZF-003', name: '长乐区鑫源投资有限公司', type: '企业', idNo: '91350112MAXXXX8T7Q', contact: '陈经理', phone: '13705910003', contractCount: 1, registerTime: '2025-01-10' },
  { tenantNo: 'CZF-004', name: '张某', type: '个人', idNo: '3501821990XXXX1234', contact: '张某', phone: '15859100004', contractCount: 1, registerTime: '2025-06-08' },
  { tenantNo: 'CZF-005', name: '长乐吴航街道陈氏食品店', type: '个人', idNo: '92350112MAXXXX6L6D', contact: '陈某', phone: '15959100005', contractCount: 1, registerTime: '2024-08-15' }
]

export const useContractStore = defineStore('contract', () => {
  const contracts = ref([...initialContracts])
  const feeRecords = ref([...initialFees])

  // P1 收编自 Contract.vue 的 5 套附属台账（随后由 storeToRefs 交还页面使用）
  const letterList = ref(JSON.parse(JSON.stringify(SEED_INTENT_LETTERS)))
  const templates = ref(JSON.parse(JSON.stringify(SEED_CONTRACT_TEMPLATES)))
  const archiveList = ref(JSON.parse(JSON.stringify(SEED_CONTRACT_ARCHIVES)))
  const approvalList = ref(JSON.parse(JSON.stringify(SEED_CONTRACT_APPROVALS)))
  const tenantLedger = ref(JSON.parse(JSON.stringify(SEED_TENANT_LEDGER)))
  // P2：审批台合同表（原 Contract.vue 的 acContracts），运行时数据归 store
  const approvalContracts = ref([])

  const allContracts = computed(() => contracts.value)
  const allFees = computed(() => feeRecords.value)

  // 合同/费用本身不带公司字段，归属看它挂在哪个资产上；企业端只放行本公司资产对应的记录
  function entOrg() {
    const user = useUserStore().user
    return user && user.endpoint === 'ent' ? user.org : null
  }

  const visibleContracts = computed(() => {
    const org = entOrg()
    if (!org) return contracts.value
    const assetStore = useAssetStore()
    return contracts.value.filter(c => assetStore.getAssetById(c.assetId)?.group === org)
  })

  const visibleFees = computed(() => {
    const org = entOrg()
    if (!org) return feeRecords.value
    const ids = new Set(visibleContracts.value.map(c => c.id))
    return feeRecords.value.filter(f => ids.has(f.contractId))
  })

  function getContractsByAsset(assetId) {
    return contracts.value.filter(c => c.assetId === assetId)
  }

  function nextContractId() {
    const year = new Date().getFullYear()
    const prefix = `HT-${year}-`
    const max = contracts.value.reduce((m, c) => {
      if (typeof c.id === 'string' && c.id.startsWith(prefix)) {
        const n = parseInt(c.id.slice(prefix.length), 10)
        if (!isNaN(n) && n > m) return n
      }
      return m
    }, 0)
    return `${prefix}${String(max + 1).padStart(3, '0')}`
  }

  function addContract(contract) {
    const newContract = { ...contract, id: nextContractId() }
    contracts.value.push(newContract)
    return newContract
  }

  function updateContract(id, updates) {
    const idx = contracts.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      const before = contracts.value[idx]
      contracts.value[idx] = { ...before, ...updates }
      if (updates.status && updates.status !== before.status && (updates.status === '退租' || updates.status === '已终止')) {
        useAuditStore().recordChange({
          assetId: before.assetId, assetName: before.assetName, module: '合同管理',
          action: updates.status === '退租' ? '合同退租' : '合同终止',
          field: 'status', before: before.status, after: updates.status,
          billNo: before.id, remark: `合同 ${before.id} 状态改为${updates.status}`
        })
        // 合同终止/退租 → 自动把关联的「在管」保证金推到「待审批」，避免人走了保证金还挂在账上
        const financeStore = useFinanceStore()
        financeStore.deposits.forEach(d => {
          if (d.contractId === id && d.status === '在管') {
            financeStore.applyDepositRefund(d.id, {
              reason: `合同 ${id} ${updates.status === '退租' ? '退租' : '终止'}，自动发起保证金退还`
            })
          }
        })
      }
    }
  }

  function updateFeeRecord(contractId, updates) {
    const idx = feeRecords.value.findIndex(f => f.contractId === contractId)
    if (idx !== -1) {
      feeRecords.value[idx] = { ...feeRecords.value[idx], ...updates }
    }
  }

  function getContractById(id) {
    return contracts.value.find(c => c.id === id)
  }

  function getLeaseSummary(asset) {
    const total = asset.area || 0
    const list = contracts.value.filter(c => c.assetId === asset.id && c.status !== '已终止' && c.status !== '退租')
    if (!list.length) {
      const occupied = asset.status === '已出租' || asset.status === '自用'
      return { leasedArea: occupied ? total : 0, availableArea: occupied ? 0 : total, contracts: [] }
    }
    const leasedArea = Math.round(list.reduce((s, c) => s + (c.leaseArea || total), 0) * 100) / 100
    return { leasedArea, availableArea: Math.max(0, Math.round((total - leasedArea) * 100) / 100), contracts: list }
  }

  function addMonths(dateStr, months) {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    d.setMonth(d.getMonth() + months)
    return toISODate(d)
  }

  function activeContractsOfAsset(assetId) {
    return contracts.value.filter(c => c.assetId === assetId && c.status !== '已终止' && c.status !== '退租')
  }

  function syncAssetLeaseState(assetId, meta = {}) {
    const assetStore = useAssetStore()
    const asset = assetStore.getAssetById(assetId)
    if (!asset) return
    const actives = activeContractsOfAsset(assetId)
    const m = {
      module: meta.module || '合同管理',
      action: meta.action || '租赁状态联动',
      billNo: meta.billNo || ''
    }
    if (!actives.length) {
      assetStore.updateAsset(assetId, {
        status: '闲置',
        leaseStatus: '未出租',
        isLeased: '否',
        tenant: null,
        leaseExpiry: null
      }, m)
      return
    }
    const totalLeased = actives.reduce((s, c) => s + (c.leaseArea || asset.area || 0), 0)
    const fullyLeased = asset.area ? totalLeased >= asset.area : true
    const latest = actives.slice().sort((a, b) => (a.endDate < b.endDate ? 1 : -1))[0]
    assetStore.updateAsset(assetId, {
      status: fullyLeased ? '已出租' : '部分出租',
      leaseStatus: fullyLeased ? '已出租' : '部分出租',
      isLeased: '是',
      tenant: latest.tenant,
      leaseExpiry: latest.endDate,
      annualRent: actives.reduce((s, c) => s + (c.annualRent || 0), 0)
    }, m)
  }

  function contractYears(c) {
    const start = new Date(c.startDate)
    const end = new Date(c.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    return Math.max(1, Math.round(months / 12))
  }

  // 首期应计租金（合同期摊月）：从起租日到今天的整计费月数（含当期），封顶合同总月数；未起租为 0。
  function computeAccruedRent(c) {
    const annualRent = c.annualRent || 0
    if (!annualRent) return 0
    const start = new Date(c.startDate)
    const now = new Date()
    if (isNaN(start.getTime()) || start > now) return 0
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
    const end = new Date(c.endDate)
    if (!isNaN(end.getTime())) {
      const dur = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      months = Math.min(months, Math.max(1, dur))
    }
    return Math.round(months * (annualRent / 12) * 100) / 100
  }

  // ---- P2：合同级收款计划，递增 / 免租 / 付款周期结构化后参与金额计算 ----
  const paymentPlans = ref([])
  const PAY_CYCLE_MONTHS = { 月: 1, 季: 3, 半年: 6, 年: 12 }

  function normalizeBillingRules(c) {
    const text = String(c.increment || '')
    const m = text.match(/(\d+(?:\.\d+)?)\s*%/)
    const rate = m ? Number(m[1]) / 100 : 0
    const cycleMonths = text.includes('半年') ? 6 : (text.includes('季') ? 3 : 12)
    return {
      payCycle: c.payCycle || '半年',
      payDay: Number(c.payDay) || 15,
      increment: { type: rate ? '比例' : '固定', rate, cycleMonths },
      free: { months: Number(c.freeMonths) || 0, scope: c.freeScope || '租金' },
      lateFeeRate: Number(c.lateFeeRate) || 0.001
    }
  }

  function addMonths(date, months) {
    const d = new Date(date)
    const day = d.getDate()
    d.setDate(1)
    d.setMonth(d.getMonth() + months)
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()))
    return d
  }

  function fmtDate(d) {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }

  function buildPaymentPlan(contract) {
    const rules = normalizeBillingRules(contract)
    const span = PAY_CYCLE_MONTHS[rules.payCycle] || 6
    const start = new Date(contract.startDate)
    const end = new Date(contract.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return []
    const annualRent = Number(contract.annualRent) || 0
    const rows = []
    let cursor = new Date(start)
    let index = 0
    while (cursor < end && index < 240) {
      let periodEnd = addMonths(cursor, span)
      if (periodEnd > end) periodEnd = new Date(end)
      const months = Math.max(1,
        (periodEnd.getFullYear() - cursor.getFullYear()) * 12 + periodEnd.getMonth() - cursor.getMonth())
      const elapsed = (cursor.getFullYear() - start.getFullYear()) * 12 + cursor.getMonth() - start.getMonth()
      let amount = annualRent / 12 * months
      const steps = Math.floor(elapsed / rules.increment.cycleMonths)
      amount *= Math.pow(1 + rules.increment.rate, steps)
      const freeLeft = Math.max(0, rules.free.months - elapsed)
      if (freeLeft > 0) amount *= Math.max(0, (months - Math.min(freeLeft, months)) / months)
      const due = new Date(cursor.getFullYear(), cursor.getMonth(), rules.payDay)
      rows.push({
        id: `${contract.id}-P${String(index + 1).padStart(2, '0')}`,
        contractId: contract.id,
        seq: index + 1,
        payCycle: rules.payCycle,
        period: `${fmtDate(cursor)} 至 ${fmtDate(periodEnd)}`,
        periodStart: fmtDate(cursor),
        periodEnd: fmtDate(periodEnd),
        amount: Math.round(amount * 100) / 100,
        paidAmount: 0,
        dueDate: fmtDate(due),
        status: '待缴',
        billNo: ''
      })
      cursor = addMonths(cursor, months)
      index++
    }
    return rows
  }

  function getPaymentPlan(contractId) {
    return paymentPlans.value.filter(p => p.contractId === contractId)
  }

  // 已有合同（seed / 历史）首次加载时补建收款计划；新合同在 signContract 中生成
  if (!paymentPlans.value.length) {
    contracts.value.forEach(c => paymentPlans.value.push(...buildPaymentPlan(c)))
  }

  function signContract(payload) {
    const assetStore = useAssetStore()
    const before = assetStore.getAssetById(payload.assetId)
    const wasIdle = !!before && (before.status === '闲置' || before.status === '空置')

    const contract = addContract(payload)
    const plan = buildPaymentPlan(contract)
    paymentPlans.value.push(...plan)
    const firstAmount = plan.length ? (plan[0]?.amount ?? 0) : computeAccruedRent(contract)
    const num = Math.max(0, ...feeRecords.value.map(r => Number(r.id) || 0)) + 1
    const accrued = computeAccruedRent(contract)
    feeRecords.value.push({
      id: num,
      contractId: contract.id,
      assetId: contract.assetId || null,
      assetName: contract.assetName,
      tenant: contract.tenant,
      cumReceivable: accrued,
      cumActual: 0,
      yearReceivable: contract.annualRent || 0,
      yearActual: 0,
      arrears: 0,
      status: '正常'
    })
    syncAssetLeaseState(contract.assetId, { action: '签约联动', billNo: contract.id })

    // 已起租且挂到真实资产的合同，签约即生成首期租金账单，供收费大厅收款并计入工作台应收
    const signedAsset = assetStore.getAssetById(contract.assetId)
    if (signedAsset && firstAmount > 0) {
      const now = new Date()
      const p = n => String(n).padStart(2, '0')
      const billMonth = `${now.getFullYear()}-${p(now.getMonth() + 1)}`
      const due = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0)
      useFinanceStore().addBill({
        contractId: contract.id,
        tenant: contract.tenant,
        assetId: signedAsset.id,
        assetName: contract.assetName || signedAsset.name,
        feeType: '租金',
        billMonth,
        billPeriod: plan[0]?.period || billMonth,
        receivable: wanToYuan(firstAmount),
        received: 0,
        dueDate: `${due.getFullYear()}-${p(due.getMonth() + 1)}-${p(due.getDate())}`,
        status: '待缴费'
      })
    }

    // 合同约定了保证金则自动生成保证金记录，金额由万元转元；签约时未必当场到账，默认「待收」
    const financeStore = useFinanceStore()
    if (contract.deposit > 0 && signedAsset) {
      financeStore.addDeposit({
        contractId: contract.id,
        tenant: contract.tenant,
        assetId: signedAsset.id,
        assetName: contract.assetName || signedAsset.name,
        depositType: '租赁保证金',
        amount: wanToYuan(contract.deposit || 0),
        payDate: contract.startDate || todayStr(),
        payStatus: '待收',
        assets: [{
          region: signedAsset.region || '',
          project: signedAsset.project || signedAsset.group || '',
          zone: signedAsset.zone || '',
          assetNo: signedAsset.id,
          address: contract.assetName || signedAsset.name,
          company: signedAsset.group || '',
          leaseType: signedAsset.leaseType || '整体出租'
        }]
      })
    }

    // 承租方一律落客商档案，不允许只留自由文本
    usePartyStore().resolveParty({ name: contract.tenant, contact: contract.contact, phone: contract.phone })

    const asset = assetStore.getAssetById(contract.assetId)
    useAuditStore().recordEvent({
      assetId: contract.assetId,
      assetName: contract.assetName,
      group: asset?.group || '',
      module: '合同管理',
      action: '签订合同',
      billNo: contract.id,
      remark: `承租方 ${contract.tenant}，年租金 ${contract.annualRent || 0} 万元`,
      detail: `${contract.startDate} 至 ${contract.endDate} / 面积 ${contract.leaseArea || 0}㎡`
    })

    // 主链 I：签约成果自动归集到盘活流水，完成率随之上升
    const years = contractYears(contract)
    useRevitalizeStore().recordRevitalize({
      year: String(contract.startDate || '').slice(0, 4) || String(new Date().getFullYear()),
      sourceType: wasIdle ? '闲置盘活' : '招租签约',
      docNo: contract.id,
      company: asset?.group || '',
      assetId: contract.assetId,
      assetName: contract.assetName,
      amount: Math.round((contract.annualRent || 0) * years * 100) / 100,
      count: 1,
      auto: true,
      remark: `${years} 年期合同，年租金 ${contract.annualRent || 0} 万元`
    })

    useNotifyStore().sendByTemplate('contract_signed', {
      contractNo: contract.id,
      asset: contract.assetName,
      tenant: contract.tenant,
      rent: contract.annualRent || 0
    }, { target: asset?.group || 'ent', bizType: 'contract', bizId: contract.id, route: '/ent/contract-approval' })

    return contract
  }

  function renewContract(contractId, months) {
    const c = getContractById(contractId)
    if (!c) return null
    const oldEnd = c.endDate
    const newEnd = addMonths(c.endDate, months)
    updateContract(contractId, { endDate: newEnd, status: '正常', overdueDays: 0 })
    const asset = useAssetStore().getAssetById(c.assetId)
    useAuditStore().recordChange({
      assetId: c.assetId,
      assetName: c.assetName,
      group: asset?.group || '',
      module: '合同管理',
      action: '合同续租',
      field: 'endDate',
      before: oldEnd,
      after: newEnd,
      billNo: contractId,
      remark: `续租 ${months} 个月`
    })
    syncAssetLeaseState(c.assetId, { action: '续租联动', billNo: contractId })
    return newEnd
  }

  function terminateContract(contractId, reason) {
    const c = getContractById(contractId)
    if (!c) return
    updateContract(contractId, { status: '已终止', terminateReason: reason || '', arrears: c.arrears || 0 })
    const asset = useAssetStore().getAssetById(c.assetId)
    useAuditStore().recordEvent({
      assetId: c.assetId,
      assetName: c.assetName,
      group: asset?.group || '',
      module: '合同管理',
      action: '合同终止',
      billNo: contractId,
      remark: reason || '退租',
      detail: `承租方 ${c.tenant}，终止时欠费 ${c.arrears || 0} 万元`
    })
    syncAssetLeaseState(c.assetId, { action: '退租联动', billNo: contractId })
  }

  /**
   * 通用状态变更入口：改状态 + 可选附带字段，统一留痕。
   * 用于续租/退租/电子签章等既需要写状态、又需要写业务动作字段的场景。
   * meta = { module, action, remark, detail, fields }  fields 为随状态一起写入的附加字段
   */
  function updateContractStatus(id, status, meta = {}) {
    const c = getContractById(id)
    if (!c) return false
    const beforeStatus = c.status
    updateContract(id, { status, ...(meta.fields || {}) })
    const asset = useAssetStore().getAssetById(c.assetId)
    useAuditStore().recordEvent({
      assetId: c.assetId,
      assetName: c.assetName,
      group: asset?.group || '',
      module: meta.module || '合同管理',
      action: meta.action || '状态变更',
      billNo: id,
      remark: meta.remark || `合同状态：${beforeStatus} → ${status}`,
      detail: meta.detail || ''
    })
    // 退租 / 终止要联动资产租赁状态，正常类状态变更不动资产
    if (status === '退租' || status === '已终止') {
      syncAssetLeaseState(c.assetId, { action: '退租联动', billNo: id, module: meta.module })
    }
    return true
  }

  function todayStr() {
    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  }

  function payFee(contractId, amount) {
    const fee = feeRecords.value.find(f => f.contractId === contractId)
    const c = getContractById(contractId)
    if (!fee || !c) return
    const paid = (fee.cumActual || 0) + amount
    const arrears = Math.max(0, Math.round(((fee.cumReceivable || 0) - paid) * 100) / 100)
    const status = arrears > 0 ? '欠缴' : '正常'
    const beforeActual = fee.cumActual || 0
    feeRecords.value[feeRecords.value.indexOf(fee)] = {
      ...fee,
      cumActual: paid,
      yearActual: (fee.yearActual || 0) + amount,
      arrears,
      status,
      payments: [...(fee.payments || []), { date: todayStr(), amount }]
    }
    updateContract(contractId, { arrears, status: arrears > 0 ? '欠缴' : c.status })
    const asset = useAssetStore().getAssetById(c.assetId)
    useAuditStore().recordChange({
      assetId: c.assetId,
      assetName: c.assetName,
      group: asset?.group || '',
      module: '收费大厅',
      action: '收费入账',
      field: 'cumActual',
      before: beforeActual,
      after: paid,
      billNo: contractId,
      remark: `本次收缴 ${amount} 万元，剩余欠费 ${arrears} 万元`
    })
    useAuditStore().recordEvent({
      assetId: c.assetId, assetName: c.assetName, module: '收费', action: '缴费登记',
      bizId: contractId, detail: `欠缴 ${c.arrears || 0} 万元，本次缴纳 ${amount} 万元，余欠 ${arrears} 万元`
    })
    return { paid, arrears, status }
  }

  /**
   * 项目口径的实收归集：逐笔收缴流水 → 合同 → 资产 → 所属项目，
   * 房间级资产与挂入项目的平铺资产都会算进来，看板不再用写死的柱状图。
   */
  function projectReceipts(projectId) {
    const round = v => Math.round(v * 100) / 100
    const assetIds = new Set(useAssetStore().getProjectAssets(projectId).map(a => a.id))
    const contractIds = new Set(visibleContracts.value.filter(c => assetIds.has(c.assetId)).map(c => c.id))
    const fees = feeRecords.value.filter(f => contractIds.has(f.contractId))

    const now = new Date()
    const ymKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const sumBy = (key) => fees.reduce((s, f) => s + (f.payments || []).reduce(
      (p, x) => String(x.date || '').slice(0, 7) === key ? p + (Number(x.amount) || 0) : p, 0), 0)
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ m: `${d.getMonth() + 1}月`, v: round(sumBy(ymKey(d))) })
    }
    // 台账的项目总览柱状图轴是固定 1-12 月，需按自然年对齐，不能复用滚动窗口
    const yearMonths = Array.from({ length: 12 }, (_, i) =>
      round(sumBy(ymKey(new Date(now.getFullYear(), i, 1)))))

    const yearReceivable = round(fees.reduce((s, f) => s + (f.yearReceivable || 0), 0))
    const monthlyPlan = yearReceivable / 12
    const lastMonth = months[months.length - 2]
    const lastMonthActual = lastMonth ? lastMonth.v : 0
    return {
      cumActual: round(fees.reduce((s, f) => s + (f.cumActual || 0), 0)),
      yearActual: round(fees.reduce((s, f) => s + (f.yearActual || 0), 0)),
      yearReceivable,
      months,
      yearMonths,
      monthlyPlan: round(monthlyPlan),
      lastMonthActual,
      lastMonthArrears: round(Math.max(0, monthlyPlan - lastMonthActual)),
      lastMonthRate: monthlyPlan > 0 && lastMonth
        ? Math.min(100, Math.round(lastMonth.v / monthlyPlan * 1000) / 10)
        : 0
    }
  }

  // P1 续：意向书台账适配层。IntentLedger.vue 与合同主页面共用同一份 letterList，
  // 这里把合同域字段投影成台账页历史字段，避免页面再自带一份 intentData。
  const intentLedgerRows = computed(() => letterList.value.map(l => ({
    id: l.id,
    intentNo: l.id,
    customer: l.lessee || '',
    contact: l.contact || '',
    assetName: l.assetName || '',
    intentArea: Number(l.intentArea) || 0,
    intentRent: l.intentRent != null ? Number(l.intentRent) : Math.round(wanToYuan(Number(l.intentAmount) || 0) / 12),
    purpose: l.purpose || l.remark || '',
    follower: l.operator || l.lessor || '',
    registerDate: l.registerDate || l.startDate || '',
    status: l.status === '已签约' ? '已签约' : (l.status === '已终止' ? '已放弃' : '洽谈中'),
    remark: l.remark || ''
  })))

  function addIntent(payload) {
    const year = new Date().getFullYear()
    const prefix = `YXS-${year}-`
    const intentId = nextSeqNo(prefix, letterList.value.map(l => l.id), 3)
    const rent = Number(payload.intentRent) || 0
    const row = {
      id: intentId,
      lessor: '',
      lessee: payload.customer || '',
      contact: payload.contact || '',
      assetId: '',
      assetName: payload.assetName || '',
      intentArea: Number(payload.intentArea) || 0,
      intentRent: rent,
      intentAmount: Math.round(rent * 12 / 1000) / 10,
      startDate: todayISO(),
      endDate: '',
      rentFreeType: '无',
      freeMonths: 0,
      feeReduction: '',
      purpose: payload.purpose || '',
      operator: payload.follower || '',
      registerDate: todayISO(),
      status: '洽谈中',
      remark: payload.remark || ''
    }
    letterList.value.unshift(row)
    return row
  }

  function updateIntent(id, payload) {
    const row = letterList.value.find(l => l.id === id)
    if (!row) return null
    const rent = Number(payload.intentRent ?? row.intentRent) || 0
    Object.assign(row, {
      lessee: payload.customer ?? row.lessee,
      contact: payload.contact ?? row.contact,
      assetName: payload.assetName ?? row.assetName,
      intentArea: Number(payload.intentArea ?? row.intentArea) || 0,
      intentRent: rent,
      intentAmount: Math.round(rent * 12 / 1000) / 10,
      purpose: payload.purpose ?? row.purpose,
      operator: payload.follower ?? row.operator,
      remark: payload.remark ?? row.remark
    })
    return row
  }

  // 转合同：真正创建正式合同（含应收、首期账单、保证金、资产租赁态联动），不再只改本地状态
  function convertIntentToContract(id) {
    const row = letterList.value.find(l => l.id === id)
    if (!row || row.status === '已签约') return null
    const contract = signContract({
      assetId: row.assetId || '',
      assetName: row.assetName || '',
      tenant: row.lessee || '',
      leaseArea: row.intentArea || 0,
      startDate: row.startDate || todayISO(),
      endDate: row.endDate || '',
      annualRent: Number(row.intentAmount) || 0,
      status: '正常'
    })
    row.status = '已签约'
    return contract
  }

  return {
    contracts,
    feeRecords,
    paymentPlans,
    letterList,
    approvalContracts,
    intentLedgerRows,
    addIntent,
    updateIntent,
    convertIntentToContract,
    normalizeBillingRules,
    buildPaymentPlan,
    getPaymentPlan,
    templates,
    archiveList,
    approvalList,
    tenantLedger,
    allContracts,
    allFees,
    visibleContracts,
    visibleFees,
    getContractsByAsset,
    activeContractsOfAsset,
    addContract,
    updateContract,
    updateFeeRecord,
    getContractById,
    getLeaseSummary,
    signContract,
    renewContract,
    terminateContract,
    updateContractStatus,
    payFee,
    projectReceipts,
    syncAssetLeaseState
  }
})
