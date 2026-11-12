<template>
  <div class="page-container">
    <div class="page-header">
      <h2>组织架构</h2>
      <div class="head-right">
        <el-tag size="small" type="info">当前范围：{{ scopeLabel }}</el-tag>
        <span class="sub-hint">公司下设子公司与部门，人员只归属一个组织节点；点左侧树可把下方三张表收窄到该节点及其下级</span>
      </div>
    </div>

    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="组织名称">
          <el-input v-model="deptQuery.name" placeholder="公司或部门名称" clearable style="width:180px" @keyup.enter="applyDeptQuery" />
        </el-form-item>
        <el-form-item label="人员名称">
          <el-input v-model="deptQuery.person" placeholder="在编人员姓名" clearable style="width:180px" @keyup.enter="applyDeptQuery" />
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="deptQuery.companyId" placeholder="请选择公司" clearable filterable style="width:220px">
            <el-option v-for="c in scopedCompanies" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="applyDeptQuery">查询</el-button>
          <el-button plain @click="resetDeptQuery">重置</el-button>
          <el-button type="primary" plain :icon="Plus" @click="openAddNode(null)">新增组织</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="org-split">
      <el-card shadow="never">
        <template #header>
          <div class="card-head">
            <span>组织树</span>
            <el-button v-if="selectedNodeId" type="primary" link size="small" @click="selectedNodeId = ''">显示全部</el-button>
            <span v-else class="sub-hint">全部节点</span>
          </div>
        </template>
        <el-tree
          :data="treeData"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :current-node-key="selectedNodeId"
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <div class="node-row">
              <span class="node-name">{{ node.label }}</span>
              <span class="node-tail">
                <el-tag v-if="data.status === '已停用'" type="info" size="small">停用</el-tag>
                <span class="num muted">{{ data.totalMembers }}人</span>
              </span>
            </div>
          </template>
        </el-tree>
      </el-card>

      <el-card shadow="never" class="fill">
        <template #header>
          <div class="card-head">
            <span>组织节点{{ selectionHint }}</span>
            <span class="sub-hint">共 {{ filteredNodes.length }} 个节点</span>
          </div>
        </template>
        <el-table :data="pagedNodes" border stripe>
          <el-table-column prop="code" label="编号" width="90" class-name="num">
            <template #default="{ row }"><span v-if="row.code">{{ row.code }}</span><span v-else class="muted">—</span></template>
          </el-table-column>
          <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.name }}</span>
              <span v-if="row.shortName" class="muted">（{{ row.shortName }}）</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === '公司' ? 'primary' : 'success'" size="small">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="companyName" label="所属公司" min-width="150" show-overflow-tooltip>
            <template #default="{ row }"><span>{{ row.type === '公司' ? '—' : row.companyName || '未挂公司' }}</span></template>
          </el-table-column>
          <el-table-column prop="manager" label="负责人" width="90">
            <template #default="{ row }"><span v-if="row.manager">{{ row.manager }}</span><span v-else class="muted">未设置</span></template>
          </el-table-column>
          <el-table-column label="在编人员" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.memberCount">{{ row.memberNames }}</span>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="人数" width="70" align="center" class-name="num">
            <template #default="{ row }">{{ row.memberCount }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === '正常' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" />
          <el-table-column label="操作" width="290" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openAddNode(row)">新增下级</el-button>
              <el-button type="primary" link size="small" @click="openEditNode(row)">编辑</el-button>
              <el-button type="primary" link size="small" @click="openMembers(row)">人员</el-button>
              <el-button type="warning" link size="small" @click="toggleNodeStatus(row)">{{ row.status === '正常' ? '停用' : '启用' }}</el-button>
              <el-button type="danger" link size="small" @click="removeNode(row)">删除</el-button>
            </template>
          </el-table-column>
          <template #empty><el-empty description="没有符合条件的组织节点" :image-size="60" /></template>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="nodePage.current"
            v-model:page-size="nodePage.size"
            :total="filteredNodes.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </el-card>
    </div>

    <div class="section-title">组织人员</div>
    <el-card shadow="never" class="fill">
      <template #header>
        <div class="card-head">
          <span>在编用户{{ selectionHint }}</span>
          <div>
            <span class="sub-hint">共 {{ filteredUsers.length }} 人</span>
            <el-checkbox v-if="unassignedCount" v-model="onlyUnassigned" :label="`只看未分配（${unassignedCount}）`" />
            <el-button type="primary" size="small" @click="openAddUser">新增用户</el-button>
          </div>
        </div>
      </template>
      <el-table :data="pagedUsers" border stripe>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column label="所属组织" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="row.nodeId">
              <span>{{ row.nodePath }}</span>
              <el-tag v-if="row.nodeStatus === '已停用'" type="warning" size="small">归属已停用</el-tag>
            </template>
            <el-tag v-else type="danger" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" class-name="num" />
        <el-table-column prop="email" label="邮箱" min-width="170" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditUser(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="openTransfer(row)">调岗</el-button>
            <el-button type="danger" link size="small" @click="removeUser(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="该范围内暂无在编用户" :image-size="60" /></template>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="userPage.current"
          v-model:page-size="userPage.size"
          :total="filteredUsers.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <div class="section-title">公司收款配置</div>
    <el-card shadow="never" class="fill">
      <template #header>
        <div class="card-head">
          <span>收款账户与归属{{ selectionHint }}</span>
          <el-button type="primary" size="small" @click="openAddNode(selectedCompanyParent || scopeRoot, '公司')">新增公司</el-button>
        </div>
      </template>
      <el-table :data="pagedCompanies" border stripe>
        <el-table-column prop="name" label="公司名称" min-width="170" show-overflow-tooltip />
        <el-table-column prop="shortName" label="简称" width="100">
          <template #default="{ row }"><span v-if="row.shortName">{{ row.shortName }}</span><span v-else class="muted">—</span></template>
        </el-table-column>
        <el-table-column label="上级单位" min-width="150" show-overflow-tooltip>
          <template #default="{ row }"><span>{{ row.parentName || '顶级单位' }}</span></template>
        </el-table-column>
        <el-table-column prop="collectionMode" label="收款模式" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.collectionMode === '独立收款' ? 'success' : 'warning'" size="small">{{ row.collectionMode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统收归属" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.collectionMode === '上级统收'" class="link-text">{{ row.collectorName || '归属单位已失效' }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="bankName" label="开户行" min-width="150" show-overflow-tooltip>
          <template #default="{ row }"><span v-if="row.bankName">{{ row.bankName }}</span><span v-else class="muted">未填写</span></template>
        </el-table-column>
        <el-table-column prop="bankAccount" label="银行账号" min-width="180">
          <template #default="{ row }"><span v-if="row.bankAccount" class="mono">{{ row.bankAccount }}</span><span v-else class="muted">未填写</span></template>
        </el-table-column>
        <el-table-column prop="accountName" label="账户名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }"><span>{{ row.accountName || row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="cnapsCode" label="联行号" width="130" class-name="num">
          <template #default="{ row }"><span v-if="row.cnapsCode">{{ row.cnapsCode }}</span><span v-else class="muted">—</span></template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditNode(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="openMembers(row)">人员</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="该范围内暂无公司节点" :image-size="60" /></template>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="companyPage.current"
          v-model:page-size="companyPage.size"
          :total="scopedFilteredCompanies.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <el-dialog v-model="nodeDialog.visible" :title="nodeDialogTitle" width="760px" destroy-on-close>
      <el-form :model="nodeForm" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="节点类型" required>
              <el-radio-group v-model="nodeForm.type" :disabled="!!nodeDialog.id" @change="onNodeTypeChange">
                <el-radio v-for="t in ORG_TYPES" :key="t" :value="t">{{ t }}</el-radio>
              </el-radio-group>
              <div class="form-tip">类型决定字段口径，已建节点不能改类型，需新建后停用旧节点</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级组织">
              <el-select v-model="nodeForm.parentId" placeholder="无（顶级单位）" clearable filterable style="width:100%">
                <el-option v-for="p in parentNodeOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
              <div v-if="!nodeDialog.id" class="form-tip">下级节点的编号按上级自动生成，部门编号为 BM-xxx</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名称" required>
              <el-input v-model="nodeForm.name" placeholder="请输入公司或部门名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="简称">
              <el-input v-model="nodeForm.shortName" placeholder="请输入简称" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col v-if="nodeDialog.id && nodeForm.type === '部门'" :span="12">
            <el-form-item label="部门编号">
              <el-input :model-value="nodeForm.code" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-input v-model="nodeForm.manager" placeholder="审批链需要，建议填写" maxlength="20" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="nodeForm.sort" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="nodeForm.phone" placeholder="请输入联系电话" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地址">
              <el-input v-model="nodeForm.address" placeholder="请输入地址" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="nodeForm.type === '公司' ? '统一社会信用代码' : '部门代码'">
              <el-input v-model="nodeForm.orgCode" placeholder="请输入代码" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="nodeForm.type === '公司'">
          <el-divider content-position="left">公司信息与收款口径</el-divider>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="公司类型">
                <el-select v-model="nodeForm.companyType" placeholder="请选择公司类型" clearable style="width:100%">
                  <el-option v-for="t in COMPANY_TYPES" :key="t" :label="t" :value="t" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收款模式" required>
                <el-radio-group v-model="nodeForm.collectionMode">
                  <el-radio v-for="m in COLLECTION_MODES" :key="m" :value="m">{{ m }}</el-radio>
                </el-radio-group>
                <div class="form-tip">{{ nodeForm.collectionMode === '独立收款' ? '租金收入直接进入本公司账户' : '租金收入归集到上级统收单位账户' }}</div>
              </el-form-item>
            </el-col>
            <el-col v-if="nodeForm.collectionMode === '上级统收'" :span="12">
              <el-form-item label="统收归属" required>
                <el-select v-model="nodeForm.parentCollectorId" placeholder="选择独立收款的上级单位" clearable filterable style="width:100%">
                  <el-option v-for="c in collectorList" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="nodeForm.collectionMode === '独立收款' ? '开户行' : '开户行（选填）'">
                <el-input v-model="nodeForm.bankName" placeholder="如：中国工商银行城南支行" maxlength="50" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="nodeForm.collectionMode === '独立收款' ? '银行账号' : '银行账号（选填）'">
                <el-input v-model="nodeForm.bankAccount" placeholder="请输入银行账号" maxlength="40" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账户名称">
                <el-input v-model="nodeForm.accountName" :placeholder="nodeForm.name || '默认同公司名称'" maxlength="50" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联行号">
                <el-input v-model="nodeForm.cnapsCode" placeholder="12位联行号（选填）" maxlength="12" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="备注">
          <el-input v-model="nodeForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="nodeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitNode">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userDialog.visible" :title="userDialog.id ? '编辑用户' : '新增用户'" width="600px" destroy-on-close>
      <el-form :model="userForm" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="用户名" required>
              <el-input v-model="userForm.username" :disabled="!!userDialog.id" placeholder="登录账号，创建后不可改" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" required>
              <el-input v-model="userForm.name" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属组织" required>
              <el-select v-model="userForm.nodeId" placeholder="请选择所属公司或部门" filterable style="width:100%">
                <el-option v-for="n in assignableOptions" :key="n.id" :label="n.name" :value="n.id" />
              </el-select>
              <div class="form-tip">优先归到具体部门；挂在单位本部的，按部门统计时不计入</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" required>
              <el-select v-model="userForm.role" placeholder="请选择角色" style="width:100%">
                <el-option v-for="r in ROLE_OPTIONS" :key="r" :label="r" :value="r" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="userForm.phone" placeholder="11位手机号" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="userForm.enabled" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="邮箱">
              <el-input v-model="userForm.email" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="userDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="membersDialog.visible" :title="`人员分配 · ${membersDialog.node?.name || ''}`" width="560px" destroy-on-close>
      <div class="member-tip">勾选即调入本部门，取消勾选即调出。一个人只归属一个组织节点，调岗会同步改其归属。</div>
      <el-checkbox-group v-model="selectedMemberIds">
        <div v-for="u in memberCandidates" :key="u.id" class="member-row">
          <el-checkbox :value="u.id">
            {{ u.name }}（{{ u.role }} · 现属：{{ u.nodePath || '未分配' }}）
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <el-empty v-if="!memberCandidates.length" description="范围内暂无可分配人员，请先到「组织人员」新增用户" :image-size="60" />
      <template #footer>
        <el-button @click="membersDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitMembers">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferDialog.visible" :title="`人员调动 · ${transferDialog.user?.name || ''}`" width="480px" destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="当前归属">
          <span>{{ transferDialog.user?.nodePath || '未分配' }}</span>
        </el-form-item>
        <el-form-item label="调入组织" required>
          <el-select v-model="transferTargetId" placeholder="请选择目标公司或部门" filterable style="width:100%">
            <el-option v-for="n in assignableOptions" :key="n.id" :label="n.name" :value="n.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitTransfer">确认调动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useOrgStore, ORG_TYPES, COLLECTION_MODES, ROLE_OPTIONS } from '../../store/org'
import { useUserStore } from '../../store/user'

const COMPANY_TYPES = ['有限责任公司', '股份有限公司', '国有独资公司', '合伙企业']

const orgStore = useOrgStore()
const userStore = useUserStore()

/* ---------------- 数据范围：企业端只看本集团，监管端看全区 ---------------- */

const scopeNode = computed(() => {
  if (!userStore.isEnt) return null
  const org = userStore.user?.org
  if (!org) return null
  return orgStore.companyNodes.find(n => n.name === org) || null
})
const scopeLabel = computed(() => scopeNode.value ? scopeNode.value.name : '全区（各集团与国资中心）')
const scopeRoot = computed(() => scopeNode.value)

/** 范围内的节点 id 集合；监管端为 null 表示不限 */
const scopeIds = computed(() => scopeNode.value ? orgStore.descendantIds(scopeNode.value.id) : null)

const scopedNodes = computed(() => {
  const list = scopeIds.value ? orgStore.flatNodes.filter(n => scopeIds.value.has(n.id)) : orgStore.flatNodes
  return list.map(n => ({
    ...n,
    memberNames: orgStore.directMembers(n.id).map(u => u.name).join('、'),
    parentName: n.parentId ? (orgStore.nodeById.get(n.parentId)?.name || '') : '',
    collectorName: n.parentCollectorId ? (orgStore.nodeById.get(n.parentCollectorId)?.name || '') : ''
  }))
})

const treeData = computed(() => scopeNode.value ? orgStore.subtreeOf(scopeNode.value.id) : orgStore.tree)

/* ---------------- 组织树选中：按「自身 + 全部后代」收窄三张表 ---------------- */

const selectedNodeId = ref('')
const selectionHint = computed(() => {
  if (!selectedNodeId.value) return ''
  const node = orgStore.nodeById.get(selectedNodeId.value)
  return node ? ` · ${node.name}及其下级` : ''
})
const filterIds = computed(() => {
  if (selectedNodeId.value) return orgStore.descendantIds(selectedNodeId.value)
  return scopeIds.value
})

const handleNodeClick = (data) => {
  selectedNodeId.value = selectedNodeId.value === data.id ? '' : data.id
}

/* ---------------- 组织节点列表 ---------------- */

const deptQuery = reactive({ name: '', person: '', companyId: '' })
const appliedQuery = reactive({ name: '', person: '', companyId: '' })

const applyDeptQuery = () => {
  appliedQuery.name = deptQuery.name.trim()
  appliedQuery.person = deptQuery.person.trim()
  appliedQuery.companyId = deptQuery.companyId
  nodePage.current = 1
}

const resetDeptQuery = () => {
  deptQuery.name = ''
  deptQuery.person = ''
  deptQuery.companyId = ''
  applyDeptQuery()
}

const filteredNodes = computed(() => {
  const ids = filterIds.value
  return scopedNodes.value.filter(n => {
    if (ids && !ids.has(n.id)) return false
    if (appliedQuery.name && !n.name.includes(appliedQuery.name) && !(n.shortName || '').includes(appliedQuery.name)) return false
    if (appliedQuery.person) {
      // 人员命中按节点子树里的具体姓名判断，不再在顿号拼接的成员快照串里做子串匹配
      const ids = orgStore.descendantIds(n.id)
      const hit = orgStore.users.some(u => ids.has(u.nodeId) && u.name.includes(appliedQuery.person))
      if (!hit) return false
    }
    if (appliedQuery.companyId && n.companyId !== appliedQuery.companyId) return false
    return true
  }).sort((a, b) => {
    // 登记类列表默认按创建时间倒序，并列时编号大的在前（新编号一定更大）
    if (a.createTime !== b.createTime) return a.createTime < b.createTime ? 1 : -1
    return String(a.code || '').localeCompare(String(b.code || '')) * -1
  })
})

const nodePage = reactive({ current: 1, size: 10 })
const pagedNodes = computed(() => filteredNodes.value.slice((nodePage.current - 1) * nodePage.size, nodePage.current * nodePage.size))

const scopedCompanies = computed(() => scopedNodes.value.filter(n => n.type === '公司'))
const selectedCompanyParent = computed(() => {
  const node = selectedNodeId.value ? orgStore.nodeById.get(selectedNodeId.value) : null
  if (!node) return null
  return node.type === '公司' ? node : orgStore.companyNodeOf(node.id)
})

const scopedFilteredCompanies = computed(() => {
  const ids = filterIds.value
  const list = scopedCompanies.value.filter(c => {
    if (ids && !ids.has(c.id)) return false
    if (appliedQuery.name && !c.name.includes(appliedQuery.name)) return false
    if (appliedQuery.companyId && c.id !== appliedQuery.companyId && c.companyId !== appliedQuery.companyId) return false
    return true
  })
  return list.sort((a, b) => a.createTime < b.createTime ? 1 : -1)
})
const companyPage = reactive({ current: 1, size: 10 })
const pagedCompanies = computed(() => scopedFilteredCompanies.value.slice((companyPage.current - 1) * companyPage.size, companyPage.current * companyPage.size))

/* ---------------- 组织人员 ---------------- */

const onlyUnassigned = ref(false)
/** 调出部门后还没落到新组织的人必须看得见，否则就掉进黑洞 */
const unassignedCount = computed(() => orgStore.users.filter(u => !u.nodeId).length)

const filteredUsers = computed(() => {
  const rows = orgStore.users.map(u => ({
    ...u,
    nodePath: u.nodeId ? orgStore.pathOf(u.nodeId) : '',
    // 归属节点被停用后要立刻看得见，否则这些人在编却无处可寻
    nodeStatus: u.nodeId ? (orgStore.nodeById.get(u.nodeId)?.status || '') : ''
  }))
  const list = onlyUnassigned.value
    ? rows.filter(u => !u.nodeId)
    : rows.filter(u => {
        if (!u.nodeId) return false
        const ids = filterIds.value
        return ids ? ids.has(u.nodeId) : true
      })
  // 同样按登记时间倒序，并列时用户名靠后
  return list.sort((a, b) => (a.createTime === b.createTime ? String(b.username).localeCompare(String(a.username)) : (a.createTime < b.createTime ? 1 : -1)))
})
const userPage = reactive({ current: 1, size: 10 })
const pagedUsers = computed(() => filteredUsers.value.slice((userPage.current - 1) * userPage.size, userPage.current * userPage.size))

// 树选中、筛选条件、未分配开关变化都必须回到第 1 页，否则会停在越界空页
watch([selectedNodeId, onlyUnassigned, () => ({ ...appliedQuery })], () => {
  nodePage.current = 1
  userPage.current = 1
  companyPage.current = 1
})
watch([() => nodePage.size, () => userPage.size, () => companyPage.size], () => {
  nodePage.current = 1
  userPage.current = 1
  companyPage.current = 1
})

/* ---------------- 节点弹窗 ---------------- */

const nodeDialog = reactive({ visible: false, id: '' })
const emptyNodeForm = () => ({
  type: '部门', parentId: '', name: '', code: '', shortName: '', manager: '', address: '', phone: '',
  orgCode: '', remark: '', sort: 0,
  companyType: '', collectionMode: '独立收款', parentCollectorId: '', bankName: '', bankAccount: '', accountName: '', cnapsCode: ''
})
const nodeForm = ref(emptyNodeForm())
const nodeDialogTitle = computed(() => nodeDialog.id ? '编辑组织节点' : `新增${nodeForm.value.type}`)

/** 上级候选按节点类型收窄：公司只能挂在上级单位下，部门可挂在单位或上级部门下 */
const parentNodeOptions = computed(() => {
  let options = orgStore.parentOptions(nodeDialog.id)
  // 企业端只能在本集团内部安排上下级，跨集团改挂是监管端（全区范围）的动作
  if (scopeIds.value) options = options.filter(o => scopeIds.value.has(o.id))
  if (nodeForm.value.type === '公司') return options.filter(o => o.type === '公司')
  return options
})
const collectorList = computed(() => orgStore.collectorOptions(nodeDialog.id))

function onNodeTypeChange() {
  // 切成公司时，原来选的部门上级不再合法，清空让用户重选，避免提交才报错
  const parent = nodeForm.value.parentId ? orgStore.nodeById.get(nodeForm.value.parentId) : null
  if (nodeForm.value.type === '公司' && parent && parent.type !== '公司') nodeForm.value.parentId = ''
}

function openAddNode(parentNode, presetType = '部门') {
  nodeDialog.id = ''
  nodeForm.value = emptyNodeForm()
  nodeForm.value.type = presetType
  if (parentNode) nodeForm.value.parentId = parentNode.id
  nodeDialog.visible = true
}

function openEditNode(row) {
  nodeDialog.id = row.id
  nodeForm.value = {
    ...emptyNodeForm(),
    type: row.type,
    parentId: row.parentId || '',
    name: row.name,
    code: row.code || '',
    shortName: row.shortName || '',
    manager: row.manager || '',
    address: row.address || '',
    phone: row.phone || '',
    orgCode: row.orgCode || '',
    remark: row.remark || '',
    sort: row.sort || 0,
    companyType: row.companyType || '',
    collectionMode: row.collectionMode || '独立收款',
    parentCollectorId: row.parentCollectorId || '',
    bankName: row.bankName || '',
    bankAccount: row.bankAccount || '',
    accountName: row.accountName || '',
    cnapsCode: row.cnapsCode || ''
  }
  nodeDialog.visible = true
}

function submitNode() {
  const payload = { ...nodeForm.value, parentId: nodeForm.value.parentId || null }
  const res = nodeDialog.id ? orgStore.updateNode(nodeDialog.id, payload) : orgStore.addNode(payload)
  if (!res.ok) { ElMessage.warning(res.msg); return }
  ElMessage.success(res.msg)
  nodeDialog.visible = false
}

function toggleNodeStatus(row) {
  if (row.status === '正常') {
    const children = orgStore.childMap.get(row.id) || []
    const members = orgStore.directMembers(row.id)
    const extra = []
    if (children.length) extra.push(`${children.length} 个下级节点`)
    if (members.length) extra.push(`${members.length} 名在编人员`)
    ElMessageBox.confirm(
      `确认停用「${row.name}」？${extra.length ? `该节点下还有${extra.join('和')}，停用后不再出现在人员分配与统计口径里，但历史数据保留。` : '停用后该节点不再出现在人员分配与统计口径里。'}`,
      '停用组织节点', { type: 'warning' }
    ).then(() => {
      const res = orgStore.setNodeStatus(row.id, '已停用')
      res.ok ? ElMessage.success(res.msg) : ElMessage.warning(res.msg)
    }).catch(() => {})
  } else {
    const res = orgStore.setNodeStatus(row.id, '正常')
    res.ok ? ElMessage.success(res.msg) : ElMessage.warning(res.msg)
  }
}

function removeNode(row) {
  const blockers = orgStore.removeBlockers(row.id)
  if (blockers.length) {
    ElMessage.warning(`「${row.name}」暂不能删除：${blockers.join('；')}。组织架构需保留审计轨迹，请改用停用。`)
    return
  }
  ElMessageBox.confirm(`确认删除${row.type}「${row.name}」？该节点无下级与人员，删除后不可恢复。`, '删除组织节点', { type: 'warning' })
    .then(() => {
      const res = orgStore.removeNode(row.id)
      if (!res.ok) { ElMessage.warning(res.msg); return }
      if (selectedNodeId.value === row.id) selectedNodeId.value = ''
      ElMessage.success(res.msg)
    }).catch(() => {})
}

/* ---------------- 人员分配弹窗 ---------------- */

const membersDialog = reactive({ visible: false, node: null })
const selectedMemberIds = ref([])

const memberCandidates = computed(() => {
  if (!membersDialog.node) return []
  // 只列范围内的用户，避免把别的集团人员误调进本集团部门
  const list = scopeIds.value ? orgStore.users.filter(u => !u.nodeId || scopeIds.value.has(u.nodeId)) : orgStore.users
  return list.map(u => ({ ...u, nodePath: u.nodeId ? orgStore.pathOf(u.nodeId) : '' }))
})

function openMembers(row) {
  membersDialog.node = row
  selectedMemberIds.value = orgStore.directMembers(row.id).map(u => u.id)
  membersDialog.visible = true
}

function submitMembers() {
  const res = orgStore.assignDeptMembers(membersDialog.node.id, selectedMemberIds.value)
  if (!res.ok) { ElMessage.warning(res.msg); return }
  ElMessage.success(`「${membersDialog.node.name}」人员已更新，${res.msg}`)
  membersDialog.visible = false
}

/* ---------------- 用户弹窗与调岗 ---------------- */

const userDialog = reactive({ visible: false, id: '' })
const emptyUserForm = () => ({ username: '', name: '', nodeId: '', role: '', phone: '', email: '', enabled: true })
const userForm = ref(emptyUserForm())

const assignableOptions = computed(() => {
  const options = orgStore.assignableNodeOptions()
  if (!scopeIds.value) return options
  return options.filter(o => scopeIds.value.has(o.id))
})

function openAddUser() {
  userDialog.id = ''
  userForm.value = emptyUserForm()
  const node = selectedNodeId.value ? orgStore.nodeById.get(selectedNodeId.value) : scopeNode.value
  // 选中部门时直接带入归属；选中公司时留空，逼操作者选到具体部门
  if (node && node.type === '部门' && node.status === '正常') userForm.value.nodeId = node.id
  userDialog.visible = true
}

function openEditUser(row) {
  userDialog.id = row.id
  userForm.value = {
    username: row.username, name: row.name, nodeId: row.nodeId || '', role: row.role,
    phone: row.phone || '', email: row.email || '', enabled: row.status === '启用'
  }
  userDialog.visible = true
}

function submitUser() {
  const payload = { ...userForm.value, status: userForm.value.enabled ? '启用' : '禁用' }
  const res = userDialog.id ? orgStore.updateUser(userDialog.id, payload) : orgStore.addUser(payload)
  if (!res.ok) { ElMessage.warning(res.msg); return }
  ElMessage.success(res.msg)
  userDialog.visible = false
}

const transferDialog = reactive({ visible: false, user: null })
const transferTargetId = ref('')

function openTransfer(row) {
  transferDialog.user = row
  transferTargetId.value = ''
  transferDialog.visible = true
}

function submitTransfer() {
  if (!transferTargetId.value) { ElMessage.warning('请选择调入组织'); return }
  if (transferTargetId.value === transferDialog.user.nodeId) { ElMessage.warning('所选组织与当前归属相同'); return }
  const res = orgStore.updateUser(transferDialog.user.id, {
    username: transferDialog.user.username, name: transferDialog.user.name, role: transferDialog.user.role,
    nodeId: transferTargetId.value, phone: transferDialog.user.phone, email: transferDialog.user.email,
    status: transferDialog.user.status
  })
  if (!res.ok) { ElMessage.warning(res.msg); return }
  ElMessage.success(res.msg)
  transferDialog.visible = false
}

function removeUser(row) {
  if (userStore.user && userStore.user.username === row.username) {
    ElMessage.warning('不能删除当前登录账号，请改用禁用')
    return
  }
  ElMessageBox.confirm(`确认删除用户「${row.name}（${row.username}）」？其归属「${row.nodePath || '未分配'}」将一并解除，历史操作记录保留。`, '删除用户', { type: 'warning' })
    .then(() => {
      const res = orgStore.removeUser(row.id)
      res.ok ? ElMessage.success(res.msg) : ElMessage.warning(res.msg)
    }).catch(() => {})
}
</script>

<style scoped>
/* 筛选卡只留卡片自身一层内边距，表单项不再叠加底部空隙 */
.filter-card :deep(.el-form-item) { margin-bottom: 0; }

.head-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* 树/列表两栏：左栏按内容定宽，右栏吃满剩余宽度，避免中间或右侧大洞 */
.org-split {
  display: grid;
  gap: 16px;
  grid-template-columns: 300px minmax(0, 1fr);
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .org-split { grid-template-columns: minmax(0, 1fr); }
}

.card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.card-head > div { display: flex; align-items: center; gap: 12px; }
.node-row { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 8px; }
.node-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-tail { display: flex; align-items: center; gap: 6px; flex: none; }
.member-row { padding: 8px 0; border-bottom: 1px solid var(--bd-split); }
.member-tip { color: var(--t-weak); font-size: 12px; margin-bottom: 8px; line-height: 1.5; }
.sub-hint { color: var(--t-weak); font-size: 12px; }
.muted { color: var(--t-weak); }
.link-text { color: var(--c-primary); }
.mono { font-family: var(--font-mono); }
.form-tip { color: var(--t-weak); font-size: 12px; line-height: 1.5; }
</style>
