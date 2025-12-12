// src/types.ts

export interface ClassConfidence {
  className: string;
  confidence: number; // 0~1
}

export interface PredictionResult {
  topClass: string;                  // 예측된 최상위 클래스 이름
  confidences: ClassConfidence[];    // 각 클래스별 confidence
  processingTimeMs: number;          // 추론에 걸린 시간 (ms)
  heatmapImage?: string;             // Grad-CAM overlay 이미지 (data URL, e.g. "data:image/png;base64,...")
}
