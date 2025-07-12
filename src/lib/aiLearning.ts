import * as tf from '@tensorflow/tfjs'
import { MarketData, TechnicalIndicators, AISignal, Trade } from '../types/trading'

export class AILearning {
  private model: tf.Sequential | null = null
  private isTraining = false
  private inputFeatures = 20 // Number of input features

  constructor() {
    this.initializeModel()
  }

  // Initialize neural network model
  private initializeModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [this.inputFeatures],
          units: 64,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dropout({ rate: 0.15 }),
        tf.layers.dense({
          units: 16,
          activation: 'relu',
          kernelInitializer: 'glorotNormal'
        }),
        tf.layers.dense({
          units: 3, // buy, sell, hold
          activation: 'softmax'
        })
      ]
    })

    this.model.compile({
      optimizer: tf.train.adam(0.008),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
  }

  // Extract features from market data and indicators
  private extractFeatures(
    marketData: MarketData[],
    indicators: TechnicalIndicators
  ): number[] {
    if (marketData.length < 10) {
      return new Array(this.inputFeatures).fill(0)
    }

    const recent = marketData.slice(-10)
    const features: number[] = []

    // Price-based features
    const currentPrice = recent[recent.length - 1].close
    const previousPrice = recent[recent.length - 2].close
    const priceChange = (currentPrice - previousPrice) / previousPrice
    features.push(priceChange)

    // Volatility (standard deviation of last 10 closes)
    const prices = recent.map(d => d.close)
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length
    const volatility = Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
    )
    features.push(volatility)

    // Volume trend
    const avgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length
    const currentVolume = recent[recent.length - 1].volume
    const volumeRatio = currentVolume / avgVolume
    features.push(volumeRatio)

    // Technical indicators
    features.push(indicators.rsi / 100) // Normalize RSI
    features.push((indicators.sma20 - currentPrice) / currentPrice) // SMA20 relative position
    features.push((indicators.sma50 - currentPrice) / currentPrice) // SMA50 relative position
    features.push(indicators.macd.macd / currentPrice) // MACD normalized
    features.push(indicators.macd.signal / currentPrice) // MACD signal normalized
    features.push(indicators.macd.histogram / currentPrice) // MACD histogram normalized
    
    // Bollinger Bands
    features.push((currentPrice - indicators.bb.lower) / (indicators.bb.upper - indicators.bb.lower))
    features.push((indicators.bb.upper - currentPrice) / currentPrice)
    features.push((currentPrice - indicators.bb.lower) / currentPrice)

    // Time-based features
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()
    features.push(Math.sin(2 * Math.PI * hour / 24)) // Hour as sine wave
    features.push(Math.cos(2 * Math.PI * hour / 24)) // Hour as cosine wave
    features.push(Math.sin(2 * Math.PI * dayOfWeek / 7)) // Day of week as sine wave
    features.push(Math.cos(2 * Math.PI * dayOfWeek / 7)) // Day of week as cosine wave

    // Moving averages trend
    const sma20Trend = recent.length > 5 ? 
      (indicators.sma20 - recent[recent.length - 6].close) / recent[recent.length - 6].close : 0
    const sma50Trend = recent.length > 5 ? 
      (indicators.sma50 - recent[recent.length - 6].close) / recent[recent.length - 6].close : 0
    
    features.push(sma20Trend)
    features.push(sma50Trend)

    // Ensure we have exactly the right number of features
    while (features.length < this.inputFeatures) {
      features.push(0)
    }

    return features.slice(0, this.inputFeatures)
  }

  // Generate trading signal
  async generateSignal(
    marketData: MarketData[],
    indicators: TechnicalIndicators
  ): Promise<AISignal> {
    if (!this.model) {
      throw new Error('Model not initialized')
    }

    const features = this.extractFeatures(marketData, indicators)
    const inputTensor = tf.tensor2d([features], [1, this.inputFeatures])

    try {
      const prediction = this.model.predict(inputTensor) as tf.Tensor
      const predictionData = await prediction.data()
      
      // Get the prediction probabilities
      const buyProb = predictionData[0]
      const sellProb = predictionData[1]
      const holdProb = predictionData[2]

      // Determine signal based on highest probability
      let signal: 'buy' | 'sell' | 'hold' = 'hold'
      let confidence = Math.max(buyProb, sellProb, holdProb)

      if (buyProb > sellProb && buyProb > holdProb && buyProb > 0.7) {
        signal = 'buy'
        confidence = buyProb
      } else if (sellProb > buyProb && sellProb > holdProb && sellProb > 0.7) {
        signal = 'sell'
        confidence = sellProb
      }

      return {
        pair: 'EUR/USD',
        timestamp: new Date().toISOString(),
        signal,
        confidence,
        prediction: buyProb - sellProb, // Positive = bullish, negative = bearish
        features
      }
    } finally {
      inputTensor.dispose()
    }
  }

  // Train the model on historical data
  async trainModel(
    trainingData: Array<{
      marketData: MarketData[]
      indicators: TechnicalIndicators
      outcome: 'buy' | 'sell' | 'hold'
    }>,
    onProgress?: (progress: number) => void
  ): Promise<number> {
    if (!this.model || this.isTraining) {
      throw new Error('Model not available for training')
    }

    this.isTraining = true

    try {
      // Prepare training data
      const features: number[][] = []
      const labels: number[][] = []

      trainingData.forEach(data => {
        const featureVector = this.extractFeatures(data.marketData, data.indicators)
        features.push(featureVector)

        // One-hot encode labels
        const label = [0, 0, 0]
        if (data.outcome === 'buy') label[0] = 1
        else if (data.outcome === 'sell') label[1] = 1
        else label[2] = 1
        labels.push(label)
      })

      const xs = tf.tensor2d(features)
      const ys = tf.tensor2d(labels)

      // Train the model
      const history = await this.model.fit(xs, ys, {
        epochs: 150,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (onProgress) {
              onProgress((epoch + 1) / 150)
            }
          }
        }
      })

      // Get final accuracy
      const finalAccuracy = history.history.val_acc 
        ? history.history.val_acc[history.history.val_acc.length - 1] as number
        : 0

      xs.dispose()
      ys.dispose()

      return finalAccuracy
    } finally {
      this.isTraining = false
    }
  }

  // Learn from trade outcome
  async learnFromTrade(
    marketData: MarketData[],
    indicators: TechnicalIndicators,
    trade: Trade,
    outcome: 'profit' | 'loss'
  ): Promise<void> {
    // Convert trade outcome to signal
    const signal = outcome === 'profit' ? trade.type : (trade.type === 'buy' ? 'sell' : 'buy')
    
    // Create training data point
    const trainingData = [{
      marketData,
      indicators,
      outcome: signal as 'buy' | 'sell' | 'hold'
    }]

    // Perform online learning with single data point
    await this.trainModel(trainingData)
  }

  // Save model weights
  async saveModel(): Promise<ArrayBuffer> {
    if (!this.model) {
      throw new Error('No model to save')
    }

    return await this.model.save('downloads://eur-usd-model')
  }

  // Load model weights
  async loadModel(modelData: ArrayBuffer): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(tf.io.fromMemory(modelData))
      this.model.compile({
        optimizer: tf.train.adam(0.008),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      })
    } catch (error) {
      console.error('Error loading model:', error)
      this.initializeModel() // Fallback to new model
    }
  }

  // Get model info
  getModelInfo(): { inputFeatures: number; isTraining: boolean } {
    return {
      inputFeatures: this.inputFeatures,
      isTraining: this.isTraining
    }
  }
}

export default AILearning 