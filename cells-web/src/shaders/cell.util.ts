import {
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
  CELL_VARIANT_WALL,
} from "constants/cell";

export const includeCell = (): string => /* wgsl */`

struct Cell {
  genes: array<u32, 64>;
  stamina: u32;
  cursor: u32;
  age: u32;
  intention: u32;
  predator: u32;
  plant: u32;
  variant: u32;
  direction: u32;
};

`;

export const includeCellGetters = (): string => /* wgsl */`

fn mod(a: i32, b: i32) -> i32 {
  return ((a % b) + b) % b;
}

fn getIndex(cord: vec2<i32>, gridSize: vec2<i32>) -> u32 {
  return u32(mod(cord.x, gridSize.x) + mod(cord.y, gridSize.y) * gridSize.x);
}

fn getCellGen(index: u32, cursor: u32) -> u32 {
  var genes = grid.cells[index].genes;
  let clusterIndex: u32 = cursor / 4u;
  let genCluster = genes[clusterIndex];
  return (genCluster >> ((cursor % 4u) * 8u)) & 0x000000ffu;
}

fn getCellStamina(index: u32) -> u32 {
  return grid.cells[index].stamina;
}
fn getCellCursor(index: u32) -> u32 {
  return grid.cells[index].cursor;
}
fn getCellAge(index: u32) -> u32 {
  return grid.cells[index].age;
}
fn getCellIntention(index: u32) -> u32 {
  return grid.cells[index].intention;
}
fn getCellPredator(index: u32) -> u32 {
  return grid.cells[index].predator;
}
fn getCellPlant(index: u32) -> u32 {
  return grid.cells[index].plant;
}
fn getCellVariant(index: u32) -> u32 {
  return grid.cells[index].variant;
}
fn getCellDirection(index: u32) -> u32 {
  return grid.cells[index].direction;
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

fn getCellLookAt(index: u32) -> vec2<i32> {
  let dir = grid.cells[index].direction;
  return vec2<i32>(getXByDir(dir), getYByDir(dir));
}

fn getCellColor(index: u32) -> vec4<f32> {
  let variant = grid.cells[index].variant;
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
      f32(grid.cells[index].predator) / 512.0 + 0.5,
      f32(grid.cells[index].plant) / 512.0 + 0.5,
      0.0, 1.0,
    );
  }
  return vec4<f32>(1.0, 0.0, 1.0, 1.0);
}


`;

export const includeCellSetters = (): string => /* wgsl */`

fn setCellStamina(index: u32, value: u32) {
  grid.cells[index].stamina = value;
}
fn setCellCursor(index: u32, value: u32) {
  grid.cells[index].cursor = value;
}
fn setCellAge(index: u32, value: u32) {
  grid.cells[index].age = value;
}
fn setCellIntention(index: u32, value: u32) {
  grid.cells[index].intention = value;
}
fn setCellPredator(index: u32, value: u32) {
  grid.cells[index].predator = value;
}
fn setCellPlant(index: u32, value: u32) {
  grid.cells[index].plant = value;
}
fn setCellVariant(index: u32, value: u32) {
  grid.cells[index].variant = value;
}
fn setCellDirection(index: u32, value: u32) {
  grid.cells[index].direction = value;
}

fn rotateCell(index: u32, rotation: i32) {
  grid.cells[index].direction = u32(mod(i32(grid.cells[index].direction) + rotation, 8));
}

fn addCellPredatorPoint(index: u32, value: u32) {
  var points = grid.cells[index].predator + value;
  grid.cells[index].predator = points;
}

fn addCellPlantPoint(index: u32, value: u32) {
  var points = grid.cells[index].plant + value;
  grid.cells[index].plant = points;
}

`;
