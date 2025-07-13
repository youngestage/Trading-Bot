import axios from 'axios'
import { OandaConfig, Trade, Position, MarketData } from '../types/trading'

class OandaAPI {
  private config: OandaConfig
  private baseURL: string

  constructor(config: OandaConfig) {
    this.config = config
    this.baseURL = config.environment === 'demo' 
      ? 'https://api-fxpractice.oanda.com' 
      : 'https://api-fxtrade.oanda.com'
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Datetime-Format': 'UNIX'
    }
  }

  // Get current EUR/USD price
  async getCurrentPrice(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/v3/accounts/${this.config.accountId}/pricing`,
        {
          headers: this.getHeaders(),
          params: {
            instruments: 'EUR_USD'
          }
        }
      )
      
      const price = response.data.prices[0]
      return (parseFloat(price.bids[0].price) + parseFloat(price.asks[0].price)) / 2
    } catch (error) {
      console.error('Error fetching current price:', error)
      throw error
    }
  }

  // Get historical EUR/USD data
  async getHistoricalData(count: number = 200, granularity: string = 'M5'): Promise<MarketData[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/v3/instruments/EUR_USD/candles`,
        {
          headers: this.getHeaders(),
          params: {
            count,
            granularity,
            price: 'M'
          }
        }
      )



      return response.data.candles
        .filter((candle: any) => candle && candle.time && candle.mid)
        .map((candle: any) => {
          // Validate and parse the timestamp
          let timestamp: string
          try {
            // OANDA timestamps are Unix timestamps in seconds with nanosecond precision
            // Convert from seconds to milliseconds for JavaScript Date
            const unixTimestamp = parseFloat(candle.time)
            const date = new Date(unixTimestamp * 1000)
            
            if (isNaN(date.getTime())) {
              console.warn('Invalid timestamp in candle data:', candle.time)
              return null
            }
            timestamp = date.toISOString()
          } catch (error) {
            console.warn('Error parsing timestamp:', candle.time, error)
            return null
          }

          return {
            pair: 'EUR/USD',
            timestamp,
            open: parseFloat(candle.mid.o),
            high: parseFloat(candle.mid.h),
            low: parseFloat(candle.mid.l),
            close: parseFloat(candle.mid.c),
            volume: candle.volume || 0
          }
        })
        .filter((item: any) => item !== null)
    } catch (error) {
      console.error('Error fetching historical data:', error)
      throw error
    }
  }

  // Place EUR/USD trade
  async placeTrade(
    type: 'buy' | 'sell',
    units: number,
    stopLoss?: number,
    takeProfit?: number
  ): Promise<Trade> {
    try {
      const orderRequest = {
        order: {
          type: 'MARKET',
          instrument: 'EUR_USD',
          units: type === 'buy' ? units : -units,
          stopLossOnFill: stopLoss ? { price: stopLoss.toString() } : undefined,
          takeProfitOnFill: takeProfit ? { price: takeProfit.toString() } : undefined
        }
      }

      const response = await axios.post(
        `${this.baseURL}/v3/accounts/${this.config.accountId}/orders`,
        orderRequest,
        {
          headers: this.getHeaders()
        }
      )

      const order = response.data.orderFillTransaction
      
      // Validate and parse the timestamp
      let openTime: string
      try {
        // OANDA timestamps are Unix timestamps in seconds with nanosecond precision
        // Convert from seconds to milliseconds for JavaScript Date
        const unixTimestamp = parseFloat(order.time)
        const date = new Date(unixTimestamp * 1000)
        
        if (isNaN(date.getTime())) {
          console.warn('Invalid timestamp in order data:', order.time)
          openTime = new Date().toISOString() // Use current time as fallback
        } else {
          openTime = date.toISOString()
        }
      } catch (error) {
        console.warn('Error parsing order timestamp:', order.time, error)
        openTime = new Date().toISOString() // Use current time as fallback
      }

      return {
        id: order.id,
        pair: 'EUR/USD',
        type,
        size: Math.abs(order.units),
        openPrice: parseFloat(order.price),
        stopLoss: stopLoss || 0,
        takeProfit: takeProfit || 0,
        openTime,
        status: 'open',
        confidence: 0.8,
        strategy: 'AI-Technical'
      }
    } catch (error) {
      console.error('Error placing trade:', error)
      throw error
    }
  }

  // Close position
  async closePosition(positionId: string): Promise<void> {
    try {
      await axios.put(
        `${this.baseURL}/v3/accounts/${this.config.accountId}/positions/EUR_USD/close`,
        {
          longUnits: 'ALL',
          shortUnits: 'ALL'
        },
        {
          headers: this.getHeaders()
        }
      )
    } catch (error) {
      console.error('Error closing position:', error)
      throw error
    }
  }

  // Get account balance
  async getAccountBalance(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.baseURL}/v3/accounts/${this.config.accountId}`,
        {
          headers: this.getHeaders()
        }
      )
      
      return parseFloat(response.data.account.balance)
    } catch (error) {
      console.error('Error fetching account balance:', error)
      throw error
    }
  }

  // Get open positions
  async getOpenPositions(): Promise<Position[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/v3/accounts/${this.config.accountId}/positions`,
        {
          headers: this.getHeaders()
        }
      )

      return response.data.positions
        .filter((pos: any) => pos.long.units !== '0' || pos.short.units !== '0')
        .map((pos: any) => ({
          id: pos.instrument,
          pair: pos.instrument.replace('_', '/'),
          type: pos.long.units !== '0' ? 'buy' : 'sell',
          size: Math.abs(parseFloat(pos.long.units || pos.short.units)),
          openPrice: parseFloat(pos.long.averagePrice || pos.short.averagePrice),
          currentPrice: 0, // Will be updated separately
          pnl: parseFloat(pos.long.pl || pos.short.pl),
          pnlPercent: 0, // Will be calculated
          stopLoss: 0, // Will be updated separately
          takeProfit: 0, // Will be updated separately
          openTime: new Date().toISOString() // Approximate
        }))
    } catch (error) {
      console.error('Error fetching positions:', error)
      throw error
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await axios.get(
        `${this.baseURL}/v3/accounts/${this.config.accountId}`,
        {
          headers: this.getHeaders()
        }
      )
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

export default OandaAPI 