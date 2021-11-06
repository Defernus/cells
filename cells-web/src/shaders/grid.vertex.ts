interface Props {
  width: number;
  height: number;
}

const createGridVertexShader = ({ width, height }: Props): string => 
/* wgsl */`

struct VertexOutput {
  [[builtin(position)]] Position: vec4<f32>;
  [[location(0)]] fragUV: vec2<f32>;
};

[[stage(vertex)]]
fn main([[builtin(vertex_index)]] VertexIndex: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, -1.0),
  );
  var output: VertexOutput;
  output.Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
  output.fragUV = pos[VertexIndex] * 0.5 + 0.5;
  return output;
}
  
`;

export default createGridVertexShader;
