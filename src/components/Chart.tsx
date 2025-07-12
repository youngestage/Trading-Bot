import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useBotStore } from '../store/botStore'

interface ChartData {
  time: string
  price: number
  sma20?: number
  sma50?: number
  rsi?: number
}

const Chart: React.FC = () => {
  const { currentPrice, indicators, marketData } = useBotStore()
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('5m')

  useEffect(() => {
    // Generate mock chart data based on current price
    const generateChartData = () => {
      const data: ChartData[] = []
      let price = currentPrice
      
      for (let i = 0; i < 50; i++) {
        const variation = (Math.random() - 0.5) * 0.01
        price = price + variation
        
        data.push({
          time: new Date(Date.now() - (50 - i) * 5 * 60 * 1000).toLocaleTimeString(),
          price: Number(price.toFixed(5)),
          sma20: indicators ? Number((price * 0.999).toFixed(5)) : undefined,
          sma50: indicators ? Number((price * 0.998).toFixed(5)) : undefined,
          rsi: indicators ? indicators.rsi : undefined
        })
      }
      
      return data
    }

    setChartData(generateChartData())
  }, [currentPrice, indicators])

  const formatPrice = (value: number) => value.toFixed(5)

  return (
    <div className="w-full h-96">
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {['1m', '5m', '15m', '1h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1 text-sm rounded ${
                timeframe === tf
                  ? 'bg-trading-blue text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-trading-blue rounded-full"></div>
            <span>Price</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>SMA 20</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>SMA 50</span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['dataMin - 0.005', 'dataMax + 0.005']}
            tick={{ fontSize: 12 }}
            tickFormatter={formatPrice}
          />
          <Tooltip 
            formatter={(value: number) => [formatPrice(value), 'Price']}
            labelStyle={{ color: '#374151' }}
          />
          <Legend />
          
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            name="EUR/USD"
          />
          
          {indicators && (
            <>
              <Line 
                type="monotone" 
                dataKey="sma20" 
                stroke="#F59E0B" 
                strokeWidth={1}
                dot={false}
                name="SMA 20"
              />
              <Line 
                type="monotone" 
                dataKey="sma50" 
                stroke="#8B5CF6" 
                strokeWidth={1}
                dot={false}
                name="SMA 50"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Technical Indicators Panel */}
      {indicators && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">RSI</div>
            <div className={`font-semibold ${
              indicators.rsi > 70 ? 'text-red-600' : 
              indicators.rsi < 30 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {indicators.rsi.toFixed(1)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">SMA 20</div>
            <div className="font-semibold text-gray-900">
              {indicators.sma20.toFixed(5)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">SMA 50</div>
            <div className="font-semibold text-gray-900">
              {indicators.sma50.toFixed(5)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-gray-600">MACD</div>
            <div className={`font-semibold ${
              indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {indicators.macd.macd.toFixed(5)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chart 