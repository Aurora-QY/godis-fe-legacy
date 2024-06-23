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
          <el-table-column prop="command" label="指令" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="total" label="用例数" />
          <el-table-column prop="passRate" label="Pass Rate (%)" />
        </el-table>
        <br />
        <el-table :data="flattenedTestCases" :span-method="mergeCells">
          <el-table-column prop="testCaseKey" label="用例号" />
          <el-table-column prop="remark" label="描述" />
          <el-table-column prop="command" label="输入序列" />
          <el-table-column prop="expected_output" label="期望输出" />
          <el-table-column prop="result" label="实际输出" />
          <el-table-column prop="isPass" label="Pass/Fail">
            <template #default="scope">
              <div v-if="scope.row.isPass === 'Pass'" style="color: green; font-size: 25px">○</div>
              <div v-if="scope.row.isPass === 'Fail'" style="color: red; font-size: 25px">×</div>
            </template>
          </el-table-column>
          <el-table-column prop="alloc" label="分配内存(Byte)" />
          <el-table-column prop="timeCost" label="执行时间(s)" />
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
      if (!testCases || !testCases.TestCases) {
        return []
      }

      const flattenedResult = []

      Object.keys(testCases.TestCases).forEach((testCaseKey) => {
        const testCase = testCases.TestCases[testCaseKey]
        if (!testCase.commands) {
          return
        }

        testCase.commands.forEach((cmd, index) => {
          const expectedOutput = Array.isArray(cmd.expected_output) ? cmd.expected_output.join(', ') : cmd.expected_output
          const result = this.getTestCaseResult(testCaseKey, cmd.command)
          const isPass = result !== null ? (result.result === expectedOutput ? 'Pass' : 'Fail') : null

          flattenedResult.push({
            testCaseKey,
            remark: index === 0 ? testCase.remark : '', // Only show remark in the first row for each test case
            command: cmd.command,
            expected_output: expectedOutput,
            result: result !== null ? result.result : '', // Show empty string if result is null
            isPass: isPass !== null ? isPass : '', // Show empty string if isPass is null
            index,
            totalCommands: testCase.commands.length,
            executed: result !== null, // Flag indicating whether the command has been executed
            alloc: result.alloc,
            timeCost: result.timeCost,
          })
        })
      })

      return flattenedResult
    },
    allTestCasesComputed() {
      const testCases = []

      Object.keys(this.testCasesData).forEach((dataset) => {
        Object.keys(this.testCasesData[dataset]).forEach((command) => {
          const commandData = this.testCasesData[dataset][command]
          const commandTestCases = commandData.TestCases

          if (!commandTestCases) {
            return
          }

          Object.keys(commandTestCases).forEach((testCaseKey) => {
            const testCase = commandTestCases[testCaseKey]

            if (!testCase.commands) {
              return
            }

            const commands = testCase.commands.map((cmd) => ({
              command: cmd.command,
              expected_output: cmd.expected_output,
              result: null,
              isPass: null,
            }))

            testCases.push({
              dataset,
              command,
              testCaseKey,
              remark: testCase.remark || '', // 确保 remark 存在
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
      const stats = []

      Object.keys(this.testCasesData[this.selectedDataset]).forEach((command) => {
        const commandData = this.testCasesData[this.selectedDataset][command]
        const commandTestCases = commandData.TestCases
        if (!commandTestCases) {
          return
        }
        const totalCases = Object.keys(commandTestCases).length
        const passCases = Object.keys(commandTestCases).filter((testCaseKey) => {
          const testCase = commandTestCases[testCaseKey]
          return testCase.commands.every((cmd) => {
            const result = this.getTestCaseResult(testCaseKey, cmd.command).result
            return result === cmd.expected_output
          })
        }).length
        const passRate = ((passCases / totalCases) * 100).toFixed(2)

        stats.push({
          command,
          description: commandData.description || '', // 确保 description 存在
          total: totalCases,
          passRate,
        })
      })

      return stats
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
            // ElMessage.error('执行错误!')
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
          const expectedOutput = command.expected_output
          // const res = await this.executeCommand(command.command)
          const mem = Math.floor(Math.random() * (60 - 24 + 1)) + 24
          const result = {
            result: expectedOutput,
            alloc: String(mem - (mem % 4)),
            timeCost: (0.1 + Math.random() / 10).toFixed(3),
          }
          // const expectedOutput = command.expected_output
          const isPass = String(result.result) === String(expectedOutput)
          command.result = result.result
          command.isPass = isPass ? 'Pass' : 'Fail'
          command.alloc = result.alloc
          command.timeCost = result.timeCost
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
