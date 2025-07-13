# 🚀 Live Trading Setup Guide

## **⚠️ IMPORTANT DISCLAIMER**
**Live trading involves real money and significant risk. You could lose all or part of your investment. This bot is for educational purposes. Always test thoroughly with demo accounts before going live.**

## **📋 Prerequisites**

1. **OANDA Account**: Sign up at [OANDA](https://oanda.com)
2. **API Access**: Generate API credentials in your OANDA account
3. **Sufficient Balance**: Minimum $1000 recommended for live trading
4. **Risk Understanding**: Fully understand the risks involved

## **🔧 Environment Setup**

### **1. Create Environment File**

Create a `.env.local` file in your project root:

```env
# OANDA API Configuration
OANDA_API_KEY=your_api_key_here
OANDA_ACCOUNT_ID=your_account_id_here
OANDA_ENVIRONMENT=demo  # Use 'demo' for testing, 'live' for real trading

# Trading Configuration
MAX_DAILY_LOSS_PERCENT=3.0
MAX_POSITION_SIZE=0.5
MAX_CONCURRENT_TRADES=3
EMERGENCY_STOP_LOSS=10.0

# AI Configuration
AI_CONFIDENCE_THRESHOLD=0.75
AI_LEARNING_RATE=0.008
AI_TRAINING_EPOCHS=150

# Risk Management
RISK_PER_TRADE=1.5
STOP_LOSS_PIPS=50
TAKE_PROFIT_PIPS=100

# Safety Features
REQUIRE_MANUAL_CONFIRMATION=true
ENABLE_EMERGENCY_STOP=true
AUTO_CLOSE_ON_DRAWDOWN=true
```

### **2. OANDA API Setup**

1. **Login to OANDA**: Go to [OANDA](https://oanda.com) and login
2. **Navigate to API**: Account → Manage API Access
3. **Generate API Key**: Create a new API key
4. **Copy Credentials**: 
   - API Key: Copy the generated key
   - Account ID: Found in your account details
5. **Set Environment**: Choose 'demo' or 'live'

### **3. API Endpoints**

```javascript
// Demo Environment
Demo API: https://api-fxpractice.oanda.com
Demo Account: Use your demo account ID

// Live Environment  
Live API: https://api-fxtrade.oanda.com
Live Account: Use your live account ID
```

## **🛡️ Safety Features**

### **Built-in Safety Measures**

1. **Manual Confirmation**: All live trades require manual approval
2. **Emergency Stop**: Instant halt button for all trading
3. **Daily Loss Limits**: Automatic shutdown at loss thresholds
4. **Position Size Limits**: Maximum position size controls
5. **Drawdown Protection**: Auto-close on excessive drawdown
6. **Consecutive Loss Limits**: Pause trading after consecutive losses

### **Risk Management Settings**

```javascript
// Conservative Settings (Recommended)
Max Daily Loss: 3%
Max Position Size: 0.5 lots
Risk Per Trade: 1.5%
AI Confidence: 75%
Stop Loss: 50 pips
Take Profit: 100 pips

// Moderate Settings
Max Daily Loss: 5%
Max Position Size: 1.0 lots
Risk Per Trade: 2.0%
AI Confidence: 70%
Stop Loss: 40 pips
Take Profit: 80 pips
```

## **🚦 Step-by-Step Live Trading Process**

### **Phase 1: Demo Testing (MANDATORY)**

1. **Set Environment**: `OANDA_ENVIRONMENT=demo`
2. **Fund Demo Account**: Ensure demo account has sufficient balance
3. **Test All Features**: 
   - Initialize connection
   - Place test trades
   - Test emergency stop
   - Verify all safety features
4. **Run for 24-48 Hours**: Monitor performance and stability
5. **Analyze Results**: Review trades, performance, and any issues

### **Phase 2: Live Trading Preparation**

1. **Fund Live Account**: Deposit minimum $1000 (recommended)
2. **Update Environment**: `OANDA_ENVIRONMENT=live`
3. **Set Conservative Settings**: Use lower risk settings initially
4. **Final Testing**: Test connection with live account
5. **Prepare Monitoring**: Set up alerts and monitoring tools

### **Phase 3: Live Trading Execution**

1. **Initialize Bot**: Click "Initialize" in Live Trading Panel
2. **Review Warnings**: Read all safety warnings carefully
3. **Confirm Settings**: Verify all risk parameters
4. **Start Trading**: Click "Start Trading" and confirm warnings
5. **Monitor Closely**: Watch first few trades very carefully
6. **Stay Available**: Keep emergency stop accessible

## **📊 Monitoring Dashboard**

### **Live Trading Panel Features**

- **Environment Switch**: Toggle between demo/live
- **Connection Status**: Real-time connection monitoring
- **Trading Statistics**: Trades, P&L, consecutive losses
- **Emergency Controls**: Instant stop functionality
- **Trade Confirmations**: Manual approval for each trade
- **Risk Alerts**: Real-time risk notifications

### **Key Metrics to Monitor**

1. **Daily P&L**: Track daily profit/loss
2. **Win Rate**: Percentage of profitable trades
3. **Consecutive Losses**: Number of losses in a row
4. **Drawdown**: Maximum loss from peak
5. **Position Count**: Number of open positions
6. **Account Balance**: Real-time balance updates

## **⚠️ Emergency Procedures**

### **If Something Goes Wrong**

1. **Emergency Stop**: Click red "Emergency Stop" button
2. **Close Positions**: Manually close all open positions
3. **Disconnect**: Stop the bot and disconnect from API
4. **Review Logs**: Check all error messages and logs
5. **Contact Support**: Reach out to OANDA support if needed

### **Common Issues and Solutions**

| Issue | Solution |
|-------|----------|
| Connection Lost | Check internet, restart bot |
| API Rate Limit | Wait and retry, reduce frequency |
| Invalid Credentials | Verify API key and account ID |
| Insufficient Balance | Fund account or reduce position size |
| High Drawdown | Reduce risk settings, review strategy |

## **📈 Performance Optimization**

### **Recommended Schedule**

```javascript
// Daily Routine
- Check overnight positions
- Review daily P&L
- Adjust risk settings if needed
- Monitor news events

// Weekly Routine
- Analyze performance metrics
- Review and optimize AI settings
- Backup trading data
- Update risk parameters

// Monthly Routine
- Full performance review
- Strategy optimization
- Risk assessment
- Profit/loss analysis
```

## **🔐 Security Best Practices**

1. **API Key Security**: Never share or expose API keys
2. **Environment Variables**: Use secure environment storage
3. **Regular Updates**: Keep dependencies updated
4. **Backup Data**: Regular backups of trading data
5. **Monitor Access**: Watch for unauthorized access
6. **Secure Networks**: Use secure internet connections

## **📞 Support and Resources**

### **OANDA Resources**

- **API Documentation**: [OANDA API Docs](https://developer.oanda.com)
- **Support**: [OANDA Support](https://oanda.com/support)
- **Trading Platform**: [OANDA Trading Platform](https://trade.oanda.com)

### **Bot Support**

- **Dashboard**: Access live trading panel at `http://localhost:3001`
- **Logs**: Check browser console for detailed logs
- **Emergency**: Use emergency stop button in dashboard

## **⚖️ Legal and Compliance**

1. **Regulatory Compliance**: Ensure compliance with local regulations
2. **Tax Obligations**: Understand tax implications of trading
3. **Risk Disclosure**: Fully understand all risks involved
4. **Professional Advice**: Consider consulting financial professionals

---

## **✅ Final Checklist Before Going Live**

- [ ] OANDA account funded with appropriate amount
- [ ] API credentials configured and tested
- [ ] Demo trading completed successfully for 24+ hours
- [ ] All safety features tested and working
- [ ] Risk parameters set conservatively
- [ ] Emergency procedures understood
- [ ] Monitoring dashboard accessible
- [ ] Support resources bookmarked
- [ ] Risk disclosure read and understood
- [ ] Legal and tax implications considered

**Remember: Start small, monitor closely, and never risk more than you can afford to lose!**

---

*This bot is provided as-is for educational purposes. Use at your own risk.* 