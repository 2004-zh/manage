/**
 * 固定资产基础设置种子数据 · P1 收编
 *
 * 原定义在 FixedAssetSettings.vue 组件内，现由 fixedAsset store 持有并持久化，
 * 使「基础设置」与「固定资产管理」读到同一份配置。字段暂沿用历史命名。
 */

export const SEED_LOCATION_LIST = [
  { code: 'LOC001', name: '总部办公楼', parentName: '-', manager: '张三', assetCount: 135 },
  { code: 'LOC001-01', name: '总部办公楼1层', parentName: '总部办公楼', manager: '张三', assetCount: 45 },
  { code: 'LOC001-02', name: '总部办公楼2层', parentName: '总部办公楼', manager: '张三', assetCount: 38 },
  { code: 'LOC001-03', name: '总部办公楼3层', parentName: '总部办公楼', manager: '张三', assetCount: 52 },
  { code: 'LOC002', name: '仓库', parentName: '-', manager: '李四', assetCount: 110 },
  { code: 'LOC002-01', name: '仓库A区', parentName: '仓库', manager: '李四', assetCount: 68 },
  { code: 'LOC002-02', name: '仓库B区', parentName: '仓库', manager: '李四', assetCount: 42 },
  { code: 'LOC003', name: '车库', parentName: '-', manager: '王五', assetCount: 12 },
  // P2：原管理页下拉里有「数据中心机房」，补进唯一位置配置源，避免统一后选项丢失
  { code: 'LOC004', name: '数据中心机房', parentName: '-', manager: '王五', assetCount: 3 }
]

export const SEED_LOCATION_OPTIONS = [
  { code: 'LOC001', name: '总部办公楼' },
  { code: 'LOC002', name: '仓库' },
  { code: 'LOC003', name: '车库' }
]

export const SEED_CATEGORY_TREE = [
  {
    id: 'CAT000', code: 'CAT000', name: '高价值资产', parentCode: '', parentName: '-', depreciationMethod: '年限平均法', usefulLife: 10, assetCount: 326, status: '启用', createTime: '2026-01-06 09:12:00', updateTime: '2026-09-12 14:30:21',
    children: [
      {
        id: 'CAT000-01', code: 'CAT000-01', name: '机械类', parentCode: 'CAT000', parentName: '高价值资产', depreciationMethod: '年限平均法', usefulLife: 10, assetCount: 128, status: '启用', createTime: '2026-01-06 09:20:00', updateTime: '2026-09-10 11:05:33',
        children: [
          { id: 'CAT000-0101', code: 'CAT000-0101', name: '一般机械类', parentCode: 'CAT000-01', parentName: '机械类', depreciationMethod: '年限平均法', usefulLife: 10, assetCount: 62, status: '启用', createTime: '2026-01-06 09:26:00', updateTime: '2026-09-08 16:41:02', children: [] },
          { id: 'CAT000-0102', code: 'CAT000-0102', name: '数控机床类', parentCode: 'CAT000-01', parentName: '机械类', depreciationMethod: '年数总和法', usefulLife: 12, assetCount: 38, status: '启用', createTime: '2026-01-06 09:28:00', updateTime: '2026-09-07 10:22:45', children: [] },
          { id: 'CAT000-0103', code: 'CAT000-0103', name: '工程机械类', parentCode: 'CAT000-01', parentName: '机械类', depreciationMethod: '工作量法', usefulLife: 8, assetCount: 28, status: '禁用', createTime: '2026-01-06 09:30:00', updateTime: '2026-08-30 09:14:18', children: [] }
        ]
      },
      {
        id: 'CAT000-02', code: 'CAT000-02', name: '运输设备类', parentCode: 'CAT000', parentName: '高价值资产', depreciationMethod: '双倍余额递减法', usefulLife: 8, assetCount: 96, status: '启用', createTime: '2026-01-06 09:34:00', updateTime: '2026-09-05 15:38:27',
        children: [
          { id: 'CAT000-0201', code: 'CAT000-0201', name: '商务客车', parentCode: 'CAT000-02', parentName: '运输设备类', depreciationMethod: '双倍余额递减法', usefulLife: 8, assetCount: 41, status: '启用', createTime: '2026-01-06 09:36:00', updateTime: '2026-09-04 10:11:52', children: [] },
          { id: 'CAT000-0202', code: 'CAT000-0202', name: '货运车辆', parentCode: 'CAT000-02', parentName: '运输设备类', depreciationMethod: '工作量法', usefulLife: 6, assetCount: 55, status: '启用', createTime: '2026-01-06 09:38:00', updateTime: '2026-09-03 14:02:09', children: [] }
        ]
      },
      {
        id: 'CAT000-03', code: 'CAT000-03', name: '房屋建筑物类', parentCode: 'CAT000', parentName: '高价值资产', depreciationMethod: '年限平均法', usefulLife: 30, assetCount: 102, status: '启用', createTime: '2026-01-06 09:40:00', updateTime: '2026-09-02 09:47:36',
        children: [
          { id: 'CAT000-0301', code: 'CAT000-0301', name: '办公用房', parentCode: 'CAT000-03', parentName: '房屋建筑物类', depreciationMethod: '年限平均法', usefulLife: 30, assetCount: 64, status: '启用', createTime: '2026-01-06 09:42:00', updateTime: '2026-08-28 17:20:44', children: [] },
          { id: 'CAT000-0302', code: 'CAT000-0302', name: '生产厂房', parentCode: 'CAT000-03', parentName: '房屋建筑物类', depreciationMethod: '年限平均法', usefulLife: 25, assetCount: 38, status: '启用', createTime: '2026-01-06 09:44:00', updateTime: '2026-08-26 11:33:15', children: [] }
        ]
      }
    ]
  },
  {
    id: 'CAT001', code: 'CAT001', name: '办公用品', parentCode: '', parentName: '-', depreciationMethod: '直线法', usefulLife: 5, assetCount: 156, status: '启用', createTime: '2026-01-06 10:02:00', updateTime: '2026-09-11 09:26:40',
    children: [
      { id: 'CAT001-01', code: 'CAT001-01', name: '办公家具', parentCode: 'CAT001', parentName: '办公用品', depreciationMethod: '直线法', usefulLife: 10, assetCount: 88, status: '启用', createTime: '2026-01-06 10:04:00', updateTime: '2026-09-09 15:52:11', children: [] },
      { id: 'CAT001-02', code: 'CAT001-02', name: '办公耗材', parentCode: 'CAT001', parentName: '办公用品', depreciationMethod: '直线法', usefulLife: 1, assetCount: 68, status: '启用', createTime: '2026-01-06 10:06:00', updateTime: '2026-09-06 08:41:57', children: [] }
    ]
  },
  { id: 'CAT002', code: 'CAT002', name: '车辆', parentCode: '', parentName: '-', depreciationMethod: '双倍余额递减法', usefulLife: 8, assetCount: 12, status: '启用', createTime: '2026-01-06 10:10:00', updateTime: '2026-08-25 14:18:03', children: [] },
  {
    id: 'CAT003', code: 'CAT003', name: '设备', parentCode: '', parentName: '-', depreciationMethod: '直线法', usefulLife: 5, assetCount: 89, status: '启用', createTime: '2026-01-06 10:14:00', updateTime: '2026-09-13 10:07:29',
    children: [
      { id: 'CAT003-01', code: 'CAT003-01', name: '电子设备', parentCode: 'CAT003', parentName: '设备', depreciationMethod: '直线法', usefulLife: 5, assetCount: 65, status: '启用', createTime: '2026-01-06 10:16:00', updateTime: '2026-09-12 09:31:48', children: [] },
      { id: 'CAT003-02', code: 'CAT003-02', name: '机械设备', parentCode: 'CAT003', parentName: '设备', depreciationMethod: '直线法', usefulLife: 10, assetCount: 24, status: '启用', createTime: '2026-01-06 10:18:00', updateTime: '2026-09-01 16:44:22', children: [] }
    ]
  },
  { id: 'CAT004', code: 'CAT004', name: '材料', parentCode: '', parentName: '-', depreciationMethod: '直线法', usefulLife: 1, assetCount: 230, status: '启用', createTime: '2026-01-06 10:22:00', updateTime: '2026-08-20 11:09:36', children: [] },
  { id: 'CAT005', code: 'CAT005', name: '其他', parentCode: '', parentName: '-', depreciationMethod: '直线法', usefulLife: 5, assetCount: 45, status: '禁用', createTime: '2026-01-06 10:26:00', updateTime: '2026-08-18 15:27:50', children: [] }
]

export const SEED_DEPRECIATION_RULES = [
  { name: '电子设备折旧', method: '直线法', usefulLife: 5, residualRate: 5, description: '适用于电脑、打印机等电子设备' },
  { name: '车辆折旧', method: '双倍余额递减法', usefulLife: 8, residualRate: 5, description: '适用于公司车辆' },
  { name: '办公家具折旧', method: '直线法', usefulLife: 10, residualRate: 5, description: '适用于桌椅、柜子等家具' },
  { name: '机械设备折旧', method: '年数总和法', usefulLife: 10, residualRate: 5, description: '适用于大型机械设备' },
  { name: '低值易耗品', method: '直线法', usefulLife: 1, residualRate: 0, description: '适用于办公用品等低值易耗品' }
]

export const SEED_DEPRECIATION_PLANS = [
  { id: 'DP1', company: '华信科技集团有限公司', name: '电子设备年限平均折旧', method: '年限平均法', assetTypes: ['电子设备'], residualRate: 5, calcTime: '按月计提', monthlyDay: 25, purchaseMode: '购买', remark: '每月25日计提当期折旧', createTime: '2026-01-10 09:20:00', updateTime: '2026-09-01 10:15:00' },
  { id: 'DP2', company: '华信科技集团有限公司', name: '租赁设备按起租日折旧', method: '年限平均法', assetTypes: ['机械设备', '电子设备'], residualRate: 3, calcTime: '按月计提', monthlyDay: 28, purchaseMode: '租赁', remark: '按租赁合同起租日开始计提', createTime: '2026-02-14 14:02:00', updateTime: '2026-08-30 16:44:12' },
  { id: 'DP3', company: '云鼎资产管理有限公司', name: '运输设备双倍余额折旧', method: '双倍余额递减法', assetTypes: ['运输设备'], residualRate: 5, calcTime: '按月计提', monthlyDay: 20, purchaseMode: '购买', remark: '车辆按双倍余额递减法计提', createTime: '2026-03-02 10:35:00', updateTime: '2026-08-28 09:26:41' },
  { id: 'DP4', company: '云鼎资产管理有限公司', name: '房屋建筑物年度折旧', method: '年限平均法', assetTypes: ['房屋建筑物'], residualRate: 10, calcTime: '按年计提', monthlyDay: 31, purchaseMode: '自建', remark: '每年12月31日一次性计提', createTime: '2026-03-18 15:48:00', updateTime: '2026-08-25 11:03:57' },
  { id: 'DP5', company: '恒信融资租赁有限公司', name: '机械设备工作量折旧', method: '工作量法', assetTypes: ['机械设备'], residualRate: 5, calcTime: '按季计提', monthlyDay: 15, purchaseMode: '租赁', remark: '按季度结合台班工作量计提', createTime: '2026-04-06 09:12:00', updateTime: '2026-08-20 14:37:26' },
  { id: 'DP6', company: '恒信融资租赁有限公司', name: '办公家具直线折旧', method: '直线法', assetTypes: ['办公家具'], residualRate: 5, calcTime: '按月计提', monthlyDay: 25, purchaseMode: '购买', remark: '', createTime: '2026-05-11 11:26:00', updateTime: '2026-08-18 10:52:03' },
  { id: 'DP7', company: '中天建设集团有限公司', name: '工程机械按台班折旧', method: '工作量法', assetTypes: ['机械设备', '运输设备'], residualRate: 4, calcTime: '按月计提', monthlyDay: 5, purchaseMode: '自建', remark: '按现场台班记录计提', createTime: '2026-06-09 08:44:00', updateTime: '2026-09-05 17:08:35' },
  { id: 'DP8', company: '中天建设集团有限公司', name: '受赠资产季度折旧', method: '年数总和法', assetTypes: ['其他设备'], residualRate: 0, calcTime: '按季计提', monthlyDay: 30, purchaseMode: '受赠', remark: '受赠资产按年数总和法计提', createTime: '2026-07-15 16:20:00', updateTime: '2026-09-10 09:41:18' },
  { id: 'DP9', company: '华信科技集团有限公司', name: '低值易耗品一次摊销', method: '直线法', assetTypes: ['其他设备'], residualRate: 0, calcTime: '按月计提', monthlyDay: 1, purchaseMode: '购买', remark: '单价2000元以下一次性摊销', createTime: '2026-08-03 10:05:00', updateTime: '2026-09-12 15:33:47' },
  { id: 'DP10', company: '云鼎资产管理有限公司', name: '电子设备加速折旧', method: '双倍余额递减法', assetTypes: ['电子设备'], residualRate: 5, calcTime: '按月计提', monthlyDay: 26, purchaseMode: '租赁', remark: '租赁电子设备加速计提', createTime: '2026-08-21 13:52:00', updateTime: '2026-09-14 09:19:24' },
  { id: 'DP11', company: '恒信融资租赁有限公司', name: '房屋建筑物直线折旧', method: '直线法', assetTypes: ['房屋建筑物'], residualRate: 8, calcTime: '按年计提', monthlyDay: 31, purchaseMode: '购买', remark: '', createTime: '2026-09-02 09:36:00', updateTime: '2026-09-15 11:47:52' }
]

export const SEED_APPROVAL_FLOWS = [
  { name: '入库验收审批', type: '入库验收', steps: '部门经理->财务->总经理', status: '启用' },
  { name: '派发退库审批', type: '派发退库', steps: '部门经理->行政部', status: '启用' },
  { name: '借出归还审批', type: '借出归还', steps: '部门经理->行政部', status: '启用' },
  { name: '资产变更审批', type: '资产变更', steps: '部门经理->财务->总经理', status: '启用' },
  { name: '资产处置审批', type: '资产处置', steps: '部门经理->财务->副总经理->总经理', status: '启用' }
]

// ---- P2：盘点单种子数据生成器（原在管理页内，现由 store 独立初始化） ----
export const FIXED_ASSET_COMPANIES = [
  '华信科技集团有限公司', '云鼎资产管理有限公司', '恒信融资租赁有限公司', '中天建设集团有限公司'
]

export const EMP_POOL = [
  { name: '张志刚', dept: '资产管理部', phone: '13800000001' },
  { name: '李秀兰', dept: '财务部', phone: '13800000002' },
  { name: '王建军', dept: '行政部', phone: '13800000003' },
  { name: '赵晓梅', dept: '运营部', phone: '13800000004' },
  { name: '陈立新', dept: '技术部', phone: '13800000005' },
  { name: '刘洋', dept: '资产管理部', phone: '13800000006' },
  { name: '杨帆', dept: '后勤部', phone: '13800000007' },
  { name: '徐磊', dept: '技术部', phone: '13800000008' }
]

const ASSET_NAME_POOL = ['联想ThinkPad笔记本', '戴尔OptiPlex台式机', '惠普激光打印机', '爱普生投影仪', '华为会议平板', '格力中央空调机组', '丰田考斯特商务车', '实木会议桌', '人体工学办公椅', '服务器机柜', '不间断电源UPS', '高速扫描仪']
const ASSET_STATUS_POOL = ['空闲', '使用中', '维修中', '借出中', '派发中']
const INV_LOCATION_POOL = ['总部办公楼1层', '总部办公楼2层', '总部办公楼3层', '仓库A区', '仓库B区', '数据中心机房']

export function buildCheckItems(total, counted, seed) {
  const items = []
  for (let i = 0; i < total; i++) {
    let itemStatus = '未盘'
    let remark = ''
    let checker = ''
    let checkTime = ''
    if (i < counted) {
      itemStatus = '已盘'
      remark = '账实相符'
      checker = EMP_POOL[(i + seed) % EMP_POOL.length].name
      checkTime = `2026-09-${String(10 + (i % 8)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`
    } else if (i === counted && seed % 3 === 1) {
      itemStatus = '盘亏'
      remark = '现场未找到实物，待核销'
      checker = EMP_POOL[(i + seed) % EMP_POOL.length].name
      checkTime = `2026-09-${String(12 + (i % 6)).padStart(2, '0')} 15:30:00`
    } else if (i === counted && seed % 3 === 2) {
      itemStatus = '异常'
      remark = '编号标签破损，待补贴标签'
      checker = EMP_POOL[(i + seed) % EMP_POOL.length].name
      checkTime = `2026-09-${String(12 + (i % 6)).padStart(2, '0')} 16:10:00`
    }
    items.push({
      assetNo: `ZC2026${100 + seed * 13 + i}`,
      assetName: ASSET_NAME_POOL[(i + seed) % ASSET_NAME_POOL.length],
      assetStatus: ASSET_STATUS_POOL[(i + seed) % ASSET_STATUS_POOL.length],
      location: INV_LOCATION_POOL[(i + seed) % INV_LOCATION_POOL.length],
      itemStatus,
      remark,
      checker,
      createTime: `2026-09-0${(seed % 8) + 1} 10:00:00`,
      checkTime
    })
  }
  return items
}

export function buildCounters(n, doneCount, seed) {
  const list = []
  for (let i = 0; i < n; i++) {
    const e = EMP_POOL[(i + seed) % EMP_POOL.length]
    const assigned = 4 + (seed % 3)
    list.push({
      name: e.name,
      dept: e.dept,
      phone: e.phone,
      assigned,
      done: i < doneCount ? assigned : 0,
      status: i < doneCount ? '已完成' : '盘点中'
    })
  }
  return list
}

export function buildSeedInventoryDocs(companies = FIXED_ASSET_COMPANIES) {
  return [
    { id: 'IV1', docNo: 'PD202609001', name: '2026年三季度全面盘点', company: companies[0], applicant: '张志刚', scope: '全部资产', assetTypes: [], createTime: '2026-09-01 09:00:00', finishTime: '', remark: '季度例行全面盘点', status: '盘点中', items: buildCheckItems(24, 9, 1), counters: buildCounters(8, 0, 1) },
    { id: 'IV2', docNo: 'PD202608002', name: '车辆资产专项盘点', company: companies[1], applicant: '李秀兰', scope: '按资产类型', assetTypes: ['运输设备'], createTime: '2026-08-12 10:20:00', finishTime: '', remark: '车辆专项核查', status: '盘点报告审批中', items: buildCheckItems(6, 6, 2), counters: buildCounters(3, 2, 2) },
    { id: 'IV3', docNo: 'PD202607003', name: '2026年二季度全面盘点', company: companies[0], applicant: '王建军', scope: '全部资产', assetTypes: [], createTime: '2026-07-02 09:30:00', finishTime: '2026-07-20 16:40:00', remark: '账实核对完成', status: '已完结', items: buildCheckItems(30, 30, 3), counters: buildCounters(8, 8, 3) },
    { id: 'IV4', docNo: 'PD202606004', name: '仓库资产抽盘', company: companies[2], applicant: '赵晓梅', scope: '按存放地点', assetTypes: [], createTime: '2026-06-15 14:00:00', finishTime: '2026-06-25 11:20:00', remark: '仓库抽样盘点', status: '已完结', items: buildCheckItems(12, 12, 4), counters: buildCounters(4, 4, 4) },
    { id: 'IV5', docNo: 'PD202605005', name: '电子设备年度盘点', company: companies[3], applicant: '陈立新', scope: '按资产类型', assetTypes: ['电子设备'], createTime: '2026-05-08 09:10:00', finishTime: '', remark: '年度电子设备核查', status: '盘点中', items: buildCheckItems(18, 3, 5), counters: buildCounters(5, 1, 5) }
  ]
}
