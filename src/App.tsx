// src/App.tsx

import React, { useState, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ResultsView from './components/ResultsView';
import { runOnnxInference, fileToBase64 } from './services/inferenceService';
import type { PredictionResult } from './types';
import { BeakerIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setErrorMessage(null);

    const base64 = await fileToBase64(file);
    setImagePreview(base64);

    startInference(file);
  };

  const startInference = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const prediction = await runOnnxInference(file);
      setResult(prediction);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Inference failed', error);
      setErrorMessage(error?.message ?? "Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // CAM 제거: 항상 원본(업로드) 이미지를 기반으로 텍스트 오버레이 후 저장
  const handleDownloadResult = async () => {
    if (!result || !imagePreview) return;

    const img = new Image();
    img.src = imagePreview;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height + 60; // 아래 텍스트 영역 60px

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 배경 흰색
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 원본 이미지
      ctx.drawImage(img, 0, 0);

      // 하단 박스
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, img.height, canvas.width, 60);

      // 텍스트 (클래스 + confidence)
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = `bold ${Math.max(16, img.width * 0.04)}px sans-serif`;

      const text = `${result.topClass} (${(result.confidences[0].confidence * 100).toFixed(2)}%)`;
      ctx.fillText(text, 20, img.height + 30);

      // 워터마크
      ctx.textAlign = 'right';
      ctx.fillStyle = '#10b981';
      ctx.fillText('PlantVision AI', canvas.width - 20, img.height + 30);

      const link = document.createElement('a');
      link.download = `analysis_${result.topClass}_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    };
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 group cursor-pointer hover:opacity-80 transition-opacity">
            <div className="bg-emerald-600 p-1.5 rounded-lg group-hover:bg-emerald-700 transition-colors">
              <BeakerIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              PlantVision <span className="text-emerald-600">AI</span>
            </h1>
          </div>
          <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
            Model: ResNet50 (ONNX · Browser)
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intro Section */}
        {!selectedFile && (
          <div className="text-center py-12 space-y-4">
            <h2 className="text-4xl font-extrabold text-slate-900">Plant Disease Detection</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload a leaf image to detect pathogens using our trained <strong>ResNet50</strong> model.
              Classifies between{' '}
              <span className="text-emerald-700 font-medium">Healthy</span>,{' '}
              <span className="text-red-600 font-medium">PMMoV</span>, and{' '}
              <span className="text-yellow-600 font-medium">Powdery Mildew</span>.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!selectedFile ? (
          <FileUpload onFileSelect={handleFileSelect} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Image & status */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-100">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Plant"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-medium text-slate-500 truncate max-w-[150px]">
                      {selectedFile?.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              {isProcessing && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium text-emerald-800">Processing Image...</span>
                </div>
              )}

              {errorMessage && (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Right Column: Results & Report */}
            <div className="md:col-span-2 space-y-6" ref={resultsRef}>
              {result ? (
                <>
                  <ResultsView result={result} onReset={handleReset} onDownload={handleDownloadResult} />
                </>
              ) : !errorMessage && (
                <div className="bg-white rounded-2xl h-64 w-full shadow-sm border border-slate-200 animate-pulse p-6 space-y-4">
                  <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-20 bg-slate-100 rounded w-full"></div>
                  <div className="h-20 bg-slate-100 rounded w-full"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
