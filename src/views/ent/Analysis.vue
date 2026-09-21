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
        <span style="margin-left:auto;font-size:12px;color:#94A3B8">口径：账面原值（历史成本），金额单位：万元</span>
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
              <span :style="{ color: row.utilRate >= 90 ? '#18A058' : row.utilRate >= 80 ? '#1668DC' : '#E8912A' }">{{ row.utilRate }}%</span>
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
              <div class="kpi-value" style="color:#18A058">{{ utilStats.rate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">综合利用率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ utilStats.used }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">在用资产</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ utilStats.idle }}<span class="kpi-unit">处</span></div>
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
        <div class="chart-row chart-row-1-1">
          <el-card shadow="never">
            <template #header><span>各区域利用率</span></template>
            <div ref="utilAreaChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>各类型利用率</span></template>
            <div ref="utilTypeChartRef" class="chart-box"></div>
          </el-card>
        </div>
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
                <span :style="{ color: row.rate >= 90 ? '#18A058' : row.rate >= 70 ? '#E8912A' : '#D93026' }">{{ row.rate }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="trend" label="同比变化" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.trend > 0 ? '#18A058' : '#D93026' }">{{ row.trend > 0 ? '+' : '' }}{{ row.trend }}%</span>
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
              <div class="kpi-value" style="color:#18A058">{{ collectStats.rate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">年度收缴率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ collectStats.receivable }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度应收</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ collectStats.actual }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度实收</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#D93026">{{ collectStats.arrears }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">欠缴金额</div>
            </el-card>
          </el-col>
        </el-row>
        <div class="chart-row chart-row-7-5">
          <el-card shadow="never">
            <template #header><span>月度收缴率趋势</span></template>
            <div ref="collectTrendChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>各企业收缴率排名</span></template>
            <div ref="collectRankChartRef" class="chart-box"></div>
          </el-card>
        </div>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>欠缴明细</span></template>
          <el-table :data="arrearsData" border stripe>
            <el-table-column prop="tenant" label="承租方" min-width="200" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" />
            <el-table-column prop="arrears" label="欠缴金额(万)" width="120" align="right">
              <template #default="{ row }">
                <span style="color:#D93026;font-weight:600">{{ row.arrears }}</span>
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
              <div class="kpi-value" style="color:#E8912A">{{ idleStats.count }}<span class="kpi-unit">处</span></div>
              <div class="kpi-label">闲置资产数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#D93026">{{ idleStats.area }}<span class="kpi-unit">㎡</span></div>
              <div class="kpi-label">闲置总面积</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ idleStats.value }}<span class="kpi-unit">万</span></div>
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
        <div class="chart-row chart-row-7-5">
          <el-card shadow="never">
            <template #header><span>闲置资产分布</span></template>
            <div ref="idleAreaChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>闲置时长分布</span></template>
            <div ref="idleDurationChartRef" class="chart-box"></div>
          </el-card>
        </div>
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
              <div class="kpi-value" style="color:#D93026">{{ expiryStats.expiring30 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">30天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ expiryStats.expiring90 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">90天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ expiryStats.expiring180 }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">180天内到期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ expiryStats.renewed }}<span class="kpi-unit">份</span></div>
              <div class="kpi-label">已续签</div>
            </el-card>
          </el-col>
        </el-row>
        <div class="chart-row chart-row-1-1">
          <el-card shadow="never">
            <template #header><span>月度到期分布</span></template>
            <div ref="expiryMonthChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>到期合同处置状态</span></template>
            <div ref="expiryStatusChartRef" class="chart-box"></div>
          </el-card>
        </div>
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
              <div class="kpi-value" style="color:#1668DC">{{ maintStats.total }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">年度维修总额</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ maintStats.avgPerAsset }}<span class="kpi-unit">万</span></div>
              <div class="kpi-label">单资产均费</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#D93026">{{ maintStats.count }}<span class="kpi-unit">次</span></div>
              <div class="kpi-label">维修工单数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ maintStats.resolved }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">完结率</div>
            </el-card>
          </el-col>
        </el-row>
        <div class="chart-row chart-row-7-5">
          <el-card shadow="never">
            <template #header><span>月度维修费用趋势</span></template>
            <div ref="maintTrendChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>费用类型分布</span></template>
            <div ref="maintTypeChartRef" class="chart-box"></div>
          </el-card>
        </div>
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
              <div class="kpi-value" style="color:#1668DC">{{ leaseStats.total }}<span class="kpi-unit">次</span></div>
              <div class="kpi-label">招租次数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ leaseStats.successRate }}<span class="kpi-unit">%</span></div>
              <div class="kpi-label">成交率</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ leaseStats.premium }}<span class="kpi-unit">%</span></div>
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
        <div class="chart-row chart-row-1-1">
          <el-card shadow="never">
            <template #header><span>招租方式效果对比</span></template>
            <div ref="leaseMethodChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>月度招租趋势</span></template>
            <div ref="leaseMonthChartRef" class="chart-box"></div>
          </el-card>
        </div>
        <el-card shadow="never" style="margin-top:16px">
          <template #header><span>招租记录</span></template>
          <el-table :data="leaseRecordData" border stripe>
            <el-table-column prop="rentNo" label="招租编号" width="140" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" />
            <el-table-column prop="method" label="招租方式" width="100" />
            <el-table-column prop="startPrice" label="起拍价(元/月)" width="120" align="right" />
            <el-table-column prop="dealPrice" label="成交价(元/月)" width="120" align="right">
              <template #default="{ row }">
                <span v-if="row.dealPrice" style="color:#18A058;font-weight:600">{{ row.dealPrice }}</span>
                <span v-else style="color:#94A3B8">-</span>
              </template>
            </el-table-column>
            <el-table-column label="溢价率" width="90" align="right">
              <template #default="{ row }">
                <span v-if="row.dealPrice && row.startPrice" style="color:#E8912A">{{ ((row.dealPrice - row.startPrice) / row.startPrice * 100).toFixed(1) }}%</span>
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
              <div class="kpi-value" style="color:#1668DC">{{ depStats.originalValue }}<span class="kpi-unit">亿</span></div>
              <div class="kpi-label">资产原值</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ depStats.accumDep }}<span class="kpi-unit">亿</span></div>
              <div class="kpi-label">累计折旧</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ depStats.netValue }}<span class="kpi-unit">亿</span></div>
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
        <div class="chart-row chart-row-1-1">
          <el-card shadow="never">
            <template #header><span>年度折旧趋势</span></template>
            <div ref="depTrendChartRef" class="chart-box"></div>
          </el-card>
          <el-card shadow="never">
            <template #header><span>各类型折旧方法分布</span></template>
            <div ref="depMethodChartRef" class="chart-box"></div>
          </el-card>
        </div>
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
import { useUserStore } from '../../store/user'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useFinanceStore } from '../../store/finance'

const route = useRoute()
const isReport = computed(() => route.name === 'EntAssetReport')

const user = useUserStore()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const financeStore = useFinanceStore()
const org = computed(() => user.user?.org || '')

// ===== store 派生的公共口径（企业端一律走 visibleXxx，已按 user.org 过滤）=====
const sum = (list, fn) => list.reduce((s, x) => s + (Number(fn(x)) || 0), 0)
const assets = computed(() => assetStore.visibleAssets || [])
const activeContracts = computed(() => (contractStore.visibleContracts || []).filter(c => c.status !== '已终止' && c.status !== '退租'))
const fees = computed(() => contractStore.visibleFees || [])
const isIdle = a => a.status === '闲置' || a.status === '空置'
const isLeased = a => a.status === '已出租' || a.status === '部分出租'
const isOccupied = a => a.status === '自用' || isLeased(a)
const daysTo = d => Math.round((new Date(String(d).slice(0, 10)) - new Date()) / 86400000)
function monthBuckets(n) {
  const now = new Date()
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: `${d.getMonth() + 1}月`, value: 0 })
  }
  return out
}

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

// 分组小工具：按 keyFn 归类，累加 sumFn 得到的数值
function groupSum(list, keyFn, sumFn) {
  const map = new Map()
  list.forEach(x => {
    const k = keyFn(x)
    map.set(k, (map.get(k) || 0) + (Number(sumFn(x)) || 0))
  })
  return map
}

// 从完整坐落地址里提取"镇/街道"级区域，供分布图按行政区聚合。
// 匹配不到（如测试数据、纯门牌）归入"其他"，避免每个唯一地址各占一个扇区。
const TOWN_RE = /[\u4e00-\u9fa5]{1,3}(?:街道|镇|乡|新区|开发区)/
function townOf(location) {
  const m = (location || '').match(TOWN_RE)
  if (!m) return '其他'
  // 形如"长乐区漳港街道…"会被正则带上行政区尾字"区"，剥掉它只留镇街名
  return m[0].replace(/^区/, '')
}

// 1. 资产利用率（在用 = 自用/已出租/部分出租；闲置 = 闲置/空置）
const utilStats = computed(() => {
  const list = assets.value
  const total = list.length
  const used = list.filter(a => !isIdle(a)).length
  const idle = list.filter(isIdle).length
  const partial = list.filter(a => a.status === '部分出租').length
  return { rate: total ? +(used / total * 100).toFixed(1) : 0, used, idle, partial }
})
// 明细按"镇/街道"级区域聚合（完整地址会让表格列和柱状图 x 轴各占一条）；同比无历史时间字段，trend 记 0
const utilizationData = computed(() => {
  const list = assets.value
  return [...groupSum(list, a => townOf(a.location), () => 1)].map(([area, total]) => {
    const inArea = list.filter(a => townOf(a.location) === area)
    const used = inArea.filter(a => !isIdle(a)).length
    const idle = inArea.filter(isIdle).length
    return { area, total, used, idle, rate: total ? +(used / total * 100).toFixed(1) : 0, trend: 0 }
  }).sort((a, b) => b.total - a.total)
})

// 2. 租金收缴率（企业端 visibleFees：yearReceivable / yearActual / arrears）
const collectStats = computed(() => {
  const list = fees.value
  const receivable = +sum(list, f => f.yearReceivable).toFixed(1)
  const actual = +sum(list, f => f.yearActual).toFixed(1)
  const arrears = +sum(list, f => f.arrears).toFixed(1)
  return { rate: receivable ? +(actual / receivable * 100).toFixed(1) : 0, receivable, actual, arrears }
})
// 欠缴明细：逾期天数取对应合同 overdueDays，催缴次数无字段记 0
const arrearsData = computed(() =>
  fees.value.filter(f => (f.arrears || 0) > 0).map(f => {
    const c = contractStore.getContractById(f.contractId)
    return {
      tenant: f.tenant,
      assetName: f.assetName,
      arrears: +f.arrears.toFixed(1),
      overdueDays: c?.overdueDays || 0,
      urgeCount: 0,
    }
  }).sort((a, b) => b.arrears - a.arrears)
)

// 3. 闲置资产（visibleAssets 中 isIdle）
const idleList = computed(() => assets.value.filter(isIdle))
const idleStats = computed(() => {
  const list = idleList.value
  const dayList = list.map(a => a.vacancyDays).filter(d => Number(d) > 0)
  return {
    count: list.length,
    area: Math.round(sum(list, a => a.area)),
    value: Math.round(sum(list, a => a.bookValue)),
    avgDays: dayList.length ? Math.round(dayList.reduce((s, d) => s + d, 0) / dayList.length) : 0,
  }
})
const idleAssetsData = computed(() => idleList.value.map(a => {
  const idleDays = Number(a.vacancyDays) || 0
  const suggestion = idleDays > 180 ? '建议调整租金标准或改变用途重新招租'
    : idleDays > 90 ? '建议挂牌降价招租或转为自用'
    : '建议尽快纳入年度招租计划'
  return {
    name: a.name,
    area: Math.round(a.area || 0),
    location: a.location || '—',
    idleDays,
    estimatedValue: Math.round(a.bookValue || 0),
    suggestion,
  }
}).sort((a, b) => b.idleDays - a.idleDays))

// 4. 合同到期（visibleContracts 有效合同的 endDate 距今剩余天数）
const expiringList = computed(() =>
  activeContracts.value
    .map(c => ({ ...c, remainDays: daysTo(c.endDate) }))
    .filter(c => c.remainDays >= 0)
    .sort((a, b) => a.remainDays - b.remainDays)
)
const expiryStats = computed(() => {
  const list = expiringList.value
  return {
    expiring30: list.filter(c => c.remainDays <= 30).length,
    expiring90: list.filter(c => c.remainDays <= 90).length,
    expiring180: list.filter(c => c.remainDays <= 180).length,
    renewed: 0, // store 无“已续签”标记字段，暂计 0
  }
})
const expiryData = computed(() => expiringList.value.slice(0, 8).map(c => ({
  contractId: c.id,
  assetName: c.assetName,
  tenant: c.tenant,
  endDate: c.endDate,
  remainDays: c.remainDays,
  disposition: c.status === '临期' ? '洽谈中' : '待处理',
})))

// 5. 维修费用（financeStore.expenses 费用台账；无工单状态字段，已入账即视为完结）
const orgExpenses = computed(() => {
  const all = financeStore.expenses || []
  const names = new Set(assets.value.map(a => a.name))
  const mine = all.filter(e => names.has(e.assetName))
  return mine.length ? mine : all
})
const maintStats = computed(() => {
  const list = orgExpenses.value
  const total = +sum(list, e => e.amount).toFixed(1)
  const assetCount = groupSum(list, e => e.assetName, () => 1).size
  return { total, avgPerAsset: assetCount ? +(total / assetCount).toFixed(2) : 0, count: list.length, resolved: 100 }
})
const maintRankData = computed(() => {
  const list = orgExpenses.value
  const rows = [...groupSum(list, e => e.assetName, e => e.amount)].map(([assetName, totalCost]) => {
    const items = list.filter(e => e.assetName === assetName)
    const issues = [...groupSum(items, e => e.expenseType, () => 1)].sort((a, b) => b[1] - a[1])
    return { assetName, totalCost: +totalCost.toFixed(1), orderCount: items.length, mainIssue: issues[0]?.[0] || '日常维护' }
  }).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5)
  return rows.map((r, i) => ({ rank: i + 1, ...r }))
})

// 6. 招租效果：store 无招租/竞价业务对象，保持静态占位（不参与经营联动）
// 6. 招租效果
const leaseStats = { total: 24, successRate: 79.2, premium: 15.6, avgDays: 32 }
const leaseRecordData = ref([
  { rentNo: 'ZC-2026-001', assetName: '城关旧厂房1#', method: '公开竞价', startPrice: 15000, dealPrice: 18500, status: '已成交' },
  { rentNo: 'ZC-2026-002', assetName: '航城商铺A-08', method: '挂牌出租', startPrice: 3500, dealPrice: 3800, status: '已成交' },
  { rentNo: 'ZC-2026-003', assetName: '营前仓库C-01', method: '公开竞价', startPrice: 8000, dealPrice: null, status: '已流拍' },
  { rentNo: 'ZC-2026-004', assetName: '漳港商铺E-02', method: '协议出租', startPrice: 2800, dealPrice: 2800, status: '已成交' },
  { rentNo: 'ZC-2026-005', assetName: '首占商铺C-06', method: '公开竞价', startPrice: 4200, dealPrice: 5100, status: '已成交' },
])

// 7. 资产折旧：store 仅有账面价值 bookValue（视作原值），无原值/现值/累计折旧字段
const DEP_METHOD = { 房产类: '直线法', 土地类: '不计提', 设施类: '直线法', 运输设备: '工作量法', 设备类: '直线法', 其他: '直线法' }
const DEP_LIFE = { 房产类: 30, 土地类: 0, 设施类: 15, 运输设备: 10, 设备类: 12, 其他: 10 }
function depMethod(cat) { return DEP_METHOD[cat] || '直线法' }
function depLife(cat) { return DEP_LIFE[cat] ?? 20 }
const depreciationData = computed(() =>
  [...groupSum(assets.value, a => a.assetCategory || '其他', () => 1)].map(([type, count]) => {
    const inCat = assets.value.filter(a => (a.assetCategory || '其他') === type)
    const originalValue = Math.round(sum(inCat, a => a.bookValue))
    return { type, count, originalValue, accumDep: 0, netValue: originalValue, method: depMethod(type), usefulLife: depLife(type) }
  }).sort((a, b) => b.originalValue - a.originalValue)
)
const depStats = computed(() => {
  const rows = depreciationData.value
  const original = rows.reduce((s, r) => s + r.originalValue, 0)
  const accum = rows.reduce((s, r) => s + r.accumDep, 0)
  const yi = v => +(v / 10000).toFixed(2) // 万元 → 亿元
  return {
    originalValue: yi(original),
    accumDep: yi(accum),
    netValue: yi(original - accum),
    depRate: original ? +(accum / original * 100).toFixed(1) : 0,
  }
})

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

// ===== 资产报表模式（EntAssetReport）：由 assetStore.visibleAssets 派生 =====
const reportPeriod = ref('2026年度')
const reportCompany = ref('')
const periodOptions = ['2026年度', '2025年度', '2026上半年', '2026三季度']
// 注：store 资产无录入/统计时间字段，统计周期下拉仅影响查询提示，不改变账面数字口径

// 资产分类统计：按 assetCategory 聚合数量/面积/原值；无折旧字段，净值记为原值
const categoryStats = computed(() => {
  const list = assets.value
  const rows = [...groupSum(list, a => a.assetCategory || '其他', () => 1)].map(([category, count]) => {
    const inCat = list.filter(a => (a.assetCategory || '其他') === category)
    const original = Math.round(sum(inCat, a => a.bookValue))
    return {
      category,
      count,
      area: Math.round(sum(inCat, a => a.area)),
      original,
      net: original, // store 无累计折旧，净值=账面原值
      ratio: 0,
    }
  }).sort((a, b) => b.original - a.original)
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

// 公司维度统计：企业端仅本公司一行（visibleAssets 已按 org 过滤）
const companyStatsAll = computed(() => {
  const build = (name, list) => {
    const ids = new Set(list.map(a => a.id))
    const cs = (contractStore.visibleContracts || []).filter(c => ids.has(c.assetId) && c.status !== '已终止' && c.status !== '退租')
    const total = list.length
    const used = list.filter(a => !isIdle(a)).length
    return {
      company: name,
      count: total,
      area: Math.round(sum(list, a => a.area)),
      original: Math.round(sum(list, a => a.bookValue)),
      net: Math.round(sum(list, a => a.bookValue)),
      rent: +sum(cs, c => c.annualRent).toFixed(1),
      utilRate: total ? +(used / total * 100).toFixed(1) : 0,
    }
  }
  if (org.value) return [build(org.value, assets.value)]
  const all = assetStore.assets || []
  return [...groupSum(all, a => a.group || '其他', () => 1).keys()].map(g =>
    build(g, all.filter(a => (a.group || '其他') === g)))
})
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
            xAxis: { type: 'category', data: utilizationData.value.map(d => d.area), axisLabel: { rotate: 45, interval: 0, fontSize: 12 } },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            series: [{ type: 'bar', data: utilizationData.value.map(d => d.rate), itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 72, left: 50 }
          })
        }
        if (utilTypeChartRef.value && !charts.utilType) {
          charts.utilType = echarts.init(utilTypeChartRef.value)
          // 各类型利用率：按资产 type 聚合在用/总数
          const byType = [...groupSum(assets.value, a => a.type || '其他', () => 1)].map(([type, total]) => {
            const inT = assets.value.filter(a => (a.type || '其他') === type)
            const used = inT.filter(a => !isIdle(a)).length
            return { type, rate: total ? +(used / total * 100).toFixed(1) : 0 }
          }).sort((a, b) => b.rate - a.rate)
          charts.utilType.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: byType.map(d => d.type), axisLabel: { rotate: 30 } },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            series: [{ type: 'bar', data: byType.map(d => d.rate), itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 60, left: 50 }
          })
        }
        break
      case 'collection':
        if (collectTrendChartRef.value && !charts.collectTrend) {
          charts.collectTrend = echarts.init(collectTrendChartRef.value)
          // 月度收缴率：可见账单 payments 逐笔实收 ÷ 年应收均摊(1/12)
          const months = monthBuckets(12)
          const plan = (sum(fees.value, f => f.yearReceivable) / 12) || 0
          months.forEach(m => {
            m.actual = fees.value.reduce((s, f) => s + (f.payments || []).reduce((p, x) => String(x.date || '').slice(0, 7) === m.key ? p + (Number(x.amount) || 0) : p, 0), 0)
          })
          charts.collectTrend.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: months.map(m => m.label) },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            series: [{ type: 'line', data: months.map(m => plan ? +Math.min(100, m.actual / plan * 100).toFixed(1) : 0), smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#18A058' } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        if (collectRankChartRef.value && !charts.collectRank) {
          charts.collectRank = echarts.init(collectRankChartRef.value)
          // 承租方收缴率排名：按 tenant 聚合 yearActual ÷ yearReceivable
          const rank = [...groupSum(fees.value, f => f.tenant || '其他', f => f.yearReceivable)].map(([tenant, recv]) => {
            const act = sum(fees.value.filter(f => (f.tenant || '其他') === tenant), f => f.yearActual)
            return { tenant, rate: recv ? +Math.min(100, act / recv * 100).toFixed(1) : 0 }
          }).sort((a, b) => a.rate - b.rate).slice(0, 8)
          charts.collectRank.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 100 },
            yAxis: { type: 'category', data: rank.map(r => r.tenant) },
            series: [{ type: 'bar', data: rank.map(r => r.rate), itemStyle: { color: (p) => p.value >= 95 ? '#18A058' : p.value >= 90 ? '#E8912A' : '#D93026', borderRadius: [0, 4, 4, 0] } }],
            grid: { top: 10, right: 30, bottom: 30, left: 160 }
          })
        }
        break
      case 'idle':
        if (idleAreaChartRef.value && !charts.idleArea) {
          charts.idleArea = echarts.init(idleAreaChartRef.value)
          const areaPie = [...groupSum(idleList.value, a => townOf(a.location), () => 1)]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
          charts.idleArea.setOption({
            tooltip: { trigger: 'item', formatter: '{b}：{c} 处（{d}%）' },
            legend: { type: 'scroll', orient: 'vertical', right: 6, top: 'middle', itemWidth: 10, itemHeight: 10, itemGap: 8, textStyle: { fontSize: 12 } },
            series: [{
              type: 'pie', radius: ['42%', '66%'], center: ['34%', '50%'], minAngle: 4,
              itemStyle: { borderColor: '#fff', borderWidth: 2 },
              label: { formatter: '{b} {c}', fontSize: 12 },
              labelLine: { length: 8, length2: 10 },
              data: areaPie
            }]
          })
        }
        if (idleDurationChartRef.value && !charts.idleDuration) {
          charts.idleDuration = echarts.init(idleDurationChartRef.value)
          const d = idleList.value.map(a => Number(a.vacancyDays) || 0)
          const buckets = [d.filter(x => x < 30).length, d.filter(x => x >= 30 && x < 90).length, d.filter(x => x >= 90 && x < 180).length, d.filter(x => x >= 180).length]
          charts.idleDuration.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: ['<30天', '30-90天', '90-180天', '>180天'] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: buckets, itemStyle: { color: (p) => ['#67C23A', '#E6A23C', '#F56C6C', '#C45656'][p.dataIndex], borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        break
      case 'expiry':
        if (expiryMonthChartRef.value && !charts.expiryMonth) {
          charts.expiryMonth = echarts.init(expiryMonthChartRef.value)
          // 未来 12 个月到期合同数
          const months = monthBuckets(12)
          months.forEach(m => { m.value = expiringList.value.filter(c => String(c.endDate).slice(0, 7) === m.key).length })
          charts.expiryMonth.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: months.map(m => m.label) },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: months.map(m => m.value), itemStyle: { color: '#E6A23C', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 50 }
          })
        }
        if (expiryStatusChartRef.value && !charts.expiryStatus) {
          charts.expiryStatus = echarts.init(expiryStatusChartRef.value)
          // 处置状态：临期合同按合同状态归为 洽谈中/待处理（store 无续签标记字段）
          const dispPie = [...groupSum(expiringList.value, c => (c.status === '临期' ? '洽谈中' : '待处理'), () => 1)].map(([name, value]) => ({
            name, value, itemStyle: { color: name === '洽谈中' ? '#E6A23C' : '#F56C6C' }
          }))
          charts.expiryStatus.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['40%', '70%'], data: dispPie, label: { formatter: '{b}\n{c}份' } }]
          })
        }
        break
      case 'maintenance':
        if (maintTrendChartRef.value && !charts.maintTrend) {
          charts.maintTrend = echarts.init(maintTrendChartRef.value)
          // 月度维修费用：费用台账按 occurDate 归月
          const months = monthBuckets(12)
          months.forEach(m => { m.value = +orgExpenses.value.reduce((s, e) => s + (String(e.occurDate || '').slice(0, 7) === m.key ? (Number(e.amount) || 0) : 0), 0).toFixed(1) })
          charts.maintTrend.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: months.map(m => m.label) },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
            series: [{ type: 'bar', data: months.map(m => m.value), itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } }],
            grid: { top: 10, right: 20, bottom: 30, left: 60 }
          })
        }
        if (maintTypeChartRef.value && !charts.maintType) {
          charts.maintType = echarts.init(maintTypeChartRef.value)
          const typePie = [...groupSum(orgExpenses.value, e => e.expenseType || '其他', e => e.amount)].map(([name, value]) => ({ name, value: +value.toFixed(1) }))
          charts.maintType.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '65%', data: typePie, label: { formatter: '{b}\n{d}%' } }]
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
          // store 资产无录入/逐年折旧字段，仅能出当前年单点（原值/累计折旧/净值）
          const cy = String(new Date().getFullYear())
          charts.depTrend.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['原值', '累计折旧', '净值'] },
            xAxis: { type: 'category', data: [cy] },
            yAxis: { type: 'value', axisLabel: { formatter: '{value}亿' } },
            series: [
              { name: '原值', type: 'bar', data: [depStats.value.originalValue], itemStyle: { color: '#409EFF' } },
              { name: '累计折旧', type: 'bar', data: [depStats.value.accumDep], itemStyle: { color: '#F56C6C' } },
              { name: '净值', type: 'bar', data: [depStats.value.netValue], itemStyle: { color: '#67C23A' } },
            ],
            grid: { top: 40, right: 20, bottom: 30, left: 50 }
          })
        }
        if (depMethodChartRef.value && !charts.depMethod) {
          charts.depMethod = echarts.init(depMethodChartRef.value)
          const METHOD_COLORS = { 直线法: '#409EFF', 工作量法: '#67C23A', 双倍余额递减: '#E6A23C', 不计提: '#909399' }
          const methodPie = [...groupSum(depreciationData.value, r => r.method, r => r.count)]
            .map(([name, value]) => ({ name, value, itemStyle: { color: METHOD_COLORS[name] || '#409EFF' } }))
          charts.depMethod.setOption({
            tooltip: { trigger: 'item' },
            legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '65%', data: methodPie, label: { formatter: '{b}\n{c}处' } }]
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
.chart-box {
  min-height: 280px;
  height: 30vh;
  max-height: 340px;
}

.report-panel {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.report-filter-label {
  font-size: 13px;
  color: var(--t-sub);
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
