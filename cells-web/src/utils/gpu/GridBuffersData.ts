interface ScreenBufferProps {
  width: number;
  height: number;
  device: GPUDevice;
  actionsPipeline: GPUComputePipeline;
  updatePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  initialGrid?: Uint8Array;
  cellSize: number;
}

class GridBuffersData {
  private width: number;
  private height: number;
  private cellSize: number;
  private device: GPUDevice;

  readonly buffer: GPUBuffer;
  readonly actionBindGroup: GPUBindGroup;
  readonly updateBindGroup: GPUBindGroup;
  readonly renderBindGroup: GPUBindGroup;

  constructor (props: ScreenBufferProps) {
    const {
      width,
      height,
      cellSize,
      device,
      initialGrid,
      actionsPipeline,
      updatePipeline,
      renderPipeline,
    } = props;

    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.device = device;

    const actionsBindBufferLayout = actionsPipeline.getBindGroupLayout(0);
    const updateBindBufferLayout = updatePipeline.getBindGroupLayout(0);
    const renderBindBufferLayout = renderPipeline.getBindGroupLayout(0);

    this.buffer = this.createBuffer(initialGrid);

    this.actionBindGroup = this.createBindGroup([this.buffer], actionsBindBufferLayout);
    this.updateBindGroup = this.createBindGroup([this.buffer], updateBindBufferLayout);
    this.renderBindGroup = this.createBindGroup([this.buffer], renderBindBufferLayout);
  }

  private createBuffer(initialGrid?: Uint8Array): GPUBuffer {
    const gpuBuffer = this.device.createBuffer({
      mappedAtCreation: Boolean(initialGrid),
      size: this.width * this.height * this.cellSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    if (initialGrid) {
      const arrayBuffer = gpuBuffer.getMappedRange();
      new Uint8Array(arrayBuffer).set(initialGrid);
      gpuBuffer.unmap();
    }
    return gpuBuffer;
  }

  private createBindGroup(buffers: GPUBuffer[], layout: GPUBindGroupLayout): GPUBindGroup {
    return this.device.createBindGroup({
      layout,
      entries: buffers.map((buffer, i) => ({
        binding: i,
        resource: { buffer },
      })),
    });
  }

  createResultBuffer(commandEncoder: GPUCommandEncoder): GPUBuffer {
    const resultBuffer = this.device.createBuffer({
      size: this.bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    commandEncoder.copyBufferToBuffer(
      this.buffer,
      0,
      resultBuffer,
      0,
      this.bufferSize,
    );
    return resultBuffer;
  }

  get bufferSize(): number {
    return this.width * this.height * this.cellSize;
  }
}

export default GridBuffersData;
