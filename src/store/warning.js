import { defineStore } from 'pinia'
import { ref } from 'vue'
import { warningTasks as initialWarningTasks, inventoryTasks as initialInventoryTasks, warnings as initialWarnings, warningList as initialWarningList } from '../data/mock'
import { useAuditStore } from './audit'

/** 任务挂在哪个资产上：asset 字段形如「CT-001 吴航街道…商铺」，取号段做留痕主键 */
function taskAssetId(task) {
  const token = String(task?.asset || '').trim().split(/\s+/)[0] || ''
  return token === '—' ? '' : token
}

export const useWarningStore = defineStore('warning', () => {
  const warningTasks = ref([...initialWarningTasks])
  const inventoryTasks = ref([...initialInventoryTasks])
  const warnings = ref({ ...initialWarnings })
  const warningList = ref([...initialWarningList])

  function getTasksByCompany(companyName) {
    return warningTasks.value.filter(t => t.group === companyName)
  }

  function getInventoryByCompany(companyName) {
    return inventoryTasks.value.filter(t => t.group === companyName)
  }

  /**
   * 状态流转唯一入口：企业端「处理/完成」、监管端督办联动都走这里，
   * 保证 gov Risk / ent Home 待办数与业务留痕三侧同时看到同一条任务。
   */
  function updateTaskStatus(id, status, meta = {}) {
    const idx = warningTasks.value.findIndex(t => t.id === id)
    if (idx === -1) return null
    const before = warningTasks.value[idx]
    if (before.status === status) return before
    const next = { ...before, status }
    warningTasks.value[idx] = next
    useAuditStore().recordChange({
      assetId: taskAssetId(before),
      assetName: before.asset || before.name || '',
      group: before.group,
      module: '预警处置',
      action: meta.action || (status === '已完成' ? '预警任务办结' : '预警任务推进'),
      field: 'status',
      fieldLabel: '任务状态',
      before: before.status,
      after: status,
      billNo: before.id,
      remark: meta.remark || before.name || ''
    })
    return next
  }

  function nextTaskId() {
    let max = 0
    warningTasks.value.forEach(t => {
      const n = Number(String(t.id).replace(/\D/g, ''))
      if (n > max) max = n
    })
    return `WT-${String(max + 1).padStart(3, '0')}`
  }

  // 幂等：同 billNo + type 只生成一条，避免重复扫描督办单造成任务堆积
  function addTask(task) {
    if (task.billNo && warningTasks.value.some(t => t.billNo === task.billNo && t.type === task.type)) return null
    const created = {
      id: nextTaskId(),
      name: task.name || '',
      asset: task.asset || '',
      type: task.type || '其它预警',
      deadline: task.deadline || '',
      status: '待处理',
      priority: task.priority || '中',
      level: task.level || '',
      trigger: task.trigger || '',
      assignee: task.assignee || '资产管理员',
      group: task.group || '',
      billNo: task.billNo || ''
    }
    warningTasks.value.unshift(created)
    useAuditStore().recordEvent({
      assetId: taskAssetId(created),
      assetName: created.asset || created.name,
      group: created.group,
      module: '预警处置',
      action: '新建预警任务',
      billNo: created.id,
      remark: created.name,
      detail: `${created.type} / 优先级 ${created.priority} / 截止 ${created.deadline || '—'}`
    })
    return created
  }

  /** 企业端口径：非监管账号只看本公司名下的任务 */
  function tasksOfOrg(org) {
    if (!org) return warningTasks.value
    return warningTasks.value.filter(t => t.group === org)
  }

  return {
    warningTasks,
    inventoryTasks,
    warnings,
    warningList,
    getTasksByCompany,
    getInventoryByCompany,
    updateTaskStatus,
    addTask,
    tasksOfOrg
  }
})
