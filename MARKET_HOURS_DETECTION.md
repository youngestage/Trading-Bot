# 🕒 Market Hours Detection System

## **Overview**
The EUR/USD Trading Bot now includes comprehensive market hours detection that automatically identifies when forex markets are closed and prevents trading during these periods.

## **🚀 Key Features**

### **1. Real-Time Market Status Detection**
- **Forex Trading Hours**: Sunday 21:00 UTC to Friday 21:00 UTC
- **Weekend Detection**: Automatically detects Saturday and Sunday market closures
- **Holiday Detection**: Recognizes major forex market holidays
- **Session Identification**: Shows current trading session (Sydney/Tokyo, London, New York)

### **2. Liquidity Warnings**
- **Low Liquidity Periods**: Friday afternoon, Sunday evening, overnight hours
- **Risk Alerts**: Warns users during reduced liquidity conditions
- **Optimal Trading Times**: Highlights periods with good liquidity

### **3. Visual Status Indicators**
- **Dashboard Header**: Shows market status alongside OANDA connection
- **Chart Component**: Displays market session and status information
- **Trading Panel**: Multiple warnings for market closure and liquidity issues
- **Market Status Widget**: Dedicated component showing detailed market information

## **🔧 Technical Implementation**

### **Core Service** (`src/lib/marketHours.ts`)
```typescript
MarketHoursService.getMarketStatus()       // Current market open/closed status
MarketHoursService.getCurrentSession()     // Active trading session
MarketHoursService.isTradingAllowed()      // Whether trading should be permitted
MarketHoursService.getLiquidityWarning()   // Low liquidity period detection
MarketHoursService.formatTimeRemaining()   // Time until next market event
```

### **New Components**
- **MarketStatusWidget**: Comprehensive market status display
- **Updated Dashboard**: Market status in header and warnings
- **Enhanced TradingPanel**: Market-aware trading controls
- **Updated Chart**: Market session information display

## **📊 Market Sessions**

### **Trading Sessions (UTC)**
- **Sydney/Tokyo**: 21:00 - 06:00 UTC
- **London**: 06:00 - 14:00 UTC  
- **New York**: 14:00 - 21:00 UTC

### **Market Closures**
- **Weekend**: Friday 21:00 UTC to Sunday 21:00 UTC
- **Holidays**: Major forex market holidays (New Year, Christmas, etc.)
- **Reduced Hours**: Some holidays have early closures

## **⚠️ Liquidity Warnings**

### **Low Liquidity Periods**
- **Friday Afternoon** (after 16:00 UTC): End of week, reduced activity
- **Sunday Evening** (21:00-23:00 UTC): Market just opened, potential volatility
- **Overnight Hours** (00:00-06:00 UTC): Minimal trading activity

### **Warning Types**
- **🟡 Yellow**: Low liquidity but trading allowed
- **🟠 Orange**: Market closed, no trading
- **🔴 Red**: Connection issues, no trading

## **🎯 User Experience**

### **When Market is OPEN**
✅ **Green indicators** throughout the interface  
✅ **Trading enabled** with full functionality  
✅ **Session information** displayed (London, New York, etc.)  
✅ **Countdown** to market close shown  

### **When Market is CLOSED**
❌ **Orange/Red indicators** showing closure  
❌ **Trading disabled** with clear explanations  
❌ **Closure reason** displayed (Weekend, Holiday, etc.)  
❌ **Countdown** to next market opening  

### **During Low Liquidity**
⚠️ **Yellow warnings** about reduced liquidity  
⚠️ **Trading allowed** but with caution messages  
⚠️ **Session context** explaining the warning  

## **🔍 Visual Components**

### **Dashboard Header**
- Connection status (OANDA)
- Market status (Open/Closed)
- Current session name
- Start/Stop bot button (disabled when market closed)

### **Market Status Widget**
- Current UTC time and session
- Market open/closed with detailed reason
- Time remaining to next market event
- Forex trading hours reference

### **Trading Panel**
- Connection warnings
- Market closure alerts
- Low liquidity warnings
- Session information
- Trading controls (disabled appropriately)

### **Chart Component**
- LIVE/DISCONNECTED status
- MARKET OPEN/CLOSED status
- Current session indicator
- Time to next market event

## **🛠️ Configuration**

### **Market Hours** (UTC)
```typescript
// Forex market operates:
Sunday 21:00 UTC → Friday 21:00 UTC

// Closed periods:
- Saturday (all day)
- Sunday before 21:00 UTC
- Friday after 21:00 UTC
- Major holidays
```

### **Holidays Included (2024)**
- New Year's Day
- Good Friday / Easter Monday
- Labour Day (May 1)
- Independence Day (US)
- Christmas Day / Boxing Day
- Thanksgiving / Black Friday
- Other major market holidays

## **⚡ Real-Time Updates**

### **Update Frequency**
- **Market status**: Every minute
- **Session changes**: Automatic detection
- **Holiday checking**: Daily validation
- **Liquidity warnings**: Continuous monitoring

### **Automatic Behaviors**
- **Bot disabling**: Automatically stops when market closes
- **Trade blocking**: Prevents new trades during closures
- **Warning display**: Shows appropriate messages
- **Status updates**: Real-time visual feedback

## **🎯 Benefits**

### **Risk Management**
- **Prevents weekend gaps**: No trades during market closures
- **Liquidity awareness**: Warns about low liquidity periods
- **Holiday protection**: Avoids trading during market holidays

### **User Education**
- **Session awareness**: Teaches about forex market sessions
- **Timing optimization**: Helps identify best trading times
- **Market understanding**: Provides context about market hours

### **Professional Trading**
- **Institutional approach**: Mimics professional trading systems
- **Compliance**: Follows market hour conventions
- **Risk reduction**: Minimizes exposure during closed periods

## **🔮 Future Enhancements**

### **Potential Additions**
- **Economic calendar**: Integration with news events
- **Session overlaps**: Highlight high-liquidity overlap periods
- **Regional holidays**: More comprehensive holiday calendars
- **Volatility tracking**: Historical session volatility data

The market hours detection system ensures that the EUR/USD Trading Bot operates professionally and safely, respecting forex market conventions while providing clear guidance to users about optimal trading times. 