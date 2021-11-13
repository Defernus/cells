
<script lang="ts">
  import { onMount } from "svelte";
  import createGridActionsShader from "shaders/grid.actions.wgsl";
  import createGridUpdateShader from "shaders/grid.update.wgsl";
  import createGridVertexShader from "shaders/grid.vertex.wgsl";
  import createGridFragmentShader from "shaders/grid.fragment.wgsl";
  import GridBuffersData from "utils/gpu/GridBuffersData";
  import {
    CELL_GEN_END,
    CELL_GEN_GOTO,
    CELL_GEN_MOVE,
    CELL_SIZE,
    CELL_VARIANT_LIFE,
    CELL_VARIANT_WALL,
  } from "constants/cell";
  import Cell from "utils/cells/Cell";
  import Magnifier from "components/Magnifier.svelte";
  import type MouseData from "utils/mouseData";

  export let width: number;
  export let height: number;

  let canvas: HTMLCanvasElement;
  let ctx: GPUCanvasContext;
  let device: GPUDevice;
  let adapter: GPUAdapter;
  let gridGpuData: GridBuffersData;
  let actionsPipeline: GPUComputePipeline;
  let updatePipeline: GPUComputePipeline;
  let renderPipeline: GPURenderPipeline;
  let isSimpulationRunning = false;
  let resultBuffer: GPUBuffer;

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

    commandEncoder.copyBufferToBuffer(
      gridGpuData.buffer,
      0,
      resultBuffer,
      0,
      gridGpuData.bufferSize,
    );

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
      if (isSimpulationRunning) {
        processFrame();
      }
    });
  };

  const start = () => {
    isSimpulationRunning = true;
    processFrame();
  };

  const stop = () => {
    isSimpulationRunning = false;
  };

  onMount(async () => {
    const scale = (window.innerHeight - 100) / height;
    canvas.style.transform = `scale(${scale})`;
    window.onkeypress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSimpulationRunning ? stop() : start();
        e.preventDefault();
      }
      if (e.code === "KeyX") {
        processFrame();
        e.preventDefault();
      }
    };
    adapter = await navigator.gpu?.requestAdapter();
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

    const plantCell = new Cell().setValues({
      variant: CELL_VARIANT_LIFE,
      genes: [CELL_GEN_END, CELL_GEN_GOTO, 0, 0, CELL_GEN_MOVE, CELL_GEN_END, CELL_GEN_END, CELL_GEN_END, CELL_GEN_END, CELL_GEN_END],
      stamina: 120,
      direction: 3,
    });

    const wallCell = new Cell().setValues({
      variant: CELL_VARIANT_WALL,
    });

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);

    plantCell.putToGrid(initialGrid, centerX - 5, centerY, width);

    for (let i = 0; i != 10; ++i) {
      wallCell.putToGrid(initialGrid, centerX, centerY + i - 5, width);
    }

    const actionsLayout = device.createPipelineLayout({
      bindGroupLayouts: [device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "storage"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "storage"
            }
          },
        ]
      })],
    });

    const updateLayout = device.createPipelineLayout({
      bindGroupLayouts: [device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
              type: "storage"
            }
          },
          {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage" },
          },
        ],
      })],
    });

    const renderLayout = device.createPipelineLayout({
      bindGroupLayouts: [device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" },
          },
        ],
      })],
    });

    actionsPipeline = device.createComputePipeline({
      layout: actionsLayout,
      compute: {
        module: createGridActionsShader({ device, width, height }),
        entryPoint: "main",
      }
    });
    updatePipeline = device.createComputePipeline({
      layout: updateLayout,
      compute: {
        module: createGridUpdateShader({ device, width, height }),
        entryPoint: "main",
      }
    });

    renderPipeline = device.createRenderPipeline({
      layout: renderLayout,
      vertex: {
        module: createGridVertexShader({ device }),
        entryPoint: "main",
      },
      fragment: {
        module: createGridFragmentShader({ device, width, height }),
        entryPoint: "main",
        targets: [{ format: presentationFormat }],
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

    });

    resultBuffer = device.createBuffer({
      size: gridGpuData.bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    processFrame();
  });

  const handleGridClick = async ({ x, y }: MouseData) => {
    if (isSimpulationRunning) {
      return;
    }
    const cellOffset = (x + y * width) * CELL_SIZE;
    
    await resultBuffer.mapAsync(GPUMapMode.READ);
    const cellData = new Uint8Array(resultBuffer.getMappedRange(cellOffset, CELL_SIZE));
    console.log("\n\ncell at", x, y);
    new Cell(cellData).log();

    resultBuffer.unmap();
  }
</script>

<style>
  .gridWrapper {
    position: relative;
  }

  .grid {
    image-rendering: pixelated;
    transform-origin: top left;
    /* https://stackoverflow.com/questions/69867152/how-to-disable-filtering-on-canvas-with-webgpu-context */
    animation: fix-image-rendering-bug .0001s;
  }
  @keyframes fix-image-rendering-bug {
    from {
      opacity: 0.9999;
    }
    to {
      opacity: 1;
    }
  }
</style>

<div>
  <div>
    {#if isSimpulationRunning}
      <button on:click={stop}>stop</button>
    {/if}
    {#if !isSimpulationRunning}
      <button on:click={start}>start</button>
      <button on:click={processFrame}>update</button>
    {/if}
  </div>
  <div class="gridWrapper">
    <canvas
      class="grid"
      bind:this={canvas}
      width={width}
      height={height}
    />
    <Magnifier
      device={device}
      adapter={adapter}
      width={width}
      height={height}
      gridCanvas={canvas}
      onClick={handleGridClick}
      gridGpuData={gridGpuData}
    />
  </div>
</div>
