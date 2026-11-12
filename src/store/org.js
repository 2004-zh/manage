import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 组织架构唯一数据源。
 * 公司节点与部门节点放在同一棵树里（parentId 串联），人员只认 nodeId 一个归属字段，
 * 因此「部门人员」「组织树」「部门列表」「收款配置」看到的是同一份数据，不会各自分叉。
 */

/** 种子数据统一入库时间：不能每次加载都生成"刚刚创建"，否则列表排序会漂移 */
const SEED_TIME = '2024-03-01 09:00:00'

const NODE_ID_PREFIX = 'O-'
const DEPT_CODE_PREFIX = 'BM-'

export const ORG_TYPES = ['公司', '部门']
export const COLLECTION_MODES = ['独立收款', '上级统收']
export const ROLE_OPTIONS = ['资产管理员', '财务管理员', '合同管理员', '领导']

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** id 用「前缀+递增序号」而不是 Date.now()：同一毫秒内连续新增不会撞号 */
function nextSeqId(list, prefix, field = 'id') {
  let max = 0
  list.forEach(item => {
    const raw = String(item[field] || '')
    if (!raw.startsWith(prefix)) return
    const n = parseInt(raw.slice(prefix.length), 10)
    if (!Number.isNaN(n) && n > max) max = n
  })
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

const COMPANY_BASE = {
  shortName: '', companyType: '', address: '', phone: '', orgCode: '',
  collectionMode: '独立收款', parentCollectorId: '',
  bankName: '', bankAccount: '', accountName: '', cnapsCode: ''
}

const SEED_NODES = [
  // ===== 城投集团：4 家下属公司为同级节点（与迁移前的「下属公司收款配置」一致）=====
  { id: `${NODE_ID_PREFIX}001`, parentId: null, type: '公司', name: '城投集团', code: '', manager: '', sort: 1, status: '正常', createTime: '2020-01-15 09:00:00', ...COMPANY_BASE, accountName: '城投集团' },
  { id: `${NODE_ID_PREFIX}002`, parentId: `${NODE_ID_PREFIX}001`, type: '公司', name: '城市建设投资有限公司', code: '', shortName: '城投公司', sort: 1, status: '正常', createTime: SEED_TIME, ...COMPANY_BASE, collectionMode: '独立收款', bankName: '中国工商银行城南支行', bankAccount: '6222 0200 1234 5678 901', accountName: '城市建设投资有限公司', cnapsCode: '102100099996' },
  { id: `${NODE_ID_PREFIX}003`, parentId: `${NODE_ID_PREFIX}001`, type: '公司', name: '置业发展有限公司', code: '', shortName: '置业公司', companyType: '股份有限公司', sort: 2, status: '正常', createTime: '2024-06-20 15:30:00', ...COMPANY_BASE, collectionMode: '上级统收', parentCollectorId: `${NODE_ID_PREFIX}002`, bankName: '中国建设银行城北支行', bankAccount: '6217 0000 1234 5678 902', accountName: '置业发展有限公司', cnapsCode: '105100099997' },
  { id: `${NODE_ID_PREFIX}004`, parentId: `${NODE_ID_PREFIX}001`, type: '公司', name: '物业管理服务有限公司', code: '', shortName: '物业公司', companyType: '有限责任公司', sort: 3, status: '正常', createTime: '2024-05-12 10:00:00', ...COMPANY_BASE, collectionMode: '独立收款', bankName: '中国农业银行城西支行', bankAccount: '6228 4800 1234 5678 903', accountName: '物业管理服务有限公司', cnapsCode: '103100099998' },
  { id: `${NODE_ID_PREFIX}005`, parentId: `${NODE_ID_PREFIX}001`, type: '公司', name: '旅游开发投资有限公司', code: '', shortName: '旅投公司', companyType: '国有独资公司', sort: 4, status: '正常', createTime: '2024-08-08 11:20:00', ...COMPANY_BASE, collectionMode: '上级统收', parentCollectorId: `${NODE_ID_PREFIX}002`, bankName: '中国银行城东支行', bankAccount: '6216 6000 1234 5678 904', accountName: '旅游开发投资有限公司', cnapsCode: '104100099999' },

  // ===== 部门节点：挂在所属公司下，人员靠 nodeId 归属 =====
  { id: `${NODE_ID_PREFIX}011`, parentId: `${NODE_ID_PREFIX}001`, type: '部门', name: '资产管理部', code: 'BM-001', manager: '', sort: 5, status: '正常', createTime: SEED_TIME, address: '长乐区吴航街道安东大厦8楼', phone: '0591-28680001', orgCode: '91350182MA31XXXX01', shortName: '资管部', remark: '' },
  { id: `${NODE_ID_PREFIX}012`, parentId: `${NODE_ID_PREFIX}001`, type: '部门', name: '财务部', code: 'BM-002', manager: '', sort: 6, status: '正常', createTime: '2024-03-01 09:30:00', address: '长乐区吴航街道安东大厦7楼', phone: '0591-28680002', orgCode: '91350182MA31XXXX02', shortName: '财务部', remark: '' },
  { id: `${NODE_ID_PREFIX}013`, parentId: `${NODE_ID_PREFIX}001`, type: '部门', name: '运营部', code: 'BM-003', manager: '', sort: 7, status: '正常', createTime: '2024-03-05 14:00:00', address: '长乐区吴航街道安东大厦6楼', phone: '0591-28680003', orgCode: '91350182MA31XXXX03', shortName: '运营部', remark: '' },
  { id: `${NODE_ID_PREFIX}014`, parentId: `${NODE_ID_PREFIX}004`, type: '部门', name: '物业事业部', code: 'BM-004', manager: '', sort: 1, status: '正常', createTime: '2024-05-12 10:00:00', address: '长乐区航城街道物业服务中心', phone: '0591-28680004', orgCode: '91350182MA31XXXX04', shortName: '物业部', remark: '' },
  { id: `${NODE_ID_PREFIX}015`, parentId: `${NODE_ID_PREFIX}003`, type: '部门', name: '招商经营部', code: 'BM-005', manager: '', sort: 1, status: '正常', createTime: '2024-06-20 15:30:00', address: '长乐区营前街道置业大厦3楼', phone: '0591-28680005', orgCode: '91350182MA31XXXX05', shortName: '招商部', remark: '' },
  { id: `${NODE_ID_PREFIX}016`, parentId: `${NODE_ID_PREFIX}005`, type: '部门', name: '旅游运营部', code: 'BM-006', manager: '', sort: 1, status: '正常', createTime: '2024-08-08 11:20:00', address: '长乐区江田镇滨海旅游集散中心', phone: '0591-28680006', orgCode: '91350182MA31XXXX06', shortName: '旅运部', remark: '' },

  // ===== 其余三家企业 + 监管端（取自 data/mock.js 的部门种子，人数由在编人员实时推导）=====
  { id: `${NODE_ID_PREFIX}021`, parentId: null, type: '公司', name: '产投集团', code: '', manager: '', sort: 2, status: '正常', createTime: '2020-03-01 09:00:00', ...COMPANY_BASE, accountName: '产投集团' },
  { id: `${NODE_ID_PREFIX}022`, parentId: `${NODE_ID_PREFIX}021`, type: '部门', name: '资产管理部', code: 'BM-007', manager: '王××', sort: 1, status: '正常', createTime: '2020-03-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}023`, parentId: `${NODE_ID_PREFIX}021`, type: '部门', name: '运营管理部', code: 'BM-008', manager: '刘××', sort: 2, status: '正常', createTime: '2020-03-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}031`, parentId: null, type: '公司', name: '水投集团', code: '', manager: '', sort: 3, status: '正常', createTime: '2020-06-01 09:00:00', ...COMPANY_BASE, accountName: '水投集团' },
  { id: `${NODE_ID_PREFIX}032`, parentId: `${NODE_ID_PREFIX}031`, type: '部门', name: '资产管理部', code: 'BM-009', manager: '李××', sort: 1, status: '正常', createTime: '2020-06-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}041`, parentId: null, type: '公司', name: '领航公司', code: '', manager: '', sort: 4, status: '正常', createTime: '2021-01-01 09:00:00', ...COMPANY_BASE, accountName: '领航公司' },
  { id: `${NODE_ID_PREFIX}042`, parentId: `${NODE_ID_PREFIX}041`, type: '部门', name: '综合管理部', code: 'BM-010', manager: '张××', sort: 1, status: '正常', createTime: '2021-01-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}051`, parentId: null, type: '公司', name: '长乐国资中心', code: '', manager: '', sort: 5, status: '正常', createTime: '2019-06-01 09:00:00', ...COMPANY_BASE, accountName: '长乐国资中心' },
  { id: `${NODE_ID_PREFIX}052`, parentId: `${NODE_ID_PREFIX}051`, type: '部门', name: '运营科', code: 'BM-011', manager: '林××', sort: 1, status: '正常', createTime: '2019-06-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}053`, parentId: `${NODE_ID_PREFIX}051`, type: '部门', name: '监督科', code: 'BM-012', manager: '周××', sort: 2, status: '正常', createTime: '2019-06-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' },
  { id: `${NODE_ID_PREFIX}054`, parentId: `${NODE_ID_PREFIX}051`, type: '部门', name: '财务科', code: 'BM-013', manager: '吴××', sort: 3, status: '正常', createTime: '2019-06-01 09:00:00', address: '', phone: '', orgCode: '', shortName: '', remark: '' }
]

const SEED_USERS = [
  { id: 'U-001', username: 'chengtou', name: '张管理员', role: '资产管理员', nodeId: `${NODE_ID_PREFIX}011`, phone: '13800138001', email: 'zhang@chengtou.com', status: '启用', createTime: SEED_TIME },
  { id: 'U-002', username: 'zhangsan', name: '张三', role: '资产管理员', nodeId: `${NODE_ID_PREFIX}011`, phone: '13800138002', email: 'zhangsan@chengtou.com', status: '启用', createTime: '2024-03-01 09:10:00' },
  { id: 'U-003', username: 'lisi', name: '李四', role: '财务管理员', nodeId: `${NODE_ID_PREFIX}012`, phone: '13800138003', email: 'lisi@chengtou.com', status: '启用', createTime: '2024-03-01 09:40:00' },
  { id: 'U-004', username: 'wangwu', name: '王五', role: '领导', nodeId: `${NODE_ID_PREFIX}013`, phone: '13800138004', email: 'wangwu@chengtou.com', status: '启用', createTime: '2024-03-05 14:10:00' },
  { id: 'U-005', username: 'zhaoliu', name: '赵六', role: '合同管理员', nodeId: `${NODE_ID_PREFIX}012`, phone: '13800138005', email: 'zhaoliu@chengtou.com', status: '启用', createTime: '2024-03-05 14:20:00' },
  { id: 'U-006', username: 'sunqi', name: '孙七', role: '资产管理员', nodeId: `${NODE_ID_PREFIX}013`, phone: '13800138006', email: 'sunqi@chengtou.com', status: '启用', createTime: '2024-03-05 14:30:00' }
]

export const useOrgStore = defineStore('org', () => {
  const nodes = ref(SEED_NODES.map(n => ({ ...n })))
  const users = ref(SEED_USERS.map(u => ({ ...u })))

  const nodeById = computed(() => {
    const m = new Map()
    nodes.value.forEach(n => m.set(n.id, n))
    return m
  })

  const userById = computed(() => {
    const m = new Map()
    users.value.forEach(u => m.set(u.id, u))
    return m
  })

  /** 同一父节点下的直接子节点；sort 为空时退化为按名称，保证刷新前后顺序一致 */
  const childMap = computed(() => {
    const m = new Map()
    nodes.value.forEach(n => {
      const key = n.parentId || ''
      if (!m.has(key)) m.set(key, [])
      m.get(key).push(n)
    })
    m.forEach(list => list.sort((a, b) => {
      if ((a.sort || 0) !== (b.sort || 0)) return (a.sort || 0) - (b.sort || 0)
      return String(a.code || a.name).localeCompare(String(b.code || b.name), 'zh-CN')
    }))
    return m
  })

  /** 自身 + 全部后代 id。选中集团就能筛到所有下级部门，这是原来缺的关键一环 */
  function descendantIds(id) {
    const set = new Set([id])
    const walk = (cur) => {
      (childMap.value.get(cur) || []).forEach(c => {
        if (set.has(c.id)) return
        set.add(c.id)
        walk(c.id)
      })
    }
    walk(id)
    return set
  }

  /** 沿 parentId 上溯到最近的「公司」节点——部门列表的「所属公司」列和筛选都以它为口径 */
  function companyNodeOf(id) {
    let cur = nodeById.value.get(id)
    const guard = new Set()
    while (cur) {
      if (guard.has(cur.id)) return null
      guard.add(cur.id)
      if (cur.type === '公司') return cur
      cur = cur.parentId ? nodeById.value.get(cur.parentId) : null
    }
    return null
  }

  /** 从根到该节点的完整路径，用于「上级组织」「所属部门」下拉里区分同名部门 */
  function pathOf(id) {
    const parts = []
    const guard = new Set()
    let cur = nodeById.value.get(id)
    while (cur && !guard.has(cur.id)) {
      guard.add(cur.id)
      parts.unshift(cur.name)
      cur = cur.parentId ? nodeById.value.get(cur.parentId) : null
    }
    return parts.join(' / ')
  }

  /** 直属在编人员（不含下级部门），部门人员列与人数都由它推导，不再存快照字段 */
  function directMembers(id) {
    return users.value.filter(u => u.nodeId === id)
  }

  /** 含下级部门的在编人数，组织树上展示用 */
  function memberCountIncludingSub(id) {
    const ids = descendantIds(id)
    return users.value.filter(u => ids.has(u.nodeId)).length
  }

  const tree = computed(() => {
    const build = (parentId) => (childMap.value.get(parentId) || []).map(n => {
      const children = build(n.id)
      return { ...n, children, totalMembers: memberCountIncludingSub(n.id) }
    })
    return build('')
  })

  /** 某节点的子树（企业端登录时只展示本集团那棵） */
  function subtreeOf(id) {
    const node = nodeById.value.get(id)
    if (!node) return []
    return [{ ...node, children: buildChildren(id), totalMembers: memberCountIncludingSub(id) }]
  }

  function buildChildren(id) {
    return (childMap.value.get(id) || []).map(c => ({
      ...c, children: buildChildren(c.id), totalMembers: memberCountIncludingSub(c.id)
    }))
  }

  /** 平铺节点，附带所属公司/路径/直属人数，供表格与下拉使用 */
  const flatNodes = computed(() => nodes.value.map(n => {
    const company = n.type === '公司' ? n : companyNodeOf(n.id)
    return {
      ...n,
      path: pathOf(n.id),
      companyId: company ? company.id : '',
      companyName: company ? company.name : '',
      memberCount: directMembers(n.id).length
    }
  }))

  const companyNodes = computed(() => flatNodes.value.filter(n => n.type === '公司'))
  const deptNodes = computed(() => flatNodes.value.filter(n => n.type === '部门'))
  const activeNodes = computed(() => flatNodes.value.filter(n => n.status === '正常'))

  /** 供后续各业务页替换硬编码公司数组用 */
  const companyNames = computed(() => companyNodes.value.map(n => n.name))
  const deptNames = computed(() => deptNodes.value.filter(n => n.status === '正常').map(n => n.name))

  /** 统收归属候选：只允许独立收款的正常公司节点，且不能选自己 */
  function collectorOptions(selfId) {
    return companyNodes.value.filter(n => n.status === '正常' && n.collectionMode === '独立收款' && n.id !== selfId)
  }

  /** 上级组织候选：编辑时排除自己与全部后代，杜绝把父节点挂到自己下面形成环 */
  function parentOptions(selfId) {
    const blocked = selfId ? descendantIds(selfId) : null
    return activeNodes.value
      .filter(n => !blocked || !blocked.has(n.id))
      .map(n => ({ id: n.id, name: n.path, type: n.type }))
  }

  /** 可分配人员的部门候选：已停用的节点不再进人 */
  function assignableNodeOptions() {
    return activeNodes.value.map(n => ({ id: n.id, name: n.path, type: n.type }))
  }

  function validateNode(payload, selfId) {
    const name = String(payload.name || '').trim()
    if (!name) return '组织名称不能为空'
    if (payload.parentId) {
      const parent = nodeById.value.get(payload.parentId)
      if (!parent) return '上级组织不存在，请重新选择'
      if (selfId && payload.parentId === selfId) return '上级组织不能选择自己'
      if (selfId && descendantIds(selfId).has(payload.parentId)) return '上级组织不能选择自己的下级节点，会形成循环归属'
      // 子公司必须挂在上级单位下，挂进部门会让「所属公司」口径的统计失去落点
      if (payload.type === '公司' && parent.type !== '公司') return '公司只能挂在上级单位（公司）下面'
    }
    const dup = nodes.value.find(n => n.id !== selfId && (n.parentId || '') === (payload.parentId || '') && n.name === name)
    if (dup) return `同一上级下已存在「${name}」，请换名称或直接编辑已有节点`
    if (payload.type === '公司') {
      if (payload.collectionMode === '上级统收' && !payload.parentCollectorId) return '上级统收模式需选择统收归属单位'
      if (payload.collectionMode === '独立收款' && !String(payload.bankName || '').trim()) return '独立收款公司需填写开户行'
      if (payload.collectionMode === '独立收款' && !String(payload.bankAccount || '').trim()) return '独立收款公司需填写银行账号'
    }
    return ''
  }

  /** 部门编号取现有最大值 +1，删除历史部门后不会再与新部门重号 */
  function nextDeptCode() {
    return nextSeqId(nodes.value, DEPT_CODE_PREFIX, 'code')
  }

  function addNode(payload) {
    const name = String(payload.name || '').trim()
    const data = { ...payload, name }
    const err = validateNode(data, null)
    if (err) return { ok: false, msg: err }
    const node = {
      id: nextSeqId(nodes.value, NODE_ID_PREFIX),
      parentId: data.parentId || null,
      type: data.type,
      name,
      code: data.type === '部门' ? nextDeptCode() : '',
      manager: data.manager || '',
      shortName: data.shortName || '',
      address: data.address || '',
      phone: data.phone || '',
      orgCode: data.orgCode || '',
      remark: data.remark || '',
      sort: Number(data.sort) || 0,
      status: '正常',
      createTime: nowStr(),
      ...(data.type === '公司' ? {
        companyType: data.companyType || '',
        collectionMode: data.collectionMode || '独立收款',
        parentCollectorId: data.collectionMode === '上级统收' ? data.parentCollectorId : '',
        bankName: data.bankName || '',
        bankAccount: data.bankAccount || '',
        accountName: data.accountName || name,
        cnapsCode: data.cnapsCode || ''
      } : {})
    }
    nodes.value.push(node)
    return { ok: true, data: node, msg: `${node.type}「${node.name}」已新增` }
  }

  function updateNode(id, payload) {
    const node = nodeById.value.get(id)
    if (!node) return { ok: false, msg: '组织节点不存在或已被删除' }
    const name = String(payload.name || '').trim()
    const data = { ...payload, name }
    const err = validateNode(data, id)
    if (err) return { ok: false, msg: err }
    // 被别人当作统收归属的公司不能再改成上级统收，否则下级的资金归属会静默悬空
    const dependents = nodes.value.filter(n => n.id !== id && n.parentCollectorId === id)
    if (dependents.length && data.collectionMode !== '独立收款') {
      return { ok: false, msg: `「${name}」是 ${dependents.map(n => n.name).join('、')} 的统收归属单位，需先为这些单位改回独立收款或指定其他归属` }
    }

    const oldParent = node.parentId
    node.parentId = data.parentId || null
    node.type = data.type
    node.name = name
    node.manager = data.manager || ''
    node.shortName = data.shortName || ''
    node.address = data.address || ''
    node.phone = data.phone || ''
    node.orgCode = data.orgCode || ''
    node.remark = data.remark || ''
    node.sort = Number(data.sort) || 0
    if (data.type === '公司') {
      node.companyType = data.companyType || ''
      node.collectionMode = data.collectionMode || '独立收款'
      node.parentCollectorId = data.collectionMode === '上级统收' ? data.parentCollectorId : ''
      node.bankName = data.bankName || ''
      node.bankAccount = data.bankAccount || ''
      node.accountName = data.accountName || name
      node.cnapsCode = data.cnapsCode || ''
    } else {
      // 部门不再持有收款字段，收款口径统一由公司节点管，避免两套枚举并存
      ['companyType', 'collectionMode', 'parentCollectorId', 'bankName', 'bankAccount', 'accountName', 'cnapsCode'].forEach(k => { delete node[k] })
    }
    const moved = (oldParent || '') !== (node.parentId || '')
    return { ok: true, data: node, msg: moved ? `「${name}」已更新并连同下级改挂到${node.parentId ? pathOf(node.parentId) : '顶级'}` : `「${name}」已更新` }
  }

  /** 节点能否删除：有下级或有在编人员就不允许物理删除，改走停用（审计可追溯） */
  function removeBlockers(id) {
    const node = nodeById.value.get(id)
    if (!node) return ['组织节点不存在']
    const blockers = []
    const children = childMap.value.get(id) || []
    if (children.length) blockers.push(`下有 ${children.length} 个下级节点（${children.map(c => c.name).join('、')}）`)
    const members = directMembers(id)
    if (members.length) blockers.push(`有 ${members.length} 名在编人员（${members.map(m => m.name).join('、')}）`)
    const collectors = nodes.value.filter(n => n.parentCollectorId === id)
    if (collectors.length) blockers.push(`是 ${collectors.length} 家单位的统收归属单位（${collectors.map(c => c.name).join('、')}）`)
    return blockers
  }

  function removeNode(id) {
    const blockers = removeBlockers(id)
    if (blockers.length) return { ok: false, msg: `该节点暂不能删除：${blockers.join('；')}。请先处理下级与人员，或改为停用。` }
    const idx = nodes.value.findIndex(n => n.id === id)
    if (idx > -1) nodes.value.splice(idx, 1)
    else return { ok: false, msg: '组织节点不存在或已被删除' }
    return { ok: true, msg: '已删除' }
  }

  function setNodeStatus(id, status) {
    const node = nodeById.value.get(id)
    if (!node) return { ok: false, msg: '组织节点不存在' }
    if (status === '已停用') {
      const dependents = nodes.value.filter(n => n.parentCollectorId === id)
      if (dependents.length) return { ok: false, msg: `「${node.name}」是 ${dependents.map(n => n.name).join('、')} 的统收归属单位，停用后这些单位的租金归属会失效` }
    }
    node.status = status
    return { ok: true, msg: `「${node.name}」已${status === '已停用' ? '停用' : '启用'}` }
  }

  function validateUser(payload, selfId) {
    const username = String(payload.username || '').trim()
    const name = String(payload.name || '').trim()
    if (!username) return '用户名不能为空'
    if (!name) return '姓名不能为空'
    if (!payload.role) return '请选择角色'
    if (!payload.nodeId) return '请选择所属组织，人员必须有归属单位'
    if (!nodeById.value.has(payload.nodeId)) return '所属组织不存在，请重新选择'
    const dup = users.value.find(u => u.id !== selfId && u.username === username)
    if (dup) return `用户名「${username}」已被 ${dup.name} 使用，请换一个`
    if (payload.phone && !/^1[3-9]\d{9}$/.test(String(payload.phone).trim())) return '手机号格式不正确'
    return ''
  }

  function addUser(payload) {
    const err = validateUser(payload, null)
    if (err) return { ok: false, msg: err }
    const user = {
      id: nextSeqId(users.value, 'U-'),
      username: String(payload.username).trim(),
      name: String(payload.name).trim(),
      role: payload.role,
      nodeId: payload.nodeId,
      phone: payload.phone || '',
      email: payload.email || '',
      status: payload.status || '启用',
      createTime: nowStr()
    }
    users.value.push(user)
    return { ok: true, data: user, msg: `用户「${user.name}」已新增并分配到「${pathOf(user.nodeId)}」` }
  }

  function updateUser(id, payload) {
    const user = userById.value.get(id)
    if (!user) return { ok: false, msg: '用户不存在或已被删除' }
    const err = validateUser(payload, id)
    if (err) return { ok: false, msg: err }
    const fromPath = pathOf(user.nodeId)
    const toPath = pathOf(payload.nodeId)
    Object.assign(user, {
      name: String(payload.name).trim(),
      role: payload.role,
      nodeId: payload.nodeId,
      phone: payload.phone || '',
      email: payload.email || '',
      status: payload.status || user.status
    })
    return { ok: true, data: user, msg: fromPath !== toPath ? `用户「${user.name}」已从「${fromPath || '未分配'}」调动到「${toPath}」` : `用户「${user.name}」已更新` }
  }

  function removeUser(id) {
    const user = userById.value.get(id)
    if (!user) return { ok: false, msg: '用户不存在或已被删除' }
    const idx = users.value.findIndex(u => u.id === id)
    users.value.splice(idx, 1)
    return { ok: true, msg: `用户「${user.name}」已删除` }
  }

  /** 部门人员勾选：写回 users.nodeId，与用户列表同源，不存在两套成员快照 */
  function assignDeptMembers(deptId, userIds) {
    if (!nodeById.value.has(deptId)) return { ok: false, msg: '部门不存在或已被删除' }
    const target = new Set(userIds)
    let movedIn = 0
    let movedOut = 0
    users.value.forEach(u => {
      if (target.has(u.id) && u.nodeId !== deptId) { u.nodeId = deptId; movedIn++ }
      else if (!target.has(u.id) && u.nodeId === deptId) { u.nodeId = ''; movedOut++ }
    })
    return { ok: true, msg: `调入 ${movedIn} 人，调出 ${movedOut} 人`, data: { movedIn, movedOut } }
  }

  return {
    nodes, users, nodeById, userById, tree, flatNodes, companyNodes, deptNodes, activeNodes,
    companyNames, deptNames,
    childMap, descendantIds, companyNodeOf, pathOf, directMembers, memberCountIncludingSub,
    subtreeOf, collectorOptions, parentOptions, assignableNodeOptions,
    addNode, updateNode, removeNode, removeBlockers, setNodeStatus,
    addUser, updateUser, removeUser, assignDeptMembers
  }
})
