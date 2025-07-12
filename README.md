# 🤖 EUR/USD AI Trading Bot

A sophisticated AI-powered trading bot specifically designed for EUR/USD currency pair trading. This bot combines advanced neural networks with technical analysis to make automated trading decisions.

## 🚀 Features

### Core Trading Capabilities
- **AI-Powered Decision Making**: Neural network with 150+ epoch training
- **Technical Analysis**: RSI, MACD, Moving Averages, Bollinger Bands
- **Real-time Execution**: Live trading through OANDA API
- **Risk Management**: Advanced position sizing and stop-loss management
- **Multi-timeframe Analysis**: 1-minute to 1-hour data combination

### AI/ML Features
- **Persistent Learning**: AI learns from every trade outcome
- **Confidence Scoring**: Only executes trades with 70%+ confidence
- **Real-time Signals**: Continuous market analysis every 45 seconds
- **Model Management**: Save/load trained models
- **Performance Tracking**: Detailed AI performance metrics

### Risk Management
- **Position Sizing**: Automatic lot size calculation
- **Stop Loss/Take Profit**: Optimized for EUR/USD volatility
- **Daily Risk Limits**: Maximum 5% account risk per day
- **Concurrent Trade Limits**: Maximum 3 EUR/USD positions
- **Drawdown Protection**: Automatic trading halt at loss thresholds

### User Interface
- **Live Dashboard**: Real-time EUR/USD charts and metrics
- **Trading Panel**: Manual trade execution and controls
- **AI Training Interface**: Neural network training and monitoring
- **Performance Analytics**: Comprehensive trading statistics
- **Risk Monitoring**: Real-time risk assessment and alerts

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Zustand** for state management
- **React Query** for data fetching

### Backend & AI
- **Node.js** with TypeScript
- **TensorFlow.js** for neural networks
- **Supabase** for database and real-time features
- **OANDA API** for live trading
- **Twelve Data API** for market data

### Trading Infrastructure
- **OANDA v20 API** for EUR/USD trading
- **WebSocket** for real-time updates
- **PostgreSQL** for data storage
- **Redis** for caching (optional)

## 📊 Performance Targets

- **Win Rate**: 65-75%
- **Average Profit**: 15-25 pips per trade
- **Maximum Drawdown**: <5%
- **Sharpe Ratio**: >1.5
- **Monthly Return**: 10-20%

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd eur-usd-trading-bot

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# Required: OANDA_API_KEY, OANDA_ACCOUNT_ID
```

### 3. Database Setup (Optional)

```bash
# Initialize Supabase (if using)
npx supabase init
npx supabase start
npx supabase db push
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# Open browser to http://localhost:3000
```

## 🔧 Configuration

### OANDA API Setup

1. Create a demo account at [OANDA](https://fxtrade.oanda.com/)
2. Generate API key and account ID
3. Add credentials to `.env.local`

### Trading Configuration

```typescript
// Default EUR/USD settings
const config = {
  pair: 'EUR/USD',
  timeframe: '5min',
  stopLoss: 50,        // pips
  takeProfit: 100,     // pips
  positionSize: 0.5,   // lots
  maxRisk: 2,          // percent
  aiConfidence: 0.7    // minimum confidence
}
```

### AI Model Configuration

```typescript
// Neural network parameters
const aiConfig = {
  learningRate: 0.008,
  epochs: 150,
  inputFeatures: 20,
  hiddenLayers: [64, 32, 16],
  outputClasses: 3  // buy, sell, hold
}
```

## 📈 Trading Strategy

### Technical Analysis Indicators
- **RSI (14)**: Oversold < 30, Overbought > 70
- **SMA (20/50)**: Trend identification
- **MACD (12, 26, 9)**: Momentum analysis
- **Bollinger Bands (20, 2)**: Volatility assessment

### AI Signal Generation
1. Extract 20 features from market data
2. Process through neural network
3. Generate buy/sell/hold probability
4. Combine with technical analysis
5. Execute if confidence > 70%

### Risk Management Rules
- Maximum 2% risk per trade
- 50-pip stop loss, 100-pip take profit
- Maximum 3 concurrent positions
- Daily loss limit: 5% of account

## 🔍 Monitoring & Analytics

### Real-time Metrics
- Live EUR/USD price updates
- AI signal confidence
- Open positions P&L
- Risk utilization
- Performance statistics

### Historical Analysis
- Trade history and outcomes
- AI model accuracy over time
- Risk-adjusted returns
- Drawdown analysis

## 🛡️ Security & Risk

### Trading Risks
- **Always start with demo account**
- **Never risk more than you can afford to lose**
- **Monitor the bot continuously**
- **Have stop-loss mechanisms in place**

### Technical Security
- API keys stored in environment variables
- No sensitive data in code repository
- Input validation on all trading parameters
- Error handling and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This trading bot is for educational and research purposes. Trading foreign exchange carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results. Always trade responsibly and never risk more than you can afford to lose.

## 🎯 Roadmap

- [ ] Integration with additional brokers
- [ ] Advanced AI models (LSTM, Transformer)
- [ ] Multi-currency pair support
- [ ] Mobile app development
- [ ] Advanced backtesting framework
- [ ] Social trading features

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for EUR/USD trading enthusiasts**