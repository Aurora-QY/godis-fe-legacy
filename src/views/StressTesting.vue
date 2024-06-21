<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <h2>系统测试</h2>
      <el-form :model="form" label-width="120px">
        <el-form-item>
          <el-button type="primary" @click="startStressTest"> 开始压力测试 </el-button>
        </el-form-item>
      </el-form>
      <el-card v-if="testResult" class="result-card">
        <template #header>
          <div>
            <span>测试结果</span>
          </div>
        </template>
        <div>{{ testResult }}</div>
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
      form: {
        maxConnections: 1000,
        incrementStep: 100,
        command: 'SET k 1',
        testDurationSeconds: 30,
        serverUrl: 'localhost',
        port: 6389,
      },
      testResult: null,
    }
  },
  methods: {
    async startStressTest() {
      try {
        const response = await axios.post('/api/stressTest', this.form)
        this.testResult = response.data.data
      } catch (error) {
        console.error('压力测试失败:', error)
        this.$message.error('压力测试失败，请查看控制台获取详细信息。')
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
