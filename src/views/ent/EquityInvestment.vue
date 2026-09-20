<template>
  <div class="page-container">
    <div class="page-header">
      <h2>长期股权投资</h2>
      <span class="page-subtitle">参股企业 · 股东结构 · 变更审批</span>
    </div>

    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#1890ff">{{ companies.length }}</div>
          <div class="kpi-label">参股企业(家)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#52c41a">{{ totalInvest }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">投资总额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#fa8c16">{{ totalEquity }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">权益账面价值</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-value" style="color:#722ed1">{{ totalDividend }}<span class="kpi-unit">万元</span></div>
          <div class="kpi-label">本年分红</div>
        </el-card>
      </el-col>
    </el-row>

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
            <div style="padding:8px 40px">
              <div class="detail-grid" style="margin-bottom:10px">
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

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
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
      </el-col>
      <el-col :span="12">
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
                <span v-else style="color:#999;font-size:12px">已解除</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top:16px">
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
                  <span :style="{ color: row.netProfit >= 0 ? '#52c41a' : '#f56c6c' }">{{ row.netProfit.toLocaleString() }}</span>
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
                  <span style="color:#f56c6c">-{{ row.amount.toLocaleString() }}</span>
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

    <el-card shadow="never" style="margin-top:16px">
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
            <el-pagination v-model:current-page="regPage" v-model:page-size="regSize" :total="filteredRegs.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="regPage = 1" />
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
              <template #default="{ row }"><span style="color:#f56c6c">-{{ row.amount.toLocaleString() }}</span></template>
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
            <el-pagination v-model:current-page="woPage" v-model:page-size="woSize" :total="filteredWos.length" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="woPage = 1" />
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
        <el-table :data="currentReg.shareholders" border size="small" style="margin-bottom:14px">
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
                <template #default="{ row }"><span :style="{ color: row.netProfit >= 0 ? '#52c41a' : '#f56c6c' }">{{ row.netProfit.toLocaleString() }}</span></template>
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
                <template #default="{ row }"><span style="color:#f56c6c">-{{ row.amount.toLocaleString() }}</span></template>
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
        <div class="detail-grid" style="margin-top:14px">
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
            <div v-if="!currentWo.after.length" class="cmp-line" style="color:#999">该股东股权已全部核销</div>
          </div>
        </div>
        <div class="detail-grid" style="margin-top:14px">
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
              <span style="font-size:12px;color:#666">{{ s.attach }}</span>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Download, Picture, MoreFilled } from '@element-plus/icons-vue'

const showCompanyDrawer = ref(false)
const showCompanyDialog = ref(false)
const showChangeDialog = ref(false)
const showChangeDetail = ref(false)
const showDividendDialog = ref(false)
const showPledgeDialog = ref(false)
const currentCompany = ref(null)
const currentChange = ref(null)

const companies = ref([
  {
    id: 1, name: '长乐城投建设有限公司', creditCode: '91350112MA32XXXX8F', legalPerson: '郑建国', industry: '城市建设', regCapital: 20000, investAmount: 12000, holdRatio: 60, equityValue: 13200, investDate: '2020-06-18', dividend: 480, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 12000, ratio: 60, way: '货币', paidDate: '2020-06-18' },
      { name: '福建省城市建设发展基金', amount: 5000, ratio: 25, way: '货币', paidDate: '2020-08-01' },
      { name: '长乐区交通建设投资集团', amount: 3000, ratio: 15, way: '实物', paidDate: '2021-01-15' },
    ],
    reports: [
      { year: '2025', revenue: 68200, netProfit: 4180, totalAssets: 152000, totalLiabilities: 86500, auditor: '福建华兴会计师事务所', opinion: '标准无保留' },
      { year: '2024', revenue: 61500, netProfit: 3560, totalAssets: 141800, totalLiabilities: 82300, auditor: '福建华兴会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '郑建国', position: '董事长', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2020-06-18', endDate: '', phone: '13905912001' },
      { name: '王芳', position: '财务负责人', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2021-03-01', endDate: '', phone: '13905912002' },
      { name: '李国强', position: '总经理', appointer: '福建省城市建设发展基金', ours: false, startDate: '2022-05-10', endDate: '', phone: '13905912003' },
    ],
    workNotes: [
      { date: '2026-08-20', recorder: '赵磊', subject: '跟进滨海新城道路 PPP 项目回款', progress: '区财政已拨付第三期可行性缺口补助 4200 万元，剩余 1800 万元待年底结算', nextStep: '9 月底前完成结算资料报送' },
    ],
    meetings: [
      { name: '2026年第一次董事会', time: '2026-03-18 09:30', place: '城投集团 8 楼会议室', attendees: '郑建国、王芳、李国强、陈志明', topic: '审议 2025 年度财务决算与 2026 年度投资计划', resolution: '通过 2025 年度决算报告；批准 2026 年度投资计划 3.2 亿元，其中股权投资不超过 5000 万元' },
    ],
    writeOffs: [],
    approvalSteps: []
  },
  {
    id: 2, name: '长乐区鑫源物业服务有限公司', creditCode: '91350112MAXXXX3Q2N', legalPerson: '陈明', industry: '物业管理', regCapital: 500, investAmount: 175, holdRatio: 35, equityValue: 210, investDate: '2022-09-10', dividend: 42, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 175, ratio: 35, way: '货币', paidDate: '2022-09-10' },
      { name: '陈明', amount: 200, ratio: 40, way: '货币', paidDate: '2022-09-05' },
      { name: '福州榕城社区服务集团', amount: 125, ratio: 25, way: '货币', paidDate: '2022-09-20' },
    ],
    reports: [
      { year: '2025', revenue: 3860, netProfit: 268, totalAssets: 2450, totalLiabilities: 1180, auditor: '福州明信会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '陈明', position: '总经理', appointer: '自然人股东', ours: false, startDate: '2022-09-05', endDate: '', phone: '13905913001' },
      { name: '刘敏', position: '监事', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2022-10-08', endDate: '', phone: '13905913002' },
    ],
    workNotes: [
      { date: '2026-07-15', recorder: '刘敏', subject: '核查保障房小区物业费收缴情况', progress: '首占新区保障房片区收缴率 82%，低于公司平均 91%，已督促张贴催缴公告', nextStep: '8 月底复查收缴率，未达标提请股东会审议' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-04-22 14:00', place: '鑫源物业会议室', attendees: '陈明、刘敏、榕城社区服务集团代表', topic: '审议 2025 年度利润分配方案', resolution: '按持股比例分配利润 120 万元，其中国资方 42 万元；提取盈余公积 30 万元' },
    ],
    writeOffs: [],
    approvalSteps: []
  },
  {
    id: 3, name: '福建海峡新能源科技有限公司', creditCode: '91350100MAXXXX7T5D', legalPerson: '王海涛', industry: '新能源', regCapital: 5000, investAmount: 1000, holdRatio: 20, equityValue: 1150, investDate: '2024-03-28', dividend: 30, status: '变更中',
    shareholders: [
      { name: '王海涛', amount: 2500, ratio: 50, way: '货币+技术', paidDate: '2023-12-01' },
      { name: '长乐区国有资产投资经营有限公司', amount: 1000, ratio: 20, way: '货币', paidDate: '2024-03-28' },
      { name: '平潭综合实验区投资集团', amount: 1500, ratio: 30, way: '货币', paidDate: '2024-01-10' },
    ],
    reports: [
      { year: '2025', revenue: 12600, netProfit: -380, totalAssets: 18900, totalLiabilities: 12400, auditor: '厦门天健会计师事务所', opinion: '带强调事项段' },
      { year: '2024', revenue: 9800, netProfit: 420, totalAssets: 15200, totalLiabilities: 8600, auditor: '厦门天健会计师事务所', opinion: '标准无保留' },
    ],
    executives: [
      { name: '王海涛', position: '董事长', appointer: '自然人股东', ours: false, startDate: '2023-12-01', endDate: '', phone: '13905914001' },
      { name: '赵磊', position: '董事', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2024-04-15', endDate: '', phone: '13905914002' },
    ],
    workNotes: [
      { date: '2026-09-05', recorder: '赵磊', subject: '增资扩股事项跟进', progress: '投委会已通过追加投资 500 万元议案，等待区国资办备案', nextStep: '备案完成后办理工商变更并回写持股信息' },
      { date: '2026-06-12', recorder: '赵磊', subject: '核查光伏组件产线经营情况', progress: '2025 年受组件价格下行影响亏损 380 万元，2026 年上半年已扭亏为盈 120 万元', nextStep: '关注应收账款回收，必要时计提减值' },
    ],
    meetings: [
      { name: '2026年第二次董事会', time: '2026-08-28 15:00', place: '海峡新能源 3 楼会议室', attendees: '王海涛、赵磊、平潭投资集团代表', topic: '审议光伏组件产线扩建及增资扩股方案', resolution: '同意按股比增资 500 万元用于二期产线，国资方持股比例调整为 23.08%，报区国资办备案' },
    ],
    writeOffs: [],
    approvalSteps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-09-01 10:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2026-09-08 15:30', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '', status: '进行中' },
    ]
  },
  {
    id: 4, name: '长乐文旅发展有限公司', creditCode: '91350112MAXXXX9K3P', legalPerson: '林芳', industry: '文化旅游', regCapital: 3000, investAmount: 900, holdRatio: 30, equityValue: 860, investDate: '2023-05-16', dividend: 0, status: '正常',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', amount: 900, ratio: 30, way: '货币', paidDate: '2023-05-16' },
      { name: '福建滨海旅游投资集团', amount: 2100, ratio: 70, way: '货币', paidDate: '2023-05-10' },
    ],
    reports: [
      { year: '2025', revenue: 2140, netProfit: -620, totalAssets: 5800, totalLiabilities: 3900, auditor: '福州明信会计师事务所', opinion: '保留意见' },
    ],
    executives: [
      { name: '林芳', position: '董事长', appointer: '福建滨海旅游投资集团', ours: false, startDate: '2023-05-16', endDate: '', phone: '13905915001' },
      { name: '周琳', position: '财务负责人', appointer: '长乐区国有资产投资经营有限公司', ours: true, startDate: '2023-08-01', endDate: '', phone: '13905915002' },
    ],
    workNotes: [
      { date: '2026-05-20', recorder: '周琳', subject: '文旅项目一期减值测试', progress: '滨海营地项目客流量低于可研预期 45%，2025 年亏损 620 万元，已计提长期股权投资减值准备 40 万元', nextStep: '提请股东会审议二期暂缓投资' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-05-28 10:00', place: '文旅公司会议室', attendees: '林芳、周琳、滨海旅游投资集团代表', topic: '审议 2025 年度决算与二期投资计划', resolution: '确认 2025 年度亏损 620 万元，不进行利润分配；二期投资暂缓，待客流恢复后重新评估' },
    ],
    writeOffs: [
      { year: '2025', amount: 40, reason: '滨海营地项目一期持续亏损，按减值测试结果核销长期股权投资', source: '减值准备', approver: '区国资办 林主任', approveTime: '2025-12-28 16:20' },
    ],
    approvalSteps: []
  },
])

const changeRecords = ref([
  { company: '福建海峡新能源科技有限公司', type: '增资扩股', before: '出资 1000 万元（20%）', after: '出资 1500 万元（23.08%）', reason: '标的公司扩建光伏组件产线，按股比追加投资', applyDate: '2026-09-01', status: '审批中',
    steps: [
      { name: '提交申请', handler: '经办人：赵磊', time: '2026-09-01 10:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2026-09-08 15:30', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '', status: '进行中' },
    ] },
  { company: '长乐城投建设有限公司', type: '股权转让', before: '持股 60%', after: '持股 51%', reason: '引入省城投战略投资者，划转 9% 股权', applyDate: '2025-11-20', status: '已生效',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2025-11-20 09:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2025-12-02 14:00', status: '已完成' },
      { name: '国资委备案', handler: '区国资办', time: '2025-12-20 16:00', status: '已完成' },
    ] },
  { company: '长乐文旅发展有限公司', type: '减资', before: '出资 1200 万元（40%）', after: '出资 900 万元（30%）', reason: '文旅项目一期收缩，按章程减资', applyDate: '2025-06-15', status: '已驳回',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: '2025-06-15 11:00', status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '2025-07-01 10:30', status: '已完成' },
    ] },
])

const pledgeRecords = ref([
  { company: '长乐城投建设有限公司', type: '质押', ratio: 15, counterparty: '工商银行长乐支行', startDate: '2025-03-10', status: '生效中' },
  { company: '长乐区鑫源物业服务有限公司', type: '质押', ratio: 35, counterparty: '兴业银行福州分行', startDate: '2024-05-20', status: '已解除' },
])

const totalInvest = computed(() => companies.value.reduce((s, c) => s + c.investAmount, 0).toFixed(0))
const totalEquity = computed(() => companies.value.reduce((s, c) => s + c.equityValue, 0).toFixed(0))
const totalDividend = computed(() => companies.value.reduce((s, c) => s + c.dividend, 0).toFixed(0))

const maintainCompanyId = ref(1)
const maintainTab = ref('report')
const maintainCompany = computed(() => companies.value.find(c => c.id === maintainCompanyId.value) || null)

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
const maintainTitles = { report: '年度财务报告', exec: '高管信息', work: '工作纪要', meeting: '会议纪要', writeoff: '股权核销登记' }
const maintainKeys = { report: 'reports', exec: 'executives', work: 'workNotes', meeting: 'meetings', writeoff: 'writeOffs' }
const maintainDialogTitle = computed(() =>
  `${maintainDialog.value.index > -1 ? '编辑' : '新增'}${maintainTitles[maintainDialog.value.type]}`
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
  const list = maintainCompany.value?.[maintainKeys[type]] || []
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
  if (!c) return
  const { type, index, data } = maintainDialog.value
  for (const [key, label] of maintainRequired[type]) {
    if (data[key] === '' || data[key] === null || data[key] === undefined) {
      ElMessage.warning(`请填写${label}`)
      return
    }
  }
  const list = c[maintainKeys[type]]

  if (type === 'writeoff') {
    if (data.amount > c.equityValue) {
      ElMessage.error(`核销金额 ${data.amount} 万元超出当前权益价值 ${c.equityValue.toLocaleString()} 万元`)
      return
    }
    ElMessageBox.confirm(
      `确认核销"${c.name}"股权 ${data.amount} 万元？核销后权益价值由 ${c.equityValue.toLocaleString()} 万元降为 ${(c.equityValue - data.amount).toLocaleString()} 万元。`,
      '股权核销确认',
      { type: 'warning' }
    ).then(() => {
      list.push({ ...data, approveTime: nowStamp() })
      c.equityValue = Math.round((c.equityValue - data.amount) * 100) / 100
      maintainDialog.value.visible = false
      ElMessage.success(`核销已登记，${c.name} 权益价值调整为 ${c.equityValue.toLocaleString()} 万元`)
    }).catch(() => {})
    return
  }

  if (type === 'report') {
    const dup = list.findIndex(r => r.year === data.year)
    if (dup > -1 && dup !== index) {
      ElMessage.error(`${data.year} 年度财务报告已存在，请直接编辑该条记录`)
      return
    }
    if (data.totalLiabilities > data.totalAssets) {
      ElMessage.error('负债总额不应超过资产总额')
      return
    }
  }

  if (index > -1) {
    list[index] = { ...list[index], ...data }
    ElMessage.success(`${maintainTitles[type]}已更新`)
  } else {
    list.unshift({ ...data })
    ElMessage.success(`${maintainTitles[type]}已新增`)
  }
  maintainDialog.value.visible = false
}

function removeMaintain(type, index) {
  const c = maintainCompany.value
  const list = c[maintainKeys[type]]
  const row = list[index]
  const label = type === 'report' ? `${row.year} 年度财务报告` : row.name || row.subject || row.date
  ElMessageBox.confirm(`确认删除${maintainTitles[type]}"${label}"？`, '删除确认', { type: 'warning' }).then(() => {
    list.splice(index, 1)
    ElMessage.success('已删除')
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

const companyForm = ref({})
function openCompanyDialog() {
  companyForm.value = { name: '', creditCode: '', legalPerson: '', industry: '城市建设', regCapital: 0, investAmount: 0, investDate: '' }
  showCompanyDialog.value = true
}

function saveCompany() {
  const f = companyForm.value
  if (!f.name || !f.creditCode || !f.regCapital || !f.investAmount) {
    ElMessage.warning('请填写完整的企业信息')
    return
  }
  companies.value.push({
    id: companies.value.reduce((m, c) => Math.max(m, c.id), 0) + 1,
    name: f.name, creditCode: f.creditCode, legalPerson: f.legalPerson || '—', industry: f.industry,
    regCapital: f.regCapital, investAmount: f.investAmount,
    holdRatio: f.regCapital ? +((f.investAmount / f.regCapital) * 100).toFixed(2) : 0,
    equityValue: f.investAmount, investDate: f.investDate || new Date().toISOString().slice(0, 10),
    dividend: 0, status: '正常',
    shareholders: [{ name: '长乐区国有资产投资经营有限公司', amount: f.investAmount, ratio: f.regCapital ? +((f.investAmount / f.regCapital) * 100).toFixed(2) : 0, way: '货币', paidDate: f.investDate || new Date().toISOString().slice(0, 10) }],
    reports: [], executives: [], workNotes: [], meetings: [], writeOffs: [],
    approvalSteps: []
  })
  showCompanyDialog.value = false
  ElMessage.success('参股企业已登记')
}

const changeForm = ref({})
function openChange(row) {
  currentCompany.value = row
  changeForm.value = { type: '增资扩股', afterAmount: row.investAmount, reason: '' }
  showChangeDialog.value = true
}

function submitChange() {
  const c = currentCompany.value
  const f = changeForm.value
  if (!f.reason) {
    ElMessage.warning('请填写变更原因')
    return
  }
  const newReg = c.regCapital + (f.afterAmount - c.investAmount)
  const newRatio = newReg > 0 ? +((f.afterAmount / newReg) * 100).toFixed(2) : 0
  changeRecords.value.unshift({
    company: c.name, type: f.type,
    before: `出资 ${c.investAmount} 万元（${c.holdRatio}%）`,
    after: `出资 ${f.afterAmount} 万元（${newRatio}%）`,
    reason: f.reason,
    applyDate: new Date().toISOString().slice(0, 10),
    status: '审批中',
    steps: [
      { name: '提交申请', handler: '经办人：王芳', time: nowStamp(), status: '已完成' },
      { name: '投资决策委员会', handler: '投委会', time: '', status: '进行中' },
      { name: '国资委备案', handler: '区国资办', time: '', status: '未开始' },
    ],
    pending: { companyId: c.id, afterAmount: f.afterAmount, newReg, newRatio }
  })
  c.status = '变更中'
  showChangeDialog.value = false
  ElMessage.success('变更申请已提交，等待投资决策委员会审议')
}

function viewChange(row) {
  currentChange.value = row
  showChangeDetail.value = true
}

function approveChange(row) {
  ElMessageBox.confirm(`确认通过"${row.company}"的${row.type}申请？通过后变更即时生效。`, '变更审批', { type: 'warning' }).then(() => {
    const now = nowStamp()
    row.steps.forEach(s => { if (s.status === '进行中' || s.status === '未开始') { s.status = '已完成'; s.time = now } })
    row.status = '已生效'
    if (row.pending) {
      const c = companies.value.find(x => x.id === row.pending.companyId)
      if (c) {
        c.investAmount = row.pending.afterAmount
        c.regCapital = row.pending.newReg
        c.holdRatio = row.pending.newRatio
        c.equityValue = row.pending.afterAmount
        c.status = '正常'
        const me = c.shareholders.find(s => s.name.includes('国有资产'))
        if (me) { me.amount = row.pending.afterAmount; me.ratio = row.pending.newRatio }
      }
      delete row.pending
    }
    showChangeDetail.value = false
    ElMessage.success('变更已生效，股权信息已更新')
  }).catch(() => {})
}

const dividendForm = ref({})
function recordDividend(row) {
  currentCompany.value = row
  dividendForm.value = { year: '2026', amount: 0 }
  showDividendDialog.value = true
}

function submitDividend() {
  const c = currentCompany.value
  if (!dividendForm.value.amount) {
    ElMessage.warning('请填写分红金额')
    return
  }
  c.dividend = +(c.dividend + dividendForm.value.amount).toFixed(2)
  showDividendDialog.value = false
  ElMessage.success(`${c.name} ${dividendForm.value.year}年度分红 ${dividendForm.value.amount} 万元已登记`)
}

const pledgeForm = ref({})
function pledgeEquity(row) {
  currentCompany.value = row
  pledgeForm.value = { type: '质押', ratio: row.holdRatio, counterparty: '', startDate: new Date().toISOString().slice(0, 10) }
  showPledgeDialog.value = true
}

function submitPledge() {
  const f = pledgeForm.value
  if (!f.counterparty) {
    ElMessage.warning('请填写质权人/执行方')
    return
  }
  pledgeRecords.value.unshift({
    company: currentCompany.value.name, type: f.type, ratio: f.ratio,
    counterparty: f.counterparty, startDate: f.startDate, status: '生效中'
  })
  showPledgeDialog.value = false
  ElMessage.success(`${f.type}登记成功`)
}

function releasePledge(row) {
  ElMessageBox.confirm(`确认解除"${row.company}"的${row.type}（${row.ratio}%）？`, '解除确认', { type: 'warning' }).then(() => {
    row.status = '已解除'
    ElMessage.success('已解除登记')
  }).catch(() => {})
}

const eqTab = ref('reg')

const woList = ref([
  { id: 1, equity: '长乐文旅发展有限公司', title: '文旅项目一期减值核销', amount: 40, reason: '滨海营地项目一期持续亏损，按减值测试结果核销长期股权投资', attach: '核销审批单.pdf', status: '已通过', createTime: '2025-12-20 09:30', lastEdit: '2025-12-28 16:20', finishTime: '2025-12-28 16:20',
    before: [{ name: '长乐区国有资产投资经营有限公司', ratio: 30, subscribed: 900, paid: 900, removed: true }, { name: '福建滨海旅游投资集团', ratio: 70, subscribed: 2100, paid: 2100 }],
    after: [{ name: '福建滨海旅游投资集团', ratio: 70, subscribed: 2100, paid: 2100 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '周琳', time: '2025-12-22 10:00', attach: '财务审核意见.pdf' },
      { level: '二级审批（分管领导）', auditor: '王副总', time: '2025-12-25 14:30', attach: '审批签呈.pdf' },
      { level: '三级审批（区国资办）', auditor: '林主任', time: '2025-12-28 16:20', attach: '国资办批复.pdf' },
    ] },
  { id: 2, equity: '福建海峡新能源科技有限公司', title: '光伏组件产线减值核销申请', amount: 120, reason: '组件价格下行导致产线减值，申请核销部分股权投资', attach: '减值测试报告.pdf', status: '已拒绝', createTime: '2026-02-10 09:00', lastEdit: '2026-03-02 11:00', finishTime: '2026-03-02 11:00',
    before: [{ name: '长乐区国有资产投资经营有限公司', ratio: 20, subscribed: 1000, paid: 1000, removed: true }, { name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 }, { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 }],
    after: [{ name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 }, { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '王芳', time: '2026-02-15 10:30', attach: '财务审核意见.pdf' },
      { level: '二级审批（投资决策委员会）', auditor: '投委会', time: '2026-03-02 11:00', attach: '驳回意见书.pdf' },
    ] },
  { id: 3, equity: '长乐区鑫源物业服务有限公司', title: '保障房片区应收款坏账核销', amount: 15, reason: '物业费长期欠缴形成坏账，按程序核销对应投资权益', attach: '坏账核销审批单.pdf', status: '已通过', createTime: '2026-05-08 14:00', lastEdit: '2026-05-20 09:40', finishTime: '2026-05-20 09:40',
    before: [{ name: '陈明', ratio: 40, subscribed: 200, paid: 200, removed: true }, { name: '长乐区国有资产投资经营有限公司', ratio: 35, subscribed: 175, paid: 175 }, { name: '福州榕城社区服务集团', ratio: 25, subscribed: 125, paid: 125 }],
    after: [{ name: '长乐区国有资产投资经营有限公司', ratio: 35, subscribed: 160, paid: 160 }, { name: '福州榕城社区服务集团', ratio: 25, subscribed: 125, paid: 125 }],
    steps: [
      { level: '一级审批（财务部）', auditor: '刘敏', time: '2026-05-12 10:00', attach: '财务审核意见.pdf' },
      { level: '二级审批（区国资办）', auditor: '林主任', time: '2026-05-20 09:40', attach: '国资办批复.pdf' },
    ] },
])

const regList = ref([
  { id: 1, name: '长乐城投建设有限公司', regCapital: 20000, address: '福建省福州市长乐区航城街道会堂路158号', contact: '0591-28923001', createTime: '2020-06-18 10:20', lastEdit: '2026-08-12 15:30', legalPerson: '郑建国', estDate: '2020-06-18', approveDate: '2020-06-15', regOrg: '福州市长乐区市场监督管理局', regStatus: '在营（开业）', term: ['2020-06-18', '2050-06-17'], scope: '城市基础设施投资建设与经营、市政公用工程施工、房地产开发经营',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', subscribed: 12000, paid: 12000, ratio: 60 },
      { name: '福建省城市建设发展基金', subscribed: 5000, paid: 5000, ratio: 25 },
      { name: '长乐区交通建设投资集团', subscribed: 3000, paid: 2400, ratio: 15 },
    ],
    execs: [
      { name: '郑建国', position: '董事长', intro: '长期从事城市建设投资管理工作，主持公司全面工作', resumeFile: '郑建国简历.pdf', createTime: '2020-06-18 11:00' },
      { name: '王芳', position: '财务负责人', intro: '注册会计师，负责财务与融资管理', resumeFile: '王芳简历.pdf', createTime: '2021-03-01 09:30' },
    ],
    meetings: [
      { name: '2026年第一次董事会', time: '2026-03-18 09:30', place: '城投集团8楼会议室', attendees: '郑建国、王芳、李国强、陈志明', resolution: '通过2025年度决算报告，批准2026年度投资计划3.2亿元' },
    ],
    workReports: [
      { period: '2026年上半年', reporter: '赵磊', content: '滨海新城道路PPP项目第三期回款4200万元到账，剩余1800万元待年底结算', createTime: '2026-07-05 16:00' },
    ],
    finances: [
      { year: '2025', revenue: 68200, netProfit: 4180, totalAssets: 152000, totalLiabilities: 86500 },
      { year: '2024', revenue: 61500, netProfit: 3560, totalAssets: 141800, totalLiabilities: 82300 },
    ],
    changes: [
      { title: '股权转让变更审批', type: '股权转让', reason: '引入省城投战略投资者，划转9%股权', content: '国资持股比例由60%调整为51%', attach: '股权转让协议.pdf', status: '已通过', finishTime: '2025-12-20 16:00',
        before: [
          { name: '长乐区国有资产投资经营有限公司', ratio: 60, subscribed: 12000, paid: 12000 },
          { name: '福建省城市建设发展基金', ratio: 25, subscribed: 5000, paid: 5000 },
          { name: '长乐区交通建设投资集团', ratio: 15, subscribed: 3000, paid: 2400 },
        ],
        after: [
          { name: '长乐区国有资产投资经营有限公司', ratio: 51, subscribed: 10200, paid: 10200 },
          { name: '福建省城市建设发展基金', ratio: 25, subscribed: 5000, paid: 5000 },
          { name: '长乐区交通建设投资集团', ratio: 15, subscribed: 3000, paid: 2400 },
          { name: '省城投战略投资者', ratio: 9, subscribed: 1800, paid: 1800 },
        ] },
    ] },
  { id: 2, name: '福建海峡新能源科技有限公司', regCapital: 5000, address: '福建省福州市鼓楼区软件园C区23号楼', contact: '0591-87345002', createTime: '2024-03-28 14:00', lastEdit: '2026-09-05 10:12', legalPerson: '王海涛', estDate: '2023-12-01', approveDate: '2023-11-28', regOrg: '福州市鼓楼区市场监督管理局', regStatus: '存续', term: ['2023-12-01', '2043-11-30'], scope: '光伏组件研发、生产与销售，新能源电站投资建设',
    shareholders: [
      { name: '王海涛', subscribed: 2500, paid: 2500, ratio: 50 },
      { name: '长乐区国有资产投资经营有限公司', subscribed: 1000, paid: 1000, ratio: 20 },
      { name: '平潭综合实验区投资集团', subscribed: 1500, paid: 1500, ratio: 30 },
    ],
    execs: [
      { name: '王海涛', position: '董事长', intro: '新能源行业资深专家，主导光伏组件技术研发', resumeFile: '王海涛简历.pdf', createTime: '2023-12-01 09:00' },
      { name: '赵磊', position: '董事', intro: '国资方委派董事，负责投资监管', resumeFile: '赵磊简历.pdf', createTime: '2024-04-15 10:00' },
    ],
    meetings: [
      { name: '2026年第二次董事会', time: '2026-08-28 15:00', place: '海峡新能源3楼会议室', attendees: '王海涛、赵磊、平潭投资集团代表', resolution: '同意按股比增资500万元用于二期产线，报区国资办备案' },
    ],
    workReports: [
      { period: '2026年三季度', reporter: '赵磊', content: '增资扩股事项投委会已通过，等待区国资办备案后办理工商变更', createTime: '2026-09-05 10:00' },
    ],
    finances: [
      { year: '2025', revenue: 12600, netProfit: -380, totalAssets: 18900, totalLiabilities: 12400 },
      { year: '2024', revenue: 9800, netProfit: 420, totalAssets: 15200, totalLiabilities: 8600 },
    ],
    changes: [
      { title: '增资扩股变更审批', type: '增资扩股', reason: '扩建光伏组件二期产线，按股比追加投资', content: '国资出资由1000万元增至1500万元，持股比例调整为23.08%', attach: '增资扩股协议.pdf', status: '审批中', finishTime: '',
        before: [
          { name: '王海涛', ratio: 50, subscribed: 2500, paid: 2500 },
          { name: '长乐区国有资产投资经营有限公司', ratio: 20, subscribed: 1000, paid: 1000 },
          { name: '平潭综合实验区投资集团', ratio: 30, subscribed: 1500, paid: 1500 },
        ],
        after: [
          { name: '王海涛', ratio: 46.15, subscribed: 3000, paid: 2500 },
          { name: '长乐区国有资产投资经营有限公司', ratio: 23.08, subscribed: 1500, paid: 1000 },
          { name: '平潭综合实验区投资集团', ratio: 30.77, subscribed: 2000, paid: 1500 },
        ] },
    ] },
  { id: 3, name: '长乐文旅发展有限公司', regCapital: 3000, address: '福建省福州市长乐区吴航街道郑和中路12号', contact: '0591-28812345', createTime: '2023-05-16 09:00', lastEdit: '2026-05-28 11:30', legalPerson: '林芳', estDate: '2023-05-16', approveDate: '2023-05-12', regOrg: '福州市长乐区市场监督管理局', regStatus: '在营（开业）', term: ['2023-05-16', '2053-05-15'], scope: '文化旅游项目开发、景区运营管理、文创产品销售',
    shareholders: [
      { name: '长乐区国有资产投资经营有限公司', subscribed: 900, paid: 900, ratio: 30 },
      { name: '福建滨海旅游投资集团', subscribed: 2100, paid: 2100, ratio: 70 },
    ],
    execs: [
      { name: '林芳', position: '董事长', intro: '文旅行业经营管理经验丰富', resumeFile: '林芳简历.pdf', createTime: '2023-05-16 10:00' },
      { name: '周琳', position: '财务负责人', intro: '国资方委派财务负责人', resumeFile: '周琳简历.pdf', createTime: '2023-08-01 09:00' },
    ],
    meetings: [
      { name: '2025年度股东会', time: '2026-05-28 10:00', place: '文旅公司会议室', attendees: '林芳、周琳、滨海旅游投资集团代表', resolution: '确认2025年度亏损620万元，不进行利润分配，二期投资暂缓' },
    ],
    workReports: [
      { period: '2026年上半年', reporter: '周琳', content: '滨海营地项目客流量低于可研预期45%，已计提长期股权投资减值准备40万元', createTime: '2026-06-30 15:00' },
    ],
    finances: [
      { year: '2025', revenue: 2140, netProfit: -620, totalAssets: 5800, totalLiabilities: 3900 },
    ],
    changes: [] },
])

const regFilter = reactive({ company: '' })
const regQuery = reactive({ company: '' })
const regPage = ref(1)
const regSize = ref(10)
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
const woSize = ref(10)
function doWoSearch() {
  Object.assign(woQuery, woFilter)
  woPage.value = 1
}
const filteredWos = computed(() => woList.value.filter(w => !woQuery.keyword || w.equity.includes(woQuery.keyword) || w.title.includes(woQuery.keyword)))
const pagedWos = computed(() => filteredWos.value.slice((woPage.value - 1) * woSize.value, woPage.value * woSize.value))

function eqNowTime() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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
  const f = eqForm.value
  if (!f.name) {
    ElMessage.warning('请填写股权名称')
    return
  }
  regList.value.unshift({
    id: Date.now(),
    name: f.name,
    regCapital: f.shareholders.reduce((s, x) => s + (x.subscribed || 0), 0),
    address: f.address || '—',
    contact: f.contact || '—',
    createTime: eqNowTime(),
    lastEdit: eqNowTime(),
    legalPerson: f.legalPerson || '—',
    estDate: f.estDate || '—',
    approveDate: f.approveDate || '—',
    regOrg: f.regOrg || '—',
    regStatus: f.regStatus,
    term: f.term && f.term.length === 2 ? f.term : ['—', '—'],
    scope: f.scope || '—',
    shareholders: f.shareholders.filter(x => x.name),
    execs: [],
    meetings: [],
    workReports: [],
    finances: [],
    changes: [],
  })
  showEqSave.value = false
  ElMessage.success('股权信息保存成功')
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
  const f = woForm.value
  if (!f.equity || !f.title || !f.amount) {
    ElMessage.warning('请填写股权名称、核销标题与核销金额')
    return
  }
  woList.value.unshift({
    id: Date.now(),
    equity: f.equity,
    title: f.title,
    amount: f.amount,
    reason: f.reason || '—',
    attach: '核销申请单.pdf',
    status: '已通过',
    createTime: eqNowTime(),
    lastEdit: eqNowTime(),
    finishTime: eqNowTime(),
    before: [{ name: '长乐区国有资产投资经营有限公司', ratio: 100, subscribed: f.amount, paid: f.amount, removed: true }],
    after: [],
    steps: [{ level: '一级审批（财务部）', auditor: '王芳', time: eqNowTime(), attach: '财务审核意见.pdf' }],
  })
  showWoSave.value = false
  ElMessage.success('股权核销已新增')
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
  border-radius: 8px;
  background: var(--bg-page);
  color: #666;
  font-size: 11px;
  line-height: 16px;
}

.pane-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pane-tip {
  color: #666;
  font-size: 12px;
}

.expand-block {
  padding: 6px 40px;
  color: #555;
  font-size: 13px;
  line-height: 1.8;
}

.area-hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
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

.cmp-block {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.cmp-col {
  flex: 1;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 12px;
  background: #fafafa;
}

.cmp-head {
  font-weight: 600;
  font-size: 13px;
  color: #333;
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
  color: #52c41a;
}

.cmp-line.after {
  color: #fa8c16;
}

.cmp-line.removed {
  text-decoration: line-through;
  color: #f56c6c;
}
</style>
