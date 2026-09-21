<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ isRegionMode ? '区域划分（行政区 / 片区管理）' : '资产地图（三级下钻）' }}</h2>
      <div v-if="isRegionMode">
        <el-button type="primary" size="small" @click="openZoneDialog(null)">
          <el-icon><Plus /></el-icon>
          新增区域
        </el-button>
        <el-button size="small" @click="openZoneDialog(activeZone || zoneTree[0])">调整划分</el-button>
      </div>
    </div>
    <el-card>

      <!-- ============ 区域划分视图（/ent/region-division） ============ -->
      <div v-if="isRegionMode" class="region-wrap">
        <div class="region-left">
          <el-card>
            <template #header><span>区域 / 行政区</span></template>
            <el-tree
              :data="zoneTree"
              node-key="id"
              :props="{ label: 'name', children: 'children' }"
              default-expand-all
              highlight-current
              :expand-on-click-node="false"
              @node-click="handleZoneNodeClick"
            >
              <template #default="{ data }">
                <span class="zt-node">
                  <el-icon v-if="!data.children" color="#1890ff"><LocationFilled /></el-icon>
                  <el-icon v-else color="#1890ff"><OfficeBuilding /></el-icon>
                  <span class="zt-name">{{ data.name }}</span>
                  <el-tag size="small" type="info" effect="plain">{{ data.count }} 项</el-tag>
                </span>
              </template>
            </el-tree>
            <div class="zt-summary">
              共 {{ zoneStats.zoneCount }} 个区县 · {{ zoneStats.streetCount }} 个街道/片区 · {{ zoneStats.projectCount }} 个管辖项目
            </div>
          </el-card>
        </div>

        <div class="region-right">
          <el-card>
            <template #header>
              <div class="rr-head">
                <span>{{ activeZone ? activeZone.name + ' — 区域划分详情' : '区域划分详情' }}</span>
                <el-radio-group v-model="boardView" size="small">
                  <el-radio-button label="cards">卡片视图</el-radio-button>
                  <el-radio-button label="blocks">色块示意图</el-radio-button>
                </el-radio-group>
              </div>
            </template>

            <div class="detail-grid" style="margin-bottom:14px">
              <div class="dg-item"><span class="dg-label">区域数</span><span class="dg-value">{{ activeZoneChildren.length }}</span></div>
              <div class="dg-item"><span class="dg-label">管辖项目数</span><span class="dg-value">{{ activeZoneChildren.reduce((s, z) => s + z.projectCount, 0) }}</span></div>
              <div class="dg-item"><span class="dg-label">资产总数</span><span class="dg-value">{{ activeZoneChildren.reduce((s, z) => s + z.assetCount, 0) }} 宗</span></div>
              <div class="dg-item"><span class="dg-label">总面积</span><span class="dg-value">{{ activeZoneChildren.reduce((s, z) => s + z.area, 0).toLocaleString() }} m²</span></div>
            </div>

            <template v-if="boardView === 'cards'">
              <div class="section-title">街道 / 片区一览</div>
              <div class="zone-card-grid">
                <div
                  v-for="z in activeZoneChildren"
                  :key="z.id"
                  class="zone-card"
                  :class="{ on: selectedZoneId === z.id }"
                  :style="{ borderTopColor: z.color }"
                  @click="selectedZoneId = z.id"
                >
                  <div class="zc-head">
                    <span class="zc-name">{{ z.name }}</span>
                    <el-tag size="small" :color="z.color" style="color:#fff;border:none">{{ z.type }}</el-tag>
                  </div>
                  <div class="zc-stats">
                    <div class="zc-stat"><span class="label">管辖项目数</span><span class="value">{{ z.projectCount }}</span></div>
                    <div class="zc-stat"><span class="label">资产数</span><span class="value">{{ z.assetCount }} 宗</span></div>
                    <div class="zc-stat"><span class="label">面积</span><span class="value">{{ z.area.toLocaleString() }} m²</span></div>
                    <div class="zc-stat"><span class="label">负责人</span><span class="value">{{ z.owner }}</span></div>
                  </div>
                  <div class="zc-foot">
                    <el-button type="primary" link size="small" @click.stop="openZoneDialog(z, true)">编辑边界</el-button>
                    <el-button type="primary" link size="small" @click.stop="openZoneDialog(z)">调整划分</el-button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="section-title">区域色块示意图（按资产规模着色）</div>
              <div class="block-map">
                <div
                  v-for="z in activeZoneChildren"
                  :key="'blk-' + z.id"
                  class="block-cell"
                  :class="{ on: selectedZoneId === z.id }"
                  :style="{ background: z.color, gridColumn: 'span ' + z.span }"
                  @click="selectedZoneId = z.id"
                >
                  <div class="bc-name">{{ z.name }}</div>
                  <div class="bc-meta">{{ z.assetCount }} 宗 · {{ z.area.toLocaleString() }} m²</div>
                  <div class="bc-owner">负责人：{{ z.owner }}</div>
                </div>
              </div>
              <div class="block-legend">
                <span v-for="z in activeZoneChildren" :key="'lg-' + z.id" class="lg-chip">
                  <i :style="{ background: z.color }"></i>{{ z.name }}
                </span>
              </div>
            </template>

            <div class="section-title" style="margin-top:18px">区域划分清单</div>
            <el-table :data="activeZoneChildren" border stripe size="small" class="rd-table">
              <el-table-column prop="name" label="区域名称" min-width="130" />
              <el-table-column prop="type" label="类型" width="90" />
              <el-table-column prop="projectCount" label="管辖项目数" width="100" align="right" />
              <el-table-column prop="assetCount" label="资产数(宗)" width="100" align="right" />
              <el-table-column label="面积(m²)" width="110" align="right">
                <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="owner" label="负责人" width="90" />
              <el-table-column prop="code" label="区划代码" width="120" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openZoneDialog(row, true)">编辑边界</el-button>
                  <el-button type="primary" link size="small" @click="openZoneDialog(row)">调整划分</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination small layout="total, prev, pager, next" :total="activeZoneChildren.length" :page-size="20" />
            </div>
          </el-card>
        </div>
      </div>

      <!-- ============ GIS 资产地图 — 长乐区真实地理 ============ -->
      <div v-else class="geo-map" ref="geoMapRef">
        <!-- 顶部面包屑 -->
        <div class="geo-breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click="drillTo(0)">
              <span style="cursor:pointer;color:#1890ff">长乐区</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="drillLevel >= 1" @click="drillTo(1)">
              <span style="cursor:pointer;color:#1890ff">{{ currentTown?.name || '' }}</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="drillLevel >= 2">
              <span>{{ currentProject?.name || '' }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-button v-if="drillLevel > 0" link type="primary" size="small" @click="drillTo(drillLevel - 1)" style="margin-left:12px;color:#1890ff">
            ← 返回上一级
          </el-button>
        </div>

        <!-- Level 0 & 1: 高德地图 -->
        <div v-if="drillLevel < 2" ref="amapContainerRef" class="amap-container"></div>

        <!-- 左侧 KPI 面板 -->
        <div class="geo-kpi-panel" v-show="drillLevel === 0 && kpiPanelVisible">
          <div class="gkp-title">
            <span>长乐区资产总览</span>
            <el-button link size="small" @click="kpiPanelVisible = false" style="color:#999;padding:0;margin-left:8px">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="gkp-grid">
            <div class="gkp-item" v-for="k in geoKpis" :key="k.label">
              <div class="gkp-value">{{ k.value }}<span class="gkp-unit">{{ k.unit }}</span></div>
              <div class="gkp-label">{{ k.label }}</div>
            </div>
          </div>
          <div class="gkp-rank-title">各乡镇资产排行</div>
          <div class="gkp-rank">
            <div class="gkp-rank-row" v-for="r in townRank" :key="r.code">
              <span class="gkp-rank-name">{{ r.name }}</span>
              <div class="gkp-rank-bar"><div class="gkp-rank-fill" :style="{ width: r.pct + '%' }"></div></div>
              <span class="gkp-rank-val">{{ r.count }}</span>
            </div>
          </div>
        </div>

        <!-- KPI 面板收起后的重新打开按钮 -->
        <div v-if="drillLevel === 0 && !kpiPanelVisible" class="geo-kpi-toggle" @click="kpiPanelVisible = true">
          <el-icon><LocationFilled /></el-icon>
          <span>资产总览</span>
        </div>

        <!-- Level 1: 镇项目列表侧栏 -->
        <div class="geo-town-panel" v-show="drillLevel === 1">
          <div class="gtp-title">{{ currentTown?.name }} — 项目列表</div>
          <div class="gtp-stats">
            <div class="gtp-stat"><span class="label">资产总数</span><span class="value">{{ currentTown?.assetCount || 0 }} 宗</span></div>
            <div class="gtp-stat"><span class="label">总面积</span><span class="value">{{ (currentTown?.totalArea || 0).toLocaleString() }} m²</span></div>
            <div class="gtp-stat"><span class="label">出租率</span><span class="value">{{ currentTown?.rentalRate || 0 }}%</span></div>
          </div>
          <div class="gtp-list">
            <div class="gtp-card" v-for="p in currentTownProjects" :key="p.id" @click="handleProjectClick(p)">
              <div class="gtp-card-name">{{ p.name }}</div>
              <div class="gtp-card-row">
                <span>{{ p.totalAssets }} 宗</span>
                <span>{{ p.totalArea.toLocaleString() }} m²</span>
              </div>
              <div class="gtp-card-row">
                <span>出租率 <b :style="{ color: p.rentalRate > 70 ? '#52c41a' : '#faad14' }">{{ p.rentalRate }}%</b></span>
                <span>年租金 {{ p.yearIncome }} 万</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Level 2: 项目资产明细 -->
        <div v-if="drillLevel === 2" class="geo-detail">
          <div class="gd-kpis">
            <div class="gd-kpi" v-for="k in projKpis" :key="k.label">
              <div class="gd-kpi-value" :style="{ color: k.color }">{{ k.value }}<span class="gd-kpi-unit">{{ k.unit }}</span></div>
              <div class="gd-kpi-label">{{ k.label }}</div>
            </div>
          </div>
          <div class="gd-charts">
            <div class="gd-card">
              <div class="gd-card-title">是否租赁</div>
              <div ref="rentDonutRef" class="gd-chart"></div>
            </div>
            <div class="gd-card">
              <div class="gd-card-title">资产类型</div>
              <div ref="typePieRef" class="gd-chart"></div>
            </div>
            <div class="gd-card">
              <div class="gd-card-title">近一年每月实收(万元)</div>
              <div ref="monthBarRef" class="gd-chart"></div>
            </div>
          </div>
          <div class="gd-progress">
            <div class="gd-prog">
              <div class="gd-prog-head"><span>出租率</span><b style="color:#52c41a">{{ ovRentRate }}%</b></div>
              <el-progress :percentage="ovRentRate" :show-text="false" :stroke-width="10" color="#52c41a" />
              <div class="gd-prog-frac">已出租 {{ ovRentedCount }} / 总计 {{ ovTotalCount }} 宗</div>
            </div>
            <div class="gd-prog">
              <div class="gd-prog-head"><span>上月收费率</span><b style="color:#1890ff">{{ ovChargeRate }}%</b></div>
              <el-progress :percentage="ovChargeRate" :show-text="false" :stroke-width="10" color="#1890ff" />
              <div class="gd-prog-frac">实收 96.8 / 应收 112.0 万元</div>
            </div>
          </div>
          <div class="gd-toggle">
            <el-radio-group v-model="detailView" size="small">
              <el-radio-button label="map">分布图展示</el-radio-button>
              <el-radio-button label="list">列表展示</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="detailView === 'map'" class="gd-mapview">
            <div class="gd-side">
              <div class="gd-side-title">楼栋</div>
              <div class="gd-building" v-for="b in buildingList" :key="b" :class="{ on: activeBuilding === b }" @click="selectBuilding(b)">{{ b }}</div>
              <div class="gd-side-title" style="margin-top:14px">楼层</div>
              <div class="floor-chips">
                <span class="floor-chip" v-for="f in floorList" :key="f" :class="{ on: activeFloor === f }" @click="activeFloor = f">{{ f }}</span>
              </div>
            </div>
            <div class="gd-main">
              <div class="legend-chips">
                <span class="lg-chip" v-for="s in statusLegend" :key="s.name">
                  <i :style="{ background: s.color }"></i>{{ s.name }} {{ statusCount(s.name) }}
                </span>
              </div>
              <div class="legend-chips">
                <span class="lg-chip"><i style="background:#8c8c8c"></i>空置超1年 {{ idleOver1y }}</span>
                <span class="lg-chip"><i style="background:#bfbfbf"></i>空置6月-1年 {{ idleHalf1y }}</span>
                <span class="lg-chip"><i style="background:#fa8c16"></i>3个月内到期 {{ expiringCount }}</span>
              </div>
              <div class="gd-filters">
                <el-checkbox v-model="showUnrentable" size="small">不可租资产</el-checkbox>
                <span class="gd-filter-label">资产面积筛选</span>
                <el-slider v-model="areaRange" range :min="0" :max="1000" size="small" style="width:200px" />
                <span class="gd-range-text">{{ areaRange[0] }} - {{ areaRange[1] }} m²</span>
              </div>
              <div class="room-grid">
                <div class="room-card" v-for="r in visibleRooms" :key="r.code" :style="{ borderTopColor: statusColor(r.status) }">
                  <div class="room-head">
                    <el-tag v-if="r.status !== '已租赁'" size="small" type="warning" effect="dark">未使用</el-tag>
                    <el-tag v-else size="small" type="success" effect="dark">已租赁</el-tag>
                    <el-tag v-if="r.unrentable" size="small" type="info">不可租</el-tag>
                  </div>
                  <div class="room-code">{{ r.code }}</div>
                  <div class="room-meta">{{ r.mortgage }}｜{{ r.certStatus }}</div>
                  <div class="room-area">{{ r.area.toLocaleString() }} m²</div>
                </div>
                <el-empty v-if="!visibleRooms.length" description="当前楼层无符合筛选条件的资产" :image-size="60" />
              </div>
            </div>
          </div>
          <div v-else class="gd-list">
            <div class="gd-list-filter">
              <el-input v-model="listCodeKw" placeholder="资产编号" size="small" clearable style="width:150px" />
              <el-select v-model="listStatus" placeholder="租赁状态" size="small" clearable style="width:120px">
                <el-option v-for="s in statusLegend" :key="s.name" :label="s.name" :value="s.name" />
              </el-select>
              <el-select v-model="listType" placeholder="资产类型" size="small" clearable style="width:120px">
                <el-option v-for="t in roomTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
              <el-select v-model="listZone" placeholder="所在分区" size="small" clearable style="width:120px">
                <el-option v-for="z in zoneOptions" :key="z" :label="z" :value="z" />
              </el-select>
              <el-button type="primary" size="small" @click="doListSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </div>
            <el-table :data="pagedRooms" border stripe size="small">
              <el-table-column prop="zone" label="分区" width="70" />
              <el-table-column prop="floor" label="楼层" width="60" />
              <el-table-column prop="code" label="资产编号" width="130" />
              <el-table-column prop="name" label="资产名称" min-width="200" show-overflow-tooltip />
              <el-table-column prop="location" label="资产座落" min-width="180" show-overflow-tooltip />
              <el-table-column label="产权状态" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="certTagType(row.certStatus)">{{ row.certStatus }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="certNo" label="产权编号" min-width="180" show-overflow-tooltip />
              <el-table-column label="抵押状态" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.mortgage === '已抵押' ? 'warning' : 'info'" effect="plain">{{ row.mortgage }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="租赁状态" width="90">
                <template #default="{ row }">
                  <span class="room-status-dot" :style="{ background: statusColor(row.status) }"></span>
                  <span :style="{ color: statusColor(row.status) }">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination small layout="total, prev, pager, next" :total="filteredRooms.length" :page-size="listPageSize" v-model:current-page="listPage" />
            </div>
          </div>

          <div class="section-title" style="margin-top:20px">项目资产清单</div>
          <el-table :data="currentProject?.assets || []" border stripe size="small" max-height="420">
            <el-table-column prop="code" label="资产编号" width="100" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="area" label="面积(m²)" width="100" align="right">
              <template #default="{ row }">{{ row.area.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="annualRent" label="年租金(万)" width="100" align="right">
              <template #default="{ row }">
                <span v-if="row.annualRent" style="color:#52c41a">{{ row.annualRent }}</span>
                <span v-else style="color:#c0c4cc">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="tenant" label="承租方" width="120" />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleAssetDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 底部图表 -->
        <div class="geo-bottom" v-show="drillLevel < 2">
          <div class="geo-bottom-card">
            <div class="gbc-title">资产类型分布</div>
            <div ref="typeDistRef" class="gbc-chart"></div>
          </div>
          <div class="geo-bottom-card">
            <div class="gbc-title">各乡镇出租率</div>
            <div ref="townRateRef" class="gbc-chart"></div>
          </div>
          <div class="geo-bottom-card" style="flex:1.4">
            <div class="gbc-title">近12个月收入趋势(万元)</div>
            <div ref="incomeTrendRef" class="gbc-chart"></div>
          </div>
        </div>

        <!-- 图例 -->
        <div class="geo-legend">
          <div class="gl-title">资产性质</div>
          <div class="gl-item"><span class="gl-dot" style="background:#1890ff"></span>经营性资产</div>
          <div class="gl-item"><span class="gl-dot" style="background:#7c4dff"></span>行政事业性资产</div>
          <div class="gl-item"><span class="gl-dot" style="background:#ff6e40"></span>公共资源类资产</div>
        </div>

        <!-- 全屏按钮 -->
        <div class="geo-fullscreen" @click="handleFullscreen">
          <el-icon :size="16"><FullScreen /></el-icon>
        </div>
      </div>
    </el-card>

    <!-- 资产详情弹窗 -->
    <el-dialog v-model="assetDialogVisible" title="资产详情" width="600px">
      <el-descriptions :column="2" border v-if="selectedAssetDetail">
        <el-descriptions-item label="资产编码">{{ selectedAssetDetail.code }}</el-descriptions-item>
        <el-descriptions-item label="资产名称">{{ selectedAssetDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="资产类型">{{ selectedAssetDetail.type }}</el-descriptions-item>
        <el-descriptions-item label="资产状态">
          <el-tag :type="getStatusType(selectedAssetDetail.status)" size="small">{{ selectedAssetDetail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="面积">{{ selectedAssetDetail.area?.toLocaleString() }} m²</el-descriptions-item>
        <el-descriptions-item label="年租金">{{ selectedAssetDetail.annualRent ? selectedAssetDetail.annualRent + ' 万元' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="承租方">{{ selectedAssetDetail.tenant || '-' }}</el-descriptions-item>
        <el-descriptions-item label="所属项目">{{ selectedAssetDetail.project || '-' }}</el-descriptions-item>
        <el-descriptions-item label="位置" :span="2">{{ selectedAssetDetail.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权证状态" :span="2">{{ selectedAssetDetail.certStatus || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="assetDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 区域划分弹窗 -->
    <el-dialog v-model="zoneDialogVisible" :title="zoneDialogTitle" width="520px">
      <el-form :model="zoneForm" label-width="90px" size="small">
        <el-form-item label="区域名称">
          <el-input v-model="zoneForm.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="所属区县">
          <el-select v-model="zoneForm.parentId" style="width:100%">
            <el-option v-for="d in zoneTree" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域类型">
          <el-select v-model="zoneForm.type" style="width:100%">
            <el-option v-for="t in ['街道', '片区', '镇', '工业园区']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="zoneForm.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="面积(m²)">
          <el-input-number v-model="zoneForm.area" :min="0" :step="1000" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="zoneForm.editBoundary" label="边界描述">
          <el-input v-model="zoneForm.boundary" type="textarea" :rows="3" placeholder="如：东至XX路，西至XX河，南至XX街，北至XX大道" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="zoneDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveZone">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount, onMounted, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  LocationFilled, OfficeBuilding, FullScreen, Search, Close,
  Plus
} from '@element-plus/icons-vue'
import { useProjectStore } from '../../store/project'

const route = useRoute()
const isRegionMode = computed(() => route.name === 'EntRegionDivision')
const projectStore = useProjectStore()

const drillLevel = ref(0)
const currentTown = ref(null)
const currentProject = ref(null)
const assetDialogVisible = ref(false)
const selectedAssetDetail = ref(null)
const geoMapRef = ref(null)
const kpiPanelVisible = ref(true)

/* ==================== 高德地图 ==================== */
const AMAP_KEY = 'd9902108686d1a72769e105fb5f8343e'
// 高德 JS API 2.0 安全密钥：DistrictSearch 等 restapi 服务必需，缺失会返回 INVALID_USER_SCODE
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || ''
const amapContainerRef = ref(null)
let amapInstance = null
let amapDistrictPolygons = []
let amapMarkers = []
let amapLabels = []

function loadAmapScript() {
  return new Promise((resolve, reject) => {
    if (AMAP_SECURITY_CODE) {
      window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE }
    }
    if (window.AMap) { resolve(); return }
    if (document.querySelector('script[src*="webapi.amap.com"]')) {
      const wait = setInterval(() => { if (window.AMap) { clearInterval(wait); resolve() } }, 100)
      setTimeout(() => { clearInterval(wait); reject(new Error('高德地图脚本加载超时')) }, 15000)
      return
    }
    const s = document.createElement('script')
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.DistrictSearch`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(s)
  })
}

function initAmap() {
  console.log('[AssetMap] initAmap called, container:', !!amapContainerRef.value, 'instance:', !!amapInstance)
  if (!amapContainerRef.value) {
    console.log('[AssetMap] container ref is null, retrying in 300ms')
    setTimeout(initAmap, 300)
    return
  }
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
    amapDistrictPolygons = []
    amapMarkers = []
    amapLabels = []
  }
  const el = amapContainerRef.value
  console.log('[AssetMap] container size:', el.offsetWidth, 'x', el.offsetHeight)
  if (!el.offsetWidth || !el.offsetHeight) {
    console.log('[AssetMap] container has no size, retrying in 300ms')
    setTimeout(initAmap, 300)
    return
  }
  el.innerHTML = ''
  console.log('[AssetMap] creating AMap instance')
  amapInstance = new window.AMap.Map(el, {
    zoom: 11,
    center: [119.53, 25.90],
    mapStyle: 'amap://styles/normal',
    viewMode: '2D',
    resizeEnable: true
  })
  console.log('[AssetMap] AMap instance created:', !!amapInstance)
  loadDistrictBoundary()
  if (drillLevel.value === 0) addProjectMarkers()
}

function clearAmapOverlays() {
  amapDistrictPolygons.forEach(p => amapInstance?.remove(p))
  amapDistrictPolygons = []
  amapMarkers.forEach(m => amapInstance?.remove(m))
  amapMarkers = []
  amapLabels.forEach(l => amapInstance?.remove(l))
  amapLabels = []
}

function loadDistrictBoundary() {
  if (!window.AMap) return
  clearAmapOverlays()
  const district = new window.AMap.DistrictSearch({
    subdistrict: 1,
    extensions: 'all',
    level: 'district'
  })
  district.search('长乐区', (status, result) => {
    if (status !== 'complete') return
    const d = result.districts?.[0]
    if (!d) return
    if (d.districts && d.districts.length > 0) {
      d.districts.forEach(sub => {
        if (sub.polyline) {
          const path = sub.polyline.split(';').map(p => {
            const [lng, lat] = p.split(',').map(Number)
            return new window.AMap.LngLat(lng, lat)
          })
          const polygon = new window.AMap.Polygon({
            path,
            fillColor: '#1890ff',
            fillOpacity: 0.06,
            strokeColor: '#f5222d',
            strokeWeight: 2,
            strokeStyle: 'solid',
            strokeOpacity: 0.9,
            cursor: 'pointer'
          })
          polygon.on('click', () => {
            const matched = towns.value.find(t => t.name === sub.name)
            if (matched) handleTownClick(matched)
          })
          polygon.setMap(amapInstance)
          amapDistrictPolygons.push(polygon)
          const center = sub.center?.split(',').map(Number)
          if (center) {
            const label = new window.AMap.Text({
              text: sub.name,
              position: new window.AMap.LngLat(center[0], center[1]),
              style: {
                color: '#333',
                fontSize: '12px',
                fontWeight: '500',
                background: 'transparent',
                border: 'none'
              }
            })
            label.setMap(amapInstance)
            amapLabels.push(label)
          }
        }
      })
    }
    if (d.polyline) {
      const outerPath = d.polyline.split(';').map(p => {
        const [lng, lat] = p.split(',').map(Number)
        return new window.AMap.LngLat(lng, lat)
      })
      const outline = new window.AMap.Polygon({
        path: outerPath,
        fillColor: 'transparent',
        fillOpacity: 0,
        strokeColor: '#f5222d',
        strokeWeight: 2,
        strokeStyle: 'dashed',
        strokeOpacity: 0.7
      })
      outline.setMap(amapInstance)
      amapDistrictPolygons.push(outline)
    }
    amapInstance?.setFitView(null, false, [60, 60, 60, 60])
  })
}

function addProjectMarkers() {
  if (!amapInstance || !window.AMap) return
  amapMarkers.forEach(m => amapInstance.remove(m))
  amapMarkers = []
  allProjects.value.forEach(p => {
    const c = projectCoords[p.id] || { lng: 119.53, lat: 25.90 }
    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(c.lng, c.lat),
      content: `<div style="position:relative;width:14px;height:14px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(24,144,255,0.25);animation:amap-ping 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#1890ff;border:1.5px solid #fff"></div>
      </div>`,
      offset: new window.AMap.Pixel(-7, -7),
      cursor: 'pointer'
    })
    marker.on('click', () => handleMarkerClick({ ...p, sx: 0, sy: 0 }))
    marker.setMap(amapInstance)
    amapMarkers.push(marker)
  })
}

function addTownMarkers() {
  if (!amapInstance || !window.AMap || !currentTown.value) return
  amapMarkers.forEach(m => amapInstance.remove(m))
  amapMarkers = []
  const ids = townProjectMap[currentTown.value.code] || []
  const projects = allProjects.value.filter(p => ids.includes(p.id))
  projects.forEach(p => {
    const c = projectCoords[p.id] || { lng: 119.53, lat: 25.90 }
    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(c.lng, c.lat),
      content: `<div style="position:relative;width:16px;height:16px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(24,144,255,0.25);animation:amap-ping 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:#1890ff;border:1.5px solid #fff"></div>
      </div>`,
      offset: new window.AMap.Pixel(-8, -8),
      cursor: 'pointer'
    })
    const label = new window.AMap.Text({
      text: p.name,
      position: new window.AMap.LngLat(c.lng, c.lat),
      offset: new window.AMap.Pixel(0, -22),
      style: {
        color: '#333',
        fontSize: '11px',
        background: 'transparent',
        border: 'none'
      }
    })
    marker.on('click', () => handleMarkerClick({ ...p, sx: 0, sy: 0 }))
    marker.setMap(amapInstance)
    label.setMap(amapInstance)
    amapMarkers.push(marker)
    amapLabels.push(label)
  })
}

/* 9 个乡镇 — 用于 KPI 面板和镇级下钻 */
const towns = ref([
  { code: 'wh', name: '吴航街道', lng: 119.525, lat: 25.962, assetCount: 126, totalArea: 18500, rentalRate: 78 },
  { code: 'hc', name: '航城街道', lng: 119.498, lat: 25.918, assetCount: 86, totalArea: 22000, rentalRate: 75 },
  { code: 'sz', name: '首占新区', lng: 119.535, lat: 25.858, assetCount: 73, totalArea: 28000, rentalRate: 68 },
  { code: 'yq', name: '营前街道', lng: 119.558, lat: 25.902, assetCount: 52, totalArea: 15600, rentalRate: 82 },
  { code: 'hs', name: '鹤上镇', lng: 119.582, lat: 25.842, assetCount: 28, totalArea: 12400, rentalRate: 70 },
  { code: 'zg', name: '漳港街道', lng: 119.648, lat: 25.918, assetCount: 45, totalArea: 16800, rentalRate: 72 },
  { code: 'jt', name: '江田镇', lng: 119.618, lat: 25.802, assetCount: 18, totalArea: 35000, rentalRate: 45 },
  { code: 'mh', name: '梅花镇', lng: 119.735, lat: 25.955, assetCount: 12, totalArea: 8500, rentalRate: 65 },
  { code: 'yt', name: '玉田镇', lng: 119.460, lat: 25.830, assetCount: 15, totalArea: 12000, rentalRate: 40 }
])

/* 项目坐标映射 (BLD-002 ~ BLD-012) */
const projectCoords = {
  'BLD-002': { lng: 119.655, lat: 25.930 },
  'BLD-003': { lng: 119.520, lat: 25.962 },
  'BLD-004': { lng: 119.505, lat: 25.915 },
  'BLD-005': { lng: 119.535, lat: 25.858 },
  'BLD-006': { lng: 119.582, lat: 25.842 },
  'BLD-007': { lng: 119.518, lat: 25.958 },
  'BLD-008': { lng: 119.498, lat: 25.918 },
  'BLD-009': { lng: 119.558, lat: 25.902 },
  'BLD-010': { lng: 119.648, lat: 25.918 },
  'BLD-011': { lng: 119.618, lat: 25.802 },
  'BLD-012': { lng: 119.522, lat: 25.955 }
}

/* 镇 → 项目映射 */
const townProjectMap = {
  wh: ['BLD-003', 'BLD-007', 'BLD-012'],
  hc: ['BLD-004', 'BLD-008'],
  sz: ['BLD-005'],
  yq: ['BLD-009'],
  hs: ['BLD-006'],
  zg: ['BLD-002', 'BLD-010'],
  jt: ['BLD-011'],
  mh: [],
  yt: []
}

const allProjects = computed(() => {
  const list = projectStore.visibleProjects || []
  return list.filter(b => b.id !== 'BLD-001')
})

const currentTownProjects = computed(() => {
  if (!currentTown.value) return []
  const ids = townProjectMap[currentTown.value.code] || []
  return allProjects.value.filter(p => ids.includes(p.id))
})

/* KPI */
const geoKpis = computed(() => {
  const ps = allProjects.value
  const totalAssets = ps.reduce((s, p) => s + p.totalAssets, 0)
  const totalArea = ps.reduce((s, p) => s + p.totalArea, 0)
  const totalIncome = ps.reduce((s, p) => s + p.cumIncome, 0)
  const yearIncome = ps.reduce((s, p) => s + p.yearIncome, 0)
  const avgRate = ps.length ? (ps.reduce((s, p) => s + p.rentalRate, 0) / ps.length).toFixed(1) : 0
  return [
    { label: '资产总数', value: totalAssets.toLocaleString(), unit: '宗' },
    { label: '总面积', value: (totalArea / 10000).toFixed(1), unit: '万m²' },
    { label: '平均出租率', value: avgRate, unit: '%' },
    { label: '累计收入', value: totalIncome.toFixed(0), unit: '万元' },
    { label: '本年收入', value: yearIncome.toFixed(0), unit: '万元' },
    { label: '管辖项目', value: ps.length, unit: '个' }
  ]
})

const townRank = computed(() => {
  const max = Math.max(...towns.value.map(t => t.assetCount))
  return [...towns.value].sort((a, b) => b.assetCount - a.assetCount).map(t => ({
    code: t.code,
    name: t.name,
    count: t.assetCount,
    pct: Math.round(t.assetCount / max * 100)
  }))
})

/* 项目详情 KPI */
const projKpis = computed(() => {
  if (!currentProject.value) return []
  const p = currentProject.value
  return [
    { label: '资产总数', value: p.totalAssets, unit: '宗', color: '#1890ff' },
    { label: '总面积', value: (p.totalArea / 10000).toFixed(1), unit: '万m²', color: '#722ed1' },
    { label: '出租率', value: p.rentalRate, unit: '%', color: '#52c41a' },
    { label: '累计收入', value: p.cumIncome.toFixed(0), unit: '万元', color: '#fa8c16' },
    { label: '本年收入', value: p.yearIncome.toFixed(0), unit: '万元', color: '#13c2c2' },
    { label: '闲置数', value: p.idleCount, unit: '宗', color: '#f5222d' }
  ]
})

/* ==================== 交互 ==================== */
function handleTownClick(t) {
  currentTown.value = t
  drillLevel.value = 1
  if (amapInstance && window.AMap) {
    amapInstance.setZoomAndCenter(13, new window.AMap.LngLat(t.lng, t.lat))
  }
}

function handleMarkerClick(m) {
  currentProject.value = m
  drillLevel.value = 2
  rooms.value = generateRooms(m)
  detailView.value = 'map'
  activeBuilding.value = buildingList[0]
  activeFloor.value = '1F'
  showUnrentable.value = false
  areaRange.value = [0, 1000]
  listCodeKw.value = ''
  appliedListCode.value = ''
  listStatus.value = ''
  listType.value = ''
  listZone.value = ''
  listPage.value = 1
  nextTick(initDetailCharts)
}

function handleProjectClick(p) {
  currentProject.value = p
  drillLevel.value = 2
  rooms.value = generateRooms(p)
  detailView.value = 'map'
  activeBuilding.value = buildingList[0]
  activeFloor.value = '1F'
  showUnrentable.value = false
  areaRange.value = [0, 1000]
  listCodeKw.value = ''
  appliedListCode.value = ''
  listStatus.value = ''
  listType.value = ''
  listZone.value = ''
  listPage.value = 1
  nextTick(initDetailCharts)
}

const drillTo = (level) => {
  if (level === 0) {
    drillLevel.value = 0
    currentTown.value = null
    currentProject.value = null
    nextTick(() => {
      loadDistrictBoundary()
      addProjectMarkers()
    })
  } else if (level === 1) {
    drillLevel.value = 1
    currentProject.value = null
  }
}

watch(drillLevel, (v) => {
  if (v !== 2) disposeDetailCharts()
  if (v === 1) nextTick(addTownMarkers)
  if (v === 0) nextTick(() => { loadDistrictBoundary(); addProjectMarkers() })
})

/* ==================== 资产明细 ==================== */
const detailView = ref('map')
const rooms = ref([])
const buildingList = ['A栋', 'B栋', 'C栋']
const activeBuilding = ref('A栋')
const activeFloor = ref('1F')
const showUnrentable = ref(false)
const areaRange = ref([0, 1000])

const statusLegend = [
  { name: '已租赁', color: '#52c41a' },
  { name: '未租赁', color: '#faad14' },
  { name: '审批中', color: '#1890ff' },
  { name: '已占用', color: '#722ed1' },
  { name: '处置中', color: '#f5222d' },
  { name: '流转中', color: '#13c2c2' },
  { name: '调拨中', color: '#eb2f96' }
]
const roomTypeOptions = ['商铺', '办公', '厂房', '仓储', '综合用房']
const zoneOptions = ['A区', 'B区', 'C区']

function statusColor(s) { return (statusLegend.find(x => x.name === s) || {}).color || '#8c8c8c' }
function certTagType(c) { return { 有产权证: 'success', 无产权: 'danger', 办理中: 'warning' }[c] || 'info' }
function statusCount(s) { return rooms.value.filter(r => r.status === s).length }

function generateRooms(project) {
  const statuses = statusLegend.map(s => s.name)
  const weights = [46, 20, 8, 8, 6, 6, 6]
  const result = []
  let seed = String(project.id || project.code || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0) + 7
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  const pickStatus = () => {
    const r = rnd() * 100; let acc = 0
    for (let i = 0; i < weights.length; i++) { acc += weights[i]; if (r <= acc) return statuses[i] }
    return statuses[1]
  }
  buildingList.forEach((b, bi) => {
    const floorCount = 4 + Math.floor(rnd() * 3)
    for (let f = 1; f <= floorCount; f++) {
      const roomCount = 4 + Math.floor(rnd() * 4)
      for (let r = 1; r <= roomCount; r++) {
        const status = pickStatus()
        const cert = rnd() < 0.7 ? '有产权证' : (rnd() < 0.5 ? '无产权' : '办理中')
        result.push({
          building: b, floor: `${f}F`, zone: zoneOptions[(bi + f + r) % 3],
          code: `${project.id || 'X'}-${bi + 1}${String(f).padStart(2, '0')}${String(r).padStart(2, '0')}`,
          name: `${project.name} ${b} ${f}层 ${String(r).padStart(2, '0')}室`,
          location: `长乐区${project.address || project.name}${b}${f}层`,
          type: roomTypeOptions[Math.floor(rnd() * roomTypeOptions.length)],
          area: Math.round(60 + rnd() * 900), status,
          unrentable: rnd() < 0.12, certStatus: cert,
          certNo: cert === '有产权证' ? `闽(2024)长乐区不动产权第${100000 + Math.floor(rnd() * 899999)}号` : '—',
          mortgage: rnd() < 0.3 ? '已抵押' : '未抵押',
          idlePeriod: status === '未租赁' ? (rnd() < 0.4 ? '空置超1年' : '空置6月-1年') : '',
          expiring: status === '已租赁' && rnd() < 0.15
        })
      }
    }
  })
  return result
}

const floorList = computed(() => {
  const set = [...new Set(rooms.value.filter(r => r.building === activeBuilding.value).map(r => r.floor))]
  return set.sort((a, b) => parseInt(a) - parseInt(b))
})

function selectBuilding(b) { activeBuilding.value = b; activeFloor.value = floorList.value[0] || '1F' }

const visibleRooms = computed(() => rooms.value.filter(r =>
  r.building === activeBuilding.value && r.floor === activeFloor.value &&
  (showUnrentable.value || !r.unrentable) && r.area >= areaRange.value[0] && r.area <= areaRange.value[1]
))

const idleOver1y = computed(() => rooms.value.filter(r => r.idlePeriod === '空置超1年').length)
const idleHalf1y = computed(() => rooms.value.filter(r => r.idlePeriod === '空置6月-1年').length)
const expiringCount = computed(() => rooms.value.filter(r => r.expiring).length)

const ovTotalCount = computed(() => rooms.value.length)
const ovRentedCount = computed(() => rooms.value.filter(r => r.status === '已租赁').length)
const ovRentRate = computed(() => (ovTotalCount.value ? Math.round(ovRentedCount.value / ovTotalCount.value * 1000) / 10 : 0))
const ovChargeRate = 86.4

const listCodeKw = ref('')
const appliedListCode = ref('')
const listStatus = ref('')
const listType = ref('')
const listZone = ref('')
const listPage = ref(1)
const listPageSize = 8

const filteredRooms = computed(() => rooms.value.filter(r =>
  (!appliedListCode.value || r.code.toLowerCase().includes(appliedListCode.value.toLowerCase())) &&
  (!listStatus.value || r.status === listStatus.value) &&
  (!listType.value || r.type === listType.value) &&
  (!listZone.value || r.zone === listZone.value)
))

const pagedRooms = computed(() => filteredRooms.value.slice((listPage.value - 1) * listPageSize, listPage.value * listPageSize))

function doListSearch() { appliedListCode.value = listCodeKw.value.trim(); listPage.value = 1 }
watch([listStatus, listType, listZone], () => { listPage.value = 1 })

/* ==================== ECharts ==================== */
const rentDonutRef = ref(null)
const typePieRef = ref(null)
const monthBarRef = ref(null)
const typeDistRef = ref(null)
const townRateRef = ref(null)
const incomeTrendRef = ref(null)
let rentDonut = null, typePie = null, monthBar = null, typeDist = null, townRateChart = null, incomeTrend = null

const darkAxis = {
  axisLine: { lineStyle: { color: '#d9d9d9' } },
  axisLabel: { color: '#666', fontSize: 10 },
  splitLine: { lineStyle: { color: '#f0f0f0' } }
}

function disposeDetailCharts() {
  rentDonut?.dispose(); rentDonut = null
  typePie?.dispose(); typePie = null
  monthBar?.dispose(); monthBar = null
}

function disposeBottomCharts() {
  typeDist?.dispose(); typeDist = null
  townRateChart?.dispose(); townRateChart = null
  incomeTrend?.dispose(); incomeTrend = null
}

function initDetailCharts() {
  disposeDetailCharts()
  if (rentDonutRef.value) {
    rentDonut = echarts.init(rentDonutRef.value)
    rentDonut.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#666' }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['48%', '70%'], center: ['50%', '44%'], label: { show: false },
        data: [
          { value: ovRentedCount.value, name: '已租赁', itemStyle: { color: '#52c41a' } },
          { value: ovTotalCount.value - ovRentedCount.value, name: '未租赁', itemStyle: { color: '#faad14' } }
        ]
      }]
    })
  }
  if (typePieRef.value) {
    typePie = echarts.init(typePieRef.value)
    const counts = {}
    rooms.value.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1 })
    const colors = { 商铺: '#52c41a', 办公: '#fa8c16', 厂房: '#722ed1', 仓储: '#1890ff', 综合用房: '#13c2c2' }
    typePie.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 11, color: '#666' }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: '62%', center: ['50%', '44%'], label: { show: false },
        data: Object.keys(counts).map(k => ({ value: counts[k], name: k, itemStyle: { color: colors[k] || '#8c8c8c' } }))
      }]
    })
  }
  if (monthBarRef.value) {
    monthBar = echarts.init(monthBarRef.value)
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getMonth() + 1}月`)
    }
    monthBar.setOption({
      grid: { left: 36, right: 10, top: 16, bottom: 22 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: months, ...darkAxis, axisLabel: { color: '#666', fontSize: 10, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [{
        type: 'bar', barWidth: 8,
        data: [12.6, 14.2, 11.8, 15.4, 13.9, 16.2, 14.8, 17.6, 15.2, 18.4, 16.8, 19.2],
        itemStyle: { color: '#1890ff', borderRadius: [3, 3, 0, 0] }
      }]
    })
  }
}

function initBottomCharts() {
  console.log('[AssetMap] initBottomCharts called')
  console.log('[AssetMap] refs:', !!typeDistRef.value, !!townRateRef.value, !!incomeTrendRef.value)
  if (typeDistRef.value && !typeDistRef.value.offsetWidth) {
    setTimeout(initBottomCharts, 300)
    return
  }
  disposeBottomCharts()
  if (typeDistRef.value) {
    console.log('[AssetMap] init typeDist chart, size:', typeDistRef.value.offsetWidth, 'x', typeDistRef.value.offsetHeight)
    typeDist = echarts.init(typeDistRef.value)
    typeDist.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: '#666', fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'], label: { show: false },
        data: [
          { value: 68, name: '商铺', itemStyle: { color: '#52c41a' } },
          { value: 62, name: '厂房', itemStyle: { color: '#722ed1' } },
          { value: 45, name: '写字楼', itemStyle: { color: '#fa8c16' } },
          { value: 38, name: '保障房', itemStyle: { color: '#1890ff' } },
          { value: 35, name: '综合用房', itemStyle: { color: '#13c2c2' } },
          { value: 30, name: '仓储/土地', itemStyle: { color: '#eb2f96' } },
          { value: 22, name: '农贸市场', itemStyle: { color: '#faad14' } }
        ]
      }]
    })
  }
  if (townRateRef.value) {
    townRateChart = echarts.init(townRateRef.value)
    const sorted = [...towns.value].sort((a, b) => b.rentalRate - a.rentalRate)
    townRateChart.setOption({
      grid: { left: 70, right: 16, top: 10, bottom: 20 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'value', max: 100, ...darkAxis },
      yAxis: { type: 'category', data: sorted.map(t => t.name), ...darkAxis, axisLabel: { color: '#666', fontSize: 10 } },
      series: [{
        type: 'bar', barWidth: 10,
        data: sorted.map(t => ({
          value: t.rentalRate,
          itemStyle: { color: t.rentalRate > 70 ? '#52c41a' : t.rentalRate > 50 ? '#faad14' : '#f5222d', borderRadius: [0, 3, 3, 0] }
        }))
      }]
    })
  }
  if (incomeTrendRef.value) {
    incomeTrend = echarts.init(incomeTrendRef.value)
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getMonth() + 1}月`)
    }
    incomeTrend.setOption({
      grid: { left: 40, right: 16, top: 20, bottom: 22 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months, ...darkAxis, axisLabel: { color: '#666', fontSize: 10, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
        data: [86.4, 92.1, 88.6, 96.2, 91.8, 102.5, 98.4, 108.6, 104.2, 112.8, 106.4, 118.6],
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(24,144,255,0.3)' },
          { offset: 1, color: 'rgba(24,144,255,0.02)' }
        ]) }
      }]
    })
  }
}

onMounted(async () => {
  console.log('[AssetMap] onMounted')
  try {
    await loadAmapScript()
    console.log('[AssetMap] AMap script loaded')
    setTimeout(() => { try { initAmap() } catch (e) { console.error('地图初始化失败:', e) } }, 300)
  } catch (e) {
    console.error('高德地图加载失败:', e)
  }
  setTimeout(() => { try { initBottomCharts() } catch (e) { console.error('底部图表初始化失败:', e) } }, 350)
})

onActivated(() => {
  console.log('[AssetMap] onActivated')
  if (window.AMap) setTimeout(() => { try { initAmap() } catch (e) { console.error('地图初始化失败:', e) } }, 300)
  setTimeout(() => { try { initBottomCharts() } catch (e) { console.error('底部图表初始化失败:', e) } }, 350)
})

onBeforeUnmount(() => {
  console.log('[AssetMap] onBeforeUnmount')
  disposeDetailCharts()
  disposeBottomCharts()
  if (amapInstance) { amapInstance.destroy(); amapInstance = null }
  amapDistrictPolygons = []
  amapMarkers = []
  amapLabels = []
})

watch(isRegionMode, (region) => {
  if (!region && window.AMap) {
    nextTick(() => setTimeout(() => { try { initAmap() } catch (e) { console.error('地图初始化失败:', e) } }, 100))
    nextTick(() => setTimeout(() => { try { initBottomCharts() } catch (e) { console.error('底部图表初始化失败:', e) } }, 150))
  }
})

watch(drillLevel, () => {
  if (drillLevel.value < 2) nextTick(initBottomCharts)
})

/* ==================== 工具函数 ==================== */
const handleAssetDetail = (asset) => { selectedAssetDetail.value = asset; assetDialogVisible.value = true }
const getStatusType = (status) => {
  const map = { '已出租': 'success', '部分出租': 'success', '闲置': 'warning', '自用': 'info' }
  return map[status] || 'info'
}

const handleFullscreen = () => {
  const el = geoMapRef.value
  if (!el) return
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch(() => ElMessage.warning('全屏模式不可用'))
  } else {
    document.exitFullscreen()
  }
}

/* ==================== 区域划分模式 ==================== */
const boardView = ref('cards')
const selectedZoneId = ref('z1-1')

const zoneTree = ref([
  {
    id: 'd1', name: '长乐区中心城区', count: 6,
    children: [
      { id: 'z1-1', name: '吴航街道', type: '街道', projectCount: 2, assetCount: 42, area: 18500, owner: '陈志强', code: '350112001', color: '#1890ff', span: 2, boundary: '东至鳌山路，西至西洋路，南至郑和路，北至闽江口' },
      { id: 'z1-2', name: '航城街道', type: '街道', projectCount: 2, assetCount: 38, area: 22000, owner: '林晓峰', code: '350112002', color: '#13c2c2', span: 2, boundary: '东至机场路，西至吴航街道，南至首占镇，北至闽江' },
      { id: 'z1-3', name: '首占新区', type: '片区', projectCount: 2, assetCount: 35, area: 28000, owner: '黄丽华', code: '350112003', color: '#722ed1', span: 2, boundary: '东至岱边村，西至玉田镇，南至营前街道，北至航城街道' }
    ]
  },
  {
    id: 'd2', name: '长乐区沿海片区', count: 5,
    children: [
      { id: 'z2-1', name: '漳港街道', type: '街道', projectCount: 1, assetCount: 25, area: 16800, owner: '郑文海', code: '350112004', color: '#fa8c16', span: 2, boundary: '东至海边，西至鹤上镇，南至江田镇，北至航城街道' },
      { id: 'z2-2', name: '江田镇', type: '镇', projectCount: 1, assetCount: 18, area: 35000, owner: '王建国', code: '350112005', color: '#52c41a', span: 3, boundary: '东至海滨，西至玉田镇，南至福清界，北至漳港街道' },
      { id: 'z2-3', name: '梅花镇', type: '镇', projectCount: 1, assetCount: 12, area: 8500, owner: '刘梅芳', code: '350112006', color: '#eb2f96', span: 1, boundary: '东至闽江口，西至航城街道，南至漳港街道，北至连江界' }
    ]
  },
  {
    id: 'd3', name: '长乐区内陆片区', count: 4,
    children: [
      { id: 'z3-1', name: '营前街道', type: '街道', projectCount: 1, assetCount: 28, area: 15600, owner: '吴晓东', code: '350112007', color: '#1c7ed6', span: 2, boundary: '东至首占新区，西至闽侯界，南至玉田镇，北至闽江' },
      { id: 'z3-2', name: '鹤上镇', type: '镇', projectCount: 1, assetCount: 22, area: 12400, owner: '张永和', code: '350112008', color: '#faad14', span: 2, boundary: '东至漳港街道，西至首占新区，南至江田镇，北至航城街道' },
      { id: 'z3-3', name: '玉田镇', type: '镇', projectCount: 1, assetCount: 15, area: 12000, owner: '李春华', code: '350112009', color: '#2f54eb', span: 2, boundary: '东至江田镇，西至福清界，南至福清界，北至营前街道' }
    ]
  }
])

const activeZone = ref(zoneTree.value[0])
const activeZoneChildren = computed(() => activeZone.value?.children || zoneTree.value[0].children)
const zoneStats = computed(() => ({
  zoneCount: zoneTree.value.length,
  streetCount: zoneTree.value.reduce((s, d) => s + d.children.length, 0),
  projectCount: zoneTree.value.reduce((s, d) => s + d.children.reduce((t, z) => t + z.projectCount, 0), 0)
}))

function handleZoneNodeClick(node) {
  if (node.children) { activeZone.value = node; selectedZoneId.value = node.children[0]?.id || '' }
  else {
    const parent = zoneTree.value.find(d => d.children.some(c => c.id === node.id))
    if (parent) activeZone.value = parent
    selectedZoneId.value = node.id
  }
}

const zoneDialogVisible = ref(false)
const zoneForm = ref({ id: null, name: '', parentId: 'd1', type: '街道', owner: '', area: 0, boundary: '', editBoundary: false })
const zoneDialogTitle = computed(() => {
  if (!zoneForm.value.id) return '新增区域'
  return zoneForm.value.editBoundary ? '编辑边界 — ' + zoneForm.value.name : '调整划分 — ' + zoneForm.value.name
})

function openZoneDialog(zone, editBoundary = false) {
  if (zone && zone.children) {
    zoneForm.value = { id: null, name: '', parentId: zone.id, type: '街道', owner: '', area: 0, boundary: '', editBoundary: false }
  } else if (zone) {
    zoneForm.value = { id: zone.id, name: zone.name, parentId: findParentId(zone.id), type: zone.type, owner: zone.owner, area: zone.area, boundary: zone.boundary || '', editBoundary }
  } else {
    zoneForm.value = { id: null, name: '', parentId: activeZone.value?.id || 'd1', type: '街道', owner: '', area: 0, boundary: '', editBoundary: false }
  }
  zoneDialogVisible.value = true
}

function findParentId(zoneId) {
  const p = zoneTree.value.find(d => d.children.some(c => c.id === zoneId))
  return p ? p.id : 'd1'
}

function saveZone() {
  const f = zoneForm.value
  if (!f.name.trim()) { ElMessage.warning('请输入区域名称'); return }
  const parent = zoneTree.value.find(d => d.id === f.parentId)
  if (!parent) return
  if (f.id) {
    const target = parent.children.find(c => c.id === f.id) || zoneTree.value.flatMap(d => d.children).find(c => c.id === f.id)
    if (target) {
      Object.assign(target, { name: f.name, type: f.type, owner: f.owner, area: f.area, boundary: f.boundary })
      const oldParent = zoneTree.value.find(d => d.children.some(c => c.id === f.id))
      if (oldParent && oldParent.id !== f.parentId) {
        oldParent.children = oldParent.children.filter(c => c.id !== f.id)
        oldParent.count = oldParent.children.reduce((s, z) => s + z.projectCount, 0)
        parent.children.push(target)
      }
    }
    ElMessage.success(f.editBoundary ? '边界已保存' : '区域划分已调整')
  } else {
    const palette = ['#1890ff', '#13c2c2', '#722ed1', '#fa8c16', '#52c41a', '#eb2f96']
    parent.children.push({
      id: 'z-new-' + Date.now(), name: f.name, type: f.type, projectCount: 0,
      assetCount: 0, area: f.area, owner: f.owner,
      code: '350112' + String(100 + parent.children.length), color: palette[parent.children.length % palette.length],
      span: 2, boundary: f.boundary
    })
    ElMessage.success('新增区域成功')
  }
  parent.count = parent.children.reduce((s, z) => s + z.projectCount, 0)
  activeZone.value = parent
  zoneDialogVisible.value = false
}
</script>

<style scoped>
.page-container { height: 100%; }

/* ==================== 区域划分视图 ==================== */
.region-wrap { display: flex; gap: 20px; align-items: flex-start; }
.region-left { width: 300px; flex: none; }
.region-left :deep(.el-card) { background: #fff; }
.region-right { flex: 1; min-width: 0; }
.region-right :deep(.el-card) { background: #fff; }
.rr-head { display: flex; justify-content: space-between; align-items: center; }
.zt-node { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.zt-name { color: #262626; }
.zt-summary { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e8e8e8; font-size: 12px; color: #8c8c8c; line-height: 1.6; }
.detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.dg-item { background: #f7f9fc; border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; }
.dg-label { font-size: 12px; color: #8c8c8c; }
.dg-value { font-size: 17px; font-weight: 700; color: var(--c-primary); font-variant-numeric: tabular-nums; margin-top: 3px; }
.section-title { font-size: 14px; font-weight: 600; color: #262626; padding-left: 8px; border-left: 3px solid var(--c-primary); margin-bottom: 10px; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.rd-table { font-size: 13px; }
.zone-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.zone-card { background: #fff; border: 1px solid #ebeef5; border-top: 3px solid var(--c-primary); border-radius: 6px; padding: 12px 14px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; }
.zone-card:hover { box-shadow: 0 2px 12px rgba(24, 144, 255, 0.2); }
.zone-card.on { border-color: var(--c-primary); box-shadow: 0 2px 12px rgba(24, 144, 255, 0.25); }
.zc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.zc-name { font-size: 14px; font-weight: 600; color: #262626; }
.zc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
.zc-stat { display: flex; flex-direction: column; }
.zc-stat .label { font-size: 12px; color: #8c8c8c; }
.zc-stat .value { font-size: 13px; font-weight: 600; color: #262626; font-variant-numeric: tabular-nums; }
.zc-foot { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #ebeef5; text-align: right; }
.block-map { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.block-cell { border-radius: 6px; padding: 14px 12px; color: #fff; cursor: pointer; opacity: 0.88; transition: opacity 0.2s, transform 0.2s; min-height: 92px; }
.block-cell:hover { opacity: 1; transform: translateY(-2px); }
.block-cell.on { opacity: 1; outline: 2px solid #262626; outline-offset: 1px; }
.bc-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
.bc-meta { font-size: 12px; opacity: 0.92; }
.bc-owner { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.block-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

/* ==================== GIS 地图 — 深色主题 ==================== */
.geo-map {
  min-height: 720px;
  background: #f0f2f5;
  position: relative; display: flex; flex-direction: column;
  border-radius: 6px;
}

.geo-breadcrumb {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e8e8e8;
  display: flex; align-items: center;
  z-index: 30;
}
.geo-breadcrumb :deep(.el-breadcrumb__inner) { color: #333; }
.geo-breadcrumb :deep(.el-breadcrumb__separator) { color: #999; }

.amap-container {
  height: 500px; width: 100%;
}
.geo-map:fullscreen {
  height: 100vh;
  overflow: hidden;
}
.geo-map:fullscreen .amap-container {
  flex: 1;
  height: auto;
  min-height: 0;
}
.amap-container :deep(.amap-marker-label) {
  border: none;
  background: transparent;
}

@keyframes amap-ping {
  0% { transform: scale(1); opacity: 0.6; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}

/* KPI 面板 */
.geo-kpi-panel {
  position: absolute; top: 52px; left: 12px; z-index: 20; width: 240px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 14px; color: #333;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.geo-kpi-toggle {
  position: absolute; top: 52px; left: 12px; z-index: 20;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 6px;
  padding: 8px 12px; color: #1890ff; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.geo-kpi-toggle:hover { background: #fff; border-color: #1890ff; }
.gkp-title { font-size: 14px; font-weight: 700; color: #1890ff; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(24, 144, 255, 0.2); display: flex; justify-content: space-between; align-items: center; }
.gkp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.gkp-item { background: #f7f9fc; border: 1px solid #ebeef5; border-radius: 5px; padding: 6px 8px; }
.gkp-value { font-size: 15px; font-weight: 700; color: #262626; font-variant-numeric: tabular-nums; }
.gkp-unit { font-size: 10px; font-weight: normal; color: #8c8c8c; margin-left: 2px; }
.gkp-label { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
.gkp-rank-title { font-size: 12px; font-weight: 600; color: #1890ff; padding-top: 6px; border-top: 1px solid rgba(24, 144, 255, 0.15); margin-bottom: 6px; }
.gkp-rank { display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto; }
.gkp-rank-row { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.gkp-rank-name { width: 56px; flex: none; color: #595959; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gkp-rank-bar { flex: 1; height: 7px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.gkp-rank-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #1890ff, #40a9ff); }
.gkp-rank-val { width: 24px; text-align: right; color: #262626; font-variant-numeric: tabular-nums; }

/* 镇项目面板 */
.geo-town-panel {
  position: absolute; top: 52px; right: 12px; z-index: 20; width: 280px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 14px; color: #333;
  max-height: calc(100% - 180px); overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.gtp-title { font-size: 14px; font-weight: 700; color: #1890ff; margin-bottom: 10px; }
.gtp-stats { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(24, 144, 255, 0.15); }
.gtp-stat { display: flex; justify-content: space-between; font-size: 12px; }
.gtp-stat .label { color: #8c8c8c; }
.gtp-stat .value { color: #262626; font-weight: 600; font-variant-numeric: tabular-nums; }
.gtp-list { display: flex; flex-direction: column; gap: 8px; }
.gtp-card {
  background: #f7f9fc; border: 1px solid #ebeef5;
  border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s;
}
.gtp-card:hover { background: #e6f7ff; border-color: #1890ff; }
.gtp-card-name { font-size: 13px; font-weight: 600; color: #262626; margin-bottom: 6px; }
.gtp-card-row { display: flex; justify-content: space-between; font-size: 11px; color: #8c8c8c; margin-bottom: 3px; }
.gtp-card-row b { color: #262626; }

/* 项目明细 */
.geo-detail {
  flex: 1; overflow-y: auto; padding: 16px; background: #fff; margin: 8px 12px 12px; border-radius: 8px;
}
.gd-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
.gd-kpi { background: #f7f9fc; border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 12px; text-align: center; }
.gd-kpi-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.gd-kpi-unit { font-size: 11px; font-weight: normal; color: #999; margin-left: 3px; }
.gd-kpi-label { font-size: 12px; color: #999; margin-top: 4px; }
.gd-charts { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 10px; margin-bottom: 14px; }
.gd-card { border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 12px; }
.gd-card-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; padding-left: 6px; border-left: 3px solid var(--c-primary); }
.gd-chart { height: 190px; }
.gd-progress { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.gd-prog { border: 1px solid #ebeef5; border-radius: 6px; padding: 10px 14px; }
.gd-prog-head { display: flex; justify-content: space-between; font-size: 13px; color: #333; margin-bottom: 8px; }
.gd-prog-frac { font-size: 12px; color: #999; margin-top: 6px; }
.gd-toggle { margin-bottom: 12px; }
.gd-mapview { display: flex; gap: 14px; }
.gd-side { width: 170px; flex: none; border: 1px solid #ebeef5; border-radius: 6px; padding: 12px; }
.gd-side-title { font-size: 12px; font-weight: 600; color: #999; margin-bottom: 8px; }
.gd-building {
  padding: 8px 12px; border-radius: 5px; border: 1px solid #d9d9d9; background: #fff;
  font-size: 13px; color: #333; cursor: pointer; margin-bottom: 8px; transition: all 0.2s;
}
.gd-building:hover { border-color: var(--c-primary); color: var(--c-primary); }
.gd-building.on { background: var(--c-primary); border-color: var(--c-primary); color: #fff; }
.floor-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.floor-chip { padding: 3px 10px; border-radius: 3px; background: #f5f5f5; color: #666; font-size: 12px; cursor: pointer; user-select: none; }
.floor-chip:hover { color: var(--c-primary); }
.floor-chip.on { background: var(--c-primary); color: #fff; }
.gd-main { flex: 1; min-width: 0; }
.legend-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.lg-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 3px; background: #fafafa; border: 1px solid #f0f0f0; font-size: 12px; color: #666; }
.lg-chip i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
.gd-filters { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px dashed #ebeef5; margin-top: 4px; }
.gd-filter-label { font-size: 12px; color: #999; }
.gd-range-text { font-size: 12px; color: #666; font-variant-numeric: tabular-nums; }
.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; margin-top: 10px; max-height: 320px; overflow-y: auto; }
.room-card { border: 1px solid #ebeef5; border-top: 3px solid var(--c-primary); border-radius: 6px; padding: 8px 10px; background: #fff; transition: box-shadow 0.2s; }
.room-card:hover { box-shadow: 0 2px 12px rgba(24, 144, 255, 0.2); }
.room-head { display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; }
.room-code { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 3px; }
.room-meta { font-size: 11px; color: #999; margin-bottom: 3px; }
.room-area { font-size: 12px; color: var(--c-primary); font-weight: 600; }
.room-status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.gd-list-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

/* 底部图表 */
.geo-bottom {
  display: flex; gap: 10px; padding: 0 12px 12px;
}
.geo-bottom-card {
  flex: 1; background: #fff; border: 1px solid #e8e8e8;
  border-radius: 8px; padding: 10px 12px;
}
.gbc-title { font-size: 12px; font-weight: 600; color: #1890ff; margin-bottom: 6px; }
.gbc-chart { height: 160px; }

/* 图例 */
.geo-legend {
  position: absolute; right: 12px; bottom: 12px; z-index: 25;
  padding: 10px 12px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(6px);
  border: 1px solid #e8e8e8; border-radius: 8px; color: #333; font-size: 12px;
}
.gl-title { font-weight: 600; color: #1890ff; margin-bottom: 6px; }
.gl-item { display: flex; align-items: center; gap: 6px; line-height: 20px; }
.gl-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }

/* 全屏按钮 */
.geo-fullscreen {
  position: absolute; top: 52px; right: 12px; z-index: 30;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.9); border: 1px solid #d9d9d9;
  border-radius: 6px; color: #1890ff; cursor: pointer;
}
.geo-fullscreen:hover { background: rgba(24, 144, 255, 0.1); }

/* 当 drillLevel=1 时全屏按钮位置调整 */
</style>
