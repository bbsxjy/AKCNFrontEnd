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

// Monthly completion multi-line chart options
export function getMonthlyCompletionOptions(data: {
  months: string[],
  requirement: number[],
  release: number[],
  techOnline: number[],
  bizOnline: number[]
}): echarts.EChartsOption {
  return {
    color: ['#667eea', '#48bb78', '#ed8936', '#f56565'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['需求完成', '发版完成', '技术上线', '业务上线'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
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
        color: '#718096',
        formatter: '{value}'
      },
      splitLine: {
        lineStyle: {
          color: '#f7fafc'
        }
      }
    },
    series: [
      {
        name: '需求完成',
        type: 'line',
        smooth: true,
        data: data.requirement
      },
      {
        name: '发版完成',
        type: 'line',
        smooth: true,
        data: data.release
      },
      {
        name: '技术上线',
        type: 'line',
        smooth: true,
        data: data.techOnline
      },
      {
        name: '业务上线',
        type: 'line',
        smooth: true,
        data: data.bizOnline
      }
    ]
  }
}

// Progress trend line chart options (deprecated - kept for compatibility)
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

// Project statistics horizontal bar chart options (better for long project names)
export function getProjectStatisticsOptions(data: any[]): echarts.EChartsOption {
  // 反转数据顺序，让最大的项目在最上面
  const reversedData = [...data].reverse()
  const projects = reversedData.map(item => {
    // 截断过长的项目名称
    const maxLength = 30
    const name = item.name
    return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
  })
  const completed = reversedData.map(item => item.completed)
  const inProgress = reversedData.map(item => item.inProgress)
  const notStarted = reversedData.map(item => item.notStarted)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const projectData = reversedData[params[0].dataIndex]
        return `<div style="padding: 8px; max-width: 300px;">
          <strong style="word-wrap: break-word;">${projectData.name}</strong><br/>
          总数: ${projectData.total}<br/>
          已完成: ${projectData.completed} (${projectData.completionRate}%)<br/>
          进行中: ${projectData.inProgress}<br/>
          未开始: ${projectData.notStarted}
        </div>`
      }
    },
    legend: {
      data: ['已完成', '进行中', '未开始'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '15%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: projects,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      axisLabel: {
        color: '#718096',
        fontSize: 11,
        formatter: (value: string) => {
          // 如果需要，可以在这里再次处理标签
          return value
        }
      }
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        itemStyle: { color: '#48bb78' },
        data: completed
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#3182ce' },
        data: inProgress
      },
      {
        name: '未开始',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#cbd5e0' },
        data: notStarted
      }
    ]
  }
}

// Priority distribution pie chart options
export function getPriorityDistributionOptions(data: any[], type: 'all' | 'AK' | 'cloud' = 'all'): echarts.EChartsOption {
  let chartData: any[] = []

  if (type === 'all') {
    // 显示所有应用的优先级分布
    chartData = data.map(item => ({
      name: item.name,
      value: item.value
    }))
  } else if (type === 'AK') {
    // 只显示AK改造的应用
    chartData = data.map(item => ({
      name: item.name,
      value: item.akCount
    })).filter(item => item.value > 0)
  } else {
    // 只显示云原生改造的应用
    chartData = data.map(item => ({
      name: item.name,
      value: item.cloudCount
    })).filter(item => item.value > 0)
  }

  return {
    color: ['#667eea', '#764ba2', '#48bb78', '#ed8936', '#f56565'],
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const total = chartData.reduce((sum, item) => sum + item.value, 0)
        const percentage = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0
        return `${params.name}<br/>
                数量: ${params.value}<br/>
                占比: ${percentage}%`
      }
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
        name: '优先级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['55%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c} ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: chartData
      }
    ]
  }
}

// Monthly statistics bar chart options (delays, blocks, new apps, new tasks)
export function getMonthlyStatisticsOptions(data: {
  months: string[],
  delayed: number[],
  blocked: number[],
  newApps: number[],
  newTasks: number[]
}, type: 'all' | 'app' | 'task' = 'all'): echarts.EChartsOption {
  const series = []

  if (type === 'all' || type === 'task') {
    series.push({
      name: '延期任务',
      type: 'bar',
      stack: 'task',
      itemStyle: { color: '#f56565' },
      data: data.delayed
    })
    series.push({
      name: '阻塞任务',
      type: 'bar',
      stack: 'task',
      itemStyle: { color: '#ed8936' },
      data: data.blocked
    })
  }

  if (type === 'all' || type === 'task') {
    series.push({
      name: '新增子任务',
      type: 'bar',
      stack: type === 'all' ? 'new' : 'task',
      itemStyle: { color: '#48bb78' },
      data: data.newTasks
    })
  }

  if (type === 'all' || type === 'app') {
    series.push({
      name: '新增应用',
      type: 'bar',
      stack: type === 'all' ? 'new' : 'app',
      itemStyle: { color: '#667eea' },
      data: data.newApps
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0,
      textStyle: {
        color: '#718096'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
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
        color: '#718096',
        rotate: 0
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
    series: series
  }
}