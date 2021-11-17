import * as THREE from "three";
import {
  RenderPass,
  EffectComposer,
  ShaderPass,
  OutlinePass,
} from "three-outlinepass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { scene } from "./scene/index.js";
import { sceneObj } from "./index";
import { renderer, camera, controls, camToSave } from "./scene/camera.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import {
  CSS3DObject,
  CSS3DSprite,
  CSS3DRenderer,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import {
  CSS2DObject,
  CSS2DRenderer,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import screen from "@/api/screen/screen.js";
import * as TWEEN from "tween";
import { switchCase } from "@babel/types";

var threeModel = {
  data() {
    return {
      /**场景 */
      scene: null,
      /**相机 */
      camera: null,
      /**渲染 */
      renderer: null,
      /**控制器 */
      controls: null,
      /**射线投射器 */
      raycaster: null,
      /**鼠标 */
      mouse: null,
      /**屋顶 */
      roof: null,
      /**组 */
      group: null,
      requestId: null,
      /**渲染文字 */
      CSS2DRenderer: null,
      CSS3DRender: null,
      CSS3DObjects: [],
      CSS2DObjects: [],
      /**容器 */
      container: null,
      windowWidth: document.documentElement.clientWidth, //实时屏幕宽度
      windowHeight: document.documentElement.clientHeight, //实时屏幕高度
      granaryArr: [], //所有厂房的集合
      chooseMesh: null, //选中的模型
      infodetail: "", //详细信息面板
      infodetailArry: [],
      infoLabelList: [],
      tween: "",
      //infoBackImgUrl: require("@/assets/信息背景.png"),
      controlsRadius: "",
      value: true,
      value1: false,
      value2: true,
      value3: true,
      textValue: "全屏展示",
      mixer: null, //混合器
      clock: "",
      INTERSECTED: "",
      imgUrl: require("@/assets/screenModel/blue-box.png"),
      arrowIngUrl: require("@/assets/screenModel/blue-arrow.png"),
      selectedObjects: [],
      warnSelectedObjects: [],
      clickSelectedObjects: [],
      outlinePass: null, //鼠标移上去发光
      warnOutlinePass: null, //告警位置发光
      composer: null,
      effectFXAA: null,
      renderPass: null,
      clickLinePass: null,
    };
  },
  created() {},
  mounted() {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.init();
    this.initCSS2DRender();
    this.initCSS3DRender();
    this.initRenderPass();
    this.initMouseOverRenderPass();
    this.clickRenderPass();
    this.loadFbxBuild();
    this.animate();
    window.addEventListener("click", this.onceChoose, false);
    window.addEventListener("dblclick", this.dblChoose, false);
    window.addEventListener("mousemove", this.mouseOverModel, false);
    window.addEventListener("resize", this.onResize, false);
    this.resetCamera();
  },
  destroyed() {
    cancelAnimationFrame(this.requestId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    window.addEventListener("click", this.onceChoose, false);
    window.addEventListener("dblclick", this.dblChoose, false);
    window.addEventListener("mousemove", this.mouseOverModel, false);
    window.addEventListener("resize", this.onResize, false);
  },
  methods: {
    init() {
      this.group = new THREE.Group();
      this.initRenderer();
      // setInterval(() => {
      //   console.log(this.camera.position);
      // }, 2000)
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
      this.outlinePass.visibleEdgeColor.set("#FFE242"); // 设置显示的颜色
      this.outlinePass.hiddenEdgeColor.set("#FFE242"); // 设置隐藏的颜色
      this.composer.addPass(this.outlinePass);
      this.effectFXAA = new ShaderPass(FXAAShader);
      this.effectFXAA.uniforms["resolution"].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
      this.composer.addPass(this.effectFXAA);
    },
    //鼠标上去初始化发光通道
    initMouseOverRenderPass() {
      this.warnOutlinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.scene,
        this.camera
      );
      this.warnOutlinePass.renderToScreen = true;
      this.warnOutlinePass.edgeStrength = 3; //粗
      this.warnOutlinePass.edgeGlow = 3; //发光
      this.warnOutlinePass.edgeThickness = 3; //光晕粗
      this.warnOutlinePass.pulsePeriod = 3; //闪烁
      this.warnOutlinePass.usePatternTexture = false; //是否使用贴图
      this.warnOutlinePass.visibleEdgeColor.set("red"); // 设置显示的颜色
      this.warnOutlinePass.hiddenEdgeColor.set("red"); // 设置隐藏的颜色
      this.composer.addPass(this.warnOutlinePass);
      this.effectFXAA = new ShaderPass(FXAAShader);
      this.effectFXAA.uniforms["resolution"].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
      this.composer.addPass(this.effectFXAA);
    },
    //点击右侧按钮，定位到模型上，模型添加通道
    clickRenderPass() {
      this.clickLinePass = new OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.scene,
        this.camera
      );
      this.clickLinePass.renderToScreen = true;
      this.clickLinePass.edgeStrength = 3; //粗
      this.clickLinePass.edgeGlow = 2; //发光
      this.clickLinePass.edgeThickness = 2; //光晕粗
      this.clickLinePass.pulsePeriod = 2; //闪烁
      this.clickLinePass.usePatternTexture = false; //是否使用贴图
      this.clickLinePass.visibleEdgeColor.set("#FFE242"); // 设置显示的颜色
      this.clickLinePass.hiddenEdgeColor.set("#FFE242"); // 设置隐藏的颜色
      this.composer.addPass(this.clickLinePass);
      this.effectFXAA = new ShaderPass(FXAAShader);
      this.effectFXAA.uniforms["resolution"].value.set(
        1 / window.innerWidth,
        1 / window.innerHeight
      );
      this.composer.addPass(this.effectFXAA);
    },

    //初始化
    initRenderer() {
      this.renderer = renderer;
      this.container = document.getElementById("model");
      this.container.appendChild(this.renderer.domElement);
    },
    initCSS2DRender() {
      this.CSS2DRenderer = new CSS2DRenderer();
      this.CSS2DRenderer.setSize(window.innerWidth, 1080);
      this.CSS2DRenderer.domElement.style.position = "absolute";
      this.CSS2DRenderer.domElement.style.top = 0;

      this.CSS2DRenderer.domElement.style.pointerEvents = "none";
      this.container.appendChild(this.CSS2DRenderer.domElement);
    },
    initCSS3DRender() {
      this.CSS3DRender = new CSS3DRenderer();
      this.CSS3DRender.setSize(this.windowWidth, this.windowHeight);
      this.CSS3DRender.domElement.style.position = "absolute";
      this.CSS3DRender.domElement.style.top = 0;
      //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
      this.CSS3DRender.domElement.style.pointerEvents = "none";
      this.container.appendChild(this.CSS3DRender.domElement);
    },
    animate() {
      this.renderer.render(this.scene, this.camera);
      this.CSS3DRender.render(this.scene, this.camera);
      this.CSS2DRenderer.render(this.scene, this.camera);
      this.requestId = requestAnimationFrame(this.animate);
      this.controls.update();
      this.composer.render();
      TWEEN.update();
      // console.log(
      //   this.camera.position
      // )
      this.updateMarker();
    },
    // 加载glb格式树的模型ss
    loadGlbModel() {
      var that = this;
      var manager = new THREE.LoadingManager();
      manager.addHandler(/\.tga$/i, new TGALoader());
      // var loader = new GLTFLoader(manager); //创建一个GLTF加载器
      var loader = new GLTFLoader(); //创建一个GLTF加载器
      loader.load("/models/liuan/luan_shu.glb", function(gltf) {
        that.scene.add(gltf.scene);
      });
    },
    //加载建筑
    loadFbxBuild() {
      var that = this;
      var loader = new FBXLoader(); //创建一个GLTF加载器
      const path = "/models/liuan/liuan-changj.fbx"; //写在类的外面
      loader.load(path, this.onLoad, this.onProgress);
    },
    onLoad(build) {
      var that = this;
      console.log(build);
      that.warnSelectedObjects = [];
      // build.scale.set(0.01, 0.01, 0.01);
      build.traverse(function(child) {
        if (child.isMesh) {
          that.pointList.forEach((point) => {
            if (point.isWarn == 1 && child.name == point.modelId) {
              that.warnSelectedObjects.push(child);
              // child.material[0].color.set(0x00ffff)
            }
          });
          that.granaryArr.push(child);
        }
      });
      that.pointList.forEach((point) => {
        that.positionArry.forEach((position) => {
          if (point.modelId == position.name) {
            // const sprite = that.createInfoLabel3DSprite(point);
            // sprite.position.copy(position.labelPosion);
            // that.scene.add(sprite);
            // that.CSS3DObjects.push(sprite);
            var css2Dinfo = that.create2DNameObject(point);
            position.labelPosion.y += 3;
            css2Dinfo.position.copy(position.labelPosion);
            that.scene.add(css2Dinfo);
            that.CSS2DObjects.push(css2Dinfo);
          }
        });
      });
      console.log(that.warnSelectedObjects);
      that.warnOutlinePass.selectedObjects = that.warnSelectedObjects;
      // 加载器解析文件
      that.scene.add(build);
    },
    /**创建精灵 */
    createSprite(data) {
      var texture = new THREE.Texture(this.createCanvas(data));
      texture.needsUpdate = true;

      var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
      });
      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(1.5, 1, 1);
      return sprite;
    },
    //进度条
    onProgress(xhr) {
      // 后台打印查看模型文件加载进度
      // console.log('加载完成的百分比' + (xhr.loaded / xhr.total * 100) + '%');
      //把加载进度数据取整然后传递给Vue组件：进度条
      this.loadedData = parseInt((xhr.loaded / xhr.total) * 100);
      console.log(this.loadedData);
      if (Number(this.loadedData) == 100) {
        this.loadGlbModel();
      }
    },

    createInfoLabel3DSprite2(obj) {
      var that = this;
      var div = document.createElement("div");
      div.classList.add("infolabel");
      var html = `<div id="messageTag">
                    <div class="point-item-content">
                      <div class="poing-mc flex flex-align-center flex-justcontent-center">${obj.facilityName}</div>
                </div>
              </div>`;
      div.innerHTML = html;
      //div.className = "label";
      div.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
      const infoLabel = new CSS3DSprite(div);
      infoLabel.scale.set(0.02, 0.02, 0.02); //根据相机渲染范围控制HTML 3D标签尺寸
      return infoLabel;
    },
    createInfoLabel3DSprite(obj) {
      var that = this;
      var div = document.createElement("div");
      div.classList.add("infolabel");
      var html = `<div id="messageTag">
                    <div class="point-item-content">
                      <div class="poing-mc flex flex-align-center flex-justcontent-center">${
                        obj.facilityName
                      }</div>
                      <div class="item-list flex flex-v scoroll">
                      ${obj.itemDataList
                        .map((item) => {
                          return `<div class="flex flex-r point-item"><img src="${
                            this.arrowIngUrl
                          }" class="arrow" />
                          <span>${item.itemName}：<span>${
                            item.dataValue ? `${item.dataValue}` : "-"
                          }</span><span>${item.itemUnit}</span></span>
                        </div>`;
                        })
                        .join("")}  
                      </div>
                </div>
              </div>`;
      div.innerHTML = html;
      //div.className = "label";
      div.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
      const infoLabel = new CSS3DSprite(div);
      infoLabel.scale.set(0.02, 0.02, 0.02); //根据相机渲染范围控制HTML 3D标签尺寸
      return infoLabel;
    }, //创建css2dobject
    create2DObject() {
      var that = this;
      var dom = document.getElementById("messageTag");
      //dom元素包装为CSS2模型对象CSS2DObject
      var info = new CSS2DObject(dom);
      dom.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
      that.infodetail = info;
      that.scene.add(that.infodetail);
      that.infodetailArry.push(info);
      console.log(that.scene);
      return info; //返回CSS2模型标签
    },
    create2DNameObject(obj) {
      var that = this;
      var div = document.createElement("div");
      div.classList.add("infolabel");
      var html = `<div id="nameTag">
                    <div class="point-item-content">
                      <div class="poing-mc flex flex-align-center flex-justcontent-center">${obj.facilityName}</div>
                </div>
              </div>`;
      div.innerHTML = html;
      //div.className = "label";
      //div.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
      const infoLabel = new CSS2DObject(div);
      //infoLabel.scale.set(0.03, 0.03, 0.03); //根据相机渲染范围控制HTML 3D标签尺寸
      that.scene.add(infoLabel);
      return infoLabel;
    },
    //双击点击位置
    dblChoose(event) {
      var that = this;
      that.getClickPoint((intersects) => {
        if (intersects.length > 0) {
          console.log(intersects[0]);
          that.chooseMesh = intersects[0].object;

          // that.chooseMesh.material.color.set(0x00ffff); //选中改变颜色，这样材质颜色贴图.map和color颜色会相乘
          console.log(that.chooseMesh);

          /**
           * ------------------------------------------------
           */
          this.positionArry.forEach((item) => {
            if (item.name == that.chooseMesh.name) {
              let tp = item.camera;
              // let tl = new THREE.Vector3(10.392989066683946, -2.050080860395239, 3.563096923498191);
              let tl = item.tl;
              this.animateCamera(tp, tl);
            }
          });
        } else {
          that.chooseMesh = null;
          //that.infodetail.element.style.visibility = "hidden"; //显示标签
        }
      });
    },
    onceChoose(event) {
      var that = this;
      that.getClickPoint((intersects) => {
        if (intersects.length > 0) {
          that.chooseMesh = intersects[0].object;
          console.log(this.camera.position);
          console.log(intersects[0]);
          var css2Dinfo;
          that.pointList.forEach((point) => {
            if (that.chooseMesh.name.indexOf(point.modelId) >= 0) {
              //that.pointObj = point
              var data = {
                facilityId: point.facilityId,
              };
              that.getPointShow(data);
              // css2Dinfo = that.create2DObject()
              // that.infodetail.element.style.visibility = "visible"; //显示标签
              // intersects[0].point.x -= 6
              // intersects[0].point.y -= 2.4
              // css2Dinfo.position.copy(intersects[0].point);
            }
          });
        } else {
          that.chooseMesh = null;
          // that.infodetail.element.style.visibility = "hidden"; //显示标签
        }
      });
    },
    getPointShow(data) {
      var that = this;
      screen.clickPointShow(data).then((res) => {
        that.pointObj = res.data;
        that.showPointItme =
          that.pointObj.itemDataList && that.pointObj.itemDataList.length > 0
            ? true
            : false;

        that.showWarn =
          that.pointObj.warnInfoList && that.pointObj.warnInfoList.length > 0
            ? true
            : false;
      });
    },
    //鼠标经过事件
    mouseOverModel(event) {
      var that = this;
      event.preventDefault();
      if (event.isPrimary === false) return;
      that.getClickPoint((intersects) => {
        if (intersects.length > 0) {
          that.chooseMesh = intersects[0].object;
          that.addSelectedObject(that.chooseMesh);
          that.outlinePass.selectedObjects = that.selectedObjects;
        } else {
          that.outlinePass.selectedObjects = [];
          that.chooseMesh = null;
        }
      });
    },
    addSelectedObject(object) {
      this.selectedObjects = [];
      this.selectedObjects.push(object);
    },
    getClickPoint(callback) {
      var that = this;
      if (that.chooseMesh) {
        //that.chooseMesh.material.color.set(0xafacac); // 把上次选中的mesh设置为原来的颜色
      }
      var Sx = event.clientX; //鼠标单击位置横坐标
      var Sy = event.clientY; //鼠标单击位置纵坐标
      //2D坐标转换3D坐标
      var x = (Sx / window.innerWidth) * 2 - 1; //WebGL标准设备横坐标
      var y = -(Sy / window.innerHeight) * 2 + 1; //WebGL标准设备纵坐标
      var raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), that.camera);
      var intersects = raycaster.intersectObjects(that.granaryArr);
      callback && callback(intersects);
    },
    //点击右侧工艺段
    clickRPoint(item, index, event) {
      this.currentIndex = index;
      this.clickSelectedObjects = [];
      this.granaryArr.forEach((mesh) => {
        if (mesh.name == item.modelId) {
          this.clickSelectedObjects.push(mesh);
          this.clickLinePass.selectedObjects = this.clickSelectedObjects;
        }
      });
      this.facilityPositionArry.forEach((position) => {
        if (item.modelId == position.name) {
          let tp = position.camera;
          let tl = position.tl;
          this.animateCamera(tp, tl);
        }
      });
      var data = {
        facilityId: item.facilityId,
      };
      this.getPointShow(data);
    },
    //相机的平滑
    animateCamera(current2, target2) {
      var that = this;
      var current1 = that.camera.position;
      var target1 = that.controls.target;
      console.log(target1);
      ////初始位置
      let positionVar = {
        x1: current1.x,
        y1: current1.y,
        z1: current1.z,
        x2: target1.x,
        y2: target1.y,
        z2: target1.z,
      };
      //关闭控制器
      that.controls.enabled = false;
      that.tween = new TWEEN.Tween(positionVar);
      that.tween.to(
        {
          x1: current2.x,
          y1: current2.y,
          z1: current2.z,
          x2: target2.x,
          y2: target2.y,
          z2: target2.z,
        },
        4000
      );

      that.tween.onUpdate(function() {
        that.camera.position.x = positionVar.x1;
        that.camera.position.y = positionVar.y1;
        that.camera.position.z = positionVar.z1;
        that.controls.target.x = positionVar.x2;
        that.controls.target.y = positionVar.y2;
        that.controls.target.z = positionVar.z2;
        that.controls.update();
      });

      that.tween.onComplete(function() {
        ///开启控制器
        that.controls.enabled = true;
      });

      that.tween.easing(TWEEN.Easing.Cubic.InOut);
      that.tween.start();
    },
    //鼠标右键功能
    // mouseRightClick(event) {
    //   // 此处可以使用判断条件控制是否需要阻止右键
    //   event.preventDefault();
    //   var tp = new THREE.Vector3(1.75, 23.6, -41.4)
    //   var tl = new THREE.Vector3(0, 0, 0);
    //   this.animateCamera(tp, tl);
    //   console.log(event);
    // },
    resetCamera() {
      var tp = new THREE.Vector3(1.75, 23.6, -41.4);
      var tl = new THREE.Vector3(0, 0, 0);
      this.animateCamera(tp, tl);
    },
    updateMarker() {
      this.CSS2DObjects.forEach((label) => {
        if (
          label.position.distanceTo(this.camera.position) < 46 &&
          label.position.distanceTo(this.camera.position) > 30
        ) {
          label.visible = true;
        } else {
          label.visible = false;
        }
      });
      // this.infodetailArry.forEach(infodetail => {
      //   console.log(infodetail.position.distanceTo(this.camera.position))
      //   if (infodetail.position.distanceTo(this.camera.position) < 55 && infodetail.position.distanceTo(this.camera.position) > 30) {
      //     infodetail.visible = true;
      //   } else {
      //     infodetail.visible = false;
      //   }
      // })
      // this.CSS3DObjects.forEach(sprite => {
      //   if (sprite.position.distanceTo(this.camera.position) < 46 && sprite.position.distanceTo(this.camera.position) > 30) {
      //     sprite.visible = false;
      //   } else {
      //     sprite.visible = true;
      //   }
      // });
    },
    onResize() {
      // 监听窗口大小改变
      this.camera.aspect = window.innerWidth / window.innerHeight; //宽高可根据实际项目要求更改 如果是窗口高度改为innerHeight
      this.CSS2DRenderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight); //宽高可根据实际项目要求更改 如果是窗口高度改为innerHeight
    },
  },
};
export default threeModel;
