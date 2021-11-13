<script lang="ts">
  import type GridBuffersData from "utils/gpu/GridBuffersData";
  import type MouseData from "utils/mouseData";
  import createGridFragmentShader from "shaders/grid.fragment.wgsl";
  import createGridVertexShader from "shaders/grid.vertex.wgsl";

  export let adapter: GPUAdapter;
  export let device: GPUDevice;
  export let gridCanvas: HTMLCanvasElement;
  export let width: number;
  export let height: number;
  export let onClick: (props: MouseData) => void;
  export let gridGpuData: GridBuffersData;

  const WIDTH_PX = 128;
  const HEIGHT_PX = 128;
  const SIZE = 7;
  const PIXEL_SCALE = WIDTH_PX / SIZE;

  let wrapper: HTMLDivElement;
  let magnifierContainer: HTMLDivElement;
  let selector: HTMLDivElement;
  let magnifierCanvas: HTMLCanvasElement;

  let ctx: GPUCanvasContext;
  let renderPipeline: GPURenderPipeline;

  let pixelX: number = 0;
  let pixelY: number = 0;

  const render = () => {
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

    requestAnimationFrame(render);
  } 

  const getMouseData = (e: MouseEvent): MouseData => {
    const target = e.target as HTMLElement;
    const bb = target.getBoundingClientRect();
    const posX = e.pageX - Math.floor(bb.x) + 1;
    const posY = e.pageY - Math.floor(bb.y);
    const u = posX / bb.width;
    const v = posY / bb.height;
    let x = Math.floor(u * width - 0.5);
    let y = Math.floor(v * height - 0.5);
    x = x < 0 ? 0 : x;
    y = y < 0 ? 0 : y;

    return {
      x,
      y: height - y - 1,
      u,
      v,
      posX,
      posY,
    };
  }

  const handleMouseMove = (e: MouseEvent) => {
    const { posX, posY, x, y } = getMouseData(e);
    pixelX = x;
    pixelY = y;
    wrapper.style.left = `${posX + 30}px`;
    wrapper.style.top = `${posY - 20 - WIDTH_PX/2}px`;

    magnifierCanvas.style.transform = `scale(${PIXEL_SCALE})`;
    magnifierCanvas.style.left = `${-(x - SIZE/2 + 0.5) * PIXEL_SCALE}px`;
    magnifierCanvas.style.top = `${(y + SIZE/2 - height + 0.5) * PIXEL_SCALE}px`;
  };

  const hendleMouseLeave = () => {
    wrapper.style.display = "none";
  };

  const hendleMouseEnter = () => {
    wrapper.style.display = "block";
  };

  const handleClick = (e: MouseEvent) => {
    onClick(getMouseData(e));
  };
  
  const registerMouseEvent = async () => {
    gridCanvas.addEventListener("mousedown", handleClick);
    gridCanvas.addEventListener("mousemove", handleMouseMove);
    gridCanvas.addEventListener("mouseleave", hendleMouseLeave);
    gridCanvas.addEventListener("mouseenter", hendleMouseEnter);
  }

  $:gridCanvas && registerMouseEvent();

  const handleMount = async () => {
    selector.style.width = `${PIXEL_SCALE}px`;
    selector.style.height = `${PIXEL_SCALE}px`;
    magnifierContainer.style.width = `${WIDTH_PX}px`;
    magnifierContainer.style.height = `${HEIGHT_PX}px`;
    ctx = magnifierCanvas.getContext("webgpu");
    const presentationFormat = ctx.getPreferredFormat(adapter);
    ctx.configure({
        device,
        format: presentationFormat,
        // !TODO handle device pixel ratio
        size: [width, height],
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

    render();
  };

  $: device && adapter && handleMount();
</script>

<style>
  .wrapper {
    position: absolute;
    pointer-events: none;
  }

  .pos {
    padding-inline: 3px;
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    color: white;
    margin: 0;
    margin-bottom: 3px;
  }

  .magnifierContainer {
    position: relative;
    outline: 3px solid rgba(128, 128, 128, 0.5);
    overflow: hidden;
    background: black;
  }
  .magnifierCanvas {
    display: block;
    position: absolute;
    image-rendering: pixelated;
    transform-origin: top left;
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

  .selector {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 3px solid rgba(255, 255, 255, 0.5);
  }
</style>

<div class="wrapper" bind:this={wrapper}>
  <div class="pos">{pixelX} {pixelY}</div>
  <div bind:this={magnifierContainer} class="magnifierContainer">
    <canvas
      class="magnifierCanvas"
      bind:this={magnifierCanvas}
      width={width}
      height={height}
    />
    <div class="selector" bind:this={selector} />
  </div>
</div>