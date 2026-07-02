// Entry point: wire the HUD and the 3D scene together.
import { createScene } from './scene.js';
import { createHud } from './hud.js';

const canvas = document.getElementById('exo-canvas');
const labelHost = document.getElementById('exo-labels');
const root = document.getElementById('exo-root');

let scene;
const hud = createHud(root, {
  onGo: (i) => scene.flyTo(i),
  onClosePoi: () => scene.clearPoi(),
  onToggleOrbit: (on) => scene.setOrbit(on),
});
scene = createScene(canvas, labelHost, {
  onSelectPoi: (poi) => hud.showPoi(poi),
});
