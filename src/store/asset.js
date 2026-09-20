import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chengtouAssets as initialAssets } from '../data/mock'
import { useProjectStore } from './project'
import { useAuditStore } from './audit'

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

  const assets = computed(() => [...baseAssets.value, ...roomAssets.value])

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

  function addAsset(asset, meta = {}) {
    const newId = `CT-${String(baseAssets.value.length + 1).padStart(3, '0')}`
    const newAsset = { ...asset, id: newId }
    baseAssets.value.push(newAsset)
    useAuditStore().recordEvent({
      assetId: newId,
      assetName: newAsset.name,
      group: newAsset.group,
      module: meta.module || '资产登记',
      action: '新增资产',
      billNo: meta.billNo,
      remark: meta.remark || `新增资产：${newAsset.name}`,
      detail: `面积 ${newAsset.area || 0}㎡ / 原值 ${newAsset.bookValue || 0}万元`
    })
    return newAsset
  }

  /**
   * 统一写入口：base 资产直接改，房间级资产回写项目层级。
   * 任何字段变化都会自动产出字段级留痕（H1 业务变更记录）。
   * meta = { module, action, billNo, remark }
   */
  function updateAsset(id, updates, meta = {}) {
    const before = getAssetById(id)
    if (!before) return false
    const beforeSnap = { ...before }

    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    let ok
    if (baseIdx !== -1) {
      baseAssets.value[baseIdx] = { ...baseAssets.value[baseIdx], ...updates }
      ok = true
    } else {
      ok = useProjectStore().updateRoom(id, updates)
    }
    if (!ok) return false

    const after = getAssetById(id) || {}
    useAuditStore().recordDiff({
      assetId: id,
      assetName: after.name || beforeSnap.name,
      group: after.group || beforeSnap.group,
      module: meta.module || '资产台账',
      action: meta.action || '修改',
      before: beforeSnap,
      after,
      billNo: meta.billNo,
      remark: meta.remark,
      fields: Object.keys(updates)
    })
    return true
  }

  function deleteAsset(id, meta = {}) {
    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    if (baseIdx === -1) return false
    const gone = baseAssets.value[baseIdx]
    useAuditStore().recordEvent({
      assetId: id,
      assetName: gone.name,
      group: gone.group,
      module: meta.module || '资产台账',
      action: '删除资产',
      billNo: meta.billNo,
      remark: meta.remark || `删除资产：${gone.name}`,
      detail: `面积 ${gone.area || 0}㎡ / 原值 ${gone.bookValue || 0}万元`
    })
    baseAssets.value.splice(baseIdx, 1)
    return true
  }

  function getAssetById(id) {
    return assets.value.find(a => a.id === id)
  }

  return {
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
