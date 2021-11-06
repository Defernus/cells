import {
  CELL_GENES_SIZE,
  CELL_GENES_TO_PROCESS,
  CELL_GEN_MOVE,
  CELL_GEN_ROTATE_RIGHT_1,
  CELL_GEN_ROTATE_RIGHT_7,
  CELL_GEN_WAIT,
  CELL_INTENTION_MOVE,
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

  for (; cursor != initialCursor + ${CELL_GENES_TO_PROCESS}u; cursor = cursor + 1u) {
    let gen = getCellGen(&cell, cursor % ${CELL_GENES_SIZE}u);

    if (gen == ${CELL_GEN_WAIT}u) {
      continue;
    }
    if (gen >= ${CELL_GEN_ROTATE_RIGHT_1}u && gen <= ${CELL_GEN_ROTATE_RIGHT_7}u) {
      rotateCell(&cell, gen - ${CELL_GEN_ROTATE_RIGHT_1}u + 1u);
      continue;
    }
    if (gen == ${CELL_GEN_MOVE}u) {
      setCellIntention(&cell, ${CELL_INTENTION_MOVE}u);  
      cursor = cursor + 1u;
      break;
    }
  }

  setCellCursor(&cell, cursor % ${CELL_GENES_SIZE}u);

  grid.cells[index] = cell;
}

  `;

  return device.createShaderModule({ code });
};

export default createGridActionsShader;
