import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { Play, Square, Bot, TrendingUp, TrendingDown, Minus, AlertCircle, Activity, Zap, Target, Shield, Brain } from 'lucide-react'

const AutoTradingControls: React.FC = () => {
  const { 
    isBotRunning, 
    config, 
    isConnected, 
    currentPrice,
    indicators,
    aiSignal,
    performance,
    positions,
    startAutomaticTrading,
    stopAutomaticTrading,
    tradingService
  } = useBotStore()

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartBot = async () => {
    if (!tradingService) {
      setError('Please connect to OANDA first')
      return
    }

    setIsStarting(true)
    setError(null)

    try {
      await startAutomaticTrading()
    } catch (error: any) {
      setError(error.message || 'Failed to start automatic trading')
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopBot = () => {
    stopAutomaticTrading()
    setError(null)
  }

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy': return 'text-green-600'
      case 'sell': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  const canStartBot = isConnected && tradingService && !isBotRunning && !isStarting

  return (
    <div className="space-y-6">
      {/* Main Control Panel */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Trading Bot</h2>
              <p className="text-sm text-gray-600">Automated EUR/USD Trading System</p>
            </div>
            <div className={`status-badge ${isBotRunning ? 'status-running' : 'status-stopped'}`}>
              <Activity className="w-4 h-4 mr-1" />
              <span className="font-medium">{isBotRunning ? 'RUNNING' : 'STOPPED'}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {!isBotRunning ? (
              <button
                onClick={handleStartBot}
                disabled={!canStartBot}
                className={`btn ${canStartBot ? 'btn-success' : 'btn-disabled'}`}
              >
                <Play className="w-4 h-4 mr-2" />
                <span>{isStarting ? 'Starting...' : 'Start Bot'}</span>
              </button>
            ) : (
              <button
                onClick={handleStopBot}
                className="btn btn-danger"
              >
                <Square className="w-4 h-4 mr-2" />
                <span>Stop Bot</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Trading Bot Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="alert alert-warning mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Connection Required</h3>
              <p className="text-sm mt-1">Connect to OANDA to enable automatic trading</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid-metrics mb-6">
          <div className="metric-card">
            <div className="metric-label">EUR/USD Price</div>
            <div className="metric-value-large">
              {currentPrice > 0 ? currentPrice.toFixed(5) : '---'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">AI Signal</div>
            <div className="flex items-center space-x-2">
              {aiSignal ? (
                <>
                  {getSignalIcon(aiSignal.signal)}
                  <span className={`text-lg font-bold ${getSignalColor(aiSignal.signal)}`}>
                    {aiSignal.signal.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({Math.round(aiSignal.confidence * 100)}%)
                  </span>
                </>
              ) : (
                <span className="text-gray-500">Analyzing...</span>
              )}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Win Rate</div>
            <div className="metric-value">
              {performance.totalTrades > 0 ? `${Math.round(performance.winRate)}%` : '0%'}
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Open Positions</div>
            <div className="metric-value">
              {positions.length}
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Parameters */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-100 rounded-lg p-2">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="heading-sm">Trading Parameters</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Position Size</span>
              <span className="text-sm font-semibold text-gray-900">{config.strategy.risk.positionSize} lots</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Stop Loss</span>
              <span className="text-sm font-semibold text-gray-900">{config.strategy.risk.stopLoss} pips</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Take Profit</span>
              <span className="text-sm font-semibold text-gray-900">{config.strategy.risk.takeProfit} pips</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Max Risk</span>
              <span className="text-sm font-semibold text-gray-900">{config.strategy.risk.maxRisk}%</span>
            </div>
          </div>
        </div>

        {/* AI Configuration */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-100 rounded-lg p-2">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="heading-sm">AI Configuration</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Confidence Threshold</span>
              <span className="text-sm font-semibold text-gray-900">{Math.round(config.strategy.ai.confidence * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Neural Network</span>
              <span className={`text-sm font-semibold ${config.strategy.ai.neuralNetwork ? 'text-green-600' : 'text-red-600'}`}>
                {config.strategy.ai.neuralNetwork ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Max Concurrent Trades</span>
              <span className="text-sm font-semibold text-gray-900">{config.maxConcurrentTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Learning Rate</span>
              <span className="text-sm font-semibold text-gray-900">{config.strategy.ai.learningRate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      {indicators && (
        <div className="card">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 rounded-lg p-2">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="heading-sm">Technical Indicators</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">RSI</div>
              <div className={`text-lg font-bold ${
                indicators.rsi > 70 ? 'text-red-600' : 
                indicators.rsi < 30 ? 'text-green-600' : 'text-gray-900'
              }`}>
                {indicators.rsi.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">SMA20</div>
              <div className="text-lg font-bold text-gray-900">{indicators.sma20.toFixed(5)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">SMA50</div>
              <div className="text-lg font-bold text-gray-900">{indicators.sma50.toFixed(5)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-500 mb-1">MACD</div>
              <div className={`text-lg font-bold ${
                indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {indicators.macd.histogram.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-orange-100 rounded-lg p-2">
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="heading-sm">Performance Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 mb-1">Total Trades</div>
            <div className="text-lg font-bold text-gray-900">{performance.totalTrades}</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 mb-1">Total P&L</div>
            <div className={`text-lg font-bold ${
              performance.totalPnL > 0 ? 'text-green-600' : 
              performance.totalPnL < 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              ${performance.totalPnL.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 mb-1">Max Drawdown</div>
            <div className="text-lg font-bold text-red-600">{performance.maxDrawdown.toFixed(2)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-medium text-gray-500 mb-1">Profit Factor</div>
            <div className="text-lg font-bold text-gray-900">{performance.profitFactor.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AutoTradingControls 