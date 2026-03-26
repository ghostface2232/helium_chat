import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble } from './bubble.js';
import { startRenderLoop } from './render-loop.js';

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
window.addEventListener('resize', () => {
  currentWalls = resizePhysics(engine, currentWalls);
});

initInput((text) => {
  createBubble(text, engine);
});
