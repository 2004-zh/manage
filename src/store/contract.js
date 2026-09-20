import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contracts as initialContracts, feeRecords as initialFees } from '../data/mock'
import { useAssetStore } from './asset'
import { useChangeLogStore } from './changeLog'

export const useContractStore = defineStore('contract', () => {
  const contracts = ref([...initialContracts])
  const feeRecords = ref([...initialFees])

  const allContracts = computed(() => contracts.value)
  const allFees = computed(() => feeRecords.value)

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
        useChangeLogStore().record({
          assetId: before.assetId, assetName: before.assetName, module: '合同',
          type: updates.status === '退租' ? '合同退租' : '合同终止',
          before: before.status, after: `${before.id} ${updates.status}`
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
    return d.toISOString().slice(0, 10)
  }

  function activeContractsOfAsset(assetId) {
    return contracts.value.filter(c => c.assetId === assetId && c.status !== '已终止' && c.status !== '退租')
  }

  function syncAssetLeaseState(assetId) {
    const assetStore = useAssetStore()
    const asset = assetStore.getAssetById(assetId)
    if (!asset) return
    const actives = activeContractsOfAsset(assetId)
    if (!actives.length) {
      assetStore.updateAsset(assetId, {
        status: '闲置',
        leaseStatus: '未出租',
        isLeased: '否',
        tenant: null,
        leaseExpiry: null
      })
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
    })
  }

  function signContract(payload) {
    const contract = addContract(payload)
    const num = feeRecords.value.length + 1
    feeRecords.value.push({
      id: num,
      contractId: contract.id,
      assetId: contract.assetId || null,
      assetName: contract.assetName,
      tenant: contract.tenant,
      cumReceivable: 0,
      cumActual: 0,
      yearReceivable: contract.annualRent || 0,
      yearActual: 0,
      arrears: 0,
      status: '正常'
    })
    syncAssetLeaseState(contract.assetId)
    useChangeLogStore().record({
      assetId: contract.assetId, assetName: contract.assetName, module: '合同', type: '合同签约',
      before: '—', after: `${contract.id} ${contract.tenant}`
    })
    return contract
  }

  function renewContract(contractId, months) {
    const c = getContractById(contractId)
    if (!c) return null
    const newEnd = addMonths(c.endDate, months)
    updateContract(contractId, { endDate: newEnd, status: '正常', overdueDays: 0 })
    syncAssetLeaseState(c.assetId)
    useChangeLogStore().record({
      assetId: c.assetId, assetName: c.assetName, module: '合同', type: '合同续租',
      before: `${contractId} 到期 ${c.endDate}`, after: `延长至 ${newEnd}`
    })
    return newEnd
  }

  function terminateContract(contractId, reason) {
    const c = getContractById(contractId)
    if (!c) return
    updateContract(contractId, { status: '已终止', terminateReason: reason || '', arrears: c.arrears || 0 })
    syncAssetLeaseState(c.assetId)
  }

  function payFee(contractId, amount) {
    const fee = feeRecords.value.find(f => f.contractId === contractId)
    const c = getContractById(contractId)
    if (!fee || !c) return
    const paid = (fee.cumActual || 0) + amount
    const arrears = Math.max(0, Math.round(((fee.cumReceivable || 0) - paid) * 100) / 100)
    const status = arrears > 0 ? '欠缴' : '正常'
    feeRecords.value[feeRecords.value.indexOf(fee)] = {
      ...fee,
      cumActual: paid,
      yearActual: (fee.yearActual || 0) + amount,
      arrears,
      status
    }
    updateContract(contractId, { arrears, status: arrears > 0 ? '欠缴' : c.status })
    useChangeLogStore().record({
      assetId: c.assetId, assetName: c.assetName, module: '收费', type: '缴费登记',
      before: `欠缴 ${c.arrears || 0} 万元`, after: `${contractId} 缴纳 ${amount} 万元，余欠 ${arrears} 万元`
    })
  }

  return {
    contracts,
    feeRecords,
    allContracts,
    allFees,
    getContractsByAsset,
    addContract,
    updateContract,
    updateFeeRecord,
    getContractById,
    getLeaseSummary,
    signContract,
    renewContract,
    terminateContract,
    payFee,
    syncAssetLeaseState
  }
})
