<template>
  <div class="page-container">
    <div class="page-header">
      <h2>履约催缴</h2>
    </div>

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card">
          <div class="kpi-value">{{ records.length }}</div>
          <div class="kpi-label">欠费记录(条)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #F56C6C">
          <div class="kpi-value">{{ kpiArrearsTotal }}<span style="font-size:14px;font-weight:normal">万</span></div>
          <div class="kpi-label">欠费总额</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #E6A23C">
          <div class="kpi-value">{{ kpiOver3Months }}</div>
          <div class="kpi-label">超3月未缴(条)</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="kpi-card" style="border-left:3px solid #67C23A">
          <div class="kpi-value">{{ kpiUrgeCount }}</div>
          <div class="kpi-label">本年催缴次数</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="fill">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="催缴列表" name="list">
          <div style="display:flex;align-items:center;margin-bottom:12px">
            <el-button type="primary" size="small" :icon="Download" @click="exportUrgeBills">批量导出催缴单</el-button>
            <div class="icon-toolbar">
              <el-button size="small" :icon="Refresh" title="刷新" @click="refreshList" />
              <el-button size="small" :icon="Filter" title="筛选" @click="showListFilter = !showListFilter" />
            </div>
          </div>
          <div v-if="showListFilter" style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <el-select v-model="listFilter.company" placeholder="所属公司" clearable size="small" style="width:240px">
              <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
            </el-select>
            <el-select v-model="listFilter.rentType" placeholder="租金类型" clearable size="small" style="width:140px">
              <el-option label="固定租金" value="固定租金" />
              <el-option label="递增租金" value="递增租金" />
              <el-option label="提成租金" value="提成租金" />
            </el-select>
            <el-button type="primary" size="small" :icon="Search" @click="listPage = 1">查询</el-button>
          </div>
          <el-table :data="pagedList" border stripe @selection-change="handleListSelection">
            <el-table-column type="selection" width="46" />
            <el-table-column type="expand" width="46">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="section-title">资产信息</div>
                  <el-table :data="row.assets" border size="small">
                    <el-table-column prop="region" label="省市区" min-width="150" />
                    <el-table-column prop="project" label="项目" min-width="130" />
                    <el-table-column prop="zone" label="分区" width="80" />
                    <el-table-column prop="name" label="资产名称" min-width="130" />
                    <el-table-column prop="code" label="资产编号" width="120" />
                    <el-table-column prop="location" label="资产座落" min-width="200" />
                    <el-table-column prop="company" label="所属公司" min-width="220" />
                    <el-table-column prop="leaseType" label="租赁类型" width="100" />
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="tenant" label="承租人" width="110" show-overflow-tooltip />
            <el-table-column prop="leaseRange" label="租赁起止(起 至 止)" width="170" show-overflow-tooltip />
            <el-table-column prop="payCycle" label="缴费周期" width="90" />
            <el-table-column prop="dueDate" label="交费截至时间" width="120" />
            <el-table-column prop="rentType" label="租金类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.rentType === '固定租金' ? '' : row.rentType === '递增租金' ? 'warning' : 'success'">{{ row.rentType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="monthlyRent" label="月租金" width="110">
              <template #default="{ row }">
                <el-tag size="small" type="danger" effect="plain">¥{{ row.monthlyRent }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="smsUrge(row)">短信催缴</el-button>
                <el-button type="primary" link size="small" @click="viewListDetail(row)">详情</el-button>
                <el-dropdown style="margin-left:8px" @command="cmd => handleListCommand(cmd, row)">
                  <el-button type="primary" link size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="bill">催缴单记录</el-dropdown-item>
                      <el-dropdown-item command="notice">生成催缴单</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="listPage"
              v-model:page-size="listSize"
              :total="filteredList.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="催缴模板" name="templates">
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
            <el-select v-model="tplFilter.company" placeholder="请选择公司" clearable size="small" style="width:240px">
              <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
            </el-select>
            <el-input v-model="tplFilter.name" placeholder="模板名称" clearable size="small" style="width:180px" />
            <el-button type="primary" size="small" :icon="Search" @click="tplPage = 1">查询</el-button>
            <el-button type="primary" size="small" plain :icon="Plus" @click="openCreateTpl">新增</el-button>
            <el-button type="danger" size="small" plain :icon="Delete" @click="batchDeleteTpl">批量删除</el-button>
            <el-button size="small" :icon="Setting" @click="showParamDialog = true">参考参数配置</el-button>
          </div>
          <el-table :data="pagedTpls" border stripe @selection-change="handleTplSelection">
            <el-table-column type="selection" width="46" />
            <el-table-column prop="company" label="所属公司" width="180" show-overflow-tooltip />
            <el-table-column prop="name" label="模板名称" width="170" show-overflow-tooltip />
            <el-table-column prop="createTime" label="创建时间" width="150" />
            <el-table-column prop="modifyTime" label="修改时间" width="150" />
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="deleteTpl(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="tplPage"
              v-model:page-size="tplSize"
              :total="filteredTpls.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="催缴记录" name="logs">
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
            <el-input v-model="logFilter.keyword" placeholder="催缴人员/资产编号/资产地址" clearable size="small" style="width:240px" :prefix-icon="Search" />
            <el-date-picker
              v-model="logFilter.range"
              type="daterange"
              size="small"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width:260px"
            />
            <el-select v-model="logFilter.company" placeholder="请选择公司" clearable size="small" style="width:240px">
              <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
            </el-select>
            <el-button type="primary" size="small" :icon="Search" @click="logPage = 1">查询</el-button>
            <el-button size="small" :icon="Download" @click="exportLogs">导出</el-button>
          </div>
          <el-table :data="pagedLogs" border stripe>
            <el-table-column type="expand" width="46">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="section-title">资产信息</div>
                  <el-table :data="row.assets" border size="small">
                    <el-table-column prop="region" label="省市区" min-width="150" />
                    <el-table-column prop="project" label="项目" min-width="130" />
                    <el-table-column prop="zone" label="分区" width="80" />
                    <el-table-column prop="name" label="资产名称" min-width="130" />
                    <el-table-column prop="code" label="资产编号" width="120" />
                    <el-table-column prop="location" label="资产座落" min-width="200" />
                    <el-table-column prop="company" label="所属公司" min-width="220" />
                    <el-table-column prop="leaseType" label="租赁类型" width="100" />
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="staff" label="催缴人员" width="110" />
            <el-table-column prop="detail" label="催缴详情" min-width="280" show-overflow-tooltip />
            <el-table-column prop="time" label="催缴时间" width="150" />
            <el-table-column label="现场文件" width="170">
              <template #default="{ row }">
                <div style="display:flex;gap:6px">
                  <div v-for="n in row.fileCount" :key="n" class="file-thumb">
                    <el-icon :size="18"><Picture /></el-icon>
                  </div>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="logPage"
              v-model:page-size="logSize"
              :total="filteredLogs.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="欠费催缴" name="records">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span>欠费记录</span>
            <div>
              <el-select v-model="urgeFilter" placeholder="催缴状态" clearable size="small" style="width:120px;margin-right:8px">
                <el-option label="待催缴" value="待催缴" />
                <el-option label="已催缴" value="已催缴" />
                <el-option label="已缴纳" value="已缴纳" />
              </el-select>
              <el-button type="primary" size="small" @click="batchUrge">批量催缴</el-button>
            </div>
          </div>
          <el-table :data="pagedRecords" border stripe @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="46" />
            <el-table-column type="expand" width="46">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="section-title">欠费明细</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">费项</div><div class="value">{{ row.feeType }}</div></div>
                    <div class="cell"><div class="label">已催次数</div><div class="value">{{ row.urgeCount }} 次</div></div>
                    <div class="cell"><div class="label">合同编号</div><div class="value hl">{{ row.contractNo }}</div></div>
                    <div class="cell"><div class="label">承租人信用评级</div><div class="value">{{ row.credit }}</div></div>
                    <div class="cell"><div class="label">承租人合计欠费(元)</div><div class="value hl">{{ partyStore.statsOf(row.tenant).totalArrears * 10000 }}</div></div>
                    <div class="cell"><div class="label">承租人逾期次数</div><div class="value">{{ partyStore.statsOf(row.tenant).overdueCount }} 次</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="contractNo" label="合同编号" width="140" />
            <el-table-column prop="assetName" label="资产名称" width="160" show-overflow-tooltip />
            <el-table-column prop="tenant" label="承租人" width="110" show-overflow-tooltip />
            <el-table-column prop="credit" label="信用" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.credit.startsWith('D') ? 'danger' : row.credit.startsWith('C') ? 'warning' : row.credit.startsWith('B') ? '' : 'success'">{{ row.credit }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="应收(元)" width="100" align="right" />
            <el-table-column prop="overdueDays" label="逾期天数" width="90" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.overdueDays > 90 ? '#F56C6C' : row.overdueDays > 30 ? '#E6A23C' : '#909399' }">{{ row.overdueDays }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '已缴纳' ? 'success' : row.status === '已催缴' ? '' : 'warning'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === '待催缴'" type="primary" link size="small" @click="urgeOne(row)">催缴</el-button>
                <el-button type="primary" link size="small" @click="viewRecord(row)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="recPage"
              v-model:page-size="recSize"
              :total="filteredRecords.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="函件管理" name="letters">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <span>催缴函件</span>
            <el-button type="primary" size="small" @click="openCreateLetter">新增函件</el-button>
          </div>
          <el-table :data="pagedLetters" border stripe>
            <el-table-column type="expand" width="46">
              <template #default="{ row }">
                <div style="padding:8px 24px">
                  <div class="section-title">函件明细</div>
                  <div class="detail-grid">
                    <div class="cell"><div class="label">关联合同</div><div class="value hl">{{ row.contractNo }}</div></div>
                    <div class="cell"><div class="label">资产名称</div><div class="value">{{ row.assetName }}</div></div>
                    <div class="cell"><div class="label">费项</div><div class="value">{{ row.feeType }}</div></div>
                    <div class="cell"><div class="label">涉及金额(元)</div><div class="value hl">{{ row.amount }}</div></div>
                    <div class="cell"><div class="label">逾期天数</div><div class="value">{{ row.overdueDays }} 天</div></div>
                    <div class="cell"><div class="label">发送时间</div><div class="value">{{ row.sendTime || '—' }}</div></div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="letterNo" label="函件编号" width="150" />
            <el-table-column prop="receiver" label="接收公司/人" width="170" show-overflow-tooltip />
            <el-table-column prop="letterType" label="函件类型" width="110">
              <template #default="{ row }">
                <el-tag :type="row.letterType === '律师函' ? 'danger' : 'warning'" size="small">{{ row.letterType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="110" />
            <el-table-column prop="status" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === '已发送' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="previewLetter(row)">预览</el-button>
                <el-button v-if="row.status === '未发送'" type="success" link size="small" @click="sendLetterRow(row)">发送</el-button>
                <el-button v-if="row.status === '未发送'" type="danger" link size="small" @click="deleteLetter(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pager">
            <el-pagination
              v-model:current-page="letPage"
              v-model:page-size="letSize"
              :total="letters.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              small
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 函件预览 -->
    <el-dialog v-model="showLetterPreview" title="函件预览" width="640px">
      <div class="letter-doc" v-if="currentLetter">
        <div class="letter-org">长乐区国有资产投资经营有限公司</div>
        <div class="letter-line"></div>
        <h2 class="letter-title">{{ currentLetter.letterType === '律师函' ? '律师函' : '租金催缴通知函' }}</h2>
        <div class="letter-no">编号：{{ currentLetter.letterNo }}</div>
        <p class="letter-body"><strong>{{ currentLetter.receiver }}</strong>：</p>
        <p class="letter-body">贵方与我司签订的《{{ currentLetter.assetName }}租赁合同》（合同编号：{{ currentLetter.contractNo }}），约定{{ currentLetter.feeType }}缴纳义务。截至本函发出之日，贵方尚有 <strong style="color:#f5222d">{{ currentLetter.amount }} 元</strong> {{ currentLetter.feeType }}未缴纳，已逾期 <strong style="color:#f5222d">{{ currentLetter.overdueDays }}</strong> 天。</p>
        <p class="letter-body" v-if="currentLetter.letterType === '律师函'">我司已委托律师处理相关事宜，请贵方于收到本函后 <strong>5 个工作日</strong> 内履行付款义务，否则我司将依法向人民法院提起诉讼，由此产生的诉讼费、律师费等均由贵方承担。</p>
        <p class="letter-body" v-else>请贵方于收到本函后 <strong>7 个工作日</strong> 内将上述欠款缴至我司指定账户，逾期我司将依据合同约定追究违约责任。</p>
        <p class="letter-body">特此函告。</p>
        <div class="letter-footer">
          <div class="letter-seal">长乐区国有资产<br/>投资经营有限公司<br/>（公章）</div>
          <div class="letter-date">{{ currentLetter.createTime }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showLetterPreview = false">关闭</el-button>
        <el-button v-if="currentLetter?.status === '未发送'" type="primary" @click="sendLetterRow(currentLetter); showLetterPreview = false">确认发送</el-button>
        <el-button v-else type="primary" @click="printLetter">打印</el-button>
      </template>
    </el-dialog>

    <!-- 新增函件 -->
    <el-dialog v-model="showCreateLetter" title="新增催缴函件" width="520px">
      <el-form :model="letterForm" label-width="100px">
        <el-form-item label="欠费记录" required>
          <el-select v-model="letterForm.recordId" style="width:100%" placeholder="选择欠费记录">
            <el-option v-for="r in records" :key="r.id" :label="`${r.tenant} · ${r.assetName} · ${r.amount}元`" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="函件类型" required>
          <el-radio-group v-model="letterForm.letterType">
            <el-radio value="催缴通知函">催缴通知函</el-radio>
            <el-radio value="律师函">律师函</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="letterForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateLetter = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateLetter">生成函件</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showUrge" title="催缴操作" width="550px">
      <el-form :model="urgeForm" label-width="100px">
        <el-form-item label="承租人">
          <span>{{ currentRecord?.tenant }}</span>
        </el-form-item>
        <el-form-item label="欠费金额">
          <span style="color:#F56C6C;font-weight:bold">{{ currentRecord?.amount }} 元</span>
        </el-form-item>
        <el-form-item label="催缴方式">
          <el-checkbox-group v-model="urgeForm.methods">
            <el-checkbox label="sms">短信通知</el-checkbox>
            <el-checkbox label="phone">电话催缴</el-checkbox>
            <el-checkbox label="letter">书面函件</el-checkbox>
            <el-checkbox label="visit">上门催缴</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="短信模板">
          <el-select v-model="urgeForm.template" style="width:100%">
            <el-option label="标准催缴模板" value="standard" />
            <el-option label="严重逾期模板" value="severe" />
            <el-option label="友好提醒模板" value="friendly" />
          </el-select>
        </el-form-item>
        <el-form-item label="短信预览">
          <div style="background:#f5f7fa;padding:12px;border-radius:4px;font-size:13px;color:#606266">
            【长乐城投】尊敬的{{ currentRecord?.tenant }}，您承租的{{ currentRecord?.assetName }}，{{ currentRecord?.feeType }} {{ currentRecord?.amount }}元已逾期，请尽快缴纳。如有疑问请联系：0591-28xxxxxx。
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="urgeForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUrge = false">取消</el-button>
        <el-button type="primary" @click="confirmUrge">确认催缴</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="showView" title="催缴详情" size="450px">
      <template v-if="currentRecord">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="合同编号">{{ currentRecord.contractNo }}</el-descriptions-item>
          <el-descriptions-item label="资产名称">{{ currentRecord.assetName }}</el-descriptions-item>
          <el-descriptions-item label="承租人">{{ currentRecord.tenant }}</el-descriptions-item>
          <el-descriptions-item label="费项">{{ currentRecord.feeType }}</el-descriptions-item>
          <el-descriptions-item label="应收金额">{{ currentRecord.amount }} 元</el-descriptions-item>
          <el-descriptions-item label="逾期天数">{{ currentRecord.overdueDays }} 天</el-descriptions-item>
          <el-descriptions-item label="已催次数">{{ currentRecord.urgeCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRecord.status === '已缴纳' ? 'success' : currentRecord.status === '已催缴' ? '' : 'warning'" size="small">{{ currentRecord.status }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 催缴列表详情 -->
    <el-dialog v-model="showListDetail" title="催缴详情" width="720px">
      <template v-if="currentListItem">
        <div class="section-title">租赁信息</div>
        <div class="detail-grid">
          <div class="cell"><div class="label">承租人</div><div class="value">{{ currentListItem.tenant }}</div></div>
          <div class="cell"><div class="label">合同编号</div><div class="value hl">{{ currentListItem.contractNo }}</div></div>
          <div class="cell"><div class="label">所属公司</div><div class="value">{{ currentListItem.company }}</div></div>
          <div class="cell"><div class="label">租赁起止时间</div><div class="value">{{ currentListItem.leaseRange }}</div></div>
          <div class="cell"><div class="label">缴费周期</div><div class="value">{{ currentListItem.payCycle }}</div></div>
          <div class="cell"><div class="label">交费截至时间</div><div class="value">{{ currentListItem.dueDate }}</div></div>
          <div class="cell"><div class="label">租金类型</div><div class="value">{{ currentListItem.rentType }}</div></div>
          <div class="cell"><div class="label">月租金</div><div class="value hl">¥{{ currentListItem.monthlyRent }}</div></div>
          <div class="cell"><div class="label">欠费金额</div><div class="value hl">¥{{ currentListItem.amount }}</div></div>
        </div>
        <div class="section-title">资产信息</div>
        <el-table :data="currentListItem.assets" border size="small">
          <el-table-column prop="region" label="省市区" min-width="150" />
          <el-table-column prop="project" label="项目" min-width="130" />
          <el-table-column prop="zone" label="分区" width="80" />
          <el-table-column prop="name" label="资产名称" min-width="130" />
          <el-table-column prop="code" label="资产编号" width="120" />
          <el-table-column prop="location" label="资产座落" min-width="200" />
          <el-table-column prop="company" label="所属公司" min-width="220" />
          <el-table-column prop="leaseType" label="租赁类型" width="100" />
        </el-table>
      </template>
      <template #footer>
        <el-button @click="showListDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 催缴单记录 -->
    <el-dialog v-model="showBillRecords" title="催缴单记录" width="720px">
      <el-table :data="currentBillRecords" border stripe size="small">
        <el-table-column prop="billNo" label="催缴单号" width="160" />
        <el-table-column prop="assetName" label="资产名称" min-width="140" />
        <el-table-column prop="amount" label="欠费金额(元)" width="120" align="right" />
        <el-table-column prop="createTime" label="生成时间" width="160" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === '已送达' ? 'success' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="previewBill(row)">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="showBillRecords = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增模板 -->
    <el-dialog v-model="showCreateTpl" title="新增催缴模板" width="560px">
      <el-form :model="tplForm" label-width="90px">
        <el-form-item label="所属公司" required>
          <el-select v-model="tplForm.company" placeholder="请选择公司" style="width:100%">
            <el-option v-for="c in companies" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板名称" required>
          <el-input v-model="tplForm.name" placeholder="请输入模板名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="模板内容" required>
          <el-input v-model="tplForm.content" type="textarea" :rows="6" placeholder="请输入模板内容，可插入参考参数" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateTpl = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTpl">保存</el-button>
      </template>
    </el-dialog>

    <!-- 参考参数配置 -->
    <el-dialog v-model="showParamDialog" title="参考参数配置" width="560px">
      <el-table :data="tplParams" border size="small">
        <el-table-column prop="param" label="参数" width="160" />
        <el-table-column prop="desc" label="说明" min-width="240" />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="showParamDialog = false">知道了</el-button>
      </template>
    </el-dialog>

    <!-- 催款通知书预览 -->
    <el-dialog v-model="showNotice" width="780px">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-right:24px">
          <span style="font-size:15px;font-weight:600;color:#333">预览</span>
          <el-button type="primary" size="small" :icon="Download" @click="downloadNotice">下载</el-button>
        </div>
      </template>
      <div class="notice-viewport">
        <div class="a4-sheet" :style="{ transform: `scale(${noticeZoom})` }" v-if="currentNotice">
          <h2 class="notice-title">催款通知书</h2>
          <div class="notice-no">编号：{{ currentNotice.no }}</div>
          <p class="notice-body"><strong>{{ currentNotice.tenant }}</strong>：</p>
          <p class="notice-body">贵方承租我司 <strong>{{ currentNotice.assetName }}</strong>（合同编号：{{ currentNotice.contractNo }}），租赁起止时间 {{ currentNotice.leaseRange }}，缴费周期为{{ currentNotice.payCycle }}，交费截至时间 {{ currentNotice.dueDate }}。</p>
          <p class="notice-body">截至本通知书发出之日，贵方尚欠租金合计 <strong style="color:#f5222d">¥{{ currentNotice.amount }}</strong> 元（月租金 ¥{{ currentNotice.monthlyRent }} 元），已构成违约。</p>
          <p class="notice-body">请贵方于收到本通知书后 <strong>7 个工作日</strong> 内将上述欠款缴至我司指定账户。逾期未缴，我司将依据合同约定及有关法律法规追究贵方违约责任。</p>
          <p class="notice-body">特此通知。</p>
          <div class="notice-footer">
            <div>{{ currentNotice.company }}</div>
            <div>{{ currentNotice.date }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <el-button size="small" circle :icon="ZoomOut" @click="noticeZoom = Math.max(0.5, +(noticeZoom - 0.1).toFixed(2))" />
            <span style="font-size:13px;color:#666;min-width:40px;text-align:center">{{ Math.round(noticeZoom * 100) }}%</span>
            <el-button size="small" circle :icon="ZoomIn" @click="noticeZoom = Math.min(1.5, +(noticeZoom + 0.1).toFixed(2))" />
          </div>
          <span style="font-size:13px;color:#666">1/1</span>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Filter, Search, Download, Plus, Delete, Setting, Picture, ZoomIn, ZoomOut, MoreFilled } from '@element-plus/icons-vue'
import { useContractStore } from '../../store/contract'
import { usePartyStore } from '../../store/party'
import { useAssetStore } from '../../store/asset'
import { useAuditStore } from '../../store/audit'

const contractStore = useContractStore()
const partyStore = usePartyStore()
const assetStore = useAssetStore()
const auditStore = useAuditStore()

const activeTab = ref('list')

const companies = ['城投集团', '产投集团', '水投集团', '领航公司']

const showListFilter = ref(false)
const listFilter = ref({ company: '', rentType: '' })
const listPage = ref(1)
const listSize = ref(10)
const selectedListRows = ref([])
const showListDetail = ref(false)
const currentListItem = ref(null)
const showBillRecords = ref(false)
const currentBillRecords = ref([])
const showNotice = ref(false)
const noticeZoom = ref(1)
const currentNotice = ref(null)

const makeAssets = (region, project, zone, name, code, location, company, leaseType) => ([
  { region, project, zone, name, code, location, company, leaseType }
])

const rentTypeOf = (c) => ((c.increment || '').includes('递增') ? '递增租金' : '固定租金')

const assetsOf = (c) => {
  const a = assetStore.getAssetById(c.assetId)
  return [{
    region: '福建省福州市长乐区',
    project: a?.location || '—',
    zone: '—',
    name: a?.name || c.assetName,
    code: a?.id || c.assetId || '—',
    location: a?.location || '—',
    company: a?.group || '—',
    leaseType: '对外出租'
  }]
}

const urgeList = computed(() => contractStore.visibleContracts.map((c, i) => {
  const a = assetStore.getAssetById(c.assetId)
  return {
    id: i + 1,
    tenant: c.tenant,
    contractNo: c.id,
    company: a?.group || '—',
    leaseRange: `${c.startDate} 至 ${c.endDate}`,
    payCycle: '按年',
    dueDate: c.endDate,
    rentType: rentTypeOf(c),
    monthlyRent: Math.round((c.annualRent || 0) * 10000 / 12),
    feeType: '租金',
    amount: Math.round((c.arrears || 0) * 10000),
    assetName: c.assetName,
    assets: assetsOf(c)
  }
}))

// 催缴状态是运行期数据，按合同编号记录，欠费明细本身由合同库实时推导
const urgeState = ref({})

const filteredList = computed(() => {
  return urgeList.value.filter(item => {
    if (listFilter.value.company && item.company !== listFilter.value.company) return false
    if (listFilter.value.rentType && item.rentType !== listFilter.value.rentType) return false
    return true
  })
})

const pagedList = computed(() => {
  const start = (listPage.value - 1) * listSize.value
  return filteredList.value.slice(start, start + listSize.value)
})

const handleListSelection = (rows) => {
  selectedListRows.value = rows
}

const refreshList = () => {
  listPage.value = 1
  ElMessage.success('列表已刷新')
}

const exportUrgeBills = () => {
  const data = selectedListRows.value.length ? selectedListRows.value : filteredList.value
  const headers = ['资产名称', '合同编号', '承租方', '所属公司', '租金类型', '月租金(元)', '本期欠费(元)', '交费截至时间']
  const rows = data.map(r => [r.assetName, r.contractNo, r.tenant, r.company, r.rentType, r.monthlyRent, r.amount, r.dueDate])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `催缴账单_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${data.length} 份催缴单`)
}

const smsUrge = (row) => {
  currentRecord.value = row
  urgeForm.value = { methods: ['sms'], template: 'standard', remark: '' }
  showUrge.value = true
}

const viewListDetail = (row) => {
  currentListItem.value = row
  showListDetail.value = true
}

const handleListCommand = (cmd, row) => {
  if (cmd === 'bill') viewBillRecords(row)
  else if (cmd === 'notice') generateNotice(row)
}

const billRecords = ref([
  { billNo: 'CJD-2026-0101', assetName: '航城商铺A-03', amount: 45000, createTime: '2026-07-05 09:30', status: '已送达' },
  { billNo: 'CJD-2026-0102', assetName: '航城商铺A-03', amount: 30000, createTime: '2026-08-06 10:12', status: '已送达' },
  { billNo: 'CJD-2026-0118', assetName: '城西停车场', amount: 8500, createTime: '2026-09-02 14:20', status: '待送达' },
  { billNo: 'CJD-2026-0126', assetName: '工业区厂房A-02', amount: 156000, createTime: '2026-04-08 16:45', status: '已送达' },
  { billNo: 'CJD-2026-0131', assetName: '滨江商铺B-07', amount: 20400, createTime: '2026-09-16 11:05', status: '待送达' }
])

const viewBillRecords = (row) => {
  currentBillRecords.value = billRecords.value.filter(b => b.assetName === row.assetName)
  if (currentBillRecords.value.length === 0) {
    currentBillRecords.value = billRecords.value.slice(0, 2)
  }
  showBillRecords.value = true
}

const previewBill = (bill) => {
  const item = urgeList.value.find(l => l.assetName === bill.assetName)
  currentNotice.value = {
    no: bill.billNo,
    tenant: item?.tenant || '承租人',
    assetName: bill.assetName,
    contractNo: item?.contractNo || '—',
    company: item?.company || companies[0],
    leaseRange: item?.leaseRange || '—',
    payCycle: item?.payCycle || '按月',
    dueDate: item?.dueDate || '—',
    monthlyRent: item?.monthlyRent || bill.amount,
    amount: bill.amount,
    date: bill.createTime.slice(0, 10)
  }
  noticeZoom.value = 1
  showNotice.value = true
}

const generateNotice = (row) => {
  currentNotice.value = {
    no: `CJD-2026-${String(billRecords.value.length + 101).padStart(4, '0')}`,
    tenant: row.tenant,
    assetName: row.assetName,
    contractNo: row.contractNo,
    company: row.company,
    leaseRange: row.leaseRange,
    payCycle: row.payCycle,
    dueDate: row.dueDate,
    monthlyRent: row.monthlyRent,
    amount: row.amount,
    date: new Date().toISOString().slice(0, 10)
  }
  noticeZoom.value = 1
  showNotice.value = true
}

const downloadNotice = () => {
  if (!currentNotice.value) return
  const n = currentNotice.value
  const content = `\uFEFF催款通知书\n==================\n编号：${n.no}\n资产：${n.assetName}\n承租方：${n.tenant}\n合同编号：${n.contractNo}\n租赁起止：${n.leaseRange}\n月租金：${n.monthlyRent} 元\n欠费金额：${n.amount} 元\n交费截至时间：${n.dueDate}\n\n请于收到本通知后 7 个工作日内缴清欠款。\n\n生成日期：${n.date}\n`
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `催缴通知书_${n.no}.txt`
  a.click()
  URL.revokeObjectURL(url)
  billRecords.value.unshift({
    billNo: n.no,
    assetName: n.assetName,
    amount: n.amount,
    createTime: `${n.date} ${new Date().toTimeString().slice(0, 5)}`,
    status: '待送达'
  })
  ElMessage.success(`催款通知书 ${n.no} 已下载并留痕`)
}

const tplFilter = ref({ company: '', name: '' })
const tplPage = ref(1)
const tplSize = ref(10)
const selectedTpls = ref([])
const showCreateTpl = ref(false)
const showParamDialog = ref(false)
const tplForm = ref({ company: '', name: '', content: '' })

const templates = ref([
  { id: 1, company: companies[0], name: '标准租金催缴模板', content: '尊敬的${承租人}，您承租的${资产名称}租金${欠费金额}元已逾期，请于${缴费截止日期}前缴纳。', createTime: '2026-01-12 09:20', modifyTime: '2026-06-03 15:41' },
  { id: 2, company: companies[0], name: '严重逾期律师函模板', content: '${承租人}：鉴于欠费已超90天，我司将依法委托律师处理，请5个工作日内缴纳${欠费金额}元。', createTime: '2026-02-08 10:05', modifyTime: '2026-07-19 11:26' },
  { id: 3, company: companies[1], name: '友好提醒模板', content: '温馨提示：${资产名称}本期租金${月租金}元将于${缴费截止日期}到期，请及时安排缴纳。', createTime: '2026-03-15 14:33', modifyTime: '2026-08-01 09:12' },
  { id: 4, company: companies[2], name: '管理费催缴模板', content: '${承租人}：您名下${资产编号}管理费${欠费金额}元尚未缴纳，请尽快办理。', createTime: '2026-05-20 16:47', modifyTime: '2026-09-02 10:38' }
])

const tplParams = ref([
  { param: '${承租人}', desc: '合同承租人名称' },
  { param: '${资产名称}', desc: '催缴关联资产名称' },
  { param: '${资产编号}', desc: '催缴关联资产编号' },
  { param: '${欠费金额}', desc: '当前欠费总额（元）' },
  { param: '${月租金}', desc: '合同约定月租金（元）' },
  { param: '${缴费截止日期}', desc: '本期缴费截止时间' },
  { param: '${所属公司}', desc: '资产所属经营公司' }
])

const filteredTpls = computed(() => {
  return templates.value.filter(t => {
    if (tplFilter.value.company && t.company !== tplFilter.value.company) return false
    if (tplFilter.value.name && !t.name.includes(tplFilter.value.name)) return false
    return true
  })
})

const pagedTpls = computed(() => {
  const start = (tplPage.value - 1) * tplSize.value
  return filteredTpls.value.slice(start, start + tplSize.value)
})

const handleTplSelection = (rows) => {
  selectedTpls.value = rows
}

const openCreateTpl = () => {
  tplForm.value = { company: '', name: '', content: '' }
  showCreateTpl.value = true
}

const confirmCreateTpl = () => {
  if (!tplForm.value.company) {
    ElMessage.warning('请选择所属公司')
    return
  }
  if (!tplForm.value.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (!tplForm.value.content) {
    ElMessage.warning('请输入模板内容')
    return
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  templates.value.unshift({
    id: Date.now(),
    company: tplForm.value.company,
    name: tplForm.value.name,
    content: tplForm.value.content,
    createTime: now,
    modifyTime: now
  })
  showCreateTpl.value = false
  ElMessage.success('模板已保存')
}

const deleteTpl = (row) => {
  ElMessageBox.confirm(`确认删除模板"${row.name}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = templates.value.findIndex(t => t.id === row.id)
    if (idx > -1) templates.value.splice(idx, 1)
    ElMessage.success('模板已删除')
  }).catch(() => {})
}

const batchDeleteTpl = () => {
  if (selectedTpls.value.length === 0) {
    ElMessage.warning('请先选择要删除的模板')
    return
  }
  ElMessageBox.confirm(`确认删除选中的 ${selectedTpls.value.length} 个模板？`, '批量删除', { type: 'warning' }).then(() => {
    const ids = selectedTpls.value.map(t => t.id)
    templates.value = templates.value.filter(t => !ids.includes(t.id))
    selectedTpls.value = []
    ElMessage.success('已批量删除')
  }).catch(() => {})
}

const logFilter = ref({ keyword: '', range: null, company: '' })
const logPage = ref(1)
const logSize = ref(10)

const urgeLogs = ref([
  { id: 1, staff: '王丽娟', detail: '电话催缴：已联系承租人张某，对方承诺9月底前缴纳航城商铺A-03欠租45000元', time: '2026-09-12 10:24', fileCount: 3, company: companies[0], assets: makeAssets('福建省福州市长乐区', '航城商业项目', 'A区', '航城商铺A-03', 'ZC-CL-0018', '长乐区航城街道会堂路128号', companies[0], '对外出租') },
  { id: 2, staff: '林志强', detail: '上门催缴：赴城西停车场现场送达催缴单，物业负责人签收', time: '2026-09-08 15:40', fileCount: 2, company: companies[1], assets: makeAssets('福建省福州市长乐区', '城西停车项目', 'B区', '城西停车场', 'ZC-CL-0126', '长乐区吴航街道西洋路9号', companies[1], '委托经营') },
  { id: 3, staff: '陈国平', detail: '短信催缴：向陈某发送标准催缴短信，送达成功', time: '2026-09-05 09:12', fileCount: 0, company: companies[0], assets: makeAssets('福建省福州市长乐区', '农贸市场项目', 'C区', '农贸市场1号摊位', 'ZC-CL-0233', '长乐区漳港街道农贸市场内1号', companies[0], '对外出租') },
  { id: 4, staff: '刘晓芳', detail: '上门催缴：工业区厂房A-02现场沟通，企业申请分期缴纳，已上报审批', time: '2026-08-28 14:05', fileCount: 3, company: companies[3], assets: makeAssets('福建省福州市长乐区', '闽江口工业项目', 'A区', '工业区厂房A-02', 'ZC-CL-0342', '长乐区闽江口工业区兴达路66号', companies[3], '对外出租') },
  { id: 5, staff: '王丽娟', detail: '电话催缴：滨江商铺B-07承租人林某承诺本周内缴清欠款20400元', time: '2026-08-20 11:30', fileCount: 2, company: companies[2], assets: makeAssets('福建省福州市长乐区', '滨江商业项目', 'B区', '滨江商铺B-07', 'ZC-CL-0455', '长乐区营前街道滨江路77号', companies[2], '对外出租') },
  { id: 6, staff: '林志强', detail: '书面函件：向某餐饮公司邮寄租金催缴通知函，单号SF1234567890', time: '2026-08-15 16:50', fileCount: 1, company: companies[1], assets: makeAssets('福建省福州市长乐区', '航城商业项目', 'A区', '航城商铺A-11', 'ZC-CL-0026', '长乐区航城街道会堂路128号', companies[1], '对外出租') }
])

const filteredLogs = computed(() => {
  const kw = logFilter.value.keyword.trim()
  const [start, end] = logFilter.value.range || []
  return urgeLogs.value.filter(log => {
    if (logFilter.value.company && log.company !== logFilter.value.company) return false
    if (start && log.time.slice(0, 10) < start) return false
    if (end && log.time.slice(0, 10) > end) return false
    if (kw) {
      const hit = log.staff.includes(kw) || log.assets.some(a => a.code.includes(kw) || a.location.includes(kw))
      if (!hit) return false
    }
    return true
  })
})

const pagedLogs = computed(() => {
  const start = (logPage.value - 1) * logSize.value
  return filteredLogs.value.slice(start, start + logSize.value)
})

const exportLogs = () => {
  const headers = ['时间', '操作类型', '关联单号', '操作人', '结果', '备注']
  const rows = filteredLogs.value.map(r => [r.time, r.type, r.refNo, r.operator, r.result, r.remark])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `催缴操作日志_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filteredLogs.value.length} 条催缴记录`)
}

const recPage = ref(1)
const recSize = ref(10)
const letPage = ref(1)
const letSize = ref(10)

const urgeFilter = ref('')
const showUrge = ref(false)
const showView = ref(false)
const currentRecord = ref(null)
const selectedRows = ref([])

const urgeForm = ref({
  methods: ['sms'],
  template: 'standard',
  remark: ''
})

const records = computed(() => contractStore.visibleContracts
  .filter(c => (c.arrears || 0) > 0)
  .map((c, i) => {
    const st = urgeState.value[c.id] || {}
    return {
      id: i + 1,
      contractNo: c.id,
      assetName: c.assetName,
      tenant: c.tenant,
      feeType: '租金',
      amount: Math.round(c.arrears * 10000),
      overdueDays: c.overdueDays || 0,
      credit: partyStore.creditOf(c.tenant),
      status: st.status || '待催缴',
      urgeCount: st.urgeCount || 0
    }
  }))

const kpiArrearsTotal = computed(() =>
  Math.round(records.value.reduce((s, r) => s + r.amount, 0) / 10000 * 100) / 100)
const kpiOver3Months = computed(() => records.value.filter(r => r.overdueDays > 90).length)
const kpiUrgeCount = computed(() =>
  Object.values(urgeState.value).reduce((s, st) => s + (st.urgeCount || 0), 0))

function doUrge(contractNo) {
  const st = urgeState.value[contractNo] || { status: '待催缴', urgeCount: 0 }
  urgeState.value[contractNo] = { status: '已催缴', urgeCount: st.urgeCount + 1 }
  const c = contractStore.getContractById(contractNo)
  const a = c && assetStore.getAssetById(c.assetId)
  auditStore.recordEvent({
    assetId: c?.assetId || '',
    assetName: c?.assetName || '',
    group: a?.group || '',
    module: '履约催缴',
    action: '发起催缴',
    billNo: contractNo,
    remark: `向 ${c?.tenant || '承租人'} 催缴欠费`,
    detail: `欠费 ${c?.arrears || 0} 万元，逾期 ${c?.overdueDays || 0} 天`
  })
}

const filteredRecords = computed(() => {
  if (!urgeFilter.value) return records.value
  return records.value.filter(r => r.status === urgeFilter.value)
})

const pagedRecords = computed(() => {
  const start = (recPage.value - 1) * recSize.value
  return filteredRecords.value.slice(start, start + recSize.value)
})

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const urgeOne = (row) => {
  currentRecord.value = row
  urgeForm.value = { methods: ['sms'], template: 'standard', remark: '' }
  showUrge.value = true
}

const batchUrge = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要催缴的记录')
    return
  }
  const pending = selectedRows.value.filter(r => r.status === '待催缴')
  if (pending.length === 0) {
    ElMessage.warning('所选记录中无待催缴项')
    return
  }
  pending.forEach(r => {
    doUrge(r.contractNo)
  })
  ElMessage.success(`已批量催缴 ${pending.length} 条记录`)
}

const confirmUrge = () => {
  if (currentRecord.value?.contractNo) doUrge(currentRecord.value.contractNo)
  showUrge.value = false
  ElMessage.success('催缴成功')
}

const viewRecord = (row) => {
  currentRecord.value = row
  showView.value = true
}

const showLetterPreview = ref(false)
const showCreateLetter = ref(false)
const currentLetter = ref(null)
const letterForm = ref({ recordId: null, letterType: '催缴通知函', remark: '' })

const letters = ref([
  { letterNo: 'CJH-2026-001', receiver: '福建某制造有限公司', letterType: '律师函', contractNo: 'HT-2024-025', assetName: '工业区厂房A-02', feeType: '租金', amount: 52000, overdueDays: 120, createTime: '2026-08-01', sendTime: '2026-08-02', status: '已发送' },
  { letterNo: 'CJH-2026-002', receiver: '张某', letterType: '催缴通知函', contractNo: 'HT-2023-018', assetName: '航城商铺A-03', feeType: '租金', amount: 15000, overdueDays: 95, createTime: '2026-08-20', sendTime: '2026-08-21', status: '已发送' },
  { letterNo: 'CJH-2026-003', receiver: '福州某物业管理有限公司', letterType: '催缴通知函', contractNo: 'HT-2024-012', assetName: '城西停车场', feeType: '管理费', amount: 8500, overdueDays: 45, createTime: '2026-09-10', sendTime: '', status: '未发送' },
])

const pagedLetters = computed(() => {
  const start = (letPage.value - 1) * letSize.value
  return letters.value.slice(start, start + letSize.value)
})

const previewLetter = (row) => {
  currentLetter.value = row
  showLetterPreview.value = true
}

const sendLetterRow = (row) => {
  row.status = '已发送'
  row.sendTime = new Date().toISOString().slice(0, 10)
  const st = urgeState.value[row.contractNo]
  if ((st?.status || '待催缴') === '待催缴') doUrge(row.contractNo)
  ElMessage.success(`函件 ${row.letterNo} 已发送，催缴记录已留痕`)
}

const deleteLetter = (row) => {
  ElMessageBox.confirm(`确认删除函件"${row.letterNo}"？`, '删除确认', { type: 'warning' }).then(() => {
    const idx = letters.value.findIndex(l => l.letterNo === row.letterNo)
    if (idx > -1) letters.value.splice(idx, 1)
    ElMessage.success('函件已删除')
  }).catch(() => {})
}

const openCreateLetter = () => {
  letterForm.value = { recordId: null, letterType: '催缴通知函', remark: '' }
  showCreateLetter.value = true
}

const confirmCreateLetter = () => {
  const record = records.value.find(r => r.id === letterForm.value.recordId)
  if (!record) {
    ElMessage.warning('请选择欠费记录')
    return
  }
  letters.value.unshift({
    letterNo: `CJH-2026-${String(letters.value.length + 1).padStart(3, '0')}`,
    receiver: record.tenant,
    letterType: letterForm.value.letterType,
    contractNo: record.contractNo,
    assetName: record.assetName,
    feeType: record.feeType,
    amount: record.amount,
    overdueDays: record.overdueDays,
    createTime: new Date().toISOString().slice(0, 10),
    sendTime: '',
    status: '未发送'
  })
  showCreateLetter.value = false
  ElMessage.success('函件已生成，可在列表中预览并发送')
}

const printLetter = () => {
  const content = document.querySelector('.letter-doc')
  if (!content) return
  const win = window.open('', '_blank')
  win.document.write(`<html><head><title>打印函件</title><style>body{font-family:SimSun,serif;padding:40px;line-height:1.9}.letter-org{text-align:center;color:#d40000;font-size:22px;font-weight:700}.letter-line{border-bottom:2px solid #d40000;margin:10px 0 20px}.letter-title{text-align:center;font-size:20px}.letter-no{text-align:center;font-size:13px;color:#666;margin-bottom:18px}.letter-body{text-indent:2em;font-size:14px}.letter-footer{display:flex;justify-content:flex-end;align-items:flex-end;gap:20px;margin-top:30px}.letter-seal{width:120px;height:120px;border:3px solid rgba(212,0,0,.75);border-radius:50%;color:rgba(212,0,0,.85);font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center}.letter-date{font-size:14px}</style></head><body>${content.innerHTML}</body></html>`)
  win.document.close()
  win.print()
}
</script>

<style scoped>
.letter-doc {
  padding: 24px;
  background: #fff;
  font-family: SimSun, serif;
  line-height: 1.9;
}
.letter-org {
  text-align: center;
  color: #d40000;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}
.letter-line {
  border-bottom: 2px solid #d40000;
  margin: 8px 0 20px;
}
.letter-title {
  text-align: center;
  font-size: 20px;
  margin: 8px 0 4px;
}
.letter-no {
  text-align: center;
  font-size: 13px;
  color: var(--t-sub);
  margin-bottom: 16px;
}
.letter-body {
  font-size: 14px;
  color: #333;
  text-indent: 2em;
  margin: 8px 0;
}
.letter-footer {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 20px;
  margin-top: 24px;
}
.letter-seal {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(212, 0, 0, 0.75);
  border-radius: 50%;
  color: rgba(212, 0, 0, 0.85);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1.5;
  transform: rotate(-8deg);
}
.letter-date {
  font-size: 14px;
  color: #333;
}
.file-thumb {
  width: 48px;
  height: 36px;
  border: 1px solid var(--bd);
  border-radius: var(--r-sm);
  background: var(--bg-page);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--t-weak);
  cursor: pointer;
}
.file-thumb:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
}
.notice-viewport {
  background: #fff;
  padding: 20px;
  max-height: 560px;
  overflow: auto;
}
.a4-sheet {
  width: 100%;
  max-width: 760px;
  min-height: 780px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 24px;
  font-family: SimSun, serif;
  line-height: 2;
  transform-origin: top center;
}
.notice-title {
  text-align: center;
  font-size: 26px;
  letter-spacing: 8px;
  color: #d40000;
  margin-bottom: 8px;
}
.notice-no {
  text-align: center;
  font-size: 13px;
  color: var(--t-sub);
  border-bottom: 1px solid var(--bd);
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.notice-body {
  font-size: 14px;
  color: #333;
  text-indent: 2em;
  margin: 12px 0;
}
.notice-footer {
  margin-top: 24px;
  text-align: right;
  font-size: 14px;
  color: #333;
  line-height: 2.2;
}
</style>
