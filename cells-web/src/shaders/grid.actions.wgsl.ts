import {
  CELL_GEN_MOVE,
  CELL_GEN_PHOTOSYNTHESIS,
  CELL_GEN_ROTATE_RIGHT_1,
  CELL_GEN_ROTATE_RIGHT_7,
  CELL_GEN_NEXT,
  CELL_INTENTION_DIVISION,
  CELL_INTENTION_MOVE,
  CELL_STAMINA_DIVISION_MAX,
  CELL_STAMINA_FRAME,
  CELL_STAMINA_MOVEMENT,
  CELL_STAMINA_PHOTOSYNTHESIS,
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
  CELL_GEN_END,
  CELL_STAMINA_EAT,
  CELL_INTENTION_HIT,
  CELL_GEN_DIVIDE,
  CELL_STAMINA_DIVISION_MIN,
  CELL_GEN_DIST,
  CELL_GEN_JUMP,
  CELL_GENES_SIZE,
  CELL_GEN_VARIANT,
  CELL_GENES_TO_PROCESS,
} from "constants/cell";
import { includeCellSetters, includeCellGetters, includeGrid } from "shaders/utils/cell.wgsl";
import includeGetCellDist from "shaders/utils/getCellDist.wgsl";
import includeGetNearestCellVariant from "shaders/utils/getNearestCellVariant.wgsl";
import includeRandom from "shaders/utils/random.wgsl";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridActionsShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;

  const code = /* wgsl */`

${includeGrid({ binding: 0 })}
${includeRandom({ binding: 1 })}
${includeCellGetters()}
${includeCellSetters()}
${includeGetCellDist()}
${includeGetNearestCellVariant()}

[[stage(compute), workgroup_size(8, 8)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
  let gridSize = vec2<i32>(${width}, ${height});
  let cord = vec2<i32>(
    i32(global_id.x),
    i32(global_id.y),
  );

  if (cord.x > gridSize.x || cord.y > gridSize.y) {
    return;
  }

  let index = getIndex(cord, gridSize);

  let cellVariant = getCellVariant(index);

  if (cellVariant != ${CELL_VARIANT_LIFE}u) {
    return;
  }

  // life processing
  setCellAge(index, getCellAge(index) + 1u);

  var newStamina = i32(getCellStamina(index)) + ${CELL_STAMINA_FRAME};

  if (newStamina > ${CELL_STAMINA_DIVISION_MAX}) {
    let lookAtCord = getCellLookAt(index) + cord;
    let lookAtIndex = getIndex(lookAtCord, gridSize);
    if (getCellVariant(lookAtIndex) != ${CELL_VARIANT_EMPTY}u) {
      setCellVariant(index, ${CELL_VARIANT_FOOD}u);
      return;
    }
    setCellIntention(index, ${CELL_INTENTION_DIVISION}u);
    return;
  }
  addCellPredatorPoint(index, -1);
  addCellPlantPoint(index, -1);

  for (var i = 0u; i != ${CELL_GENES_TO_PROCESS}u; i = i + 1u) {
    let gen = getCellGen(index, getCellCursor(index));
    addCellCursor(index, 1u);

    if (gen == ${CELL_GEN_NEXT}u) {
      continue;
    }
    if (gen >= ${CELL_GEN_ROTATE_RIGHT_1}u && gen <= ${CELL_GEN_ROTATE_RIGHT_7}u) {
      rotateCell(index, i32(gen) - ${CELL_GEN_ROTATE_RIGHT_1} + 1);
      continue;
    }
    if (gen == ${CELL_GEN_MOVE}u) {
      newStamina = newStamina + ${CELL_STAMINA_MOVEMENT};
      let lookAtIndex = getIndex(getCellLookAt(index) + cord, gridSize);
      let lookAtVariant = getCellVariant(lookAtIndex);
      if (lookAtVariant == ${CELL_VARIANT_EMPTY}u) {
        setCellIntention(index, ${CELL_INTENTION_MOVE}u);
        break;
      }
      if (lookAtVariant == ${CELL_VARIANT_FOOD}u) {
        addCellPredatorPoint(index, ${CELL_STAMINA_EAT});
        newStamina = newStamina + ${CELL_STAMINA_EAT};
        grid.cells[lookAtIndex] = Cell();
        break;
      }
      if (lookAtVariant == ${CELL_VARIANT_LIFE}u) {
        let lookAtStamina = i32(getCellStamina(lookAtIndex));
        let hit = i32(newStamina) / 2 + 1;
        let newLAStamina = lookAtStamina - hit;
        if (newLAStamina <= 0) {
          setCellVariant(lookAtIndex, ${CELL_VARIANT_FOOD}u);
          break;
        }
        setCellIntention(index, ${CELL_INTENTION_HIT}u);
        break;
      }
      // if wall
      break;
    }
    if (gen == ${CELL_GEN_PHOTOSYNTHESIS}u) {
      addCellPlantPoint(index, ${CELL_STAMINA_PHOTOSYNTHESIS});
      newStamina = newStamina + ${CELL_STAMINA_PHOTOSYNTHESIS};
      break;
    }
    if (gen == ${CELL_GEN_DIVIDE}u) {
      if (newStamina < ${CELL_STAMINA_DIVISION_MIN}) {
        continue;
      }
      let lookAtCord = getCellLookAt(index) + cord;
      let lookAtIndex = getIndex(lookAtCord, gridSize);
      if (getCellVariant(lookAtIndex) != ${CELL_VARIANT_EMPTY}u) {
        setCellVariant(index, ${CELL_VARIANT_FOOD}u);
        return;
      }
      setCellIntention(index, ${CELL_INTENTION_DIVISION}u);
      break;
    }
    if (gen == ${CELL_GEN_DIST}u) {
      addCellCursor(index, getCellDist(index, gridSize) * 3u);
      continue;
    }
    if (gen == ${CELL_GEN_VARIANT}u) {
      addCellCursor(index, getNearestCellVariant(index, gridSize) * 3u);
      continue;
    }
    if (gen == ${CELL_GEN_JUMP}u) {
      let g1 = getCellGen(index, (getCellCursor(index) + 1u) % ${CELL_GENES_SIZE}u);
      let g2 = getCellGen(index, (getCellCursor(index) + 2u) % ${CELL_GENES_SIZE}u);
      setCellCursor(index, ((g2 << 8u) | g1) % ${CELL_GENES_SIZE}u);
      continue;
    }
    if (gen == ${CELL_GEN_END}u) {
      break;
    }
  }

  if (newStamina <= 0) {
    setCellVariant(index, ${CELL_VARIANT_FOOD}u);
  } else {
    setCellStamina(index, u32(newStamina));
  }
}

  `;

  return device.createShaderModule({ code });
};

export default createGridActionsShader;
