import React, { useEffect, useState, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { OandaStreamingService, PriceStreamData } from '../lib/oandaStreamingService'
import { MarketHoursService } from '../lib/marketHours'
import { getConfig } from '../config/tradingConfig'
import { MarketData } from '../types/trading'
import { AlertTriangle, Wifi, WifiOff, Clock, Globe } from 'lucide-react'

interface ChartData {
  time: string
  price: number
  sma20?: number
  sma50?: number
  rsi?: number
}

const Chart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('5m')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [marketStatus, setMarketStatus] = useState(MarketHoursService.getMarketStatus())
  const [currentSession, setCurrentSession] = useState(MarketHoursService.getCurrentSession())
  
  const streamingServiceRef = useRef<OandaStreamingService | null>(null)

  // Initialize OANDA streaming service
  useEffect(() => {
    let mounted = true

    const initializeStreaming = async () => {
      try {
        setIsLoading(true)
        
        // Get credentials from session storage
        const storedCreds = sessionStorage.getItem('oanda_credentials')
        if (!storedCreds) {
          setConnectionError('OANDA credentials not found. Please set up credentials in Broker Setup tab.')
          setIsLoading(false)
          return
        }

        const { apiKey, accountId, environment } = JSON.parse(storedCreds)
        if (!apiKey || !accountId) {
          setConnectionError('Invalid OANDA credentials. Please check your API key and account ID.')
          setIsLoading(false)
          return
        }

        // Create streaming service
        const streamingService = new OandaStreamingService({
          apiKey,
          accountId,
          environment,
          baseUrl: environment === 'live' 
            ? 'https://api-fxtrade.oanda.com'
            : 'https://api-fxpractice.oanda.com'
        })

        streamingServiceRef.current = streamingService

        // Set up callbacks
        streamingService.onPriceUpdate((data: PriceStreamData) => {
          if (!mounted) return
          setCurrentPrice(data.price)
          
          // Update market status
          setMarketStatus(MarketHoursService.getMarketStatus())
          setCurrentSession(MarketHoursService.getCurrentSession())
          
          // Add new price point to chart data
          setChartData(prevData => {
            const newPoint: ChartData = {
              time: new Date(data.timestamp).toLocaleTimeString(),
              price: Number(data.price.toFixed(5))
            }
            
            const newData = [...prevData, newPoint]
            // Keep only last 50 points for performance
            return newData.slice(-50)
          })
        })

        streamingService.onConnectionStatus((connected: boolean, error?: string) => {
          if (!mounted) return
          setIsConnected(connected)
          setConnectionError(error || null)
          
          if (connected) {
            console.log('✅ OANDA connection established')
          } else {
            console.error('❌ OANDA connection failed:', error)
          }
        })

        // Test connection first
        const connectionTest = await streamingService.testConnection()
        if (!mounted) return

        if (!connectionTest.success) {
          setConnectionError(connectionTest.error || 'Failed to connect to OANDA')
          setIsLoading(false)
          return
        }

        // Load historical data
        try {
          const granularity = timeframe === '1m' ? 'M1' : 
                             timeframe === '5m' ? 'M5' :
                             timeframe === '15m' ? 'M15' : 'H1'
          
          const historicalData = await streamingService.getHistoricalData(50, granularity)
          
          if (mounted) {
            const formattedData: ChartData[] = historicalData.map(candle => ({
              time: new Date(candle.timestamp).toLocaleTimeString(),
              price: Number(candle.close.toFixed(5))
            }))
            
            setChartData(formattedData)
            if (formattedData.length > 0) {
              setCurrentPrice(formattedData[formattedData.length - 1].price)
            }
          }
        } catch (error: any) {
          if (mounted) {
            setConnectionError(`Failed to load chart data: ${error.message}`)
          }
        }

        // Start live streaming
        const streamingResult = await streamingService.startStreaming()
        if (!mounted) return

        if (!streamingResult.success) {
          setConnectionError(streamingResult.error || 'Failed to start price streaming')
        }

        setIsLoading(false)

      } catch (error: any) {
        if (mounted) {
          setConnectionError(`Initialization error: ${error.message}`)
          setIsLoading(false)
        }
      }
    }

    initializeStreaming()

    return () => {
      mounted = false
      if (streamingServiceRef.current) {
        streamingServiceRef.current.destroy()
        streamingServiceRef.current = null
      }
    }
  }, []) // Only run once on mount

  // Handle timeframe changes
  useEffect(() => {
    if (!streamingServiceRef.current || !isConnected) return

    const loadHistoricalData = async () => {
      try {
        setIsLoading(true)
        
        const granularity = timeframe === '1m' ? 'M1' : 
                           timeframe === '5m' ? 'M5' :
                           timeframe === '15m' ? 'M15' : 'H1'
        
        const historicalData = await streamingServiceRef.current!.getHistoricalData(50, granularity)
        
        const formattedData: ChartData[] = historicalData.map(candle => ({
          time: new Date(candle.timestamp).toLocaleTimeString(),
          price: Number(candle.close.toFixed(5))
        }))
        
        setChartData(formattedData)
        setIsLoading(false)
      } catch (error: any) {
        setConnectionError(`Failed to load ${timeframe} data: ${error.message}`)
        setIsLoading(false)
      }
    }

    loadHistoricalData()
  }, [timeframe, isConnected])

  const formatPrice = (value: number) => value.toFixed(5)

  // Show error state if not connected
  if (connectionError) {
    return (
      <div className="card">
        <div className="h-96 flex items-center justify-center">
          <div className="alert alert-error">
            <AlertTriangle className="w-16 h-16 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold">OANDA Connection Error</h3>
              <p className="text-sm mt-1 mb-2">{connectionError}</p>
              <p className="text-xs">
                No fallback data available. Please fix the connection to view live charts.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-muted">Connecting to OANDA...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`status-badge ${isConnected ? 'status-connected' : 'status-disconnected'}`}>
            {isConnected ? (
              <Wifi className="w-4 h-4 mr-1" />
            ) : (
              <WifiOff className="w-4 h-4 mr-1" />
            )}
            <span>{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>

          {/* Market Status */}
          <div className={`status-badge ${marketStatus.isOpen ? 'status-connected' : 'status-disconnected'}`}>
            <Clock className="w-4 h-4 mr-1" />
            <span>{marketStatus.isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}</span>
          </div>

          {/* Current Session */}
          {marketStatus.isOpen && (
            <div className="status-badge bg-blue-100 text-blue-800">
              <Globe className="w-4 h-4 mr-1" />
              <span>{currentSession}</span>
            </div>
          )}

          {/* Current Price */}
          <div className="metric-value">
            EUR/USD: {formatPrice(currentPrice)}
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="flex space-x-2">
          {['1m', '5m', '15m', '1h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`nav-tab ${
                timeframe === tf
                  ? 'nav-tab-active'
                  : 'nav-tab-inactive'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Chart */}
      <div className="h-80">
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
              name="EUR/USD (Live)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>
            Last updated: {chartData.length > 0 ? 'Just now' : 'No data'}
          </span>
          <span>
            Data points: {chartData.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            Market: {marketStatus.isOpen ? 'Open' : 'Closed'}
            {!marketStatus.isOpen && marketStatus.nextOpen && (
              <> • Opens in {MarketHoursService.formatTimeRemaining(marketStatus.nextOpen)}</>
            )}
          </span>
          <span>
            Session: {currentSession}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Chart 