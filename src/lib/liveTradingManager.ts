import { TradingBot } from './tradingBot'
import { LiveTradingConfig, getConfig, validateLiveConfig } from '../config/tradingConfig'
import { Trade, Position, Performance } from '../types/trading'

export interface LiveTradingState {
  isLive: boolean
  isConnected: boolean
  accountVerified: boolean
  emergencyStopActive: boolean
  consecutiveLosses: number
  dailyPnL: number
  lastTradeTime: Date | null
  sessionStartTime: Date
  totalTrades: number
  warnings: string[]
  errors: string[]
}

export interface EmergencyStopReason {
  type: 'daily_loss' | 'consecutive_losses' | 'drawdown' | 'manual' | 'connection_lost' | 'account_error'
  message: string
  timestamp: Date
}

export class LiveTradingManager {
  private bot: TradingBot
  private config: LiveTradingConfig
  private state: LiveTradingState
  private emergencyStopReasons: EmergencyStopReason[] = []
  private tradeConfirmationQueue: Array<{
    tradeId: string
    trade: Partial<Trade>
    resolve: (confirmed: boolean) => void
  }> = []

  // Event callbacks
  private onStateChange?: (state: LiveTradingState) => void
  private onEmergencyStop?: (reason: EmergencyStopReason) => void
  private onTradeConfirmationRequired?: (trade: Partial<Trade>) => Promise<boolean>
  private onRiskAlert?: (message: string, severity: 'low' | 'medium' | 'high') => void

  constructor(bot: TradingBot, config?: LiveTradingConfig) {
    this.bot = bot
    this.config = config || getConfig()
    this.state = this.initializeState()
    this.setupEventListeners()
  }

  private initializeState(): LiveTradingState {
    return {
      isLive: this.config.oanda.environment === 'live',
      isConnected: false,
      accountVerified: false,
      emergencyStopActive: false,
      consecutiveLosses: 0,
      dailyPnL: 0,
      lastTradeTime: null,
      sessionStartTime: new Date(),
      totalTrades: 0,
      warnings: [],
      errors: []
    }
  }

  private setupEventListeners() {
    // Listen to bot events
    this.bot.setEventCallbacks({
      onTradeExecuted: (trade) => this.handleTradeExecuted(trade),
      onPositionUpdate: (positions) => this.handlePositionUpdate(positions),
      onPerformanceUpdate: (performance) => this.handlePerformanceUpdate(performance),
      onError: (error) => this.handleError(error)
    })
  }

  // Initialize live trading with safety checks
  async initializeLiveTrading(): Promise<{ success: boolean; message: string }> {
    try {
      // Debug: Log the config being validated
      console.log('Validating config:', {
        hasApiKey: !!this.config.oanda.apiKey,
        hasAccountId: !!this.config.oanda.accountId,
        environment: this.config.oanda.environment
      })
      
      // Validate configuration
      const validation = validateLiveConfig(this.config)
      if (!validation.valid) {
        console.error('Config validation failed:', validation.errors)
        return {
          success: false,
          message: `Configuration validation failed: ${validation.errors.join(', ')}`
        }
      }

      // Display live trading warnings
      if (this.state.isLive) {
        await this.displayLiveTradingWarnings()
      }

      // Initialize bot
      this.bot.initialize({
        apiKey: this.config.oanda.apiKey,
        accountId: this.config.oanda.accountId,
        environment: this.config.oanda.environment,
        baseUrl: this.config.oanda.environment === 'live' 
          ? 'https://api-fxtrade.oanda.com'
          : 'https://api-fxpractice.oanda.com'
      })

      // Verify account
      const accountVerified = await this.verifyAccount()
      if (!accountVerified) {
        return {
          success: false,
          message: 'Account verification failed'
        }
      }

      this.state.accountVerified = true
      this.state.isConnected = true
      this.updateState()

      return {
        success: true,
        message: this.state.isLive ? 'Live trading initialized successfully' : 'Demo trading initialized successfully'
      }
    } catch (error) {
      this.handleError(`Initialization failed: ${error}`)
      return {
        success: false,
        message: `Initialization failed: ${error}`
      }
    }
  }

  // Display live trading warnings and get user confirmation
  private async displayLiveTradingWarnings(): Promise<void> {
    if (!this.state.isLive) return

    const warnings = [
      '🚨 LIVE TRADING WARNING 🚨',
      '',
      '⚠️  You are about to start live trading with real money!',
      '⚠️  This bot will automatically execute trades on your behalf.',
      '⚠️  You could lose all or part of your investment.',
      '⚠️  Past performance does not guarantee future results.',
      '',
      '🔒 Safety Features Enabled:',
      `• Maximum daily loss: ${this.config.risk.maxDailyLossPercent}%`,
      `• Maximum position size: ${this.config.risk.maxPositionSize} lots`,
      `• Maximum concurrent trades: ${this.config.risk.maxConcurrentTrades}`,
      `• AI confidence threshold: ${this.config.ai.confidenceThreshold * 100}%`,
      `• Emergency stop enabled: ${this.config.safety.enableEmergencyStop}`,
      '',
      '💡 Recommendations:',
      '• Start with a small account balance',
      '• Monitor the bot closely for the first few hours',
      '• Keep the emergency stop button accessible',
      '• Review your risk settings carefully',
      '',
      'Do you understand these risks and wish to proceed?'
    ]

    console.warn(warnings.join('\n'))
    this.state.warnings.push(...warnings)
  }

  // Verify OANDA account
  private async verifyAccount(): Promise<boolean> {
    try {
      const balance = await this.bot.getAccountBalance()
      if (balance <= 0) {
        this.handleError('Account balance is zero or negative')
        return false
      }

      if (this.state.isLive && balance < 1000) {
        this.onRiskAlert?.('Account balance is low for live trading', 'medium')
      }

      return true
    } catch (error) {
      this.handleError(`Account verification failed: ${error}`)
      return false
    }
  }

  // Start live trading with additional safety checks
  async startLiveTrading(): Promise<{ success: boolean; message: string }> {
    if (this.state.emergencyStopActive) {
      return {
        success: false,
        message: 'Emergency stop is active. Please resolve issues before starting.'
      }
    }

    if (!this.state.accountVerified) {
      return {
        success: false,
        message: 'Account not verified. Please initialize first.'
      }
    }

    // Check trading hours
    if (!this.isWithinTradingHours()) {
      return {
        success: false,
        message: 'Outside of configured trading hours'
      }
    }

    // Final confirmation for live trading
    if (this.state.isLive && this.config.safety.requireManualConfirmation) {
      const confirmed = await this.requestFinalConfirmation()
      if (!confirmed) {
        return {
          success: false,
          message: 'Live trading cancelled by user'
        }
      }
    }

    try {
      await this.bot.start()
      this.state.sessionStartTime = new Date()
      this.updateState()

      return {
        success: true,
        message: this.state.isLive ? 'Live trading started successfully' : 'Demo trading started successfully'
      }
    } catch (error) {
      this.handleError(`Failed to start trading: ${error}`)
      return {
        success: false,
        message: `Failed to start trading: ${error}`
      }
    }
  }

  // Request final confirmation for live trading
  private async requestFinalConfirmation(): Promise<boolean> {
    const confirmationMessage = `
🚨 FINAL CONFIRMATION REQUIRED 🚨

You are about to start LIVE TRADING with real money.

Current Settings:
• Account: ${this.config.oanda.accountId}
• Max Daily Loss: ${this.config.risk.maxDailyLossPercent}%
• Max Position Size: ${this.config.risk.maxPositionSize} lots
• AI Confidence: ${this.config.ai.confidenceThreshold * 100}%

Are you absolutely sure you want to proceed?`

    console.warn(confirmationMessage)
    
    if (this.onTradeConfirmationRequired) {
      return await this.onTradeConfirmationRequired({
        pair: 'EUR/USD',
        type: 'buy',
        size: 0,
        openPrice: 0,
        confidence: 1.0,
        strategy: 'LIVE_TRADING_CONFIRMATION'
      })
    }

    return false
  }

  // Handle trade execution with live trading safety
  private async handleTradeExecuted(trade: Trade): Promise<void> {
    this.state.totalTrades++
    this.state.lastTradeTime = new Date()

    // Check for consecutive losses
    if (trade.pnl && trade.pnl < 0) {
      this.state.consecutiveLosses++
      
      if (this.state.consecutiveLosses >= this.config.safety.maxConsecutiveLosses) {
        await this.triggerEmergencyStop({
          type: 'consecutive_losses',
          message: `${this.state.consecutiveLosses} consecutive losses detected`,
          timestamp: new Date()
        })
      }
    } else if (trade.pnl && trade.pnl > 0) {
      this.state.consecutiveLosses = 0
    }

    this.updateState()
  }

  // Handle position updates
  private async handlePositionUpdate(positions: Position[]): Promise<void> {
    // Calculate current daily P&L
    const dailyPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0)
    this.state.dailyPnL = dailyPnL

    // Check daily loss limit
    const accountBalance = await this.bot.getAccountBalance()
    const dailyLossPercent = Math.abs(dailyPnL) / accountBalance * 100

    if (dailyLossPercent >= this.config.risk.maxDailyLossPercent) {
      await this.triggerEmergencyStop({
        type: 'daily_loss',
        message: `Daily loss limit reached: ${dailyLossPercent.toFixed(2)}%`,
        timestamp: new Date()
      })
    }

    this.updateState()
  }

  // Handle performance updates
  private async handlePerformanceUpdate(performance: Performance): Promise<void> {
    // Check maximum drawdown
    if (performance.maxDrawdown >= this.config.risk.maxDrawdownPercent) {
      await this.triggerEmergencyStop({
        type: 'drawdown',
        message: `Maximum drawdown exceeded: ${performance.maxDrawdown.toFixed(2)}%`,
        timestamp: new Date()
      })
    }
  }

  // Handle errors
  private handleError(error: string): void {
    this.state.errors.push(`${new Date().toISOString()}: ${error}`)
    
    if (this.state.isLive) {
      this.onRiskAlert?.(error, 'high')
    }
    
    this.updateState()
  }

  // Trigger emergency stop
  async triggerEmergencyStop(reason: EmergencyStopReason): Promise<void> {
    this.state.emergencyStopActive = true
    this.emergencyStopReasons.push(reason)

    console.error(`🚨 EMERGENCY STOP TRIGGERED: ${reason.message}`)
    
    try {
      await this.bot.stop()
      await this.bot.closeAllPositions()
      
      this.onEmergencyStop?.(reason)
    } catch (error) {
      console.error(`Failed to execute emergency stop: ${error}`)
    }

    this.updateState()
  }

  // Manual emergency stop
  async manualEmergencyStop(): Promise<void> {
    await this.triggerEmergencyStop({
      type: 'manual',
      message: 'Manual emergency stop activated',
      timestamp: new Date()
    })
  }

  // Clear emergency stop
  async clearEmergencyStop(): Promise<boolean> {
    if (this.emergencyStopReasons.length > 0) {
      const lastReason = this.emergencyStopReasons[this.emergencyStopReasons.length - 1]
      
      // Don't allow clearing certain types of emergency stops
      if (lastReason.type === 'daily_loss' || lastReason.type === 'drawdown') {
        return false
      }
    }

    this.state.emergencyStopActive = false
    this.emergencyStopReasons = []
    this.updateState()
    return true
  }

  // Check if within trading hours
  private isWithinTradingHours(): boolean {
    if (!this.config.tradingHours.enabled) return true

    const now = new Date()
    const startTime = new Date(now.toDateString() + ' ' + this.config.tradingHours.start)
    const endTime = new Date(now.toDateString() + ' ' + this.config.tradingHours.end)

    return now >= startTime && now <= endTime
  }

  // Update state and notify listeners
  private updateState(): void {
    this.onStateChange?.(this.state)
  }

  // Getters
  getState(): LiveTradingState {
    return { ...this.state }
  }

  getConfig(): LiveTradingConfig {
    return { ...this.config }
  }

  getEmergencyStopReasons(): EmergencyStopReason[] {
    return [...this.emergencyStopReasons]
  }

  isLiveTrading(): boolean {
    return this.state.isLive
  }

  isEmergencyStopActive(): boolean {
    return this.state.emergencyStopActive
  }

  // Set event callbacks
  setEventCallbacks(callbacks: {
    onStateChange?: (state: LiveTradingState) => void
    onEmergencyStop?: (reason: EmergencyStopReason) => void
    onTradeConfirmationRequired?: (trade: Partial<Trade>) => Promise<boolean>
    onRiskAlert?: (message: string, severity: 'low' | 'medium' | 'high') => void
  }): void {
    this.onStateChange = callbacks.onStateChange
    this.onEmergencyStop = callbacks.onEmergencyStop
    this.onTradeConfirmationRequired = callbacks.onTradeConfirmationRequired
    this.onRiskAlert = callbacks.onRiskAlert
  }

  // Stop trading
  async stop(): Promise<void> {
    await this.bot.stop()
    this.state.isConnected = false
    this.updateState()
  }

  // Get account balance
  async getAccountBalance(): Promise<number> {
    return await this.bot.getAccountBalance()
  }

  // Get positions
  async getPositions(): Promise<Position[]> {
    return await this.bot.getPositions()
  }

  // Get performance
  getPerformance(): Performance {
    return this.bot.getPerformance()
  }
} 