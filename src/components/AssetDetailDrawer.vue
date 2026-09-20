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
          <el-table :data="detailData.ownershipTransfer" stripe size="small">
            <el-table-column prop="fromOwner" label="转出方" />
            <el-table-column prop="toOwner" label="转入方" />
            <el-table-column prop="transferDate" label="流转日期" />
            <el-table-column prop="method" label="流转方式" />
            <el-table-column prop="approvalNo" label="批准文号" />
          </el-table>
          <el-empty v-if="!detailData.ownershipTransfer.length" description="暂无流转记录" :image-size="60" />
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
import { assetDetailData, costRecords, evaluationRecords, assetArchives, urgeRecords } from '../data/mock'
import { useContractStore } from '../store/contract'
import { useChangeLogStore } from '../store/changeLog'

const contractStore = useContractStore()

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
    purchaseDate: a.purchaseDate || a.createdAt || '—',
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

const detailData = computed(() => {
  const empty = { receiveInfo: [], paymentHistory: [], inspectionHistory: [], urgeHistory: [], repairHistory: [], selfUseRecords: [], filingRecords: [], ownershipTransfer: [] }
  if (!props.asset) return empty
  const aid = props.asset.id || props.asset.assetId || props.asset.code || props.asset.assetNo
  return {
    receiveInfo: assetDetailData.receiveInfo.filter(r => r.assetId === aid),
    paymentHistory: assetDetailData.paymentHistory.filter(r => r.assetId === aid),
    inspectionHistory: assetDetailData.inspectionHistory.filter(r => r.assetId === aid),
    urgeHistory: urgeRecords.filter(r => r.assetId === aid),
    repairHistory: assetDetailData.repairHistory.filter(r => r.assetId === aid),
    selfUseRecords: assetDetailData.selfUseRecords.filter(r => r.assetId === aid),
    filingRecords: assetDetailData.filingRecords.filter(r => r.assetId === aid),
    ownershipTransfer: assetDetailData.ownershipTransfer.filter(r => r.assetId === aid)
  }
})

const changeHistory = computed(() => {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code
  if (!aid) return []
  return useChangeLogStore().entriesOfAsset(aid)
})

const transferRecords = computed(() => [])
const exitRecords = computed(() => [])

function getAssetCosts() {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code
  return costRecords.filter(r => r.assetId === aid)
}

function getAssetEvaluations() {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code
  return evaluationRecords.filter(r => r.assetId === aid)
}

function getAssetContracts() {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code
  return contractStore.contracts.filter(r => r.assetId === aid)
}

function getAssetArchives() {
  if (!props.asset) return []
  const aid = props.asset.id || props.asset.assetId || props.asset.code || props.asset.assetNo
  return assetArchives.filter(r => r.assetNo === aid)
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
