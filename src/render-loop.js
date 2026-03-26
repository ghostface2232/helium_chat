// 렌더 루프: 바람/토크 적용 + DOM-물리 동기화
import { Body } from 'matter-js';
import { getBubbles } from './bubble.js';

export function startRenderLoop() {
  function loop(timestamp) {
    const bubbles = getBubbles();

    for (const bubble of bubbles) {
      const { body, element, width, height, phase } = bubble;

      // 바람 힘 (우→좌 기본 + sin 흔들림)
      const wind = -0.0002 * body.mass;
      const sway = Math.sin(timestamp * 0.001 + phase) * 0.0001 * body.mass;
      Body.applyForce(body, body.position, { x: wind + sway, y: 0 });

      // 미세 토크 (기우뚱 효과)
      body.torque += Math.sin(timestamp * 0.002 + phase) * 0.00002 * body.mass;

      // DOM 동기화
      const { x, y } = body.position;
      const angle = body.angle;
      element.style.transform =
        `translate(${x - width / 2}px, ${y - height / 2}px) rotate(${angle}rad)`;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
