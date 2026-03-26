import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const ORIENTATION_WIDTH_DELTA = 120;
const VIEWPORT_SYNC_DEBOUNCE = 150;

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let viewportSyncTimer = null;

let stableLayoutWidth = getLayoutWidth();
let stableLayoutHeight = getLayoutHeight();
let maxObservedLayoutHeight = stableLayoutHeight;
let keyboardLockActive = false;

// 키보드가 닫힌 상태에서의 visual viewport 기준값
let keyboardReferenceHeight = window.visualViewport
  ? window.visualViewport.height + window.visualViewport.offsetTop
  : stableLayoutHeight;

function getLayoutWidth() {
  return document.documentElement.clientWidth || window.innerWidth;
}

function getLayoutHeight() {
  return document.documentElement.clientHeight || window.innerHeight;
}

function isEditableFocused() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable;
}

function shouldFreezeLayoutForKeyboard(orientationChanged = false) {
  // 입력 요소에 포커스가 있는 동안에는 키보드 세션으로 간주해 레이아웃을 고정한다.
  // 단, 회전(가로폭 급변) 시에는 월드 재계산을 허용한다.
  return keyboardLockActive && !orientationChanged;
}

function getKeyboardInsetFromReference() {
  if (!window.visualViewport) return 0;

  const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
  return Math.max(0, keyboardReferenceHeight - viewportBottom);
}

function isKeyboardOpen() {
  if (!window.visualViewport) {
    const currentHeight = getLayoutHeight();
    const shrunkFromMax = currentHeight < maxObservedLayoutHeight - KEYBOARD_THRESHOLD;
    return isEditableFocused() && shrunkFromMax;
  }

  const activeInput = isEditableFocused();
  const insetFromReference = getKeyboardInsetFromReference();
  const insetFromStable = Math.max(
    0,
    stableLayoutHeight - (window.visualViewport.height + window.visualViewport.offsetTop),
  );
  const compressedViewport =
    window.visualViewport.height < keyboardReferenceHeight - KEYBOARD_THRESHOLD;

  // iOS Safari는 키보드 열림 시 offsetTop이 함께 변하는 경우가 있어 함께 체크
  const shiftedViewport = window.visualViewport.offsetTop > 0;

  return activeInput && (
    insetFromReference > KEYBOARD_THRESHOLD ||
    insetFromStable > KEYBOARD_THRESHOLD ||
    compressedViewport ||
    shiftedViewport
  );
}

function applyStableAppHeight(height) {
  document.documentElement.style.setProperty('--stable-app-height', `${height}px`);
}

function commitStableViewport(width, height) {
  stableLayoutWidth = width;
  stableLayoutHeight = height;

  if (window.visualViewport || !isEditableFocused()) {
    maxObservedLayoutHeight = Math.max(maxObservedLayoutHeight, height);
  }

  applyStableAppHeight(height);
}

function clampBubblesIntoBounds() {
  const area = document.getElementById('bubble-area');
  const w = area.clientWidth;
  const h = area.clientHeight;

  for (const bubble of getBubbles()) {
    const { body, width, height } = bubble;
    const x = Math.max(width / 2, Math.min(w - width / 2, body.position.x));
    const y = Math.max(height / 2, Math.min(h - height / 2, body.position.y));

    if (x !== body.position.x || y !== body.position.y) {
      Body.setPosition(body, { x, y });
    }
  }
}

function syncPhysicsBounds() {
  currentWalls = resizePhysics(engine, currentWalls);
  clampBubblesIntoBounds();
}

function updateKeyboardReferenceIfStable(orientationChanged = false) {
  if (!window.visualViewport) {
    if (orientationChanged) {
      // 회전/대규모 가로폭 변경 시 no-visualViewport 기준 높이를 재설정
      maxObservedLayoutHeight = stableLayoutHeight;
      return;
    }

    if (!isEditableFocused()) {
      maxObservedLayoutHeight = Math.max(maxObservedLayoutHeight, getLayoutHeight());
    }
    return;
  }

  if (isKeyboardOpen() || isEditableFocused()) return;

  keyboardReferenceHeight = window.visualViewport.height + window.visualViewport.offsetTop;
}

function syncViewportAndPhysics() {
  const width = getLayoutWidth();
  const height = getLayoutHeight();
  const widthDelta = Math.abs(width - stableLayoutWidth);
  const orientationChanged = widthDelta >= ORIENTATION_WIDTH_DELTA;

  // 소프트 키보드 중에는 물리 월드 경계를 절대 갱신하지 않는다
  if (isKeyboardOpen() || shouldFreezeLayoutForKeyboard(orientationChanged)) {
    return;
  }

  const sizeChanged = width !== stableLayoutWidth || height !== stableLayoutHeight;
  if (!sizeChanged) {
    updateKeyboardReferenceIfStable(orientationChanged);
    return;
  }

  // 모바일 브라우저 UI 변화(주소창 show/hide)로 인한 미세 흔들림 억제
  if (!orientationChanged && Math.abs(height - stableLayoutHeight) < KEYBOARD_THRESHOLD / 2 && widthDelta === 0) {
    updateKeyboardReferenceIfStable(orientationChanged);
    return;
  }

  commitStableViewport(width, height);
  updateKeyboardReferenceIfStable(orientationChanged);
  syncPhysicsBounds();
}

commitStableViewport(stableLayoutWidth, stableLayoutHeight);

document.addEventListener('focusin', () => {
  if (!isEditableFocused()) return;
  keyboardLockActive = true;
});

document.addEventListener('focusout', () => {
  // blur 직후에는 다음 입력으로 포커스가 이동할 수 있어 한 프레임 뒤 상태를 확인
  requestAnimationFrame(() => {
    if (!isEditableFocused()) {
      keyboardLockActive = false;
      syncViewportAndPhysics();
    }
  });
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncViewportAndPhysics, 180);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// 소프트 키보드 대응: 입력바만 키보드 상단으로 올리고 물리 천장은 고정 유지
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');

  function onViewportChange() {
    const keyboardInset = getKeyboardInsetFromReference();
    inputBar.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';

    clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(() => {
      if (!isKeyboardOpen() && !isEditableFocused()) {
        keyboardLockActive = false;
        keyboardReferenceHeight = window.visualViewport.height + window.visualViewport.offsetTop;
      }
      syncViewportAndPhysics();
    }, VIEWPORT_SYNC_DEBOUNCE);
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}
