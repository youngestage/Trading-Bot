import OandaAPI from './oandaAPI'
import AILearning from './aiLearning'
import TechnicalAnalysis from './technicalAnalysis'
import RiskManager from './riskManager'
import { 
  BotConfig, 
  Trade, 
  Position, 
  MarketData, 
  TechnicalIndicators, 
  AISignal, 
  Performance,
  OandaConfig 
} from '../types/trading'

export class TradingBot {
  private oandaAPI: OandaAPI | null = null
  private aiLearning: AILearning
  private riskManager: RiskManager
  private config: BotConfig
  private isRunning: boolean = false
  private tradingInterval: NodeJS.Timeout | null = null
  private marketData: MarketData[] = []
  private currentPrice: number = 0
  private indicators: TechnicalIndicators | null = null
  private positions: Position[] = []
  private trades: Trade[] = []
  private performance: Performance = {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalPnL: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0
  }

  // Event callbacks
  private onPriceUpdate?: (price: number) => void
  private onTradeExecuted?: (trade: Trade) => void
  private onPositionUpdate?: (positions: Position[]) => void
  private onPerformanceUpdate?: (performance: Performance) => void
  private onError?: (error: string) => void
  private onIndicatorsUpdate?: (indicators: TechnicalIndicators) => void
  private onAISignal?: (signal: AISignal) => void

  constructor(config: BotConfig) {
    this.config = config
    this.aiLearning = new AILearning()
    this.riskManager = new RiskManager(config)
  }

  // Initialize the bot with OANDA credentials
  initialize(oandaConfig: OandaConfig): void {
    this.oandaAPI = new OandaAPI(oandaConfig)
  }

  // Set event callbacks
  setCallbacks(callbacks: {
    onPriceUpdate?: (price: number) => void
    onTradeExecuted?: (trade: Trade) => void
    onPositionUpdate?: (positions: Position[]) => void
    onPerformanceUpdate?: (performance: Performance) => void
    onError?: (error: string) => void
    onIndicatorsUpdate?: (indicators: TechnicalIndicators) => void
    onAISignal?: (signal: AISignal) => void
  }): void {
    this.onPriceUpdate = callbacks.onPriceUpdate
    this.onTradeExecuted = callbacks.onTradeExecuted
    this.onPositionUpdate = callbacks.onPositionUpdate
    this.onPerformanceUpdate = callbacks.onPerformanceUpdate
    this.onError = callbacks.onError
    this.onIndicatorsUpdate = callbacks.onIndicatorsUpdate
    this.onAISignal = callbacks.onAISignal
  }

  // Start the trading bot
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running')
    }

    if (!this.oandaAPI) {
      throw new Error('OANDA API not initialized')
    }

    try {
      // Test connection
      const connected = await this.oandaAPI.testConnection()
      if (!connected) {
        throw new Error('Failed to connect to OANDA API')
      }

      // Load initial market data
      await this.loadMarketData()

      this.isRunning = true
      this.config.isActive = true

      // Start main trading loop
      this.tradingInterval = setInterval(async () => {
        await this.executeTradingCycle()
      }, 45000) // 45 seconds

      console.log('🤖 EUR/USD Trading Bot started successfully')
    } catch (error) {
      this.onError?.(`Failed to start bot: ${error}`)
      throw error
    }
  }

  // Stop the trading bot
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.config.isActive = false

    if (this.tradingInterval) {
      clearInterval(this.tradingInterval)
      this.tradingInterval = null
    }

    console.log('🛑 EUR/USD Trading Bot stopped')
  }

  // Main trading cycle
  private async executeTradingCycle(): Promise<void> {
    if (!this.isRunning || !this.oandaAPI) {
      return
    }

    try {
      // Update market data
      await this.updateMarketData()

      // Calculate technical indicators
      this.calculateTechnicalIndicators()

      // Update positions
      await this.updatePositions()

      // Check risk management
      await this.performRiskChecks()

      // Generate trading signals
      await this.generateTradingSignals()

      // Update performance metrics
      this.updatePerformanceMetrics()

    } catch (error) {
      this.onError?.(`Trading cycle error: ${error}`)
    }
  }

  // Load initial market data
  private async loadMarketData(): Promise<void> {
    if (!this.oandaAPI) return

    try {
      const historicalData = await this.oandaAPI.getHistoricalData(200, 'M5')
      this.marketData = historicalData
    } catch (error) {
      console.error('Failed to load market data:', error)
    }
  }

  // Update market data with latest prices
  private async updateMarketData(): Promise<void> {
    if (!this.oandaAPI) return

    try {
      // Get current price
      const currentPrice = await this.oandaAPI.getCurrentPrice()
      this.currentPrice = currentPrice
      this.onPriceUpdate?.(currentPrice)

      // Get latest candle
      const latestData = await this.oandaAPI.getHistoricalData(1, 'M1')
      if (latestData.length > 0) {
        this.marketData.push(latestData[0])
        
        // Keep only last 500 candles for performance
        if (this.marketData.length > 500) {
          this.marketData = this.marketData.slice(-500)
        }
      }
    } catch (error) {
      console.error('Failed to update market data:', error)
    }
  }

  // Calculate technical indicators
  private calculateTechnicalIndicators(): void {
    if (this.marketData.length < 50) return

    try {
      this.indicators = TechnicalAnalysis.calculateAllIndicators(this.marketData)
      this.onIndicatorsUpdate?.(this.indicators)
    } catch (error) {
      console.error('Failed to calculate indicators:', error)
    }
  }

  // Update positions
  private async updatePositions(): Promise<void> {
    if (!this.oandaAPI) return

    try {
      const positions = await this.oandaAPI.getOpenPositions()
      
      // Update positions with current prices
      this.positions = positions.map(pos => ({
        ...pos,
        currentPrice: this.currentPrice,
        pnl: this.calculatePositionPnL(pos),
        pnlPercent: this.calculatePositionPnLPercent(pos)
      }))

      this.onPositionUpdate?.(this.positions)
    } catch (error) {
      console.error('Failed to update positions:', error)
    }
  }

  // Calculate position P&L
  private calculatePositionPnL(position: Position): number {
    const priceDifference = position.type === 'buy' 
      ? this.currentPrice - position.openPrice
      : position.openPrice - this.currentPrice

    return priceDifference * position.size
  }

  // Calculate position P&L percentage
  private calculatePositionPnLPercent(position: Position): number {
    const pnl = this.calculatePositionPnL(position)
    const investment = position.openPrice * position.size
    return (pnl / investment) * 100
  }

  // Perform risk management checks
  private async performRiskChecks(): Promise<void> {
    if (!this.oandaAPI) return

    try {
      const accountBalance = await this.oandaAPI.getAccountBalance()
      
      // Check if should close all positions
      const shouldClose = this.riskManager.shouldCloseAllPositions(this.positions, accountBalance)
      
      if (shouldClose.shouldClose) {
        console.log(`🚨 Risk alert: ${shouldClose.reason}`)
        await this.closeAllPositions()
        this.onError?.(`Risk management triggered: ${shouldClose.reason}`)
      }
    } catch (error) {
      console.error('Risk check failed:', error)
    }
  }

  // Generate trading signals
  private async generateTradingSignals(): Promise<void> {
    if (!this.indicators || !this.oandaAPI) return

    try {
      // Get technical analysis signal
      const technicalSignal = TechnicalAnalysis.generateTechnicalSignals(
        this.indicators, 
        this.currentPrice
      )

      // Get AI signal
      const aiSignal = await this.aiLearning.generateSignal(
        this.marketData, 
        this.indicators
      )

      this.onAISignal?.(aiSignal)

      // Combine signals
      const combinedSignal = this.combineSignals(technicalSignal, aiSignal)

      // Execute trade if signal is strong enough
      if (combinedSignal.signal !== 'hold' && combinedSignal.confidence > 0.75) {
        await this.executeTrade(combinedSignal.signal, combinedSignal.confidence)
      }
    } catch (error) {
      console.error('Failed to generate signals:', error)
    }
  }

  // Combine technical and AI signals
  private combineSignals(
    technicalSignal: { signal: 'buy' | 'sell' | 'hold', confidence: number },
    aiSignal: AISignal
  ): { signal: 'buy' | 'sell' | 'hold', confidence: number } {
    
    // Weight: 40% technical, 60% AI
    const techWeight = 0.4
    const aiWeight = 0.6

    if (technicalSignal.signal === aiSignal.signal) {
      // Signals agree - combine confidence
      const combinedConfidence = (technicalSignal.confidence * techWeight) + (aiSignal.confidence * aiWeight)
      return {
        signal: technicalSignal.signal,
        confidence: combinedConfidence
      }
    } else if (technicalSignal.signal === 'hold') {
      // Technical is neutral, use AI signal
      return {
        signal: aiSignal.signal,
        confidence: aiSignal.confidence * aiWeight
      }
    } else if (aiSignal.signal === 'hold') {
      // AI is neutral, use technical signal
      return {
        signal: technicalSignal.signal,
        confidence: technicalSignal.confidence * techWeight
      }
    } else {
      // Signals disagree - return hold
      return {
        signal: 'hold',
        confidence: 0.3
      }
    }
  }

  // Execute trade
  private async executeTrade(signal: 'buy' | 'sell', confidence: number): Promise<void> {
    if (!this.oandaAPI) return

    try {
      const accountBalance = await this.oandaAPI.getAccountBalance()
      
      // Calculate position size
      const positionSize = this.riskManager.calculatePositionSize(
        accountBalance,
        this.config.strategy.risk.stopLoss,
        this.config.strategy.risk.maxRisk
      )

      // Calculate stop loss and take profit
      const { stopLoss, takeProfit } = this.riskManager.calculateStopLossTakeProfit(
        this.currentPrice,
        signal,
        this.config.strategy.risk.stopLoss,
        this.config.strategy.risk.takeProfit
      )

      // Create trade object
      const proposedTrade: Partial<Trade> = {
        pair: 'EUR/USD',
        type: signal,
        size: positionSize,
        openPrice: this.currentPrice,
        stopLoss,
        takeProfit,
        confidence,
        strategy: 'AI-Technical'
      }

      // Check if trade is allowed
      const canTrade = this.riskManager.canPlaceTrade(this.positions, proposedTrade)
      
      if (!canTrade.allowed) {
        console.log(`❌ Trade blocked: ${canTrade.reason}`)
        return
      }

      // Validate trade
      const validation = this.riskManager.validateTrade(proposedTrade)
      
      if (!validation.valid) {
        console.log(`❌ Trade validation failed: ${validation.errors.join(', ')}`)
        return
      }

      // Execute trade
      const executedTrade = await this.oandaAPI.placeTrade(
        signal,
        positionSize * 100000, // Convert lots to units
        stopLoss,
        takeProfit
      )

      // Add to trades list
      this.trades.unshift(executedTrade)
      this.onTradeExecuted?.(executedTrade)

      console.log(`✅ Trade executed: ${signal.toUpperCase()} ${positionSize} lots at ${this.currentPrice}`)

    } catch (error) {
      console.error('Failed to execute trade:', error)
      this.onError?.(`Trade execution failed: ${error}`)
    }
  }

  // Close all positions
  private async closeAllPositions(): Promise<void> {
    if (!this.oandaAPI) return

    try {
      for (const position of this.positions) {
        await this.oandaAPI.closePosition(position.id)
      }
      
      this.positions = []
      this.onPositionUpdate?.(this.positions)
    } catch (error) {
      console.error('Failed to close positions:', error)
    }
  }

  // Update performance metrics
  private updatePerformanceMetrics(): void {
    const closedTrades = this.trades.filter(t => t.status === 'closed')
    
    if (closedTrades.length === 0) return

    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0)
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
      : 0
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0

    this.performance = {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
      totalPnL,
      maxDrawdown: this.calculateMaxDrawdown(closedTrades),
      sharpeRatio: this.calculateSharpeRatio(closedTrades),
      profitFactor: avgLoss > 0 ? (winningTrades.length * avgWin) / (losingTrades.length * avgLoss) : 0,
      avgWin,
      avgLoss
    }

    this.onPerformanceUpdate?.(this.performance)
  }

  // Calculate maximum drawdown
  private calculateMaxDrawdown(trades: Trade[]): number {
    let maxDrawdown = 0
    let peak = 0
    let runningPnL = 0

    for (const trade of trades) {
      runningPnL += trade.pnl || 0
      peak = Math.max(peak, runningPnL)
      const drawdown = peak - runningPnL
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return maxDrawdown
  }

  // Calculate Sharpe ratio
  private calculateSharpeRatio(trades: Trade[]): number {
    if (trades.length < 2) return 0

    const returns = trades.map(t => t.pnl || 0)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    return stdDev > 0 ? avgReturn / stdDev : 0
  }

  // Train AI model
  async trainAI(onProgress?: (progress: number) => void): Promise<number> {
    // Generate training data from historical trades
    const trainingData = this.generateTrainingData()
    
    if (trainingData.length === 0) {
      throw new Error('No training data available')
    }

    return await this.aiLearning.trainModel(trainingData, onProgress)
  }

  // Generate training data from historical trades
  private generateTrainingData(): Array<{
    marketData: MarketData[]
    indicators: TechnicalIndicators
    outcome: 'buy' | 'sell' | 'hold'
  }> {
    // This would normally analyze historical data and outcomes
    // For demo purposes, return empty array
    return []
  }

  // Get current state
  getState(): {
    isRunning: boolean
    currentPrice: number
    positions: Position[]
    trades: Trade[]
    performance: Performance
    indicators: TechnicalIndicators | null
  } {
    return {
      isRunning: this.isRunning,
      currentPrice: this.currentPrice,
      positions: this.positions,
      trades: this.trades,
      performance: this.performance,
      indicators: this.indicators
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<BotConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.riskManager.updateConfig(this.config)
  }
}

export default TradingBot 