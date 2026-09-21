<template>
  <div class="ent-contract">
    <div class="page-header">
      <h2>合同管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">新增合同</el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="意向书台账" name="letter">
        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="意向书编号">
              <el-input v-model="letterFilter.no" placeholder="请输入" clearable style="width:150px" />
            </el-form-item>
            <el-form-item label="出租方">
              <el-input v-model="letterFilter.lessor" placeholder="请输入" clearable style="width:150px" />
            </el-form-item>
            <el-form-item label="承租方">
              <el-input v-model="letterFilter.lessee" placeholder="请输入" clearable style="width:150px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="letterPage = 1">查询</el-button>
              <el-button @click="letterFilter = { no: '', lessor: '', lessee: '' }">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="color:#475569;font-size:13px">共 <strong>{{ filteredLetters.length }}</strong> 条</span>
          <div>
            <el-button type="primary" size="small" @click="openLetterDialog()">新增</el-button>
            <el-button size="small" :disabled="letterSelection.length === 0" @click="batchEditLetters">编辑</el-button>
            <el-button type="danger" size="small" :disabled="letterSelection.length === 0" @click="batchDeleteLetters">删除</el-button>
            <el-button size="small" @click="exportLetters">导出</el-button>
            <el-button size="small" @click="showLetterImport = true">导入</el-button>
          </div>
        </div>
        <el-table :data="pagedLetters" border stripe @selection-change="letterSelection = $event">
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="意向书编号" width="140" />
          <el-table-column prop="lessor" label="出租方" min-width="150" />
          <el-table-column prop="lessee" label="承租方" min-width="160" />
          <el-table-column prop="assetName" label="意向资产" min-width="160" />
          <el-table-column prop="intentArea" label="意向面积(㎡)" width="150" align="right">
            <template #default="{ row }">
              {{ (row.intentArea || 0).toLocaleString() }}
              <el-tooltip v-if="letterAvailableOf(row) < (row.intentArea || 0)" content="该资产剩余可租面积已不足意向面积，转合同前需先调整意向书" placement="top">
                <el-tag type="danger" size="small">面积不足</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="意向租赁开始" width="120" />
          <el-table-column prop="endDate" label="意向租赁结束" width="120" />
          <el-table-column prop="intentAmount" label="意向金(万元)" width="120" align="right">
            <template #default="{ row }">{{ row.intentAmount ?? '—' }}</template>
          </el-table-column>
          <el-table-column prop="rentFreeType" label="免租类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.rentFreeType === '有' ? 'warning' : 'info'" size="small">{{ row.rentFreeType || '无' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="feeReduction" label="减免费用" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.feeReduction === '固定租金' ? 'primary' : 'success'" size="small">{{ row.feeReduction || '—' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="letterStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewLetter(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="openLetterDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="deleteLetter(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          style="margin-top:12px;justify-content:flex-end"
          background layout="total, prev, pager, next"
          :total="filteredLetters.length"
          :page-size="10"
          v-model:current-page="letterPage"
        />
      </el-tab-pane>

      <el-tab-pane label="合同列表" name="list">
        <div class="filter-bar" style="display:flex;justify-content:space-between;align-items:flex-start">
          <el-form :inline="true">
            <el-form-item label="状态">
              <el-select v-model="filterStatus" clearable placeholder="全部" style="width: 120px">
                <el-option label="正常" value="正常" />
                <el-option label="欠缴" value="欠缴" />
                <el-option label="临期" value="临期" />
                <el-option label="已到期" value="已到期" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="keyword" placeholder="搜索合同编号/承租方" clearable style="width: 200px" />
            </el-form-item>
          </el-form>
          <div>
            <el-tooltip content="勾选同一资产下的多份部分租赁合同，合并为一份合同" placement="top">
              <el-button type="primary" :disabled="mergeSelection.length < 2" @click="openMerge">合并租赁（{{ mergeSelection.length }}）</el-button>
            </el-tooltip>
          </div>
        </div>

        <el-table :data="filteredContracts" border stripe @selection-change="onContractSelect">
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column label="租赁面积(㎡)" width="150" align="right">
            <template #default="{ row }">
              <span>{{ (row.leaseArea || 0).toLocaleString() }}</span>
              <el-tooltip v-if="remainingOf(row) > 0" :content="`该资产仍有 ${remainingOf(row).toLocaleString()} ㎡ 可继续招租`" placement="top">
                <el-tag type="warning" size="small" style="margin-left:6px">部分租赁</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column label="租期" width="200">
            <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
          </el-table-column>
          <el-table-column prop="annualRent" label="年租金(万元)" width="110" align="right" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="电子签章" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.electronic ? 'success' : 'info'" size="small">{{ row.electronic ? '已签' : '未签' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="$router.push(`/ent/contract/${row.id}`)">详情</el-button>
              <el-button v-if="!row.electronic" type="warning" link @click="startSign(row)">签章</el-button>
              <el-button v-if="row.status === '正常'" type="success" link @click="handleArchive(row)">归档</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="合同模板" name="templates">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:600;font-size:14px">预置合同模板</span>
          <el-button type="primary" size="small" @click="openNewTemplate">新增模板</el-button>
        </div>
        <el-table :data="templates" border stripe>
          <el-table-column prop="name" label="模板名称" min-width="200" />
          <el-table-column prop="type" label="适用类型" width="120" />
          <el-table-column prop="version" label="版本" width="80" align="center" />
          <el-table-column prop="updateTime" label="更新时间" width="120" />
          <el-table-column prop="useCount" label="使用次数" width="90" align="center" />
          <el-table-column label="操作" width="240" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="previewTemplate(row)">预览</el-button>
              <el-button type="warning" link size="small" @click="editTemplate(row)">编辑</el-button>
              <el-button type="success" link size="small" @click="useTemplate(row)">使用</el-button>
              <el-button type="danger" link size="small" @click="deleteTemplate(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="电子签章" name="esign">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ signStats.total }}</div>
              <div class="kpi-label">已签署合同</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ signStats.pending }}</div>
              <div class="kpi-label">待签署</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ signStats.expired }}</div>
              <div class="kpi-label">签章过期</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ signStats.rate }}</div>
              <div class="kpi-label">电子签约率(%)</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="pendingSignContracts" border stripe>
          <el-table-column prop="id" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="tenant" label="承租方" min-width="160" />
          <el-table-column prop="annualRent" label="年租金(万元)" width="110" align="right" />
          <el-table-column label="签章状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.electronic ? 'success' : 'warning'" size="small">{{ row.electronic ? '已签署' : '待签署' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button v-if="!row.electronic" type="primary" link size="small" @click="startSign(row)">发起签署</el-button>
              <el-button type="primary" link size="small" @click="previewSign(row)">预览合同</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="合同归档" name="archive">
        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="归档年份">
              <el-select v-model="archiveYear" clearable placeholder="全部" style="width:120px">
                <el-option label="2026" value="2026" />
                <el-option label="2025" value="2025" />
                <el-option label="2024" value="2024" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="archiveKeyword" placeholder="搜索合同编号/承租方" clearable style="width:200px" />
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredArchives" border stripe>
          <el-table-column prop="id" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="tenant" label="承租方" min-width="160" />
          <el-table-column prop="archiveDate" label="归档日期" width="120" />
          <el-table-column prop="archiveNo" label="归档编号" width="140" />
          <el-table-column prop="storageType" label="存储方式" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.storageType }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewArchive(row)">查看</el-button>
              <el-button type="warning" link size="small" @click="unarchive(row)">退回</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="合同审批" name="approval">
        <div class="ac-dash">
          <div class="ac-dash-left">
            <el-progress type="circle" :percentage="70.18" :width="104" :stroke-width="8" />
            <div class="ac-dash-cap">合规率</div>
          </div>
          <div class="ac-dash-main">
            <div class="ac-alert">
              <el-icon color="#E8912A"><WarningFilled /></el-icon>
              即将到期 <span class="ac-red">{{ acStats.expiring }}</span>
              待处理 <span class="ac-red">{{ acStats.pending }}</span>
              涉及资产 <span>{{ acStats.assets }}</span>
              查询时间 <span>{{ acQueryTime }}</span>
            </div>
            <div class="ac-mini-cards">
              <div v-for="card in acCards" :key="card.label" class="ac-mini" @click="drillAc(card)">
                <el-icon :size="22" :color="card.color"><component :is="card.icon" /></el-icon>
                <div class="ac-mini-body">
                  <div class="ac-mini-value">{{ card.value }}</div>
                  <div class="ac-mini-label">{{ card.label }}</div>
                </div>
                <el-icon class="ac-mini-arrow" :size="12"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
          <el-button class="ac-refresh" circle :icon="Refresh" title="刷新" @click="refreshAc" />
        </div>

        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item>
              <el-input v-model="acFilter.keyword" placeholder="承租人/手机号/合同编号" clearable style="width:200px" />
            </el-form-item>
            <el-form-item label="公司">
              <el-select v-model="acFilter.company" clearable placeholder="全部" style="width:130px">
                <el-option v-for="c in acCompanyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="合同状态">
              <el-select v-model="acFilter.status" clearable placeholder="全部" style="width:120px">
                <el-option label="待审批" value="待审批" />
                <el-option label="审批中" value="审批中" />
                <el-option label="审批完成" value="审批完成" />
                <el-option label="已作废" value="已作废" />
              </el-select>
            </el-form-item>
            <el-form-item label="租金类型">
              <el-select v-model="acFilter.rentType" clearable placeholder="全部" style="width:120px">
                <el-option label="固定租金" value="固定租金" />
                <el-option label="递增租金" value="递增租金" />
              </el-select>
            </el-form-item>
            <el-form-item label="合同类型">
              <el-select v-model="acFilter.contractType" clearable placeholder="全部" style="width:130px">
                <el-option label="资产租赁" value="资产租赁" />
                <el-option label="续租合同" value="续租合同" />
                <el-option label="意向转合同" value="意向转合同" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="acPage = 1">查询</el-button>
            </el-form-item>
          </el-form>
          <div class="ac-toolbar">
            <el-button size="small" :icon="Download" @click="acDownloadTemplate">下载导入模板</el-button>
            <el-button size="small" :icon="Upload" @click="acImport">导入</el-button>
            <el-button size="small" :icon="FolderAdd" :disabled="acSelection.length === 0" @click="acBatchAssign">批量分配</el-button>
            <el-button size="small" :icon="CircleClose" :disabled="acSelection.length === 0" @click="acBatchVoid">批量作废</el-button>
            <el-button size="small" type="primary" plain :icon="FolderChecked" @click="acExportApproved">审批完成导出</el-button>
          </div>
        </div>

        <el-table :data="pagedAcContracts" border stripe @selection-change="acSelection = $event">
          <el-table-column type="expand" width="45">
            <template #default="{ row }">
              <div class="ac-expand">
                <div class="section-title">合同信息</div>
                <div class="detail-grid">
                  <div class="cell"><div class="label">乙方手机号</div><div class="value">{{ row.phone }}</div></div>
                  <div class="cell"><div class="label">合同类型</div><div class="value">{{ row.contractType }}</div></div>
                  <div class="cell"><div class="label">租金类型</div><div class="value">{{ row.rentType }}</div></div>
                  <div class="cell"><div class="label">缴费周期</div><div class="value">{{ row.payCycle }}</div></div>
                  <div class="cell"><div class="label">交费截至时间</div><div class="value">{{ row.payDeadline }}</div></div>
                  <div class="cell"><div class="label">月租金(元)</div><div class="value">{{ row.monthlyRent.toLocaleString() }}</div></div>
                  <div class="cell"><div class="label">总减免金额(元)</div><div class="value">{{ row.reduction.toLocaleString() }}</div></div>
                  <div class="cell"><div class="label">当前欠缴</div><div class="value">{{ row.arrearsMonths > 0 ? row.arrearsMonths + '个月未缴' : '—' }}</div></div>
                  <div class="cell"><div class="label">审批流程</div><div class="value">{{ row.flow }}</div></div>
                  <div class="cell">
                    <div class="label">附件</div>
                    <div class="value">
                      <el-button v-if="row.attachment" type="primary" link size="small" :icon="Paperclip" @click="acPreviewFile(row)">{{ row.attachment }}</el-button>
                      <span v-else>—</span>
                    </div>
                  </div>
                </div>
                <div class="section-title">资产信息</div>
                <el-table :data="row.assets" border size="small">
                  <el-table-column prop="region" label="省市区" min-width="150" />
                  <el-table-column prop="project" label="项目" min-width="130" />
                  <el-table-column prop="zone" label="分区" width="80" />
                  <el-table-column prop="name" label="资产名称" min-width="140" />
                  <el-table-column prop="code" label="资产编号" width="110" />
                  <el-table-column prop="location" label="资产座落" min-width="160" />
                  <el-table-column prop="company" label="所属公司" width="100" />
                  <el-table-column prop="leaseType" label="租赁类型" width="90" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="合同编号" width="130" fixed="left" />
          <el-table-column prop="partyA" label="甲方" width="150" show-overflow-tooltip />
          <el-table-column prop="partyB" label="乙方" width="150" show-overflow-tooltip />
          <el-table-column label="租期" width="170">
            <template #default="{ row }">{{ row.signDate }} 至 {{ row.endDate }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="acStatusType(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="center" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openAcDetail(row)">详情</el-button>
              <el-button v-if="row.status === '待审批' || row.status === '审批中'" type="warning" link size="small" @click="openAcApprove(row)">审批</el-button>
              <el-dropdown style="margin-left:8px;vertical-align:middle" @command="cmd => handleAcCommand(cmd, row)">
                <el-button type="primary" link size="small" :icon="MoreFilled" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="preview">合同预览</el-dropdown-item>
                    <el-dropdown-item command="renew">续租</el-dropdown-item>
                    <el-dropdown-item command="refund">退租(退款)</el-dropdown-item>
                    <el-dropdown-item command="terminate">断租</el-dropdown-item>
                    <el-dropdown-item command="assign">分配</el-dropdown-item>
                    <el-dropdown-item command="void">作废</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredAcContracts.length"
            :page-sizes="[10, 20, 50]"
            v-model:current-page="acPage"
            v-model:page-size="acPageSize"
          />
        </div>

        <div class="section-title" style="margin-top:20px">审批流程跟踪</div>
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ approvalStats.pending }}</div>
              <div class="kpi-label">待审批</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#1668DC">{{ approvalStats.inProgress }}</div>
              <div class="kpi-label">审批中</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ approvalStats.approved }}</div>
              <div class="kpi-label">已通过</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#D93026">{{ approvalStats.rejected }}</div>
              <div class="kpi-label">已驳回</div>
            </el-card>
          </el-col>
        </el-row>

        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="审批状态">
              <el-select v-model="approvalFilter" clearable placeholder="全部" style="width:130px">
                <el-option label="待审批" value="待审批" />
                <el-option label="审批中" value="审批中" />
                <el-option label="已通过" value="已通过" />
                <el-option label="已驳回" value="已驳回" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredApprovals" border stripe>
          <el-table-column prop="leaseNo" label="租赁编号" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="tenant" label="承租方" min-width="180" />
          <el-table-column label="租期" width="200">
            <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
          </el-table-column>
          <el-table-column prop="annualRent" label="年租金(万元)" width="110" align="right" />
          <el-table-column prop="applyTime" label="申请时间" width="120" />
          <el-table-column prop="status" label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="approvalStatusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewApproval(row)">审批进度</el-button>
              <el-button v-if="row.status === '待审批' || row.status === '审批中'" type="success" link size="small" @click="openApprove(row)">审批</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="续租/退租" name="settlement">
        <el-row :gutter="16" style="margin-bottom:16px">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#E8912A">{{ settlementStats.expiring }}</div>
              <div class="kpi-label">即将到期（30天内）</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#D93026">{{ settlementStats.expired }}</div>
              <div class="kpi-label">已到期未处理</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#18A058">{{ settlementStats.renewed }}</div>
              <div class="kpi-label">已续租</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="kpi-value" style="color:#722ed1">{{ settlementStats.terminated }}</div>
              <div class="kpi-label">已退租</div>
            </el-card>
          </el-col>
        </el-row>

        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="类型">
              <el-select v-model="settlementFilter" clearable placeholder="全部" style="width:130px">
                <el-option label="即将到期" value="即将到期" />
                <el-option label="已到期" value="已到期" />
                <el-option label="已续租" value="已续租" />
                <el-option label="已退租" value="已退租" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="settlementKeyword" placeholder="搜索合同编号/承租方" clearable style="width:200px" />
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredSettlements" border stripe>
          <el-table-column prop="id" label="合同编号" width="130" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="tenant" label="承租方" min-width="160" />
          <el-table-column label="租期" width="200">
            <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
          </el-table-column>
          <el-table-column prop="annualRent" label="年租金(万元)" width="110" align="right" />
          <el-table-column prop="deposit" label="保证金(万元)" width="110" align="right" />
          <el-table-column prop="arrears" label="欠费(万元)" width="100" align="right" />
          <el-table-column label="到期天数" width="100" align="center">
            <template #default="{ row }">
              <span :style="{ color: daysLeft(row) < 0 ? '#D93026' : daysLeft(row) <= 30 ? '#E8912A' : '#0F172A' }">
                {{ daysLeft(row) >= 0 ? daysLeft(row) + '天' : '已过期' + Math.abs(daysLeft(row)) + '天' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="settlementStatusType(row.settlementStatus)" size="small">{{ row.settlementStatus }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.settlementStatus === '即将到期' || row.settlementStatus === '已到期'" type="success" link size="small" @click="openSettlement(row, 'renew')">续租</el-button>
              <el-button v-if="row.settlementStatus === '即将到期' || row.settlementStatus === '已到期'" type="danger" link size="small" @click="openSettlement(row, 'terminate')">退租</el-button>
              <el-button v-if="row.settlementStatus === '已续租' || row.settlementStatus === '已退租'" type="primary" link size="small" @click="viewSettlementDetail(row)">结算单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="承租方台账" name="tenantLedger">
        <div class="filter-bar">
          <el-form :inline="true">
            <el-form-item label="承租方类型">
              <el-select v-model="tenantTypeFilter" clearable placeholder="全部" style="width:120px">
                <el-option label="企业" value="企业" />
                <el-option label="个人" value="个人" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-input v-model="tenantKeyword" placeholder="搜索名称/证件号/联系人" clearable style="width:220px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="openTenantDialog()">新增承租方</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="filteredTenants" border stripe>
          <el-table-column prop="tenantNo" label="承租方编号" width="140" />
          <el-table-column prop="name" label="承租方名称" min-width="200" />
          <el-table-column prop="type" label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === '企业' ? 'primary' : 'success'" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="idNo" label="证件号码" width="200" />
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column prop="contractCount" label="在租合同" width="90" align="center" />
          <el-table-column prop="registerTime" label="注册时间" width="120" />
          <el-table-column label="操作" width="200" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewTenant(row)">详情</el-button>
              <el-button type="warning" link size="small" @click="openTenantDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="deleteTenant(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 审批操作 -->
    <el-dialog v-model="showApproveDialog" title="合同审批" width="520px">
      <template v-if="currentApproval">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="租赁编号">{{ currentApproval.leaseNo }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentApproval.tenant }}</el-descriptions-item>
          <el-descriptions-item label="资产名称" :span="2">{{ currentApproval.assetName }}</el-descriptions-item>
          <el-descriptions-item label="年租金">{{ currentApproval.annualRent }} 万元</el-descriptions-item>
          <el-descriptions-item label="租期">{{ currentApproval.startDate }} ~ {{ currentApproval.endDate }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-width="90px">
          <el-form-item label="当前环节">
            <el-tag size="small">{{ currentApproval.steps.find(s => s.status === '进行中')?.name || '审批完成' }}</el-tag>
          </el-form-item>
          <el-form-item label="审批意见">
            <el-input v-model="approveOpinion" type="textarea" :rows="3" placeholder="请填写审批意见" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showApproveDialog = false">取消</el-button>
        <el-button type="danger" @click="submitApproval(false)">驳回</el-button>
        <el-button type="success" @click="submitApproval(true)">通过</el-button>
      </template>
    </el-dialog>

    <!-- 审批进度 -->
    <el-drawer v-model="showApprovalDrawer" title="审批进度" size="450px">
      <template v-if="currentApproval">
        <el-descriptions :column="1" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="租赁编号">{{ currentApproval.leaseNo }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentApproval.tenant }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="approvalStatusType(currentApproval.status)" size="small">{{ currentApproval.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-steps direction="vertical" :active="currentApproval.steps.filter(s => s.status === '已完成').length">
          <el-step
            v-for="step in currentApproval.steps"
            :key="step.name"
            :title="step.name"
            :description="`${step.handler} · ${step.time || '待处理'}`"
            :status="step.status === '已完成' ? 'success' : step.status === '进行中' ? 'process' : step.status === '已驳回' ? 'error' : 'wait'"
          />
        </el-steps>
      </template>
    </el-drawer>

    <!-- 承租方编辑 -->
    <el-dialog v-model="showTenantDialog" :title="tenantForm.isEdit ? '编辑承租方' : '新增承租方'" width="520px">
      <el-form :model="tenantForm" label-width="100px">
        <el-form-item label="承租方名称" required>
          <el-input v-model="tenantForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="tenantForm.type">
            <el-radio value="企业">企业</el-radio>
            <el-radio value="个人">个人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="tenantForm.type === '企业' ? '统一信用代码' : '身份证号'" required>
          <el-input v-model="tenantForm.idNo" placeholder="请输入证件号码" />
        </el-form-item>
        <el-form-item label="联系人" required>
          <el-input v-model="tenantForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="tenantForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTenantDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTenant">保存</el-button>
      </template>
    </el-dialog>

    <!-- 承租方详情 -->
    <el-drawer v-model="showTenantDrawer" title="承租方详情" size="480px">
      <template v-if="currentTenant">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="承租方编号">{{ currentTenant.tenantNo }}</el-descriptions-item>
          <el-descriptions-item label="名称">{{ currentTenant.name }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentTenant.type }}</el-descriptions-item>
          <el-descriptions-item label="证件号码">{{ currentTenant.idNo }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentTenant.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentTenant.phone }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentTenant.registerTime }}</el-descriptions-item>
        </el-descriptions>
        <el-divider>在租合同</el-divider>
        <el-table :data="tenantContracts" border size="small">
          <el-table-column prop="id" label="合同编号" width="120" />
          <el-table-column prop="assetName" label="资产名称" min-width="140" />
          <el-table-column prop="annualRent" label="年租金(万元)" width="100" align="right" />
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>

    <!-- 新增合同 -->
    <el-dialog v-model="showCreateDialog" title="新增合同" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="合同模板">
          <el-select v-model="createForm.templateId" placeholder="选择模板（可选）" style="width:100%" clearable @change="applyTemplate">
            <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同编号" required>
          <el-input v-model="createForm.id" placeholder="自动生成" disabled />
        </el-form-item>
        <el-form-item label="租赁资产" required>
          <el-select v-model="createForm.assetId" placeholder="请选择资产" style="width:100%" filterable @change="handleAssetPick">
            <el-option
              v-for="a in leasableAssets"
              :key="a.id"
              :label="`${a.name}（可租 ${availableOf(a).toLocaleString()} / ${a.area.toLocaleString()} ㎡）`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="租赁面积(㎡)" required>
          <el-input-number
            v-model="createForm.leaseArea"
            :min="0"
            :max="pickedAvailable"
            :precision="2"
            :step="100"
            style="width:100%"
            :disabled="!createForm.assetId"
          />
          <div class="area-hint" v-if="createForm.assetId">
            <template v-if="createForm.leaseArea > pickedAvailable">
              超出可租面积，最多 {{ pickedAvailable.toLocaleString() }} ㎡
            </template>
            <template v-else>
              合同生效后：已租 {{ (pickedLeased + (createForm.leaseArea || 0)).toLocaleString() }} ㎡，
              剩余可租 {{ (pickedAvailable - (createForm.leaseArea || 0)).toLocaleString() }} ㎡
              <el-tag
                v-if="createForm.leaseArea"
                :type="createForm.leaseArea < pickedAvailable ? 'warning' : 'success'"
                size="small"
              >{{ createForm.leaseArea < pickedAvailable ? '部分租赁，剩余面积可继续招租' : '整宗出租，资产将转为已出租' }}</el-tag>
            </template>
          </div>
          <div class="area-hint" v-else>先选择资产，系统按剩余可租面积校验（支持部分租赁）</div>
        </el-form-item>
        <el-form-item label="承租方" required>
          <el-select
            v-model="createForm.tenant"
            placeholder="从客商档案选择承租方（可输入新建）"
            filterable
            allow-create
            default-first-option
            style="width:100%"
          >
            <el-option
              v-for="p in partyStore.partyList"
              :key="p.id"
              :label="`${p.name}　${p.creditLevel}`"
              :value="p.name"
              :disabled="p.creditLevel.startsWith('D')"
            />
          </el-select>
          <div v-if="createForm.tenant && partyStore.getByName(createForm.tenant)" class="area-hint">
            信用评级 {{ partyStore.creditOf(createForm.tenant) }} · 在租 {{ partyStore.statsOf(createForm.tenant).activeCount }} 份 · 合计欠费 {{ partyStore.statsOf(createForm.tenant).totalArrears }} 万元
          </div>
          <div v-else-if="createForm.tenant" class="area-hint">该名称未在客商档案，签约后将自动建档</div>
        </el-form-item>
        <el-form-item label="起始日期" required>
          <el-date-picker v-model="createForm.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="截止日期" required>
          <el-date-picker v-model="createForm.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="年租金(万元)" required>
          <el-input-number v-model="createForm.annualRent" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="保证金(万元)">
          <el-input-number v-model="createForm.deposit" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="递增方式">
          <el-select v-model="createForm.increment" style="width:100%">
            <el-option label="每年递增3%" value="每年递增3%" />
            <el-option label="每年递增5%" value="每年递增5%" />
            <el-option label="固定租金" value="固定租金" />
            <el-option label="每三年递增10%" value="每三年递增10%" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateContract">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 模板预览 -->
    <el-dialog v-model="showTemplatePreview" title="模板预览" width="700px">
      <div class="contract-preview" v-if="currentTemplate">
        <div class="contract-title">{{ currentTemplate.name }}</div>
        <div class="contract-body" v-html="currentTemplate.content"></div>
      </div>
      <template #footer>
        <el-button @click="showTemplatePreview = false">关闭</el-button>
        <el-button type="primary" @click="useTemplate(currentTemplate); showTemplatePreview = false">使用此模板</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑模板 -->
    <el-dialog v-model="showTemplateDialog" :title="editingTemplateId ? '编辑合同模板' : '新增合同模板'" width="760px">
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="如：标准商铺租赁合同" />
        </el-form-item>
        <el-form-item label="适用类型" required>
          <el-select v-model="templateForm.type" style="width:100%">
            <el-option label="商铺租赁" value="商铺租赁" />
            <el-option label="厂房租赁" value="厂房租赁" />
            <el-option label="办公楼租赁" value="办公楼租赁" />
            <el-option label="仓储租赁" value="仓储租赁" />
            <el-option label="土地租赁" value="土地租赁" />
          </el-select>
        </el-form-item>
        <el-form-item label="合同内容" required>
          <RichTextEditor v-model="templateForm.content" placeholder="输入合同条款内容，可使用工具栏排版、插入填空占位符" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTemplateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTemplate">保存模板</el-button>
      </template>
    </el-dialog>

    <!-- 电子签章流程 -->
    <el-dialog v-model="showSignDialog" title="电子签章" width="700px">
      <el-steps :active="signStep" align-center style="margin-bottom:20px">
        <el-step title="生成合同" />
        <el-step title="预览确认" />
        <el-step title="双方签署" />
        <el-step title="签章完成" />
      </el-steps>

      <div v-if="signStep === 0" class="sign-step-content">
        <el-form label-width="100px">
          <el-form-item label="合同编号">{{ signingRow?.id }}</el-form-item>
          <el-form-item label="承租方">{{ signingRow?.tenant }}</el-form-item>
          <el-form-item label="选择模板">
            <el-select v-model="signTemplateId" style="width:100%">
              <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="signStep = 1">生成合同文件</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-if="signStep === 1" class="sign-step-content">
        <div class="contract-preview">
          <div class="contract-title">房屋租赁合同</div>
          <div class="contract-body">
            <p>甲方（出租方）：长乐区城投集团</p>
            <p>乙方（承租方）：{{ signingRow?.tenant }}</p>
            <p>租赁标的：{{ signingRow?.assetName }}</p>
            <p>租赁期限：{{ signingRow?.startDate }} 至 {{ signingRow?.endDate }}</p>
            <p>年租金：{{ signingRow?.annualRent }} 万元</p>
            <p>保证金：{{ signingRow?.deposit }} 万元</p>
            <p style="margin-top:16px">第一条 甲方将上述资产出租给乙方使用，乙方应按时缴纳租金。</p>
            <p>第二条 租赁期间，乙方应妥善使用和维护租赁资产，不得擅自改变用途。</p>
            <p>第三条 租金按半年缴纳，每期到期前15日内支付下期租金。</p>
            <p>第四条 本合同一式两份，甲乙双方各执一份，经电子签章后生效。</p>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px">
          <el-button @click="signStep = 0">上一步</el-button>
          <el-button type="primary" @click="signStep = 2">确认并发起签署</el-button>
        </div>
      </div>

      <div v-if="signStep === 2" class="sign-step-content" style="text-align:center;padding:24px 0">
        <el-icon :size="48" color="#1668DC" style="margin-bottom:16px"><Loading /></el-icon>
        <p style="font-size:16px;margin-bottom:8px">正在等待双方签署...</p>
        <p style="color:#94A3B8;margin-bottom:20px">已向 {{ signingRow?.tenant }} 发送签署通知</p>
        <el-button type="primary" @click="signStep = 3">模拟双方完成签署</el-button>
      </div>

      <div v-if="signStep === 3" class="sign-step-content" style="text-align:center;padding:24px 0">
        <el-icon :size="48" color="#18A058" style="margin-bottom:16px"><CircleCheck /></el-icon>
        <p style="font-size:16px;margin-bottom:8px;color:#18A058">签署完成</p>
        <p style="color:#94A3B8;margin-bottom:20px">合同已电子签章并自动归档</p>
        <el-button type="primary" @click="finishSign">完成</el-button>
      </div>
    </el-dialog>

    <!-- 意向书新增/编辑 -->
    <el-dialog v-model="showLetterDialog" :title="letterForm.isEdit ? '编辑意向书' : '新增意向书'" width="650px">
      <el-form :model="letterForm" label-width="110px">
        <el-form-item label="意向书编号" required>
          <el-input v-model="letterForm.id" :disabled="letterForm.isEdit" placeholder="自动生成" />
        </el-form-item>
        <el-form-item label="出租方" required>
          <el-select v-model="letterForm.lessor" placeholder="请选择" style="width:100%">
            <el-option label="城投集团" value="城投集团" />
            <el-option label="产投集团" value="产投集团" />
            <el-option label="水投集团" value="水投集团" />
            <el-option label="领航公司" value="领航公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="承租方" required>
          <el-input v-model="letterForm.lessee" placeholder="请输入承租方名称" />
        </el-form-item>
        <el-form-item label="意向资产" required>
          <el-select v-model="letterForm.assetId" placeholder="请选择资产" style="width:100%" filterable @change="handleLetterAssetPick">
            <el-option
              v-for="a in letterAssetOptions"
              :key="a.id"
              :label="`${a.name}（可租 ${availableOf(a).toLocaleString()} / ${a.area.toLocaleString()} ㎡）`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="意向面积(㎡)" required>
          <el-input-number
            v-model="letterForm.intentArea"
            :min="0"
            :max="letterAssetAvailable"
            :precision="2"
            :step="100"
            style="width:100%"
            :disabled="!letterForm.assetId"
          />
          <div class="area-hint" v-if="letterForm.assetId">
            该资产剩余可租 {{ letterAssetAvailable.toLocaleString() }} ㎡，签约后按意向面积扣减
          </div>
          <div class="area-hint" v-else>先选择资产，系统按剩余可租面积限定意向面积</div>
        </el-form-item>
        <el-form-item label="意向租赁开始" required>
          <el-date-picker v-model="letterForm.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="意向租赁结束" required>
          <el-date-picker v-model="letterForm.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="意向金(万元)">
          <el-input-number v-model="letterForm.intentAmount" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="免租类型">
          <el-select v-model="letterForm.rentFreeType" style="width:100%">
            <el-option label="无" value="无" />
            <el-option label="有" value="有" />
          </el-select>
        </el-form-item>
        <el-form-item label="免租期(月)" v-if="letterForm.rentFreeType === '有'">
          <el-input-number v-model="letterForm.freeMonths" :min="0" :step="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="减免费用">
          <el-select v-model="letterForm.feeReduction" clearable style="width:100%">
            <el-option label="固定租金" value="固定租金" />
            <el-option label="物业费" value="物业费" />
            <el-option label="水电费" value="水电费" />
            <el-option label="管理费" value="管理费" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="letterForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLetterDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveLetter">保存</el-button>
      </template>
    </el-dialog>

    <!-- 意向书详情 -->
    <el-drawer v-model="showLetterDrawer" title="意向书详情" size="500px">
      <template v-if="currentLetter">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="意向书编号">{{ currentLetter.id }}</el-descriptions-item>
          <el-descriptions-item label="出租方">{{ currentLetter.lessor }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentLetter.lessee }}</el-descriptions-item>
          <el-descriptions-item label="意向资产">{{ currentLetter.assetName }}</el-descriptions-item>
          <el-descriptions-item label="意向面积">
            {{ (currentLetter.intentArea || 0).toLocaleString() }} ㎡
            <span class="area-hint">（该资产当前剩余可租 {{ letterAvailableOf(currentLetter).toLocaleString() }} ㎡）</span>
          </el-descriptions-item>
          <el-descriptions-item label="意向租赁开始">{{ currentLetter.startDate }}</el-descriptions-item>
          <el-descriptions-item label="意向租赁结束">{{ currentLetter.endDate }}</el-descriptions-item>
          <el-descriptions-item label="意向金">{{ currentLetter.intentAmount ? currentLetter.intentAmount + ' 万元' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="免租类型">
            <el-tag :type="currentLetter.rentFreeType === '有' ? 'warning' : 'info'" size="small">{{ currentLetter.rentFreeType || '无' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLetter.freeMonths" label="免租期">{{ currentLetter.freeMonths }} 个月</el-descriptions-item>
          <el-descriptions-item label="减免费用">
            <el-tag v-if="currentLetter.feeReduction" size="small">{{ currentLetter.feeReduction }}</el-tag>
            <span v-else style="color:#94A3B8">—</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="letterStatusType(currentLetter.status)" size="small">{{ currentLetter.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" v-if="currentLetter.remark">{{ currentLetter.remark }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:20px;text-align:center">
          <el-button type="primary" @click="convertToContract(currentLetter)" v-if="currentLetter.status === '洽谈中'">转为合同</el-button>
          <el-button @click="showLetterDrawer = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>

    <!-- 意向书导入 -->
    <el-dialog v-model="showLetterImport" title="导入意向书" width="500px">
      <el-upload drag action="#" :auto-upload="false" accept=".xlsx,.xls,.csv" :on-change="handleLetterFileChange" :file-list="letterFileList" :limit="1">
        <div style="padding:20px">
          <div style="font-size:14px;color:#0F172A;margin-bottom:8px">点击或拖拽文件到此区域上传</div>
          <div style="font-size:12px;color:#94A3B8">支持格式：.xlsx, .xls, .csv，单次上传一个文件</div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="showLetterImport = false; letterFileList = []">取消</el-button>
        <el-button type="primary" :disabled="letterFileList.length === 0" @click="handleImportLetters">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 归档查看 -->
    <el-drawer v-model="showArchiveDrawer" title="归档详情" size="500px">
      <template v-if="currentArchive">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="合同编号">{{ currentArchive.id }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentArchive.assetName }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ currentArchive.tenant }}</el-descriptions-item>
          <el-descriptions-item label="归档日期">{{ currentArchive.archiveDate }}</el-descriptions-item>
          <el-descriptions-item label="归档编号">{{ currentArchive.archiveNo }}</el-descriptions-item>
          <el-descriptions-item label="存储方式">{{ currentArchive.storageType }}</el-descriptions-item>
          <el-descriptions-item label="电子签章">
            <el-tag type="success" size="small">已签署</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 续租/退租结算 -->
    <el-dialog v-model="showSettlementDialog" :title="settlementAction === 'renew' ? '续租结算' : '退租结算'" width="640px">
      <template v-if="settlementContract">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="合同编号">{{ settlementContract.id }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ settlementContract.tenant }}</el-descriptions-item>
          <el-descriptions-item label="资产名称" :span="2">{{ settlementContract.assetName }}</el-descriptions-item>
          <el-descriptions-item label="原租期">{{ settlementContract.startDate }} ~ {{ settlementContract.endDate }}</el-descriptions-item>
          <el-descriptions-item label="年租金">{{ settlementContract.annualRent }} 万元</el-descriptions-item>
        </el-descriptions>

        <div style="font-weight:600;margin-bottom:12px">自动结算明细</div>
        <el-table :data="settlementItems" border size="small" show-summary :summary-method="settlementSummary" style="margin-bottom:16px">
          <el-table-column prop="item" label="项目" min-width="180" />
          <el-table-column prop="amount" label="金额(万元)" width="140" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.amount < 0 ? '#D93026' : row.amount > 0 ? '#18A058' : '#0F172A' }">
                {{ row.amount >= 0 ? '+' : '' }}{{ row.amount.toLocaleString() }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" min-width="200" />
        </el-table>

        <div v-if="settlementAction === 'renew'" style="margin-top:12px">
          <el-divider content-position="left">续租条件</el-divider>
          <el-form :model="renewForm" label-width="110px" size="small">
            <el-form-item label="续租起始日">
              <el-date-picker v-model="renewForm.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="续租截止日">
              <el-date-picker v-model="renewForm.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="新年租金(万元)">
              <el-input-number v-model="renewForm.annualRent" :min="0" :step="1" style="width:100%" />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="settlementAction === 'terminate'" style="margin-top:12px">
          <el-divider content-position="left">退租信息</el-divider>
          <el-form :model="terminateForm" label-width="110px" size="small">
            <el-form-item label="实际退租日">
              <el-date-picker v-model="terminateForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="退租原因">
              <el-select v-model="terminateForm.reason" style="width:100%">
                <el-option label="合同到期自然终止" value="合同到期自然终止" />
                <el-option label="承租方提前退租" value="承租方提前退租" />
                <el-option label="协商解除" value="协商解除" />
                <el-option label="违约收回" value="违约收回" />
              </el-select>
            </el-form-item>
            <el-form-item label="资产状态">
              <el-select v-model="terminateForm.assetCondition" style="width:100%">
                <el-option label="完好可继续出租" value="完好可继续出租" />
                <el-option label="需维修后出租" value="需维修后出租" />
                <el-option label="有损坏需扣保证金" value="有损坏需扣保证金" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="terminateForm.assetCondition === '有损坏需扣保证金'" label="损坏扣款(万元)">
              <el-input-number v-model="terminateForm.damageDeduction" :min="0" :step="0.5" style="width:100%" />
            </el-form-item>
          </el-form>
        </div>
      </template>
      <template #footer>
        <el-button @click="showSettlementDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSettlement">确认结算</el-button>
      </template>
    </el-dialog>

    <!-- 结算单查看 -->
    <el-drawer v-model="showSettlementDetail" title="结算单" size="520px">
      <template v-if="settlementDetailRow">
        <el-descriptions :column="2" border size="small" style="margin-bottom:16px">
          <el-descriptions-item label="合同编号">{{ settlementDetailRow.id }}</el-descriptions-item>
          <el-descriptions-item label="承租方">{{ settlementDetailRow.tenant }}</el-descriptions-item>
          <el-descriptions-item label="资产名称" :span="2">{{ settlementDetailRow.assetName }}</el-descriptions-item>
          <el-descriptions-item label="结算类型">
            <el-tag :type="settlementDetailRow.settlementAction === 'renew' ? 'success' : 'danger'" size="small">
              {{ settlementDetailRow.settlementAction === 'renew' ? '续租' : '退租' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="结算日期">{{ settlementDetailRow.settlementDate }}</el-descriptions-item>
        </el-descriptions>

        <div style="font-weight:600;margin-bottom:8px">结算明细</div>
        <el-table :data="settlementDetailRow.settlementItems || []" border size="small" show-summary :summary-method="getSettlementDetailSummary" style="margin-bottom:16px">
          <el-table-column prop="item" label="项目" min-width="160" />
          <el-table-column prop="amount" label="金额(万元)" width="130" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.amount < 0 ? '#D93026' : '#18A058' }">{{ row.amount >= 0 ? '+' : '' }}{{ row.amount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="说明" min-width="160" />
        </el-table>

        <el-descriptions v-if="settlementDetailRow.settlementAction === 'renew'" :column="2" border size="small">
          <el-descriptions-item label="新合同编号">{{ settlementDetailRow.newContractId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="续租期">{{ settlementDetailRow.renewStart }} ~ {{ settlementDetailRow.renewEnd }}</el-descriptions-item>
          <el-descriptions-item label="新年租金">{{ settlementDetailRow.newAnnualRent }} 万元</el-descriptions-item>
        </el-descriptions>
        <el-descriptions v-else :column="2" border size="small">
          <el-descriptions-item label="退租日期">{{ settlementDetailRow.terminateDate }}</el-descriptions-item>
          <el-descriptions-item label="退租原因">{{ settlementDetailRow.terminateReason }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <el-dialog v-model="mergeDialogVisible" title="合并租赁" width="640px">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px"
        title="将勾选的多份合同合并为一份新合同，原合同将被移除。仅支持合并同一资产下的合同。" />
      <div style="font-weight:600;margin-bottom:8px">待合并合同（{{ mergeSelection.length }} 份）</div>
      <el-table :data="mergeSelection" border size="small" style="margin-bottom:16px">
        <el-table-column prop="id" label="合同编号" width="130" />
        <el-table-column prop="tenant" label="承租方" min-width="160" />
        <el-table-column prop="leaseArea" label="租赁面积(㎡)" width="120" align="right" />
        <el-table-column prop="annualRent" label="年租金(万元)" width="120" align="right" />
      </el-table>
      <div style="font-weight:600;margin-bottom:8px">合并后</div>
      <el-descriptions v-if="mergePreview" :column="2" border size="small">
        <el-descriptions-item label="资产名称">{{ mergePreview.assetName }}</el-descriptions-item>
        <el-descriptions-item label="合并租期">{{ mergePreview.startDate }} ~ {{ mergePreview.endDate }}</el-descriptions-item>
        <el-descriptions-item label="合计租赁面积">{{ mergePreview.leaseArea.toLocaleString() }} ㎡</el-descriptions-item>
        <el-descriptions-item label="合计年租金">{{ mergePreview.annualRent }} 万元</el-descriptions-item>
        <el-descriptions-item label="合计保证金">{{ mergePreview.deposit }} 万元</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="mergeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMerge">确认合并</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAcRenew" title="续租确认" width="460px">
      <div class="ac-confirm" v-if="acRenewRow">
        <el-icon :size="26" color="#E8912A"><WarningFilled /></el-icon>
        <div>
          <p>当前合同编号：<strong>{{ acRenewRow.id }}</strong></p>
          <p>租户身份证号：{{ maskId(acRenewRow.lessee.idNo) }}</p>
          <p v-if="acRenewRow.arrearsMonths > 0" class="ac-red">该租户有欠缴费用（{{ acRenewRow.arrearsMonths }}个月未缴），请先结清欠缴费用后再办理续租。</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAcRenew = false">取消</el-button>
        <el-button type="primary" @click="confirmAcRenew">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAcTerminate" title="断租" width="880px" top="6vh">
      <template v-if="acTerminateRow">
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ acTerminateRow.lessee.type }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ acTerminateRow.lessee.name }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ acTerminateRow.lessee.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ acTerminateRow.lessee.phone }}</div></div>
          <div class="cell"><div class="label">身份证号</div><div class="value">{{ maskId(acTerminateRow.lessee.idNo) }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value hl">{{ acTerminateRow.id }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ acTerminateRow.signDate }}</div></div>
          <div class="cell"><div class="label">使用方式</div><div class="value">{{ acTerminateRow.usage }}</div></div>
          <div class="cell"><div class="label">租金类型</div><div class="value">{{ acTerminateRow.rentType }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ acTerminateRow.contractType }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value">{{ acTerminateRow.monthlyRent.toLocaleString() }} 元</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ acTerminateRow.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ acTerminateRow.leaseTime }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ acTerminateRow.payDeadline }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value">{{ acTerminateRow.deposit.toLocaleString() }} 元</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag size="small" :type="acStatusType(acTerminateRow.status)">{{ acTerminateRow.status }}</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">欠费</div>
            <div class="value">
              <el-tag v-if="acTerminateRow.arrearsMonths > 0" type="danger" size="small">{{ acTerminateRow.arrearsMonths }}个月未缴</el-tag>
              <span v-else>无欠费</span>
            </div>
          </div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="acTerminateRow.assets" border size="small" style="margin-bottom:16px">
          <el-table-column prop="region" label="省市区" min-width="150" />
          <el-table-column prop="project" label="项目" min-width="120" />
          <el-table-column prop="zone" label="分区" width="70" />
          <el-table-column prop="name" label="资产名称" min-width="130" />
          <el-table-column prop="code" label="资产编号" width="100" />
          <el-table-column prop="location" label="资产座落" min-width="150" />
          <el-table-column prop="company" label="所属公司" width="95" />
          <el-table-column prop="leaseType" label="租赁类型" width="85" />
        </el-table>
        <el-form label-width="90px">
          <el-form-item label="断租时间" required>
            <el-date-picker v-model="acTerminateDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择断租时间" style="width:220px" />
            <span class="ac-note">断租时间只能为交费截至时间到租赁结束时间</span>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showAcTerminate = false">取消</el-button>
        <el-button type="primary" @click="confirmAcTerminate">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAcApprove" title="合同审批" width="560px">
      <el-form label-width="110px">
        <el-form-item label="选择审批流程" required>
          <el-select v-model="acApproveFlow" placeholder="请选择审批流程" style="width:100%">
            <el-option v-for="f in acFlowOptions" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批环节">
          <div style="width:100%">
            <div v-for="(r, i) in acApproveRows" :key="i" class="ac-approve-row">
              <el-select v-model="r.approver" placeholder="审批人" style="width:200px">
                <el-option v-for="p in acApproverOptions" :key="p" :label="p" :value="p" />
              </el-select>
              <el-select v-model="r.level" placeholder="审批级别" style="width:150px">
                <el-option v-for="l in acLevelOptions" :key="l" :label="l" :value="l" />
              </el-select>
              <el-button type="danger" link :icon="Delete" @click="acApproveRows.splice(i, 1)" />
            </div>
            <el-button type="primary" link :icon="Plus" @click="addAcApproveRow">添加审批</el-button>
          </div>
        </el-form-item>
        <el-form-item label="协定">
          <el-input v-model="acAgreement" type="textarea" :rows="4" maxlength="200" show-word-limit placeholder="请输入协定内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAcApprove = false">取消</el-button>
        <el-button type="primary" @click="confirmAcApprove">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAcPreview" title="合同预览" width="700px">
      <div class="contract-preview" v-if="acPreviewRow">
        <div class="contract-title">资产租赁合同</div>
        <div class="contract-body">
          <p>甲方（出租方）：{{ acPreviewRow.partyA }}</p>
          <p>乙方（承租方）：{{ acPreviewRow.partyB }}</p>
          <p>租赁标的：{{ acPreviewRow.assets.map(a => a.name).join('、') }}</p>
          <p>租赁期限：{{ acPreviewRow.leaseTime }}</p>
          <p>月租金：{{ acPreviewRow.monthlyRent.toLocaleString() }} 元，缴费周期：{{ acPreviewRow.payCycle }}</p>
          <p>保证金：{{ acPreviewRow.deposit.toLocaleString() }} 元</p>
          <p style="margin-top:16px">第一条 甲方将上述资产出租给乙方使用，乙方应按约定用途使用并按时缴纳租金。</p>
          <p>第二条 租赁期间，乙方不得擅自改变资产结构和用途，不得转租。</p>
          <p>第三条 租金按{{ acPreviewRow.payCycle }}缴纳，每期交费截至时间为 {{ acPreviewRow.payDeadline }}。</p>
          <p v-if="acPreviewRow.agreement">第四条 协定：{{ acPreviewRow.agreement }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAcPreview = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showAcDetail" title="合同详情" size="760px">
      <template v-if="acDetailRow">
        <div style="text-align:right;margin-bottom:12px">
          <el-button type="primary" plain size="small" :icon="Download" @click="acExportDetail">导出</el-button>
        </div>
        <div class="section-title">租赁方信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">租赁方类型</div><div class="value">{{ acDetailRow.lessee.type }}</div></div>
          <div class="cell"><div class="label">租赁方名称</div><div class="value">{{ acDetailRow.lessee.name }}</div></div>
          <div class="cell"><div class="label">联系人</div><div class="value">{{ acDetailRow.lessee.contact }}</div></div>
          <div class="cell"><div class="label">联系电话</div><div class="value">{{ acDetailRow.lessee.phone }}</div></div>
          <div class="cell"><div class="label">身份证号</div><div class="value">{{ maskId(acDetailRow.lessee.idNo) }}</div></div>
        </div>
        <div class="section-title">合同信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">合同编号</div><div class="value hl">{{ acDetailRow.id }}</div></div>
          <div class="cell"><div class="label">签约时间</div><div class="value">{{ acDetailRow.signDate }}</div></div>
          <div class="cell"><div class="label">使用方式</div><div class="value">{{ acDetailRow.usage }}</div></div>
          <div class="cell"><div class="label">租金类型</div><div class="value">{{ acDetailRow.rentType }}</div></div>
          <div class="cell"><div class="label">合同类型</div><div class="value">{{ acDetailRow.contractType }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value">{{ acDetailRow.monthlyRent.toLocaleString() }} 元</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ acDetailRow.payCycle }}</div></div>
          <div class="cell"><div class="label">租赁时间</div><div class="value">{{ acDetailRow.leaseTime }}</div></div>
          <div class="cell"><div class="label">缴费截止时间</div><div class="value">{{ acDetailRow.payDeadline }}</div></div>
          <div class="cell"><div class="label">保证金</div><div class="value">{{ acDetailRow.deposit.toLocaleString() }} 元</div></div>
          <div class="cell"><div class="label">总减免金额</div><div class="value">{{ acDetailRow.reduction.toLocaleString() }} 元</div></div>
          <div class="cell">
            <div class="label">合同状态</div>
            <div class="value">
              <el-tag size="small" :type="acStatusType(acDetailRow.status)">{{ acDetailRow.status }}</el-tag>
              <el-tag v-if="acDetailRow.arrearsMonths > 0" type="danger" size="small" style="margin-left:6px">{{ acDetailRow.arrearsMonths }}个月未缴</el-tag>
            </div>
          </div>
          <div class="cell">
            <div class="label">合同预览</div>
            <div class="value">
              <el-button type="primary" link size="small" @click="openAcPreview(acDetailRow)">合同预览</el-button>
            </div>
          </div>
          <div class="cell" style="grid-column:span 2">
            <div class="label">协定</div>
            <div class="value">{{ acDetailRow.agreement || '—' }}</div>
          </div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="acDetailRow.assets" border size="small" style="margin-bottom:16px">
          <el-table-column prop="region" label="省市区" min-width="150" />
          <el-table-column prop="project" label="项目" min-width="120" />
          <el-table-column prop="zone" label="分区" width="70" />
          <el-table-column prop="name" label="资产名称" min-width="130" />
          <el-table-column prop="code" label="资产编号" width="100" />
          <el-table-column prop="location" label="资产座落" min-width="150" />
          <el-table-column prop="company" label="所属公司" width="95" />
          <el-table-column prop="leaseType" label="租赁类型" width="85" />
        </el-table>
        <div class="section-title">审核步骤</div>
        <el-timeline style="padding-left:4px">
          <el-timeline-item
            v-for="(s, i) in acDetailRow.auditSteps"
            :key="i"
            type="success"
            :icon="Check"
            :timestamp="s.time"
          >
            <div style="font-weight:600">{{ s.title }}</div>
            <div style="font-size:13px;color:#475569">审核人：{{ s.auditor }}</div>
            <div style="font-size:13px;color:#475569">审核时间：{{ s.time }}</div>
            <div style="font-size:13px;color:#475569;display:flex;align-items:center;gap:8px">
              附件：<span class="ac-sign">签名</span>
              <el-button type="primary" link size="small" :icon="Download" @click="acDownloadSign(s)">下载</el-button>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <!-- 附件预览 -->
    <el-dialog v-model="showAcFilePreview" title="附件预览" width="520px">
      <template v-if="acFilePreviewRow">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="合同编号">{{ acFilePreviewRow.id }}</el-descriptions-item>
          <el-descriptions-item label="附件名称">{{ acFilePreviewRow.attachment }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ (Math.random() * 5 + 0.5).toFixed(2) }} MB</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ acFilePreviewRow.attachment.endsWith('.pdf') ? 'PDF 文档' : '其他' }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ acFilePreviewRow.signDate }}</el-descriptions-item>
        </el-descriptions>
        <div style="margin-top:16px;padding:20px;background:#F5F7FA;border-radius:4px;text-align:center;color:#94A3B8">
          <el-icon :size="48"><Document /></el-icon>
          <p style="margin-top:8px">{{ acFilePreviewRow.attachment }}</p>
        </div>
      </template>
      <template #footer>
        <el-button @click="showAcFilePreview = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 合同导入 -->
    <el-dialog v-model="showAcImportDialog" title="导入合同" width="500px">
      <el-upload drag action="#" :auto-upload="false" accept=".xlsx,.xls,.csv" :on-change="handleAcImportFileChange" :file-list="acImportFileList" :limit="1">
        <div style="padding:20px">
          <div style="font-size:14px;color:#0F172A;margin-bottom:8px">点击或拖拽文件到此区域上传</div>
          <div style="font-size:12px;color:#94A3B8">支持格式：.xlsx, .xls, .csv，请按导入模板格式填写</div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="showAcImportDialog = false; acImportFileList = []">取消</el-button>
        <el-button type="primary" :disabled="acImportFileList.length === 0" @click="handleAcImportConfirm">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { usePartyStore } from '../../store/party'
import { useUserStore } from '../../store/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading, CircleCheck, Search, Refresh, ArrowRight, Document, AlarmClock, WarningFilled,
  Stamp, CircleClose, MoreFilled, Download, Upload, FolderAdd, FolderChecked, Paperclip,
  Plus, Delete, Check
} from '@element-plus/icons-vue'
import RichTextEditor from '../../components/RichTextEditor.vue'

const router = useRouter()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const partyStore = usePartyStore()
const userStore = useUserStore()
// 审批台是本页自带的演示数据，按登录公司过滤；合同列表本身走 store 的 visibleContracts
const currentCompany = computed(() => userStore.user?.org || '城投集团')
const activeTab = ref('list')

const filterStatus = ref('')
const keyword = ref('')
const showCreateDialog = ref(false)

// ===== 意向书台账 =====
const letterFilter = ref({ no: '', lessor: '', lessee: '' })
const letterPage = ref(1)
const letterSelection = ref([])
const showLetterDialog = ref(false)
const showLetterDrawer = ref(false)
const showLetterImport = ref(false)
const currentLetter = ref(null)
const letterFileList = ref([])

const letterForm = ref({
  isEdit: false,
  id: '',
  lessor: '',
  lessee: '',
  assetId: '',
  assetName: '',
  intentArea: 0,
  startDate: '',
  endDate: '',
  intentAmount: 0,
  rentFreeType: '无',
  freeMonths: 0,
  feeReduction: '',
  remark: ''
})

const letterList = ref([
  { id: 'YXS-2026-001', lessor: '城投集团', lessee: '福州××商业管理有限公司', assetId: 'CT-001', assetName: '吴航街道商业街 A-01 商铺', intentArea: 320, startDate: '2026-07-01', endDate: '2031-06-30', intentAmount: 10, rentFreeType: '有', freeMonths: 2, feeReduction: '固定租金', status: '洽谈中', remark: '意向承租方为连锁品牌' },
  { id: 'YXS-2026-002', lessor: '领航公司', lessee: '福建××科技有限公司', assetId: 'CT-004', assetName: '首占新区保障房 1# 楼', intentArea: 1200, startDate: '2026-08-01', endDate: '2029-07-31', intentAmount: 20, rentFreeType: '无', freeMonths: 0, feeReduction: '物业费', status: '洽谈中', remark: '仅承租部分楼层' },
  { id: 'YXS-2026-003', lessor: '产投集团', lessee: '长乐××物流有限公司', assetId: 'CT-006', assetName: '玉田镇旧工业厂房', intentArea: 2400, startDate: '2026-09-01', endDate: '2028-08-31', intentAmount: 15, rentFreeType: '有', freeMonths: 1, feeReduction: '', status: '洽谈中', remark: '需确认消防验收情况' },
  { id: 'YXS-2026-004', lessor: '城投集团', lessee: '福州××餐饮管理有限公司', assetId: 'CT-005', assetName: '江田镇仓储用地', intentArea: 5000, startDate: '2026-10-01', endDate: '2029-09-30', intentAmount: 8, rentFreeType: '无', freeMonths: 0, feeReduction: '固定租金', status: '已终止', remark: '承租方放弃租赁' },
  { id: 'YXS-2026-005', lessor: '水投集团', lessee: '长乐××教育培训有限公司', assetId: 'CT-003', assetName: '营前标准厂房 2#', intentArea: 800, startDate: '2026-09-15', endDate: '2029-09-14', intentAmount: 5, rentFreeType: '有', freeMonths: 3, feeReduction: '管理费', status: '洽谈中', remark: '' },
  { id: 'YXS-2026-006', lessor: '领航公司', lessee: '福建××电子商务有限公司', assetId: 'CT-007', assetName: '吴航农贸市场', intentArea: 600, startDate: '2026-11-01', endDate: '2029-10-31', intentAmount: 12, rentFreeType: '无', freeMonths: 0, feeReduction: '', status: '洽谈中', remark: '电商企业入驻意向' },
  { id: 'YXS-2026-007', lessor: '产投集团', lessee: '长乐××新能源科技有限公司', assetId: 'CT-002', assetName: '航城商务楼 3F', intentArea: 1200, startDate: '2026-10-15', endDate: '2031-10-14', intentAmount: 25, rentFreeType: '有', freeMonths: 2, feeReduction: '固定租金', status: '已签约', remark: '' },
  { id: 'YXS-2026-008', lessor: '领航公司', lessee: '福州××健康管理有限公司', assetId: 'CT-008', assetName: '梅花镇综合楼', intentArea: 500, startDate: '2026-12-01', endDate: '2029-11-30', intentAmount: 6, rentFreeType: '无', freeMonths: 0, feeReduction: '物业费', status: '洽谈中', remark: '资产现为自用，需先调整用途' },
])

const filteredLetters = computed(() => {
  return letterList.value.filter(l => {
    if (letterFilter.value.no && !l.id.toLowerCase().includes(letterFilter.value.no.toLowerCase())) return false
    if (letterFilter.value.lessor && !l.lessor.includes(letterFilter.value.lessor)) return false
    if (letterFilter.value.lessee && !l.lessee.includes(letterFilter.value.lessee)) return false
    return true
  })
})

const pagedLetters = computed(() => {
  const start = (letterPage.value - 1) * 10
  return filteredLetters.value.slice(start, start + 10)
})

function letterStatusType(status) {
  const map = { '洽谈中': 'primary', '已签约': 'success', '已终止': 'danger' }
  return map[status] || 'info'
}

const letterAssetOptions = computed(() => {
  dataVersion.value
  return assetStore.visibleAssets.filter(a => (a.area || 0) > 0)
})

const letterPickedAsset = computed(() => assetStore.visibleAssets.find(a => a.id === letterForm.value.assetId) || null)
const letterAssetAvailable = computed(() => letterPickedAsset.value ? contractStore.getLeaseSummary(letterPickedAsset.value).availableArea : 0)

function letterAvailableOf(letter) {
  dataVersion.value
  const asset = assetStore.visibleAssets.find(a => a.id === letter.assetId) || assetStore.visibleAssets.find(a => a.name === letter.assetName)
  return asset ? contractStore.getLeaseSummary(asset).availableArea : 0
}

function handleLetterAssetPick(assetId) {
  const asset = assetStore.visibleAssets.find(a => a.id === assetId)
  if (!asset) return
  letterForm.value.assetName = asset.name
  letterForm.value.intentArea = contractStore.getLeaseSummary(asset).availableArea
}

// 按当年最大流水号递增，避免删除意向书后重号
function nextLetterId() {
  const prefix = `YXS-${new Date().getFullYear()}-`
  const max = letterList.value.reduce((m, l) => {
    if (!String(l.id).startsWith(prefix)) return m
    const n = Number(String(l.id).slice(prefix.length))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

function openLetterDialog(row) {
  if (row) {
    letterForm.value = { ...row, isEdit: true }
  } else {
    letterForm.value = { isEdit: false, id: nextLetterId(), lessor: '城投集团', lessee: '', assetId: '', assetName: '', intentArea: 0, startDate: '', endDate: '', intentAmount: 0, rentFreeType: '无', freeMonths: 0, feeReduction: '', remark: '' }
  }
  showLetterDialog.value = true
}

function handleSaveLetter() {
  const f = letterForm.value
  if (!f.lessor || !f.lessee || !f.assetId || !f.startDate || !f.endDate) {
    ElMessage.warning('请填写完整意向书信息')
    return
  }
  const asset = assetStore.visibleAssets.find(a => a.id === f.assetId)
  const available = asset ? contractStore.getLeaseSummary(asset).availableArea : 0
  if (!f.intentArea || f.intentArea <= 0) {
    ElMessage.warning('请填写意向面积')
    return
  }
  if (f.intentArea > available) {
    ElMessage.error(`意向面积 ${f.intentArea} ㎡ 超出该资产剩余可租面积 ${available.toLocaleString()} ㎡`)
    return
  }
  if (f.isEdit) {
    const idx = letterList.value.findIndex(l => l.id === f.id)
    if (idx > -1) {
      letterList.value[idx] = { ...letterList.value[idx], lessor: f.lessor, lessee: f.lessee, assetId: f.assetId, assetName: f.assetName, intentArea: f.intentArea, startDate: f.startDate, endDate: f.endDate, intentAmount: f.intentAmount, rentFreeType: f.rentFreeType, freeMonths: f.freeMonths, feeReduction: f.feeReduction, remark: f.remark }
    }
    ElMessage.success('意向书已更新')
  } else {
    letterList.value.unshift({ id: f.id, lessor: f.lessor, lessee: f.lessee, assetId: f.assetId, assetName: f.assetName, intentArea: f.intentArea, startDate: f.startDate, endDate: f.endDate, intentAmount: f.intentAmount, rentFreeType: f.rentFreeType, freeMonths: f.freeMonths, feeReduction: f.feeReduction, status: '洽谈中', remark: f.remark })
    ElMessage.success('意向书已新增')
  }
  showLetterDialog.value = false
}

function viewLetter(row) {
  currentLetter.value = row
  showLetterDrawer.value = true
}

function deleteLetter(row) {
  ElMessageBox.confirm(`确认删除意向书"${row.id}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = letterList.value.findIndex(l => l.id === row.id)
    if (idx > -1) letterList.value.splice(idx, 1)
    ElMessage.success('意向书已删除')
  }).catch(() => {})
}

function batchDeleteLetters() {
  ElMessageBox.confirm(`确认删除选中的 ${letterSelection.value.length} 条意向书？`, '批量删除', { type: 'warning' }).then(() => {
    const ids = new Set(letterSelection.value.map(l => l.id))
    for (let i = letterList.value.length - 1; i >= 0; i--) {
      if (ids.has(letterList.value[i].id)) letterList.value.splice(i, 1)
    }
    letterSelection.value = []
    ElMessage.success('已批量删除')
  }).catch(() => {})
}

function batchEditLetters() {
  if (letterSelection.value.length === 1) {
    openLetterDialog(letterSelection.value[0])
  } else {
    ElMessage.warning('批量编辑仅支持单条，请选择一条记录后重试')
  }
}

function exportLetters() {
  const headers = ['意向书编号', '出租方', '承租方', '意向资产', '开始日期', '结束日期', '意向金(万元)', '免租类型', '减免费用', '状态']
  const rows = filteredLetters.value.map(l => [l.id, l.lessor, l.lessee, l.assetName, l.startDate, l.endDate, l.intentAmount || '', l.rentFreeType || '无', l.feeReduction || '', l.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `意向书台账_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filteredLetters.value.length} 条意向书`)
}

function handleLetterFileChange(file) {
  letterFileList.value = [file]
}

function handleImportLetters() {
  const target = assetStore.visibleAssets.find(a => contractStore.getLeaseSummary(a).availableArea > 0)
  if (!target) {
    ElMessage.warning('台账中已无剩余可租面积的资产，无法导入意向书')
    return
  }
  const available = contractStore.getLeaseSummary(target).availableArea
  const mockImport = [
    { id: nextLetterId(), lessor: '城投集团', lessee: '导入企业A', assetId: target.id, assetName: target.name, intentArea: Math.round(available / 2 * 100) / 100, startDate: '2026-10-01', endDate: '2029-09-30', intentAmount: 10, rentFreeType: '无', freeMonths: 0, feeReduction: '', status: '洽谈中', remark: '批量导入' }
  ]
  letterList.value.push(...mockImport)
  showLetterImport.value = false
  letterFileList.value = []
  ElMessage.success(`成功导入 ${mockImport.length} 条意向书（${target.name}，意向 ${mockImport[0].intentArea.toLocaleString()} ㎡）`)
}

function convertToContract(letter) {
  const asset = assetStore.visibleAssets.find(a => a.id === letter.assetId) || assetStore.visibleAssets.find(a => a.name === letter.assetName)
  if (!asset) {
    ElMessage.warning(`未在资产台账中匹配到"${letter.assetName}"，请先编辑意向书并选择台账资产`)
    return
  }
  const available = contractStore.getLeaseSummary(asset).availableArea
  if (available <= 0) {
    ElMessage.warning(`${asset.name} 已无剩余可租面积，无法转为合同`)
    return
  }
  if (!letter.intentArea || letter.intentArea <= 0) {
    ElMessage.warning(`意向书"${letter.id}"未填写意向面积，请先补充后再转为合同`)
    return
  }
  if (letter.intentArea > available) {
    ElMessage.error(`意向面积 ${letter.intentArea.toLocaleString()} ㎡ 超出${asset.name} 剩余可租面积 ${available.toLocaleString()} ㎡，请先调整意向书`)
    return
  }
  const leaseArea = letter.intentArea
  const left = Math.round((available - leaseArea) * 100) / 100
  ElMessageBox.confirm(
    `确认将意向书"${letter.id}"转为正式合同？${asset.name} 本次出租 ${leaseArea.toLocaleString()} ㎡，` +
      (left > 0 ? `签约后仍有 ${left.toLocaleString()} ㎡ 可继续招租。` : '签约后该资产转为已出租。'),
    '转为合同',
    { type: 'info' }
  ).then(() => {
    letter.status = '已签约'
    const newContract = contractStore.signContract({
      assetId: asset.id,
      assetName: asset.name,
      tenant: letter.lessee,
      startDate: letter.startDate,
      endDate: letter.endDate,
      leaseArea,
      annualRent: letter.intentAmount ? letter.intentAmount * 12 : 0,
      deposit: letter.intentAmount || 0,
      increment: '每年递增3%',
      status: '正常',
      arrears: 0,
      overdueDays: 0,
      electronic: false
    })
    dataVersion.value++
    showLetterDrawer.value = false
    ElMessage.success(`已生成合同 ${newContract.id}，${asset.name} 转为${contractStore.getLeaseSummary(asset).availableArea > 0 ? '部分出租' : '已出租'}`)
    activeTab.value = 'list'
  }).catch(() => {})
}

const dataVersion = ref(0)

const createForm = ref({
  id: '',
  assetId: '',
  assetName: '',
  leaseArea: 0,
  tenant: '',
  startDate: '',
  endDate: '',
  annualRent: 0,
  deposit: 0,
  increment: '每年递增3%',
  templateId: ''
})

function availableOf(asset) {
  return contractStore.getLeaseSummary(asset).availableArea
}

function remainingOf(contract) {
  const asset = assetStore.visibleAssets.find(a => a.id === contract.assetId)
  return asset ? contractStore.getLeaseSummary(asset).availableArea : 0
}

const leasableAssets = computed(() => {
  dataVersion.value
  return assetStore.visibleAssets.filter(a => (a.area || 0) > 0 && availableOf(a) > 0)
})

const pickedAsset = computed(() => assetStore.visibleAssets.find(a => a.id === createForm.value.assetId) || null)
const pickedLeased = computed(() => pickedAsset.value ? contractStore.getLeaseSummary(pickedAsset.value).leasedArea : 0)
const pickedAvailable = computed(() => pickedAsset.value ? contractStore.getLeaseSummary(pickedAsset.value).availableArea : 0)

function handleAssetPick(assetId) {
  const asset = assetStore.visibleAssets.find(a => a.id === assetId)
  if (!asset) return
  createForm.value.assetName = asset.name
  createForm.value.leaseArea = contractStore.getLeaseSummary(asset).availableArea
}

function resetCreateForm() {
  createForm.value = { id: '', assetId: '', assetName: '', leaseArea: 0, tenant: '', startDate: '', endDate: '', annualRent: 0, deposit: 0, increment: '每年递增3%', templateId: '' }
}

function statusType(status) {
  const map = { '正常': 'success', '欠缴': 'danger', '临期': 'warning', '已到期': 'info' }
  return map[status] || 'info'
}

const filteredContracts = computed(() => {
  dataVersion.value
  return contractStore.visibleContracts.filter(c => {
    if (filterStatus.value && c.status !== filterStatus.value) return false
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      if (!c.id.toLowerCase().includes(kw) && !c.tenant.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function handleCreateContract() {
  const f = createForm.value
  if (!f.assetId || !f.tenant || !f.startDate || !f.endDate) {
    ElMessage.warning('请填写完整合同信息')
    return
  }
  if (!f.leaseArea || f.leaseArea <= 0) {
    ElMessage.warning('请填写租赁面积')
    return
  }
  if (partyStore.creditOf(f.tenant).startsWith('D')) {
    ElMessage.error(`承租方“${f.tenant}”已列入黑名单，禁止签约`)
    return
  }
  const asset = assetStore.visibleAssets.find(a => a.id === f.assetId)
  const available = contractStore.getLeaseSummary(asset).availableArea
  if (f.leaseArea > available) {
    ElMessage.error(`租赁面积 ${f.leaseArea} ㎡ 超出该资产剩余可租面积 ${available} ㎡`)
    return
  }
  const newContract = contractStore.signContract({
    assetId: asset.id,
    assetName: asset.name,
    tenant: f.tenant,
    startDate: f.startDate,
    endDate: f.endDate,
    leaseArea: f.leaseArea,
    annualRent: f.annualRent,
    deposit: f.deposit,
    increment: f.increment,
    status: '正常',
    electronic: false,
    arrears: 0,
    overdueDays: 0
  })
  const after = contractStore.getLeaseSummary(asset)
  dataVersion.value++
  showCreateDialog.value = false
  resetCreateForm()
  ElMessage.success(
    after.availableArea > 0
      ? `合同 ${newContract.id} 已生效，${asset.name} 转为部分出租，剩余 ${after.availableArea.toLocaleString()} ㎡ 可继续招租`
      : `合同 ${newContract.id} 已生效，${asset.name} 已整宗出租`
  )
}

// 合并租赁：将同一资产下的多份部分租赁合同合并为一份
const mergeSelection = ref([])
const mergeDialogVisible = ref(false)

function onContractSelect(rows) {
  mergeSelection.value = rows
}

const mergePreview = computed(() => {
  const rows = mergeSelection.value
  if (!rows.length) return null
  const leaseArea = rows.reduce((s, c) => s + (c.leaseArea || 0), 0)
  const annualRent = Math.round(rows.reduce((s, c) => s + (c.annualRent || 0), 0) * 100) / 100
  const deposit = Math.round(rows.reduce((s, c) => s + (c.deposit || 0), 0) * 100) / 100
  const startDate = rows.map(c => c.startDate).sort()[0]
  const endDate = rows.map(c => c.endDate).sort().slice(-1)[0]
  return { leaseArea, annualRent, deposit, startDate, endDate, assetName: rows[0].assetName }
})

function openMerge() {
  const rows = mergeSelection.value
  if (rows.length < 2) {
    ElMessage.warning('请至少勾选两份合同')
    return
  }
  const assetIds = new Set(rows.map(c => c.assetId))
  if (assetIds.size > 1) {
    ElMessage.error('仅支持合并同一资产下的合同，请重新勾选')
    return
  }
  mergeDialogVisible.value = true
}

function confirmMerge() {
  const rows = mergeSelection.value
  const preview = mergePreview.value
  if (!rows.length || !preview) return
  const tenants = [...new Set(rows.map(c => c.tenant))]
  const newContract = contractStore.signContract({
    assetId: rows[0].assetId,
    assetName: preview.assetName,
    tenant: tenants.length === 1 ? tenants[0] : tenants.join('、'),
    startDate: preview.startDate,
    endDate: preview.endDate,
    leaseArea: preview.leaseArea,
    annualRent: preview.annualRent,
    deposit: preview.deposit,
    increment: rows[0].increment || '无递增',
    status: '正常',
    electronic: rows.every(c => c.electronic),
    arrears: 0,
    overdueDays: 0,
    mergedFrom: rows.map(c => c.id)
  })
  const ids = new Set(rows.map(c => c.id))
  for (const c of rows) {
    contractStore.terminateContract(c.id, `已合并至 ${newContract.id}`)
  }
  dataVersion.value++
  mergeDialogVisible.value = false
  mergeSelection.value = []
  ElMessage.success(`已将 ${ids.size} 份合同合并为 ${newContract.id}，原合同标记为已终止`)
}

function applyTemplate(templateId) {
  if (!templateId) return
  const tpl = templates.value.find(t => t.id === templateId)
  if (tpl) {
    ElMessage.success(`已应用模板：${tpl.name}`)
  }
}

// 合同模板
const templates = ref([
  { id: 'TPL-001', name: '标准商铺租赁合同', type: '商铺租赁', version: 'V2.1', updateTime: '2026-06-15', useCount: 28, content: '<p>第一条 甲方将位于____的商铺出租给乙方经营使用。</p><p>第二条 租赁期限为____年，自____年____月____日起至____年____月____日止。</p><p>第三条 年租金为人民币____万元，租金按半年缴纳。</p><p>第四条 乙方应缴纳保证金人民币____万元。</p>' },
  { id: 'TPL-002', name: '厂房租赁合同', type: '厂房租赁', version: 'V1.3', updateTime: '2026-05-20', useCount: 15, content: '<p>第一条 甲方将位于____的厂房出租给乙方作为生产用地。</p><p>第二条 厂房面积____平方米，年租金为人民币____万元。</p><p>第三条 乙方不得擅自改变厂房结构或用途。</p>' },
  { id: 'TPL-003', name: '办公楼租赁合同', type: '办公楼租赁', version: 'V1.0', updateTime: '2026-04-10', useCount: 8, content: '<p>第一条 甲方将位于____的办公楼____层出租给乙方办公使用。</p><p>第二条 租赁面积____平方米，月租金为人民币____元/平方米。</p>' },
  { id: 'TPL-004', name: '仓储设施租赁合同', type: '仓储租赁', version: 'V1.1', updateTime: '2026-03-08', useCount: 5, content: '<p>第一条 甲方将位于____的仓储设施出租给乙方使用。</p><p>第二条 仓储面积____平方米，年租金为人民币____万元。</p>' },
])

const showTemplateDialog = ref(false)
const showTemplatePreview = ref(false)
const currentTemplate = ref(null)
const editingTemplateId = ref(null)

const templateForm = ref({
  name: '',
  type: '商铺租赁',
  content: ''
})

function previewTemplate(row) {
  currentTemplate.value = row
  showTemplatePreview.value = true
}

function useTemplate(row) {
  if (!row) return
  createForm.value.templateId = row.id
  showCreateDialog.value = true
  row.useCount++
  ElMessage.success(`已选择模板：${row.name}`)
}

function deleteTemplate(row) {
  ElMessageBox.confirm(`确认删除模板"${row.name}"？`, '提示', { type: 'warning' }).then(() => {
    const idx = templates.value.findIndex(t => t.id === row.id)
    if (idx > -1) templates.value.splice(idx, 1)
    ElMessage.success('模板已删除')
  }).catch(() => {})
}

function editTemplate(row) {
  editingTemplateId.value = row.id
  templateForm.value = { name: row.name, type: row.type, content: row.content }
  showTemplateDialog.value = true
}

function openNewTemplate() {
  editingTemplateId.value = null
  templateForm.value = { name: '', type: '商铺租赁', content: '' }
  showTemplateDialog.value = true
}

function handleCreateTemplate() {
  if (!templateForm.value.name || !templateForm.value.content) {
    ElMessage.warning('请填写完整模板信息')
    return
  }
  if (editingTemplateId.value) {
    const t = templates.value.find(t => t.id === editingTemplateId.value)
    if (t) {
      t.name = templateForm.value.name
      t.type = templateForm.value.type
      t.content = templateForm.value.content
      t.updateTime = new Date().toISOString().slice(0, 10)
      const [prefix, num] = t.version.replace(/^V/, '').split('.')
      t.version = `V${prefix}.${Number(num || 0) + 1}`
    }
    showTemplateDialog.value = false
    editingTemplateId.value = null
    templateForm.value = { name: '', type: '商铺租赁', content: '' }
    ElMessage.success('模板已更新')
    return
  }
  const newId = `TPL-${String(templates.value.length + 1).padStart(3, '0')}`
  templates.value.push({
    id: newId,
    name: templateForm.value.name,
    type: templateForm.value.type,
    version: 'V1.0',
    updateTime: new Date().toISOString().slice(0, 10),
    useCount: 0,
    content: templateForm.value.content
  })
  showTemplateDialog.value = false
  templateForm.value = { name: '', type: '商铺租赁', content: '' }
  ElMessage.success('模板创建成功')
}

// 电子签章
const signStats = computed(() => {
  const total = contractStore.visibleContracts.filter(c => c.electronic).length
  const pending = contractStore.visibleContracts.filter(c => !c.electronic).length
  return {
    total,
    pending,
    expired: 2,
    rate: contractStore.visibleContracts.length > 0 ? ((total / contractStore.visibleContracts.length) * 100).toFixed(1) : '0.0'
  }
})

const pendingSignContracts = computed(() => contractStore.visibleContracts)

const showSignDialog = ref(false)
const signingRow = ref(null)
const signStep = ref(0)
const signTemplateId = ref('TPL-001')

function startSign(row) {
  signingRow.value = row
  const matchTpl = templates.value.find(t => {
    if (row.assetName?.includes('商铺')) return t.type === '商铺租赁'
    if (row.assetName?.includes('厂房')) return t.type === '厂房租赁'
    if (row.assetName?.includes('办公')) return t.type === '办公楼租赁'
    if (row.assetName?.includes('仓')) return t.type === '仓储租赁'
    return false
  })
  signTemplateId.value = matchTpl ? matchTpl.id : 'TPL-001'
  signStep.value = 0
  showSignDialog.value = true
}

function previewSign(row) {
  signingRow.value = row
  signStep.value = 1
  showSignDialog.value = true
}

function finishSign() {
  if (signingRow.value) {
    signingRow.value.electronic = true
  }
  showSignDialog.value = false
  signStep.value = 0
  ElMessage.success('电子签章完成，合同已自动归档')
}

// 合同归档
const archiveYear = ref('')
const archiveKeyword = ref('')
const showArchiveDrawer = ref(false)
const currentArchive = ref(null)

const archiveList = ref([
  { id: 'HT-2025-001', assetName: '城关商铺A-01', tenant: '福州长乐融辉贸易有限公司', archiveDate: '2025-03-15', archiveNo: 'DA-2025-001', storageType: '电子+纸质' },
  { id: 'HT-2025-002', assetName: '航城厂房1#', tenant: '福建省长乐市鸿运纺织有限公司', archiveDate: '2025-04-20', archiveNo: 'DA-2025-002', storageType: '电子' },
  { id: 'HT-2025-003', assetName: '漳港办公楼2层', tenant: '长乐区鑫源投资有限公司', archiveDate: '2025-06-10', archiveNo: 'DA-2025-003', storageType: '电子+纸质' },
  { id: 'HT-2024-001', assetName: '营前仓库B-03', tenant: '福州航城物流有限公司', archiveDate: '2024-02-28', archiveNo: 'DA-2024-001', storageType: '纸质' },
  { id: 'HT-2024-005', assetName: '首占商铺C-08', tenant: '长乐吴航街道陈氏食品店', archiveDate: '2024-08-15', archiveNo: 'DA-2024-005', storageType: '电子' },
])

const filteredArchives = computed(() => {
  return archiveList.value.filter(a => {
    if (archiveYear.value && !a.archiveDate.startsWith(archiveYear.value)) return false
    if (archiveKeyword.value) {
      const kw = archiveKeyword.value.toLowerCase()
      if (!a.id.toLowerCase().includes(kw) && !a.tenant.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

function handleArchive(row) {
  ElMessageBox.confirm(`确认将合同"${row.id}"归档？归档后合同状态不变，但将纳入归档管理。`, '合同归档', { type: 'info' }).then(() => {
    archiveList.value.unshift({
      id: row.id,
      assetName: row.assetName,
      tenant: row.tenant,
      archiveDate: new Date().toISOString().slice(0, 10),
      archiveNo: `DA-${new Date().getFullYear()}-${String(archiveList.value.length + 1).padStart(3, '0')}`,
      storageType: row.electronic ? '电子' : '电子+纸质'
    })
    ElMessage.success('合同已归档')
  }).catch(() => {})
}

function viewArchive(row) {
  currentArchive.value = row
  showArchiveDrawer.value = true
}

function unarchive(row) {
  ElMessageBox.confirm(`确认将归档合同"${row.id}"退回？`, '退回确认', { type: 'warning' }).then(() => {
    const idx = archiveList.value.findIndex(a => a.id === row.id)
    if (idx > -1) archiveList.value.splice(idx, 1)
    ElMessage.success('合同已退回')
  }).catch(() => {})
}

// 合同审批
const approvalFilter = ref('')
const showApproveDialog = ref(false)
const showApprovalDrawer = ref(false)
const currentApproval = ref(null)
const approveOpinion = ref('')

const approvalList = ref([
  {
    leaseNo: 'ZL-2026-015', assetName: '城关商铺A-05', tenant: '长乐区某餐饮管理有限公司', startDate: '2026-10-01', endDate: '2029-09-30', annualRent: 8.5, applyTime: '2026-09-12', status: '待审批',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2026-09-12 10:20', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '', status: '进行中' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '未开始' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' },
    ]
  },
  {
    leaseNo: 'ZL-2026-014', assetName: '航城厂房2#', tenant: '福建某智能装备有限公司', startDate: '2026-10-15', endDate: '2031-10-14', annualRent: 45, applyTime: '2026-09-05', status: '审批中',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2026-09-05 14:30', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-09-07 09:15', status: '已完成' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '进行中' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' },
    ]
  },
  {
    leaseNo: 'ZL-2026-013', assetName: '漳港办公楼3层', tenant: '长乐区鑫源投资有限公司', startDate: '2026-09-01', endDate: '2028-08-31', annualRent: 12, applyTime: '2026-08-20', status: '已通过',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-08-20 11:00', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-08-21 15:40', status: '已完成' },
      { name: '复审', handler: '财务部：陈敏', time: '2026-08-23 10:05', status: '已完成' },
      { name: '审批', handler: '分管领导：郑总', time: '2026-08-25 16:20', status: '已完成' },
    ]
  },
  {
    leaseNo: 'ZL-2026-012', assetName: '首占商铺C-12', tenant: '陈某', startDate: '2026-09-01', endDate: '2027-08-31', annualRent: 2.4, applyTime: '2026-08-10', status: '已驳回',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-08-10 09:30', status: '已完成' },
      { name: '初审', handler: '资产管理部：李强', time: '2026-08-12 14:10', status: '已驳回' },
      { name: '复审', handler: '财务部：陈敏', time: '', status: '未开始' },
      { name: '审批', handler: '分管领导：郑总', time: '', status: '未开始' },
    ]
  },
])

const filteredApprovals = computed(() =>
  approvalFilter.value ? approvalList.value.filter(a => a.status === approvalFilter.value) : approvalList.value
)

const approvalStats = computed(() => ({
  pending: approvalList.value.filter(a => a.status === '待审批').length,
  inProgress: approvalList.value.filter(a => a.status === '审批中').length,
  approved: approvalList.value.filter(a => a.status === '已通过').length,
  rejected: approvalList.value.filter(a => a.status === '已驳回').length,
}))

function approvalStatusType(status) {
  return { '待审批': 'warning', '审批中': '', '已通过': 'success', '已驳回': 'danger' }[status] || 'info'
}

function viewApproval(row) {
  currentApproval.value = row
  showApprovalDrawer.value = true
}

function openApprove(row) {
  currentApproval.value = row
  approveOpinion.value = ''
  showApproveDialog.value = true
}

function submitApproval(pass) {
  const row = currentApproval.value
  if (!row) return
  if (!pass && !approveOpinion.value) {
    ElMessage.warning('驳回时请填写审批意见')
    return
  }
  const now = new Date().toLocaleString('zh-CN', { hour12: false }).slice(0, 16)
  const step = row.steps.find(s => s.status === '进行中')
  if (!pass) {
    if (step) { step.status = '已驳回'; step.time = now }
    row.status = '已驳回'
    ElMessage.warning(`已驳回 ${row.leaseNo}，意见已记录`)
  } else if (step) {
    step.status = '已完成'
    step.time = now
    const next = row.steps.find(s => s.status === '未开始')
    if (next) {
      next.status = '进行中'
      row.status = '审批中'
      ElMessage.success(`${step.name}通过，流转至"${next.name}"环节`)
    } else {
      row.status = '已通过'
      ElMessage.success(`${row.leaseNo} 审批全部通过`)
    }
  }
  showApproveDialog.value = false
}

// 承租方台账
const tenantTypeFilter = ref('')
const tenantKeyword = ref('')
const showTenantDialog = ref(false)
const showTenantDrawer = ref(false)
const currentTenant = ref(null)
const tenantForm = ref({ isEdit: false, tenantNo: '', name: '', type: '企业', idNo: '', contact: '', phone: '' })

const tenantLedger = ref([
  { tenantNo: 'CZF-001', name: '福州长乐融辉贸易有限公司', type: '企业', idNo: '91350112MA31XXXX2K', contact: '王经理', phone: '13805910001', contractCount: 2, registerTime: '2024-03-15' },
  { tenantNo: 'CZF-002', name: '福建省长乐市鸿运纺织有限公司', type: '企业', idNo: '913501827XXXXXX35B', contact: '林总', phone: '13905910002', contractCount: 1, registerTime: '2024-05-20' },
  { tenantNo: 'CZF-003', name: '长乐区鑫源投资有限公司', type: '企业', idNo: '91350112MAXXXX8T7Q', contact: '陈经理', phone: '13705910003', contractCount: 1, registerTime: '2025-01-10' },
  { tenantNo: 'CZF-004', name: '张某', type: '个人', idNo: '3501821990XXXX1234', contact: '张某', phone: '15859100004', contractCount: 1, registerTime: '2025-06-08' },
  { tenantNo: 'CZF-005', name: '长乐吴航街道陈氏食品店', type: '个人', idNo: '92350112MAXXXX6L6D', contact: '陈某', phone: '15959100005', contractCount: 1, registerTime: '2024-08-15' },
])

const filteredTenants = computed(() => tenantLedger.value.filter(t => {
  if (tenantTypeFilter.value && t.type !== tenantTypeFilter.value) return false
  if (tenantKeyword.value) {
    const kw = tenantKeyword.value.toLowerCase()
    if (![t.name, t.idNo, t.contact].some(v => v.toLowerCase().includes(kw))) return false
  }
  return true
}))

const tenantContracts = computed(() => {
  if (!currentTenant.value) return []
  return contractStore.visibleContracts.filter(c => c.tenant === currentTenant.value.name)
})

function openTenantDialog(row) {
  tenantForm.value = row
    ? { isEdit: true, ...row }
    : { isEdit: false, tenantNo: '', name: '', type: '企业', idNo: '', contact: '', phone: '' }
  showTenantDialog.value = true
}

function saveTenant() {
  const f = tenantForm.value
  if (!f.name || !f.idNo || !f.contact || !f.phone) {
    ElMessage.warning('请填写完整的承租方信息')
    return
  }
  if (f.isEdit) {
    const row = tenantLedger.value.find(t => t.tenantNo === f.tenantNo)
    if (row) Object.assign(row, { name: f.name, type: f.type, idNo: f.idNo, contact: f.contact, phone: f.phone })
    ElMessage.success('承租方信息已更新')
  } else {
    tenantLedger.value.unshift({
      tenantNo: `CZF-${String(tenantLedger.value.length + 1).padStart(3, '0')}`,
      name: f.name, type: f.type, idNo: f.idNo, contact: f.contact, phone: f.phone,
      contractCount: 0, registerTime: new Date().toISOString().slice(0, 10)
    })
    ElMessage.success('承租方已新增')
  }
  showTenantDialog.value = false
}

function viewTenant(row) {
  currentTenant.value = row
  showTenantDrawer.value = true
}

function deleteTenant(row) {
  if (row.contractCount > 0) {
    ElMessage.warning(`承租方"${row.name}"存在 ${row.contractCount} 份在租合同，不可删除`)
    return
  }
  ElMessageBox.confirm(`确认删除承租方"${row.name}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = tenantLedger.value.findIndex(t => t.tenantNo === row.tenantNo)
    if (idx > -1) tenantLedger.value.splice(idx, 1)
    ElMessage.success('承租方已删除')
  }).catch(() => {})
}

// ===== 续租/退租结算 =====
const settlementFilter = ref('')
const settlementKeyword = ref('')
const showSettlementDialog = ref(false)
const showSettlementDetail = ref(false)
const settlementContract = ref(null)
const settlementAction = ref('renew')
const settlementDetailRow = ref(null)

const renewForm = ref({ startDate: '', endDate: '', annualRent: 0 })
const terminateForm = ref({ date: '', reason: '合同到期自然终止', assetCondition: '完好可继续出租', damageDeduction: 0 })

function daysLeft(contract) {
  const end = new Date(contract.endDate)
  const now = new Date()
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

function classifySettlement(c) {
  if (c.settlementStatus) return c.settlementStatus
  const d = daysLeft(c)
  if (d < 0) return '已到期'
  if (d <= 30) return '即将到期'
  return '正常'
}

const settlementContracts = computed(() => {
  dataVersion.value
  return contractStore.visibleContracts
    .filter(c => c.status !== '已终止' && c.status !== '退租')
    .map(c => ({ ...c, settlementStatus: c.settlementStatus || classifySettlement(c) }))
    .filter(c => ['即将到期', '已到期', '已续租', '已退租'].includes(c.settlementStatus))
})

const filteredSettlements = computed(() => {
  return settlementContracts.value.filter(c => {
    if (settlementFilter.value && c.settlementStatus !== settlementFilter.value) return false
    if (settlementKeyword.value) {
      const kw = settlementKeyword.value.toLowerCase()
      if (!c.id.toLowerCase().includes(kw) && !c.tenant.toLowerCase().includes(kw)) return false
    }
    return true
  })
})

const settlementStats = computed(() => {
  const list = settlementContracts.value
  return {
    expiring: list.filter(c => c.settlementStatus === '即将到期').length,
    expired: list.filter(c => c.settlementStatus === '已到期').length,
    renewed: list.filter(c => c.settlementStatus === '已续租').length,
    terminated: list.filter(c => c.settlementStatus === '已退租').length
  }
})

function settlementStatusType(status) {
  return { '即将到期': 'warning', '已到期': 'danger', '已续租': 'success', '已退租': 'info' }[status] || 'info'
}

function calcSettlementItems(contract, action) {
  const items = []
  const deposit = contract.deposit || 0
  const arrears = contract.arrears || 0
  const annualRent = contract.annualRent || 0
  const dailyRent = Math.round(annualRent / 365 * 10000) / 10000

  items.push({ item: '保证金退还', amount: deposit, remark: `原保证金 ${deposit} 万元全额退回` })

  if (arrears > 0) {
    items.push({ item: '欠费冲抵', amount: -arrears, remark: `承租方欠费 ${arrears} 万元，从保证金中扣除` })
  }

  if (action === 'terminate') {
    const termDate = terminateForm.value.date || contract.endDate
    const endDate = new Date(contract.endDate)
    const term = new Date(termDate)
    const diffDays = Math.ceil((endDate - term) / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      const prepaidRefund = Math.round(dailyRent * diffDays * 100) / 100
      items.push({ item: '预缴租金退还', amount: prepaidRefund, remark: `提前 ${diffDays} 天退租，按日退还租金` })
    } else if (diffDays < 0) {
      const overdueAmount = Math.round(dailyRent * Math.abs(diffDays) * 100) / 100
      items.push({ item: '超期占用费', amount: -overdueAmount, remark: `超期 ${Math.abs(diffDays)} 天，按日收取占用费` })
    }

    if (terminateForm.value.assetCondition === '有损坏需扣保证金' && terminateForm.value.damageDeduction > 0) {
      items.push({ item: '损坏扣款', amount: -terminateForm.value.damageDeduction, remark: '资产损坏从保证金中扣除' })
    }

    if (contract.status === '欠缴' || arrears > 0) {
      const penalty = Math.round(arrears * 0.001 * Math.max(0, daysLeft(contract) < 0 ? Math.abs(daysLeft(contract)) : 0) * 100) / 100
      if (penalty > 0) {
        items.push({ item: '滞纳金', amount: -penalty, remark: '欠费滞纳金（日千分之一）' })
      }
    }
  }

  if (action === 'renew') {
    items.push({ item: '保证金转续', amount: -deposit, remark: '原保证金转入新合同' })
    const newDeposit = Math.round((renewForm.value.annualRent || annualRent) * 2 * 100) / 100
    items.push({ item: '新合同保证金', amount: newDeposit, remark: `新合同保证金 ${newDeposit} 万元` })
  }

  return items
}

const settlementItems = computed(() => {
  if (!settlementContract.value) return []
  return calcSettlementItems(settlementContract.value, settlementAction.value)
})

function settlementSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    if (index === 1) {
      const total = data.reduce((s, r) => s + (r.amount || 0), 0)
      sums[index] = `${total >= 0 ? '应退 ' : '应补 '}${Math.abs(Math.round(total * 100) / 100).toLocaleString()} 万元`
      return
    }
    sums[index] = ''
  })
  return sums
}

function getSettlementDetailSummary({ columns, data }) {
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    if (index === 1) {
      const total = data.reduce((s, r) => s + (r.amount || 0), 0)
      sums[index] = `${total >= 0 ? '应退 ' : '应补 '}${Math.abs(Math.round(total * 100) / 100).toLocaleString()} 万元`
      return
    }
    sums[index] = ''
  })
  return sums
}

function openSettlement(contract, action) {
  settlementContract.value = contract
  settlementAction.value = action
  const end = new Date(contract.endDate)
  if (action === 'renew') {
    renewForm.value = {
      startDate: contract.endDate,
      endDate: new Date(end.getFullYear() + 3, end.getMonth(), end.getDate()).toISOString().slice(0, 10),
      annualRent: contract.annualRent
    }
  } else {
    terminateForm.value = {
      date: contract.endDate,
      reason: daysLeft(contract) <= 0 ? '合同到期自然终止' : '承租方提前退租',
      assetCondition: '完好可继续出租',
      damageDeduction: 0
    }
  }
  showSettlementDialog.value = true
}

function submitSettlement() {
  const c = settlementContract.value
  if (!c) return

  if (settlementAction.value === 'renew') {
    if (!renewForm.value.startDate || !renewForm.value.endDate) {
      ElMessage.warning('请填写续租期限')
      return
    }
    const newContract = contractStore.signContract({
      assetId: c.assetId,
      assetName: c.assetName,
      tenant: c.tenant,
      startDate: renewForm.value.startDate,
      endDate: renewForm.value.endDate,
      leaseArea: c.leaseArea,
      annualRent: renewForm.value.annualRent,
      deposit: Math.round(renewForm.value.annualRent * 2 * 100) / 100,
      increment: c.increment || '每年递增3%',
      status: '正常',
      electronic: false,
      arrears: 0,
      overdueDays: 0,
      source: `续租${c.id}`
    })
    c.settlementStatus = '已续租'
    c.settlementDate = new Date().toISOString().slice(0, 10)
    c.settlementAction = 'renew'
    c.settlementItems = calcSettlementItems(c, 'renew')
    c.newContractId = newContract.id
    c.renewStart = renewForm.value.startDate
    c.renewEnd = renewForm.value.endDate
    c.newAnnualRent = renewForm.value.annualRent
    // 原合同转为退租，避免与新合同重复占用租赁面积
    contractStore.updateContract(c.id, { status: '退租' })
    contractStore.syncAssetLeaseState(c.assetId)
    dataVersion.value++
    ElMessage.success(`续租完成，已生成新合同 ${newContract.id}`)
  } else {
    if (!terminateForm.value.date) {
      ElMessage.warning('请填写退租日期')
      return
    }
    const items = calcSettlementItems(c, 'terminate')
    // 状态置为退租后不再占用租赁面积，再由 syncAssetLeaseState 释放资产
    contractStore.updateContract(c.id, {
      status: '退租',
      settlementStatus: '已退租',
      settlementDate: new Date().toISOString().slice(0, 10),
      settlementAction: 'terminate',
      settlementItems: items,
      terminateDate: terminateForm.value.date,
      terminateReason: terminateForm.value.reason
    })
    contractStore.syncAssetLeaseState(c.assetId)
    dataVersion.value++
    ElMessage.success('退租结算完成，资产已释放')
  }

  showSettlementDialog.value = false
}

function viewSettlementDetail(row) {
  settlementDetailRow.value = row
  showSettlementDetail.value = true
}

// ===== 合同审批（资管云平台） =====
const acCompanyOptions = computed(() => userStore.isEnt ? [currentCompany.value] : ['城投集团', '产投集团', '水投集团', '领航公司'])
const acFlowOptions = ['一级审批流程', '二级审批流程', '三级审批流程', '资产租赁审批流程']
const acApproverOptions = ['李强（资产管理部）', '陈敏（财务部）', '郑国华（分管领导）', '王芳（经办人）']
const acLevelOptions = ['一级审批', '二级审批', '三级审批']

const acFilter = ref({ keyword: '', company: '', status: '', rentType: '', contractType: '' })
const acPage = ref(1)
const acPageSize = ref(10)
const acSelection = ref([])
const acQueryTime = ref(new Date().toLocaleString('zh-CN', { hour12: false }))

function maskId(idNo) {
  const s = String(idNo || '')
  if (s.length <= 8) return s
  return s.slice(0, 4) + '*'.repeat(s.length - 8) + s.slice(-4)
}

const acContracts = ref([
  {
    id: 'HT-2026-031', company: '城投集团', partyA: '长乐区城投集团', partyB: '福州××商业管理有限公司', phone: '13805910001',
    lessee: { type: '企业', name: '福州××商业管理有限公司', contact: '王经理', phone: '13805910001', idNo: '91350112MA31AB2K9X' },
    signDate: '2026-08-20', leaseTime: '2026-09-01 ~ 2029-08-31', endDate: '2029-08-31',
    contractType: '资产租赁', rentType: '递增租金', usage: '商业经营', payCycle: '季缴', payDeadline: '2026-09-25',
    monthlyRent: 35000, reduction: 10500, deposit: 105000, arrearsMonths: 0,
    flow: '二级审批流程', status: '待审批', attachment: '合同扫描件.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '吴航街道商业街', zone: 'A区', name: 'A-01 商铺', code: 'CT-001', location: '吴航街道商业街一层临街', company: '城投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-08-20 10:12' },
      { title: '部门初审', auditor: '李强', time: '2026-08-21 15:40' }
    ]
  },
  {
    id: 'HT-2026-030', company: '领航公司', partyA: '长乐区领航公司', partyB: '福建××科技有限公司', phone: '13905910002',
    lessee: { type: '企业', name: '福建××科技有限公司', contact: '林总', phone: '13905910002', idNo: '91350182MA29XY7B35' },
    signDate: '2026-08-12', leaseTime: '2026-09-01 ~ 2031-08-31', endDate: '2031-08-31',
    contractType: '资产租赁', rentType: '固定租金', usage: '办公', payCycle: '半年缴', payDeadline: '2026-09-30',
    monthlyRent: 128000, reduction: 0, deposit: 384000, arrearsMonths: 0,
    flow: '三级审批流程', status: '审批中', attachment: '合同正本.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '首占新区保障房', zone: '1#楼', name: '首占新区保障房 1# 楼商业裙房', code: 'CT-004', location: '首占新区霞洲路 88 号', company: '领航公司', leaseType: '部分租赁' }],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-08-12 09:30' },
      { title: '部门初审', auditor: '李强', time: '2026-08-14 11:20' },
      { title: '财务复审', auditor: '陈敏', time: '2026-08-16 16:05' }
    ]
  },
  {
    id: 'HT-2026-029', company: '产投集团', partyA: '长乐区产投集团', partyB: '张某', phone: '15859100004',
    lessee: { type: '个人', name: '张某', contact: '张某', phone: '15859100004', idNo: '350182199001011234' },
    signDate: '2026-07-28', leaseTime: '2026-08-01 ~ 2027-07-31', endDate: '2027-07-31',
    contractType: '续租合同', rentType: '固定租金', usage: '居住配套经营', payCycle: '月缴', payDeadline: '2026-09-05',
    monthlyRent: 4200, reduction: 800, deposit: 8400, arrearsMonths: 2,
    flow: '一级审批流程', status: '审批中', attachment: '续租申请.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '首占商铺', zone: 'C区', name: 'C-08 商铺', code: 'CT-009', location: '首占街道商铺 C-08', company: '产投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-07-28 14:02' },
      { title: '部门初审', auditor: '李强', time: '2026-07-30 09:18' }
    ]
  },
  {
    id: 'HT-2026-028', company: '水投集团', partyA: '长乐区水投集团', partyB: '长乐××物流有限公司', phone: '13705910003',
    lessee: { type: '企业', name: '长乐××物流有限公司', contact: '陈经理', phone: '13705910003', idNo: '91350112MA33KL8T7Q' },
    signDate: '2026-07-15', leaseTime: '2026-08-01 ~ 2028-07-31', endDate: '2028-07-31',
    contractType: '意向转合同', rentType: '递增租金', usage: '仓储物流', payCycle: '季缴', payDeadline: '2026-09-20',
    monthlyRent: 62000, reduction: 20000, deposit: 186000, arrearsMonths: 0,
    flow: '资产租赁审批流程', status: '审批完成', attachment: '合同正本.pdf', agreement: '免租期 2 个月，期满租金按年递增 3%。',
    assets: [
      { region: '福建省福州市长乐区', project: '营前标准厂房', zone: '2#', name: '营前标准厂房 2# 仓库', code: 'CT-003', location: '营前街道工业区 12 号', company: '水投集团', leaseType: '整租' },
      { region: '福建省福州市长乐区', project: '江田镇仓储用地', zone: 'B区', name: '江田仓储 B-03', code: 'CT-005', location: '江田镇仓储园区', company: '水投集团', leaseType: '部分租赁' }
    ],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-07-15 10:00' },
      { title: '部门初审', auditor: '李强', time: '2026-07-16 15:30' },
      { title: '财务复审', auditor: '陈敏', time: '2026-07-18 09:45' },
      { title: '领导审批', auditor: '郑国华', time: '2026-07-20 16:20' }
    ]
  },
  {
    id: 'HT-2026-027', company: '城投集团', partyA: '长乐区城投集团', partyB: '长乐××市场管理有限公司', phone: '15959100005',
    lessee: { type: '企业', name: '长乐××市场管理有限公司', contact: '陈某', phone: '15959100005', idNo: '92350112MA34MN6L6D' },
    signDate: '2026-06-30', leaseTime: '2026-07-01 ~ 2026-10-15', endDate: '2026-10-15',
    contractType: '资产租赁', rentType: '固定租金', usage: '农贸市场经营', payCycle: '月缴', payDeadline: '2026-09-10',
    monthlyRent: 56000, reduction: 0, deposit: 112000, arrearsMonths: 1,
    flow: '二级审批流程', status: '待审批', attachment: '合同扫描件.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '吴航农贸市场', zone: '主楼', name: '吴航农贸市场一层摊位区', code: 'CT-007', location: '吴航街道农贸市场', company: '城投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-06-30 11:25' }
    ]
  },
  {
    id: 'HT-2026-026', company: '领航公司', partyA: '长乐区领航公司', partyB: '长乐××教育培训有限公司', phone: '13605910006',
    lessee: { type: '企业', name: '长乐××教育培训有限公司', contact: '刘主任', phone: '13605910006', idNo: '91350112MA35PQ4R2M' },
    signDate: '2026-06-18', leaseTime: '2026-07-01 ~ 2029-06-30', endDate: '2029-06-30',
    contractType: '资产租赁', rentType: '递增租金', usage: '教育培训', payCycle: '半年缴', payDeadline: '2026-10-08',
    monthlyRent: 48000, reduction: 15000, deposit: 96000, arrearsMonths: 0,
    flow: '三级审批流程', status: '审批完成', attachment: '合同正本.pdf', agreement: '前 3 个月为免租装修期。',
    assets: [{ region: '福建省福州市长乐区', project: '营前标准厂房', zone: '2#', name: '营前标准厂房 2# 三层', code: 'CT-003', location: '营前街道工业区 12 号', company: '领航公司', leaseType: '部分租赁' }],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-06-18 09:00' },
      { title: '部门初审', auditor: '李强', time: '2026-06-19 14:20' },
      { title: '财务复审', auditor: '陈敏', time: '2026-06-21 10:10' },
      { title: '领导审批', auditor: '郑国华', time: '2026-06-23 15:55' }
    ]
  },
  {
    id: 'HT-2026-025', company: '产投集团', partyA: '长乐区产投集团', partyB: '福建××电子商务有限公司', phone: '13505910007',
    lessee: { type: '企业', name: '福建××电子商务有限公司', contact: '黄经理', phone: '13505910007', idNo: '91350112MA36ST9W5K' },
    signDate: '2026-06-05', leaseTime: '2026-06-15 ~ 2026-11-10', endDate: '2026-11-10',
    contractType: '意向转合同', rentType: '固定租金', usage: '电商办公', payCycle: '季缴', payDeadline: '2026-09-15',
    monthlyRent: 26000, reduction: 5000, deposit: 52000, arrearsMonths: 0,
    flow: '一级审批流程', status: '审批完成', attachment: '意向书.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '吴航农贸市场', zone: '附楼', name: '农贸市场附楼 2F', code: 'CT-007', location: '吴航街道农贸市场附楼', company: '产投集团', leaseType: '部分租赁' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-06-05 16:40' },
      { title: '部门初审', auditor: '李强', time: '2026-06-07 09:30' }
    ]
  },
  {
    id: 'HT-2026-024', company: '水投集团', partyA: '长乐区水投集团', partyB: '长乐××新能源科技有限公司', phone: '13405910008',
    lessee: { type: '企业', name: '长乐××新能源科技有限公司', contact: '周工', phone: '13405910008', idNo: '91350112MA37UV2X8N' },
    signDate: '2026-05-20', leaseTime: '2026-06-01 ~ 2031-05-31', endDate: '2031-05-31',
    contractType: '资产租赁', rentType: '递增租金', usage: '生产研发', payCycle: '年缴', payDeadline: '2026-12-01',
    monthlyRent: 96000, reduction: 30000, deposit: 288000, arrearsMonths: 0,
    flow: '资产租赁审批流程', status: '审批完成', attachment: '合同正本.pdf', agreement: '每三年递增 10%。',
    assets: [{ region: '福建省福州市长乐区', project: '航城商务楼', zone: '3F', name: '航城商务楼 3F', code: 'CT-002', location: '航城街道商务楼 3 层', company: '水投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-05-20 10:15' },
      { title: '部门初审', auditor: '李强', time: '2026-05-21 15:00' },
      { title: '财务复审', auditor: '陈敏', time: '2026-05-23 11:35' },
      { title: '领导审批', auditor: '郑国华', time: '2026-05-25 14:50' }
    ]
  },
  {
    id: 'HT-2026-023', company: '城投集团', partyA: '长乐区城投集团', partyB: '福州××健康管理有限公司', phone: '13305910009',
    lessee: { type: '企业', name: '福州××健康管理有限公司', contact: '吴经理', phone: '13305910009', idNo: '91350112MA38YZ6A1P' },
    signDate: '2026-05-08', leaseTime: '2026-05-15 ~ 2029-05-14', endDate: '2029-05-14',
    contractType: '资产租赁', rentType: '固定租金', usage: '康养服务', payCycle: '季缴', payDeadline: '2026-09-28',
    monthlyRent: 38000, reduction: 12000, deposit: 114000, arrearsMonths: 3,
    flow: '二级审批流程', status: '待审批', attachment: '合同扫描件.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '梅花镇综合楼', zone: '主楼', name: '梅花镇综合楼 1-2 层', code: 'CT-008', location: '梅花镇综合楼', company: '城投集团', leaseType: '部分租赁' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-05-08 09:40' },
      { title: '部门初审', auditor: '李强', time: '2026-05-09 16:10' }
    ]
  },
  {
    id: 'HT-2026-022', company: '领航公司', partyA: '长乐区领航公司', partyB: '福州××餐饮管理有限公司', phone: '13205910010',
    lessee: { type: '企业', name: '福州××餐饮管理有限公司', contact: '郑店长', phone: '13205910010', idNo: '91350112MA39BC4D7Q' },
    signDate: '2026-04-15', leaseTime: '2026-05-01 ~ 2028-04-30', endDate: '2028-04-30',
    contractType: '资产租赁', rentType: '递增租金', usage: '餐饮', payCycle: '月缴', payDeadline: '2026-09-08',
    monthlyRent: 22000, reduction: 0, deposit: 44000, arrearsMonths: 0,
    flow: '一级审批流程', status: '审批完成', attachment: '合同正本.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '吴航街道商业街', zone: 'B区', name: 'B-05 商铺', code: 'CT-010', location: '吴航街道商业街 B 区', company: '领航公司', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-04-15 14:05' },
      { title: '部门初审', auditor: '李强', time: '2026-04-16 10:25' }
    ]
  },
  {
    id: 'HT-2026-021', company: '产投集团', partyA: '长乐区产投集团', partyB: '长乐吴航街道陈氏食品店', phone: '13105910011',
    lessee: { type: '个人', name: '陈某某', contact: '陈某某', phone: '13105910011', idNo: '350182198512154321' },
    signDate: '2026-03-20', leaseTime: '2026-04-01 ~ 2027-03-31', endDate: '2027-03-31',
    contractType: '续租合同', rentType: '固定租金', usage: '食品零售', payCycle: '月缴', payDeadline: '2026-09-06',
    monthlyRent: 6800, reduction: 600, deposit: 13600, arrearsMonths: 0,
    flow: '一级审批流程', status: '已作废', attachment: '', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '首占商铺', zone: 'C区', name: 'C-12 商铺', code: 'CT-011', location: '首占街道商铺 C-12', company: '产投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '王芳', time: '2026-03-20 11:00' }
    ]
  },
  {
    id: 'HT-2026-020', company: '水投集团', partyA: '长乐区水投集团', partyB: '福建某智能装备有限公司', phone: '13005910012',
    lessee: { type: '企业', name: '福建某智能装备有限公司', contact: '许厂长', phone: '13005910012', idNo: '91350182MA40EF8G3R' },
    signDate: '2026-03-05', leaseTime: '2026-03-15 ~ 2026-10-20', endDate: '2026-10-20',
    contractType: '资产租赁', rentType: '固定租金', usage: '工业生产', payCycle: '半年缴', payDeadline: '2026-09-18',
    monthlyRent: 152000, reduction: 45000, deposit: 456000, arrearsMonths: 0,
    flow: '三级审批流程', status: '审批中', attachment: '合同正本.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '玉田镇旧工业厂房', zone: '1#', name: '玉田镇旧工业厂房 1#', code: 'CT-006', location: '玉田镇工业路 6 号', company: '水投集团', leaseType: '整租' }],
    auditSteps: [
      { title: '提交申请', auditor: '赵磊', time: '2026-03-05 09:10' },
      { title: '部门初审', auditor: '李强', time: '2026-03-06 15:45' },
      { title: '财务复审', auditor: '陈敏', time: '2026-03-08 10:30' }
    ]
  }
])

const myAcContracts = computed(() =>
  userStore.isEnt ? acContracts.value.filter(c => c.company === currentCompany.value) : acContracts.value
)

const acStats = computed(() => {
  const list = myAcContracts.value
  const now = new Date()
  return {
    total: list.length,
    expiring: list.filter(c => {
      const d = Math.ceil((new Date(c.endDate) - now) / 86400000)
      return d >= 0 && d <= 90
    }).length,
    pending: list.filter(c => c.status === '待审批').length,
    approving: list.filter(c => c.status === '审批中').length,
    voided: list.filter(c => c.status === '已作废').length,
    assets: list.reduce((s, c) => s + c.assets.length, 0)
  }
})

const acCards = computed(() => [
  { label: '合同总数', value: acStats.value.total, icon: Document, color: '#1668DC', key: 'total' },
  { label: '即将到期', value: acStats.value.expiring, icon: AlarmClock, color: '#E8912A', key: 'expiring' },
  { label: '待处理', value: acStats.value.pending, icon: WarningFilled, color: '#D93026', key: '待审批' },
  { label: '审批中', value: acStats.value.approving, icon: Stamp, color: '#722ed1', key: '审批中' },
  { label: '已作废', value: acStats.value.voided, icon: CircleClose, color: '#94A3B8', key: '已作废' }
])

function drillAc(card) {
  if (card.key === 'total' || card.key === 'expiring') {
    acFilter.value.status = ''
  } else {
    acFilter.value.status = card.key
  }
  acPage.value = 1
}

function refreshAc() {
  acQueryTime.value = new Date().toLocaleString('zh-CN', { hour12: false })
  acPage.value = 1
  ElMessage.success('数据已刷新')
}

function acStatusType(status) {
  return { '待审批': 'warning', '审批中': '', '审批完成': 'success', '已作废': 'info' }[status] || 'info'
}

const filteredAcContracts = computed(() => myAcContracts.value.filter(c => {
  const f = acFilter.value
  if (f.keyword) {
    const kw = f.keyword.toLowerCase()
    if (![c.partyB, c.phone, c.id].some(v => String(v).toLowerCase().includes(kw))) return false
  }
  if (f.company && c.company !== f.company) return false
  if (f.status && c.status !== f.status) return false
  if (f.rentType && c.rentType !== f.rentType) return false
  if (f.contractType && c.contractType !== f.contractType) return false
  return true
}))

const pagedAcContracts = computed(() => {
  const start = (acPage.value - 1) * acPageSize.value
  return filteredAcContracts.value.slice(start, start + acPageSize.value)
})

function acDownloadTemplate() {
  const headers = ['合同编号', '甲方', '乙方', '乙方手机号', '资产名称', '签约日期', '租赁结束日期', '合同类型', '租金类型', '使用方式', '缴费周期', '月租金(元)', '保证金(元)', '减免金额(元)']
  const exampleRow = ['（自动生成）', '长乐区城投集团', '承租方名称', '13800000000', '资产名称', '2026-01-01', '2029-01-01', '资产租赁', '固定租金', '商业经营', '季缴', '10000', '30000', '0']
  const csv = '\uFEFF' + [headers.join(','), exampleRow.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `合同导入模板_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('合同导入模板已下载')
}

function acImport() {
  showAcImportDialog.value = true
}

function acBatchAssign() {
  if (!acSelection.value.length) { ElMessage.warning('请先选择合同'); return }
  ElMessageBox.prompt('请输入经办人姓名', '分配经办人', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '经办人不能为空'
  }).then(({ value }) => {
    acSelection.value.forEach(row => {
      row.assignee = value
      if (row.status === '待审批') row.status = '审批中'
    })
    dataVersion.value++
    ElMessage.success(`已将 ${acSelection.value.length} 份合同分配给经办人`)
    acSelection.value = []
  }).catch(() => {})
}

function acBatchVoid() {
  ElMessageBox.confirm(`确认作废选中的 ${acSelection.value.length} 份合同？`, '批量作废', { type: 'warning' }).then(() => {
    acSelection.value.forEach(row => { row.status = '已作废' })
    acSelection.value = []
    ElMessage.success('已批量作废')
  }).catch(() => {})
}

function acExportApproved() {
  const approved = myAcContracts.value.filter(c => c.status === '审批完成')
  const headers = ['合同编号', '甲方', '乙方', '乙方手机号', '资产名称', '签约日期', '租赁结束日期', '合同类型', '租金类型', '月租金(元)', '保证金(元)', '状态']
  const rows = approved.map(c => [c.id, c.partyA, c.partyB, c.phone, c.assets.map(a => a.name).join('/'), c.signDate, c.endDate, c.contractType, c.rentType, c.monthlyRent, c.deposit, c.status])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `审批完成合同_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${approved.length} 条审批完成合同`)
}

function handleAcCommand(cmd, row) {
  if (cmd === 'preview') {
    openAcPreview(row)
  } else if (cmd === 'renew') {
    openAcRenew(row)
  } else if (cmd === 'refund') {
    openAcRefund(row)
  } else if (cmd === 'terminate') {
    openAcTerminate(row)
  } else if (cmd === 'assign') {
    ElMessageBox.prompt('请输入经办人姓名', '分配合同', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: row.assignee || '',
      inputPattern: /\S+/,
      inputErrorMessage: '经办人不能为空'
    }).then(({ value }) => {
      row.assignee = value
      if (row.status === '待审批') row.status = '审批中'
      dataVersion.value++
      ElMessage.success(`合同 ${row.id} 已分配给 ${value}`)
    }).catch(() => {})
  } else if (cmd === 'void') {
    ElMessageBox.confirm(`确认作废合同"${row.id}"？`, '作废确认', { type: 'warning' }).then(() => {
      row.status = '已作废'
      ElMessage.success('合同已作废')
    }).catch(() => {})
  }
}

function acPreviewFile(row) {
  acFilePreviewRow.value = row
  showAcFilePreview.value = true
}

const showAcPreview = ref(false)
const acPreviewRow = ref(null)

function openAcPreview(row) {
  acPreviewRow.value = row
  showAcPreview.value = true
}

const showAcRenew = ref(false)
const acRenewRow = ref(null)

function openAcRenew(row) {
  acRenewRow.value = row
  showAcRenew.value = true
}

function confirmAcRenew() {
  const row = acRenewRow.value
  if (!row) return
  const now = new Date()
  const newEndDate = new Date(row.endDate)
  newEndDate.setFullYear(newEndDate.getFullYear() + 1)
  const newEndStr = newEndDate.toISOString().slice(0, 10)
  Object.assign(row, {
    endDate: newEndStr,
    leaseTime: `${row.signDate} ~ ${newEndStr}`,
    status: '审批中',
    contractType: '续租合同'
  })
  row.auditSteps.push({
    title: '续租申请',
    auditor: row.lessee?.contact || '系统',
    time: now.toLocaleString('zh-CN', { hour12: false })
  })
  dataVersion.value++
  showAcRenew.value = false
  ElMessage.success(`合同 ${row.id} 续租申请已提交，租期延长至 ${newEndStr}`)
}

function openAcRefund(row) {
  ElMessageBox.confirm(`确认为合同"${row.id}"办理退租退款？退款将按剩余租期与保证金结算。`, '退租(退款)', { type: 'warning' }).then(() => {
    const now = new Date()
    const refundAmount = Math.round(row.deposit * 0.8)
    Object.assign(row, {
      status: '已退租',
      refundDate: now.toISOString().slice(0, 10),
      refundAmount: refundAmount,
      arrearsMonths: 0
    })
    row.auditSteps.push({
      title: '退租退款',
      auditor: row.lessee?.contact || '系统',
      time: now.toLocaleString('zh-CN', { hour12: false })
    })
    dataVersion.value++
    ElMessage.success(`合同 ${row.id} 退租退款已办理，退款金额 ${refundAmount.toLocaleString()} 元`)
  }).catch(() => {})
}

const showAcTerminate = ref(false)
const acTerminateRow = ref(null)
const acTerminateDate = ref('')

function openAcTerminate(row) {
  acTerminateRow.value = row
  acTerminateDate.value = ''
  showAcTerminate.value = true
}

function confirmAcTerminate() {
  const row = acTerminateRow.value
  if (!acTerminateDate.value) {
    ElMessage.warning('请选择断租时间')
    return
  }
  const min = row.payDeadline
  const max = row.endDate
  if (acTerminateDate.value < min || acTerminateDate.value > max) {
    ElMessage.error(`断租时间只能为交费截至时间（${min}）到租赁结束时间（${max}）`)
    return
  }
  const now = new Date()
  Object.assign(row, {
    status: '已断租',
    endDate: acTerminateDate.value,
    leaseTime: `${row.signDate} ~ ${acTerminateDate.value}`,
    terminateDate: acTerminateDate.value
  })
  row.auditSteps.push({
    title: '断租处理',
    auditor: row.lessee?.contact || '系统',
    time: now.toLocaleString('zh-CN', { hour12: false })
  })
  dataVersion.value++
  showAcTerminate.value = false
  ElMessage.success(`合同 ${row.id} 已断租，断租时间 ${acTerminateDate.value}`)
}

const showAcApprove = ref(false)
const acApproveRow = ref(null)
const acApproveFlow = ref('')
const acApproveRows = ref([{ approver: '', level: '' }])
const acAgreement = ref('')

function openAcApprove(row) {
  acApproveRow.value = row
  acApproveFlow.value = row.flow || ''
  acApproveRows.value = [{ approver: '', level: '' }]
  acAgreement.value = ''
  showAcApprove.value = true
}

function addAcApproveRow() {
  acApproveRows.value.push({ approver: '', level: '' })
}

function confirmAcApprove() {
  const row = acApproveRow.value
  if (!row) return
  if (!acApproveFlow.value) {
    ElMessage.warning('请选择审批流程')
    return
  }
  if (!acApproveRows.value.length || acApproveRows.value.some(r => !r.approver || !r.level)) {
    ElMessage.warning('请完整填写审批人与审批级别')
    return
  }
  row.flow = acApproveFlow.value
  row.status = '审批完成'
  row.agreement = acAgreement.value
  const now = new Date().toLocaleString('zh-CN', { hour12: false })
  acApproveRows.value.forEach(r => {
    row.auditSteps.push({ title: `${r.level}（${r.approver}）`, auditor: r.approver, time: now })
  })
  showAcApprove.value = false
  ElMessage.success(`合同 ${row.id} 审批完成`)
}

const showAcDetail = ref(false)
const acDetailRow = ref(null)

function openAcDetail(row) {
  acDetailRow.value = row
  showAcDetail.value = true
}

const showAcFilePreview = ref(false)
const acFilePreviewRow = ref(null)
const showAcImportDialog = ref(false)
const acImportFileList = ref([])

function handleAcImportFileChange(file) {
  acImportFileList.value = [file]
}

function handleAcImportConfirm() {
  if (acImportFileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  const mockContract = {
    id: `HT-${new Date().getFullYear()}-${String(acContracts.value.length + 30).padStart(3, '0')}`,
    company: currentCompany.value, partyA: `长乐区${currentCompany.value}`, partyB: '导入承租方', phone: '13800000000',
    lessee: { type: '企业', name: '导入承租方', contact: '联系人', phone: '13800000000', idNo: '91350112000000000X' },
    signDate: new Date().toISOString().slice(0, 10),
    leaseTime: `${new Date().toISOString().slice(0, 10)} ~ ${new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10)}`,
    endDate: new Date(Date.now() + 3 * 365 * 86400000).toISOString().slice(0, 10),
    contractType: '资产租赁', rentType: '固定租金', usage: '商业经营', payCycle: '季缴', payDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    monthlyRent: 10000, reduction: 0, deposit: 30000, arrearsMonths: 0,
    flow: '一级审批流程', status: '待审批', attachment: acImportFileList.value[0]?.name || '导入合同.pdf', agreement: '',
    assets: [{ region: '福建省福州市长乐区', project: '导入项目', zone: '-', name: '导入资产', code: 'IMPORT', location: '长乐区', company: currentCompany.value, leaseType: '整租' }],
    auditSteps: [{ title: '导入申请', auditor: '系统', time: new Date().toLocaleString('zh-CN', { hour12: false }) }]
  }
  acContracts.value.unshift(mockContract)
  dataVersion.value++
  showAcImportDialog.value = false
  acImportFileList.value = []
  ElMessage.success(`合同 ${mockContract.id} 导入成功`)
}

function acExportDetail() {
  const row = acDetailRow.value
  if (!row) return
  const headers = ['项目', '内容']
  const rows = [
    ['合同编号', row.id],
    ['甲方', row.partyA],
    ['乙方', row.partyB],
    ['乙方手机号', row.phone],
    ['签约日期', row.signDate],
    ['租赁期限', row.leaseTime],
    ['合同类型', row.contractType],
    ['租金类型', row.rentType],
    ['使用方式', row.usage],
    ['缴费周期', row.payCycle],
    ['月租金(元)', row.monthlyRent],
    ['保证金(元)', row.deposit],
    ['减免金额(元)', row.reduction],
    ['欠缴月数', row.arrearsMonths],
    ['合同状态', row.status],
    ['审批流程', row.flow],
    ['协定', row.agreement || '—'],
    ['资产名称', row.assets.map(a => a.name).join('/')],
    ['资产编号', row.assets.map(a => a.code).join('/')],
    ['资产座落', row.assets.map(a => a.location).join('/')]
  ]
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `合同详情_${row.id}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`合同 ${row.id} 详情已导出`)
}

function acDownloadSign(step) {
  const headers = ['审批环节', '审批人', '审批时间', '签名确认']
  const rows = [[step.title, step.auditor, step.time, '电子签名已确认']]
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `签名附件_${step.title}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已下载「${step.title}」签名附件`)
}
</script>

<style scoped>
.contract-preview {
  border: 1px solid var(--bd);
  padding: 24px;
  background: var(--bg-page);
  max-height: 400px;
  overflow-y: auto;
}
.contract-preview .contract-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
}
.contract-preview .contract-body p {
  line-height: 2;
  text-indent: 2em;
  color: var(--t-main);
}
.sign-step-content {
  padding: 4px 0;
}
.area-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 20px;
  color: var(--t-weak);
}
.area-hint .el-tag {
  margin-left: 6px;
}
.ac-dash {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--bg-card);
  border-radius: var(--r-sm);
  padding: 16px 60px 16px 24px;
  margin-bottom: 12px;
}
.ac-dash-left {
  flex: none;
  text-align: center;
}
.ac-dash-cap {
  margin-top: 6px;
  font-size: 13px;
  color: var(--t-weak);
}
.ac-dash-main {
  flex: 1;
  min-width: 0;
}
.ac-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: var(--r-sm);
  padding: 6px 12px;
  font-size: 13px;
  color: var(--t-sub);
  margin-bottom: 12px;
}
.ac-red {
  color: var(--c-danger);
  font-weight: 700;
}
.ac-mini-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.ac-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 10px 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.ac-mini:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.ac-mini-body {
  flex: 1;
  min-width: 0;
}
.ac-mini-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--t-main);
  line-height: 1.2;
}
.ac-mini-label {
  font-size: 12px;
  color: var(--t-weak);
  white-space: nowrap;
}
.ac-mini-arrow {
  color: var(--t-weak);
}
.ac-refresh {
  position: absolute;
  top: 12px;
  right: 12px;
}
.ac-toolbar {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.ac-expand {
  padding: 12px 24px;
  background: var(--bg-page);
}
.ac-confirm {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.ac-confirm p {
  font-size: 14px;
  color: var(--t-main);
  line-height: 1.9;
}
.ac-approve-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.ac-note {
  margin-left: 10px;
  font-size: 12px;
  color: var(--t-weak);
}
.ac-sign {
  display: inline-block;
  min-width: 64px;
  padding: 2px 10px;
  border: 1px dashed var(--bd);
  border-radius: var(--r-sm);
  font-size: 12px;
  color: var(--t-weak);
  text-align: center;
}
</style>
