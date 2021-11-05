
<script lang="ts">
  import { onMount } from "svelte";
  import ScreenBuffer from "utils/ScreenBuffer";

  export let width: number;
  export let height: number;

  const FRAME_BUFFER_BINDING = 0;

  let canvas: HTMLCanvasElement;
  let device: GPUDevice;
  let screenBuffers: [ScreenBuffer, ScreenBuffer] = [null, null];
  let bindGroupLayout: GPUBindGroupLayout;
  let bindGroup: GPUBindGroup;
  let currentScreenBuffer = 0;
  
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
          binding: FRAME_BUFFER_BINDING,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: FRAME_BUFFER_BINDING,
          resource: { buffer: screenBuffers[currentScreenBuffer].gpuBuffer },
        }
      ]
    });
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
