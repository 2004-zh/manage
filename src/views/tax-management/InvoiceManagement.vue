<template>
  <div class="page-container">
    <div class="page-header">
      <h2>发票管理</h2>
      <span class="page-subtitle">抬头审核 · 税率配置 · 自动开票 · 推送记录</span>
    </div>

    <div class="grid-4">
      <div class="kpi"><div class="kpi-v" style="color:var(--c-primary)">{{ stats.issued }}</div><div class="kpi-l">已开票(张)</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--c-warning)">{{ stats.pendingTitle }}</div><div class="kpi-l">待审核抬头</div></div>
      <div class="kpi"><div class="kpi-v" style="color:var(--c-success)">{{ stats.autoCount }}</div><div class="kpi-l">自动开票规则</div></div>
      <div class="kpi"><div class="kpi-v">￥{{ stats.totalAmount }}万</div><div class="kpi-l">累计开票金额</div></div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="fill">
      <!-- ===== 开票订单 ===== -->
      <el-tab-pane label="开票订单" name="invoiceOrders">
        <div class="stat-strip">
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.monthCount }}</div>
            <div class="stat-label">本月开票数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.monthAmount }}<span class="unit">元</span></div>
            <div class="stat-label">本月开票额</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.yearCount }}</div>
            <div class="stat-label">本年开票数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.yearAmount }}<span class="unit">元</span></div>
            <div class="stat-label">本年开票额</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.unissuedCount }}</div>
            <div class="stat-label">未开票数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ orderStats.unissuedAmount }}<span class="unit">元</span></div>
            <div class="stat-label">未开票额</div>
          </div>
        </div>

        <div class="order-toolbar">
          <el-input v-model="orderKeyword" placeholder="订单号/租赁方名称" clearable style="width: 220px" prefix-icon="Search" />
          <el-button type="primary" :icon="Download" @click="exportOrders">导出</el-button>
          <div class="icon-toolbar">
            <el-tooltip content="刷新" placement="top">
              <el-button :icon="Refresh" circle @click="refreshOrders" />
            </el-tooltip>
            <el-tooltip content="筛选" placement="top">
              <el-button :icon="Filter" circle @click="orderFilterOn = !orderFilterOn" />
            </el-tooltip>
          </div>
        </div>

        <div v-show="orderFilterOn" class="order-filter">
          <el-select v-model="orderInvoiceState" placeholder="开票状态" clearable style="width: 140px">
            <el-option label="已开票" value="已开票" />
            <el-option label="未开票" value="未开票" />
          </el-select>
          <el-select v-model="orderPayWay" placeholder="缴费方式" clearable style="width: 140px">
            <el-option label="微信支付" value="微信支付" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="银行转账" value="银行转账" />
            <el-option label="现金" value="现金" />
            <el-option label="POS刷卡" value="POS刷卡" />
          </el-select>
        </div>

        <el-table :data="pagedOrders" border stripe row-key="id">
          <el-table-column type="expand" width="46">
            <template #default="{ row }">
              <div class="expand-wrap">
                <div class="section-title">订单明细</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">联系人</div><div class="value">{{ row.contact }}</div></div>
                  <div class="cell"><div class="label">联系电话</div><div class="value">{{ row.phone }}</div></div>
                  <div class="cell"><div class="label">支付单号</div><div class="value">{{ row.payNo }}</div></div>
                  <div class="cell"><div class="label">缴费说明</div><div class="value">{{ row.payNote }}</div></div>
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
          <el-table-column prop="tenantName" label="租赁方名称" width="170" show-overflow-tooltip />
          <el-table-column prop="orderNo" label="订单号" width="150" show-overflow-tooltip />
          <el-table-column prop="payTime" label="缴费时间" width="150" />
          <el-table-column label="缴费金额" width="110" align="center">
            <template #default="{ row }">
              <el-tag size="small" type="primary">￥{{ row.amount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payWay" label="缴费方式" width="100" align="center" />
          <el-table-column label="开票状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.invoiced ? 'success' : 'warning'">{{ row.invoiced ? '已开票' : '未开票' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openOrderDetail(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="openPaperDrawer(row)" :disabled="row.invoiced">输入票号</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="orderPage"
            v-model:page-size="orderSize"
            :page-sizes="[10, 15, 20, 50, 100]"
            :total="filteredOrders.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <!-- ===== 开票记录 ===== -->
      <el-tab-pane label="开票记录" name="records">
        <div class="toolbar">
          <el-input v-model="recKeyword" placeholder="发票号/承租方" clearable style="width:220px" prefix-icon="Search" />
          <el-select v-model="recStatus" placeholder="开票状态" clearable style="width:140px">
            <el-option label="已开具" value="已开具" />
            <el-option label="已红冲" value="已红冲" />
            <el-option label="待开具" value="待开具" />
          </el-select>
          <el-button type="primary" @click="showIssue = true">开具发票</el-button>
        </div>
        <el-table :data="pagedRecords" border stripe>
          <el-table-column type="expand" width="46">
            <template #default="{ row }">
              <div class="expand-wrap">
                <div class="section-title">开票明细</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">税率</div><div class="value">{{ row.taxRate }}%</div></div>
                  <div class="cell"><div class="label">税额(万)</div><div class="value hl">{{ row.tax }}</div></div>
                  <div class="cell"><div class="label">来源</div><div class="value">{{ row.auto ? '自动' : '手动' }}</div></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="invoiceNo" label="发票号码" width="140" />
          <el-table-column prop="invoiceType" label="发票类型" width="140">
            <template #default="{ row }"><el-tag size="small">{{ row.invoiceType }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="tenant" label="承租方(抬头)" width="180" show-overflow-tooltip />
          <el-table-column prop="amount" label="金额(万)" width="100" align="right" class-name="num" />
          <el-table-column prop="issueDate" label="开票日期" width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.invoiceStatus === '已开具' ? 'success' : row.invoiceStatus === '已红冲' ? 'danger' : 'warning'" size="small">{{ row.invoiceStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewInvoice(row)">查看</el-button>
              <el-button v-if="row.invoiceStatus === '已开具'" type="danger" link size="small" @click="redInvoice(row)">红冲</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="recPage"
            v-model:page-size="recSize"
            :page-sizes="[10, 15, 20, 50, 100]"
            :total="filteredRecords.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <!-- ===== 抬头审核 ===== -->
      <el-tab-pane label="抬头审核" name="titles">
        <div class="toolbar">
          <span class="tip">承租方提交的开票抬头信息，审核通过后方可用于开票。</span>
        </div>
        <el-table :data="titles" border stripe>
          <el-table-column prop="tenant" label="承租方" width="180" show-overflow-tooltip />
          <el-table-column prop="titleType" label="抬头类型" width="100" align="center">
            <template #default="{ row }"><el-tag size="small" :type="row.titleType === '企业' ? 'primary' : 'info'">{{ row.titleType }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="taxNo" label="纳税人识别号" width="170" show-overflow-tooltip />
          <el-table-column prop="bank" label="开户行及账号" width="180" show-overflow-tooltip />
          <el-table-column prop="submitDate" label="提交日期" width="110" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '已通过' ? 'success' : row.status === '已驳回' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <template v-if="row.status === '待审核'">
                <el-button type="success" link size="small" @click="auditTitle(row, true)">通过</el-button>
                <el-button type="danger" link size="small" @click="auditTitle(row, false)">驳回</el-button>
              </template>
              <span v-else class="muted">已处理</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 税率配置 ===== -->
      <el-tab-pane label="税率配置" name="taxrate">
        <div class="toolbar">
          <span class="tip">按业务类型配置默认税率，开票时自动带出。</span>
          <el-button type="primary" size="small" @click="openRateDialog">新增税率</el-button>
        </div>
        <el-table :data="taxRates" border stripe>
          <el-table-column prop="bizType" label="业务类型" width="150" show-overflow-tooltip />
          <el-table-column prop="invoiceType" label="发票类型" width="160" show-overflow-tooltip />
          <el-table-column label="税率" width="100" align="center">
            <template #default="{ row }"><el-tag size="small" type="warning">{{ row.rate }}%</el-tag></template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" width="180" show-overflow-tooltip />
          <el-table-column label="启用" width="80" align="center">
            <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRateDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="deleteRate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 自动开票规则 ===== -->
      <el-tab-pane label="自动开票" name="auto">
        <div class="toolbar">
          <span class="tip">配置触发条件后，系统在收款完成时自动生成并推送发票。</span>
          <el-button type="primary" size="small" @click="openRuleDialog">新增规则</el-button>
        </div>
        <el-table :data="autoRules" border stripe>
          <el-table-column prop="ruleName" label="规则名称" width="170" show-overflow-tooltip />
          <el-table-column prop="trigger" label="触发条件" width="140" show-overflow-tooltip />
          <el-table-column prop="feeType" label="适用费用类型" width="130" />
          <el-table-column prop="invoiceType" label="开票类型" width="160" show-overflow-tooltip />
          <el-table-column label="自动推送" width="90" align="center">
            <template #default="{ row }"><el-tag size="small" :type="row.push ? 'success' : 'info'">{{ row.push ? '推送' : '仅生成' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="启用" width="80" align="center">
            <template #default="{ row }"><el-switch v-model="row.enabled" /></template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openRuleDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="deleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===== 推送记录 ===== -->
      <el-tab-pane label="推送记录" name="push">
        <el-table :data="pushRecords" border stripe>
          <el-table-column prop="invoiceNo" label="发票号码" width="140" />
          <el-table-column prop="tenant" label="接收方" width="170" show-overflow-tooltip />
          <el-table-column prop="channel" label="推送渠道" width="100" align="center">
            <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.channel }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="target" label="接收地址" width="180" show-overflow-tooltip />
          <el-table-column prop="pushTime" label="推送时间" width="160" />
          <el-table-column label="结果" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.result === '成功' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.result === '失败'" type="primary" link size="small" @click="repush(row)">重推</el-button>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 开具发票 -->
    <el-dialog v-model="showIssue" title="开具发票" width="560px">
      <el-form :model="issueForm" label-width="110px">
        <el-form-item label="发票类型" required>
          <el-select v-model="issueForm.invoiceType" style="width:100%" @change="onIssueTypeChange">
            <el-option label="增值税普通发票" value="增值税普通发票" />
            <el-option label="增值税专用发票" value="增值税专用发票" />
            <el-option label="电子发票" value="电子发票" />
          </el-select>
        </el-form-item>
        <el-form-item label="承租方抬头" required>
          <el-select v-model="issueForm.tenant" style="width:100%" filterable @change="onTenantChange">
            <el-option v-for="t in approvedTitles" :key="t.taxNo" :label="t.tenant" :value="t.tenant" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="issueForm.bizType" style="width:100%" @change="onBizTypeChange">
            <el-option v-for="r in enabledRates" :key="r.bizType" :label="r.bizType" :value="r.bizType" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额(万)" required>
          <el-input-number v-model="issueForm.amount" :min="0" :step="1" :precision="2" style="width:100%" @change="calcTax" />
        </el-form-item>
        <el-form-item label="税率(%)">
          <el-input-number v-model="issueForm.taxRate" :min="0" :max="13" :step="1" style="width:100%" @change="calcTax" />
        </el-form-item>
        <el-form-item label="税额(万)">
          <el-input :model-value="issueForm.tax.toFixed(2)" disabled />
        </el-form-item>
        <el-form-item label="开票后推送">
          <el-switch v-model="issueForm.push" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showIssue = false">取消</el-button>
        <el-button type="primary" @click="submitIssue">确认开票</el-button>
      </template>
    </el-dialog>

    <!-- 税率配置弹窗 -->
    <el-dialog v-model="showRate" :title="editingRate ? '编辑税率' : '新增税率'" width="500px">
      <el-form :model="rateForm" label-width="100px">
        <el-form-item label="业务类型" required><el-input v-model="rateForm.bizType" placeholder="如：租金" /></el-form-item>
        <el-form-item label="发票类型">
          <el-select v-model="rateForm.invoiceType" style="width:100%">
            <el-option label="增值税普通发票" value="增值税普通发票" />
            <el-option label="增值税专用发票" value="增值税专用发票" />
            <el-option label="电子发票" value="电子发票" />
          </el-select>
        </el-form-item>
        <el-form-item label="税率(%)" required><el-input-number v-model="rateForm.rate" :min="0" :max="13" :step="1" style="width:100%" /></el-form-item>
        <el-form-item label="说明"><el-input v-model="rateForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRate = false">取消</el-button>
        <el-button type="primary" @click="saveRate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 自动开票规则弹窗 -->
    <el-dialog v-model="showRule" :title="editingRule ? '编辑规则' : '新增规则'" width="520px">
      <el-form :model="ruleForm" label-width="110px">
        <el-form-item label="规则名称" required><el-input v-model="ruleForm.ruleName" /></el-form-item>
        <el-form-item label="触发条件">
          <el-select v-model="ruleForm.trigger" style="width:100%">
            <el-option label="收款完成时" value="收款完成时" />
            <el-option label="账单生成时" value="账单生成时" />
            <el-option label="合同生效时" value="合同生效时" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用费用类型">
          <el-select v-model="ruleForm.feeType" style="width:100%">
            <el-option label="租金" value="租金" />
            <el-option label="物业费" value="物业费" />
            <el-option label="全部" value="全部" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票类型">
          <el-select v-model="ruleForm.invoiceType" style="width:100%">
            <el-option label="增值税普通发票" value="增值税普通发票" />
            <el-option label="电子发票" value="电子发票" />
          </el-select>
        </el-form-item>
        <el-form-item label="自动推送"><el-switch v-model="ruleForm.push" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRule = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发票查看 -->
    <el-drawer v-model="showView" title="发票详情" size="480px">
      <div v-if="current" class="invoice-preview">
        <div class="inv-title">{{ current.invoiceType }}</div>
        <div class="inv-no">发票号码：{{ current.invoiceNo }}</div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="承租方抬头">{{ current.tenant }}</el-descriptions-item>
          <el-descriptions-item label="金额(万)">{{ current.amount }}</el-descriptions-item>
          <el-descriptions-item label="税率">{{ current.taxRate }}%</el-descriptions-item>
          <el-descriptions-item label="税额(万)">{{ current.tax }}</el-descriptions-item>
          <el-descriptions-item label="开票日期">{{ current.issueDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ current.invoiceStatus }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <el-drawer v-model="paperVisible" title="纸质发票" size="480px">
      <template v-if="orderCurrent">
        <el-form label-width="90px">
          <el-form-item required label="发票票号">
            <el-input v-model="paperForm.no" placeholder="请输入发票票号" maxlength="40" show-word-limit clearable />
          </el-form-item>
          <el-form-item label="发票图片">
            <el-upload
              v-model:file-list="paperForm.fileList"
              list-type="picture-card"
              :auto-upload="false"
              accept="image/*"
              :limit="3"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">推荐尺寸640*640px，支持jpg/png格式，最多3张</div>
          </el-form-item>
        </el-form>
        <div class="paper-order">
          <div>订单号：{{ orderCurrent.orderNo }}</div>
          <div>缴费金额：<span class="amount">￥{{ orderCurrent.amount }}</span></div>
          <div>租赁方：{{ orderCurrent.tenantName }}</div>
        </div>
      </template>
      <template #footer>
        <el-button @click="paperVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPaper">确定</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="orderDetailVisible" title="发票详情" size="640px">
      <template v-if="orderCurrent">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ orderCurrent.tenantType }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ orderCurrent.tenantName }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ orderCurrent.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ orderCurrent.phone }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value">{{ orderCurrent.contractNo }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ orderCurrent.signTime }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ orderCurrent.contractType }}</div></div>
          <div class="cell"><div class="label">使用方式</div><div class="value">{{ orderCurrent.usage }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value hl">￥{{ orderCurrent.monthlyRent }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ orderCurrent.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ orderCurrent.leaseStart }} 至 {{ orderCurrent.leaseEnd }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ orderCurrent.dueDate }}</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag v-for="s in orderCurrent.contractStatus" :key="s" size="small" style="margin-right: 4px">{{ s }}</el-tag>
            </div>
          </div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="orderCurrent.assets" border size="small" style="margin-bottom: 12px">
          <el-table-column prop="region" label="省市区" min-width="140" />
          <el-table-column prop="project" label="项目" min-width="110" />
          <el-table-column prop="assetNo" label="资产编号" width="110" />
          <el-table-column prop="address" label="资产座落" min-width="150" />
          <el-table-column prop="leaseType" label="租赁类型" width="90" align="center" />
        </el-table>
        <div class="section-title">发票信息</div>
        <div class="detail-grid">
          <div class="cell">
            <div class="label">是否开票</div>
            <div class="value">
              <el-tag size="small" :type="orderCurrent.invoiced ? 'success' : 'warning'">{{ orderCurrent.invoiced ? '已开票' : '未开票' }}</el-tag>
            </div>
          </div>
          <div class="cell"><div class="label">发票票号</div><div class="value">{{ orderCurrent.invoiceNo || '—' }}</div></div>
          <div class="cell"><div class="label">发票类型</div><div class="value">{{ orderCurrent.invoiceType }}</div></div>
          <div class="cell"><div class="label">开票时间</div><div class="value">{{ orderCurrent.invoiceTime || '—' }}</div></div>
          <div class="cell"><div class="label">发票图片</div><div class="value">{{ orderCurrent.invoiceImages }}张</div></div>
        </div>
        <div class="section-title">订单信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">订单号</div><div class="value">{{ orderCurrent.orderNo }}</div></div>
          <div class="cell"><div class="label">支付单号</div><div class="value">{{ orderCurrent.payNo }}</div></div>
          <div class="cell"><div class="label">缴费时间</div><div class="value">{{ orderCurrent.payTime }}</div></div>
          <div class="cell"><div class="label">缴费说明</div><div class="value">{{ orderCurrent.payNote }}</div></div>
          <div class="cell"><div class="label">缴费金额</div><div class="value hl">￥{{ orderCurrent.amount }}</div></div>
          <div class="cell">
            <div class="label">缴费方式</div>
            <div class="value">
              <el-tag size="small" :type="orderCurrent.payWay === '微信支付' ? 'success' : orderCurrent.payWay === '银行转账' ? '' : 'warning'">{{ orderCurrent.payWay }}</el-tag>
            </div>
          </div>
        </div>
        <div class="section-title">发票抬头</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">类型</div><div class="value">{{ orderCurrent.invoiceTitle.type }}</div></div>
          <div class="cell"><div class="label">发票抬头</div><div class="value">{{ orderCurrent.invoiceTitle.title }}</div></div>
          <div class="cell"><div class="label">纳税识别号</div><div class="value">{{ orderCurrent.invoiceTitle.taxNo }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="orderDetailVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Refresh, Filter, Plus } from '@element-plus/icons-vue'
import { useFinanceStore } from '../../store/finance'

const financeStore = useFinanceStore()

const activeTab = ref('invoiceOrders')
const recKeyword = ref('')
const recStatus = ref('')

const orderKeyword = ref('')
const orderFilterOn = ref(false)
const orderInvoiceState = ref('')
const orderPayWay = ref('')
const orderPage = ref(1)
const orderSize = ref(15)

const invoiceOrders = ref([
  {
    id: 1, tenantName: '福州长乐融辉贸易有限公司', tenantType: '企业', contact: '陈立群', phone: '13905912345',
    orderNo: 'DD-20260901-0001', payNo: 'PAY42000012342026090101', payTime: '2026-09-01 09:32:15', payNote: '2026年三季度商铺租金', amount: 25500, payWay: '微信支付',
    invoiced: true, invoiceNo: 'FPZ-2026-0091', invoiceType: '增值税普通发票', invoiceTime: '2026-09-02 10:15:22', invoiceImages: 1,
    contractNo: 'HT-2026-001', signTime: '2026-01-10', contractType: '商铺租赁合同', usage: '商业经营', monthlyRent: 8500, payCycle: '按季',
    leaseStart: '2026-01-15', leaseEnd: '2028-01-14', dueDate: '2026-09-30', contractStatus: ['履约中', '已备案'],
    invoiceTitle: { type: '企业', title: '福州长乐融辉贸易有限公司', taxNo: '91350182MA31XXXX01' },
    assets: [
      { region: '福建省福州市长乐区', project: '吴航街道商业街', zone: 'A区', assetNo: 'ZC-CL-0001', address: '吴航街道商业街A-01商铺', company: '长乐区国有资产投资经营有限公司', leaseType: '整体出租' },
      { region: '福建省福州市长乐区', project: '吴航街道商业街', zone: 'A区', assetNo: 'ZC-CL-0002', address: '吴航街道商业街A-02商铺', company: '长乐区国有资产投资经营有限公司', leaseType: '部分出租' }
    ]
  },
  {
    id: 2, tenantName: '福建省长乐市鸿运纺织有限公司', tenantType: '企业', contact: '林鸿运', phone: '13788886666',
    orderNo: 'DD-20260903-0002', payNo: 'TRF20260903000456', payTime: '2026-09-03 14:20:03', payNote: '2026年下半年厂房租金', amount: 156000, payWay: '银行转账',
    invoiced: true, invoiceNo: 'FPZ-2026-0092', invoiceType: '增值税专用发票', invoiceTime: '2026-09-04 09:02:41', invoiceImages: 2,
    contractNo: 'HT-2026-002', signTime: '2026-02-01', contractType: '厂房租赁合同', usage: '工业生产', monthlyRent: 26000, payCycle: '按半年',
    leaseStart: '2026-02-01', leaseEnd: '2031-01-31', dueDate: '2026-08-01', contractStatus: ['履约中'],
    invoiceTitle: { type: '企业', title: '福建省长乐市鸿运纺织有限公司', taxNo: '91350182MA32XXXX02' },
    assets: [
      { region: '福建省福州市长乐区', project: '航城工业集中区', zone: 'B区', assetNo: 'ZC-CL-0108', address: '航城标准厂房1#楼整栋', company: '长乐区产业发展投资集团有限公司', leaseType: '整体出租' }
    ]
  },
  {
    id: 3, tenantName: '长乐区鑫源投资有限公司', tenantType: '企业', contact: '王鑫', phone: '15060123456',
    orderNo: 'DD-20260908-0003', payNo: 'PAY2088202609080333', payTime: '2026-09-08 16:44:12', payNote: '2026年三季度办公楼租金', amount: 38400, payWay: '支付宝',
    invoiced: false, invoiceNo: '', invoiceType: '增值税普通发票', invoiceTime: '', invoiceImages: 0,
    contractNo: 'HT-2025-018', signTime: '2025-06-10', contractType: '办公楼租赁合同', usage: '办公', monthlyRent: 12800, payCycle: '按季',
    leaseStart: '2025-07-01', leaseEnd: '2028-06-30', dueDate: '2026-10-01', contractStatus: ['履约中', '已备案'],
    invoiceTitle: { type: '企业', title: '长乐区鑫源投资有限公司', taxNo: '91350182MA33XXXX03' },
    assets: [
      { region: '福建省福州市长乐区', project: '漳港总部经济区', zone: 'C区', assetNo: 'ZC-CL-0233', address: '漳港办公楼2层整层', company: '长乐区国有资产投资经营有限公司', leaseType: '部分出租' }
    ]
  },
  {
    id: 4, tenantName: '福州航城物流有限公司', tenantType: '企业', contact: '郑航', phone: '18659112233',
    orderNo: 'DD-20260910-0004', payNo: 'POS20260910000789', payTime: '2026-09-10 11:05:41', payNote: '2026年8月仓库租金补缴', amount: 15600, payWay: 'POS刷卡',
    invoiced: false, invoiceNo: '', invoiceType: '增值税普通发票', invoiceTime: '', invoiceImages: 0,
    contractNo: 'HT-2024-035', signTime: '2024-03-20', contractType: '仓库租赁合同', usage: '仓储物流', monthlyRent: 15600, payCycle: '按月',
    leaseStart: '2024-04-01', leaseEnd: '2026-03-31', dueDate: '2026-03-05', contractStatus: ['已到期'],
    invoiceTitle: { type: '企业', title: '福州航城物流有限公司', taxNo: '91350182MA34XXXX04' },
    assets: [
      { region: '福建省福州市长乐区', project: '航城物流园', zone: 'D区', assetNo: 'ZC-CL-0311', address: '航城物流园3号仓库', company: '长乐区交通建设投资集团有限公司', leaseType: '整体出租' }
    ]
  },
  {
    id: 5, tenantName: '陈秀英', tenantType: '个人', contact: '陈秀英', phone: '13599998888',
    orderNo: 'DD-20260905-0005', payNo: 'PAY42000098762026090502', payTime: '2026-09-05 10:12:36', payNote: '2026年9月商铺租金', amount: 3200, payWay: '微信支付',
    invoiced: false, invoiceNo: '', invoiceType: '电子发票', invoiceTime: '', invoiceImages: 0,
    contractNo: 'HT-2026-009', signTime: '2026-03-01', contractType: '商铺租赁合同', usage: '餐饮经营', monthlyRent: 3200, payCycle: '按月',
    leaseStart: '2026-03-01', leaseEnd: '2029-02-28', dueDate: '2026-09-05', contractStatus: ['履约中'],
    invoiceTitle: { type: '个人', title: '陈秀英', taxNo: '—' },
    assets: [
      { region: '福建省福州市长乐区', project: '首占新区商业街', zone: 'E区', assetNo: 'ZC-CL-0455', address: '首占商铺C-08', company: '长乐区国有资产投资经营有限公司', leaseType: '部分出租' }
    ]
  },
  {
    id: 6, tenantName: '长乐吴航街道陈氏食品店', tenantType: '个体户', contact: '陈志明', phone: '15980234567',
    orderNo: 'DD-20260912-0006', payNo: 'CASH20260912000321', payTime: '2026-09-12 09:18:44', payNote: '2026年三季度摊位租金', amount: 4500, payWay: '现金',
    invoiced: true, invoiceNo: 'FPZ-2026-0093', invoiceType: '电子发票', invoiceTime: '2026-09-12 15:30:08', invoiceImages: 0,
    contractNo: 'HT-2025-027', signTime: '2025-11-15', contractType: '摊位租赁合同', usage: '零售经营', monthlyRent: 1500, payCycle: '按季',
    leaseStart: '2025-12-01', leaseEnd: '2027-11-30', dueDate: '2026-09-15', contractStatus: ['履约中', '已备案'],
    invoiceTitle: { type: '个体户', title: '长乐吴航街道陈氏食品店', taxNo: '92350182MA35XXXX05' },
    assets: [
      { region: '福建省福州市长乐区', project: '吴航农贸市场', zone: 'F区', assetNo: 'ZC-CL-0521', address: '农贸市场1号摊位', company: '长乐区国有资产投资经营有限公司', leaseType: '部分出租' }
    ]
  }
])

const filteredOrders = computed(() => invoiceOrders.value.filter(o => {
  if (orderKeyword.value && !(o.orderNo.includes(orderKeyword.value) || o.tenantName.includes(orderKeyword.value))) return false
  if (orderInvoiceState.value === '已开票' && !o.invoiced) return false
  if (orderInvoiceState.value === '未开票' && o.invoiced) return false
  if (orderPayWay.value && o.payWay !== orderPayWay.value) return false
  return true
}))

const pagedOrders = computed(() => {
  const start = (orderPage.value - 1) * orderSize.value
  return filteredOrders.value.slice(start, start + orderSize.value)
})

const orderStats = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const y = `${now.getFullYear()}`
  const issued = invoiceOrders.value.filter(o => o.invoiced)
  const unissued = invoiceOrders.value.filter(o => !o.invoiced)
  return {
    monthCount: issued.filter(o => o.invoiceTime.startsWith(ym)).length,
    monthAmount: issued.filter(o => o.invoiceTime.startsWith(ym)).reduce((s, o) => s + o.amount, 0),
    yearCount: issued.filter(o => o.invoiceTime.startsWith(y)).length,
    yearAmount: issued.filter(o => o.invoiceTime.startsWith(y)).reduce((s, o) => s + o.amount, 0),
    unissuedCount: unissued.length,
    unissuedAmount: unissued.reduce((s, o) => s + o.amount, 0)
  }
})

const orderCurrent = ref(null)
const orderDetailVisible = ref(false)
const paperVisible = ref(false)
const paperForm = ref({ no: '', fileList: [] })

function openOrderDetail(row) {
  orderCurrent.value = row
  orderDetailVisible.value = true
}

function openPaperDrawer(row) {
  orderCurrent.value = row
  paperForm.value = { no: '', fileList: [] }
  paperVisible.value = true
}

function submitPaper() {
  const row = orderCurrent.value
  if (!paperForm.value.no.trim()) {
    ElMessage.warning('请输入发票票号')
    return
  }
  if (!paperForm.value.fileList.length) {
    ElMessage.warning('请上传发票图片')
    return
  }
  row.invoiced = true
  row.invoiceNo = paperForm.value.no.trim()
  row.invoiceType = '纸质发票'
  row.invoiceTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  row.invoiceImages = paperForm.value.fileList.length
  paperVisible.value = false
  ElMessage.success(`发票票号 ${row.invoiceNo} 已登记`)
}

function exportOrders() {
  const headers = ['订单号', '租赁方', '金额', '缴费方式', '合同编号', '是否开票', '发票号码', '开票时间']
  const rows = filteredOrders.value.map(o => [o.orderNo, o.tenantName, o.amount, o.payWay, o.contractNo, o.invoiced ? '已开票' : '未开票', o.invoiceNo || '', o.invoiceTime || ''])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `开票订单_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filteredOrders.value.length} 条开票订单`)
}

function refreshOrders() {
  orderPage.value = 1
  ElMessage.success('开票订单数据已刷新')
}

const filteredRecords = computed(() => financeStore.invoices.filter(r => {
  if (recKeyword.value && !(r.invoiceNo.includes(recKeyword.value) || r.tenant.includes(recKeyword.value))) return false
  if (recStatus.value && r.invoiceStatus !== recStatus.value) return false
  return true
}))

const recPage = ref(1)
const recSize = ref(15)
const pagedRecords = computed(() => {
  const start = (recPage.value - 1) * recSize.value
  return filteredRecords.value.slice(start, start + recSize.value)
})

const stats = computed(() => ({
  issued: financeStore.invoices.filter(r => r.invoiceStatus === '已开具').length,
  pendingTitle: titles.value.filter(t => t.status === '待审核').length,
  autoCount: autoRules.value.filter(r => r.enabled).length,
  totalAmount: financeStore.invoices.filter(r => r.invoiceStatus === '已开具').reduce((s, r) => s + r.amount, 0).toFixed(1)
}))

// ===== 抬头审核 =====
const titles = ref([
  { tenant: '福州长乐融辉贸易有限公司', titleType: '企业', taxNo: '91350182MA31XXXX01', bank: '中国工商银行长乐支行 1402****8834', submitDate: '2026-06-10', status: '已通过' },
  { tenant: '福建省长乐市鸿运纺织有限公司', titleType: '企业', taxNo: '91350182MA32XXXX02', bank: '中国建设银行长乐支行 3505****1120', submitDate: '2026-06-12', status: '已通过' },
  { tenant: '长乐区鑫源投资有限公司', titleType: '企业', taxNo: '91350182MA33XXXX03', bank: '招商银行福州分行 5919****0067', submitDate: '2026-07-01', status: '待审核' },
  { tenant: '张伟', titleType: '个人', taxNo: '—', bank: '—', submitDate: '2026-08-15', status: '待审核' },
  { tenant: '福州航城物流有限公司', titleType: '企业', taxNo: '91350182MA34XXXX04', bank: '中国农业银行长乐支行 1303****5566', submitDate: '2026-05-20', status: '已驳回' },
])
const approvedTitles = computed(() => titles.value.filter(t => t.status === '已通过'))

function auditTitle(row, pass) {
  if (pass) {
    row.status = '已通过'
    ElMessage.success(`抬头「${row.tenant}」审核通过`)
  } else {
    ElMessageBox.prompt('请输入驳回原因', '驳回抬头', { inputPlaceholder: '如：纳税人识别号有误' }).then(({ value }) => {
      row.status = '已驳回'
      row.rejectReason = value
      ElMessage.warning('已驳回')
    }).catch(() => {})
  }
}

// ===== 税率配置 =====
const taxRates = computed(() => financeStore.invoiceRates)
const enabledRates = computed(() => financeStore.invoiceRates.filter(r => r.enabled))

const showRate = ref(false)
const editingRate = ref(false)
const rateForm = ref({ bizType: '', invoiceType: '增值税普通发票', rate: 5, remark: '', enabled: true })
function openRateDialog(row) {
  if (row) { editingRate.value = true; rateForm.value = { ...row } }
  else { editingRate.value = false; rateForm.value = { bizType: '', invoiceType: '增值税普通发票', rate: 5, remark: '', enabled: true } }
  showRate.value = true
}
function saveRate() {
  if (!rateForm.value.bizType) { ElMessage.warning('请填写业务类型'); return }
  if (editingRate.value) {
    const r = financeStore.invoiceRates.find(x => x.bizType === rateForm.value.bizType && x.invoiceType === rateForm.value.invoiceType)
    if (r) Object.assign(r, rateForm.value)
    ElMessage.success('税率已更新')
  } else {
    financeStore.invoiceRates.push({ ...rateForm.value })
    ElMessage.success('税率已新增')
  }
  showRate.value = false
}
function deleteRate(row) {
  ElMessageBox.confirm(`确认删除「${row.bizType} / ${row.invoiceType}」税率配置？`, '提示', { type: 'warning' }).then(() => {
    const idx = financeStore.invoiceRates.findIndex(r => r === row)
    if (idx >= 0) financeStore.invoiceRates.splice(idx, 1)
    ElMessage.success('已删除')
  }).catch(() => {})
}

// ===== 自动开票规则 =====
const autoRules = ref([
  { ruleName: '租金收款自动开票', trigger: '收款完成时', feeType: '租金', invoiceType: '增值税普通发票', push: true, enabled: true },
  { ruleName: '物业费月度开票', trigger: '账单生成时', feeType: '物业费', invoiceType: '电子发票', push: true, enabled: true },
  { ruleName: '合同生效预开票', trigger: '合同生效时', feeType: '租金', invoiceType: '增值税普通发票', push: false, enabled: false },
])
const showRule = ref(false)
const editingRule = ref(false)
const ruleForm = ref({ ruleName: '', trigger: '收款完成时', feeType: '租金', invoiceType: '增值税普通发票', push: true, enabled: true })
function openRuleDialog(row) {
  if (row) { editingRule.value = true; ruleForm.value = { ...row } }
  else { editingRule.value = false; ruleForm.value = { ruleName: '', trigger: '收款完成时', feeType: '租金', invoiceType: '增值税普通发票', push: true, enabled: true } }
  showRule.value = true
}
function saveRule() {
  if (!ruleForm.value.ruleName) { ElMessage.warning('请填写规则名称'); return }
  if (editingRule.value) {
    const r = autoRules.value.find(x => x.ruleName === ruleForm.value.ruleName)
    if (r) Object.assign(r, ruleForm.value)
    ElMessage.success('规则已更新')
  } else {
    autoRules.value.push({ ...ruleForm.value })
    ElMessage.success('规则已新增')
  }
  showRule.value = false
}
function deleteRule(row) {
  ElMessageBox.confirm(`确认删除规则「${row.ruleName}」？`, '提示', { type: 'warning' }).then(() => {
    autoRules.value = autoRules.value.filter(r => r !== row)
    ElMessage.success('已删除')
  }).catch(() => {})
}

// ===== 推送记录 =====
const pushRecords = ref([
  { invoiceNo: 'FP-2026-002', tenant: '福建省长乐市鸿运纺织有限公司', channel: '短信', target: '139****2222', pushTime: '2026-05-15 10:22:31', result: '成功' },
  { invoiceNo: 'FP-2026-003', tenant: '长乐区鑫源投资有限公司', channel: '邮箱', target: 'finance@xytz.com', pushTime: '2026-07-10 14:05:12', result: '成功' },
  { invoiceNo: 'FP-2026-001', tenant: '福州长乐融辉贸易有限公司', channel: '小程序', target: '融辉贸易企业账户', pushTime: '2026-06-30 09:18:44', result: '失败' },
])
function repush(row) {
  row.result = '成功'
  row.pushTime = new Date().toLocaleString('zh-CN', { hour12: false })
  ElMessage.success(`发票 ${row.invoiceNo} 已重新推送`)
}

// ===== 开票 =====
const showIssue = ref(false)
const issueForm = ref({ invoiceType: '增值税普通发票', tenant: '', bizType: '租金', amount: 0, taxRate: 5, tax: 0, push: false })
function onIssueTypeChange() { onBizTypeChange() }
function onTenantChange() {}
function onBizTypeChange() {
  const r = enabledRates.value.find(x => x.bizType === issueForm.value.bizType && x.invoiceType === issueForm.value.invoiceType)
    || enabledRates.value.find(x => x.bizType === issueForm.value.bizType)
  if (r) issueForm.value.taxRate = r.rate
  calcTax()
}
function calcTax() {
  issueForm.value.tax = issueForm.value.amount * issueForm.value.taxRate / 100
}
const showView = ref(false)
const current = ref(null)
function viewInvoice(row) { current.value = row; showView.value = true }
function redInvoice(row) {
  ElMessageBox.confirm(`确认红冲发票「${row.invoiceNo}」？`, '红冲确认', { type: 'warning' }).then(() => {
    row.invoiceStatus = '已红冲'
    ElMessage.success('已红冲')
  }).catch(() => {})
}
function submitIssue() {
  if (!issueForm.value.tenant) { ElMessage.warning('请选择承租方抬头（需先通过抬头审核）'); return }
  if (!issueForm.value.amount) { ElMessage.warning('请填写开票金额'); return }
  const no = `FP-${new Date().getFullYear()}-${String(financeStore.invoices.length + 1).padStart(3, '0')}`
  financeStore.invoices.unshift({
    invoiceNo: no,
    invoiceType: issueForm.value.invoiceType,
    tenant: issueForm.value.tenant,
    amount: issueForm.value.amount,
    taxRate: issueForm.value.taxRate,
    tax: Number(issueForm.value.tax.toFixed(2)),
    issueDate: new Date().toISOString().slice(0, 10),
    invoiceStatus: '已开具',
    auto: false
  })
  if (issueForm.value.push) {
    pushRecords.value.unshift({
      invoiceNo: no, tenant: issueForm.value.tenant, channel: '邮箱',
      target: '（承租方登记邮箱）', pushTime: new Date().toLocaleString('zh-CN', { hour12: false }), result: '成功'
    })
  }
  showIssue.value = false
  issueForm.value = { invoiceType: '增值税普通发票', tenant: '', bizType: '租金', amount: 0, taxRate: 5, tax: 0, push: false }
  ElMessage.success(`发票 ${no} 已开具`)
}
</script>

<style scoped>
.page-header { display: flex; align-items: center; justify-content: flex-start; gap: 12px; }
.kpi { background: var(--bg-card); border: 1px solid var(--bd); border-radius: var(--r-md); padding: 16px; text-align: center; }
.kpi-v { font-family: var(--font-num); font-variant-numeric: tabular-nums; font-size: 24px; font-weight: 600; line-height: 1.2; }
.kpi-l { font-size: 12px; color: var(--t-weak); margin-top: 8px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
.toolbar .tip { color: var(--t-weak); font-size: 13px; }
.order-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 12px; }
.order-filter { display: flex; flex-wrap: wrap; gap: 12px; padding: 12px 16px; background: var(--bg-th); border-radius: var(--r-sm); margin-bottom: 12px; }
.expand-wrap { padding: 12px 24px; }
.upload-tip { font-size: 12px; color: var(--t-weak); line-height: 1.6; }
.paper-order { background: var(--c-primary-light); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 12px 16px; font-size: 13px; color: var(--t-sub); line-height: 2; }
.paper-order .amount { color: var(--c-primary); font-weight: 700; font-size: 16px; }
.muted { color: var(--t-weak); }
.invoice-preview { width: 100%; padding: 8px; }
.inv-title { text-align: center; font-size: 18px; font-weight: 700; color: #c0392b; }
.inv-no { text-align: center; font-size: 13px; color: var(--t-sub); margin: 8px 0 16px; }
</style>
