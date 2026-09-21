<template>
  <div class="ent-fee">
    <div class="page-header">
      <h2>应收实收台账</h2>
      <span class="page-subtitle">金额单位：万元</span>
    </div>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color: #1890ff">{{ feeSummary.cumReceivable }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">累计应收</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color: #52c41a">{{ feeSummary.cumActual }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">累计实收</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color: #f5222d">{{ feeSummary.arrears }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">欠缴金额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color: #fa8c16">{{ collectionRate }}<span class="kpi-unit">%</span></div>
          <div class="kpi-label">当年度收缴率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="收费大厅" name="hall">
        <div class="stat-strip">
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.rentingCount }}</div>
            <div class="stat-label">在租资产数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.monthReceivable }}<span class="unit">元</span></div>
            <div class="stat-label">本月应收</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.monthActual }}<span class="unit">元</span></div>
            <div class="stat-label">本月实收</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.yearActual }}<span class="unit">元</span></div>
            <div class="stat-label">本年实收</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.arrearsTotal }}<span class="unit">元</span></div>
            <div class="stat-label">欠缴总额</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ hallStats.monthRate }}<span class="unit">%</span></div>
            <div class="stat-label">本月收缴率</div>
          </div>
        </div>

        <div class="hall-toolbar">
          <el-button :icon="Download" @click="downloadHallTemplate">模板下载</el-button>
          <el-button type="primary" :icon="Bell" @click="batchUrgeHall">批量催缴</el-button>
          <el-button :icon="Upload" @click="importHallData">导入</el-button>
          <div class="icon-toolbar">
            <el-tooltip content="刷新" placement="top">
              <el-button :icon="Refresh" circle @click="refreshHall" />
            </el-tooltip>
            <el-tooltip content="筛选" placement="top">
              <el-button :icon="Filter" circle @click="hallFilterOn = !hallFilterOn" />
            </el-tooltip>
          </div>
        </div>

        <div v-show="hallFilterOn" class="hall-filter">
          <el-input v-model="hallKeyword" placeholder="合同编号/承租方" clearable style="width: 200px" />
          <el-select v-model="hallArrears" placeholder="欠缴状态" clearable style="width: 140px">
            <el-option label="有欠缴" value="有欠缴" />
            <el-option label="无欠缴" value="无欠缴" />
          </el-select>
          <el-select v-model="hallRentType" placeholder="租金类型" clearable style="width: 140px">
            <el-option label="固定租金" value="固定租金" />
            <el-option label="递增租金" value="递增租金" />
            <el-option label="提成租金" value="提成租金" />
          </el-select>
        </div>

        <el-table :data="pagedHall" border stripe row-key="id">
          <el-table-column type="selection" width="40" />
          <el-table-column type="expand" width="40">
            <template #default="{ row }">
              <div class="expand-wrap">
                <div class="section-title">合同缴费信息</div>
                <div class="detail-grid">
                  <div class="cell">
                    <div class="label">合同过期</div>
                    <div class="value">
                      <el-tag size="small" :type="row.expired ? 'danger' : 'success'">{{ row.expired ? '已过期' : '未过期' }}</el-tag>
                    </div>
                  </div>
                  <div class="cell"><div class="label">缴费周期</div><div class="value">{{ row.payCycle }}</div></div>
                  <div class="cell"><div class="label">交费截至时间</div><div class="value">{{ row.dueDate }}</div></div>
                  <div class="cell"><div class="label">总减免金额(元)</div><div class="value">{{ row.reduction }}</div></div>
                  <div class="cell"><div class="label">新租时间</div><div class="value">{{ row.newRentTime }}</div></div>
                </div>
                <div class="section-title">资产信息</div>
                <el-table :data="row.assets" border size="small">
                  <el-table-column prop="region" label="省市区" min-width="150" />
                  <el-table-column prop="project" label="项目" min-width="130" />
                  <el-table-column prop="zone" label="分区" width="90" />
                  <el-table-column prop="assetNo" label="资产编号" width="120" />
                  <el-table-column prop="address" label="资产座落" min-width="180" />
                  <el-table-column prop="company" label="所属公司" min-width="180" />
                  <el-table-column prop="leaseType" label="租赁类型" width="100" align="center" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="contractNo" label="合同编号" width="125" />
          <el-table-column prop="tenantName" label="承租方" width="170" show-overflow-tooltip />
          <el-table-column label="租金类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.rentType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="租赁起止时间" width="180">
            <template #default="{ row }">{{ row.leaseStart }} 至 {{ row.leaseEnd }}</template>
          </el-table-column>
          <el-table-column prop="monthlyRent" label="月租金(元)" width="105" align="right" />
          <el-table-column label="当前欠缴" width="110" align="center">
            <template #default="{ row }">
              <span v-if="row.arrearsMonths > 0" style="color: #f5222d; font-weight: 600">{{ row.arrearsMonths }}个月未缴</span>
              <span v-else style="color: #52c41a">无欠缴</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRentCollect(row)">租金收取</el-button>
              <el-button type="success" link size="small" @click="openOtherCharge(row)">其他收费</el-button>
              <el-dropdown style="margin-left: 8px" @command="cmd => handleHallCommand(cmd, row)">
                <el-button type="info" link size="small" :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">缴费明细</el-dropdown-item>
                    <el-dropdown-item command="urge">催缴</el-dropdown-item>
                    <el-dropdown-item command="contract">合同预览</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="hallPage"
            v-model:page-size="hallSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredHall.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="应收实收台账" name="ledger">
        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="状态">
              <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 120px">
                <el-option label="正常" value="正常" />
                <el-option label="欠缴" value="欠缴" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleBatchBilling">批量生成账单</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="pagedLedger" border stripe show-summary :summary-method="getSummaries">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="contractId" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="cumReceivable" label="累计应收" width="100" align="right" />
          <el-table-column prop="cumActual" label="累计实收" width="100" align="right" />
          <el-table-column prop="yearReceivable" label="当年应收" width="100" align="right" />
          <el-table-column prop="yearActual" label="当年实收" width="100" align="right" />
          <el-table-column prop="arrears" label="欠缴" width="80" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.arrears > 0 ? '#f5222d' : '#333' }">{{ row.arrears }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === '欠缴'" type="warning" link size="small" @click="handleUrge(row)">催缴</el-button>
              <el-button type="primary" link size="small" @click="generateBill(row)">出账</el-button>
              <el-button type="success" link size="small" @click="openInvoice(row)">开票</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="ledgerPage"
            v-model:page-size="ledgerSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredRecords.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="保证金管理" name="deposit">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ depositStats.total }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">保证金总额</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ depositStats.held }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">在管保证金</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ depositStats.pendingRefund }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">待退还</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ depositStats.refunded }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">已退还</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="depositRecords" border stripe>
          <el-table-column prop="contractId" label="合同编号" width="130" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="depositAmount" label="保证金(万元)" width="120" align="right" />
          <el-table-column prop="receiveDate" label="收取日期" width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.depositStatus === '在管' ? 'success' : row.depositStatus === '待退还' ? 'warning' : 'info'" size="small">{{ row.depositStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button v-if="row.depositStatus === '在管'" type="warning" link size="small" @click="handleRefund(row)">申请退还</el-button>
              <el-button v-if="row.depositStatus === '待退还'" type="primary" link size="small" @click="confirmRefund(row)">确认退还</el-button>
              <el-button type="primary" link size="small" @click="viewDepositDetail(row)">明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="电子发票" name="invoice">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:600;font-size:14px">发票记录</span>
          <el-button type="primary" size="small" @click="showInvoiceDialog = true">开具发票</el-button>
        </div>

        <el-table :data="invoiceRecords" border stripe>
          <el-table-column prop="invoiceNo" label="发票号码" width="140" />
          <el-table-column prop="invoiceType" label="发票类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ row.invoiceType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="amount" label="金额(万元)" width="100" align="right" />
          <el-table-column prop="tax" label="税额(万元)" width="100" align="right" />
          <el-table-column prop="issueDate" label="开票日期" width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.invoiceStatus === '已开具' ? 'success' : row.invoiceStatus === '已红冲' ? 'danger' : 'warning'" size="small">{{ row.invoiceStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewInvoice(row)">查看</el-button>
              <el-button v-if="row.invoiceStatus === '已开具'" type="danger" link size="small" @click="handleRedInvoice(row)">红冲</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="自动账单" name="autoBill">
        <el-card shadow="never" style="margin-bottom:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>自动出账规则</span>
              <el-button type="primary" size="small" @click="showRuleDialog = true">新增规则</el-button>
            </div>
          </template>
          <el-table :data="billingRules" border stripe>
            <el-table-column prop="name" label="规则名称" min-width="180" />
            <el-table-column prop="billingCycle" label="出账周期" width="100" />
            <el-table-column prop="advanceDays" label="提前天数" width="90" align="center" />
            <el-table-column prop="nextRunDate" label="下次执行" width="120" />
            <el-table-column label="启用状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleRule(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="runRuleNow(row)">立即执行</el-button>
                <el-button type="danger" link size="small" @click="deleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span>账单记录</span>
          </template>
          <el-table :data="billRecords" border stripe>
            <el-table-column prop="billNo" label="账单编号" width="140" />
            <el-table-column prop="contractId" label="合同编号" width="130" />
            <el-table-column prop="tenant" label="承租方" min-width="180" />
            <el-table-column prop="billPeriod" label="账单期间" width="180" />
            <el-table-column prop="amount" label="金额(万元)" width="100" align="right" />
            <el-table-column prop="dueDate" label="到期日" width="120" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.billStatus === '已缴' ? 'success' : row.billStatus === '逾期' ? 'danger' : 'warning'" size="small">{{ row.billStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewBill(row)">查看</el-button>
                <el-button v-if="row.billStatus === '待缴'" type="success" link size="small" @click="confirmPayment(row)">确认收款</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="缴费订单" name="payOrder">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ orderStats.total }}</div>
              <div class="kpi-label">订单总数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ orderStats.paidAmount }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">已支付金额</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ orderStats.pending }}</div>
              <div class="kpi-label">待支付订单</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ orderStats.failed }}</div>
              <div class="kpi-label">支付失败</div>
            </el-card>
          </el-col>
        </el-row>

        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="支付方式">
              <el-select v-model="orderPayMethod" clearable placeholder="全部" style="width:130px">
                <el-option label="微信扫码" value="微信扫码" />
                <el-option label="支付宝" value="支付宝" />
                <el-option label="银行转账" value="银行转账" />
                <el-option label="现金" value="现金" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="orderStatus" clearable placeholder="全部" style="width:120px">
                <el-option label="已支付" value="已支付" />
                <el-option label="待支付" value="待支付" />
                <el-option label="已退款" value="已退款" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredOrders" border stripe>
          <el-table-column prop="orderNo" label="订单号" width="180" />
          <el-table-column prop="contractId" label="合同编号" width="130" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="feeType" label="费项" width="90" />
          <el-table-column prop="amount" label="金额(万元)" width="110" align="right" />
          <el-table-column prop="payMethod" label="支付方式" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.payMethod === '微信扫码' ? 'success' : row.payMethod === '银行转账' ? 'primary' : 'warning'">{{ row.payMethod }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payTime" label="支付时间" width="160" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '已支付' ? 'success' : row.status === '待支付' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewOrder(row)">详情</el-button>
              <el-button v-if="row.status === '待支付'" type="success" link size="small" @click="showPayQr(row)">收款码</el-button>
              <el-button v-if="row.status === '待支付'" type="warning" link size="small" @click="confirmOrderPaid(row)">确认收款</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="历史欠费" name="history">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ historyStats.cumArrears }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">累计欠费</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ historyStats.monthArrears }}<span class="kpi-unit">万元</span></div>
              <div class="kpi-label">本月欠费</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ historyStats.arrearsContracts }}</div>
              <div class="kpi-label">欠费合同总数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ historyStats.arrearsAssets }}</div>
              <div class="kpi-label">欠费资产总数</div>
            </el-card>
          </el-col>
        </el-row>

        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="欠费状态">
              <el-select v-model="historyStatus" clearable placeholder="全部" style="width:130px">
                <el-option label="未结清" value="未结清" />
                <el-option label="已结清" value="已结清" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="historyKeyword" placeholder="搜索合同编号/承租方" clearable style="width:200px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="exportHistory">导出欠费清单</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredHistory" border stripe>
          <el-table-column prop="contractId" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column prop="feeType" label="费项" width="90" />
          <el-table-column prop="billPeriod" label="欠费期间" width="170" />
          <el-table-column prop="arrearsAmount" label="欠费金额(万元)" width="130" align="right">
            <template #default="{ row }">
              <span style="color:#f5222d;font-weight:600">{{ row.arrearsAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="overdueDays" label="欠费天数" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.overdueDays > 90 ? '#F56C6C' : row.overdueDays > 30 ? '#E6A23C' : '#909399' }">{{ row.overdueDays }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '未结清' ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" align="center">
            <template #default="{ row }">
              <el-button v-if="row.status === '未结清'" type="warning" link size="small" @click="generateUrgeLetter(row)">生成催缴函</el-button>
              <el-button v-if="row.status === '未结清'" type="success" link size="small" @click="settleHistory(row)">登记结清</el-button>
              <el-button type="primary" link size="small" @click="viewHistory(row)">明细</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 催缴弹窗 -->
    <el-dialog v-model="showUrge" title="一键催缴" width="480px">
      <el-form label-width="80px">
        <el-form-item label="催缴方式">
          <el-checkbox-group v-model="urgeMethods">
            <el-checkbox value="sms">短信</el-checkbox>
            <el-checkbox value="internal">站内消息</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="催缴内容">
          <el-input type="textarea" :rows="3" :value="urgeTemplate" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUrge = false">取消</el-button>
        <el-button type="primary" @click="confirmUrge">确认发送</el-button>
      </template>
    </el-dialog>

    <!-- 开具发票 -->
    <el-dialog v-model="showInvoiceDialog" title="开具电子发票" width="550px">
      <el-form :model="invoiceForm" label-width="100px">
        <el-form-item label="发票类型" required>
          <el-select v-model="invoiceForm.invoiceType" style="width:100%">
            <el-option label="增值税普通发票" value="增值税普通发票" />
            <el-option label="增值税专用发票" value="增值税专用发票" />
            <el-option label="电子发票" value="电子发票" />
          </el-select>
        </el-form-item>
        <el-form-item label="承租方" required>
          <el-select v-model="invoiceForm.tenant" style="width:100%" filterable>
            <el-option v-for="r in feeRecords" :key="r.contractId" :label="r.tenant" :value="r.tenant" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(万元)" required>
          <el-input-number v-model="invoiceForm.amount" :min="0" :step="1" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="税率(%)">
          <el-input-number v-model="invoiceForm.taxRate" :min="0" :max="13" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="invoiceForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInvoiceDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateInvoice">确认开具</el-button>
      </template>
    </el-dialog>

    <!-- 新增出账规则 -->
    <el-dialog v-model="showRuleDialog" title="新增自动出账规则" width="500px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="ruleForm.name" placeholder="如：商铺半年租金自动出账" />
        </el-form-item>
        <el-form-item label="出账周期" required>
          <el-select v-model="ruleForm.billingCycle" style="width:100%">
            <el-option label="按月" value="按月" />
            <el-option label="按季" value="按季" />
            <el-option label="半年" value="半年" />
            <el-option label="按年" value="按年" />
          </el-select>
        </el-form-item>
        <el-form-item label="提前天数">
          <el-input-number v-model="ruleForm.advanceDays" :min="0" :max="30" style="width:100%" />
        </el-form-item>
        <el-form-item label="适用范围">
          <el-select v-model="ruleForm.scope" style="width:100%">
            <el-option label="全部合同" value="全部合同" />
            <el-option label="商铺类合同" value="商铺类合同" />
            <el-option label="厂房类合同" value="厂房类合同" />
            <el-option label="办公楼类合同" value="办公楼类合同" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRule">保存规则</el-button>
      </template>
    </el-dialog>

    <!-- 保证金退还 -->
    <el-dialog v-model="showRefundDialog" title="保证金退还" width="500px">
      <el-form label-width="100px">
        <el-form-item label="合同编号">{{ refundRow?.contractId }}</el-form-item>
        <el-form-item label="承租方">{{ refundRow?.tenant }}</el-form-item>
        <el-form-item label="保证金金额">{{ refundRow?.depositAmount }} 万元</el-form-item>
        <el-form-item label="扣除金额">
          <el-input-number v-model="refundDeduct" :min="0" :max="refundRow?.depositAmount || 0" :step="0.5" style="width:100%" />
        </el-form-item>
        <el-form-item label="实退金额">
          <span style="font-size:16px;color:#52c41a;font-weight:600">{{ ((refundRow?.depositAmount || 0) - refundDeduct).toFixed(1) }} 万元</span>
        </el-form-item>
        <el-form-item label="退还原因">
          <el-input v-model="refundReason" type="textarea" :rows="2" placeholder="请填写退还原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRefundDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRefund">确认退还</el-button>
      </template>
    </el-dialog>

    <!-- 保证金明细 -->
    <el-drawer v-model="showDepositDrawer" title="保证金明细" size="500px">
      <template v-if="currentDeposit">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="合同编号">{{ currentDeposit.contractId }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentDeposit.tenant }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentDeposit.assetName }}</el-descriptions-item>
          <el-descriptions-item label="保证金金额">{{ currentDeposit.depositAmount }} 万元</el-descriptions-item>
          <el-descriptions-item label="收取日期">{{ currentDeposit.receiveDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentDeposit.depositStatus === '在管' ? 'success' : 'warning'" size="small">{{ currentDeposit.depositStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider>变动记录</el-divider>
        <el-timeline>
          <el-timeline-item timestamp="2026-01-15" type="success">收取保证金 {{ currentDeposit.depositAmount }} 万元</el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <!-- 发票查看 -->
    <el-drawer v-model="showInvoiceDrawer" title="发票详情" size="500px">
      <template v-if="currentInvoice">
        <div class="invoice-preview">
          <div class="invoice-header">
            <h3>{{ currentInvoice.invoiceType }}</h3>
            <p>发票号码：{{ currentInvoice.invoiceNo }}</p>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="承租方">{{ currentInvoice.tenant }}</el-descriptions-item>
            <el-descriptions-item label="金额">{{ currentInvoice.amount }} 万元</el-descriptions-item>
            <el-descriptions-item label="税额">{{ currentInvoice.tax }} 万元</el-descriptions-item>
            <el-descriptions-item label="价税合计">{{ (currentInvoice.amount + currentInvoice.tax).toFixed(1) }} 万元</el-descriptions-item>
            <el-descriptions-item label="开票日期">{{ currentInvoice.issueDate }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentInvoice.invoiceStatus === '已开具' ? 'success' : 'danger'" size="small">{{ currentInvoice.invoiceStatus }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </el-drawer>

    <!-- 账单查看 -->
    <el-drawer v-model="showBillDrawer" title="账单详情" size="500px">
      <template v-if="currentBill">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="账单编号">{{ currentBill.billNo }}</el-descriptions-item>
          <el-descriptions-item label="合同编号">{{ currentBill.contractId }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentBill.tenant }}</el-descriptions-item>
          <el-descriptions-item label="账单期间">{{ currentBill.billPeriod }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ currentBill.amount }} 万元</el-descriptions-item>
          <el-descriptions-item label="到期日">{{ currentBill.dueDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentBill.billStatus === '已缴' ? 'success' : currentBill.billStatus === '逾期' ? 'danger' : 'warning'" size="small">{{ currentBill.billStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 缴费订单详情 -->
    <el-drawer v-model="showOrderDrawer" title="订单详情" size="500px">
      <template v-if="currentOrder">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="合同编号">{{ currentOrder.contractId }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentOrder.tenant }}</el-descriptions-item>
          <el-descriptions-item label="费项">{{ currentOrder.feeType }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ currentOrder.amount }} 万元</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentOrder.payMethod }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ currentOrder.payTime || '—' }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ currentOrder.tradeNo || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentOrder.status === '已支付' ? 'success' : currentOrder.status === '待支付' ? 'warning' : 'info'" size="small">{{ currentOrder.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 扫码收款 -->
    <el-dialog v-model="showQrDialog" title="扫码收款" width="360px" align-center>
      <div class="qr-wrap" v-if="qrOrder">
        <div class="qr-amount">{{ qrOrder.amount }} 万元</div>
        <div class="qr-tenant">{{ qrOrder.tenant }} · {{ qrOrder.feeType }}</div>
        <div class="qr-code">
          <div v-for="(cell, i) in qrCells" :key="i" class="qr-cell" :class="{ dark: cell }"></div>
        </div>
        <div class="qr-tip">请使用{{ qrOrder.payMethod || '微信' }}扫描二维码完成支付</div>
        <div class="qr-order-no">订单号：{{ qrOrder.orderNo }}</div>
      </div>
      <template #footer>
        <el-button @click="showQrDialog = false">关闭</el-button>
        <el-button type="success" @click="simulatePaid">模拟支付成功</el-button>
      </template>
    </el-dialog>

    <!-- 催缴函预览 -->
    <el-dialog v-model="showLetterDialog" title="催缴函预览" width="640px">
      <div class="letter-doc" v-if="currentLetterRow">
        <div class="letter-org">长乐区国有资产投资经营有限公司</div>
        <div class="letter-line"></div>
        <h2 class="letter-title">租金催缴函</h2>
        <div class="letter-no">编号：CJH-2026-{{ String(letterSeq).padStart(3, '0') }}</div>
        <p class="letter-body"><strong>{{ currentLetterRow.tenant }}</strong>：</p>
        <p class="letter-body">贵方与我司签订的《{{ currentLetterRow.assetName }}租赁合同》（合同编号：{{ currentLetterRow.contractId }}），约定{{ currentLetterRow.feeType }}缴纳期限为 {{ currentLetterRow.billPeriod }}。截至本函发出之日，贵方尚有 <strong style="color:#f5222d">{{ currentLetterRow.arrearsAmount }} 万元</strong> {{ currentLetterRow.feeType }}未缴纳，已逾期 <strong style="color:#f5222d">{{ currentLetterRow.overdueDays }}</strong> 天。</p>
        <p class="letter-body">请贵方于收到本函后 <strong>7 个工作日</strong> 内将上述欠款缴至我司指定账户，逾期我司将依据合同约定追究违约责任，并保留通过法律途径解决的权利。</p>
        <p class="letter-body">特此函告。</p>
        <div class="letter-footer">
          <div class="letter-seal">长乐区国有资产<br/>投资经营有限公司<br/>（公章）</div>
          <div class="letter-date">{{ today }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showLetterDialog = false">取消</el-button>
        <el-button type="primary" @click="sendLetter">确认发送催缴函</el-button>
      </template>
    </el-dialog>

    <!-- 历史欠费明细 -->
    <el-drawer v-model="showHistoryDrawer" title="欠费明细" size="500px">
      <template v-if="currentHistory">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="合同编号">{{ currentHistory.contractId }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentHistory.assetName }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentHistory.tenant }}</el-descriptions-item>
          <el-descriptions-item label="费项">{{ currentHistory.feeType }}</el-descriptions-item>
          <el-descriptions-item label="欠费期间">{{ currentHistory.billPeriod }}</el-descriptions-item>
          <el-descriptions-item label="欠费金额"><span style="color:#f5222d;font-weight:600">{{ currentHistory.arrearsAmount }} 万元</span></el-descriptions-item>
          <el-descriptions-item label="欠费天数">{{ currentHistory.overdueDays }} 天</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentHistory.status === '未结清' ? 'danger' : 'success'" size="small">{{ currentHistory.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider>催缴记录</el-divider>
        <el-timeline>
          <el-timeline-item v-for="(log, i) in currentHistory.urgeLogs" :key="i" :timestamp="log.time" :type="log.type">{{ log.text }}</el-timeline-item>
          <el-timeline-item v-if="!currentHistory.urgeLogs?.length" timestamp="—" type="info">暂无催缴记录</el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-dialog v-model="showRentCollect" title="租金收取" width="960px" top="4vh">
      <template v-if="hallCurrent">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ hallCurrent.tenantType }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ hallCurrent.tenantName }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ hallCurrent.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ hallCurrent.phone }}</div></div>
          <div class="cell"><div class="label">身份证号</div><div class="value">{{ maskIdCard(hallCurrent.idCard) }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ hallCurrent.signTime }}</div></div>
          <div class="cell"><div class="label">使用方式</div><div class="value">{{ hallCurrent.usage }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ hallCurrent.contractType }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value hl">￥{{ hallCurrent.monthlyRent }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ hallCurrent.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ hallCurrent.leaseStart }} 至 {{ hallCurrent.leaseEnd }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ hallCurrent.dueDate }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value">￥{{ hallCurrent.deposit }}</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag v-for="s in hallCurrent.contractStatus" :key="s" size="small" style="margin-right: 4px">{{ s }}</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">欠费</div>
            <div class="value">
              <el-tag v-if="hallCurrent.arrearsMonths > 0" type="danger" size="small">欠费{{ hallCurrent.arrearsMonths }}个月</el-tag>
              <el-tag v-else type="success" size="small">无欠费</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">合同预览</div>
            <div class="value">
              <el-button type="primary" link size="small" @click="previewHallContract(hallCurrent)">合同预览</el-button>
            </div>
          </div>
          <div class="cell"><div class="label">协定</div><div class="value">{{ hallCurrent.agreement }}</div></div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="hallCurrent.assets" border size="small" style="margin-bottom: 12px">
          <el-table-column prop="region" label="省市区" min-width="150" />
          <el-table-column prop="project" label="项目" min-width="130" />
          <el-table-column prop="zone" label="分区" width="90" />
          <el-table-column prop="assetNo" label="资产编号" width="120" />
          <el-table-column prop="address" label="资产座落" min-width="180" />
          <el-table-column prop="company" label="所属公司" min-width="180" />
          <el-table-column prop="leaseType" label="租赁类型" width="100" align="center" />
        </el-table>
        <div class="section-title">缴费信息</div>
        <el-form :inline="true" class="pay-form">
          <el-form-item label="缴纳月数">
            <el-input-number v-model="rentPayForm.months" :min="1" :max="36" style="width: 130px" />
          </el-form-item>
          <el-form-item label="支付类型">
            <el-select v-model="rentPayForm.payType" style="width: 140px">
              <el-option label="微信支付" value="微信支付" />
              <el-option label="支付宝" value="支付宝" />
              <el-option label="银行转账" value="银行转账" />
              <el-option label="现金" value="现金" />
              <el-option label="POS刷卡" value="POS刷卡" />
            </el-select>
          </el-form-item>
          <el-form-item label="缴费方式">
            <el-select v-model="rentPayForm.payMethod" style="width: 140px">
              <el-option label="线上缴费" value="线上缴费" />
              <el-option label="线下窗口" value="线下窗口" />
              <el-option label="上门收缴" value="上门收缴" />
            </el-select>
          </el-form-item>
          <el-form-item label="缴费金额">
            <span class="pay-amount">￥{{ rentPayAmount }}</span>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showRentCollect = false">取消</el-button>
        <el-button type="primary" @click="submitRentCollect">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showOtherCharge" title="其他收费" width="480px">
      <el-form :model="otherForm" label-width="90px">
        <el-form-item label="承租方">
          <span>{{ hallCurrent?.tenantName }}</span>
        </el-form-item>
        <el-form-item label="收费项目">
          <el-select v-model="otherForm.item" style="width: 100%">
            <el-option label="物业费" value="物业费" />
            <el-option label="水电费" value="水电费" />
            <el-option label="停车费" value="停车费" />
            <el-option label="垃圾清运费" value="垃圾清运费" />
          </el-select>
        </el-form-item>
        <el-form-item label="收费金额">
          <el-input-number v-model="otherForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="otherForm.remark" type="textarea" :rows="2" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOtherCharge = false">取消</el-button>
        <el-button type="primary" @click="submitOtherCharge">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useContractStore } from '../../store/contract'
import { useAssetStore } from '../../store/asset'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Bell, Refresh, Filter, MoreFilled } from '@element-plus/icons-vue'

const contractStore = useContractStore()
const assetStore = useAssetStore()
const { feeRecords } = storeToRefs(contractStore)

const activeTab = ref('hall')
const filterStatus = ref('')

const filteredRecords = computed(() => {
  if (!filterStatus.value) return feeRecords.value
  return feeRecords.value.filter(r => r.status === filterStatus.value)
})

const ledgerPage = ref(1)
const ledgerSize = ref(10)
const pagedLedger = computed(() => {
  const start = (ledgerPage.value - 1) * ledgerSize.value
  return filteredRecords.value.slice(start, start + ledgerSize.value)
})

const hallFilterOn = ref(false)
const hallKeyword = ref('')
const hallArrears = ref('')
const hallRentType = ref('')
const hallPage = ref(1)
const hallSize = ref(10)

// 收费大厅：由合同 store + 收费台账派生，保证与其他模块同一套合同数据
const contractTypeByUsage = {
  '商铺': '商铺租赁合同', '写字楼': '办公楼租赁合同', '厂房': '厂房租赁合同',
  '仓储': '仓库租赁合同', '保障房': '住宅租赁合同', '公寓': '住宅租赁合同',
  '住宅': '住宅租赁合同', '农贸市场': '摊位租赁合同', '综合用房': '商铺租赁合同', '园区': '办公楼租赁合同'
}

const hallRecords = computed(() => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const quarterEnd = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0).toISOString().slice(0, 10)
  return contractStore.visibleContracts
    .filter(c => c.status !== '已终止' && c.status !== '退租')
    .map(c => {
      const fee = feeRecords.value.find(f => f.contractId === c.id)
      const asset = assetStore.getAssetById(c.assetId)
      const usage = asset?.type || ''
      const monthlyRent = Math.round((c.annualRent || 0) * 10000 / 12)
      const arrearsWan = fee?.arrears ?? c.arrears ?? 0
      const arrearsMonths = monthlyRent > 0 ? Math.round(arrearsWan * 10000 / monthlyRent) : 0
      const summary = asset ? contractStore.getLeaseSummary(asset) : null
      return {
        id: c.id,
        contractNo: c.id,
        tenantName: c.tenant,
        tenantType: /公司|集团|中心/.test(c.tenant || '') ? '企业' : '个人',
        contact: c.tenant,
        phone: '—',
        idCard: '—',
        signTime: c.startDate,
        usage: usage || '—',
        contractType: contractTypeByUsage[usage] || '租赁合同',
        contractStatus: ['履约中', ...(c.electronic ? ['已备案'] : [])],
        agreement: `租金${c.increment || '无递增'}，保证金 ${c.deposit || 0} 万元，逾期按日加收0.5‰滞纳金`,
        rentType: c.increment && c.increment !== '无递增' ? '递增租金' : '固定租金',
        leaseStart: c.startDate,
        leaseEnd: c.endDate,
        expired: c.endDate < todayStr,
        payCycle: '按季',
        dueDate: quarterEnd,
        monthlyRent,
        reduction: 0,
        arrearsMonths,
        newRentTime: c.startDate,
        deposit: Math.round((c.deposit || 0) * 10000),
        monthPaid: arrearsMonths > 0 ? 0 : monthlyRent,
        yearPaid: Math.round((fee?.yearActual ?? 0) * 10000),
        assets: asset ? [{
          region: '福建省福州市长乐区',
          project: asset.location || '—',
          zone: '—',
          assetNo: asset.id,
          address: c.assetName || asset.name,
          company: asset.group || '—',
          leaseType: summary && summary.availableArea > 0 ? '部分出租' : '整体出租'
        }] : []
      }
    })
})

const filteredHall = computed(() => hallRecords.value.filter(r => {
  if (hallKeyword.value && !(r.contractNo.includes(hallKeyword.value) || r.tenantName.includes(hallKeyword.value))) return false
  if (hallArrears.value === '有欠缴' && r.arrearsMonths <= 0) return false
  if (hallArrears.value === '无欠缴' && r.arrearsMonths > 0) return false
  if (hallRentType.value && r.rentType !== hallRentType.value) return false
  return true
}))

const pagedHall = computed(() => {
  const start = (hallPage.value - 1) * hallSize.value
  return filteredHall.value.slice(start, start + hallSize.value)
})

const hallStats = computed(() => {
  const list = hallRecords.value
  const monthReceivable = list.reduce((s, r) => s + r.monthlyRent, 0)
  const monthActual = list.reduce((s, r) => s + r.monthPaid, 0)
  return {
    rentingCount: list.reduce((s, r) => s + r.assets.length, 0),
    monthReceivable,
    monthActual,
    yearActual: list.reduce((s, r) => s + r.yearPaid, 0),
    arrearsTotal: list.reduce((s, r) => s + r.monthlyRent * r.arrearsMonths, 0),
    monthRate: monthReceivable > 0 ? (monthActual / monthReceivable * 100).toFixed(1) : '0.0'
  }
})

const showRentCollect = ref(false)
const hallCurrent = ref(null)
const rentPayForm = ref({ months: 1, payType: '微信支付', payMethod: '线上缴费' })

const rentPayAmount = computed(() => {
  if (!hallCurrent.value) return '0.00'
  const amount = hallCurrent.value.monthlyRent * rentPayForm.value.months - hallCurrent.value.reduction
  return Math.max(0, amount).toFixed(2)
})

function maskIdCard(id) {
  if (!id || id === '—') return '—'
  return String(id).replace(/^(.{6}).+(.{4})$/, '$1********$2')
}

function openRentCollect(row) {
  hallCurrent.value = row
  rentPayForm.value = { months: row.arrearsMonths > 0 ? row.arrearsMonths + 1 : 1, payType: '微信支付', payMethod: '线上缴费' }
  showRentCollect.value = true
}

function submitRentCollect() {
  const row = hallCurrent.value
  const amountYuan = Number(rentPayAmount.value)
  // payFee 以万元计，与合同年租金/收费台账同一单位
  contractStore.payFee(row.contractNo, Math.round(amountYuan / 100) / 100)
  showRentCollect.value = false
  ElMessage.success(`已收取 ${row.tenantName} 租金 ￥${amountYuan.toLocaleString()}（${rentPayForm.value.payType} · ${rentPayForm.value.payMethod}），收费台账已同步`)
}

function previewHallContract(row) {
  ElMessageBox.alert(`合同编号：${row.contractNo}\n合同类型：${row.contractType}\n租赁时间：${row.leaseStart} 至 ${row.leaseEnd}\n协定：${row.agreement}`, '合同预览', { confirmButtonText: '关闭' })
}

const showOtherCharge = ref(false)
const otherForm = ref({ item: '物业费', amount: 0, remark: '' })

function openOtherCharge(row) {
  hallCurrent.value = row
  otherForm.value = { item: '物业费', amount: 0, remark: '' }
  showOtherCharge.value = true
}

function submitOtherCharge() {
  if (!otherForm.value.amount) {
    ElMessage.warning('请填写收费金额')
    return
  }
  showOtherCharge.value = false
  ElMessage.success(`已收取 ${hallCurrent.value.tenantName} ${otherForm.value.item} ￥${otherForm.value.amount.toFixed(2)}`)
}

function handleHallCommand(cmd, row) {
  if (cmd === 'detail') {
    ElMessageBox.alert(`合同编号：${row.contractNo}\n缴费周期：${row.payCycle}\n交费截至时间：${row.dueDate}\n当前欠缴：${row.arrearsMonths > 0 ? row.arrearsMonths + '个月未缴' : '无'}\n总减免金额：￥${row.reduction}`, '缴费明细', { confirmButtonText: '关闭' })
  } else if (cmd === 'urge') {
    ElMessageBox.confirm(`确认向 ${row.tenantName} 发送租金催缴通知？`, '催缴确认', { type: 'warning' }).then(() => {
      ElMessage.success('催缴通知已发送')
    }).catch(() => {})
  } else if (cmd === 'contract') {
    previewHallContract(row)
  }
}

function downloadHallTemplate() {
  const headers = ['资产名称', '承租方', '月租金(元)', '起租日', '到期日', '收款方式']
  const sample = ['示例商铺A-01', '张三', '5000', '2026-01-01', '2028-12-31', '银行转账']
  const csv = '\uFEFF' + [headers.join(','), sample.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '收费导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('收费导入模板已下载')
}

function batchUrgeHall() {
  const list = hallRecords.value.filter(r => r.arrearsMonths > 0)
  if (!list.length) {
    ElMessage.info('当前没有欠缴记录需要催缴')
    return
  }
  ElMessageBox.confirm(`确认对 ${list.length} 条欠缴记录批量发送催缴通知？`, '批量催缴', { type: 'warning' }).then(() => {
    ElMessage.success(`已向 ${list.length} 家承租方发送催缴通知`)
  }).catch(() => {})
}

function importHallData() {
  const mockImports = [
    { tenantName: '福州长乐旺达商贸有限公司', assetName: '吴航街道商业街A-15商铺', monthlyRent: 6800, leaseStart: '2026-06-01', leaseEnd: '2028-05-31', deposit: 13600, arrearsMonths: 0, increment: '无递增' },
    { tenantName: '福建长乐恒信电子科技有限公司', assetName: '航城标准厂房3#楼2层', monthlyRent: 18500, leaseStart: '2026-05-15', leaseEnd: '2029-05-14', deposit: 37000, arrearsMonths: 0, increment: '每年递增2%' },
    { tenantName: '长乐区首占镇小李水果店', assetName: '首占农贸市场2号摊位', monthlyRent: 2200, leaseStart: '2026-07-01', leaseEnd: '2027-06-30', deposit: 4400, arrearsMonths: 1, increment: '无递增' }
  ]
  for (const m of mockImports) {
    const annualRent = Math.round(m.monthlyRent * 12) / 10000
    const arrears = Math.round(m.monthlyRent * m.arrearsMonths) / 10000
    const c = contractStore.signContract({
      assetId: null,
      assetName: m.assetName,
      tenant: m.tenantName,
      startDate: m.leaseStart,
      endDate: m.leaseEnd,
      leaseArea: 0,
      annualRent,
      deposit: Math.round(m.deposit / 10000 * 100) / 100,
      increment: m.increment,
      status: arrears > 0 ? '欠缴' : '正常',
      electronic: false,
      arrears,
      overdueDays: 0
    })
    if (arrears > 0) {
      contractStore.updateFeeRecord(c.id, { cumReceivable: annualRent, arrears, status: '欠缴' })
    }
  }
  ElMessage.success(`收费数据导入成功，共导入 ${mockImports.length} 条合同及收费记录`)
}

function refreshHall() {
  hallPage.value = 1
  ElMessage.success('收费大厅数据已刷新')
}

const feeSummary = computed(() => {
  const data = feeRecords.value
  return {
    cumReceivable: data.reduce((s, r) => s + r.cumReceivable, 0),
    cumActual: data.reduce((s, r) => s + r.cumActual, 0),
    arrears: data.reduce((s, r) => s + r.arrears, 0)
  }
})

const collectionRate = computed(() => {
  const yearR = feeRecords.value.reduce((s, r) => s + r.yearReceivable, 0)
  const yearA = feeRecords.value.reduce((s, r) => s + r.yearActual, 0)
  return yearR > 0 ? (yearA / yearR * 100).toFixed(1) : '0.0'
})

function getSummaries({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    const key = col.property
    if (['cumReceivable', 'cumActual', 'yearReceivable', 'yearActual', 'arrears'].includes(key)) {
      return data.reduce((s, r) => s + (r[key] || 0), 0)
    }
    return ''
  })
}

// 催缴
const showUrge = ref(false)
const urgeMethods = ref(['sms', 'internal'])
const urgeTemplate = ref('')
const currentUrgeRow = ref(null)

function handleUrge(row) {
  currentUrgeRow.value = row
  urgeTemplate.value = `尊敬的${row.tenant}，您有 ${row.arrears} 万元租金逾期，请尽快缴纳。如有疑问请联系资产管理部。`
  showUrge.value = true
}

function confirmUrge() {
  if (currentUrgeRow.value) {
    currentUrgeRow.value.lastUrgeTime = new Date().toLocaleString('zh-CN')
    currentUrgeRow.value.urgeCount = (currentUrgeRow.value.urgeCount || 0) + 1
  }
  ElMessage.success('催缴通知已发送，催缴记录已留痕')
  showUrge.value = false
}

// 出账
function generateBill(row) {
  ElMessageBox.confirm(`确认为 ${row.tenant} 生成本期账单？金额：${row.yearReceivable / 2} 万元`, '生成账单', { type: 'info' }).then(() => {
    billRecords.value.unshift({
      billNo: `ZD-${new Date().getFullYear()}-${String(billRecords.value.length + 1).padStart(3, '0')}`,
      contractId: row.contractId,
      tenant: row.tenant,
      billPeriod: `2026-07 至 2026-12`,
      amount: row.yearReceivable / 2,
      dueDate: '2026-07-15',
      billStatus: '待缴'
    })
    ElMessage.success('账单已生成')
  }).catch(() => {})
}

function handleBatchBilling() {
  const arrearsRecords = feeRecords.value.filter(r => r.status === '欠缴')
  ElMessageBox.confirm(`确认为 ${arrearsRecords.length} 条欠缴记录批量生成账单？`, '批量出账', { type: 'warning' }).then(() => {
    arrearsRecords.forEach((r, i) => {
      billRecords.value.unshift({
        billNo: `ZD-${new Date().getFullYear()}-${String(billRecords.value.length + i + 1).padStart(3, '0')}`,
        contractId: r.contractId,
        tenant: r.tenant,
        billPeriod: `2026-07 至 2026-12`,
        amount: r.arrears,
        dueDate: '2026-10-01',
        billStatus: '逾期'
      })
    })
    ElMessage.success(`已批量生成 ${arrearsRecords.length} 条账单`)
  }).catch(() => {})
}

// 开票
function openInvoice(row) {
  invoiceForm.value.tenant = row.tenant
  invoiceForm.value.amount = row.yearActual || row.yearReceivable / 2
  showInvoiceDialog.value = true
}

const showInvoiceDialog = ref(false)
const invoiceForm = ref({
  invoiceType: '增值税普通发票',
  tenant: '',
  amount: 0,
  taxRate: 5,
  remark: ''
})

const invoiceRecords = ref([
  { invoiceNo: 'FP-2026-001', invoiceType: '增值税普通发票', tenant: '福州长乐融辉贸易有限公司', amount: 21, tax: 1.05, issueDate: '2026-06-30', invoiceStatus: '已开具' },
  { invoiceNo: 'FP-2026-002', invoiceType: '增值税专用发票', tenant: '福建省长乐市鸿运纺织有限公司', amount: 35, tax: 1.75, issueDate: '2026-05-15', invoiceStatus: '已开具' },
  { invoiceNo: 'FP-2026-003', invoiceType: '电子发票', tenant: '长乐区鑫源投资有限公司', amount: 12, tax: 0.6, issueDate: '2026-07-10', invoiceStatus: '已开具' },
  { invoiceNo: 'FP-2025-012', invoiceType: '增值税普通发票', tenant: '福州航城物流有限公司', amount: 8, tax: 0.4, issueDate: '2025-12-20', invoiceStatus: '已红冲' },
])

function handleCreateInvoice() {
  if (!invoiceForm.value.tenant || !invoiceForm.value.amount) {
    ElMessage.warning('请填写完整发票信息')
    return
  }
  const tax = (invoiceForm.value.amount * invoiceForm.value.taxRate / 100).toFixed(2)
  invoiceRecords.value.unshift({
    invoiceNo: `FP-${new Date().getFullYear()}-${String(invoiceRecords.value.length + 1).padStart(3, '0')}`,
    invoiceType: invoiceForm.value.invoiceType,
    tenant: invoiceForm.value.tenant,
    amount: invoiceForm.value.amount,
    tax: parseFloat(tax),
    issueDate: new Date().toISOString().slice(0, 10),
    invoiceStatus: '已开具'
  })
  showInvoiceDialog.value = false
  invoiceForm.value = { invoiceType: '增值税普通发票', tenant: '', amount: 0, taxRate: 5, remark: '' }
  ElMessage.success('发票已开具')
}

const showInvoiceDrawer = ref(false)
const currentInvoice = ref(null)

function viewInvoice(row) {
  currentInvoice.value = row
  showInvoiceDrawer.value = true
}

function handleRedInvoice(row) {
  ElMessageBox.confirm(`确认对发票"${row.invoiceNo}"进行红冲？红冲后不可恢复。`, '红冲确认', { type: 'warning' }).then(() => {
    row.invoiceStatus = '已红冲'
    ElMessage.success('发票已红冲')
  }).catch(() => {})
}

// 保证金
const depositRecords = ref([
  { contractId: 'HT-2026-001', tenant: '福州长乐融辉贸易有限公司', assetName: '城关商铺A-01', depositAmount: 5, receiveDate: '2026-01-15', depositStatus: '在管' },
  { contractId: 'HT-2026-002', tenant: '福建省长乐市鸿运纺织有限公司', assetName: '航城厂房1#', depositAmount: 10, receiveDate: '2026-02-01', depositStatus: '在管' },
  { contractId: 'HT-2025-003', tenant: '长乐区鑫源投资有限公司', assetName: '漳港办公楼2层', depositAmount: 3, receiveDate: '2025-06-10', depositStatus: '待退还' },
  { contractId: 'HT-2024-005', tenant: '长乐吴航街道陈氏食品店', assetName: '首占商铺C-08', depositAmount: 2, receiveDate: '2024-08-15', depositStatus: '已退还' },
])

const depositStats = computed(() => {
  const total = depositRecords.value.reduce((s, r) => s + r.depositAmount, 0)
  const held = depositRecords.value.filter(r => r.depositStatus === '在管').reduce((s, r) => s + r.depositAmount, 0)
  const pendingRefund = depositRecords.value.filter(r => r.depositStatus === '待退还').reduce((s, r) => s + r.depositAmount, 0)
  const refunded = depositRecords.value.filter(r => r.depositStatus === '已退还').reduce((s, r) => s + r.depositAmount, 0)
  return { total, held, pendingRefund, refunded }
})

const showRefundDialog = ref(false)
const refundRow = ref(null)
const refundDeduct = ref(0)
const refundReason = ref('')

function handleRefund(row) {
  refundRow.value = row
  refundDeduct.value = 0
  refundReason.value = ''
  row.depositStatus = '待退还'
  showRefundDialog.value = true
}

function confirmRefund(row) {
  refundRow.value = row
  refundDeduct.value = 0
  refundReason.value = ''
  showRefundDialog.value = true
}

function submitRefund() {
  if (!refundReason.value) {
    ElMessage.warning('请填写退还原因')
    return
  }
  if (refundRow.value) {
    refundRow.value.depositStatus = '已退还'
  }
  showRefundDialog.value = false
  ElMessage.success('保证金退还申请已提交')
}

const showDepositDrawer = ref(false)
const currentDeposit = ref(null)

function viewDepositDetail(row) {
  currentDeposit.value = row
  showDepositDrawer.value = true
}

// 自动账单
const billingRules = ref([
  { id: 1, name: '商铺半年租金自动出账', billingCycle: '半年', advanceDays: 15, nextRunDate: '2026-12-16', enabled: true, scope: '商铺类合同' },
  { id: 2, name: '厂房季度租金出账', billingCycle: '按季', advanceDays: 10, nextRunDate: '2026-09-20', enabled: true, scope: '厂房类合同' },
  { id: 3, name: '全部合同月度物业费', billingCycle: '按月', advanceDays: 5, nextRunDate: '2026-09-25', enabled: false, scope: '全部合同' },
])

const showRuleDialog = ref(false)
const ruleForm = ref({
  name: '',
  billingCycle: '半年',
  advanceDays: 15,
  scope: '全部合同'
})

function handleCreateRule() {
  if (!ruleForm.value.name) {
    ElMessage.warning('请填写规则名称')
    return
  }
  billingRules.value.push({
    id: billingRules.value.length + 1,
    name: ruleForm.value.name,
    billingCycle: ruleForm.value.billingCycle,
    advanceDays: ruleForm.value.advanceDays,
    nextRunDate: '2026-10-01',
    enabled: true,
    scope: ruleForm.value.scope
  })
  showRuleDialog.value = false
  ruleForm.value = { name: '', billingCycle: '半年', advanceDays: 15, scope: '全部合同' }
  ElMessage.success('规则创建成功')
}

function toggleRule(row) {
  ElMessage.success(`规则"${row.name}"已${row.enabled ? '启用' : '停用'}`)
}

function runRuleNow(row) {
  ElMessageBox.confirm(`确认立即执行规则"${row.name}"？`, '执行确认', { type: 'info' }).then(() => {
    ElMessage.success(`规则"${row.name}"执行完成，已生成对应账单`)
  }).catch(() => {})
}

function deleteRule(row) {
  ElMessageBox.confirm(`确认删除规则"${row.name}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = billingRules.value.findIndex(r => r.id === row.id)
    if (idx > -1) billingRules.value.splice(idx, 1)
    ElMessage.success('规则已删除')
  }).catch(() => {})
}

const billRecords = ref([
  { billNo: 'ZD-2026-001', contractId: 'HT-2026-001', tenant: '福州长乐融辉贸易有限公司', billPeriod: '2026-01 至 2026-06', amount: 10.5, dueDate: '2026-01-15', billStatus: '已缴' },
  { billNo: 'ZD-2026-002', contractId: 'HT-2026-002', tenant: '福建省长乐市鸿运纺织有限公司', billPeriod: '2026-01 至 2026-06', amount: 17.5, dueDate: '2026-01-15', billStatus: '已缴' },
  { billNo: 'ZD-2026-003', contractId: 'HT-2026-003', tenant: '长乐区鑫源投资有限公司', billPeriod: '2026-07 至 2026-12', amount: 6, dueDate: '2026-07-15', billStatus: '待缴' },
  { billNo: 'ZD-2026-004', contractId: 'HT-2026-004', tenant: '福州航城物流有限公司', billPeriod: '2026-07 至 2026-12', amount: 4, dueDate: '2026-07-15', billStatus: '逾期' },
])

const showBillDrawer = ref(false)
const currentBill = ref(null)

function viewBill(row) {
  currentBill.value = row
  showBillDrawer.value = true
}

function confirmPayment(row) {
  ElMessageBox.confirm(`确认 ${row.tenant} 的账单 ${row.billNo} 已收款 ${row.amount} 万元？`, '确认收款', { type: 'success' }).then(() => {
    row.billStatus = '已缴'
    if (contractStore.getContractById(row.contractId)) {
      contractStore.payFee(row.contractId, row.amount)
    }
    ElMessage.success('收款确认成功')
  }).catch(() => {})
}

// 缴费订单
const orderPayMethod = ref('')
const orderStatus = ref('')
const payOrders = ref([
  { orderNo: 'DD-20260916-0001', contractId: 'HT-2026-001', tenant: '福州长乐融辉贸易有限公司', feeType: '租金', amount: 10.5, payMethod: '微信扫码', payTime: '2026-09-10 09:32:15', tradeNo: '4200001234202609101234', status: '已支付' },
  { orderNo: 'DD-20260916-0002', contractId: 'HT-2026-002', tenant: '福建省长乐市鸿运纺织有限公司', feeType: '租金', amount: 17.5, payMethod: '银行转账', payTime: '2026-09-08 14:20:03', tradeNo: 'TRF20260908000123', status: '已支付' },
  { orderNo: 'DD-20260916-0003', contractId: 'HT-2026-003', tenant: '长乐区鑫源投资有限公司', feeType: '租金', amount: 6, payMethod: '微信扫码', payTime: '', tradeNo: '', status: '待支付' },
  { orderNo: 'DD-20260916-0004', contractId: 'HT-2026-004', tenant: '福州航城物流有限公司', feeType: '管理费', amount: 4, payMethod: '支付宝', payTime: '', tradeNo: '', status: '待支付' },
  { orderNo: 'DD-20260916-0005', contractId: 'HT-2025-003', tenant: '长乐吴航街道陈氏食品店', feeType: '租金', amount: 1.2, payMethod: '现金', payTime: '2026-08-20 10:05:41', tradeNo: '—', status: '已支付' },
  { orderNo: 'DD-20260916-0006', contractId: 'HT-2024-005', tenant: '长乐区某餐饮管理有限公司', feeType: '租金', amount: 3.8, payMethod: '支付宝', payTime: '2026-08-01 16:44:12', tradeNo: '', status: '已退款' },
])

const filteredOrders = computed(() => payOrders.value.filter(o =>
  (!orderPayMethod.value || o.payMethod === orderPayMethod.value) &&
  (!orderStatus.value || o.status === orderStatus.value)
))

const orderStats = computed(() => ({
  total: payOrders.value.length,
  paidAmount: payOrders.value.filter(o => o.status === '已支付').reduce((s, o) => s + o.amount, 0).toFixed(1),
  pending: payOrders.value.filter(o => o.status === '待支付').length,
  failed: payOrders.value.filter(o => o.status === '已退款').length
}))

const showOrderDrawer = ref(false)
const currentOrder = ref(null)

function viewOrder(row) {
  currentOrder.value = row
  showOrderDrawer.value = true
}

const showQrDialog = ref(false)
const qrOrder = ref(null)

// 根据订单号生成确定性的伪二维码点阵
const qrCells = computed(() => {
  if (!qrOrder.value) return []
  let seed = 0
  for (const ch of qrOrder.value.orderNo) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const cells = []
  for (let i = 0; i < 441; i++) cells.push(rand() > 0.52)
  // 三个定位角
  const anchor = (r0, c0) => {
    for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
      const edge = r === 0 || r === 6 || c === 0 || c === 6
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
      cells[(r0 + r) * 21 + (c0 + c)] = edge || core
    }
  }
  anchor(0, 0); anchor(0, 14); anchor(14, 0)
  return cells
})

function showPayQr(row) {
  qrOrder.value = row
  showQrDialog.value = true
}

function simulatePaid() {
  if (!qrOrder.value) return
  qrOrder.value.status = '已支付'
  qrOrder.value.payTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  qrOrder.value.tradeNo = '4200001234' + Date.now()
  if (contractStore.getContractById(qrOrder.value.contractId)) {
    contractStore.payFee(qrOrder.value.contractId, qrOrder.value.amount)
  }
  showQrDialog.value = false
  ElMessage.success(`订单 ${qrOrder.value.orderNo} 支付成功`)
}

function confirmOrderPaid(row) {
  ElMessageBox.confirm(`确认已收到 ${row.tenant} 的 ${row.amount} 万元（${row.payMethod}）？`, '确认收款', { type: 'success' }).then(() => {
    row.status = '已支付'
    row.payTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
    if (contractStore.getContractById(row.contractId)) {
      contractStore.payFee(row.contractId, row.amount)
    }
    ElMessage.success('收款已登记')
  }).catch(() => {})
}

// 历史欠费
const historyStatus = ref('')
const historyKeyword = ref('')
const historyRecords = ref([
  { contractId: 'HT-2024-025', assetName: '工业区厂房A-02', tenant: '福建某制造有限公司', feeType: '租金', billPeriod: '2025-01 至 2025-06', arrearsAmount: 26, overdueDays: 120, status: '未结清', urgeLogs: [{ time: '2026-06-15', text: '发送催缴函（第5次）', type: 'danger' }, { time: '2026-04-10', text: '电话催缴（第4次）', type: 'warning' }] },
  { contractId: 'HT-2023-018', assetName: '航城商铺A-03', tenant: '张某', feeType: '租金', billPeriod: '2025-07 至 2025-12', arrearsAmount: 1.5, overdueDays: 95, status: '未结清', urgeLogs: [{ time: '2026-07-20', text: '短信催缴（第3次）', type: 'warning' }] },
  { contractId: 'HT-2024-012', assetName: '城西停车场', tenant: '福州某物业管理有限公司', feeType: '管理费', billPeriod: '2026-01 至 2026-06', arrearsAmount: 0.85, overdueDays: 45, status: '未结清', urgeLogs: [{ time: '2026-08-25', text: '短信催缴（第1次）', type: 'info' }] },
  { contractId: 'HT-2025-008', assetName: '农贸市场1号摊位', tenant: '陈某', feeType: '租金', billPeriod: '2026-07 至 2026-08', arrearsAmount: 0.32, overdueDays: 20, status: '未结清', urgeLogs: [] },
  { contractId: 'HT-2023-042', assetName: '滨江商铺B-07', tenant: '林某', feeType: '租金', billPeriod: '2024-01 至 2024-06', arrearsAmount: 3.4, overdueDays: 0, status: '已结清', urgeLogs: [{ time: '2024-09-01', text: '欠费结清，共补缴 3.4 万元', type: 'success' }] },
])

const filteredHistory = computed(() => historyRecords.value.filter(r =>
  (!historyStatus.value || r.status === historyStatus.value) &&
  (!historyKeyword.value || r.contractId.includes(historyKeyword.value) || r.tenant.includes(historyKeyword.value))
))

const historyStats = computed(() => {
  const unsettled = historyRecords.value.filter(r => r.status === '未结清')
  return {
    cumArrears: unsettled.reduce((s, r) => s + r.arrearsAmount, 0).toFixed(2),
    monthArrears: unsettled.filter(r => r.overdueDays <= 30).reduce((s, r) => s + r.arrearsAmount, 0).toFixed(2),
    arrearsContracts: unsettled.length,
    arrearsAssets: new Set(unsettled.map(r => r.assetName)).size
  }
})

const showLetterDialog = ref(false)
const currentLetterRow = ref(null)
const letterSeq = ref(1)
const today = new Date().toISOString().slice(0, 10)

function generateUrgeLetter(row) {
  currentLetterRow.value = row
  showLetterDialog.value = true
}

function sendLetter() {
  const row = currentLetterRow.value
  if (row) {
    row.urgeLogs.unshift({ time: today, text: `发送催缴函 CJH-2026-${String(letterSeq.value).padStart(3, '0')}`, type: 'danger' })
    letterSeq.value++
  }
  showLetterDialog.value = false
  ElMessage.success('催缴函已生成并发送，已记录催缴留痕')
}

function settleHistory(row) {
  ElMessageBox.confirm(`确认登记 ${row.tenant} 已结清欠费 ${row.arrearsAmount} 万元？`, '登记结清', { type: 'success' }).then(() => {
    row.status = '已结清'
    row.overdueDays = 0
    row.urgeLogs.unshift({ time: today, text: `欠费结清，共补缴 ${row.arrearsAmount} 万元`, type: 'success' })
    ElMessage.success('已登记结清')
  }).catch(() => {})
}

const showHistoryDrawer = ref(false)
const currentHistory = ref(null)

function viewHistory(row) {
  currentHistory.value = row
  showHistoryDrawer.value = true
}

function exportHistory() {
  const rows = filteredHistory.value
  const header = '合同编号,资产名称,承租方,费项,欠费期间,欠费金额(万元),欠费天数,状态'
  const lines = rows.map(r => [r.contractId, r.assetName, r.tenant, r.feeType, r.billPeriod, r.arrearsAmount, r.overdueDays, r.status].join(','))
  const blob = new Blob(['\ufeff' + header + '\n' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `历史欠费清单_${today}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success(`已导出 ${rows.length} 条欠费记录`)
}
</script>

<style scoped>
.hall-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.hall-filter {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  margin-bottom: 12px;
}
.expand-wrap {
  padding: 12px 24px;
}
.pay-form {
  padding: 4px 0 0;
}
.pay-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-primary);
}
.invoice-preview {
  border: 1px solid #e8e8e8;
  padding: 20px;
  background: #fafafa;
}
.invoice-preview .invoice-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--c-primary);
}
.invoice-preview .invoice-header h3 {
  color: var(--c-primary);
  margin: 0 0 8px 0;
}
.qr-wrap {
  text-align: center;
}
.qr-amount {
  font-size: 26px;
  font-weight: 700;
  color: #f5222d;
  margin-bottom: 4px;
}
.qr-tenant {
  font-size: 13px;
  color: #666;
  margin-bottom: 14px;
}
.qr-code {
  display: grid;
  grid-template-columns: repeat(21, 1fr);
  width: 210px;
  height: 210px;
  margin: 0 auto;
  border: 6px solid #fff;
  outline: 1px solid #ddd;
  background: #fff;
}
.qr-cell {
  background: #fff;
}
.qr-cell.dark {
  background: #111;
}
.qr-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #67c23a;
}
.qr-order-no {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
.letter-doc {
  padding: 30px 40px;
  background: #fff;
  font-family: SimSun, serif;
  line-height: 1.9;
}
.letter-org {
  text-align: center;
  color: #d40000;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}
.letter-line {
  border-bottom: 2px solid #d40000;
  margin: 10px 0 20px;
}
.letter-title {
  text-align: center;
  font-size: 20px;
  margin: 10px 0 6px;
}
.letter-no {
  text-align: center;
  font-size: 13px;
  color: #666;
  margin-bottom: 18px;
}
.letter-body {
  font-size: 14px;
  color: #333;
  text-indent: 2em;
  margin: 8px 0;
}
.letter-body:first-of-type {
  text-indent: 0;
}
.letter-footer {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 20px;
  margin-top: 30px;
}
.letter-seal {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(212, 0, 0, 0.75);
  border-radius: 50%;
  color: rgba(212, 0, 0, 0.85);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.5;
  transform: rotate(-8deg);
}
.letter-date {
  font-size: 14px;
  color: #333;
}
</style>
