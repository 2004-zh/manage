<template>
  <div class="page-container">
    <div class="page-header">
      <h2>保证金退还</h2>
      <div>
        <el-button type="primary" @click="openApplyDialog">申请退还</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <div class="stat-strip">
      <div class="stat-item">
        <div class="stat-value">{{ stats.contractCount }}</div>
        <div class="stat-label">合同总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalDeposit }}<span class="unit">元</span></div>
        <div class="stat-label">押金总额</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.receivedDeposit }}<span class="unit">元</span></div>
        <div class="stat-label">已收押金</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.pendingDeposit }}<span class="unit">元</span></div>
        <div class="stat-label">待收押金</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.refundingDeposit }}<span class="unit">元</span></div>
        <div class="stat-label">待退押金</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.refundedDeposit }}<span class="unit">元</span></div>
        <div class="stat-label">已退押金</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.collectRate }}<span class="unit">%</span></div>
        <div class="stat-label">押金收缴率</div>
      </div>
    </div>

    <el-card v-show="filterVisible" class="filter-bar" shadow="never">
      <el-row :gutter="16">
        <el-col :span="5">
          <el-input v-model="filters.keyword" placeholder="申请编号/承租方/合同编号" clearable prefix-icon="Search" />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="退还状态" clearable>
            <el-option label="待审批" value="待审批" />
            <el-option label="已退还" value="已退还" />
            <el-option label="已驳回" value="已驳回" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.depositType" placeholder="保证金类型" clearable>
            <el-option label="租赁保证金" value="租赁保证金" />
            <el-option label="履约保证金" value="履约保证金" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="table-card" shadow="never">
      <div class="table-toolbar">
        <span class="toolbar-title">保证金退还列表</span>
        <div class="icon-toolbar">
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" circle @click="handleRefresh" />
          </el-tooltip>
          <el-tooltip content="筛选" placement="top">
            <el-button :icon="Filter" circle @click="filterVisible = !filterVisible" />
          </el-tooltip>
        </div>
      </div>
      <el-table :data="pagedData" border stripe row-key="id">
        <el-table-column type="expand" width="40">
          <template #default="{ row }">
            <div class="expand-wrap">
              <div class="section-title">保证金缴纳信息</div>
              <div class="detail-grid">
                <div class="cell"><div class="label">保证金编号</div><div class="value">{{ row.depositNo }}</div></div>
                <div class="cell"><div class="label">缴纳日期</div><div class="value">{{ row.payDate }}</div></div>
                <div class="cell"><div class="label">缴费时间</div><div class="value">{{ row.payTime }}</div></div>
                <div class="cell"><div class="label">收款操作员</div><div class="value">{{ row.operator }}</div></div>
                <div class="cell">
                  <div class="label">收款状态</div>
                  <div class="value">
                    <el-tag size="small" :type="row.payStatus === '已收' ? 'success' : 'warning'">{{ row.payStatus }}</el-tag>
                  </div>
                </div>
              </div>
              <div class="section-title">转租信息</div>
              <div class="detail-grid">
                <div class="cell">
                  <div class="label">转租状态</div>
                  <div class="value">
                    <el-tag size="small" :type="row.subletStatus === '已转租' ? 'warning' : 'info'">{{ row.subletStatus }}</el-tag>
                  </div>
                </div>
                <div class="cell"><div class="label">转租说明</div><div class="value">{{ row.subletNote }}</div></div>
                <div class="cell"><div class="label">转租操作时间</div><div class="value">{{ row.subletTime }}</div></div>
                <div class="cell"><div class="label">转租操作员</div><div class="value">{{ row.subletOperator }}</div></div>
              </div>
              <div class="section-title">资产信息</div>
              <el-table :data="row.assets" border size="small">
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
        <el-table-column prop="applyNo" label="申请编号" width="125" />
        <el-table-column prop="tenant" label="承租方" width="170" show-overflow-tooltip />
        <el-table-column prop="contractNo" label="合同编号" width="120" />
        <el-table-column prop="depositType" label="保证金类型" width="105" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.depositType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="保证金金额(元)" width="130" align="right" />
        <el-table-column prop="applyDate" label="申请日期" width="100" align="center" />
        <el-table-column prop="status" label="退还状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="success" link size="small" @click="openSitePay(row)" :disabled="row.payStatus === '已收'">现场缴费</el-button>
            <el-button type="warning" link size="small" @click="handleApprove(row)" :disabled="row.status !== '待审批'">审批</el-button>
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

    <!-- 申请退还对话框 -->
    <el-dialog v-model="applyDialogVisible" title="申请退还保证金" width="600px" destroy-on-close>
      <el-form :model="form" label-width="110px" :rules="rules" ref="formRef">
        <el-form-item label="承租方" prop="tenant">
          <el-input v-model="form.tenant" placeholder="请输入承租方名称" />
        </el-form-item>
        <el-form-item label="合同编号" prop="contractNo">
          <el-input v-model="form.contractNo" placeholder="请输入合同编号" />
        </el-form-item>
        <el-form-item label="保证金类型" prop="depositType">
          <el-select v-model="form.depositType" style="width: 100%">
            <el-option label="租赁保证金" value="租赁保证金" />
            <el-option label="履约保证金" value="履约保证金" />
          </el-select>
        </el-form-item>
        <el-form-item label="保证金金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" placeholder="请输入金额" />
        </el-form-item>
        <el-form-item label="退还原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" :rows="3" placeholder="请输入退还原因" />
        </el-form-item>
        <el-form-item label="退款账户" prop="bankAccount">
          <el-input v-model="form.bankAccount" placeholder="请输入退款账户" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交</el-button>
      </template>
    </el-dialog>

    <!-- 保证金退还详情抽屉 -->
    <el-drawer v-model="detailVisible" title="保证金退还详情" size="560px">
      <template v-if="currentRow">
        <div class="detail-status">
          <el-tag :type="statusType(currentRow.status)" effect="dark" size="large">{{ currentRow.status }}</el-tag>
          <span class="apply-no">{{ currentRow.applyNo }}</span>
        </div>

        <el-divider content-position="left">租赁信息</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="承租方">{{ currentRow.tenant }}</el-descriptions-item>
          <el-descriptions-item label="租赁资产">{{ detail.assetName }}</el-descriptions-item>
          <el-descriptions-item label="租赁面积">{{ detail.area }} ㎡</el-descriptions-item>
          <el-descriptions-item label="租赁状态">
            <el-tag size="small" :type="detail.leaseStatus === '已退租' ? 'info' : 'success'">{{ detail.leaseStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">合同信息</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="合同编号">{{ currentRow.contractNo }}</el-descriptions-item>
          <el-descriptions-item label="合同期限">{{ detail.contractPeriod }}</el-descriptions-item>
          <el-descriptions-item label="月租金">￥{{ detail.monthlyRent }}</el-descriptions-item>
          <el-descriptions-item label="合同状态">
            <el-tag size="small" type="warning">{{ detail.contractStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">保证金信息</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="保证金类型">{{ currentRow.depositType }}</el-descriptions-item>
          <el-descriptions-item label="缴纳金额">￥{{ currentRow.amount }}</el-descriptions-item>
          <el-descriptions-item label="缴纳日期">{{ currentRow.payDate }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ currentRow.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="应扣费用">
            <span :style="{ color: detail.deduction > 0 ? '#f56c6c' : '#67c23a' }">￥{{ detail.deduction }}</span>
            <span v-if="detail.deductionReason" class="deduct-reason">（{{ detail.deductionReason }}）</span>
          </el-descriptions-item>
          <el-descriptions-item label="应退金额">
            <span style="color:#409eff;font-weight:600">￥{{ currentRow.amount - detail.deduction }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款账户">{{ detail.bankAccount }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">发票信息</el-divider>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="开票状态">
            <el-tag size="small" :type="detail.invoiceStatus === '已开票' ? 'success' : 'info'">{{ detail.invoiceStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="detail.invoiceNo" label="发票号码">{{ detail.invoiceNo }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.invoiceType" label="发票类型">{{ detail.invoiceType }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.invoiceDate" label="开票日期">{{ detail.invoiceDate }}</el-descriptions-item>
          <el-descriptions-item v-if="!detail.invoiceNo" label="说明">
            <span class="muted">保证金收据未开具增值税发票，退还时无需红冲。</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentRow && currentRow.status === '待审批'" type="primary" @click="openRefundDialog(currentRow)">审批退还</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="refundVisible" title="保证金退还" width="960px" top="4vh">
      <template v-if="currentRow">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ refundProfile.tenantType }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ currentRow.tenant }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ refundProfile.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ refundProfile.phone }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value">{{ currentRow.contractNo }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ refundProfile.signTime }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ refundProfile.contractType }}</div></div>
          <div class="cell"><div class="label">使用方式</div><div class="value">{{ refundProfile.usage }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value hl">￥{{ refundProfile.monthlyRent }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ refundProfile.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ refundProfile.leaseStart }} 至 {{ refundProfile.leaseEnd }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ refundProfile.dueDate }}</div></div>
          <div class="cell"><div class="label">断租时间</div><div class="value">{{ refundProfile.breakTime }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value hl">￥{{ currentRow.amount }}</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag v-for="s in refundProfile.contractStatus" :key="s" size="small" :type="s === '已终止' || s === '已到期' ? 'info' : 'success'" style="margin-right: 4px">{{ s }}</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">欠费</div>
            <div class="value">
              <el-tag v-if="refundProfile.arrears > 0" type="danger" size="small">欠费￥{{ refundProfile.arrears }}</el-tag>
              <el-tag v-else type="success" size="small">无欠费</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">合同预览</div>
            <div class="value">
              <el-button type="primary" link size="small" @click="previewRefundContract">合同预览</el-button>
            </div>
          </div>
          <div class="cell"><div class="label">协定</div><div class="value">{{ refundProfile.agreement }}</div></div>
        </div>
        <div class="section-title">发票抬头信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">类型</div><div class="value">{{ refundProfile.invoiceTitle.type }}</div></div>
          <div class="cell"><div class="label">发票抬头</div><div class="value">{{ refundProfile.invoiceTitle.title }}</div></div>
          <div class="cell"><div class="label">纳税识别号</div><div class="value">{{ refundProfile.invoiceTitle.taxNo }}</div></div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="currentRow.assets" border size="small" style="margin-bottom: 12px">
          <el-table-column prop="region" label="省市区" min-width="150" />
          <el-table-column prop="project" label="项目" min-width="120" />
          <el-table-column prop="zone" label="分区" width="90" />
          <el-table-column prop="assetNo" label="资产编号" width="120" />
          <el-table-column prop="address" label="资产座落" min-width="170" />
          <el-table-column prop="company" label="所属公司" min-width="170" />
          <el-table-column prop="leaseType" label="租赁类型" width="100" align="center" />
        </el-table>
        <div class="section-title">保证金信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">保证金</div><div class="value hl">￥{{ currentRow.amount }}</div></div>
          <div class="cell"><div class="label">保证金编号</div><div class="value">{{ currentRow.depositNo }}</div></div>
          <div class="cell"><div class="label">支付时间</div><div class="value">{{ currentRow.payTime }}</div></div>
          <div class="cell"><div class="label">支付方式</div><div class="value">{{ refundProfile.payMethod }}</div></div>
          <div class="cell">
            <div class="label">状态</div>
            <div class="value">
              <el-tag size="small" :type="currentRow.payStatus === '已收' ? 'success' : 'warning'">{{ currentRow.payStatus }}</el-tag>
            </div>
          </div>
        </div>
        <el-form label-width="90px" style="margin-top: 4px">
          <el-form-item label="退还金额">
            <el-input-number v-model="refundForm.amount" :min="0" :max="currentRow.amount" :precision="2" style="width: 220px" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="refundForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="refundVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRefund">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sitePayVisible" title="现场缴费" width="460px">
      <el-form label-width="100px">
        <el-form-item label="承租方">
          <span>{{ currentRow?.tenant }}</span>
        </el-form-item>
        <el-form-item label="保证金编号">
          <span>{{ currentRow?.depositNo }}</span>
        </el-form-item>
        <el-form-item label="缴费金额">
          <el-input-number v-model="sitePayForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="缴费方式">
          <el-select v-model="sitePayForm.payWay" style="width: 100%">
            <el-option label="现金" value="现金" />
            <el-option label="POS刷卡" value="POS刷卡" />
            <el-option label="微信支付" value="微信支付" />
            <el-option label="支付宝" value="支付宝" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sitePayVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSitePay">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Filter } from '@element-plus/icons-vue'

const filters = ref({ keyword: '', status: '', depositType: '' })
const filterVisible = ref(true)
const page = ref(1)
const pageSize = ref(10)

const deposits = ref([
  { id: 1, applyNo: 'REF20240901', depositNo: 'BZJ202308050001', tenant: '杭州星辰科技有限公司', contractNo: 'HT20230801', depositType: '租赁保证金', amount: 116000, payDate: '2023-08-05', payTime: '2023-08-05 10:22:31', operator: '王丽', payStatus: '已收', applyDate: '2024-09-10', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '待审批',
    assets: [{ region: '浙江省杭州市上城区', project: '安东大厦', zone: 'A区', assetNo: 'ZC-HZ-0601', address: '安东大厦6F 601室', company: '杭州城投资产经营有限公司', leaseType: '部分出租' }] },
  { id: 2, applyNo: 'REF20240902', depositNo: 'BZJ202205200002', tenant: '浙江蓝海贸易公司', contractNo: 'HT20220515', depositType: '租赁保证金', amount: 44000, payDate: '2022-05-20', payTime: '2022-05-20 14:05:47', operator: '陈强', payStatus: '已收', applyDate: '2024-09-12', subletStatus: '已转租', subletNote: '整体转租给宁波云帆信息科技有限公司，保证金随合同转移', subletTime: '2024-03-18 09:41:20', subletOperator: '陈强', status: '已退还',
    assets: [{ region: '浙江省杭州市西湖区', project: '吴航街道商业街', zone: 'B区', assetNo: 'ZC-HZ-0117', address: '吴航街道商业街A-01商铺', company: '杭州西湖文旅资产管理有限公司', leaseType: '部分出租' }] },
  { id: 3, applyNo: 'REF20240903', depositNo: 'BZJ202311150003', tenant: '嘉兴绿谷农产品有限公司', contractNo: 'HT20231110', depositType: '履约保证金', amount: 50000, payDate: '2023-11-15', payTime: '2023-11-15 16:32:09', operator: '王丽', payStatus: '已收', applyDate: '2024-09-15', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '待审批',
    assets: [{ region: '浙江省嘉兴市南湖区', project: '营前标准厂房', zone: 'C区', assetNo: 'ZC-JX-0202', address: '营前标准厂房2#', company: '嘉兴绿谷仓储物流有限公司', leaseType: '整体出租' }] },
  { id: 4, applyNo: 'REF20240904', depositNo: 'BZJ202401080004', tenant: '上海锦绣服饰有限公司', contractNo: 'HT20240103', depositType: '租赁保证金', amount: 88000, payDate: '2024-01-08', payTime: '2024-01-08 11:18:55', operator: '李芳', payStatus: '已收', applyDate: '2024-09-20', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '已驳回',
    assets: [{ region: '上海市浦东新区', project: '航城商务楼', zone: 'D区', assetNo: 'ZC-SH-0303', address: '航城商务楼3F整层', company: '上海浦东金桥工业开发有限公司', leaseType: '整体出租' }] },
  { id: 5, applyNo: 'REF20240905', depositNo: 'BZJ202306250005', tenant: '南京云帆信息科技有限公司', contractNo: 'HT20230620', depositType: '履约保证金', amount: 30000, payDate: '2023-06-25', payTime: '2023-06-25 09:47:13', operator: '陈强', payStatus: '已收', applyDate: '2024-09-22', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '已退还',
    assets: [{ region: '江苏省南京市建邺区', project: '云帆科创园', zone: 'A区', assetNo: 'ZC-NJ-0411', address: '云帆科创园B座5层', company: '南京建邺科创资产管理有限公司', leaseType: '部分出租' }] },
  { id: 6, applyNo: 'REF20240906', depositNo: 'BZJ202402050006', tenant: '宁波海天机械有限公司', contractNo: 'HT20240201', depositType: '租赁保证金', amount: 72000, payDate: '2024-02-05', payTime: '—', operator: '—', payStatus: '待收', applyDate: '2024-09-28', subletStatus: '无', subletNote: '—', subletTime: '—', subletOperator: '—', status: '待审批',
    assets: [{ region: '浙江省宁波市北仑区', project: '海天装备园', zone: 'E区', assetNo: 'ZC-NB-0508', address: '海天装备园1号车间', company: '宁波北仑工业资产运营有限公司', leaseType: '整体出租' }] },
])

const filteredData = computed(() => {
  return deposits.value.filter(d => {
    if (filters.value.keyword && !(d.applyNo.includes(filters.value.keyword) || d.tenant.includes(filters.value.keyword) || d.contractNo.includes(filters.value.keyword))) return false
    if (filters.value.status && d.status !== filters.value.status) return false
    if (filters.value.depositType && d.depositType !== filters.value.depositType) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const stats = computed(() => {
  const list = deposits.value
  const totalDeposit = list.reduce((s, d) => s + d.amount, 0)
  const receivedDeposit = list.filter(d => d.payStatus === '已收').reduce((s, d) => s + d.amount, 0)
  return {
    contractCount: new Set(list.map(d => d.contractNo)).size,
    totalDeposit,
    receivedDeposit,
    pendingDeposit: list.filter(d => d.payStatus === '待收').reduce((s, d) => s + d.amount, 0),
    refundingDeposit: list.filter(d => d.status === '待审批').reduce((s, d) => s + d.amount, 0),
    refundedDeposit: list.filter(d => d.status === '已退还').reduce((s, d) => s + d.amount, 0),
    collectRate: totalDeposit > 0 ? (receivedDeposit / totalDeposit * 100).toFixed(1) : '0.0'
  }
})

function handleRefresh() {
  page.value = 1
  ElMessage.success('保证金数据已刷新')
}

function statusType(status) {
  if (status === '已退还') return 'success'
  if (status === '待审批') return 'warning'
  return 'danger'
}

const applyDialogVisible = ref(false)
const formRef = ref(null)
const form = ref({ tenant: '', contractNo: '', depositType: '租赁保证金', amount: 0, reason: '', bankAccount: '' })
const rules = {
  tenant: [{ required: true, message: '请输入承租方', trigger: 'blur' }],
  contractNo: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  depositType: [{ required: true, message: '请选择保证金类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入保证金金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退还原因', trigger: 'blur' }],
  bankAccount: [{ required: true, message: '请输入退款账户', trigger: 'blur' }],
}

function openApplyDialog() {
  form.value = { tenant: '', contractNo: '', depositType: '租赁保证金', amount: 0, reason: '', bankAccount: '' }
  applyDialogVisible.value = true
}
function submitApply() {
  formRef.value.validate(valid => {
    if (!valid) return
    const no = 'REF' + Date.now()
    deposits.value.unshift({
      id: deposits.value.length + 1,
      applyNo: no,
      depositNo: 'BZJ' + Date.now(),
      tenant: form.value.tenant,
      contractNo: form.value.contractNo,
      depositType: form.value.depositType,
      amount: form.value.amount,
      payDate: new Date().toISOString().slice(0, 10),
      payTime: '—',
      operator: '—',
      payStatus: '待收',
      applyDate: new Date().toISOString().slice(0, 10),
      subletStatus: '无',
      subletNote: '—',
      subletTime: '—',
      subletOperator: '—',
      status: '待审批',
      assets: [],
    })
    applyDialogVisible.value = false
    ElMessage.success('申请已提交，等待审批')
  })
}

function handleSearch() { page.value = 1; ElMessage.success('查询完成') }
function resetFilters() { filters.value = { keyword: '', status: '', depositType: '' }; page.value = 1 }
function handleExport() {
  const headers = ['申请编号', '承租方', '合同编号', '保证金类型', '保证金金额(元)', '申请日期', '退还状态']
  const rows = deposits.value.map(r => [r.applyNo, r.tenant, r.contractNo, r.depositType, r.amount, r.applyDate, r.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `保证金数据_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const detailVisible = ref(false)
const currentRow = ref(null)

const relatedDetail = {
  HT20230801: { assetName: '安东大厦 6F 601 室', area: 200, leaseStatus: '已退租', contractPeriod: '2023-08-01 至 2026-07-31', monthlyRent: 5000, contractStatus: '已终止', deduction: 1200, deductionReason: '欠缴物业费', bankAccount: '招商银行杭州分行 6225****3390', invoiceStatus: '已开票', invoiceNo: 'FP-2023-0815', invoiceType: '增值税普通发票', invoiceDate: '2023-08-06' },
  HT20220515: { assetName: '吴航街道商业街 A-01 商铺', area: 120, leaseStatus: '已退租', contractPeriod: '2022-05-15 至 2025-05-14', monthlyRent: 8800, contractStatus: '已到期', deduction: 0, deductionReason: '', bankAccount: '中国银行浙江分行 6217****8801', invoiceStatus: '已开票', invoiceNo: 'FP-2022-0533', invoiceType: '增值税普通发票', invoiceDate: '2022-05-21' },
  HT20231110: { assetName: '营前标准厂房 2#', area: 1000, leaseStatus: '退租中', contractPeriod: '2023-11-10 至 2028-11-09', monthlyRent: 20000, contractStatus: '提前退租', deduction: 5000, deductionReason: '厂房结构恢复费', bankAccount: '农业银行嘉兴分行 6228****1177', invoiceStatus: '未开票', invoiceNo: '', invoiceType: '', invoiceDate: '' },
  HT20240103: { assetName: '航城商务楼 3F', area: 300, leaseStatus: '在租', contractPeriod: '2024-01-03 至 2027-01-02', monthlyRent: 15000, contractStatus: '履约中', deduction: 0, deductionReason: '', bankAccount: '建设银行上海分行 6217****2266', invoiceStatus: '已开票', invoiceNo: 'FP-2024-0092', invoiceType: '增值税专用发票', invoiceDate: '2024-01-09' },
}

const detail = computed(() => {
  const row = currentRow.value
  if (!row) return {}
  return relatedDetail[row.contractNo] || {
    assetName: '—', area: '—', leaseStatus: '已退租',
    contractPeriod: '—', monthlyRent: '—', contractStatus: '已终止',
    deduction: 0, deductionReason: '', bankAccount: '—',
    invoiceStatus: '未开票', invoiceNo: '', invoiceType: '', invoiceDate: ''
  }
})

function handleView(row) {
  currentRow.value = row
  detailVisible.value = true
}
function handleApprove(row) {
  ElMessageBox.confirm(`是否批准 ${row.tenant} 的保证金退还申请（${row.amount} 元）？`, '审批确认', { type: 'warning' })
    .then(() => { row.status = '已退还'; ElMessage.success('审批通过'); detailVisible.value = false })
    .catch(() => {})
}

const refundProfiles = {
  HT20230801: {
    tenantType: '企业', contact: '周明轩', phone: '13857101234',
    signTime: '2023-08-01', contractType: '办公楼租赁合同', usage: '办公', monthlyRent: 5000, payCycle: '按月',
    leaseStart: '2023-08-01', leaseEnd: '2026-07-31', dueDate: '每月15日', breakTime: '2024-08-31',
    contractStatus: ['已终止', '已备案'], arrears: 1200, agreement: '提前退租需提前3个月书面申请，保证金扣除欠费后退还',
    invoiceTitle: { type: '企业', title: '杭州星辰科技有限公司', taxNo: '91330106MA27XXXX1B' }, payMethod: '银行转账'
  },
  HT20220515: {
    tenantType: '企业', contact: '沈蓝海', phone: '13905712288',
    signTime: '2022-05-15', contractType: '商铺租赁合同', usage: '商业经营', monthlyRent: 8800, payCycle: '按季',
    leaseStart: '2022-05-15', leaseEnd: '2025-05-14', dueDate: '每季首月10日', breakTime: '2024-02-29',
    contractStatus: ['已到期'], arrears: 0, agreement: '合同到期后30个工作日内无息退还保证金',
    invoiceTitle: { type: '企业', title: '浙江蓝海贸易公司', taxNo: '91330106MA28XXXX2C' }, payMethod: '银行转账'
  },
  HT20231110: {
    tenantType: '企业', contact: '吴绿谷', phone: '13757309911',
    signTime: '2023-11-10', contractType: '厂房租赁合同', usage: '工业生产', monthlyRent: 20000, payCycle: '按半年',
    leaseStart: '2023-11-10', leaseEnd: '2028-11-09', dueDate: '每期首月20日', breakTime: '2024-09-30',
    contractStatus: ['提前退租', '履约中'], arrears: 5000, agreement: '提前退租需恢复厂房原状，恢复费用从保证金中扣除',
    invoiceTitle: { type: '企业', title: '嘉兴绿谷农产品有限公司', taxNo: '91330402MA29XXXX3D' }, payMethod: '微信支付'
  },
  HT20240103: {
    tenantType: '企业', contact: '顾锦绣', phone: '13611882277',
    signTime: '2024-01-03', contractType: '办公楼租赁合同', usage: '办公', monthlyRent: 15000, payCycle: '按季',
    leaseStart: '2024-01-03', leaseEnd: '2027-01-02', dueDate: '每季首月15日', breakTime: '—',
    contractStatus: ['履约中', '已备案'], arrears: 0, agreement: '在租期间不得申请退还保证金',
    invoiceTitle: { type: '企业', title: '上海锦绣服饰有限公司', taxNo: '91310115MA30XXXX4E' }, payMethod: 'POS刷卡'
  },
  HT20230620: {
    tenantType: '企业', contact: '扬帆', phone: '13851236677',
    signTime: '2023-06-20', contractType: '办公楼租赁合同', usage: '研发办公', monthlyRent: 9600, payCycle: '按月',
    leaseStart: '2023-06-20', leaseEnd: '2026-06-19', dueDate: '每月20日', breakTime: '2024-06-30',
    contractStatus: ['已终止'], arrears: 0, agreement: '履约保证金于合同终止且无违约情形时全额退还',
    invoiceTitle: { type: '企业', title: '南京云帆信息科技有限公司', taxNo: '91320105MA31XXXX5F' }, payMethod: '银行转账'
  },
  HT20240201: {
    tenantType: '企业', contact: '海天明', phone: '13957268899',
    signTime: '2024-02-01', contractType: '厂房租赁合同', usage: '装备制造', monthlyRent: 24000, payCycle: '按季',
    leaseStart: '2024-02-01', leaseEnd: '2029-01-31', dueDate: '每季首月05日', breakTime: '—',
    contractStatus: ['履约中'], arrears: 0, agreement: '保证金到账后合同生效，未缴清前不予退还',
    invoiceTitle: { type: '企业', title: '宁波海天机械有限公司', taxNo: '91330206MA32XXXX6G' }, payMethod: '现金'
  }
}

const defaultRefundProfile = {
  tenantType: '企业', contact: '—', phone: '—',
  signTime: '—', contractType: '—', usage: '—', monthlyRent: 0, payCycle: '—',
  leaseStart: '—', leaseEnd: '—', dueDate: '—', breakTime: '—',
  contractStatus: ['已终止'], arrears: 0, agreement: '—',
  invoiceTitle: { type: '企业', title: '—', taxNo: '—' }, payMethod: '—'
}

const refundVisible = ref(false)
const refundForm = ref({ amount: 0, remark: '' })

const refundProfile = computed(() => {
  if (!currentRow.value) return defaultRefundProfile
  return refundProfiles[currentRow.value.contractNo] || defaultRefundProfile
})

function openRefundDialog(row) {
  currentRow.value = row
  const deduction = (refundProfiles[row.contractNo]?.arrears) || 0
  refundForm.value = { amount: Math.max(0, row.amount - deduction), remark: '' }
  detailVisible.value = false
  refundVisible.value = true
}

function previewRefundContract() {
  const row = currentRow.value
  const p = refundProfile.value
  ElMessageBox.alert(`合同编号：${row.contractNo}\n合同类型：${p.contractType}\n租赁时间：${p.leaseStart} 至 ${p.leaseEnd}\n断租时间：${p.breakTime}\n协定：${p.agreement}`, '合同预览', { confirmButtonText: '关闭' })
}

function submitRefund() {
  const row = currentRow.value
  if (!row) return
  if (refundForm.value.amount > row.amount) {
    ElMessage.warning('退还金额不能大于保证金金额')
    return
  }
  row.status = '已退还'
  refundVisible.value = false
  ElMessage.success(`保证金 ￥${refundForm.value.amount.toFixed(2)} 已退还至 ${row.tenant}`)
}

const sitePayVisible = ref(false)
const sitePayForm = ref({ amount: 0, payWay: '现金' })

function openSitePay(row) {
  currentRow.value = row
  sitePayForm.value = { amount: row.amount, payWay: '现金' }
  sitePayVisible.value = true
}

function submitSitePay() {
  const row = currentRow.value
  if (!sitePayForm.value.amount) {
    ElMessage.warning('请填写缴费金额')
    return
  }
  row.payStatus = '已收'
  row.payTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  row.operator = '当前操作员'
  sitePayVisible.value = false
  ElMessage.success(`现场缴费成功，收取保证金 ￥${sitePayForm.value.amount.toFixed(2)}（${sitePayForm.value.payWay}）`)
}

</script>

<style scoped>
.page-container { padding: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-select) { width: 100%; }
.table-card { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
.table-toolbar { display: flex; align-items: center; margin-bottom: 12px; }
.table-toolbar .toolbar-title { font-size: 14px; font-weight: 600; color: #333; }
.expand-wrap { padding: 12px 24px; }
.detail-status { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.apply-no { font-size: 14px; color: #606266; font-weight: 600; }
.deduct-reason { color: #909399; font-size: 12px; }
.muted { color: #909399; font-size: 13px; }
</style>
