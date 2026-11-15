// Face ID panel for the Teacher page: register your face once with the
// camera, then the teacher recognises you and greets you by name.
// On-device only: the face descriptor lives in this browser's
// localStorage, nothing is uploaded anywhere. Works without a camera
// too: the panel just explains what is missing instead of breaking.
import { useEffect, useRef, useState } from 'react';
import {
  loadFaceApi, startCamera, stopCamera, detectFaceDescriptor,
  enroll, recognize, getEnrollment, clearEnrollment,
} from '../lib/faceId';

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
  const [name, setName] = useState('');
  const [enrolled, setEnrolled] = useState(() => getEnrollment());
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('info');

  useEffect(() => () => {
    stopCamera(streamRef.current);
    streamRef.current = null;
  }, []);

  const stopCam = () => {
    stopCamera(streamRef.current);
    streamRef.current = null;
    setCameraOn(false);
  };

  const say = (text, kind = 'info') => {
    setMsg(text);
    setMsgKind(kind);
  };

  const openCamera = async () => {
    say('Loading face models…');
    const faceapi = await loadFaceApi();
    say('Opening your camera…');
    const stream = await startCamera(videoRef.current);
    streamRef.current = stream;
    setCameraOn(true);
    // Let the camera warm up and auto-focus before detecting.
    await new Promise((r) => setTimeout(r, 1200));
    return faceapi;
  };

  const register = async () => {
    if (!name.trim()) {
      say('Type your name first, then register your face.', 'error');
      return;
    }
    setBusy(true);
    try {
      const faceapi = await openCamera();
      say('Look at the camera…');
      const descriptor = await detectWithRetries(faceapi, videoRef.current);
      if (!descriptor) {
        say('No face in the frame. Move into the light, look at the camera and try again.', 'error');
        return;
      }
      enroll(name, descriptor);
      setEnrolled(getEnrollment());
      say(`Registered. Hi ${name.trim()}, I will recognise you next time.`, 'ok');
    } catch (e) {
      say(e && e.message ? e.message : 'Face registration did not work. Try again.', 'error');
    } finally {
      stopCam();
      setBusy(false);
    }
  };

  const recognise = async () => {
    setBusy(true);
    try {
      const faceapi = await openCamera();
      say('Looking for your face…');
      const descriptor = await detectWithRetries(faceapi, videoRef.current);
      const result = recognize(descriptor);
      if (result.match) {
        say(`Welcome back, ${result.name}.`, 'ok');
        if (onRecognized) onRecognized(result.name);
      } else if (result.reason === 'no-face') {
        say('No face in the frame. Move into the light, look at the camera and try again.', 'error');
      } else if (result.reason === 'no-enrollment') {
        say('No face is registered on this device yet. Register first.', 'error');
      } else {
        say('I do not recognise this face yet. If it is you, register again in better light.', 'error');
      }
    } catch (e) {
      say(e && e.message ? e.message : 'Face recognition did not work. Try again.', 'error');
    } finally {
      stopCam();
      setBusy(false);
    }
  };

  const forget = () => {
    clearEnrollment();
    setEnrolled(null);
    say('Your saved face is forgotten. Register again anytime.', 'info');
  };

  return (
    <div className="card faceid-card">
      <p className="kicker"><span className="dot">●</span> Face ID</p>
      <h3 style={{ margin: '6px 0 4px' }}>
        {enrolled ? `Hello, ${enrolled.name}` : 'Let the teacher know you'}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--ink-faint)' }}>
        Register your face once and your teacher will greet you by name.
        Your face never leaves this device, it is stored only in this browser.
      </p>

      <video
        ref={videoRef}
        className="faceid-video"
        style={{ display: cameraOn ? 'block' : 'none' }}
        muted
        playsInline
        aria-label="Camera preview for face recognition"
      />

      {!enrolled && (
        <div className="faceid-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name, e.g. Shahjan"
            aria-label="Your name"
            disabled={busy}
          />
          <button className="btn btn-yellow btn-sm" onClick={register} disabled={busy}>
            {busy ? 'Working…' : 'Register my face'}
          </button>
        </div>
      )}

      {enrolled && (
        <div className="faceid-row">
          <button className="btn btn-yellow btn-sm" onClick={recognise} disabled={busy}>
            {busy ? 'Working…' : 'Recognise me'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={forget} disabled={busy}>
            Forget my face
          </button>
        </div>
      )}

      {msg && (
        <p className={`faceid-msg ${msgKind === 'error' ? 'faceid-error' : msgKind === 'ok' ? 'faceid-ok' : ''}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
