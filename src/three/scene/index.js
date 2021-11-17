import { scene } from "./scene.js";
import { renderer, camera, controls } from "./camera.js";
import { css2DRender } from "./css2DRender.js";
import { positionArry } from "./position.js";
import { torusKnot } from "./water.js";
let sceneObj = {
  scene,
  renderer,
  camera,
  //torusKnot,
  controls,
  css2DRender,
  positionArry,
};
export default sceneObj;
