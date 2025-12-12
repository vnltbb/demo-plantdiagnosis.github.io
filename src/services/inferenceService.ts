// src/services/inferenceService.ts
// Browser ONNX inference only (no CAM, no Gemini)
//
// Training preprocessing matched:
// - Resize(224,224)
// - ToTensor
// - Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]) :contentReference[oaicite:1]{index=1}

import type { PredictionResult } from '../types';

const IMAGE_SIZE = 224;
const CLASS_NAMES = ['Healthy', 'PMMoV', 'Powdery mildew'] as const;

// ---- Global ORT loader ----
function getOrt(): any {
  const ort = (window as any).ort;
  if (!ort) {
    throw new Error(
      "ONNX Runtime Web (window.ort)가 없습니다. index.html에 ort.min.js 스크립트가 로드되어야 합니다."
    );
  }
  return ort;
}

// ---- Model URL (GitHub Pages 대응) ----
// - dev: BASE_URL="/"
// - gh-pages: BASE_URL="/<repo>/"
function getModelUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}model.onnx`;
}

// ---- session cache (매번 만들면 느림 + 불안정) ----
let sessionPromise: Promise<any> | null = null;

async function getSession(): Promise<any> {
  if (!sessionPromise) {
    const ort = getOrt();
    const modelUrl = getModelUrl();

    sessionPromise = (async () => {
      try {
        // EP는 ort가 알아서 고르지만, wasm이 기본이라 명시해도 됨
        const sess = await ort.InferenceSession.create(modelUrl, {
          executionProviders: ['wasm'],
        });

        // 디버깅용: 실제 IO 이름 확인
        console.log('[ORT] modelUrl:', modelUrl);
        console.log('[ORT] inputNames:', sess.inputNames);
        console.log('[ORT] outputNames:', sess.outputNames);

        return sess;
      } catch (e: any) {
        // 다음 시도 때 다시 만들 수 있도록 초기화
        sessionPromise = null;
        throw new Error(`[ORT] Failed to create session: ${e?.message ?? String(e)}`);
      }
    })();
  }
  return sessionPromise;
}

// ---- preview helper ----
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Failed to convert file to base64.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error.'));
    reader.readAsDataURL(file);
  });
}

// ---- File -> NCHW Float32Array (ImageNet Normalize) ----
async function fileToTensor(file: File): Promise<Float32Array> {
  const url = URL.createObjectURL(file);

  const img = new Image();
  img.src = url;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_SIZE;
  canvas.height = IMAGE_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    throw new Error('Canvas 2D context is not available');
  }

  ctx.drawImage(img, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
  const { data } = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE); // RGBA

  const out = new Float32Array(1 * 3 * IMAGE_SIZE * IMAGE_SIZE);
  const area = IMAGE_SIZE * IMAGE_SIZE;

  // 학습 코드의 transform_config와 동일 :contentReference[oaicite:2]{index=2}
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      const rgbaIdx = (y * IMAGE_SIZE + x) * 4;
      const r = data[rgbaIdx] / 255;
      const g = data[rgbaIdx + 1] / 255;
      const b = data[rgbaIdx + 2] / 255;

      const i = y * IMAGE_SIZE + x;
      out[0 * area + i] = (r - mean[0]) / std[0];
      out[1 * area + i] = (g - mean[1]) / std[1];
      out[2 * area + i] = (b - mean[2]) / std[2];
    }
  }

  URL.revokeObjectURL(url);
  return out;
}

// ---- softmax ----
function softmax(logits: Float32Array): number[] {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) max = Math.max(max, logits[i]);

  const exps = new Array<number>(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    const v = Math.exp(logits[i] - max);
    exps[i] = v;
    sum += v;
  }
  for (let i = 0; i < exps.length; i++) exps[i] /= sum;

  return exps;
}

// ---- main inference ----
export async function runOnnxInference(file: File): Promise<PredictionResult> {
  const ort = getOrt();
  const session = await getSession();

  const t0 = performance.now();

  try {
    const inputData = await fileToTensor(file);
    const inputTensor = new ort.Tensor('float32', inputData, [1, 3, IMAGE_SIZE, IMAGE_SIZE]);

    // ✅ 실제 모델 input 이름 자동 사용 (이게 안 맞으면 무조건 실패함)
    const inputName: string = session.inputNames?.[0] ?? 'input';
    const outputName: string | undefined = session.outputNames?.[0];

    const feeds: Record<string, any> = { [inputName]: inputTensor };

    const outputs = await session.run(feeds);

    // ✅ outputName이 있으면 그걸로, 아니면 첫 output 사용
    const outTensor = (outputName && outputs[outputName]) ? outputs[outputName] : Object.values(outputs)[0];
    if (!outTensor?.data) {
      throw new Error(`[ORT] Output tensor is empty. outputName=${outputName ?? '(unknown)'}`);
    }

    const logits = outTensor.data as Float32Array;

    const probs = softmax(logits);
    const confidences = probs.map((p, idx) => ({
      className: CLASS_NAMES[idx] as string,
      confidence: p,
    }));
    confidences.sort((a, b) => b.confidence - a.confidence);

    const t1 = performance.now();

    return {
      topClass: confidences[0].className,
      confidences,
      processingTimeMs: t1 - t0,
      // CAM 제거했으니 heatmapImage 넣지 않음
    };
  } catch (e: any) {
    // App에서 그대로 표시할 수 있게 메시지를 최대한 살려서 throw
    throw new Error(e?.message ?? String(e));
  }
}
