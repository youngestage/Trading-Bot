import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Globe, 
  Lock,
  Activity,
  Settings,
  Info,
  ArrowRight,
  Loader2,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { OandaStreamingService } from '../lib/oandaStreamingService'
import { useBotStore } from '../store/botStore'

interface BrokerConnectionProps {
  onConnectionChange?: (connected: boolean, error?: string) => void
  onCredentialsSet?: (apiKey: string, accountId: string, environment: 'demo' | 'live') => void
}

interface ConnectionStatus {
  connected: boolean
  testing: boolean
  error?: string
  account?: {
    id: string
    currency: string
    balance: number
    environment: string
  }
}

const BrokerConnection: React.FC<BrokerConnectionProps> = ({
  onConnectionChange,
  onCredentialsSet
}) => {
  const { 
    isConnected, 
    accountInfo, 
    realBalance, 
    isLoadingAccount,
    initializeTradingService,
    refreshAccountData
  } = useBotStore()

  const [credentials, setCredentials] = useState({
    apiKey: '',
    accountId: '',
    environment: 'demo' as 'demo' | 'live'
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    testing: false
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false)

  // Check for stored credentials on mount
  useEffect(() => {
    const storedCreds = sessionStorage.getItem('oanda_credentials')
    if (storedCreds) {
      try {
        const parsed = JSON.parse(storedCreds)
        if (parsed.apiKey && parsed.accountId) {
          setCredentials(parsed)
          setHasStoredCredentials(true)
          // Auto-test stored credentials
          testConnection(parsed.apiKey, parsed.accountId, parsed.environment)
        }
      } catch (error) {
        console.error('Error parsing stored credentials:', error)
      }
    }
  }, [])

  const validateCredentials = () => {
    const newErrors: string[] = []

    if (!credentials.apiKey.trim()) {
      newErrors.push('API Key is required')
    } else if (credentials.apiKey.length < 20) {
      newErrors.push('API Key appears to be invalid (too short)')
    }

    if (!credentials.accountId.trim()) {
      newErrors.push('Account ID is required')
    } else if (!/^[\d-]+$/.test(credentials.accountId)) {
      newErrors.push('Account ID format is invalid (should be like: 101-001-12345678-001)')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const testConnection = async (apiKey?: string, accountId?: string, environment?: 'demo' | 'live') => {
    const testApiKey = apiKey || credentials.apiKey
    const testAccountId = accountId || credentials.accountId
    const testEnvironment = environment || credentials.environment

    if (!validateCredentials() && !apiKey) {
      return
    }

    setStatus(prev => ({ ...prev, testing: true, error: undefined }))
    setErrors([])

    try {
      // Store credentials first
      const credentialsToStore = {
        apiKey: testApiKey,
        accountId: testAccountId,
        environment: testEnvironment
      }
      sessionStorage.setItem('oanda_credentials', JSON.stringify(credentialsToStore))

      // Initialize real trading service
      await initializeTradingService(testApiKey, testAccountId, testEnvironment)
      
      setStatus({
        connected: true,
        testing: false,
        account: {
          id: testAccountId,
          currency: accountInfo?.currency || 'USD',
          balance: realBalance,
          environment: testEnvironment.toUpperCase()
        }
      })
      
      setHasStoredCredentials(true)
      onConnectionChange?.(true)
      onCredentialsSet?.(testApiKey, testAccountId, testEnvironment)
      
      console.log('✅ OANDA connection and trading service initialized successfully')
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect to OANDA'
      setStatus({
        connected: false,
        testing: false,
        error: errorMessage
      })
      onConnectionChange?.(false, errorMessage)
      console.error('❌ OANDA connection failed:', error)
    }
  }

  const handleInputChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleConnect = () => {
    testConnection()
  }

  const handleDisconnect = () => {
    sessionStorage.removeItem('oanda_credentials')
    setStatus({ connected: false, testing: false })
    setCredentials({ apiKey: '', accountId: '', environment: 'demo' })
    setHasStoredCredentials(false)
    onConnectionChange?.(false)
  }

  const clearCredentials = () => {
    handleDisconnect()
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-3">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="heading-md">OANDA Broker Connection</h2>
            <p className="text-muted">Connect to your OANDA account for live trading</p>
          </div>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2">
          {status.testing ? (
            <div className="status-badge status-warning">
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span>Testing...</span>
            </div>
          ) : status.connected ? (
            <div className="status-badge status-connected">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="status-badge status-disconnected">
              <XCircle className="w-4 h-4 mr-1" />
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Account Info (when connected) */}
      {(status.connected || isConnected) && accountInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Account Connected</h3>
            </div>
            <button
              onClick={async () => {
                try {
                  await refreshAccountData()
                } catch (error) {
                  console.error('Failed to refresh account data:', error)
                }
              }}
              disabled={isLoadingAccount}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAccount ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Account ID:</span>
              <span className="ml-2 font-mono text-green-800">{credentials.accountId}</span>
            </div>
            <div>
              <span className="text-gray-600">Environment:</span>
              <span className={`ml-2 font-medium ${
                credentials.environment === 'live' ? 'text-red-600' : 'text-green-600'
              }`}>
                {credentials.environment.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Balance:</span>
              <span className="ml-2 font-bold text-green-800">
                {accountInfo.currency} {accountInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Equity:</span>
              <span className="ml-2 font-bold text-green-800">
                {accountInfo.currency} {accountInfo.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Open Positions:</span>
              <span className="ml-2 font-medium text-green-800">{accountInfo.openPositions}</span>
            </div>
            <div>
              <span className="text-gray-600">Unrealized P&L:</span>
              <span className={`ml-2 font-medium ${
                accountInfo.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {accountInfo.currency} {accountInfo.unrealizedPL >= 0 ? '+' : ''}{accountInfo.unrealizedPL.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(errors.length > 0 || status.error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Connection Error</h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
            {status.error && <li>• {status.error}</li>}
          </ul>
        </div>
      )}

      {/* Main Form */}
      <div className="space-y-6">
        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Trading Environment
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('environment', 'demo')}
              className={`p-4 rounded-lg border-2 transition-all ${
                credentials.environment === 'demo'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Globe className={`w-5 h-5 ${
                  credentials.environment === 'demo' ? 'text-green-600' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Demo Account</div>
                  <div className="text-sm text-gray-600">Practice with virtual money</div>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleInputChange('environment', 'live')}
              className={`p-4 rounded-lg border-2 transition-all ${
                credentials.environment === 'live'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock className={`w-5 h-5 ${
                  credentials.environment === 'live' ? 'text-red-600' : 'text-gray-500'
                }`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Live Account</div>
                  <div className="text-sm text-gray-600">Real money trading</div>
                </div>
              </div>
            </button>
          </div>
          
          {/* Live Trading Warning */}
          {credentials.environment === 'live' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium text-sm">
                  Warning: Live trading uses real money. You could lose your entire investment.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OANDA API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={credentials.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your OANDA API key"
              disabled={status.testing}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Generate your API key from OANDA → Account → Manage API Access
          </p>
        </div>

        {/* Account ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account ID
          </label>
          <input
            type="text"
            value={credentials.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="101-001-12345678-001"
            disabled={status.testing}
          />
          <p className="text-xs text-gray-600 mt-1">
            Find your account ID in your OANDA account dashboard
          </p>
        </div>

        {/* Advanced Settings */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Advanced Settings</span>
            <ArrowRight className={`w-4 h-4 transition-transform ${
              showAdvanced ? 'rotate-90' : ''
            }`} />
          </button>
          
          {showAdvanced && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Connection Details</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Demo URL:</span> https://api-fxpractice.oanda.com
                </div>
                <div>
                  <span className="font-medium">Live URL:</span> https://api-fxtrade.oanda.com
                </div>
                <div>
                  <span className="font-medium">API Version:</span> v20
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {status.connected ? (
            <button
              onClick={handleDisconnect}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={status.testing || !credentials.apiKey || !credentials.accountId}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {status.testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </button>
          )}
          
          {hasStoredCredentials && (
            <button
              onClick={clearCredentials}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Clear Credentials
            </button>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Security Notice</span>
        </div>
        <p className="text-sm text-blue-700">
          Your credentials are stored securely in your browser's session storage and are never sent to our servers. 
          They are only used to connect directly to OANDA's API.
        </p>
      </div>
    </div>
  )
}

export default BrokerConnection 