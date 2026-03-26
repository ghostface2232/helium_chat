import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const VIEWPORT_SYNC_DEBOUNCE = 120;
const ORIENTATION_SYNC_DEBOUNCE = 220;

const inputBar = document.getElementById('input-bar');
const inputBarInner = document.getElementById('input-bar-inner');

function getWorldViewportSize() {
  const root = document.documentElement;

  return {
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight,
  };
}

function isEditableFocused() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable;
}

function applyWorldViewport(viewport) {
  document.documentElement.style.setProperty('--world-viewport-width', `${viewport.width}px`);
  document.documentElement.style.setProperty('--world-viewport-height', `${viewport.height}px`);
}

function getVisibleViewportBottom() {
  if (window.visualViewport) {
    return window.visualViewport.height + window.visualViewport.offsetTop;
  }

  return window.innerHeight;
}

let worldViewport = getWorldViewportSize();
applyWorldViewport(worldViewport);

const { engine, walls } = initPhysics(worldViewport);
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let keyboardSettleTimer = null;
let orientationTimer = null;
let keyboardSessionActive = false;
let inputBarTrackingFrame = null;
let keyboardChromeActive = false;

function getKeyboardLift() {
  return Math.max(0, worldViewport.height - getVisibleViewportBottom());
}

function isKeyboardCompressed() {
  return getKeyboardLift() > KEYBOARD_THRESHOLD;
}

function clampBubblesIntoBounds() {
  const { width, height } = worldViewport;

  for (const bubble of getBubbles()) {
    const { body, width: bubbleWidth, height: bubbleHeight } = bubble;
    const x = Math.max(bubbleWidth / 2, Math.min(width - bubbleWidth / 2, body.position.x));
    const y = Math.max(bubbleHeight / 2, Math.min(height - bubbleHeight / 2, body.position.y));

    if (x !== body.position.x || y !== body.position.y) {
      Body.setPosition(body, { x, y });
    }
  }
}

function syncPhysicsBounds() {
  currentWalls = resizePhysics(engine, currentWalls, worldViewport);
  clampBubblesIntoBounds();
}

function commitWorldViewport(nextViewport) {
  worldViewport = nextViewport;
  applyWorldViewport(nextViewport);
  syncPhysicsBounds();
}

function syncWorldViewport(options = {}) {
  const { force = false } = options;
  const nextViewport = getWorldViewportSize();
  const sizeChanged = (
    nextViewport.width !== worldViewport.width ||
    nextViewport.height !== worldViewport.height
  );

  if (!sizeChanged) {
    return;
  }

  // 키보드 세션 중에는 world를 절대 재배치하지 않는다
  if (!force && keyboardSessionActive && nextViewport.width === worldViewport.width) {
    return;
  }

  commitWorldViewport(nextViewport);
}

function syncInputBarPosition() {
  const keyboardLift = getKeyboardLift();
  const isKeyboardActive = keyboardLift > KEYBOARD_THRESHOLD;

  inputBar.style.transform = keyboardLift > KEYBOARD_THRESHOLD
    ? `translate3d(0, -${keyboardLift}px, 0)`
    : 'translate3d(0, 0, 0)';

  if (keyboardChromeActive !== isKeyboardActive) {
    keyboardChromeActive = isKeyboardActive;
    animateInputBarChrome(isKeyboardActive);
  }
}

function animateInputBarChrome(isKeyboardActive) {
  if (!inputBarInner) return;

  if (typeof inputBarInner.getAnimations === 'function') {
    for (const animation of inputBarInner.getAnimations()) {
      animation.cancel();
    }
  }

  const keyframes = isKeyboardActive
    ? [
        { transform: 'translate3d(0, 14px, 0) scale(0.955)', opacity: 0.88, offset: 0 },
        { transform: 'translate3d(0, -3px, 0) scale(1.01)', opacity: 1, offset: 0.72 },
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, offset: 1 },
      ]
    : [
        { transform: 'translate3d(0, -6px, 0) scale(1.01)', opacity: 1, offset: 0 },
        { transform: 'translate3d(0, 2px, 0) scale(0.992)', opacity: 1, offset: 0.7 },
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, offset: 1 },
      ];

  if (typeof inputBarInner.animate === 'function') {
    inputBarInner.animate(keyframes, {
      duration: isKeyboardActive ? 240 : 180,
      easing: 'linear',
      fill: 'both',
    });
    return;
  }

  inputBarInner.style.transform = 'translate3d(0, 0, 0) scale(1)';
  inputBarInner.style.opacity = '1';
}

function stopInputBarTracking() {
  if (inputBarTrackingFrame !== null) {
    cancelAnimationFrame(inputBarTrackingFrame);
    inputBarTrackingFrame = null;
  }
}

function startInputBarTracking() {
  if (inputBarTrackingFrame !== null || !window.visualViewport) {
    return;
  }

  const tick = () => {
    syncInputBarPosition();

    if (keyboardSessionActive || isKeyboardCompressed() || isEditableFocused()) {
      inputBarTrackingFrame = requestAnimationFrame(tick);
      return;
    }

    inputBarTrackingFrame = null;
  };

  inputBarTrackingFrame = requestAnimationFrame(tick);
}

function scheduleKeyboardSettle() {
  clearTimeout(keyboardSettleTimer);
  keyboardSettleTimer = setTimeout(() => {
    if (isKeyboardCompressed()) {
      return;
    }

    if (!isEditableFocused()) {
      keyboardSessionActive = false;
    }

    stopInputBarTracking();
    syncWorldViewport();
    syncInputBarPosition();
  }, VIEWPORT_SYNC_DEBOUNCE);
}

document.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
    syncInputBarPosition();

    if (!window.visualViewport) {
      keyboardSessionActive = false;
      syncWorldViewport();
      return;
    }

    scheduleKeyboardSettle();
  });
});

document.addEventListener('focusin', () => {
  if (window.visualViewport && isEditableFocused()) {
    keyboardSessionActive = true;
    startInputBarTracking();
  }

  syncInputBarPosition();
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    syncWorldViewport();
    syncInputBarPosition();
  }, VIEWPORT_SYNC_DEBOUNCE);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

if (window.visualViewport) {
  function onViewportChange() {
    syncInputBarPosition();

    if (isKeyboardCompressed()) {
      keyboardSessionActive = true;
      startInputBarTracking();
      clearTimeout(keyboardSettleTimer);
      return;
    }

    scheduleKeyboardSettle();
  }

  window.visualViewport.addEventListener('resize', onViewportChange);
  window.visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}

window.addEventListener('orientationchange', () => {
  clearTimeout(orientationTimer);
  orientationTimer = setTimeout(() => {
    keyboardSessionActive = false;
    syncWorldViewport({ force: true });
    syncInputBarPosition();
  }, ORIENTATION_SYNC_DEBOUNCE);
});
