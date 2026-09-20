import { defineStore } from 'pinia'
import { ref } from 'vue'
import { superviseOrders as initialOrders, contacts as initialContacts } from '../data/mock'

export const useSuperviseStore = defineStore('supervise', () => {
  const orders = ref([...initialOrders])
  const contacts = ref([...initialContacts])

  function getOrdersByCompany(companyName) {
    return orders.value.filter(o => o.group === companyName)
  }

  function addOrder(order) {
    const num = orders.value.length + 1
    const newId = `DB-2026-${String(num).padStart(3, '0')}`
    const newOrder = { ...order, id: newId }
    orders.value.push(newOrder)
    return newOrder
  }

  function updateOrder(id, updates) {
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) {
      orders.value[idx] = { ...orders.value[idx], ...updates }
    }
  }

  function getOrderById(id) {
    return orders.value.find(o => o.id === id)
  }

  return {
    orders,
    contacts,
    getOrdersByCompany,
    addOrder,
    updateOrder,
    getOrderById
  }
})
