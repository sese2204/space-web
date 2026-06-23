// Shared constants for the Exoscape 3D solar-system scene.

// Texture CDNs. Both are GitHub repos mirrored through jsDelivr, which serves
// them with `Access-Control-Allow-Origin: *` — required so WebGL can sample
// them as textures from any origin.
export const TEX = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r155/examples/textures/planets/';
export const PTEX = 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/';

// Real Milky Way panorama used as the deep-space backdrop.
export const GALAXY_TEX = PTEX + 'galaxy_starfield.png';

// Pre-processed naked-eye star catalogue (HYG, mag <= 6.0), bundled locally
// because the full catalogue is 34 MB.
export const STARS_URL = new URL('./data/stars.json', import.meta.url).href;

// Direction from the scene origin toward the sun. The directional light and the
// visible sun body share this so lit hemispheres line up with the glowing star.
export const SUN_DIR = [-1, 0.12, 0.06];
export const SUN_DISTANCE = 340;
