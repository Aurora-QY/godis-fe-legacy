<template>
  <div class="console-container">
    <div class="command-input">
      <div class="input-container">
        <el-input v-model="currentCommand" placeholder="请输入命令" @keyup.enter="executeCommand" />
        <el-button type="primary" @click="executeCommand"> 运行 </el-button>
      </div>
    </div>
    <transition-group name="fade" tag="div">
      <div v-for="(item, index) in commandBlocks" :key="index" class="command-block">
        <div class="box-card">
          <div class="command-content">
            <div class="command-header">
              <div class="result-input-container">
                <span class="result-command-text">运行命令：</span>
                <el-input v-model="item.command" readonly />
                <el-button type="primary" @click="item.expanded = !item.expanded">
                  {{ item.expanded ? '收回' : '展开' }}
                </el-button>
              </div>
            </div>
            <transition name="slide-fade">
              <div v-if="item.expanded" class="command-result">
                <div class="result-label">执行结果:</div>
                <div class="result-text">
                  {{ item.result }}
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="js">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { el } from 'element-plus/es/locales.mjs'

const currentCommand = ref('')
const commandBlocks = ref([])

function executeCommand() {
  if (!currentCommand.value.trim()) {
    ElMessage.error('命令不能为空')
    return
  }

  // 模拟发送请求到后端并获取结果
  let result = `${currentCommand.value}` // 模拟结果

  axios
    .post('/api/execute', { command: currentCommand.value })
    .then((response) => {
      if (response.data.code === 200) {
        result = response.data.data
        // 将命令和结果添加到命令块数组中
        // console.log(currentCommand.value)
        commandBlocks.value.unshift({
          command: currentCommand.value,
          result,
          expanded: true,
        })
        // 清空当前命令输入框
        currentCommand.value = ''
      } else {
        ElMessage.error('执行错误!')
        result = response.data.data
        commandBlocks.value.unshift({
          command: currentCommand.value,
          result,
          expanded: true,
        })
        // 清空当前命令输入框
        currentCommand.value = ''
      }
      // ElMessage.success('服务器已选择')
    })
    .catch((error) => {
      ElMessage.error('执行错误', error)
    })
}
</script>

<style scoped>
.console-container {
  padding: 5px;
  width: 95%;
  /* margin: 0 auto; */
  margin-bottom: 10px;
}

.command-input {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.1);
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.input-container {
  display: flex;
  align-items: center;
  gap: 5px;
  background: white;
  padding: 5px;
  border-radius: 5px;
}

.result-command-text {
  font-weight: bold;
  font-size: 0.9em;
  white-space: nowrap;
}

.result-input-container {
  display: flex;
  align-items: center;
  gap: 5px;
  /* background: white; */
  padding: 5px;
  border-radius: 5px;
  width: 100%;
}

.el-input {
  flex-grow: 1;
}

.el-button {
  flex-shrink: 0;
}

.command-block {
  margin-bottom: 20px;
}

.box-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 0;
}

.command-content {
  /* padding: 5px; */
  background-color: #f9f9f9;
}

.command-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  /* padding: 5px; */
}

.command-text {
  color: #333;
  font-size: 1.1em;
}

.command-result {
  margin-top: 5px;
  padding: 5px;
}

.result-label {
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.result-text {
  background: #2e2e2e;
  color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>
