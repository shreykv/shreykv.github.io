/* Pour Decisions: shared settings for the landing page and the board.
   The anon key is public by design; the goofproof_docs table's policies decide what it can do. */
(function () {
  var BACKEND = {
    url: 'https://wxdlgovtibygpigrleux.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGxnb3Z0aWJ5Z3BpZ3JsZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDMxNzAsImV4cCI6MjA4NTkxOTE3MH0.CjiUVWNGD2GJkX21BK1KBUKdPJ0FHVD82S8_38WwfVw'
  };
  // No 0/O or 1/I/L, so a code read aloud across a bar is typed right the first time.
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  var CODE_LEN = 6;
  var RECENT_KEY = 'pd.recent';

  function cleanCode(raw) { return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN); }
  function isCode(code) { return code.length === CODE_LEN && code.split('').every(function (c) { return ALPHABET.indexOf(c) !== -1; }); }
  function newCode() {
    var out = '', bytes = new Uint32Array(CODE_LEN);
    crypto.getRandomValues(bytes);
    for (var i = 0; i < CODE_LEN; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
    return out;
  }

  function recentCrawls() {
    try { var list = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(list) ? list : []; } catch (e) { return []; }
  }
  function rememberCrawl(code, info) {
    if (!isCode(code)) return;
    var list = recentCrawls(), old = null;
    list = list.filter(function (c) { if (c.code === code) { old = c; return false; } return true; });
    var next = { code: code, title: (info && info.title) || (old && old.title) || '', place: (info && info.place !== undefined ? info.place : old && old.place) || '', at: Date.now() };
    list.unshift(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8))); } catch (e) { /* storage is off */ }
  }
  function forgetCrawl(code) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentCrawls().filter(function (c) { return c.code !== code; }))); } catch (e) { /* storage is off */ }
  }

  window.PourDecisions = {
    backend: BACKEND, codeLength: CODE_LEN,
    cleanCode: cleanCode, isCode: isCode, newCode: newCode,
    recentCrawls: recentCrawls, rememberCrawl: rememberCrawl, forgetCrawl: forgetCrawl,
    boardURL: function (code) { return 'board.html?c=' + encodeURIComponent(code); }
  };
})();
