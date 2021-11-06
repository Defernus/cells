import includeCellUtils from "shaders/cell.util";

interface Props {
  width: number;
  height: number;
}

const createGridFragmentShader = ({ width, height }: Props): string => 
/* wgsl */`

${includeCellUtils()}

[[block]] struct Grid {
  cells: array<Cell>;
};

[[group(0), binding(0)]] var<storage, read> grid: Grid;

[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>) -> [[location(0)]] vec4<f32> {
  let cord = vec2<i32>(
    i32(fragUV.x * f32(${width})),
    i32(fragUV.y * f32(${height})),
  );
  let cell = grid.cells[getIndex(cord, vec2<i32>(${width}, ${height}))];
  return getCellColor(cell);
}
  
`;

export default createGridFragmentShader;
