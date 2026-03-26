// 물리 월드 관리 모듈
import { Engine, Runner, World, Bodies, Body } from 'matter-js';

const WALL_THICKNESS = 60;
const WALL_OPTIONS = { isStatic: true, restitution: 0.4 };

let engine = null;

// bubble-area 크기 기준으로 벽(천장, 좌벽, 우벽) 생성
function createWalls(w, h) {
  const ceiling = Bodies.rectangle(w / 2, -WALL_THICKNESS / 2, w + WALL_THICKNESS * 2, WALL_THICKNESS, WALL_OPTIONS);
  const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, WALL_OPTIONS);
  const rightWall = Bodies.rectangle(w + WALL_THICKNESS / 2, h / 2, WALL_THICKNESS, h, WALL_OPTIONS);
  return [ceiling, leftWall, rightWall];
}

// 물리 엔진 초기화
export function initPhysics() {
  const area = document.getElementById('bubble-area');
  const { clientWidth: w, clientHeight: h } = area;

  engine = Engine.create({ gravity: { x: 0, y: -0.5 } });

  const walls = createWalls(w, h);
  World.add(engine.world, walls);

  return { engine, walls };
}

// Runner를 생성하여 물리 시뮬레이션 시작
export function startPhysics(eng) {
  const runner = Runner.create();
  Runner.run(runner, eng);
  return runner;
}

// 리사이즈 시 벽 재생성
export function resizePhysics(eng, oldWalls) {
  World.remove(eng.world, oldWalls);

  const area = document.getElementById('bubble-area');
  const { clientWidth: w, clientHeight: h } = area;
  const newWalls = createWalls(w, h);
  World.add(eng.world, newWalls);

  return newWalls;
}

export function getEngine() {
  return engine;
}

export function getWorld() {
  return engine ? engine.world : null;
}
