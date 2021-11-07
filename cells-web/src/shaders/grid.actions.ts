import {
  CELL_GENES_SIZE,
  CELL_GENES_TO_PROCESS,
  CELL_GEN_MOVE,
  CELL_GEN_PHOTOSYNTHESIS,
  CELL_GEN_ROTATE_RIGHT_1,
  CELL_GEN_ROTATE_RIGHT_7,
  CELL_GEN_WAIT,
  CELL_INTENTION_DIVISION,
  CELL_INTENTION_MOVE,
  CELL_STAMINA_DIVISION_FACTOR,
  CELL_STAMINA_DIVISION_MAX,
  CELL_STAMINA_FRAME,
  CELL_STAMINA_MOVEMENT,
  CELL_STAMINA_PHOTOSYNTHESIS,
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
} from "constants/cell";
import includeCellUtils from "shaders/cell.util";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridActionsShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;

  const code = /* wgsl */`

${includeCellUtils()}

[[block]] struct Grid {
  cells: array<Cell>;
};

[[group(0), binding(0)]] var<storage, write> grid: Grid;

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
  var cell = grid.cells[index];

  let cellVariant = getCellVariant(&cell);

  if (cellVariant != ${CELL_VARIANT_LIFE}u) {
    grid.cells[index] = cell;
    return;
  }

  // life processing
  let initialCursor = getCellCursor(&cell);
  var cursor = initialCursor;

  var newStamina = i32(getCellStamina(&cell)) + ${CELL_STAMINA_FRAME};

  if (newStamina > ${CELL_STAMINA_DIVISION_MAX}) {
    let lookAtCord = getCellLookAt(&cell) + cord;
    let lookAtIndex = getIndex(lookAtCord, gridSize);
    var lookAtCell = grid.cells[lookAtIndex];
    if (getCellVariant(&lookAtCell) != ${CELL_VARIANT_EMPTY}u && getCellVariant(&lookAtCell) != ${CELL_VARIANT_FOOD}u) {
      grid.cells[index] = Cell();
      return;
    }
    setCellIntention(&cell, ${CELL_INTENTION_DIVISION}u);
    grid.cells[index] = cell;
    return;
  }

  for (; cursor != initialCursor + ${CELL_GENES_TO_PROCESS}u; cursor = cursor + 1u) {
    let gen = getCellGen(&cell, cursor % ${CELL_GENES_SIZE}u);

    if (gen == ${CELL_GEN_WAIT}u) {
      continue;
    }
    if (gen >= ${CELL_GEN_ROTATE_RIGHT_1}u && gen <= ${CELL_GEN_ROTATE_RIGHT_7}u) {
      rotateCell(&cell, i32(gen) - ${CELL_GEN_ROTATE_RIGHT_1} + 1);
      continue;
    }
    if (gen == ${CELL_GEN_MOVE}u) {
      setCellIntention(&cell, ${CELL_INTENTION_MOVE}u);  
      cursor = cursor + 1u;
      newStamina = newStamina + ${CELL_STAMINA_MOVEMENT};
      break;
    }
    if (gen == ${CELL_GEN_PHOTOSYNTHESIS}u) {
      cursor = cursor + 1u;
      newStamina = newStamina + ${CELL_STAMINA_PHOTOSYNTHESIS};
      break;
    }
  }

  setCellCursor(&cell, cursor % ${CELL_GENES_SIZE}u);

  if (newStamina <= 0) {
    cell = Cell();
  } else {
    setCellStamina(&cell, u32(newStamina));
  }

  grid.cells[index] = cell;
}

  `;

  return device.createShaderModule({ code });
};

export default createGridActionsShader;
