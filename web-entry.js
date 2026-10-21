/* Browser adapter: the actual game is still js/main.js and its original modules. */
(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const logicalWidth = 960;
  const logicalHeight = 540;
  // GitHub Pages serves project sites from a repository sub-path. Resolve
  // assets from this adapter's directory instead of relying on the current
  // document URL, and retry common folder-name variants used by uploads.
  // Keep this adapter compatible with classic-script parsers used by some
  // game-dev tools. The page URL already points at this adapter's directory.
  const assetBase = new URL('./', document.baseURI || window.location.href);
  const assetRoots = {
    images: ['images/', 'Images/', '图片/'],
    audio: ['audio/', 'Audio/', '音频/'],
  };

  function assetCandidates(value) {
    if (typeof value !== 'string') return [value];
    const match = value.match(/^(?:\.\/)?(images|audio)\/(.+)$/i);
    if (!match) return [value];
    const kind = match[1].toLowerCase();
    const relativeName = match[2];
    return assetRoots[kind].map((root) => new URL(root + relativeName, assetBase).href);
  }

  function createAssetImage() {
    const image = new Image();
    const nativeSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    let candidates = [];
    let candidateIndex = 0;

    image.addEventListener('error', () => {
      if (candidateIndex < candidates.length) {
        nativeSrc.set.call(image, candidates[candidateIndex++]);
      }
    });

    Object.defineProperty(image, 'src', {
      configurable: true,
      get: () => nativeSrc.get.call(image),
      set: (value) => {
        candidates = assetCandidates(value);
        candidateIndex = 0;
        if (candidates.length) nativeSrc.set.call(image, candidates[candidateIndex++]);
      },
    });
    return image;
  }
  const touchListeners = { start: [], move: [], end: [], cancel: [] };
  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  let nextGameFrameAt = 0;

  // The original mini-game advances state once per frame at 60 FPS. Browsers
  // on 90/120 Hz screens would otherwise run the same logic too quickly.
  window.requestAnimationFrame = (callback) => nativeRequestAnimationFrame((timestamp) => {
    if (timestamp < nextGameFrameAt) {
      window.requestAnimationFrame(callback);
      return;
    }
    nextGameFrameAt = timestamp + (1000 / 60);
    callback(timestamp);
  });
  const hint = document.querySelector('.site-hint');

  function showBootError(message) {
    if (hint) hint.textContent = `网页初始化失败：${message}`;
  }
  window.addEventListener('error', (event) => showBootError(event.error && event.error.message ? event.error.message : event.message));
  window.addEventListener('unhandledrejection', (event) => showBootError(event.reason && event.reason.message ? event.reason.message : event.reason));

  window.GameGlobal = window;
  window.canvas = canvas;

  function toLogicalPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: (clientX - rect.left) * logicalWidth / rect.width,
      clientY: (clientY - rect.top) * logicalHeight / rect.height,
    };
  }

  function notify(type, event) {
    const sourceTouches = event.touches && event.touches.length
      ? Array.from(event.touches)
      : [{ clientX: event.clientX, clientY: event.clientY }];
    const touches = sourceTouches.map((touch) => toLogicalPoint(touch.clientX, touch.clientY));
    touchListeners[type].slice().forEach((listener) => listener({ touches }));
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
    notify('start', event);
  }, { passive: false });
  canvas.addEventListener('pointermove', (event) => {
    if (event.buttons) { event.preventDefault(); notify('move', event); }
  }, { passive: false });
  canvas.addEventListener('pointerup', (event) => { event.preventDefault(); notify('end', event); }, { passive: false });
  canvas.addEventListener('pointercancel', (event) => { event.preventDefault(); notify('cancel', event); }, { passive: false });

  class BrowserAudioContext {
    constructor() { this.audio = new Audio(); }
    set src(value) { this.audio.src = assetCandidates(value)[0]; }
    get src() { return this.audio.src; }
    set loop(value) { this.audio.loop = value; }
    get loop() { return this.audio.loop; }
    set volume(value) { this.audio.volume = value; }
    get volume() { return this.audio.volume; }
    set currentTime(value) { this.audio.currentTime = value; }
    get currentTime() { return this.audio.currentTime; }
    play() { const promise = this.audio.play(); if (promise && promise.catch) promise.catch(() => {}); }
    pause() { this.audio.pause(); }
  }

  window.wx = {
    createCanvas: () => canvas,
    createImage: () => createAssetImage(),
    createInnerAudioContext: () => new BrowserAudioContext(),
    getWindowInfo: () => ({ screenWidth: logicalWidth, screenHeight: logicalHeight }),
    getSystemInfoSync: () => ({ screenWidth: logicalWidth, screenHeight: logicalHeight }),
    onTouchStart: (listener) => touchListeners.start.push(listener),
    onTouchMove: (listener) => touchListeners.move.push(listener),
    onTouchEnd: (listener) => touchListeners.end.push(listener),
    onTouchCancel: (listener) => touchListeners.cancel.push(listener),
    vibrateShort: () => {},
  };

  function sendKeyboardTouch(x, y, type) {
    const point = { touches: [{ clientX: x, clientY: y }] };
    touchListeners[type].slice().forEach((listener) => listener(point));
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (!['a', 'd', 'arrowleft', 'arrowright', 'q', 'e', 'p', 'escape'].includes(key)) return;
    event.preventDefault();
    if (key === 'a' || key === 'arrowleft') sendKeyboardTouch(logicalWidth * .2, logicalHeight * .5, 'start');
    if (key === 'd' || key === 'arrowright') sendKeyboardTouch(logicalWidth * .8, logicalHeight * .5, 'start');
    if (key === 'q') sendKeyboardTouch(75, logicalHeight - 28, 'start');
    if (key === 'e') sendKeyboardTouch(logicalWidth - 75, logicalHeight - 28, 'start');
    if (key === 'p' || key === 'escape') sendKeyboardTouch(logicalWidth - 35, 29, 'start');
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (['a', 'd', 'arrowleft', 'arrowright'].includes(key)) sendKeyboardTouch(logicalWidth / 2, logicalHeight / 2, 'end');
  });

  import('./game.js').then(() => {
    document.body.dataset.gameLoaded = 'true';
  }).catch((error) => {
    console.error('Unable to start the browser edition', error);
    showBootError(error && error.message ? error.message : '请使用项目目录启动静态服务器后重试。');
  });
}());
