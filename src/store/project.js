import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { buildingHierarchy as initialHierarchy } from '../data/mock'

let _bldSeq = 100
let _partSeq = 100
let _zoneSeq = 100
let _rmSeq = 200

function calcProjectStats(project) {
  const rooms = project.partitions.flatMap(p => p.floors.flatMap(f => f.rooms))
  const totalAssets = rooms.length
  const totalArea = Math.round(rooms.reduce((s, r) => s + (r.area || 0), 0) * 100) / 100
  const rentedCount = rooms.filter(r => r.status === '已出租').length
  const idleCount = rooms.filter(r => r.status === '空置' || r.status === '闲置').length
  const rentalRate = totalAssets ? Math.round(rentedCount / totalAssets * 10000) / 100 : 0
  return { totalAssets, totalArea, rentedCount, idleCount, rentalRate }
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref(JSON.parse(JSON.stringify(initialHierarchy)))

  const allProjects = computed(() => projects.value)

  function getProjectById(id) {
    return projects.value.find(p => p.id === id)
  }

  function addProject(data) {
    _bldSeq++
    const projectId = `BLD-${String(_bldSeq).padStart(3, '0')}`

    const partitions = (data.partitions || []).map((part, pi) => {
      _partSeq++
      const partId = `PART-${String(_partSeq).padStart(3, '0')}`
      const floors = (part.floors || []).map((fl, fi) => {
        _zoneSeq++
        const floorId = `ZONE-${String(_zoneSeq).padStart(3, '0')}`
        const rooms = (fl.rooms || []).map((rm, ri) => {
          _rmSeq++
          return {
            id: `RM-${String(_rmSeq).padStart(3, '0')}`,
            name: rm.name || `${data.name}${part.name || ''}${fl.name || ''}${String(ri + 1).padStart(3, '0')}`,
            assetNo: rm.assetNo || `AST-${String(_rmSeq).padStart(3, '0')}`,
            area: Number(rm.area) || 0,
            status: rm.status || '空置',
            leaseExpiry: rm.leaseExpiry || null,
            hasPropertyRight: rm.hasPropertyRight || false,
            tenant: rm.tenant || null,
            monthlyRent: Number(rm.monthlyRent) || 0,
            vacancyDays: rm.status === '空置' || rm.status === '闲置' ? (rm.vacancyDays || 0) : null
          }
        })
        return {
          id: floorId,
          name: fl.name || `${fi + 1}F`,
          area: fl.area || rooms.reduce((s, r) => s + r.area, 0),
          rooms
        }
      })
      return {
        id: partId,
        name: part.name || `分区${pi + 1}`,
        area: part.area || floors.reduce((s, f) => s + f.area, 0),
        floors
      }
    })

    const project = {
      id: projectId,
      name: data.name,
      type: data.type || '商业办公',
      group: data.group || '城投集团',
      address: data.address || '',
      image: data.image || '',
      cumIncome: 0,
      yearIncome: 0,
      partitions
    }

    const stats = calcProjectStats(project)
    Object.assign(project, stats)

    projects.value.push(project)
    return project
  }

  function addRoomsToFloor(projectId, partitionId, floorId, rooms) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return
    const partition = project.partitions.find(p => p.id === partitionId)
    if (!partition) return
    const floor = partition.floors.find(f => f.id === floorId)
    if (!floor) return

    rooms.forEach(rm => {
      _rmSeq++
      floor.rooms.push({
        id: `RM-${String(_rmSeq).padStart(3, '0')}`,
        name: rm.name || `新房间${_rmSeq}`,
        assetNo: rm.assetNo || `AST-${String(_rmSeq).padStart(3, '0')}`,
        area: Number(rm.area) || 0,
        status: rm.status || '空置',
        leaseExpiry: null,
        hasPropertyRight: false,
        tenant: null,
        monthlyRent: 0,
        vacancyDays: 0
      })
    })

    const stats = calcProjectStats(project)
    Object.assign(project, stats)
  }

  function addPartition(projectId, partition) {
    const project = projects.value.find(p => p.id === projectId)
    if (!project) return

    _partSeq++
    const partId = `PART-${String(_partSeq).padStart(3, '0')}`
    const floors = (partition.floors || []).map((fl, fi) => {
      _zoneSeq++
      const floorId = `ZONE-${String(_zoneSeq).padStart(3, '0')}`
      const rooms = (fl.rooms || []).map((rm, ri) => {
        _rmSeq++
        return {
          id: `RM-${String(_rmSeq).padStart(3, '0')}`,
          name: rm.name || `房间${_rmSeq}`,
          assetNo: rm.assetNo || `AST-${String(_rmSeq).padStart(3, '0')}`,
          area: Number(rm.area) || 0,
          status: rm.status || '空置',
          leaseExpiry: null,
          hasPropertyRight: false,
          tenant: null,
          monthlyRent: 0,
          vacancyDays: 0
        }
      })
      return {
        id: floorId,
        name: fl.name || `${fi + 1}F`,
        area: fl.area || rooms.reduce((s, r) => s + r.area, 0),
        rooms
      }
    })

    project.partitions.push({
      id: partId,
      name: partition.name || `分区${project.partitions.length + 1}`,
      area: partition.area || floors.reduce((s, f) => s + f.area, 0),
      floors
    })

    const stats = calcProjectStats(project)
    Object.assign(project, stats)
  }

  return {
    projects,
    allProjects,
    getProjectById,
    addProject,
    addRoomsToFloor,
    addPartition
  }
})
