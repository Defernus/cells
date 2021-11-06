interface Props {
  width: number;
  height: number;
}

const createGridFragmentShader = ({ width, height }: Props): string => 
/* wgsl */`

[[block]] struct Grid {
  numbers: array<u32>;
};

[[group(0), binding(0)]] var<storage, read> grid: Grid;

fn getIndex(cell: vec2<u32>, width: u32) -> u32 {
  return cell.x + cell.y * width;
}

[[stage(fragment)]]
fn main([[location(0)]] fragUV: vec2<f32>) -> [[location(0)]] vec4<f32> {
  let fragCord = vec2<u32>(
    u32(fragUV.x * f32(${width})),
    u32(fragUV.y * f32(${height})),
  );
  let index = getIndex(fragCord, u32(${width}));
  return vec4<f32>(f32(grid.numbers[index]) / 255.0, 0.0, 0.0, 1.0);
}
  
`;

export default createGridFragmentShader;
