<template>
  <div class="page-container">
    <div class="page-header">
      <h2>租赁管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">新增租赁</el-button>
        <el-button @click="handleRenewBatch">续租</el-button>
        <el-button @click="handleTerminateBatch">退租</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <el-tabs v-model="mainTab" type="border-card" class="fill">
      <el-tab-pane label="租赁管理" name="lease">
        <el-tabs v-model="categoryTab" type="card" class="category-tabs" @tab-change="assetPage = 1">
          <el-tab-pane v-for="c in categories" :key="c" :label="c" :name="c" />
        </el-tabs>

        <div class="stat-strip">
          <div class="stat-item">
            <div class="stat-value">{{ stats.used }}<span class="unit">项</span></div>
            <div class="stat-label">已使用资产</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.unused }}<span class="unit">项</span></div>
            <div class="stat-label">未使用资产</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.rentRate }}<span class="unit">%</span></div>
            <div class="stat-label">出租率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.occupyRate }}<span class="unit">%</span></div>
            <div class="stat-label">占用率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.idleArea }}<span class="unit">㎡</span></div>
            <div class="stat-label">闲置面积</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.idleRate }}<span class="unit">%</span></div>
            <div class="stat-label">闲置率</div>
          </div>
        </div>

        <div class="table-toolbar">
          <el-button type="primary" @click="handleComboLease">组合租赁</el-button>
          <el-button @click="handleSplitLease">拆分租赁</el-button>
          <span v-if="assetSelection.length" class="selected-hint">已选 {{ assetSelection.length }} 项</span>
          <div class="icon-toolbar">
            <el-tooltip content="刷新" placement="top">
              <el-button :icon="Refresh" circle @click="handleRefresh" />
            </el-tooltip>
            <el-tooltip content="筛选" placement="top">
              <el-button :icon="Filter" circle :type="showFilter ? 'primary' : ''" @click="showFilter = !showFilter" />
            </el-tooltip>
          </div>
        </div>

        <div v-show="showFilter" class="quick-filter">
          <div class="chip-row">
            <span class="chip-label">来源类型</span>
            <span class="chip" :class="{ on: sourceFilter === '不限' }" @click="sourceFilter = '不限'; assetPage = 1">不限</span>
            <span v-for="s in sourceTypes" :key="s" class="chip" :class="{ on: sourceFilter === s }" @click="sourceFilter = s; assetPage = 1">{{ s }}</span>
          </div>
          <div class="chip-row">
            <span class="chip-label">资产权属</span>
            <span class="chip" :class="{ on: ownershipFilter === '不限' }" @click="ownershipFilter = '不限'; assetPage = 1">不限</span>
            <span v-for="o in ownerships" :key="o" class="chip" :class="{ on: ownershipFilter === o }" @click="ownershipFilter = o; assetPage = 1">{{ o }}</span>
          </div>
          <div class="chip-row">
            <span class="chip-label">关键字</span>
            <el-input v-model="assetKeyword" placeholder="资产编号/名称/地址" clearable size="small" style="width: 240px" :prefix-icon="Search" @input="assetPage = 1" />
          </div>
        </div>

        <el-table :data="pagedAssets" border stripe @selection-change="onAssetSelect">
          <el-table-column type="expand" width="45">
            <template #default="{ row }">
              <div v-if="row.children && row.children.length" class="expand-wrap">
                <div class="section-title">拆分子单元（{{ row.children.length }} 项）</div>
                <el-table :data="row.children" border size="small" class="child-table">
                  <el-table-column prop="assetNo" label="资产编号" width="140" />
                  <el-table-column prop="name" label="单元名称" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="area" label="面积(㎡)" width="110" align="right">
                    <template #default="{ row: c }">{{ c.area.toLocaleString() }}</template>
                  </el-table-column>
                  <el-table-column prop="floor" label="楼层" width="120" />
                  <el-table-column prop="leaseStatus" label="租赁状态" width="100" align="center">
                    <template #default="{ row: c }">
                      <el-tag :type="leaseTagType(c.leaseStatus)" size="small">{{ c.leaseStatus }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="出租/自用/可用" width="170" align="right">
                    <template #default="{ row: c }">
                      <span style="color:#67c23a">{{ (c.leasedArea || 0).toLocaleString() }}</span>
                      <span style="color:#c0c4cc"> / </span>
                      <span style="color:#409eff">{{ (c.usedArea || 0).toLocaleString() }}</span>
                      <span style="color:#c0c4cc"> / </span>
                      <span style="color:#e6a23c">{{ ((c.usableArea || 0) - (c.leasedArea || 0) - (c.usedArea || 0)).toLocaleString() }}</span>
                      <span style="color:#909399;font-size:12px"> ㎡</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="200">
                    <template #default="{ row: c }">
                      <el-button type="primary" link size="small" @click="viewAsset(c)">详情</el-button>
                      <el-dropdown
                        v-if="rowAvailableArea(c) > 0"
                        style="margin-left:8px;vertical-align:middle"
                        @command="cmd => handleAssetMore(cmd, c)"
                      >
                        <el-button type="primary" link size="small">更多<el-icon style="margin-left:2px"><ArrowDown /></el-icon></el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="use">+自用</el-dropdown-item>
                            <el-dropdown-item command="occupy">+占用</el-dropdown-item>
                            <el-dropdown-item command="lease">添加租赁</el-dropdown-item>
                            <el-dropdown-item command="rent">跳招商发布</el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                      <span v-else style="margin-left:8px;color:#f56c6c;font-size:12px">已租满</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="expand-wrap">
                <div class="section-title">资产补充信息</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ row.name }}</div></div>
                  <div class="cell"><div class="label">省市区</div><div class="value">{{ row.district }}</div></div>
                  <div class="cell"><div class="label">分区</div><div class="value">{{ row.zone }}</div></div>
                  <div class="cell"><div class="label">部分租赁状态</div><div class="value">{{ row.partialLease }}</div></div>
                  <div class="cell"><div class="label">资产房型</div><div class="value">{{ row.roomType }}</div></div>
                  <div class="cell"><div class="label">资产面积</div><div class="value">{{ row.area.toLocaleString() }} ㎡</div></div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="selection" width="45" />
          <el-table-column prop="project" label="项目" width="120" show-overflow-tooltip />
          <el-table-column prop="assetNo" label="资产编号" width="120" />
          <el-table-column prop="company" label="所属公司" width="140" show-overflow-tooltip />
          <el-table-column prop="address" label="资产地址" width="170" show-overflow-tooltip />
          <el-table-column label="出租/自用/可用" width="180" align="right">
            <template #default="{ row }">
              <span class="area-rented num">{{ (row.leasedArea || 0).toLocaleString() }}</span>
              <span class="area-sep"> / </span>
              <span class="area-self num">{{ (row.usedArea || 0).toLocaleString() }}</span>
              <span class="area-sep"> / </span>
              <span class="area-free num">{{ rowAvailableArea(row).toLocaleString() }}</span>
              <span class="area-unit"> ㎡</span>
            </template>
          </el-table-column>
          <el-table-column prop="assetStatus" label="资产状态" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="assetStatusType(row.assetStatus)" size="small">{{ row.assetStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="leaseStatus" label="租赁状态" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="leaseTagType(row.leaseStatus)" size="small">{{ row.leaseStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewAsset(row)">详情</el-button>
              <el-dropdown
                v-if="(!row.children || !row.children.length) && rowAvailableArea(row) > 0"
                style="margin-left:8px;vertical-align:middle"
                @command="cmd => handleAssetMore(cmd, row)"
              >
                <el-button type="primary" link size="small">更多<el-icon style="margin-left:2px"><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="use">+自用</el-dropdown-item>
                    <el-dropdown-item command="occupy">+占用</el-dropdown-item>
                    <el-dropdown-item command="lease">添加租赁</el-dropdown-item>
                    <el-dropdown-item command="rent">跳招商发布</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <span v-else-if="row.children && row.children.length" class="hint-split">已拆分，请在子单元操作</span>
              <span v-else class="hint-full">已租满，无可操作面积</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="assetPage"
            v-model:page-size="assetPageSize"
            :page-sizes="[15, 30, 50]"
            :total="filteredAssets.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="租赁合同" name="contract">
        <el-card class="filter-bar" shadow="never">
          <el-row :gutter="16">
            <el-col :span="5">
              <el-input v-model="filters.keyword" placeholder="资产名称/合同编号" clearable :prefix-icon="Search" />
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.leaseStatus" placeholder="租赁状态" clearable>
                <el-option label="在租" value="在租" />
                <el-option label="已退租" value="已退租" />
                <el-option label="即将到期" value="即将到期" />
                <el-option label="待起租" value="待起租" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.project" placeholder="所属项目" clearable>
                <el-option v-for="p in projectOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="filters.assetType" placeholder="资产类型" clearable>
                <el-option label="商铺" value="商铺" />
                <el-option label="写字楼" value="写字楼" />
                <el-option label="厂房" value="厂房" />
                <el-option label="保障房" value="保障房" />
                <el-option label="农贸市场" value="农贸市场" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-table :data="pagedData" border stripe show-summary :summary-method="getSummary">
          <el-table-column prop="contractNo" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="tenant" label="承租方" width="140" />
          <el-table-column prop="project" label="所属项目" width="150" show-overflow-tooltip />
          <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
          <el-table-column prop="monthlyRent" label="月租金(元)" width="120" align="right">
            <template #default="{ row }">{{ row.monthlyRent.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="startDate" label="起租日" width="110" />
          <el-table-column prop="endDate" label="到期日" width="110" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
              <el-button type="success" link size="small" @click="handleStartLease(row)" v-if="row.status === '待起租'">起租</el-button>
              <el-button type="primary" link size="small" @click="handleRenew(row)" v-if="row.status === '在租' || row.status === '即将到期'">续租</el-button>
              <el-button type="danger" link size="small" @click="handleTerminate(row)" v-if="row.status !== '已退租'">退租</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[15, 30, 50]"
            :total="filteredData.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="资产占用" name="occupy">
        <el-card class="filter-bar" shadow="never">
          <el-row :gutter="16">
            <el-col :span="5">
              <el-input v-model="occFilters.person" placeholder="责任人" clearable :prefix-icon="Search" />
            </el-col>
            <el-col :span="5">
              <el-select v-model="occFilters.company" placeholder="公司" clearable>
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="occFilters.status" placeholder="状态" clearable>
                <el-option label="正常" value="正常" />
                <el-option label="已过期" value="已过期" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-select v-model="occFilters.type" placeholder="类型" clearable>
                <el-option label="自用" value="自用" />
                <el-option label="占用" value="占用" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-button type="primary" @click="occPage = 1">查询</el-button>
              <el-button @click="resetOcc">重置</el-button>
            </el-col>
          </el-row>
        </el-card>

        <el-table :data="pagedOcc" border stripe>
          <el-table-column prop="no" label="编号" width="130" />
          <el-table-column prop="company" label="公司名称" width="120" />
          <el-table-column prop="person" label="责任人" width="100" />
          <el-table-column prop="period" label="占用自用时间" min-width="200" />
          <el-table-column prop="type" label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === '自用' ? 'success' : 'warning'" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="95" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column prop="voidTime" label="作废时间" width="160">
            <template #default="{ row }">{{ row.voidTime || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewOcc(row)">详情</el-button>
              <el-button type="danger" link size="small" :disabled="!!row.voidTime" @click="voidOcc(row)">作废</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="occPage"
            v-model:page-size="occPageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredOcc.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="assetDetailVisible" title="资产详情" width="820px">
      <div class="section-title">资产基础信息</div>
      <div class="detail-grid" v-if="currentAsset">
        <div class="cell"><div class="label">省市区</div><div class="value">{{ currentAsset.district }}</div></div>
        <div class="cell"><div class="label">项目</div><div class="value">{{ currentAsset.project }}</div></div>
        <div class="cell"><div class="label">分区</div><div class="value">{{ currentAsset.zone }}</div></div>
        <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ currentAsset.name }}</div></div>
        <div class="cell"><div class="label">资产编号</div><div class="value">{{ currentAsset.assetNo }}</div></div>
        <div class="cell"><div class="label">资产面积</div><div class="value">{{ currentAsset.area.toLocaleString() }} ㎡</div></div>
        <div class="cell"><div class="label">可使用面积</div><div class="value">{{ currentAsset.usableArea.toLocaleString() }} ㎡</div></div>
        <div class="cell"><div class="label">资产房型</div><div class="value">{{ currentAsset.roomType }}</div></div>
        <div class="cell"><div class="label">所属公司</div><div class="value">{{ currentAsset.company }}</div></div>
        <div class="cell"><div class="label">资产类型</div><div class="value">{{ currentAsset.assetType }}</div></div>
        <div class="cell"><div class="label">购置时间</div><div class="value">{{ currentAsset.purchaseDate }}</div></div>
        <div class="cell"><div class="label">资产原值</div><div class="value">{{ currentAsset.originalValue.toLocaleString() }} 万元</div></div>
        <div class="cell"><div class="label">所在楼层</div><div class="value">{{ currentAsset.floor }}</div></div>
        <div class="cell"><div class="label">是否租赁</div><div class="value">{{ currentAsset.isLeased }}</div></div>
        <div class="cell"><div class="label">资产地址</div><div class="value">{{ currentAsset.address }}</div></div>
      </div>
      <template #footer>
        <el-button @click="assetDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="useDialogVisible" :title="useMode === '自用' ? '新增自用' : '新增占用'" width="820px" destroy-on-close>
      <div class="section-title">资产基础信息</div>
      <div class="detail-grid" v-if="useAsset">
        <div class="cell"><div class="label">省市区</div><div class="value">{{ useAsset.district }}</div></div>
        <div class="cell"><div class="label">项目</div><div class="value">{{ useAsset.project }}</div></div>
        <div class="cell"><div class="label">分区</div><div class="value">{{ useAsset.zone }}</div></div>
        <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ useAsset.name }}</div></div>
        <div class="cell"><div class="label">资产编号</div><div class="value">{{ useAsset.assetNo }}</div></div>
        <div class="cell"><div class="label">资产面积</div><div class="value">{{ useAsset.area.toLocaleString() }} ㎡</div></div>
        <div class="cell"><div class="label">可使用面积</div><div class="value">{{ useAsset.usableArea.toLocaleString() }} ㎡</div></div>
        <div class="cell"><div class="label">资产房型</div><div class="value">{{ useAsset.roomType }}</div></div>
        <div class="cell"><div class="label">所属公司</div><div class="value">{{ useAsset.company }}</div></div>
        <div class="cell"><div class="label">资产类型</div><div class="value">{{ useAsset.assetType }}</div></div>
        <div class="cell"><div class="label">购置时间</div><div class="value">{{ useAsset.purchaseDate }}</div></div>
        <div class="cell"><div class="label">资产原值</div><div class="value">{{ useAsset.originalValue.toLocaleString() }} 万元</div></div>
        <div class="cell"><div class="label">所在楼层</div><div class="value">{{ useAsset.floor }}</div></div>
        <div class="cell"><div class="label">是否租赁</div><div class="value">{{ useAsset.isLeased }}</div></div>
        <div class="cell"><div class="label">资产地址</div><div class="value">{{ useAsset.address }}</div></div>
      </div>
      <div class="section-title">{{ useMode === '自用' ? '自用信息' : '占用信息' }}</div>
      <el-form :model="useForm" label-width="110px">
        <el-form-item :label="useMode + '状态'">
          <el-radio-group v-model="useForm.useStatus">
            <el-radio :value="'全部' + useMode">全部{{ useMode }}</el-radio>
            <el-radio :value="'部分' + useMode">部分{{ useMode }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="useForm.useStatus === '部分' + useMode" :label="useMode + '面积(㎡)'">
          <el-input-number v-model="useForm.useArea" :min="0" :max="useAsset ? rowAvailableArea(useAsset) : 0" :step="10" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item :label="useMode + '编号'">
          <el-input v-model="useForm.useNo" :placeholder="'请输入' + useMode + '编号'" maxlength="20" show-word-limit style="width: 320px" />
        </el-form-item>
        <el-form-item label="责任人">
          <el-select v-model="useForm.responsible" placeholder="请选择责任人" style="width: 320px">
            <el-option v-for="p in responsibles" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="useForm.remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="请输入备注" style="width: 480px" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-date-picker
            v-model="useForm.period"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 320px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="useDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUse">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="occDetailVisible" title="占用详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOcc">
        <el-descriptions-item label="编号">{{ currentOcc.no }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentOcc.type === '自用' ? 'success' : 'warning'" size="small">{{ currentOcc.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="公司名称">{{ currentOcc.company }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ currentOcc.person }}</el-descriptions-item>
        <el-descriptions-item label="占用自用时间" :span="2">{{ currentOcc.period }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentOcc.status === '正常' ? 'success' : 'danger'" size="small">{{ currentOcc.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOcc.createTime }}</el-descriptions-item>
        <el-descriptions-item label="作废时间" :span="2">{{ currentOcc.voidTime || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOcc.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="occDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="租赁详情" width="700px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="合同编号">{{ currentRow.contractNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentRow.status)" size="small">{{ currentRow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentRow.assetName }}</el-descriptions-item>
        <el-descriptions-item label="承租方">{{ currentRow.tenant }}</el-descriptions-item>
        <el-descriptions-item label="资产类型">{{ currentRow.assetType }}</el-descriptions-item>
        <el-descriptions-item label="面积(㎡)">{{ currentRow.area }}</el-descriptions-item>
        <el-descriptions-item label="月租金(元)">{{ currentRow.monthlyRent?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="起租日">{{ currentRow.startDate }}</el-descriptions-item>
        <el-descriptions-item label="到期日">{{ currentRow.endDate }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addDialogVisible" title="新增租赁" width="650px" destroy-on-close>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
        title="适用场景：已有确定租户、直接议定租金时走此入口即时签约。"
        description="若需公开发布招租信息、走报名/竞价/摇号流程，请前往『资产运营 → 招商发布』；招商成交后再回到本页『新增租赁』落定合同。"
      />
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="租赁资产" required>
          <el-select v-model="addForm.assetId" placeholder="选择闲置或部分出租的现有资产" style="width: 100%" filterable @change="handleAddAssetPick">
            <el-option
              v-for="a in leaseAssetOptions"
              :key="a.id"
              :label="`${a.name}（可租 ${a.area.toLocaleString()} / ${a.totalArea.toLocaleString()} ㎡${a.status === '部分出租' ? '，部分出租' : ''}）`"
              :value="a.id"
            />
          </el-select>
          <div class="area-hint" v-if="!addForm.assetId">从资产库中选择现有资产；签约后自动联动资产租赁状态与工作台、盘活面板统计</div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="承租方" required>
              <el-input v-model="addForm.tenant" placeholder="请输入承租方" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租赁面积(㎡)" required>
              <el-input-number v-model="addForm.area" :min="0" :max="pickedAddArea" :precision="2" :step="100" style="width: 100%" :disabled="!addForm.assetId" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="月租金(元)" required>
          <el-input-number v-model="addForm.monthlyRent" :min="0" :precision="2" :step="100" style="width: 100%" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起租日" required>
              <el-date-picker v-model="addForm.startDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到期日" required>
              <el-date-picker v-model="addForm.endDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="splitDialogVisible" title="拆分租赁" width="750px" destroy-on-close>
      <div v-if="splitAsset" class="split-info">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="资产名称">{{ splitAsset.name }}</el-descriptions-item>
          <el-descriptions-item label="资产编号">{{ splitAsset.assetNo }}</el-descriptions-item>
          <el-descriptions-item label="可使用面积">{{ splitAsset.usableArea }} ㎡</el-descriptions-item>
          <el-descriptions-item label="已出租面积（不可拆）">
            <span style="color:#67c23a">{{ splitAsset.leasedArea || 0 }} ㎡</span>
          </el-descriptions-item>
          <el-descriptions-item label="已自用/占用面积（不可拆）">
            <span style="color:#409eff">{{ splitAsset.usedArea || 0 }} ㎡</span>
          </el-descriptions-item>
          <el-descriptions-item label="可拆分面积">
            <span style="color:#e6a23c;font-weight:600">{{ splitAvailableArea }} ㎡</span>
          </el-descriptions-item>
          <el-descriptions-item label="租赁状态">
            <el-tag size="small" :type="leaseTagType(splitAsset.leaseStatus)">{{ splitAsset.leaseStatus }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-form :model="splitForm" label-width="100px" style="margin-top: 16px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="拆分数量">
              <el-input-number v-model="splitForm.splitCount" :min="2" :max="10" @change="generateSplitUnits" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拆分方式">
              <el-radio-group v-model="splitForm.splitMode" @change="generateSplitUnits">
                <el-radio value="均分">均分</el-radio>
                <el-radio value="自定义">自定义</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="splitForm.units" border size="small" style="margin-top: 8px">
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="单元名称" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.name" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="面积(㎡)" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.area" :min="0" :precision="2" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="租赁状态" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="leaseTagType(row.leaseStatus)">{{ row.leaseStatus }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div style="text-align: right; margin-top: 8px; font-size: 13px; color: var(--t-weak)">
        拆分总面积：{{ splitForm.units.reduce((s, u) => s + u.area, 0).toFixed(2) }} ㎡ / 可拆分 {{ splitAvailableArea }} ㎡（已出租 {{ splitAsset?.leasedArea || 0 }} ㎡、自用/占用 {{ splitAsset?.usedArea || 0 }} ㎡ 保留不动）
      </div>
      <template #footer>
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSplitLease">确认拆分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Filter, Search, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { useContractStore } from '../../store/contract'
import { useProjectStore } from '../../store/project'
import { useAssetStore } from '../../store/asset'

const router = useRouter()
const userStore = useUserStore()
const contractStore = useContractStore()
const projectStore = useProjectStore()
const assetStore = useAssetStore()
// 本页是演示数据，行内 company 随机分到四家；企业端只放行本公司行
const currentCompany = computed(() => userStore.user?.org || '城投集团')
const mineOnly = (rows) => userStore.isEnt ? rows.filter(r => r.company === currentCompany.value) : rows

const mainTab = ref('lease')

const categories = ['房产类', '土地类', '经营类房屋店铺', '农贸市场', '运输设备', '矿产资源类', '公共设备类', '长期股权投资类', '经营性生产设备类', '特殊特种行业类', '经营权类资产', '特殊动植物类']
const companies = ['城投集团', '产投集团', '水投集团', '领航公司']
const companyOptions = computed(() => userStore.isEnt ? [currentCompany.value] : companies)
const sourceTypes = ['自建', '购置', '划转', '接收', '注入']
const ownerships = ['有证', '无证', '两证齐全', '待办证']
const responsibles = ['张伟', '李娜', '王强', '刘敏', '陈杰']
const districts = ['福州市长乐区吴航街道', '福州市长乐区航城街道', '福州市长乐区营前街道', '福州市长乐区首占镇', '福州市长乐区鹤上镇', '福州市长乐区江田镇']
const roomTypes = ['大开间', '标准间', '单间', '整套', '开放式']
const nameTemplates = {
  '房产类': '综合楼',
  '土地类': '地块',
  '经营类房屋店铺': '商铺',
  '农贸市场': '摊位',
  '运输设备': '运输车辆',
  '矿产资源类': '矿区',
  '公共设备类': '公共设备',
  '长期股权投资类': '股权',
  '经营性生产设备类': '生产设备',
  '特殊特种行业类': '特种资产',
  '经营权类资产': '经营权',
  '特殊动植物类': '养殖基地'
}

function buildAssets() {
  const list = []
  let seq = 1
  categories.forEach((cat, ci) => {
    const count = 4 + (ci % 3)
    for (let i = 0; i < count; i++) {
      const n = seq
      const d = districts[(ci + i) % districts.length]
      const area = 200 + ((n * 137) % 4800)
      const assetStatus = ['已使用', '未使用', '闲置'][n % 3]
      const leaseStatus = ['已出租', '部分出租', '未出租'][(n + 1) % 3]
      const usableArea = Math.round(area * (0.6 + ((n % 4) * 0.1)))
      const leasedArea = leaseStatus === '已出租' ? usableArea
        : leaseStatus === '部分出租' ? Math.round(usableArea * 0.4)
        : 0
      const shortName = nameTemplates[cat]
      list.push({
        id: n,
        category: cat,
        district: d,
        project: `${cat.slice(0, 2)}项目${String(ci + 1).padStart(2, '0')}`,
        zone: `${String.fromCharCode(65 + (i % 6))}区`,
        company: companies[(ci + i) % companies.length],
        assetNo: `ZC${String(n).padStart(5, '0')}`,
        name: `${d.slice(-3)}${shortName}${String(i + 1).padStart(2, '0')}`,
        address: `${d}${shortName}${String(i + 1).padStart(2, '0')}号`,
        area,
        usableArea,
        leasedArea,
        usedArea: 0,
        assetStatus,
        leaseStatus,
        partialLease: n % 2 === 0 ? '支持' : '不支持',
        roomType: cat === '房产类' || cat === '经营类房屋店铺' ? roomTypes[n % 5] : '—',
        sourceType: sourceTypes[n % sourceTypes.length],
        ownership: ownerships[(n + 1) % ownerships.length],
        assetType: cat,
        purchaseDate: `20${18 + (n % 6)}-0${(n % 9) + 1}-1${n % 9}`,
        originalValue: 500 + ((n * 211) % 9500),
        floor: cat === '房产类' || cat === '经营类房屋店铺' ? `${(n % 20) + 1}层` : '—',
        isLeased: leaseStatus === '未出租' ? '否' : '是',
        children: []
      })
      seq++
    }
  })
  return list
}

const assetData = ref(mineOnly(buildAssets()))
const categoryTab = ref(categories[0])
const sourceFilter = ref('不限')
const ownershipFilter = ref('不限')
const assetKeyword = ref('')
const showFilter = ref(true)
const assetPage = ref(1)
const assetPageSize = ref(15)
const assetSelection = ref([])

const filteredAssets = computed(() => {
  return assetData.value.filter(a => {
    if (a.category !== categoryTab.value) return false
    if (sourceFilter.value !== '不限' && a.sourceType !== sourceFilter.value) return false
    if (ownershipFilter.value !== '不限' && a.ownership !== ownershipFilter.value) return false
    if (assetKeyword.value) {
      const kw = assetKeyword.value
      const selfMatch = a.assetNo.includes(kw) || a.name.includes(kw) || a.address.includes(kw)
      const childMatch = a.children?.some(c => c.assetNo.includes(kw) || c.name.includes(kw))
      if (!selfMatch && !childMatch) return false
    }
    return true
  })
})

const pagedAssets = computed(() => {
  const start = (assetPage.value - 1) * assetPageSize.value
  return filteredAssets.value.slice(start, start + assetPageSize.value)
})

const stats = computed(() => {
  const list = filteredAssets.value
  const total = list.length
  const used = list.filter(a => a.assetStatus === '已使用').length
  const unused = list.filter(a => a.assetStatus === '未使用').length
  const idle = list.filter(a => a.assetStatus === '闲置')
  const leased = list.filter(a => a.leaseStatus !== '未出租').length
  const idleArea = idle.reduce((s, a) => s + a.area, 0)
  return {
    used,
    unused,
    rentRate: total ? Math.round((leased / total) * 1000) / 10 : 0,
    occupyRate: total ? Math.round((used / total) * 1000) / 10 : 0,
    idleArea: idleArea.toLocaleString(),
    idleRate: total ? Math.round((idle.length / total) * 1000) / 10 : 0
  }
})

const assetStatusType = (s) => ({ '已使用': 'success', '未使用': 'warning', '闲置': 'info' }[s] || 'info')
const leaseTagType = (s) => ({ '已出租': 'success', '部分出租': 'warning', '未出租': 'info' }[s] || 'info')

function onAssetSelect(rows) { assetSelection.value = rows }
function handleRefresh() {
  assetPage.value = 1
  ElMessage.success('已刷新资产列表')
}
function handleComboLease() {
  if (assetSelection.value.length < 2) { ElMessage.warning('请勾选至少两项资产进行组合租赁'); return }
  const selected = assetSelection.value
  const first = selected[0]
  const totalArea = selected.reduce((s, a) => s + a.usableArea, 0)
  const comboName = `${first.name}等${selected.length}项组合`
  const comboAsset = {
    ...first,
    id: Date.now(),
    assetNo: `ZH${String(assetData.value.length + 1).padStart(5, '0')}`,
    name: comboName,
    area: totalArea,
    usableArea: totalArea,
    assetStatus: '未使用',
    leaseStatus: '未出租',
    partialLease: '不支持',
    isLeased: '否',
    comboAssets: selected.map(a => a.assetNo).join(', '),
    children: []
  }
  assetData.value.push(comboAsset)
  selected.forEach(a => { a.assetStatus = '已使用'; a.leaseStatus = '已出租'; a.isLeased = '是' })
  assetSelection.value = []
  ElMessage.success(`已将 ${selected.length} 项资产组合为"${comboName}"`)
}
function handleSplitLease() {
  if (assetSelection.value.length !== 1) { ElMessage.warning('请勾选一项需要拆分租赁的资产'); return }
  const row = assetSelection.value[0]
  if (row.children && row.children.length) { ElMessage.warning('该资产已拆分，请在子单元上直接操作或先删除现有子单元'); return }
  if (row.leaseStatus === '已出租') { ElMessage.warning('该资产已完全出租，无空余面积可拆分'); return }
  const available = rowAvailableArea(row)
  if (available <= 0) { ElMessage.warning('该资产无空余面积可拆分'); return }
  splitAsset.value = row
  splitForm.value = {
    splitCount: 2,
    splitMode: '均分',
    units: []
  }
  generateSplitUnits()
  splitDialogVisible.value = true
}

const splitDialogVisible = ref(false)
const splitAsset = ref(null)
const splitForm = ref({ splitCount: 2, splitMode: '均分', units: [] })
const splitAvailableArea = computed(() => {
  const a = splitAsset.value
  if (!a) return 0
  return Math.max(0, (a.usableArea || 0) - (a.leasedArea || 0) - (a.usedArea || 0))
})

function generateSplitUnits() {
  const asset = splitAsset.value
  if (!asset) return
  const count = splitForm.value.splitCount
  const totalArea = splitAvailableArea.value
  const units = []
  for (let i = 0; i < count; i++) {
    const area = splitForm.value.splitMode === '均分'
      ? Math.round(totalArea / count * 100) / 100
      : Math.round(totalArea / count * (0.8 + Math.random() * 0.4) * 100) / 100
    units.push({
      name: `${asset.name}-${String.fromCharCode(65 + i)}`,
      area: Math.min(area, totalArea - units.reduce((s, u) => s + u.area, 0)),
      leaseStatus: '未出租',
      tenant: '',
      monthlyRent: 0
    })
  }
  const diff = totalArea - units.reduce((s, u) => s + u.area, 0)
  if (Math.abs(diff) > 0.01) units[units.length - 1].area = Math.round((units[units.length - 1].area + diff) * 100) / 100
  splitForm.value.units = units
}

function confirmSplitLease() {
  const asset = splitAsset.value
  const units = splitForm.value.units
  if (!units.length) { ElMessage.warning('请至少生成一个拆分单元'); return }
  const available = splitAvailableArea.value
  const totalSplitArea = units.reduce((s, u) => s + u.area, 0)
  if (totalSplitArea > available + 0.01) {
    ElMessage.warning(`拆分总面积不能超过可拆分面积 ${available} ㎡`); return
  }
  const leasedArea = asset.leasedArea || 0
  const usedArea = asset.usedArea || 0
  const newChildren = units.map((u, i) => ({
    ...asset,
    id: Date.now() + i,
    assetNo: `${asset.assetNo}-${String.fromCharCode(65 + i)}`,
    name: u.name,
    area: u.area,
    usableArea: u.area,
    leasedArea: 0,
    usedArea: 0,
    parentAssetNo: asset.assetNo,
    assetStatus: '未使用',
    leaseStatus: u.leaseStatus,
    partialLease: '不支持',
    isLeased: u.leaseStatus === '未出租' ? '否' : '是',
    floor: `${asset.floor} ${String.fromCharCode(65 + i)}单元`,
    children: []
  }))
  asset.children = newChildren
  asset.leasedAreaBase = leasedArea
  asset.usedAreaBase = usedArea
  asset.usableArea = leasedArea + usedArea + totalSplitArea
  asset.leasedArea = leasedArea
  asset.usedArea = usedArea
  asset.leaseStatus = leasedArea > 0 ? '部分出租' : '未出租'
  asset.isLeased = leasedArea > 0 ? '是' : '否'
  asset.partialLease = '支持'
  assetSelection.value = []
  splitDialogVisible.value = false
  ElMessage.success(`已将"${asset.name}"的空余 ${totalSplitArea} ㎡ 拆分为 ${units.length} 个子单元`)
}

const assetDetailVisible = ref(false)
const currentAsset = ref(null)
function viewAsset(row) { currentAsset.value = row; assetDetailVisible.value = true }

const useDialogVisible = ref(false)
const useMode = ref('自用')
const useAsset = ref(null)
const useForm = ref({ useStatus: '全部自用', useArea: 0, useNo: '', responsible: '', remark: '', period: null })
function openUseDialog(row, mode) {
  if (row.children && row.children.length) {
    ElMessage.warning('该资产已拆分为子单元，请在子单元上执行' + mode)
    return
  }
  const available = rowAvailableArea(row)
  if (available <= 0) {
    ElMessage.warning('该资产已无空余面积可' + mode)
    return
  }
  useMode.value = mode
  useAsset.value = row
  useForm.value = { useStatus: '全部' + mode, useArea: available, useNo: '', responsible: '', remark: '', period: null }
  useDialogVisible.value = true
}
// 拆分后父行的可租面积 = 已拆分但子单元未租出的部分；未拆分时 = usableArea - leasedArea - usedArea
function rowOccupiedArea(row) {
  return (row.leasedArea || 0) + (row.usedArea || 0)
}
function rowAvailableArea(row) {
  if (!row) return 0
  const cap = row.usableArea || 0
  if (row.parentAssetNo) return Math.max(0, cap - rowOccupiedArea(row))
  if (row.children && row.children.length) {
    return row.children.reduce((s, c) => s + rowAvailableArea(c), 0)
  }
  return Math.max(0, cap - rowOccupiedArea(row))
}
function refreshRowStatus(row) {
  const cap = row.usableArea || 0
  const leased = row.leasedArea || 0
  const used = row.usedArea || 0
  row.leaseStatus = leased === 0 ? '未出租' : (leased >= cap ? '已出租' : '部分出租')
  row.isLeased = leased > 0 ? '是' : '否'
  if (leased + used > 0 && row.assetStatus === '未使用') row.assetStatus = '已使用'
}
// 状态回算：父行 leasedArea/usedArea = 各自 base + Σ 子单元同名字段
function refreshParentLeasedArea(parent) {
  const leasedBase = parent.leasedAreaBase || 0
  const usedBase = parent.usedAreaBase || 0
  parent.leasedArea = leasedBase + (parent.children || []).reduce((s, c) => s + (c.leasedArea || 0), 0)
  parent.usedArea = usedBase + (parent.children || []).reduce((s, c) => s + (c.usedArea || 0), 0)
  refreshRowStatus(parent)
}
// 面积扣减通用入口：kind = 'lease' 走出租，'use' 走自用/占用
function applyAreaDelta(row, delta, kind) {
  if (!row || delta <= 0) return false
  const field = kind === 'use' ? 'usedArea' : 'leasedArea'
  const baseField = kind === 'use' ? 'usedAreaBase' : 'leasedAreaBase'
  if (row.parentAssetNo) {
    const room = (row.usableArea || 0) - rowOccupiedArea(row)
    const actual = Math.min(room, delta)
    if (actual <= 0) return false
    row[field] = (row[field] || 0) + actual
    refreshRowStatus(row)
    const parent = assetData.value.find(a => a.assetNo === row.parentAssetNo)
    if (parent) refreshParentLeasedArea(parent)
    return true
  }
  if (row.children && row.children.length) {
    ElMessage.warning('该资产已拆分，请在子单元上操作')
    return false
  }
  const room = (row.usableArea || 0) - rowOccupiedArea(row)
  const actual = Math.min(room, delta)
  if (actual <= 0) return false
  row[field] = (row[field] || 0) + actual
  row[baseField] = (row[baseField] || 0) + actual
  refreshRowStatus(row)
  return true
}
function applyLeaseAreaToRow(row, delta) { return applyAreaDelta(row, delta, 'lease') }
function applyUseAreaToRow(row, delta) { return applyAreaDelta(row, delta, 'use') }
function formatNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function todayStr() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function submitUse() {
  if (!useForm.value.responsible) { ElMessage.warning('请选择责任人'); return }
  if (!useForm.value.period) { ElMessage.warning('请选择时间段'); return }
  const target = useAsset.value
  const available = rowAvailableArea(target)
  if (useForm.value.useStatus === '部分' + useMode.value && (!useForm.value.useArea || useForm.value.useArea <= 0)) {
    ElMessage.warning('请填写有效的' + useMode.value + '面积')
    return
  }
  const area = useForm.value.useStatus === '部分' + useMode.value ? useForm.value.useArea : available
  if (area <= 0) { ElMessage.warning('可用面积为 0，无法' + useMode.value); return }
  if (area > available + 0.01) { ElMessage.warning(useMode.value + '面积不能超过可用面积 ' + available + ' ㎡'); return }
  occData.value.unshift({
    id: Date.now(),
    no: `ZY2026${String(occData.value.length + 1).padStart(4, '0')}`,
    company: target.company,
    person: useForm.value.responsible,
    period: `${useForm.value.period[0]} 至 ${useForm.value.period[1]}（${area} ㎡）`,
    type: useMode.value,
    remark: useForm.value.remark || target.name,
    status: '正常',
    createTime: formatNow(),
    voidTime: ''
  })
  applyUseAreaToRow(target, area)
  useDialogVisible.value = false
  ElMessage.success(useMode.value === '自用' ? '新增自用成功' : '新增占用成功')
}

const addFormTarget = ref(null)
function addLeaseFrom(row) {
  if (row.children && row.children.length) {
    ElMessage.warning('该资产已拆分为子单元，请在子单元上添加租赁')
    return
  }
  const available = rowAvailableArea(row)
  if (available <= 0) { ElMessage.warning('该资产已无空余面积可出租'); return }
  addFormTarget.value = row
  // 行内入口：尝试按名称在真实资产库匹配并预选，保证合同挂到真实资产上；匹配不到则让用户在弹窗内选择
  const match = assetStore.assets.find(a => a.name === row.name || a.name.includes(row.name) || row.name.includes(a.name))
  addForm.value = {
    assetId: match?.id || '',
    assetName: match?.name || '',
    tenant: '',
    area: match ? contractStore.getLeaseSummary(match).availableArea : 0,
    monthlyRent: 0,
    startDate: todayStr(),
    endDate: '',
    remark: ''
  }
  addDialogVisible.value = true
}
function addRentFrom(row) {
  ElMessage.success(`已选择"${row.name}"，正在前往招商发布`)
  router.push({
    path: '/ent/investment-publish',
    query: { assetName: row.name, assetNo: row.assetNo, from: 'lease-mgmt' }
  })
}
function handleAssetMore(cmd, row) {
  if (cmd === 'use') openUseDialog(row, '自用')
  else if (cmd === 'occupy') openUseDialog(row, '占用')
  else if (cmd === 'lease') addLeaseFrom(row)
  else if (cmd === 'rent') addRentFrom(row)
}

const occFilters = ref({ person: '', company: '', status: '', type: '' })
const occPage = ref(1)
const occPageSize = ref(10)
const occData = ref([
  { id: 1, no: 'ZY20260001', company: '城投集团', person: '张伟', period: '2025-01-01 至 2026-12-31（1200 ㎡）', type: '自用', remark: '集团办公自用', status: '正常', createTime: '2025-01-01 09:00', voidTime: '' },
  { id: 2, no: 'ZY20260002', company: '产投集团', person: '李娜', period: '2025-03-01 至 2027-02-28（800 ㎡）', type: '占用', remark: '项目指挥部临时占用', status: '正常', createTime: '2025-03-01 10:20', voidTime: '' },
  { id: 3, no: 'ZY20260003', company: '水投集团', person: '王强', period: '2024-01-01 至 2024-12-31（500 ㎡）', type: '自用', remark: '水厂值班室', status: '已过期', createTime: '2024-01-01 08:30', voidTime: '' },
  { id: 4, no: 'ZY20260004', company: '领航公司', person: '刘敏', period: '2025-06-01 至 2026-05-31（300 ㎡）', type: '占用', remark: '仓储临时占用', status: '正常', createTime: '2025-06-01 14:10', voidTime: '' },
  { id: 5, no: 'ZY20260005', company: '城投集团', person: '陈杰', period: '2023-05-01 至 2024-04-30（1500 ㎡）', type: '占用', remark: '已腾退占用', status: '已过期', createTime: '2023-05-01 11:00', voidTime: '2024-05-06 09:00' }
])

const filteredOcc = computed(() => {
  return mineOnly(occData.value).filter(o => {
    if (occFilters.value.person && !o.person.includes(occFilters.value.person)) return false
    if (occFilters.value.company && o.company !== occFilters.value.company) return false
    if (occFilters.value.status && o.status !== occFilters.value.status) return false
    if (occFilters.value.type && o.type !== occFilters.value.type) return false
    return true
  })
})
const pagedOcc = computed(() => {
  const start = (occPage.value - 1) * occPageSize.value
  return filteredOcc.value.slice(start, start + occPageSize.value)
})
function resetOcc() { occFilters.value = { person: '', company: '', status: '', type: '' }; occPage.value = 1 }

const occDetailVisible = ref(false)
const currentOcc = ref(null)
function viewOcc(row) { currentOcc.value = row; occDetailVisible.value = true }
function voidOcc(row) {
  ElMessageBox.confirm(`确定作废占用记录"${row.no}"吗？`, '作废确认', { type: 'warning' }).then(() => {
    row.voidTime = formatNow()
    row.status = '已过期'
    ElMessage.success('已作废')
  }).catch(() => {})
}

const page = ref(1)
const pageSize = ref(15)
const filters = ref({ keyword: '', leaseStatus: '', assetType: '', project: '' })

// 项目筛选项来自项目 store（企业端已按集团过滤），不再写死
const projectOptions = computed(() => projectStore.visibleProjects.map(p => p.name))

// 合同行统一读合同库可见合同，项目 / 资产类型经项目·资产 store 解析
function contractLeaseStatus(c) {
  if (c.status === '退租' || c.status === '已终止') return '已退租'
  if (c.status === '临期') return '即将到期'
  const start = new Date(c.startDate)
  if (!isNaN(start.getTime()) && start > new Date()) return '待起租'
  return '在租'
}
function projectOf(contract) {
  const asset = assetStore.getAssetById(contract.assetId)
  const pid = asset?.projectId || contract.projectId
  const project = pid ? projectStore.getProjectById(pid) : null
  return project?.name || asset?.projectName || '—'
}

const leaseData = computed(() => contractStore.visibleContracts.map(c => {
  const asset = assetStore.getAssetById(c.assetId)
  return {
    id: c.id,
    contractNo: c.id,
    assetName: c.assetName,
    tenant: c.tenant,
    assetType: asset?.type || asset?.assetType || '',
    project: projectOf(c),
    area: c.leaseArea || asset?.area || 0,
    monthlyRent: Math.round((c.annualRent || 0) * 10000 / 12),
    startDate: c.startDate,
    endDate: c.endDate,
    status: contractLeaseStatus(c)
  }
}))

const getStatusType = (status) => {
  const map = { '在租': 'success', '已退租': 'info', '即将到期': 'warning', '待起租': 'warning' }
  return map[status] || 'info'
}

const filteredData = computed(() => {
  return leaseData.value.filter(item => {
    if (filters.value.keyword) {
      const kw = filters.value.keyword
      if (!item.assetName.includes(kw) && !item.contractNo.includes(kw) && !item.tenant.includes(kw)) return false
    }
    if (filters.value.leaseStatus && item.status !== filters.value.leaseStatus) return false
    if (filters.value.assetType && item.assetType !== filters.value.assetType) return false
    if (filters.value.project && item.project !== filters.value.project) return false
    return true
  })
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function getSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    if (col.property === 'area') {
      const total = data.reduce((sum, row) => sum + Number(row.area || 0), 0)
      sums[index] = total.toFixed(2)
    } else if (col.property === 'monthlyRent') {
      const total = data.reduce((sum, row) => sum + Number(row.monthlyRent || 0), 0)
      sums[index] = total.toLocaleString()
    } else {
      sums[index] = ''
    }
  })
  return sums
}

const detailVisible = ref(false)
const currentRow = ref(null)
function handleView(row) {
  currentRow.value = row
  detailVisible.value = true
}

const addDialogVisible = ref(false)
const addForm = ref({ assetId: '', assetName: '', tenant: '', area: 0, monthlyRent: 0, startDate: '', endDate: '', remark: '' })

// 可出租资产：从真实资产库取，按剩余可租面积过滤；企业端 visibleAssets 已按登录公司隔离
const leaseAssetOptions = computed(() =>
  assetStore.visibleAssets
    .map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      totalArea: a.area || 0,
      area: contractStore.getLeaseSummary(a).availableArea
    }))
    .filter(a => a.area > 0 && a.status !== '自用')
)
const pickedAddArea = computed(() => leaseAssetOptions.value.find(a => a.id === addForm.value.assetId)?.area ?? 0)

function handleAddAssetPick(id) {
  const opt = leaseAssetOptions.value.find(a => a.id === id)
  if (!opt) return
  addForm.value.assetName = opt.name
  addForm.value.area = opt.area
}

function handleAdd() {
  addFormTarget.value = null
  addForm.value = { assetId: '', assetName: '', tenant: '', area: 0, monthlyRent: 0, startDate: todayStr(), endDate: '', remark: '' }
  addDialogVisible.value = true
}
function handleAddSubmit() {
  if (!addForm.value.assetId) { ElMessage.warning('请选择租赁资产'); return }
  if (!addForm.value.tenant || !addForm.value.startDate || !addForm.value.endDate) {
    ElMessage.warning('请填写必填项')
    return
  }
  if (!addForm.value.area || addForm.value.area <= 0) { ElMessage.warning('请填写租赁面积'); return }
  if (!addForm.value.monthlyRent || addForm.value.monthlyRent <= 0) { ElMessage.warning('请填写月租金'); return }
  if (new Date(addForm.value.endDate) <= new Date(addForm.value.startDate)) { ElMessage.warning('到期日必须晚于起租日'); return }
  // 直接挂到所选真实资产上，保证合同 → 资产 → 项目/集团链贯通，签约后自动联动租赁状态与盘活流水
  const asset = assetStore.getAssetById(addForm.value.assetId)
  if (!asset) { ElMessage.warning('未找到所选资产，请重新选择'); return }
  const available = contractStore.getLeaseSummary(asset).availableArea
  if (addForm.value.area > available + 0.01) {
    ElMessage.warning(`租赁面积不能超过该资产可租面积 ${available} ㎡`); return
  }
  const annualRent = Math.round(addForm.value.monthlyRent * 12 / 10000 * 100) / 100
  contractStore.signContract({
    assetId: asset.id,
    assetName: asset.name,
    tenant: addForm.value.tenant,
    startDate: addForm.value.startDate,
    endDate: addForm.value.endDate,
    leaseArea: addForm.value.area,
    annualRent,
    status: '正常',
    arrears: 0,
    overdueDays: 0,
    electronic: false
  })
  if (addFormTarget.value) applyLeaseAreaToRow(addFormTarget.value, addForm.value.area)
  addDialogVisible.value = false
  addFormTarget.value = null
  mainTab.value = 'contract'
  page.value = 1
  ElMessage.success('新增租赁成功，合同已写入合同库并联动资产与盘活统计')
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function handleRenew(row) {
  ElMessageBox.prompt(`对"${row.assetName}"续租，请输入续租月数`, '续租', {
    inputPattern: /^[1-9]\d{0,2}$/,
    inputErrorMessage: '请输入 1-999 之间的整数月数',
    inputValue: '12',
    type: 'info'
  }).then(({ value }) => {
    const months = parseInt(value, 10)
    const newEnd = addMonths(row.endDate, months)
    // 通过合同库写入口更新对应合同记录，列表由 visibleContracts 计算属性自动刷新
    contractStore.updateContract(row.contractNo, { endDate: newEnd, status: '正常', overdueDays: 0 })
    ElMessage.success(`续租成功，已延长 ${months} 个月，新到期日：${newEnd}`)
  }).catch(() => {})
}
function handleTerminate(row) {
  ElMessageBox.prompt(`对"${row.assetName}"办理退租，请输入退租原因`, '退租确认', {
    inputPlaceholder: '例如：合同到期、承租方提前解约',
    inputValidator: (v) => (v && v.trim().length >= 2) || '请填写至少 2 个字的退租原因',
    type: 'warning'
  }).then(({ value }) => {
    const reason = value.trim()
    contractStore.updateContract(row.contractNo, { status: '退租', terminateReason: reason })
    ElMessage.success(`已退租：${reason}`)
  }).catch(() => {})
}
function handleStartLease(row) {
  ElMessageBox.confirm(`确认让合同"${row.contractNo}"立即起租？起租后合同进入在租状态，可继续续租或退租。`, '起租确认', { type: 'info' })
    .then(() => {
      contractStore.updateContract(row.contractNo, { startDate: todayStr(), status: '正常' })
      contractStore.syncAssetLeaseState(row.id, { action: '起租联动', billNo: row.contractNo })
      ElMessage.success('已起租，合同进入在租状态')
    }).catch(() => {})
}
function validateRentedSelection(action) {
  const invalid = assetSelection.value.filter(r => r.leaseStatus !== '已出租' && r.leaseStatus !== '部分出租')
  if (invalid.length) {
    ElMessage.warning(`选中的 ${assetSelection.value.length} 项中有 ${invalid.length} 项当前不是"已出租/部分出租"状态，无法${action}。请重新勾选。`)
    return false
  }
  return true
}
function handleRenewBatch() {
  if (!assetSelection.value.length) {
    ElMessage.warning('请先选择需要续租的资产')
    return
  }
  if (!validateRentedSelection('续租')) return
  ElMessageBox.prompt(`对选中的 ${assetSelection.value.length} 项资产批量续租，请输入续租月数`, '批量续租', {
    inputPattern: /^[1-9]\d{0,2}$/,
    inputErrorMessage: '请输入 1-999 之间的整数月数',
    inputValue: '12',
    type: 'info'
  }).then(({ value }) => {
    const months = parseInt(value, 10)
    assetSelection.value.forEach(row => {
      row.renewMonths = months
      if (row.endDate) row.endDate = addMonths(row.endDate, months)
      row.leaseStatus = '已出租'
    })
    ElMessage.success(`已为 ${assetSelection.value.length} 项资产续租 ${months} 个月`)
    assetSelection.value = []
  }).catch(() => {})
}
function handleTerminateBatch() {
  if (!assetSelection.value.length) {
    ElMessage.warning('请先选择需要退租的资产')
    return
  }
  if (!validateRentedSelection('退租')) return
  ElMessageBox.prompt(`对选中的 ${assetSelection.value.length} 项资产批量退租，请输入退租原因`, '批量退租确认', {
    inputPlaceholder: '例如：合同到期、承租方提前解约',
    inputValidator: (v) => (v && v.trim().length >= 2) || '请填写至少 2 个字的退租原因',
    type: 'warning'
  }).then(({ value }) => {
    const reason = value.trim()
    assetSelection.value.forEach(row => {
      row.leaseStatus = '未出租'
      row.assetStatus = '未使用'
      row.isLeased = '否'
      row.terminateReason = reason
    })
    ElMessage.success(`已退租 ${assetSelection.value.length} 项资产：${reason}`)
    assetSelection.value = []
  }).catch(() => {})
}
function handleSearch() { page.value = 1 }
function resetFilters() {
  filters.value = { keyword: '', leaseStatus: '', assetType: '', project: '' }
  page.value = 1
}
function handleExport() {
  const headers = ['合同编号', '资产名称', '承租方', '面积(㎡)', '月租金(元)', '起租日', '到期日', '状态']
  const rows = filteredData.value.map(item => [item.contractNo, item.assetName, item.tenant, item.area, item.monthlyRent, item.startDate, item.endDate, item.status])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `导出_租赁管理_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.category-tabs { margin-bottom: 12px; }
.table-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.selected-hint { font-size: 13px; color: var(--c-primary); }
.quick-filter { background: var(--bg-th); border: 1px solid var(--bd); border-radius: var(--r-sm); padding: 12px 12px 4px; margin-bottom: 12px; }
.expand-wrap { width: 100%; padding: 8px 8px 4px; }
:deep(.el-table__expanded-cell) { padding: 8px 12px; }
.area-hint { font-size: 12px; color: var(--t-weak); line-height: 1.6; margin-top: 4px; }
.child-table { width: 100%; background: var(--bg-th); }
.child-table :deep(.el-table__row) { background: var(--bg-th); }
/* 面积三色语义（出租=已租绿 / 自用=自用蓝 / 可用=闲置橙） */
.area-rented { color: var(--st-rented); }
.area-self { color: var(--st-self); }
.area-free { color: var(--c-warning); }
.area-sep { color: var(--t-weak); }
.area-unit { color: var(--t-weak); font-size: 12px; }
.hint-full { margin-left: 8px; color: var(--c-danger); font-size: 12px; }
.hint-split { margin-left: 8px; color: var(--t-weak); font-size: 12px; }
</style>
