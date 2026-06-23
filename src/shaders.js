// GLSL building blocks and ShaderMaterial factories for the scene.
//
// Procedural moon surfaces live here too: the Galilean moons, Titan and
// Enceladus have no CORS-served real texture, so each gets a tuned fbm-based
// colour function instead — always renders, no network dependency.

// 3D value-noise + 5-octave fbm, shared by every procedural surface.
const NOISE_GLSL = `
float h31(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h31(i+vec3(0.,0.,0.)),h31(i+vec3(1.,0.,0.)),f.x), mix(h31(i+vec3(0.,1.,0.)),h31(i+vec3(1.,1.,0.)),f.x),f.y),
            mix(mix(h31(i+vec3(0.,0.,1.)),h31(i+vec3(1.,0.,1.)),f.x), mix(h31(i+vec3(0.,1.,1.)),h31(i+vec3(1.,1.,1.)),f.x),f.y), f.z); }
float fbm(vec3 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p*=2.02; a*=0.5; } return v; }
`;

const PLANET_VERTEX = `varying vec3 vObj; varying vec3 vWN; varying vec3 vWP;
void main(){ vObj=position; vWN=normalize(mat3(modelMatrix)*normal);
 vec4 wp=modelMatrix*vec4(position,1.0); vWP=wp.xyz;
 gl_Position=projectionMatrix*viewMatrix*wp; }`;

// Per-moon procedural colour. `p` is the normalised surface point.
const MOON_SURFACE = {
  io: `vec3 surfaceColor(vec3 p){ float n=fbm(p*4.0); vec3 col=mix(vec3(0.95,0.85,0.30),vec3(0.80,0.50,0.12),n);
    float spot=smoothstep(0.55,0.72,fbm(p*7.0+3.0)); col=mix(col,vec3(0.45,0.12,0.06),spot*0.7);
    float bright=smoothstep(0.62,0.78,fbm(p*11.0+8.0)); col=mix(col,vec3(0.98,0.96,0.80),bright*0.5); return col; }`,
  europa: `vec3 surfaceColor(vec3 p){ vec3 col=vec3(0.86,0.86,0.82);
    float crack=fbm(p*9.0); float line=smoothstep(0.46,0.50,crack)*smoothstep(0.56,0.52,crack);
    col=mix(col,vec3(0.62,0.38,0.26),line*0.8);
    float crack2=fbm(p*5.0+20.0); float line2=smoothstep(0.47,0.50,crack2)*smoothstep(0.55,0.52,crack2);
    col=mix(col,vec3(0.55,0.33,0.24),line2*0.6); return col; }`,
  ganymede: `vec3 surfaceColor(vec3 p){ float n=fbm(p*3.4); vec3 col=mix(vec3(0.44,0.38,0.33),vec3(0.72,0.68,0.62),n);
    float groove=smoothstep(0.48,0.52,fbm(p*12.0)); col=mix(col,vec3(0.80,0.78,0.74),groove*0.4);
    float dark=smoothstep(0.40,0.30,fbm(p*5.0+12.0)); col=mix(col,vec3(0.30,0.26,0.23),dark*0.5); return col; }`,
  callisto: `vec3 surfaceColor(vec3 p){ float n=fbm(p*3.8); vec3 col=mix(vec3(0.26,0.22,0.19),vec3(0.52,0.46,0.40),n);
    float crater=smoothstep(0.66,0.74,fbm(p*16.0)); col=mix(col,vec3(0.78,0.74,0.68),crater*0.55); return col; }`,
  titan: `vec3 surfaceColor(vec3 p){ float n=fbm(p*2.6); vec3 col=mix(vec3(0.74,0.48,0.16),vec3(0.90,0.68,0.30),n);
    float haze=smoothstep(0.4,0.7,fbm(p*1.6+4.0)); col=mix(col,vec3(0.86,0.62,0.26),haze*0.5); return col; }`,
  enceladus: `vec3 surfaceColor(vec3 p){ float n=fbm(p*5.0); vec3 col=mix(vec3(0.88,0.92,0.97),vec3(0.98,0.99,1.0),n);
    float stripe=smoothstep(0.47,0.50,fbm(p*10.0))*smoothstep(0.54,0.51,fbm(p*10.0));
    col=mix(col,vec3(0.74,0.82,0.92),stripe*0.4); return col; }`,
};

export function proceduralMoonMaterial(THREE, type, sunDir) {
  const surf = MOON_SURFACE[type] || MOON_SURFACE.callisto;
  return new THREE.ShaderMaterial({
    uniforms: { uSunDir: { value: sunDir } },
    vertexShader: PLANET_VERTEX,
    fragmentShader:
      'precision highp float; varying vec3 vObj; varying vec3 vWN; varying vec3 vWP; uniform vec3 uSunDir;' +
      NOISE_GLSL + surf +
      'void main(){ vec3 p=normalize(vObj); vec3 col=surfaceColor(p);' +
      ' float lam=max(0.0,dot(normalize(vWN),normalize(uSunDir))); vec3 lit=col*(0.06+1.20*lam);' +
      ' gl_FragColor=vec4(lit,1.0); }',
  });
}

// Fresnel rim glow that fades on the night side — Earth's atmosphere.
export function atmosphereMaterial(THREE, color, sunDir) {
  return new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: color }, uSunDir: { value: sunDir } },
    vertexShader:
      'varying vec3 vN; varying vec3 vP; varying vec3 vWN; void main(){ vN = normalize(normalMatrix*normal);' +
      ' vWN = normalize(mat3(modelMatrix)*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = mv.xyz;' +
      ' gl_Position = projectionMatrix*mv; }',
    fragmentShader:
      'varying vec3 vN; varying vec3 vP; varying vec3 vWN; uniform vec3 glowColor; uniform vec3 uSunDir;' +
      ' void main(){ vec3 vd = normalize(-vP); float fres = pow(0.74 - dot(vN, vd), 3.2); fres = clamp(fres,0.0,1.0);' +
      ' float day = smoothstep(-0.4, 0.28, dot(normalize(vWN), normalize(uSunDir)));' +
      ' gl_FragColor = vec4(glowColor, fres * day); }',
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

// GLSL injected into Earth's MeshPhongMaterial to add city lights on the night
// hemisphere. Returns the onBeforeCompile callback.
export function nightLightsPatch(nightTex, sunDir) {
  return (shader) => {
    shader.uniforms.nightMap = { value: nightTex };
    shader.uniforms.uSunDir = { value: sunDir };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D nightMap;\nuniform vec3 uSunDir;')
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\nvec3 vsun = normalize((viewMatrix * vec4(uSunDir,0.0)).xyz);\n' +
          'float nd = dot(normalize(vNormal), vsun);\nfloat nf = smoothstep(0.02, -0.25, nd);\n' +
          'totalEmissiveRadiance += texture2D(nightMap, vMapUv).rgb * nf * 1.15;'
      );
  };
}
