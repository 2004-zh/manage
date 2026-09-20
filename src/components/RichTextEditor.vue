<template>
  <div class="rte">
    <div class="rte-toolbar">
      <button type="button" class="rte-btn" @click="exec('bold')" title="加粗"><b>B</b></button>
      <button type="button" class="rte-btn" @click="exec('italic')" title="斜体"><i>I</i></button>
      <button type="button" class="rte-btn" @click="exec('underline')" title="下划线"><u>U</u></button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" @click="exec('formatBlock', 'H2')" title="标题">H</button>
      <button type="button" class="rte-btn" @click="exec('formatBlock', 'P')" title="正文">¶</button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" @click="exec('insertUnorderedList')" title="无序列表">•≡</button>
      <button type="button" class="rte-btn" @click="exec('insertOrderedList')" title="有序列表">1≡</button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" @click="exec('justifyLeft')" title="左对齐">⬅</button>
      <button type="button" class="rte-btn" @click="exec('justifyCenter')" title="居中">⬌</button>
      <button type="button" class="rte-btn" @click="exec('justifyRight')" title="右对齐">➡</button>
      <span class="rte-sep"></span>
      <button type="button" class="rte-btn" @click="insertPlaceholder" title="插入填空占位符">｛｝</button>
      <button type="button" class="rte-btn" @click="exec('removeFormat')" title="清除格式">⌫</button>
    </div>
    <div
      ref="editorRef"
      class="rte-editor"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="onInput"
      @blur="onInput"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入合同条款内容…' }
})
const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let internal = false

function setHtml(html) {
  if (editorRef.value && editorRef.value.innerHTML !== (html || '')) {
    internal = true
    editorRef.value.innerHTML = html || ''
    nextTick(() => { internal = false })
  }
}

onMounted(() => setHtml(props.modelValue))

watch(() => props.modelValue, v => {
  if (!internal) setHtml(v)
})

function onInput() {
  if (!editorRef.value) return
  emit('update:modelValue', editorRef.value.innerHTML)
}

function exec(cmd, val = null) {
  editorRef.value?.focus()
  document.execCommand(cmd, false, val)
  onInput()
}

function insertPlaceholder() {
  editorRef.value?.focus()
  document.execCommand('insertHTML', false, '＿＿＿＿')
  onInput()
}
</script>

<style scoped>
.rte { border: 1px solid #dcdfe6; border-radius: 4px; overflow: hidden; }
.rte-toolbar { display: flex; flex-wrap: wrap; gap: 2px; padding: 6px; background: #f5f7fa; border-bottom: 1px solid #dcdfe6; }
.rte-btn { min-width: 30px; height: 28px; padding: 0 6px; border: 1px solid transparent; border-radius: 3px; background: transparent; cursor: pointer; font-size: 14px; color: #303133; }
.rte-btn:hover { background: #e9edf3; border-color: #dcdfe6; }
.rte-sep { width: 1px; background: #dcdfe6; margin: 4px 4px; }
.rte-editor { min-height: 240px; max-height: 420px; overflow-y: auto; padding: 12px; font-size: 14px; line-height: 1.7; outline: none; }
.rte-editor:empty:before { content: attr(data-placeholder); color: #a8abb2; }
.rte-editor :deep(h2) { font-size: 16px; margin: 8px 0; }
.rte-editor :deep(p) { margin: 6px 0; }
</style>
