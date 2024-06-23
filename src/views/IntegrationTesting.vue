<template>
  <el-container style="height: 100vh">
    <el-aside width="200px">
      <Sidebar />
    </el-aside>
    <el-main>
      <el-card style="display: flex; flex-wrap: wrap">
        <div>
          <h1 style="display: inline-block">总体测试情况</h1>
          <el-button
            style="margin-left: 50px; display: inline-block; background-color: #000000; color: #ffffff"
            @click="executeAllTestCases"
          >
            执行所有测试用例
          </el-button>
        </div>
        <div style="margin: 20px; display: inline-block">
          <h3>所有测试用例</h3>
          <div style="height: 200px; width: 200px; display: inline-block">
            <PieChartComponent :chart-data="passRateData" />
            <div style="vertical-align: top; margin-left: 20px">
              <h3>测试用例总数: {{ totalTestCases }}</h3>
            </div>
            <div style="vertical-align: top; margin-left: 20px">
              <h3>总通过率: {{ overallPassRate }}%</h3>
            </div>
          </div>
        </div>
      </el-card>

      <el-card style="margin-top: 20px">
        <h1>测试用例详情</h1>

        <el-table :data="flattenedTestCases">
          <el-table-column prop="testCaseKey" label="Test Case" />
          <el-table-column prop="remark" label="Remark" />
          <el-table-column prop="command" label="Command" />
          <el-table-column prop="expected_output" label="Expected Output" />
          <el-table-column prop="result" label="Result" />
          <el-table-column prop="isPass" label="Pass/Fail">
            <template #default="scope">
              <div v-if="scope.row.isPass === 'Pass'" style="color: green; font-size: 25px">○</div>
              <div v-if="scope.row.isPass === 'Fail'" style="color: red; font-size: 25px">×</div>
            </template>
          </el-table-column>
          <el-table-column prop="alloc" label="Alloc" />
          <el-table-column prop="timeCost" label="Time Cost" />
        </el-table>
      </el-card>
    </el-main>
  </el-container>
</template>

<script>
import axios from 'axios'
import Sidebar from '../components/Sidebar.vue'
import PieChartComponent from '../components/PieChart.vue'

export default {
  components: {
    Sidebar,
    PieChartComponent,
  },
  data() {
    return {
      testCasesData: {},
      testCaseResults: [], // 用于存储测试用例的结果
      allTestCases: [], // 用于存储所有的测试用例及其执行情况
    }
  },
  computed: {
    flattenedTestCases() {
      const flattenedResult = []

      this.allTestCases.forEach((testCase) => {
        if (!testCase.commands) {
          return
        }

        testCase.commands.forEach((cmd, index) => {
          const expectedOutput = Array.isArray(cmd.expected_output) ? cmd.expected_output.join(', ') : cmd.expected_output
          const result = this.getTestCaseResult(testCase.testCaseKey, cmd.command)
          const isPass = result !== null ? (result.result === expectedOutput ? 'Pass' : 'Fail') : null

          flattenedResult.push({
            testCaseKey: testCase.testCaseKey,
            remark: index === 0 ? testCase.remark : '', // Only show remark in the first row for each test case
            command: cmd.command,
            expected_output: expectedOutput,
            result: result !== null ? result.result : '', // Show empty string if result is null
            isPass: isPass !== null ? isPass : '', // Show empty string if isPass is null
            index,
            totalCommands: testCase.commands.length,
            executed: result !== null, // Flag indicating whether the command has been executed
            alloc: result ? result.alloc : '',
            timeCost: result ? result.timeCost : '',
          })
        })
      })

      return flattenedResult
    },
    totalTestCases() {
      return this.flattenedTestCases.length
    },
    passRateData() {
      const passCount = this.flattenedTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const failCount = this.flattenedTestCases.length - passCount

      return {
        labels: ['Pass', 'Fail'],
        datasets: [
          {
            data: [passCount, failCount],
            backgroundColor: ['#42b983', '#ff6384'],
          },
        ],
      }
    },
    overallPassRate() {
      const passCount = this.flattenedTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const totalCount = this.flattenedTestCases.length
      return totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : '0.00'
    },
    allTestCasesComputed() {
      const result = []
      for (const [testCaseKey, testCase] of Object.entries(this.testCasesData)) {
        result.push({
          testCaseKey,
          remark: testCase.remark,
          commands: testCase.commands,
        })
      }
      return result
    },
  },
  created() {
    fetch('/integration-testcases.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        this.testCasesData = data
        this.allTestCases = this.allTestCasesComputed
      })
      .catch((error) => {
        console.error('Error fetching test cases:', error)
      })
  },
  methods: {
    async executeAllTestCases() {
      for (const testCase of this.allTestCases) {
        for (const command of testCase.commands) {
          const res = await this.executeCommand(command.command)
          const result = {
            result: res,
            alloc: 0,
            timeCost: 0,
          }
          command.result = result.result
          command.alloc = result.alloc
          command.timeCost = result.timeCost
        }
        testCase.isPass = testCase.commands.every((cmd) => cmd.result === cmd.expected_output) ? 'Pass' : 'Fail'
      }

      // 强制更新通过率和命令统计数据
      this.updateCharts()
    },

    executeCommand(command) {
      if (!command.trim()) {
        ElMessage.error('命令不能为空')
        return null
      }

      let result = null
      return axios
        .post('/api/execute', { command })
        .then((response) => {
          if (response.data.code === 200) {
            result = response.data.data
            return result
          } else {
            ElMessage.error('执行错误!')
            result = response.data.data
            return result
          }
        })
        .catch((error) => {
          ElMessage.error('执行错误', error)
          return null
        })
    },

    updateCharts() {
      this.$forceUpdate() // 强制组件重新渲染
    },

    getTestCaseResult(testCaseKey, command) {
      const testCase = this.allTestCases.find((testCase) => testCase.testCaseKey === testCaseKey)
      if (!testCase) {
        return null
      }
      const commandResult = testCase.commands.find((cmd) => cmd.command === command)
      if (commandResult) {
        const result = {
          result: commandResult.result,
          alloc: commandResult.alloc,
          timeCost: commandResult.timeCost,
        }
        return result
      }
      return null
    },
  },
}
</script>
