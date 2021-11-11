import { CELL_SIZE } from "constants/cell";

interface ScreenBufferProps {
  width: number;
  height: number;
  device: GPUDevice;
  actionsPipeline: GPUComputePipeline;
  updatePipeline: GPUComputePipeline;
  renderPipeline: GPURenderPipeline;
  initialGrid?: Uint8Array;
}

class GridBuffersData {
  private width: number;
  private height: number;
  private device: GPUDevice;

  readonly buffer: GPUBuffer;
  readonly randomSeedsBuffer: GPUBuffer;
  readonly actionBindGroup: GPUBindGroup;
  readonly updateBindGroup: GPUBindGroup;
  readonly renderBindGroup: GPUBindGroup;

  constructor (props: ScreenBufferProps) {
    const {
      width,
      height,
      device,
      initialGrid,
      actionsPipeline,
      updatePipeline,
      renderPipeline,
    } = props;

    this.width = width;
    this.height = height;
    this.device = device;

    const actionsBindBufferLayout = actionsPipeline.getBindGroupLayout(0);
    const updateBindBufferLayout = updatePipeline.getBindGroupLayout(0);
    const renderBindBufferLayout = renderPipeline.getBindGroupLayout(0);

    const initialSeeds = new Uint32Array(width * height);
    initialSeeds.forEach((_, i) => {
      [initialSeeds[i]] = crypto.getRandomValues(new Uint32Array(1));
    });

    this.buffer = this.createBuffer(CELL_SIZE, initialGrid);
    this.randomSeedsBuffer = this.createBuffer(Uint32Array.BYTES_PER_ELEMENT, new Uint8Array(initialSeeds.buffer));

    this.actionBindGroup = this.createBindGroup([this.buffer, this.randomSeedsBuffer], actionsBindBufferLayout);
    this.updateBindGroup = this.createBindGroup([this.buffer, this.randomSeedsBuffer], updateBindBufferLayout);
    this.renderBindGroup = this.createBindGroup([this.buffer], renderBindBufferLayout);
  }

  private createBuffer(elementSize: number, initialGrid?: Uint8Array, ): GPUBuffer {
    const gpuBuffer = this.device.createBuffer({
      mappedAtCreation: Boolean(initialGrid),
      size: this.width * this.height * elementSize,
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

  get bufferSize(): number {
    return this.width * this.height * CELL_SIZE;
  }
  get randomSeedsBufferSize(): number {
    return this.width * this.height * Uint32Array.BYTES_PER_ELEMENT;
  }
}

export default GridBuffersData;
