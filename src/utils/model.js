/**
 * 数据模型底座 · P0
 *
 * 纯常量与纯函数，不依赖 Vue / Pinia / 组件，不读写任何 store，无副作用。
 * 目的：给「主键、枚举、单位、日期、编号」建立单一口径，供 P1 起逐步接入。
 * P0 不改动任何现有页面与业务行为；标准值刻意沿用项目现有中文写法，避免接入时破坏 UI。
 */

/* ============================================================
 * 1. 枚举字典
 *    values = 标准值；aliases = 历史同义词 → 标准值。
 *    未收录的词原样返回，便于调用方发现新词并补录。
 * ============================================================ */
export const DICT = {
  assetStatus: {
    label: '资产状态',
    values: ['闲置', '已出租', '部分出租', '自用', '维修中', '已抵押', '已处置'],
    aliases: {
      '空置': '闲置', '空闲': '闲置', '未使用': '闲置', '未出租': '闲置',
      '已租赁': '已出租', '出租': '已出租', '在租': '已出租',
      '已占用': '自用', '自用中': '自用',
      '已报废': '已处置', '报废': '已处置'
    }
  },
  leaseStatus: {
    label: '租赁状态',
    values: ['未出租', '已出租', '部分出租', '自用中'],
    aliases: {
      '未租赁': '未出租', '在租': '已出租', '已租赁': '已出租',
      '正常': '已出租', '自用': '自用中', '已退租': '未出租'
    }
  },
  certStatus: {
    label: '办证状态',
    values: ['已办证', '未办证（办理中）', '未办证（未启动）'],
    aliases: {
      '未办证': '未办证（未启动）', '办理中': '未办证（办理中）',
      '未启动': '未办证（未启动）', '无': '未办证（未启动）', '待补证': '未办证（未启动）'
    }
  },
  certValidity: {
    // 与 certStatus 同名不同义的历史字段，接入时须改用本域
    label: '证件有效期状态',
    values: ['正常', '即将到期', '已过期'],
    aliases: { '有效': '正常', '已失效': '已过期' }
  },
  contractStatus: {
    label: '合同履约状态',
    values: ['正常', '欠缴', '临期', '已到期', '已终止', '退租'],
    aliases: { '已退租': '退租', '终止': '已终止', '待起租': '临期' }
  },
  approvalStatus: {
    label: '审批状态',
    values: ['待审批', '审批中', '已通过', '已驳回'],
    aliases: {
      '已拒绝': '已驳回', '审批通过': '已通过', '审核中': '审批中',
      '待审核': '待审批', '待处理': '待审批'
    }
  },
  docStatus: {
    label: '单据状态',
    values: ['待提交', '进行中', '已完结', '已驳回', '已撤销'],
    aliases: {
      '已完成': '已完结', '完成': '已完结', '取消': '已撤销',
      '盘点中': '进行中', '处理中': '进行中', '已办结': '已完结'
    }
  },
  payStatus: {
    label: '缴费状态',
    values: ['待缴费', '已缴费', '部分缴费', '已逾期'],
    aliases: {
      '待缴纳': '待缴费', '已缴纳': '已缴费', '待收': '待缴费', '已收': '已缴费',
      '欠缴': '已逾期', '正常': '已缴费'
    }
  },
  disposeStatus: {
    label: '处置状态',
    values: ['待审批', '进行中', '已完成', '已取消'],
    aliases: { '完成': '已完成', '取消': '已取消', '已驳回': '已取消', '已通过': '进行中' }
  },
  // 固定资产是独立的生命周期口径，不能与经营性资产的 assetStatus 混用；P2 再谈收敛
  fixedAssetStatus: {
    label: '固定资产状态',
    values: ['空闲', '派发中', '借出中', '维修中', '处置中'],
    aliases: { '闲置': '空闲', '已处置': '处置中' }
  },
  fixedDocStatus: {
    label: '固定资产单据状态',
    values: ['已撤销', '待提交', '已完结', '进行中', '已驳回'],
    aliases: {}
  }
}

export function statusValues(domain) {
  return DICT[domain]?.values ? [...DICT[domain].values] : []
}

export function normalizeStatus(domain, value) {
  const d = DICT[domain]
  if (!d) return value == null ? '' : String(value)
  if (value == null || value === '') return ''
  const s = String(value).trim()
  if (d.values.includes(s)) return s
  return d.aliases[s] || s
}

export function sameStatus(domain, a, b) {
  return normalizeStatus(domain, a) === normalizeStatus(domain, b)
}

/** 诊断用：找出一个中文状态词在哪些语义域出现，暴露 status 多义问题 */
export function findStatusDomains(value) {
  const s = String(value ?? '').trim()
  if (!s) return []
  return Object.keys(DICT).filter(domain => {
    const d = DICT[domain]
    return d.values.includes(s) || Object.prototype.hasOwnProperty.call(d.aliases, s)
  })
}

/* ============================================================
 * 2. 金额：内部统一以「元」为基准单位，换算只发生在展示层
 * ============================================================ */
export const YUAN_PER_WAN = 10000
export const MONEY_BASE_UNIT = '元'

export function wanToYuan(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * YUAN_PER_WAN * 100) / 100 : 0
}

export function yuanToWan(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round((n / YUAN_PER_WAN) * 10000) / 10000 : 0
}

/** unit 为 '万元' 时换算成元；其余按元处理 */
export function toYuan(value, unit = MONEY_BASE_UNIT) {
  return unit === '万元' ? wanToYuan(value) : (Number.isFinite(Number(value)) ? Number(value) : 0)
}

/** 展示层：元 → 指定单位的可读字符串 */
export function formatMoney(yuan, { unit = MONEY_BASE_UNIT, digits = 2 } = {}) {
  const n = unit === '万元' ? yuanToWan(yuan) : Number(yuan) || 0
  return n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/* ============================================================
 * 3. 日期：统一 YYYY-MM-DD / YYYY-MM-DD HH:mm:ss，一律用本地时区
 *    （历史代码大量使用 toISOString().slice(0,10)，东八区 0:00-8:00 会差一天）
 * ============================================================ */
const pad2 = n => String(n).padStart(2, '0')

export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function nowISO(date = new Date()) {
  return `${todayISO(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

/** 返回 'YYYY-MM-DD'；无法解析返回 null；空值返回 ''；「长期有效」等文本明确返回 null */
export function toISODate(value) {
  if (value == null || value === '') return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : todayISO(value)
  const s = String(value).trim()
  if (/长期|永久|无期限|不限|暂无|待定/.test(s)) return null
  const m = s.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/)
  if (m) return `${m[1]}-${pad2(Number(m[2]))}-${pad2(Number(m[3]))}`
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : todayISO(d)
}

export function toISODateTime(value) {
  if (value == null || value === '') return ''
  const date = toISODate(value)
  if (!date) return date
  const m = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (m) return `${date} ${pad2(Number(m[1]))}:${m[2]}:${m[3] || '00'}`
  return `${date} 00:00:00`
}

/** 到期预警：在 base 起 days 天内到期返回 true；非法/长期有效返回 false */
export function isExpiryWithin(dateValue, days, base = new Date()) {
  const iso = toISODate(dateValue)
  if (!iso) return false
  const target = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(target.getTime())) return false
  const from = new Date(`${todayISO(base)}T00:00:00`)
  const diff = Math.round((target - from) / 86400000)
  return diff <= days
}

/* ============================================================
 * 4. 编号：描述现有前缀 + 提供不撞号的生成器
 *    ambiguous = 该前缀在项目里已被多种业务共用，P1 需按域消歧
 * ============================================================ */
export const NO_RULES = [
  { prefix: 'BLD-', domain: 'project', desc: '项目/楼栋' },
  { prefix: 'PART-', domain: 'project', desc: '项目分区' },
  { prefix: 'ZONE-', domain: 'project', desc: '楼层分区' },
  { prefix: 'AST-', domain: 'room', desc: '房间资产号' },
  { prefix: 'RM-', domain: 'room', desc: '项目房间 id' },
  { prefix: 'CT-', domain: 'asset', desc: '经营性资产主数据 id' },
  { prefix: 'ZC-', domain: 'lease', desc: '招租挂牌单号', ambiguous: true },
  { prefix: 'ZC', domain: 'asset', desc: '资产编号（开票/账单/固定资产入库/招租多义）', ambiguous: true },
  { prefix: 'GD', domain: 'fixedAsset', desc: '固定资产卡片编码（与维修工单 GD 撞前缀）', ambiguous: true },
  { prefix: 'WC', domain: 'intangible', desc: '无形资产编号' },
  { prefix: 'HT-', domain: 'contract', desc: '合同编号（现存 3 种位数格式）', ambiguous: true },
  { prefix: 'BG', domain: 'change', desc: '变更单（资产变更与规划变更撞号）', ambiguous: true },
  { prefix: 'DB-', domain: 'supervise', desc: '督办单（与调拨单 DB 冲突）', ambiguous: true },
  { prefix: 'DB', domain: 'transfer', desc: '调拨单据', ambiguous: true },
  { prefix: 'WX', domain: 'repair', desc: '维修单据' },
  { prefix: 'CZ', domain: 'dispose', desc: '处置单（两种格式并存）', ambiguous: true },
  { prefix: 'PD-', domain: 'inventory', desc: '盘点单' },
  { prefix: 'PF', domain: 'dispatch', desc: '派发单' },
  { prefix: 'TK', domain: 'return', desc: '退库单' },
  { prefix: 'JC', domain: 'borrow', desc: '借出单' },
  { prefix: 'RK', domain: 'inbound', desc: '入库单' },
  { prefix: 'DY-', domain: 'mortgage', desc: '抵押单' },
  { prefix: 'PG-', domain: 'evaluation', desc: '评估单' },
  { prefix: 'ZD-', domain: 'bill', desc: '账单' },
  { prefix: 'WT-', domain: 'warningTask', desc: '预警任务' },
  { prefix: 'IT-', domain: 'inventoryTask', desc: '盘点任务' },
  { prefix: 'CR-', domain: 'changeRecord', desc: '变更留痕' },
  { prefix: 'HS-', domain: 'changeRecord', desc: '历史补录留痕' },
  { prefix: 'KS-', domain: 'party', desc: '客商' },
  { prefix: 'GK-', domain: 'control', desc: '管控规则' },
  { prefix: 'W', domain: 'warning', desc: '预警明细', ambiguous: true }
]

const SORTED_NO_RULES = [...NO_RULES].sort((a, b) => b.prefix.length - a.prefix.length)

export function parseNo(no) {
  const s = String(no ?? '').trim()
  const upper = s.toUpperCase()
  const rule = SORTED_NO_RULES.find(r => upper.startsWith(r.prefix.toUpperCase()))
  const nums = s.match(/\d+/g) || []
  const yearIdx = nums.findIndex(n => n.length === 4 && Number(n) >= 1990 && Number(n) <= 2100)
  const year = yearIdx >= 0 ? Number(nums[yearIdx]) : null
  const tail = nums.filter((_, i) => i !== yearIdx)
  const seq = tail.length ? Number(tail[tail.length - 1]) : null
  return {
    raw: s,
    prefix: rule?.prefix || '',
    domain: rule?.domain || 'unknown',
    ambiguous: !!rule?.ambiguous,
    year,
    seq: Number.isFinite(seq) ? seq : null
  }
}

/** 按「前缀 + 已有最大流水」生成下一个编号，替代 Date.now()/length+1 两类撞号写法 */
export function nextSeqNo(prefix, existing = [], pad = 4) {
  const head = String(prefix)
  let max = 0
  existing.forEach(n => {
    const s = String(n ?? '')
    if (!s.toUpperCase().startsWith(head.toUpperCase())) return
    const { seq } = parseNo(s)
    if (seq != null && seq > max) max = seq
  })
  return `${head}${String(max + 1).padStart(pad, '0')}`
}

/** 按「前缀 + YYYYMM + 月内流水」生成，便于按月重置流水 */
export function nextPeriodNo(prefix, existing = [], date = new Date(), pad = 4) {
  const head = `${prefix}${date.getFullYear()}${pad2(date.getMonth() + 1)}`
  let max = 0
  existing.forEach(n => {
    const s = String(n ?? '')
    if (!s.startsWith(head)) return
    const tail = Number(s.slice(head.length).replace(/\D/g, ''))
    if (Number.isFinite(tail) && tail > max) max = tail
  })
  return `${head}${String(max + 1).padStart(pad, '0')}`
}

/* ============================================================
 * 5. 主键：统一兜底链 + 显式别名注册表
 *    静态规则无法猜出「ZC-BJ-0081 ↔ CT-001」这类跨体系映射，
 *    因此提供 register() 由数据owner显式登记，P1 收编时逐批补录。
 * ============================================================ */
export const ASSET_KEY_FIELDS = ['assetId', 'id', 'assetNo', 'code', 'assetCode', 'roomId']

export function pickAssetKey(record) {
  if (!record || typeof record !== 'object') return ''
  for (const f of ASSET_KEY_FIELDS) {
    if (record[f] != null && record[f] !== '') return String(record[f])
  }
  return ''
}

export function createAssetIdRegistry() {
  const map = new Map()
  return {
    register(canonical, ...aliases) {
      const key = String(canonical ?? '')
      if (!key) return
      map.set(key, key)
      aliases.filter(a => a != null && a !== '').forEach(a => map.set(String(a), key))
    },
    resolve(key) {
      return key == null ? '' : (map.get(String(key)) || '')
    },
    has(key) {
      return key != null && map.has(String(key))
    },
    get size() {
      return map.size
    },
    entries() {
      return Array.from(map.entries())
    }
  }
}

/** 从一组记录里把同一对象的多个键字段登记为同一主键 */
export function buildAssetIdRegistry(records = []) {
  const registry = createAssetIdRegistry()
  records.forEach(r => {
    const canonical = pickAssetKey(r)
    if (!canonical) return
    registry.register(canonical, ...ASSET_KEY_FIELDS.map(f => r?.[f]))
  })
  return registry
}

/* ============================================================
 * 6. 公共单据字段与附件对象
 * ============================================================ */
export const BASE_DOC_FIELDS = [
  'id', 'no', 'status', 'sourceNo', 'orgId',
  'createdAt', 'updatedAt', 'operator', 'attachments', 'remark'
]

/** 历史附件多为文件名字符串，统一成对象；空值返回 null */
export function normalizeAttachment(item) {
  if (item && typeof item === 'object') {
    return {
      name: item.name || '',
      url: item.url || '',
      size: Number(item.size) || 0,
      hash: item.hash || '',
      uploadedBy: item.uploadedBy || '',
      uploadedAt: toISODateTime(item.uploadedAt)
    }
  }
  const name = String(item ?? '').trim()
  return name ? { name, url: '', size: 0, hash: '', uploadedBy: '', uploadedAt: '' } : null
}

/** 给单据补齐审计字段，不覆盖已有值 */
export function stampDoc(doc, { actor = '', now = new Date() } = {}) {
  const t = nowISO(now)
  return {
    ...doc,
    createdAt: doc.createdAt || t,
    updatedAt: t,
    operator: doc.operator || actor
  }
}

/* ============================================================
 * 7. 底座自检摘要（供开发/验收脚本读取，不参与业务）
 * ============================================================ */
export function modelSummary() {
  return {
    dictDomains: Object.keys(DICT),
    ambiguousPrefixes: NO_RULES.filter(r => r.ambiguous).map(r => r.prefix),
    noRuleCount: NO_RULES.length,
    baseDocFields: BASE_DOC_FIELDS,
    moneyBaseUnit: MONEY_BASE_UNIT,
    assetKeyFields: ASSET_KEY_FIELDS
  }
}
