import axios from 'axios'
import { OandaConfig, MarketData } from '../types/trading'

export interface PriceStreamData {
  price: number
  bid: number
  ask: number
  timestamp: string
}

export class OandaStreamingService {
  private config: OandaConfig
  private baseURL: string
  private priceUpdateCallbacks: Set<(data: PriceStreamData) => void> = new Set()
  private connectionStatusCallbacks: Set<(connected: boolean, error?: string) => void> = new Set()
  private streamingInterval: NodeJS.Timeout | null = null
  private isConnected: boolean = false
  private lastError: string | null = null

  constructor(config: OandaConfig) {
    this.config = config
    this.baseURL = config.baseUrl || (config.environment === 'demo' 
      ? 'https://api-fxpractice.oanda.com' 
      : 'https://api-fxtrade.oanda.com')
  }

  // Subscribe to price updates
  onPriceUpdate(callback: (data: PriceStreamData) => void): void {
    this.priceUpdateCallbacks.add(callback)
  }

  // Subscribe to connection status changes
  onConnectionStatus(callback: (connected: boolean, error?: string) => void): void {
    this.connectionStatusCallbacks.add(callback)
  }

  // Remove callbacks
  removeCallback(callback: Function): void {
    this.priceUpdateCallbacks.delete(callback as any)
    this.connectionStatusCallbacks.delete(callback as any)
  }

  // Test OANDA connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.get(
        `${this.baseURL}/v3/accounts/${this.config.accountId}`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      )

      if (response.status === 200) {
        this.isConnected = true
        this.lastError = null
        this.notifyConnectionStatus(true)
        return { success: true }
      } else {
        const error = `OANDA API returned status ${response.status}`
        this.isConnected = false
        this.lastError = error
        this.notifyConnectionStatus(false, error)
        return { success: false, error }
      }
    } catch (error: any) {
      const errorMessage = this.formatError(error)
      this.isConnected = false
      this.lastError = errorMessage
      this.notifyConnectionStatus(false, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Start live price streaming
  async startStreaming(): Promise<{ success: boolean; error?: string }> {
    // First test connection
    const connectionTest = await this.testConnection()
    if (!connectionTest.success) {
      return connectionTest
    }

    // Stop any existing stream
    this.stopStreaming()

    try {
      // Start price polling (OANDA doesn't have WebSocket streaming for retail accounts)
      this.streamingInterval = setInterval(async () => {
        try {
          const priceData = await this.fetchCurrentPrice()
          this.notifyPriceUpdate(priceData)
        } catch (error: any) {
          console.error('Price fetch error:', error)
          const errorMessage = this.formatError(error)
          this.isConnected = false
          this.lastError = errorMessage
          this.notifyConnectionStatus(false, errorMessage)
        }
      }, 1000) // Update every second for live data

      console.log('🟢 OANDA price streaming started')
      return { success: true }
    } catch (error: any) {
      const errorMessage = this.formatError(error)
      this.isConnected = false
      this.lastError = errorMessage
      this.notifyConnectionStatus(false, errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Stop price streaming
  stopStreaming(): void {
    if (this.streamingInterval) {
      clearInterval(this.streamingInterval)
      this.streamingInterval = null
      console.log('🔴 OANDA price streaming stopped')
    }
  }

  // Get current price
  private async fetchCurrentPrice(): Promise<PriceStreamData> {
    const response = await axios.get(
      `${this.baseURL}/v3/accounts/${this.config.accountId}/pricing`,
      {
        headers: this.getHeaders(),
        params: {
          instruments: 'EUR_USD'
        },
        timeout: 5000
      }
    )

    if (!response.data.prices || response.data.prices.length === 0) {
      throw new Error('No price data received from OANDA')
    }

    const priceData = response.data.prices[0]
    const bid = parseFloat(priceData.bids[0].price)
    const ask = parseFloat(priceData.asks[0].price)
    const mid = (bid + ask) / 2

    return {
      price: mid,
      bid,
      ask,
      timestamp: new Date().toISOString()
    }
  }

  // Get historical data for charts
  async getHistoricalData(count: number = 200, granularity: string = 'M5'): Promise<MarketData[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to OANDA. Please check your connection.')
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/v3/instruments/EUR_USD/candles`,
        {
          headers: this.getHeaders(),
          params: {
            count,
            granularity,
            price: 'M'
          },
          timeout: 10000
        }
      )

      if (!response.data.candles || response.data.candles.length === 0) {
        throw new Error('No historical data received from OANDA')
      }

      return response.data.candles.map((candle: any) => ({
        pair: 'EUR/USD',
        timestamp: new Date(candle.time).toISOString(),
        open: parseFloat(candle.mid.o),
        high: parseFloat(candle.mid.h),
        low: parseFloat(candle.mid.l),
        close: parseFloat(candle.mid.c),
        volume: candle.volume || 0
      }))
    } catch (error: any) {
      const errorMessage = this.formatError(error)
      throw new Error(`Failed to fetch historical data: ${errorMessage}`)
    }
  }

  // Get connection status
  getConnectionStatus(): { connected: boolean; error?: string } {
    return {
      connected: this.isConnected,
      error: this.lastError || undefined
    }
  }

  // Private helper methods
  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Datetime-Format': 'RFC3339'
    }
  }

  private notifyPriceUpdate(data: PriceStreamData): void {
    this.priceUpdateCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Error in price update callback:', error)
      }
    })
  }

  private notifyConnectionStatus(connected: boolean, error?: string): void {
    this.connectionStatusCallbacks.forEach(callback => {
      try {
        callback(connected, error)
      } catch (error) {
        console.error('Error in connection status callback:', error)
      }
    })
  }

  private formatError(error: any): string {
    if (error.response) {
      // HTTP error
      const status = error.response.status
      const statusText = error.response.statusText
      const message = error.response.data?.errorMessage || error.response.data?.message || statusText
      
      if (status === 401) {
        return 'OANDA authentication failed. Please check your API key.'
      } else if (status === 403) {
        return 'OANDA access forbidden. Please check your account permissions.'
      } else if (status === 404) {
        return 'OANDA endpoint not found. Please check your account ID.'
      } else if (status >= 500) {
        return 'OANDA server error. Please try again later.'
      } else {
        return `OANDA API error (${status}): ${message}`
      }
    } else if (error.request) {
      // Network error
      return 'Network error: Cannot connect to OANDA servers. Please check your internet connection.'
    } else {
      // Other error
      return error.message || 'Unknown error occurred while connecting to OANDA'
    }
  }

  // Cleanup
  destroy(): void {
    this.stopStreaming()
    this.priceUpdateCallbacks.clear()
    this.connectionStatusCallbacks.clear()
    this.isConnected = false
    this.lastError = null
  }
} 