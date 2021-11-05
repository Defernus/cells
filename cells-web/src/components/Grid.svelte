
<script lang="ts">
  import { onMount } from "svelte";
  import createGridShader from "shaders/grid";
  import Frame from "utils/gpu/Frame";
  import logGrid from "utils/logGrid";

  export let width: number;
  export let height: number;

  let canvas: HTMLCanvasElement;
  let device: GPUDevice;
  let frame: Frame;
  let computePipeline: GPUComputePipeline;

  onMount(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      // !TODO error handling
      throw new Error("failed to get webGPU adapter");
    }
    device = await adapter.requestDevice();

    canvas.width = width;
    canvas.height = height;

    const initialGrid = new Uint32Array(width * height);
    initialGrid[0] = 255;
    initialGrid[1] = 255;
    initialGrid[2] = 255;

    const gridShader = createGridShader({
      device,
      width,
      height,
    });

    computePipeline = device.createComputePipeline({
      compute: {
        module: gridShader,
        entryPoint: "main"
      }
    });

    frame = new Frame({
      width,
      height,
      device,
      initialGrid,
      computePipeline,
    });


  });

  const update = async () => {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, frame.bindGroup);
    passEncoder.dispatch(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.endPass();

    const resultMatrixBufferSize = width * height * Uint32Array.BYTES_PER_ELEMENT;
    const gpuReadBuffer = device.createBuffer({
      size: resultMatrixBufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    commandEncoder.copyBufferToBuffer(
      frame.buffer,
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
    frame.swapBuffer();
    logGrid({ grid: new Uint32Array(arrayBuffer), width, height });
  };
</script>

<style>
  .wrapper {
    position: relative;
  }
</style>

<div class="wrapper">
  <canvas bind:this={canvas} class="view" width={width} height={height} />
  <button on:click={update}>update</button>
</div>
