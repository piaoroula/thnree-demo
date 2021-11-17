import { SceneOptions, CameraOptions, TargetOptions, MaterialOptions } from '../interfaces';
import * as THREE from 'three/build/three.module.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { MapControls } from '../custom/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { CameraAttachedControls } from '../custom/controls/CameraAttachedControls.js';
import LinearAlgebra from '../custom/utils/LinearAlgebra';
import Stats from 'stats.js/src/Stats';
import { skyImages } from '../resources';
import { checkArray, generateUUID, getDefaultOptions } from '../base';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { WEBGL } from 'three/examples/jsm/WebGL';
import * as TWEEN from '@tweenjs/tween.js';
import FlowingMaterial from '../custom/materials/FlowingMaterial';

export default class Scene {
    private readonly scene = null;

    private readonly camera = null;

    private readonly renderer = null;

    private readonly composer = null;

    private readonly renderPass = null;

    private currentPickup = null;

    private readonly skinningOutlinePass = null;

    private readonly morphTargetsOutlinePass = null;

    private readonly css2DRenderer = null;

    private readonly css3DRenderer = null;

    private readonly container = null;

    private containerWidth = 0;

    private containerHeight = 0;

    private readonly firstPersonClock = new THREE.Clock();

    private readonly frame = new THREE.Clock().getDelta();

    private readonly mouse = new THREE.Vector2();

    private readonly raycaster = new THREE.Raycaster();

    private readonly stats = null;

    private readonly group = new THREE.Group();

    private readonly objects = {};

    private readonly onclick = (obj: any) => { };

    private readonly loadingObjects = {};

    private loadingDom = null;

    private secondCamera = {
        container: null,
        camera: null,
        renderer: null,
        containerWidth: 0,
        containerHeight: 0,
        attachedId: null,
        v3: new THREE.Vector3(),
        distance: 1,
        offsetHeight: 2,
    };

    private attached = {
        id: null,
        prePosition: null,
        preRotation: null,
    };

    private controls = null;

    //第一人称开关
    private roamSwitch = null;

    //第一人称控制器开启状态
    private firstPersonMode = false;

    //第一人称控制器
    private firstPersonControls = null;

    //第一人称对象
    private firstPerson = null;

    //第一人称视角方向
    private firstPersonTarget = new THREE.Vector3(0, 0, -1);

    //键盘监听事件
    private keyup = null;
    private keydown = null;
    private fpcFrameCount = 0;

    private readonly axesHelper = null;

    private rotationStatus = {
        rotating: 0,
        target: [],
        pathT: null,
        pathC: null,
        pathIndex: 0,
        pathLength: 60,
    };

    constructor(options: SceneOptions) {
        options = getDefaultOptions(options);
        let {
            container,
            background,
            grid,
            fog,
            roam,
            stats = false,
            onclick,
            cameraPosition = [50, 50, 50],
            cameraTarget = [0, 0, 0],
            castShadow = false,
            axesHelper,
            antialias = false,
            alpha = false,
        } = options;

        this.container = document.getElementById(container);
        if (!this.container) {
            console.error(`container whose id is ${container} w is not found`);
            return;
        }
        this.container.style.overflow = 'hidden';
        this.containerWidth = this.container.clientWidth;
        this.containerHeight = this.container.clientHeight;
        if (!WEBGL.isWebGLAvailable()) {
            this.container.appendChild(WEBGL.getWebGLErrorMessage());
            return;
        }
        this.scene = new THREE.Scene();
        this.scene.add(this.group);

        if (typeof onclick === 'function') {
            this.onclick = onclick;
        }

        if (axesHelper) {
            this.axesHelper = this.scene.add(new THREE.AxesHelper(5000));
        }

        this.setBackground(background);
        this.addFog(fog);
        this.addGridHelper(grid);

        this.camera = new THREE.PerspectiveCamera(
            40,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100000
        );
        if (!checkArray(cameraPosition, 2, 'number')) {
            cameraPosition = [50, 50, 50];
            console.warn('invalid cameraPosition');
        }
        if (!checkArray(cameraTarget, 2, 'number')) {
            cameraTarget = [0, 0, 0];
            console.warn('invalid cameraTarget');
        }
        this.camera.position.set(cameraPosition[0], cameraPosition[2] || 50, cameraPosition[1]);

        this.renderer = new THREE.WebGLRenderer({ antialias: antialias, alpha: alpha });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.localClippingEnabled = true;
        this.renderer.shadowMap.enabled = castShadow;
        this.container.appendChild(this.renderer.domElement);

        this.composer = new EffectComposer(this.renderer);
        this.composer.setPixelRatio(window.devicePixelRatio);
        this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);

        this.skinningOutlinePass = new OutlinePass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            this.scene,
            this.camera
        );
        this.composer.addPass(this.skinningOutlinePass);
        this.skinningOutlinePass.depthMaterial.skinning = true;
        this.skinningOutlinePass.prepareMaskMaterial.skinning = true;

        this.morphTargetsOutlinePass = new OutlinePass(
            new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
            this.scene,
            this.camera
        );
        this.composer.addPass(this.morphTargetsOutlinePass);
        this.morphTargetsOutlinePass.depthMaterial.morphTargets = true;
        this.morphTargetsOutlinePass.prepareMaskMaterial.morphTargets = true;
        this.morphTargetsOutlinePass.edgeGlow = 1;
        this.morphTargetsOutlinePass.visibleEdgeColor = new THREE.Color('#e28400');
        this.morphTargetsOutlinePass.edgeThickness = 1.0;

        this.css2DRenderer = new CSS2DRenderer();
        this.css3DRenderer = new CSS3DRenderer();
        this.resizeCss2DRenderer();
        this.container.appendChild(this.css2DRenderer.domElement);
        this.container.appendChild(this.css3DRenderer.domElement);

        this.createMapControls();
        this.controls.target.set(cameraTarget[0], cameraTarget[2], cameraTarget[1]);
        this.controls.update();
        //创建第一人称控制器
        this.createFirstPersonControls();

        this.addRoamSwitch(roam);

        if (stats) {
            this.stats = new Stats();
            this.container.appendChild(this.stats.dom);
        }

        const update = () => {
            if (this.stats) {
                this.stats.update();
            }
            if (this.roamSwitch) {
                this.updateRoamSwitch();
            }

            if (this.firstPersonMode) {
                if (this.firstPersonControls.isLocked) {
                    this.lockPerspective();
                    this.fpcFrameCount = 0;
                } else {
                    if (this.fpcFrameCount > 15) {
                        this.closeFirstPersonMode();
                    }
                    this.fpcFrameCount++;
                }
            }

            this.onresize();
            this.showLoading();
            this.updateCamera();
            TWEEN.update();
            this.rotate();
            requestAnimationFrame(update);
        };
        update();
        this.clickEvent();
        this.mousemoveEvent();
        this.dblclickEvent();
    }

    private createMapControls() {
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new MapControls(this.camera, this.renderer.domElement);
    }

    private createCameraAttachedControls() {
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new CameraAttachedControls(this.camera, this.renderer.domElement, {
            right: () => {
                this.setCameraAttachedTarget(this.attached.id, false);
            },
        });
    }

    private createSceneRotateControls() {
        if (this.controls) {
            this.controls.dispose();
        }
        this.controls = new CameraAttachedControls(this.camera, this.renderer.domElement, {
            right: this.stopRotate.bind(this),
        });
    }

    private stopRotate() {
        this.rotationStatus = {
            rotating: 0,
            target: [],
            pathT: null,
            pathC: null,
            pathIndex: 0,
            pathLength: 60,
        };
        const position = this.camera.position.clone();
        const target = this.controls.target.clone();
        this.createMapControls();
        this.camera.position.set(position.x, position.y, position.z);
        this.controls.target.set(target.x, target.y, target.z);
        this.controls.update();
    }

    /**
     * 创建第一人称控制器
     */
    private createFirstPersonControls() {
        this.firstPersonControls = new PointerLockControls(this.camera, this.renderer.domElement);
        this.firstPerson = {
            speed: 0,
            height: 0,
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false,
            canJump: false,
            velocity: new THREE.Vector3(),
            direction: new THREE.Vector3(),
        };
        this.keydown = event => {
            switch (event.keyCode) {
                case 38: // up
                case 87: // w
                    this.firstPerson.moveForward = true;
                    break;
                case 37: // left
                case 65: // a
                    this.firstPerson.moveLeft = true;
                    break;
                case 40: // down
                case 83: // s
                    this.firstPerson.moveBackward = true;
                    break;
                case 39: // right
                case 68: // d
                    this.firstPerson.moveRight = true;
                    break;
                case 32: // space
                    if (this.firstPerson.canJump === true) this.firstPerson.velocity.y += 350;
                    this.firstPerson.canJump = false;
                    break;
                case 81: // q
                    this.closeFirstPersonMode();
                    break;
            }
        };
        this.keyup = event => {
            switch (event.keyCode) {
                case 38: // up
                case 87: // w
                    this.firstPerson.moveForward = false;
                    break;
                case 37: // left
                case 65: // a
                    this.firstPerson.moveLeft = false;
                    break;
                case 40: // down
                case 83: // s
                    this.firstPerson.moveBackward = false;
                    break;
                case 39: // right
                case 68: // d
                    this.firstPerson.moveRight = false;
                    break;
            }
        };
    }

    /**
     * 添加第二相机
     * @param options
     */
    addSecondCamera(options: CameraOptions) {
        let { container, cameraPosition, cameraTarget, distance, offsetHeight = 2 } = options;
        this.secondCamera.container = document.getElementById(container);
        if (!this.secondCamera.container) {
            console.error(`container whose id is ${container} is not found`);
            this.secondCamera.container = null;
            return;
        }
        this.secondCamera.containerWidth = this.secondCamera.container.clientWidth;
        this.secondCamera.containerHeight = this.secondCamera.container.clientHeight;
        if (!this.secondCamera.camera) {
            this.secondCamera.camera = new THREE.PerspectiveCamera(
                80,
                this.container.clientWidth / this.container.clientHeight,
                0.1,
                100000
            );
        }
        if (!this.secondCamera.renderer) {
            this.secondCamera.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.secondCamera.renderer.setPixelRatio(window.devicePixelRatio);
        }
        this.secondCamera.renderer.setSize(
            this.secondCamera.container.clientWidth,
            this.secondCamera.container.clientHeight
        );
        this.secondCamera.container.appendChild(this.secondCamera.renderer.domElement);
        if (typeof cameraTarget === 'string' && this.objects.hasOwnProperty(cameraTarget)) {
            this.secondCamera.attachedId = cameraTarget;
            if (typeof distance !== 'number') {
                distance = 1;
            }
            this.secondCamera.distance = distance;
            if (typeof offsetHeight !== 'number') {
                offsetHeight = 2;
            }
            this.secondCamera.offsetHeight = offsetHeight;
        } else {
            if (!checkArray(cameraPosition, 2, 'number')) {
                cameraPosition = [50, 50, 50];
                console.warn('invalid cameraPosition');
            }
            if (!checkArray(cameraTarget, 2, 'number')) {
                cameraTarget = [0, 0, 0];
                console.warn('invalid cameraTarget');
            }
            this.secondCamera.camera.position.set(cameraPosition[0], cameraPosition[2] || 50, cameraPosition[1]);
            this.secondCamera.camera.lookAt(cameraTarget[0], cameraTarget[2] || 0, cameraTarget[1]);
        }
    }

    /**
     * 移除第二相机
     */
    removeSecondCamera() {
        if (this.secondCamera.container) {
            this.secondCamera.renderer.domElement.remove();
            this.secondCamera.container = null;
            this.secondCamera.renderer = null;
            this.secondCamera.camera = null;
            this.secondCamera.containerWidth = 0;
            this.secondCamera.containerHeight = 0;
        }
    }

    /**
     *视角跟随模式
     * @param id 元素id
     * @param attached 是否跟随
     * @param distance 相机距元素的默认距离
     */
    setCameraAttachedTarget(id, attached, distance = 10) {
        if (this.objects.hasOwnProperty(id) && attached) {
            const obj = this.scene.getObjectByName(id);
            if (obj && obj.position) {
                this.createCameraAttachedControls();
                const v3 = new THREE.Vector3();
                obj.getWorldDirection(v3);
                if (typeof distance !== 'number') {
                    distance = 10;
                }
                this.camera.position.x = obj.position.x - v3.x * distance;
                this.camera.position.y = obj.position.y + distance * 0.8;
                this.camera.position.z = obj.position.z - v3.z * distance;
                this.attached.id = id;
            }
        } else {
            const position = this.camera.position.clone();
            const obj = this.scene.getObjectByName(this.attached.id);
            this.createMapControls();
            if (obj && obj.position) {
                this.camera.position.set(position.x, position.y, position.z);
                this.controls.target.set(obj.position.x, obj.position.y, obj.position.z);
                this.controls.update();
            }
            this.attached.id = null;
            this.attached.prePosition = null;
        }
    }

    /**
     * 第一人称漫游开关位置更新
     * @private
     */
    private updateRoamSwitch() {
        let rotationAxis = new THREE.Vector3();
        let st = LinearAlgebra.getDirectionVector(this.camera.position, this.controls.target);
        //st点在面Ax+Cz=0上，带入求得-A/C = z/x 。 设-A/C = k1 C/A = k，得k = -x/z
        let k = -st.x / st.z;
        //直线z = k*x 与 st向量垂直 ，与z = k*x平行得方向向量即为旋转轴
        rotationAxis.x = Math.sqrt(1 / (1 + k * k));
        rotationAxis.z = rotationAxis.x * k;
        let mm;
        if (st.z > 0) {
            mm = LinearAlgebra.rotationByAxis(
                new THREE.Vector3(st.x, st.y, st.z),
                rotationAxis,
                -this.camera.fov * 0.5 * this.roamSwitch.up
            );
        } else {
            mm = LinearAlgebra.rotationByAxis(
                new THREE.Vector3(st.x, st.y, st.z),
                rotationAxis,
                this.camera.fov * 0.5 * this.roamSwitch.up
            );
        }
        mm = LinearAlgebra.getTargetPointFD(this.camera.position, mm, 2);
        let ll = 1.6 * Math.sin(this.camera.fov / 2) * this.camera.aspect * (0.5 - this.roamSwitch.left);
        if (st.z > 0) {
            mm = LinearAlgebra.getTargetPointFD(mm, rotationAxis, ll);
        } else {
            mm = LinearAlgebra.getTargetPointFD(mm, rotationAxis, -ll);
        }
        this.roamSwitch.sphere.position.set(mm.x, mm.y, mm.z);
    }

    /**
     * 开启第一人称漫游模式
     * @param speed 第一人称移动速度 默认20
     * @param height 第一人称高度 默认220
     */
    openFirstPersonMode(speed = 20, height = 220) {
        this.stopRotate();
        if (this.controls) {
            this.controls.enabled = false;
        }
        //设置第一人称视角的相关参数
        this.firstPerson.speed = speed;
        this.firstPerson.height = height;
        this.renderer.domElement.addEventListener('keydown', this.keydown, false);
        this.renderer.domElement.addEventListener('keyup', this.keyup, false);
        this.firstPersonClock.getDelta();
        this.firstPersonControls.lock();
        this.firstPersonMode = true;
    }

    /**
     *关闭第一人称漫游模式
     */
    closeFirstPersonMode() {
        this.firstPerson.moveForward = false;
        this.firstPerson.moveBackward = false;
        this.firstPerson.moveLeft = false;
        this.firstPerson.moveRight = false;
        this.firstPerson.canJump = false;
        this.renderer.domElement.removeEventListener('keydown', this.keydown);
        this.renderer.domElement.removeEventListener('keyup', this.keyup);

        const position = this.camera.position.clone();
        const target = new THREE.Vector3(0, 0, -1);
        target.applyQuaternion(this.camera.quaternion);
        if (this.controls) {
            //TODO 位置改为合适的位置
            this.controls.target.set(target.x * 100 + position.x, target.y * 100 + position.y, target.z * 100 + position.z);
            this.controls.enabled = true;
        } else {
            this.createMapControls();
            this.controls.target.set(target.x * 100 + position.x, target.y * 100 + position.y, target.z * 100 + position.z);
        }
        this.controls.update();

        this.firstPersonMode = false;
        this.fpcFrameCount = 0;
        this.firstPersonControls.unlock();
    }

    /**
     * 第一人称的视角更新
     * @private
     */
    private lockPerspective() {
        const delta = this.firstPersonClock.getDelta();
        this.firstPerson.velocity.x -= this.firstPerson.velocity.x * 3.0 * delta;
        this.firstPerson.velocity.z -= this.firstPerson.velocity.z * 3.0 * delta;
        this.firstPerson.velocity.y -= 9.8 * 100.0 * delta;
        this.firstPerson.direction.z = Number(this.firstPerson.moveForward) - Number(this.firstPerson.moveBackward);
        this.firstPerson.direction.x = Number(this.firstPerson.moveRight) - Number(this.firstPerson.moveLeft);
        this.firstPerson.direction.normalize();
        if (this.firstPerson.moveForward || this.firstPerson.moveBackward)
            this.firstPerson.velocity.z -= this.firstPerson.direction.z * this.firstPerson.speed * 100.0 * delta;
        if (this.firstPerson.moveLeft || this.firstPerson.moveRight)
            this.firstPerson.velocity.x -= this.firstPerson.direction.x * this.firstPerson.speed * 100.0 * delta;
        this.firstPersonControls.moveRight(-this.firstPerson.velocity.x * delta);
        this.firstPersonControls.moveForward(-this.firstPerson.velocity.z * delta);
        this.firstPersonControls.getObject().position.y += this.firstPerson.velocity.y * delta;
        if (this.firstPersonControls.getObject().position.y < this.firstPerson.height) {
            this.firstPerson.velocity.y = 0;
            this.firstPersonControls.getObject().position.y = this.firstPerson.height;
            this.firstPerson.canJump = true;
        }
    }

    private updateCamera() {
        //  更新主要相机，需考虑到鼠标操作后相机位置的变化
        if (this.attached.id) {
            const obj = this.scene.getObjectByName(this.attached.id);
            if (obj && obj.position) {
                if (!this.attached.prePosition) {
                    this.attached.prePosition = obj.position.clone();
                    this.attached.preRotation = obj.rotation.clone();
                }
                const ay = this.attached.preRotation.y - obj.rotation.y;
                const ox = this.camera.position.x - this.attached.prePosition.x;
                const oz = this.camera.position.z - this.attached.prePosition.z;
                const nx = ox * Math.cos(ay) - oz * Math.sin(ay);
                const nz = oz * Math.cos(ay) + ox * Math.sin(ay);
                this.camera.position.x = obj.position.x + nx;
                this.camera.position.y += obj.position.y - this.attached.prePosition.y;
                this.camera.position.z = obj.position.z + nz;
                this.controls.target = obj.position.clone();
                this.controls.update();
                this.attached.prePosition = obj.position.clone();
                this.attached.preRotation = obj.rotation.clone();
            }
        }
        //  更新次要相机，无需考虑鼠标操作，直接使用向量计算
        if (this.secondCamera.container) {
            const obj = this.scene.getObjectByName(this.secondCamera.attachedId);
            if (obj && obj.position) {
                obj.getWorldDirection(this.secondCamera.v3);
                this.secondCamera.camera.position.set(
                    obj.position.x + this.secondCamera.v3.x * this.secondCamera.distance,
                    obj.position.y + this.secondCamera.offsetHeight,
                    obj.position.z + this.secondCamera.v3.z * this.secondCamera.distance
                );
                this.secondCamera.camera.lookAt(
                    obj.position.x + this.secondCamera.v3.x * (this.secondCamera.distance + 100),
                    obj.position.y,
                    obj.position.z + this.secondCamera.v3.z * (this.secondCamera.distance + 100)
                );
            }
        }
    }

    /**
     * 控制相机平滑移动到某个位置
     * @param options
     */
    flyTo(options: TargetOptions) {
        let { target, distance = 50, angle = 55, angle2 = 0, easing } = options;
        let ease;
        if (Array.isArray(target)) {
            if (target.length < 2) {
                console.error('invalid position');
                return;
            } else if ((target.length = 2)) {
                target[2] = 0;
            }
        }
        angle = (Math.PI / 180) * angle;
        angle2 = (Math.PI / 180) * angle2;
        switch (easing) {
            case 'Quadratic':
                ease = TWEEN.Easing.Quadratic.InOut;
                break;
            case 'Quartic':
                ease = TWEEN.Easing.Quartic.InOut;
                break;
            case 'Quintic':
                ease = TWEEN.Easing.Quintic.InOut;
                break;
            case 'Sinusoidal':
                ease = TWEEN.Easing.Sinusoidal.InOut;
                break;
            case 'Exponential':
                ease = TWEEN.Easing.Exponential.InOut;
                break;
            case 'Circular':
                ease = TWEEN.Easing.Circular.InOut;
                break;
            case 'Elastic':
                ease = TWEEN.Easing.Elastic.InOut;
                break;
            case 'Back':
                ease = TWEEN.Easing.Back.InOut;
                break;
            case 'Bounce':
                ease = TWEEN.Easing.Bounce.InOut;
                break;
            case 'Linear':
                ease = TWEEN.Easing.Linear.None;
                break;
            default:
                ease = TWEEN.Easing.Cubic.InOut;
                break;
        }

        const that = this;
        const v3 = new THREE.Vector3();
        this.camera.getWorldDirection(v3);

        const cPosition = { ...that.camera.position };

        const tPosition = {
            x: target[0] + distance * Math.cos(angle) * Math.cos(angle2),
            y: target[2] + distance * Math.sin(angle),
            z: target[1] + distance * Math.cos(angle) * Math.sin(angle2),
            rx: -Math.cos(angle) * Math.cos(angle2),
            ry: -Math.sin(angle),
            rz: -Math.cos(angle) * Math.sin(angle2),
        };

        const tempPosition = {
            x: cPosition.x,
            y:
                Math.max(cPosition.y, tPosition.y) +
                Math.min(
                    Math.sqrt(
                        Math.pow(cPosition.x - tPosition.x, 2) +
                        Math.pow(cPosition.y - tPosition.y, 2) +
                        Math.pow(cPosition.z - tPosition.z, 2)
                    ),
                    100
                ),
            z: cPosition.z,
            rx: v3.x,
            ry: v3.y,
            rz: v3.z,
        };

        const tween1 = new TWEEN.Tween(cPosition);
        that.controls.enabled = false;
        tween1
            .to({ ...tempPosition }, 500)
            .onUpdate(function () {
                that.camera.position.x = cPosition.x;
                that.camera.position.y = cPosition.y;
                that.camera.position.z = cPosition.z;
                that.controls.target.x = cPosition.x + distance * v3.x;
                that.controls.target.y = cPosition.y + distance * v3.y;
                that.controls.target.z = cPosition.z + distance * v3.z;
                that.controls.update();
            })
            .onComplete(function () {
                const tween2 = new TWEEN.Tween(tempPosition);
                tween2
                    .to({ ...tPosition }, 1000)
                    .onUpdate(function () {
                        that.camera.position.x = tempPosition.x;
                        that.camera.position.y = tempPosition.y;
                        that.camera.position.z = tempPosition.z;
                        that.controls.target.x = tempPosition.x + distance * tempPosition.rx;
                        that.controls.target.y = tempPosition.y + distance * tempPosition.ry;
                        that.controls.target.z = tempPosition.z + distance * tempPosition.rz;
                        that.controls.update();
                    })
                    .onComplete(function () {
                        that.controls.enabled = true;
                    })
                    .easing(ease)
                    .start();
            })
            .easing(ease)
            .start();
    }

    private resizeSecondCamera() {
        const rate = this.containerWidth / this.containerHeight;
        let width;
        let height;
        if (this.secondCamera.container.clientWidth / this.secondCamera.container.clientHeight >= rate) {
            width = this.secondCamera.container.clientHeight * rate;
            height = this.secondCamera.container.clientHeight;
        } else {
            width = this.secondCamera.container.clientWidth;
            height = this.secondCamera.container.clientWidth / rate;
        }
        this.secondCamera.renderer.setSize(width, height);
        this.secondCamera.camera.aspect = width / height;
        this.secondCamera.camera.updateProjectionMatrix();
        this.secondCamera.containerWidth = this.secondCamera.container.clientWidth;
        this.secondCamera.containerHeight = this.secondCamera.container.clientHeight;
    }

    private resizeRenderer() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.containerWidth = this.container.clientWidth;
        this.containerHeight = this.container.clientHeight;
    }

    private onresize() {
        if (this.containerWidth !== this.container.clientWidth || this.containerHeight !== this.container.clientHeight) {
            this.resizeRenderer();
            this.resizeCss2DRenderer();
            if (this.secondCamera.container) {
                this.resizeSecondCamera();
            }
        }
        if (this.secondCamera.container) {
            if (
                this.secondCamera.containerWidth !== this.secondCamera.container.clientWidth ||
                this.secondCamera.containerHeight !== this.secondCamera.container.clientHeight
            ) {
                this.resizeSecondCamera();
            }
            this.secondCamera.renderer.render(this.scene, this.secondCamera.camera);
        }
        this.css2DRenderer.render(this.scene, this.camera);
        this.css3DRenderer.render(this.scene, this.camera);
        this.composer.render(this.frame);
    }

    private showLoading() {
        if (Object.keys(this.loadingObjects).length > 0) {
            if (!this.loadingDom) {
                this.loadingDom = document.createElement('div');
                this.loadingDom.className = 'loading';
                this.loadingDom.innerHTML = `
        <div class="line-scale">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div>正在加载数据...</div>`;
                this.container.appendChild(this.loadingDom);
            }
        } else {
            this.loadingDom && this.loadingDom.remove();
            this.loadingDom = null;
        }
    }

    private resizeCss2DRenderer() {
        this.css2DRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.css2DRenderer.domElement.style.position = 'absolute';
        this.css2DRenderer.domElement.style.width = 0;
        this.css2DRenderer.domElement.style.height = 0;
        this.css2DRenderer.domElement.style.top = 0;
        this.css2DRenderer.domElement.style.overflow = 'visible';

        this.css3DRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.css3DRenderer.domElement.style.position = 'absolute';
        this.css3DRenderer.domElement.style.width = 0;
        this.css3DRenderer.domElement.style.height = 0;
        this.css3DRenderer.domElement.style.top = 0;
        this.css3DRenderer.domElement.style.overflow = 'visible';
    }

    /**
     * 添加坐标辅助网格
     * @param grid
     */
    private addGridHelper(grid) {
        if (typeof grid === 'object') {
            const gridHelper = new THREE.GridHelper(
                grid.size || 200,
                grid.divisions || 200,
                grid.colorGrid || 0x011125,
                grid.colorCenterLine || 0xcccccc
            );
            this.scene.add(gridHelper);
        } else if (grid) {
            const gridHelper = new THREE.GridHelper(200, 200);
            this.scene.add(gridHelper);
        }
    }

    /**
     * 添加雾
     * @param fog
     */
    private addFog(fog) {
        if (typeof fog === 'object') {
            this.scene.fog = new THREE.Fog(fog.color || 0x000000, fog.near || 500, fog.far || 10000);
        } else if (fog) {
            this.scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
        }
    }

    /**
     * 添加第一人称控制器开关
     */
    private addRoamSwitch(roam) {
        if (typeof roam === 'object') {
            this.roamSwitch = {
                id: null,
                up: roam.up ? roam.up * 0.02 - 1 : 0.88,
                left: (roam.left ? roam.left : 94.5) * 0.01,
                size: roam.size ? roam.size : 1.5,
                speed: roam.speed ? roam.speed : 20,
                height: roam.height ? roam.height : 220,
                sphere: null,
            };
            const geometry = new THREE.SphereBufferGeometry(this.roamSwitch.size * 0.04, 32, 32);
            const material = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0 });
            const sphere = new THREE.Mesh(geometry, material);
            this.scene.add(sphere);
            this.roamSwitch.id = sphere.id;
            this.roamSwitch.sphere = sphere;
            const roamDiv = document.createElement('button');
            roamDiv.textContent = '点击开启漫游模式';
            roamDiv.style.cssText = `text-align: center; background:rgba(255,255,255,.5); text-decoration: none; display: inline-block; font-size: 14px; margin: 4px 2px; cursor: pointer; pointer-events: none; width: 80px; height: 80px; border-radius: 40px; position: fixed; top: 90%; left: 95%; color: black; border: 2px solid #054e66;`;
            this.container.appendChild(roamDiv);
            this.updateRoamSwitch();
        } else if (roam) {
            const geometry = new THREE.SphereBufferGeometry(1.5 * 0.04, 32, 32);
            const material = new THREE.MeshPhongMaterial({ transparent: true, opacity: 0 });
            const sphere = new THREE.Mesh(geometry, material);
            this.scene.add(sphere);
            this.roamSwitch = {
                id: sphere.id,
                up: 0.88,
                left: 0.945,
                size: 1.5,
                speed: 20,
                height: 220,
                sphere: sphere,
            };
            const roamDiv = document.createElement('button');
            roamDiv.textContent = '点击开启漫游模式';
            roamDiv.style.cssText = `text-align: center; background:rgba(255,255,255,.5); text-decoration: none; display: inline-block; font-size: 14px; margin: 4px 2px; cursor: pointer; pointer-events: none; width: 80px; height: 80px; border-radius: 40px; position: fixed; top: 90%; left: 95%; color: black; border: 2px solid #054e66;`;
            this.container.appendChild(roamDiv);
            this.updateRoamSwitch();
        }
    }

    /**
     * 设置场景背景
     * @param options
     */
    setBackground(options: string | string[]) {
        if (typeof options === 'string') {
            this.scene.background = new THREE.Color(options);
        } else if (checkArray(options, 6, 'string')) {
            this.scene.background = new THREE.CubeTextureLoader().load(options);
        } else {
            this.scene.background = new THREE.CubeTextureLoader().load(skyImages);
        }
    }

    /**
     * 获取Three.Scene
     */
    getScene() {
        return this.scene;
    }

    /**
     * 获取Three.Camera
     */
    getCamera() {
        return this.camera;
    }

    /**
     * 获取Three.WebGLRenderer
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * 获取场景装载容器
     */
    getContainer() {
        return this.container;
    }

    /**
     * 获取场景装载容器
     */
    getGroup() {
        return this.group;
    }

    /**
     * 生成唯一标识
     * @param id
     */
    getId(id) {
        if (id === undefined || this.objects.hasOwnProperty(id)) {
            return generateUUID();
        }
        return id;
    }

    /**
     * 设置唯一标识
     * @param id
     */
    setId(id) {
        if (id !== undefined && !this.objects.hasOwnProperty(id)) {
            this.objects[id] = id;
        }
    }

    /**
     * 移除唯一标识
     * @param id
     */
    removeId(id) {
        delete this.objects[id];
    }

    /**
     * 设置加载
     * @param id
     */
    setLoadingId(id: string) {
        if (id !== undefined) {
            this.loadingObjects[id] = id;
        }
    }

    removeLoadingId(id) {
        delete this.loadingObjects[id];
    }

    setLoading(flag = false) {
        if (flag) {
            this.loadingObjects['userLoading'] = 'userLoading';
        } else {
            delete this.loadingObjects['userLoading'];
        }
    }

    /**
     * 向场景中添加元素
     * @param obj
     * @param options
     */
    addObj2Scene(obj, options) {
        const { id } = options;
        obj.name = id;
        obj.hopeData = options;
        this.group.add(obj);
        this.objects[id] = id;
    }

    private getPercent(sp, ep, percent) {
        return [
            (1 - percent) * sp[0] + percent * ep[0],
            (1 - percent) * sp[1] + percent * ep[1],
            (1 - percent) * sp[2] + percent * ep[2],
        ];
    }

    private rotate() {
        const angle = Math.PI / 180 / 6;
        const {
            rotating,
            target: [x, z, y],
            pathIndex,
            pathT,
            pathC,
        } = this.rotationStatus;
        if (rotating === 1) {
            this.camera.position.set(pathC[pathIndex].x, pathC[pathIndex].y, pathC[pathIndex].z);
            this.controls.target.set(pathT[pathIndex].x, pathT[pathIndex].y, pathT[pathIndex].z);
            this.controls.update();
            this.rotationStatus.pathIndex++;
            if (this.rotationStatus.pathIndex >= this.rotationStatus.pathLength) {
                this.rotationStatus.rotating = 2;
            }
        } else if (rotating === 2) {
            const { x: cx, z: cz } = this.camera.position;
            this.camera.position.x = x + (cx - x) * Math.cos(angle) - (cz - z) * Math.sin(angle);
            this.camera.position.z = z + (cx - x) * Math.sin(angle) + (cz - z) * Math.cos(angle);
            this.controls.target.set(x, y, z);
            this.controls.update();
        }
    }

    private autoRotate(position) {
        this.stopRotate();
        const ot = this.controls.target.clone();
        this.rotationStatus.target = position;
        this.createSceneRotateControls();
        this.controls.target.set(ot.x, ot.y, ot.z);
        this.controls.update();
        const cp = this.camera.position;
        let lx = cp.x - ot.x;
        let lz = cp.z - ot.z;
        const xzLength = Math.sqrt(lx * lx + lz * lz);
        const ce = this.getPercent(
            [position[0], position[1], position[2]],
            [position[0] + lx, position[1] + lz, position[2]],
            50 / xzLength
        );
        this.rotationStatus.pathT = new THREE.CatmullRomCurve3([
            new THREE.Vector3(ot.x, ot.y, ot.z),
            new THREE.Vector3(position[0], position[2], position[1]),
        ]).getPoints(this.rotationStatus.pathLength);
        this.rotationStatus.pathC = new THREE.CatmullRomCurve3([
            new THREE.Vector3(cp.x, cp.y, cp.z),
            new THREE.Vector3(ce[0], ce[2] + 25, ce[1]),
        ]).getPoints(this.rotationStatus.pathLength);
        this.rotationStatus.rotating = 1;
    }

    private findHopData(a) {
        if (a && !a.hopeData) {
            a = a.parent;
            return this.findHopData(a);
        } else return a;
    }

    private dblclickEvent() {
        this.container.addEventListener(
            'dblclick',
            event => {
                if (Object.keys(this.loadingObjects).length > 0) {
                    return;
                }
                if (this.firstPersonMode) {
                    return;
                }
                const a = this.mousePickHopeData(event);
                if (a.position) {
                    this.autoRotate(a.position);
                }
            },
            false
        );
    }

    private clickEvent() {
        this.container.addEventListener(
            'click',
            event => {
                if (this.clickSwitch(event)) {
                    return;
                }
                if (Object.keys(this.loadingObjects).length > 0) {
                    return;
                }
                const a = this.mousePickHopeData(event);
                if (a && a.hopeData && typeof a.hopeData.onclick === 'function') {
                    a.hopeData.onclick(a);
                }
                this.onclick(a);
            },
            false
        );
    }

    /**
     * 鼠标的移动结束事件，固定为扫过的第一个物体高亮显示
     * @param event
     */
    private mousemoveEvent() {
        let time;
        document.addEventListener(
            'mousemove',
            event => {
                if (Object.keys(this.loadingObjects).length > 0) {
                    return;
                }
                if (time) {
                    clearTimeout(time);
                }
                time = setTimeout(() => {
                    event.preventDefault();
                    this.mouse.x = (event.clientX / this.container.clientWidth) * 2 - 1;
                    this.mouse.y = -(event.clientY / this.container.clientHeight) * 2 + 1;
                    this.raycaster.setFromCamera(this.mouse, this.camera);
                    var intersects = this.raycaster.intersectObjects(this.getGroup().children, true);
                    if (intersects.length != 0) {
                        let tempObj = null;
                        for (let i = 0; i < intersects.length; i++) {
                            let o = intersects[i];
                            if (!o.object.material.transparent || o.object.material.opacity === 1) {
                                tempObj = o.object;
                                break;
                            }
                        }
                        const data = this.findHopData(tempObj);
                        if (data && data.hopeData && data.hopeData.hover && !this.firstPersonMode) {
                            if (this.currentPickup == tempObj) return;
                            this.skinningOutlinePass.selectedObjects = [];
                            this.morphTargetsOutlinePass.selectedObjects = [];
                            if (tempObj.type === 'SkinnedMesh') this.skinningOutlinePass.selectedObjects = [tempObj];
                            else this.morphTargetsOutlinePass.selectedObjects = [tempObj];
                            this.currentPickup = tempObj;
                        } else {
                            this.currentPickup = null;
                            this.skinningOutlinePass.selectedObjects = [];
                            this.morphTargetsOutlinePass.selectedObjects = [];
                        }
                    } else {
                        this.currentPickup = null;
                        this.skinningOutlinePass.selectedObjects = [];
                        this.morphTargetsOutlinePass.selectedObjects = [];
                    }
                }, 25);
            },
            false
        );
    }

    /**
     * 当前鼠标指向的第一个模型
     * @param event
     */
    private mousePickHopeData(event) {
        event.preventDefault();
        this.mouse.x = (event.clientX / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.container.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.getGroup().children, true);
        const res = {
            pickId: null,
            pickedObject: null,
            hopeData: null,
            screenPosition: {
                x: event.clientX,
                y: event.clientY,
            },
            position: null,
        };
        if (intersects.length != 0) {
            res.position = [intersects[0].point.x, intersects[0].point.z, intersects[0].point.y];
            let a = intersects[0].object;
            let id = a.name;
            a = this.findHopData(a);
            if (a) {
                res.pickId = id;
                res.pickedObject = a;
                res.hopeData = a.hopeData;
            }
        }
        return res;
    }

    /**
     * 校验是否点击到某个按钮
     * @param event
     * @private
     */
    private clickSwitch(event) {
        event.preventDefault();
        this.mouse.x = (event.clientX / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.container.clientHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length != 0 && intersects[0].object.id === this.roamSwitch?.id) {
            this.openFirstPersonMode(this.roamSwitch.speed, this.roamSwitch.height);
            return true;
        }
        return false;
    }

    /**
     * 通过id设置元素纹理
     * @param options
     */
    setMaterialById(options: MaterialOptions) {
        let { id, speedX, speedY, flowingImage, color = 'white' } = options;
        const obj = this.getScene().getObjectByName(id);
        if (obj) {
            let material;
            if (flowingImage) {
                material = new FlowingMaterial({ speedX, speedY });
                material.lights = true;
                let texture = new THREE.TextureLoader().load(flowingImage);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.x = 4;
                texture.repeat.y = 4;
                material.map = texture;
                material.uniforms.map.value = material.map;
            } else {
                material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide });
            }
            obj.material = material;
        }
    }

    /**
     * 通过id设置模型的剖切
     * 剖切面未初始化时候，默认为过原点垂直与X轴，并指向X轴正方向的面
     * @param options
     */
    cutObjectById(options) {
        let { id, position = [0, 0, 0], rotation = [0, 0, 0] } = options;
        const obj = this.getScene().getObjectByName(id);
        if (obj) {
            position = new THREE.Vector3(position[0], position[2], position[1]);
            let norm = new THREE.Vector3(Math.cos(rotation[2]) * Math.cos(rotation[1]), Math.sin(rotation[2]), Math.cos(rotation[2]) * Math.sin(rotation[1]))
            console.log(norm, position.length());
            const plane = new THREE.Plane(norm, position.length());
            obj.traverse((item) => {
                if (item.type === 'Mesh') {
                    item.material.side = THREE.DoubleSide;
                    if (item.material.clippingPlanes) item.material.clippingPlanes.push(plane);
                    else item.material.clippingPlanes = [plane];
                    item.material.clipShadows = true
                }
            })
        }
    }
}
