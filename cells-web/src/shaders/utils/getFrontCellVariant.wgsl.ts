import { CELL_VARIANT_EMPTY } from "constants/cell";

const includeGetFrontCellVariant = (): string => /* wgsl */`

fn getFrontCellVariant(index: u32, gridSize: vec2<i32>) -> u32 {
  let dir = getCellDirection(index);
  let isStr = i32(dir % 2u);
  let leftDir = rotate(dir, 3 - isStr);
  let rightDir = rotate(dir, isStr - 3);
  for (var dist = 0u; dist != 3u; dist = dist + 1u) {
    let dk = (dist + u32(isStr)) / 2u;
    
    let lookAtCord = vec2<i32>(getXByDir(dir) * i32(dist + 1u), getYByDir(dir) * i32(dist + 1u));
    
    let lookAtIndex = getIndex(lookAtCord, gridSize);
    
    if (getCellVariant(lookAtIndex) != ${CELL_VARIANT_EMPTY}u) {
      return getCellVariant(lookAtIndex);
    }

    for (var k = 1u; k <= dk; k = k + 1u) {
      let kVec = vec2<i32>(i32(k), i32(k));
      let leftIndex = getIndex(getCellLookAt(leftDir) * kVec + lookAtCord, gridSize);
      if (getCellVariant(leftIndex) != ${CELL_VARIANT_EMPTY}u) {
        return getCellVariant(leftIndex);
      }

      let rightIndex = getIndex(getCellLookAt(rightDir) * kVec + lookAtCord, gridSize);
      if (getCellVariant(rightIndex) != ${CELL_VARIANT_EMPTY}u) {
        return getCellVariant(rightIndex);
      }
    }
  }
  return ${CELL_VARIANT_EMPTY}u;
}

`;

export default includeGetFrontCellVariant;