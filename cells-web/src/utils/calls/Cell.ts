import { CELL_GENES_SIZE, CELL_SIZE } from "constants/cell";

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
  stamina?: number;
}

export const createCell = ({
  variant,
  genes,
  stamina,
  direction = 0,
}: CreateCellProps): Cell => {
  const data = new Uint8Array(CELL_SIZE);
  genes?.forEach((g, i) => { data[i] = g });
  data[264] = variant;

  if (stamina) {
    data[259] = (stamina >> 8) & 0xff;
    data[258] = stamina & 0xff;
  }

  data[268] = direction;
  return new Cell({ data });
};

export const logCellData = (data: number[]): void => {
    console.log("genes:", [...data].slice(0, CELL_GENES_SIZE));
    console.log("cursor:", data[256] | (data[257] << 8));
    console.log("stamina:", data[258] | (data[259] << 8));
    console.log("age:", data[260] | (data[261] << 8) | (data[262] << 16) | (data[263] << 24));
    console.log("variant:", data[264]);
    console.log("plant:", data[265]);
    console.log("predator:", data[266]);
    console.log("intention:", data[267]);
    console.log("direction:", data[268]);
};

export default Cell;
