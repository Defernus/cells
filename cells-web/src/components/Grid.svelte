
<script lang="ts">
  import { onMount } from "svelte";
  import createGridShader from "shaders/grid";
  import Frame from "utils/gpu/Frame";
  import logGrid from "utils/logGrid";

  export let width: number;
  export let height: number;

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

    const initialGrid = new Uint32Array(width * height);
    initialGrid[0] = 255;
    initialGrid[width + 1] = 255;
    initialGrid[width + 2] = 255;
    initialGrid[width * 2 + 0] = 255;
    initialGrid[width * 2 + 1] = 255;

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

    const resultBuffer = frame.createResultBuffer(commandEncoder);

    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);

    await resultBuffer.mapAsync(GPUMapMode.READ);
    const result = new Uint32Array(resultBuffer.getMappedRange());

    frame.swapBuffer();

    logGrid({ grid: result, width, height });
  };
</script>

<style>
  .wrapper {
    position: relative;
  }
</style>

<div class="wrapper">
  <button on:click={update}>update</button>
</div>
