import { CELL_SIZE } from "constants/cell";
import type Cell from "utils/cells/Cell";
import getCellOffset, { Cord } from "utils/cells/getCellOffset";

const setCell = (grid: Uint8Array, cell: Cell, cord: Cord, gridSize: Cord): void => {
  const offset = getCellOffset(cord, gridSize);
  for (let i = 0; i < CELL_SIZE; ++i) {
    // eslint-disable-next-line no-param-reassign
    grid[offset + i] = cell.data[i];
  }
};

export default setCell;
