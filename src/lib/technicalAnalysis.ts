import { MarketData, TechnicalIndicators } from '../types/trading'

export class TechnicalAnalysis {
  // Calculate RSI (Relative Strength Index)
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50

    const gains: number[] = []
    const losses: number[] = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    // Calculate average gain and loss
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  // Calculate Simple Moving Average
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]
    
    const relevantPrices = prices.slice(-period)
    return relevantPrices.reduce((a, b) => a + b, 0) / period
  }

  // Calculate Exponential Moving Average
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }

    return ema
  }

  // Calculate MACD
  static calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    const fastEMA = this.calculateEMA(prices, fastPeriod)
    const slowEMA = this.calculateEMA(prices, slowPeriod)
    const macdLine = fastEMA - slowEMA

    // For simplicity, using SMA for signal line (should be EMA in practice)
    const macdHistory = [macdLine] // In real implementation, maintain history
    const signalLine = this.calculateSMA(macdHistory, signalPeriod)
    const histogram = macdLine - signalLine

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    }
  }

  // Calculate Bollinger Bands
  static calculateBollingerBands(prices: number[], period: number = 20, deviation: number = 2) {
    const sma = this.calculateSMA(prices, period)
    
    if (prices.length < period) {
      return {
        upper: sma,
        middle: sma,
        lower: sma
      }
    }

    const relevantPrices = prices.slice(-period)
    const variance = relevantPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
    const stdDev = Math.sqrt(variance)

    return {
      upper: sma + (stdDev * deviation),
      middle: sma,
      lower: sma - (stdDev * deviation)
    }
  }

  // Calculate all technical indicators
  static calculateAllIndicators(marketData: MarketData[]): TechnicalIndicators {
    const closePrices = marketData.map(d => d.close)
    
    return {
      rsi: this.calculateRSI(closePrices, 14),
      sma20: this.calculateSMA(closePrices, 20),
      sma50: this.calculateSMA(closePrices, 50),
      macd: this.calculateMACD(closePrices, 12, 26, 9),
      bb: this.calculateBollingerBands(closePrices, 20, 2)
    }
  }

  // Generate trading signals based on technical analysis
  static generateTechnicalSignals(indicators: TechnicalIndicators, currentPrice: number): {
    signal: 'buy' | 'sell' | 'hold'
    confidence: number
    reasons: string[]
  } {
    const signals: Array<{ signal: 'buy' | 'sell' | 'hold', weight: number, reason: string }> = []

    // RSI signals
    if (indicators.rsi < 30) {
      signals.push({ signal: 'buy', weight: 0.3, reason: 'RSI oversold' })
    } else if (indicators.rsi > 70) {
      signals.push({ signal: 'sell', weight: 0.3, reason: 'RSI overbought' })
    }

    // Moving average signals
    if (indicators.sma20 > indicators.sma50) {
      signals.push({ signal: 'buy', weight: 0.2, reason: 'SMA20 above SMA50' })
    } else if (indicators.sma20 < indicators.sma50) {
      signals.push({ signal: 'sell', weight: 0.2, reason: 'SMA20 below SMA50' })
    }

    // Price vs SMA signals
    if (currentPrice > indicators.sma20) {
      signals.push({ signal: 'buy', weight: 0.15, reason: 'Price above SMA20' })
    } else if (currentPrice < indicators.sma20) {
      signals.push({ signal: 'sell', weight: 0.15, reason: 'Price below SMA20' })
    }

    // MACD signals
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      signals.push({ signal: 'buy', weight: 0.25, reason: 'MACD bullish crossover' })
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      signals.push({ signal: 'sell', weight: 0.25, reason: 'MACD bearish crossover' })
    }

    // Bollinger Bands signals
    if (currentPrice < indicators.bb.lower) {
      signals.push({ signal: 'buy', weight: 0.2, reason: 'Price below lower Bollinger Band' })
    } else if (currentPrice > indicators.bb.upper) {
      signals.push({ signal: 'sell', weight: 0.2, reason: 'Price above upper Bollinger Band' })
    }

    // Calculate weighted signal
    const buyWeight = signals.filter(s => s.signal === 'buy').reduce((sum, s) => sum + s.weight, 0)
    const sellWeight = signals.filter(s => s.signal === 'sell').reduce((sum, s) => sum + s.weight, 0)
    
    let finalSignal: 'buy' | 'sell' | 'hold' = 'hold'
    let confidence = 0
    
    if (buyWeight > sellWeight && buyWeight > 0.5) {
      finalSignal = 'buy'
      confidence = Math.min(buyWeight, 1.0)
    } else if (sellWeight > buyWeight && sellWeight > 0.5) {
      finalSignal = 'sell'
      confidence = Math.min(sellWeight, 1.0)
    } else {
      confidence = 0.3 // Low confidence for hold
    }

    const reasons = signals
      .filter(s => s.signal === finalSignal)
      .map(s => s.reason)

    return {
      signal: finalSignal,
      confidence,
      reasons
    }
  }

  // Calculate support and resistance levels
  static calculateSupportResistance(marketData: MarketData[]): {
    support: number[]
    resistance: number[]
  } {
    if (marketData.length < 20) {
      return { support: [], resistance: [] }
    }

    const highs = marketData.map(d => d.high)
    const lows = marketData.map(d => d.low)
    
    // Find local maxima and minima
    const resistance: number[] = []
    const support: number[] = []
    
    for (let i = 2; i < highs.length - 2; i++) {
      // Local maximum (resistance)
      if (highs[i] > highs[i-1] && highs[i] > highs[i+1] && 
          highs[i] > highs[i-2] && highs[i] > highs[i+2]) {
        resistance.push(highs[i])
      }
      
      // Local minimum (support)
      if (lows[i] < lows[i-1] && lows[i] < lows[i+1] && 
          lows[i] < lows[i-2] && lows[i] < lows[i+2]) {
        support.push(lows[i])
      }
    }
    
    // Sort and return most recent levels
    return {
      support: support.sort((a, b) => b - a).slice(0, 3),
      resistance: resistance.sort((a, b) => a - b).slice(0, 3)
    }
  }

  // Calculate volatility
  static calculateVolatility(marketData: MarketData[], period: number = 14): number {
    if (marketData.length < period) return 0

    const returns = []
    for (let i = 1; i < marketData.length; i++) {
      const returnValue = (marketData[i].close - marketData[i-1].close) / marketData[i-1].close
      returns.push(returnValue)
    }

    const recentReturns = returns.slice(-period)
    const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length
    const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / recentReturns.length
    
    return Math.sqrt(variance) * Math.sqrt(252) // Annualized volatility
  }
}

export default TechnicalAnalysis 