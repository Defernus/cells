export const CELL_SIZE = 272;

export const CELL_VARIANT_EMPTY = 0;
export const CELL_VARIANT_WALL = 1;
export const CELL_VARIANT_FOOD = 2;
export const CELL_VARIANT_LIFE = 3;

let genIndex = 0;

export const CELL_GEN_WAIT = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_1 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_2 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_3 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_4 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_5 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_6 = genIndex++;
export const CELL_GEN_ROTATE_RIGHT_7 = genIndex++;
export const CELL_GEN_MOVE = genIndex++;
