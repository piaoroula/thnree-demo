import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
var css2DRender = new CSS2DRenderer();
var windowWidth = document.documentElement.clientWidth;
var windowHeight = document.documentElement.clientHeight;
css2DRender.setSize(windowWidth, windowHeight);
css2DRender.domElement.style.position = "absolute";
css2DRender.domElement.style.top = 0;
//设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
css2DRender.domElement.style.pointerEvents = "none";
export { css2DRender };
//this.container.appendChild(this.css2DRender.domElement);
