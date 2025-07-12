import { create } from 'zustand'
import { BotConfig, Trade, Position, Performance, MarketData, TechnicalIndicators, AISignal } from '../types/trading'

interface BotState {
  // Bot Configuration
  config: BotConfig
  isConnected: boolean
  
  // Trading Data
  currentPrice: number
  trades: Trade[]
  positions: Position[]
  performance: Performance
  
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
  updateConfig: (config: Partial<BotConfig>) => void
  updatePrice: (price: number) => void
  addTrade: (trade: Trade) => void
  updatePosition: (position: Position) => void
  updatePerformance: (performance: Performance) => void
  updateMarketData: (data: MarketData[]) => void
  updateIndicators: (indicators: TechnicalIndicators) => void
  updateAISignal: (signal: AISignal) => void
  setTraining: (isTraining: boolean, progress?: number) => void
  setModelAccuracy: (accuracy: number) => void
  toggleBot: () => void
  setConnection: (connected: boolean) => void
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
  currentPrice: 1.0850,
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
  
  marketData: [],
  indicators: null,
  aiSignal: null,
  
  isTraining: false,
  trainingProgress: 0,
  modelAccuracy: 0,
  
  // Actions
  initializeBot: () => {
    // Initialize bot with default settings
    set((state) => ({
      ...state,
      currentPrice: 1.0850 + (Math.random() - 0.5) * 0.01,
    }))
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
      config: {
        ...state.config,
        isActive: !state.config.isActive
      }
    }))
  },
  
  setConnection: (connected) => {
    set({ isConnected: connected })
  }
})) 