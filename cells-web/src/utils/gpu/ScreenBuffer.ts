interface ScreenBufferProps {
  width: number;
  height: number;
  device: GPUDevice;
}

class ScreenBuffer {
  gpuBuffer: GPUBuffer;
  arrayBuffer: ArrayBuffer;
  width: number;
  height: number;
  device: GPUDevice;

  constructor (props: ScreenBufferProps) {
    const { width, height, device } = props;
    this.width = width;
    this.height = height;
    this.device = device;

    this.gpuBuffer = device.createBuffer({
      size: width * height * Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });
  }
}

export default ScreenBuffer;
