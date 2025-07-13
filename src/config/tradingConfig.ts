// EUR/USD Trading Bot Configuration
export interface LiveTradingConfig {
  // OANDA API Configuration
  oanda: {
    apiKey: string
    accountId: string
    environment: 'demo' | 'live'
    maxRetries: number
    timeout: number
  }

  // Risk Management
  risk: {
    maxDailyLossPercent: number
    maxPositionSize: number
    maxConcurrentTrades: number
    riskPerTrade: number
    stopLossPips: number
    takeProfitPips: number
    emergencyStopLoss: number
    autoCloseOnDrawdown: boolean
    maxDrawdownPercent: number
  }

  // AI Configuration
  ai: {
    confidenceThreshold: number
    learningRate: number
    trainingEpochs: number
    retrainFrequency: number // hours
  }

  // Safety Features
  safety: {
    requireManualConfirmation: boolean
    enableEmergencyStop: boolean
    enableLiveTradingWarnings: boolean
    enableRiskAlerts: boolean
    enableTradeNotifications: boolean
    maxConsecutiveLosses: number
    pauseOnConsecutiveLosses: boolean
  }

  // Monitoring
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error'
    saveTradeHistory: boolean
    backupFrequency: number // hours
    performanceReportFrequency: number // hours
  }

  // Trading Hours (UTC)
  tradingHours: {
    enabled: boolean
    start: string // "08:00"
    end: string   // "17:00"
    timezone: string // "UTC"
  }
}

// Default configuration for demo trading
export const DEMO_CONFIG: LiveTradingConfig = {
  oanda: {
    apiKey: '', // Will be set dynamically
    accountId: '', // Will be set dynamically
    environment: 'demo',
    maxRetries: 3,
    timeout: 10000
  },
  risk: {
    maxDailyLossPercent: 5.0,
    maxPositionSize: 1.0,
    maxConcurrentTrades: 3,
    riskPerTrade: 2.0,
    stopLossPips: 50,
    takeProfitPips: 100,
    emergencyStopLoss: 10.0,
    autoCloseOnDrawdown: true,
    maxDrawdownPercent: 5.0
  },
  ai: {
    confidenceThreshold: 0.70,
    learningRate: 0.008,
    trainingEpochs: 150,
    retrainFrequency: 24
  },
  safety: {
    requireManualConfirmation: false,
    enableEmergencyStop: true,
    enableLiveTradingWarnings: true,
    enableRiskAlerts: true,
    enableTradeNotifications: true,
    maxConsecutiveLosses: 5,
    pauseOnConsecutiveLosses: true
  },
  monitoring: {
    logLevel: 'info',
    saveTradeHistory: true,
    backupFrequency: 6,
    performanceReportFrequency: 24
  },
  tradingHours: {
    enabled: false,
    start: "08:00",
    end: "17:00",
    timezone: "UTC"
  }
}

// Configuration for live trading with enhanced safety
export const LIVE_CONFIG: LiveTradingConfig = {
  ...DEMO_CONFIG,
  oanda: {
    ...DEMO_CONFIG.oanda,
    environment: 'live'
  },
  risk: {
    ...DEMO_CONFIG.risk,
    maxDailyLossPercent: 3.0,  // More conservative for live
    maxPositionSize: 0.5,      // Smaller positions for live
    riskPerTrade: 1.5,         // Lower risk per trade
    maxDrawdownPercent: 3.0    // Tighter drawdown control
  },
  ai: {
    ...DEMO_CONFIG.ai,
    confidenceThreshold: 0.75  // Higher confidence required for live
  },
  safety: {
    ...DEMO_CONFIG.safety,
    requireManualConfirmation: true,  // Always require confirmation for live
    maxConsecutiveLosses: 3,          // Lower threshold for live
    pauseOnConsecutiveLosses: true
  },
  monitoring: {
    ...DEMO_CONFIG.monitoring,
    logLevel: 'debug',         // More detailed logging for live
    backupFrequency: 2,        // More frequent backups
    performanceReportFrequency: 12  // More frequent reports
  },
  tradingHours: {
    enabled: true,
    start: "08:00",  // London session start
    end: "17:00",    // New York session end
    timezone: "UTC"
  }
}

// Get environment variables safely
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Try import.meta.env first (Vite)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key] || defaultValue
  }
  
  // Fallback to process.env (Node.js)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue
  }
  
  return defaultValue
}

// Get configuration based on environment
export function getConfig(): LiveTradingConfig {
  const environment = getEnvVar('VITE_OANDA_ENVIRONMENT', 'demo') as 'demo' | 'live'
  
  const config = environment === 'live' ? LIVE_CONFIG : DEMO_CONFIG
  
  // Set API credentials from environment variables
  config.oanda.apiKey = getEnvVar('VITE_OANDA_API_KEY', '')
  config.oanda.accountId = getEnvVar('VITE_OANDA_ACCOUNT_ID', '')
  config.oanda.environment = environment
  
  if (environment === 'live') {
    console.warn('🚨 LIVE TRADING MODE ENABLED 🚨')
    console.warn('⚠️  This will use real money! Make sure you understand the risks.')
  } else {
    console.log('📊 Demo trading mode enabled - using paper money')
  }
  
  return config
}

// Get configuration with custom credentials (for runtime setup)
export function getConfigWithCredentials(apiKey: string, accountId: string, environment: 'demo' | 'live' = 'demo'): LiveTradingConfig {
  const config = environment === 'live' ? { ...LIVE_CONFIG } : { ...DEMO_CONFIG }
  
  config.oanda.apiKey = apiKey
  config.oanda.accountId = accountId
  config.oanda.environment = environment
  
  return config
}

// Validation function for live trading
export function validateLiveConfig(config: LiveTradingConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate API credentials
  if (!config.oanda.apiKey) {
    errors.push('OANDA API key is required')
  }
  
  if (!config.oanda.accountId) {
    errors.push('OANDA account ID is required')
  }

  // Validate risk settings
  if (config.risk.maxDailyLossPercent > 10) {
    errors.push('Maximum daily loss cannot exceed 10%')
  }
  
  if (config.risk.riskPerTrade > 5) {
    errors.push('Risk per trade cannot exceed 5%')
  }
  
  if (config.risk.maxPositionSize > 2) {
    errors.push('Maximum position size cannot exceed 2 lots')
  }

  // Validate AI settings
  if (config.ai.confidenceThreshold < 0.6) {
    errors.push('AI confidence threshold must be at least 60%')
  }

  // Live trading specific validations
  if (config.oanda.environment === 'live') {
    if (!config.safety.requireManualConfirmation) {
      errors.push('Manual confirmation is required for live trading')
    }
    
    if (config.risk.maxDailyLossPercent > 5) {
      errors.push('Daily loss limit should not exceed 5% for live trading')
    }
    
    if (config.risk.maxPositionSize > 1) {
      errors.push('Position size should not exceed 1 lot for live trading')
    }
  }

  return { valid: errors.length === 0, errors }
} 