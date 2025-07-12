import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { Shield, AlertTriangle, TrendingDown, DollarSign, Target, Settings } from 'lucide-react'

const RiskPanel: React.FC = () => {
  const { config, performance, positions, updateConfig } = useBotStore()
  const [maxRisk, setMaxRisk] = useState(config.strategy.risk.maxRisk)
  const [positionSize, setPositionSize] = useState(config.strategy.risk.positionSize)
  const [stopLoss, setStopLoss] = useState(config.strategy.risk.stopLoss)
  const [takeProfit, setTakeProfit] = useState(config.strategy.risk.takeProfit)
  const [dailyRiskLimit, setDailyRiskLimit] = useState(config.dailyRiskLimit)
  const [maxPositions, setMaxPositions] = useState(config.maxConcurrentTrades)

  const handleSaveSettings = () => {
    updateConfig({
      strategy: {
        ...config.strategy,
        risk: {
          ...config.strategy.risk,
          maxRisk,
          positionSize,
          stopLoss,
          takeProfit
        }
      },
      dailyRiskLimit,
      maxConcurrentTrades: maxPositions
    })
  }

  const currentExposure = positions.reduce((sum, pos) => sum + pos.size, 0)
  const currentRisk = (currentExposure / config.accountBalance) * 100

  const riskMetrics = [
    {
      title: 'Current Risk',
      value: `${currentRisk.toFixed(1)}%`,
      limit: `${maxRisk}%`,
      icon: TrendingDown,
      color: currentRisk > maxRisk ? 'text-red-600' : 'text-green-600',
      bgColor: currentRisk > maxRisk ? 'bg-red-100' : 'bg-green-100'
    },
    {
      title: 'Daily P&L',
      value: `$${performance.totalPnL.toFixed(2)}`,
      limit: `$${(config.accountBalance * dailyRiskLimit / 100).toFixed(2)}`,
      icon: DollarSign,
      color: performance.totalPnL < 0 ? 'text-red-600' : 'text-green-600',
      bgColor: performance.totalPnL < 0 ? 'bg-red-100' : 'bg-green-100'
    },
    {
      title: 'Open Positions',
      value: positions.length.toString(),
      limit: maxPositions.toString(),
      icon: Target,
      color: positions.length >= maxPositions ? 'text-red-600' : 'text-green-600',
      bgColor: positions.length >= maxPositions ? 'bg-red-100' : 'bg-green-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Risk Settings */}
      <div className="trading-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="mr-2" size={20} />
          Risk Management Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Risk per Trade (%)
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={maxRisk}
              onChange={(e) => setMaxRisk(parseFloat(e.target.value))}
              min="0.1"
              max="10"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum percentage of account balance to risk per trade
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Position Size (lots)
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={positionSize}
              onChange={(e) => setPositionSize(parseFloat(e.target.value))}
              min="0.01"
              max="10"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default lot size for new positions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stop Loss (pips)
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseInt(e.target.value))}
              min="5"
              max="200"
              step="5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default stop loss distance in pips
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Take Profit (pips)
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseInt(e.target.value))}
              min="5"
              max="500"
              step="5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default take profit distance in pips
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Risk Limit (%)
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={dailyRiskLimit}
              onChange={(e) => setDailyRiskLimit(parseFloat(e.target.value))}
              min="1"
              max="20"
              step="0.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum daily loss as percentage of account balance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Concurrent Positions
            </label>
            <input
              type="number"
              className="trading-input w-full"
              value={maxPositions}
              onChange={(e) => setMaxPositions(parseInt(e.target.value))}
              min="1"
              max="10"
              step="1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of simultaneous open positions
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            className="trading-button trading-button-primary w-full"
          >
            Save Risk Settings
          </button>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="space-y-6">
        {/* Current Risk Metrics */}
        <div className="trading-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Shield className="mr-2" size={20} />
            Current Risk Status
          </h2>
          
          <div className="space-y-4">
            {riskMetrics.map((metric, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <metric.icon size={16} className={metric.color} />
                    <span className="text-sm font-medium">{metric.title}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${metric.bgColor} ${metric.color}`}>
                    {metric.value} / {metric.limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${metric.color.replace('text-', 'bg-')}`}
                    style={{ 
                      width: `${Math.min(
                        (parseFloat(metric.value) / parseFloat(metric.limit)) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="trading-card">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="mr-2" size={20} />
            Risk Alerts
          </h2>
          
          <div className="space-y-3">
            {currentRisk > maxRisk && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    Current risk exceeds limit
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Consider reducing position sizes or closing some positions
                </p>
              </div>
            )}
            
            {positions.length >= maxPositions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Maximum positions reached
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  No new positions can be opened until existing ones are closed
                </p>
              </div>
            )}
            
            {Math.abs(performance.totalPnL) > (config.accountBalance * dailyRiskLimit / 100) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-800">
                    Daily risk limit exceeded
                  </span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Consider stopping trading for today
                </p>
              </div>
            )}
            
            {currentRisk <= maxRisk && positions.length < maxPositions && Math.abs(performance.totalPnL) <= (config.accountBalance * dailyRiskLimit / 100) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Shield size={16} className="text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-800">
                    All risk parameters are within limits
                  </span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Safe to continue trading
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Risk-Reward Analysis */}
        <div className="trading-card">
          <h2 className="text-lg font-semibold mb-4">Risk-Reward Analysis</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Risk-Reward Ratio</span>
              <span className="font-semibold">
                1:{(takeProfit / stopLoss).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Break-even Win Rate</span>
              <span className="font-semibold">
                {(stopLoss / (stopLoss + takeProfit) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Win Rate</span>
              <span className={`font-semibold ${
                performance.winRate >= (stopLoss / (stopLoss + takeProfit) * 100) 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {performance.winRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expected Return</span>
              <span className={`font-semibold ${
                performance.winRate >= (stopLoss / (stopLoss + takeProfit) * 100) 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {(
                  (performance.winRate / 100) * takeProfit - 
                  ((100 - performance.winRate) / 100) * stopLoss
                ).toFixed(1)} pips
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskPanel 