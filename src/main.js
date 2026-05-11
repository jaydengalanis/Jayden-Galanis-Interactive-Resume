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
// 6. SCREEN HTML — Retro OS Desktop
// Replace sections 6 + 7 in main.js with this entire block
// ─────────────────────────────────────────
 
const screenDiv = document.createElement('div');
screenDiv.id = 'screen-root';
screenDiv.innerHTML = `
  <div class="os-desktop">
 
    <!-- BOOT SCREEN (fades after 2.2s) -->
    <div class="os-boot">
      <div class="boot-logo">JAYDEN'S RESUME</div>
      <div class="boot-sub">Version 1.0.3  —  Cybersecurity Student</div>
      <div class="boot-bar-track"><div class="boot-bar-fill"></div></div>
      <div class="boot-text">Loading user profile...</div>
    </div>
 
    <!-- DESKTOP ICONS -->
    <div class="desktop-icons">
      <div class="desktop-icon" data-win="win-resume">
        <div class="icon-img">📄</div>
        <div class="icon-label">Resume.txt</div>
      </div>
      <div class="desktop-icon" data-win="win-skills">
        <div class="icon-img">💾</div>
        <div class="icon-label">My Skills.txt</div>
      </div>
      <div class="desktop-icon" data-win="win-projects">
        <div class="icon-img">📁</div>
        <div class="icon-label">Projects</div>
      </div>
      <div class="desktop-icon" data-win="win-hobbies">
        <div class="icon-img">🎮</div>
        <div class="icon-label">Hobbies.exe</div>
      </div>
      <div class="desktop-icon" data-win="win-contact">
        <div class="icon-img">📡</div>
        <div class="icon-label">Contact.sys</div>
      </div>
    </div>
 
    <!-- ══ WINDOWS ══ -->
 
    <!-- RESUME WINDOW -->
    <div class="os-window" id="win-resume" style="top:60px; left:100px; width:520px;">
      <div class="win-titlebar">
        <div class="win-titlebar-left">
          <span class="win-icon">📄</span>
          <span class="win-title">Resume.txt — Notepad</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn">_</button>
          <button class="win-ctrl-btn">□</button>
          <button class="win-ctrl-btn close-btn" data-close="win-resume">✕</button>
        </div>
      </div>
      <div class="win-menubar">
        <span class="win-menu-item">File</span>
        <span class="win-menu-item">Edit</span>
        <span class="win-menu-item">View</span>
        <span class="win-menu-item">Help</span>
      </div>
      <div class="win-body">
        <div class="txt-viewer">═══════════════════════════════════════
  RESUME.TXT — Flame Galanis
  Cybersecurity Student @ UTS, Sydney AU
═══════════════════════════════════════
 
EDUCATION
─────────────────────────────────────
  Degree:   Bachelor of Science (Cybersecurity)
  Uni:      University of Technology Sydney
  Year:     Year 3 (2022 – Present)
  Focus:    Network Security, Cloud, Software Dev
 
EXPERIENCE
─────────────────────────────────────
  [1] Datapack Developer & Community Manager
      Independent · Minecraft Ecosystem
      • Shipped datapack with 1000+ downloads
      • Manages Discord community & support
      • Custom mechanics, items, progression
 
  [2] Python Network Tooling
      Academic & Personal Projects (2023–Now)
      • Network diagnostics & automation
      • AWS security groups via boto3
      • Port scanning & latency monitoring
 
  [3] Hardware & IT Support
      • EFTPOS/ATM staging & deployment
      • Helpdesk L1/L2 support
      • Hardware imaging and configuration
 
EDUCATION HIGHLIGHTS
─────────────────────────────────────
  • Network Security fundamentals
  • Cloud infrastructure (AWS)
  • Firewall configuration
  • Linux administration
  • Software development (Python, JS)
 
═══════════════════════════════════════
  [Open My Skills.txt for skill ratings]
═══════════════════════════════════════</div>
      </div>
      <div class="win-statusbar">
        <span>Ln 1, Col 1</span>
        <span>100%</span>
        <span>UTF-8</span>
      </div>
    </div>
 
    <!-- SKILLS WINDOW -->
    <div class="os-window" id="win-skills" style="top:80px; left:130px; width:460px;">
      <div class="win-titlebar">
        <div class="win-titlebar-left">
          <span class="win-icon">💾</span>
          <span class="win-title">My Skills.txt — Notepad</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn">_</button>
          <button class="win-ctrl-btn">□</button>
          <button class="win-ctrl-btn close-btn" data-close="win-skills">✕</button>
        </div>
      </div>
      <div class="win-menubar">
        <span class="win-menu-item">File</span>
        <span class="win-menu-item">Edit</span>
        <span class="win-menu-item">View</span>
      </div>
      <div class="win-body">
        <div style="font-family:'VT323',monospace; font-size:20px; color:#000080; margin-bottom:10px;">
          ══ SKILL ASSESSMENT v1.0 ══
        </div>
        <div class="skill-line"><span class="skill-name">Python</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:80%"></div></div><span class="skill-pct">80%</span></div>
        <div class="skill-line"><span class="skill-name">AWS / Cloud</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:65%"></div></div><span class="skill-pct">65%</span></div>
        <div class="skill-line"><span class="skill-name">Networking</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:75%"></div></div><span class="skill-pct">75%</span></div>
        <div class="skill-line"><span class="skill-name">Linux</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:70%"></div></div><span class="skill-pct">70%</span></div>
        <div class="skill-line"><span class="skill-name">Firewall Config</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:60%"></div></div><span class="skill-pct">60%</span></div>
        <div class="skill-line"><span class="skill-name">Git</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:72%"></div></div><span class="skill-pct">72%</span></div>
        <div class="skill-line"><span class="skill-name">Helpdesk L1/L2</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:85%"></div></div><span class="skill-pct">85%</span></div>
        <div class="skill-line"><span class="skill-name">Hardware Staging</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:78%"></div></div><span class="skill-pct">78%</span></div>
        <div class="skill-line"><span class="skill-name">EFTPOS / ATM</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:70%"></div></div><span class="skill-pct">70%</span></div>
        <div class="skill-line"><span class="skill-name">Three.js / WebGL</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:55%"></div></div><span class="skill-pct">55%</span></div>
        <div class="skill-line"><span class="skill-name">Blender</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:50%"></div></div><span class="skill-pct">50%</span></div>
        <div class="skill-line"><span class="skill-name">mcfunction / JSON</span><div class="skill-bar-track"><div class="skill-bar-fill" style="width:88%"></div></div><span class="skill-pct">88%</span></div>
      </div>
      <div class="win-statusbar">
        <span>12 skills loaded</span>
        <span>Ready</span>
      </div>
    </div>
 
    <!-- PROJECTS WINDOW -->
    <div class="os-window" id="win-projects" style="top:50px; left:110px; width:540px;">
      <div class="win-titlebar">
        <div class="win-titlebar-left">
          <span class="win-icon">📁</span>
          <span class="win-title">Projects — File Explorer</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn">_</button>
          <button class="win-ctrl-btn">□</button>
          <button class="win-ctrl-btn close-btn" data-close="win-projects">✕</button>
        </div>
      </div>
      <div class="win-menubar">
        <span class="win-menu-item">File</span>
        <span class="win-menu-item">Edit</span>
        <span class="win-menu-item">View</span>
        <span class="win-menu-item">Go</span>
        <span class="win-menu-item">Help</span>
      </div>
      <div class="win-body" style="background:#fff;">
        <div style="font-family:'Share Tech Mono',monospace; font-size:11px; color:#808080; margin-bottom:8px; padding:4px; background:#c0c0c0; border-bottom:1px solid #808080;">
          C:\Users\Flame\Projects\
        </div>
        <div class="proj-card">
          <div class="proj-title">⛏ Minecraft Datapack</div>
          <div class="proj-desc">Custom game mechanics, items, and progression system built from scratch using mcfunction and JSON. 1000+ downloads with an active Discord community and ongoing end-user support.</div>
          <div class="proj-tags">
            <span class="proj-tag">mcfunction</span>
            <span class="proj-tag">JSON</span>
            <span class="proj-tag">Community Mgmt</span>
            <span class="proj-tag">1000+ DL</span>
          </div>
        </div>
        <div class="proj-card">
          <div class="proj-title">🐍 Python Network Tools</div>
          <div class="proj-desc">Network diagnostic and automation scripts. AWS security group management via boto3, port scanning, latency monitoring, and firewall rule automation.</div>
          <div class="proj-tags">
            <span class="proj-tag">Python</span>
            <span class="proj-tag">AWS</span>
            <span class="proj-tag">boto3</span>
            <span class="proj-tag">Networking</span>
          </div>
        </div>
        <div class="proj-card">
          <div class="proj-title">💻 This 3D Portfolio</div>
          <div class="proj-desc">Interactive 3D portfolio built with Three.js and a custom Blender model. Frutiger Aero world environment with a vintage computer and retro OS screen. You're inside it right now.</div>
          <div class="proj-tags">
            <span class="proj-tag">Three.js</span>
            <span class="proj-tag">Blender</span>
            <span class="proj-tag">WebGL</span>
            <span class="proj-tag">CSS3D</span>
          </div>
        </div>
      </div>
      <div class="win-statusbar">
        <span>3 objects</span>
        <span>Local Drive (C:)</span>
      </div>
    </div>
 
    <!-- HOBBIES WINDOW -->
    <div class="os-window" id="win-hobbies" style="top:90px; left:120px; width:440px;">
      <div class="win-titlebar">
        <div class="win-titlebar-left">
          <span class="win-icon">🎮</span>
          <span class="win-title">Hobbies.exe</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn">_</button>
          <button class="win-ctrl-btn">□</button>
          <button class="win-ctrl-btn close-btn" data-close="win-hobbies">✕</button>
        </div>
      </div>
      <div class="win-body">
        <div style="font-family:'VT323',monospace; font-size:20px; color:#000080; margin-bottom:10px;">Life Beyond the Terminal</div>
        <div class="hobby-win-grid">
          <div class="hobby-win-item">
            <span class="hobby-win-icon">⛏</span>
            <span class="hobby-win-label">Minecraft</span>
            <span class="hobby-win-desc">Modding & datapacks</span>
          </div>
          <div class="hobby-win-item">
            <span class="hobby-win-icon">🔐</span>
            <span class="hobby-win-label">CTF Challenges</span>
            <span class="hobby-win-desc">Security puzzles</span>
          </div>
          <div class="hobby-win-item">
            <span class="hobby-win-icon">🎮</span>
            <span class="hobby-win-label">Gaming</span>
            <span class="hobby-win-desc">Strategy & sandbox</span>
          </div>
          <div class="hobby-win-item">
            <span class="hobby-win-icon">☁️</span>
            <span class="hobby-win-label">Cloud Tinkering</span>
            <span class="hobby-win-desc">AWS home lab</span>
          </div>
          <div class="hobby-win-item">
            <span class="hobby-win-icon">🌐</span>
            <span class="hobby-win-label">Communities</span>
            <span class="hobby-win-desc">Building online spaces</span>
          </div>
          <div class="hobby-win-item">
            <span class="hobby-win-icon">📚</span>
            <span class="hobby-win-label">Self-Learning</span>
            <span class="hobby-win-desc">Always something new</span>
          </div>
        </div>
      </div>
      <div class="win-statusbar"><span>6 items</span><span>Ready</span></div>
    </div>
 
    <!-- CONTACT WINDOW -->
    <div class="os-window" id="win-contact" style="top:100px; left:140px; width:420px;">
      <div class="win-titlebar">
        <div class="win-titlebar-left">
          <span class="win-icon">📡</span>
          <span class="win-title">Contact.sys — System Info</span>
        </div>
        <div class="win-controls">
          <button class="win-ctrl-btn">_</button>
          <button class="win-ctrl-btn">□</button>
          <button class="win-ctrl-btn close-btn" data-close="win-contact">✕</button>
        </div>
      </div>
      <div class="win-body">
        <div style="font-family:'VT323',monospace; font-size:20px; color:#000080; margin-bottom:10px;">
          ══ SYSTEM CONTACT INFO ══
        </div>
        <div class="contact-win-row">
          <span class="contact-win-icon">✉</span>
          <div>
            <span class="contact-win-label">Electronic Mail</span>
            <span class="contact-win-val">flame@example.com</span>
          </div>
        </div>
        <div class="contact-win-row">
          <span class="contact-win-icon">💼</span>
          <div>
            <span class="contact-win-label">LinkedIn</span>
            <span class="contact-win-val">linkedin.com/in/flame</span>
          </div>
        </div>
        <div class="contact-win-row">
          <span class="contact-win-icon">🐙</span>
          <div>
            <span class="contact-win-label">GitHub</span>
            <span class="contact-win-val">github.com/flame</span>
          </div>
        </div>
        <div class="contact-win-row">
          <span class="contact-win-icon">📍</span>
          <div>
            <span class="contact-win-label">Location</span>
            <span class="contact-win-val">Sydney, NSW — Australia</span>
          </div>
        </div>
        <div style="margin-top:12px; padding:8px; background:white; border:2px inset #808080; font-family:'Share Tech Mono',monospace; font-size:11px; color:#000080;">
          STATUS: Seeking entry-level IT / helpdesk roles in Sydney.<br>
          Open to on-site, hybrid, or remote positions.
        </div>
      </div>
      <div class="win-statusbar"><span>Ready</span><span>SYD/AU</span></div>
    </div>
 
    <!-- TASKBAR -->
    <div class="os-taskbar">
      <button class="start-btn">
        <div class="start-logo">
          <span></span><span></span><span></span><span></span>
        </div>
        Start
      </button>
      <div class="taskbar-divider"></div>
      <div class="taskbar-clock" id="os-clock">00:00</div>
    </div>
 
  </div>
`;
 
// ─────────────────────────────────────────
// SCREEN INTERACTIONS
// Replace everything from "// ── Clock" down to
// "scene.add(cssObject);" with this block
// ─────────────────────────────────────────
 
// Clock
setInterval(() => {
  const el = screenDiv.querySelector('#os-clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}, 1000);
 
// ─── Window management ───────────────────
const basePositions = {
  'win-resume':   [100, 60],
  'win-skills':   [130, 80],
  'win-projects': [110, 50],
  'win-hobbies':  [120, 90],
  'win-contact':  [140, 100],
};
 
function openWindow(id) {
  const win = screenDiv.querySelector('#' + id);
  if (!win) return;
  const [bx, by] = basePositions[id] || [100, 60];
  const jitter = Math.round(Math.random() * 20 - 10);
  win.style.left = (bx + jitter) + 'px';
  win.style.top  = (by + jitter) + 'px';
  win.classList.add('open');
  focusWindow(win);
}
 
function closeWindow(id) {
  const win = screenDiv.querySelector('#' + id);
  if (!win) return;
  win.classList.remove('open', 'focused');
  win.style.zIndex = '10';
}
 
function focusWindow(win) {
  screenDiv.querySelectorAll('.os-window').forEach(w => {
    w.classList.remove('focused');
    w.style.zIndex = '10';
  });
  win.classList.add('focused');
  win.style.zIndex = '20';
}
 
// ─── Single drag state (shared across all windows) ───────────
let dragState = null;
// dragState = { win, lastX, lastY }
 
// ─── All mouse events on ONE listener each ───────────────────
 
// mousedown — start drag OR focus window
screenDiv.addEventListener('mousedown', (e) => {
  const titlebar = e.target.closest('.win-titlebar');
  if (titlebar && !e.target.closest('.win-controls')) {
    const win = titlebar.closest('.os-window');
    if (win) {
      dragState = { win, lastX: e.clientX, lastY: e.clientY };
      focusWindow(win);
      e.preventDefault();
      return;
    }
  }
  // Focus window on any click inside it
  const win = e.target.closest('.os-window');
  if (win) focusWindow(win);
});
 
// mousemove — drag the active window
screenDiv.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  const dx = e.clientX - dragState.lastX;
  const dy = e.clientY - dragState.lastY;
  dragState.lastX = e.clientX;
  dragState.lastY = e.clientY;
  const win = dragState.win;
  win.style.left = ((parseInt(win.style.left) || 0) + dx) + 'px';
  win.style.top  = ((parseInt(win.style.top)  || 0) + dy) + 'px';
});
 
// mouseup / mouseleave — stop drag
screenDiv.addEventListener('mouseup',    () => { dragState = null; });
screenDiv.addEventListener('mouseleave', () => { dragState = null; });
 
// DEBUG — shows where clicks actually land
screenDiv.addEventListener('click', (e) => {
  const dot = document.createElement('div');
  dot.style.cssText = `position:absolute;width:10px;height:10px;background:red;border-radius:50%;left:${e.offsetX-5}px;top:${e.offsetY-5}px;pointer-events:none;z-index:9999`;
  screenDiv.querySelector('.os-desktop').appendChild(dot);
  setTimeout(() => dot.remove(), 1000);
});

// click — icons and close buttons
screenDiv.addEventListener('click', (e) => {
  // Close button
  const closeBtn = e.target.closest('.close-btn');
  if (closeBtn) {
    closeWindow(closeBtn.dataset.close);
    e.stopPropagation();
    return;
  }
 
  // Desktop icon — manual double-click via data attribute
  const icon = e.target.closest('.desktop-icon');
  if (icon) {
    const now = Date.now();
    const last = parseInt(icon.dataset.lastClick || '0');
 
    screenDiv.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
 
    if (now - last < 500) {
      openWindow(icon.dataset.win);
      icon.dataset.lastClick = '0';
    } else {
      icon.dataset.lastClick = String(now);
    }
    e.stopPropagation();
    return;
  }
 
  // Bare desktop — deselect icons
  if (e.target.classList.contains('os-desktop')) {
    screenDiv.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
});
 
// ─────────────────────────────────────────
// CSS3D OBJECT (created AFTER screenDiv exists)
// ─────────────────────────────────────────
const cssObject = new CSS3DObject(screenDiv);
cssObject.visible = false;
scene.add(cssObject);


// ─────────────────────────────────────────
// 9. CSS3D RENDERER
// ─────────────────────────────────────────
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'fixed';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.pointerEvents = 'none';
// ADD THESE TWO:
cssRenderer.domElement.style.transformOrigin = 'top left';
cssRenderer.domElement.style.left = '0';
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