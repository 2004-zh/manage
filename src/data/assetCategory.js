// 12 大资产分类：台账页签、资产登记下拉、报表口径共用同一套词表。
export const ASSET_CATEGORIES = [
  '房产类', '土地类', '经营类房屋店铺', '农贸市场', '运输设备', '矿产资源类',
  '公共设备类', '长期股权投资类', '经营性生产设备类', '特殊特种行业类', '经营权类资产', '特殊动植物类'
]

// 只在「档案里没有分类」时兜底推断，避免同一个资产在不同页面落到不同页签。
export const CATEGORY_BY_TYPE = {
  '商铺': '经营类房屋店铺',
  '门面房': '经营类房屋店铺',
  '摊位': '经营类房屋店铺',
  '农贸市场': '农贸市场',
  '厂房': '经营性生产设备类',
  '车间': '经营性生产设备类',
  '仓储/土地': '土地类',
  '仓储': '土地类',
  '土地': '土地类',
  '商业用地': '土地类',
  '住宅用地': '土地类',
  '保障房': '房产类',
  '写字楼': '房产类',
  '办公楼': '房产类',
  '综合用房': '房产类',
  '住宅': '房产类',
  '车辆': '运输设备',
  '船舶': '运输设备',
  '车位': '运输设备',
  '股权': '长期股权投资类',
  '采矿权': '矿产资源类',
  '探矿权': '矿产资源类',
  '公共设备': '公共设备类',
  '特种行业': '特殊特种行业类',
  '特殊动植物': '特殊动植物类',
  '特许经营权': '经营权类资产'
}

export function deriveAssetCategory(type) {
  return CATEGORY_BY_TYPE[type] || '房产类'
}

export function resolveAssetCategory(asset) {
  if (!asset) return '房产类'
  if (ASSET_CATEGORIES.includes(asset.assetCategory)) return asset.assetCategory
  return deriveAssetCategory(asset.type)
}
