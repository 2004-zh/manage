import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chengtouAssets as initialAssets } from '../data/mock'
import { useProjectStore } from './project'
import { useChangeLogStore } from './changeLog'

function roomToAsset(r, b, p, f) {
  return {
    id: r.id,
    name: r.name,
    assetNo: r.assetNo,
    assetCategory: '房产类',
    type: b.type,
    area: r.area,
    bookValue: 0,
    location: `${b.address} ${p.name} ${f.name}`,
    status: r.status,
    certStatus: r.hasPropertyRight ? '已办证' : '未办证',
    certDetail: r.hasPropertyRight ? `闽(2023)长乐区不动产权第${r.id.replace(/\D/g, '').padStart(7, '0')}号` : '',
    group: b.group,
    projectName: b.name,
    zoneName: p.name,
    floorName: f.name,
    tenant: r.tenant || null,
    leaseExpiry: r.leaseExpiry || null,
    monthlyRent: r.monthlyRent || 0,
    vacancyDays: r.vacancyDays ?? null,
    acquisitionMethod: '自建',
    propertyRight: r.hasPropertyRight ? '有不动产证' : '无证',
    assetUsage: b.type,
    sourceType: '自建',
    leaseStatus: r.status === '已出租' ? '已出租' : '未出租',
    isLeased: r.status === '已出租' ? '是' : '否',
    partialLease: '不支持',
    annualRent: r.monthlyRent ? r.monthlyRent * 12 / 10000 : null
  }
}

export const useAssetStore = defineStore('asset', () => {
  const baseAssets = ref([...initialAssets])
  const overrides = ref({})
  const removedIds = ref([])

  const roomAssets = computed(() => {
    const projectStore = useProjectStore()
    const list = []
    projectStore.projects.forEach(b => {
      b.partitions.forEach(p => {
        p.floors.forEach(f => {
          f.rooms.forEach(r => {
            list.push(roomToAsset(r, b, p, f))
          })
        })
      })
    })
    return list
  })

  const assets = computed(() =>
    [...baseAssets.value, ...roomAssets.value]
      .filter(a => !removedIds.value.includes(a.id))
      .map(a => (overrides.value[a.id] ? { ...a, ...overrides.value[a.id] } : a))
  )

  const allAssets = computed(() => assets.value)

  const certRecords = computed(() =>
    assets.value
      .filter(a => a.certStatus !== '已办证')
      .map(a => ({
        assetId: a.id,
        assetName: a.name,
        location: a.location,
        certStatus: a.certStatus,
        progress: a.certStatus.includes('办理中') ? '材料准备中，预计 2 个月内完成' : '待启动，需协调相关部门',
        remark: ''
      }))
  )

  function getAssetsByCompany(companyName) {
    return assets.value.filter(a => a.group === companyName)
  }

  function addAsset(asset) {
    const newId = `CT-${String(baseAssets.value.length + 1).padStart(3, '0')}`
    const newAsset = { ...asset, id: newId }
    baseAssets.value.push(newAsset)
    useChangeLogStore().record({
      assetId: newId, assetName: newAsset.name, module: '资产', type: '入库登记',
      before: '—', after: newAsset.sourceType ? `${newAsset.sourceType}入库` : '新增资产'
    })
    return newAsset
  }

  function updateAsset(id, updates) {
    const before = getAssetById(id)
    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    if (baseIdx !== -1) {
      baseAssets.value[baseIdx] = { ...baseAssets.value[baseIdx], ...updates }
    } else if (assets.value.some(a => a.id === id)) {
      overrides.value = { ...overrides.value, [id]: { ...overrides.value[id], ...updates } }
    }
    if (before) {
      const changed = Object.keys(updates).filter(k => before[k] !== updates[k])
      if (changed.length) {
        const statusChanged = changed.includes('status')
        useChangeLogStore().record({
          assetId: id, assetName: before.name, module: '资产',
          type: statusChanged ? '状态变更' : '信息变更',
          before: statusChanged ? before.status : changed.join('、'),
          after: statusChanged ? updates.status : changed.map(k => `${k}→${updates[k] ?? '空'}`).join('；')
        })
      }
    }
  }

  function deleteAsset(id) {
    const before = getAssetById(id)
    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    if (baseIdx !== -1) {
      baseAssets.value.splice(baseIdx, 1)
    } else if (assets.value.some(a => a.id === id) && !removedIds.value.includes(id)) {
      removedIds.value.push(id)
    } else {
      return
    }
    useChangeLogStore().record({
      assetId: id, assetName: before?.name || id, module: '资产', type: '资产删除',
      before: '在库', after: '已删除'
    })
  }

  function getAssetById(id) {
    return assets.value.find(a => a.id === id)
  }

  return {
    // 暴露原始 state，使 persist 插件能通过 $state 保存/恢复资产变更
    baseAssets,
    overrides,
    removedIds,
    assets,
    allAssets,
    certRecords,
    getAssetsByCompany,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetById
  }
})
