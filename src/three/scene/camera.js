import * as THREE from "three";
import { scene } from "./scene.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
var windowWidth = document.documentElement.clientWidth;
var windowHeight = document.documentElement.clientHeight;
var k = windowWidth / windowHeight; //窗口宽高比
// var s = 150; //三维场景显示范围控制系数，系数越大，显示的范围越大
// //创建相机对象
// that.camera = new Three.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
// that.camera.position.set(200, 300, 200); //设置相机位置
var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);
//camera.position.set(-1128.6131415708057, 611.4451515789438, 63.14718684673582);//油桶的相机位置
camera.position.set(-8.72770085330852, 4.898799138403542, -5.676075578985133); //泵机的相机位置
camera.lookAt(0, 0, 0); // 相机默认看的方向是：Z轴的正半轴到Z轴的负半轴, 设置的点就是相机看向的角度
camera.up.set(0, 1, 0); // 设置的相机的竖轴的方向：即Y设置的为正, 则y轴朝上, z轴点的坐标为正, 则设置的z轴朝上
// var axesHelper2 = new THREE.AxesHelper(11113);
// axesHelper2.position.set(0, 0, 0);
// scene.add(axesHelper2);
/**
 * 创建渲染器对象
 */
var renderer = new THREE.WebGLRenderer({
  antialias: true, //开启通道
  alpha: true,
});
renderer.shadowMap.enabled = true; //开启阴影渲染器
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(windowWidth, windowHeight); //宽高可根据实际项目要求更改 如果是窗口高度改为innerHeight
renderer.setClearColor(0x4c545a, 0.9); //设置背景色

//创建控件对象  控件可以监听鼠标的变化，改变相机对象的属性
// 旋转：拖动鼠标左键
// 缩放：滚动鼠标中键
// 平移：拖动鼠标右键
var controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0, 0);
// 视角最小距离
//controls.minDistance = 50;
// 视角最远距离
//controls.maxDistance = 50;
// 最大角度
//controls.maxPolarAngle = Math.PI / 4;
//是否开启右键拖拽
//controls.enablePan = true;
// console.log(controlsRadius)
export { renderer, camera, controls, windowWidth, windowHeight };
