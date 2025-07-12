import React from 'react'
import { useBotStore } from '../store/botStore'
import { TrendingUp, TrendingDown, Target, Shield, DollarSign, Percent } from 'lucide-react'

const PerformanceMetrics: React.FC = () => {
  const { performance } = useBotStore()

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </div>
            <div className={`p-3 rounded-full ${metric.bgColor}`}>
              <metric.icon size={24} className={metric.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PerformanceMetrics 