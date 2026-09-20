import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { contracts as initialContracts, feeRecords as initialFees } from '../data/mock'

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
    getLeaseSummary
  }
})
