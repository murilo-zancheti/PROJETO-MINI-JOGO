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
    timeLimit: 45,
    mission: 'Recupere o núcleo de acesso e escape antes da explosão.',
    start: { x: 1, y: 1 },
    initialLayout,
    exit: findTilePosition(initialLayout, TILE_TYPES.GOAL),
    item: findTilePosition(initialLayout, TILE_TYPES.ITEM)
  };
}

const LEVEL_ONE = createLevelConfig();
