// 물리 월드 관리 모듈
import { Engine, Runner, World, Bodies } from 'matter-js';

const WALL_THICKNESS = 60;
const WALL_OPTIONS = { isStatic: true, restitution: 0.4 };

let engine = null;

// 브라우저 레이아웃 뷰포트 기준으로 벽(천장, 좌벽, 우벽) 생성
function createWalls(width, height) {
  const ceiling = Bodies.rectangle(
    width / 2,
    -WALL_THICKNESS / 2,
    width + WALL_THICKNESS * 2,
    WALL_THICKNESS,
    WALL_OPTIONS,
  );
  const leftWall = Bodies.rectangle(-WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, WALL_OPTIONS);
  const rightWall = Bodies.rectangle(width + WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height, WALL_OPTIONS);

  return [ceiling, leftWall, rightWall];
}

// 물리 엔진 초기화
export function initPhysics(viewport) {
  engine = Engine.create({ gravity: { x: 0, y: -0.5 } });

  const walls = createWalls(viewport.width, viewport.height);
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
export function resizePhysics(eng, oldWalls, viewport) {
  World.remove(eng.world, oldWalls);

  const newWalls = createWalls(viewport.width, viewport.height);
  World.add(eng.world, newWalls);

  return newWalls;
}
