import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'

/**
 * 盘点清查（辅链 N）：盘点任务以 asset store 当时快照生成清单，
 * 逐条登记盘点结果（正常/盘盈/盘亏/损毁/闲置未用），差异回写资产并留痕，
 * 为「盘点报表」提供唯一合法数据源。快照独立存储，不随资产后续变动而漂移。
 */
function pad(n) { return String(n).padStart(2, '0') }
function nowStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const CHECK_RESULTS = ['未盘', '正常', '盘盈', '盘亏', '损毁', '闲置未用']

export const useInventoryStore = defineStore('inventory', () => {
  const tasks = ref([])

  function nextId() {
    return `PD-${new Date().getFullYear()}-${String(tasks.value.length + 1).padStart(3, '0')}`
  }

  /** 以当前资产快照建盘点任务 */
  function createTask(payload) {
    const assetStore = useAssetStore()
    const scope = payload.assetIds && payload.assetIds.length
      ? assetStore.assets.filter(a => payload.assetIds.includes(a.id))
      : assetStore.getAssetsByCompany(payload.group || '')
    const lines = scope.map(a => ({
      assetId: a.id,
      assetName: a.name,
      group: a.group,
      location: a.location || '',
      bookValue: a.bookValue || 0,
      area: a.area || 0,
      systemStatus: a.status || '',
      checkResult: '未盘',
      actualArea: null,
      actualValue: null,
      remark: ''
    }))
    const task = {
      id: nextId(),
      name: payload.name || `${payload.group || '全区'}资产盘点`,
      group: payload.group || '',
      scope: payload.scope || (payload.assetIds ? '指定资产' : '全集团'),
      status: '进行中',
      createdTime: nowStr(),
      finishedTime: '',
      lines
    }
    tasks.value.unshift(task)
    useAuditStore().recordEvent({
      group: task.group,
      module: '盘点清查',
      action: '发起盘点',
      billNo: task.id,
      remark: task.name,
      detail: `纳入 ${lines.length} 项资产`
    })
    return task
  }

  function getTask(id) {
    return tasks.value.find(t => t.id === id) || null
  }

  /** 登记单条盘点结果；盘盈/盘亏/损毁回写资产并留痕 */
  function registerLine(taskId, assetId, payload) {
    const task = getTask(taskId)
    if (!task) return false
    const line = task.lines.find(l => l.assetId === assetId)
    if (!line) return false
    const assetStore = useAssetStore()
    const asset = assetStore.getAssetById(assetId)

    line.checkResult = payload.checkResult
    line.remark = payload.remark || ''
    if (payload.actualArea != null && payload.actualArea !== '') line.actualArea = Number(payload.actualArea)
    if (payload.actualValue != null && payload.actualValue !== '') line.actualValue = Number(payload.actualValue)

    const result = payload.checkResult
    if (result === '盘亏') {
      // 盘亏：资产标记为「盘亏待处理」，等待账务核销，不直接删除
      if (asset) assetStore.updateAsset(assetId, { status: '待处置', inventoryState: '盘亏' }, {
        module: '盘点清查', action: '盘亏登记', billNo: taskId, remark: payload.remark || '盘点发现盘亏'
      })
    } else if (result === '损毁') {
      if (asset) assetStore.updateAsset(assetId, { status: '报废', inventoryState: '损毁' }, {
        module: '盘点清查', action: '损毁登记', billNo: taskId, remark: payload.remark || '盘点发现资产损毁'
      })
    } else if (result === '闲置未用') {
      if (asset) assetStore.updateAsset(assetId, { status: '闲置', inventoryState: '闲置未用' }, {
        module: '盘点清查', action: '闲置登记', billNo: taskId, remark: payload.remark || '盘点发现长期闲置'
      })
    } else if (result === '正常') {
      if (asset) assetStore.updateAsset(assetId, { inventoryState: '正常' }, {
        module: '盘点清查', action: '盘点正常', billNo: taskId, remark: payload.remark || '账实相符'
      })
    }
    // 盘盈：新增一条资产（快照里没有、实物存在）
    if (result === '盘盈') {
      assetStore.addAsset({
        name: payload.newName || `盘盈资产-${assetId}`,
        group: line.group,
        location: payload.newLocation || line.location,
        area: line.actualArea || line.area || 0,
        bookValue: line.actualValue || line.bookValue || 0,
        status: '未使用',
        sourceType: '盘盈',
        certStatus: '未办证（未启动）'
      }, { module: '盘点清查', billNo: taskId, remark: payload.remark || '盘点发现盘盈，补录资产' })
    }
    return true
  }

  function finishTask(taskId) {
    const task = getTask(taskId)
    if (!task) return false
    const unchecked = task.lines.filter(l => l.checkResult === '未盘').length
    if (unchecked) {
      return { ok: false, unchecked }
    }
    task.status = '已完成'
    task.finishedTime = nowStr()
    useAuditStore().recordEvent({
      group: task.group,
      module: '盘点清查',
      action: '完成盘点',
      billNo: task.id,
      remark: task.name,
      detail: `差异 ${task.lines.filter(l => l.checkResult !== '正常' && l.checkResult !== '未盘').length} 项`
    })
    return { ok: true }
  }

  function taskSummary(task) {
    const lines = task.lines
    const count = r => lines.filter(l => l.checkResult === r).length
    const diff = lines.filter(l => l.checkResult !== '正常' && l.checkResult !== '未盘').length
    return {
      total: lines.length,
      checked: lines.length - count('未盘'),
      normal: count('正常'),
      surplus: count('盘盈'),
      loss: count('盘亏'),
      damaged: count('损毁'),
      idle: count('闲置未用'),
      diff,
      diffRate: lines.length ? Math.round(diff / lines.length * 1000) / 10 : 0
    }
  }

  const taskList = computed(() => tasks.value.map(t => ({ ...t, summary: taskSummary(t) })))

  const reports = computed(() => tasks.value.filter(t => t.status === '已完成').map(t => ({
    id: t.id, name: t.name, group: t.group, finishedTime: t.finishedTime, summary: taskSummary(t)
  })))

  function getTasksByCompany(companyName) {
    return tasks.value.filter(t => t.group === companyName)
  }

  return {
    tasks,
    taskList,
    reports,
    createTask,
    getTask,
    registerLine,
    finishTask,
    taskSummary,
    getTasksByCompany
  }
})
