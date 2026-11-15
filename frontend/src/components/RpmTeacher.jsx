// RpmTeacher: the 3D teacher, a Ready Player Me avatar rendered live
// with Three.js, with REAL lip sync while she talks.
//
// How she loads (read this before touching it):
// In sandboxed browsers fetch() of blob: and data: URLs is blocked.
// GLTFLoader.load() fetches, and three's GLTFParser also loads embedded
// GLB images through ImageBitmapLoader, which fetches the blob URL it
// just made. When that fetch is blocked the loader silently leaves
// material.map null and she renders pure white, with no error.
// So this component NEVER calls fetch() or loader.load(). The GLB bytes
// arrive already in memory (base64 module, code-split with a dynamic
// import), they are decoded with atob and handed to GLTFLoader.parse.
// If the loader still leaves a texture slot empty, the images are decoded
// straight from the GLB bytes with createImageBitmap on a Blob, again with
// no fetch, and assigned to the material by hand. The repair reads the
// material name out of the GLB JSON itself, so it works for any Ready
// Player Me avatar, not just this sample.
//
// Lip sync: Ready Player Me GLBs carry ARKit visemes on the Wolf3D_Head
// mesh (viseme_aa, viseme_E, viseme_I, viseme_O, viseme_U, viseme_PP,
// viseme_FF, viseme_TH, viseme_DD, viseme_kk, viseme_CH, viseme_SS,
// viseme_nn, viseme_RR) plus jawOpen and eyeBlinkLeft / eyeBlinkRight.
// The spoken text is turned into one viseme per word. Two sources drive
// the word index: real speechSynthesis onboundary word events (wired
// through Teacher.jsx, prop wordIndex) and a timer fallback that advances
// word by word on estimated timing, so her mouth moves even when boundary
// events never fire (headless, no voices). Each viseme attacks fast and
// decays quickly, so her mouth visibly opens and closes per word instead
// of freezing in one pose. She also blinks every 2 to 5 seconds and nods
// gently while speaking. Live state is on window.__teacherTalk for checks.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Base64 -> bytes, in chunks so a 6.3 MB string never blows the stack.
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Parse the GLB JSON chunk and the binary chunk.
// Returns { json, binStart } so texture bytes can be sliced out later.
function parseGlb(glbBytes) {
  const view = new DataView(glbBytes.buffer, glbBytes.byteOffset, glbBytes.byteLength);
  const jsonLen = view.getUint32(12, true);
  const jsonStart = 20;
  const json = JSON.parse(new TextDecoder().decode(glbBytes.subarray(jsonStart, jsonStart + jsonLen)));
  // BIN chunk header starts right after the JSON chunk, padded to 4 bytes.
  const binHeaderAt = jsonStart + jsonLen + (jsonLen % 4 === 0 ? 0 : 4 - (jsonLen % 4));
  const binLen = view.getUint32(binHeaderAt, true);
  const binStart = binHeaderAt + 8;
  if (binStart + binLen > glbBytes.byteLength) throw new Error('GLB binary chunk is truncated.');
  return { json, binStart };
}

// Slice one embedded image out of the GLB bytes by its image index.
function glbImageBytes(glbBytes, parsed, imageIndex) {
  const img = (parsed.json.images || [])[imageIndex];
  if (!img) return null;
  const bv = parsed.json.bufferViews[img.bufferView];
  if (!bv) return null;
  const start = parsed.binStart + (bv.byteOffset || 0);
  return { mimeType: img.mimeType || 'image/png', bytes: glbBytes.slice(start, start + bv.byteLength) };
}

// Repair any texture slot the loader left empty (the blocked-fetch white
// bug). A slot counts as broken when the texture is missing or its image
// never arrived. The material name is matched against the GLB JSON, so the
// right image is found for each material: baseColorTexture for the colour
// map, normalTexture for the normal map. Rebuilt textures match what the
// loader would have made: flipY false (glTF UV origin is top-left) and
// sRGB for the colour map.
async function repairTextures(material, glbBytes, parsed) {
  const mapBroken = !material.map || !material.map.image;
  const normalBroken = !material.normalMap || !material.normalMap.image;
  if (!mapBroken && !normalBroken) return false;
  const matDef = (parsed.json.materials || []).find((m) => m.name === material.name);
  if (!matDef) return false;
  const imageIndexFor = (texRef) => {
    if (!texRef) return null;
    const tex = (parsed.json.textures || [])[texRef.index];
    return tex ? tex.source : null;
  };
  let fixed = false;
  const build = async (imageIndex, srgb) => {
    if (imageIndex === null || imageIndex === undefined) return null;
    const img = glbImageBytes(glbBytes, parsed, imageIndex);
    if (!img) return null;
    const bitmap = await createImageBitmap(new Blob([img.bytes], { type: img.mimeType }));
    const tex = new THREE.CanvasTexture(bitmap);
    tex.flipY = false;
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.needsUpdate = true;
    return tex;
  };
  if (mapBroken) {
    const tex = await build(imageIndexFor(matDef.pbrMetallicRoughness && matDef.pbrMetallicRoughness.baseColorTexture), true);
    if (tex) { if (material.map) material.map.dispose(); material.map = tex; fixed = true; }
  }
  if (normalBroken) {
    const tex = await build(imageIndexFor(matDef.normalTexture), false);
    if (tex) { if (material.normalMap) material.normalMap.dispose(); material.normalMap = tex; fixed = true; }
  }
  if (fixed) material.needsUpdate = true;
  return fixed;
}

// The Oculus viseme set carried on Ready Player Me head meshes.
const VISEMES = [
  'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
  'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD', 'viseme_kk',
  'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR',
];

// One word -> one viseme, from the sounds in the word. Labial and
// fricative starts (p, b, m, f, th, ch) are the most visible, so they win
// when the word starts with them. Otherwise the first vowel decides the
// mouth shape, then the first consonant. Good enough that every word
// visibly changes her mouth.
function wordToViseme(word) {
  const w = (word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 'viseme_sil';
  if (w.startsWith('th')) return 'viseme_TH';
  if (w.startsWith('ch') || w.startsWith('sh')) return 'viseme_CH';
  const first = w[0];
  if (first === 'p' || first === 'b' || first === 'm') return 'viseme_PP';
  if (first === 'f' || first === 'v') return 'viseme_FF';
  const vowel = w.match(/[aeiou]/);
  if (vowel) {
    if (vowel[0] === 'a') return 'viseme_aa';
    if (vowel[0] === 'e') return 'viseme_E';
    if (vowel[0] === 'i') return 'viseme_I';
    if (vowel[0] === 'o') return 'viseme_O';
    return 'viseme_U';
  }
  if (first === 't' || first === 'd' || first === 'l') return 'viseme_DD';
  if (first === 'k' || first === 'g') return 'viseme_kk';
  if (first === 's' || first === 'z' || first === 'c') return 'viseme_SS';
  if (first === 'n') return 'viseme_nn';
  if (first === 'r') return 'viseme_RR';
  return 'viseme_aa';
}

// Estimated seconds per spoken word, for the timer fallback when no
// boundary events arrive. Matches the default speech rate of 1.0.
const WORD_SECONDS = 0.38;

export default function RpmTeacher({
  speaking = false,
  listening = false,
  spokenText = '',
  wordIndex = -1,
  className = '',
  height = 440,
  showControls = true,
}) {
  const mountRef = useRef(null);
  const speakingRef = useRef(speaking);
  const listeningRef = useRef(listening);
  const spokenTextRef = useRef(spokenText);
  const wordIndexRef = useRef(wordIndex);
  const lastBoundaryAtRef = useRef(0);
  const speakStartAtRef = useRef(0);
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
  useEffect(() => { spokenTextRef.current = spokenText; }, [spokenText]);
  useEffect(() => {
    // A fresh boundary event means the real voice is driving the words.
    if (wordIndex !== wordIndexRef.current) {
      wordIndexRef.current = wordIndex;
      lastBoundaryAtRef.current = performance.now();
    }
  }, [wordIndex]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // When speaking starts, anchor the timer fallback to now.
  useEffect(() => {
    if (speaking) {
      speakStartAtRef.current = performance.now();
      wordIndexRef.current = -1;
      lastBoundaryAtRef.current = 0;
    }
  }, [speaking]);

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
        setStatusText('Loading your teacher…');
        const { TEACHER_GLB_BASE64 } = await import('../lib/teacherModel.js');
        if (cancelled) return;
        setStatusText('Decoding her model…');
        const glbBytes = base64ToBytes(TEACHER_GLB_BASE64);

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

        setStatusText('Bringing your teacher into the room…');
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

        // Find every mesh with morph targets (head, teeth, eyes) and the
        // Head bone, for the lip-sync driver below.
        const morphMeshes = [];
        let headBone = null;
        let headBaseX = 0;
        let headBaseY = 0;
        modelGroup.traverse((obj) => {
          if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
            morphMeshes.push(obj);
          }
          if (!headBone && obj.isBone && obj.name === 'Head') headBone = obj;
        });
        if (headBone) {
          headBaseX = headBone.rotation.x;
          headBaseY = headBone.rotation.y;
        }

        // The white-bug repair: if the loader left a texture slot empty,
        // decode the images from the GLB bytes ourselves, no fetch.
        setStatusText('Checking her colours…');
        const parsed = parseGlb(glbBytes);
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
          const did = await repairTextures(m, glbBytes, parsed);
          anyRepaired = anyRepaired || did;
        }
        if (cancelled) return;
        if (anyRepaired) setStatusText('Colours restored from her model file.');

        // Lip-sync driver state. Lives in the animation loop, not React.
        const talk = {
          currentWord: -1,
          viseme: 'viseme_sil',
          weight: 0,
          jaw: 0,
          wordStartAt: 0,
          nodImpulse: 0,
          nextBlinkAt: performance.now() + 2500,
          blinkStartAt: 0,
        };
        const setMorph = (name, value) => {
          for (const mesh of morphMeshes) {
            const idx = mesh.morphTargetDictionary[name];
            if (idx !== undefined) mesh.morphTargetInfluences[idx] = value;
          }
        };

        // Gentle idle life: slow sway and breathing bob. While she is
        // speaking the bob gets a little stronger and quicker, and the
        // lip-sync driver below moves her mouth, blinks and nods.
        const clock = new THREE.Clock();
        let lastNow = performance.now();
        const animate = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(animate);
          const t = clock.getElapsedTime();
          const now = performance.now();
          // Frame time from performance.now, not clock.getDelta():
          // getElapsedTime() already consumes the clock delta each call,
          // so a getDelta() right after it would read near zero.
          const dt = Math.min(Math.max((now - lastNow) / 1000, 0.001), 0.05);
          lastNow = now;
          const talking = speakingRef.current;
          const alert = listeningRef.current;

          // Which word is she on? Real boundary events win while they
          // are fresh; otherwise the timer fallback advances word by
          // word on estimated timing, so the mouth still moves.
          const words = spokenTextRef.current ? spokenTextRef.current.split(/\s+/) : [];
          let wordIdx = -1;
          if (talking && words.length) {
            const boundaryFresh = wordIndexRef.current >= 0 && (now - lastBoundaryAtRef.current) < 800;
            if (boundaryFresh) {
              wordIdx = Math.min(wordIndexRef.current, words.length - 1);
            } else {
              const elapsed = (now - speakStartAtRef.current) / 1000;
              wordIdx = Math.min(Math.floor(elapsed / WORD_SECONDS), words.length - 1);
            }
          }
          if (wordIdx !== talk.currentWord) {
            talk.currentWord = wordIdx;
            if (wordIdx >= 0) {
              talk.viseme = wordToViseme(words[wordIdx]);
              talk.wordStartAt = now;
              talk.nodImpulse = 1;
            }
          }

          // Viseme envelope: fast attack, quick decay, so the mouth
          // visibly opens and closes per word, never a frozen pose.
          let desired = 0;
          if (talking && wordIdx >= 0) {
            const age = now - talk.wordStartAt;
            desired = 0.85 * Math.exp(-age / 170);
          }
          const rate = desired > talk.weight ? 22 : 14;
          talk.weight += (desired - talk.weight) * Math.min(1, dt * rate);
          if (talk.weight < 0.005) talk.weight = 0;
          const desiredJaw = talk.weight * 0.55;
          talk.jaw += (desiredJaw - talk.jaw) * Math.min(1, dt * 18);
          for (const v of VISEMES) setMorph(v, v === talk.viseme ? talk.weight : 0);
          setMorph('viseme_sil', 0);
          setMorph('jawOpen', talk.jaw);
          setMorph('mouthOpen', talk.jaw * 0.6);

          // Blink: both eyes together, every 2 to 5 seconds, 180 ms.
          if (now >= talk.nextBlinkAt) {
            talk.blinkStartAt = now;
            talk.nextBlinkAt = now + 2000 + Math.random() * 3000;
          }
          const blinkAge = now - talk.blinkStartAt;
          const blink = blinkAge >= 0 && blinkAge <= 180 ? Math.sin((blinkAge / 180) * Math.PI) : 0;
          setMorph('eyeBlinkLeft', blink);
          setMorph('eyeBlinkRight', blink);

          // Nod: a gentle head motion while speaking, a small nod on
          // every word beat, on top of a slow idle look-around.
          talk.nodImpulse *= Math.exp(-dt * 4);
          if (headBone) {
            headBone.rotation.x = headBaseX
              + (talking ? Math.sin(t * 2.0) * 0.02 + talk.nodImpulse * 0.05 : Math.sin(t * 0.6) * 0.01);
            headBone.rotation.y = headBaseY + Math.sin(t * 0.5) * 0.02;
          }

          // Live state for verification, from the browser console or a test.
          window.__teacherTalk = {
            speaking: talking,
            viseme: talking && wordIdx >= 0 ? talk.viseme : 'viseme_sil',
            weight: Math.round(talk.weight * 100) / 100,
          };

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
          // Read the live size, not the height prop: the prop is fixed
          // when this effect first runs, but the figure shrinks to 260px
          // tall beside the board and the mount follows it.
          const hh = mount.clientHeight;
          if (!w || !hh) return;
          camera.aspect = w / hh;
          camera.updateProjectionMatrix();
          renderer.setSize(w, hh);
        });
        ro.observe(mount);

        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        console.error('3D teacher failed to load:', err);
        setError(err && err.message ? err.message : 'The 3D teacher could not be loaded.');
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
    <div className={`rpm-viewer ${className}`}>
      <div
        ref={mountRef}
        className="rpm-canvas"
        style={{ height: typeof height === 'number' ? height : undefined }}
        aria-label="Your 3D AI teacher"
      >
        {status === 'loading' && (
          <div className="rpm-overlay">
            <div className="rpm-spinner" aria-hidden="true" />
            <p>{statusText}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="rpm-overlay rpm-error">
            <p><strong>The 3D teacher could not be loaded.</strong></p>
            <p>{error}</p>
            <button className="btn btn-yellow btn-sm" onClick={() => setRetryKey((k) => k + 1)}>Try again</button>
          </div>
        )}
      </div>
      {showControls && status === 'ready' && (
        <div className="rpm-controls">
          <button
            className={`btn btn-sm ${autoRotate ? 'btn-dark' : 'btn-ghost'}`}
            onClick={() => setAutoRotate((v) => !v)}
            aria-pressed={autoRotate}
          >
            {autoRotate ? 'Pause spin' : 'Auto spin'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={resetView}>Reset view</button>
          <span className="rpm-hint">Drag to look around, scroll to zoom</span>
        </div>
      )}
      <p className="rpm-note">
        She is a 3D model, not a video. Her mouth moves with every word she speaks, she blinks and nods while she teaches.
      </p>
    </div>
  );
}
