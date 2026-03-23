const gameState = {
  status: 'start',
  player: { ...LEVEL_ONE.start },
  hasItem: false,
  timeLeft: LEVEL_ONE.timeLimit,
  timerId: null,
  layout: cloneLayout(LEVEL_ONE.initialLayout)
};

const screens = {
  start: document.getElementById('start-screen'),
  game: document.getElementById('game-screen'),
  end: document.getElementById('end-screen')
};

const boardElement = document.getElementById('game-board');
const playerElement = document.getElementById('player');
const missionTextElement = document.getElementById('mission-text');
const timerTextElement = document.getElementById('timer-text');
const statusTextElement = document.getElementById('status-text');
const feedbackTextElement = document.getElementById('feedback-text');
const endTitleElement = document.getElementById('end-title');
const endMessageElement = document.getElementById('end-message');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const playAgainButton = document.getElementById('play-again-button');

function isLevelConfigValid(level) {
  return Boolean(level.exit && level.item && level.columns > 0 && level.rows > 0);
}

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function getCellSize() {
  const styles = window.getComputedStyle(document.documentElement);
  return Number.parseInt(styles.getPropertyValue('--cell-size'), 10) || 48;
}

function getCellGap() {
  const styles = window.getComputedStyle(boardElement);
  return Number.parseInt(styles.columnGap, 10) || 0;
}

function configureBoardGrid() {
  boardElement.style.gridTemplateColumns = `repeat(${LEVEL_ONE.columns}, var(--cell-size))`;
  boardElement.style.gridTemplateRows = `repeat(${LEVEL_ONE.rows}, var(--cell-size))`;
}

function buildBoard() {
  boardElement.querySelectorAll('.cell').forEach((cell) => cell.remove());
  configureBoardGrid();

  const fragment = document.createDocumentFragment();

  gameState.layout.forEach((row, rowIndex) => {
    row.forEach((tile, columnIndex) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = String(columnIndex);
      cell.dataset.y = String(rowIndex);

      if (tile === TILE_TYPES.WALL) {
        cell.classList.add('wall');
      } else if (tile === TILE_TYPES.GOAL) {
        cell.classList.add('goal');
      } else if (tile === TILE_TYPES.HAZARD) {
        cell.classList.add('hazard');
      } else if (tile === TILE_TYPES.ITEM) {
        cell.classList.add('item');
      }

      fragment.appendChild(cell);
    });
  });

  boardElement.prepend(fragment);
}

function updatePlayerPosition() {
  const step = getCellSize() + getCellGap();
  playerElement.style.left = `${gameState.player.x * step}px`;
  playerElement.style.top = `${gameState.player.y * step}px`;
}

function getTile(x, y) {
  return gameState.layout[y]?.[x];
}

function setTile(x, y, value) {
  if (gameState.layout[y]?.[x] === undefined) {
    return;
  }

  gameState.layout[y][x] = value;
}

function getCellElement(x, y) {
  return boardElement.querySelector(`[data-x="${x}"][data-y="${y}"]`);
}

function setFeedbackMessage(message) {
  feedbackTextElement.textContent = message;
}

function updateMissionUi() {
  missionTextElement.textContent = LEVEL_ONE.mission;
  timerTextElement.textContent = `${gameState.timeLeft}s`;
  statusTextElement.textContent = gameState.hasItem ? 'Desbloqueada' : 'Bloqueada';

  if (!LEVEL_ONE.exit) {
    setFeedbackMessage('Mapa inválido: saída não encontrada.');
    return;
  }

  const exitCell = getCellElement(LEVEL_ONE.exit.x, LEVEL_ONE.exit.y);
  if (exitCell) {
    exitCell.classList.toggle('unlocked', gameState.hasItem);
  }
}

function clearTimer() {
  if (gameState.timerId) {
    window.clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function finishGame(status, message) {
  clearTimer();
  gameState.status = status;
  endTitleElement.textContent = status === 'win' ? 'Vitória' : 'Derrota';
  endMessageElement.textContent = message;
  showScreen('end');
}

function startTimer() {
  clearTimer();

  gameState.timerId = window.setInterval(() => {
    if (gameState.status !== 'playing') {
      clearTimer();
      return;
    }

    gameState.timeLeft -= 1;
    timerTextElement.textContent = `${gameState.timeLeft}s`;

    if (gameState.timeLeft <= 0) {
      finishGame('lose', 'O sistema entrou em colapso antes de você escapar.');
    }
  }, 1000);
}

function resetGameState() {
  gameState.status = 'playing';
  gameState.player = { ...LEVEL_ONE.start };
  gameState.hasItem = false;
  gameState.timeLeft = LEVEL_ONE.timeLimit;
  gameState.layout = cloneLayout(LEVEL_ONE.initialLayout);
}

function resetGame() {
  if (!isLevelConfigValid(LEVEL_ONE)) {
    setFeedbackMessage('Não foi possível iniciar: a configuração do mapa está incompleta.');
    return;
  }

  clearTimer();
  resetGameState();
  buildBoard();
  showScreen('game');
  updatePlayerPosition();
  updateMissionUi();
  setFeedbackMessage('Encontre o núcleo antes do colapso total.');
  startTimer();
}

function collectItem(x, y) {
  gameState.hasItem = true;
  setTile(x, y, TILE_TYPES.FLOOR);

  const itemCell = getCellElement(x, y);
  if (itemCell) {
    itemCell.classList.remove('item');
  }

  updateMissionUi();
  setFeedbackMessage('Núcleo recuperado. A saída foi desbloqueada.');
}

function tryMove(deltaX, deltaY) {
  if (gameState.status !== 'playing') {
    return;
  }

  const nextX = gameState.player.x + deltaX;
  const nextY = gameState.player.y + deltaY;
  const nextTile = getTile(nextX, nextY);

  if (nextTile === undefined || nextTile === TILE_TYPES.WALL) {
    return;
  }

  if (nextTile === TILE_TYPES.GOAL && !gameState.hasItem) {
    setFeedbackMessage('Saída bloqueada. Encontre o núcleo primeiro.');
    return;
  }

  gameState.player.x = nextX;
  gameState.player.y = nextY;
  updatePlayerPosition();

  if (nextTile === TILE_TYPES.ITEM) {
    collectItem(nextX, nextY);
    return;
  }

  if (nextTile === TILE_TYPES.GOAL) {
    finishGame('win', 'Você recuperou o núcleo, liberou a saída e escapou da instalação.');
    return;
  }

  if (nextTile === TILE_TYPES.HAZARD) {
    finishGame('lose', 'As chamas consumiram a rota de fuga antes da extração.');
    return;
  }

  setFeedbackMessage(gameState.hasItem ? 'Saída desbloqueada. Vá até a extração.' : 'Continue procurando o núcleo.');
}

function handleKeydown(event) {
  if (gameState.status !== 'playing') {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === 'arrowup' || key === 'w') {
    event.preventDefault();
    tryMove(0, -1);
  } else if (key === 'arrowdown' || key === 's') {
    event.preventDefault();
    tryMove(0, 1);
  } else if (key === 'arrowleft' || key === 'a') {
    event.preventDefault();
    tryMove(-1, 0);
  } else if (key === 'arrowright' || key === 'd') {
    event.preventDefault();
    tryMove(1, 0);
  }
}

startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
document.addEventListener('keydown', handleKeydown);
window.addEventListener('resize', updatePlayerPosition);

configureBoardGrid();
updateMissionUi();
updatePlayerPosition();
showScreen('start');
