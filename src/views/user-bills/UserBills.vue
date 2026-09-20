<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户账单</h2>
      <div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增</el-button>
        <el-button @click="showCycle = true">缴费周期设置</el-button>
        <el-button type="primary" @click="handleGenerate">按周期生成账单</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-row :gutter="12" class="kpi-row">
      <el-col :span="6">
        <div class="kpi">
          <el-progress type="dashboard" :percentage="collectionRate" :width="110" :color="rateColor">
            <template #default="{ percentage }">
              <div class="rate-v">{{ percentage }}%</div>
              <div class="rate-l">收缴率</div>
            </template>
          </el-progress>
        </div>
      </el-col>
      <el-col :span="18">
        <el-row :gutter="12" class="kpi-inner">
          <el-col :span="6"><div class="kpi-box"><div class="kpi-v" style="color:#409eff">{{ bills.length }}</div><div class="kpi-l">账单总数</div></div></el-col>
          <el-col :span="6"><div class="kpi-box"><div class="kpi-v" style="color:#67c23a">￥{{ totalReceived }}</div><div class="kpi-l">已收(元)</div></div></el-col>
          <el-col :span="6"><div class="kpi-box"><div class="kpi-v" style="color:#e6a23c">￥{{ totalReceivable }}</div><div class="kpi-l">应收(元)</div></div></el-col>
          <el-col :span="6"><div class="kpi-box"><div class="kpi-v" style="color:#f56c6c">{{ overdueCount }}</div><div class="kpi-l">逾期账单</div></div></el-col>
          <el-col :span="24">
            <div class="cycle-tip">
              当前缴费周期：<b>{{ cycle.cycleLabel }}</b> · 出账日 <b>每月{{ cycle.billDay }}日</b> · 缴费截止 <b>{{ cycle.dueDay }}日</b> ·
              计费项 <b>{{ cycle.feeTypes.join('、') }}</b>
            </div>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-card class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="账单编号/承租方" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.company" placeholder="公司" clearable>
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-select v-model="filters.feeType" placeholder="类型" clearable>
            <el-option label="租金" value="租金" />
            <el-option label="物业费" value="物业费" />
            <el-option label="水电费" value="水电费" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="账单状态" clearable>
            <el-option label="待缴费" value="待缴费" />
            <el-option label="已缴费" value="已缴费" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-date-picker
            v-model="filters.month"
            type="month"
            placeholder="选择月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="pagedData" border stripe show-summary :summary="getSummary" row-key="id">
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div class="expand-wrap">
              <div class="section-title">账单信息</div>
              <div class="detail-grid">
                <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.assetName }}</div></div>
                <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createTime }}</div></div>
                <div class="cell"><div class="label">修改时间</div><div class="value">{{ row.updateTime }}</div></div>
              </div>
              <div class="section-title">资产信息</div>
              <el-table :data="profileOf(row).assets" border size="small">
                <el-table-column prop="region" label="省市区" min-width="150" />
                <el-table-column prop="project" label="项目" min-width="120" />
                <el-table-column prop="zone" label="分区" width="90" />
                <el-table-column prop="assetNo" label="资产编号" width="120" />
                <el-table-column prop="address" label="资产座落" min-width="170" />
                <el-table-column prop="company" label="所属公司" min-width="170" />
                <el-table-column prop="leaseType" label="租赁类型" width="100" align="center" />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="billNo" label="账单编号" width="140" />
        <el-table-column prop="tenant" label="承租方" width="170" show-overflow-tooltip />
        <el-table-column prop="billMonth" label="账单月份" width="100" align="center" />
        <el-table-column prop="feeType" label="费用类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.feeType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receivable" label="应收金额(元)" width="115" align="right" />
        <el-table-column prop="received" label="实缴金额(元)" width="115" align="right" />
        <el-table-column prop="status" label="缴费状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleUrge(row)" :disabled="row.status !== '待缴费' && row.status !== '已逾期'">催缴</el-button>
            <el-button type="danger" link size="small" @click="handleStop(row)" :disabled="row.status === '已停用'">停用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 缴费周期设置 -->
    <el-dialog v-model="showCycle" title="缴费周期设置" width="520px">
      <el-form :model="cycle" label-width="110px">
        <el-form-item label="缴费周期">
          <el-radio-group v-model="cycle.cycleType">
            <el-radio label="monthly">按月</el-radio>
            <el-radio label="quarterly">按季</el-radio>
            <el-radio label="halfyear">按半年</el-radio>
            <el-radio label="yearly">按年</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出账日">
          <el-input-number v-model="cycle.billDay" :min="1" :max="28" style="width:160px" />
          <span class="unit">每月</span>
        </el-form-item>
        <el-form-item label="缴费截止日">
          <el-input-number v-model="cycle.dueDay" :min="1" :max="28" style="width:160px" />
          <span class="unit">每月</span>
        </el-form-item>
        <el-form-item label="计费项">
          <el-checkbox-group v-model="cycle.feeTypes">
            <el-checkbox label="租金" />
            <el-checkbox label="物业费" />
            <el-checkbox label="水电费" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCycle = false">取消</el-button>
        <el-button type="primary" @click="saveCycle">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAdd" title="新增账单" width="520px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="承租方">
          <el-select v-model="addForm.tenant" style="width: 100%" filterable @change="onAddTenantChange">
            <el-option v-for="s in leaseSources" :key="s.tenant" :label="s.tenant" :value="s.tenant" />
          </el-select>
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="addForm.feeType" style="width: 100%" @change="onAddFeeTypeChange">
            <el-option label="租金" value="租金" />
            <el-option label="物业费" value="物业费" />
            <el-option label="水电费" value="水电费" />
          </el-select>
        </el-form-item>
        <el-form-item label="账单月份">
          <el-date-picker v-model="addForm.billMonth" type="month" format="YYYY-MM" value-format="YYYY-MM" style="width: 100%" />
        </el-form-item>
        <el-form-item label="应收金额(元)">
          <el-input-number v-model="addForm.receivable" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="payDetailVisible" title="缴费详情" size="620px">
      <template v-if="detailRow">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ detailProfile.tenantType }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ detailRow.tenant }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ detailProfile.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ detailProfile.phone }}</div></div>
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ detailRow.company }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value">{{ detailProfile.contractNo }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ detailProfile.signTime }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ detailProfile.contractType }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ detailProfile.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ detailProfile.leaseStart }} 至 {{ detailProfile.leaseEnd }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ detailProfile.dueDate }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value hl">￥{{ detailProfile.deposit }}</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag v-for="s in detailProfile.contractStatus" :key="s" size="small" style="margin-right: 4px">{{ s }}</el-tag>
            </div>
          </div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="detailProfile.assets" border size="small" style="margin-bottom: 12px">
          <el-table-column prop="region" label="省市区" min-width="140" />
          <el-table-column prop="project" label="项目" min-width="110" />
          <el-table-column prop="assetNo" label="资产编号" width="110" />
          <el-table-column prop="address" label="资产座落" min-width="150" />
          <el-table-column prop="leaseType" label="租赁类型" width="90" align="center" />
        </el-table>
        <div class="section-title">发票信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">是否开票</div><div class="value">{{ detailInvoice.invoiced }}</div></div>
          <div class="cell"><div class="label">发票号码</div><div class="value">{{ detailInvoice.invoiceNo }}</div></div>
          <div class="cell"><div class="label">发票类型</div><div class="value">{{ detailInvoice.invoiceType }}</div></div>
          <div class="cell"><div class="label">开票日期</div><div class="value">{{ detailInvoice.invoiceDate }}</div></div>
          <div class="cell"><div class="label">开票金额</div><div class="value hl">￥{{ detailInvoice.amount }}</div></div>
        </div>
        <div class="section-title">订单信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">订单编号</div><div class="value">{{ detailOrder.orderNo }}</div></div>
          <div class="cell"><div class="label">支付单号</div><div class="value">{{ detailOrder.payNo }}</div></div>
          <div class="cell"><div class="label">缴费时间</div><div class="value">{{ detailOrder.payTime }}</div></div>
          <div class="cell"><div class="label">缴费说明</div><div class="value">{{ detailOrder.payNote }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ detailOrder.dueTime }}</div></div>
          <div class="cell"><div class="label">缴费金额</div><div class="value hl">￥{{ detailOrder.amount }}</div></div>
          <div class="cell">
            <div class="label">支付方式</div>
            <div class="value">
              <el-tag size="small" :type="detailOrder.payWay === '微信支付' ? 'success' : detailOrder.payWay === '银行转账' ? '' : 'warning'">{{ detailOrder.payWay }}</el-tag>
            </div>
          </div>
          <div class="cell"><div class="label">是否开票</div><div class="value">{{ detailInvoice.invoiced }}</div></div>
          <div class="cell"><div class="label">备注</div><div class="value">{{ detailOrder.remark }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="payDetailVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const filters = ref({ keyword: '', company: '', feeType: '', status: '', month: '' })
const page = ref(1)
const pageSize = ref(10)

const bills = ref([
  { id: 1, billNo: 'BILL202409001', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '租金', receivable: 58000, received: 58000, billMonth: '2024-09', status: '已缴费' },
  { id: 2, billNo: 'BILL202409002', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '物业费', receivable: 6800, received: 6800, billMonth: '2024-09', status: '已缴费' },
  { id: 3, billNo: 'BILL202409003', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '水电费', receivable: 3250, received: 0, billMonth: '2024-09', status: '待缴费' },
  { id: 4, billNo: 'BILL202409004', tenant: '浙江蓝海贸易公司', assetName: '西湖区文三路商铺', feeType: '租金', receivable: 22000, received: 22000, billMonth: '2024-09', status: '已缴费' },
  { id: 5, billNo: 'BILL202409005', tenant: '浙江蓝海贸易公司', assetName: '西湖区文三路商铺', feeType: '物业费', receivable: 1800, received: 0, billMonth: '2024-09', status: '已逾期' },
  { id: 6, billNo: 'BILL202410001', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '租金', receivable: 58000, received: 0, billMonth: '2024-10', status: '待缴费' },
  { id: 7, billNo: 'BILL202410002', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '物业费', receivable: 6800, received: 0, billMonth: '2024-10', status: '待缴费' },
  { id: 8, billNo: 'BILL202410003', tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', feeType: '水电费', receivable: 2980, received: 0, billMonth: '2024-10', status: '待缴费' },
  { id: 9, billNo: 'BILL202410004', tenant: '浙江蓝海贸易公司', assetName: '西湖区文三路商铺', feeType: '租金', receivable: 22000, received: 22000, billMonth: '2024-10', status: '已缴费' },
  { id: 10, billNo: 'BILL202410005', tenant: '嘉兴绿谷农产品有限公司', assetName: '余杭区仓储中心3号库', feeType: '租金', receivable: 35000, received: 0, billMonth: '2024-10', status: '已逾期' },
  { id: 11, billNo: 'BILL202410006', tenant: '嘉兴绿谷农产品有限公司', assetName: '余杭区仓储中心3号库', feeType: '物业费', receivable: 2400, received: 0, billMonth: '2024-10', status: '待缴费' },
  { id: 12, billNo: 'BILL202410007', tenant: '嘉兴绿谷农产品有限公司', assetName: '余杭区仓储中心3号库', feeType: '水电费', receivable: 4120, received: 4120, billMonth: '2024-10', status: '已缴费' },
])

const companyByAsset = {
  '滨江科技园A座8层': '杭州滨江资产经营有限公司',
  '西湖区文三路商铺': '杭州西湖文旅资产管理有限公司',
  '余杭区仓储中心3号库': '嘉兴绿谷仓储物流有限公司',
  '浦东新区厂房2号': '上海浦东金桥工业开发有限公司'
}

function stampTimes(b, i) {
  b.company = companyByAsset[b.assetName] || '杭州滨江资产经营有限公司'
  b.createTime = `${b.billMonth}-01 09:${String(10 + (i % 50)).padStart(2, '0')}:36`
  b.updateTime = b.status === '已缴费' ? `${b.billMonth}-06 15:${String(20 + (i % 40)).padStart(2, '0')}:08` : `${b.billMonth}-02 10:${String(30 + (i % 30)).padStart(2, '0')}:12`
}
bills.value.forEach(stampTimes)

const billProfiles = {
  '滨江科技园A座8层': {
    tenantType: '企业', contact: '周明轩', phone: '13857101234',
    contractNo: 'HT-2024-0156', signTime: '2024-01-10', contractType: '办公楼租赁合同', payCycle: '按月',
    leaseStart: '2024-02-01', leaseEnd: '2027-01-31', dueDate: '每月15日', deposit: 116000, contractStatus: ['履约中', '已备案'],
    assets: [
      { region: '浙江省杭州市滨江区', project: '滨江科技园', zone: 'A座', assetNo: 'ZC-BJ-0081', address: '滨江科技园A座8层整层', company: '杭州滨江资产经营有限公司', leaseType: '整体出租' }
    ]
  },
  '西湖区文三路商铺': {
    tenantType: '企业', contact: '沈蓝海', phone: '13905712288',
    contractNo: 'HT-2023-0422', signTime: '2023-05-08', contractType: '商铺租赁合同', payCycle: '按季',
    leaseStart: '2023-06-01', leaseEnd: '2026-05-31', dueDate: '每季首月10日', deposit: 44000, contractStatus: ['履约中'],
    assets: [
      { region: '浙江省杭州市西湖区', project: '文三路商业街', zone: 'B区', assetNo: 'ZC-XH-0117', address: '文三路198号临街商铺', company: '杭州西湖文旅资产管理有限公司', leaseType: '部分出租' }
    ]
  },
  '余杭区仓储中心3号库': {
    tenantType: '企业', contact: '吴绿谷', phone: '13757309911',
    contractNo: 'HT-2023-0918', signTime: '2023-10-20', contractType: '仓库租赁合同', payCycle: '按半年',
    leaseStart: '2023-11-01', leaseEnd: '2028-10-31', dueDate: '每期首月20日', deposit: 70000, contractStatus: ['履约中', '已备案'],
    assets: [
      { region: '浙江省杭州市余杭区', project: '余杭仓储中心', zone: 'C区', assetNo: 'ZC-YH-0303', address: '余杭区仓储中心3号库', company: '嘉兴绿谷仓储物流有限公司', leaseType: '整体出租' },
      { region: '浙江省杭州市余杭区', project: '余杭仓储中心', zone: 'C区', assetNo: 'ZC-YH-0304', address: '余杭区仓储中心3号库附属堆场', company: '嘉兴绿谷仓储物流有限公司', leaseType: '整体出租' }
    ]
  },
  '浦东新区厂房2号': {
    tenantType: '企业', contact: '顾锦绣', phone: '13611882277',
    contractNo: 'HT-2024-0033', signTime: '2024-01-02', contractType: '厂房租赁合同', payCycle: '按季',
    leaseStart: '2024-01-15', leaseEnd: '2029-01-14', dueDate: '每季首月15日', deposit: 82000, contractStatus: ['履约中'],
    assets: [
      { region: '上海市浦东新区', project: '金桥工业坊', zone: 'D区', assetNo: 'ZC-PD-0202', address: '浦东新区厂房2号', company: '上海浦东金桥工业开发有限公司', leaseType: '整体出租' }
    ]
  }
}

const defaultProfile = {
  tenantType: '企业', contact: '—', phone: '—',
  contractNo: '—', signTime: '—', contractType: '—', payCycle: '按月',
  leaseStart: '—', leaseEnd: '—', dueDate: '—', deposit: 0, contractStatus: ['履约中'],
  assets: []
}

function profileOf(row) {
  return billProfiles[row.assetName] || defaultProfile
}

const companyOptions = computed(() => [...new Set(bills.value.map(b => b.company))])

// ===== 缴费周期配置 =====
const showCycle = ref(false)
const cycle = ref({ cycleType: 'monthly', billDay: 1, dueDay: 15, feeTypes: ['租金', '物业费'] })
const cycleLabelMap = { monthly: '按月', quarterly: '按季', halfyear: '按半年', yearly: '按年' }
const cycleMonths = { monthly: 1, quarterly: 3, halfyear: 6, yearly: 12 }
const cycleLabel = computed(() => cycleLabelMap[cycle.value.cycleType])
function saveCycle() {
  if (cycle.value.dueDay < cycle.value.billDay) {
    ElMessage.warning('缴费截止日应不早于出账日')
    return
  }
  if (!cycle.value.feeTypes.length) {
    ElMessage.warning('请至少选择一个计费项')
    return
  }
  showCycle.value = false
  ElMessage.success('缴费周期设置已保存')
}

// ===== 出账数据源（在租合同）=====
const leaseSources = ref([
  { tenant: '杭州星辰科技有限公司', assetName: '滨江科技园A座8层', fee: { '租金': 58000, '物业费': 6800, '水电费': 3000 } },
  { tenant: '浙江蓝海贸易公司', assetName: '西湖区文三路商铺', fee: { '租金': 22000, '物业费': 1800, '水电费': 1200 } },
  { tenant: '嘉兴绿谷农产品有限公司', assetName: '余杭区仓储中心3号库', fee: { '租金': 35000, '物业费': 2400, '水电费': 4000 } },
  { tenant: '上海锦绣服饰有限公司', assetName: '浦东新区厂房2号', fee: { '租金': 41000, '物业费': 3200, '水电费': 5600 } },
])
let billSeq = 1000

// ===== KPI =====
const totalReceivable = computed(() => bills.value.reduce((s, b) => s + Number(b.receivable || 0), 0).toFixed(2))
const totalReceived = computed(() => bills.value.reduce((s, b) => s + Number(b.received || 0), 0).toFixed(2))
const overdueCount = computed(() => bills.value.filter(b => b.status === '已逾期').length)
const collectionRate = computed(() => {
  const rec = Number(totalReceivable.value)
  if (!rec) return 0
  return Math.round(Number(totalReceived.value) / rec * 10000) / 100
})
const rateColor = computed(() => {
  const r = collectionRate.value
  if (r >= 85) return '#67c23a'
  if (r >= 60) return '#e6a23c'
  return '#f56c6c'
})

// 生成目标账期（当前日期所属周期）
function nextBillMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const filteredData = computed(() => {
  return bills.value.filter(b => {
    if (filters.value.keyword && !(b.billNo.includes(filters.value.keyword) || b.tenant.includes(filters.value.keyword))) return false
    if (filters.value.company && b.company !== filters.value.company) return false
    if (filters.value.feeType && b.feeType !== filters.value.feeType) return false
    if (filters.value.status && b.status !== filters.value.status) return false
    if (filters.value.month && b.billMonth !== filters.value.month) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function statusType(status) {
  if (status === '已缴费') return 'success'
  if (status === '待缴费') return 'warning'
  if (status === '已停用') return 'info'
  return 'danger'
}

function getSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, idx) => {
    if (idx === 0) { sums[idx] = '合计'; return }
    if (col.property === 'receivable') {
      sums[idx] = data.reduce((s, r) => s + Number(r.receivable || 0), 0).toFixed(2)
    } else if (col.property === 'received') {
      sums[idx] = data.reduce((s, r) => s + Number(r.received || 0), 0).toFixed(2)
    } else {
      sums[idx] = ''
    }
  })
  return sums
}

function handleSearch() { page.value = 1; ElMessage.success('查询完成') }
function resetFilters() { filters.value = { keyword: '', company: '', feeType: '', status: '', month: '' }; page.value = 1 }
function handleGenerate() {
  const month = nextBillMonth()
  const months = cycleMonths[cycle.value.cycleType]
  const ym = month.replace('-', '')
  let created = 0, skipped = 0
  leaseSources.value.forEach(src => {
    cycle.value.feeTypes.forEach(ft => {
      const base = src.fee[ft]
      if (base == null) return
      const exists = bills.value.some(b => b.tenant === src.tenant && b.assetName === src.assetName && b.feeType === ft && b.billMonth === month)
      if (exists) { skipped++; return }
      bills.value.unshift({
        id: Date.now() + Math.random(),
        billNo: `BILL${ym}${String(++billSeq).slice(-3)}`,
        tenant: src.tenant,
        assetName: src.assetName,
        feeType: ft,
        receivable: Number((base * months).toFixed(2)),
        received: 0,
        billMonth: month,
        status: '待缴费',
        company: companyByAsset[src.assetName] || '杭州滨江资产经营有限公司',
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      })
      created++
    })
  })
  page.value = 1
  if (created) ElMessage.success(`已按${cycleLabel.value}周期生成 ${created} 张账单（账期 ${month}）${skipped ? `，跳过 ${skipped} 张已存在` : ''}`)
  else ElMessage.info(`账期 ${month} 的账单均已存在，无需重复生成${skipped ? `（跳过 ${skipped} 张）` : ''}`)
}
function handleExport() {
  const headers = ['账单编号', '承租方', '资产名称', '费用类型', '应收金额(元)', '实缴金额(元)', '账单月份', '缴费状态']
  const rows = bills.value.map(r => [r.billNo, r.tenant, r.assetName, r.feeType, r.receivable, r.received, r.billMonth, r.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `账单数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const payDetailVisible = ref(false)
const detailRow = ref(null)

const detailProfile = computed(() => detailRow.value ? profileOf(detailRow.value) : defaultProfile)

const detailInvoice = computed(() => {
  const row = detailRow.value
  if (!row) return {}
  if (row.status === '已缴费') {
    return {
      invoiced: '已开票',
      invoiceNo: `FP${row.billNo.slice(4)}`,
      invoiceType: '增值税普通发票',
      invoiceDate: `${row.billMonth}-08`,
      amount: row.received
    }
  }
  return { invoiced: '未开票', invoiceNo: '—', invoiceType: '—', invoiceDate: '—', amount: 0 }
})

const detailOrder = computed(() => {
  const row = detailRow.value
  if (!row) return {}
  const ways = ['微信支付', '银行转账', '支付宝']
  const paid = row.status === '已缴费'
  return {
    orderNo: `DD${row.billNo}`,
    payNo: paid ? `PAY${row.billNo.slice(4)}${String(row.id).slice(-4)}` : '—',
    payTime: paid ? row.updateTime : '—',
    payNote: `${row.billMonth} 账期 ${row.feeType}`,
    dueTime: `${row.billMonth}-15 23:59:59`,
    amount: row.received,
    payWay: ways[Math.abs(Math.trunc(row.id)) % 3],
    remark: row.status === '已逾期' ? '已逾期，请尽快缴纳' : row.status === '已停用' ? '账单已停用' : '—'
  }
})

function handleView(row) {
  detailRow.value = row
  payDetailVisible.value = true
}

function handleStop(row) {
  ElMessageBox.confirm(`确认停用账单 ${row.billNo}？停用后该账单不再参与催缴与统计。`, '停用确认', { type: 'warning' })
    .then(() => {
      row.status = '已停用'
      row.updateTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      ElMessage.success('账单已停用')
    })
    .catch(() => {})
}

function handleUrge(row) {
  ElMessageBox.confirm(`确认向 ${row.tenant} 发送催缴通知？`, '催缴确认', { type: 'warning' })
    .then(() => {
      row.urgeStatus = '已催缴'
      row.urgeTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      ElMessage.success('催缴通知已发送')
    })
    .catch(() => {})
}

const showAdd = ref(false)
const addForm = ref({ tenant: '', assetName: '', feeType: '租金', billMonth: '', receivable: 0, remark: '' })

function openAddDialog() {
  addForm.value = { tenant: '', assetName: '', feeType: '租金', billMonth: nextBillMonth(), receivable: 0, remark: '' }
  showAdd.value = true
}

function onAddTenantChange(val) {
  const src = leaseSources.value.find(s => s.tenant === val)
  if (src) {
    addForm.value.assetName = src.assetName
    addForm.value.receivable = src.fee[addForm.value.feeType] || 0
  }
}

function onAddFeeTypeChange(val) {
  const src = leaseSources.value.find(s => s.tenant === addForm.value.tenant)
  if (src && src.fee[val] != null) addForm.value.receivable = src.fee[val]
}

function submitAdd() {
  if (!addForm.value.tenant) { ElMessage.warning('请选择承租方'); return }
  if (!addForm.value.billMonth) { ElMessage.warning('请选择账单月份'); return }
  if (!addForm.value.receivable) { ElMessage.warning('请填写应收金额'); return }
  const ym = addForm.value.billMonth.replace('-', '')
  const now = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  bills.value.unshift({
    id: Date.now(),
    billNo: `BILL${ym}${String(++billSeq).slice(-3)}`,
    tenant: addForm.value.tenant,
    assetName: addForm.value.assetName,
    feeType: addForm.value.feeType,
    receivable: addForm.value.receivable,
    received: 0,
    billMonth: addForm.value.billMonth,
    status: '待缴费',
    company: companyByAsset[addForm.value.assetName] || '杭州滨江资产经营有限公司',
    createTime: now,
    updateTime: now
  })
  page.value = 1
  showAdd.value = false
  ElMessage.success('账单新增成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.kpi-row { margin-bottom: 16px; }
.kpi { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 8px; display: flex; justify-content: center; align-items: center; height: 100%; }
.rate-v { font-size: 20px; font-weight: 700; }
.rate-l { font-size: 12px; color: #909399; margin-top: 2px; }
.kpi-inner { height: 100%; }
.kpi-box { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 12px; text-align: center; }
.kpi-v { font-size: 20px; font-weight: 600; }
.kpi-l { font-size: 12px; color: #909399; margin-top: 4px; }
.cycle-tip { grid-column: span 24; margin-top: 12px; background: #f4f8ff; border: 1px solid #d9ecff; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #606266; }
.unit { margin-left: 8px; color: #909399; font-size: 13px; }
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-select) { width: 100%; }
.table-card { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.expand-wrap { padding: 12px 24px; }
</style>
