import { OandaStreamingService } from './oandaStreamingService'
import OandaAPI from './oandaAPI'
import { OandaConfig, Trade, Position } from '../types/trading'

export interface AccountInfo {
  balance: number
  equity: number
  marginUsed: number
  marginAvailable: number
  currency: string
  openTrades: number
  openPositions: number
  unrealizedPL: number
  realizedPL: number
}

export interface TradeResult {
  success: boolean
  trade?: Trade
  error?: string
  tradeId?: string
}

export interface PositionCloseResult {
  success: boolean
  closedPosition?: Position
  profit?: number
  error?: string
}

export class RealTradingService {
  private oandaAPI: OandaAPI | null = null
  private streamingService: OandaStreamingService | null = null
  private config: OandaConfig | null = null

  // Event callbacks
  private onAccountUpdate?: (account: AccountInfo) => void
  private onTradeExecuted?: (trade: Trade) => void
  private onPositionUpdate?: (positions: Position[]) => void
  private onError?: (error: string) => void

  constructor() {
    // Initialize with empty state
  }

  // Initialize with OANDA credentials
  initialize(config: OandaConfig) {
    this.config = config
    this.oandaAPI = new OandaAPI(config)
    this.streamingService = new OandaStreamingService(config)
  }

  // Set event callbacks
  setEventCallbacks(callbacks: {
    onAccountUpdate?: (account: AccountInfo) => void
    onTradeExecuted?: (trade: Trade) => void
    onPositionUpdate?: (positions: Position[]) => void
    onError?: (error: string) => void
  }) {
    this.onAccountUpdate = callbacks.onAccountUpdate
    this.onTradeExecuted = callbacks.onTradeExecuted
    this.onPositionUpdate = callbacks.onPositionUpdate
    this.onError = callbacks.onError
  }

  // Test connection and verify account
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.oandaAPI || !this.streamingService) {
      return { success: false, error: 'Service not initialized' }
    }

    try {
      const connectionTest = await this.streamingService.testConnection()
      if (connectionTest.success) {
        // Fetch initial account data
        await this.updateAccountInfo()
        await this.updatePositions()
      }
      return connectionTest
    } catch (error: any) {
      const errorMessage = error.message || 'Connection test failed'
      this.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Get real account information from OANDA
  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.oandaAPI || !this.config) {
      throw new Error('OANDA API not initialized')
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/accounts/${this.config.accountId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.statusText}`)
      }

      const data = await response.json()
      const account = data.account

      const accountInfo: AccountInfo = {
        balance: parseFloat(account.balance),
        equity: parseFloat(account.NAV),
        marginUsed: parseFloat(account.marginUsed),
        marginAvailable: parseFloat(account.marginAvailable),
        currency: account.currency,
        openTrades: parseInt(account.openTradeCount),
        openPositions: parseInt(account.openPositionCount),
        unrealizedPL: parseFloat(account.unrealizedPL),
        realizedPL: parseFloat(account.pl)
      }

      return accountInfo
    } catch (error: any) {
      const errorMessage = `Failed to get account info: ${error.message}`
      this.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Update account information and notify callbacks
  async updateAccountInfo(): Promise<void> {
    try {
      const accountInfo = await this.getAccountInfo()
      this.onAccountUpdate?.(accountInfo)
    } catch (error: any) {
      this.onError?.(error.message)
    }
  }

  // Get real positions from OANDA
  async getRealPositions(): Promise<Position[]> {
    if (!this.oandaAPI || !this.config) {
      throw new Error('OANDA API not initialized')
    }

    try {
      const response = await fetch(
        `${this.config.baseUrl}/v3/accounts/${this.config.accountId}/positions`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`)
      }

      const data = await response.json()
      const positions: Position[] = []

      // Process long and short positions
      for (const pos of data.positions) {
        if (pos.long.units !== '0') {
          positions.push({
            id: `${pos.instrument}_LONG`,
            pair: pos.instrument.replace('_', '/'),
            type: 'buy',
            size: Math.abs(parseFloat(pos.long.units)) / 10000, // Convert to lots
            openPrice: parseFloat(pos.long.averagePrice),
            currentPrice: 0, // Will be updated with live price
            pnl: parseFloat(pos.long.unrealizedPL),
            pnlPercent: 0, // Will be calculated
            stopLoss: 0, // Will be fetched separately if needed
            takeProfit: 0, // Will be fetched separately if needed
            openTime: new Date().toISOString() // Approximate
          })
        }

        if (pos.short.units !== '0') {
          positions.push({
            id: `${pos.instrument}_SHORT`,
            pair: pos.instrument.replace('_', '/'),
            type: 'sell',
            size: Math.abs(parseFloat(pos.short.units)) / 10000, // Convert to lots
            openPrice: parseFloat(pos.short.averagePrice),
            currentPrice: 0, // Will be updated with live price
            pnl: parseFloat(pos.short.unrealizedPL),
            pnlPercent: 0, // Will be calculated
            stopLoss: 0,
            takeProfit: 0,
            openTime: new Date().toISOString()
          })
        }
      }

      return positions
    } catch (error: any) {
      const errorMessage = `Failed to get positions: ${error.message}`
      this.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Update positions and notify callbacks
  async updatePositions(): Promise<void> {
    try {
      const positions = await this.getRealPositions()
      this.onPositionUpdate?.(positions)
    } catch (error: any) {
      this.onError?.(error.message)
    }
  }

  // Execute a real trade on OANDA
  async executeTrade(
    type: 'buy' | 'sell',
    lotSize: number,
    stopLossPips?: number,
    takeProfitPips?: number,
    currentPrice?: number
  ): Promise<TradeResult> {
    if (!this.oandaAPI || !this.config) {
      return { 
        success: false, 
        error: 'OANDA API not initialized' 
      }
    }

    try {
      // Convert lot size to units (1 lot = 10,000 units for EUR/USD)
      const units = Math.round(lotSize * 10000)
      const orderUnits = type === 'buy' ? units : -units

      // Calculate stop loss and take profit prices
      let stopLossPrice: number | undefined
      let takeProfitPrice: number | undefined

      if (currentPrice && stopLossPips) {
        const stopLossDistance = stopLossPips * 0.0001
        stopLossPrice = type === 'buy' 
          ? currentPrice - stopLossDistance 
          : currentPrice + stopLossDistance
      }

      if (currentPrice && takeProfitPips) {
        const takeProfitDistance = takeProfitPips * 0.0001
        takeProfitPrice = type === 'buy' 
          ? currentPrice + takeProfitDistance 
          : currentPrice - takeProfitDistance
      }

      // Build order request
      const orderRequest: any = {
        order: {
          type: 'MARKET',
          instrument: 'EUR_USD',
          units: orderUnits.toString()
        }
      }

      // Add stop loss if specified
      if (stopLossPrice) {
        orderRequest.order.stopLossOnFill = {
          price: stopLossPrice.toFixed(5)
        }
      }

      // Add take profit if specified
      if (takeProfitPrice) {
        orderRequest.order.takeProfitOnFill = {
          price: takeProfitPrice.toFixed(5)
        }
      }

      console.log('🔄 Executing trade:', {
        type,
        units: orderUnits,
        stopLoss: stopLossPrice?.toFixed(5),
        takeProfit: takeProfitPrice?.toFixed(5)
      })

      // Execute the trade
      const response = await fetch(
        `${this.config.baseUrl}/v3/accounts/${this.config.accountId}/orders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderRequest)
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Trade execution failed: ${errorData.errorMessage || response.statusText}`)
      }

      const data = await response.json()
      const fillTransaction = data.orderFillTransaction

      if (!fillTransaction) {
        throw new Error('Trade was not filled')
      }

      // Create trade object
      const trade: Trade = {
        id: fillTransaction.id,
        pair: 'EUR/USD',
        type,
        size: lotSize,
        openPrice: parseFloat(fillTransaction.price),
        stopLoss: stopLossPrice || 0,
        takeProfit: takeProfitPrice || 0,
        openTime: new Date(fillTransaction.time).toISOString(),
        status: 'open',
        confidence: 1.0, // Manual trades have full confidence
        strategy: 'Manual'
      }

      console.log('✅ Trade executed successfully:', trade)

      // Notify callback
      this.onTradeExecuted?.(trade)

      // Update positions after trade
      setTimeout(() => this.updatePositions(), 1000)
      
      // Update account info after trade
      setTimeout(() => this.updateAccountInfo(), 1000)

      return {
        success: true,
        trade,
        tradeId: fillTransaction.id
      }
    } catch (error: any) {
      const errorMessage = `Trade execution failed: ${error.message}`
      console.error('❌ Trade execution error:', error)
      this.onError?.(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Close a position
  async closePosition(positionId: string): Promise<PositionCloseResult> {
    if (!this.oandaAPI || !this.config) {
      return {
        success: false,
        error: 'OANDA API not initialized'
      }
    }

    try {
      // Extract instrument from position ID (format: EUR_USD_LONG or EUR_USD_SHORT)
      const [instrument, direction] = positionId.split('_').slice(0, 3)
      const instrumentName = `${instrument}_${direction === 'USD' ? 'USD' : 'EUR'}`

      console.log('🔄 Closing position:', positionId)

      // Close the position
      const response = await fetch(
        `${this.config.baseUrl}/v3/accounts/${this.config.accountId}/positions/${instrumentName}/close`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            longUnits: 'ALL',
            shortUnits: 'ALL'
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Position close failed: ${errorData.errorMessage || response.statusText}`)
      }

      const data = await response.json()
      
      // Calculate profit from close transactions
      let totalProfit = 0
      if (data.longOrderFillTransaction) {
        totalProfit += parseFloat(data.longOrderFillTransaction.pl || '0')
      }
      if (data.shortOrderFillTransaction) {
        totalProfit += parseFloat(data.shortOrderFillTransaction.pl || '0')
      }

      console.log('✅ Position closed successfully. Profit:', totalProfit)

      // Update positions after close
      setTimeout(() => this.updatePositions(), 1000)
      
      // Update account info after close
      setTimeout(() => this.updateAccountInfo(), 1000)

      return {
        success: true,
        profit: totalProfit
      }
    } catch (error: any) {
      const errorMessage = `Position close failed: ${error.message}`
      console.error('❌ Position close error:', error)
      this.onError?.(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Close all positions
  async closeAllPositions(): Promise<PositionCloseResult[]> {
    try {
      const positions = await this.getRealPositions()
      const results: PositionCloseResult[] = []

      for (const position of positions) {
        const result = await this.closePosition(position.id)
        results.push(result)
      }

      return results
    } catch (error: any) {
      const errorMessage = `Failed to close all positions: ${error.message}`
      this.onError?.(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Start real-time updates
  startRealTimeUpdates(intervalMs: number = 5000): void {
    // Update account info and positions every 5 seconds
    setInterval(() => {
      this.updateAccountInfo()
      this.updatePositions()
    }, intervalMs)
  }

  // Get trading status
  isInitialized(): boolean {
    return this.oandaAPI !== null && this.config !== null
  }
}

export default RealTradingService 