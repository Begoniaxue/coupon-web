import axios from 'axios'

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6'

export const currencyList = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'SEK', name: '瑞典克朗', symbol: 'kr' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'NOK', name: '挪威克朗', symbol: 'kr' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$' },
  { code: 'TWD', name: '新台币', symbol: 'NT$' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$' },
  { code: 'DKK', name: '丹麦克朗', symbol: 'kr' },
  { code: 'PLN', name: '波兰兹罗提', symbol: 'zł' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'ILS', name: '以色列新谢克尔', symbol: '₪' },
  { code: 'IDR', name: '印尼盾', symbol: 'Rp' },
  { code: 'CZK', name: '捷克克朗', symbol: 'Kč' },
  { code: 'AED', name: '阿联酋迪拉姆', symbol: 'د.إ' },
  { code: 'TRY', name: '土耳其里拉', symbol: '₺' },
  { code: 'HUF', name: '匈牙利福林', symbol: 'Ft' },
  { code: 'CLP', name: '智利比索', symbol: '$' },
  { code: 'SAR', name: '沙特里亚尔', symbol: '﷼' },
  { code: 'PHP', name: '菲律宾比索', symbol: '₱' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM' },
  { code: 'COP', name: '哥伦比亚比索', symbol: '$' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽' },
  { code: 'RON', name: '罗马尼亚列伊', symbol: 'lei' },
  { code: 'PEN', name: '秘鲁索尔', symbol: 'S/' },
  { code: 'BGN', name: '保加利亚列弗', symbol: 'лв' },
  { code: 'ARS', name: '阿根廷比索', symbol: '$' },
  { code: 'NGN', name: '尼日利亚奈拉', symbol: '₦' },
  { code: 'VND', name: '越南盾', symbol: '₫' },
  { code: 'KES', name: '肯尼亚先令', symbol: 'KSh' },
  { code: 'UYU', name: '乌拉圭比索', symbol: '$U' },
  { code: 'DZD', name: '阿尔及利亚第纳尔', symbol: 'د.ج' },
  { code: 'MAD', name: '摩洛哥迪拉姆', symbol: 'د.م.' },
  { code: 'EGP', name: '埃及镑', symbol: '£' },
  { code: 'PKR', name: '巴基斯坦卢比', symbol: '₨' },
  { code: 'UAH', name: '乌克兰格里夫纳', symbol: '₴' },
  { code: 'QAR', name: '卡塔尔里亚尔', symbol: 'ر.ق' },
  { code: 'KZT', name: '哈萨克斯坦坚戈', symbol: '₸' },
  { code: 'OMR', name: '阿曼里亚尔', symbol: 'ر.ع.' },
  { code: 'LKR', name: '斯里兰卡卢比', symbol: 'රු' },
  { code: 'BDT', name: '孟加拉塔卡', symbol: '৳' },
  { code: 'RSD', name: '塞尔维亚第纳尔', symbol: 'дин.' },
  { code: 'GHS', name: '加纳塞地', symbol: 'GH₵' },
  { code: 'HRK', name: '克罗地亚库纳', symbol: 'kn' },
  { code: 'TND', name: '突尼斯第纳尔', symbol: 'د.ت' },
  { code: 'BYN', name: '白俄罗斯卢布', symbol: 'Br' },
  { code: 'GTQ', name: '危地马拉格查尔', symbol: 'Q' },
  { code: 'BHD', name: '巴林第纳尔', symbol: '.د.ب' },
  { code: 'CRC', name: '哥斯达黎加科朗', symbol: '₡' },
  { code: 'UZS', name: '乌兹别克斯坦苏姆', symbol: 'лв' },
  { code: 'BWP', name: '博茨瓦纳普拉', symbol: 'P' },
  { code: 'DOP', name: '多米尼加比索', symbol: '$' },
  { code: 'TMT', name: '土库曼斯坦马纳特', symbol: 'T' },
  { code: 'MOP', name: '澳门元', symbol: 'MOP$' },
  { code: 'GEL', name: '格鲁吉亚拉里', symbol: '₾' },
  { code: 'KWD', name: '科威特第纳尔', symbol: 'د.ك' },
  { code: 'PYG', name: '巴拉圭瓜拉尼', symbol: '₲' },
  { code: 'ISK', name: '冰岛克朗', symbol: 'kr' },
  { code: 'MUR', name: '毛里求斯卢比', symbol: '₨' },
  { code: 'LBP', name: '黎巴嫩镑', symbol: 'ل.ل' },
  { code: 'JOD', name: '约旦第纳尔', symbol: 'د.ا' },
  { code: 'MGA', name: '马达加斯加阿里亚里', symbol: 'Ar' },
  { code: 'RWF', name: '卢旺达法郎', symbol: 'FRw' },
  { code: 'TZS', name: '坦桑尼亚先令', symbol: 'TSh' },
  { code: 'XAF', name: '中非法郎', symbol: 'FCFA' },
  { code: 'XOF', name: '西非法郎', symbol: 'CFA' },
  { code: 'NPR', name: '尼泊尔卢比', symbol: 'रू' },
  { code: 'CUP', name: '古巴比索', symbol: '₱' },
  { code: 'LAK', name: '老挝基普', symbol: '₭' },
  { code: 'MKD', name: '马其顿第纳尔', symbol: 'ден' },
  { code: 'SYP', name: '叙利亚镑', symbol: '£' },
  { code: 'SDG', name: '苏丹镑', symbol: 'ج.س.' },
  { code: 'ZWL', name: '津巴布韦元', symbol: '$' },
  { code: 'BAM', name: '波斯尼亚和黑塞哥维那马克', symbol: 'KM' },
  { code: 'CDF', name: '刚果法郎', symbol: 'FC' },
  { code: 'SLL', name: '塞拉利昂利昂', symbol: 'Le' },
  { code: 'LRD', name: '利比里亚元', symbol: '$' },
  { code: 'GNF', name: '几内亚法郎', symbol: 'FG' },
  { code: 'TJS', name: '塔吉克斯坦索莫尼', symbol: 'ЅМ' },
  { code: 'NAD', name: '纳米比亚元', symbol: 'N$' },
  { code: 'CVE', name: '佛得角埃斯库多', symbol: '$' },
  { code: 'MZN', name: '莫桑比克梅蒂卡尔', symbol: 'MT' },
  { code: 'ERN', name: '厄立特里亚纳克法', symbol: 'Nfk' },
  { code: 'ETB', name: '埃塞俄比亚比尔', symbol: 'Br' },
  { code: 'MWK', name: '马拉维克瓦查', symbol: 'MK' },
  { code: 'BIF', name: '布隆迪法郎', symbol: 'FBu' },
  { code: 'PGK', name: '巴布亚新几内亚基那', symbol: 'K' },
  { code: 'AFN', name: '阿富汗尼', symbol: '؋' },
  { code: 'SOS', name: '索马里先令', symbol: 'Sh' },
  { code: 'KHR', name: '柬埔寨瑞尔', symbol: '៛' },
  { code: 'SCR', name: '塞舌尔卢比', symbol: '₨' },
  { code: 'BTN', name: '不丹努尔特鲁姆', symbol: 'Nu.' },
  { code: 'GMD', name: '冈比亚达拉西', symbol: 'D' },
  { code: 'FJD', name: '斐济元', symbol: 'FJ$' },
  { code: 'SBD', name: '所罗门群岛元', symbol: 'SI$' },
  { code: 'KID', name: '基里巴斯元', symbol: '$' },
  { code: 'TOP', name: '汤加潘加', symbol: 'T$' },
  { code: 'VUV', name: '瓦努阿图瓦图', symbol: 'VT' },
  { code: 'WST', name: '萨摩亚塔拉', symbol: 'T' },
  { code: 'STN', name: '圣多美和普林西比多布拉', symbol: 'Db' },
  { code: 'SVC', name: '萨尔瓦多科朗', symbol: '₡' },
  { code: 'KYD', name: '开曼群岛元', symbol: '$' },
  { code: 'BZD', name: '伯利兹元', symbol: 'BZ$' },
  { code: 'GYD', name: '圭亚那元', symbol: '$' },
  { code: 'XCD', name: '东加勒比元', symbol: 'EC$' },
  { code: 'HTG', name: '海地古德', symbol: 'G' },
  { code: 'JMD', name: '牙买加元', symbol: 'J$' },
  { code: 'TTD', name: '特立尼达和多巴哥元', symbol: 'TT$' },
  { code: 'ANG', name: '荷属安的列斯盾', symbol: 'ƒ' },
  { code: 'AWG', name: '阿鲁巴弗罗林', symbol: 'ƒ' },
  { code: 'HNL', name: '洪都拉斯伦皮拉', symbol: 'L' },
  { code: 'NIO', name: '尼加拉瓜科多巴', symbol: 'C$' },
  { code: 'GGP', name: '根西岛镑', symbol: '£' },
  { code: 'JEP', name: '泽西岛镑', symbol: '£' },
  { code: 'IMP', name: '马恩岛镑', symbol: '£' },
  { code: 'SHP', name: '圣赫勒拿镑', symbol: '£' },
  { code: 'FKP', name: '福克兰群岛镑', symbol: '£' },
  { code: 'GIP', name: '直布罗陀镑', symbol: '£' },
  { code: 'LSL', name: '莱索托洛蒂', symbol: 'L' },
  { code: 'SZL', name: '斯威士兰里兰吉尼', symbol: 'E' },
  { code: 'ZMW', name: '赞比亚克瓦查', symbol: 'K' },
  { code: 'MRU', name: '毛里塔尼亚乌吉亚', symbol: 'UM' },
  { code: 'CHW', name: '韦里耶法郎', symbol: 'Fr' },
  { code: 'CHE', name: 'WIR欧元', symbol: '€' },
  { code: 'XDR', name: '特别提款权', symbol: 'SDR' },
  { code: 'XAG', name: '银盎司', symbol: 'oz t' },
  { code: 'XAU', name: '金盎司', symbol: 'oz t' },
  { code: 'XPD', name: '钯盎司', symbol: 'oz t' },
  { code: 'XPT', name: '铂盎司', symbol: 'oz t' },
  { code: 'CNH', name: '离岸人民币', symbol: '¥' }
]

export const commonCurrencies = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' }
]

export const getExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const response = await axios.get(`${EXCHANGE_RATE_API}/latest/${baseCurrency}`)
    if (response.data.result === 'success' && response.data.conversion_rates) {
      return {
        code: 200,
        data: {
          baseCode: response.data.base_code,
          rates: response.data.conversion_rates,
          updateTime: response.data.time_last_update_utc
        },
        message: 'success'
      }
    }
  } catch (error) {
    console.error('API 获取汇率失败，使用 mock 数据:', error.message)
  }
  
  const mockRates = generateMockRates(baseCurrency)
  return {
    code: 200,
    data: {
      baseCode: baseCurrency,
      rates: mockRates,
      updateTime: new Date().toISOString()
    },
    message: 'success (mock data)'
  }
}

const generateMockRates = (baseCurrency = 'USD') => {
  const usdBaseRates = {
    USD: 1,
    CNY: 7.245,
    EUR: 0.923,
    GBP: 0.789,
    JPY: 149.5,
    HKD: 7.812,
    AUD: 1.53,
    CAD: 1.36,
    CHF: 0.882,
    SGD: 1.34,
    KRW: 1320,
    INR: 83.2,
    MXN: 17.1,
    BRL: 4.97,
    TWD: 31.5
  }
  
  const rates = {}
  const baseToUsd = usdBaseRates[baseCurrency] || 1
  
  currencyList.forEach(currency => {
    const usdRate = usdBaseRates[currency.code] || (0.5 + Math.random() * 100)
    rates[currency.code] = Number((usdRate / baseToUsd).toFixed(6))
  })
  
  return rates
}

export const getHistoricalRates = (baseCurrency, targetCurrency, days = 7) => {
  return new Promise((resolve, reject) => {
    const historicalData = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const baseRate = getBaseRate(baseCurrency, targetCurrency)
      const variation = (Math.random() - 0.5) * 0.05 * baseRate
      historicalData.push({
        date: formatDate(date),
        rate: (baseRate + variation).toFixed(6) * 1
      })
    }
    
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          baseCode: baseCurrency,
          targetCode: targetCurrency,
          historicalData
        },
        message: 'success'
      })
    }, 200)
  })
}

const getBaseRate = (base, target) => {
  const usdRates = {
    USD: 1,
    CNY: 7.245,
    EUR: 0.923,
    GBP: 0.789,
    JPY: 149.5,
    HKD: 7.812,
    AUD: 1.53,
    CAD: 1.36,
    CHF: 0.882,
    SGD: 1.34
  }
  
  const baseToUsd = usdRates[base] || 1
  const targetToUsd = usdRates[target] || 1
  
  return targetToUsd / baseToUsd
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getCurrencyName = (code) => {
  const currency = currencyList.find(c => c.code === code)
  return currency ? currency.name : code
}

export const getCurrencySymbol = (code) => {
  const currency = currencyList.find(c => c.code === code)
  return currency ? currency.symbol : ''
}
