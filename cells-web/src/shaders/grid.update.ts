import {
  CELL_INTENTION_DIVISION,
  CELL_INTENTION_HIT,
  CELL_INTENTION_MOVE,
  CELL_STAMINA_EAT,
  CELL_VARIANT_EMPTY,
  CELL_VARIANT_FOOD,
  CELL_VARIANT_LIFE,
} from "constants/cell";
import { includeCellGetters, includeCellSetters, includeGrid } from "shaders/utils/cell";
import includeRandom from "shaders/utils/random";

interface Props {
  device: GPUDevice;
  width: number;
  height: number;
}

const createGridUpdateShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;

  const code = /* wgsl */`

${includeGrid({ binding: 0 })}
${includeRandom({ binding: 1 })}
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
  // !TODO shuffle it and process in random order
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
      setCellIntention(nIndex, 0u);

      if (nIntention == ${CELL_INTENTION_MOVE}u) {
        let variant = getCellVariant(currentIndex);
        if (variant == ${CELL_VARIANT_EMPTY}u) {
          grid.cells[currentIndex] = grid.cells[nIndex];
          grid.cells[nIndex] = Cell();
          addCellCursor(nIndex, 4u);
          continue;
        }
        if (variant == ${CELL_VARIANT_FOOD}u) {
          addCellPredatorPoint(nIndex, ${CELL_STAMINA_EAT});
          setCellStamina(nIndex, getCellStamina(nIndex) + ${CELL_STAMINA_EAT}u);
          grid.cells[currentIndex] = Cell();
          addCellCursor(nIndex, 2u);
          continue;
        }
        continue;
      }
      if (nIntention == ${CELL_INTENTION_HIT}u) {
        let variant = getCellVariant(currentIndex);
        if (variant == ${CELL_VARIANT_LIFE}u) {
          let stamina = i32(getCellStamina(currentIndex));
          let hit = i32(getCellStamina(nIndex)) / 2 + 1;
          let newStamina = stamina - hit;
          if (newStamina <= 0) {
            setCellStamina(currentIndex, 0u);
            continue;
          }
          setCellStamina(currentIndex, u32(newStamina));

          addCellCursor(nIndex, 2u);
          continue;
        }
        continue;
      }
      if (nIntention == ${CELL_INTENTION_DIVISION}u) {
        setCellIntention(nIndex, 0u);
        divide(nIndex, currentIndex, 0.5);
        continue;
      }
    }
  }
}

  `;

  return device.createShaderModule({ code });
};

export default createGridUpdateShader;
