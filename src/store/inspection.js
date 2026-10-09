import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAssetStore } from './asset'
import { useProjectStore } from './project'

const SEED_INSPECTIONS = [
  { inspectionNo: 'XC20260901001', zone: '吴航街道', assetName: '阳光花园1号楼', assetCode: 'ZC2024001', assetId: 'CT-004', address: '长乐区吴航街道阳光花园小区', company: '城市建设投资有限公司', assetType: '保障房', inspector: '李四', inspectionDate: '2026-09-01', status: '已完成', issueCount: 2 },
  { inspectionNo: 'XC20260905001', zone: '航城街道', assetName: '万达广场商铺A座', assetCode: 'ZC2024010', assetId: 'CT-002', address: '长乐区航城街道万达广场A座', company: '置业发展有限公司', assetType: '商铺', inspector: '王五', inspectionDate: '2026-09-05', status: '进行中', issueCount: 0 },
  { inspectionNo: 'XC20260910001', zone: '营前镇', assetName: '国贸写字楼A座', assetCode: 'ZC2024020', assetId: 'CT-003', address: '长乐区营前镇国贸中心A座', company: '置业发展有限公司', assetType: '写字楼', inspector: '赵六', inspectionDate: '2026-09-10', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XC20260912001', zone: '玉田镇', assetName: '高新技术产业园厂房', assetCode: 'ZC2024030', assetId: 'CT-006', address: '长乐区玉田镇高新技术产业园C区', company: '物业管理服务有限公司', assetType: '厂房', inspector: '李四', inspectionDate: '2026-09-12', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XC20260915001', zone: '江田镇', assetName: '朝阳农贸市场', assetCode: 'ZC2024040', assetId: 'CT-007', address: '长乐区江田镇朝阳路88号', company: '旅游开发投资有限公司', assetType: '农贸市场', inspector: '王五', inspectionDate: '2026-09-15', status: '进行中', issueCount: 1 }
]

const SEED_PROJECT_INSPECTIONS = [
  { inspectionNo: 'XM20260903001', zone: '航城片区', assetName: '红联壹城', assetCode: 'PRJ2024001', assetId: 'BLD-001', address: '长乐区航城街道商务楼', company: '城市建设投资有限公司', assetType: '改造项目', inspector: '王五', inspectionDate: '2026-09-03', status: '已完成', issueCount: 1 },
  { inspectionNo: 'XM20260906001', zone: '吴航片区', assetName: '悦山小区', assetCode: 'PRJ2024002', assetId: 'BLD-004', address: '长乐区吴航街道阳光花园西侧', company: '城市建设投资有限公司', assetType: '保障房项目', inspector: '李四', inspectionDate: '2026-09-06', status: '进行中', issueCount: 0 },
  { inspectionNo: 'XM20260909001', zone: '江田片区', assetName: '国子家缘', assetCode: 'PRJ2024003', assetId: 'BLD-005', address: '长乐区江田镇滨海大道', company: '旅游开发投资有限公司', assetType: '文旅项目', inspector: '赵六', inspectionDate: '2026-09-09', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XM20260911001', zone: '营前片区', assetName: '府前御景阁', assetCode: 'PRJ2024004', assetId: 'BLD-008', address: '长乐区营前镇工业园', company: '置业发展有限公司', assetType: '厂房项目', inspector: '王五', inspectionDate: '2026-09-11', status: '进行中', issueCount: 2 }
]

const SEED_REPAIRS = [
  { repairNo: 'BX20260902001', zone: '吴航街道', assetName: '阳光花园1号楼101室', assetCode: 'ZC2024001-0101', assetId: 'CT-004', address: '长乐区吴航街道阳光花园小区1号楼101室', company: '城市建设投资有限公司', reporter: '张三', reporterPhone: '13800138001', reportDate: '2026-09-02', issue: '空调漏水，需要维修', status: '待处理' },
  { repairNo: 'BX20260903001', zone: '航城街道', assetName: '万达广场商铺A101', assetCode: 'ZC2024010-A101', assetId: 'CT-002', address: '长乐区航城街道万达广场A座101铺', company: '置业发展有限公司', reporter: '王经理', reporterPhone: '13900139001', reportDate: '2026-09-03', issue: '电梯故障，无法运行', status: '处理中' },
  { repairNo: 'BX20260905001', zone: '营前镇', assetName: '国贸写字楼A座1501', assetCode: 'ZC2024020-1501', assetId: 'CT-003', address: '长乐区营前镇国贸中心A座1501室', company: '置业发展有限公司', reporter: '刘总', reporterPhone: '13700137001', reportDate: '2026-09-05', issue: '卫生间水管破裂', status: '处理中' },
  { repairNo: 'BX20260901001', zone: '玉田镇', assetName: '高新技术产业园厂房C1', assetCode: 'ZC2024030-C1', assetId: 'CT-006', address: '长乐区玉田镇高新技术产业园C1厂房', company: '物业管理服务有限公司', reporter: '陈厂长', reporterPhone: '13600136001', reportDate: '2026-09-01', issue: '门窗损坏，需要更换', status: '已完成' },
  { repairNo: 'BX20260910001', zone: '江田镇', assetName: '朝阳农贸市场1号厅', assetCode: 'ZC2024040-01', assetId: 'CT-007', address: '长乐区江田镇朝阳路88号1号厅', company: '旅游开发投资有限公司', reporter: '孙老板', reporterPhone: '13500135001', reportDate: '2026-09-10', issue: '照明灯不亮', status: '已完成' }
]

const SEED_REPAIR_MGMT = [
  { repairNo: 'WX20260902001', zone: '吴航街道', assetName: '阳光花园1号楼101室', assetCode: 'ZC2024001-0101', assetId: 'CT-004', address: '长乐区吴航街道阳光花园小区1号楼101室', company: '城市建设投资有限公司', reporter: '张三', reporterPhone: '13800138001', content: '空调漏水，需要维修', photoCount: 3, submitTime: '2026-09-02 10:20:00', auditStatus: '已通过', surveyor: '勘查员-陈志强' },
  { repairNo: 'WX20260903001', zone: '航城街道', assetName: '万达广场商铺A101', assetCode: 'ZC2024010-A101', assetId: 'CT-002', address: '长乐区航城街道万达广场A座101铺', company: '置业发展有限公司', reporter: '王经理', reporterPhone: '13900139001', content: '电梯故障，无法运行', photoCount: 5, submitTime: '2026-09-03 09:15:00', auditStatus: '待审核', surveyor: '' },
  { repairNo: 'WX20260905001', zone: '营前镇', assetName: '国贸写字楼A座1501', assetCode: 'ZC2024020-1501', assetId: 'CT-003', address: '长乐区营前镇国贸中心A座1501室', company: '置业发展有限公司', reporter: '刘总', reporterPhone: '13700137001', content: '卫生间水管破裂', photoCount: 2, submitTime: '2026-09-05 14:40:00', auditStatus: '待审核', surveyor: '' },
  { repairNo: 'WX20260901001', zone: '玉田镇', assetName: '高新技术产业园厂房C1', assetCode: 'ZC2024030-C1', assetId: 'CT-006', address: '长乐区玉田镇高新技术产业园C1厂房', company: '物业管理服务有限公司', reporter: '陈厂长', reporterPhone: '13600136001', content: '门窗损坏，需要更换', photoCount: 4, submitTime: '2026-09-01 16:05:00', auditStatus: '已通过', surveyor: '勘查员-林晓' },
  { repairNo: 'WX20260910001', zone: '江田镇', assetName: '朝阳农贸市场1号厅', assetCode: 'ZC2024040-01', assetId: 'CT-007', address: '长乐区江田镇朝阳路88号1号厅', company: '旅游开发投资有限公司', reporter: '孙老板', reporterPhone: '13500135001', content: '照明灯不亮', photoCount: 1, submitTime: '2026-09-10 11:30:00', auditStatus: '已驳回', surveyor: '勘查员-黄伟' }
]

const SEED_WORK_ORDERS = [
  { orderNo: 'GD20260902001', repairNo: 'BX20260902001', assetName: '阳光花园1号楼101室', assetId: 'CT-004', company: '城市建设投资有限公司', handler: '维修工A', handlerPhone: '13100131001', assignDate: '2026-09-02', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260903001', repairNo: 'BX20260903001', assetName: '万达广场商铺A101', assetId: 'CT-002', company: '置业发展有限公司', handler: '维修工B', handlerPhone: '13100131002', assignDate: '2026-09-03', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260905001', repairNo: 'BX20260905001', assetName: '国贸写字楼A座1501', assetId: 'CT-003', company: '置业发展有限公司', handler: '维修工C', handlerPhone: '13100131003', assignDate: '2026-09-05', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260901001', repairNo: 'BX20260901001', assetName: '高新技术产业园厂房C1', assetId: 'CT-006', company: '物业管理服务有限公司', handler: '维修工D', handlerPhone: '13100131004', assignDate: '2026-09-01', completeDate: '2026-09-02', status: '已完成' },
  { orderNo: 'GD20260910001', repairNo: 'BX20260910001', assetName: '朝阳农贸市场1号厅', assetId: 'CT-007', company: '旅游开发投资有限公司', handler: '维修工E', handlerPhone: '13100131005', assignDate: '2026-09-10', completeDate: '2026-09-11', status: '已完成' }
]

const SEED_PLANS = [
  { planNo: 'JH20260901001', scope: '阳光花园1号楼及周边商铺', cycle: '2026-09-01 ~ 2026-09-30', owner: '李四', status: '进行中', remark: '每月全覆盖巡查一次' },
  { planNo: 'JH20260905001', scope: '万达广场商铺A座', cycle: '2026-09-05 ~ 2026-10-05', owner: '王五', status: '进行中', remark: '重点关注消防通道' },
  { planNo: 'JH20260910001', scope: '国贸写字楼A座', cycle: '2026-09-10 ~ 2026-12-10', owner: '赵六', status: '未开始', remark: '季度计划' },
  { planNo: 'JH20260915001', scope: '朝阳农贸市场', cycle: '2026-09-15 ~ 2026-10-15', owner: '王五', status: '未开始', remark: '' },
  { planNo: 'JH20260801001', scope: '高新技术产业园厂房', cycle: '2026-08-01 ~ 2026-08-31', owner: '李四', status: '已完成', remark: '上月计划已归档' }
]

export const useInspectionStore = defineStore('inspection', () => {
  const inspectionList = ref([...SEED_INSPECTIONS])
  const projectInspections = ref([...SEED_PROJECT_INSPECTIONS])
  const repairList = ref([...SEED_REPAIRS])
  const repairMgmtList = ref([...SEED_REPAIR_MGMT])
  const workOrderList = ref([...SEED_WORK_ORDERS])
  const planList = ref([...SEED_PLANS])
  const surveyorOptions = ref(['勘查员-陈志强', '勘查员-林晓', '勘查员-黄伟', '工程勘查-刘工'])

  const assetOptions = computed(() => {
    const assetStore = useAssetStore()
    return assetStore.assets.map(a => ({
      code: a.id,
      name: a.name,
      type: a.type,
      zone: a.zoneName || '',
      address: a.location || '',
      company: a.group || ''
    }))
  })

  const projectOptions = computed(() => {
    const projectStore = useProjectStore()
    return projectStore.allProjects.map(p => ({
      code: p.id,
      name: p.name,
      type: p.type || '',
      zone: p.partitions?.[0]?.name || '',
      address: p.address || '',
      company: p.group || ''
    }))
  })

  const companyOptions = computed(() => {
    const assetStore = useAssetStore()
    return [...new Set(assetStore.assets.map(a => a.group).filter(Boolean))]
  })

  function nextNo(prefix) {
    return prefix + Date.now().toString().slice(-10)
  }

  function addInspection(record, isProject = false) {
    if (isProject) projectInspections.value.unshift(record)
    else inspectionList.value.unshift(record)
  }

  function updateInspection(no, updates, isProject = false) {
    const list = isProject ? projectInspections.value : inspectionList.value
    const item = list.find(i => i.inspectionNo === no)
    if (item) Object.assign(item, updates)
  }

  function addRepair(record) {
    repairList.value.unshift(record)
  }

  function updateRepair(repairNo, updates) {
    const item = repairList.value.find(r => r.repairNo === repairNo)
    if (item) Object.assign(item, updates)
  }

  function addRepairMgmt(record) {
    repairMgmtList.value.unshift(record)
  }

  function updateRepairMgmt(repairNo, updates) {
    const item = repairMgmtList.value.find(r => r.repairNo === repairNo)
    if (item) Object.assign(item, updates)
  }

  function addWorkOrder(record) {
    workOrderList.value.unshift(record)
  }

  function updateWorkOrder(orderNo, updates) {
    const item = workOrderList.value.find(o => o.orderNo === orderNo)
    if (item) Object.assign(item, updates)
  }

  function addPlan(record) {
    planList.value.unshift(record)
  }

  function deletePlan(planNo) {
    const idx = planList.value.findIndex(p => p.planNo === planNo)
    if (idx > -1) planList.value.splice(idx, 1)
  }

  function getRepairByNo(repairNo) {
    return repairList.value.find(r => r.repairNo === repairNo)
  }

  function getInspectionsByAsset(assetCode) {
    return [
      ...inspectionList.value.filter(i => i.assetCode === assetCode),
      ...projectInspections.value.filter(i => i.assetCode === assetCode)
    ]
  }

  function getRepairsByAsset(assetCode) {
    return repairList.value.filter(r => r.assetCode === assetCode)
  }

  function getInspectionsByAssetId(assetId) {
    return [
      ...inspectionList.value.filter(i => i.assetId === assetId),
      ...projectInspections.value.filter(i => i.assetId === assetId)
    ]
  }

  function getRepairsByAssetId(assetId) {
    return repairList.value.filter(r => r.assetId === assetId)
  }

  function resolveAssetName(assetId) {
    if (!assetId) return ''
    const assetStore = useAssetStore()
    const asset = assetStore.assets.find(a => a.id === assetId)
    return asset ? asset.name : ''
  }

  const stats = computed(() => ({
    totalInspections: inspectionList.value.length,
    pendingInspections: inspectionList.value.filter(i => i.status === '待巡查').length,
    inProgressInspections: inspectionList.value.filter(i => i.status === '进行中').length,
    completedInspections: inspectionList.value.filter(i => i.status === '已完成').length,
    totalRepairs: repairList.value.length,
    pendingRepairs: repairList.value.filter(r => r.status === '待处理').length,
    inProgressRepairs: repairList.value.filter(r => r.status === '处理中').length,
    completedRepairs: repairList.value.filter(r => r.status === '已完成').length,
    totalWorkOrders: workOrderList.value.length,
    pendingAudit: repairMgmtList.value.filter(m => m.auditStatus === '待审核').length
  }))

  return {
    inspectionList, projectInspections, repairList, repairMgmtList, workOrderList, planList,
    assetOptions, projectOptions, surveyorOptions, companyOptions,
    addInspection, updateInspection,
    addRepair, updateRepair,
    addRepairMgmt, updateRepairMgmt,
    addWorkOrder, updateWorkOrder,
    addPlan, deletePlan,
    getRepairByNo, getInspectionsByAsset, getRepairsByAsset,
    getInspectionsByAssetId, getRepairsByAssetId, resolveAssetName,
    stats, nextNo
  }
})
