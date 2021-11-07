import {
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
  CELL_VARIANT_WALL,
} from "constants/cell";

const includeCellUtils = (): string => /* wgsl */`

struct Cell {
  genes: array<u32, 64>;
  stamina_cursor: u32;
  age: u32;
  intention_predator_plant_variant: u32;
  direction: u32;
};

fn mod(a: i32, b: i32) -> i32 {
  return ((a % b) + b) % b;
}

fn getIndex(cord: vec2<i32>, gridSize: vec2<i32>) -> u32 {
  return u32(mod(cord.x, gridSize.x) + mod(cord.y, gridSize.y) * gridSize.x);
}

fn getCellVariant(cell: ptr<function, Cell>) -> u32 {
  return (*cell).intention_predator_plant_variant & 0x000000ffu;
}

fn getCellIntention(cell: ptr<function, Cell>) -> u32 {
  return ((*cell).intention_predator_plant_variant >> 24u) & 0x000000ffu;
}

fn getCellCursor(cell: ptr<function, Cell>) -> u32 {
  return (*cell).stamina_cursor & 0x0000ffffu;
}

fn getCellStamina(cell: ptr<function, Cell>) -> u32 {
  return ((*cell).stamina_cursor >> 16u) & 0x0000ffffu;
}
fn setCellStamina(cell: ptr<function, Cell>, intention: u32) {
  (*cell).stamina_cursor = ((*cell).stamina_cursor & 0x0000ffffu) | (intention << 16u);
}

fn getCellGen(cell: ptr<function, Cell>, cursor: u32) -> u32 {
  var genes = (*cell).genes;
  let clusterIndex: u32 = cursor / 4u;
  let genCluster = genes[clusterIndex];
  return (genCluster >> ((cursor % 4u) * 8u)) & 0x000000ffu;
}

fn getCellDirection(cell: ptr<function, Cell>) -> u32 {
  return (*cell).direction & 0x7u;
}

fn setCellDirection(cell: ptr<function, Cell>, direction: u32) {
  (*cell).direction = ((*cell).direction & 0xfffffff0u) | (direction & 0x7u);
}

fn rotateCell(cell: ptr<function, Cell>, rotation: i32) {
  setCellDirection(cell, u32(mod(i32(getCellDirection(cell)) + rotation, 8)));
}

fn getXByDir(dir: u32) -> i32 {
  var dirs = array<i32, 8>(
    -1, 0, 1, 1, 1, 0, -1, -1,
  );
  return dirs[dir];
}

fn getYByDir(dir: u32) -> i32 {
  var dirs = array<i32, 8>(
    -1, -1, -1, 0, 1, 1, 1, 0,
  );
  return dirs[dir];
}

fn getCellLookAt(cell: ptr<function, Cell>) -> vec2<i32> {
  let dir = getCellDirection(cell);
  return vec2<i32>(getXByDir(dir), getYByDir(dir));
}

fn setCellIntention(cell: ptr<function, Cell>, intention: u32) {
  (*cell).intention_predator_plant_variant =
    ((*cell).intention_predator_plant_variant & 0x00ffffffu) | (intention << 24u);
}

fn setCellCursor(cell: ptr<function, Cell>, cursor: u32) {
  (*cell).stamina_cursor = ((*cell).stamina_cursor & 0xffff0000u) | (cursor & 0x0000ffffu);
}

fn getCellPredatorPoints(cell: ptr<function, Cell>) -> u32 {
  return ((*cell).intention_predator_plant_variant >> 16u) & 0xffu;
}

fn addCellPredatorPoint(cell: ptr<function, Cell>, value: u32) {
  var points = getCellPredatorPoints(cell) + value;
  if (points > 0xffu) {
    points = 0xffu;
  }
  (*cell).intention_predator_plant_variant = ((*cell).intention_predator_plant_variant & 0xffff00ffu) | ((points & 0xffu) << 16u);
}

fn getCellPlantPoints(cell: ptr<function, Cell>) -> u32 {
  return ((*cell).intention_predator_plant_variant >> 8u) & 0xffu;
}

fn addCellPlantPoint(cell: ptr<function, Cell>, value: u32) {
  var points = getCellPlantPoints(cell) + value;
  if (points > 0xffu) {
    points = 0xffu;
  }
  (*cell).intention_predator_plant_variant = ((*cell).intention_predator_plant_variant & 0xffff00ffu) | ((points & 0xffu) << 8u);
}

fn getCellColor(cell: ptr<function, Cell>) -> vec4<f32> {
  let variant = getCellVariant(cell);
  if (variant == ${CELL_VARIANT_EMPTY}u) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }
  if (variant == ${CELL_VARIANT_WALL}u) {
    return vec4<f32>(1.0, 1.0, 1.0, 1.0);
  }
  if (variant == ${CELL_VARIANT_FOOD}u) {
    return vec4<f32>(0.58, 0.49, 0.25, 1.0);
  }
  if (variant == ${CELL_VARIANT_LIFE}u) {
    return vec4<f32>(
      f32(getCellPredatorPoints(cell)) / 512.0 + 0.5,
      f32(getCellPlantPoints(cell)) / 512.0 + 0.5,
      0.0, 1.0,
    );
  }
  return vec4<f32>(1.0, 0.0, 1.0, 1.0);
}

`;

export default includeCellUtils;
