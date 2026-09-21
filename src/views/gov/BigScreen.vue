<template>
  <div class="bigscreen" ref="bigscreenRef">
    <div class="bs-header">
      <div class="bs-title">长乐区国有资产监管大屏</div>
      <div class="bs-breadcrumb">
        <template v-if="drillLevel >= 1">
          <span class="bc-item" :class="{ active: drillLevel === 1 }" @click="drillUp(1)">{{ currentCompany?.name }}</span>
        </template>
        <template v-if="drillLevel >= 2">
          <span class="bc-sep">/</span>
          <span class="bc-item active">{{ currentProject?.name }}</span>
        </template>
      </div>
      <div class="bs-time">
        <el-icon :size="14"><Timer /></el-icon>
        <span class="bs-time-text">{{ clock }}</span>
      </div>
      <div class="bs-header-ops">
        <el-button size="small" class="bs-fullscreen-btn" @click="togglePageFullscreen">
          <el-icon><FullScreen /></el-icon>
          {{ isPageFullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </div>

    <!-- KPI 行 -->
    <div class="bs-kpis">
      <div class="bs-kpi" v-for="k in displayKpis" :key="k.label">
        <div class="bs-kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="bs-kpi-unit">{{ k.unit }}</span></div>
        <div class="bs-kpi-label">{{ k.label }}</div>
      </div>
    </div>

    <!-- 全区视图 -->
    <template v-if="drillLevel === 0">
      <el-tabs v-model="activeTab" class="bs-tabs">
        <el-tab-pane label="资产总览" name="overview">
          <div class="bs-grid">
            <div class="bs-panel">
              <div class="bs-panel-title">资产类别分布</div>
              <div class="cat-cards">
                <div class="cat-card" v-for="c in categories" :key="c.name" @click="selectCategory(c)">
                  <div class="cat-name">{{ c.name }}</div>
                  <div class="cat-nums">
                    <span>总数 <b>{{ c.total }}</b></span>
                    <span style="color:var(--st-rented)">出租 <b>{{ c.rented }}</b></span>
                    <span style="color:var(--st-idle)">闲置 <b>{{ c.idle }}</b></span>
                    <span style="color:var(--st-self)">占用 <b>{{ c.occupied }}</b></span>
                  </div>
                  <div class="cat-nums cat-figs">
                    <span>资产价值(亿) <b style="color:var(--c-primary)">{{ c.valueYi }}</b></span>
                    <span>资产数量(个) <b style="color:#c084fc">{{ c.unitCount }}</b></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="bs-panel">
              <div class="bs-panel-title">资产数量排行（街道 · Top 10）</div>
              <div ref="rankChartRef" class="bs-chart"></div>
            </div>
            <div class="bs-panel">
              <div class="bs-panel-title">租赁情况</div>
              <div class="stat-rows">
                <div class="stat-row" v-for="s in leaseStats" :key="s.label">
                  <span class="stat-label">{{ s.label }}</span>
                  <div class="stat-bar"><div class="stat-fill" :style="{ width: s.pct + '%', background: s.color }"></div></div>
                  <span class="stat-val">{{ s.value }}</span>
                </div>
              </div>
            </div>
            <div class="bs-panel">
              <div class="bs-panel-title">收益情况（万元）</div>
              <div ref="revenueChartRef" class="bs-chart"></div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="公司维度" name="company">
          <div class="company-grid">
            <div class="company-card" v-for="co in companies" :key="co.name" @click="drillToCompany(co)">
              <div class="co-header">
                <div class="co-icon">🏢</div>
                <div class="co-name">{{ co.name }}</div>
              </div>
              <div class="co-metrics">
                <div class="co-metric">
                  <span class="co-metric-label">资产总宗</span>
                  <span class="co-metric-value">{{ co.totalAssets }}</span>
                </div>
                <div class="co-metric">
                  <span class="co-metric-label">资产价值(万)</span>
                  <span class="co-metric-value">{{ co.totalValue.toLocaleString() }}</span>
                </div>
                <div class="co-metric">
                  <span class="co-metric-label">出租率</span>
                  <span class="co-metric-value" :style="{ color: co.rentRate > 70 ? '#4ade80' : co.rentRate > 50 ? '#facc15' : '#f87171' }">{{ co.rentRate }}%</span>
                </div>
                <div class="co-metric">
                  <span class="co-metric-label">收缴率</span>
                  <span class="co-metric-value" :style="{ color: co.collectionRate > 80 ? '#4ade80' : '#fb923c' }">{{ co.collectionRate }}%</span>
                </div>
              </div>
              <div class="co-bar-row">
                <span class="co-bar-label">出租中</span>
                <div class="co-bar"><div class="co-bar-fill" :style="{ width: co.rentedPct + '%', background: '#4ade80' }"></div></div>
                <span class="co-bar-pct">{{ co.rentedPct }}%</span>
              </div>
              <div class="co-bar-row">
                <span class="co-bar-label">闲置中</span>
                <div class="co-bar"><div class="co-bar-fill" :style="{ width: co.idlePct + '%', background: '#facc15' }"></div></div>
                <span class="co-bar-pct">{{ co.idlePct }}%</span>
              </div>
              <div class="co-bar-row">
                <span class="co-bar-label">不可租</span>
                <div class="co-bar"><div class="co-bar-fill" :style="{ width: co.unrentablePct + '%', background: '#60a5fa' }"></div></div>
                <span class="co-bar-pct">{{ co.unrentablePct }}%</span>
              </div>
              <div class="co-footer">
                <span class="co-risk" v-if="co.riskCount">
                  <span class="risk-dot"></span> {{ co.riskCount }} 项预警
                </span>
                <span class="co-enter">点击下钻 →</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="GIS监管" name="gis">
          <div class="gis-board">
            <div class="gis-col">
              <div class="bs-panel">
                <div class="bs-panel-title">资产权属</div>
                <div class="owner-grid">
                  <div class="owner-block" v-for="o in ownership" :key="o.label">
                    <div class="owner-head" :style="{ color: o.color }">{{ o.label }}</div>
                    <div class="owner-row"><span>宗数</span><b>{{ o.count }} 宗</b></div>
                    <div class="owner-row"><span>面积</span><b>{{ o.area.toLocaleString() }} ㎡</b></div>
                    <div class="owner-row"><span>价值</span><b>{{ o.value.toLocaleString() }} 万元</b></div>
                  </div>
                </div>
              </div>
              <div class="bs-panel">
                <div class="bs-panel-title">权证/抵押</div>
                <div class="mortgage-wrap">
                  <div ref="mortgageChartRef" class="mortgage-donut"></div>
                  <div class="mortgage-nums">
                    <div class="mn-item">
                      <span class="mn-label">抵押价值</span>
                      <span class="mn-value" style="color:var(--c-accent)">{{ mortgage.totalValue.toLocaleString() }}<i>万元</i></span>
                    </div>
                    <div class="mn-item">
                      <span class="mn-label">抵押面积</span>
                      <span class="mn-value" style="color:var(--c-primary)">{{ mortgage.totalArea.toLocaleString() }}<i>㎡</i></span>
                    </div>
                    <div class="mn-item">
                      <span class="mn-label">抵押率</span>
                      <span class="mn-value" style="color:var(--c-warning)">{{ mortgage.rate }}<i>%</i></span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="bs-panel">
                <div class="bs-panel-title">收缴分析</div>
                <div class="gis-sub-title">本年类型收缴（金额/面积）</div>
                <div ref="collectTypeChartRef" class="gis-chart-sm"></div>
                <div class="gis-sub-title">应收/实收（月度，万元）</div>
                <div ref="collectMonthChartRef" class="gis-chart-sm"></div>
              </div>
            </div>

            <div class="gis-col gis-center">
              <div class="bs-panel gis-map-panel" ref="gisMapPanelRef">
                <div class="bs-panel-title">
                  GIS 资产分布（{{ gisMapMode === 'district' ? '街道点位' : '区城投公司' }}）
                  <div class="gis-map-ops">
                    <el-button size="small" class="gis-switch-btn" @click="toggleGisMapMode">
                      {{ gisMapMode === 'district' ? '切换区城投' : '切换街道' }}
                    </el-button>
                  </div>
                </div>
                <div ref="gisAmapContainerRef" class="gis-amap-container"></div>
              </div>
              <div class="bs-panel">
                <div class="bs-panel-title">收缴概览</div>
                <div class="collect-overview">
                  <div class="cov-item" v-for="c in collectOverview" :key="c.label">
                    <div class="cov-value" :style="{ color: c.color }">{{ c.value }}<i>{{ c.unit }}</i></div>
                    <div class="cov-label">{{ c.label }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="gis-col">
              <div class="bs-panel">
                <div class="bs-panel-title">收缴排行</div>
                <el-table :data="collectionRankRows" size="small" class="dark-table">
                  <el-table-column label="排名" width="58" align="center">
                    <template #default="{ $index }">
                      <span class="rank-badge" :class="'rb-' + ($index + 1)">{{ $index + 1 }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="company" label="公司" min-width="90" />
                  <el-table-column label="租赁率" width="80" align="right">
                    <template #default="{ row }">
                      <span :style="{ color: row.rentRate > 70 ? '#4ade80' : row.rentRate > 55 ? '#facc15' : '#f87171' }">{{ row.rentRate }}%</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="assetCount" label="资产数" width="72" align="right" />
                  <el-table-column label="创收金额" width="96" align="right">
                    <template #default="{ row }">
                      <span style="color:var(--c-primary)">{{ row.income.toLocaleString() }} 万</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="bs-panel">
                <div class="bs-panel-title">租赁情况</div>
                <div class="lease-circles">
                  <div class="lease-circle" v-for="l in leaseCircles" :key="l.label">
                    <svg viewBox="0 0 90 90" class="lc-svg">
                      <circle cx="45" cy="45" r="38" fill="none" stroke="var(--bd)" stroke-width="6" />
                      <circle cx="45" cy="45" r="38" fill="none" :stroke="l.color" stroke-width="6" stroke-linecap="round"
                              :stroke-dasharray="ringCirc" :stroke-dashoffset="ringCirc * (1 - l.pct / 100)"
                              transform="rotate(-90 45 45)" />
                    </svg>
                    <div class="lc-center">
                      <b :style="{ color: l.color }">{{ l.value }}</b>
                      <span>{{ l.unit }}</span>
                    </div>
                    <div class="lc-label">{{ l.label }}</div>
                  </div>
                </div>
                <div class="idle-rate">
                  <span class="ir-label">资产闲置率</span>
                  <div class="stat-bar"><div class="stat-fill" :style="{ width: idleRate + '%', background: '#facc15' }"></div></div>
                  <span class="ir-value">{{ idleRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产清单" name="list">
          <div class="bs-panel">
            <div class="bs-panel-title">
              资产清单
              <el-input v-model="listKeyword" placeholder="搜索资产名称/街道" clearable size="small" style="width:200px;margin-left:12px" />
            </div>
            <el-table :data="filteredList" size="small" class="dark-table" height="420">
              <el-table-column prop="name" label="资产名称" min-width="180" />
              <el-table-column prop="street" label="所属街道" width="100" />
              <el-table-column prop="category" label="类别" width="110" />
              <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
              <el-table-column prop="value" label="价值(万元)" width="110" align="right" />
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }">
                  <span :style="{ color: row.status === '出租' ? '#4ade80' : row.status === '闲置' ? '#facc15' : '#60a5fa' }">● {{ row.status }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="tenant" label="承租方" min-width="180">
                <template #default="{ row }">{{ row.tenant || '—' }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 公司视图 -->
    <template v-else-if="drillLevel === 1 && currentCompany">
      <div class="drill-content">
        <div class="drill-header-card">
          <div class="dh-left">
            <div class="dh-icon">🏢</div>
            <div>
              <div class="dh-name">{{ currentCompany.name }}</div>
              <div class="dh-sub">{{ currentCompany.subtitle }}</div>
            </div>
          </div>
          <div class="dh-kpis">
            <div class="dh-kpi" v-for="k in companyKpis" :key="k.label">
              <div class="dh-kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="dh-kpi-unit">{{ k.unit }}</span></div>
              <div class="dh-kpi-label">{{ k.label }}</div>
            </div>
          </div>
        </div>

        <div class="drill-grid">
          <div class="bs-panel">
            <div class="bs-panel-title">收缴排行榜（万元）</div>
            <el-table :data="currentCompany.collectionRank" size="small" class="dark-table" max-height="260">
              <el-table-column type="index" label="#" width="40" align="center" />
              <el-table-column prop="project" label="项目" min-width="120" />
              <el-table-column prop="receivable" label="应收" width="90" align="right" />
              <el-table-column prop="collected" label="实收" width="90" align="right" />
              <el-table-column label="收缴率" width="80" align="right">
                <template #default="{ row }">
                  <span :style="{ color: row.rate > 80 ? '#4ade80' : row.rate > 60 ? '#facc15' : '#f87171' }">{{ row.rate }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="bs-panel">
            <div class="bs-panel-title">正在预警风险</div>
            <div class="risk-list">
              <div class="risk-item" v-for="(r, i) in currentCompany.risks" :key="i">
                <span class="risk-level" :class="'risk-' + r.level">{{ r.levelText }}</span>
                <span class="risk-text">{{ r.text }}</span>
                <span class="risk-project">{{ r.project }}</span>
              </div>
              <div v-if="!currentCompany.risks.length" class="risk-empty">暂无预警风险</div>
            </div>
          </div>
          <div class="bs-panel">
            <div class="bs-panel-title">资产状态分布</div>
            <div ref="companyPieChartRef" class="bs-chart"></div>
          </div>
          <div class="bs-panel">
            <div class="bs-panel-title">项目列表（点击下钻）</div>
            <div class="project-cards">
              <div class="project-card" v-for="p in currentCompany.projects" :key="p.name" @click="drillToProject(p)">
                <div class="pc-name">{{ p.name }}</div>
                <div class="pc-nums">
                  <span>{{ p.total }}宗</span>
                  <span style="color:var(--st-rented)">出租{{ p.rented }}</span>
                  <span style="color:var(--st-idle)">闲置{{ p.idle }}</span>
                </div>
                <div class="pc-rate">出租率 {{ p.rentRate }}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 项目视图 -->
    <template v-else-if="drillLevel === 2 && currentProject">
      <div class="drill-content">
        <div class="drill-header-card">
          <div class="dh-left">
            <div class="dh-icon">📍</div>
            <div>
              <div class="dh-name">{{ currentProject.name }}</div>
              <div class="dh-sub">{{ currentCompany?.name }} · {{ currentProject.location }}</div>
            </div>
          </div>
          <div class="dh-kpis">
            <div class="dh-kpi" v-for="k in projectKpis" :key="k.label">
              <div class="dh-kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="dh-kpi-unit">{{ k.unit }}</span></div>
              <div class="dh-kpi-label">{{ k.label }}</div>
            </div>
          </div>
        </div>

        <div class="bs-panel">
          <div class="bs-panel-title">
            资产明细
            <el-input v-model="projectKeyword" placeholder="搜索资产名称" clearable size="small" style="width:200px;margin-left:12px" />
          </div>
          <el-table :data="filteredProjectAssets" size="small" class="dark-table" height="380">
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="category" label="类别" width="110" />
            <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
            <el-table-column prop="value" label="价值(万元)" width="110" align="right" />
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.status === '出租' ? '#4ade80' : row.status === '闲置' ? '#facc15' : '#60a5fa' }">● {{ row.status }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="tenant" label="承租方" min-width="180">
              <template #default="{ row }">{{ row.tenant || '—' }}</template>
            </el-table-column>
            <el-table-column prop="rent" label="年租金(万)" width="100" align="right">
              <template #default="{ row }">{{ row.rent ? row.rent.toFixed(1) : '—' }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { FullScreen, Timer } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useWarningStore } from '../../store/warning'
import { useSuperviseStore } from '../../store/supervise'
import { useFinanceStore } from '../../store/finance'

const assetStore = useAssetStore()
const contractStore = useContractStore()
const warningStore = useWarningStore()
const superviseStore = useSuperviseStore()
const financeStore = useFinanceStore()

const PREFERRED_GROUP_ORDER = ['城投集团', '产投集团', '水投集团', '领航公司']
const COMPANY_ORDER = computed(() => {
  const seen = []
  assetStore.assets.forEach(a => { if (a.group && !seen.includes(a.group)) seen.push(a.group) })
  const preferred = PREFERRED_GROUP_ORDER.filter(n => seen.includes(n))
  const rest = seen.filter(n => !preferred.includes(n))
  return [...preferred, ...rest]
})
const RENTED = new Set(['已出租', '部分出租'])
const IDLE = new Set(['闲置', '空置'])
const OPEN_CONTRACT = s => s !== '已终止' && s !== '退租'
const round1 = v => Math.round((Number(v) || 0) * 10) / 10
const round2 = v => Math.round((Number(v) || 0) * 100) / 100
const statusLabel = s => RENTED.has(s) ? '出租' : (IDLE.has(s) ? '闲置' : '占用')
// 街道几何质心（长乐区行政边界事实数据，不是业务数据）：资产没有 lnglat，
// 按 location 匹配落到街道质心上，作为 GIS 气泡的兜底坐标。
const STREET_CENTROIDS = {
  '吴航街道': { lng: 119.523, lat: 25.962 },
  '航城街道': { lng: 119.536, lat: 25.972 },
  '营前街道': { lng: 119.508, lat: 25.920 },
  '首占新区': { lng: 119.525, lat: 25.905 },
  '漳港街道': { lng: 119.572, lat: 25.890 },
  '文武砂街道': { lng: 119.555, lat: 25.845 },
  '松下镇': { lng: 119.520, lat: 25.830 },
  '金峰镇': { lng: 119.490, lat: 25.860 },
  '江田镇': { lng: 119.520, lat: 25.820 },
  '玉田镇': { lng: 119.490, lat: 25.830 },
  '鹤上镇': { lng: 119.520, lat: 25.930 },
  '古槐镇': { lng: 119.540, lat: 25.900 },
  '湖南镇': { lng: 119.550, lat: 25.880 },
  '梅花镇': { lng: 119.580, lat: 25.850 },
  '长乐区': { lng: 119.530, lat: 25.900 },
}
const DISTRICT_CENTER = { lng: 119.530, lat: 25.900 }

const activeTab = ref('overview')
const hoverStreet = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const listKeyword = ref('')
const isPageFullscreen = ref(false)
const bigscreenRef = ref(null)
const projectKeyword = ref('')
const clock = ref('')
const drillLevel = ref(0)
const currentCompanyName = ref(null)
const currentProjectName = ref(null)

const companies = computed(() => {
  const assets = assetStore.assets
  const contracts = contractStore.contracts
  const fees = contractStore.feeRecords
  const feeByContract = Object.fromEntries(fees.map(f => [f.contractId, f]))
  const assetById = Object.fromEntries(assets.map(a => [a.id, a]))
  const warningTasks = warningStore.warningTasks
  const orders = superviseStore.orders

  return COMPANY_ORDER.value.map(name => {
    const coAssets = assets.filter(a => a.group === name)
    const totalAssets = coAssets.length
    const totalValue = Math.round(coAssets.reduce((s, a) => s + (Number(a.bookValue) || 0), 0))
    const rentedCount = coAssets.filter(a => RENTED.has(a.status)).length
    const idleCount = coAssets.filter(a => IDLE.has(a.status)).length
    const occupiedCount = totalAssets - rentedCount - idleCount
    const rentRate = totalAssets ? round1(rentedCount / totalAssets * 100) : 0

    // 收缴：本公司资产 → 合同 → 收费台账年度口径
    const coContractIds = new Set(contracts.filter(c => assetById[c.assetId]?.group === name).map(c => c.id))
    const coFees = fees.filter(f => coContractIds.has(f.contractId))
    const yearReceivable = coFees.reduce((s, f) => s + (Number(f.yearReceivable) || 0), 0)
    const yearActual = coFees.reduce((s, f) => s + (Number(f.yearActual) || 0), 0)
    const collectionRate = yearReceivable ? round1(yearActual / yearReceivable * 100) : 0

    const rentedPct = totalAssets ? round1(rentedCount / totalAssets * 100) : 0
    const idlePct = totalAssets ? round1(idleCount / totalAssets * 100) : 0
    const unrentablePct = totalAssets ? round1(occupiedCount / totalAssets * 100) : 0

    // 风险：预警任务 + 未办结督办
    const risks = [
      ...warningTasks.filter(t => t.group === name && t.status !== '已完成').slice(0, 3).map(t => ({
        level: t.priority === '高' ? 'high' : (t.priority === '中' ? 'mid' : 'low'),
        levelText: t.priority || '中',
        text: `${t.name || t.type}`,
        project: (t.asset || '').split(/\s+/).slice(1).join(' ') || t.type || '',
      })),
      ...orders.filter(o => o.group === name && o.status !== '已办结').slice(0, 2).map(o => ({
        level: o.status === '已逾期' ? 'high' : 'mid',
        levelText: o.status === '已逾期' ? '高' : '中',
        text: `${o.type}·${o.subject || o.reason || ''}`.slice(0, 28),
        project: o.asset || '',
      })),
    ].slice(0, 5)

    // 项目收缴排行：按 projectName 分组（合同 → 资产 → 项目）
    const projAgg = {}
    contracts.filter(c => assetById[c.assetId]?.group === name).forEach(c => {
      const a = assetById[c.assetId]
      const key = a.projectName || '未挂项目'
      if (!projAgg[key]) projAgg[key] = { project: key, receivable: 0, collected: 0 }
      const f = feeByContract[c.id]
      projAgg[key].receivable += Number(f?.yearReceivable || c.annualRent || 0)
      projAgg[key].collected += Number(f?.yearActual || 0)
    })
    const collectionRank = Object.values(projAgg)
      .map(r => ({
        project: r.project,
        receivable: round1(r.receivable),
        collected: round1(r.collected),
        rate: r.receivable ? round1(r.collected / r.receivable * 100) : 0,
      }))
      .sort((a, b) => b.collected - a.collected)
      .slice(0, 5)

    // 项目列表：资产按 projectName 归堆
    const projAgg2 = {}
    coAssets.forEach(a => {
      const key = a.projectName || '未挂项目'
      if (!projAgg2[key]) projAgg2[key] = { name: key, location: a.location || '', total: 0, rented: 0, idle: 0, assets: [] }
      const p = projAgg2[key]
      p.total++
      if (RENTED.has(a.status)) p.rented++
      if (IDLE.has(a.status)) p.idle++
      p.assets.push({
        name: a.name, category: a.assetCategory || a.type || '—',
        area: Number(a.area) || 0, value: Number(a.bookValue) || 0,
        status: statusLabel(a.status), tenant: a.tenant || '—',
        rent: Number(a.annualRent) || 0,
      })
    })
    const projects = Object.values(projAgg2).map(p => ({
      ...p,
      rentRate: p.total ? round1(p.rented / p.total * 100) : 0,
    }))

    return {
      name,
      subtitle: `${totalAssets} 宗资产 · 账面值 ${totalValue.toLocaleString()} 万元`,
      totalAssets, totalValue, rentRate, collectionRate,
      rentedPct, idlePct, unrentablePct,
      riskCount: risks.length,
      risks, collectionRank, projects,
    }
  })
})

const currentCompany = computed(() => companies.value.find(c => c.name === currentCompanyName.value) || null)
const currentProject = computed(() => {
  if (!currentCompany.value || !currentProjectName.value) return null
  return currentCompany.value.projects.find(p => p.name === currentProjectName.value) || null
})

// 街道聚合：按 asset.location 匹配质心；气泡半径来自资产数量与价值
const streets = computed(() => {
  const agg = {}
  assetStore.assets.forEach(a => {
    const key = a.location || '未标注'
    if (!agg[key]) agg[key] = { name: key, total: 0, value: 0, area: 0, rented: 0, idle: 0 }
    const r = agg[key]
    r.total++
    r.value += Number(a.bookValue) || 0
    r.area += Number(a.area) || 0
    if (RENTED.has(a.status)) r.rented++
    if (IDLE.has(a.status)) r.idle++
  })
  return Object.values(agg).map(r => {
    const c = STREET_CENTROIDS[r.name] || DISTRICT_CENTER
    return {
      name: r.name,
      lng: c.lng, lat: c.lat,
      x: 0, y: 0,
      total: r.total,
      value: Math.round(r.value),
      area: Math.round(r.area),
      rented: r.rented,
      idle: r.idle,
      rentRate: r.total ? round1(r.rented / r.total * 100) : 0,
    }
  }).sort((a, b) => b.total - a.total)
})

// GIS 资产点位：只画有 location 且能匹配质心的资产；无 lnglat 字段，用街道质心兜底
const assetBubbles = computed(() => {
  const pts = []
  assetStore.assets.forEach(a => {
    const c = STREET_CENTROIDS[a.location]
    if (!c) return
    // 每宗资产在所属街道质心附近按 id 伪散开，避免完全重叠；不是真实经纬度
    const salt = String(a.id || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)
    pts.push({
      id: a.id,
      name: a.name,
      lng: c.lng + ((salt % 100) - 50) * 0.0002,
      lat: c.lat + (((salt / 100) | 0) % 100 - 50) * 0.0002,
      value: Number(a.bookValue) || 0,
      area: Number(a.area) || 0,
      status: a.status,
      group: a.group,
      location: a.location,
    })
  })
  return pts
})

const categories = computed(() => {
  const agg = {}
  assetStore.assets.forEach(a => {
    const key = a.assetCategory || '未分类'
    if (!agg[key]) agg[key] = { name: key, total: 0, rented: 0, idle: 0, occupied: 0, value: 0 }
    const r = agg[key]
    r.total++
    r.value += Number(a.bookValue) || 0
    if (RENTED.has(a.status)) r.rented++
    else if (IDLE.has(a.status)) r.idle++
    else r.occupied++
  })
  return Object.values(agg).map(r => ({
    name: r.name,
    total: r.total,
    rented: r.rented,
    idle: r.idle,
    occupied: r.occupied,
    valueYi: round2(r.value / 10000),
    unitCount: r.total,
  })).sort((a, b) => b.total - a.total)
})

const gisMapMode = ref('district')
const gisMapPanelRef = ref(null)
const gisAmapContainerRef = ref(null)
const AMAP_KEY = 'd9902108686d1a72769e105fb5f8343e'
let gisAmapInstance = null
let gisAmapPolygons = []
let gisAmapMarkers = []
let gisAmapLabels = []

const companyMarkers = computed(() => {
  // 近似：公司 GIS 落点用其资产最集中的街道质心；无公司专用经纬度字段
  const agg = {}
  assetStore.assets.forEach(a => {
    if (!a.group) return
    if (!agg[a.group]) agg[a.group] = { total: 0, value: 0, area: 0, rented: 0, idle: 0, byStreet: {} }
    const r = agg[a.group]
    r.total++
    r.value += Number(a.bookValue) || 0
    r.area += Number(a.area) || 0
    if (RENTED.has(a.status)) r.rented++
    if (IDLE.has(a.status)) r.idle++
    r.byStreet[a.location] = (r.byStreet[a.location] || 0) + 1
  })
  return COMPANY_ORDER.value.filter(n => agg[n]).map(n => {
    const r = agg[n]
    const topStreet = Object.entries(r.byStreet).sort((a, b) => b[1] - a[1])[0]?.[0]
    const c = STREET_CENTROIDS[topStreet] || DISTRICT_CENTER
    return {
      name: n,
      lng: c.lng, lat: c.lat,
      total: r.total,
      value: Math.round(r.value),
      area: Math.round(r.area),
      rented: r.rented,
      idle: r.idle,
      rentRate: r.total ? round1(r.rented / r.total * 100) : 0,
    }
  })
})

const gisMarkers = computed(() => (gisMapMode.value === 'district' ? streets.value : companyMarkers.value))

function toggleGisMapMode() {
  gisMapMode.value = gisMapMode.value === 'district' ? 'company' : 'district'
  hoverStreet.value = null
  if (gisAmapInstance) {
    clearGisAmapOverlays()
    addGisMarkers()
  }
}

function toggleGisFullscreen() {
  const el = gisMapPanelRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

function togglePageFullscreen() {
  const el = bigscreenRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

document.addEventListener('fullscreenchange', () => {
  isPageFullscreen.value = !!document.fullscreenElement
})

const ownership = computed(() => {
  const has = { label: '有证', count: 0, area: 0, value: 0, color: '#4ade80' }
  const no = { label: '无证', count: 0, area: 0, value: 0, color: '#f87171' }
  assetStore.assets.forEach(a => {
    const cert = a.certStatus || ''
    const bucket = cert === '已办证' ? has : no
    bucket.count++
    bucket.area += Number(a.area) || 0
    bucket.value += Number(a.bookValue) || 0
  })
  has.area = Math.round(has.area); has.value = Math.round(has.value)
  no.area = Math.round(no.area); no.value = Math.round(no.value)
  return [has, no]
})

// 抵押：由 finance.debtOverview 提供每公司抵押金额与被抵押资产实际面积
const mortgage = computed(() => {
  const rows = financeStore.debtOverview || []
  const totalValue = Math.round(rows.reduce((s, r) => s + (r.mortgage || 0), 0))
  const totalArea = Math.round(rows.reduce((s, r) => s + (r.mortgageArea || 0), 0))
  const totalAssetValue = rows.reduce((s, r) => s + (r.assetValue || 0), 0)
  const rate = totalAssetValue ? round1(totalValue / totalAssetValue * 100) : 0
  return {
    totalValue, totalArea, rate,
    byCompany: rows.map(r => ({ name: r.company, value: Math.round(r.mortgage || 0) })),
  }
})

const mortgageTotalCount = computed(() => mortgage.value.byCompany.reduce((s, r) => s + r.value, 0))

const collectTypeData = computed(() => {
  const contractById = Object.fromEntries(contractStore.contracts.map(c => [c.id, c]))
  const assetById = Object.fromEntries(assetStore.assets.map(a => [a.id, a]))
  const agg = {}
  contractStore.feeRecords.forEach(f => {
    const c = contractById[f.contractId]
    if (!c) return
    const a = assetById[c.assetId]
    const key = a?.assetCategory || '未分类'
    if (!agg[key]) agg[key] = { name: key, amount: 0, area: 0 }
    agg[key].amount += Number(f.yearActual) || 0
    agg[key].area += Number(c.leaseArea) || Number(a?.area) || 0
  })
  return Object.values(agg).map(r => ({
    name: r.name,
    amount: round1(r.amount),
    area: Math.round(r.area),
  })).sort((a, b) => b.amount - a.amount).slice(0, 8)
})

const collectMonthData = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
  const receivable = Array(12).fill(0)
  const received = Array(12).fill(0)

  // 实收：逐笔流水按发生月份归集
  contractStore.feeRecords.forEach(f => {
    (f.payments || []).forEach(p => {
      const d = new Date(p.date)
      if (d.getFullYear() !== year) return
      received[d.getMonth()] += Number(p.amount) || 0
    })
  })

  // 应收：每份合同按 annualRent/12 摊到本年与其有效期 (startDate~endDate) 的交集月份
  const contractFeeById = Object.fromEntries(contractStore.feeRecords.map(f => [f.contractId, f]))
  contractStore.contracts.forEach(c => {
    if (c.status === '已终止' || c.status === '退租') return
    const s = new Date(c.startDate)
    const e = new Date(c.endDate)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return
    const fee = contractFeeById[c.id]
    const annual = Number(c.annualRent) || Number(fee?.yearReceivable) || 0
    if (!annual) return
    const monthly = annual / 12
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1)
      const monthEnd = new Date(year, m + 1, 0)
      if (monthEnd < s || monthStart > e) continue
      // 覆盖整月按全月，部分覆盖按天数比例
      const coverStart = s > monthStart ? s : monthStart
      const coverEnd = e < monthEnd ? e : monthEnd
      const days = Math.max(0, (coverEnd - coverStart) / 86400000 + 1)
      const total = (monthEnd - monthStart) / 86400000 + 1
      receivable[m] += monthly * (days / total)
    }
  })

  return {
    months,
    receivable: receivable.map(v => round1(v)),
    received: received.map(v => round1(v)),
  }
})

const collectOverview = computed(() => {
  const now = new Date()
  const curMonth = now.getMonth()
  const prevMonth = (curMonth + 11) % 12
  const recv = collectMonthData.value.received
  const recble = collectMonthData.value.receivable
  const thisActual = round1(recv[curMonth] || 0)
  const thisRecv = round1(recble[curMonth] || 0)
  const thisArrears = round1(Math.max(0, thisRecv - thisActual))
  const prevActual = round1(recv[prevMonth] || 0)
  const prevRecv = round1(recble[prevMonth] || 0)
  const prevRate = prevRecv ? round1(prevActual / prevRecv * 100) : 0
  const yearArrears = round1(contractStore.feeRecords.reduce((s, f) => s + (Number(f.arrears) || 0), 0))
  const yearRecvTotal = round1(recble.reduce((s, v) => s + v, 0))
  const yearArrearsRate = yearRecvTotal ? round1(yearArrears / yearRecvTotal * 100) : 0
  return [
    { label: '本月应收', value: thisRecv.toFixed(1), unit: '万元', color: '#4C8DFF' },
    { label: '本月实收', value: thisActual.toFixed(1), unit: '万元', color: '#4ade80' },
    { label: '本月欠缴', value: thisArrears.toFixed(1), unit: '万元', color: '#f87171' },
    { label: '上月收缴率', value: prevRate.toFixed(1), unit: '%', color: '#facc15' },
    { label: '本年欠缴率', value: yearArrearsRate.toFixed(1), unit: '%', color: '#fb923c' },
    { label: '本年欠缴', value: yearArrears.toFixed(1), unit: '万元', color: '#c084fc' },
  ]
})

const collectionRankRows = computed(() => {
  const assetById = Object.fromEntries(assetStore.assets.map(a => [a.id, a]))
  const rows = COMPANY_ORDER.value.map(name => {
    const coAssets = assetStore.assets.filter(a => a.group === name)
    const total = coAssets.length
    const rented = coAssets.filter(a => RENTED.has(a.status)).length
    const rentRate = total ? round1(rented / total * 100) : 0
    const coContractIds = new Set(contractStore.contracts.filter(c => assetById[c.assetId]?.group === name).map(c => c.id))
    const income = round1(contractStore.feeRecords
      .filter(f => coContractIds.has(f.contractId))
      .reduce((s, f) => s + (Number(f.yearActual) || 0), 0))
    return { company: name, rentRate, assetCount: total, income }
  })
  return rows.filter(r => r.assetCount > 0).sort((a, b) => b.income - a.income)
})

const ringCirc = 2 * Math.PI * 38
const idleRate = computed(() => {
  const total = assetStore.assets.length
  const idle = assetStore.assets.filter(a => IDLE.has(a.status)).length
  return total ? round1(idle / total * 100) : 0
})

const leaseCircles = computed(() => {
  const assets = assetStore.assets
  const totalAreaAll = assets.reduce((s, a) => s + (Number(a.area) || 0), 0)
  const idleAssets = assets.filter(a => IDLE.has(a.status))
  const rentedAssets = assets.filter(a => RENTED.has(a.status))
  const leasedArea = rentedAssets.reduce((s, a) => s + (Number(a.area) || 0), 0)
  const activeContracts = contractStore.contracts.filter(OPEN_CONTRACT)
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const expiringThisMonth = activeContracts.filter(c => String(c.endDate || '').slice(0, 7) === ym).length
  const projectCount = new Set(assets.map(a => a.projectName).filter(Boolean)).size
  const pct = (n, d) => d ? Math.min(100, Math.round(n / d * 100)) : 0
  return [
    { label: '招租资产', value: idleAssets.length, unit: '宗', pct: pct(idleAssets.length, assets.length), color: '#4C8DFF' },
    { label: '已租资产', value: rentedAssets.length, unit: '宗', pct: pct(rentedAssets.length, assets.length), color: '#4ade80' },
    { label: '已租面积', value: round1(leasedArea / 10000).toFixed(2), unit: '万㎡', pct: pct(leasedArea, totalAreaAll), color: '#c084fc' },
    { label: '项目总数', value: projectCount, unit: '个', pct: 100, color: '#facc15' },
    { label: '执行中合同', value: activeContracts.length, unit: '份', pct: pct(activeContracts.length, contractStore.contracts.length), color: '#fb923c' },
    { label: '本月到期合同', value: expiringThisMonth, unit: '份', pct: pct(expiringThisMonth, Math.max(1, activeContracts.length)), color: '#f87171' },
  ]
})

const leaseStats = computed(() => {
  const assets = assetStore.assets
  const allContracts = contractStore.contracts
  const activeContracts = allContracts.filter(OPEN_CONTRACT)
  const rented = assets.filter(a => RENTED.has(a.status)).length
  const rentRate = assets.length ? round1(rented / assets.length * 100) : 0
  // 近似：签约率 = 已挂合同资产数 / 已出租资产数（多份合同按去重计）
  const rentedAssetIds = new Set(assets.filter(a => RENTED.has(a.status)).map(a => a.id))
  const contractedAssetIds = new Set(activeContracts.map(c => c.assetId).filter(id => rentedAssetIds.has(id)))
  const signRate = rentedAssetIds.size ? round1(contractedAssetIds.size / rentedAssetIds.size * 100) : 0
  const totalReceivable = contractStore.feeRecords.reduce((s, f) => s + (Number(f.yearReceivable) || 0), 0)
  const totalActual = contractStore.feeRecords.reduce((s, f) => s + (Number(f.yearActual) || 0), 0)
  const collectRate = totalReceivable ? round1(totalActual / totalReceivable * 100) : 0
  const nearExpiry = activeContracts.filter(c => {
    const end = new Date(c.endDate)
    if (isNaN(end.getTime())) return false
    const days = (end - new Date()) / 86400000
    return days > 0 && days <= 90
  }).length
  const nearExpiryPct = activeContracts.length ? round1(nearExpiry / activeContracts.length * 100) : 0
  const arrearsContracts = allContracts.filter(c => (Number(c.arrears) || 0) > 0 || c.status === '欠缴').length
  const arrearsPct = allContracts.length ? round1(arrearsContracts / allContracts.length * 100) : 0
  return [
    { label: '出租率', value: `${rentRate}%`, pct: rentRate, color: '#4ade80' },
    { label: '合同签约率', value: `${signRate}%`, pct: signRate, color: '#4C8DFF' },
    { label: '租金收缴率', value: `${collectRate}%`, pct: collectRate, color: '#facc15' },
    { label: '临期合同占比', value: `${nearExpiryPct}%`, pct: nearExpiryPct, color: '#fb923c' },
    { label: '欠费合同占比', value: `${arrearsPct}%`, pct: arrearsPct, color: '#f87171' },
  ]
})

const assetList = computed(() => assetStore.assets.map(a => ({
  name: a.name,
  street: a.location || '',
  category: a.assetCategory || a.type || '—',
  area: Number(a.area) || 0,
  value: Number(a.bookValue) || 0,
  status: statusLabel(a.status),
  tenant: a.tenant || '',
})))

const filteredList = computed(() => {
  const list = assetList.value
  if (!listKeyword.value) return list
  const kw = listKeyword.value
  return list.filter(a => a.name.includes(kw) || a.street.includes(kw) || a.category.includes(kw))
})

const displayKpis = computed(() => {
  if (drillLevel.value === 0) {
    const assets = assetStore.assets
    const totalValue = assets.reduce((s, a) => s + (Number(a.bookValue) || 0), 0)
    const totalArea = assets.reduce((s, a) => s + (Number(a.area) || 0), 0)
    const rented = assets.filter(a => RENTED.has(a.status)).length
    const yearReceivable = contractStore.feeRecords.reduce((s, f) => s + (Number(f.yearReceivable) || 0), 0)
    const yearActual = contractStore.feeRecords.reduce((s, f) => s + (Number(f.yearActual) || 0), 0)
    const arrears = contractStore.feeRecords.reduce((s, f) => s + (Number(f.arrears) || 0), 0)
    const idleArea = assets.filter(a => IDLE.has(a.status)).reduce((s, a) => s + (Number(a.area) || 0), 0)
    return [
      { label: '资产总宗数', value: assets.length, unit: '宗', color: '#4C8DFF' },
      { label: '资产总价值', value: Math.round(totalValue).toLocaleString(), unit: '万元', color: '#4ade80' },
      { label: '资产总面积', value: round1(totalArea / 10000).toFixed(2), unit: '万㎡', color: '#c084fc' },
      { label: '出租资产', value: rented, unit: '宗', color: '#facc15' },
      { label: '本年应收', value: Math.round(yearReceivable).toLocaleString(), unit: '万元', color: '#fb923c' },
      { label: '本年实收', value: Math.round(yearActual).toLocaleString(), unit: '万元', color: '#f87171' },
      { label: '欠缴总额', value: round1(arrears).toFixed(1), unit: '万元', color: '#ff9f43' },
      { label: '闲置面积', value: round1(idleArea / 10000).toFixed(2), unit: '万㎡', color: '#a78bfa' },
    ]
  }
  if (drillLevel.value === 1 && currentCompany.value) {
    const co = currentCompany.value
    return [
      { label: '资产总宗数', value: co.totalAssets, unit: '宗', color: '#4C8DFF' },
      { label: '资产总价值', value: co.totalValue.toLocaleString(), unit: '万元', color: '#4ade80' },
      { label: '出租率', value: co.rentRate, unit: '%', color: '#facc15' },
      { label: '收缴率', value: co.collectionRate, unit: '%', color: '#fb923c' },
      { label: '预警风险', value: co.riskCount, unit: '项', color: '#f87171' },
      { label: '项目数', value: co.projects.length, unit: '个', color: '#c084fc' },
    ]
  }
  if (drillLevel.value === 2 && currentProject.value) {
    const p = currentProject.value
    const totalValue = p.assets.reduce((s, a) => s + a.value, 0)
    const totalRent = p.assets.reduce((s, a) => s + (a.rent || 0), 0)
    return [
      { label: '资产总数', value: p.total, unit: '宗', color: '#4C8DFF' },
      { label: '资产总价值', value: totalValue.toLocaleString(), unit: '万元', color: '#4ade80' },
      { label: '出租率', value: p.rentRate, unit: '%', color: '#facc15' },
      { label: '年租金收入', value: totalRent.toFixed(1), unit: '万元', color: '#fb923c' },
    ]
  }
  return []
})

const companyKpis = computed(() => {
  if (!currentCompany.value) return []
  const co = currentCompany.value
  return [
    { label: '资产总宗', value: co.totalAssets, unit: '宗', color: '#4C8DFF' },
    { label: '资产价值', value: co.totalValue.toLocaleString(), unit: '万元', color: '#4ade80' },
    { label: '出租率', value: co.rentRate, unit: '%', color: '#facc15' },
    { label: '收缴率', value: co.collectionRate, unit: '%', color: '#fb923c' },
  ]
})

const projectKpis = computed(() => {
  if (!currentProject.value) return []
  const p = currentProject.value
  const totalValue = p.assets.reduce((s, a) => s + a.value, 0)
  const totalRent = p.assets.reduce((s, a) => s + (a.rent || 0), 0)
  return [
    { label: '资产总数', value: p.total, unit: '宗', color: '#4C8DFF' },
    { label: '资产价值', value: totalValue.toLocaleString(), unit: '万元', color: '#4ade80' },
    { label: '出租率', value: p.rentRate, unit: '%', color: '#facc15' },
    { label: '年租金', value: totalRent.toFixed(1), unit: '万元', color: '#fb923c' },
  ]
})

const filteredProjectAssets = computed(() => {
  if (!currentProject.value) return []
  const assets = currentProject.value.assets
  if (!projectKeyword.value) return assets
  return assets.filter(a => a.name.includes(projectKeyword.value))
})

function selectCategory(c) {
  activeTab.value = 'list'
  listKeyword.value = c.name
}

function drillToCompany(co) {
  currentCompanyName.value = co.name
  currentProjectName.value = null
  drillLevel.value = 1
  activeTab.value = 'overview'
  nextTick(() => {
    initCompanyPieChart()
  })
}

function drillToProject(p) {
  currentProjectName.value = p.name
  drillLevel.value = 2
}

function drillUp(level) {
  if (level === 0) {
    drillLevel.value = 0
    currentCompanyName.value = null
    currentProjectName.value = null
  } else if (level === 1) {
    drillLevel.value = 1
    currentProjectName.value = null
  }
}

const rankChartRef = ref(null)
const revenueChartRef = ref(null)
const companyPieChartRef = ref(null)
const mortgageChartRef = ref(null)
const collectTypeChartRef = ref(null)
const collectMonthChartRef = ref(null)
let rankChart = null, revenueChart = null, companyPieChart = null, clockTimer = null
let mortgageChart = null, collectTypeChart = null, collectMonthChart = null

const darkAxis = {
  axisLine: { lineStyle: { color: '#E2E8F0' } },
  axisLabel: { color: '#606266', fontSize: 12 },
  splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
}

// 收益趋势：按 feeRecords.payments 实际发生年份汇总；无历史年份则为 0，不再编造系数
const revenueChartYears = computed(() => {
  const years = new Set()
  const y = new Date().getFullYear()
  years.add(String(y))
  contractStore.feeRecords.forEach(f => {
    (f.payments || []).forEach(p => {
      const d = new Date(p.date)
      if (!isNaN(d.getTime())) years.add(String(d.getFullYear()))
    })
  })
  return [...years].sort()
})
const revenueChartRecv = computed(() => {
  const agg = {}
  contractStore.feeRecords.forEach(f => {
    (f.payments || []).forEach(p => {
      const d = new Date(p.date)
      if (isNaN(d.getTime())) return
      const y = String(d.getFullYear())
      const planAmount = Number(p.planAmount ?? p.receivable ?? p.amount) || 0
      agg[y] = (agg[y] || 0) + planAmount
    })
  })
  // 无 planAmount 字段时，本年应收按 yearReceivable 汇总到当年
  const thisYear = String(new Date().getFullYear())
  if (!agg[thisYear]) {
    const total = contractStore.feeRecords.reduce((s, f) => s + (Number(f.yearReceivable) || 0), 0)
    if (total) agg[thisYear] = total
  }
  return revenueChartYears.value.map(y => round1(agg[y] || 0))
})
const revenueChartAct = computed(() => {
  const agg = {}
  contractStore.feeRecords.forEach(f => {
    (f.payments || []).forEach(p => {
      const d = new Date(p.date)
      if (isNaN(d.getTime())) return
      const y = String(d.getFullYear())
      agg[y] = (agg[y] || 0) + (Number(p.amount) || 0)
    })
  })
  return revenueChartYears.value.map(y => round1(agg[y] || 0))
})
const revenueChartRate = computed(() => {
  return revenueChartRecv.value.map((r, i) => r ? round1(revenueChartAct.value[i] / r * 100) : 0)
})

function initCharts() {
  if (rankChartRef.value && !rankChart) {
    rankChart = echarts.init(rankChartRef.value)
    // 排行图只取前 10，避免街道/地址条目过多时纵轴标签互相压叠；再反转为升序，使最大值落在顶部
    const sorted = [...streets.value].sort((a, b) => b.total - a.total).slice(0, 10).reverse()
    const trunc = (v) => (v && v.length > 6 ? v.slice(0, 6) + '…' : v)
    rankChart.setOption({
      grid: { left: 78, right: 34, top: 10, bottom: 20 },
      xAxis: { type: 'value', ...darkAxis },
      yAxis: {
        type: 'category', data: sorted.map(s => s.name), ...darkAxis, splitLine: { show: false },
        axisLabel: { color: '#606266', fontSize: 12, interval: 0, formatter: trunc },
      },
      series: [{
        type: 'bar', data: sorted.map(s => s.total), barWidth: 12,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#4C8DFF' }, { offset: 1, color: '#69c0ff' }]), borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#606266', fontSize: 12 },
      }],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    })
  }
  if (revenueChartRef.value && !revenueChart) {
    revenueChart = echarts.init(revenueChartRef.value)
    revenueChart.setOption({
      grid: { left: 50, right: 20, top: 30, bottom: 25 },
      legend: { textStyle: { color: '#606266', fontSize: 12 }, top: 0 },
      xAxis: { type: 'category', data: revenueChartYears.value, ...darkAxis },
      yAxis: { type: 'value', ...darkAxis },
      tooltip: { trigger: 'axis' },
      series: [
        { name: '应收', type: 'bar', barWidth: 14, data: revenueChartRecv.value, itemStyle: { color: '#4C8DFF', borderRadius: [4, 4, 0, 0] } },
        { name: '实收', type: 'bar', barWidth: 14, data: revenueChartAct.value, itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] } },
        { name: '收缴率', type: 'line', yAxisIndex: 0, data: revenueChartRate.value, smooth: true, lineStyle: { color: '#E8912A' }, itemStyle: { color: '#E8912A' } },
      ],
    })
  }
}

function initCompanyPieChart() {
  if (!companyPieChartRef.value) return
  if (companyPieChart) companyPieChart.dispose()
  companyPieChart = echarts.init(companyPieChartRef.value)
  const co = currentCompany.value
  companyPieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
    legend: { textStyle: { color: '#606266', fontSize: 12 }, bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
      label: { color: '#303133', fontSize: 12 },
      data: [
        { value: Math.round(co.totalAssets * co.rentedPct / 100), name: '出租中', itemStyle: { color: '#52c41a' } },
        { value: Math.round(co.totalAssets * co.idlePct / 100), name: '闲置中', itemStyle: { color: '#E8912A' } },
        { value: co.totalAssets - Math.round(co.totalAssets * co.rentedPct / 100) - Math.round(co.totalAssets * co.idlePct / 100), name: '不可租', itemStyle: { color: '#4C8DFF' } },
      ],
    }],
  })
}

function initGisCharts() {
  if (mortgageChartRef.value && !mortgageChart) {
    mortgageChart = echarts.init(mortgageChartRef.value)
    mortgageChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 万元 ({d}%)' },
      legend: { textStyle: { color: '#606266', fontSize: 12 }, bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['52%', '74%'], center: ['50%', '42%'],
        label: { show: true, position: 'center', formatter: () => `抵押总金额\n${mortgage.value.totalValue.toLocaleString()} 万元`, color: '#303133', fontSize: 13, lineHeight: 20 },
        emphasis: { label: { show: true } },
        data: (mortgage.value.byCompany.length ? mortgage.value.byCompany : [{ name: '暂无', value: 0 }]).map((d, i) => ({
          value: d.value, name: d.name,
          itemStyle: { color: ['#4C8DFF', '#E8912A', '#52c41a', '#fa8c16', '#2F54EB', '#13c2c2'][i % 6] },
        })),
      }],
    })
  }
  if (collectTypeChartRef.value && !collectTypeChart) {
    collectTypeChart = echarts.init(collectTypeChartRef.value)
    collectTypeChart.setOption({
      grid: { left: 45, right: 50, top: 26, bottom: 22 },
      legend: { textStyle: { color: '#606266', fontSize: 12 }, top: 0, itemWidth: 10, itemHeight: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: collectTypeData.value.map(d => d.name), ...darkAxis, axisLabel: { color: '#606266', fontSize: 12, interval: 0 } },
      yAxis: [
        { type: 'value', name: '万元', nameTextStyle: { color: '#909399', fontSize: 12 }, ...darkAxis },
        { type: 'value', name: '㎡', nameTextStyle: { color: '#909399', fontSize: 12 }, ...darkAxis, splitLine: { show: false } },
      ],
      series: [
        { name: '收缴金额', type: 'bar', barWidth: 10, data: collectTypeData.value.map(d => d.amount), itemStyle: { color: '#4C8DFF', borderRadius: [3, 3, 0, 0] } },
        { name: '收缴面积', type: 'bar', barWidth: 10, yAxisIndex: 1, data: collectTypeData.value.map(d => d.area), itemStyle: { color: '#722ed1', borderRadius: [3, 3, 0, 0] } },
      ],
    })
  }
  if (collectMonthChartRef.value && !collectMonthChart) {
    collectMonthChart = echarts.init(collectMonthChartRef.value)
    collectMonthChart.setOption({
      grid: { left: 40, right: 15, top: 26, bottom: 22 },
      legend: { textStyle: { color: '#606266', fontSize: 12 }, top: 0, itemWidth: 10, itemHeight: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: collectMonthData.value.months, ...darkAxis, axisLabel: { color: '#606266', fontSize: 12, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [
        { name: '应收', type: 'bar', barWidth: 7, data: collectMonthData.value.receivable, itemStyle: { color: '#4C8DFF', borderRadius: [3, 3, 0, 0] } },
        { name: '实收', type: 'bar', barWidth: 7, data: collectMonthData.value.received, itemStyle: { color: '#52c41a', borderRadius: [3, 3, 0, 0] } },
      ],
    })
  }
}

function disposeCharts() {
  rankChart?.dispose(); rankChart = null
  revenueChart?.dispose(); revenueChart = null
  companyPieChart?.dispose(); companyPieChart = null
  mortgageChart?.dispose(); mortgageChart = null
  collectTypeChart?.dispose(); collectTypeChart = null
  collectMonthChart?.dispose(); collectMonthChart = null
}

function handleMapMove(e) {
  tooltipPos.value = { x: e.clientX + 16, y: e.clientY + 12 }
}

function loadAmapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) { resolve(); return }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

async function initGisAmap() {
  if (gisAmapInstance) return
  await loadAmapScript()
  if (!gisAmapContainerRef.value) return
  gisAmapInstance = new AMap.Map(gisAmapContainerRef.value, {
    zoom: 11,
    center: [119.53, 25.90],
    mapStyle: 'amap://styles/normal',
    viewMode: '2D',
  })
  loadGisDistrictBoundary()
  addGisMarkers()
}

function loadGisDistrictBoundary() {
  if (!gisAmapInstance) return
  AMap.plugin('AMap.DistrictSearch', () => {
    const ds = new AMap.DistrictSearch({ subdistrict: 1, extensions: 'all', level: 'district' })
    ds.search('长乐区', (status, result) => {
      if (status !== 'complete' || !result.district) return
      const district = result.district
      const subList = district.districtList || []
      subList.forEach(sub => {
        const polyline = new AMap.Polygon({
          path: sub.boundaries,
          fillColor: '#4C8DFF',
          fillOpacity: 0.08,
          strokeColor: 'rgba(77,208,255,0.35)',
          strokeWeight: 1,
        })
        gisAmapPolygons.push(polyline)
        gisAmapInstance.add(polyline)
      })
      if (district.boundaries) {
        district.boundaries.forEach(boundary => {
          const outer = new AMap.Polygon({
            path: boundary,
            fillColor: 'transparent',
            strokeColor: '#f5222d',
            strokeWeight: 2,
            strokeStyle: 'dashed',
          })
          gisAmapPolygons.push(outer)
          gisAmapInstance.add(outer)
        })
      }
    })
  })
}

function addGisMarkers() {
  if (!gisAmapInstance) return
  const markers = gisMarkers.value
  markers.forEach(m => {
    const isCompany = gisMapMode.value === 'company'
    const color = isCompany ? '#4C8DFF' : '#52c41a'
    const labelContent = `
      <div style="position:relative;text-align:center;cursor:pointer;">
        <div style="width:12px;height:12px;border-radius:50%;background:${color};margin:0 auto;box-shadow:0 0 8px ${color};"></div>
        <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.75);color:#fff;padding:2px 8px;border-radius:3px;font-size:12px;">${m.name}</div>
      </div>`
    const marker = new AMap.Marker({
      position: [m.lng, m.lat],
      content: labelContent,
      offset: new AMap.Pixel(-6, -6),
    })
    gisAmapMarkers.push(marker)
    gisAmapInstance.add(marker)
  })
}

function clearGisAmapOverlays() {
  gisAmapPolygons.forEach(p => gisAmapInstance?.remove(p))
  gisAmapMarkers.forEach(m => gisAmapInstance?.remove(m))
  gisAmapLabels.forEach(l => gisAmapInstance?.remove(l))
  gisAmapPolygons = []
  gisAmapMarkers = []
  gisAmapLabels = []
}

watch(activeTab, async () => {
  await nextTick()
  initCharts()
  if (activeTab.value === 'gis') {
    initGisCharts()
    initGisAmap()
  }
  rankChart?.resize(); revenueChart?.resize()
  mortgageChart?.resize(); collectTypeChart?.resize(); collectMonthChart?.resize()
})

watch(drillLevel, async () => {
  await nextTick()
  if (drillLevel.value === 1) {
    initCompanyPieChart()
  }
})

onMounted(() => {
  const tick = () => { clock.value = new Date().toLocaleString('zh-CN', { hour12: false }) }
  tick()
  clockTimer = setInterval(tick, 1000)
  document.addEventListener('mousemove', handleMapMove)
  nextTick(initCharts)
  window.addEventListener('resize', resizeAll)
})

function resizeAll() {
  rankChart?.resize(); revenueChart?.resize(); companyPieChart?.resize()
  mortgageChart?.resize(); collectTypeChart?.resize(); collectMonthChart?.resize()
}

onBeforeUnmount(() => {
  clearInterval(clockTimer)
  document.removeEventListener('mousemove', handleMapMove)
  window.removeEventListener('resize', resizeAll)
  disposeCharts()
  gisAmapInstance?.destroy()
  gisAmapInstance = null
})
</script>

<style scoped>
.bigscreen {
  height: 100%;
  overflow: hidden;
  background: var(--bg-page);
  color: var(--t-main);
}
.bigscreen:fullscreen {
  height: 100vh;
  padding: 16px 24px;
  overflow: hidden;
}
.bs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: none;
}
.bs-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(90deg, var(--c-primary), var(--c-primary-dark), var(--c-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.bs-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.bc-item {
  color: var(--t-sub);
  cursor: pointer;
  transition: color 0.2s;
}
.bc-item:hover, .bc-item.active {
  color: var(--c-primary);
}
.bc-sep {
  color: var(--t-weak);
}
.bs-time {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: var(--c-primary-light);
  border: 1px solid var(--bd);
  border-radius: 20px;
  color: var(--c-primary);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}
.bs-time-text {
  color: var(--c-primary);
}
.bs-header-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bs-fullscreen-btn {
  background: var(--c-primary-light);
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.bs-fullscreen-btn:hover {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}
.bs-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex: none;
}
.bs-kpi {
  background: var(--bg-card);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 12px 16px;
  text-align: center;
  box-shadow: var(--shadow);
}
.bs-kpi-value {
  font-family: var(--font-num);
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}
.bs-kpi-unit {
  font-size: 12px;
  font-weight: normal;
  margin-left: 4px;
  color: var(--t-weak);
}
.bs-kpi-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}
.bs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  grid-auto-rows: minmax(200px, auto);
}
.bs-panel {
  background: var(--bg-card);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 12px 16px;
  box-shadow: var(--shadow);
  min-height: 0;
}
.bs-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--t-main);
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid var(--c-primary);
  display: flex;
  align-items: center;
}
.cat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.cat-card {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cat-card:hover {
  border-color: var(--c-primary);
}
.cat-name {
  font-size: 13px;
  color: var(--t-main);
  margin-bottom: 6px;
}
.cat-nums {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: var(--t-weak);
}
.cat-nums b {
  color: var(--t-main);
  font-family: var(--font-num);
}
.bs-chart {
  width: 100%;
  height: clamp(180px, 24vh, 260px);
}
.stat-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 4px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.stat-label {
  width: 100px;
  font-size: 12px;
  color: var(--t-sub);
}
.stat-bar {
  flex: 1;
  height: 8px;
  background: var(--bd);
  border-radius: 4px;
  overflow: hidden;
}
.stat-fill {
  height: 100%;
  border-radius: 4px;
}
.stat-val {
  width: 60px;
  text-align: right;
  font-family: var(--font-num);
  font-size: 13px;
  font-weight: 600;
  color: var(--t-main);
  font-variant-numeric: tabular-nums;
}
.bs-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.bs-tabs :deep(.el-tabs__header) {
  flex: none;
  margin-bottom: 12px;
}
.bs-tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
.bs-tabs :deep(.el-tabs__item) {
  color: var(--t-sub);
  font-size: 15px;
}
.bs-tabs :deep(.el-tabs__item.is-active) {
  color: var(--c-primary);
}
.bs-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: var(--bd);
}
.bs-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--c-primary);
}
.dark-table :deep(.el-table) {
  background: transparent;
}
.dark-table :deep(.el-table tr),
.dark-table :deep(.el-table th.el-table__cell) {
  background: transparent;
  color: var(--t-sub);
}
.dark-table :deep(.el-table td.el-table__cell),
.dark-table :deep(.el-table th.el-table__cell.is-leaf) {
  border-color: var(--bd-split);
}
.dark-table :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: var(--bg-th);
}
.dark-table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: var(--c-primary-light) !important;
}
.dark-table :deep(.el-table__inner-wrapper::before) {
  background-color: var(--bd-split);
}
.dark-table :deep(.el-table__empty-block) {
  background: transparent;
}

.company-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.company-card {
  background: var(--bg-card);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
  box-shadow: var(--shadow);
}
.company-card:hover {
  border-color: var(--c-primary);
  transform: translateY(-2px);
}
.co-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.co-icon {
  font-size: 28px;
}
.co-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--t-main);
}
.co-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.co-metric {
  text-align: center;
}
.co-metric-label {
  font-size: 12px;
  color: var(--t-weak);
  display: block;
}
.co-metric-value {
  font-family: var(--font-num);
  font-size: 18px;
  font-weight: 700;
  color: var(--t-main);
  font-variant-numeric: tabular-nums;
}
.co-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.co-bar-label {
  width: 50px;
  font-size: 12px;
  color: var(--t-weak);
}
.co-bar {
  flex: 1;
  height: 6px;
  background: var(--bd);
  border-radius: 3px;
  overflow: hidden;
}
.co-bar-fill {
  height: 100%;
  border-radius: 3px;
}
.co-bar-pct {
  width: 40px;
  text-align: right;
  font-family: var(--font-num);
  font-size: 12px;
  color: var(--t-sub);
  font-variant-numeric: tabular-nums;
}
.co-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--bd-split);
}
.co-risk {
  font-size: 12px;
  color: var(--c-danger);
  display: flex;
  align-items: center;
  gap: 4px;
}
.risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-danger);
  animation: blink 1.5s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.co-enter {
  font-size: 12px;
  color: var(--c-primary);
}

.drill-content {
  animation: fadeIn 0.3s ease;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.drill-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: none;
  background: var(--bg-card);
  border: 1px solid var(--bd);
  border-radius: var(--r-md);
  padding: 16px 20px;
  box-shadow: var(--shadow);
}
.dh-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dh-icon {
  font-size: 36px;
}
.dh-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--t-main);
}
.dh-sub {
  font-size: 13px;
  color: var(--t-weak);
  margin-top: 2px;
}
.dh-kpis {
  display: flex;
  gap: 24px;
}
.dh-kpi {
  text-align: center;
}
.dh-kpi-value {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.dh-kpi-unit {
  font-size: 12px;
  font-weight: normal;
  margin-left: 3px;
  color: var(--t-weak);
}
.dh-kpi-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 2px;
}
.drill-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  grid-auto-rows: minmax(200px, auto);
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.risk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-th);
  border-radius: var(--r-sm);
  font-size: 12px;
}
.risk-level {
  padding: 2px 6px;
  border-radius: var(--r-sm);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.risk-high { background: rgba(217, 48, 38, 0.1); color: var(--c-danger); }
.risk-mid { background: rgba(232, 145, 42, 0.12); color: var(--c-warning); }
.risk-low { background: rgba(22, 104, 220, 0.1); color: var(--c-primary); }
.risk-text {
  flex: 1;
  color: var(--t-main);
}
.risk-project {
  color: var(--t-weak);
  font-size: 12px;
  flex-shrink: 0;
}
.risk-empty {
  text-align: center;
  color: var(--t-weak);
  padding: 20px;
  font-size: 13px;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.project-card {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.project-card:hover {
  border-color: var(--c-primary);
}
.pc-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--t-main);
  margin-bottom: 6px;
}
.pc-nums {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--t-weak);
  margin-bottom: 4px;
}
.pc-rate {
  font-family: var(--font-num);
  font-size: 12px;
  color: var(--c-primary);
}

.cat-figs {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed var(--bd);
}
.gis-board {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr) 340px;
  gap: 12px;
  align-items: stretch;
}
.gis-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.gis-center {
  display: flex;
  flex-direction: column;
}
.gis-center > .bs-panel {
  min-height: 0;
}
.owner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.owner-block {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 10px 12px;
}
.owner-head {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
}
.owner-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--t-sub);
  line-height: 1.9;
}
.owner-row b {
  color: var(--t-main);
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
}
.mortgage-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mortgage-donut {
  width: 150px;
  height: 150px;
  flex: none;
}
.mortgage-nums {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mn-item {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mn-label {
  font-size: 12px;
  color: var(--t-weak);
}
.mn-value {
  font-family: var(--font-num);
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.mn-value i {
  font-style: normal;
  font-size: 12px;
  font-weight: normal;
  color: var(--t-weak);
  margin-left: 3px;
}
.gis-sub-title {
  font-size: 12px;
  color: var(--t-sub);
  margin: 4px 0 2px;
}
.gis-chart-sm {
  height: 150px;
}
.gis-map-panel {
  flex: 2 1 auto;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.gis-map-panel:fullscreen {
  background: var(--bg-card);
  overflow: auto;
}
.gis-map-ops {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.gis-switch-btn {
  background: var(--c-primary-light);
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.gis-switch-btn:hover {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}
.gis-amap-container {
  flex: 1 1 auto;
  width: 100%;
  min-height: 340px;
}
.collect-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cov-item {
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 10px 8px;
  text-align: center;
}
.cov-value {
  font-family: var(--font-num);
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cov-value i {
  font-style: normal;
  font-size: 12px;
  font-weight: normal;
  color: var(--t-weak);
  margin-left: 3px;
}
.cov-label {
  font-size: 12px;
  color: var(--t-weak);
  margin-top: 4px;
}
.rank-badge {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  text-align: center;
  font-family: var(--font-num);
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: var(--t-weak);
}
.rb-1 { background: linear-gradient(135deg, #f5a623, #ff7a45); }
.rb-2 { background: linear-gradient(135deg, #a0a6b0, #6b7280); }
.rb-3 { background: linear-gradient(135deg, #cd7f32, #a0522d); }
.lease-circles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.lease-circle {
  position: relative;
  text-align: center;
}
.lc-svg {
  width: 84px;
  height: 84px;
}
.lc-center {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.lc-center b {
  font-family: var(--font-num);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.lc-center span {
  font-size: 12px;
  color: var(--t-weak);
}
.lc-label {
  font-size: 12px;
  color: var(--t-sub);
  margin-top: 2px;
}
.idle-rate {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--bd-split);
}
.ir-label {
  font-size: 12px;
  color: var(--t-sub);
  flex: none;
}
.ir-value {
  font-family: var(--font-num);
  font-size: 14px;
  font-weight: 700;
  color: var(--c-warning);
  flex: none;
}
</style>
