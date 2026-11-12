// Tiny safe Markdown renderer.
// The original JARVISH leaked raw "**bold**" into answers. This renders
// bold, italic, code, headings, bullet lists and paragraphs, and escapes
// all HTML first so nothing can inject markup.
export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return out;
}

export function renderMarkdown(text) {
  const lines = (text || '').split('\n');
  let html = '';
  let inList = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inline(line.slice(2)) + '</li>';
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (line.startsWith('### ')) html += '<h4>' + inline(line.slice(4)) + '</h4>';
    else if (line.startsWith('## ')) html += '<h3>' + inline(line.slice(3)) + '</h3>';
    else if (line.startsWith('# ')) html += '<h3>' + inline(line.slice(2)) + '</h3>';
    else if (line === '') html += '';
    else html += '<p>' + inline(line) + '</p>';
  }
  if (inList) html += '</ul>';
  return html;
}

// Strip every Markdown marker and return plain spoken text.
// Used for speech synthesis and the live caption, so a stray "**" or
// heading can never be read out loud or shown on screen.
export function stripMarkdown(text) {
  return (text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
