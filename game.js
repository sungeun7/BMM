/**
 * 부루마블 - 모바일용 보드게임
 * 2~4인 플레이, 2대2 팀전 지원, 16칸 보드
 */

/* ---------- 효과음 (Web Audio API) ---------- */
let audioCtx = null;

function initAudio() {
  if (audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function soundDice() {
  if (!audioCtx) return;
  playTone(280, 0.06, 'square', 0.12);
  setTimeout(() => playTone(350, 0.08, 'square', 0.1), 80);
}

function soundBuy() {
  if (!audioCtx) return;
  playTone(523, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.18), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 160);
}

function soundPay() {
  if (!audioCtx) return;
  playTone(200, 0.15, 'sawtooth', 0.12);
  setTimeout(() => playTone(180, 0.2, 'sawtooth', 0.1), 100);
}

function soundSalary() {
  if (!audioCtx) return;
  playTone(392, 0.08, 'sine', 0.18);
  setTimeout(() => playTone(523, 0.12, 'sine', 0.15), 90);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.12), 180);
}

function soundChance() {
  if (!audioCtx) return;
  playTone(440, 0.06, 'sine', 0.15);
  setTimeout(() => playTone(554, 0.08, 'sine', 0.12), 70);
  setTimeout(() => playTone(698, 0.1, 'sine', 0.1), 140);
}

function soundJail() {
  if (!audioCtx) return;
  playTone(220, 0.2, 'triangle', 0.12);
}

function soundWin() {
  if (!audioCtx) return;
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, 'sine', 0.18), i * 120);
  });
}

const BOARD_SIZE = 40;
const START_MONEY = 1500000;
/** 팀전 시 턴 순서: 팀A→팀B 번갈아 (1,3,2,4 = A,B,A,B) */
const TEAM_TURN_ORDER = [1, 3, 2, 4];
const SALARY = 200000; // 출발점 지나면 20만 원

const BUILD_COST_RATE = [0, 0.5, 0.7, 0.9];   // 별장 50%, 빌딩 70%, 호텔 90%
const BUILD_RENT_BONUS = [0, 0.5, 0.7, 0.9];   // 별장 +50%, 빌딩 +70%, 호텔 +90%

// 보드 셀 정의 (시작=오른쪽 아래) - 각 줄의 3번째 칸=황금카드, 6번째 칸=세금
// 첫줄: 아래쪽(충청/강원) | 둘째: 왼쪽(전라) | 셋째: 위쪽(경상) | 넷째: 오른쪽(서울/경기)
const CELLS = [
  { name: '출발', type: 'start', price: 0 },
  // 1~10: 첫번째 줄 — 3번째=황금카드, 6번째=세금
  { name: '원주', type: 'property', price: 200000, fee: 60000 },
  { name: '충주', type: 'property', price: 220000, fee: 66000 },
  { name: '황금카드', type: 'chance', price: 0 },
  { name: '강릉', type: 'property', price: 240000, fee: 72000 },
  { name: '천안', type: 'property', price: 260000, fee: 78000 },
  { name: '세금', type: 'tax', price: 80000 },
  { name: '청주', type: 'property', price: 280000, fee: 84000 },
  { name: '춘천', type: 'property', price: 280000, fee: 84000 },
  { name: '세종', type: 'property', price: 300000, fee: 90000 },
  { name: '대전', type: 'property', price: 320000, fee: 96000 },
  // 11~20: 두번째 줄 — 3번째=황금카드, 6번째=세금
  { name: '무인도', type: 'jail', price: 0 },
  { name: '군산', type: 'property', price: 180000, fee: 54000 },
  { name: '황금카드', type: 'chance', price: 0 },
  { name: '순천', type: 'property', price: 220000, fee: 66000 },
  { name: '목포', type: 'property', price: 240000, fee: 72000 },
  { name: '세금', type: 'tax', price: 100000 },
  { name: '여수', type: 'property', price: 260000, fee: 78000 },
  { name: '제주', type: 'property', price: 300000, fee: 90000 },
  { name: '전주', type: 'property', price: 300000, fee: 90000 },
  { name: '광주', type: 'property', price: 320000, fee: 96000 },
  // 21~30: 세번째 줄 — 3번째=황금카드, 6번째=세금
  { name: '진주', type: 'property', price: 200000, fee: 60000 },
  { name: '김해', type: 'property', price: 220000, fee: 66000 },
  { name: '황금카드', type: 'chance', price: 0 },
  { name: '포항', type: 'property', price: 240000, fee: 72000 },
  { name: '경주', type: 'property', price: 260000, fee: 78000 },
  { name: '세금', type: 'tax', price: 120000 },
  { name: '울산', type: 'property', price: 280000, fee: 84000 },
  { name: '창원', type: 'property', price: 300000, fee: 90000 },
  { name: '대구', type: 'property', price: 320000, fee: 96000 },
  { name: '부산', type: 'property', price: 380000, fee: 114000 },
  // 31~39: 네번째 줄 — 3번째=황금카드, 6번째=세금
  { name: '김포', type: 'property', price: 200000, fee: 60000 },
  { name: '의정부', type: 'property', price: 220000, fee: 66000 },
  { name: '황금카드', type: 'chance', price: 0 },
  { name: '고양', type: 'property', price: 240000, fee: 72000 },
  { name: '성남', type: 'property', price: 260000, fee: 78000 },
  { name: '세금', type: 'tax', price: 100000 },
  { name: '수원', type: 'property', price: 280000, fee: 84000 },
  { name: '인천', type: 'property', price: 300000, fee: 90000 },
  { name: '서울', type: 'property', price: 500000, fee: 150000 },
];

// 11x11 그리드, 시작=오른쪽 아래(10,10), 첫줄=아래→둘째=왼쪽→셋째=위→넷째=오른쪽
const CELL_POSITIONS = (() => {
  const pos = [];
  pos.push([10, 10]);                                    // 0: 출발 (오른쪽 아래)
  for (let c = 9; c >= 0; c--) pos.push([c, 10]);        // 1~10: 아래쪽 변 (왼쪽으로)
  for (let r = 9; r >= 0; r--) pos.push([0, r]);         // 11~20: 왼쪽 변 (위로)
  for (let c = 1; c <= 10; c++) pos.push([c, 0]);       // 21~30: 위쪽 변 (오른쪽으로)
  for (let r = 1; r <= 9; r++) pos.push([10, r]);       // 31~39: 오른쪽 변 (아래로)
  return pos;
})();

const state = {
  numPlayers: 2,
  teamMode: false,
  vsComputer: false,
  currentPlayer: 1,
  positions: [0, 0, 0, 0],
  money: [START_MONEY, START_MONEY, START_MONEY, START_MONEY],
  ownership: new Array(BOARD_SIZE).fill(0),
  buildingLevel: new Array(BOARD_SIZE).fill(0), // 0=없음, 1=별장, 2=빌딩, 3=호텔
  bankrupt: [false, false, false, false],
  canRoll: true,
  rolledThisTurn: false,
  lastDice: null,
  pendingPayment: null,
  jailTurns: [0, 0, 0, 0], // 무인도 N턴 휴식 (0 = 휴식 없음)
};

const dom = {};

function getTeam(player) {
  if (!state.teamMode) return null;
  return player <= 2 ? 1 : 2;
}

function isTeammate(a, b) {
  return state.teamMode && getTeam(a) === getTeam(b);
}

const LINE_RANGES = [[1, 10], [11, 20], [21, 30], [31, 39]];

function getLineForCell(cellIndex) {
  for (let i = 0; i < LINE_RANGES.length; i++) {
    const [a, b] = LINE_RANGES[i];
    if (cellIndex >= a && cellIndex <= b) return i;
  }
  return -1;
}

function getPropertyIndicesInLine(lineIndex) {
  const [a, b] = LINE_RANGES[lineIndex];
  const list = [];
  for (let i = a; i <= b; i++) {
    if (CELLS[i] && CELLS[i].type === 'property') list.push(i);
  }
  return list;
}

function ownsFullLine(owner, lineIndex) {
  const indices = getPropertyIndicesInLine(lineIndex);
  return indices.length > 0 && indices.every((i) => state.ownership[i] === owner);
}

const LINE_BONUS = 1.3;

function getRentFee(cellIndex, owner) {
  const cell = CELLS[cellIndex];
  if (!cell || cell.type !== 'property' || !cell.fee) return 0;
  let fee = cell.fee;
  const level = state.buildingLevel[cellIndex] || 0;
  fee = Math.floor(fee * (1 + BUILD_RENT_BONUS[level]));
  const line = getLineForCell(cellIndex);
  if (line >= 0 && ownsFullLine(owner, line)) fee = Math.floor(fee * LINE_BONUS);
  return fee;
}

function init() {
  dom.board = document.getElementById('board');
  dom.players = document.getElementById('players');
  dom.rollBtn = document.getElementById('rollBtn');
  dom.turnText = document.getElementById('turnText');
  dom.modal = document.getElementById('modal');
  dom.modalTitle = document.getElementById('modalTitle');
  dom.modalMessage = document.getElementById('modalMessage');
  dom.modalBuy = document.getElementById('modalBuy');
  dom.modalPass = document.getElementById('modalPass');
  dom.modalPrice = document.getElementById('modalPrice');
  dom.modalSellFirst = document.getElementById('modalSellFirst');
  dom.startScreen = document.getElementById('startScreen');
  dom.header = document.getElementById('header');
  dom.gameArea = document.getElementById('gameArea');
  dom.teamModeWrap = document.getElementById('teamModeWrap');
  dom.teamModeCheck = document.getElementById('teamModeCheck');

  bindStartScreen();
  bindEvents();
}

function bindStartScreen() {
  let selectedPlayers = 2;
  let vsComputer = false;

  document.querySelectorAll('.mode-opt[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-opt').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      vsComputer = btn.dataset.mode === 'computer';
      const countWrap = document.querySelector('.player-count');
      const countLabel = document.querySelector('.player-count-label');
      const teamWrap = dom.teamModeWrap;
      if (countWrap) countWrap.classList.remove('hidden');
      if (countLabel) countLabel.classList.remove('hidden');
      if (teamWrap) teamWrap.classList.toggle('hidden', selectedPlayers !== 4);
    });
  });

  document.querySelectorAll('.btn-opt[data-players]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-opt[data-players]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPlayers = parseInt(btn.dataset.players, 10);
      dom.teamModeWrap.classList.toggle('hidden', selectedPlayers !== 4);
      if (selectedPlayers !== 4) dom.teamModeCheck.checked = false;
    });
  });
  document.querySelector('.btn-opt[data-players="2"]').classList.add('selected');

  document.getElementById('startGameBtn').addEventListener('click', () => {
    const num = selectedPlayers;
    const teamMode = num === 4 && dom.teamModeCheck.checked;
    startGame(num, teamMode, vsComputer);
  });
}

function startGame(numPlayers, teamMode, vsComputer) {
  if (state._computerTimer) clearTimeout(state._computerTimer);
  state._computerTimer = null;
  state.numPlayers = numPlayers;
  state.teamMode = teamMode || false;
  state.vsComputer = !!vsComputer;
  state.currentPlayer = 1;
  state.positions = [0, 0, 0, 0];
  state.money = [START_MONEY, START_MONEY, START_MONEY, START_MONEY];
  state.ownership = new Array(BOARD_SIZE).fill(0);
  state.buildingLevel = new Array(BOARD_SIZE).fill(0);
  state.bankrupt = [false, false, false, false];
  state.canRoll = true;
  state.rolledThisTurn = false;
  state.lastDice = null;
  state.pendingPayment = null;
  state.jailTurns = [0, 0, 0, 0];
  dom.rollBtn.disabled = false;

  dom.startScreen.classList.add('hidden');
  dom.header.classList.remove('hidden');
  dom.gameArea.classList.remove('hidden');

  buildBoard();
  renderPlayers();
  updatePanels();
  updateTurnText();
}

function buildBoard() {
  dom.board.innerHTML = '';
  const grid = [...Array(11)].map(() => [...Array(11)].map(() => null));

  CELLS.forEach((cell, i) => {
    const [col, row] = CELL_POSITIONS[i];
    grid[row][col] = { index: i, ...cell };
  });

  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 11; col++) {
      const data = grid[row][col];
      const div = document.createElement('div');
      div.className = 'cell' + (data ? ' filled' : '');
      if (data) {
        div.dataset.index = data.index;
        div.classList.add(data.type);
        if (data.type === 'property' && state.ownership[data.index]) {
          div.classList.add(`owned-${state.ownership[data.index]}`);
        }
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = data.name;
        div.appendChild(name);
        if (data.type === 'property' && data.price) {
          const price = document.createElement('span');
          price.className = 'price';
          price.textContent = `₩${(data.price / 10000).toFixed(0)}만`;
          div.appendChild(price);
          const icon = document.createElement('span');
          icon.className = 'building-icon';
          icon.textContent = BUILD_SYMBOLS[state.buildingLevel[data.index] || 0];
          div.appendChild(icon);
        }
      }
      dom.board.appendChild(div);
    }
  }
}

function renderPlayers() {
  dom.players.innerHTML = '';
  for (let p = 1; p <= state.numPlayers; p++) {
    const token = document.createElement('div');
    token.className = 'player-token';
    token.dataset.player = p;
    const pos = getTokenPosition(state.positions[p - 1], p);
    token.style.left = pos.left;
    token.style.top = pos.top;
    dom.players.appendChild(token);
  }
}

const TOKEN_OFFSETS = [[-3, -3], [3, -3], [3, 3], [-3, 3]];
const TOKEN_SIZE_PX = 16;

function getTokenPosition(cellIndex, player) {
  if (cellIndex < 0 || cellIndex >= CELL_POSITIONS.length) cellIndex = 0;
  const [col, row] = CELL_POSITIONS[cellIndex];
  const cellSize = 100 / 11;
  const offset = cellSize / 2;
  let left = col * cellSize + offset;
  let top = row * cellSize + offset;
  const [dx, dy] = TOKEN_OFFSETS[(player || state.currentPlayer) - 1] || [0, 0];
  left += dx * (cellSize / 12);
  top += dy * (cellSize / 12);
  const half = TOKEN_SIZE_PX / 2;
  return {
    left: `calc(${left}% - ${half}px)`,
    top: `calc(${top}% - ${half}px)`
  };
}

function updateTokenPosition(player) {
  const token = dom.players.querySelector(`[data-player="${player}"]`);
  if (!token) return;
  const pos = getTokenPosition(state.positions[player - 1], player);
  token.style.left = pos.left;
  token.style.top = pos.top;
}

function goToMenu() {
  if (state._computerTimer) {
    clearTimeout(state._computerTimer);
    state._computerTimer = null;
  }
  dom.header.classList.add('hidden');
  dom.gameArea.classList.add('hidden');
  dom.startScreen.classList.remove('hidden');
}

function bindEvents() {
  const backToMenuBtn = document.getElementById('backToMenuBtn');
  if (backToMenuBtn) backToMenuBtn.addEventListener('click', goToMenu);
  dom.rollBtn.addEventListener('click', rollDice);
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    if (!dom.rollBtn || dom.rollBtn.disabled || !state.canRoll) return;
    if (dom.gameArea && dom.gameArea.classList.contains('hidden')) return;
    e.preventDefault();
    rollDice();
  });
  dom.modalBuy.addEventListener('click', () => modalAction(true));
  dom.modalPass.addEventListener('click', () => modalAction(false));
  const modalSellFirst = document.getElementById('modalSellFirst');
  if (modalSellFirst) {
    modalSellFirst.addEventListener('click', () => {
      const cellIndex = parseInt(dom.modal.dataset.cellIndex, 10);
      dom.modal.classList.add('hidden');
      showSellModal(null, () => showBuyModal(cellIndex));
    });
  }
}

function rollDice() {
  if (!state.canRoll) return;
  initAudio();
  soundDice();
  state.canRoll = false;
  state.rolledThisTurn = true;

  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  state.lastDice = [d1, d2];
  const steps = d1 + d2;

  showDice(d1, d2);

  setTimeout(() => {
    moveCurrentPlayer(steps);
  }, 600);
}

function tryNextTurn() {
  if (state.lastDice && state.lastDice[0] === state.lastDice[1]) {
    state.lastDice = null;
    state.canRoll = true;
    showToast('더블! 한 번 더 굴립니다.');
    updateTurnText();
    for (let p = 1; p <= 4; p++) {
      const panel = document.getElementById('panel' + p);
      if (panel) panel.classList.toggle('active', state.currentPlayer === p);
    }
    if (state.vsComputer && state.currentPlayer >= 2 && !state.bankrupt[state.currentPlayer - 1]) scheduleComputerTurn();
    return;
  }
  state.lastDice = null;
  nextTurn();
}

const COMPUTER_DELAY_MS = 800;

function scheduleComputerTurn() {
  state._computerTimer = setTimeout(() => {
    const p = state.currentPlayer;
    if (!state.canRoll || p < 2 || state.bankrupt[p - 1]) return;
    rollDice();
  }, COMPUTER_DELAY_MS);
}

function isComputerTurn() {
  return state.vsComputer && state.currentPlayer >= 2;
}

function computerBuy(cellIndex) {
  const cell = CELLS[cellIndex];
  const idx = state.currentPlayer - 1;
  const canAfford = state.money[idx] >= cell.price;
  const keepReserve = state.money[idx] - cell.price >= 200000;
  if (canAfford && keepReserve) {
    state.money[idx] -= cell.price;
    state.ownership[cellIndex] = state.currentPlayer;
    soundBuy();
    showToast(`컴퓨터가 ${cell.name}을(를) 구매했습니다.`);
    updateBoardOwnership();
    updatePanels();
  } else {
    showToast('컴퓨터가 패스했습니다.');
  }
  tryNextTurn();
}

function computerBuild(cellIndex) {
  const level = state.buildingLevel[cellIndex] || 0;
  if (level >= 3) {
    tryNextTurn();
    return;
  }
  const idx = state.currentPlayer - 1;
  const nextLv = level + 1;
  const cost = getBuildCost(cellIndex, nextLv);
  const cell = CELLS[cellIndex];
  if (state.money[idx] >= cost && state.money[idx] - cost >= 150000) {
    state.money[idx] -= cost;
    state.buildingLevel[cellIndex] = nextLv;
    soundBuy();
    showToast(`컴퓨터가 ${cell.name}에 ${BUILD_NAMES[nextLv]}을(를) 지었습니다.`);
    updatePanels();
    updateBoardBuildings();
  }
  tryNextTurn();
}

function computerSell(requiredAmount, onComplete) {
  const idx = state.currentPlayer - 1;
  const owner = state.currentPlayer;
  const props = CELLS.map((c, i) => ({ i, cell: c }))
    .filter(({ i, cell }) => cell.type === 'property' && state.ownership[i] === owner)
    .map(({ i }) => ({ i, sellPrice: getSellPrice(i) }))
    .sort((a, b) => a.sellPrice - b.sellPrice);

  function sellOne() {
    if (state.money[idx] >= requiredAmount) {
      onComplete();
      return;
    }
    if (props.length === 0) {
      state.bankrupt[idx] = true;
      checkBankrupt();
      tryNextTurn();
      return;
    }
    const { i } = props.shift();
    const price = getSellPrice(i);
    state.money[idx] += price;
    state.ownership[i] = 0;
    state.buildingLevel[i] = 0;
    showToast(`컴퓨터가 ${CELLS[i].name}을(를) 팔았습니다.`);
    updateBoardOwnership();
    updateBoardBuildings();
    updatePanels();
    setTimeout(sellOne, 400);
  }
  sellOne();
}

function showDice(d1, d2) {
  const dice1 = document.getElementById('dice1');
  const dice2 = document.getElementById('dice2');
  dice1.className = 'dice roll-' + d1;
  dice2.className = 'dice roll-' + d2;
  [dice1, dice2].forEach((el, i) => {
    const val = i === 0 ? d1 : d2;
    let dots = el.querySelectorAll('.dot');
    while (dots.length < val) {
      const dot = document.createElement('span');
      dot.className = 'dot';
      el.appendChild(dot);
      dots = el.querySelectorAll('.dot');
    }
    while (dots.length > val) {
      dots[dots.length - 1].remove();
      dots = el.querySelectorAll('.dot');
    }
  });
}

const MOVE_STEP_MS = 280;

function moveCurrentPlayer(steps) {
  const player = state.currentPlayer;
  let pos = state.positions[player - 1];
  let step = 0;

  function doOneStep() {
    if (step >= steps) {
      updatePanels();
      updateBoardOwnership();
      setTimeout(() => landOnCell(pos, player), 320);
      return;
    }
    pos = (pos + 1) % BOARD_SIZE;
    state.positions[player - 1] = pos;
    if (pos === 0) {
      state.money[player - 1] += SALARY;
      soundSalary();
      showToast(`월급 ₩${(SALARY / 10000).toFixed(0)}만 수령!`);
    }
    updateTokenPosition(player);
    step++;
    setTimeout(doOneStep, MOVE_STEP_MS);
  }

  doOneStep();
}

function landOnCell(cellIndex, player) {
  const cell = CELLS[cellIndex];
  const idx = player - 1;

  switch (cell.type) {
    case 'start':
      showToast('출발지점입니다.');
      tryNextTurn();
      break;
    case 'property':
      if (state.ownership[cellIndex] === 0) {
        if (isComputerTurn()) {
          computerBuy(cellIndex);
        } else {
          showBuyModal(cellIndex);
        }
      } else if (isTeammate(player, state.ownership[cellIndex])) {
        showToast('팀원 땅입니다.');
        tryNextTurn();
      } else if (state.ownership[cellIndex] !== player) {
        const owner = state.ownership[cellIndex];
        const fee = getRentFee(cellIndex, owner);
        if (state.money[idx] >= fee) {
          state.money[idx] -= fee;
          state.money[owner - 1] += fee;
          soundPay();
          showToast(ownsFullLine(owner, getLineForCell(cellIndex)) ? `통행료(한라인 보너스 +30%) ₩${(fee / 10000).toFixed(0)}만 지불!` : `통행료 ₩${(fee / 10000).toFixed(0)}만 지불!`);
          checkBankrupt();
          tryNextTurn();
        } else {
          if (isComputerTurn()) {
            computerSell(fee, () => {
              state.money[idx] -= fee;
              state.money[owner - 1] += fee;
              soundPay();
              checkBankrupt();
              tryNextTurn();
            });
          } else {
            state.pendingPayment = { type: 'rent', amount: fee, toPlayer: owner, cellIndex };
            showSellModal(fee, () => {
              state.money[idx] -= fee;
              state.money[owner - 1] += fee;
              soundPay();
              checkBankrupt();
              tryNextTurn();
            });
          }
        }
      } else {
        if (isComputerTurn()) {
          computerBuild(cellIndex);
        } else {
          showBuildModal(cellIndex);
        }
      }
      break;
    case 'tax':
      const tax = cell.price;
      if (state.money[idx] >= tax) {
        state.money[idx] -= tax;
        soundPay();
        showToast(`세금 ₩${(tax / 10000).toFixed(0)}만 납부!`);
        checkBankrupt();
        tryNextTurn();
      } else {
        if (isComputerTurn()) {
          computerSell(tax, () => {
            state.money[idx] -= tax;
            soundPay();
            checkBankrupt();
            tryNextTurn();
          });
        } else {
          state.pendingPayment = { type: 'tax', amount: tax };
          showSellModal(tax, () => {
            state.money[idx] -= tax;
            soundPay();
            checkBankrupt();
            tryNextTurn();
          });
        }
      }
      break;
    case 'jail':
      state.jailTurns[idx] = 3;
      soundJail();
      showToast('무인도! 3턴 휴식.');
      tryNextTurn();
      break;
    case 'chance':
      const chanceResults = [
        { msg: '복권 당첨! ₩10만 수령', money: 100000 },
        { msg: '길에서 ₩5만 획득', money: 50000 },
        { msg: '기부금 ₩3만', money: -30000 },
        { msg: '보너스 ₩8만', money: 80000 },
      ];
      const r = chanceResults[Math.floor(Math.random() * chanceResults.length)];
      state.money[idx] += r.money;
      soundChance();
      showToast(r.msg);
      checkBankrupt();
      tryNextTurn();
      break;
    default:
      tryNextTurn();
  }
}

const SELL_RATIO = 0.7; // 땅+건물 판매 시 가격의 70%

function getSellPrice(cellIndex) {
  const c = CELLS[cellIndex];
  if (!c || !c.price) return 0;
  const level = state.buildingLevel[cellIndex] || 0;
  let totalValue = c.price;
  for (let lv = 1; lv <= level; lv++) {
    totalValue += Math.floor(c.price * BUILD_COST_RATE[lv]);
  }
  return Math.floor(totalValue * SELL_RATIO);
}

function showBuyModal(cellIndex) {
  const cell = CELLS[cellIndex];
  dom.modal.dataset.cellIndex = cellIndex;
  dom.modalTitle.textContent = '땅 구매';
  dom.modalMessage.textContent = `${cell.name}을(를) ₩${(cell.price / 10000).toFixed(0)}만에 구매하시겠습니까?`;
  dom.modalPrice.textContent = (cell.price / 10000).toFixed(0) + '만';
  const canAfford = state.money[state.currentPlayer - 1] >= cell.price;
  dom.modalBuy.disabled = !canAfford;
  const hasProps = CELLS.some((c, i) => c.type === 'property' && state.ownership[i] === state.currentPlayer);
  if (dom.modalSellFirst) dom.modalSellFirst.classList.toggle('hidden', canAfford || !hasProps);
  dom.modal.classList.remove('hidden');
}

const BUILD_NAMES = ['', '별장', '빌딩', '호텔'];
const BUILD_SYMBOLS = ['', '▲', '■', '★'];

function getBuildCost(cellIndex, nextLevel) {
  const cell = CELLS[cellIndex];
  return cell && cell.price ? Math.floor(cell.price * BUILD_COST_RATE[nextLevel]) : 0;
}

function showBuildModal(cellIndex) {
  const level = state.buildingLevel[cellIndex] || 0;
  const cell = CELLS[cellIndex];
  const buildModal = document.getElementById('buildModal');
  const buildModalTitle = document.getElementById('buildModalTitle');
  const buildModalMessage = document.getElementById('buildModalMessage');
  const buildOptions = document.getElementById('buildOptions');
  const buildModalPass = document.getElementById('buildModalPass');

  buildModalTitle.textContent = `${cell.name} - 건물 짓기`;
  buildModalMessage.textContent = level >= 3 ? '호텔까지 완성되었습니다.' : '건물을 짓으면 통행료가 올라갑니다.';

  if (level >= 3) {
    buildOptions.innerHTML = '';
    buildModalPass.onclick = () => {
      buildModal.classList.add('hidden');
      tryNextTurn();
    };
    buildModal.classList.remove('hidden');
    return;
  }

  const player = state.currentPlayer;
  const money = state.money[player - 1];
  const nextLv = level + 1;
  const cost = getBuildCost(cellIndex, nextLv);
  const canAfford = money >= cost;
  const bonus = BUILD_RENT_BONUS[nextLv] * 100;

  buildOptions.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn build-opt' + (canAfford ? '' : ' disabled');
  btn.innerHTML = `<span class="build-symbol">${BUILD_SYMBOLS[nextLv]}</span> ${BUILD_NAMES[nextLv]} ₩${(cost / 10000).toFixed(0)}만 (통행료 +${bonus}%)`;
  btn.disabled = !canAfford;
  if (canAfford) {
    btn.onclick = () => {
      state.money[player - 1] -= cost;
      state.buildingLevel[cellIndex] = nextLv;
      soundBuy();
      showToast(`${cell.name}에 ${BUILD_NAMES[nextLv]} 건설!`);
      updatePanels();
      updateBoardBuildings();
      buildModal.classList.add('hidden');
      tryNextTurn();
    };
  }
  buildOptions.appendChild(btn);

  buildModalPass.onclick = () => {
    buildModal.classList.add('hidden');
    tryNextTurn();
  };
  buildModal.classList.remove('hidden');
}

function showSellModal(requiredAmount, onComplete) {
  const player = state.currentPlayer;
  const list = CELLS.map((c, i) => ({ i, cell: c })).filter(({ i, cell }) => cell.type === 'property' && state.ownership[i] === player);

  document.getElementById('sellModalTitle').textContent = requiredAmount ? '금액이 부족합니다. 땅을 팔아 주세요.' : '땅 판매';
  document.getElementById('sellModalMessage').textContent = requiredAmount
    ? `필요 금액: ₩${(requiredAmount / 10000).toFixed(0)}만 / 현재: ₩${(state.money[player - 1] / 10000).toFixed(0)}만`
    : '판매 시 (땅+건물) 가격의 70%를 받습니다.';
  const sellList = document.getElementById('sellList');
  sellList.innerHTML = '';
  list.forEach(({ i, cell }) => {
    const price = getSellPrice(i);
    const row = document.createElement('div');
    row.className = 'sell-row';
    row.innerHTML = `<span>${cell.name}</span><button type="button" class="btn btn-sell" data-index="${i}">판매 ₩${(price / 10000).toFixed(0)}만</button>`;
    sellList.appendChild(row);
  });
  sellList.querySelectorAll('.btn-sell').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const price = getSellPrice(idx);
      state.money[player - 1] += price;
      state.ownership[idx] = 0;
      state.buildingLevel[idx] = 0;
      updateBoardOwnership();
      updateBoardBuildings();
      updatePanels();
      btn.closest('.sell-row').remove();
      document.getElementById('sellModalMessage').textContent = requiredAmount
        ? `필요: ₩${(requiredAmount / 10000).toFixed(0)}만 / 현재: ₩${(state.money[player - 1] / 10000).toFixed(0)}만`
        : '판매 시 (땅+건물) 가격의 70%를 받습니다.';
    });
  });

  const doneBtn = document.getElementById('sellModalDone');
  const bankruptBtn = document.getElementById('sellModalBankrupt');
  const checkDone = () => {
    if (requiredAmount && state.money[player - 1] >= requiredAmount) {
      state.pendingPayment = null;
      document.getElementById('sellModal').classList.add('hidden');
      onComplete();
    } else if (requiredAmount && sellList.children.length === 0) {
      bankruptBtn.classList.remove('hidden');
    }
  };
  doneBtn.onclick = () => {
    if (!requiredAmount) {
      state.pendingPayment = null;
      document.getElementById('sellModal').classList.add('hidden');
      onComplete();
      return;
    }
    if (state.money[player - 1] >= requiredAmount) {
      state.pendingPayment = null;
      document.getElementById('sellModal').classList.add('hidden');
      onComplete();
    } else if (sellList.children.length === 0) {
      bankruptBtn.classList.remove('hidden');
    } else {
      showToast('아직 금액이 부족합니다. 땅을 더 팔거나 파산을 선택하세요.');
    }
  };
  bankruptBtn.onclick = () => {
    state.bankrupt[player - 1] = true;
    state.pendingPayment = null;
    document.getElementById('sellModal').classList.add('hidden');
    checkBankrupt();
    tryNextTurn();
  };
  if (requiredAmount && state.money[player - 1] < requiredAmount && list.length === 0) {
    bankruptBtn.classList.remove('hidden');
  } else {
    bankruptBtn.classList.add('hidden');
  }
  document.getElementById('sellModal').classList.remove('hidden');
}

function modalAction(buy) {
  dom.modal.classList.add('hidden');
  const cellIndex = parseInt(dom.modal.dataset.cellIndex, 10);
  const cell = CELLS[cellIndex];
  const player = state.currentPlayer;

  if (buy && state.money[player - 1] >= cell.price) {
    state.money[player - 1] -= cell.price;
    state.ownership[cellIndex] = player;
    soundBuy();
    showToast(`${cell.name} 구매 완료!`);
    updateBoardOwnership();
    updatePanels();
  }
  tryNextTurn();
}

function getNextPlayer() {
  if (state.teamMode && state.numPlayers === 4) {
    const order = TEAM_TURN_ORDER;
    const idx = order.indexOf(state.currentPlayer);
    for (let i = 1; i <= 4; i++) {
      const next = order[(idx + i) % 4];
      if (!state.bankrupt[next - 1]) return next;
    }
    return null;
  }
  let next = state.currentPlayer;
  for (let i = 0; i < 4; i++) {
    next = (next % state.numPlayers) + 1;
    if (!state.bankrupt[next - 1]) return next;
  }
  return null;
}

function nextTurn() {
  let next = getNextPlayer();
  if (next === null) return;
  state.currentPlayer = next;

  while (state.jailTurns[state.currentPlayer - 1] > 0) {
    const p = state.currentPlayer;
    state.jailTurns[p - 1]--;
    const remaining = state.jailTurns[p - 1];
    const name = state.vsComputer && p >= 2 ? `컴퓨터 ${p}` : `플레이어 ${p}`;
    showToast(remaining > 0 ? `${name} 무인도 ${remaining}턴 대기` : `${name} 무인도에서 풀려났습니다!`);
    next = getNextPlayer();
    if (next === null) return;
    state.currentPlayer = next;
  }

  state.canRoll = true;
  state.rolledThisTurn = false;
  updateTurnText();
  for (let p = 1; p <= 4; p++) {
    const panel = document.getElementById('panel' + p);
    if (panel) panel.classList.toggle('active', state.currentPlayer === p);
  }
  if (dom.rollBtn) dom.rollBtn.disabled = state.vsComputer && state.currentPlayer >= 2;
  const cp = state.currentPlayer;
  if (state.vsComputer && cp >= 2 && !state.bankrupt[cp - 1]) {
    scheduleComputerTurn();
  }
}

function updateTurnText() {
  const p = state.currentPlayer;
  if (state.vsComputer && p >= 2) {
    if (state.teamMode) {
      dom.turnText.textContent = p <= 2 ? `팀 A - 컴퓨터 (P${p}) 차례` : `팀 B - 컴퓨터 (P${p}) 차례`;
    } else {
      dom.turnText.textContent = `컴퓨터 ${p}의 차례`;
    }
  } else if (state.teamMode && (p === 1 || p === 2)) {
    dom.turnText.textContent = `팀 A - 플레이어 ${p}의 차례`;
  } else if (state.teamMode && (p === 3 || p === 4)) {
    dom.turnText.textContent = `팀 B - 플레이어 ${p}의 차례`;
  } else {
    dom.turnText.textContent = `플레이어 ${p}의 차례`;
  }
}

function updatePanels() {
  const panelsEl = document.getElementById('playerPanels');
  if (panelsEl) panelsEl.classList.toggle('panels-4', state.numPlayers === 4);
  for (let p = 1; p <= 4; p++) {
    const panel = document.getElementById('panel' + p);
    const labelEl = document.getElementById('label' + p);
    const moneyEl = document.getElementById('money' + p);
    const propsEl = document.getElementById('props' + p);
    if (!panel) continue;
    if (p <= state.numPlayers) {
      panel.classList.remove('hidden');
      if (labelEl) {
        if (state.vsComputer && p >= 2) {
          if (state.teamMode) {
            labelEl.textContent = p <= 2 ? '팀 A - 컴퓨터' : '팀 B - 컴퓨터';
          } else {
            labelEl.textContent = '컴퓨터 ' + p;
          }
        } else if (state.teamMode) {
          labelEl.textContent = p <= 2 ? `팀 A - P${p}` : `팀 B - P${p}`;
        } else {
          labelEl.textContent = '플레이어 ' + p;
        }
      }
      if (moneyEl) moneyEl.textContent = state.money[p - 1].toLocaleString();
      if (propsEl) {
        const names = CELLS.map((c, i) => state.ownership[i] === p ? c.name : null).filter(Boolean);
        propsEl.textContent = names.length ? '보유: ' + names.join(', ') : '';
      }
      panel.classList.toggle('active', state.currentPlayer === p);
    } else {
      panel.classList.add('hidden');
    }
  }
}

function updateBoardOwnership() {
  dom.board.querySelectorAll('.cell.property').forEach((el) => {
    const idx = parseInt(el.dataset.index, 10);
    el.classList.remove('owned-1', 'owned-2', 'owned-3', 'owned-4');
    if (state.ownership[idx]) el.classList.add('owned-' + state.ownership[idx]);
  });
}

function updateBoardBuildings() {
  dom.board.querySelectorAll('.cell.property .building-icon').forEach((el) => {
    const cell = el.closest('.cell');
    if (!cell) return;
    const idx = parseInt(cell.dataset.index, 10);
    const level = state.buildingLevel[idx] || 0;
    el.textContent = BUILD_SYMBOLS[level];
    el.classList.toggle('has-building', level > 0);
  });
}

function checkBankrupt() {
  for (let p = 1; p <= state.numPlayers; p++) {
    if (state.money[p - 1] < 0) state.bankrupt[p - 1] = true;
  }
  if (state.teamMode) {
    const team1Out = state.bankrupt[0] && state.bankrupt[1];
    const team2Out = state.bankrupt[2] && state.bankrupt[3];
    if (team1Out || team2Out) {
      soundWin();
      showToast(team1Out ? '팀 B 승리!' : '팀 A 승리!');
      state.canRoll = false;
      dom.rollBtn.disabled = true;
    }
  } else {
    const active = state.bankrupt.slice(0, state.numPlayers).filter((b) => !b).length;
    if (active === 1) {
      const winner = state.bankrupt.findIndex((b) => !b) + 1;
      soundWin();
      const winMsg = state.vsComputer
        ? (winner === 1 ? '승리!' : '컴퓨터 승리!')
        : `플레이어 ${winner} 승리!`;
      showToast(winMsg);
      state.canRoll = false;
      dom.rollBtn.disabled = true;
    } else if (active === 0) {
      showToast('모두 파산! 무승부');
      state.canRoll = false;
      dom.rollBtn.disabled = true;
    }
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => toast.classList.add('hidden'), 2500);
}

document.addEventListener('DOMContentLoaded', init);
