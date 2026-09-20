import { watch } from 'vue'

const PERSIST_IDS = ['asset', 'contract', 'project', 'changeLog']
const PREFIX = 'ams:'

function readSaved(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

// 仅持久化 store 的原始 state（ref），computed getter 不在 $state 内，天然被排除
export function piniaPersistPlugin({ store }) {
  if (!PERSIST_IDS.includes(store.$id)) return

  const saved = readSaved(store.$id)
  if (saved) {
    try {
      store.$patch(saved)
    } catch (e) {
      console.warn('[persist] hydrate failed', store.$id, e)
    }
  }

  let timer = null
  watch(
    () => JSON.stringify(store.$state),
    (snapshot) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          localStorage.setItem(PREFIX + store.$id, snapshot)
        } catch (e) {
          console.warn('[persist] save failed', store.$id, e)
        }
      }, 200)
    }
  )
}

export function clearPersisted() {
  PERSIST_IDS.forEach(id => localStorage.removeItem(PREFIX + id))
}
