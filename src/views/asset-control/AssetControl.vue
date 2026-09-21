<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产管控</h2>
    </div>

    <el-tabs v-model="activeTab" class="ctrl-tabs fill">
      <el-tab-pane label="全景租控" name="pano">
        <el-row :gutter="14">
          <el-col :span="5">
            <el-card shadow="never" class="pano-tree-card">
              <template #header>
                <div class="card-hd">
                  <span>项目导航</span>
                  <el-input v-model="panoTreeFilter" size="small" placeholder="搜索项目" clearable style="width:110px" />
                </div>
              </template>
              <el-tree
                ref="panoTreeRef"
                :data="panoTreeData"
                :props="treeProps"
                node-key="key"
                :filter-node-method="filterNode"
                :expand-on-click-node="false"
                highlight-current
                @node-click="onPanoNodeClick"
              >
                <template #default="{ data }">
                  <span class="tree-node">
                    <el-tag size="small" :type="levelTagType(data.level)" effect="plain" class="lv-tag">{{ data.level }}</el-tag>
                    <span>{{ data.label }}</span>
                  </span>
                </template>
              </el-tree>
            </el-card>
          </el-col>
          <el-col :span="19">
            <el-card shadow="never" class="pano-head-card">
              <div class="proj-head">
                <div class="proj-photo">
                  <img v-if="currentPanoProject.image" :src="currentPanoProject.image" alt="项目实景" class="proj-photo-img" />
                  <template v-else>
                    <el-icon :size="30"><OfficeBuilding /></el-icon>
                    <span>项目实景图</span>
                  </template>
                </div>
                <div class="proj-info">
                  <div class="proj-name">
                    {{ currentPanoProject.name }}
                    <el-tag size="small" effect="plain">{{ currentPanoProject.typeTag }}</el-tag>
                  </div>
                  <div class="proj-addr">
                    <el-icon><LocationInformation /></el-icon>
                    <span>{{ currentPanoProject.address }}</span>
                  </div>
                </div>
              </div>
          <div class="stat-strip">
            <div v-for="k in panoKpis" :key="k.label" class="stat-item">
              <div class="stat-value">{{ k.value }}<span v-if="k.unit" class="unit">{{ k.unit }}</span></div>
              <div class="stat-label">{{ k.label }}</div>
            </div>
          </div>
        </el-card>

        <el-row :gutter="12" class="ana-row">
          <el-col :span="8">
            <el-card shadow="never" class="ana-card">
              <div class="section-title">已使用 / 未使用</div>
              <div class="ana-body">
                <el-progress type="circle" :percentage="usedPct" :width="88" :stroke-width="10" color="#1668DC">
                  <template #default>
                    <div class="donut-center"><b>{{ usedPct }}%</b><span>已使用</span></div>
                  </template>
                </el-progress>
                <div class="ana-legend">
                  <div><i class="dot" style="background:#1668DC"></i>已使用 {{ usedCount }} 项</div>
                  <div><i class="dot" style="background:#e0e0e0"></i>未使用 {{ unusedCount }} 项</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="ana-card">
              <div class="section-title">资产类型</div>
              <div class="ana-body">
                <div class="type-pie" :style="typePieStyle"></div>
                <div class="ana-legend">
                  <div v-for="t in typeStats" :key="t.name">
                    <i class="dot" :style="{ background: t.color }"></i>{{ t.name }} {{ t.count }} 项
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="never" class="ana-card">
              <div class="section-title">近一年每月实收（万元）</div>
              <div class="bar-chart">
                <div v-for="b in monthlyReceipts" :key="b.m" class="bar-col" :title="`${b.m}：${b.v} 万元`">
                  <div class="bar" :style="{ height: (b.v / maxReceipt * 100) + '%' }"></div>
                  <span class="bar-m">{{ b.m }}</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="never" class="board-card">
          <template #header>
            <div class="card-hd">
              <span>{{ currentPanoProject.name }} · 全景租控看板</span>
              <el-radio-group v-model="panoView" size="small">
                <el-radio-button value="map">分布图展示</el-radio-button>
                <el-radio-button value="list">列表展示</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <div class="chip-row">
            <span class="chip-label">租赁状态</span>
            <span class="chip" :class="{ on: panoStatus === '' }" @click="panoStatus = ''">全部</span>
            <span
              v-for="s in panoStatusList"
              :key="s"
              class="chip"
              :class="{ on: panoStatus === s }"
              @click="panoStatus = panoStatus === s ? '' : s"
            >{{ s }}({{ panoStatusCount(s) }})</span>
          </div>
          <div class="chip-row">
            <span class="chip-label">空置时长</span>
            <span
              v-for="b in vacancyBuckets"
              :key="b.label"
              class="chip"
              :class="{ on: panoVacBucket === b.label }"
              @click="panoVacBucket = panoVacBucket === b.label ? '' : b.label"
            ><i class="dot" :style="{ background: b.color }"></i>{{ b.label }}</span>
          </div>
          <div class="chip-row">
            <span class="chip-label">到期时长</span>
            <span
              v-for="b in expiryBuckets"
              :key="b.label"
              class="chip"
              :class="{ on: panoExpBucket === b.label }"
              @click="panoExpBucket = panoExpBucket === b.label ? '' : b.label"
            ><i class="dot" :style="{ background: b.color }"></i>{{ b.label }}</span>
          </div>
          <div class="pano-filter">
            <el-checkbox v-model="panoUnrentable">不可租资产</el-checkbox>
            <el-input v-model="panoAreaKw" placeholder="资产面积筛选" clearable style="width:200px" />
            <span class="pano-tip">支持「120」或「100-300」，单位 ㎡</span>
          </div>

          <div v-if="panoView === 'map'" class="pano-map">
            <div class="floor-nav">
              <div
                v-for="f in currentPanoFloors"
                :key="f"
                class="floor-circle"
                :class="{ active: panoFloor === f }"
                @click="panoFloor = f"
              >{{ f }}</div>
            </div>
            <div class="floor-panel">
              <div class="section-title">{{ panoFloor }} 资产分布（共 {{ panoFloorAssets.length }} 项）</div>
              <div class="pano-grid">
                <div
                  v-for="a in panoFloorAssets"
                  :key="a.id"
                  class="pano-card"
                  :class="cardTint(a.status)"
                  :style="{ borderLeftColor: panoColor(a.status) }"
                >
                  <div class="pc-top">
                    <span class="pc-name" :title="a.name">{{ a.name }}</span>
                    <span class="pc-badge" :style="{ background: panoColor(a.status) }">{{ a.status }}</span>
                  </div>
                  <div class="pc-row">编号：{{ a.assetNo }}</div>
                  <div class="pc-tags">
                    <el-tag size="small" :type="a.mortgaged ? 'danger' : 'info'" effect="plain">{{ a.mortgaged ? '已抵押' : '未抵押' }}</el-tag>
                    <span class="pc-sep">|</span>
                    <el-tag size="small" :type="a.propertyRight ? 'success' : 'info'" effect="plain">{{ a.propertyRight ? '有产权' : '无产权' }}</el-tag>
                    <el-tag size="small" :type="a.used ? 'warning' : 'info'">{{ a.used ? '已使用' : '未使用' }}</el-tag>
                  </div>
                  <div class="pc-row">面积：{{ a.area }} ㎡</div>
                  <div v-if="a.status === '已租赁' && a.tenant" class="pc-row pc-tenant" :title="a.tenant">承租：{{ a.tenant }}</div>
                  <div v-if="a.expiry" class="pc-row" :class="{ 'pc-expiry': expiringSoon(a) }">到期：{{ a.expiry }}</div>
                </div>
              </div>
              <el-empty v-if="!panoFloorAssets.length" description="当前筛选条件下暂无资产" :image-size="70" />
            </div>
          </div>

          <div v-else>
            <div class="list-filter">
              <el-input v-model="listQ.assetNo" placeholder="资产编号" clearable style="width:180px" />
              <el-select v-model="listQ.status" placeholder="租赁状态" clearable style="width:140px">
                <el-option v-for="s in panoStatusList" :key="s" :label="s" :value="s" />
              </el-select>
              <el-select v-model="listQ.type" placeholder="资产类型" clearable style="width:140px">
                <el-option v-for="t in panoTypes" :key="t" :label="t" :value="t" />
              </el-select>
              <el-select v-model="listQ.zone" placeholder="所在分区" clearable style="width:140px">
                <el-option v-for="z in panoZones" :key="z" :label="z" :value="z" />
              </el-select>
              <el-button type="primary" :icon="Search" @click="handlePanoSearch">搜索</el-button>
            </div>
            <el-table :data="listPaged" border stripe size="small">
              <el-table-column prop="zone" label="分区" width="80" align="center" />
              <el-table-column prop="floor" label="楼层" width="70" align="center" />
              <el-table-column prop="assetNo" label="资产编号" width="130" />
              <el-table-column prop="name" label="资产名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="location" label="资产座落" min-width="190" show-overflow-tooltip />
              <el-table-column label="产权状态" width="95" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.propertyRight ? 'success' : 'info'" effect="plain">{{ row.propertyRight ? '有产权' : '无产权' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="propertyNo" label="产权编号" min-width="180" show-overflow-tooltip />
              <el-table-column label="抵押状态" width="95" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.mortgaged ? 'danger' : 'info'" effect="plain">{{ row.mortgaged ? '已抵押' : '未抵押' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="租赁状态" width="95" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="listStatusTag(row.status)">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination
                v-model:current-page="listPage"
                v-model:page-size="listPageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="listFiltered.length"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </div>
        </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- ===== 空间管控看板 ===== -->
      <el-tab-pane label="空间管控" name="space">
        <el-row :gutter="16">
          <!-- 左侧：项目 → 分区 → 楼层 → 资产 四级树 -->
          <el-col :span="6">
            <el-card shadow="never" class="tree-card">
              <template #header>
                <div class="card-hd">
                  <span>资产层级</span>
                  <el-input v-model="treeFilter" size="small" placeholder="搜索资产" clearable style="width:130px" />
                </div>
              </template>
              <el-tree
                ref="treeRef"
                :data="treeData"
                :props="treeProps"
                node-key="key"
                :filter-node-method="filterNode"
                :expand-on-click-node="false"
                default-expand-all
                highlight-current
                @node-click="onNodeClick"
              >
                <template #default="{ data }">
                  <span class="tree-node">
                    <el-tag v-if="data.level" size="small" :type="levelTagType(data.level)" effect="plain" class="lv-tag">{{ data.level }}</el-tag>
                    <span :class="{ 'is-asset': data.level === '资产' }">{{ data.label }}</span>
                    <span v-if="data.statusDot" class="dot" :style="{ background: statusColor(data.statusDot) }"></span>
                  </span>
                </template>
              </el-tree>
            </el-card>
          </el-col>

          <!-- 右侧：楼层卡片 + 状态色块 + 空置时长 -->
          <el-col :span="18">
            <el-card shadow="never" class="board-card">
              <template #header>
                <div class="card-hd">
                  <span>{{ boardTitle }}</span>
                  <div class="legend">
                    <span v-for="s in statusList" :key="s" class="legend-item">
                      <i class="dot" :style="{ background: statusColor(s) }"></i>{{ s }}
                    </span>
                  </div>
                </div>
              </template>

              <!-- KPI -->
              <el-row :gutter="12" class="kpi-row">
                <el-col :span="6"><div class="kpi"><div class="kpi-v">{{ boardStats.total }}</div><div class="kpi-l">资产总数</div></div></el-col>
                <el-col :span="6"><div class="kpi"><div class="kpi-v" style="color:#67c23a">{{ boardStats.rented }}</div><div class="kpi-l">已出租</div></div></el-col>
                <el-col :span="6"><div class="kpi"><div class="kpi-v" style="color:#e6a23c">{{ boardStats.vacant }}</div><div class="kpi-l">空置/闲置</div></div></el-col>
                <el-col :span="6"><div class="kpi"><div class="kpi-v" style="color:#409eff">{{ boardStats.rate }}%</div><div class="kpi-l">出租率</div></div></el-col>
              </el-row>

              <!-- 楼层分区卡片 -->
              <div v-for="floor in currentFloors" :key="floor.id" class="floor-block">
                <div class="floor-hd">
                  <span class="floor-name">{{ floor.name }}</span>
                  <span class="floor-area">{{ floor.area }} ㎡</span>
                </div>
                <div class="room-grid">
                  <div
                    v-for="room in floor.rooms"
                    :key="room.id"
                    class="room-cell"
                    :class="{ active: selectedAsset && selectedAsset.id === room.id }"
                    :style="{ borderColor: statusColor(room.status) }"
                    @click="openAsset(room)"
                  >
                    <div class="room-top">
                      <span class="room-name">{{ room.name }}</span>
                      <span class="room-status" :style="{ background: statusColor(room.status) }">{{ room.status }}</span>
                    </div>
                    <div class="room-area">{{ room.area }} ㎡</div>
                    <div class="room-foot">
                      <template v-if="room.tenant">
                        <span class="tenant">{{ room.tenant }}</span>
                      </template>
                      <template v-else-if="room.vacancyDays != null">
                        <el-tag size="small" :type="vacancyTagType(room.vacancyDays)" effect="dark">空置 {{ room.vacancyDays }} 天</el-tag>
                      </template>
                      <template v-else>
                        <span class="tenant muted">—</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <el-empty v-if="!currentFloors.length" description="请在左侧选择项目 / 分区 / 楼层" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- ===== 管控规则（原有功能保留） ===== -->
      <el-tab-pane label="管控规则" name="rules">
        <div class="rules-toolbar">
          <el-button type="primary" @click="openAddDialog">新增管控规则</el-button>
          <el-button @click="handleExport">导出</el-button>
        </div>

        <el-card class="filter-bar" shadow="never">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-input v-model="filters.keyword" placeholder="规则编号/规则名称" clearable prefix-icon="Search" />
            </el-col>
            <el-col :span="6">
              <el-select v-model="filters.controlType" placeholder="管控类型" clearable>
                <el-option label="使用限制" value="使用限制" />
                <el-option label="处置限制" value="处置限制" />
                <el-option label="租赁限制" value="租赁限制" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-select v-model="filters.status" placeholder="状态" clearable>
                <el-option label="启用" :value="true" />
                <el-option label="停用" :value="false" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="table-card fill" shadow="never">
          <el-table :data="pagedData" border stripe>
            <el-table-column prop="ruleNo" label="规则编号" width="130" />
            <el-table-column prop="ruleName" label="规则名称" min-width="180" />
            <el-table-column prop="controlType" label="管控类型" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ row.controlType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="scope" label="适用范围" width="140" />
            <el-table-column prop="description" label="规则描述" min-width="240" show-overflow-tooltip />
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="createTime" label="创建时间" width="120" align="center" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="onStatusChange(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="page"
              :page-size="pageSize"
              :total="filteredData.length"
              layout="total, prev, pager, next"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 资产全信息统一视图抽屉 -->
    <AssetDetailDrawer v-model="assetDrawer" :asset="selectedAsset" />

    <!-- 新增管控规则对话框 -->
    <el-dialog v-model="addDialogVisible" :title="isEdit ? '编辑管控规则' : '新增管控规则'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="管控类型" prop="controlType">
          <el-select v-model="form.controlType" style="width: 100%">
            <el-option label="使用限制" value="使用限制" />
            <el-option label="处置限制" value="处置限制" />
            <el-option label="租赁限制" value="租赁限制" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用范围" prop="scope">
          <el-select v-model="form.scope" style="width: 100%" placeholder="请选择适用范围">
            <el-option label="全部资产" value="全部资产" />
            <el-option label="房产类" value="房产类" />
            <el-option label="土地类" value="土地类" />
            <el-option label="设备类" value="设备类" />
            <el-option label="车辆类" value="车辆类" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入规则描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, LocationInformation, Search } from '@element-plus/icons-vue'
import { useProjectStore } from '../../store/project'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useMortgageStore } from '../../store/mortgage'
import AssetDetailDrawer from '../../components/AssetDetailDrawer.vue'
const projectStore = useProjectStore()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const mortgageStore = useMortgageStore()

const activeTab = ref('pano')

// ===== 空间管控看板 =====
const statusList = ['已出租', '空置', '闲置', '自用']
const statusColorMap = { '已出租': '#67c23a', '部分出租': '#67c23a', '空置': '#e6a23c', '闲置': '#f56c6c', '自用': '#409eff' }
function statusColor(s) { return statusColorMap[s] || '#909399' }
function vacancyTagType(days) { return days >= 180 ? 'danger' : days >= 90 ? 'warning' : 'info' }
function levelTagType(lv) { return { '项目': 'primary', '分区': 'success', '楼层': 'warning', '资产': 'info' }[lv] || 'info' }

// 平铺资产挂进项目时可能只写了名字（新建分区/楼层），统一按名字归位
const zoneOf = a => a.zoneName || '未分区'
const floorOf = a => a.floorName || '未分层'

const treeProps = { label: 'label', children: 'children' }
const treeRef = ref(null)
const treeFilter = ref('')

// 层级树按资产台账的真实归集口径生成：项目自带房间 + 从台账挂进来的平铺资产
const treeData = computed(() => projectStore.visibleProjects.map(b => {
  const byZone = new Map()
  assetStore.getProjectAssets(b.id).forEach(a => {
    if (!byZone.has(zoneOf(a))) byZone.set(zoneOf(a), [])
    byZone.get(zoneOf(a)).push(a)
  })
  return {
    key: b.id, label: b.name, level: '项目', ref: b, type: 'project',
    children: [...byZone.entries()].map(([zName, zAssets]) => {
      const byFloor = new Map()
      zAssets.forEach(a => {
        if (!byFloor.has(floorOf(a))) byFloor.set(floorOf(a), [])
        byFloor.get(floorOf(a)).push(a)
      })
      return {
        key: `${b.id}|${zName}`, label: zName, level: '分区', ref: { name: zName }, type: 'partition', project: b,
        children: [...byFloor.entries()].map(([fName, fAssets]) => ({
          key: `${b.id}|${zName}|${fName}`, label: fName, level: '楼层', ref: { name: fName }, type: 'floor', project: b, partition: { name: zName },
          children: fAssets.map(a => ({
            key: a.id, label: a.name, level: '资产', ref: a, type: 'asset', statusDot: a.status,
            project: b, partition: { name: zName }, floor: { name: fName }
          }))
        }))
      }
    })
  }
}))

watch(treeFilter, v => treeRef.value?.filter(v))
function filterNode(value, data) {
  if (!value) return true
  return data.label.includes(value)
}

const selectedNode = ref(null)
const selectedAsset = ref(null)
const assetDrawer = ref(false)

function onNodeClick(data) {
  selectedNode.value = data
  if (data.type === 'asset') {
    openAsset(data.ref)
  }
}

function openAsset(asset) {
  selectedAsset.value = asset
  assetDrawer.value = true
}

const boardTitle = computed(() => {
  const n = selectedNode.value
  if (!n) return '全部项目'
  if (n.type === 'project') return n.ref.name
  if (n.type === 'partition') return `${n.project.name} / ${n.label}`
  if (n.type === 'floor') return `${n.project.name} / ${n.partition.name} / ${n.label}`
  return n.project.name
})

// 右侧楼层块：把当前范围内的资产按「分区 / 楼层」重新分块
const currentFloors = computed(() => {
  const n = selectedNode.value
  let pool
  if (!n) {
    const ids = new Set(projectStore.visibleProjects.map(b => b.id))
    pool = assetStore.visibleAssets.filter(a => ids.has(a.projectId))
  } else if (n.type === 'project') {
    pool = assetStore.getProjectAssets(n.key)
  } else if (n.type === 'partition') {
    pool = assetStore.getProjectAssets(n.project.id).filter(a => zoneOf(a) === n.label)
  } else if (n.type === 'floor' || n.type === 'asset') {
    pool = assetStore.getProjectAssets(n.project.id).filter(a => zoneOf(a) === n.partition.name && floorOf(a) === n.floor.name)
  } else {
    pool = []
  }
  const blocks = new Map()
  pool.forEach(a => {
    const key = `${zoneOf(a)} / ${floorOf(a)}`
    if (!blocks.has(key)) blocks.set(key, { id: key, name: key, area: 0, rooms: [] })
    const block = blocks.get(key)
    block.rooms.push(a)
    block.area += Number(a.area) || 0
  })
  return [...blocks.values()].map(b => ({ ...b, area: Math.round(b.area * 100) / 100 }))
})

const boardStats = computed(() => {
  const rooms = currentFloors.value.flatMap(f => f.rooms)
  const total = rooms.length
  const rented = rooms.filter(r => r.status === '已出租' || r.status === '部分出租').length
  const vacant = rooms.filter(r => r.status === '空置' || r.status === '闲置').length
  const rate = total ? Math.round(rented / total * 10000) / 100 : 0
  return { total, rented, vacant, rate }
})

const panoView = ref('map')
const panoFloor = ref('')
const panoStatus = ref('')
const panoVacBucket = ref('')
const panoExpBucket = ref('')
const panoUnrentable = ref(false)
const panoAreaKw = ref('')

const panoSelectedProjectId = ref(projectStore.visibleProjects[0]?.id || '')

// 选中的项目可能被切号/删除掉，兜底回本公司第一个项目
const activeProjectId = computed(() =>
  projectStore.visibleProjects.some(b => b.id === panoSelectedProjectId.value)
    ? panoSelectedProjectId.value
    : (projectStore.visibleProjects[0]?.id || '')
)

const panoTreeRef = ref(null)
const panoTreeFilter = ref('')
watch(panoTreeFilter, v => panoTreeRef.value?.filter(v))

const panoTreeData = computed(() => projectStore.visibleProjects.map(b => ({
  key: b.id, label: b.name, level: '项目', type: 'project',
  children: [...new Set(assetStore.getProjectAssets(b.id).map(a => zoneOf(a)))].map(z => ({
    key: `${b.id}|${z}`, label: z, level: '分区', type: 'partition', projectId: b.id
  }))
})))

function onPanoNodeClick(data) {
  if (data.type === 'project') {
    panoSelectedProjectId.value = data.key
  } else if (data.type === 'partition') {
    panoSelectedProjectId.value = data.projectId
  }
}

function projectTypeTag(type) {
  return { '住宅项目': '住宅类', '交通枢纽': '交通类', '商业办公': '商业类', '产业园区': '产业类' }[type] || '综合类'
}

const currentPanoProject = computed(() => {
  const b = projectStore.visibleProjects.find(x => x.id === activeProjectId.value)
  if (!b) return { name: '—', typeTag: '—', address: '—', image: '' }
  return { name: b.name, typeTag: projectTypeTag(b.type), address: b.address, image: b.image }
})

const currentPanoFloors = computed(() =>
  [...new Set(assetStore.getProjectAssets(activeProjectId.value).map(a => floorOf(a)))]
)

watch(activeProjectId, () => {
  const floors = currentPanoFloors.value
  if (!floors.includes(panoFloor.value)) panoFloor.value = floors[0] || ''
}, { immediate: true })

const panoStatusList = ['已租赁', '未租赁', '审批中', '已占用', '处置中', '流转中', '调拨中']
const panoStatusColors = { '已租赁': '#1668DC', '未租赁': '#909399', '审批中': '#E8912A', '已占用': '#722ed1', '处置中': '#D93026', '流转中': '#13c2c2', '调拨中': '#18A058' }
function panoColor(s) { return panoStatusColors[s] || '#909399' }
function cardTint(s) {
  return { '已租赁': 'tint-leased', '未租赁': 'tint-idle', '审批中': 'tint-approve', '已占用': 'tint-occupied', '处置中': 'tint-dispose', '流转中': 'tint-transfer', '调拨中': 'tint-allocate' }[s] || ''
}
function listStatusTag(s) {
  return { '已租赁': 'primary', '未租赁': 'info', '审批中': 'warning', '已占用': 'danger', '处置中': 'danger', '流转中': 'success', '调拨中': 'success' }[s] || 'info'
}

const vacancyBuckets = [
  { label: '空置0-90天', min: 0, max: 90, color: '#18A058' },
  { label: '空置91-180天', min: 91, max: 180, color: '#E8912A' },
  { label: '空置180天以上', min: 181, max: Infinity, color: '#D93026' }
]
const expiryBuckets = [
  { label: '到期0-90天', min: 0, max: 90, color: '#D93026' },
  { label: '到期91-180天', min: 91, max: 180, color: '#E8912A' },
  { label: '到期180天以上', min: 181, max: Infinity, color: '#18A058' }
]

// 抵押看融资台账里是否还有未解押的记录，权证看资产自身的办证状态
const activeMortgageAssetIds = computed(() => new Set(
  mortgageStore.mortgages.filter(m => m.status === '抵押中').map(m => m.assetId)
))

const allPanoAssets = computed(() => {
  const projects = new Map(projectStore.visibleProjects.map(b => [b.id, b]))
  return assetStore.visibleAssets
    .filter(a => a.projectId && projects.has(a.projectId))
    .map(a => {
      const b = projects.get(a.projectId)
      const status = a.status === '已出租' || a.status === '部分出租' ? '已租赁'
        : a.status === '自用' ? '已占用' : '未租赁'
      return {
        id: a.id, projectId: b.id, projectName: b.name,
        projectTypeTag: projectTypeTag(b.type), projectAddress: b.address, projectImage: b.image,
        zone: zoneOf(a), floor: floorOf(a), assetNo: a.assetNo || a.id, name: a.name,
        location: a.location || `${b.name}${zoneOf(a)}${floorOf(a)}`,
        type: a.assetCategory || '房产类', area: Number(a.area) || 0,
        status,
        mortgaged: activeMortgageAssetIds.value.has(a.id),
        propertyRight: a.certStatus === '已办证', propertyNo: a.certDetail || '—',
        used: status !== '未租赁', rentable: status !== '已占用',
        tenant: a.tenant || null, expiry: a.leaseExpiry || null,
        vacantDays: a.vacancyDays ?? null
      }
    })
})

const projectPanoAssets = computed(() => allPanoAssets.value.filter(a => a.projectId === activeProjectId.value))

const panoReceipts = computed(() => contractStore.projectReceipts(activeProjectId.value))

const panoKpis = computed(() => {
  const list = projectPanoAssets.value
  const total = list.length
  const area = list.reduce((s, a) => s + a.area, 0)
  const rented = list.filter(a => a.status === '已租赁').length
  const idle = list.filter(a => a.status === '未租赁').length
  const rate = total ? Math.round(rented / total * 1000) / 10 : 0
  const r = panoReceipts.value
  return [
    { label: '资产总数', value: total, unit: '项' },
    { label: '资产面积', value: area.toFixed(2), unit: '㎡' },
    { label: '在租', value: rented, unit: '项' },
    { label: '闲置', value: idle, unit: '项' },
    { label: '出租率', value: rate, unit: '%' },
    { label: '累计实收', value: r.cumActual, unit: '万元' },
    { label: '本年实收', value: r.yearActual, unit: '万元' },
    { label: '上月收费率', value: r.lastMonthRate, unit: '%' }
  ]
})

function panoStatusCount(s) { return projectPanoAssets.value.filter(a => a.status === s).length }

function daysToExpiry(a) {
  if (!a.expiry) return null
  return Math.ceil((new Date(a.expiry).getTime() - Date.now()) / 86400000)
}
function expiringSoon(a) {
  const d = daysToExpiry(a)
  return d !== null && d >= 0 && d <= 90
}
function parseAreaKw(v) {
  const s = String(v || '').trim().replace(/~/g, '-')
  if (!s) return null
  const m = s.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/)
  if (m) return [parseFloat(m[1]), parseFloat(m[2])]
  const n = parseFloat(s)
  if (!isNaN(n)) return [n, Infinity]
  return null
}
function inBucket(days, bucket) {
  return days !== null && days !== undefined && days >= bucket.min && days <= bucket.max
}

const panoCardAssets = computed(() => projectPanoAssets.value.filter(a => {
  if (panoStatus.value && a.status !== panoStatus.value) return false
  if (panoVacBucket.value) {
    const b = vacancyBuckets.find(x => x.label === panoVacBucket.value)
    if (a.status === '已租赁' || !inBucket(a.vacantDays, b)) return false
  }
  if (panoExpBucket.value) {
    const b = expiryBuckets.find(x => x.label === panoExpBucket.value)
    if (!inBucket(daysToExpiry(a), b)) return false
  }
  if (panoUnrentable.value && a.rentable) return false
  const rng = parseAreaKw(panoAreaKw.value)
  if (rng && (a.area < rng[0] || a.area > rng[1])) return false
  return true
}))

const panoFloorAssets = computed(() => panoCardAssets.value.filter(a => a.floor === panoFloor.value))

const usedCount = computed(() => projectPanoAssets.value.filter(a => a.used).length)
const unusedCount = computed(() => projectPanoAssets.value.length - usedCount.value)
const usedPct = computed(() => projectPanoAssets.value.length ? Math.round(usedCount.value / projectPanoAssets.value.length * 100) : 0)

const typeColors = { '房产类': '#1668DC', '设备类': '#E8912A', '车位类': '#13c2c2' }
const typeStats = computed(() => {
  const map = {}
  projectPanoAssets.value.forEach(a => { map[a.type] = (map[a.type] || 0) + 1 })
  return Object.keys(map).map(k => ({ name: k, count: map[k], color: typeColors[k] || '#909399' }))
})
const typePieStyle = computed(() => {
  const total = projectPanoAssets.value.length || 1
  let acc = 0
  const stops = typeStats.value.map(t => {
    const from = acc / total * 360
    acc += t.count
    const to = acc / total * 360
    return `${t.color} ${from}deg ${to}deg`
  })
  return { background: `conic-gradient(${stops.join(', ')})` }
})

const monthlyReceipts = computed(() => panoReceipts.value.months)
const maxReceipt = computed(() => Math.max(1, ...monthlyReceipts.value.map(x => x.v)))

const listQ = ref({ assetNo: '', status: '', type: '', zone: '' })
const listPage = ref(1)
const listPageSize = ref(15)
const panoTypes = computed(() => [...new Set(projectPanoAssets.value.map(a => a.type))])
const panoZones = computed(() => [...new Set(projectPanoAssets.value.map(a => a.zone))])

const listFiltered = computed(() => projectPanoAssets.value.filter(a => {
  const kw = listQ.value.assetNo.trim()
  if (kw && !a.assetNo.includes(kw)) return false
  if (listQ.value.status && a.status !== listQ.value.status) return false
  if (listQ.value.type && a.type !== listQ.value.type) return false
  if (listQ.value.zone && a.zone !== listQ.value.zone) return false
  return true
}))
const listPaged = computed(() => {
  const start = (listPage.value - 1) * listPageSize.value
  return listFiltered.value.slice(start, start + listPageSize.value)
})
function handlePanoSearch() {
  listPage.value = 1
  ElMessage.success('查询完成')
}

// ===== 管控规则（原有逻辑） =====
const filters = ref({ keyword: '', controlType: '', status: '' })
const page = ref(1)
const pageSize = 15

const rules = ref([
  { id: 1, ruleNo: 'CTRL2024001', ruleName: '房产出租年限控制', controlType: '租赁限制', scope: '房产类', description: '单次出租合同期限不得超过5年，超过需经总经理审批', creator: '张伟', createTime: '2024-05-12', enabled: true },
  { id: 2, ruleNo: 'CTRL2024002', ruleName: '闲置资产处置审批', controlType: '处置限制', scope: '全部资产', description: '闲置超过6个月的资产处置需走多级审批流程', creator: '李娜', createTime: '2024-06-03', enabled: true },
  { id: 3, ruleNo: 'CTRL2024003', ruleName: '车辆使用范围限制', controlType: '使用限制', scope: '车辆类', description: '公司车辆仅限公务使用，非公务使用需提前申请', creator: '王强', createTime: '2024-07-18', enabled: true },
  { id: 4, ruleNo: 'CTRL2024004', ruleName: '设备租赁最低价格', controlType: '租赁限制', scope: '设备类', description: '设备类资产租赁单价不得低于评估价的85%', creator: '赵敏', createTime: '2024-08-01', enabled: false },
  { id: 5, ruleNo: 'CTRL2024005', ruleName: '土地资产禁止处置', controlType: '处置限制', scope: '土地类', description: '所有土地类资产原则上不允许转让处置，特殊情形需董事会决议', creator: '孙磊', createTime: '2024-08-20', enabled: true },
  { id: 6, ruleNo: 'CTRL2024006', ruleName: '商业用房用途管制', controlType: '使用限制', scope: '房产类', description: '商业用房承租方经营范围须符合消防及规划要求', creator: '周琳', createTime: '2024-09-05', enabled: true },
])

const filteredData = computed(() => {
  return rules.value.filter(r => {
    if (filters.value.keyword && !(r.ruleNo.includes(filters.value.keyword) || r.ruleName.includes(filters.value.keyword))) return false
    if (filters.value.controlType && r.controlType !== filters.value.controlType) return false
    if (filters.value.status !== '' && filters.value.status !== null && r.enabled !== filters.value.status) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredData.value.slice(start, start + pageSize)
})

function onStatusChange(row) {
  ElMessage.success(`规则 ${row.ruleName} 已${row.enabled ? '启用' : '停用'}`)
}

const addDialogVisible = ref(false)
const isEdit = ref(false)
const editingRow = ref(null)
const formRef = ref(null)
const form = ref({ ruleName: '', controlType: '', scope: '', description: '' })
const formRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  controlType: [{ required: true, message: '请选择管控类型', trigger: 'change' }],
  scope: [{ required: true, message: '请选择适用范围', trigger: 'change' }],
  description: [{ required: true, message: '请输入规则描述', trigger: 'blur' }],
}

function openAddDialog() {
  isEdit.value = false
  editingRow.value = null
  form.value = { ruleName: '', controlType: '', scope: '', description: '' }
  addDialogVisible.value = true
}
function submitAdd() {
  formRef.value.validate(valid => {
    if (!valid) return
    if (isEdit.value && editingRow.value) {
      Object.assign(editingRow.value, {
        ruleName: form.value.ruleName,
        controlType: form.value.controlType,
        scope: form.value.scope,
        description: form.value.description,
      })
      addDialogVisible.value = false
      ElMessage.success('管控规则已更新')
    } else {
      const no = 'CTRL' + Date.now()
      rules.value.unshift({
        id: rules.value.length + 1,
        ruleNo: no,
        ruleName: form.value.ruleName,
        controlType: form.value.controlType,
        scope: form.value.scope,
        description: form.value.description,
        creator: '管理员',
        createTime: new Date().toISOString().slice(0, 10),
        enabled: true,
      })
      addDialogVisible.value = false
      ElMessage.success('管控规则已新增')
    }
  })
}

function handleSearch() { page.value = 1; ElMessage.success('查询完成') }
function resetFilters() { filters.value = { keyword: '', controlType: '', status: '' }; page.value = 1 }
function handleExport() {
  const headers = ['规则编号', '规则名称', '管控类型', '适用范围', '规则描述', '创建人', '创建时间', '状态']
  const rows = rules.value.map(r => [r.ruleNo, r.ruleName, r.controlType, r.scope, r.description, r.creator, r.createTime, r.enabled ? '已启用' : '已停用'])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `管控规则_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
function handleEdit(row) {
  isEdit.value = true
  editingRow.value = row
  form.value = { ruleName: row.ruleName, controlType: row.controlType, scope: row.scope, description: row.description }
  addDialogVisible.value = true
}
function handleDelete(row) {
  ElMessageBox.confirm(`确认删除规则「${row.ruleName}」？删除后不可恢复`, '删除确认', { type: 'warning' })
    .then(() => {
      rules.value = rules.value.filter(r => r.id !== row.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.page-header h2 { margin: 0; font-size: 20px; }
.card-hd { display: flex; justify-content: space-between; align-items: center; }
.tree-card { min-height: 560px; }
.board-card { min-height: 560px; }
.tree-node { display: flex; align-items: center; gap: 4px; }
.lv-tag { transform: scale(0.82); }
.is-asset { font-size: 13px; }
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 4px; }
.legend { display: flex; gap: 14px; font-size: 12px; color: var(--t-sub); }
.legend-item { display: flex; align-items: center; gap: 4px; }
.kpi-row { margin-bottom: 16px; }
.kpi { background: var(--bg-th); border-radius: 8px; padding: 12px; text-align: center; }
.kpi-v { font-size: 24px; font-weight: 600; }
.kpi-l { font-size: 12px; color: #909399; margin-top: 4px; }
.floor-block { margin-bottom: 18px; }
.floor-hd { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #eef2f8; border-radius: 6px; margin-bottom: 10px; }
.floor-name { font-weight: 600; }
.floor-area { font-size: 12px; color: #909399; }
.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
.room-cell { border: 2px solid var(--bd); border-left-width: 5px; border-radius: 6px; padding: 8px 10px; cursor: pointer; background: #fff; transition: box-shadow .15s; }
.room-cell:hover { box-shadow: 0 2px 10px rgba(0,0,0,.1); }
.room-cell.active { box-shadow: 0 0 0 2px rgba(64,158,255,.3); }
.room-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.room-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.room-status { color: #fff; font-size: 12px; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.room-area { font-size: 12px; color: var(--t-sub); margin: 4px 0; }
.room-foot { font-size: 12px; }
.tenant { color: var(--t-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.tenant.muted { color: var(--t-weak); }
.pano-head-card { margin-bottom: 12px; }
.proj-head { display: flex; gap: 16px; align-items: stretch; margin-bottom: 4px; }
.proj-photo { width: 132px; height: 92px; flex: none; border-radius: 6px; background: linear-gradient(135deg, #e8eef7, #d6e2f0); color: #8aa2c0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 12px; border: 1px dashed #c3d3e8; }
.proj-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.proj-name { font-size: 17px; font-weight: 600; color: var(--t-main); display: flex; align-items: center; gap: 8px; }
.proj-addr { font-size: 13px; color: #888; display: flex; align-items: center; gap: 4px; }
.ana-row { margin-bottom: 12px; }
.ana-card :deep(.el-card__body) { padding: 12px 16px; }
.ana-body { display: flex; align-items: center; gap: 16px; }
.donut-center { display: flex; flex-direction: column; align-items: center; line-height: 1.3; }
.donut-center b { font-size: 17px; color: var(--c-primary); }
.donut-center span { font-size: 12px; color: var(--t-weak); }
.ana-legend { font-size: 12px; color: var(--t-sub); display: flex; flex-direction: column; gap: 6px; }
.ana-legend .dot { margin: 0 6px 0 0; }
.type-pie { width: 88px; height: 88px; border-radius: 50%; flex: none; box-shadow: inset 0 0 0 14px #fff; }
.bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 96px; padding-top: 4px; }
.bar-col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 3px; }
.bar { width: 100%; max-width: 16px; background: linear-gradient(180deg, #4facfe, var(--c-primary)); border-radius: 2px 2px 0 0; min-height: 2px; }
.bar-m { font-size: 12px; color: var(--t-weak); white-space: nowrap; }
.chip-row .dot { margin: 0 5px 0 0; }
.pano-filter { display: flex; align-items: center; gap: 16px; margin: 4px 0 14px; }
.pano-tip { font-size: 12px; color: #bbb; }
.pano-map { display: flex; gap: 18px; align-items: flex-start; }
.floor-nav { display: flex; flex-direction: column; gap: 12px; flex: none; padding-top: 4px; }
.floor-circle { width: 46px; height: 46px; border-radius: 50%; background: var(--bg-page); border: 1px solid #E2E8F0; color: var(--t-sub); font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
.floor-circle:hover { color: var(--c-primary); border-color: var(--c-primary); }
.floor-circle.active { background: var(--c-primary); border-color: var(--c-primary); color: #fff; box-shadow: 0 2px 8px rgba(22,104,220,.35); }
.floor-panel { flex: 1; min-width: 0; }
.pano-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 10px; }
.pano-card { border: 1px solid #E2E8F0; border-left: 4px solid var(--bd); border-radius: 6px; padding: 8px 10px; font-size: 12px; transition: box-shadow .15s; }
.pano-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.1); }
.tint-leased { background: #eef3fa; }
.tint-idle { background: #fff; }
.tint-approve { background: #fffbe6; }
.tint-occupied { background: #f9f0ff; }
.tint-dispose { background: #fff1f0; }
.tint-transfer { background: #e6fffb; }
.tint-allocate { background: #f0fff0; }
.pano-tree-card { min-height: 560px; }
.pano-tree-card :deep(.el-card__body) { padding: 10px; }
.proj-photo-img { width: 132px; height: 92px; object-fit: cover; border-radius: 6px; flex: none; border: 1px solid #E2E8F0; }
.pc-top { display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; }
.pc-name { font-size: 13px; font-weight: 600; color: var(--t-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-badge { flex: none; color: #fff; font-size: 12px; padding: 1px 6px; border-radius: 3px; }
.pc-row { color: var(--t-sub); margin-top: 3px; }
.pc-tags { display: flex; align-items: center; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.pc-sep { color: #ccc; }
.pc-tenant { color: var(--t-main); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pc-expiry { color: var(--c-danger); font-weight: 600; }
.list-filter { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.rules-toolbar { margin-bottom: 16px; }
.filter-bar { margin-bottom: 16px; }
.filter-bar :deep(.el-select) { width: 100%; }
.table-card { margin-bottom: 16px; }
.pagination-wrap { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
