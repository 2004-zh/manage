<template>
  <div class="page-container">
    <div class="page-header">
      <h2>长期股权投资</h2>
      <span class="page-subtitle">参股企业 · 股东结构 · 变更审批</span>
    </div>

    <div class="grid-4">
      <el-card shadow="hover">
        <div class="kpi-value" style="color:var(--c-primary)">{{ companies.length }}</div>
        <div class="kpi-label">参股企业(家)</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value" style="color:var(--c-success)">{{ totalInvest }}<span class="kpi-unit">万元</span></div>
        <div class="kpi-label">投资总额</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value" style="color:var(--c-warning)">{{ totalEquity }}<span class="kpi-unit">万元</span></div>
        <div class="kpi-label">权益账面价值</div>
      </el-card>
      <el-card shadow="hover">
        <div class="kpi-value" style="color:#722ed1">{{ totalDividend }}<span class="kpi-unit">万元</span></div>
        <div class="kpi-label">本年分红</div>
      </el-card>
    </div>

    <el-card shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>参股企业台账</span>
          <el-button type="primary" size="small" @click="openCompanyDialog()">新增参股企业</el-button>
        </div>
      </template>
      <el-table :data="companies" border stripe row-key="id">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 24px">
              <div class="detail-grid" style="margin-bottom:12px">
                <div class="cell"><div class="label">所属行业</div><div class="value">{{ row.industry }}</div></div>
                <div class="cell"><div class="label">法定代表人</div><div class="value">{{ row.legalPerson }}</div></div>
                <div class="cell"><div class="label">注册资本</div><div class="value">{{ row.regCapital.toLocaleString() }} 万元</div></div>
                <div class="cell"><div class="label">投资日期</div><div class="value">{{ row.investDate }}</div></div>
                <div class="cell"><div class="label">累计分红</div><div class="value">{{ row.dividend }} 万元</div></div>
              </div>
              <div style="font-weight:600;margin-bottom:8px">股东信息</div>
              <el-table :data="row.shareholders" border size="small">
                <el-table-column prop="name" label="股东名称" min-width="200" />
                <el-table-column prop="amount" label="出资额(万元)" width="120" align="right" />
                <el-table-column prop="ratio" label="出资比例" width="100" align="right">
                  <template #default="{ row: s }">{{ s.ratio }}%</template>
                </el-table-column>
                <el-table-column prop="way" label="出资方式" width="120" />
                <el-table-column prop="paidDate" label="出资日期" width="120" />
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="企业名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="creditCode" label="统一信用代码" width="170" show-overflow-tooltip />
        <el-table-column prop="investAmount" label="我方出资(万元)" width="120" align="right" />
        <el-table-column prop="holdRatio" label="持股比例" width="90" align="right">
          <template #default="{ row }">{{ row.holdRatio }}%</template>
        </el-table-column>
        <el-table-column prop="equityValue" label="权益价值(万元)" width="120" align="right" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : row.status === '变更中' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewCompany(row)">详情</el-button>
            <el-dropdown style="margin-left:8px;vertical-align:middle" @command="cmd => onCompanyCommand(cmd, row)">
              <el-button type="info" link size="small" :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="maintain">年度维护</el-dropdown-item>
                  <el-dropdown-item command="change">股权变更</el-dropdown-item>
                  <el-dropdown-item command="dividend">分红登记</el-dropdown-item>
                  <el-dropdown-item command="pledge">质押/冻结</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="chart-row chart-row-1-1">
        <el-card shadow="never">
          <template #header><span>变更记录</span></template>
          <el-table :data="changeRecords" border stripe size="small">
            <el-table-column prop="company" label="企业" width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="变更类型" width="90" />
            <el-table-column label="变更内容" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.before }} → {{ row.after }}</template>
            </el-table-column>
            <el-table-column prop="applyDate" label="申请日期" width="95" />
            <el-table-column prop="status" label="状态" width="75" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已生效' ? 'success' : row.status === '审批中' ? 'warning' : 'danger'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="85" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewChange(row)">详情</el-button>
                <el-button v-if="row.status === '审批中'" type="success" link size="small" @click="approveChange(row)">审批</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card shadow="never">
          <template #header><span>质押 / 冻结记录</span></template>
          <el-table :data="pledgeRecords" border stripe size="small">
            <el-table-column prop="company" label="企业" width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="60" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === '质押' ? 'warning' : 'danger'" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ratio" label="涉及比例" width="70" align="right">
              <template #default="{ row }">{{ row.ratio }}%</template>
            </el-table-column>
            <el-table-column prop="counterparty" label="质权人/执行方" min-width="120" show-overflow-tooltip />
            <el-table-column prop="startDate" label="起始日期" width="90" />
            <el-table-column prop="status" label="状态" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '生效中' ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === '生效中'" type="success" link size="small" @click="releasePledge(row)">解除</el-button>
                <span v-else style="color:var(--t-weak);font-size:12px">已解除</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>股权年度维护</span>
          <el-select v-model="maintainCompanyId" size="small" style="width:280px" placeholder="选择参股企业">
            <el-option v-for="c in companies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </div>
      </template>

      <template v-if="maintainCompany">
        <el-tabs v-model="maintainTab">
          <el-tab-pane name="report">
            <template #label>年度财务报告<span class="tab-count">{{ maintainCompany.reports.length }}</span></template>
            <div class="pane-bar">
              <el-button type="primary" size="small" @click="openMaintain('report')">新增年度报告</el-button>
              <el-button size="small" @click="exportReports">导出 CSV</el-button>
              <span class="pane-tip" v-if="latestReport">
                最新 {{ latestReport.year }} 年度：营收 {{ latestReport.revenue.toLocaleString() }} 万元，
                净利润 {{ latestReport.netProfit.toLocaleString() }} 万元
                <el-tag v-if="profitYoy !== null" :type="profitYoy >= 0 ? 'success' : 'danger'" size="small">
                  同比 {{ profitYoy >= 0 ? '+' : '' }}{{ profitYoy }}%
                </el-tag>
              </span>
            </div>
            <el-table :data="maintainCompany.reports" border stripe size="small">
              <el-table-column prop="year" label="年度" width="80" align="center" />
              <el-table-column prop="revenue" label="营业收入(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.revenue.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="netProfit" label="净利润(万元)" width="130" align="right">
                <template #default="{ row }">
                  <span :style="{ color: row.netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }">{{ row.netProfit.toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="totalAssets" label="资产总额(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.totalAssets.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="totalLiabilities" label="负债总额(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.totalLiabilities.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column label="资产负债率" width="110" align="right">
                <template #default="{ row }">{{ debtRatio(row) }}%</template>
              </el-table-column>
              <el-table-column prop="auditor" label="审计机构" min-width="170" show-overflow-tooltip />
              <el-table-column prop="opinion" label="审计意见" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.opinion === '标准无保留' ? 'success' : 'warning'" size="small">{{ row.opinion }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="110" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="primary" link size="small" @click="openMaintain('report', $index)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="removeMaintain('report', $index)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty><el-empty description="暂无年度财务报告" :image-size="60" /></template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="exec">
            <template #label>高管信息<span class="tab-count">{{ maintainCompany.executives.length }}</span></template>
            <div class="pane-bar">
              <el-button type="primary" size="small" @click="openMaintain('exec')">新增高管</el-button>
              <span class="pane-tip">我方委派 {{ oursCount }} 人 / 共 {{ maintainCompany.executives.length }} 人</span>
            </div>
            <el-table :data="maintainCompany.executives" border stripe size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div style="padding:8px 24px">
                    <div class="detail-grid">
                      <div class="cell"><div class="label">委派方</div><div class="value">{{ row.appointer }}</div></div>
                      <div class="cell"><div class="label">联系电话</div><div class="value">{{ row.phone || '—' }}</div></div>
                      <div class="cell"><div class="label">任职开始</div><div class="value">{{ row.startDate }}</div></div>
                      <div class="cell"><div class="label">任职结束</div><div class="value">{{ row.endDate || '在任' }}</div></div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="position" label="职务" width="110" />
              <el-table-column label="我方委派" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.ours ? 'success' : 'info'" size="small">{{ row.ours ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="任职期间" width="170" show-overflow-tooltip>
                <template #default="{ row }">{{ row.startDate }} 至 {{ row.endDate || '在任' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="110" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="primary" link size="small" @click="openMaintain('exec', $index)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="removeMaintain('exec', $index)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty><el-empty description="暂无高管信息" :image-size="60" /></template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="work">
            <template #label>工作纪要<span class="tab-count">{{ maintainCompany.workNotes.length }}</span></template>
            <div class="pane-bar">
              <el-button type="primary" size="small" @click="openMaintain('work')">新增工作纪要</el-button>
            </div>
            <el-table :data="maintainCompany.workNotes" border stripe size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div style="padding:8px 24px">
                    <div class="detail-grid">
                      <div class="cell"><div class="label">进展情况</div><div class="value">{{ row.progress }}</div></div>
                      <div class="cell"><div class="label">下一步安排</div><div class="value">{{ row.nextStep || '—' }}</div></div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="date" label="日期" width="100" />
              <el-table-column prop="recorder" label="记录人" width="90" />
              <el-table-column prop="subject" label="事项" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="110" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="primary" link size="small" @click="openMaintain('work', $index)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="removeMaintain('work', $index)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty><el-empty description="暂无工作纪要" :image-size="60" /></template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="meeting">
            <template #label>会议纪要<span class="tab-count">{{ maintainCompany.meetings.length }}</span></template>
            <div class="pane-bar">
              <el-button type="primary" size="small" @click="openMaintain('meeting')">新增会议纪要</el-button>
            </div>
            <el-table :data="maintainCompany.meetings" border stripe size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <div class="expand-block">
                    <p><b>议题：</b>{{ row.topic }}</p>
                    <p><b>决议：</b>{{ row.resolution }}</p>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="会议名称" min-width="170" show-overflow-tooltip />
              <el-table-column prop="time" label="会议时间" width="140" />
              <el-table-column prop="place" label="会议地点" width="140" show-overflow-tooltip />
              <el-table-column prop="attendees" label="参与人" min-width="160" show-overflow-tooltip />
              <el-table-column label="操作" width="110" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="primary" link size="small" @click="openMaintain('meeting', $index)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="removeMaintain('meeting', $index)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty><el-empty description="暂无会议纪要" :image-size="60" /></template>
            </el-table>
          </el-tab-pane>

          <el-tab-pane name="writeoff">
            <template #label>股权核销<span class="tab-count">{{ maintainCompany.writeOffs.length }}</span></template>
            <div class="pane-bar">
              <el-button type="danger" size="small" @click="openMaintain('writeoff')">登记核销</el-button>
              <span class="pane-tip">
                累计核销 {{ writeOffTotal.toLocaleString() }} 万元，当前权益价值 {{ maintainCompany.equityValue.toLocaleString() }} 万元
              </span>
            </div>
            <el-table :data="maintainCompany.writeOffs" border stripe size="small">
              <el-table-column prop="year" label="核销年度" width="90" align="center" />
              <el-table-column prop="amount" label="核销金额(万元)" width="130" align="right">
                <template #default="{ row }">
                  <span style="color:var(--c-danger)">-{{ row.amount.toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="核销原因" min-width="180" show-overflow-tooltip />
              <el-table-column prop="source" label="资金来源/科目" width="130" />
              <el-table-column prop="approver" label="审批人" width="120" show-overflow-tooltip />
              <el-table-column prop="approveTime" label="审批时间" width="150" />
              <template #empty><el-empty description="暂无股权核销记录" :image-size="60" /></template>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else description="请选择参股企业查看年度维护档案" :image-size="70" />
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="eqTab">
        <el-tab-pane label="股权登记" name="reg">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-select v-model="regFilter.company" placeholder="公司" clearable filterable style="width:240px">
              <el-option v-for="c in regCompanyOptions" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" :icon="Search" @click="doRegSearch">查询</el-button>
            <el-button type="primary" plain :icon="Plus" @click="openEqSave">新增</el-button>
          </div>
          <el-table :data="pagedRegs" border stripe size="small">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">地址</div><div class="value">{{ row.address }}</div></div>
                    <div class="cell"><div class="label">联系方式</div><div class="value">{{ row.contact }}</div></div>
                    <div class="cell"><div class="label">最后编辑时间</div><div class="value">{{ row.lastEdit }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="股权名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="regCapital" label="注册资金(万元)" width="120" align="right">
              <template #default="{ row }">{{ row.regCapital.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column label="操作" width="150" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewReg(row)">详情</el-button>
                <el-button type="success" link size="small" @click="viewReg(row, 'fin')">财务信息</el-button>
                <el-dropdown style="margin-left:12px;vertical-align:middle" @command="cmd => onRegCommand(cmd, row)">
                  <el-button type="info" link size="small" :icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="report">工作报告</el-dropdown-item>
                      <el-dropdown-item command="meeting">会议记录</el-dropdown-item>
                      <el-dropdown-item command="exec">高管信息</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="regPage" v-model:page-size="regSize" :total="filteredRegs.length" :page-sizes="[10, 15, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="regPage = 1" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="股权核销" name="writeoff">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-input v-model="woFilter.keyword" placeholder="股权名称/核销标题" clearable style="width:220px" @keyup.enter="doWoSearch" />
            <el-button type="primary" :icon="Search" @click="doWoSearch">查询</el-button>
            <el-button type="danger" plain :icon="Plus" @click="openWoSave">新增</el-button>
          </div>
          <el-table :data="pagedWos" border stripe size="small">
            <el-table-column type="expand">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="detail-grid">
                    <div class="cell"><div class="label">核销原因</div><div class="value">{{ row.reason }}</div></div>
                    <div class="cell"><div class="label">最后编辑时间</div><div class="value">{{ row.lastEdit }}</div></div>
                    <div class="cell"><div class="label">完成时间</div><div class="value">{{ row.finishTime || '—' }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="equity" label="股权名称" width="170" show-overflow-tooltip />
            <el-table-column prop="title" label="核销标题" min-width="170" show-overflow-tooltip />
            <el-table-column prop="amount" label="核销金额(万元)" width="120" align="right">
              <template #default="{ row }"><span style="color:var(--c-danger)">-{{ row.amount.toLocaleString() }}</span></template>
            </el-table-column>
            <el-table-column label="附件" width="70" align="center">
              <template #default="{ row }"><div class="thumb" :title="row.attach"><el-icon><Picture /></el-icon></div></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="85" align="center">
              <template #default="{ row }"><el-tag size="small" :type="row.status === '已通过' ? 'success' : 'danger'">{{ row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openWoApproval(row)">审批详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination v-model:current-page="woPage" v-model:page-size="woSize" :total="filteredWos.length" :page-sizes="[10, 15, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="woPage = 1" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 年度维护新增/编辑 -->
    <el-dialog v-model="maintainDialog.visible" :title="maintainDialogTitle" width="620px">
      <el-form label-width="130px">
        <template v-if="maintainDialog.type === 'report'">
          <el-form-item label="报告年度" required>
            <el-select v-model="maintainDialog.data.year" style="width:100%">
              <el-option v-for="y in reportYearOptions" :key="y" :label="`${y} 年度`" :value="y" />
            </el-select>
          </el-form-item>
          <el-form-item label="营业收入(万元)" required>
            <el-input-number v-model="maintainDialog.data.revenue" :min="0" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="净利润(万元)" required>
            <el-input-number v-model="maintainDialog.data.netProfit" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="资产总额(万元)" required>
            <el-input-number v-model="maintainDialog.data.totalAssets" :min="0" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="负债总额(万元)" required>
            <el-input-number v-model="maintainDialog.data.totalLiabilities" :min="0" :step="100" style="width:100%" />
          </el-form-item>
          <el-form-item label="审计机构">
            <el-input v-model="maintainDialog.data.auditor" placeholder="如：福建××会计师事务所" />
          </el-form-item>
          <el-form-item label="审计意见">
            <el-select v-model="maintainDialog.data.opinion" style="width:100%">
              <el-option v-for="o in ['标准无保留', '带强调事项段', '保留意见', '无法表示意见']" :key="o" :label="o" :value="o" />
            </el-select>
          </el-form-item>
        </template>

        <template v-else-if="maintainDialog.type === 'exec'">
          <el-form-item label="姓名" required>
            <el-input v-model="maintainDialog.data.name" />
          </el-form-item>
          <el-form-item label="职务" required>
            <el-select v-model="maintainDialog.data.position" style="width:100%" filterable allow-create>
              <el-option v-for="p in ['董事长', '副董事长', '总经理', '副总经理', '财务负责人', '监事', '董事']" :key="p" :label="p" :value="p" />
            </el-select>
          </el-form-item>
          <el-form-item label="委派方" required>
            <el-input v-model="maintainDialog.data.appointer" placeholder="如：长乐区国有资产投资经营有限公司" />
          </el-form-item>
          <el-form-item label="我方委派">
            <el-switch v-model="maintainDialog.data.ours" />
          </el-form-item>
          <el-form-item label="任职开始" required>
            <el-date-picker v-model="maintainDialog.data.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="任职结束">
            <el-date-picker v-model="maintainDialog.data.endDate" type="date" value-format="YYYY-MM-DD" style="width:100%" placeholder="留空表示在任" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="maintainDialog.data.phone" />
          </el-form-item>
        </template>

        <template v-else-if="maintainDialog.type === 'work'">
          <el-form-item label="日期" required>
            <el-date-picker v-model="maintainDialog.data.date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="记录人" required>
            <el-input v-model="maintainDialog.data.recorder" />
          </el-form-item>
          <el-form-item label="事项" required>
            <el-input v-model="maintainDialog.data.subject" placeholder="如：跟进标的公司产线扩建进度" />
          </el-form-item>
          <el-form-item label="进展情况" required>
            <el-input v-model="maintainDialog.data.progress" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="下一步安排">
            <el-input v-model="maintainDialog.data.nextStep" type="textarea" :rows="2" />
          </el-form-item>
        </template>

        <template v-else-if="maintainDialog.type === 'meeting'">
          <el-form-item label="会议名称" required>
            <el-input v-model="maintainDialog.data.name" placeholder="如：2026年第一次股东会" />
          </el-form-item>
          <el-form-item label="会议时间" required>
            <el-date-picker v-model="maintainDialog.data.time" type="datetime" value-format="YYYY-MM-DD HH:mm" style="width:100%" />
          </el-form-item>
          <el-form-item label="会议地点">
            <el-input v-model="maintainDialog.data.place" />
          </el-form-item>
          <el-form-item label="参与人" required>
            <el-input v-model="maintainDialog.data.attendees" placeholder="多人以顿号分隔" />
          </el-form-item>
          <el-form-item label="议题" required>
            <el-input v-model="maintainDialog.data.topic" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="决议" required>
            <el-input v-model="maintainDialog.data.resolution" type="textarea" :rows="3" />
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="核销年度" required>
            <el-select v-model="maintainDialog.data.year" style="width:100%">
              <el-option v-for="y in reportYearOptions" :key="y" :label="`${y} 年度`" :value="y" />
            </el-select>
          </el-form-item>
          <el-form-item label="核销金额(万元)" required>
            <el-input-number v-model="maintainDialog.data.amount" :min="0.01" :max="writeOffMax" :step="10" :precision="2" style="width:100%" />
            <div class="area-hint">当前权益价值 {{ (maintainCompany?.equityValue || 0).toLocaleString() }} 万元，核销后为 {{ ((maintainCompany?.equityValue || 0) - (maintainDialog.data.amount || 0)).toLocaleString() }} 万元</div>
          </el-form-item>
          <el-form-item label="核销原因" required>
            <el-input v-model="maintainDialog.data.reason" type="textarea" :rows="2" placeholder="如：标的公司注销清算，长期股权投资无法收回" />
          </el-form-item>
          <el-form-item label="资金来源/科目" required>
            <el-select v-model="maintainDialog.data.source" style="width:100%">
              <el-option v-for="s in ['减值准备', '清算收回', '投资损失', '坏账核销']" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
          <el-form-item label="审批人" required>
            <el-input v-model="maintainDialog.data.approver" placeholder="如：区国资办 林主任" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="maintainDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="saveMaintain">保存</el-button>
      </template>
    </el-dialog>

    <!-- 企业详情 -->
    <el-drawer v-model="showCompanyDrawer" title="参股企业详情" size="600px">
      <template v-if="currentCompany">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="企业名称" :span="2">{{ currentCompany.name }}</el-descriptions-item>
          <el-descriptions-item label="统一信用代码" :span="2">{{ currentCompany.creditCode }}</el-descriptions-item>
          <el-descriptions-item label="法定代表人">{{ currentCompany.legalPerson }}</el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ currentCompany.industry }}</el-descriptions-item>
          <el-descriptions-item label="注册资本">{{ currentCompany.regCapital }} 万元</el-descriptions-item>
          <el-descriptions-item label="我方出资">{{ currentCompany.investAmount }} 万元</el-descriptions-item>
          <el-descriptions-item label="持股比例">{{ currentCompany.holdRatio }}%</el-descriptions-item>
          <el-descriptions-item label="投资日期">{{ currentCompany.investDate }}</el-descriptions-item>
          <el-descriptions-item label="累计分红">{{ currentCompany.dividend }} 万元</el-descriptions-item>
          <el-descriptions-item label="权益价值">{{ currentCompany.equityValue }} 万元</el-descriptions-item>
        </el-descriptions>
        <el-divider>股东结构</el-divider>
        <el-table :data="currentCompany.shareholders" border size="small">
          <el-table-column prop="name" label="股东" min-width="180" />
          <el-table-column prop="amount" label="出资额(万元)" width="110" align="right" />
          <el-table-column prop="ratio" label="比例" width="80" align="right">
            <template #default="{ row }">{{ row.ratio }}%</template>
          </el-table-column>
          <el-table-column prop="way" label="出资方式" width="100" />
        </el-table>
        <el-divider>审批进度（最近一次变更）</el-divider>
        <el-steps direction="vertical" :active="currentCompany.approvalSteps.filter(s => s.status === '已完成').length" v-if="currentCompany.approvalSteps?.length">
          <el-step v-for="s in currentCompany.approvalSteps" :key="s.name" :title="s.name" :description="`${s.handler} · ${s.time || '待处理'}`"
            :status="s.status === '已完成' ? 'success' : s.status === '进行中' ? 'process' : 'wait'" />
        </el-steps>
        <el-empty v-else description="暂无变更审批" :image-size="60" />
      </template>
    </el-drawer>

    <!-- 新增参股企业 -->
    <el-dialog v-model="showCompanyDialog" title="新增参股企业" width="560px">
      <el-form :model="companyForm" label-width="120px">
        <el-form-item label="企业名称" required>
          <el-input v-model="companyForm.name" placeholder="请输入企业全称" />
        </el-form-item>
        <el-form-item label="统一信用代码" required>
          <el-input v-model="companyForm.creditCode" placeholder="18位统一社会信用代码" />
        </el-form-item>
        <el-form-item label="法定代表人">
          <el-input v-model="companyForm.legalPerson" />
        </el-form-item>
        <el-form-item label="所属行业">
          <el-select v-model="companyForm.industry" style="width:100%">
            <el-option v-for="i in ['城市建设', '金融服务', '物业管理', '文化旅游', '交通运输', '新能源']" :key="i" :label="i" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册资本(万元)" required>
          <el-input-number v-model="companyForm.regCapital" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="我方出资(万元)" required>
          <el-input-number v-model="companyForm.investAmount" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="投资日期">
          <el-date-picker v-model="companyForm.investDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompanyDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCompany">保存</el-button>
      </template>
    </el-dialog>

    <!-- 股权变更 -->
    <el-dialog v-model="showChangeDialog" title="股权变更申请" width="560px">
      <el-form :model="changeForm" label-width="130px">
        <el-form-item label="企业">{{ currentCompany?.name }}</el-form-item>
        <el-form-item label="变更类型" required>
          <el-select v-model="changeForm.type" style="width:100%">
            <el-option label="增资扩股" value="增资扩股" />
            <el-option label="股权转让" value="股权转让" />
            <el-option label="减资" value="减资" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更前出资(万元)">
          <el-input :model-value="currentCompany?.investAmount" disabled />
        </el-form-item>
        <el-form-item label="变更后出资(万元)" required>
          <el-input-number v-model="changeForm.afterAmount" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="变更原因" required>
          <el-input v-model="changeForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChange">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 变更详情 -->
    <el-dialog v-model="showChangeDetail" title="变更详情" width="560px">
      <template v-if="currentChange">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="企业" :span="2">{{ currentChange.company }}</el-descriptions-item>
          <el-descriptions-item label="变更类型">{{ currentChange.type }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ currentChange.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="变更前">{{ currentChange.before }}</el-descriptions-item>
          <el-descriptions-item label="变更后">{{ currentChange.after }}</el-descriptions-item>
          <el-descriptions-item label="变更原因" :span="2">{{ currentChange.reason }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentChange.status === '已生效' ? 'success' : currentChange.status === '审批中' ? 'warning' : 'danger'" size="small">{{ currentChange.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider>审批步骤</el-divider>
        <el-steps direction="vertical" :active="currentChange.steps.filter(s => s.status === '已完成').length">
          <el-step v-for="s in currentChange.steps" :key="s.name" :title="s.name" :description="`${s.handler} · ${s.time || '待处理'}`"
            :status="s.status === '已完成' ? 'success' : s.status === '进行中' ? 'process' : 'wait'" />
        </el-steps>
      </template>
    </el-dialog>

    <!-- 分红登记 -->
    <el-dialog v-model="showDividendDialog" title="分红登记" width="440px">
      <el-form :model="dividendForm" label-width="110px">
        <el-form-item label="企业">{{ currentCompany?.name }}</el-form-item>
        <el-form-item label="持股比例">{{ currentCompany?.holdRatio }}%</el-form-item>
        <el-form-item label="分红年度" required>
          <el-select v-model="dividendForm.year" style="width:100%">
            <el-option label="2026年度" value="2026" />
            <el-option label="2025年度" value="2025" />
          </el-select>
        </el-form-item>
        <el-form-item label="分红金额(万元)" required>
          <el-input-number v-model="dividendForm.amount" :min="0" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDividendDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDividend">确认登记</el-button>
      </template>
    </el-dialog>

    <!-- 质押/冻结 -->
    <el-dialog v-model="showPledgeDialog" title="股权质押/冻结登记" width="480px">
      <el-form :model="pledgeForm" label-width="130px">
        <el-form-item label="企业">{{ currentCompany?.name }}</el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="pledgeForm.type">
            <el-radio value="质押">质押</el-radio>
            <el-radio value="冻结">冻结</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="涉及股权比例(%)" required>
          <el-input-number v-model="pledgeForm.ratio" :min="0.1" :max="currentCompany?.holdRatio || 100" :step="1" :precision="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="质权人/执行方" required>
          <el-input v-model="pledgeForm.counterparty" placeholder="如：工商银行长乐支行 / XX法院" />
        </el-form-item>
        <el-form-item label="起始日期">
          <el-date-picker v-model="pledgeForm.startDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPledgeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPledge">确认登记</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEqSave" title="保存股权信息" width="780px" top="5vh">
      <el-form :model="eqForm" label-width="120px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="股权名称" required>
              <el-input v-model="eqForm.name" placeholder="请输入企业/股权名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法定代表人">
              <el-input v-model="eqForm.legalPerson" placeholder="请输入法定代表人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立日期">
              <el-date-picker v-model="eqForm.estDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核准日期">
              <el-date-picker v-model="eqForm.approveDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登记机关">
              <el-input v-model="eqForm.regOrg" placeholder="请输入登记机关" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登记状态">
              <el-select v-model="eqForm.regStatus" style="width:100%">
                <el-option v-for="s in ['在营（开业）', '存续', '注销', '吊销']" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业期限">
              <el-date-picker v-model="eqForm.term" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效联系方式">
              <el-input v-model="eqForm.contact" placeholder="电话/邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="经营范围">
          <el-input v-model="eqForm.scope" type="textarea" :rows="2" placeholder="请输入经营范围" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="eqForm.address" type="textarea" :rows="2" placeholder="请输入注册地址" />
        </el-form-item>
      </el-form>
      <div class="section-title">添加权属信息</div>
      <el-table :data="eqForm.shareholders" border size="small">
        <el-table-column label="股东名称" min-width="220">
          <template #default="{ row }"><el-input v-model="row.name" size="small" placeholder="请输入股东名称" /></template>
        </el-table-column>
        <el-table-column label="认缴(万元)" width="160" align="center">
          <template #default="{ row }"><el-input-number v-model="row.subscribed" size="small" :min="0" :precision="2" controls-position="right" style="width:130px" /></template>
        </el-table-column>
        <el-table-column label="实缴(万元)" width="160" align="center">
          <template #default="{ row }"><el-input-number v-model="row.paid" size="small" :min="0" :precision="2" controls-position="right" style="width:130px" /></template>
        </el-table-column>
        <el-table-column label="股权(%)" width="150" align="center">
          <template #default="{ row }"><el-input-number v-model="row.ratio" size="small" :min="0" :max="100" :precision="2" controls-position="right" style="width:120px" /></template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ $index }"><el-button type="danger" link size="small" @click="eqForm.shareholders.splice($index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <el-button size="small" :icon="Plus" style="margin-top:8px" @click="addEqHolder">添加权属信息</el-button>
      <template #footer>
        <el-button @click="showEqSave = false">取消</el-button>
        <el-button type="primary" @click="submitEqSave">提交</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showRegDetail" title="登记详情" size="840px">
      <template v-if="currentReg">
        <div class="section-title">股权信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">法定代表人</div><div class="value">{{ currentReg.legalPerson }}</div></div>
          <div class="cell"><div class="label">成立日期</div><div class="value">{{ currentReg.estDate }}</div></div>
          <div class="cell"><div class="label">核准日期</div><div class="value">{{ currentReg.approveDate }}</div></div>
          <div class="cell"><div class="label">登记机关</div><div class="value">{{ currentReg.regOrg }}</div></div>
          <div class="cell"><div class="label">登记状态</div><div class="value"><el-tag size="small" type="success">{{ currentReg.regStatus }}</el-tag></div></div>
          <div class="cell"><div class="label">营业期限</div><div class="value">{{ currentReg.term && currentReg.term[0] }} 至 {{ currentReg.term && currentReg.term[1] }}</div></div>
          <div class="cell"><div class="label">联系地址</div><div class="value">{{ currentReg.address }}</div></div>
          <div class="cell"><div class="label">联系方式</div><div class="value">{{ currentReg.contact }}</div></div>
          <div class="cell"><div class="label">经营范围</div><div class="value">{{ currentReg.scope }}</div></div>
        </div>
        <div class="section-title">股权占比</div>
        <el-table :data="currentReg.shareholders" border size="small" style="margin-bottom:12px">
          <el-table-column prop="name" label="股东名称" min-width="240" />
          <el-table-column prop="ratio" label="股权占比(%)" width="120" align="right">
            <template #default="{ row }">{{ row.ratio }}%</template>
          </el-table-column>
          <el-table-column prop="subscribed" label="认缴资金(万元)" width="140" align="right" />
          <el-table-column prop="paid" label="实缴资金(万元)" width="140" align="right" />
        </el-table>
        <el-tabs v-model="regTab" type="border-card">
          <el-tab-pane label="高管信息" name="exec">
            <el-table :data="innerRows('exec', currentReg.execs)" border size="small">
              <el-table-column prop="name" label="名字" width="90" />
              <el-table-column prop="position" label="职位" width="110" />
              <el-table-column prop="intro" label="简介" min-width="220" />
              <el-table-column label="简历文件" width="90" align="center">
                <template #default="{ row }"><div class="thumb" :title="row.resumeFile"><el-icon><Picture /></el-icon></div></template>
              </el-table-column>
              <el-table-column prop="createTime" label="创建时间" width="150" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.exec" v-model:page-size="innerSize" :total="currentReg.execs.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="会议记录" name="meeting">
            <el-table :data="innerRows('meeting', currentReg.meetings)" border size="small">
              <el-table-column prop="name" label="会议名称" min-width="170" />
              <el-table-column prop="time" label="会议时间" width="140" />
              <el-table-column prop="place" label="会议地点" width="150" />
              <el-table-column prop="attendees" label="参与人" min-width="150" />
              <el-table-column prop="resolution" label="决议事项" min-width="220" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.meeting" v-model:page-size="innerSize" :total="currentReg.meetings.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="工作报告" name="report">
            <el-table :data="innerRows('report', currentReg.workReports)" border size="small">
              <el-table-column prop="period" label="报告期间" width="110" />
              <el-table-column prop="reporter" label="报告人" width="90" />
              <el-table-column prop="content" label="工作内容" min-width="280" />
              <el-table-column prop="createTime" label="创建时间" width="150" />
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.report" v-model:page-size="innerSize" :total="currentReg.workReports.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="财务信息" name="fin">
            <el-table :data="innerRows('fin', currentReg.finances)" border size="small">
              <el-table-column prop="year" label="年度" width="80" align="center" />
              <el-table-column prop="revenue" label="营业收入(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.revenue.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="netProfit" label="净利润(万元)" width="130" align="right">
                <template #default="{ row }"><span :style="{ color: row.netProfit >= 0 ? 'var(--c-success)' : 'var(--c-danger)' }">{{ row.netProfit.toLocaleString() }}</span></template>
              </el-table-column>
              <el-table-column prop="totalAssets" label="资产总额(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.totalAssets.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="totalLiabilities" label="负债总额(万元)" width="140" align="right">
                <template #default="{ row }">{{ row.totalLiabilities.toLocaleString() }}</template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.fin" v-model:page-size="innerSize" :total="currentReg.finances.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="变更记录" name="change">
            <el-table :data="innerRows('change', currentReg.changes)" border size="small">
              <el-table-column prop="title" label="变更标题" min-width="160" />
              <el-table-column prop="type" label="变更类型" width="100" />
              <el-table-column prop="status" label="审批状态" width="100" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.status === '已通过' ? 'success' : row.status === '审批中' ? 'warning' : 'danger'">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="finishTime" label="完成时间" width="150">
                <template #default="{ row }">{{ row.finishTime || '—' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }"><el-button type="primary" link size="small" @click="openChangeApproval(row)">详情</el-button></template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.change" v-model:page-size="innerSize" :total="currentReg.changes.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
          <el-tab-pane label="核销记录" name="wo">
            <el-table :data="innerRows('wo', regWriteoffs)" border size="small">
              <el-table-column prop="title" label="核销标题" min-width="170" />
              <el-table-column prop="amount" label="核销金额(万元)" width="130" align="right">
                <template #default="{ row }"><span style="color:var(--c-danger)">-{{ row.amount.toLocaleString() }}</span></template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.status === '已通过' ? 'success' : 'danger'">{{ row.status }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="finishTime" label="完成时间" width="150" />
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }"><el-button type="primary" link size="small" @click="openWoApproval(row)">详情</el-button></template>
              </el-table-column>
            </el-table>
            <div class="pager">
              <el-pagination v-model:current-page="innerPage.wo" v-model:page-size="innerSize" :total="regWriteoffs.length" :page-sizes="[5, 10, 20]" layout="total, sizes, prev, pager, next, jumper" small />
            </div>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <el-drawer v-model="showChangeApproval" title="变更审批详情" size="680px">
      <template v-if="currentApproval">
        <div class="section-title">股权变更对比</div>
        <div class="cmp-block">
          <div class="cmp-col">
            <div class="cmp-head">变更前</div>
            <div v-for="(s, i) in currentApproval.before" :key="i" class="cmp-line before">{{ s.name }}：{{ s.ratio }}% | 认缴 {{ s.subscribed }} 万元 | 实缴 {{ s.paid }} 万元</div>
          </div>
          <div class="cmp-arrow">→</div>
          <div class="cmp-col">
            <div class="cmp-head">变更后</div>
            <div v-for="(s, i) in currentApproval.after" :key="i" class="cmp-line after">{{ s.name }}：{{ s.ratio }}% | 认缴 {{ s.subscribed }} 万元 | 实缴 {{ s.paid }} 万元</div>
          </div>
        </div>
        <div class="detail-grid" style="margin-top:12px">
          <div class="cell"><div class="label">变更标题</div><div class="value">{{ currentApproval.title }}</div></div>
          <div class="cell"><div class="label">变更类型</div><div class="value">{{ currentApproval.type }}</div></div>
          <div class="cell"><div class="label">审批状态</div><div class="value"><el-tag size="small" :type="currentApproval.status === '已通过' ? 'success' : currentApproval.status === '审批中' ? 'warning' : 'danger'">{{ currentApproval.status }}</el-tag></div></div>
          <div class="cell"><div class="label">变更原因</div><div class="value">{{ currentApproval.reason }}</div></div>
          <div class="cell"><div class="label">变更内容</div><div class="value">{{ currentApproval.content }}</div></div>
          <div class="cell"><div class="label">完成时间</div><div class="value">{{ currentApproval.finishTime || '—' }}</div></div>
          <div class="cell"><div class="label">附件</div><div class="value"><div class="thumb" :title="currentApproval.attach"><el-icon><Picture /></el-icon></div></div></div>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="showWoApproval" title="核销审批详情" size="680px">
      <template v-if="currentWo">
        <div class="section-title">股权核销对比</div>
        <div class="cmp-block">
          <div class="cmp-col">
            <div class="cmp-head">核销前</div>
            <div v-for="(s, i) in currentWo.before" :key="i" class="cmp-line before" :class="{ removed: s.removed }">{{ s.name }}：{{ s.ratio }}% | 认缴 {{ s.subscribed }} 万元 | 实缴 {{ s.paid }} 万元</div>
          </div>
          <div class="cmp-arrow">→</div>
          <div class="cmp-col">
            <div class="cmp-head">核销后</div>
            <div v-for="(s, i) in currentWo.after" :key="i" class="cmp-line after">{{ s.name }}：{{ s.ratio }}% | 认缴 {{ s.subscribed }} 万元 | 实缴 {{ s.paid }} 万元</div>
            <div v-if="!currentWo.after.length" class="cmp-line" style="color:var(--t-weak)">该股东股权已全部核销</div>
          </div>
        </div>
        <div class="detail-grid" style="margin-top:12px">
          <div class="cell"><div class="label">股权名称</div><div class="value">{{ currentWo.equity }}</div></div>
          <div class="cell"><div class="label">核销标题</div><div class="value">{{ currentWo.title }}</div></div>
          <div class="cell"><div class="label">核销金额</div><div class="value hl">{{ currentWo.amount }} 万元</div></div>
          <div class="cell"><div class="label">状态</div><div class="value"><el-tag size="small" :type="currentWo.status === '已通过' ? 'success' : 'danger'">{{ currentWo.status }}</el-tag></div></div>
          <div class="cell"><div class="label">创建时间</div><div class="value">{{ currentWo.createTime }}</div></div>
          <div class="cell"><div class="label">完成时间</div><div class="value">{{ currentWo.finishTime || '—' }}</div></div>
          <div class="cell"><div class="label">核销原因</div><div class="value">{{ currentWo.reason }}</div></div>
          <div class="cell"><div class="label">附件</div><div class="value"><div class="thumb" :title="currentWo.attach"><el-icon><Picture /></el-icon></div></div></div>
        </div>
        <div class="section-title">审核步骤</div>
        <el-timeline>
          <el-timeline-item v-for="(s, i) in currentWo.steps" :key="i" :timestamp="s.time" type="primary">
            <div style="font-size:13px">审批级别：{{ s.level }}</div>
            <div style="font-size:13px">审核人：{{ s.auditor }}</div>
            <div style="font-size:13px">审核时间：{{ s.time }}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
              <div class="thumb" :title="s.attach"><el-icon><Picture /></el-icon></div>
              <span style="font-size:12px;color:var(--t-sub)">{{ s.attach }}</span>
              <el-button type="primary" link size="small" :icon="Download" @click="downloadAttach(s.attach)">下载</el-button>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>

    <el-dialog v-model="showWoSave" title="新增股权核销" width="560px">
      <el-form :model="woForm" label-width="130px">
        <el-form-item label="股权名称" required>
          <el-select v-model="woForm.equity" filterable style="width:100%" placeholder="请选择股权">
            <el-option v-for="r in regList" :key="r.id" :label="r.name" :value="r.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销标题" required>
          <el-input v-model="woForm.title" placeholder="请输入核销标题" />
        </el-form-item>
        <el-form-item label="核销金额(万元)" required>
          <el-input-number v-model="woForm.amount" :min="0.01" :step="10" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="核销原因">
          <el-input v-model="woForm.reason" type="textarea" :rows="2" placeholder="请输入核销原因" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :limit="3">
            <el-button size="small" type="primary">上传附件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showWoSave = false">取消</el-button>
        <el-button type="primary" @click="submitWoSave">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Picture, MoreFilled } from '@element-plus/icons-vue'
import { useSpecialAssetStore, EQ_MAINTAIN_KEYS, EQ_MAINTAIN_LABELS } from '../../store/specialAsset'

const store = useSpecialAssetStore()
const {
  equityCompanies: companies,
  equityChangeRecords: changeRecords,
  equityPledges: pledgeRecords,
  equityWriteoffs: woList,
  equityRegList: regList,
  totalInvest,
  totalEquity,
  totalDividend,
} = storeToRefs(store)

/** store 统一返回 { ok, msg }：校验与留痕都在 store 内完成 */
function feedback(res) {
  if (!res) return false
  ElMessage({ type: res.ok ? 'success' : 'error', message: res.msg })
  return res.ok
}

const showCompanyDrawer = ref(false)
const showCompanyDialog = ref(false)
const showChangeDialog = ref(false)
const showChangeDetail = ref(false)
const showDividendDialog = ref(false)
const showPledgeDialog = ref(false)
const currentCompany = ref(null)
const currentChange = ref(null)

const maintainCompanyId = ref(1)
const maintainTab = ref('report')
const maintainCompany = computed(() => store.findCompany(maintainCompanyId.value))

const sortedReports = computed(() => [...(maintainCompany.value?.reports || [])].sort((a, b) => Number(b.year) - Number(a.year)))
const latestReport = computed(() => sortedReports.value[0] || null)
const profitYoy = computed(() => {
  const [cur, prev] = sortedReports.value
  if (!cur || !prev || !prev.netProfit) return null
  return Math.round((cur.netProfit - prev.netProfit) / Math.abs(prev.netProfit) * 1000) / 10
})

function debtRatio(report) {
  if (!report.totalAssets) return '0.00'
  return (report.totalLiabilities / report.totalAssets * 100).toFixed(2)
}

const oursCount = computed(() => (maintainCompany.value?.executives || []).filter(e => e.ours).length)
const writeOffTotal = computed(() => Math.round((maintainCompany.value?.writeOffs || []).reduce((s, w) => s + w.amount, 0) * 100) / 100)
const writeOffMax = computed(() => Math.max(maintainCompany.value?.equityValue || 0, 0.01))

const reportYearOptions = computed(() => {
  const now = new Date().getFullYear()
  const years = []
  for (let y = now + 1; y >= now - 5; y--) years.push(String(y))
  return years
})

const maintainDialog = ref({ visible: false, type: 'report', index: -1, data: {} })
const maintainDialogTitle = computed(() =>
  `${maintainDialog.value.index > -1 ? '编辑' : '新增'}${EQ_MAINTAIN_LABELS[maintainDialog.value.type]}`
)

function blankMaintain(type) {
  const today = new Date().toISOString().slice(0, 10)
  if (type === 'report') return { year: String(new Date().getFullYear() - 1), revenue: 0, netProfit: 0, totalAssets: 0, totalLiabilities: 0, auditor: '', opinion: '标准无保留' }
  if (type === 'exec') return { name: '', position: '董事', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: today, endDate: '', phone: '' }
  if (type === 'work') return { date: today, recorder: '', subject: '', progress: '', nextStep: '' }
  if (type === 'meeting') return { name: '', time: '', place: '', attendees: '', topic: '', resolution: '' }
  return { year: String(new Date().getFullYear()), amount: 0, reason: '', source: '减值准备', approver: '' }
}

function openMaintain(type, index = -1) {
  const list = maintainCompany.value?.[EQ_MAINTAIN_KEYS[type]] || []
  maintainDialog.value = {
    visible: true,
    type,
    index,
    data: index > -1 ? { ...list[index] } : blankMaintain(type)
  }
}

const maintainRequired = {
  report: [['year', '报告年度'], ['revenue', '营业收入'], ['totalAssets', '资产总额']],
  exec: [['name', '姓名'], ['position', '职务'], ['appointer', '委派方'], ['startDate', '任职开始日期']],
  work: [['date', '日期'], ['recorder', '记录人'], ['subject', '事项'], ['progress', '进展情况']],
  meeting: [['name', '会议名称'], ['time', '会议时间'], ['attendees', '参与人'], ['topic', '议题'], ['resolution', '决议']],
  writeoff: [['year', '核销年度'], ['amount', '核销金额'], ['reason', '核销原因'], ['source', '资金来源/科目'], ['approver', '审批人']]
}

function nowStamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function saveMaintain() {
  const c = maintainCompany.value
  if (!c) {
    ElMessage.warning('请先选择参股企业')
    return
  }
  const { type, index, data } = maintainDialog.value
  for (const [key, label] of maintainRequired[type]) {
    if (data[key] === '' || data[key] === null || data[key] === undefined) {
      ElMessage.warning(`请填写${label}`)
      return
    }
  }
  if (type === 'writeoff') {
    ElMessageBox.confirm(
      `确认核销"${c.name}"股权 ${data.amount} 万元？核销后权益价值由 ${c.equityValue.toLocaleString()} 万元降为 ${(c.equityValue - data.amount).toLocaleString()} 万元。`,
      '股权核销确认',
      { type: 'warning' }
    ).then(() => {
      if (feedback(store.saveMaintain(c.id, type, data, index))) maintainDialog.value.visible = false
    }).catch(() => {})
    return
  }
  if (feedback(store.saveMaintain(c.id, type, data, index))) maintainDialog.value.visible = false
}

function removeMaintain(type, index) {
  const c = maintainCompany.value
  if (!c) return
  const list = c[EQ_MAINTAIN_KEYS[type]] || []
  const row = list[index]
  if (!row) return
  const label = type === 'report' ? `${row.year} 年度财务报告` : row.name || row.subject || row.date
  ElMessageBox.confirm(`确认删除${EQ_MAINTAIN_LABELS[type]}"${label}"？`, '删除确认', { type: 'warning' }).then(() => {
    feedback(store.removeMaintain(c.id, type, index))
  }).catch(() => {})
}

function gotoMaintain(row) {
  maintainCompanyId.value = row.id
  maintainTab.value = 'report'
  document.querySelector('.card-head')?.closest('.el-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function exportReports() {
  const c = maintainCompany.value
  if (!c?.reports.length) {
    ElMessage.warning(`${c?.name || '该企业'}暂无年度财务报告可导出`)
    return
  }
  const head = ['企业名称', '年度', '营业收入(万元)', '净利润(万元)', '资产总额(万元)', '负债总额(万元)', '资产负债率(%)', '审计机构', '审计意见']
  const lines = sortedReports.value.map(r => [c.name, r.year, r.revenue, r.netProfit, r.totalAssets, r.totalLiabilities, debtRatio(r), r.auditor, r.opinion])
  const csv = '\ufeff' + [head, ...lines].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.name}-年度财务报告.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${lines.length} 条年度财务报告`)
}

function viewCompany(row) {
  currentCompany.value = row
  showCompanyDrawer.value = true
}

function onCompanyCommand(cmd, row) {
  if (cmd === 'maintain') gotoMaintain(row)
  else if (cmd === 'change') openChange(row)
  else if (cmd === 'dividend') recordDividend(row)
  else if (cmd === 'pledge') pledgeEquity(row)
}

/* ==================== 参股企业登记 ==================== */
const companyForm = ref({})
function openCompanyDialog() {
  companyForm.value = { name: '', creditCode: '', legalPerson: '', industry: '城市建设', regCapital: 0, investAmount: 0, investDate: '' }
  showCompanyDialog.value = true
}

function saveCompany() {
  if (feedback(store.saveCompany(companyForm.value))) showCompanyDialog.value = false
}

/* ==================== 股权变更 ==================== */
const changeForm = ref({})
function openChange(row) {
  currentCompany.value = row
  changeForm.value = { type: '增资扩股', afterAmount: row.investAmount, reason: '' }
  showChangeDialog.value = true
}

function submitChange() {
  const c = currentCompany.value
  if (!c) return
  if (feedback(store.submitChange(c.id, changeForm.value))) showChangeDialog.value = false
}

function viewChange(row) {
  currentChange.value = row
  showChangeDetail.value = true
}

function approveChange(row) {
  ElMessageBox.confirm(`确认通过"${row.company}"的${row.type}申请？通过后变更即时生效。`, '变更审批', { type: 'warning' }).then(() => {
    if (feedback(store.approveChange(changeRecords.value.indexOf(row)))) showChangeDetail.value = false
  }).catch(() => {})
}

/* ==================== 分红登记 ==================== */
const dividendForm = ref({})
function recordDividend(row) {
  currentCompany.value = row
  dividendForm.value = { year: '2026', amount: 0 }
  showDividendDialog.value = true
}

function submitDividend() {
  const c = currentCompany.value
  if (!c) return
  if (feedback(store.submitDividend(c.id, dividendForm.value))) showDividendDialog.value = false
}

/* ==================== 质押 / 冻结 ==================== */
const pledgeForm = ref({})
function pledgeEquity(row) {
  currentCompany.value = row
  pledgeForm.value = { type: '质押', ratio: row.holdRatio, counterparty: '', startDate: new Date().toISOString().slice(0, 10) }
  showPledgeDialog.value = true
}

function submitPledge() {
  const c = currentCompany.value
  if (!c) return
  if (feedback(store.submitPledge(c.id, pledgeForm.value))) showPledgeDialog.value = false
}

function releasePledge(row) {
  ElMessageBox.confirm(`确认解除"${row.company}"的${row.type}（${row.ratio}%）？`, '解除确认', { type: 'warning' }).then(() => {
    feedback(store.releasePledge(pledgeRecords.value.indexOf(row)))
  }).catch(() => {})
}

/* ==================== 股权登记 / 核销 ==================== */
const eqTab = ref('reg')

const regFilter = reactive({ company: '' })
const regQuery = reactive({ company: '' })
const regPage = ref(1)
const regSize = ref(15)
const regCompanyOptions = computed(() => [...new Set(regList.value.map(r => r.name))])
function doRegSearch() {
  Object.assign(regQuery, regFilter)
  regPage.value = 1
}
const filteredRegs = computed(() => regList.value.filter(r => !regQuery.company || r.name === regQuery.company))
const pagedRegs = computed(() => filteredRegs.value.slice((regPage.value - 1) * regSize.value, regPage.value * regSize.value))

const woFilter = reactive({ keyword: '' })
const woQuery = reactive({ keyword: '' })
const woPage = ref(1)
const woSize = ref(15)
function doWoSearch() {
  Object.assign(woQuery, woFilter)
  woPage.value = 1
}
const filteredWos = computed(() => woList.value.filter(w => !woQuery.keyword || w.equity.includes(woQuery.keyword) || w.title.includes(woQuery.keyword)))
const pagedWos = computed(() => filteredWos.value.slice((woPage.value - 1) * woSize.value, woPage.value * woSize.value))

const showEqSave = ref(false)
const eqForm = ref({})
function openEqSave() {
  eqForm.value = { name: '', legalPerson: '', estDate: '', approveDate: '', regOrg: '', regStatus: '在营（开业）', term: [], scope: '', address: '', contact: '', shareholders: [{ name: '', subscribed: 0, paid: 0, ratio: 0 }] }
  showEqSave.value = true
}
function addEqHolder() {
  eqForm.value.shareholders.push({ name: '', subscribed: 0, paid: 0, ratio: 0 })
}
function submitEqSave() {
  if (feedback(store.submitEqSave(eqForm.value))) showEqSave.value = false
}

const showRegDetail = ref(false)
const currentReg = ref(null)
const regTab = ref('exec')
const innerPage = reactive({ exec: 1, meeting: 1, report: 1, fin: 1, change: 1, wo: 1 })
const innerSize = ref(5)
const innerRows = (key, rows) => (rows || []).slice((innerPage[key] - 1) * innerSize.value, innerPage[key] * innerSize.value)
function viewReg(row, tab = 'exec') {
  currentReg.value = row
  regTab.value = tab
  Object.keys(innerPage).forEach(k => { innerPage[k] = 1 })
  showRegDetail.value = true
}
function onRegCommand(cmd, row) {
  viewReg(row, cmd)
}
const regWriteoffs = computed(() => woList.value.filter(w => w.equity === (currentReg.value && currentReg.value.name)))

const showChangeApproval = ref(false)
const currentApproval = ref(null)
function openChangeApproval(row) {
  currentApproval.value = row
  showChangeApproval.value = true
}

const showWoApproval = ref(false)
const currentWo = ref(null)
function openWoApproval(row) {
  currentWo.value = row
  showWoApproval.value = true
}

function downloadAttach(name) {
  const lines = [
    `附件名称：${name}`,
    `下载时间：${nowStamp()}`,
    `来源：股权核销审批附件`,
    `说明：此文件为系统自动生成的附件信息记录`,
  ]
  const content = '\uFEFF' + lines.join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `附件信息_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`《${name}》已下载`)
}

const showWoSave = ref(false)
const woForm = ref({})
function openWoSave() {
  woForm.value = { equity: '', title: '', amount: 0, reason: '' }
  showWoSave.value = true
}
function submitWoSave() {
  if (feedback(store.submitWoSave(woForm.value))) showWoSave.value = false
}
</script>

<style scoped>
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-count {
  display: inline-block;
  margin-left: 4px;
  padding: 0 5px;
  border-radius: var(--r-md);
  background: var(--bg-page);
  color: var(--t-sub);
  font-size: 12px;
  line-height: 16px;
}

.pane-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pane-tip {
  color: var(--t-sub);
  font-size: 12px;
}

.expand-block {
  padding: 8px 24px;
  color: var(--t-sub);
  font-size: 13px;
  line-height: 1.8;
}

.area-hint {
  color: var(--t-weak);
  font-size: 12px;
  line-height: 1.6;
}

.thumb {
  width: 40px;
  height: 40px;
  border: 1px solid var(--bd);
  background: var(--bg-page);
  border-radius: var(--r-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--t-weak);
  font-size: 18px;
  cursor: pointer;
}

.thumb:hover {
  color: var(--c-primary);
  border-color: var(--c-primary);
}

.cmp-block {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.cmp-col {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  padding: 12px;
  background: var(--bg-page);
}

.cmp-head {
  font-weight: 600;
  font-size: 13px;
  color: var(--t-main);
  margin-bottom: 8px;
}

.cmp-arrow {
  align-self: center;
  color: var(--c-primary);
  font-size: 20px;
  font-weight: 700;
}

.cmp-line {
  font-size: 12px;
  line-height: 1.9;
  word-break: break-all;
}

.cmp-line.before {
  color: var(--c-success);
}

.cmp-line.after {
  color: var(--c-warning);
}

.cmp-line.removed {
  text-decoration: line-through;
  color: var(--c-danger);
}
</style>
