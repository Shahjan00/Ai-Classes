// Marina 3D teacher model, base64 encoded GLB.
// Loaded with a dynamic import() so the model is a separate code-split chunk
// and never bloats the main bundle. The data lives in six small part files
// so each file stays small enough to upload cleanly.

import part1 from './marinaModel/part1.js';
import part2 from './marinaModel/part2.js';
import part3 from './marinaModel/part3.js';
import part4 from './marinaModel/part4.js';
import part5 from './marinaModel/part5.js';
import part6 from './marinaModel/part6.js';

export const MARINA_GLB_BASE64 = part1 + part2 + part3 + part4 + part5 + part6;
export default MARINA_GLB_BASE64;
