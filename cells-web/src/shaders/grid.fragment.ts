import { CELL_VARIANT_EMPTY, CELL_VARIANT_LIFE } from "constants/cell";
import { includeCellGetters, includeGrid } from "shaders/utils/cell";

interface Props {
  width: number;
  height: number;
  device: GPUDevice;
}

const createGridFragmentShader = (props: Props): GPUShaderModule => {
  const { device, width, height } = props;
  const code = /* wgsl */ `

${includeGrid({ binding: 0 })}
${includeCellGetters()}

[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>) -> [[interpolate(flat), location(0)]] vec4<f32> {
  let cord = vec2<i32>(
    i32(fragUV.x * f32(${width})),
    i32(fragUV.y * f32(${height})),
  );
  let index = getIndex(cord, vec2<i32>(${width}, ${height}));

  // draw cell direction
  if (getCellVariant(index) == ${CELL_VARIANT_EMPTY}u) {
    for (var i = -1; i != 2; i = i + 1) {
      for (var j = -1; j != 2; j = j + 1) {
        // skip current cell
        if (i == 0 && j == 0) {
          continue;
        }
        let nCord = cord + vec2<i32>(i, j);
        let nIndex = getIndex(nCord, vec2<i32>(${width}, ${height}));

        // skip not life cells
        if (getCellVariant(nIndex) != ${CELL_VARIANT_LIFE}u) {
          continue;
        }

        // skip neighbor cell if it not look at this cell
        let lookAt = getCellLookAt(nIndex) + nCord;
        if (lookAt.x != cord.x || lookAt.y != cord.y) {
          continue;
        }

        return vec4<f32>(0.1, 0.1, 0.4, 1.0);
      }
    }
  }

  return getCellColor(index);
}
  
  `;

  return device.createShaderModule({ code });
};
export default createGridFragmentShader;
