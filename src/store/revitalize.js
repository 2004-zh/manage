import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'

const COMPANIES = ['城投集团', '产投集团', '水投集团', '领航公司']

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function currentYear() { return String(new Date().getFullYear()) }

const SEED_TARGETS = [
  {
    id: 'MB-2026', year: '2026', name: '2026年度长乐区国有资产盘活目标',
    amountTarget: 50000, countTarget: 20, status: '进行中', issueTime: '2026-01-15',
    remark: '按区国资委年度盘活考核口径下达',
    allocations: [
      { company: '城投集团', ratio: 35 }, { company: '产投集团', ratio: 25 },
      { company: '水投集团', ratio: 22 }, { company: '领航公司', ratio: 18 }
    ]
  },
  {
    id: 'MB-2025', year: '2025', name: '2025年度长乐区国有资产盘活目标',
    amountTarget: 42000, countTarget: 10, status: '已完成', issueTime: '2025-01-20', remark: '',
    allocations: [
      { company: '城投集团', ratio: 38 }, { company: '产投集团', ratio: 24 },
      { company: '水投集团', ratio: 20 }, { company: '领航公司', ratio: 18 }
    ]
  },
  {
    id: 'MB-2027', year: '2027', name: '2027年度长乐区国有资产盘活目标（草案）',
    amountTarget: 56000, countTarget: 22, status: '未下达', issueTime: '',
    remark: '待区政府审议后下达',
    allocations: COMPANIES.map(c => ({ company: c, ratio: 0 }))
  }
]

const SEED_FLOWS = [
  { id: 1, year: '2026', time: '2026-09-05 09:40', sourceType: '闲置盘活', docNo: 'PH-2026-018', company: '城投集团', assetName: '鹤上镇闲置仓库短期出租', amount: 380, count: 1, auto: false, remark: '闲置一年以上资产临时入市' },
  { id: 2, year: '2026', time: '2026-08-28 10:12', sourceType: '租金收缴', docNo: 'HT-2025-006', company: '城投集团', assetName: '航城商务楼 3F 本年实收租金', amount: 117, count: 0, auto: true, remark: '由应收实收台账自动归集' },
  { id: 3, year: '2026', time: '2026-08-05 15:20', sourceType: '资产处置', docNo: 'CZ-2026-009', company: '城投集团', assetName: '首占新区闲置用地政府收储补偿', amount: 12800, count: 1, auto: false, remark: '' },
  { id: 4, year: '2026', time: '2026-07-15 15:40', sourceType: '闲置盘活', docNo: 'PH-2026-011', company: '城投集团', assetName: '吴航街道闲置商铺 3 间整体招租', amount: 420, count: 3, auto: false, remark: '闲置两年以上资产重新入市' },
  { id: 5, year: '2026', time: '2026-06-30 09:05', sourceType: '资产处置', docNo: 'CZ-2026-004', company: '产投集团', assetName: '营前街道旧厂房拆除后土地使用权转让', amount: 1860, count: 1, auto: false, remark: '' },
  { id: 6, year: '2026', time: '2026-06-12 11:18', sourceType: '股权转让', docNo: 'GQ-2026-002', company: '产投集团', assetName: '参股企业股权退出回收资金', amount: 8600, count: 0, auto: false, remark: '' },
  { id: 7, year: '2026', time: '2026-05-20 14:22', sourceType: '招租签约', docNo: 'ZL-2026-008', company: '水投集团', assetName: '漳港街道标准厂房 2# 招租签约', amount: 3120, count: 1, auto: false, remark: '三年期合同，年租金 1040 万元' },
  { id: 8, year: '2026', time: '2026-04-11 11:30', sourceType: '租金收缴', docNo: 'HT-2024-015', company: '领航公司', assetName: '吴航农贸市场摊位本年实收租金', amount: 64.6, count: 0, auto: true, remark: '由应收实收台账自动归集' },
  { id: 9, year: '2026', time: '2026-03-08 16:48', sourceType: '闲置盘活', docNo: 'PH-2026-003', company: '水投集团', assetName: '江田镇闲置仓储用地临时出租', amount: 960, count: 1, auto: false, remark: '' },
  { id: 10, year: '2026', time: '2026-02-18 09:20', sourceType: '招租签约', docNo: 'ZL-2026-002', company: '领航公司', assetName: '梅花镇农贸市场摊位重新招租', amount: 1450, count: 2, auto: false, remark: '' },
  { id: 11, year: '2025', time: '2025-12-20 10:00', sourceType: '资产处置', docNo: 'CZ-2025-019', company: '城投集团', assetName: '首占新区闲置用地收储补偿', amount: 18600, count: 1, auto: false, remark: '' },
  { id: 12, year: '2025', time: '2025-11-05 14:10', sourceType: '闲置盘活', docNo: 'PH-2025-022', company: '产投集团', assetName: '古槐镇闲置厂房改造出租', amount: 5400, count: 2, auto: false, remark: '' },
  { id: 13, year: '2025', time: '2025-10-16 09:55', sourceType: '股权转让', docNo: 'GQ-2025-006', company: '产投集团', assetName: '子公司股权划转回收资金', amount: 9800, count: 0, auto: false, remark: '' },
  { id: 14, year: '2025', time: '2025-09-18 09:35', sourceType: '招租签约', docNo: 'ZL-2025-031', company: '领航公司', assetName: '梅花镇商铺打包招租', amount: 3188, count: 4, auto: false, remark: '' },
  { id: 15, year: '2025', time: '2025-07-22 16:05', sourceType: '资产处置', docNo: 'CZ-2025-011', company: '水投集团', assetName: '旧泵站设备报废处置残值回收', amount: 860, count: 1, auto: false, remark: '' },
  { id: 16, year: '2025', time: '2025-05-09 10:30', sourceType: '闲置盘活', docNo: 'PH-2025-008', company: '水投集团', assetName: '漳港闲置综合楼整体出租', amount: 4600, count: 2, auto: false, remark: '' }
]

export const useRevitalizeStore = defineStore('revitalize', () => {
  const targets = ref(JSON.parse(JSON.stringify(SEED_TARGETS)))
  const flows = ref(JSON.parse(JSON.stringify(SEED_FLOWS)))
  const companies = COMPANIES

  function flowsOfYear(year) {
    return flows.value.filter(f => String(f.year) === String(year))
  }

  function completedOfYear(year) {
    const list = flowsOfYear(year)
    return {
      amount: Math.round(list.reduce((s, f) => s + (f.amount || 0), 0) * 100) / 100,
      count: list.reduce((s, f) => s + (f.count || 0), 0)
    }
  }

  function completedOfCompany(year, company) {
    const list = flowsOfYear(year).filter(f => f.company === company)
    return {
      amount: Math.round(list.reduce((s, f) => s + (f.amount || 0), 0) * 100) / 100,
      count: list.reduce((s, f) => s + (f.count || 0), 0)
    }
  }

  function rateOf(year) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t || !t.amountTarget) return 0
    return Math.min(999, Math.round(completedOfYear(year).amount / t.amountTarget * 1000) / 10)
  }

  // 上游：闲置底数直接取自资产台账，不是手工填的
  const idleBase = computed(() => {
    const assetStore = useAssetStore()
    const map = {}
    COMPANIES.forEach(c => { map[c] = { count: 0, area: 0, bookValue: 0, assets: [] } })
    assetStore.assets.forEach(a => {
      if (a.status !== '闲置' && a.status !== '空置') return
      const key = a.group || ''
      if (!map[key]) map[key] = { count: 0, area: 0, bookValue: 0, assets: [] }
      map[key].count++
      map[key].area = Math.round((map[key].area + (a.area || 0)) * 100) / 100
      map[key].bookValue = Math.round((map[key].bookValue + (a.bookValue || 0)) * 100) / 100
      if (map[key].assets.length < 50) map[key].assets.push({ id: a.id, name: a.name, area: a.area, status: a.status })
    })
    return map
  })

  const idleTotal = computed(() => {
    let count = 0
    let area = 0
    Object.values(idleBase.value).forEach(v => { count += v.count; area += v.area })
    return { count, area: Math.round(area * 100) / 100 }
  })

  /**
   * 盘活流水登记：各链路的成果都汇到这里，完成率因此是算出来的而不是填出来的。
   * auto=true 表示由业务单据自动归集（签约、处置、收缴），false 表示人工补录。
   */
  function recordRevitalize(entry) {
    const year = String(entry.year || currentYear())
    const flow = {
      id: flows.value.reduce((m, f) => Math.max(m, Number(f.id) || 0), 0) + 1,
      year,
      time: entry.time || nowStr(),
      sourceType: entry.sourceType || '闲置盘活',
      docNo: entry.docNo || '',
      company: entry.company || '',
      assetId: entry.assetId || '',
      assetName: entry.assetName || '',
      amount: Math.round((entry.amount || 0) * 100) / 100,
      count: entry.count || 0,
      auto: !!entry.auto,
      remark: entry.remark || ''
    }
    // 同一单据不重复归集（签约、处置可能被多次触发）
    if (flow.docNo && flows.value.some(f => f.docNo === flow.docNo && f.sourceType === flow.sourceType)) {
      return null
    }
    flows.value.unshift(flow)
    useAuditStore().recordEvent({
      assetId: flow.assetId,
      assetName: flow.assetName,
      group: flow.company,
      module: '盘活管理',
      action: `${flow.sourceType}归集`,
      billNo: flow.docNo,
      remark: flow.auto ? '系统自动归集' : '人工补录',
      detail: `盘活金额 ${flow.amount} 万元 / ${flow.count} 宗`
    })
    return flow
  }

  function removeFlow(id) {
    const idx = flows.value.findIndex(f => f.id === id)
    if (idx === -1) return false
    flows.value.splice(idx, 1)
    return true
  }

  function addTarget(data) {
    const year = String(data.year || currentYear())
    const target = {
      id: `MB-${year}`,
      year,
      name: data.name || `${year}年度长乐区国有资产盘活目标`,
      amountTarget: Number(data.amountTarget) || 0,
      countTarget: Number(data.countTarget) || 0,
      status: data.status || '未下达',
      issueTime: data.issueTime || '',
      remark: data.remark || '',
      allocations: data.allocations || COMPANIES.map(c => ({ company: c, ratio: 0 }))
    }
    const idx = targets.value.findIndex(t => t.year === year)
    if (idx !== -1) targets.value[idx] = target
    else targets.value.push(target)
    useAuditStore().recordEvent({
      module: '盘活管理', action: '下达盘活目标', group: '全区',
      billNo: target.id, remark: target.name,
      detail: `金额目标 ${target.amountTarget} 万元 / 宗数目标 ${target.countTarget} 宗`
    })
    return target
  }

  function updateTarget(year, updates) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return false
    Object.assign(t, updates)
    return true
  }

  function removeTarget(id) {
    const idx = targets.value.findIndex(t => t.id === id)
    if (idx === -1) return false
    const gone = targets.value[idx]
    targets.value.splice(idx, 1)
    useAuditStore().recordEvent({
      module: '盘活管理', action: '删除盘活目标', group: '全区',
      billNo: gone.id, remark: gone.name,
      detail: `${gone.year} 年度目标已删除，历史流水保留`
    })
    return true
  }

  /** 分摊下达：写入比例、置为进行中、记录下达日期 */
  function issueTarget(year, allocations) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return false
    t.allocations = allocations.map(a => ({ company: a.company, ratio: Number(a.ratio) || 0 }))
    t.status = '进行中'
    t.issueTime = nowStr().slice(0, 10)
    useAuditStore().recordEvent({
      module: '盘活管理', action: '分摊下达', group: '全区', billNo: t.id, remark: t.name,
      detail: t.allocations.filter(a => a.ratio > 0).map(a => `${a.company} ${a.ratio}%`).join('、')
    })
    return true
  }

  function setAllocation(year, company, ratio) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return false
    const a = t.allocations.find(x => x.company === company)
    if (a) a.ratio = Number(ratio) || 0
    else t.allocations.push({ company, ratio: Number(ratio) || 0 })
    return true
  }

  /**
   * 按闲置底数建议分摊比例（纯计算，不落库）：闲置越多分得越多，避免拍脑袋定比例。
   * 用户在分摊弹窗里确认后由 issueTarget 写入。
   */
  function suggestAllocation(year) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return []
    const list = t.allocations.length ? t.allocations : COMPANIES.map(c => ({ company: c, ratio: 0 }))
    const weights = list.map(a => Math.max(1, idleBase.value[a.company]?.count || 0))
    const sum = weights.reduce((s, w) => s + w, 0)
    const ratios = weights.map(w => Math.round(w / sum * 1000) / 10)
    const diff = Math.round((100 - ratios.reduce((s, r) => s + r, 0)) * 10) / 10
    if (ratios.length) ratios[0] = Math.round((ratios[0] + diff) * 10) / 10
    return list.map((a, i) => ({ company: a.company, ratio: ratios[i], idleCount: idleBase.value[a.company]?.count || 0 }))
  }

  function autoAllocate(year) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return null
    const suggested = suggestAllocation(year)
    t.allocations = suggested.map(a => ({ company: a.company, ratio: a.ratio }))
    useAuditStore().recordEvent({
      module: '盘活管理', action: '按闲置底数自动分摊', group: '全区', billNo: t.id,
      detail: t.allocations.map(a => `${a.company} ${a.ratio}%`).join('、')
    })
    return t.allocations
  }

  function statusOf(year) {
    const t = targets.value.find(x => String(x.year) === String(year))
    if (!t) return '—'
    if (t.status === '未下达') return '未下达'
    const rate = rateOf(year)
    const yearPassed = Number(year) < Number(currentYear())
    if (rate >= 100) return '已达标'
    if (yearPassed) return '未达标'
    return '进行中'
  }

  return {
    targets,
    flows,
    companies,
    idleBase,
    idleTotal,
    flowsOfYear,
    completedOfYear,
    completedOfCompany,
    rateOf,
    statusOf,
    recordRevitalize,
    removeFlow,
    addTarget,
    updateTarget,
    removeTarget,
    issueTarget,
    setAllocation,
    suggestAllocation,
    autoAllocate
  }
})
