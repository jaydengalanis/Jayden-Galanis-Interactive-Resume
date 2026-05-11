import { MeshSurfaceSampler } from 'three/examples/jsm/Addons.js';
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// ─────────────────────────────────────────
// 1. SCENE SETUP
// ─────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.FogExp2(0xc8e8f5, 0.020);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(8.5, 6.2, 10.5);
camera.lookAt(0, 1.2, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// ─────────────────────────────────────────
// 2. SKY DOME
// ─────────────────────────────────────────
const skyGeo = new THREE.SphereGeometry(200, 32, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor:    { value: new THREE.Color(0x3a8fcf) },
    bottomColor: { value: new THREE.Color(0xd0eef8) },
    offset:      { value: 20 },
    exponent:    { value: 0.5 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// ─────────────────────────────────────────
// 3. CLOUDS
// ─────────────────────────────────────────
function createClouds() {
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    transparent: true,
    opacity: 0.88,
  });

  const cloudDefs = [
    [20, 18, -30], [-25, 22, -40], [5, 20, -55], [-10, 16, -20],
    [40, 19, -35], [-40, 21, -50], [15, 23, -65], [-5, 17, -45],
  ];

  cloudDefs.forEach(([x, y, z]) => {
    const group = new THREE.Group();
    const puffCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < puffCount; i++) {
      const r = 1.5 + Math.random() * 2.5;
      const puffGeo = new THREE.SphereGeometry(r, 7, 5);
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 3
      );
      group.add(puff);
    }
    group.position.set(x, y, z);
    group.scale.set(1.5, 0.7, 1.0);
    scene.add(group);
  });
}
createClouds();

// ─────────────────────────────────────────
// 4. LIGHTS
// ─────────────────────────────────────────
const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.8);
sunLight.position.set(30, 60, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
scene.add(sunLight);

const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a7a3a, 1.8);
scene.add(hemi);

const fillLight = new THREE.DirectionalLight(0xc8e8f5, 0.6);
fillLight.position.set(-10, 5, 10);
scene.add(fillLight);

const screenGlow = new THREE.PointLight(0xffcc44, 2.5, 6);
screenGlow.position.set(0, 1.9, 0.2);
scene.add(screenGlow);

const deskFill = new THREE.PointLight(0xffeedd, 0.8, 4);
deskFill.position.set(0, 2.5, 1.5);
scene.add(deskFill);

// ─────────────────────────────────────────
// 5. GLOW PLANE (screen glow visible from afar)
// ─────────────────────────────────────────
const glowPlaneMat = new THREE.MeshStandardMaterial({
  color: 0xebeae9,
  emissive: 0xffaa22,
  emissiveIntensity: 1.2,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,
});
const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), glowPlaneMat);
glowPlane.position.set(0, 1.9, -0.22);
scene.add(glowPlane);

// ─────────────────────────────────────────
// 6. PANEL CONTENT
// ─────────────────────────────────────────
const panels = {
  resume: `
    <div class="panel-label">◈ DOSSIER.TXT</div>
    <div class="panel-heading">Curriculum Vitae</div>
    <div class="divider"></div>
    <div class="resume-section">
      <h3>◆ EDUCATION</h3>
      <div class="resume-item">
        <div class="role">Bachelor of Science — Cybersecurity</div>
        <div class="org">University of Technology Sydney</div>
        <div class="period">2022 – Present  ·  Year 3</div>
        <p>Focused on network security, cloud infrastructure, and software development.</p>
      </div>
    </div>
    <div class="resume-section">
      <h3>◆ SKILLS</h3>
      <div class="skill-tags">
        <span class="tag">Python</span><span class="tag">AWS</span>
        <span class="tag">Networking</span><span class="tag">Linux</span>
        <span class="tag">Firewall Config</span><span class="tag">EFTPOS / ATM</span>
        <span class="tag">Hardware Staging</span><span class="tag">Helpdesk L1/L2</span>
        <span class="tag">Git</span><span class="tag">boto3</span>
      </div>
    </div>
    <div class="resume-section">
      <h3>◆ EXPERIENCE</h3>
      <div class="resume-item">
        <div class="role">Datapack Developer & Community Manager</div>
        <div class="org">Independent · Minecraft Ecosystem</div>
        <div class="period">Ongoing</div>
        <p>Shipped a Minecraft Datapack with 1000+ downloads. Runs end-user support and release cycles across an active Discord community.</p>
      </div>
      <div class="resume-item">
        <div class="role">Python Network Tooling</div>
        <div class="org">Academic & Personal Projects</div>
        <div class="period">2023 – Present</div>
        <p>Network diagnostics and automation scripts. AWS firewall (security groups) via boto3.</p>
      </div>
    </div>
  `,
  projects: `
    <div class="panel-label">◈ PROJECTS.DIR</div>
    <div class="panel-heading">Things I've Built</div>
    <div class="divider"></div>
    <div class="project-card">
      <div class="p-num">01</div>
      <div class="p-body">
        <div class="p-title">Minecraft Datapack</div>
        <div class="p-desc">Custom game mechanics, items, and progression. 1000+ downloads, active Discord, ongoing support.</div>
        <div class="skill-tags"><span class="tag">mcfunction</span><span class="tag">JSON</span><span class="tag">Community</span></div>
      </div>
    </div>
    <div class="project-card">
      <div class="p-num">02</div>
      <div class="p-body">
        <div class="p-title">Python Network Tools</div>
        <div class="p-desc">Diagnostic and automation scripts. AWS security group management, latency monitoring, port scanning.</div>
        <div class="skill-tags"><span class="tag">Python</span><span class="tag">AWS</span><span class="tag">boto3</span></div>
      </div>
    </div>
    <div class="project-card">
      <div class="p-num">03</div>
      <div class="p-body">
        <div class="p-title">This 3D Portfolio</div>
        <div class="p-desc">Interactive scene built with Three.js and a custom Blender model. You're inside it right now.</div>
        <div class="skill-tags"><span class="tag">Three.js</span><span class="tag">Blender</span><span class="tag">WebGL</span></div>
      </div>
    </div>
  `,
  hobbies: `
    <div class="panel-label">◈ PERSONAL.LOG</div>
    <div class="panel-heading">Life Beyond the Terminal</div>
    <div class="divider"></div>
    <div class="hobby-grid">
      <div class="hobby-item"><div class="h-icon">⛏</div><div class="h-label">Minecraft</div><div class="h-desc">Modding & datapacks</div></div>
      <div class="hobby-item"><div class="h-icon">🔐</div><div class="h-label">CTF Challenges</div><div class="h-desc">Security puzzles</div></div>
      <div class="hobby-item"><div class="h-icon">🎮</div><div class="h-label">Gaming</div><div class="h-desc">Strategy & sandbox</div></div>
      <div class="hobby-item"><div class="h-icon">☁️</div><div class="h-label">Cloud Tinkering</div><div class="h-desc">AWS home lab</div></div>
      <div class="hobby-item"><div class="h-icon">🌐</div><div class="h-label">Communities</div><div class="h-desc">Building online spaces</div></div>
      <div class="hobby-item"><div class="h-icon">📚</div><div class="h-label">Self-Learning</div><div class="h-desc">Always something new</div></div>
    </div>
  `,
  contact: `
    <div class="panel-label">◈ CONTACT.SYS</div>
    <div class="panel-heading">Get In Touch</div>
    <div class="divider"></div>
    <p class="contact-intro">Seeking entry-level IT and helpdesk roles in Sydney. Open to hybrid and remote.</p>
    <div class="contact-list">
      <div class="contact-row"><span class="c-icon">✉</span><div><div class="c-label">Electronic Mail</div><div class="c-val">flame@example.com</div></div></div>
      <div class="contact-row"><span class="c-icon">◈</span><div><div class="c-label">LinkedIn</div><div class="c-val">linkedin.com/in/flame</div></div></div>
      <div class="contact-row"><span class="c-icon">◉</span><div><div class="c-label">GitHub</div><div class="c-val">github.com/flame</div></div></div>
      <div class="contact-row"><span class="c-icon">◎</span><div><div class="c-label">Location</div><div class="c-val">Sydney, NSW — Australia</div></div></div>
    </div>
  `,
};

// ─────────────────────────────────────────
// 7. SCREEN HTML (must be before CSS3DObject)
// ─────────────────────────────────────────
const screenDiv = document.createElement('div');
screenDiv.id = 'screen-root';
screenDiv.innerHTML = `
  <div class="screen-inner">
    <div class="crt-lines"></div>
    <div class="screen-header">
      <div class="header-left">
        <span class="header-dot"></span>
        <span class="header-dot"></span>
        <span class="header-dot"></span>
      </div>
      <div class="header-title">FLAME-OS  v1.0.3</div>
      <div class="header-right">SYD/AU</div>
    </div>
    <div class="screen-body">
      <div class="welcome-block">
        <div class="welcome-pre">WELCOME TO</div>
        <div class="name-display">FLAME<span class="cursor">█</span></div>
        <div class="welcome-sub">CYBERSECURITY · UTS · AVAILABLE FOR HIRE</div>
      </div>
      <div class="nav-grid">
        <button class="nav-btn" data-panel="resume">
          <span class="btn-num">F1</span>
          <span class="btn-icon">▤</span>
          <span class="btn-label">RESUME</span>
          <span class="btn-desc">Experience & Skills</span>
        </button>
        <button class="nav-btn" data-panel="projects">
          <span class="btn-num">F2</span>
          <span class="btn-icon">◈</span>
          <span class="btn-label">PROJECTS</span>
          <span class="btn-desc">Things I've Built</span>
        </button>
        <button class="nav-btn" data-panel="hobbies">
          <span class="btn-num">F3</span>
          <span class="btn-icon">◉</span>
          <span class="btn-label">HOBBIES</span>
          <span class="btn-desc">Life & Interests</span>
        </button>
        <button class="nav-btn" data-panel="contact">
          <span class="btn-num">F4</span>
          <span class="btn-icon">✦</span>
          <span class="btn-label">CONTACT</span>
          <span class="btn-desc">Get In Touch</span>
        </button>
      </div>
      <div class="status-row">
        <span class="status-pill"><span class="blink-dot"></span>ONLINE</span>
        <span>UTS CYBERSECURITY · YEAR 3</span>
        <span class="status-time" id="screen-clock">--:--:--</span>
      </div>
    </div>
    <div id="panel-overlay" style="display:none;">
      <div class="panel-box">
        <button class="panel-close" id="panel-close-btn">[ CLOSE ]</button>
        <div id="panel-content"></div>
      </div>
    </div>
  </div>
`;

// Clock
setInterval(() => {
  const el = document.getElementById('screen-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-AU', { hour12: false });
}, 1000);

// Nav buttons
screenDiv.addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-btn');
  if (btn) {
    const id = btn.dataset.panel;
    document.getElementById('panel-content').innerHTML = panels[id];
    document.getElementById('panel-overlay').style.display = 'flex';
  }
  if (e.target.id === 'panel-close-btn' || e.target.id === 'panel-overlay') {
    document.getElementById('panel-overlay').style.display = 'none';
  }
});

// ─────────────────────────────────────────
// 8. CSS3D OBJECT (created AFTER screenDiv exists)
// ─────────────────────────────────────────
const cssObject = new CSS3DObject(screenDiv);
cssObject.visible = false;
// Position and scale are set by the loader once ScreenPlane is found
scene.add(cssObject);

// ─────────────────────────────────────────
// 9. CSS3D RENDERER
// ─────────────────────────────────────────
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'fixed';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(cssRenderer.domElement);

// ─────────────────────────────────────────
// 10. GRASS FUNCTION
// ─────────────────────────────────────────
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('grass.png');

function createGrass(surfaceMesh) {
  const grassCount = 15000;
  const grassGeo = new THREE.PlaneGeometry(0.22, 0.45);
  const grassMat = new THREE.MeshStandardMaterial({
    map: grassTexture,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    color: 0x88cc66,
  });

  const grassMesh = new THREE.InstancedMesh(grassGeo, grassMat, grassCount);
  grassMesh.castShadow = false;
  grassMesh.receiveShadow = true;

  const sampler = new MeshSurfaceSampler(surfaceMesh).build();
  const dummy = new THREE.Object3D();
  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < grassCount; i++) {
    sampler.sample(position, normal);
    position.applyMatrix4(surfaceMesh.matrixWorld);
    dummy.position.copy(position);
    dummy.lookAt(position.clone().add(normal));
    dummy.rotateX(Math.PI / 2);
    dummy.rotation.z += (Math.random() - 0.5) * 0.3;
    dummy.rotation.y = Math.random() * Math.PI;
    const s = 0.6 + Math.random() * 0.8;
    dummy.scale.set(s, s, s);
    dummy.position.y += 0.02;
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);
  }
  grassMesh.instanceMatrix.needsUpdate = true;
  scene.add(grassMesh);
}

// ─────────────────────────────────────────
// 11. LOADERS (single GLTFLoader, both files)
// ─────────────────────────────────────────
const loader = new GLTFLoader();
let SCREEN_CAM_POS = new THREE.Vector3();
let SCREEN_CAM_LOOK = new THREE.Vector3();
let lakeRef = null;

// ── Landscape ──
loader.load(
  'landscape_portfolio14.glb',
  (gltf) => {
    const landscape = gltf.scene;
    landscape.traverse(child => {
      if (child.isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.name === 'Lake') {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x3a9fd5,
            roughness: 0.05,
            metalness: 0.4,
            transparent: true,
            opacity: 0.78,
          });
          lakeRef = child;
        }
      }
    });
    scene.add(landscape);

    let terrainMesh = null;
    landscape.traverse(child => {
      if (child.isMesh && child.name === 'Terrain') terrainMesh = child;
    });
    if (terrainMesh) createGrass(terrainMesh);
  },
  (xhr) => console.log('Landscape: ' + (xhr.loaded / xhr.total * 100).toFixed(1) + '%'),
  (error) => console.error('❌ Landscape failed:', error)
);

// ── Desk model ──
loader.load(
  'VintageTexture5.glb',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.envMapIntensity = 1;
          child.material.needsUpdate = true;
        }
      }
    });
    scene.add(model);
    console.log('✅ Desk model loaded');

    const screenRef = model.getObjectByName('ScreenPlane');
    if (screenRef) {
      console.log('✅ ScreenPlane found');

      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(screenRef);
      const screenSize = new THREE.Vector3();
      box.getSize(screenSize);
      console.log('📐 ScreenPlane world size:', screenSize);

      const CSS_W = 1024;
      const CSS_H = 931;
      const scaleX = screenSize.x / CSS_W;
      const scaleY = screenSize.y / CSS_H;
      const scale = Math.min(scaleX, scaleY);
      cssObject.scale.setScalar(scale);

      screenRef.getWorldPosition(cssObject.position);
      screenRef.getWorldQuaternion(cssObject.quaternion);

      const nudge = new THREE.Vector3(0, 0, 0.003);
      nudge.applyQuaternion(cssObject.quaternion);
      cssObject.position.add(nudge);

      glowPlane.position.copy(cssObject.position);
      glowPlane.quaternion.copy(cssObject.quaternion);
      glowPlane.scale.set(screenSize.x, screenSize.y, 1);

      const camOffset = new THREE.Vector3(0, 0, 0.8);
      camOffset.applyQuaternion(cssObject.quaternion);
      SCREEN_CAM_POS.copy(cssObject.position).add(camOffset);
      SCREEN_CAM_LOOK.copy(cssObject.position);

      screenRef.visible = false;
    } else {
      console.warn('⚠️ No ScreenPlane found — using defaults');
      SCREEN_CAM_POS.set(0, 1.9, 1.0);
      SCREEN_CAM_LOOK.set(0, 1.9, -0.25);
    }
  },
  (xhr) => console.log('Desk: ' + (xhr.loaded / xhr.total * 100).toFixed(1) + '%'),
  (error) => console.error('❌ Desk failed:', error)
);

// ─────────────────────────────────────────
// 12. ORBIT CONTROLS + ZOOM
// ─────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0.425);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.0;
controls.maxDistance = 15.25;
controls.maxPolarAngle = Math.PI / 2;
controls.update();

let isZoomedIn = false;
const ZOOM_THRESHOLD = 5;

controls.addEventListener('change', () => {
  if (isZoomedIn) return;
  const dist = camera.position.distanceTo(controls.target);
  if (dist < ZOOM_THRESHOLD) triggerZoomIn();
});

function triggerZoomIn() {
  isZoomedIn = true;
  cssObject.visible = true;
  controls.enabled = false;
  cssRenderer.domElement.style.pointerEvents = 'all';
  document.getElementById('back-btn').style.opacity = '1';
  document.getElementById('back-btn').style.pointerEvents = 'all';
  document.getElementById('hint').style.opacity = '0';
}

function triggerZoomOut() {
  isZoomedIn = false;
  cssObject.visible = false;
  controls.enabled = true;
  cssRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('back-btn').style.opacity = '0';
  document.getElementById('back-btn').style.pointerEvents = 'none';
  document.getElementById('hint').style.opacity = '1';
  camera.position.set(4.5, 3.2, 5.5);
  controls.target.set(0, 1.2, 0);
  controls.update();
}

document.getElementById('back-btn').addEventListener('click', triggerZoomOut);

// ─────────────────────────────────────────
// 13. RESIZE
// ─────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────
// 14. AUDIO
// ─────────────────────────────────────────
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

let isMuted = false;
let audioReady = false;

function initAudio() {
  if (audioReady) return;
  audioReady = true;
  if (listener.context.state === 'suspended') {
    listener.context.resume();
  }
  audioLoader.load('frutiger_aero.mp3', (buffer) => {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(isMuted ? 0 : 1);
    sound.play();
  });
}

document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

const muteBtn = document.getElementById('mute-btn');
const iconSound = document.getElementById('icon-sound');
const iconMute = document.getElementById('icon-mute');
const muteLabel = document.getElementById('mute-label');

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  iconSound.style.display = isMuted ? 'none' : 'block';
  iconMute.style.display  = isMuted ? 'block' : 'none';
  muteLabel.textContent = isMuted ? 'MUTED' : 'SOUND';
  muteBtn.classList.toggle('muted', isMuted);
  if (sound.buffer) sound.setVolume(isMuted ? 0 : 1);
});

// ─────────────────────────────────────────
// 15. ANIMATE
// ─────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Screen glow pulse
  screenGlow.intensity = 2.2 + Math.sin(t * 2.1) * 0.35 + Math.sin(t * 7.3) * 0.08;
  glowPlaneMat.opacity = 0.3 + Math.sin(t * 1.8) * 0.08;
  glowPlaneMat.emissiveIntensity = 1.0 + Math.sin(t * 2.1) * 0.3;

  // Clouds drift slowly
  sky.rotation.y = t * 0.002;

  // Camera lerp to screen on zoom
  if (isZoomedIn && SCREEN_CAM_POS.length() > 0) {
    camera.position.lerp(SCREEN_CAM_POS, 0.06);
    controls.target.lerp(SCREEN_CAM_LOOK, 0.06);
  }

  controls.update();
  renderer.render(scene, camera);
  cssRenderer.render(scene, camera);
}

animate();