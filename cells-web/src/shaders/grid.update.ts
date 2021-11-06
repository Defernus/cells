import { CELL_INTENTION_MOVE, CELL_VARIANT_LIFE } from "constants/cell";
import includeCellUtils from "shaders/cell.util";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridUpdateShader = (props: Props): GPUShaderModule => {
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

  let currentIndex = getIndex(cord, gridSize);
  var cell = grid.cells[currentIndex];

  // process all neighbor cells
  for (var i = -1; i != 2; i = i + 1) {
    for (var j = -1; j != 2; j = j + 1) {
      // skip current cell
      if (i == 0 && j == 0) {
        continue;
      }
      let nCord = cord + vec2<i32>(i, j);
      let nIndex = getIndex(nCord, gridSize);
      var nCell = grid.cells[nIndex];

      // skip not life cells
      if (getCellVariant(&nCell) != ${CELL_VARIANT_LIFE}u) {
        continue;
      }

      // skip neighbor cell if it not look at this cell
      let lookAt = getCellLookAt(&cell) + nCord;
      if (lookAt.x != cord.x || lookAt.y != cord.y) {
        continue;
      }

      if (getCellIntention(&nCell) == ${CELL_INTENTION_MOVE}u) {
        grid.cells[currentIndex] = nCell;
        grid.cells[nIndex] = Cell();
        return;
      }
    }
  }
}

  `;

  return device.createShaderModule({ code });
};

export default createGridUpdateShader;