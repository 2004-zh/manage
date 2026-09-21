import { defineStore } from 'pinia'
import { ref } from 'vue'
import { changeLogSeeds } from '../data/mock'
import { useUserStore } from './user'

export const useChangeLogStore = defineStore('changeLog', () => {
  const entries = ref([...changeLogSeeds])

  function record(entry) {
    const now = new Date()
    const userStore = useUserStore()
    entries.value.unshift({
      id: `rt-${now.getTime()}-${entries.value.length}`,
      date: now.toISOString().slice(0, 10),
      time: now.toISOString().slice(0, 19).replace('T', ' '),
      operator: userStore.user?.name || '系统',
      ...entry
    })
    if (entries.value.length > 500) entries.value.splice(500)
  }

  function entriesOfAsset(assetId) {
    return entries.value.filter(e => e.assetId === assetId)
  }

  return { entries, record, entriesOfAsset }
})
