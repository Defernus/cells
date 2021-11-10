import {
  CELL_INTENTION_DIVISION,
  CELL_INTENTION_MOVE,
  CELL_STAMINA_CHILD_DIVISION_FACTOR,
  CELL_STAMINA_EAT,
  CELL_STAMINA_PARENT_DIVISION_FACTOR,
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
  CELL_VARIANT_WALL,
} from "constants/cell";
import { includeCellGetters, includeCellSetters, includeCell } from "shaders/cell.util";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridUpdateShader = (props: Props): GPUShaderModule => {
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

  let currentIndex = getIndex(cord, gridSize);
  let cell = &grid.cells[currentIndex];

  // process all neighbor cells
  for (var i = -1; i != 2; i = i + 1) {
    for (var j = -1; j != 2; j = j + 1) {
      // skip current cell
      if (i == 0 && j == 0) {
        continue;
      }
      let nCord = cord + vec2<i32>(i, j);
      let nIndex = getIndex(nCord, gridSize);

      // skip not life cells
      if (getCellVariant(nIndex) != ${CELL_VARIANT_LIFE}u) {
        continue;
      }

      // skip neighbor cell if it not look at this cell
      let lookAt = getCellLookAt(nIndex) + nCord;
      if (lookAt.x != cord.x || lookAt.y != cord.y) {
        continue;
      }

      let nIntention = getCellIntention(nIndex);

      if (nIntention == ${CELL_INTENTION_MOVE}u) {
        setCellIntention(nIndex, 0u);
        let variant = getCellVariant(currentIndex);
        if (variant == ${CELL_VARIANT_WALL}u) {
          continue;
        }
        if (variant == ${CELL_VARIANT_EMPTY}u) {
          grid.cells[currentIndex] = grid.cells[nIndex];
          grid.cells[nIndex] = Cell();
          return;
        }
        if (variant == ${CELL_VARIANT_FOOD}u) {
          addCellPredatorPoint(nIndex, ${CELL_STAMINA_EAT}u);
          setCellStamina(nIndex, getCellStamina(nIndex) + ${CELL_STAMINA_EAT}u);
          grid.cells[currentIndex] = Cell();
          return;
        }
        if (variant == ${CELL_VARIANT_LIFE}u) {
          let stamina = i32(getCellStamina(currentIndex));
          let hit = i32(getCellStamina(nIndex)) / 2 + 1;
          let newStamina = stamina - hit;
          if (newStamina <= 0) {
            setCellVariant(currentIndex, ${CELL_VARIANT_FOOD}u);
            return;
          }
          setCellStamina(currentIndex, u32(newStamina));
        }
      }
      if (nIntention == ${CELL_INTENTION_DIVISION}u) {
        setCellIntention(nIndex, 0u);
        let initialStamina = getCellStamina(nIndex);
        setCellStamina(nIndex, u32(f32(initialStamina) * ${CELL_STAMINA_PARENT_DIVISION_FACTOR}));
        grid.cells[currentIndex] = grid.cells[nIndex];
        setCellStamina(currentIndex, u32(f32(initialStamina) * ${CELL_STAMINA_CHILD_DIVISION_FACTOR}));
        return;
      }
    }
  }
}

  `;

  return device.createShaderModule({ code });
};

export default createGridUpdateShader;
