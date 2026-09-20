<template>
  <div class="page-container">
    <div class="page-header">
      <h2>固定资产管理</h2>
      <div>
        <el-button type="primary" @click="openAssetDialog()" v-if="activeTab === 'asset'">
          <el-icon><Plus /></el-icon>
          新增资产
        </el-button>
        <el-button type="primary" @click="handleAddAsset" v-if="activeTab === 'inbound'">
          <el-icon><Plus /></el-icon>
          新增入库
        </el-button>
        <el-button type="primary" @click="handleDispatch" v-if="activeTab === 'dispatch'">
          <el-icon><Plus /></el-icon>
          新增派发
        </el-button>
        <el-button type="primary" @click="handleBorrow" v-if="activeTab === 'borrow'">
          <el-icon><Plus /></el-icon>
          新增借出
        </el-button>
        <el-button type="primary" @click="handleChange" v-if="activeTab === 'change'">
          <el-icon><Plus /></el-icon>
          新增变更
        </el-button>
        <el-button type="primary" @click="handleDispose" v-if="activeTab === 'dispose'">
          <el-icon><Plus /></el-icon>
          新增处置
        </el-button>
        <el-button type="primary" @click="handleCreatePlan" v-if="activeTab === 'inventory'">
          <el-icon><Plus /></el-icon>
          生成盘点计划
        </el-button>
        <el-button type="primary" @click="handleCreateScheme" v-if="activeTab === 'depreciation'">
          <el-icon><Plus /></el-icon>
          新增折旧方案
        </el-button>
      </div>
    </div>
    <el-card>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="固定资产" name="asset">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="assetSearch.keyword" placeholder="资产编号/资产名称" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item label="资产类型">
              <el-select v-model="assetSearch.type" placeholder="请选择" clearable style="width: 130px">
                <el-option v-for="t in assetTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item label="资产状态">
              <el-select v-model="assetSearch.status" placeholder="请选择" clearable style="width: 120px">
                <el-option v-for="s in assetStatusOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="assetPage = 1">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="resetAssetSearch">重置</el-button>
              <el-button type="primary" @click="openAssetDialog()">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </el-form-item>
          </el-form>

          <el-table :data="pagedAssetList" style="width: 100%">
            <el-table-column prop="code" label="资产编号" width="120" fixed>
              <template #default="{ row }">
                <el-link type="primary" :underline="false" @click="openAssetDrawer(row)">{{ row.code }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="资产名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="type" label="资产类型" width="100" />
            <el-table-column prop="brand" label="品牌" width="80" />
            <el-table-column prop="model" label="型号" width="110" show-overflow-tooltip />
            <el-table-column prop="location" label="存放地点" width="130" show-overflow-tooltip />
            <el-table-column prop="original" label="资产原值(元)" width="120" align="right">
              <template #default="{ row }">¥{{ row.original.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="net" label="资产净值(元)" width="120" align="right">
              <template #default="{ row }">¥{{ row.net.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="user" label="使用人员" width="90" />
            <el-table-column prop="dept" label="使用部门" width="100" />
            <el-table-column prop="purchaseDate" label="购(建)时间" width="110" />
            <el-table-column prop="status" label="资产状态" width="90">
              <template #default="{ row }">
                <el-tag :type="assetStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openAssetDialog(row)">修改</el-button>
                <el-button link type="primary" size="small" @click="downloadAssetQr(row)">下载二维码</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="assetPage"
              v-model:page-size="assetPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="assetTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <!-- 入库/验收 -->
        <el-tab-pane label="入库/验收" name="inbound">
          <el-tabs v-model="inboundSub" type="card" class="sub-tabs">
            <el-tab-pane label="入库单据" name="docs" />
            <el-tab-pane label="验收台账" name="ledger" />
          </el-tabs>

          <template v-if="inboundSub === 'docs'">
            <el-form :inline="true" class="search-form">
              <el-form-item label="单据编号">
                <el-input v-model="docLists.inbound.search.docNo" placeholder="请输入单据编号" clearable style="width: 160px" />
              </el-form-item>
              <el-form-item label="公司">
                <el-select v-model="docLists.inbound.search.company" placeholder="请选择公司" clearable style="width: 200px">
                  <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
              <el-form-item label="单据状态">
                <el-select v-model="docLists.inbound.search.status" placeholder="请选择状态" clearable style="width: 130px">
                  <el-option v-for="s in docStatusOptions" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="docLists.inbound.page = 1">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetDocSearch('inbound')">重置</el-button>
                <el-button type="primary" @click="openDocDialog('inbound')">
                  <el-icon><Plus /></el-icon>
                  新增单据
                </el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pagedDocs('inbound')" style="width: 100%">
              <el-table-column prop="docNo" label="单据编号" width="130">
                <template #default="{ row }">
                  <el-link type="primary" :underline="false" @click="viewDocApproval(row)">{{ row.docNo }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="company" label="所属公司" min-width="200" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="完结时间" width="160">
                <template #default="{ row }">{{ row.finishTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="单据状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="docStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDocApproval(row)">审批信息</el-button>
                  <el-button link type="primary" size="small" @click="openDocDialog('inbound', row)">修改</el-button>
                  <el-button link type="danger" size="small" @click="deleteDoc('inbound', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination
                v-model:current-page="docLists.inbound.page"
                v-model:page-size="docLists.inbound.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="docTotal('inbound')"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </template>

          <template v-else>
          <el-form :inline="true" :model="inboundSearch" class="search-form">
            <el-form-item label="资产名称">
              <el-input v-model="inboundSearch.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="资产分类">
              <el-select v-model="inboundSearch.category" placeholder="请选择" clearable style="width: 120px">
                <el-option label="办公用品" value="办公用品" />
                <el-option label="车辆" value="车辆" />
                <el-option label="设备" value="设备" />
                <el-option label="材料" value="材料" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="inboundSearch.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="待验收" value="待验收" />
                <el-option label="已验收" value="已验收" />
                <el-option label="已入库" value="已入库" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleInboundSearch">查询</el-button>
              <el-button @click="handleInboundReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="displayInboundList" style="width: 100%">
            <el-table-column prop="assetNo" label="资产编号" width="130" />
            <el-table-column prop="name" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="model" label="规格型号" width="120" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column prop="purchasePrice" label="采购单价" width="110">
              <template #default="{ row }">¥{{ row.purchasePrice.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="supplier" label="供应商" width="130" show-overflow-tooltip />
            <el-table-column prop="inboundDate" label="入库日期" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '已入库' ? 'success' : row.status === '已验收' ? 'primary' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewInbound(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="handleAcceptInbound(row)" v-if="row.status === '待验收'">验收</el-button>
                <el-button link type="primary" size="small" @click="handleStockIn(row)" v-if="row.status === '已验收'">入库</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="inboundPage"
              v-model:page-size="inboundPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="inboundTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
          </template>
        </el-tab-pane>

        <!-- 派发/退库 -->
        <el-tab-pane label="派发/退库" name="dispatch">
          <el-tabs v-model="dispatchSub" type="card" class="sub-tabs">
            <el-tab-pane label="分配" name="alloc" />
            <el-tab-pane label="退库" name="back" />
            <el-tab-pane label="派发台账" name="ledger" />
          </el-tabs>

          <template v-if="dispatchSub !== 'ledger'">
            <el-form :inline="true" class="search-form">
              <el-form-item label="单据编号">
                <el-input v-model="docLists[dispatchSub].search.docNo" placeholder="请输入单据编号" clearable style="width: 160px" />
              </el-form-item>
              <el-form-item label="公司">
                <el-select v-model="docLists[dispatchSub].search.company" placeholder="请选择公司" clearable style="width: 200px">
                  <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
              <el-form-item label="单据状态">
                <el-select v-model="docLists[dispatchSub].search.status" placeholder="请选择状态" clearable style="width: 130px">
                  <el-option v-for="s in docStatusOptions" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="docLists[dispatchSub].page = 1">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetDocSearch(dispatchSub)">重置</el-button>
                <el-button type="primary" @click="openDocDialog(dispatchSub)">
                  <el-icon><Plus /></el-icon>
                  新增单据
                </el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pagedDocs(dispatchSub)" style="width: 100%">
              <el-table-column prop="docNo" label="单据编号" width="130">
                <template #default="{ row }">
                  <el-link type="primary" :underline="false" @click="viewDocApproval(row)">{{ row.docNo }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="company" label="所属公司" min-width="200" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="完结时间" width="160">
                <template #default="{ row }">{{ row.finishTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="单据状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="docStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDocApproval(row)">审批信息</el-button>
                  <el-button link type="primary" size="small" @click="openDocDialog(dispatchSub, row)">修改</el-button>
                  <el-button link type="danger" size="small" @click="deleteDoc(dispatchSub, row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination
                v-model:current-page="docLists[dispatchSub].page"
                v-model:page-size="docLists[dispatchSub].pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="docTotal(dispatchSub)"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </template>

          <template v-else>
          <el-form :inline="true" :model="dispatchSearch" class="search-form">
            <el-form-item label="资产名称">
              <el-input v-model="dispatchSearch.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="使用部门">
              <el-input v-model="dispatchSearch.department" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="dispatchSearch.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="已派发" value="已派发" />
                <el-option label="已退库" value="已退库" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleDispatchSearch">查询</el-button>
              <el-button @click="handleDispatchReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="displayDispatchList" style="width: 100%">
            <el-table-column prop="dispatchNo" label="派发单号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="assetNo" label="资产编号" width="130" />
            <el-table-column prop="department" label="使用部门" width="120" />
            <el-table-column prop="user" label="使用人" width="100" />
            <el-table-column prop="dispatchDate" label="派发日期" width="110" />
            <el-table-column prop="location" label="存放位置" width="130" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '已派发' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewDispatch(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="handleReturn(row)" v-if="row.status === '已派发'">退库</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="dispatchPage"
              v-model:page-size="dispatchPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="dispatchTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
          </template>
        </el-tab-pane>

        <!-- 借出使用 -->
        <el-tab-pane label="借出使用" name="borrow">
          <el-form :inline="true" :model="borrowSearch" class="search-form">
            <el-form-item label="资产名称">
              <el-input v-model="borrowSearch.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="借用人">
              <el-input v-model="borrowSearch.borrower" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="borrowSearch.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="借出中" value="借出中" />
                <el-option label="已归还" value="已归还" />
                <el-option label="逾期" value="逾期" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleBorrowSearch">查询</el-button>
              <el-button @click="handleBorrowReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="displayBorrowList" style="width: 100%">
            <el-table-column prop="borrowNo" label="借出单号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="assetNo" label="资产编号" width="130" />
            <el-table-column prop="borrower" label="借用人" width="100" />
            <el-table-column prop="department" label="所属部门" width="120" />
            <el-table-column prop="borrowDate" label="借出日期" width="110" />
            <el-table-column prop="expectedReturnDate" label="预计归还" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '已归还' ? 'success' : row.status === '逾期' ? 'danger' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewBorrow(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="handleReturnBorrow(row)" v-if="row.status === '借出中' || row.status === '逾期'">归还</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="borrowPage"
              v-model:page-size="borrowPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="borrowTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <!-- 资产变更 -->
        <el-tab-pane label="资产变更" name="change">
          <el-form :inline="true" :model="changeSearch" class="search-form">
            <el-form-item label="资产名称">
              <el-input v-model="changeSearch.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="变更类型">
              <el-select v-model="changeSearch.changeType" placeholder="请选择" clearable style="width: 120px">
                <el-option label="调拨" value="调拨" />
                <el-option label="维修" value="维修" />
                <el-option label="升级" value="升级" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangeSearch">查询</el-button>
              <el-button @click="handleChangeReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="displayChangeList" style="width: 100%">
            <el-table-column prop="changeNo" label="变更单号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="assetNo" label="资产编号" width="130" />
            <el-table-column prop="changeType" label="变更类型" width="100" />
            <el-table-column prop="changeReason" label="变更原因" min-width="150" show-overflow-tooltip />
            <el-table-column prop="changeDate" label="变更日期" width="110" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewChange(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="changePage"
              v-model:page-size="changePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="changeTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <!-- 资产处置 -->
        <el-tab-pane label="资产处置" name="dispose">
          <el-tabs v-model="disposeSub" type="card" class="sub-tabs">
            <el-tab-pane label="调拨" name="transfer" />
            <el-tab-pane label="维修" name="repair" />
            <el-tab-pane label="处置" name="dispose" />
            <el-tab-pane label="处置台账" name="ledger" />
          </el-tabs>

          <template v-if="disposeSub !== 'ledger'">
            <el-form :inline="true" class="search-form">
              <el-form-item label="单据编号">
                <el-input v-model="docLists[disposeSub].search.docNo" placeholder="请输入单据编号" clearable style="width: 160px" />
              </el-form-item>
              <el-form-item label="公司">
                <el-select v-model="docLists[disposeSub].search.company" placeholder="请选择公司" clearable style="width: 200px">
                  <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
              <el-form-item label="单据状态">
                <el-select v-model="docLists[disposeSub].search.status" placeholder="请选择状态" clearable style="width: 130px">
                  <el-option v-for="s in docStatusOptions" :key="s" :label="s" :value="s" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="docLists[disposeSub].page = 1">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetDocSearch(disposeSub)">重置</el-button>
                <el-button type="primary" @click="openDocDialog(disposeSub)">
                  <el-icon><Plus /></el-icon>
                  新增单据
                </el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pagedDocs(disposeSub)" style="width: 100%">
              <el-table-column prop="docNo" label="单据编号" width="130">
                <template #default="{ row }">
                  <el-link type="primary" :underline="false" @click="viewDocApproval(row)">{{ row.docNo }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="company" label="所属公司" min-width="200" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="完结时间" width="160">
                <template #default="{ row }">{{ row.finishTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="160" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="单据状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="docStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="190" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewDocApproval(row)">审批信息</el-button>
                  <el-button link type="primary" size="small" @click="openDocDialog(disposeSub, row)">修改</el-button>
                  <el-button link type="danger" size="small" @click="deleteDoc(disposeSub, row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination
                v-model:current-page="docLists[disposeSub].page"
                v-model:page-size="docLists[disposeSub].pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="docTotal(disposeSub)"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </template>

          <template v-else>
          <el-form :inline="true" :model="disposeSearch" class="search-form">
            <el-form-item label="资产名称">
              <el-input v-model="disposeSearch.name" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="处置方式">
              <el-select v-model="disposeSearch.disposeType" placeholder="请选择" clearable style="width: 120px">
                <el-option label="报废" value="报废" />
                <el-option label="变卖" value="变卖" />
                <el-option label="捐赠" value="捐赠" />
                <el-option label="转让" value="转让" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleDisposeSearch">查询</el-button>
              <el-button @click="handleDisposeReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="displayDisposeList" style="width: 100%">
            <el-table-column prop="disposeNo" label="处置单号" width="130" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="assetNo" label="资产编号" width="130" />
            <el-table-column prop="disposeType" label="处置方式" width="100" />
            <el-table-column prop="disposeReason" label="处置原因" min-width="150" show-overflow-tooltip />
            <el-table-column prop="residualValue" label="残值" width="100">
              <template #default="{ row }">¥{{ row.residualValue.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="disposeDate" label="处置日期" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewDispose(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="disposePage"
              v-model:page-size="disposePageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="disposeTotal"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
          </template>
        </el-tab-pane>

        <!-- 资产盘点 -->
        <el-tab-pane label="资产盘点" name="inventory">
          <el-tabs v-model="inventorySub" type="card" class="sub-tabs">
            <el-tab-pane label="盘点单" name="docs" />
            <el-tab-pane label="盘点计划" name="plans" />
          </el-tabs>

          <template v-if="inventorySub === 'docs'">
            <el-form :inline="true" class="search-form">
              <el-form-item label="单据编号">
                <el-input v-model="invSearch.docNo" placeholder="请输入单据编号" clearable style="width: 160px" />
              </el-form-item>
              <el-form-item label="公司">
                <el-select v-model="invSearch.company" placeholder="请选择公司" clearable style="width: 200px">
                  <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
              <el-form-item label="盘点单状态">
                <el-select v-model="invSearch.status" placeholder="请选择状态" clearable style="width: 160px">
                  <el-option label="已完结" value="已完结" />
                  <el-option label="盘点中" value="盘点中" />
                  <el-option label="盘点报告审批中" value="盘点报告审批中" />
                </el-select>
              </el-form-item>
              <el-form-item label="创建时间">
                <el-date-picker
                  v-model="invSearch.createRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item label="完结时间">
                <el-date-picker
                  v-model="invSearch.finishRange"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="width: 240px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="invPage = 1">
                  <el-icon><Search /></el-icon>
                  查询
                </el-button>
                <el-button @click="resetInvSearch">重置</el-button>
                <el-button type="primary" @click="openWizard">
                  <el-icon><Plus /></el-icon>
                  新增盘点
                </el-button>
              </el-form-item>
            </el-form>

            <el-table :data="pagedInvDocs" style="width: 100%">
              <el-table-column prop="docNo" label="单据编号" width="130" fixed>
                <template #default="{ row }">
                  <el-link type="primary" :underline="false" @click="openCheckList(row)">{{ row.docNo }}</el-link>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="盘点名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="company" label="所属公司" min-width="180" show-overflow-tooltip />
              <el-table-column prop="createTime" label="创建时间" width="160" />
              <el-table-column label="完结时间" width="160">
                <template #default="{ row }">{{ row.finishTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="资产盘点进展" width="110" align="center">
                <template #default="{ row }">
                  <span class="frac-chip">{{ invItemDone(row) }}/{{ row.items.length }}</span>
                </template>
              </el-table-column>
              <el-table-column label="员工盘点进展" width="110" align="center">
                <template #default="{ row }">
                  <span class="frac-chip">{{ invEmpDone(row) }}/{{ row.counters.length }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="盘点单状态" width="140">
                <template #default="{ row }">
                  <el-tag :type="invStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="290" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openCheckList(row)">盘点清单</el-button>
                  <el-button link type="primary" size="small" @click="openCounters(row)">盘点员</el-button>
                  <el-button link type="primary" size="small" @click="viewDocApproval(row)">审批信息</el-button>
                  <el-button link type="primary" size="small" @click="openDocDialog('inventory', row)">修改</el-button>
                  <el-button link type="danger" size="small" @click="deleteInvDoc(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pager">
              <el-pagination
                v-model:current-page="invPage"
                v-model:page-size="invPageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="invTotal"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </template>

          <template v-else>
          <el-row :gutter="12" class="kpi-row">
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">盘点计划</div><div class="kpi-value">{{ inventoryPlans.length }}</div></div></el-col>
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">进行中</div><div class="kpi-value" style="color:#e6a23c">{{ inventoryStats.running }}</div></div></el-col>
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">应盘资产</div><div class="kpi-value">{{ inventoryStats.total }}</div></div></el-col>
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">已盘</div><div class="kpi-value" style="color:#67c23a">{{ inventoryStats.counted }}</div></div></el-col>
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">盘盈</div><div class="kpi-value" style="color:#409eff">{{ inventoryStats.profit }}</div></div></el-col>
            <el-col :span="4"><div class="kpi-card"><div class="kpi-label">盘亏</div><div class="kpi-value" style="color:#f56c6c">{{ inventoryStats.loss }}</div></div></el-col>
          </el-row>

          <el-table :data="inventoryPlans" style="width: 100%">
            <el-table-column prop="planNo" label="计划编号" width="130" />
            <el-table-column prop="planName" label="盘点计划" min-width="160" show-overflow-tooltip />
            <el-table-column prop="scope" label="盘点范围" width="130" />
            <el-table-column prop="counter" label="盘点人" width="90" />
            <el-table-column prop="planDate" label="盘点日期" width="110" />
            <el-table-column label="盘点进度" min-width="180">
              <template #default="{ row }">
                <el-progress :percentage="progressOf(row)" :status="progressOf(row) === 100 ? 'success' : ''" />
                <span class="progress-text">已盘 {{ row.items.filter(i => i.result === '已盘' || i.result === '盘亏').length }} / {{ row.items.length }}</span>
              </template>
            </el-table-column>
            <el-table-column label="盘盈/盘亏" width="110">
              <template #default="{ row }">
                <el-tag type="primary" size="small" effect="plain">盈 {{ row.items.filter(i => i.result === '盘盈').length }}</el-tag>
                <el-tag type="danger" size="small" effect="plain" style="margin-left:4px">亏 {{ row.items.filter(i => i.result === '盘亏').length }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="planStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="230" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" :disabled="row.status === '已完成'" @click="openInventory(row)">执行盘点</el-button>
                <el-button link type="primary" size="small" @click="exportInventory(row)">报表下载</el-button>
                <el-button v-if="row.status === '盘点中'" link type="success" size="small" @click="submitInventoryApproval(row)">提交审批</el-button>
                <el-button v-else-if="row.status === '待审批'" link type="warning" size="small" @click="approveInventory(row)">盘点审批</el-button>
                <el-button link type="danger" size="small" @click="deletePlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          </template>
        </el-tab-pane>

        <!-- 折旧管理 -->
        <el-tab-pane label="折旧管理" name="depreciation">
          <el-row :gutter="12" class="kpi-row">
            <el-col :span="6"><div class="kpi-card"><div class="kpi-label">资产原值合计</div><div class="kpi-value">¥{{ depreciationSummary.original.toLocaleString() }}</div></div></el-col>
            <el-col :span="6"><div class="kpi-card"><div class="kpi-label">累计折旧</div><div class="kpi-value" style="color:#e6a23c">¥{{ depreciationSummary.accumulated.toLocaleString() }}</div></div></el-col>
            <el-col :span="6"><div class="kpi-card"><div class="kpi-label">资产净值</div><div class="kpi-value" style="color:#67c23a">¥{{ depreciationSummary.net.toLocaleString() }}</div></div></el-col>
            <el-col :span="6"><div class="kpi-card"><div class="kpi-label">本月计提折旧</div><div class="kpi-value" style="color:#409eff">¥{{ depreciationSummary.monthly.toLocaleString() }}</div></div></el-col>
          </el-row>

          <div class="section-title">
            <span>折旧方案配置</span>
            <el-button type="success" plain size="small" @click="runDepreciation">计提本月折旧</el-button>
          </div>
          <el-table :data="depreciationSchemes" style="width: 100%">
            <el-table-column prop="schemeNo" label="方案编号" width="120" />
            <el-table-column prop="schemeName" label="方案名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="method" label="折旧方式" width="140" />
            <el-table-column prop="years" label="折旧年限" width="100">
              <template #default="{ row }">{{ row.years }} 年</template>
            </el-table-column>
            <el-table-column prop="residualRate" label="残值率" width="90">
              <template #default="{ row }">{{ row.residualRate }}%</template>
            </el-table-column>
            <el-table-column prop="monthlyRate" label="月折旧率" width="100">
              <template #default="{ row }">{{ row.monthlyRate }}%</template>
            </el-table-column>
            <el-table-column prop="applicableCategory" label="适用分类" width="120" />
            <el-table-column label="启用" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleScheme(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="130" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editScheme(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteScheme(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="section-title" style="margin-top:24px">
            <span>资产折旧台账</span>
            <el-button type="primary" plain size="small" @click="exportDepreciationLedger">导出台账</el-button>
          </div>
          <el-table :data="depreciationLedger" style="width: 100%">
            <el-table-column prop="assetNo" label="资产编号" width="120" />
            <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="department" label="使用部门" width="110" />
            <el-table-column prop="inboundDate" label="入库日期" width="110" />
            <el-table-column prop="original" label="资产原值" width="130">
              <template #default="{ row }">¥{{ row.original.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="schemeName" label="折旧方案" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">
                <el-tag v-if="row.schemeName === '未配置'" type="danger" size="small" effect="plain">未配置</el-tag>
                <span v-else>{{ row.schemeName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="months" label="已计提月数" width="100" />
            <el-table-column prop="monthly" label="月折旧额" width="120">
              <template #default="{ row }">¥{{ row.monthly.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="accumulated" label="累计折旧" width="130">
              <template #default="{ row }">¥{{ row.accumulated.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="net" label="资产净值" min-width="130">
              <template #default="{ row }">¥{{ row.net.toLocaleString() }}</template>
            </el-table-column>
          </el-table>

          <div class="section-title" style="margin-top:24px">
            <span>折旧计提报表</span>
            <el-button type="primary" plain size="small" @click="exportDepreciation">导出折旧报表</el-button>
          </div>
          <el-table :data="depreciationReports" style="width: 100%" show-summary :summary-method="depreciationSummaries">
            <el-table-column prop="period" label="折旧期间" width="120" />
            <el-table-column prop="openingValue" label="期初原值" width="140">
              <template #default="{ row }">¥{{ row.openingValue.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="periodDepreciation" label="本期折旧" width="140">
              <template #default="{ row }">¥{{ row.periodDepreciation.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="accumulated" label="累计折旧" width="140">
              <template #default="{ row }">¥{{ row.accumulated.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="closingNet" label="期末净值" width="140">
              <template #default="{ row }">¥{{ row.closingNet.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="assetCount" label="计提资产数" width="110" />
            <el-table-column prop="operator" label="计提人" width="100" />
            <el-table-column prop="runDate" label="计提日期" min-width="120" />
          </el-table>

          <div class="section-title" style="margin-top:24px"><span>分类折旧统计</span></div>
          <el-table :data="categoryDepreciation" style="width: 100%">
            <el-table-column prop="category" label="资产分类" width="140" />
            <el-table-column prop="count" label="资产数量" width="110" />
            <el-table-column prop="original" label="原值合计" width="160">
              <template #default="{ row }">¥{{ row.original.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="accumulated" label="累计折旧" width="160">
              <template #default="{ row }">¥{{ row.accumulated.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="net" label="净值" min-width="160">
              <template #default="{ row }">¥{{ row.net.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="折旧进度" min-width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.rate" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 入库详情对话框 -->
    <el-dialog v-model="inboundDetailVisible" title="入库详情" width="600px">
      <el-descriptions :column="2" border v-if="currentInbound">
        <el-descriptions-item label="资产编号">{{ currentInbound.assetNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentInbound.status === '已入库' ? 'success' : currentInbound.status === '已验收' ? 'primary' : 'warning'" size="small">{{ currentInbound.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentInbound.name }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentInbound.category }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ currentInbound.model }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentInbound.quantity }} {{ currentInbound.unit }}</el-descriptions-item>
        <el-descriptions-item label="采购单价">¥{{ currentInbound.purchasePrice?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="供应商" :span="2">{{ currentInbound.supplier }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ currentInbound.inboundDate }}</el-descriptions-item>
        <el-descriptions-item label="验收人">{{ currentInbound.acceptor || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="inboundDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 派发详情对话框 -->
    <el-dialog v-model="dispatchDetailVisible" title="派发详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDispatch">
        <el-descriptions-item label="派发单号">{{ currentDispatch.dispatchNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentDispatch.status === '已派发' ? 'success' : 'info'" size="small">{{ currentDispatch.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentDispatch.assetName }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentDispatch.assetNo }}</el-descriptions-item>
        <el-descriptions-item label="使用部门">{{ currentDispatch.department }}</el-descriptions-item>
        <el-descriptions-item label="使用人">{{ currentDispatch.user }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ currentDispatch.location }}</el-descriptions-item>
        <el-descriptions-item label="派发日期">{{ currentDispatch.dispatchDate }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentDispatch.operator }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dispatchDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 借出详情对话框 -->
    <el-dialog v-model="borrowDetailVisible" title="借出详情" width="600px">
      <el-descriptions :column="2" border v-if="currentBorrow">
        <el-descriptions-item label="借出单号">{{ currentBorrow.borrowNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentBorrow.status === '已归还' ? 'success' : currentBorrow.status === '逾期' ? 'danger' : 'warning'" size="small">{{ currentBorrow.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentBorrow.assetName }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentBorrow.assetNo }}</el-descriptions-item>
        <el-descriptions-item label="借用人">{{ currentBorrow.borrower }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ currentBorrow.department }}</el-descriptions-item>
        <el-descriptions-item label="借出日期">{{ currentBorrow.borrowDate }}</el-descriptions-item>
        <el-descriptions-item label="预计归还">{{ currentBorrow.expectedReturnDate }}</el-descriptions-item>
        <el-descriptions-item label="实际归还" :span="2">{{ currentBorrow.actualReturnDate || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="borrowDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 变更新增对话框 -->
    <el-dialog v-model="changeDialogVisible" title="新增资产变更" width="600px">
      <el-form :model="changeForm" label-width="100px">
        <el-form-item label="选择资产">
          <el-select v-model="changeForm.assetId" placeholder="请选择资产" style="width: 100%">
            <el-option v-for="item in assetOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更类型">
          <el-select v-model="changeForm.changeType" placeholder="请选择" style="width: 100%">
            <el-option label="调拨" value="调拨" />
            <el-option label="维修" value="维修" />
            <el-option label="升级" value="升级" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="changeForm.changeReason" type="textarea" :rows="3" placeholder="请输入变更原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 处置新增对话框 -->
    <el-dialog v-model="disposeDialogVisible" title="新增资产处置" width="600px">
      <el-form :model="disposeForm" label-width="100px">
        <el-form-item label="选择资产">
          <el-select v-model="disposeForm.assetId" placeholder="请选择资产" style="width: 100%">
            <el-option v-for="item in assetOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置方式">
          <el-select v-model="disposeForm.disposeType" placeholder="请选择" style="width: 100%">
            <el-option label="报废" value="报废" />
            <el-option label="变卖" value="变卖" />
            <el-option label="捐赠" value="捐赠" />
            <el-option label="转让" value="转让" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置原因">
          <el-input v-model="disposeForm.disposeReason" type="textarea" :rows="3" placeholder="请输入处置原因" />
        </el-form-item>
        <el-form-item label="残值">
          <el-input-number v-model="disposeForm.residualValue" :min="0" style="width: 100%" />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="disposeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDisposeSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增入库对话框 -->
    <el-dialog v-model="addAssetDialogVisible" title="新增入库" width="600px">
      <el-form :model="addAssetForm" label-width="100px">
        <el-form-item label="资产名称" required>
          <el-input v-model="addAssetForm.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="资产分类" required>
          <el-select v-model="addAssetForm.category" placeholder="请选择" style="width: 100%">
            <el-option label="办公用品" value="办公用品" />
            <el-option label="车辆" value="车辆" />
            <el-option label="设备" value="设备" />
            <el-option label="材料" value="材料" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="addAssetForm.model" placeholder="请输入规格型号" />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number v-model="addAssetForm.quantity" :min="1" style="width: 180px" />
          <el-select v-model="addAssetForm.unit" style="width: 100px; margin-left: 10px">
            <el-option label="台" value="台" />
            <el-option label="张" value="张" />
            <el-option label="辆" value="辆" />
            <el-option label="包" value="包" />
            <el-option label="件" value="件" />
            <el-option label="套" value="套" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购单价" required>
          <el-input-number v-model="addAssetForm.purchasePrice" :min="0" :precision="2" style="width: 100%">
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="供应商" required>
          <el-input v-model="addAssetForm.supplier" placeholder="请输入供应商" />
        </el-form-item>
        <el-form-item label="入库日期" required>
          <el-date-picker v-model="addAssetForm.inboundDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addAssetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAddAssetSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增派发对话框 -->
    <el-dialog v-model="dispatchDialogVisible" title="新增派发" width="600px">
      <el-form :model="dispatchForm" label-width="100px">
        <el-form-item label="选择资产" required>
          <el-select v-model="dispatchForm.assetNo" placeholder="请选择资产" style="width: 100%" @change="onDispatchAssetChange">
            <el-option v-for="item in dispatchableAssets" :key="item.assetNo" :label="`${item.name} (${item.assetNo})`" :value="item.assetNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用部门" required>
          <el-select v-model="dispatchForm.department" placeholder="请选择部门" style="width: 100%">
            <el-option label="财务部" value="财务部" />
            <el-option label="行政部" value="行政部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="办公室" value="办公室" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用人" required>
          <el-input v-model="dispatchForm.user" placeholder="请输入使用人" />
        </el-form-item>
        <el-form-item label="存放位置" required>
          <el-input v-model="dispatchForm.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="派发日期" required>
          <el-date-picker v-model="dispatchForm.dispatchDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDispatchSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 新增借出对话框 -->
    <el-dialog v-model="borrowDialogVisible" title="新增借出" width="600px">
      <el-form :model="borrowForm" label-width="100px">
        <el-form-item label="选择资产" required>
          <el-select v-model="borrowForm.assetNo" placeholder="请选择资产" style="width: 100%" @change="onBorrowAssetChange">
            <el-option v-for="item in borrowableAssets" :key="item.assetNo" :label="`${item.name} (${item.assetNo})`" :value="item.assetNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="借用人" required>
          <el-input v-model="borrowForm.borrower" placeholder="请输入借用人" />
        </el-form-item>
        <el-form-item label="所属部门" required>
          <el-select v-model="borrowForm.department" placeholder="请选择部门" style="width: 100%">
            <el-option label="财务部" value="财务部" />
            <el-option label="行政部" value="行政部" />
            <el-option label="人事部" value="人事部" />
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="办公室" value="办公室" />
          </el-select>
        </el-form-item>
        <el-form-item label="借出日期" required>
          <el-date-picker v-model="borrowForm.borrowDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计归还" required>
          <el-date-picker v-model="borrowForm.expectedReturnDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBorrowSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 变更详情对话框 -->
    <el-dialog v-model="changeDetailVisible" title="变更详情" width="600px">
      <el-descriptions :column="2" border v-if="currentChange">
        <el-descriptions-item label="变更单号">{{ currentChange.changeNo }}</el-descriptions-item>
        <el-descriptions-item label="变更类型">{{ currentChange.changeType }}</el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentChange.assetName }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentChange.assetNo }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentChange.operator }}</el-descriptions-item>
        <el-descriptions-item label="变更原因" :span="2">{{ currentChange.changeReason }}</el-descriptions-item>
        <el-descriptions-item label="变更日期">{{ currentChange.changeDate }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="changeDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 处置详情对话框 -->
    <el-dialog v-model="disposeDetailVisible" title="处置详情" width="600px">
      <el-descriptions :column="2" border v-if="currentDispose">
        <el-descriptions-item label="处置单号">{{ currentDispose.disposeNo }}</el-descriptions-item>
        <el-descriptions-item label="处置方式">{{ currentDispose.disposeType }}</el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentDispose.assetName }}</el-descriptions-item>
        <el-descriptions-item label="资产编号">{{ currentDispose.assetNo }}</el-descriptions-item>
        <el-descriptions-item label="残值">¥{{ currentDispose.residualValue?.toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="处置原因" :span="2">{{ currentDispose.disposeReason }}</el-descriptions-item>
        <el-descriptions-item label="处置日期">{{ currentDispose.disposeDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentDispose.status === '已完成' ? 'success' : 'warning'" size="small">{{ currentDispose.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="disposeDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 生成盘点计划对话框 -->
    <el-dialog v-model="planDialogVisible" title="生成盘点计划" width="560px">
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="计划名称" required>
          <el-input v-model="planForm.planName" placeholder="如：2026年三季度固定资产盘点" />
        </el-form-item>
        <el-form-item label="盘点范围" required>
          <el-radio-group v-model="planForm.scopeType">
            <el-radio value="全部">全部资产</el-radio>
            <el-radio value="分类">按分类</el-radio>
            <el-radio value="部门">按使用部门</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资产分类" v-if="planForm.scopeType === '分类'">
          <el-select v-model="planForm.scopeValue" placeholder="请选择分类" style="width:100%">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用部门" v-if="planForm.scopeType === '部门'">
          <el-select v-model="planForm.scopeValue" placeholder="请选择部门" style="width:100%">
            <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点人" required>
          <el-select v-model="planForm.counter" placeholder="请选择盘点人" style="width:100%">
            <el-option v-for="u in counterOptions" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点日期" required>
          <el-date-picker v-model="planForm.planDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="盘点方式">
          <el-checkbox-group v-model="planForm.methods">
            <el-checkbox value="小程序扫码">小程序扫码</el-checkbox>
            <el-checkbox value="PC手动">PC手动</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="预计应盘">
          <span class="plan-hint">{{ planPreviewCount }} 项资产将纳入本次盘点计划</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPlan">生成计划并推送工单</el-button>
      </template>
    </el-dialog>

    <!-- 执行盘点抽屉 -->
    <el-drawer v-model="inventoryDrawerVisible" title="执行盘点" size="60%">
      <template v-if="currentPlan">
        <el-descriptions :column="3" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="计划编号">{{ currentPlan.planNo }}</el-descriptions-item>
          <el-descriptions-item label="盘点人">{{ currentPlan.counter }}</el-descriptions-item>
          <el-descriptions-item label="盘点日期">{{ currentPlan.planDate }}</el-descriptions-item>
          <el-descriptions-item label="盘点范围" :span="2">{{ currentPlan.scope }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">{{ progressOf(currentPlan) }}%</el-descriptions-item>
        </el-descriptions>

        <div class="inventory-toolbar">
          <el-button type="primary" size="small" @click="batchScanCount">一键扫码盘点（未盘）</el-button>
          <el-button type="warning" size="small" @click="addProfitItem">登记盘盈资产</el-button>
          <el-tag type="info" effect="plain">已盘 {{ countedOf(currentPlan) }} / {{ currentPlan.items.length }}</el-tag>
        </div>

        <el-table :data="currentPlan.items" style="width:100%" max-height="460">
          <el-table-column prop="assetNo" label="资产编号" width="120" />
          <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="department" label="使用部门" width="110" />
          <el-table-column prop="location" label="存放位置" min-width="130" show-overflow-tooltip />
          <el-table-column prop="user" label="使用人" width="90" />
          <el-table-column label="盘点结果" width="100">
            <template #default="{ row }">
              <el-tag :type="resultType(row.result)" size="small">{{ row.result }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="countMethod" label="盘点方式" width="110">
            <template #default="{ row }">{{ row.countMethod || '-' }}</template>
          </el-table-column>
          <el-table-column prop="countTime" label="盘点时间" width="150">
            <template #default="{ row }">{{ row.countTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="scanCount(row)">扫码盘点</el-button>
              <el-button link type="primary" size="small" @click="pcCount(row)">PC盘点</el-button>
              <el-button link type="danger" size="small" @click="markLoss(row)">盘亏</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="inventoryDrawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 折旧方案对话框 -->
    <el-dialog v-model="schemeDialogVisible" :title="schemeForm.schemeNo ? '编辑折旧方案' : '新增折旧方案'" width="520px">
      <el-form :model="schemeForm" label-width="100px">
        <el-form-item label="方案名称" required>
          <el-input v-model="schemeForm.schemeName" placeholder="如：电子设备年限平均法" />
        </el-form-item>
        <el-form-item label="折旧方式" required>
          <el-select v-model="schemeForm.method" style="width:100%">
            <el-option label="年限平均法" value="年限平均法" />
            <el-option label="工作量法" value="工作量法" />
            <el-option label="双倍余额递减法" value="双倍余额递减法" />
            <el-option label="年数总和法" value="年数总和法" />
          </el-select>
        </el-form-item>
        <el-form-item label="折旧年限" required>
          <el-input-number v-model="schemeForm.years" :min="1" :max="50" /> 年
        </el-form-item>
        <el-form-item label="残值率" required>
          <el-input-number v-model="schemeForm.residualRate" :min="0" :max="30" :precision="1" :step="0.5" /> %
        </el-form-item>
        <el-form-item label="适用分类" required>
          <el-select v-model="schemeForm.applicableCategory" style="width:100%">
            <el-option label="全部分类" value="全部分类" />
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="月折旧率">
          <span class="plan-hint">{{ computedMonthlyRate }}%（按年限平均法自动测算）</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="schemeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitScheme">保存方案</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assetDialogVisible" :title="assetEditId ? '修改资产' : '新增资产'" width="960px" top="6vh">
      <el-form :model="assetForm" label-width="120px">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="资产名称" required>
              <el-input v-model="assetForm.name" maxlength="50" show-word-limit placeholder="请输入资产名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="资产类型" required>
              <el-select v-model="assetForm.type" placeholder="请选择资产类型" style="width:100%">
                <el-option v-for="t in assetTypeOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="资产编号">
              <el-input v-model="assetForm.code" maxlength="50" show-word-limit placeholder="不填则自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="租赁/购买公司">
              <el-select v-model="assetForm.company" placeholder="请选择公司" style="width:100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="品牌">
              <el-input v-model="assetForm.brand" maxlength="50" show-word-limit placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="型号">
              <el-input v-model="assetForm.model" maxlength="50" show-word-limit placeholder="请输入型号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="存放地点">
              <div class="inline-select">
                <el-select v-model="assetForm.location" placeholder="请选择存放地点" style="flex:1">
                  <el-option v-for="l in locationOptions" :key="l" :label="l" :value="l" />
                </el-select>
                <el-button type="primary" plain @click="addLocationOption">新增</el-button>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="购置/起租时间">
              <el-date-picker v-model="assetForm.purchaseDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="购置金额(含税)">
              <el-input-number v-model="assetForm.amount" :min="0" :precision="2" :controls="false" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="入库时间">
              <el-date-picker v-model="assetForm.inboundDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="资产图片">
              <el-upload v-model:file-list="assetForm.images" list-type="picture-card" :auto-upload="false" :limit="4">
                <div class="upload-tile">
                  <el-icon><Picture /></el-icon>
                  <span>上传图片</span>
                </div>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="section-title"><span>折旧信息</span></div>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="是否折旧">
              <el-switch v-model="assetForm.depreciate" />
            </el-form-item>
          </el-col>
          <template v-if="assetForm.depreciate">
            <el-col :span="8">
              <el-form-item label="原值">
                <el-input-number v-model="assetForm.original" :min="0" :precision="2" :controls="false" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="购置方式">
                <el-select v-model="assetForm.purchaseMode" placeholder="请选择购置方式" style="width:100%">
                  <el-option v-for="m in purchaseModeOptions" :key="m" :label="m" :value="m" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="租赁使用期限(月)">
                <el-input-number v-model="assetForm.leaseMonths" :min="1" :max="600" style="width:100%" />
              </el-form-item>
            </el-col>
          </template>
        </el-row>
        <el-row :gutter="16" v-if="!assetEditId">
          <el-col :span="8">
            <el-form-item label="新增数量">
              <el-input-number v-model="assetForm.quantity" :min="1" :max="99" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="assetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssetDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="assetDrawerVisible" size="60%" :with-header="false">
      <template v-if="currentAsset">
        <div class="drawer-head">
          <el-button link type="primary" @click="assetDrawerVisible = false">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <span class="drawer-title">{{ currentAsset.name }}</span>
          <el-tag :type="assetStatusType(currentAsset.status)" size="small">{{ currentAsset.status }}</el-tag>
        </div>
        <div class="drawer-sub">最后更新时间：{{ currentAsset.updateTime }}</div>
        <div class="qr-box">
          <canvas ref="qrCanvas" width="120" height="120"></canvas>
          <span>资产二维码</span>
        </div>
        <div class="section-title"><span>基础信息</span></div>
        <div class="detail-grid">
          <div class="cell"><div class="label">资产编号</div><div class="value hl">{{ currentAsset.code }}</div></div>
          <div class="cell"><div class="label">资产名称</div><div class="value">{{ currentAsset.name }}</div></div>
          <div class="cell"><div class="label">资产类型</div><div class="value">{{ currentAsset.type }}</div></div>
          <div class="cell"><div class="label">品牌</div><div class="value">{{ currentAsset.brand || '-' }}</div></div>
          <div class="cell"><div class="label">型号</div><div class="value">{{ currentAsset.model || '-' }}</div></div>
          <div class="cell"><div class="label">租赁/购买公司</div><div class="value">{{ currentAsset.company }}</div></div>
          <div class="cell"><div class="label">存放地点</div><div class="value">{{ currentAsset.location }}</div></div>
          <div class="cell"><div class="label">使用人员</div><div class="value">{{ currentAsset.user || '-' }}</div></div>
          <div class="cell"><div class="label">使用部门</div><div class="value">{{ currentAsset.dept || '-' }}</div></div>
          <div class="cell"><div class="label">购(建)时间</div><div class="value">{{ currentAsset.purchaseDate }}</div></div>
          <div class="cell"><div class="label">入库时间</div><div class="value">{{ currentAsset.inboundDate }}</div></div>
          <div class="cell"><div class="label">购置金额(含税)</div><div class="value hl">¥{{ currentAsset.amount.toLocaleString() }}</div></div>
          <div class="cell"><div class="label">资产原值(元)</div><div class="value">¥{{ currentAsset.original.toLocaleString() }}</div></div>
          <div class="cell"><div class="label">资产净值(元)</div><div class="value hl">¥{{ currentAsset.net.toLocaleString() }}</div></div>
          <div class="cell"><div class="label">是否折旧</div><div class="value">{{ currentAsset.depreciate ? '是' : '否' }}</div></div>
          <div class="cell"><div class="label">购置方式</div><div class="value">{{ currentAsset.purchaseMode }}</div></div>
          <div class="cell"><div class="label">租赁使用期限(月)</div><div class="value">{{ currentAsset.leaseMonths }}</div></div>
          <div class="cell"><div class="label">资产状态</div><div class="value">{{ currentAsset.status }}</div></div>
        </div>
        <div class="section-title"><span>操作记录</span></div>
        <el-tabs v-model="assetRecordTab">
          <el-tab-pane label="盘点记录" name="check">
            <el-table :data="assetRecordData.check" size="small" style="width:100%">
              <el-table-column prop="docNo" label="盘点单号" width="140" />
              <el-table-column prop="result" label="盘点结果" width="110" />
              <el-table-column prop="person" label="盘点人" width="100" />
              <el-table-column prop="time" label="盘点时间" min-width="160" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="派发退库" name="dispatch">
            <el-table :data="assetRecordData.dispatch" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="kind" label="类型" width="90" />
              <el-table-column prop="person" label="领用/退库人" width="110" />
              <el-table-column prop="dept" label="部门" width="110" />
              <el-table-column prop="time" label="时间" min-width="160" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="借出使用" name="borrow">
            <el-table :data="assetRecordData.borrow" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="borrower" label="借用人" width="100" />
              <el-table-column prop="borrowTime" label="借出时间" width="120" />
              <el-table-column prop="returnTime" label="归还时间" width="120" />
              <el-table-column prop="status" label="状态" min-width="90" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="资产维修" name="repair">
            <el-table :data="assetRecordData.repair" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="fault" label="故障描述" min-width="150" show-overflow-tooltip />
              <el-table-column prop="vendor" label="维修商" width="120" />
              <el-table-column prop="cost" label="维修费用(元)" width="110" />
              <el-table-column prop="status" label="状态" width="90" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="资产调拨" name="transfer">
            <el-table :data="assetRecordData.transfer" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="from" label="调出公司" min-width="170" show-overflow-tooltip />
              <el-table-column prop="to" label="调入公司" min-width="170" show-overflow-tooltip />
              <el-table-column prop="time" label="调拨时间" width="160" />
              <el-table-column prop="status" label="状态" width="90" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="资产变更" name="change">
            <el-table :data="assetRecordData.change" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="content" label="变更内容" min-width="200" show-overflow-tooltip />
              <el-table-column prop="person" label="操作人" width="100" />
              <el-table-column prop="time" label="变更时间" width="120" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="资产处置" name="dispose">
            <el-table :data="assetRecordData.dispose" size="small" style="width:100%">
              <el-table-column prop="docNo" label="单据编号" width="140" />
              <el-table-column prop="mode" label="处置方式" width="100" />
              <el-table-column prop="amount" label="处置金额(元)" width="120" />
              <el-table-column prop="time" label="处置时间" width="120" />
              <el-table-column prop="status" label="状态" min-width="90" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <el-dialog v-model="docDialogVisible" :title="docDialogTitle" width="520px">
      <el-form :model="docForm" label-width="90px">
        <el-form-item label="单据名称">
          <el-input v-model="docForm.name" maxlength="50" show-word-limit placeholder="请输入单据名称" />
        </el-form-item>
        <el-form-item label="所属公司" required>
          <el-select v-model="docForm.company" placeholder="请选择公司" style="width:100%">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="docForm.remark" type="textarea" :rows="3" maxlength="250" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="docDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDocDialog">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approvalVisible" title="审批信息" width="560px">
      <template v-if="approvalDoc">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="单据编号">{{ approvalDoc.docNo }}</el-descriptions-item>
          <el-descriptions-item label="所属公司">{{ approvalDoc.company }}</el-descriptions-item>
          <el-descriptions-item label="单据状态">
            <el-tag :type="docStatusType(approvalDoc.status)" size="small">{{ approvalDoc.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ approvalDoc.createTime }}</el-descriptions-item>
        </el-descriptions>
        <el-timeline>
          <el-timeline-item
            v-for="(r, i) in approvalRecords"
            :key="i"
            :timestamp="r.time || '待处理'"
            :type="r.result === '通过' || r.result === '已提交' ? 'success' : r.result === '驳回' ? 'danger' : r.result === '已撤销' ? 'info' : 'primary'"
          >
            <div class="approval-node">{{ r.node }}</div>
            <div class="approval-meta">{{ r.person }} · {{ r.result || '待审批' }}</div>
          </el-timeline-item>
        </el-timeline>
      </template>
      <template #footer>
        <el-button @click="approvalVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="wizardVisible" title="新增盘点" width="760px" top="6vh">
      <el-steps :active="wizardStep" align-center finish-status="success" style="margin-bottom:24px">
        <el-step title="基础信息" />
        <el-step title="任务分配" />
        <el-step title="开始盘点" />
      </el-steps>
      <el-form v-show="wizardStep === 0" :model="wizardForm" label-width="100px">
        <el-form-item label="所属公司" required>
          <el-select v-model="wizardForm.company" placeholder="请选择公司" style="width:100%">
            <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人" required>
          <el-input v-model="wizardForm.applicant" placeholder="请输入申请人" style="width:100%" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="wizardForm.name" maxlength="50" show-word-limit placeholder="请输入盘点名称" />
        </el-form-item>
        <el-form-item label="盘点范围">
          <el-radio-group v-model="wizardForm.scope">
            <el-radio value="全部资产">全部资产</el-radio>
            <el-radio value="按资产类型">按资产类型</el-radio>
            <el-radio value="按存放地点">按存放地点</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="资产类型">
          <el-select v-model="wizardForm.assetTypes" multiple placeholder="请选择资产类型" style="width:100%">
            <el-option v-for="t in assetTypeOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
      </el-form>
      <div v-show="wizardStep === 1">
        <div class="section-title"><span>任务分配 - 选择盘点员</span></div>
        <el-checkbox-group v-model="wizardForm.counterIds" class="counter-group">
          <el-checkbox v-for="e in empPool" :key="e.name" :value="e.name" border>{{ e.name }}（{{ e.dept }}）</el-checkbox>
        </el-checkbox-group>
        <div class="plan-hint">已选 {{ wizardForm.counterIds.length }} 名盘点员，提交后盘点任务将推送到员工端</div>
      </div>
      <div v-show="wizardStep === 2">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="所属公司">{{ wizardForm.company || '-' }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ wizardForm.applicant || '-' }}</el-descriptions-item>
          <el-descriptions-item label="盘点名称">{{ wizardForm.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="盘点范围">{{ wizardForm.scope }}</el-descriptions-item>
          <el-descriptions-item label="资产类型">{{ wizardForm.assetTypes.length ? wizardForm.assetTypes.join('、') : '全部' }}</el-descriptions-item>
          <el-descriptions-item label="盘点员">{{ wizardForm.counterIds.length ? wizardForm.counterIds.join('、') : '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-width="110px" style="margin-top:16px">
          <el-form-item label="盘点开始日期" required>
            <el-date-picker v-model="wizardForm.startDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width:100%" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="wizardVisible = false">取消</el-button>
        <el-button v-if="wizardStep > 0" @click="wizardStep--">上一步</el-button>
        <el-button v-if="wizardStep < 2" type="primary" @click="wizardNext">下一步</el-button>
        <el-button v-else type="primary" @click="submitWizard">开始盘点</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkListVisible" :title="checkListDoc ? `盘点清单 - ${checkListDoc.docNo}` : '盘点清单'" width="1100px" top="5vh">
      <div class="checklist-bar">
        <el-button @click="checkListVisible = false">
          <el-icon><ArrowLeft /></el-icon>
          返回计划列表
        </el-button>
        <div class="chip-row" style="margin-bottom:0">
          <span class="chip-label">盘点状态</span>
          <span
            v-for="k in checkFilterKeys"
            :key="k"
            class="chip"
            :class="{ on: checkFilter === k }"
            @click="checkFilter = k"
          >{{ k }}({{ checkCounts[k] }})</span>
        </div>
      </div>
      <el-table :data="filteredCheckItems" max-height="480" style="width:100%">
        <el-table-column label="资产信息" align="center">
          <el-table-column prop="assetNo" label="资产编号" width="120" />
          <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="assetStatus" label="资产状态" width="90" />
          <el-table-column prop="location" label="设备所在位置" width="130" show-overflow-tooltip />
        </el-table-column>
        <el-table-column label="盘点单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="itemStatusType(row.itemStatus)" size="small">{{ row.itemStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="盘点备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="盘点人员" width="90">
          <template #default="{ row }">{{ row.checker || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="盘点时间" width="160">
          <template #default="{ row }">{{ row.checkTime || '-' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="checkListVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="counterVisible" :title="counterDoc ? `盘点员 - ${counterDoc.docNo}` : '盘点员'" width="700px">
      <el-table :data="counterDoc ? counterDoc.counters : []" size="small" style="width:100%">
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="dept" label="部门" width="120" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="盘点进度" width="100" align="center">
          <template #default="{ row }">
            <span class="frac-chip">{{ row.done }}/{{ row.assigned }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : 'primary'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="counterVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, ArrowLeft, Picture } from '@element-plus/icons-vue'
import QRCode from 'qrcode'

const activeTab = ref('asset')
const inboundSub = ref('docs')
const dispatchSub = ref('alloc')
const disposeSub = ref('transfer')
const inventorySub = ref('docs')

const companyOptions = ['华信科技集团有限公司', '云鼎资产管理有限公司', '恒信融资租赁有限公司', '中天建设集团有限公司']
const assetTypeOptions = ['电子设备', '机械设备', '运输设备', '办公家具', '房屋建筑物', '其他设备']
const purchaseModeOptions = ['购买', '租赁', '自建', '受赠']
const assetStatusOptions = ['空闲', '派发中', '借出中', '维修中', '处置中']
const docStatusOptions = ['已撤销', '待提交', '已完结', '进行中', '已驳回']

// 入库/验收
const inboundSearch = reactive({ name: '', category: '', status: '' })
watch(inboundSearch, () => { inboundPage.value = 1 }, { deep: true })

const inboundList = ref([
  { assetNo: 'ZC2026001', name: '联想ThinkPad笔记本电脑', category: '设备', model: 'ThinkPad T14', quantity: 10, unit: '台', purchasePrice: 8500, supplier: '联想官方授权经销商', inboundDate: '2026-09-01', status: '已入库', acceptor: '张三' },
  { assetNo: 'ZC2026002', name: '惠普打印机', category: '设备', model: 'HP M428fdw', quantity: 5, unit: '台', purchasePrice: 3200, supplier: '惠普官方旗舰店', inboundDate: '2026-09-05', status: '已验收', acceptor: '李四' },
  { assetNo: 'ZC2026003', name: '办公桌', category: '办公用品', model: '1.4m实木', quantity: 20, unit: '张', purchasePrice: 1200, supplier: '宜家家居', inboundDate: '2026-09-08', status: '待验收', acceptor: '' },
  { assetNo: 'ZC2026004', name: '丰田凯美瑞轿车', category: '车辆', model: '2026款2.5G', quantity: 2, unit: '辆', purchasePrice: 180000, supplier: '广汽丰田4S店', inboundDate: '2026-08-20', status: '已入库', acceptor: '王五' },
  { assetNo: 'ZC2026005', name: 'A4复印纸', category: '材料', model: '70g 500张/包', quantity: 100, unit: '包', purchasePrice: 25, supplier: '得力办公', inboundDate: '2026-09-10', status: '待验收', acceptor: '' },
  { assetNo: 'ZC2024006', name: '会议室投影仪', category: '设备', model: 'Epson CB-X06', quantity: 3, unit: '台', purchasePrice: 6800, supplier: '爱普生授权经销商', inboundDate: '2024-03-15', status: '已入库', acceptor: '张三' },
  { assetNo: 'ZC2024008', name: '中央空调机组', category: '设备', model: '格力GMV-560', quantity: 2, unit: '台', purchasePrice: 85000, supplier: '格力商用空调', inboundDate: '2024-06-20', status: '已入库', acceptor: '王五' },
  { assetNo: 'ZC2025007', name: '别克GL8商务车', category: '车辆', model: '2025款2.0T', quantity: 1, unit: '辆', purchasePrice: 320000, supplier: '上汽通用别克4S店', inboundDate: '2025-01-10', status: '已入库', acceptor: '李四' }
])

const filteredInboundList = computed(() => {
  return inboundList.value.filter(item => {
    const nameMatch = !inboundSearch.name || item.name.includes(inboundSearch.name)
    const categoryMatch = !inboundSearch.category || item.category === inboundSearch.category
    const statusMatch = !inboundSearch.status || item.status === inboundSearch.status
    return nameMatch && categoryMatch && statusMatch
  })
})

const displayInboundList = computed(() => {
  const start = (inboundPage.value - 1) * inboundPageSize.value
  return filteredInboundList.value.slice(start, start + inboundPageSize.value)
})

const inboundPage = ref(1)
const inboundPageSize = ref(10)
const inboundTotal = computed(() => filteredInboundList.value.length)

// 派发/退库
const dispatchSearch = reactive({ name: '', department: '', status: '' })
watch(dispatchSearch, () => { dispatchPage.value = 1 }, { deep: true })

const dispatchList = ref([
  { dispatchNo: 'PF2026001', assetName: '联想ThinkPad笔记本电脑', assetNo: 'ZC2026001', department: '财务部', user: '赵会计', dispatchDate: '2026-09-02', location: '财务部办公室', status: '已派发', operator: '张三' },
  { dispatchNo: 'PF2026002', assetName: '惠普打印机', assetNo: 'ZC2026002', department: '行政部', user: '钱助理', dispatchDate: '2026-09-06', location: '行政部打印区', status: '已派发', operator: '李四' },
  { dispatchNo: 'PF2026003', assetName: '办公桌', assetNo: 'ZC2026003', department: '人事部', user: '孙主管', dispatchDate: '2026-08-15', location: '人事部办公室', status: '已退库', operator: '王五' }
])

const filteredDispatchList = computed(() => {
  return dispatchList.value.filter(item => {
    const nameMatch = !dispatchSearch.name || item.assetName.includes(dispatchSearch.name)
    const deptMatch = !dispatchSearch.department || item.department.includes(dispatchSearch.department)
    const statusMatch = !dispatchSearch.status || item.status === dispatchSearch.status
    return nameMatch && deptMatch && statusMatch
  })
})

const displayDispatchList = computed(() => {
  const start = (dispatchPage.value - 1) * dispatchPageSize.value
  return filteredDispatchList.value.slice(start, start + dispatchPageSize.value)
})

const dispatchPage = ref(1)
const dispatchPageSize = ref(10)
const dispatchTotal = computed(() => filteredDispatchList.value.length)

// 借出使用
const borrowSearch = reactive({ name: '', borrower: '', status: '' })
watch(borrowSearch, () => { borrowPage.value = 1 }, { deep: true })

const borrowList = ref([
  { borrowNo: 'JC2026001', assetName: '联想ThinkPad笔记本电脑', assetNo: 'ZC2026001', borrower: '周经理', department: '市场部', borrowDate: '2026-09-10', expectedReturnDate: '2026-09-20', actualReturnDate: '', status: '借出中' },
  { borrowNo: 'JC2026002', assetName: '丰田凯美瑞轿车', assetNo: 'ZC2026004', borrower: '吴主任', department: '办公室', borrowDate: '2026-08-25', expectedReturnDate: '2026-09-05', actualReturnDate: '', status: '逾期' },
  { borrowNo: 'JC2026003', assetName: '惠普打印机', assetNo: 'ZC2026002', borrower: '郑员工', department: '技术部', borrowDate: '2026-09-01', expectedReturnDate: '2026-09-10', actualReturnDate: '2026-09-09', status: '已归还' }
])

const filteredBorrowList = computed(() => {
  return borrowList.value.filter(item => {
    const nameMatch = !borrowSearch.name || item.assetName.includes(borrowSearch.name)
    const borrowerMatch = !borrowSearch.borrower || item.borrower.includes(borrowSearch.borrower)
    const statusMatch = !borrowSearch.status || item.status === borrowSearch.status
    return nameMatch && borrowerMatch && statusMatch
  })
})

const displayBorrowList = computed(() => {
  const start = (borrowPage.value - 1) * borrowPageSize.value
  return filteredBorrowList.value.slice(start, start + borrowPageSize.value)
})

const borrowPage = ref(1)
const borrowPageSize = ref(10)
const borrowTotal = computed(() => filteredBorrowList.value.length)

// 资产变更
const changeSearch = reactive({ name: '', changeType: '' })
watch(changeSearch, () => { changePage.value = 1 }, { deep: true })

const changeList = ref([
  { changeNo: 'BG2026001', assetName: '联想ThinkPad笔记本电脑', assetNo: 'ZC2026001', changeType: '调拨', changeReason: '从技术部调拨至市场部', changeDate: '2026-09-12', operator: '张三' },
  { changeNo: 'BG2026002', assetName: '惠普打印机', assetNo: 'ZC2026002', changeType: '维修', changeReason: '打印机卡纸故障，送修', changeDate: '2026-09-08', operator: '李四' }
])

const filteredChangeList = computed(() => {
  return changeList.value.filter(item => {
    const nameMatch = !changeSearch.name || item.assetName.includes(changeSearch.name)
    const typeMatch = !changeSearch.changeType || item.changeType === changeSearch.changeType
    return nameMatch && typeMatch
  })
})

const displayChangeList = computed(() => {
  const start = (changePage.value - 1) * changePageSize.value
  return filteredChangeList.value.slice(start, start + changePageSize.value)
})

const changePage = ref(1)
const changePageSize = ref(10)
const changeTotal = computed(() => filteredChangeList.value.length)

// 资产处置
const disposeSearch = reactive({ name: '', disposeType: '' })
watch(disposeSearch, () => { disposePage.value = 1 }, { deep: true })

const disposeList = ref([
  { disposeNo: 'CZ2026001', assetName: '旧款联想台式机', assetNo: 'ZC2024010', disposeType: '报废', disposeReason: '使用超过5年，性能落后', residualValue: 500, disposeDate: '2026-08-20', status: '已完成' },
  { disposeNo: 'CZ2026002', assetName: '旧办公桌', assetNo: 'ZC2023005', disposeType: '变卖', disposeReason: '办公区改造，旧家具处理', residualValue: 200, disposeDate: '2026-09-01', status: '已完成' }
])

const filteredDisposeList = computed(() => {
  return disposeList.value.filter(item => {
    const nameMatch = !disposeSearch.name || item.assetName.includes(disposeSearch.name)
    const typeMatch = !disposeSearch.disposeType || item.disposeType === disposeSearch.disposeType
    return nameMatch && typeMatch
  })
})

const displayDisposeList = computed(() => {
  const start = (disposePage.value - 1) * disposePageSize.value
  return filteredDisposeList.value.slice(start, start + disposePageSize.value)
})

const disposePage = ref(1)
const disposePageSize = ref(10)
const disposeTotal = computed(() => filteredDisposeList.value.length)

// 对话框
const inboundDetailVisible = ref(false)
const currentInbound = ref(null)
const dispatchDetailVisible = ref(false)
const currentDispatch = ref(null)
const borrowDetailVisible = ref(false)
const currentBorrow = ref(null)
const changeDialogVisible = ref(false)
const disposeDialogVisible = ref(false)
const addAssetDialogVisible = ref(false)
const dispatchDialogVisible = ref(false)
const borrowDialogVisible = ref(false)
const changeDetailVisible = ref(false)
const disposeDetailVisible = ref(false)

const currentChange = ref(null)
const currentDispose = ref(null)

const addAssetForm = reactive({ name: '', category: '', model: '', quantity: 1, unit: '台', purchasePrice: 0, supplier: '', inboundDate: '' })
const dispatchForm = reactive({ assetNo: '', assetName: '', department: '', user: '', location: '', dispatchDate: '' })
const borrowForm = reactive({ assetNo: '', assetName: '', borrower: '', department: '', borrowDate: '', expectedReturnDate: '' })

const dispatchableAssets = computed(() => {
  return inboundList.value.filter(i => i.status === '已入库')
})

const borrowableAssets = computed(() => {
  return inboundList.value.filter(i => i.status === '已入库' || i.status === '已验收')
})

function onDispatchAssetChange(assetNo) {
  const asset = inboundList.value.find(i => i.assetNo === assetNo)
  dispatchForm.assetName = asset ? asset.name : ''
}

function onBorrowAssetChange(assetNo) {
  const asset = inboundList.value.find(i => i.assetNo === assetNo)
  borrowForm.assetName = asset ? asset.name : ''
}

const changeForm = reactive({ assetId: '', changeType: '', changeReason: '' })
const disposeForm = reactive({ assetId: '', disposeType: '', disposeReason: '', residualValue: 0 })

const assetOptions = ref(inboundList.value.map(a => ({ code: a.assetNo, name: a.name })))

// 操作函数
const handleInboundSearch = () => { inboundPage.value = 1 }
const handleInboundReset = () => {
  inboundSearch.name = ''
  inboundSearch.category = ''
  inboundSearch.status = ''
  inboundPage.value = 1
}

const handleDispatchSearch = () => { dispatchPage.value = 1 }
const handleDispatchReset = () => {
  dispatchSearch.name = ''
  dispatchSearch.department = ''
  dispatchSearch.status = ''
  dispatchPage.value = 1
}

const handleBorrowSearch = () => { borrowPage.value = 1 }
const handleBorrowReset = () => {
  borrowSearch.name = ''
  borrowSearch.borrower = ''
  borrowSearch.status = ''
  borrowPage.value = 1
}

const handleChangeSearch = () => { changePage.value = 1 }
const handleChangeReset = () => {
  changeSearch.name = ''
  changeSearch.changeType = ''
  changePage.value = 1
}

const handleDisposeSearch = () => { disposePage.value = 1 }
const handleDisposeReset = () => {
  disposeSearch.name = ''
  disposeSearch.disposeType = ''
  disposePage.value = 1
}

const handleAddAsset = () => {
  Object.assign(addAssetForm, { name: '', category: '', model: '', quantity: 1, unit: '台', purchasePrice: 0, supplier: '', inboundDate: '' })
  addAssetDialogVisible.value = true
}

const handleDispatch = () => {
  Object.assign(dispatchForm, { assetNo: '', assetName: '', department: '', user: '', location: '', dispatchDate: '' })
  dispatchDialogVisible.value = true
}

const handleBorrow = () => {
  Object.assign(borrowForm, { assetNo: '', assetName: '', borrower: '', department: '', borrowDate: '', expectedReturnDate: '' })
  borrowDialogVisible.value = true
}

const handleChange = () => {
  Object.assign(changeForm, { assetId: '', changeType: '', changeReason: '' })
  changeDialogVisible.value = true
}

const handleDispose = () => {
  Object.assign(disposeForm, { assetId: '', disposeType: '', disposeReason: '', residualValue: 0 })
  disposeDialogVisible.value = true
}

const handleViewInbound = (row) => {
  currentInbound.value = row
  inboundDetailVisible.value = true
}

const handleAcceptInbound = (row) => {
  ElMessageBox.confirm(`确定要验收"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已验收'
    row.acceptor = '管理员'
    ElMessage.success('验收成功')
  }).catch(() => {})
}

const handleStockIn = (row) => {
  ElMessageBox.confirm(`确定要将"${row.name}"入库吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已入库'
    ElMessage.success('入库成功')
  }).catch(() => {})
}

const handleViewDispatch = (row) => {
  currentDispatch.value = row
  dispatchDetailVisible.value = true
}

const handleReturn = (row) => {
  ElMessageBox.confirm(`确定要退库"${row.assetName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    row.status = '已退库'
    ElMessage.success('退库成功')
  }).catch(() => {})
}

const handleViewBorrow = (row) => {
  currentBorrow.value = row
  borrowDetailVisible.value = true
}

const handleReturnBorrow = (row) => {
  ElMessageBox.confirm(`确定要归还"${row.assetName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已归还'
    row.actualReturnDate = new Date().toISOString().slice(0, 10)
    ElMessage.success('归还成功')
  }).catch(() => {})
}

const handleViewChange = (row) => {
  currentChange.value = row
  changeDetailVisible.value = true
}

const handleViewDispose = (row) => {
  currentDispose.value = row
  disposeDetailVisible.value = true
}

const handleChangeSubmit = () => {
  if (!changeForm.assetId || !changeForm.changeType || !changeForm.changeReason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const asset = assetOptions.value.find(a => a.code === changeForm.assetId)
  const newChange = {
    changeNo: 'BG2026' + String(changeList.value.length + 1).padStart(3, '0'),
    assetName: asset ? asset.name : changeForm.assetId,
    assetNo: changeForm.assetId,
    changeType: changeForm.changeType,
    changeReason: changeForm.changeReason,
    changeDate: new Date().toISOString().slice(0, 10),
    operator: '管理员'
  }
  changeList.value.unshift(newChange)
  changeDialogVisible.value = false
  ElMessage.success('变更成功')
  Object.assign(changeForm, { assetId: '', changeType: '', changeReason: '' })
}

const handleDisposeSubmit = () => {
  if (!disposeForm.assetId || !disposeForm.disposeType || !disposeForm.disposeReason) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const asset = assetOptions.value.find(a => a.code === disposeForm.assetId)
  const newDispose = {
    disposeNo: 'CZ2026' + String(disposeList.value.length + 1).padStart(3, '0'),
    assetName: asset ? asset.name : disposeForm.assetId,
    assetNo: disposeForm.assetId,
    disposeType: disposeForm.disposeType,
    disposeReason: disposeForm.disposeReason,
    residualValue: disposeForm.residualValue,
    disposeDate: new Date().toISOString().slice(0, 10),
    status: '已完成'
  }
  disposeList.value.unshift(newDispose)
  disposeDialogVisible.value = false
  ElMessage.success('处置成功')
  Object.assign(disposeForm, { assetId: '', disposeType: '', disposeReason: '', residualValue: 0 })
}

const handleAddAssetSubmit = () => {
  if (!addAssetForm.name || !addAssetForm.category || !addAssetForm.supplier || !addAssetForm.inboundDate) {
    ElMessage.warning('请填写完整入库信息')
    return
  }
  const newNo = 'ZC2026' + String(inboundList.value.length + 1).padStart(3, '0')
  inboundList.value.unshift({
    assetNo: newNo,
    name: addAssetForm.name,
    category: addAssetForm.category,
    model: addAssetForm.model,
    quantity: addAssetForm.quantity,
    unit: addAssetForm.unit,
    purchasePrice: addAssetForm.purchasePrice,
    supplier: addAssetForm.supplier,
    inboundDate: addAssetForm.inboundDate,
    status: '待验收',
    acceptor: ''
  })
  assetOptions.value.push({ code: newNo, name: addAssetForm.name })
  addAssetDialogVisible.value = false
  ElMessage.success('入库登记成功，等待验收')
}

const handleDispatchSubmit = () => {
  if (!dispatchForm.assetNo || !dispatchForm.department || !dispatchForm.user || !dispatchForm.location || !dispatchForm.dispatchDate) {
    ElMessage.warning('请填写完整派发信息')
    return
  }
  const newNo = 'PF2026' + String(dispatchList.value.length + 1).padStart(3, '0')
  dispatchList.value.unshift({
    dispatchNo: newNo,
    assetName: dispatchForm.assetName,
    assetNo: dispatchForm.assetNo,
    department: dispatchForm.department,
    user: dispatchForm.user,
    dispatchDate: dispatchForm.dispatchDate,
    location: dispatchForm.location,
    status: '已派发',
    operator: '管理员'
  })
  dispatchDialogVisible.value = false
  ElMessage.success('派发成功')
}

const handleBorrowSubmit = () => {
  if (!borrowForm.assetNo || !borrowForm.borrower || !borrowForm.department || !borrowForm.borrowDate || !borrowForm.expectedReturnDate) {
    ElMessage.warning('请填写完整借出信息')
    return
  }
  const newNo = 'JC2026' + String(borrowList.value.length + 1).padStart(3, '0')
  borrowList.value.unshift({
    borrowNo: newNo,
    assetName: borrowForm.assetName,
    assetNo: borrowForm.assetNo,
    borrower: borrowForm.borrower,
    department: borrowForm.department,
    borrowDate: borrowForm.borrowDate,
    expectedReturnDate: borrowForm.expectedReturnDate,
    actualReturnDate: '',
    status: '借出中'
  })
  borrowDialogVisible.value = false
  ElMessage.success('借出登记成功')
}

// ==================== 固定资产台账（盘点/折旧共用数据源） ====================
const assetLedger = computed(() => inboundList.value.map(a => {
  const d = dispatchList.value.find(x => x.assetNo === a.assetNo)
  return {
    assetNo: a.assetNo,
    assetName: a.name,
    category: a.category,
    department: d ? d.department : '行政部',
    location: d ? d.location : '公司仓库',
    user: d ? d.user : '未派发',
    quantity: a.quantity,
    unit: a.unit,
    original: a.purchasePrice * a.quantity,
    inboundDate: a.inboundDate
  }
}))

const categoryOptions = ['办公用品', '车辆', '设备', '材料', '其他']
const counterOptions = ['张三', '李四', '王五', '赵会计', '钱助理', '孙主管']
const departmentOptions = computed(() => [...new Set(assetLedger.value.map(a => a.department))])

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false })
}

function downloadCsv(filename, header, rows) {
  const content = '\ufeff' + header.join(',') + '\n' + rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ==================== 资产盘点 ====================
function buildPlanItems(scopeType, scopeValue) {
  return assetLedger.value
    .filter(a => scopeType === '全部' || (scopeType === '分类' ? a.category === scopeValue : a.department === scopeValue))
    .map(a => ({
      assetNo: a.assetNo,
      assetName: a.assetName,
      category: a.category,
      department: a.department,
      location: a.location,
      user: a.user,
      bookQty: a.quantity,
      result: '未盘',
      countMethod: '',
      countTime: '',
      remark: ''
    }))
}

function scopeLabel(scopeType, scopeValue) {
  if (scopeType === '全部') return '全部资产'
  return `${scopeType}：${scopeValue}`
}

const inventoryPlans = ref((() => {
  const doneItems = buildPlanItems('全部', '')
  doneItems.forEach((it, i) => {
    it.countMethod = '小程序扫码'
    it.countTime = `2026-06-25 ${String(9 + Math.floor(i / 3)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`
    if (i === 3) {
      it.result = '盘亏'
      it.countMethod = '现场核查'
      it.remark = '现场未找到实物，待核销处置'
    } else {
      it.result = '已盘'
    }
  })
  const runningItems = buildPlanItems('分类', '设备')
  runningItems[0].result = '已盘'
  runningItems[0].countMethod = '小程序扫码'
  runningItems[0].countTime = '2026-09-16 10:20:00'
  return [
    { planNo: 'PD-2026-002', planName: '2026年三季度设备类专项盘点', scope: scopeLabel('分类', '设备'), counter: '李四', planDate: '2026-09-18', status: '盘点中', items: runningItems },
    { planNo: 'PD-2026-001', planName: '2026年二季度固定资产全面盘点', scope: scopeLabel('全部', ''), counter: '张三', planDate: '2026-06-25', status: '已完成', items: doneItems }
  ]
})())

function countedOf(plan) {
  return plan.items.filter(i => i.result === '已盘' || i.result === '盘亏').length
}

function progressOf(plan) {
  if (!plan || !plan.items.length) return 0
  return Math.round(countedOf(plan) / plan.items.length * 100)
}

const inventoryStats = computed(() => {
  const items = inventoryPlans.value.flatMap(p => p.items)
  return {
    running: inventoryPlans.value.filter(p => p.status === '盘点中' || p.status === '待审批').length,
    total: items.length,
    counted: items.filter(i => i.result === '已盘' || i.result === '盘亏').length,
    profit: items.filter(i => i.result === '盘盈').length,
    loss: items.filter(i => i.result === '盘亏').length
  }
})

function planStatusType(status) {
  return { 已完成: 'success', 盘点中: 'warning', 待审批: 'primary' }[status] || 'info'
}

function resultType(result) {
  return { 已盘: 'success', 盘亏: 'danger', 盘盈: 'primary' }[result] || 'info'
}

const planDialogVisible = ref(false)
const planForm = reactive({ planName: '', scopeType: '全部', scopeValue: '', counter: '', planDate: '', methods: ['小程序扫码'] })

const planPreviewCount = computed(() => {
  return assetLedger.value.filter(a =>
    planForm.scopeType === '全部' ||
    (planForm.scopeType === '分类' ? a.category === planForm.scopeValue : a.department === planForm.scopeValue)
  ).length
})

function handleCreatePlan() {
  inventorySub.value = 'plans'
  Object.assign(planForm, { planName: '', scopeType: '全部', scopeValue: '', counter: '', planDate: '', methods: ['小程序扫码'] })
  planDialogVisible.value = true
}

function submitPlan() {
  if (!planForm.planName || !planForm.counter || !planForm.planDate) {
    ElMessage.warning('请填写计划名称、盘点人与盘点日期')
    return
  }
  if (planForm.scopeType !== '全部' && !planForm.scopeValue) {
    ElMessage.warning('请选择盘点范围')
    return
  }
  if (!planForm.methods.length) {
    ElMessage.warning('请至少选择一种盘点方式')
    return
  }
  const items = buildPlanItems(planForm.scopeType, planForm.scopeValue)
  if (!items.length) {
    ElMessage.warning('所选范围内没有可盘点的资产')
    return
  }
  inventoryPlans.value.unshift({
    planNo: `PD-${new Date().getFullYear()}-${String(inventoryPlans.value.length + 1).padStart(3, '0')}`,
    planName: planForm.planName,
    scope: scopeLabel(planForm.scopeType, planForm.scopeValue),
    counter: planForm.counter,
    planDate: planForm.planDate,
    status: '盘点中',
    items
  })
  planDialogVisible.value = false
  ElMessage.success(`盘点计划已生成，${items.length} 项资产工单已推送给 ${planForm.counter}`)
}

const inventoryDrawerVisible = ref(false)
const currentPlan = ref(null)

function openInventory(row) {
  currentPlan.value = row
  inventoryDrawerVisible.value = true
}

function applyCount(row, method, result) {
  row.result = result
  row.countMethod = method
  row.countTime = nowText()
}

function scanCount(row) {
  applyCount(row, '小程序扫码', '已盘')
  ElMessage.success(`${row.assetName} 扫码盘点成功`)
}

function pcCount(row) {
  applyCount(row, 'PC手动', '已盘')
  ElMessage.success(`${row.assetName} 已登记盘点`)
}

function markLoss(row) {
  ElMessageBox.prompt('请说明盘亏原因（现场未找到、遗失、报废未销账等）', `标记盘亏 - ${row.assetName}`, {
    inputPlaceholder: '如：现场未找到实物',
    inputValidator: v => (v && v.trim() ? true : '盘亏原因不能为空')
  }).then(({ value }) => {
    applyCount(row, '现场核查', '盘亏')
    row.remark = value
    ElMessage.warning(`${row.assetName} 已标记盘亏，审批通过后将转入资产处置`)
  }).catch(() => {})
}

function batchScanCount() {
  const pending = currentPlan.value.items.filter(i => i.result === '未盘')
  if (!pending.length) {
    ElMessage.info('没有待盘点的资产')
    return
  }
  pending.forEach(i => applyCount(i, '小程序扫码', '已盘'))
  ElMessage.success(`批量扫码盘点完成，本次盘到 ${pending.length} 项资产`)
}

function addProfitItem() {
  ElMessageBox.prompt('请填写账外资产名称（盘盈登记）', '登记盘盈资产', {
    inputPlaceholder: '如：闲置会议桌',
    inputValidator: v => (v && v.trim() ? true : '资产名称不能为空')
  }).then(({ value }) => {
    currentPlan.value.items.unshift({
      assetNo: `PY-${Date.now().toString().slice(-6)}`,
      assetName: value,
      category: '其他',
      department: currentPlan.value.counter + '（现场发现）',
      location: '待确认',
      user: '待确认',
      bookQty: 0,
      result: '盘盈',
      countMethod: '小程序扫码',
      countTime: nowText(),
      remark: '账外资产，需补办入库'
    })
    ElMessage.success('盘盈资产已登记，审批通过后需补办入库手续')
  }).catch(() => {})
}

function exportInventory(row) {
  downloadCsv(
    `${row.planNo}_盘点报表.csv`,
    ['计划编号', '资产编号', '资产名称', '分类', '使用部门', '存放位置', '使用人', '账面数量', '盘点结果', '盘点方式', '盘点时间', '备注'],
    row.items.map(i => [row.planNo, i.assetNo, i.assetName, i.category, i.department, i.location, i.user, i.bookQty, i.result, i.countMethod, i.countTime, i.remark])
  )
  ElMessage.success(`盘点报表 ${row.planNo} 已导出`)
}

function submitInventoryApproval(row) {
  const unfinished = row.items.length - countedOf(row)
  if (unfinished > 0) {
    ElMessage.warning(`还有 ${unfinished} 项资产未盘点，无法提交审批`)
    return
  }
  const loss = row.items.filter(i => i.result === '盘亏').length
  const profit = row.items.filter(i => i.result === '盘盈').length
  ElMessageBox.confirm(
    `盘点已完成，共 ${row.items.length} 项：盘亏 ${loss} 项、盘盈 ${profit} 项。确认提交盘点结果审批？`,
    '提交审批',
    { type: 'info' }
  ).then(() => {
    row.status = '待审批'
    ElMessage.success('盘点结果已提交审批')
  }).catch(() => {})
}

function approveInventory(row) {
  ElMessageBox.confirm(`确认通过盘点计划"${row.planName}"的盘点结果？盘亏资产将转入资产处置。`, '盘点审批', {
    distinguishCancelAndClose: true,
    confirmButtonText: '审批通过',
    cancelButtonText: '驳回',
    type: 'warning'
  }).then(() => {
    row.status = '已完成'
    const losses = row.items.filter(i => i.result === '盘亏')
    losses.forEach((item, idx) => {
      disposeList.value.unshift({
        disposeNo: `CZ2026${String(disposeList.value.length + idx + 1).padStart(3, '0')}`,
        assetName: item.assetName,
        assetNo: item.assetNo,
        disposeType: '报废',
        disposeReason: `盘点盘亏核销：${item.remark || '现场未找到实物'}`,
        residualValue: 0,
        disposeDate: new Date().toISOString().slice(0, 10),
        status: '待处置'
      })
    })
    ElMessage.success(losses.length ? `盘点已完成，${losses.length} 项盘亏资产已转入资产处置` : '盘点已完成')
  }).catch(action => {
    if (action !== 'cancel') return
    ElMessageBox.prompt('请填写驳回意见', '盘点审批驳回', {
      inputValidator: v => (v && v.trim() ? true : '驳回意见不能为空')
    }).then(({ value }) => {
      row.status = '盘点中'
      row.items.forEach(i => {
        if (i.result === '盘亏' || i.result === '盘盈') {
          i.result = '未盘'
          i.countMethod = ''
          i.countTime = ''
          i.remark = `审批驳回：${value}`
        }
      })
      ElMessage.warning('审批已驳回，盘盈盘亏项已重置为未盘，请重新核查')
    }).catch(() => {})
  })
}

function deletePlan(row) {
  ElMessageBox.confirm(`确认删除盘点计划"${row.planName}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = inventoryPlans.value.findIndex(p => p.planNo === row.planNo)
    if (idx > -1) inventoryPlans.value.splice(idx, 1)
    ElMessage.success('盘点计划已删除')
  }).catch(() => {})
}

// ==================== 折旧管理 ====================
const depreciationSchemes = ref([
  { schemeNo: 'ZJ-001', schemeName: '电子设备年限平均法', method: '年限平均法', years: 3, residualRate: 5, monthlyRate: 2.6389, applicableCategory: '设备', enabled: true },
  { schemeNo: 'ZJ-002', schemeName: '运输工具年限平均法', method: '年限平均法', years: 5, residualRate: 5, monthlyRate: 1.5833, applicableCategory: '车辆', enabled: true },
  { schemeNo: 'ZJ-003', schemeName: '办公家具年限平均法', method: '年限平均法', years: 5, residualRate: 5, monthlyRate: 1.5833, applicableCategory: '办公用品', enabled: true },
  { schemeNo: 'ZJ-004', schemeName: '低值易耗品一次摊销', method: '年限平均法', years: 1, residualRate: 0, monthlyRate: 8.3333, applicableCategory: '材料', enabled: false }
])

function schemeFor(category) {
  return depreciationSchemes.value.find(s => s.enabled && (s.applicableCategory === category || s.applicableCategory === '全部分类')) || null
}

const depreciationLedger = computed(() => assetLedger.value.map(a => {
  const s = schemeFor(a.category)
  const cap = s ? a.original * (1 - s.residualRate / 100) : 0
  const monthly = s ? cap / (s.years * 12) : 0
  const months = monthsSince(a.inboundDate, currentPeriod())
  const accumulated = Math.min(Math.round(monthly * months * 100) / 100, Math.round(cap * 100) / 100)
  return {
    ...a,
    schemeName: s ? s.schemeName : '未配置',
    residualRate: s ? s.residualRate : 0,
    years: s ? s.years : 0,
    monthly: Math.round(monthly * 100) / 100,
    months,
    accumulated,
    net: Math.round((a.original - accumulated) * 100) / 100
  }
}))

function currentPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthsSince(inboundDate, period) {
  const start = new Date(inboundDate)
  const [y, m] = period.split('-').map(Number)
  return Math.max(0, (y - start.getFullYear()) * 12 + (m - 1 - start.getMonth()))
}

function accumulatedThrough(period) {
  return Math.round(depreciationLedger.value.reduce((sum, a) => {
    const s = schemeFor(a.category)
    if (!s) return sum
    const cap = a.original * (1 - s.residualRate / 100)
    const monthly = cap / (s.years * 12)
    return sum + Math.min(monthly * monthsSince(a.inboundDate, period), cap)
  }, 0) * 100) / 100
}

const totalOriginal = computed(() => Math.round(depreciationLedger.value.reduce((s, a) => s + a.original, 0) * 100) / 100)

const depreciationSummary = computed(() => {
  const original = totalOriginal.value
  const accumulated = Math.round(depreciationLedger.value.reduce((s, a) => s + a.accumulated, 0) * 100) / 100
  return {
    original,
    accumulated,
    net: Math.round((original - accumulated) * 100) / 100,
    monthly: Math.round(depreciationLedger.value.reduce((s, a) => s + a.monthly, 0) * 100) / 100
  }
})

const depreciationReports = ref(['2026-07', '2026-08'].map(period => ({
  period,
  openingValue: totalOriginal.value,
  periodDepreciation: 0,
  accumulated: 0,
  closingNet: 0,
  assetCount: 0,
  operator: '系统自动',
  runDate: `${period}-28`
})))

function prevPeriod(period) {
  const [y, m] = period.split('-').map(Number)
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
}

depreciationReports.value.forEach(report => {
  report.accumulated = accumulatedThrough(report.period)
  report.periodDepreciation = Math.round((report.accumulated - accumulatedThrough(prevPeriod(report.period))) * 100) / 100
  report.closingNet = Math.round((totalOriginal.value - report.accumulated) * 100) / 100
  report.assetCount = depreciationLedger.value.filter(a => schemeFor(a.category)).length
})

function runDepreciation() {
  const period = currentPeriod()
  if (depreciationReports.value.some(r => r.period === period)) {
    ElMessage.warning(`${period} 折旧已计提，请勿重复计提`)
    return
  }
  const accumulated = accumulatedThrough(period)
  const periodAmount = Math.round((accumulated - accumulatedThrough(prevPeriod(period))) * 100) / 100
  depreciationReports.value.push({
    period,
    openingValue: totalOriginal.value,
    periodDepreciation: periodAmount,
    accumulated,
    closingNet: Math.round((totalOriginal.value - accumulated) * 100) / 100,
    assetCount: depreciationLedger.value.filter(a => schemeFor(a.category)).length,
    operator: '管理员',
    runDate: nowText()
  })
  ElMessage.success(`${period} 折旧计提完成，本期计提 ¥${periodAmount.toLocaleString()}`)
}

function exportDepreciation() {
  downloadCsv(
    `固定资产折旧报表_${currentPeriod()}.csv`,
    ['折旧期间', '期初原值', '本期折旧', '累计折旧', '期末净值', '计提资产数', '计提人', '计提日期'],
    depreciationReports.value.map(r => [r.period, r.openingValue, r.periodDepreciation, r.accumulated, r.closingNet, r.assetCount, r.operator, r.runDate])
  )
  ElMessage.success('折旧报表已导出')
}

function exportDepreciationLedger() {
  downloadCsv(
    `固定资产折旧台账_${currentPeriod()}.csv`,
    ['资产编号', '资产名称', '分类', '使用部门', '存放位置', '入库日期', '资产原值', '折旧方案', '已计提月数', '月折旧额', '累计折旧', '资产净值'],
    depreciationLedger.value.map(a => [a.assetNo, a.assetName, a.category, a.department, a.location, a.inboundDate, a.original, a.schemeName, a.months, a.monthly, a.accumulated, a.net])
  )
  ElMessage.success('资产折旧台账已导出')
}

function depreciationSummaries({ columns, data }) {
  return columns.map((col, i) => {
    if (i === 0) return '合计'
    if (['openingValue', 'periodDepreciation', 'accumulated', 'closingNet'].includes(col.property)) {
      return '¥' + data.reduce((s, r) => s + (r[col.property] || 0), 0).toLocaleString()
    }
    return ''
  })
}

const categoryDepreciation = computed(() => {
  const map = {}
  depreciationLedger.value.forEach(a => {
    if (!map[a.category]) map[a.category] = { category: a.category, count: 0, original: 0, accumulated: 0 }
    map[a.category].count += a.quantity
    map[a.category].original += a.original
    map[a.category].accumulated += a.accumulated
  })
  return Object.values(map).map(c => ({
    ...c,
    original: Math.round(c.original * 100) / 100,
    accumulated: Math.round(c.accumulated * 100) / 100,
    net: Math.round((c.original - c.accumulated) * 100) / 100,
    rate: c.original ? Math.round(c.accumulated / c.original * 100) : 0
  }))
})

const schemeDialogVisible = ref(false)
const schemeForm = reactive({ schemeNo: '', schemeName: '', method: '年限平均法', years: 5, residualRate: 5, applicableCategory: '全部分类' })

const computedMonthlyRate = computed(() => {
  if (!schemeForm.years) return '0.0000'
  return ((1 - schemeForm.residualRate / 100) / (schemeForm.years * 12) * 100).toFixed(4)
})

function handleCreateScheme() {
  Object.assign(schemeForm, { schemeNo: '', schemeName: '', method: '年限平均法', years: 5, residualRate: 5, applicableCategory: '全部分类' })
  schemeDialogVisible.value = true
}

function editScheme(row) {
  Object.assign(schemeForm, {
    schemeNo: row.schemeNo,
    schemeName: row.schemeName,
    method: row.method,
    years: row.years,
    residualRate: row.residualRate,
    applicableCategory: row.applicableCategory
  })
  schemeDialogVisible.value = true
}

function submitScheme() {
  if (!schemeForm.schemeName) {
    ElMessage.warning('请填写方案名称')
    return
  }
  const monthlyRate = parseFloat(computedMonthlyRate.value)
  if (schemeForm.schemeNo) {
    const target = depreciationSchemes.value.find(s => s.schemeNo === schemeForm.schemeNo)
    Object.assign(target, {
      schemeName: schemeForm.schemeName,
      method: schemeForm.method,
      years: schemeForm.years,
      residualRate: schemeForm.residualRate,
      monthlyRate,
      applicableCategory: schemeForm.applicableCategory
    })
    ElMessage.success('折旧方案已更新，折旧台账已按新方案重算')
  } else {
    depreciationSchemes.value.push({
      schemeNo: `ZJ-${String(depreciationSchemes.value.length + 1).padStart(3, '0')}`,
      schemeName: schemeForm.schemeName,
      method: schemeForm.method,
      years: schemeForm.years,
      residualRate: schemeForm.residualRate,
      monthlyRate,
      applicableCategory: schemeForm.applicableCategory,
      enabled: true
    })
    ElMessage.success('折旧方案创建成功')
  }
  schemeDialogVisible.value = false
}

function toggleScheme(row) {
  ElMessage.success(`折旧方案"${row.schemeName}"已${row.enabled ? '启用' : '停用'}`)
}

function deleteScheme(row) {
  ElMessageBox.confirm(`确认删除折旧方案"${row.schemeName}"？删除后对应分类资产将不再计提折旧。`, '删除确认', { type: 'warning' }).then(() => {
    const idx = depreciationSchemes.value.findIndex(s => s.schemeNo === row.schemeNo)
    if (idx > -1) depreciationSchemes.value.splice(idx, 1)
    ElMessage.success('折旧方案已删除')
  }).catch(() => {})
}

const docStatusPool = ['已完结', '进行中', '待提交', '已驳回', '已撤销']
const docNotePool = ['按季度例行办理', '需资产管理员现场复核', '已完成实物验收', '等待财务确认金额', '附现场照片存档']

function buildDocs(prefix, count, names) {
  const docs = []
  for (let i = 0; i < count; i++) {
    const status = docStatusPool[i % docStatusPool.length]
    docs.push({
      id: `${prefix}-${i + 1}`,
      docNo: `${prefix}2026${900 - i * 13}`,
      name: names[i % names.length],
      company: companyOptions[i % companyOptions.length],
      createTime: `2026-0${(i % 8) + 1}-${String(10 + i).padStart(2, '0')} 09:${String((i * 7) % 60).padStart(2, '0')}:00`,
      finishTime: status === '已完结' ? `2026-0${(i % 8) + 1}-${String(15 + i).padStart(2, '0')} 17:20:00` : '',
      remark: docNotePool[i % docNotePool.length],
      status
    })
  }
  return docs
}

const docLists = reactive({
  inbound: {
    docs: buildDocs('RK', 8, ['联想笔记本采购入库', '办公设备季度补充入库', '车辆采购入库验收', '打印耗材批量入库', '会议设备采购入库']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  },
  alloc: {
    docs: buildDocs('FP', 7, ['新员工入职设备分配', '市场部办公设备派发', '项目部现场设备派发', '财务部电脑更新派发']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  },
  back: {
    docs: buildDocs('TK', 6, ['员工离职设备退库', '项目结束设备退库', '部门调整资产退库']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  },
  transfer: {
    docs: buildDocs('DB', 6, ['总部调拨至分公司', '仓库间资产调拨', '跨区域调拨支援项目']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  },
  repair: {
    docs: buildDocs('WX', 6, ['打印机故障送修', '车辆年度维修保养', '空调机组检修']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  },
  dispose: {
    docs: buildDocs('CZ', 7, ['超期设备报废处置', '盘亏资产核销处置', '旧家具变卖处置']),
    search: { docNo: '', company: '', status: '' }, page: 1, pageSize: 10
  }
})

Object.keys(docLists).forEach(k => {
  watch(() => docLists[k].search, () => { docLists[k].page = 1 }, { deep: true })
})

function filteredDocs(key) {
  const l = docLists[key]
  return l.docs.filter(d =>
    (!l.search.docNo || d.docNo.includes(l.search.docNo)) &&
    (!l.search.company || d.company === l.search.company) &&
    (!l.search.status || d.status === l.search.status)
  )
}

function pagedDocs(key) {
  const l = docLists[key]
  const start = (l.page - 1) * l.pageSize
  return filteredDocs(key).slice(start, start + l.pageSize)
}

function docTotal(key) {
  return filteredDocs(key).length
}

function resetDocSearch(key) {
  Object.assign(docLists[key].search, { docNo: '', company: '', status: '' })
  docLists[key].page = 1
}

function docStatusType(status) {
  const m = { '已完结': 'success', '进行中': 'primary', '待提交': 'warning', '已驳回': 'danger', '已撤销': 'info' }
  return m[status] || 'info'
}

const empPool = [
  { name: '张志刚', dept: '资产管理部', phone: '13800000001' },
  { name: '李秀兰', dept: '财务部', phone: '13800000002' },
  { name: '王建军', dept: '行政部', phone: '13800000003' },
  { name: '赵晓梅', dept: '运营部', phone: '13800000004' },
  { name: '陈立新', dept: '技术部', phone: '13800000005' },
  { name: '刘洋', dept: '资产管理部', phone: '13800000006' },
  { name: '杨帆', dept: '后勤部', phone: '13800000007' },
  { name: '徐磊', dept: '技术部', phone: '13800000008' }
]

const assetNamePool = ['联想ThinkPad笔记本', '戴尔OptiPlex台式机', '惠普激光打印机', '爱普生投影仪', '华为会议平板', '格力中央空调机组', '丰田考斯特商务车', '实木会议桌', '人体工学办公椅', '服务器机柜', '不间断电源UPS', '高速扫描仪']
const assetStatusPool = ['空闲', '使用中', '维修中', '借出中', '派发中']
const invLocationPool = ['总部办公楼1层', '总部办公楼2层', '总部办公楼3层', '仓库A区', '仓库B区', '数据中心机房']

function buildCheckItems(total, counted, seed) {
  const items = []
  for (let i = 0; i < total; i++) {
    let itemStatus = '未盘'
    let remark = ''
    let checker = ''
    let checkTime = ''
    if (i < counted) {
      itemStatus = '已盘'
      remark = '账实相符'
      checker = empPool[(i + seed) % empPool.length].name
      checkTime = `2026-09-${String(10 + (i % 8)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`
    } else if (i === counted && seed % 3 === 1) {
      itemStatus = '盘亏'
      remark = '现场未找到实物，待核销'
      checker = empPool[(i + seed) % empPool.length].name
      checkTime = `2026-09-${String(12 + (i % 6)).padStart(2, '0')} 15:30:00`
    } else if (i === counted && seed % 3 === 2) {
      itemStatus = '异常'
      remark = '编号标签破损，待补贴标签'
      checker = empPool[(i + seed) % empPool.length].name
      checkTime = `2026-09-${String(12 + (i % 6)).padStart(2, '0')} 16:10:00`
    }
    items.push({
      assetNo: `ZC2026${100 + seed * 13 + i}`,
      assetName: assetNamePool[(i + seed) % assetNamePool.length],
      assetStatus: assetStatusPool[(i + seed) % assetStatusPool.length],
      location: invLocationPool[(i + seed) % invLocationPool.length],
      itemStatus,
      remark,
      checker,
      createTime: `2026-09-0${(seed % 8) + 1} 10:00:00`,
      checkTime
    })
  }
  return items
}

function buildCounters(n, doneCount, seed) {
  const list = []
  for (let i = 0; i < n; i++) {
    const e = empPool[(i + seed) % empPool.length]
    const assigned = 4 + (seed % 3)
    list.push({
      name: e.name,
      dept: e.dept,
      phone: e.phone,
      assigned,
      done: i < doneCount ? assigned : 0,
      status: i < doneCount ? '已完成' : '盘点中'
    })
  }
  return list
}

const inventoryDocs = ref([
  { id: 'IV1', docNo: 'PD202609001', name: '2026年三季度全面盘点', company: companyOptions[0], applicant: '张志刚', scope: '全部资产', assetTypes: [], createTime: '2026-09-01 09:00:00', finishTime: '', remark: '季度例行全面盘点', status: '盘点中', items: buildCheckItems(24, 9, 1), counters: buildCounters(8, 0, 1) },
  { id: 'IV2', docNo: 'PD202608002', name: '车辆资产专项盘点', company: companyOptions[1], applicant: '李秀兰', scope: '按资产类型', assetTypes: ['运输设备'], createTime: '2026-08-12 10:20:00', finishTime: '', remark: '车辆专项核查', status: '盘点报告审批中', items: buildCheckItems(6, 6, 2), counters: buildCounters(3, 2, 2) },
  { id: 'IV3', docNo: 'PD202607003', name: '2026年二季度全面盘点', company: companyOptions[0], applicant: '王建军', scope: '全部资产', assetTypes: [], createTime: '2026-07-02 09:30:00', finishTime: '2026-07-20 16:40:00', remark: '账实核对完成', status: '已完结', items: buildCheckItems(30, 30, 3), counters: buildCounters(8, 8, 3) },
  { id: 'IV4', docNo: 'PD202606004', name: '仓库资产抽盘', company: companyOptions[2], applicant: '赵晓梅', scope: '按存放地点', assetTypes: [], createTime: '2026-06-15 14:00:00', finishTime: '2026-06-25 11:20:00', remark: '仓库抽样盘点', status: '已完结', items: buildCheckItems(12, 12, 4), counters: buildCounters(4, 4, 4) },
  { id: 'IV5', docNo: 'PD202605005', name: '电子设备年度盘点', company: companyOptions[3], applicant: '陈立新', scope: '按资产类型', assetTypes: ['电子设备'], createTime: '2026-05-08 09:10:00', finishTime: '', remark: '年度电子设备核查', status: '盘点中', items: buildCheckItems(18, 3, 5), counters: buildCounters(5, 1, 5) }
])

const invSearch = reactive({ docNo: '', company: '', status: '', createRange: null, finishRange: null })
const invPage = ref(1)
const invPageSize = ref(10)
watch(invSearch, () => { invPage.value = 1 }, { deep: true })

const filteredInvDocs = computed(() => {
  const cr = invSearch.createRange
  const fr = invSearch.finishRange
  return inventoryDocs.value.filter(d =>
    (!invSearch.docNo || d.docNo.includes(invSearch.docNo)) &&
    (!invSearch.company || d.company === invSearch.company) &&
    (!invSearch.status || d.status === invSearch.status) &&
    (!cr || cr.length !== 2 || (d.createTime.slice(0, 10) >= cr[0] && d.createTime.slice(0, 10) <= cr[1])) &&
    (!fr || fr.length !== 2 || (!!d.finishTime && d.finishTime.slice(0, 10) >= fr[0] && d.finishTime.slice(0, 10) <= fr[1]))
  )
})

const pagedInvDocs = computed(() => {
  const start = (invPage.value - 1) * invPageSize.value
  return filteredInvDocs.value.slice(start, start + invPageSize.value)
})

const invTotal = computed(() => filteredInvDocs.value.length)

function resetInvSearch() {
  Object.assign(invSearch, { docNo: '', company: '', status: '', createRange: null, finishRange: null })
  invPage.value = 1
}

function invStatusType(status) {
  const m = { '已完结': 'success', '盘点中': 'primary', '盘点报告审批中': 'warning' }
  return m[status] || 'info'
}

function invItemDone(d) {
  return d.items.filter(i => i.itemStatus !== '未盘').length
}

function invEmpDone(d) {
  return d.counters.filter(c => c.status === '已完成').length
}

function deleteInvDoc(row) {
  ElMessageBox.confirm(`确认删除盘点单"${row.docNo}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = inventoryDocs.value.findIndex(d => d.id === row.id)
    if (idx > -1) inventoryDocs.value.splice(idx, 1)
    ElMessage.success('盘点单已删除')
  }).catch(() => {})
}

const checkListVisible = ref(false)
const checkListDoc = ref(null)
const checkFilter = ref('全部')
const checkFilterKeys = ['全部', '未盘', '已盘', '盘盈', '盘亏', '异常']

const checkCounts = computed(() => {
  const items = checkListDoc.value ? checkListDoc.value.items : []
  const c = { '全部': items.length, '未盘': 0, '已盘': 0, '盘盈': 0, '盘亏': 0, '异常': 0 }
  items.forEach(i => { if (c[i.itemStatus] !== undefined) c[i.itemStatus]++ })
  return c
})

const filteredCheckItems = computed(() => {
  const items = checkListDoc.value ? checkListDoc.value.items : []
  return checkFilter.value === '全部' ? items : items.filter(i => i.itemStatus === checkFilter.value)
})

function openCheckList(row) {
  checkListDoc.value = row
  checkFilter.value = '全部'
  checkListVisible.value = true
}

function itemStatusType(status) {
  const m = { '已盘': 'success', '盘盈': 'primary', '盘亏': 'danger', '异常': 'warning', '未盘': 'info' }
  return m[status] || 'info'
}

const counterVisible = ref(false)
const counterDoc = ref(null)

function openCounters(row) {
  counterDoc.value = row
  counterVisible.value = true
}

const wizardVisible = ref(false)
const wizardStep = ref(0)
const wizardForm = reactive({ company: '', applicant: '', name: '', scope: '全部资产', assetTypes: [], counterIds: [], startDate: '' })

function openWizard() {
  Object.assign(wizardForm, { company: '', applicant: '', name: '', scope: '全部资产', assetTypes: [], counterIds: [], startDate: '' })
  wizardStep.value = 0
  wizardVisible.value = true
}

function wizardNext() {
  if (wizardStep.value === 0 && (!wizardForm.company || !wizardForm.applicant || !wizardForm.name)) {
    ElMessage.warning('请填写所属公司、申请人与盘点名称')
    return
  }
  if (wizardStep.value === 1 && wizardForm.counterIds.length === 0) {
    ElMessage.warning('请至少选择一名盘点员')
    return
  }
  wizardStep.value++
}

function submitWizard() {
  if (!wizardForm.startDate) {
    ElMessage.warning('请选择盘点开始日期')
    return
  }
  const n = wizardForm.counterIds.length
  const total = 6 + n * 3
  const per = Math.ceil(total / n)
  const counters = wizardForm.counterIds.map(name => {
    const e = empPool.find(x => x.name === name) || { name, dept: '-', phone: '-' }
    return { name: e.name, dept: e.dept, phone: e.phone, assigned: per, done: 0, status: '盘点中' }
  })
  const seq = inventoryDocs.value.length + 6
  inventoryDocs.value.unshift({
    id: `IV${Date.now()}`,
    docNo: `PD2026${String(1000 + inventoryDocs.value.length * 11).slice(0, 4)}`,
    name: wizardForm.name,
    company: wizardForm.company,
    applicant: wizardForm.applicant,
    scope: wizardForm.scope,
    assetTypes: [...wizardForm.assetTypes],
    createTime: nowText(),
    finishTime: '',
    remark: `盘点开始日期 ${wizardForm.startDate}`,
    status: '盘点中',
    items: buildCheckItems(total, 0, seq * 3),
    counters
  })
  wizardVisible.value = false
  inventorySub.value = 'docs'
  invPage.value = 1
  ElMessage.success('盘点任务已创建并推送至盘点员')
}

const docDialogVisible = ref(false)
const docDialogMode = ref('add')
const docDialogKey = ref('inbound')
const docForm = reactive({ id: '', name: '', company: '', remark: '' })
const docPrefixMap = { inbound: 'RK', alloc: 'FP', back: 'TK', transfer: 'DB', repair: 'WX', dispose: 'CZ', inventory: 'PD' }
const docDialogTitle = computed(() => (docDialogMode.value === 'edit' ? '修改单据' : '新增单据'))

function openDocDialog(key, row) {
  docDialogKey.value = key
  docDialogMode.value = row ? 'edit' : 'add'
  Object.assign(docForm, row
    ? { id: row.id, name: row.name || '', company: row.company, remark: row.remark || '' }
    : { id: '', name: '', company: '', remark: '' })
  docDialogVisible.value = true
}

function submitDocDialog() {
  if (!docForm.company) {
    ElMessage.warning('请选择所属公司')
    return
  }
  const key = docDialogKey.value
  if (key === 'inventory') {
    const target = inventoryDocs.value.find(d => d.id === docForm.id)
    if (target) Object.assign(target, { name: docForm.name, company: docForm.company, remark: docForm.remark })
    docDialogVisible.value = false
    ElMessage.success('盘点单已保存')
    return
  }
  const list = docLists[key]
  if (docDialogMode.value === 'edit') {
    const target = list.docs.find(d => d.id === docForm.id)
    if (target) Object.assign(target, { name: docForm.name, company: docForm.company, remark: docForm.remark })
    ElMessage.success('单据已保存')
  } else {
    const prefix = docPrefixMap[key]
    list.docs.unshift({
      id: `${prefix}-${Date.now()}`,
      docNo: `${prefix}2026${Math.floor(Math.random() * 800) + 100}`,
      name: docForm.name,
      company: docForm.company,
      createTime: nowText(),
      finishTime: '',
      remark: docForm.remark,
      status: '待提交'
    })
    list.page = 1
    ElMessage.success('单据已创建')
  }
  docDialogVisible.value = false
}

const approvalVisible = ref(false)
const approvalDoc = ref(null)

const approvalRecords = computed(() => {
  const d = approvalDoc.value
  if (!d) return []
  const creator = d.applicant || '王小明'
  if (d.status === '已撤销') {
    return [
      { node: '创建单据', person: creator, result: '已提交', time: d.createTime },
      { node: '单据撤销', person: creator, result: '已撤销', time: d.createTime }
    ]
  }
  if (d.status === '待提交') {
    return [{ node: '创建单据', person: creator, result: '草稿保存', time: d.createTime }]
  }
  const node1 = { node: '创建单据', person: creator, result: '已提交', time: d.createTime }
  if (d.status === '已驳回') {
    return [node1, { node: '部门负责人审批', person: '李国强', result: '驳回', time: d.createTime }]
  }
  const node2 = { node: '部门负责人审批', person: '李国强', result: '通过', time: d.createTime }
  if (d.status === '已完结') {
    return [node1, node2, { node: '资产管理员审批', person: '张志刚', result: '通过', time: d.finishTime || d.createTime }]
  }
  return [node1, node2, { node: '资产管理员审批', person: '张志刚', result: '审批中', time: '' }]
})

function viewDocApproval(row) {
  approvalDoc.value = row
  approvalVisible.value = true
}

function deleteDoc(key, row) {
  ElMessageBox.confirm(`确认删除单据"${row.docNo}"？`, '删除确认', { type: 'warning' }).then(() => {
    const list = docLists[key]
    const idx = list.docs.findIndex(d => d.id === row.id)
    if (idx > -1) list.docs.splice(idx, 1)
    ElMessage.success('单据已删除')
  }).catch(() => {})
}

const locationOptions = ref(['总部办公楼1层', '总部办公楼2层', '总部办公楼3层', '仓库A区', '仓库B区', '车库', '数据中心机房'])

const assetList = ref([
  { id: 'A01', code: 'GD20260001', name: '联想ThinkPad笔记本电脑', type: '电子设备', brand: '联想', model: 'ThinkPad T14', company: '华信科技集团有限公司', location: '总部办公楼2层', purchaseDate: '2026-03-12', amount: 8500, inboundDate: '2026-03-15', original: 8500, net: 7650, user: '张伟', dept: '技术部', status: '空闲', depreciate: true, purchaseMode: '购买', leaseMonths: 36, updateTime: '2026-09-18 10:22:31' },
  { id: 'A02', code: 'GD20260002', name: '戴尔OptiPlex台式电脑', type: '电子设备', brand: '戴尔', model: 'OptiPlex 7010', company: '华信科技集团有限公司', location: '总部办公楼3层', purchaseDate: '2026-02-20', amount: 6200, inboundDate: '2026-02-25', original: 6200, net: 5580, user: '李娜', dept: '财务部', status: '派发中', depreciate: true, purchaseMode: '购买', leaseMonths: 36, updateTime: '2026-09-17 15:40:12' },
  { id: 'A03', code: 'GD20260003', name: '惠普激光打印机', type: '电子设备', brand: '惠普', model: 'LaserJet M405', company: '云鼎资产管理有限公司', location: '总部办公楼1层', purchaseDate: '2025-11-08', amount: 3200, inboundDate: '2025-11-12', original: 3200, net: 2560, user: '王强', dept: '行政部', status: '借出中', depreciate: true, purchaseMode: '购买', leaseMonths: 24, updateTime: '2026-09-16 09:05:44' },
  { id: 'A04', code: 'GD20260004', name: '丰田考斯特商务车', type: '运输设备', brand: '丰田', model: '考斯特 20座', company: '中天建设集团有限公司', location: '车库', purchaseDate: '2025-06-18', amount: 385000, inboundDate: '2025-06-25', original: 385000, net: 320800, user: '赵敏', dept: '行政部', status: '维修中', depreciate: true, purchaseMode: '购买', leaseMonths: 60, updateTime: '2026-09-15 14:22:08' },
  { id: 'A05', code: 'GD20260005', name: '数控车床CK6140', type: '机械设备', brand: '沈阳机床', model: 'CK6140', company: '恒信融资租赁有限公司', location: '仓库A区', purchaseDate: '2024-09-10', amount: 268000, inboundDate: '2024-09-20', original: 268000, net: 214400, user: '陈刚', dept: '生产部', status: '处置中', depreciate: true, purchaseMode: '租赁', leaseMonths: 48, updateTime: '2026-09-14 11:31:52' },
  { id: 'A06', code: 'GD20260006', name: '华为会议平板', type: '电子设备', brand: '华为', model: 'IdeaHub S2', company: '华信科技集团有限公司', location: '总部办公楼3层', purchaseDate: '2026-04-02', amount: 26800, inboundDate: '2026-04-06', original: 26800, net: 25460, user: '刘洋', dept: '运营部', status: '空闲', depreciate: true, purchaseMode: '购买', leaseMonths: 36, updateTime: '2026-09-13 16:48:20' },
  { id: 'A07', code: 'GD20260007', name: '格力中央空调机组', type: '机械设备', brand: '格力', model: 'GMV-560', company: '云鼎资产管理有限公司', location: '数据中心机房', purchaseDate: '2025-03-15', amount: 158000, inboundDate: '2025-03-28', original: 158000, net: 132700, user: '孙磊', dept: '后勤部', status: '派发中', depreciate: true, purchaseMode: '自建', leaseMonths: 120, updateTime: '2026-09-12 08:55:03' },
  { id: 'A08', code: 'GD20260008', name: '实木会议桌', type: '办公家具', brand: '华丰', model: 'HF-B3200', company: '中天建设集团有限公司', location: '总部办公楼1层', purchaseDate: '2025-12-05', amount: 12800, inboundDate: '2025-12-10', original: 12800, net: 11520, user: '周静', dept: '行政部', status: '借出中', depreciate: true, purchaseMode: '购买', leaseMonths: 60, updateTime: '2026-09-11 13:26:47' },
  { id: 'A09', code: 'GD20260009', name: '人体工学办公椅', type: '办公家具', brand: '西昊', model: 'M57', company: '华信科技集团有限公司', location: '总部办公楼2层', purchaseDate: '2026-01-16', amount: 1580, inboundDate: '2026-01-20', original: 1580, net: 1420, user: '吴迪', dept: '技术部', status: '空闲', depreciate: true, purchaseMode: '购买', leaseMonths: 24, updateTime: '2026-09-10 10:12:35' },
  { id: 'A10', code: 'GD20260010', name: '服务器机柜', type: '电子设备', brand: '图腾', model: 'G2.6642', company: '恒信融资租赁有限公司', location: '数据中心机房', purchaseDate: '2024-11-22', amount: 42000, inboundDate: '2024-12-01', original: 42000, net: 33600, user: '郑凯', dept: '技术部', status: '维修中', depreciate: true, purchaseMode: '租赁', leaseMonths: 36, updateTime: '2026-09-09 17:04:11' },
  { id: 'A11', code: 'GD20260011', name: '合力3吨叉车', type: '机械设备', brand: '合力', model: 'CPCD30', company: '中天建设集团有限公司', location: '仓库B区', purchaseDate: '2025-08-08', amount: 96000, inboundDate: '2025-08-15', original: 96000, net: 84000, user: '冯涛', dept: '仓储部', status: '处置中', depreciate: true, purchaseMode: '购买', leaseMonths: 60, updateTime: '2026-09-08 09:38:56' },
  { id: 'A12', code: 'GD20260012', name: '爱普生投影仪', type: '电子设备', brand: '爱普生', model: 'CB-X06', company: '云鼎资产管理有限公司', location: '总部办公楼3层', purchaseDate: '2026-05-20', amount: 4600, inboundDate: '2026-05-24', original: 4600, net: 4370, user: '何欣', dept: '市场部', status: '空闲', depreciate: true, purchaseMode: '购买', leaseMonths: 36, updateTime: '2026-09-07 14:51:29' },
  { id: 'A13', code: 'GD20260013', name: '不间断电源UPS', type: '电子设备', brand: '山特', model: 'C3KS', company: '华信科技集团有限公司', location: '数据中心机房', purchaseDate: '2025-10-11', amount: 18600, inboundDate: '2025-10-18', original: 18600, net: 16120, user: '高翔', dept: '技术部', status: '派发中', depreciate: true, purchaseMode: '购买', leaseMonths: 48, updateTime: '2026-09-06 11:19:40' }
])

const assetSearch = reactive({ keyword: '', type: '', status: '' })
const assetPage = ref(1)
const assetPageSize = ref(10)
watch(assetSearch, () => { assetPage.value = 1 }, { deep: true })

const filteredAssetList = computed(() => assetList.value.filter(a =>
  (!assetSearch.keyword || a.code.includes(assetSearch.keyword) || a.name.includes(assetSearch.keyword)) &&
  (!assetSearch.type || a.type === assetSearch.type) &&
  (!assetSearch.status || a.status === assetSearch.status)
))

const pagedAssetList = computed(() => {
  const start = (assetPage.value - 1) * assetPageSize.value
  return filteredAssetList.value.slice(start, start + assetPageSize.value)
})

const assetTotal = computed(() => filteredAssetList.value.length)

function resetAssetSearch() {
  Object.assign(assetSearch, { keyword: '', type: '', status: '' })
  assetPage.value = 1
}

function assetStatusType(status) {
  const m = { '空闲': 'success', '派发中': 'primary', '借出中': 'warning', '维修中': 'danger', '处置中': 'info' }
  return m[status] || 'info'
}

const assetDialogVisible = ref(false)
const assetEditId = ref('')
const assetForm = reactive({ name: '', type: '', code: '', company: '', brand: '', model: '', location: '', purchaseDate: '', amount: 0, inboundDate: '', images: [], depreciate: true, original: 0, purchaseMode: '购买', leaseMonths: 36, quantity: 1 })

function openAssetDialog(row) {
  assetEditId.value = row ? row.id : ''
  Object.assign(assetForm, row ? {
    name: row.name, type: row.type, code: row.code, company: row.company, brand: row.brand, model: row.model, location: row.location,
    purchaseDate: row.purchaseDate, amount: row.amount, inboundDate: row.inboundDate, images: [], depreciate: row.depreciate,
    original: row.original, purchaseMode: row.purchaseMode, leaseMonths: row.leaseMonths, quantity: 1
  } : {
    name: '', type: '', code: '', company: '', brand: '', model: '', location: '', purchaseDate: '', amount: 0, inboundDate: '',
    images: [], depreciate: true, original: 0, purchaseMode: '购买', leaseMonths: 36, quantity: 1
  })
  assetDialogVisible.value = true
}

function addLocationOption() {
  ElMessageBox.prompt('请输入新的存放地点名称', '新增存放地点', { inputPattern: /\S+/, inputErrorMessage: '存放地点不能为空' }).then(({ value }) => {
    const v = value.trim()
    if (!locationOptions.value.includes(v)) locationOptions.value.push(v)
    assetForm.location = v
    ElMessage.success('存放地点已新增')
  }).catch(() => {})
}

function submitAssetDialog() {
  if (!assetForm.name || !assetForm.type) {
    ElMessage.warning('请填写资产名称与资产类型')
    return
  }
  const original = assetForm.depreciate && assetForm.original ? assetForm.original : assetForm.amount
  if (assetEditId.value) {
    const target = assetList.value.find(a => a.id === assetEditId.value)
    if (target) Object.assign(target, {
      name: assetForm.name, type: assetForm.type, code: assetForm.code || target.code, company: assetForm.company,
      brand: assetForm.brand, model: assetForm.model, location: assetForm.location, purchaseDate: assetForm.purchaseDate,
      amount: assetForm.amount, inboundDate: assetForm.inboundDate, depreciate: assetForm.depreciate, original,
      purchaseMode: assetForm.purchaseMode, leaseMonths: assetForm.leaseMonths, updateTime: nowText()
    })
    ElMessage.success('资产已保存')
  } else {
    const seq = 200 + assetList.value.length
    for (let i = 0; i < assetForm.quantity; i++) {
      const code = assetForm.code
        ? (assetForm.quantity > 1 ? `${assetForm.code}-${i + 1}` : assetForm.code)
        : `GD2026${seq + i}`
      assetList.value.unshift({
        id: `A${Date.now()}${i}`,
        code,
        name: assetForm.quantity > 1 ? `${assetForm.name}#${i + 1}` : assetForm.name,
        type: assetForm.type,
        brand: assetForm.brand,
        model: assetForm.model,
        company: assetForm.company || companyOptions[0],
        location: assetForm.location || locationOptions.value[0],
        purchaseDate: assetForm.purchaseDate,
        amount: assetForm.amount,
        inboundDate: assetForm.inboundDate,
        original,
        net: original,
        user: '',
        dept: '',
        status: '空闲',
        depreciate: assetForm.depreciate,
        purchaseMode: assetForm.purchaseMode,
        leaseMonths: assetForm.leaseMonths,
        updateTime: nowText()
      })
    }
    assetPage.value = 1
    ElMessage.success(`已新增 ${assetForm.quantity} 条资产`)
  }
  assetDialogVisible.value = false
}

const assetDrawerVisible = ref(false)
const currentAsset = ref(null)
const assetRecordTab = ref('check')
const qrCanvas = ref(null)

function openAssetDrawer(row) {
  currentAsset.value = row
  assetRecordTab.value = 'check'
  assetDrawerVisible.value = true
  nextTick(() => {
    if (qrCanvas.value) {
      const qrData = `资产编号:${row.code}\n资产名称:${row.name}\n品牌型号:${row.brand || ''} ${row.model || ''}\n所属公司:${row.company}\n存放位置:${row.location}`
      QRCode.toCanvas(qrCanvas.value, qrData, { width: 120, margin: 1, color: { dark: '#1a1a1a', light: '#ffffff' } })
    }
  })
}

function downloadAssetQr(row) {
  const qrData = `资产编号:${row.code}\n资产名称:${row.name}\n品牌型号:${row.brand || ''} ${row.model || ''}\n所属公司:${row.company}\n存放位置:${row.location}`
  QRCode.toDataURL(qrData, { width: 400, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } }).then(dataUrl => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `二维码_${row.code}_${new Date().toISOString().slice(0, 10)}.png`
    a.click()
    ElMessage.success(`资产 ${row.code} 二维码已下载`)
  })
}

const assetRecordData = {
  check: [
    { docNo: 'PD202607003', result: '已盘', person: '张志刚', time: '2026-07-15 10:24:00' },
    { docNo: 'PD202604002', result: '已盘', person: '刘洋', time: '2026-04-12 09:40:00' }
  ],
  dispatch: [
    { docNo: 'FP2026880', kind: '派发', person: '张伟', dept: '技术部', time: '2026-03-18 14:10:00' },
    { docNo: 'TK2026860', kind: '退库', person: '张伟', dept: '技术部', time: '2026-08-02 16:30:00' }
  ],
  borrow: [
    { docNo: 'JC2026841', borrower: '李娜', borrowTime: '2026-06-11', returnTime: '2026-06-20', status: '已归还' },
    { docNo: 'JC2026812', borrower: '王强', borrowTime: '2026-09-05', returnTime: '-', status: '借用中' }
  ],
  repair: [
    { docNo: 'WX2026877', fault: '屏幕显示异常，更换排线', vendor: '联想售后', cost: 480, status: '已完成' },
    { docNo: 'WX2026823', fault: '电池续航衰减，需更换电池', vendor: '第三方维修商', cost: 620, status: '维修中' }
  ],
  transfer: [
    { docNo: 'DB2026869', from: '华信科技集团有限公司', to: '云鼎资产管理有限公司', time: '2026-07-28 11:00:00', status: '已完结' },
    { docNo: 'DB2026835', from: '恒信融资租赁有限公司', to: '华信科技集团有限公司', time: '2026-03-16 09:20:00', status: '已完结' }
  ],
  change: [
    { docNo: 'BG2026858', content: '使用部门由行政部变更为技术部', person: '张志刚', time: '2026-05-09 15:44:00' },
    { docNo: 'BG2026820', content: '存放地点调整为总部办公楼2层', person: '刘洋', time: '2026-03-16 09:25:00' }
  ],
  dispose: [
    { docNo: 'CZ2026812', mode: '报废', amount: 0, time: '2026-08-20 10:10:00', status: '审批中' },
    { docNo: 'CZ2026798', mode: '变卖', amount: 1200, time: '2026-02-14 15:02:00', status: '已驳回' }
  ]
}
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

.kpi-row {
  margin-bottom: 16px;
}

.kpi-card {
  background: #f7f9fc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px 16px;
}

.kpi-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.progress-text {
  font-size: 12px;
  color: #909399;
}

.inventory-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.plan-hint {
  font-size: 13px;
  color: #409eff;
}

.sub-tabs {
  margin-bottom: 8px;
}

.frac-chip {
  display: inline-block;
  padding: 1px 10px;
  border-radius: 10px;
  background: #e6f7ff;
  color: var(--c-primary);
  font-size: 12px;
  border: 1px solid #91d5ff;
}

.inline-select {
  display: flex;
  gap: 8px;
  width: 100%;
}

.upload-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.drawer-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.drawer-sub {
  font-size: 12px;
  color: #999;
  margin-bottom: 14px;
}

.qr-box {
  width: 132px;
  height: 132px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #999;
  font-size: 12px;
  margin-bottom: 14px;
  background: #fafafa;
}

.checklist-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.counter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.approval-node {
  font-weight: 600;
  color: #333;
}

.approval-meta {
  font-size: 12px;
  color: #999;
}
</style>
