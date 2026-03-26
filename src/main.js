import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';

const { engine, walls } = initPhysics();
startPhysics(engine);

let currentWalls = walls;
window.addEventListener('resize', () => {
  currentWalls = resizePhysics(engine, currentWalls);
});

initInput();
