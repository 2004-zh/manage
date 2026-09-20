import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tenantRecords as initialTenants } from '../data/mock'
import { useContractStore } from './contract'
import { useAuditStore } from './audit'

function grade(party, stats) {
  if (party.blacklist) return 'D（禁入）'
  if (stats.totalArrears > 10 || stats.overdueCount >= 2) return 'C（预警）'
  if (stats.totalArrears > 0 || stats.overdueCount === 1) return 'B（关注）'
  return 'A（正常）'
}

export const usePartyStore = defineStore('party', () => {
  const parties = ref(initialTenants.map((t, i) => ({
    id: `KS-${String(i + 1).padStart(3, '0')}`,
    name: t.name,
    idType: t.idType || '统一社会信用代码',
    idNo: t.idNo || '',
    contact: t.contact || '',
    phone: t.phone || '',
    email: t.email || '',
    address: t.address || '',
    type: '承租方',
    blacklist: false,
    remark: ''
  })))

  /** 每个客商的合同数、合计欠费、逾期次数——全部由合同库实时推导，不落库 */
  const stats = computed(() => {
    const contractStore = useContractStore()
    const map = {}
    contractStore.contracts.forEach(c => {
      const key = c.tenant || c.partyB
      if (!key) return
      if (!map[key]) map[key] = { contractCount: 0, activeCount: 0, totalArrears: 0, overdueCount: 0, totalRent: 0 }
      const s = map[key]
      s.contractCount++
      if (c.status !== '已终止' && c.status !== '退租') s.activeCount++
      s.totalArrears = Math.round((s.totalArrears + (c.arrears || 0)) * 100) / 100
      s.totalRent = Math.round((s.totalRent + (c.annualRent || 0)) * 100) / 100
      if ((c.overdueDays || 0) > 0 || c.status === '欠缴') s.overdueCount++
    })
    return map
  })

  /** 带信用评级的完整客商视图 */
  const partyList = computed(() => parties.value.map(p => {
    const s = stats.value[p.name] || { contractCount: 0, activeCount: 0, totalArrears: 0, overdueCount: 0, totalRent: 0 }
    return { ...p, ...s, creditLevel: grade(p, s) }
  }))

  function getByName(name) {
    return parties.value.find(p => p.name === name) || null
  }

  function getById(id) {
    return parties.value.find(p => p.id === id) || null
  }

  function statsOf(name) {
    return stats.value[name] || { contractCount: 0, activeCount: 0, totalArrears: 0, overdueCount: 0, totalRent: 0 }
  }

  function creditOf(name) {
    const p = getByName(name)
    return grade(p || { blacklist: false }, statsOf(name))
  }

  /** 合同乙方一律走这里：已建档则复用，未建档则自动建档，杜绝自由文本 */
  function resolveParty(payload) {
    const name = (payload.name || '').trim()
    if (!name) return null
    const exist = getByName(name)
    if (exist) {
      const patch = {}
      ;['idNo', 'contact', 'phone', 'email', 'address', 'type'].forEach(k => {
        if (payload[k] && payload[k] !== exist[k]) patch[k] = payload[k]
      })
      if (Object.keys(patch).length) updateParty(exist.id, patch, { action: '客商资料补全' })
      return exist
    }
    return addParty({ ...payload, name }, { remark: '由合同签约自动建档' })
  }

  function addParty(data, meta = {}) {
    const id = `KS-${String(parties.value.length + 1).padStart(3, '0')}`
    const party = {
      id,
      name: data.name,
      idType: data.idType || '统一社会信用代码',
      idNo: data.idNo || '',
      contact: data.contact || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      type: data.type || '承租方',
      blacklist: !!data.blacklist,
      remark: data.remark || ''
    }
    parties.value.push(party)
    useAuditStore().recordEvent({
      assetId: '',
      assetName: party.name,
      group: '',
      module: '客商档案',
      action: '新增客商',
      remark: meta.remark || `新增客商：${party.name}`,
      detail: `${party.idType} ${party.idNo || '未填'} / 联系人 ${party.contact || '未填'}`
    })
    return party
  }

  function updateParty(id, updates, meta = {}) {
    const idx = parties.value.findIndex(p => p.id === id)
    if (idx === -1) return false
    const before = { ...parties.value[idx] }
    parties.value[idx] = { ...before, ...updates }
    useAuditStore().recordDiff({
      assetId: '',
      assetName: before.name,
      group: '',
      module: '客商档案',
      action: meta.action || '修改客商',
      before,
      after: parties.value[idx],
      remark: meta.remark
    })
    return true
  }

  /** 列入 / 移出黑名单：直接影响后续签约拦截 */
  function setBlacklist(id, on, reason) {
    const p = getById(id)
    if (!p) return false
    updateParty(id, { blacklist: on, remark: reason || p.remark }, { action: on ? '列入黑名单' : '移出黑名单' })
    return true
  }

  function removeParty(id) {
    const idx = parties.value.findIndex(p => p.id === id)
    if (idx === -1) return false
    parties.value.splice(idx, 1)
    return true
  }

  /** 欠费排行：催租与督办的取数口径 */
  const arrearsRanking = computed(() =>
    partyList.value
      .filter(p => p.totalArrears > 0)
      .sort((a, b) => b.totalArrears - a.totalArrears)
  )

  return {
    parties,
    partyList,
    stats,
    arrearsRanking,
    getByName,
    getById,
    statsOf,
    creditOf,
    resolveParty,
    addParty,
    updateParty,
    setBlacklist,
    removeParty
  }
})
