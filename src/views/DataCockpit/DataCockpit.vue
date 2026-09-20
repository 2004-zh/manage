<template>
  <div class="page-container">
    <div class="page-header">
      <h2>经营看板</h2>
    </div>
    <div class="hero-panel">
      <div class="hero-total">
        <div class="hero-head">
          <span class="hero-title">资产总量</span>
          <el-tag size="small" effect="dark">截至 2026-09</el-tag>
        </div>
        <div class="hero-metrics">
          <div class="hero-metric">
            <div class="hero-num">128.6<span>亿元</span></div>
            <div class="hero-label">资产总价值</div>
          </div>
          <div class="hero-metric">
            <div class="hero-num">3,862<span>宗</span></div>
            <div class="hero-label">资产总宗数</div>
          </div>
        </div>
      </div>
      <div class="hero-cats">
        <div v-for="c in assetCategories" :key="c.name" class="cat-card">
          <div class="cat-top">
            <div class="cat-icon" :style="{ background: c.bg }">
              <el-icon :size="18" :color="c.color"><component :is="c.icon" /></el-icon>
            </div>
            <span class="cat-name">{{ c.name }}</span>
          </div>
          <div class="cat-row"><span>资产数量</span><b>{{ c.count }} 宗</b></div>
          <div class="cat-row"><span>资产价值</span><b>{{ c.value }} 万元</b></div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="panel-card">
      <div class="panel-flex">
        <div class="warn-half">
          <div class="half-head">
            <span class="section-title">待办任务</span>
            <span class="half-count">6</span>
          </div>
          <div v-for="t in todoTasks" :key="t.no" class="mini-row">
            <el-icon color="#1890ff"><Document /></el-icon>
            <span class="mini-text">{{ t.title }}</span>
            <span class="mini-no">{{ t.no }}</span>
          </div>
        </div>
        <el-divider direction="vertical" class="half-divider" />
        <div class="warn-half">
          <div class="half-head">
            <span class="section-title">风险预警</span>
            <span class="half-count danger">9</span>
          </div>
          <div v-for="r in riskWarnings" :key="r.no" class="mini-row">
            <el-tag size="small" :type="r.tagType">{{ r.tag }}</el-tag>
            <span class="mini-text">{{ r.title }}</span>
            <span class="mini-no">{{ r.no }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col :span="12">
        <div class="section-title">资产信息</div>
        <div class="stat-strip tile-strip">
          <div class="stat-item" v-for="t in assetInfoTiles" :key="t.label">
            <div class="stat-value">{{ t.value }}<span class="unit">{{ t.unit }}</span></div>
            <div class="stat-label">{{ t.label }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="section-title">权属抵押</div>
        <div class="stat-strip tile-strip">
          <div class="stat-item" v-for="t in mortgageTiles" :key="t.label">
            <div class="stat-value">{{ t.value }}<span class="unit">{{ t.unit }}</span></div>
            <div class="stat-label">{{ t.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="8">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">资产权属</div>
          <div class="donut-flex">
            <div class="donut" :style="ownershipDonutStyle">
              <div class="donut-hole">
                <b>3,862</b>
                <span>总宗数</span>
              </div>
            </div>
            <div class="pct-list">
              <div v-for="o in ownershipData" :key="o.name" class="pct-item">
                <span class="dot" :style="{ background: o.color }"></span>
                <span class="pct-name">{{ o.name }}</span>
                <el-progress :percentage="o.percent" :stroke-width="8" :color="o.color" :show-text="false" class="pct-bar" />
                <span class="pct-val">{{ o.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">资产类型</div>
          <div class="funnel-list">
            <div v-for="f in funnelData" :key="f.name" class="funnel-row">
              <div class="funnel-bar" :style="{ width: f.percent + '%', background: f.color }">
                <span>{{ f.name }}</span>
                <span>{{ f.count }}</span>
              </div>
            </div>
          </div>
          <div class="long-legend">
            <span v-for="f in funnelData" :key="'lg' + f.name" class="legend-item">
              <i :style="{ background: f.color }"></i>{{ f.name }} {{ f.count }}宗
            </span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">资产数量与面积</div>
          <div class="stack-list">
            <div v-for="s in streetData" :key="s.name" class="stack-row">
              <span class="stack-name">{{ s.name }}</span>
              <div class="stack-track">
                <div class="seg seg-count" :style="{ width: (s.count / stackMax) * 100 + '%' }"></div>
                <div class="seg seg-area" :style="{ width: (s.area / stackMax) * 100 + '%' }"></div>
              </div>
              <span class="stack-val">{{ s.count }}宗 · {{ s.area }}㎡</span>
            </div>
          </div>
          <div class="long-legend">
            <span class="legend-item"><i style="background: #1890ff"></i>数量(宗)</span>
            <span class="legend-item"><i style="background: #faad14"></i>面积(㎡)</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12">
      <el-col :span="12">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">租赁情况</div>
          <div class="lease-grid">
            <div v-for="l in leaseTiles" :key="l.label" class="lease-tile">
              <div class="lease-value" :style="{ color: l.color }">{{ l.value }}<span>{{ l.unit }}</span></div>
              <div class="lease-label">{{ l.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">租赁类型占比</div>
          <div class="pie-flex">
            <div class="pie-sm" :style="leaseTypePieStyle"></div>
            <div class="pct-list">
              <div v-for="l in leaseTypeData" :key="l.name" class="pct-item">
                <span class="dot" :style="{ background: l.color }"></span>
                <span class="pct-name">{{ l.name }}</span>
                <span class="pct-val">{{ l.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="panel-card chart-panel">
          <div class="section-title">租赁权属占比</div>
          <div class="pie-flex">
            <div class="donut donut-sm" :style="leaseRightDonutStyle">
              <div class="donut-hole">
                <b class="hl">92.3%</b>
                <span>盘活率</span>
              </div>
            </div>
            <div class="pct-list">
              <div v-for="l in leaseRightData" :key="l.name" class="pct-item">
                <span class="dot" :style="{ background: l.color }"></span>
                <span class="pct-name">{{ l.name }}</span>
                <span class="pct-val">{{ l.percent }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="panel-card">
      <div class="section-title">资产创收排行</div>
      <el-table :data="revenueRank" size="small" style="width: 100%">
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span class="rank-badge" :class="'rank-' + ($index + 1)">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司" min-width="200" show-overflow-tooltip />
        <el-table-column prop="project" label="项目" min-width="180" show-overflow-tooltip />
        <el-table-column label="租赁率" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.rate" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="leaseCount" label="租赁总数" width="100" align="right" />
        <el-table-column prop="leaseAmount" label="租赁总额(万元)" width="140" align="right" />
      </el-table>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据驾驶舱</span>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
        </div>
      </template>

      <el-row :gutter="20" class="stat-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #e6f7ff">
              <el-icon :size="32" color="#1890ff"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">1,286</div>
              <div class="stat-label">资产总数</div>
              <div class="stat-trend up">↑ 12% 较上月</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #f6ffed">
              <el-icon :size="32" color="#52c41a"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">98.5%</div>
              <div class="stat-label">出租率</div>
              <div class="stat-trend up">↑ 2.3% 较上月</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #fff7e6">
              <el-icon :size="32" color="#fa8c16"><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥2,580万</div>
              <div class="stat-label">年度收益</div>
              <div class="stat-trend up">↑ 8.5% 较去年</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" style="background: #fff1f0">
              <el-icon :size="32" color="#f5222d"><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">12</div>
              <div class="stat-label">待处理预警</div>
              <div class="stat-trend down">↓ 3 较昨日</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>资产类型分布</span>
                <el-radio-group v-model="chartType1" size="small">
                  <el-radio-button label="pie">饼图</el-radio-button>
                  <el-radio-button label="bar">柱状图</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="chartType1 === 'pie'" class="pie-chart-container">
                <div class="pie-chart" :style="pieChartStyle"></div>
                <div class="pie-legend">
                  <div v-for="item in assetTypeData" :key="item.name" class="pie-legend-item">
                    <span class="pie-legend-dot" :style="{ background: item.color }"></span>
                    <span class="pie-legend-label">{{ item.name }}</span>
                    <span class="pie-legend-value">{{ item.count }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </div>
              <div v-else>
                <div v-for="item in assetTypeData" :key="item.name" class="chart-bar-item">
                  <div class="chart-bar-label">{{ item.name }}</div>
                  <div class="chart-bar-wrapper">
                    <div class="chart-bar" :style="{ width: item.percent + '%', background: item.color }"></div>
                    <span class="chart-bar-value">{{ item.count }} ({{ item.percent }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="chart-header">
                <span>月度收益趋势</span>
                <el-radio-group v-model="chartType2" size="small">
                  <el-radio-button label="line">折线图</el-radio-button>
                  <el-radio-button label="bar">柱状图</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-placeholder">
              <div v-if="chartType2 === 'line'" class="line-chart-container">
                <svg class="line-chart-svg" viewBox="0 0 400 220" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#1890ff" stop-opacity="0.3" />
                      <stop offset="100%" stop-color="#1890ff" stop-opacity="0.02" />
                    </linearGradient>
                  </defs>
                  <line v-for="i in 4" :key="'g'+i" :x1="40" :x2="390" :y1="i * 40 + 10" :y2="i * 40 + 10" stroke="#f0f0f0" stroke-width="1" />
                  <polyline :points="linePoints" fill="none" stroke="#1890ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
                  <polygon :points="areaPoints" fill="url(#areaGrad)" />
                  <circle v-for="(pt, i) in chartPoints" :key="i" :cx="pt.x" :cy="pt.y" r="4" fill="#fff" stroke="#1890ff" stroke-width="2" />
                </svg>
                <div class="line-x-labels">
                  <span v-for="item in monthlyRevenue" :key="item.month">{{ item.month }}</span>
                </div>
              </div>
              <div v-else>
                <div class="trend-chart">
                  <div v-for="item in monthlyRevenue" :key="item.month" class="trend-item">
                    <div class="trend-bar" :style="{ height: item.value / 300 * 100 + '%' }"></div>
                    <div class="trend-label">{{ item.month }}</div>
                    <div class="trend-value">{{ item.value }}万</div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px">
        <template #header>
          <div class="chart-header">
            <span>智能预警</span>
            <el-button link type="primary" @click="handleViewAll">查看全部</el-button>
          </div>
        </template>
        <el-table :data="warnings" style="width: 100%">
          <el-table-column prop="level" label="预警级别" width="100">
            <template #default="{ row }">
              <el-tag :type="row.level === '高' ? 'danger' : row.level === '中' ? 'warning' : 'info'" size="small">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="预警类型" width="120" />
          <el-table-column prop="content" label="预警内容" />
          <el-table-column prop="asset" label="关联资产" width="150" />
          <el-table-column prop="time" label="时间" width="120" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleProcess(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>

    <el-dialog v-model="warningDetailVisible" title="预警处理" width="600px">
      <el-descriptions :column="1" border v-if="currentWarning">
        <el-descriptions-item label="预警级别">
          <el-tag :type="currentWarning.level === '高' ? 'danger' : currentWarning.level === '中' ? 'warning' : 'info'" size="small">{{ currentWarning.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentWarning.type }}</el-descriptions-item>
        <el-descriptions-item label="预警内容">{{ currentWarning.content }}</el-descriptions-item>
        <el-descriptions-item label="关联资产">{{ currentWarning.asset }}</el-descriptions-item>
        <el-descriptions-item label="预警时间">{{ currentWarning.time }}</el-descriptions-item>
      </el-descriptions>
      <el-form style="margin-top: 20px" label-width="100px">
        <el-form-item label="处理意见">
          <el-input v-model="processRemark" type="textarea" :rows="3" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warningDetailVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProcessSubmit">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding, TrendCharts, Money, Warning,
  House, MapLocation, Shop, Goods, Van, Coin, Document
} from '@element-plus/icons-vue'

const router = useRouter()
const dateRange = ref([])
const chartType1 = ref('bar')
const chartType2 = ref('line')
const warningDetailVisible = ref(false)
const currentWarning = ref(null)
const processRemark = ref('')

const assetCategories = [
  { name: '房产类', count: '1,286', value: '562,300', icon: House, color: '#1890ff', bg: '#e6f7ff' },
  { name: '土地类', count: '642', value: '398,500', icon: MapLocation, color: '#52c41a', bg: '#f6ffed' },
  { name: '经营类房屋店铺', count: '856', value: '215,800', icon: Shop, color: '#fa8c16', bg: '#fff7e6' },
  { name: '农贸市场', count: '128', value: '46,200', icon: Goods, color: '#722ed1', bg: '#f9f0ff' },
  { name: '运输设备', count: '356', value: '12,600', icon: Van, color: '#13c2c2', bg: '#e6fffb' },
  { name: '矿产', count: '94', value: '45,100', icon: Coin, color: '#eb2f96', bg: '#fff0f6' }
]

const todoTasks = [
  { title: '闲置资产盘活方案待报送', no: 'DB-2026-009' },
  { title: '未办证资产推进材料待提交', no: 'DB-2026-014' }
]

const riskWarnings = [
  { tag: '报事报修', tagType: 'danger', title: '农贸市场2号屋面漏水报修超时', no: 'BX-2026-1187' },
  { tag: '项目巡查', tagType: 'warning', title: '滨江改造项目巡查发现安全隐患', no: 'XC-2026-0356' },
  { tag: '固定资产', tagType: 'info', title: '办公设备一批已达报废年限', no: 'GZ-2026-0345' }
]

const assetInfoTiles = [
  { label: '资产总数', value: '3,862', unit: '宗' },
  { label: '运营总数', value: '2,946', unit: '宗' },
  { label: '资产闲置率', value: '12.6', unit: '%' },
  { label: '闲置面积', value: '8.6', unit: '万㎡' }
]

const mortgageTiles = [
  { label: '权证总数', value: '2,394', unit: '本' },
  { label: '权证获取比', value: '62', unit: '%' },
  { label: '抵押总数', value: '186', unit: '宗' },
  { label: '抵押总额', value: '21.8', unit: '亿元' }
]

const ownershipData = [
  { name: '有证', percent: 62, color: '#1890ff' },
  { name: '无证', percent: 26, color: '#faad14' },
  { name: '办理中', percent: 12, color: '#52c41a' }
]

const funnelData = [
  { name: '住宅用房', count: 860, percent: 100, color: '#1890ff' },
  { name: '商业用房', count: 720, percent: 86, color: '#36cfc9' },
  { name: '办公用房', count: 560, percent: 72, color: '#52c41a' },
  { name: '工业厂房', count: 480, percent: 62, color: '#faad14' },
  { name: '仓储用房', count: 380, percent: 52, color: '#fa8c16' },
  { name: '车位', count: 320, percent: 43, color: '#722ed1' },
  { name: '土地', count: 280, percent: 35, color: '#eb2f96' },
  { name: '其他', count: 262, percent: 28, color: '#8c8c8c' }
]

const streetData = [
  { name: '吴航街道', count: 860, area: 780 },
  { name: '航城街道', count: 720, area: 860 },
  { name: '营前街道', count: 560, area: 480 },
  { name: '首占镇', count: 480, area: 560 },
  { name: '玉田镇', count: 380, area: 320 },
  { name: '古槐镇', count: 320, area: 410 }
]

const stackMax = computed(() => Math.max(...streetData.map(s => s.count + s.area)))

const leaseTiles = [
  { label: '租赁总数', value: '1,286', unit: '宗', color: '#1890ff' },
  { label: '租赁总面积', value: '42.6', unit: '万㎡', color: '#722ed1' },
  { label: '合同总数', value: '1,532', unit: '份', color: '#13c2c2' },
  { label: '资产维修', value: '86', unit: '单', color: '#fa8c16' },
  { label: '租金收缴', value: '96.8', unit: '%', color: '#52c41a' },
  { label: '当前欠缴', value: '328.5', unit: '万元', color: '#f5222d' }
]

const leaseTypeData = [
  { name: '整租', percent: 45, color: '#1890ff' },
  { name: '分租', percent: 30, color: '#52c41a' },
  { name: '合租', percent: 15, color: '#faad14' },
  { name: '其他', percent: 10, color: '#8c8c8c' }
]

const leaseRightData = [
  { name: '国有', percent: 55, color: '#1890ff' },
  { name: '集体', percent: 25, color: '#36cfc9' },
  { name: '私有', percent: 20, color: '#faad14' }
]

const revenueRank = [
  { company: '长乐区国有资产投资有限公司', project: '万达广场商业裙楼', rate: 98, leaseCount: 286, leaseAmount: '8,650.2' },
  { company: '长乐城市运营集团有限公司', project: '滨江金融港写字楼', rate: 95, leaseCount: 214, leaseAmount: '7,320.8' },
  { company: '长乐文旅发展有限公司', project: '南山文化创意园', rate: 91, leaseCount: 168, leaseAmount: '5,480.5' },
  { company: '长乐城乡建发有限公司', project: '营前农贸市场综合体', rate: 88, leaseCount: 152, leaseAmount: '4,260.3' },
  { company: '长乐交通建设投资有限公司', project: '首占物流仓储基地', rate: 82, leaseCount: 96, leaseAmount: '3,180.6' },
  { company: '长乐工业园区管委会', project: '古槐标准厂房片区', rate: 76, leaseCount: 84, leaseAmount: '2,540.9' }
]

function makeConic(data) {
  let cum = 0
  const parts = data.map(d => {
    const seg = `${d.color} ${cum}% ${cum + d.percent}%`
    cum += d.percent
    return seg
  })
  return { background: `conic-gradient(${parts.join(', ')})` }
}

const ownershipDonutStyle = computed(() => makeConic(ownershipData))
const leaseTypePieStyle = computed(() => makeConic(leaseTypeData))
const leaseRightDonutStyle = computed(() => makeConic(leaseRightData))

const assetTypeData = ref([
  { name: '保障房', count: 500, percent: 38.9, color: '#1890ff' },
  { name: '商铺', count: 300, percent: 23.3, color: '#52c41a' },
  { name: '写字楼', count: 200, percent: 15.6, color: '#fa8c16' },
  { name: '厂房', count: 186, percent: 14.5, color: '#722ed1' },
  { name: '农贸市场', count: 100, percent: 7.7, color: '#13c2c2' }
])

const monthlyRevenue = ref([
  { month: '1月', value: 180 },
  { month: '2月', value: 195 },
  { month: '3月', value: 210 },
  { month: '4月', value: 205 },
  { month: '5月', value: 220 },
  { month: '6月', value: 235 },
  { month: '7月', value: 228 },
  { month: '8月', value: 242 },
  { month: '9月', value: 258 }
])

const warnings = ref([
  { level: '高', type: '合同到期', content: 'XX商铺A座201合同将于7天后到期，请及时处理续租或清退', asset: '商铺A座201', time: '2026-09-15' },
  { level: '高', type: '欠费预警', content: 'XX写字楼B栋301租金已逾期15天，累计欠费¥45,000', asset: '写字楼B栋301', time: '2026-09-14' },
  { level: '中', type: '维修工单', content: 'XX厂房C区2号报修工单已超过48小时未处理', asset: '厂房C区2号', time: '2026-09-13' },
  { level: '中', type: '安全巡检', content: 'XX保障房3号楼消防设施巡检逾期，请尽快安排', asset: '保障房3号楼', time: '2026-09-12' },
  { level: '低', type: '证照到期', content: 'XX农贸市场产权证将于3个月后到期，请提前准备续期材料', asset: '农贸市场1号', time: '2026-09-10' }
])

const pieChartStyle = computed(() => {
  let gradient = 'conic-gradient('
  let cumulative = 0
  for (const item of assetTypeData.value) {
    gradient += `${item.color} ${cumulative}% ${cumulative + item.percent}%`
    cumulative += item.percent
    if (cumulative < 100) gradient += ', '
  }
  gradient += ')'
  return { background: gradient }
})

const chartPoints = computed(() => {
  const data = monthlyRevenue.value
  const maxVal = 300
  const startX = 50
  const endX = 380
  const topY = 20
  const bottomY = 190
  const step = (endX - startX) / (data.length - 1)
  return data.map((item, i) => ({
    x: startX + i * step,
    y: bottomY - (item.value / maxVal) * (bottomY - topY)
  }))
})

const linePoints = computed(() => chartPoints.value.map(p => `${p.x},${p.y}`).join(' '))

const areaPoints = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return `${pts[0].x},190 ${linePoints.value} ${pts[pts.length - 1].x},190`
})

const handleViewAll = () => {
  router.push('/inspection-maintenance')
}

const handleProcess = (row) => {
  currentWarning.value = row
  warningDetailVisible.value = true
}

const handleProcessSubmit = () => {
  if (currentWarning.value) {
    currentWarning.value.status = '已处理'
  }
  warningDetailVisible.value = false
  ElMessage.success('预警已处理')
}
</script>

<style scoped>
.page-container {
  height: 100%;
}

.hero-panel {
  display: flex;
  gap: 12px;
  background: #fff;
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
}

.hero-total {
  flex: none;
  width: 260px;
  border-radius: 6px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--c-primary) 0%, #36cfc9 100%);
  color: #fff;
}

.hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.hero-title {
  font-size: 15px;
  font-weight: 600;
}

.hero-metrics {
  display: flex;
  gap: 24px;
}

.hero-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.hero-num span {
  font-size: 12px;
  font-weight: 400;
  margin-left: 3px;
  opacity: 0.85;
}

.hero-label {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.hero-cats {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.cat-card {
  flex: none;
  width: 190px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 10px 12px;
  transition: box-shadow 0.2s;
}

.cat-card:hover {
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}

.cat-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.cat-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.cat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.cat-row b {
  color: #333;
  font-weight: 600;
}

.panel-card {
  margin-bottom: 12px;
  border-radius: 6px;
}

.panel-card :deep(.el-card__body) {
  padding: 14px 16px;
}

.chart-panel {
  height: 100%;
}

.panel-flex {
  display: flex;
  align-items: stretch;
}

.warn-half {
  flex: 1;
  min-width: 0;
}

.half-divider {
  height: auto;
  margin: 0 20px;
}

.half-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.half-head .section-title {
  margin: 0;
}

.half-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--c-primary);
}

.half-count.danger {
  color: #f5222d;
}

.mini-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px dashed #f0f0f0;
  font-size: 13px;
}

.mini-row:last-child {
  border-bottom: none;
}

.mini-text {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mini-no {
  color: #999;
  font-size: 12px;
  flex: none;
}

.tile-strip {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.donut-flex,
.pie-flex {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.donut {
  position: relative;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  flex: none;
}

.donut-sm {
  width: 110px;
  height: 110px;
}

.donut-hole {
  position: absolute;
  inset: 26px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-hole b {
  font-size: 17px;
  color: #333;
}

.donut-hole b.hl {
  color: var(--c-primary);
}

.donut-hole span {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.pie-sm {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  flex: none;
}

.pct-list {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pct-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.pct-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: none;
}

.pct-name {
  color: #666;
  flex: none;
  width: 44px;
}

.pct-bar {
  flex: 1;
  min-width: 40px;
}

.pct-val {
  color: #333;
  font-weight: 600;
  flex: none;
}

.funnel-list {
  padding: 6px 0 10px;
}

.funnel-row {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;
}

.funnel-bar {
  height: 22px;
  min-width: 110px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  font-size: 12px;
  color: #fff;
}

.long-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  border-top: 1px dashed #f0f0f0;
  padding-top: 8px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
}

.legend-item i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.stack-list {
  padding: 6px 0 10px;
}

.stack-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.stack-name {
  flex: none;
  width: 62px;
  font-size: 12px;
  color: #666;
}

.stack-track {
  flex: 1;
  height: 14px;
  background: #f5f5f5;
  border-radius: 3px;
  display: flex;
  overflow: hidden;
}

.seg {
  height: 100%;
}

.seg-count {
  background: var(--c-primary);
}

.seg-area {
  background: #faad14;
}

.stack-val {
  flex: none;
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.lease-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 6px 0;
}

.lease-tile {
  background: #fafcff;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.lease-value {
  font-size: 20px;
  font-weight: 700;
}

.lease-value span {
  font-size: 12px;
  font-weight: 400;
  color: #999;
  margin-left: 2px;
}

.lease-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: #bfbfbf;
}

.rank-badge.rank-1 {
  background: #f5a623;
}

.rank-badge.rank-2 {
  background: #9aa7b8;
}

.rank-badge.rank-3 {
  background: #cd7f32;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.stat-row {
  margin-bottom: 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-card .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #262626;
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}

.stat-card .stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #52c41a;
}

.stat-trend.down {
  color: #f5222d;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
}

.chart-placeholder {
  padding: 20px 0;
}

.chart-bar-item {
  margin-bottom: 16px;
}

.chart-bar-label {
  font-size: 14px;
  color: #595959;
  margin-bottom: 8px;
}

.chart-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-bar {
  height: 24px;
  border-radius: 4px;
  min-width: 40px;
  transition: width 0.3s;
}

.chart-bar-value {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 250px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
  justify-content: flex-end;
}

.trend-bar {
  width: 32px;
  background: linear-gradient(180deg, var(--c-primary) 0%, #69c0ff 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

.trend-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 8px;
}

.trend-value {
  font-size: 12px;
  color: #595959;
  margin-top: 4px;
}

.pie-chart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 20px 0;
}

.pie-chart {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.pie-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.pie-legend-label {
  color: #595959;
  min-width: 56px;
}

.pie-legend-value {
  color: #8c8c8c;
}

.line-chart-container {
  padding: 10px 0;
}

.line-chart-svg {
  width: 100%;
  height: 220px;
}

.line-x-labels {
  display: flex;
  justify-content: space-between;
  padding: 8px 40px 0;
  font-size: 12px;
  color: #8c8c8c;
}
</style>
