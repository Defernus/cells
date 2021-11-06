
<script lang="ts">
  import { onMount } from "svelte";
  import createGridComputeShader from "shaders/grid.compute";
  import createGridVertexShader from "shaders/grid.vertex";
  import Frame from "utils/gpu/Frame";
  import createGridFragmentShader from "shaders/grid.fragment";

  export let width: number;
  export let height: number;

  let canvas: HTMLCanvasElement;
  let ctx: GPUCanvasContext;
  let device: GPUDevice;
  let frame: Frame;
  let computePipeline: GPUComputePipeline;
  let renderPipeline: GPURenderPipeline;

  const update = async () => {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();

    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, frame.computeBindGroup);
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
    passEncoder.setBindGroup(0, frame.renderBindGroup);
    passEncoder.draw(6, 1, 0, 0);
    passEncoder.endPass();

    device.queue.submit([commandEncoder.finish()]);
  };

  const processFrame = async () => {
    await update();
    await render();
    frame.swapBuffer();
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
    initialGrid[0] = 255;
    initialGrid[width + 1] = 255;
    initialGrid[width + 2] = 255;
    initialGrid[width * 2 + 0] = 255;
    initialGrid[width * 2 + 1] = 255;

    computePipeline = device.createComputePipeline({
      compute: {
        module: createGridComputeShader({ device, width, height }),
        entryPoint: "main",
      }
    });

    renderPipeline = device.createRenderPipeline({
      vertex: {
        module: device.createShaderModule({
          code: createGridVertexShader({ width, height }),
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

    frame = new Frame({
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
  .wrapper {
    position: relative;
  }
</style>

<div class="wrapper">
  <canvas bind:this={canvas} width={width} height={height} />
</div>
