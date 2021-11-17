import * as THREE from "three";
/**初始化场景 */
var scene = new THREE.Scene();
/*这里的光源需要是能生成阴影的光源。比如说是SpotLight、DirectinalLight或是其他一下有castShadow 属性的高级光源。
AmbientLight和PointLight则不能产生阴影。*/

//hemiLight环境光
var hemiLight = new THREE.HemisphereLight(0xffffff, 0.6);
hemiLight.intensity = 0.5; //光源的强度
hemiLight.position.set(0, 100, 0); //这个也是默认位置
scene.add(hemiLight);

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
// ambientLight.intensity = 0.5; //光源的强度
// scene.add(ambientLight);
// 添加光源、聚光灯源
// var spotLight = new THREE.SpotLight(0xffffff, 0.4);
// spotLight.position.set(-1, 1, 1);
// spotLight.castShadow = true;

// //设置阴影分辨率
// spotLight.shadow.mapSize.width = 2048;
// spotLight.shadow.mapSize.height = 2048;
// spotLight.shadow.camera.far = 20480;
// scene.add(spotLight);

var target = new THREE.Object3D();
target.position.set(0, 0, 0);
scene.add(target);

//点光源
// const pointLight = new THREE.PointLight(0xffffff);
// pointLight.position.set(0, 100, 0);
// //开启castShadow生成动态的投影
// pointLight.castShadow = true;

// //设置阴影分辨率
// pointLight.shadow.mapSize.width = 2048;
// pointLight.shadow.mapSize.height = 2048;
// pointLight.shadow.camera.far = 2048; //投影远点。表示到距离光源的哪一个位置可以生成阴影。默认值：5000
// // pointLight.target = target;
// scene.add(pointLight);

//平行光源
const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(-100, 100, 0);
//开启castShadow生成动态的投影
directionalLight.castShadow = true;

//设置阴影分辨率
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 2048; //投影远点。表示到距离光源的哪一个位置可以生成阴影。默认值：5000
directionalLight.target = target;
scene.add(directionalLight);

var helper = new THREE.CameraHelper(directionalLight.shadow.camera);
scene.add(helper);

export { scene };
