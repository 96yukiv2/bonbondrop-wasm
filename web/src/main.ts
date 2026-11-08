import "./style.css";
import * as THREE from "three";
import init, { dent, peel_height, Spring } from "bonbondrop";

async function main() {
  await init();
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `<main class="layout"><header><div class="eyebrow">A LITTLE STICKER MOMENT</div><h1>ぷくっと、ハチワレ。</h1><p>押したり、はがしたり。小さなシールと遊ぼう。</p></header><section class="stage" aria-label="シールの台紙"><div class="stage-label">STICKER SHEET <span>01 / 01</span></div><div id="canvas"></div><div class="hint"><span>☝</span> 押すとぷにっ <i></i> ドラッグではがして、好きな場所へ</div></section><footer><button id="reset" type="button">↺　もとの位置にもどす</button><p>ちいかわ ボンボンドロップシール（ハチワレ）を参考にした個人制作</p></footer></main>`;
  const container = document.querySelector<HTMLDivElement>("#canvas")!;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, 0.1, 100);
  camera.position.set(0, 0, 10);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // The printed illustration is drawn locally; no product artwork is bundled.
  const art = document.createElement("canvas"); art.width = art.height = 1024;
  const c = art.getContext("2d")!;
  c.fillStyle = "#fdfcfa"; c.fillRect(0, 0, 1024, 1024);
  c.fillStyle = "#78bce6";
  c.beginPath(); c.moveTo(70, 0); c.lineTo(954, 0); c.lineTo(875, 325);
  c.bezierCurveTo(760, 375, 630, 325, 512, 245);
  c.bezierCurveTo(395, 325, 264, 375, 148, 325); c.closePath(); c.fill();
  c.strokeStyle = "#5685a2"; c.lineWidth = 9; c.lineCap = "round";
  // Short eyebrows, round eyes and their tiny highlights.
  for (const x of [365, 660]) {
    c.beginPath(); c.moveTo(x - 28, 430); c.quadraticCurveTo(x, 415, x + 25, 430); c.stroke();
    c.fillStyle = "#323438"; c.beginPath(); c.ellipse(x, 520, 28, 34, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "white"; c.beginPath(); c.arc(x - 8, 507, 9, 0, Math.PI * 2); c.fill();
  }
  c.strokeStyle = "#c88193"; c.lineWidth = 10;
  for (const x of [252, 744]) for (let j = 0; j < 3; j++) { c.beginPath(); c.moveTo(x + j * 20, 556); c.lineTo(x + j * 20 - 9, 579); c.stroke(); }
  c.strokeStyle = "#4a4142"; c.lineWidth = 10; c.beginPath(); c.moveTo(485, 585); c.quadraticCurveTo(512, 612, 539, 585); c.moveTo(512, 600); c.quadraticCurveTo(499, 634, 478, 615); c.moveTo(512, 600); c.quadraticCurveTo(525, 634, 546, 615); c.stroke();
  const texture = new THREE.CanvasTexture(art); texture.colorSpace = THREE.SRGBColorSpace;

  // A rounded face with two little ears, modelled as concentric rings.
  const rings = 32, segments = 128;
  const xyz: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let r = 0; r <= rings; r++) for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2, radius = r / rings;
    const x = Math.cos(t), y = Math.sin(t);
    const ears = y > 0 ? 0.27 * (Math.exp(-Math.pow((x - .68) / .19, 2)) + Math.exp(-Math.pow((x + .68) / .19, 2))) : 0;
    const px = x * radius * 1.12, py = (y * .95 + ears) * radius;
    const z = .06 + .29 * Math.pow(Math.max(0, 1 - radius * radius), .55);
    xyz.push(px, py, z); uv.push((px / 2.5) + .5, (py / 2.5) + .5);
    if (r < rings && i < segments) { const a = r * (segments + 1) + i, b = a + segments + 1; indices.push(a, a + 1, b, a + 1, b + 1, b); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(xyz, 3)); geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const material = new THREE.MeshPhysicalMaterial({ map: texture, roughness: .18, metalness: 0, clearcoat: 1, clearcoatRoughness: .06, side: THREE.DoubleSide });
  const sticker = new THREE.Mesh(geometry, material); scene.add(sticker);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2d8ef, 2.2));
  const light = new THREE.DirectionalLight(0xffffff, 2.4); light.position.set(-2, 4, 6); scene.add(light);

  const ray = new THREE.Raycaster(), pointer = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const point = new THREE.Vector3(), local = new THREE.Vector3();
  const pressSpring = new Spring(), liftSpring = new Spring();
  const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
  const original = new Float32Array(positions.array as Float32Array);
  let pressed = false, dragging = false, activePointer: number | null = null;
  let startX = 0, startY = 0, centerX = 0, centerY = 0, touchX = 0, touchY = 0, directionX = 1, directionY = 0;
  let origin = new THREE.Vector3();
  function world(e: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera); ray.ray.intersectPlane(plane, point); return point;
  }
  renderer.domElement.addEventListener("pointerdown", e => {
    if (activePointer !== null) return;
    world(e); const hit = ray.intersectObject(sticker)[0]; if (!hit) return;
    activePointer = e.pointerId; pressed = true; dragging = false;
    startX = e.clientX; startY = e.clientY; centerX = sticker.position.x; centerY = sticker.position.y;
    origin = point.clone(); local.copy(hit.point).sub(sticker.position); touchX = local.x; touchY = local.y;
    const length = Math.hypot(touchX, touchY) || 1; directionX = touchX / length; directionY = touchY / length;
    renderer.domElement.setPointerCapture(e.pointerId); renderer.domElement.classList.add("active");
  });
  renderer.domElement.addEventListener("pointermove", e => {
    if (e.pointerId !== activePointer) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) { dragging = true; pressed = false; }
    if (dragging) { world(e); sticker.position.x = THREE.MathUtils.clamp(centerX + point.x - origin.x, camera.left + 1.15, camera.right - 1.15); sticker.position.y = THREE.MathUtils.clamp(centerY + point.y - origin.y, camera.bottom + 1.2, camera.top - 1.2); }
  });
  const release = (e: PointerEvent) => { if (e.pointerId !== activePointer) return; activePointer = null; pressed = false; dragging = false; renderer.domElement.classList.remove("active"); };
  renderer.domElement.addEventListener("pointerup", release); renderer.domElement.addEventListener("pointercancel", release); renderer.domElement.addEventListener("lostpointercapture", release);
  document.querySelector<HTMLButtonElement>("#reset")!.addEventListener("click", () => { sticker.position.set(0, 0, 0); pressed = false; dragging = false; activePointer = null; });
  function resize() { const w = container.clientWidth, h = container.clientHeight; const aspect = w / h; const view = aspect < 1.15 ? 4.4 : 3.7; camera.left = -view * aspect / 2; camera.right = view * aspect / 2; camera.top = view / 2; camera.bottom = -view / 2; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  new ResizeObserver(resize).observe(container); resize();
  let previous = performance.now();
  function animate(now: number) {
    const dt = Math.min((now - previous) / 1000, 1 / 30); previous = now;
    const compression = pressSpring.step(dt, pressed ? 1 : 0), lift = liftSpring.step(dt, dragging ? 1 : 0);
    for (let i = 0; i < positions.count; i++) { const x = original[i * 3], y = original[i * 3 + 1], z = original[i * 3 + 2]; const distance = Math.hypot(x - touchX, y - touchY); positions.setZ(i, Math.max(.025, z + dent(distance) * compression * .65) + peel_height((x * directionX + y * directionY) / 1.2, lift)); }
    positions.needsUpdate = true; geometry.computeVertexNormals(); geometry.computeBoundingSphere(); renderer.render(scene, camera); requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
main().catch(error => { console.error(error); document.querySelector<HTMLDivElement>("#app")!.innerHTML = '<p class="error">シールを読み込めませんでした。ページを再読み込みしてください。</p>'; });
