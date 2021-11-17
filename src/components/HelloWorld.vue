<template>
  <div id="demo">
    <!-- 标签展示 -->
    <!-- <div class="signInfo">
      <div class="line"></div>
      <div class="line2"></div>
      测试测试
    </div> -->
    <div id="messageTag" class="operation-card">
      <!-- <div class="box">
        <span class="card-text">开关：</span>
        <el-switch
          v-model="value"
          active-color="#0054B8"
          inactive-color="#3D3D3D"
          active-value="1"
          inactive-value="0"
          @click.stop="changeSwitch"
        >
        </el-switch>
      </div> -->
      <div class="box">
        <span class="card-text">开关阈值：</span>
        <el-slider
          style="display:flex;flex:1"
          v-model="sliderValue"
        ></el-slider>
      </div>
    </div>
    <div id="container"></div>
  </div>
</template>

<script>
import * as THREE from "three";
import {
  RenderPass,
  EffectComposer,
  ShaderPass,
  OutlinePass,
} from "three-outlinepass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import sceneObj from "@/three/scene/index.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
let texture;
let clock = new THREE.Clock();
export default {
  data() {
    return {
      isShow: true, //是否展示面板
      value: "0",
      sliderValue: 20,
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
      chooseMesh: null, //选中的模型
      css2DRender: sceneObj.css2DRender, //2D渲染器
      css3DRender: null, //3D渲染器
      granaryArr: [],
      angle: 0,
      infodetail: null,
      infodetailArry: [],
      positionArry: sceneObj.positionArry, //模型标签展示点位
      composer: null,
      renderPass: null,
      outlinePass: null,
      selectedObjects: [],
      outlineChooseMesh: null, //鼠标经过的模型，处理外圈边缘
      effectFXAA: null,
      loadedData: null,
      operationCard: null, //操作栏
      bengjiMesh: null, //泵机开关模型
    };
  },
  created() {
    // this.createBox();
  },
  mounted() {
    this.initRenderer();
    this.initRenderPass();
    this.animate();
    //this.onLoadObjModel();
    window.addEventListener("resize", this.onResize, false);
    this.container.addEventListener("click", this.onceChoose, false);
    //window.addEventListener("mousemove", this.mouseOverModel, false);
    //window.addEventListener("dblclick", this.dblChoose, false);
    this.onLoadFbxjModel();
  },
  methods: {
    //初始化渲染器
    initRenderer() {
      this.container = document.getElementById("container");
      this.container.appendChild(this.renderer.domElement);
      this.container.appendChild(this.css2DRender.domElement);
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.controls.update();
      this.render();
    },
    //渲染函数
    render() {
      const delta = clock.getDelta();
      //console.log(delta);
      var axis = new THREE.Vector3(0, 0, 0); //向量axis
      this.scene.rotateOnAxis(axis, delta); //绕axis轴旋转
      //   if (delta < 0.0166) {
      //     this.scene.rotateOnAxis(axis, delta); //绕axis轴旋转
      //   }
      this.renderer.render(this.scene, this.camera);
      this.css2DRender.render(this.scene, this.camera);
      this.composer.render();
    },
    onLoadObjModel() {
      var that = this;
      var manager = new THREE.LoadingManager();
      manager.addHandler(/\.tga$/i, new TGALoader());
      // var loader = new GLTFLoader(manager); //创建一个GLTF加载器
      var objLoader = new OBJLoader(); //创建一个obj加载器
      var mTLLoader = new MTLLoader(); //材质文件加载器
      mTLLoader.load("/model/bengji.mtl", function(materials) {
        console.log(materials);
        materials.preload();
        //obj的模型会和MaterialCreator包含的材质对应起来
        objLoader.setMaterials(materials);
        objLoader.load("/model/bengji.obj", function(obj) {
          console.log(obj);
          obj.position.set(0, -300, 0);
          //   console.log(111);
          obj.traverse(function(child) {
            if (child.isMesh) {
              //每个储位单独赋予一个基础材质,解决所有mesh用同一个材质的问题
              //假设产生报警
              if (child.name.indexOf("油桶_4") == 0) {
                that.outlineChooseMesh = child;
                that.addSelectedObject(child);
                that.outlinePass.selectedObjects = that.selectedObjects;
                // child.material = new THREE.MeshBasicMaterial({
                //   color: 0x00ff00,
                // });
                // child.material.map = texture;
              }
              if (child.name.includes("油桶")) {
                that.granaryArr.push(child);
              }
            }
          });
          that.positionArry.forEach((item) => {
            item.labelPosion.y = +300;
            var css2Dinfo = that.create2DObject(item);
            css2Dinfo.position.copy(item.labelPosion);
            that.scene.add(css2Dinfo);
          });

          that.scene.add(obj); //返回的组对象插入场景中
        });
      });
    },

    //加载fbx格式的文件
    onLoadFbxjModel() {
      var that = this;
      var manager = new THREE.LoadingManager();
      var fBXLoader = new FBXLoader(); //创建一个obj加载器
      fBXLoader.load("/model/bengji-kong.fbx", function(obj) {
        console.log(obj);
        obj.scale.set(0.01, 0.01, 0.01);
        obj.remove(obj.children[3]);
        window["groupaa"] = obj;
        // let maxPoint,
        //   minPoint = null;

        obj.traverse(function(child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            //每个储位单独赋予一个基础材质,解决所有mesh用同一个材质的问题
            //假设产生报警
            // child.geometry.computeBoundingBox();
            // const tempMax = child.geometry.boundingBox.max.applyMatrix4(
            //   child.matrixWorld
            // );
            // const tempMin = child.geometry.boundingBox.min.applyMatrix4(
            //   child.matrixWorld
            // );
            // if (minPoint == null) {
            //   maxPoint = tempMax;
            //   minPoint = tempMin;
            // } else {
            //   if (tempMax.x > maxPoint.x) {
            //     maxPoint.x = tempMax.x;
            //   }
            //   if (tempMax.y > maxPoint.y) {
            //     maxPoint.y = tempMax.y;
            //   }
            //   if (tempMax.z > maxPoint.z) {
            //     maxPoint.z = tempMax.z;
            //   }
            //   if (tempMin.x < minPoint.x) {
            //     maxPoint.x = tempMin.x;
            //   }
            //   if (tempMin.y < minPoint.y) {
            //     maxPoint.y = tempMin.y;
            //   }
            //   if (tempMin.z < minPoint.z) {
            //     maxPoint.z = tempMin.z;
            //   }
            // }

            if (child.name.indexOf("油桶_4") == 0) {
              that.outlineChooseMesh = child;
              that.addSelectedObject(child);
              that.outlinePass.selectedObjects = that.selectedObjects;
            }
            if (child.name.includes("开关")) {
              child.openStatus = 1;
              that.granaryArr.push(child);
            }
          }
        });

        // const temp = new THREE.Vector3(
        //   (maxPoint.x + minPoint.x) / 2,
        //   (maxPoint.y + minPoint.y) / 2,
        //   (maxPoint.z + minPoint.z) / 2
        // );
        // window["temp"] = temp;
        // that.controls.target.clone(temp);
        // window["tempp"] = that.controls;
        that.positionArry.forEach((item) => {
          var css2Dinfo = that.create2DObject(item);
          css2Dinfo.position.copy(item.labelPosion);
          that.scene.add(css2Dinfo);
        });
        that.scene.add(obj); //返回的组对象插入场景中
      });
    },

    //监听窗口大小
    onResize() {
      // 监听窗口大小改变
      this.camera.aspect = window.innerWidth / window.innerHeight; //宽高可根据实际项目要求更改 如果是窗口高度改为innerHeight
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight); //宽高可根据实际项目要求更改 如果是窗口高度改为innerHeight
      this.css2DRender.setSize(window.innerWidth, window.innerHeight);
    },

    //获取模型点位
    getClickPoint(event) {
      var that = this;
      console.log(2);
      if (that.chooseMesh) {
        // that.chooseMesh.material.transparent = false;
        // that.chooseMesh.material.color.set(0x09944a); // 把上次选中的mesh设置为原来的颜色
        //that.chooseMesh.material.opacity = 1;
      }
      var promise = new Promise(function(resolve, reject) {
        //做一些异步操作
        var Sx = event.clientX; //鼠标单击位置横坐标
        var Sy = event.clientY; //鼠标单击位置纵坐标
        //2D坐标转换3D坐标
        var x = (Sx / window.innerWidth) * 2 - 1; //WebGL标准设备横坐标
        var y = -(Sy / window.innerHeight) * 2 + 1; //WebGL标准设备纵坐标
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), that.camera);
        var intersects = raycaster.intersectObjects(that.granaryArr);
        resolve(intersects);
      });
      return promise;
    },
    //动态创建css2dobject
    create2DObject(obj) {
      var that = this;
      var div = document.createElement("div");
      div.classList.add("signInfo");
      div.style.position = "relative";
      div.style.width = "70px";
      div.style.height = "30px";
      div.style.lineHeight = "30px";
      div.style.textAlign = "center";
      div.style.color = "#ffffff";
      div.style.fontSize = "14px";
      div.style.boxShadow = "0 0 2.5vw #237ad4 inset";
      var html = `<div class="line" style="position: absolute;top: 50%;left: -40px;width: 40px;height: 1px;background: linear-gradient(#1359df, #1359df);">
                 </div>
                 <div class="line2" style="position: absolute;top: 12px;left: -57px;width: 1px;height: 100px;background: linear-gradient(#1359df, #1359df);transform: rotate(20deg);"></div>
                 <span>${obj.name}</span>`;

      div.innerHTML = html;
      const infoLabel = new CSS2DObject(div);
      that.scene.add(infoLabel);
      return infoLabel;
    },
    //手动创建
    createHandel2DObject() {
      var that = this;
      var dom = document.getElementById("messageTag");
      //dom元素包装为CSS2模型对象CSS2DObject
      var info = new CSS2DObject(dom);
      // dom.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
      that.scene.add(info);
      return info; //返回CSS2模型标签
    },
    //单机事件
    onceChoose(event) {
      var that = this;
      console.log(that.camera.position);
      that.getClickPoint(event).then((intersects) => {
        console.log(intersects);
        if (intersects.length > 0) {
          //that.isShow = true;
          that.chooseMesh = intersects[0].object;
          //that.chooseMesh.material.opacity = 0.5;
          that.chooseMesh.material.color.set(0x83e272); //选中的模型的颜色
          that.bengjiMesh = intersects[0].object; //泵机泵机开关
          let text = that.chooseMesh.openStatus == 0 ? "打开" : "关闭";
          that
            .$confirm(`是否要${text}’${that.chooseMesh.name}‘开关`, "提示", {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              type: "warning",
            })
            .then(() => {
              if (that.chooseMesh.openStatus == 1) {
                that.chooseMesh.openStatus = 0;
                that.chooseMesh.material.color.set(0x3d3d3d); //关闭开关
              } else {
                that.chooseMesh.openStatus = 1;
                that.chooseMesh.material.color.set(0x09944a); //打开开关
              }
            })
            .catch(() => {
              if (that.chooseMesh.openStatus == 0) {
                that.chooseMesh.material.color.set(0x3d3d3d); //关闭开关
              } else {
                that.chooseMesh.material.color.set(0x09944a); //打开开关
              }
              console.log("取消");
            });
          //   that.operationCard = that.createHandel2DObject();
          //   that.operationCard.element.style.visibility = "visible"; //显示标签
          //   that.operationCard.position.copy(intersects[0].point);
        } else {
          //that.isShow = false;
          that.chooseMesh = null;
        }
      });
    },
    //单机事件
    onceChoose1(event) {
      var that = this;
      that.getClickPoint(event).then((intersects) => {
        console.log(intersects);
        if (intersects.length > 0) {
          that.chooseMesh = intersects[0].object;
          that.chooseMesh.material.transparent = true;
          that.chooseMesh.material.opacity = 0.5;
          that.chooseMesh.material.color.set(0xcc9f3f57);
        } else {
          that.chooseMesh = null;
        }
      });
    },
    //鼠标双击事件
    dblChoose(event) {
      var that = this;
      event.preventDefault();
      if (event.isPrimary === false) return;
      that.getClickPoint(event).then((intersects) => {
        if (intersects.length > 0) {
          that.outlineChooseMesh = intersects[0].object;
          that.addSelectedObject(that.outlineChooseMesh);
          that.outlinePass.selectedObjects = that.selectedObjects;
        } else {
          that.outlinePass.selectedObjects = [];
          that.outlineChooseMesh = null;
        }
      });
    },
    //鼠标经过事件
    mouseOverModel(event) {
      var that = this;
      event.preventDefault();
      if (event.isPrimary === false) return;
      that.getClickPoint(event).then((intersects) => {
        if (intersects.length > 0) {
          that.outlineChooseMesh = intersects[0].object;
          that.addSelectedObject(that.outlineChooseMesh);
          that.outlinePass.selectedObjects = that.selectedObjects;
        } else {
          that.outlinePass.selectedObjects = [];
          that.outlineChooseMesh = null;
        }
      });
    },
    addSelectedObject(object) {
      this.selectedObjects = [];
      this.selectedObjects.push(object);
    },
    //鼠标移上去外边发光通道
    initRenderPass() {
      this.composer = new EffectComposer(this.renderer);
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(this.renderPass);
      this.outlinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.scene,
        this.camera
      );
      this.outlinePass.renderToScreen = true;
      this.outlinePass.edgeStrength = 3; //粗
      this.outlinePass.edgeGlow = 2; //发光
      this.outlinePass.edgeThickness = 2; //光晕粗
      this.outlinePass.pulsePeriod = 2; //闪烁
      this.outlinePass.usePatternTexture = false; //是否使用贴图
      this.outlinePass.visibleEdgeColor.set("#de0606"); // 设置显示的颜色
      this.outlinePass.hiddenEdgeColor.set("#de0606"); // 设置隐藏的颜色
      this.composer.addPass(this.outlinePass);
      this.effectFXAA = new ShaderPass(FXAAShader);
      this.effectFXAA.uniforms["resolution"].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
      this.composer.addPass(this.effectFXAA);
    },
    //点击switch
    changeSwitch() {
      var that = this;
      if (that.bengjiMesh) {
        that.bengjiMesh.material.color.set(0x4df706); //选中的模型的颜色
      }
    },
  },
};
</script>

<style scoped>
#demo {
  width: 100%;
  height: 100%;
  position: relative;
}
#container {
  width: 100%;
  height: 100%;
}
.signInfo {
  position: relative;
  top: 0;
  left: 100px;
}
.signInfo {
  position: relative;
  top: 0;
  width: 150px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  color: #ffffff;
  font-size: 15px;
  box-shadow: 0 0 2.5vw #237ad4 inset;
  background: linear-gradient(#1359df, #1359df) left top,
    linear-gradient(#1359df, #1359df) left top,
    linear-gradient(#1359df, #1359df) right top,
    linear-gradient(#1359df, #1359df) right top,
    linear-gradient(#1359df, #1359df) left bottom,
    linear-gradient(#1359df, #1359df) left bottom,
    linear-gradient(#1359df, #1359df) right bottom,
    linear-gradient(#1359df, #1359df) right bottom;
  background-repeat: no-repeat;
  background-size: 0.1vw 18vw, 1.5vw 0.1vw;
}
/* .signInfo:before {
  position: absolute;
  top: 50%;
  left: -50px;
  content: "";
  width: 50px;
  height: 1px;
  background: linear-gradient(#1359df, #1359df);
} */

/* .signInfo:after {
  position: absolute;
  top: 25px;
  left: -50px;
  content: "";
  width: 1px;
  height: 100px;
  background: linear-gradient(#1359df, #1359df);
  transform: rotate(20deg);
  transform-origin: left top;
  border-radius: 0px;
} */
.operation-card {
  width: 300px;
  position: absolute;
  top: 30px;
  left: 30px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #000000;
  box-shadow: 0px 0px 45px 0px rgba(0, 0, 0, 0.72);
  opacity: 0.7;
  border-radius: 10px;
  padding: 20px;
  z-index: 999;
}
.box {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 8px 0;
}
.card-text {
  color: #ffffff;
  font-size: 14px;
  padding-right: 12px;
}
</style>
