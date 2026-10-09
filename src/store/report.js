import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useContractStore } from './contract'
import { useSpecialAssetStore } from './specialAsset'
import { useAuditStore } from './audit'
import { useNotifyStore } from './notify'

export const useReportStore = defineStore('report', () => {
  const reports = ref([])
  const submittedData = ref(null)

  const allReports = computed(() => reports.value)
  const latestSubmission = computed(() => submittedData.value)

  function computeCompanyData(companyName) {
    const assetStore = useAssetStore()
    const contractStore = useContractStore()
    const specialStore = useSpecialAssetStore()

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

  // 特殊资产（无形资产 + 股权投资）汇总：不归属单一公司，全区口径
  function computeSpecialAssetSummary() {
    const specialStore = useSpecialAssetStore()
    const iaList = specialStore.intangibleAssets.filter(a => a.status !== '已注销')
    const eqList = specialStore.equityCompanies
    return {
      intangibleCount: iaList.length,
      intangibleValue: Number(specialStore.intangibleTotalValue) || 0,
      equityCount: eqList.length,
      equityInvest: Number(specialStore.totalInvest) || 0,
      equityValue: Number(specialStore.totalEquity) || 0,
      equityDividend: Number(specialStore.totalDividend) || 0
    }
  }

  function submitReport(companyName, period, remark) {
    const data = computeCompanyData(companyName)
    const seq = String(reports.value.length + 1).padStart(3, '0')
    const report = {
      id: `SB-2026-${seq}`,
      company: companyName,
      period: period || '2026-Q1',
      submitTime: new Date().toLocaleString('zh-CN'),
      status: '待审核',
      remark: remark || '',
      returnReason: '',
      assetCount: data.assets,
      totalValue: data.bookValue,
      idleCount: data.idle,
      data
    }
    reports.value.push(report)
    submittedData.value = data
    useAuditStore().recordEvent({ module: '数据上报', action: '企业提交报送', bizId: report.id, target: 'gov', detail: `${companyName} 提交 ${report.period} 数据报送` })
    useNotifyStore().sendByTemplate('report_submit', { report: report.id, company: companyName }, { target: 'gov', bizType: '数据报送', bizId: report.id })
    return report
  }

  function acceptReport(id) {
    const report = reports.value.find(r => r.id === id)
    if (!report) return false
    report.status = '已接收'
    useAuditStore().recordEvent({ module: '数据上报', action: '监管接收报送', bizId: id, target: 'gov', detail: `${report.company} 报送数据已接收` })
    useNotifyStore().sendByTemplate('report_accept', { report: id, company: report.company }, { target: 'ent', bizType: '数据报送', bizId: id })
    return true
  }

  function returnReport(id, reason) {
    const report = reports.value.find(r => r.id === id)
    if (!report) return false
    report.status = '已退回'
    report.returnReason = reason
    useAuditStore().recordEvent({ module: '数据上报', action: '监管退回报送', bizId: id, target: 'gov', detail: `${report.company} 报送数据已退回：${reason}` })
    useNotifyStore().sendByTemplate('report_return', { report: id, company: report.company, reason }, { target: 'ent', bizType: '数据报送', bizId: id })
    return true
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
    acceptReport,
    returnReport,
    computeCompanyData,
    computeSpecialAssetSummary,
    getLatestDataByCompany,
    getAllCompaniesLatestData
  }
})
