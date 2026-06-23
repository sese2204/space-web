// Builds and drives the whole 3D scene from the declarative body list, then
// exposes a tiny imperative API (flyTo / clearPoi) for the HUD to call.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SUN_DIR, SUN_DISTANCE } from './config.js';
import { OVERVIEW, BODIES } from './bodies.js';
import { buildSun, buildBody } from './builders.js';
import { createStarfield } from './starfield.js';
import { createMarkers } from './markers.js';
import { createCameraController } from './camera.js';

export function createScene(canvas, labelHost, { onSelectPoi }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 4000);

  // The directional light sits at the visible sun so lit faces line up with it.
  const sunDir = new THREE.Vector3(SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]).normalize();
  const sunPos = sunDir.clone().multiplyScalar(SUN_DISTANCE);
  const sunLight = new THREE.DirectionalLight(0xfff4e6, 3.0);
  sunLight.position.copy(sunPos);
  scene.add(sunLight);
  scene.add(new THREE.AmbientLight(0x14233f, 0.16));

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const sRGB = (t) => { t.colorSpace = THREE.SRGBColorSpace; return t; };

  const groupsById = {};
  const spinners = [];      // { obj, spin }
  const placed = [];        // { body, group } — markers filter for those with pois
  let earthClouds = null;

  // Camera stations, indexed by nav index (0 = heliocentric overview).
  const stations = new Array(1 + BODIES.length);
  stations[0] = {
    pos: new THREE.Vector3(...OVERVIEW.camera.pos),
    look: new THREE.Vector3(...OVERVIEW.camera.look),
    min: OVERVIEW.camera.min, max: OVERVIEW.camera.max,
  };

  BODIES.forEach((body, i) => {
    const navIndex = i + 1;
    body.navIndex = navIndex;
    const r = body.render;
    let group, mesh;

    if (r.kind === 'sun') {
      const built = buildSun(THREE, loader, sRGB, r.radius);
      group = built.group; mesh = built.mesh;
      group.position.copy(sunPos);
      scene.add(group);
    } else {
      const built = buildBody(THREE, loader, sRGB, body, sunDir);
      group = built.group; mesh = built.mesh;
      group.position.set(r.position[0], r.position[1], r.position[2]);
      if (r.parent && groupsById[r.parent]) groupsById[r.parent].add(group);
      else scene.add(group);
      if (built.clouds) earthClouds = built.clouds;
    }
    groupsById[body.id] = group;

    // Bodies with surface markers spin the whole group so the markers track the
    // surface; everything else spins just the mesh, leaving moon children put.
    const spinTarget = r.kind === 'sun' ? group : (body.pois ? group : (mesh || group));
    if (r.spin) spinners.push({ obj: spinTarget, spin: r.spin });
    placed.push({ body, group });

    // Resolve this body's camera station. getWorldPosition walks the parent
    // chain, so parented moons resolve to their true world position.
    const cam = body.camera;
    if (cam.sun) {
      stations[navIndex] = { pos: sunPos.clone().multiplyScalar(cam.factor), look: sunPos.clone(), min: cam.min, max: cam.max };
    } else {
      const world = group.getWorldPosition(new THREE.Vector3());
      stations[navIndex] = {
        pos: world.clone().add(new THREE.Vector3(...cam.offset)),
        look: world.clone(),
        min: cam.min, max: cam.max,
      };
    }
  });

  const sky = createStarfield(THREE, loader, sRGB);
  scene.add(sky.group);

  const controls = new OrbitControls(camera, renderer.domElement);
  const camCtl = createCameraController(THREE, controls, stations);

  const state = { targetStation: 0, currentPoiId: null };
  const markers = createMarkers(THREE, labelHost, placed, (poi) => {
    state.currentPoiId = poi.id;
    onSelectPoi(poi);
  });

  const tmp = new THREE.Vector2();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const w = window.innerWidth, h = window.innerHeight;
    if (w > 0 && h > 0) {
      const sz = renderer.getSize(tmp);
      if (Math.abs(sz.x - w) > 1 || Math.abs(sz.y - h) > 1) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
    camCtl.update();
    for (let i = 0; i < spinners.length; i++) spinners[i].obj.rotation.y += spinners[i].spin;
    if (earthClouds) earthClouds.rotation.y += 0.0006;
    sky.update(camera);
    markers.update(camera, state.targetStation, camCtl.isFlying(), state.currentPoiId, w, h);
    renderer.render(scene, camera);
  };
  tick();

  return {
    flyTo(navIndex) { state.targetStation = navIndex; state.currentPoiId = null; camCtl.flyTo(navIndex); },
    clearPoi() { state.currentPoiId = null; },
    dispose() { cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); },
  };
}
