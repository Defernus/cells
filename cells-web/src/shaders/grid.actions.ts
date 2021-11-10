import {
  CELL_GENES_SIZE,
  CELL_GENES_TO_PROCESS,
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
} from "constants/cell";
import { includeCellSetters, includeCellGetters, includeCell } from "shaders/cell.util";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridActionsShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;

  const code = /* wgsl */`

${includeCell()}

[[block]] struct Grid {
  cells: array<Cell>;
};

[[group(0), binding(0)]] var<storage, write> grid: Grid;

${includeCellGetters()}
${includeCellSetters()}

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
  let initialCursor = getCellCursor(index);
  var cursor = initialCursor;

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

  for (; cursor != initialCursor + ${CELL_GENES_TO_PROCESS}u; cursor = cursor + 1u) {
    let gen = getCellGen(index, cursor % ${CELL_GENES_SIZE}u);

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
      let laVariant = getCellVariant(lookAtIndex);
      cursor = cursor + 1u;
      if (laVariant == ${CELL_VARIANT_EMPTY}u) {
        setCellIntention(index, ${CELL_INTENTION_MOVE}u);
        break;
      }
      if (laVariant == ${CELL_VARIANT_FOOD}u) {
        newStamina = newStamina + ${CELL_STAMINA_EAT};
        grid.cells[lookAtIndex] = Cell();
        break;
      }
      if (laVariant == ${CELL_VARIANT_LIFE}u) {
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
      addCellPlantPoint(index, ${CELL_STAMINA_PHOTOSYNTHESIS}u);
      cursor = cursor + 1u;
      newStamina = newStamina + ${CELL_STAMINA_PHOTOSYNTHESIS};
      break;
    }
    if (gen == ${CELL_GEN_END}u) {
      cursor = cursor + 1u;
      break;
    }
  }

  setCellCursor(index, cursor % ${CELL_GENES_SIZE}u);

  if (newStamina <= 0) {
    grid.cells[index] = Cell();
  } else {
    setCellStamina(index, u32(newStamina));
  }
}

  `;

  return device.createShaderModule({ code });
};

export default createGridActionsShader;
