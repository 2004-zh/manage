import { defineStore } from 'pinia'
import { ref } from 'vue'
import { warningTasks as initialWarningTasks, inventoryTasks as initialInventoryTasks, warnings as initialWarnings, warningList as initialWarningList } from '../data/mock'

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

  function updateTaskStatus(id, status) {
    const idx = warningTasks.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      warningTasks.value[idx] = { ...warningTasks.value[idx], status }
    }
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
      assignee: task.assignee || '资产管理员',
      group: task.group || '',
      billNo: task.billNo || ''
    }
    warningTasks.value.unshift(created)
    return created
  }

  return {
    warningTasks,
    inventoryTasks,
    warnings,
    warningList,
    getTasksByCompany,
    getInventoryByCompany,
    updateTaskStatus,
    addTask
  }
})
