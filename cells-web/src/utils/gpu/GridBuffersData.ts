interface ScreenBufferProps {
  width: number;
  height: number;
  device: GPUDevice;
  computePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  initialGrid?: Uint8Array;
  cellSize: number;
}

class GridBuffersData {
  private width: number;
  private height: number;
  private cellSize: number;
  private device: GPUDevice;
  private computeBindGroups: [GPUBindGroup, GPUBindGroup] = [null, null];
  private renderBindGroups: [GPUBindGroup, GPUBindGroup] = [null, null];
  private buffers: [GPUBuffer, GPUBuffer] = [null, null];
  private computePipeline: GPUComputePipeline;
  private renderPipeline: GPURenderPipeline;
  private currentBindGroup = 0;

  constructor (props: ScreenBufferProps) {
    const {
      width,
      height,
      cellSize,
      device,
      initialGrid,
      computePipeline,
      renderPipeline,
    } = props;

    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.device = device;
    this.computePipeline = computePipeline;
    this.renderPipeline = renderPipeline;

    const computeBindBufferLayout = this.computePipeline.getBindGroupLayout(0);
    const renderBindBufferLayout = this.renderPipeline.getBindGroupLayout(0);

    this.buffers[0] = this.createBuffer(initialGrid);
    this.buffers[1] = this.createBuffer();

    this.computeBindGroups[0] = this.createBindGroup([this.buffers[0], this.buffers[1]], computeBindBufferLayout);
    this.computeBindGroups[1] = this.createBindGroup([this.buffers[1], this.buffers[0]], computeBindBufferLayout);

    this.renderBindGroups[0] = this.createBindGroup([this.buffers[1]], renderBindBufferLayout);
    this.renderBindGroups[1] = this.createBindGroup([this.buffers[0]], renderBindBufferLayout);
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

  swapBuffer(): void {
    this.currentBindGroup = (this.currentBindGroup + 1) % 2;
  }

  get computeBindGroup(): GPUBindGroup {
    return this.computeBindGroups[this.currentBindGroup];
  }

  get renderBindGroup(): GPUBindGroup {
    return this.renderBindGroups[this.currentBindGroup];
  }

  get buffer(): GPUBuffer {
    return this.buffers[(this.currentBindGroup + 1) % 2];
  }

  get bufferSize(): number {
    return this.width * this.height * this.cellSize;
  }
}

export default GridBuffersData;
