// Face ID panel for the Teacher page: register the whole class, a few
// photos per student, and keep the camera on so the teacher knows who
// is sitting in front of it, like a real teacher. One photo of each
// student shows under "View students".
// On-device only: faces and photos live in this browser's localStorage,
// nothing is uploaded anywhere. Works without a camera too: the panel
// just explains what is missing instead of breaking.
import { useEffect, useRef, useState } from 'react';
import {
  loadFaceApi, startCamera, stopCamera, detectFaceDescriptor, capturePhoto,
  addStudent, removeStudent, getStudents, recognizeStudent,
} from '../lib/faceId';

// How often the always-on camera checks who is in front of it.
const WATCH_INTERVAL_MS = 2000;
// Do not greet the same student again within a minute.
const GREET_COOLDOWN_MS = 60000;

async function detectWithRetries(faceapi, videoEl, tries = 6) {
  for (let i = 0; i < tries; i += 1) {
    const descriptor = await detectFaceDescriptor(faceapi, videoEl);
    if (descriptor) return descriptor;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

export default function FaceIdPanel({ onRecognized }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceapiRef = useRef(null);
  const loopTimerRef = useRef(null);
  const loopStopRef = useRef(true);
  const detectingRef = useRef(false);
  const capturingRef = useRef(false);
  const lastGreetRef = useRef({ name: null, at: 0 });
  const onRecognizedRef = useRef(onRecognized);
  useEffect(() => { onRecognizedRef.current = onRecognized; }, [onRecognized]);

  const [students, setStudents] = useState(() => getStudents());
  const [name, setName] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captures, setCaptures] = useState([]);
  const [showStudents, setShowStudents] = useState(false);
  const [seeing, setSeeing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('info');

  useEffect(() => { capturingRef.current = capturing; }, [capturing]);

  const stopWatchLoop = () => {
    loopStopRef.current = true;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  };

  const stopCam = () => {
    stopWatchLoop();
    stopCamera(streamRef.current);
    streamRef.current = null;
    setCameraOn(false);
    setSeeing(null);
  };

  // Stop everything when the panel unmounts.
  useEffect(() => () => stopCam(), []);

  const say = (text, kind = 'info') => {
    setMsg(text);
    setMsgKind(kind);
  };

  const openCamera = async () => {
    say('Loading face models…');
    const faceapi = await loadFaceApi();
    faceapiRef.current = faceapi;
    say('Opening your camera…');
    const stream = await startCamera(videoRef.current);
    streamRef.current = stream;
    setCameraOn(true);
    // Let the camera warm up and auto-focus before detecting.
    await new Promise((r) => setTimeout(r, 1200));
    return faceapi;
  };

  // The always-on watch: every couple of seconds, check who is sitting
  // in front of the camera. A new face gets a greeting; the same student
  // is not greeted again within a minute, so it never nags.
  const startWatchLoop = () => {
    loopStopRef.current = false;
    const tick = async () => {
      if (loopStopRef.current) return;
      if (!capturingRef.current && !detectingRef.current && videoRef.current) {
        detectingRef.current = true;
        try {
          const descriptor = await detectFaceDescriptor(faceapiRef.current, videoRef.current);
          const result = recognizeStudent(descriptor);
          if (result.match) {
            setSeeing(result.name);
            const last = lastGreetRef.current;
            const now = Date.now();
            if (last.name !== result.name || now - last.at > GREET_COOLDOWN_MS) {
              lastGreetRef.current = { name: result.name, at: now };
              if (onRecognizedRef.current) onRecognizedRef.current(result.name);
            }
          } else if (descriptor && result.reason === 'no-enrollment') {
            setSeeing('Shahjan');
            const last = lastGreetRef.current;
            const now = Date.now();
            if (last.name !== 'Shahjan' || now - last.at > GREET_COOLDOWN_MS) {
              lastGreetRef.current = { name: 'Shahjan', at: now };
              if (onRecognizedRef.current) onRecognizedRef.current('Shahjan');
            }
          } else {
            setSeeing(null);
          }
        } catch {
          // A single failed frame is not an error: just try again next tick.
        } finally {
          detectingRef.current = false;
        }
      }
      if (!loopStopRef.current) {
        loopTimerRef.current = setTimeout(tick, WATCH_INTERVAL_MS);
      }
    };
    loopTimerRef.current = setTimeout(tick, WATCH_INTERVAL_MS);
  };

  const toggleClassCamera = async () => {
    if (cameraOn) {
      stopCam();
      say('Class camera off. Turn it on anytime and I will watch for your students.', 'info');
      return;
    }
    setBusy(true);
    try {
      await openCamera();
      say('Class camera on. I will watch for your students and greet them by name.', 'ok');
      startWatchLoop();
    } catch (e) {
      say(e && e.message ? e.message : 'Face recognition did not work. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Registration, step 1: name in, camera opens, capture session starts.
  const startRegistration = async () => {
    if (!name.trim()) {
      say('Type your name first, then register your face.', 'error');
      return;
    }
    setBusy(true);
    try {
      await openCamera();
      setCaptures([]);
      setCapturing(true);
      say('Look at the camera and tap Capture photo. Turn your head a little between photos, a few angles make recognition much better.', 'info');
    } catch (e) {
      say(e && e.message ? e.message : 'Face registration did not work. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Registration, step 2: one more photo of the same face, from whatever
  // angle they are holding now. The first photo becomes their picture.
  const captureOne = async () => {
    setBusy(true);
    try {
      const descriptor = await detectWithRetries(faceapiRef.current, videoRef.current);
      if (!descriptor) {
        say('No face in the frame. Move into the light, look at the camera and try again.', 'error');
        return;
      }
      const photo = capturePhoto(videoRef.current);
      const next = [...captures, { descriptor, photo }];
      setCaptures(next);
      say(`${next.length} photo${next.length === 1 ? '' : 's'} added. Add a few more from different angles, then tap Done to save.`, 'ok');
    } catch (e) {
      say(e && e.message ? e.message : 'Could not capture that photo. Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Registration, step 3: save the student with every photo captured.
  const finishRegistration = () => {
    if (captures.length === 0) return;
    try {
      const student = addStudent({
        name,
        photo: captures[0].photo,
        descriptors: captures.map((c) => c.descriptor),
      });
      setStudents(getStudents());
      setCapturing(false);
      setCaptures([]);
      setName('');
      stopCam();
      say(`Registered. Hi ${student.name}, I will recognise you next time, from ${captures.length} photo${captures.length === 1 ? '' : 's'}.`, 'ok');
    } catch (e) {
      say(e && e.message ? e.message : 'Could not save this student. Try again.', 'error');
    }
  };

  const cancelRegistration = () => {
    setCapturing(false);
    setCaptures([]);
    stopCam();
    say('Registration cancelled. Nothing was saved.', 'info');
  };

  const forgetStudent = (id, studentName) => {
    removeStudent(id);
    setStudents(getStudents());
    say(`${studentName} was removed from the class list.`, 'info');
  };

  const initials = (studentName) => studentName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="card faceid-card">
      <p className="kicker"><span className="dot">●</span> Face ID</p>
      <h3 style={{ margin: '6px 0 4px' }}>
        {students.length > 0
          ? `${students.length} student${students.length === 1 ? '' : 's'} registered`
          : 'Let the teacher know your class'}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>
        Register the whole class, a few photos per student, and keep the
        class camera on: your teacher sees who is sitting in front of it
        and greets them by name, like a real teacher. Faces and photos
        never leave this device, they are stored only in this browser.
      </p>

      <video
        ref={videoRef}
        className="faceid-video"
        style={{ display: (cameraOn || capturing) ? 'block' : 'none' }}
        muted
        playsInline
        aria-label="Camera preview for face recognition"
      />

      {cameraOn && !capturing && (
        <p className="faceid-live">
          {seeing ? `👀 Seeing: ${seeing}` : '👀 Watching… sit in front of the camera.'}
        </p>
      )}

      {capturing ? (
        <>
          <p className="faceid-captures">
            {captures.length === 0
              ? `Capturing photos for ${name.trim()}…`
              : `${captures.length} photo${captures.length === 1 ? '' : 's'} captured for ${name.trim()}.`}
          </p>
          <div className="faceid-thumbs">
            {captures.map((c, i) => (
              <img key={i} src={c.photo} alt={`Capture ${i + 1} of ${name.trim()}`} />
            ))}
          </div>
          <div className="faceid-row">
            <button className="btn btn-yellow btn-sm" onClick={captureOne} disabled={busy}>
              {busy ? 'Working…' : '📸 Capture photo'}
            </button>
            <button className="btn btn-black btn-sm" onClick={finishRegistration} disabled={busy || captures.length === 0}>
              Done — save {name.trim() || 'student'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={cancelRegistration} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="faceid-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name, e.g. Shahjan"
              aria-label="Student name"
              disabled={busy}
            />
            <button className="btn btn-yellow btn-sm" onClick={startRegistration} disabled={busy}>
              {busy ? 'Working…' : 'Register my face'}
            </button>
          </div>
          <div className="faceid-row">
            <button className="btn btn-black btn-sm" onClick={toggleClassCamera} disabled={busy}>
              {cameraOn ? '■ Turn off class camera' : '▶ Turn on class camera'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowStudents(true)}>
              View students ({students.length})
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className={`faceid-msg ${msgKind === 'error' ? 'faceid-error' : msgKind === 'ok' ? 'faceid-ok' : ''}`}>
          {msg}
        </p>
      )}

      {showStudents && (
        <div className="faceid-modal-backdrop" role="dialog" aria-label="Registered students" onClick={() => setShowStudents(false)}>
          <div className="faceid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="faceid-modal-head">
              <h3 style={{ margin: 0 }}>Registered students ({students.length})</h3>
              <button type="button" className="convo-close" onClick={() => setShowStudents(false)} aria-label="Close">✕</button>
            </div>
            {students.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>
                No students registered yet. Type a name above and tap Register my face, a few photos each, and they will show up here.
              </p>
            ) : (
              <div className="faceid-students-grid">
                {students.map((s) => (
                  <div key={s.id} className="faceid-student">
                    {s.photo ? (
                      <img src={s.photo} alt={s.name} />
                    ) : (
                      <span className="faceid-student-initials" aria-label={s.name}>{initials(s.name)}</span>
                    )}
                    <p>{s.name}</p>
                    <span>{s.descriptors.length} photo{s.descriptors.length === 1 ? '' : 's'}</span>
                    <button type="button" className="faceid-remove" onClick={() => forgetStudent(s.id, s.name)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
