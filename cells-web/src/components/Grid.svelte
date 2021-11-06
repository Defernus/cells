
<script lang="ts">
  import { onMount } from "svelte";
  import createGridActionsShader from "shaders/grid.actions";
  import createGridUpdateShader from "shaders/grid.update";
  import createGridVertexShader from "shaders/grid.vertex";
  import createGridFragmentShader from "shaders/grid.fragment";
  import GridBuffersData from "utils/gpu/GridBuffersData";
  import { CELL_GEN_MOVE, CELL_GEN_ROTATE_RIGHT_1, CELL_SIZE, CELL_VARIANT_LIFE } from "constants/cell";
  import setCell from "utils/calls/setCell";
  import { createCell } from "utils/calls/Cell";

  export let width: number;
  export let height: number;

  let canvas: HTMLCanvasElement;
  let ctx: GPUCanvasContext;
  let device: GPUDevice;
  let gridGpuData: GridBuffersData;
  let actionsPipeline: GPUComputePipeline;
  let updatePipeline: GPUComputePipeline;
  let renderPipeline: GPURenderPipeline;

  const update = async () => {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(actionsPipeline);
    passEncoder.setBindGroup(0, gridGpuData.actionBindGroup);
    passEncoder.dispatch(Math.ceil(width / 8), Math.ceil(height / 8));

    passEncoder.setPipeline(updatePipeline);
    passEncoder.setBindGroup(0, gridGpuData.updateBindGroup);
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

  const processFrame = () => {
    requestAnimationFrame(async () => {
      await update();
      await render();
    });
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

    const initialGrid = new Uint8Array(width * height * CELL_SIZE);

    const moovingCell = createCell({ variant: CELL_VARIANT_LIFE, genes: [CELL_GEN_MOVE, CELL_GEN_ROTATE_RIGHT_1] });
    const staticCell = createCell({ variant: CELL_VARIANT_LIFE });

    setCell(initialGrid, moovingCell, { x: 1, y: 1 }, { x: width, y: height });
    setCell(initialGrid, staticCell, { x: 4, y: 1 }, { x: width, y: height });

    actionsPipeline = device.createComputePipeline({
      compute: {
        module: createGridActionsShader({ device, width, height }),
        entryPoint: "main",
      }
    });
    updatePipeline = device.createComputePipeline({
      compute: {
        module: createGridUpdateShader({ device, width, height }),
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
      actionsPipeline,
      updatePipeline,
      renderPipeline,
      cellSize: CELL_SIZE,
    });
  });
</script>

<style>
  .grid {
    image-rendering: pixelated;
    transform: scale(32);
    transform-origin: top left;
  }
</style>

<div>
  <button on:click={processFrame}>update</button>
  <canvas class="grid" bind:this={canvas} width={width} height={height} />
</div>
