import React, { useState, useEffect } from 'react'
import { MarketHoursService } from '../lib/marketHours'
import { Clock, Calendar, AlertTriangle, CheckCircle, XCircle, Globe } from 'lucide-react'

interface MarketStatusWidgetProps {
  className?: string
}

const MarketStatusWidget: React.FC<MarketStatusWidgetProps> = ({ className = '' }) => {
  const [marketStatus, setMarketStatus] = useState(MarketHoursService.getMarketStatus())
  const [currentSession, setCurrentSession] = useState(MarketHoursService.getCurrentSession())
  const [liquidityWarning, setLiquidityWarning] = useState(MarketHoursService.getLiquidityWarning())
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(MarketHoursService.getMarketStatus())
      setCurrentSession(MarketHoursService.getCurrentSession())
      setLiquidityWarning(MarketHoursService.getLiquidityWarning())
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getStatusColor = () => {
    if (marketStatus.isOpen) {
      return liquidityWarning.hasWarning ? 'text-yellow-600' : 'text-green-600'
    }
    return 'text-red-600'
  }

  const getStatusIcon = () => {
    if (marketStatus.isOpen) {
      return liquidityWarning.hasWarning ? (
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
      ) : (
        <CheckCircle className="w-5 h-5 text-green-600" />
      )
    }
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  const getStatusText = () => {
    if (marketStatus.isOpen) {
      return liquidityWarning.hasWarning ? 'OPEN (Low Liquidity)' : 'OPEN'
    }
    return 'CLOSED'
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 rounded-lg p-2">
            <Globe className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="heading-sm">Forex Market Status</h3>
        </div>
        <div className={`status-badge ${
          marketStatus.isOpen 
            ? liquidityWarning.hasWarning 
              ? 'status-warning' 
              : 'status-connected'
            : 'status-disconnected'
        }`}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </div>
      </div>

      {/* Current Session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="metric-label">Current Session</span>
          </div>
          <div className="metric-value">{currentSession}</div>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="metric-label">UTC Time</span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Market Status Details */}
      <div className="space-y-3">
        {!marketStatus.isOpen && (
          <div className="alert alert-error">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Market Closed</div>
              <div className="text-sm mt-1">{marketStatus.reason}</div>
              {marketStatus.nextOpen && (
                <div className="text-xs mt-1">
                  Opens in: {MarketHoursService.formatTimeRemaining(marketStatus.nextOpen)}
                </div>
              )}
            </div>
          </div>
        )}

        {marketStatus.isOpen && liquidityWarning.hasWarning && (
          <div className="alert alert-warning">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Liquidity Warning</div>
              <div className="text-sm mt-1">{liquidityWarning.message}</div>
            </div>
          </div>
        )}

        {marketStatus.isOpen && !liquidityWarning.hasWarning && (
          <div className="alert alert-success">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium">Market Open</div>
              <div className="text-sm mt-1">Good liquidity - optimal trading conditions</div>
              {marketStatus.nextClose && (
                <div className="text-xs mt-1">
                  Closes in: {MarketHoursService.formatTimeRemaining(marketStatus.nextClose)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trading Hours Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-muted">
          <div className="font-medium mb-1">Forex Market Hours (UTC):</div>
          <div>Sunday 21:00 - Friday 21:00</div>
          <div>Closed: Saturday & Sunday morning</div>
        </div>
      </div>
    </div>
  )
}

export default MarketStatusWidget 