import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  function getMortgagesByCompany(companyName) {
    return mortgages.value.filter(m => m.company === companyName)
  }

  function getMortgagesByAsset(assetId) {
    return mortgages.value.filter(m => m.assetId === assetId)
  }

  function addMortgage(mortgage) {
    const num = mortgages.value.length + 1
    const newId = `DY-2026-${String(num).padStart(3, '0')}`
    const newMortgage = { ...mortgage, id: newId }
    mortgages.value.push(newMortgage)
    return newMortgage
  }

  function updateMortgage(id, updates) {
    const idx = mortgages.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      mortgages.value[idx] = { ...mortgages.value[idx], ...updates }
    }
  }

  function deleteMortgage(id) {
    const idx = mortgages.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      mortgages.value.splice(idx, 1)
    }
  }

  function getMortgageById(id) {
    return mortgages.value.find(m => m.id === id)
  }

  return {
    mortgages,
    allMortgages,
    getMortgagesByCompany,
    getMortgagesByAsset,
    addMortgage,
    updateMortgage,
    deleteMortgage,
    getMortgageById
  }
})
