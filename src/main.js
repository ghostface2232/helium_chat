import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const ORIENTATION_WIDTH_DELTA = 120;
const VIEWPORT_SYNC_DEBOUNCE = 200;

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let viewportSyncTimer = null;

// --- 안정적인 전체화면 크기 추적 ---
let stableLayoutWidth = getLayoutWidth();
let stableLayoutHeight = getLayoutHeight();
let maxObservedLayoutHeight = stableLayoutHeight;

// 키보드가 닫힌 상태에서의 visual viewport 전체 높이 (기준값)
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
  const compressedViewport =
    window.visualViewport.height < keyboardReferenceHeight - KEYBOARD_THRESHOLD;
  // iOS Safari에서 키보드 열림 시 offsetTop이 양수로 변하는 현상 감지
  const shiftedViewport = window.visualViewport.offsetTop > 0;

  return activeInput && (insetFromReference > KEYBOARD_THRESHOLD || compressedViewport || shiftedViewport);
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

// --- iOS 스크롤 봉쇄 ---
// iOS Safari는 input focus 시 내부적으로 document를 스크롤하여
// 포커스된 요소를 보이게 하려 함. 이를 강제로 원위치시킴.
function forceScrollReset() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
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
  if (isKeyboardOpen()) {
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

// 초기 안정 높이 설정
commitStableViewport(stableLayoutWidth, stableLayoutHeight);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncViewportAndPhysics, 180);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// --- 소프트 키보드 대응 (visualViewport API 지원 환경) ---
// 입력바만 키보드 상단으로 올리고 물리 천장은 고정 유지
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');

  function onViewportChange() {
    // iOS가 스크롤시킨 것을 즉시 원위치
    forceScrollReset();

    const keyboardInset = getKeyboardInsetFromReference();
    inputBar.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';

    clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(() => {
      forceScrollReset();
      if (!isKeyboardOpen() && !isEditableFocused()) {
        keyboardReferenceHeight = window.visualViewport.height + window.visualViewport.offsetTop;
      }
      syncViewportAndPhysics();
    }, VIEWPORT_SYNC_DEBOUNCE);
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}

// --- iOS 스크롤 봉쇄: 추가 방어 레이어 ---
// focus/blur, scroll 이벤트에서도 스크롤을 강제 리셋
window.addEventListener('scroll', forceScrollReset, { passive: false });
document.addEventListener('scroll', forceScrollReset, { passive: false });

// 포커스 시 iOS가 스크롤하는 것을 requestAnimationFrame으로 즉시 복구
document.addEventListener('focusin', () => {
  requestAnimationFrame(forceScrollReset);
  // iOS는 포커스 후 약간의 지연을 두고 스크롤하므로 여러 프레임에 걸쳐 리셋
  setTimeout(forceScrollReset, 50);
  setTimeout(forceScrollReset, 150);
  setTimeout(forceScrollReset, 300);
});

// 키보드 닫힐 때 (blur) 스크롤 리셋 + 뷰포트 안정화
document.addEventListener('focusout', () => {
  forceScrollReset();
  setTimeout(() => {
    forceScrollReset();
    syncViewportAndPhysics();
  }, 300);
});
