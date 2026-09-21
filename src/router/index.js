import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../store/user'
import { useAuditStore } from '../store/audit'

const router = createRouter({
  history: import.meta.env.MODE === 'singlefile' ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/common/Login.vue'),
      meta: { title: '登录' }
    },
    {
      path: '/gov',
      component: () => import('../layouts/GovLayout.vue'),
      meta: { requiresAuth: true, endpoint: 'gov' },
      children: [
        { path: 'home', name: 'GovHome', component: () => import('../views/gov/Dashboard.vue'), meta: { title: '工作台' } },
        { path: 'bigscreen', name: 'GovBigScreen', component: () => import('../views/gov/BigScreen.vue'), meta: { title: '监管大屏' } },
        { path: 'assets', name: 'GovAssets', component: () => import('../views/gov/Assets.vue'), meta: { title: '资产穿透查看' } },
        { path: 'statement', name: 'GovStatement', component: () => import('../views/gov/Statement.vue'), meta: { title: '固定资产情况表' } },
        { path: 'supervise', name: 'GovSupervise', component: () => import('../views/gov/Supervise.vue'), meta: { title: '督办管理' } },
        { path: 'supervise/create', name: 'GovSuperviseCreate', component: () => import('../views/gov/SuperviseCreate.vue'), meta: { title: '发起督办' } },
        { path: 'supervise/:id', name: 'GovSuperviseDetail', component: () => import('../views/gov/SuperviseDetail.vue'), meta: { title: '督办详情' } },
        { path: 'risk', name: 'GovRisk', component: () => import('../views/gov/Risk.vue'), meta: { title: '风险预警中心' } },
        { path: 'contact', name: 'GovContact', component: () => import('../views/gov/Contact.vue'), meta: { title: '企业联络' } },
        { path: 'revitalize', name: 'GovRevitalizeTarget', component: () => import('../views/gov/RevitalizeTarget.vue'), meta: { title: '盘活目标管理' } },
        { path: 'report', name: 'GovReportManage', component: () => import('../views/gov/ReportManage.vue'), meta: { title: '上报数据管理' } },
        { path: 'warning-tasks', name: 'GovWarningTasks', component: () => import('../views/gov/WarningTasks.vue'), meta: { title: '预警任务' } },
        { path: 'warning-rules', name: 'GovWarningRules', component: () => import('../views/gov/WarningRules.vue'), meta: { title: '预警规则配置' } },
        { path: 'map', name: 'GovAssetMap', component: () => import('../views/AssetMap/AssetMap.vue'), meta: { title: '资产地图' } },
        { path: 'system/role', name: 'GovSystemRole', component: () => import('../views/gov/SystemRole.vue'), meta: { title: '用户与权限' } },
        { path: 'system/log', name: 'GovSystemLog', component: () => import('../views/gov/SystemLog.vue'), meta: { title: '操作日志' } }
      ]
    },
    {
      path: '/ent',
      component: () => import('../layouts/EntLayout.vue'),
      meta: { requiresAuth: true, endpoint: 'ent' },
      children: [
        // ===== 首页 =====
        { path: 'home', name: 'EntHome', component: () => import('../views/ent/Home.vue'), meta: { title: '工作台' } },
        { path: 'data-cockpit', name: 'EntDataCockpit', component: () => import('../views/DataCockpit/DataCockpit.vue'), meta: { title: '经营看板' } },
        { path: 'asset-dashboard', name: 'EntAssetDashboard', component: () => import('../views/ent/Analysis.vue'), meta: { title: '资产看板' } },
        { path: 'asset-report', name: 'EntAssetReport', component: () => import('../views/ent/Analysis.vue'), meta: { title: '资产报表' } },
        { path: 'asset-archive', name: 'EntAssetArchive', component: () => import('../views/ent/AssetArchive.vue'), meta: { title: '资产档案' } },

        // ===== 资产管理 =====
        { path: 'asset-register', name: 'EntAssetRegister', component: () => import('../views/asset-register/AssetRegister.vue'), meta: { title: '资产登记' } },
        { path: 'asset-control', name: 'EntAssetControl', component: () => import('../views/asset-control/AssetControl.vue'), meta: { title: '资产管控' } },
        { path: 'project-mgmt', name: 'EntProjectMgmt', component: () => import('../views/project-mgmt/ProjectManagement.vue'), meta: { title: '项目管理' } },
        { path: 'property-rights', name: 'EntPropertyRights', component: () => import('../views/ent/Cert.vue'), meta: { title: '产权信息' } },
        { path: 'credential-info', name: 'EntCredentialInfo', component: () => import('../views/credential-info/CredentialInfo.vue'), meta: { title: '证件信息' } },
        { path: 'evaluation-info', name: 'EntEvaluationInfo', component: () => import('../views/evaluation-info/EvaluationInfo.vue'), meta: { title: '评估信息' } },
        { path: 'asset-transfer', name: 'EntAssetTransfer', component: () => import('../views/asset-transfer/AssetTransfer.vue'), meta: { title: '资产调拨' } },
        { path: 'lease-info', name: 'EntLeaseInfo', component: () => import('../views/lease-info/LeaseInfo.vue'), meta: { title: '租赁信息' } },
        { path: 'intangible-assets', name: 'EntIntangibleAssets', component: () => import('../views/ent/IntangibleAssets.vue'), meta: { title: '无形资产' } },
        { path: 'equity-investment', name: 'EntEquityInvestment', component: () => import('../views/ent/EquityInvestment.vue'), meta: { title: '股权投资' } },
        { path: 'asset-dispose', name: 'EntAssetDispose', component: () => import('../views/ent/AssetDispose.vue'), meta: { title: '资产处置' } },
        { path: 'mortgage-list', name: 'EntMortgageList', component: () => import('../views/mortgage/MortgageList.vue'), meta: { title: '抵押列表' } },

        // ===== 资产台账 =====
        { path: 'ledger-list', name: 'EntLedgerList', component: () => import('../views/AssetLedger/AssetLedger.vue'), meta: { title: '台账列表' } },
        { path: 'one-asset-one-code', name: 'EntOneAssetOneCode', component: () => import('../views/AssetLedger/AssetLedger.vue'), meta: { title: '一产一码' } },
        { path: 'change-records', name: 'EntChangeRecords', component: () => import('../views/change-records/ChangeRecords.vue'), meta: { title: '变更记录' } },

        // ===== 资产运营 =====
        { path: 'investment-publish', name: 'EntInvestmentPublish', component: () => import('../views/ent/LeaseRent.vue'), meta: { title: '招商发布' } },
        { path: 'lease-mgmt', name: 'EntLeaseMgmt', component: () => import('../views/lease-mgmt/LeaseMgmt.vue'), meta: { title: '租赁管理' } },
        { path: 'urge-rent', name: 'EntUrgeRent', component: () => import('../views/ent/Urge.vue'), meta: { title: '催租管理' } },
        { path: 'supervise', name: 'EntSupervise', component: () => import('../views/ent/Supervise.vue'), meta: { title: '督办协同' } },
        { path: 'rent-margin', name: 'EntRentMargin', component: () => import('../views/rent-margin/RentMargin.vue'), meta: { title: '租金差价' } },

        // ===== 合同管理 =====
        { path: 'contract-approval', name: 'EntContractApproval', component: () => import('../views/ent/Contract.vue'), meta: { title: '合同审批' } },
        { path: 'contract/:id', name: 'EntContractDetail', component: () => import('../views/ent/ContractDetail.vue'), meta: { title: '合同详情' } },
        { path: 'intent-ledger', name: 'EntIntentLedger', component: () => import('../views/intent-ledger/IntentLedger.vue'), meta: { title: '意向书台账' } },
        { path: 'e-signature', name: 'EntESignature', component: () => import('../views/e-signature/ESignature.vue'), meta: { title: '电子签章' } },

        // ===== 财务管理 =====
        { path: 'collection-hall', name: 'EntCollectionHall', component: () => import('../views/ent/Fee.vue'), meta: { title: '收费大厅' } },
        { path: 'user-bills', name: 'EntUserBills', component: () => import('../views/user-bills/UserBills.vue'), meta: { title: '用户账单' } },
        { path: 'deposit-return', name: 'EntDepositReturn', component: () => import('../views/deposit-return/DepositReturn.vue'), meta: { title: '保证金退还' } },
        { path: 'business-finance', name: 'EntBusinessFinance', component: () => import('../views/BusinessFinance/BusinessFinance.vue'), meta: { title: '业财一体化' } },
        { path: 'tax-management', name: 'EntTaxManagement', component: () => import('../views/tax-management/TaxManagement.vue'), meta: { title: '税费管理' } },
        { path: 'invoice-management', name: 'EntInvoiceManagement', component: () => import('../views/tax-management/InvoiceManagement.vue'), meta: { title: '发票管理' } },
        { path: 'debt', name: 'EntDebt', component: () => import('../views/ent/Debt.vue'), meta: { title: '资债全览' } },

        // ===== 资产地图 =====
        { path: 'map', name: 'EntAssetMap', component: () => import('../views/AssetMap/AssetMap.vue'), meta: { title: 'GIS地图' } },
        { path: 'region-division', name: 'EntRegionDivision', component: () => import('../views/AssetMap/AssetMap.vue'), meta: { title: '区域划分' } },

        // ===== 报表中心 =====
        { path: 'report-asset-stats', name: 'EntReportAssetStats', component: () => import('../views/report-center/ReportCenter.vue'), meta: { title: '资产统计报表' } },
        { path: 'report-operation-stats', name: 'EntReportOperationStats', component: () => import('../views/report-center/ReportCenter.vue'), meta: { title: '经营分析报表' } },
        { path: 'report-finance-stats', name: 'EntReportFinanceStats', component: () => import('../views/report-center/ReportCenter.vue'), meta: { title: '财务报表' } },
        { path: 'inventory', name: 'EntInventory', component: () => import('../views/inventory/InventoryCheck.vue'), meta: { title: '盘点清查' } },
        { path: 'report-inventory-stats', name: 'EntReportInventoryStats', component: () => import('../views/report-center/ReportCenter.vue'), meta: { title: '盘点报表' } },
        { path: 'report-repair-stats', name: 'EntReportRepairStats', component: () => import('../views/report-center/ReportCenter.vue'), meta: { title: '维修统计报表' } },
        { path: 'data-report', name: 'EntDataReport', component: () => import('../views/ent/Report.vue'), meta: { title: '数据上报' } },

        // ===== 固定资产管理 =====
        { path: 'fixed-assets', name: 'EntFixedAssets', component: () => import('../views/FixedAssetManagement/FixedAssetManagement.vue'), meta: { title: '固定资产管理' } },
        { path: 'fixed-asset-reports', name: 'EntFixedAssetReports', component: () => import('../views/FixedAssetReports/FixedAssetReports.vue'), meta: { title: '固定资产报表' } },
        { path: 'fixed-asset-settings', name: 'EntFixedAssetSettings', component: () => import('../views/FixedAssetSettings/FixedAssetSettings.vue'), meta: { title: '基础设置' } },

        // ===== 系统管理 =====
        { path: 'system/dept', name: 'EntSystemDept', component: () => import('../views/ent/SystemOrg.vue'), meta: { title: '部门管理' } },
        { path: 'system/role', name: 'EntSystemRole', component: () => import('../views/gov/SystemRole.vue'), meta: { title: '角色管理' } },
        { path: 'system/user', name: 'EntSystemUser', component: () => import('../views/gov/SystemRole.vue'), meta: { title: '用户管理' } },
        { path: 'system/dict', name: 'EntSystemDict', component: () => import('../views/ent/SystemDict.vue'), meta: { title: '数据字典' } },
        { path: 'system/params', name: 'EntSystemParams', component: () => import('../views/ent/SystemParams.vue'), meta: { title: '系统参数' } },
        { path: 'system/message-center', name: 'EntMessageCenter', component: () => import('../views/ent/MessageCenter.vue'), meta: { title: '消息中心' } },
        { path: 'system/msg-template', name: 'EntMessageTemplate', component: () => import('../views/ent/MessageTemplate.vue'), meta: { title: '消息模板' } },
        { path: 'system/log', name: 'EntSystemLog', component: () => import('../views/gov/SystemLog.vue'), meta: { title: '操作日志' } },
        { path: 'system/workflow', name: 'EntWorkflowConfig', component: () => import('../views/workflow-config/WorkflowConfig.vue'), meta: { title: '流程配置' } },
        { path: 'terminal-manage', name: 'EntTerminalManage', component: () => import('../views/terminal-manage/TerminalManage.vue'), meta: { title: '终端管理' } },

        // ===== 预警管理 =====
        { path: 'warning-tasks', name: 'EntWarningTasks', component: () => import('../views/ent/WarningTasks.vue'), meta: { title: '预警任务' } },
        { path: 'warning-config', name: 'EntWarningConfig', component: () => import('../views/ent/WarningConfig.vue'), meta: { title: '预警配置' } },

        // ===== 巡查管理 =====
        { path: 'inspection-plan', name: 'EntInspectionPlan', component: () => import('../views/InspectionMaintenance/InspectionMaintenance.vue'), meta: { title: '巡查计划' } },
        { path: 'inspection-records', name: 'EntInspectionRecords', component: () => import('../views/InspectionMaintenance/InspectionMaintenance.vue'), meta: { title: '巡查记录' } }
      ]
    },
    {
      path: '/placeholder',
      component: () => import('../layouts/EntLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Placeholder', component: () => import('../views/common/Placeholder.vue'), meta: { title: '功能规划中' } }
      ]
    },
    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.path === '/') {
    next(userStore.isLoggedIn ? userStore.user.home : '/login')
    return
  }

  if (to.path === '/login') {
    next(userStore.isLoggedIn ? userStore.user.home : undefined)
    return
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.endpoint && userStore.isLoggedIn && userStore.user.endpoint !== to.meta.endpoint) {
    next(userStore.user.home)
    return
  }

  next()
})

// H2 系统操作日志：每次进入业务页面记一条访问日志
let lastLogged = ''
router.afterEach((to) => {
  if (to.path === '/login' || to.path === '/' || !to.meta?.title) return
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) return
  const key = `${userStore.user.org}|${to.path}`
  if (key === lastLogged) return
  lastLogged = key
  const endpoint = to.meta.endpoint || userStore.user.endpoint || 'sys'
  useAuditStore().logOp({
    module: to.meta.title,
    action: '访问页面',
    target: to.path,
    detail: `${endpoint === 'gov' ? '监管端' : '企业端'} · ${to.meta.title}`,
    result: '成功'
  })
})

export default router
