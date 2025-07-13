import React from 'react'
import { useBotStore } from '../store/botStore'
import { TrendingUp, TrendingDown, Target, Shield, DollarSign, Percent, AlertTriangle } from 'lucide-react'

const PerformanceMetrics: React.FC = () => {
  const { performance, isConnected, accountInfo, realBalance } = useBotStore()

  // Show connection warning if not connected
  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="heading-md">Performance Metrics</h2>
        <div className="text-center py-8">
          <div className="alert alert-warning">
            <AlertTriangle className="w-12 h-12 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium">No Live Data</h3>
              <p className="text-sm mt-1">
                Performance metrics require OANDA connection for live trading data.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      title: 'Total Trades',
      value: performance.totalTrades.toString(),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Win Rate',
      value: `${performance.winRate.toFixed(1)}%`,
      icon: Percent,
      color: performance.winRate > 60 ? 'text-green-600' : 'text-red-600',
      bgColor: performance.winRate > 60 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'Total P&L',
      value: `$${performance.totalPnL.toFixed(2)}`,
      icon: DollarSign,
      color: performance.totalPnL >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: performance.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'Sharpe Ratio',
      value: performance.sharpeRatio.toFixed(2),
      icon: TrendingUp,
      color: performance.sharpeRatio > 1 ? 'text-green-600' : 'text-red-600',
      bgColor: performance.sharpeRatio > 1 ? 'bg-green-100' : 'bg-red-100'
    },
    {
      title: 'Max Drawdown',
      value: `$${performance.maxDrawdown.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Profit Factor',
      value: performance.profitFactor.toFixed(2),
      icon: Shield,
      color: performance.profitFactor > 1.5 ? 'text-green-600' : 'text-red-600',
      bgColor: performance.profitFactor > 1.5 ? 'bg-green-100' : 'bg-red-100'
    }
  ]

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 rounded-lg p-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="heading-md">Performance Metrics</h2>
      </div>

      {/* Account Balance (if connected) */}
      {accountInfo && (
        <div className="alert alert-info mb-6">
          <DollarSign className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Account Balance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Balance:</span>
                <span className="font-bold">
                  {accountInfo.currency} {realBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Equity:</span>
                <span className="font-medium">
                  {accountInfo.currency} {accountInfo.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unrealized P&L:</span>
                <span className={`font-medium ${
                  accountInfo.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {accountInfo.currency} {accountInfo.unrealizedPL >= 0 ? '+' : ''}{accountInfo.unrealizedPL.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="metric-card">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div className="flex-1">
                  <div className="metric-label">{metric.title}</div>
                  <div className={`metric-value ${metric.color}`}>
                    {metric.value}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Live Data Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Data Source</span>
          <span className="text-green-600 font-medium">● Live OANDA Data</span>
        </div>
        <div className="text-xs text-muted mt-1">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default PerformanceMetrics 