import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { TrendingUp, TrendingDown, Square, DollarSign, Zap } from 'lucide-react'

const TradingPanel: React.FC = () => {
  const { 
    config, 
    currentPrice, 
    positions, 
    isConnected,
    addTrade 
  } = useBotStore()

  const [tradeSize, setTradeSize] = useState(config.strategy.risk.positionSize)
  const [stopLoss, setStopLoss] = useState(config.strategy.risk.stopLoss)
  const [takeProfit, setTakeProfit] = useState(config.strategy.risk.takeProfit)

  const handleBuy = () => {
    if (!isConnected) return

    const trade = {
      id: Date.now().toString(),
      pair: 'EUR/USD',
      type: 'buy' as const,
      size: tradeSize,
      openPrice: currentPrice,
      stopLoss: currentPrice - (stopLoss * 0.0001),
      takeProfit: currentPrice + (takeProfit * 0.0001),
      openTime: new Date().toISOString(),
      status: 'open' as const,
      confidence: 0.8,
      strategy: 'Manual'
    }

    addTrade(trade)
  }

  const handleSell = () => {
    if (!isConnected) return

    const trade = {
      id: Date.now().toString(),
      pair: 'EUR/USD',
      type: 'sell' as const,
      size: tradeSize,
      openPrice: currentPrice,
      stopLoss: currentPrice + (stopLoss * 0.0001),
      takeProfit: currentPrice - (takeProfit * 0.0001),
      openTime: new Date().toISOString(),
      status: 'open' as const,
      confidence: 0.8,
      strategy: 'Manual'
    }

    addTrade(trade)
  }

  return (
    <div className="trading-card">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Zap className="mr-2" size={20} />
        Manual Trading
      </h2>
      
      <div className="space-y-4">
        {/* Current Price Display */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {currentPrice.toFixed(5)}
            </div>
            <div className="text-sm text-gray-600">EUR/USD</div>
          </div>
        </div>

        {/* Trade Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position Size (lots)
          </label>
          <input
            type="number"
            className="trading-input w-full"
            value={tradeSize}
            onChange={(e) => setTradeSize(parseFloat(e.target.value))}
            min="0.01"
            max="10"
            step="0.01"
          />
        </div>

        {/* Stop Loss */}
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
        </div>

        {/* Take Profit */}
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
        </div>

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleBuy}
            disabled={!isConnected}
            className="trading-button trading-button-success flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp size={20} />
            <span>BUY</span>
          </button>
          
          <button
            onClick={handleSell}
            disabled={!isConnected}
            className="trading-button trading-button-danger flex items-center justify-center space-x-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingDown size={20} />
            <span>SELL</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="text-sm py-2 px-3 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">
              Close All
            </button>
            <button className="text-sm py-2 px-3 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
              Modify SL/TP
            </button>
          </div>
        </div>

        {/* Current Positions Summary */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Open Positions</span>
            <span className="font-semibold">{positions.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Exposure</span>
            <span className="font-semibold">
              {positions.reduce((sum, pos) => sum + pos.size, 0).toFixed(2)} lots
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingPanel 