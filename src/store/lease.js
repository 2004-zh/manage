import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAssetStore } from './asset'
import { useAuditStore } from './audit'

const placeholderImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC'
const imgs = (count, prefix) => Array.from({ length: count }, (_, i) => ({ name: `${prefix}${i + 1}.png`, url: placeholderImg }))

const RELEASE_SEEDS = [
  { id: 1, assetId: 'CT-003', assetNo: 'CT-003', noticeNo: 'GG-2026-001', assetName: '营前标准厂房 2#', assetType: '厂房', assetLocation: '福州市长乐区营前街道工业园区2号', region: '福建省/福州市/长乐区', area: 3600, company: '城投集团', leaseType: '长期（3年以上）', method: '公开竞价', rentType: '价格', rent: 65000, remark: '标准厂房整栋招租', period: '2026-08-15 ~ 2026-09-15', createTime: '2026-08-15 09:30', enabled: true, recommend: true, dealt: false, intro: '标准钢结构厂房，层高9米，配套行车及办公区，适合智能制造、仓储物流企业入驻。', usageReq: '限工业生产及仓储用途，不得存放易燃易爆物品，需通过环评审批。', listImg: imgs(1, '列表图'), carouselImg: imgs(2, '轮播图') },
  { id: 2, assetId: 'CT-101', assetNo: 'CT-101', noticeNo: 'GG-2026-002', assetName: '江田闲置用地 1#', assetType: '仓储/土地', assetLocation: '福州市长乐区江田镇临港路西侧', region: '福建省/福州市/长乐区', area: 12000, company: '产投集团', leaseType: '中期（1-3年）', method: '挂牌出租', rentType: '价格', rent: 25000, remark: '临港仓储用地', period: '2026-08-20 ~ 2026-09-20', createTime: '2026-08-20 10:05', enabled: true, recommend: false, dealt: false, intro: '已平整仓储用地，紧邻疏港公路，水电齐全，适合露天仓储及物流周转。', usageReq: '限仓储物流用途，禁止建设永久性建筑，需服从园区统一管理。', listImg: imgs(1, '列表图'), carouselImg: imgs(1, '轮播图') },
  { id: 3, assetId: 'CT-005', assetNo: 'CT-005', noticeNo: 'GG-2026-003', assetName: '吴航街道商业街 A-03', assetType: '商铺', assetLocation: '福州市长乐区吴航街道商业街A区3号', region: '福建省/福州市/长乐区', area: 180, company: '城投集团', leaseType: '中期（1-3年）', method: '公开竞价', rentType: '价格', rent: 18500, remark: '临街旺铺，已成交', period: '2026-07-01 ~ 2026-08-01', createTime: '2026-07-01 08:40', enabled: false, recommend: false, dealt: true, intro: '商业街核心位置临街商铺，人流密集，展示面宽，适合品牌零售及餐饮。', usageReq: '限商业经营用途，餐饮业态需配备油烟净化设施。', listImg: imgs(1, '列表图'), carouselImg: imgs(2, '轮播图') },
  { id: 4, assetId: 'CT-006', assetNo: 'CT-006', noticeNo: 'GG-2026-004', assetName: '玉田镇旧工业厂房', assetType: '厂房', assetLocation: '福州市长乐区玉田镇旧工业区9号', region: '福建省/福州市/长乐区', area: 2400, company: '领航公司', leaseType: '长期（3年以上）', method: '协议出租', rentType: '价格', rent: 22000, remark: '旧厂房改造招租', period: '2026-06-10 ~ 2026-07-10', createTime: '2026-06-10 14:20', enabled: false, recommend: false, dealt: true, intro: '旧工业厂房，结构完好，场地开阔，适合文创改造或轻型加工。', usageReq: '用途需符合园区转型规划，改造方案须报集团审批。', listImg: imgs(1, '列表图'), carouselImg: imgs(1, '轮播图') },
  { id: 5, assetId: 'CT-021', assetNo: 'CT-021', assetName: '航城商铺A-08', assetType: '商铺', assetLocation: '福州市长乐区航城街道商务路A区8号', region: '福建省/福州市/长乐区', area: 120, company: '城投集团', leaseType: '短期（1年以内）', method: '挂牌出租', rentType: '价格', rent: 3500, remark: '社区底商', period: '2026-03-01 ~ 2026-03-31', createTime: '2026-03-01 09:00', enabled: true, recommend: false, dealt: false, intro: '成熟社区底商，紧邻公交站点，适合便利店、快递驿站等便民业态。', usageReq: '限便民商业业态，不得经营产生噪音污染的项目。', listImg: imgs(1, '列表图'), carouselImg: imgs(1, '轮播图') },
  { id: 6, assetId: 'CT-034', assetNo: 'CT-034', assetName: '营前仓库C-01', assetType: '仓储', assetLocation: '福州市长乐区营前街道仓前路C区1号', region: '福建省/福州市/长乐区', area: 600, company: '水投集团', leaseType: '中期（1-3年）', method: '公开竞价', rentType: '面议', rent: 0, remark: '租金面议', period: '2026-01-10 ~ 2026-02-10', createTime: '2026-01-10 11:15', enabled: true, recommend: false, dealt: false, intro: '普通货物仓库，带装卸平台，库区道路宽敞，货车进出方便。', usageReq: '限普通货物仓储，禁止存放危化品及生鲜冷冻货物。', listImg: imgs(1, '列表图'), carouselImg: imgs(2, '轮播图') },
  { id: 7, assetId: 'CT-042', assetNo: 'CT-042', assetName: '漳港商铺E-02', assetType: '商铺', assetLocation: '福州市长乐区漳港街道海滨路E区2号', region: '福建省/福州市/长乐区', area: 95, company: '产投集团', leaseType: '短期（1年以内）', method: '协议出租', rentType: '价格', rent: 2800, remark: '海滨旅游商铺', period: '2026-03-15 ~ 2026-04-15', createTime: '2026-03-15 16:45', enabled: true, recommend: true, dealt: false, intro: '海滨旅游商圈商铺，旺季客流量大，适合海鲜餐饮及旅游商品经营。', usageReq: '限旅游配套商业业态，需配合景区统一营销活动。', listImg: imgs(1, '列表图'), carouselImg: imgs(1, '轮播图') },
  { id: 8, assetId: 'CT-015', assetNo: 'CT-015', assetName: '梅花镇综合楼', assetType: '写字楼', assetLocation: '福州市长乐区梅花镇海滨路66号', region: '福建省/福州市/长乐区', area: 800, company: '领航公司', leaseType: '长期（3年以上）', method: '挂牌出租', rentType: '面议', rent: 0, remark: '整栋综合楼招租', period: '2026-05-06 ~ 2026-06-06', createTime: '2026-05-06 10:30', enabled: false, recommend: false, dealt: false, intro: '滨海综合楼整栋招租，可作酒店、办公或文旅综合体使用，视野开阔。', usageReq: '整体承租，业态需符合乡镇文旅发展规划。', listImg: imgs(1, '列表图'), carouselImg: imgs(2, '轮播图') }
]

const NOTICE_SEEDS = [
  { noticeNo: 'GG-2026-001', assetId: 'CT-003', assetName: '营前标准厂房 2#', area: 3600, startPrice: 65000, publishDate: '2026-08-15', deadline: '2026-09-15', registrantCount: 5, status: '报名中' },
  { noticeNo: 'GG-2026-002', assetId: 'CT-101', assetName: '江田镇仓储用地', area: 12000, startPrice: 25000, publishDate: '2026-08-20', deadline: '2026-09-20', registrantCount: 3, status: '报名中' },
  { noticeNo: 'GG-2026-003', assetId: 'CT-005', assetName: '吴航街道商业街 A-03', area: 180, startPrice: 12000, publishDate: '2026-07-01', deadline: '2026-08-01', registrantCount: 8, status: '已截止' },
  { noticeNo: 'GG-2026-004', assetId: 'CT-006', assetName: '玉田镇旧工业厂房', area: 2400, startPrice: 18000, publishDate: '2026-06-10', deadline: '2026-07-10', registrantCount: 4, status: '已截止' }
]

const REGISTRANT_SEEDS = [
  { regNo: 'BM-2026-001', noticeNo: 'GG-2026-001', assetName: '营前标准厂房 2#', registrant: '福建恒通纺织有限公司', contactPhone: '138****5678', registerDate: '2026-08-18', qualification: '已通过' },
  { regNo: 'BM-2026-002', noticeNo: 'GG-2026-001', assetName: '营前标准厂房 2#', registrant: '长乐鑫达机械加工厂', contactPhone: '139****1234', registerDate: '2026-08-20', qualification: '已通过' },
  { regNo: 'BM-2026-003', noticeNo: 'GG-2026-001', assetName: '营前标准厂房 2#', registrant: '福州瑞丰物流有限公司', contactPhone: '137****9876', registerDate: '2026-08-22', qualification: '待审核' },
  { regNo: 'BM-2026-004', noticeNo: 'GG-2026-002', assetName: '江田镇仓储用地', registrant: '长乐盛达仓储公司', contactPhone: '135****4321', registerDate: '2026-08-25', qualification: '已通过' },
  { regNo: 'BM-2026-005', noticeNo: 'GG-2026-002', assetName: '江田镇仓储用地', registrant: '福建中远物流', contactPhone: '136****7890', registerDate: '2026-08-28', qualification: '待审核' },
  { regNo: 'BM-2026-006', noticeNo: 'GG-2026-003', assetName: '吴航街道商业街 A-03', registrant: '陈小明', contactPhone: '158****2468', registerDate: '2026-07-05', qualification: '已通过' }
]

const BID_SEEDS = [
  { bidNo: 'JJ-2026-001', noticeNo: 'GG-2026-003', assetName: '吴航街道商业街 A-03', startPrice: 12000, currentPrice: 18500, bidCount: 12, bidderCount: 8, status: '已结束' },
  { bidNo: 'JJ-2026-002', noticeNo: 'GG-2026-004', assetName: '玉田镇旧工业厂房', startPrice: 18000, currentPrice: 22000, bidCount: 6, bidderCount: 4, status: '已结束' },
  { bidNo: 'JJ-2026-003', noticeNo: 'GG-2026-001', assetName: '营前标准厂房 2#', startPrice: 65000, currentPrice: 78000, bidCount: 3, bidderCount: 3, status: '进行中' }
]

const RESULT_SEEDS = [
  { resultNo: 'GS-2026-001', noticeNo: 'GG-2026-003', assetId: 'CT-003', assetName: '吴航街道商业街 A-03', area: 180, winner: '陈小明', dealPrice: 18500, premiumRate: 54.2, publishDate: '2026-08-05', status: '已公示', contractId: '' },
  { resultNo: 'GS-2026-002', noticeNo: 'GG-2026-004', assetId: 'CT-006', assetName: '玉田镇旧工业厂房', area: 2400, winner: '福建恒通纺织有限公司', dealPrice: 22000, premiumRate: 22.2, publishDate: '2026-07-15', status: '已公示', contractId: '' }
]

const RENT_RECORD_SEEDS = [
  { id: 1, rentNo: 'ZC-2026-001', assetName: '城关旧厂房1#', area: 1800, startPrice: 15000, method: '公开竞价', startDate: '2026-02-01', endDate: '2026-03-01', status: '已成交', bidders: '3家', dealPrice: 18500 },
  { id: 2, rentNo: 'ZC-2026-002', assetName: '航城商铺A-08', area: 120, startPrice: 3500, method: '挂牌出租', startDate: '2026-03-01', endDate: '2026-03-31', status: '招租中', bidders: null, dealPrice: null },
  { id: 3, rentNo: 'ZC-2026-003', assetName: '营前仓库C-01', area: 600, startPrice: 8000, method: '公开竞价', startDate: '2026-01-10', endDate: '2026-02-10', status: '已流拍', bidders: '0家', dealPrice: null },
  { id: 4, rentNo: 'ZC-2026-004', assetName: '漳港商铺E-02', area: 95, startPrice: 2800, method: '协议出租', startDate: '2026-03-15', endDate: '2026-04-15', status: '待审批', bidders: null, dealPrice: null }
]

function nextSeq(list, field, prefix) {
  const max = list.reduce((m, row) => {
    const n = Number(String(row[field]).split('-').pop())
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

function leaseTypeOf(startDate, deadline) {
  const months = (new Date(deadline) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 30)
  if (months >= 36) return '长期（3年以上）'
  if (months >= 12) return '中期（1-3年）'
  return '短期（1年以内）'
}

export const useLeaseStore = defineStore('lease', () => {
  const releases = ref(RELEASE_SEEDS.map(r => ({ ...r })))
  const notices = ref(NOTICE_SEEDS.map(n => ({ ...n })))
  const registrants = ref(REGISTRANT_SEEDS.map(r => ({ ...r })))
  const bids = ref(BID_SEEDS.map(b => ({ ...b })))
  const results = ref(RESULT_SEEDS.map(r => ({ ...r })))
  const rentRecords = ref(RENT_RECORD_SEEDS.map(r => ({ ...r })))

  /**
   * 发起招租：一次产出「招租公告 + 招商发布记录 + 招租流水」三条联动数据，
   * 避免出现「公告发布成功、招商发布列表里却查不到」的断链。
   */
  function publishRent({ assetId, leaseArea, method, startPrice, startDate, deadline, noticeContent, remark, rentType = '价格' }) {
    const asset = useAssetStore().getAssetById(assetId)
    if (!asset) return null
    const year = String(new Date().getFullYear())
    const noticeNo = nextSeq(notices.value, 'noticeNo', `GG-${year}-`)
    const period = `${startDate} ~ ${deadline}`
    const now = new Date()
    const createTime = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const notice = {
      noticeNo,
      assetId: asset.id,
      assetName: asset.name,
      area: leaseArea,
      totalArea: asset.area,
      partial: asset.status === '部分出租' || leaseArea < asset.area,
      startPrice,
      publishDate: startDate,
      deadline,
      registrantCount: 0,
      status: '报名中'
    }
    notices.value.unshift(notice)

    const release = {
      id: releases.value.reduce((m, r) => (Number.isFinite(r.id) && r.id > m ? r.id : m), 0) + 1,
      assetId: asset.id,
      assetNo: asset.id,
      noticeNo,
      assetName: asset.name,
      assetType: asset.type,
      assetLocation: asset.location,
      region: '福建省/福州市/长乐区',
      area: leaseArea,
      company: asset.group || '',
      leaseType: leaseTypeOf(startDate, deadline),
      method,
      rentType,
      rent: rentType === '面议' ? 0 : startPrice,
      remark: remark || '',
      period,
      createTime,
      enabled: true,
      recommend: false,
      dealt: false,
      intro: noticeContent || '',
      usageReq: remark || '',
      listImg: [],
      carouselImg: []
    }
    releases.value.unshift(release)

    rentRecords.value.unshift({
      id: rentRecords.value.length + 1,
      rentNo: nextSeq(rentRecords.value, 'rentNo', `ZC-${year}-`),
      assetId: asset.id,
      assetName: asset.name,
      area: leaseArea,
      startPrice,
      method,
      startDate,
      endDate: deadline,
      status: '招租中',
      bidders: null,
      dealPrice: null
    })

    useAuditStore().recordEvent({
      assetId: asset.id,
      assetName: asset.name,
      group: asset.group || '',
      module: '招商租赁',
      action: '发起招租',
      billNo: noticeNo,
      remark: `${method}，招租面积 ${leaseArea} ㎡`,
      detail: `起拍价 ${startPrice} 元/月 / 报名截止 ${deadline}`
    })

    return { notice, release }
  }

  function removeRelease(id) {
    const idx = releases.value.findIndex(r => r.id === id)
    if (idx === -1) return false
    releases.value.splice(idx, 1)
    return true
  }

  return {
    releases,
    notices,
    registrants,
    bids,
    results,
    rentRecords,
    publishRent,
    removeRelease
  }
})
