import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { evaluationRecords } from '../data/mock'
import { useContractStore } from './contract'
import { useAssetStore } from './asset'
import { useMortgageStore } from './mortgage'
import { useAuditStore } from './audit'
import { useUserStore } from './user'

const COMPANIES = ['城投集团', '产投集团', '水投集团', '领航公司']

// 收益法反推市场租金：评估值 × 年化收益率 ÷ 面积 ÷ 12
const CAP_RATE = 0.05

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function today() { return nowStr().slice(0, 10) }

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

/** 万元 → 元（税费页口径为元，开票/收入页口径为万元） */
function wanToYuan(wan) { return Math.round((Number(wan) || 0) * 10000) }

const SEED_INVOICES = [
  { invoiceNo: 'FP-2026-001', invoiceType: '增值税普通发票', tenant: '福州长乐融辉贸易有限公司', contractId: 'HT-2023-018', assetName: '吴航街道商业街 A-01 商铺', amount: 21, taxRate: 5, tax: 1.05, issueDate: '2026-06-30', invoiceStatus: '已开具', auto: false },
  { invoiceNo: 'FP-2026-002', invoiceType: '增值税专用发票', tenant: '福建省长乐市鸿运纺织有限公司', contractId: 'HT-2025-006', assetName: '航城商务楼 3F', amount: 35, taxRate: 5, tax: 1.75, issueDate: '2026-05-15', invoiceStatus: '已开具', auto: true },
  { invoiceNo: 'FP-2026-003', invoiceType: '电子发票', tenant: '长乐区鑫源投资有限公司', contractId: 'HT-2024-012', assetName: '首占新区保障房 1# 楼', amount: 12, taxRate: 5, tax: 0.6, issueDate: '2026-07-10', invoiceStatus: '已开具', auto: true },
  { invoiceNo: 'FP-2026-004', invoiceType: '增值税普通发票', tenant: '福州航城物流有限公司', contractId: 'HT-2024-007', assetName: '营前标准厂房 2#', amount: 8, taxRate: 5, tax: 0.4, issueDate: '2026-08-02', invoiceStatus: '待开具', auto: false },
  { invoiceNo: 'FP-2025-012', invoiceType: '增值税普通发票', tenant: '福州航城物流有限公司', contractId: 'HT-2024-007', assetName: '营前标准厂房 2#', amount: 8, taxRate: 5, tax: 0.4, issueDate: '2025-12-20', invoiceStatus: '已红冲', auto: false }
]

const SEED_EXPENSES = [
  { expenseNo: 'FY-2026-001', assetName: '城关商铺A-01', expenseType: '维修费', amount: 2.5, occurDate: '2026-08-10', supplier: '长乐区建安装修工程队', expenseVoucher: 'PZ-2026-08-050' },
  { expenseNo: 'FY-2026-002', assetName: '航城厂房1#', expenseType: '水电费', amount: 1.8, occurDate: '2026-08-15', supplier: '国网福建省长乐区供电公司', expenseVoucher: '' },
  { expenseNo: 'FY-2026-003', assetName: '漳港办公楼2层', expenseType: '物业费', amount: 0.6, occurDate: '2026-08-20', supplier: '长乐航城物业管理有限公司', expenseVoucher: '' },
  { expenseNo: 'FY-2026-004', assetName: '营前仓库B-03', expenseType: '保险费', amount: 0.35, occurDate: '2026-07-01', supplier: '中国人民财产保险长乐支公司', expenseVoucher: 'PZ-2026-07-012' },
  { expenseNo: 'FY-2026-005', assetName: '城关旧厂房3#', expenseType: '折旧费', amount: 12, occurDate: '2026-08-31', supplier: '-', expenseVoucher: '' }
]

const SEED_ACCOUNTS = [
  { bizType: '租金收入', bizField: 'annualRent', accountCode: '6001', accountName: '主营业务收入-租金', direction: '贷' },
  { bizType: '保证金收取', bizField: 'deposit', accountCode: '2241', accountName: '其他应付款-保证金', direction: '贷' },
  { bizType: '维修费用', bizField: 'repairCost', accountCode: '6602', accountName: '管理费用-维修费', direction: '借' },
  { bizType: '水电费用', bizField: 'utilityCost', accountCode: '6602', accountName: '管理费用-水电费', direction: '借' },
  { bizType: '折旧费用', bizField: 'depreciation', accountCode: '6602', accountName: '管理费用-折旧费', direction: '借' }
]

// 税目口径：房产税从租计征 12%，增值税按开票销售额，印花税按合同租金总额，土地使用税按面积
const SEED_TAX_RULES = [
  { taxType: '房产税', basis: 'contractRent', rate: 12, rateText: '12%', deadlineMonth: 10, enabled: true, remark: '从租计征：年租金 × 12%' },
  { taxType: '增值税', basis: 'invoice', rate: 9, rateText: '9%', deadlineMonth: 10, enabled: true, remark: '销项税：开票金额 ÷ (1+9%) × 9%' },
  { taxType: '印花税', basis: 'contractTotal', rate: 0.1, rateText: '0.1%', deadlineMonth: 9, enabled: true, remark: '财产租赁合同：租金总额 × 0.1%' },
  { taxType: '土地使用税', basis: 'landArea', rate: 6, rateText: '6元/㎡', deadlineMonth: 12, enabled: true, remark: '土地类资产：应税面积 × 6 元/㎡' }
]

const SEED_INVOICE_RATES = [
  { bizType: '租金', invoiceType: '增值税普通发票', rate: 5, remark: '不动产经营租赁服务', enabled: true },
  { bizType: '物业费', invoiceType: '增值税普通发票', rate: 6, remark: '现代服务-物业管理', enabled: true },
  { bizType: '租金', invoiceType: '增值税专用发票', rate: 9, remark: '一般纳税人不动产租赁', enabled: true },
  { bizType: '临时占道费', invoiceType: '电子发票', rate: 3, remark: '小规模纳税人征收率', enabled: false }
]

const SEED_TAX_RECORDS = [
  { id: 1, taxNo: 'TAX20240901', taxType: '房产税', relatedAsset: '滨江科技园A座8层', taxBase: 8000000, taxRate: '1.2%', taxAmount: 96000, deadline: '2024-10-31', payStatus: '待缴纳' },
  { id: 2, taxNo: 'TAX20240902', taxType: '增值税', relatedAsset: '滨江科技园A座8层', taxBase: 58000, taxRate: '9%', taxAmount: 5220, deadline: '2024-10-15', payStatus: '已缴纳' },
  { id: 3, taxNo: 'TAX20240903', taxType: '印花税', relatedAsset: 'HT20240201', taxBase: 2160000, taxRate: '0.1%', taxAmount: 2160, deadline: '2024-09-30', payStatus: '已逾期' },
  { id: 4, taxNo: 'TAX20240904', taxType: '土地使用税', relatedAsset: '余杭区仓储中心3号库', taxBase: 12000, taxRate: '6元/㎡', taxAmount: 72000, deadline: '2024-12-31', payStatus: '待缴纳' },
  { id: 5, taxNo: 'TAX20240905', taxType: '房产税', relatedAsset: '西湖区文三路商铺', taxBase: 3200000, taxRate: '1.2%', taxAmount: 38400, deadline: '2024-10-31', payStatus: '待缴纳' },
  { id: 6, taxNo: 'TAX20240906', taxType: '增值税', relatedAsset: '西湖区文三路商铺', taxBase: 22000, taxRate: '9%', taxAmount: 1980, deadline: '2024-10-15', payStatus: '已缴纳' },
  { id: 7, taxNo: 'TAX20240907', taxType: '印花税', relatedAsset: 'HT20230801', taxBase: 1740000, taxRate: '0.1%', taxAmount: 1740, deadline: '2024-08-31', payStatus: '已逾期' },
  { id: 8, taxNo: 'TAX20240908', taxType: '房产税', relatedAsset: '余杭区仓储中心3号库', taxBase: 5400000, taxRate: '1.2%', taxAmount: 64800, deadline: '2024-10-31', payStatus: '待缴纳' }
]

// ===== 收费 / 账单 / 保证金 共享种子 =====
// 收费台账本身仍然以 contractStore.feeRecords 为唯一来源；下面这两个数组承接 Fee.vue 与
// UserBills.vue / DepositReturn.vue 三页共同消费的账单与保证金流水，
// 保证 收款 → 实收 → 开票 → 税费 → 资债全览 沿同一条数据链走。
const SEED_BILLS = [
  { id: 1, billNo: 'ZD-2026-001', contractId: 'HT-2023-018', tenant: '福州××商业管理有限公司', assetName: '吴航街道商业街 A-01 商铺', feeType: '租金', billMonth: '2026-06', billPeriod: '2026-01 至 2026-06', receivable: 105000, received: 105000, dueDate: '2026-06-30', status: '已缴费', createTime: '2026-06-01 09:05:00', updateTime: '2026-06-30 15:20:00' },
  { id: 2, billNo: 'ZD-2026-002', contractId: 'HT-2025-006', tenant: '福建××科技有限公司', assetName: '航城商务楼 3F', feeType: '租金', billMonth: '2026-06', billPeriod: '2026-01 至 2026-06', receivable: 780000, received: 780000, dueDate: '2026-06-30', status: '已缴费', createTime: '2026-06-01 09:06:12', updateTime: '2026-06-30 15:22:40' },
  { id: 3, billNo: 'ZD-2026-003', contractId: 'HT-2024-007', tenant: '长乐××物流有限公司', assetName: '营前标准厂房 2#', feeType: '租金', billMonth: '2026-07', billPeriod: '2026-07 至 2026-12', receivable: 292500, received: 0, dueDate: '2026-07-15', status: '待缴费', createTime: '2026-07-01 09:12:00', updateTime: '2026-07-01 09:12:00' },
  { id: 4, billNo: 'ZD-2026-004', contractId: 'HT-2024-012', tenant: '长乐××物业管理有限公司', assetName: '首占新区保障房 1# 楼', feeType: '租金', billMonth: '2026-07', billPeriod: '2026-07 至 2026-12', receivable: 240000, received: 0, dueDate: '2026-07-20', status: '待缴费', createTime: '2026-07-01 09:14:30', updateTime: '2026-07-01 09:14:30' },
  { id: 5, billNo: 'ZD-2026-005', contractId: 'HT-2024-015', tenant: '长乐××市场管理有限公司', assetName: '吴航农贸市场', feeType: '物业费', billMonth: '2026-06', billPeriod: '2026-06', receivable: 12000, received: 0, dueDate: '2026-06-30', status: '已逾期', createTime: '2026-06-01 09:20:00', updateTime: '2026-07-05 10:00:00' },
  { id: 6, billNo: 'ZD-2026-006', contractId: 'HT-2023-018', tenant: '福州××商业管理有限公司', assetName: '吴航街道商业街 A-01 商铺', feeType: '水电费', billMonth: '2026-07', billPeriod: '2026-07', receivable: 3800, received: 0, dueDate: '2026-07-31', status: '待缴费', createTime: '2026-07-01 09:22:00', updateTime: '2026-07-01 09:22:00' }
]

// status 是唯一的保证金状态字段，取值：在管 / 待审批 / 已退还 / 已驳回；
// Fee.vue 的保证金管理页把它折叠成 '在管 / 待退还 / 已退还' 三态展示，DepositReturn 页用完整四态。
const SEED_DEPOSITS = [
  { id: 1, depositNo: 'BZJ-2023-001', contractId: 'HT-2023-018', tenant: '福州××商业管理有限公司', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', depositType: '租赁保证金', amount: 84000, payDate: '2023-05-01', payTime: '2023-05-01 10:22:31', operator: '王丽', payStatus: '已收', applyNo: '', applyDate: '', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '在管', assets: [{ region: '福建省福州市长乐区', project: '吴航街道', zone: 'A区', assetNo: 'CT-001', address: '吴航街道商业街 A-01 商铺', company: '城投集团', leaseType: '整体出租' }] },
  { id: 2, depositNo: 'BZJ-2025-002', contractId: 'HT-2025-006', tenant: '福建××科技有限公司', assetId: 'CT-002', assetName: '航城商务楼 3F', depositType: '租赁保证金', amount: 312000, payDate: '2025-01-01', payTime: '2025-01-01 09:12:04', operator: '陈强', payStatus: '已收', applyNo: '', applyDate: '', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '在管', assets: [{ region: '福建省福州市长乐区', project: '航城街道', zone: 'B区', assetNo: 'CT-002', address: '航城商务楼 3F 整层', company: '产投集团', leaseType: '整体出租' }] },
  { id: 3, depositNo: 'BZJ-2024-003', contractId: 'HT-2024-007', tenant: '长乐××物流有限公司', assetId: 'CT-003', assetName: '营前标准厂房 2#', depositType: '履约保证金', amount: 156000, payDate: '2024-03-01', payTime: '2024-03-01 14:05:47', operator: '李芳', payStatus: '已收', applyNo: 'REF-2026-001', applyDate: '2026-08-12', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '待审批', assets: [{ region: '福建省福州市长乐区', project: '营前街道', zone: 'C区', assetNo: 'CT-003', address: '营前标准厂房 2#', company: '水投集团', leaseType: '整体出租' }] },
  { id: 4, depositNo: 'BZJ-2024-004', contractId: 'HT-2024-012', tenant: '长乐××物业管理有限公司', assetId: 'CT-004', assetName: '首占新区保障房 1# 楼', depositType: '租赁保证金', amount: 192000, payDate: '2024-06-01', payTime: '2024-06-01 16:32:09', operator: '王丽', payStatus: '已收', applyNo: 'REF-2026-002', applyDate: '2026-07-05', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '已退还', refundDate: '2026-07-20', refundAmount: 192000, refundMethod: '银行转账', assets: [{ region: '福建省福州市长乐区', project: '首占新区', zone: 'A区', assetNo: 'CT-004', address: '首占新区保障房 1# 楼', company: '领航公司', leaseType: '部分出租' }] },
  { id: 5, depositNo: 'BZJ-2024-005', contractId: 'HT-2024-015', tenant: '长乐××市场管理有限公司', assetId: 'CT-007', assetName: '吴航农贸市场', depositType: '履约保证金', amount: 136000, payDate: '2024-01-01', payTime: '2024-01-01 11:18:55', operator: '李芳', payStatus: '已收', applyNo: '', applyDate: '', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '在管', assets: [{ region: '福建省福州市长乐区', project: '吴航街道', zone: 'B区', assetNo: 'CT-007', address: '吴航农贸市场', company: '水投集团', leaseType: '整体出租' }] },
  { id: 6, depositNo: 'BZJ-2026-006', contractId: 'HT-2024-007', tenant: '长乐××物流有限公司', assetId: 'CT-003', assetName: '营前标准厂房 2#', depositType: '租赁保证金', amount: 78000, payDate: '2026-02-05', payTime: '—', operator: '—', payStatus: '待收', applyNo: 'REF-2026-003', applyDate: '2026-08-28', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '待审批', assets: [{ region: '福建省福州市长乐区', project: '营前街道', zone: 'C区', assetNo: 'CT-003', address: '营前标准厂房 2#（补充保证金）', company: '水投集团', leaseType: '整体出租' }] }
]

export const useFinanceStore = defineStore('finance', () => {
  const invoices = ref(JSON.parse(JSON.stringify(SEED_INVOICES)))
  const expenses = ref(JSON.parse(JSON.stringify(SEED_EXPENSES)))
  const accountMappings = ref(JSON.parse(JSON.stringify(SEED_ACCOUNTS)))
  const taxRules = ref(JSON.parse(JSON.stringify(SEED_TAX_RULES)))
  const invoiceRates = ref(JSON.parse(JSON.stringify(SEED_INVOICE_RATES)))
  const taxRecords = ref(JSON.parse(JSON.stringify(SEED_TAX_RECORDS)))
  const vouchers = ref([])
  const priceOverrides = ref([])
  const reconciles = ref([])
  // 收费/账单/保证金三页共享的底层状态：
  // - 收费台账以 contractStore.feeRecords 为唯一源，这里通过 feeList 只暴露企业端可见的那一份
  // - 账单 bills 与保证金 deposits 独立存于 finance，收款/退还会回写到 contract.feeRecords
  const bills = ref(JSON.parse(JSON.stringify(SEED_BILLS)))
  const deposits = ref(JSON.parse(JSON.stringify(SEED_DEPOSITS)))
  const receipts = ref([])

  // 企业端只放行本公司所属合同对应的账单/保证金；gov 端全部可见
  function entOrg() {
    const u = useUserStore().user
    return u && u.endpoint === 'ent' ? u.org : null
  }

  function groupOfContract(contractId) {
    if (!contractId) return ''
    const contractStore = useContractStore()
    const c = contractStore.getContractById(contractId)
    if (!c) return ''
    return useAssetStore().getAssetById(c.assetId)?.group || ''
  }

  // contract.feeRecords 的只读投影，与 contractStore.visibleFees 同源；三页统一从这里取
  const feeList = computed(() => {
    const contractStore = useContractStore()
    return contractStore.visibleFees
  })

  const billList = computed(() => {
    const org = entOrg()
    if (!org) return bills.value
    return bills.value.filter(b => groupOfContract(b.contractId) === org)
  })

  const depositList = computed(() => {
    const org = entOrg()
    if (!org) return deposits.value
    return deposits.value.filter(d => groupOfContract(d.contractId) === org)
  })

  function getReceipt(receiptNo) {
    return receipts.value.find(r => r.receiptNo === receiptNo) || null
  }

  function findFee(feeId) {
    const contractStore = useContractStore()
    const fees = contractStore.feeRecords
    const asNum = Number(feeId)
    return fees.find(f =>
      f.contractId === feeId ||
      f.id === feeId ||
      (!Number.isNaN(asNum) && f.id === asNum)
    ) || null
  }

  // 收款：金额单位统一走万元；contract.feeRecords 更新 → 实收 / 欠缴 全链贯通
  function receivePayment(feeId, { amount, method = '线上缴费', date, operator } = {}) {
    const contractStore = useContractStore()
    const fee = findFee(feeId)
    if (!fee) return null
    const amt = round2(Number(amount) || 0)
    if (amt <= 0) return null
    const contractId = fee.contractId
    const res = contractStore.payFee(contractId, amt)
    const stamp = nowStr()
    const payDate = date || stamp.slice(0, 10)
    const receiptNo = `SK-${String(receipts.value.length + 1).padStart(6, '0')}`
    const receipt = {
      receiptNo,
      contractId,
      feeId: fee.id,
      tenant: fee.tenant,
      assetId: fee.assetId || '',
      assetName: fee.assetName,
      amount: amt,
      method,
      date: payDate,
      operator: operator || useUserStore().user?.name || '收费员',
      createdAt: stamp
    }
    receipts.value.push(receipt)
    useAuditStore().recordEvent({
      assetId: fee.assetId || '',
      assetName: fee.assetName,
      group: groupOfContract(contractId),
      module: '收费',
      action: '收款',
      billNo: contractId,
      remark: `${method} 收缴 ${amt} 万元，凭证号 ${receiptNo}`,
      detail: `承租方 ${fee.tenant}，收款日期 ${payDate}`
    })
    return { ...res, receiptNo, amount: amt, contractId }
  }

  // 退还保证金：改状态 + 留痕；金额单位元
  function refundDeposit(depositId, { amount, date, method = '银行转账', deduct = 0, reason = '' } = {}) {
    const idx = deposits.value.findIndex(d => d.id === depositId)
    if (idx === -1) return null
    const d = deposits.value[idx]
    const amt = round2(Number(amount ?? d.amount))
    const refundDate = date || today()
    deposits.value[idx] = {
      ...d,
      status: '已退还',
      payStatus: d.payStatus === '已收' ? '已收' : '已收',
      refundAmount: amt,
      refundDate,
      refundMethod: method,
      refundDeduct: round2(Number(deduct) || 0),
      refundReason: reason
    }
    const assetStore = useAssetStore()
    const asset = assetStore.getAssetById(d.assetId)
    useAuditStore().recordEvent({
      assetId: d.assetId || '',
      assetName: d.assetName,
      group: asset?.group || groupOfContract(d.contractId),
      module: '保证金',
      action: '退还保证金',
      billNo: d.applyNo || d.depositNo,
      remark: `${d.tenant} 退还保证金 ${amt} 元（${method}）${reason ? '，原因：' + reason : ''}`,
      detail: `退还日期 ${refundDate}，扣减 ${round2(Number(deduct) || 0)} 元`
    })
    return deposits.value[idx]
  }

  // 现场收 / 补缴保证金：payStatus 由 '待收' 转 '已收'
  function collectDeposit(depositId, { amount, method = '现金', date, operator } = {}) {
    const idx = deposits.value.findIndex(d => d.id === depositId)
    if (idx === -1) return null
    const d = deposits.value[idx]
    const amt = round2(Number(amount ?? d.amount))
    const stamp = nowStr()
    deposits.value[idx] = {
      ...d,
      payStatus: '已收',
      amount: amt,
      payTime: date ? `${date} ${stamp.slice(11)}` : stamp,
      operator: operator || useUserStore().user?.name || '收费员'
    }
    const asset = useAssetStore().getAssetById(d.assetId)
    useAuditStore().recordEvent({
      assetId: d.assetId || '',
      assetName: d.assetName,
      group: asset?.group || groupOfContract(d.contractId),
      module: '保证金',
      action: '现场收取保证金',
      billNo: d.applyNo || d.depositNo,
      remark: `${d.tenant} 现场缴纳保证金 ${amt} 元（${method}）`
    })
    return deposits.value[idx]
  }

  // 保证金退还申请：状态转 '待审批' + 生成退还申请号
  function applyDepositRefund(depositId, { reason = '', applyDate, amount } = {}) {
    const idx = deposits.value.findIndex(d => d.id === depositId)
    if (idx === -1) return null
    const d = deposits.value[idx]
    const no = d.applyNo || `REF-${new Date().getFullYear()}-${String(deposits.value.filter(x => x.applyNo).length + 1).padStart(3, '0')}`
    const stamp = applyDate || today()
    deposits.value[idx] = {
      ...d,
      status: '待审批',
      applyNo: no,
      applyDate: stamp,
      applyReason: reason
    }
    const asset = useAssetStore().getAssetById(d.assetId)
    useAuditStore().recordEvent({
      assetId: d.assetId || '',
      assetName: d.assetName,
      group: asset?.group || groupOfContract(d.contractId),
      module: '保证金',
      action: '申请退还保证金',
      billNo: no,
      remark: `${d.tenant} 申请退还保证金 ${round2(Number(amount ?? d.amount))} 元${reason ? '，原因：' + reason : ''}`
    })
    return deposits.value[idx]
  }

  // 账单状态：由 financeStore 统一持有，收款动作再回写 feeRecords
  function addBill(bill) {
    const ym = (bill.billMonth || today()).replace('-', '')
    const seq = String(bills.value.length + 1).padStart(3, '0')
    const entry = {
      id: Math.max(0, ...bills.value.map(b => Number(b.id) || 0)) + 1,
      billNo: bill.billNo || `ZD-${ym}-${seq}`,
      contractId: bill.contractId || '',
      tenant: bill.tenant || '',
      assetId: bill.assetId || '',
      assetName: bill.assetName || '',
      feeType: bill.feeType || '租金',
      billMonth: bill.billMonth || today().slice(0, 7),
      billPeriod: bill.billPeriod || (bill.billMonth || today().slice(0, 7)),
      receivable: round2(Number(bill.receivable) || 0),
      received: round2(Number(bill.received) || 0),
      dueDate: bill.dueDate || '',
      status: bill.status || '待缴费',
      createTime: nowStr(),
      updateTime: nowStr()
    }
    bills.value.unshift(entry)
    useAuditStore().recordEvent({
      assetId: entry.assetId,
      assetName: entry.assetName,
      group: groupOfContract(entry.contractId),
      module: '账单',
      action: '生成账单',
      billNo: entry.billNo,
      remark: `${entry.tenant} ${entry.feeType} 账单 ${entry.receivable} 元，账期 ${entry.billPeriod}`
    })
    return entry
  }

  function updateBill(billNo, updates) {
    const idx = bills.value.findIndex(b => b.billNo === billNo)
    if (idx === -1) return null
    const before = bills.value[idx]
    bills.value[idx] = { ...before, ...updates, updateTime: nowStr() }
    const changed = Object.keys(updates).some(k => before[k] !== updates[k])
    if (changed && (updates.status && updates.status !== before.status)) {
      useAuditStore().recordEvent({
        assetId: before.assetId || '',
        assetName: before.assetName,
        group: groupOfContract(before.contractId),
        module: '账单',
        action: '账单状态变更',
        billNo,
        remark: `${before.tenant} 账单状态 ${before.status} → ${updates.status}`,
        detail: updates.remark || ''
      })
    }
    return bills.value[idx]
  }

  // 账单收款：把 feeRecords 的收缴状态一并推动
  function payBill(billNo, { amount, method = '线上缴费', date } = {}) {
    const bill = bills.value.find(b => b.billNo === billNo)
    if (!bill) return null
    const paidYuan = round2(Number(amount ?? bill.receivable - (bill.received || 0)))
    const paidWan = Math.round(paidYuan / 100) / 100  // 元 → 万元
    let receiptNo = ''
    if (bill.contractId && paidWan > 0) {
      const r = receivePayment(bill.contractId, { amount: paidWan, method, date })
      if (r) receiptNo = r.receiptNo
    }
    const nextReceived = round2((bill.received || 0) + paidYuan)
    const nextStatus = nextReceived >= (bill.receivable || 0) ? '已缴费' : (nextReceived > 0 ? '部分缴费' : '待缴费')
    updateBill(billNo, { received: nextReceived, status: nextStatus })
    return { billNo, receiptNo, paidYuan, paidWan, status: nextStatus }
  }

  function voucherOf(bizType, bizId) {
    const v = vouchers.value.find(x => x.bizType === bizType && x.bizId === bizId)
    return v ? v.voucherNo : ''
  }

  function generateVoucher(bizType, bizId) {
    const existing = vouchers.value.find(x => x.bizType === bizType && x.bizId === bizId)
    if (existing) return existing.voucherNo
    const pad = n => String(n).padStart(2, '0')
    const now = new Date()
    const voucherNo = `PZ-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${String(Math.floor(Math.random() * 900) + 100)}`
    vouchers.value.push({ bizType, bizId, voucherNo, date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` })
    return voucherNo
  }

  // 收入确认不再手工维护：直接由应收实收台账 + 合同保证金派生
  const revenueRecords = computed(() => {
    const contractStore = useContractStore()
    const year = String(new Date().getFullYear())
    const rows = []
    contractStore.feeRecords.forEach(f => {
      if (!f.yearActual) return
      rows.push({
        contractId: f.contractId,
        tenant: f.tenant,
        assetName: f.assetName,
        revenueType: '租金收入',
        period: `${year}-01 至 ${year}-12`,
        amount: round2(f.yearActual),
        voucherNo: voucherOf('租金收入', f.contractId)
      })
    })
    contractStore.contracts.forEach(c => {
      if (!c.deposit) return
      rows.push({
        contractId: c.id,
        tenant: c.tenant,
        assetName: c.assetName,
        revenueType: '保证金',
        period: String(c.startDate || '').slice(0, 7),
        amount: round2(c.deposit),
        voucherNo: voucherOf('保证金收取', c.id)
      })
    })
    return rows
  })

  const stats = computed(() => {
    const contractStore = useContractStore()
    const fees = contractStore.feeRecords
    const list = revenueRecords.value
    const pending = list.filter(r => !r.voucherNo).length
    return {
      year: String(new Date().getFullYear()),
      revenue: round2(fees.reduce((s, f) => s + (f.yearReceivable || 0), 0)),
      received: round2(fees.reduce((s, f) => s + (f.yearActual || 0), 0)),
      arrears: round2(fees.reduce((s, f) => s + (f.arrears || 0), 0)),
      expense: round2(expenses.value.reduce((s, e) => s + (e.amount || 0), 0)),
      voucherRate: list.length ? Math.round((list.length - pending) / list.length * 1000) / 10 : 0
    }
  })

  // 资债全览：资产账面值 − 抵押负债 − 欠费，全部取自台账/抵押/应收实收
  const debtOverview = computed(() => {
    const assetStore = useAssetStore()
    const mortgageStore = useMortgageStore()
    const contractStore = useContractStore()
    const groupOfContract = {}
    contractStore.contracts.forEach(c => {
      groupOfContract[c.id] = assetStore.getAssetById(c.assetId)?.group || ''
    })
    const rows = COMPANIES.map(company => {
      const assets = assetStore.assets.filter(a => a.group === company)
      const assetValue = round2(assets.reduce((s, a) => s + (a.bookValue || 0), 0))
      const activeMortgages = mortgageStore.mortgages.filter(m => m.company === company && m.status === '抵押中')
      const mortgage = round2(activeMortgages.reduce((s, m) => s + (m.amount || 0), 0))
      const mortgageArea = Math.round(activeMortgages.reduce((s, m) => {
        const a = assetStore.getAssetById(m.assetId)
        return s + (Number(a?.area) || 0)
      }, 0))
      const arrears = round2(contractStore.feeRecords
        .filter(f => groupOfContract[f.contractId] === company)
        .reduce((s, f) => s + (f.arrears || 0), 0))
      const liability = round2(mortgage + arrears)
      return {
        company,
        assetCount: assets.length,
        assetValue,
        assetArea: Math.round(assets.reduce((s, a) => s + (Number(a.area) || 0), 0)),
        mortgage,
        mortgageArea,
        arrears,
        liability,
        net: round2(assetValue - liability),
        ratio: assetValue ? Math.round(liability / assetValue * 1000) / 10 : 0
      }
    })
    return rows
  })

  const debtTotal = computed(() => {
    const t = { assetValue: 0, mortgage: 0, arrears: 0, liability: 0, net: 0 }
    debtOverview.value.forEach(r => {
      t.assetValue += r.assetValue
      t.mortgage += r.mortgage
      t.arrears += r.arrears
      t.liability += r.liability
      t.net += r.net
    })
    Object.keys(t).forEach(k => { t[k] = round2(t[k]) })
    t.ratio = t.assetValue ? Math.round(t.liability / t.assetValue * 1000) / 10 : 0
    return t
  })

  // 租金差价：实收单价来自合同，市场单价由评估值按收益法反推
  const rentMarginRows = computed(() => {
    const contractStore = useContractStore()
    const assetStore = useAssetStore()
    const evalMap = {}
    evaluationRecords.forEach(e => { evalMap[e.assetId] = e })
    return contractStore.contracts
      .filter(c => c.status !== '已终止' && c.status !== '退租')
      .map(c => {
        const asset = assetStore.getAssetById(c.assetId)
        const area = c.leaseArea || asset?.area || 0
        const ev = evalMap[c.assetId]
        const override = priceOverrides.value.find(o => o.contractId === c.id)
        const marketPrice = ev && area ? round2(ev.value * 10000 * CAP_RATE / area / 12) : 0
        const actualPrice = override
          ? override.actualPrice
          : (area ? round2((c.annualRent || 0) * 10000 / area / 12) : 0)
        return {
          id: c.id,
          contractId: c.id,
          assetId: c.assetId,
          assetName: c.assetName,
          tenant: c.tenant,
          group: asset?.group || '',
          area,
          evalValue: ev ? ev.value : 0,
          evalReportNo: ev ? ev.reportNo : '',
          marketPrice,
          actualPrice,
          annualRent: round2(c.annualRent || 0),
          marketAnnual: round2(marketPrice * area * 12 / 10000),
          actualAnnual: round2(actualPrice * area * 12 / 10000),
          gapAnnual: round2((marketPrice - actualPrice) * area * 12 / 10000),
          adjusted: !!override,
          adjustReason: override ? override.reason : ''
        }
      })
  })

  const taxSummary = computed(() => {
    const paid = round2(taxRecords.value.filter(t => t.payStatus === '已缴纳').reduce((s, t) => s + (t.taxAmount || 0), 0))
    const payable = round2(taxRecords.value.filter(t => t.payStatus !== '已缴纳').reduce((s, t) => s + (t.taxAmount || 0), 0))
    return {
      count: taxRecords.value.length,
      paid,
      payable,
      total: round2(paid + payable),
      overdue: taxRecords.value.filter(t => t.payStatus === '已逾期').length
    }
  })

  return {
    invoices,
    expenses,
    accountMappings,
    taxRules,
    invoiceRates,
    taxRecords,
    vouchers,
    priceOverrides,
    reconciles,
    bills,
    deposits,
    receipts,
    feeList,
    billList,
    depositList,
    revenueRecords,
    stats,
    debtOverview,
    debtTotal,
    rentMarginRows,
    taxSummary,
    voucherOf,
    generateVoucher,
    getReceipt,
    receivePayment,
    refundDeposit,
    collectDeposit,
    applyDepositRefund,
    addBill,
    updateBill,
    payBill
  }
})
