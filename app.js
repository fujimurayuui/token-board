const STORAGE_KEY = 'token-board-state-v1';

const presets = [
  { name: '兵士', power: 1, toughness: 1, color: 'white', note: '' },
  { name: 'スピリット', power: 1, toughness: 1, color: 'white', note: '飛行' },
  { name: 'ゾンビ', power: 2, toughness: 2, color: 'black', note: '' },
  { name: 'ゴブリン', power: 1, toughness: 1, color: 'red', note: '' },
  { name: '苗木', power: 1, toughness: 1, color: 'green', note: '' },
  { name: '宝物', power: 0, toughness: 0, color: 'artifact', note: '生け贄：好きな色1点' },
  { name: '食物', power: 0, toughness: 0, color: 'artifact', note: '2,生け贄：3点回復' },
  { name: '手掛かり', power: 0, toughness: 0, color: 'artifact', note: '2,生け贄：1枚引く' },
  { name: '構築物', power: 0, toughness: 0, color: 'artifact', note: 'サイズ可変' }
];

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

let state = loadState();

const elements = {
  presetList: document.querySelector('#presetList'),
  tokenList: document.querySelector('#tokenList'),
  emptyState: document.querySelector('#emptyState'),
  tokenSummary: document.querySelector('#tokenSummary'),
  playerLife: document.querySelector('#playerLife'),
  opponentLife: document.querySelector('#opponentLife'),
  energyCount: document.querySelector('#energyCount'),
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
  tokenColor: document.querySelector('#tokenColor'),
  tokenNote: document.querySelector('#tokenNote'),
  deleteTokenButton: document.querySelector('#deleteTokenButton'),
  closeDialogButton: document.querySelector('#closeDialogButton'),
  cancelDialogButton: document.querySelector('#cancelDialogButton'),
  installHintButton: document.querySelector('#installHintButton'),
  helpDialog: document.querySelector('#helpDialog'),
  closeHelpButton: document.querySelector('#closeHelpButton'),
  tokenCardTemplate: document.querySelector('#tokenCardTemplate')
};

function createDefaultState() {
  return {
    tokens: [],
    playerLife: 20,
    opponentLife: 20,
    energy: 0
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.tokens)) return createDefaultState();
    return {
      tokens: saved.tokens,
      playerLife: Number.isFinite(saved.playerLife) ? saved.playerLife : 20,
      opponentLife: Number.isFinite(saved.opponentLife) ? saved.opponentLife : 20,
      energy: Number.isFinite(saved.energy) ? saved.energy : 0
    };
  } catch {
    return createDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function createToken({ name, power, toughness, count = 1, color = 'colorless', note = '' }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name: name.trim(),
    power: clampNumber(power, 0, 99),
    toughness: clampNumber(toughness, 0, 99),
    count: clampNumber(count, 1, 999),
    color,
    note: note.trim(),
    tapped: false
  };
}

function addToken(tokenInput) {
  const token = createToken(tokenInput);
  const sameToken = state.tokens.find((item) =>
    item.name === token.name &&
    item.power === token.power &&
    item.toughness === token.toughness &&
    item.color === token.color &&
    item.note === token.note &&
    item.tapped === false
  );

  if (sameToken) {
    sameToken.count = clampNumber(sameToken.count + token.count, 1, 999);
  } else {
    state.tokens.unshift(token);
  }

  persistAndRender();
}

function updateToken(id, updates) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token) return;
  Object.assign(token, updates);
  persistAndRender();
}

function removeToken(id) {
  state.tokens = state.tokens.filter((item) => item.id !== id);
  persistAndRender();
}

function changeTokenCount(id, delta) {
  const token = state.tokens.find((item) => item.id === id);
  if (!token) return;
  token.count += delta;
  if (token.count <= 0) {
    removeToken(id);
    return;
  }
  token.count = clampNumber(token.count, 1, 999);
  persistAndRender();
}

function persistAndRender() {
  saveState();
  render();
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
  elements.playerLife.textContent = state.playerLife;
  elements.opponentLife.textContent = state.opponentLife;
  elements.energyCount.textContent = state.energy;

  const totalCount = state.tokens.reduce((sum, token) => sum + token.count, 0);
  elements.tokenSummary.textContent = `${state.tokens.length}種類 / ${totalCount}体`;
  elements.emptyState.classList.toggle('hidden', state.tokens.length > 0);
  elements.tokenList.innerHTML = '';

  for (const token of state.tokens) {
    const card = elements.tokenCardTemplate.content.firstElementChild.cloneNode(true);
    card.classList.toggle('is-tapped', token.tapped);

    const badge = card.querySelector('.token-badge');
    badge.className = `token-badge color-${token.color}`;

    card.querySelector('.tap-label').textContent = token.tapped ? 'タップ中' : 'アンタップ';
    card.querySelector('.token-name').textContent = token.name;
    card.querySelector('.token-stats').textContent = `${token.power}/${token.toughness}・${colorLabels[token.color] ?? '無色'}`;
    card.querySelector('.token-note').textContent = token.note || 'メモなし';
    card.querySelector('.token-count').textContent = token.count;

    card.querySelector('.tap-zone').addEventListener('click', () => {
      updateToken(token.id, { tapped: !token.tapped });
    });

    card.querySelector('.minus').addEventListener('click', () => changeTokenCount(token.id, -1));
    card.querySelector('.plus').addEventListener('click', () => changeTokenCount(token.id, 1));
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
  elements.tokenColor.value = 'white';
  elements.tokenNote.value = '';
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
  elements.tokenCount.value = token.count;
  elements.tokenColor.value = token.color;
  elements.tokenNote.value = token.note;
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
    const payload = {
      name: elements.tokenName.value.trim() || 'トークン',
      power: clampNumber(elements.tokenPower.value, 0, 99),
      toughness: clampNumber(elements.tokenToughness.value, 0, 99),
      count: clampNumber(elements.tokenCount.value, 1, 999),
      color: elements.tokenColor.value,
      note: elements.tokenNote.value.trim()
    };

    if (id) {
      updateToken(id, payload);
    } else {
      addToken(payload);
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
    if (!confirm('盤面・ライフ・エネルギーを初期化しますか？')) return;
    state = createDefaultState();
    persistAndRender();
  });

  elements.untapAllButton.addEventListener('click', () => {
    state.tokens.forEach((token) => { token.tapped = false; });
    persistAndRender();
  });

  document.querySelectorAll('[data-life]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.life;
      const delta = Number.parseInt(button.dataset.delta, 10);
      if (target === 'player') {
        state.playerLife = clampNumber(state.playerLife + delta, -99, 999);
      } else {
        state.opponentLife = clampNumber(state.opponentLife + delta, -99, 999);
      }
      persistAndRender();
    });
  });

  document.querySelectorAll('[data-energy-delta]').forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number.parseInt(button.dataset.energyDelta, 10);
      state.energy = clampNumber(state.energy + delta, 0, 999);
      persistAndRender();
    });
  });

  elements.installHintButton.addEventListener('click', () => showDialog(elements.helpDialog));
  elements.closeHelpButton.addEventListener('click', () => closeDialog(elements.helpDialog));
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
