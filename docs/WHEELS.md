# HoloPinch — 外部轮子与采用边界

> 日期：2026-07-28  
> 目的：固化一次市场/源码侦察，避免重复造轮、也避免抄错 demo。

## 一句话

**没有**现成 repo 能整包替换 “双手 tip loft + flatness continuum”。  
**有**成熟轮子解决：主线程阻塞推理、landmark 抖动、每帧重建 BufferGeometry。

---

## 不要抄（假轮子）

这些 MediaPipe + Three.js 项目本质是 **landmarks → scale/rotate/color**：

- monish4030/NEURAL-HAND、gust10/Handible、amerob/gesture-3d-studio  
- collidingScopes/threejs-handtracking-101、各种 particle/orb control  

它们是手势遥控器，不是手势造体。抄了会丢掉 HoloPinch 护城河，变成 cyberpunk HUD 玩具。

---

## 要借（真轮子 / 官方实践）

### 1. MediaPipe 推理：Web Worker + backpressure — **采用**

| 来源 | 要点 |
|---|---|
| [Google Hand Landmarker Web](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js) | `detectForVideo` **同步阻塞 UI**；相机场景应放 Worker |
| [google-ai-edge/mediapipe-samples-web](https://github.com/google-ai-edge/mediapipe-samples-web) | 官方 worker：`ImageBitmap` in → landmarks out |
| [damiansire/web-ar-hand-tracking](https://github.com/damiansire/web-ar-hand-tracking) | 单帧 in-flight backpressure；纯 domain + Vitest |

**借 pipeline 形态，不借他们的 3D 内容。**

### 2. 抖动：`1eurofilter`（Casiez）— **采用**

- npm：[`1eurofilter`](https://www.npmjs.com/package/1eurofilter)  
- 论文/主页：https://gery.casiez.net/1euro/  
- 替换固定 EMA `smoothAlpha=0.38`：静止去抖、快速跟手。

### 3. 动态 mesh：Three 官方 buffer 更新 — **采用模式，不换库**

- [How to update Things](https://threejs.org/manual/en/how-to-update-things.html)  
- 预分配 → 写 buffer → `needsUpdate` → `setDrawRange`  
- **禁止**每帧 `dispose` + `new BufferGeometry` + `new EdgesGeometry`  
- `EdgesGeometry` 动态重建贵：手搓 perimeter / loft 边线

Tube / Extrude / `three.path` **不对齐** dual-ring loft 语义 → 不替换主几何。

### 4. `@svenflow/micro-handpose` — **暂缓**

WebGPU、更快、21-point 兼容；但新、覆盖面窄。  
先 Worker 化 MediaPipe；真机仍不够再 adapter。

---

## 明确不引入

- Handible / manitas / 手势 event 库  
- React / R3F  
- WebAR.rocks、XR Blocks、handy-work（产品路径不同）  
- 用 Tube/Extrude 当主 continuum mesh  

---

## 分层地图

```
camera
  → [借] Worker + ImageBitmap + backpressure
  → [借] 1€ filter on tips/corners
  → [留] resolveAnchors / flatness continuum
  → [留] dual-ring loft 语义
  → [借] prealloc BufferGeometry + drawRange
  → [弃] 每帧 EdgesGeometry
  → [留] hybrid/holo shader
```

## 落地顺序

1. MediaPipe → Worker  
2. `1eurofilter` 替换 EMA  
3. 预分配 loft buffer + 手搓线框  
4. 真机仍 jank → 评估 micro-handpose  

**Owner：** Hermes 执行工程；Liz 真机验收。  
**Kill：** Worker 路径在目标浏览器失败 → 保留 main-thread fallback。
