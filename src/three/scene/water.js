import * as THREE from "three";
import { scene } from "./scene.js"; //Three.js三维场景
import { Water } from "three/examples/jsm/objects/Water2.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
//water
let water = null;
const params = {
  color: "#0290f2",
  scale: 1,
  flowX: 1,
  flowY: 1,
};
const waterGeometry = new THREE.PlaneGeometry(20, 20);

water = new Water(waterGeometry, {
  color: params.color,
  scale: params.scale,
  flowDirection: new THREE.Vector2(params.flowX, params.flowY),
  textureWidth: 1024,
  textureHeight: 1024,
});

water.position.y = 1;
water.rotation.x = Math.PI * -0.5;
console.log(Water);
//scene.add(water);

// skybox

const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath("/textures/skyboxsun/");

const cubeTexture = cubeTextureLoader.load([
  "px.jpg",
  "nx.jpg",
  "py.jpg",
  "ny.jpg",
  "pz.jpg",
  "nz.jpg",
]);

//scene.background = cubeTexture;

//mesh
const torusKnotGeometry = new THREE.TorusKnotGeometry(3, 1, 256, 32);
const torusKnotMaterial = new THREE.MeshNormalMaterial();

const torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
torusKnot.position.y = 4;
torusKnot.scale.set(0.5, 0.5, 0.5);
//scene.add(torusKnot);

//ground
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.8,
  metalness: 0.4,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI * -0.5;
//scene.add(ground);

const textureLoader = new THREE.TextureLoader();
textureLoader.load("/textures/hardwood2_diffuse.jpg", function(map) {
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  map.repeat.set(4, 4);
  groundMaterial.map = map;
  groundMaterial.needsUpdate = true;
});

// dat.gui

// const gui = new GUI();

// gui.addColor(params, "color").onChange(function(value) {
//   water.material.uniforms["color"].value.set(value);
// });
// gui.add(params, "scale", 1, 10).onChange(function(value) {
//   water.material.uniforms["config"].value.w = value;
// });
// gui
//   .add(params, "flowX", -1, 1)
//   .step(0.01)
//   .onChange(function(value) {
//     water.material.uniforms["flowDirection"].value.x = value;
//     water.material.uniforms["flowDirection"].value.normalize();
//   });
// gui
//   .add(params, "flowY", -1, 1)
//   .step(0.01)
//   .onChange(function(value) {
//     water.material.uniforms["flowDirection"].value.y = value;
//     water.material.uniforms["flowDirection"].value.normalize();
//   });

// gui.open();

export { torusKnot };
