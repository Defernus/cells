import { CELL_VARIANT_EMPTY, CELL_VARIANT_FOOD, CELL_VARIANT_LIFE, CELL_VARIANT_WALL } from "constants/cell";

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
  return u32(mod(cord.x, gridSize.x) + mod(gridSize.y, gridSize.y) * gridSize.x);
}

fn getCellVariant(cell: Cell) -> u32 {
  return cell.intention_predator_plant_variant & 0x000000ffu;
}

fn getCellCursor(cell: Cell) -> u32 {
  return cell.stamina_cursor & 0x0000ffffu;
}

fn getCellGen(cell: Cell, cursor: u32) -> u32 {
  var genes = cell.genes;
  let clusterIndex: u32 = cursor / 4u;
  let genCluster = genes[clusterIndex];
  return (genCluster >> ((3u - cursor % 4u) * 8u)) & 0x000000ffu;
}

fn getCellColor(cell: Cell) -> vec4<f32> {
  let variant = getCellVariant(cell);
  if (variant == ${CELL_VARIANT_EMPTY}u) {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
  }
  if (variant == ${CELL_VARIANT_WALL}u) {
    return vec4<f32>(0.5, 0.5, 0.5, 1.0);
  }
  if (variant == ${CELL_VARIANT_FOOD}u) {
    return vec4<f32>(0.58, 0.49, 0.25, 1.0);
  }
  if (variant == ${CELL_VARIANT_LIFE}u) {
    return vec4<f32>(0.0, 1.0, 0.0, 1.0);
  }
  return vec4<f32>(1.0, 0.0, 1.0, 1.0);
}

`;

export default includeCellUtils;
