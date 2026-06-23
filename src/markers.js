// Surface POI markers: small DOM buttons projected onto the canvas each frame,
// anchored to lat/lon points on a body. They fade based on whether the point
// faces the camera and we're parked at the owning station.
function latLon(THREE, lat, lon, R) {
  const la = lat * Math.PI / 180, lo = lon * Math.PI / 180;
  return new THREE.Vector3(
    R * Math.cos(la) * Math.cos(lo),
    R * Math.sin(la),
    -R * Math.cos(la) * Math.sin(lo)
  );
}

export function createMarkers(THREE, labelHost, placed, onSelect) {
  const labels = [];
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), q1 = new THREE.Quaternion();

  // `placed` items: { body, group } — only those with pois get markers.
  for (const { body, group } of placed) {
    const pois = body.pois;
    if (!pois) continue;
    const R = body.render.radius;
    for (const p of pois) {
      const local = latLon(THREE, p.lat, p.lon, R * 1.008);
      const anchor = new THREE.Object3D();
      anchor.position.copy(local);
      group.add(anchor);

      const el = document.createElement('button');
      el.className = 'poi-marker';
      const dot = document.createElement('span');
      dot.className = 'poi-dot';
      const tag = document.createElement('span');
      tag.className = 'poi-tag';
      tag.textContent = p.name;
      el.append(dot, tag);
      el.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onSelect(p); });
      labelHost.appendChild(el);

      labels.push({ el, dot, tag, anchor, group, stationIdx: body.navIndex, id: p.id, normal: local.clone().normalize() });
    }
  }

  function update(camera, targetStation, flying, currentPoiId, w, h) {
    for (let i = 0; i < labels.length; i++) {
      const L = labels[i];
      const wp = L.anchor.getWorldPosition(v1);
      const wn = v2.copy(L.normal).applyQuaternion(L.group.getWorldQuaternion(q1));
      const toCam = v3.copy(camera.position).sub(wp).normalize();
      const facing = wn.dot(toCam);
      const onStation = targetStation === L.stationIdx && !flying;
      const proj = wp.project(camera); // wp (=v1) is mutated to NDC here
      const inView = proj.z < 1 && proj.x > -1.1 && proj.x < 1.1 && proj.y > -1.1 && proj.y < 1.1;
      let op = 0;
      if (onStation && inView && facing > 0.04) op = Math.min(1, (facing - 0.04) * 3.4);
      const active = currentPoiId === L.id;
      if (op > 0.01) {
        const x = (proj.x * 0.5 + 0.5) * w, y = (-proj.y * 0.5 + 0.5) * h;
        L.el.style.transform = 'translate(' + x + 'px, ' + y + 'px) translateY(-50%)';
        L.el.style.opacity = active ? 1 : op;
        L.el.style.pointerEvents = op > 0.45 ? 'auto' : 'none';
        L.dot.style.transform = active ? 'scale(1.55)' : 'scale(1)';
        L.tag.style.color = active ? '#7fb8ff' : '#eaf1fb';
      } else if (L.el.style.opacity !== '0') {
        L.el.style.opacity = '0';
        L.el.style.pointerEvents = 'none';
        L.el.style.transform = 'translate(-9999px,-9999px)';
      }
    }
  }

  return { labels, update };
}
