interface Props {
  grid: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  r: number,
  density: number,
  cell: number;
}

const trueMod = (a: number, b: number) => ((a % b) + b) % b;

const getIndex = (x: number, y: number, width: number, height: number) => 
  trueMod(x, width) + trueMod(y, height) * width;

const spawnCells = (props: Props): void => {
  const {
    grid,
    width,
    height,
    x,
    y,
    r,
    density,
    cell,
  } = props;
  for(let i = -r; i !== r; ++i) {
    for(let j = -r; j !== r; ++j) {
      if (Math.random() < density) {
        const index = getIndex(x + i, y + j, width, height);
        grid[index] = cell;
      }
    }
  }
};

export default spawnCells;
