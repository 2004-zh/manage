import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuditStore } from './audit'
import { useUserStore } from './user'

/**
 * 专项资产：无形资产台账 + 长期股权投资台账。
 * 本 store 是 IntangibleAssets / EquityInvestment 两个企业端页面的唯一数据源，
 * 每一次写操作都通过 audit store 留痕（recordEvent 单据类 / recordDiff 字段类），
 * 因此台账的价值变动、摊销、处置、权属业务、股权变更、核销、质押都能被监督与追溯看到。
 *
 * 约定：所有 action 返回 { ok, msg }，页面按 ok 决定提示语气，校验规则只写一遍（在 store 内）。
 */

const IA_MODULE = '无形资产'
const EQ_MODULE = '股权投资'
const IA_DEFAULT_OWNER = '长乐区国有资产投资经营有限公司'
/** 股权侧的出资（权属）单位，作为留痕的集团口径 */
const EQ_INVESTOR = '长乐区国有资产投资经营有限公司'

const IA_MANAGERS = ['林志强', '王芳', '陈志明', '周琳']
const IA_REGION = ['福建省', '福州市', '长乐区', '航城街道']

/** 年度维护五类：页签 type → 企业档案字段（页面与 store 共用同一份映射） */
export const EQ_MAINTAIN_KEYS = { report: 'reports', exec: 'executives', work: 'workNotes', meeting: 'meetings', writeoff: 'writeOffs' }
export const EQ_MAINTAIN_LABELS = { report: '年度财务报告', exec: '高管信息', work: '工作纪要', meeting: '会议纪要', writeoff: '股权核销' }

function pad(n) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nowTime() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function round2(n) { return Math.round(Number(n) * 100) / 100 }

/** 留痕的操作人：跟随登录角色，未登录时回落到「当前用户」 */
function actorName() {
  return useUserStore().user?.name || '当前用户'
}

/** 无形资产登记后即为完整档案：派生公司/编号/权属/操作记录等字段 */
function enrichIntangibleAsset(a, i) {
  a.uid = `IA${String(i + 1).padStart(3, '0')}`
  a.company = a.owner
  a.assetNo = `WC2026-${String(i + 1).padStart(4, '0')}`
  a.manager = IA_MANAGERS[i % IA_MANAGERS.length]
  a.region = [...IA_REGION]
  a.regionText = a.region.join('')
  a.lnglat = ''
  a.initValue = a.value
  a.createTime = `${a.regDate} 09:30`
  a.updateTime = '2026-08-16 15:42'
  a.attachments = [{ name: `${a.name}-权证扫描件.pdf` }]
  a.patentNo = a.category === '专利权' ? a.regNo : '—'
  a.patentOwner = a.owner
  a.patentType = a.patentType || ''
  a.patentField = a.category === '专利权' ? (a.summary || '节能环保技术') : '—'
  a.applyDate = a.regDate
  a.grantDate = a.regDate
  a.claimSummary = a.summary || ''
  a.desc = a.summary || ''
  a.rightsNo = `QS2026-${String(i + 1).padStart(4, '0')}`
  a.rightsValid = a.validUntil
  a.holdType = '单独所有'
  a.rightsRatioType = '单独所有'
  a.acquireDate = a.regDate
  a.holders = [{ unit: a.owner, ratio: 100 }]
  a.opLogs = {
    receive: (a.receiveLogs.length ? a.receiveLogs : [{ time: a.regDate, text: '资产接收入库' }]).map(l => ({
      source: a.acquireWay,
      sourceParty: a.acquireWay === '政府授权' ? '长乐区人民政府' : a.acquireWay === '划转' ? '长乐区国资办' : a.owner,
      docNo: a.regNo,
      acquireDate: a.regDate,
      cost: a.initValue,
      receiveDate: l.time,
      handler: a.manager,
      note: l.text,
    })),
    evaluate: a.evalLogs.map(l => ({ source: '委托评估', sourceParty: '福建中兴资产评估有限公司', date: l.time, note: l.text })),
    use: a.useLogs.map(l => ({ source: '经营使用', useParty: a.owner, date: l.time, note: l.text })),
    amortize: a.amortizeLogs.map(l => ({ ...l })),
    ownership: a.rightsLogs.map((l, j) => ({ type: l.type, holder: l.target || a.owner, ratio: 100, date: l.date, applyNo: `SQ2026${String(j + 1).padStart(6, '0')}`, status: '审批通过' })),
  }
}

function makeAsset(overrides) {
  return {
    amortizeMethod: '直线法',
    patentType: '',
    summary: '',
    receiveLogs: [],
    evalLogs: [],
    useLogs: [],
    amortizeLogs: [],
    rightsLogs: [],
    transferLogs: [],
    disposalLogs: [],
    ...overrides,
  }
}

const seedIntangibleAssets = [
  makeAsset({ category: '专利权', name: '一种纺织面料节水印染装置', certNo: 'ZL2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: 'ZL202320XXXXXX5.6', regDate: '2023-06-15', validUntil: '2033-06-14', value: 320, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', patentType: '发明专利', summary: '涉及纺织面料印染领域的节水技术', coOwner: '', otherRights: '', receiveLogs: [{ time: '2023-06-20', text: '完成专利证书接收登记' }], evalLogs: [{ time: '2025-06-30', text: '福建中兴评估：评估价值 320 万元' }], useLogs: [{ time: '2024-01-10', text: '许可鸿运纺织使用该专利，年许可费 12 万元' }], amortizeLogs: [{ period: '2023-07 ~ 2024-06', amount: 32, bookValue: 288, method: '直线法', remark: '年度摊销（10年期限）' }, { period: '2024-07 ~ 2025-06', amount: 32, bookValue: 256, method: '直线法', remark: '年度摊销' }], rightsLogs: [{ type: '许可', date: '2024-01-10', content: '许可鸿运纺织使用该专利', target: '福建省长乐市鸿运纺织有限公司', validUntil: '2027-01-09', fee: 12 }], transferLogs: [] }),
  makeAsset({ category: '专利权', name: '智能停车道闸控制系统', certNo: 'ZL2026-0002', owner: '长乐区国有资产投资经营有限公司', regNo: 'ZL202420XXXXXX8.2', regDate: '2024-09-01', validUntil: '2034-08-31', value: 85, status: '使用中', ownershipType: '国有', acquireWay: '外购', amortizeMethod: '直线法', patentType: '实用新型', summary: '停车场智能道闸控制技术', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-09-05', text: '外购专利完成权属变更登记' }], evalLogs: [], useLogs: [{ time: '2025-03-01', text: '应用于城西停车场智能化改造' }], amortizeLogs: [{ period: '2024-10 ~ 2025-09', amount: 8.5, bookValue: 76.5, method: '直线法', remark: '年度摊销（10年期限）' }], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '商标权', name: '"长乐城投"服务商标', certNo: 'SB2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '第58XXXX21号', regDate: '2022-03-14', validUntil: '2032-03-13', value: 150, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2022-03-20', text: '商标注册证归档登记' }], evalLogs: [{ time: '2025-12-31', text: '年度评估：评估价值 150 万元' }], useLogs: [{ time: '2022-04-01', text: '用于公司对外品牌宣传' }], amortizeLogs: [{ period: '2022-04 ~ 2023-03', amount: 15, bookValue: 135, method: '直线法', remark: '年度摊销（10年期限）' }, { period: '2023-04 ~ 2024-03', amount: 15, bookValue: 120, method: '直线法', remark: '年度摊销' }, { period: '2024-04 ~ 2025-03', amount: 15, bookValue: 105, method: '直线法', remark: '年度摊销' }], rightsLogs: [{ type: '续展', date: '2025-12-01', content: '商标续展申请已提交，有效期至2042年', target: '', validUntil: '2042-03-13' }], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '著作权', name: '资产云管理平台软件著作权', certNo: 'ZR2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '2025SR0XXXX12', regDate: '2025-02-18', validUntil: '2075-02-17', value: 60, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2025-02-20', text: '软著证书接收登记' }], evalLogs: [], useLogs: [{ time: '2025-03-01', text: '内部系统上线使用' }], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '土地使用权', name: '航城片区工业用地（宗地号350112-08）', certNo: 'TD2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '闽(2021)长乐区不动产权第00XXXX号', regDate: '2021-05-20', validUntil: '2071-05-19', value: 4200, status: '使用中', ownershipType: '国有出让', acquireWay: '划转', amortizeMethod: '不摊销', coOwner: '', otherRights: '已抵押（工行长乐支行，最高额2000万元）', receiveLogs: [{ time: '2021-06-01', text: '完成划转接收，权证入库' }], evalLogs: [{ time: '2026-01-15', text: '中兴评估：市场价值 4600 万元' }], useLogs: [{ time: '2022-01-01', text: '出租给鸿运纺织建设厂房，年租金 45 万元' }], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '特许经营权', name: '城区公共停车场特许经营权', certNo: 'TX2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '长政综[2024]XX号', regDate: '2024-01-10', validUntil: '2044-01-09', value: 1800, status: '使用中', ownershipType: '国有', acquireWay: '政府授权', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-01-15', text: '区政府授权文件归档' }], evalLogs: [{ time: '2025-06-30', text: '收益法评估：1800 万元' }], useLogs: [{ time: '2024-03-01', text: '委托物业公司运营12处停车场' }], amortizeLogs: [{ period: '2024-01 ~ 2024-12', amount: 90, bookValue: 1710, method: '直线法', remark: '年度摊销（20年期限）' }, { period: '2025-01 ~ 2025-12', amount: 90, bookValue: 1620, method: '直线法', remark: '年度摊销' }], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '特许经营权', name: '农贸市场摊位经营权', certNo: 'TX2026-0002', owner: '长乐区国有资产投资经营有限公司', regNo: '长国资[2025]XX号', regDate: '2025-04-01', validUntil: '2035-03-31', value: 260, status: '闲置', ownershipType: '国有', acquireWay: '政府授权', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2025-04-05', text: '授权文件接收' }], evalLogs: [], useLogs: [], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '商誉', name: '并购鑫源物业形成的商誉', certNo: 'SY2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '—', regDate: '2023-12-31', validUntil: '—', value: 500, status: '已注销', ownershipType: '国有', acquireWay: '并购', amortizeMethod: '不摊销', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-01-10', text: '并购完成，商誉入账登记' }], evalLogs: [{ time: '2025-12-31', text: '减值测试：可收回金额低于账面价值 500 万元' }], useLogs: [], amortizeLogs: [], rightsLogs: [], transferLogs: [{ time: '2026-06-30', text: '全额计提减值，商誉注销' }], disposalLogs: [{ applyDate: '2026-06-15', type: '核销', reason: '减值测试可收回金额低于账面价值', amount: 500, status: '已生效', applicant: '张会计', approvalLogs: [{ time: '2026-06-15', action: '提交处置申请', user: '张会计', type: '提交' }, { time: '2026-06-20', action: '部门审核通过', user: '李经理', type: '通过' }, { time: '2026-06-25', action: '总经理审批通过', user: '王总', type: '通过', comment: '同意核销' }, { time: '2026-06-30', action: '处置生效，资产已注销', user: '系统', type: '生效' }] }] }),
]

/** 权属业务（续展/变更/许可）办理记录 */
const seedIntangibleRightsBiz = [
  { company: '长乐区国有资产投资经营有限公司', assetName: '"长乐城投"服务商标', assetNo: 'WC2026-0003', rightsNo: 'QS2026-0003', type: '续展', applyNo: 'SQ2025120100001', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 100 }], status: '审批通过', createTime: '2025-12-01 10:20', finishTime: '2025-12-18 16:00' },
  { company: '长乐区国有资产投资经营有限公司', assetName: '一种纺织面料节水印染装置', assetNo: 'WC2026-0001', rightsNo: 'QS2026-0001', type: '许可', applyNo: 'SQ2024011000002', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 60 }, { unit: '福建省长乐市鸿运纺织有限公司', ratio: 40 }], status: '审批通过', createTime: '2024-01-10 09:00', finishTime: '2024-01-25 15:30' },
  { company: '长乐区国有资产投资经营有限公司', assetName: '城区公共停车场特许经营权', assetNo: 'WC2026-0006', rightsNo: 'QS2026-0006', type: '变更', applyNo: 'SQ2026082000003', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 80 }, { unit: '长乐城投建设有限公司', ratio: 20 }], status: '审批中', createTime: '2026-08-20 14:10', finishTime: '' },
]

/** 资产处置单（带审批流程设置） */
const seedIntangibleDisposals = [
  { no: 'CZ2026-0001', company: '长乐区国有资产投资经营有限公司', assetName: '并购鑫源物业形成的商誉', assetNo: 'WC2026-0008', type: '核销', reason: '减值测试可收回金额低于账面价值', amount: 500, applicant: '张会计', status: '已生效', createTime: '2026-06-15 10:00', approvals: ['国有资产处置审批流程'] },
  { no: 'CZ2026-0002', company: '长乐区国有资产投资经营有限公司', assetName: '农贸市场摊位经营权', assetNo: 'WC2026-0007', type: '转让', reason: '长期闲置，公开挂牌转让', amount: 240, applicant: '林志强', status: '审批中', createTime: '2026-08-02 09:30', approvals: [] },
  { no: 'CZ2026-0003', company: '长乐城投建设有限公司', assetName: '智能停车道闸控制系统', assetNo: 'WC2026-0002', type: '报废', reason: '技术淘汰，设备整体报废', amount: 0, applicant: '陈志明', status: '已驳回', createTime: '2026-07-11 15:20', approvals: ['企业内部三级审批流程'] },
]

/** 资产档案（权属管理 / 初始化数据） */
const seedIntangibleArchives = [
  { name: '节水印染装置专利权属档案', assetName: '一种纺织面料节水印染装置', company: '长乐区国有资产投资经营有限公司', type: '权属管理', version: 'V2.1', attach: '权属证明扫描件.pdf', createTime: '2026-03-12 10:00' },
  { name: '长乐城投服务商标初始化档案', assetName: '"长乐城投"服务商标', company: '长乐区国有资产投资经营有限公司', type: '初始化数据', version: 'V1.0', attach: '商标注册证.pdf', createTime: '2022-03-20 09:00' },
  { name: '航城片区土地权属初始档案', assetName: '航城片区工业用地（宗地号350112-08）', company: '长乐区国有资产投资经营有限公司', type: '权属初始数据', version: 'V1.2', attach: '不动产权证.pdf', createTime: '2021-06-01 11:00' },
  { name: '停车场特许经营初始化档案', assetName: '城区公共停车场特许经营权', company: '长乐区国有资产投资经营有限公司', type: '初始化数据', version: 'V1.0', attach: '区政府授权文件.pdf', createTime: '2024-01-15 09:30' },
  { name: '资产云管理平台软著权属档案', assetName: '资产云管理平台软件著作权', company: '长乐区国有资产投资经营有限公司', type: '权属管理', version: 'V1.1', attach: '软件著作权证书.pdf', createTime: '2025-02-20 14:00' },
]

/** 无形资产类型字典 */
const seedIntangibleTypes = [
  { name: '专利权', status: '启用', remark: '含发明、实用新型、外观设计专利', createTime: '2021-01-05 09:00', updateTime: '2026-02-10 14:00' },
  { name: '商标权', status: '启用', remark: '注册商标专用权', createTime: '2021-01-05 09:05', updateTime: '2025-11-02 10:20' },
  { name: '著作权', status: '启用', remark: '含软件著作权与作品著作权', createTime: '2021-01-05 09:10', updateTime: '2025-06-18 16:40' },
  { name: '土地使用权', status: '启用', remark: '国有出让/划拨土地使用权', createTime: '2021-01-05 09:15', updateTime: '2024-12-01 11:00' },
  { name: '特许经营权', status: '启用', remark: '政府授权特许经营权益', createTime: '2021-01-05 09:20', updateTime: '2025-03-22 09:50' },
  { name: '商誉', status: '禁用', remark: '并购形成商誉，暂不新增', createTime: '2021-01-05 09:25', updateTime: '2026-06-30 15:00' },
]

/** 参股企业：含股东、年度报告、高管、工作纪要、会议、核销与审批进度 */
const seedEquityCompanies = [
  {
    id: 1, name: '长乐城投建设有限公司', creditCode: '91350112MA32XXXX8F', legalPerson: '郑建国', industry: '城市建设', regCapital: 20000, investAmount: 12000, holdRatio: 60, equityValue: 13200, investDate: '2020-06-18', dividend: 480, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 12000, ratio: 60, way: '货币', paidDate: '2020-06-18' },
      { name: '福建省城市建设发展基金', amount: 5000, ratio: 25, way: '货币', paidDate: '2020-08-01' },
      { name: '长乐区交通建设投资集团', amount: 3000, ratio: 15, way: '实物', paidDate: '2021-01-15' },
    ],
    reports: [
      { year: '2025', revenue: 68200, netProfit: 4180, totalAssets: 152000, totalLiabilities: 86500, auditor: '福建华兴会计师事务所', opinion: '标准无保留' },
      { year: '2024', revenue: 61500, netProfit: 3560, totalAssets: 141800, totalLiabilities: 82300, auditor: '福建华兴会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '郑建国', position: '董事长', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2020-06-18', endDate: '', phone: '13905912001' },
      { name: '王芳', position: '财务负责人', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2021-03-01', endDate: '', phone: '13905912002' },
      { name: '李国强', position: '总经理', appointer: '福建省城市建设发展基金', ours: false, startDate: '2022-05-10', endDate: '', phone: '13905912003' },
    ],
    workNotes: [
      { date: '2026-08-20', recorder: '赵磊', subject: '跟进滨海新城道路 PPP 项目回款', progress: '区财政已拨付第三期可行性缺口补助 4200 万元，剩余 1800 万元待年底结算', nextStep: '9 月底前完成结算资料报送' },
    ],
    meetings: [
      { name: '2026年第一次董事会', time: '2026-03-18 09:30', place: '城投集团 8 楼会议室', attendees: '郑建国、王芳、李国强、陈志明', topic: '审议 2025 年度财务决算与 2026 年度投资计划', resolution: '通过 2025 年度决算报告；批准 2026 年度投资计划 3.2 亿元，其中股权投资不超过 5000 万元' },
    ],
    writeOffs: [],
    approvalSteps: []
  },
  {
    id: 2, name: '长乐区鑫源物业服务有限公司', creditCode: '91350112MAXXXX3Q2N', legalPerson: '陈明', industry: '物业管理', regCapital: 500, investAmount: 175, holdRatio: 35, equityValue: 210, investDate: '2022-09-10', dividend: 42, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 175, ratio: 35, way: '货币', paidDate: '2022-09-10' },
      { name: '陈明', amount: 200, ratio: 40, way: '货币', paidDate: '2022-09-05' },
      { name: '福州榕城社区服务集团', amount: 125, ratio: 25, way: '货币', paidDate: '2022-09-20' },
    ],
    reports: [
      { year: '2025', revenue: 3860, netProfit: 268, totalAssets: 2450, totalLiabilities: 1180, auditor: '福州明信会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '陈明', position: '总经理', appointer: '自然人股东', ours: false, startDate: '2022-09-05', endDate: '', phone: '13905913001' },
      { name: '刘敏', position: '监事', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2022-10-08', endDate: '', phone: '13905913002' },
    ],
    workNotes: [
      { date: '2026-07-15', recorder: '刘敏', subject: '核查保障房小区物业费收缴情况', progress: '首占新区保障房片区收缴率 82%，低于公司平均 91%，已督促张贴催缴公告', nextStep: '8 月底复查收缴率，未达标提请股东会审议' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-04-22 14:00', place: '鑫源物业会议室', attendees: '陈明、刘敏、榕城社区服务集团代表', topic: '审议 2025 年度利润分配方案', resolution: '按持股比例分配利润 120 万元，其中国资方 42 万元；提取盈余公积 30 万元' },
    ],
    writeOffs: [],
    approvalSteps: []
  },
  {
    id: 3, name: '福建海峡新能源科技有限公司', creditCode: '91350100MAXXXX7T5D', legalPerson: '王海涛', industry: '新能源', regCapital: 5000, investAmount: 1000, holdRatio: 20, equityValue: 1150, investDate: '2024-03-28', dividend: 30, status: '变更中',
    shareholders: [
      { name: '王海涛', amount: 2500, ratio: 50, way: '货币+技术', paidDate: '2023-12-01' },
      { name: '长乐区国有资产投资经营有限公司', amount: 1000, ratio: 20, way: '货币', paidDate: '2024-03-28' },
      { name: '平潭综合实验区投资集团', amount: 1500, ratio: 30, way: '货币', paidDate: '2024-01-10' },
    ],
    reports: [
      { year: '2025', revenue: 12600, netProfit: -380, totalAssets: 18900, totalLiabilities: 12400, auditor: '厦门天健会计师事务所', opinion: '带强调事项段' },
      { year: '2024', revenue: 9800, netProfit: 420, totalAssets: 15200, totalLiabilities: 8600, auditor: '厦门天健会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '王海涛', position: '董事长', appointer: '自然人股东', ours: false, startDate: '2023-12-01', endDate: '', phone: '13905914001' },
      { name: '赵磊', position: '董事', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2024-04-15', endDate: '', phone: '13905914002' },
    ],
    workNotes: [
      { date: '2026-09-05', recorder: '赵磊', subject: '增资扩股事项跟进', progress: '投委会已通过追加投资 500 万元议案，等待区国资办备案', nextStep: '备案完成后办理工商变更并回写持股信息' },
      { date: '2026-06-12', recorder: '赵磊', subject: '核查光伏组件产线经营情况', progress: '2025 年受组件价格下行影响亏损 380 万元，2026 年上半年已扭亏为盈 120 万元', nextStep: '关注应收账款回收，必要时计提减值' },
    ],
    meetings: [
      { name: '2026年第二次董事会', time: '2026-08-28 15:00', place: '海峡新能源 3 楼会议室', attendees: '王海涛、赵磊、平潭投资集团代表', topic: '审议光伏组件产线扩建及增资扩股方案', resolution: '同意按股比增资 500 万元用于二期产线，国资方持股比例调整为 23.08%，报区国资办备案' },
    ],
    writeOffs: [],
    approvalSteps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-09-01 10:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2026-09-08 15:30', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '', status: '进行中' },
    ]
  },
  {
    id: 4, name: '长乐文旅发展有限公司', creditCode: '91350112MAXXXX9K3P', legalPerson: '林芳', industry: '文化旅游', regCapital: 3000, investAmount: 900, holdRatio: 30, equityValue: 860, investDate: '2023-05-16', dividend: 0, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 900, ratio: 30, way: '货币', paidDate: '2023-05-16' },
      { name: '福建滨海旅游投资集团', amount: 2100, ratio: 70, way: '货币', paidDate: '2023-05-10' },
    ],
    reports: [
      { year: '2025', revenue: 2140, netProfit: -620, totalAssets: 5800, totalLiabilities: 3900, auditor: '福州明信会计师事务所', opinion: '保留意见' },
    ],
    executives: [
      { name: '林芳', position: '董事长', appointer: '福建滨海旅游投资集团', ours: false, startDate: '2023-05-16', endDate: '', phone: '13905915001' },
      { name: '周琳', position: '财务负责人', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2023-08-01', endDate: '', phone: '13905915002' },
    ],
    workNotes: [
      { date: '2026-05-20', recorder: '周琳', subject: '文旅项目一期减值测试', progress: '滨海营地项目客流量低于可研预期 45%，2025 年亏损 620 万元，已计提长期股权投资减值准备 40 万元', nextStep: '提请股东会审议二期暂缓投资' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-05-28 10:00', place: '文旅公司会议室', attendees: '林芳、周琳、滨海旅游投资集团代表', topic: '审议 2025 年度决算与二期投资计划', resolution: '确认 2025 年度亏损 620 万元，不进行利润分配；二期投资暂缓，待客流恢复后重新评估' },
    ],
    writeOffs: [
      { year: '2025', amount: 40, reason: '滨海营地项目一期持续亏损，按减值测试结果核销长期股权投资', source: '减值准备', approver: '区国资办 林主任', approveTime: '2025-12-28 16:20' },
    ],
    approvalSteps: []
  },
]

/** 股权变更记录（含三级审批步骤；审批中记录携带 pending 生效载荷） */
const seedEquityChangeRecords = [
  { company: '福建海峡新能源科技有限公司', type: '增资扩股', before: '出资 1000 万元（20%）', after: '出资 1500 万元（23.08%）', reason: '标的公司扩建光伏组件产线，按股比追加投资', applyDate: '2026-09-01', status: '审批中',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-09-01 10:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2026-09-08 15:30', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '', status: '进行中' },
    ] },
  { company: '长乐城投建设有限公司', type: '股权转让', before: '持股 60%', after: '持股 51%', reason: '引入省城投战略投资者，划转 9% 股权', applyDate: '2025-11-20', status: '已生效',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2025-11-20 09:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2025-12-02 14:00', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '2025-12-20 16:00', status: '已完成' },
    ] },
  { company: '长乐文旅发展有限公司', type: '减资', before: '出资 1200 万元（40%）', after: '出资 900 万元（30%）', reason: '文旅项目一期收缩，按章程减资', applyDate: '2025-06-15', status: '已驳回',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2025-06-15 11:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2025-07-01 10:30', status: '已完成' },
    ] },
]

/** 股权质押 / 冻结记录 */
const seedEquityPledges = [
  { company: '长乐城投建设有限公司', type: '质押', ratio: 15, counterparty: '工商银行长乐支行', startDate: '2025-03-10', status: '生效中' },
  { company: '长乐区鑫源物业服务有限公司', type: '质押', ratio: 35, counterparty: '兴业银行福州分行', startDate: '2024-05-20', status: '已解除' },
]

/** 股权核销工单（含核销前后股权对比与审核步骤） */
const seedEquityWriteoffs = [
  { id: 1, equity: '长乐文旅发展有限公司', title: '文旅项目一期减值核销', amount: 40, reason: '滨海营地项目一期持续亏损，按减值测试结果核销长期股权投资', attach: '核销审批单.pdf', status: '已通过', createTime: '2025-12-20 09:30', lastEdit: '2025-12-28 16:20', finishTime: '2025-12-28 16:20',
    before: [{ name: '长乐区国有资产投资经营有限公司', ratio: 30, subscribed: 900, paid: 900, removed: true }, { name: '福建滨海旅游投资集团', ratio: 70, subscribed: 2100, paid: 2100 }],
    after: [{ name: '福建滨海旅游投资集团', ratio: 70, subscribed: 2100, paid: 2100 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '周琳', time: '2025-12-22 10:00', attach: '财务审核意见.pdf' },
      { level: '二级审批（分管领导）', auditor: '王副总', time: '2025-12-25 14:30', attach: '审批签呈.pdf' },
      { level: '三级审批（区国资办）', auditor: '林主任', time: '2025-12-28 16:20', attach: '国资办批复.pdf' },
    ] },
  { id: 2, equity: '福建海峡新能源科技有限公司', title: '光伏组件产线减值核销申请', amount: 120, reason: '组件价格下行导致产线减值，申请核销部分股权投资', attach: '减值测试报告.pdf', status: '已拒绝', createTime: '2026-02-10 09:00', lastEdit: '2026-03-02 11:00', finishTime: '2026-03-02 11:00',
    before: [{ name: '长乐区国有资产投资经营有限公司', ratio: 20, subscribed: 1000, paid: 1000, removed: true }, { name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 }, { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 }],
    after: [{ name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 }, { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '王芳', time: '2026-02-15 10:30', attach: '财务审核意见.pdf' },
      { level: '二级审批（投资决策委员会）', auditor: '投委会', time: '2026-03-02 11:00', attach: '驳回意见书.pdf' },
    ] },
  { id: 3, equity: '长乐区鑫源物业服务有限公司', title: '保障房片区应收款坏账核销', amount: 15, reason: '物业费长期欠缴形成坏账，按程序核销对应投资权益', attach: '坏账核销审批单.pdf', status: '已通过', createTime: '2026-05-08 14:00', lastEdit: '2026-05-20 09:40', finishTime: '2026-05-20 09:40',
    before: [{ name: '陈明', ratio: 40, subscribed: 200, paid: 200, removed: true }, { name: '长乐区国有资产投资经营有限公司', ratio: 35, subscribed: 175, paid: 175 }, { name: '福州榕城社区服务集团', ratio: 25, subscribed: 125, paid: 125 }],
    after: [{ name: '长乐区国有资产投资经营有限公司', ratio: 35, subscribed: 160, paid: 160 }, { name: '福州榕城社区服务集团', ratio: 25, subscribed: 125, paid: 125 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '刘敏', time: '2026-05-12 10:00', attach: '财务审核意见.pdf' },
      { level: '二级审批（区国资办）', auditor: '林主任', time: '2026-05-20 09:40', attach: '国资办批复.pdf' },
    ] },
]

/** 股权登记台账 */
const seedEquityRegs = [
  { id: 1, name: '长乐城投建设有限公司', regCapital: 20000, address: '福建省福州市长乐区航城街道会堂路158号', contact: '0591-28923001', createTime: '2020-06-18 10:20', lastEdit: '2026-08-12 15:30', legalPerson: '郑建国', estDate: '2020-06-18', approveDate: '2020-06-15', regOrg: '福州市长乐区市场监督管理局', regStatus: '在营（开业）', term: ['2020-06-18', '2050-06-17'], scope: '城市基础设施投资建设与经营、市政公用工程施工、房地产开发经营',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', subscribed: 12000, paid: 12000, ratio: 60 },
      { name: '福建省城市建设发展基金', subscribed: 5000, paid: 5000, ratio: 25 },
      { name: '长乐区交通建设投资集团', subscribed: 3000, paid: 2400, ratio: 15 },
    ],
    execs: [
      { name: '郑建国', position: '董事长', intro: '长期从事城市建设投资管理工作，主持公司全面工作', resumeFile: '郑建国简历.pdf', createTime: '2020-06-18 11:00' },
      { name: '王芳', position: '财务负责人', intro: '注册会计师，负责财务与融资管理', resumeFile: '王芳简历.pdf', createTime: '2021-03-01 09:30' },
    ],
    meetings: [
      { name: '2026年第一次董事会', time: '2026-03-18 09:30', place: '城投集团8楼会议室', attendees: '郑建国、王芳、李国强、陈志明', resolution: '通过2025年度决算报告，批准2026年度投资计划3.2亿元' },
    ],
    workReports: [
      { period: '2026年上半年', reporter: '赵磊', content: '滨海新城道路PPP项目第三期回款4200万元到账，剩余1800万元待年底结算', createTime: '2026-07-05 16:00' },
    ],
    finances: [
      { year: '2025', revenue: 68200, netProfit: 4180, totalAssets: 152000, totalLiabilities: 86500 },
      { year: '2024', revenue: 61500, netProfit: 3560, totalAssets: 141800, totalLiabilities: 82300 },
    ],
    changes: [
      { title: '股权转让变更审批', type: '股权转让', reason: '引入省城投战略投资者，划转9%股权', content: '国资持股比例由60%调整为51%', attach: '股权转让协议.pdf', status: '已通过', finishTime: '2025-12-20 16:00',
        before: [
          { name: '长乐区国有资产投资经营有限公司', ratio: 60, subscribed: 12000, paid: 12000 },
          { name: '福建省城市建设发展基金', ratio: 25, subscribed: 5000, paid: 5000 },
          { name: '长乐区交通建设投资集团', ratio: 15, subscribed: 3000, paid: 2400 },
        ],
        after: [
          { name: '长乐区国有资产投资经营有限公司', ratio: 51, subscribed: 10200, paid: 10200 },
          { name: '福建省城市建设发展基金', ratio: 25, subscribed: 5000, paid: 5000 },
          { name: '长乐区交通建设投资集团', ratio: 15, subscribed: 3000, paid: 2400 },
          { name: '省城投战略投资者', ratio: 9, subscribed: 1800, paid: 1800 },
        ] },
    ] },
  { id: 2, name: '福建海峡新能源科技有限公司', regCapital: 5000, address: '福建省福州市鼓楼区软件园C区23号楼', contact: '0591-87345002', createTime: '2024-03-28 14:00', lastEdit: '2026-09-05 10:12', legalPerson: '王海涛', estDate: '2023-12-01', approveDate: '2023-11-28', regOrg: '福州市鼓楼区市场监督管理局', regStatus: '存续', term: ['2023-12-01', '2043-11-30'], scope: '光伏组件研发、生产与销售，新能源电站投资建设',
    shareholders: [
      { name: '王海涛', subscribed: 2500, paid: 2500, ratio: 50 },
      { name: '长乐区国有资产投资经营有限公司', subscribed: 1000, paid: 1000, ratio: 20 },
      { name: '平潭综合实验区投资集团', subscribed: 1500, paid: 1500, ratio: 30 },
    ],
    execs: [
      { name: '王海涛', position: '董事长', intro: '新能源行业资深专家，主导光伏组件技术研发', resumeFile: '王海涛简历.pdf', createTime: '2023-12-01 09:00' },
      { name: '赵磊', position: '董事', intro: '国资方委派董事，负责投资监管', resumeFile: '赵磊简历.pdf', createTime: '2024-04-15 10:00' },
    ],
    meetings: [
      { name: '2026年第二次董事会', time: '2026-08-28 15:00', place: '海峡新能源3楼会议室', attendees: '王海涛、赵磊、平潭投资集团代表', resolution: '同意按股比增资500万元用于二期产线，报区国资办备案' },
    ],
    workReports: [
      { period: '2026年三季度', reporter: '赵磊', content: '增资扩股事项投委会已通过，等待区国资办备案后办理工商变更', createTime: '2026-09-05 10:00' },
    ],
    finances: [
      { year: '2025', revenue: 12600, netProfit: -380, totalAssets: 18900, totalLiabilities: 12400 },
      { year: '2024', revenue: 9800, netProfit: 420, totalAssets: 15200, totalLiabilities: 8600 },
    ],
    changes: [
      { title: '增资扩股变更审批', type: '增资扩股', reason: '扩建光伏组件二期产线，按股比追加投资', content: '国资出资由1000万元增至1500万元，持股比例调整为23.08%', attach: '增资扩股协议.pdf', status: '审批中', finishTime: '',
        before: [
          { name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 },
          { name: '长乐区国有资产投资经营有限公司', ratio: 20, subscribed: 1000, paid: 1000 },
          { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 },
        ],
        after: [
          { name: '王海涛', ratio: 46.15, subscribed: 3000, paid: 2500 },
          { name: '长乐区国有资产投资经营有限公司', ratio: 23.08, subscribed: 1500, paid: 1000 },
          { name: '平潭综合实验区投资集团', ratio: 30.77, subscribed: 2000, paid: 1500 },
        ] },
    ] },
  { id: 3, name: '长乐文旅发展有限公司', regCapital: 3000, address: '福建省福州市长乐区吴航街道郑和中路12号', contact: '0591-28812345', createTime: '2023-05-16 09:00', lastEdit: '2026-05-28 11:30', legalPerson: '林芳', estDate: '2023-05-16', approveDate: '2023-05-12', regOrg: '福州市长乐区市场监督管理局', regStatus: '在营（开业）', term: ['2023-05-16', '2053-05-15'], scope: '文化旅游项目开发、景区运营管理、文创产品销售',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', subscribed: 900, paid: 900, ratio: 30 },
      { name: '福建滨海旅游投资集团', subscribed: 2100, paid: 2100, ratio: 70 },
    ],
    execs: [
      { name: '林芳', position: '董事长', intro: '文旅行业经营管理经验丰富', resumeFile: '林芳简历.pdf', createTime: '2023-05-16 10:00' },
      { name: '周琳', position: '财务负责人', intro: '国资方委派财务负责人', resumeFile: '周琳简历.pdf', createTime: '2023-08-01 09:00' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-05-28 10:00', place: '文旅公司会议室', attendees: '林芳、周琳、滨海旅游投资集团代表', resolution: '确认2025年度亏损620万元，不进行利润分配，二期投资暂缓' },
    ],
    workReports: [
      { period: '2026年上半年', reporter: '周琳', content: '滨海营地项目客流量低于可研预期45%，已计提长期股权投资减值准备40万元', createTime: '2026-06-30 15:00' },
    ],
    finances: [
      { year: '2025', revenue: 2140, netProfit: -620, totalAssets: 5800, totalLiabilities: 3900 },
    ],
    changes: [] },
]

export const useSpecialAssetStore = defineStore('special', () => {
  /* ============================ state：无形资产 ============================ */
  const intangibleAssets = ref(JSON.parse(JSON.stringify(seedIntangibleAssets)))
  intangibleAssets.value.forEach(enrichIntangibleAsset)
  const intangibleRightsBiz = ref(JSON.parse(JSON.stringify(seedIntangibleRightsBiz)))
  const intangibleDisposals = ref(JSON.parse(JSON.stringify(seedIntangibleDisposals)))
  const intangibleArchives = ref(JSON.parse(JSON.stringify(seedIntangibleArchives)))
  const intangibleTypes = ref(JSON.parse(JSON.stringify(seedIntangibleTypes)))

  /* ============================ state：股权投资 ============================ */
  const equityCompanies = ref(JSON.parse(JSON.stringify(seedEquityCompanies)))
  const equityChangeRecords = ref(JSON.parse(JSON.stringify(seedEquityChangeRecords)))
  const equityPledges = ref(JSON.parse(JSON.stringify(seedEquityPledges)))
  const equityWriteoffs = ref(JSON.parse(JSON.stringify(seedEquityWriteoffs)))
  const equityRegList = ref(JSON.parse(JSON.stringify(seedEquityRegs)))

  /* ==================== 留痕helper：统一 module / 口径 / 操作人 ==================== */
  function iaEvent(asset, payload) {
    return useAuditStore().recordEvent({
      assetId: asset.assetNo || asset.certNo || '',
      assetName: asset.name || '',
      group: asset.company || asset.owner || IA_DEFAULT_OWNER,
      module: IA_MODULE,
      billNo: asset.assetNo || '',
      ...payload
    })
  }

  function iaDiff(asset, { action, before, after, fields, remark, billNo }) {
    return useAuditStore().recordDiff({
      assetId: asset.assetNo || asset.certNo || '',
      assetName: asset.name || '',
      group: asset.company || asset.owner || IA_DEFAULT_OWNER,
      module: IA_MODULE,
      action,
      billNo: billNo || asset.assetNo || '',
      remark,
      before,
      after,
      fields
    })
  }

  function eqEvent(company, payload) {
    return useAuditStore().recordEvent({
      assetId: company.creditCode || company.code || '',
      assetName: company.name || '',
      group: EQ_INVESTOR,
      module: EQ_MODULE,
      billNo: company.creditCode || '',
      ...payload
    })
  }

  function eqDiff(company, { action, before, after, fields, remark, billNo }) {
    return useAuditStore().recordDiff({
      assetId: company.creditCode || '',
      assetName: company.name || '',
      group: EQ_INVESTOR,
      module: EQ_MODULE,
      action,
      billNo: billNo || company.creditCode || '',
      remark,
      before,
      after,
      fields
    })
  }

  /* ============================ 无形资产：查询 ============================ */
  function findIntangible(id) {
    if (!id) return null
    return intangibleAssets.value.find(a => a.uid === id || a.assetNo === id || a.certNo === id) || null
  }

  function intangibleSeq() {
    return intangibleAssets.value.length + 1
  }

  /* 台账列表补全时按序号发号；新增资产永远追加新号，不回收，故 uid/assetNo 唯一 */
  function nextIntangibleCodes() {
    const idx = intangibleSeq()
    return {
      idx,
      uid: `IA${String(idx).padStart(3, '0')}`,
      assetNo: `WC2026-${String(idx).padStart(4, '0')}`,
      rightsNo: `QS2026-${String(idx).padStart(4, '0')}`,
    }
  }

  /* ==================== 无形资产：登记（两个入口共用一套档案结构） ==================== */

  /** 「登记新增」弹框：以权证要素登记，登记后为闲置状态 */
  function buildFromRegisterForm(f) {
    const t = todayStr()
    const codes = nextIntangibleCodes()
    const a = makeAsset({
      ...f,
      status: '闲置',
      ownershipType: '国有',
      coOwner: '',
      otherRights: '',
      receiveLogs: [{ time: t, text: '完成权证接收登记' }],
    })
    Object.assign(a, codes, {
      company: f.owner,
      manager: IA_MANAGERS[0],
      region: [...IA_REGION],
      regionText: IA_REGION.join(''),
      lnglat: '',
      initValue: f.value,
      createTime: nowTime(),
      updateTime: nowTime(),
      attachments: [],
      patentNo: f.patentType ? f.regNo : '—',
      patentOwner: f.owner,
      patentField: '—',
      applyDate: f.regDate,
      grantDate: f.regDate,
      claimSummary: f.summary || '',
      desc: f.summary || '',
      rightsValid: f.validUntil,
      holdType: '单独所有',
      rightsRatioType: '单独所有',
      acquireDate: f.regDate,
      holders: [{ unit: f.owner, ratio: 100 }],
      opLogs: {
        receive: [{ source: f.acquireWay, sourceParty: f.owner, docNo: f.regNo || '—', acquireDate: f.regDate, cost: f.value, receiveDate: t, handler: IA_MANAGERS[0], note: '完成权证接收登记' }],
        evaluate: [],
        use: [],
        amortize: [],
        ownership: [],
      },
    })
    return a
  }

  /** 「新增」保存表单：以资产要素 + 专利要素完整登记 */
  function buildFromSaveForm(f) {
    const t = todayStr()
    const codes = nextIntangibleCodes()
    const a = makeAsset({
      category: f.category,
      name: f.name,
      certNo: f.patentNo || `ZC${t.slice(0, 4)}-${String(codes.idx).padStart(4, '0')}`,
      owner: f.company,
      regNo: f.materialNo || '—',
      regDate: t,
      validUntil: (f.useTerm && f.useTerm[1]) || '—',
      value: f.initValue,
      status: '闲置',
      ownershipType: '国有',
      acquireWay: f.acquireWay,
      amortizeMethod: '直线法',
      patentType: f.patentType,
      summary: f.desc,
      coOwner: '',
      otherRights: '',
      receiveLogs: [{ time: t, text: '完成资产接收登记' }],
    })
    Object.assign(a, codes, {
      company: f.company,
      manager: f.manager || '—',
      region: f.region || [],
      regionText: (f.region || []).join(''),
      lnglat: f.lnglat,
      initValue: f.initValue,
      createTime: nowTime(),
      updateTime: nowTime(),
      attachments: [],
      patentNo: f.patentNo || '—',
      patentOwner: f.patentOwner || f.company,
      patentField: f.techField || '—',
      applyDate: f.applyDate || '',
      grantDate: f.grantDate || '',
      claimSummary: f.claimSummary,
      desc: f.desc,
      rightsValid: (f.useTerm && f.useTerm[1]) || '—',
      holdType: '单独所有',
      rightsRatioType: '单独所有',
      acquireDate: (f.useTerm && f.useTerm[0]) || t,
      holders: [{ unit: f.company, ratio: 100 }],
      opLogs: {
        receive: [{ source: '新增登记', sourceParty: f.company, docNo: f.materialNo || '—', acquireDate: t, cost: f.initValue, receiveDate: t, handler: f.manager || '—', note: '初始登记入库' }],
        evaluate: [],
        use: [],
        amortize: [],
        ownership: [],
      },
    })
    return a
  }

  function registerIntangibleAsset(f) {
    if (!f.name || !f.certNo || !f.owner || !f.regDate || !f.validUntil) {
      return { ok: false, msg: '请填写完整的登记信息' }
    }
    if (intangibleAssets.value.some(a => a.certNo === f.certNo)) {
      return { ok: false, msg: '证书编号已存在' }
    }
    const a = buildFromRegisterForm(f)
    intangibleAssets.value.unshift(a)
    iaEvent(a, {
      action: '登记无形资产',
      remark: f.summary || '',
      detail: `${a.category} / 账面价值 ${a.value} 万元 / 证书 ${a.certNo}`
    })
    return { ok: true, msg: '无形资产登记成功', asset: a }
  }

  function saveIntangibleAsset(f) {
    if (!f.name || !f.company) {
      return { ok: false, msg: '请填写资产名称与所属公司' }
    }
    const a = buildFromSaveForm(f)
    intangibleAssets.value.unshift(a)
    iaEvent(a, {
      action: '登记无形资产',
      remark: f.desc || '',
      detail: `${a.category} / 初始入账 ${a.initValue} 万元 / 编号 ${a.assetNo}`
    })
    return { ok: true, msg: '无形资产保存成功', asset: a }
  }

  /* ==================== 无形资产：评估 / 摊销 ==================== */
  function evaluateIntangible(id, { agency, evalValue, baseDate }) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    const value = Number(evalValue)
    if (!value) return { ok: false, msg: '请填写评估价值' }
    const date = baseDate || todayStr()
    const text = `${agency}：评估价值 ${value} 万元`
    const before = a.value
    a.evalLogs.push({ time: date, text })
    if (a.opLogs) a.opLogs.evaluate.push({ source: '委托评估', sourceParty: agency, date, note: text })
    a.value = value
    a.updateTime = nowTime()
    iaDiff(a, { action: '价值评估', before: { value: before }, after: { value }, fields: ['value'], remark: text, billNo: `PG-${a.assetNo}-${date}` })
    iaEvent(a, { action: '无形资产评估', detail: `${agency} 评估价值 ${value} 万元（基准日 ${date}）`, billNo: `PG-${a.assetNo}-${date}` })
    return { ok: true, msg: '评估记录已保存，账面价值已更新' }
  }

  function amortizeIntangible(id, { period, amount, method, remark }) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    if (!period || period.length < 2) return { ok: false, msg: '请选择摊销期间' }
    const value = Number(amount)
    if (!value || value <= 0) return { ok: false, msg: '请填写摊销金额' }
    const totalAmortized = a.amortizeLogs.reduce((s, l) => s + l.amount, 0)
    if (totalAmortized + value > a.value) return { ok: false, msg: '摊销金额超出账面价值' }
    const bookValue = +(a.value - totalAmortized - value).toFixed(2)
    const log = {
      period: `${period[0]} ~ ${period[1]}`,
      amount: value,
      bookValue,
      method,
      remark: remark || `${period[0]}至${period[1]}摊销`,
    }
    a.amortizeLogs.push(log)
    if (a.opLogs) {
      if (a.opLogs.amortize !== a.amortizeLogs) a.opLogs.amortize.push({ ...log })
      a.updateTime = nowTime()
    }
    iaEvent(a, {
      action: '无形资产摊销',
      billNo: `TX-${a.assetNo}-${period[1]}`,
      detail: `摊销 ${value} 万元，摊后账面价值 ${bookValue} 万元（${method}）`,
      remark: log.remark
    })
    return { ok: true, msg: '摊销记录已保存', bookValue }
  }

  /* ==================== 无形资产：权属维权 / 停启用 / 权属变更 ==================== */
  function rightsActionIntangible(id, { type, date, content, target, validUntil, fee }) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    if (!date || !content) return { ok: false, msg: '请填写日期和内容说明' }
    if (type === '许可' && !target) return { ok: false, msg: '许可类型需填写许可对象' }
    a.rightsLogs.push({ type, date, content, target: target || '', validUntil: validUntil || '', fee: fee || 0 })
    if (type === '许可') {
      const text = `许可${target}使用，费用 ${fee || 0} 万元/年`
      a.useLogs.push({ time: date, text })
      if (a.opLogs) a.opLogs.use.push({ source: '许可使用', useParty: target, date, note: text })
    }
    if (type === '续展' && validUntil) {
      const before = a.validUntil
      a.validUntil = validUntil
      a.transferLogs.push({ time: date, text: `权证续展，新有效期至 ${validUntil}` })
      iaDiff(a, { action: '权证续展', before: { validUntil: before }, after: { validUntil }, fields: ['validUntil'], remark: content, billNo: `XZ-${a.assetNo}-${date}` })
    }
    a.updateTime = nowTime()
    iaEvent(a, {
      action: `权属维权-${type}`,
      billNo: `WQ-${a.assetNo}-${date}`,
      detail: `${type}${target ? `（${target}）` : ''}，${content}`,
      remark: validUntil ? `有效期至 ${validUntil}` : ''
    })
    return { ok: true, msg: '权属维权记录已保存' }
  }

  function changeIntangibleStatus(id, next, action, logText) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    const before = a.status
    if (before === next) return { ok: false, msg: `资产已是「${next}」状态` }
    a.status = next
    a.updateTime = nowTime()
    a.transferLogs.push({ time: todayStr(), text: logText })
    iaDiff(a, { action, before: { status: before }, after: { status: next }, fields: ['status'], remark: logText })
    return { ok: true, msg: action === '资产停用' ? '资产已停用' : '资产已重新启用' }
  }

  function suspendIntangible(id) {
    return changeIntangibleStatus(id, '已停用', '资产停用', '资产停用')
  }

  function resumeIntangible(id) {
    return changeIntangibleStatus(id, '使用中', '资产启用', '资产重新启用')
  }

  function transferIntangibleOwnership(id, newOwner) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    const name = (newOwner || '').trim()
    if (!name) return { ok: false, msg: '请输入变更后权属人名称' }
    const date = todayStr()
    const before = a.owner
    a.owner = name
    a.updateTime = nowTime()
    a.transferLogs.push({ time: date, text: `权属由"${before}"变更为"${name}"` })
    a.rightsLogs.push({ type: '变更', date, content: `权属人由"${before}"变更为"${name}"`, target: name, validUntil: '' })
    if (a.holders && a.holders.length) a.holders[0] = { ...a.holders[0], unit: name }
    iaDiff(a, { action: '权属变更', before: { owner: before }, after: { owner: name }, fields: ['owner'], remark: `权属人变更为 ${name}`, billNo: `QS-${a.assetNo}-${date}` })
    return { ok: true, msg: '权属变更已记录' }
  }

  /* ==================== 无形资产：处置申请与审批 ==================== */
  function disposeIntangible(id, { type, reason, amount, receiver }) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    if (!reason) return { ok: false, msg: '请填写处置原因' }
    const date = todayStr()
    const applicant = actorName()
    const record = {
      applyDate: date,
      type,
      reason,
      amount: amount || null,
      receiver: receiver || '',
      status: '审批中',
      applicant,
      approvalLogs: [{ time: date, action: '提交处置申请', user: applicant, type: '提交' }],
    }
    const before = a.status
    a.disposalLogs.push(record)
    a.status = '处置中'
    a.updateTime = nowTime()
    intangibleDisposals.value.unshift({
      no: `CZ2026-${String(intangibleDisposals.value.length + 1).padStart(4, '0')}`,
      company: a.company,
      assetName: a.name,
      assetNo: a.assetNo,
      type,
      reason,
      amount: amount || 0,
      applicant,
      status: '审批中',
      createTime: nowTime(),
      approvals: [],
    })
    iaDiff(a, { action: '提交处置申请', before: { status: before }, after: { status: a.status }, fields: ['status'], remark: `${type}：${reason}`, billNo: record.applyDate })
    iaEvent(a, {
      action: '申请处置无形资产',
      detail: `${type}${amount ? ` ${amount} 万元` : ''}，接收方 ${receiver || '—'}`,
      remark: reason
    })
    return { ok: true, msg: '处置申请已提交审批', record }
  }

  function approveIntangibleDisposal(certNo, disposal) {
    const a = intangibleAssets.value.find(x => x.certNo === certNo)
    if (!a) return { ok: false, msg: '未找到该处置单对应的资产' }
    const date = todayStr()
    const target = a.disposalLogs.find(d => d.applyDate === disposal.applyDate && d.type === disposal.type)
    if (target) {
      target.status = '已通过'
      target.approvalLogs = target.approvalLogs || []
      target.approvalLogs.push({ time: date, action: '审批通过', user: actorName(), type: '通过', comment: '同意处置' })
      target.approvalLogs.push({ time: date, action: '处置生效', user: '系统', type: '生效' })
    }
    const row = intangibleDisposals.value.find(d => d.assetNo === a.assetNo && d.status === '审批中')
    if (row) row.status = '已通过'
    const before = a.status
    a.status = '已注销'
    a.updateTime = nowTime()
    a.transferLogs.push({ time: date, text: `${disposal.type}处置完成，资产注销` })
    iaDiff(a, { action: '处置审批通过', before: { status: before }, after: { status: a.status }, fields: ['status'], remark: `${disposal.type}处置完成，资产注销` })
    iaEvent(a, {
      action: '处置无形资产',
      detail: `${disposal.type}${disposal.amount ? `，处置金额 ${disposal.amount} 万元` : ''}`,
      remark: disposal.reason || ''
    })
    return { ok: true, msg: '处置审批已通过，资产已注销' }
  }

  function saveIntangibleDispose(editRow, { assetNo, type, amount, reason }) {
    const a = findIntangible(assetNo)
    if (!a) return { ok: false, msg: '请选择资产' }
    if (!reason) return { ok: false, msg: '请填写处置原因' }
    if (editRow) {
      const row = intangibleDisposals.value.find(d => d.no === editRow.no)
      if (!row) return { ok: false, msg: '未找到该处置单' }
      const before = { type: row.type, amount: row.amount, reason: row.reason }
      Object.assign(row, { type, amount, reason })
      iaDiff(a, { action: '修改资产处置单', before, after: { type, amount, reason }, fields: ['type', 'amount', 'reason'], remark: `处置单 ${row.no}`, billNo: row.no })
      return { ok: true, msg: '资产处置已修改' }
    }
    const no = `CZ2026-${String(intangibleDisposals.value.length + 1).padStart(4, '0')}`
    intangibleDisposals.value.unshift({
      no,
      company: a.company,
      assetName: a.name,
      assetNo: a.assetNo,
      type,
      reason,
      amount,
      applicant: actorName(),
      status: '审批中',
      createTime: nowTime(),
      approvals: [],
    })
    iaEvent(a, { action: '新增资产处置单', billNo: no, detail: `${type}，处置金额 ${amount || 0} 万元`, remark: reason })
    return { ok: true, msg: '资产处置已新增' }
  }

  function removeIntangibleDispose(no) {
    const idx = intangibleDisposals.value.findIndex(d => d.no === no)
    if (idx === -1) return { ok: false, msg: '未找到该处置单' }
    const [removed] = intangibleDisposals.value.splice(idx, 1)
    const a = findIntangible(removed.assetNo)
    if (a) iaEvent(a, { action: '删除资产处置单', billNo: removed.no, remark: removed.reason, detail: `${removed.type} ${removed.amount || 0} 万元` })
    return { ok: true, msg: '已删除' }
  }

  function setDisposeApproval(no, approvals) {
    const row = intangibleDisposals.value.find(d => d.no === no)
    if (!row) return { ok: false, msg: '未找到该处置单' }
    const before = row.approvals ? row.approvals.join('、') : ''
    row.approvals = [...(approvals || [])]
    const a = findIntangible(row.assetNo)
    const detail = row.approvals.length ? row.approvals.join('、') : '清空审批流程'
    if (a) iaEvent(a, { action: '设置处置审批流程', billNo: no, detail, remark: `原审批流程：${before || '无'}` })
    return { ok: true, msg: '处置审批流程设置成功' }
  }

  /* ==================== 无形资产：权属业务（续展/变更/许可） ==================== */
  function submitRightsBiz(id, { type, applyNo, holders }) {
    const a = findIntangible(id)
    if (!a) return { ok: false, msg: '未找到该无形资产' }
    const list = (holders || []).filter(h => h.unit)
    if (!list.length) return { ok: false, msg: '请填写权利人信息' }
    const date = todayStr()
    intangibleRightsBiz.value.unshift({
      company: a.company,
      assetName: a.name,
      assetNo: a.assetNo,
      rightsNo: a.rightsNo,
      type,
      applyNo,
      holders: list.map(h => ({ ...h })),
      status: '审批中',
      createTime: nowTime(),
      finishTime: '',
    })
    a.rightsLogs.push({ type, date, content: `${type}业务已提交，申请单号 ${applyNo}`, target: list[0].unit, validUntil: '' })
    if (a.opLogs) {
      a.opLogs.ownership.push({ type, holder: list[0].unit, ratio: list[0].ratio, date, applyNo, status: '审批中' })
      a.updateTime = nowTime()
    }
    iaEvent(a, {
      action: `提交权属业务-${type}`,
      billNo: applyNo,
      detail: `权利人 ${list.map(h => `${h.unit}(${h.ratio}%)`).join('、')}`,
      remark: `${type}业务申请`
    })
    return { ok: true, msg: '权属业务已提交' }
  }

  /* ==================== 无形资产：类型管理 ==================== */
  function findIntangibleType(name) {
    return intangibleTypes.value.find(t => t.name === name) || null
  }

  function updateIntangibleType(name, { name: nextName, remark }) {
    const t = findIntangibleType(name)
    if (!t) return { ok: false, msg: '未找到该类型' }
    const next = (nextName || '').trim()
    if (!next) return { ok: false, msg: '请填写类型名称' }
    if (next !== name && findIntangibleType(next)) return { ok: false, msg: `类型「${next}」已存在` }
    const before = { name: t.name, remark: t.remark }
    t.name = next
    t.remark = remark
    t.updateTime = nowTime()
    useAuditStore().recordDiff({
      assetId: name, assetName: `无形资产类型-${next}`, group: IA_DEFAULT_OWNER, module: IA_MODULE,
      action: '修改资产类型', billNo: `TYPE-${next}`,
      before, after: { name: next, remark }, fields: ['name', 'remark'], remark: `类型编码 ${name}`
    })
    return { ok: true, msg: '类型已修改' }
  }

  function toggleIntangibleType(name) {
    const t = findIntangibleType(name)
    if (!t) return { ok: false, msg: '未找到该类型' }
    const before = t.status
    t.status = before === '启用' ? '禁用' : '启用'
    t.updateTime = nowTime()
    useAuditStore().recordDiff({
      assetId: name, assetName: `无形资产类型-${t.name}`, group: IA_DEFAULT_OWNER, module: IA_MODULE,
      action: t.status === '启用' ? '启用资产类型' : '禁用资产类型', billNo: `TYPE-${t.name}`,
      before: { status: before }, after: { status: t.status }, fields: ['status'], remark: `类型${t.status}`
    })
    return { ok: true, msg: `类型"${t.name}"已${t.status}` }
  }

  /* ==================== 股权投资：查询与合计 ==================== */
  function findCompany(id) {
    return equityCompanies.value.find(c => c.id === id) || null
  }

  const totalInvest = computed(() => equityCompanies.value.reduce((s, c) => s + c.investAmount, 0).toFixed(0))
  const totalEquity = computed(() => equityCompanies.value.reduce((s, c) => s + c.equityValue, 0).toFixed(0))
  const totalDividend = computed(() => equityCompanies.value.reduce((s, c) => s + c.dividend, 0).toFixed(0))
  const intangibleTotalValue = computed(() => intangibleAssets.value.filter(a => a.status !== '已注销').reduce((s, a) => s + a.value, 0).toFixed(0))

  function saveCompany(form) {
    if (!form.name || !form.creditCode || !form.regCapital || !form.investAmount) {
      return { ok: false, msg: '请填写完整的企业信息' }
    }
    const date = form.investDate || todayStr()
    const holdRatio = form.regCapital ? +((form.investAmount / form.regCapital) * 100).toFixed(2) : 0
    const c = {
      id: equityCompanies.value.reduce((m, x) => Math.max(m, x.id), 0) + 1,
      name: form.name,
      creditCode: form.creditCode,
      legalPerson: form.legalPerson || '—',
      industry: form.industry,
      regCapital: form.regCapital,
      investAmount: form.investAmount,
      holdRatio,
      equityValue: form.investAmount,
      investDate: date,
      dividend: 0,
      status: '正常',
      shareholders: [{ name: EQ_INVESTOR, amount: form.investAmount, ratio: holdRatio, way: '货币', paidDate: date }],
      reports: [], executives: [], workNotes: [], meetings: [], writeOffs: [],
      approvalSteps: [],
    }
    equityCompanies.value.push(c)
    eqEvent(c, {
      action: '登记参股企业',
      detail: `我方出资 ${c.investAmount} 万元，持股 ${c.holdRatio}%`,
      remark: `${c.industry || '—'} / 注册资本 ${c.regCapital} 万元`
    })
    return { ok: true, msg: '参股企业已登记', company: c }
  }

  function saveMaintain(companyId, type, data, index = -1) {
    const c = findCompany(companyId)
    if (!c) return { ok: false, msg: '请先选择参股企业' }
    const key = EQ_MAINTAIN_KEYS[type]
    if (!key) return { ok: false, msg: '未知的年度维护类型' }
    const list = c[key] || (c[key] = [])
    const label = EQ_MAINTAIN_LABELS[type]

    if (type === 'writeoff') {
      const amount = Number(data.amount) || 0
      if (amount <= 0) return { ok: false, msg: '请填写核销金额' }
      if (amount > c.equityValue) {
        return { ok: false, msg: `核销金额 ${amount} 万元超出当前权益价值 ${c.equityValue.toLocaleString()} 万元` }
      }
      const before = c.equityValue
      list.push({ ...data, approveTime: nowTime() })
      c.equityValue = round2(c.equityValue - amount)
      const billNo = `HX-${c.creditCode}-${data.year}`
      eqDiff(c, {
        action: '股权核销', billNo,
        before: { equityValue: before }, after: { equityValue: c.equityValue }, fields: ['equityValue'],
        remark: data.reason || `${data.year} 年度核销 ${amount} 万元`
      })
      eqEvent(c, {
        action: '股权核销登记', billNo,
        detail: `核销 ${amount} 万元（${data.source || '—'}），权益价值 ${before} → ${c.equityValue} 万元`,
        remark: `审批人 ${data.approver || '—'}`
      })
      return { ok: true, msg: `核销已登记，${c.name} 权益价值调整为 ${c.equityValue.toLocaleString()} 万元` }
    }

    if (type === 'report') {
      const dup = list.findIndex(r => r.year === data.year)
      if (dup > -1 && dup !== index) {
        return { ok: false, msg: `${data.year} 年度财务报告已存在，请直接编辑该条记录` }
      }
      if (Number(data.totalLiabilities) > Number(data.totalAssets)) {
        return { ok: false, msg: '负债总额不应超过资产总额' }
      }
    }

    const billNo = `WH-${c.creditCode}-${type}-${data.year || data.date || data.time || ''}`
    if (index > -1) {
      if (!list[index]) return { ok: false, msg: '待编辑的记录不存在' }
      const before = { ...list[index] }
      list[index] = { ...list[index], ...data }
      eqDiff(c, { action: `修改${label}`, billNo, before, after: list[index], fields: Object.keys(data), remark: label })
      return { ok: true, msg: `${label}已更新` }
    }
    list.unshift({ ...data })
    eqEvent(c, { action: `新增${label}`, billNo, detail: `${label}已登记`, remark: data.subject || data.name || data.reason || '' })
    return { ok: true, msg: `${label}已新增` }
  }

  function removeMaintain(companyId, type, index) {
    const c = findCompany(companyId)
    if (!c) return { ok: false, msg: '请先选择参股企业' }
    const key = EQ_MAINTAIN_KEYS[type]
    const list = key ? c[key] : null
    if (!list || !list[index]) return { ok: false, msg: '待删除的记录不存在' }
    const label = EQ_MAINTAIN_LABELS[type]
    const row = list[index]
    const name = type === 'report' ? `${row.year} 年度财务报告` : (row.name || row.subject || row.date)
    list.splice(index, 1)
    eqEvent(c, { action: `删除${label}`, billNo: `WH-${c.creditCode}-${type}`, detail: `删除「${name}」`, remark: label })
    return { ok: true, msg: '已删除' }
  }

  function submitChange(companyId, { type, afterAmount, reason }) {
    const c = findCompany(companyId)
    if (!c) return { ok: false, msg: '请先选择参股企业' }
    if (!reason) return { ok: false, msg: '请填写变更原因' }
    const amount = Number(afterAmount) || 0
    const newReg = c.regCapital + (amount - c.investAmount)
    const newRatio = newReg > 0 ? +((amount / newReg) * 100).toFixed(2) : 0
    const date = todayStr()
    const record = {
      company: c.name,
      type,
      before: `出资 ${c.investAmount} 万元（${c.holdRatio}%）`,
      after: `出资 ${amount} 万元（${newRatio}%）`,
      reason,
      applyDate: date,
      status: '审批中',
      steps: [
        { name: '提交申请', handler: `经办人：${actorName()}`, time: nowTime(), status: '已完成' },
        { name: '投资决策委员会', handler: '投委会', time: '', status: '进行中' },
        { name: '国资委备案', handler: '区国资办', time: '', status: '未开始' },
      ],
      pending: { companyId: c.id, afterAmount: amount, newReg, newRatio },
    }
    const beforeStatus = c.status
    equityChangeRecords.value.unshift(record)
    c.status = '变更中'
    eqDiff(c, { action: '提交股权变更', billNo: `BG-${c.creditCode}-${date}`, before: { status: beforeStatus }, after: { status: c.status }, fields: ['status'], remark: `${type}：${reason}` })
    eqEvent(c, { action: '申请股权变更', billNo: `BG-${c.creditCode}-${date}`, detail: `${type}：${record.before} → ${record.after}`, remark: reason })
    return { ok: true, msg: '变更申请已提交，等待投资决策委员会审议', record }
  }

  function approveChange(target) {
    const idx = typeof target === 'number' ? target : equityChangeRecords.value.indexOf(target)
    const row = equityChangeRecords.value[idx]
    if (!row) return { ok: false, msg: '未找到该变更记录' }
    const now = nowTime()
    row.steps.forEach(s => {
      if (s.status === '进行中' || s.status === '未开始') { s.status = '已完成'; s.time = now }
    })
    const billNo = `BG-${row.company}-${row.applyDate}`
    row.status = '已生效'
    let applied = null
    if (row.pending) {
      const c = findCompany(row.pending.companyId)
      if (c) {
        const before = {
          investAmount: c.investAmount, regCapital: c.regCapital,
          holdRatio: c.holdRatio, equityValue: c.equityValue, status: c.status
        }
        c.investAmount = row.pending.afterAmount
        c.regCapital = row.pending.newReg
        c.holdRatio = row.pending.newRatio
        c.equityValue = row.pending.afterAmount
        c.status = '正常'
        const me = c.shareholders.find(s => s.name.includes('国有资产'))
        if (me) { me.amount = row.pending.afterAmount; me.ratio = row.pending.newRatio }
        eqDiff(c, {
          action: '股权变更生效', billNo,
          before, after: c,
          fields: ['investAmount', 'regCapital', 'holdRatio', 'equityValue', 'status'],
          remark: row.reason || row.after
        })
        applied = c
      }
      delete row.pending
    }
    eqEvent(applied || { creditCode: '', name: row.company }, {
      action: '审批通过股权变更', billNo,
      detail: `${row.type}：${row.before} → ${row.after}`,
      remark: row.reason || ''
    })
    return { ok: true, msg: '变更已生效，股权信息已更新' }
  }

  function submitDividend(companyId, { year, amount }) {
    const c = findCompany(companyId)
    if (!c) return { ok: false, msg: '请先选择参股企业' }
    const value = Number(amount) || 0
    if (!value) return { ok: false, msg: '请填写分红金额' }
    const before = c.dividend
    c.dividend = +(c.dividend + value).toFixed(2)
    eqDiff(c, {
      action: '登记分红', billNo: `FH-${c.creditCode}-${year}`,
      before: { dividend: before }, after: { dividend: c.dividend }, fields: ['dividend'],
      remark: `${year} 年度分红 ${value} 万元`
    })
    eqEvent(c, { action: '确认股权投资分红', billNo: `FH-${c.creditCode}-${year}`, detail: `${year} 年度分红 ${value} 万元（累计 ${c.dividend} 万元）`, remark: '独立收益口径，不计入租金收入' })
    return { ok: true, msg: `${c.name} ${year}年度分红 ${value} 万元已登记` }
  }

  function submitPledge(companyId, { type, ratio, counterparty, startDate }) {
    const c = findCompany(companyId)
    if (!c) return { ok: false, msg: '请先选择参股企业' }
    if (!counterparty) return { ok: false, msg: '请填写质权人/执行方' }
    const value = Number(ratio) || 0
    if (value > c.holdRatio) return { ok: false, msg: `涉及比例不得超过持股比例 ${c.holdRatio}%` }
    const row = { company: c.name, type, ratio: value, counterparty, startDate: startDate || todayStr(), status: '生效中' }
    equityPledges.value.unshift(row)
    eqEvent(c, {
      action: `登记股权${type}`,
      billNo: `ZY-${c.creditCode}-${row.startDate}`,
      detail: `${type}比例 ${value}%，权利方 ${counterparty}`,
      remark: `${type}登记，资产受限`
    })
    return { ok: true, msg: `${type}登记成功` }
  }

  function releasePledge(target) {
    const idx = typeof target === 'number' ? target : equityPledges.value.indexOf(target)
    const row = equityPledges.value[idx]
    if (!row) return { ok: false, msg: '未找到该质押/冻结记录' }
    if (row.status === '已解除') return { ok: false, msg: '该记录已解除' }
    row.status = '已解除'
    const c = equityCompanies.value.find(x => x.name === row.company)
    eqEvent(c || { creditCode: '', name: row.company }, {
      action: `解除股权${row.type}`,
      billNo: `ZY-${row.company}-${row.startDate}`,
      detail: `${row.type}（${row.ratio}%）已解除，权利方 ${row.counterparty}`,
      remark: '资产权利限制解除'
    })
    return { ok: true, msg: '已解除登记' }
  }

  function submitEqSave(form) {
    if (!form.name) return { ok: false, msg: '请填写股权名称' }
    const holders = (form.shareholders || []).filter(x => x.name)
    const t = nowTime()
    const reg = {
      id: Date.now(),
      name: form.name,
      regCapital: holders.reduce((s, x) => s + (x.subscribed || 0), 0),
      address: form.address || '—',
      contact: form.contact || '—',
      createTime: t,
      lastEdit: t,
      legalPerson: form.legalPerson || '—',
      estDate: form.estDate || '—',
      approveDate: form.approveDate || '—',
      regOrg: form.regOrg || '—',
      regStatus: form.regStatus,
      term: form.term && form.term.length === 2 ? [...form.term] : ['—', '—'],
      scope: form.scope || '—',
      shareholders: holders.map(x => ({ ...x })),
      execs: [], meetings: [], workReports: [], finances: [], changes: [],
    }
    equityRegList.value.unshift(reg)
    useAuditStore().recordEvent({
      assetId: String(reg.id), assetName: reg.name, group: EQ_INVESTOR, module: EQ_MODULE,
      action: '登记股权信息', billNo: `DJ-${reg.id}`,
      detail: `注册资金 ${reg.regCapital} 万元，权属 ${reg.shareholders.length} 方`,
      remark: `${reg.regOrg || '—'} / ${reg.regStatus || '—'}`
    })
    return { ok: true, msg: '股权信息保存成功', reg }
  }

  function submitWoSave(form) {
    if (!form.equity || !form.title || !form.amount) {
      return { ok: false, msg: '请填写股权名称、核销标题与核销金额' }
    }
    const t = nowTime()
    const reg = equityRegList.value.find(r => r.name === form.equity)
    const owner = (reg && reg.shareholders.find(s => s.name.includes('国有资产'))) || null
    const wo = {
      id: Date.now(),
      equity: form.equity,
      title: form.title,
      amount: form.amount,
      reason: form.reason || '—',
      attach: '核销申请单.pdf',
      status: '已通过',
      createTime: t,
      lastEdit: t,
      finishTime: t,
      before: [{ name: EQ_INVESTOR, ratio: owner ? owner.ratio : 100, subscribed: form.amount, paid: form.amount, removed: true }],
      after: [],
      steps: [{ level: '一级审批（财务部）', auditor: actorName(), time: t, attach: '财务审核意见.pdf' }],
    }
    equityWriteoffs.value.unshift(wo)
    useAuditStore().recordEvent({
      assetId: reg ? String(reg.id) : form.equity,
      assetName: form.title,
      group: EQ_INVESTOR,
      module: EQ_MODULE,
      action: '登记股权核销',
      billNo: `HX-${wo.id}`,
      detail: `${form.equity} 核销 ${form.amount} 万元`,
      remark: wo.reason
    })
    return { ok: true, msg: '股权核销已新增', wo }
  }

  return {
    /* 无形资产 state */
    intangibleAssets,
    intangibleRightsBiz,
    intangibleDisposals,
    intangibleArchives,
    intangibleTypes,
    /* 无形资产 actions */
    findIntangible,
    registerIntangibleAsset,
    saveIntangibleAsset,
    evaluateIntangible,
    amortizeIntangible,
    rightsActionIntangible,
    suspendIntangible,
    resumeIntangible,
    disposeIntangible,
    approveIntangibleDisposal,
    transferIntangibleOwnership,
    submitRightsBiz,
    saveIntangibleDispose,
    removeIntangibleDispose,
    setDisposeApproval,
    updateIntangibleType,
    toggleIntangibleType,
    /* 股权投资 state */
    equityCompanies,
    equityChangeRecords,
    equityPledges,
    equityWriteoffs,
    equityRegList,
    /* 股权投资 computeds */
    totalInvest,
    totalEquity,
    totalDividend,
    intangibleTotalValue,
    findCompany,
    /* 股权投资 actions */
    saveCompany,
    saveMaintain,
    removeMaintain,
    submitChange,
    approveChange,
    submitDividend,
    submitPledge,
    releasePledge,
    submitEqSave,
    submitWoSave
  }
})
