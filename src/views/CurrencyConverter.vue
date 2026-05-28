<template>
  <div class="currency-converter">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Money /></el-icon>
          <span>汇率换算工具</span>
          <span class="update-time" v-if="updateTime">更新时间: {{ formatUpdateTime(updateTime) }}</span>
        </div>
      </template>

      <div class="mode-switch">
        <el-radio-group v-model="multiTargetMode" size="large">
          <el-radio-button :value="false">单目标转换</el-radio-button>
          <el-radio-button :value="true">多目标对比</el-radio-button>
        </el-radio-group>
      </div>

      <div class="common-currencies">
        <span class="label">常用货币:</span>
        <div class="currency-buttons">
          <el-button
            v-for="currency in commonCurrencies"
            :key="currency.code"
            :type="fromCurrency === currency.code ? 'primary' : 'default'"
            size="small"
            @click="selectFromCurrency(currency.code)"
          >
            {{ currency.code }} - {{ currency.name }}
          </el-button>
        </div>
      </div>

      <el-form label-width="100px" class="converter-form">
        <el-form-item label="金额">
          <el-input-number
            v-model="amount"
            :min="0"
            :precision="2"
            :step="100"
            :max="1000000000"
            size="large"
            style="width: 100%"
            @change="autoConvert"
          />
        </el-form-item>

        <div class="currency-row" v-if="!multiTargetMode">
          <el-form-item label="源货币" class="currency-item">
            <el-select
              v-model="fromCurrency"
              filterable
              size="large"
              style="width: 100%"
              @change="onCurrencyChange"
            >
              <el-option
                v-for="currency in currencyList"
                :key="currency.code"
                :label="`${currency.code} - ${currency.name}`"
                :value="currency.code"
              />
            </el-select>
          </el-form-item>

          <div class="swap-button">
            <el-button circle size="large" type="primary" @click="swapCurrencies">
              <el-icon><Switch /></el-icon>
            </el-button>
          </div>

          <el-form-item label="目标货币" class="currency-item">
            <el-select
              v-model="toCurrency"
              filterable
              size="large"
              style="width: 100%"
              @change="onCurrencyChange"
            >
              <el-option
                v-for="currency in currencyList"
                :key="currency.code"
                :label="`${currency.code} - ${currency.name}`"
                :value="currency.code"
              />
            </el-select>
          </el-form-item>
        </div>

        <div v-else>
          <el-form-item label="源货币">
            <el-select
              v-model="fromCurrency"
              filterable
              size="large"
              style="width: 100%"
              @change="onCurrencyChange"
            >
              <el-option
                v-for="currency in currencyList"
                :key="currency.code"
                :label="`${currency.code} - ${currency.name}`"
                :value="currency.code"
              />
            </el-select>
          </el-form-item>

          <div class="multi-target-header">
            <span class="label">目标货币 (最多3个)</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="addTargetCurrency"
              :disabled="targetCurrencies.length >= 3"
            >
              + 添加目标货币
            </el-button>
          </div>

          <div class="multi-target-list">
            <div
              v-for="(target, index) in targetCurrencies"
              :key="index"
              class="multi-target-item"
            >
              <el-select
                v-model="targetCurrencies[index]"
                filterable
                size="large"
                style="flex: 1"
                @change="onCurrencyChange"
              >
                <el-option
                  v-for="currency in currencyList"
                  :key="currency.code"
                  :label="`${currency.code} - ${currency.name}`"
                  :value="currency.code"
                  :disabled="isCurrencySelected(currency.code, index)"
                />
              </el-select>
              <el-button
                v-if="targetCurrencies.length > 1"
                circle
                size="small"
                type="danger"
                @click="removeTargetCurrency(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <el-form-item>
          <el-button type="primary" size="large" @click="convert" :loading="loading" style="width: 100%">
            <el-icon><Refresh /></el-icon>
            转换
          </el-button>
        </el-form-item>
      </el-form>

      <el-card v-if="result !== null && !multiTargetMode" class="result-card" shadow="hover">
        <div class="result-content">
          <div class="from-amount">
            <span class="currency-code">{{ fromCurrency }}</span>
            <span class="amount">{{ formatNumber(amount) }}</span>
          </div>
          <div class="equals">=</div>
          <div class="to-amount">
            <span class="currency-code">{{ toCurrency }}</span>
            <span class="amount">{{ formatNumber(result) }}</span>
          </div>
        </div>
        <div class="rate-info">
          1 {{ fromCurrency }} = {{ exchangeRate }} {{ toCurrency }}
        </div>
      </el-card>

      <div v-if="multiResults.length > 0" class="multi-results">
        <div class="multi-results-header">
          <span class="from-display">{{ formatNumber(amount) }} {{ fromCurrency }}</span>
          <span class="equals">=</span>
        </div>
        <div class="multi-results-list">
          <div
            v-for="(item, index) in multiResults"
            :key="index"
            class="multi-result-item"
            :style="{ '--item-color': resultColors[index] }"
          >
            <div class="result-info">
              <span class="currency-code">{{ item.currency }}</span>
              <span class="amount">{{ formatNumber(item.amount) }}</span>
            </div>
            <div class="rate-info">
              1 {{ fromCurrency }} = {{ item.rate }} {{ item.currency }}
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="chart-card" v-if="historicalData.length > 0 || Object.keys(multiHistoricalData).length > 0">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><TrendCharts /></el-icon>
          <span>最近7天汇率走势</span>
        </div>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, Switch, Refresh, TrendCharts, Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  currencyList,
  commonCurrencies,
  getExchangeRates,
  getHistoricalRates,
  getCurrencyName
} from '@/api/currency'

const STORAGE_KEY = 'currency_converter_preference'

const multiTargetMode = ref(false)
const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const targetCurrencies = ref(['CNY', 'EUR', 'JPY'])
const result = ref(null)
const exchangeRate = ref(null)
const multiResults = ref([])
const loading = ref(false)
const rates = ref({})
const updateTime = ref('')
const historicalData = ref([])
const multiHistoricalData = ref({})
const chartRef = ref(null)
let chartInstance = null

const resultColors = ['#667eea', '#f093fb', '#4facfe']

const loadPreference = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const preference = JSON.parse(saved)
      fromCurrency.value = preference.fromCurrency || 'USD'
      toCurrency.value = preference.toCurrency || 'CNY'
      amount.value = preference.amount || 100
      multiTargetMode.value = preference.multiTargetMode || false
      targetCurrencies.value = preference.targetCurrencies || ['CNY', 'EUR', 'JPY']
    } catch (e) {
      console.error('加载偏好设置失败:', e)
    }
  }
}

const savePreference = () => {
  const preference = {
    fromCurrency: fromCurrency.value,
    toCurrency: toCurrency.value,
    amount: amount.value,
    multiTargetMode: multiTargetMode.value,
    targetCurrencies: targetCurrencies.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preference))
}

const fetchRates = async () => {
  try {
    const response = await getExchangeRates(fromCurrency.value)
    if (response.code === 200) {
      rates.value = response.data.rates || {}
      updateTime.value = response.data?.updateTime
    }
  } catch (error) {
    console.error('获取汇率错误:', error)
    ElMessage.error('获取汇率数据失败')
  }
}

const convert = async () => {
  if (amount.value <= 0) {
    ElMessage.warning('请输入大于0的金额')
    return
  }

  loading.value = true
  try {
    if (!rates.value || Object.keys(rates.value).length === 0) {
      await fetchRates()
    }

    if (multiTargetMode.value) {
      multiResults.value = targetCurrencies.value.map(currency => {
        const rate = rates.value[currency]
        if (!rate) {
          throw new Error(`未找到 ${currency} 的汇率数据`)
        }
        return {
          currency,
          rate: rate.toFixed(6),
          amount: (amount.value * rate).toFixed(4) * 1
        }
      })

      savePreference()
      await fetchMultiHistoricalData()
    } else {
      if (!rates.value[toCurrency.value]) {
        throw new Error(`未找到 ${toCurrency.value} 的汇率数据`)
      }

      const rate = rates.value[toCurrency.value]
      exchangeRate.value = rate.toFixed(6)
      result.value = (amount.value * rate).toFixed(4) * 1

      savePreference()
      await fetchHistoricalData()
    }
  } catch (error) {
    console.error('转换错误:', error)
    ElMessage.error('转换失败' + (error.message || '请重试'))
  } finally {
    loading.value = false
  }
}

const autoConvert = () => {
  if ((result.value !== null || multiResults.value.length > 0) && amount.value > 0) {
    convert()
  }
}

const swapCurrencies = () => {
  const temp = fromCurrency.value
  fromCurrency.value = toCurrency.value
  toCurrency.value = temp
  if (result.value !== null) {
    convert()
  }
}

const selectFromCurrency = (code) => {
  fromCurrency.value = code
  if (result.value !== null || multiResults.value.length > 0) {
    convert()
  }
}

const onCurrencyChange = () => {
  if (result.value !== null || multiResults.value.length > 0) {
    convert()
  }
}

const addTargetCurrency = () => {
  if (targetCurrencies.value.length < 3) {
    const available = currencyList.find(c => !targetCurrencies.value.includes(c.code))
    if (available) {
      targetCurrencies.value.push(available.code)
      if (multiResults.value.length > 0) {
        convert()
      }
    }
  }
}

const removeTargetCurrency = (index) => {
  if (targetCurrencies.value.length > 1) {
    targetCurrencies.value.splice(index, 1)
    if (multiResults.value.length > 0) {
      convert()
    }
  }
}

const isCurrencySelected = (code, currentIndex) => {
  return targetCurrencies.value.some((c, i) => c === code && i !== currentIndex)
}

const fetchHistoricalData = async () => {
  try {
    const response = await getHistoricalRates(fromCurrency.value, toCurrency.value, 7)
    if (response.code === 200) {
      historicalData.value = response.data.historicalData
      await nextTick()
      renderChart()
    }
  } catch (error) {
    console.error('获取历史数据失败:', error)
  }
}

const fetchMultiHistoricalData = async () => {
  try {
    const results = await Promise.all(
      targetCurrencies.value.map(currency =>
        getHistoricalRates(fromCurrency.value, currency, 7)
      )
    )
    
    multiHistoricalData.value = {}
    results.forEach((response, index) => {
      if (response.code === 200) {
        multiHistoricalData.value[targetCurrencies.value[index]] = response.data.historicalData
      }
    })
    
    await nextTick()
    renderMultiChart()
  } catch (error) {
    console.error('获取历史数据失败:', error)
  }
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = historicalData.value.map(item => item.date)
  const values = historicalData.value.map(item => item.rate)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>汇率: ${data.value}`
      }
    },
    legend: {
      data: [`${fromCurrency.value}/${toCurrency.value}`]
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
      data: dates
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series: [
      {
        name: `${fromCurrency.value}/${toCurrency.value}`,
        type: 'line',
        smooth: true,
        data: values,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const renderMultiChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const currencies = targetCurrencies.value
  const dates = multiHistoricalData.value[currencies[0]]?.map(item => item.date) || []

  const series = currencies.map((currency, index) => ({
    name: `${fromCurrency.value}/${currency}`,
    type: 'line',
    smooth: true,
    data: multiHistoricalData.value[currency]?.map(item => item.rate) || [],
    lineStyle: {
      color: resultColors[index],
      width: 2
    },
    itemStyle: {
      color: resultColors[index]
    }
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].name}<br/>`
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}<br/>`
        })
        return result
      }
    },
    legend: {
      data: currencies.map(c => `${fromCurrency.value}/${c}`)
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
      data: dates
    },
    yAxis: {
      type: 'value',
      scale: true
    },
    series
  }

  chartInstance.setOption(option)
}

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

const formatUpdateTime = (timeStr) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', { hour12: false })
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

onMounted(() => {
  loadPreference()
  fetchRates()
  window.addEventListener('resize', handleResize)
})

watch([fromCurrency, toCurrency], () => {
  fetchRates()
})

watch(multiTargetMode, () => {
  result.value = null
  multiResults.value = []
  historicalData.value = []
  multiHistoricalData.value = {}
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.currency-converter {
  max-width: 900px;
  margin: 0 auto;
}

.main-card,
.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
  color: #409EFF;
}

.update-time {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.mode-switch {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.common-currencies {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.common-currencies .label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #606266;
}

.currency-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.converter-form {
  margin-bottom: 24px;
}

.currency-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.currency-item {
  flex: 1;
}

.swap-button {
  padding-bottom: 18px;
}

.multi-target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.multi-target-header .label {
  font-weight: 500;
  color: #606266;
}

.multi-target-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.multi-target-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.result-card :deep(.el-card__body) {
  padding: 24px;
}

.result-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: #fff;
}

.from-amount,
.to-amount {
  text-align: center;
}

.currency-code {
  display: block;
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.amount {
  display: block;
  font-size: 32px;
  font-weight: bold;
}

.equals {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.rate-info {
  text-align: center;
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.multi-results {
  margin-top: 20px;
}

.multi-results-header {
  text-align: center;
  margin-bottom: 16px;
}

.multi-results-header .from-display {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.multi-results-header .equals {
  font-size: 24px;
  color: #909399;
  margin-left: 8px;
}

.multi-results-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.multi-result-item {
  background: linear-gradient(135deg, var(--item-color) 0%, rgba(102, 126, 234, 0.8) 100%);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  text-align: center;
}

.multi-result-item .result-info {
  margin-bottom: 8px;
}

.multi-result-item .currency-code {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.multi-result-item .amount {
  font-size: 24px;
  font-weight: bold;
}

.multi-result-item .rate-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8px;
}

.chart-container {
  height: 350px;
  width: 100%;
}

@media (max-width: 768px) {
  .currency-row {
    flex-direction: column;
    align-items: stretch;
  }

  .swap-button {
    text-align: center;
    padding: 0;
  }

  .amount {
    font-size: 24px;
  }

  .result-content {
    flex-direction: column;
    gap: 12px;
  }

  .multi-results-list {
    grid-template-columns: 1fr;
  }

  .multi-result-item .amount {
    font-size: 20px;
  }
}
</style>
