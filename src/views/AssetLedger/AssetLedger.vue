<template>
  <div class="page-container">
    <div class="page-header">
      <h2>资产台账管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增资产
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>
    <template v-if="!isCodeMode">
    <el-card>

      <el-tabs v-model="activeCategory" class="category-tabs">
        <el-tab-pane v-for="cat in assetCategories" :key="cat" :label="cat" :name="cat" />
      </el-tabs>

      <div class="stat-strip">
        <div class="stat-item">
          <div class="stat-value">{{ statSummary.projects }}<span class="unit">个</span></div>
          <div class="stat-label">项目数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statSummary.total }}<span class="unit">宗</span></div>
          <div class="stat-label">资产总宗数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statSummary.usageRate }}<span class="unit">%</span></div>
          <div class="stat-label">资产利用率</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ statSummary.idle }}<span class="unit">宗</span></div>
          <div class="stat-label">闲置宗数</div>
        </div>
      </div>

      <div class="chip-row">
        <span class="chip-label">来源类型</span>
        <span
          v-for="opt in sourceTypeOptions"
          :key="opt"
          class="chip"
          :class="{ on: activeSourceType === opt }"
          @click="activeSourceType = opt"
        >{{ opt }}</span>
      </div>
      <div class="chip-row">
        <span class="chip-label">资产权属</span>
        <span
          v-for="opt in ownershipOptions"
          :key="opt"
          class="chip"
          :class="{ on: activeOwnership === opt }"
          @click="activeOwnership = opt"
        >{{ opt }}</span>
      </div>

      <div class="toolbar-row">
        <el-button @click="handleTemplateDownload">
          <el-icon><Download /></el-icon>
          模板下载
        </el-button>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button value="list">列表展示</el-radio-button>
          <el-radio-button value="card">图文展示</el-radio-button>
        </el-radio-group>
        <div class="icon-toolbar">
          <el-tooltip content="刷新" placement="top">
            <el-button @click="handleRefreshList">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip content="筛选" placement="top">
            <el-button @click="filterVisible = !filterVisible">
              <el-icon><Filter /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 搜索栏 -->
      <el-form v-show="filterVisible" :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="资产编码">
          <el-input v-model="searchForm.code" placeholder="请输入资产编码" clearable />
        </el-form-item>
        <el-form-item label="资产名称">
          <el-input v-model="searchForm.name" placeholder="请输入资产名称" clearable />
        </el-form-item>
        <el-form-item label="资产类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 120px">
            <el-option v-for="t in assetTypeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="资产状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="闲置" value="闲置" />
            <el-option label="出租" value="出租" />
            <el-option label="自用" value="自用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 资产列表 -->
      <el-table v-if="viewMode === 'list'" :data="displayList" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="detail-grid expand-grid">
              <div class="cell">
                <div class="label">省市区</div>
                <div class="value">{{ row.region }}</div>
              </div>
              <div class="cell">
                <div class="label">项目名称</div>
                <div class="value hl">{{ row.project }}</div>
              </div>
              <div class="cell">
                <div class="label">项目地址</div>
                <div class="value">{{ row.projectAddress }}</div>
              </div>
              <div class="cell">
                <div class="label">分区</div>
                <div class="value">{{ row.district }}</div>
              </div>
              <div class="cell">
                <div class="label">资产名称</div>
                <div class="value">{{ row.name }}</div>
              </div>
              <div class="cell">
                <div class="label">资产编号</div>
                <div class="value">{{ row.code }}</div>
              </div>
              <div class="cell">
                <div class="label">资产座落</div>
                <div class="value">{{ row.assetAddress }}</div>
              </div>
              <div class="cell">
                <div class="label">租赁状态</div>
                <div class="value">{{ row.leaseStatus }}</div>
              </div>
              <div class="cell">
                <div class="label">状态</div>
                <div class="value">
                  <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </div>
              </div>
              <div class="cell">
                <div class="label">资产来源</div>
                <div class="value">{{ row.sourceType }}</div>
              </div>
              <div class="cell">
                <div class="label">资产权属</div>
                <div class="value">{{ row.ownership }}</div>
              </div>
              <div class="cell">
                <div class="label">资产性质</div>
                <div class="value">{{ row.assetNature }}</div>
              </div>
              <div class="cell">
                <div class="label">经营公司</div>
                <div class="value">{{ row.operateCompany }}</div>
              </div>
              <div class="cell">
                <div class="label">产权公司</div>
                <div class="value">{{ row.propertyCompany }}</div>
              </div>
              <div class="cell">
                <div class="label">面积(㎡)</div>
                <div class="value">{{ row.area }}</div>
              </div>
              <div class="cell">
                <div class="label">位置</div>
                <div class="value">{{ row.location }}</div>
              </div>
              <div class="cell">
                <div class="label">租金(元/月)</div>
                <div class="value">{{ row.rentPrice ? '¥' + row.rentPrice.toLocaleString() : '-' }}</div>
              </div>
              <div class="cell">
                <div class="label">创建时间</div>
                <div class="value">{{ row.createdAt }}</div>
              </div>
              <div class="cell">
                <div class="label">修改时间</div>
                <div class="value">{{ row.updatedAt }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="资产编码" width="120" sortable />
        <el-table-column prop="name" label="资产名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="project" label="项目" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="资产类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建/修改时间" min-width="170" show-overflow-tooltip sortable>
          <template #default="{ row }">{{ (row.createdAt || '').slice(0, 10) }} 至 {{ (row.updatedAt || '').slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown style="margin-left:8px" @command="cmd => handleRowCommand(cmd, row)">
              <el-button type="primary" link size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="district">分区管理</el-dropdown-item>
                  <el-dropdown-item command="disable">禁用</el-dropdown-item>
                  <el-dropdown-item command="qrcode">下载二维码</el-dropdown-item>
                  <el-dropdown-item command="reduction">减免记录</el-dropdown-item>
                  <el-dropdown-item command="lifecycle">生命周期</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 图文展示 -->
      <div v-else class="card-grid">
        <div v-for="item in displayList" :key="item.code" class="asset-card">
          <div class="card-photo" :style="{ background: item.photoColor }">
            <el-icon :size="36"><Picture /></el-icon>
          </div>
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-title" :title="item.project">{{ item.project }}</span>
              <el-tag size="small" effect="plain">{{ item.category }}</el-tag>
            </div>
            <div class="card-stats">
              <div class="card-stat">
                <span class="card-stat-label">资产总数</span>
                <span class="card-stat-value">{{ item.totalCount }}宗</span>
              </div>
              <div class="card-stat">
                <span class="card-stat-label">资产面积</span>
                <span class="card-stat-value">{{ item.totalArea }}㎡</span>
              </div>
              <div class="card-stat">
                <span class="card-stat-label">盘活宗数</span>
                <span class="card-stat-value">{{ item.activeCount }}宗</span>
              </div>
              <div class="card-stat">
                <span class="card-stat-label">闲置宗数</span>
                <span class="card-stat-value">{{ item.idleCount }}宗</span>
              </div>
            </div>
            <div class="card-address">
              <el-icon><Location /></el-icon>
              <span>{{ item.assetAddress }}</span>
            </div>
            <div class="card-actions">
              <el-button link type="primary" size="small" @click="handleView(item)">详情</el-button>
              <el-button link type="primary" size="small" @click="handleDistrictManage(item)">分区管理</el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="!displayList.length" description="暂无数据" />
      </div>

      <!-- 分页 -->
      <div class="pager">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    </template>

    <!-- 一产一码（资产项目详情） -->
    <template v-else>
      <div class="code-topbar">
        <div class="code-topbar-left">
          <el-button link type="primary" @click="handleCodeBack">
            <el-icon><Back /></el-icon>返回
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>资产管理</el-breadcrumb-item>
            <el-breadcrumb-item>资产项目</el-breadcrumb-item>
            <el-breadcrumb-item class="crumb-cur">项目详情</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="code-topbar-right">
          <span class="switch-label">切换资产</span>
          <el-select v-model="codeAssetKey" style="width: 200px">
            <el-option v-for="p in codeProjects" :key="p.key" :label="p.name" :value="p.key" />
          </el-select>
          <el-button link @click="handleCodeBack">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <el-card class="code-card">
        <div class="code-card-title">资产信息</div>
        <div class="info-body">
          <div class="info-photo" :style="{ background: curProject.photo }">
            <el-icon :size="42"><OfficeBuilding /></el-icon>
          </div>
          <div class="info-main">
            <div class="info-name">{{ curProject.name }}</div>
            <div class="info-line"><el-icon><OfficeBuilding /></el-icon><span>{{ curProject.company }}</span></div>
            <div class="info-line"><el-icon><Location /></el-icon><span>{{ curProject.address }}</span></div>
          </div>
          <div class="info-side">
            <div class="info-time">创建时间：{{ curProject.createTime }}</div>
            <div class="qr-block">
              <div class="qr-matrix qr-lg">
                <span v-for="(cell, i) in qrMatrix(curProject.code)" :key="i" :class="{ on: cell }" />
              </div>
            </div>
            <el-button link type="primary" size="small" @click="handleQrcode(curProject)">下载资产码</el-button>
          </div>
        </div>
        <div class="info-stats">
          <div class="info-stat"><div class="label">资产状态</div><div class="value">{{ curProject.status }}</div></div>
          <div class="info-stat"><div class="label">资产类型</div><div class="value">{{ curProject.type }}</div></div>
          <div class="info-stat"><div class="label">经营状态</div><div class="value">{{ curProject.bizStatus }}</div></div>
        </div>
      </el-card>

      <el-row :gutter="12" class="code-row">
        <el-col :span="8">
          <el-card class="code-card">
            <div class="code-card-title">资产基本信息</div>
            <div class="kpi-pair">
              <div class="kpi-tile">
                <div class="kpi-label">资产利用率</div>
                <div class="kpi-num">{{ curProject.utilization }}%</div>
                <div class="kpi-ico"><el-icon><DataAnalysis /></el-icon></div>
              </div>
              <div class="kpi-tile">
                <div class="kpi-label">闲置面积(M²)</div>
                <div class="kpi-num">{{ curProject.idleArea }}</div>
                <div class="kpi-ico"><el-icon><Document /></el-icon></div>
              </div>
            </div>
            <div class="chart-pair">
              <div class="chart-cell">
                <div class="kpi-label">是否租赁</div>
                <div class="chart-value">已使用/未使用</div>
                <div ref="donutRef" class="mini-chart"></div>
              </div>
              <div class="chart-cell">
                <div class="kpi-label">资产类型</div>
                <div class="chart-value">{{ curProject.type }}</div>
                <div ref="pieRef" class="mini-chart"></div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="code-card">
            <div class="code-card-title">资产创收</div>
            <div class="kpi-pair">
              <div class="kpi-tile">
                <div class="kpi-label">累计实收(万元)</div>
                <div class="kpi-num">{{ curProject.cumIncome }}</div>
                <div class="kpi-ico"><el-icon><Wallet /></el-icon></div>
              </div>
              <div class="kpi-tile">
                <div class="kpi-label">本年实收(万元)</div>
                <div class="kpi-num">{{ curProject.yearIncome }}</div>
                <div class="kpi-ico"><el-icon><Coin /></el-icon></div>
              </div>
            </div>
            <div class="kpi-label chart-label">近一年每月实收(万元)</div>
            <div ref="barRef" class="mid-chart"></div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="code-card">
            <div class="code-card-title">租赁概况</div>
            <div class="kpi-pair">
              <div class="kpi-tile">
                <div class="kpi-label">资产出租率</div>
                <div class="kpi-num">{{ curProject.rentRate }}%</div>
                <div class="kpi-ico"><el-icon><TrendCharts /></el-icon></div>
              </div>
              <div class="kpi-tile">
                <div class="kpi-label">上月收费率</div>
                <div class="kpi-num">{{ curProject.feeRate }}%</div>
                <div class="kpi-ico"><el-icon><Money /></el-icon></div>
              </div>
            </div>
            <div class="rate-block">
              <div class="rate-head"><span>资产出租率</span><b>{{ curProject.rentRate }}%</b></div>
              <el-progress :percentage="curProject.rentRate" :show-text="false" :stroke-width="8" color="#36cfc9" />
              <div class="rate-cap"><span>实际出租数量 / 未出租的总数(宗)</span><span>{{ curProject.leasedCount }}/{{ curProject.totalCount }}</span></div>
            </div>
            <div class="rate-block">
              <div class="rate-head"><span>上月收费率</span><b>{{ curProject.feeRate }}%</b></div>
              <el-progress :percentage="curProject.feeRate" :show-text="false" :stroke-width="8" color="#1890ff" />
              <div class="rate-cap"><span>上月待收费 / 上月欠缴(万元)</span><span>{{ curProject.pendingFee }}/{{ curProject.arrears }}</span></div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="code-card">
        <div class="seg-tabs">
          <button :class="{ on: distTab === 'map' }" @click="distTab = 'map'">分布图展示</button>
          <button :class="{ on: distTab === 'list' }" @click="distTab = 'list'">列表展示</button>
        </div>
        <div v-if="distTab === 'map'" class="dist-wrap">
          <div class="dist-left">
            <div class="bld-col">
              <div
                v-for="b in curProject.buildings"
                :key="b.name"
                class="bld"
                :class="{ on: activeBuilding === b.name }"
                @click="activeBuilding = b.name"
              >{{ b.name }}</div>
            </div>
            <div class="floor-list">
              <div
                v-for="f in activeBuildingObj.floors"
                :key="f"
                class="floor"
                :class="{ on: activeFloor === f }"
                @click="activeFloor = f"
              >{{ f }}</div>
            </div>
          </div>
          <div class="dist-mid">
            <div class="dist-chips">
              <div class="dchip c1"><div><b>{{ roomStats.total }}</b><span>资产总数(宗)</span></div><el-icon color="#1890ff"><OfficeBuilding /></el-icon></div>
              <div class="dchip c2"><div><b>{{ roomStats.area }}</b><span>资产面积(㎡)</span></div><el-icon color="#faad14"><Box /></el-icon></div>
              <div class="dchip c3"><div><b>{{ roomStats.leased }}</b><span>在租资产(宗)</span></div><el-icon color="#36cfc9"><Key /></el-icon></div>
              <div class="dchip c4"><div><b>{{ roomStats.idle }}</b><span>闲置资产(宗)</span></div><el-icon color="#fa8c16"><Files /></el-icon></div>
            </div>
            <div class="dist-grid">
              <div
                v-for="r in floorRooms"
                :key="r.code"
                class="room"
                :style="{ background: STATUS_COLORS[r.status] }"
                :title="r.name + ' | ' + r.status + (r.tenant ? ' | ' + r.tenant : '')"
              >{{ r.roomNo }}</div>
            </div>
            <div class="legend-row">
              <span v-for="s in statusLegend" :key="s.name" class="lg"><i class="sq" :style="{ background: s.color }" />{{ s.name }}({{ s.count }})</span>
            </div>
            <div class="legend-row">
              <span v-for="s in idleLegend" :key="s.name" class="lg"><i class="ring" :style="{ borderColor: s.color }" />{{ s.name }}</span>
              <span class="legend-right">
                <el-checkbox v-model="excludeUnrentable">不可租资产</el-checkbox>
                <el-button link type="primary" size="small"><el-icon><Filter /></el-icon>资产面积筛选</el-button>
              </span>
            </div>
          </div>
          <div class="dist-right">
            <div class="rate-line"><span>出租率</span><el-progress :percentage="curProject.rentRate" :show-text="false" :stroke-width="8" color="#faad14" class="rate-line-bar" /><b>{{ curProject.rentRate }}%</b></div>
            <div class="rate-line"><span>收费率</span><el-progress :percentage="curProject.feeRate" :show-text="false" :stroke-width="8" class="rate-line-bar" /><b>{{ curProject.feeRate }}%</b></div>
          </div>
        </div>
        <el-table v-else :data="floorRooms" style="width: 100%">
          <el-table-column prop="code" label="资产编码" width="150" />
          <el-table-column prop="name" label="资产名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="area" label="面积(㎡)" width="95" />
          <el-table-column prop="status" label="租赁状态" width="95" />
          <el-table-column label="空置时长" width="105">
            <template #default="{ row }">{{ row.idleDays ? row.idleDays + '天' : '-' }}</template>
          </el-table-column>
          <el-table-column label="承租方" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">{{ row.tenant || '-' }}</template>
          </el-table-column>
          <el-table-column label="月租金(元)" width="110">
            <template #default="{ row }">{{ row.rent ? '¥' + row.rent.toLocaleString() : '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleViewCode(row)">查看码</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 资产码对话框 -->
      <el-dialog v-model="codeQrVisible" title="资产码" width="360px">
        <div v-if="codeQrRow" class="qr-dialog-body">
          <div class="qr-block">
            <div class="qr-matrix qr-lg">
              <span v-for="(cell, i) in qrMatrix(codeQrRow.code)" :key="i" :class="{ on: cell }" />
            </div>
          </div>
          <div class="qr-dialog-name">{{ codeQrRow.name }}</div>
          <div class="qr-dialog-code">资产编号：{{ codeQrRow.code }}</div>
        </div>
        <template #footer>
          <el-button @click="codeQrVisible = false">关闭</el-button>
          <el-button type="primary" @click="handlePrintCode(codeQrRow)">打印码</el-button>
        </template>
      </el-dialog>
    </template>

    <!-- 新增/编辑资产对话框 -->
    <el-dialog v-model="formDialogVisible" :title="isEdit ? '编辑资产' : '新增资产'" width="700px">
      <el-form :model="assetForm" :rules="assetRules" ref="assetFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产编码" prop="code">
              <el-input v-model="assetForm.code" placeholder="请输入资产编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产名称" prop="name">
              <el-input v-model="assetForm.name" placeholder="请输入资产名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产类型" prop="type">
              <el-select v-model="assetForm.type" placeholder="请选择" style="width: 100%">
                <el-option v-for="t in assetTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产分类" prop="assetCategory">
              <el-select v-model="assetForm.assetCategory" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in assetCategories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产状态" prop="status">
              <el-select v-model="assetForm.status" placeholder="请选择" style="width: 100%">
                <el-option label="闲置" value="闲置" />
                <el-option label="出租" value="出租" />
                <el-option label="自用" value="自用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="assetForm.area" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租金(元/月)" prop="rentPrice">
              <el-input-number v-model="assetForm.rentPrice" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="位置" prop="location">
          <el-input v-model="assetForm.location" placeholder="请输入资产位置" />
        </el-form-item>
        <el-form-item label="产权人" prop="owner">
          <el-input v-model="assetForm.owner" placeholder="请输入产权人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assetForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 资产全信息统一视图抽屉 -->
    <AssetDetailDrawer v-model="detailDrawerVisible" :asset="currentAsset" />

    <!-- 添加权证对话框 -->
    <el-dialog v-model="certDialogVisible" title="添加权证" width="500px">
      <el-form :model="certForm" :rules="certRules" ref="certFormRef" label-width="100px">
        <el-form-item label="证件类型" prop="type">
          <el-select v-model="certForm.type" placeholder="请选择" style="width: 100%">
            <el-option label="不动产权证" value="不动产权证" />
            <el-option label="土地使用权证" value="土地使用权证" />
            <el-option label="房屋所有权证" value="房屋所有权证" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="证书编号" prop="number">
          <el-input v-model="certForm.number" placeholder="请输入证书编号" />
        </el-form-item>
        <el-form-item label="发证日期" prop="issueDate">
          <el-date-picker v-model="certForm.issueDate" type="date" placeholder="请选择" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="到期日期" prop="expiryDate">
          <el-date-picker v-model="certForm.expiryDate" type="date" placeholder="请选择" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="certDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCertSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入资产对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入资产" width="500px">
      <el-upload ref="uploadRef" drag action="" :auto-upload="false" :on-change="handleFileChange" :limit="1" accept=".csv,.xlsx,.xls">
        <el-icon :size="40"><Upload /></el-icon>
        <div>将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 CSV、XLSX 格式文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportSubmit" :disabled="!importFile">开始导入</el-button>
      </template>
    </el-dialog>

    <!-- 分区管理对话框 -->
    <el-dialog v-model="districtDialogVisible" :title="'分区管理 - ' + districtProject" width="780px">
      <div class="district-toolbar">
        <el-input v-model="districtKeyword" placeholder="请输入分区名称" clearable style="width: 220px" @keyup.enter="handleDistrictQuery" />
        <el-button type="primary" @click="handleDistrictQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button type="primary" plain @click="handleDistrictAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
      </div>
      <el-table :data="pagedDistricts" style="width: 100%">
        <el-table-column prop="name" label="分区名称" min-width="140" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column prop="updatedAt" label="修改时间" width="160" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDistrictEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDistrictDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无数据" :image-size="80" />
        </template>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="districtPage"
          v-model:page-size="districtSize"
          :total="filteredDistricts.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-dialog>

    <!-- 资产导出字段选择对话框 -->
    <el-dialog v-model="exportDialogVisible" title="资产导出" width="680px">
      <div class="export-picker">
        <div class="picker-left">
          <div class="picker-head">
            <el-checkbox v-model="allFieldsChecked" :indeterminate="fieldsIndeterminate">全选</el-checkbox>
          </div>
          <el-checkbox-group v-model="checkedFields" class="picker-fields">
            <el-checkbox v-for="field in allExportFields" :key="field" :value="field">{{ field }}</el-checkbox>
          </el-checkbox-group>
        </div>
        <div class="picker-right">
          <div class="picker-head">已选字段（{{ checkedFields.length }}）</div>
          <div class="picker-chosen">
            <div v-for="field in checkedFields" :key="field" class="chosen-row">
              <span>{{ field }}</span>
              <el-icon class="chosen-del" @click="removeExportField(field)"><Delete /></el-icon>
            </div>
            <el-empty v-if="!checkedFields.length" description="请选择导出字段" :image-size="60" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExportConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 减免记录对话框 -->
    <el-dialog v-model="reductionDialogVisible" :title="'减免记录 - ' + (currentAsset.name || '')" width="640px">
      <el-table :data="reductionRecords" style="width: 100%">
        <el-table-column prop="period" label="减免期间" width="140" />
        <el-table-column prop="type" label="减免类型" width="120" />
        <el-table-column prop="amount" label="减免金额(元)" width="130">
          <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="status" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已通过' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无减免记录" :image-size="80" />
        </template>
      </el-table>
      <template #footer>
        <el-button @click="reductionDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Search, Refresh, Filter, Location, Picture, Delete, MoreFilled, Back, OfficeBuilding, Close, Box, Key, Files, DataAnalysis, TrendCharts, Wallet, Coin, Money, Document } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import AssetDetailDrawer from '../../components/AssetDetailDrawer.vue'
import { useAssetStore } from '../../store/asset'
import { useProjectStore } from '../../store/project'
import { useUserStore } from '../../store/user'
import { ASSET_CATEGORIES, deriveAssetCategory } from '../../data/assetCategory'

const route = useRoute()
const router = useRouter()
const assetStore = useAssetStore()
const projectStore = useProjectStore()
const userStore = useUserStore()
// 新增/导入的资产归属登录账号所在公司，不再一律写死城投集团
const currentCompany = computed(() => userStore.user?.org || '城投集团')
const isCodeMode = computed(() => route.name === 'EntOneAssetOneCode')

const searchForm = reactive({
  code: '',
  name: '',
  type: '',
  status: ''
})

watch(searchForm, () => {
  currentPage.value = 1
}, { deep: true })

const assetCategories = ASSET_CATEGORIES
const sourceTypeOptions = ['不限', '房屋拆迁', '收储', '征收', '法院判决', '股权合作', '置换代管', '投资建设', '还建', '回迁', '划入', '租入', '购入', '自筹建设', '托管', '移交资产']
const ownershipOptions = ['不限', '其他', '联营', '委托经营', '自有', '代管', '移交']

const activeCategory = ref('房产类')
const activeSourceType = ref('不限')
const activeOwnership = ref('不限')
const viewMode = ref('list')
const filterVisible = ref(true)

const districtNames = ['A分区', 'B分区', 'C分区']
const CHANGLE_REGION = '福建省/福州市/长乐区'
const operateCompanies = ['城投经营有限公司', '文旅经营有限公司', '农投经营有限公司']
const propertyCompanies = ['市国有资产产权管理有限公司', '城投产权管理有限公司']
const assetNatures = ['经营性资产', '非经营性资产', '准经营性资产']
const photoColors = ['linear-gradient(135deg, #4f8ef7, #7db4ff)', 'linear-gradient(135deg, #36cfc9, #87e8de)', 'linear-gradient(135deg, #ffa940, #ffd591)', 'linear-gradient(135deg, #9254de, #d3adf7)', 'linear-gradient(135deg, #73d13d, #b7eb8f)']

const statusToLedger = { '已出租': '出租', '部分出租': '出租', '空置': '闲置' }
const ledgerToStoreStatus = { '出租': '已出租', '闲置': '闲置', '自用': '自用' }
const leaseStatusMap = { '出租': '已租赁', '闲置': '未租赁', '自用': '自用中' }

const toLedgerRow = (a, i) => {
  const status = statusToLedger[a.status] || a.status
  return {
    id: a.id,
    code: a.code || a.assetNo || a.id,
    name: a.name,
    type: a.type,
    area: a.area,
    location: a.location,
    status,
    rentPrice: a.rentPrice ?? (a.monthlyRent || 0),
    owner: a.owner || a.group || '',
    remark: a.remark || '',
    category: a.assetCategory || '房产类',
    project: a.projectName || a.name,
    projectAddress: a.projectAddress || a.location,
    assetAddress: a.assetAddress || a.location,
    district: a.zoneName || districtNames[i % districtNames.length],
    sourceType: a.sourceType || '划入',
    region: CHANGLE_REGION,
    operateCompany: a.operateCompany || a.group || operateCompanies[i % operateCompanies.length],
    propertyCompany: a.propertyCompany || propertyCompanies[i % propertyCompanies.length],
    ownership: a.ownership || (status === '自用' ? '自有' : '委托经营'),
    assetNature: a.assetNature || assetNatures[i % assetNatures.length],
    leaseStatus: a.leaseStatus && a.leaseStatus.includes('租赁') ? a.leaseStatus : (leaseStatusMap[status] || '未租赁'),
    createdAt: a.createdAt || '2025-01-05 09:00:00',
    updatedAt: a.updatedAt || '2025-09-01 10:00:00',
    totalCount: 1,
    totalArea: a.area || 0,
    activeCount: status === '闲置' ? 0 : 1,
    idleCount: status === '闲置' ? 1 : 0,
    photoColor: photoColors[i % photoColors.length]
  }
}

const assetList = computed(() => assetStore.visibleAssets.map(toLedgerRow))

const currentPage = ref(1)
const pageSize = ref(10)

const formDialogVisible = ref(false)
const detailDrawerVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const currentAsset = ref({})

const assetForm = reactive({
  code: '',
  name: '',
  type: '',
  assetCategory: '房产类',
  status: '闲置',
  area: 0,
  rentPrice: 0,
  location: '',
  owner: '',
  remark: ''
})

const assetTypeOptions = [
  '保障房', '商铺', '写字楼', '厂房', '综合用房', '仓储/土地', '农贸市场',
  '车辆', '船舶', '车位', '公共设备', '股权', '采矿权', '探矿权', '特种行业', '特许经营权', '特殊动植物'
]

const assetRules = {
  code: [{ required: true, message: '请输入资产编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入资产名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择资产类型', trigger: 'change' }],
  assetCategory: [{ required: true, message: '请选择资产分类', trigger: 'change' }],
  status: [{ required: true, message: '请选择资产状态', trigger: 'change' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }]
}


const getTypeColor = (type) => {
  const map = { '保障房': '', '商铺': 'success', '写字楼': 'warning', '厂房': 'danger', '农贸市场': 'info' }
  return map[type] || ''
}

const getStatusType = (status) => {
  const map = { '出租': 'success', '闲置': 'warning', '自用': 'info' }
  return map[status] || 'info'
}

const assetFormRef = ref(null)
const certFormRef = ref(null)
const editingId = ref(null)
const certDialogVisible = ref(false)
const certForm = reactive({
  type: '',
  number: '',
  issueDate: '',
  expiryDate: ''
})
const certRules = {
  type: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
  number: [{ required: true, message: '请输入证书编号', trigger: 'blur' }],
  issueDate: [{ required: true, message: '请选择发证日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }]
}

// 页签口径：只跟页签、来源、权属三个维度联动
const categoryList = computed(() => {
  return assetList.value.filter(item => {
    if (item.category !== activeCategory.value) return false
    if (activeSourceType.value !== '不限' && item.sourceType !== activeSourceType.value) return false
    if (activeOwnership.value !== '不限' && item.ownership !== activeOwnership.value) return false
    return true
  })
})

const filteredList = computed(() => {
  return categoryList.value.filter(item => {
    if (searchForm.code && !item.code.includes(searchForm.code)) return false
    if (searchForm.name && !item.name.includes(searchForm.name)) return false
    if (searchForm.type && item.type !== searchForm.type) return false
    if (searchForm.status && item.status !== searchForm.status) return false
    return true
  })
})

// 顶部指标按整个页签统计，避免关键字搜不到时误判成「台账没数据」
const statSummary = computed(() => {
  const list = categoryList.value
  const idle = list.filter(item => item.status === '闲置').length
  return {
    projects: new Set(list.map(item => item.project)).size,
    total: list.length,
    usageRate: list.length ? Math.round(((list.length - idle) / list.length) * 100) : 0,
    idle
  }
})

watch([activeCategory, activeSourceType, activeOwnership], () => {
  currentPage.value = 1
})

const total = computed(() => filteredList.value.length)

const displayList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.type = ''
  searchForm.status = ''
  activeSourceType.value = '不限'
  activeOwnership.value = '不限'
  currentPage.value = 1
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(assetForm, { code: '', name: '', type: '', assetCategory: activeCategory.value, status: '闲置', area: 0, rentPrice: 0, location: '', owner: '', remark: '' })
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(assetForm, { ...row, assetCategory: row.category })
  formDialogVisible.value = true
}

const handleView = (row) => {
  currentAsset.value = row
  detailDrawerVisible.value = true
}

const handleLifecycle = (row) => {
  currentAsset.value = row
  detailDrawerVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除资产"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    assetStore.deleteAsset(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const toAssetPayload = () => ({
  name: assetForm.name,
  type: assetForm.type,
  area: Number(assetForm.area) || 0,
  location: assetForm.location,
  status: ledgerToStoreStatus[assetForm.status] || assetForm.status,
  rentPrice: Number(assetForm.rentPrice) || 0,
  owner: assetForm.owner,
  remark: assetForm.remark || '',
  code: (assetForm.code || '').trim(),
  assetCategory: assetForm.assetCategory,
  group: assetForm.owner || currentCompany.value,
  sourceType: '划入',
  bookValue: 0
})

const handleSubmit = () => {
  assetFormRef.value.validate((valid) => {
    if (!valid) return
    submitLoading.value = true
    setTimeout(() => {
      if (isEdit.value && editingId.value) {
        assetStore.updateAsset(editingId.value, toAssetPayload())
      } else {
        assetStore.addAsset(toAssetPayload())
      }
      submitLoading.value = false
      formDialogVisible.value = false
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    }, 500)
  })
}

const handleAddCert = () => {
  certForm.type = ''
  certForm.number = ''
  certForm.issueDate = ''
  certForm.expiryDate = ''
  certDialogVisible.value = true
}

const importDialogVisible = ref(false)
const importFile = ref(null)
const uploadRef = ref(null)

const handleImport = () => {
  importFile.value = null
  importDialogVisible.value = true
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const handleImportSubmit = () => {
  if (!importFile.value) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      ElMessage.warning('文件内容为空或格式不正确')
      return
    }
    let count = 0
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length >= 4) {
        const status = cols[5] ? cols[5].trim() : '闲置'
        const type = cols[2].trim() || '保障房'
        assetStore.addAsset({
          code: cols[0].trim(),
          name: cols[1].trim(),
          type,
          area: parseFloat(cols[3]) || 0,
          location: cols[4] ? cols[4].trim() : '',
          status: ledgerToStoreStatus[status] || status,
          rentPrice: parseFloat(cols[6]) || 0,
          owner: cols[7] ? cols[7].trim() : '',
          remark: '',
          assetCategory: deriveAssetCategory(type),
          group: (cols[7] || '').trim() || currentCompany.value,
          sourceType: '划入',
          bookValue: 0
        })
        count++
      }
    }
    importDialogVisible.value = false
    ElMessage.success(`成功导入${count}条资产数据`)
  }
  reader.readAsText(importFile.value)
}

const allExportFields = ['资产编码', '资产名称', '资产类型', '项目', '分区', '资产来源', '省市区', '经营公司', '产权公司', '资产权属', '资产性质', '资产座落', '面积(㎡)', '位置', '状态', '租金(元/月)', '产权人', '创建时间', '修改时间']
const fieldPropMap = {
  '资产编码': 'code', '资产名称': 'name', '资产类型': 'type', '项目': 'project', '分区': 'district',
  '资产来源': 'sourceType', '省市区': 'region', '经营公司': 'operateCompany', '产权公司': 'propertyCompany',
  '资产权属': 'ownership', '资产性质': 'assetNature', '资产座落': 'assetAddress', '面积(㎡)': 'area',
  '位置': 'location', '状态': 'status', '租金(元/月)': 'rentPrice', '产权人': 'owner',
  '创建时间': 'createdAt', '修改时间': 'updatedAt'
}
const exportDialogVisible = ref(false)
const checkedFields = ref([...allExportFields])

const allFieldsChecked = computed({
  get: () => checkedFields.value.length === allExportFields.length,
  set: (val) => {
    checkedFields.value = val ? [...allExportFields] : []
  }
})

const fieldsIndeterminate = computed(() => checkedFields.value.length > 0 && checkedFields.value.length < allExportFields.length)

const removeExportField = (field) => {
  checkedFields.value = checkedFields.value.filter(f => f !== field)
}

const handleExport = () => {
  checkedFields.value = [...allExportFields]
  exportDialogVisible.value = true
}

const handleExportConfirm = () => {
  if (!checkedFields.value.length) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }
  const fields = allExportFields.filter(f => checkedFields.value.includes(f))
  const rows = filteredList.value.map(item => fields.map(f => item[fieldPropMap[f]] ?? ''))
  const csvContent = '\uFEFF' + [fields.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `资产台账_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  exportDialogVisible.value = false
  ElMessage.success('导出成功')
}

const handleTemplateDownload = () => {
  const headers = ['资产编码', '资产名称', '资产类型', '面积(㎡)', '位置', '状态', '租金(元/月)', '产权人']
  const csvContent = '\uFEFF' + headers.join(',')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '资产台账导入模板.csv'
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('模板下载成功')
}

const handleRefreshList = () => {
  currentPage.value = 1
  ElMessage.success('刷新成功')
}

const handleDisable = (row) => {
  ElMessageBox.confirm(`确定要禁用资产"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    assetStore.updateAsset(row.id, { status: '停用' })
    ElMessage.success('已禁用')
  }).catch(() => {})
}

const handleQrcode = (row) => {
  const info = `资产名称: ${row.name}\n资产编码: ${row.code}\n资产类型: ${row.type}\n资产状态: ${row.status}\n位置: ${row.location || '—'}\n面积: ${row.area || '—'} ㎡\n产权人: ${row.owner || '—'}\n生成时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}`
  const blob = new Blob([info], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `二维码_${row.code || row.name}_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`资产"${row.name}"二维码已下载`)
}

const reductionDialogVisible = ref(false)
const reductionRecords = ref([
  { period: '2024年度', type: '租金减免', amount: 12000, status: '已通过' },
  { period: '2025年度', type: '疫情减免', amount: 8000, status: '审批中' }
])

const handleReduction = (row) => {
  currentAsset.value = row
  reductionDialogVisible.value = true
}

const handleRowCommand = (cmd, row) => {
  const actions = {
    district: handleDistrictManage,
    disable: handleDisable,
    qrcode: handleQrcode,
    reduction: handleReduction,
    lifecycle: handleLifecycle,
    delete: handleDelete
  }
  actions[cmd]?.(row)
}

const districtDialogVisible = ref(false)
const districtProject = ref('')
const districtKeyword = ref('')
const districtPage = ref(1)
const districtSize = ref(10)
const districtList = ref(Array.from({ length: 12 }, (_, i) => ({
  name: `${String.fromCharCode(65 + i)}分区`,
  status: i % 4 === 3 ? '停用' : '启用',
  createdAt: `2024-0${(i % 9) + 1}-0${(i % 9) + 1} 09:0${i}:00`,
  updatedAt: `2025-0${(i % 9) + 1}-1${i % 9} 14:2${i}:00`
})))

const filteredDistricts = computed(() => {
  if (!districtKeyword.value) return districtList.value
  return districtList.value.filter(item => item.name.includes(districtKeyword.value))
})

const pagedDistricts = computed(() => {
  const start = (districtPage.value - 1) * districtSize.value
  return filteredDistricts.value.slice(start, start + districtSize.value)
})

const handleDistrictManage = (row) => {
  districtProject.value = row.project || row.name
  districtKeyword.value = ''
  districtPage.value = 1
  districtDialogVisible.value = true
}

const handleDistrictQuery = () => {
  districtPage.value = 1
}

const handleDistrictAdd = () => {
  const seq = districtList.value.length + 1
  districtList.value.unshift({
    name: `新增分区${seq}`,
    status: '启用',
    createdAt: '2025-09-01 10:00:00',
    updatedAt: '2025-09-01 10:00:00'
  })
  districtPage.value = 1
  ElMessage.success('新增分区成功')
}

const handleDistrictEdit = (row) => {
  ElMessage.success(`编辑分区"${row.name}"`)
}

const handleDistrictDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分区"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = districtList.value.findIndex(item => item.name === row.name)
    if (index > -1) {
      districtList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const handleSelectionChange = (_val) => {}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const STATUS_COLORS = { '已租赁': '#b8bec6', '未租赁': '#4f8ef7', '审批中': '#73d13d', '已占用': '#c9a06c', '处置中': '#f759ab', '流转中': '#9254de', '调拨中': '#36cfc9' }
const UNRENTABLE = ['已占用', '处置中', '流转中', '调拨中']

const codeRoomStatus = (s) => {
  if (s === '已出租' || s === '部分出租') return '已租赁'
  if (s === '空置' || s === '闲置') return '未租赁'
  if (s === '自用') return '已占用'
  return s || '未租赁'
}

const codeProjects = computed(() => projectStore.visibleProjects.map(b => {
  const floors = [...new Set(b.partitions.flatMap(p => p.floors.map(f => f.name)))]
  const rooms = b.partitions.flatMap(p => p.floors.flatMap(f => f.rooms.map(r => ({
    code: r.assetNo || r.id,
    assetId: r.id,
    roomNo: r.name,
    name: `${b.name} ${f.name} ${r.name}`,
    floor: f.name,
    area: r.area || 0,
    status: codeRoomStatus(r.status),
    idleDays: r.vacancyDays ?? (codeRoomStatus(r.status) === '未租赁' ? 60 : 0),
    tenant: r.tenant || '',
    rent: r.monthlyRent || 0
  }))))
  const leased = rooms.filter(r => r.status === '已租赁').length
  const utilization = rooms.length ? Math.round(leased / rooms.length * 10000) / 100 : 0
  return {
    key: b.id,
    name: b.name,
    code: b.id,
    company: b.group,
    address: b.address,
    createTime: '2026-01-01 09:00:00',
    status: '正常',
    type: b.type,
    bizStatus: leased === 0 ? '未租赁' : leased === rooms.length ? '整体租赁' : '部分租赁',
    utilization,
    idleArea: Math.round(rooms.filter(r => r.status === '未租赁').reduce((s, r) => s + r.area, 0) * 100) / 100,
    cumIncome: b.cumIncome || 0,
    yearIncome: b.yearIncome || 0,
    rentRate: utilization,
    feeRate: 0,
    leasedCount: leased,
    totalCount: rooms.length,
    pendingFee: 0,
    arrears: 0,
    useDonut: [leased, rooms.length - leased],
    monthly: Array.from({ length: 12 }, () => Math.round((b.yearIncome || 0) / 12 * 10) / 10),
    photo: 'linear-gradient(135deg, #8ea6c8, #c7d3e4)',
    buildings: [{ name: b.name, floors, rooms }]
  }
}))

const codeAssetKey = ref(null)
watch(codeProjects, (list) => {
  if (!list.length) return
  if (!list.some(p => p.key === codeAssetKey.value)) codeAssetKey.value = list[0].key
}, { immediate: true })

const distTab = ref('map')
const activeBuilding = ref('')
const activeFloor = ref('')
const excludeUnrentable = ref(false)
const codeQrVisible = ref(false)
const codeQrRow = ref(null)

const curProject = computed(() => codeProjects.value.find(p => p.key === codeAssetKey.value) || codeProjects.value[0])
const activeBuildingObj = computed(() => curProject.value.buildings.find(b => b.name === activeBuilding.value) || curProject.value.buildings[0])

watch([codeAssetKey, activeBuilding], () => {
  const b = curProject.value.buildings.find(x => x.name === activeBuilding.value) || curProject.value.buildings[0]
  activeBuilding.value = b.name
  if (!b.floors.includes(activeFloor.value)) activeFloor.value = b.floors[0]
}, { immediate: true })

const floorRooms = computed(() => activeBuildingObj.value.rooms.filter(r =>
  r.floor === activeFloor.value && (!excludeUnrentable.value || !UNRENTABLE.includes(r.status))
))

const roomStats = computed(() => {
  const rooms = activeBuildingObj.value.rooms
  return {
    total: rooms.length,
    area: rooms.reduce((s, r) => s + r.area, 0).toFixed(2),
    leased: rooms.filter(r => r.status === '已租赁').length,
    idle: rooms.filter(r => r.status === '未租赁').length
  }
})

const statusLegend = computed(() => Object.keys(STATUS_COLORS).map(name => ({
  name,
  color: STATUS_COLORS[name],
  count: floorRooms.value.filter(r => r.status === name).length
})))

const idleLegend = [
  { name: '空置0-90天', color: '#91d5ff' },
  { name: '空置90-180天', color: '#4f8ef7' },
  { name: '空置180天以上', color: '#2f54eb' },
  { name: '到期0-90天', color: '#ff7875' },
  { name: '到期90-180天', color: '#faad14' },
  { name: '到期180天以上', color: '#fadb14' }
]

const hashSeed = (str) => {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// 依据资产编号生成确定性的伪二维码点阵（13x13，含三个定位角）
const qrMatrix = (code) => {
  const n = 13
  let seed = hashSeed(code)
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const finder = (x, y) => {
    const zones = [[0, 0], [n - 5, 0], [0, n - 5]]
    for (const [ox, oy] of zones) {
      if (x >= ox && x < ox + 5 && y >= oy && y < oy + 5) {
        const lx = x - ox
        const ly = y - oy
        const edge = lx === 0 || lx === 4 || ly === 0 || ly === 4
        return edge || (lx === 2 && ly === 2) ? 2 : 1
      }
    }
    return 0
  }
  const cells = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const f = finder(x, y)
      cells.push(f === 2 ? 1 : f === 1 ? 0 : (rand() > 0.52 ? 1 : 0))
    }
  }
  return cells
}

const handlePrintCode = (row) => {
  const printWin = window.open('', '_blank', 'width=400,height=300')
  printWin.document.write(`<html><head><title>打印二维码 - ${row.name}</title><style>body{font-family:sans-serif;text-align:center;padding:40px}h2{margin-bottom:8px}p{color:#666;margin:4px 0}.qr-box{border:2px solid #333;display:inline-block;padding:24px;margin:16px 0}</style></head><body><h2>${row.name}</h2><p>编码: ${row.code}</p><div class="qr-box"><p>QR Code</p></div><p>类型: ${row.type} | 状态: ${row.status}</p><p>打印时间: ${new Date().toLocaleString('zh-CN', { hour12: false })}</p></body></html>`)
  printWin.document.close()
  printWin.focus()
  setTimeout(() => { printWin.print() }, 300)
  ElMessage.success(`资产"${row.name}"的二维码打印任务已创建`)
}

const handleCodeBack = () => {
  router.push('/ent/ledger-list')
}

const handleViewCode = (row) => {
  codeQrRow.value = row
  codeQrVisible.value = true
}

const donutRef = ref(null)
const pieRef = ref(null)
const barRef = ref(null)
let donutChart = null
let pieChart = null
let barChart = null

const renderCodeCharts = () => {
  if (!isCodeMode.value) return
  nextTick(() => {
    ;[donutChart, pieChart, barChart].forEach(c => c && !c.isDisposed() && c.dispose())
    donutChart = pieChart = barChart = null
    if (donutRef.value) {
      donutChart = echarts.init(donutRef.value)
      donutChart.setOption({
        animation: false,
        color: ['#4f8ef7', '#73d13d'],
        legend: { orient: 'vertical', right: 0, top: 'middle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12, color: '#646a73' } },
        series: [{
          type: 'pie',
          radius: ['52%', '74%'],
          center: ['36%', '50%'],
          label: { show: true, position: 'inside', fontSize: 10, color: '#fff' },
          labelLine: { show: false },
          data: [
            { value: curProject.value.useDonut[0], name: '已使用' },
            { value: curProject.value.useDonut[1], name: '未使用' }
          ]
        }]
      })
    }
    if (pieRef.value) {
      pieChart = echarts.init(pieRef.value)
      pieChart.setOption({
        animation: false,
        color: ['#5b6abf'],
        legend: { orient: 'vertical', right: 0, top: 'middle', itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 12, color: '#646a73' } },
        series: [{ type: 'pie', radius: '68%', center: ['36%', '50%'], label: { show: false }, data: [{ value: 1, name: curProject.value.type }] }]
      })
    }
    if (barRef.value) {
      barChart = echarts.init(barRef.value)
      barChart.setOption({
        animation: false,
        grid: { left: 36, right: 8, top: 16, bottom: 22 },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#dcdfe6' } },
          axisLabel: { color: '#646a73', fontSize: 10 }
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: '#eef0f3' } }, axisLabel: { color: '#646a73', fontSize: 10 } },
        series: [{
          type: 'bar',
          barWidth: 12,
          data: curProject.value.monthly,
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#36cfc9' }, { offset: 1, color: '#1890ff' }]) }
        }]
      })
    }
  })
}

const handleChartResize = () => {
  ;[donutChart, pieChart, barChart].forEach(c => c && !c.isDisposed() && c.resize())
}

watch([codeAssetKey, isCodeMode], renderCodeCharts, { flush: 'post' })

onMounted(() => {
  renderCodeCharts()
  window.addEventListener('resize', handleChartResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleChartResize)
  ;[donutChart, pieChart, barChart].forEach(c => c && !c.isDisposed() && c.dispose())
})
</script>

<style scoped>
.page-container {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 20px;
}

.category-tabs {
  margin-bottom: 4px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.expand-grid {
  margin: 8px 16px 12px 48px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}

.asset-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
}

.asset-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.card-photo {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
}

.card-body {
  padding: 10px 12px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 8px;
  padding: 8px;
  background: #fafafa;
  border-radius: 3px;
}

.card-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.card-stat-label {
  color: #999;
}

.card-stat-value {
  color: #333;
  font-weight: 600;
}

.card-address {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.card-address span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  margin-top: 6px;
  text-align: right;
}

.district-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.export-picker {
  display: flex;
  gap: 16px;
}

.picker-left,
.picker-right {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.picker-head {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
  color: #666;
}

.picker-fields {
  padding: 8px 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  overflow-y: auto;
}

.picker-fields .el-checkbox {
  margin-right: 0;
}

.picker-chosen {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
}

.chosen-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  font-size: 13px;
  color: #333;
  border-radius: 3px;
}

.chosen-row:hover {
  background: #f5f7fa;
}

.chosen-del {
  cursor: pointer;
  color: #999;
}

.chosen-del:hover {
  color: #f56c6c;
}

.timeline-operator {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

/* 一产一码 项目详情 */
.code-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 2px;
  margin-bottom: 10px;
}

.code-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.code-topbar-left .el-breadcrumb {
  line-height: 1;
}

.crumb-cur :deep(.el-breadcrumb__inner) {
  color: var(--c-primary);
}

.code-topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 13px;
  color: #646a73;
}

.code-card {
  margin-bottom: 10px;
}

.code-row .el-col {
  display: flex;
  flex-direction: column;
}

.code-row .code-card {
  flex: 1;
}

.code-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 12px;
}

.info-body {
  display: flex;
  gap: 16px;
}

.info-photo {
  flex: none;
  width: 240px;
  height: 160px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
}

.info-main {
  flex: 1;
  min-width: 0;
}

.info-name {
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.info-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #646a73;
}

.info-line span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-side {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.info-time {
  font-size: 13px;
  color: #646a73;
}

.info-stats {
  display: flex;
  margin-top: 16px;
}

.info-stat {
  flex: 1;
  text-align: center;
  border-left: 1px solid #e4e7ed;
}

.info-stat:first-child {
  border-left: none;
}

.info-stat .label {
  font-size: 13px;
  color: #646a73;
}

.info-stat .value {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}

.kpi-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.kpi-tile {
  position: relative;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 2px;
}

.kpi-label {
  font-size: 13px;
  color: #646a73;
}

.kpi-num {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.kpi-ico {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e8f2ff;
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.chart-cell {
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 2px;
}

.chart-value {
  margin: 2px 0 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1f2329;
}

.mini-chart {
  height: 120px;
}

.chart-label {
  display: block;
  margin-top: 12px;
}

.mid-chart {
  height: 168px;
  margin-top: 6px;
}

.rate-block {
  margin-top: 14px;
}

.rate-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #646a73;
  margin-bottom: 6px;
}

.rate-head b {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}

.rate-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.seg-tabs {
  display: flex;
  gap: 6px;
}

.seg-tabs button {
  padding: 6px 18px;
  font-size: 13px;
  color: #1f2329;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 2px;
  cursor: pointer;
}

.seg-tabs button.on {
  color: #fff;
  background: var(--c-primary);
  border-color: var(--c-primary);
}

.dist-wrap {
  display: grid;
  grid-template-columns: 170px 1fr 250px;
  gap: 16px;
  margin-top: 14px;
}

.dist-left {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bld-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 96px;
}

.bld {
  position: relative;
  padding: 9px 12px;
  font-size: 13px;
  color: #1f2329;
  background: #f0f1f2;
  border-radius: 2px;
  cursor: pointer;
}

.bld.on {
  color: #fff;
  background: var(--c-primary);
}

.bld.on::after {
  content: '';
  position: absolute;
  right: -10px;
  top: 50%;
  margin-top: -5px;
  border-left: 10px solid var(--c-primary);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

.floor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.floor {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #c9cdd4;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.floor.on {
  background: #8c8c8c;
}

.dist-chips {
  display: flex;
  gap: 10px;
}

.dchip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 2px;
}

.dchip b {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1f2329;
}

.dchip span {
  font-size: 12px;
  color: #646a73;
}

.dchip .el-icon {
  font-size: 22px;
  opacity: 0.55;
}

.dchip.c1 { background: #e8f2ff; }
.dchip.c2 { background: #fff7e0; }
.dchip.c3 { background: #e6fffb; }
.dchip.c4 { background: #fff1e6; }

.dist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
  margin: 12px 0;
}

.room {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  border-radius: 2px;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #646a73;
}

.lg {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sq {
  width: 10px;
  height: 10px;
  display: inline-block;
}

.ring {
  width: 12px;
  height: 12px;
  border: 2px solid;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
}

.legend-right {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dist-right {
  padding-top: 4px;
}

.rate-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #646a73;
}

.rate-line b {
  color: #1f2329;
}

.rate-line-bar {
  flex: 1;
  margin: 0;
}

.qr-block {
  flex: none;
  padding: 5px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 3px;
  width: max-content;
}

.qr-matrix {
  display: grid;
  grid-template-columns: repeat(13, 6px);
  grid-auto-rows: 6px;
}

.qr-matrix.qr-lg {
  grid-template-columns: repeat(13, 8px);
  grid-auto-rows: 8px;
}

.qr-matrix span {
  background: #fff;
}

.qr-matrix span.on {
  background: #303133;
}

.qr-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.qr-dialog-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2329;
}

.qr-dialog-code {
  font-size: 12px;
  color: var(--c-primary);
  font-family: Consolas, Menlo, monospace;
}
</style>
