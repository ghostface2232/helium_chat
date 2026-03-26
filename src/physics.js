// 물리 월드 관리 모듈
import { Engine, Runner, World, Bodies, Body } from 'matter-js';

const WALL_THICKNESS = 60;
const WALL_OPTIONS = { isStatic: true, restitution: 0.4 };

let engine = null;

// bubble-area 크기 기준으로 벽(천장, 좌벽, 우벽) 생성
// topOffset: 천장의 y 오프셋 (모바일 키보드 대응)
function createWalls(w, h, topOffset = 0) {
  const ceiling = Bodies.rectangle(w / 2, topOffset - WALL_THICKNESS / 2, w + WALL_THICKNESS * 2, WALL_THICKNESS, WALL_OPTIONS);
  const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, topOffset + h / 2, WALL_THICKNESS, h, WALL_OPTIONS);
  const rightWall = Bodies.rectangle(w + WALL_THICKNESS / 2, topOffset + h / 2, WALL_THICKNESS, h, WALL_OPTIONS);
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
// viewport: { height, offsetTop } — 모바일 키보드 대응용 (생략 시 bubble-area 기준)
export function resizePhysics(eng, oldWalls, viewport = null) {
  World.remove(eng.world, oldWalls);

  const area = document.getElementById('bubble-area');
  const w = area.clientWidth;
  const h = viewport ? viewport.height : area.clientHeight;
  const topOffset = viewport ? viewport.offsetTop : 0;
  const newWalls = createWalls(w, h, topOffset);
  World.add(eng.world, newWalls);

  return newWalls;
}

export function getEngine() {
  return engine;
}

export function getWorld() {
  return engine ? engine.world : null;
}
