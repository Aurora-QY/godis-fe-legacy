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
        <div v-for="(dataset, index) in Object.keys(testCasesData)" :key="index" style="margin: 20px; display: inline-block">
          <h3>{{ dataset }} 相关函数</h3>
          <div style="height: 200px; width: 200px; display: inline-block">
            <PieChartComponent :chart-data="getPassRateData(dataset)" />
            <div style="vertical-align: top; margin-left: 20px">
              <h3>测试用例总数: {{ getTotalTestCases(dataset) }}</h3>
            </div>
            <div style="vertical-align: top; margin-left: 20px">
              <h3>总通过率: {{ getOverallPassRate(dataset) }}%</h3>
            </div>
          </div>
        </div>
      </el-card>

      <el-card style="margin-top: 20px">
        <h1>测试用例详情</h1>
        <el-select
          v-model="selectedDataset"
          placeholder="Select Dataset"
          style="margin-bottom: 20px; width: 200px; display: inline-block"
          @change="clearCommandSelection"
        >
          <el-option v-for="(dataset, index) in Object.keys(testCasesData)" :key="index" :label="dataset" :value="dataset" />
        </el-select>
        <el-select
          v-model="selectedCommand"
          placeholder="Select Command"
          style="margin-bottom: 20px; width: 200px; display: inline-block"
        >
          <el-option v-for="command in commandOptions" :key="command" :label="command" :value="command" />
        </el-select>

        <el-table :data="commandStats">
          <el-table-column prop="command" label="Command" />
          <el-table-column prop="total" label="Total Cases" />
          <el-table-column prop="passRate" label="Pass Rate (%)" />
        </el-table>
        <br />
        <el-table :data="flattenedTestCases" :span-method="mergeCells">
          <el-table-column prop="testCaseKey" label="Test Case" />
          <el-table-column prop="remark" label="Remark" />
          <el-table-column prop="command" label="Command" />
          <el-table-column prop="expected_output" label="Expected Output" />
          <el-table-column prop="result" label="Result" />
          <el-table-column prop="isPass" label="Pass/Fail" />
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
      testCasesData: {
        string: {},
        list: {},
        set: {},
        'sorted-set': {},
      },
      selectedCommand: null,
      selectedDataset: 'set', // 默认选择 set
      testCaseResults: [], // 用于存储测试用例的结果
      allTestCases: [], // 用于存储所有的测试用例及其执行情况
    }
  },
  computed: {
    commandOptions() {
      return Object.keys(this.testCasesData[this.selectedDataset])
    },
    flattenedTestCases() {
      if (!this.selectedCommand) {
        return []
      }

      const testCases = this.testCasesData[this.selectedDataset][this.selectedCommand]
      const flattenedResult = []

      Object.keys(testCases).forEach((testCaseKey) => {
        const testCase = testCases[testCaseKey]
        testCase.commands.forEach((cmd, index) => {
          const expectedOutput = Array.isArray(cmd.expected_output) ? cmd.expected_output.join(', ') : cmd.expected_output
          const result = this.getTestCaseResult(testCaseKey, cmd.command)
          const isPass = result !== null ? (result === expectedOutput ? 'Pass' : 'Fail') : null

          flattenedResult.push({
            testCaseKey,
            remark: index === 0 ? testCase.remark : '', // Only show remark in the first row for each test case
            command: cmd.command,
            expected_output: expectedOutput,
            result: result !== null ? result : '', // 若result为null则显示为空
            isPass: isPass !== null ? isPass : '', // 若isPass为null则显示为空
            index,
            totalCommands: testCase.commands.length,
            executed: result !== null, // 添加一个标志位，表示是否已经执行过
          })
        })
      })

      return flattenedResult
    },
    allTestCasesComputed() {
      const testCases = []

      Object.keys(this.testCasesData).forEach((dataset) => {
        Object.keys(this.testCasesData[dataset]).forEach((command) => {
          const commandTestCases = this.testCasesData[dataset][command]

          Object.keys(commandTestCases).forEach((testCaseKey) => {
            const testCase = commandTestCases[testCaseKey]
            const commands = testCase.commands.map((cmd) => ({
              command: cmd.command,
              expected_output: cmd.expected_output,
              result: null,
              isPass: null,
            }))

            testCases.push({
              dataset,
              testCaseKey,
              remark: testCase.remark,
              commands,
              isPass: null,
            })
          })
        })
      })

      return testCases
    },
    totalTestCases() {
      return this.allTestCasesComputed.length
    },
    passRateData() {
      const passCount = this.allTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const failCount = this.allTestCases.length - passCount

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
    commandStats() {
      const stats = {}

      Object.keys(this.testCasesData[this.selectedDataset]).forEach((command) => {
        const testCases = this.testCasesData[this.selectedDataset][command]
        let passCount = 0
        let totalCases = 0

        Object.keys(testCases).forEach((testCaseKey) => {
          const testCaseResult = this.allTestCases.find(
            (result) => result.testCaseKey === testCaseKey && result.dataset === this.selectedDataset,
          )

          if (testCaseResult && testCaseResult.isPass === 'Pass') {
            passCount += 1
          }

          totalCases += 1
        })

        const passRate = (passCount / totalCases) * 100

        stats[command] = {
          command,
          total: totalCases,
          passRate: passRate.toFixed(2),
        }
      })

      return Object.values(stats)
    },
    overallPassRate() {
      const passCount = this.allTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const totalCount = this.allTestCases.length
      return totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : '0.00'
    },
  },
  created() {
    const datasets = ['string', 'list', 'set', 'sorted-set']
    const promises = datasets.map((dataset) =>
      fetch(`/${dataset}-cases.json`).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      }),
    )

    Promise.all(promises)
      .then((data) => {
        datasets.forEach((dataset, index) => {
          this.testCasesData[dataset] = data[index]
        })
        this.allTestCases = this.allTestCasesComputed
      })
      .catch((error) => {
        console.error('Error fetching test cases:', error)
      })
  },
  methods: {
    mergeCells({ row, columnIndex }) {
      if (columnIndex === 0) {
        // Merge testCaseKey column
        if (row.index === 0) {
          return {
            rowspan: row.totalCommands,
            colspan: 1,
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          }
        }
      } else if (columnIndex === 1) {
        // Merge remark column
        if (row.index === 0) {
          return {
            rowspan: row.totalCommands,
            colspan: 1,
          }
        } else {
          return {
            rowspan: 0,
            colspan: 0,
          }
        }
      }
      return {
        rowspan: 1,
        colspan: 1,
      }
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

    async executeAllTestCases() {
      for (const testCase of this.allTestCases) {
        for (const command of testCase.commands) {
          // const result = await this.executeCommand(command.command)
          const result = '(integer) 1'
          const expectedOutput = command.expected_output
          const isPass = result === expectedOutput
          command.result = result
          command.isPass = isPass ? 'Pass' : 'Fail'
        }
        testCase.isPass = testCase.commands.every((cmd) => cmd.isPass === 'Pass') ? 'Pass' : 'Fail'
      }

      // 强制更新通过率和命令统计数据
      this.updateCharts()
    },

    updateCharts() {
      this.$forceUpdate() // 强制组件重新渲染
    },

    clearCommandSelection() {
      this.selectedCommand = null
    },

    getPassRateData(dataset) {
      const datasetTestCases = this.allTestCases.filter((testCase) => testCase.dataset === dataset)
      const passCount = datasetTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const failCount = datasetTestCases.length - passCount

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

    getTotalTestCases(dataset) {
      return this.allTestCases.filter((testCase) => testCase.dataset === dataset).length
    },

    getOverallPassRate(dataset) {
      const datasetTestCases = this.allTestCases.filter((testCase) => testCase.dataset === dataset)
      const passCount = datasetTestCases.filter((testCase) => testCase.isPass === 'Pass').length
      const totalCount = datasetTestCases.length
      return totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(2) : '0.00'
    },

    getTestCaseResult(testCaseKey, command) {
      const testCase = this.allTestCases.find(
        (testCase) => testCase.testCaseKey === testCaseKey && testCase.dataset === this.selectedDataset,
      )
      const commandResult = testCase?.commands.find((cmd) => cmd.command === command)
      return commandResult ? commandResult.result : null
    },
  },
}
</script>
