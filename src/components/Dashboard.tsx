import React, { useState, useEffect } from 'react'
import { useBotStore } from '../store/botStore'
import { TradingBot } from '../lib/tradingBot'
import { BotConfig } from '../types/trading'
import Chart from './Chart'
import TradeHistory from './TradeHistory'
import PerformanceMetrics from './PerformanceMetrics'
import MarketStatusWidget from './MarketStatusWidget'
import BrokerConnection from './BrokerConnection'
import AutoTradingControls from './AutoTradingControls'
import { MarketHoursService } from '../lib/marketHours'
import { Activity, Settings, Power, AlertTriangle, Wifi, WifiOff, Clock, Link, Bot, TrendingUp, Building2 } from 'lucide-react'

const Dashboard: React.FC = () => {
  const {
    config,
    isConnected,
    currentPrice,
    toggleBot,
    setConnection,
    updatePrice
  } = useBotStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'broker' | 'settings'>('overview')
  const [tradingBot, setTradingBot] = useState<TradingBot | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionTesting, setConnectionTesting] = useState(false)
  const [marketStatus, setMarketStatus] = useState(MarketHoursService.getMarketStatus())

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(MarketHoursService.getMarketStatus())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Initialize TradingBot instance
  useEffect(() => {
    const botConfig: BotConfig = {
      accountBalance: config.accountBalance,
      maxConcurrentTrades: config.maxConcurrentTrades,
      dailyRiskLimit: config.dailyRiskLimit,
      isActive: true,
      demoMode: true,
      strategy: config.strategy
    }

    const bot = new TradingBot(botConfig)
    
    // Set up bot event callbacks for live price updates
    bot.setEventCallbacks({
      onPriceUpdate: (price: number) => {
        updatePrice(price)
      },
      onError: (error: string) => {
        console.error('TradingBot error:', error)
        setConnectionError(error)
        setConnection(false)
      }
    })
    
    setTradingBot(bot)

    return () => {
      if (bot) {
        bot.stop()
      }
    }
  }, [config, updatePrice, setConnection])

  // Test OANDA connection when credentials are available
  useEffect(() => {
    const testOandaConnection = async () => {
      const storedCreds = sessionStorage.getItem('oanda_credentials')
      if (!storedCreds || !tradingBot) {
        setConnection(false)
        setConnectionError('OANDA credentials not found. Please configure in Broker Setup tab.')
        return
      }

      try {
        setConnectionTesting(true)
        setConnectionError(null)
        
        const { apiKey, accountId, environment } = JSON.parse(storedCreds)
        if (!apiKey || !accountId) {
          setConnection(false)
          setConnectionError('Invalid OANDA credentials')
          return
        }

        // Initialize bot with OANDA credentials
        tradingBot.initialize({
          apiKey,
          accountId,
          environment,
          baseUrl: environment === 'live' 
            ? 'https://api-fxtrade.oanda.com'
            : 'https://api-fxpractice.oanda.com'
        })

        // Test connection by attempting to get current price
        await tradingBot.testConnection()
        
        setConnection(true)
        setConnectionError(null)
        console.log('✅ OANDA connection established')
        
      } catch (error: any) {
        setConnection(false)
        setConnectionError(error.message || 'Failed to connect to OANDA')
        console.error('❌ OANDA connection failed:', error)
      } finally {
        setConnectionTesting(false)
      }
    }

    testOandaConnection()
  }, [tradingBot, setConnection])

  const formatPrice = (price: number): string => {
    return price.toFixed(5)
  }

  const formatPnL = (pnl: number): string => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(2)}`
  }

  const getConnectionStatusDisplay = () => {
    if (connectionTesting) {
      return (
        <div className="flex items-center space-x-2">
          <div className="loading-spinner text-orange-600"></div>
          <span className="text-sm font-medium text-orange-600">Testing connection...</span>
        </div>
      )
    }
    
    if (isConnected) {
      return (
        <div className="status-badge status-connected">
          <Wifi className="w-4 h-4 mr-1" />
          <span>Connected</span>
        </div>
      )
    }
    
    return (
      <div className="status-badge status-disconnected">
        <WifiOff className="w-4 h-4 mr-1" />
        <span>Disconnected</span>
      </div>
    )
  }

  const getMarketStatusDisplay = () => {
    if (marketStatus.isOpen) {
      const liquidityWarning = MarketHoursService.getLiquidityWarning()
      if (liquidityWarning.hasWarning) {
        return (
          <div className="status-badge status-warning">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span>Open (Low Liquidity)</span>
          </div>
        )
      }
      return (
        <div className="status-badge status-connected">
          <Clock className="w-4 h-4 mr-1" />
          <span>Market Open</span>
        </div>
      )
    }
    
    return (
      <div className="status-badge status-disconnected">
        <Clock className="w-4 h-4 mr-1" />
        <span>Market Closed</span>
      </div>
    )
  }

  const isTradingEnabled = () => {
    return isConnected && MarketHoursService.isTradingAllowed()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-responsive">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-3 shadow-lg">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EUR/USD Trading Bot</h1>
                <p className="text-sm text-gray-600">AI-Powered Forex Trading System</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              {getConnectionStatusDisplay()}
              {getMarketStatusDisplay()}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive">
          <nav className="flex space-x-6 py-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`nav-tab ${activeTab === 'overview' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('broker')}
              className={`nav-tab ${activeTab === 'broker' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Broker Setup
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`nav-tab ${activeTab === 'settings' ? 'nav-tab-active' : 'nav-tab-inactive'}`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-responsive py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Connection Error Alert */}
            {connectionError && (
              <div className="alert alert-error">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Connection Error</h3>
                  <p className="text-sm mt-1">{connectionError}</p>
                </div>
              </div>
            )}

            {/* Market Status Widget */}
            <div className="animate-slide-up">
              <MarketStatusWidget />
            </div>

            {/* Trading Bot Controls */}
            <div className="animate-slide-up">
              <AutoTradingControls />
            </div>

            {/* Charts and Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="animate-slide-up">
                <Chart />
              </div>
              <div className="animate-slide-up">
                <PerformanceMetrics />
              </div>
            </div>

            {/* Trade History */}
            <div className="animate-slide-up">
              <TradeHistory />
            </div>
          </div>
        )}

        {activeTab === 'broker' && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="heading-lg">Broker Connection</h2>
                <p className="text-muted">Connect your OANDA account to enable live trading</p>
              </div>
              <BrokerConnection />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <h2 className="heading-lg">Trading Settings</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Management */}
                <div className="card">
                  <h3 className="heading-sm">Risk Management</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Max Risk Per Trade</span>
                      <span className="text-sm text-gray-900">{config.strategy.risk.maxRisk}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Position Size</span>
                      <span className="text-sm text-gray-900">{config.strategy.risk.positionSize} lots</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Stop Loss</span>
                      <span className="text-sm text-gray-900">{config.strategy.risk.stopLoss} pips</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Take Profit</span>
                      <span className="text-sm text-gray-900">{config.strategy.risk.takeProfit} pips</span>
                    </div>
                  </div>
                </div>

                {/* AI Configuration */}
                <div className="card">
                  <h3 className="heading-sm">AI Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Neural Network</span>
                      <span className={`text-sm ${config.strategy.ai.neuralNetwork ? 'text-green-600' : 'text-red-600'}`}>
                        {config.strategy.ai.neuralNetwork ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Confidence Threshold</span>
                      <span className="text-sm text-gray-900">{Math.round(config.strategy.ai.confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Learning Rate</span>
                      <span className="text-sm text-gray-900">{config.strategy.ai.learningRate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Training Epochs</span>
                      <span className="text-sm text-gray-900">{config.strategy.ai.epochs}</span>
                    </div>
                  </div>
                </div>

                {/* Trading Limits */}
                <div className="card">
                  <h3 className="heading-sm">Trading Limits</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Max Concurrent Trades</span>
                      <span className="text-sm text-gray-900">{config.maxConcurrentTrades}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Daily Risk Limit</span>
                      <span className="text-sm text-gray-900">{config.dailyRiskLimit}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Demo Mode</span>
                      <span className={`text-sm ${config.demoMode ? 'text-orange-600' : 'text-green-600'}`}>
                        {config.demoMode ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="card">
                  <h3 className="heading-sm">Technical Indicators</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">RSI Period</span>
                      <span className="text-sm text-gray-900">{config.strategy.indicators.rsi.period}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">SMA Short</span>
                      <span className="text-sm text-gray-900">{config.strategy.indicators.sma.short}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">SMA Long</span>
                      <span className="text-sm text-gray-900">{config.strategy.indicators.sma.long}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Bollinger Bands Period</span>
                      <span className="text-sm text-gray-900">{config.strategy.indicators.bb.period}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard 