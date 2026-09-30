import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'
import { useWarningStore } from './warning'

/**
 * 证件层：① 基本建设程序证件；② 产权登记（以资产编号为主键）。
 * 口径约定（三套状态字段不再互相冲突）：
 *  - 资产 certStatus = 办证进度（已办证 / 办证办理中 / 未办证未启动），由权证号 + 证件齐备度推导；
 *  - 证件 validity = 证件时效（有效 / 即将到期 / 已过期 / 长期有效），由 validUntil 实时计算，不入库；
 *  - 产权登记的「权证有无/权证号」不落独立台账，直接写回资产主数据（certDetail / propertyRight）。
 */
export const CREDENTIAL_TYPES = ['用地批准书', '规划许可证', '施工许可证', '竣工备案表']
export const PROPERTY_CERT_TYPES = ['不动产权证', '房产证', '土地证', '规划许可证', '施工许可证']
export const PROPERTY_RIGHT_TYPES = ['房产产权', '土地产权', '不动产产权', '在建工程产权']
/** 距到期多少天内算「即将到期」并触发预警 */
export const EXPIRY_SOON_DAYS = 90

const initialCredentials = [
  { id: 'ZJ-001', assetId: 'CT-001', group: '城投集团', type: '用地批准书', certNo: '长国土资拨(2019)012号', issuer: '长乐区自然资源局', issueDate: '2019-05-10', validUntil: '' },
  { id: 'ZJ-002', assetId: 'CT-001', group: '城投集团', type: '规划许可证', certNo: '建字第350182201900088号', issuer: '长乐区规划局', issueDate: '2019-08-22', validUntil: '2026-11-20' },
  { id: 'ZJ-003', assetId: 'CT-006', group: '产投集团', type: '用地批准书', certNo: '长国土资拨(2015)033号', issuer: '长乐区自然资源局', issueDate: '2015-03-18', validUntil: '2026-08-31' },
  { id: 'ZJ-004', assetId: 'CT-007', group: '水投集团', type: '施工许可证', certNo: '350182202004150101', issuer: '长乐区住建局', issueDate: '2020-04-15', validUntil: '2027-04-14' },
  { id: 'ZJ-005', assetId: 'CT-002', group: '产投集团', type: '竣工备案表', certNo: '长建备(2019)056号', issuer: '长乐区住建局', issueDate: '2019-11-06', validUntil: '' },
  { id: 'ZJ-006', assetId: 'CT-004', group: '领航公司', type: '用地批准书', certNo: '长国土资拨(2020)021号', issuer: '长乐区自然资源局', issueDate: '2020-02-18', validUntil: '' },
  { id: 'ZJ-007', assetId: 'CT-004', group: '领航公司', type: '施工许可证', certNo: '350182202103120088', issuer: '长乐区住建局', issueDate: '2021-03-12', validUntil: '2026-12-28' },
  { id: 'ZJ-008', assetId: 'CT-005', group: '城投集团', type: '用地批准书', certNo: '长国土资拨(2018)077号', issuer: '长乐区自然资源局', issueDate: '2018-07-04', validUntil: '' },
  { id: 'ZJ-009', assetId: 'CT-204', group: '城投集团', type: '规划许可证', certNo: '建字第350182202200031号', issuer: '长乐区规划局', issueDate: '2022-01-20', validUntil: '2026-10-25' },
  { id: 'ZJ-010', assetId: 'CT-008', group: '领航公司', type: '竣工备案表', certNo: '长建备(2020)019号', issuer: '长乐区住建局', issueDate: '2020-09-25', validUntil: '' }
]

/**
 * 产权登记中资产表放不下那几个维度（项目类型/产权类型/比例/附件），
 * 按 assetId 存附加维度；权证有无与权证号仍以资产主数据为准，避免两套编号。
 */
const initialPropertyExtras = {
  'CT-001': { projectType: '资产产权', certType: '不动产权证', propType: '不动产产权', ratioType: '单独所有', ratios: [{ name: '城投集团', ratio: 100 }], files: ['产权证首页.jpg', '产权证附记页.jpg'], remark: '', registerDate: '2020-06-15', updateTime: '2025-06-18 14:22' },
  'CT-002': { projectType: '资产产权', certType: '不动产权证', propType: '房产产权', ratioType: '共同所有', ratios: [{ name: '产投集团', ratio: 60 }, { name: '城投集团', ratio: 40 }], files: ['产权证扫描件.pdf'], remark: '', registerDate: '2019-04-02', updateTime: '2025-07-01 09:40' },
  'CT-003': { projectType: '资产产权', certType: '不动产权证', propType: '不动产产权', ratioType: '单独所有', ratios: [{ name: '水投集团', ratio: 100 }], files: ['不动产权证.pdf'], remark: '', registerDate: '2018-09-12', updateTime: '2024-12-25 15:10' },
  'CT-004': { projectType: '资产产权', certType: '土地证', propType: '土地产权', ratioType: '单独所有', ratios: [{ name: '领航公司', ratio: 100 }], files: ['土地证正面.jpg', '宗地图.pdf'], remark: '', registerDate: '2021-03-20', updateTime: '2025-03-14 09:55' },
  'CT-005': { projectType: '资产产权', certType: '', propType: '土地产权', ratioType: '单独所有', ratios: [{ name: '城投集团', ratio: 100 }], files: [], remark: '历史划拨用地，权证尚在办理中', registerDate: '2024-07-01', updateTime: '2025-04-19 16:48' },
  'CT-006': { projectType: '资产产权', certType: '', propType: '房产产权', ratioType: '单独所有', ratios: [{ name: '产投集团', ratio: 100 }], files: [], remark: '原乡镇企业房产，未办理初始登记', registerDate: '2024-08-12', updateTime: '2025-01-06 14:52' },
  'CT-007': { projectType: '资产产权', certType: '不动产权证', propType: '不动产产权', ratioType: '单独所有', ratios: [{ name: '水投集团', ratio: 100 }], files: ['产权证.pdf'], remark: '', registerDate: '2019-06-15', updateTime: '2025-08-02 10:05' },
  'CT-008': { projectType: '资产产权', certType: '房产证', propType: '房产产权', ratioType: '单独所有', ratios: [{ name: '领航公司', ratio: 100 }], files: ['房产证.jpg'], remark: '', registerDate: '2020-09-25', updateTime: '2025-02-20 10:18' }
}

function pad(n) { return String(n).padStart(2, '0') }

function nowText() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 距到期天数；无日期或非法日期返回 null（视为长期有效） */
export function daysUntil(dateStr) {
  if (!dateStr) return null
  const target = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - todayDate.getTime()) / 86400000)
}

/** 证件时效实时推导：不存字段，改 validUntil 即改状态 */
export function validityOf(cred) {
  const days = daysUntil(cred?.validUntil)
  if (days === null) return '长期有效'
  if (days < 0) return '已过期'
  if (days <= EXPIRY_SOON_DAYS) return '即将到期'
  return '有效'
}

/** 权证类型 → 资产「产权状况」口径 */
function rightLabelOf(certType) {
  const map = { '不动产权证': '有不动产证', '房产证': '有房产证', '土地证': '有土地证', '规划许可证': '仅规划许可', '施工许可证': '仅施工许可' }
  return map[certType] || '有不动产证'
}

export const useCredentialStore = defineStore('credential', () => {
  const credentials = ref(JSON.parse(JSON.stringify(initialCredentials)))
  const propertyExtras = ref(JSON.parse(JSON.stringify(initialPropertyExtras)))

  function assetOf(assetId) {
    return assetId ? useAssetStore().getAssetById(assetId) : null
  }

  /** 富化：归属集团一律以资产主数据为准，时效实时推导 */
  function enrich(cred) {
    const asset = assetOf(cred.assetId)
    return {
      ...cred,
      group: asset?.group || cred.group,
      assetName: asset?.name || '',
      validity: validityOf(cred),
      daysLeft: daysUntil(cred.validUntil)
    }
  }

  function getByAsset(assetId) {
    if (!assetId) return []
    return credentials.value.filter(c => c.assetId === assetId).map(enrich)
  }

  function hasType(assetId, type) {
    return credentials.value.some(c => c.assetId === assetId && c.type === type && validityOf(c) !== '已过期')
  }

  /** 齐备度：已具备且未过期的程序证件数 / 总数 */
  function completeness(assetId) {
    const owned = CREDENTIAL_TYPES.filter(t => hasType(assetId, t))
    return { owned, missing: CREDENTIAL_TYPES.filter(t => !hasType(assetId, t)), rate: Math.round(owned.length / CREDENTIAL_TYPES.length * 100) }
  }

  /**
   * 由权证 + 证件共同推导办证进度。
   * 有权证号即「已办证」；否则按齐备度细分：
   * 无任何证件→未办证（未启动）；有部分→办理中（材料准备中）；齐全但未领证→办理中（待领证）。
   */
  function deriveCertStatus(assetId) {
    const asset = assetOf(assetId)
    if (!asset) return null
    if (asset.certDetail) return '已办证'
    const { owned, missing } = completeness(assetId)
    if (owned.length === 0) return '未办证（未启动）'
    if (missing.length === 0) return '办证办理中（待领证）'
    return '办证办理中（材料准备中）'
  }

  /** 推导并回写资产 certStatus（仅在状态变化时写，避免无谓留痕） */
  function syncAssetCertStatus(assetId) {
    const asset = assetOf(assetId)
    if (!asset) return false
    const next = deriveCertStatus(assetId)
    if (!next || next === asset.certStatus) return false
    return useAssetStore().updateAsset(assetId, { certStatus: next }, {
      module: '证件管理', action: '证件推导办证状态', remark: `依据权证与证件齐备度自动更新为「${next}」`
    })
  }

  const credentialList = computed(() => credentials.value.map(enrich))

  const pendingCount = computed(() =>
    useAssetStore().assets.filter(a => {
      if (a.certDetail) return false
      const { owned, missing } = completeness(a.id)
      return owned.length > 0 && missing.length > 0
    }).length
  )

  /** 时效需要提醒的证件（即将到期 / 已过期） */
  const expiryWatch = computed(() =>
    credentialList.value.filter(c => c.assetId && (c.validity === '即将到期' || c.validity === '已过期'))
  )

  function addCredential(data) {
    const id = `ZJ-${String(credentials.value.length + 1).padStart(3, '0')}`
    const asset = assetOf(data.assetId)
    const cred = {
      id,
      assetId: data.assetId || '',
      group: asset?.group || data.group || '',
      type: data.type,
      certNo: data.certNo || '',
      issuer: data.issuer || '',
      issueDate: data.issueDate || today(),
      validUntil: data.validUntil || '',
      // 展示与归档维度：名称/备注/附件只随证件走，不参与状态推导
      name: data.name || '',
      remark: data.remark || '',
      catType: data.catType || '资产',
      files: data.files || []
    }
    credentials.value.push(cred)
    const enriched = enrich(cred)
    useAuditStore().recordEvent({
      assetId: cred.assetId,
      assetName: enriched.assetName || cred.assetId,
      group: enriched.group,
      module: '证件管理',
      action: '登记证件',
      billNo: cred.id,
      remark: `${cred.type} ${cred.certNo}`,
      detail: `发证机关 ${cred.issuer || '—'}，有效期至 ${cred.validUntil || '长期'}`
    })
    syncAssetCertStatus(cred.assetId)
    syncExpiryWarnings([enriched])
    return enriched
  }

  function updateCredential(id, updates) {
    const idx = credentials.value.findIndex(c => c.id === id)
    if (idx === -1) return false
    const before = credentials.value[idx]
    const after = { ...before, ...updates }
    // 时效字段不入库：validity 由 validUntil 推导，忽略外部直接传入的 status
    delete after.status
    credentials.value[idx] = after
    useAuditStore().recordDiff({
      assetId: after.assetId,
      assetName: enrich(after).assetName,
      group: enrich(after).group,
      module: '证件管理',
      action: '修改证件',
      before,
      after,
      billNo: id,
      // name/type 在资产侧另有含义（资产名称/资产类型），证件侧改这两项时按证件口径出标签
      labels: { name: '证件名称', type: '证件类型', assetId: '关联资产' },
      remark: updates.remark || `${after.type} 信息变更`
    })
    syncAssetCertStatus(after.assetId)
    syncExpiryWarnings([enrich(after)])
    return true
  }

  function removeCredential(id) {
    const idx = credentials.value.findIndex(c => c.id === id)
    if (idx === -1) return false
    const [removed] = credentials.value.splice(idx, 1)
    const enriched = enrich(removed)
    useAuditStore().recordEvent({
      assetId: removed.assetId,
      assetName: enriched.assetName || removed.assetId,
      group: enriched.group,
      module: '证件管理',
      action: '注销证件',
      billNo: removed.id,
      remark: `${removed.type} ${removed.certNo}`,
      detail: '证件档案注销，办证进度按剩余证件重算'
    })
    syncAssetCertStatus(removed.assetId)
    return true
  }

  function getCredentialsByCompany(companyName) {
    return credentialList.value.filter(c => c.group === companyName)
  }

  // ===== 产权登记：行以资产编号为主键，权证信息直接回写资产主数据 =====
  function extrasOf(assetId) {
    const x = propertyExtras.value[assetId] || {}
    return {
      projectType: x.projectType || '资产产权',
      certType: x.certType || '',
      propType: x.propType || '',
      ratioType: x.ratioType || '单独所有',
      ratios: x.ratios || [],
      files: x.files || [],
      remark: x.remark || '',
      registerDate: x.registerDate || '',
      updateTime: x.updateTime || ''
    }
  }

  /**
   * 产权登记清单 = 已办证的资产（自动成行，编号必然对得上）+ 人工登记过的无证资产。
   * hasCert/certNo 取自主数据，其余维度取自 propertyExtras。
   */
  const propertyCerts = computed(() => {
    const assetStore = useAssetStore()
    const ids = new Set(Object.keys(propertyExtras.value))
    assetStore.assets.forEach(a => { if (a.certDetail) ids.add(a.id) })
    const rows = []
    ids.forEach(id => {
      const a = assetStore.getAssetById(id)
      if (!a) return
      const x = extrasOf(id)
      rows.push({
        id: `CQ-${id}`,
        assetId: id,
        assetNo: id,
        assetName: a.name,
        location: a.location,
        company: a.group,
        leaseStatus: a.status,
        certStatus: a.certStatus,
        hasCert: a.certDetail ? '有' : '无',
        certNo: a.certDetail || '',
        certType: x.certType || (a.certDetail ? '不动产权证' : ''),
        projectType: x.projectType,
        propType: x.propType,
        ratioType: x.ratioType,
        ratios: x.ratios,
        files: x.files,
        remark: x.remark,
        registerDate: x.registerDate,
        updateTime: x.updateTime,
        asset: {
          region: a.region || '福建省福州市长乐区',
          projectName: a.projectName || a.project || '—',
          projectAddr: a.location || '—',
          zone: a.zoneName || a.partition || '—',
          assetName: a.name,
          assetNo: id,
          assetAddr: a.location || '—',
          leaseStatus: a.status,
          status: a.certStatus?.includes('已办证') ? '正常' : '待补证'
        }
      })
    })
    // 越晚登记的编号越大，默认倒序
    return rows.sort((l, r) => (l.assetId < r.assetId ? 1 : -1))
  })

  function propertyCertOf(assetId) {
    return propertyCerts.value.find(r => r.assetId === assetId) || null
  }

  /**
   * 保存产权登记：附加维度入 propertyExtras，权证号/办证进度/产权状况回写资产，
   * 回写走 updateAsset 所以字段级留痕与台账、详情抽屉自动同步。
   */
  function savePropertyCert(data) {
    const asset = assetOf(data.assetId)
    if (!asset) return { ok: false, message: '请选择有效资产' }
    const certNo = String(data.certNo || '').trim()
    const hasCert = data.hasCert === '有' ? '有' : '无'
    if (hasCert === '有' && !certNo) return { ok: false, message: '产权证为「有」时必须填写产权编号' }

    const prev = extrasOf(data.assetId)
    propertyExtras.value = {
      ...propertyExtras.value,
      [data.assetId]: {
        ...prev,
        projectType: data.projectType || prev.projectType,
        certType: hasCert === '有' ? (data.certType || prev.certType || '不动产权证') : '',
        propType: data.propType || prev.propType,
        ratioType: data.ratioType || prev.ratioType,
        ratios: (data.ratios || []).filter(r => r && r.name).map(r => ({ name: r.name, ratio: Number(r.ratio) || 0 })),
        files: data.files ?? prev.files,
        remark: data.remark ?? prev.remark,
        registerDate: prev.registerDate || today(),
        updateTime: nowText()
      }
    }

    const updates = {}
    const nextDetail = hasCert === '有' ? certNo : ''
    if ((asset.certDetail || '') !== nextDetail) updates.certDetail = nextDetail
    const nextRight = hasCert === '有' ? rightLabelOf(data.certType || prev.certType) : '无证'
    if ((asset.propertyRight || '') !== nextRight) updates.propertyRight = nextRight
    const nextCertStatus = hasCert === '有' ? '已办证' : deriveCertStatus(data.assetId)
    if (nextCertStatus && (asset.certStatus || '') !== nextCertStatus) updates.certStatus = nextCertStatus

    const meta = {
      module: '产权信息',
      action: '产权登记',
      billNo: `CQ-${data.assetId}`,
      remark: hasCert === '有'
        ? `录入${data.certType || prev.certType || '权证'}：${certNo}`
        : `登记为无证：${data.remark || prev.remark || '缺证原因待补'}`
    }
    if (Object.keys(updates).length) {
      useAssetStore().updateAsset(data.assetId, updates, meta)
    } else {
      // 只改了比例/附件等附加维度时，主数据无差异，补一条动作留痕
      useAuditStore().recordEvent({
        assetId: data.assetId,
        assetName: asset.name,
        group: asset.group,
        module: meta.module,
        action: meta.action,
        billNo: meta.billNo,
        remark: meta.remark,
        detail: `产权比例 ${data.ratioType || prev.ratioType}，共有人 ${(data.ratios || prev.ratios).map(r => r.name).join('、') || '—'}`
      })
    }
    syncAssetCertStatus(data.assetId)
    return { ok: true, assetId: data.assetId, updates }
  }

  /**
   * 到期预警：为即将到期/已过期证件生成预警任务（addTask 按 billNo+type 幂等）。
   * 传入子集时只扫子集，默认全量扫描（页面进入时调用）。
   */
  function syncExpiryWarnings(list) {
    const warningStore = useWarningStore()
    const targets = list || expiryWatch.value
    let created = 0
    targets.forEach(c => {
      if (!c.assetId) return
      if (c.validity !== '即将到期' && c.validity !== '已过期') return
      const expired = c.validity === '已过期'
      const task = warningStore.addTask({
        name: `${c.assetName || c.assetId} ${c.type}${c.validity}`,
        asset: `${c.assetId} ${c.assetName || ''}`.trim(),
        type: '证件到期',
        deadline: c.validUntil,
        priority: expired ? '高' : '中',
        // 预警页等级口径是 一般/较急/紧急/特别紧急，别把优先级值塞进 level
        level: expired ? '紧急' : '较急',
        trigger: '按证件有效期自动扫描',
        group: c.group,
        billNo: `ZJX-${c.id}`
      })
      if (task) created += 1
    })
    return created
  }

  // 旧缓存兼容：$patch 会用旧 credentials 数组整体覆盖，这里补齐新增种子、
  // 回填缺失的 validUntil（当时状态是写死的）、丢弃已废弃的 status 字段、归属集团对齐资产。
  function onHydrated() {
    const seedById = new Map(initialCredentials.map(c => [c.id, c]))
    const known = new Set(credentials.value.map(c => c.id))
    credentials.value = credentials.value.map(c => {
      const next = { ...c }
      if (next.validUntil === undefined && seedById.has(next.id)) next.validUntil = seedById.get(next.id).validUntil
      delete next.status
      const asset = assetOf(next.assetId)
      if (asset && next.group !== asset.group) next.group = asset.group
      return next
    })
    const missing = initialCredentials.filter(c => !known.has(c.id))
    if (missing.length) credentials.value = [...credentials.value, ...missing.map(c => ({ ...c }))]
  }

  return {
    credentials,
    propertyExtras,
    credentialList,
    propertyCerts,
    expiryWatch,
    pendingCount,
    getByAsset,
    propertyCertOf,
    extrasOf,
    hasType,
    completeness,
    deriveCertStatus,
    syncAssetCertStatus,
    addCredential,
    updateCredential,
    removeCredential,
    getCredentialsByCompany,
    savePropertyCert,
    syncExpiryWarnings,
    onHydrated
  }
})
