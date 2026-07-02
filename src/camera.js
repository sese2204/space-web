// OrbitControls wrapper with smooth fly-to between camera stations. A station is
// a resolved { pos, look, min, max } (the scene computes it live, so it works
// whether bodies are parked in a line or orbiting).
export function createCameraController(THREE, controls, station0) {
  let flying = false;
  let pendingBounds = null;
  const flyPos = new THREE.Vector3();
  const flyTarget = new THREE.Vector3();

  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.6;
  controls.screenSpacePanning = true;
  controls.target.copy(station0.look);
  controls.minDistance = station0.min;
  controls.maxDistance = station0.max;
  controls.object.position.copy(station0.pos);

  function flyTo(S) {
    if (!S) return;
    flyPos.copy(S.pos);
    flyTarget.copy(S.look);
    pendingBounds = { min: S.min, max: S.max };
    flying = true;
    controls.enabled = false;
    // Widen bounds while travelling so the lerp isn't clamped mid-flight.
    controls.minDistance = 0.1;
    controls.maxDistance = 4000;
  }

  function update() {
    if (flying) {
      controls.object.position.lerp(flyPos, 0.06);
      controls.target.lerp(flyTarget, 0.06);
      if (controls.object.position.distanceTo(flyPos) < 0.6) {
        flying = false;
        controls.enabled = true;
        if (pendingBounds) {
          controls.minDistance = pendingBounds.min;
          controls.maxDistance = pendingBounds.max;
        }
      }
    }
    controls.update();
  }

  return { flyTo, update, isFlying: () => flying };
}
