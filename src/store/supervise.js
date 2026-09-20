import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { superviseOrders as initialOrders, contacts as initialContacts } from '../data/mock'
import { useUserStore } from './user'
import { useAuditStore } from './audit'
import { useNotifyStore } from './notify'
import { useWarningStore } from './warning'

const OPEN_STATES = ['待处理', '待确认', '已驳回']

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function today() { return nowStr().slice(0, 10) }

function daysBetween(from, to) {
  const a = new Date(String(from).slice(0, 10))
  const b = new Date(String(to).slice(0, 10))
  return Math.round((b - a) / 86400000)
}

export const useSuperviseStore = defineStore('supervise', () => {
  const orders = ref(JSON.parse(JSON.stringify(initialOrders)))
  const contacts = ref([...initialContacts])

  function actorLabel() {
    const u = useUserStore().user
    return u ? `${u.name}（${u.org}）` : '系统'
  }

  const stats = computed(() => {
    const list = orders.value
    const done = list.filter(o => o.status === '已办结').length
    const pending = list.filter(o => o.status === '待处理').length
    const confirming = list.filter(o => o.status === '待确认').length
    const rejected = list.filter(o => o.status === '已驳回').length
    const overdue = list.filter(o => o.status === '已逾期').length
    return {
      total: list.length,
      done,
      pending,
      confirming,
      rejected,
      overdue,
      open: pending + confirming + rejected + overdue,
      doneRate: list.length ? Math.round(done / list.length * 1000) / 10 : 0
    }
  })

  function nextId() {
    const year = String(new Date().getFullYear())
    let max = 0
    orders.value.forEach(o => {
      const m = /^DB-(\d{4})-(\d+)$/.exec(String(o.id))
      if (m && m[1] === year) max = Math.max(max, Number(m[2]))
    })
    return `DB-${year}-${String(max + 1).padStart(3, '0')}`
  }

  function pushTimeline(order, action) {
    if (!order.timeline) order.timeline = []
    order.timeline.push({ time: nowStr(), action, operator: actorLabel() })
  }

  function getOrdersByCompany(companyName) {
    return orders.value.filter(o => o.group === companyName)
  }

  /** 监管端发起督办：下发即通知企业端，并写入业务留痕 */
  function createOrder(payload) {
    const order = {
      id: nextId(),
      group: payload.group || '',
      type: payload.type || '其它督办',
      subject: payload.subject || payload.reason || '',
      reason: payload.reason || '',
      assetId: payload.assetId || '',
      asset: payload.asset || '',
      source: payload.source || '人工发起',
      deadline: payload.deadline || '',
      contact: payload.contact || '',
      phone: payload.phone || '',
      status: '待处理',
      overdueDays: 0,
      reply: '',
      closeRemark: '',
      timeline: []
    }
    orders.value.unshift(order)
    pushTimeline(order, `发起督办（来源：${order.source}）`)

    useAuditStore().recordEvent({
      assetId: order.assetId,
      assetName: order.asset,
      group: order.group,
      module: '督办管理',
      action: '发起督办',
      billNo: order.id,
      remark: order.reason,
      detail: `${order.type} / 整改期限 ${order.deadline}`
    })
    useNotifyStore().sendByTemplate('supervise_new', {
      no: order.id,
      subject: order.subject || order.type,
      asset: order.asset || '相关资产',
      deadline: order.deadline
    }, { target: order.group, bizType: 'supervise', bizId: order.id, route: '/ent/supervise' })

    return order
  }

  /** 企业端签收 */
  function acceptOrder(id) {
    const order = getOrderById(id)
    if (!order) return false
    pushTimeline(order, '企业已接收')
    useNotifyStore().sendByTemplate('supervise_reply', {
      no: order.id,
      subject: order.subject || order.type,
      company: order.group,
      reply: '已接收督办事项'
    }, { target: 'gov', bizType: 'supervise', bizId: order.id, route: '/gov/supervise' })
    return true
  }

  /** 企业端提交整改回复 → 待确认，等监管端复核 */
  function replyOrder(id, content) {
    const order = getOrderById(id)
    if (!order) return false
    const before = order.status
    order.reply = content
    order.status = '待确认'
    pushTimeline(order, `整改反馈：${content}`)
    useAuditStore().recordDiff({
      assetId: order.assetId,
      assetName: order.asset || order.subject,
      group: order.group,
      module: '督办管理',
      action: '整改回复',
      billNo: order.id,
      remark: content,
      before: { orderStatus: before },
      after: { orderStatus: order.status },
      fields: ['orderStatus']
    })
    useNotifyStore().sendByTemplate('supervise_reply', {
      no: order.id,
      subject: order.subject || order.type,
      company: order.group,
      reply: content
    }, { target: 'gov', bizType: 'supervise', bizId: order.id, route: `/gov/supervise/${order.id}` })
    return true
  }

  function setStatus(id, status, action) {
    const order = getOrderById(id)
    if (!order) return false
    const before = order.status
    order.status = status
    pushTimeline(order, action)
    useAuditStore().recordDiff({
      assetId: order.assetId,
      assetName: order.asset || order.subject,
      group: order.group,
      module: '督办管理',
      action,
      billNo: order.id,
      remark: action,
      before: { orderStatus: before },
      after: { orderStatus: status },
      fields: ['orderStatus']
    })
    return order
  }

  /** 监管端复核通过 → 已办结，闭环归档 */
  function closeOrder(id, remark = '') {
    const order = setStatus(id, '已办结', remark ? `确认办结：${remark}` : '确认办结')
    if (!order) return false
    order.closeRemark = remark
    useNotifyStore().sendByTemplate('supervise_close', {
      no: order.id,
      subject: order.subject || order.type
    }, { target: order.group, bizType: 'supervise', bizId: order.id, route: '/ent/supervise' })
    return true
  }

  /** 监管端驳回整改回复 → 已驳回，退回企业重新整改 */
  function rejectOrder(id, reason = '') {
    const order = setStatus(id, '已驳回', `复核驳回：${reason || '整改不到位'}`)
    if (!order) return false
    useNotifyStore().sendByTemplate('supervise_reject', {
      no: order.id,
      subject: order.subject || order.type,
      reason: reason || '整改不到位'
    }, { level: '重要', target: order.group, bizType: 'supervise', bizId: order.id, route: '/ent/supervise' })
    return true
  }

  function updateOrder(id, updates) {
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx === -1) return false
    const before = { ...orders.value[idx] }
    orders.value[idx] = { ...before, ...updates }
    useAuditStore().recordDiff({
      assetId: updates.assetId ?? before.assetId,
      assetName: updates.asset ?? before.asset ?? before.subject,
      group: updates.group ?? before.group,
      module: '督办管理',
      action: '修改督办单',
      billNo: before.id,
      before,
      after: orders.value[idx],
      fields: Object.keys(updates)
    })
    return true
  }

  /**
   * 扫描未办结督办单：超期即置为「已逾期」，两端各发一条预警，
   * 并在企业端生成「督办逾期」预警任务（督办链 J → 横切 H 的闭环点）
   */
  function checkOverdue() {
    const now = today()
    const flagged = []
    orders.value.forEach(order => {
      if (!OPEN_STATES.includes(order.status) || !order.deadline) return
      const over = daysBetween(order.deadline, now)
      if (over <= 0) return

      order.status = '已逾期'
      order.overdueDays = over
      pushTimeline(order, `系统判定逾期 ${over} 天，自动生成逾期预警`)

      useAuditStore().recordDiff({
        assetId: order.assetId,
        assetName: order.asset || order.subject,
        group: order.group,
        module: '督办管理',
        action: '督办逾期',
        billNo: order.id,
        remark: `整改期限 ${order.deadline}`,
        before: { orderStatus: '待处理' },
        after: { orderStatus: '已逾期' },
        fields: ['orderStatus']
      })
      useWarningStore().addTask({
        name: `${order.id} 督办逾期整改`,
        asset: order.asset || order.subject || order.type,
        type: '督办逾期',
        deadline: order.deadline,
        priority: '高',
        assignee: order.contact || '资产管理员',
        group: order.group,
        billNo: order.id
      })
      const vars = { no: order.id, subject: order.subject || order.type, deadline: order.deadline }
      const base = { level: '紧急', bizType: 'supervise', bizId: order.id }
      useNotifyStore().sendByTemplate('supervise_overdue', vars, { ...base, target: order.group, route: '/ent/supervise' })
      useNotifyStore().sendByTemplate('supervise_overdue', vars, { ...base, target: 'gov', route: '/gov/supervise' })
      flagged.push(order)
    })
    return flagged
  }

  /** 兼容旧调用方 */
  function addOrder(order) {
    return createOrder(order)
  }

  function updateContact(group, updates) {
    const idx = contacts.value.findIndex(c => c.group === group)
    if (idx === -1) return false
    contacts.value[idx] = { ...contacts.value[idx], ...updates }
    return true
  }

  /** 催办：不改状态，只追加时间轴并再次触达企业端 */
  function urgeOrder(id, note = '') {
    const order = getOrderById(id)
    if (!order) return false
    pushTimeline(order, note ? `催办：${note}` : '催办')
    useNotifyStore().sendByTemplate('supervise_urge', {
      no: order.id,
      subject: order.subject || order.type,
      deadline: order.deadline,
      note: note ? `${note}，` : ''
    }, { level: '紧急', target: order.group, bizType: 'supervise', bizId: order.id, route: '/ent/supervise' })
    return true
  }

  function getOrderById(id) {
    return orders.value.find(o => o.id === id)
  }

  return {
    orders,
    contacts,
    stats,
    OPEN_STATES,
    getOrdersByCompany,
    getOrderById,
    createOrder,
    acceptOrder,
    replyOrder,
    closeOrder,
    rejectOrder,
    urgeOrder,
    checkOverdue,
    updateOrder,
    addOrder,
    updateContact
  }
})
