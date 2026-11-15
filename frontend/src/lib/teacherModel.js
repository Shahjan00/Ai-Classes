// Ready Player Me teacher model, base64 encoded GLB.
// Loaded with a dynamic import() so the model is a separate code-split chunk
// and never bloats the main bundle. The data lives in seven small part files
// so each file stays small enough to upload cleanly.
//
// This is a SAMPLE avatar until the user sends his own Ready Player Me link.
// To swap in his avatar:
//   1. Download his GLB from the link he sends (append
//      ?morphTargets=ARKit,Oculus%20Visemes so it carries visemes).
//   2. Base64 it and split it into ~0.9 MB chunks, replacing part1-7.js.
//   3. Update MODEL_URL below to his link and MODEL_NAME to his avatar.
// The viewer (RpmTeacher.jsx) loads these bundled bytes by default, so the
// app never fetches the model at runtime.
//
// Source of this sample: a genuine Ready Player Me avatar ("brunette",
// with Oculus visemes) vendored from the TalkingHead project, downloaded
// from https://cdn.jsdelivr.net/gh/Utkarshraj5758/ai_teacher@main/frontend/public/avatars/brunette.glb
// (mirror: https://raw.githubusercontent.com/Utkarshraj5758/ai_teacher/main/frontend/public/avatars/brunette.glb).
// models.readyplayer.me itself did not answer from this machine, so the
// mirror above is the verified source. Verified: glTF magic, 4,721,528
// bytes, Wolf3D_Head carries 72 morph targets including viseme_aa,
// viseme_E, viseme_I, viseme_O, viseme_U, viseme_PP, viseme_FF, viseme_TH,
// viseme_DD, viseme_kk, viseme_CH, viseme_SS, viseme_nn, viseme_RR,
// jawOpen, eyeBlinkLeft and eyeBlinkRight.

import part1 from './teacherModel/part1.js';
import part2 from './teacherModel/part2.js';
import part3 from './teacherModel/part3.js';
import part4 from './teacherModel/part4.js';
import part5 from './teacherModel/part5.js';
import part6 from './teacherModel/part6.js';
import part7 from './teacherModel/part7.js';

export const MODEL_URL = 'https://cdn.jsdelivr.net/gh/Utkarshraj5758/ai_teacher@main/frontend/public/avatars/brunette.glb';
export const MODEL_NAME = 'Ready Player Me sample teacher (brunette)';
export const TEACHER_GLB_BASE64 = part1 + part2 + part3 + part4 + part5 + part6 + part7;
export default TEACHER_GLB_BASE64;
