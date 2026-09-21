// 长乐区国有资产经营管理系统 — 演示数据
// 所有数据均为原型演示用途

import { deriveAssetCategory } from './assetCategory'

// ===== 汇总报表数据 =====
export const summaryData = {
  2026: [
    { name: '城投集团', assets: 128, bookValue: 26.80, rented: 96, rentalRate: 75.0, idle: 21, idleRate: 16.4, cumReceivable: 0.8640, cumActual: 0.7910, yearReceivable: 0.2180, yearActual: 0.1760, newCert: 12, unCert: 9 },
    { name: '产投集团', assets: 86, bookValue: 15.42, rented: 63, rentalRate: 73.3, idle: 14, idleRate: 16.3, cumReceivable: 0.5120, cumActual: 0.4780, yearReceivable: 0.1320, yearActual: 0.1150, newCert: 6, unCert: 5 },
    { name: '水投集团', assets: 54, bookValue: 9.65, rented: 41, rentalRate: 75.9, idle: 8, idleRate: 14.8, cumReceivable: 0.2860, cumActual: 0.2640, yearReceivable: 0.0760, yearActual: 0.0690, newCert: 4, unCert: 3 },
    { name: '领航公司', assets: 32, bookValue: 4.28, rented: 24, rentalRate: 75.0, idle: 5, idleRate: 15.6, cumReceivable: 0.1540, cumActual: 0.1480, yearReceivable: 0.0410, yearActual: 0.0395, newCert: 2, unCert: 4 }
  ],
  2025: [
    { name: '城投集团', assets: 124, bookValue: 26.10, rented: 93, rentalRate: 75.0, idle: 20, idleRate: 16.1, cumReceivable: 0.6460, cumActual: 0.6150, yearReceivable: 0.1960, yearActual: 0.1710, newCert: 10, unCert: 12 },
    { name: '产投集团', assets: 84, bookValue: 15.05, rented: 61, rentalRate: 72.6, idle: 14, idleRate: 16.7, cumReceivable: 0.3800, cumActual: 0.3700, yearReceivable: 0.1210, yearActual: 0.1080, newCert: 5, unCert: 6 },
    { name: '水投集团', assets: 52, bookValue: 9.40, rented: 39, rentalRate: 75.0, idle: 8, idleRate: 15.4, cumReceivable: 0.2100, cumActual: 0.2000, yearReceivable: 0.0700, yearActual: 0.0640, newCert: 3, unCert: 4 },
    { name: '领航公司', assets: 30, bookValue: 4.05, rented: 22, rentalRate: 73.3, idle: 5, idleRate: 16.7, cumReceivable: 0.1150, cumActual: 0.1120, yearReceivable: 0.0380, yearActual: 0.0360, newCert: 1, unCert: 4 }
  ]
}

export function getSummary(year) {
  const data = summaryData[year] || summaryData[2026]
  const total = {
    name: '合计',
    assets: 0, bookValue: 0, rented: 0, idle: 0,
    cumReceivable: 0, cumActual: 0, yearReceivable: 0, yearActual: 0,
    newCert: 0, unCert: 0
  }
  data.forEach(r => {
    total.assets += r.assets
    total.bookValue += r.bookValue
    total.rented += r.rented
    total.idle += r.idle
    total.cumReceivable += r.cumReceivable
    total.cumActual += r.cumActual
    total.yearReceivable += r.yearReceivable
    total.yearActual += r.yearActual
    total.newCert += r.newCert
    total.unCert += r.unCert
  })
  total.bookValue = Math.round(total.bookValue * 100) / 100
  total.rentalRate = Math.round(total.rented / total.assets * 1000) / 10
  total.idleRate = Math.round(total.idle / total.assets * 1000) / 10
  total.cumReceivable = Math.round(total.cumReceivable * 10000) / 10000
  total.cumActual = Math.round(total.cumActual * 10000) / 10000
  total.yearReceivable = Math.round(total.yearReceivable * 10000) / 10000
  total.yearActual = Math.round(total.yearActual * 10000) / 10000
  return { rows: data, total }
}

// ===== 城投集团资产明细 =====
const groupList = ['城投集团', '产投集团', '水投集团', '领航公司']

const detailedAssets = [
  { id: 'CT-001', name: '吴航街道商业街 A-01 商铺', location: '吴航街道', type: '商铺', status: '已出租', area: 320, bookValue: 1860, annualRent: 42, certStatus: '已办证', certDetail: '闽(2020)长乐区不动产权第0012345号', group: '城投集团', assetCategory: '房产类', propertyRight: '有不动产证', assetUsage: '商铺', sourceType: '自购', acquisitionMethod: '自购' },
  { id: 'CT-002', name: '航城商务楼 3F', location: '航城街道', type: '写字楼', status: '已出租', area: 1200, bookValue: 5400, annualRent: 156, certStatus: '已办证', certDetail: '闽(2019)长乐区不动产权第0023456号', group: '产投集团', assetCategory: '房产类', propertyRight: '两证齐全', assetUsage: '写字楼', sourceType: '自购', acquisitionMethod: '自购' },
  { id: 'CT-003', name: '营前标准厂房 2#', location: '营前街道', type: '厂房', status: '已出租', area: 3600, bookValue: 2180, annualRent: 78, certStatus: '已办证', certDetail: '闽(2018)长乐区不动产权第0034567号', group: '水投集团', assetCategory: '房产类', propertyRight: '有不动产证', assetUsage: '厂房', sourceType: '自建', acquisitionMethod: '自建' },
  { id: 'CT-004', name: '首占新区保障房 1# 楼', location: '首占新区', type: '保障房', status: '部分出租', area: 4800, bookValue: 6200, annualRent: 96, certStatus: '已办证', certDetail: '闽(2021)长乐区不动产权第0045678号', group: '领航公司', assetCategory: '房产类', propertyRight: '有证', assetUsage: '住宅', sourceType: '自建', acquisitionMethod: '自建' },
  { id: 'CT-005', name: '江田镇仓储用地', location: '江田镇', type: '仓储/土地', status: '闲置', area: 12000, bookValue: 3100, annualRent: null, certStatus: '未办证（办理中）', certDetail: '', group: '城投集团', assetCategory: '土地类', propertyRight: '无证', assetUsage: '仓储', sourceType: '划拨', acquisitionMethod: '划拨' },
  { id: 'CT-006', name: '玉田镇旧工业厂房', location: '玉田镇', type: '厂房', status: '闲置', area: 2400, bookValue: 890, annualRent: null, certStatus: '未办证（未启动）', certDetail: '', group: '产投集团', assetCategory: '房产类', propertyRight: '无证', assetUsage: '厂房', sourceType: '自建', acquisitionMethod: '自建' },
  { id: 'CT-007', name: '吴航农贸市场', location: '吴航街道', type: '农贸市场', status: '已出租', area: 2100, bookValue: 1650, annualRent: 68, certStatus: '已办证', certDetail: '闽(2019)长乐区不动产权第0056789号', group: '水投集团', assetCategory: '房产类', propertyRight: '有不动产证', assetUsage: '商铺', sourceType: '自购', acquisitionMethod: '自购' },
  { id: 'CT-008', name: '梅花镇综合楼', location: '梅花镇', type: '综合用房', status: '自用', area: 1500, bookValue: 720, annualRent: null, certStatus: '已办证', certDetail: '闽(2020)长乐区不动产权第0067890号', group: '领航公司', assetCategory: '房产类', propertyRight: '两证齐全', assetUsage: '写字楼', sourceType: '自建', acquisitionMethod: '自建' }
]

// 台账另有 7 个分类页签（运输设备/矿产资源/公共设备/长期股权投资/特殊特种行业/经营权/特殊动植物），
// 房产类种子覆盖不到，这里补一批非房产类资产，保证每个页签都有可查的数据。
const specialtyAssets = [
  { id: 'CT-201', name: '城投集团公务车 闽A·D1234', location: '吴航街道', type: '车辆', status: '自用', area: 0, bookValue: 28, annualRent: null, certStatus: '已办证', certDetail: '闽(2022)机动车登记证书第0123456号', group: '城投集团', assetCategory: '运输设备', propertyRight: '两证齐全', assetUsage: '车辆', sourceType: '购入', acquisitionMethod: '自购' },
  { id: 'CT-202', name: '漳港港区货运车 闽A·T5678', location: '漳港街道', type: '车辆', status: '已出租', area: 0, bookValue: 35, annualRent: 9, certStatus: '已办证', certDetail: '闽(2021)机动车登记证书第0234567号', group: '产投集团', assetCategory: '运输设备', propertyRight: '有不动产证', assetUsage: '车辆', sourceType: '购入', acquisitionMethod: '自购' },
  { id: 'CT-203', name: '梅花镇渔业执法船“长渔01”', location: '梅花镇', type: '船舶', status: '自用', area: 0, bookValue: 120, annualRent: null, certStatus: '已办证', certDetail: '闽(2020)船舶登记第0345678号', group: '水投集团', assetCategory: '运输设备', propertyRight: '两证齐全', assetUsage: '船舶', sourceType: '自建', acquisitionMethod: '自建' },
  { id: 'CT-204', name: '吴航街道地下车位（12 个）', location: '吴航街道', type: '车位', status: '闲置', area: 420, bookValue: 96, annualRent: null, certStatus: '未办证（办理中）', certDetail: '', group: '城投集团', assetCategory: '运输设备', propertyRight: '无证', assetUsage: '车位', sourceType: '划入', acquisitionMethod: '划拨' },
  { id: 'CT-205', name: '航城街道建筑用砂矿采矿权', location: '航城街道', type: '采矿权', status: '已出租', area: 0, bookValue: 860, annualRent: 45, certStatus: '已办证', certDetail: '闽C采许(2021)第0456789号', group: '城投集团', assetCategory: '矿产资源类', propertyRight: '有不动产证', assetUsage: '矿权', sourceType: '划拨', acquisitionMethod: '划拨' },
  { id: 'CT-206', name: '江田镇地热探矿权', location: '江田镇', type: '探矿权', status: '闲置', area: 0, bookValue: 210, annualRent: null, certStatus: '未办证（未启动）', certDetail: '', group: '产投集团', assetCategory: '矿产资源类', propertyRight: '无证', assetUsage: '矿权', sourceType: '划入', acquisitionMethod: '划拨' },
  { id: 'CT-207', name: '城区垃圾分类转运站设备（3 座）', location: '首占新区', type: '公共设备', status: '自用', area: 360, bookValue: 240, annualRent: null, certStatus: '已办证', certDetail: '闽(2022)长乐区公共设施登记第0567890号', group: '城投集团', assetCategory: '公共设备类', propertyRight: '两证齐全', assetUsage: '公共设施', sourceType: '自筹建设', acquisitionMethod: '自建' },
  { id: 'CT-208', name: '智慧停车充电桩批次一（48 台）', location: '航城街道', type: '公共设备', status: '已出租', area: 0, bookValue: 150, annualRent: 18, certStatus: '已办证', certDetail: '闽(2023)长乐区公共设施登记第0678901号', group: '领航公司', assetCategory: '公共设备类', propertyRight: '有证', assetUsage: '公共设施', sourceType: '投资建设', acquisitionMethod: '自建' },
  { id: 'CT-209', name: '首占新区社区健身器材一批', location: '首占新区', type: '公共设备', status: '自用', area: 0, bookValue: 26, annualRent: null, certStatus: '未办证（办理中）', certDetail: '', group: '水投集团', assetCategory: '公共设备类', propertyRight: '无证', assetUsage: '公共设施', sourceType: '移交资产', acquisitionMethod: '划拨' },
  { id: 'CT-210', name: '福州长乐汇通建设股份有限公司 12% 股权', location: '长乐区', type: '股权', status: '自用', area: 0, bookValue: 1500, annualRent: null, certStatus: '已办证', certDetail: '股权登记证第0789012号', group: '城投集团', assetCategory: '长期股权投资类', propertyRight: '两证齐全', assetUsage: '股权', sourceType: '股权合作', acquisitionMethod: '自购' },
  { id: 'CT-211', name: '长乐农商联合银行 3.5% 股权', location: '吴航街道', type: '股权', status: '自用', area: 0, bookValue: 980, annualRent: null, certStatus: '已办证', certDetail: '股权登记证第0890123号', group: '产投集团', assetCategory: '长期股权投资类', propertyRight: '有证', assetUsage: '股权', sourceType: '股权合作', acquisitionMethod: '自购' },
  { id: 'CT-212', name: '区间供水项目公司 20% 股权（待退出）', location: '文武砂街道', type: '股权', status: '闲置', area: 0, bookValue: 600, annualRent: null, certStatus: '未办证（办理中）', certDetail: '', group: '水投集团', assetCategory: '长期股权投资类', propertyRight: '无证', assetUsage: '股权', sourceType: '股权合作', acquisitionMethod: '自购' },
  { id: 'CT-213', name: '玉田镇公益性公墓及殡葬服务设施', location: '玉田镇', type: '特种行业', status: '自用', area: 5200, bookValue: 430, annualRent: null, certStatus: '已办证', certDetail: '闽(2019)长乐区特种行业许可第0901234号', group: '城投集团', assetCategory: '特殊特种行业类', propertyRight: '两证齐全', assetUsage: '特种设施', sourceType: '投资建设', acquisitionMethod: '自建' },
  { id: 'CT-214', name: '文武砂危化品专用仓库', location: '文武砂街道', type: '特种行业', status: '已出租', area: 1800, bookValue: 260, annualRent: 32, certStatus: '已办证', certDetail: '闽(2020)长乐区特种行业许可第1012345号', group: '水投集团', assetCategory: '特殊特种行业类', propertyRight: '有不动产证', assetUsage: '仓储', sourceType: '自建', acquisitionMethod: '自建' },
  { id: 'CT-215', name: '城区户外广告设置经营权（3 年期）', location: '吴航街道', type: '特许经营权', status: '已出租', area: 0, bookValue: 180, annualRent: 60, certStatus: '已办证', certDetail: '长城管广字(2024)第1123456号', group: '领航公司', assetCategory: '经营权类资产', propertyRight: '有证', assetUsage: '广告位', sourceType: '移交资产', acquisitionMethod: '划拨' },
  { id: 'CT-216', name: '鹤上镇公交线路运营权', location: '鹤上镇', type: '特许经营权', status: '已出租', area: 0, bookValue: 320, annualRent: 88, certStatus: '已办证', certDetail: '闽交运字(2023)第1234567号', group: '城投集团', assetCategory: '经营权类资产', propertyRight: '两证齐全', assetUsage: '运营权', sourceType: '划入', acquisitionMethod: '划拨' },
  { id: 'CT-217', name: '潭头镇珍稀苗木繁育基地（12 亩）', location: '古槐镇', type: '特殊动植物', status: '已出租', area: 8000, bookValue: 75, annualRent: 6, certStatus: '未办证（办理中）', certDetail: '', group: '产投集团', assetCategory: '特殊动植物类', propertyRight: '无证', assetUsage: '林地', sourceType: '托管', acquisitionMethod: '划拨' },
  { id: 'CT-218', name: '文武砂对虾育苗棚及种质资源', location: '文武砂街道', type: '特殊动植物', status: '闲置', area: 2600, bookValue: 48, annualRent: null, certStatus: '未办证（未启动）', certDetail: '', group: '水投集团', assetCategory: '特殊动植物类', propertyRight: '无证', assetUsage: '养殖设施', sourceType: '自建', acquisitionMethod: '自建' }
]

function generateAssets() {
  const assets = [...detailedAssets, ...specialtyAssets]
  const rentedLocations = ['吴航街道', '航城街道', '营前街道', '首占新区', '鹤上镇', '古槐镇', '文武砂街道', '漳港街道', '湖南镇', '文武砂街道']
  const rentedTypes = ['商铺', '写字楼', '厂房', '保障房', '仓储', '综合用房', '农贸市场', '写字楼', '商铺', '厂房']
  const rentedNames = ['街铺', '办公楼', '标准厂房', '综合楼', '仓储中心', '商务楼', '市场', '创业园', '商铺', '加工车间']
  const propertyRights = ['有不动产证', '两证齐全', '有证', '有不动产证', '两证齐全']
  const assetUsages = ['商铺', '写字楼', '厂房', '住宅', '公寓', '园区', '写字楼', '商铺', '厂房', '仓储']
  const sourceTypes = ['自购', '自建', '划拨']
  const acquisitionMethods = ['自购', '自建', '划拨']

  for (let i = 9; i <= 96; i++) {
    const loc = rentedLocations[(i - 9) % rentedLocations.length]
    const tp = rentedTypes[(i - 9) % rentedTypes.length]
    const nm = rentedNames[(i - 9) % rentedNames.length]
    const area = 200 + ((i * 137) % 4800)
    const bv = 500 + ((i * 89) % 5500)
    const rent = 20 + ((i * 13) % 180)
    assets.push({
      id: `CT-${String(i).padStart(3, '0')}`,
      name: `${loc}${nm} ${String.fromCharCode(65 + (i % 6))}-${i}`,
      location: loc, type: tp, status: '已出租', area,
      bookValue: bv, annualRent: rent,
      certStatus: i <= 87 ? '已办证' : '未办证（办理中）',
      certDetail: i <= 87 ? `闽(2020)长乐区不动产权第${String(100000 + i).padStart(7, '0')}号` : '',
      group: groupList[(i - 9) % 4],
      assetCategory: deriveAssetCategory(tp),
      propertyRight: i <= 87 ? propertyRights[i % propertyRights.length] : '无证',
      assetUsage: assetUsages[i % assetUsages.length],
      sourceType: sourceTypes[i % sourceTypes.length],
      acquisitionMethod: acquisitionMethods[i % acquisitionMethods.length]
    })
  }

  const idleLocations = ['江田镇', '玉田镇', '鹤上镇', '古槐镇', '首占新区', '营前街道', '漳港街道', '梅花镇', '文武砂街道', '湖南镇', '航城街道', '江田镇', '玉田镇', '鹤上镇', '古槐镇', '首占新区', '营前街道', '漳港街道', '梅花镇', '文武砂街道', '湖南镇']
  const idleTypes = ['厂房', '仓储/土地', '厂房', '综合用房', '商铺', '写字楼', '厂房', '仓储/土地', '综合用房', '厂房', '商铺', '厂房', '仓储/土地', '综合用房', '厂房', '写字楼', '厂房', '仓储/土地', '综合用房', '商铺', '厂房']
  for (let i = 0; i < 21; i++) {
    const idx = 97 + i
    const hasUncert = i < 7
    const certStatus = hasUncert ? (i < 3 ? '未办证（办理中）' : '未办证（未启动）') : '已办证'
    assets.push({
      id: `CT-${String(idx).padStart(3, '0')}`,
      name: `${idleLocations[i]}闲置${idleTypes[i] === '仓储/土地' ? '用地' : idleTypes[i]} ${i + 1}#`,
      location: idleLocations[i], type: idleTypes[i], status: '闲置',
      area: 800 + ((i * 311) % 10000), bookValue: 300 + ((i * 73) % 3000),
      annualRent: null, certStatus, certDetail: '',
      group: groupList[i % 4],
      assetCategory: idleTypes[i] === '仓储/土地' ? '土地类' : '房产类',
      propertyRight: certStatus === '已办证' ? '有证' : '无证',
      assetUsage: idleTypes[i] === '仓储/土地' ? '仓储' : '厂房',
      sourceType: '自建',
      acquisitionMethod: '自建'
    })
  }

  const selfLocations = ['梅花镇', '吴航街道', '航城街道', '营前街道', '首占新区', '鹤上镇', '古槐镇', '江田镇', '玉田镇', '漳港街道', '文武砂街道']
  const selfTypes = ['综合用房', '办公楼', '综合用房', '厂房', '办公楼', '综合用房', '厂房', '综合用房', '办公楼', '综合用房', '厂房']
  for (let i = 0; i < 11; i++) {
    const idx = 118 + i
    assets.push({
      id: `CT-${String(idx).padStart(3, '0')}`,
      name: `${selfLocations[i]}自用${selfTypes[i]} ${i + 1}#`,
      location: selfLocations[i], type: selfTypes[i], status: '自用',
      area: 500 + ((i * 223) % 3000), bookValue: 200 + ((i * 51) % 2000),
      annualRent: null, certStatus: '已办证',
      certDetail: `闽(2021)长乐区不动产权第${String(200000 + i).padStart(7, '0')}号`,
      group: groupList[i % 4],
      assetCategory: '房产类',
      propertyRight: '两证齐全',
      assetUsage: selfTypes[i] === '办公楼' ? '写字楼' : '厂房',
      sourceType: '自建',
      acquisitionMethod: '自建'
    })
  }

  return assets
}

export const chengtouAssets = generateAssets()

// ===== 合同数据 =====
export const contracts = [
  { id: 'HT-2023-018', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', tenant: '福州××商业管理有限公司', startDate: '2023-05-01', endDate: '2028-04-30', leaseArea: 320, annualRent: 42, status: '欠缴', arrears: 10.5, overdueDays: 45, increment: '每年递增3%', deposit: 8.4, electronic: true },
  { id: 'HT-2025-006', assetId: 'CT-002', assetName: '航城商务楼 3F', tenant: '福建××科技有限公司', startDate: '2025-01-01', endDate: '2027-12-31', leaseArea: 1200, annualRent: 156, status: '正常', arrears: 0, overdueDays: 0, increment: '每三年递增5%', deposit: 31.2, electronic: true },
  { id: 'HT-2024-007', assetId: 'CT-003', assetName: '营前标准厂房 2#', tenant: '长乐××物流有限公司', startDate: '2024-03-01', endDate: '2026-09-30', leaseArea: 3600, annualRent: 78, status: '临期', arrears: 0, overdueDays: 0, increment: '无递增', deposit: 15.6, electronic: false },
  { id: 'HT-2024-012', assetId: 'CT-004', assetName: '首占新区保障房 1# 楼', tenant: '长乐××物业管理有限公司', startDate: '2024-06-01', endDate: '2029-05-31', leaseArea: 1800, annualRent: 96, status: '正常', arrears: 0, overdueDays: 0, increment: '每年递增2%', deposit: 19.2, electronic: true },
  { id: 'HT-2024-015', assetId: 'CT-007', assetName: '吴航农贸市场', tenant: '长乐××市场管理有限公司', startDate: '2024-01-01', endDate: '2028-12-31', leaseArea: 2100, annualRent: 68, status: '正常', arrears: 0, overdueDays: 0, increment: '每两年递增5%', deposit: 13.6, electronic: true }
]

// 部分租赁：同一资产可被多份合同分次租出，剩余面积继续可租
export function leaseSummary(asset) {
  const total = asset.area || 0
  const list = contracts.filter(c => c.assetId === asset.id && c.status !== '已终止' && c.status !== '退租')
  if (!list.length) {
    const occupied = asset.status === '已出租' || asset.status === '自用'
    return { leasedArea: occupied ? total : 0, availableArea: occupied ? 0 : total, contracts: [] }
  }
  const leasedArea = Math.round(list.reduce((s, c) => s + (c.leaseArea || total), 0) * 100) / 100
  return { leasedArea, availableArea: Math.max(0, Math.round((total - leasedArea) * 100) / 100), contracts: list }
}

// ===== 收费台账 =====
// payments 是逐笔收缴流水，看板的「近一年每月实收」与「上月收费率」都由它汇总而来；
// 运行期在收费大厅缴费时会继续追加，cumActual / yearActual 是它的累计口径。
export const feeRecords = [
  { id: 1, contractId: 'HT-2023-018', assetName: '吴航街道商业街 A-01 商铺', tenant: '福州××商业管理有限公司', cumReceivable: 63, cumActual: 52.5, yearReceivable: 21, yearActual: 10.5, arrears: 10.5, status: '欠缴', payments: [{ date: '2025-10-05', amount: 21 }, { date: '2025-11-05', amount: 21 }, { date: '2026-03-05', amount: 3.5 }, { date: '2026-06-05', amount: 3.5 }, { date: '2026-09-05', amount: 3.5 }] },
  { id: 2, contractId: 'HT-2025-006', assetName: '航城商务楼 3F', tenant: '福建××科技有限公司', cumReceivable: 156, cumActual: 117, yearReceivable: 156, yearActual: 117, arrears: 0, status: '正常', payments: [{ date: '2026-01-10', amount: 39 }, { date: '2026-04-10', amount: 39 }, { date: '2026-07-10', amount: 39 }] },
  { id: 3, contractId: 'HT-2024-007', assetName: '营前标准厂房 2#', tenant: '长乐××物流有限公司', cumReceivable: 136.5, cumActual: 130, yearReceivable: 58.5, yearActual: 52, arrears: 0, status: '正常', payments: [{ date: '2025-10-08', amount: 39 }, { date: '2025-11-08', amount: 39 }, { date: '2026-02-08', amount: 26 }, { date: '2026-05-08', amount: 26 }] },
  { id: 4, contractId: 'HT-2024-012', assetName: '首占新区保障房 1# 楼', tenant: '长乐××物业管理有限公司', cumReceivable: 144, cumActual: 136.8, yearReceivable: 48, yearActual: 45.6, arrears: 0, status: '正常', payments: [{ date: '2025-10-15', amount: 45.6 }, { date: '2025-11-15', amount: 45.6 }, { date: '2026-03-15', amount: 15.2 }, { date: '2026-06-15', amount: 15.2 }, { date: '2026-09-15', amount: 15.2 }] },
  { id: 5, contractId: 'HT-2024-015', assetName: '吴航农贸市场', tenant: '长乐××市场管理有限公司', cumReceivable: 136, cumActual: 129.2, yearReceivable: 68, yearActual: 64.6, arrears: 0, status: '正常', payments: [{ date: '2025-10-20', amount: 32.3 }, { date: '2025-11-20', amount: 32.3 }, { date: '2026-01-20', amount: 21.5 }, { date: '2026-04-20', amount: 21.5 }, { date: '2026-07-20', amount: 21.6 }] }
]

// ===== 资产变更留痕（历史基线，运行期变更由 changeLog store 追加）=====
export const changeLogSeeds = [
  { id: 'seed-1', date: '2023-05-01', time: '2023-05-01 09:20:00', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', module: '合同', type: '合同签约', before: '—', after: 'HT-2023-018 福州××商业管理有限公司', operator: '陈××' },
  { id: 'seed-2', date: '2023-04-12', time: '2023-04-12 10:05:00', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', module: '资产', type: '用途变更', before: '空置', after: '商铺出租', operator: '陈××' },
  { id: 'seed-3', date: '2020-06-15', time: '2020-06-15 08:30:00', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', module: '资产', type: '入库登记', before: '—', after: '自购入库', operator: '陈××' },
  { id: 'seed-4', date: '2024-12-20', time: '2024-12-20 15:40:00', assetId: 'CT-002', assetName: '航城商务楼 3F', module: '资产', type: '入库登记', before: '—', after: '自建入库', operator: '林××' },
  { id: 'seed-5', date: '2025-01-01', time: '2025-01-01 09:10:00', assetId: 'CT-002', assetName: '航城商务楼 3F', module: '合同', type: '合同签约', before: '—', after: 'HT-2025-006 福建××科技有限公司', operator: '林××' },
  { id: 'seed-6', date: '2024-03-01', time: '2024-03-01 11:00:00', assetId: 'CT-003', assetName: '营前标准厂房 2#', module: '合同', type: '合同签约', before: '—', after: 'HT-2024-007 长乐××物流有限公司', operator: '王××' }
]

// ===== 预警数据（全区口径）=====
export const warnings = {
  arrears: { total: 12, byGroup: { '城投集团': 5, '产投集团': 3, '水投集团': 2, '领航公司': 2 } },
  idle: { total: 8, byGroup: { '城投集团': 3, '产投集团': 2, '水投集团': 2, '领航公司': 1 } },
  uncert: { total: 21, byGroup: { '城投集团': 9, '产投集团': 5, '水投集团': 3, '领航公司': 4 } },
  expiring: { total: 5, byGroup: { '城投集团': 1, '产投集团': 2, '水投集团': 1, '领航公司': 1 } }
}

export const warningList = [
  { id: 'W001', type: '欠费', group: '城投集团', asset: 'CT-001 商铺', desc: '欠缴 10.5 万元，逾期 45 天', days: 45, amount: 10.5 },
  { id: 'W002', type: '欠费', group: '城投集团', asset: 'CT-015 写字楼', desc: '欠缴 8.2 万元，逾期 30 天', days: 30, amount: 8.2 },
  { id: 'W003', type: '欠费', group: '城投集团', asset: 'CT-022 商铺', desc: '欠缴 5.6 万元，逾期 22 天', days: 22, amount: 5.6 },
  { id: 'W004', type: '闲置超期', group: '城投集团', asset: 'CT-006 玉田镇旧工业厂房', desc: '空置 420 天，超阈值 365 天', days: 420, amount: null },
  { id: 'W005', type: '闲置超期', group: '城投集团', asset: 'CT-097 江田镇闲置用地', desc: '空置 380 天，超阈值 365 天', days: 380, amount: null },
  { id: 'W006', type: '未办证', group: '城投集团', asset: 'CT-005 江田镇仓储用地', desc: '未办证，办理中', days: null, amount: null },
  { id: 'W007', type: '未办证', group: '城投集团', asset: 'CT-006 玉田镇旧工业厂房', desc: '未办证，超 12 个月未启动', days: null, amount: null },
  { id: 'W008', type: '合同临期', group: '城投集团', asset: 'CT-003 营前标准厂房 2#', desc: '合同 2026-09-30 到期', days: null, amount: null },
  { id: 'W009', type: '欠费', group: '产投集团', asset: 'CT-201 商铺', desc: '欠缴 12.3 万元，逾期 60 天', days: 60, amount: 12.3 },
  { id: 'W010', type: '闲置超期', group: '产投集团', asset: 'CT-210 旧厂房', desc: '空置 400 天，超阈值 365 天', days: 400, amount: null },
  { id: 'W011', type: '欠费', group: '水投集团', asset: 'CT-301 办公楼', desc: '欠缴 6.8 万元，逾期 35 天', days: 35, amount: 6.8 },
  { id: 'W012', type: '未办证', group: '领航公司', asset: 'CT-401 仓储用地', desc: '未办证，办理中', days: null, amount: null }
]

// ===== 督办单 =====
export const superviseOrders = [
  {
    id: 'DB-2026-009', group: '城投集团', type: '闲置盘活',
    reason: '闲置率 16.4% 偏高，请于 9 月 30 日前报送闲置资产盘活方案',
    deadline: '2026-09-30', contact: '陈××', phone: '138××××1234',
    status: '待确认',
    timeline: [
      { time: '2026-08-15 09:30', action: '发起督办', operator: '林××（国资中心运营科）' },
      { time: '2026-08-15 14:20', action: '企业已接收', operator: '陈××（城投集团）' },
      { time: '2026-08-28 16:45', action: '整改反馈：已完成 6 宗闲置资产挂牌招租，剩余方案 9 月 25 日前报送', operator: '陈××（城投集团）' }
    ]
  },
  {
    id: 'DB-2026-014', group: '城投集团', type: '未办证推进',
    reason: '未办证资产 9 宗，其中 2 宗超 12 个月未启动，请加快推进',
    deadline: '2026-10-15', contact: '陈××', phone: '138××××1234',
    status: '待处理',
    timeline: [
      { time: '2026-09-10 10:00', action: '发起督办', operator: '林××（国资中心运营科）' }
    ]
  },
  {
    id: 'DB-2026-005', group: '产投集团', type: '欠费催缴',
    reason: '累计欠费 15.8 万元，请加强催缴力度',
    deadline: '2026-09-15', contact: '王××', phone: '139××××5678',
    status: '已办结',
    timeline: [
      { time: '2026-07-20 09:00', action: '发起督办', operator: '林××（国资中心运营科）' },
      { time: '2026-07-20 15:30', action: '企业已接收', operator: '王××（产投集团）' },
      { time: '2026-08-10 11:20', action: '整改反馈：已对欠费企业发送催缴函 3 份，收回欠款 10 万元', operator: '王××（产投集团）' },
      { time: '2026-08-15 09:45', action: '确认办结', operator: '林××（国资中心运营科）' }
    ]
  }
]

// ===== 企业联系方式 =====
export const contacts = [
  { group: '城投集团', contact: '陈××', title: '资产管理部 经理', phone: '13812341234', email: 'chen.xx@chengtou.com', address: '长乐区吴航街道胜利路 88 号' },
  { group: '产投集团', contact: '王××', title: '资产管理部 副经理', phone: '13912345678', email: 'wang.xx@chantou.com', address: '长乐区航城街道会堂路 66 号' },
  { group: '水投集团', contact: '李××', title: '资产管理部 主管', phone: '13712345678', email: 'li.xx@shuitou.com', address: '长乐区营前街道营前路 168 号' },
  { group: '领航公司', contact: '张××', title: '综合管理部 经理', phone: '13612345678', email: 'zhang.xx@linghang.com', address: '长乐区首占新区鹏城路 99 号' }
]

// ===== 权证数据 =====
export const certRecords = chengtouAssets
  .filter(a => a.certStatus !== '已办证')
  .map(a => ({
    assetId: a.id,
    assetName: a.name,
    location: a.location,
    certStatus: a.certStatus,
    progress: a.certStatus.includes('办理中') ? '材料准备中，预计 2 个月内完成' : '待启动，需协调相关部门',
    remark: ''
  }))

// ===== 催缴记录 =====
export const urgeRecords = [
  { id: 1, assetId: 'CT-001', time: '2026-08-20 10:30', method: '短信 + 站内消息', content: '尊敬的福州××商业管理有限公司，您有 10.5 万元租金已逾期 45 天，请尽快缴纳。', operator: '资产管理员', result: '已发送' },
  { id: 2, assetId: 'CT-001', time: '2026-07-15 09:00', method: '电话催缴', content: '电话沟通，对方承诺 8 月底前缴纳', operator: '资产管理员', result: '已沟通' },
  { id: 3, assetId: 'CT-001', time: '2026-06-30 14:00', method: '书面催缴函', content: '正式催缴函，要求 30 日内缴清欠款', operator: '资产管理员', result: '已送达' }
]

// ===== 12大资产分类 =====
export const assetCategories = [
  { id: 1, name: '房产类', count: 6542, area: 1286400, description: '住宅、商业、办公用房' },
  { id: 2, name: '土地类', count: 86, area: 524000, description: '建设用地、农用地等' },
  { id: 3, name: '经营类房屋店铺', count: 342, area: 68400, description: '商铺、门面房' },
  { id: 4, name: '农贸市场', count: 18, area: 36000, description: '市场摊位、商铺' },
  { id: 5, name: '运输设备', count: 124, area: 0, description: '车辆、船舶等' },
  { id: 6, name: '矿产资源类', count: 5, area: 0, description: '采矿权、探矿权' },
  { id: 7, name: '公共设备类', count: 267, area: 0, description: '公共设施、设备' },
  { id: 8, name: '长期股权投资类', count: 32, area: 0, description: '股权投资资产' },
  { id: 9, name: '经营性生产设备类', count: 89, area: 0, description: '生产线、机器设备' },
  { id: 10, name: '特殊特种行业类', count: 12, area: 0, description: '特种行业资产' },
  { id: 11, name: '经营权类资产', count: 8, area: 0, description: '特许经营权' },
  { id: 12, name: '特殊动植物类', count: 3, area: 0, description: '珍稀动植物资产' }
]


// 本地占位图（离线可用）：按 seed 生成不同渐变的 SVG data-URI
const __imgCache = {}
function localImage(seed) {
  if (__imgCache[seed]) return __imgCache[seed]
  const palette = [
    ['#667eea', '#764ba2'], ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'], ['#30cfd0', '#330867'], ['#f6d365', '#fda085'],
    ['#84fab0', '#8fd3f4'], ['#e0c3fc', '#8ec5fc'], ['#f093fb', '#f5576c'],
    ['#fddb92', '#d1fdff'], ['#a8edea', '#fed6e3'], ['#ff9a9e', '#fecfef']
  ]
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [c1, c2] = palette[h % palette.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="200" fill="url(#g)"/></svg>`
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
  __imgCache[seed] = uri
  return uri
}

// ===== 建筑层级结构（项目-分区-楼层-房间）=====
export const buildingHierarchy = [
  {
    id: 'BLD-001', name: '红联壹城', type: '住宅项目', group: '城投集团',
    totalAssets: 15, totalArea: 5463.68, rentedCount: 8, idleCount: 7,
    rentalRate: 83.09, cumIncome: 313.45, yearIncome: 313.45,
    address: '浦口区桥林街道浦口大道中桥壹城红寓小区',
    image: localImage('honglian'),
    partitions: [
      {
        id: 'PART-001', name: 'C22#栋', area: 1936.6,
        floors: [
          {
            id: 'ZONE-001', name: '1F', area: 968.3,
            rooms: [
              { id: 'RM-001', name: '壹城红寓C22#101', assetNo: 'YC4LC22#101', area: 222.1, status: '已出租', leaseExpiry: '2027-02-25', hasPropertyRight: false, tenant: '南京××商贸有限公司', monthlyRent: 8800 },
              { id: 'RM-002', name: '壹城红寓C22#102', assetNo: 'YC4LC22#102', area: 186.5, status: '已出租', leaseExpiry: '2027-06-15', hasPropertyRight: false, tenant: '南京××餐饮管理', monthlyRent: 7200 },
              { id: 'RM-003', name: '壹城红寓C22#103', assetNo: 'YC4LC22#103', area: 210.3, status: '空置', leaseExpiry: null, hasPropertyRight: false, tenant: null, monthlyRent: 0, vacancyDays: 120 },
              { id: 'RM-004', name: '壹城红寓C22#104', assetNo: 'YC4LC22#104', area: 175.8, status: '已出租', leaseExpiry: '2026-12-31', hasPropertyRight: false, tenant: '南京××科技', monthlyRent: 6500 },
              { id: 'RM-005', name: '壹城红寓C22#105', assetNo: 'YC4LC22#105', area: 173.6, status: '空置', leaseExpiry: null, hasPropertyRight: false, tenant: null, monthlyRent: 0, vacancyDays: 200 }
            ]
          },
          {
            id: 'ZONE-002', name: '2F', area: 968.3,
            rooms: [
              { id: 'RM-006', name: '壹城红寓C22#201', assetNo: 'YC4LC22#201', area: 222.1, status: '已出租', leaseExpiry: '2027-09-05', hasPropertyRight: false, tenant: '南京××教育', monthlyRent: 9200 },
              { id: 'RM-007', name: '壹城红寓C22#202', assetNo: 'YC4LC22#202', area: 186.5, status: '已出租', leaseExpiry: '2027-03-20', hasPropertyRight: false, tenant: '南京××设计', monthlyRent: 7000 },
              { id: 'RM-008', name: '壹城红寓C22#203', assetNo: 'YC4LC22#203', area: 210.3, status: '空置', leaseExpiry: null, hasPropertyRight: false, tenant: null, monthlyRent: 0, vacancyDays: 95 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-002', name: '航站区资产', type: '交通枢纽', group: '产投集团',
    totalAssets: 5, totalArea: 12800, rentedCount: 1, idleCount: 4,
    rentalRate: 20.0, cumIncome: 48.0, yearIncome: 48.0,
    address: '长乐区漳港街道福州长乐国际机场',
    image: localImage('hangzhan'),
    partitions: [
      {
        id: 'PART-002', name: '航站楼A', area: 6400,
        floors: [
          {
            id: 'ZONE-003', name: '1F', area: 6400,
            rooms: [
              { id: 'RM-009', name: '航站楼A-101商业区', assetNo: 'HZQA101', area: 3200, status: '闲置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 365 },
              { id: 'RM-009B', name: '航站楼A-102问讯处', assetNo: 'HZQA102', area: 200, status: '已出租', leaseExpiry: '2028-06-30', hasPropertyRight: true, tenant: '福建××商旅', monthlyRent: 15000 }
            ]
          }
        ]
      },
      {
        id: 'PART-002B', name: '航站楼B', area: 6400,
        floors: [
          {
            id: 'ZONE-003B', name: '1F', area: 6400,
            rooms: [
              { id: 'RM-009C', name: '航站楼B-101', assetNo: 'HZQB101', area: 5000, status: '闲置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 400 },
              { id: 'RM-009D', name: '航站楼B-102设备间', assetNo: 'HZQB102', area: 1400, status: '自用', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-003', name: '安东大厦', type: '商业办公', group: '城投集团',
    totalAssets: 24, totalArea: 8640, rentedCount: 18, idleCount: 4, selfUsed: 2,
    rentalRate: 75.0, cumIncome: 528.6, yearIncome: 186.4,
    address: '长乐区吴航街道安东路88号',
    image: localImage('andong'),
    partitions: [
      {
        id: 'PART-003', name: '主楼A座', area: 2880,
        floors: [
          {
            id: 'ZONE-004', name: '5F', area: 1440,
            rooms: [
              { id: 'RM-010', name: '安东大厦516', assetNo: 'A00D516', area: 60, status: '已出租', leaseExpiry: '2028-12-31', hasPropertyRight: true, tenant: '江苏望风有限公司', monthlyRent: 1000 },
              { id: 'RM-011', name: '安东大厦517', assetNo: 'A00D517', area: 80, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '福州××贸易', monthlyRent: 1600 },
              { id: 'RM-012', name: '安东大厦518', assetNo: 'A00D518', area: 120, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 45 },
              { id: 'RM-013', name: '安东大厦519', assetNo: 'A00D519', area: 100, status: '已出租', leaseExpiry: '2027-09-15', hasPropertyRight: true, tenant: '长乐××咨询', monthlyRent: 2000 },
              { id: 'RM-014', name: '安东大厦520', assetNo: 'A00D520', area: 60, status: '自用', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0 }
            ]
          },
          {
            id: 'ZONE-005', name: '6F', area: 1440,
            rooms: [
              { id: 'RM-015', name: '安东大厦601', assetNo: 'A00D601', area: 200, status: '已出租', leaseExpiry: '2028-03-31', hasPropertyRight: true, tenant: '福建××律所', monthlyRent: 5000 },
              { id: 'RM-016', name: '安东大厦602', assetNo: 'A00D602', area: 150, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 180 },
              { id: 'RM-017', name: '安东大厦603', assetNo: 'A00D603', area: 180, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '南京××会计', monthlyRent: 4200 }
            ]
          }
        ]
      },
      {
        id: 'PART-003B', name: '裙楼B座', area: 5760,
        floors: [
          {
            id: 'ZONE-005B', name: '1F', area: 2880,
            rooms: [
              { id: 'RM-017B', name: '安东大厦B101商铺', assetNo: 'A00B101', area: 120, status: '已出租', leaseExpiry: '2027-08-31', hasPropertyRight: true, tenant: '长乐××便利店', monthlyRent: 4800 },
              { id: 'RM-017C', name: '安东大厦B102商铺', assetNo: 'A00B102', area: 85, status: '已出租', leaseExpiry: '2028-01-15', hasPropertyRight: true, tenant: '福州××烘焙', monthlyRent: 3500 }
            ]
          },
          {
            id: 'ZONE-005C', name: '2F', area: 2880,
            rooms: [
              { id: 'RM-017D', name: '安东大厦B201办公', assetNo: 'A00B201', area: 300, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '福建××建设', monthlyRent: 9000 },
              { id: 'RM-017E', name: '安东大厦B202办公', assetNo: 'A00B202', area: 200, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 60 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-004', name: '悦山小区', type: '住宅项目', group: '城投集团',
    totalAssets: 32, totalArea: 9600, rentedCount: 22, idleCount: 10,
    rentalRate: 68.75, cumIncome: 216.8, yearIncome: 86.4,
    address: '长乐区航城街道营前路与鹤上路交汇处',
    image: localImage('yueshan'),
    partitions: [
      {
        id: 'PART-004', name: '一栋', area: 2400,
        floors: [
          {
            id: 'ZONE-006', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-018', name: '悦山一栋101', assetNo: 'YSYD101', area: 95, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '林××', monthlyRent: 2800 },
              { id: 'RM-019', name: '悦山一栋102', assetNo: 'YSYD102', area: 88, status: '已出租', leaseExpiry: '2027-03-31', hasPropertyRight: true, tenant: '陈××', monthlyRent: 2600 },
              { id: 'RM-020', name: '悦山一栋103', assetNo: 'YSYD103', area: 110, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 75 },
              { id: 'RM-021', name: '悦山一栋104', assetNo: 'YSYD104', area: 76, status: '已出租', leaseExpiry: '2028-01-31', hasPropertyRight: true, tenant: '王××', monthlyRent: 2200 }
            ]
          },
          {
            id: 'ZONE-007', name: '2F', area: 1200,
            rooms: [
              { id: 'RM-022', name: '悦山一栋201', assetNo: 'YSYD201', area: 95, status: '已出租', leaseExpiry: '2027-09-30', hasPropertyRight: true, tenant: '张××', monthlyRent: 3000 },
              { id: 'RM-023', name: '悦山一栋202', assetNo: 'YSYD202', area: 88, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 150 },
              { id: 'RM-024', name: '悦山一栋203', assetNo: 'YSYD203', area: 110, status: '已出租', leaseExpiry: '2027-12-15', hasPropertyRight: true, tenant: '赵××', monthlyRent: 3200 }
            ]
          }
        ]
      },
      {
        id: 'PART-005', name: '二栋', area: 2400,
        floors: [
          {
            id: 'ZONE-008', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-025', name: '悦山二栋101', assetNo: 'YSED101', area: 100, status: '已出租', leaseExpiry: '2027-05-31', hasPropertyRight: true, tenant: '刘××', monthlyRent: 2900 },
              { id: 'RM-026', name: '悦山二栋102', assetNo: 'YSED102', area: 92, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 210 },
              { id: 'RM-027', name: '悦山二栋103', assetNo: 'YSED103', area: 85, status: '已出租', leaseExpiry: '2028-02-28', hasPropertyRight: true, tenant: '周××', monthlyRent: 2500 }
            ]
          },
          {
            id: 'ZONE-009', name: '2F', area: 1200,
            rooms: [
              { id: 'RM-028', name: '悦山二栋201', assetNo: 'YSED201', area: 100, status: '已出租', leaseExpiry: '2027-08-15', hasPropertyRight: true, tenant: '吴××', monthlyRent: 3100 },
              { id: 'RM-029', name: '悦山二栋202', assetNo: 'YSED202', area: 92, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 90 },
              { id: 'RM-030', name: '悦山二栋203', assetNo: 'YSED203', area: 85, status: '已出租', leaseExpiry: '2027-11-30', hasPropertyRight: true, tenant: '郑××', monthlyRent: 2400 }
            ]
          }
        ]
      },
      {
        id: 'PART-006', name: '三栋', area: 2400,
        floors: [
          {
            id: 'ZONE-010', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-031', name: '悦山三栋101', assetNo: 'YSSD101', area: 105, status: '已出租', leaseExpiry: '2027-04-30', hasPropertyRight: true, tenant: '孙××', monthlyRent: 3000 },
              { id: 'RM-032', name: '悦山三栋102', assetNo: 'YSSD102', area: 90, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 180 }
            ]
          }
        ]
      },
      {
        id: 'PART-007', name: '四栋', area: 2400,
        floors: [
          {
            id: 'ZONE-011', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-033', name: '悦山四栋101', assetNo: 'YSSD101B', area: 98, status: '已出租', leaseExpiry: '2027-07-31', hasPropertyRight: true, tenant: '黄××', monthlyRent: 2700 },
              { id: 'RM-034', name: '悦山四栋102', assetNo: 'YSSD102B', area: 88, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 240 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-005', name: '国子家缘', type: '住宅项目', group: '城投集团',
    totalAssets: 18, totalArea: 4860, rentedCount: 14, idleCount: 4,
    rentalRate: 77.78, cumIncome: 168.5, yearIncome: 72.0,
    address: '长乐区首占新区鹏城路国子家缘小区',
    image: localImage('guozi'),
    partitions: [
      {
        id: 'PART-008', name: '南区', area: 2430,
        floors: [
          {
            id: 'ZONE-012', name: '1F', area: 1215,
            rooms: [
              { id: 'RM-035', name: '国子家缘南101', assetNo: 'GZJY-N101', area: 120, status: '已出租', leaseExpiry: '2027-10-31', hasPropertyRight: true, tenant: '李××', monthlyRent: 3500 },
              { id: 'RM-036', name: '国子家缘南102', assetNo: 'GZJY-N102', area: 95, status: '已出租', leaseExpiry: '2028-03-15', hasPropertyRight: true, tenant: '何××', monthlyRent: 2800 },
              { id: 'RM-037', name: '国子家缘南103', assetNo: 'GZJY-N103', area: 110, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 60 }
            ]
          },
          {
            id: 'ZONE-013', name: '2F', area: 1215,
            rooms: [
              { id: 'RM-038', name: '国子家缘南201', assetNo: 'GZJY-N201', area: 120, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '郭××', monthlyRent: 3600 },
              { id: 'RM-039', name: '国子家缘南202', assetNo: 'GZJY-N202', area: 95, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '马××', monthlyRent: 2900 }
            ]
          }
        ]
      },
      {
        id: 'PART-009', name: '北区', area: 2430,
        floors: [
          {
            id: 'ZONE-014', name: '1F', area: 1215,
            rooms: [
              { id: 'RM-040', name: '国子家缘北101', assetNo: 'GZJY-B101', area: 115, status: '已出租', leaseExpiry: '2027-08-31', hasPropertyRight: true, tenant: '朱××', monthlyRent: 3400 },
              { id: 'RM-041', name: '国子家缘北102', assetNo: 'GZJY-B102', area: 100, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 130 },
              { id: 'RM-042', name: '国子家缘北103', assetNo: 'GZJY-B103', area: 108, status: '已出租', leaseExpiry: '2028-05-31', hasPropertyRight: true, tenant: '徐××', monthlyRent: 3200 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-006', name: '高沟第一街', type: '商业街区', group: '水投集团',
    totalAssets: 20, totalArea: 6400, rentedCount: 16, idleCount: 4,
    rentalRate: 80.0, cumIncome: 384.0, yearIncome: 156.0,
    address: '长乐区鹤上镇高沟第一街',
    image: localImage('gaogou'),
    partitions: [
      {
        id: 'PART-010', name: '东段', area: 3200,
        floors: [
          {
            id: 'ZONE-015', name: '1F', area: 3200,
            rooms: [
              { id: 'RM-043', name: '高沟第一街东01', assetNo: 'GGDYJ-D01', area: 80, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '长乐××小吃', monthlyRent: 3200 },
              { id: 'RM-044', name: '高沟第一街东02', assetNo: 'GGDYJ-D02', area: 120, status: '已出租', leaseExpiry: '2028-03-31', hasPropertyRight: true, tenant: '福州××超市', monthlyRent: 5500 },
              { id: 'RM-045', name: '高沟第一街东03', assetNo: 'GGDYJ-D03', area: 65, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 90 },
              { id: 'RM-046', name: '高沟第一街东04', assetNo: 'GGDYJ-D04', area: 90, status: '已出租', leaseExpiry: '2027-09-30', hasPropertyRight: true, tenant: '长乐××理发店', monthlyRent: 2800 },
              { id: 'RM-047', name: '高沟第一街东05', assetNo: 'GGDYJ-D05', area: 100, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '福建××药房', monthlyRent: 4000 }
            ]
          }
        ]
      },
      {
        id: 'PART-011', name: '西段', area: 3200,
        floors: [
          {
            id: 'ZONE-016', name: '1F', area: 3200,
            rooms: [
              { id: 'RM-048', name: '高沟第一街西01', assetNo: 'GGDYJ-X01', area: 110, status: '已出租', leaseExpiry: '2027-08-15', hasPropertyRight: true, tenant: '长乐××五金', monthlyRent: 3600 },
              { id: 'RM-049', name: '高沟第一街西02', assetNo: 'GGDYJ-X02', area: 75, status: '已出租', leaseExpiry: '2028-01-31', hasPropertyRight: true, tenant: '长乐××水果店', monthlyRent: 2500 },
              { id: 'RM-050', name: '高沟第一街西03', assetNo: 'GGDYJ-X03', area: 130, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 160 },
              { id: 'RM-051', name: '高沟第一街西04', assetNo: 'GGDYJ-X04', area: 85, status: '已出租', leaseExpiry: '2027-11-30', hasPropertyRight: true, tenant: '长乐××服装', monthlyRent: 3000 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-007', name: '人民剧场', type: '文化设施', group: '产投集团',
    totalAssets: 6, totalArea: 4200, rentedCount: 2, idleCount: 3, selfUsed: 1,
    rentalRate: 33.33, cumIncome: 36.0, yearIncome: 36.0,
    address: '长乐区吴航街道胜利路88号',
    image: localImage('juchang'),
    partitions: [
      {
        id: 'PART-012', name: '主体', area: 3000,
        floors: [
          {
            id: 'ZONE-017', name: '1F', area: 1500,
            rooms: [
              { id: 'RM-052', name: '剧场大厅', assetNo: 'RMJC-DT', area: 800, status: '自用', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0 },
              { id: 'RM-053', name: '剧场临街商铺', assetNo: 'RMJC-P01', area: 120, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '长乐××文印', monthlyRent: 3000 }
            ]
          },
          {
            id: 'ZONE-018', name: '2F', area: 1500,
            rooms: [
              { id: 'RM-054', name: '剧场二楼办公区', assetNo: 'RMJC-2F', area: 600, status: '闲置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 300 }
            ]
          }
        ]
      },
      {
        id: 'PART-013', name: '附属楼', area: 1200,
        floors: [
          {
            id: 'ZONE-019', name: '1F', area: 600,
            rooms: [
              { id: 'RM-055', name: '附属楼101', assetNo: 'RMJC-FS101', area: 150, status: '已出租', leaseExpiry: '2028-06-30', hasPropertyRight: true, tenant: '福州××文化传播', monthlyRent: 4500 },
              { id: 'RM-056', name: '附属楼102', assetNo: 'RMJC-FS102', area: 100, status: '闲置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 250 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-008', name: '府前御景阁', type: '住宅项目', group: '城投集团',
    totalAssets: 16, totalArea: 5120, rentedCount: 12, idleCount: 4,
    rentalRate: 75.0, cumIncome: 198.0, yearIncome: 84.0,
    address: '长乐区航城街道府前路168号',
    image: localImage('fuqian'),
    partitions: [
      {
        id: 'PART-014', name: 'A栋', area: 2560,
        floors: [
          {
            id: 'ZONE-020', name: '1F', area: 1280,
            rooms: [
              { id: 'RM-057', name: '府前御景阁A101', assetNo: 'FQYJG-A101', area: 130, status: '已出租', leaseExpiry: '2027-10-31', hasPropertyRight: true, tenant: '方××', monthlyRent: 4200 },
              { id: 'RM-058', name: '府前御景阁A102', assetNo: 'FQYJG-A102', area: 105, status: '已出租', leaseExpiry: '2028-02-28', hasPropertyRight: true, tenant: '卢××', monthlyRent: 3500 },
              { id: 'RM-059', name: '府前御景阁A103', assetNo: 'FQYJG-A103', area: 98, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 110 }
            ]
          },
          {
            id: 'ZONE-021', name: '2F', area: 1280,
            rooms: [
              { id: 'RM-060', name: '府前御景阁A201', assetNo: 'FQYJG-A201', area: 130, status: '已出租', leaseExpiry: '2027-07-31', hasPropertyRight: true, tenant: '蔡××', monthlyRent: 4000 },
              { id: 'RM-061', name: '府前御景阁A202', assetNo: 'FQYJG-A202', area: 105, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 200 }
            ]
          }
        ]
      },
      {
        id: 'PART-015', name: 'B栋', area: 2560,
        floors: [
          {
            id: 'ZONE-022', name: '1F', area: 1280,
            rooms: [
              { id: 'RM-062', name: '府前御景阁B101', assetNo: 'FQYJG-B101', area: 125, status: '已出租', leaseExpiry: '2027-11-30', hasPropertyRight: true, tenant: '叶××', monthlyRent: 3800 },
              { id: 'RM-063', name: '府前御景阁B102', assetNo: 'FQYJG-B102', area: 100, status: '已出租', leaseExpiry: '2028-04-30', hasPropertyRight: true, tenant: '丁××', monthlyRent: 3200 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-009', name: '红日公寓', type: '住宅项目', group: '水投集团',
    totalAssets: 12, totalArea: 3600, rentedCount: 9, idleCount: 3,
    rentalRate: 75.0, cumIncome: 108.0, yearIncome: 48.0,
    address: '长乐区营前街道营前路红日公寓',
    image: localImage('hongri'),
    partitions: [
      {
        id: 'PART-016', name: '主楼', area: 3600,
        floors: [
          {
            id: 'ZONE-023', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-064', name: '红日公寓101', assetNo: 'HRGY101', area: 85, status: '已出租', leaseExpiry: '2027-05-31', hasPropertyRight: true, tenant: '许××', monthlyRent: 2400 },
              { id: 'RM-065', name: '红日公寓102', assetNo: 'HRGY102', area: 78, status: '已出租', leaseExpiry: '2027-08-31', hasPropertyRight: true, tenant: '谢××', monthlyRent: 2200 },
              { id: 'RM-066', name: '红日公寓103', assetNo: 'HRGY103', area: 90, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 80 }
            ]
          },
          {
            id: 'ZONE-024', name: '2F', area: 1200,
            rooms: [
              { id: 'RM-067', name: '红日公寓201', assetNo: 'HRGY201', area: 85, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '余××', monthlyRent: 2500 },
              { id: 'RM-068', name: '红日公寓202', assetNo: 'HRGY202', area: 78, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 170 }
            ]
          },
          {
            id: 'ZONE-025', name: '3F', area: 1200,
            rooms: [
              { id: 'RM-069', name: '红日公寓301', assetNo: 'HRGY301', area: 85, status: '已出租', leaseExpiry: '2028-03-31', hasPropertyRight: true, tenant: '冯××', monthlyRent: 2600 },
              { id: 'RM-070', name: '红日公寓302', assetNo: 'HRGY302', area: 78, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 55 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-010', name: '滨城雅苑邻里中心', type: '商业综合', group: '城投集团',
    totalAssets: 14, totalArea: 7200, rentedCount: 10, idleCount: 4,
    rentalRate: 71.43, cumIncome: 256.0, yearIncome: 108.0,
    address: '长乐区漳港街道滨城大道200号',
    image: localImage('bincheng'),
    partitions: [
      {
        id: 'PART-017', name: '商业裙楼', area: 4800,
        floors: [
          {
            id: 'ZONE-026', name: '1F', area: 2400,
            rooms: [
              { id: 'RM-071', name: '邻里中心1F-01', assetNo: 'BCYL-1F01', area: 200, status: '已出租', leaseExpiry: '2028-06-30', hasPropertyRight: true, tenant: '福州××生鲜超市', monthlyRent: 8000 },
              { id: 'RM-072', name: '邻里中心1F-02', assetNo: 'BCYL-1F02', area: 150, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '长乐××药店', monthlyRent: 5500 },
              { id: 'RM-073', name: '邻里中心1F-03', assetNo: 'BCYL-1F03', area: 100, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 120 }
            ]
          },
          {
            id: 'ZONE-027', name: '2F', area: 2400,
            rooms: [
              { id: 'RM-074', name: '邻里中心2F-01', assetNo: 'BCYL-2F01', area: 300, status: '已出租', leaseExpiry: '2028-09-30', hasPropertyRight: true, tenant: '福建××健身', monthlyRent: 12000 },
              { id: 'RM-075', name: '邻里中心2F-02', assetNo: 'BCYL-2F02', area: 180, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 200 }
            ]
          }
        ]
      },
      {
        id: 'PART-018', name: '社区服务楼', area: 2400,
        floors: [
          {
            id: 'ZONE-028', name: '1F', area: 1200,
            rooms: [
              { id: 'RM-076', name: '社区服务楼101', assetNo: 'BCYL-FW101', area: 160, status: '已出租', leaseExpiry: '2027-08-31', hasPropertyRight: true, tenant: '长乐××家政', monthlyRent: 4000 },
              { id: 'RM-077', name: '社区服务楼102', assetNo: 'BCYL-FW102', area: 120, status: '已出租', leaseExpiry: '2028-01-31', hasPropertyRight: true, tenant: '长乐××维修', monthlyRent: 3000 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-011', name: '巴茅花小区', type: '住宅项目', group: '产投集团',
    totalAssets: 10, totalArea: 3200, rentedCount: 6, idleCount: 4,
    rentalRate: 60.0, cumIncome: 72.0, yearIncome: 36.0,
    address: '长乐区江田镇江田路巴茅花小区',
    image: localImage('bamaohua'),
    partitions: [
      {
        id: 'PART-019', name: '1号楼', area: 1600,
        floors: [
          {
            id: 'ZONE-029', name: '1F', area: 800,
            rooms: [
              { id: 'RM-078', name: '巴茅花1号101', assetNo: 'BMH-1-101', area: 90, status: '已出租', leaseExpiry: '2027-04-30', hasPropertyRight: true, tenant: '江××', monthlyRent: 2000 },
              { id: 'RM-079', name: '巴茅花1号102', assetNo: 'BMH-1-102', area: 85, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 220 }
            ]
          },
          {
            id: 'ZONE-030', name: '2F', area: 800,
            rooms: [
              { id: 'RM-080', name: '巴茅花1号201', assetNo: 'BMH-1-201', area: 90, status: '已出租', leaseExpiry: '2027-09-30', hasPropertyRight: true, tenant: '钟××', monthlyRent: 2100 },
              { id: 'RM-081', name: '巴茅花1号202', assetNo: 'BMH-1-202', area: 85, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 300 }
            ]
          }
        ]
      },
      {
        id: 'PART-020', name: '2号楼', area: 1600,
        floors: [
          {
            id: 'ZONE-031', name: '1F', area: 800,
            rooms: [
              { id: 'RM-082', name: '巴茅花2号101', assetNo: 'BMH-2-101', area: 95, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '魏××', monthlyRent: 2200 },
              { id: 'RM-083', name: '巴茅花2号102', assetNo: 'BMH-2-102', area: 80, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 150 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'BLD-012', name: '宏信大厦', type: '商业办公', group: '领航公司',
    totalAssets: 20, totalArea: 6800, rentedCount: 15, idleCount: 3, selfUsed: 2,
    rentalRate: 75.0, cumIncome: 420.0, yearIncome: 168.0,
    address: '长乐区吴航街道郑和路388号',
    image: localImage('hongxin'),
    partitions: [
      {
        id: 'PART-021', name: '塔楼', area: 4800,
        floors: [
          {
            id: 'ZONE-032', name: '8F', area: 1200,
            rooms: [
              { id: 'RM-084', name: '宏信大厦801', assetNo: 'HXDS801', area: 180, status: '已出租', leaseExpiry: '2028-06-30', hasPropertyRight: true, tenant: '福建××投资', monthlyRent: 7200 },
              { id: 'RM-085', name: '宏信大厦802', assetNo: 'HXDS802', area: 150, status: '已出租', leaseExpiry: '2027-12-31', hasPropertyRight: true, tenant: '长乐××地产', monthlyRent: 6000 },
              { id: 'RM-086', name: '宏信大厦803', assetNo: 'HXDS803', area: 120, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 70 }
            ]
          },
          {
            id: 'ZONE-033', name: '9F', area: 1200,
            rooms: [
              { id: 'RM-087', name: '宏信大厦901', assetNo: 'HXDS901', area: 200, status: '已出租', leaseExpiry: '2028-09-30', hasPropertyRight: true, tenant: '南京××科技', monthlyRent: 8000 },
              { id: 'RM-088', name: '宏信大厦902', assetNo: 'HXDS902', area: 160, status: '已出租', leaseExpiry: '2027-08-31', hasPropertyRight: true, tenant: '福州××传媒', monthlyRent: 6400 },
              { id: 'RM-089', name: '宏信大厦903', assetNo: 'HXDS903', area: 130, status: '自用', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0 }
            ]
          },
          {
            id: 'ZONE-034', name: '10F', area: 1200,
            rooms: [
              { id: 'RM-090', name: '宏信大厦1001', assetNo: 'HXDS1001', area: 220, status: '已出租', leaseExpiry: '2029-03-31', hasPropertyRight: true, tenant: '上海××贸易', monthlyRent: 9600 },
              { id: 'RM-091', name: '宏信大厦1002', assetNo: 'HXDS1002', area: 140, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 140 }
            ]
          }
        ]
      },
      {
        id: 'PART-022', name: '裙楼', area: 2000,
        floors: [
          {
            id: 'ZONE-035', name: '1F', area: 2000,
            rooms: [
              { id: 'RM-092', name: '宏信大厦裙楼101', assetNo: 'HXDS-QL101', area: 250, status: '已出租', leaseExpiry: '2028-12-31', hasPropertyRight: true, tenant: '福建××银行', monthlyRent: 15000 },
              { id: 'RM-093', name: '宏信大厦裙楼102', assetNo: 'HXDS-QL102', area: 180, status: '已出租', leaseExpiry: '2027-06-30', hasPropertyRight: true, tenant: '长乐××咖啡', monthlyRent: 7200 },
              { id: 'RM-094', name: '宏信大厦裙楼103', assetNo: 'HXDS-QL103', area: 100, status: '空置', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0, vacancyDays: 45 },
              { id: 'RM-095', name: '宏信大厦裙楼104', assetNo: 'HXDS-QL104', area: 80, status: '自用', leaseExpiry: null, hasPropertyRight: true, tenant: null, monthlyRent: 0 }
            ]
          }
        ]
      }
    ]
  }
]

// ===== 成本信息 =====
export const costRecords = [
  { id: 1, assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', costType: '购置成本', amount: 1860, date: '2018-03-15', remark: '含税费' },
  { id: 2, assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', costType: '改造成本', amount: 120, date: '2020-06-20', remark: '外立面翻新' },
  { id: 3, assetId: 'CT-002', assetName: '航城商务楼 3F', costType: '建设成本', amount: 5400, date: '2017-09-01', remark: '含土地成本' },
  { id: 4, assetId: 'CT-003', assetName: '营前标准厂房 2#', costType: '建设成本', amount: 2180, date: '2016-12-10', remark: '自建厂房' },
  { id: 5, assetId: 'CT-004', assetName: '首占新区保障房 1# 楼', costType: '建设成本', amount: 6200, date: '2019-05-20', remark: '保障房项目' }
]

// ===== 评估信息 =====
export const evaluationRecords = [
  { id: 1, assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', org: '福建××资产评估有限公司', date: '2024-06-15', value: 2100, method: '市场法', reportNo: 'FJPG-2024-0156' },
  { id: 2, assetId: 'CT-002', assetName: '航城商务楼 3F', org: '福建××资产评估有限公司', date: '2024-06-15', value: 6200, method: '收益法', reportNo: 'FJPG-2024-0157' },
  { id: 3, assetId: 'CT-003', assetName: '营前标准厂房 2#', org: '长乐××评估事务所', date: '2023-11-20', value: 2400, method: '成本法', reportNo: 'CLPG-2023-0089' },
  { id: 4, assetId: 'CT-005', assetName: '江田镇仓储用地', org: '福建××土地评估', date: '2024-01-10', value: 3500, method: '市场法', reportNo: 'FJTD-2024-0023' }
]

// ===== 租户信息 =====
export const tenantRecords = [
  { id: 1, name: '福州××商业管理有限公司', idType: '统一社会信用代码', idNo: '91350182MA31XXXX01', contact: '林××', phone: '13800001111', email: 'lin@fzcommerce.com', address: '福州市鼓楼区五四路100号' },
  { id: 2, name: '福建××科技有限公司', idType: '统一社会信用代码', idNo: '91350000MA32XXXX02', contact: '陈××', phone: '13900002222', email: 'chen@fjtech.com', address: '福州市台江区江滨大道200号' },
  { id: 3, name: '长乐××物流有限公司', idType: '统一社会信用代码', idNo: '91350182MA33XXXX03', contact: '王××', phone: '13700003333', email: 'wang@cllogistics.com', address: '长乐区营前街道营前路50号' },
  { id: 4, name: '长乐××物业管理有限公司', idType: '统一社会信用代码', idNo: '91350182MA34XXXX04', contact: '张××', phone: '13600004444', email: 'zhang@clproperty.com', address: '长乐区首占新区鹏城路30号' },
  { id: 5, name: '长乐××市场管理有限公司', idType: '统一社会信用代码', idNo: '91350182MA35XXXX05', contact: '李××', phone: '13500005555', email: 'li@clmarket.com', address: '长乐区吴航街道吴航路80号' },
  { id: 6, name: '江苏望风有限公司', idType: '统一社会信用代码', idNo: '91320000MA36XXXX06', contact: '赵××', phone: '13400006666', email: 'zhao@jswangfeng.com', address: '南京市建邺区河西大街100号' }
]

// ===== 预警任务（待办）=====
export const warningTasks = [
  { id: 'WT-001', name: 'CT-001 商铺欠费催缴', asset: 'CT-001 吴航街道商业街 A-01 商铺', type: '欠费催缴', deadline: '2026-09-20', status: '待处理', priority: '高', assignee: '资产管理员', group: '城投集团' },
  { id: 'WT-002', name: 'CT-003 合同到期提醒', asset: 'CT-003 营前标准厂房 2#', type: '合同临期', deadline: '2026-09-30', status: '待处理', priority: '中', assignee: '运营人员', group: '水投集团' },
  { id: 'WT-003', name: 'CT-006 闲置超期预警', asset: 'CT-006 玉田镇旧工业厂房', type: '闲置超期', deadline: '2026-10-15', status: '进行中', priority: '中', assignee: '资产管理员', group: '产投集团' },
  { id: 'WT-004', name: 'CT-005 权证办理跟进', asset: 'CT-005 江田镇仓储用地', type: '未办证', deadline: '2026-11-30', status: '进行中', priority: '低', assignee: '权证专员', group: '城投集团' },
  { id: 'WT-005', name: 'CT-015 写字楼欠费催缴', asset: 'CT-015 航城写字楼', type: '欠费催缴', deadline: '2026-09-25', status: '待处理', priority: '高', assignee: '资产管理员', group: '城投集团' },
  { id: 'WT-006', name: 'CT-097 闲置用地招租', asset: 'CT-097 江田镇闲置用地', type: '闲置盘活', deadline: '2026-10-30', status: '待处理', priority: '中', assignee: '运营人员', group: '城投集团' },
  { id: 'WT-007', name: 'CT-201 商铺欠费催缴', asset: 'CT-201 产投商铺', type: '欠费催缴', deadline: '2026-09-22', status: '待处理', priority: '高', assignee: '资产管理员', group: '产投集团' },
  { id: 'WT-008', name: 'CT-301 办公楼欠费催缴', asset: 'CT-301 水投办公楼', type: '欠费催缴', deadline: '2026-09-28', status: '进行中', priority: '中', assignee: '资产管理员', group: '水投集团' }
]

// ===== 资产盘点任务 =====
export const inventoryTasks = [
  { id: 'IT-001', name: '2026年Q3全面盘点', group: '城投集团', type: '全面盘点', totalAssets: 128, doneCount: 96, pendingCount: 32, status: '进行中', startDate: '2026-09-01', endDate: '2026-09-30', assignee: '盘点小组A' },
  { id: 'IT-002', name: '2026年Q3全面盘点', group: '产投集团', type: '全面盘点', totalAssets: 86, doneCount: 86, pendingCount: 0, status: '已完成', startDate: '2026-09-01', endDate: '2026-09-20', assignee: '盘点小组B' },
  { id: 'IT-003', name: '2026年Q3全面盘点', group: '水投集团', type: '全面盘点', totalAssets: 54, doneCount: 41, pendingCount: 13, status: '进行中', startDate: '2026-09-01', endDate: '2026-09-30', assignee: '盘点小组C' },
  { id: 'IT-004', name: '2026年Q3全面盘点', group: '领航公司', type: '全面盘点', totalAssets: 32, doneCount: 10, pendingCount: 22, status: '进行中', startDate: '2026-09-01', endDate: '2026-09-30', assignee: '盘点小组D' },
  { id: 'IT-005', name: '安东大厦专项盘点', group: '城投集团', type: '抽样盘点', totalAssets: 24, doneCount: 24, pendingCount: 0, status: '已完成', startDate: '2026-08-15', endDate: '2026-08-20', assignee: '盘点小组A' },
  { id: 'IT-006', name: '红联壹城专项盘点', group: '城投集团', type: '循环盘点', totalAssets: 15, doneCount: 15, pendingCount: 0, status: '已审核', startDate: '2026-07-01', endDate: '2026-07-10', assignee: '盘点小组A' }
]

// ===== 部门数据 =====
export const departments = [
  { id: 1, name: '资产管理部', company: '城投集团', manager: '陈××', headcount: 12, createTime: '2020-01-15' },
  { id: 2, name: '运营管理部', company: '城投集团', manager: '林××', headcount: 8, createTime: '2020-01-15' },
  { id: 3, name: '财务管理部', company: '城投集团', manager: '黄××', headcount: 6, createTime: '2020-01-15' },
  { id: 4, name: '资产管理部', company: '产投集团', manager: '王××', headcount: 10, createTime: '2020-03-01' },
  { id: 5, name: '运营管理部', company: '产投集团', manager: '刘××', headcount: 7, createTime: '2020-03-01' },
  { id: 6, name: '资产管理部', company: '水投集团', manager: '李××', headcount: 8, createTime: '2020-06-01' },
  { id: 7, name: '综合管理部', company: '领航公司', manager: '张××', headcount: 5, createTime: '2021-01-01' },
  { id: 8, name: '运营科', company: '长乐国资中心', manager: '林××', headcount: 15, createTime: '2019-06-01' },
  { id: 9, name: '监督科', company: '长乐国资中心', manager: '周××', headcount: 8, createTime: '2019-06-01' },
  { id: 10, name: '财务科', company: '长乐国资中心', manager: '吴××', headcount: 6, createTime: '2019-06-01' }
]

// ===== 缴费记录（移动端）=====
export const paymentRecords = [
  { id: 1, month: '2026年08月', payer: '张伟', phone: '177****8734', amount: 683.33, address: '山西省大同市平城区新旺街道旺华紫城', time: '2026-08-31 17:38:58', type: '租金', invoice: false },
  { id: 2, month: '2026年03月', payer: '张伟', phone: '177****8734', amount: 100, address: '天津市天津城区和平区小白楼街道楼之外0006', time: '2026-03-30 10:21:12', type: '租金', invoice: false },
  { id: 3, month: '2026年02月', payer: '张伟', phone: '177****8734', amount: 100, address: '山西省大同市平城区新旺街道旺华紫城', time: '2026-02-10 11:20:32', type: '其他收费-现场维修', invoice: true },
  { id: 4, month: '2026年02月', payer: '张伟', phone: '177****8734', amount: 630, address: '山西省大同市平城区新旺街道旺华紫城', time: '2026-02-10 11:00:41', type: '租金', invoice: false, discount: 50 },
  { id: 5, month: '2026年02月', payer: '张伟', phone: '177****8734', amount: 13.33, address: '山西省大同市平城区新旺街道旺华紫城', time: '2026-02-10 10:30:00', type: '物业费', invoice: false },
  { id: 6, month: '2026年01月', payer: '张伟', phone: '177****8734', amount: 1000, address: '山西省大同市平城区新旺街道旺华紫城', time: '2026-01-15 09:00:00', type: '租金', invoice: true }
]

// ===== 资产档案 =====
export const assetArchives = [
  { id: 1, company: '城投集团', asset: '吴航街道商业街 A-01 商铺', assetNo: 'CT-001', archiveType: '产权档案', createTime: '2020-03-15', files: ['产权证扫描件.pdf', '购房合同.pdf'] },
  { id: 2, company: '城投集团', asset: '航城商务楼 3F', assetNo: 'CT-002', archiveType: '合同档案', createTime: '2025-01-01', files: ['租赁合同.pdf', '电子签章记录.pdf'] },
  { id: 3, company: '产投集团', asset: '营前标准厂房 2#', assetNo: 'CT-003', archiveType: '评估档案', createTime: '2023-11-20', files: ['评估报告.pdf'] },
  { id: 4, company: '水投集团', asset: '吴航农贸市场', assetNo: 'CT-007', archiveType: '产权档案', createTime: '2019-06-01', files: ['产权证扫描件.pdf', '土地证.pdf'] },
  { id: 5, company: '城投集团', asset: '安东大厦516', assetNo: 'A00D516', archiveType: '维修档案', createTime: '2026-05-10', files: ['维修工单.pdf', '维修前后照片.zip'] }
]

// ===== 资产详情扩展数据（14个Tab）=====
export const assetDetailData = {
  receiveInfo: [
    { id: 1, assetId: 'CT-001', receiver: '陈××', receiveDate: '2018-03-20', source: '自购入库', remark: '验收合格' }
  ],
  paymentHistory: [
    { id: 1, assetId: 'CT-001', period: '2026-08', amount: 3.5, payDate: '2026-08-05', status: '已缴', method: '银行转账' },
    { id: 2, assetId: 'CT-001', period: '2026-07', amount: 3.5, payDate: '2026-07-05', status: '已缴', method: '银行转账' },
    { id: 3, assetId: 'CT-001', period: '2026-06', amount: 3.5, payDate: '2026-06-08', status: '已缴', method: '银行转账' }
  ],
  inspectionHistory: [
    { id: 1, assetId: 'CT-001', inspector: '张××', inspectDate: '2026-08-15', result: '正常', remark: '外立面完好' },
    { id: 2, assetId: 'CT-001', inspector: '张××', inspectDate: '2026-05-10', result: '正常', remark: '' }
  ],
  repairHistory: [
    { id: 1, assetId: 'CT-006', reporter: '王××', reportDate: '2026-07-20', issue: '屋顶漏水', status: '已完成', completeDate: '2026-08-01', cost: 2.5 }
  ],
  selfUseRecords: [
    { id: 1, assetId: 'CT-008', department: '综合管理部', startDate: '2020-01-01', endDate: null, purpose: '办公用房', approver: '张××' }
  ],
  filingRecords: [
    { id: 1, assetId: 'CT-001', filingType: '产权备案', filingDate: '2020-03-15', authority: '长乐区不动产登记中心', status: '已备案' }
  ],
  ownershipTransfer: [
    { id: 1, assetId: 'CT-005', fromOwner: '江田镇政府', toOwner: '城投集团', transferDate: '2015-06-01', method: '划拨', approvalNo: 'CLHZ-2015-008' }
  ]
}
