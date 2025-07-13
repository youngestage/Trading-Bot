import { create } from 'zustand'
import { BotConfig, Trade, Position, Performance, MarketData, TechnicalIndicators, AISignal } from '../types/trading'
import RealTradingService, { AccountInfo, TradeResult, PositionCloseResult } from '../lib/realTradingService'
import { TradingBot } from '../lib/tradingBot'

interface BotState {
  // Bot Configuration
  config: BotConfig
  isConnected: boolean
  
  // Automatic Trading Bot
  tradingBot: TradingBot | null
  isBotRunning: boolean
  
  // Real Account Data
  accountInfo: AccountInfo | null
  realBalance: number
  isLoadingAccount: boolean
  
  // Trading Data
  currentPrice: number
  trades: Trade[]
  positions: Position[]
  performance: Performance
  
  // Trading Service
  tradingService: RealTradingService | null
  
  // Market Data
  marketData: MarketData[]
  indicators: TechnicalIndicators | null
  aiSignal: AISignal | null
  
  // AI/ML State
  isTraining: boolean
  trainingProgress: number
  modelAccuracy: number
  
  // Actions
  initializeBot: () => void
  initializeTradingService: (apiKey: string, accountId: string, environment: 'demo' | 'live') => Promise<void>
  startAutomaticTrading: () => Promise<void>
  stopAutomaticTrading: () => void
  updateConfig: (config: Partial<BotConfig>) => void
  updatePrice: (price: number) => void
  addTrade: (trade: Trade) => void
  updatePosition: (position: Position) => void
  updatePositions: (positions: Position[]) => void
  updateAccountInfo: (accountInfo: AccountInfo) => void
  updatePerformance: (performance: Performance) => void
  updateMarketData: (data: MarketData[]) => void
  updateIndicators: (indicators: TechnicalIndicators) => void
  updateAISignal: (signal: AISignal) => void
  setTraining: (isTraining: boolean, progress?: number) => void
  setModelAccuracy: (accuracy: number) => void
  toggleBot: () => void
  setConnection: (connected: boolean) => void
  
  // Real Trading Actions
  executeTrade: (type: 'buy' | 'sell', lotSize: number, stopLossPips?: number, takeProfitPips?: number) => Promise<TradeResult>
  closePosition: (positionId: string) => Promise<PositionCloseResult>
  closeAllPositions: () => Promise<PositionCloseResult[]>
  refreshAccountData: () => Promise<void>
}

export const useBotStore = create<BotState>((set, get) => ({
  // Initial State
  config: {
    isActive: false,
    strategy: {
      pair: 'EUR/USD',
      timeframe: '5min',
      indicators: {
        rsi: { period: 14, oversold: 30, overbought: 70 },
        sma: { short: 20, long: 50 },
        macd: { fast: 12, slow: 26, signal: 9 },
        bb: { period: 20, deviation: 2 }
      },
      risk: {
        stopLoss: 50,
        takeProfit: 100,
        positionSize: 0.5,
        maxRisk: 2
      },
      ai: {
        neuralNetwork: true,
        learningRate: 0.008,
        epochs: 150,
        confidence: 0.7
      }
    },
    maxConcurrentTrades: 3,
    dailyRiskLimit: 5,
    accountBalance: 10000,
    demoMode: true
  },
  
  isConnected: false,
  
  // Automatic Trading Bot
  tradingBot: null,
  isBotRunning: false,
  
  // Real Account Data
  accountInfo: null,
  realBalance: 0,
  isLoadingAccount: false,
  
  // Trading Data
  currentPrice: 0, // Will be set by real OANDA data
  trades: [],
  positions: [],
  performance: {
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
  },
  
  // Trading Service
  tradingService: null,
  
  marketData: [],
  indicators: null,
  aiSignal: null,
  
  isTraining: false,
  trainingProgress: 0,
  modelAccuracy: 0,
  
  // Actions
  initializeBot: () => {
    console.log('Bot store initialized - waiting for OANDA connection for live data')
  },

  // Initialize real trading service
  initializeTradingService: async (apiKey: string, accountId: string, environment: 'demo' | 'live') => {
    try {
      const service = new RealTradingService()
      
      // Initialize with credentials
      service.initialize({
        apiKey,
        accountId,
        environment,
        baseUrl: environment === 'live' 
          ? 'https://api-fxtrade.oanda.com'
          : 'https://api-fxpractice.oanda.com'
      })

      // Set up event callbacks
      service.setEventCallbacks({
        onAccountUpdate: (accountInfo) => {
          set({ 
            accountInfo, 
            realBalance: accountInfo.balance,
            config: { 
              ...get().config, 
              accountBalance: accountInfo.balance 
            }
          })
        },
        onTradeExecuted: (trade) => {
          get().addTrade(trade)
        },
        onPositionUpdate: (positions) => {
          set({ positions })
        },
        onError: (error) => {
          console.error('Trading service error:', error)
        }
      })

      set({ tradingService: service, isLoadingAccount: true })

      // Test connection and load initial data
      const result = await service.testConnection()
      if (result.success) {
        // Start real-time updates
        service.startRealTimeUpdates(5000)
        console.log('✅ Real trading service initialized successfully')
      } else {
        console.error('❌ Failed to initialize trading service:', result.error)
        throw new Error(result.error)
      }

      set({ isLoadingAccount: false })
    } catch (error: any) {
      set({ isLoadingAccount: false, tradingService: null })
      throw error
    }
  },

  // Start automatic trading
  startAutomaticTrading: async () => {
    const { config, tradingService } = get()
    
    if (!tradingService) {
      throw new Error('Trading service not initialized. Connect to OANDA first.')
    }

    try {
      console.log('🤖 Starting automatic trading bot...')
      
      // Create and configure trading bot
      const bot = new TradingBot(config)
      
      // Set up bot event callbacks
      bot.setEventCallbacks({
        onPriceUpdate: (price) => {
          set({ currentPrice: price })
        },
        onTradeExecuted: (trade) => {
          get().addTrade(trade)
        },
        onPositionUpdate: (positions) => {
          set({ positions })
        },
        onPerformanceUpdate: (performance) => {
          set({ performance })
        },
        onError: (error) => {
          console.error('🚨 Trading bot error:', error)
        },
        onIndicatorsUpdate: (indicators) => {
          set({ indicators })
        },
        onAISignal: (signal) => {
          set({ aiSignal: signal })
        },
        onTradeConfirmationRequired: async (trade) => {
          // For automatic trading, we can auto-confirm based on confidence
          console.log('🔄 Auto-confirming trade:', trade)
          return true
        }
      })

      // Get the OANDA config from the trading service
      const oandaConfig = (tradingService as any).config
      
      if (!oandaConfig) {
        throw new Error('OANDA configuration not found in trading service')
      }

      // Initialize bot with OANDA credentials
      bot.initialize(oandaConfig)

      // Test connection
      await bot.testConnection()

      // Start the bot
      await bot.start()
      
      set({ 
        tradingBot: bot, 
        isBotRunning: true,
        config: { ...config, isActive: true }
      })
      
      console.log('✅ Automatic trading bot started successfully!')
      
    } catch (error: any) {
      console.error('❌ Failed to start automatic trading:', error)
      throw new Error(`Failed to start automatic trading: ${error.message}`)
    }
  },

  // Stop automatic trading
  stopAutomaticTrading: () => {
    const { tradingBot, config } = get()
    
    if (tradingBot) {
      console.log('🛑 Stopping automatic trading bot...')
      tradingBot.stop()
      
      set({ 
        tradingBot: null, 
        isBotRunning: false,
        config: { ...config, isActive: false }
      })
      
      console.log('✅ Automatic trading bot stopped')
    }
  },

  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig }
    }))
  },
  
  updatePrice: (price) => {
    set({ currentPrice: price })
  },
  
  addTrade: (trade) => {
    set((state) => ({
      trades: [trade, ...state.trades].slice(0, 100) // Keep last 100 trades
    }))
  },
  
  updatePosition: (position) => {
    set((state) => ({
      positions: state.positions.map(p => 
        p.id === position.id ? position : p
      )
    }))
  },

  updatePositions: (positions) => {
    set({ positions })
  },

  updateAccountInfo: (accountInfo) => {
    set({ 
      accountInfo, 
      realBalance: accountInfo.balance,
      config: { 
        ...get().config, 
        accountBalance: accountInfo.balance 
      }
    })
  },
  
  updatePerformance: (performance) => {
    set({ performance })
  },
  
  updateMarketData: (data) => {
    set({ marketData: data })
  },
  
  updateIndicators: (indicators) => {
    set({ indicators })
  },
  
  updateAISignal: (signal) => {
    set({ aiSignal: signal })
  },
  
  setTraining: (isTraining, progress = 0) => {
    set({ isTraining, trainingProgress: progress })
  },
  
  setModelAccuracy: (accuracy) => {
    set({ modelAccuracy: accuracy })
  },
  
  toggleBot: () => {
    set((state) => ({
      config: { ...state.config, isActive: !state.config.isActive }
    }))
  },
  
  setConnection: (connected) => {
    set({ isConnected: connected })
    if (!connected) {
      // Reset price when disconnected
      set({ currentPrice: 0 })
    }
  },

  // Real Trading Actions
  executeTrade: async (type: 'buy' | 'sell', lotSize: number, stopLossPips?: number, takeProfitPips?: number): Promise<TradeResult> => {
    const { tradingService, currentPrice } = get()
    
    if (!tradingService) {
      return {
        success: false,
        error: 'Trading service not initialized'
      }
    }

    try {
      console.log(`🔄 Executing ${type.toUpperCase()} trade:`, {
        lotSize,
        stopLossPips,
        takeProfitPips,
        currentPrice
      })

      const result = await tradingService.executeTrade(
        type,
        lotSize,
        stopLossPips,
        takeProfitPips,
        currentPrice
      )

      if (result.success && result.trade) {
        console.log('✅ Trade executed successfully:', result.trade)
      } else {
        console.error('❌ Trade execution failed:', result.error)
      }

      return result
    } catch (error: any) {
      console.error('❌ Trade execution error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  },

  closePosition: async (positionId: string): Promise<PositionCloseResult> => {
    const { tradingService } = get()
    
    if (!tradingService) {
      return {
        success: false,
        error: 'Trading service not initialized'
      }
    }

    try {
      console.log('🔄 Closing position:', positionId)
      
      const result = await tradingService.closePosition(positionId)
      
      if (result.success) {
        console.log('✅ Position closed successfully. Profit:', result.profit)
      } else {
        console.error('❌ Position close failed:', result.error)
      }

      return result
    } catch (error: any) {
      console.error('❌ Position close error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    }
  },

  closeAllPositions: async (): Promise<PositionCloseResult[]> => {
    const { tradingService } = get()
    
    if (!tradingService) {
      return [{
        success: false,
        error: 'Trading service not initialized'
      }]
    }

    try {
      console.log('🔄 Closing all positions...')
      
      const results = await tradingService.closeAllPositions()
      
      const successCount = results.filter(r => r.success).length
      console.log(`✅ Closed ${successCount}/${results.length} positions`)

      return results
    } catch (error: any) {
      console.error('❌ Close all positions error:', error)
      return [{
        success: false,
        error: error.message || 'Unknown error occurred'
      }]
    }
  },

  refreshAccountData: async (): Promise<void> => {
    const { tradingService } = get()
    
    if (!tradingService) {
      throw new Error('Trading service not initialized')
    }

    try {
      set({ isLoadingAccount: true })
      await tradingService.updateAccountInfo()
      await tradingService.updatePositions()
      console.log('✅ Account data refreshed')
    } catch (error: any) {
      console.error('❌ Failed to refresh account data:', error)
      throw error
    } finally {
      set({ isLoadingAccount: false })
    }
  }
})) 