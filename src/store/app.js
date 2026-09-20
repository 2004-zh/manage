import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const sidebarCollapsed = ref(false)
  const visitedViews = ref([])
  const scope = ref('全局资产')
  const scopes = ['全局资产', '城投集团', '产投集团', '水投集团', '领航公司']

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addView(view) {
    if (!visitedViews.value.some(v => v.path === view.path)) {
      visitedViews.value.push(view)
    }
  }

  function removeView(path) {
    visitedViews.value = visitedViews.value.filter(v => v.path !== path)
  }

  return { sidebarCollapsed, visitedViews, scope, scopes, toggleSidebar, addView, removeView }
})
