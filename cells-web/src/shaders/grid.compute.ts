import { CELL_VARIANT_LIFE } from "constants/cell";
import includeCellUtils from "shaders/cell.util";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridComputeShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;

  const code = /* wgsl */`

${includeCellUtils()}

[[block]] struct Grid {
  cells: array<Cell>;
};

[[group(0), binding(0)]] var<storage, read> inpGrid: Grid;
[[group(0), binding(1)]] var<storage, write> outGrid: Grid;

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
  let cell = inpGrid.cells[index];

  let cellVariant = getCellVariant(cell);

  if (cellVariant != ${CELL_VARIANT_LIFE}u) {
    outGrid.cells[index] = cell;
    return;
  }

  // life processing
  let cursor = getCellCursor(cell);
  let gen = getCellGen(cell, cursor);

  outGrid.cells[index] = cell;
}

  `;

  return device.createShaderModule({ code });
};

export default createGridComputeShader;
