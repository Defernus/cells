import { CELL_SIZE } from "constants/cell";

interface CellProps {
  data: Uint8Array;
}

class Cell {
  data: Uint8Array;

  constructor ({ data }: CellProps) {
    this.data = data;
  }
}

interface CreateCellProps {
  variant: number;
}

export const createCell = ({ variant }: CreateCellProps): Cell => {
  const data = new Uint8Array(CELL_SIZE);
  // data[267] = variant;
  for (let i = 0; i !== 272; ++i) {
    data[i] = variant;
  }
  return new Cell({ data });
};

export default Cell;
