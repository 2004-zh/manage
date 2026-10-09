import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAssetStore } from './asset'
import { useContractStore } from './contract'
import { useFinanceStore } from './finance'
import { useLeaseStore } from './lease'
import { useAuditStore } from './audit'
import { useCredentialStore } from './credential'
import { useControlStore } from './control'
import { useMortgageStore } from './mortgage'
import { useRevitalizeStore } from './revitalize'
import { useWarningStore } from './warning'

function formatNow() {
  return new Date().toLocaleString('zh-CN')
}

export const useDisposeStore = defineStore('dispose', () => {
  const records = ref([
    {
      id: 1, disposeNo: 'CZ-2026-001', assetName: '旧办公楼设备', method: '报废', bookValue: 25, disposeValue: 5,
      applicant: '张三', applyDate: '2026-03-20', status: '已完成', reason: '设备老化无法使用', remark: '',
      projectType: '资产产权', company: '城投集团', disposeDate: '2026-03-25', disposePerson: '张三',
      createdAt: '2026-03-20 09:10', updatedAt: '2026-03-25 16:00', disposeStatus: '完成',
      assetIds: [],
      assets: [
        { assetNo: 'CT-204', assetName: '吴航街道地下车位（12 个）', disposeType: '报废', amount: 3 },
        { assetNo: 'CT-207', assetName: '城区垃圾分类转运站设备（3 座）', disposeType: '报废', amount: 2 }
      ],
      approvalLevel: 1, totalLevels: 1,
      approvalSteps: [{ levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-21', result: '通过', isActive: false }],
      approvalLogs: [{ levelName: '部门经理审批', approver: '王建国', date: '2026-03-21 09:30', result: '通过', comment: '设备确实已无法使用，同意报废' }]
    },
    {
      id: 2, disposeNo: 'CZ-2026-002', assetName: '城关旧厂房1#', method: '出售', bookValue: 280, disposeValue: 320,
      applicant: '李四', applyDate: '2026-03-15', status: '已通过', reason: '闲置资产盘活', remark: '已通过公开竞价出售',
      projectType: '资产产权', company: '城投集团', disposeDate: '2026-03-28', disposePerson: '李四',
      createdAt: '2026-03-15 10:20', updatedAt: '2026-03-28 11:30', disposeStatus: '完成',
      assetIds: [],
      assets: [
        { assetNo: 'CT-001', assetName: '城关旧厂房1#主体', disposeType: '出售', amount: 280 },
        { assetNo: 'CT-002', assetName: '城关旧厂房1#附属仓库', disposeType: '出售', amount: 40 }
      ],
      approvalLevel: 3, totalLevels: 3,
      approvalSteps: [
        { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-16', result: '通过', isActive: false },
        { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '2026-03-17', result: '通过', isActive: false },
        { levelName: '总经理审批', approver: '刘大伟（总经理）', date: '2026-03-18', result: '通过', isActive: false },
      ],
      approvalLogs: [
        { levelName: '部门经理审批', approver: '王建国', date: '2026-03-16 10:00', result: '通过', comment: '同意出售，建议公开竞价' },
        { levelName: '分管领导审批', approver: '陈志明', date: '2026-03-17 14:20', result: '通过', comment: '金额合理，同意' },
        { levelName: '总经理审批', approver: '刘大伟', date: '2026-03-18 09:15', result: '通过', comment: '批准出售，请做好资产评估' },
      ]
    },
    {
      id: 3, disposeNo: 'CZ-2026-003', assetName: '运输车辆', method: '转让', bookValue: 45, disposeValue: 38,
      applicant: '张三', applyDate: '2026-03-10', status: '待审批', reason: '车辆更新换代', remark: '',
      projectType: '分区产权', company: '产投集团', disposeDate: '2026-03-30', disposePerson: '王五',
      createdAt: '2026-03-10 08:45', updatedAt: '2026-03-10 08:45', disposeStatus: '进行中',
      assetIds: [],
      assets: [
        { assetNo: 'CT-201', assetName: '城投集团公务车 闽A·D1234', disposeType: '转让', amount: 25 },
        { assetNo: 'CT-202', assetName: '漳港港区货运车 闽A·T5678', disposeType: '转让', amount: 13 }
      ],
      approvalLevel: 1, totalLevels: 2,
      approvalSteps: [
        { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '', result: '', isActive: true },
        { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '', result: '', isActive: false },
      ],
      approvalLogs: []
    },
    {
      id: 4, disposeNo: 'CZ-2026-004', assetName: '旧空调设备', method: '报废', bookValue: 12, disposeValue: 2,
      applicant: '李四', applyDate: '2026-03-05', status: '已驳回', reason: '达到使用年限', remark: '需提供技术鉴定报告',
      projectType: '资产产权', company: '水投集团', disposeDate: '2026-03-15', disposePerson: '李四',
      createdAt: '2026-03-05 15:00', updatedAt: '2026-03-06 11:00', disposeStatus: '取消',
      assetIds: [],
      assets: [
        { assetNo: 'CT-209', assetName: '首占新区社区健身器材一批', disposeType: '报废', amount: 2 }
      ],
      approvalLevel: 1, totalLevels: 1,
      approvalSteps: [
        { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-03-06', result: '驳回', isActive: false },
      ],
      approvalLogs: [
        { levelName: '部门经理审批', approver: '王建国', date: '2026-03-06 11:00', result: '驳回', comment: '请提供技术鉴定报告后再申请' },
      ]
    },
    {
      id: 5, disposeNo: 'CZ-2026-005', assetName: '江田农贸市场2#', method: '出售', bookValue: 560, disposeValue: 680,
      applicant: '王五', applyDate: '2026-04-01', status: '待审批', reason: '市场经营不善，整体出售', remark: '已委托评估机构评估',
      projectType: '分区产权', company: '领航公司', disposeDate: '2026-04-30', disposePerson: '赵六',
      createdAt: '2026-04-01 09:30', updatedAt: '2026-04-02 09:00', disposeStatus: '进行中',
      assetIds: [],
      assets: [
        { assetNo: 'CT-005', assetName: '江田镇仓储用地', disposeType: '出售', amount: 600 },
        { assetNo: 'CT-007', assetName: '吴航农贸市场', disposeType: '出售', amount: 80 }
      ],
      approvalLevel: 2, totalLevels: 4,
      approvalSteps: [
        { levelName: '部门经理审批', approver: '王建国（部门经理）', date: '2026-04-02', result: '通过', isActive: false },
        { levelName: '分管领导审批', approver: '陈志明（分管领导）', date: '', result: '', isActive: true },
        { levelName: '总经理审批', approver: '刘大伟（总经理）', date: '', result: '', isActive: false },
        { levelName: '国资中心备案', approver: '国资中心', date: '', result: '', isActive: false },
      ],
      approvalLogs: [
        { levelName: '部门经理审批', approver: '王建国', date: '2026-04-02 09:00', result: '通过', comment: '同意出售，金额较大，请逐级审批' },
      ]
    },
  ])

  function getApprovalLevels(value) {
    if (value >= 500) return { total: 4, levels: ['部门经理', '分管领导', '总经理', '国资中心备案'] }
    if (value >= 200) return { total: 3, levels: ['部门经理', '分管领导', '总经理'] }
    if (value >= 50) return { total: 2, levels: ['部门经理', '分管领导'] }
    return { total: 1, levels: ['部门经理'] }
  }

  function buildApprovalSteps(value) {
    const { total, levels } = getApprovalLevels(value)
    const approvers = ['王建国（部门经理）', '陈志明（分管领导）', '刘大伟（总经理）', '国资中心']
    return levels.map((name, idx) => ({
      levelName: `${name}审批`,
      approver: idx < total ? approvers[idx] : '',
      date: '',
      result: '',
      isActive: idx === 0
    }))
  }

  function addRecord(data) {
    const now = formatNow()
    const { total } = getApprovalLevels(data.disposeValue)
    const rec = {
      id: Date.now(),
      disposeNo: `CZ-${new Date().getFullYear()}-${String(records.value.length + 1).padStart(3, '0')}`,
      assetName: data.assetName,
      method: data.method,
      bookValue: data.bookValue || 0,
      disposeValue: data.disposeValue,
      applicant: data.applicant || '当前用户',
      applyDate: new Date().toISOString().slice(0, 10),
      status: '待审批',
      reason: data.reason || '',
      remark: data.remark || '',
      projectType: data.projectType || '资产产权',
      company: data.company,
      disposeDate: data.disposeDate || new Date().toISOString().slice(0, 10),
      disposePerson: data.disposePerson || '当前用户',
      createdAt: now,
      updatedAt: now,
      disposeStatus: '进行中',
      assetIds: data.assetIds || [],
      assets: data.assets || [],
      approvalLevel: 1,
      totalLevels: total,
      approvalSteps: buildApprovalSteps(data.disposeValue),
      approvalLogs: []
    }
    records.value.unshift(rec)
    return rec
  }

  function updateRecord(id, updates) {
    const r = records.value.find(x => x.id === id)
    if (!r) return false
    Object.assign(r, updates, { updatedAt: formatNow() })
    return true
  }

  function removeRecord(id) {
    const idx = records.value.findIndex(x => x.id === id)
    if (idx !== -1) records.value.splice(idx, 1)
  }

  function approveRecord(id, comment) {
    const row = records.value.find(x => x.id === id)
    if (!row) return false
    const activeStep = row.approvalSteps.find(s => s.isActive)
    if (!activeStep) return false
    const now = formatNow()
    activeStep.result = '通过'
    activeStep.date = now.slice(0, 10)
    activeStep.isActive = false
    row.approvalLogs.push({
      levelName: activeStep.levelName,
      approver: activeStep.approver.split('（')[0],
      date: now,
      result: '通过',
      comment
    })
    const nextStep = row.approvalSteps.find(s => !s.result && s !== activeStep)
    if (nextStep) {
      nextStep.isActive = true
      row.approvalLevel++
    } else {
      row.status = '已通过'
    }
    row.updatedAt = now
    return true
  }

  function rejectRecord(id, comment) {
    const row = records.value.find(x => x.id === id)
    if (!row) return false
    const activeStep = row.approvalSteps.find(s => s.isActive)
    if (!activeStep) return false
    const now = formatNow()
    activeStep.result = '驳回'
    activeStep.date = now.slice(0, 10)
    activeStep.isActive = false
    row.status = '已驳回'
    row.disposeStatus = '取消'
    row.approvalLogs.push({
      levelName: activeStep.levelName,
      approver: activeStep.approver.split('（')[0],
      date: now,
      result: '驳回',
      comment
    })
    row.updatedAt = now
    return true
  }

  // 处置完成：标记资产状态为"已处置"，关联数据标记而非删除
  function completeDispose(id) {
    const row = records.value.find(x => x.id === id)
    if (!row) return false
    const now = formatNow()
    row.disposeStatus = '完成'
    row.status = row.status === '已通过' ? '已完成' : row.status
    row.updatedAt = now

    const assetStore = useAssetStore()
    const contractStore = useContractStore()
    const financeStore = useFinanceStore()
    const leaseStore = useLeaseStore()
    const auditStore = useAuditStore()
    const credentialStore = useCredentialStore()
    const controlStore = useControlStore()
    const mortgageStore = useMortgageStore()
    const revitalizeStore = useRevitalizeStore()
    const warningStore = useWarningStore()

    const statusMap = { '出售': '已处置', '转让': '已处置', '报废': '已报废', '其他': '已处置' }
    const newStatus = statusMap[row.method] || '已处置'

    const targetIds = [...(row.assetIds || [])]
    if (row.assets) {
      row.assets.forEach(a => {
        if (a.assetNo && !targetIds.includes(a.assetNo)) targetIds.push(a.assetNo)
      })
    }

    targetIds.forEach(aid => {
      const asset = assetStore.getAssetById(aid)
      if (!asset) return
      const assetName = asset.name || asset.assetName || row.assetName

      // 资产主记录：状态归档，不删除
      assetStore.updateAsset(aid, {
        status: newStatus,
        useStatus: '已处置',
        forRent: '否',
        disposalDate: row.disposeDate,
        disposalMethod: row.method,
        disposalValue: row.disposeValue,
        disposalNo: row.disposeNo
      }, { module: '资产处置', action: `处置完成（${row.method}）`, remark: `处置编号 ${row.disposeNo}，金额 ${row.disposeValue} 万元` })

      // 合同：标记终止，不删除
      contractStore.contracts.forEach(c => {
        if (c.assetId === aid) {
          c.status = '已终止'
          c.terminationDate = row.disposeDate
          c.remark = (c.remark ? c.remark + '；' : '') + `资产${assetName}已处置（${row.method}）`
        }
      })

      // 收费记录：标记不再计入收入
      contractStore.feeRecords.forEach(f => {
        if (f.assetId === aid || (f.contractId && contractStore.contracts.some(c => c.id === f.contractId && c.assetId === aid))) {
          f.assetDeleted = true
          f.remark = (f.remark ? f.remark + '；' : '') + `资产${assetName}已处置，不再计入收入`
        }
      })

      // 账单：标记不再计入收入
      financeStore.bills.forEach(b => {
        if (b.assetId === aid || (b.contractId && contractStore.contracts.some(c => c.id === b.contractId && c.assetId === aid))) {
          b.assetDeleted = true
          b.remark = (b.remark ? b.remark + '；' : '') + `资产${assetName}已处置，不再计入收入`
        }
      })

      // 保证金：标记
      financeStore.deposits.forEach(d => {
        if (d.assetId === aid) {
          d.assetDeleted = true
          d.remark = (d.remark ? d.remark + '；' : '') + `资产${assetName}已处置`
        }
      })

      // 招租：标记撤销
      leaseStore.releases.forEach(r => {
        if (r.assetId === aid) {
          r.status = '已撤销'
          r.remark = (r.remark ? r.remark + '；' : '') + `资产${assetName}已处置`
        }
      })
      leaseStore.notices.filter(n => n.assetId === aid).forEach(n => {
        n.status = '已撤销'
      })

      // 权证：标记失效
      credentialStore.credentials.forEach(c => {
        if (c.assetId === aid) {
          c.validUntil = row.disposeDate
          c.remark = (c.remark ? c.remark + '；' : '') + `资产${assetName}已处置，权证随资产归档`
        }
      })

      // 管控规则：解除
      controlStore.rules.forEach(r => {
        if (r.assetId === aid && r.status === '生效中') {
          r.status = '已解除'
          r.remark = (r.remark ? r.remark + '；' : '') + `资产${assetName}已处置，管控规则自动解除`
        }
      })

      // 抵押：标记解押
      mortgageStore.mortgages.forEach(m => {
        if (m.assetId === aid && m.status === '抵押中') {
          m.status = '已解押'
          m.remark = (m.remark ? m.remark + '；' : '') + `资产${assetName}已处置（${row.method}），抵押自动解除`
        }
      })

      // 盘活：记录处置流转
      revitalizeStore.recordRevitalize({
        assetId: aid,
        assetName,
        year: new Date().getFullYear(),
        method: '处置',
        detail: `${row.method}，金额 ${row.disposeValue} 万元（${row.disposeNo}）`,
        amount: row.disposeValue,
        sourceType: 'dispose',
        docNo: row.disposeNo
      })

      // 预警：完结相关预警任务
      warningStore.warningTasks.forEach(t => {
        const token = String(t.asset || '').trim().split(/\s+/)[0]
        if (token === aid && t.status !== '已完成' && t.status !== '已审核') {
          warningStore.updateTaskStatus(t.id, '已完成', { remark: `资产${assetName}已处置，预警自动完结` })
        }
      })
    })

    return true
  }

  function cancelDispose(id) {
    const row = records.value.find(x => x.id === id)
    if (!row) return false
    row.disposeStatus = '取消'
    row.updatedAt = formatNow()
    return true
  }

  return {
    records,
    addRecord,
    updateRecord,
    removeRecord,
    approveRecord,
    rejectRecord,
    completeDispose,
    cancelDispose,
    getApprovalLevels,
    buildApprovalSteps
  }
})
