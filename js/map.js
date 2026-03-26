const TILE_TYPES = {
  FLOOR: 0,
  WALL: 1,
  GOAL: 2,
  HAZARD: 3,
  ITEM: 4
};

const INITIAL_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 3, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 4, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 3, 1, 1, 1, 1, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1]
];

function cloneLayout(layout = INITIAL_LAYOUT) {
  return layout.map((row) => [...row]);
}

function findTilePosition(layout, tileType) {
  for (let y = 0; y < layout.length; y += 1) {
    for (let x = 0; x < layout[y].length; x += 1) {
      if (layout[y][x] === tileType) {
        return { x, y };
      }
    }
  }

  return null;
}

function createLevelConfig() {
  const initialLayout = cloneLayout();

  return {
    columns: initialLayout[0].length,
    rows: initialLayout.length,
    timeLimit: 75,
    mission: 'Coletar núcleo, energizar porta e escapar.',
    start: { x: 1, y: 1 },
    initialLayout,
    exit: findTilePosition(initialLayout, TILE_TYPES.GOAL),
    core: findTilePosition(initialLayout, TILE_TYPES.ITEM),
    drone: {
      start: { x: 4, y: 5 },
      axis: 'x',
      min: 4,
      max: 6,
      direction: 1,
      speed: 650
    }
  };
}

const LEVEL_ONE = createLevelConfig();
