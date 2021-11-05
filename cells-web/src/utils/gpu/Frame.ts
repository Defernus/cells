interface ScreenBufferProps {
  width: number;
  height: number;
  device: GPUDevice;
  computePipeline: GPUComputePipeline;
  initialGrid?: Uint32Array;
}

class Frame {
  private width: number;
  private height: number;
  private device: GPUDevice;
  private bindGroups: [GPUBindGroup, GPUBindGroup] = [null, null];
  private buffers: [GPUBuffer, GPUBuffer] = [null, null];
  private bindBufferLayout: GPUBindGroupLayout;
  private computePipeline: GPUComputePipeline;
  private currentBindGroup = 0;

  constructor (props: ScreenBufferProps) {
    const {
      width,
      height,
      device,
      initialGrid,
      computePipeline,
    } = props;

    this.width = width;
    this.height = height;
    this.device = device;
    this.computePipeline = computePipeline;
    this.bindBufferLayout = this.computePipeline.getBindGroupLayout(0);

    this.buffers[0] = this.createBuffer(initialGrid);
    this.buffers[1] = this.createBuffer();

    this.bindGroups[0] = this.createBindGroup([this.buffers[0], this.buffers[1]]);
    this.bindGroups[1] = this.createBindGroup([this.buffers[1], this.buffers[0]]);
  }

  private createBuffer(initialGrid?: Uint32Array): GPUBuffer {
    const gpuBuffer = this.device.createBuffer({
      mappedAtCreation: Boolean(initialGrid),
      size: this.width * this.height * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    if (initialGrid) {
      const arrayBuffer = gpuBuffer.getMappedRange();
      new Uint32Array(arrayBuffer).set(initialGrid);
      gpuBuffer.unmap();
    }
    return gpuBuffer;
  }

  private createBindGroup(buffers: [GPUBuffer, GPUBuffer]): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindBufferLayout,
      entries: [
        { binding: 0, resource: { buffer: buffers[0] } },
        { binding: 1, resource: { buffer: buffers[1] } },
      ],
    });
  }


  swapBuffer(): void {
    this.currentBindGroup = (this.currentBindGroup + 1) % 2;
  }

  get bindGroup(): GPUBindGroup {
    return this.bindGroups[this.currentBindGroup];
  }

  get buffer(): GPUBuffer {
    return this.buffers[(this.currentBindGroup + 1) % 2];
  }
}

export default Frame;
