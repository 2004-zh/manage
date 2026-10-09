import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chengtouAssets as initialAssets, SEED_IMPORT_TS } from '../data/mock'
import { resolveAssetCategory } from '../data/assetCategory'
import { useProjectStore } from './project'
import { useAuditStore } from './audit'
import { useUserStore } from './user'
import { useContractStore } from './contract'
import { useMortgageStore } from './mortgage'
import { useLeaseStore } from './lease'
import { useCredentialStore } from './credential'
import { useControlStore } from './control'
import { useFinanceStore } from './finance'
import { useRevitalizeStore } from './revitalize'
import { useWarningStore } from './warning'

function roomToAsset(r, b, p, f) {
  const unitPrice = b.type.includes('住宅') ? 0.8 : b.type.includes('商业') || b.type.includes('办公') ? 1.2 : 1.0
  return {
    id: r.id,
    name: r.name,
    assetNo: r.assetNo,
    assetCategory: resolveAssetCategory({ type: b.type }),
    type: b.type,
    area: r.area,
    bookValue: Math.round(r.area * unitPrice * 100) / 100,
    location: `${b.address} ${p.name} ${f.name}`,
    status: r.status,
    certStatus: r.certStatus || (r.hasPropertyRight ? '已办证' : '未办证（未启动）'),
    certDetail: r.hasPropertyRight ? `闽(2023)长乐区不动产权第${r.id.replace(/\D/g, '').padStart(7, '0')}号` : '',
    group: b.group,
    projectId: b.id,
    partitionId: p.id,
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
    annualRent: r.monthlyRent ? r.monthlyRent * 12 / 10000 : null,
    // 房间级资产随项目结构批次入库，登记时间与存量种子同一口径
    createdAt: SEED_IMPORT_TS
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

  // ===== 项目口径 =====
  // 房间级资产由项目层级派生，平铺资产靠 projectId 标签挂进来，两条路归到同一份索引，
  // 项目管理 / 资产管控 / 地图 / 台账读同一份数，不再各自遍历项目结构。
  const projectIndex = computed(() => {
    const map = new Map()
    assets.value.forEach(a => {
      if (!a.projectId) return
      if (!map.has(a.projectId)) map.set(a.projectId, [])
      map.get(a.projectId).push(a)
    })
    return map
  })

  function getProjectAssets(projectId) {
    return projectIndex.value.get(projectId) || []
  }

  function projectStats(projectId) {
    const list = getProjectAssets(projectId)
    const totalAssets = list.length
    const totalArea = Math.round(list.reduce((s, a) => s + (Number(a.area) || 0), 0) * 100) / 100
    const rentedCount = list.filter(a => a.status === '已出租' || a.status === '部分出租').length
    const idleCount = list.filter(a => a.status === '闲置' || a.status === '空置').length
    const rentalRate = totalAssets ? Math.round(rentedCount / totalAssets * 10000) / 100 : 0
    return { totalAssets, totalArea, rentedCount, idleCount, rentalRate }
  }

  // 本公司名下、还没挂到任何项目下的平铺资产，供「挂入已有资产」挑选
  const unattachedAssets = computed(() => visibleAssets.value.filter(a => !a.projectId))

  // 项目下所有资产：结构房间 + 手动挂入的平铺资产，供项目管理页/分区管理展示
  function attachedAssetsOf(projectId) {
    return getProjectAssets(projectId)
  }

  function isBaseAsset(id) {
    return baseAssets.value.some(a => a.id === id)
  }

  /**
   * 把一条平铺资产挂进项目的某个分区/楼层：只打标签、不搬记录，
   * 台账里仍是一条，账面价值/结构/装修等登记字段也不会丢。
   * 企业端不允许把别家集团的资产挂到本公司项目下。
   */
  function attachToProject(assetId, target, meta = {}) {
    const project = useProjectStore().getProjectById(target.projectId)
    const asset = getAssetById(assetId)
    if (!project || !asset || !isBaseAsset(assetId)) return false
    const org = useUserStore().user
    if (org && org.endpoint === 'ent' && asset.group !== org.org) return false
    return updateAsset(assetId, {
      projectId: project.id,
      partitionId: target.partitionId || '',
      projectName: project.name,
      zoneName: target.zoneName,
      floorName: target.floorName
    }, { module: '项目管理', action: '资产挂入项目', remark: meta.remark || `挂入「${project.name} ${target.zoneName} ${target.floorName}」` })
  }

  function detachFromProject(assetId, meta = {}) {
    if (!isBaseAsset(assetId)) return false
    return updateAsset(assetId, {
      projectId: '', partitionId: '', projectName: '', zoneName: '', floorName: ''
    }, { module: '项目管理', action: '资产移出项目', remark: meta.remark || '从项目总览移出' })
  }

  // 缓存恢复后：① 按 id 补齐后续版本新增的种子资产（$patch 会用旧数组整体覆盖 baseAssets）；
  // ② 一次性还原旧版本被压错的资产分类。用户自行登记的资产与主动删除的记录都不动。
  const SEED_CATEGORY_FIX = 'ams:seed-category-fixed-v2'
  // v1 那次回填基本没生效：当时种子本身就没有时间戳，回填映射是空的，但标志位已落盘，
  // 所以升到 v2 让所有老缓存再跑一次（回填只补缺失字段，不会覆盖运行期写入的值）。
  const SEED_TS_BACKFILL = 'ams:seed-timestamps-backfilled-v2'
  function syncSeedsAfterHydrate() {
    const known = new Set(baseAssets.value.map(a => a.id))
    const missing = initialAssets.filter(a => !known.has(a.id))
    if (missing.length) baseAssets.value = [...baseAssets.value, ...missing]

    // 老缓存里的种子资产可能没有 createdAt/purchaseDate（登记时间戳字段本次才补上）。
    // 只从种子定义回填这两个缺失字段，不覆盖运行时新写入的值，也不碰用户自行登记的资产。
    if (!localStorage.getItem(SEED_TS_BACKFILL)) {
      const seedTs = new Map(initialAssets.filter(a => a.createdAt || a.purchaseDate).map(a => [a.id, a]))
      if (seedTs.size) {
        baseAssets.value = baseAssets.value.map(a => {
          const seed = seedTs.get(a.id)
          if (!seed) return a
          const patch = {}
          if (!a.createdAt && seed.createdAt) patch.createdAt = seed.createdAt
          if (!a.updatedAt && seed.updatedAt) patch.updatedAt = seed.updatedAt
          if (!a.purchaseDate && seed.purchaseDate) patch.purchaseDate = seed.purchaseDate
          return Object.keys(patch).length ? { ...a, ...patch } : a
        })
      }
      localStorage.setItem(SEED_TS_BACKFILL, '1')
    }

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

  function formatNow(d = new Date()) {
    const p = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }

  function addAsset(asset, meta = {}) {
    const newId = nextAssetId()
    // 真实登记时刻：新入库资产以当前时间打戳，而不是让台账写死一个占位日期冒充创建时间。
    // 若调用方（如批量导入）自带 createdAt/updatedAt 则尊重传入值。
    const now = formatNow()
    const newAsset = { createdAt: now, updatedAt: now, ...asset, id: newId }
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
      baseAssets.value[baseIdx] = { ...baseAssets.value[baseIdx], ...updates, updatedAt: formatNow() }
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
    return true
  }

  /**
   * base 资产真删；房间级资产来自项目派生数据，不能删源，用 removedIds 从台账口径剔除。
   * 删除前检查在租合同——有活跃合同时拒绝删除，并级联清理关联数据。
   */
  function deleteAsset(id, meta = {}) {
    const before = getAssetById(id)
    if (!before) return false

    // 有活跃合同时拦截，避免产生孤儿合同和收费记录
    if (!meta.force) {
      const cs = useContractStore()
      const actives = cs.contracts.filter(c => c.assetId === id && c.status !== '已终止' && c.status !== '退租')
      if (actives.length) return false
    }

    // 先记录审计（在数据消失前保留资产名和详情）
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

    // 级联清理其他 store 中引用该资产的记录
    cascadeCleanup(id, before.name)

    const baseIdx = baseAssets.value.findIndex(a => a.id === id)
    if (baseIdx !== -1) {
      baseAssets.value.splice(baseIdx, 1)
    } else {
      removedIds.value.push(id)
    }
    return true
  }

  function cascadeCleanup(assetId, assetName) {
    // 财务：在删除合同前，先标记账单、保证金、收费记录（需要合同→资产映射）
    try {
      const fs = useFinanceStore()
      const csLocal = useContractStore()
      fs.bills.forEach(b => {
        if (b.assetId === assetId || (b.contractId && csLocal.contracts.some(c => c.id === b.contractId && c.assetId === assetId))) {
          b.assetDeleted = true
          b.remark = (b.remark ? b.remark + '；' : '') + `资产 ${assetName} 已删除，不再计入收入`
        }
      })
      fs.deposits.forEach(d => {
        if (d.assetId === assetId) {
          d.assetDeleted = true
          d.remark = (d.remark ? d.remark + '；' : '') + `资产 ${assetName} 已删除`
        }
      })
    } catch (_) {}

    try {
      const cs2 = useContractStore()
      cs2.feeRecords.forEach(f => {
        if (f.assetId === assetId || (f.contractId && cs2.contracts.some(c => c.id === f.contractId && c.assetId === assetId))) {
          f.assetDeleted = true
          f.remark = (f.remark ? f.remark + '；' : '') + `资产 ${assetName} 已删除，不再计入收入`
        }
      })
    } catch (_) {}

    // 合同：清除该资产的合同（收费记录已在上方标记保留）
    try {
      const cs = useContractStore()
      cs.contracts = cs.contracts.filter(c => c.assetId !== assetId)
    } catch (_) {}

    // 抵押记录
    try {
      const ms = useMortgageStore()
      ms.mortgages = ms.mortgages.filter(m => m.assetId !== assetId)
    } catch (_) {}

    // 招租公告 / 房源 / 报名 / 竞价
    try {
      const ls = useLeaseStore()
      ls.releases = ls.releases.filter(r => r.assetId !== assetId)
      const removedNoticeNos = new Set(ls.notices.filter(n => n.assetId === assetId).map(n => n.noticeNo))
      ls.notices = ls.notices.filter(n => n.assetId !== assetId)
      if (removedNoticeNos.size) {
        ls.registrants = ls.registrants.filter(r => !removedNoticeNos.has(r.noticeNo))
        ls.bids = ls.bids.filter(b => !removedNoticeNos.has(b.noticeNo))
        ls.results = ls.results.filter(r => !removedNoticeNos.has(r.noticeNo))
      }
    } catch (_) {}

    // 权证
    try {
      const cs = useCredentialStore()
      cs.credentials = cs.credentials.filter(c => c.assetId !== assetId)
    } catch (_) {}

    // 管控规则
    try {
      const cs = useControlStore()
      cs.rules = cs.rules.filter(r => r.assetId !== assetId)
    } catch (_) {}

    // 盘活记录
    try {
      const rs = useRevitalizeStore()
      rs.flows = rs.flows.filter(f => f.assetId !== assetId)
      rs.targets = rs.targets.filter(t => t.assetId !== assetId)
    } catch (_) {}

    // 项目结构：如果资产对应项目里的房间，移除
    try {
      const ps = useProjectStore()
      for (const p of ps.projects) {
        for (const part of (p.partitions || [])) {
          for (const fl of (part.floors || [])) {
            const rmIdx = fl.rooms.findIndex(r => r.id === assetId)
            if (rmIdx !== -1) fl.rooms.splice(rmIdx, 1)
          }
        }
      }
    } catch (_) {}

    // 预警任务：完结该资产相关的未完成任务
    try {
      const ws = useWarningStore()
      ws.warningTasks.forEach(t => {
        const token = String(t.asset || '').trim().split(/\s+/)[0]
        if (token === assetId && t.status !== '已完成' && t.status !== '已审核') {
          ws.updateTaskStatus(t.id, '已完成', { remark: `资产 ${assetName} 已删除，预警自动完结` })
        }
      })
    } catch (_) {}
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
    getProjectAssets,
    attachedAssetsOf,
    projectStats,
    unattachedAssets,
    attachToProject,
    detachFromProject,
    certRecords,
    getAssetsByCompany,
    addAsset,
    updateAsset,
    deleteAsset,
    getAssetById
  }
})
