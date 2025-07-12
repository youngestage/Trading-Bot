import React, { useState, useEffect } from 'react'
import { useBotStore } from '../store/botStore'
import TradingPanel from './TradingPanel'
import Chart from './Chart'
import TradeHistory from './TradeHistory'
import PerformanceMetrics from './PerformanceMetrics'
import AIPanel from './AIPanel'
import RiskPanel from './RiskPanel'
import { Activity, TrendingUp, Brain, Shield, Settings, Power } from 'lucide-react'

const Dashboard: React.FC = () => {
  const {
    config,
    isConnected,
    currentPrice,
    positions,
    trades,
    performance,
    indicators,
    aiSignal,
    isTraining,
    modelAccuracy,
    toggleBot,
    setConnection
  } = useBotStore()

  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'ai' | 'risk' | 'settings'>('overview')

  useEffect(() => {
    // Simulate connection status
    const timer = setTimeout(() => {
      setConnection(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [setConnection])

  const formatPrice = (price: number): string => {
    return price.toFixed(5)
  }

  const formatPnL = (pnl: number): string => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(2)}`
  }

  const getPriceChangeClass = (change: number): string => {
    if (change > 0) return 'text-trading-green'
    if (change < 0) return 'text-trading-red'
    return 'text-gray-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 EUR/USD Trading Bot
              </h1>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatPrice(currentPrice)}
                </div>
                <div className="text-sm text-gray-600">EUR/USD</div>
              </div>
              
              <button
                onClick={toggleBot}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  config.isActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <Power size={16} />
                <span>{config.isActive ? 'Stop Bot' : 'Start Bot'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'trading', label: 'Trading', icon: TrendingUp },
              { id: 'ai', label: 'AI Learning', icon: Brain },
              { id: 'risk', label: 'Risk Management', icon: Shield },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-trading-blue text-trading-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Chart and Performance */}
            <div className="lg:col-span-2 space-y-6">
              <div className="trading-card">
                <h2 className="text-lg font-semibold mb-4">EUR/USD Live Chart</h2>
                <Chart />
              </div>
              
              <div className="trading-card">
                <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
                <PerformanceMetrics />
              </div>
            </div>

            {/* Right Column - Trading Panel and Positions */}
            <div className="space-y-6">
              <div className="trading-card">
                <h2 className="text-lg font-semibold mb-4">Current Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bot Status</span>
                    <span className={`font-semibold ${config.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Open Positions</span>
                    <span className="font-semibold">{positions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total P&L</span>
                    <span className={`font-semibold ${getPriceChangeClass(performance.totalPnL)}`}>
                      {formatPnL(performance.totalPnL)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Win Rate</span>
                    <span className="font-semibold">{performance.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">AI Accuracy</span>
                    <span className="font-semibold">{(modelAccuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="trading-card">
                <h2 className="text-lg font-semibold mb-4">AI Signal</h2>
                {aiSignal ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Signal</span>
                      <span className={`font-bold text-lg ${
                        aiSignal.signal === 'buy' ? 'text-green-600' : 
                        aiSignal.signal === 'sell' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {aiSignal.signal.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Confidence</span>
                      <span className="font-semibold">{(aiSignal.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          aiSignal.confidence > 0.7 ? 'bg-green-500' : 
                          aiSignal.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${aiSignal.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">No signal available</div>
                )}
              </div>

              <div className="trading-card">
                <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {trades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{trade.size}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatPrice(trade.openPrice)}</div>
                        <div className={`text-xs ${getPriceChangeClass(trade.pnl || 0)}`}>
                          {formatPnL(trade.pnl || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {trades.length === 0 && (
                    <div className="text-center text-gray-500 py-4">No trades yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trading' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TradingPanel />
            <TradeHistory />
          </div>
        )}

        {activeTab === 'ai' && (
          <AIPanel />
        )}

        {activeTab === 'risk' && (
          <RiskPanel />
        )}

        {activeTab === 'settings' && (
          <div className="trading-card">
            <h2 className="text-lg font-semibold mb-4">Bot Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trading Mode
                </label>
                <select className="trading-input w-full">
                  <option value="demo">Demo Mode</option>
                  <option value="live">Live Trading</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Level (%)
                </label>
                <input
                  type="number"
                  className="trading-input w-full"
                  value={config.strategy.risk.maxRisk}
                  min="0.5"
                  max="5"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Size (lots)
                </label>
                <input
                  type="number"
                  className="trading-input w-full"
                  value={config.strategy.risk.positionSize}
                  min="0.01"
                  max="10"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss (pips)
                </label>
                <input
                  type="number"
                  className="trading-input w-full"
                  value={config.strategy.risk.stopLoss}
                  min="10"
                  max="200"
                  step="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit (pips)
                </label>
                <input
                  type="number"
                  className="trading-input w-full"
                  value={config.strategy.risk.takeProfit}
                  min="10"
                  max="500"
                  step="5"
                />
              </div>
              <button className="trading-button trading-button-primary w-full">
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard 