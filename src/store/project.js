import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { buildingHierarchy as initialHierarchy } from '../data/mock'
import { useUserStore } from './user'
import { useAuditStore } from './audit'

let _bldSeq = 100
let _partSeq = 100
let _zoneSeq = 100
let _rmSeq = 200

function calcProjectStats(project) {
  const rooms = project.partitions.flatMap(p => p.floors.flatMap(f => f.rooms))
  const totalAssets = rooms.length
  const totalArea = Math.round(rooms.reduce((s, r) => s + (r.area || 0), 0) * 100) / 100
  const rentedCount = rooms.filter(r => r.status === '已出租' || r.status === '部分出租').length
  const idleCount = rooms.filter(r => r.status === '空置' || r.status === '闲置').length
  const rentalRate = totalAssets ? Math.round(rentedCount / totalAssets * 10000) / 100 : 0
  return { totalAssets, totalArea, rentedCount, idleCount, rentalRate }
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref(JSON.parse(JSON.stringify(initialHierarchy)))

  const allProjects = computed(() => projects.value)

  // 企业端登录账号只看本集团的项目，监管端不过滤。资产构建仍走全量 projects，避免影响台账统计。
  const visibleProjects = computed(() => {
    const user = useUserStore().user
    if (!user || user.endpoint !== 'ent') return projects.value
    return projects.value.filter(p => p.group === user.org)
  })

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
    if (!project) return null

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

    const created = {
      id: partId,
      name: partition.name || `分区${project.partitions.length + 1}`,
      area: partition.area || floors.reduce((s, f) => s + f.area, 0),
      floors
    }
    project.partitions.push(created)

    const stats = calcProjectStats(project)
    Object.assign(project, stats)
    recordStruct(project, '新增分区', `新增分区「${created.name}」（${floors.length} 个楼层、面积 ${created.area} ㎡）`)
    return created
  }

  function findPartition(projectId, partitionId) {
    const project = getProjectById(projectId)
    if (!project) return null
    const partition = (project.partitions || []).find(p => p.id === partitionId)
    return partition ? { project, partition } : null
  }

  function partitionStats(partition) {
    const floors = partition.floors || []
    const rooms = floors.flatMap(f => f.rooms || [])
    return {
      floorCount: floors.length,
      roomCount: rooms.length,
      leasedCount: rooms.filter(r => r.status === '已出租' || r.status === '部分出租').length
    }
  }

  /** 改名/改面积。改名要留字段级痕迹，否则台账「分区」列说变就变没人知道为什么。 */
  function updatePartition(projectId, partitionId, updates) {
    const hit = findPartition(projectId, partitionId)
    if (!hit) return false
    const { project, partition } = hit

    if (updates.name != null && updates.name !== partition.name) {
      useAuditStore().recordChange({
        assetId: project.id, assetName: project.name, group: project.group,
        module: '项目管理', action: '修改分区',
        field: 'zoneName', before: partition.name, after: updates.name
      })
      partition.name = updates.name
    }
    if (updates.area != null && Number(updates.area) !== Number(partition.area)) {
      useAuditStore().recordChange({
        assetId: project.id, assetName: project.name, group: project.group,
        module: '项目管理', action: '修改分区',
        field: 'area', before: partition.area, after: Number(updates.area) || 0
      })
      partition.area = Number(updates.area) || 0
    }
    Object.assign(project, calcProjectStats(project))
    return true
  }

  /**
   * 删除分区。分区下还压着在租房间时硬拦——那等于把正在计租的空间从结构里抹掉，
   * 租金/合同口径会立刻对不上。挂进来的平铺资产由调用方先行移出项目（跨 store，避免循环依赖）。
   */
  function removePartition(projectId, partitionId) {
    const hit = findPartition(projectId, partitionId)
    if (!hit) return { ok: false, reason: '分区不存在' }
    const { project, partition } = hit
    const idx = project.partitions.indexOf(partition)
    const stat = partitionStats(partition)
    if (stat.leasedCount) {
      return { ok: false, reason: `分区「${partition.name}」下还有 ${stat.leasedCount} 间在租房间，请先退租或调整状态` }
    }

    project.partitions.splice(idx, 1)
    Object.assign(project, calcProjectStats(project))
    recordStruct(project, '删除分区', `删除分区「${partition.name}」（原含 ${stat.floorCount} 个楼层、${stat.roomCount} 间房间）`)
    return { ok: true }
  }

  // 项目结构的变动记到变更记录里：assetId 用项目 id，和「资产挂入项目」同一口径
  function recordStruct(project, action, detail) {
    useAuditStore().recordEvent({
      assetId: project.id,
      assetName: project.name,
      group: project.group,
      module: '项目管理',
      action,
      detail
    })
  }

  function findRoom(roomId) {
    for (const b of projects.value) {
      for (const p of (b.partitions || [])) {
        for (const f of (p.floors || [])) {
          const r = (f.rooms || []).find(rm => rm.id === roomId)
          if (r) return { building: b, partition: p, floor: f, room: r }
        }
      }
    }
    return null
  }

  // 房间级资产的写入口：把资产层字段翻译成房间层字段，并重算项目统计
  function updateRoom(roomId, updates) {
    const hit = findRoom(roomId)
    if (!hit) return false
    const r = hit.room
    if ('status' in updates) r.status = updates.status
    if ('tenant' in updates) r.tenant = updates.tenant
    if ('leaseExpiry' in updates) r.leaseExpiry = updates.leaseExpiry
    if ('vacancyDays' in updates) r.vacancyDays = updates.vacancyDays
    if ('area' in updates) r.area = Number(updates.area) || 0
    if ('name' in updates) r.name = updates.name
    if ('certStatus' in updates) {
      r.certStatus = updates.certStatus
      r.hasPropertyRight = updates.certStatus === '已办证'
    }
    if ('certDetail' in updates) r.certDetail = updates.certDetail || ''
    if ('annualRent' in updates && updates.annualRent != null) {
      r.monthlyRent = Math.round(Number(updates.annualRent) * 10000 / 12)
    }
    if ('monthlyRent' in updates) r.monthlyRent = Number(updates.monthlyRent) || 0
    Object.assign(hit.building, calcProjectStats(hit.building))
    return true
  }

  return {
    projects,
    allProjects,
    visibleProjects,
    getProjectById,
    addProject,
    addRoomsToFloor,
    addPartition,
    findPartition,
    partitionStats,
    updatePartition,
    removePartition,
    findRoom,
    updateRoom
  }
})
