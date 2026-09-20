import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useContractStore } from './contract'

export const useReportStore = defineStore('report', () => {
  const reports = ref([])
  const submittedData = ref(null)

  const allReports = computed(() => reports.value)
  const latestSubmission = computed(() => submittedData.value)

  function computeCompanyData(companyName) {
    const assetStore = useAssetStore()
    const contractStore = useContractStore()

    const companyAssets = assetStore.getAssetsByCompany(companyName)
    const totalAssets = companyAssets.length
    const totalBookValue = companyAssets.reduce((sum, a) => sum + (a.bookValue || 0), 0)
    const rentedAssets = companyAssets.filter(a => a.status === '已出租' || a.status === '部分出租')
    const idleAssets = companyAssets.filter(a => a.status === '闲置')
    const certifiedAssets = companyAssets.filter(a => a.certStatus && a.certStatus.includes('已办证'))

    const rentalRate = totalAssets > 0 ? Math.round(rentedAssets.length / totalAssets * 1000) / 10 : 0
    const idleRate = totalAssets > 0 ? Math.round(idleAssets.length / totalAssets * 1000) / 10 : 0
    const unCert = totalAssets - certifiedAssets.length

    const companyContracts = contractStore.contracts.filter(c => {
      const asset = assetStore.getAssetById(c.assetId)
      return asset && asset.group === companyName
    })

    const cumReceivable = companyContracts.reduce((sum, c) => {
      const fee = contractStore.feeRecords.find(f => f.contractId === c.id)
      return sum + (fee ? fee.cumReceivable : 0)
    }, 0) / 10000

    const cumActual = companyContracts.reduce((sum, c) => {
      const fee = contractStore.feeRecords.find(f => f.contractId === c.id)
      return sum + (fee ? fee.cumActual : 0)
    }, 0) / 10000

    const yearReceivable = companyContracts.reduce((sum, c) => {
      const fee = contractStore.feeRecords.find(f => f.contractId === c.id)
      return sum + (fee ? fee.yearReceivable : 0)
    }, 0) / 10000

    const yearActual = companyContracts.reduce((sum, c) => {
      const fee = contractStore.feeRecords.find(f => f.contractId === c.id)
      return sum + (fee ? fee.yearActual : 0)
    }, 0) / 10000

    return {
      name: companyName,
      assets: totalAssets,
      bookValue: Math.round(totalBookValue / 10000 * 100) / 100,
      rented: rentedAssets.length,
      rentalRate,
      idle: idleAssets.length,
      idleRate,
      cumReceivable: Math.round(cumReceivable * 10000) / 10000,
      cumActual: Math.round(cumActual * 10000) / 10000,
      yearReceivable: Math.round(yearReceivable * 10000) / 10000,
      yearActual: Math.round(yearActual * 10000) / 10000,
      unCert
    }
  }

  function submitReport(companyName, period, remark) {
    const data = computeCompanyData(companyName)
    const report = {
      id: `DB-${Date.now()}`,
      company: companyName,
      period: period || '2026-Q1',
      submitTime: new Date().toLocaleString('zh-CN'),
      status: '已接收',
      remark: remark || '数据校验通过',
      assetCount: data.assets,
      totalValue: data.bookValue,
      idleCount: data.idle,
      data
    }
    reports.value.push(report)
    submittedData.value = data
    return report
  }

  function getLatestDataByCompany(companyName) {
    const companyReports = reports.value.filter(r => r.company === companyName)
    if (companyReports.length > 0) {
      return companyReports[companyReports.length - 1].data
    }
    return computeCompanyData(companyName)
  }

  function getAllCompaniesLatestData() {
    const companies = ['城投集团', '产投集团', '水投集团', '领航公司']
    return companies.map(c => getLatestDataByCompany(c))
  }

  return {
    reports,
    submittedData,
    allReports,
    latestSubmission,
    submitReport,
    computeCompanyData,
    getLatestDataByCompany,
    getAllCompaniesLatestData
  }
})
