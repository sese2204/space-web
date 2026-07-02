// Builds and drives the 3D scene from the declarative body list, then exposes a
// small imperative API (flyTo / clearPoi / setOrbit) for the HUD.
//
// Layout note: bodies sit in an artistic line by default (easy to browse and
// fly between). The optional ORBIT mode revolves the planets around the sun; a
// single shared offset drives every orbit, so toggling it off eases everything
// back to the exact starting line.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SUN_DIR, SUN_DISTANCE } from './config.js';
import { OVERVIEW, BODIES } from './bodies.js';
import { buildSun, buildBody } from './builders.js';
import { createStarfield } from './starfield.js';
import { createMarkers } from './markers.js';
import { createCameraController } from './camera.js';

const ORBIT_SPEED = 0.035;       // planet angular step = ORBIT_SPEED / sqrt(radius)
const MOON_ORBIT_SPEED = 0.12;   // Luna circles the (moving) Earth noticeably faster

export function createScene(canvas, labelHost, { onSelectPoi, onSelectBody }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 4000);

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
  const spinners = [];
  const placed = [];
  const pickables = []; // body meshes tagged with navIndex for click-to-fly
  let earthClouds = null;
  let earthGroup = null;

  // Station definitions by nav index (0 = overview). Body stations carry a group
  // + offset so the camera target resolves live, even while orbiting.
  const stationDefs = new Array(1 + BODIES.length);
  stationDefs[0] = { static: {
    pos: new THREE.Vector3(...OVERVIEW.camera.pos),
    look: new THREE.Vector3(...OVERVIEW.camera.look),
    min: OVERVIEW.camera.min, max: OVERVIEW.camera.max,
  } };

  const orbiters = [];     // sun-centred (planets + Earth)
  let moonOrbiter = null;  // earth-centred

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
      stationDefs[navIndex] = { static: {
        pos: sunPos.clone().multiplyScalar(body.camera.factor), look: sunPos.clone(),
        min: body.camera.min, max: body.camera.max,
      } };
    } else {
      const built = buildBody(THREE, loader, sRGB, body, sunDir);
      group = built.group; mesh = built.mesh;
      group.position.set(r.position[0], r.position[1], r.position[2]);
      if (r.parent && groupsById[r.parent]) groupsById[r.parent].add(group);
      else scene.add(group);
      if (built.clouds) earthClouds = built.clouds;
      if (body.id === 'earth') earthGroup = group;
      stationDefs[navIndex] = { group, offset: new THREE.Vector3(...body.camera.offset), min: body.camera.min, max: body.camera.max };

      // Top-level bodies orbit; children (gas-giant moons) ride their parent.
      if (!r.parent) {
        if (body.id === 'moon') {
          const mr = Math.hypot(group.position.x, group.position.z); // Earth starts at origin
          moonOrbiter = { group, radius: mr, angle0: Math.atan2(group.position.z, group.position.x), speed: MOON_ORBIT_SPEED / Math.sqrt(mr) };
        } else {
          const dx = group.position.x - sunPos.x, dz = group.position.z - sunPos.z;
          const radius = Math.hypot(dx, dz);
          orbiters.push({ group, radius, angle0: Math.atan2(dz, dx), speed: ORBIT_SPEED / Math.sqrt(radius) });
        }
      }
    }
    groupsById[body.id] = group;

    // Meshes only (skips the sun's glow sprites); moons attach to their parent
    // group later in the loop, so each traverse tags just this body's meshes.
    group.traverse((obj) => {
      if (obj.isMesh) { obj.userData.navIndex = navIndex; pickables.push(obj); }
    });

    const spinTarget = r.kind === 'sun' ? group : (body.pois ? group : (mesh || group));
    if (r.spin) spinners.push({ obj: spinTarget, spin: r.spin });
    placed.push({ body, group });
  });

  function resolveStation(i) {
    const d = stationDefs[i];
    if (d.static) return { pos: d.static.pos.clone(), look: d.static.look.clone(), min: d.static.min, max: d.static.max };
    const look = d.group.getWorldPosition(new THREE.Vector3());
    return { pos: look.clone().add(d.offset), look, min: d.min, max: d.max };
  }

  const sky = createStarfield(THREE, loader, sRGB);
  scene.add(sky.group);

  const controls = new OrbitControls(camera, renderer.domElement);
  const camCtl = createCameraController(THREE, controls, resolveStation(0));

  const state = { targetStation: 0, currentPoiId: null };
  const markers = createMarkers(THREE, labelHost, placed, (poi) => {
    state.currentPoiId = poi.id;
    onSelectPoi(poi);
  });

  // --- click-to-fly: pick a body directly in the 3D view ---
  const CLICK_SLOP_PX = 6; // beyond this it's an orbit drag, not a click
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  const pointerDown = { x: 0, y: 0, id: -1 };

  function pickBody(clientX, clientY) {
    pointerNdc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.navIndex : null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    pointerDown.x = e.clientX; pointerDown.y = e.clientY; pointerDown.id = e.pointerId;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerId !== pointerDown.id) return;
    if (Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > CLICK_SLOP_PX) return;
    const navIndex = pickBody(e.clientX, e.clientY);
    if (navIndex != null && onSelectBody) onSelectBody(navIndex);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons) return; // mid-drag — leave the grab cursor alone
    canvas.style.cursor = pickBody(e.clientX, e.clientY) != null ? 'pointer' : '';
  });

  // --- orbit + camera follow ---
  let orbiting = false;
  let orbitOffset = 0;
  let followGroup = null;
  const followPrev = new THREE.Vector3();
  const tmpV = new THREE.Vector3();

  function setFollow(navIndex) {
    const d = stationDefs[navIndex];
    followGroup = d && d.group ? d.group : null;
    if (followGroup) followGroup.getWorldPosition(followPrev);
  }

  function updateOrbits() {
    if (!orbiting && orbitOffset === 0) return; // fully lined up — nothing to do
    if (orbiting) orbitOffset += 1;
    else { orbitOffset *= 0.94; if (orbitOffset < 0.0008) orbitOffset = 0; }
    for (let k = 0; k < orbiters.length; k++) {
      const o = orbiters[k];
      const a = o.angle0 + orbitOffset * o.speed;
      o.group.position.x = sunPos.x + o.radius * Math.cos(a);
      o.group.position.z = sunPos.z + o.radius * Math.sin(a);
    }
    if (moonOrbiter && earthGroup) {
      const a = moonOrbiter.angle0 + orbitOffset * moonOrbiter.speed;
      moonOrbiter.group.position.x = earthGroup.position.x + moonOrbiter.radius * Math.cos(a);
      moonOrbiter.group.position.z = earthGroup.position.z + moonOrbiter.radius * Math.sin(a);
    }
  }

  // Keep the camera glued to the parked body as it drifts through space.
  function followActive() {
    if (!followGroup) return;
    const cur = followGroup.getWorldPosition(tmpV);
    const dx = cur.x - followPrev.x, dy = cur.y - followPrev.y, dz = cur.z - followPrev.z;
    if (dx || dy || dz) {
      camera.position.set(camera.position.x + dx, camera.position.y + dy, camera.position.z + dz);
      controls.target.set(controls.target.x + dx, controls.target.y + dy, controls.target.z + dz);
      followPrev.copy(cur);
    }
  }

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
    updateOrbits();
    camCtl.update();
    followActive();
    for (let i = 0; i < spinners.length; i++) spinners[i].obj.rotation.y += spinners[i].spin;
    if (earthClouds) earthClouds.rotation.y += 0.0006;
    sky.update(camera);
    markers.update(camera, state.targetStation, camCtl.isFlying(), state.currentPoiId, w, h);
    renderer.render(scene, camera);
  };
  tick();

  return {
    flyTo(navIndex) {
      state.targetStation = navIndex;
      state.currentPoiId = null;
      camCtl.flyTo(resolveStation(navIndex));
      setFollow(navIndex);
    },
    clearPoi() { state.currentPoiId = null; },
    setOrbit(on) { orbiting = !!on; },
    dispose() { cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); },
  };
}
