// Face ID: on-device face enrollment and recognition for the AI Teacher.
// Everything runs in the browser. face-api.js loads lazily from a CDN,
// the recognition models load from the same CDN, and the enrolled face
// descriptor lives only in this browser's localStorage under
// 'jarvish:faceId'. Nothing is uploaded to any server, ever.
// A match is a Euclidean distance under 0.6 between face descriptors.
const SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
  'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js',
];
const WEIGHTS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
const STORAGE_KEY = 'jarvish:faceId';
export const FACE_MATCH_THRESHOLD = 0.6;

let faceApiPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}

// Load face-api.js (first CDN that answers) and its three models.
export function loadFaceApi() {
  if (faceApiPromise) return faceApiPromise;
  const tryScript = async (i) => {
    if (i >= SCRIPT_URLS.length) throw new Error('Face models could not be downloaded. Check your connection and try again.');
    try {
      await loadScript(SCRIPT_URLS[i]);
    } catch {
      return tryScript(i + 1);
    }
    if (!window.faceapi) return tryScript(i + 1);
    return window.faceapi;
  };
  faceApiPromise = (async () => {
    const faceapi = await tryScript(0);
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(WEIGHTS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(WEIGHTS_URL),
    ]);
    return faceapi;
  })().catch((e) => {
    faceApiPromise = null;
    throw e;
  });
  return faceApiPromise;
}

// Open the front camera and attach it to a <video> element.
// Throws a friendly Error when there is no camera or permission is denied.
export async function startCamera(videoEl) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('This browser cannot open the camera. Try Chrome or Edge on a device with a camera.');
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
  } catch (e) {
    if (e && e.name === 'NotAllowedError') {
      throw new Error('Camera permission was denied. Allow the camera in the browser address bar and try again.');
    }
    if (e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')) {
      throw new Error('No camera was found on this device.');
    }
    throw new Error('Could not open the camera. Close other apps using it and try again.');
  }
  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

// Find the one face in the video frame and return its descriptor
// (a 128-number face fingerprint), or null when no face is visible.
// Throws when more than one face is in the frame.
export async function detectFaceDescriptor(faceapi, videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return detection.descriptor;
}

export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function getEnrollment() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.name || !Array.isArray(data.descriptor) || data.descriptor.length !== 128) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearEnrollment() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// Save this face under a name. The descriptor is the only thing stored.
export function enroll(name, descriptor) {
  const clean = (name || '').trim();
  if (!clean) throw new Error('Type your name first, then register your face.');
  if (!descriptor) throw new Error('No face in the frame. Look at the camera and try again.');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: clean, descriptor: Array.from(descriptor), when: new Date().toISOString() }));
  } catch {
    throw new Error('Could not save your face on this device. Check your browser storage settings.');
  }
  return clean;
}

// Compare the face in the frame with the enrolled one.
// Returns { match, name, distance }. match is false when nobody is
// enrolled, no face is visible, or the face does not match.
export function recognize(descriptor) {
  const enrolled = getEnrollment();
  if (!enrolled) return { match: false, name: null, distance: null, reason: 'no-enrollment' };
  if (!descriptor) return { match: false, name: null, distance: null, reason: 'no-face' };
  const distance = euclideanDistance(descriptor, enrolled.descriptor);
  if (distance < FACE_MATCH_THRESHOLD) {
    return { match: true, name: enrolled.name, distance, reason: 'match' };
  }
  return { match: false, name: null, distance, reason: 'no-match' };
}
