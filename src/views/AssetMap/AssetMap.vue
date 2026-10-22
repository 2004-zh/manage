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
                  <el-icon v-if="!data.children" color="#1668DC"><LocationFilled /></el-icon>
                  <el-icon v-else color="#1668DC"><OfficeBuilding /></el-icon>
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
              <span style="cursor:pointer;color:#1668DC">长乐区</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="drillLevel >= 1" @click="drillTo(1)">
              <span style="cursor:pointer;color:#1668DC">{{ currentTown?.name || '' }}</span>
            </el-breadcrumb-item>
            <el-breadcrumb-item v-if="drillLevel >= 2">
              <span>{{ currentProject?.name || '' }}</span>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-button v-if="drillLevel > 0" link type="primary" size="small" @click="drillTo(drillLevel - 1)" style="margin-left:12px;color:#1668DC">
            ← 返回上一级
          </el-button>
          <div style="flex:1"></div>
        </div>

        <!-- Level 0 & 1: 高德地图 -->
        <div v-if="drillLevel < 2" ref="amapContainerRef" class="amap-container"></div>

        <!-- 左侧 KPI 面板 -->
        <div class="geo-kpi-panel" v-show="drillLevel === 0 && kpiPanelVisible">
          <div class="gkp-title">
            <span>长乐区资产总览</span>
            <el-button link size="small" @click="kpiPanelVisible = false" style="color:#94A3B8;padding:0;margin-left:8px">
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
          <div class="gkp-chart-section">
            <div class="gkp-chart-title">资产性质分布</div>
            <div ref="kpiNatureRef" class="gkp-mini-chart"></div>
          </div>
          <div class="gkp-chart-section">
            <div class="gkp-chart-title">资产类型分布</div>
            <div ref="kpiTypeRef" class="gkp-mini-chart"></div>
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
                <span>出租率 <b :style="{ color: p.rentalRate > 70 ? '#52c41a' : '#E8912A' }">{{ p.rentalRate }}%</b></span>
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
              <div class="gd-prog-head"><span>上月收费率</span><b style="color:#1668DC">{{ ovChargeRate }}%</b></div>
              <el-progress :percentage="ovChargeRate" :show-text="false" :stroke-width="10" color="#1668DC" />
              <div class="gd-prog-frac">实收 {{ ovLastActual }} / 应收 {{ ovLastPlan }} 万元</div>
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
                <span class="lg-chip"><i style="background:#94A3B8"></i>空置超1年 {{ idleOver1y }}</span>
                <span class="lg-chip"><i style="background:#909399"></i>空置6月-1年 {{ idleHalf1y }}</span>
                <span class="lg-chip"><i style="background:#fa8c16"></i>3个月内到期 {{ expiringCount }}</span>
              </div>
              <div class="gd-filters">
                <el-checkbox v-model="showUnrentable" size="small">不可租资产</el-checkbox>
                <span class="gd-filter-label">资产面积筛选</span>
                <el-slider v-model="areaRange" range :min="0" :max="areaMax" size="small" style="width:200px" />
                <span class="gd-range-text">{{ areaRange[0] }} - {{ areaRange[1] }} m²</span>
              </div>
              <div class="room-grid">
                <div class="room-card" v-for="r in visibleRooms" :key="r.code" :style="{ borderTopColor: statusColor(r.status) }" @click="openRoom(r)">
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
              <el-table-column label="租赁状态" width="130">
                <template #default="{ row }">
                  <span class="room-status-dot" :style="{ background: statusColor(row.status) }"></span>
                  <span :style="{ color: statusColor(row.status) }">{{ row.status }}</span>
                  <el-tag v-if="row.mortgageStatus === '已抵押' || row.mortgage === '已抵押'" type="danger" size="small" style="margin-left:4px">已抵押</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination small layout="total, prev, pager, next" :total="filteredRooms.length" :page-size="listPageSize" v-model:current-page="listPage" />
            </div>
          </div>

          <div class="section-title" style="margin-top:20px">项目资产清单</div>
          <el-table :data="projectAssetRows" border stripe size="small" max-height="420">
            <el-table-column prop="code" label="资产编号" width="100" />
            <el-table-column prop="name" label="资产名称" min-width="180" />
            <el-table-column prop="type" label="类型" width="90" />
            <el-table-column prop="area" label="面积(m²)" width="100" align="right">
              <template #default="{ row }">{{ (row.area || 0).toLocaleString() }}</template>
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
          <div class="gl-title">资产密度分布</div>
          <div class="gl-choropleth">
            <span v-for="lv in choroplethLevels" :key="lv.label" class="gl-choro-item">
              <i :style="{ background: lv.color, opacity: lv.opacity + 0.3 }"></i>
              <span>{{ lv.label }}</span>
            </span>
          </div>
          <div class="gl-title" style="margin-top:8px">资产性质</div>
          <div class="gl-item"><span class="gl-dot" style="background:#1668DC"></span>经营性资产</div>
          <div class="gl-item"><span class="gl-dot" style="background:#7c4dff"></span>行政事业性资产</div>
          <div class="gl-item"><span class="gl-dot" style="background:#ff6e40"></span>公共资源类资产</div>
          <div class="gl-title" style="margin-top:8px">资产类型</div>
          <div class="gl-type-grid">
            <span v-for="(color, type) in TYPE_COLOR" :key="type" class="gl-type-item">
              <i :style="{ background: color }"></i>{{ type }}
            </span>
          </div>
        </div>

        <!-- 全屏按钮 -->
        <div class="geo-fullscreen" @click="handleFullscreen">
          <el-icon :size="16"><FullScreen /></el-icon>
        </div>
      </div>
    </el-card>

    <!-- 资产详情 + 生命周期 -->
    <el-dialog v-model="assetDialogVisible" :title="selectedAssetDetail ? `资产详情 — ${selectedAssetDetail.name}` : '资产详情'" width="720px">
      <template v-if="selectedAssetDetail">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="资产编码">{{ selectedAssetDetail.code }}</el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ selectedAssetDetail.type }}</el-descriptions-item>
          <el-descriptions-item label="资产状态">
            <el-tag :type="getStatusType(selectedAssetDetail.status)" size="small">{{ selectedAssetDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="面积">{{ selectedAssetDetail.area?.toLocaleString() }} m²</el-descriptions-item>
          <el-descriptions-item label="年租金">{{ selectedAssetDetail.annualRent ? selectedAssetDetail.annualRent + ' 万元' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ selectedAssetDetail.tenant || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ selectedAssetDetail.project || '-' }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ selectedAssetDetail.location || '-' }}</el-descriptions-item>
          <el-descriptions-item label="权证状态">{{ selectedAssetDetail.certStatus || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section-title" style="margin-top:16px">生命周期</div>
        <el-timeline v-if="assetLifecycleTimeline.length" style="padding-left:4px;max-height:360px;overflow-y:auto">
          <el-timeline-item v-for="(ev, i) in assetLifecycleTimeline" :key="i"
            :timestamp="ev.date" placement="top" size="small" :type="ev.color">
            <div style="font-size:13px">
              <el-tag size="small" :type="ev.tagType" effect="plain" style="margin-right:6px">{{ ev.category }}</el-tag>
              <b>{{ ev.title }}</b>
            </div>
            <div v-if="ev.detail" style="font-size:12px;color:#64748B;margin-top:2px">{{ ev.detail }}</div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无生命周期记录" :image-size="40" />
      </template>

      <template #footer>
        <el-button v-if="selectedAssetDetail?.project && selectedAssetDetail.project !== '-'" type="primary" @click="openFullDetail">进入项目详情</el-button>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import {
  LocationFilled, OfficeBuilding, FullScreen, Search, Close,
  Plus
} from '@element-plus/icons-vue'
import { useProjectStore } from '../../store/project'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useAuditStore } from '../../store/audit'
import { useInspectionStore } from '../../store/inspection'
import { useMortgageStore } from '../../store/mortgage'
import { useFinanceStore } from '../../store/finance'
import { TOWN_SEED, PROJECT_COORDS, TOWN_PROJECT_MAP, resolveTown, CHANGLE_BOUNDS } from '../../data/locations'

const route = useRoute()
const router = useRouter()
const isRegionMode = computed(() => route.name === 'EntRegionDivision')
const projectStore = useProjectStore()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const auditStore = useAuditStore()
const inspectionStore = useInspectionStore()
const mortgageStore = useMortgageStore()
const financeStore = useFinanceStore()

// 资产类型 → 地图标记颜色（与驾驶舱饼图 PALETTE 顺序一致）
const TYPE_COLOR = {
  '住宅': '#1668DC', '商铺': '#13C2C2', '写字楼': '#C8963E', '厂房': '#722ED1',
  '综合用房': '#52C41A', '仓储': '#FA8C16', '农贸市场': '#F5222D', '仓储/土地': '#2F54EB',
  '车辆': '#EB2F96', '船舶': '#13C2C2', '车位': '#722ED1', '公共设备': '#FA8C16',
  '股权': '#52C41A', '采矿权': '#C8963E', '探矿权': '#2F54EB', '特种行业': '#EB2F96',
  '特许经营权': '#1668DC', '特殊动植物': '#F5222D'
}
function typeColor(type) { return TYPE_COLOR[type] || '#1668DC' }
function getProjectCoords(p) {
  if (p.lng && p.lat) return { lng: p.lng, lat: p.lat }
  return PROJECT_COORDS[p.id] || { lng: 119.53, lat: 25.90 }
}

const drillLevel = ref(0)
const currentTown = ref(null)
const currentProject = ref(null)
const assetDialogVisible = ref(false)
const selectedAssetDetail = ref(null)

const assetLifecycleTimeline = computed(() => {
  const d = selectedAssetDetail.value
  if (!d) return []
  const aid = d.code || d.id
  if (!aid) return []
  const events = []

  // 1. 审计留痕（入库、变更、调拨、处置等）
  auditStore.getByAsset(aid).forEach(r => {
    const isDispose = /处置|退出|删除|报废/.test(r.action)
    const isTransfer = r.action.includes('调拨')
    events.push({
      date: (r.time || '').slice(0, 10),
      category: r.module || '系统',
      title: r.action,
      detail: r.remark || (r.fieldLabel ? `${r.fieldLabel}: ${r.before} → ${r.after}` : ''),
      color: isDispose ? 'danger' : isTransfer ? 'warning' : 'primary',
      tagType: isDispose ? 'danger' : isTransfer ? 'warning' : ''
    })
  })

  // 2. 合同（签订、到期）
  contractStore.getContractsByAsset(aid).forEach(c => {
    events.push({
      date: c.startDate,
      category: '合同',
      title: `签订合同（${c.tenant}）`,
      detail: `年租金 ${c.annualRent} 万元，至 ${c.endDate}`,
      color: 'success',
      tagType: 'success'
    })
    if (c.status === '已终止' || c.status === '退租') {
      events.push({
        date: c.endDate,
        category: '合同',
        title: `合同终止（${c.tenant}）`,
        detail: `状态：${c.status}`,
        color: 'info',
        tagType: 'info'
      })
    }
  })

  // 3. 抵押
  mortgageStore.getMortgagesByAsset(aid).forEach(m => {
    events.push({
      date: m.startDate,
      category: '抵押',
      title: `${m.status}（${m.bank}）`,
      detail: `金额 ${m.amount} 万元，至 ${m.endDate}`,
      color: m.status === '抵押中' ? 'danger' : 'success',
      tagType: m.status === '抵押中' ? 'danger' : 'success'
    })
  })

  // 4. 巡查
  inspectionStore.getInspectionsByAssetId(aid).forEach(insp => {
    events.push({
      date: insp.inspectionDate,
      category: '巡查',
      title: `${insp.status}（巡查人：${insp.inspector}）`,
      detail: insp.issueCount ? `发现问题 ${insp.issueCount} 项` : '',
      color: insp.status === '正常' ? 'success' : 'warning',
      tagType: insp.status === '正常' ? 'success' : 'warning'
    })
  })

  // 5. 报修
  inspectionStore.getRepairsByAssetId(aid).forEach(rep => {
    events.push({
      date: rep.reportDate,
      category: '报修',
      title: rep.issue || '报修登记',
      detail: `状态：${rep.status}，报修人：${rep.reporter}`,
      color: rep.status === '已完成' ? 'success' : 'warning',
      tagType: rep.status === '已完成' ? 'success' : 'warning'
    })
  })

  // 6. 保证金
  financeStore.deposits.filter(dep => dep.assetId === aid).forEach(dep => {
    events.push({
      date: dep.payDate,
      category: '财务',
      title: `缴纳保证金 ${dep.amount} 万元`,
      detail: `状态：${dep.payStatus || dep.status}`,
      color: 'primary',
      tagType: ''
    })
    if (dep.refundDate) {
      events.push({
        date: dep.refundDate,
        category: '财务',
        title: `退还保证金 ${dep.refundAmount || dep.amount} 万元`,
        detail: `方式：${dep.refundMethod || '-'}`,
        color: 'info',
        tagType: 'info'
      })
    }
  })

  // 按日期倒序（最新在前）
  events.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return events
})

function openFullDetail() {
  const d = selectedAssetDetail.value
  if (!d) return
  const projectName = d.project
  if (!projectName || projectName === '-') {
    ElMessage.info('该资产未关联项目，无法进入项目详情')
    return
  }
  const project = allProjects.value.find(p => p.name === projectName)
  if (project) {
    assetDialogVisible.value = false
    const townCode = Object.entries(TOWN_PROJECT_MAP).find(([, ids]) => ids.includes(project.id))?.[0]
    if (townCode) {
      const t = towns.value.find(tw => tw.code === townCode)
      if (t) currentTown.value = t
    }
    drillLevel.value = 1
    nextTick(() => enterProject(project))
  } else {
    ElMessage.info('未找到关联项目')
  }
}
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
let amapAssetMarkers = []

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
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(s)
  })
}

// 防止 initAmap 无限重试和并发调用
let amapInitRetries = 0
const AMAP_INIT_MAX_RETRIES = 10
let amapInitializing = false
let amapReady = false  // 地图完全就绪标志（防止过渡期间事件访问已销毁实例）

function initAmap() {
  console.log('[AssetMap] initAmap called, container:', !!amapContainerRef.value, 'instance:', !!amapInstance)
  // 如果已有有效实例且容器存在，跳过重复初始化
  if (amapInstance && amapContainerRef.value) {
    console.log('[AssetMap] 地图实例已存在，跳过初始化')
    return
  }
  // 防止并发调用
  if (amapInitializing) {
    console.log('[AssetMap] 地图正在初始化中，跳过重复调用')
    return
  }
  // 重试上限保护
  if (amapInitRetries >= AMAP_INIT_MAX_RETRIES) {
    console.error('[AssetMap] 地图初始化重试次数超限，放弃初始化')
    amapInitRetries = 0
    return
  }
  if (!amapContainerRef.value) {
    console.log('[AssetMap] container ref is null, retrying in 300ms')
    amapInitRetries++
    setTimeout(initAmap, 300)
    return
  }
  if (amapInstance) {
    try { amapInstance.destroy() } catch (e) { console.warn('旧地图实例销毁失败:', e) }
    amapInstance = null
    amapDistrictPolygons = []
    amapMarkers = []
    amapLabels = []
  }
  const el = amapContainerRef.value
  console.log('[AssetMap] container size:', el.offsetWidth, 'x', el.offsetHeight)
  if (!el.offsetWidth || !el.offsetHeight) {
    console.log('[AssetMap] container has no size, retrying in 300ms')
    amapInitRetries++
    setTimeout(initAmap, 300)
    return
  }
  amapInitializing = true
  el.innerHTML = ''
  console.log('[AssetMap] creating AMap instance')
  amapInstance = new window.AMap.Map(el, {
    zoom: 15,
    center: [119.53, 25.90],
    mapStyle: 'amap://styles/normal',
    viewMode: '2D',
    resizeEnable: true,
    showIndoorMap: false,
    showBuildingBlock: false
  })
  amapInitializing = false
  amapInitRetries = 0
  console.log('[AssetMap] AMap instance created:', !!amapInstance)
  // 使用 nextTick 确保地图完全初始化后再加载覆盖物
  nextTick(() => {
    loadDistrictBoundary()
    if (drillLevel.value === 0) addProjectMarkers()
    else if (drillLevel.value === 1) addTownMarkers()
    addExistingMapAssets()
    amapReady = true
    console.log('[AssetMap] 地图就绪，amapReady = true')
  })
}

function addExistingMapAssets() {
  if (!amapInstance || !window.AMap) return
  amapAssetMarkers.forEach(m => amapInstance.remove(m))
  amapAssetMarkers = []
  assetStore.visibleAssets.forEach(a => {
    if (a.lng && a.lat) addMapAssetMarker(a)
  })
}

function clearAmapOverlays() {
  amapDistrictPolygons.forEach(p => amapInstance?.remove(p))
  amapDistrictPolygons = []
  amapMarkers.forEach(m => amapInstance?.remove(m))
  amapMarkers = []
  amapLabels.forEach(l => amapInstance?.remove(l))
  amapLabels = []
  amapAssetMarkers.forEach(m => amapInstance?.remove(m))
  amapAssetMarkers = []
}

/* 按资产数量分级着色 */
const choroplethLevels = [
  { min: 80, color: '#1668DC', opacity: 0.65, label: '80+ 宗' },
  { min: 40, color: '#4C8DFF', opacity: 0.52, label: '40-79 宗' },
  { min: 20, color: '#7CB5FF', opacity: 0.42, label: '20-39 宗' },
  { min: 5,  color: '#B4D5FF', opacity: 0.32, label: '5-19 宗' },
  { min: 0,  color: '#E8F2FF', opacity: 0.25, label: '< 5 宗' }
]
function choroplethColor(count) {
  for (const lv of choroplethLevels) {
    if (count >= lv.min) return { color: lv.color, opacity: lv.opacity }
  }
  return { color: '#E8F2FF', opacity: 0.1 }
}

/* ---- Voronoi 多边形裁剪（Sutherland-Hodgman） ---- */
function clipPolygonByBisector(polygon, seed, other) {
  const mx = (seed[0] + other[0]) / 2
  const my = (seed[1] + other[1]) / 2
  const dx = seed[0] - other[0]
  const dy = seed[1] - other[1]
  const inside = (p) => (p[0] - mx) * dx + (p[1] - my) * dy >= 0
  if (polygon.length === 0) return polygon
  const out = []
  for (let i = 0; i < polygon.length; i++) {
    const cur = polygon[i]
    const prev = polygon[(i + polygon.length - 1) % polygon.length]
    const curIn = inside(cur)
    const prevIn = inside(prev)
    if (curIn) {
      if (!prevIn) {
        const inter = lineIntersect(prev, cur, mx, my, dx, dy)
        if (inter) out.push(inter)
      }
      out.push(cur)
    } else if (prevIn) {
      const inter = lineIntersect(prev, cur, mx, my, dx, dy)
      if (inter) out.push(inter)
    }
  }
  return out
}
function lineIntersect(a, b, mx, my, dx, dy) {
  const ex = b[0] - a[0], ey = b[1] - a[1]
  const denom = ex * dx + ey * dy
  if (Math.abs(denom) < 1e-12) return null
  const t = ((mx - a[0]) * dx + (my - a[1]) * dy) / denom
  return [a[0] + t * ex, a[1] + t * ey]
}

async function loadDistrictBoundary() {
  console.log('[AssetMap] loadDistrictBoundary called, AMap:', !!window.AMap)
  if (!window.AMap || !amapInstance) {
    console.warn('[AssetMap] AMap 或地图实例未就绪，跳过边界加载')
    return
  }
  clearAmapOverlays()

  try {
    console.log('[AssetMap] 开始加载长乐区边界数据 (adcode: 350112)...')
    const response = await fetch('https://geo.datav.aliyun.com/areas_v3/bound/350112.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const geoJSON = await response.json()
    console.log('[AssetMap] 边界数据加载成功')

    if (!geoJSON.features || geoJSON.features.length === 0) {
      console.warn('[AssetMap] 边界数据为空')
      return
    }

    const feature = geoJSON.features[0]
    const coords = feature.geometry.coordinates
    let outlineRing = []
    if (feature.geometry.type === 'MultiPolygon') {
      outlineRing = coords[0][0]
    } else if (feature.geometry.type === 'Polygon') {
      outlineRing = coords[0]
    }
    if (outlineRing.length === 0) return

    const townList = TOWN_SEED
    const cells = townList.map((town, i) => {
      let cell = outlineRing.map(c => [c[0], c[1]])
      for (let j = 0; j < townList.length; j++) {
        if (j === i) continue
        cell = clipPolygonByBisector(cell, [town.lng, town.lat], [townList[j].lng, townList[j].lat])
        if (cell.length < 3) break
      }
      return { town, cell }
    })

    cells.forEach(({ town, cell }) => {
      if (cell.length < 3) return
      const matched = towns.value.find(t => t.name === town.name)
      const count = matched ? matched.assetCount : 0
      const { color, opacity } = choroplethColor(count)

      const paths = [cell.map(c => new window.AMap.LngLat(c[0], c[1]))]
      const polygon = new window.AMap.Polygon({
        path: paths,
        fillColor: color,
        fillOpacity: opacity,
        strokeColor: '#1668DC',
        strokeWeight: 1.5,
        strokeOpacity: 0.8,
        cursor: 'pointer'
      })
      polygon.on('click', () => {
        if (matched) handleTownClick(matched)
      })
      polygon.setMap(amapInstance)
      amapDistrictPolygons.push(polygon)

      const label = new window.AMap.Text({
        text: town.name,
        position: new window.AMap.LngLat(town.lng, town.lat),
        style: {
          color: '#333',
          fontSize: '13px',
          fontWeight: '600',
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid #1668DC',
          borderRadius: '4px',
          padding: '3px 8px'
        }
      })
      label.setMap(amapInstance)
      amapLabels.push(label)
    })

    console.log('[AssetMap] 长乐区乡镇边界绘制完成，区域数:', cells.filter(c => c.cell.length >= 3).length)
  } catch (e) {
    console.error('[AssetMap] 边界加载失败:', e)
  }
}

function addProjectMarkers() {
  if (!amapInstance || !window.AMap) return
  amapMarkers.forEach(m => amapInstance.remove(m))
  amapMarkers = []
  allProjects.value.forEach(p => {
    const c = getProjectCoords(p)
    const color = typeColor(p.type)
    const stats = assetStore.projectStats(p.id)
    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(c.lng, c.lat),
      content: `<div style="position:relative;width:14px;height:14px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color}33;animation:amap-ping 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:1.5px solid #fff"></div>
      </div>`,
      offset: new window.AMap.Pixel(-7, -7),
      cursor: 'pointer'
    })
    marker.on('click', () => showProjectInfoWindow(p, c, stats))
    marker.setMap(amapInstance)
    amapMarkers.push(marker)
  })
}

function addTownMarkers() {
  if (!amapInstance || !window.AMap || !currentTown.value) return
  amapMarkers.forEach(m => amapInstance.remove(m))
  amapMarkers = []
  const ids = TOWN_PROJECT_MAP[currentTown.value.code] || []
  const projects = allProjects.value.filter(p => ids.includes(p.id))
  projects.forEach(p => {
    const c = getProjectCoords(p)
    const color = typeColor(p.type)
    const stats = assetStore.projectStats(p.id)
    const marker = new window.AMap.Marker({
      position: new window.AMap.LngLat(c.lng, c.lat),
      content: `<div style="position:relative;width:16px;height:16px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:${color}33;animation:amap-ping 2s infinite"></div>
        <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:1.5px solid #fff"></div>
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
    marker.on('click', () => showProjectInfoWindow(p, c, stats))
    marker.setMap(amapInstance)
    label.setMap(amapInstance)
    amapMarkers.push(marker)
    amapLabels.push(label)
  })
  addExistingMapAssets()
}

/* 9 个乡镇 — 用于 KPI 面板和镇级下钻；资产数/面积/出租率按镇域项目的真实资产统计派生 */
/* TOWN_SEED, PROJECT_COORDS, TOWN_PROJECT_MAP 已从 src/data/locations.js 导入 */


const towns = computed(() => TOWN_SEED.map(t => {
  const ids = TOWN_PROJECT_MAP[t.code] || []
  let assetCount = 0, totalArea = 0, rentedCount = 0
  ids.forEach(id => {
    const s = assetStore.projectStats(id)
    assetCount += s.totalAssets
    totalArea += s.totalArea
    rentedCount += s.rentedCount
  })
  return {
    ...t,
    assetCount,
    totalArea,
    rentalRate: assetCount ? Math.round(rentedCount / assetCount * 1000) / 10 : 0
  }
}))

const allProjects = computed(() => {
  const list = projectStore.visibleProjects || []
  // 宗数/面积/出租率/收入统一从资产与实收流水算，种子里的假统计不再上屏
  return list.filter(b => b.id !== 'BLD-001').map(b => {
    const r = contractStore.projectReceipts(b.id)
    return { ...b, ...assetStore.projectStats(b.id), cumIncome: r.cumActual, yearIncome: r.yearActual }
  })
})

/* 从资产对象解析所属项目：优先 projectName，再按 projectId 查 store */
function resolveAssetProjectName(asset) {
  if (asset.projectName) return asset.projectName
  if (asset.projectId) {
    const p = projectStore.getProjectById(asset.projectId)
    if (p) return p.name
  }
  return ''
}
function resolveAssetProjectObj(asset) {
  if (asset.projectName) {
    const found = allProjects.value.find(p => p.name === asset.projectName)
    if (found) return found
  }
  if (asset.projectId) {
    return allProjects.value.find(p => p.id === asset.projectId) || null
  }
  return null
}

const currentTownProjects = computed(() => {
  if (!currentTown.value) return []
  const ids = TOWN_PROJECT_MAP[currentTown.value.code] || []
  return allProjects.value.filter(p => ids.includes(p.id))
})

/* KPI */
const geoKpis = computed(() => {
  const va = assetStore.visibleAssets
  const ps = allProjects.value
  const totalAssets = va.length
  const totalArea = va.reduce((s, a) => s + (Number(a.area) || 0), 0)
  const inUse = va.filter(a => ['已出租', '部分出租', '自用'].includes(a.status)).length
  const vacant = va.filter(a => ['闲置', '空置'].includes(a.status)).length
  const vacantArea = va.filter(a => ['闲置', '空置'].includes(a.status)).reduce((s, a) => s + (Number(a.area) || 0), 0)
  const utilRate = totalAssets ? (inUse / totalAssets * 100).toFixed(1) : '0.0'
  const totalIncome = ps.reduce((s, p) => s + p.cumIncome, 0)
  const yearIncome = ps.reduce((s, p) => s + p.yearIncome, 0)
  return [
    { label: '资产总数', value: totalAssets.toLocaleString(), unit: '宗' },
    { label: '总面积', value: (totalArea / 10000).toFixed(1), unit: '万m²' },
    { label: '使用中', value: inUse.toLocaleString(), unit: '宗' },
    { label: '空置数', value: vacant.toLocaleString(), unit: '宗' },
    { label: '利用率', value: utilRate, unit: '%' },
    { label: '闲置面积', value: (vacantArea / 10000).toFixed(1), unit: '万m²' },
    { label: '累计收入', value: totalIncome.toFixed(0), unit: '万元' },
    { label: '本年收入', value: yearIncome.toFixed(0), unit: '万元' }
  ]
})

const townRank = computed(() => {
  const max = Math.max(1, ...towns.value.map(t => t.assetCount))
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
    { label: '资产总数', value: p.totalAssets, unit: '宗', color: '#1668DC' },
    { label: '总面积', value: (p.totalArea / 10000).toFixed(1), unit: '万m²', color: '#722ed1' },
    { label: '出租率', value: p.rentalRate, unit: '%', color: '#52c41a' },
    { label: '累计收入', value: p.cumIncome.toFixed(0), unit: '万元', color: '#fa8c16' },
    { label: '本年收入', value: p.yearIncome.toFixed(0), unit: '万元', color: '#13c2c2' },
    { label: '闲置数', value: p.idleCount, unit: '宗', color: '#f5222d' }
  ]
})

/* ==================== 交互 ==================== */
function handleTownClick(t) {
  if (!amapReady) return  // 地图未就绪，忽略点击
  currentTown.value = t
  drillLevel.value = 1
  if (amapInstance && window.AMap) {
    amapInstance.setZoomAndCenter(13, new window.AMap.LngLat(t.lng, t.lat))
  }
}

/* 进入项目层：房间清单为派生只读视图，楼栋/楼层选中值跟随真实结构 */
function enterProject(p) {
  currentProject.value = p
  drillLevel.value = 2
  // v-if="drillLevel < 2" 会销毁地图容器 DOM，提前清理实例避免残留引用导致返回时崩溃
  amapReady = false  // 标记地图不可用
  if (amapInstance) {
    try { amapInstance.destroy() } catch (e) { console.warn('进入项目层，销毁地图实例失败:', e) }
    amapInstance = null
    amapDistrictPolygons = []
    amapMarkers = []
    amapLabels = []
    amapAssetMarkers = []
  }
  if (amapInfoWindow) { try { amapInfoWindow.close() } catch (e) {} amapInfoWindow = null }
  const rs = roomsOfProject(p)
  activeBuilding.value = [...new Set(rs.map(r => r.building))][0] || ''
  const floors = [...new Set(rs.filter(r => r.building === activeBuilding.value).map(r => r.floor))]
    .sort((a, b) => (parseInt(a) || 1) - (parseInt(b) || 1))
  activeFloor.value = floors[0] || '1F'
  detailView.value = 'map'
  showUnrentable.value = false
  const maxArea = Math.max(1000, Math.ceil(rs.reduce((m, r) => Math.max(m, r.area || 0), 0) / 100) * 100)
  areaRange.value = [0, maxArea]
  listCodeKw.value = ''
  appliedListCode.value = ''
  listStatus.value = ''
  listType.value = ''
  listZone.value = ''
  listPage.value = 1
  nextTick(initDetailCharts)
}

function handleMarkerClick(m) {
  const townCode = Object.entries(TOWN_PROJECT_MAP).find(([, ids]) => ids.includes(m.id))?.[0]
  if (townCode) {
    const t = towns.value.find(tw => tw.code === townCode)
    if (t) currentTown.value = t
  }
  enterProject(m)
}

function handleProjectClick(p) {
  enterProject(p)
}

let amapInfoWindow = null
function showProjectInfoWindow(p, coords, stats) {
  if (!amapInstance || !window.AMap) return
  if (amapInfoWindow) { amapInfoWindow.close() }
  const totalAssets = stats.totalAssets || 0
  const totalArea = stats.totalArea || 0
  const rentedPct = totalAssets ? Math.round((stats.rentedCount || 0) / totalAssets * 100) : 0
  const pid = p.id
  const content = `<div style="min-width:220px;font-family:inherit;padding:4px 0">
    <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:6px">${p.name}</div>
    <div style="display:flex;gap:16px;margin-bottom:6px">
      <span style="font-size:12px;color:#64748B">类型 <b style="color:#334155">${p.type || '—'}</b></span>
      <span style="font-size:12px;color:#64748B">资产 <b style="color:#1668DC">${totalAssets} 宗</b></span>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:8px">
      <span style="font-size:12px;color:#64748B">面积 <b style="color:#334155">${totalArea.toLocaleString()} m²</b></span>
      <span style="font-size:12px;color:#64748B">出租率 <b style="color:#52C41A">${rentedPct}%</b></span>
    </div>
    <div style="text-align:right;display:flex;gap:6px;justify-content:flex-end">
      <button onclick="window.__amapEnterProject__('${pid}')" style="background:#1668DC;color:#fff;border:none;border-radius:4px;padding:4px 14px;font-size:12px;cursor:pointer">查看详情 →</button>
    </div>
  </div>`
  amapInfoWindow = new window.AMap.InfoWindow({
    content,
    offset: new window.AMap.Pixel(0, -12),
    closeWhenClickMap: true
  })
  amapInfoWindow.open(amapInstance, [coords.lng, coords.lat])
}
window.__amapEnterProject__ = (pid) => {
  const p = allProjects.value.find(x => x.id === pid)
  if (p) {
    if (amapInfoWindow) { amapInfoWindow.close(); amapInfoWindow = null }
    handleMarkerClick(p)
  }
}

const drillTo = (level) => {
  console.log('[AssetMap] drillTo called, level:', level, 'current drillLevel:', drillLevel.value)
  if (level === 0) {
    drillLevel.value = 0
    currentTown.value = null
    currentProject.value = null
  } else if (level === 1) {
    // 从 Level 2 返回 Level 1 时，需要恢复 currentTown
    // 如果 currentTown 为空，默认使用第一个有资产的乡镇
    if (!currentTown.value && towns.value.length > 0) {
      currentTown.value = towns.value.find(t => t.assetCount > 0) || towns.value[0]
    }
    drillLevel.value = 1
    currentProject.value = null
  }
  console.log('[AssetMap] drillTo completed, drillLevel:', drillLevel.value, 'currentTown:', currentTown.value?.name)
  // 地图重建/刷新统一由 watch(drillLevel) 处理，避免两处重复调用导致双重 init
}

watch(drillLevel, (v) => {
  if (v !== 2) disposeDetailCharts()
  if (v < 2 && !amapInstance) {
    // 从项目详情（level 2）返回时，地图容器被 v-if 销毁重建，需要重新初始化
    console.log('[AssetMap] watch 触发地图重建，level:', v)
    nextTick(() => {
      try { initAmap() } catch (e) { console.error('地图重建失败:', e) }
    })
  } else if (v === 1) {
    nextTick(() => {
      if (amapInstance) { loadDistrictBoundary(); addTownMarkers() }
    })
  } else if (v === 0) {
    nextTick(() => {
      if (amapInstance) { loadDistrictBoundary(); addProjectMarkers(); addExistingMapAssets() }
    })
  }
})

/* ==================== 资产明细 ==================== */
const detailView = ref('map')
/* 房间清单：由 assetStore 房间级资产 + contractStore 在租合同派生，不再随机生成 */
const rooms = computed(() => currentProject.value ? roomsOfProject(currentProject.value) : [])
const buildingList = computed(() => [...new Set(rooms.value.map(r => r.building))])
const activeBuilding = ref('')
const activeFloor = ref('1F')
const showUnrentable = ref(false)
const areaRange = ref([0, 1000])
const areaMax = computed(() => {
  const m = rooms.value.reduce((s, r) => Math.max(s, r.area || 0), 0)
  return Math.max(1000, Math.ceil(m / 100) * 100)
})

const statusLegend = [
  { name: '已租赁', color: '#52c41a' },
  { name: '未租赁', color: '#E8912A' },
  { name: '审批中', color: '#1668DC' },
  { name: '已占用', color: '#722ed1' },
  { name: '处置中', color: '#f5222d' },
  { name: '流转中', color: '#13c2c2' },
  { name: '调拨中', color: '#2F54EB' }
]
const roomTypeOptions = computed(() => [...new Set(rooms.value.map(r => r.type).filter(Boolean))])
const zoneOptions = computed(() => [...new Set(rooms.value.map(r => r.zone).filter(Boolean))])

function statusColor(s) { return (statusLegend.find(x => x.name === s) || {}).color || '#94A3B8' }
function certTagType(c) { return { 有产权证: 'success', 无产权: 'danger', 办理中: 'warning' }[c] || 'info' }
function statusCount(s) { return rooms.value.filter(r => r.status === s).length }

/* 真实房间资产 → 地图房间视图：楼栋=分区、楼层=层名，租赁状态优先看在租合同 */
function statusOfRoom(a, c) {
  if (c) return '已租赁'
  switch (a.status) {
    case '已出租': case '部分出租': return '已租赁'
    case '自用': return '已占用'
    case '待处置': case '报废': return '处置中'
    case '流转中': return '流转中'
    case '调拨中': return '调拨中'
    case '审批中': return '审批中'
    default: return '未租赁'
  }
}

function certOfRoom(a) {
  const s = String(a.certStatus || '')
  if (s === '已办证' || s === '有产权证') return '有产权证'
  if (s.includes('办理中')) return '办理中'
  return '无产权'
}

function roomsOfProject(project) {
  const list = assetStore.getProjectAssets(project.id)
  const now = Date.now()
  return list.map(a => {
    const c = contractStore.getContractsByAsset(a.id).find(x => x.status !== '已终止' && x.status !== '退租')
    const status = statusOfRoom(a, c)
    const rented = status === '已租赁'
    let idlePeriod = ''
    if (!rented) {
      const vd = Number(a.vacancyDays) || 0
      if (vd >= 365) idlePeriod = '空置超1年'
      else if (vd >= 180) idlePeriod = '空置6月-1年'
    }
    let expiring = false
    const expiry = a.leaseExpiry || (c ? c.endDate : '')
    if (rented && expiry) {
      const days = (new Date(expiry).getTime() - now) / 86400000
      expiring = days >= 0 && days <= 90
    }
    return {
      id: a.id,
      contractId: c ? c.id : '',
      building: a.zoneName || project.name || '项目本部',
      floor: a.floorName || '1F',
      zone: a.zoneName || '—',
      code: a.assetNo || a.id,
      name: a.name,
      location: a.location || `长乐区${project.name || ''}`,
      type: a.type || '综合用房',
      area: Number(a.area) || 0,
      status,
      unrentable: status === '已占用' || status === '处置中',
      certStatus: certOfRoom(a),
      certNo: a.certDetail || '—',
      mortgage: a.mortgageStatus || '—',
      tenant: a.tenant || (c ? c.tenant : ''),
      idlePeriod,
      expiring
    }
  })
}

/* 房间点击：企业端有在租合同 → 跳合同详情，否则弹资产详情 */
function openRoom(r) {
  if (r.contractId && route.name === 'EntAssetMap') {
    router.push({ name: 'EntContractDetail', params: { id: r.contractId } })
    return
  }
  const a = assetStore.getAssetById(r.id)
  selectedAssetDetail.value = a
    ? {
        code: a.assetNo || a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        area: a.area,
        annualRent: a.annualRent,
        tenant: r.tenant || a.tenant || '-',
        project: resolveAssetProjectName(a) || (currentProject.value && currentProject.value.name) || '-',
        location: a.location,
        certStatus: a.certStatus
      }
    : {
        code: r.code,
        name: r.name,
        type: r.type,
        status: r.status,
        area: r.area,
        annualRent: null,
        tenant: r.tenant || '-',
        project: currentProject.value ? currentProject.value.name : '-',
        location: r.location,
        certStatus: r.certStatus
      }
  assetDialogVisible.value = true
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
/* 上月收费率/实收/计划：全部取自合同库真实实收流水 */
const projReceipts = computed(() => currentProject.value ? contractStore.projectReceipts(currentProject.value.id) : null)
const ovChargeRate = computed(() => projReceipts.value ? projReceipts.value.lastMonthRate : 0)
const ovLastActual = computed(() => projReceipts.value ? Math.round(projReceipts.value.lastMonthActual * 10) / 10 : 0)
const ovLastPlan = computed(() => projReceipts.value ? Math.round(projReceipts.value.monthlyPlan * 10) / 10 : 0)

/* 项目资产清单：真实项目资产（房间级 + 挂入的平铺资产），承租方兜底取在租合同 */
const projectAssetRows = computed(() => {
  if (!currentProject.value) return []
  return assetStore.getProjectAssets(currentProject.value.id).map(a => {
    const c = contractStore.getContractsByAsset(a.id).find(x => x.status !== '已终止' && x.status !== '退租')
    return {
      ...a,
      code: a.assetNo || a.id,
      project: a.projectName || currentProject.value.name,
      tenant: a.tenant || (c ? c.tenant : ''),
      annualRent: a.annualRent || (c ? c.annualRent : null)
    }
  })
})

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
const kpiNatureRef = ref(null)
const kpiTypeRef = ref(null)
let rentDonut = null, typePie = null, monthBar = null, typeDist = null, townRateChart = null, incomeTrend = null
let kpiNatureChart = null, kpiTypeChart = null

const darkAxis = {
  axisLine: { lineStyle: { color: '#E2E8F0' } },
  axisLabel: { color: '#94A3B8', fontSize: 12 },
  splitLine: { lineStyle: { color: '#E2E8F0' } }
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
      legend: { bottom: 0, textStyle: { fontSize: 12, color: '#94A3B8' }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['48%', '70%'], center: ['50%', '44%'], label: { show: false },
        data: [
          { value: ovRentedCount.value, name: '已租赁', itemStyle: { color: '#52c41a' } },
          { value: ovTotalCount.value - ovRentedCount.value, name: '未租赁', itemStyle: { color: '#E8912A' } }
        ]
      }]
    })
  }
  if (typePieRef.value) {
    typePie = echarts.init(typePieRef.value)
    const counts = {}
    rooms.value.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1 })
    const colors = { 商铺: '#52c41a', 办公: '#fa8c16', 厂房: '#722ed1', 仓储: '#1668DC', 综合用房: '#13c2c2' }
    typePie.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      legend: { bottom: 0, textStyle: { fontSize: 12, color: '#94A3B8' }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: '62%', center: ['50%', '44%'], label: { show: false },
        data: Object.keys(counts).map(k => ({ value: counts[k], name: k, itemStyle: { color: colors[k] || '#94A3B8' } }))
      }]
    })
  }
  if (monthBarRef.value) {
    monthBar = echarts.init(monthBarRef.value)
    // 近一年每月实收：合同库实收流水按项目聚合
    const r = projReceipts.value
    const months = r ? r.months.map(x => x.m) : []
    monthBar.setOption({
      grid: { left: 36, right: 10, top: 16, bottom: 22 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: months, ...darkAxis, axisLabel: { color: '#94A3B8', fontSize: 12, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [{
        type: 'bar', barWidth: 8,
        data: r ? r.months.map(x => x.v) : [],
        itemStyle: { color: '#1668DC', borderRadius: [3, 3, 0, 0] }
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
    // 资产类型分布：全量在册资产按类型计数
    const counts = {}
    assetStore.visibleAssets.forEach(a => {
      const k = a.type || '其他'
      counts[k] = (counts[k] || 0) + 1
    })
    const palette = ['#1668DC', '#13C2C2', '#C8963E', '#722ED1', '#52C41A', '#FA8C16', '#F5222D', '#2F54EB']
    typeDist.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: '#94A3B8', fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['40%', '65%'], center: ['50%', '42%'], label: { show: false },
        data: Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([k, v], i) => ({ value: v, name: k, itemStyle: { color: palette[i % palette.length] } }))
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
      yAxis: { type: 'category', data: sorted.map(t => t.name), ...darkAxis, axisLabel: { color: '#94A3B8', fontSize: 12 } },
      series: [{
        type: 'bar', barWidth: 10,
        data: sorted.map(t => ({
          value: t.rentalRate,
          itemStyle: { color: t.rentalRate > 70 ? '#52c41a' : t.rentalRate > 50 ? '#E8912A' : '#f5222d', borderRadius: [0, 3, 3, 0] }
        }))
      }]
    })
  }
  if (incomeTrendRef.value) {
    incomeTrend = echarts.init(incomeTrendRef.value)
    // 近12个月收入趋势：全部管辖项目的实收流水逐月合并
    const agg = {}
    allProjects.value.forEach(p => {
      contractStore.projectReceipts(p.id).months.forEach(({ m, v }) => {
        agg[m] = (agg[m] || 0) + v
      })
    })
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getMonth() + 1}月`)
    }
    incomeTrend.setOption({
      grid: { left: 40, right: 16, top: 20, bottom: 22 },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: months, ...darkAxis, axisLabel: { color: '#94A3B8', fontSize: 12, interval: 0 } },
      yAxis: { type: 'value', ...darkAxis },
      series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
        data: months.map(m => Math.round((agg[m] || 0) * 10) / 10),
        lineStyle: { color: '#1668DC', width: 2 },
        itemStyle: { color: '#1668DC' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(22,104,220,0.3)' },
          { offset: 1, color: 'rgba(22,104,220,0.02)' }
        ]) }
      }]
    })
  }
}

function initKpiCharts() {
  kpiNatureChart?.dispose(); kpiNatureChart = null
  kpiTypeChart?.dispose(); kpiTypeChart = null
  const va = assetStore.visibleAssets
  if (kpiNatureRef.value) {
    kpiNatureChart = echarts.init(kpiNatureRef.value)
    const natureCounts = {}
    va.forEach(a => {
      const k = a.assetCategory || '其他'
      natureCounts[k] = (natureCounts[k] || 0) + 1
    })
    const natureColors = { '经营性资产': '#1668DC', '行政事业性资产': '#7c4dff', '公共资源类资产': '#ff6e40' }
    kpiNatureChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '68%'], center: ['50%', '50%'],
        label: { show: false },
        data: Object.entries(natureCounts).map(([k, v]) => ({
          value: v, name: k, itemStyle: { color: natureColors[k] || '#94A3B8' }
        }))
      }]
    })
  }
  if (kpiTypeRef.value) {
    kpiTypeChart = echarts.init(kpiTypeRef.value)
    const typeCounts = {}
    va.forEach(a => {
      const k = a.type || '其他'
      typeCounts[k] = (typeCounts[k] || 0) + 1
    })
    const palette = ['#1668DC', '#13C2C2', '#C8963E', '#722ED1', '#52C41A', '#FA8C16', '#F5222D', '#2F54EB']
    kpiTypeChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}宗 ({d}%)' },
      series: [{
        type: 'pie', radius: ['40%', '68%'], center: ['50%', '50%'],
        label: { show: false },
        data: Object.entries(typeCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([k, v], i) => ({ value: v, name: k, itemStyle: { color: palette[i % palette.length] } }))
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
  setTimeout(() => { try { initKpiCharts() } catch (e) { console.error('KPI图表初始化失败:', e) } }, 400)
})

onActivated(() => {
  console.log('[AssetMap] onActivated')
  if (window.AMap) setTimeout(() => { try { initAmap() } catch (e) { console.error('地图初始化失败:', e) } }, 300)
  setTimeout(() => { try { initBottomCharts() } catch (e) { console.error('底部图表初始化失败:', e) } }, 350)
  setTimeout(() => { try { initKpiCharts() } catch (e) { console.error('KPI图表初始化失败:', e) } }, 400)
})

onBeforeUnmount(() => {
  console.log('[AssetMap] onBeforeUnmount')
  disposeDetailCharts()
  disposeBottomCharts()
  kpiNatureChart?.dispose(); kpiNatureChart = null
  kpiTypeChart?.dispose(); kpiTypeChart = null
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

function addMapAssetMarker(asset) {
  if (!amapInstance || !window.AMap || !asset.lng || !asset.lat) return
  const color = typeColor(asset.type)
  const marker = new window.AMap.Marker({
    position: new window.AMap.LngLat(asset.lng, asset.lat),
    content: `<div style="position:relative;width:14px;height:14px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color}33;animation:amap-ping 2s infinite"></div>
      <div style="position:absolute;inset:3px;border-radius:50%;background:${color};border:1.5px solid #fff"></div>
    </div>`,
    offset: new window.AMap.Pixel(-7, -7),
    cursor: 'pointer'
  })
  marker.on('click', () => {
    const projectObj = resolveAssetProjectObj(asset)
    if (drillLevel.value === 0) {
      const town = towns.value.find(t => {
        const ids = TOWN_PROJECT_MAP[t.code] || []
        return projectObj && ids.includes(projectObj.id)
      })
      if (town) {
        currentTown.value = town
        drillLevel.value = 1
        if (amapInstance && window.AMap) {
          amapInstance.setZoomAndCenter(13, new window.AMap.LngLat(town.lng, town.lat))
        }
        return
      }
    }
    if (drillLevel.value === 1 && currentTown.value && projectObj) {
      const ids = TOWN_PROJECT_MAP[currentTown.value.code] || []
      if (ids.includes(projectObj.id)) { enterProject(projectObj); return }
    }
    const resolvedName = resolveAssetProjectName(asset)
    selectedAssetDetail.value = {
      code: asset.assetNo || asset.id,
      name: asset.name,
      type: asset.type,
      status: asset.status,
      area: asset.area,
      annualRent: asset.annualRent || null,
      tenant: asset.tenant || '-',
      project: resolvedName || '-',
      location: asset.location,
      certStatus: asset.certStatus
    }
    assetDialogVisible.value = true
  })
  marker.setMap(amapInstance)
  amapAssetMarkers.push(marker)
}

/* ==================== 区域划分模式 ==================== */
const boardView = ref('cards')
const selectedZoneId = ref('z1-1')

const zoneTree = ref([
  {
    id: 'd1', name: '长乐区中心城区', count: 6,
    children: [
      { id: 'z1-1', name: '吴航街道', type: '街道', projectCount: 2, assetCount: 42, area: 18500, owner: '陈志强', code: '350112001', color: '#1668DC', span: 2, boundary: '东至鳌山路，西至西洋路，南至郑和路，北至闽江口' },
      { id: 'z1-2', name: '航城街道', type: '街道', projectCount: 2, assetCount: 38, area: 22000, owner: '林晓峰', code: '350112002', color: '#13c2c2', span: 2, boundary: '东至机场路，西至吴航街道，南至首占镇，北至闽江' },
      { id: 'z1-3', name: '首占新区', type: '片区', projectCount: 2, assetCount: 35, area: 28000, owner: '黄丽华', code: '350112003', color: '#722ed1', span: 2, boundary: '东至岱边村，西至玉田镇，南至营前街道，北至航城街道' }
    ]
  },
  {
    id: 'd2', name: '长乐区沿海片区', count: 5,
    children: [
      { id: 'z2-1', name: '漳港街道', type: '街道', projectCount: 1, assetCount: 25, area: 16800, owner: '郑文海', code: '350112004', color: '#fa8c16', span: 2, boundary: '东至海边，西至鹤上镇，南至江田镇，北至航城街道' },
      { id: 'z2-2', name: '江田镇', type: '镇', projectCount: 1, assetCount: 18, area: 35000, owner: '王建国', code: '350112005', color: '#52c41a', span: 3, boundary: '东至海滨，西至玉田镇，南至福清界，北至漳港街道' },
      { id: 'z2-3', name: '梅花镇', type: '镇', projectCount: 1, assetCount: 12, area: 8500, owner: '刘梅芳', code: '350112006', color: '#2F54EB', span: 1, boundary: '东至闽江口，西至航城街道，南至漳港街道，北至连江界' }
    ]
  },
  {
    id: 'd3', name: '长乐区内陆片区', count: 4,
    children: [
      { id: 'z3-1', name: '营前街道', type: '街道', projectCount: 1, assetCount: 28, area: 15600, owner: '吴晓东', code: '350112007', color: '#1c7ed6', span: 2, boundary: '东至首占新区，西至闽侯界，南至玉田镇，北至闽江' },
      { id: 'z3-2', name: '鹤上镇', type: '镇', projectCount: 1, assetCount: 22, area: 12400, owner: '张永和', code: '350112008', color: '#E8912A', span: 2, boundary: '东至漳港街道，西至首占新区，南至江田镇，北至航城街道' },
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
    const palette = ['#1668DC', '#13C2C2', '#C8963E', '#722ED1', '#52C41A', '#FA8C16']
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
/* 页面根 padding/height 交给全局骨架，此处不再覆盖 */

/* ==================== 区域划分视图 ==================== */
.region-wrap { display: flex; gap: 20px; align-items: flex-start; }
.region-left { width: 300px; flex: none; }
.region-left :deep(.el-card) { background: #fff; }
.region-right { flex: 1; min-width: 0; }
.region-right :deep(.el-card) { background: #fff; }
.rr-head { display: flex; justify-content: space-between; align-items: center; }
.zt-node { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.zt-name { color: var(--t-main); }
.zt-summary { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #E2E8F0; font-size: 12px; color: var(--t-weak); line-height: 1.6; }
.detail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.dg-item { background: var(--bg-th); border: 1px solid var(--bd); border-radius: 6px; padding: 10px 12px; display: flex; flex-direction: column; }
.dg-label { font-size: 12px; color: var(--t-weak); }
.dg-value { font-size: 17px; font-weight: 700; color: var(--c-primary); font-variant-numeric: tabular-nums; margin-top: 3px; }
.section-title { font-size: 14px; font-weight: 600; color: var(--t-main); padding-left: 8px; border-left: 3px solid var(--c-primary); margin-bottom: 10px; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
.rd-table { font-size: 13px; }
.zone-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.zone-card { background: #fff; border: 1px solid var(--bd); border-top: 3px solid var(--c-primary); border-radius: 6px; padding: 12px 14px; cursor: pointer; transition: box-shadow 0.2s, border-color 0.2s; }
.zone-card:hover { box-shadow: 0 2px 12px rgba(22, 104, 220, 0.2); }
.zone-card.on { border-color: var(--c-primary); box-shadow: 0 2px 12px rgba(22, 104, 220, 0.25); }
.zc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.zc-name { font-size: 14px; font-weight: 600; color: var(--t-main); }
.zc-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; }
.zc-stat { display: flex; flex-direction: column; }
.zc-stat .label { font-size: 12px; color: var(--t-weak); }
.zc-stat .value { font-size: 13px; font-weight: 600; color: var(--t-main); font-variant-numeric: tabular-nums; }
.zc-foot { margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--bd); text-align: right; }
.block-map { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.block-cell { border-radius: 6px; padding: 14px 12px; color: #fff; cursor: pointer; opacity: 0.88; transition: opacity 0.2s, transform 0.2s; min-height: 92px; }
.block-cell:hover { opacity: 1; transform: translateY(-2px); }
.block-cell.on { opacity: 1; outline: 2px solid var(--t-main); outline-offset: 1px; }
.bc-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
.bc-meta { font-size: 12px; opacity: 0.92; }
.bc-owner { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.block-legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }

/* ==================== GIS 地图 — 深色主题 ==================== */
.geo-map {
  /* 地图页按视口撑满剩余高度，避免写死 720 造成下方灰底空洞 */
  height: calc(100vh - 260px);
  min-height: 520px;
  background: var(--bg-page);
  position: relative; display: flex; flex-direction: column;
  border-radius: var(--r-md);
}

.geo-breadcrumb {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #E2E8F0;
  display: flex; align-items: center;
  z-index: 30;
}
.geo-breadcrumb :deep(.el-breadcrumb__inner) { color: #333; }
.geo-breadcrumb :deep(.el-breadcrumb__separator) { color: var(--t-weak); }

.amap-container {
  /* 地图吃掉剩余区域；配合 .geo-map 的视口高度，不再写死 500 */
  flex: 1;
  min-height: 0;
  width: 100%;
}
.geo-map:fullscreen {
  height: 100vh;
  overflow: hidden;
}
.geo-map:fullscreen .amap-container {
  flex: 1;
  min-height: 0;
}
.amap-container :deep(.amap-marker-label) {
  border: none;
  background: transparent;
}
.amap-container :deep(.amap-logo) {
  opacity: 0;
}
.amap-container :deep(.amap-copyright) {
  opacity: 0;
}

@keyframes amap-ping {
  0% { transform: scale(1); opacity: 0.6; }
  75%, 100% { transform: scale(2.5); opacity: 0; }
}

/* KPI 面板 */
.geo-kpi-panel {
  position: absolute; top: 52px; left: 12px; z-index: 20; width: 260px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 14px; color: #333;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-height: calc(100% - 180px); overflow-y: auto;
}
.geo-kpi-toggle {
  position: absolute; top: 52px; left: 12px; z-index: 20;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 6px;
  padding: 8px 12px; color: #1668DC; font-size: 12px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.geo-kpi-toggle:hover { background: #fff; border-color: #1668DC; }
.gkp-title { font-size: 14px; font-weight: 700; color: #1668DC; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(22, 104, 220, 0.2); display: flex; justify-content: space-between; align-items: center; }
.gkp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.gkp-item { background: var(--bg-th); border: 1px solid var(--bd); border-radius: 5px; padding: 6px 8px; }
.gkp-value { font-size: 15px; font-weight: 700; color: var(--t-main); font-variant-numeric: tabular-nums; }
.gkp-unit { font-size: 12px; font-weight: normal; color: var(--t-weak); margin-left: 2px; }
.gkp-label { font-size: 12px; color: var(--t-weak); margin-top: 2px; }
.gkp-rank-title { font-size: 12px; font-weight: 600; color: #1668DC; padding-top: 6px; border-top: 1px solid rgba(22, 104, 220, 0.15); margin-bottom: 6px; }
.gkp-rank { display: flex; flex-direction: column; gap: 4px; max-height: 180px; overflow-y: auto; }
.gkp-rank-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.gkp-rank-name { width: 56px; flex: none; color: var(--t-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gkp-rank-bar { flex: 1; height: 7px; background: var(--bd); border-radius: 4px; overflow: hidden; }
.gkp-rank-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #1668DC, #4C8DFF); }
.gkp-rank-val { width: 24px; text-align: right; color: var(--t-main); font-variant-numeric: tabular-nums; }
.gkp-chart-section { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(22, 104, 220, 0.1); }
.gkp-chart-title { font-size: 11px; font-weight: 600; color: #1668DC; margin-bottom: 4px; }
.gkp-mini-chart { height: 100px; }

/* 镇项目面板 */
.geo-town-panel {
  position: absolute; top: 52px; right: 12px; z-index: 20; width: 280px;
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 14px; color: #333;
  max-height: calc(100% - 180px); overflow-y: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.gtp-title { font-size: 14px; font-weight: 700; color: #1668DC; margin-bottom: 10px; }
.gtp-stats { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(22, 104, 220, 0.15); }
.gtp-stat { display: flex; justify-content: space-between; font-size: 12px; }
.gtp-stat .label { color: var(--t-weak); }
.gtp-stat .value { color: var(--t-main); font-weight: 600; font-variant-numeric: tabular-nums; }
.gtp-list { display: flex; flex-direction: column; gap: 8px; }
.gtp-card {
  background: var(--bg-th); border: 1px solid var(--bd);
  border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s;
}
.gtp-card:hover { background: #E8F2FF; border-color: #1668DC; }
.gtp-card-name { font-size: 13px; font-weight: 600; color: var(--t-main); margin-bottom: 6px; }
.gtp-card-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--t-weak); margin-bottom: 3px; }
.gtp-card-row b { color: var(--t-main); }

/* 项目明细 */
.geo-detail {
  flex: 1; overflow-y: auto; padding: 16px; background: #fff; margin: 8px 12px 12px; border-radius: 8px;
}
.gd-kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 14px; }
.gd-kpi { background: var(--bg-th); border: 1px solid var(--bd); border-radius: 6px; padding: 10px 12px; text-align: center; }
.gd-kpi-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
.gd-kpi-unit { font-size: 12px; font-weight: normal; color: var(--t-weak); margin-left: 3px; }
.gd-kpi-label { font-size: 12px; color: var(--t-weak); margin-top: 4px; }
.gd-charts { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 10px; margin-bottom: 14px; }
.gd-card { border: 1px solid var(--bd); border-radius: 6px; padding: 10px 12px; }
.gd-card-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; padding-left: 6px; border-left: 3px solid var(--c-primary); }
.gd-chart { height: 190px; }
.gd-progress { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.gd-prog { border: 1px solid var(--bd); border-radius: 6px; padding: 10px 14px; }
.gd-prog-head { display: flex; justify-content: space-between; font-size: 13px; color: #333; margin-bottom: 8px; }
.gd-prog-frac { font-size: 12px; color: var(--t-weak); margin-top: 6px; }
.gd-toggle { margin-bottom: 12px; }
.gd-mapview { display: flex; gap: 14px; }
.gd-side { width: 170px; flex: none; border: 1px solid var(--bd); border-radius: 6px; padding: 12px; }
.gd-side-title { font-size: 12px; font-weight: 600; color: var(--t-weak); margin-bottom: 8px; }
.gd-building {
  padding: 8px 12px; border-radius: 5px; border: 1px solid var(--bd); background: #fff;
  font-size: 13px; color: #333; cursor: pointer; margin-bottom: 8px; transition: all 0.2s;
}
.gd-building:hover { border-color: var(--c-primary); color: var(--c-primary); }
.gd-building.on { background: var(--c-primary); border-color: var(--c-primary); color: #fff; }
.floor-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.floor-chip { padding: 3px 10px; border-radius: 3px; background: #F5F7FA; color: var(--t-weak); font-size: 12px; cursor: pointer; user-select: none; }
.floor-chip:hover { color: var(--c-primary); }
.floor-chip.on { background: var(--c-primary); color: #fff; }
.gd-main { flex: 1; min-width: 0; }
.legend-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.lg-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 3px; background: #F5F7FA; border: 1px solid var(--bd); font-size: 12px; color: var(--t-weak); }
.lg-chip i { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }
.gd-filters { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px dashed var(--bd); margin-top: 4px; }
.gd-filter-label { font-size: 12px; color: var(--t-weak); }
.gd-range-text { font-size: 12px; color: var(--t-weak); font-variant-numeric: tabular-nums; }
.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 10px; margin-top: 10px; max-height: 320px; overflow-y: auto; }
.room-card { border: 1px solid var(--bd); border-top: 3px solid var(--c-primary); border-radius: 6px; padding: 8px 10px; background: #fff; cursor: pointer; transition: box-shadow 0.2s; }
.room-card:hover { box-shadow: 0 2px 12px rgba(22, 104, 220, 0.2); }
.room-head { display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap; }
.room-code { font-size: 12px; font-weight: 600; color: #333; margin-bottom: 3px; }
.room-meta { font-size: 12px; color: var(--t-weak); margin-bottom: 3px; }
.room-area { font-size: 12px; color: var(--c-primary); font-weight: 600; }
.room-status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
.gd-list-filter { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

/* 底部图表 */
.geo-bottom {
  display: flex; gap: 10px; padding: 0 12px 12px;
}
.geo-bottom-card {
  flex: 1; background: #fff; border: 1px solid #E2E8F0;
  border-radius: 8px; padding: 10px 12px;
}
.gbc-title { font-size: 12px; font-weight: 600; color: #1668DC; margin-bottom: 6px; }
.gbc-chart { height: 160px; }

/* 图例 */
.geo-legend {
  position: absolute; right: 12px; bottom: 12px; z-index: 25;
  padding: 10px 12px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(6px);
  border: 1px solid #E2E8F0; border-radius: 8px; color: #333; font-size: 12px;
}
.gl-title { font-weight: 600; color: #1668DC; margin-bottom: 6px; }
.gl-choropleth { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
.gl-choro-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #666; }
.gl-choro-item i { width: 16px; height: 10px; border-radius: 2px; display: inline-block; border: 1px solid rgba(0,0,0,0.1); }
.gl-item { display: flex; align-items: center; gap: 6px; line-height: 20px; }
.gl-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.gl-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 8px; }
.gl-type-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #666; }
.gl-type-item i { width: 10px; height: 10px; border-radius: 50%; flex: none; }

/* 全屏按钮 */
.geo-fullscreen {
  position: absolute; top: 52px; right: 12px; z-index: 30;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.9); border: 1px solid var(--bd);
  border-radius: 6px; color: #1668DC; cursor: pointer;
}
.geo-fullscreen:hover { background: rgba(22, 104, 220, 0.1); }

/* 当 drillLevel=1 时全屏按钮位置调整 */
</style>
