interface Props {
  width: number;
  height: number;
  grid: Uint32Array;
}

const logGrid = ({ width, height, grid }: Props): void => {
  let result = ""
  for (let i = 0; i !== height; ++i) {
    result += "\n";
    for (let j = 0; j !== width; ++j) {
      result += grid[width * j + i] === 255 ? 1 : 0;
    }
  }
  console.log(result);
}

export default logGrid;
