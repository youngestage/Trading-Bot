// Trading Types for EUR/USD Bot
export interface EURUSDStrategy {
  pair: 'EUR/USD';
  timeframe: '1min' | '5min' | '15min' | '1hour';
  indicators: {
    rsi: { 
      period: number; 
      oversold: number; 
      overbought: number; 
    };
    sma: { 
      short: number; 
      long: number; 
    };
    macd: { 
      fast: number; 
      slow: number; 
      signal: number; 
    };
    bb: { 
      period: number; 
      deviation: number; 
    };
  };
  risk: {
    stopLoss: number; // pips
    takeProfit: number; // pips
    positionSize: number; // lots
    maxRisk: number; // percent
  };
  ai: {
    neuralNetwork: boolean;
    learningRate: number;
    epochs: number;
    confidence: number;
  };
}

export interface Trade {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  size: number;
  openPrice: number;
  closePrice?: number;
  stopLoss: number;
  takeProfit: number;
  openTime: string;
  closeTime?: string;
  status: 'open' | 'closed' | 'cancelled';
  pnl?: number;
  confidence: number;
  strategy: string;
}

export interface Position {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  size: number;
  openPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  stopLoss: number;
  takeProfit: number;
  openTime: string;
}

export interface MarketData {
  pair: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  sma20: number;
  sma50: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
}

export interface AISignal {
  pair: string;
  timestamp: string;
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  prediction: number;
  features: number[];
}

export interface BotConfig {
  isActive: boolean;
  strategy: EURUSDStrategy;
  maxConcurrentTrades: number;
  dailyRiskLimit: number;
  accountBalance: number;
  demoMode: boolean;
}

export interface Performance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
}

export interface OandaConfig {
  apiKey: string;
  accountId: string;
  environment: 'demo' | 'live';
  baseUrl: string;
}

export interface NeuralNetworkWeights {
  id: string;
  weights: number[][];
  biases: number[];
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  lastTrained: string;
  performance: number;
}

export interface AlertConfig {
  priceAlerts: boolean;
  tradeExecutions: boolean;
  profitTargets: boolean;
  riskLimits: boolean;
  systemErrors: boolean;
} 