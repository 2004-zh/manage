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
                    <span style="color:#4ade80">出租 <b>{{ c.rented }}</b></span>
                    <span style="color:#facc15">闲置 <b>{{ c.idle }}</b></span>
                    <span style="color:#60a5fa">占用 <b>{{ c.occupied }}</b></span>
                  </div>
                  <div class="cat-nums cat-figs">
                    <span>资产价值(亿) <b style="color:#1890ff">{{ c.valueYi }}</b></span>
                    <span>资产数量(个) <b style="color:#c084fc">{{ c.unitCount }}</b></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="bs-panel">
              <div class="bs-panel-title">资产数量排行（街道）</div>
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
                      <span class="mn-value" style="color:#facc15">{{ mortgage.totalValue.toLocaleString() }}<i>万元</i></span>
                    </div>
                    <div class="mn-item">
                      <span class="mn-label">抵押面积</span>
                      <span class="mn-value" style="color:#1890ff">{{ mortgage.totalArea.toLocaleString() }}<i>㎡</i></span>
                    </div>
                    <div class="mn-item">
                      <span class="mn-label">抵押率</span>
                      <span class="mn-value" style="color:#fb923c">{{ mortgage.rate }}<i>%</i></span>
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
                      <span style="color:#1890ff">{{ row.income.toLocaleString() }} 万</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="bs-panel">
                <div class="bs-panel-title">租赁情况</div>
                <div class="lease-circles">
                  <div class="lease-circle" v-for="l in leaseCircles" :key="l.label">
                    <svg viewBox="0 0 90 90" class="lc-svg">
                      <circle cx="45" cy="45" r="38" fill="none" stroke="#e4e7ed" stroke-width="6" />
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
                  <span style="color:#4ade80">出租{{ p.rented }}</span>
                  <span style="color:#facc15">闲置{{ p.idle }}</span>
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

        <div class="bs-panel" style="margin-top:12px">
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

const activeTab = ref('overview')
const hoverStreet = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })
const listKeyword = ref('')
const isPageFullscreen = ref(false)
const bigscreenRef = ref(null)
const projectKeyword = ref('')
const clock = ref('')
const drillLevel = ref(0)
const currentCompany = ref(null)
const currentProject = ref(null)

const companies = ref([
  {
    name: '城投集团',
    subtitle: '城市建设与投资运营',
    totalAssets: 98,
    totalValue: 2860,
    rentRate: 72.4,
    collectionRate: 85.2,
    rentedPct: 65.3,
    idlePct: 22.4,
    unrentablePct: 12.3,
    riskCount: 3,
    risks: [
      { level: 'high', levelText: '高', text: '航城厂房2# 闲置超180天', project: '航城产业园' },
      { level: 'mid', levelText: '中', text: '城关商铺A-05 合同到期未续签', project: '城关商业区' },
      { level: 'low', levelText: '低', text: '滨江商铺B-07 租金逾期30天', project: '滨江商业带' },
    ],
    collectionRank: [
      { project: '城关商业区', receivable: 320, collected: 298, rate: 93.1 },
      { project: '航城产业园', receivable: 480, collected: 396, rate: 82.5 },
      { project: '滨江商业带', receivable: 180, collected: 162, rate: 90.0 },
      { project: '城西停车场', receivable: 120, collected: 96, rate: 80.0 },
      { project: '农贸市场', receivable: 86, collected: 78, rate: 90.7 },
    ],
    projects: [
      { name: '城关商业区', location: '吴航街道', total: 28, rented: 22, idle: 4, rentRate: 78.6, assets: [
        { name: '城关商铺A-01', category: '房产类', area: 320, value: 180, status: '出租', tenant: '福州长乐融辉贸易有限公司', rent: 18 },
        { name: '城关商铺A-05', category: '房产类', area: 280, value: 160, status: '闲置', tenant: '', rent: 0 },
        { name: '农贸市场1号摊位', category: '农贸市场', area: 45, value: 12, status: '出租', tenant: '陈某', rent: 2.4 },
        { name: '公交车辆（闽A·D8217）', category: '运输设备', area: 0, value: 65, status: '占用', tenant: '', rent: 0 },
      ]},
      { name: '航城产业园', location: '航城街道', total: 32, rented: 22, idle: 6, rentRate: 68.8, assets: [
        { name: '航城厂房1#', category: '经营类房屋建筑', area: 2600, value: 780, status: '出租', tenant: '福建省长乐市鸿运纺织有限公司', rent: 45 },
        { name: '航城厂房2#', category: '经营类房屋建筑', area: 2200, value: 660, status: '闲置', tenant: '', rent: 0 },
        { name: '滨江商铺B-07', category: '房产类', area: 260, value: 150, status: '出租', tenant: '林某', rent: 12 },
      ]},
      { name: '滨江商业带', location: '航城街道', total: 18, rented: 14, idle: 3, rentRate: 77.8, assets: [] },
      { name: '城西停车场', location: '首占镇', total: 12, rented: 8, idle: 3, rentRate: 66.7, assets: [
        { name: '城西停车场', category: '土地类', area: 4200, value: 420, status: '出租', tenant: '福州某物业管理有限公司', rent: 15 },
      ]},
      { name: '农贸市场', location: '吴航街道', total: 8, rented: 7, idle: 1, rentRate: 87.5, assets: [] },
    ],
  },
  {
    name: '产投集团',
    subtitle: '产业投资与园区运营',
    totalAssets: 62,
    totalValue: 1980,
    rentRate: 68.5,
    collectionRate: 79.8,
    rentedPct: 58.1,
    idlePct: 28.2,
    unrentablePct: 13.7,
    riskCount: 2,
    risks: [
      { level: 'high', levelText: '高', text: '松下冷链仓库 闲置超365天', project: '松下物流园' },
      { level: 'mid', levelText: '中', text: '金峰厂房A-02 承租方经营困难', project: '金峰工业区' },
    ],
    collectionRank: [
      { project: '金峰工业区', receivable: 380, collected: 312, rate: 82.1 },
      { project: '松下物流园', receivable: 260, collected: 195, rate: 75.0 },
      { project: '漳港科技园', receivable: 220, collected: 198, rate: 90.0 },
    ],
    projects: [
      { name: '金峰工业区', location: '金峰镇', total: 22, rented: 14, idle: 5, rentRate: 63.6, assets: [
        { name: '工业区厂房A-02', category: '经营类房屋建筑', area: 3100, value: 930, status: '出租', tenant: '福建某制造有限公司', rent: 52 },
      ]},
      { name: '松下物流园', location: '松下镇', total: 18, rented: 8, idle: 8, rentRate: 44.4, assets: [
        { name: '松下镇冷链仓库', category: '经营类房屋建筑', area: 1800, value: 540, status: '闲置', tenant: '', rent: 0 },
      ]},
      { name: '漳港科技园', location: '漳港街道', total: 22, rented: 16, idle: 4, rentRate: 72.7, assets: [
        { name: '漳港办公楼2层', category: '房产类', area: 850, value: 320, status: '出租', tenant: '长乐区鑫源投资有限公司', rent: 22 },
      ]},
    ],
  },
  {
    name: '水投集团',
    subtitle: '水务与环境治理',
    totalAssets: 45,
    totalValue: 1120,
    rentRate: 60.0,
    collectionRate: 82.5,
    rentedPct: 53.3,
    idlePct: 31.1,
    unrentablePct: 15.6,
    riskCount: 1,
    risks: [
      { level: 'mid', levelText: '中', text: '文武砂鱼塘 租约即将到期', project: '文武砂养殖基地' },
    ],
    collectionRank: [
      { project: '文武砂养殖基地', receivable: 180, collected: 153, rate: 85.0 },
      { project: '营前水务站', receivable: 120, collected: 102, rate: 85.0 },
    ],
    projects: [
      { name: '文武砂养殖基地', location: '文武砂街道', total: 22, rented: 13, idle: 6, rentRate: 59.1, assets: [
        { name: '文武砂鱼塘养殖基地', category: '土地类', area: 8600, value: 210, status: '出租', tenant: '某水产养殖合作社', rent: 8 },
      ]},
      { name: '营前水务站', location: '营前街道', total: 23, rented: 12, idle: 8, rentRate: 52.2, assets: [
        { name: '营前仓库B-03', category: '房产类', area: 1500, value: 380, status: '占用', tenant: '', rent: 0 },
      ]},
    ],
  },
  {
    name: '领航公司',
    subtitle: '综合资产管理',
    totalAssets: 28,
    totalValue: 739,
    rentRate: 57.1,
    collectionRate: 76.3,
    rentedPct: 46.4,
    idlePct: 35.7,
    unrentablePct: 17.9,
    riskCount: 0,
    risks: [],
    collectionRank: [
      { project: '首占综合区', receivable: 160, collected: 128, rate: 80.0 },
      { project: '营前仓储区', receivable: 100, collected: 72, rate: 72.0 },
    ],
    projects: [
      { name: '首占综合区', location: '首占镇', total: 16, rented: 8, idle: 5, rentRate: 50.0, assets: [
        { name: '首占商铺C-08', category: '房产类', area: 210, value: 120, status: '出租', tenant: '长乐吴航街道陈氏食品店', rent: 8 },
      ]},
      { name: '营前仓储区', location: '营前街道', total: 12, rented: 5, idle: 5, rentRate: 41.7, assets: [] },
    ],
  },
])

const streets = [
  { name: '吴航街道', x: 320, y: 180, lng: 119.523, lat: 25.962, total: 52, value: 1560, area: 42000, rented: 41, idle: 6, rentRate: 78.8 },
  { name: '航城街道', x: 470, y: 150, lng: 119.536, lat: 25.972, total: 46, value: 1380, area: 38500, rented: 36, idle: 5, rentRate: 78.3 },
  { name: '营前街道', x: 260, y: 300, lng: 119.508, lat: 25.920, total: 31, value: 820, area: 26000, rented: 19, idle: 8, rentRate: 61.3 },
  { name: '首占镇', x: 420, y: 310, lng: 119.525, lat: 25.905, total: 28, value: 760, area: 21500, rented: 18, idle: 7, rentRate: 64.3 },
  { name: '漳港街道', x: 620, y: 260, lng: 119.572, lat: 25.890, total: 26, value: 690, area: 18800, rented: 17, idle: 6, rentRate: 65.4 },
  { name: '文武砂街道', x: 540, y: 420, lng: 119.555, lat: 25.845, total: 22, value: 610, area: 16400, rented: 13, idle: 6, rentRate: 59.1 },
  { name: '松下镇', x: 330, y: 450, lng: 119.520, lat: 25.830, total: 16, value: 480, area: 12200, rented: 8, idle: 6, rentRate: 50.0 },
  { name: '金峰镇', x: 640, y: 400, lng: 119.490, lat: 25.860, total: 12, value: 399, area: 10600, rented: 4, idle: 6, rentRate: 33.3 },
]

const categories = ref([
  { name: '房产类', total: 86, rented: 62, idle: 14, occupied: 10, valueYi: 18.6, unitCount: 92 },
  { name: '土地类', total: 45, rented: 30, idle: 12, occupied: 3, valueYi: 12.4, unitCount: 45 },
  { name: '经营类房屋建筑', total: 38, rented: 31, idle: 5, occupied: 2, valueYi: 15.2, unitCount: 38 },
  { name: '农贸市场', total: 12, rented: 11, idle: 1, occupied: 0, valueYi: 1.8, unitCount: 156 },
  { name: '运输设备', total: 18, rented: 4, idle: 2, occupied: 12, valueYi: 0.9, unitCount: 26 },
  { name: '矿产资源类', total: 6, rented: 4, idle: 2, occupied: 0, valueYi: 3.6, unitCount: 6 },
  { name: '公共设备类', total: 14, rented: 2, idle: 0, occupied: 12, valueYi: 1.2, unitCount: 34 },
  { name: '长期股权投资', total: 4, rented: 0, idle: 0, occupied: 4, valueYi: 5.8, unitCount: 4 },
  { name: '经营权类资产', total: 12, rented: 10, idle: 1, occupied: 1, valueYi: 2.4, unitCount: 12 },
])

const gisMapMode = ref('district')
const gisMapPanelRef = ref(null)
const gisAmapContainerRef = ref(null)
const AMAP_KEY = 'd9902108686d1a72769e105fb5f8343e'
let gisAmapInstance = null
let gisAmapPolygons = []
let gisAmapMarkers = []
let gisAmapLabels = []

const companyMarkers = [
  { name: '城投集团', lng: 119.525, lat: 25.960, total: 98, value: 28600, area: 62000, rented: 71, idle: 22, rentRate: 72.4 },
  { name: '产投集团', lng: 119.548, lat: 25.940, total: 62, value: 19800, area: 48000, rented: 43, idle: 17, rentRate: 68.5 },
  { name: '水投集团', lng: 119.510, lat: 25.900, total: 45, value: 11200, area: 38600, rented: 27, idle: 14, rentRate: 60.0 },
  { name: '领航公司', lng: 119.560, lat: 25.870, total: 28, value: 7390, area: 17400, rented: 16, idle: 10, rentRate: 57.1 },
]

const gisMarkers = computed(() => (gisMapMode.value === 'district' ? streets : companyMarkers))

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

const ownership = [
  { label: '有证', count: 186, area: 152000, value: 52800, color: '#4ade80' },
  { label: '无证', count: 47, area: 34000, value: 14190, color: '#f87171' },
]

const mortgage = {
  totalValue: 21600,
  totalArea: 46800,
  rate: 32.3,
  byCompany: [
    { name: '城投集团', value: 28 },
    { name: '产投集团', value: 20 },
    { name: '水投集团', value: 12 },
    { name: '领航公司', value: 8 },
  ],
}

const collectTypeData = [
  { name: '房产类', amount: 420, area: 32000 },
  { name: '土地类', amount: 268, area: 45600 },
  { name: '经营类房屋', amount: 356, area: 28400 },
  { name: '农贸市场', amount: 86, area: 4200 },
  { name: '经营权类', amount: 116, area: 6800 },
]

const collectMonthData = {
  months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  receivable: [102, 96, 118, 108, 124, 116, 132, 128, 110, 0, 0, 0],
  received: [92, 88, 104, 99, 112, 101, 118, 106, 96, 0, 0, 0],
}

const collectOverview = [
  { label: '本月应收', value: '128.6', unit: '万元', color: '#1890ff' },
  { label: '本月实收', value: '106.2', unit: '万元', color: '#4ade80' },
  { label: '本月欠缴', value: '22.4', unit: '万元', color: '#f87171' },
  { label: '上月收缴率', value: '84.6', unit: '%', color: '#facc15' },
  { label: '本年欠缴率', value: '18.3', unit: '%', color: '#fb923c' },
  { label: '本年欠缴', value: '234.2', unit: '万元', color: '#c084fc' },
]

const collectionRankRows = [
  { company: '城投集团', rentRate: 72.4, assetCount: 98, income: 1286 },
  { company: '产投集团', rentRate: 68.5, assetCount: 62, income: 964 },
  { company: '水投集团', rentRate: 60.0, assetCount: 45, income: 618 },
  { company: '领航公司', rentRate: 57.1, assetCount: 28, income: 402 },
]

const ringCirc = 2 * Math.PI * 38
const idleRate = 22.4

const leaseCircles = [
  { label: '招租资产', value: 168, unit: '宗', pct: 72, color: '#1890ff' },
  { label: '已租资产', value: 156, unit: '宗', pct: 67, color: '#4ade80' },
  { label: '已租面积', value: '12.4', unit: '万㎡', pct: 66, color: '#c084fc' },
  { label: '项目总数', value: 12, unit: '个', pct: 100, color: '#facc15' },
  { label: '执行中合同', value: 96, unit: '份', pct: 82, color: '#fb923c' },
  { label: '本月到期合同', value: 7, unit: '份', pct: 8, color: '#f87171' },
]

const leaseStats = [
  { label: '出租率', value: '67.0%', pct: 67, color: '#4ade80' },
  { label: '合同签约率', value: '92.3%', pct: 92.3, color: '#1890ff' },
  { label: '租金收缴率', value: '81.7%', pct: 81.7, color: '#facc15' },
  { label: '临期合同占比', value: '8.6%', pct: 8.6, color: '#fb923c' },
  { label: '欠费合同占比', value: '14.2%', pct: 14.2, color: '#f87171' },
]

const assetList = [
  { name: '城关商铺A-01', street: '吴航街道', category: '房产类', area: 320, value: 180, status: '出租', tenant: '福州长乐融辉贸易有限公司' },
  { name: '城关商铺A-05', street: '吴航街道', category: '房产类', area: 280, value: 160, status: '闲置', tenant: '' },
  { name: '航城厂房1#', street: '航城街道', category: '经营类房屋建筑', area: 2600, value: 780, status: '出租', tenant: '福建省长乐市鸿运纺织有限公司' },
  { name: '航城厂房2#', street: '航城街道', category: '经营类房屋建筑', area: 2200, value: 660, status: '闲置', tenant: '' },
  { name: '漳港办公楼2层', street: '漳港街道', category: '房产类', area: 850, value: 320, status: '出租', tenant: '长乐区鑫源投资有限公司' },
  { name: '城西停车场', street: '首占镇', category: '土地类', area: 4200, value: 420, status: '出租', tenant: '福州某物业管理有限公司' },
  { name: '农贸市场1号摊位', street: '吴航街道', category: '农贸市场', area: 45, value: 12, status: '出租', tenant: '陈某' },
  { name: '工业区厂房A-02', street: '金峰镇', category: '经营类房屋建筑', area: 3100, value: 930, status: '出租', tenant: '福建某制造有限公司' },
  { name: '营前仓库B-03', street: '营前街道', category: '房产类', area: 1500, value: 380, status: '占用', tenant: '' },
  { name: '滨江商铺B-07', street: '航城街道', category: '房产类', area: 260, value: 150, status: '出租', tenant: '林某' },
  { name: '文武砂鱼塘养殖基地', street: '文武砂街道', category: '土地类', area: 8600, value: 210, status: '出租', tenant: '某水产养殖合作社' },
  { name: '松下镇冷链仓库', street: '松下镇', category: '经营类房屋建筑', area: 1800, value: 540, status: '闲置', tenant: '' },
  { name: '公交车辆（闽A·D8217）', street: '吴航街道', category: '运输设备', area: 0, value: 65, status: '占用', tenant: '' },
  { name: '首占商铺C-08', street: '首占镇', category: '房产类', area: 210, value: 120, status: '出租', tenant: '长乐吴航街道陈氏食品店' },
]

const filteredList = computed(() => {
  if (!listKeyword.value) return assetList
  const kw = listKeyword.value
  return assetList.filter(a => a.name.includes(kw) || a.street.includes(kw) || a.category.includes(kw))
})

const displayKpis = computed(() => {
  if (drillLevel.value === 0) {
    return [
      { label: '资产总宗数', value: 233, unit: '宗', color: '#1890ff' },
      { label: '资产总价值', value: '6,699', unit: '万元', color: '#4ade80' },
      { label: '资产总面积', value: '18.6', unit: '万㎡', color: '#c084fc' },
      { label: '出租资产', value: 156, unit: '宗', color: '#facc15' },
      { label: '本年应收', value: '1,280', unit: '万元', color: '#fb923c' },
      { label: '本年实收', value: '1,046', unit: '万元', color: '#f87171' },
      { label: '欠缴总额', value: '234.2', unit: '万元', color: '#ff9f43' },
      { label: '闲置面积', value: '4.17', unit: '万㎡', color: '#a78bfa' },
    ]
  }
  if (drillLevel.value === 1 && currentCompany.value) {
    const co = currentCompany.value
    return [
      { label: '资产总宗数', value: co.totalAssets, unit: '宗', color: '#1890ff' },
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
      { label: '资产总数', value: p.total, unit: '宗', color: '#1890ff' },
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
    { label: '资产总宗', value: co.totalAssets, unit: '宗', color: '#1890ff' },
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
    { label: '资产总数', value: p.total, unit: '宗', color: '#1890ff' },
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
  currentCompany.value = co
  currentProject.value = null
  drillLevel.value = 1
  activeTab.value = 'overview'
  nextTick(() => {
    initCompanyPieChart()
  })
}

function drillToProject(p) {
  currentProject.value = p
  drillLevel.value = 2
}

function drillUp(level) {
  if (level === 0) {
    drillLevel.value = 0
    currentCompany.value = null
    currentProject.value = null
  } else if (level === 1) {
    drillLevel.value = 1
    currentProject.value = null
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
  axisLine: { lineStyle: { color: '#dcdfe6' } },
  axisLabel: { color: '#606266', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(0,0,0,0.06)' } },
}

function initCharts() {
  if (rankChartRef.value && !rankChart) {
    rankChart = echarts.init(rankChartRef.value)
    const sorted = [...streets].sort((a, b) => a.total - b.total)
    rankChart.setOption({
      grid: { left: 80, right: 30, top: 10, bottom: 20 },
      xAxis: { type: 'value', ...darkAxis },
      yAxis: { type: 'category', data: sorted.map(s => s.name), ...darkAxis, splitLine: { show: false } },
      series: [{
        type: 'bar', data: sorted.map(s => s.total), barWidth: 12,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#69c0ff' }]), borderRadius: [0, 6, 6, 0] },
        label: { show: true, position: 'right', color: '#606266', fontSize: 11 },
      }],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    })
  }
  if (revenueChartRef.value && !revenueChart) {
    revenueChart = echarts.init(revenueChartRef.value)
    revenueChart.setOption({
      grid: { left: 50, right: 20, top: 30, bottom: 25 },
      legend: { textStyle: { color: '#606266', fontSize: 11 }, top: 0 },
      xAxis: { type: 'category', data: ['2022', '2023', '2024', '2025', '2026'], ...darkAxis },
      yAxis: { type: 'value', ...darkAxis },
      tooltip: { trigger: 'axis' },
      series: [
        { name: '应收', type: 'bar', barWidth: 14, data: [860, 950, 1080, 1190, 1280], itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] } },
        { name: '实收', type: 'bar', barWidth: 14, data: [720, 830, 940, 1010, 1046], itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] } },
        { name: '收缴率', type: 'line', yAxisIndex: 0, data: [83.7, 87.4, 87.0, 84.9, 81.7], smooth: true, lineStyle: { color: '#faad14' }, itemStyle: { color: '#faad14' } },
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
    legend: { textStyle: { color: '#606266', fontSize: 11 }, bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
      label: { color: '#303133', fontSize: 12 },
      data: [
        { value: Math.round(co.totalAssets * co.rentedPct / 100), name: '出租中', itemStyle: { color: '#52c41a' } },
        { value: Math.round(co.totalAssets * co.idlePct / 100), name: '闲置中', itemStyle: { color: '#faad14' } },
        { value: co.totalAssets - Math.round(co.totalAssets * co.rentedPct / 100) - Math.round(co.totalAssets * co.idlePct / 100), name: '不可租', itemStyle: { color: '#1890ff' } },
      ],
    }],
  })
}

function initGisCharts() {
  if (mortgageChartRef.value && !mortgageChart) {
    mortgageChart = echarts.init(mortgageChartRef.value)
    mortgageChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      legend: { textStyle: { color: '#606266', fontSize: 10 }, bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['52%', '74%'], center: ['50%', '42%'],
        label: { show: true, position: 'center', formatter: '抵押总数\n68 宗', color: '#303133', fontSize: 13, lineHeight: 20 },
        emphasis: { label: { show: true } },
        data: [
          { value: 28, name: '城投集团', itemStyle: { color: '#1890ff' } },
          { value: 20, name: '产投集团', itemStyle: { color: '#faad14' } },
          { value: 12, name: '水投集团', itemStyle: { color: '#52c41a' } },
          { value: 8, name: '领航公司', itemStyle: { color: '#fa8c16' } },
        ],
      }],
    })
  }
  if (collectTypeChartRef.value && !collectTypeChart) {
    collectTypeChart = echarts.init(collectTypeChartRef.value)
    collectTypeChart.setOption({
      grid: { left: 45, right: 50, top: 26, bottom: 22 },
      legend: { textStyle: { color: '#606266', fontSize: 10 }, top: 0, itemWidth: 10, itemHeight: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: collectTypeData.map(d => d.name), ...darkAxis, axisLabel: { color: '#606266', fontSize: 10, interval: 0 } },
      yAxis: [
        { type: 'value', name: '万元', nameTextStyle: { color: '#909399', fontSize: 10 }, ...darkAxis },
        { type: 'value', name: '㎡', nameTextStyle: { color: '#909399', fontSize: 10 }, ...darkAxis, splitLine: { show: false } },
      ],
      series: [
        { name: '收缴金额', type: 'bar', barWidth: 10, data: collectTypeData.map(d => d.amount), itemStyle: { color: '#1890ff', borderRadius: [3, 3, 0, 0] } },
        { name: '收缴面积', type: 'bar', barWidth: 10, yAxisIndex: 1, data: collectTypeData.map(d => d.area), itemStyle: { color: '#722ed1', borderRadius: [3, 3, 0, 0] } },
      ],
    })
  }
  if (collectMonthChartRef.value && !collectMonthChart) {
    collectMonthChart = echarts.init(collectMonthChartRef.value)
    collectMonthChart.setOption({
      grid: { left: 40, right: 15, top: 26, bottom: 22 },
      legend: { textStyle: { color: '#606266', fontSize: 10 }, top: 0, itemWidth: 10, itemHeight: 10 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: collectMonthData.months, ...darkAxis, axisLabel: { color: '#606266', fontSize: 10, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [
        { name: '应收', type: 'bar', barWidth: 7, data: collectMonthData.receivable, itemStyle: { color: '#1890ff', borderRadius: [3, 3, 0, 0] } },
        { name: '实收', type: 'bar', barWidth: 7, data: collectMonthData.received, itemStyle: { color: '#52c41a', borderRadius: [3, 3, 0, 0] } },
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
          fillColor: '#1890ff',
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
    const color = isCompany ? '#1890ff' : '#52c41a'
    const labelContent = `
      <div style="position:relative;text-align:center;cursor:pointer;">
        <div style="width:12px;height:12px;border-radius:50%;background:${color};margin:0 auto;box-shadow:0 0 8px ${color};"></div>
        <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(0,0,0,0.75);color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">${m.name}</div>
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
  min-height: 100vh;
  background: #f5f7fa;
  padding: 16px 24px;
  color: #303133;
}
.bigscreen:fullscreen {
  min-height: 100vh;
  padding: 20px 32px;
  overflow-y: auto;
}
.bs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.bs-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #1890ff, #40a9ff, #1890ff);
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
  color: #606266;
  cursor: pointer;
  transition: color 0.2s;
}
.bc-item:hover, .bc-item.active {
  color: #1890ff;
}
.bc-sep {
  color: #c0c4cc;
}
.bs-time {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
  border: 1px solid #d4e8ff;
  border-radius: 20px;
  color: #1890ff;
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.5px;
}
.bs-time-text {
  color: #1890ff;
}
.bs-header-ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bs-fullscreen-btn {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #1890ff;
}
.bs-fullscreen-btn:hover {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}
.bs-kpis {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.bs-kpi {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.bs-kpi-value {
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.bs-kpi-unit {
  font-size: 12px;
  font-weight: normal;
  margin-left: 4px;
  color: #909399;
}
.bs-kpi-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.bs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.bs-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.bs-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
  display: flex;
  align-items: center;
}
.cat-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.cat-card {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cat-card:hover {
  border-color: #1890ff;
}
.cat-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 6px;
}
.cat-nums {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #909399;
}
.cat-nums b {
  color: #303133;
}
.bs-chart {
  height: 220px;
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
  color: #606266;
}
.stat-bar {
  flex: 1;
  height: 8px;
  background: #e4e7ed;
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
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  font-variant-numeric: tabular-nums;
}
.bs-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
.bs-tabs :deep(.el-tabs__item) {
  color: #606266;
  font-size: 15px;
}
.bs-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
}
.bs-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: #e4e7ed;
}
.bs-tabs :deep(.el-tabs__active-bar) {
  background-color: #1890ff;
}
.dark-table :deep(.el-table) {
  background: transparent;
}
.dark-table :deep(.el-table tr),
.dark-table :deep(.el-table th.el-table__cell) {
  background: transparent;
  color: #606266;
}
.dark-table :deep(.el-table td.el-table__cell),
.dark-table :deep(.el-table th.el-table__cell.is-leaf) {
  border-color: #ebeef5;
}
.dark-table :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #fafafa;
}
.dark-table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #ecf5ff !important;
}
.dark-table :deep(.el-table__inner-wrapper::before) {
  background-color: #ebeef5;
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
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.company-card:hover {
  border-color: #1890ff;
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
  color: #303133;
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
  font-size: 11px;
  color: #909399;
  display: block;
}
.co-metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
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
  font-size: 11px;
  color: #909399;
}
.co-bar {
  flex: 1;
  height: 6px;
  background: #e4e7ed;
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
  font-size: 11px;
  color: #606266;
  font-variant-numeric: tabular-nums;
}
.co-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
.co-risk {
  font-size: 12px;
  color: #f5222d;
  display: flex;
  align-items: center;
  gap: 4px;
}
.risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f5222d;
  animation: blink 1.5s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.co-enter {
  font-size: 12px;
  color: #1890ff;
}

.drill-content {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.drill-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
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
  color: #303133;
}
.dh-sub {
  font-size: 13px;
  color: #909399;
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
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.dh-kpi-unit {
  font-size: 11px;
  font-weight: normal;
  margin-left: 3px;
  color: #909399;
}
.dh-kpi-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}
.drill-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
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
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
}
.risk-level {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.risk-high { background: rgba(245, 34, 45, 0.1); color: #f5222d; }
.risk-mid { background: rgba(250, 173, 20, 0.1); color: #d48806; }
.risk-low { background: rgba(24, 144, 255, 0.1); color: #1890ff; }
.risk-text {
  flex: 1;
  color: #303133;
}
.risk-project {
  color: #909399;
  font-size: 11px;
  flex-shrink: 0;
}
.risk-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 13px;
}

.project-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.project-card {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.project-card:hover {
  border-color: #1890ff;
}
.pc-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}
.pc-nums {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}
.pc-rate {
  font-size: 11px;
  color: #1890ff;
}

.cat-figs {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed #dcdfe6;
}
.gis-board {
  display: grid;
  grid-template-columns: 340px 1fr 340px;
  gap: 12px;
  align-items: start;
}
.gis-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.owner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.owner-block {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
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
  color: #606266;
  line-height: 1.9;
}
.owner-row b {
  color: #303133;
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
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mn-label {
  font-size: 12px;
  color: #909399;
}
.mn-value {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.mn-value i {
  font-style: normal;
  font-size: 10px;
  font-weight: normal;
  color: #909399;
  margin-left: 3px;
}
.gis-sub-title {
  font-size: 12px;
  color: #606266;
  margin: 4px 0 2px;
}
.gis-chart-sm {
  height: 150px;
}
.gis-map-panel {
  padding: 12px 16px;
}
.gis-map-panel:fullscreen {
  background: #fff;
  overflow: auto;
}
.gis-map-ops {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.gis-switch-btn {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #1890ff;
}
.gis-switch-btn:hover {
  background: #d9ecff;
  border-color: #1890ff;
  color: #1890ff;
}
.gis-amap-container {
  width: 100%;
  height: 480px;
}
.collect-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.cov-item {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px 8px;
  text-align: center;
}
.cov-value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cov-value i {
  font-style: normal;
  font-size: 10px;
  font-weight: normal;
  color: #909399;
  margin-left: 3px;
}
.cov-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
.rank-badge {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  border-radius: 50%;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #c0c4cc;
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
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
.lc-center span {
  font-size: 10px;
  color: #909399;
}
.lc-label {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}
.idle-rate {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}
.ir-label {
  font-size: 12px;
  color: #606266;
  flex: none;
}
.ir-value {
  font-size: 14px;
  font-weight: 700;
  color: #d48806;
  flex: none;
}
</style>
