# Demo Plant Diagnosis (Browser AI)

Browser-based plant disease diagnosis demo using a deep learning model exported to ONNX.

This project demonstrates **client-side inference in the browser** using a ResNet50 model,
without any backend server.

🔗 **Live Demo**  
https://vnltbb.github.io/demo-plantdiagnosis.github.io

---

## Overview

- Upload a plant leaf image in the browser
- Run inference **entirely on the client** using `onnxruntime-web`
- Classify into 3 classes:
  - **Healthy**
  - **PMMoV**
  - **Powdery mildew**
- Display class confidence scores
- Download result image with prediction overlay

> No server, no API calls, no image upload to external services.

---

## Model

- Architecture: **ResNet50**
- Framework: PyTorch → ONNX
- Input:
  - Size: `224 × 224`
  - Format: `RGB`
  - Normalization (ImageNet):
    - mean = `[0.485, 0.456, 0.406]`
    - std = `[0.229, 0.224, 0.225]`
- Output:
  - 3-class logits → softmax probabilities

The ONNX model is loaded directly in the browser from the `public/` directory.

---

## Tech Stack

- **Frontend**
  - React
  - TypeScript
  - Vite
  - Tailwind CSS (CDN)
- **Inference**
  - onnxruntime-web (WASM backend)
- **Deployment**
  - GitHub Pages (GitHub Actions)

---

## Project Structure

```text
demo-plantdiagnosis/
├─ public/
│  ├─ model.onnx
│  └─ model.onnx.data
├─ src/
│  ├─ services/
│  │  └─ inferenceService.ts
│  ├─ components/
│  └─ App.tsx
├─ index.html
├─ vite.config.ts
├─ package.json
├─ README.md
└─ .github/workflows/deploy.yml
```
---
## Local Development
```bash
npm install
npm run dev
```
then open the URL shown in the terminal
---
## Build & Preview
```bash
npm run build
npm run preview
```
---
## Deployment
this repository is deployed sutomatically via GitHub Actions to GitHub Pages.
- Trigger: push to `main`
- Output: `dist/`
- URL: https://vnltbb.github.io/demo-plantdiagnosis.github.io
---
## Notes
- the ONNX model file **must be included in the repository** (`public/model.onnx`)
- Large model files may require size optimization (e.g. FP16 or quantization).
- CAM visualization is planned for a future update.
