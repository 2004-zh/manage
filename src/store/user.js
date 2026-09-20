import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  const roles = [
    { id: 'guozi', name: '长乐国资中心·运营科', org: '长乐国资中心', endpoint: 'gov', home: '/gov/home', username: 'guozi', password: '123456', desc: '监管端 — 查看全区 4 家集团数据' },
    { id: 'chengtou', name: '城投集团·资产管理员', org: '城投集团', endpoint: 'ent', home: '/ent/home', username: 'chengtou', password: '123456', desc: '企业端 — 管理本集团资产' },
    { id: 'chantou', name: '产投集团·资产管理员', org: '产投集团', endpoint: 'ent', home: '/ent/home', username: 'chantou', password: '123456', desc: '企业端 — 管理本集团资产' },
    { id: 'shuitou', name: '水投集团·资产管理员', org: '水投集团', endpoint: 'ent', home: '/ent/home', username: 'shuitou', password: '123456', desc: '企业端 — 管理本集团资产' },
    { id: 'linghang', name: '领航公司·资产管理员', org: '领航公司', endpoint: 'ent', home: '/ent/home', username: 'linghang', password: '123456', desc: '企业端 — 管理本集团资产' }
  ]

  const isLoggedIn = computed(() => !!user.value)
  const isGov = computed(() => user.value?.endpoint === 'gov')
  const isEnt = computed(() => user.value?.endpoint === 'ent')

  function login(username, password, roleId) {
    const role = roles.find(r => r.id === roleId)
    if (!role || role.username !== username || role.password !== password) return false
    user.value = { ...role }
    try { sessionStorage.setItem('user', JSON.stringify(user.value)) } catch (e) {}
    return true
  }

  function logout() {
    user.value = null
    try { sessionStorage.removeItem('user') } catch (e) {}
  }

  function switchRole(roleId) {
    const role = roles.find(r => r.id === roleId)
    if (!role) return false
    user.value = { ...role }
    try { sessionStorage.setItem('user', JSON.stringify(user.value)) } catch (e) {}
    return true
  }

  function restore() {
    try {
      const saved = sessionStorage.getItem('user')
      if (saved) user.value = JSON.parse(saved)
    } catch (e) {}
  }

  return { user, roles, isLoggedIn, isGov, isEnt, login, logout, switchRole, restore }
})
