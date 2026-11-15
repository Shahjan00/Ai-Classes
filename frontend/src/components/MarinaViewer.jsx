// MarinaViewer: the 3D teacher, rendered live with Three.js.
//
// How Marina loads (read this before touching it):
// In sandboxed browsers fetch() of blob: and data: URLs is blocked.
// GLTFLoader.load() fetches, and three's GLTFParser also loads embedded
// GLB images through ImageBitmapLoader, which fetches the blob URL it
// just made. When that fetch is blocked the loader silently leaves
// material.map null and Marina renders pure white, with no error.
// So this component NEVER calls fetch() or loader.load(). The GLB bytes
// arrive already in memory (base64 module, code-split with a dynamic
// import), they are decoded with atob and handed to GLTFLoader.parse.
// If the loader still leaves a texture slot empty, the DIFF and NORM
// images are decoded straight from the GLB bytes with createImageBitmap
// on a Blob, again with no fetch, and assigned to the material by hand.
//
// Marina is one static mesh: no rig, no blendshapes, no animations.
// She can sway and bob, but her mouth can never move. There is no lip
// sync, and nothing in this UI claims otherwise.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Base64 -> bytes, in chunks so a 5.4 MB string never blows the stack.
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Slice the embedded images out of raw GLB bytes.
// Returns [{ mimeType, bytes }] in glTF image order (0 = DIFF colour,
// 1 = NORM normal map for Marina). Pure byte math, no fetch anywhere.
function extractGlbImages(glbBytes) {
  const view = new DataView(glbBytes.buffer, glbBytes.byteOffset, glbBytes.byteLength);
  const jsonLen = view.getUint32(12, true);
  const jsonStart = 20;
  const json = JSON.parse(new TextDecoder().decode(glbBytes.subarray(jsonStart, jsonStart + jsonLen)));
  // BIN chunk header starts right after the JSON chunk, padded to 4 bytes.
  const binHeaderAt = jsonStart + jsonLen + (jsonLen % 4 === 0 ? 0 : 4 - (jsonLen % 4));
  const binLen = view.getUint32(binHeaderAt, true);
  const binStart = binHeaderAt + 8;
  if (binStart + binLen > glbBytes.byteLength) throw new Error('GLB binary chunk is truncated.');
  const images = [];
  for (const img of json.images || []) {
    const bv = json.bufferViews[img.bufferView];
    if (!bv) continue;
    const start = binStart + (bv.byteOffset || 0);
    images.push({ mimeType: img.mimeType || 'image/png', bytes: glbBytes.slice(start, start + bv.byteLength) });
  }
  return images;
}

// Repair any texture slot the loader left empty (the blocked-fetch white
// bug). A slot counts as broken when the texture is missing or its image
// never arrived. Rebuilt textures match what the loader would have made:
// flipY false (glTF UV origin is top-left) and sRGB for the colour map.
async function repairTextures(material, glbBytes) {
  const mapBroken = !material.map || !material.map.image;
  const normalBroken = !material.normalMap || !material.normalMap.image;
  if (!mapBroken && !normalBroken) return false;
  const images = extractGlbImages(glbBytes);
  let fixed = false;
  const build = async (idx, srgb) => {
    const img = images[idx];
    if (!img) return null;
    const bitmap = await createImageBitmap(new Blob([img.bytes], { type: img.mimeType }));
    const tex = new THREE.CanvasTexture(bitmap);
    tex.flipY = false;
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  if (mapBroken) {
    const tex = await build(0, true);
    if (tex) { if (material.map) material.map.dispose(); material.map = tex; fixed = true; }
  }
  if (normalBroken) {
    const tex = await build(1, false);
    if (tex) { if (material.normalMap) material.normalMap.dispose(); material.normalMap = tex; fixed = true; }
  }
  if (fixed) material.needsUpdate = true;
  return fixed;
}

export default function MarinaViewer({
  speaking = false,
  listening = false,
  className = '',
  height = 440,
  showControls = true,
}) {
  const mountRef = useRef(null);
  const speakingRef = useRef(speaking);
  const listeningRef = useRef(listening);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const homeRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Warming up the classroom…');
  const [error, setError] = useState('');
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => { speakingRef.current = speaking; }, [speaking]);
  useEffect(() => { listeningRef.current = listening; }, [listening]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    let cancelled = false;
    let renderer = null;
    let controls = null;
    let raf = 0;
    let resumeTimer = null;
    let ro = null;
    let scene = null;
    let modelGroup = null;
    const mount = mountRef.current;
    if (!mount) return undefined;

    const start = async () => {
      try {
        setStatus('loading');
        setError('');
        setStatusText('Loading Marina…');
        const { MARINA_GLB_BASE64 } = await import('../lib/marinaModel.js');
        if (cancelled) return;
        setStatusText('Decoding her model…');
        const glbBytes = base64ToBytes(MARINA_GLB_BASE64);

        // Minimal white calm room: soft studio light, gentle shadows.
        const width = mount.clientWidth || 600;
        const h = typeof height === 'number' ? height : mount.clientHeight || 440;
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, h);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        mount.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xfdfcf7);

        const camera = new THREE.PerspectiveCamera(35, width / h, 0.1, 100);
        camera.position.set(0.55, 1.55, 3.4);
        cameraRef.current = camera;

        scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e2d5, 0.9));
        const key = new THREE.DirectionalLight(0xfff6e0, 2.2);
        key.position.set(2.5, 4.5, 3);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = -2;
        key.shadow.camera.right = 2;
        key.shadow.camera.top = 3;
        key.shadow.camera.bottom = -1;
        key.shadow.bias = -0.0002;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xdfeaff, 0.7);
        fill.position.set(-3, 2, 2.5);
        scene.add(fill);

        // Floor: warm white, catches a soft shadow under her feet.
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(6, 64),
          new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.95, metalness: 0 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const backWall = new THREE.Mesh(
          new THREE.PlaneGeometry(14, 6),
          new THREE.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 1, metalness: 0 }),
        );
        backWall.position.set(0, 3, -2.2);
        backWall.receiveShadow = true;
        scene.add(backWall);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.95, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = autoRotateRef.current;
        controls.autoRotateSpeed = 0.9;
        controls.minDistance = 1.6;
        controls.maxDistance = 6;
        controls.maxPolarAngle = Math.PI * 0.52;
        controls.enablePan = false;
        controls.update();
        controlsRef.current = controls;
        homeRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };
        // Pause the slow spin while the user drags, resume shortly after.
        controls.addEventListener('start', () => {
          controls.autoRotate = false;
          if (resumeTimer) clearTimeout(resumeTimer);
        });
        controls.addEventListener('end', () => {
          if (resumeTimer) clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => {
            if (!cancelled && autoRotateRef.current) controls.autoRotate = true;
          }, 2500);
        });

        setStatusText('Bringing Marina into the room…');
        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
          // parse() decodes bytes already in memory. Never loader.load().
          loader.parse(glbBytes.buffer, '', resolve, reject);
        });
        if (cancelled) return;
        modelGroup = gltf.scene;

        // Normalise her to a real teacher height and plant her feet on
        // the floor, whatever scale the source file used.
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        if (size.y > 0) {
          const scale = 1.8 / size.y;
          modelGroup.scale.setScalar(scale);
          modelGroup.position.x -= center.x * scale;
          modelGroup.position.z -= center.z * scale;
          modelGroup.position.y -= box.min.y * scale;
        }
        modelGroup.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = false;
          }
        });
        scene.add(modelGroup);

        // The white-bug repair: if the loader left a texture slot empty,
        // decode the images from the GLB bytes ourselves, no fetch.
        setStatusText('Checking her colours…');
        const skinMats = [];
        modelGroup.traverse((child) => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => { if (m) skinMats.push(m); });
          }
        });
        let anyRepaired = false;
        for (const m of skinMats) {
          // eslint-disable-next-line no-await-in-loop
          const did = await repairTextures(m, glbBytes);
          anyRepaired = anyRepaired || did;
        }
        if (cancelled) return;
        if (anyRepaired) setStatusText('Colours restored from her model file.');

        // Gentle idle life: slow sway and breathing bob. While she is
        // speaking the bob gets a little stronger and quicker.
        const clock = new THREE.Clock();
        const animate = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const talking = speakingRef.current;
          const alert = listeningRef.current;
          const bobAmp = talking ? 0.035 : 0.014;
          const bobSpeed = talking ? 2.6 : 1.1;
          modelGroup.position.y = Math.sin(t * bobSpeed) * bobAmp;
          modelGroup.rotation.y = Math.sin(t * 0.45) * 0.06 + (alert ? Math.sin(t * 0.9) * 0.02 : 0);
          modelGroup.rotation.z = Math.sin(t * 0.7) * (talking ? 0.02 : 0.008);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        ro = new ResizeObserver(() => {
          if (cancelled || !mount) return;
          const w = mount.clientWidth;
          const hh = typeof height === 'number' ? height : mount.clientHeight;
          if (!w || !hh) return;
          camera.aspect = w / hh;
          camera.updateProjectionMatrix();
          renderer.setSize(w, hh);
        });
        ro.observe(mount);

        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('Marina failed to load:', err);
        setError(err && err.message ? err.message : 'Marina could not be loaded.');
        setStatus('error');
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      if (ro) ro.disconnect();
      if (controls) controls.dispose();
      controlsRef.current = null;
      if (scene) {
        scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              if (!m) return;
              if (m.map) m.map.dispose();
              if (m.normalMap) m.normalMap.dispose();
              m.dispose();
            });
          }
        });
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      }
      scene = null;
      modelGroup = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // Keep the spin toggle in sync with the live controls.
  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  const resetView = () => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    const home = homeRef.current;
    if (!controls || !camera || !home) return;
    camera.position.copy(home.position);
    controls.target.copy(home.target);
    controls.update();
  };

  return (
    <div className={`marina-viewer ${className}`}>
      <div
        ref={mountRef}
        className="marina-canvas"
        style={{ height: typeof height === 'number' ? height : undefined }}
        aria-label="Marina, your 3D AI teacher"
      >
        {status === 'loading' && (
          <div className="marina-overlay">
            <div className="marina-spinner" aria-hidden="true" />
            <p>{statusText}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="marina-overlay marina-error">
            <p><strong>Marina could not be loaded.</strong></p>
            <p>{error}</p>
            <button className="btn btn-yellow btn-sm" onClick={() => setRetryKey((k) => k + 1)}>Try again</button>
          </div>
        )}
      </div>
      {showControls && status === 'ready' && (
        <div className="marina-controls">
          <button
            className={`btn btn-sm ${autoRotate ? 'btn-dark' : 'btn-ghost'}`}
            onClick={() => setAutoRotate((v) => !v)}
            aria-pressed={autoRotate}
          >
            {autoRotate ? 'Pause spin' : 'Auto spin'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetView}>Reset view</button>
          <span className="marina-hint">Drag to look around, scroll to zoom</span>
        </div>
      )}
      <p className="marina-note">
        Marina is a 3D model, not a video. She sways and nods while she teaches.
        Her mouth does not move, so she talks with her voice, not lip sync.
      </p>
    </div>
  );
}
