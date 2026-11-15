// ClassroomScene: ONE unified classroom. The teacher and the green
// board live in the same Three.js scene, in the same window: she stands
// in front of the board, facing the class (the camera), like a real
// teacher. No separate teacher card, no separate board panel.
//
// The user rejected the old presentation for three real reasons, and
// each one is fixed here on purpose:
//   1. She spun 360 like a product viewer. There is NO auto-rotation
//      anywhere in this file. The camera is fixed; dragging only orbits
//      while the user drags, and it never spins on its own.
//   2. Her arms stuck out in the default A-pose. Ready Player Me
//      avatars load that way, so after load every arm bone is rotated
//      in world space until the arms hang relaxed at her sides (see
//      relaxArms). Breathing sway is added on top of that base pose.
//   3. She looked like a mannequin in a box. She breathes, blinks,
//      looks around, nods while she speaks, and when a diagram is on
//      the board she steps to the side, turns toward it, and points at
//      it with her left hand while she explains it.
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
// gently while speaking. Live state is on window.__teacherTalk and
// window.__classroom for checks.
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { drawBoard, BOARD_W, BOARD_H } from '../lib/boardCanvas';

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

// Classroom layout, in metres. She faces the camera (+z). The board
// hangs on the back wall; she stands in front of it, left of centre when
// nothing is on the board, and steps further left beside it when a
// diagram is up so the class can see it.
const BOARD_POS = { x: 0.55, y: 1.55, z: -1.48 };
const BOARD_SIZE = { w: 3.7, h: 1.9 };
const TEACHER_CENTER_X = -0.9;
const TEACHER_BOARD_X = -1.55;
const TEACHER_Z = 0.35;
const CAMERA_POS = { x: 0.1, y: 1.62, z: 4.6 };
const CAMERA_TARGET = { x: 0.15, y: 1.35, z: 0 };

// Rotate a bone in world space so the direction from the bone to its
// child ends up along targetDir. Returns the local-space quaternion to
// premultiply onto the bone. This is how the A-pose is fixed without
// guessing bone axis signs: it measures the real arm direction and
// corrects it. Call scene.updateMatrixWorld() before measuring.
function worldAlignQuat(bone, childBone, targetDir) {
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  bone.getWorldPosition(p0);
  childBone.getWorldPosition(p1);
  const dir = p1.sub(p0);
  if (dir.lengthSq() < 1e-8) return null;
  dir.normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(dir, targetDir.clone().normalize());
  const parentQ = new THREE.Quaternion();
  bone.parent.getWorldQuaternion(parentQ);
  return parentQ.clone().invert().multiply(q).multiply(parentQ);
}

export default function ClassroomScene({
  speaking = false,
  listening = false,
  spokenText = '',
  wordIndex = -1,
  boardTopic = null,
  className = '',
}) {
  const mountRef = useRef(null);
  const speakingRef = useRef(speaking);
  const listeningRef = useRef(listening);
  const spokenTextRef = useRef(spokenText);
  const wordIndexRef = useRef(wordIndex);
  const boardTopicRef = useRef(boardTopic);
  const boardApiRef = useRef(null);
  const lastBoundaryAtRef = useRef(0);
  const speakStartAtRef = useRef(0);
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Warming up the classroom…');
  const [error, setError] = useState('');
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
  useEffect(() => { boardTopicRef.current = boardTopic; }, [boardTopic]);

  // When speaking starts, anchor the timer fallback to now.
  useEffect(() => {
    if (speaking) {
      speakStartAtRef.current = performance.now();
      wordIndexRef.current = -1;
      lastBoundaryAtRef.current = 0;
    }
  }, [speaking]);

  // A new board topic redraws the chalkboard face in the live scene.
  useEffect(() => {
    const api = boardApiRef.current;
    if (api) api.draw(boardTopic);
  }, [boardTopic]);

  useEffect(() => {
    let cancelled = false;
    let renderer = null;
    let controls = null;
    let raf = 0;
    let ro = null;
    let scene = null;
    let teacherGroup = null;
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

        // The classroom: warm walls, a wooden floor, one big green board.
        const width = mount.clientWidth || 900;
        const h = mount.clientHeight || 560;
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
        scene.background = new THREE.Color(0xf6f1e6);

        // Fixed camera. It never moves on its own: no auto-rotation,
        // no idle drift, no turntable. Dragging orbits while the user
        // drags, and only while the user drags.
        const camera = new THREE.PerspectiveCamera(38, width / h, 0.1, 100);
        camera.position.set(CAMERA_POS.x, CAMERA_POS.y, CAMERA_POS.z);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e2d5, 0.9));
        const key = new THREE.DirectionalLight(0xfff6e0, 2.2);
        key.position.set(0.8, 5, 4.5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.left = -3;
        key.shadow.camera.right = 3;
        key.shadow.camera.top = 4;
        key.shadow.camera.bottom = -1;
        key.shadow.bias = -0.0002;
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xdfeaff, 0.7);
        fill.position.set(-3, 2, 2.5);
        scene.add(fill);

        // Floor and back wall.
        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(9, 64),
          new THREE.MeshStandardMaterial({ color: 0xe7dcc3, roughness: 0.95, metalness: 0 }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const backWall = new THREE.Mesh(
          new THREE.PlaneGeometry(18, 8),
          new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 1, metalness: 0 }),
        );
        backWall.position.set(0, 3.2, -1.75);
        backWall.receiveShadow = true;
        scene.add(backWall);

        // The green board: a wooden frame, the chalk face (a canvas
        // texture, redrawn whenever the topic changes), a chalk tray
        // with two chalk sticks and a duster.
        const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.75, metalness: 0 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(BOARD_SIZE.w + 0.22, BOARD_SIZE.h + 0.22, 0.07), wood);
        frame.position.set(BOARD_POS.x, BOARD_POS.y, BOARD_POS.z - 0.07);
        frame.castShadow = true;
        frame.receiveShadow = true;
        scene.add(frame);
        const boardCanvas = document.createElement('canvas');
        boardCanvas.width = BOARD_W;
        boardCanvas.height = BOARD_H;
        const boardCtx = boardCanvas.getContext('2d');
        drawBoard(boardCtx, boardTopicRef.current);
        const boardTex = new THREE.CanvasTexture(boardCanvas);
        boardTex.colorSpace = THREE.SRGBColorSpace;
        boardTex.anisotropy = 4;
        const boardFace = new THREE.Mesh(
          new THREE.PlaneGeometry(BOARD_SIZE.w, BOARD_SIZE.h),
          new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.9, metalness: 0 }),
        );
        boardFace.position.set(BOARD_POS.x, BOARD_POS.y, BOARD_POS.z);
        boardFace.receiveShadow = true;
        scene.add(boardFace);
        const tray = new THREE.Mesh(new THREE.BoxGeometry(BOARD_SIZE.w + 0.22, 0.07, 0.16), wood);
        tray.position.set(BOARD_POS.x, BOARD_POS.y - BOARD_SIZE.h / 2 - 0.13, BOARD_POS.z + 0.04);
        tray.castShadow = true;
        scene.add(tray);
        const chalkMat = new THREE.MeshStandardMaterial({ color: 0xf5f5e8, roughness: 0.9 });
        [-0.35, -0.2].forEach((dx) => {
          const stick = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), chalkMat);
          stick.position.set(BOARD_POS.x + dx, BOARD_POS.y - BOARD_SIZE.h / 2 - 0.08, BOARD_POS.z + 0.06);
          scene.add(stick);
        });
        const duster = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.05, 0.09),
          new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 }),
        );
        duster.position.set(BOARD_POS.x + 0.9, BOARD_POS.y - BOARD_SIZE.h / 2 - 0.07, BOARD_POS.z + 0.05);
        scene.add(duster);
        boardApiRef.current = {
          draw: (topic) => {
            drawBoard(boardCtx, topic);
            boardTex.needsUpdate = true;
          },
        };

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.autoRotate = false;
        controls.minDistance = 2.8;
        controls.maxDistance = 7;
        controls.minPolarAngle = Math.PI * 0.25;
        controls.maxPolarAngle = Math.PI * 0.55;
        controls.enablePan = false;
        controls.update();

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
          const scale = 1.75 / size.y;
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
        teacherGroup = new THREE.Group();
        teacherGroup.add(modelGroup);
        teacherGroup.position.set(boardTopicRef.current ? TEACHER_BOARD_X : TEACHER_CENTER_X, 0, TEACHER_Z);
        scene.add(teacherGroup);

        // Find every mesh with morph targets (head, teeth, eyes) and
        // the bones this scene drives.
        const morphMeshes = [];
        const bones = {};
        modelGroup.traverse((obj) => {
          if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
            morphMeshes.push(obj);
          }
          if (obj.isBone) bones[obj.name] = obj;
        });
        const headBone = bones.Head || null;
        const headBaseX = headBone ? headBone.rotation.x : 0;
        const headBaseY = headBone ? headBone.rotation.y : 0;
        const spine2 = bones.Spine2 || bones.Spine1 || null;
        const spineBaseX = spine2 ? spine2.rotation.x : 0;

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

        // Fix the A-pose: rotate each arm bone in world space until the
        // arms hang relaxed at her sides, slightly forward, elbows a
        // little bent. Measured, not guessed: the real arm direction is
        // read off the bones and corrected. The base pose is stored so
        // the animation loop can sway and gesture from it.
        scene.updateMatrixWorld(true);
        const pose = {};
        const relax = (armName, foreName, armDir, foreDir) => {
          const arm = bones[armName];
          const fore = bones[foreName];
          if (!arm || !fore) return;
          const qArm = worldAlignQuat(arm, fore, armDir);
          if (qArm) arm.quaternion.premultiply(qArm);
          arm.updateWorldMatrix(true, true);
          const qFore = worldAlignQuat(fore, bones[`${foreName.replace('ForeArm', 'Hand')}`] || fore, foreDir);
          if (qFore) fore.quaternion.premultiply(qFore);
          fore.updateWorldMatrix(true, true);
          pose[armName] = arm.quaternion.clone();
          pose[foreName] = fore.quaternion.clone();
        };
        relax('LeftArm', 'LeftForeArm', new THREE.Vector3(0.10, -1, 0.04), new THREE.Vector3(0.06, -1, 0.14));
        relax('RightArm', 'RightForeArm', new THREE.Vector3(-0.10, -1, 0.04), new THREE.Vector3(-0.06, -1, 0.14));
        // The pointing pose: her left arm raised toward the board (on
        // her left, slightly behind her), forearm extended. Computed
        // from the relaxed pose, the same measured way.
        const pointPose = {};
        const leftArm = bones.LeftArm;
        const leftFore = bones.LeftForeArm;
        if (leftArm && leftFore) {
          const qArm = worldAlignQuat(leftArm, leftFore, new THREE.Vector3(0.85, 0.18, -0.30));
          if (qArm) {
            const pq = leftArm.quaternion.clone().premultiply(qArm);
            pointPose.LeftArm = pq;
            const saved = leftArm.quaternion.clone();
            leftArm.quaternion.copy(pq);
            leftArm.updateWorldMatrix(true, true);
            const qFore = worldAlignQuat(leftFore, bones.LeftHand || leftFore, new THREE.Vector3(0.9, 0.08, -0.28));
            if (qFore) pointPose.LeftForeArm = leftFore.quaternion.clone().premultiply(qFore);
            leftArm.quaternion.copy(saved);
            leftArm.updateWorldMatrix(true, true);
          }
        }
        if (leftArm) pose.LeftArmBase = pose.LeftArm;
        if (leftFore) pose.LeftForeArmBase = pose.LeftForeArm;
        if (bones.RightArm) pose.RightArmBase = pose.RightArm;
        if (bones.RightForeArm) pose.RightForeArmBase = pose.RightForeArm;

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

        // Movement state: where she stands, how far she has turned
        // toward the board, how high her pointing arm is.
        const move = {
          x: teacherGroup.position.x,
          turn: boardTopicRef.current ? 0.32 : 0,
          look: 0,
          gestureWeight: 0,
          nextGestureAt: performance.now() + 2000,
          gestureStartAt: -10000,
        };
        const armDirOf = (armName, foreName) => {
          const arm = bones[armName];
          const fore = bones[foreName];
          if (!arm || !fore) return null;
          const p0 = new THREE.Vector3();
          const p1 = new THREE.Vector3();
          arm.getWorldPosition(p0);
          fore.getWorldPosition(p1);
          return p1.sub(p0).normalize().toArray().map((v) => Math.round(v * 100) / 100);
        };

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
          const onBoard = !!boardTopicRef.current;

          // Where she stands: beside the board when a diagram is up,
          // left of centre when it is not. She glides, she never snaps.
          const targetX = onBoard ? TEACHER_BOARD_X : TEACHER_CENTER_X;
          move.x += (targetX - move.x) * Math.min(1, dt * 2.2);
          teacherGroup.position.x = move.x;
          const targetTurn = onBoard ? 0.32 : 0;
          move.turn += (targetTurn - move.turn) * Math.min(1, dt * 2.2);
          modelGroup.rotation.y = move.turn;

          // Pointing: while she speaks about a diagram, every few
          // seconds she raises her left hand toward the board for a
          // moment, then lets it fall again.
          if (talking && onBoard) {
            if (now >= move.nextGestureAt) {
              move.gestureStartAt = now;
              move.nextGestureAt = now + 4200 + Math.random() * 1600;
            }
          }
          const gAge = now - move.gestureStartAt;
          const gTarget = (gAge >= 0 && gAge <= 1600) ? Math.sin((gAge / 1600) * Math.PI) : 0;
          move.gestureWeight += (gTarget - move.gestureWeight) * Math.min(1, dt * 6);

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
          // every word beat, on top of a slow idle look-around. When a
          // diagram is up she also glances toward the board.
          talk.nodImpulse *= Math.exp(-dt * 4);
          const lookTarget = onBoard ? 0.28 + move.gestureWeight * 0.15 : 0;
          move.look += (lookTarget - move.look) * Math.min(1, dt * 3);
          if (headBone) {
            headBone.rotation.x = headBaseX
              + (talking ? Math.sin(t * 2.0) * 0.02 + talk.nodImpulse * 0.05 : Math.sin(t * 0.6) * 0.01);
            headBone.rotation.y = headBaseY + move.look + Math.sin(t * 0.5) * 0.02;
          }

          // Breathing: her chest rises and falls, her shoulders lift a
          // fraction with it, her arms sway almost imperceptibly.
          const breathe = Math.sin(t * 1.1);
          if (spine2) spine2.rotation.x = spineBaseX + breathe * 0.012;
          const swayQ = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(breathe * 0.008, 0, Math.sin(t * 0.8) * 0.006),
          );
          const applyArm = (armName, foreName, pointQ, forePointQ) => {
            const arm = bones[armName];
            const fore = bones[foreName];
            if (arm && pose[`${armName}Base`]) {
              const base = pose[`${armName}Base`];
              if (pointQ && move.gestureWeight > 0.01) {
                const q = new THREE.Quaternion().slerpQuaternions(base, pointQ, move.gestureWeight);
                arm.quaternion.copy(swayQ).multiply(q);
              } else {
                arm.quaternion.copy(swayQ).multiply(base);
              }
            }
            if (fore && pose[`${foreName}Base`]) {
              const base = pose[`${foreName}Base`];
              if (forePointQ && move.gestureWeight > 0.01) {
                const q = new THREE.Quaternion().slerpQuaternions(base, forePointQ, move.gestureWeight);
                fore.quaternion.copy(q);
              } else {
                fore.quaternion.copy(base);
              }
            }
          };
          applyArm('LeftArm', 'LeftForeArm', pointPose.LeftArm, pointPose.LeftForeArm);
          applyArm('RightArm', 'RightForeArm', null, null);

          // Gentle idle bob: stronger and quicker while she speaks.
          const bobAmp = talking ? 0.02 : 0.01;
          const bobSpeed = talking ? 2.6 : 1.1;
          modelGroup.position.y = Math.sin(t * bobSpeed) * bobAmp;

          // Live state for verification, from the browser console or a test.
          const diagram = (boardTopicRef.current && boardTopicRef.current.diagram) || {};
          window.__teacherTalk = {
            speaking: talking,
            viseme: talking && wordIdx >= 0 ? talk.viseme : 'viseme_sil',
            weight: Math.round(talk.weight * 100) / 100,
          };
          window.__classroom = {
            ready: true,
            mode: onBoard ? 'board' : 'center',
            boardId: boardTopicRef.current ? boardTopicRef.current.id : null,
            boardTitle: boardTopicRef.current ? boardTopicRef.current.title : null,
            boardType: diagram.type || null,
            boardLabels: (diagram.labels || []).slice(),
            boardEquation: boardTopicRef.current ? boardTopicRef.current.equation || null : null,
            cameraAzimuth: Math.round(controls.getAzimuthalAngle() * 1000) / 1000,
            teacherX: Math.round(teacherGroup.position.x * 100) / 100,
            bodyTurn: Math.round(move.turn * 100) / 100,
            gesture: Math.round(move.gestureWeight * 100) / 100,
            armLeftDir: armDirOf('LeftArm', 'LeftForeArm'),
            armRightDir: armDirOf('RightArm', 'RightForeArm'),
            bones: Object.keys(bones).sort(),
          };

          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        ro = new ResizeObserver(() => {
          if (cancelled || !mount) return;
          const w = mount.clientWidth;
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
        console.error('Classroom failed to load:', err);
        setError(err && err.message ? err.message : 'The classroom could not be loaded.');
        setStatus('error');
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (controls) controls.dispose();
      boardApiRef.current = null;
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
      teacherGroup = null;
      modelGroup = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  return (
    <div className={`classroom-scene ${className}`}>
      <div
        ref={mountRef}
        className="classroom-canvas"
        aria-label="Your AI teacher in her classroom, standing by the green board"
      >
        {status === 'loading' && (
          <div className="classroom-overlay">
            <div className="classroom-spinner" aria-hidden="true" />
            <p>{statusText}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="classroom-overlay classroom-error">
            <p><strong>The classroom could not be loaded.</strong></p>
            <p>{error}</p>
            <button className="btn btn-yellow btn-sm" onClick={() => setRetryKey((k) => k + 1)}>Try again</button>
          </div>
        )}
      </div>
      <p className="classroom-note">
        She is a 3D teacher, not a video. Her mouth moves with every word she speaks, and she points at the board while she explains. Drag to look around.
      </p>
    </div>
  );
}
