<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ pageTitle }}</h2>
      <div>
        <el-button type="primary" @click="handleCreateOrder">
          <el-icon><Plus /></el-icon>
          新建工单
        </el-button>
        <el-button @click="handleCreateInspection">
          <el-icon><Calendar /></el-icon>
          新建巡查
        </el-button>
      </div>
    </div>
    <el-card class="fill">

      <el-tabs v-model="activeTab">
        <el-tab-pane v-if="isPlanRoute" label="巡查计划" name="plan">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="planFilter.keyword" placeholder="计划编号/巡查范围/负责人" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="计划状态">
              <el-select v-model="planFilter.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="未开始" value="未开始" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar-row">
            <el-button type="primary" :icon="Plus" @click="openPlanDialog">新增计划</el-button>
            <el-button :icon="Download" @click="handleExport('巡查计划')">导出</el-button>
          </div>

          <el-table :data="pagedPlans" border stripe style="width: 100%">
            <el-table-column prop="planNo" label="计划编号" width="150" />
            <el-table-column prop="scope" label="巡查范围" min-width="200" show-overflow-tooltip />
            <el-table-column prop="cycle" label="计划周期" width="200" />
            <el-table-column prop="owner" label="负责人" width="100" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewPlan(row)">详情</el-button>
                <el-button link type="danger" size="small" @click="handleDeletePlan(row)">删除</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="planPage"
              v-model:page-size="planSize"
              :total="filteredPlanList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产巡查" name="inspection">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="inspFilter.keyword" placeholder="巡查编号/资产名称/巡查人" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="巡查日期">
              <el-date-picker v-model="inspFilter.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
            </el-form-item>
            <el-form-item label="巡查状态">
              <el-select v-model="inspFilter.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="已完成" value="已完成" />
                <el-option label="进行中" value="进行中" />
                <el-option label="待巡查" value="待巡查" />
              </el-select>
            </el-form-item>
            <el-form-item label="所属公司">
              <el-select v-model="inspFilter.company" placeholder="请选择公司" clearable style="width: 190px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar-row">
            <el-button type="primary" :icon="Plus" @click="handleCreateInspectionInfo">新增巡查信息</el-button>
            <el-button :icon="Download" @click="handleExport('巡查信息')">导出</el-button>
          </div>

          <el-table :data="pagedInspections" border stripe style="width: 100%">
            <el-table-column label="资产信息" align="center">
              <el-table-column prop="zone" label="分区" width="100" />
              <el-table-column prop="assetName" label="资产名称" min-width="140" show-overflow-tooltip />
              <el-table-column prop="assetCode" label="资产编号" width="120" />
              <el-table-column prop="address" label="资产座落" min-width="180" show-overflow-tooltip />
              <el-table-column prop="company" label="所属公司" min-width="150" show-overflow-tooltip />
            </el-table-column>
            <el-table-column prop="inspectionNo" label="巡查编号" width="140" />
            <el-table-column prop="inspector" label="巡查人" width="90" />
            <el-table-column prop="inspectionDate" label="巡查日期" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="issueCount" label="发现问题数" width="100" />
            <el-table-column label="详情" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewInspection(row)">详情</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openUploadForInspection(row)">上传</el-button>
                <el-button link type="primary" size="small" @click="handleReport(row)" v-if="row.status === '进行中'">上报</el-button>
                <el-button link type="primary" size="small" @click="handleCompleteInspection(row)" v-if="row.status === '进行中'">完成</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="inspPage"
              v-model:page-size="inspSize"
              :total="filteredInspectionList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="项目巡查" name="project">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="projFilter.keyword" placeholder="巡查编号/项目名称/巡查人" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="巡查日期">
              <el-date-picker v-model="projFilter.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
            </el-form-item>
            <el-form-item label="所属公司">
              <el-select v-model="projFilter.company" placeholder="请选择公司" clearable style="width: 190px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar-row">
            <el-button type="primary" :icon="Plus" @click="handleCreateInspectionInfo">新增巡查信息</el-button>
            <el-button :icon="Download" @click="handleExport('项目巡查信息')">导出</el-button>
          </div>

          <el-table :data="pagedProjects" border stripe style="width: 100%">
            <el-table-column label="项目信息" align="center">
              <el-table-column prop="zone" label="分区" width="100" />
              <el-table-column prop="assetName" label="项目名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="assetCode" label="项目编号" width="120" />
              <el-table-column prop="address" label="项目座落" min-width="180" show-overflow-tooltip />
              <el-table-column prop="company" label="所属公司" min-width="150" show-overflow-tooltip />
            </el-table-column>
            <el-table-column prop="inspectionNo" label="巡查编号" width="140" />
            <el-table-column prop="inspector" label="巡查人" width="90" />
            <el-table-column prop="inspectionDate" label="巡查日期" width="110" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="issueCount" label="发现问题数" width="100" />
            <el-table-column label="详情" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewInspection(row)">详情</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openUploadForInspection(row)">上传</el-button>
                <el-button link type="primary" size="small" @click="handleCompleteInspection(row)" v-if="row.status === '进行中'">完成</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="projPage"
              v-model:page-size="projSize"
              :total="filteredProjectList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产报修" name="repair">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="repairFilter.keyword" placeholder="报修编号/资产名称/报修人" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="报修日期">
              <el-date-picker v-model="repairFilter.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
            </el-form-item>
            <el-form-item label="所属公司">
              <el-select v-model="repairFilter.company" placeholder="请选择公司" clearable style="width: 190px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar-row">
            <el-button type="primary" :icon="Plus" @click="openRepairReq">报修</el-button>
            <el-button :icon="Download" @click="handleExport('报修信息')">导出</el-button>
          </div>

          <el-table :data="pagedRepairs" border stripe style="width: 100%">
            <el-table-column label="资产信息" align="center">
              <el-table-column prop="zone" label="分区" width="100" />
              <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="assetCode" label="资产编号" width="140" />
              <el-table-column prop="address" label="资产座落" min-width="180" show-overflow-tooltip />
              <el-table-column prop="company" label="所属公司" min-width="150" show-overflow-tooltip />
            </el-table-column>
            <el-table-column prop="repairNo" label="报修编号" width="140" />
            <el-table-column prop="reporter" label="报修人" width="90" />
            <el-table-column prop="reporterPhone" label="联系电话" width="120" />
            <el-table-column prop="reportDate" label="报修日期" width="110" />
            <el-table-column prop="issue" label="问题描述" min-width="170" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getRepairStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="详情" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewRepair(row)">详情</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleAssign(row)" v-if="row.status === '待处理'">派单</el-button>
                <el-button link type="primary" size="small" @click="handleCompleteRepair(row)" v-if="row.status === '处理中'">完成</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="repairPage"
              v-model:page-size="repairSize"
              :total="filteredRepairList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="维修管理" name="mgmt">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="mgmtFilter.keyword" placeholder="报修人姓名/联系电话" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="提交时间">
              <el-date-picker v-model="mgmtFilter.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="mgmtFilter.status" placeholder="请选择" clearable style="width: 120px">
                <el-option label="待审核" value="待审核" />
                <el-option label="已通过" value="已通过" />
                <el-option label="已驳回" value="已驳回" />
              </el-select>
            </el-form-item>
            <el-form-item label="所属公司">
              <el-select v-model="mgmtFilter.company" placeholder="请选择公司" clearable style="width: 190px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar-row">
            <el-button :icon="Download" @click="handleExport('维修记录')">导出</el-button>
          </div>

          <el-table :data="pagedMgmt" border stripe style="width: 100%">
            <el-table-column prop="repairNo" label="报修编号" width="140" />
            <el-table-column label="资产信息" align="center">
              <el-table-column prop="zone" label="分区" width="100" />
              <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
              <el-table-column prop="assetCode" label="资产编号" width="140" />
              <el-table-column prop="address" label="资产座落" min-width="180" show-overflow-tooltip />
              <el-table-column prop="company" label="所属公司" min-width="150" show-overflow-tooltip />
            </el-table-column>
            <el-table-column prop="reporter" label="报修人姓名" width="110" />
            <el-table-column prop="reporterPhone" label="联系电话" width="120" />
            <el-table-column prop="content" label="维修内容" min-width="170" show-overflow-tooltip />
            <el-table-column prop="submitTime" label="提交时间" width="160" />
            <el-table-column prop="auditStatus" label="审核状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getAuditStatusType(row.auditStatus)" size="small">{{ row.auditStatus }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="surveyor" label="勘查人员" width="140">
              <template #default="{ row }">
                <span v-if="row.surveyor">{{ row.surveyor }}</span>
                <span v-else style="color:var(--t-weak)">-</span>
              </template>
            </el-table-column>
            <el-table-column label="详情" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewMgmt(row)">详情</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openAudit(row)" v-if="row.auditStatus === '待审核'">审核</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="mgmtPage"
              v-model:page-size="mgmtSize"
              :total="filteredMgmtList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="工单跟踪" name="workorder">
          <el-form :inline="true" class="search-form">
            <el-form-item label="关键字">
              <el-input v-model="woFilter.keyword" placeholder="工单编号/资产名称/处理人" clearable style="width: 190px" />
            </el-form-item>
            <el-form-item label="派单日期">
              <el-date-picker v-model="woFilter.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
            </el-form-item>
            <el-form-item label="所属公司">
              <el-select v-model="woFilter.company" placeholder="请选择公司" clearable style="width: 190px">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="pagedWorkOrders" border stripe style="width: 100%">
            <el-table-column prop="orderNo" label="工单编号" width="150" />
            <el-table-column prop="repairNo" label="关联报修" width="150" />
            <el-table-column prop="assetName" label="资产名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="company" label="所属公司" min-width="150" show-overflow-tooltip />
            <el-table-column prop="handler" label="处理人" width="100" />
            <el-table-column prop="handlerPhone" label="联系电话" width="120" />
            <el-table-column prop="assignDate" label="派单日期" width="110" />
            <el-table-column prop="completeDate" label="完成日期" width="110">
              <template #default="{ row }">{{ row.completeDate || '-' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getWorkOrderStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewOrder(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="handleCompleteOrder(row)" v-if="row.status === '处理中'">完成</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无内容" :image-size="70" />
            </template>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="woPage"
              v-model:page-size="woSize"
              :total="filteredWorkOrderList.length"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="orderDialogVisible" title="新建工单" width="600px">
      <el-form :model="orderForm" label-width="100px">
        <el-form-item label="报修编号">
          <el-select v-model="orderForm.repairNo" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in pendingRepairList" :key="item.repairNo" :label="item.repairNo + ' - ' + item.assetName" :value="item.repairNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="orderForm.handler" placeholder="请输入处理人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="orderForm.handlerPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="预计完成">
          <el-date-picker v-model="orderForm.estimateDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="orderForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOrderSubmit">确定派单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="inspectionDialogVisible" title="新建巡查" width="600px">
      <el-form :model="inspectionForm" label-width="100px">
        <el-form-item label="选择资产">
          <el-select v-model="inspectionForm.assetId" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in assetOptions" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="巡查人">
          <el-input v-model="inspectionForm.inspector" placeholder="请输入巡查人" />
        </el-form-item>
        <el-form-item label="巡查日期">
          <el-date-picker v-model="inspectionForm.inspectionDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="巡查内容">
          <el-input v-model="inspectionForm.content" type="textarea" :rows="4" placeholder="请输入巡查内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInspectionSubmit">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialogVisible" title="上报问题" width="600px">
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="问题类型">
          <el-select v-model="reportForm.issueType" placeholder="请选择" style="width: 100%">
            <el-option label="设施损坏" value="设施损坏" />
            <el-option label="安全隐患" value="安全隐患" />
            <el-option label="环境卫生" value="环境卫生" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="reportForm.description" type="textarea" :rows="4" placeholder="请详细描述问题" />
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-radio-group v-model="reportForm.urgency">
            <el-radio label="一般">一般</el-radio>
            <el-radio label="紧急">紧急</el-radio>
            <el-radio label="非常紧急">非常紧急</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReportSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadVisible" title="上传巡查信息" width="620px">
      <template v-if="uploadTarget">
        <div class="section-title">资产信息</div>
        <div class="upload-asset">
          <span class="asset-name">{{ uploadTarget.name }}</span>
          <el-tag size="small" effect="plain">{{ uploadTarget.type }}</el-tag>
          <span class="asset-addr">{{ uploadTarget.address }}</span>
        </div>
        <el-form label-width="110px">
          <el-form-item label="巡查人员">
            <el-input v-model="uploadForm.inspector" placeholder="请输入巡查人员" />
          </el-form-item>
          <el-form-item label="巡查详情">
            <el-input v-model="uploadForm.detail" type="textarea" :rows="4" placeholder="请输入巡查详情" />
          </el-form-item>
          <el-form-item label="上传照片/视频">
            <el-upload v-model:file-list="uploadFileList" action="#" list-type="picture-card" :auto-upload="false" accept="image/*,video/*">
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload(false)">提交</el-button>
        <el-button type="warning" @click="submitUpload(true)">提交并报修</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="repairReqVisible" title="报修" width="560px">
      <el-form label-width="90px">
        <el-form-item label="报修资产">
          <el-select v-model="repairReqForm.assetCode" placeholder="请选择报修资产" style="width: 100%">
            <el-option v-for="a in assetOptions" :key="a.code" :label="a.name" :value="a.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="repairReqForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="repairReqForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="现场照片">
          <el-upload v-model:file-list="repairReqFiles" action="#" list-type="picture-card" :auto-upload="false" :limit="9" accept="image/*">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="color:var(--t-weak);font-size:12px">最多上传9张</div>
        </el-form-item>
        <el-form-item label="报修描述">
          <el-input v-model="repairReqForm.desc" type="textarea" :rows="3" placeholder="请输入报修描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairReqVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRepairRequest">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditVisible" title="审核" width="460px">
      <el-form label-width="90px">
        <el-form-item label="审核状态">
          <el-radio-group v-model="auditForm.status">
            <el-radio value="通过">通过</el-radio>
            <el-radio value="驳回">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="勘查人员" required>
          <el-select v-model="auditForm.surveyor" placeholder="请选择勘查人员" style="width: 100%">
            <el-option v-for="s in surveyorOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="inspectionDetailVisible" title="巡查详情" width="600px">
      <el-descriptions :column="2" border v-if="currentInspection">
        <el-descriptions-item label="巡查编号">{{ currentInspection.inspectionNo }}</el-descriptions-item>
        <el-descriptions-item label="巡查状态">
          <el-tag :type="getStatusType(currentInspection.status)" size="small">{{ currentInspection.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentInspection.assetName }}</el-descriptions-item>
        <el-descriptions-item label="资产类型">{{ currentInspection.assetType }}</el-descriptions-item>
        <el-descriptions-item label="巡查人">{{ currentInspection.inspector }}</el-descriptions-item>
        <el-descriptions-item label="巡查日期">{{ currentInspection.inspectionDate }}</el-descriptions-item>
        <el-descriptions-item label="发现问题数">{{ currentInspection.issueCount }}个</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="inspectionDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="repairDetailVisible" title="报修详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRepair">
        <el-descriptions-item label="报修编号">{{ currentRepair.repairNo }}</el-descriptions-item>
        <el-descriptions-item label="报修状态">
          <el-tag :type="getRepairStatusType(currentRepair.status)" size="small">{{ currentRepair.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentRepair.assetName }}</el-descriptions-item>
        <el-descriptions-item label="报修人">{{ currentRepair.reporter }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRepair.reporterPhone }}</el-descriptions-item>
        <el-descriptions-item label="报修日期">{{ currentRepair.reportDate }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">{{ currentRepair.issue }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="repairDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mgmtDetailVisible" title="维修详情" width="620px">
      <el-descriptions :column="2" border v-if="currentMgmt">
        <el-descriptions-item label="报修编号">{{ currentMgmt.repairNo }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="getAuditStatusType(currentMgmt.auditStatus)" size="small">{{ currentMgmt.auditStatus }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentMgmt.assetName }}</el-descriptions-item>
        <el-descriptions-item label="报修人姓名">{{ currentMgmt.reporter }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentMgmt.reporterPhone }}</el-descriptions-item>
        <el-descriptions-item label="维修内容" :span="2">{{ currentMgmt.content }}</el-descriptions-item>
        <el-descriptions-item label="现场照片">{{ currentMgmt.photoCount }}张</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ currentMgmt.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="勘查人员" :span="2">{{ currentMgmt.surveyor || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="mgmtDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="orderDetailVisible" title="工单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="工单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="工单状态">
          <el-tag :type="getWorkOrderStatusType(currentOrder.status)" size="small">{{ currentOrder.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联报修">{{ currentOrder.repairNo }}</el-descriptions-item>
        <el-descriptions-item label="资产名称">{{ currentOrder.assetName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentOrder.handler }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.handlerPhone }}</el-descriptions-item>
        <el-descriptions-item label="派单日期">{{ currentOrder.assignDate }}</el-descriptions-item>
        <el-descriptions-item label="完成日期">{{ currentOrder.completeDate || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="orderDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planDialogVisible" title="新增计划" width="600px">
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="巡查范围">
          <el-input v-model="planForm.scope" placeholder="请输入巡查范围（资产/项目名称）" />
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker v-model="planForm.cycleRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="planForm.owner" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="planForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePlanSubmit">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="planDetailVisible" title="巡查计划详情" width="600px">
      <el-descriptions :column="2" border v-if="currentPlan">
        <el-descriptions-item label="计划编号">{{ currentPlan.planNo }}</el-descriptions-item>
        <el-descriptions-item label="计划状态">
          <el-tag :type="getStatusType(currentPlan.status)" size="small">{{ currentPlan.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="巡查范围" :span="2">{{ currentPlan.scope }}</el-descriptions-item>
        <el-descriptions-item label="计划周期" :span="2">{{ currentPlan.cycle }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentPlan.owner }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentPlan.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="planDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Calendar, Download } from '@element-plus/icons-vue'

const route = useRoute()

const activeTab = ref('inspection')

const isPlanRoute = computed(() => route.name === 'EntInspectionPlan')

const pageTitle = computed(() => {
  if (route.name === 'EntInspectionPlan') return '巡查计划'
  if (route.name === 'EntInspectionRecords') return '巡查记录'
  return '巡检维修管理'
})

const setTabByRoute = (name) => {
  if (name === 'EntInspectionPlan') activeTab.value = 'plan'
  else activeTab.value = 'inspection'
}

watch(() => route.name, (name) => setTabByRoute(name), { immediate: true })

const companyOptions = ['城市建设投资有限公司', '置业发展有限公司', '物业管理服务有限公司', '旅游开发投资有限公司']

const inspFilter = reactive({ keyword: '', dateRange: [], status: '', company: '' })
const projFilter = reactive({ keyword: '', dateRange: [], company: '' })
const repairFilter = reactive({ keyword: '', dateRange: [], company: '' })
const mgmtFilter = reactive({ keyword: '', dateRange: [], status: '', company: '' })
const woFilter = reactive({ keyword: '', dateRange: [], company: '' })
const planFilter = reactive({ keyword: '', status: '' })

const inspectionList = ref([
  { inspectionNo: 'XC20260901001', zone: '吴航街道', assetName: '阳光花园1号楼', assetCode: 'ZC2024001', address: '长乐区吴航街道阳光花园小区', company: '城市建设投资有限公司', assetType: '保障房', inspector: '李四', inspectionDate: '2026-09-01', status: '已完成', issueCount: 2 },
  { inspectionNo: 'XC20260905001', zone: '航城街道', assetName: '万达广场商铺A座', assetCode: 'ZC2024010', address: '长乐区航城街道万达广场A座', company: '置业发展有限公司', assetType: '商铺', inspector: '王五', inspectionDate: '2026-09-05', status: '进行中', issueCount: 0 },
  { inspectionNo: 'XC20260910001', zone: '营前镇', assetName: '国贸写字楼A座', assetCode: 'ZC2024020', address: '长乐区营前镇国贸中心A座', company: '置业发展有限公司', assetType: '写字楼', inspector: '赵六', inspectionDate: '2026-09-10', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XC20260912001', zone: '玉田镇', assetName: '高新技术产业园厂房', assetCode: 'ZC2024030', address: '长乐区玉田镇高新技术产业园C区', company: '物业管理服务有限公司', assetType: '厂房', inspector: '李四', inspectionDate: '2026-09-12', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XC20260915001', zone: '江田镇', assetName: '朝阳农贸市场', assetCode: 'ZC2024040', address: '长乐区江田镇朝阳路88号', company: '旅游开发投资有限公司', assetType: '农贸市场', inspector: '王五', inspectionDate: '2026-09-15', status: '进行中', issueCount: 1 }
])

const projectInspections = ref([
  { inspectionNo: 'XM20260903001', zone: '航城片区', assetName: '航城商务楼改造项目', assetCode: 'PRJ2024001', address: '长乐区航城街道商务楼', company: '城市建设投资有限公司', assetType: '改造项目', inspector: '王五', inspectionDate: '2026-09-03', status: '已完成', issueCount: 1 },
  { inspectionNo: 'XM20260906001', zone: '吴航片区', assetName: '阳光花园保障房二期项目', assetCode: 'PRJ2024002', address: '长乐区吴航街道阳光花园西侧', company: '城市建设投资有限公司', assetType: '保障房项目', inspector: '李四', inspectionDate: '2026-09-06', status: '进行中', issueCount: 0 },
  { inspectionNo: 'XM20260909001', zone: '江田片区', assetName: '滨海旅游集散中心项目', assetCode: 'PRJ2024003', address: '长乐区江田镇滨海大道', company: '旅游开发投资有限公司', assetType: '文旅项目', inspector: '赵六', inspectionDate: '2026-09-09', status: '待巡查', issueCount: 0 },
  { inspectionNo: 'XM20260911001', zone: '营前片区', assetName: '营前标准厂房三期项目', assetCode: 'PRJ2024004', address: '长乐区营前镇工业园', company: '置业发展有限公司', assetType: '厂房项目', inspector: '王五', inspectionDate: '2026-09-11', status: '进行中', issueCount: 2 }
])

const repairList = ref([
  { repairNo: 'BX20260902001', zone: '吴航街道', assetName: '阳光花园1号楼101室', assetCode: 'ZC2024001-0101', address: '长乐区吴航街道阳光花园小区1号楼101室', company: '城市建设投资有限公司', reporter: '张三', reporterPhone: '13800138001', reportDate: '2026-09-02', issue: '空调漏水，需要维修', status: '待处理' },
  { repairNo: 'BX20260903001', zone: '航城街道', assetName: '万达广场商铺A101', assetCode: 'ZC2024010-A101', address: '长乐区航城街道万达广场A座101铺', company: '置业发展有限公司', reporter: '王经理', reporterPhone: '13900139001', reportDate: '2026-09-03', issue: '电梯故障，无法运行', status: '处理中' },
  { repairNo: 'BX20260905001', zone: '营前镇', assetName: '国贸写字楼A座1501', assetCode: 'ZC2024020-1501', address: '长乐区营前镇国贸中心A座1501室', company: '置业发展有限公司', reporter: '刘总', reporterPhone: '13700137001', reportDate: '2026-09-05', issue: '卫生间水管破裂', status: '处理中' },
  { repairNo: 'BX20260901001', zone: '玉田镇', assetName: '高新技术产业园厂房C1', assetCode: 'ZC2024030-C1', address: '长乐区玉田镇高新技术产业园C1厂房', company: '物业管理服务有限公司', reporter: '陈厂长', reporterPhone: '13600136001', reportDate: '2026-09-01', issue: '门窗损坏，需要更换', status: '已完成' },
  { repairNo: 'BX20260910001', zone: '江田镇', assetName: '朝阳农贸市场1号厅', assetCode: 'ZC2024040-01', address: '长乐区江田镇朝阳路88号1号厅', company: '旅游开发投资有限公司', reporter: '孙老板', reporterPhone: '13500135001', reportDate: '2026-09-10', issue: '照明灯不亮', status: '已完成' }
])

const repairMgmtList = ref([
  { repairNo: 'WX20260902001', zone: '吴航街道', assetName: '阳光花园1号楼101室', assetCode: 'ZC2024001-0101', address: '长乐区吴航街道阳光花园小区1号楼101室', company: '城市建设投资有限公司', reporter: '张三', reporterPhone: '13800138001', content: '空调漏水，需要维修', photoCount: 3, submitTime: '2026-09-02 10:20:00', auditStatus: '已通过', surveyor: '勘查员-陈志强' },
  { repairNo: 'WX20260903001', zone: '航城街道', assetName: '万达广场商铺A101', assetCode: 'ZC2024010-A101', address: '长乐区航城街道万达广场A座101铺', company: '置业发展有限公司', reporter: '王经理', reporterPhone: '13900139001', content: '电梯故障，无法运行', photoCount: 5, submitTime: '2026-09-03 09:15:00', auditStatus: '待审核', surveyor: '' },
  { repairNo: 'WX20260905001', zone: '营前镇', assetName: '国贸写字楼A座1501', assetCode: 'ZC2024020-1501', address: '长乐区营前镇国贸中心A座1501室', company: '置业发展有限公司', reporter: '刘总', reporterPhone: '13700137001', content: '卫生间水管破裂', photoCount: 2, submitTime: '2026-09-05 14:40:00', auditStatus: '待审核', surveyor: '' },
  { repairNo: 'WX20260901001', zone: '玉田镇', assetName: '高新技术产业园厂房C1', assetCode: 'ZC2024030-C1', address: '长乐区玉田镇高新技术产业园C1厂房', company: '物业管理服务有限公司', reporter: '陈厂长', reporterPhone: '13600136001', content: '门窗损坏，需要更换', photoCount: 4, submitTime: '2026-09-01 16:05:00', auditStatus: '已通过', surveyor: '勘查员-林晓' },
  { repairNo: 'WX20260910001', zone: '江田镇', assetName: '朝阳农贸市场1号厅', assetCode: 'ZC2024040-01', address: '长乐区江田镇朝阳路88号1号厅', company: '旅游开发投资有限公司', reporter: '孙老板', reporterPhone: '13500135001', content: '照明灯不亮', photoCount: 1, submitTime: '2026-09-10 11:30:00', auditStatus: '已驳回', surveyor: '勘查员-黄伟' }
])

const workOrderList = ref([
  { orderNo: 'GD20260902001', repairNo: 'BX20260902001', assetName: '阳光花园1号楼101室', company: '城市建设投资有限公司', handler: '维修工A', handlerPhone: '13100131001', assignDate: '2026-09-02', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260903001', repairNo: 'BX20260903001', assetName: '万达广场商铺A101', company: '置业发展有限公司', handler: '维修工B', handlerPhone: '13100131002', assignDate: '2026-09-03', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260905001', repairNo: 'BX20260905001', assetName: '国贸写字楼A座1501', company: '置业发展有限公司', handler: '维修工C', handlerPhone: '13100131003', assignDate: '2026-09-05', completeDate: '-', status: '处理中' },
  { orderNo: 'GD20260901001', repairNo: 'BX20260901001', assetName: '高新技术产业园厂房C1', company: '物业管理服务有限公司', handler: '维修工D', handlerPhone: '13100131004', assignDate: '2026-09-01', completeDate: '2026-09-02', status: '已完成' },
  { orderNo: 'GD20260910001', repairNo: 'BX20260910001', assetName: '朝阳农贸市场1号厅', company: '旅游开发投资有限公司', handler: '维修工E', handlerPhone: '13100131005', assignDate: '2026-09-10', completeDate: '2026-09-11', status: '已完成' }
])

const planList = ref([
  { planNo: 'JH20260901001', scope: '阳光花园1号楼及周边商铺', cycle: '2026-09-01 ~ 2026-09-30', owner: '李四', status: '进行中', remark: '每月全覆盖巡查一次' },
  { planNo: 'JH20260905001', scope: '万达广场商铺A座', cycle: '2026-09-05 ~ 2026-10-05', owner: '王五', status: '进行中', remark: '重点关注消防通道' },
  { planNo: 'JH20260910001', scope: '国贸写字楼A座', cycle: '2026-09-10 ~ 2026-12-10', owner: '赵六', status: '未开始', remark: '季度计划' },
  { planNo: 'JH20260915001', scope: '朝阳农贸市场', cycle: '2026-09-15 ~ 2026-10-15', owner: '王五', status: '未开始', remark: '' },
  { planNo: 'JH20260801001', scope: '高新技术产业园厂房', cycle: '2026-08-01 ~ 2026-08-31', owner: '李四', status: '已完成', remark: '上月计划已归档' }
])

const orderDialogVisible = ref(false)
const inspectionDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const reportingInspectionNo = ref('')

const inspectionDetailVisible = ref(false)
const currentInspection = ref(null)
const repairDetailVisible = ref(false)
const currentRepair = ref(null)
const mgmtDetailVisible = ref(false)
const currentMgmt = ref(null)
const orderDetailVisible = ref(false)
const currentOrder = ref(null)

const orderForm = reactive({
  repairNo: '',
  handler: '',
  handlerPhone: '',
  estimateDate: '',
  remark: ''
})

const inspectionForm = reactive({
  assetId: '',
  inspector: '',
  inspectionDate: '',
  content: ''
})

const reportForm = reactive({
  issueType: '',
  description: '',
  urgency: '一般'
})

const pendingRepairList = computed(() => repairList.value.filter(r => r.status === '待处理').map(r => ({ repairNo: r.repairNo, assetName: r.assetName })))

const assetOptions = ref([
  { code: 'ZC2024001', name: '阳光花园1号楼', type: '保障房', zone: '吴航街道', address: '长乐区吴航街道阳光花园小区', company: '城市建设投资有限公司' },
  { code: 'ZC2024010', name: '万达广场商铺A座', type: '商铺', zone: '航城街道', address: '长乐区航城街道万达广场A座', company: '置业发展有限公司' },
  { code: 'ZC2024020', name: '国贸写字楼A座', type: '写字楼', zone: '营前镇', address: '长乐区营前镇国贸中心A座', company: '置业发展有限公司' },
  { code: 'ZC2024030', name: '高新技术产业园厂房', type: '厂房', zone: '玉田镇', address: '长乐区玉田镇高新技术产业园C区', company: '物业管理服务有限公司' },
  { code: 'ZC2024040', name: '朝阳农贸市场', type: '农贸市场', zone: '江田镇', address: '长乐区江田镇朝阳路88号', company: '旅游开发投资有限公司' }
])

const projectOptions = ref([
  { code: 'PRJ2024001', name: '航城商务楼改造项目', type: '改造项目', zone: '航城片区', address: '长乐区航城街道商务楼', company: '城市建设投资有限公司' },
  { code: 'PRJ2024002', name: '阳光花园保障房二期项目', type: '保障房项目', zone: '吴航片区', address: '长乐区吴航街道阳光花园西侧', company: '城市建设投资有限公司' },
  { code: 'PRJ2024003', name: '滨海旅游集散中心项目', type: '文旅项目', zone: '江田片区', address: '长乐区江田镇滨海大道', company: '旅游开发投资有限公司' },
  { code: 'PRJ2024004', name: '营前标准厂房三期项目', type: '厂房项目', zone: '营前片区', address: '长乐区营前镇工业园', company: '置业发展有限公司' }
])

const inRange = (dateStr, range) => {
  if (!range || range.length !== 2 || !range[0] || !range[1]) return true
  const d = String(dateStr || '').slice(0, 10)
  return d >= range[0] && d <= range[1]
}

const filteredInspectionList = computed(() => {
  return inspectionList.value.filter(item => {
    if (inspFilter.keyword && !(item.inspectionNo.includes(inspFilter.keyword) || item.assetName.includes(inspFilter.keyword) || item.inspector.includes(inspFilter.keyword))) return false
    if (!inRange(item.inspectionDate, inspFilter.dateRange)) return false
    if (inspFilter.status && item.status !== inspFilter.status) return false
    if (inspFilter.company && item.company !== inspFilter.company) return false
    return true
  })
})

const filteredProjectList = computed(() => {
  return projectInspections.value.filter(item => {
    if (projFilter.keyword && !(item.inspectionNo.includes(projFilter.keyword) || item.assetName.includes(projFilter.keyword) || item.inspector.includes(projFilter.keyword))) return false
    if (!inRange(item.inspectionDate, projFilter.dateRange)) return false
    if (projFilter.company && item.company !== projFilter.company) return false
    return true
  })
})

const filteredRepairList = computed(() => {
  return repairList.value.filter(item => {
    if (repairFilter.keyword && !(item.repairNo.includes(repairFilter.keyword) || item.assetName.includes(repairFilter.keyword) || item.reporter.includes(repairFilter.keyword))) return false
    if (!inRange(item.reportDate, repairFilter.dateRange)) return false
    if (repairFilter.company && item.company !== repairFilter.company) return false
    return true
  })
})

const filteredMgmtList = computed(() => {
  return repairMgmtList.value.filter(item => {
    if (mgmtFilter.keyword && !(item.reporter.includes(mgmtFilter.keyword) || item.reporterPhone.includes(mgmtFilter.keyword))) return false
    if (!inRange(item.submitTime, mgmtFilter.dateRange)) return false
    if (mgmtFilter.status && item.auditStatus !== mgmtFilter.status) return false
    if (mgmtFilter.company && item.company !== mgmtFilter.company) return false
    return true
  })
})

const filteredWorkOrderList = computed(() => {
  return workOrderList.value.filter(item => {
    if (woFilter.keyword && !(item.orderNo.includes(woFilter.keyword) || item.assetName.includes(woFilter.keyword) || item.handler.includes(woFilter.keyword))) return false
    if (!inRange(item.assignDate, woFilter.dateRange)) return false
    if (woFilter.company && item.company !== woFilter.company) return false
    return true
  })
})

const filteredPlanList = computed(() => {
  return planList.value.filter(item => {
    if (planFilter.keyword && !(item.planNo.includes(planFilter.keyword) || item.scope.includes(planFilter.keyword) || item.owner.includes(planFilter.keyword))) return false
    if (planFilter.status && item.status !== planFilter.status) return false
    return true
  })
})

const inspPage = ref(1)
const inspSize = ref(15)
const pagedInspections = computed(() => slicePage(filteredInspectionList.value, inspPage.value, inspSize.value))

const projPage = ref(1)
const projSize = ref(15)
const pagedProjects = computed(() => slicePage(filteredProjectList.value, projPage.value, projSize.value))

const repairPage = ref(1)
const repairSize = ref(15)
const pagedRepairs = computed(() => slicePage(filteredRepairList.value, repairPage.value, repairSize.value))

const mgmtPage = ref(1)
const mgmtSize = ref(15)
const pagedMgmt = computed(() => slicePage(filteredMgmtList.value, mgmtPage.value, mgmtSize.value))

const woPage = ref(1)
const woSize = ref(15)
const pagedWorkOrders = computed(() => slicePage(filteredWorkOrderList.value, woPage.value, woSize.value))

const planPage = ref(1)
const planSize = ref(15)
const pagedPlans = computed(() => slicePage(filteredPlanList.value, planPage.value, planSize.value))

function slicePage(list, page, size) {
  const start = Math.min((page - 1) * size, Math.max(0, list.length - size))
  return list.slice(start, start + size)
}

const getStatusType = (status) => {
  const map = { '已完成': 'success', '进行中': 'warning', '待巡查': 'info' }
  return map[status] || 'info'
}

const getRepairStatusType = (status) => {
  const map = { '待处理': 'warning', '处理中': 'primary', '已完成': 'success' }
  return map[status] || 'info'
}

const getWorkOrderStatusType = (status) => {
  const map = { '待处理': 'warning', '处理中': 'primary', '已完成': 'success' }
  return map[status] || 'info'
}

const getAuditStatusType = (status) => {
  const map = { '待审核': 'warning', '已通过': 'success', '已驳回': 'danger' }
  return map[status] || 'info'
}

const handleSearch = () => {
  if (activeTab.value === 'inspection') inspPage.value = 1
  else if (activeTab.value === 'project') projPage.value = 1
  else if (activeTab.value === 'repair') repairPage.value = 1
  else if (activeTab.value === 'mgmt') mgmtPage.value = 1
  else if (activeTab.value === 'plan') planPage.value = 1
  else woPage.value = 1
}

const handleReset = () => {
  if (activeTab.value === 'inspection') Object.assign(inspFilter, { keyword: '', dateRange: [], status: '', company: '' })
  else if (activeTab.value === 'project') Object.assign(projFilter, { keyword: '', dateRange: [], company: '' })
  else if (activeTab.value === 'repair') Object.assign(repairFilter, { keyword: '', dateRange: [], company: '' })
  else if (activeTab.value === 'mgmt') Object.assign(mgmtFilter, { keyword: '', dateRange: [], status: '', company: '' })
  else if (activeTab.value === 'plan') Object.assign(planFilter, { keyword: '', status: '' })
  else Object.assign(woFilter, { keyword: '', dateRange: [], company: '' })
  handleSearch()
}

const handleExport = (name) => {
  let headers, rows
  if (activeTab.value === 'inspection') {
    headers = ['分区', '资产名称', '资产编号', '资产座落', '所属公司', '巡查编号', '巡查人', '巡查日期', '状态', '发现问题数']
    rows = filteredInspectionList.value.map(r => [r.zone, r.assetName, r.assetCode, r.address, r.company, r.inspectionNo, r.inspector, r.inspectionDate, r.status, r.issueCount])
  } else if (activeTab.value === 'project') {
    headers = ['分区', '项目名称', '项目编号', '项目座落', '所属公司', '巡查编号', '巡查人', '巡查日期', '状态', '发现问题数']
    rows = filteredProjectList.value.map(r => [r.zone, r.assetName, r.assetCode, r.address, r.company, r.inspectionNo, r.inspector, r.inspectionDate, r.status, r.issueCount])
  } else if (activeTab.value === 'repair') {
    headers = ['分区', '资产名称', '资产编号', '资产座落', '所属公司', '报修编号', '报修人', '联系电话', '报修日期', '问题描述', '状态']
    rows = filteredRepairList.value.map(r => [r.zone, r.assetName, r.assetCode, r.address, r.company, r.repairNo, r.reporter, r.reporterPhone, r.reportDate, r.issue, r.status])
  } else if (activeTab.value === 'mgmt') {
    headers = ['报修编号', '分区', '资产名称', '资产编号', '资产座落', '所属公司', '报修人姓名', '联系电话', '维修内容', '提交时间', '审核状态', '勘查人员']
    rows = filteredMgmtList.value.map(r => [r.repairNo, r.zone, r.assetName, r.assetCode, r.address, r.company, r.reporter, r.reporterPhone, r.content, r.submitTime, r.auditStatus, r.surveyor])
  } else if (activeTab.value === 'workorder') {
    headers = ['工单编号', '关联报修', '资产名称', '所属公司', '处理人', '联系电话', '派单日期', '完成日期', '状态']
    rows = filteredWorkOrderList.value.map(r => [r.orderNo, r.repairNo, r.assetName, r.company, r.handler, r.handlerPhone, r.assignDate, r.completeDate || '-', r.status])
  } else if (activeTab.value === 'plan') {
    headers = ['计划编号', '巡查范围', '计划周期', '负责人', '状态']
    rows = filteredPlanList.value.map(r => [r.planNo, r.scope, r.cycle, r.owner, r.status])
  } else {
    headers = []; rows = []
  }
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handleCreateOrder = () => {
  orderDialogVisible.value = true
}

const handleOrderSubmit = () => {
  if (!orderForm.repairNo || !orderForm.handler) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const repair = repairList.value.find(r => r.repairNo === orderForm.repairNo)
  workOrderList.value.unshift({
    orderNo: 'GD' + Date.now().toString().slice(-10),
    repairNo: orderForm.repairNo,
    assetName: repair ? repair.assetName : '',
    company: repair ? repair.company : '',
    handler: orderForm.handler,
    handlerPhone: orderForm.handlerPhone,
    assignDate: new Date().toISOString().slice(0, 10),
    completeDate: '-',
    status: '处理中'
  })
  if (repair) {
    repair.status = '处理中'
  }
  orderDialogVisible.value = false
  ElMessage.success('派单成功')
  Object.assign(orderForm, { repairNo: '', handler: '', handlerPhone: '', estimateDate: '', remark: '' })
}

const handleCreateInspection = () => {
  inspectionDialogVisible.value = true
}

const handleInspectionSubmit = () => {
  if (!inspectionForm.assetId || !inspectionForm.inspector || !inspectionForm.inspectionDate) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const asset = assetOptions.value.find(a => a.code === inspectionForm.assetId)
  inspectionList.value.unshift({
    inspectionNo: 'XC' + Date.now().toString().slice(-10),
    zone: asset ? asset.zone : '',
    assetName: asset ? asset.name : inspectionForm.assetId,
    assetCode: asset ? asset.code : '',
    address: asset ? asset.address : '',
    company: asset ? asset.company : '',
    assetType: asset ? asset.type : '',
    inspector: inspectionForm.inspector,
    inspectionDate: typeof inspectionForm.inspectionDate === 'string' ? inspectionForm.inspectionDate : inspectionForm.inspectionDate.toISOString().slice(0, 10),
    status: '待巡查',
    issueCount: 0
  })
  inspectionDialogVisible.value = false
  ElMessage.success('创建巡查成功')
  Object.assign(inspectionForm, { assetId: '', inspector: '', inspectionDate: '', content: '' })
}

const uploadVisible = ref(false)
const uploadTarget = ref(null)
const uploadForm = reactive({ inspector: '', detail: '' })
const uploadFileList = ref([])

const openUpload = (target) => {
  uploadTarget.value = target
  uploadForm.inspector = ''
  uploadForm.detail = ''
  uploadFileList.value = []
  uploadVisible.value = true
}

const openUploadForInspection = (row) => {
  openUpload({ name: row.assetName, type: row.assetType, zone: row.zone, code: row.assetCode, address: row.address, company: row.company })
}

const handleCreateInspectionInfo = () => {
  if (activeTab.value === 'project') {
    const p = projectOptions.value[0]
    openUpload({ name: p.name, type: p.type, zone: p.zone, code: p.code, address: p.address, company: p.company })
  } else {
    const a = assetOptions.value[0]
    openUpload({ name: a.name, type: a.type, zone: a.zone, code: a.code, address: a.address, company: a.company })
  }
}

const submitUpload = (andRepair) => {
  if (!uploadForm.inspector) {
    ElMessage.warning('请填写巡查人员')
    return
  }
  const t = uploadTarget.value
  const today = new Date().toISOString().slice(0, 10)
  const record = {
    inspectionNo: (activeTab.value === 'project' ? 'XM' : 'XC') + Date.now().toString().slice(-10),
    zone: t.zone,
    assetName: t.name,
    assetCode: t.code,
    address: t.address,
    company: t.company,
    assetType: t.type,
    inspector: uploadForm.inspector,
    inspectionDate: today,
    status: '已完成',
    issueCount: andRepair ? 1 : 0
  }
  if (activeTab.value === 'project') projectInspections.value.unshift(record)
  else inspectionList.value.unshift(record)
  if (andRepair) {
    const bxNo = 'BX' + Date.now().toString().slice(-10)
    const now = new Date().toLocaleString('zh-CN', { hour12: false })
    const issue = uploadForm.detail || '巡查发现问题，需维修处理'
    repairList.value.unshift({
      repairNo: bxNo, zone: t.zone, assetName: t.name, assetCode: t.code, address: t.address, company: t.company,
      reporter: uploadForm.inspector, reporterPhone: '13800138000', reportDate: today, issue, status: '待处理'
    })
    repairMgmtList.value.unshift({
      repairNo: bxNo.replace('BX', 'WX'), zone: t.zone, assetName: t.name, assetCode: t.code, address: t.address, company: t.company,
      reporter: uploadForm.inspector, reporterPhone: '13800138000', content: issue, photoCount: uploadFileList.value.length,
      submitTime: now, auditStatus: '待审核', surveyor: ''
    })
    ElMessage.success('已提交并生成报修记录')
  } else {
    ElMessage.success('巡查信息已提交')
  }
  uploadVisible.value = false
}

const repairReqVisible = ref(false)
const repairReqForm = reactive({ assetCode: '', contact: '', phone: '', desc: '' })
const repairReqFiles = ref([])

const openRepairReq = () => {
  Object.assign(repairReqForm, { assetCode: '', contact: '', phone: '', desc: '' })
  repairReqFiles.value = []
  repairReqVisible.value = true
}

const submitRepairRequest = () => {
  if (!repairReqForm.assetCode) {
    ElMessage.warning('请选择报修资产')
    return
  }
  if (!repairReqForm.contact || !repairReqForm.phone) {
    ElMessage.warning('请填写联系人和联系电话')
    return
  }
  const asset = assetOptions.value.find(a => a.code === repairReqForm.assetCode) || assetOptions.value[0]
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  const bxNo = 'BX' + Date.now().toString().slice(-10)
  const issue = repairReqForm.desc || '现场报修，待勘查'
  repairList.value.unshift({
    repairNo: bxNo, zone: asset.zone, assetName: asset.name, assetCode: asset.code, address: asset.address, company: asset.company,
    reporter: repairReqForm.contact, reporterPhone: repairReqForm.phone, reportDate: today, issue, status: '待处理'
  })
  repairMgmtList.value.unshift({
    repairNo: bxNo.replace('BX', 'WX'), zone: asset.zone, assetName: asset.name, assetCode: asset.code, address: asset.address, company: asset.company,
    reporter: repairReqForm.contact, reporterPhone: repairReqForm.phone, content: issue, photoCount: repairReqFiles.value.length,
    submitTime: now, auditStatus: '待审核', surveyor: ''
  })
  repairReqVisible.value = false
  ElMessage.success('报修已提交')
}

const auditVisible = ref(false)
const auditRow = ref(null)
const auditForm = reactive({ status: '通过', surveyor: '' })
const surveyorOptions = ['勘查员-陈志强', '勘查员-林晓', '勘查员-黄伟', '工程勘查-刘工']

const openAudit = (row) => {
  auditRow.value = row
  auditForm.status = '通过'
  auditForm.surveyor = ''
  auditVisible.value = true
}

const submitAudit = () => {
  if (!auditForm.surveyor) {
    ElMessage.warning('请选择勘查人员')
    return
  }
  auditRow.value.auditStatus = auditForm.status === '通过' ? '已通过' : '已驳回'
  auditRow.value.surveyor = auditForm.surveyor
  auditVisible.value = false
  ElMessage.success('审核完成')
}

const handleViewInspection = (row) => {
  currentInspection.value = row
  inspectionDetailVisible.value = true
}

const handleReport = (row) => {
  reportingInspectionNo.value = row.inspectionNo
  reportDialogVisible.value = true
}

const handleReportSubmit = () => {
  if (!reportForm.issueType || !reportForm.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const inspection = inspectionList.value.find(i => i.inspectionNo === reportingInspectionNo.value)
  if (inspection) {
    inspection.issueCount++
  }
  reportDialogVisible.value = false
  ElMessage.success('问题上报成功')
  Object.assign(reportForm, { issueType: '', description: '', urgency: '一般' })
}

const handleCompleteInspection = (row) => {
  ElMessageBox.confirm(`确定要完成巡查"${row.inspectionNo}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已完成'
    ElMessage.success('巡查已完成')
  }).catch(() => {})
}

const handleViewRepair = (row) => {
  currentRepair.value = row
  repairDetailVisible.value = true
}

const handleViewMgmt = (row) => {
  currentMgmt.value = row
  mgmtDetailVisible.value = true
}

const handleAssign = (row) => {
  orderForm.repairNo = row.repairNo
  orderDialogVisible.value = true
}

const handleCompleteRepair = (row) => {
  ElMessageBox.confirm(`确定要完成报修"${row.repairNo}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已完成'
    ElMessage.success('报修已完成')
  }).catch(() => {})
}

const handleViewOrder = (row) => {
  currentOrder.value = row
  orderDetailVisible.value = true
}

const handleCompleteOrder = (row) => {
  ElMessageBox.confirm(`确定要完成工单"${row.orderNo}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = '已完成'
    row.completeDate = new Date().toISOString().slice(0, 10)
    ElMessage.success('工单已完成')
  }).catch(() => {})
}

const planDialogVisible = ref(false)
const planForm = reactive({ scope: '', cycleRange: [], owner: '', remark: '' })
const planDetailVisible = ref(false)
const currentPlan = ref(null)

const openPlanDialog = () => {
  Object.assign(planForm, { scope: '', cycleRange: [], owner: '', remark: '' })
  planDialogVisible.value = true
}

const handlePlanSubmit = () => {
  if (!planForm.scope || !planForm.owner || !planForm.cycleRange || planForm.cycleRange.length !== 2) {
    ElMessage.warning('请填写完整信息')
    return
  }
  planList.value.unshift({
    planNo: 'JH' + Date.now().toString().slice(-10),
    scope: planForm.scope,
    cycle: planForm.cycleRange[0] + ' ~ ' + planForm.cycleRange[1],
    owner: planForm.owner,
    status: '未开始',
    remark: planForm.remark
  })
  planDialogVisible.value = false
  ElMessage.success('创建计划成功')
}

const handleViewPlan = (row) => {
  currentPlan.value = row
  planDetailVisible.value = true
}

const handleDeletePlan = (row) => {
  ElMessageBox.confirm(`确定要删除巡查计划"${row.planNo}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const idx = planList.value.indexOf(row)
    if (idx > -1) planList.value.splice(idx, 1)
    ElMessage.success('计划已删除')
  }).catch(() => {})
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}

.search-form {
  margin-bottom: 8px;
}

.toolbar-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.upload-asset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-th);
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  margin-bottom: 16px;
}

.upload-asset .asset-name {
  font-weight: 600;
  color: var(--t-main);
}

.upload-asset .asset-addr {
  color: var(--t-weak);
  font-size: 12px;
}
</style>
