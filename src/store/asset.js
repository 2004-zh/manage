import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chengtouAssets as initialAssets } from '../data/mock'
import { resolveAssetCategory } from '../data/assetCategory'
import { useProjectStore } from './project'
import { useAuditStore } from './audit'
import { useChangeLogStore } from './changeLog'
import { useUserStore } from './user'

function roomToAsset(r, b, p, f) {
  return {
    id: r.id,
    name: r.name,
    assetNo: r.assetNo,
    assetCategory: resolveAssetCategory({ type: b.type }),
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

  // 分类在此统一落定：人工选过的算数，没选过的按资产类型推断，页面只读不再各自猜。
  const assets = computed(() =>
    [...baseAssets.value, ...roomAssets.value]
      .filter(a => !removedIds.value.includes(a.id))
      .map(a => {
        const merged = overrides.value[a.id] ? { ...a, ...overrides.value[a.id] } : a
        const category = resolveAssetCategory(merged)
        return category === merged.assetCategory ? merged : { ...merged, assetCategory: category }
      })
  )

  const allAssets = computed(() => assets.value)

  // 企业端登录账号只看本公司资产，监管端不过滤。ent 页面一律读这个 getter，
  // 避免每个页面各写一份公司过滤、也避免漏写导致跨公司可见。
  const visibleAssets = computed(() => {
    const user = useUserStore().user
    if (!user || user.endpoint !== 'ent') return assets.value
    return assets.value.filter(a => a.group === user.org)
  })

  // 缓存恢复后：① 按 id 补齐后续版本新增的种子资产（$patch 会用旧数组整体覆盖 baseAssets）；
  // ② 一次性还原旧版本被压错的资产分类。用户自行登记的资产与主动删除的记录都不动。
  const SEED_CATEGORY_FIX = 'ams:seed-category-fixed-v2'
  function syncSeedsAfterHydrate() {
    const known = new Set(baseAssets.value.map(a => a.id))
    const missing = initialAssets.filter(a => !known.has(a.id))
    if (missing.length) baseAssets.value = [...baseAssets.value, ...missing]

    if (localStorage.getItem(SEED_CATEGORY_FIX)) return
    const seedCategory = new Map(initialAssets.map(a => [a.id, a.assetCategory]))
    baseAssets.value = baseAssets.value.map(a =>
      seedCategory.has(a.id) && a.assetCategory !== seedCategory.get(a.id)
        ? { ...a, assetCategory: seedCategory.get(a.id) }
        : a)
    const cleaned = {}
    Object.entries(overrides.value).forEach(([id, patch]) => {
      if (!seedCategory.has(id) || patch.assetCategory === undefined) { cleaned[id] = patch; return }
      const { assetCategory, ...rest } = patch
      if (Object.keys(rest).length) cleaned[id] = rest
    })
    overrides.value = cleaned
    localStorage.setItem(SEED_CATEGORY_FIX, '1')
  }

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

  function nextAssetId() {
    // 种子里有 CT-2xx 段落，取现有最大号 +1 而不是数组长度，避免新增资产撞号
    const max = baseAssets.value.reduce((m, a) => {
      const n = /^CT-(\d+)$/.exec(a.id)
      return n ? Math.max(m, Number(n[1])) : m
    }, 0)
    return `CT-${String(max + 1).padStart(3, '0')}`
  }

  function addAsset(asset, meta = {}) {
    const newId = nextAssetId()
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
    // 变更记录页目前读 changeLog，双写保证两侧都看得到
    useChangeLogStore().record({
      assetId: newId, assetName: newAsset.name, module: '资产', type: '入库登记',
      before: '—', after: newAsset.sourceType ? `${newAsset.sourceType}入库` : '新增资产'
    })
    return newAsset
  }

  /**
   * 统一写入口：base 资产直接改，房间级资产回写项目层级源数据，
   * 两者都不适用时才落到 overrides 覆盖层兜底。
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
    } else if (useProjectStore().updateRoom(id, updates)) {
      ok = true
    } else if (assets.value.some(a => a.id === id)) {
      overrides.value = { ...overrides.value, [id]: { ...overrides.value[id], ...updates } }
      ok = true
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

    const changed = Object.keys(updates).filter(k => beforeSnap[k] !== updates[k])
    if (changed.length) {
      const statusChanged = changed.includes('status')
      useChangeLogStore().record({
        assetId: id, assetName: after.name || beforeSnap.name, module: '资产',
        type: statusChanged ? '状态变更' : '信息变更',
        before: statusChanged ? beforeSnap.status : changed.join('、'),
        after: statusChanged
          ? (updates.status ?? after.status)
          : changed.map(k => `${k}→${updates[k] ?? '空'}`).join('；')
      })
    }
    return true
  }

  /**
   * base 资产真删；房间级资产来自项目派生数据，不能删源，用 removedIds 从台账口径剔除。
   */
  function deleteAsset(id, meta = {}) {
    const before = getAssetById(id)
    if (!before) return false
    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    if (baseIdx !== -1) {
      baseAssets.value.splice(baseIdx, 1)
    } else {
      removedIds.value.push(id)
    }
    useAuditStore().recordEvent({
      assetId: id,
      assetName: before.name,
      group: before.group,
      module: meta.module || '资产台账',
      action: '删除资产',
      billNo: meta.billNo,
      remark: meta.remark || `删除资产：${before.name}`,
      detail: `面积 ${before.area || 0}㎡ / 原值 ${before.bookValue || 0}万元`
    })
    useChangeLogStore().record({
      assetId: id, assetName: before.name, module: '资产', type: '资产删除',
      before: '在库', after: '已删除'
    })
    return true
  }

  function getAssetById(id) {
    return assets.value.find(a => a.id === id)
  }

  return {
    // 暴露原始 state，使 persist 插件能通过 $state 保存/恢复资产变更
    baseAssets,
    overrides,
    removedIds,
    onHydrated: syncSeedsAfterHydrate,
    assets,
    allAssets,
    visibleAssets,
    certRecords,
    getAssetsByCompany,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetById
  }
})
