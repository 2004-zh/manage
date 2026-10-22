import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuditStore } from './audit'
import { useAssetStore } from './asset'
import { useDisposeStore } from './dispose'
import { useContractStore } from './contract'

const initialMortgages = [
  {
    id: 'DY-2026-001',
    projectType: '房产类',
    company: '城投集团',
    assetId: 'CT-001',
    assetName: '吴航街道商业街 A-01 商铺',
    mortgagor: '福州××商业管理有限公司',
    contractNo: 'DYHT-2026-001',
    amount: 500,
    bank: '中国工商银行长乐支行',
    period: 36,
    startDate: '2026-01-15',
    endDate: '2029-01-14',
    status: '抵押中',
    attachments: []
  },
  {
    id: 'DY-2026-002',
    projectType: '房产类',
    company: '产投集团',
    assetId: 'CT-002',
    assetName: '航城商务楼 3F',
    mortgagor: '福建××科技有限公司',
    contractNo: 'DYHT-2026-002',
    amount: 1200,
    bank: '中国建设银行长乐支行',
    period: 60,
    startDate: '2025-06-01',
    endDate: '2030-05-31',
    status: '抵押中',
    attachments: []
  },
  {
    id: 'DY-2025-003',
    projectType: '土地类',
    company: '水投集团',
    assetId: 'CT-005',
    assetName: '江田镇仓储用地',
    mortgagor: '长乐××物流有限公司',
    contractNo: 'DYHT-2025-003',
    amount: 800,
    bank: '中国农业银行长乐支行',
    period: 24,
    startDate: '2025-03-01',
    endDate: '2027-02-28',
    status: '已解押',
    attachments: []
  }
]

export const useMortgageStore = defineStore('mortgage', () => {
  const mortgages = ref([...initialMortgages])

  const allMortgages = computed(() => mortgages.value)

  // 当前处于"抵押中"状态的抵押记录
  const activeMortgages = computed(() => mortgages.value.filter(m => m.status === '抵押中'))

  // 已被抵押的资产 ID 集合
  const mortgagedAssetIds = computed(() => new Set(activeMortgages.value.map(m => m.assetId).filter(Boolean)))

  function getMortgagesByCompany(companyName) {
    return mortgages.value.filter(m => m.company === companyName)
  }

  function getMortgagesByAsset(assetId) {
    return mortgages.value.filter(m => m.assetId === assetId)
  }

  // 检查资产是否可抵押：未出租、未处置、未抵押
  function canMortgage(assetId) {
    const assetStore = useAssetStore()
    const disposeStore = useDisposeStore()
    const contractStore = useContractStore()
    const asset = assetStore.getAssetById(assetId)
    if (!asset) return { ok: false, reason: '资产不存在' }

    // 1. 已出租的资产不可抵押
    if (asset.status === '已出租' || asset.status === '部分出租') {
      return { ok: false, reason: '资产已出租，不可抵押' }
    }

    // 2. 已处置/归档的资产不可抵押
    const disposedAssets = disposeStore.records
      .filter(r => r.status === '已完成' || r.disposeStatus === '完成')
      .flatMap(r => r.assets || [])
      .map(a => a.assetNo)
    if (asset.assetNo && disposedAssets.includes(asset.assetNo)) {
      return { ok: false, reason: '资产已处置，不可抵押' }
    }

    // 3. 已抵押的资产不可重复抵押
    if (mortgagedAssetIds.value.has(assetId)) {
      return { ok: false, reason: '资产已处于抵押状态，不可重复抵押' }
    }

    // 4. 有在租合同的资产不可抵押
    const activeContracts = contractStore.contracts.filter(c =>
      c.assetId === assetId && c.status !== '已终止' && c.status !== '退租'
    )
    if (activeContracts.length > 0) {
      return { ok: false, reason: '资产存在有效租赁合同，不可抵押' }
    }

    return { ok: true, reason: '' }
  }

  // 获取可抵押的资产列表（过滤掉已出租、已处置、已抵押的资产）
  const availableAssetsForMortgage = computed(() => {
    const assetStore = useAssetStore()
    return assetStore.visibleAssets.filter(a => {
      const check = canMortgage(a.id)
      return check.ok
    })
  })

  function addMortgage(mortgage) {
    // 抵押前校验
    const check = canMortgage(mortgage.assetId)
    if (!check.ok) {
      throw new Error(check.reason)
    }

    const num = mortgages.value.length + 1
    const newId = `DY-2026-${String(num).padStart(3, '0')}`
    const newMortgage = { ...mortgage, id: newId }
    mortgages.value.push(newMortgage)

    // 更新资产的抵押状态
    if (mortgage.assetId) {
      useAssetStore().updateAsset(mortgage.assetId, { mortgageStatus: '已抵押' })
    }

    const asset = newMortgage.assetId ? useAssetStore().getAssetById(newMortgage.assetId) : null
    useAuditStore().recordEvent({
      assetId: newMortgage.assetId,
      assetName: asset?.name || newMortgage.assetName || newMortgage.assetId,
      group: newMortgage.company,
      module: '抵押管理',
      action: '新增抵押',
      billNo: newId,
      remark: `抵押金额 ${newMortgage.amount} 万元，期限 ${newMortgage.period} 个月`,
      detail: `${newMortgage.mortgagor} / ${newMortgage.bank}`
    })
    return newMortgage
  }

  function updateMortgage(id, updates) {
    const idx = mortgages.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      const before = mortgages.value[idx]
      mortgages.value[idx] = { ...before, ...updates }
      const after = mortgages.value[idx]
      const asset = after.assetId ? useAssetStore().getAssetById(after.assetId) : null
      useAuditStore().recordEvent({
        assetId: after.assetId,
        assetName: asset?.name || after.assetName || after.assetId,
        group: after.company,
        module: '抵押管理',
        action: '更新抵押信息',
        billNo: id,
        remark: `抵押编号 ${id} 信息变更`,
        detail: Object.keys(updates).join(', ')
      })
    }
  }

  // 解押：将抵押状态改为已解押，并恢复资产的抵押状态
  function releaseMortgage(id) {
    const idx = mortgages.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      const mortgage = mortgages.value[idx]
      if (mortgage.status !== '抵押中') {
        throw new Error('只有抵押中的记录才能解押')
      }
      mortgages.value[idx] = { ...mortgage, status: '已解押' }

      // 恢复资产的抵押状态
      if (mortgage.assetId) {
        useAssetStore().updateAsset(mortgage.assetId, { mortgageStatus: '未抵押' })
      }

      const asset = mortgage.assetId ? useAssetStore().getAssetById(mortgage.assetId) : null
      useAuditStore().recordEvent({
        assetId: mortgage.assetId,
        assetName: asset?.name || mortgage.assetName || mortgage.assetId,
        group: mortgage.company,
        module: '抵押管理',
        action: '解押',
        billNo: id,
        remark: `抵押编号 ${id} 已解押`
      })
    }
  }

  function deleteMortgage(id) {
    const idx = mortgages.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      const removed = mortgages.value[idx]
      // 如果是抵押中的记录，删除时恢复资产状态
      if (removed.status === '抵押中' && removed.assetId) {
        useAssetStore().updateAsset(removed.assetId, { mortgageStatus: '未抵押' })
      }
      mortgages.value.splice(idx, 1)
      const asset = removed.assetId ? useAssetStore().getAssetById(removed.assetId) : null
      useAuditStore().recordEvent({
        assetId: removed.assetId,
        assetName: asset?.name || removed.assetName || removed.assetId,
        group: removed.company,
        module: '抵押管理',
        action: '删除抵押记录',
        billNo: id,
        remark: `抵押金额 ${removed.amount} 万元，抵押人 ${removed.mortgagor}`
      })
    }
  }

  function getMortgageById(id) {
    return mortgages.value.find(m => m.id === id)
  }

  return {
    mortgages,
    allMortgages,
    activeMortgages,
    mortgagedAssetIds,
    availableAssetsForMortgage,
    getMortgagesByCompany,
    getMortgagesByAsset,
    canMortgage,
    addMortgage,
    updateMortgage,
    releaseMortgage,
    deleteMortgage,
    getMortgageById
  }
})
