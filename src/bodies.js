// Single source of truth for the Exoscape system: every navigable destination,
// its 3D placement, textures and the data shown in the HUD.
//
// Nav index 0 is the heliocentric overview; indices 1.. map one-to-one onto
// BODIES (so BODIES[i] is nav station i+1). Bodies with a `parent` are placed
// relative to that parent's group; their `position` is a LOCAL offset.

export const OVERVIEW = {
  nav: 'DEEP FIELD',
  designation: 'HELIOCENTRIC VIEW',
  name: 'SOLAR SYSTEM',
  blurb: '여덟 행성과 주요 위성, 그리고 5,000여 개의 실제 항성이 함께하는 태양계를 항해합니다.',
  hint: '행성을 선택해 진입  ·  드래그로 둘러보기',
  stats: [
    { k: '항성', v: '1 · Sol' },
    { k: '행성', v: '8' },
    { k: '왜소행성', v: '1 · Pluto' },
    { k: '주요 위성', v: '7' },
    { k: '탐사 상태', v: 'ACTIVE' },
  ],
  camera: { pos: [-150, 88, 330], look: [200, -10, 0], min: 40, max: 1600 },
};

const HINT = '드래그로 시점 이동  ·  휠로 확대/축소';

export const BODIES = [
  {
    id: 'sun', nav: 'SOL', designation: 'SOL · G2V STAR', name: 'THE SUN',
    blurb: '태양계 전체 질량의 99.86%를 차지하는 항성. 모든 행성에 빛과 열을 공급합니다.', hint: HINT,
    stats: [
      { k: '지름', v: '1,392,700 km' }, { k: '표면 온도', v: '5,500 °C' },
      { k: '중심핵', v: '1,500만 °C' }, { k: '질량', v: '1.989×10³⁰ kg' },
      { k: '분류', v: 'G2V 주계열성' }, { k: '나이', v: '46억 년' },
    ],
    render: { kind: 'sun', radius: 26, spin: 0.0004 },
    camera: { sun: true, factor: 0.62, min: 60, max: 720 },
  },
  {
    id: 'mercury', nav: 'MERCURY', designation: 'MERCURY · SOL I', name: 'MERCURY',
    blurb: '태양에 가장 가까운 암석 행성. 낮과 밤의 온도차가 600 °C에 이릅니다.', hint: HINT,
    stats: [
      { k: '지름', v: '4,879 km' }, { k: '태양까지', v: '57.9M km' },
      { k: '표면 중력', v: '3.70 m/s²' }, { k: '자전 주기', v: '58.6 d' },
      { k: '표면 온도', v: '−173–427 °C' }, { k: '위성', v: '0' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 3.6, position: [-235, 0, 6], spin: 0.0006,
      tex: { map: 'mercurymap.jpg', bump: 'mercurybump.jpg' }, bumpScale: 0.04, shininess: 4 },
    camera: { offset: [2, 3, 15], min: 5, max: 60 },
  },
  {
    id: 'venus', nav: 'VENUS', designation: 'VENUS · SOL II', name: 'VENUS',
    blurb: '두꺼운 이산화탄소 대기에 덮인 가장 뜨거운 행성. 표면 기압은 지구의 90배입니다.', hint: HINT,
    stats: [
      { k: '지름', v: '12,104 km' }, { k: '태양까지', v: '108.2M km' },
      { k: '표면 중력', v: '8.87 m/s²' }, { k: '자전 주기', v: '243 d (역행)' },
      { k: '표면 온도', v: '464 °C' }, { k: '위성', v: '0' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 9.2, position: [-120, 0, -6], spin: -0.0002,
      tex: { map: 'venusmap.jpg', bump: 'venusbump.jpg' }, bumpScale: 0.03, shininess: 6 },
    camera: { offset: [2, 4, 25], min: 12, max: 95 },
  },
  {
    id: 'earth', nav: 'EARTH', designation: 'TERRA · SOL III', name: 'EARTH',
    blurb: '생명이 존재하는 유일하게 알려진 행성. 표면의 71%가 액체 물로 덮여 있습니다.', hint: HINT,
    stats: [
      { k: '지름', v: '12,742 km' }, { k: '태양까지', v: '149.6M km' },
      { k: '표면 중력', v: '9.807 m/s²' }, { k: '자전 주기', v: '23h 56m' },
      { k: '평균 기온', v: '15 °C' }, { k: '위성', v: '1 · Luna' },
    ],
    render: { kind: 'earth', base: 'TEX', radius: 10, position: [0, 0, 0], spin: 0.0010,
      tex: { map: 'earth_atmos_2048.jpg', spec: 'earth_specular_2048.jpg', normal: 'earth_normal_2048.jpg' },
      clouds: 'earth_clouds_1024.png', night: 'earth_lights_2048.png',
      atmosphere: { radius: 10.55, color: [0.32, 0.6, 1.0] }, shininess: 18, specular: 0x4a6c92 },
    camera: { offset: [0, 2.5, 27], min: 13, max: 90 },
    pois: [
      { id: 'amazon', name: '아마존 분지', sub: '지구 최대 열대우림 · 산소의 근원', lat: -3, lon: -60 },
      { id: 'sahara', name: '사하라 사막', sub: '세계 최대 고온 사막 · 940만 km²', lat: 23, lon: 13 },
      { id: 'himalaya', name: '히말라야 산맥', sub: '에베레스트 8,849 m · 지구 최고봉', lat: 28, lon: 84 },
      { id: 'reef', name: '그레이트 베리어 리프', sub: '세계 최대 산호초 · 우주에서 보임', lat: -18, lon: 147 },
    ],
  },
  {
    id: 'moon', nav: 'MOON', designation: 'LUNA · EARTH I', name: 'MOON',
    blurb: '지구의 유일한 자연 위성. 밀물과 썰물, 자전축의 안정을 만들어 냅니다.', hint: HINT,
    stats: [
      { k: '지름', v: '3,474 km' }, { k: '지구까지', v: '384,400 km' },
      { k: '표면 중력', v: '1.62 m/s²' }, { k: '공전 주기', v: '27.3 d' },
      { k: '표면 온도', v: '−173–127 °C' }, { k: '분류', v: '자연 위성' },
    ],
    render: { kind: 'planet', base: 'TEX', radius: 2.9, position: [34, 2.5, -8], spin: 0.00035,
      tex: { map: 'moon_1024.jpg', bump: 'moon_1024.jpg' }, bumpScale: 0.06, shininess: 2, color: 0x888888 },
    camera: { offset: [0, 2.5, 11], min: 4.6, max: 45 },
    pois: [
      { id: 'tranq', name: '고요의 바다', sub: '아폴로 11호 최초 유인 착륙 (1969)', lat: 8.5, lon: 31 },
      { id: 'tycho', name: '티코 크레이터', sub: '밝은 광조를 뻗는 절명의 분화구', lat: -43, lon: -11 },
      { id: 'copernicus', name: '코페르니쿠스', sub: '충돌 분화구 · 직경 93 km', lat: 10, lon: -20 },
    ],
  },
  {
    id: 'mars', nav: 'MARS', designation: 'MARS · SOL IV', name: 'MARS',
    blurb: '붉은 산화철 표면의 사막 행성. 태양계 최대 화산과 협곡을 품고 있습니다.', hint: HINT,
    stats: [
      { k: '지름', v: '6,779 km' }, { k: '태양까지', v: '227.9M km' },
      { k: '표면 중력', v: '3.72 m/s²' }, { k: '자전 주기', v: '24h 37m' },
      { k: '평균 기온', v: '−63 °C' }, { k: '위성', v: '2 · Phobos · Deimos' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 5.3, position: [108, 0, 0], spin: 0.0009,
      tex: { map: 'marsmap1k.jpg', bump: 'marsbump1k.jpg' }, bumpScale: 0.12, shininess: 3 },
    camera: { offset: [2, 4, 22], min: 7.5, max: 70 },
    pois: [
      { id: 'olympus', name: '올림푸스 몬스', sub: '태양계 최대 화산 · 높이 21.9 km', lat: 18, lon: -134 },
      { id: 'marineris', name: '마리네리스 협곡', sub: '길이 4,000 km의 대협곡', lat: -14, lon: -59 },
    ],
  },
  {
    id: 'jupiter', nav: 'JUPITER', designation: 'JUPITER · SOL V', name: 'JUPITER',
    blurb: '태양계 최대 가스 행성. 수백 년을 이어온 거대 폭풍, 대적점이 소용돌이칩니다.', hint: HINT,
    stats: [
      { k: '지름', v: '139,820 km' }, { k: '태양까지', v: '778.5M km' },
      { k: '표면 중력', v: '24.79 m/s²' }, { k: '자전 주기', v: '9h 56m' },
      { k: '평균 기온', v: '−108 °C' }, { k: '위성', v: '95+' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 16, position: [238, 0, 0], spin: 0.0017,
      tex: { map: 'jupitermap.jpg' }, shininess: 2, spinMesh: true },
    camera: { offset: [4, 10, 56], min: 24, max: 180 },
  },
  {
    id: 'io', nav: 'IO', designation: 'IO · JUPITER I', name: 'IO',
    blurb: '태양계에서 화산 활동이 가장 활발한 천체. 유황이 표면을 노랗게 물들입니다.', hint: HINT,
    parentNav: 'jupiter',
    stats: [
      { k: '지름', v: '3,643 km' }, { k: '모행성', v: '목성' },
      { k: '공전 주기', v: '1.77 d' }, { k: '표면 중력', v: '1.80 m/s²' },
      { k: '분류', v: '갈릴레이 위성' },
    ],
    render: { kind: 'moon', procedural: 'io', radius: 2.3, parent: 'jupiter', position: [26, 1, 6], spin: 0.002 },
    camera: { offset: [1, 2, 11], min: 4, max: 55 },
  },
  {
    id: 'europa', nav: 'EUROPA', designation: 'EUROPA · JUPITER II', name: 'EUROPA',
    blurb: '얼음 표면 아래 거대한 바다가 있을 것으로 추정되는 위성. 생명 탐사의 핵심 후보입니다.', hint: HINT,
    parentNav: 'jupiter',
    stats: [
      { k: '지름', v: '3,122 km' }, { k: '모행성', v: '목성' },
      { k: '공전 주기', v: '3.55 d' }, { k: '표면 중력', v: '1.31 m/s²' },
      { k: '분류', v: '갈릴레이 위성' },
    ],
    render: { kind: 'moon', procedural: 'europa', radius: 2.0, parent: 'jupiter', position: [-32, 2, 11], spin: 0.0016 },
    camera: { offset: [1, 2, 10], min: 3.5, max: 50 },
  },
  {
    id: 'ganymede', nav: 'GANYMEDE', designation: 'GANYMEDE · JUPITER III', name: 'GANYMEDE',
    blurb: '태양계 최대 위성. 수성보다 크며 자체 자기장을 가집니다.', hint: HINT,
    parentNav: 'jupiter',
    stats: [
      { k: '지름', v: '5,268 km' }, { k: '모행성', v: '목성' },
      { k: '공전 주기', v: '7.15 d' }, { k: '표면 중력', v: '1.43 m/s²' },
      { k: '분류', v: '갈릴레이 위성' },
    ],
    render: { kind: 'moon', procedural: 'ganymede', radius: 2.9, parent: 'jupiter', position: [42, -2, -15], spin: 0.0012 },
    camera: { offset: [1, 2, 13], min: 4.5, max: 60 },
  },
  {
    id: 'callisto', nav: 'CALLISTO', designation: 'CALLISTO · JUPITER IV', name: 'CALLISTO',
    blurb: '태양계에서 가장 많은 충돌구로 뒤덮인 천체. 매우 오래된 표면을 가집니다.', hint: HINT,
    parentNav: 'jupiter',
    stats: [
      { k: '지름', v: '4,821 km' }, { k: '모행성', v: '목성' },
      { k: '공전 주기', v: '16.7 d' }, { k: '표면 중력', v: '1.24 m/s²' },
      { k: '분류', v: '갈릴레이 위성' },
    ],
    render: { kind: 'moon', procedural: 'callisto', radius: 2.7, parent: 'jupiter', position: [-48, 3, -20], spin: 0.0009 },
    camera: { offset: [1, 2, 12], min: 4.5, max: 58 },
  },
  {
    id: 'saturn', nav: 'SATURN', designation: 'SATURN · SOL VI', name: 'SATURN',
    blurb: '얼음과 암석 조각으로 이루어진 장대한 고리를 두른 가스 행성입니다.', hint: HINT,
    stats: [
      { k: '지름', v: '116,460 km' }, { k: '태양까지', v: '1.43B km' },
      { k: '표면 중력', v: '10.44 m/s²' }, { k: '자전 주기', v: '10h 42m' },
      { k: '고리 폭', v: '~282,000 km' }, { k: '위성', v: '146+' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 12.5, position: [430, 0, 0], spin: 0.0014, tilt: 0.47, spinMesh: true,
      tex: { map: 'saturnmap.jpg' }, shininess: 4,
      ring: { inner: 16.5, outer: 31, base: 'PTEX', color: 'saturnringcolor.jpg', alpha: 'saturnringpattern.gif' } },
    camera: { offset: [16, 16, 62], min: 22, max: 190 },
  },
  {
    id: 'titan', nav: 'TITAN', designation: 'TITAN · SATURN VI', name: 'TITAN',
    blurb: '두꺼운 대기와 메탄 호수를 가진 토성 최대 위성. 지구를 닮은 액체 순환이 있습니다.', hint: HINT,
    parentNav: 'saturn',
    stats: [
      { k: '지름', v: '5,150 km' }, { k: '모행성', v: '토성' },
      { k: '공전 주기', v: '15.9 d' }, { k: '표면 중력', v: '1.35 m/s²' },
      { k: '대기', v: '질소 95%' },
    ],
    render: { kind: 'moon', procedural: 'titan', radius: 3.0, parent: 'saturn', position: [48, 4, 13], spin: 0.0011 },
    camera: { offset: [2, 3, 14], min: 5, max: 60 },
  },
  {
    id: 'enceladus', nav: 'ENCELADUS', designation: 'ENCELADUS · SATURN II', name: 'ENCELADUS',
    blurb: '남극에서 물 기둥을 분출하는 얼음 위성. 표면이 태양빛을 거의 다 반사합니다.', hint: HINT,
    parentNav: 'saturn',
    stats: [
      { k: '지름', v: '504 km' }, { k: '모행성', v: '토성' },
      { k: '공전 주기', v: '1.37 d' }, { k: '표면 중력', v: '0.11 m/s²' },
      { k: '반사율', v: '0.99' },
    ],
    render: { kind: 'moon', procedural: 'enceladus', radius: 1.5, parent: 'saturn', position: [-36, 2, -9], spin: 0.0018 },
    camera: { offset: [1, 2, 8], min: 3, max: 40 },
  },
  {
    id: 'uranus', nav: 'URANUS', designation: 'URANUS · SOL VII', name: 'URANUS',
    blurb: '옆으로 누워 자전하는 얼음 거대 행성. 대기의 메탄이 청록빛을 띠게 합니다.', hint: HINT,
    stats: [
      { k: '지름', v: '50,724 km' }, { k: '태양까지', v: '2.87B km' },
      { k: '표면 중력', v: '8.69 m/s²' }, { k: '자전 주기', v: '17h 14m' },
      { k: '자전축', v: '98° (옆으로 누움)' }, { k: '위성', v: '28' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 8.8, position: [600, 0, 0], spin: 0.0013, tilt: 1.71, spinMesh: true,
      tex: { map: 'uranusmap.jpg' }, shininess: 4,
      ring: { inner: 11, outer: 17, base: 'PTEX', color: 'uranusringcolour.jpg', alpha: 'uranusringtrans.gif' } },
    camera: { offset: [6, 8, 42], min: 16, max: 140 },
  },
  {
    id: 'neptune', nav: 'NEPTUNE', designation: 'NEPTUNE · SOL VIII', name: 'NEPTUNE',
    blurb: '태양계에서 가장 먼 행성. 초속 600 m에 이르는 태양계 최강의 바람이 붑니다.', hint: HINT,
    stats: [
      { k: '지름', v: '49,244 km' }, { k: '태양까지', v: '4.50B km' },
      { k: '표면 중력', v: '11.15 m/s²' }, { k: '자전 주기', v: '16h 6m' },
      { k: '평균 기온', v: '−214 °C' }, { k: '위성', v: '16' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 8.4, position: [730, 0, 0], spin: 0.0012,
      tex: { map: 'neptunemap.jpg' }, shininess: 4, spinMesh: true },
    camera: { offset: [4, 8, 40], min: 16, max: 130 },
  },
  {
    id: 'pluto', nav: 'PLUTO', designation: 'PLUTO · KUIPER BELT', name: 'PLUTO',
    blurb: '카이퍼 벨트의 왜소행성. 질소 얼음으로 된 하트 모양 평원, 톰보 영역이 펼쳐집니다.', hint: HINT,
    stats: [
      { k: '지름', v: '2,377 km' }, { k: '태양까지', v: '5.9B km' },
      { k: '표면 중력', v: '0.62 m/s²' }, { k: '공전 주기', v: '248 y' },
      { k: '표면 온도', v: '−229 °C' }, { k: '위성', v: '5 · Charon 외' },
    ],
    render: { kind: 'planet', base: 'PTEX', radius: 2.2, position: [840, 0, 0], spin: 0.0006,
      tex: { map: 'plutomap1k.jpg', bump: 'plutobump1k.jpg' }, bumpScale: 0.05, shininess: 2 },
    camera: { offset: [1, 2, 11], min: 4, max: 45 },
  },
];

// Nav-index lookup helpers shared by the HUD and the scene.
export const NAV = [OVERVIEW.nav, ...BODIES.map((b) => b.nav)];
export function navIndexOfBody(id) {
  const i = BODIES.findIndex((b) => b.id === id);
  return i === -1 ? -1 : i + 1;
}
