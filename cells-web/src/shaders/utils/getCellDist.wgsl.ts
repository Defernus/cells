import { CELL_VARIANT_EMPTY } from "constants/cell";

const includeGetCellDist = (): string => /* wgsl */`

fn getCellDist(index: u32, gridSize: vec2<i32>) -> u32 {
  let cord = getCord(index, gridSize);
  let dir = getCellDirection(index);
  let isStr = i32(dir % 2u);
  let leftDir = rotate(dir, 3 - isStr);
  let rightDir = rotate(dir, isStr - 3);
  for (var dist = 0u; dist != 3u; dist = dist + 1u) {
    let dk = (dist + u32(isStr)) / 2u;
    
    let lookAtCord = vec2<i32>(getXByDir(dir) * i32(dist + 1u), getYByDir(dir) * i32(dist + 1u)) + cord;
    
    let lookAtIndex = getIndex(lookAtCord, gridSize);
    
    if (getCellVariant(lookAtIndex) != ${CELL_VARIANT_EMPTY}u) {
      return dist;
    }

    for (var k = 1u; k <= dk; k = k + 1u) {
      let kVec = vec2<i32>(i32(k), i32(k));
      let leftIndex = getIndex(getCellLookAt(leftDir) * kVec + lookAtCord, gridSize);
      if (getCellVariant(leftIndex) != ${CELL_VARIANT_EMPTY}u) {
        return dist;
      }

      let rightIndex = getIndex(getCellLookAt(rightDir) * kVec + lookAtCord, gridSize);
      if (getCellVariant(rightIndex) != ${CELL_VARIANT_EMPTY}u) {
        return dist;
      }
    }
  }
  return 3u;
}

`;

export default includeGetCellDist;