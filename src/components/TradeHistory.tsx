import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { TrendingUp, TrendingDown, Clock, DollarSign, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TradeHistory: React.FC = () => {
  const { trades } = useBotStore()
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
    <div className="trading-card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Clock className="mr-2" size={20} />
          Trade History
        </h2>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All Trades</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-sm text-gray-600">Total Trades</div>
          <div className="text-xl font-bold">{filteredTrades.length}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-xl font-bold">{winRate.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600">Total P&L</div>
          <div className={`text-xl font-bold ${
            totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPnL(totalPnL)}
          </div>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex space-x-2 mb-4">
        <span className="text-sm text-gray-600">Sort by:</span>
        {[
          { value: 'time', label: 'Time' },
          { value: 'pnl', label: 'P&L' },
          { value: 'size', label: 'Size' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value as any)}
            className={`text-sm px-2 py-1 rounded ${
              sortBy === option.value
                ? 'bg-trading-blue text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Trade List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTrades.map((trade) => (
          <div key={trade.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  trade.type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {trade.type === 'buy' ? (
                    <TrendingUp size={16} className="text-green-600" />
                  ) : (
                    <TrendingDown size={16} className="text-red-600" />
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{trade.pair}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      trade.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      trade.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {trade.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(trade.openTime), { addSuffix: true })}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold">{formatPrice(trade.openPrice)}</div>
                <div className="text-sm text-gray-600">{trade.size} lots</div>
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  SL: {formatPrice(trade.stopLoss)}
                </span>
                <span className="text-gray-600">
                  TP: {formatPrice(trade.takeProfit)}
                </span>
                <span className="text-gray-600">
                  Confidence: {(trade.confidence * 100).toFixed(0)}%
                </span>
              </div>
              
              {trade.pnl !== undefined && (
                <div className={`flex items-center space-x-1 ${
                  trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <DollarSign size={14} />
                  <span className="font-semibold">{formatPnL(trade.pnl)}</span>
                </div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Strategy: {trade.strategy}
            </div>
          </div>
        ))}
        
        {filteredTrades.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-2 opacity-50" />
            <p>No trades found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradeHistory 