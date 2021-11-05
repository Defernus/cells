
const MAX_LIFE = 255;

interface Props {
  device: GPUDevice;
  bindingGroup?: number;
  inpGridBufferBinding?: number;
  outGridBufferBinding?: number;
  width: number;
  height: number;
}

const createGridShader = (props: Props): GPUShaderModule => {
  const {
    device,
    bindingGroup = 0,
    width, height,
  } = props;

  const code = /* wgsl */`

[[block]] struct Grid {
  numbers: array<u32>;
};

[[group(${bindingGroup}), binding(0)]] var<storage, read> inpGrid: Grid;
[[group(${bindingGroup}), binding(1)]] var<storage, write> outGrid: Grid;

fn mod(a: i32, b: i32) -> i32 {
  return ((a % b) + b) % b;
}

fn getIndex(cell: vec2<i32>, size: vec2<i32>) -> i32 {
  return mod(cell.x, size.x) + mod(cell.y, size.y) * size.x;
}

[[stage(compute), workgroup_size(8, 8)]]
fn main([[builtin(global_invocation_id)]] global_id: vec3<u32>) {
  let size = vec2<i32>(${width}, ${height});
  let cell = vec2<i32>(
    i32(global_id.x),
    i32(global_id.y)
  );

  if (cell.x > size.x || cell.y > size.y) {
    return;
  }

  var neighbors = 0u;
  let MAX_LIFE = ${MAX_LIFE}u;
    
  for (var x: i32 = -1; x != 2; x = x + 1) {
    for (var y: i32 = -1; y != 2; y = y + 1) {
      if (x == 0 && y == 0) {
        continue;
      }

      if (inpGrid.numbers[getIndex(cell + vec2<i32>(x, y), size)] == MAX_LIFE) {
        neighbors = neighbors + 1u;
      }
    }
  }

  let index = getIndex(cell, size);
  let currentCell = inpGrid.numbers[index];
  if (currentCell == MAX_LIFE) {
    if (neighbors == 2u || neighbors == 3u) {
      outGrid.numbers[index] = MAX_LIFE;
      return;
    }
    outGrid.numbers[index] = MAX_LIFE - 1u;
    return;
  }
  if (neighbors == 3u) {
    outGrid.numbers[index] = MAX_LIFE;
    return;
  }
  if(currentCell > 0u) {
    outGrid.numbers[index] = currentCell - 1u;
    return;
  }
  outGrid.numbers[index] = 0u;
}

  `;

  return device.createShaderModule({ code });
};

export default createGridShader;
