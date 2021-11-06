import { CELL_SIZE } from "constants/cell";

const mod = (a: number, b: number): number => ((a % b) + b) % b

export interface Cord {
  x: number;
  y: number;
}

const getCellOffset = (cord: Cord, gridSize: Cord): number =>  (
  (mod(cord.x, gridSize.x) + mod(cord.y, gridSize.y) * gridSize.x) * CELL_SIZE
);

export default getCellOffset;
