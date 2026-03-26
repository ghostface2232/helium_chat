// 버블 생성/관리 모듈
import { Bodies, Body, World } from 'matter-js';

const bubbles = [];

const MORPH_DURATION = 400; // 입력창→버블 색상 전환 시간(ms)

// 채도 높아 보이는 hue 대역 (탁해 보이는 노랑~황녹 제외)
const VIVID_HUES = [
  [0, 30],     // 빨강~주황
  [270, 360],  // 보라~마젠타
  [180, 260],  // 시안~파랑
  [70, 170],   // 초록~청록
  [30, 70],    // 주황~연두
];
const HUE_RANGES = VIVID_HUES.flat();
let lastHue = -1;
const MIN_HUE_SHIFT = 60;

function randomColor() {
  // vivid 대역에서 랜덤 hue 선택
  const range = VIVID_HUES[Math.floor(Math.random() * VIVID_HUES.length)];
  let h = range[0] + Math.random() * (range[1] - range[0]);

  // 이전 hue와 최소 거리 보장
  if (lastHue >= 0) {
    let dist = Math.abs(h - lastHue);
    if (dist > 180) dist = 360 - dist;
    if (dist < MIN_HUE_SHIFT) {
      h = (lastHue + MIN_HUE_SHIFT + Math.random() * (360 - 2 * MIN_HUE_SHIFT)) % 360;
    }
  }
  lastHue = h;

  const s = 80 + Math.random() * 20;
  const l = 42 + Math.random() * 10;
  return { h, s, l };
}

// 버블 생성: 입력창 위에 겹쳐서 나타난 뒤 색이 변하며 떠오름
export function createBubble(text, engine) {
  const area = document.getElementById('bubble-area');
  const areaRect = area.getBoundingClientRect();
  const input = document.getElementById('message-input');
  const inputRect = input.getBoundingClientRect();

  const { h: hue, s, l } = randomColor();
  const color = `hsl(${hue}, ${s}%, ${l}%)`;
  const glow = `hsla(${hue}, ${s}%, ${l}%, 0.35)`;

  // DOM 요소 생성 — 처음에는 입력창과 동일한 외형
  const el = document.createElement('div');
  el.className = 'bubble';
  el.textContent = text;

  // input과 동일한 타이포그래피를 computed style에서 복사
  const inputStyle = getComputedStyle(input);
  const baseStyle = `
    position: absolute;
    padding: ${inputStyle.paddingTop} ${inputStyle.paddingRight} ${inputStyle.paddingBottom} ${inputStyle.paddingLeft};
    border-radius: ${inputStyle.borderRadius};
    font-size: ${inputStyle.fontSize};
    line-height: ${inputStyle.lineHeight};
    font-family: ${inputStyle.fontFamily};
    font-weight: ${inputStyle.fontWeight};
    letter-spacing: ${inputStyle.letterSpacing};
    max-width: ${areaRect.width * 0.6}px;
    word-wrap: break-word;
    white-space: pre-wrap;
    pointer-events: none;
    user-select: none;
    will-change: transform;
    z-index: 20;
  `;

  // 입력창의 현재 색상을 복사 (라이트/다크 모드 대응)
  const inputBg = inputStyle.backgroundColor;
  const inputColor = inputStyle.color;
  const inputBorder = inputStyle.borderColor;

  el.style.cssText = baseStyle + `
    background: ${inputBg};
    color: ${inputColor};
    border: 1px solid ${inputBorder};
    transition: background 800ms cubic-bezier(0.25, 0.1, 0.25, 1),
                color 800ms cubic-bezier(0.25, 0.1, 0.25, 1),
                border-color 800ms cubic-bezier(0.25, 0.1, 0.25, 1),
                box-shadow 800ms cubic-bezier(0.25, 0.1, 0.25, 1);
    visibility: hidden;
  `;

  // 치수 측정
  area.appendChild(el);
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  // 입력창 정확한 위치 (bubble-area 좌표계 기준)
  const startX = inputRect.left - areaRect.left + w / 2;
  const startY = inputRect.top - areaRect.top + inputRect.height / 2;

  // Matter.js body — 처음부터 동적, 역중력으로 바로 떠오름
  const body = Bodies.rectangle(startX, startY, w, h, {
    chamfer: { radius: Math.min(w, h) / 2 },
    restitution: 0.3,
    friction: 0.05,
    frictionAir: 0.02,
  });

  Body.setMass(body, body.mass * (0.8 + Math.random() * 0.4));
  Body.setVelocity(body, { x: 0, y: -3 });
  World.add(engine.world, body);

  // 입력창 위에 겹쳐서 표시
  el.style.visibility = 'visible';

  // 다음 프레임에서 색상 전환 트리거 — 벗겨지듯 색이 입혀짐
  requestAnimationFrame(() => {
    el.style.background = color;
    el.style.color = '#fff';
    el.style.borderColor = 'transparent';
    el.style.boxShadow = `0 0 12px 3px ${glow}`;
  });

  const bubble = {
    element: el,
    body,
    width: w,
    height: h,
    phase: Math.random() * Math.PI * 2,
  };
  bubbles.push(bubble);


  return bubble;
}

export function getBubbles() {
  return bubbles;
}
