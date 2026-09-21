<template>
  <el-drawer v-model="visible" :title="drawerTitle" size="1280px" direction="rtl" @close="$emit('close')">
    <div v-if="asset" class="asset-detail-content">
      <!-- 顶部：资产信息全字段网格 + 二维码 -->
      <div class="info-header">
        <h4 class="section-title">资产信息</h4>
        <canvas ref="qrCanvas" class="qr-canvas" title="资产二维码"></canvas>
      </div>
      <el-descriptions :column="3" border size="small" class="info-grid">
        <el-descriptions-item label="省市区">{{ info.region }}</el-descriptions-item>
        <el-descriptions-item label="所属项目">{{ info.project }}</el-descriptions-item>
        <el-descriptions-item label="分区">{{ info.partition }}</el-descriptions-item>
        <el-descriptions-item label="所在楼层">{{ info.floor }}</el-descriptions-item>
        <el-descriptions-item label="经营公司">{{ info.company }}</el-descriptions-item>
        <el-descriptions-item label="产权公司">{{ info.owner }}</el-descriptions-item>
        <el-descriptions-item label="资产名称">{{ info.name }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ info.code }}</el-descriptions-item>
        <el-descriptions-item label="经营状态">
          <el-tag :type="statusTagType(info.status)" size="small">{{ info.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产来源">{{ info.source }}</el-descriptions-item>
        <el-descriptions-item label="资产属性">{{ info.attr }}</el-descriptions-item>
        <el-descriptions-item label="管理部门">{{ info.dept }}</el-descriptions-item>
        <el-descriptions-item label="管理人员">{{ info.manager }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ info.address }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ info.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="购置时间">{{ info.purchaseDate }}</el-descriptions-item>
        <el-descriptions-item label="资产原值（万元）">{{ info.bookValue }}</el-descriptions-item>
        <el-descriptions-item label="使用面积(㎡)">{{ info.usedArea }}</el-descriptions-item>
        <el-descriptions-item label="资产面积(㎡)">{{ info.area }}</el-descriptions-item>
        <el-descriptions-item label="产证情况">{{ info.certStatus }}</el-descriptions-item>
        <el-descriptions-item label="实际用途">{{ info.usage }}</el-descriptions-item>
        <el-descriptions-item label="建筑结构" :span="2">{{ info.structure }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="section-title">抵押信息</h4>
      <el-descriptions :column="3" border size="small" class="info-grid">
        <el-descriptions-item label="是否抵押">{{ info.mortgaged ? '是' : '否' }}</el-descriptions-item>
        <template v-if="info.mortgaged">
          <el-descriptions-item label="抵押权人">{{ info.mortgagee }}</el-descriptions-item>
          <el-descriptions-item label="抵押金额（万元）">{{ info.mortgageAmount }}</el-descriptions-item>
        </template>
      </el-descriptions>

      <h4 class="section-title">运营信息</h4>
      <el-descriptions :column="3" border size="small" class="info-grid">
        <el-descriptions-item label="是否招租">{{ info.forRent }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">{{ info.useStatus }}</el-descriptions-item>
        <el-descriptions-item label="月租金（元）">{{ info.monthlyRent }}</el-descriptions-item>
      </el-descriptions>

      <!-- 15 个生命周期标签页 -->
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="接收信息" name="receive">
          <el-table :data="detailData.receiveInfo" stripe size="small">
            <el-table-column prop="receiver" label="接收人" />
            <el-table-column prop="receiveDate" label="接收日期" />
            <el-table-column prop="source" label="来源" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
          <el-empty v-if="!detailData.receiveInfo.length" description="暂无接收记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="产权信息" name="property">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="产权证号">{{ asset.certDetail || '—' }}</el-descriptions-item>
            <el-descriptions-item label="产权状态">{{ asset.propertyRight || '—' }}</el-descriptions-item>
            <el-descriptions-item label="资产分类">{{ asset.assetCategory || '—' }}</el-descriptions-item>
            <el-descriptions-item label="资产用途">{{ asset.assetUsage || '—' }}</el-descriptions-item>
            <el-descriptions-item label="取得方式">{{ asset.acquisitionMethod || '—' }}</el-descriptions-item>
            <el-descriptions-item label="来源类型">{{ asset.sourceType || '—' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="价值信息" name="value">
          <h4 style="margin-bottom: 12px">成本记录</h4>
          <el-table :data="getAssetCosts()" stripe size="small">
            <el-table-column prop="costType" label="成本类型" />
            <el-table-column prop="amount" label="金额(万元)" />
            <el-table-column prop="date" label="日期" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
          <h4 style="margin: 16px 0 12px">评估记录</h4>
          <el-table :data="getAssetEvaluations()" stripe size="small">
            <el-table-column prop="org" label="评估机构" />
            <el-table-column prop="date" label="评估日期" />
            <el-table-column prop="value" label="评估值(万元)" />
            <el-table-column prop="method" label="评估方法" />
            <el-table-column prop="reportNo" label="报告编号" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="缴费记录" name="payment">
          <el-table :data="detailData.paymentHistory" stripe size="small">
            <el-table-column prop="period" label="缴费期间" />
            <el-table-column prop="amount" label="金额(万元)" />
            <el-table-column prop="payDate" label="缴纳日期" />
            <el-table-column prop="method" label="缴纳方式" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === '已缴' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!detailData.paymentHistory.length" description="暂无缴费记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="巡查信息" name="inspection">
          <el-table :data="detailData.inspectionHistory" stripe size="small">
            <el-table-column prop="inspectDate" label="巡查日期" />
            <el-table-column prop="inspector" label="巡查人" />
            <el-table-column prop="result" label="结果">
              <template #default="{ row }">
                <el-tag :type="row.result === '正常' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
          <el-empty v-if="!detailData.inspectionHistory.length" description="暂无巡查记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="催缴信息" name="urge">
          <el-table :data="detailData.urgeHistory" stripe size="small">
            <el-table-column prop="time" label="催缴时间" width="150" />
            <el-table-column prop="method" label="催缴方式" width="130" />
            <el-table-column prop="content" label="催缴内容" min-width="220" show-overflow-tooltip />
            <el-table-column prop="operator" label="操作人" width="110" />
            <el-table-column prop="result" label="结果" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.result === '已发送' || row.result === '已送达' ? 'success' : 'primary'">{{ row.result }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!detailData.urgeHistory.length" description="暂无催缴记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="维修信息" name="repair">
          <el-table :data="detailData.repairHistory" stripe size="small">
            <el-table-column prop="issue" label="故障描述" />
            <el-table-column prop="reporter" label="报修人" />
            <el-table-column prop="reportDate" label="报修日期" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="completeDate" label="完成日期" />
            <el-table-column prop="cost" label="费用(万元)" />
          </el-table>
          <el-empty v-if="!detailData.repairHistory.length" description="暂无维修记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="合同信息" name="contract">
          <el-table :data="getAssetContracts()" stripe size="small">
            <el-table-column prop="id" label="合同编号" />
            <el-table-column prop="tenant" label="承租方" />
            <el-table-column prop="startDate" label="起始日期" />
            <el-table-column prop="endDate" label="截止日期" />
            <el-table-column prop="annualRent" label="年租金(万)" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="contractStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!getAssetContracts().length" description="暂无合同记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="自用占用" name="selfuse">
          <el-table :data="detailData.selfUseRecords" stripe size="small">
            <el-table-column prop="department" label="使用部门" />
            <el-table-column prop="startDate" label="起始日期" />
            <el-table-column prop="endDate" label="结束日期">
              <template #default="{ row }">{{ row.endDate || '至今' }}</template>
            </el-table-column>
            <el-table-column prop="purpose" label="用途" />
            <el-table-column prop="approver" label="审批人" />
          </el-table>
          <el-empty v-if="!detailData.selfUseRecords.length" description="暂无自用记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="备案记录" name="filing">
          <el-table :data="detailData.filingRecords" stripe size="small">
            <el-table-column prop="filingType" label="备案类型" />
            <el-table-column prop="filingDate" label="备案日期" />
            <el-table-column prop="authority" label="备案机关" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!detailData.filingRecords.length" description="暂无备案记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="资产变更" name="change">
          <el-table :data="changeHistory" stripe size="small">
            <el-table-column prop="date" label="变更日期" />
            <el-table-column prop="type" label="变更类型" />
            <el-table-column prop="before" label="变更前" />
            <el-table-column prop="after" label="变更后" />
            <el-table-column prop="operator" label="操作人" />
          </el-table>
          <el-empty v-if="!changeHistory.length" description="暂无变更记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="权属流转" name="transfer">
          <el-table :data="ownershipTransferRecords" stripe size="small">
            <el-table-column prop="fromOwner" label="转出方" />
            <el-table-column prop="toOwner" label="转入方" />
            <el-table-column prop="transferDate" label="流转日期" />
            <el-table-column prop="method" label="流转方式" />
            <el-table-column prop="approvalNo" label="批准文号" />
          </el-table>
          <el-empty v-if="!ownershipTransferRecords.length" description="暂无流转记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="资产调拨" name="transfer2">
          <el-table :data="transferRecords" stripe size="small">
            <el-table-column prop="date" label="调拨日期" />
            <el-table-column prop="fromDept" label="调出部门" />
            <el-table-column prop="toDept" label="调入部门" />
            <el-table-column prop="reason" label="调拨原因" />
            <el-table-column prop="approver" label="审批人" />
          </el-table>
          <el-empty v-if="!transferRecords.length" description="暂无调拨记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="资产退出" name="exit">
          <el-table :data="exitRecords" stripe size="small">
            <el-table-column prop="date" label="退出日期" />
            <el-table-column prop="type" label="退出方式" />
            <el-table-column prop="reason" label="退出原因" />
            <el-table-column prop="disposalValue" label="处置价值(万)" />
            <el-table-column prop="approver" label="审批人" />
          </el-table>
          <el-empty v-if="!exitRecords.length" description="暂无退出记录" :image-size="60" />
        </el-tab-pane>

        <el-tab-pane label="附件" name="attachment">
          <el-table :data="getAssetArchives()" stripe size="small">
            <el-table-column prop="archiveType" label="档案类型" />
            <el-table-column prop="createTime" label="创建日期" />
            <el-table-column label="附件文件">
              <template #default="{ row }">
                <el-tag v-for="f in row.files" :key="f" size="small" style="margin-right: 4px">{{ f }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!getAssetArchives().length" description="暂无附件" :image-size="60" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-empty v-else description="请选择资产查看详情" />
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import { useAssetStore } from '../store/asset'
import { useContractStore } from '../store/contract'
import { useChangeLogStore } from '../store/changeLog'
import { useAuditStore } from '../store/audit'
import { useCredentialStore } from '../store/credential'
import { useFinanceStore } from '../store/finance'

const assetStore = useAssetStore()
const contractStore = useContractStore()
const changeLogStore = useChangeLogStore()
const auditStore = useAuditStore()
const credentialStore = useCredentialStore()
const financeStore = useFinanceStore()

const props = defineProps({
  modelValue: Boolean,
  asset: Object
})

const emit = defineEmits(['update:modelValue', 'close'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const activeTab = ref('receive')
const qrCanvas = ref(null)

const drawerTitle = computed(() => {
  if (!props.asset) return '资产详情'
  return `资产详情 — ${props.asset.name || props.asset.assetName || props.asset.id}`
})

// 统一字段映射：兼容台账行、资产管控房间、store 资产三种数据形态
const info = computed(() => {
  const a = props.asset || {}
  const code = a.code || a.assetNo || a.id || a.assetId || '—'
  const rented = a.status === '已出租' || a.status === '出租'
  return {
    region: a.region || '福建省/福州市/长乐区',
    project: a.project || a.projectName || '—',
    partition: a.partition || '—',
    floor: a.floor || '—',
    company: a.group || a.company || '—',
    owner: a.owner || '—',
    name: a.name || a.assetName || '—',
    code,
    status: a.status || '—',
    source: a.source || '—',
    attr: a.assetAttr || '经营性',
    dept: a.manageDept || '资产部门',
    manager: a.manager || '—',
    address: a.location || a.address || '—',
    createdAt: a.createdAt || '—',
    purchaseDate: a.purchaseDate || '—',
    bookValue: a.bookValue ?? '—',
    usedArea: a.usedArea ?? a.area ?? '—',
    area: a.area ?? '—',
    certStatus: a.certStatus || (a.hasPropertyRight === true ? '已办证' : a.hasPropertyRight === false ? '无' : '—'),
    usage: a.usage || a.type || '—',
    structure: a.structure || '—',
    mortgaged: !!a.mortgaged,
    mortgagee: a.mortgagee || '—',
    mortgageAmount: a.mortgageAmount ?? '—',
    forRent: a.forRent || (rented ? '否' : a.status ? '是' : '—'),
    useStatus: a.useStatus || (rented ? '已出租' : a.status === '自用' ? '自用' : '未使用'),
    monthlyRent: a.monthlyRent ?? a.rentPrice ?? '—'
  }
})

// ===== 逐资产派生数据：一律来自 store，不再读 data/mock 的写死字典 =====
const assetId = computed(() => {
  const a = props.asset || {}
  return a.id || a.assetId || a.code || a.assetNo || ''
})

// 抽屉开着的时候台账可能已被改过，按 id 回读 store 拿最新形态
const assetRecord = computed(() =>
  (assetId.value ? assetStore.getAssetById(assetId.value) : null) || props.asset || null
)

const assetContracts = computed(() =>
  assetId.value ? contractStore.visibleContracts.filter(c => c.assetId === assetId.value) : []
)

const assetFees = computed(() => {
  if (!assetId.value) return []
  const ids = new Set(assetContracts.value.map(c => c.id))
  return contractStore.visibleFees.filter(f => ids.has(f.contractId) || f.assetId === assetId.value)
})

// 成本：台账账面原值（一笔取得成本）+ 财务费用单里挂在该资产名下的运行成本
const costRows = computed(() => {
  const a = assetRecord.value
  if (!a) return []
  const rows = []
  if (a.bookValue != null || a.purchaseDate || a.createdAt) {
    rows.push({
      id: `${assetId.value}-cost-base`,
      assetId: assetId.value,
      assetName: a.name || a.assetName || '',
      costType: a.acquisitionMethod === '自建' || a.sourceType === '自建' ? '建设成本' : '购置成本',
      amount: a.bookValue ?? '—',
      date: a.purchaseDate || a.createdAt || '—',
      remark: `账面原值 · 取得方式 ${a.acquisitionMethod || a.sourceType || '—'}`
    })
  }
  const name = a.name || a.assetName
  if (name) {
    financeStore.expenses.filter(e => e.assetName === name).forEach(e => rows.push({
      id: `${assetId.value}-cost-${e.expenseNo}`,
      assetId: assetId.value,
      assetName: name,
      costType: e.expenseType,
      amount: e.amount,
      date: e.occurDate || '—',
      remark: e.supplier || ''
    }))
  }
  return rows
})

// 评估：台账自带 evaluations 时以台账为准；否则取财务侧租金差价分析沉淀的评估值
const evaluationRows = computed(() => {
  const a = assetRecord.value
  if (!a || !assetId.value) return []
  if (Array.isArray(a.evaluations) && a.evaluations.length) {
    return a.evaluations.map((e, i) => ({
      id: `${assetId.value}-ev-${i}`,
      assetId: assetId.value,
      assetName: a.name || '',
      org: e.org || '—',
      date: e.date || '—',
      value: e.value ?? '—',
      method: e.method || '—',
      reportNo: e.reportNo || '—'
    }))
  }
  return financeStore.rentMarginRows
    .filter(r => r.assetId === assetId.value && r.evalValue)
    .map(r => ({
      id: `${assetId.value}-ev-${r.evalReportNo || r.contractId}`,
      assetId: assetId.value,
      assetName: r.assetName || a.name || '',
      org: '—',
      date: '—',
      value: r.evalValue,
      method: '收益法（评估值反推市场租金）',
      reportNo: r.evalReportNo || '—'
    }))
})

// 附件档案：业务留痕（每个动作一份单据）+ 证件层证件 + 电子合同签章
const archiveRows = computed(() => {
  if (!assetId.value) return []
  const rows = auditStore.getByAsset(assetId.value).map(r => ({
    id: `arch-${r.id}`,
    archiveType: `${r.module}·${r.action}`,
    createTime: (r.time || '').slice(0, 10) || '—',
    files: r.billNo ? [`${r.billNo}.pdf`] : []
  }))
  credentialStore.getByAsset(assetId.value).forEach(c => rows.push({
    id: `arch-${c.id}`,
    archiveType: `${c.type}档案`,
    createTime: c.issueDate || '—',
    files: c.certNo ? [`${c.certNo}.pdf`] : []
  }))
  assetContracts.value.filter(c => c.electronic).forEach(c => rows.push({
    id: `arch-${c.id}`,
    archiveType: '电子合同档案',
    createTime: c.startDate || '—',
    files: [`${c.id} 电子签章记录.pdf`]
  }))
  return rows
})

// 催缴：合同欠费即待催缴事项，催缴动作与时间在收费/催缴页产生后由留痕补全
const urgeRows = computed(() => assetContracts.value
  .filter(c => (c.arrears || 0) > 0)
  .map(c => ({
    id: `urge-${c.id}`,
    assetId: assetId.value,
    time: '—',
    method: '欠费待催缴',
    content: `合同 ${c.id}（${c.tenant}）欠费 ${c.arrears} 万元${c.overdueDays ? `，逾期 ${c.overdueDays} 天` : ''}`,
    operator: '资产管理员',
    result: '待催缴'
  })))

// 巡查/盘点：变更留痕里的巡查类动作，没有则空表
const inspectionRows = computed(() => {
  if (!assetId.value) return []
  return changeLogStore.entriesOfAsset(assetId.value)
    .filter(e => /巡查|盘点|检查|清查/.test(`${e.module || ''}${e.type || ''}`))
    .map(e => ({
      inspector: e.operator || '—',
      inspectDate: e.date || '—',
      result: /正常|无差异|一致/.test(String(e.after || '')) ? '正常' : '有差异',
      remark: `${e.type}：${e.before} → ${e.after}`
    }))
})

// 维修：财务费用单中该资产的维修支出，视为一次已完成的维修事项
const repairRows = computed(() => {
  const name = assetRecord.value?.name || assetRecord.value?.assetName
  if (!name) return []
  return financeStore.expenses
    .filter(e => e.assetName === name && /维修/.test(String(e.expenseType || '')))
    .map(e => ({
      reporter: '—',
      reportDate: e.occurDate || '—',
      issue: `${e.expenseType}（${e.supplier || '—'}）`,
      status: '已完成',
      completeDate: e.occurDate || '—',
      cost: e.amount ?? '—'
    }))
})

// 备案：证件层登记的程序证件 + 已领到的不动产权证
const filingRows = computed(() => {
  const a = assetRecord.value
  if (!a || !assetId.value) return []
  const rows = credentialStore.getByAsset(assetId.value).map(c => ({
    filingType: c.type,
    filingDate: c.issueDate || '—',
    authority: c.issuer || '—',
    status: c.status || '有效'
  }))
  if (a.certDetail) {
    rows.unshift({ filingType: '不动产权属登记', filingDate: '—', authority: '长乐区不动产登记中心', status: '已登记' })
  }
  return rows
})

const detailData = computed(() => {
  const empty = { receiveInfo: [], paymentHistory: [], inspectionHistory: [], urgeHistory: [], repairHistory: [], selfUseRecords: [], filingRecords: [], ownershipTransfer: [] }
  const a = assetRecord.value
  const aid = assetId.value
  if (!a || !aid) return empty
  const receiveDate = a.purchaseDate || a.createdAt || ''
  return {
    // 接收信息：台账的取得方式 + 入账原值即一条入库接收记录
    receiveInfo: (receiveDate || a.sourceType || a.acquisitionMethod) ? [{
      receiver: a.manager || a.manageDept || '—',
      receiveDate: receiveDate || '—',
      source: [a.sourceType, a.acquisitionMethod].filter(Boolean).join(' · ') || '—',
      remark: a.bookValue != null ? `入账原值 ${a.bookValue} 万元` : ''
    }] : [],
    // 缴费记录：合同应收实收台账的逐笔收缴流水
    paymentHistory: assetFees.value.flatMap(f => (f.payments || []).map((p, i) => {
      const voucherNo = financeStore.voucherOf('租金收入', f.contractId)
      return {
        id: `${f.contractId}-${i}`,
        assetId: aid,
        period: String(p.date || '').slice(0, 7) || '—',
        amount: p.amount,
        payDate: p.date || '—',
        status: '已缴',
        method: voucherNo ? `凭证 ${voucherNo}` : '—'
      }
    })),
    inspectionHistory: inspectionRows.value,
    urgeHistory: urgeRows.value,
    repairHistory: repairRows.value,
    // 自用占用：台账状态为自用即一条占用记录
    selfUseRecords: a.status === '自用' ? [{
      department: a.manageDept || a.group || '—',
      startDate: a.createdAt || a.purchaseDate || '—',
      endDate: null,
      purpose: a.assetUsage || a.type || '—',
      approver: a.manager || '—'
    }] : [],
    filingRecords: filingRows.value,
    // 权属流转：划拨/划转取得的资产补一条基线，运行期流转仍由业务留痕优先展示
    ownershipTransfer: /划拨|划转|调入|接收/.test(`${a.acquisitionMethod || ''}${a.sourceType || ''}`) ? [{
      fromOwner: a.sourceType || '—',
      toOwner: a.group || '—',
      transferDate: a.purchaseDate || '—',
      method: a.acquisitionMethod || '—',
      approvalNo: '—'
    }] : []
  }
})

// 统一从 audit 业务留痕按 assetId 取数，再按动作分流到各页签
const assetAuditRecords = computed(() => {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code || props.asset.assetNo
  if (!aid) return []
  return auditStore.getByAsset(aid).map(r => ({
    date: (r.time || '').slice(0, 10),
    time: r.time,
    type: r.fieldLabel ? `${r.module}·${r.action}（${r.fieldLabel}）` : `${r.module}·${r.action}`,
    before: r.before,
    after: r.after,
    operator: r.operator,
    remark: r.remark,
    action: r.action || '',
    module: r.module || ''
  }))
})

function isTransfer(r) { return r.action.includes('调拨') }
function isOwnership(r) { return /权属|流转|划转|挂入|移出/.test(r.action) }
function isExit(r) { return /处置|退出|删除|报废/.test(r.action) }

const changeHistory = computed(() =>
  assetAuditRecords.value.filter(r => !isTransfer(r) && !isOwnership(r) && !isExit(r))
)

// 权属流转：优先展示留痕，留痕为空时回退到种子流转记录
const ownershipTransferRecords = computed(() => {
  const fromAudit = assetAuditRecords.value.filter(isOwnership).map(r => ({
    fromOwner: '—', toOwner: r.after, transferDate: r.date, method: r.action, approvalNo: r.remark || '—'
  }))
  if (fromAudit.length) return fromAudit
  return detailData.value.ownershipTransfer
})

const transferRecords = computed(() =>
  assetAuditRecords.value.filter(isTransfer).map(r => ({
    date: r.date, fromDept: r.before, toDept: r.after, reason: r.remark || r.type, approver: r.operator
  }))
)

const exitRecords = computed(() =>
  assetAuditRecords.value.filter(isExit).map(r => ({
    date: r.date, type: r.action, reason: r.remark || r.type, disposalValue: '—', approver: r.operator
  }))
)

// 页签取数入口保持原函数名，模板不动，数据全部换成 store 派生
function getAssetCosts() {
  return costRows.value
}

function getAssetEvaluations() {
  return evaluationRows.value
}

function getAssetContracts() {
  return assetContracts.value
}

function getAssetArchives() {
  return archiveRows.value
}

function statusTagType(status) {
  const map = { '已出租': 'success', '出租': 'success', '闲置': 'warning', '空置': 'warning', '自用': 'primary', '部分出租': 'primary', '处置中': 'danger' }
  return map[status] || 'info'
}

function contractStatusType(status) {
  const map = { '正常': 'success', '欠缴': 'danger', '临期': 'warning' }
  return map[status] || 'info'
}

function renderQR() {
  if (!qrCanvas.value || !props.asset) return
  const code = info.value.code
  if (!code || code === '—') return
  QRCode.toCanvas(qrCanvas.value, `ASSET:${code}`, { width: 72, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } })
}

watch(() => props.modelValue, async (v) => {
  if (v) {
    activeTab.value = 'receive'
    await nextTick()
    renderQR()
  }
})
</script>

<style scoped>
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.qr-canvas {
  width: 72px;
  height: 72px;
  border: 1px solid var(--c-border, #e4e7ed);
  border-radius: 4px;
  padding: 2px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text, #303133);
  margin: 16px 0 10px;
  padding-left: 8px;
  border-left: 3px solid var(--c-primary, #2563eb);
}

.info-header .section-title {
  margin-top: 0;
}

.info-grid {
  margin-bottom: 4px;
}

.detail-tabs {
  margin-top: 8px;
}

.detail-tabs :deep(.el-tabs__content) {
  padding: 12px 0;
}

.detail-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}
.detail-tabs :deep(.el-tabs__nav-prev),
.detail-tabs :deep(.el-tabs__nav-next) {
  display: none;
}
</style>
