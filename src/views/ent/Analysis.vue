<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isReport ? '资产报表' : '资产看板' }}</h2>
      <div v-if="!isReport">
        <el-radio-group v-model="year" size="small">
          <el-radio-button label="2026">2026年</el-radio-button>
          <el-radio-button label="2025">2025年</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- ===== 资产报表模式（路由 EntAssetReport） ===== -->
    <div v-if="isReport">
      <div class="filter-bar" style="display:flex;align-items:center;flex-wrap:wrap;gap:12px">
        <span class="report-filter-label">统计周期</span>
        <el-select v-model="reportPeriod" style="width:130px">
          <el-option v-for="p in periodOptions" :key="p" :label="p" :value="p" />
        </el-select>
        <span class="report-filter-label">公司</span>
        <el-select v-model="reportCompany" placeholder="全部公司" clearable style="width:240px">
          <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-button type="primary" @click="handleReportQuery">查询</el-button>
        <el-button @click="handleReportExport">导出</el-button>
        <span style="margin-left:auto;font-size:12px;color:#999">口径：账面原值（历史成本），金额单位：万元</span>
      </div>

      <div class="stat-strip">
        <div class="stat-item">
          <div class="stat-value">{{ reportSummary.count }}<span class="unit">处</span></div>
          <div class="stat-label">资产总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ reportSummary.area.toLocaleString() }}<span class="unit">㎡</span></div>
          <div class="stat-label">资产总面积</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ reportSummary.original.toLocaleString() }}<span class="unit">万元</span></div>
          <div class="stat-label">原值总额</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ reportSummary.net.toLocaleString() }}<span class="unit">万元</span></div>
          <div class="stat-label">净值总额</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ reportSummary.newRate }}<span class="unit">%</span></div>
          <div class="stat-label">综合成新率</div>
        </div>
      </div>

      <div class="report-panel">
        <div class="section-title">资产分类统计</div>
        <el-table :data="pagedCategoryStats" border stripe show-summary :summary-method="getCategorySummary">
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="category" label="分类" min-width="120" />
          <el-table-column prop="count" label="数量(处)" width="100" align="right" />
          <el-table-column label="面积(㎡)" width="120" align="right">
            <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="原值(万元)" width="130" align="right">
            <template #default="{ row }">{{ row.original.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="净值(万元)" width="130" align="right">
            <template #default="{ row }">{{ row.net.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="占比" min-width="160">
            <template #default="{ row }">
              <div class="ratio-cell">
                <span class="ratio-text">{{ row.ratio }}%</span>
                <div class="ratio-bar"><i :style="{ width: row.ratio + '%' }" /></div>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="catPage"
            v-model:page-size="catPageSize"
            :page-sizes="[5, 10, 20]"
            :total="categoryStats.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>

      <div class="report-panel" style="margin-top:16px">
        <div class="section-title">公司维度统计</div>
        <el-table :data="pagedCompanyStats" border stripe>
          <el-table-column type="index" label="#" width="50" align="center" />
          <el-table-column prop="company" label="公司" min-width="220" show-overflow-tooltip />
          <el-table-column prop="count" label="资产数量" width="100" align="right" />
          <el-table-column label="面积(㎡)" width="120" align="right">
            <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="原值(万元)" width="130" align="right">
            <template #default="{ row }">{{ row.original.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column label="净值(万元)" width="130" align="right">
            <template #default="{ row }">{{ row.net.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="rent" label="年租金收入(万元)" width="140" align="right" />
          <el-table-column label="利用率" width="100" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.utilRate >= 90 ? '#52c41a' : row.utilRate >= 80 ? '#1890ff' : '#fa8c16' }">{{ row.utilRate }}%</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="compPage"
            v-model:page-size="compPageSize"
            :page-sizes="[5, 10, 20]"
            :total="companyStats.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </div>

    <el-tabs v-else v-model="activeReport" type="border-card">
      <!-- 1. 资产利用率分析 -->
      <el-tab-pane label="资产利用率" name="utilization">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ utilStats.rate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">综合利用率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ utilStats.used }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">在用资产</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ utilStats.idle }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">闲置资产</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ utilStats.partial }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">部分利用</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>各区域利用率</span></template>
              <div ref="utilAreaChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>各类型利用率</span></template>
              <div ref="utilTypeChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>利用率明细</span>
              <el-button type="primary" size="small" @click="exportCSV('utilization')">导出</el-button>
            </div>
          </template>
          <el-table :data="utilizationData" border stripe>
            <el-table-column prop="area" label="区域" width="120" />
            <el-table-column prop="total" label="资产总数" width="100" align="right" />
            <el-table-column prop="used" label="在用" width="80" align="right" />
            <el-table-column prop="idle" label="闲置" width="80" align="right" />
            <el-table-column label="利用率" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.rate >= 90 ? '#52c41a' : row.rate >= 70 ? '#fa8c16' : '#f5222d' }">{{ row.rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="trend" label="同比变化" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.trend > 0 ? '#52c41a' : '#f5222d' }">{{ row.trend > 0 ? '+' : '' }}{{ row.trend }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 2. 租金收缴率分析 -->
      <el-tab-pane label="租金收缴率" name="collection">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ collectStats.rate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">年度收缴率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ collectStats.receivable }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度应收</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ collectStats.actual }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度实收</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ collectStats.arrears }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">欠缴金额</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>月度收缴率趋势</span></template>
              <div ref="collectTrendChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>各企业收缴率排名</span></template>
              <div ref="collectRankChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>欠缴明细</span></template>
          <el-table :data="arrearsData" border stripe>
            <el-table-column prop="tenant" label="承租方" min-width="200" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" />
            <el-table-column prop="arrears" label="欠缴金额(万)" width="120" align="right">
              <template #default="{ row }">
                <span style="color:#f5222d;font-weight:600">{{ row.arrears }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="overdueDays" label="逾期天数" width="100" align="right">
              <template #default="{ row }">
                <el-tag :type="row.overdueDays > 90 ? 'danger' : 'warning'" size="small">{{ row.overdueDays }}天</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="urgeCount" label="催缴次数" width="90" align="right" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 3. 闲置资产分析 -->
      <el-tab-pane label="闲置资产" name="idle">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ idleStats.count }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">闲置资产数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ idleStats.area }}<span class="kpi-unit">㎡</span></div>
              <div class="kpi-label">闲置总面积</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ idleStats.value }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">闲置资产估值</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ idleStats.avgDays }}<span class="kpi-unit">天</span></div>
              <div class="kpi-label">平均闲置天数</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>闲置资产分布</span></template>
              <div ref="idleAreaChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>闲置时长分布</span></template>
              <div ref="idleDurationChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>闲置资产清单</span></template>
          <el-table :data="idleAssetsData" border stripe>
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
            <el-table-column prop="location" label="所在区域" width="120" />
            <el-table-column prop="idleDays" label="闲置天数" width="100" align="right">
              <template #default="{ row }">
                <el-tag :type="row.idleDays > 180 ? 'danger' : row.idleDays > 90 ? 'warning' : 'info'" size="small">{{ row.idleDays }}天</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="estimatedValue" label="估值(万元)" width="110" align="right" />
            <el-table-column prop="suggestion" label="处置建议" min-width="160" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 4. 合同到期分析 -->
      <el-tab-pane label="合同到期" name="expiry">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ expiryStats.expiring30 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">30天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ expiryStats.expiring90 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">90天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ expiryStats.expiring180 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">180天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ expiryStats.renewed }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">已续签</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>月度到期分布</span></template>
              <div ref="expiryMonthChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>到期合同处置状态</span></template>
              <div ref="expiryStatusChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>即将到期合同</span></template>
          <el-table :data="expiryData" border stripe>
            <el-table-column prop="contractId" label="合同编号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" />
            <el-table-column prop="tenant" label="承租方" min-width="180" />
            <el-table-column prop="endDate" label="到期日期" width="120" />
            <el-table-column prop="remainDays" label="剩余天数" width="100" align="right">
              <template #default="{ row }">
                <el-tag :type="row.remainDays <= 30 ? 'danger' : row.remainDays <= 90 ? 'warning' : 'info'" size="small">{{ row.remainDays }}天</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处置状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.disposition === '已续签' ? 'success' : row.disposition === '待处理' ? 'danger' : 'warning'" size="small">{{ row.disposition }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 5. 维修费用分析 -->
      <el-tab-pane label="维修费用" name="maintenance">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ maintStats.total }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度维修总额</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ maintStats.avgPerAsset }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">单资产均费</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#f5222d">{{ maintStats.count }}<span class="kpi-unit">次</span></div>
              <div class="kpi-label">维修工单数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ maintStats.resolved }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">完结率</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>月度维修费用趋势</span></template>
              <div ref="maintTrendChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>费用类型分布</span></template>
              <div ref="maintTypeChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>高费用资产排名</span></template>
          <el-table :data="maintRankData" border stripe>
            <el-table-column prop="rank" label="排名" width="60" align="center" />
            <el-table-column prop="assetName" label="资产名称" min-width="180" />
            <el-table-column prop="totalCost" label="维修费用(万)" width="120" align="right" />
            <el-table-column prop="orderCount" label="工单数" width="80" align="right" />
            <el-table-column prop="mainIssue" label="主要问题" min-width="200" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 6. 招租效果分析 -->
      <el-tab-pane label="招租效果" name="leasing">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ leaseStats.total }}<span class="kpi-unit">次</span></div>
              <div class="kpi-label">招租次数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ leaseStats.successRate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">成交率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ leaseStats.premium }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">平均溢价率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ leaseStats.avgDays }}<span class="kpi-unit">天</span></div>
              <div class="kpi-label">平均招租周期</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>招租方式效果对比</span></template>
              <div ref="leaseMethodChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>月度招租趋势</span></template>
              <div ref="leaseMonthChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>招租记录</span></template>
          <el-table :data="leaseRecordData" border stripe>
            <el-table-column prop="rentNo" label="招租编号" width="140" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" />
            <el-table-column prop="method" label="招租方式" width="100" />
            <el-table-column prop="startPrice" label="起拍价(元/月)" width="120" align="right" />
            <el-table-column prop="dealPrice" label="成交价(元/月)" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.dealPrice" style="color:#52c41a;font-weight:600">{{ row.dealPrice }}</span>
                <span v-else style="color:#999">-</span>
              </template>
            </el-table-column>
            <el-table-column label="溢价率" width="90" align="right">
              <template #default="{ row }">
                <span v-if="row.dealPrice && row.startPrice" style="color:#fa8c16">{{ ((row.dealPrice - row.startPrice) / row.startPrice * 100).toFixed(1) }}%</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已成交' ? 'success' : row.status === '已流拍' ? 'danger' : ''" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 7. 资产折旧分析 -->
      <el-tab-pane label="资产折旧" name="depreciation">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1890ff">{{ depStats.originalValue }}<span class="kpi-unit">亿</span></div>
              <div class="kpi-label">资产原值</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#fa8c16">{{ depStats.accumDep }}<span class="kpi-unit">亿</span></div>
              <div class="kpi-label">累计折旧</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#52c41a">{{ depStats.netValue }}<span class="kpi-unit">亿</span></div>
              <div class="kpi-label">资产净值</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ depStats.depRate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">综合折旧率</div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>年度折旧趋势</span></template>
              <div ref="depTrendChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header><span>各类型折旧方法分布</span></template>
              <div ref="depMethodChartRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-card shadow="never" style="margin-top:16px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span>折旧明细</span>
              <el-button type="primary" size="small" @click="exportCSV('depreciation')">导出</el-button>
            </div>
          </template>
          <el-table :data="depreciationData" border stripe show-summary :summary-method="getDepSummary">
            <el-table-column prop="type" label="资产类型" width="120" />
            <el-table-column prop="count" label="数量" width="80" align="right" />
            <el-table-column prop="originalValue" label="原值(万元)" width="120" align="right" />
            <el-table-column prop="accumDep" label="累计折旧(万元)" width="130" align="right" />
            <el-table-column prop="netValue" label="净值(万元)" width="120" align="right" />
            <el-table-column prop="method" label="折旧方法" width="120" />
            <el-table-column prop="usefulLife" label="使用年限" width="90" align="right" />
            <el-table-column label="折旧率" width="90" align="right">
              <template #default="{ row }">
                {{ (row.accumDep / row.originalValue * 100).toFixed(1) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const route = useRoute()
const isReport = computed(() => route.name === 'EntAssetReport')

const year = ref('2026')
const activeReport = ref('utilization')

// Chart refs
const utilAreaChartRef = ref(null)
const utilTypeChartRef = ref(null)
const collectTrendChartRef = ref(null)
const collectRankChartRef = ref(null)
const idleAreaChartRef = ref(null)
const idleDurationChartRef = ref(null)
const expiryMonthChartRef = ref(null)
const expiryStatusChartRef = ref(null)
const maintTrendChartRef = ref(null)
const maintTypeChartRef = ref(null)
const leaseMethodChartRef = ref(null)
const leaseMonthChartRef = ref(null)
const depTrendChartRef = ref(null)
const depMethodChartRef = ref(null)

let charts = {}

function disposeCharts() {
  Object.values(charts).forEach(c => c && c.dispose())
  charts = {}
}

// 1. 资产利用率
const utilStats = { rate: 82.3, used: 247, idle: 21, partial: 32 }
const utilizationData = ref([
  { area: '吴航街道', total: 52, used: 45, idle: 3, rate: 92.3, trend: 2.1 },
  { area: '航城街道', total: 48, used: 38, idle: 5, rate: 85.4, trend: -1.2 },
  { area: '营前街道', total: 38, used: 30, idle: 4, rate: 84.2, trend: 3.5 },
  { area: '首占新区', total: 42, used: 36, idle: 2, rate: 90.5, trend: 1.8 },
  { area: '漳港街道', total: 35, used: 28, idle: 4, rate: 85.7, trend: -0.5 },
  { area: '江田镇', total: 32, used: 25, idle: 3, rate: 84.4, trend: 2.3 },
  { area: '玉田镇', total: 28, used: 22, idle: 3, rate: 82.1, trend: 0.8 },
  { area: '鹤上镇', total: 25, used: 23, idle: 1, rate: 96.0, trend: 4.2 },
])

// 2. 租金收缴率
const collectStats = { rate: 96.1, receivable: 2580, actual: 2479, arrears: 101 }
const arrearsData = ref([
  { tenant: '福州航城物流有限公司', assetName: '营前仓库B-03', arrears: 28, overdueDays: 120, urgeCount: 3 },
  { tenant: '长乐吴航街道陈氏食品店', assetName: '首占商铺C-08', arrears: 15, overdueDays: 85, urgeCount: 2 },
  { tenant: '福建长力纺织有限公司', assetName: '航城厂房2#', arrears: 35, overdueDays: 150, urgeCount: 4 },
  { tenant: '长乐区鑫海贸易有限公司', assetName: '漳港商铺D-05', arrears: 12, overdueDays: 45, urgeCount: 1 },
  { tenant: '福州长乐融辉贸易有限公司', assetName: '城关商铺A-02', arrears: 11, overdueDays: 30, urgeCount: 1 },
])

// 3. 闲置资产
const idleStats = { count: 21, area: 8560, value: 12800, avgDays: 156 }
const idleAssetsData = ref([
  { name: '城关旧厂房3#', area: 2400, location: '吴航街道', idleDays: 210, estimatedValue: 3600, suggestion: '建议改造为创意产业园或招租' },
  { name: '营前仓库D-02', area: 800, location: '营前街道', idleDays: 180, estimatedValue: 960, suggestion: '建议降价招租或转为自用' },
  { name: '漳港商铺E-08', area: 120, location: '漳港街道', idleDays: 150, estimatedValue: 360, suggestion: '建议调整租金标准重新招租' },
  { name: '航城商铺B-12', area: 85, location: '航城街道', idleDays: 95, estimatedValue: 255, suggestion: '已通过招租流程，待签约' },
  { name: '江田农贸市场2#', area: 650, location: '江田镇', idleDays: 280, estimatedValue: 1300, suggestion: '建议改为社区服务中心' },
])

// 4. 合同到期
const expiryStats = { expiring30: 5, expiring90: 12, expiring180: 23, renewed: 18 }
const expiryData = ref([
  { contractId: 'HT-2026-003', assetName: '漳港办公楼2层', tenant: '长乐区鑫源投资有限公司', endDate: '2026-09-30', remainDays: 14, disposition: '待处理' },
  { contractId: 'HT-2026-008', assetName: '城关商铺A-05', tenant: '福州长乐融辉贸易有限公司', endDate: '2026-10-15', remainDays: 29, disposition: '洽谈中' },
  { contractId: 'HT-2026-012', assetName: '航城厂房1#', tenant: '福建省长乐市鸿运纺织有限公司', endDate: '2026-11-30', remainDays: 75, disposition: '待处理' },
  { contractId: 'HT-2026-015', assetName: '营前仓库B-01', tenant: '福州航城物流有限公司', endDate: '2026-12-31', remainDays: 106, disposition: '待处理' },
  { contractId: 'HT-2025-020', assetName: '首占商铺C-03', tenant: '长乐吴航街道陈氏食品店', endDate: '2026-08-31', remainDays: 0, disposition: '已续签' },
])

// 5. 维修费用
const maintStats = { total: 186, avgPerAsset: 0.62, count: 142, resolved: 94.4 }
const maintRankData = ref([
  { rank: 1, assetName: '城关旧厂房1#', totalCost: 28.5, orderCount: 18, mainIssue: '屋顶漏水、电气线路老化' },
  { rank: 2, assetName: '航城厂房2#', totalCost: 22.3, orderCount: 15, mainIssue: '地面沉降、排水系统维修' },
  { rank: 3, assetName: '漳港办公楼1层', totalCost: 15.8, orderCount: 12, mainIssue: '空调系统更换、电梯维保' },
  { rank: 4, assetName: '营前仓库A-01', totalCost: 12.6, orderCount: 8, mainIssue: '防水处理、门禁系统升级' },
  { rank: 5, assetName: '城关商铺B-02', totalCost: 8.2, orderCount: 6, mainIssue: '门面翻新、管道维修' },
])

// 6. 招租效果
const leaseStats = { total: 24, successRate: 79.2, premium: 15.6, avgDays: 32 }
const leaseRecordData = ref([
  { rentNo: 'ZC-2026-001', assetName: '城关旧厂房1#', method: '公开竞价', startPrice: 15000, dealPrice: 18500, status: '已成交' },
  { rentNo: 'ZC-2026-002', assetName: '航城商铺A-08', method: '挂牌出租', startPrice: 3500, dealPrice: 3800, status: '已成交' },
  { rentNo: 'ZC-2026-003', assetName: '营前仓库C-01', method: '公开竞价', startPrice: 8000, dealPrice: null, status: '已流拍' },
  { rentNo: 'ZC-2026-004', assetName: '漳港商铺E-02', method: '协议出租', startPrice: 2800, dealPrice: 2800, status: '已成交' },
  { rentNo: 'ZC-2026-005', assetName: '首占商铺C-06', method: '公开竞价', startPrice: 4200, dealPrice: 5100, status: '已成交' },
])

// 7. 资产折旧
const depStats = { originalValue: 56.15, accumDep: 18.52, netValue: 37.63, depRate: 33.0 }
const depreciationData = ref([
  { type: '商业用房', count: 180, originalValue: 28500, accumDep: 8550, netValue: 19950, method: '直线法', usefulLife: 30 },
  { type: '工业厂房', count: 65, originalValue: 16200, accumDep: 6480, netValue: 9720, method: '直线法', usefulLife: 25 },
  { type: '办公用房', count: 35, originalValue: 7800, accumDep: 2340, netValue: 5460, method: '直线法', usefulLife: 30 },
  { type: '仓储设施', count: 30, originalValue: 2400, accumDep: 840, netValue: 1560, method: '双倍余额递减', usefulLife: 20 },
  { type: '其他', count: 22, originalValue: 1250, accumDep: 310, netValue: 940, method: '直线法', usefulLife: 15 },
])

function getDepSummary({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    const key = col.property
    if (['count', 'originalValue', 'accumDep', 'netValue'].includes(key)) {
      return data.reduce((s, r) => s + (r[key] || 0), 0)
    }
    return ''
  })
}

function exportCSV(type) {
  const label = type === 'utilization' ? '利用率' : '折旧'
  let headers, rows
  if (type === 'utilization') {
    headers = ['区域', '总数', '已使用', '闲置', '利用率(%)', '趋势']
    rows = utilizationData.value.map(r => [r.area, r.total, r.used, r.idle, r.rate, r.trend])
  } else {
    headers = ['资产类型', '数量', '原值(万元)', '累计折旧(万元)', '净值(万元)', '折旧方法', '使用年限']
    rows = depreciationData.value.map(r => [r.type, r.count, r.originalValue, r.accumDep, r.netValue, r.method, r.usefulLife])
  }
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `资产${label}报表_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`${label}报表已导出`)
}

// ===== 资产报表模式（EntAssetReport）组件本地 mock 数据 =====
const reportPeriod = ref('2026年度')
const reportCompany = ref('')
const periodOptions = ['2026年度', '2025年度', '2026上半年', '2026三季度']
const periodFactor = { '2026年度': 1, '2025年度': 0.93, '2026上半年': 0.52, '2026三季度': 0.27 }

const categoryBase = [
  { category: '商业用房', count: 180, area: 96500, original: 28500, net: 19950 },
  { category: '工业厂房', count: 65, area: 152300, original: 16200, net: 9720 },
  { category: '办公用房', count: 35, area: 41200, original: 7800, net: 5460 },
  { category: '仓储设施', count: 30, area: 68400, original: 2400, net: 1560 },
  { category: '停车场', count: 12, area: 15800, original: 680, net: 410 },
  { category: '土地资产', count: 8, area: 52600, original: 4200, net: 3980 },
  { category: '市政配套', count: 6, area: 9400, original: 350, net: 210 },
  { category: '其他', count: 4, area: 3200, original: 220, net: 120 },
]

const categoryStats = computed(() => {
  const f = periodFactor[reportPeriod.value] || 1
  const rows = categoryBase.map(r => ({
    category: r.category,
    count: Math.max(1, Math.round(r.count * (0.8 + 0.2 * f))),
    area: Math.round(r.area * f),
    original: Math.round(r.original * f),
    net: Math.round(r.net * f),
    ratio: 0,
  }))
  const total = rows.reduce((s, r) => s + r.original, 0) || 1
  rows.forEach(r => { r.ratio = +(r.original / total * 100).toFixed(1) })
  return rows
})

const reportSummary = computed(() => {
  const rows = categoryStats.value
  const count = rows.reduce((s, r) => s + r.count, 0)
  const area = rows.reduce((s, r) => s + r.area, 0)
  const original = rows.reduce((s, r) => s + r.original, 0)
  const net = rows.reduce((s, r) => s + r.net, 0)
  return { count, area, original, net, newRate: original ? (net / original * 100).toFixed(1) : '0.0' }
})

const companyStatsAll = ref([
  { company: '长乐区国有资产投资有限公司', count: 96, area: 86400, original: 15200, net: 10340, rent: 860, utilRate: 91.2 },
  { company: '福州航城物流有限公司', count: 58, area: 74200, original: 9800, net: 6120, rent: 645, utilRate: 88.5 },
  { company: '福州长乐融辉贸易有限公司', count: 47, area: 32600, original: 7600, net: 5230, rent: 512, utilRate: 84.1 },
  { company: '福建省长乐市鸿运纺织有限公司', count: 39, area: 58900, original: 6400, net: 3980, rent: 428, utilRate: 79.6 },
  { company: '长乐区鑫源投资有限公司', count: 33, area: 41300, original: 5300, net: 3610, rent: 356, utilRate: 86.9 },
  { company: '长乐区鑫海贸易有限公司', count: 21, area: 18700, original: 2600, net: 1720, rent: 188, utilRate: 82.3 },
  { company: '福州长乐海航物业服务有限公司', count: 15, area: 9600, original: 1400, net: 980, rent: 132, utilRate: 90.5 },
  { company: '长乐吴航街道陈氏食品店', count: 12, area: 3600, original: 980, net: 640, rent: 96, utilRate: 92.4 },
])
const companyOptions = computed(() => companyStatsAll.value.map(r => r.company))
const companyStats = computed(() =>
  reportCompany.value ? companyStatsAll.value.filter(r => r.company === reportCompany.value) : companyStatsAll.value
)

const catPage = ref(1)
const catPageSize = ref(5)
const compPage = ref(1)
const compPageSize = ref(5)
const pagedCategoryStats = computed(() => categoryStats.value.slice((catPage.value - 1) * catPageSize.value, catPage.value * catPageSize.value))
const pagedCompanyStats = computed(() => companyStats.value.slice((compPage.value - 1) * compPageSize.value, compPage.value * compPageSize.value))

watch(reportCompany, () => { compPage.value = 1 })

function getCategorySummary({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (i === 2) return data.reduce((s, r) => s + r.count, 0)
    if (i === 3) return data.reduce((s, r) => s + r.area, 0).toLocaleString()
    if (i === 4) return data.reduce((s, r) => s + r.original, 0).toLocaleString()
    if (i === 5) return data.reduce((s, r) => s + r.net, 0).toLocaleString()
    return ''
  })
}

function handleReportQuery() {
  catPage.value = 1
  compPage.value = 1
  ElMessage.success(`报表查询完成：${reportPeriod.value}${reportCompany.value ? ' / ' + reportCompany.value : ' / 全部公司'}`)
}

function handleReportExport() {
  const data = companyStats.value
  const headers = ['公司', '数量', '面积(㎡)', '账面原值(万元)', '净值(万元)', '租金(万元)', '利用率(%)']
  const rows = data.map(r => [r.company, r.count, r.area, r.original, r.net, r.rent, r.utilRate])
  const total = reportSummary.value
  rows.push(['合计', total.count, total.area, total.original, total.net, '', ''])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `资产报表_${reportPeriod.value}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('资产报表已导出（CSV）')
}

function initChartForTab(tab) {
  nextTick(() => {
    switch (tab) {
      case 'utilization':
        if (utilAreaChartRef.value && !charts.utilArea) {
          charts.utilArea = echarts.init(utilAreaChartRef.value)
          charts.utilArea.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: utilizationData.value.map(d => d.area), axisLabel: { rotate: 30 } },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            series: [{ type: 'bar', data: utilizationData.value.map(d => d.rate), itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 60, left: 50 }
          })
        }
        if (utilTypeChartRef.value && !charts.utilType) {
          charts.utilType = echarts.init(utilTypeChartRef.value)
          charts.utilType.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['40%', '70%'], data: [
              { value: 85, name: '商铺', itemStyle: { color: '#409EFF' } },
              { value: 78, name: '厂房', itemStyle: { color: '#67C23A' } },
              { value: 92, name: '办公楼', itemStyle: { color: '#E6A23C' } },
              { value: 70, name: '仓储', itemStyle: { color: '#F56C6C' } },
            ], label: { formatter: '{b}\n{c}%' } }]
          })
        }
        break
      case 'collection':
        if (collectTrendChartRef.value && !charts.collectTrend) {
          charts.collectTrend = echarts.init(collectTrendChartRef.value)
          charts.collectTrend.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'] },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            series: [{ type: 'line', data: [94.5, 93.8, 96.1, 95.2, 96.8, 97.1, 95.5, 96.1], smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#52c41a' } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        if (collectRankChartRef.value && !charts.collectRank) {
          charts.collectRank = echarts.init(collectRankChartRef.value)
          charts.collectRank.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            yAxis: { type: 'category', data: ['融辉贸易', '鸿运纺织', '鑫源投资', '航城物流', '陈氏食品'].reverse() },
            series: [{ type: 'bar', data: [98.5, 97.2, 95.8, 88.3, 82.1].reverse(), itemStyle: { color: (p) => p.value >= 95 ? '#52c41a' : p.value >= 90 ? '#fa8c16' : '#f5222d', borderRadius: [0, 4, 4, 0] } }],
            grid: { top: 10, right: 30, bottom: 30, left: 80 }
          })
        }
        break
      case 'idle':
        if (idleAreaChartRef.value && !charts.idleArea) {
          charts.idleArea = echarts.init(idleAreaChartRef.value)
          charts.idleArea.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '65%', data: [
              { value: 5, name: '吴航街道' }, { value: 4, name: '航城街道' }, { value: 3, name: '营前街道' },
              { value: 3, name: '漳港街道' }, { value: 3, name: '江田镇' }, { value: 3, name: '其他' },
            ], label: { formatter: '{b}\n{c}处' } }]
          })
        }
        if (idleDurationChartRef.value && !charts.idleDuration) {
          charts.idleDuration = echarts.init(idleDurationChartRef.value)
          charts.idleDuration.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['<30天', '30-90天', '90-180天', '>180天'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [3, 5, 6, 7], itemStyle: { color: (p) => ['#67C23A', '#E6A23C', '#F56C6C', '#C45656'][p.dataIndex], borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        break
      case 'expiry':
        if (expiryMonthChartRef.value && !charts.expiryMonth) {
          charts.expiryMonth = echarts.init(expiryMonthChartRef.value)
          charts.expiryMonth.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['9月', '10月', '11月', '12月', '1月', '2月', '3月'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [5, 4, 6, 8, 3, 2, 4], itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        if (expiryStatusChartRef.value && !charts.expiryStatus) {
          charts.expiryStatus = echarts.init(expiryStatusChartRef.value)
          charts.expiryStatus.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['40%', '70%'], data: [
              { value: 18, name: '已续签', itemStyle: { color: '#67C23A' } },
              { value: 8, name: '洽谈中', itemStyle: { color: '#E6A23C' } },
              { value: 12, name: '待处理', itemStyle: { color: '#F56C6C' } },
              { value: 2, name: '不再续租', itemStyle: { color: '#909399' } },
            ], label: { formatter: '{b}\n{c}份' } }]
          })
        }
        break
      case 'maintenance':
        if (maintTrendChartRef.value && !charts.maintTrend) {
          charts.maintTrend = echarts.init(maintTrendChartRef.value)
          charts.maintTrend.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'] },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
            series: [{ type: 'bar', data: [18, 12, 22, 15, 28, 20, 32, 24], itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 60 }
          })
        }
        if (maintTypeChartRef.value && !charts.maintType) {
          charts.maintType = echarts.init(maintTypeChartRef.value)
          charts.maintType.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '65%', data: [
              { value: 68, name: '维修费' }, { value: 42, name: '水电费' }, { value: 35, name: '物业费' },
              { value: 25, name: '保险费' }, { value: 16, name: '其他' },
            ], label: { formatter: '{b}\n{d}%' } }]
          })
        }
        break
      case 'leasing':
        if (leaseMethodChartRef.value && !charts.leaseMethod) {
          charts.leaseMethod = echarts.init(leaseMethodChartRef.value)
          charts.leaseMethod.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['成交率', '溢价率'] },
            xAxis: { type: 'category', data: ['公开竞价', '挂牌出租', '协议出租'] },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
            series: [
              { name: '成交率', type: 'bar', data: [85, 75, 92], itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } },
              { name: '溢价率', type: 'bar', data: [22, 8, 3], itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] } },
            ],
            grid: { top: 40, right: 20, bottom: 30, left: 50 }
          })
        }
        if (leaseMonthChartRef.value && !charts.leaseMonth) {
          charts.leaseMonth = echarts.init(leaseMonthChartRef.value)
          charts.leaseMonth.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'] },
            yAxis: { type: 'value' },
            series: [
              { type: 'line', name: '招租次数', data: [3, 2, 4, 3, 2, 4, 3, 3], smooth: true, itemStyle: { color: '#409EFF' } },
              { type: 'line', name: '成交次数', data: [2, 1, 3, 2, 2, 3, 2, 3], smooth: true, itemStyle: { color: '#67C23A' } },
            ],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        break
      case 'depreciation':
        if (depTrendChartRef.value && !charts.depTrend) {
          charts.depTrend = echarts.init(depTrendChartRef.value)
          charts.depTrend.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['原值', '累计折旧', '净值'] },
            xAxis: { type: 'category', data: ['2022', '2023', '2024', '2025', '2026'] },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}亿' } },
            series: [
              { name: '原值', type: 'line', data: [48, 50, 52, 54, 56.15], itemStyle: { color: '#409EFF' } },
              { name: '累计折旧', type: 'line', data: [10, 12.5, 14.8, 16.8, 18.52], itemStyle: { color: '#F56C6C' } },
              { name: '净值', type: 'line', data: [38, 37.5, 37.2, 37.2, 37.63], itemStyle: { color: '#67C23A' } },
            ],
            grid: { top: 40, right: 20, bottom: 30, left: 50 }
          })
        }
        if (depMethodChartRef.value && !charts.depMethod) {
          charts.depMethod = echarts.init(depMethodChartRef.value)
          charts.depMethod.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '65%', data: [
              { value: 250, name: '直线法', itemStyle: { color: '#409EFF' } },
              { value: 30, name: '双倍余额递减', itemStyle: { color: '#E6A23C' } },
              { value: 20, name: '工作量法', itemStyle: { color: '#67C23A' } },
            ], label: { formatter: '{b}\n{c}处' } }]
          })
        }
        break
    }
  })
}

watch(activeReport, (val) => {
  initChartForTab(val)
})

watch(year, () => {
  disposeCharts()
  initChartForTab(activeReport.value)
})

onMounted(() => {
  initChartForTab(activeReport.value)
})
</script>

<style scoped>
.report-panel {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.report-filter-label {
  font-size: 13px;
  color: #666;
}

.ratio-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ratio-text {
  width: 48px;
  color: var(--c-primary);
  font-weight: 600;
}

.ratio-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-page);
  border-radius: 3px;
  overflow: hidden;
}

.ratio-bar i {
  display: block;
  height: 100%;
  background: var(--c-primary);
  border-radius: 3px;
}
</style>
