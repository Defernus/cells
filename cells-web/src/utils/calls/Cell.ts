import { CELL_GENES_SIZE, CELL_SIZE } from "constants/cell";

export enum CellPropName {
  Genes = "genes",
  Stamina = "stamina",
  Cursor = "cursor",
  Age = "age",
  Intention = "intention",
  Predator = "predator",
  Plant = "plant",
  Variant = "variant",
  Direction = "direction",
}

interface CellPropValue {
  wgslType: string;
  bytesOffset: number;
  getValue?(cell: Cell): any;
}

let bytesOffset = 0;
const getBytesOffset = (size: number) => {
  const old = bytesOffset;
  bytesOffset += size;
  return old;
};

export const cellStructure: {
  [key in CellPropName]: CellPropValue;
} = {
  [CellPropName.Genes]: {
    wgslType: `array<u32, ${CELL_GENES_SIZE / 4}>`,
    bytesOffset: getBytesOffset(CELL_GENES_SIZE),
    getValue: (cell) => [...Array.from(cell.data)].slice(0, CELL_GENES_SIZE),
  },
  [CellPropName.Stamina]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.stamina.bytesOffset),
  },
  [CellPropName.Cursor]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.cursor.bytesOffset),
  },
  [CellPropName.Age]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.age.bytesOffset),
  },
  [CellPropName.Intention]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.intention.bytesOffset),
  },
  [CellPropName.Predator]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.predator.bytesOffset),
  },
  [CellPropName.Plant]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.variant.bytesOffset),
  },
  [CellPropName.Variant]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.plant.bytesOffset),
  },
  [CellPropName.Direction]: {
    wgslType: "u32",
    bytesOffset: getBytesOffset(4),
    getValue: (cell) => cell.getU32FromData(cellStructure.direction.bytesOffset),
  },
};

type CellProps = {
  [CellPropName.Genes]?: number[],
  [CellPropName.Stamina]?: number,
  [CellPropName.Cursor]?: number,
  [CellPropName.Age]?: number,
  [CellPropName.Intention]?: number,
  [CellPropName.Predator]?: number,
  [CellPropName.Plant]?: number,
  [CellPropName.Variant]?: number,
  [CellPropName.Direction]?: number,
};

class Cell {
  readonly data: Uint8Array;

  constructor (data?: Uint8Array) {
    this.data = new Uint8Array(CELL_SIZE);
    if (data) {
      this.data.forEach((_, i) => {
        this.data[i] = data[i];
      });
    }
  }

  setValues (props: CellProps): Cell {
    const {
      genes,
      stamina,
      cursor,
      age,
      intention,
      predator,
      plant,
      variant,
      direction,
    } = props;

    genes?.forEach((g, i) => { this.data[i] = g });

    if (stamina) this.writeU32ToData(cellStructure.stamina.bytesOffset, stamina);
    if (cursor) this.writeU32ToData(cellStructure.cursor.bytesOffset, cursor);
    if (age) this.writeU32ToData(cellStructure.age.bytesOffset, age);
    if (intention) this.writeU32ToData(cellStructure.intention.bytesOffset, intention);
    if (predator) this.writeU32ToData(cellStructure.predator.bytesOffset, predator);
    if (plant) this.writeU32ToData(cellStructure.plant.bytesOffset, plant);
    if (variant) this.writeU32ToData(cellStructure.variant.bytesOffset, variant);
    if (direction) this.writeU32ToData(cellStructure.direction.bytesOffset, direction);

    return this;
  }

  putToGrid(grid: Uint8Array, x: number, y: number, width: number): void {
    const offset = (x + y * width) * bytesOffset;

    // eslint-disable-next-line no-param-reassign
    this.data.forEach((b, i) => { grid[offset + i] = b });
  }

  log(): void {
    Object.entries(cellStructure).forEach(([name, { getValue }]) => {
      if (getValue) {
        console.log(`${name}:`, getValue(this));
      }
    });
  }

  getU32FromData(offset: number): number {
    let result = 0;
    for (let i = 0; i !== 4; ++i) {
      result |= (this.data[offset + i] & 0xff) << (8 * i);
    }
    return result;
  }

  private writeU32ToData(offset: number, value: number): void {
    for (let i = 0; i !== 4; ++i) {
      this.data[offset + i] = value << (8 * i);
    }
  };
}

export default Cell;
