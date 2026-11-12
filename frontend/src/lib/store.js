// Tiny localStorage store: demo login + progress.
// The original stored progress locally too; we keep the same idea but
// the Student Dashboard never shows a stuck "Loading" state.
const read = (key, fallback) => {
  try {
    const v = localStorage.getItem('jarvish:' + key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem('jarvish:' + key, JSON.stringify(value)); } catch { /* ignore */ }
};

export const store = {
  get user() { return read('user', null); },
  set user(v) { write('user', v); },
  get chat() { return read('chat', []); },
  set chat(v) { write('chat', v); },
  get doneLessons() { return read('doneLessons', []); },
  markLessonDone(id) {
    const list = read('doneLessons', []);
    if (!list.includes(id)) { list.push(id); write('doneLessons', list); }
  },
  get quizScores() { return read('quizScores', {}); },
  saveQuizScore(setId, score, total) {
    const s = read('quizScores', {});
    s[setId] = { score, total, when: new Date().toISOString() };
    write('quizScores', s);
  },
  get savedChats() { return read('savedChats', []); },
  saveChat(messages) {
    const list = read('savedChats', []);
    const firstQ = (messages.find((m) => m.role === 'user') || {}).text || 'Conversation';
    const chat = {
      id: Date.now(),
      title: firstQ.length > 60 ? firstQ.slice(0, 60) + '…' : firstQ,
      when: new Date().toISOString(),
      count: messages.length,
      messages,
    };
    list.unshift(chat);
    write('savedChats', list.slice(0, 20));
    return chat;
  },
  deleteSavedChat(id) {
    write('savedChats', read('savedChats', []).filter((c) => c.id !== id));
  },
};
