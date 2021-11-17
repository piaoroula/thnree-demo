import BaseClass from './baseClass';
import Model from './model';
import Scene from './scene';
import { checkArray, generateUUID } from '../base';
import smoothPolyline from '../custom/algorithms/SmoothPolyline.js'
import { RouteOption } from '../interfaces';
import Marker from './marker';
import { routeMark } from '../resources';
import * as THREE from 'three/build/three.module.js';
import LinearAlgebra from "../custom/utils/LinearAlgebra";

export default class Route extends BaseClass {
    private route;
    private operationCounts = 0;
    private marker = new Marker(this.scene);
    private model = new Model(this.scene);
    private time = new THREE.Clock();

    constructor(scene: Scene) {
        super(scene);
        const update = () => {
            if (this.route?.isMoving) {
                this.moving(this.time.getDelta());
            }
            requestAnimationFrame(update);
        };
        update();
    }

    /**
     * 创建一条带起点、终点、巡视点的路径
     * @param options
     */
    renderRoute(options: RouteOption) {
        if (this.route) this.destroy();
        options = this.checkOptions(options);
        let { id, positions, startIcon, endIcon, movingObject, speed = 5, scale = 0.45 } = options;
        const points = [];
        let length;
        if (Array.isArray(positions) && positions.length >= 2) {
            positions.forEach(p => {
                if (checkArray(p, 2, 'number')) {
                    points.push(new THREE.Vector3(p[0], p[2] || 0, p[1]));
                } else {
                    console.error('invalid positions');
                    return;
                }
            });
        } else {
            console.error('invalid positions');
            return;
        }
        let _points = smoothPolyline(points)

        // TODO 用带纹理的线替换以下的代码
        const geometry = new THREE.BufferGeometry().setFromPoints(_points);
        const material = new THREE.LineBasicMaterial({ color: new THREE.Color(0xff0000), linewidth: 2 })
        const mesh = new THREE.Line(geometry, material);
        mesh.computeLineDistances();

        length = [...mesh.geometry.attributes.lineDistance.array]
        speed = speed * 0.01 * length[length.length - 1];

        this.addObj2Scene(mesh, options);
        this.cacheObject(id, options);

        /**
         * 为起点、终点、车辆示意点绑定指定的模型或图标
         */
        let startMarkerId, endMarkerId;
        if (startIcon) startMarkerId = this.marker.renderOverlayMarker({
            image: startIcon,
            scale: 0.45,
            position: [points[0].x, points[0].z, points[0].y],
            title: 'start',
            viewDistance: [0, 50000],
        })
        else startMarkerId = this.marker.renderOverlayMarker({
            image: routeMark.startIcon,
            scale: 0.45,
            position: [points[0].x, points[0].z, points[0].y],
            title: 'start',
            viewDistance: [0, 50000],
        })
        if (endIcon) endMarkerId = this.marker.renderOverlayMarker({
            image: endIcon,
            scale: 0.45,
            position: [points[positions.length - 1].x, points[positions.length - 1].z, points[positions.length - 1].y],
            title: 'end',
            viewDistance: [0, 50000],

        })
        else endMarkerId = this.marker.renderOverlayMarker({
            image: routeMark.endIcon,
            scale: scale,
            position: [points[positions.length - 1].x, points[positions.length - 1].z, points[positions.length - 1].y],
            title: 'end',
            viewDistance: [0, 50000],
        })

        if (!movingObject) {
            initMovingMark();
        } else {
            let _id = movingObject.id
            let sid = movingObject.id = generateUUID();
            this.model.renderModel(movingObject, () => {
                let movingObjectGroup = new THREE.Group();
                movingObjectGroup.add(this.get3Object(sid));
                this.addObj2Scene(movingObjectGroup, { id: _id });
                this.route = {
                    id: id,
                    points: _points,
                    startIcon: startMarkerId,
                    endIcon: endMarkerId,
                    movingObject: movingObjectGroup,
                    speed: speed,
                    length: length,
                    journey: 0,
                    count: 0,
                    isMoving: false,
                }
                this.moving();
            })
            return id;
        }

        function initMovingMark() {
            movingObject = {
                isMark: true,
                image: routeMark.movingObject,
                scale: scale,
                position: [points[0].x, points[0].z, points[0].y],
                title: '巡视点',
                viewDistance: [0, 50000],
            }
        }

        this.route = {
            id: id,
            points: _points,
            startIcon: startMarkerId,
            endIcon: endMarkerId,
            movingObject: movingObject,
            speed: speed,
            length: length,
            journey: 0,
            count: 0,
            isMoving: false,
        }
        return id;
    }

    private moving(time = 0) {
        const movingLength = this.route.speed * time;
        this.route.journey += movingLength;
        for (let i = this.route.count; i <= this.route.points.length; i++) {
            if (this.route.length[i] > this.route.journey) {
                this.route.count = i;
                const t = LinearAlgebra.getTargetPoint(this.route.points[i - 1], this.route.points[i], this.route.journey - this.route.length[i - 1])
                this.route.movingObject.position.set(t.x, t.y, t.z);
                this.route.movingObject.lookAt(this.route.points[i]);
                return;
            }
        }
    }

    /**
     * 开始路径巡视运动
     */
    start() {
        if (!this.route) {
            if (this.operationCounts < 200) setTimeout(() => {
                this.start();
            }, 100);
            else console.error('model loading timeout')
            this.operationCounts++;
        } else {
            this.time.getDelta();
            this.route.isMoving = true;
            if (this.route.movingObject.isMark) {
                this.route.movingObject = this.get3Object(this.marker.renderOverlayMarker(this.route.movingObject));
            }
            this.route.journey = 0;
            this.route.count = 0;
            this.route.movingObject.x = this.route.points[0].x;
            this.route.movingObject.y = this.route.points[0].y;
            this.route.movingObject.z = this.route.points[0].z;
            this.moving();
        }
    };

    /**
     * 重置路径巡视运动
     */
    resume() {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        } else if (!this.route.movingObject.position) {
            console.error('start() first');
            return null;
        } else {
            this.route.isMoving = false;
            this.route.journey = 0;
            this.route.count = 0;
            this.route.movingObject.x = this.route.points[0].x;
            this.route.movingObject.y = this.route.points[0].y;
            this.route.movingObject.z = this.route.points[0].z;
            this.moving();
        }
    };

    /**
     * 暂停路径巡视运动
     */
    pause() {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        } else if (!this.route.movingObject.position) {
            console.error('start() first');
            return null;
        } else {
            this.route.isMoving = false;
        }
    };

    /**
     * 继续路径巡视运动
     */
    continue() {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        } else {
            this.time.getDelta();
            this.route.isMoving = true;
        }
    };

    /**
     * 结束路径巡视运动
     */
    end() {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        }
        this.route.isMoving = false;
        this.setPercent(99.99999);
    };

    /**
     * 设置巡视速度
     */
    setSpeed(speed) {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        } else {
            this.route.speed = speed * 0.01 * this.route.length[this.route.length.length - 1];
        }
    }

    /**
     * 设置巡视点以巡视百分比
     */
    setPercent(percent) {
        if (!this.route) {
            console.error('renderRoute() first');
            return null;
        } else {
            this.route.journey = this.route.length[this.route.length.length - 1] * percent * 0.01;
            for (let i = 0; i < this.route.length.length; i++) {
                if (this.route.length[i] > this.route.journey) {
                    this.route.count = i;
                    break;
                }
            }
            this.time.getDelta();
            this.moving();
        }
    }

    /**
     * 删除巡视路径
     */
    destroy() {
        if (this.route) {
            this.scene.getGroup().remove(this.get3Object(this.route.startIcon));
            this.scene.getGroup().remove(this.get3Object(this.route.endIcon));
            this.scene.getGroup().remove(this.route.movingObject);
            this.route.movingObject.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            let dm = this.get3Object(this.route.id)
            dm.traverse((child) => {
                if (child.isMesh || child.isLine) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
            this.scene.getGroup().remove(dm);
            this.route = null;
        }
    };
}