// Deep-space backdrop: a Milky Way panorama sphere plus ~5,000 real naked-eye
// stars from the HYG catalogue, sized by apparent magnitude and tinted by
// B-V colour index. The whole sky tracks the camera so it reads as infinitely
// distant (no parallax, no far-plane clipping).
import { GALAXY_TEX, STARS_URL } from './config.js';

const SKY_R = 1800;

// B-V colour index -> approximate star RGB.
function bvColor(bv) {
  if (bv < 0.0) return [0.70, 0.80, 1.0];
  if (bv < 0.3) return [0.90, 0.95, 1.0];
  if (bv < 0.6) return [1.0, 1.0, 0.92];
  if (bv < 1.0) return [1.0, 0.95, 0.76];
  if (bv < 1.5) return [1.0, 0.82, 0.60];
  return [1.0, 0.72, 0.52];
}

function starMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader:
      'attribute float size; attribute vec3 color; varying vec3 vColor;' +
      'void main(){ vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.0);' +
      ' gl_PointSize=size*(320.0/-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader:
      'varying vec3 vColor; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d);' +
      ' if(r>0.5) discard; float a=smoothstep(0.5,0.08,r); gl_FragColor=vec4(vColor,a); }',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export function createStarfield(THREE, loader, sRGB) {
  const group = new THREE.Group();

  // Galaxy panorama as an inside-out sphere, dimmed so planets stay dominant.
  const galaxy = new THREE.Mesh(
    new THREE.SphereGeometry(SKY_R * 1.05, 48, 48),
    new THREE.MeshBasicMaterial({
      map: sRGB(loader.load(GALAXY_TEX)),
      color: 0x6a7180,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  group.add(galaxy);

  // Real stars (async — the sky shows the galaxy until the catalogue lands).
  let stars = null;
  fetch(STARS_URL)
    .then((r) => r.json())
    .then((data) => {
      const n = data.length;
      const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const [ra, dec, mag, ci] = data[i];
        const a = ra * 15 * Math.PI / 180, d = dec * Math.PI / 180;
        pos[i * 3] = SKY_R * Math.cos(d) * Math.cos(a);
        pos[i * 3 + 1] = SKY_R * Math.sin(d);
        pos[i * 3 + 2] = -SKY_R * Math.cos(d) * Math.sin(a);
        const c = bvColor(ci);
        col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
        size[i] = Math.max(0.6, Math.min(6, (6.5 - mag) * 0.6 + 0.6));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
      stars = new THREE.Points(geo, starMaterial(THREE));
      group.add(stars);
    })
    .catch((err) => console.error('[exoscape] star catalogue failed to load:', err));

  // Keep the sky centred on the camera every frame.
  function update(camera) {
    group.position.copy(camera.position);
  }

  return { group, update };
}
