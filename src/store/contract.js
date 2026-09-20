import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contracts as initialContracts, feeRecords as initialFees } from '../data/mock'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'
import { usePartyStore } from './party'
import { useRevitalizeStore } from './revitalize'
import { useNotifyStore } from './notify'

export const useContractStore = defineStore('contract', () => {
  const contracts = ref([...initialContracts])
  const feeRecords = ref([...initialFees])

  const allContracts = computed(() => contracts.value)
  const allFees = computed(() => feeRecords.value)

  function getContractsByAsset(assetId) {
    return contracts.value.filter(c => c.assetId === assetId)
  }

  function addContract(contract) {
    const num = contracts.value.length + 1
    const newId = `HT-2026-${String(num).padStart(3, '0')}`
    const newContract = { ...contract, id: newId }
    contracts.value.push(newContract)
    return newContract
  }

  function updateContract(id, updates) {
    const idx = contracts.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      contracts.value[idx] = { ...contracts.value[idx], ...updates }
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

  function signContract(payload) {
    const assetStore = useAssetStore()
    const before = assetStore.getAssetById(payload.assetId)
    const wasIdle = !!before && (before.status === '闲置' || before.status === '空置')

    const contract = addContract(payload)
    const num = feeRecords.value.length + 1
    feeRecords.value.push({
      id: num,
      contractId: contract.id,
      assetName: contract.assetName,
      tenant: contract.tenant,
      cumReceivable: 0,
      cumActual: 0,
      yearReceivable: contract.annualRent || 0,
      yearActual: 0,
      arrears: 0,
      status: '正常'
    })
    syncAssetLeaseState(contract.assetId, { action: '签约联动', billNo: contract.id })

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
      status
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
    return { paid, arrears, status }
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
