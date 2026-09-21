import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useMortgageStore } from './mortgage'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'

/**
 * 管控限制（缺口7）：资产的第三类派生态（除使用状态、办证状态外）。
 * 规则分两类：使用限制（影响调拨）、处置限制（影响处置）。
 * 处置/调拨拦截 = 抵押中 OR 命中对应管控规则，两个条件任一成立即禁止。
 */
const initialRules = [
  { id: 'GK-001', assetId: 'CT-001', group: '城投集团', limitType: '处置限制', reason: '该商铺已纳入区级重点商圈规划，暂停处置', effectiveDate: '2026-01-01', status: '生效中' },
  { id: 'GK-002', assetId: 'CT-002', group: '产投集团', limitType: '使用限制', reason: '商务楼 3F 列入区级应急物资储备点，用途不得擅自变更', effectiveDate: '2025-06-01', status: '生效中' },
  { id: 'GK-003', assetId: 'CT-006', group: '城投集团', limitType: '处置限制', reason: '历史建筑保护名录，禁止拆除处置', effectiveDate: '2024-03-01', status: '生效中' }
]

export const useControlStore = defineStore('control', () => {
  const rules = ref(JSON.parse(JSON.stringify(initialRules)))

  function activeRules(assetId) {
    return rules.value.filter(r => r.assetId === assetId && r.status === '生效中')
  }

  function hasLimit(assetId, limitType) {
    return activeRules(assetId).some(r => r.limitType === limitType)
  }

  function isMortgaged(assetId) {
    return useMortgageStore().getMortgagesByAsset(assetId).some(m => m.status === '抵押中')
  }

  function blockReasons(assetId, limitType) {
    const reasons = []
    if (isMortgaged(assetId)) reasons.push('资产处于抵押状态')
    activeRules(assetId).filter(r => r.limitType === limitType).forEach(r => reasons.push(r.reason))
    return reasons
  }

  /** 处置拦截：查处置限制 + 抵押 */
  function canDispose(assetId) {
    const reasons = blockReasons(assetId, '处置限制')
    return { ok: reasons.length === 0, reasons }
  }

  /** 调拨拦截：查使用限制 + 抵押 */
  function canTransfer(assetId) {
    const reasons = blockReasons(assetId, '使用限制')
    return { ok: reasons.length === 0, reasons }
  }

  const controlState = computed(() => {
    const map = {}
    rules.value.forEach(r => {
      if (r.status !== '生效中') return
      if (!map[r.assetId]) map[r.assetId] = { usageLimit: false, disposeLimit: false, reasons: [] }
      if (r.limitType === '使用限制') map[r.assetId].usageLimit = true
      if (r.limitType === '处置限制') map[r.assetId].disposeLimit = true
      map[r.assetId].reasons.push(r.reason)
    })
    return map
  })

  function getState(assetId) {
    return controlState.value[assetId] || { usageLimit: false, disposeLimit: false, reasons: [] }
  }

  function addRule(data) {
    const id = `GK-${String(rules.value.length + 1).padStart(3, '0')}`
    const rule = {
      id,
      assetId: data.assetId || '',
      group: data.group || '',
      limitType: data.limitType || '处置限制',
      reason: data.reason || '',
      effectiveDate: data.effectiveDate || new Date().toISOString().slice(0, 10),
      status: data.status || '生效中'
    }
    rules.value.push(rule)
    const asset = data.assetId ? useAssetStore().getAssetById(data.assetId) : null
    useAuditStore().recordEvent({
      assetId: rule.assetId,
      assetName: asset?.name || rule.assetId,
      group: rule.group,
      module: '资产管控',
      action: '新增管控规则',
      billNo: rule.id,
      remark: rule.reason,
      detail: `${rule.limitType} / ${rule.status}`
    })
    return rule
  }

  function updateRule(id, updates) {
    const idx = rules.value.findIndex(r => r.id === id)
    if (idx === -1) return false
    const before = { ...rules.value[idx] }
    rules.value[idx] = { ...before, ...updates }
    useAuditStore().recordDiff({
      assetId: before.assetId,
      assetName: useAssetStore().getAssetById(before.assetId)?.name || before.assetId,
      group: before.group,
      module: '资产管控',
      action: '修改管控规则',
      billNo: id,
      before,
      after: rules.value[idx],
      fields: Object.keys(updates)
    })
    return true
  }

  function releaseRule(id, remark = '') {
    return updateRule(id, { status: '已解除', releaseRemark: remark })
  }

  function getRulesByAsset(assetId) {
    return rules.value.filter(r => r.assetId === assetId)
  }

  function getRulesByCompany(companyName) {
    return rules.value.filter(r => r.group === companyName)
  }

  return {
    rules,
    controlState,
    canDispose,
    canTransfer,
    getState,
    hasLimit,
    isMortgaged,
    addRule,
    updateRule,
    releaseRule,
    getRulesByAsset,
    getRulesByCompany
  }
})
