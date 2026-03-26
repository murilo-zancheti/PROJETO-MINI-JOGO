const INTERACTION_KEY = 'e';

const MESSAGES = {
  invalidConfig: 'Não foi possível iniciar. Configuração do mapa incompleta.',
  timeOver: 'Colapso total! Você não conseguiu escapar a tempo.',
  droneHit: 'O drone de patrulha interceptou você.',
  contextDoorEnergized: 'Porta energizada! Fuja imediatamente.',
  contextCanEnergize: 'Pressione E para energizar a porta com o núcleo.',
  contextCarryCore: 'Núcleo coletado. Leve-o até a porta.',
  contextFindCore: 'Encontre o núcleo e evite o drone.',
  blockedNeedEnergy: 'A porta está sem energia. Encontre o núcleo.',
  blockedNeedEnergize: 'Fique ao lado da porta e pressione E para energizar.',
  coreCollected: 'Núcleo coletado. Leve-o até a porta.',
  doorEnergized: 'Porta energizada com sucesso! Saia agora.',
  win: 'Você energizou a porta com o núcleo e escapou da instalação.',
  hazardLose: 'As chamas bloquearam sua rota de fuga.'
};

const gameState = {
  status: 'start',
  player: { ...LEVEL_ONE.start },
  timeLeft: LEVEL_ONE.timeLimit,
  timerId: null,
  droneTimerId: null,
  layout: cloneLayout(LEVEL_ONE.initialLayout),
  hasCore: false,
  doorEnergized: false,
  drone: { ...LEVEL_ONE.drone.start, direction: LEVEL_ONE.drone.direction }
};

const screens = {
  start: document.getElementById('start-screen'),
  game: document.getElementById('game-screen'),
  end: document.getElementById('end-screen')
};

const appRootElement = document.getElementById('app-root');
const boardElement = document.getElementById('game-board');
const playerElement = document.getElementById('player');
const droneElement = document.getElementById('drone');
const missionTextElement = document.getElementById('mission-text');
const timerTextElement = document.getElementById('timer-text');
const statusTextElement = document.getElementById('status-text');
const feedbackTextElement = document.getElementById('feedback-text');
const progressCoreElement = document.getElementById('progress-core');
const progressActivateElement = document.getElementById('progress-activate');
const progressExitElement = document.getElementById('progress-exit');
const endTitleElement = document.getElementById('end-title');
const endMessageElement = document.getElementById('end-message');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const playAgainButton = document.getElementById('play-again-button');

function isLevelConfigValid(level) {
  return Boolean(level.exit && level.core && level.columns > 0 && level.rows > 0 && level.drone);
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

function getStepSize() {
  return getCellSize() + getCellGap();
}

function positionElement(element, x, y) {
  const step = getStepSize();
  element.style.left = `${x * step}px`;
  element.style.top = `${y * step}px`;
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

function clearStepState(stepElement) {
  stepElement.classList.remove('active', 'completed');
}

function updateProgressUi() {
  [progressCoreElement, progressActivateElement, progressExitElement].forEach(clearStepState);

  if (!gameState.hasCore && !gameState.doorEnergized) {
    progressCoreElement.classList.add('active');
    return;
  }

  progressCoreElement.classList.add('completed');

  if (!gameState.doorEnergized) {
    progressActivateElement.classList.add('active');
    return;
  }

  progressActivateElement.classList.add('completed');
  progressExitElement.classList.add('active');
}

function isAdjacentToExit() {
  const distanceX = Math.abs(gameState.player.x - LEVEL_ONE.exit.x);
  const distanceY = Math.abs(gameState.player.y - LEVEL_ONE.exit.y);
  return distanceX + distanceY === 1;
}

function updateDoorHighlight() {
  const exitCell = getCellElement(LEVEL_ONE.exit.x, LEVEL_ONE.exit.y);
  if (!exitCell) {
    return;
  }

  const doorReady = isAdjacentToExit() && gameState.hasCore && !gameState.doorEnergized;
  exitCell.classList.toggle('ready', doorReady);
}

function updateMissionUi() {
  missionTextElement.textContent = LEVEL_ONE.mission;
  timerTextElement.textContent = `${gameState.timeLeft}s`;

  if (gameState.doorEnergized) {
    statusTextElement.textContent = 'Energizada';
  } else if (gameState.hasCore) {
    statusTextElement.textContent = 'Pronta para energizar';
  } else {
    statusTextElement.textContent = 'Sem energia';
  }

  const exitCell = getCellElement(LEVEL_ONE.exit.x, LEVEL_ONE.exit.y);
  if (exitCell) {
    exitCell.classList.toggle('unlocked', gameState.doorEnergized);
  }

  appRootElement.classList.toggle('urgent', gameState.doorEnergized);
  updateDoorHighlight();
  updateProgressUi();
}

function clearTimer(timerKey) {
  if (gameState[timerKey]) {
    window.clearInterval(gameState[timerKey]);
    gameState[timerKey] = null;
  }
}

function clearRuntimeTimers() {
  clearTimer('timerId');
  clearTimer('droneTimerId');
}

function finishGame(status, message) {
  clearRuntimeTimers();
  gameState.status = status;
  endTitleElement.textContent = status === 'win' ? 'Vitória' : 'Derrota';
  endMessageElement.textContent = message;
  appRootElement.classList.remove('urgent');
  showScreen('end');
}

function checkDroneCollision() {
  if (gameState.player.x === gameState.drone.x && gameState.player.y === gameState.drone.y) {
    finishGame('lose', MESSAGES.droneHit);
    return true;
  }

  return false;
}

function updatePlayerPosition() {
  positionElement(playerElement, gameState.player.x, gameState.player.y);
}

function updateDronePosition() {
  positionElement(droneElement, gameState.drone.x, gameState.drone.y);
}

function startTimer() {
  clearTimer('timerId');

  gameState.timerId = window.setInterval(() => {
    if (gameState.status !== 'playing') {
      clearTimer('timerId');
      return;
    }

    gameState.timeLeft -= 1;
    timerTextElement.textContent = `${gameState.timeLeft}s`;

    if (gameState.timeLeft <= 0) {
      finishGame('lose', MESSAGES.timeOver);
    }
  }, 1000);
}

function moveDroneStep() {
  if (gameState.status !== 'playing') {
    return;
  }

  const nextDrone = { ...gameState.drone };
  nextDrone[LEVEL_ONE.drone.axis] += nextDrone.direction;

  if (nextDrone[LEVEL_ONE.drone.axis] > LEVEL_ONE.drone.max || nextDrone[LEVEL_ONE.drone.axis] < LEVEL_ONE.drone.min) {
    nextDrone.direction *= -1;
    nextDrone[LEVEL_ONE.drone.axis] = gameState.drone[LEVEL_ONE.drone.axis] + nextDrone.direction;
  }

  gameState.drone = nextDrone;
  updateDronePosition();
  checkDroneCollision();
}

function startDronePatrol() {
  clearTimer('droneTimerId');
  gameState.droneTimerId = window.setInterval(moveDroneStep, LEVEL_ONE.drone.speed);
}

function updateContextFeedback() {
  if (gameState.status !== 'playing') {
    return;
  }

  if (gameState.doorEnergized) {
    setFeedbackMessage(MESSAGES.contextDoorEnergized);
    return;
  }

  if (isAdjacentToExit() && gameState.hasCore) {
    setFeedbackMessage(MESSAGES.contextCanEnergize);
    return;
  }

  if (gameState.hasCore) {
    setFeedbackMessage(MESSAGES.contextCarryCore);
    return;
  }

  setFeedbackMessage(MESSAGES.contextFindCore);
}

function resetGameState() {
  gameState.status = 'playing';
  gameState.player = { ...LEVEL_ONE.start };
  gameState.timeLeft = LEVEL_ONE.timeLimit;
  gameState.layout = cloneLayout(LEVEL_ONE.initialLayout);
  gameState.hasCore = false;
  gameState.doorEnergized = false;
  gameState.drone = { ...LEVEL_ONE.drone.start, direction: LEVEL_ONE.drone.direction };
}

function resetGame() {
  if (!isLevelConfigValid(LEVEL_ONE)) {
    setFeedbackMessage(MESSAGES.invalidConfig);
    return;
  }

  clearRuntimeTimers();
  resetGameState();
  buildBoard();
  showScreen('game');
  updatePlayerPosition();
  updateDronePosition();
  updateMissionUi();
  updateContextFeedback();
  startTimer();
  startDronePatrol();
}

function collectCore() {
  gameState.hasCore = true;
  setTile(LEVEL_ONE.core.x, LEVEL_ONE.core.y, TILE_TYPES.FLOOR);

  const coreCell = getCellElement(LEVEL_ONE.core.x, LEVEL_ONE.core.y);
  if (coreCell) {
    coreCell.classList.remove('item');
  }

  updateMissionUi();
  setFeedbackMessage(MESSAGES.coreCollected);
}

function energizeDoor() {
  if (!gameState.hasCore || gameState.doorEnergized || !isAdjacentToExit()) {
    return;
  }

  gameState.hasCore = false;
  gameState.doorEnergized = true;
  updateMissionUi();
  setFeedbackMessage(MESSAGES.doorEnergized);
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

  if (nextTile === TILE_TYPES.GOAL && !gameState.doorEnergized) {
    if (gameState.hasCore) {
      setFeedbackMessage(MESSAGES.blockedNeedEnergize);
    } else {
      setFeedbackMessage(MESSAGES.blockedNeedEnergy);
    }
    return;
  }

  gameState.player.x = nextX;
  gameState.player.y = nextY;
  updatePlayerPosition();

  if (checkDroneCollision()) {
    return;
  }

  if (nextTile === TILE_TYPES.ITEM) {
    collectCore();
    updateContextFeedback();
    return;
  }

  if (nextTile === TILE_TYPES.GOAL) {
    finishGame('win', MESSAGES.win);
    return;
  }

  if (nextTile === TILE_TYPES.HAZARD) {
    finishGame('lose', MESSAGES.hazardLose);
    return;
  }

  updateMissionUi();
  updateContextFeedback();
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
  } else if (key === INTERACTION_KEY) {
    event.preventDefault();
    energizeDoor();
    updateContextFeedback();
  }
}

startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);
playAgainButton.addEventListener('click', resetGame);
document.addEventListener('keydown', handleKeydown);
window.addEventListener('resize', () => {
  updatePlayerPosition();
  updateDronePosition();
});

configureBoardGrid();
updateMissionUi();
updatePlayerPosition();
updateDronePosition();
showScreen('start');
