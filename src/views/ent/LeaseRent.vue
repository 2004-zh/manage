<template>
  <div class="page-container">
    <div class="page-header">
      <h2>招商发布</h2>
      <el-button type="primary" @click="showCreate = true">
        <el-icon><Plus /></el-icon>
        发起招租
      </el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="招商发布" name="release">
        <div class="stat-strip">
          <div class="stat-item">
            <div class="stat-value">{{ releaseStats.projects }}<span class="unit">个</span></div>
            <div class="stat-label">招租项目总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ releaseStats.total }}<span class="unit">宗</span></div>
            <div class="stat-label">招租总宗数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ releaseStats.ongoingCount }}<span class="unit">宗</span></div>
            <div class="stat-label">进行中·数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ releaseStats.ongoingArea }}<span class="unit">㎡</span></div>
            <div class="stat-label">进行中·面积</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ releaseStats.completeRate }}<span class="unit">%</span></div>
            <div class="stat-label">招租完成率</div>
          </div>
        </div>

        <div class="release-toolbar">
          <el-button type="primary" @click="openReleaseForm()">
            <el-icon><Plus /></el-icon>
            保存招租表单
          </el-button>
          <span class="toolbar-hint">共 {{ filteredReleases.length }} 条招租发布</span>
          <div class="icon-toolbar">
            <el-tooltip content="刷新" placement="top">
              <el-button :icon="Refresh" circle @click="handleReleaseRefresh" />
            </el-tooltip>
            <el-tooltip content="筛选" placement="top">
              <el-button :icon="Filter" circle :type="releaseShowFilter ? 'primary' : ''" @click="releaseShowFilter = !releaseShowFilter" />
            </el-tooltip>
          </div>
        </div>

        <el-form v-show="releaseShowFilter" :inline="true" class="release-filter">
          <el-form-item>
            <el-input v-model="releaseFilters.keyword" placeholder="资产名称/编号/座落" clearable :prefix-icon="Search" style="width: 220px" @input="releasePage = 1" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="releaseFilters.company" placeholder="经营公司" clearable style="width: 150px" @change="releasePage = 1">
              <el-option v-for="c in releaseCompanies" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="releaseFilters.status" placeholder="发布状态" clearable style="width: 130px" @change="releasePage = 1">
              <el-option label="已发布" :value="true" />
              <el-option label="已下线" :value="false" />
            </el-select>
          </el-form-item>
        </el-form>

        <el-table :data="pagedReleases" border stripe>
          <el-table-column label="资产信息" align="center">
            <el-table-column prop="assetName" label="资产名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="assetType" label="资产类型" width="110" />
            <el-table-column prop="assetLocation" label="资产座落" min-width="180" show-overflow-tooltip />
            <el-table-column prop="region" label="省市区" width="160" show-overflow-tooltip />
          </el-table-column>
          <el-table-column label="租金(¥)" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row.rentType === '面议'" class="negotiable">面议</span>
              <span v-else class="rent-price">¥{{ row.rent.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="company" label="经营公司" width="120" />
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column prop="period" label="招租期限" width="210" />
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" inline-prompt active-text="发布" inactive-text="下线" />
            </template>
          </el-table-column>
          <el-table-column label="推荐状态" width="95" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.recommend" inline-prompt active-text="推荐" inactive-text="普通" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openReleaseForm(row)">修改</el-button>
              <el-button type="danger" link size="small" @click="deleteRelease(row)">删除</el-button>
              <el-button type="primary" link size="small" @click="viewRelease(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="releasePage"
            v-model:page-size="releasePageSize"
            :page-sizes="[10, 20, 50]"
            :total="filteredReleases.length"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-tab-pane>

      <!-- 招租公告 -->
      <el-tab-pane label="招租公告" name="publish">
        <el-alert title="发布招租公告后，系统将自动推送至公开平台，接受在线报名" type="info" :closable="false" show-icon style="margin-bottom: 16px" />
        <el-table :data="publishList" border stripe>
          <el-table-column prop="noticeNo" label="公告编号" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="area" label="招租面积(㎡)" width="150" align="right">
            <template #default="{ row }">
              <span>{{ row.area.toLocaleString() }}</span>
              <el-tooltip v-if="row.partial" :content="`资产总面积 ${row.totalArea ? row.totalArea.toLocaleString() : '-'} ㎡，本次仅招租部分面积`" placement="top">
                <el-tag type="warning" size="small" style="margin-left:6px">部分招租</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="startPrice" label="起拍价(元/月)" width="130" align="right">
            <template #default="{ row }">{{ row.startPrice.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="publishDate" label="发布日期" width="120" />
          <el-table-column prop="deadline" label="报名截止" width="120" />
          <el-table-column prop="registrantCount" label="报名人数" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" size="small">{{ row.registrantCount }}家</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '报名中' ? '' : row.status === '已截止' ? 'info' : 'success'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewRegistrants(row)">报名名单</el-button>
              <el-button v-if="row.status === '报名中'" type="warning" link size="small" @click="handleOpenBid(row)">开标竞价</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 报名管理 -->
      <el-tab-pane label="报名管理" name="register">
        <el-form :inline="true" class="search-form">
          <el-form-item label="资产名称">
            <el-input v-model="registerSearch.assetName" placeholder="请输入" clearable />
          </el-form-item>
          <el-form-item label="报名人">
            <el-input v-model="registerSearch.registrant" placeholder="请输入" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="registerPage = 1">查询</el-button>
            <el-button @click="registerSearch = { assetName: '', registrant: '' }">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="filteredRegistrants" border stripe>
          <el-table-column prop="regNo" label="报名编号" width="130" />
          <el-table-column prop="noticeNo" label="公告编号" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="160" />
          <el-table-column prop="registrant" label="报名人/企业" min-width="150" />
          <el-table-column prop="contactPhone" label="联系电话" width="130" />
          <el-table-column prop="registerDate" label="报名时间" width="120" />
          <el-table-column prop="qualification" label="资质审核" width="100">
            <template #default="{ row }">
              <el-tag :type="row.qualification === '已通过' ? 'success' : row.qualification === '待审核' ? 'warning' : 'danger'" size="small">{{ row.qualification }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.qualification === '待审核'" type="primary" link size="small" @click="handleAudit(row)">审核</el-button>
              <el-button type="primary" link size="small" @click="viewRegistrantDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 竞价/摇号 -->
      <el-tab-pane label="竞价/摇号" name="bid">
        <el-table :data="bidList" border stripe>
          <el-table-column prop="bidNo" label="竞价编号" width="140" />
          <el-table-column prop="noticeNo" label="关联公告" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="startPrice" label="起拍价(元/月)" width="130" align="right">
            <template #default="{ row }">{{ row.startPrice.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="currentPrice" label="当前最高价" width="130" align="right">
            <template #default="{ row }">
              <span style="color: #f5222d; font-weight: bold">{{ row.currentPrice ? row.currentPrice.toLocaleString() : '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="bidCount" label="出价次数" width="100" align="center" />
          <el-table-column prop="bidderCount" label="参与人数" width="100" align="center" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '进行中' ? '' : row.status === '已结束' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewBidDetail(row)">竞价记录</el-button>
              <el-button v-if="row.status === '进行中'" type="success" link size="small" @click="handleCloseBid(row)">结束竞价</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 结果公示 -->
      <el-tab-pane label="结果公示" name="result">
        <el-table :data="resultList" border stripe>
          <el-table-column prop="resultNo" label="公示编号" width="140" />
          <el-table-column prop="noticeNo" label="关联公告" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="winner" label="竞得人" min-width="150" />
          <el-table-column prop="dealPrice" label="成交价(元/月)" width="130" align="right">
            <template #default="{ row }">
              <span style="color: #52c41a; font-weight: bold">{{ row.dealPrice.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="premiumRate" label="溢价率" width="100" align="right">
            <template #default="{ row }">
              <span style="color: #fa8c16">+{{ row.premiumRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="publishDate" label="公示日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '已签约' ? '' : row.status === '已公示' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-if="!row.contractId" type="primary" link size="small" @click="handleSignContract(row)">签约</el-button>
              <el-button v-else type="success" link size="small" @click="router.push('/ent/contract-approval')">查看合同</el-button>
              <el-button type="primary" link size="small" @click="viewResultDetail(row)">公示详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 全部记录 -->
      <el-tab-pane label="全部记录" name="all">
        <el-form :inline="true" class="search-form">
          <el-form-item label="状态">
            <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px">
              <el-option label="招租中" value="招租中" />
              <el-option label="已成交" value="已成交" />
              <el-option label="已流拍" value="已流拍" />
              <el-option label="待审批" value="待审批" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-table :data="filteredRecords" border stripe>
          <el-table-column prop="rentNo" label="招租编号" width="140" />
          <el-table-column prop="assetName" label="资产名称" min-width="180" />
          <el-table-column prop="area" label="面积(㎡)" width="100" align="right" />
          <el-table-column prop="startPrice" label="起拍价(元/月)" width="130" align="right">
            <template #default="{ row }">{{ row.startPrice.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="method" label="招租方式" width="100" />
          <el-table-column prop="startDate" label="开始日期" width="120" />
          <el-table-column prop="endDate" label="截止日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === '已成交' ? 'success' : row.status === '已流拍' ? 'danger' : row.status === '待审批' ? 'warning' : ''" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 发起招租对话框 -->
    <el-dialog v-model="showCreate" title="发起招租" width="650px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="招租资产" required>
          <el-select v-model="createForm.assetId" placeholder="选择闲置或部分出租资产" style="width:100%" filterable @change="handleRentAssetPick">
            <el-option
              v-for="a in idleAssetOptions"
              :key="a.id"
              :label="`${a.name}（可租 ${a.area.toLocaleString()} / ${a.totalArea.toLocaleString()} ㎡${a.status === '部分出租' ? '，部分出租' : ''}）`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="招租面积(㎡)" required>
          <el-input-number v-model="createForm.leaseArea" :min="0" :max="pickedRentArea" :precision="2" :step="100" style="width:100%" :disabled="!createForm.assetId" />
          <div class="area-hint" v-if="createForm.assetId">
            本次招租 {{ (createForm.leaseArea || 0).toLocaleString() }} ㎡，成交后该资产剩余可租 {{ (pickedRentArea - (createForm.leaseArea || 0)).toLocaleString() }} ㎡
          </div>
          <div class="area-hint" v-else>先选择资产，系统按剩余可租面积限定招租面积</div>
        </el-form-item>
        <el-form-item label="招租方式" required>
          <el-select v-model="createForm.method" style="width:100%">
            <el-option label="公开竞价" value="公开竞价" />
            <el-option label="协议出租" value="协议出租" />
            <el-option label="挂牌出租" value="挂牌出租" />
          </el-select>
        </el-form-item>
        <el-form-item label="起拍价(元/月)" required>
          <el-input-number v-model="createForm.startPrice" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="招租期限" required>
          <el-date-picker v-model="createForm.dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="截止日期" style="width:100%" />
        </el-form-item>
        <el-form-item label="公告内容">
          <el-input v-model="createForm.noticeContent" type="textarea" :rows="4" placeholder="招租公告内容，将对外公示" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 报名名单对话框 -->
    <el-dialog v-model="showRegistrants" title="报名名单" width="700px">
      <el-table :data="currentRegistrants" border size="small">
        <el-table-column prop="regNo" label="报名编号" width="120" />
        <el-table-column prop="registrant" label="报名人/企业" min-width="150" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="registerDate" label="报名时间" width="110" />
        <el-table-column prop="qualification" label="资质" width="90">
          <template #default="{ row }">
            <el-tag :type="row.qualification === '已通过' ? 'success' : 'warning'" size="small">{{ row.qualification }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 竞价记录对话框 -->
    <el-dialog v-model="showBidRecords" title="竞价记录" width="600px">
      <el-table :data="bidRecords" border size="small">
        <el-table-column prop="time" label="出价时间" width="160" />
        <el-table-column prop="bidder" label="竞买人" min-width="150" />
        <el-table-column prop="price" label="出价(元/月)" width="130" align="right">
          <template #default="{ row }">{{ row.price.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="rank" label="排名" width="70" align="center" />
      </el-table>
    </el-dialog>

    <!-- 招租详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="招租详情" size="500px">
      <template v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="招租编号">{{ currentRecord.rentNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentRecord.assetName }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ currentRecord.area }} ㎡</el-descriptions-item>
          <el-descriptions-item label="起拍价">{{ currentRecord.startPrice.toLocaleString() }} 元/月</el-descriptions-item>
          <el-descriptions-item label="招租方式">{{ currentRecord.method }}</el-descriptions-item>
          <el-descriptions-item label="起止日期">{{ currentRecord.startDate }} 至 {{ currentRecord.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.status === '已成交' ? 'success' : currentRecord.status === '已流拍' ? 'danger' : ''" size="small">{{ currentRecord.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="竞买人">{{ currentRecord.bidders || '-' }}</el-descriptions-item>
          <el-descriptions-item label="成交价">{{ currentRecord.dealPrice ? currentRecord.dealPrice.toLocaleString() + ' 元/月' : '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 报名详情对话框 -->
    <el-dialog v-model="registrantDetailVisible" title="报名详情" width="550px">
      <el-descriptions :column="2" border v-if="currentRegistrant">
        <el-descriptions-item label="报名编号">{{ currentRegistrant.regNo }}</el-descriptions-item>
        <el-descriptions-item label="报名人">{{ currentRegistrant.name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentRegistrant.phone }}</el-descriptions-item>
        <el-descriptions-item label="报名时间">{{ currentRegistrant.regTime }}</el-descriptions-item>
        <el-descriptions-item label="资质审核">
          <el-tag :type="currentRegistrant.qualification === '已通过' ? 'success' : currentRegistrant.qualification === '未通过' ? 'danger' : 'warning'" size="small">{{ currentRegistrant.qualification }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="保证金">{{ currentRegistrant.deposit ? currentRegistrant.deposit + ' 万元' : '未缴纳' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="registrantDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 公示详情对话框 -->
    <el-dialog v-model="resultDetailVisible" title="公示详情" width="550px">
      <el-descriptions :column="2" border v-if="currentResult">
        <el-descriptions-item label="公示编号">{{ currentResult.resultNo }}</el-descriptions-item>
        <el-descriptions-item label="招租编号">{{ currentResult.noticeNo }}</el-descriptions-item>
        <el-descriptions-item label="资产名称" :span="2">{{ currentResult.assetName }}</el-descriptions-item>
        <el-descriptions-item label="竞得人">{{ currentResult.winner }}</el-descriptions-item>
        <el-descriptions-item label="成交价">{{ currentResult.dealPrice?.toLocaleString() }} 元/月</el-descriptions-item>
        <el-descriptions-item label="溢价率">{{ currentResult.premiumRate }}%</el-descriptions-item>
        <el-descriptions-item label="公示日期">{{ currentResult.publishDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentResult.status === '已公示' ? 'success' : 'info'" size="small">{{ currentResult.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="resultDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="releaseFormVisible" :title="releaseEditIndex >= 0 ? '修改招租表单' : '保存招租表单'" width="860px" destroy-on-close top="6vh">
      <div class="section-title">资产基础信息</div>
      <el-form label-width="100px" @submit.prevent>
        <el-form-item label="招租资产" required>
          <el-select v-model="releaseForm.assetId" placeholder="请选择招租资产" filterable style="width: 360px" :disabled="releaseEditIndex >= 0" @change="handleReleaseAssetPick">
            <el-option v-for="a in releaseAssetOptions" :key="a.id" :label="`${a.id} - ${a.name}`" :value="a.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="detail-grid" v-if="dialogAsset">
        <div class="cell"><div class="label">资产编号</div><div class="value">{{ dialogAsset.id }}</div></div>
        <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ dialogAsset.name }}</div></div>
        <div class="cell"><div class="label">资产类型</div><div class="value">{{ dialogAsset.type }}</div></div>
        <div class="cell"><div class="label">资产面积</div><div class="value">{{ dialogAsset.area.toLocaleString() }} ㎡</div></div>
        <div class="cell"><div class="label">资产座落</div><div class="value">{{ dialogAsset.location }}</div></div>
        <div class="cell"><div class="label">省市区</div><div class="value">{{ dialogAsset.region }}</div></div>
        <div class="cell"><div class="label">资产权属</div><div class="value">{{ dialogAsset.propertyRight }}</div></div>
        <div class="cell"><div class="label">所属集团</div><div class="value">{{ dialogAsset.group }}</div></div>
        <div class="cell"><div class="label">资产状态</div><div class="value">{{ dialogAsset.status }}</div></div>
      </div>
      <div v-else class="asset-empty">请先选择招租资产，系统将展示资产基础信息</div>
      <div class="section-title">招租发布信息</div>
      <el-form :model="releaseForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属公司" required>
              <el-select v-model="releaseForm.company" placeholder="请选择所属公司" style="width:100%">
                <el-option v-for="c in releaseCompanies" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租期类型">
              <el-select v-model="releaseForm.leaseType" placeholder="请选择租期类型" style="width:100%">
                <el-option label="短期（1年以内）" value="短期（1年以内）" />
                <el-option label="中期（1-3年）" value="中期（1-3年）" />
                <el-option label="长期（3年以上）" value="长期（3年以上）" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="招租方式" required>
              <el-select v-model="releaseForm.method" placeholder="请选择招租方式" style="width:100%">
                <el-option label="公开竞价" value="公开竞价" />
                <el-option label="协议出租" value="协议出租" />
                <el-option label="挂牌出租" value="挂牌出租" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="招租期限" required>
              <el-date-picker v-model="releaseForm.periodRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="截止日期" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="列表图" required>
              <el-upload v-model:file-list="releaseForm.listImg" list-type="picture-card" :auto-upload="false" :limit="1" accept="image/*">
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">推荐尺寸 750×420px，JPG/PNG，不超过 2MB</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="轮播图" required>
              <el-upload v-model:file-list="releaseForm.carouselImg" list-type="picture-card" :auto-upload="false" :limit="5" accept="image/*">
                <el-icon><Plus /></el-icon>
              </el-upload>
              <div class="upload-tip">推荐尺寸 1920×1080px，最多上传 5 张</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="租金类型">
              <el-select v-model="releaseForm.rentType" style="width:100%">
                <el-option label="价格" value="价格" />
                <el-option label="面议" value="面议" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="租金">
              <el-input-number v-model="releaseForm.rent" :min="0" :step="500" :precision="0" :disabled="releaseForm.rentType === '面议'" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="推荐">
              <el-switch v-model="releaseForm.recommend" inline-prompt active-text="推荐" inactive-text="普通" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="releaseForm.remark" placeholder="请输入备注" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="介绍" required>
          <el-input v-model="releaseForm.intro" type="textarea" :rows="4" maxlength="1000" show-word-limit placeholder="请输入招租介绍" />
        </el-form-item>
        <el-form-item label="用途要求" required>
          <el-input v-model="releaseForm.usageReq" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="请输入用途要求" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="releaseFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRelease">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="releaseDetailVisible" title="招租发布详情" width="820px">
      <template v-if="currentRelease">
        <div class="section-title">资产基础信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">资产编号</div><div class="value">{{ currentRelease.assetNo }}</div></div>
          <div class="cell"><div class="label">资产名称</div><div class="value hl">{{ currentRelease.assetName }}</div></div>
          <div class="cell"><div class="label">资产类型</div><div class="value">{{ currentRelease.assetType }}</div></div>
          <div class="cell"><div class="label">资产面积</div><div class="value">{{ currentRelease.area.toLocaleString() }} ㎡</div></div>
          <div class="cell"><div class="label">资产座落</div><div class="value">{{ currentRelease.assetLocation }}</div></div>
          <div class="cell"><div class="label">省市区</div><div class="value">{{ currentRelease.region }}</div></div>
        </div>
        <div class="section-title">招租发布信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ currentRelease.company }}</div></div>
          <div class="cell"><div class="label">租期类型</div><div class="value">{{ currentRelease.leaseType }}</div></div>
          <div class="cell"><div class="label">招租方式</div><div class="value">{{ currentRelease.method }}</div></div>
          <div class="cell"><div class="label">招租期限</div><div class="value">{{ currentRelease.period }}</div></div>
          <div class="cell"><div class="label">租金类型</div><div class="value">{{ currentRelease.rentType }}</div></div>
          <div class="cell"><div class="label">租金</div><div class="value hl">{{ currentRelease.rentType === '面议' ? '面议' : '¥' + currentRelease.rent.toLocaleString() + '/月' }}</div></div>
          <div class="cell"><div class="label">状态</div><div class="value">{{ currentRelease.enabled ? '已发布' : '已下线' }}</div></div>
          <div class="cell"><div class="label">推荐状态</div><div class="value">{{ currentRelease.recommend ? '推荐' : '普通' }}</div></div>
          <div class="cell"><div class="label">创建时间</div><div class="value">{{ currentRelease.createTime }}</div></div>
          <div class="cell"><div class="label">备注</div><div class="value">{{ currentRelease.remark || '—' }}</div></div>
          <div class="cell"><div class="label">介绍</div><div class="value">{{ currentRelease.intro }}</div></div>
          <div class="cell"><div class="label">用途要求</div><div class="value">{{ currentRelease.usageReq }}</div></div>
        </div>
      </template>
      <template #footer>
        <el-button @click="releaseDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Filter, Search } from '@element-plus/icons-vue'
import { useAssetStore } from '../../store/asset'
import { useContractStore } from '../../store/contract'
import { useLeaseStore } from '../../store/lease'

const router = useRouter()
const assetStore = useAssetStore()
const contractStore = useContractStore()
const leaseStore = useLeaseStore()

const activeTab = ref('release')
const statusFilter = ref('')
const showCreate = ref(false)
const showDetailDrawer = ref(false)
const showRegistrants = ref(false)
const showBidRecords = ref(false)
const currentRecord = ref(null)
const currentRegistrants = ref([])
const bidRecords = ref([])

const createForm = ref({
  assetId: '', leaseArea: 0, method: '公开竞价', startPrice: 0, dateRange: null, noticeContent: '', remark: ''
})

const pickedRentOption = computed(() => idleAssetOptions.value.find(a => a.id === createForm.value.assetId) || null)
const pickedRentArea = computed(() => pickedRentOption.value ? pickedRentOption.value.area : 0)

function handleRentAssetPick() {
  createForm.value.leaseArea = pickedRentArea.value
}

const registerSearch = ref({ assetName: '', registrant: '' })

const idleAssetOptions = computed(() =>
  assetStore.assets
    .map(a => ({ id: a.id, name: a.name, status: a.status, totalArea: a.area, area: contractStore.getLeaseSummary(a).availableArea }))
    .filter(a => a.area > 0 && a.status !== '自用')
)

// 六张列表全部由 lease store 持有（可持久化、跨页面共享），页面只做筛选与展示
const {
  notices: publishList,
  registrants: registrantList,
  bids: bidList,
  results: resultList,
  rentRecords: records,
  releases: releaseRecords
} = storeToRefs(leaseStore)

const filteredRegistrants = computed(() => {
  return registrantList.value.filter(r => {
    const assetMatch = !registerSearch.value.assetName || r.assetName.includes(registerSearch.value.assetName)
    const regMatch = !registerSearch.value.registrant || r.registrant.includes(registerSearch.value.registrant)
    return assetMatch && regMatch
  })
})

const filteredRecords = computed(() => {
  if (!statusFilter.value) return records.value
  return records.value.filter(r => r.status === statusFilter.value)
})

const registerPage = ref(1)

// 操作函数
function handleCreate() {
  if (!createForm.value.assetId) {
    ElMessage.warning('请选择招租资产')
    return
  }
  const leaseArea = createForm.value.leaseArea
  if (!leaseArea || leaseArea <= 0) {
    ElMessage.warning('请填写招租面积')
    return
  }
  if (leaseArea > pickedRentArea.value) {
    ElMessage.error(`招租面积 ${leaseArea} ㎡ 超出剩余可租面积 ${pickedRentArea.value} ㎡`)
    return
  }
  if (!createForm.value.startPrice || createForm.value.startPrice <= 0) {
    ElMessage.warning('请填写起拍价')
    return
  }
  const range = createForm.value.dateRange
  if (!range || !range[0] || !range[1]) {
    ElMessage.warning('请选择招租期限，公告需明确报名截止日期')
    return
  }
  const asset = pickedRentOption.value
  const { notice, release } = leaseStore.publishRent({
    assetId: asset.id,
    leaseArea,
    method: createForm.value.method,
    startPrice: createForm.value.startPrice,
    startDate: range[0],
    deadline: range[1],
    noticeContent: createForm.value.noticeContent,
    remark: createForm.value.remark
  }) || {}
  if (!notice) {
    ElMessage.error('未在台账中找到该资产，招租未发布')
    return
  }
  showCreate.value = false
  const left = Math.round((asset.area - leaseArea) * 100) / 100
  ElMessage.success(
    left > 0
      ? `${notice.noticeNo} 已发布，同时生成招商发布记录「${release.assetName}」，该资产仍有 ${left.toLocaleString()} ㎡ 可继续招租`
      : `${notice.noticeNo} 已发布，同时生成招商发布记录，系统已推送至公开平台`
  )
  Object.assign(createForm.value, { assetId: '', leaseArea: 0, method: '公开竞价', startPrice: 0, dateRange: null, noticeContent: '', remark: '' })
}

function viewDetail(row) {
  currentRecord.value = row
  showDetailDrawer.value = true
}

function viewRegistrants(row) {
  currentRegistrants.value = registrantList.value.filter(r => r.noticeNo === row.noticeNo)
  showRegistrants.value = true
}

function handleOpenBid(row) {
  ElMessageBox.confirm(`确定要对"${row.assetName}"进行开标竞价吗？`, '开标确认', {
    confirmButtonText: '确定开标',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const newBid = {
      bidNo: `JJ-2026-${String(bidList.value.length + 1).padStart(3, '0')}`,
      noticeNo: row.noticeNo,
      assetName: row.assetName,
      startPrice: row.startPrice,
      currentPrice: null,
      bidCount: 0,
      bidderCount: row.registrantCount,
      status: '进行中'
    }
    bidList.value.unshift(newBid)
    row.status = '已截止'
    ElMessage.success('竞价已开启，已通知所有报名人')
  }).catch(() => {})
}

function handleAudit(row) {
  ElMessageBox.confirm(`确定要审核通过"${row.registrant}"的报名资质吗？`, '资质审核', {
    confirmButtonText: '通过',
    cancelButtonText: '驳回',
    type: 'info'
  }).then(() => {
    row.qualification = '已通过'
    ElMessage.success('资质审核通过')
  }).catch(() => {
    row.qualification = '未通过'
    ElMessage.warning('已驳回')
  })
}

const registrantDetailVisible = ref(false)
const currentRegistrant = ref(null)

function viewRegistrantDetail(row) {
  currentRegistrant.value = row
  registrantDetailVisible.value = true
}

function viewBidDetail(row) {
  bidRecords.value = [
    { time: '2026-09-15 10:32:15', bidder: '福建恒通纺织有限公司', price: row.currentPrice || row.startPrice, rank: 1 },
    { time: '2026-09-15 10:28:42', bidder: '长乐鑫达机械加工厂', price: (row.currentPrice || row.startPrice) - 1000, rank: 2 },
    { time: '2026-09-15 10:25:08', bidder: '福州瑞丰物流有限公司', price: (row.currentPrice || row.startPrice) - 2000, rank: 3 },
  ]
  showBidRecords.value = true
}

function handleCloseBid(row) {
  ElMessageBox.confirm(`确定要结束"${row.assetName}"的竞价吗？结束后将自动公示结果。`, '结束竞价', {
    confirmButtonText: '确定结束',
    cancelButtonText: '继续竞价',
    type: 'warning'
  }).then(() => {
    row.status = '已结束'
    const winner = bidRecords.value[0]
    const publish = publishList.value.find(p => p.noticeNo === row.noticeNo)
    const newResult = {
      resultNo: `GS-2026-${String(resultList.value.length + 1).padStart(3, '0')}`,
      noticeNo: row.noticeNo,
      assetId: publish?.assetId || row.assetId || '',
      assetName: row.assetName,
      area: publish?.area || row.area || 0,
      winner: winner ? winner.bidder : '-',
      dealPrice: row.currentPrice || row.startPrice,
      premiumRate: row.currentPrice ? Math.round((row.currentPrice - row.startPrice) / row.startPrice * 1000) / 10 : 0,
      publishDate: new Date().toISOString().slice(0, 10),
      status: '已公示',
      contractId: ''
    }
    resultList.value.unshift(newResult)
    ElMessage.success('竞价已结束，结果已公示')
  }).catch(() => {})
}

function nextContractId() {
  const prefix = `HT-${new Date().getFullYear()}-`
  const max = contractStore.contracts.reduce((m, c) => {
    if (!String(c.id).startsWith(prefix)) return m
    const n = Number(String(c.id).slice(prefix.length))
    return Number.isFinite(n) && n > m ? n : m
  }, 0)
  return `${prefix}${String(max + 1).padStart(3, '0')}`
}

function handleSignContract(row) {
  if (row.contractId) {
    ElMessage.info(`该结果已生成合同 ${row.contractId}，请前往合同管理查看`)
    router.push('/ent/contract-approval')
    return
  }
  const asset = assetStore.assets.find(a => a.id === row.assetId) || assetStore.assets.find(a => a.name === row.assetName)
  if (!asset) {
    ElMessage.warning('未匹配到招租资产，无法生成合同')
    return
  }
  const area = row.area || contractStore.getLeaseSummary(asset).availableArea
  const annualRent = Math.round(row.dealPrice * 12 / 10000 * 100) / 100
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  const endDate = new Date(startDate)
  endDate.setFullYear(endDate.getFullYear() + 3)
  const fmt = d => d.toISOString().slice(0, 10)

  ElMessageBox.confirm(
    `确认为"${row.winner}"生成租赁合同？\n` +
    `资产：${asset.name}，面积：${area.toLocaleString()} ㎡\n` +
    `月租金：${row.dealPrice.toLocaleString()} 元，年租金：${annualRent} 万元\n` +
    `租期：${fmt(startDate)} ~ ${fmt(endDate)}`,
    '生成合同草稿',
    { confirmButtonText: '确认生成', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    const newId = nextContractId()
    contractStore.contracts.push({
      id: newId,
      assetId: asset.id,
      assetName: asset.name,
      tenant: row.winner,
      startDate: fmt(startDate),
      endDate: fmt(endDate),
      leaseArea: area,
      annualRent,
      deposit: Math.round(annualRent * 2 * 100) / 100,
      increment: '每年递增3%',
      status: '正常',
      electronic: false,
      arrears: 0,
      overdueDays: 0,
      source: `招租${row.resultNo}`
    })
    const summary = contractStore.getLeaseSummary(asset)
    // 直接改 assets 里的对象是无效的（那是 computed 每次新建的临时对象），必须走统一写入口回写
    assetStore.updateAsset(asset.id,
      { status: summary.availableArea > 0 ? '部分出租' : '已出租' },
      { module: '招商租赁', action: '招租成交联动', billNo: newId, remark: `招租结果 ${row.resultNo} 签约后回写出租状态` })
    row.status = '已签约'
    row.contractId = newId
    ElMessage.success(`合同 ${newId} 已生成，请前往合同管理完成电子签章`)
    router.push('/ent/contract-approval')
  }).catch(() => {})
}

const resultDetailVisible = ref(false)
const currentResult = ref(null)

function viewResultDetail(row) {
  currentResult.value = row
  resultDetailVisible.value = true
}

const releaseCompanies = ['城投集团', '产投集团', '水投集团', '领航公司']

const releaseFilters = ref({ keyword: '', company: '', status: '' })
const releaseShowFilter = ref(true)
const releasePage = ref(1)
const releasePageSize = ref(10)

const filteredReleases = computed(() => {
  return releaseRecords.value.filter(r => {
    const kw = releaseFilters.value.keyword
    if (kw && !r.assetName.includes(kw) && !r.assetNo.includes(kw) && !r.assetLocation.includes(kw)) return false
    if (releaseFilters.value.company && r.company !== releaseFilters.value.company) return false
    if (typeof releaseFilters.value.status === 'boolean' && r.enabled !== releaseFilters.value.status) return false
    return true
  })
})

const pagedReleases = computed(() => {
  const start = (releasePage.value - 1) * releasePageSize.value
  return filteredReleases.value.slice(start, start + releasePageSize.value)
})

const releaseStats = computed(() => {
  const list = releaseRecords.value
  const ongoing = list.filter(r => r.enabled)
  const dealt = list.filter(r => r.dealt).length
  return {
    projects: new Set(list.map(r => r.assetId)).size,
    total: list.length,
    ongoingCount: ongoing.length,
    ongoingArea: ongoing.reduce((s, r) => s + r.area, 0).toLocaleString(),
    completeRate: list.length ? Math.round((dealt / list.length) * 1000) / 10 : 0
  }
})

const releaseAssetOptions = computed(() => assetStore.assets.filter(a => a.status !== '已出租'))

const releaseFormVisible = ref(false)
const releaseEditIndex = ref(-1)

function defaultReleaseForm() {
  return {
    assetId: '', company: '', leaseType: '中期（1-3年）', method: '公开竞价', periodRange: null,
    listImg: [], carouselImg: [], rentType: '价格', rent: 0, recommend: false, remark: '', intro: '', usageReq: ''
  }
}
const releaseForm = ref(defaultReleaseForm())

const selectedReleaseAsset = computed(() => assetStore.assets.find(a => a.id === releaseForm.value.assetId) || null)

const dialogAsset = computed(() => {
  if (releaseEditIndex.value >= 0) {
    const r = releaseRecords.value[releaseEditIndex.value]
    if (r) {
      return {
        id: r.assetNo,
        name: r.assetName,
        type: r.assetType,
        area: r.area,
        location: r.assetLocation,
        region: r.region,
        propertyRight: r.propertyRight || '两证齐全',
        group: r.company,
        status: r.enabled ? '招租中' : '已下线'
      }
    }
  }
  const a = selectedReleaseAsset.value
  if (!a) return null
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    area: a.area,
    location: a.location,
    region: '福建省/福州市/长乐区',
    propertyRight: a.propertyRight,
    group: a.group,
    status: a.status
  }
})

function handleReleaseAssetPick() {
  const a = selectedReleaseAsset.value
  if (a && !releaseForm.value.company) releaseForm.value.company = a.group
}

function openReleaseForm(row) {
  if (row) {
    releaseEditIndex.value = releaseRecords.value.findIndex(r => r.id === row.id)
    releaseForm.value = {
      assetId: row.assetId,
      company: row.company,
      leaseType: row.leaseType,
      method: row.method,
      periodRange: row.period.split(' ~ '),
      listImg: row.listImg.map(f => ({ ...f })),
      carouselImg: row.carouselImg.map(f => ({ ...f })),
      rentType: row.rentType,
      rent: row.rent,
      recommend: row.recommend,
      remark: row.remark,
      intro: row.intro,
      usageReq: row.usageReq
    }
  } else {
    releaseEditIndex.value = -1
    releaseForm.value = defaultReleaseForm()
  }
  releaseFormVisible.value = true
}

function formatNow() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function saveRelease() {
  const f = releaseForm.value
  const asset = selectedReleaseAsset.value
  if (!asset) { ElMessage.warning('请选择招租资产'); return }
  if (!f.company) { ElMessage.warning('请选择所属公司'); return }
  if (!f.method) { ElMessage.warning('请选择招租方式'); return }
  if (!f.periodRange || !f.periodRange[0] || !f.periodRange[1]) { ElMessage.warning('请选择招租期限'); return }
  if (!f.listImg.length) { ElMessage.warning('请上传列表图'); return }
  if (!f.carouselImg.length) { ElMessage.warning('请上传轮播图'); return }
  if (f.rentType === '价格' && (!f.rent || f.rent <= 0)) { ElMessage.warning('请填写租金'); return }
  if (!f.intro) { ElMessage.warning('请填写介绍'); return }
  if (!f.usageReq) { ElMessage.warning('请填写用途要求'); return }
  const period = `${f.periodRange[0]} ~ ${f.periodRange[1]}`
  if (releaseEditIndex.value >= 0) {
    Object.assign(releaseRecords.value[releaseEditIndex.value], {
      company: f.company,
      leaseType: f.leaseType,
      method: f.method,
      period,
      rentType: f.rentType,
      rent: f.rentType === '面议' ? 0 : f.rent,
      recommend: f.recommend,
      remark: f.remark,
      intro: f.intro,
      usageReq: f.usageReq,
      listImg: f.listImg.map(x => ({ ...x })),
      carouselImg: f.carouselImg.map(x => ({ ...x }))
    })
    ElMessage.success('招租表单已更新')
  } else {
    releaseRecords.value.unshift({
      id: Date.now(),
      assetId: asset.id,
      assetNo: asset.id,
      assetName: asset.name,
      assetType: asset.type,
      assetLocation: asset.location,
      region: '福建省/福州市/长乐区',
      area: asset.area,
      company: f.company,
      leaseType: f.leaseType,
      method: f.method,
      rentType: f.rentType,
      rent: f.rentType === '面议' ? 0 : f.rent,
      remark: f.remark,
      period,
      createTime: formatNow(),
      enabled: true,
      recommend: f.recommend,
      dealt: false,
      intro: f.intro,
      usageReq: f.usageReq,
      listImg: f.listImg.map(x => ({ ...x })),
      carouselImg: f.carouselImg.map(x => ({ ...x }))
    })
    ElMessage.success('招租表单已保存并发布')
  }
  releaseFormVisible.value = false
}

function deleteRelease(row) {
  ElMessageBox.confirm(`确定删除"${row.assetName}"的招租发布吗？`, '删除确认', { type: 'warning' }).then(() => {
    if (leaseStore.removeRelease(row.id)) ElMessage.success('删除成功')
    else ElMessage.warning('记录已不存在，请刷新列表')
  }).catch(() => {})
}

const releaseDetailVisible = ref(false)
const currentRelease = ref(null)
function viewRelease(row) {
  currentRelease.value = row
  releaseDetailVisible.value = true
}

function handleReleaseRefresh() {
  releasePage.value = 1
  ElMessage.success('招租发布列表已刷新')
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.area-hint {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  line-height: 20px;
  color: #909399;
}

.page-header h2 {
  font-size: 16px;
  font-weight: 600;
}

.search-form {
  margin-bottom: 16px;
}

.release-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.toolbar-hint {
  font-size: 13px;
  color: #999;
}

.release-filter {
  background: #fafcff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 12px 12px 0;
  margin-bottom: 12px;
}

.rent-price {
  color: #f5222d;
  font-weight: 600;
}

.negotiable {
  color: #fa8c16;
}

.upload-tip {
  width: 100%;
  font-size: 12px;
  line-height: 20px;
  color: #909399;
}

.asset-empty {
  padding: 14px;
  margin-bottom: 12px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  color: #999;
  font-size: 13px;
  text-align: center;
}
</style>
