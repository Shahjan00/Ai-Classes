// Face ID: on-device face enrollment and recognition for the AI Teacher.
// Everything runs in the browser. face-api.js loads lazily from a CDN,
// the recognition models load from the same CDN, and the enrolled faces
// live only in this browser's localStorage under 'jarvish:faceStudents'.
// Nothing is uploaded to any server, ever.
// A match is a Euclidean distance under 0.6 between face descriptors.
//
// The whole class can be registered, not just one student. Each student
// has a name, one display photo, and as many descriptors as they
// captured: registering the same face from a few angles makes
// recognition much more reliable, so registration takes several photos.
const SCRIPT_URLS = [
  'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js',
  'https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js',
];
const WEIGHTS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
const STUDENTS_KEY = 'jarvish:faceStudents';
const LEGACY_KEY = 'jarvish:faceId';
export const FACE_MATCH_THRESHOLD = 0.6;

let faceApiPromise = null;
let activeVideoEl = null;

export function getActiveVideo() {
  return activeVideoEl;
}

export function captureFrame(maxWidth = 640) {
  const el = activeVideoEl;
  if (!el || !el.videoWidth) return null;
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, maxWidth / el.videoWidth);
  canvas.width = Math.round(el.videoWidth * scale);
  canvas.height = Math.round(el.videoHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

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
  activeVideoEl = videoEl;
  return stream;
}

export function stopCamera(stream) {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
  activeVideoEl = null;
}

// Find the one face in the video frame and return its descriptor
// (a 128-number face fingerprint), or null when no face is visible.
export async function detectFaceDescriptor(faceapi, videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return detection.descriptor;
}

// Snap a small square photo of the current video frame, for the
// student's display picture. Mirrored like the preview.
export function capturePhoto(videoEl, size = 96) {
  const canvas = document.createElement('canvas');
  const w = videoEl.videoWidth || 640;
  const h = videoEl.videoHeight || 480;
  const side = Math.min(w, h);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.7);
}

export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function validStudent(s) {
  return s && typeof s.name === 'string' && s.name.trim()
    && Array.isArray(s.descriptors) && s.descriptors.length > 0
    && s.descriptors.every((d) => Array.isArray(d) && d.length === 128);
}

// The whole registered class. Each student: { id, name, photo, descriptors, when }.
// photo is one small JPEG data URL (the first photo they captured); a
// student registered before photos existed has photo: null.
export function getStudents() {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list = list.filter(validStudent);
    // One-time move from the old single-student storage, if it exists.
    if (list.length === 0) {
      const legacyRaw = localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          if (legacy && legacy.name && Array.isArray(legacy.descriptor) && legacy.descriptor.length === 128) {
            list = [{
              id: 'legacy-' + Date.now(),
              name: legacy.name,
              photo: null,
              descriptors: [legacy.descriptor],
              when: legacy.when || new Date().toISOString(),
            }];
            saveStudents(list);
          }
        } catch { /* ignore a broken legacy entry */ }
        try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
      }
    }
    return list;
  } catch {
    return [];
  }
}

export function saveStudents(list) {
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(list));
  } catch {
    throw new Error('Could not save faces on this device. Check your browser storage settings.');
  }
}

// Save a new student with all the photos they captured this session.
// descriptors is an array of 128-number arrays; photo is one data URL.
export function addStudent({ name, photo, descriptors }) {
  const clean = (name || '').trim();
  if (!clean) throw new Error('Type your name first, then register your face.');
  if (!descriptors || descriptors.length === 0) throw new Error('No face in the frame. Look at the camera and try again.');
  const list = getStudents();
  const student = {
    id: 'stu-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    name: clean,
    photo: photo || null,
    descriptors: descriptors.map((d) => Array.from(d)),
    when: new Date().toISOString(),
  };
  list.push(student);
  saveStudents(list);
  return student;
}

export function removeStudent(id) {
  saveStudents(getStudents().filter((s) => s.id !== id));
}

// Compare the face in the frame with every registered student, across
// every photo each of them captured. Returns the closest match:
// { match, name, studentId, distance }. match is false when nobody is
// registered, no face is visible, or the face does not match anyone.
export function recognizeStudent(descriptor) {
  const students = getStudents();
  if (students.length === 0) return { match: false, name: null, studentId: null, distance: null, reason: 'no-enrollment' };
  if (!descriptor) return { match: false, name: null, studentId: null, distance: null, reason: 'no-face' };
  let best = null;
  for (const student of students) {
    for (const known of student.descriptors) {
      const distance = euclideanDistance(descriptor, known);
      if (!best || distance < best.distance) {
        best = { name: student.name, studentId: student.id, distance };
      }
    }
  }
  if (best && best.distance < FACE_MATCH_THRESHOLD) {
    return { match: true, name: best.name, studentId: best.studentId, distance: best.distance, reason: 'match' };
  }
  return { match: false, name: null, studentId: null, distance: best ? best.distance : null, reason: 'no-match' };
}
