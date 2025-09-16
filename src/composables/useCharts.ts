import * as echarts from 'echarts'
import { onUnmounted, watch, getCurrentInstance, type Ref } from 'vue'

export function useChart(
  chartRef: Ref<HTMLElement | null>,
  options: echarts.EChartsOption | Ref<echarts.EChartsOption>
) {
  let chartInstance: echarts.ECharts | null = null

  const initChart = () => {
    if (!chartRef.value) return

    // Dispose existing instance if exists
    if (chartInstance) {
      chartInstance.dispose()
    }

    // Initialize new chart
    chartInstance = echarts.init(chartRef.value)

    // Set options
    const opts = typeof options === 'object' && 'value' in options ? options.value : options
    chartInstance.setOption(opts)

    // Handle resize
    const handleResize = () => {
      chartInstance?.resize()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup on unmount - only if we have an active component instance
    const instance = getCurrentInstance()
    if (instance) {
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        chartInstance?.dispose()
      })
    } else {
      // If no component instance, clean up manually when chart is disposed
      const cleanup = () => {
        window.removeEventListener('resize', handleResize)
      }
      // Store cleanup function for manual cleanup
      if (chartInstance) {
        ;(chartInstance as any)._cleanup = cleanup
      }
    }
  }

  // Watch for option changes if reactive
  if (typeof options === 'object' && 'value' in options) {
    watch(options, (newOptions) => {
      if (chartInstance) {
        chartInstance.setOption(newOptions)
      }
    }, { deep: true })
  }

  // Watch for element changes
  watch(chartRef, () => {
    if (chartRef.value) {
      initChart()
    }
  })

  return {
    chartInstance: () => chartInstance,
    refresh: () => chartInstance?.resize(),
    updateOptions: (newOptions: echarts.EChartsOption) => {
      if (chartInstance) {
        chartInstance.setOption(newOptions)
      }
    }
  }
}

// Common chart configurations
export const chartTheme = {
  color: ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#f56565', '#38b2ac'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }
}

// Progress trend line chart options
export function getProgressTrendOptions(data: { dates: string[], values: number[] }): echarts.EChartsOption {
  return {
    color: chartTheme.color,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096',
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          color: '#f7fafc'
        }
      }
    },
    series: [
      {
        name: '完成进度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        data: data.values
      }
    ]
  }
}

// Department distribution pie chart options
export function getDepartmentPieOptions(data: { name: string, value: number }[]): echarts.EChartsOption {
  return {
    color: chartTheme.color,
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#718096'
      }
    },
    series: [
      {
        name: '部门分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
}

// Status distribution ring chart options
export function getStatusRingOptions(data: { completed: number, inProgress: number, notStarted: number }): echarts.EChartsOption {
  return {
    color: ['#48bb78', '#667eea', '#cbd5e0'],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '5%',
      textStyle: {
        color: '#718096'
      }
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: ['40%', '60%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'outside',
          color: '#718096',
          formatter: '{b}\n{c} ({d}%)'
        },
        labelLine: {
          length: 10,
          length2: 20
        },
        data: [
          { value: data.completed, name: '已完成' },
          { value: data.inProgress, name: '进行中' },
          { value: data.notStarted, name: '未开始' }
        ]
      }
    ]
  }
}

// Monthly progress bar chart options
export function getMonthlyProgressOptions(data: { months: string[], values: number[] }): echarts.EChartsOption {
  return {
    color: ['#667eea'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.months,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096'
      },
      splitLine: {
        lineStyle: {
          color: '#f7fafc'
        }
      }
    },
    series: [
      {
        name: '完成数量',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [8, 8, 0, 0]
        },
        data: data.values
      }
    ]
  }
}