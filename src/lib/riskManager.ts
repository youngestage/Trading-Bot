import { Trade, Position, BotConfig } from '../types/trading'

export class RiskManager {
  private config: BotConfig
  private dailyPnL: number = 0
  private dailyTrades: number = 0
  private lastResetDate: string = new Date().toDateString()

  constructor(config: BotConfig) {
    this.config = config
  }

  // Update configuration
  updateConfig(config: BotConfig): void {
    this.config = config
  }

  // Reset daily counters
  private resetDailyCounters(): void {
    const today = new Date().toDateString()
    if (this.lastResetDate !== today) {
      this.dailyPnL = 0
      this.dailyTrades = 0
      this.lastResetDate = today
    }
  }

  // Calculate position size based on risk parameters
  calculatePositionSize(
    accountBalance: number,
    stopLossDistance: number,
    riskPercentage: number = 2
  ): number {
    // Risk amount = account balance * risk percentage
    const riskAmount = accountBalance * (riskPercentage / 100)
    
    // Position size = risk amount / stop loss distance
    // Convert pips to price (assuming EUR/USD where 1 pip = 0.0001)
    const stopLossPrice = stopLossDistance * 0.0001
    const positionSize = riskAmount / stopLossPrice
    
    // Convert to lots (100,000 units per lot)
    const lots = positionSize / 100000
    
    // Round to nearest 0.01 lot
    return Math.round(lots * 100) / 100
  }

  // Calculate stop loss and take profit levels
  calculateStopLossTakeProfit(
    entryPrice: number,
    tradeType: 'buy' | 'sell',
    stopLossPips: number,
    takeProfitPips: number
  ): { stopLoss: number; takeProfit: number } {
    const pipValue = 0.0001 // For EUR/USD
    
    let stopLoss: number
    let takeProfit: number
    
    if (tradeType === 'buy') {
      stopLoss = entryPrice - (stopLossPips * pipValue)
      takeProfit = entryPrice + (takeProfitPips * pipValue)
    } else {
      stopLoss = entryPrice + (stopLossPips * pipValue)
      takeProfit = entryPrice - (takeProfitPips * pipValue)
    }
    
    return { stopLoss, takeProfit }
  }

  // Check if new trade is allowed
  canPlaceTrade(
    currentPositions: Position[],
    proposedTrade: Partial<Trade>
  ): { allowed: boolean; reason?: string } {
    this.resetDailyCounters()

    // Check daily risk limit
    if (Math.abs(this.dailyPnL) >= this.config.accountBalance * (this.config.dailyRiskLimit / 100)) {
      return { allowed: false, reason: 'Daily risk limit exceeded' }
    }

    // Check maximum concurrent trades
    if (currentPositions.length >= this.config.maxConcurrentTrades) {
      return { allowed: false, reason: 'Maximum concurrent trades reached' }
    }

    // Check if trading is enabled
    if (!this.config.isActive) {
      return { allowed: false, reason: 'Trading is disabled' }
    }

    // Check position size
    const maxPositionSize = this.config.strategy.risk.positionSize * 2 // Max 2x normal size
    if (proposedTrade.size && proposedTrade.size > maxPositionSize) {
      return { allowed: false, reason: 'Position size too large' }
    }

    // Check spread (assuming reasonable spread for EUR/USD)
    const maxSpread = 3 // 3 pips maximum spread
    // This would need to be checked against actual market data

    return { allowed: true }
  }

  // Validate trade parameters
  validateTrade(trade: Partial<Trade>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!trade.pair || trade.pair !== 'EUR/USD') {
      errors.push('Invalid or missing currency pair')
    }

    if (!trade.type || !['buy', 'sell'].includes(trade.type)) {
      errors.push('Invalid trade type')
    }

    if (!trade.size || trade.size <= 0) {
      errors.push('Invalid position size')
    }

    if (!trade.openPrice || trade.openPrice <= 0) {
      errors.push('Invalid entry price')
    }

    // Check stop loss and take profit
    if (trade.stopLoss && trade.takeProfit && trade.openPrice) {
      if (trade.type === 'buy') {
        if (trade.stopLoss >= trade.openPrice) {
          errors.push('Stop loss must be below entry price for buy orders')
        }
        if (trade.takeProfit <= trade.openPrice) {
          errors.push('Take profit must be above entry price for buy orders')
        }
      } else if (trade.type === 'sell') {
        if (trade.stopLoss <= trade.openPrice) {
          errors.push('Stop loss must be above entry price for sell orders')
        }
        if (trade.takeProfit >= trade.openPrice) {
          errors.push('Take profit must be below entry price for sell orders')
        }
      }
    }

    // Check risk-reward ratio
    if (trade.stopLoss && trade.takeProfit && trade.openPrice) {
      const stopLossDistance = Math.abs(trade.openPrice - trade.stopLoss)
      const takeProfitDistance = Math.abs(trade.takeProfit - trade.openPrice)
      const riskRewardRatio = takeProfitDistance / stopLossDistance
      
      if (riskRewardRatio < 1.5) {
        errors.push('Risk-reward ratio too low (minimum 1.5:1)')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // Update daily PnL
  updateDailyPnL(pnl: number): void {
    this.resetDailyCounters()
    this.dailyPnL += pnl
  }

  // Check if should close all positions due to risk
  shouldCloseAllPositions(
    currentPositions: Position[],
    accountBalance: number
  ): { shouldClose: boolean; reason?: string } {
    this.resetDailyCounters()

    // Check daily loss limit
    if (this.dailyPnL <= -accountBalance * (this.config.dailyRiskLimit / 100)) {
      return { shouldClose: true, reason: 'Daily loss limit exceeded' }
    }

    // Check maximum drawdown
    const totalPnL = currentPositions.reduce((sum, pos) => sum + pos.pnl, 0)
    const drawdownPercent = (totalPnL / accountBalance) * 100
    
    if (drawdownPercent <= -10) { // 10% drawdown
      return { shouldClose: true, reason: 'Maximum drawdown exceeded' }
    }

    return { shouldClose: false }
  }

  // Calculate optimal position size based on Kelly Criterion
  calculateKellyPositionSize(
    accountBalance: number,
    winRate: number,
    avgWin: number,
    avgLoss: number
  ): number {
    if (winRate <= 0 || avgWin <= 0 || avgLoss <= 0) {
      return this.config.strategy.risk.positionSize
    }

    const lossRate = 1 - winRate
    const kellyPercentage = (winRate * avgWin - lossRate * avgLoss) / avgWin
    
    // Cap Kelly percentage at 25% for safety
    const safeKellyPercentage = Math.min(kellyPercentage, 0.25)
    
    if (safeKellyPercentage <= 0) {
      return this.config.strategy.risk.positionSize * 0.5 // Reduce size if Kelly is negative
    }

    // Convert to lot size
    const riskAmount = accountBalance * safeKellyPercentage
    const stopLossDistance = this.config.strategy.risk.stopLoss * 0.0001
    const positionSize = riskAmount / stopLossDistance / 100000
    
    return Math.round(positionSize * 100) / 100
  }

  // Get current risk metrics
  getRiskMetrics(): {
    dailyPnL: number
    dailyTrades: number
    riskUtilization: number
    maxConcurrentTrades: number
    currentRiskExposure: number
  } {
    this.resetDailyCounters()
    
    return {
      dailyPnL: this.dailyPnL,
      dailyTrades: this.dailyTrades,
      riskUtilization: Math.abs(this.dailyPnL) / (this.config.accountBalance * (this.config.dailyRiskLimit / 100)),
      maxConcurrentTrades: this.config.maxConcurrentTrades,
      currentRiskExposure: this.config.strategy.risk.maxRisk
    }
  }

  // Emergency stop all trading
  emergencyStop(): void {
    this.config.isActive = false
    console.log('Emergency stop activated - all trading halted')
  }
}

export default RiskManager 