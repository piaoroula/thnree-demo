import {
  CSS3DRenderer,
  CSS3DObject,
  CSS3DSprite
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import * as THREE from "three";
import {
  windowWidth,
  windowHeight
} from './camera.js' //渲染器对象和相机对象
var css3DRender = new CSS3DRenderer();
css3DRender.setSize(windowWidth, windowHeight);
css3DRender.domElement.style.position = "absolute";
css3DRender.domElement.style.top = 0;
//设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
css3DRender.domElement.style.pointerEvents = "none";
export {
  css3DRender
}
