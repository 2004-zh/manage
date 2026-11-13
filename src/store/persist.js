import { watch } from 'vue'

// 白名单按 store 的 $id 匹配（注意 specialAsset.js 的 $id 是 'special'）。
// 有意不持久化：app（纯 UI 状态）、user（自行使用 sessionStorage）。
// report 是业务 store（有上报单据、留痕与通知），此前遗漏导致刷新即丢，P0 补齐。
export const PERSIST_IDS = [
  'asset', 'contract', 'project', 'audit', 'party', 'notify', 'org',
  'revitalize', 'finance', 'inventory', 'control', 'credential',
  'special', 'supervise', 'mortgage', 'warning', 'lease', 'fixedAsset', 'inspection', 'dispose',
  'report'
]
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

  // 先挂监听再灌数据：hydrate 期间的归一化（onHydrated 里的状态对齐/招租成交回写）会改 $state，
  // 若监听在 onHydrated 之后才注册，这批改动永远进不了 storage，只能等下次用户操作才被带出去。
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

  const saved = readSaved(store.$id)
  if (saved) {
    try {
      store.$patch(saved)
      store.onHydrated?.()
    } catch (e) {
      console.warn('[persist] hydrate failed', store.$id, e)
    }
  }
}

export function clearPersisted() {
  PERSIST_IDS.forEach(id => localStorage.removeItem(PREFIX + id))
}
