import React, { useState } from 'react'
import { useBotStore } from '../store/botStore'
import { Brain, Play, Pause, BarChart3, Settings, Download, Upload } from 'lucide-react'

const AIPanel: React.FC = () => {
  const { 
    isTraining, 
    trainingProgress, 
    modelAccuracy, 
    aiSignal,
    setTraining,
    setModelAccuracy
  } = useBotStore()

  const [trainingEpochs, setTrainingEpochs] = useState(150)
  const [learningRate, setLearningRate] = useState(0.008)

  const handleStartTraining = () => {
    setTraining(true, 0)
    
    // Simulate training progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 0.01
      setTraining(true, progress)
      
      if (progress >= 1) {
        clearInterval(interval)
        setTraining(false, 1)
        setModelAccuracy(0.78 + Math.random() * 0.15) // Random accuracy between 78-93%
      }
    }, 100)
  }

  const handleStopTraining = () => {
    setTraining(false, 0)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Training Control Panel */}
      <div className="trading-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Brain className="mr-2" size={20} />
          Neural Network Training
        </h2>
        
        <div className="space-y-4">
          {/* Training Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Training Status</span>
              <span className={`px-2 py-1 rounded text-xs ${
                isTraining ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {isTraining ? 'Training' : 'Ready'}
              </span>
            </div>
            
            {isTraining && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{(trainingProgress * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${trainingProgress * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Model Accuracy */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Model Accuracy</span>
              <span className={`text-lg font-bold ${
                modelAccuracy > 0.8 ? 'text-green-600' : 
                modelAccuracy > 0.65 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {(modelAccuracy * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  modelAccuracy > 0.8 ? 'bg-green-600' : 
                  modelAccuracy > 0.65 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${modelAccuracy * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Training Parameters */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Epochs
              </label>
              <input
                type="number"
                className="trading-input w-full"
                value={trainingEpochs}
                onChange={(e) => setTrainingEpochs(parseInt(e.target.value))}
                min="50"
                max="500"
                step="10"
                disabled={isTraining}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Rate
              </label>
              <input
                type="number"
                className="trading-input w-full"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                min="0.001"
                max="0.1"
                step="0.001"
                disabled={isTraining}
              />
            </div>
          </div>

          {/* Training Controls */}
          <div className="flex space-x-3">
            <button
              onClick={handleStartTraining}
              disabled={isTraining}
              className="trading-button trading-button-success flex items-center space-x-2 flex-1 justify-center disabled:opacity-50"
            >
              <Play size={16} />
              <span>Start Training</span>
            </button>
            
            <button
              onClick={handleStopTraining}
              disabled={!isTraining}
              className="trading-button trading-button-danger flex items-center space-x-2 flex-1 justify-center disabled:opacity-50"
            >
              <Pause size={16} />
              <span>Stop Training</span>
            </button>
          </div>

          {/* Model Management */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Model Management</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="trading-button trading-button-primary flex items-center space-x-2 justify-center">
                <Download size={16} />
                <span>Save Model</span>
              </button>
              <button className="trading-button trading-button-primary flex items-center space-x-2 justify-center">
                <Upload size={16} />
                <span>Load Model</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Signal Analysis */}
      <div className="trading-card">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-2" size={20} />
          AI Signal Analysis
        </h2>
        
        <div className="space-y-4">
          {/* Current Signal */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Current Signal</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                aiSignal?.signal === 'buy' ? 'bg-green-100 text-green-800' :
                aiSignal?.signal === 'sell' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {aiSignal?.signal.toUpperCase() || 'HOLD'}
              </span>
            </div>
            
            {aiSignal && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span className="font-semibold">{(aiSignal.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      aiSignal.confidence > 0.8 ? 'bg-green-600' : 
                      aiSignal.confidence > 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${aiSignal.confidence * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Prediction Score</span>
                  <span className={`font-semibold ${
                    aiSignal.prediction > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {aiSignal.prediction > 0 ? '+' : ''}{aiSignal.prediction.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Network Architecture */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Network Architecture</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Input Layer</span>
                <span className="font-semibold">20 features</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hidden Layer 1</span>
                <span className="font-semibold">64 neurons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hidden Layer 2</span>
                <span className="font-semibold">32 neurons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hidden Layer 3</span>
                <span className="font-semibold">16 neurons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Output Layer</span>
                <span className="font-semibold">3 classes</span>
              </div>
            </div>
          </div>

          {/* Training History */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Training History</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Last Training</span>
                <span className="font-semibold">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Training Sessions</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Best Accuracy</span>
                <span className="font-semibold text-green-600">87.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Epochs</span>
                <span className="font-semibold">1,800</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">AI Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">73.2%</div>
                <div className="text-xs text-gray-600">Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">0.89</div>
                <div className="text-xs text-gray-600">F1 Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">0.76</div>
                <div className="text-xs text-gray-600">Precision</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">0.82</div>
                <div className="text-xs text-gray-600">Recall</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIPanel 