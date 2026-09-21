import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

const MAX_MSG = 1000

function pad(n) { return String(n).padStart(2, '0') }

function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 消息模板：{var} 占位，发送时按 vars 渲染。模板可在「消息模板」页维护
const DEFAULT_TEMPLATES = [
  { key: 'supervise_new', scene: '督办下发', channel: '站内信+短信', title: '收到新的督办事项 {no}', content: '监管端就「{subject}」向你单位下达督办，涉及资产 {asset}，请于 {deadline} 前完成整改并回复。', enabled: true },
  { key: 'supervise_reply', scene: '整改回复', channel: '站内信', title: '督办 {no} 已收到整改回复', content: '{company} 就「{subject}」提交整改回复：{reply}', enabled: true },
  { key: 'supervise_close', scene: '督办办结', channel: '站内信', title: '督办 {no} 已办结', content: '「{subject}」经复核已办结，闭环归档。', enabled: true },
  { key: 'supervise_reject', scene: '督办驳回', channel: '站内信+短信', title: '督办 {no} 整改回复被驳回', content: '「{subject}」整改回复未通过复核，原因：{reason}。请重新整改。', enabled: true },
  { key: 'supervise_overdue', scene: '督办逾期', channel: '站内信+短信', title: '督办 {no} 已逾期', content: '「{subject}」超过整改期限 {deadline} 仍未办结，已自动生成逾期预警。', enabled: true },
  { key: 'supervise_urge', scene: '督办催办', channel: '站内信+短信', title: '督办催办 {no}', content: '「{subject}」整改期限 {deadline}，{note}请尽快反馈整改情况。', enabled: true },
  { key: 'urge_rent', scene: '催租通知', channel: '站内信+短信', title: '租金催缴通知（合同 {contractNo}）', content: '{tenant} 名下合同累计欠费 {arrears} 万元，已逾期 {days} 天，请尽快缴纳。', enabled: true },
  { key: 'warning_arrears', scene: '欠费预警', channel: '站内信', title: '欠费预警：{asset}', content: '合同 {contractNo} 欠费 {arrears} 万元，逾期 {days} 天，信用等级 {credit}。', enabled: true },
  { key: 'warning_idle', scene: '闲置超期', channel: '站内信', title: '闲置超期预警：{asset}', content: '该资产已闲置 {days} 天，面积 {area}㎡，建议纳入盘活计划。', enabled: true },
  { key: 'warning_cert', scene: '未办证超期', channel: '站内信', title: '未办证预警：{asset}', content: '该资产登记已满 {months} 个月仍未办证，请推进权证办理。', enabled: true },
  { key: 'warning_expiry', scene: '合同临期', channel: '站内信', title: '合同临期提醒：{contractNo}', content: '{asset} 的合同将于 {endDate} 到期，承租方 {tenant}，请提前启动续租或重新招商。', enabled: true },
  { key: 'inventory_diff', scene: '盘点差异', channel: '站内信', title: '盘点差异待处理：{task}', content: '本次盘点发现盘盈 {gain} 项、盘亏 {loss} 项，请核实后提交调整。', enabled: true },
  { key: 'dispose_blocked', scene: '处置被拦截', channel: '站内信', title: '处置申请被拦截：{asset}', content: '该资产存在{reason}，按管控规则不得处置，请先解除限制。', enabled: true },
  { key: 'contract_signed', scene: '合同生效', channel: '站内信', title: '合同生效：{contractNo}', content: '{asset} 已与 {tenant} 签约，年租金 {rent} 万元，资产状态已联动更新。', enabled: true }
]

export const useNotifyStore = defineStore('notify', () => {
  const messages = ref([])
  const templates = ref([...DEFAULT_TEMPLATES])

  const allMessages = computed(() => messages.value)

  function nextId() {
    return `MSG-${String(messages.value.length + 1).padStart(6, '0')}`
  }

  /** 当前登录用户可见的消息：target 为 all / 端标识(gov|ent) / 单位名 */
  const inbox = computed(() => {
    const u = useUserStore().user
    if (!u) return []
    return messages.value.filter(m =>
      !m.target || m.target === 'all' || m.target === u.endpoint || m.target === u.org
    )
  })

  const unreadCount = computed(() => inbox.value.filter(m => !m.read).length)
  const unreadList = computed(() => inbox.value.filter(m => !m.read))

  function render(tpl, vars = {}) {
    return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  }

  /** 直接推送一条消息 */
  function push(msg) {
    const rec = {
      id: nextId(),
      time: nowStr(),
      type: msg.type || '系统',
      level: msg.level || '普通',
      title: msg.title || '',
      content: msg.content || '',
      target: msg.target || 'all',
      channel: msg.channel || '站内信',
      bizType: msg.bizType || '',
      bizId: msg.bizId || '',
      route: msg.route || '',
      read: false
    }
    messages.value.unshift(rec)
    if (messages.value.length > MAX_MSG) messages.value.length = MAX_MSG
    return rec
  }

  /** 旧版本 localStorage 里没有的新模板键，按默认补回，避免升级后场景静默失效 */
  function syncDefaults() {
    DEFAULT_TEMPLATES.forEach(d => {
      if (!templates.value.some(t => t.key === d.key)) templates.value.push({ ...d })
    })
  }

  /** 按模板发送：模板被停用则不发，保证「消息模板」页的开关真实生效 */
  function sendByTemplate(key, vars = {}, opts = {}) {
    syncDefaults()
    const tpl = templates.value.find(t => t.key === key)
    if (!tpl || !tpl.enabled) return null
    return push({
      type: tpl.scene,
      channel: tpl.channel,
      title: render(tpl.title, vars),
      content: render(tpl.content, vars),
      ...opts
    })
  }

  function markRead(id) {
    const m = messages.value.find(x => x.id === id)
    if (m) m.read = true
  }

  function markAllRead() {
    inbox.value.forEach(m => {
      const raw = messages.value.find(x => x.id === m.id)
      if (raw) raw.read = true
    })
  }

  function removeMessage(id) {
    const idx = messages.value.findIndex(x => x.id === id)
    if (idx !== -1) messages.value.splice(idx, 1)
  }

  function clearAll() { messages.value = [] }

  function updateTemplate(key, updates) {
    const idx = templates.value.findIndex(t => t.key === key)
    if (idx === -1) return false
    templates.value[idx] = { ...templates.value[idx], ...updates }
    return true
  }

  /** 新增消息模板：key 已存在时返回 false，避免覆盖内置模板 */
  function addTemplate(payload) {
    const key = (payload.key || '').trim()
    if (!key) return false
    if (templates.value.some(t => t.key === key)) return false
    templates.value.push({
      key,
      scene: payload.scene || key,
      channel: payload.channel || '站内信',
      title: payload.title || '',
      content: payload.content || '',
      enabled: payload.enabled !== false
    })
    return true
  }

  /** 删除用户自建模板；内置 DEFAULT_TEMPLATES 键不允许删除 */
  function removeTemplate(key) {
    if (DEFAULT_TEMPLATES.some(d => d.key === key)) return false
    const idx = templates.value.findIndex(t => t.key === key)
    if (idx === -1) return false
    templates.value.splice(idx, 1)
    return true
  }

  return {
    messages,
    templates,
    allMessages,
    inbox,
    unreadCount,
    unreadList,
    push,
    sendByTemplate,
    syncDefaults,
    markRead,
    markAllRead,
    removeMessage,
    clearAll,
    updateTemplate,
    addTemplate,
    removeTemplate
  }
})
