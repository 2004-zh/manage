import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { evaluationRecords } from '../data/mock'
import { useContractStore } from './contract'
import { useAssetStore } from './asset'
import { useMortgageStore } from './mortgage'
import { useAuditStore } from './audit'

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
      const mortgage = round2(mortgageStore.mortgages
        .filter(m => m.company === company && m.status === '抵押中')
        .reduce((s, m) => s + (m.amount || 0), 0))
      const arrears = round2(contractStore.feeRecords
        .filter(f => groupOfContract[f.contractId] === company)
        .reduce((s, f) => s + (f.arrears || 0), 0))
      const liability = round2(mortgage + arrears)
      return {
        company,
        assetCount: assets.length,
        assetValue,
        mortgage,
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
    revenueRecords,
    stats,
    debtOverview,
    debtTotal,
    rentMarginRows,
    taxSummary,
    voucherOf,
    generateVoucher
  }
})
