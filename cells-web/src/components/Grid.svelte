
<script lang="ts">
  import { onMount } from "svelte";
  import createGridComputeShader from "shaders/grid.compute";
  import createGridVertexShader from "shaders/grid.vertex";
  import createGridFragmentShader from "shaders/grid.fragment";
  import spawnCells from "utils/gpu/spawnCells";
  import GridBuffersData from "utils/gpu/GridBuffersData";

  export let width: number;
  export let height: number;

  let canvas: HTMLCanvasElement;
  let ctx: GPUCanvasContext;
  let device: GPUDevice;
  let gridGpuData: GridBuffersData;
  let computePipeline: GPUComputePipeline;
  let renderPipeline: GPURenderPipeline;

  const update = async () => {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, gridGpuData.computeBindGroup);
    passEncoder.dispatch(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.endPass();

    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);
  };

  const render = async () => {
    const commandEncoder = device.createCommandEncoder();
    const textureView = ctx.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: 'store',
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, gridGpuData.renderBindGroup);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.endPass();

    device.queue.submit([commandEncoder.finish()]);
  };

  const processFrame = async () => {
    await update();
    await render();
    gridGpuData.swapBuffer();
    requestAnimationFrame(processFrame);
  }

  onMount(async () => {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) {
      // !TODO error handling
      throw new Error("failed to get webGPU adapter");
    }
    device = await adapter.requestDevice();

    ctx = canvas.getContext("webgpu");
    const presentationFormat = ctx.getPreferredFormat(adapter);
    ctx.configure({
        device,
        format: presentationFormat,
        // !TODO handle device pixel ratio
        size: [width, height],
    });

    const initialGrid = new Uint32Array(width * height);

    spawnCells({
      cell: 255,
      x: 256,
      y: 256,
      width,
      height,
      r: 32,
      density: 0.5,
      grid: initialGrid,
    });

    computePipeline = device.createComputePipeline({
      compute: {
        module: createGridComputeShader({ device, width, height }),
        entryPoint: "main",
      }
    });

    renderPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: createGridVertexShader(),
        }),
        entryPoint: "main",
      },
      fragment: {
        module: device.createShaderModule({
          code: createGridFragmentShader({ width, height }),
        }),
        entryPoint: "main",
        targets: [
          {
            format: presentationFormat,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    gridGpuData = new GridBuffersData({
      width,
      height,
      device,
      initialGrid,
      computePipeline,
      renderPipeline,
    });

    processFrame();
  });
</script>

<style>
  .grid {
    image-rendering: optimizeSpeed;
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
    -ms-interpolation-mode: nearest-neighbor;
    transform: scale(2);
    transform-origin: top left;
  }
</style>

<canvas class="grid" bind:this={canvas} width={width} height={height} />
