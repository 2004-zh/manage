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

  return {
    warningTasks,
    inventoryTasks,
    warnings,
    warningList,
    getTasksByCompany,
    getInventoryByCompany,
    updateTaskStatus
  }
})
