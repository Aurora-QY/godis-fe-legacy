<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <h2>压力测试</h2>
      <el-button type="primary" :disabled="isTestRunning" @click="startStressTest"> 开始压力测试 </el-button>
      <el-button type="danger" :disabled="!isTestRunning" @click="stopStressTest"> 停止压力测试 </el-button>
      <el-card v-if="testStatus" class="result-card">
        <template #header>
          <div>
            <span>测试状态</span>
          </div>
        </template>
        <div>当前连接数: {{ testStatus.currentConnections }}</div>
        <div>成功命令数: {{ testStatus.successfulCommands }}</div>
        <div>失败命令数: {{ testStatus.failedCommands }}</div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script>
import axios from 'axios'
import Sidebar from '../components/Sidebar.vue'

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      isTestRunning: false,
      testStatus: null,
      statusInterval: null,
    }
  },
  beforeUnmount() {
    this.stopStatusPolling()
  },
  methods: {
    async startStressTest() {
      try {
        await axios.post('/api/startStressTest')
        this.isTestRunning = true
        this.startStatusPolling()
      } catch (error) {
        console.error('启动压力测试失败:', error)
        this.$message.error('启动压力测试失败，请查看控制台获取详细信息。')
      }
    },
    async stopStressTest() {
      try {
        await axios.post('/api/stopStressTest')
        this.isTestRunning = false
        this.stopStatusPolling()
      } catch (error) {
        console.error('停止压力测试失败:', error)
        this.$message.error('停止压力测试失败，请查看控制台获取详细信息。')
      }
    },
    startStatusPolling() {
      this.statusInterval = setInterval(this.getTestStatus, 1000)
    },
    stopStatusPolling() {
      if (this.statusInterval) {
        clearInterval(this.statusInterval)
        this.statusInterval = null
      }
    },
    async getTestStatus() {
      try {
        const response = await axios.get('/api/getTestStatus')
        this.testStatus = response.data.data
      } catch (error) {
        console.error('获取测试状态失败:', error)
        this.stopStatusPolling()
        this.isTestRunning = false
        this.$message.error('获取测试状态失败，测试可能已经停止。')
      }
    },
  },
}
</script>

<style scoped>
.result-card {
  margin-top: 20px;
}
</style>
