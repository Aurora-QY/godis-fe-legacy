<template>
  <div>
    <PieChartComponent :chart-data="chartData" />
  </div>
</template>

<script>
import { Pie as PieChartComponent } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Legend, Title, Tooltip)

export default {
  components: {
    PieChartComponent,
  },
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
}
</script>
