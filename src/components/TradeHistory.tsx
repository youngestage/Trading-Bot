import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { TrendingUp, TrendingDown, Clock, DollarSign, Filter, AlertTriangle, History } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TradeHistory: React.FC = () => {
  const { trades, isConnected } = useBotStore()
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [sortBy, setSortBy] = useState<'time' | 'pnl' | 'size'>('time')

  const formatPrice = (price: number) => price.toFixed(5)
  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(2)}`
  }

  const filteredTrades = trades
    .filter(trade => {
      if (filter === 'all') return true
      return trade.status === filter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.openTime).getTime() - new Date(a.openTime).getTime()
        case 'pnl':
          return (b.pnl || 0) - (a.pnl || 0)
        case 'size':
          return b.size - a.size
        default:
          return 0
      }
    })

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0).length
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 rounded-lg p-2">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="heading-md">Trade History</h2>
        </div>

        <div className="flex space-x-4">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trades</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="time">Sort by Time</option>
            <option value="pnl">Sort by P&L</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* Connection Status Warning */}
      {!isConnected && (
        <div className="alert alert-warning mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium">Limited Functionality</h3>
            <p className="text-sm mt-1">
              Trade history shows local data only. Live trading requires OANDA connection.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid-metrics mb-6">
        <div className="metric-card">
          <div className="metric-label">Total Trades</div>
          <div className="metric-value">{filteredTrades.length}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Win Rate</div>
          <div className={`metric-value ${winRate > 50 ? 'metric-value-positive' : 'metric-value-negative'}`}>
            {winRate.toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total P&L</div>
          <div className={`metric-value ${totalPnL >= 0 ? 'metric-value-positive' : 'metric-value-negative'}`}>
            {formatPnL(totalPnL)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Data Source</div>
          <div className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-orange-600'}`}>
            {isConnected ? '● Live OANDA' : '● Local Only'}
          </div>
        </div>
      </div>

      {/* Trade List */}
      {filteredTrades.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Trades Found</h3>
          <p className="text-gray-500">
            {!isConnected 
              ? 'Connect to OANDA to start live trading and view trade history.'
              : 'Start trading to see your trade history here.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade, index) => (
            <div key={trade.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`flex items-center space-x-2 ${
                      trade.type === 'buy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.type === 'buy' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-semibold">{trade.type.toUpperCase()}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      {trade.pair} • {trade.size} lots
                    </div>

                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.status === 'open' 
                        ? 'bg-blue-100 text-blue-800' 
                        : trade.status === 'closed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {trade.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Entry Price</div>
                      <div className="font-medium">{formatPrice(trade.openPrice)}</div>
                    </div>

                    <div>
                      <div className="text-gray-600">Stop Loss</div>
                      <div className="font-medium">{trade.stopLoss ? formatPrice(trade.stopLoss) : 'N/A'}</div>
                    </div>

                    <div>
                      <div className="text-gray-600">Take Profit</div>
                      <div className="font-medium">{trade.takeProfit ? formatPrice(trade.takeProfit) : 'N/A'}</div>
                    </div>

                    <div>
                      <div className="text-gray-600">Open Time</div>
                      <div className="font-medium">{formatDistanceToNow(new Date(trade.openTime), { addSuffix: true })}</div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className={`text-lg font-bold ${
                    (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPnL(trade.pnl || 0)}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Strategy: {trade.strategy}
                  </div>

                  {trade.confidence && (
                    <div className="text-sm text-gray-600">
                      Confidence: {(trade.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TradeHistory 