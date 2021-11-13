import {
  CELL_GENES_SIZE,
  CELL_STAMINA_CHILD_DIVISION_FACTOR,
  CELL_STAMINA_PARENT_DIVISION_FACTOR,
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
  CELL_VARIANT_WALL,
} from "constants/cell";
import { cellStructure } from "utils/cells/Cell";

const cellProps = Object.entries(cellStructure).map(([name, { wgslType }]) => `${name}: ${wgslType};`);

interface Props {
  binding: number;
}

export const includeGrid = ({ binding }: Props): string => /* wgsl */`

struct Cell {
  ${cellProps.join("\n  ")}
};

[[block]] struct Grid {
  cells: array<Cell>;
};

[[group(0), binding(${binding})]] var<storage, write> grid: Grid;

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

fn rotate(direction: u32, rotation: i32) -> u32 {
  return u32(mod(i32(direction) + rotation, 8));
}

fn rotateCell(index: u32, rotation: i32) {
  grid.cells[index].direction = rotate(grid.cells[index].direction, rotation);
}

fn addCellPredatorPoint(index: u32, value: i32) {
  var points = i32(grid.cells[index].predator) + value;
  if (points > 255) {
    points = 255;
  }
  if (points < 0) {
    points = 0;
  }
  grid.cells[index].predator = u32(points);
}

fn addCellPlantPoint(index: u32, value: i32) {
  var points = i32(grid.cells[index].plant) + value;
  if (points > 255) {
    points = 255;
  }
  if (points < 0) {
    points = 0;
  }
  grid.cells[index].plant = u32(points);
}

fn addCellCursor(index: u32, value: u32) {
  setCellCursor(index, (getCellCursor(index) + value) % ${CELL_GENES_SIZE}u);
}

fn setCellGen(index: u32, cursor: u32, value: u32) {
  var genes = grid.cells[index].genes;
  let clusterIndex: u32 = cursor / 4u;
  let genCluster = genes[clusterIndex];
  let clusterOffset = (cursor % 4u) * 8u;
  let clusterMask = 0xffu << clusterOffset;
  grid.cells[index].genes[clusterIndex] = (genCluster & ~clusterMask) | ((value << clusterOffset) & clusterMask);
}

// TODO multiple genes mutations
fn mutate(index: u32, mutationFactor: f32) {
  let genToMutate = rnd(index) % u32(${CELL_GENES_SIZE}.0 / mutationFactor);
  if (genToMutate < ${CELL_GENES_SIZE}u) {
    setCellGen(index, genToMutate, rnd(index) % 256u);
  }
}

fn divide(index: u32, destIndex: u32, mutationFactor: f32) {
  let initialStamina = getCellStamina(index);
  setCellStamina(index, u32(f32(initialStamina) * ${CELL_STAMINA_PARENT_DIVISION_FACTOR}));
  grid.cells[destIndex] = grid.cells[index];
  setCellStamina(destIndex, u32(f32(initialStamina) * ${CELL_STAMINA_CHILD_DIVISION_FACTOR}));
  rotateCell(destIndex, 4);
  setCellCursor(destIndex, 0u);
  setCellAge(destIndex, 0u);
  mutate(destIndex, mutationFactor);
}

`;
