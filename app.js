const STORAGE_KEY = 'token-board-state-v2';
const OLD_STORAGE_KEY = 'token-board-state-v1';

const colorLabels = {
  white: '白',
  blue: '青',
  black: '黒',
  red: '赤',
  green: '緑',
  colorless: '無色',
  artifact: 'アーティファクト',
  gold: '多色'
};

const presets = [
  { name: '兵士', power: 1, toughness: 1, color: 'white', note: '' },
  { name: 'スピリット', power: 1, toughness: 1, color: 'white', note: '飛行' },
  { name: 'ゾンビ', power: 2, toughness: 2, color: 'black', note: '' },
  { name: 'ゴブリン', power: 1, toughness: 1, color: 'red', note: '' },
  { name: '宝物', power: 0, toughness: 0, color: 'artifact', note: '生け贄：好きな色1点' },
  { name: '食物', power: 0, toughness: 0, color: 'artifact', note: '' },
  { name: '手掛かり', power: 0, toughness: 0, color: 'artifact', note: '' },
  { name: '構築物', power: 0, toughness: 0, color: 'artifact', note: '' }
];

const elements = {
  presetList: document.querySelector('#presetList'),
  tokenList: document.querySelector('#tokenList'),
  emptyState: document.querySelector('#emptyState'),
  tokenSummary: document.querySelector('#tokenSummary'),
  addTokenButton: document.querySelector('#addTokenButton'),
  resetButton: document.querySelector('#resetButton'),
  untapAllButton: document.querySelector('#untapAllButton'),
  tokenDialog: document.querySelector('#tokenDialog'),
  tokenForm: document.querySelector('#tokenForm'),
  dialogTitle: document.querySelector('#dialogTitle'),
  editingTokenId: document.querySelector('#editingTokenId'),
  tokenName: document.querySelector('#tokenName'),
  tokenPower: document.querySelector('#tokenPower'),
  tokenToughness: document.querySelector('#tokenToughness'),
  tokenCount: document.querySelector('#tokenCount'),
  tokenUntapped: document.querySelector('#tokenUntapped'),
  tokenTapped: document.querySelector('#tokenTapped'),
  tokenColor: document.querySelector('#tokenColor'),
  tokenNote: document.querySelector('#tokenNote'),
  addCountFields: document.querySelector('#addCountFields'),
  editCountFields: document.querySelector('#editCountFields'),
  deleteTokenButton: document.querySelector('#deleteTokenButton'),
  closeDialogButton: document.querySelector('#closeDialogButton'),
  cancelDialogButton: document.querySelector('#cancelDialogButton'),
  installHintButton: document.querySelector('#installHintButton'),
  helpDialog: document.querySelector('#helpDialog'),
  closeHelpButton: document.querySelector('#closeHelpButton'),
  tokenCardTemplate: document.querySelector('#tokenCardTemplate')
};

let state = loadState();

function createDefaultState() {
  return { tokens: [] };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.tokens)) {
      return { tokens: saved.tokens.map(normalizeToken).filter(Boolean) };
    }

    const oldSaved = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
    if (oldSaved && Array.isArray(oldSaved.tokens)) {
      return { tokens: oldSaved.tokens.map(migrateOldToken).filter(Boolean) };
    }

    return createDefaultState();
  } catch {
    return createDefaultState();
  }
}

function migrateOldToken(token) {
  if (!token) return null;
  const count = clampNumber(token.count, 0, 999);
  return normalizeToken({
    ...token,
    untapped: token.tapped ? 0 : count,
    tapped: token.tapped ? count : 0
  });
}

function normalizeToken(token) {
  if (!token || !token.name) return null;
  const untapped = clampNumber(token.untapped ?? 0, 0, 999);
  const tapped = clampNumber(token.tapped ?? 0, 0, 999);
  return {
    id: token.id || createId(),
    name: String(token.name).trim() || 'トークン',
    power: clampNumber(token.power, 0, 99),
    toughness: clampNumber(token.toughness, 0, 99),
    untapped,
    tapped,
    color: colorLabels[token.color] ? token.color : 'colorless',
    note: String(token.note || '').trim()
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistAndRender() {
  saveState();
  render();
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return String(Date.now() + Math.random());
}

function sameKind(a, b) {
  return a.name === b.name &&
    a.power === b.power &&
    a.toughness === b.toughness &&
    a.color === b.color &&
    a.note === b.note;
}

function createToken({ name, power, toughness, count = 1, untapped, tapped = 0, color = 'colorless', note = '' }) {
  const initialUntapped = untapped === undefined ? count : untapped;
  return normalizeToken({
    id: createId(),
    name: String(name || 'トークン').trim(),
    power,
    toughness,
    untapped: clampNumber(initialUntapped, 0, 999),
    tapped: clampNumber(tapped, 0, 999),
    color,
    note: String(note || '').trim()
  });
}

function addToken(tokenInput) {
  const token = createToken(tokenInput);
  const sameToken = state.tokens.find((item) => sameKind(item, token));

  if (sameToken) {
    sameToken.untapped = clampNumber(sameToken.untapped + token.untapped, 0, 999);
    sameToken.tapped = clampNumber(sameToken.tapped + token.tapped, 0, 999);
  } else {
    state.tokens.unshift(token);
  }

  persistAndRender();
}

function updateToken(id, updates) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token) return;
  Object.assign(token, normalizeToken({ ...token, ...updates, id }));
  persistAndRender();
}

function removeToken(id) {
  state.tokens = state.tokens.filter((item) => item.id !== id);
  persistAndRender();
}

function totalOf(token) {
  return token.untapped + token.tapped;
}

function removeEmptyTokens() {
  state.tokens = state.tokens.filter((token) => totalOf(token) > 0);
}

function changeStatusCount(id, status, delta) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token) return;
  token[status] = clampNumber(token[status] + delta, 0, 999);
  removeEmptyTokens();
  persistAndRender();
}

function moveOne(id, from, to) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token || token[from] <= 0) return;
  token[from] -= 1;
  token[to] = clampNumber(token[to] + 1, 0, 999);
  persistAndRender();
}

function tapAll(id) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token || token.untapped <= 0) return;
  token.tapped = clampNumber(token.tapped + token.untapped, 0, 999);
  token.untapped = 0;
  persistAndRender();
}

function untapOneKind(id) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token || token.tapped <= 0) return;
  token.untapped = clampNumber(token.untapped + token.tapped, 0, 999);
  token.tapped = 0;
  persistAndRender();
}

function renderPresets() {
  elements.presetList.innerHTML = '';
  for (const preset of presets) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-chip';
    button.innerHTML = `<strong>${escapeHtml(preset.name)}</strong><small>${preset.power}/${preset.toughness}・${colorLabels[preset.color]}</small>`;
    button.addEventListener('click', () => addToken({ ...preset, count: 1 }));
    elements.presetList.appendChild(button);
  }
}

function render() {
  removeEmptyTokens();

  const totalCount = state.tokens.reduce((sum, token) => sum + totalOf(token), 0);
  const tappedCount = state.tokens.reduce((sum, token) => sum + token.tapped, 0);
  const untappedCount = state.tokens.reduce((sum, token) => sum + token.untapped, 0);
  elements.tokenSummary.textContent = `${state.tokens.length}種類 / ${totalCount}体（起:${untappedCount} 横:${tappedCount}）`;
  elements.emptyState.classList.toggle('hidden', state.tokens.length > 0);
  elements.tokenList.innerHTML = '';

  for (const token of state.tokens) {
    const card = elements.tokenCardTemplate.content.firstElementChild.cloneNode(true);
    card.classList.toggle('all-tapped', token.untapped === 0 && token.tapped > 0);

    const badge = card.querySelector('.token-badge');
    badge.className = `token-badge color-${token.color}`;

    card.querySelector('.token-name').textContent = token.name;
    card.querySelector('.token-stats').textContent = `${token.power}/${token.toughness}・${colorLabels[token.color] ?? '無色'}`;
    card.querySelector('.token-note').textContent = token.note || 'メモなし';
    card.querySelector('.total-count').textContent = totalOf(token);
    card.querySelector('.untapped-count').textContent = token.untapped;
    card.querySelector('.tapped-count').textContent = token.tapped;

    card.querySelector('.untapped-minus-ten').addEventListener('click', () => changeStatusCount(token.id, 'untapped', -10));
    card.querySelector('.untapped-minus').addEventListener('click', () => changeStatusCount(token.id, 'untapped', -1));
    card.querySelector('.untapped-plus').addEventListener('click', () => changeStatusCount(token.id, 'untapped', 1));
    card.querySelector('.untapped-plus-ten').addEventListener('click', () => changeStatusCount(token.id, 'untapped', 10));
    card.querySelector('.tapped-minus-ten').addEventListener('click', () => changeStatusCount(token.id, 'tapped', -10));
    card.querySelector('.tapped-minus').addEventListener('click', () => changeStatusCount(token.id, 'tapped', -1));
    card.querySelector('.tapped-plus').addEventListener('click', () => changeStatusCount(token.id, 'tapped', 1));
    card.querySelector('.tapped-plus-ten').addEventListener('click', () => changeStatusCount(token.id, 'tapped', 10));
    card.querySelector('.tap-one').addEventListener('click', () => moveOne(token.id, 'untapped', 'tapped'));
    card.querySelector('.untap-one').addEventListener('click', () => moveOne(token.id, 'tapped', 'untapped'));
    card.querySelector('.tap-all').addEventListener('click', () => tapAll(token.id));
    card.querySelector('.untap-card').addEventListener('click', () => untapOneKind(token.id));
    card.querySelector('.edit-button').addEventListener('click', () => openEditDialog(token));

    elements.tokenList.appendChild(card);
  }
}

function openAddDialog() {
  elements.dialogTitle.textContent = 'トークン追加';
  elements.editingTokenId.value = '';
  elements.tokenName.value = '兵士';
  elements.tokenPower.value = 1;
  elements.tokenToughness.value = 1;
  elements.tokenCount.value = 1;
  elements.tokenUntapped.value = 1;
  elements.tokenTapped.value = 0;
  elements.tokenColor.value = 'white';
  elements.tokenNote.value = '';
  elements.addCountFields.classList.remove('hidden');
  elements.editCountFields.classList.add('hidden');
  elements.deleteTokenButton.classList.add('hidden');
  showDialog(elements.tokenDialog);
  elements.tokenName.focus();
}

function openEditDialog(token) {
  elements.dialogTitle.textContent = 'トークン編集';
  elements.editingTokenId.value = token.id;
  elements.tokenName.value = token.name;
  elements.tokenPower.value = token.power;
  elements.tokenToughness.value = token.toughness;
  elements.tokenCount.value = Math.max(1, totalOf(token));
  elements.tokenUntapped.value = token.untapped;
  elements.tokenTapped.value = token.tapped;
  elements.tokenColor.value = token.color;
  elements.tokenNote.value = token.note;
  elements.addCountFields.classList.add('hidden');
  elements.editCountFields.classList.remove('hidden');
  elements.deleteTokenButton.classList.remove('hidden');
  showDialog(elements.tokenDialog);
}

function closeDialog(dialog) {
  dialog.close();
}

function showDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    alert('このブラウザではダイアログ表示に対応していません。Safariの最新版で開いてください。');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function bindEvents() {
  elements.addTokenButton.addEventListener('click', openAddDialog);
  elements.closeDialogButton.addEventListener('click', () => closeDialog(elements.tokenDialog));
  elements.cancelDialogButton.addEventListener('click', () => closeDialog(elements.tokenDialog));

  elements.tokenForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = elements.editingTokenId.value;

    if (id) {
      updateToken(id, {
        name: elements.tokenName.value.trim() || 'トークン',
        power: clampNumber(elements.tokenPower.value, 0, 99),
        toughness: clampNumber(elements.tokenToughness.value, 0, 99),
        untapped: clampNumber(elements.tokenUntapped.value, 0, 999),
        tapped: clampNumber(elements.tokenTapped.value, 0, 999),
        color: elements.tokenColor.value,
        note: elements.tokenNote.value.trim()
      });
    } else {
      addToken({
        name: elements.tokenName.value.trim() || 'トークン',
        power: clampNumber(elements.tokenPower.value, 0, 99),
        toughness: clampNumber(elements.tokenToughness.value, 0, 99),
        count: clampNumber(elements.tokenCount.value, 1, 999),
        color: elements.tokenColor.value,
        note: elements.tokenNote.value.trim()
      });
    }

    closeDialog(elements.tokenDialog);
  });

  elements.deleteTokenButton.addEventListener('click', () => {
    const id = elements.editingTokenId.value;
    if (!id) return;
    if (confirm('このトークンを削除しますか？')) {
      removeToken(id);
      closeDialog(elements.tokenDialog);
    }
  });

  elements.resetButton.addEventListener('click', () => {
    if (!confirm('盤面のトークンをすべて削除しますか？')) return;
    state = createDefaultState();
    persistAndRender();
  });

  elements.untapAllButton.addEventListener('click', () => {
    state.tokens.forEach((token) => {
      token.untapped = clampNumber(token.untapped + token.tapped, 0, 999);
      token.tapped = 0;
    });
    persistAndRender();
  });

  elements.installHintButton.addEventListener('click', () => showDialog(elements.helpDialog));
  elements.closeHelpButton.addEventListener('click', () => closeDialog(elements.helpDialog));

  document.addEventListener('dblclick', (event) => {
    if (event.target.closest('button')) {
      event.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('gesturestart', (event) => {
    event.preventDefault();
  }, { passive: false });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  }
}

renderPresets();
bindEvents();
render();
registerServiceWorker();
