import React from 'react';
import type { PredictionResult } from '../types';
import { CLASS_COLORS } from '../constants.ts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ResultsViewProps {
  result: PredictionResult;
  onReset: () => void;
  onDownload: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset, onDownload }) => {
  const chartData = result.confidences.map(c => ({
    name: c.className,
    value: c.confidence
  }));

  const getColor = (name: string) => {
    if (name === 'Healthy') return '#22c55e';
    if (name === 'PMMoV') return '#ef4444';
    if (name === 'Powdery mildew') return '#eab308';
    return '#3b82f6';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
          <div className="flex items-center space-x-3">
             <button 
               onClick={onDownload}
               className="flex items-center space-x-1 text-xs font-medium bg-white border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
               title="Download image with analysis data"
             >
               <ArrowDownTrayIcon className="w-4 h-4" />
               <span>Save Image</span>
             </button>
             <span className="text-xs font-mono text-slate-400">Inference: {Math.round(result.processingTimeMs)}ms</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Col: Top Prediction & List */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Primary Diagnosis</h3>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-12 rounded-full ${CLASS_COLORS[result.topClass] || 'bg-slate-400'}`}></div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">{result.topClass}</p>
                  <p className="text-slate-500">
                    Confidence: <span className="font-semibold text-emerald-600">
                      {(result.confidences[0].confidence * 100).toFixed(2)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold">Detailed Breakdown</h3>
              {result.confidences.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.className}</span>
                    <span className="text-slate-500">{(item.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${CLASS_COLORS[item.className] || 'bg-blue-500'}`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: Visualization */}
          <div className="flex flex-col items-center justify-center min-h-[250px] bg-slate-50 rounded-xl p-4 relative">
              <h3 className="absolute top-4 left-4 text-sm uppercase tracking-wider text-slate-500 font-semibold">Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center pt-2">
                    <span className="block text-2xl font-bold text-slate-700">{(result.confidences[0].confidence * 100).toFixed(0)}%</span>
                    <span className="text-xs text-slate-400">Confidence</span>
                  </div>
              </div>
          </div>

        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
      >
        <ArrowPathIcon className="w-5 h-5" />
        <span>Analyze Another Image</span>
      </button>
    </div>
  );
};

export default ResultsView;