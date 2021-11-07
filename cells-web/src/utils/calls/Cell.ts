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
  genes?: number[];
  direction?: number;
}

export const createCell = ({
  variant,
  genes,
  direction = 0,
}: CreateCellProps): Cell => {
  const data = new Uint8Array(CELL_SIZE);
  genes?.forEach((g, i) => { data[i] = g });
  data[264] = variant;
  data[271] = direction;
  return new Cell({ data });
};

export default Cell;
