import "./style.css";
import * as THREE from "three";
import init, { dent, Spring } from "bonbondrop";

async function main(): Promise<void> {
  await init();

  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) throw new Error("#app not found");
  app.innerHTML = "";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f4f5);

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 2.5, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.touchAction = "none";
  app.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(
    1.5,
    64,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );

  const material = new THREE.MeshPhysicalMaterial({
    color: 0xff80b5,
    roughness: 0.15,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    side: THREE.DoubleSide,
  });

  const sticker = new THREE.Mesh(geometry, material);
  scene.add(sticker);

  const positions = geometry.getAttribute("position");
  const original = new Float32Array(positions.array as Float32Array);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(2, 4, 5);
  scene.add(light);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const vertex = new THREE.Vector3();

  const spring = new Spring();
  let pressed = false;
  let touchCenter: THREE.Vector3 | null = null;
  let previousFrame = performance.now();

  renderer.domElement.addEventListener("pointerdown", (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(sticker)[0];
    if (!hit) return;

    touchCenter = sticker.worldToLocal(hit.point.clone());
    pressed = true;
    renderer.domElement.setPointerCapture(event.pointerId);
  });

  const release = () => {
    pressed = false;
  };
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointercancel", release);
  renderer.domElement.addEventListener("lostpointercapture", release);

  function animate(now: number) {
    const dt = Math.min((now - previousFrame) / 1000, 1 / 30);
    previousFrame = now;

    // Rust integrates the spring's position and velocity each frame.
    const compression = spring.step(dt, pressed ? 1 : 0);
    if (touchCenter !== null) {
      for (let i = 0; i < positions.count; i++) {
        vertex.fromArray(original, i * 3);
        const offset = dent(vertex.distanceTo(touchCenter)) * compression;
        positions.setY(i, vertex.y + offset);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

main().catch(console.error);
