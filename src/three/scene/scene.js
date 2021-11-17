import * as THREE from "three";
/**初始化场景 */
var scene = new THREE.Scene();
/*这里的光源需要是能生成阴影的光源。比如说是SpotLight、DirectinalLight或是其他一下有castShadow 属性的高级光源。
AmbientLight和PointLight则不能产生阴影。*/
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
ambientLight.intensity = 0.5; //光源的强度
scene.add(ambientLight);
// 添加光源
var spotLight = new THREE.SpotLight(0xffffff, 0.4);
spotLight.position.set(-1, 1, 1);
spotLight.castShadow = true;

//设置阴影分辨率
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.far = 20480;
scene.add(spotLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(-1, 1, 1);
//开启castShadow生成动态的投影
directionalLight.castShadow = true;

//设置阴影分辨率
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 20480;
scene.add(directionalLight);
export { scene };
