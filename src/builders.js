// Mesh builders that turn a body's `render` config (see bodies.js) into Three.js
// objects. Each returns a Group so callers can position / parent it freely.
import { TEX, PTEX } from './config.js';
import { atmosphereMaterial, nightLightsPatch, proceduralMoonMaterial } from './shaders.js';

const url = (base, file) => (base === 'TEX' ? TEX : PTEX) + file;

// Soft radial sprite used for the sun's layered corona. Cached — one canvas
// texture is enough for every glow layer.
let glowCache = null;
export function glowTexture(THREE) {
  if (glowCache) return glowCache;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.32)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  glowCache = new THREE.CanvasTexture(c);
  return glowCache;
}

export function buildSun(THREE, loader, sRGB, radius) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshBasicMaterial({ map: sRGB(loader.load(PTEX + 'sunmap.jpg')), toneMapped: false })
  );
  group.add(core);
  const glow = glowTexture(THREE);
  [{ s: 130, o: 0.6, c: 0xffd88c }, { s: 250, o: 0.34, c: 0xff9f44 }, { s: 460, o: 0.16, c: 0xff7a1e }].forEach((g) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: g.c, transparent: true, opacity: g.o,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    sp.scale.set(g.s, g.s, 1);
    group.add(sp);
  });
  return { group, mesh: core };
}

// Flat ring with radial UVs so a strip texture maps inner->outer correctly.
function buildRing(THREE, loader, sRGB, cfg) {
  const geo = new THREE.RingGeometry(cfg.inner, cfg.outer, 200, 1);
  const p = geo.attributes.position, uv = geo.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    uv.setXY(i, (v.length() - cfg.inner) / (cfg.outer - cfg.inner), 0.5);
  }
  uv.needsUpdate = true;
  const colorTex = sRGB(loader.load(url(cfg.base, cfg.color)));
  const alphaTex = loader.load(url(cfg.base, cfg.alpha));
  colorTex.wrapS = colorTex.wrapT = THREE.ClampToEdgeWrapping;
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: colorTex, alphaMap: alphaTex, transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }));
  mesh.rotation.x = Math.PI * 0.5;
  return mesh;
}

// Returns { group, mesh, clouds }. `group` carries axial tilt + any ring;
// callers set group.position and parent it.
export function buildBody(THREE, loader, sRGB, body, sunDir) {
  const r = body.render;
  const group = new THREE.Group();
  if (r.tilt) group.rotation.z = r.tilt;
  let mesh, clouds = null;

  if (r.kind === 'earth') {
    const mat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: sRGB(loader.load(url(r.base, r.tex.map))),
      specularMap: loader.load(url(r.base, r.tex.spec)),
      normalMap: loader.load(url(r.base, r.tex.normal)),
      shininess: r.shininess,
      specular: new THREE.Color(r.specular),
    });
    const nightTex = loader.load(url(r.base, r.night));
    mat.onBeforeCompile = nightLightsPatch(nightTex, sunDir);
    mesh = new THREE.Mesh(new THREE.SphereGeometry(r.radius, 96, 96), mat);
    group.add(mesh);
    clouds = new THREE.Mesh(
      new THREE.SphereGeometry(r.radius * 1.016, 64, 64),
      new THREE.MeshPhongMaterial({ map: loader.load(url(r.base, r.clouds)), transparent: true, opacity: 0.85, depthWrite: false })
    );
    group.add(clouds);
    if (r.atmosphere) {
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(r.atmosphere.radius, 64, 64),
        atmosphereMaterial(THREE, new THREE.Color(r.atmosphere.color[0], r.atmosphere.color[1], r.atmosphere.color[2]), sunDir)
      ));
    }
  } else if (r.kind === 'moon' && r.procedural) {
    mesh = new THREE.Mesh(new THREE.SphereGeometry(r.radius, 72, 72), proceduralMoonMaterial(THREE, r.procedural, sunDir));
    group.add(mesh);
  } else {
    const opts = { map: sRGB(loader.load(url(r.base, r.tex.map))), shininess: r.shininess || 3 };
    if (r.tex.bump) { opts.bumpMap = loader.load(url(r.base, r.tex.bump)); opts.bumpScale = r.bumpScale || 0.05; }
    if (r.color != null) opts.color = r.color;
    mesh = new THREE.Mesh(new THREE.SphereGeometry(r.radius, 80, 80), new THREE.MeshPhongMaterial(opts));
    group.add(mesh);
  }

  if (r.ring) group.add(buildRing(THREE, loader, sRGB, r.ring));
  return { group, mesh, clouds };
}
