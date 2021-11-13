export const CELL_SIZE = 288;

export const CELL_VARIANT_EMPTY = 0;
export const CELL_VARIANT_WALL = 1;
export const CELL_VARIANT_FOOD = 2;
export const CELL_VARIANT_LIFE = 3;

export const CELL_GEN_NEXT = 0; // ++cursor
// [1; 7] rotate, move cursor to next gen
export const CELL_GEN_ROTATE_RIGHT_1 = 1;
export const CELL_GEN_ROTATE_RIGHT_2 = 2;
export const CELL_GEN_ROTATE_RIGHT_3 = 3;
export const CELL_GEN_ROTATE_RIGHT_4 = 4;
export const CELL_GEN_ROTATE_RIGHT_5 = 5;
export const CELL_GEN_ROTATE_RIGHT_6 = 6;
export const CELL_GEN_ROTATE_RIGHT_7 = 7;
export const CELL_GEN_MOVE = 8; // move forward/eat and end prog
export const CELL_GEN_PHOTOSYNTHESIS = 9; // photosynthesis ++cursor end prog
export const CELL_GEN_DIVIDE = 10; // make self copy with mutated gen at front cell
export const CELL_GEN_DIST = 11; // move cursor to {dist to cloosest cell}*2+1 positions
export const CELL_GEN_GOTO = 12; // cursor = {next 2 genes value as u16}
export const CELL_GEN_END = 255; // end turn

export const CELL_INTENTION_WAIT = 0;
export const CELL_INTENTION_MOVE = 1;
export const CELL_INTENTION_DIVISION = 2;
export const CELL_INTENTION_HIT = 3;

export const CELL_GENES_SIZE = 256;
export const CELL_GENES_TO_PROCESS = 256;


export const CELL_STAMINA_FRAME = -1;
export const CELL_STAMINA_MOVEMENT = -3;
export const CELL_STAMINA_PHOTOSYNTHESIS = 3;
export const CELL_STAMINA_EAT = 24;
export const CELL_STAMINA_DIVISION_MIN = 32;
export const CELL_STAMINA_DIVISION_MAX = 128;
export const CELL_STAMINA_PARENT_DIVISION_FACTOR = 0.4;
export const CELL_STAMINA_CHILD_DIVISION_FACTOR = 0.3;
