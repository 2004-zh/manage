import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'

/**
 * 证件层（缺口8）：不动产权证之外，基本建设程序还需四类证件。
 * certStatus 由「权证 + 证件齐备度」共同推导，并回写资产。
 * 推导优先级：有权证号→已办证；否则按证件齐备情况给办理中/未办证细分。
 */
export const CREDENTIAL_TYPES = ['用地批准书', '规划许可证', '施工许可证', '竣工备案表']

const initialCredentials = [
  { id: 'ZJ-001', assetId: 'CT-001', group: '城投集团', type: '用地批准书', certNo: '长国土资拨(2019)012号', issuer: '长乐区自然资源局', issueDate: '2019-05-10', status: '有效' },
  { id: 'ZJ-002', assetId: 'CT-001', group: '城投集团', type: '规划许可证', certNo: '建字第350182201900088号', issuer: '长乐区规划局', issueDate: '2019-08-22', status: '有效' },
  { id: 'ZJ-003', assetId: 'CT-006', group: '城投集团', type: '用地批准书', certNo: '长国土资拨(2015)033号', issuer: '长乐区自然资源局', issueDate: '2015-03-18', status: '有效' },
  { id: 'ZJ-004', assetId: 'CT-007', group: '城投集团', type: '施工许可证', certNo: '350182202004150101', issuer: '长乐区住建局', issueDate: '2020-04-15', status: '有效' }
]

export const useCredentialStore = defineStore('credential', () => {
  const credentials = ref(JSON.parse(JSON.stringify(initialCredentials)))

  function getByAsset(assetId) {
    return credentials.value.filter(c => c.assetId === assetId)
  }

  function hasType(assetId, type) {
    return credentials.value.some(c => c.assetId === assetId && c.type === type && c.status === '有效')
  }

  /** 齐备度：已具备的程序证件数 / 总数 */
  function completeness(assetId) {
    const owned = CREDENTIAL_TYPES.filter(t => hasType(assetId, t))
    return { owned, missing: CREDENTIAL_TYPES.filter(t => !hasType(assetId, t)), rate: Math.round(owned.length / CREDENTIAL_TYPES.length * 100) }
  }

  /**
   * 由权证 + 证件共同推导办证状态。
   * 有权证号即视为「已办证」；否则按证件齐备度给细分：
   * 无任何证件→未办证（未启动）；有部分→办理中（材料准备中）；齐全但未领权证→办理中（待领证）。
   */
  function deriveCertStatus(assetId) {
    const asset = useAssetStore().getAssetById(assetId)
    if (!asset) return null
    if (asset.certDetail) return '已办证'
    const { owned, missing } = completeness(assetId)
    if (owned.length === 0) return '未办证（未启动）'
    if (missing.length === 0) return '办证办理中（待领证）'
    return '办证办理中（材料准备中）'
  }

  /** 推导并回写资产 certStatus（仅在状态发生变化时写，避免无谓留痕） */
  function syncAssetCertStatus(assetId) {
    const asset = useAssetStore().getAssetById(assetId)
    if (!asset) return false
    const next = deriveCertStatus(assetId)
    if (!next || next === asset.certStatus) return false
    return useAssetStore().updateAsset(assetId, { certStatus: next }, {
      module: '证件管理', action: '证件推导办证状态', remark: `依据权证与证件齐备度自动更新为「${next}」`
    })
  }

  const credentialList = computed(() => credentials.value.map(c => ({ ...c })))

  const pendingCount = computed(() => {
    // 有证件缺口、且尚未办证的资产数
    const assetStore = useAssetStore()
    return assetStore.assets.filter(a => {
      if (a.certDetail) return false
      return completeness(a.id).owned.length > 0 && completeness(a.id).missing.length > 0
    }).length
  })

  function addCredential(data) {
    const id = `ZJ-${String(credentials.value.length + 1).padStart(3, '0')}`
    const asset = data.assetId ? useAssetStore().getAssetById(data.assetId) : null
    const cred = {
      id,
      assetId: data.assetId || '',
      group: data.group || asset?.group || '',
      type: data.type,
      certNo: data.certNo || '',
      issuer: data.issuer || '',
      issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
      validUntil: data.validUntil || '',
      status: data.status || '有效'
    }
    credentials.value.push(cred)
    useAuditStore().recordEvent({
      assetId: cred.assetId,
      assetName: asset?.name || cred.assetId,
      group: cred.group,
      module: '证件管理',
      action: '登记证件',
      billNo: cred.id,
      remark: `${cred.type} ${cred.certNo}`,
      detail: `发证机关 ${cred.issuer || '—'}`
    })
    syncAssetCertStatus(cred.assetId)
    return cred
  }

  function removeCredential(id) {
    const idx = credentials.value.findIndex(c => c.id === id)
    if (idx === -1) return false
    const [removed] = credentials.value.splice(idx, 1)
    syncAssetCertStatus(removed.assetId)
    return true
  }

  function getCredentialsByCompany(companyName) {
    return credentials.value.filter(c => c.group === companyName)
  }

  return {
    credentials,
    credentialList,
    pendingCount,
    getByAsset,
    hasType,
    completeness,
    deriveCertStatus,
    syncAssetCertStatus,
    addCredential,
    removeCredential,
    getCredentialsByCompany
  }
})
