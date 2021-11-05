
<script lang="ts">
  import { onMount } from "svelte";
  import createGridShader from "shaders/grid";
  import ScreenBuffer from "utils/gpu/ScreenBuffer";
import logGrid from "utils/logGrid";

  export let width: number;
  export let height: number;

  const INP_GRID_BUFFER_BINDING = 0;
  const OUT_GRID_BUFFER_BINDING = 1;

  let canvas: HTMLCanvasElement;
  let device: GPUDevice;
  let screenBuffers: [ScreenBuffer, ScreenBuffer] = [null, null];
  let bindGroupLayout: GPUBindGroupLayout;
  let bindGroup: GPUBindGroup;
  let currentScreenBuffer = 0;
  let secondBuffer = 1;

  $: secondBuffer = (currentScreenBuffer + 1) % 2;
  
  onMount(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      // !TODO error handling
      throw new Error("failed to get webGPU adapter");
    }
    device = await adapter.requestDevice();

    canvas.width = width;
    canvas.height = height;


    screenBuffers[0] = new ScreenBuffer({ width, height, device });
    screenBuffers[1] = new ScreenBuffer({ width, height, device });

    bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: INP_GRID_BUFFER_BINDING,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: OUT_GRID_BUFFER_BINDING,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: INP_GRID_BUFFER_BINDING,
          resource: { buffer: screenBuffers[0].gpuBuffer },
        },
        {
          binding: OUT_GRID_BUFFER_BINDING,
          resource: { buffer: screenBuffers[1].gpuBuffer },
        },
      ],
    });

    const gridShader = createGridShader({
      device,
      inpGridBufferBinding: INP_GRID_BUFFER_BINDING,
      width,
      height,
    });

    const gridComputePipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      compute: {
        module: gridShader,
        entryPoint: "main"
      }
    });

    const commandEncoder = device.createCommandEncoder();

    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(gridComputePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatch(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.endPass();


    const resultMatrixBufferSize = width * height * Uint32Array.BYTES_PER_ELEMENT;
    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
      size: resultMatrixBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Encode commands for copying buffer to buffer.
    commandEncoder.copyBufferToBuffer(
      screenBuffers[1].gpuBuffer,
      0,
      gpuReadBuffer,
      0,
      resultMatrixBufferSize,
    );

    // Submit GPU commands.
    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);

    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = gpuReadBuffer.getMappedRange();
    logGrid({ grid: new Uint32Array(arrayBuffer), width, height });
  });

</script>

<style>
  .wrapper {
    position: relative;
  }
</style>

<div class="wrapper">
  <canvas bind:this={canvas} class="view" width={width} height={height} />
</div>
