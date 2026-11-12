<template>
  <!-- 面包屑：菜单分组 > 当前页。分组与「首页」平级，首页不再作为所有页面的固定前缀 -->
  <div class="breadcrumb-bar">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <el-icon v-if="i > 0" class="crumb-sep"><ArrowRight /></el-icon>
      <span
        :class="crumb.current ? 'crumb-current' : crumb.link ? 'crumb-link' : 'crumb-parent'"
        @click="crumb.link && go(crumb.link)"
      >{{ crumb.label }}</span>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'

const props = defineProps({ home: { type: String, default: '/ent/home' } })
const route = useRoute()
const router = useRouter()

const crumbs = computed(() => {
  const group = route.meta.parent || '首页'
  const title = route.meta.title || group
  // 首页分组保留可点击的返回入口；其他分组与首页平级，作为纯文本一级导航
  const list = [{ label: group, link: group === '首页' ? props.home : null }]
  if (title !== group) {
    list.push({ label: title, current: true })
  } else {
    list[0].current = true
  }
  return list
})

function go(path) {
  if (route.path !== path) router.push(path)
}
</script>
