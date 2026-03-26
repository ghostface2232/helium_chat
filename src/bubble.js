// 버블 생성/관리 모듈
import { Bodies, Body, World } from 'matter-js';

const bubbles = [];

// HSL 랜덤 배경색 생성 (흰색 텍스트가 잘 읽히는 범위)
function randomColor() {
  const h = Math.random() * 360;
  const s = 60 + Math.random() * 15;
  const l = 42 + Math.random() * 13;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// 버블 생성: DOM 요소 + Matter.js body
export function createBubble(text, engine) {
  const area = document.getElementById('bubble-area');
  const areaW = area.clientWidth;
  const areaH = area.clientHeight;

  // DOM 요소 생성
  const el = document.createElement('div');
  el.className = 'bubble';
  el.textContent = text;
  el.style.cssText = `
    position: absolute;
    padding: 10px 16px;
    border-radius: 24px;
    color: #fff;
    font-size: 16px;
    line-height: 1.4;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: ${areaW * 0.6}px;
    word-wrap: break-word;
    white-space: pre-wrap;
    pointer-events: none;
    user-select: none;
    will-change: transform;
    background: ${randomColor()};
    visibility: hidden;
  `;

  // 치수 측정을 위해 임시 렌더링
  area.appendChild(el);
  const w = el.offsetWidth;
  const h = el.offsetHeight;

  // Matter.js body 생성
  const startX = areaW / 2 + (Math.random() - 0.5) * 60;
  const startY = areaH - 80;

  const body = Bodies.rectangle(startX, startY, w, h, {
    chamfer: { radius: 24 },
    restitution: 0.3,
    friction: 0.05,
    frictionAir: 0.02,
  });

  // 질량에 랜덤 편차 (떠오르는 속도 차이)
  Body.setMass(body, body.mass * (0.8 + Math.random() * 0.4));

  World.add(engine.world, body);

  // 표시
  el.style.visibility = 'visible';

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
