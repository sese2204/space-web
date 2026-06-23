// OrbitControls wrapper that adds smooth fly-to between camera stations. Each
// station is { pos, look, min, max } (THREE.Vector3 + zoom bounds).
export function createCameraController(THREE, controls, stations) {
  let flying = false;
  let pendingBounds = null;
  const flyPos = new THREE.Vector3();
  const flyTarget = new THREE.Vector3();

  const S0 = stations[0];
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.6;
  controls.screenSpacePanning = true;
  controls.target.copy(S0.look);
  controls.minDistance = S0.min;
  controls.maxDistance = S0.max;
  controls.object.position.copy(S0.pos);

  function flyTo(i) {
    const S = stations[i];
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
