<template>
  <div class="page-container">
    <div class="page-header">
      <h2>无形资产管理</h2>
      <span class="page-subtitle">权证登记 · 价值评估 · 摊销管理 · 处置审批 · 权属维权</span>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#1890ff">{{ activeAssets.length }}</div>
          <div class="kpi-label">有效无形资产(项)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#52c41a">{{ totalValue }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">账面总价值</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#fa8c16">{{ expiringSoon }}</div>
          <div class="kpi-label">一年内到期(项)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#722ed1">{{ pendingDisposals.length }}</div>
          <div class="kpi-label">待审批处置(件)</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">
        <el-input v-model="iaFilter.keyword" placeholder="资产名称/资产编号/管理人" clearable style="width:220px" @keyup.enter="doIaSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="iaFilter.company" placeholder="公司" clearable filterable style="width:230px">
          <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="iaFilter.status" placeholder="状态" clearable style="width:120px">
          <el-option v-for="s in ['使用中', '闲置', '已停用', '处置中', '已注销']" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="iaFilter.acquireWay" placeholder="取得方式" clearable style="width:130px">
          <el-option v-for="w in acquireWays" :key="w" :label="w" :value="w" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="doIaSearch">查询</el-button>
        <div class="icon-toolbar">
          <el-button type="primary" :icon="Plus" @click="openSaveAsset">新增</el-button>
          <el-button :icon="Download" @click="downloadTemplate">下载模板</el-button>
        </div>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane v-for="cat in categories" :key="cat" :label="cat" :name="cat">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-weight:600;font-size:14px">{{ cat }}台账（{{ filteredAssets.length }} 项）</span>
            <div>
              <el-button size="small" @click="exportCategory">导出台账</el-button>
              <el-button type="primary" size="small" @click="openCreate">登记新增</el-button>
            </div>
          </div>
          <el-table :data="pagedAssets" border stripe>
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">摊销方式</div><div class="value">{{ row.amortizeMethod }}</div></div>
                    <div class="cell"><div class="label">登记日期</div><div class="value">{{ row.regDate }}</div></div>
                    <div class="cell"><div class="label">有效期至</div><div class="value">{{ row.validUntil }}</div></div>
                    <div class="cell"><div class="label">取得方式</div><div class="value">{{ row.acquireWay }}</div></div>
                    <div class="cell"><div class="label">累计摊销</div><div class="value">{{ row.amortizeLogs.reduce((s, l) => s + l.amount, 0).toFixed(1) }} 万元</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="certNo" label="证书编号" width="150" show-overflow-tooltip />
            <el-table-column prop="owner" label="权属人" width="170" show-overflow-tooltip />
            <el-table-column label="账面价值" width="110" align="right">
              <template #default="{ row }">{{ row.value }} 万</template>
            </el-table-column>
            <el-table-column label="有效期" width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ row.regDate }} 至 {{ row.validUntil }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
                <el-dropdown style="margin-left:8px;vertical-align:middle" @command="cmd => handleAssetCmd(cmd, row)">
                  <el-button type="info" link size="small" :icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="profile">资产详情</el-dropdown-item>
                      <el-dropdown-item command="rightsBiz">权属业务</el-dropdown-item>
                      <el-dropdown-item command="evaluate">评估</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '使用中'" command="amortize">摊销</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '使用中'" command="rightsAction">维权</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '使用中'" command="suspend">停用</el-dropdown-item>
                      <el-dropdown-item v-if="row.status === '已停用'" command="resume">启用</el-dropdown-item>
                      <el-dropdown-item v-if="row.status !== '已注销'" command="dispose">处置</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="iaPage" v-model:page-size="iaSize" :total="filteredAssets.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="iaPage = 1" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="权证管理" name="cert">
          <div class="cert-grid">
            <el-card v-for="a in certAssets" :key="a.certNo" shadow="hover" class="cert-card" @click="viewDetail(a)">
              <div class="cert-img">
                <div class="cert-emblem">★</div>
                <div class="cert-title">{{ a.category }}证书</div>
                <div class="cert-no">{{ a.certNo }}</div>
                <div class="cert-name">{{ a.name }}</div>
                <div class="cert-owner">权属人：{{ a.owner }}</div>
                <div class="cert-qr">
                  <div v-for="(cell, i) in qrFor(a.certNo)" :key="i" class="qr-cell" :class="{ dark: cell }"></div>
                </div>
              </div>
              <div class="cert-footer">
                <el-tag :type="statusType(a.status)" size="small">{{ a.status }}</el-tag>
                <span class="cert-valid">有效期至 {{ a.validUntil }}</span>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="处置审批" name="disposal">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span style="font-weight:600;font-size:14px">处置审批记录（{{ allDisposals.length }} 件）</span>
          </div>
          <el-table :data="allDisposals" border stripe size="small">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">资产类别</div><div class="value">{{ row.assetCategory }}</div></div>
                    <div class="cell"><div class="label">证书编号</div><div class="value">{{ row.certNo }}</div></div>
                    <div class="cell"><div class="label">申请人</div><div class="value">{{ row.applicant }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="type" label="处置方式" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="处置原因" width="160" show-overflow-tooltip />
            <el-table-column prop="amount" label="处置金额(万元)" width="110" align="right">
              <template #default="{ row }">{{ row.amount ? row.amount.toLocaleString() : '—' }}</template>
            </el-table-column>
            <el-table-column prop="applyDate" label="申请日期" width="100" />
            <el-table-column prop="status" label="审批状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="disposalStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDisposal(row)">详情</el-button>
                <el-button v-if="row.status === '审批中'" type="success" link size="small" @click="approveDisposal(row)">审批</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="续展/变更/许可" name="rightsBiz">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-input v-model="rbFilter.keyword" placeholder="资产名称/申请单号" clearable style="width:200px" @keyup.enter="doRbSearch" />
            <el-select v-model="rbFilter.company" placeholder="公司" clearable filterable style="width:230px">
              <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="rbFilter.type" placeholder="业务类型" clearable style="width:120px">
              <el-option v-for="t in ['续展', '变更', '许可']" :key="t" :label="t" :value="t" />
            </el-select>
            <el-select v-model="rbFilter.status" placeholder="状态" clearable style="width:120px">
              <el-option v-for="s in ['审批通过', '审批中']" :key="s" :label="s" :value="s" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="doRbSearch">查询</el-button>
          </div>
          <el-table :data="pagedRightsBiz" border stripe size="small">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                    <div class="cell"><div class="label">资产权属编号</div><div class="value">{{ row.rightsNo }}</div></div>
                    <div class="cell"><div class="label">创建时间</div><div class="value">{{ row.createTime }}</div></div>
                    <div class="cell"><div class="label">完成时间</div><div class="value">{{ row.finishTime || '—' }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="assetNo" label="资产编号" width="120" />
            <el-table-column prop="type" label="业务类型" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.type === '续展' ? 'success' : row.type === '许可' ? 'warning' : 'primary'">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="applyNo" label="申请单号" width="140" show-overflow-tooltip />
            <el-table-column label="办理时间" width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ row.createTime }} 至 {{ row.finishTime || '—' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === '审批通过' ? 'success' : 'warning'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewRightsBiz(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="rbPage" v-model:page-size="rbSize" :total="filteredRightsBiz.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="rbPage = 1" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产处置" name="dispose">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-select v-model="dpFilter.company" placeholder="公司" clearable filterable style="width:230px">
              <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-input v-model="dpFilter.keyword" placeholder="资产名称/资产编号" clearable style="width:200px" @keyup.enter="doDpSearch" />
            <el-select v-model="dpFilter.type" placeholder="处置类型" clearable style="width:130px">
              <el-option v-for="t in disposeTypes" :key="t" :label="t" :value="t" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="doDpSearch">查询</el-button>
            <el-button type="primary" plain :icon="Plus" @click="openDisposeForm()">新增</el-button>
          </div>
          <el-table :data="pagedDisposals" border stripe size="small">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">所属公司</div><div class="value">{{ row.company }}</div></div>
                    <div class="cell"><div class="label">资产编号</div><div class="value">{{ row.assetNo }}</div></div>
                    <div class="cell"><div class="label">处置原因</div><div class="value">{{ row.reason }}</div></div>
                    <div class="cell"><div class="label">申请人</div><div class="value">{{ row.applicant }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="no" label="处置单号" width="120" />
            <el-table-column prop="assetName" label="资产名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="type" label="处置类型" width="90" align="center">
              <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="amount" label="处置金额(万元)" width="110" align="right">
              <template #default="{ row }">{{ row.amount ? row.amount.toLocaleString() : '—' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag size="small" :type="disposalStatusType(row.status)">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column label="操作" width="130" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewDispose(row)">详情</el-button>
                <el-button type="warning" link size="small" @click="openDisposeForm(row)">修改</el-button>
                <el-dropdown style="margin-left:8px;vertical-align:middle" @command="cmd => onDpCommand(cmd, row)">
                  <el-button type="info" link size="small" :icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="approval">设置审批</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="dpPage" v-model:page-size="dpSize" :total="filteredDisposals.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="dpPage = 1" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产档案" name="archive">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-input v-model="arFilter.keyword" placeholder="档案名称/资产名称" clearable style="width:200px" @keyup.enter="doArSearch" />
            <el-select v-model="arFilter.company" placeholder="公司" clearable filterable style="width:230px">
              <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="arFilter.type" placeholder="档案类型" clearable style="width:150px">
              <el-option v-for="t in ['权属管理', '初始化数据', '权属初始数据']" :key="t" :label="t" :value="t" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="doArSearch">查询</el-button>
          </div>
          <el-table :data="pagedArchives" border stripe size="small">
            <el-table-column prop="name" label="档案名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="assetName" label="所属资产" min-width="160" show-overflow-tooltip />
            <el-table-column prop="company" label="所属公司" width="170" show-overflow-tooltip />
            <el-table-column prop="type" label="档案类型" width="110" align="center">
              <template #default="{ row }"><el-tag size="small" :type="archiveTypeTag(row.type)">{{ row.type }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="70" align="center" />
            <el-table-column label="预览" width="70" align="center">
              <template #default="{ row }"><div class="thumb" :title="row.attach"><el-icon><Picture /></el-icon></div></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="140" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" :icon="Download" @click="downloadMaterial(row)">下载材料</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="arPage" v-model:page-size="arSize" :total="filteredArchives.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="arPage = 1" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="类型管理" name="type">
          <el-table :data="pagedTypes" border stripe size="small">
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === '启用' ? 'success' : 'info'">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="140" />
            <el-table-column prop="updateTime" label="更新时间" width="140" />
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openTypeForm(row)">修改</el-button>
                <el-button :type="row.status === '启用' ? 'danger' : 'success'" link size="small" @click="toggleType(row)">{{ row.status === '启用' ? '禁用' : '启用' }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="tyPage" v-model:page-size="tySize" :total="typeList.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="tyPage = 1" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 权证详情抽屉 -->
    <el-drawer v-model="showDetail" title="权证详情" size="680px">
      <template v-if="current">
        <div class="cert-preview">
          <div class="cert-emblem big">★</div>
          <h3>{{ current.category }}证书</h3>
          <p>证书编号：{{ current.certNo }}</p>
          <p>注册号：{{ current.regNo }}</p>
          <div class="cert-qr big">
            <div v-for="(cell, i) in qrFor(current.certNo)" :key="i" class="qr-cell" :class="{ dark: cell }"></div>
          </div>
        </div>

        <div style="margin:12px 0;text-align:right">
          <el-button size="small" @click="downloadArchive('basic')">基础档案下载</el-button>
          <el-button size="small" @click="downloadArchive('material')">基础材料下载</el-button>
        </div>

        <el-descriptions :column="2" border size="small" style="margin:8px 0">
          <el-descriptions-item label="名称" :span="2">{{ current.name }}</el-descriptions-item>
          <el-descriptions-item label="权属人" :span="2">{{ current.owner }}</el-descriptions-item>
          <el-descriptions-item label="登记日期">{{ current.regDate }}</el-descriptions-item>
          <el-descriptions-item label="有效期至">{{ current.validUntil }}</el-descriptions-item>
          <el-descriptions-item label="账面原值">{{ current.value }} 万元</el-descriptions-item>
          <el-descriptions-item label="累计摊销">
            <span style="color:#f56c6c">{{ current.amortizeLogs.reduce((s, l) => s + l.amount, 0).toFixed(2) }} 万元</span>
          </el-descriptions-item>
          <el-descriptions-item label="摊销方式">{{ current.amortizeMethod }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(current.status)" size="small">{{ current.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <el-tabs v-model="detailTab" type="border-card">
          <el-tab-pane label="接收记录" name="receive">
            <el-timeline>
              <el-timeline-item v-for="(r, i) in current.receiveLogs" :key="i" :timestamp="r.time" type="primary">{{ r.text }}</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane label="评估记录" name="evaluate">
            <el-timeline>
              <el-timeline-item v-for="(r, i) in current.evalLogs" :key="i" :timestamp="r.time" type="success">{{ r.text }}</el-timeline-item>
              <el-timeline-item v-if="!current.evalLogs.length" timestamp="—" type="info">暂无评估记录</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane label="摊销记录" name="amortize">
            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:#666">摊销方式：{{ current.amortizeMethod }} | 累计摊销：{{ current.amortizeLogs.reduce((s, l) => s + l.amount, 0).toFixed(2) }} 万元</span>
              <el-button v-if="current.status === '使用中'" type="primary" size="small" @click="openAmortize(current)">新增摊销</el-button>
            </div>
            <el-table :data="current.amortizeLogs" border size="small" v-if="current.amortizeLogs.length">
              <el-table-column prop="period" label="摊销期间" width="160" />
              <el-table-column prop="amount" label="摊销金额(万元)" width="120" align="right">
                <template #default="{ row }">
                  <span style="color:#f56c6c">-{{ row.amount.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="bookValue" label="摊后账面价值(万元)" width="140" align="right" />
              <el-table-column prop="method" label="摊销方法" width="100" />
              <el-table-column prop="remark" label="备注" min-width="160" />
            </el-table>
            <el-empty v-else description="暂无摊销记录" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="使用记录" name="use">
            <el-timeline>
              <el-timeline-item v-for="(r, i) in current.useLogs" :key="i" :timestamp="r.time" type="warning">{{ r.text }}</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane label="权属维权" name="rights">
            <div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;color:#666">续展 · 变更 · 许可授权</span>
              <el-button v-if="current.status === '使用中'" type="primary" size="small" @click="openRightsAction(current)">新增记录</el-button>
            </div>
            <el-table :data="current.rightsLogs" border size="small" v-if="current.rightsLogs.length">
              <el-table-column prop="type" label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.type === '续展' ? 'success' : row.type === '许可' ? 'warning' : 'primary'" size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="content" label="内容" min-width="200" />
              <el-table-column prop="target" label="对象/相对方" width="160" />
              <el-table-column prop="validUntil" label="有效期至" width="100" />
            </el-table>
            <el-empty v-else description="暂无权属维权记录" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="流转记录" name="transfer">
            <el-timeline>
              <el-timeline-item v-for="(r, i) in current.transferLogs" :key="i" :timestamp="r.time" type="danger">{{ r.text }}</el-timeline-item>
              <el-timeline-item v-if="!current.transferLogs.length" timestamp="—" type="info">暂无流转记录</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          <el-tab-pane label="处置记录" name="disposal">
            <el-table :data="current.disposalLogs" border size="small" v-if="current.disposalLogs.length">
              <el-table-column prop="applyDate" label="申请日期" width="100" />
              <el-table-column prop="type" label="处置方式" width="100">
                <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="reason" label="处置原因" min-width="180" />
              <el-table-column prop="amount" label="金额(万元)" width="110" align="right" />
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="disposalStatusType(row.status)" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无处置记录" :image-size="60" />
          </el-tab-pane>
          <el-tab-pane label="权属管理" name="ownership">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="权属人">{{ current.owner }}</el-descriptions-item>
              <el-descriptions-item label="权属性质">{{ current.ownershipType }}</el-descriptions-item>
              <el-descriptions-item label="取得方式">{{ current.acquireWay }}</el-descriptions-item>
              <el-descriptions-item label="共有情况">{{ current.coOwner || '无共有' }}</el-descriptions-item>
              <el-descriptions-item label="他项权利">{{ current.otherRights || '无' }}</el-descriptions-item>
            </el-descriptions>
            <el-button type="primary" size="small" style="margin-top:12px" @click="transferOwnership">发起权属变更</el-button>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <!-- 登记新增 -->
    <el-dialog v-model="showCreate" title="无形资产登记" width="600px">
      <el-form :model="createForm" label-width="110px">
        <el-form-item label="资产类别" required>
          <el-select v-model="createForm.category" style="width:100%">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="createForm.name" placeholder="如：XX专利权" />
        </el-form-item>
        <el-form-item label="证书编号" required>
          <el-input v-model="createForm.certNo" placeholder="请输入证书编号" />
        </el-form-item>
        <el-form-item label="注册号/申请号">
          <el-input v-model="createForm.regNo" placeholder="请输入注册号" />
        </el-form-item>
        <el-form-item label="权属人" required>
          <el-input v-model="createForm.owner" placeholder="请输入权属人" />
        </el-form-item>
        <el-form-item label="登记日期" required>
          <el-date-picker v-model="createForm.regDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="有效期至" required>
          <el-date-picker v-model="createForm.validUntil" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="账面价值(万元)">
          <el-input-number v-model="createForm.value" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="取得方式">
          <el-select v-model="createForm.acquireWay" style="width:100%">
            <el-option label="自行研发" value="自行研发" />
            <el-option label="外购" value="外购" />
            <el-option label="划转" value="划转" />
            <el-option label="出资入股" value="出资入股" />
            <el-option label="政府授权" value="政府授权" />
            <el-option label="并购" value="并购" />
          </el-select>
        </el-form-item>
        <el-form-item label="摊销方式" required>
          <el-select v-model="createForm.amortizeMethod" style="width:100%">
            <el-option label="直线法" value="直线法" />
            <el-option label="产量法" value="产量法" />
            <el-option label="加速摊销" value="加速摊销" />
            <el-option label="不摊销" value="不摊销" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="createForm.category === '专利权'" label="专利类型">
          <el-select v-model="createForm.patentType" style="width:100%" clearable>
            <el-option label="发明专利" value="发明专利" />
            <el-option label="实用新型" value="实用新型" />
            <el-option label="外观设计" value="外观设计" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要/说明">
          <el-input v-model="createForm.summary" type="textarea" :rows="3" placeholder="资产简要说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="saveCreate">确认登记</el-button>
      </template>
    </el-dialog>

    <!-- 价值评估 -->
    <el-dialog v-model="showEvaluate" title="无形资产价值评估" width="480px">
      <el-form :model="evalForm" label-width="110px">
        <el-form-item label="资产名称">{{ current?.name }}</el-form-item>
        <el-form-item label="当前账面价值">{{ current?.value }} 万元</el-form-item>
        <el-form-item label="评估机构" required>
          <el-select v-model="evalForm.agency" style="width:100%">
            <el-option label="福建中兴资产评估有限公司" value="福建中兴资产评估有限公司" />
            <el-option label="福州榕信资产评估事务所" value="福州榕信资产评估事务所" />
            <el-option label="厦门市大学资产评估有限公司" value="厦门市大学资产评估有限公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="评估价值(万元)" required>
          <el-input-number v-model="evalForm.evalValue" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="评估基准日">
          <el-date-picker v-model="evalForm.baseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEvaluate = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluate">提交评估</el-button>
      </template>
    </el-dialog>

    <!-- 摊销登记 -->
    <el-dialog v-model="showAmortize" title="摊销登记" width="480px">
      <el-form :model="amortizeForm" label-width="120px">
        <el-form-item label="资产名称">{{ current?.name }}</el-form-item>
        <el-form-item label="当前账面价值">{{ current?.value }} 万元</el-form-item>
        <el-form-item label="累计已摊销">{{ current?.amortizeLogs?.reduce((s, l) => s + l.amount, 0).toFixed(2) || 0 }} 万元</el-form-item>
        <el-form-item label="摊销期间" required>
          <el-date-picker v-model="amortizeForm.period" type="monthrange" range-separator="至" start-placeholder="开始月份" end-placeholder="结束月份" value-format="YYYY-MM" style="width:100%" />
        </el-form-item>
        <el-form-item label="摊销金额(万元)" required>
          <el-input-number v-model="amortizeForm.amount" :min="0" :step="1" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="摊销方法">
          <el-select v-model="amortizeForm.method" style="width:100%">
            <el-option label="直线法" value="直线法" />
            <el-option label="产量法" value="产量法" />
            <el-option label="加速摊销" value="加速摊销" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="amortizeForm.remark" type="textarea" :rows="2" placeholder="摊销说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAmortize = false">取消</el-button>
        <el-button type="primary" @click="submitAmortize">确认摊销</el-button>
      </template>
    </el-dialog>

    <!-- 权属维权 -->
    <el-dialog v-model="showRightsAction" title="权属维权登记" width="520px">
      <el-form :model="rightsForm" label-width="110px">
        <el-form-item label="资产名称">{{ current?.name }}</el-form-item>
        <el-form-item label="维权类型" required>
          <el-radio-group v-model="rightsForm.type">
            <el-radio value="续展">续展</el-radio>
            <el-radio value="变更">变更</el-radio>
            <el-radio value="许可">许可</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="rightsForm.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="rightsForm.type === '许可'" label="许可对象" required>
          <el-input v-model="rightsForm.target" placeholder="被授权使用的单位/个人" />
        </el-form-item>
        <el-form-item v-if="rightsForm.type === '许可'" label="许可有效期至">
          <el-date-picker v-model="rightsForm.validUntil" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="rightsForm.type === '许可'" label="许可费用(万元/年)">
          <el-input-number v-model="rightsForm.fee" :min="0" :step="1" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item v-if="rightsForm.type === '变更'" label="变更内容" required>
          <el-input v-model="rightsForm.target" placeholder="如：权属人由A变更为B" />
        </el-form-item>
        <el-form-item label="内容说明" required>
          <el-input v-model="rightsForm.content" type="textarea" :rows="3" :placeholder="rightsContentPlaceholder" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRightsAction = false">取消</el-button>
        <el-button type="primary" @click="submitRightsAction">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 处置申请 -->
    <el-dialog v-model="showDisposal" title="资产处置申请" width="560px">
      <el-form :model="disposalForm" label-width="110px">
        <el-form-item label="资产名称">{{ current?.name }}</el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="statusType(current?.status)" size="small">{{ current?.status }}</el-tag>
        </el-form-item>
        <el-form-item label="账面价值">{{ current?.value }} 万元</el-form-item>
        <el-form-item label="处置方式" required>
          <el-select v-model="disposalForm.type" style="width:100%">
            <el-option label="转让" value="转让" />
            <el-option label="报废" value="报废" />
            <el-option label="置换" value="置换" />
            <el-option label="捐赠" value="捐赠" />
            <el-option label="核销" value="核销" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置原因" required>
          <el-input v-model="disposalForm.reason" type="textarea" :rows="3" placeholder="请详细说明处置原因" />
        </el-form-item>
        <el-form-item label="处置金额(万元)" v-if="disposalForm.type === '转让' || disposalForm.type === '置换'">
          <el-input-number v-model="disposalForm.amount" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="接收方" v-if="disposalForm.type === '转让' || disposalForm.type === '捐赠'">
          <el-input v-model="disposalForm.receiver" placeholder="受让方/受赠方" />
        </el-form-item>
        <el-form-item label="附件材料">
          <el-upload action="#" :auto-upload="false" :limit="5" accept=".pdf,.doc,.docx,.jpg,.png">
            <el-button size="small" type="primary">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 PDF/Word/图片，最多5个文件</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisposal = false">取消</el-button>
        <el-button type="primary" @click="submitDisposal">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 处置审批详情 -->
    <el-dialog v-model="showDisposalDetail" title="处置审批详情" width="600px">
      <template v-if="currentDisposal">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="资产名称" :span="2">{{ currentDisposal.assetName }}</el-descriptions-item>
          <el-descriptions-item label="资产类别">{{ currentDisposal.assetCategory }}</el-descriptions-item>
          <el-descriptions-item label="处置方式">{{ currentDisposal.type }}</el-descriptions-item>
          <el-descriptions-item label="处置原因" :span="2">{{ currentDisposal.reason }}</el-descriptions-item>
          <el-descriptions-item label="处置金额">{{ currentDisposal.amount ? currentDisposal.amount + ' 万元' : '—' }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentDisposal.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ currentDisposal.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag :type="disposalStatusType(currentDisposal.status)" size="small">{{ currentDisposal.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="currentDisposal.approvalLogs?.length" style="margin-top:16px">
          <div style="font-weight:600;margin-bottom:8px">审批流程</div>
          <el-timeline>
            <el-timeline-item v-for="(log, i) in currentDisposal.approvalLogs" :key="i" :timestamp="log.time" :type="log.type === '通过' ? 'success' : log.type === '驳回' ? 'danger' : 'primary'">
              {{ log.action }} — {{ log.user }}
              <span v-if="log.comment" style="color:#999;margin-left:8px">（{{ log.comment }}）</span>
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="showProfile" title="资产详情" size="880px">
      <template v-if="profile">
        <div style="display:flex;gap:16px;margin-bottom:14px">
          <div class="qr-box">
            <div class="cert-qr big">
              <div v-for="(cell, i) in qrFor(profile.certNo)" :key="i" class="qr-cell" :class="{ dark: cell }"></div>
            </div>
            <div class="qr-tip">资产二维码</div>
          </div>
          <div style="flex:1;min-width:0">
            <div class="detail-grid">
              <div class="cell"><div class="label">省市区街道</div><div class="value">{{ profile.regionText || '—' }}</div></div>
              <div class="cell"><div class="label">所属公司</div><div class="value">{{ profile.company }}</div></div>
              <div class="cell"><div class="label">资产编号</div><div class="value hl">{{ profile.assetNo }}</div></div>
              <div class="cell"><div class="label">管理人</div><div class="value">{{ profile.manager }}</div></div>
              <div class="cell"><div class="label">状态</div><div class="value"><el-tag size="small" :type="statusType(profile.status)">{{ profile.status }}</el-tag></div></div>
              <div class="cell"><div class="label">取得方式</div><div class="value">{{ profile.acquireWay }}</div></div>
              <div class="cell"><div class="label">初始价值</div><div class="value">{{ profile.initValue }} 万元</div></div>
              <div class="cell"><div class="label">累计摊销</div><div class="value">{{ amortizedOf(profile).toFixed(2) }} 万元</div></div>
              <div class="cell"><div class="label">账面价值</div><div class="value hl">{{ bookOf(profile) }} 万元</div></div>
              <div class="cell"><div class="label">有效期限</div><div class="value">{{ profile.validUntil }}</div></div>
              <div class="cell"><div class="label">创建时间</div><div class="value">{{ profile.createTime }}</div></div>
              <div class="cell"><div class="label">更新时间</div><div class="value">{{ profile.updateTime }}</div></div>
              <div class="cell"><div class="label">附件</div><div class="value"><div style="display:flex;gap:6px;flex-wrap:wrap"><div v-for="(f, i) in profile.attachments" :key="i" class="thumb" :title="f.name"><el-icon><Picture /></el-icon></div><span v-if="!profile.attachments || !profile.attachments.length">—</span></div></div></div>
              <div class="cell"><div class="label">专利号</div><div class="value">{{ profile.patentNo }}</div></div>
              <div class="cell"><div class="label">专利人</div><div class="value">{{ profile.patentOwner }}</div></div>
              <div class="cell"><div class="label">专利类型</div><div class="value">{{ profile.patentType || '—' }}</div></div>
              <div class="cell"><div class="label">专利技术领域</div><div class="value">{{ profile.patentField }}</div></div>
            </div>
          </div>
        </div>

        <div class="section-title" style="display:flex;align-items:center">
          权属信息
          <el-button type="primary" size="small" style="margin-left:auto" @click="openRightsBiz(profile)">权属业务</el-button>
        </div>
        <div class="detail-grid">
          <div class="cell"><div class="label">权属编号</div><div class="value hl">{{ profile.rightsNo }}</div></div>
          <div class="cell"><div class="label">有效期</div><div class="value">{{ profile.rightsValid }}</div></div>
          <div class="cell"><div class="label">权属占有类型</div><div class="value">{{ profile.holdType }}</div></div>
        </div>
        <el-table :data="profile.holders" border size="small" style="margin-bottom:14px">
          <el-table-column prop="unit" label="所属人单位" min-width="280" />
          <el-table-column prop="ratio" label="权属占比(%)" width="140" align="right">
            <template #default="{ row }">{{ row.ratio }}%</template>
          </el-table-column>
        </el-table>

        <div class="section-title">操作记录</div>
        <el-tabs v-model="opTab" type="border-card">
          <el-tab-pane label="接收记录" name="receive">
            <el-table :data="pagedOpRows('receive')" border size="small">
              <el-table-column prop="source" label="来源" width="90" align="center">
                <template #default="{ row }"><el-tag size="small">{{ row.source }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="sourceParty" label="来源方" min-width="170" />
              <el-table-column prop="docNo" label="来源依据文号" width="160" />
              <el-table-column prop="acquireDate" label="取得日期" width="100" />
              <el-table-column prop="cost" label="取得成本(万元)" width="120" align="right" />
              <el-table-column prop="receiveDate" label="接收日期" width="100" />
              <el-table-column prop="handler" label="交接人" width="90" />
              <el-table-column prop="note" label="来源说明" min-width="160" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="opPage.receive" v-model:page-size="opSize" :total="opRows('receive').length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="评估记录" name="evaluate">
            <el-table :data="pagedOpRows('evaluate')" border size="small">
              <el-table-column prop="source" label="来源" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" type="success">{{ row.source }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="sourceParty" label="来源方" min-width="200" />
              <el-table-column prop="date" label="评估日期" width="110" />
              <el-table-column prop="note" label="评估说明" min-width="240" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="opPage.evaluate" v-model:page-size="opSize" :total="opRows('evaluate').length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="使用记录" name="use">
            <el-table :data="pagedOpRows('use')" border size="small">
              <el-table-column prop="source" label="来源" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" type="warning">{{ row.source }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="useParty" label="使用方" min-width="200" />
              <el-table-column prop="date" label="使用日期" width="110" />
              <el-table-column prop="note" label="使用说明" min-width="240" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="opPage.use" v-model:page-size="opSize" :total="opRows('use').length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="摊销记录" name="amortize">
            <el-table :data="pagedOpRows('amortize')" border size="small">
              <el-table-column prop="period" label="摊销期间" width="170" />
              <el-table-column prop="amount" label="摊销金额(万元)" width="130" align="right">
                <template #default="{ row }"><span style="color:#f56c6c">-{{ row.amount.toFixed(2) }}</span></template>
              </el-table-column>
              <el-table-column prop="bookValue" label="摊后账面价值(万元)" width="150" align="right" />
              <el-table-column prop="method" label="摊销方法" width="100" />
              <el-table-column prop="remark" label="备注" min-width="180" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="opPage.amortize" v-model:page-size="opSize" :total="opRows('amortize').length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="权属管理" name="ownership">
            <el-table :data="pagedOpRows('ownership')" border size="small">
              <el-table-column prop="type" label="业务类型" width="90" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.type === '续展' ? 'success' : row.type === '许可' ? 'warning' : 'primary'">{{ row.type }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="holder" label="权利人" min-width="200" />
              <el-table-column prop="ratio" label="权利占比(%)" width="110" align="right">
                <template #default="{ row }">{{ row.ratio }}%</template>
              </el-table-column>
              <el-table-column prop="date" label="办理日期" width="110" />
              <el-table-column prop="applyNo" label="申请单号" width="150" />
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.status === '审批通过' ? 'success' : 'warning'">{{ row.status }}</el-tag></template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="opPage.ownership" v-model:page-size="opSize" :total="opRows('ownership').length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <el-dialog v-model="showRightsBiz" title="权属业务" width="760px">
      <template v-if="current">
        <div class="detail-grid">
          <div class="cell"><div class="label">资产</div><div class="value">{{ current.name }}</div></div>
          <div class="cell"><div class="label">资产编号</div><div class="value hl">{{ current.assetNo }}</div></div>
          <div class="cell"><div class="label">产权编号</div><div class="value">{{ current.rightsNo }}</div></div>
          <div class="cell"><div class="label">产权比例类型</div><div class="value">{{ current.rightsRatioType }}</div></div>
          <div class="cell"><div class="label">获取时间</div><div class="value">{{ current.acquireDate }}</div></div>
          <div class="cell"><div class="label">有效期</div><div class="value">{{ current.rightsValid }}</div></div>
          <div class="cell"><div class="label">创建时间</div><div class="value">{{ current.createTime }}</div></div>
        </div>
        <div class="section-title">权利人信息</div>
        <el-table :data="rightsBizForm.holders" border size="small">
          <el-table-column label="权利人/单位" min-width="260">
            <template #default="{ row }"><el-input v-model="row.unit" size="small" placeholder="请输入权利人/单位" /></template>
          </el-table-column>
          <el-table-column label="权利占比(%)" width="170" align="center">
            <template #default="{ row }"><el-input-number v-model="row.ratio" size="small" :min="0" :max="100" :precision="2" controls-position="right" style="width:140px" /></template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }"><el-button type="danger" link size="small" @click="rightsBizForm.holders.splice($index, 1)">删除</el-button></template>
          </el-table-column>
        </el-table>
        <el-button size="small" :icon="Plus" style="margin-top:8px" @click="rightsBizForm.holders.push({ unit: '', ratio: 0 })">添加权利人</el-button>
        <el-form label-width="100px" style="margin-top:16px">
          <el-form-item label="办理业务">
            <el-select v-model="rightsBizForm.type" style="width:220px">
              <el-option label="续展" value="续展" />
              <el-option label="变更" value="变更" />
              <el-option label="许可" value="许可" />
            </el-select>
          </el-form-item>
          <el-form-item label="申请单号">
            <el-input v-model="rightsBizForm.applyNo" disabled style="width:220px" />
          </el-form-item>
          <el-form-item label="申请材料">
            <el-upload action="#" :auto-upload="false" :limit="5">
              <el-button size="small" type="primary">上传材料</el-button>
            </el-upload>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showRightsBiz = false">取消</el-button>
        <el-button type="primary" @click="submitRightsBiz">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRbDetail" title="业务详情" width="660px">
      <template v-if="rbDetail">
        <div class="detail-grid">
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ rbDetail.company }}</div></div>
          <div class="cell"><div class="label">资产名称</div><div class="value">{{ rbDetail.assetName }}</div></div>
          <div class="cell"><div class="label">资产编号</div><div class="value hl">{{ rbDetail.assetNo }}</div></div>
          <div class="cell"><div class="label">资产权属编号</div><div class="value">{{ rbDetail.rightsNo }}</div></div>
          <div class="cell"><div class="label">业务类型</div><div class="value"><el-tag size="small" :type="rbDetail.type === '续展' ? 'success' : rbDetail.type === '许可' ? 'warning' : 'primary'">{{ rbDetail.type }}</el-tag></div></div>
          <div class="cell"><div class="label">申请单号</div><div class="value">{{ rbDetail.applyNo }}</div></div>
          <div class="cell"><div class="label">状态</div><div class="value"><el-tag size="small" :type="rbDetail.status === '审批通过' ? 'success' : 'warning'">{{ rbDetail.status }}</el-tag></div></div>
          <div class="cell"><div class="label">创建时间</div><div class="value">{{ rbDetail.createTime }}</div></div>
          <div class="cell"><div class="label">完成时间</div><div class="value">{{ rbDetail.finishTime || '—' }}</div></div>
        </div>
        <div class="section-title">权利人信息</div>
        <el-table :data="rbDetail.holders" border size="small">
          <el-table-column prop="unit" label="权利人/单位" min-width="240" />
          <el-table-column prop="ratio" label="权利占比(%)" width="130" align="right">
            <template #default="{ row }">{{ row.ratio }}%</template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <el-dialog v-model="showSaveAsset" title="保存无形资产" width="800px" top="5vh">
      <el-form :model="saveForm" label-width="130px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="所属公司" required>
              <el-select v-model="saveForm.company" filterable style="width:100%">
                <el-option v-for="c in companyOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产名称" required>
              <el-input v-model="saveForm.name" maxlength="50" show-word-limit placeholder="请输入资产名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省市区街道">
              <el-cascader v-model="saveForm.region" :options="regionOptions" clearable style="width:100%" placeholder="请选择省市区街道" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地图经纬度">
              <el-input v-model="saveForm.lnglat" placeholder="经度,纬度">
                <template #append><el-button @click="fetchLngLat">获取经纬度</el-button></template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资产类型" required>
              <el-select v-model="saveForm.category" style="width:100%">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初始入账价值">
              <el-input-number v-model="saveForm.initValue" :min="0" :step="10" :precision="2" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="取得方式">
              <el-select v-model="saveForm.acquireWay" style="width:100%">
                <el-option v-for="w in acquireWays" :key="w" :label="w" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初始材料编号">
              <el-input v-model="saveForm.materialNo" placeholder="请输入初始材料编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理人">
              <el-input v-model="saveForm.manager" placeholder="请输入管理人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用期限">
              <el-date-picker v-model="saveForm.useTerm" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利号">
              <el-input v-model="saveForm.patentNo" placeholder="请输入专利号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利类型">
              <el-select v-model="saveForm.patentType" clearable style="width:100%">
                <el-option v-for="t in ['发明专利', '实用新型', '外观设计']" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利申请日期">
              <el-date-picker v-model="saveForm.applyDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利授权日期">
              <el-date-picker v-model="saveForm.grantDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专利权人">
              <el-input v-model="saveForm.patentOwner" placeholder="请输入专利权人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技术领域">
              <el-input v-model="saveForm.techField" placeholder="请输入技术领域" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="专利要求书摘要">
          <el-input v-model="saveForm.claimSummary" type="textarea" :rows="3" maxlength="5000" show-word-limit placeholder="请输入专利要求书摘要" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="saveForm.desc" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="请输入资产描述" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :limit="5" accept=".pdf,.doc,.docx,.jpg,.png">
            <el-button size="small" type="primary">上传附件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveAsset = false">取消</el-button>
        <el-button type="primary" @click="submitSaveAsset">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDisposeForm" :title="disposeEditRow ? '修改资产处置' : '新增资产处置'" width="560px">
      <el-form :model="disposeForm" label-width="120px">
        <el-form-item label="资产" required>
          <el-select v-model="disposeForm.assetNo" filterable style="width:100%" placeholder="请选择资产">
            <el-option v-for="a in assets" :key="a.assetNo" :label="`${a.name}（${a.assetNo}）`" :value="a.assetNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置类型" required>
          <el-select v-model="disposeForm.type" style="width:100%">
            <el-option v-for="t in disposeTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置金额(万元)">
          <el-input-number v-model="disposeForm.amount" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="处置原因" required>
          <el-input v-model="disposeForm.reason" type="textarea" :rows="3" placeholder="请输入处置原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisposeForm = false">取消</el-button>
        <el-button type="primary" @click="submitDisposeForm">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDisposeApproval" title="处置审批" width="480px">
      <el-form label-width="110px">
        <el-form-item label="选择审批流程">
          <el-select v-model="approvalFlow" style="width:100%" placeholder="请选择审批流程">
            <el-option v-for="f in approvalFlows" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="addApproval">添加审批</el-button>
        </el-form-item>
        <el-form-item label="已添加流程">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <el-tag v-for="(f, i) in approvalRow?.approvals || []" :key="i" closable @close="approvalRow.approvals.splice(i, 1)">{{ f }}</el-tag>
            <span v-if="!approvalRow?.approvals?.length" style="color:#999;font-size:12px">尚未添加审批流程</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDisposeApproval = false">取消</el-button>
        <el-button type="primary" @click="confirmApproval">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDpDetail" title="资产处置详情" width="640px">
      <template v-if="dpDetail">
        <div class="detail-grid">
          <div class="cell"><div class="label">处置单号</div><div class="value hl">{{ dpDetail.no }}</div></div>
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ dpDetail.company }}</div></div>
          <div class="cell"><div class="label">资产名称</div><div class="value">{{ dpDetail.assetName }}</div></div>
          <div class="cell"><div class="label">资产编号</div><div class="value">{{ dpDetail.assetNo }}</div></div>
          <div class="cell"><div class="label">处置类型</div><div class="value"><el-tag size="small">{{ dpDetail.type }}</el-tag></div></div>
          <div class="cell"><div class="label">处置金额</div><div class="value">{{ dpDetail.amount ? dpDetail.amount + ' 万元' : '—' }}</div></div>
          <div class="cell"><div class="label">申请人</div><div class="value">{{ dpDetail.applicant }}</div></div>
          <div class="cell"><div class="label">状态</div><div class="value"><el-tag size="small" :type="disposalStatusType(dpDetail.status)">{{ dpDetail.status }}</el-tag></div></div>
          <div class="cell"><div class="label">创建时间</div><div class="value">{{ dpDetail.createTime }}</div></div>
          <div class="cell"><div class="label">处置原因</div><div class="value">{{ dpDetail.reason }}</div></div>
        </div>
        <div class="section-title">审批流程</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <el-tag v-for="(f, i) in dpDetail.approvals" :key="i" type="success">{{ f }}</el-tag>
          <span v-if="!dpDetail.approvals?.length" style="color:#999;font-size:12px">尚未设置审批流程</span>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="showTypeForm" title="修改类型" width="440px">
      <el-form :model="typeForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="typeForm.name" placeholder="请输入类型名称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="typeForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTypeForm = false">取消</el-button>
        <el-button type="primary" @click="submitTypeForm">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Picture, MoreFilled } from '@element-plus/icons-vue'

const categories = ['专利权', '商标权', '著作权', '土地使用权', '特许经营权', '商誉']
const activeTab = ref('专利权')
const detailTab = ref('receive')
const showDetail = ref(false)
const showCreate = ref(false)
const showEvaluate = ref(false)
const showAmortize = ref(false)
const showRightsAction = ref(false)
const showDisposal = ref(false)
const showDisposalDetail = ref(false)
const current = ref(null)
const currentDisposal = ref(null)

function makeAsset(overrides) {
  return {
    amortizeMethod: '直线法',
    patentType: '',
    summary: '',
    receiveLogs: [],
    evalLogs: [],
    useLogs: [],
    amortizeLogs: [],
    rightsLogs: [],
    transferLogs: [],
    disposalLogs: [],
    ...overrides,
  }
}

const assets = ref([
  makeAsset({ category: '专利权', name: '一种纺织面料节水印染装置', certNo: 'ZL2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: 'ZL202320XXXXXX5.6', regDate: '2023-06-15', validUntil: '2033-06-14', value: 320, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', patentType: '发明专利', summary: '涉及纺织面料印染领域的节水技术', coOwner: '', otherRights: '', receiveLogs: [{ time: '2023-06-20', text: '完成专利证书接收登记' }], evalLogs: [{ time: '2025-06-30', text: '福建中兴评估：评估价值 320 万元' }], useLogs: [{ time: '2024-01-10', text: '许可鸿运纺织使用该专利，年许可费 12 万元' }], amortizeLogs: [{ period: '2023-07 ~ 2024-06', amount: 32, bookValue: 288, method: '直线法', remark: '年度摊销（10年期限）' }, { period: '2024-07 ~ 2025-06', amount: 32, bookValue: 256, method: '直线法', remark: '年度摊销' }], rightsLogs: [{ type: '许可', date: '2024-01-10', content: '许可鸿运纺织使用该专利', target: '福建省长乐市鸿运纺织有限公司', validUntil: '2027-01-09', fee: 12 }], transferLogs: [] }),
  makeAsset({ category: '专利权', name: '智能停车道闸控制系统', certNo: 'ZL2026-0002', owner: '长乐区国有资产投资经营有限公司', regNo: 'ZL202420XXXXXX8.2', regDate: '2024-09-01', validUntil: '2034-08-31', value: 85, status: '使用中', ownershipType: '国有', acquireWay: '外购', amortizeMethod: '直线法', patentType: '实用新型', summary: '停车场智能道闸控制技术', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-09-05', text: '外购专利完成权属变更登记' }], evalLogs: [], useLogs: [{ time: '2025-03-01', text: '应用于城西停车场智能化改造' }], amortizeLogs: [{ period: '2024-10 ~ 2025-09', amount: 8.5, bookValue: 76.5, method: '直线法', remark: '年度摊销（10年期限）' }], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '商标权', name: '"长乐城投"服务商标', certNo: 'SB2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '第58XXXX21号', regDate: '2022-03-14', validUntil: '2032-03-13', value: 150, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2022-03-20', text: '商标注册证归档登记' }], evalLogs: [{ time: '2025-12-31', text: '年度评估：评估价值 150 万元' }], useLogs: [{ time: '2022-04-01', text: '用于公司对外品牌宣传' }], amortizeLogs: [{ period: '2022-04 ~ 2023-03', amount: 15, bookValue: 135, method: '直线法', remark: '年度摊销（10年期限）' }, { period: '2023-04 ~ 2024-03', amount: 15, bookValue: 120, method: '直线法', remark: '年度摊销' }, { period: '2024-04 ~ 2025-03', amount: 15, bookValue: 105, method: '直线法', remark: '年度摊销' }], rightsLogs: [{ type: '续展', date: '2025-12-01', content: '商标续展申请已提交，有效期至2042年', target: '', validUntil: '2042-03-13' }], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '著作权', name: '资产云管理平台软件著作权', certNo: 'ZR2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '2025SR0XXXX12', regDate: '2025-02-18', validUntil: '2075-02-17', value: 60, status: '使用中', ownershipType: '国有', acquireWay: '自行研发', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2025-02-20', text: '软著证书接收登记' }], evalLogs: [], useLogs: [{ time: '2025-03-01', text: '内部系统上线使用' }], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '土地使用权', name: '航城片区工业用地（宗地号350112-08）', certNo: 'TD2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '闽(2021)长乐区不动产权第00XXXX号', regDate: '2021-05-20', validUntil: '2071-05-19', value: 4200, status: '使用中', ownershipType: '国有出让', acquireWay: '划转', amortizeMethod: '不摊销', coOwner: '', otherRights: '已抵押（工行长乐支行，最高额2000万元）', receiveLogs: [{ time: '2021-06-01', text: '完成划转接收，权证入库' }], evalLogs: [{ time: '2026-01-15', text: '中兴评估：市场价值 4600 万元' }], useLogs: [{ time: '2022-01-01', text: '出租给鸿运纺织建设厂房，年租金 45 万元' }], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '特许经营权', name: '城区公共停车场特许经营权', certNo: 'TX2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '长政综[2024]XX号', regDate: '2024-01-10', validUntil: '2044-01-09', value: 1800, status: '使用中', ownershipType: '国有', acquireWay: '政府授权', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-01-15', text: '区政府授权文件归档' }], evalLogs: [{ time: '2025-06-30', text: '收益法评估：1800 万元' }], useLogs: [{ time: '2024-03-01', text: '委托物业公司运营12处停车场' }], amortizeLogs: [{ period: '2024-01 ~ 2024-12', amount: 90, bookValue: 1710, method: '直线法', remark: '年度摊销（20年期限）' }, { period: '2025-01 ~ 2025-12', amount: 90, bookValue: 1620, method: '直线法', remark: '年度摊销' }], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '特许经营权', name: '农贸市场摊位经营权', certNo: 'TX2026-0002', owner: '长乐区国有资产投资经营有限公司', regNo: '长国资[2025]XX号', regDate: '2025-04-01', validUntil: '2035-03-31', value: 260, status: '闲置', ownershipType: '国有', acquireWay: '政府授权', amortizeMethod: '直线法', coOwner: '', otherRights: '', receiveLogs: [{ time: '2025-04-05', text: '授权文件接收' }], evalLogs: [], useLogs: [], amortizeLogs: [], rightsLogs: [], transferLogs: [], disposalLogs: [] }),
  makeAsset({ category: '商誉', name: '并购鑫源物业形成的商誉', certNo: 'SY2026-0001', owner: '长乐区国有资产投资经营有限公司', regNo: '—', regDate: '2023-12-31', validUntil: '—', value: 500, status: '已注销', ownershipType: '国有', acquireWay: '并购', amortizeMethod: '不摊销', coOwner: '', otherRights: '', receiveLogs: [{ time: '2024-01-10', text: '并购完成，商誉入账登记' }], evalLogs: [{ time: '2025-12-31', text: '减值测试：可收回金额低于账面价值 500 万元' }], useLogs: [], amortizeLogs: [], rightsLogs: [], transferLogs: [{ time: '2026-06-30', text: '全额计提减值，商誉注销' }], disposalLogs: [{ applyDate: '2026-06-15', type: '核销', reason: '减值测试可收回金额低于账面价值', amount: 500, status: '已生效', applicant: '张会计', approvalLogs: [{ time: '2026-06-15', action: '提交处置申请', user: '张会计', type: '提交' }, { time: '2026-06-20', action: '部门审核通过', user: '李经理', type: '通过' }, { time: '2026-06-25', action: '总经理审批通过', user: '王总', type: '通过', comment: '同意核销' }, { time: '2026-06-30', action: '处置生效，资产已注销', user: '系统', type: '生效' }] }] }),
])

const activeAssets = computed(() => assets.value.filter(a => a.status !== '已注销'))
const certAssets = computed(() => assets.value.filter(a => a.status !== '已注销'))
const filteredAssets = computed(() => assets.value.filter(a => a.category === activeTab.value
  && (!iaQuery.keyword || a.name.includes(iaQuery.keyword) || (a.assetNo || '').includes(iaQuery.keyword) || (a.manager || '').includes(iaQuery.keyword))
  && (!iaQuery.company || a.company === iaQuery.company)
  && (!iaQuery.status || a.status === iaQuery.status)
  && (!iaQuery.acquireWay || a.acquireWay === iaQuery.acquireWay)))
const pagedAssets = computed(() => filteredAssets.value.slice((iaPage.value - 1) * iaSize.value, iaPage.value * iaSize.value))
watch(activeTab, () => { iaPage.value = 1 })

const totalValue = computed(() => activeAssets.value.reduce((s, a) => s + a.value, 0).toFixed(0))
const expiringSoon = computed(() => assets.value.filter(a => {
  if (a.validUntil === '—') return false
  const d = new Date(a.validUntil)
  const now = new Date()
  return d > now && (d - now) < 365 * 24 * 3600 * 1000
}).length)

const allDisposals = computed(() => {
  const list = []
  assets.value.forEach(a => {
    a.disposalLogs.forEach(d => {
      list.push({ ...d, assetName: a.name, assetCategory: a.category, certNo: a.certNo })
    })
  })
  return list.sort((a, b) => b.applyDate.localeCompare(a.applyDate))
})
const pendingDisposals = computed(() => allDisposals.value.filter(d => d.status === '审批中'))

function statusType(s) {
  return { '使用中': 'success', '闲置': 'warning', '已注销': 'info', '已停用': 'danger', '处置中': 'warning' }[s] || ''
}

function disposalStatusType(s) {
  return { '审批中': 'warning', '已通过': 'success', '已驳回': 'danger', '已生效': 'success' }[s] || 'info'
}

function viewDetail(row) {
  current.value = row
  detailTab.value = 'receive'
  showDetail.value = true
}

function handleAssetCmd(cmd, row) {
  const actions = {
    profile: viewAssetProfile,
    rightsBiz: openRightsBiz,
    evaluate: openEvaluate,
    amortize: openAmortize,
    rightsAction: openRightsAction,
    suspend: suspendAsset,
    resume: resumeAsset,
    dispose: openDisposal,
  }
  if (actions[cmd]) actions[cmd](row)
}

function qrFor(seedStr) {
  let seed = 0
  for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const cells = []
  for (let i = 0; i < 169; i++) cells.push(rand() > 0.5)
  const anchor = (r0, c0) => {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      const edge = r === 0 || r === 4 || c === 0 || c === 4
      const core = r === 2 && c === 2
      cells[(r0 + r) * 13 + (c0 + c)] = edge || core
    }
  }
  anchor(0, 0); anchor(0, 8); anchor(8, 0)
  return cells
}

const createForm = ref({})
function openCreate() {
  createForm.value = { category: categories.includes(activeTab.value) ? activeTab.value : categories[0], name: '', certNo: '', regNo: '', owner: '长乐区国有资产投资经营有限公司', regDate: '', validUntil: '', value: 0, acquireWay: '自行研发', amortizeMethod: '直线法', patentType: '', summary: '' }
  showCreate.value = true
}

function saveCreate() {
  const f = createForm.value
  if (!f.name || !f.certNo || !f.owner || !f.regDate || !f.validUntil) {
    ElMessage.warning('请填写完整的登记信息')
    return
  }
  if (assets.value.some(a => a.certNo === f.certNo)) {
    ElMessage.warning('证书编号已存在')
    return
  }
  const today0 = new Date().toISOString().slice(0, 10)
  const idx0 = assets.value.length + 1
  assets.value.unshift(makeAsset({
    ...f,
    status: '闲置',
    ownershipType: '国有',
    coOwner: '',
    otherRights: '',
    receiveLogs: [{ time: today0, text: '完成权证接收登记' }],
    company: f.owner,
    assetNo: `WC2026-${String(idx0).padStart(4, '0')}`,
    manager: managers[0],
    region: ['福建省', '福州市', '长乐区', '航城街道'],
    regionText: '福建省福州市长乐区航城街道',
    lnglat: '',
    initValue: f.value,
    createTime: nowTime(),
    updateTime: nowTime(),
    attachments: [],
    patentNo: f.patentType ? f.regNo : '—',
    patentOwner: f.owner,
    patentField: '—',
    applyDate: f.regDate,
    grantDate: f.regDate,
    claimSummary: f.summary || '',
    desc: f.summary || '',
    rightsNo: `QS2026-${String(idx0).padStart(4, '0')}`,
    rightsValid: f.validUntil,
    holdType: '单独所有',
    rightsRatioType: '单独所有',
    acquireDate: f.regDate,
    holders: [{ unit: f.owner, ratio: 100 }],
    opLogs: {
      receive: [{ source: f.acquireWay, sourceParty: f.owner, docNo: f.regNo || '—', acquireDate: f.regDate, cost: f.value, receiveDate: today0, handler: managers[0], note: '完成权证接收登记' }],
      evaluate: [],
      use: [],
      amortize: [],
      ownership: [],
    },
  }))
  showCreate.value = false
  ElMessage.success('无形资产登记成功')
}

const evalForm = ref({ agency: '', evalValue: 0, baseDate: '' })
function openEvaluate(row) {
  current.value = row
  evalForm.value = { agency: '福建中兴资产评估有限公司', evalValue: row.value, baseDate: new Date().toISOString().slice(0, 10) }
  showEvaluate.value = true
}

function submitEvaluate() {
  const row = current.value
  if (!evalForm.value.evalValue) {
    ElMessage.warning('请填写评估价值')
    return
  }
  row.evalLogs.push({
    time: evalForm.value.baseDate,
    text: `${evalForm.value.agency}：评估价值 ${evalForm.value.evalValue} 万元`
  })
  row.value = evalForm.value.evalValue
  showEvaluate.value = false
  ElMessage.success('评估记录已保存，账面价值已更新')
}

const amortizeForm = ref({ period: [], amount: 0, method: '直线法', remark: '' })
function openAmortize(row) {
  current.value = row
  amortizeForm.value = { period: [], amount: 0, method: row.amortizeMethod === '不摊销' ? '直线法' : row.amortizeMethod, remark: '' }
  showAmortize.value = true
}

function submitAmortize() {
  const row = current.value
  const f = amortizeForm.value
  if (!f.period || f.period.length < 2) {
    ElMessage.warning('请选择摊销期间')
    return
  }
  if (!f.amount || f.amount <= 0) {
    ElMessage.warning('请填写摊销金额')
    return
  }
  const totalAmortized = row.amortizeLogs.reduce((s, l) => s + l.amount, 0)
  if (totalAmortized + f.amount > row.value) {
    ElMessage.warning('摊销金额超出账面价值')
    return
  }
  const bookValue = +(row.value - totalAmortized - f.amount).toFixed(2)
  row.amortizeLogs.push({
    period: `${f.period[0]} ~ ${f.period[1]}`,
    amount: f.amount,
    bookValue,
    method: f.method,
    remark: f.remark || `${f.period[0]}至${f.period[1]}摊销`,
  })
  showAmortize.value = false
  ElMessage.success('摊销记录已保存')
}

const rightsForm = ref({ type: '续展', date: '', content: '', target: '', validUntil: '', fee: 0 })
const rightsContentPlaceholder = computed(() => {
  const map = { '续展': '续展说明，如：商标续展至XX年', '变更': '变更内容说明', '许可': '许可内容说明，如：授权XX公司使用' }
  return map[rightsForm.value.type] || '请输入内容说明'
})

function openRightsAction(row) {
  current.value = row
  rightsForm.value = { type: '续展', date: new Date().toISOString().slice(0, 10), content: '', target: '', validUntil: '', fee: 0 }
  showRightsAction.value = true
}

function submitRightsAction() {
  const row = current.value
  const f = rightsForm.value
  if (!f.date || !f.content) {
    ElMessage.warning('请填写日期和内容说明')
    return
  }
  if (f.type === '许可' && !f.target) {
    ElMessage.warning('许可类型需填写许可对象')
    return
  }
  row.rightsLogs.push({
    type: f.type,
    date: f.date,
    content: f.content,
    target: f.target || '',
    validUntil: f.validUntil || '',
    fee: f.fee || 0,
  })
  if (f.type === '许可') {
    row.useLogs.push({ time: f.date, text: `许可${f.target}使用，费用 ${f.fee} 万元/年` })
  }
  if (f.type === '续展' && f.validUntil) {
    row.validUntil = f.validUntil
    row.transferLogs.push({ time: f.date, text: `权证续展，新有效期至 ${f.validUntil}` })
  }
  showRightsAction.value = false
  ElMessage.success('权属维权记录已保存')
}

function suspendAsset(row) {
  ElMessageBox.confirm(`确认停用"${row.name}"？停用后将暂停该资产的一切运营操作。`, '停用确认', { type: 'warning' }).then(() => {
    row.status = '已停用'
    row.transferLogs.push({ time: new Date().toISOString().slice(0, 10), text: '资产停用' })
    ElMessage.success('资产已停用')
  }).catch(() => {})
}

function resumeAsset(row) {
  ElMessageBox.confirm(`确认重新启用"${row.name}"？`, '启用确认', { type: 'info' }).then(() => {
    row.status = '使用中'
    row.transferLogs.push({ time: new Date().toISOString().slice(0, 10), text: '资产重新启用' })
    ElMessage.success('资产已重新启用')
  }).catch(() => {})
}

const disposalForm = ref({ type: '转让', reason: '', amount: 0, receiver: '' })
function openDisposal(row) {
  current.value = row
  disposalForm.value = { type: '转让', reason: '', amount: 0, receiver: '' }
  showDisposal.value = true
}

function submitDisposal() {
  const row = current.value
  const f = disposalForm.value
  if (!f.reason) {
    ElMessage.warning('请填写处置原因')
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  const record = {
    applyDate: today,
    type: f.type,
    reason: f.reason,
    amount: f.amount || null,
    receiver: f.receiver || '',
    status: '审批中',
    applicant: '当前用户',
    approvalLogs: [
      { time: today, action: '提交处置申请', user: '当前用户', type: '提交' },
    ],
  }
  row.disposalLogs.push(record)
  row.status = '处置中'
  showDisposal.value = false
  ElMessage.success('处置申请已提交审批')
}

function viewDisposal(row) {
  currentDisposal.value = row
  showDisposalDetail.value = true
}

function approveDisposal(row) {
  ElMessageBox.confirm(`确认通过"${row.assetName}"的${row.type}处置申请？`, '审批确认', { type: 'warning' }).then(() => {
    const today = new Date().toISOString().slice(0, 10)
    row.status = '已通过'
    row.approvalLogs.push({ time: today, action: '审批通过', user: '审批人', type: '通过', comment: '同意处置' })
    row.approvalLogs.push({ time: today, action: '处置生效', user: '系统', type: '生效' })
    const asset = assets.value.find(a => a.certNo === row.certNo)
    if (asset) {
      asset.status = '已注销'
      asset.transferLogs.push({ time: today, text: `${row.type}处置完成，资产注销` })
    }
    ElMessage.success('处置审批已通过，资产已注销')
  }).catch(() => {})
}

function transferOwnership() {
  ElMessageBox.prompt('请输入变更后权属人名称', '权属变更', { inputPlaceholder: '如：长乐区某国有企业' }).then(({ value }) => {
    const row = current.value
    row.transferLogs.push({ time: new Date().toISOString().slice(0, 10), text: `权属由"${row.owner}"变更为"${value}"` })
    row.rightsLogs.push({ type: '变更', date: new Date().toISOString().slice(0, 10), content: `权属人由"${row.owner}"变更为"${value}"`, target: value, validUntil: '' })
    row.owner = value
    ElMessage.success('权属变更已记录')
  }).catch(() => {})
}

function downloadArchive(type) {
  const a = current.value
  if (!a) return
  const label = type === 'basic' ? '基础档案' : '基础材料'
  const lines = [
    `无形资产${label}`,
    `================================`,
    `资产名称：${a.name}`,
    `资产类别：${a.category}`,
    `证书编号：${a.certNo}`,
    `注册号：${a.regNo}`,
    `权属人：${a.owner}`,
    `登记日期：${a.regDate}`,
    `有效期至：${a.validUntil}`,
    `账面价值：${a.value} 万元`,
    `取得方式：${a.acquireWay}`,
    `摊销方式：${a.amortizeMethod}`,
    `状态：${a.status}`,
  ]
  if (type === 'material') {
    lines.push('', '--- 摊销记录 ---')
    a.amortizeLogs.forEach(l => {
      lines.push(`${l.period} | 金额：${l.amount}万元 | 摊后账面：${l.bookValue}万元 | ${l.method} | ${l.remark}`)
    })
    if (!a.amortizeLogs.length) lines.push('暂无摊销记录')
    lines.push('', '--- 权属维权记录 ---')
    a.rightsLogs.forEach(l => {
      lines.push(`${l.date} | 类型：${l.type} | ${l.content} | 对象：${l.target || '—'} | 有效期至：${l.validUntil || '—'}`)
    })
    if (!a.rightsLogs.length) lines.push('暂无权属维权记录')
  }
  lines.push('', `导出时间：${new Date().toLocaleString()}`)
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = url
  el.download = `${a.name}_${label}_${new Date().toISOString().slice(0, 10)}.txt`
  el.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`${a.name} 的${label}下载成功`)
}

function exportCategory() {
  const headers = ['名称', '证书编号', '权属人', '账面价值(万元)', '登记日期', '有效期至', '状态', '取得方式', '摊销方式']
  const rows = filteredAssets.value.map(a => [a.name, a.certNo, a.owner, a.value, a.regDate, a.validUntil, a.status, a.acquireWay, a.amortizeMethod].map(v => `"${v}"`))
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeTab.value}台账_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`${activeTab.value}台账导出成功`)
}

const companyOptions = ['长乐区国有资产投资经营有限公司', '长乐城投建设有限公司', '长乐区鑫源物业服务有限公司', '福建海峡新能源科技有限公司', '长乐文旅发展有限公司']
const acquireWays = ['自行研发', '外购', '划转', '出资入股', '政府授权', '并购', '接收']
const disposeTypes = ['转让', '报废', '置换', '捐赠', '核销']
const approvalFlows = ['国有资产处置审批流程', '企业内部三级审批流程', '财政联审流程']
const regionOptions = [
  { value: '福建省', label: '福建省', children: [
    { value: '福州市', label: '福州市', children: [
      { value: '长乐区', label: '长乐区', children: [
        { value: '航城街道', label: '航城街道' },
        { value: '吴航街道', label: '吴航街道' },
        { value: '营前街道', label: '营前街道' },
      ] },
      { value: '鼓楼区', label: '鼓楼区', children: [{ value: '鼓东街道', label: '鼓东街道' }] },
    ] },
    { value: '厦门市', label: '厦门市', children: [
      { value: '思明区', label: '思明区', children: [{ value: '筼筜街道', label: '筼筜街道' }] },
    ] },
  ] },
]

const iaFilter = reactive({ keyword: '', company: '', status: '', acquireWay: '' })
const iaQuery = reactive({ keyword: '', company: '', status: '', acquireWay: '' })
const iaPage = ref(1)
const iaSize = ref(10)
function doIaSearch() {
  Object.assign(iaQuery, iaFilter)
  iaPage.value = 1
}

function nowTime() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const managers = ['林志强', '王芳', '陈志明', '周琳']
assets.value.forEach((a, i) => {
  a.company = a.owner
  a.assetNo = `WC2026-${String(i + 1).padStart(4, '0')}`
  a.manager = managers[i % managers.length]
  a.region = ['福建省', '福州市', '长乐区', '航城街道']
  a.regionText = a.region.join('')
  a.lnglat = ''
  a.initValue = a.value
  a.createTime = `${a.regDate} 09:30`
  a.updateTime = '2026-08-16 15:42'
  a.attachments = [{ name: `${a.name}-权证扫描件.pdf` }]
  a.patentNo = a.category === '专利权' ? a.regNo : '—'
  a.patentOwner = a.owner
  a.patentType = a.patentType || ''
  a.patentField = a.category === '专利权' ? (a.summary || '节能环保技术') : '—'
  a.applyDate = a.regDate
  a.grantDate = a.regDate
  a.claimSummary = a.summary || ''
  a.desc = a.summary || ''
  a.rightsNo = `QS2026-${String(i + 1).padStart(4, '0')}`
  a.rightsValid = a.validUntil
  a.holdType = '单独所有'
  a.rightsRatioType = '单独所有'
  a.acquireDate = a.regDate
  a.holders = [{ unit: a.owner, ratio: 100 }]
  a.opLogs = {
    receive: (a.receiveLogs.length ? a.receiveLogs : [{ time: a.regDate, text: '资产接收入库' }]).map(l => ({
      source: a.acquireWay,
      sourceParty: a.acquireWay === '政府授权' ? '长乐区人民政府' : a.acquireWay === '划转' ? '长乐区国资办' : a.owner,
      docNo: a.regNo,
      acquireDate: a.regDate,
      cost: a.initValue,
      receiveDate: l.time,
      handler: a.manager,
      note: l.text,
    })),
    evaluate: a.evalLogs.map(l => ({ source: '委托评估', sourceParty: '福建中兴资产评估有限公司', date: l.time, note: l.text })),
    use: a.useLogs.map(l => ({ source: '经营使用', useParty: a.owner, date: l.time, note: l.text })),
    amortize: a.amortizeLogs,
    ownership: a.rightsLogs.map((l, j) => ({ type: l.type, holder: l.target || a.owner, ratio: 100, date: l.date, applyNo: `SQ2026${String(j + 1).padStart(6, '0')}`, status: '审批通过' })),
  }
})

const showSaveAsset = ref(false)
const saveForm = ref({})
function openSaveAsset() {
  saveForm.value = { company: companyOptions[0], name: '', region: [], lnglat: '', category: categories[0], initValue: 0, acquireWay: '自行研发', materialNo: '', manager: '', useTerm: [], patentNo: '', patentType: '', applyDate: '', grantDate: '', patentOwner: '', techField: '', claimSummary: '', desc: '' }
  showSaveAsset.value = true
}

function fetchLngLat() {
  saveForm.value.lnglat = '119.523456,25.962345'
  ElMessage.success('已获取地图经纬度')
}

function submitSaveAsset() {
  const f = saveForm.value
  if (!f.name || !f.company) {
    ElMessage.warning('请填写资产名称与所属公司')
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  const idx = assets.value.length + 1
  const a = makeAsset({
    category: f.category,
    name: f.name,
    certNo: f.patentNo || `ZC${today.slice(0, 4)}-${String(idx).padStart(4, '0')}`,
    owner: f.company,
    regNo: f.materialNo || '—',
    regDate: today,
    validUntil: (f.useTerm && f.useTerm[1]) || '—',
    value: f.initValue,
    status: '闲置',
    ownershipType: '国有',
    acquireWay: f.acquireWay,
    amortizeMethod: '直线法',
    patentType: f.patentType,
    summary: f.desc,
    coOwner: '',
    otherRights: '',
    receiveLogs: [{ time: today, text: '完成资产接收登记' }],
  })
  Object.assign(a, {
    company: f.company,
    assetNo: `WC2026-${String(idx).padStart(4, '0')}`,
    manager: f.manager || '—',
    region: f.region || [],
    regionText: (f.region || []).join(''),
    lnglat: f.lnglat,
    initValue: f.initValue,
    createTime: nowTime(),
    updateTime: nowTime(),
    attachments: [],
    patentNo: f.patentNo || '—',
    patentOwner: f.patentOwner || f.company,
    patentField: f.techField || '—',
    applyDate: f.applyDate || '',
    grantDate: f.grantDate || '',
    claimSummary: f.claimSummary,
    desc: f.desc,
    rightsNo: `QS2026-${String(idx).padStart(4, '0')}`,
    rightsValid: (f.useTerm && f.useTerm[1]) || '—',
    holdType: '单独所有',
    rightsRatioType: '单独所有',
    acquireDate: (f.useTerm && f.useTerm[0]) || today,
    holders: [{ unit: f.company, ratio: 100 }],
    opLogs: {
      receive: [{ source: '新增登记', sourceParty: f.company, docNo: f.materialNo || '—', acquireDate: today, cost: f.initValue, receiveDate: today, handler: f.manager || '—', note: '初始登记入库' }],
      evaluate: [],
      use: [],
      amortize: [],
      ownership: [],
    },
  })
  assets.value.unshift(a)
  showSaveAsset.value = false
  ElMessage.success('无形资产保存成功')
}

function downloadTemplate() {
  const headers = ['资产类别', '名称', '证书编号', '注册号', '权属人', '登记日期', '有效期至', '账面价值(万元)', '取得方式', '摊销方式', '资产说明']
  const example = ['专利权', 'XX专利权', 'ZL2026-XXXX', 'ZL20XXXXXXXXX', 'XX有限公司', '2026-01-01', '2036-01-01', '100', '自行研发', '直线法', '专利简要说明']
  const csv = '\uFEFF' + [headers.join(','), example.join(',')].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `无形资产导入模板_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('无形资产导入模板下载成功')
}

const showProfile = ref(false)
const profile = ref(null)
const opTab = ref('receive')
const opPage = reactive({ receive: 1, evaluate: 1, use: 1, amortize: 1, ownership: 1 })
const opSize = ref(5)
function viewAssetProfile(row) {
  profile.value = row
  opTab.value = 'receive'
  Object.keys(opPage).forEach(k => { opPage[k] = 1 })
  showProfile.value = true
}
function amortizedOf(a) {
  return (a.amortizeLogs || []).reduce((s, l) => s + l.amount, 0)
}
function bookOf(a) {
  return +(a.initValue - amortizedOf(a)).toFixed(2)
}
function opRows(key) {
  return (profile.value && profile.value.opLogs && profile.value.opLogs[key]) || []
}
function pagedOpRows(key) {
  return opRows(key).slice((opPage[key] - 1) * opSize.value, opPage[key] * opSize.value)
}

const rightsBizList = ref([
  { company: '长乐区国有资产投资经营有限公司', assetName: '"长乐城投"服务商标', assetNo: 'WC2026-0003', rightsNo: 'QS2026-0003', type: '续展', applyNo: 'SQ2025120100001', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 100 }], status: '审批通过', createTime: '2025-12-01 10:20', finishTime: '2025-12-18 16:00' },
  { company: '长乐区国有资产投资经营有限公司', assetName: '一种纺织面料节水印染装置', assetNo: 'WC2026-0001', rightsNo: 'QS2026-0001', type: '许可', applyNo: 'SQ2024011000002', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 60 }, { unit: '福建省长乐市鸿运纺织有限公司', ratio: 40 }], status: '审批通过', createTime: '2024-01-10 09:00', finishTime: '2024-01-25 15:30' },
  { company: '长乐区国有资产投资经营有限公司', assetName: '城区公共停车场特许经营权', assetNo: 'WC2026-0006', rightsNo: 'QS2026-0006', type: '变更', applyNo: 'SQ2026082000003', holders: [{ unit: '长乐区国有资产投资经营有限公司', ratio: 80 }, { unit: '长乐城投建设有限公司', ratio: 20 }], status: '审批中', createTime: '2026-08-20 14:10', finishTime: '' },
])

const showRightsBiz = ref(false)
const rightsBizForm = ref({ holders: [], type: '续展', applyNo: '' })
function openRightsBiz(row) {
  current.value = row
  rightsBizForm.value = { holders: (row.holders || []).map(h => ({ ...h })), type: '续展', applyNo: `SQ${Date.now().toString().slice(0, 13)}` }
  showRightsBiz.value = true
}
function submitRightsBiz() {
  const row = current.value
  const f = rightsBizForm.value
  const holders = f.holders.filter(h => h.unit)
  if (!holders.length) {
    ElMessage.warning('请填写权利人信息')
    return
  }
  rightsBizList.value.unshift({ company: row.company, assetName: row.name, assetNo: row.assetNo, rightsNo: row.rightsNo, type: f.type, applyNo: f.applyNo, holders, status: '审批中', createTime: nowTime(), finishTime: '' })
  row.rightsLogs.push({ type: f.type, date: new Date().toISOString().slice(0, 10), content: `${f.type}业务已提交，申请单号 ${f.applyNo}`, target: holders[0].unit, validUntil: '' })
  if (row.opLogs) {
    row.opLogs.ownership.push({ type: f.type, holder: holders[0].unit, ratio: holders[0].ratio, date: new Date().toISOString().slice(0, 10), applyNo: f.applyNo, status: '审批中' })
  }
  showRightsBiz.value = false
  ElMessage.success('权属业务已提交')
}

const rbFilter = reactive({ keyword: '', company: '', type: '', status: '' })
const rbQuery = reactive({ keyword: '', company: '', type: '', status: '' })
const rbPage = ref(1)
const rbSize = ref(10)
function doRbSearch() {
  Object.assign(rbQuery, rbFilter)
  rbPage.value = 1
}
const filteredRightsBiz = computed(() => rightsBizList.value.filter(r => (!rbQuery.keyword || r.assetName.includes(rbQuery.keyword) || r.applyNo.includes(rbQuery.keyword))
  && (!rbQuery.company || r.company === rbQuery.company)
  && (!rbQuery.type || r.type === rbQuery.type)
  && (!rbQuery.status || r.status === rbQuery.status)))
const pagedRightsBiz = computed(() => filteredRightsBiz.value.slice((rbPage.value - 1) * rbSize.value, rbPage.value * rbSize.value))
const rbDetail = ref(null)
const showRbDetail = ref(false)
function viewRightsBiz(row) {
  rbDetail.value = row
  showRbDetail.value = true
}

const disposalList = ref([
  { no: 'CZ2026-0001', company: '长乐区国有资产投资经营有限公司', assetName: '并购鑫源物业形成的商誉', assetNo: 'WC2026-0008', type: '核销', reason: '减值测试可收回金额低于账面价值', amount: 500, applicant: '张会计', status: '已生效', createTime: '2026-06-15 10:00', approvals: ['国有资产处置审批流程'] },
  { no: 'CZ2026-0002', company: '长乐区国有资产投资经营有限公司', assetName: '农贸市场摊位经营权', assetNo: 'WC2026-0007', type: '转让', reason: '长期闲置，公开挂牌转让', amount: 240, applicant: '林志强', status: '审批中', createTime: '2026-08-02 09:30', approvals: [] },
  { no: 'CZ2026-0003', company: '长乐城投建设有限公司', assetName: '智能停车道闸控制系统', assetNo: 'WC2026-0002', type: '报废', reason: '技术淘汰，设备整体报废', amount: 0, applicant: '陈志明', status: '已驳回', createTime: '2026-07-11 15:20', approvals: ['企业内部三级审批流程'] },
])

const dpFilter = reactive({ company: '', keyword: '', type: '' })
const dpQuery = reactive({ company: '', keyword: '', type: '' })
const dpPage = ref(1)
const dpSize = ref(10)
function doDpSearch() {
  Object.assign(dpQuery, dpFilter)
  dpPage.value = 1
}
const filteredDisposals = computed(() => disposalList.value.filter(d => (!dpQuery.company || d.company === dpQuery.company)
  && (!dpQuery.keyword || d.assetName.includes(dpQuery.keyword) || d.assetNo.includes(dpQuery.keyword))
  && (!dpQuery.type || d.type === dpQuery.type)))
const pagedDisposals = computed(() => filteredDisposals.value.slice((dpPage.value - 1) * dpSize.value, dpPage.value * dpSize.value))

const showDisposeForm = ref(false)
const disposeForm = ref({})
const disposeEditRow = ref(null)
function openDisposeForm(row) {
  disposeEditRow.value = row || null
  disposeForm.value = row ? { assetNo: row.assetNo, type: row.type, amount: row.amount, reason: row.reason } : { assetNo: '', type: '转让', amount: 0, reason: '' }
  showDisposeForm.value = true
}
function submitDisposeForm() {
  const f = disposeForm.value
  const a = assets.value.find(x => x.assetNo === f.assetNo)
  if (!a) {
    ElMessage.warning('请选择资产')
    return
  }
  if (!f.reason) {
    ElMessage.warning('请填写处置原因')
    return
  }
  if (disposeEditRow.value) {
    Object.assign(disposeEditRow.value, { type: f.type, amount: f.amount, reason: f.reason })
    ElMessage.success('资产处置已修改')
  } else {
    disposalList.value.unshift({ no: `CZ2026-${String(disposalList.value.length + 1).padStart(4, '0')}`, company: a.company, assetName: a.name, assetNo: a.assetNo, type: f.type, reason: f.reason, amount: f.amount, applicant: '当前用户', status: '审批中', createTime: nowTime(), approvals: [] })
    ElMessage.success('资产处置已新增')
  }
  showDisposeForm.value = false
}
function removeDispose(row) {
  ElMessageBox.confirm(`确认删除处置单"${row.no}"？`, '删除确认', { type: 'warning' }).then(() => {
    disposalList.value.splice(disposalList.value.indexOf(row), 1)
    ElMessage.success('已删除')
  }).catch(() => {})
}
function onDpCommand(cmd, row) {
  if (cmd === 'delete') removeDispose(row)
  else if (cmd === 'approval') openApproval(row)
}
const dpDetail = ref(null)
const showDpDetail = ref(false)
function viewDispose(row) {
  dpDetail.value = row
  showDpDetail.value = true
}

const showDisposeApproval = ref(false)
const approvalRow = ref(null)
const approvalFlow = ref('')
function openApproval(row) {
  approvalRow.value = row
  approvalFlow.value = ''
  if (!row.approvals) row.approvals = []
  showDisposeApproval.value = true
}
function addApproval() {
  if (!approvalFlow.value) {
    ElMessage.warning('请选择审批流程')
    return
  }
  approvalRow.value.approvals.push(approvalFlow.value)
  approvalFlow.value = ''
  ElMessage.success('审批流程已添加')
}
function confirmApproval() {
  showDisposeApproval.value = false
  ElMessage.success('处置审批流程设置成功')
}

const archiveList = ref([
  { name: '节水印染装置专利权属档案', assetName: '一种纺织面料节水印染装置', company: '长乐区国有资产投资经营有限公司', type: '权属管理', version: 'V2.1', attach: '权属证明扫描件.pdf', createTime: '2026-03-12 10:00' },
  { name: '长乐城投服务商标初始化档案', assetName: '"长乐城投"服务商标', company: '长乐区国有资产投资经营有限公司', type: '初始化数据', version: 'V1.0', attach: '商标注册证.pdf', createTime: '2022-03-20 09:00' },
  { name: '航城片区土地权属初始档案', assetName: '航城片区工业用地（宗地号350112-08）', company: '长乐区国有资产投资经营有限公司', type: '权属初始数据', version: 'V1.2', attach: '不动产权证.pdf', createTime: '2021-06-01 11:00' },
  { name: '停车场特许经营初始化档案', assetName: '城区公共停车场特许经营权', company: '长乐区国有资产投资经营有限公司', type: '初始化数据', version: 'V1.0', attach: '区政府授权文件.pdf', createTime: '2024-01-15 09:30' },
  { name: '资产云管理平台软著权属档案', assetName: '资产云管理平台软件著作权', company: '长乐区国有资产投资经营有限公司', type: '权属管理', version: 'V1.1', attach: '软件著作权证书.pdf', createTime: '2025-02-20 14:00' },
])
const arFilter = reactive({ keyword: '', company: '', type: '' })
const arQuery = reactive({ keyword: '', company: '', type: '' })
const arPage = ref(1)
const arSize = ref(10)
function doArSearch() {
  Object.assign(arQuery, arFilter)
  arPage.value = 1
}
const filteredArchives = computed(() => archiveList.value.filter(x => (!arQuery.keyword || x.name.includes(arQuery.keyword) || x.assetName.includes(arQuery.keyword))
  && (!arQuery.company || x.company === arQuery.company)
  && (!arQuery.type || x.type === arQuery.type)))
const pagedArchives = computed(() => filteredArchives.value.slice((arPage.value - 1) * arSize.value, arPage.value * arSize.value))
function archiveTypeTag(t) {
  return { '权属管理': 'primary', '初始化数据': 'success', '权属初始数据': 'warning' }[t] || 'info'
}
function downloadMaterial(row) {
  const lines = [
    '无形资产管理材料',
    `================================`,
    `档案名称：${row.name}`,
    `所属资产：${row.assetName}`,
    `所属公司：${row.company}`,
    `档案类型：${row.type}`,
    `版本：${row.version}`,
    `附件：${row.attach || '无'}`,
    `创建时间：${row.createTime}`,
    '',
    '--- 材料说明 ---',
    `本材料为"${row.assetName}"的${row.type}档案，版本${row.version}。`,
    `附件材料：${row.attach || '无'}`,
    '',
    `导出时间：${new Date().toLocaleString()}`,
  ]
  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = url
  el.download = `${row.name}_${new Date().toISOString().slice(0, 10)}.txt`
  el.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`《${row.name}》材料下载成功`)
}

const typeList = ref([
  { name: '专利权', status: '启用', remark: '含发明、实用新型、外观设计专利', createTime: '2021-01-05 09:00', updateTime: '2026-02-10 14:00' },
  { name: '商标权', status: '启用', remark: '注册商标专用权', createTime: '2021-01-05 09:05', updateTime: '2025-11-02 10:20' },
  { name: '著作权', status: '启用', remark: '含软件著作权与作品著作权', createTime: '2021-01-05 09:10', updateTime: '2025-06-18 16:40' },
  { name: '土地使用权', status: '启用', remark: '国有出让/划拨土地使用权', createTime: '2021-01-05 09:15', updateTime: '2024-12-01 11:00' },
  { name: '特许经营权', status: '启用', remark: '政府授权特许经营权益', createTime: '2021-01-05 09:20', updateTime: '2025-03-22 09:50' },
  { name: '商誉', status: '禁用', remark: '并购形成商誉，暂不新增', createTime: '2021-01-05 09:25', updateTime: '2026-06-30 15:00' },
])
const tyPage = ref(1)
const tySize = ref(10)
const pagedTypes = computed(() => typeList.value.slice((tyPage.value - 1) * tySize.value, tyPage.value * tySize.value))
const showTypeForm = ref(false)
const typeForm = ref({})
const typeEditRow = ref(null)
function openTypeForm(row) {
  typeEditRow.value = row
  typeForm.value = { name: row.name, remark: row.remark }
  showTypeForm.value = true
}
function submitTypeForm() {
  if (!typeForm.value.name) {
    ElMessage.warning('请填写类型名称')
    return
  }
  typeEditRow.value.name = typeForm.value.name
  typeEditRow.value.remark = typeForm.value.remark
  typeEditRow.value.updateTime = nowTime()
  showTypeForm.value = false
  ElMessage.success('类型已修改')
}
function toggleType(row) {
  row.status = row.status === '启用' ? '禁用' : '启用'
  row.updateTime = nowTime()
  ElMessage.success(`类型"${row.name}"已${row.status}`)
}
</script>

<style scoped>
.cert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.cert-card {
  cursor: pointer;
}
.cert-img {
  background: linear-gradient(160deg, #fdf6ec, #faecd8);
  border: 1px solid #e6d7b8;
  border-radius: 6px;
  padding: 16px 12px;
  text-align: center;
}
.cert-emblem {
  color: #d40000;
  font-size: 24px;
}
.cert-emblem.big {
  font-size: 40px;
  text-align: center;
}
.cert-title {
  font-weight: 700;
  color: #8b5a00;
  margin: 6px 0 4px;
  font-size: 15px;
}
.cert-no, .cert-valid {
  font-size: 12px;
  color: #999;
}
.cert-name {
  font-size: 13px;
  color: #333;
  margin: 6px 0 2px;
  line-height: 1.4;
}
.cert-owner {
  font-size: 12px;
  color: #666;
}
.cert-qr {
  display: grid;
  grid-template-columns: repeat(13, 4px);
  gap: 0;
  justify-content: center;
  margin: 10px auto 0;
}
.cert-qr.big {
  grid-template-columns: repeat(13, 7px);
  width: 91px;
  margin: 12px auto 0;
}
.qr-cell {
  width: 4px;
  height: 4px;
  background: #fff;
}
.cert-qr.big .qr-cell {
  width: 7px;
  height: 7px;
}
.qr-cell.dark {
  background: #222;
}
.cert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.cert-preview {
  background: linear-gradient(160deg, #fdf6ec, #faecd8);
  border: 1px solid #e6d7b8;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}
.cert-preview h3 {
  color: #8b5a00;
  margin: 8px 0;
}
.cert-preview p {
  font-size: 13px;
  color: #666;
  margin: 4px 0;
}
.qr-box {
  flex: none;
  width: 140px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 14px 10px;
  text-align: center;
  background: #fafafa;
}
.qr-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}
.thumb {
  width: 40px;
  height: 40px;
  border: 1px solid #ebeef5;
  background: #fafafa;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 18px;
  cursor: pointer;
}
.thumb:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
}
</style>
