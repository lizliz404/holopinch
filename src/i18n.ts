/**
 * Minimal two-locale i18n for HoloPinch.
 * - zh/ index.html ships lang="zh" → zh bundle is used.
 * - Root index.html ships lang="en" → en bundle is used.
 * - No runtime lang switch: button navigates to the other URL (SEO-safe).
 */

export type Lang = 'en' | 'zh';

const current: Lang = document.documentElement.lang === 'zh' ? 'zh' : 'en';

export function lang(): Lang {
  return current;
}

const en = {
  // ── HTML static ──
  tagline: 'Hold light between your hands. No app. Just a browser.',
  aboutWhat: 'Hold light between your fingers. A live hologram mesh — camera in the browser. No app, no account, no backend.',
  aboutPlay: 'The camera wakes on its own — pinch or spread one or both hands. Closer + flat → foil card. Farther + open → crystal bar. Best with two hands. No camera, or denied? The demo orbs on stage already respond; open controls for more.',
  aboutAngles: 'Angles stay off by default so the light stays primary. Open controls → Angles / Guess when you want the STEM layer.',
  aboutTech: 'MediaPipe HandLandmarker + WebGL + three.js. One flatness value drives opacity, edges, and foil.',
  aboutWhatH: 'What',
  aboutPlayH: 'Play',
  aboutAnglesH: 'Angles',
  aboutTechH: 'Tech',
  btnAboutClose: 'Close about',
  btnAboutTitle: 'About',
  btnCamQuickTitle: 'Start camera',
  btnCamCompactStop: 'Stop',
  btnCamCompactTitle: 'Stop camera',
  hudToggleLabel: 'Open controls',
  hudToggleTitle: 'Controls',
  chipDemo: 'Demo',
  chipAngles: 'Angles',
  chipEdges: 'Edges',
  chipGuess: 'Guess',
  chipShade: 'Shade',
  chipShadeTitle: 'Cycle shade: hybrid → holo → normal',
  btnCamPrimary: 'Camera',
  guessLabel: 'Guess angle (°)',
  btnReveal: 'Reveal',
  guessPlaceholder: '°',
  btnLangLabel: '中',
  btnLangTitle: '中文',
  btnLangAria: 'Switch to Chinese',
  chipsModes: 'Modes',
  webglFallback: '<strong>WebGL is unavailable</strong> in this browser — HoloPinch needs it to render the hologram. Try a current Chrome/Safari.',

  // ── TS dynamic ──
  demoFull: 'Demo — drag orbs · two-finger vertical = open · horizontal = spread',
  demoFullDesktop: 'Demo — drag orbs · scroll = open · Shift+scroll = spread',
  demoShort: 'Demo',
  startFull: 'Drag the light — camera wakes on its own',
  startShort: 'Camera…',
  loadingWasm: 'Loading hand model (WASM)…',
  loadingModel: 'Loading hand model (model)…',
  loadingInit: 'Loading hand model…',
  loadingGeneric: 'Loading hand model…',
  requestingCamera: 'Requesting camera…',
  statusShowHand: 'Show your hand — pinch or spread fingers',
  statusSpread: 'Spread fingers in frame',
  statusTracking: 'Tracking — mesh follows your fingers',
  statusFading: 'Hands lost — fading…',
  statusHolding: 'Hands lost — holding pose…',
  statusShareHint: 'Screenshot it — tag #HoloPinch',
  statusCamBlocked: 'Camera blocked — allow permission, or drag Demo orbs',
  statusNoCam: 'No camera found — drag Demo orbs instead',
  statusCamBusy: 'Camera in use elsewhere — close other apps, or use Demo',
  statusCamFail: 'Camera failed — drag Demo orbs; use controls to retry',
  statusModelFail: 'Hand model failed — Demo still works; tap Retry camera',
  btnStopCam: 'Stop camera',
  btnRetryCam: 'Retry camera',
  ariaStopCam: 'Stop camera',
  ariaStartCam: 'Camera',
  shadeHybrid: 'Shade · hybrid',
  shadeHolo: 'Shade · holo',
  shadeNormal: 'Shade · normal',
  guessNoAngle: 'No angle yet — show a hand first',
  anglesWaiting: 'Waiting for hand…',
  anglesHidden: 'Angles hidden — guess, then Reveal',
  motionHoldLight: 'hold light',
  demoLeftHand: 'Left hand',
  demoRightHand: 'Right hand',
  // shorten map values
  shortWasm: 'WASM…',
  shortModel: 'Model…',
  shortLoading: 'Loading…',
  shortCamera: 'Camera…',
  shortShowHand: 'Show hand',
  shortSpread: 'Spread…',
  shortTracking: 'Tracking',
  shortSnapIt: 'Snap it',
  shortFading: 'Fading…',
  shortHolding: 'Holding…',
  shortModelFail: 'Model fail',
  shortBlocked: 'Blocked',
  shortNoCam: 'No cam',
  shortCamBusy: 'Cam busy',
  shortCamFail: 'Cam fail',
} as const;

const zh: Record<keyof typeof en, string> = {
  tagline: '双手之间，光即成物。无需 App，浏览器直达。',
  aboutWhat: '把光握在指尖之间。实时全息网格 —— 摄像头在浏览器内运行。无需 App，无需注册，无后端。',
  aboutPlay: '摄像头自动唤醒 —— 捏合或张开单手或双手。近 + 平 → 箔卡片。远 + 开 → 水晶柱。双手效果最佳。没有摄像头或被拒绝？舞台上的演示球已经响应；打开控制面板可探索更多。',
  aboutAngles: '角度默认关闭，让光保持主角地位。想看 STEM 图层时，打开控制面板 → Angles / Guess。',
  aboutTech: 'MediaPipe HandLandmarker + WebGL + three.js。一个 flatness 值驱动透明度、边缘和箔面效果。',
  aboutWhatH: '是什么',
  aboutPlayH: '怎么玩',
  aboutAnglesH: '角度',
  aboutTechH: '技术',
  btnAboutClose: '关闭关于',
  btnAboutTitle: '关于',
  btnCamQuickTitle: '启动摄像头',
  btnCamCompactStop: '停止',
  btnCamCompactTitle: '停止摄像头',
  hudToggleLabel: '打开控制面板',
  hudToggleTitle: '控制面板',
  chipDemo: '演示',
  chipAngles: '角度',
  chipEdges: '线框',
  chipGuess: '猜角度',
  chipShade: '着色',
  chipShadeTitle: '循环着色模式：混合 → 全息 → 普通',
  btnCamPrimary: '摄像头',
  guessLabel: '猜角度 (°)',
  btnReveal: '揭晓',
  guessPlaceholder: '°',
  btnLangLabel: 'EN',
  btnLangTitle: 'English',
  btnLangAria: '切换到英文',
  chipsModes: '模式',
  webglFallback: '<strong>WebGL 不可用</strong> —— HoloPinch 需要 WebGL 来渲染全息效果。请使用较新的 Chrome/Safari。',
  demoFull: '演示 —— 拖动光球 · 双指垂直 = 开合 · 水平 = 张合',
  demoFullDesktop: '演示 —— 拖动光球 · 滚轮 = 开合 · Shift+滚轮 = 张合',
  demoShort: '演示',
  startFull: '拖动光 —— 摄像头自动唤醒',
  startShort: '摄像头…',
  loadingWasm: '加载手部模型 (WASM)…',
  loadingModel: '加载手部模型 (模型)…',
  loadingInit: '加载手部模型…',
  loadingGeneric: '加载手部模型…',
  requestingCamera: '请求摄像头…',
  statusShowHand: '伸出手 —— 捏合或张开手指',
  statusSpread: '在画面中张开手指',
  statusTracking: '追踪中 —— 网格跟随手指',
  statusFading: '手丢失 —— 淡出…',
  statusHolding: '手丢失 —— 保持姿势…',
  statusShareHint: '截图分享 —— 标记 #HoloPinch',
  statusCamBlocked: '摄像头被阻止 —— 请允许权限，或拖动演示球',
  statusNoCam: '未找到摄像头 —— 请拖动演示球',
  statusCamBusy: '摄像头被占用 —— 关闭其他应用，或使用演示模式',
  statusCamFail: '摄像头失败 —— 拖动演示球；用控制面板重试',
  statusModelFail: '手部模型加载失败 —— 演示模式仍可用；点击重试摄像头',
  btnStopCam: '停止摄像头',
  btnRetryCam: '重试摄像头',
  ariaStopCam: '停止摄像头',
  ariaStartCam: '摄像头',
  shadeHybrid: '着色 · 混合',
  shadeHolo: '着色 · 全息',
  shadeNormal: '着色 · 普通',
  guessNoAngle: '还没有角度 —— 先伸出手',
  anglesWaiting: '等待手部…',
  anglesHidden: '角度已隐藏 —— 先猜，再揭晓',
  motionHoldLight: 'hold light',
  demoLeftHand: '左手',
  demoRightHand: '右手',
  shortWasm: 'WASM…',
  shortModel: '模型…',
  shortLoading: '加载…',
  shortCamera: '摄像头…',
  shortShowHand: '伸出手',
  shortSpread: '张开…',
  shortTracking: '追踪中',
  shortSnapIt: '截图吧',
  shortFading: '淡出…',
  shortHolding: '保持…',
  shortModelFail: '模型失败',
  shortBlocked: '已阻止',
  shortNoCam: '无摄像头',
  shortCamBusy: '被占用',
  shortCamFail: '失败',
};

const dict: Record<Lang, Record<keyof typeof en, string>> = { en, zh };

export function t(key: keyof typeof en): string {
  return dict[current][key];
}

/** Apply data-i18n / data-i18n-title / data-i18n-aria / data-i18n-placeholder to DOM. */
export function applyDom(): void {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as keyof typeof en;
    if (key && dict[current][key] != null) el.textContent = dict[current][key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml as keyof typeof en;
    if (key && dict[current][key] != null) el.innerHTML = dict[current][key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => {
    const key = el.dataset.i18nTitle as keyof typeof en;
    if (key && dict[current][key] != null) el.title = dict[current][key];
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.dataset.i18nAria as keyof typeof en;
    if (key && dict[current][key] != null) el.setAttribute('aria-label', dict[current][key]);
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder as keyof typeof en;
    if (key && dict[current][key] != null) el.placeholder = dict[current][key];
  });
}
