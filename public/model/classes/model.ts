import BaseClass from './baseClass';
import * as THREE from 'three/build/three.module.js';
import {ModelOptions} from '../interfaces';
import {checkArray} from '../base';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {DDSLoader} from 'three/examples/jsm/loaders/DDSLoader';
import {TGALoader} from 'three/examples/jsm/loaders/TGALoader';
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import * as TWEEN from '@tweenjs/tween.js';
import Scene from './scene';

export default class Model extends BaseClass {
    private readonly clock = new THREE.Clock();

    private readonly mixers = [];

    constructor(scene: Scene) {
        super(scene);
        const update = () => {
            requestAnimationFrame(update);
            const frame = this.clock.getDelta();
            for (let i = 0; i < this.mixers.length; i++) {
                this.mixers[i].update(frame);
            }
        };
        update();
    }

    private getLoadingManager(id) {
        const loadingManager = new THREE.LoadingManager();
        loadingManager.onStart = () => {
            this.scene.setLoadingId(id);
        };
        loadingManager.onLoad = () => {
            this.scene.removeLoadingId(id);
        };
        loadingManager.onError = () => {
            this.scene.removeLoadingId(id);
        };
        loadingManager.addHandler(/\.dds$/i, new DDSLoader());
        loadingManager.addHandler(/\.tga$/i, new TGALoader());
        return loadingManager;
    }

    /**
     * 加载模型模型（目前仅支持obj、gltf、fbx模型）
     * @param options
     * @param callback 加载完成模型后所执行回调函数
     */
    renderModel(options: ModelOptions, callback?: (id) => void) {
        options = this.checkOptions(options);
        let {id, url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]} = options;
        if (position && !checkArray(position, 2, 'number')) {
            console.error('invalid position');
            return null;
        }
        if (rotation && !checkArray(rotation, 2, 'number')) {
            console.warn('invalid rotation');
            rotation = [0, 0, 0];
        }
        if (scale && !checkArray(scale, 2, 'number')) {
            console.warn('invalid scale');
            scale = [1, 1, 1];
        }
        if (!url) {
            console.error('invalid url');
            return null;
        }

        switch (Model.getLoaderType(url)) {
            case '.obj':
                const loadingManager = this.getLoadingManager(id);
                const objLoader = new OBJLoader(loadingManager);
                new MTLLoader(loadingManager).load(url.substr(0, url.lastIndexOf('.')) + '.mtl', mtls => {
                    objLoader.setMaterials(mtls);
                    objLoader.load(url, obj => {
                        obj.position.set(position[0], position[2] || 0, position[1]);
                        obj.rotation.set(
                            (rotation[0] / 180) * Math.PI,
                            ((rotation[2] || 0) / 180) * Math.PI,
                            (rotation[1] / 180) * Math.PI
                        );
                        obj.scale.set(scale[0], scale[2] || 1, scale[1]);
                        obj.traverse(child => {
                            // @ts-ignore
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        this.addObj2Scene(obj, options);
                        if (typeof callback === 'function') {
                            callback(id);
                        }
                    });
                });
                break;
            case '.fbx':
                new FBXLoader(this.getLoadingManager(id)).load(url, obj => {
                    obj.position.set(position[0], position[2] || 0, position[1]);
                    obj.rotation.set(
                        (rotation[0] / 180) * Math.PI,
                        ((rotation[2] || 0) / 180) * Math.PI,
                        (rotation[1] / 180) * Math.PI
                    );
                    obj.scale.set(scale[0], scale[2] || 1, scale[1]);
                    obj.traverse(child => {
                        // @ts-ignore
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.addObj2Scene(obj, options);
                    if (typeof callback === 'function') {
                        callback(id);
                    }
                });
                break;
            case '.gltf':
            case '.glb':
                new GLTFLoader(this.getLoadingManager(id)).load(url, obj => {
                    // @ts-ignore
                    obj.scene.animations = obj.animations;
                    obj.scene.position.set(position[0], position[2] || 0, position[1]);
                    obj.scene.rotation.set(
                        (rotation[0] / 180) * Math.PI,
                        ((rotation[2] || 0) / 180) * Math.PI,
                        (rotation[1] / 180) * Math.PI
                    );
                    obj.scene.scale.set(scale[0], scale[2] || 1, scale[1]);
                    obj.scene.traverse(child => {
                        // @ts-ignore
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.addObj2Scene(obj.scene, options);
                    if (typeof callback === 'function') {
                        callback(id);
                    }
                });
                break;
            default:
                console.error('type not yet supported');
                return null;
        }
        this.scene.setId(id);
        return id;
    }

    private static getLoaderType(url: string) {
        return url.substring(url.lastIndexOf('.')).toLowerCase();
    }

    /**
     * 通过id执行模型动画
     * @param id 模型ID
     * @param index 模型动画序号
     */
    //TODO
    animationModelById(id: string, index?: number | number[]) {
        if (typeof index === 'undefined') {
            index = 0;
        }
        if (typeof index === 'number') {
            index = [index];
        }
        if (!checkArray(index, 1, 'number')) {
            console.error('invalid index');
            return;
        }
        const model = this.get3Object(id);
        if (model.animations) {
            const mixer = new THREE.AnimationMixer(model);
            this.mixers.push(mixer);
            for (let i = 0; i < index.length; i++) {
                const animation = model.animations[index[i]];
                if (animation) {
                    const action = mixer.clipAction(animation);
                    action.play();
                }
            }
        } else {
            console.error('This model has no animation.');
        }
    }

    /**
     * 线性改变模型位置
     * @param id 模型ID
     * @param target 目标位置
     * @param time 移动所用时间（单位：秒）
     */
    moveToById(id: string, target: number[], time: number = 1.5) {
        const model = this.get3Object(id);
        if (model === undefined) {
            console.error("can't find this model");
            return undefined;
        }
        let mPosition = {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
        };
        const tween = new TWEEN.Tween(mPosition);
        tween
            .to({x: target[0], y: target[2], z: target[1]}, time * 1000)
            .onUpdate(function () {
                model.position.x = mPosition.x;
                model.position.y = mPosition.y;
                model.position.z = mPosition.z;
            })
            .easing(TWEEN.Easing.Linear.None)
            .start();
    }

    /**
     * 根据ID改变模型的透明度
     * @param id 模型ID
     * @param opacity 模型透明度
     */
    setTransparencyById(id: string, opacity?: number) {
        const model = this.get3Object(id);
        if (model === undefined) {
            console.error("can't find this model");
            return undefined;
        }
        if (opacity === 1) {
            model.traverse((e) => {
                if (e.isMesh) {
                    e.material.transparent = false;
                    e.material.opacity = 1;
                }
            });
        } else {
            model.traverse((e) => {
                if (e.isMesh) {
                    e.material.transparent = true;
                    e.material.opacity = opacity;
                }
            });
        }
    }
}
