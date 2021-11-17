<template>
  <div id="container"></div>
</template>

<script>
import * as THREE from "three";
import sceneObj from "@/three/scene/index.js";

let texture;
let clock = new THREE.Clock();
export default {
  data() {
    return {
      /**场景 */
      scene: sceneObj.scene,
      /**相机 */
      camera: sceneObj.camera,
      /**渲染 */
      renderer: sceneObj.renderer,
      /**控制器 */
      controls: sceneObj.controls,
      /**射线投射器 */
      raycaster: null,
      container: null, //容器
      torusKnot: sceneObj.torusKnot,
    };
  },
  created() {
    // this.createBox();
  },
  mounted() {
    this.initRenderer();
    this.animate();
  },
  methods: {
    initRenderer() {
      this.container = document.getElementById("container");
      this.container.appendChild(this.renderer.domElement);
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.controls.update();
      this.render();
    },
    //渲染函数
    render() {
      const delta = clock.getDelta();
      console.log(this.torusKnot);
      this.torusKnot.rotation.x += delta;
      this.torusKnot.rotation.y += delta * 0.5;
      this.renderer.render(this.scene, this.camera);
    },
  },
};
</script>

<style scoped>
#container {
  width: 100%;
  height: 100%;
}
</style>
